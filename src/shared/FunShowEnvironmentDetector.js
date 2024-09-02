class FunShowEnvironment extends FunShowEventEmitter {
    constructor(enableUI = true) {
        super();
        this.enableUI = enableUI;
        this.modules = [];
        this.modulesElem = null;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.updateWindowSize();
        this.isLocal = this.detectEnvironment();
        this.resolutionMode = 0;    // 0=normal, 1=low, 2=min
        this.currentLoadingWait = 0;    // keeps track of loading wait since last resolutionMode change
        this.totalLoadingWait = 0;
        this.maxTotalLoadingWaitTolerence = 8;
        //this.applyCloudinaryUrlFix = true;
        this.applyCloudinaryTransforms = true;
        this.bindEvents();
        this.schema = this.createSchema();
    }

    createSchema() {
        return {
            slideshow: {
                config: {
                    primaryFontFamily: { 
                        type: 'dropdown', 
                        label: 'Primary Font',
                        help: 'The main font used throughout the slideshow',
                        options: [
                            { value: 'Arial', label: 'Arial' },
                            { value: 'Helvetica', label: 'Helvetica' },
                            { value: 'Times New Roman', label: 'Times New Roman' },
                            { value: 'Courier', label: 'Courier' },
                            { value: 'Verdana', label: 'Verdana' },
                            { value: 'Genos', label: 'Genos' },
                            { value: 'Ubuntu', label: 'Ubuntu' },
                            { value: 'Pixelify Sans', label: 'Pixelify Sans' },
                            { value: 'Bungee Spice', label: 'Bungee Spice' },
                            { value: 'Honk', label: 'Honk' },
                            { value: 'Loved by the King', label: 'Loved by the King' },
                            { value: 'Bungee Shade', label: 'Bungee Shade' },
                            { value: 'La Belle Aurore', label: 'La Belle Aurore' },
                            { value: 'Racing Sans One', label: 'Racing Sans One' },
                            { value: 'Rock Salt', label: 'Rock Salt' },
                            { value: 'Bangers', label: 'Bangers' },
                            { value: 'Orbitron', label: 'Orbitron' },
                            { value: 'Lexend Deca', label: 'Lexend Deca' },
                            { value: 'Amatic SC', label: 'Amatic SC' },
                            { value: 'Alfa Slab One', label: 'Alfa Slab One' },
                            { value: 'Barlow Condensed', label: 'Barlow Condensed' },
                            { value: 'Anton', label: 'Anton' },
                            { value: 'Bebas Neue', label: 'Bebas Neue' }
                        ], 
                        default: 'Arial' 
                    },
                    secondaryFontFamily: { 
                        type: 'dropdown', 
                        label: 'Secondary Font',
                        help: 'The secondary font used for accents or specific elements',
                        options: [
                            { value: 'Arial', label: 'Arial' },
                            { value: 'Helvetica', label: 'Helvetica' },
                            { value: 'Times New Roman', label: 'Times New Roman' },
                            { value: 'Courier', label: 'Courier' },
                            { value: 'Verdana', label: 'Verdana' },
                            { value: 'Genos', label: 'Genos' },
                            { value: 'Ubuntu', label: 'Ubuntu' },
                            { value: 'Pixelify Sans', label: 'Pixelify Sans' },
                            { value: 'Bungee Spice', label: 'Bungee Spice' },
                            { value: 'Honk', label: 'Honk' },
                            { value: 'Loved by the King', label: 'Loved by the King' },
                            { value: 'Bungee Shade', label: 'Bungee Shade' },
                            { value: 'La Belle Aurore', label: 'La Belle Aurore' },
                            { value: 'Racing Sans One', label: 'Racing Sans One' },
                            { value: 'Rock Salt', label: 'Rock Salt' },
                            { value: 'Bangers', label: 'Bangers' },
                            { value: 'Orbitron', label: 'Orbitron' },
                            { value: 'Lexend Deca', label: 'Lexend Deca' },
                            { value: 'Amatic SC', label: 'Amatic SC' },
                            { value: 'Alfa Slab One', label: 'Alfa Slab One' },
                            { value: 'Barlow Condensed', label: 'Barlow Condensed' },
                            { value: 'Anton', label: 'Anton' },
                            { value: 'Bebas Neue', label: 'Bebas Neue' }
                        ], 
                        default: 'Verdana' 
                    },
                    primaryColor: { type: 'color', label: 'Primary Color', help: 'The main color used in the slideshow', default: '#f0f0f0' },
                    primaryBgColor: { type: 'color', label: 'Primary Background Color', help: 'The main background color', default: '#333333' },
                    secondaryColor: { type: 'color', label: 'Secondary Color', help: 'The secondary color for accents', default: '#ffffff' },
                    secondaryBgColor: { type: 'color', label: 'Secondary Background Color', help: 'The secondary background color', default: '#000000' },
                    stageTransparent: { type: 'checkbox', label: 'Transparent Stage', help: 'Transparent stage instead of using primary background color.', default: false },
                    autoPlay: { type: 'checkbox', label: 'Auto Play', help: 'Start the slideshow automatically', default: true },
                    loop: { type: 'checkbox', label: 'Loop Slideshow', help: 'Loops the slideshow.', default: true },
                    spamProtection: { type: 'range', label: 'Spam Protection', help: 'Delay between slide transitions to prevent spam', min: 0.1, max: 0.5, step: 0.01, default: 0.25 },
                    transitionDuration: { type: 'range', label: 'Transition Duration', help: 'Duration of slide transitions', min: 0.25, max: 6, step: 0.25, default: 1 },
                    transitionEntranceTime: { type: 'range', label: 'Entrance Time', help: 'Time for slide to enter', min: 0.1, max: 1, step: 0.1, default: 1 },
                    transitionExitTime: { type: 'range', label: 'Exit Time', help: 'Time for slide to exit', min: 0, max: 1, step: 0.1, default: 0.1 },
                    playlistStartCollapsed: { type: 'checkbox', label: 'Start Collapsed', help: 'Playlist starts in collapsed state', default: true },
                    playlistStartShuffle: { type: 'checkbox', label: 'Start Shuffled', help: 'Start playlist in shuffled order', default: false },
                    playlistAutoMinimize: { type: 'checkbox', label: 'Auto Minimize', help: 'Automatically minimize playlist', default: true },
                    playlistAutoMinimizeDuration: { type: 'range', label: 'Auto Minimize Duration', help: 'Time before playlist auto-minimizes', min: 0.5, max: 8, step: 0.5, default: 4 },
                    playlistAlwaysShowOnSlideChange: { type: 'checkbox', label: 'Show on Slide Change', help: 'Always show playlist when slide changes', default: false },
                    playlistPauseOnInteraction: { type: 'checkbox', label: 'Pause on Interaction', help: 'Pause slideshow when interacting with playlist', default: false },
                    slideStyleIn: { 
                        type: 'dropdown', 
                        label: 'Slide In Style',
                        help: 'Animation style for slide entrance',
                        options: [
                            { value: '', label: 'Random' },
                            { value: '-1', label: 'None' },
                            { value: '0', label: 'Bubble-In' },
                            { value: '1', label: 'Bubble-Out' },
                            { value: '2', label: 'Swipe-Up' },
                            { value: '3', label: 'Swipe-Down' },
                            { value: '4', label: 'Swipe-Left' },
                            { value: '5', label: 'Swipe-Right' },
                            { value: '6', label: 'Toss-Left' },
                            { value: '7', label: 'Toss-Right' }
                        ], 
                        default: '' 
                    },
                    slideStyleOut: { 
                        type: 'dropdown', 
                        label: 'Slide Out Style',
                        help: 'Animation style for slide exit',
                        options: [
                            { value: '', label: 'Random' },
                            { value: '-1', label: 'None' },
                            { value: '0', label: 'Bubble-In' },
                            { value: '1', label: 'Bubble-Out' },
                            { value: '2', label: 'Swipe-Up' },
                            { value: '3', label: 'Swipe-Down' },
                            { value: '4', label: 'Swipe-Left' },
                            { value: '5', label: 'Swipe-Right' },
                            { value: '6', label: 'Toss-Left' },
                            { value: '7', label: 'Toss-Right' }
                        ], 
                        default: '' 
                    },
                    slideStyleActive: { 
                        type: 'dropdown', 
                        label: 'Active Slide Style',
                        help: 'Style applied to the active slide',
                        options: [
                            { value: '', label: 'Random' },
                            { value: '-1', label: 'None' },
                            { value: '0', label: 'Drift' },
                            { value: '1', label: 'Drift Zoom-In' },
                            { value: '2', label: 'Drift Zoom-Out' },
                            { value: '3', label: 'Zoom-In Low' },
                            { value: '4', label: 'Zoom-In Mid' },
                            { value: '5', label: 'Zoom-In Max' },
                            { value: '6', label: 'Zoom-Out Low' },
                            { value: '7', label: 'Zoom-Out Mid' },
                            { value: '8', label: 'Zoom-Out Max' }
                        ], 
                        default: '1' 
                    },
                    slideDisplayDuration: { type: 'range', label: 'Slide Duration', help: 'Duration each slide is displayed', min: 1, max: 20, step: 1, default: 4 },
                    slideDefaultScale: { type: 'range', label: 'Slide Default Scale', help: 'Slides start at this scale.', min: 0.5, max: 1.5, step: 0.1, default: 1 },
                    slideVideoAutoplay: { type: 'checkbox', label: 'Video Autoplay', help: 'Automatically play videos in slides', default: true },
                    slideVideoMuted: { type: 'checkbox', label: 'Video Muted', help: 'Mute videos by default', default: true },
                    slideVideoLoop: { type: 'checkbox', label: 'Video Loop', help: 'Loop videos in slides', default: true },
                    slideMediaObjectFit: { 
                        type: 'dropdown', 
                        label: 'Media Object Fit',
                        help: 'How media should be fitted within slides',
                        options: [
                            { value: 'contain', label: 'Contain' },
                            { value: 'cover', label: 'Cover' },
                            { value: 'fill', label: 'Fill' },
                            { value: 'none', label: 'None' },
                            { value: 'scale-down', label: 'Scale Down' }
                        ], 
                        default: 'contain' 
                    },
                    slideVideoControls: { type: 'checkbox', label: 'Video Controls', help: 'Show video controls', default: false },
                    stageBackgroundImage: { type: 'text', label: 'Stage Background Image', help: 'Background image URL to use on the stage', default: '' },
                    mediaAsBackground: { type: 'checkbox', label: 'Images As Backgrounds', help: 'Use a darkend version of images as their own background during the slideshow', default: true },
                    contentPath: { type: 'text', label: 'Content Path', help: 'The path to look for any relative media in', default: '' },
                    workingDirectory: { type: 'text', label: 'Working Directory', help: '(BUILDER ONLY) Overrides the contentPath when working in the builder', default: '' },
                    cloudinaryTransforms: { type: 'checkbox', label: 'Cloudinary Transforms', help: 'Automatically apply Cloudinary transforms. (If Cloudinary content path is detected.)', default: true },
                }
            },
            slide: {    
                file: { type: 'textarea', label: 'File', help: 'Path or URL to the slide media file', default: '' },
                title: { type: 'text', label: 'Title', help: 'Title of the slide', default: 'My Slide' },
                type: { 
                    type: 'dropdown', 
                    label: 'Type',
                    help: 'Type of media (e.g., image, video)',
                    options: [
                        //{ value: '', label: 'Other' },
                        { value: 'image', label: 'Image' },
                        { value: 'video', label: 'Video' },
                        { value: 'html', label: 'HTML' },
                        { value: 'category', label: 'Category' }
                    ], 
                    default: 'html'
                },
                description: { type: 'textarea', label: 'Description', help: 'Description or caption for the slide', default: '' },
                config: {
                    styleIn: { 
                        type: 'dropdown', 
                        label: 'Style In',
                        help: 'Animation style for this slide\'s entrance',
                        options: [
                            { value: '', label: 'Random' },
                            { value: '-1', label: 'None' },
                            { value: '0', label: 'Bubble-In' },
                            { value: '1', label: 'Bubble-Out' },
                            { value: '2', label: 'Swipe-Up' },
                            { value: '3', label: 'Swipe-Down' },
                            { value: '4', label: 'Swipe-Left' },
                            { value: '5', label: 'Swipe-Right' },
                            { value: '6', label: 'Toss-Left' },
                            { value: '7', label: 'Toss-Right' }
                        ], 
                        default: '' 
                    },
                    styleOut: { 
                        type: 'dropdown', 
                        label: 'Style Out',
                        help: 'Animation style for this slide\'s exit',
                        options: [
                            { value: '', label: 'Random' },
                            { value: '-1', label: 'None' },
                            { value: '0', label: 'Bubble-In' },
                            { value: '1', label: 'Bubble-Out' },
                            { value: '2', label: 'Swipe-Up' },
                            { value: '3', label: 'Swipe-Down' },
                            { value: '4', label: 'Swipe-Left' },
                            { value: '5', label: 'Swipe-Right' },
                            { value: '6', label: 'Toss-Left' },
                            { value: '7', label: 'Toss-Right' }
                        ], 
                        default: '' 
                    },
                    styleActive: { 
                        type: 'dropdown', 
                        label: 'Active Style',
                        help: 'Style applied when this slide is active',
                        options: [
                            { value: '', label: 'Random' },
                            { value: '-1', label: 'None' },
                            { value: '0', label: 'Drift' },
                            { value: '1', label: 'Drift Zoom-In' },
                            { value: '2', label: 'Drift Zoom-Out' },
                            { value: '3', label: 'Zoom-In Low' },
                            { value: '4', label: 'Zoom-In Mid' },
                            { value: '5', label: 'Zoom-In Max' },
                            { value: '6', label: 'Zoom-Out Low' },
                            { value: '7', label: 'Zoom-Out Mid' },
                            { value: '8', label: 'Zoom-Out Max' }
                        ],
                        default: '1' 
                    },
                    displayDuration: { type: 'range', label: 'Display Duration', help: 'Duration this slide is displayed', min: 1, max: 20, step: 1, default: 4 },
                    defaultScale: { type: 'range', label: 'Slide Default Scale', help: 'Slides start at this scale.', min: 0.5, max: 1.5, step: 0.1, default: 1 },
                    videoAutoplay: { type: 'checkbox', label: 'Video Autoplay', help: 'Automatically play video for this slide', default: true },
                    videoMuted: { type: 'checkbox', label: 'Video Muted', help: 'Mute video for this slide', default: true },
                    videoLoop: { type: 'checkbox', label: 'Video Loop', help: 'Loop video for this slide', default: true },
                    mediaObjectFit: { 
                        type: 'dropdown', 
                        label: 'Media Object Fit',
                        help: 'How media should be fitted within this slide',
                        options: [
                            { value: 'contain', label: 'Contain' },
                            { value: 'cover', label: 'Cover' },
                            { value: 'fill', label: 'Fill' },
                            { value: 'none', label: 'None' },
                            { value: 'scale-down', label: 'Scale Down' }
                        ], 
                        default: 'contain' 
                    },
                    videoControls: { type: 'checkbox', label: 'Video Controls', help: 'Show video controls for this slide', default: false },
                }
            }
        };
    }

    createMediaItemFromMediaUrl(mediaUrl) {
        let mediaType = this.determineMediaType(mediaUrl);
        if( mediaType != 'image' && mediaType != 'video' ) {
            mediaType = 'image';
        }
        const mediaTitle = this.createTitleFromUrl(mediaUrl);
        const shortName = mediaUrl.split('/').pop();
        return {
            name: mediaTitle,
            type: mediaType,
            file: mediaUrl
        };
    }

    createTitleFromUrl(url) {
      // Remove protocol and www if present
      let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');

      // Try to get filename with extension
      let parts = cleanUrl.split('/');
      let lastPart = parts[parts.length - 1];

      if (lastPart && lastPart.includes('.')) {
        // Remove query parameters if present
        lastPart = lastPart.split('?')[0];
        // Decode URL-encoded characters
        return decodeURIComponent(lastPart);
      }

      // If no filename found, use domain and first path segment
      let domain = parts[0];
      let firstPath = parts[1] ? '/' + parts[1] : '';

      // Remove file extension from domain if present
      domain = domain.split('.').slice(0, -1).join('.');

      // Capitalize first letter of each word and replace hyphens/underscores with spaces
      let title = (domain + firstPath)
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      return decodeURIComponent(title);
    }

    determineMediaType(url) {
      // Convert URL to lowercase for case-insensitive matching
      const lowercaseUrl = url.toLowerCase();
      
      // Common image file extensions
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      
      // Common video file extensions
      const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
      
      // Check for file extensions
      for (const ext of imageExtensions) {
        if (lowercaseUrl.endsWith(ext)) {
          return 'image';
        }
      }
      
      for (const ext of videoExtensions) {
        if (lowercaseUrl.endsWith(ext)) {
          return 'video';
        }
      }
      
      // If no extension match, look for keywords
      if (lowercaseUrl.includes('image') || lowercaseUrl.includes('img')) {
        return 'image';
      }
      
      if (lowercaseUrl.includes('video') || lowercaseUrl.includes('vid')) {
        return 'video';
      }
      
      // If no match found, conclude it's neither an image nor a video
      return 'unknown';
    }

    async getSlideshowUrlParams() {
        // helper function for fetching JSON
        async function fetchJson(url) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        }

        // Get the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const paramSchema = {
            's': {
                param: 's',
                description: 'slideshow JSON URL',
                value: null,
                initialize: async function() {
                    const slideshowUrl = decodeURIComponent(urlParams.get(this.param));
                    this.value = await fetchJson(slideshowUrl);
                }
            },
            'sl': {
                param: 'sl',
                description: 'JSON object of an array of strings that are slideshow JSON URLs',
                value: null,
                initialize: async function() {
                    const slideshowUrls = JSON.parse(decodeURIComponent(urlParams.get(this.param)));
                    this.value = await Promise.all(slideshowUrls.map(fetchJson));
                }
            },
            'j': {
                param: 'j',
                description: 'JSON structure of a showcase itself',
                value: null,
                initialize: function() {
                    this.value = JSON.parse(decodeURIComponent(urlParams.get(this.param)));
                }
            },
            'jl': {
                param: 'jl',
                description: 'JSON object of an array of showcases',
                value: null,
                initialize: function() {
                    this.value = JSON.parse(decodeURIComponent(urlParams.get(this.param)));
                }
            },
            'm': {
                param: 'm',
                description: 'url to an individual media',
                value: null,
                initialize: function() {
                    this.value = decodeURIComponent(urlParams.get(this.param));
                }
            },
            'ml': {
                param: 'ml',
                description: 'JSON object of an array of strings that are urls to an individual medias',
                value: null,
                initialize: function() {
                    this.value = JSON.parse(urlParams.get(this.param));
                }
            }
        };

        const initializationPromises = [];

        for (const schemaId in paramSchema) {
            if (urlParams.has(schemaId)) {
                try {
                    const initPromise = paramSchema[schemaId].initialize();
                    if (initPromise instanceof Promise) {
                        initializationPromises.push(initPromise);
                    }
                } catch (e) {
                    console.log('Failed to parse ' + schemaId);
                }
            }
        }

        await Promise.all(initializationPromises);

        return paramSchema;
    }

    createDefaultSlide() {
        const slide = { config: {} };
        for (const [key, value] of Object.entries(this.schema.slide)) {
            if (key !== 'config') {
                slide[key] = value.default;
            } else {
                for (const [configKey, configValue] of Object.entries(value)) {
                    slide.config[configKey] = configValue.default;
                }
            }
        }
        return slide;
    }

    prepareMediaSrc(mediaItem, lastUsedPath, field = 'file') {
        function isNonRelativeUrl(str) {
            try {
                const url = new URL(str);
                return url.protocol.startsWith('http') || url.protocol.startsWith('https');
            } catch (error) {
                return false;
            }
        }

        // If we are a blob AND we have a handle, then we use our blob.  (unless allowWorkingPath is false? maybe even then too.)
        //console.log(mediaItem.file, mediaItem.handle, typeof mediaItem.file);
        if( mediaItem[field].indexOf('blob:') === 0 ) {//} && mediaItem.handle ) {
            return mediaItem[field];
        }
        else {  // If we are NOT a blob or we don't have a handle & directoryHandle, then we might need our URL augmented w/ a path.
            if( isNonRelativeUrl(mediaItem[field]) ) {
                return mediaItem[field];
            }
            // Otherwise, we always prepend. And if we are prepending a Cloudinary URL, we must auto-convert spaces to _.  (// FIXME: Only if a config option for this is set??)
            let pathToUse = lastUsedPath ?? '';

            let fieldValue = mediaItem[field];
            if( pathToUse.indexOf('https://res.cloudinary.com/') === 0 ) {//this.applyCloudinaryUrlFix && 
                // mutate the path to be to the correct Cloudinary media sub-folder
                if( mediaItem.type === 'video' && pathToUse.indexOf('/video/') < 0 && pathToUse.indexOf('/image/') >= 0 ) {
                    pathToUse = pathToUse.replace(/\/image\//g, '/video/');
                }
                else if( mediaItem.type === 'image' && pathToUse.indexOf('/image/') < 0 && pathToUse.indexOf('/video/') >= 0 ) {
                    pathToUse = pathToUse.replace(/\/video\//g, '/image/');
                }

                fieldValue = mediaItem[field].replace(/\s/g, '_');

                if (this.applyCloudinaryTransforms) {
                    let bestImageSize = null;
                    if (!this.windowSize) {
                        this.updateWindowSize();
                    }
                    if (this.windowSize.width <= 1280 || this.resolutionMode > 0 ) {
                        bestImageSize = 1280;
                    }
                    let transforms = 'f_auto,q_auto';
                    if (bestImageSize) {
                        transforms += `,w_${bestImageSize}`;
                    }
                    
                    // Adjust pathToUse to include transforms
                    pathToUse = pathToUse.replace(
                        /(\/(?:image|video)\/upload\/)/,
                        `$1${transforms}/`
                    );
                }
            }
            return `${pathToUse}${fieldValue}`;
        }
    }

    mergeSlideshow(defaultSlideshow, customSlideshow, mergeSlideConfigs = true) {
        const mergedSlideshow = {
            config: { ...defaultSlideshow.config, ...customSlideshow.config },
            slides: customSlideshow.slides.map(customSlide => {
                const defaultSlide = this.createDefaultSlide();
                if( !mergeSlideConfigs ) {
                    return {
                        ...defaultSlide,
                        ...customSlide,
                        config: customSlide.config
                    };
                } else {
                    return {
                        ...defaultSlide,
                        ...customSlide,
                        config: { ...defaultSlide.config, ...customSlide.config }
                    };
                }
            })
        };
        return mergedSlideshow;
    }

    newGame() {
        const splash = new FunShowSplash();
        splash.on('optionSelected', (option) => {
            splash.destroy();
            if( option == 'builder' ) {
                const builder = new FunShowBuilder();
            }
            else if( option == 'viewer' ) {
                this.startBlankViewer();
            }
            else if( option == 'help' ) {
                const help = new FunShowHelp();
            }
        });
    }

    startBlankViewer() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="funshow-blank-viewer-top">
                <div class="funshow-blank-viewer-header">
                    <div class="funshow-blank-viewer-main-content">
                        <svg class="funshow-blank-viewer-app-icon" viewBox="18 21 33 22" xmlns="http://www.w3.org/2000/svg">
                            <g fill="currentColor">
                                <path d="M20 25h22v15H20z" stroke="currentColor" stroke-width="1" fill="none"/>
                                <path d="M24 28l16 8-16 8V28z"/>
                                <circle cx="48" cy="24" r="3"/>
                                <circle cx="48" cy="32" r="3"/>
                                <circle cx="48" cy="40" r="3"/>
                            </g>
                        </svg>
                        <div>
                            FunShow
                            <div style="display: flex; flex-direction: row; margin-top: -20px; align-items: center; justify-items: center; justify-content: flex-start;">
                                <svg viewBox="8 11 48 42" xmlns="http://www.w3.org/2000/svg" class="funshow-blank-viewer-icon" style="margin-bottom: 0;">
                                    <g fill="none" stroke="currentColor" stroke-width="2">
                                        <ellipse cx="32" cy="32" rx="16" ry="10"/>
                                        <path d="M20 32h-8M52 32h-8" stroke="currentColor" stroke-width="2"/>
                                        <circle cx="32" cy="32" r="5" stroke-width="3"/>
                                    </g>
                                </svg>
                                <div style="font-size: 20px; letter-spacing: 0.2em;">Slideshow Viewer</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="funshow-blank-viewer-instructions">
                    <p>Local files & folders of images/videos supported.</p>
                    <p>JSON slideshows exported from builder also supported.</p>
                    <p>FunShow does not upload or host your content.</p>
                </div>
                <div class="funshow-blank-viewer-drop-zone" style="width: 400px; height: 300px;"></div>
                <button class="funshow-blank-viewer-back-button" style="margin: 0 10px; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 24px; background-color: #6c757d; color: #ffffff; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="height: 20px;">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
                    </svg>
                    <div>Back</div>
                </button>
            </div>
            <div class="funshow-blank-viewer-footer">
                <div class="funshow-blank-viewer-footer-links">
                    <a href="https://x.com/anarchyarcade" target="_blank" rel="noopener noreferrer" class="funshow-blank-viewer-footer-link funshow-blank-viewer-x-link">
                        <span>Created by SM Sith Lord</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </a>
                    <a href="https://github.com/smsithlord/funshow" target="_blank" rel="noopener noreferrer" class="funshow-blank-viewer-footer-link funshow-blank-viewer-github-link">
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
        `;
        wrapper.className = 'funshow-blank-viewer-wrapper';
        const dropZone = wrapper.querySelector('.funshow-blank-viewer-drop-zone');
        const backButton = wrapper.querySelector('.funshow-blank-viewer-back-button');
        document.body.appendChild(wrapper);


        const mediaLibrary = new FunShowMediaLibraryDragAndDropBuilder({container: dropZone, lookForJSON: true, generateSlideshow: false});

        backButton.addEventListener('click', ()=>{
            mediaLibrary.destroy();
            wrapper.remove();
            this.newGame();
        });

        if( !this.modules.FunShowSplash ) {
            backButton.style.display = 'none';
        }

        mediaLibrary.on('jsonDropped', (slideshow) => {
            wrapper.remove();
            this.startShow({slideshow})
        });

        mediaLibrary.on('ready', (mediaLibraryItems) => {
            wrapper.remove();
            this.startShow({mediaLibraryItems})
        });
    }

    async fetchJSON(url) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
      }
    }

    async fetchJSONAndStartShow(url, opts = {}) {
      try {
        const slideshow = await this.fetchJSON(url);
        opts.slideshow = slideshow;
        return this.startShow(opts);
      } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
      }
    }

    setApplyCloudinaryTransforms(val) {
        this.applyCloudinaryTransforms = val;
    }

    startShow({slideshow = null, mediaLibraryItems = null, enableUI = true, allowWorkingPath = false} = {}) {
        const funShow = new FunShow({slideshow, mediaLibraryItems, enableUI, allowWorkingPath});
        funShow.stage.startSlideshow();
        return funShow;
    }

    generateDefaultSlideshow() {
        const slideshow = { config: {}, slides: [] };
        for (const [key, value] of Object.entries(this.schema.slideshow.config)) {
            slideshow.config[key] = value.default;
        }
        return slideshow;
    }

    bindEvents() {
        this.DOMContentLoadedHandler = this.onDOMContentLoaded.bind(this);
        document.addEventListener('DOMContentLoaded', this.DOMContentLoadedHandler);
    }

    onDOMContentLoaded() {
        this.modules = this.detectModules();
        if (this.enableUI) {
            this.injectCSS();
            this.injectHTML();
            this.initUI();
        }
    }

    detectEnvironment() {
        const isLocal = (window.location.hostname === '');
        if (isLocal) {
            document.body.classList.remove('funshow-env-server');
            document.body.classList.add('funshow-env-local');
        }
        return isLocal;
    }

    detectModules() {
        const detectedModules = {
            FunShowSplash: typeof FunShowSplash === 'function',
            FunShowBuilder: typeof FunShowBuilder === 'function',
            FunShow: typeof FunShow === 'function'
        };
        return detectedModules;
    }

    injectCSS() {
        const css = `
            .funshow-environment-watermark {
                position: absolute;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0);
                color: #999;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 10px;
                z-index: 9999;
                display: flex;
                flex-direction: row;
                align-items: center;
                opacity: 0.2;
                transition: opacity 1s ease;
            }
            .funshow-environment-watermark-info {
                padding: 5px 10px;
                display: none;
                padding-right: 0;
                flex-direction: column;
                align-items: flex-end;
            }
            .funshow-environment-watermark:hover .funshow-environment-watermark-info {
                display: flex;
            }
            .funshow-environment-watermark:hover {
                background: rgba(0, 0, 0, 0.8);
                opacity: 1.0;
            }
            .funshow-environment-modules {
                font-size: 8px;
                margin-top: 2px;
            }

            .funshow-blank-viewer-wrapper {
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
            .funshow-blank-viewer-header {
                display: flex;
                align-items: center;
                font-size: 4rem;
                margin-bottom: 2rem;
                animation: funshow-blank-viewer-fadeIn 1s ease-out;
            }

            .funshow-blank-viewer-top {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                flex-grow: 1;
            }

            .funshow-blank-viewer-main-content {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                flex-grow: 1;
            }

            .funshow-blank-viewer-instructions {
                text-align: center;
                margin-bottom: 2rem;
                max-width: 600px;
                animation: funshow-blank-viewer-fadeIn 1s ease-out 0.5s both;
            }

            .funshow-blank-viewer-app-icon {
                width: 100px;
                height: 100px;
                margin-right: 1rem;
            }

            .funshow-blank-viewer-icon {
                width: 48px;
                height: 48px;
                margin-bottom: 1rem;
            }

            @keyframes funshow-blank-viewer-fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .funshow-blank-viewer-footer {
                font-size: 0.8rem;
                text-align: center;
                opacity: 0.7;
                margin-top: 2rem;
            }

            .funshow-blank-viewer-footer-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-bottom: 15px;
            }

            .funshow-blank-viewer-footer-link {
                display: inline-flex;
                align-items: center;
                color: #ffffff;
                text-decoration: none;
                transition: color 0.3s ease;
            }

            .funshow-blank-viewer-footer-link:hover {
                color: #4a90e2;
            }

            .funshow-blank-viewer-footer-link svg {
                width: 16px;
                height: 16px;
                margin-left: 5px;
            }

            .funshow-blank-viewer-footer-link span {
                font-weight: bold;
            }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    injectHTML() {
        const html = `
            <div class="funshow-environment-watermark">
                <div class="funshow-environment-watermark-info">
                    <div class="funshow-version"></div>
                    <div class="funshow-environment"></div>
                    <div class="funshow-environment-modules"></div>
                </div>
                <div style="width: 32px; height: 32px; display: flex; justify-items: center; padding: 8px;">
                    <svg viewBox="18 21 33 22" xmlns="http://www.w3.org/2000/svg">
                        <g fill="currentColor">
                            <path d="M20 25h22v15H20z" stroke="currentColor" stroke-width="1" fill="none"/>
                            <path d="M24 28l16 8-16 8V28z"/>
                            <circle cx="48" cy="24" r="3"/>
                            <circle cx="48" cy="32" r="3"/>
                            <circle cx="48" cy="40" r="3"/>
                        </g>
                    </svg>
                </div>
            </div>
        `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv.firstElementChild);
    }

    reportLoadingWaitFinished(waitTime) {
        this.currentLoadingWait += waitTime;

        if( this.currentLoadingWait > this.maxTotalLoadingWaitTolerence && this.resolutionMode < 2 ) {
            this.totalLoadingWait += this.currentLoadingWait;
            this.currentLoadingWait = 0;
            this.resolutionMode++;
            console.log('kick into lower res mode', this.resolutionMode);
        }
    }

    updateWindowSize() {
        this.windowSize = {width: window.innerWidth, height: window.innerHeight};
    }

    initUI() {
        const watermark = document.querySelector('.funshow-environment-watermark');
        const funShowVersion = watermark.querySelector('.funshow-version');
        const environment = watermark.querySelector('.funshow-environment');
        this.modulesElem = watermark.querySelector('.funshow-environment-modules');

        funShowVersion.textContent = 'FunShow v0.0.1 ALPHA';
        
        const isMobileString = (this.isMobile) ? 'MOBILE ' : '';

        environment.style.cssText = 'font-weight: bold; color: #fff;';
        if (this.isLocal) {
            environment.textContent = `${isMobileString}LOCAL MODE`;
        } else {
            environment.textContent = `${isMobileString}SERVER MODE: ${window.location.hostname}`;
        }

        const modulesList = [];
        const moduleKeys = Object.keys(this.modules);
        moduleKeys.forEach(key=>{
            if( this.modules[key] ) {
                if( key === 'FunShow' ) {
                    modulesList.push('FunShowViewer');
                }
                else {
                    modulesList.push(key);
                }
            }
        });

        this.modulesElem.textContent = modulesList.join(', ');
    }
}

window.funShowEnvironment = new FunShowEnvironment();