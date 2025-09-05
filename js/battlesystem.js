// BattleSystem Class - Core Battle Logic and Mechanics
import { BATTLE_CONFIG } from './config.js';

export class BattleSystem {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.playerTeam = [];
        this.enemyTeam = [];
        this.turnQueue = [];
        this.battlePhase = 'setup'; // setup, battle, ended
        this.battleLog = [];
        this.difficulty = 'easy';
        this.actionBars = {}; // Track action bar fill for each character
        this.turnHistory = []; // Track completed turns
        this.upcomingTurns = []; // Pre-calculated upcoming turns
        this.isProcessingTurn = false;
        this.attackButtonsDisabled = false;
        this.selectedAttackObj = null;
        
        // Timer references for cleanup
        this.aiTurnTimer = null;
        this.nextTurnTimer = null;
    }

    /**
     * Set the AI difficulty level
     * @param {string} difficulty - 'easy', 'normal', 'hard', or 'extreme'
     */
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    /**
     * Clear all running timers to prevent memory leaks
     */
    clearAllTimers() {
        if (this.aiTurnTimer) {
            clearTimeout(this.aiTurnTimer);
            this.aiTurnTimer = null;
        }
        
        if (this.nextTurnTimer) {
            clearTimeout(this.nextTurnTimer);
            this.nextTurnTimer = null;
        }
    }

    /**
     * Initialize battle with player team
     * @param {Array} playerTeam - Array of GameCharacter instances
     */
    setupBattle(playerTeam) {
        // Clone player team to avoid modifying originals
        this.playerTeam = playerTeam.map(char => {
            const cloned = char.clone();
            cloned.resetForBattle();
            cloned.isPlayer = true;
            return cloned;
        });

        this.generateEnemyTeam();
        this.createTurnQueue();
        
        this.battlePhase = 'battle';
        this.battleLog = [];
        
        // Reset states
        this.attackButtonsDisabled = false;
        this.isProcessingTurn = false;
        this.selectedAttackObj = null;
        
        return {
            playerTeam: this.playerTeam,
            enemyTeam: this.enemyTeam,
            firstCharacter: this.getCurrentCharacter()
        };
    }

    /**
     * Generate random enemy team based on unlocked characters
     */
    generateEnemyTeam() {
        const availableCharacters = Object.values(this.game.characters)
            .filter(char => char.unlocked && !this.playerTeam.some(pChar => pChar.id === char.id));
        
        // If not enough unique characters, allow duplicates but mark them differently
        if (availableCharacters.length < BATTLE_CONFIG.TEAM_SIZE) {
            const allAvailable = Object.values(this.game.characters).filter(char => char.unlocked);
            this.enemyTeam = [];
            for (let i = 0; i < BATTLE_CONFIG.TEAM_SIZE; i++) {
                const randomChar = allAvailable[Math.floor(Math.random() * allAvailable.length)];
                const enemyChar = randomChar.clone();
        
                // Add unique suffix if character already exists in player team
                if (this.playerTeam.some(pChar => pChar.id === enemyChar.id)) {
                    enemyChar.id = `${enemyChar.id}-E${i + 1}`;
                }
                
                enemyChar.resetForBattle();
                enemyChar.isPlayer = false;
                this.enemyTeam.push(enemyChar);
            }
        } else {
            this.enemyTeam = [];
            for (let i = 0; i < BATTLE_CONFIG.TEAM_SIZE; i++) {
                const randomChar = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
                const enemyChar = randomChar.clone();
                enemyChar.resetForBattle();
                enemyChar.isPlayer = false;
                this.enemyTeam.push(enemyChar);
                
                // Remove from available to prevent duplicates
                const index = availableCharacters.findIndex(char => char.id === randomChar.id);
                availableCharacters.splice(index, 1);
            }
        }
    }

    /**
     * Create turn queue using speed-based action bar system
     */
    createTurnQueue() {
        // Initialize action bars for all alive characters
        const allCharacters = [...this.playerTeam, ...this.enemyTeam]
            .filter(char => char.isAlive());
        
        // Reset action bars
        this.actionBars = {};
        allCharacters.forEach(char => {
            this.actionBars[this.getCharId(char)] = 0;
        });
        
        // Pre-calculate the next 20 turns for display
        this.calculateUpcomingTurns(20);
        
        // Set the initial turn queue for display
        this.turnQueue = this.upcomingTurns.slice(0, 6);
    }

    /**
     * Get unique character ID for battle system
     * @param {GameCharacter} character - Character to get ID for
     * @returns {string} Unique character ID
     */
    getCharId(character) {
        return `${character.id}-${character.isPlayer ? 'P' : 'E'}`;
    }

    /**
     * Calculate upcoming turns based on speed values
     * @param {number} numberOfTurns - How many turns to calculate ahead
     */
    calculateUpcomingTurns(numberOfTurns) {
        const allCharacters = [...this.playerTeam, ...this.enemyTeam]
            .filter(char => char.isAlive());
        
        if (allCharacters.length === 0) {
            this.upcomingTurns = [];
            return;
        }
        
        // Clone current action bars for simulation
        const simActionBars = { ...this.actionBars };
        const turns = [];
        
        while (turns.length < numberOfTurns) {
            // Increment all action bars by their speed
            allCharacters.forEach(char => {
                const charId = this.getCharId(char);
                if (simActionBars[charId] !== undefined) {
                    simActionBars[charId] += char.stats.speed;
                }
            });
            
            // Find characters that reached the threshold
            const readyChars = allCharacters.filter(char => {
                const charId = this.getCharId(char);
                return simActionBars[charId] >= BATTLE_CONFIG.ACTION_THRESHOLD;
            });
            
            if (readyChars.length > 0) {
                // Sort by tie-breaking rules
                readyChars.sort((a, b) => {
                    const aBar = simActionBars[this.getCharId(a)];
                    const bBar = simActionBars[this.getCharId(b)];
                    
                    // First tiebreaker: Higher action bar value
                    if (aBar !== bBar) return bBar - aBar;
                    
                    // Second tiebreaker: Lower base speed
                    if (a.stats.speed !== b.stats.speed) {
                        return a.stats.speed - b.stats.speed;
                    }
                    
                    // Third tiebreaker: Player advantage
                    if (a.isPlayer !== b.isPlayer) {
                        return a.isPlayer ? -1 : 1;
                    }
                    
                    // Fourth tiebreaker: Selection order
                    const aIndex = a.isPlayer ? 
                        this.playerTeam.indexOf(a) : 
                        this.enemyTeam.indexOf(a);
                    const bIndex = b.isPlayer ? 
                        this.playerTeam.indexOf(b) : 
                        this.enemyTeam.indexOf(b);
                    return aIndex - bIndex;
                });
                
                // Process each ready character
                readyChars.forEach(char => {
                    const charId = this.getCharId(char);
                    simActionBars[charId] -= BATTLE_CONFIG.ACTION_THRESHOLD;
                    turns.push(char);
                });
            }
        }
        
        this.upcomingTurns = turns;
    }

    /**
     * Get the character whose turn it currently is
     * @returns {GameCharacter|null} Current character or null
     */
    getCurrentCharacter() {
        if (this.upcomingTurns.length === 0) return null;
        return this.upcomingTurns[0];
    }

    /**
     * Advance to the next turn
     */
    nextTurn() {
        const currentChar = this.getCurrentCharacter();
        if (currentChar) {
            const charId = this.getCharId(currentChar);
            
            // Actually consume the action bar for the character that just acted
            this.actionBars[charId] -= BATTLE_CONFIG.ACTION_THRESHOLD;
            
            // Move to next turn
            this.turnHistory.push(this.upcomingTurns.shift());
            
            // Calculate more turns if needed
            if (this.upcomingTurns.length < 20) {
                this.calculateUpcomingTurns(20);
            }
            
            // Update the display queue (sliding window of 6)
            this.turnQueue = this.upcomingTurns.slice(0, 6);
        }
        
        const nextChar = this.getCurrentCharacter();
        return {
            nextCharacter: nextChar,
            turnQueue: this.turnQueue
        };
    }

    /**
     * Update turn queue when characters are defeated
     */
    updateTurnQueue() {
        // Remove defeated characters from action bars
        const allCharacters = [...this.playerTeam, ...this.enemyTeam];
        allCharacters.forEach(char => {
            if (!char.isAlive()) {
                const charId = this.getCharId(char);
                delete this.actionBars[charId];
            }
        });
        
        // Recalculate upcoming turns
        this.calculateUpcomingTurns(20);
        this.turnQueue = this.upcomingTurns.slice(0, 6);
    }

    /**
     * Process a turn (attack execution)
     * @param {Object} attackObj - Attack object with gene and type
     * @param {GameCharacter} targetCharacter - Target for single attacks
     * @returns {Object} Turn result data
     */
    async processTurn(attackObj, targetCharacter) {
        // Prevent multiple attacks in one turn
        if (this.isProcessingTurn) {
            return { success: false, reason: 'already_processing' };
        }
        
        this.isProcessingTurn = true;
        
        const attacker = this.getCurrentCharacter();
        if (!attacker || !attacker.isAlive()) {
            this.isProcessingTurn = false;
            return { success: false, reason: 'invalid_attacker' };
        }

        let turnResults;
        if (attackObj.type === 'splash') {
            turnResults = await this.processSplashAttack(attacker, attackObj.gene);
        } else {
            turnResults = await this.processSingleAttack(attacker, attackObj.gene, targetCharacter);
        }
        
        // Check for battle end
        const battleEndResult = this.checkBattleEnd();
        if (battleEndResult.ended) {
            this.isProcessingTurn = false;
            return {
                success: true,
                turnResults,
                battleEnded: true,
                winner: battleEndResult.winner
            };
        }
        
        this.isProcessingTurn = false;
        
        return {
            success: true,
            turnResults,
            battleEnded: false
        };
    }

    /**
     * Process a single target attack
     * @param {GameCharacter} attacker - Attacking character
     * @param {string} attackGene - Gene type of attack
     * @param {GameCharacter} targetCharacter - Target character
     * @returns {Object} Attack results
     */
    async processSingleAttack(attacker, attackGene, targetCharacter) {
        const finalDamage = attacker.calculateDamage(attackGene, targetCharacter);
        const effectiveness = attacker.getEffectiveness(attackGene, targetCharacter);
        
        const wasDefeated = targetCharacter.takeDamage(finalDamage);
        
        const result = {
            type: 'single',
            attacker: attacker.getDisplayName(),
            attackGene,
            target: targetCharacter.getDisplayName(),
            damage: finalDamage,
            effectiveness,
            targetDefeated: wasDefeated
        };
        
        if (wasDefeated) {
            this.updateTurnQueue();
        }
        
        return result;
    }

    /**
     * Process a splash attack (hits multiple targets)
     * @param {GameCharacter} attacker - Attacking character
     * @param {string} attackGene - Gene type of attack
     * @returns {Object} Attack results
     */
    async processSplashAttack(attacker, attackGene) {
        // Target the ENEMY team, not own team
        const targets = attacker.isPlayer ? 
            this.enemyTeam.filter(char => char.isAlive()).slice(0, 3) :
            this.playerTeam.filter(char => char.isAlive()).slice(0, 3);
            
        const results = {
            type: 'splash',
            attacker: attacker.getDisplayName(),
            attackGene,
            targets: []
        };
        
        for (const target of targets) {
            const singleDamage = attacker.calculateDamage(attackGene, target);
            const splashDamage = singleDamage * BATTLE_CONFIG.SPLASH_DAMAGE_MULTIPLIER;
            const effectiveness = attacker.getEffectiveness(attackGene, target);
            
            const wasDefeated = target.takeDamage(splashDamage);
            
            results.targets.push({
                name: target.getDisplayName(),
                damage: splashDamage,
                effectiveness,
                defeated: wasDefeated
            });
        }
        
        this.updateTurnQueue();
        return results;
    }

    /**
     * Check if the battle has ended
     * @returns {Object} Battle end status and winner
     */
    checkBattleEnd() {
        const playerAlive = this.playerTeam.some(char => char.isAlive());
        const enemyAlive = this.enemyTeam.some(char => char.isAlive());
        
        if (!playerAlive || !enemyAlive) {
            this.battlePhase = 'ended';
            this.clearAllTimers();
            return {
                ended: true,
                winner: playerAlive ? 'player' : 'enemy'
            };
        }
        
        return { ended: false };
    }

    /**
     * Get available targets for current character
     * @returns {Array} Array of valid target characters
     */
    getAvailableTargets() {
        const currentChar = this.getCurrentCharacter();
        if (!currentChar) return [];
        
        return currentChar.isPlayer ? 
            this.enemyTeam.filter(char => char.isAlive()) :
            this.playerTeam.filter(char => char.isAlive());
    }

    /**
     * Get current battle state for UI updates
     * @returns {Object} Current battle state
     */
    getBattleState() {
        return {
            playerTeam: this.playerTeam,
            enemyTeam: this.enemyTeam,
            currentCharacter: this.getCurrentCharacter(),
            turnQueue: this.turnQueue,
            battlePhase: this.battlePhase,
            isProcessingTurn: this.isProcessingTurn,
            attackButtonsDisabled: this.attackButtonsDisabled
        };
    }

    /**
     * Reset battle system for new battle
     */
    reset() {
        this.clearAllTimers();
        this.playerTeam = [];
        this.enemyTeam = [];
        this.turnQueue = [];
        this.battlePhase = 'setup';
        this.battleLog = [];
        this.actionBars = {};
        this.turnHistory = [];
        this.upcomingTurns = [];
        this.isProcessingTurn = false;
        this.attackButtonsDisabled = false;
        this.selectedAttackObj = null;
    }

    /**
     * Add entry to battle log
     * @param {string} message - Log message
     * @param {string} className - CSS class for styling
     */
    addBattleLog(message, className = '') {
        this.battleLog.push({ message, className });
        if (this.battleLog.length > 10) {
            this.battleLog.shift();
        }
        
        return this.battleLog;
    }

    /**
     * Get current battle log
     * @returns {Array} Array of log entries
     */
    getBattleLog() {
        return this.battleLog;
    }
}