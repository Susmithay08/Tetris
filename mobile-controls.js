/**
 * Mobile Controls for Tetris Game
 * Provides touch-optimized controls with hold-to-repeat functionality
 */

class MobileControls {
    constructor() {
        this.activeButtons = new Map();
        this.repeatIntervals = new Map();
        this.touchIdentifiers = new Map(); // Track which touch is controlling which button

        // Configuration
        this.config = {
            initialDelay: 200,      // Delay before repeat starts (ms)
            repeatDelay: 100,       // Delay between repeats (ms)
            fastRepeatDelay: 50,    // Faster repeat for down key (ms)
        };

        this.init();
    }

    init() {
        // Get all control buttons
        this.buttons = {
            up: document.getElementById('btn-up'),
            down: document.getElementById('btn-down'),
            left: document.getElementById('btn-left'),
            right: document.getElementById('btn-right'),
            rotate: document.getElementById('btn-rotate')
        };

        // Setup event listeners for each button
        Object.entries(this.buttons).forEach(([key, button]) => {
            if (button) {
                this.setupButton(button, key);
            }
        });

        // Prevent context menu on long press
        document.getElementById('mobile-controls')?.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    setupButton(button, buttonKey) {
        const keyCode = parseInt(button.dataset.key);

        // Touch events (primary for mobile)
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleButtonDown(button, keyCode, buttonKey, e.changedTouches[0].identifier);
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleButtonUp(button, buttonKey, e.changedTouches[0].identifier);
        }, { passive: false });

        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleButtonUp(button, buttonKey, e.changedTouches[0].identifier);
        }, { passive: false });

        // Pointer events (fallback/unified approach)
        button.addEventListener('pointerdown', (e) => {
            // Skip if touch event already handled this
            if (e.pointerType === 'touch') return;

            e.preventDefault();
            this.handleButtonDown(button, keyCode, buttonKey, e.pointerId);
        });

        button.addEventListener('pointerup', (e) => {
            if (e.pointerType === 'touch') return;

            e.preventDefault();
            this.handleButtonUp(button, buttonKey, e.pointerId);
        });

        button.addEventListener('pointercancel', (e) => {
            if (e.pointerType === 'touch') return;

            e.preventDefault();
            this.handleButtonUp(button, buttonKey, e.pointerId);
        });

        // Prevent default click to avoid double-firing
        button.addEventListener('click', (e) => {
            e.preventDefault();
        });

        // Mouse leave handling for pointer events
        button.addEventListener('pointerleave', (e) => {
            if (this.activeButtons.has(buttonKey)) {
                this.handleButtonUp(button, buttonKey, e.pointerId);
            }
        });
    }

    handleButtonDown(button, keyCode, buttonKey, identifier) {
        // Prevent multiple activations of the same button
        if (this.activeButtons.has(buttonKey)) {
            return;
        }

        // Store the identifier for this button
        this.touchIdentifiers.set(buttonKey, identifier);

        // Mark button as active
        this.activeButtons.set(buttonKey, true);
        button.classList.add('active');

        // Trigger initial key press
        this.simulateKeyEvent('keydown', keyCode);

        // Setup repeat behavior for movement keys
        if (['left', 'right', 'down'].includes(buttonKey)) {
            this.setupRepeat(buttonKey, keyCode);
        }
    }

    handleButtonUp(button, buttonKey, identifier) {
        // Only process if this touch/pointer is controlling this button
        const storedIdentifier = this.touchIdentifiers.get(buttonKey);
        if (storedIdentifier !== undefined && storedIdentifier !== identifier) {
            return;
        }

        // Clear active state
        this.activeButtons.delete(buttonKey);
        this.touchIdentifiers.delete(buttonKey);
        button.classList.remove('active');

        // Clear any repeat intervals
        this.clearRepeat(buttonKey);

        // Trigger key up event
        const keyCode = parseInt(button.dataset.key);
        this.simulateKeyEvent('keyup', keyCode);
    }

    setupRepeat(buttonKey, keyCode) {
        // Clear any existing interval
        this.clearRepeat(buttonKey);

        // Determine repeat speed based on button
        const repeatDelay = buttonKey === 'down'
            ? this.config.fastRepeatDelay
            : this.config.repeatDelay;

        // Set up initial delay before repeating
        const initialTimeout = setTimeout(() => {
            // Start repeating
            const interval = setInterval(() => {
                // Only continue if button is still active
                if (this.activeButtons.has(buttonKey)) {
                    this.simulateKeyEvent('keydown', keyCode);
                } else {
                    this.clearRepeat(buttonKey);
                }
            }, repeatDelay);

            this.repeatIntervals.set(buttonKey, interval);
        }, this.config.initialDelay);

        // Store timeout so we can clear it if needed
        this.repeatIntervals.set(`${buttonKey}-timeout`, initialTimeout);
    }

    clearRepeat(buttonKey) {
        // Clear interval
        const interval = this.repeatIntervals.get(buttonKey);
        if (interval) {
            clearInterval(interval);
            this.repeatIntervals.delete(buttonKey);
        }

        // Clear timeout
        const timeout = this.repeatIntervals.get(`${buttonKey}-timeout`);
        if (timeout) {
            clearTimeout(timeout);
            this.repeatIntervals.delete(`${buttonKey}-timeout`);
        }
    }

    simulateKeyEvent(type, keyCode) {
        // Create and dispatch a keyboard event
        const event = new KeyboardEvent(type, {
            key: this.getKeyFromCode(keyCode),
            code: this.getCodeFromKeyCode(keyCode),
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(event);
    }

    getKeyFromCode(keyCode) {
        const keyMap = {
            37: 'ArrowLeft',
            38: 'ArrowUp',
            39: 'ArrowRight',
            40: 'ArrowDown'
        };
        return keyMap[keyCode] || '';
    }

    getCodeFromKeyCode(keyCode) {
        const codeMap = {
            37: 'ArrowLeft',
            38: 'ArrowUp',
            39: 'ArrowRight',
            40: 'ArrowDown'
        };
        return codeMap[keyCode] || '';
    }

    // Clean up method
    destroy() {
        // Clear all intervals and timeouts
        this.repeatIntervals.forEach((value, key) => {
            if (typeof value === 'number') {
                if (key.includes('timeout')) {
                    clearTimeout(value);
                } else {
                    clearInterval(value);
                }
            }
        });

        this.activeButtons.clear();
        this.repeatIntervals.clear();
        this.touchIdentifiers.clear();
    }
}

// Initialize mobile controls when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileControls = new MobileControls();
    });
} else {
    window.mobileControls = new MobileControls();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.mobileControls) {
        window.mobileControls.destroy();
    }
});