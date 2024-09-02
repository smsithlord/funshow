class FunShowSplash extends FunShowEventEmitter {
    constructor(container) {
        super();
        this.container = container;
        this.givenContainer = this.container;
        if (!this.container) {
            this.container = document.createElement('div');
            document.body.appendChild(this.container);
        }
        this.injectCSS();
        this.injectHTML();
        this.bindEvents();
    }

    destroy() {
        // Emit the destroy event
        this.emit('destroy');

        // Remove the injected CSS
        const styleElement = document.head.querySelector('style[data-funshow-splash-style]');
        if (styleElement) {
            document.head.removeChild(styleElement);
        }

        // Clear the container
        this.container.innerHTML = '';

        // Remove all event listeners
        this.off();

        if (this.container != this.givenContainer) {
            this.container.remove();
        }
        this.givenContainer = null;

        // Clear any references
        this.container = null;
    }

    injectCSS() {
        const style = document.createElement('style');
        style.setAttribute('data-funshow-splash-style', '');
        const styles = `
            .funshow-splash-wrapper {
                font-family: Arial, sans-serif;
                background-color: #121212;
                color: #ffffff;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                min-height: 100vh;
                margin: 0;
                padding: 2rem 0;
                box-sizing: border-box;
                width: 100%;
                height: 100%;
            }

            .funshow-splash-main-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                flex-grow: 1;
            }

            .funshow-splash-app-header {
                display: flex;
                align-items: center;
                font-size: 4rem;
                margin-bottom: 2rem;
                animation: funshow-splash-fadeIn 1s ease-out;
            }

            .funshow-splash-app-icon {
                width: 100px;
                height: 100px;
                margin-right: 1rem;
            }

            .funshow-splash-instructions {
                text-align: center;
                margin-bottom: 2rem;
                max-width: 600px;
                animation: funshow-splash-fadeIn 1s ease-out 0.5s both;
            }

            .funshow-splash-options {
                display: flex;
                gap: 2rem;
            }

            .funshow-splash-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 1.5rem;
                border-radius: 10px;
                background-color: #1e1e1e;
                cursor: pointer;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                animation: funshow-splash-fadeIn 1s ease-out 1s both;
            }

            .funshow-splash-option:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);
            }

            .funshow-splash-option svg {
                width: 64px;
                height: 64px;
                margin-bottom: 1rem;
            }

            .funshow-splash-option-label {
                font-size: 1.5rem;
            }

            .funshow-splash-help-option {
                display: flex;
                align-items: center;
                padding: 0.75rem 1.5rem;
                border-radius: 5px;
                background-color: #1e1e1e;
                margin-top: 40px;
                cursor: pointer;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                animation: funshow-splash-fadeIn 1s ease-out 1.5s both;
            }

            .funshow-splash-help-option:hover {
                transform: translateY(-3px);
                box-shadow: 0 3px 10px rgba(255, 255, 255, 0.1);
            }

            .funshow-splash-help-option svg {
                width: 24px;
                height: 24px;
                margin-right: 0.5rem;
            }

            .funshow-splash-help-option-label {
                font-size: 1rem;
            }

            @keyframes funshow-splash-fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .funshow-splash-footer {
                font-size: 0.8rem;
                text-align: center;
                opacity: 0.7;
                margin-top: 2rem;
            }

            .funshow-splash-footer-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-bottom: 15px;
            }

            .funshow-splash-footer-link {
                display: inline-flex;
                align-items: center;
                color: #ffffff;
                text-decoration: none;
                transition: color 0.3s ease;
            }

            .funshow-splash-footer-link:hover {
                color: #4a90e2;
            }

            .funshow-splash-footer-link svg {
                width: 16px;
                height: 16px;
                margin-left: 5px;
            }

            .funshow-splash-footer-link span {
                font-weight: bold;
            }
        `;
        style.textContent = styles;
        document.head.appendChild(style);
    }

    injectHTML() {
        this.container.innerHTML = `
            <div class="funshow-splash-wrapper">
                <div class="funshow-splash-main-content">
                    <div class="funshow-splash-app-header">
                        <svg class="funshow-splash-app-icon" viewBox="18 21 33 22" xmlns="http://www.w3.org/2000/svg">
                            <g fill="currentColor">
                                <path d="M20 25h22v15H20z" stroke="currentColor" stroke-width="1" fill="none"/>
                                <path d="M24 28l16 8-16 8V28z"/>
                                <circle cx="48" cy="24" r="3"/>
                                <circle cx="48" cy="32" r="3"/>
                                <circle cx="48" cy="40" r="3"/>
                            </g>
                        </svg>
                        <span>FunShow</span>
                    </div>

                    <div class="funshow-splash-instructions">
                        Would you like to create a new show or view existing ones?
                    </div>

                    <div class="funshow-splash-options">
                        <div class="funshow-splash-option" data-option="builder">
                            <svg viewBox="19 19 33 25" xmlns="http://www.w3.org/2000/svg" class="funshow-toolbar-icon-builder">
                                <g fill="currentColor">
                                    <rect x="22" y="22" width="20" height="20" style="fill: #ffffff;"/>
                                    <path d="M26 26h12M26 32h12M26 38h12" stroke-width="1" fill="none" style="stroke: #ffffff"/>
                                    <path d="M26 26h12M26 32h12M26 38h12" stroke-width="1" style="stroke: #000000;"/>
                                    <path d="M46 22v20M50 26v12" stroke-width="2" fill="none" style="stroke: #ffffff"/>
                                    <circle cx="46" cy="22" r="2" style="fill: #ffffff"/>
                                    <circle cx="46" cy="42" r="2" style="fill: #ffffff"/>
                                    <circle cx="50" cy="26" r="2" style="fill: #ffffff"/>
                                    <circle cx="50" cy="38" r="2" style="fill: #ffffff"/>
                                </g>
                            </svg>
                            <span class="funshow-splash-option-label">Builder</span>
                        </div>
                        <div class="funshow-splash-option" data-option="viewer">
                            <svg viewBox="8 11 48 42" xmlns="http://www.w3.org/2000/svg">
                                <g fill="none" stroke="currentColor" stroke-width="2">
                                    <ellipse cx="32" cy="32" rx="16" ry="10"/>
                                    <path d="M20 32h-8M52 32h-8" stroke="currentColor" stroke-width="2"/>
                                    <circle cx="32" cy="32" r="5" stroke-width="3"/>
                                </g>
                            </svg>
                            <span class="funshow-splash-option-label">Viewer</span>
                        </div>
                    </div>

                    <div class="funshow-splash-help-option" data-option="help">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                        </svg>
                        <span class="funshow-splash-help-option-label">Help</span>
                    </div>
                </div>

                <div class="funshow-splash-footer">
                    <div class="funshow-splash-footer-links">
                        <a href="https://x.com/anarchyarcade" target="_blank" rel="noopener noreferrer" class="funshow-splash-footer-link funshow-splash-x-link">
                            <span>Created by SM Sith Lord</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </a>
                        <a href="https://github.com/smsithlord/funshow" target="_blank" rel="noopener noreferrer" class="funshow-splash-footer-link funshow-splash-github-link">
                            <span>View on GitHub</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                        </a>
                    </div>
                    <p>
                        This software is released under the MIT License.<br>
                        <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer" style="color: #ffffff;">https://opensource.org/licenses/MIT</a>
                    </p>
                </div>
            </div>
        `;
    }

    bindEvents() {
        this.optionClickHandler = this.optionClickHandler.bind(this);
        const options = this.container.querySelectorAll('.funshow-splash-option, .funshow-splash-help-option');
        options.forEach(option => {
            option.addEventListener('click', this.optionClickHandler);
        });
    }

    optionClickHandler(event) {
        const option = event.currentTarget.dataset.option;
        this.emit('optionSelected', option);
    }
}