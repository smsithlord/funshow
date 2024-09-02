class FunShowStage extends FunShowEventEmitter {
    constructor(funShow) {
        super();
        this.funShow = funShow;
        this.stageTransparent = funShow.slideshow.config.stageTransparent;
        this.loop = funShow.slideshow.config.loop;
        this.currentIndex = 0;
        this.slides = [];
        this.initEventListeners();
    }

    initEventListeners() {
        this.funShow.on('initialize', this.initialize, this);
        this.funShow.on('input:right', this.onInputNext, this);
        this.funShow.on('input:left', this.onInputPrevious, this);
    }

    initialize() {
        this.createContainer();
        this.createSlides();
        this.injectCSS();
        this.findFirstSlide();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.classList.add('funshow-stage-container');
        document.body.appendChild(this.container); // Append to the document body

        // Our container doesn't really take up any screen space, so just set the background on the page body instead.
        if( this.funShow.slideshow.config.stageBackgroundImage != '' ) {
            // apply a content/working and/or Cloudinary fixes to the background image URL...
            const imageUrl = window.funShowEnvironment.prepareMediaSrc({type: 'image', file: this.funShow.slideshow.config.stageBackgroundImage}, this.funShow.lastUsedPath);
            document.body.style.background = `url("${imageUrl}")`;
            document.body.style.backgroundSize = 'cover';
        }
        else if( !this.funShow.slideshow.config.stageTransparent ) {
            document.body.style.background = 'var(--secondary-bgcolor)';
        }
    }

    onSlideArriving(){
        this.emit('slide:arriving');
    }

    onSlideLoaded(){
    }

    createSlides() {
        this.funShow.slideshow.items.forEach(item => {
            const slide = new FunShowSlide(this.funShow, item, this.container);
            slide.emit('initialize');
            slide.on('arriving', this.onSlideArriving, this);
            slide.on('loaded', this.onSlideLoaded, this);
            this.slides.push(slide);
        });
    }

    injectCSS() {
        this.funShow.cssString += `
            .funshow-stage-container {
                color: var(--secondary-color);
                position: relative;
                width: 100%;
                height: 100vh;
                overflow: hidden;
                z-index: 1;
            }
        `;
    }

    findFirstSlide() {
        while (this.currentIndex < this.slides.length && 
               (!this.slides[this.currentIndex].item.file || 
                this.slides[this.currentIndex].item.type === "category")) {
            this.currentIndex++;
        }
        if (this.currentIndex >= this.slides.length) {
            this.currentIndex = this.findNextValidSlide(-1, 1); // Fallback to the next valid slide
        }
        if (!this.slides[this.currentIndex] || 
            !this.slides[this.currentIndex].item.file || 
            this.slides[this.currentIndex].item.type === "category") {
            this.currentIndex = 0; // If no valid slide found, start from the beginning
        }
    }

    findNextValidSlide(startIndex, direction) {
        let index = startIndex;
        const initialIndex = startIndex;
        do {
            index += direction;
            if (this.loop) {
                // Wrap around if loop is true
                if (index >= this.slides.length) {
                    index = 0;
                } else if (index < 0) {
                    index = this.slides.length - 1;
                }
            } else if (index < 0 || index >= this.slides.length) {
                // If not looping and out of bounds, return the start index
                return startIndex;
            }
            // Check if we've found a valid slide
            if (this.slides[index] && 
                this.slides[index].item.file && 
                this.slides[index].item.type !== "category") {
                return index;
            }
        } while (index !== initialIndex);
        // If we've checked all slides and found no valid one, return the start index
        return startIndex;
    }

    startSlideshow() {
        this.currentIndex = -1;
        if( this.funShow.slideshow.config.playlistStartShuffle ) {
            this.jumpToRandomSlide(false);
        }
        else {
            this.changeSlide(1);
        }
        this.emit('start');
        const helpInput = new FunShowHelpInput(window.funShowEnvironment.isMobile);
    }

    changeSlide(direction, wasUserAction) {
        this.currentIndex = (!!direction && direction != 0) ? this.findNextValidSlide(this.currentIndex, direction) : this.findNextValidSlide(this.currentIndex, 1);

        if (this.slides.length === 0) {
            return; // No slides to display
        }

        if (this.previousIndex !== undefined ) {//&& this.previousIndex !== this.currentIndex) {
            this.slides[this.previousIndex].emit('deactivate', direction, wasUserAction);
        }
        this.slides[this.currentIndex].emit('activate', direction, wasUserAction);
        this.emit('change', { previousIndex: this.previousIndex, currentIndex: this.currentIndex, direction: direction, wasUserAction: !!wasUserAction });
        this.previousIndex = this.currentIndex;
    }

    jumpToIndex(slideIndex) {
        this.changeSlide(slideIndex - this.currentIndex, true);
    }

    jumpToRandomSlide(wasUserAction) {
        if (this.slides.length <= 1) {
            return; // No need to jump if there's only one or no slides
        }

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.slides.length);
        } while (randomIndex === this.currentIndex || !this.slides[randomIndex].item.file);

        this.changeSlide(randomIndex - this.currentIndex, wasUserAction);
    }

    nextSlide(wasUserAction) {
        if( this.funShow.playlistPanel?.isShuffle ) {
            this.jumpToRandomSlide(wasUserAction);
        }
        else {
            this.changeSlide(1, wasUserAction);
        }
    }

    previousSlide(wasUserAction) {
        if( this.funShow.playlistPanel?.isShuffle ) {
            this.jumpToRandomSlide(wasUserAction);
        }
        else {
            this.changeSlide(-1, wasUserAction);
        }
    }

    onInputNext() {
        this.nextSlide(true);
    }

    onInputPrevious() {
        this.previousSlide(true);
    }

    destroy() {
        // Remove event listeners
        this.removeEventListeners();

        // Destroy all slides
        this.destroySlides();

        // Remove the container from the DOM
        this.removeContainer();

        // remove our background image, because we assigned it to the body.
        document.body.style.backgroundImage = '';

        // Clear references
        this.funShow = null;
        this.slides = null;
        this.container = null;

        // Emit destroy event
        this.emit('destroy');
    }

    removeEventListeners() {
        if (this.funShow) {
            this.funShow.off('initialize', this.initialize, this);
            this.funShow.off('input:right', this.onInputNext, this);
            this.funShow.off('input:left', this.onInputPrevious, this);
        }
    }

    destroySlides() {
        if (this.slides) {
            this.slides.forEach(slide => {
                slide.off('arriving', this.onSlideArriving, this);
                slide.off('loaded', this.onSlideLoaded, this);
                if (typeof slide.destroy === 'function') {
                    slide.destroy();
                }
            });
            this.slides = [];
        }
    }

    removeContainer() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
