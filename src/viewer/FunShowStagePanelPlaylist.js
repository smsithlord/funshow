class FunShowStagePanelPlaylist extends FunShowEventEmitter {
    constructor(funShow) {
        super();
        this.funShow = funShow;
        this.loop = this.funShow.slideshow.config.loop;
        this.isCollapsed = funShow.slideshow.config.playlistStartCollapsed;//false; // Track the collapsed state
        this.isShuffle = funShow.slideshow.config.playlistStartShuffle;
        this.isPlaying = false; // Track the play/pause state, default to paused
        this.autoMinimize = funShow.slideshow.config.playlistAutoMinimize;
        this.alwaysShowOnSlideChange = funShow.slideshow.config.playlistAlwaysShowOnSlideChange;
        this.pauseOnInteraction = funShow.slideshow.config.playlistPauseOnInteraction;
        this.slideDuration = funShow.slideshow.config.slideDisplayDuration * 1000;
        this.elaspedSinceLastInteraction = 0;
        this.autoMinimizeDuration = funShow.slideshow.config.playlistAutoMinimizeDuration;

        this.toggleCollapsedState = this.toggleCollapsedState.bind(this);
        this.onPrevClick = this.onPrevClick.bind(this);
        this.toggleShuffleState = this.toggleShuffleState.bind(this);
        this.onPlayClick = this.onPlayClick.bind(this);
        this.onPauseClick = this.onPauseClick.bind(this);
        this.onNextClick = this.onNextClick.bind(this);
        this.userInteraction = this.userInteraction.bind(this);
        
        this.injectCSS();
        this.initEventListeners();
    }

    injectCSS() {
        const css = `
            .funshow-playlist {
                position: absolute;
                top: 20px;
                right: 20px;
                background: var(--primary-bgcolor-highopacity);
                color: var(--primary-color);
                padding: 10px;
                border-radius: 5px;
                width: 300px;
                font-family: var(--primary-font-family);
                font-size: 14px;
                z-index: 10;
                transition: width 0.5s ease;
                overflow-x: hidden;
            }
            .funshow-playlist-content {
                width: 300px;
            }
            .funshow-playlist-minimized {
                width: 24px;
                opacity: 0.5;
            }
            .funshow-playlist-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .funshow-playlist-header-info {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2px;
                font-size: 12px;
                line-height: 75%;
            }
            .funshow-playlist-icon {
                width: 24px;
                height: 24px;
                cursor: pointer;
                fill: var(--primary-color);
            }
            .funshow-playlist-controls {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            .funshow-playlist-controls svg {
                width: 24px;
                height: 24px;
                fill: var(--primary-color);
                cursor: pointer;
            }
            .funshow-playlist-info {
                display: none;
                flex-direction: column;
                align-items: center;
                text-align: center;
                margin-bottom: 10px;
            }
            .funshow-playlist-info span {
                margin-bottom: 5px;
            }
            .funshow-playlist-collapsed-info {
                display: none;
                font-size: 12px;
                text-align: center;
            }
            .funshow-playlist-section-slide-info {
                display: none;
                flex-direction: column;
                margin-bottom: 10px;
                text-align: center;
            }
            .funshow-playlist-slides {
                max-height: 50vh;
                overflow-y: auto;
                pointer-events: none;
            }
            .funshow-playlist-collapsed .funshow-playlist-slides {
                display: none;
            }
            .funshow-playlist-slide {
                padding: 5px;
                cursor: pointer;
                border-radius: 4px;
                padding-left: 20px;
                pointer-events: auto;
            }
            .funshow-playlist-slide.funshow-playlist-slide-active {
                background: var(--primary-bgcolor-highlight-midopacity);
                color: var(--primary-color-highlight);
                font-weight: bold;
            }
            .funshow-playlist-slide.section {
                font-weight: bold;
                padding-left: 5px;
                background: var(--primary-bgcolor-highlight);
                color: var(--primary-color-highlight);
            }
            .funshow-playlist-slide.sticky-section {
                position: -webkit-sticky;
                position: sticky;
                top: 0;
                z-index: 5;
            }
            .funshow-playlist-slides::-webkit-scrollbar {
                width: 10px;
            }
            .funshow-playlist-slides::-webkit-scrollbar-thumb {
                background-color: var(--primary-bgcolor-highlight-midopacity);
                border-radius: 4px;
            }
            .funshow-playlist-slides::-webkit-scrollbar-thumb:hover {
                background-color: var(--primary-color-highopacity);
            }
            .funshow-playlist-slides::-webkit-scrollbar-track {
                background-color: var(--primary-bgcolor-lowopacity);
                border-radius: 4px;
            }
            .funshow-playlist-slides::-webkit-scrollbar-track:hover {
                background-color: var(--primary-bgcolor-midopacity);
            }
            .funshow-playlist-collapsed .funshow-playlist-info {
                display: flex;
            }
            .funshow-playlist-collapsed .funshow-playlist-collapsed-info {
                display: block;
            }
            .funshow-playlist-collapsed .funshow-playlist-section-slide-info {
                display: none;
            }
            .funshow-progress-bar {
                width: 100%;
                height: 4px;
                background: var(--primary-color-lowopacity);
                position: relative;
                margin-bottom: 10px;
                display: none;
            }
            .funshow-playlist-playing .funshow-progress-bar {
                display: block;
            }
            .funshow-progress-bar-fill {
                height: 100%;
                background: var(--primary-color);
                width: 0;
                transition: width linear;
            }
            .funshow-playlist .funshow-play-icon,
            .funshow-playlist .funshow-pause-icon {
                display: none;
            }
            .funshow-playlist-playing .funshow-play-icon {
                display: none;
            }
            .funshow-playlist-playing .funshow-pause-icon {
                display: inline-block;
            }
            .funshow-playlist:not(.funshow-playlist-playing) .funshow-play-icon {
                display: inline-block;
            }
            .funshow-shuffle-icon {
                opacity: 0.5;
            }
            .funshow-shuffle-icon:hover {
                opacity: 0.9;
            }
            .funshow-playlist-shuffle .funshow-shuffle-icon {
                opacity: 1;
            }
            .funshow-playlist-minimized .funshow-playlist-hidden-if-minimized {
                display: none;
            }
            .funshow-playlist-shuffle .funshow-prev-icon {
                display: none;
            }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    initEventListeners() {
        this.funShow.stage.on('change', this.updateActiveItem, this);
        this.funShow.stage.on('slide:arriving', this.onSlideArriving, this);
        this.funShow.on('initialize', this.initHTML, this);
        this.funShow.on('update', this.update, this);
    }

    initHTML() {
        const playlistHTML = `
            <div class="funshow-playlist">
                <div class="funshow-playlist-content">
                    <div class="funshow-playlist-header">
                        <svg class="funshow-playlist-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <rect x="4" y="5" width="16" height="2"/>
                            <rect x="4" y="11" width="16" height="2"/>
                            <rect x="4" y="17" width="16" height="2"/>
                        </svg>
                        <div class="funshow-playlist-header-info funshow-playlist-hidden-if-minimized">
                            <span class="funshow-section-count"></span>
                            <span class="funshow-slide-count"></span>
                        </div>
                        <div class="funshow-playlist-controls funshow-playlist-hidden-if-minimized">
                            <svg class="funshow-shuffle-icon" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm0.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                            </svg>
                            <svg class="funshow-prev-icon" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                            <svg class="funshow-play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            <svg class="funshow-pause-icon" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            <svg class="funshow-next-icon" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                        </div>
                    </div>
                </div>
                <div class="funshow-progress-bar">
                    <div class="funshow-progress-bar-fill"></div>
                </div>
                <div class="funshow-playlist-content">
                    <div class="funshow-playlist-collapsed-info funshow-playlist-hidden-if-minimized">
                        <div class="funshow-section-info"></div>
                        <div class="funshow-slide-info"></div>
                    </div>
                    <div class="funshow-playlist-section-slide-info funshow-playlist-hidden-if-minimized">
                        <div class="funshow-current-section-info"></div>
                        <div class="funshow-current-slide-info"></div>
                    </div>
                    <div class="funshow-playlist-slides funshow-playlist-hidden-if-minimized"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', playlistHTML);

        this.playlist = document.querySelector('.funshow-playlist');

        if( this.isCollapsed ) {
            this.playlist.classList.add('funshow-playlist-collapsed');
        }

        if( this.isShuffle ) {
            this.playlist.classList.add('funshow-playlist-shuffle');
        }

        this.title = this.playlist.querySelector('.funshow-playlist-header');
        this.headerInfo = this.playlist.querySelector('.funshow-playlist-header-info');
        this.sectionCount = this.playlist.querySelector('.funshow-section-count');
        this.slideCount = this.playlist.querySelector('.funshow-slide-count');
        this.infoContainer = this.playlist.querySelector('.funshow-playlist-section-slide-info');
        this.collapsedInfo = this.playlist.querySelector('.funshow-playlist-collapsed-info');
        this.sectionInfo = this.playlist.querySelector('.funshow-section-info');
        this.slideInfo = this.playlist.querySelector('.funshow-slide-info');
        this.currentSectionInfo = this.playlist.querySelector('.funshow-current-section-info');
        this.currentSlideInfo = this.playlist.querySelector('.funshow-current-slide-info');
        this.slidesContainer = this.playlist.querySelector('.funshow-playlist-slides');
        this.progressBar = this.playlist.querySelector('.funshow-progress-bar-fill');

        function disableUserScroll(element) {
            element.addEventListener('wheel', preventDefault, { passive: false });
            element.addEventListener('touchmove', preventDefault, { passive: false });
            element.addEventListener('keydown', preventScrollKeys, { passive: false });

            function preventDefault(event) {
                event.preventDefault();
            }

            function preventScrollKeys(event) {
                const keys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
                if (keys.includes(event.keyCode)) {
                    event.preventDefault();
                }
            }
        }
        disableUserScroll(this.slidesContainer);

        this.updateTitle();

        this.title.querySelector('.funshow-playlist-icon').addEventListener('click', () => {
            this.toggleCollapsedState();
        });

        this.title.querySelector('.funshow-prev-icon').addEventListener('click', () => {
            if( this.isShuffle ) {
                this.funShow.stage.jumpToRandomSlide(true);
            }
            else {
                this.funShow.stage.changeSlide(-1, true);
            }
        });

        this.title.querySelector('.funshow-shuffle-icon').addEventListener('click', () => {
            this.toggleShuffleState();
        });

        this.title.querySelector('.funshow-play-icon').addEventListener('click', () => {
            this.isPlaying = true;
            this.startSlideshow();
            this.resetRemainingSlideTime();
        });

        this.title.querySelector('.funshow-pause-icon').addEventListener('click', () => {
            this.isPlaying = false;
            this.pauseSlideshow();
        });

        this.title.querySelector('.funshow-next-icon').addEventListener('click', () => {
            if( this.isShuffle ) {
                this.funShow.stage.jumpToRandomSlide(true);
            }
            else {
                this.funShow.stage.changeSlide(1, true);
            }
        });

        this.funShow.stage.slides.forEach((slide, index) => {
            const div = document.createElement('div');
            div.textContent = slide.item.title;
            div.dataset.index = index;
            div.classList.add('funshow-playlist-slide');
            if (slide.item.type === 'category') {
                div.classList.add('section');
            }
            div.addEventListener('click', ()=>{
                this.funShow.stage.jumpToIndex(index);
            });
            this.slidesContainer.appendChild(div);
        });




        // listners for user interaction to manage auto-minimizing
        if( this.autoMinimize ) {
            this.playlist.addEventListener('mousemove', this.userInteraction.bind(this));
            this.playlist.addEventListener('click', this.userInteraction.bind(this));
            this.playlist.addEventListener('keydown', this.userInteraction.bind(this));
        }

        /*
        // Reset the timer when focus changes
        document.addEventListener('focus', (event) => {
            if (divElement.contains(event.target)) {
                divElement.classList.remove('funshow-playlist-minimized');
            }
            startInactivityTimer();
        }, true);
        */




        if (this.funShow.slideshow?.config?.autoPlay) {
            this.startSlideshow(); // Start the slideshow initially if autoPlay is true
        }
    }

    destroy() {
        // Remove event listeners
        this.removeEventListeners();

        // Remove DOM elements
        this.removeDOMElements();

        // Clear intervals and timeouts if any
        this.clearTimers();

        // Clear references
        this.funShow = null;
        this.playlist = null;
        this.title = null;
        this.headerInfo = null;
        this.sectionCount = null;
        this.slideCount = null;
        this.infoContainer = null;
        this.collapsedInfo = null;
        this.sectionInfo = null;
        this.slideInfo = null;
        this.currentSectionInfo = null;
        this.currentSlideInfo = null;
        this.slidesContainer = null;
        this.progressBar = null;

        // Emit destroy event
        this.emit('destroy');
    }

    removeEventListeners() {
        if (this.funShow && this.funShow.stage) {
            this.funShow.stage.off('change', this.updateActiveItem, this);
            this.funShow.stage.off('slide:arriving', this.onSlideArriving, this);
        }
        if (this.funShow) {
            this.funShow.off('initialize', this.initHTML, this);
            this.funShow.off('update', this.update, this);
        }

        // Remove playlist-specific event listeners
        if (this.playlist) {
            const playlistIcon = this.playlist.querySelector('.funshow-playlist-icon');
            if (playlistIcon) {
                playlistIcon.removeEventListener('click', this.toggleCollapsedState);
            }

            const prevIcon = this.playlist.querySelector('.funshow-prev-icon');
            if (prevIcon) {
                prevIcon.removeEventListener('click', this.onPrevClick);
            }

            const shuffleIcon = this.playlist.querySelector('.funshow-shuffle-icon');
            if (shuffleIcon) {
                shuffleIcon.removeEventListener('click', this.toggleShuffleState);
            }

            const playIcon = this.playlist.querySelector('.funshow-play-icon');
            if (playIcon) {
                playIcon.removeEventListener('click', this.onPlayClick);
            }

            const pauseIcon = this.playlist.querySelector('.funshow-pause-icon');
            if (pauseIcon) {
                pauseIcon.removeEventListener('click', this.onPauseClick);
            }

            const nextIcon = this.playlist.querySelector('.funshow-next-icon');
            if (nextIcon) {
                nextIcon.removeEventListener('click', this.onNextClick);
            }

            if (this.autoMinimize) {
                this.playlist.removeEventListener('mousemove', this.userInteraction);
                this.playlist.removeEventListener('click', this.userInteraction);
                this.playlist.removeEventListener('keydown', this.userInteraction);
            }
        }
    }

    removeDOMElements() {
        if (this.playlist && this.playlist.parentNode) {
            this.playlist.parentNode.removeChild(this.playlist);
        }
    }

    clearTimers() {
        // Clear any timers if they exist
        // For example, if you have any setInterval or setTimeout, clear them here
    }

    startSlideshow() {
        this.isPlaying = true;
        this.playlist.classList.add('funshow-playlist-playing');
        this.remainingSlideTime = Infinity;
        this.updateProgressBar();
    }

    pauseSlideshow() {
        this.isPlaying = false;
        this.playlist.classList.remove('funshow-playlist-playing');
        this.remainingSlideTime = 0;
        this.progressBar.style.width = '0%';
    }

    resetRemainingSlideTime() {     
        this.remainingSlideTime = this.slideDuration;
        this.updateProgressBar();
    }

    update(dt) {
        if( this.autoMinimize ) {
            if( this.elaspedSinceLastInteraction < this.autoMinimizeDuration ) {
                this.elaspedSinceLastInteraction += dt;
                if( this.elaspedSinceLastInteraction >= this.autoMinimizeDuration ) {
                    this.elaspedSinceLastInteraction = this.autoMinimizeDuration;
                    this.playlist.classList.add('funshow-playlist-minimized');
                }
            }
        }

        if (!this.isPlaying) return;

        this.remainingSlideTime -= dt * 1000; // Convert dt to milliseconds

        if (this.remainingSlideTime <= 0) {
            if (this.funShow.stage.currentIndex < this.funShow.stage.slides.length - 1 || this.isShuffle || this.loop) {
                if( this.isShuffle ) {
                    this.funShow.stage.jumpToRandomSlide(false);
                }
                else {
                    this.funShow.stage.changeSlide(1);
                }
                this.remainingSlideTime = Infinity;
                this.updateProgressBar();
            } else {
                this.pauseSlideshow();
            }
        } else if (this.isPlaying) {
            this.updateProgressBar();
        }
    }

    updateProgressBar() {
        const progress = (this.slideDuration - this.remainingSlideTime) / this.slideDuration * 100;
        if( progress > 0 ) {
            this.progressBar.style.width = `${progress}%`;
        }
        else {
            this.progressBar.style.width = `0%`;
        }
    }

    updateTitle() {
        const currentIndex = this.getCurrentSlideIndex() + 1;
        const totalSlides = this.funShow.stage.slides.filter(slide => slide.item.type !== 'category').length;
        const currentSection = this.getCurrentSection();
        const totalSections = this.funShow.stage.slides.filter(slide => slide.item.type === 'category').length;

        this.sectionCount.textContent = totalSections > 0 ? `SECTION (${currentSection}/${totalSections})` : '';
        this.slideCount.textContent = `SLIDE (${currentIndex}/${totalSlides})`;

        const sectionTitle = this.funShow.stage.slides.find((slide, index) => index === this.getCurrentSectionIndex() && slide.item.type === 'category')?.item.title || '';
        const slideTitle = this.funShow.stage.slides[this.funShow.stage.currentIndex]?.item.title || '';

        this.sectionInfo.textContent = sectionTitle;
        this.slideInfo.textContent = slideTitle;

        this.collapsedInfo.innerHTML = `
            <div>${sectionTitle}</div>
            <div>${slideTitle}</div>
        `;
        this.currentSectionInfo.textContent = sectionTitle;
        this.currentSlideInfo.textContent = slideTitle;
    }

    getCurrentSlideIndex() {
        const currentIndex = this.funShow.stage.currentIndex;
        let slideCount = 0;

        for (let i = 0; i <= currentIndex; i++) {
            if (this.funShow.stage.slides[i].item.type !== 'category') {
                slideCount++;
            }
        }

        return slideCount - 1; // -1 to convert to zero-based index
    }

    getCurrentSection() {
        const currentIndex = this.funShow.stage.currentIndex;
        for (let i = currentIndex; i >= 0; i--) {
            if (this.funShow.stage.slides[i].item.type === 'category' ) {//!this.funShow.stage.slides[i].item.file) {
                return this.funShow.stage.slides.slice(0, i + 1).filter(slide => slide.item.type === 'category').length;
            }
        }
        return 1;
    }

    getCurrentSectionIndex() {
        const currentIndex = this.funShow.stage.currentIndex;
        for (let i = currentIndex; i >= 0; i--) {
            if (this.funShow.stage.slides[i].item.type === 'category') {
                return i;
            }
        }
        return -1;
    }

    userInteraction() {
        if( this.autoMinimize ) {
            this.elaspedSinceLastInteraction = 0;
            if( this.playlist.classList.contains('funshow-playlist-minimized') ) {
                this.playlist.classList.remove('funshow-playlist-minimized');
                const currentIndex = Number(this.slidesContainer.querySelector('.funshow-playlist-slide-active').getAttribute('data-index'));
                this.adjustScrollPosition(currentIndex);
                this.updateStickySection();
            }
        }
    }

    onSlideArriving(){
        if( this.isPlaying && this.slideDuration - this.remainingSlideTime <= 0) {
            this.resetRemainingSlideTime();
        }
    }

    updateActiveItem({ previousIndex, currentIndex, direction, wasUserAction}) {
        const currentSlide = this.funShow.stage.slides[currentIndex];
        this.slideDuration = (currentSlide?.item?.config?.hasOwnProperty('displayDuration')) ? currentSlide.item.config.displayDuration * 1000 : this.funShow.slideshow.config.slideDisplayDuration * 1000;

        const items = this.slidesContainer.querySelectorAll('.funshow-playlist-slide');
        items.forEach(item => {
            item.classList.toggle('funshow-playlist-slide-active', item.dataset.index == currentIndex);
        });
        this.updateTitle();
        this.adjustScrollPosition(currentIndex);
        this.updateStickySection(currentIndex);

        if( wasUserAction ) {
            this.userInteraction();

            if (this.isPlaying && this.pauseOnInteraction ) {
                this.pauseSlideshow();
            }
        }
        else if( this.autoMinimize && this.alwaysShowOnSlideChange ) {
            this.userInteraction();
        }

        if( this.isPlaying ) {
            this.startSlideshow();
        }
    }

    adjustScrollPosition(currentIndex) {
        const activeItem = this.slidesContainer.querySelector('.funshow-playlist-slide-active');
        if (activeItem) {
            const containerRect = this.slidesContainer.getBoundingClientRect();
            const itemRect = activeItem.getBoundingClientRect();

            const stickyElement = this.slidesContainer.querySelector('.sticky-section');
            const stickyHeight = stickyElement ? stickyElement.getBoundingClientRect().height : 0;

            const adjustedTop = containerRect.top + stickyHeight;

            if (itemRect.top < adjustedTop) {
                this.slidesContainer.scrollTop -= (adjustedTop - itemRect.top);
            } else if (itemRect.bottom > containerRect.bottom) {
                this.slidesContainer.scrollTop += (itemRect.bottom - containerRect.bottom);
            }
        }
    }

    updateStickySection(currentIndex) {
        const sections = this.slidesContainer.querySelectorAll('.funshow-playlist-slide.section');
        sections.forEach(section => section.classList.remove('sticky-section'));

        const currentSectionIndex = this.getCurrentSectionIndex();
        if (currentSectionIndex !== -1) {
            const currentSection = this.slidesContainer.querySelector(`.funshow-playlist-slide[data-index="${currentSectionIndex}"]`);
            if (currentSection) {
                currentSection.classList.add('sticky-section');
            }
        }
    }

    toggleCollapsedState() {
        this.isCollapsed = !this.isCollapsed;
        this.playlist.classList.toggle('funshow-playlist-collapsed', this.isCollapsed);
        this.updateTitle(); // Update title to show correct section and slide info

        // update scroll & sticky too
        if( !this.isCollapsed ) {
            const currentIndex = Number(this.slidesContainer.querySelector('.funshow-playlist-slide-active').getAttribute('data-index'));
            this.adjustScrollPosition(currentIndex);
            this.updateStickySection();
        }
    }

    toggleShuffleState() {
        this.isShuffle = !this.isShuffle;
        this.playlist.classList.toggle('funshow-playlist-shuffle', this.isShuffle);
    }






    onPrevClick() {
        if (this.isShuffle) {
            this.funShow.stage.jumpToRandomSlide(true);
        } else {
            this.funShow.stage.changeSlide(-1, true);
        }
    }

    onPlayClick() {
        this.isPlaying = true;
        this.startSlideshow();
        this.resetRemainingSlideTime();
    }

    onPauseClick() {
        this.isPlaying = false;
        this.pauseSlideshow();
    }

    onNextClick() {
        if (this.isShuffle) {
            this.funShow.stage.jumpToRandomSlide(true);
        } else {
            this.funShow.stage.changeSlide(1, true);
        }
    }
}
