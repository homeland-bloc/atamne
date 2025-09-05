// BotSolver Class - Automated Breeding AI and Strategy
export class BotSolver {
    constructor(gameInstance, breedingLogic) {
        this.game = gameInstance;
        this.breedingLogic = breedingLogic;
        this.active = false;
        this.interval = null;
        this.intervalDelay = 4000; // 4 seconds between attempts
        this.strategy = 'optimal'; // optimal, random, mixed
    }

    /**
     * Check if bot is currently active
     * @returns {boolean} True if bot is active
     */
    isActive() {
        return this.active;
    }

    /**
     * Toggle bot on/off
     * @param {boolean} active - Whether bot should be active
     */
    toggleBot(active) {
        this.active = active;
        
        if (active) {
            this.start();
            this.updateBotStatus(true, 'Bot is solving - Sit back and watch!');
        } else {
            this.stop();
            this.updateBotStatus(false, 'Bot is off - You\'re in control');
        }
    }

    /**
     * Start the bot solver
     */
    start() {
        if (this.interval) return;
        
        this.interval = setInterval(() => {
            if (!this.active) return;
            
            const bestPair = this.findBestBreedingPair();
            if (bestPair) {
                // Set the selected characters in the game
                this.game.selectedCharacters = bestPair;
                this.game.updateDisplay();
                
                // Wait a moment, then breed
                setTimeout(() => {
                    if (this.active && !this.breedingLogic.isBreedingActive()) {
                        this.game.breed();
                    }
                }, 1000);
            } else {
                // No viable pairs found - all discoveries complete
                this.toggleBot(false);
                this.updateBotStatus(false, 'Bot completed - All discoveries found!');
            }
        }, this.intervalDelay);
    }

    /**
     * Stop the bot solver
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        // Clear any selected characters
        this.game.selectedCharacters = [];
        this.game.updateDisplay();
    }

    /**
     * Find the best breeding pair for maximum discoveries
     * @returns {Array|null} Best pair of character IDs or null if none found
     */
    findBestBreedingPair() {
        const unlockedCharacters = this.getUnlockedCharacterIds();
        const lockedCharacters = this.getLockedCharacterIds();
        
        if (lockedCharacters.length === 0) {
            return null; // All characters unlocked
        }
        
        let bestPair = null;
        let bestScore = 0;
        
        // Evaluate all possible pairs
        for (let i = 0; i < unlockedCharacters.length; i++) {
            for (let j = i; j < unlockedCharacters.length; j++) {
                const char1 = this.game.getCharacter(unlockedCharacters[i]);
                const char2 = this.game.getCharacter(unlockedCharacters[j]);
                
                const score = this.evaluateBreedingPair(char1, char2);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestPair = [unlockedCharacters[i], unlockedCharacters[j]];
                }
            }
        }
        
        return bestPair;
    }

    /**
     * Evaluate a breeding pair and return a score
     * @param {GameCharacter} char1 - First character
     * @param {GameCharacter} char2 - Second character
     * @returns {number} Score for this pairing
     */
    evaluateBreedingPair(char1, char2) {
        const compatibility = this.breedingLogic.calculateCompatibility(char1, char2);
        
        if (!compatibility.worthBreeding) {
            return 0; // No new discoveries possible
        }
        
        let score = 0;
        
        // Primary factor: number of new discoveries
        score += compatibility.newDiscoveries * 100;
        
        // Secondary factor: total possibilities (for variety)
        score += compatibility.totalPossible * 10;
        
        // Bonus for high compatibility ratio
        score += compatibility.compatibilityScore * 50;
        
        // Strategy-specific adjustments
        switch (this.strategy) {
            case 'optimal':
                // Prioritize maximum new discoveries
                score += compatibility.newDiscoveries * 50;
                break;
            case 'random':
                // Add randomness to the score
                score += Math.random() * 25;
                break;
            case 'mixed':
                // Balance between optimal and exploration
                score += compatibility.newDiscoveries * 25;
                score += Math.random() * 15;
                break;
        }
        
        return score;
    }

    /**
     * Get array of unlocked character IDs
     * @returns {Array} Array of character IDs
     */
    getUnlockedCharacterIds() {
        return Object.keys(this.game.characters)
            .filter(id => this.game.getCharacter(id).unlocked);
    }

    /**
     * Get array of locked character IDs
     * @returns {Array} Array of character IDs
     */
    getLockedCharacterIds() {
        return Object.keys(this.game.characters)
            .filter(id => !this.game.getCharacter(id).unlocked);
    }

    /**
     * Update bot status display
     * @param {boolean} active - Whether bot is active
     * @param {string} message - Status message to display
     */
    updateBotStatus(active, message) {
        this.game.breedingUI.updateBotStatus(active, message);
    }

    /**
     * Set bot strategy
     * @param {string} strategy - Strategy type ('optimal', 'random', 'mixed')
     */
    setStrategy(strategy) {
        if (['optimal', 'random', 'mixed'].includes(strategy)) {
            this.strategy = strategy;
        }
    }

    /**
     * Get current strategy
     * @returns {string} Current strategy
     */
    getStrategy() {
        return this.strategy;
    }

    /**
     * Set bot interval delay
     * @param {number} delay - Delay in milliseconds between breeding attempts
     */
    setIntervalDelay(delay) {
        this.intervalDelay = Math.max(1000, delay); // Minimum 1 second
        
        // Restart interval if bot is active
        if (this.active) {
            this.stop();
            this.start();
        }
    }

    /**
     * Get estimated time to complete all discoveries
     * @returns {Object} Time estimation data
     */
    getCompletionEstimate() {
        const lockedCount = this.getLockedCharacterIds().length;
        
        if (lockedCount === 0) {
            return {
                completed: true,
                remaining: 0,
                estimatedTime: 0
            };
        }
        
        // Estimate based on average discoveries per breeding
        const avgDiscoveriesPerBreed = this.calculateAverageDiscoveryRate();
        const breedsNeeded = Math.ceil(lockedCount / avgDiscoveriesPerBreed);
        const timePerBreed = this.intervalDelay + this.breedingLogic.estimateBreedingTime();
        const estimatedTime = breedsNeeded * timePerBreed;
        
        return {
            completed: false,
            remaining: lockedCount,
            breedsNeeded: breedsNeeded,
            estimatedTime: estimatedTime,
            estimatedMinutes: Math.round(estimatedTime / 60000)
        };
    }

    /**
     * Calculate average discovery rate based on current unlocked characters
     * @returns {number} Average discoveries per breeding attempt
     */
    calculateAverageDiscoveryRate() {
        const unlockedChars = this.getUnlockedCharacterIds().map(id => this.game.getCharacter(id));
        
        if (unlockedChars.length < 2) {
            return 0.1; // Very low if not enough characters
        }
        
        let totalNewDiscoveries = 0;
        let viablePairs = 0;
        
        // Sample a subset of pairs to estimate
        for (let i = 0; i < Math.min(unlockedChars.length, 10); i++) {
            for (let j = i; j < Math.min(unlockedChars.length, 10); j++) {
                const compatibility = this.breedingLogic.calculateCompatibility(unlockedChars[i], unlockedChars[j]);
                if (compatibility.worthBreeding) {
                    totalNewDiscoveries += compatibility.newDiscoveries;
                    viablePairs++;
                }
            }
        }
        
        return viablePairs > 0 ? totalNewDiscoveries / viablePairs : 0.1;
    }

    /**
     * Get bot performance statistics
     * @returns {Object} Performance data
     */
    getPerformanceStats() {
        const unlockedCount = this.getUnlockedCharacterIds().length;
        const totalCount = Object.keys(this.game.characters).length;
        const completionRate = (unlockedCount / totalCount) * 100;
        
        return {
            charactersUnlocked: unlockedCount,
            totalCharacters: totalCount,
            completionRate: completionRate,
            strategy: this.strategy,
            intervalDelay: this.intervalDelay,
            isActive: this.active,
            canContinue: this.getLockedCharacterIds().length > 0
        };
    }

    /**
     * Find next best move without executing it
     * @returns {Object|null} Next move information
     */
    previewNextMove() {
        const bestPair = this.findBestBreedingPair();
        
        if (!bestPair) {
            return null;
        }
        
        const char1 = this.game.getCharacter(bestPair[0]);
        const char2 = this.game.getCharacter(bestPair[1]);
        const compatibility = this.breedingLogic.calculateCompatibility(char1, char2);
        const preview = this.breedingLogic.getBreedingPreview(char1, char2);
        
        return {
            pair: bestPair,
            characters: [char1, char2],
            compatibility: compatibility,
            preview: preview,
            score: this.evaluateBreedingPair(char1, char2)
        };
    }

    /**
     * Execute one breeding step manually (for testing/debugging)
     * @returns {Promise} Promise resolving to breeding result
     */
    async executeStep() {
        if (this.breedingLogic.isBreedingActive()) {
            return { success: false, reason: 'breeding_in_progress' };
        }
        
        const bestPair = this.findBestBreedingPair();
        if (!bestPair) {
            return { success: false, reason: 'no_viable_pairs' };
        }
        
        // Set selection and breed
        this.game.selectedCharacters = bestPair;
        this.game.updateDisplay();
        
        return new Promise((resolve) => {
            setTimeout(() => {
                this.game.breed();
                resolve({ 
                    success: true, 
                    pair: bestPair,
                    characters: bestPair.map(id => this.game.getCharacter(id))
                });
            }, 1000);
        });
    }

    /**
     * Reset bot to initial state
     */
    reset() {
        this.stop();
        this.active = false;
        this.strategy = 'optimal';
        this.intervalDelay = 4000;
        this.updateBotStatus(false, 'Bot is off - You\'re in control');
    }
}