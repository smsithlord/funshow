class FunShowStagePanelToolbar extends FunShowEventEmitter {
    constructor(funShow) {
        super();
        this.funShow = funShow;
        this.container = null;
        this.injectCSS();
        this.funShow.on('initialize', this.initHTML.bind(this));
    }

    destroy() {
        // Emit the destroy event
        this.emit('destroy');

        // Remove event listeners
        this.funShow.off('initialize', this.initHTML);
        if (this.stopButton) {
            this.stopButton.removeEventListener('click', this.onStopClick);
        }
        if (this.editButton) {
            this.editButton.removeEventListener('click', this.onEditClick);
        }

        // Remove the injected CSS
        const styleElement = document.head.querySelector('style[data-funshow-toolbar-style]');
        if (styleElement) {
            document.head.removeChild(styleElement);
        }

        // Remove the toolbar from the DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        // Clear references
        this.funShow = null;
        this.container = null;
        this.stopButton = null;
        this.editButton = null;

        // Remove all event listeners
        this.off();
    }

    injectCSS() {
        const style = document.createElement('style');
        style.setAttribute('data-funshow-toolbar-style', '');
        const css = `
            .funshow-toolbar {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: var(--primary-bgcolor-highopacity);
                color: var(--primary-color);
                padding: 2px;
                border-radius: 5px;
                font-family: var(--primary-font-family);
                font-size: 14px;
                z-index: 10;
                display: flex;
                gap: 10px;
            }
            .funshow-toolbar-button {
                background: none;
                border: none;
                cursor: pointer;
                padding: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .funshow-toolbar-button svg {
                width: 24px;
                height: 24px;
                fill: var(--primary-color);
            }
            .funshow-toolbar-button:hover svg {
                fill: var(--primary-color-highlight);
            }
            .funshow-edit-button svg {
                fill: var(--primary-color);
                stroke: var(--primary-color);
            }
        `;
        style.textContent = css;
        document.head.appendChild(style);
    }

    initHTML() {
        const toolbarHTML = `
            <div class="funshow-toolbar">
                <button class="funshow-toolbar-button funshow-stop-button" title="Stop">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 3 24 19">
                        <path d="M12 5L4 19h16L12 5zm0 3.865L16.865 17H7.135L12 8.865z"/>
                        <rect x="4" y="20" width="16" height="2"/>
                    </svg>
                </button>
                <button class="funshow-toolbar-button funshow-edit-button" title="Edit">
                    <svg viewBox="19 19 33 25" xmlns="http://www.w3.org/2000/svg" class="funshow-toolbar-icon-builder">
                        <g fill="currentColor">
                            <rect x="22" y="22" width="20" height="20" style="fill: var(--primary-color);"/>
                            <path d="M26 26h12M26 32h12M26 38h12" stroke-width="1" fill="none" style="stroke: var(--primary-color);"/>
                            <path d="M26 26h12M26 32h12M26 38h12" stroke-width="1" style="stroke: var(--primary-bgcolor);"/>
                            <path d="M46 22v20M50 26v12" stroke-width="2" fill="none" style="stroke: var(--primary-color);"/>
                            <circle cx="46" cy="22" r="2" style="fill: var(--primary-color);"/>
                            <circle cx="46" cy="42" r="2" style="fill: var(--primary-color);"/>
                            <circle cx="50" cy="26" r="2" style="fill: var(--primary-color);"/>
                            <circle cx="50" cy="38" r="2" style="fill: var(--primary-color);"/>
                        </g>
                    </svg>
                </button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toolbarHTML);

        this.container = document.querySelector('.funshow-toolbar');
        this.stopButton = this.container.querySelector('.funshow-stop-button');
        this.editButton = this.container.querySelector('.funshow-edit-button');

        this.stopButton.addEventListener('click', this.onStopClick.bind(this));
        this.editButton.addEventListener('click', this.onEditClick.bind(this));

        if( !window.funShowEnvironment.modules.FunShowBuilder ) {
            this.editButton.style.display = 'none';
        }
    }

    onStopClick() {
        this.funShow.destroy();
        window.funShowEnvironment.startBlankViewer();
    }

    onEditClick() {
        //const slideshow = this.funShow.slideshow;
        const slideshow = this.funShow.slideshow;
        this.funShow.destroy();

        // change slides to items
        slideshow.slides = slideshow.items;
        delete slideshow.items;

        // start the builder
        new FunShowBuilder(null, slideshow);
    }
}