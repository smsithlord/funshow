class FunShowZoomPan {
  constructor(containerElement, targetElement, startingScale, options = {}) {
    this.container = containerElement;
    this.target = targetElement;

    this.startingScale = startingScale;
    this.scale = this.startingScale;
    this.lastScale = this.startingScale;
    this.startX = 0;
    this.startY = 0;
    this.panX = 0;
    this.panY = 0;
    this.initialDistance = null;
    this.lastPanX = 0;
    this.lastPanY = 0;
    this.rotation = 0;
    this.rotationX = 0;
    this.rotationY = 0;
    this.perspectiveOriginX = 50;
    this.perspectiveOriginY = 50;
    this.maxSkewAngle = 30; // Maximum skew angle in degrees
    this.isMobile = window.funShowEnvironment.isMobile;

    // Mouse button configuration (0: left, 1: middle, 2: right)
    this.panButton = options.panButton ?? 0;
    this.rotateButton = options.rotateButton ?? 2;
    this.zoomButton = options.zoomButton ?? 1;

    this.use3D = options.use3D ?? 1; // 0: no 3D, 1: full 3D

    this.activeButton = null;

    this.touchCount = 0;
    this.lastTouchRotation = 0;

    this.updatePerspective = this.updatePerspective.bind(this);
    window.addEventListener('resize', this.updatePerspective);

    this.setupStyles();
    this.addEventListeners();
    this.updateTransform();
    this.updatePerspective();
  }

  setupStyles() {
    this.target.style.transformOrigin = 'center center';
  }

  addEventListeners() {
    this.onWheelBound = this.onWheel.bind(this);
    this.onTouchStartBound = this.onTouchStart.bind(this);
    this.onTouchMoveBound = this.onTouchMove.bind(this);
    this.onTouchEndBound = this.onTouchEnd.bind(this);

    if (!this.isMobile) {
      this.onPointerDownBound = this.onPointerDown.bind(this);
      this.onPointerMoveBound = this.onPointerMove.bind(this);
      this.onPointerUpBound = this.onPointerUp.bind(this);
      this.onPointerCancelBound = this.onPointerCancel.bind(this);
      this.onContextMenuBound = this.onContextMenu.bind(this);
    }

    this.container.addEventListener('wheel', this.onWheelBound);
    this.container.addEventListener('touchstart', this.onTouchStartBound);
    this.container.addEventListener('touchmove', this.onTouchMoveBound);
    this.container.addEventListener('touchend', this.onTouchEndBound);

    if (!this.isMobile) {
      this.container.addEventListener('pointerdown', this.onPointerDownBound);
      this.container.addEventListener('pointermove', this.onPointerMoveBound);
      this.container.addEventListener('pointerup', this.onPointerUpBound);
      this.container.addEventListener('pointercancel', this.onPointerCancelBound);
      document.addEventListener('contextmenu', this.onContextMenuBound);
    }
  }

  destroy() {
    // Remove event listeners
    this.container.removeEventListener('wheel', this.onWheelBound);
    this.container.removeEventListener('touchstart', this.onTouchStartBound);
    this.container.removeEventListener('touchmove', this.onTouchMoveBound);
    this.container.removeEventListener('touchend', this.onTouchEndBound);

    if (!this.isMobile) {
      this.container.removeEventListener('pointerdown', this.onPointerDownBound);
      this.container.removeEventListener('pointermove', this.onPointerMoveBound);
      this.container.removeEventListener('pointerup', this.onPointerUpBound);
      this.container.removeEventListener('pointercancel', this.onPointerCancelBound);
      document.removeEventListener('contextmenu', this.onContextMenuBound);
    }

    // Reset all properties
    this.scale = this.startingScale;
    this.lastScale = this.startingScale;
    this.startX = 0;
    this.startY = 0;
    this.panX = 0;
    this.panY = 0;
    this.initialDistance = null;
    this.lastPanX = 0;
    this.lastPanY = 0;
    this.rotation = 0;
    this.activeButton = null;

    // Reset additional properties
    this.rotation = 0;
    this.rotationX = 0;
    this.rotationY = 0;
    this.perspectiveOriginX = 50;
    this.perspectiveOriginY = 50;
    this.use3D = 0;

    window.removeEventListener('resize', this.updatePerspective);

    // Reset container styles
    if (this.container) {
      this.container.style.perspective = '';
      this.container.style.perspectiveOrigin = '';
    }

    // Clear references
    this.container = null;
    this.target = null;
  }

  onPointerDown(e) {
    e.preventDefault();
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.activeButton = e.button;
    this.container.setPointerCapture(e.pointerId);
  }

  onPointerMove(e) {
    if (this.activeButton === this.panButton) {
      this.handlePan(e);
    } else if (this.activeButton === this.rotateButton) {
      this.handleRotate(e);
    } else if (this.activeButton === this.zoomButton) {
      this.handleZoom(e);
    }
  }

  handlePan(e) {
    const moveX = (e.clientX - this.startX) / this.scale;
    const moveY = (e.clientY - this.startY) / this.scale;
    this.panX += moveX;
    this.panY += moveY;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.updateTransform();
  }

  handleRotate(e) {
    const deltaX = (e.clientX - this.startX) * 0.5;
    const deltaY = (e.clientY - this.startY) * -0.5;

    const sensitivity3D = 0.5;

    switch (this.use3D) {
      case 0: // No 3D
        this.rotation += deltaY;
        break;
      case 1: // Full 3D
        this.rotationY += deltaX * sensitivity3D;
        this.rotationX += deltaY * sensitivity3D;
        break;
    }

    this.updateTransform();
    this.startX = e.clientX;
    this.startY = e.clientY;
  }

  handleZoom(e) {
    const delta = (e.clientY - this.startY) * -0.01;
    const newScale = this.scale + delta;
    this.setScaleWithCenter(newScale, e.clientX, e.clientY);
    this.updateTransform();
    this.startY = e.clientY;
  }

  onPointerUp(e) {
    this.container.releasePointerCapture(e.pointerId);
    this.activeButton = null;
    this.lastScale = this.scale;
  }

  onPointerCancel(e) {
    this.container.releasePointerCapture(e.pointerId);
    this.activeButton = null;
    this.lastScale = this.scale;
  }

  updatePerspective() {
    const rect = {width: window.innerWidth, height: window.innerHeight};//this.container.getBoundingClientRect();
    const diagonal = Math.sqrt(rect.width * rect.width + rect.height * rect.height);
    this.perspective = diagonal * 0.75; // You can adjust this multiplier
    this.container.style.perspective = `${this.perspective}px`;
  }

  updateTransform() {
    let transform = `scale(${this.scale}) translate(${this.panX}px, ${this.panY}px)`;

    switch (this.use3D) {
      case 0:
        transform += ` rotate(${this.rotation}deg)`;
        break;
      case 1:
        // Apply perspective and adjust the transform origin
        this.container.style.perspectiveOrigin = `${this.perspectiveOriginX}% ${this.perspectiveOriginY}%`;
        this.target.style.transformOrigin = 'center center';
        
        // Apply skew and rotate to create a more natural 3D effect
        transform += ` rotateX(${this.rotationX}deg) rotateY(${this.rotationY}deg)`;
        break;
    }

    this.target.style.transform = transform;
  }

  onWheel(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = this.container.getBoundingClientRect();
    const centerX = e.clientX;
    const centerY = e.clientY;

    const delta = Math.sign(e.deltaY) * -0.1;
    const newScale = this.scale + delta;

    this.setScaleWithCenter(newScale, centerX, centerY);
    this.updateTransform();
  }

  onTouchMove(e) {
    e.preventDefault();
    this.touchCount = e.touches.length;

    if (this.touchCount === 1) {
      this.handleOneFingerTouch(e.touches[0]);
    } else if (this.touchCount === 2) {
      this.handleTwoFingerTouch(e.touches[0], e.touches[1]);
    }
  }
  handleOneFingerTouch(touch) {
    const deltaX = touch.pageX - this.startX;
    const deltaY = touch.pageY - this.startY;

    // Rotate in 3D
    const sensitivity = 0.5;
    this.rotationY += deltaX * sensitivity;
    this.rotationX -= deltaY * sensitivity;

    this.startX = touch.pageX;
    this.startY = touch.pageY;
    this.updateTransform();
  }

  handleTwoFingerTouch(touch1, touch2) {
    const currentDistance = Math.hypot(
      touch2.pageX - touch1.pageX,
      touch2.pageY - touch1.pageY
    );

    const centerX = (touch1.pageX + touch2.pageX) / 2;
    const centerY = (touch1.pageY + touch2.pageY) / 2;

    if (this.initialDistance === null) {
      this.initialDistance = currentDistance;
      this.lastCenterX = centerX;
      this.lastCenterY = centerY;
    } else {
      // Handle zooming
      const newScale = (currentDistance / this.initialDistance) * this.lastScale;
      this.setScaleWithCenter(newScale, centerX, centerY);

      // Handle panning
      const movementX = centerX - this.lastCenterX;
      const movementY = centerY - this.lastCenterY;
      this.panX += movementX / this.scale;
      this.panY += movementY / this.scale;

      this.lastCenterX = centerX;
      this.lastCenterY = centerY;
    }

    this.updateTransform();
  }

  onTouchEnd(e) {
    this.touchCount = e.touches.length;

    if (this.touchCount < 2) {
      this.initialDistance = null;
      this.lastScale = this.scale;
    }

    if (this.touchCount === 0) {
      this.startX = 0;
      this.startY = 0;
    } else if (this.touchCount === 1) {
      this.startX = e.touches[0].pageX;
      this.startY = e.touches[0].pageY;
    }
  }
  
  onTouchStart(e) {
    this.touchCount = e.touches.length;

    if (this.touchCount === 1) {
      this.startX = e.touches[0].pageX;
      this.startY = e.touches[0].pageY;
    } else if (this.touchCount === 2) {
      this.initialDistance = null;
    }
  }

  setScaleWithCenter(newScale, centerX, centerY) {
    newScale = Math.min(Math.max(0.25, newScale), 3);
    if (newScale !== this.scale) {
      const rect = this.container.getBoundingClientRect();
      const offsetX = centerX - rect.left - rect.width / 2;
      const offsetY = centerY - rect.top - rect.height / 2;
      const scaleRatio = newScale / this.scale;

      this.panX -= offsetX * (scaleRatio - 1) / newScale;
      this.panY -= offsetY * (scaleRatio - 1) / newScale;
      this.scale = newScale;
    }
  }

  onContextMenu(e) {
    e.preventDefault();
  }
}