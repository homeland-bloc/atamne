// BattleDisplay Class - Battle Arena Rendering and Visual Updates
import { GENE_SYMBOLS, ANIMATION_CONFIG } from './config.js';

export class BattleDisplay {
    constructor(battleSystem, gameInstance) {
        this.battleSystem = battleSystem;
        this.game = gameInstance;
        this.battleLog = [];
    }

    /**
     * Render the battle arena and initialize display
     * @param {Object} battleData - Initial battle data from setupBattle
     */
    renderBattleArena(battleData) {
        document.getElementById('team-setup').style.display = 'none';
        document.getElementById('battle-arena').style.display = 'block';
        
        this.updateBattleDisplay();
        this.setupQuitButton();
        
        // Clear battle log
        this.clearBattleLog();
    }

    /**
     * Setup quit button event listener
     */
    setupQuitButton() {
        const quitBtn = document.getElementById('quitBattleBtn');
        if (quitBtn) {
            // Remove any existing listeners first
            quitBtn.replaceWith(quitBtn.cloneNode(true));
            const newQuitBtn = document.getElementById('quitBattleBtn');
            newQuitBtn.addEventListener('click', () => this.showQuitConfirmation());
        }
    }

    /**
     * Show quit confirmation dialog
     */
    showQuitConfirmation() {
        const popup = document.createElement('div');
        popup.className = 'confirmation-popup show';
        popup.innerHTML = `
            <div class="confirmation-content">
                <h3 style="color: #666; margin-bottom: 15px;">Quit Battle?</h3>
                <p style="color: #888; margin-bottom: 20px;">Are you sure you want to quit this battle? Your progress will be lost.</p>
                <div class="confirmation-buttons">
                    <button class="confirm-btn" id="confirmQuit">Yes, Quit</button>
                    <button class="cancel-btn" id="cancelQuit">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        document.getElementById('confirmQuit').addEventListener('click', () => {
            popup.remove();
            this.game.returnToSetup();
        });
        
        document.getElementById('cancelQuit').addEventListener('click', () => {
            popup.remove();
        });
    }

    /**
     * Update all battle display elements
     */
    updateBattleDisplay() {
        const battleState = this.battleSystem.getBattleState();
        
        this.updateTeamDisplays(battleState);
        this.updateTurnOrder(battleState);
        this.updateActiveCharacterName(battleState);
    }

    /**
     * Update team display areas
     * @param {Object} battleState - Current battle state
     */
    updateTeamDisplays(battleState) {
        this.updatePlayerTeamDisplay(battleState.playerTeam, battleState.currentCharacter);
        this.updateEnemyTeamDisplay(battleState.enemyTeam, battleState.currentCharacter);
    }

    /**
     * Update player team display
     * @param {Array} playerTeam - Array of player characters
     * @param {GameCharacter} currentCharacter - Currently active character
     */
    updatePlayerTeamDisplay(playerTeam, currentCharacter) {
        const playerDisplay = document.getElementById('playerTeamDisplay');
        if (!playerDisplay) return;
        
        playerDisplay.innerHTML = '';
        playerTeam.forEach(char => {
            const charElement = this.createBattleCharacterElement(char, currentCharacter);
            playerDisplay.appendChild(charElement);
        });
    }

    /**
     * Update enemy team display
     * @param {Array} enemyTeam - Array of enemy characters
     * @param {GameCharacter} currentCharacter - Currently active character
     */
    updateEnemyTeamDisplay(enemyTeam, currentCharacter) {
        const enemyDisplay = document.getElementById('enemyTeamDisplay');
        if (!enemyDisplay) return;
        
        enemyDisplay.innerHTML = '';
        enemyTeam.forEach(char => {
            const charElement = this.createBattleCharacterElement(char, currentCharacter);
            enemyDisplay.appendChild(charElement);
        });
    }

    /**
     * Create battle character display element
     * @param {GameCharacter} character - Character to display
     * @param {GameCharacter} currentCharacter - Currently active character
     * @returns {HTMLElement} Character display element
     */
    createBattleCharacterElement(character, currentCharacter) {
        const div = document.createElement('div');
        div.className = 'battle-character';
        div.dataset.battleChar = character.id;
        div.dataset.team = character.isPlayer ? 'player' : 'enemy';
        
        // Add state classes
        if (!character.isAlive()) {
            div.classList.add('defeated');
        }
        
        if (currentCharacter && currentCharacter.id === character.id) {
            div.classList.add('active');
        }
        
        // Create sprite element
        const sprite = document.createElement('div');
        // FIX: Use the same class as breeding center for gradient backgrounds
        sprite.className = 'character-sprite'; // was 'battle-sprite'
        this.game.breedingUI.updateCharacterSprite(sprite, character);
        
        // Create stats display
        const stats = this.createCharacterStats(character);
        
        // Create health bar
        const healthBar = this.createHealthBar(character);
        
        div.appendChild(sprite);
        div.appendChild(stats);
        div.appendChild(healthBar);
        
        return div;
    }

    /**
     * Create character stats display
     * @param {GameCharacter} character - Character data
     * @returns {HTMLElement} Stats element
     */
    createCharacterStats(character) {
        const stats = document.createElement('div');
        stats.className = 'character-stats';
        stats.innerHTML = `
            <div>${character.getDisplayName()}</div>
            <div>❤️ <strong>${character.stats.hp}</strong>/${character.stats.maxHp}</div>
            <div>⚔️ ${character.stats.attack} | ⚡ ${character.stats.speed}</div>
        `;
        return stats;
    }

    /**
     * Create health bar element
     * @param {GameCharacter} character - Character data
     * @returns {HTMLElement} Health bar element
     */
    createHealthBar(character) {
        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        
        const healthFill = document.createElement('div');
        healthFill.className = 'health-fill';
        const healthPercent = character.getHealthPercentage();
        healthFill.style.width = `${healthPercent}%`;
        
        healthBar.appendChild(healthFill);
        return healthBar;
    }

    /**
     * Update turn order display
     * @param {Object} battleState - Current battle state
     */
    updateTurnOrder(battleState) {
        const turnOrderList = document.getElementById('turnOrderList');
        if (!turnOrderList) return;
        
        turnOrderList.innerHTML = '';
        
        battleState.turnQueue.forEach((char, index) => {
            const indicator = this.createTurnIndicator(char, index === 0);
            turnOrderList.appendChild(indicator);
        });
    }

    /**
     * Create turn order indicator
     * @param {GameCharacter} character - Character data
     * @param {boolean} isActive - Whether this is the active turn
     * @returns {HTMLElement} Turn indicator element
     */
    createTurnIndicator(character, isActive) {
        const indicator = document.createElement('div');
        indicator.className = 'turn-indicator';
        indicator.classList.add(character.isPlayer ? 'player' : 'enemy');
        
        if (isActive) {
            indicator.classList.add('active');
        }
        
        // Show gene emotes
        if (character.genes.length === 1) {
            indicator.textContent = GENE_SYMBOLS[character.genes[0]];
        } else {
            indicator.innerHTML = `<span style="font-size: 10px;">${GENE_SYMBOLS[character.genes[0]]}${GENE_SYMBOLS[character.genes[1]]}</span>`;
        }
        
        return indicator;
    }

    /**
     * Update active character name display
     * @param {Object} battleState - Current battle state
     */
    updateActiveCharacterName(battleState) {
        const activeNameElement = document.getElementById('activeCharacterName');
        if (!activeNameElement || !battleState.currentCharacter) return;
        
        activeNameElement.textContent = battleState.currentCharacter.getDisplayName();
    }

    /**
     * Show damage animation on target
     * @param {string} targetName - Name of target character
     * @param {number} damage - Amount of damage
     * @param {number} effectiveness - Type effectiveness multiplier
     */
    showDamageAnimation(targetName, damage, effectiveness) {
        // Find target element by name
        const targetElement = this.findCharacterElement(targetName);
        if (!targetElement) return;
        
        // Create and position damage number
        const damageNum = this.createDamageNumber(damage, effectiveness);
        this.positionDamageNumber(damageNum, targetElement);
        
        document.body.appendChild(damageNum);
        
        // Remove after animation
        setTimeout(() => {
            if (damageNum.parentNode) {
                damageNum.remove();
            }
        }, ANIMATION_CONFIG.DAMAGE_ANIMATION_DURATION);
        
        // Shake target
        this.shakeTarget(targetElement, damage);
        
        // Update display after a brief delay
        setTimeout(() => this.updateBattleDisplay(), 200);
    }

    /**
     * Find character element by name
     * @param {string} targetName - Name to search for
     * @returns {HTMLElement|null} Found element or null
     */
    findCharacterElement(targetName) {
        const targetElements = document.querySelectorAll('[data-battle-char]');
        
        for (const element of targetElements) {
            const charNameElement = element.querySelector('.character-stats div');
            if (charNameElement && charNameElement.textContent === targetName) {
                return element;
            }
        }
        
        return null;
    }

    /**
     * Create damage number element
     * @param {number} damage - Damage amount
     * @param {number} effectiveness - Effectiveness multiplier
     * @returns {HTMLElement} Damage number element
     */
    createDamageNumber(damage, effectiveness) {
        const damageNum = document.createElement('div');
        damageNum.className = 'damage-number damage-animation';
        
        // Add effectiveness indicator
        let effectivenessIndicator = '';
        if (effectiveness === 1.5) {
            effectivenessIndicator = ' 🚑(+50%)';
            damageNum.classList.add('super-effective');
        } else if (effectiveness === 1.25) {
            effectivenessIndicator = ' 📈(+25%)';
            damageNum.classList.add('super-effective');
        } else if (effectiveness === 0.75) {
            effectivenessIndicator = ' 📉(-25%)';
            damageNum.classList.add('not-very-effective');
        } else if (effectiveness === 0.5) {
            effectivenessIndicator = ' 🗿(-50%)';
            damageNum.classList.add('not-very-effective');
        }
        
        damageNum.textContent = damage + effectivenessIndicator;
        
        return damageNum;
    }

    /**
     * Position damage number over target
     * @param {HTMLElement} damageNum - Damage number element
     * @param {HTMLElement} targetElement - Target character element
     */
    positionDamageNumber(damageNum, targetElement) {
        const rect = targetElement.getBoundingClientRect();
        damageNum.style.position = 'fixed';
        damageNum.style.left = (rect.left + rect.width / 2) + 'px';
        damageNum.style.top = rect.top + 'px';
        damageNum.style.zIndex = '1000';
    }

    /**
     * Apply shake animation to target
     * @param {HTMLElement} targetElement - Element to shake
     * @param {number} damage - Damage amount (affects shake intensity)
     */
    shakeTarget(targetElement, damage) {
        targetElement.classList.add('battle-shake');
        const shakeIntensity = Math.min(damage / 50, 1);
        targetElement.style.setProperty('--shake-intensity', shakeIntensity);
        
        setTimeout(() => {
            targetElement.classList.remove('battle-shake');
            targetElement.style.removeProperty('--shake-intensity');
        }, ANIMATION_CONFIG.BATTLE_SHAKE_DURATION);
    }

    /**
     * Show attack animation between characters
     * @param {GameCharacter} attacker - Attacking character
     * @param {GameCharacter} target - Target character
     * @returns {Promise} Promise that resolves when animation completes
     */
    showAttackAnimation(attacker, target) {
        return new Promise(resolve => {
            const attackerElement = document.querySelector(`[data-battle-char="${attacker.id}"]`);
            const targetElement = document.querySelector(`[data-battle-char="${target.id}"]`);

            // Highlight attacker
            if (attackerElement) {
                attackerElement.style.boxShadow = '0 0 20px #ffeb3b';
                attackerElement.style.transform = 'scale(1.1)';
            }
            
            setTimeout(() => {
                // Highlight target
                if (targetElement) {
                    targetElement.style.boxShadow = '0 0 20px #ff6b6b';
                }
                
                setTimeout(() => {
                    // Reset styles
                    if (attackerElement) {
                        attackerElement.style.boxShadow = '';
                        attackerElement.style.transform = '';
                    }
                    if (targetElement) {
                        targetElement.style.boxShadow = '';
                    }
                    resolve();
                }, 800);
            }, 500);
        });
    }

    /**
     * Add entry to battle log
     * @param {string} message - Log message
     * @param {string} className - CSS class for styling
     */
    addBattleLogEntry(message, className = '') {
        this.battleLog.push({ message, className });
        if (this.battleLog.length > 10) {
            this.battleLog.shift();
        }
        
        this.updateBattleLogDisplay();
    }

    /**
     * Update battle log display
     */
    updateBattleLogDisplay() {
        const logElement = document.getElementById('battleLog');
        if (!logElement) return;
        
        logElement.innerHTML = this.battleLog
            .map(log => `<div class="log-entry ${log.className}">${log.message}</div>`)
            .join('');
        logElement.scrollTop = logElement.scrollHeight;
    }

    /**
     * Clear battle log
     */
    clearBattleLog() {
        this.battleLog = [];
        this.updateBattleLogDisplay();
    }

    /**
     * Display turn results in battle log
     * @param {Object} turnResults - Results from attack
     */
    displayTurnResults(turnResults) {
        if (turnResults.type === 'single') {
            this.displaySingleAttackResult(turnResults);
        } else if (turnResults.type === 'splash') {
            this.displaySplashAttackResult(turnResults);
        }
    }

    /**
     * Display single attack result in log
     * @param {Object} result - Single attack result
     */
    displaySingleAttackResult(result) {
        const attackSymbol = result.attackGene === 'Neutral' ? '⚪' : GENE_SYMBOLS[result.attackGene];
        
        let effectivenessText = '';
        let logClass = 'damage';
        
        if (result.effectiveness === 1.5) {
            effectivenessText = `🚑Very effective (+50%)`;
            logClass = 'super-effective';
        } else if (result.effectiveness === 1.25) {
            effectivenessText = `📈Effective (+25%)`;
            logClass = 'super-effective';
        } else if (result.effectiveness === 0.75) {
            effectivenessText = `📉Not too effective (-25%)`;
            logClass = 'not-very-effective';
        } else if (result.effectiveness === 0.5) {
            effectivenessText = `🗿Not effective at all (-50%)`;
            logClass = 'not-very-effective';
        } else {
            effectivenessText = `Normal damage`;
        }
        
        const logMessage = `${result.attacker} (${attackSymbol}${result.attackGene}) → ${result.target} | ${result.damage} dmg | ${effectivenessText}`;
        this.addBattleLogEntry(logMessage, logClass);
        
        if (result.targetDefeated) {
            this.addBattleLogEntry(`💀 ${result.target} was defeated!`, 'damage');
        }
        
        // Show damage animation
        this.showDamageAnimation(result.target, result.damage, result.effectiveness);
    }

    /**
     * Display splash attack result in log
     * @param {Object} result - Splash attack result
     */
    displaySplashAttackResult(result) {
        const attackSymbol = GENE_SYMBOLS[result.attackGene];
        this.addBattleLogEntry(`💥💥 ${result.attacker} uses ${attackSymbol} ${result.attackGene} Splash Attack!`, 'super-effective');
        
        result.targets.forEach(target => {
            const logMessage = `${result.attacker} SPLASH → ${target.name} | ${target.damage} dmg`;
            this.addBattleLogEntry(logMessage, 'damage');
            
            if (target.defeated) {
                this.addBattleLogEntry(`💀 ${target.name} was defeated!`, 'damage');
            }
            
            this.showDamageAnimation(target.name, target.damage, target.effectiveness);
        });
    }

    /**
     * Handle battle end display
     * @param {string} winner - 'player' or 'enemy'
     */
    handleBattleEnd(winner) {
        const message = winner === 'player' ? 'Victory! You won the battle!' : 'Defeat! Better luck next time!';
        const teamClass = winner === 'player' ? 'player-attack' : 'enemy-attack';
        this.addBattleLogEntry(message, `super-effective ${teamClass}`);
        
        setTimeout(() => {
            alert(message);
            this.game.returnToSetup();
        }, 2000);
    }

    /**
     * Reset display to initial state
     */
    reset() {
        this.clearBattleLog();
        
        // Hide battle arena
        document.getElementById('team-setup').style.display = 'block';
        document.getElementById('battle-arena').style.display = 'none';
    }
}