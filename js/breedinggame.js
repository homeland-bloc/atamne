// BreedingGame Class - Main Game Coordinator and State Manager
import { GENES } from './config.js';
import { GameCharacter } from './GameCharacter.js';
import { BattleSystem } from './BattleSystem.js';
import { BattleAI } from './BattleAI.js';
import { BattleDisplay } from './BattleDisplay.js';
import { BattleControls } from './BattleControls.js';
import { BreedingLogic } from './BreedingLogic.js';
import { BreedingUI } from './BreedingUI.js';
import { BotSolver } from './BotSolver.js';

export class BreedingGame {
    constructor() {
        // Core game state
        this.characters = this.generateCharacters();
        this.selectedCharacters = [];
        this.selectedBattleTeam = [];
        this.victoryShown = false;
        
        // Initialize subsystems
        this.initializeSystems();
        this.setupEventListeners();
        this.init();
    }

    /**
     * Initialize all game subsystems
     */
    initializeSystems() {
        // Battle system components
        this.battleSystem = new BattleSystem(this);
        this.battleAI = new BattleAI(this.battleSystem);
        this.battleDisplay = new BattleDisplay(this.battleSystem, this);
        this.battleControls = new BattleControls(this.battleSystem, this.battleAI, this.battleDisplay, this);
        
        // Breeding system components
        this.breedingLogic = new BreedingLogic(this);
        this.breedingUI = new BreedingUI(this, this.breedingLogic);
        this.botSolver = new BotSolver(this, this.breedingLogic);
    }

    /**
     * Generate all possible character combinations
     * @returns {Object} Object containing all characters
     */
    generateCharacters() {
        const characters = {};
        
        // Single gene characters (unlocked by default)
        GENES.forEach(gene => {
            characters[gene] = new GameCharacter(gene, [gene], true);
        });

        // Double gene characters (locked by default)
        GENES.forEach((primary) => {
            GENES.forEach((secondary) => {
                const id = `${primary}-${secondary}`;
                characters[id] = new GameCharacter(id, [primary, secondary], false);
            });
        });

        return characters;
    }

    /**
     * Initialize the game UI and state
     */
    init() {
        this.setupTabNavigation();
        this.breedingUI.createTable();
        this.updateDisplay();
        this.updateBattleTeamSelection();
    }

    /**
     * Setup tab navigation between breeding and battle
     */
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(content => {
                    if (content.id === `${targetTab}-tab`) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
                
                // Update battle team selection when switching to battle tab
                if (targetTab === 'battle') {
                    this.updateBattleTeamSelection();
                }
            });
        });
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Breeding controls
        const breedBtn = document.getElementById('breedBtn');
        if (breedBtn) {
            breedBtn.addEventListener('click', () => this.breed());
        }

        // Bot controls
        const botToggle = document.getElementById('botToggle');
        if (botToggle) {
            botToggle.addEventListener('change', (e) => this.botSolver.toggleBot(e.target.checked));
        }

        // Speed controls
        document.querySelectorAll('.speed-radio').forEach(radio => {
            radio.addEventListener('click', (e) => {
                const speed = parseInt(e.target.dataset.speed);
                this.breedingLogic.setSpeed(speed);
                this.updateSpeedDisplay(speed);
            });
        });

        // Reset controls
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.showResetConfirmation());
        }

        const unlockAllBtn = document.getElementById('unlockAllBtn');
        if (unlockAllBtn) {
            unlockAllBtn.addEventListener('click', () => this.unlockAllCharacters());
        }

        // Battle controls
        const startBattleBtn = document.getElementById('startBattleBtn');
        if (startBattleBtn) {
            startBattleBtn.addEventListener('click', () => this.startBattle());
        }

        const randomSelectBtn = document.getElementById('randomSelectBtn');
        if (randomSelectBtn) {
            randomSelectBtn.addEventListener('click', () => this.selectRandomTeam());
        }

        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.difficulty-btn').classList.add('active');
                const difficulty = e.target.closest('.difficulty-btn').dataset.difficulty;
                this.battleAI.setDifficulty(difficulty);
            });
        });

        // Reset confirmation
        const confirmReset = document.getElementById('confirmReset');
        const cancelReset = document.getElementById('cancelReset');
        
        if (confirmReset) {
            confirmReset.addEventListener('click', () => this.confirmReset());
        }
        
        if (cancelReset) {
            cancelReset.addEventListener('click', () => this.cancelReset());
        }
    }

    /**
     * Select a character for breeding
     * @param {string} characterId - ID of character to select
     */
    selectCharacter(characterId) {
        const character = this.characters[characterId];
        if (!character.unlocked || this.botSolver.isActive()) return;

        if (this.selectedCharacters.includes(characterId)) {
            this.selectedCharacters = this.selectedCharacters.filter(id => id !== characterId);
        } else if (this.selectedCharacters.length < 2) {
            this.selectedCharacters.push(characterId);
        } else {
            this.selectedCharacters[0] = this.selectedCharacters[1];
            this.selectedCharacters[1] = characterId;
        }

        this.updateDisplay();
    }

    /**
     * Start breeding process
     */
    breed() {
        if (this.selectedCharacters.length !== 2) return;

        const parent1 = this.characters[this.selectedCharacters[0]];
        const parent2 = this.characters[this.selectedCharacters[1]];

        this.breedingLogic.startBreeding(parent1, parent2, (result) => {
            if (result.success && result.newUnlock) {
                this.unlockCharacter(result.characterId);
            }
            this.selectedCharacters = [];
            this.updateDisplay();
        });
    }

    /**
     * Unlock a character
     * @param {string} characterId - ID of character to unlock
     */
    unlockCharacter(characterId) {
        this.characters[characterId].unlocked = true;
        this.breedingUI.updateCharacterSlot(characterId);
        this.updateDisplay();
        this.updateBattleTeamSelection();
    }

    /**
     * Unlock all characters (cheat function)
     */
    unlockAllCharacters() {
        Object.values(this.characters).forEach(character => {
            if (!character.unlocked) {
                character.unlocked = true;
            }
        });
        
        this.breedingUI.createTable();
        this.updateDisplay();
        this.updateBattleTeamSelection();
        
        // Show victory message
        this.victoryShown = true;
        setTimeout(() => this.showVictory(), 500);
    }

    /**
     * Update all display elements
     */
    updateDisplay() {
        this.breedingUI.updateSelectionStates(this.selectedCharacters);
        this.breedingUI.updateParentDisplays(this.selectedCharacters);
        this.updateBreedButton();
        this.updateProgress();
    }

    /**
     * Update breed button state
     */
    updateBreedButton() {
        const breedBtn = document.getElementById('breedBtn');
        if (!breedBtn) return;

        if (this.botSolver.isActive()) {
            breedBtn.disabled = true;
            breedBtn.textContent = 'Bot is in Control';
        } else if (this.selectedCharacters.length === 2) {
            breedBtn.disabled = false;
            breedBtn.textContent = 'Breed Creatures';
        } else {
            breedBtn.disabled = true;
            breedBtn.textContent = 'Select Two Creatures to Breed';
        }
    }

    /**
     * Update progress display
     */
    updateProgress() {
        const unlockedCount = Object.values(this.characters).filter(c => c.unlocked).length;
        const totalCount = Object.keys(this.characters).length;
        const progress = (unlockedCount / totalCount) * 100;
        
        const progressFill = document.getElementById('progressFill');
        const unlockedCountElement = document.getElementById('unlockedCount');
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (unlockedCountElement) unlockedCountElement.textContent = unlockedCount;

        // Check for victory
        if (unlockedCount === totalCount && !this.victoryShown) {
            this.victoryShown = true;
            setTimeout(() => this.showVictory(), 1000);
        }
    }

    /**
     * Update speed control display
     * @param {number} speed - Current speed multiplier
     */
    updateSpeedDisplay(speed) {
        document.querySelectorAll('.speed-radio').forEach(radio => {
            radio.classList.remove('active');
        });
        document.querySelector(`[data-speed="${speed}"]`)?.classList.add('active');
    }

    /**
     * Show victory message
     */
    showVictory() {
        const victoryMessage = document.getElementById('victoryMessage');
        if (victoryMessage) {
            victoryMessage.classList.add('show');
            setTimeout(() => {
                victoryMessage.classList.remove('show');
            }, 4000);
        }
    }

    /**
     * Toggle battle team selection
     * @param {string} characterId - ID of character to toggle
     */
    toggleBattleTeamSelection(characterId) {
        if (this.selectedBattleTeam.includes(characterId)) {
            this.selectedBattleTeam = this.selectedBattleTeam.filter(id => id !== characterId);
        } else if (this.selectedBattleTeam.length < 3) {
            this.selectedBattleTeam.push(characterId);
        }
        
        this.updateBattleTeamSelection();
    }

    /**
     * Update battle team selection interface
     */
    updateBattleTeamSelection() {
        const selectionGrid = document.getElementById('battleCharacterSelection');
        const selectedTeamDisplay = document.getElementById('selectedTeamDisplay');
        const startBattleBtn = document.getElementById('startBattleBtn');
        
        if (!selectionGrid) return;
        
        // Clear and rebuild selection grid
        selectionGrid.innerHTML = '';
        const unlockedChars = Object.values(this.characters).filter(char => char.unlocked);
        
        unlockedChars.forEach(character => {
            const slot = this.createBattleSelectionSlot(character);
            selectionGrid.appendChild(slot);
        });
        
        // Update selected team display
        this.updateSelectedTeamDisplay(selectedTeamDisplay);
        
        // Update start battle button
        this.updateStartBattleButton(startBattleBtn);
    }

    /**
     * Create battle selection slot
     * @param {GameCharacter} character - Character to create slot for
     * @returns {HTMLElement} Selection slot element
     */
    createBattleSelectionSlot(character) {
        const slot = document.createElement('div');
        slot.className = 'selection-slot';
        if (this.selectedBattleTeam.includes(character.id)) {
            slot.classList.add('selected');
        }
        
        const sprite = document.createElement('div');
        sprite.className = 'character-sprite';
        this.breedingUI.updateCharacterSprite(sprite, character);
        
        slot.appendChild(sprite);
        slot.addEventListener('click', () => this.toggleBattleTeamSelection(character.id));
        
        return slot;
    }

    /**
     * Update selected team display
     * @param {HTMLElement} container - Container element
     */
    updateSelectedTeamDisplay(container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        // Show selected characters
        this.selectedBattleTeam.forEach(charId => {
            const character = this.characters[charId];
            const slot = document.createElement('div');
            slot.className = 'character-slot unlocked';
            
            const sprite = document.createElement('div');
            sprite.className = 'character-sprite';
            this.breedingUI.updateCharacterSprite(sprite, character);
            
            slot.appendChild(sprite);
            container.appendChild(slot);
        });
        
        // Add empty slots
        for (let i = this.selectedBattleTeam.length; i < 3; i++) {
            const slot = document.createElement('div');
            slot.className = 'character-slot locked';
            const sprite = document.createElement('div');
            sprite.className = 'character-sprite locked-sprite';
            sprite.textContent = '?';
            slot.appendChild(sprite);
            container.appendChild(slot);
        }
    }

    /**
     * Update start battle button
     * @param {HTMLElement} button - Button element
     */
    updateStartBattleButton(button) {
        if (!button) return;
        
        if (this.selectedBattleTeam.length === 3) {
            button.disabled = false;
            button.textContent = 'Start Battle!';
        } else {
            button.disabled = true;
            const remaining = 3 - this.selectedBattleTeam.length;
            button.textContent = `Select ${remaining} more creature${remaining !== 1 ? 's' : ''} to Start Battle`;
        }
    }

    /**
     * Select random team for battle
     */
    selectRandomTeam() {
        const unlockedCharacters = Object.values(this.characters).filter(char => char.unlocked);
        
        if (unlockedCharacters.length < 3) {
            alert('You need at least 3 unlocked characters to use random selection!');
            return;
        }
        
        // Clear current selection and randomly select 3
        this.selectedBattleTeam = [];
        const shuffled = [...unlockedCharacters].sort(() => 0.5 - Math.random());
        this.selectedBattleTeam = shuffled.slice(0, 3).map(char => char.id);
        
        this.updateBattleTeamSelection();
    }

    /**
     * Start battle with selected team
     */
    startBattle() {
        if (this.selectedBattleTeam.length !== 3) return;
        
        const playerTeam = this.selectedBattleTeam.map(id => this.characters[id]);
        const battleData = this.battleSystem.setupBattle(playerTeam);
        this.battleDisplay.renderBattleArena(battleData);
        this.battleControls.initialize();
    }

    /**
     * Show reset confirmation
     */
    showResetConfirmation() {
        const popup = document.getElementById('confirmationPopup');
        if (popup) {
            popup.classList.add('show');
        }
    }

    /**
     * Confirm reset
     */
    confirmReset() {
        const popup = document.getElementById('confirmationPopup');
        if (popup) {
            popup.classList.remove('show');
        }
        this.resetGame();
    }

    /**
     * Cancel reset
     */
    cancelReset() {
        const popup = document.getElementById('confirmationPopup');
        if (popup) {
            popup.classList.remove('show');
        }
    }

    /**
     * Reset the entire game
     */
    resetGame() {
        // Stop any running processes
        this.botSolver.stop();
        this.battleSystem.clearAllTimers();
        this.battleAI.clearTimers();
        
        // Reset game state
        this.characters = this.generateCharacters();
        this.selectedCharacters = [];
        this.selectedBattleTeam = [];
        this.victoryShown = false;
        
        // Reset UI components
        this.breedingLogic.reset();
        this.breedingUI.reset();
        this.battleSystem.reset();
        this.battleAI.reset();
        
        // Reset UI state
        const botToggle = document.getElementById('botToggle');
        if (botToggle) botToggle.checked = false;
        
        const botStatus = document.getElementById('botStatus');
        if (botStatus) {
            botStatus.textContent = 'Bot is off - You\'re in control';
            botStatus.classList.remove('active');
        }
        
        // Reset speed controls
        this.breedingLogic.setSpeed(1);
        this.updateSpeedDisplay(1);
        
        // Switch to breeding tab
        document.querySelector('[data-tab="breeding"]')?.click();
        
        // Rebuild UI
        this.breedingUI.createTable();
        this.updateDisplay();
        this.updateBattleTeamSelection();
    }

    /**
     * Return to team setup from battle
     */
    returnToSetup() {
        document.getElementById('team-setup').style.display = 'block';
        document.getElementById('battle-arena').style.display = 'none';
        
        // Reset battle components
        this.battleSystem.reset();
        this.battleAI.reset();
        this.battleControls.reset();
        
        this.selectedBattleTeam = [];
        this.updateBattleTeamSelection();
    }

    /**
     * Get character by ID
     * @param {string} id - Character ID
     * @returns {GameCharacter} Character instance
     */
    getCharacter(id) {
        return this.characters[id];
    }

    /**
     * Get all unlocked characters
     * @returns {Array} Array of unlocked characters
     */
    getUnlockedCharacters() {
        return Object.values(this.characters).filter(char => char.unlocked);
    }
}