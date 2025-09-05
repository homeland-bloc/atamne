// BreedingLogic Class - Core Breeding Mechanics and Animation Logic
import { ANIMATION_CONFIG } from './config.js';

export class BreedingLogic {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.speedMultiplier = 1;
        this.isBreeding = false;
        this.currentBreedingInterval = null;
    }

    /**
     * Set breeding animation speed multiplier
     * @param {number} multiplier - Speed multiplier (1, 2, or 4)
     */
    setSpeed(multiplier) {
        this.speedMultiplier = multiplier;
    }

    /**
     * Get possible offspring from two parents
     * @param {GameCharacter} parent1 - First parent
     * @param {GameCharacter} parent2 - Second parent
     * @returns {Array} Array of possible offspring IDs
     */
    getPossibleOffspring(parent1, parent2) {
        const offspring = [];
        
        parent1.genes.forEach(gene1 => {
            parent2.genes.forEach(gene2 => {
                const combo1 = `${gene1}-${gene2}`;
                const combo2 = `${gene2}-${gene1}`;
                
                if (!offspring.includes(combo1)) {
                    offspring.push(combo1);
                }
                if (!offspring.includes(combo2) && combo1 !== combo2) {
                    offspring.push(combo2);
                }
            });
        });

        return offspring;
    }

    /**
     * Start the breeding process
     * @param {GameCharacter} parent1 - First parent
     * @param {GameCharacter} parent2 - Second parent
     * @param {Function} onComplete - Callback when breeding completes
     */
    startBreeding(parent1, parent2, onComplete) {
        if (this.isBreeding) return;
        
        this.isBreeding = true;
        const possibleOffspring = this.getPossibleOffspring(parent1, parent2);
        const lockedOffspring = possibleOffspring.filter(id => !this.game.getCharacter(id).unlocked);
        
        // Determine actual result
        const actualResult = lockedOffspring.length > 0 ? 
            lockedOffspring[Math.floor(Math.random() * lockedOffspring.length)] : 
            possibleOffspring[Math.floor(Math.random() * possibleOffspring.length)];
        
        this.startBreedingAnimation(possibleOffspring, actualResult, (result) => {
            this.isBreeding = false;
            
            // Check if we unlocked something new
            const newUnlock = lockedOffspring.length > 0 && actualResult;
            
            if (onComplete) {
                onComplete({
                    success: true,
                    characterId: actualResult,
                    newUnlock: newUnlock
                });
            }
        });
    }

    /**
     * Start breeding animation sequence
     * @param {Array} possibleOffspring - All possible results
     * @param {string} actualResult - The actual result to show
     * @param {Function} onComplete - Callback when animation completes
     */
    startBreedingAnimation(possibleOffspring, actualResult, onComplete) {
        const breedingUI = this.game.breedingUI;
        const previewChar = breedingUI.getPreviewCharacterElement();
        
        if (!previewChar) {
            onComplete({ success: false });
            return;
        }
        
        // Update UI state
        breedingUI.updateBreedButton(true, 'Breeding...', true);
        breedingUI.showBreedingPreview();
        
        // Animation parameters
        const totalSteps = Math.floor(ANIMATION_CONFIG.BREEDING_ANIMATION_STEPS / this.speedMultiplier);
        const animationSpeed = Math.floor(ANIMATION_CONFIG.BREEDING_ANIMATION_SPEED / this.speedMultiplier);
        
        let animationStep = 0;
        
        this.currentBreedingInterval = setInterval(() => {
            let displayCharacter;
            
            // Show random characters for most of the animation, then settle on result
            if (animationStep < totalSteps - 3) {
                const randomOffspring = possibleOffspring[Math.floor(Math.random() * possibleOffspring.length)];
                displayCharacter = this.game.getCharacter(randomOffspring);
            } else {
                displayCharacter = this.game.getCharacter(actualResult);
            }
            
            // Update preview character display
            breedingUI.updatePreviewCharacter(previewChar, displayCharacter);
            
            // Add sparkle effects
            breedingUI.createBreedingSparkles(previewChar, this.speedMultiplier > 1, this.speedMultiplier);
            
            animationStep++;
            
            if (animationStep >= totalSteps) {
                clearInterval(this.currentBreedingInterval);
                this.currentBreedingInterval = null;
                this.showFinalResult(actualResult, onComplete);
            }
        }, animationSpeed);
    }

    /**
     * Show final breeding result with sunshine effect
     * @param {string} actualResult - ID of actual result character
     * @param {Function} onComplete - Callback when complete
     */
    showFinalResult(actualResult, onComplete) {
        const breedingUI = this.game.breedingUI;
        const previewChar = breedingUI.getPreviewCharacterElement();
        
        if (!previewChar) {
            this.finishBreeding(actualResult, onComplete);
            return;
        }
        
        const resultCharacter = this.game.getCharacter(actualResult);
        
        // Add sunshine effect
        const sunshine = breedingUI.addSunshineEffect(previewChar);
        
        // Update to final character
        breedingUI.updatePreviewCharacter(previewChar, resultCharacter);
        
        // Remove sunshine and finish after delay
        setTimeout(() => {
            if (sunshine && sunshine.parentNode) {
                sunshine.remove();
            }
            this.finishBreeding(actualResult, onComplete);
        }, Math.floor(2000 / this.speedMultiplier));
    }

    /**
     * Finish breeding process and clean up
     * @param {string} actualResult - ID of actual result character
     * @param {Function} onComplete - Callback when complete
     */
    finishBreeding(actualResult, onComplete) {
        const breedingUI = this.game.breedingUI;
        
        setTimeout(() => {
            // Hide breeding preview
            breedingUI.hideBreedingPreview();
            
            // Check if this was a new unlock
            const character = this.game.getCharacter(actualResult);
            const wasNewUnlock = !character.unlocked;
            
            if (wasNewUnlock) {
                // Create particle effect for new discovery
                breedingUI.createParticleEffect();
            }

            // Reset breed button
            breedingUI.updateBreedButton(false, 'Select Two Creatures to Breed', true);
            
            // Call completion callback
            if (onComplete) {
                onComplete({
                    success: true,
                    characterId: actualResult,
                    newUnlock: wasNewUnlock
                });
            }
        }, 500);
    }

    /**
     * Stop any ongoing breeding process
     */
    stopBreeding() {
        if (this.currentBreedingInterval) {
            clearInterval(this.currentBreedingInterval);
            this.currentBreedingInterval = null;
        }
        
        this.isBreeding = false;
        
        // Reset UI
        const breedingUI = this.game.breedingUI;
        breedingUI.hideBreedingPreview();
        breedingUI.updateBreedButton(false, 'Select Two Creatures to Breed', true);
    }

    /**
     * Calculate breeding compatibility score
     * @param {GameCharacter} parent1 - First parent
     * @param {GameCharacter} parent2 - Second parent
     * @returns {Object} Compatibility analysis
     */
    calculateCompatibility(parent1, parent2) {
        const possibleOffspring = this.getPossibleOffspring(parent1, parent2);
        const lockedOffspring = possibleOffspring.filter(id => !this.game.getCharacter(id).unlocked);
        
        return {
            totalPossible: possibleOffspring.length,
            newDiscoveries: lockedOffspring.length,
            compatibilityScore: lockedOffspring.length / possibleOffspring.length,
            worthBreeding: lockedOffspring.length > 0
        };
    }

    /**
     * Get breeding preview without actually breeding
     * @param {GameCharacter} parent1 - First parent
     * @param {GameCharacter} parent2 - Second parent
     * @returns {Object} Preview information
     */
    getBreedingPreview(parent1, parent2) {
        const possibleOffspring = this.getPossibleOffspring(parent1, parent2);
        const lockedOffspring = possibleOffspring.filter(id => !this.game.getCharacter(id).unlocked);
        const unlockedOffspring = possibleOffspring.filter(id => this.game.getCharacter(id).unlocked);
        
        return {
            possible: possibleOffspring.map(id => ({
                id,
                character: this.game.getCharacter(id),
                unlocked: this.game.getCharacter(id).unlocked
            })),
            guaranteed: unlockedOffspring.map(id => this.game.getCharacter(id)),
            discoveries: lockedOffspring.map(id => this.game.getCharacter(id)),
            chanceOfDiscovery: lockedOffspring.length / possibleOffspring.length
        };
    }

    /**
     * Simulate breeding multiple times to get statistics
     * @param {GameCharacter} parent1 - First parent
     * @param {GameCharacter} parent2 - Second parent
     * @param {number} simulations - Number of simulations to run
     * @returns {Object} Simulation results
     */
    simulateBreeding(parent1, parent2, simulations = 1000) {
        const possibleOffspring = this.getPossibleOffspring(parent1, parent2);
        const results = {};
        
        // Initialize result tracking
        possibleOffspring.forEach(id => {
            results[id] = 0;
        });
        
        // Run simulations
        for (let i = 0; i < simulations; i++) {
            const result = possibleOffspring[Math.floor(Math.random() * possibleOffspring.length)];
            results[result]++;
        }
        
        // Convert to percentages
        const percentages = {};
        Object.keys(results).forEach(id => {
            percentages[id] = (results[id] / simulations) * 100;
        });
        
        return {
            raw: results,
            percentages: percentages,
            simulations: simulations
        };
    }

    /**
     * Check if breeding is currently in progress
     * @returns {boolean} True if breeding is active
     */
    isBreedingActive() {
        return this.isBreeding;
    }

    /**
     * Get current speed multiplier
     * @returns {number} Current speed multiplier
     */
    getSpeed() {
        return this.speedMultiplier;
    }

    /**
     * Estimate breeding time based on current speed
     * @returns {number} Estimated time in milliseconds
     */
    estimateBreedingTime() {
        const baseTime = ANIMATION_CONFIG.BREEDING_ANIMATION_STEPS * ANIMATION_CONFIG.BREEDING_ANIMATION_SPEED + 2500;
        return Math.floor(baseTime / this.speedMultiplier);
    }

    /**
     * Get breeding statistics for the game
     * @returns {Object} Overall breeding statistics
     */
    getBreedingStatistics() {
        const allCharacters = Object.values(this.game.characters);
        const unlockedCount = allCharacters.filter(char => char.unlocked).length;
        const totalCount = allCharacters.length;
        
        // Calculate possible breeding pairs from unlocked characters
        const unlockedChars = allCharacters.filter(char => char.unlocked);
        let possiblePairs = 0;
        let viablePairs = 0;
        
        for (let i = 0; i < unlockedChars.length; i++) {
            for (let j = i; j < unlockedChars.length; j++) {
                possiblePairs++;
                const compatibility = this.calculateCompatibility(unlockedChars[i], unlockedChars[j]);
                if (compatibility.worthBreeding) {
                    viablePairs++;
                }
            }
        }
        
        return {
            unlockedCharacters: unlockedCount,
            totalCharacters: totalCount,
            completionPercentage: (unlockedCount / totalCount) * 100,
            possibleBreedingPairs: possiblePairs,
            viableBreedingPairs: viablePairs,
            discoveryProgress: unlockedCount === totalCount ? 'Complete' : 'In Progress'
        };
    }

    /**
     * Reset breeding logic to initial state
     */
    reset() {
        this.stopBreeding();
        this.speedMultiplier = 1;
    }
}