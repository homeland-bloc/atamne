// BreedingUI Class - Breeding Interface and Visual Management
import { 
    GENES, 
    GENE_COLORS, 
    GENE_LIGHT_COLORS, 
    GENE_DARK_COLORS, 
    GENE_SYMBOLS 
} from './config.js';

export class BreedingUI {
    constructor(gameInstance, breedingLogic) {
        this.game = gameInstance;
        this.breedingLogic = breedingLogic;
    }

    /**
     * Create the breeding table grid
     */
    createTable() {
        const table = document.getElementById('breedingTable');
        if (!table) return;
        
        table.innerHTML = '';

        // Create 7x6 grid: 6 columns for double genes + 1 column for singles
        for (let row = 0; row < 6; row++) {
            // Double gene slots (6 columns)
            for (let col = 0; col < 6; col++) {
                const primary = GENES[col];
                const secondary = GENES[row];
                const id = `${primary}-${secondary}`;
                this.createCharacterSlot(table, id);
            }
            
            // Single gene slot (7th column)
            const singleGene = GENES[row];
            this.createCharacterSlot(table, singleGene);
        }
    }

    /**
     * Create a character slot element
     * @param {HTMLElement} container - Container to append to
     * @param {string} characterId - ID of the character
     */
    createCharacterSlot(container, characterId) {
        const character = this.game.getCharacter(characterId);
        const slot = document.createElement('div');
        slot.className = `character-slot ${character.unlocked ? 'unlocked' : 'locked'}`;
        slot.dataset.characterId = characterId;

        const sprite = document.createElement('div');
        sprite.className = 'character-sprite';
        
        this.updateCharacterSprite(sprite, character);

        slot.appendChild(sprite);
        container.appendChild(slot);

        if (character.unlocked) {
            slot.addEventListener('click', () => this.game.selectCharacter(characterId));
        }
    }

    /**
     * Update character sprite appearance
     * @param {HTMLElement} sprite - Sprite element to update
     * @param {GameCharacter} character - Character data
     */
    updateCharacterSprite(sprite, character) {
        if (character.unlocked) {
            if (character.genes.length === 1) {
                this.applySingleGeneStyle(sprite, character);
            } else {
                this.applyDoubleGeneStyle(sprite, character);
            }
        } else {
            this.applyLockedStyle(sprite);
        }
    }

    /**
     * Apply single gene character styling
     * @param {HTMLElement} sprite - Sprite element
     * @param {GameCharacter} character - Character data
     */
    applySingleGeneStyle(sprite, character) {
        sprite.className = sprite.className.replace(/single-gene|double-gene|same-gene|different-genes|locked-sprite/g, '').trim();
        sprite.className += ' single-gene';
        sprite.style.setProperty('--gene-color', GENE_COLORS[character.genes[0]]);
        sprite.textContent = character.symbol;
        sprite.innerHTML = character.symbol;
    }

    /**
     * Apply double gene character styling
     * @param {HTMLElement} sprite - Sprite element
     * @param {GameCharacter} character - Character data
     */
    applyDoubleGeneStyle(sprite, character) {
        sprite.className = sprite.className.replace(/single-gene|double-gene|same-gene|different-genes|locked-sprite/g, '').trim();
        sprite.className += ' double-gene';
        
        const isSameGene = character.genes[0] === character.genes[1];
        if (isSameGene) {
            this.applySameGeneStyle(sprite, character.genes[0]);
        } else {
            this.applyDifferentGenesStyle(sprite, character.genes);
        }
        
        this.addGeneEmojis(sprite, character.genes);
    }

    /**
     * Apply same gene styling (e.g., Red-Red)
     * @param {HTMLElement} sprite - Sprite element
     * @param {string} gene - Gene type
     */
    applySameGeneStyle(sprite, gene) {
        sprite.classList.add('same-gene');
        const geneColor = GENE_COLORS[gene];
        const darkColor = GENE_DARK_COLORS[gene];
        sprite.style.setProperty('--same-gene-gradient', 
            `linear-gradient(45deg, ${geneColor}, ${darkColor}, ${geneColor})`);
    }

    /**
     * Apply different genes styling (e.g., Red-Blue)
     * @param {HTMLElement} sprite - Sprite element
     * @param {Array} genes - Array of gene types
     */
    applyDifferentGenesStyle(sprite, genes) {
        sprite.classList.add('different-genes');
        sprite.style.setProperty('--primary-color', GENE_COLORS[genes[0]]);
        sprite.style.setProperty('--secondary-color', GENE_COLORS[genes[1]]);
    }

    /**
     * Add gene emoji elements to sprite
     * @param {HTMLElement} sprite - Sprite element
     * @param {Array} genes - Array of gene types
     */
    addGeneEmojis(sprite, genes) {
        sprite.innerHTML = '';
        
        genes.forEach(gene => {
            const emoji = document.createElement('span');
            emoji.className = 'gene-emoji';
            emoji.textContent = GENE_SYMBOLS[gene];
            sprite.appendChild(emoji);
        });
    }

    /**
     * Apply locked character styling
     * @param {HTMLElement} sprite - Sprite element
     */
    applyLockedStyle(sprite) {
        sprite.className = sprite.className.replace(/single-gene|double-gene|same-gene|different-genes/g, '').trim();
        sprite.className += ' locked-sprite';
        sprite.textContent = '?';
        sprite.innerHTML = '?';
        this.clearSpriteProperties(sprite);
    }

    /**
     * Clear CSS custom properties from sprite
     * @param {HTMLElement} sprite - Sprite element
     */
    clearSpriteProperties(sprite) {
        sprite.style.removeProperty('--gene-color');
        sprite.style.removeProperty('--primary-color');
        sprite.style.removeProperty('--secondary-color');
        sprite.style.removeProperty('--same-gene-gradient');
    }

    /**
     * Update character slot after unlock
     * @param {string} characterId - ID of character that was unlocked
     */
    updateCharacterSlot(characterId) {
        const slot = document.querySelector(`[data-character-id="${characterId}"]`);
        if (!slot) return;
        
        const character = this.game.getCharacter(characterId);
        
        slot.classList.remove('locked');
        slot.classList.add('unlocked', 'new-discovery');
        
        const sprite = slot.querySelector('.character-sprite');
        this.updateCharacterSprite(sprite, character);

        // Add click listener for newly unlocked character
        slot.addEventListener('click', () => this.game.selectCharacter(characterId));
        
        // Remove discovery animation after it completes
        setTimeout(() => slot.classList.remove('new-discovery'), 800);
    }

    /**
     * Update selection states for character slots
     * @param {Array} selectedCharacters - Array of selected character IDs
     */
    updateSelectionStates(selectedCharacters) {
        document.querySelectorAll('.character-slot').forEach(slot => {
            const characterId = slot.dataset.characterId;
            if (selectedCharacters.includes(characterId)) {
                slot.classList.add('selected');
            } else {
                slot.classList.remove('selected');
            }
        });
    }

    /**
     * Update parent display areas
     * @param {Array} selectedCharacters - Array of selected character IDs
     */
    updateParentDisplays(selectedCharacters) {
        this.updateParentDisplay('parent1Display', selectedCharacters[0]);
        this.updateParentDisplay('parent2Display', selectedCharacters[1]);
    }

    /**
     * Update a single parent display area
     * @param {string} displayId - ID of display element
     * @param {string} characterId - ID of character to display
     */
    updateParentDisplay(displayId, characterId) {
        const display = document.getElementById(displayId);
        if (!display) return;
        
        const sprite = display.querySelector('.character-sprite');
        
        if (characterId && this.game.getCharacter(characterId)) {
            const character = this.game.getCharacter(characterId);
            this.updateCharacterSprite(sprite, character);
        } else {
            this.clearParentDisplay(sprite);
        }
    }

    /**
     * Clear parent display (show empty state)
     * @param {HTMLElement} sprite - Sprite element to clear
     */
    clearParentDisplay(sprite) {
        sprite.textContent = '?';
        sprite.innerHTML = '?';
        sprite.className = 'character-sprite locked-sprite';
        this.clearSpriteProperties(sprite);
    }

    /**
     * Update breeding preview character
     * @param {HTMLElement} previewChar - Preview element
     * @param {GameCharacter} character - Character to display
     */
    updatePreviewCharacter(previewChar, character) {
        previewChar.className = 'preview-character';
        
        if (character.genes.length === 1) {
            this.updatePreviewSingleGene(previewChar, character);
        } else {
            this.updatePreviewDoubleGene(previewChar, character);
        }
    }

    /**
     * Update preview for single gene character
     * @param {HTMLElement} previewChar - Preview element
     * @param {GameCharacter} character - Character data
     */
    updatePreviewSingleGene(previewChar, character) {
        previewChar.className += ' single-gene';
        previewChar.style.setProperty('--gene-color', GENE_COLORS[character.genes[0]]);
        previewChar.textContent = character.symbol;
        previewChar.innerHTML = character.symbol;
    }

    /**
     * Update preview for double gene character
     * @param {HTMLElement} previewChar - Preview element
     * @param {GameCharacter} character - Character data
     */
    updatePreviewDoubleGene(previewChar, character) {
        const isSameGene = character.genes[0] === character.genes[1];
        previewChar.className += ' double-gene';
        
        if (isSameGene) {
            previewChar.classList.add('same-gene');
            const geneColor = GENE_COLORS[character.genes[0]];
            const darkColor = GENE_DARK_COLORS[character.genes[0]];
            previewChar.style.setProperty('--same-gene-gradient', 
                `linear-gradient(45deg, ${geneColor}, ${darkColor}, ${geneColor})`);
        } else {
            previewChar.classList.add('different-genes');
            previewChar.style.setProperty('--primary-color', GENE_COLORS[character.genes[0]]);
            previewChar.style.setProperty('--secondary-color', GENE_COLORS[character.genes[1]]);
        }
        
        // Add gene emojis
        previewChar.innerHTML = '';
        character.genes.forEach(gene => {
            const emoji = document.createElement('span');
            emoji.className = 'gene-emoji';
            emoji.textContent = GENE_SYMBOLS[gene];
            previewChar.appendChild(emoji);
        });
    }

    /**
     * Show breeding preview popup
     */
    showBreedingPreview() {
        const preview = document.getElementById('breedingPreview');
        if (preview) {
            preview.classList.add('show');
        }
    }

    /**
     * Hide breeding preview popup
     */
    hideBreedingPreview() {
        const preview = document.getElementById('breedingPreview');
        if (preview) {
            preview.classList.remove('show');
        }
    }

    /**
     * Update breed button visual state
     * @param {boolean} isBreeding - Whether currently breeding
     * @param {string} text - Button text to display
     * @param {boolean} disabled - Whether button should be disabled
     */
    updateBreedButton(isBreeding, text, disabled) {
        const breedBtn = document.getElementById('breedBtn');
        if (!breedBtn) return;
        
        breedBtn.disabled = disabled;
        breedBtn.textContent = text;
        
        if (isBreeding) {
            breedBtn.classList.add('breeding');
        } else {
            breedBtn.classList.remove('breeding');
        }
    }

    /**
     * Update bot status display
     * @param {boolean} active - Whether bot is active
     * @param {string} message - Status message
     */
    updateBotStatus(active, message) {
        const status = document.getElementById('botStatus');
        if (!status) return;
        
        status.textContent = message;
        
        if (active) {
            status.classList.add('active');
        } else {
            status.classList.remove('active');
        }
    }

    /**
     * Create particle effect for new discovery
     */
    createParticleEffect() {
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94', '#b4a7d6'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                particle.style.left = Math.random() * window.innerWidth + 'px';
                particle.style.top = Math.random() * window.innerHeight + 'px';

                document.body.appendChild(particle);

                const animation = particle.animate([
                    { transform: 'translateY(0px) scale(1)', opacity: 1 },
                    { transform: 'translateY(-100px) scale(0)', opacity: 0 }
                ], {
                    duration: 2000,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                });

                animation.onfinish = () => particle.remove();
            }, i * 50);
        }
    }

    /**
     * Add sunshine effect to preview character
     * @param {HTMLElement} previewChar - Preview character element
     */
    addSunshineEffect(previewChar) {
        const sunshine = document.createElement('div');
        sunshine.className = 'sunshine-effect';
        previewChar.appendChild(sunshine);
        
        return sunshine;
    }

    /**
     * Create breeding sparkles effect
     * @param {HTMLElement} container - Container element
     * @param {boolean} isFastMode - Whether in fast mode
     * @param {number} speedMultiplier - Speed multiplier for animations
     */
    createBreedingSparkles(container, isFastMode = false, speedMultiplier = 1) {
        const sparkleCount = isFastMode ? 3 : 5;
        const duration = isFastMode ? Math.floor(400 / speedMultiplier) : Math.floor(800 / speedMultiplier);
        
        for (let i = 0; i < sparkleCount; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'breeding-sparkle';
                
                const angle = (Math.PI * 2 * i) / sparkleCount;
                const radius = 60 + Math.random() * 20;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                sparkle.style.left = `${50 + (x / 150) * 100}%`;
                sparkle.style.top = `${50 + (y / 150) * 100}%`;
                sparkle.style.background = `hsl(${Math.random() * 360}, 100%, 80%)`;
                
                container.appendChild(sparkle);
                
                const animation = sparkle.animate([
                    { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                    { transform: 'scale(1) rotate(180deg)', opacity: 1, offset: 0.5 },
                    { transform: 'scale(0) rotate(360deg)', opacity: 0 }
                ], {
                    duration: duration,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                });
                
                animation.onfinish = () => sparkle.remove();
            }, i * Math.floor((isFastMode ? 25 : 50) / speedMultiplier));
        }
    }

    /**
     * Get preview character element
     * @returns {HTMLElement|null} Preview character element
     */
    getPreviewCharacterElement() {
        return document.getElementById('previewCharacter');
    }

    /**
     * Reset UI to initial state
     */
    reset() {
        // Clear any active selections
        document.querySelectorAll('.character-slot').forEach(slot => {
            slot.classList.remove('selected', 'new-discovery');
        });
        
        // Clear parent displays
        this.clearParentDisplay(document.querySelector('#parent1Display .character-sprite'));
        this.clearParentDisplay(document.querySelector('#parent2Display .character-sprite'));
        
        // Hide breeding preview
        this.hideBreedingPreview();
        
        // Reset breed button
        this.updateBreedButton(false, 'Select Two Creatures to Breed', true);
    }
}