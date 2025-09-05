// BattleControls Class - Player Interaction and Battle Control Management
import { 
    GENE_COLORS, 
    GENE_LIGHT_COLORS, 
    GENE_DARK_COLORS, 
    ANIMATION_CONFIG 
} from './config.js';

export class BattleControls {
    constructor(battleSystem, battleAI, battleDisplay, gameInstance) {
        this.battleSystem = battleSystem;
        this.battleAI = battleAI;
        this.battleDisplay = battleDisplay;
        this.game = gameInstance;
        this.selectedAttackObj = null;
        this.isInitialized = false;
    }

    /**
     * Initialize battle controls
     */
    initialize() {
        this.isInitialized = true;
        this.updateBattleControls();
        
        // Handle first turn
        const battleState = this.battleSystem.getBattleState();
        if (battleState.currentCharacter && !battleState.currentCharacter.isPlayer) {
            setTimeout(() => this.processAITurn(), ANIMATION_CONFIG.AI_THINK_TIME / 2);
        }
    }

    /**
     * Update battle controls interface
     */
    updateBattleControls() {
        if (!this.isInitialized) return;
        
        const battleState = this.battleSystem.getBattleState();
        const currentChar = battleState.currentCharacter;
        const controlsElement = document.getElementById('battleControls');
        
        if (!currentChar || !controlsElement) return;

        if (currentChar.isPlayer && !battleState.isProcessingTurn) {
            controlsElement.style.display = 'block';
            this.renderPlayerControls(currentChar, battleState.attackButtonsDisabled);
        } else if (!currentChar.isPlayer) {
            controlsElement.style.display = 'block';
            this.renderEnemyControls();
        }
    }

    /**
     * Render player control interface
     * @param {GameCharacter} currentChar - Current player character
     * @param {boolean} buttonsDisabled - Whether buttons should be disabled
     */
    renderPlayerControls(currentChar, buttonsDisabled) {
        const attackButtonsElement = document.getElementById('attackButtons');
        if (!attackButtonsElement) return;
        
        // Clear and create header
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            attackButtonsElement.innerHTML = '<div style="margin-bottom: 10px; color: #666; font-size: 14px; font-weight: 500;">Select an attack:</div>';
        } else {
            attackButtonsElement.innerHTML = '<div style="margin-bottom: 15px; color: #666;">Select an attack:</div>';
        }
        
        // Create attack buttons container
        const buttonContainer = this.createAttackButtonContainer(isMobile);
        const attackObjs = currentChar.getAttackGenes();
        
        attackObjs.forEach((attackObj) => {
            const button = this.createAttackButton(attackObj, buttonsDisabled, isMobile);
            button.addEventListener('click', () => this.selectAttackGene(attackObj));
            buttonContainer.appendChild(button);
        });

        attackButtonsElement.appendChild(buttonContainer);
    }

    /**
     * Create attack button container
     * @param {boolean} isMobile - Whether on mobile device
     * @returns {HTMLElement} Button container element
     */
    createAttackButtonContainer(isMobile) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = isMobile ? '12px' : '15px';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.flexWrap = 'wrap';
        
        return buttonContainer;
    }

    /**
     * Create an attack button element
     * @param {Object} attackObj - Attack object
     * @param {boolean} disabled - Whether button should be disabled
     * @param {boolean} isMobile - Whether on mobile device
     * @returns {HTMLElement} Attack button element
     */
    createAttackButton(attackObj, disabled = false, isMobile = false) {
        const button = document.createElement('button');
        button.className = 'attack-btn';
        button.disabled = disabled;
        
        // Set button text and styling
        if (attackObj.type === 'splash') {
            button.textContent = `${attackObj.gene} Splash ⇶`;
            button.style.setProperty('--attack-color', GENE_DARK_COLORS[attackObj.gene]);
            button.style.setProperty('--attack-color-light', GENE_COLORS[attackObj.gene]);
        } else {
            button.textContent = attackObj.gene;
            if (attackObj.gene !== 'Neutral') {
                button.style.setProperty('--attack-color', GENE_COLORS[attackObj.gene]);
                button.style.setProperty('--attack-color-light', GENE_LIGHT_COLORS[attackObj.gene]);
            } else {
                button.style.setProperty('--attack-color', '#999');
                button.style.setProperty('--attack-color-light', '#bbb');
            }
        }
        
        // Mobile-specific styling
        if (isMobile) {
            button.style.minWidth = '130px';
            button.style.maxWidth = '150px';
            button.style.padding = '12px 16px';
            button.style.fontSize = '14px';
        }
        
        return button;
    }

    /**
     * Render enemy control interface
     */
    renderEnemyControls() {
        const attackButtonsElement = document.getElementById('attackButtons');
        if (!attackButtonsElement) return;
        
        attackButtonsElement.innerHTML = '<div style="text-align: center; color: #666;">Enemy is thinking...</div>';
    }

    /**
     * Handle attack gene selection
     * @param {Object} attackObj - Selected attack object
     */
    selectAttackGene(attackObj) {
        // Prevent selecting attack if already processing a turn or buttons are disabled
        if (this.battleSystem.isProcessingTurn || this.battleSystem.attackButtonsDisabled) {
            return;
        }
        
        // Disable attack buttons immediately after clicking
        this.battleSystem.attackButtonsDisabled = true;
        this.updateBattleControls();
        
        this.selectedAttackObj = attackObj;
        this.showTargetSelection();
    }

    /**
     * Show target selection interface
     */
    showTargetSelection() {
        const attackButtonsElement = document.getElementById('attackButtons');
        if (!attackButtonsElement) return;
        
        // For splash attacks, don't show target selection - just execute immediately
        if (this.selectedAttackObj.type === 'splash') {
            this.executePlayerTurn(this.selectedAttackObj, null);
            return;
        }
        
        const availableTargets = this.battleSystem.getAvailableTargets();
        
        attackButtonsElement.innerHTML = '<div style="margin-bottom: 15px; color: #666; font-weight: bold; text-align: center; padding: 0 10px;">Select a target:</div>';
        
        const targetContainer = this.createTargetContainer();
        
        availableTargets.forEach(target => {
            const button = this.createTargetButton(target);
            button.addEventListener('click', async () => {
                // Prevent multiple clicks during turn processing
                if (this.battleSystem.isProcessingTurn) return;
                
                // Disable all target buttons immediately
                const allTargetButtons = targetContainer.querySelectorAll('button');
                allTargetButtons.forEach(btn => btn.disabled = true);
                
                await this.battleDisplay.showAttackAnimation(this.battleSystem.getCurrentCharacter(), target);
                this.executePlayerTurn(this.selectedAttackObj, target);
            });
            
            targetContainer.appendChild(button);
        });
        
        attackButtonsElement.appendChild(targetContainer);
    }

    /**
     * Create target selection container
     * @returns {HTMLElement} Target container element
     */
    createTargetContainer() {
        const targetContainer = document.createElement('div');
        targetContainer.style.display = 'flex';
        
        const isMobile = window.innerWidth <= 768;
        targetContainer.style.gap = isMobile ? '6px' : '8px';
        targetContainer.style.justifyContent = 'center';
        targetContainer.style.flexWrap = 'wrap';
        targetContainer.style.width = '100%';
        
        return targetContainer;
    }

    /**
     * Create a target button element
     * @param {GameCharacter} target - Target character
     * @returns {HTMLElement} Target button element
     */
    createTargetButton(target) {
        const button = document.createElement('button');
        button.className = 'attack-btn';

        // Use target's gene colors for the button
        this.applyTargetButtonStyling(button, target);
        
        button.textContent = target.getDisplayName();
        button.style.color = 'white';
        button.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.7)';
        
        // Mobile-optimized sizing
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            button.style.minWidth = '100px';
            button.style.maxWidth = '120px';
            button.style.flex = '1 1 100px';
            button.style.fontSize = '12px';
            button.style.padding = '10px 12px';
            button.style.whiteSpace = 'nowrap';
            button.style.overflow = 'hidden';
            button.style.textOverflow = 'ellipsis';
        } else {
            button.style.minWidth = '120px';
            button.style.maxWidth = '140px';
            button.style.flex = '1 1 120px';
        }
        
        return button;
    }

    /**
     * Apply styling to target button based on character genes
     * @param {HTMLElement} button - Button element to style
     * @param {GameCharacter} target - Target character
     */
    applyTargetButtonStyling(button, target) {
        if (target.genes.length === 1) {
            button.style.background = `linear-gradient(45deg, ${GENE_COLORS[target.genes[0]]}, ${GENE_LIGHT_COLORS[target.genes[0]]})`;
        } else if (target.genes[0] === target.genes[1]) {
            const geneColor = GENE_COLORS[target.genes[0]];
            const darkColor = GENE_DARK_COLORS[target.genes[0]];
            button.style.background = `linear-gradient(45deg, ${geneColor}, ${darkColor}, ${geneColor})`;
        } else {
            button.style.background = `linear-gradient(45deg, ${GENE_COLORS[target.genes[0]]}, ${GENE_COLORS[target.genes[1]]})`;
        }
    }

    /**
     * Execute player turn
     * @param {Object} attackObj - Attack object
     * @param {GameCharacter} target - Target character (null for splash)
     */
    async executePlayerTurn(attackObj, target) {
        const result = await this.battleSystem.processTurn(attackObj, target);
        
        if (result.success) {
            this.handleTurnResult(result);
            
            if (!result.battleEnded) {
                const nextTurnData = this.battleSystem.nextTurn();
                this.battleDisplay.updateBattleDisplay();
                this.updateBattleControls();
                
                // Handle next turn
                if (nextTurnData.nextCharacter && !nextTurnData.nextCharacter.isPlayer) {
                    setTimeout(() => this.processAITurn(), ANIMATION_CONFIG.TURN_TRANSITION_TIME);
                }
            }
        }
    }

    /**
     * Process AI turn
     */
    async processAITurn() {
        const onThinkingStart = (attacker) => {
            this.battleDisplay.addBattleLogEntry(`🤖 ${attacker.getDisplayName()} is thinking...`, 'enemy-attack');
        };
        
        const onDecisionMade = async (decision) => {
            if (decision.success) {
                const result = await this.battleSystem.processTurn(decision.attack, decision.target);
                
                if (result.success) {
                    this.handleTurnResult(result);
                    
                    if (!result.battleEnded) {
                        const nextTurnData = this.battleSystem.nextTurn();
                        this.battleDisplay.updateBattleDisplay();
                        this.updateBattleControls();
                        
                        // Handle next turn
                        if (nextTurnData.nextCharacter && !nextTurnData.nextCharacter.isPlayer) {
                            setTimeout(() => this.processAITurn(), ANIMATION_CONFIG.TURN_TRANSITION_TIME);
                        }
                    }
                }
            }
        };
        
        await this.battleAI.processAITurn(onThinkingStart, onDecisionMade);
    }

    /**
     * Handle turn result and update displays accordingly
     * @param {Object} result - Turn result from battle system
     */
    handleTurnResult(result) {
        if (result.turnResults) {
            this.battleDisplay.displayTurnResults(result.turnResults);
        }
        
        if (result.battleEnded) {
            this.handleBattleEnd(result.winner);
        }
    }

    /**
     * Handle battle end
     * @param {string} winner - 'player' or 'enemy'
     */
    handleBattleEnd(winner) {
        this.battleDisplay.handleBattleEnd(winner);
    }

    /**
     * Check if controls should be enabled for current turn
     * @returns {boolean} True if controls should be enabled
     */
    shouldEnableControls() {
        const battleState = this.battleSystem.getBattleState();
        return battleState.currentCharacter && 
               battleState.currentCharacter.isPlayer && 
               !battleState.isProcessingTurn &&
               !battleState.attackButtonsDisabled;
    }

    /**
     * Enable player controls
     */
    enableControls() {
        this.battleSystem.attackButtonsDisabled = false;
        this.updateBattleControls();
    }

    /**
     * Disable player controls
     */
    disableControls() {
        this.battleSystem.attackButtonsDisabled = true;
        this.updateBattleControls();
    }

    /**
     * Get available attack options for current character
     * @returns {Array} Array of attack objects
     */
    getAvailableAttacks() {
        const currentChar = this.battleSystem.getCurrentCharacter();
        return currentChar ? currentChar.getAttackGenes() : [];
    }

    /**
     * Get available targets for current character
     * @returns {Array} Array of target characters
     */
    getAvailableTargets() {
        return this.battleSystem.getAvailableTargets();
    }

    /**
     * Predict AI move for UI hints
     * @returns {Object|null} Predicted move information
     */
    predictAIMove() {
        const currentChar = this.battleSystem.getCurrentCharacter();
        if (!currentChar || currentChar.isPlayer) return null;
        
        const availableTargets = this.getAvailableTargets();
        return this.battleAI.predictMove(currentChar, availableTargets);
    }

    /**
     * Force end current turn (for debugging/testing)
     */
    forceEndTurn() {
        if (this.battleSystem.isProcessingTurn) return;
        
        const nextTurnData = this.battleSystem.nextTurn();
        this.battleDisplay.updateBattleDisplay();
        this.updateBattleControls();
        
        if (nextTurnData.nextCharacter && !nextTurnData.nextCharacter.isPlayer) {
            setTimeout(() => this.processAITurn(), ANIMATION_CONFIG.TURN_TRANSITION_TIME);
        }
    }

    /**
     * Get control state information
     * @returns {Object} Current control state
     */
    getControlState() {
        const battleState = this.battleSystem.getBattleState();
        return {
            isPlayerTurn: battleState.currentCharacter && battleState.currentCharacter.isPlayer,
            controlsEnabled: this.shouldEnableControls(),
            processingTurn: battleState.isProcessingTurn,
            availableAttacks: this.getAvailableAttacks(),
            availableTargets: this.getAvailableTargets(),
            selectedAttack: this.selectedAttackObj
        };
    }

    /**
     * Reset controls to initial state
     */
    reset() {
        this.selectedAttackObj = null;
        this.isInitialized = false;
        
        // Clear any attack button states
        const attackButtonsElement = document.getElementById('attackButtons');
        if (attackButtonsElement) {
            attackButtonsElement.innerHTML = '';
        }
        
        // Hide battle controls
        const controlsElement = document.getElementById('battleControls');
        if (controlsElement) {
            controlsElement.style.display = 'none';
        }
    }
}