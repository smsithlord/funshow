class FunShowMediaLibraryDragAndDropBuilder extends FunShowEventEmitter {
    constructor({
        container = document.body,
        autoDestruct = true,
        dropHTML = 'Drag & Drop Files Here',
        modestStyle = false,
        lookForJSON = false,
        generateSlideshow = false
    } = {}) {
        super();
        this.container = container;
        this.autoDestruct = autoDestruct;
        this.lookForJSON = lookForJSON;
        this.generateSlideshow = generateSlideshow;
        this.dropHTML = dropHTML;
        this.modestStyle = modestStyle;
        this.dragAndDropDiv = null;
        this.items = {};
        this.fileMetrics = {
            totalFiles: 0,
            image: 0,
            video: 0,
            model: 0,
            folder: 0,
            other: 0
        };
        this.injectCSS();
        this.createDragAndDropDiv();
        this.addDropListener();
    }

    static cssInjected = false;

    injectCSS() {
        if (FunShowMediaLibraryDragAndDropBuilder.cssInjected) return;

        const css = `
            .medialibrary-drag-drop-container {
                position: relative;
                width: 100%;
                height: 100%;
            }
            .medialibrary-drag-drop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                justify-content: center;
                gap: 20px;
                align-items: center;
                text-align: center;
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
            }
            .medialibrary-drag-drop {
                color: #aaa;
            }
            .medialibrary-drag-drop.dragging {
                color: #333;
            }
            .medialibrary-drag-drop:not(.modest) {
                border: 2px dashed #aaa;
            }
            .medialibrary-drag-drop:not(.modest).dragging {
                border-color: #333;
            }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        FunShowMediaLibraryDragAndDropBuilder.cssInjected = true;
    }

    createDragAndDropDiv() {
        const containerDiv = document.createElement('div');
        containerDiv.classList.add('medialibrary-drag-drop-container');
        
        containerDiv.style.width = '100%';
        containerDiv.style.height = '100%';
        
        this.dragAndDropDiv = document.createElement('div');
        this.dragAndDropDiv.classList.add('medialibrary-drag-drop');
        if (this.modestStyle) {
            this.dragAndDropDiv.classList.add('modest');
        }
        this.dragAndDropDiv.innerHTML = this.dropHTML;
        
        containerDiv.appendChild(this.dragAndDropDiv);
        this.container.appendChild(containerDiv);
    }

    addDropListener() {
        this.dragAndDropDiv.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dragAndDropDiv.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dragAndDropDiv.addEventListener('drop', this.handleDrop.bind(this));
    }

    handleDragOver(event) {
        event.preventDefault();
        this.dragAndDropDiv.classList.add('dragging');
    }

    handleDragLeave() {
        this.dragAndDropDiv.classList.remove('dragging');
    }

    handleDrop(event) {
        event.preventDefault();
        this.dragAndDropDiv.classList.remove('dragging');
        const items = event.dataTransfer.items;
        
        // Check if only one file is dropped and it's a JSON file
        if (this.lookForJSON && items.length === 1 && items[0].kind === 'file') {
            const file = items[0].getAsFile();
            if (file.name.toLowerCase().endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const jsonObject = JSON.parse(e.target.result);
                        console.log('JSON file contents:', jsonObject);
                        this.emit('jsonDropped', jsonObject);
                        if (this.autoDestruct) {
                            this.destroy();
                        } else {
                            this.reset();
                        }
                    } catch (error) {
                        console.error('Error parsing JSON file:', error);
                    }
                };
                reader.readAsText(file);
                return; // Exit the function after processing the JSON file
            }
        }
        
        // If not a single JSON file, proceed with normal processing
        const promises = [];
        const startTime = performance.now();
        for (const item of items) {
            if (item.kind === 'file') {
                promises.push(
                    item.getAsFileSystemHandle().then(entry => {
                        if (entry.kind === 'directory') {
                            return this.processDirectory(entry, null);
                        } else {
                            return this.processFile(entry, null);
                        }
                    })
                );
            }
        }
        Promise.all(promises).then(() => {
            const endTime = performance.now();
            const processDuration = ((endTime - startTime) / 1000).toFixed(2) + ' seconds';
            console.log(`Finished processing ${this.fileMetrics.totalFiles} files in ${processDuration}.`);
            console.log(`Images: ${this.fileMetrics.image}`);
            console.log(`Videos: ${this.fileMetrics.video}`);
            //console.log(`Models: ${this.fileMetrics.model}`);
            console.log(`Folders: ${this.fileMetrics.folder}`);
            console.log(`Other (skipped): ${this.fileMetrics.other + this.fileMetrics.model}`);
            this.emit('ready', this.items);
            if (this.autoDestruct) {
                this.destroy();
            } else {
                this.reset();
            }
        }).catch(error => {
            console.error('Error processing files:', error);
        });
    }

    /*handleDrop(event) {
        event.preventDefault();
        this.dragAndDropDiv.classList.remove('dragging');
        const items = event.dataTransfer.items;
        const promises = [];
        const startTime = performance.now();

        for (const item of items) {
            if (item.kind === 'file') {
                promises.push(
                    item.getAsFileSystemHandle().then(entry => {
                        if (entry.kind === 'directory') {
                            return this.processDirectory(entry, null);
                        } else {
                            return this.processFile(entry, null);
                        }
                    })
                );
            }
        }

        Promise.all(promises).then(() => {
            const endTime = performance.now();
            const processDuration = ((endTime - startTime) / 1000).toFixed(2) + ' seconds';
            console.log(`Finished processing ${this.fileMetrics.totalFiles} files in ${processDuration}.`);
            console.log(`Images: ${this.fileMetrics.image}`);
            console.log(`Videos: ${this.fileMetrics.video}`);
            console.log(`Models: ${this.fileMetrics.model}`);
            console.log(`Folders: ${this.fileMetrics.folder}`);
            console.log(`Others: ${this.fileMetrics.other}`);
            console.log(this.items);

            this.emit('ready', this.items);

            if (this.autoDestruct) {
                this.destroy();
            } else {
                this.reset();
            }
        }).catch(error => {
            console.error('Error processing files:', error);
        });
    }*/

    reset() {
        this.items = {};
        this.fileMetrics = {
            totalFiles: 0,
            image: 0,
            video: 0,
            model: 0,
            folder: 0,
            other: 0
        };
        this.dragAndDropDiv.innerHTML = this.dropHTML;
        this.emit('reset');
    }

    destroy() {
        const containerDiv = this.dragAndDropDiv?.parentNode;
        if (containerDiv && containerDiv.parentNode) {
            containerDiv.parentNode.removeChild(containerDiv);
        }
        this.dragAndDropDiv = null;
        this.items = {};
        this.fileMetrics = {
            totalFiles: 0,
            image: 0,
            video: 0,
            model: 0,
            folder: 0,
            other: 0
        };
        this.emit('destroy');
        this.off();
    }

    generatePushID() {
        const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
        let lastPushTime = 0;
        let lastRandChars = [];

        return function() {
            let now = new Date().getTime();
            const duplicateTime = (now === lastPushTime);
            lastPushTime = now;

            let timeStampChars = new Array(8);
            for (let i = 7; i >= 0; i--) {
                timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
                now = Math.floor(now / 64);
            }
            if (now !== 0) throw new Error('We should have converted the entire timestamp.');

            let id = timeStampChars.join('');

            if (!duplicateTime) {
                for (let i = 0; i < 12; i++) {
                    lastRandChars[i] = Math.floor(Math.random() * 64);
                }
            } else {
                for (let i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
                    lastRandChars[i] = 0;
                }
                lastRandChars[11]++;
            }
            for (let i = 0; i < 12; i++) {
                id += PUSH_CHARS.charAt(lastRandChars[i]);
            }
            if (id.length !== 20) throw new Error('Length should be 20.');

            return id;
        };
    }

    determineFileType(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
            case 'webp':
                return 'image';
            case 'mp4':
            case 'mkv':
            case 'webm':
            case 'avi':
                return 'video';
            case 'glb':
                return 'model';
            default:
                return '';
        }
    }

    async processDirectory(directory, parentItemId, parentDirectory) {
        const itemId = this.generatePushID()();
        this.items[itemId] = {
            id: itemId,
            name: directory.name,
            type: 'folder',
            file: null,
            parent: parentItemId,
            directory: parentDirectory
        };
        this.fileMetrics.folder++;

        for await (const entry of directory.values()) {
            if (entry.kind === 'file') {
                await this.processFile(entry, itemId, directory);
            } else if (entry.kind === 'directory') {
                await this.processDirectory(entry, itemId, directory);
            }
        }
    }

    async processFile(fileHandle, parentItemId, directory) {
        const file = await fileHandle.getFile();
        const itemId = this.generatePushID()();
        const fileType = this.determineFileType(file.name);
        this.items[itemId] = {
            id: itemId,
            name: file.name,
            type: fileType,
            file: file,
            parent: parentItemId,
            directory: directory
        };
        this.fileMetrics.totalFiles++;
        if (fileType) {
            this.fileMetrics[fileType]++;
        } else {
            this.fileMetrics.other++;
        }
    }
}
