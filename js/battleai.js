// BattleAI Class - AI Decision Making and Strategy
import { AI_DIFFICULTY, BATTLE_CONFIG, ANIMATION_CONFIG } from './config.js';

export class BattleAI {
    constructor(battleSystem) {
        this.battleSystem = battleSystem;
        this.difficulty = 'easy';
        this.thinkingTimer = null;
    }

    /**
     * Set AI difficulty level
     * @param {string} difficulty - 'easy', 'normal', 'hard', or 'extreme'
     */
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.battleSystem.setDifficulty(difficulty);
    }

    /**
     * Clear any running AI timers
     */
    clearTimers() {
        if (this.thinkingTimer) {
            clearTimeout(this.thinkingTimer);
            this.thinkingTimer = null;
        }
    }

    /**
     * Process AI turn with difficulty-based decision making
     * @param {Function} onThinkingStart - Callback when AI starts thinking
     * @param {Function} onDecisionMade - Callback when AI makes decision
     * @returns {Promise} Promise that resolves when turn is processed
     */
    processAITurn(onThinkingStart, onDecisionMade) {
        return new Promise((resolve) => {
            const attacker = this.battleSystem.getCurrentCharacter();
            const availableTargets = this.battleSystem.getAvailableTargets();
            
            if (availableTargets.length === 0) {
                resolve({ success: false, reason: 'no_targets' });
                return;
            }
            
            // Notify UI that AI is thinking
            if (onThinkingStart) {
                onThinkingStart(attacker);
            }
            
            // Delay the AI decision based on difficulty and animation config
            this.thinkingTimer = setTimeout(() => {
                this.thinkingTimer = null;
                
                const decision = this.makeDecision(attacker, availableTargets);
                
                // Notify UI of the decision
                if (onDecisionMade) {
                    onDecisionMade(decision);
                }
                
                resolve(decision);
            }, ANIMATION_CONFIG.AI_THINK_TIME);
        });
    }

    /**
     * Make an AI decision based on difficulty level
     * @param {GameCharacter} attacker - AI character making the move
     * @param {Array} availableTargets - Available target characters
     * @returns {Object} Decision object with attack and target
     */
    makeDecision(attacker, availableTargets) {
        const difficultyConfig = AI_DIFFICULTY[this.difficulty.toUpperCase()];
        const shouldMakeSmartMove = Math.random() < difficultyConfig.smartMoveChance;
        
        let selectedAttack, selectedTarget;
        
        if (shouldMakeSmartMove) {
            const bestMove = this.calculateBestMove(attacker, availableTargets);
            selectedAttack = bestMove.attack;
            selectedTarget = bestMove.target;
        } else {
            // Random move
            const attackObjs = attacker.getAttackGenes();
            selectedAttack = attackObjs[Math.floor(Math.random() * attackObjs.length)];
            selectedTarget = availableTargets[Math.floor(Math.random() * availableTargets.length)];
        }
        
        return {
            success: true,
            attack: selectedAttack,
            target: selectedTarget,
            wasSmartMove: shouldMakeSmartMove,
            difficulty: this.difficulty
        };
    }

    /**
     * Calculate the best move for AI using strategic analysis
     * @param {GameCharacter} attacker - AI character making the move
     * @param {Array} availableTargets - Available target characters
     * @returns {Object} Best move with attack and target properties
     */
    calculateBestMove(attacker, availableTargets) {
        const attackObjs = attacker.getAttackGenes();
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const attackObj of attackObjs) {
            if (attackObj.type === 'splash') {
                const splashResult = this.evaluateSplashAttack(attacker, attackObj, availableTargets);
                
                if (splashResult.score > bestScore) {
                    bestScore = splashResult.score;
                    bestMove = { 
                        attack: attackObj, 
                        target: availableTargets[0] // Target doesn't matter for splash
                    };
                }
            } else {
                // Evaluate single target attacks
                for (const target of availableTargets) {
                    const singleResult = this.evaluateSingleAttack(attacker, attackObj, target, availableTargets);
                    
                    if (singleResult.score > bestScore) {
                        bestScore = singleResult.score;
                        bestMove = { attack: attackObj, target: target };
                    }
                }
            }
        }
        
        return bestMove || { 
            attack: attackObjs[0], 
            target: availableTargets[0] 
        };
    }

    /**
     * Evaluate the effectiveness of a splash attack
     * @param {GameCharacter} attacker - Attacking character
     * @param {Object} attackObj - Attack object
     * @param {Array} availableTargets - Available targets
     * @returns {Object} Evaluation result with score
     */
    evaluateSplashAttack(attacker, attackObj, availableTargets) {
        let totalDamage = 0;
        let killCount = 0;
        let effectivenessBonus = 0;
        
        for (const target of availableTargets) {
            const effectiveness = attacker.getEffectiveness(attackObj.gene, target);
            const damage = (attacker.stats.attack * effectiveness) * BATTLE_CONFIG.SPLASH_DAMAGE_MULTIPLIER;
            
            totalDamage += damage;
            
            // Count potential kills
            if (damage >= target.stats.hp) {
                killCount++;
            }
            
            // Bonus for effective attacks
            if (effectiveness >= 1.25) {
                effectivenessBonus += 50 * effectiveness;
            }
        }
        
        // Calculate final score
        const score = totalDamage + (killCount * 200) + effectivenessBonus;
        
        return {
            score,
            totalDamage,
            killCount,
            effectivenessBonus
        };
    }

    /**
     * Evaluate the effectiveness of a single target attack
     * @param {GameCharacter} attacker - Attacking character
     * @param {Object} attackObj - Attack object
     * @param {GameCharacter} target - Target character
     * @param {Array} allTargets - All available targets for context
     * @returns {Object} Evaluation result with score
     */
    evaluateSingleAttack(attacker, attackObj, target, allTargets) {
        const damage = attacker.calculateDamage(attackObj.gene, target);
        const effectiveness = attacker.getEffectiveness(attackObj.gene, target);
        
        // Base score is damage dealt
        let score = damage;
        
        // Massive bonus for finishing off an enemy
        if (damage >= target.stats.hp) {
            score += 500;
        }
        
        // Bonus for hitting low HP enemies (setup for next turn kill)
        if (target.stats.hp <= attacker.stats.attack * 1.5) {
            score += 100;
        }
        
        // Effectiveness bonuses and penalties
        if (effectiveness >= 1.25) {
            score += 50 * effectiveness;
        } else if (effectiveness <= 0.75) {
            score -= 25;
        }
        
        // Target priority based on threat level
        const threatScore = this.calculateThreatLevel(target, allTargets);
        score += threatScore;
        
        // Bonus for targeting low health but high threat enemies
        const healthPercentage = target.getHealthPercentage();
        if (healthPercentage < 50 && target.stats.attack > attacker.stats.attack * 0.8) {
            score += 75;
        }
        
        return {
            score,
            damage,
            effectiveness,
            threatScore,
            willKill: damage >= target.stats.hp
        };
    }

    /**
     * Calculate threat level of a target character
     * @param {GameCharacter} target - Target to evaluate
     * @param {Array} allTargets - All available targets for comparison
     * @returns {number} Threat score
     */
    calculateThreatLevel(target, allTargets) {
        let threatScore = 0;
        
        // Base threat from attack power
        threatScore += target.stats.attack * 0.3;
        
        // Speed threat (faster enemies are more dangerous)
        threatScore += target.stats.speed * 0.2;
        
        // Relative attack comparison
        const avgAttack = allTargets.reduce((sum, t) => sum + t.stats.attack, 0) / allTargets.length;
        if (target.stats.attack > avgAttack) {
            threatScore += 50;
        }
        
        // Health-based threat (healthy enemies are more threatening)
        const healthPercentage = target.getHealthPercentage();
        if (healthPercentage > 75) {
            threatScore += 30;
        } else if (healthPercentage < 25) {
            threatScore -= 20; // Lower priority for near-death enemies
        }
        
        // Gene-based threat assessment
        const rarity = target.getRarity();
        switch (rarity) {
            case 'rare':
                threatScore += 40;
                break;
            case 'uncommon':
                threatScore += 20;
                break;
            default:
                threatScore += 10;
        }
        
        return threatScore;
    }

    /**
     * Get AI personality description based on difficulty
     * @returns {Object} AI personality info
     */
    getAIPersonality() {
        const config = AI_DIFFICULTY[this.difficulty.toUpperCase()];
        return {
            difficulty: this.difficulty,
            name: config.name,
            description: config.description,
            smartMoveChance: config.smartMoveChance,
            behaviorDescription: this.getBehaviorDescription()
        };
    }

    /**
     * Get detailed behavior description for current difficulty
     * @returns {string} Behavior description
     */
    getBehaviorDescription() {
        switch (this.difficulty) {
            case 'easy':
                return 'Makes completely random moves with no strategy. Good for beginners.';
            case 'normal':
                return 'Sometimes makes smart moves, sometimes random. Unpredictable but not too challenging.';
            case 'hard':
                return 'Usually makes strategic decisions. Considers type effectiveness and threat levels.';
            case 'extreme':
                return 'Always calculates the optimal move. Uses advanced threat assessment and damage optimization.';
            default:
                return 'Unknown difficulty level.';
        }
    }

    /**
     * Predict AI move without executing it (for UI hints)
     * @param {GameCharacter} attacker - AI character
     * @param {Array} availableTargets - Available targets
     * @returns {Object} Predicted move information
     */
    predictMove(attacker, availableTargets) {
        if (this.difficulty === 'easy') {
            return {
                predictable: false,
                reason: 'AI uses random moves'
            };
        }
        
        const bestMove = this.calculateBestMove(attacker, availableTargets);
        const difficultyConfig = AI_DIFFICULTY[this.difficulty.toUpperCase()];
        
        return {
            predictable: difficultyConfig.smartMoveChance > 0.5,
            likelyAttack: bestMove.attack,
            likelyTarget: bestMove.target,
            confidence: difficultyConfig.smartMoveChance,
            reason: `${Math.round(difficultyConfig.smartMoveChance * 100)}% chance of optimal move`
        };
    }

    /**
     * Analyze team composition for strategic insights
     * @param {Array} team - Team to analyze
     * @returns {Object} Team analysis
     */
    analyzeTeam(team) {
        const aliveMembers = team.filter(char => char.isAlive());
        
        if (aliveMembers.length === 0) {
            return { threat: 0, analysis: 'Team defeated' };
        }
        
        const totalAttack = aliveMembers.reduce((sum, char) => sum + char.stats.attack, 0);
        const totalSpeed = aliveMembers.reduce((sum, char) => sum + char.stats.speed, 0);
        const avgHealth = aliveMembers.reduce((sum, char) => sum + char.getHealthPercentage(), 0) / aliveMembers.length;
        
        const threat = (totalAttack * 0.4) + (totalSpeed * 0.2) + (avgHealth * 0.4);
        
        let analysis = '';
        if (threat > 300) {
            analysis = 'High threat team - strong offense and healthy';
        } else if (threat > 200) {
            analysis = 'Moderate threat - balanced capabilities';
        } else if (threat > 100) {
            analysis = 'Low threat - weakened or defensive';
        } else {
            analysis = 'Minimal threat - nearly defeated';
        }
        
        return {
            threat,
            analysis,
            aliveCount: aliveMembers.length,
            totalAttack,
            totalSpeed,
            avgHealth: Math.round(avgHealth)
        };
    }

    /**
     * Reset AI state
     */
    reset() {
        this.clearTimers();
        this.difficulty = 'easy';
    }
}