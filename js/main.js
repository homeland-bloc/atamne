// Main Entry Point - Game Initialization and Startup
import { BreedingGame } from './breedinggame.js';

/**
 * Main application class - handles initialization and global setup
 */
class GameApplication {
    constructor() {
        this.game = null;
        this.isInitialized = false;
        this.debugMode = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Wait for DOM to be ready
            await this.waitForDOM();
            
            // Check browser compatibility
            if (!this.checkCompatibility()) {
                this.showCompatibilityError();
                return;
            }
            
            // Initialize game systems
            this.setupErrorHandling();
            this.setupPerformanceMonitoring();
            this.detectDeviceCapabilities();
            
            // Create and start the game
            this.game = new BreedingGame();
            this.isInitialized = true;
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Show loading complete
            this.hideLoadingScreen();
            
            console.log('🧬 Gene Breeding & Battle Simulator initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showInitializationError(error);
        }
    }

    /**
     * Wait for DOM to be fully loaded
     * @returns {Promise} Promise that resolves when DOM is ready
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * Check browser compatibility
     * @returns {boolean} True if browser is compatible
     */
    checkCompatibility() {
        // Check for required features
        const requiredFeatures = [
            'Promise',
            'fetch',
            'localStorage',
            'addEventListener'
        ];
        
        for (const feature of requiredFeatures) {
            if (typeof window[feature] === 'undefined') {
                console.warn(`Missing required feature: ${feature}`);
                return false;
            }
        }
        
        // Check for ES6 module support
        if (!window.HTMLScriptElement || !('noModule' in HTMLScriptElement.prototype)) {
            console.warn('ES6 modules not supported');
            return false;
        }
        
        return true;
    }

    /**
     * Show compatibility error message
     */
    showCompatibilityError() {
        const errorHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
                z-index: 10000;
            ">
                <h2 style="color: #ff6b6b; margin-bottom: 15px;">Browser Not Supported</h2>
                <p style="color: #666; margin-bottom: 20px;">
                    This game requires a modern browser with ES6 support.
                    Please update your browser or try a different one.
                </p>
                <p style="color: #999; font-size: 14px;">
                    Recommended: Chrome 61+, Firefox 60+, Safari 12+, Edge 79+
                </p>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHTML);
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            
            if (this.debugMode) {
                this.showDebugError(event.error);
            } else {
                this.showUserFriendlyError('An unexpected error occurred. Please refresh the page.');
            }
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            if (this.debugMode) {
                this.showDebugError(event.reason);
            }
            
            // Prevent the default browser error handling
            event.preventDefault();
        });
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor frame rate
        if (window.performance && window.performance.mark) {
            window.performance.mark('game-init-start');
        }
        
        // Check for low performance devices
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            console.info('Low-performance device detected, optimizing settings');
            document.documentElement.classList.add('low-performance');
        }
    }

    /**
     * Detect device capabilities and apply optimizations
     */
    detectDeviceCapabilities() {
        // Mobile detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            document.documentElement.classList.add('mobile-device');
        }
        
        // Touch support detection
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (hasTouch) {
            document.documentElement.classList.add('touch-device');
        }
        
        // Reduced motion preference
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduced-motion');
        }
        
        // High contrast preference
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            document.documentElement.classList.add('high-contrast');
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
        
        // Visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleTabHidden();
            } else {
                this.handleTabVisible();
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
        
        // Before unload (warn about unsaved progress)
        window.addEventListener('beforeunload', (event) => {
            if (this.game && this.shouldWarnBeforeUnload()) {
                event.preventDefault();
                event.returnValue = 'Are you sure you want to leave? Your progress may be lost.';
                return event.returnValue;
            }
        });
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboardShortcuts(event) {
        // Only handle shortcuts if no input is focused
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (event.code) {
            case 'KeyR':
                if (event.ctrlKey || event.metaKey) {
                    // Ctrl+R / Cmd+R - allow default refresh
                    return;
                }
                break;
                
            case 'F5':
                // F5 - allow default refresh
                return;
                
            case 'F12':
                // F12 - toggle debug mode
                if (event.shiftKey) {
                    this.toggleDebugMode();
                    event.preventDefault();
                }
                break;
                
            case 'Escape':
                // ESC - cancel current action
                this.handleEscapeKey();
                break;
        }
    }

    /**
     * Handle tab becoming hidden
     */
    handleTabHidden() {
        // Pause any intensive operations
        if (this.game && this.game.botSolver && this.game.botSolver.isActive()) {
            console.log('Pausing bot due to tab visibility');
        }
    }

    /**
     * Handle tab becoming visible
     */
    handleTabVisible() {
        // Resume operations if needed
        if (this.game && this.game.botSolver && this.game.botSolver.isActive()) {
            console.log('Resuming bot after tab visibility');
        }
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            if (this.game && this.game.battleDisplay) {
                this.game.battleDisplay.updateBattleDisplay();
            }
        }, 250);
    }

    /**
     * Check if we should warn before unloading
     * @returns {boolean} True if warning should be shown
     */
    shouldWarnBeforeUnload() {
        if (!this.game) return false;
        
        // Warn if bot is active
        if (this.game.botSolver && this.game.botSolver.isActive()) {
            return true;
        }
        
        // Warn if in middle of battle
        if (this.game.battleSystem && this.game.battleSystem.battlePhase === 'battle') {
            return true;
        }
        
        // Warn if breeding is in progress
        if (this.game.breedingLogic && this.game.breedingLogic.isBreedingActive()) {
            return true;
        }
        
        return false;
    }

    /**
     * Handle escape key press
     */
    handleEscapeKey() {
        // Close any open popups
        document.querySelectorAll('.confirmation-popup.show').forEach(popup => {
            popup.classList.remove('show');
        });
        
        document.querySelectorAll('.breeding-preview.show').forEach(preview => {
            preview.classList.remove('show');
        });
    }

    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        document.documentElement.classList.toggle('debug-mode', this.debugMode);
        
        console.log(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
        
        if (this.debugMode) {
            this.showDebugInfo();
        }
    }

    /**
     * Show debug information
     */
    showDebugInfo() {
        if (!this.game) return;
        
        console.group('🐛 Debug Information');
        console.log('Game Instance:', this.game);
        console.log('Performance:', window.performance.now() + 'ms since init');
        console.log('Browser:', navigator.userAgent);
        console.log('Viewport:', `${window.innerWidth}x${window.innerHeight}`);
        
        if (this.game.characters) {
            const unlocked = Object.values(this.game.characters).filter(c => c.unlocked).length;
            const total = Object.keys(this.game.characters).length;
            console.log(`Characters: ${unlocked}/${total} unlocked`);
        }
        
        console.groupEnd();
    }

    /**
     * Show debug error
     * @param {Error} error - Error to display
     */
    showDebugError(error) {
        console.error('DEBUG ERROR:', error);
        // Could show error overlay in debug mode
    }

    /**
     * Show user-friendly error
     * @param {string} message - Error message to display
     */
    showUserFriendlyError(message) {
        // Show a user-friendly error message
        console.warn('User Error:', message);
    }

    /**
     * Show initialization error
     * @param {Error} error - Initialization error
     */
    showInitializationError(error) {
        const errorHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
                z-index: 10000;
            ">
                <h2 style="color: #ff6b6b; margin-bottom: 15px;">Failed to Load Game</h2>
                <p style="color: #666; margin-bottom: 20px;">
                    The game failed to initialize. Please refresh the page and try again.
                </p>
                <button onclick="window.location.reload()" style="
                    background: #4ecdc4;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                ">Refresh Page</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHTML);
    }

    /**
     * Hide loading screen if it exists
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Get game instance
     * @returns {BreedingGame|null} Game instance or null
     */
    getGame() {
        return this.game;
    }

    /**
     * Check if application is initialized
     * @returns {boolean} True if initialized
     */
    isReady() {
        return this.isInitialized && this.game !== null;
    }
}

// Create and initialize the application
const app = new GameApplication();

// Start the application
app.init().catch(error => {
    console.error('Critical initialization error:', error);
});

// Make app available globally for debugging
if (typeof window !== 'undefined') {
    window.gameApp = app;
}
