class FunShowSlide extends FunShowEventEmitter {
    constructor(funShow, item, container) {
        super();
        this.funShow = funShow;
        this.item = item;
        this.container = container;
        this.mediaAsBackground = funShow.slideshow.config.mediaAsBackground;
        this.transitionTimeRemaining = -1; // No active transition
        this.mediaObjectFit = (this.item.config?.hasOwnProperty('mediaObjectFit')) ? this.item.config.mediaObjectFit : funShow.slideshow.config.slideMediaObjectFit;
        this.defaultScale = (this.item.config?.hasOwnProperty('defaultScale')) ? this.item.config.defaultScale : funShow.slideshow.config.slideDefaultScale;
        this.styleIn = (this.item.config?.hasOwnProperty('styleIn')) ? this.item.config.styleIn : funShow.slideshow.config.slideStyleIn;
        this.styleOut = (this.item.config?.hasOwnProperty('styleOut')) ? this.item.config.styleOut : funShow.slideshow.config.slideStyleOut;
        this.styleActive = (this.item.config?.hasOwnProperty('styleActive')) ? this.item.config.styleActive : funShow.slideshow.config.slideStyleActive;

        // resolve random styles, if needed
        if( this.styleIn === '' || this.styleOut === '' ) {
            const numStyleInOut = 7;    // styleIn & styleOut have same num, so we generate 1 number for both so our in & out transitions match style-wise even w/ random transitions
            const randomStyleType = Math.floor(Math.random() * (numStyleInOut + 1));
            this.styleIn = (this.styleIn === '' ) ? randomStyleType : this.styleIn;
            this.styleOut = (this.styleOut === '' ) ? randomStyleType : this.styleOut;
        }
        if( this.styleActive === '' ) {
            const numStyleActive = 8;
            const randomStyleActiveType = Math.floor(Math.random() * (numStyleActive + 1));
            console.log('rando active style type', randomStyleActiveType);
            this.styleActive = randomStyleActiveType;
        }

        this.spamProtection = funShow.slideshow.config.spamProtection; // Duration in seconds for spam protection
        this.spamProtectionTimeRemaining = this.spamProtection; // Spam protection timer
        this.transitionDuration = funShow.slideshow.config.transitionDuration;
        this.transitionEntranceTime = funShow.slideshow.config.transitionEntranceTime;
        this.transitionExitTime = funShow.slideshow.config.transitionExitTime;
        this.fullyActiveTimestamp = -1;
        //if( this.transitionExitTime < 0.0001 ) {    // cannot be zero - due to bug really, because synchronous should be allowed.
        //    this.transitionExitTime = 0.0001;
        //}
        this.isLoaded = false;
        this.totalElapsed = 0;
        this.displayElapsed = 0; // New property to track display time
        this.displayDuration = (this.item.config?.hasOwnProperty('displayDuration')) ? this.item.config.displayDuration : funShow.slideshow.config.slideDisplayDuration;
        this.videoControls = (this.item.config?.hasOwnProperty('videoControls')) ? this.item.config.videoControls : funShow.slideshow.config.slideVideoControls;
        this.videoMuted = (this.item.config?.hasOwnProperty('videoMuted')) ? this.item.config.videoMuted : funShow.slideshow.config.slideVideoMuted;
        this.videoAutoplay = (this.item.config?.hasOwnProperty('videoAutoplay')) ? this.item.config.videoAutoplay : funShow.slideshow.config.slideVideoAutoplay;
        this.videoLoop = (this.item.config?.hasOwnProperty('videoLoop')) ? this.item.config.videoLoop : funShow.slideshow.config.slideVideoLoop;
        this.isDeferredActive = false; // Flag to track if the slide is deferred active
        this.isActive = false; // Flag to track if the slide is fully active
        this.isLoaded = false; // Flag to track if the slide is fully loaded (for image & video slides only.)
        this.isDirectionNext = true;
        this.initEventListeners();

        this.loadingTimeout = null;
        this.loadingIndicator = null;
        this.removeLoadingIndicatorTimeout = null;

        if (!FunShowSlide.cssInjected) {
            this.injectCSS();
            FunShowSlide.cssInjected = true;
        }
    }

    static cssInjected = false;

    injectCSS() {
        const css = `
            .funshow-slide {
                position: absolute;
                width: 100%;
                height: 100%;
                opacity: 0;
                transition: all ${this.transitionDuration}s ease;
                display: flex;
                justify-content: center;
                align-items: center;
                box-sizing: border-box;
                color: var(--primary-color);
                fill: var(--primary-color);
            }
            .funshow-html {
                color: var(--secondary-color);
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                box-sizing: border-box;
            }
            .funshow-image, .funshow-video {
                width: 100%;
                height: 100%;
            }
            .funshow-slide-active {
                z-index: 1;
                opacity: 1;
            }

            .funshow-slide-content {
                overflow: hidden;
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                box-sizing: border-box;
                font-family: var(--secondary-font-family);
            }

            .funshow-slide-active-complete {
                transform: scale(1);
            }


            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .funshow-loading-indicator {
                pointer-events: none;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: var(--secondary-color);
                font-family: Arial, sans-serif;
                z-index: 10;
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
                padding: 20px;
                box-sizing: border-box;
                text-align: center;
            }

            .funshow-loading-indicator.show {
                opacity: 1;
            }

            .funshow-loading-spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            }

            .funshow-loading-text {
                font-size: 18px;
                margin-bottom: 10px;
            }

            .funshow-loading-details {
                font-size: 14px;
                max-width: 80%;
                margin: 20px auto 0;
                display: inline-block;
                text-align: center;
            }

            .funshow-loading-details p {
                margin: 5px 0;
            }



            /* type0: Drift */
            .funshow-slide-active-complete.funshow-slide-active-type0 {
            }

            /* type1: Drift Zoom-In */
            .funshow-slide-active-complete.funshow-slide-active-type1 {
                transform: scale(1.2);
            }

            /* type2: Drift Zoom-Out */
            .funshow-slide-active-complete.funshow-slide-active-type2 {
                transform: scale(0.8);
            }

            /* type3: Zoom-In Low*/
            .funshow-slide-active-complete.funshow-slide-active-type3 {
                transform: scale(1.2);
            }

            /* type4: Zoom-In Mid */
            .funshow-slide-active-complete.funshow-slide-active-type4 {
                transform: scale(1.5);
            }

            /* type5: Zoom-In Max */
            .funshow-slide-active-complete.funshow-slide-active-type5 {
                transform: scale(2);
            }

            /* type6: Zoom-Out Low*/
            .funshow-slide-active-complete.funshow-slide-active-type6 {
                transform: scale(0.8);
            }

            /* type7: Zoom-Out Mid */
            .funshow-slide-active-complete.funshow-slide-active-type7 {
                transform: scale(0.5);
            }

            /* type8: Zoom-Out Max */
            .funshow-slide-active-complete.funshow-slide-active-type8 {
                transform: scale(0.25);
            }


            /* type0: bubble-in */
            .funshow-slide-transition-in-next.funshow-slide-transition-type0-in {
                opacity: 0;
                transform: scale(0.5);
            }
            .funshow-slide-transition-out-next.funshow-slide-transition-type0-out {
                opacity: 0;
                transform: scale(1.5);
            }
            .funshow-slide-transition-in-prev.funshow-slide-transition-type0-in {
                opacity: 0;
                transform: scale(0.5);
            }
            .funshow-slide-transition-out-prev.funshow-slide-transition-type0-out {
                opacity: 0;
                transform: scale(1.5);
            }

            /* type1: bubble-out */
            .funshow-slide-transition-in-next.funshow-slide-transition-type1-in {
                opacity: 0;
                transform: scale(1.5);
            }
            .funshow-slide-transition-out-next.funshow-slide-transition-type1-out {
                opacity: 0;
                transform: scale(0.5);
            }
            .funshow-slide-transition-in-prev.funshow-slide-transition-type1-in {
                opacity: 0;
                transform: scale(1.5);
            }
            .funshow-slide-transition-out-prev.funshow-slide-transition-type1-out {
                opacity: 0;
                transform: scale(0.5);
            }

            /* type2: swipe-up */
            .funshow-slide-transition-in-next.funshow-slide-transition-type2-in {
                opacity: 0;
                transform: translateY(100%);
            }
            .funshow-slide-transition-out-next.funshow-slide-transition-type2-out {
                opacity: 0;
                transform: translateY(-100%);
            }
            .funshow-slide-transition-in-prev.funshow-slide-transition-type2-in {
                opacity: 0;
                transform: translateY(-100%);
            }
            .funshow-slide-transition-out-prev.funshow-slide-transition-type2-out {
                opacity: 0;
                transform: translateY(100%);
            }

            /* type3: swipe-down */
            .funshow-slide-transition-in-next.funshow-slide-transition-type3-in {
                opacity: 0;
                transform: translateY(-100%);
            }
            .funshow-slide-transition-out-next.funshow-slide-transition-type3-out {
                opacity: 0;
                transform: translateY(100%);
            }
            .funshow-slide-transition-in-prev.funshow-slide-transition-type3-in {
                opacity: 0;
                transform: translateY(100%);
            }
            .funshow-slide-transition-out-prev.funshow-slide-transition-type3-out {
                opacity: 0;
                transform: translateY(-100%);
            }

            /* type4: swipe-left */
            .funshow-slide-transition-in-next.funshow-slide-transition-type4-in {
                opacity: 0;
                transform: translateX(100%);
            }
            .funshow-slide-transition-out-next.funshow-slide-transition-type4-out {
                opacity: 0;
                transform: translateX(-100%);
            }
            .funshow-slide-transition-in-prev.funshow-slide-transition-type4-in {
                opacity: 0;
                transform: translateX(-100%);
            }
            .funshow-slide-transition-out-prev.funshow-slide-transition-type4-out {
                opacity: 0;
                transform: translateX(100%);
            }

            /* type5: swipe-right */
            .funshow-slide-transition-in-next.funshow-slide-transition-type5-in {
                opacity: 0;
                transform: translateX(-100%);
            }
            .funshow-slide-transition-out-next.funshow-slide-transition-type5-out {
                opacity: 0;
                transform: translateX(100%);
            }
            .funshow-slide-transition-in-prev.funshow-slide-transition-type5-in {
                opacity: 0;
                transform: translateX(100%);
            }
            .funshow-slide-transition-out-prev.funshow-slide-transition-type5-out {
                opacity: 0;
                transform: translateX(-100%);
            }

            /* type6: toss-left  */
            .funshow-slide-transition-in-next.funshow-slide-transition-type6-in {
                opacity: 0;
                transform: translateX(60%) scale(0.25) rotate(-0.15turn);
            }
            .funshow-slide-transition-out-next.funshow-slide-transition-type6-out {
                opacity: 0;
                transform: translateX(-60%) scale(0.25) rotate(0.15turn);
            }
            .funshow-slide-transition-in-prev.funshow-slide-transition-type6-in {
                opacity: 0;
                transform: translateX(-60%) scale(0.25) rotate(0.15turn);
            }
            .funshow-slide-transition-out-prev.funshow-slide-transition-type6-out {
                opacity: 0;
                transform: translateX(60%) scale(0.25) rotate(-0.15turn);
            }

            /* type7: toss-right  */
            .funshow-slide-transition-in-next.funshow-slide-transition-type7-in {
                opacity: 0;
                transform: translateX(-60%) scale(0.25) rotate(0.15turn);
            }
            .funshow-slide-transition-out-next.funshow-slide-transition-type7-out {
                opacity: 0;
                transform: translateX(60%) scale(0.25) rotate(-0.15turn);
            }
            .funshow-slide-transition-in-prev.funshow-slide-transition-type7-in {
                opacity: 0;
                transform: translateX(60%) scale(0.25) rotate(-0.15turn);
            }
            .funshow-slide-transition-out-prev.funshow-slide-transition-type7-out {
                opacity: 0;
                transform: translateX(-60%) scale(0.25) rotate(0.15turn);
            }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    initEventListeners() {
        this.on('activate', this.activate, this);
        this.on('deactivate', this.deactivate, this);
        this.funShow.on('update', this.updateTransition, this);
    }

    createLoadingIndicator(errorMessage = null) {
        if (!this.loadingIndicator) {
            this.loadingIndicator = document.createElement('div');
            this.loadingIndicator.startTimestamp = this.totalElapsed;
            this.loadingIndicator.className = 'funshow-loading-indicator';

            const spinner = document.createElement('div');
            spinner.className = 'funshow-loading-spinner';

            const loadingText = document.createElement('div');
            loadingText.className = 'funshow-loading-text';
            loadingText.textContent = errorMessage || 'Loading...';

            const loadingDetails = document.createElement('div');
            loadingDetails.className = 'funshow-loading-details';
            loadingDetails.innerHTML = this.getLoadingDetails();

            this.loadingIndicator.appendChild(spinner);
            this.loadingIndicator.appendChild(loadingText);
            this.loadingIndicator.appendChild(loadingDetails);

            //this.slideDiv.appendChild(this.loadingIndicator);
            document.body.appendChild(this.loadingIndicator);

            // Force reflow to trigger the transition
            this.loadingIndicator.offsetHeight;
            this.loadingIndicator.classList.add('show');
        }
    }

    getLoadingDetails() {
        let details = '';
        if (this.item.type === 'image' || this.item.type === 'video') {
            details += `Title: ${this.item.title}<br />`;
            details += `File: ${this.item.file.split('/').pop()}<br />`;
            details += `Type: ${this.item.type}<br />`;
            const mediaUrl = window.funShowEnvironment.prepareMediaSrc(this.item, this.funShow.lastUsedPath);
            const hostname = new URL(mediaUrl).hostname;
            details += `Host: ${hostname}<br/>`;
        }
        return details;
    }

    updateLoadingIndicator() {
        if (this.loadingIndicator) {
            const mediaElem = (this.item.type === 'image') ? this.slideDiv.querySelector('img') : this.slideDiv.querySelector('video');
            const mediaUrl = window.funShowEnvironment.prepareMediaSrc(this.item, this.funShow.lastUsedPath);
            const hostname = new URL(mediaUrl).hostname;
            const width = (this.item.type === 'image') ? mediaElem.naturalWidth : mediaElem.videoWidth;
            const height = (this.item.type === 'image') ? mediaElem.naturalHeight : mediaElem.videoHeight;

            let details = `
                Title: ${this.item.title}<br />
                File: ${this.item.file.split('/').pop()}<br/>
                Type: ${this.item.type}<br />
                Host: ${hostname}<br/>
                Dimensions: ${width}x${height}<br/>
            `;

            if (this.item.type === 'video') {
                const videoDuration = mediaElem.duration.toFixed(2) + ' seconds';
                const buffered = (mediaElem.buffered.length > 0) ? `${(mediaElem.buffered.start(0)).toFixed(2)} - ${(mediaElem.buffered.end(0)).toFixed(2)} seconds` : 'Not buffered';
                details += `
                    Duration: ${videoDuration}<br/>
                    Buffered: ${buffered}<br/>
                `;
            }

            const loadingDetails = this.loadingIndicator.querySelector('.funshow-loading-details');
            if (loadingDetails) {
                loadingDetails.innerHTML = details;
            }
        }
    }

    slideLoaded() {
        this.isLoaded = true;
        this.clearLoadingTimeout();

        if (this.loadingIndicator) {
            this.updateLoadingIndicator();
            this.loadingIndicator.classList.remove('show');
            this.removeLoadingIndicatorTimeout = setTimeout(() => { // this might become a lingering timeout, but it'll look real nice in most cases.
                this.removeLoadingIndicator();
            }, 300);
        }

        if (this.transitionTimeRemaining <= 0 ) {
            this.transitionTimeRemaining = 0;//Infinity;//((this.transitionDuration / 2.0)) * this.transitionExitTime;//(this.transitionDuration / 2.0) * this.transitionExitTime;//this.spamProtection + (this.transitionDuration * this.transitionExitTime); // Transition duration in seconds
            this.slideDiv.classList.remove('funshow-slide-transition-in', 'funshow-slide-transition-out', 'funshow-slide-transition-in-next', 'funshow-slide-transition-out-next', 'funshow-slide-transition-in-prev', 'funshow-slide-transition-out-prev');
            this.slideDiv.classList.add('funshow-slide-active');
        }
        this.emit('loaded');
    }

    createElement() {
        if (!this.slideDiv) {

            this.slideDiv = document.createElement('div');
            this.slideDiv.classList.add('funshow-slide');

            this.slideContent = document.createElement('div');
            this.slideContent.classList.add('funshow-slide-content');
            this.slideDiv.appendChild(this.slideContent);

            // add trasition types for this slide
            //if( this.item.type !== 'video' && this.item.type !== 'html' ) {
                this.slideDiv.classList.add(`funshow-slide-active-type${this.styleActive}`);
            //}
            this.slideDiv.classList.add(`funshow-slide-transition-type${this.styleIn}-in`);
            this.slideDiv.classList.add(`funshow-slide-transition-type${this.styleOut}-out`);
            
            //const pathToUse = (this.item.file.indexOf('blob:') != 0 || !this.item.handle || !this.item.directoryHandle) ? this.funShow.lastUsedPath : '';

            let didSetBackground = false;
            if (this.item.type === 'image') {
                const imageUrl = window.funShowEnvironment.prepareMediaSrc(this.item, this.funShow.lastUsedPath);
                this.mediaElement = document.createElement('img');
                this.mediaElement.src = imageUrl;//`${pathToUse}${this.item.file}`;
                this.mediaElement.classList.add('funshow-image');
                this.mediaElement.style.objectFit = (this.item?.config?.hasOwnProperty('mediaObjectFit')) ? this.item?.config?.mediaObjectFit : this.mediaObjectFit;
                this.mediaElement.addEventListener('load', () => {
                    this.slideLoaded();
                });

                if (this.mediaAsBackground) {
                    document.body.originalBackground = document.body.style.background;
                    document.body.style.background = `
                        linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.95)),
                        url("${imageUrl}") center/150% no-repeat
                    `;
                    document.body.style.backgroundSize = 'cover';
                    didSetBackground = true;
                }
            } else if (this.item.type === 'video') {
                this.mediaElement = document.createElement('video');
                this.mediaElement.src = window.funShowEnvironment.prepareMediaSrc(this.item, this.funShow.lastUsedPath);
                this.mediaElement.classList.add('funshow-video');
                this.mediaElement.style.objectFit = (this.item?.config?.hasOwnProperty('mediaObjectFit')) ? this.item?.config?.mediaObjectFit : this.mediaObjectFit;
                this.mediaElement.autoplay = this.videoAutoplay;
                this.mediaElement.controls = this.videoControls;
                this.mediaElement.loop = this.videoLoop; // Optional: Loop the video
                this.mediaElement.muted = this.videoMuted; // Optional: Mute the video by default
                this.mediaElement.setAttribute('playsinline', 'playsinline');
                //this.mediaElement.addEventListener('loadeddata', () => {
                this.mediaElement.addEventListener('canplaythrough', () => {
                    this.slideLoaded();
                });
            }
            else if( this.item.type === 'html' ) {
                this.mediaElement = document.createElement('div');
                this.mediaElement.classList.add('funshow-html');
                this.mediaElement.innerHTML = this.item.file;
            }
            this.slideContent.appendChild(this.mediaElement);
            this.container.appendChild(this.slideDiv);
            this.zoomPan = new FunShowZoomPan(this.slideDiv, this.slideContent, ((this.item?.config?.hasOwnProperty('defaultScale')) ? this.item?.config?.defaultScale : this.defaultScale));
            this.transitionTimeRemaining = this.transitionDuration * this.transitionExitTime;

            if( !didSetBackground && document.body.originalBackground && document.body.style.background != document.body.originalBackground ) {
                document.body.style.background = document.body.originalBackground;
                delete document.body.originalBackground;
            }

            if(this.item.type !== 'image' && this.item.type !== 'video' ) {
                //this.transitionTimeRemaining = 0;
                setTimeout(()=>{this.slideLoaded();}, 1);
            }

            if (this.item.type === 'image' || this.item.type === 'video') {
                this.loadingTimeout = setTimeout(() => {
                    this.createLoadingIndicator();
                }, 2000);
            }
        }
    }

    clearLoadingTimeout() {
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }
    }

    clearRemoveLoadingIndicatorTimeout() {
        if (this.removeLoadingIndicatorTimeout) {
            clearTimeout(this.removeLoadingIndicatorTimeout);
            this.removeLoadingIndicatorTimeout = null;
        }
    }

    removeLoadingIndicator() {
        if (this.loadingIndicator && this.loadingIndicator.parentNode) {
            this.loadingIndicator.parentNode.removeChild(this.loadingIndicator);
        }

        const startTimestamp = this.loadingIndicator.startTimestamp;
        const nowTimestamp = this.totalElapsed;
        const totalWait = nowTimestamp - startTimestamp;
        window.funShowEnvironment.reportLoadingWaitFinished(totalWait);

        this.loadingIndicator = null;
    }
    
    destroyElement() {
        this.clearLoadingTimeout();
        this.clearRemoveLoadingIndicatorTimeout();
        
        if (this.loadingIndicator) {
            this.removeLoadingIndicator();
        }

        if (this.slideDiv) {
            if (this.zoomPan) {
                this.zoomPan.destroy();
                this.zoomPan = null;
            }

            if (this.backgroundElement) {
                this.backgroundElement.parentNode.removeChild(this.backgroundElement);
                this.backgroundElement = null;
            }

            this.container.removeChild(this.slideDiv);
            this.slideDiv = null;
            this.mediaElement = null;
        }
    }

    activate(direction, wasUserAction) {
        //this.slideDiv?.classList?.remove('funshow-slide-active-complete');
        //this.transitionTimeRemaining = ((this.transitionDuration / 2.0)) * this.transitionExitTime;//(this.transitionDuration / 2.0) * this.transitionExitTime;//this.spamProtection + (this.transitionDuration * this.transitionExitTime); // Transition duration in seconds

        this.isDirectionNext = (!!direction && direction >= 0);
        this.spamProtectionTimeRemaining = this.spamProtection;
        this.isDeferredActive = true;
        this.isActive = false;
        this.isLoaded = (this.item.type !== 'image' && this.item.type !== 'video');
        this.displayElapsed = 0; // Reset display time when activating
    }

    deactivate(direction, wasUserAction) {
        if( this.loadingIndicator ) {
            this.loadingIndicator.classList.remove('show');
            this.removeLoadingIndicatorTimeout = setTimeout(() => { // this might become a lingering timeout, but it'll look real nice in most cases.
                this.removeLoadingIndicator();
            }, 300);
        }


        this.isDirectionNext = (!!direction && direction >= 0);
        this.transitionTimeRemaining = this.transitionDuration; // Transition duration in seconds
        this.isDeferredActive = false;
        this.isActive = false;
        this.isActiveComplete = false;
        if (this.slideDiv) {
            this.slideDiv.classList.remove('funshow-slide-active', 'funshow-slide-active-complete');
            // set transition times here because displayDuration can be different for each slide
            this.slideDiv.style.transition = '';

            // random drift remove
            if( (this.styleActive === '0' || this.styleActive === '1' || this.styleActive === '2') && this.slideDiv.classList.contains(`funshow-slide-active-type${this.styleActive}`) ) {
                this.slideDiv.style.transform = '';
            }

            this.slideDiv.offsetHeight;
            this.slideDiv.classList.add('funshow-slide-transition-out', (this.isDirectionNext?'funshow-slide-transition-out-next':'funshow-slide-transition-out-prev'));
        }
        if( this.fullyActiveTimestamp ) {
            // This time is positive if the entire "inward" transition was allowed to finish.
            // If it's negative, that means the user skipped this slide before it fully transitioned in, and the negative time was the time remaining in the transition.
            //console.log(`Slide was active for ${(this.displayElapsed - this.fullyActiveTimestamp - (this.transitionDuration*this.transitionExitTime)).toFixed(2)} seconds`)
        }
        this.displayElapsed = 0;
    }

    activateDeferred() {
        this.createElement();
        if (this.slideDiv) {
            this.slideDiv.classList.remove('funshow-slide-transition-out-next', 'funshow-slide-transition-out-prev');
            this.slideDiv.classList.add('funshow-slide-transition-in', (this.isDirectionNext?'funshow-slide-transition-in-next':'funshow-slide-transition-in-prev'));

            this.isDeferredActive = false;
            this.isActive = true;
        }
    }

    updateTransition(dt) {
        this.totalElapsed += dt;

        if (this.spamProtectionTimeRemaining > 0) {
            this.spamProtectionTimeRemaining -= dt;
            if (this.spamProtectionTimeRemaining <= 0) {
                this.spamProtectionTimeRemaining = 0;
                if (this.isDeferredActive) {
                    this.activateDeferred();
                }
            }
        }

        //if (this.isActive) {
        if(this.isActive && this.isLoaded) {
            this.displayElapsed += dt;
            if (!this.isActiveComplete && this.displayElapsed >= (this.transitionDuration * this.transitionEntranceTime) + (this.transitionDuration * this.transitionExitTime) && this.slideDiv) {
                this.isActiveComplete = true;
                this.emit('arriving');
                this.fullyActiveTimestamp = this.displayElapsed;
                this.slideDiv.classList.add('funshow-slide-active-complete');

                // set transition times here because displayDuration can be different for each slide
                this.slideDiv.style.transition = `all ${this.transitionDuration}s ease, transform ${this.displayDuration * 2}s ease-out`;

                // random drift apply
                const driftDirections = [
                    {x: -1, y: -1}, // up left
                    {x: 0, y: -1},  // up center
                    {x: 1, y: -1},  // up right
                    {x: -1, y: 0},  // middle left
                    {x: 1, y: 0},   // middle right
                    {x: -1, y: 1},  // bottom left
                    {x: 0, y: 1},   // bottom center
                    {x: 1, y: 1}    // bottom right
                ];
                if( this.styleActive !== '0' ) {
                    driftDirections.push({x: 0, y: 0});   // middle center
                }
                const randomDriftDirection = driftDirections[Math.floor(Math.random() * driftDirections.length)];
                if( this.styleActive === '0' ) {
                    this.slideDiv.style.transform = `translate(${randomDriftDirection.x * 8}%, ${randomDriftDirection.y * 8}%)`;
                }
                else if( this.styleActive === '1' ) {
                    this.slideDiv.style.transform = `scale(1.2) translate(${randomDriftDirection.x * 8}%, ${randomDriftDirection.y * 8}%)`;
                }
                else if( this.styleActive === '2' ) {
                    this.slideDiv.style.transform = `scale(0.8) translate(${randomDriftDirection.x * 8}%, ${randomDriftDirection.y * 8}%)`;
                }
            }
        }

        if (this.transitionTimeRemaining > 0) {
            this.transitionTimeRemaining -= dt;
            if (this.transitionTimeRemaining <= 0) {
                this.transitionTimeRemaining = -1;
                if (this.slideDiv && !this.isActive) {
                    this.destroyElement();
                }
                else if( this.slideDiv ) {
                    if( this.isLoaded ) {
                        this.transitionTimeRemaining = 0;//Infinity;//((this.transitionDuration / 2.0)) * this.transitionExitTime;//(this.transitionDuration / 2.0) * this.transitionExitTime;//this.spamProtection + (this.transitionDuration * this.transitionExitTime); // Transition duration in seconds
                        this.slideDiv.classList.remove('funshow-slide-transition-in', 'funshow-slide-transition-out', 'funshow-slide-transition-in-next', 'funshow-slide-transition-out-next', 'funshow-slide-transition-in-prev', 'funshow-slide-transition-out-prev');
                        this.slideDiv.classList.add('funshow-slide-active');
                    }
                }
            }
        }
    }
}
