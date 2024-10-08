class FunShowShade extends FunShowEventEmitter {
    constructor(container, options = {}) {
        super();
        this.container = container;
        this.givenContainer = this.container;
        this.debug = options.debug || false;
        this.bgColor = options.bgColor || '#ffffff';
        this.highlightColor = options.highlightColor || '#007bff';
        this.textColor = options.textColor || '#000000';
        this.shadeResolutionScale = options.hasOwnProperty('shadeResolutionScale') ? options.shadeResolutionScale : 0.5;
        this.padding = options.hasOwnProperty('padding') ? options.padding : 10;
        this.linePadding = options.hasOwnProperty('linePadding') ? options.linePadding : 20;
        this.highlightGlow = options.hasOwnProperty('highlightGlow') ? options.highlightGlow : true;
        this.highlightBorderSize = options.hasOwnProperty('highlightBorderSize') ? options.highlightBorderSize : 4;
        this.circleGlow = options.hasOwnProperty('circleGlow') ? options.circleGlow : true;
        this.throb = options.hasOwnProperty('throb') ? options.throb : 1; // Default to 1 for original behavior
        this.circleSize = options.hasOwnProperty('circleSize') ? options.circleSize : 1.5; // Default to 1 for original size
        this.resizeDebounceDelay = options.hasOwnProperty('resizeDebounce') ? options.resizeDebounce : 250;
        this.targetElement = null;
        this.helpCard = null;
        this.resizeTimer = null;
        this.updateHelpTimer = null;
        this.currentHelpInfo = null;
        this.transitionDuration = 600; // 300ms, matching the CSS transition duration
        this.connectorAndCircles = null;
        if (!this.container) {
            this.container = document.createElement('div');
            document.body.appendChild(this.container);
        }
        this.injectCSS();
        this.injectHTML();
        this.bindEvents();
    }

    removeAllCreatedElements() {
        const elementsToRemove = document.querySelectorAll(
            '.funshow-shade-debug-rect, ' +
            '.funshow-shade-debug-line, ' +
            '.funshow-shade-circle, ' +
            '.funshow-shade-connector, ' +
            '.funshow-shade-help-card'
        );
        elementsToRemove.forEach(element => element.remove());
    }

    injectCSS() {
        let throbAnimation = '';
        if (this.throb > 0) {
            const scaleStart = this.circleSize * 2;
            const scaleEnd = scaleStart + this.throb;
            throbAnimation = `
                @keyframes funshow-shade-circle-throb {
                    0%, 100% {
                        transform: scale(${scaleStart});
                    }
                    50% {
                        transform: scale(${scaleEnd});
                    }
                }
            `;
        }

        const style = document.createElement('style');
        style.setAttribute('data-funshow-shade-style', '');
        let styles = `
            ${throbAnimation}

            .funshow-shade-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
            }
            .funshow-shade-help-card {
                position: absolute;
                background-color: ${this.bgColor};
                color: ${this.textColor};
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                max-width: 300px;
                transition: all ${(this.transitionDuration*0.001).toFixed(2)}s ease-in-out;
                z-index: 10010;
            }
            .funshow-shade-help-card h3 {
                margin-top: 0;
                margin-bottom: 8px;
                color: ${this.textColor};
            }
            .funshow-shade-help-card p {
                margin: 0;
                color: ${this.textColor};
            }

            @keyframes funshow-shade-outline-throb {
                0%, 100% {
                    box-shadow: 0 0 0 2px ${this.highlightColor}80,
                                0 0 0 4px ${this.highlightColor}4D,
                                inset 0 0 0 2px ${this.highlightColor}80,
                                inset 0 0 0 4px ${this.highlightColor}4D;
                }
                50% {
                    box-shadow: 0 0 0 4px ${this.highlightColor}80,
                                0 0 0 8px ${this.highlightColor}4D,
                                inset 0 0 0 4px ${this.highlightColor}80,
                                inset 0 0 0 8px ${this.highlightColor}4D;
                }
            }

            .funshow-shade-outline {
                box-sizing: border-box;
                position: fixed;
                z-index: 10000;
                pointer-events: none;
                border: ${this.highlightBorderSize}px solid ${this.highlightColor};
                ${this.highlightGlow ? `
                    animation: funshow-shade-outline-throb 2s ease-in-out infinite;
                ` : ''}
                width: 100%;
                height: 100%;
            }

            .funshow-shade-circle {
                position: fixed;
                width: ${5 * this.circleSize}px;
                height: ${5 * this.circleSize}px;
                border-radius: 50%;
                z-index: 10001;
                pointer-events: none;
                ${this.circleGlow ? `
                    box-shadow: 0 0 0 ${0.5 * this.circleSize}px ${this.highlightColor}80,
                                0 0 0 ${1 * this.circleSize}px ${this.highlightColor}4D,
                                inset 0 0 0 ${0.5 * this.circleSize}px ${this.highlightColor}80,
                                inset 0 0 0 ${1 * this.circleSize}px ${this.highlightColor}4D;
                ` : `
                    background-color: ${this.highlightColor};
                `}
            }

            .funshow-shade-connector {
                position: fixed;
                background-color: ${this.bgColor};
                height: 0px;
                border: 2px solid ${this.bgColor};
                box-sizing: border-box;
                transform-origin: left center;
                z-index: 10002;
                pointer-events: none;
            }
            .funshow-shade-connector,
            .funshow-shade-circle {
                opacity: 0;
            }
            .funshow-shade-connector.visible,
            .funshow-shade-circle.visible {
                opacity: 1;
            }
        `;
        if (this.debug) {
            styles += `
                .funshow-shade-debug-rect {
                    position: fixed;
                    border: 2px solid;
                    z-index: 10000;
                    pointer-events: none;
                    box-sizing: border-box;
                    color: ${this.textColor};
                    font-size: 12px;
                    padding: 2px;
                }
                .funshow-shade-debug-line {
                    position: fixed;
                    height: 2px;
                    background-color: yellow;
                    z-index: 10001;
                    pointer-events: none;
                }
            `;
        }
        style.textContent = styles;
        document.head.appendChild(style);
    }

    injectHTML() {
        this.container.innerHTML = `
            <div class="funshow-shade-container"></div>
        `;
    }
    bindEvents() {
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        if (this.resizeTimer) {
            clearTimeout(this.resizeTimer);
        }
        const shadeContainer = this.container.querySelector('.funshow-shade-container');
        shadeContainer.style.background = 'rgba(0, 0, 0, 0.8)';

        this.resizeTimer = setTimeout(() => {
            if (this.targetElement && this.currentHelpInfo) {
                this.updateHelp(this.targetElement, this.currentHelpInfo);
            }
        }, this.resizeDebounceDelay);
    }

    showHelp({element, helpInfo}) {
        this.targetElement = element;
        this.currentHelpInfo = helpInfo;
        this.updateHelp(element, helpInfo);
    }

    updateHelp(element, helpInfo) {
        if (this.resizeTimer) {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = null;
        }
        if (this.updateHelpTimer) {
            clearTimeout(this.updateHelpTimer);
            this.updateHelpTimer = null;
        }

        const shadeContainer = this.container.querySelector('.funshow-shade-container');
        
        if (!this.helpCard) {
            this.helpCard = document.createElement('div');
            this.helpCard.className = 'funshow-shade-help-card';
            shadeContainer.appendChild(this.helpCard);
        }

        this.helpCard.innerHTML = `
            <h3>${helpInfo.label}</h3>
            <p>${helpInfo.content}</p>
        `;

        this.createBackgroundImage(element);
        this.hideConnectorAndCircles();
        this.createOutline(element);
        this.positionHelpCard(element, this.helpCard);

        // Delay the creation/update of the connector and circles
        this.updateHelpTimer = setTimeout(() => {
            const newPosition = this.calculateBestPosition(element, this.helpCard);
            if (this.isPositionDifferent(newPosition, this.helpCard)) {
                // If there's a better position, trigger another updateHelp
                this.updateHelp(element, helpInfo);
            } else {
                this.drawLine(this.helpCard, element.getBoundingClientRect());
                this.showConnectorAndCircles();
            }
        }, this.transitionDuration);
    }

    calculateBestPosition(targetElement, helpCard) {
        const targetRect = targetElement.getBoundingClientRect();
        const cardRect = helpCard.getBoundingClientRect();

        const positions = this.getPositions(targetRect, cardRect);
        let validPositions = this.getValidPositions(positions, targetRect, cardRect);

        if (validPositions.length > 0) {
            return validPositions[0];
        } else {
            return {
                left: targetRect.left + (targetRect.width - cardRect.width) / 2,
                top: targetRect.top + (targetRect.height - cardRect.height) / 2,
                label: 'Center'
            };
        }
    }

    getPositions(targetRect, cardRect) {
        const horizontalExtraDistance = 50;
        const verticalExtraDistance = 50;

        return {
            right: {
                left: targetRect.right + horizontalExtraDistance,
                top: targetRect.top + (targetRect.height - cardRect.height) / 2,
                label: 'Right'
            },
            left: {
                left: targetRect.left - cardRect.width - horizontalExtraDistance,
                top: targetRect.top + (targetRect.height - cardRect.height) / 2,
                label: 'Left'
            },
            top: {
                left: targetRect.left + (targetRect.width - cardRect.width) / 2,
                top: targetRect.top - cardRect.height - verticalExtraDistance,
                label: 'Above'
            },
            bottom: {
                left: targetRect.left + (targetRect.width - cardRect.width) / 2,
                top: targetRect.bottom + verticalExtraDistance,
                label: 'Below'
            },
            topLeft: {
                left: targetRect.left - cardRect.width - horizontalExtraDistance,
                top: targetRect.top - cardRect.height - verticalExtraDistance,
                label: 'Top-left'
            },
            topRight: {
                left: targetRect.right + horizontalExtraDistance,
                top: targetRect.top - cardRect.height - verticalExtraDistance,
                label: 'Top-right'
            },
            bottomLeft: {
                left: targetRect.left - cardRect.width - horizontalExtraDistance,
                top: targetRect.bottom + verticalExtraDistance,
                label: 'Bottom-left'
            },
            bottomRight: {
                left: targetRect.right + horizontalExtraDistance,
                top: targetRect.bottom + verticalExtraDistance,
                label: 'Bottom-right'
            }
        };
    }

    getValidPositions(positions, targetRect, cardRect) {
        return Object.values(positions).filter(pos => {
            const testRect = new DOMRect(pos.left, pos.top, cardRect.width, cardRect.height);
            return !this.isOverlapping(testRect, targetRect) && this.isFullyOnScreen(testRect);
        });
    }

    isPositionDifferent(newPosition, helpCard) {
        const currentLeft = parseInt(helpCard.style.left);
        const currentTop = parseInt(helpCard.style.top);
        return Math.abs(currentLeft - newPosition.left) > 1 || Math.abs(currentTop - newPosition.top) > 1;
    }

    positionHelpCard(targetElement, helpCard) {
        const newPosition = this.calculateBestPosition(targetElement, helpCard);
        helpCard.style.position = 'fixed';
        helpCard.style.left = `${newPosition.left}px`;
        helpCard.style.top = `${newPosition.top}px`;

        if (this.debug) {
            this.removeDebugElements();
            this.createDebugRect(targetElement.getBoundingClientRect(), 'Target', 'blue');
            this.createDebugRect(new DOMRect(newPosition.left, newPosition.top, helpCard.offsetWidth, helpCard.offsetHeight), newPosition.label);
        }
    }

    createBackgroundImage(targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const shadeContainer = this.container.querySelector('.funshow-shade-container');
        // Create a canvas with resolution based on shadeResolutionScale
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(window.innerWidth * this.shadeResolutionScale);
        canvas.height = Math.round(window.innerHeight * this.shadeResolutionScale);
        const ctx = canvas.getContext('2d');
        // Fill the entire canvas with the semi-transparent black
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Calculate the position and size of the transparent area
        const scale = this.shadeResolutionScale;
        const x = Math.round((targetRect.left - this.padding) * scale);
        const y = Math.round((targetRect.top - this.padding) * scale);
        const width = Math.round((targetRect.width + 2 * this.padding) * scale);
        const height = Math.round((targetRect.height + 2 * this.padding) * scale);
        // Clear the rectangle for the target element
        ctx.clearRect(x, y, width, height);
        // Convert the canvas to a data URL
        const dataURL = canvas.toDataURL();
        // Apply the background image to the container
        shadeContainer.style.background = `url(${dataURL})`;
        shadeContainer.style.backgroundSize = 'cover';
    }

   destroy() {
        this.emit('destroy');

        if (this.resizeTimer) {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = null;
        }

        // Remove the style element
        const styleElement = document.head.querySelector('style[data-funshow-shade-style]');
        if (styleElement) {
            document.head.removeChild(styleElement);
        }

        // Remove all created elements
        this.removeDebugElements();
        this.removeAllCreatedElements();
        this.removeConnectorAndCircles();

        // Clear the container
        if (this.container) {
            this.container.innerHTML = '';
        }

        // Remove event listeners
        this.off();
        window.removeEventListener('resize', this.handleResize);

        // Remove the container if it was created by this instance
        if (this.container && this.container !== this.givenContainer) {
            this.container.remove();
        }

        // Nullify references
        this.givenContainer = null;
        this.container = null;
        this.targetElement = null;
        this.helpCard = null;
        this.currentHelpInfo = null;
        this.connectorAndCircles = null;
        this.outline = null;
        this.resizeTimer = null;
    }


    isOverlapping(rect1, rect2) {
        return !(rect1.right <= rect2.left || 
                 rect1.left >= rect2.right || 
                 rect1.bottom <= rect2.top || 
                 rect1.top >= rect2.bottom);
    }

    isFullyOnScreen(rect) {
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    createDebugRect(rect, label, color = 'red') {
        if (!this.debug) return;
        const debugRect = document.createElement('div');
        debugRect.style.left = `${rect.left}px`;
        debugRect.style.top = `${rect.top}px`;
        debugRect.style.width = `${rect.width}px`;
        debugRect.style.height = `${rect.height}px`;
        debugRect.style.border = `2px solid ${color}`;
        debugRect.style.backgroundColor = color === 'red' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 0, 255, 0.2)';
        debugRect.textContent = label;
        debugRect.classList.add('funshow-shade-debug-rect');
        document.body.appendChild(debugRect);
    }

    findNearestPointOnRect(x, y, rect) {
        const nearestX = Math.max(rect.left, Math.min(x, rect.right));
        const nearestY = Math.max(rect.top, Math.min(y, rect.bottom));

        if (nearestX === x && nearestY === y) {
            const distToLeft = x - rect.left;
            const distToRight = rect.right - x;
            const distToTop = y - rect.top;
            const distToBottom = rect.bottom - y;
            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

            if (minDist === distToLeft) return { x: rect.left, y: nearestY };
            if (minDist === distToRight) return { x: rect.right, y: nearestY };
            if (minDist === distToTop) return { x: nearestX, y: rect.top };
            return { x: nearestX, y: rect.bottom };
        }

        return { x: nearestX, y: nearestY };
    }

    createDebugLine(x1, y1, x2, y2) {
        if (!this.debug) return;
        const line = document.createElement('div');
        const length = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;

        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.width = `${length}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.transformOrigin = '0 0';
        line.classList.add('funshow-shade-debug-line');

        document.body.appendChild(line);
    }

    findIntersectionPoint(rect, x1, y1, x2, y2) {
        const m = (y2 - y1) / (x2 - x1);
        const b = y1 - m * x1;

        const intersections = [
            this.intersectLine(rect.left, rect.top, rect.left, rect.bottom, m, b),
            this.intersectLine(rect.left, rect.top, rect.right, rect.top, m, b),
            this.intersectLine(rect.right, rect.top, rect.right, rect.bottom, m, b),
            this.intersectLine(rect.left, rect.bottom, rect.right, rect.bottom, m, b)
        ].filter(point => point !== null);

        if (intersections.length === 0) {
            // If no intersections found, return the center of the nearest edge
            const distToLeft = Math.abs(x2 - rect.left);
            const distToRight = Math.abs(x2 - rect.right);
            const distToTop = Math.abs(y2 - rect.top);
            const distToBottom = Math.abs(y2 - rect.bottom);

            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

            if (minDist === distToLeft) return { x: rect.left, y: (rect.top + rect.bottom) / 2 };
            if (minDist === distToRight) return { x: rect.right, y: (rect.top + rect.bottom) / 2 };
            if (minDist === distToTop) return { x: (rect.left + rect.right) / 2, y: rect.top };
            return { x: (rect.left + rect.right) / 2, y: rect.bottom };
        }

        return intersections.reduce((closest, point) => {
            const distToClosest = (closest.x - x2)**2 + (closest.y - y2)**2;
            const distToPoint = (point.x - x2)**2 + (point.y - y2)**2;
            return distToPoint < distToClosest ? point : closest;
        });
    }

    intersectLine(x1, y1, x2, y2, m, b) {
        if (x1 === x2) {
            const y = m * x1 + b;
            if (y >= Math.min(y1, y2) && y <= Math.max(y1, y2)) {
                return { x: x1, y: y };
            }
        } else if (y1 === y2) {
            const x = Math.abs(m) < 1e-10 ? x1 : (y1 - b) / m;
            if (x >= Math.min(x1, x2) && x <= Math.max(x1, x2)) {
                return { x: x, y: y1 };
            }
        }
        return null;
    }

    createConnector(x1, y1, x2, y2) {
        const connector = document.createElement('div');
        connector.classList.add('funshow-shade-connector');

        const length = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;

        connector.style.left = `${x1}px`;
        connector.style.top = `${y1 - 2}px`;
        connector.style.width = `${length}px`;
        connector.style.transform = `rotate(${angle}deg)`;
        connector.angle = angle;

        document.body.appendChild(connector);
        return connector;
    }

    drawLine(helpCard, targetRect) {
        this.removeDebugElements();
        this.removeConnectorAndCircles();
        
        // Apply this.padding to the targetRect
        const paddedTargetRect = {
            left: targetRect.left - this.linePadding,
            top: targetRect.top - this.linePadding,
            right: targetRect.right + this.linePadding,
            bottom: targetRect.bottom + this.linePadding,
            width: targetRect.width + 2 * this.linePadding,
            height: targetRect.height + 2 * this.linePadding
        };

        const cardRect = helpCard.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        const nearestPoint = this.findNearestPointOnRect(cardCenterX, cardCenterY, paddedTargetRect);
        const intersectionPoint = this.findIntersectionPoint(cardRect, cardCenterX, cardCenterY, nearestPoint.x, nearestPoint.y);

        if (intersectionPoint) {
            if (this.debug) {
                this.createDebugLine(intersectionPoint.x, intersectionPoint.y, nearestPoint.x, nearestPoint.y);
            }
            const connector = this.createConnector(intersectionPoint.x, intersectionPoint.y, nearestPoint.x, nearestPoint.y);
            const startCircle = this.createCircle(intersectionPoint.x, intersectionPoint.y, 'start', connector.angle);
            const endCircle = this.createCircle(nearestPoint.x, nearestPoint.y, 'end', connector.angle);
            this.connectorAndCircles = [connector, startCircle, endCircle];
        } else {
            console.warn('Could not find a valid intersection point for the connector line.');
        }
    }

    createConnector(x1, y1, x2, y2) {
        const connector = document.createElement('div');
        connector.classList.add('funshow-shade-connector');

        const length = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;

        connector.style.left = `${x1}px`;
        connector.style.top = `${y1}px`;
        connector.style.width = `${length}px`;
        connector.style.transform = `rotate(${angle}deg)`;
        connector.angle = angle;

        document.body.appendChild(connector);
        return connector;
    }

    createCircle(x, y, position, angle) {
        const circle = document.createElement('div');
        circle.classList.add('funshow-shade-circle');
        const offset = 5 * this.circleSize / 2;
        circle.style.left = `${x - offset}px`;
        circle.style.top = `${y - offset}px`;
        if (position === 'start') {
            circle.style.transform = `scale(0.5) rotate(${angle+90}deg) translateY(25%)`;
            circle.style.boxShadow = 'none';
        } else if (this.throb > 0) {
            circle.style.animation = 'funshow-shade-circle-throb 2s ease-in-out infinite';
        } else {
            circle.style.transform = `scale(${this.circleSize * 2})`;
        }
        circle.style.backgroundColor = this.bgColor;
        document.body.appendChild(circle);
        return circle;
    }

    createOutline(targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const outline = this.outline ?? document.createElement('div');
        outline.className = 'funshow-shade-outline';
        outline.style.left = `${targetRect.left - this.padding - this.highlightBorderSize / 2}px`;
        outline.style.top = `${targetRect.top - this.padding - this.highlightBorderSize / 2}px`;
        outline.style.width = `${targetRect.width + (2 * this.padding) + this.highlightBorderSize}px`;
        outline.style.height = `${targetRect.height + (2 * this.padding) + this.highlightBorderSize}px`;
        if (!this.outline) {
            document.body.appendChild(outline);
        }
        this.outline = outline;
    }

    hideConnectorAndCircles() {
        if (this.connectorAndCircles) {
            this.connectorAndCircles.forEach(element => {
                element.classList.remove('visible');
            });
        }
    }

    showConnectorAndCircles() {
        if (this.connectorAndCircles) {
            this.connectorAndCircles.forEach(element => {
                element.classList.add('visible');
            });
        }
        if (this.outline) {
            this.outline.style.opacity = '1';
        }
    }

    removeConnectorAndCircles() {
        if (this.connectorAndCircles) {
            this.connectorAndCircles.forEach(element => element.remove());
        }
        this.connectorAndCircles = null;
    }

    removeDebugElements() {
        const elementsToRemove = document.querySelectorAll('.funshow-shade-debug-rect, .funshow-shade-debug-line');
        elementsToRemove.forEach(element => element.remove());
    }
}