class FunShowHelp extends FunShowEventEmitter {
    constructor(container) {
        super();
        this.container = container;
        this.givenContainer = this.container;
        if (!this.container) {
            this.container = document.createElement('div');
            document.body.appendChild(this.container);
        }
        this.originalBodyOverflow = document.body.style.overflow;
        this.setBodyOverflow();
        this.injectCSS();
        this.injectHTML();
        this.bindEvents();
        this.setHelpContent(this.getDefaultHelpContent());
    }


    destroy() {
        // Emit the destroy event
        this.emit('destroy');

        // Remove the injected CSS
        const styleElement = document.head.querySelector('style[data-funshow-help-style]');
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

        // Reset body overflow to its original value
        this.resetBodyOverflow();
    }

    setBodyOverflow() {
        document.body.style.overflow = 'auto';
    }

    resetBodyOverflow() {
        document.body.style.overflow = this.originalBodyOverflow;
    }

    injectCSS() {
        const style = document.createElement('style');
        style.setAttribute('data-funshow-help-style', '');
        const styles = `
            .funshow-help-wrapper {
                font-family: Arial, sans-serif;
                background-color: #121212;
                color: #ffffff;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                min-height: 100vh;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                width: 100%;
                gap: 0;
            }

            .funshow-help-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background-color: #1e1e1e;
                position: sticky;
                padding: 8px;
                top: 0;
                z-index: 1000;
                width: 100%;
                box-sizing: border-box;
            }

            .funshow-help-back-button {
                background: none;
                border: none;
                color: #ffffff;
                font-size: 1rem;
                cursor: pointer;
                padding: 0.5rem 1rem;
                transition: background-color 0.3s ease;
            }

            .funshow-help-back-button:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .funshow-help-header-title {
                font-size: 1.5rem;
                font-weight: bold;
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
            }

            .funshow-help-body {
                flex-grow: 1;
                padding: 2rem;
            }

            .funshow-help-content-container {
                max-width: 800px;
                margin: 0 auto;
            }

            .funshow-help-content-item {
                margin-bottom: 2rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 1rem;
            }

            .funshow-help-content-item:last-child {
                border-bottom: none;
            }

            .funshow-help-content-title {
                font-size: 1.2rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
                color: #4a90e2;
            }

            .funshow-help-content-body {
                font-size: 1rem;
                line-height: 1.6;
            }

            .funshow-help-footer {
                font-size: 0.8rem;
                text-align: center;
                opacity: 0.7;
                margin-top: 2rem;
                padding-bottom: 2rem;
                width: 100%;
            }

            .funshow-help-footer-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-bottom: 15px;
            }

            .funshow-help-footer-link {
                display: inline-flex;
                align-items: center;
                color: #ffffff;
                text-decoration: none;
                transition: color 0.3s ease;
            }

            .funshow-help-footer-link:hover {
                color: #4a90e2;
            }

            .funshow-help-footer-link svg {
                width: 16px;
                height: 16px;
                margin-left: 5px;
            }

            .funshow-help-footer-link span {
                font-weight: bold;
            }

            .funshow-help-title {
                margin: 0;
            }

            .emphasis {
                background-color: #333;
                letter-spacing: 0.1em;
                font-size: 0.9em;
                padding: 2px;
                padding-left: 4px;
                padding-right: 4px;
                border-radius: 4px;
            }
        `;
        style.textContent = styles;
        document.head.appendChild(style);
    }

    injectHTML() {
        this.container.innerHTML = `
            <div class="funshow-help-wrapper">
                <header class="funshow-help-header">
                    <button class="funshow-help-back-button" style="margin: 0 10px; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; background-color: #6c757d; color: #ffffff; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="height: 20px;">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
                        </svg>
                        <div>Back</div>
                    </button>
                    <h1 class="funshow-help-title">FunShow Help</h1>
                    <div style="width: 70px;"></div>
                </header>

                <main class="funshow-help-body">
                    <!-- Help content goes here -->
                </main>

                <footer class="funshow-help-footer">
                    <div class="funshow-help-footer-links">
                        <a href="https://x.com/anarchyarcade" target="_blank" rel="noopener noreferrer" class="funshow-help-footer-link funshow-help-x-link">
                            <span>Created by SM Sith Lord</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </a>
                        <a href="https://github.com/smsithlord/funshow" target="_blank" rel="noopener noreferrer" class="funshow-help-footer-link funshow-help-github-link">
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
                </footer>
            </div>
        `;
    }

    bindEvents() {
        this.backButtonClickHandler = this.backButtonClickHandler.bind(this);
        const backButton = this.container.querySelector('.funshow-help-back-button');
        backButton.addEventListener('click', this.backButtonClickHandler);
    }

    backButtonClickHandler() {
        this.destroy();
        window.funShowEnvironment.newGame();
    }

    setHelpContent(content) {
        const bodyElement = this.container.querySelector('.funshow-help-body');
        bodyElement.innerHTML = content;
    }

    setHelpContent(helpItems) {
        const bodyElement = this.container.querySelector('.funshow-help-body');
        const helpHtml = helpItems.map(item => `
            <div class="funshow-help-content-item">
                <div class="funshow-help-content-title">${item.title}</div>
                <div class="funshow-help-content-body">${item.content}</div>
            </div>
        `).join('');
        
        bodyElement.innerHTML = `
            <div class="funshow-help-content-container">
                ${helpHtml}
            </div>
        `;
    }

    getDefaultHelpContent() {
        return [
            {
                title: "What is FunShow?",
                content: `
                    <p>FunShow is an tool for creating and viewing interactive slideshows of text, images, & videos.</p>
                    <p>It can run in <span class="emphasis">LOCAL MODE</span> from the local file system, or <span class="emphasis">SERVER MODE</span> from your own website.</p>
                    <p><span class="emphasis">LOCAL MODE</span> can also be used <b>OFFLINE</b> (with the exception of Google Fonts not working.)</p>
                `
            },
            {
                title: "Who is FunShow for?",
                content: `
                    <p><span class="emphasis">INDIVIDUALS</span> can use it in <span class="emphasis">LOCAL MODE</span> as a fun way to view their media.</p>
                    <p><span class="emphasis">DEVELOPERS</span> can host it in <span class="emphasis">SERVER MODE</span> on their own website as a tool for their users, <b>or</b> they can save out slideshows & host only the <span class="emphasis">VIEWER</span> as a media gallery viewer.</p>
                `
            },
            {
                title: "Creating a New Show",
                content: `
                    <p>To create a new show, click on the <span class="emphasis">BUILDER</span> option from the main menu. The <span class="emphasis">BUILDER</span> is where you can add media elements, arrange them in sequence, and set transitions between them.</p>
                `
            },
            {
                title: "Using Your Own Media",
                content: `
                    <p>Images, video, & text/HTML slides are supported. You can drag & drop your media to add it.</p>
                    <p><span class="emphasis">LOCAL MODE</span> requires you set the <span class="emphasis">WORKING DIRECTORY</span> <b>if</b> you want to be able to save/load local slideshows.</p>
                    <p><span class="emphasis">DEVELOPERS</span> that are planning to deploy in <span class="emphasis">SERVER MODE</span> can make use of the <span class="emphasis">CONTENT PATH</span> to define the relative (or absolute) path to load media on their server. <span class="emphasis">CLOUDINARY</span> URLs are supported w/ an option to automatically apply transforms.</p>
                `
            },
            {
                title: "Sharing Your Show",
                content: `
                    <p>To save, load, or share a slideshow, you'll want to set the <span class="emphasis">WORKING DIRECTORY</span> and/or the <span class="emphasis">CONTENT DIRECTORY</span> so that the slideshow knows where to find the media the next it is loaded.</p>
                    <p>The <span class="emphasis">WORKING DIRECTORY</span> is used when the slideshow is loaded into the <span class="emphasis">BUILDER</span>.</p>
                    <p>The <span class="emphasis">CONTENT DIRECTORY</span> is used when a <span class="emphasis">DEVELOPER</span> deploys the slideshow onto their own website & load the slideshow in the <span class="emphasis">VIEWER</span>.</p>
                    <p><span class="emphasis">INDIVIDUALS</span> using <span class="emphasis">LOCAL MODE</span> cannot share their slideshows because they are referencing local media. But they can load them locally into the <span class="emphasis">BUILDER</span> and play them from there.</p>
                `
            }
        ];
    }
}