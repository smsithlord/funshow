class FunShow extends FunShowEventEmitter {
    constructor({
        slideshow = null,
        mediaLibraryItems = null,
        enableUI = false,
        allowWorkingPath = false
    } = {}) {
        super();
        this.enableUI = enableUI;
        this.slideshow = slideshow;
        this.mediaLibraryItems = mediaLibraryItems;
        this.allowWorkingPath = allowWorkingPath;

        // convert an array of mediaLibrary items into a slideshow if that's all we got - cuz that's all FunShow does is slideshows.
        // This will use folders are categories, and files from that folder as slides, only if they are image or video.
        if( this.mediaLibraryItems && !this.slideshow ) {
            const funShowItems = [];

            const hasChildSlides = (folderId) => {
                return Object.values(this.mediaLibraryItems).some(item => item.parent === folderId && (item.type === 'image' || item.type === 'video'));
            };

            const addFolderAndFiles = (folderId) => {
                const folder = this.mediaLibraryItems[folderId];
                if (hasChildSlides(folderId)) {
                    funShowItems.push({
                        title: folder.name,
                        type: 'category'
                    });

                    for (const itemId in this.mediaLibraryItems) {
                        const item = this.mediaLibraryItems[itemId];
                        if (item.parent === folderId && (item.type === 'image' || item.type === 'video')) {
                            funShowItems.push({
                                file: (!item.file || typeof item.file != 'string' || !item.file.indexOf('blob:')) ? URL.createObjectURL(item.file) : item.file,
                                title: item.name,
                                type: item.type,
                                handle: item.file,  // these are purely to better support local drag & drop in the builder
                                directoryHandle: item.directory  // these are purely to better support local drag & drop in the builder
                            });
                        }
                    }
                }
            };

            // Add slides without a parent first
            for (const itemId in this.mediaLibraryItems) {
                const item = this.mediaLibraryItems[itemId];
                if ((item.type === 'image' || item.type === 'video') && !item.parent) {
                    funShowItems.push({
                        file: (!item.file || typeof item.file != 'string' || !item.file.indexOf('blob:')) ? URL.createObjectURL(item.file) : item.file,
                        title: item.name,
                        type: item.type
                    });
                }
            }

            // Add folders and their child slides
            for (const itemId in this.mediaLibraryItems) {
                const item = this.mediaLibraryItems[itemId];
                if (item.type === 'folder' && !item.parent) {
                    addFolderAndFiles(itemId);
                }
            }

            this.slideshow = {
                config: {},
                slides: funShowItems
            };
        }

        // NOTICE: The builder & the enviornment calls them "slides", but the FunShow/Slideshow related classes expect "items."
        // So make sure we have slides before we validate w/ default & merge, and then make sure we switch back to items.
        if( !this.slideshow.slides && this.slideshow.items ) {
            this.slideshow.slides = this.slideshow.items;
            delete this.slideshow.items;
        }

        // make sure we have all & only valid fields
        const defaultSlideshow = window.funShowEnvironment.generateDefaultSlideshow();

        if( mediaLibraryItems ) {
            const originalSlides = this.slideshow.slides;
            this.slideshow = window.funShowEnvironment.mergeSlideshow(defaultSlideshow, {config: this.slideshow.config, slides: []}, false);
            this.slideshow.slides = originalSlides;
        }
        else {
            this.slideshow = window.funShowEnvironment.mergeSlideshow(defaultSlideshow, this.slideshow, false);
        }

        // switch back to items
        if( !this.slideshow.items && this.slideshow.slides ) {
            this.slideshow.items = this.slideshow.slides;
            delete this.slideshow.slides;
        }

        // set the cloudinaryTransforms mode (as this is stored in funShowEnvironment)
        if( this.slideshow?.config?.cloudinaryTransforms ) {
            window.funShowEnvironment.setApplyCloudinaryTransforms(true);
        }
        else {
            window.funShowEnvironment.setApplyCloudinaryTransforms(false);
        }

        if( mediaLibraryItems ) {
            // don't autoplay if we only have 1 item
            if( this.slideshow.items.filter(item=>item.type != 'category').length <= 1 ) {
                this.slideshow.config.autoPlay = false;
            }
        }
        
        // Set lastUsedPath so media knows how to resolve
        this.lastUsedPath = '';
        this.updateLastUsedPath(this.slideshow.config, this.slideshow.items);

        this.cssString = '';

        this.injectCSSVariables();
        this.injectGoogleFonts();
        this.createContainer();
        this.createModules();
        this.injectCSS();
        this.initEventListeners();
        this.emit('initialize');
        this.startSimulationLoop();
    }

    updateLastUsedPath(config) {
        let path = config.workingDirectory || config.contentPath || '';
        if( !this.allowWorkingPath ) {
            path = config.contentPath || '';
        }
        path = path.replace(/\\/g, '/');
        if (path && !path.endsWith('/')) {
            path += '/';
        }
        this.lastUsedPath = path;
    }

    destroy() {
        // Emit the 'destroy' event
        this.emit('destroy');

        // Stop the simulation loop
        this.stopSimulationLoop();

        // Remove event listeners
        this.removeEventListeners();

        // Destroy modules
        if (this.stage) {
            this.stage.destroy();
        }
        if (this.playlistPanel) {
            this.playlistPanel.destroy();
        }
        if (this.toolbarPanel) {
            this.toolbarPanel.destroy();
        }

        // Remove the container from the DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        // Remove injected CSS
        this.removeInjectedCSS();

        // Remove injected Google Fonts
        this.removeGoogleFonts();

        // Clear any references
        this.slideshow = null;
        this.container = null;
        this.stage = null;
        this.playlistPanel = null;
        this.toolbarPanel = null;
    }

    injectCSSVariables() {
        // Helper functions
        const adjustBrightness = (color, amount) => {
            return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
        };
        const addOpacity = (color, opacity) => {
            const hexOpacity = Math.round(opacity * 255).toString(16).padStart(2, '0');
            return `${color}${hexOpacity}`;
        };

        // Color schema
        const colorSchema = [
            { name: 'primary-color', value: this.slideshow.config.primaryColor || '#ffffff' },
            { name: 'secondary-color', value: this.slideshow.config.secondaryColor || '#000000' },
            { name: 'primary-bgcolor', value: this.slideshow.config.primaryBgColor || '#000000' },
            { name: 'secondary-bgcolor', value: this.slideshow.config.secondaryBgColor || '#ffffff' }
        ];

        // Variation schema
        const baseVariationSchema = [
            { suffix: '', modifier: color => color },
            { suffix: '-highlight', modifier: color => adjustBrightness(color, 40) },
            { suffix: '-lowlight', modifier: color => adjustBrightness(color, -40) }
        ];

        const opacityVariationSchema = [
            { suffix: '', modifier: color => color },
            { suffix: '-lowopacity', modifier: color => addOpacity(color, 0.25) },
            { suffix: '-midopacity', modifier: color => addOpacity(color, 0.5) },
            { suffix: '-highopacity', modifier: color => addOpacity(color, 0.75) }
        ];

        // Generate CSS variables
        let cssVariables = '';
        colorSchema.forEach(color => {
            baseVariationSchema.forEach(baseVariation => {
                const baseColor = baseVariation.modifier(color.value);
                opacityVariationSchema.forEach(opacityVariation => {
                    const finalColor = opacityVariation.modifier(baseColor);
                    const suffix = baseVariation.suffix + opacityVariation.suffix;
                    cssVariables += `--${color.name}${suffix}: ${finalColor};\n`;
                });
            });
        });

        // Add font families
        cssVariables += `
            --primary-font-family: ${this.slideshow.config.primaryFontFamily || 'Arial, sans-serif'};
            --secondary-font-family: ${this.slideshow.config.secondaryFontFamily || 'Arial, sans-serif'};
        `;

        // Inject CSS variables
        this.cssString += `
            :root {
                ${cssVariables}
            }
        `;
    }

    injectGoogleFonts() {
        const standardFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Verdana'];

        if (this.slideshow.config.primaryFontFamily !== '' && standardFonts.indexOf(this.slideshow.config.primaryFontFamily) < 0 ) {
            //const primaryFontUrl = `https://fonts.googleapis.com/css2?family=${this.slideshow.config.primaryFontFamily.replace(/ /g, '+')}&display=swap`;
            const primaryFontUrl = `https://fonts.googleapis.com/css2?family=${this.slideshow.config.primaryFontFamily}&display=swap`;
            const primaryFontLink = document.createElement('link');
            primaryFontLink.href = primaryFontUrl;
            primaryFontLink.rel = 'stylesheet';
            document.head.appendChild(primaryFontLink);
        }
        if (this.slideshow.config.secondaryFontFamily !== '' && standardFonts.indexOf(this.slideshow.config.secondaryFontFamily) < 0 ) {
            //const secondaryFontUrl = `https://fonts.googleapis.com/css2?family=${this.slideshow.config.secondaryFontFamily.replace(/ /g, '+')}&display=swap`;
            const secondaryFontUrl = `https://fonts.googleapis.com/css2?family=${this.slideshow.config.secondaryFontFamily}&display=swap`;
            const secondaryFontLink = document.createElement('link');
            secondaryFontLink.href = secondaryFontUrl;
            secondaryFontLink.rel = 'stylesheet';
            document.head.appendChild(secondaryFontLink);
        }
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.classList.add('funshow-container');
        document.body.appendChild(this.container);
    }

    createModules() {
        this.stage = new FunShowStage(this);
        this.playlistPanel = new FunShowStagePanelPlaylist(this);

        //if( !!this.mediaLibraryItems ) {   // we only have this panel if we weren't already launched from the builder.
        if( this.enableUI ) {
            this.toolbarPanel = new FunShowStagePanelToolbar(this);
        }
        //this.infoPanel = new FunShowStagePanelInfo(this);
    }

    injectCSS() {
        const style = document.createElement('style');
        style.textContent = this.cssString;
        style.setAttribute('data-funshow-styles', '');
        document.head.appendChild(style);
    }

    initEventListeners() {
        this.wheelEventHandler = (e) => {
            if (e.deltaY < 0) {
                this.emit('input:left');
            } else if (e.deltaY > 0) {
                this.emit('input:right');
            }
        };
        document.body.addEventListener('wheel', this.wheelEventHandler);
    }

    startSimulationLoop() {
        let lastTimestamp = performance.now();
        const self = this;
        
        function update() {
            const now = performance.now();
            const dt = (now - lastTimestamp) / 1000; // Convert milliseconds to seconds
            lastTimestamp = now;
            self.emit('update', dt);
            self.animationFrameId = requestAnimationFrame(update);
        }
        this.animationFrameId = requestAnimationFrame(update);
    }

    stopSimulationLoop() {
        // Assuming we're using requestAnimationFrame, we need to cancel it
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    removeEventListeners() {
        // Remove the wheel event listener
        document.body.removeEventListener('wheel', this.wheelEventHandler);
    }

    removeInjectedCSS() {
        // Remove the style element that was added to the head
        const styleElement = document.head.querySelector('style[data-funshow-styles]');
        if (styleElement) {
            document.head.removeChild(styleElement);
        }
    }

    removeGoogleFonts() {
        // Remove the Google Fonts link elements
        const fontLinks = document.head.querySelectorAll('link[href^="https://fonts.googleapis.com/css2"]');
        fontLinks.forEach(link => {
            document.head.removeChild(link);
        });
    }
}