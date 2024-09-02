class FunShowHelpInput extends FunShowEventEmitter {
    constructor(isTouch = false, force = false) {
        super();
        this.isTouch = isTouch;
        this.inputType = isTouch ? 'touch' : 'mouse';

        // Check if the tutorial has been completed before
        if (!force && this.isTutorialCompleted()) {
            this.destroy();
            return;
        }

        this.container = document.createElement('div');
        document.body.appendChild(this.container);
        this.injectCSS();
        this.injectHTML();
        this.bindEvents();
        this.currentStep = 0;
        this.steps = ['pan', 'zoom', 'rotate'];
        this.helpSchema = {
            mouse: {
                pan: {
                    label: 'PAN',
                    content: 'Left-click & move the mouse.'
                },
                zoom: {
                    label: 'ZOOM',
                    content: 'Middle-mouse & move up/down to zoom.'
                },
                rotate: {
                    label: 'ROTATE',
                    content: 'Right-mouse & move to rotate.'
                }
            },
            touch: {
                pan: {
                    label: 'PAN',
                    content: 'Two finger drag to pan.'
                },
                zoom: {
                    label: 'ZOOM',
                    content: 'Pinch with two fingers to zoom.'
                },
                rotate: {
                    label: 'ROTATE',
                    content: 'One finger to rotate.'
                }
            }
        };
        this.start();
    }

    isTutorialCompleted() {
        const inputHelpDone = JSON.parse(localStorage.getItem('inputHelpDone') || '{}');
        return inputHelpDone[this.inputType] === true;
    }

    markTutorialAsCompleted() {
        const inputHelpDone = JSON.parse(localStorage.getItem('inputHelpDone') || '{}');
        inputHelpDone[this.inputType] = true;
        localStorage.setItem('inputHelpDone', JSON.stringify(inputHelpDone));
    }

    destroy() {
        this.emit('destroy');
        const styleElement = document.head.querySelector('style[data-funshow-helpinput-style]');
        if (styleElement) {
            document.head.removeChild(styleElement);
        }
        if (this.container) {
            this.container.remove();
        }
        this.off();
        this.container = null;

        // Mark the tutorial as completed
        this.markTutorialAsCompleted();
    }

    injectCSS() {
        const style = document.createElement('style');
        style.setAttribute('data-funshow-helpinput-style', '');
        style.textContent = `
            ${this.getExistingStyles()}
            .funshow-help-input-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                background-color: rgba(0, 0, 0, 0.8);
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                font-family: Arial, sans-serif;
                color: white;
                z-index: 1000;
                opacity: 0;
                transition: all 0.3s ease-in-out;
            }
            .funshow-help-input-container.active {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            .funshow-help-input-container.fade-out {
                transform: translate(-50%, -50%) scale(0.9);
                opacity: 0;
            }
            .funshow-help-input-buttons {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-top: 20px;
            }
            .funshow-help-input-button {
                background-color: #4169E1;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: background-color 0.3s ease;
            }
            .funshow-help-input-button:hover {
                background-color: #3154b3;
            }
            .funshow-help-input-info-label {
                padding: 12px;
                font-size: 20px;
            }
        `;
        document.head.appendChild(style);
    }


    getExistingStyles() {
        // This method should return all the existing styles from the previous version
        // For brevity, I'm not including all the styles here, but you should copy them from the previous version
        return `
            .funshow-help-input-panel {
                display: flex;
                flex-direction: column;
            }
            .funshow-help-input-mouse-icon,
            .funshow-help-input-touch-icon {
                padding: 16px;
                display: none;
            }
            .funshow-help-input-panel-mode-mouse .funshow-help-input-mouse-icon {
                display: block;
            }
            .funshow-help-input-panel-mode-touch .funshow-help-input-touch-icon {
                display: block;
            }

            .funshow-help-input-touch-icon {
                padding: 16px;
                display: none;
            }

            .funshow-help-input-panel-mode-touch .funshow-help-input-touch-icon {
                display: block;
            }

            @keyframes funshow-help-input-clickLeftButton {
                0%, 100% { fill: #f5f5f5; }
                10%, 90% { fill: #4169E1; }
            }
            @keyframes funshow-help-input-clickRightButton {
                0%, 100% { fill: #f5f5f5; }
                10%, 90% { fill: #4169E1; }
            }
            @keyframes funshow-help-input-clickMouseWheel {
                0%, 100% { fill: #c0c0c0; }
                10%, 90% { fill: #4169E1; }
            }
            @keyframes funshow-help-input-moveMouse {
                0%, 100% { transform: translate(0, 0); }
                20% { transform: translate(-10px, 0); }
                40% { transform: translate(10px, 0); }
                60% { transform: translate(0, -10px); }
                80% { transform: translate(0, 10px); }
            }
            @keyframes funshow-help-input-zoomMouse {
                0%, 100% { transform: translate(0, 0); }
                33% { transform: translate(0, -10px); }
                66% { transform: translate(0, 10px); }
            }
            .funshow-help-input-mouse-pan .funshow-help-input-mouse-left-button {
                animation: funshow-help-input-clickLeftButton 4s ease-in-out infinite;
            }
            .funshow-help-input-mouse-pan .funshow-help-input-mouse {
                animation: funshow-help-input-moveMouse 4s ease-in-out infinite;
            }
            .funshow-help-input-mouse-rotate .funshow-help-input-mouse-right-button {
                animation: funshow-help-input-clickRightButton 4s ease-in-out infinite;
            }
            .funshow-help-input-mouse-rotate .funshow-help-input-mouse {
                animation: funshow-help-input-moveMouse 4s ease-in-out infinite;
            }
            .funshow-help-input-mouse-zoom .funshow-help-input-mouse-wheel {
                animation: funshow-help-input-clickMouseWheel 4s ease-in-out infinite;
            }
            .funshow-help-input-mouse-zoom .funshow-help-input-mouse {
                animation: funshow-help-input-zoomMouse 4s ease-in-out infinite;
            }



            .funshow-help-input-touch-point {
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
            }

            @keyframes funshow-help-input-touchMove {
                0%, 100% { transform: translate(0, 0); }
                25% { transform: translate(-10px, -10px); }
                50% { transform: translate(10px, 10px); }
                75% { transform: translate(10px, -10px); }
            }

            @keyframes funshow-help-input-touchPointFade {
                0%, 100% { opacity: 0; }
                10%, 90% { opacity: 1; }
            }

            /* Rotate animation */
            .funshow-help-input-touch-rotate .funshow-help-input-touch {
                animation: funshow-help-input-touchMove 4s ease-in-out infinite;
            }

            .funshow-help-input-touch-rotate .funshow-help-input-touch-point:first-child {
                animation: funshow-help-input-touchPointFade 4s ease-in-out infinite;
            }

            .funshow-help-input-touch-rotate .funshow-help-input-touch-point:first-child {
                opacity: 1;
            }

            /* Pan animation */
            .funshow-help-input-touch-pan .funshow-help-input-touch {
                animation: funshow-help-input-touchMove 4s ease-in-out infinite;
            }

            .funshow-help-input-touch-pan .funshow-help-input-touch-point {
                animation: funshow-help-input-touchPointFade 4s ease-in-out infinite;
            }

            /* Updated arrow styling and animations */
            .funshow-help-input-touch-rotated-group {
                transform: rotate(12deg);
                transform-origin: center;
            }

            @keyframes funshow-help-input-touch-zoomInArrows {
                0%, 45%, 100% { opacity: 0; }
                5%, 40% { opacity: 1; }
            }

            @keyframes funshow-help-input-touch-zoomOutArrows {
                0%, 55%, 100% { opacity: 0; }
                60%, 95% { opacity: 1; }
            }

            @keyframes funshow-help-input-touch-zoomInTop {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(10px); }
            }

            @keyframes funshow-help-input-touch-zoomInBottom {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            @keyframes funshow-help-input-touch-zoomOutTop {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            @keyframes funshow-help-input-touch-zoomOutBottom {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(10px); }
            }

            .funshow-help-input-touch-rotated-group path {
                stroke: #ffffff;
                opacity: 0;
            }

            @keyframes funshow-help-input-touch-zoomPointFade {
                0%, 100% { opacity: 0; }
                10%, 90% { opacity: 1; }
            }

            .funshow-help-input-touch-zoom .funshow-help-input-touch-point {
                animation: funshow-help-input-touch-zoomPointFade 4s ease-in-out infinite;
            }

            .funshow-help-input-touch-zoom .funshow-help-input-touch-zoom-in-top,
            .funshow-help-input-touch-zoom .funshow-help-input-touch-zoom-in-bottom {
                animation: funshow-help-input-touch-zoomInArrows 8s ease-in-out infinite,
                           funshow-help-input-touch-zoomInTop 1.2s ease-in-out infinite;
            }

            .funshow-help-input-touch-zoom .funshow-help-input-touch-zoom-in-bottom {
                animation: funshow-help-input-touch-zoomInArrows 8s ease-in-out infinite,
                           funshow-help-input-touch-zoomInBottom 1.2s ease-in-out infinite;
            }

            .funshow-help-input-touch-zoom .funshow-help-input-touch-zoom-out-top,
            .funshow-help-input-touch-zoom .funshow-help-input-touch-zoom-out-bottom {
                animation: funshow-help-input-touch-zoomOutArrows 8s ease-in-out infinite,
                           funshow-help-input-touch-zoomOutTop 1.2s ease-in-out infinite;
            }

            .funshow-help-input-touch-zoom .funshow-help-input-touch-zoom-out-bottom {
                animation: funshow-help-input-touch-zoomOutArrows 8s ease-in-out infinite,
                           funshow-help-input-touch-zoomOutBottom 1.2s ease-in-out infinite;
            }
        `;
    }

    injectHTML() {
        this.container.innerHTML = `
            <div class="funshow-help-input-container">
                <div class="funshow-help-input-panel">
                    <div class="funshow-help-input-mouse-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="160" viewBox="-4 -4 108 168">
                            <defs>
                                <linearGradient id="mouseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#999999;stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
                                </linearGradient>
                            </defs>
                            <g class="funshow-help-input-mouse">
                                <path d="M10 40 Q10 10 50 10 Q90 10 90 40 V120 Q90 150 50 150 Q10 150 10 120 Z" fill="url(#mouseGradient)" stroke="#000000" stroke-width="0"/>
                                <path class="funshow-help-input-mouse-left-button" d="M10 40 Q10 10 50 10 V70 H10 Z" fill="#f5f5f5" stroke="#000000" stroke-width="0"/>
                                <path class="funshow-help-input-mouse-right-button" d="M50 10 Q90 10 90 40 V70 H50 Z" fill="#f5f5f5" stroke="#000000" stroke-width="0"/>
                                <rect class="funshow-help-input-mouse-wheel" x="45" y="20" width="10" height="30" fill="#c0c0c0" stroke="#000000" stroke-width="0"/>
                            </g>
                        </svg>
                    </div>
                    <div class="funshow-help-input-touch-icon">
                        <svg width="100" height="100" viewBox="-14 -24 128 165" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <marker id="funshow-help-input-touch-arrowhead" refX="1" refY="26.2" orient="auto" viewBox="0 0 56.53 51.39" markerUnits="userSpaceOnUse" markerWidth="19.88" markerHeight="18.07">
                                    <path d="m 57.03 26.2l -51.39 -25.7 0 20.02 -5.14 0.01 0 11.38 5.14 -0.03 0 20.02 51.39 -25.7 z" style="fill:#ffffff;stroke:none"/>
                                </marker>
                            </defs>
                            <g class="funshow-help-input-touch">
                                <!-- Primary touch point circle -->
                                <circle class="funshow-help-input-touch-point" cx="25" cy="7" r="16" stroke="#4169E1" fill="#4169E1" stroke-width="4" />
                                <!-- Secondary touch point circle -->
                                <circle class="funshow-help-input-touch-point" cx="10" cy="80" r="16" stroke="#4169E1" fill="#4169E1" stroke-width="4" />
                                <!-- Original finger path -->
                                <path d="m27.17 0.89c4.1-0.39 7.12 2.54 8.77 5.85 2 4 3.13 8.49 4.97 12.57 2.43 5.41 4.82 10.87 7.02 16.37 0.16-1.56 0.3-4.28 1.17-5.55 2.72-3.95 8.26-5.89 12.28-2.92 3.08 2.27 3.77 6.07 5.26 9.06 0.34-1.72 0.37-4.17 1.46-5.55 2.69-3.43 7.97-4.94 11.7-2.05 2.86 2.22 3.52 6.15 4.97 9.06 0.13-1.35-0.02-3.92 0.88-5.26 3.1-4.65 9.37-6.08 13.45-1.46 1.23 1.4 1.71 3.58 2.34 5.26 1.42 3.78 3.02 7.72 4.68 11.4 2.64 5.86 4.68 11.98 7.31 17.83 1.39 3.08 2.99 6.21 3.51 9.65 1.66 11.06 0.18 23.39 2.34 34.21-15.18 6.07-30.15 12.64-45.33 18.71-4.95-2.47-9.59-5.63-14.62-7.89-6.61-2.98-13.19-5.37-19.3-9.65-6.7-4.69-12.67-11.28-19.01-16.66-1.05-0.89-1.84-1.8-2.92-2.63-0.91-0.7-2.37-1.27-3.22-2.05-3.64-3.36-9.7-9.36-4.39-13.74 2.95-2.43 9.22-1.59 12.58-0.58 3.94 1.18 6.92 3.57 10.53 5.55 5.32 2.93 11.35 5.84 17.25 6.43-4.31-10.77-8.69-21.58-13.45-32.16-5.02-11.15-9.02-22.76-14.04-33.91-2.06-4.58-5.16-10.29-2.92-15.49 0.64-1.5 2.4-2.36 3.51-3.22 0.78-0.6 2.26-1.08 3.22-1.17z" fill="#ffffff" fill-rule="evenodd"/>
                            </g>
                            <g class="funshow-help-input-touch-rotated-group">
                                <path class="funshow-help-input-touch-zoom-in-top" d="m -22 30 l 0 -9.74" style="fill:none;stroke-width:4;stroke-miterlimit:100;marker-end:url(#funshow-help-input-touch-arrowhead)"/>
                                <path class="funshow-help-input-touch-zoom-in-bottom" d="m -22 80 l 0 9.74" style="fill:none;stroke-width:4;stroke-miterlimit:100;marker-end:url(#funshow-help-input-touch-arrowhead)"/>
                                <path class="funshow-help-input-touch-zoom-out-top" d="m -22 20 l 0 9.74" style="fill:none;stroke-width:4;stroke-miterlimit:100;marker-end:url(#funshow-help-input-touch-arrowhead)"/>
                                <path class="funshow-help-input-touch-zoom-out-bottom" d="m -22 90 l 0 -9.74" style="fill:none;stroke-width:4;stroke-miterlimit:100;marker-end:url(#funshow-help-input-touch-arrowhead)"/>
                            </g>
                        </svg>
                    </div>
                    <div class="funshow-help-input-info">
                        <div class="funshow-help-input-info-label"></div>
                        <div class="funshow-help-input-info-content"></div>
                    </div>
                </div>
                <div class="funshow-help-input-buttons">
                    <button class="funshow-help-input-button" id="funshow-help-input-skip">Skip</button>
                    <button class="funshow-help-input-button" id="funshow-help-input-next">Next</button>
                </div>
            </div>
        `;
    }

    bindEvents() {
        this.skipButtonHandler = this.skip.bind(this);
        this.nextButtonHandler = this.nextStep.bind(this);
        this.container.querySelector('#funshow-help-input-skip').addEventListener('click', this.skipButtonHandler);
        this.container.querySelector('#funshow-help-input-next').addEventListener('click', this.nextButtonHandler);
    }

    showInputHelp(inputType, inputKey) {
        const container = this.container.querySelector('.funshow-help-input-container');
        const panel = this.container.querySelector('.funshow-help-input-panel');
        const infoLabel = this.container.querySelector('.funshow-help-input-info-label');
        const infoContent = this.container.querySelector('.funshow-help-input-info-content');
        const mouseIcon = this.container.querySelector('.funshow-help-input-mouse-icon');
        const touchIcon = this.container.querySelector('.funshow-help-input-touch-icon');
        const skipButton = this.container.querySelector('#funshow-help-input-skip');
        const nextButton = this.container.querySelector('#funshow-help-input-next');

        // Fade out
        container.classList.add('fade-out');

        setTimeout(() => {
            panel.className = 'funshow-help-input-panel';
            infoLabel.textContent = '';
            infoContent.textContent = '';
            mouseIcon.classList.remove('funshow-help-input-mouse-pan', 'funshow-help-input-mouse-zoom', 'funshow-help-input-mouse-rotate');
            touchIcon.classList.remove('funshow-help-input-touch-pan', 'funshow-help-input-touch-zoom', 'funshow-help-input-touch-rotate');

            if (!inputType || !inputKey) return;

            panel.offsetWidth; // Force reflow

            panel.classList.add(`funshow-help-input-panel-mode-${inputType}`);
            const helpInfo = this.helpSchema[inputType][inputKey];
            infoLabel.textContent = helpInfo.label;
            infoContent.textContent = helpInfo.content;

            if (inputType === 'mouse') {
                mouseIcon.classList.add(`funshow-help-input-mouse-${inputKey}`);
            } else if (inputType === 'touch') {
                touchIcon.classList.add(`funshow-help-input-touch-${inputKey}`);
            }

            // Update buttons for last step
            if (this.currentStep === this.steps.length - 1) {
                skipButton.style.display = 'none';
                nextButton.textContent = "Let's go!";
            } else {
                skipButton.style.display = 'inline-block';
                nextButton.textContent = 'Next';
            }

            // Fade in
            container.classList.remove('fade-out');
            container.classList.add('active');
        }, 300);
    }

    skip() {
        const container = this.container.querySelector('.funshow-help-input-container');
        container.classList.add('fade-out');
        setTimeout(() => {
            this.destroy();
        }, 300);
    }

    nextStep() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.skip();
        } else {
            this.showCurrentStep();
        }
    }

    start() {
        this.currentStep = 0;
        this.showCurrentStep();
        setTimeout(() => {
            const container = this.container.querySelector('.funshow-help-input-container');
            container.classList.add('active');
        }, 0);
    }

    prevStep() {
        this.currentStep = (this.currentStep - 1 + this.steps.length) % this.steps.length;
        this.showCurrentStep();
    }

    showCurrentStep() {
        const inputType = this.isTouch ? 'touch' : 'mouse';
        this.showInputHelp(inputType, this.steps[this.currentStep]);
    }

    showCurrentStep() {
        const inputType = this.isTouch ? 'touch' : 'mouse';
        this.showInputHelp(inputType, this.steps[this.currentStep]);
    }
}