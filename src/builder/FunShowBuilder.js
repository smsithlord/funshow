class FunShowBuilder extends FunShowEventEmitter {
    constructor(container, slideshow = null) {
        super();
        this.container = container;
        this.givenContainer = this.container;
        if( !this.container ) {
            this.container = document.createElement('div');
            document.body.appendChild(this.container);
        }
        this.schema = window.funShowEnvironment.schema;
        this.loadedFileName = null;
        this.lastUsedPath = '';
        this.initialStateHash = null;
        this.currentZoom = 1;
        this.injectCSS();
        this.injectHTML();
        this.bindEvents();
        
        if (slideshow) {
            this.loadSlideshow(slideshow);
        } else {
            this.loadDefaultSlideshow();
        }

        this.setInitialStateHash();
        this.addBeforeUnloadListener();
    }

    destroy() {
        // Emit the destroy event
        this.emit('destroy');

        // Remove all event listeners from the container
        this.container.removeEventListener('mouseover', this.containerMouseOverHandler);
        this.container.removeEventListener('mouseout', this.containerMouseOutHandler);

        // Remove event listeners from buttons
        document.getElementById('exitButton').removeEventListener('click', this.exitButtonClickHandler);
        document.getElementById('previewButton').removeEventListener('click', this.previewButtonClickHandler);
        document.getElementById('newButton').removeEventListener('click', this.newButtonClickHandler);
        document.getElementById('saveButton').removeEventListener('click', this.saveButtonClickHandler);
        document.getElementById('loadButton').removeEventListener('click', this.loadButtonClickHandler);
        this.zoomElem.removeEventListener('click', this.zoomChangeHandler);
        this.zoomElem = null;

        // Remove event listeners from slides
        const slides = document.querySelectorAll('.funshow-builder-slide');
        slides.forEach(slide => {
            slide.removeEventListener('mousedown', this.slideMouseDown);
            slide.removeEventListener('dragstart', this.dragStart);
            slide.removeEventListener('dragenter', this.dragEnter);
            slide.removeEventListener('dragover', this.dragOver);
            slide.removeEventListener('dragleave', this.dragLeave);
            slide.removeEventListener('drop', this.drop);
            slide.removeEventListener('dragend', this.dragEnd);

            const editIcon = slide.querySelector('.funshow-builder-slide-edit-icon');
            editIcon.removeEventListener('click', this.toggleSlideEdit);

            const deleteIcon = slide.querySelector('.funshow-builder-slide-delete-icon');
            deleteIcon.removeEventListener('click', this.toggleSlideDeleteConfirmation);

            const deleteConfirmYes = slide.querySelector('.funshow-builder-delete-confirm-yes');
            deleteConfirmYes.removeEventListener('click', this.deleteSlide);

            const deleteConfirmCancel = slide.querySelector('.funshow-builder-delete-confirm-cancel');
            deleteConfirmCancel.removeEventListener('click', this.toggleSlideDeleteConfirmation);
        });

        // Remove the injected CSS
        const styleElement = document.head.querySelector('style[data-funshow-builder-style]');
        if (styleElement) {
            document.head.removeChild(styleElement);
        }

        // Clear the container
        this.container.innerHTML = '';

        // Remove any remaining DOM elements created by the builder
        const modalElements = document.querySelectorAll('.funshow-builder-modal, .funshow-builder-load-modal');
        modalElements.forEach(element => element.remove());

        // Remove all event listeners
        this.off();

        if( this.container != this.givenContainer ) {
            this.container.remove();
        }
        this.givenContainer = null;

        // Clear any references
        this.container = null;
        this.schema = null;
        this.loadedFileName = null;
        this.lastUsedPath = null;
    }

    setInitialStateHash() {
        const currentState = this.getSlideshowState();
        this.initialStateHash = this.hashString(JSON.stringify(currentState));
    }

    addBeforeUnloadListener() {
        window.addEventListener('beforeunload', (event) => {
            if (this.hasUnsavedChanges()) {
                event.preventDefault();
                event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }

    hasUnsavedChanges() {
        const currentState = this.getSlideshowState();
        const currentStateHash = this.hashString(JSON.stringify(currentState));
        return currentStateHash !== this.initialStateHash;
    }

    getSlideshowState() {
        const slideshowConfig = this.getSlideshowConfig();
        const slides = this.getSlides().map(slideElement => slideElement.slide);

        return {
            config: slideshowConfig,
            slides: slides
        };
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    injectCSS() {
        const style = document.createElement('style');
        style.setAttribute('data-funshow-builder-style', '');
        const darkMode = true;

        const commonStyles = `
            .funshow-builder-container {
                font-family: 'Arial', sans-serif;
                display: flex;
                height: 100vh;
                overflow: hidden;
            }
            .funshow-builder-column-right, .funshow-builder-column-left-content {
                overflow-y: auto;
            }
            .funshow-builder-column-left {
                display: flex;
                flex-direction: column;

                width: 320px;
                min-width: 320px;
            }

            .funshow-builder-column-left-content {
                display: flex;
                flex-direction: column;
            }
            .funshow-builder-footer {
                margin-top: auto;
                padding: 10px;
                display: flex;
                justify-content: space-between;
            }
            .funshow-builder-footer-button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.3s;
            }
            .funshow-builder-column-right {
                flex-grow: 1;
                min-width: 225px;
            }
            .funshow-builder-header {
                display: flex;
                flex-direction: column;
                padding: 12px;
            }
            .funshow-builder-header-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .funshow-builder-header h2, .funshow-builder-header h3 {
                margin: 0;
            }
            .funshow-builder-header-content {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }

            .funshow-builder-header-title {
                display: flex;
                flex-direction: rows;
                align-items: center;
            }

            .funshow-builder-header-title svg {
                width: 48px;
                height: 48px;
            }

            .funshow-builder-zoom-container {
                display: flex;
                align-items: center;
            }
            .funshow-builder-zoom-slider {
                width: 100px;
                margin-left: 10px;
            }

            .funshow-builder-file-name {
                font-size: 14px;
                margin-top: 5px;
            }
            .funshow-builder-buttons {
                display: flex;
                align-items: center;
            }
            .funshow-builder-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                padding: 0;
                margin: 0 5px;
                background-color: transparent;
                border: none;
                cursor: pointer;
            }
            .funshow-builder-button:hover {
                border-radius: 4px;
            }
            .funshow-builder-button svg {
                width: 20px;
                height: 20px;
            }
            .funshow-builder-form-group {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
                padding: 5px 10px;
                border-radius: 4px;
                transition: background-color 0.3s;
            }
            .funshow-builder-form-group label {
                flex: 0 0 90px;
                margin-right: 10px;
                font-weight: bold;
                font-size: 0.8em;
            }
            .funshow-builder-form-group input[type="text"],
            .funshow-builder-form-group input[type="number"],
            .funshow-builder-form-group select,
            .funshow-builder-form-group textarea {
                flex: 1;
                padding: 3px 5px;
                border-radius: 4px;
                box-sizing: border-box;
                font-size: 0.9em;
            }
            .funshow-builder-form-group input[type="checkbox"] {
                margin-right: 5px;
            }
            .funshow-builder-form-group input[type="range"] {
                flex: 1;
                margin-right: 10px;
            }
            .funshow-builder-range-value {
                flex: 0 0 40px;
                text-align: right;
                font-size: 0.9em;
            }
            .funshow-builder-slides {
                display: flex;
                flex-wrap: wrap;
                padding: 10px;
            }
            .funshow-builder-slides-empty .funshow-builder-hide-if-noslides {
                display: none;
            }
            .funshow-builder-slide {
                width: 280px;
                height: 280px;
                margin: 10px;
                padding: 15px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                overflow-y: auto;
                position: relative;
            }
            .funshow-builder-slide-info {
                position: absolute;
                top: 5px;
                left: 5px;
                display: flex;
                align-items: center;
            }
            .funshow-builder-slide-info-actions {
                display: flex;
                align-items: center;
            }
            .funshow-builder-slide:not(:hover) .funshow-builder-slide-info-actions {
                display: none;
            }
            .funshow-builder-slide-number {
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.8em;
                margin-right: 5px;
            }
            .funshow-builder-slide-edit-icon, .funshow-builder-slide-delete-icon {
                cursor: pointer;
            }
            .funshow-builder-slide-delete-icon {
                margin-left: 4px;
            }
            .funshow-builder-slide-preview {
                display: flex;
                flex-direction: column;
                text-align: center;
                justify-content: center;
                align-items: center;
                height: 100%;
                font-size: 24px;
                font-weight: bold;
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center center;
            }
            .funshow-builder-slide-edit-content {
                display: none;
            }
            .funshow-builder-slide.funshow-builder-edit .funshow-builder-slide-preview {
                display: none;
            }
            .funshow-builder-slide.funshow-builder-edit .funshow-builder-slide-edit-content {
                display: block;
            }
            .funshow-builder-add-slide {
                width: 310px;
                height: 310px;
                margin: 10px;
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 4px;
                cursor: pointer;
                font-size: 24px;
            }
            .funshow-builder-help-flyout {
                position: fixed;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 20px;
                border-radius: 4px 4px 0 0;
                font-size: 14px;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            }
            .funshow-builder-scrollable::-webkit-scrollbar {
                width: 8px;
            }
            .funshow-builder-scrollable::-webkit-scrollbar-thumb {
                border-radius: 4px;
            }
            .funshow-builder-scrollable::-webkit-scrollbar-track {
                border-radius: 4px;
            }
            .funshow-builder-slide-range {
                width: 6px;
            }
            .funshow-builder-slide input[type="text"],
            .funshow-builder-slide input[type="number"],
            .funshow-builder-slide select,
            .funshow-builder-slide textarea {
                width: 100%;
                max-width: 220px;
                box-sizing: border-box;
            }
            .funshow-builder-slide textarea {
                resize: vertical;
                min-height: 60px;
            }
            .funshow-builder-slide-delete-confirmation {
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10;
            }
            .funshow-builder-slide.funshow-builder-delete-confirm .funshow-builder-slide-delete-confirmation {
                display: flex;
            }
            .funshow-builder-slide.funshow-builder-delete-confirm .funshow-builder-slide-preview,
            .funshow-builder-slide.funshow-builder-delete-confirm .funshow-builder-slide-edit-content {
                display: none;
            }
            .funshow-builder-delete-confirm-buttons {
                margin-top: 10px;
            }
            .funshow-builder-delete-confirm-button {
                margin: 0 5px;
                padding: 5px 10px;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            .funshow-builder-load-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .funshow-builder-load-content {
                padding: 20px;
                border-radius: 5px;
                text-align: center;
            }
            .funshow-builder-load-dropzone {
                border-radius: 5px;
                padding: 50px;
                margin-bottom: 20px;
                font-size: 18px;
            }
            .funshow-builder-load-browse,
            .funshow-builder-load-cancel {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin: 0 10px;
            }
            #funshow-builder-file-input {
                display: none;
            }
            .funshow-builder-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .funshow-builder-modal-content {
                padding: 20px;
                border-radius: 5px;
                text-align: center;
            }
            .funshow-builder-modal-buttons {
                margin-top: 20px;
            }
            .funshow-builder-modal-button {
                margin: 0 10px;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            }
            .funshow-builder-button-content {
                display: flex;
                flex-direction: rows;
            }
            .funshow-builder-button-content svg {
                width: 16px;
                height: 16px;
                margin-right: 8px;
            }
            .funshow-builder-download-options {
                display: flex;
                justify-content: space-around;
                margin-bottom: 20px;
                gap: 8px;
            }

            .funshow-builder-download-option {
                text-align: center;
                cursor: pointer;
                padding: 15px;
                border: 1px solid #ccc;
                border-radius: 8px;
                transition: background-color 0.3s ease;
                width: 100px;
                height: 160px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                background-color: #f8f8f8;
            }

            .funshow-builder-download-option:hover {
                background-color: #e8e8e8;
            }

            .funshow-builder-download-option svg {
                margin-bottom: 10px;
                fill: #333;
            }

            .funshow-builder-download-option p {
                font-size: 14px;
                font-weight: bold;
                margin: 0 0 5px 0;
                color: #333;
            }

            .funshow-builder-download-option small {
                font-size: 12px;
                color: #666;
            }

            /* Update the error text color */
            .funshow-builder-modal-content pre {
                background-color: #f0f0f0;
                padding: 10px;
                border-radius: 5px;
                white-space: pre-wrap;
                word-wrap: break-word;
                color: #333; /* Darker color for better readability */
            }

            .funshow-builder-version-select {
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .funshow-builder-version-select select, {
                margin-right: 10px;
                padding: 5px;
                border-radius: 5px;
                border: 1px solid #ccc;
            }

            .funshow-builder-version-select label {
                display: flex;
                align-items: center;
            }

            .funshow-builder-version-select input[type="checkbox"] {
                margin-right: 5px;
            }

            .funshow-builder-spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .funshow-builder-modal-content pre {
                background-color: #f0f0f0;
                padding: 10px;
                border-radius: 5px;
                white-space: pre-wrap;
                word-wrap: break-word;
            }

            .funshow-env-local .funshow-env-hide-if-local {
                display: none;
            }

            .funshow-checkmark-appear {
                margin: 24px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                height: 100%;
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
            }

            .funshow-checkmark {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                display: block;
                stroke-width: 2;
                stroke: #fff;
                stroke-miterlimit: 10;
                box-shadow: inset 0px 0px 0px #7ac142;
                animation: funshow-fill .4s ease-in-out .4s forwards, funshow-scale .3s ease-in-out .9s both;
            }

            .funshow-checkmark__circle {
                stroke-dasharray: 166;
                stroke-dashoffset: 166;
                stroke-width: 2;
                stroke-miterlimit: 10;
                stroke: #7ac142;
                fill: none;
                animation: funshow-stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }

            .funshow-checkmark__check {
                transform-origin: 50% 50%;
                stroke-dasharray: 48;
                stroke-dashoffset: 48;
                animation: funshow-stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
            }

            .funshow-builder-exit-preview {
                position: absolute;
                top: 20px;
                left: 20px;
                color: #999;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 10px;
                z-index: 9999;
                display: flex;
                flex-direction: rows;
                align-items: center;
                opacity: 0.7;
                transition: opacity 1s ease;
            }
            .funshow-builder-exit-preview:hover {
                opacity: 1.0;
            }

            @keyframes funshow-stroke {
                100% {
                    stroke-dashoffset: 0;
                }
            }

            @keyframes funshow-scale {
                0%, 100% {
                    transform: none;
                }
                50% {
                    transform: scale3d(1.1, 1.1, 1);
                }
            }

            @keyframes funshow-fill {
                100% {
                    box-shadow: inset 0px 0px 0px 30px #7ac142;
                }
            }
        `;

        const darkModeStyles = `
            .funshow-builder-container { background-color: #1e1e1e; color: #e0e0e0; }
            .funshow-builder-column-left { background-color: #252526; border-right: 1px solid #3e3e42; }
            .funshow-builder-column-right { background-color: #1e1e1e; }
            .funshow-builder-header { background-color: #2d2d30; }
            .funshow-builder-file-name { color: #a0a0a0; }
            .funshow-builder-button { color: #e0e0e0; }
            .funshow-builder-button:hover { background-color: rgba(255, 255, 255, 0.1); }
            .funshow-builder-form-group:hover { background-color: #3e3e42; }
            .funshow-builder-form-group label { color: #e0e0e0; }
            .funshow-builder-form-group input[type="text"],
            .funshow-builder-form-group input[type="number"],
            .funshow-builder-form-group select,
            .funshow-builder-form-group textarea { 
                border: 1px solid #3e3e42; 
                background-color: #2d2d30; 
                color: #e0e0e0; 
            }
            .funshow-builder-form-group input[type="range"] { background-color: #2d2d30; }
            .funshow-builder-range-value { color: #e0e0e0; }
            .funshow-builder-slide { 
                background-color: #2d2d30; 
                border: 1px solid #3e3e42; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
            }
            .funshow-builder-slide-number { background-color: rgba(255,255,255,0.1); color: #e0e0e0; }
            .funshow-builder-slide-edit-icon, .funshow-builder-slide-delete-icon { 
                color: #e0e0e0; 
                fill: #e0e0e0; 
            }
            .funshow-builder-slide-preview { color: #e0e0e0; }
            .funshow-builder-add-slide { 
                background-color: #252526; 
                border: 2px dashed #3e3e42; 
                color: #a0a0a0; 
            }
            .funshow-builder-help-flyout { 
                background-color: #2d2d30; 
                color: #e0e0e0; 
            }
            .funshow-builder-scrollable::-webkit-scrollbar-thumb { background-color: #3e3e42; }
            .funshow-builder-scrollable::-webkit-scrollbar-thumb:hover { background-color: #4e4e52; }
            .funshow-builder-scrollable::-webkit-scrollbar-track { background-color: #252526; }
            .funshow-builder-slide-delete-confirmation { 
                background-color: rgba(45, 45, 48, 0.9); 
                color: #e0e0e0; 
            }
            .funshow-builder-delete-confirm-yes { background-color: #d9534f; color: white; }
            .funshow-builder-delete-confirm-cancel { background-color: #5bc0de; color: white; }
            .funshow-builder-load-modal { background-color: rgba(0, 0, 0, 0.8); }
            .funshow-builder-load-content { 
                background-color: #2d2d30; 
                color: #e0e0e0; 
            }
            .funshow-builder-load-dropzone { 
                border: 2px dashed #3e3e42; 
                color: #e0e0e0; 
            }
            .funshow-builder-load-dropzone.dragover { background-color: #3e3e42; }
            .funshow-builder-load-browse { background-color: #0e639c; color: white; }
            .funshow-builder-load-cancel { background-color: #6c757d; color: white; }
            .funshow-builder-modal { background-color: rgba(0, 0, 0, 0.8); }
            .funshow-builder-modal-content { 
                background-color: #2d2d30; 
                color: #e0e0e0; 
            }
            .funshow-builder-modal-button-primary { background-color: #0e639c; color: #ffffff; }
            .funshow-builder-modal-button-secondary { background-color: #6c757d; color: #ffffff; }

            .funshow-builder-footer { background-color: #252526; border-top: 1px solid #3e3e42; }
            .funshow-builder-footer-button { background-color: #3e3e42; color: #e0e0e0; }
            .funshow-builder-footer-button:hover { background-color: #4e4e52; }
        `;

        const lightModeStyles = `
            .funshow-builder-container { background-color: #ffffff; color: #000000; }
            .funshow-builder-column-left { background-color: #f0f0f0; border-right: 1px solid #ccc; }
            .funshow-builder-column-right { background-color: #fff; }
            .funshow-builder-file-name { color: #666; }
            .funshow-builder-button:hover { background-color: rgba(0, 0, 0, 0.1); }
            .funshow-builder-form-group:hover { background-color: #e0e0e0; }
            .funshow-builder-form-group input[type="text"],
            .funshow-builder-form-group input[type="number"],
            .funshow-builder-form-group select,
            .funshow-builder-form-group textarea { 
                border: 1px solid #ccc; 
                background-color: #ffffff; 
                color: #000000; 
            }
            .funshow-builder-slide { 
                background-color: #f9f9f9; 
                border: 1px solid #ddd; 
            }
            .funshow-builder-slide-number { background-color: rgba(0,0,0,0.5); color: white; }
            .funshow-builder-slide-edit-icon, .funshow-builder-slide-delete-icon { color: #000000; fill: #000000; }
            .funshow-builder-add-slide { 
                background-color: #e0e0e0; 
                border: 2px dashed #aaa; 
                color: #666; 
            }
            .funshow-builder-help-flyout { 
                background-color: #333; 
                color: #fff; 
            }
            .funshow-builder-scrollable::-webkit-scrollbar-thumb { background-color: #888; }
            .funshow-builder-scrollable::-webkit-scrollbar-thumb:hover { background-color: #666; }
            .funshow-builder-scrollable::-webkit-scrollbar-track { background-color: #f0f0f0; }
            .funshow-builder-slide-delete-confirmation { 
                background-color: rgba(255, 255, 255, 0.9); 
                color: #000000; 
            }
            .funshow-builder-delete-confirm-yes { background-color: #d9534f; color: white; }
            .funshow-builder-delete-confirm-cancel { background-color: #5bc0de; color: white; }
            .funshow-builder-load-modal { background-color: rgba(0, 0, 0, 0.8); }
            .funshow-builder-load-content { 
                background-color: white; 
                color: #000000; 
            }
            .funshow-builder-load-dropzone { 
                border: 2px dashed #ccc; 
                color: #000000; 
            }
            .funshow-builder-load-dropzone.dragover { background-color: #f0f0f0; }
            .funshow-builder-load-browse { background-color: #4CAF50; color: white; }
            .funshow-builder-load-cancel { background-color: #f44336; color: white; }
            .funshow-builder-modal { background-color: rgba(0, 0, 0, 0.8); }
            .funshow-builder-modal-content { 
                background-color: white; 
                color: #000000; 
            }
            .funshow-builder-modal-button-primary { background-color: #4CAF50; color: white; }
            .funshow-builder-modal-button-secondary { background-color: #f44336; color: white; }
            .funshow-builder-footer { background-color: #f0f0f0; border-top: 1px solid #ccc; }
            .funshow-builder-footer-button { background-color: #e0e0e0; color: #000000; }
            .funshow-builder-footer-button:hover { background-color: #d0d0d0; }
        `;
        style.textContent = `${commonStyles}${darkMode?darkModeStyles:lightModeStyles}`;
        document.head.appendChild(style);
    }

    injectHTML() {
        this.container.innerHTML = `
            <div class="funshow-builder-container">
                <div class="funshow-builder-column funshow-builder-column-left">
                    <div class="funshow-builder-header">
                        <div class="funshow-builder-header-top">
                            <div class="funshow-builder-header-title">
                                <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                                    <g fill="currentColor">
                                        <rect x="22" y="22" width="20" height="20"/>
                                        <path d="M26 26h12M26 32h12M26 38h12" stroke="currentColor" stroke-width="1" fill="none"/>
                                        <path d="M26 26h12M26 32h12M26 38h12" stroke="#000000" stroke-width="1"/>
                                        <path d="M46 22v20M50 26v12" stroke="currentColor" stroke-width="2" fill="none"/>
                                        <circle cx="46" cy="22" r="2"/>
                                        <circle cx="46" cy="42" r="2"/>
                                        <circle cx="50" cy="26" r="2"/>
                                        <circle cx="50" cy="38" r="2"/>
                                    </g>
                                </svg>
                                <h2>Builder</h2>
                            </div>
                            <div class="funshow-builder-buttons">
                                <button class="funshow-builder-button" id="newButton" title="New">
                                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="12" y1="18" x2="12" y2="12"></line>
                                        <line x1="9" y1="15" x2="15" y2="15"></line>
                                    </svg>
                                </button>
                                <button class="funshow-builder-button" id="saveButton" title="Save">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                </button>
                                <button class="funshow-builder-button" id="loadButton" title="Open">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="funshow-builder-file-name" id="fileNameDisplay">Unsaved slideshow</div>
                    </div>    
                    <div class="funshow-builder-column-left-content funshow-builder-scrollable">
                        <div id="slideshowConfig"></div>
                    </div>
                    <div class="funshow-builder-footer">
                        <button id="exitButton" class="funshow-builder-footer-button">
                            <div class="funshow-builder-button-content">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="8" y="3" width="10" height="18" rx="2" ry="2"></rect>
                                    <path d="M14 12H3"></path>
                                    <path d="M5 8l-4 4 4 4" stroke-width="2.5"></path>
                                </svg>
                                Exit
                            </div>
                        </button>
                        <button id="previewButton" class="funshow-builder-footer-button">
                            <div class="funshow-builder-button-content">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M8 21h8"></path>
                                    <path d="M12 17v4"></path>
                                    <polygon points="10 8.5 16 10.5 10 12.5 10 8.5" fill="currentColor"></polygon>
                                </svg>
                                Preview
                            </div>
                        </button>
                    </div>
                </div>
                <div class="funshow-builder-column funshow-builder-column-right funshow-builder-scrollable">
                    <div class="funshow-builder-header" style="margin-bottom: 0;">
                        <div class="funshow-builder-header-top">
                            <h3>Slides</h3>
                            <div class="funshow-builder-zoom-container">
                                <label for="zoom">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                                      <path d="M21 3H15M21 3V9M21 3L14 10"></path>
                                      <path d="M3 21H9M3 21V15M3 21L10 14"></path>
                                    </svg>
                                </label>
                                <input type="range" id="zoom" class="funshow-builder-zoom-slider" min="0.25" max="1" step="0.25" value="1">
                            </div>
                        </div>
                    </div>
                    <div class="funshow-builder-slides" id="slidesContainer"></div>
                </div>
            </div>
            <div class="funshow-builder-help-flyout" id="helpFlyout"></div>
        `;
    }

    applyBuilderZoomToSlideElement(slideElement) {
        const zoom = this.zoomElem.value;
        slideElement.style.zoom = zoom;
    }

    handleZoomChange(e) {
        const slideElements = document.querySelectorAll('#slidesContainer .funshow-builder-slide, #slidesContainer .funshow-builder-add-slide');
        slideElements.forEach(slideElement => { this.applyBuilderZoomToSlideElement(slideElement); });
    }

    bindEvents() {
        this.containerMouseOverHandler = this.handleContainerMouseOver.bind(this);
        this.containerMouseOutHandler = this.handleContainerMouseOut.bind(this);
        this.newButtonClickHandler = this.showNewConfirmModal.bind(this);
        this.saveButtonClickHandler = this.saveSlideshow.bind(this);
        this.loadButtonClickHandler = this.showLoadModal.bind(this);
        this.zoomChangeHandler = this.handleZoomChange.bind(this);

        this.container.addEventListener('mouseover', this.containerMouseOverHandler);
        this.container.addEventListener('mouseout', this.containerMouseOutHandler);

        document.getElementById('newButton').addEventListener('click', this.newButtonClickHandler);
        document.getElementById('saveButton').addEventListener('click', this.saveButtonClickHandler);
        document.getElementById('loadButton').addEventListener('click', this.loadButtonClickHandler);
        this.zoomElem = document.getElementById('zoom');
        this.zoomElem.addEventListener('change', this.zoomChangeHandler);

        this.exitButtonClickHandler = this.handleExitButtonClick.bind(this);
        this.previewButtonClickHandler = this.handlePreviewButtonClick.bind(this);

        document.getElementById('exitButton').addEventListener('click', this.exitButtonClickHandler);
        document.getElementById('previewButton').addEventListener('click', this.previewButtonClickHandler);
    }

    handleExitButtonClick() {
        this.showExitConfirmModal();
    }

    handlePreviewButtonClick() {
        const slideElements = this.getSlides();
        if( slideElements.length === 0 ) {
            this.addNewSlide();
        }
        this.generateJSON(false).then((slideshow)=>{
            slideshow.items = slideshow.slides;
            delete slideshow.slides;


                /*slideshow.items.unshift({
                    title: 'HTML Card Test',
                    type: 'html',
                    file: `
                        <div style="box-sizing: border-box; text-align: center;">
                            <h1 style="color: #fff;">Level Design</h1>
                            <h2 style="color: red;">
                                Competitive sabers gameplay.<br />
                                Inetended for use w/ SBX.
                            </h2>
                        </div>
                    `

                });
console.log(slideshow.items[0]);
console.log(slideshow.items[1]);*/

                /*funShowItems.push({
                    title: 'My Manual Category',
                    type: 'category'
                });*/

                /*funShowItems.push({
                    file: 'https://www.hdwallpaper.nu/wp-content/uploads/2015/02/Taylor_Swift.jpg',
                    title: 'Taylor Swift',
                    type: 'image'
                });*/



            const funShow = new FunShow({slideshow: slideshow, allowWorkingPath: true});
            funShow.stage.startSlideshow();
            this.container.style.display = 'none';
            //this.destroy();

            const exitPreviewModeButton = document.createElement('div');
            exitPreviewModeButton.className = 'funshow-builder-exit-preview';
            exitPreviewModeButton.innerHTML = `
            <button class="funshow-builder-modal-button funshow-builder-modal-button-secondary">
                <div class="funshow-builder-button-content">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="8" y="3" width="10" height="18" rx="2" ry="2"></rect>
                        <path d="M14 12H3"></path>
                        <path d="M5 8l-4 4 4 4" stroke-width="2.5"></path>
                    </svg>
                    Stop Preview
                </div>
            </button>
            `;
            exitPreviewModeButton.addEventListener('click', ()=>{
                funShow.destroy();
                this.container.style.display = 'block';
                exitPreviewModeButton.remove();
                //document.body.style.backgroundImage = '';
                //document.body.style.background = '';
                delete document.body.originalBackground;
            });
            document.body.appendChild(exitPreviewModeButton);
        });
    }

    handleContainerMouseOver(e) {
        const formGroup = e.target.closest('.funshow-builder-form-group');
        if (formGroup) {
            const helpText = formGroup.getAttribute('data-help');
            if (helpText) {
                this.showHelpFlyout(helpText);
            }
        }
    }

    handleContainerMouseOut(e) {
        if (!e.relatedTarget || !e.relatedTarget.closest('.funshow-builder-form-group')) {
            this.hideHelpFlyout();
        }
    }

    showNewConfirmModal() {
        const modal = document.createElement('div');
        modal.className = 'funshow-builder-modal';
        modal.innerHTML = `
            <div class="funshow-builder-modal-content">
                <p>Discard all changes & create a new slideshow?</p>
                <div class="funshow-builder-modal-buttons">
                    <button class="funshow-builder-modal-button funshow-builder-modal-button-secondary" id="newConfirmYes">
                        <div class="funshow-builder-button-content">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 6L9 17l-5-5"></path>
                            </svg>
                            Yes
                        </div>
                    </button>
                    <button class="funshow-builder-modal-button funshow-builder-modal-button-secondary" id="newConfirmCancel">
                        <div class="funshow-builder-button-content">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M15 9l-6 6"></path>
                                <path d="M9 9l6 6"></path>
                            </svg>
                            Cancel
                        </div>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('newConfirmYes').addEventListener('click', () => {
            this.loadDefaultSlideshow();
            document.body.removeChild(modal);
        });

        document.getElementById('newConfirmCancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    showExitConfirmModal() {
        const modal = document.createElement('div');
        modal.className = 'funshow-builder-modal';
        modal.innerHTML = `
            <div class="funshow-builder-modal-content">
                <p>Discard all changes & exit back to the splash screen?</p>
                <div class="funshow-builder-modal-buttons">
                    <button class="funshow-builder-modal-button funshow-builder-modal-button-secondary" id="exitConfirmYes">
                        <div class="funshow-builder-button-content">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 6L9 17l-5-5"></path>
                            </svg>
                            Discard & Exit
                        </div>
                    </button>
                    <button class="funshow-builder-modal-button funshow-builder-modal-button-secondary" id="exitConfirmCancel">
                        <div class="funshow-builder-button-content">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M15 9l-6 6"></path>
                                <path d="M9 9l6 6"></path>
                            </svg>
                            Cancel
                        </div>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('exitConfirmYes').addEventListener('click', () => {
            this.destroy();
            window.funShowEnvironment.newGame();
        });

        document.getElementById('exitConfirmCancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    showLoadModal() {
        const modal = document.createElement('div');
        modal.className = 'funshow-builder-load-modal';
        modal.innerHTML = `
            <div class="funshow-builder-load-content">
                <div class="funshow-builder-load-dropzone" id="funshow-builder-dropzone">
                    Drag & drop a save JSON file here
                </div>
                <button class="funshow-builder-load-browse" id="funshow-builder-browse">
                    <div class="funshow-builder-button-content">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Browse...
                    </div>
                </button>
                <button class="funshow-builder-load-cancel" id="funshow-builder-cancel">
                    <div class="funshow-builder-button-content">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M15 9l-6 6"></path>
                            <path d="M9 9l6 6"></path>
                        </svg>
                        Cancel
                    </div>
                </button>
                <input type="file" id="funshow-builder-file-input" accept=".json">
            </div>
        `;

        document.body.appendChild(modal);

        const dropzone = document.getElementById('funshow-builder-dropzone');
        const fileInput = document.getElementById('funshow-builder-file-input');
        const browseButton = document.getElementById('funshow-builder-browse');
        const cancelButton = document.getElementById('funshow-builder-cancel');

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            this.loadFile(file);
        });

        browseButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            this.loadFile(file);
        });

        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    updateLastUsedPath(config) {
        let path = config.workingDirectory || config.contentPath || '';
        path = path.replace(/\\/g, '/');
        if (path && !path.endsWith('/')) {
            path += '/';
        }
        this.lastUsedPath = path;
    }

    loadSlideshow(slideshow) {
        try {
            if (typeof slideshow === 'string') {
                slideshow = JSON.parse(slideshow);
            }

            const defaultSlideshow = window.funShowEnvironment.generateDefaultSlideshow();
            const mergedSlideshow = window.funShowEnvironment.mergeSlideshow(defaultSlideshow, slideshow);
            
            // Set lastUsedPath before rendering
            this.updateLastUsedPath(mergedSlideshow.config);

            this.renderSlideshowConfig(mergedSlideshow.config);
            this.renderSlides(mergedSlideshow.slides);
            this.loadedFileName = 'slideshow_data.json';
            document.getElementById('fileNameDisplay').textContent = `Filename: ${this.loadedFileName}`;
        } catch (error) {
            console.error('Error loading slideshow:', error);
            alert('Invalid slideshow data. Loading default slideshow.');
            this.loadDefaultSlideshow();
        }
        this.setInitialStateHash(); // Set the initial state hash after loading
    }

    loadFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const slideshowData = JSON.parse(e.target.result);
                this.loadSlideshow(slideshowData);
                this.loadedFileName = file.name;
                document.getElementById('fileNameDisplay').textContent = `Filename: ${this.loadedFileName}`;
                document.querySelector('.funshow-builder-load-modal').remove();
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                alert('Invalid JSON file. Please try again.');
            }
        };
        reader.readAsText(file);
    }

    saveSlideshow() {
        const modal = document.createElement('div');
        modal.className = 'funshow-builder-modal';
        modal.innerHTML = `
            <div class="funshow-builder-modal-content">
                <h2>Choose Download Type</h2>
                <div class="funshow-builder-download-options">
                    <div class="funshow-builder-download-option" data-type="json">
                        <svg viewBox="0 0 24 24" width="48" height="48">
                            <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1 0.9 2 2 2h12c1.1 0 2-0.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                        <p>JSON</p>
                        <small>Download raw JSON data</small>
                    </div>
                    <div class="funshow-builder-download-option funshow-env-hide-if-local" data-type="user">
                        <svg viewBox="0 0 24 24" width="48" height="48">
                            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                            <path d="M10 16l5-3-5-3v6z" fill="#fff"/>
                        </svg>
                        <p>Slideshow Folder</p>
                        <small>Package for end-users</small>
                    </div>
                    <div class="funshow-builder-download-option funshow-env-hide-if-local" data-type="dev">
                        <svg viewBox="0 0 24 24" width="48" height="48">
                            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                        </svg>
                        <p>Developer Build</p>
                        <small>Full package for developers</small>
                    </div>
                </div>
                <div class="funshow-builder-version-select funshow-builder-viewer-version-select funshow-env-hide-if-local">
                    <select disabled>
                        <option value="alpha">FunShow v0.0.1 ALPHA</option>
                    </select>
                    <label>
                        <input type="checkbox" id="viewerInclude">
                        Include
                    </label>
                </div>
                <div class="funshow-builder-modal-buttons">
                    <button class="funshow-builder-modal-button funshow-builder-modal-button-secondary" id="cancelDownload">
                        <div class="funshow-builder-button-content">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M15 9l-6 6"></path>
                                <path d="M9 9l6 6"></path>
                            </svg>
                            Cancel
                        </div>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const downloadOptions = modal.querySelectorAll('.funshow-builder-download-option');
        downloadOptions.forEach(option => {
            option.addEventListener('click', async () => {
                const downloadType = option.dataset.type;
                const viewerInclude = document.getElementById('viewerInclude').checked;
                //const builderInclude = document.getElementById('builderInclude').checked;

                this.showSpinner(modal);

                try {
                    if (downloadType === 'json') {
                        await this.downloadJSON({viewerInclude});
                    } else {
                        await this.packAndDownload({ type: downloadType, viewerInclude });
                    }
                    this.showSuccessMessage(modal, downloadType);
                } catch (error) {
                    this.showErrorMessage(modal, error);
                }
            });
        });

        document.getElementById('cancelDownload').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    showSpinner(modal) {
        const content = modal.querySelector('.funshow-builder-modal-content');
        content.innerHTML = `
            <div class="funshow-builder-spinner"></div>
            <p>Please wait...</p>
        `;
    }

    showSuccessMessage(modal, downloadType) {
        const content = modal.querySelector('.funshow-builder-modal-content');
        content.innerHTML = `
            <h2>Success</h2>
            <div class="funshow-checkmark-appear">
                <svg class="funshow-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                    <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
            </div>
            <div style="margin-bottom: 40px;">
                <p>Your content should be downloading.</p>
                <p>Otherwise, use the button below to download it manually.</p>
            </div>

            <button class="funshow-builder-modal-button funshow-builder-modal-button-secondary" id="manualDownload">
                <div class="funshow-builder-button-content">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Manual Download
                </div>
            </button>
            <button class="funshow-builder-modal-button funshow-builder-modal-button-primary" id="closeModal">
                <div class="funshow-builder-button-content">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    OK
                </div>
            </button>
        `;

        const funShowCheckmarkAppear = content.querySelector('.funshow-checkmark-appear');
        funShowCheckmarkAppear.offsetWidth;
        funShowCheckmarkAppear.style.opacity = '1';

        document.getElementById('manualDownload').addEventListener('click', () => {
            if (downloadType === 'json') {
                this.downloadJSON();
            } else {
                this.downloadDeveloper({ type: downloadType });
            }
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    showErrorMessage(modal, error) {
        const content = modal.querySelector('.funshow-builder-modal-content');
        content.innerHTML = `
            <h2>ERROR: Failed to build</h2>
            <p>An error occurred during the build process:</p>
            <pre>${error.message}</pre>
            <button class="funshow-builder-modal-button funshow-builder-modal-button-secondary" id="closeModal">OK</button>
        `;

        document.getElementById('closeModal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    async generateJSON(resolveBlobs=true) {
        const slideshowConfig = this.getSlideshowConfig();
        const slideElements = this.getSlides();
        const slideshow = {
            config: {},
            slides: []
        };

        // Filter slideshow config to include only properties in the schema
        for (const key in this.schema.slideshow.config) {
            if (key in slideshowConfig) {
                if( this.schema.slideshow.config[key].type === 'range' ) {
                    slideshow.config[key] = Number(slideshowConfig[key]);
                }
                else {
                    slideshow.config[key] = slideshowConfig[key];
                }
            }
        }

        // Process slides
        slideshow.slides = slideElements.map(slideElement => {
            const slide = slideElement.slide;
            const filteredSlide = {};

            // Add non-config properties that exist in the schema
            for (const key in this.schema.slide) {
                if (key !== 'config' && key in slide) {
                    //console.log('blob logic', resolveBlobs, slide[key], slide.handle, slide.directoryHandle);
                    if (resolveBlobs && key === 'file' && !slide[key].indexOf('blob:') && (slide.handle || slide.directoryHandle)) {
                        // Handle blob files
                        if (slide.directoryHandle) {
                            filteredSlide[key] = `${slide.directoryHandle.name}/${slide.handle.name}`;
                        } else {
                            filteredSlide[key] = slide.handle.name;
                        }
                    } else {
                        if( this.schema.slide[key].type === 'range' ) {
                            filteredSlide[key] = Number(slide[key]);
                        }
                        else {
                            filteredSlide[key] = slide[key];
                        }
                    }
                }
            }

            // Add config properties that exist in the schema and are checked
            filteredSlide.config = {};
            for (const key in this.schema.slide.config) {
                const formGroup = slideElement.querySelector(`[data-property-ref="${key}"]`);
                if (formGroup) {
                    const checkbox = formGroup.querySelector('.funshow-builder-slide-config-checkbox');
                    if (checkbox && checkbox.checked && key in slide.config) {
                        if( this.schema.slide.config[key].type === 'range' ) {
                            filteredSlide.config[key] = Number(slide.config[key]);
                        }
                        else {
                            filteredSlide.config[key] = slide.config[key];
                        }
                    }
                }
            }

            return filteredSlide;
        });

        return slideshow; 
    }

    async downloadJSON() {
        const slideshow = await this.generateJSON();
        const jsonString = JSON.stringify(slideshow, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.loadedFileName || 'slideshow_config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.loadedFileName = a.download;
        document.getElementById('fileNameDisplay').textContent = `Filename: ${this.loadedFileName}`;
        this.setInitialStateHash(); // Update the initial state hash after saving
    }

    async packAndDownload({ type, viewerInclude }) {
        // Simulating an asynchronous operation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Here you would implement the actual packing logic
        // For now, we'll just throw an error if it's not implemented
        throw new Error('Pack and download not implemented for ' + type);
    }

    downloadDeveloper({ type }) {
        // Implement the developer download logic here
        console.log('Downloading developer package for type:', type);
    }

    loadDefaultSlideshow(slides) {
        const defaultSlideshow = window.funShowEnvironment.generateDefaultSlideshow();
        
        // Set lastUsedPath before rendering
        this.updateLastUsedPath(defaultSlideshow.config);

        this.renderSlideshowConfig(defaultSlideshow.config);
        this.renderSlides(slides ?? defaultSlideshow.slides);
        this.loadedFileName = 'slideshow_data.json';
        document.getElementById('fileNameDisplay').textContent = 'Filename: slideshow_data.json';

        // Uncheck all config checkboxes for the default slideshow
        const slideElements = document.querySelectorAll('.funshow-builder-slide');
        slideElements.forEach(slideElement => {
            const configCheckboxes = slideElement.querySelectorAll('.funshow-builder-slide-config-checkbox');
            configCheckboxes.forEach(checkbox => checkbox.checked = false);
        });
        this.setInitialStateHash(); // Set the initial state hash after loading default
    }

    getSlideshowConfig() {
        const configContainer = document.getElementById('slideshowConfig');
        const config = {};
        const formGroups = configContainer.querySelectorAll('.funshow-builder-form-group');
        formGroups.forEach(group => {
            const input = group.querySelector('input, select, textarea');
            const propertyRef = group.dataset.propertyRef;
            let value = input.type === 'checkbox' ? input.checked : input.value;
            config[propertyRef] = value;
        });
        return config;
    }

    getSlides() {
        const slideElements = document.querySelectorAll('.funshow-builder-slide');
        return Array.from(slideElements).map(slideElement => {
            this.updateSlideFromForm(slideElement);
            return slideElement;//slideElement.slide;
        });
    }

    showHelpFlyout(text) {
        const flyout = document.getElementById('helpFlyout');
        flyout.textContent = text;
        flyout.style.opacity = '1';
    }

    hideHelpFlyout() {
        const flyout = document.getElementById('helpFlyout');
        flyout.style.opacity = '0';
    }

    createFormGroup(key, schema, value, isSlide = false, isConfigProperty = false) {
        const formGroup = document.createElement('div');
        formGroup.className = 'funshow-builder-form-group';
        if (schema.help) {
            formGroup.setAttribute('data-help', schema.help);
        }
        
        if (isSlide && isConfigProperty) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'funshow-builder-slide-config-checkbox';
            checkbox.checked = false; // Default to unchecked
            formGroup.appendChild(checkbox);
        }

        const label = document.createElement('label');
        label.textContent = schema.label || key;
        formGroup.appendChild(label);

        let input;
        switch (schema.type) {
            case 'dropdown':
                input = document.createElement('select');
                schema.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.label || option.value;
                    if (option.value === value) optionElement.selected = true;
                    input.appendChild(optionElement);
                });
                break;
            case 'checkbox':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value;
                break;
            case 'range':
                const rangeContainer = document.createElement('div');
                rangeContainer.style.display = 'flex';
                rangeContainer.style.alignItems = 'center';
                rangeContainer.style.flex = '1';
                
                input = document.createElement('input');
                input.type = 'range';
                input.min = schema.min;
                input.max = schema.max;
                input.step = 0.01;
                input.value = value;
                
                if (isSlide) {
                    input.className = 'funshow-builder-slide-range';
                }
                
                const rangeValue = document.createElement('span');
                rangeValue.className = 'funshow-builder-range-value';
                rangeValue.textContent = Number(value).toFixed(2);
                
                input.addEventListener('input', () => rangeValue.textContent = Number(input.value).toFixed(2));
                
                rangeContainer.appendChild(input);
                rangeContainer.appendChild(rangeValue);
                formGroup.appendChild(rangeContainer);
                break;
            case 'color':
                input = document.createElement('input');
                input.type = 'color';
                input.value = value;
                break;
            case 'textarea':
                input = document.createElement('textarea');
                input.value = value;
                input.rows = 2;
                break;
            default:
                input = document.createElement('input');
                input.type = 'text';
                input.value = value;
        }

        //if (isSlide) {
            //input.style.width = '150px';
        //}

        if (input.type !== 'range') {
            formGroup.appendChild(input);
        }

        // Store reference to the associated data object and property
        formGroup.dataset.objectRef = isSlide ? (isConfigProperty ? 'slide.config' : 'slide') : 'slideshow';
        formGroup.dataset.propertyRef = key;

        // Add event listener to check the checkbox when the input value changes
        if (isSlide && isConfigProperty) {
            input.addEventListener('change', () => {
                const checkbox = formGroup.querySelector('.funshow-builder-slide-config-checkbox');
                checkbox.checked = true;
            });
        }

        return formGroup;
    }

    renderSlideshowConfig(config) {
        const configContainer = document.getElementById('slideshowConfig');
        configContainer.innerHTML = '';
        for (const [key, value] of Object.entries(this.schema.slideshow.config)) {
            const formGroup = this.createFormGroup(key, value, config[key]);
            configContainer.appendChild(formGroup);
        }

        // Add event listeners for workingDirectory and contentPath
        const workingDirectoryInput = configContainer.querySelector('[data-property-ref="workingDirectory"] input');
        const contentPathInput = configContainer.querySelector('[data-property-ref="contentPath"] input');

        if (workingDirectoryInput) {
            workingDirectoryInput.addEventListener('blur', () => this.updateSlidePreviews());
            workingDirectoryInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    workingDirectoryInput.blur();
                }
            });
        }

        if (contentPathInput) {
            contentPathInput.addEventListener('blur', () => this.updateSlidePreviews());
            contentPathInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    contentPathInput.blur();
                }
            });
        }
    }

    dragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('funshow-builder-slide') && !e.target.classList.contains('dragging')) {
            e.target.classList.add('drag-over');
        }
    }

    dragOver(e) {
        e.preventDefault();
    }

    dragLeave(e) {
        e.target.classList.remove('drag-over');
    }

    addSlides(slidesToAdd, addToFront) {
        const slidesContainer = document.getElementById('slidesContainer');
        const addSlideButton = slidesContainer.querySelector('.funshow-builder-add-slide-rear');
        const addSlideToFrontButton = slidesContainer.querySelector('.funshow-builder-add-slide-front');

        // Create an array to iterate over
        const slidesArray = addToFront ? [...slidesToAdd].reverse() : slidesToAdd;

        slidesArray.forEach((slide) => {
            const slideElement = this.createSlideElement(slide, this.getSlideCount());
            if (addToFront) {
                addSlideToFrontButton.parentNode.insertBefore(slideElement, addSlideToFrontButton.nextSibling);
            } else {
                slidesContainer.insertBefore(slideElement, addSlideButton);
            }
        });

        this.makeSlidesDraggable();
        this.updateSlideNumbers();
    }

    createAddSlideButton() {
        const addSlideButton = document.createElement('div');
        addSlideButton.className = 'funshow-builder-add-slide';
        this.applyBuilderZoomToSlideElement(addSlideButton);

        addSlideButton.addEventListener('click', () => this.addNewSlide((addSlideButton.classList.contains('funshow-builder-add-slide-front'))));

        const dragAndDropBuilder = new FunShowMediaLibraryDragAndDropBuilder({
            container: addSlideButton,
            modestStyle: true,
            autoDestruct: false,
            dropHTML: '+'
        });

        dragAndDropBuilder.on('ready', (items) =>{ 
            const slides = this.processDroppedMediaLibrary(items).map(customSlide => {
                const defaultSlide = window.funShowEnvironment.createDefaultSlide();
                return {
                    ...defaultSlide,
                    ...customSlide,
                    config: { ...defaultSlide.config, ...customSlide.config }
                };
            });
            this.addSlides(slides, (addSlideButton.classList.contains('funshow-builder-add-slide-front')));
        });

        return addSlideButton;
    }

    renderSlides(slides) {
        const slidesContainer = document.getElementById('slidesContainer');
        slidesContainer.innerHTML = '';
        slidesContainer.classList.add('funshow-builder-slides-empty');
        
        // Create and add the first "Add Slide" button
        const addSlideButtonFront = this.createAddSlideButton();
        addSlideButtonFront.classList.add('funshow-builder-hide-if-noslides', 'funshow-builder-add-slide-front');
        slidesContainer.appendChild(addSlideButtonFront);
        
        this.addSlides(slides);
        
        // Create and add the second "Add Slide" button
        const addSlideButtonBack = this.createAddSlideButton();
        addSlideButtonBack.classList.add('funshow-builder-add-slide-rear');
        slidesContainer.appendChild(addSlideButtonBack);
    }

    processDroppedMediaLibrary(items) {
        const funShowItems = [];
        const hasChildSlides = (folderId) => {
            return Object.values(items).some(item => item.parent === folderId && (item.type === 'image' || item.type === 'video'));
        };

        const addFolderAndFiles = (folderId) => {
            const folder = items[folderId];
            if (hasChildSlides(folderId)) {
                funShowItems.push({
                    title: folder.name,
                    type: 'category'
                });

                for (const itemId in items) {
                    const item = items[itemId];
                    if (item.parent === folderId && (item.type === 'image' || item.type === 'video')) {
                        funShowItems.push({
                            file: URL.createObjectURL(item.file),
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
        for (const itemId in items) {
            const item = items[itemId];
            if ((item.type === 'image' || item.type === 'video') && !item.parent) {
                funShowItems.push({
                    file: URL.createObjectURL(item.file),
                    title: item.name,
                    type: item.type,
                    handle: item
                });
            }
        }

        // Add folders and their child slides
        for (const itemId in items) {
            const item = items[itemId];
            if (item.type === 'folder' && !item.parent) {
                addFolderAndFiles(itemId);
            }
        }

        return funShowItems;
    }

    createSlideElement(slide, index) {
        const slideElement = document.createElement('div');

        this.applyBuilderZoomToSlideElement(slideElement);

        slideElement.className = 'funshow-builder-slide funshow-builder-scrollable';
        //slideElement.id = `slide-${index}`;
        slideElement.slide = slide;  // Store the slide object on the element itself
        
        const slideInfoWrapper = document.createElement('div');
        slideInfoWrapper.style.position = 'relative';
        slideInfoWrapper.style.transform = 'translate(-19px, -19px)';
        
        const slideInfo = document.createElement('div');
        slideInfo.className = 'funshow-builder-slide-info';
        
        const slideNumber = document.createElement('div');
        slideNumber.className = 'funshow-builder-slide-number';
        slideNumber.textContent = index + 1;
        slideInfo.appendChild(slideNumber);

        const slideInfoActions = document.createElement('div');
        slideInfoActions.className = 'funshow-builder-slide-info-actions';
        slideInfo.appendChild(slideInfoActions);

        const editIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        editIcon.setAttribute('class', 'funshow-builder-slide-edit-icon');
        editIcon.setAttribute('width', '16');
        editIcon.setAttribute('height', '16');
        editIcon.setAttribute('viewBox', '0 0 16 16');
        editIcon.innerHTML = '<path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>';
        slideInfoActions.appendChild(editIcon);

        const deleteIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        deleteIcon.setAttribute('class', 'funshow-builder-slide-delete-icon');
        deleteIcon.setAttribute('width', '16');
        deleteIcon.setAttribute('height', '16');
        deleteIcon.setAttribute('viewBox', '0 0 16 16');
        deleteIcon.innerHTML = '<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>';
        slideInfoActions.appendChild(deleteIcon);

        slideInfoWrapper.appendChild(slideInfo);
        slideElement.appendChild(slideInfoWrapper);

        const previewElement = document.createElement('div');
        previewElement.className = 'funshow-builder-slide-preview';
        this.updateSlidePreview(slide, previewElement);
        slideElement.appendChild(previewElement);

        const editContent = document.createElement('div');
        editContent.className = 'funshow-builder-slide-edit-content';
        
        for (const [key, value] of Object.entries(this.schema.slide)) {
            if (key !== 'config') {
                const formGroup = this.createFormGroup(key, value, slide[key], true);
                editContent.appendChild(formGroup);
            }
        }
        
        const configTitle = document.createElement('h4');
        configTitle.textContent = 'Slide Config';
        editContent.appendChild(configTitle);
        
        for (const [key, schema] of Object.entries(this.schema.slide.config)) {
            const formGroup = this.createFormGroup(key, schema, slide.config[key], true, true);
            const checkbox = formGroup.querySelector('.funshow-builder-slide-config-checkbox');
            //console.log(key, slide.config[key], schema.default);
            if (checkbox && slide.config[key] != schema.default) {
                checkbox.checked = key in slide.config;
            }
            editContent.appendChild(formGroup);
        }

        slideElement.appendChild(editContent);

        const deleteConfirmation = document.createElement('div');
        deleteConfirmation.className = 'funshow-builder-slide-delete-confirmation';
        deleteConfirmation.innerHTML = `
            <div>Delete - are you sure?</div>
            <div class="funshow-builder-delete-confirm-buttons">
                <button class="funshow-builder-delete-confirm-button funshow-builder-delete-confirm-yes">Yes</button>
                <button class="funshow-builder-delete-confirm-button funshow-builder-delete-confirm-cancel">Cancel</button>
            </div>
        `;
        slideElement.appendChild(deleteConfirmation);

        return slideElement;
    }

    setCheckboxes(slideElement) {
        const slide = slideElement.slide;
        // Uncheck all config checkboxes for slides that weren't in the imported data
        const configCheckboxes = slideElement.querySelectorAll('.funshow-builder-slide-config-checkbox');
        configCheckboxes.forEach(checkbox => {
            const propertyRef = checkbox.closest('.funshow-builder-form-group').dataset.propertyRef;
            checkbox.checked = (slide.config) ? propertyRef in slide.config : false;
        });
    }

    addNewSlide(addToFront) {
        const newSlide = window.funShowEnvironment.createDefaultSlide();
        if( newSlide.type == 'html' ) {
            newSlide.title = 'My Slide';
            newSlide.file = '<div style="font-size: min(10vh, 10vw);">Content</div>';
        }
        const slideElement = this.createSlideElement(newSlide, this.getSlideCount());
        delete newSlide.config;
        this.setCheckboxes(slideElement);
        const slidesContainer = document.getElementById('slidesContainer');

        if (addToFront) {
            slidesContainer.insertBefore(slideElement, slidesContainer.firstElementChild.nextSibling);
        } else {
            slidesContainer.insertBefore(slideElement, slidesContainer.lastElementChild);
        }

        this.makeSlidesDraggable();
        this.updateSlideNumbers();
    }

    deleteSlide(e) {
        const slide = e.currentTarget.closest('.funshow-builder-slide');
        slide.remove();
        this.updateSlideNumbers();
    }

    getSlideCount() {
        return document.querySelectorAll('.funshow-builder-slide').length;
    }

    updateSlideNumbers() {
        const slides = document.querySelectorAll('.funshow-builder-slide');
        slides.forEach((slide, index) => {
            const slideNumber = slide.querySelector('.funshow-builder-slide-number');
            slideNumber.textContent = index + 1;
        });

        if( slides.length > 0 ) {
            slidesContainer.classList.remove('funshow-builder-slides-empty');
        }
        else {   
            slidesContainer.classList.add('funshow-builder-slides-empty');
        }
    }

    makeSlidesDraggable() {
        const slides = document.querySelectorAll('.funshow-builder-slide');
        slides.forEach(slide => {
            if (slide.draggable) {
                return;
            }

            slide.draggable = true;
            slide.addEventListener('mousedown', this.slideMouseDown.bind(this));
            slide.addEventListener('dragstart', this.dragStart.bind(this));
            slide.addEventListener('dragenter', this.dragEnter.bind(this));
            slide.addEventListener('dragover', this.dragOver.bind(this));
            slide.addEventListener('dragleave', this.dragLeave.bind(this));
            slide.addEventListener('drop', this.drop.bind(this));
            slide.addEventListener('dragend', this.dragEnd.bind(this));


            if(!slide.hasEditListeners) {
                slide.hasEditListeners = true;
                const editIcon = slide.querySelector('.funshow-builder-slide-edit-icon');
                editIcon.addEventListener('click', this.toggleSlideEdit.bind(this));

                const deleteIcon = slide.querySelector('.funshow-builder-slide-delete-icon');
                deleteIcon.addEventListener('click', this.toggleSlideDeleteConfirmation.bind(this));

                const deleteConfirmYes = slide.querySelector('.funshow-builder-delete-confirm-yes');
                deleteConfirmYes.addEventListener('click', this.deleteSlide.bind(this));

                const deleteConfirmCancel = slide.querySelector('.funshow-builder-delete-confirm-cancel');
                deleteConfirmCancel.addEventListener('click', this.toggleSlideDeleteConfirmation.bind(this));
            }
        });
    }

    toggleSlideEdit(e) {
        const slide = e.currentTarget.closest('.funshow-builder-slide');
        slide.classList.toggle('funshow-builder-edit');
        if( !slide.classList.contains('funshow-builder-edit') ) {
            this.updateSlideFromForm(slide);
        }
    }

    toggleSlideDeleteConfirmation(e) {
        const slide = e.currentTarget.closest('.funshow-builder-slide');
        slide.classList.toggle('funshow-builder-delete-confirm');
    }

    deleteSlide(e) {
        const slide = e.currentTarget.closest('.funshow-builder-slide');
        slide.remove();
        this.updateSlideNumbers();
    }

    updateSlideFromForm(slideElement) {
        const slideData = this.getSlideDataFromForm(slideElement);
        Object.assign(slideElement.slide, slideData);
        this.updateSlidePreview(slideElement.slide, slideElement.querySelector('.funshow-builder-slide-preview'));
    }

    getSlideDataFromForm(slideElement) {
        const slideData = { config: {} };
        const formGroups = slideElement.querySelectorAll('.funshow-builder-form-group');
        formGroups.forEach(group => {
            const input = group.querySelector('input:not(.funshow-builder-slide-config-checkbox), select, textarea');
            const propertyRef = group.dataset.propertyRef;
            let value = input.type === 'checkbox' ? input.checked : input.value;

            if (group.dataset.objectRef === 'slide.config') {
                const checkbox = group.querySelector('.funshow-builder-slide-config-checkbox');
                if (checkbox && checkbox.checked) {
                    slideData.config[propertyRef] = value;
                }
            } else if (group.dataset.objectRef === 'slide') {
                slideData[propertyRef] = value;
            }
        });
        return slideData;
    }

    calculatePath() {
        const workingDirectoryInput = document.querySelector('[data-property-ref="workingDirectory"] input');
        const contentPathInput = document.querySelector('[data-property-ref="contentPath"] input');

        let path = (workingDirectoryInput && workingDirectoryInput.value !== '') 
            ? workingDirectoryInput.value 
            : ((contentPathInput && contentPathInput.value !== '') ? contentPathInput.value : '');

        // Replace backward slashes with forward slashes
        path = path.replace(/\\/g, '/');

        // Add a trailing slash if it's not present
        if (path && !path.endsWith('/')) {
            path += '/';
        }

        return path;
    }

    updateSlidePreviews() {
        const newPath = this.calculatePath();
        if (newPath !== this.lastUsedPath) {
            this.lastUsedPath = newPath;
            const slides = document.querySelectorAll('.funshow-builder-slide');
            slides.forEach(slide => {
                const previewElement = slide.querySelector('.funshow-builder-slide-preview');
                this.updateSlidePreview(slide.slide, previewElement);
            });
        }
    }

    updateSlidePreview(slideData, previewElement) {
        const pathToUse = (slideData.file.indexOf('blob:') != 0 || !slideData.handle) ? this.lastUsedPath : '';
        const mediaUrl = `${pathToUse}${slideData.file}`;
        //const mediaUrl = window.funShowEnvironment.prepareMediaSrc(slideData, this.lastUsedPath); // NOTE: We are different here than the EnvironmentDector's because in the builder "file" can be a blob, while in the viewer (ie. everywhere else) the handle is stored in "handle".  TODO: Unify this.

        const typeOption = this.schema.slide.type.options.find(option => option.value === slideData.type);
        const typeLabel = typeOption ? typeOption.label : 'Other';
        previewElement.innerHTML = `<div>${typeLabel}</div>`;

        if (slideData.title) {
            const titleElement = document.createElement('div');
            titleElement.textContent = slideData.title;
            titleElement.style.fontSize = '16px';
            titleElement.style.marginTop = '10px';
            previewElement.appendChild(titleElement);
        }

        if (slideData.type === 'image') {
            //previewElement.style.backgroundImage = `url("${pathToUse}${slideData.file}")`;
            previewElement.style.backgroundImage = `url("${mediaUrl}")`;
        }
    }

    slideMouseDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            e.stopPropagation();
            e.target.closest('.funshow-builder-slide').draggable = false;
        } else {
            e.target.closest('.funshow-builder-slide').draggable = true;
        }
    }

    dragStart(e) {
        //e.dataTransfer.setData('text/plain', e.target.id);
        this.activeDraggedElement = e.target;
        e.dataTransfer.setData('text/plain', 'active-dragged-object');
        e.target.classList.add('dragging');
    }

    drop(e) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text');
        const draggableElement = this.activeDraggedElement;//document.getElementById(id);
        const dropzone = e.target.closest('.funshow-builder-slide');
        
        if (dropzone && draggableElement !== dropzone) {
            const container = dropzone.parentNode;
            const draggableIndex = Array.from(container.children).indexOf(draggableElement);
            const dropzoneIndex = Array.from(container.children).indexOf(dropzone);
            
            if (draggableIndex < dropzoneIndex) {
                container.insertBefore(draggableElement, dropzone.nextSibling);
            } else {
                container.insertBefore(draggableElement, dropzone);
            }
            this.updateSlideNumbers();
        }
        
        this.dragEnd(e);
    }

    dragEnd(e) {
        const slides = document.querySelectorAll('.funshow-builder-slide');
        slides.forEach(slide => {
            slide.classList.remove('dragging');
            slide.classList.remove('drag-over');
            slide.draggable = true;
        });
    }
}