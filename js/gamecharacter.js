// GameCharacter Class - Represents individual creatures in the game
import { GENE_SYMBOLS, TYPE_EFFECTIVENESS, CHARACTER_STATS } from './config.js';

export class GameCharacter {
    constructor(id, genes, unlocked = false) {
        this.id = id;
        this.genes = genes;
        this.unlocked = unlocked;
        this.symbol = this.generateSymbol();
        this.stats = this.generateStats();
        this.isPlayer = null; // Set during battle setup
    }

    /**
     * Generate the visual symbol/emoji representation for this character
     * @returns {string} The emoji symbol(s) for this character
     */
    generateSymbol() {
        if (this.genes.length === 1) {
            return GENE_SYMBOLS[this.genes[0]];
        } else {
            return `${GENE_SYMBOLS[this.genes[0]]}${GENE_SYMBOLS[this.genes[1]]}`;
        }
    }

    /**
     * Get the stat distribution for this character from the config
     * @returns {Array} [hp, attack, speed] array
     */
    getStatDistribution() {
        return CHARACTER_STATS[this.id] || [80, 80, 80]; // Fallback for any missing characters
    }

    /**
     * Generate the battle stats for this character
     * @returns {Object} Stats object with hp, maxHp, attack, speed
     */
    generateStats() {
        const [hp, attack, speed] = this.getStatDistribution();
        
        return {
            hp: hp,
            maxHp: hp,
            attack: attack,
            speed: speed
        };
    }

    /**
     * Get the available attack options for this character
     * @returns {Array} Array of attack objects with gene and type properties
     */
    getAttackGenes() {
        if (this.genes.length === 1) {
            // Single gene characters get their gene attack + neutral attack
            return [
                { gene: this.genes[0], type: 'single' },
                { gene: 'Neutral', type: 'single' }
            ];
        } else if (this.genes[0] === this.genes[1]) {
            // Same gene doubles: first attack is single, second is splash
            return [
                { gene: this.genes[0], type: 'single' },
                { gene: this.genes[0], type: 'splash' }
            ];
        } else {
            // Different genes: both are single target attacks
            return [
                { gene: this.genes[0], type: 'single' },
                { gene: this.genes[1], type: 'single' }
            ];
        }
    }

    /**
     * Calculate type effectiveness of an attack against this character
     * @param {string} attackGene - The gene type of the incoming attack
     * @param {GameCharacter} defendingCharacter - The character being attacked (for future use)
     * @returns {number} Effectiveness multiplier (0.5, 0.75, 1.0, 1.25, or 1.5)
     */
    getEffectiveness(attackGene, defendingCharacter) {
        if (attackGene === 'Neutral') return 1.0;
        
        // Use only the FIRST gene for defense calculations
        const defendingGene = defendingCharacter.genes[0];
        
        return TYPE_EFFECTIVENESS[attackGene]?.[defendingGene] || 1.0;
    }

    /**
     * Calculate damage this character would deal with a specific attack
     * @param {string} attackGene - The gene type of the attack
     * @param {GameCharacter} defendingCharacter - The target character
     * @returns {number} Final damage amount
     */
    calculateDamage(attackGene, defendingCharacter) {
        const baseDamage = this.stats.attack;
        const effectiveness = this.getEffectiveness(attackGene, defendingCharacter);
        
        // Since all stats are divisible by 4, and effectiveness is 0.5, 0.75, 1.0, 1.25, or 1.5
        // The result will always be a whole number
        return baseDamage * effectiveness;
    }

    /**
     * Take damage and update HP
     * @param {number} damage - Amount of damage to take
     * @returns {boolean} True if character was defeated (HP reached 0)
     */
    takeDamage(damage) {
        this.stats.hp = Math.max(0, this.stats.hp - damage);
        return this.stats.hp === 0;
    }

    /**
     * Heal this character
     * @param {number} amount - Amount to heal
     * @returns {number} Actual amount healed (capped at maxHp)
     */
    heal(amount) {
        const oldHp = this.stats.hp;
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
        return this.stats.hp - oldHp;
    }

    /**
     * Reset character to full health (for new battles)
     */
    resetForBattle() {
        this.stats.hp = this.stats.maxHp;
    }

    /**
     * Check if this character is alive
     * @returns {boolean} True if HP > 0
     */
    isAlive() {
        return this.stats.hp > 0;
    }

    /**
     * Check if this character is defeated
     * @returns {boolean} True if HP = 0
     */
    isDefeated() {
        return this.stats.hp === 0;
    }

    /**
     * Get current health percentage
     * @returns {number} Health percentage (0-100)
     */
    getHealthPercentage() {
        return (this.stats.hp / this.stats.maxHp) * 100;
    }

    /**
     * Create a deep copy of this character (useful for battle setup)
     * @returns {GameCharacter} New character instance with same properties
     */
    clone() {
        const cloned = new GameCharacter(this.id, [...this.genes], this.unlocked);
        cloned.isPlayer = this.isPlayer;
        return cloned;
    }

    /**
     * Get a display name for this character (handles duplicates in battle)
     * @returns {string} Display-friendly name
     */
    getDisplayName() {
        // Remove any battle-specific suffixes for display
        return this.id.replace(/-E\d+$/, '');
    }

    /**
     * Get character rarity based on gene complexity
     * @returns {string} Rarity level: 'common', 'uncommon', 'rare'
     */
    getRarity() {
        if (this.genes.length === 1) {
            return 'common';
        } else if (this.genes[0] === this.genes[1]) {
            return 'uncommon';
        } else {
            return 'rare';
        }
    }

    /**
     * Get a hash code for this character (used for consistent behavior)
     * @param {string} str - String to hash
     * @returns {number} Hash code
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    /**
     * Generate a unique identifier for battle systems
     * @returns {string} Unique battle ID
     */
    getBattleId() {
        return `${this.id}-${this.isPlayer ? 'P' : 'E'}`;
    }

    /**
     * Get stat total for comparison purposes
     * @returns {number} Sum of all base stats
     */
    getStatTotal() {
        return this.stats.maxHp + this.stats.attack + this.stats.speed;
    }

    /**
     * Get a text description of this character's abilities
     * @returns {string} Description of character's combat abilities
     */
    getDescription() {
        const attacks = this.getAttackGenes();
        const attackDescriptions = attacks.map(attack => {
            if (attack.type === 'splash') {
                return `${attack.gene} Splash (hits all enemies)`;
            } else if (attack.gene === 'Neutral') {
                return `Neutral Attack (no type bonus)`;
            } else {
                return `${attack.gene} Attack`;
            }
        });
        
        return `Attacks: ${attackDescriptions.join(', ')}`;
    }

    /**
     * Convert character to JSON for saving/loading
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            genes: this.genes,
            unlocked: this.unlocked,
            stats: this.stats
        };
    }

    /**
     * Create character from JSON data
     * @param {Object} data - JSON data
     * @returns {GameCharacter} New character instance
     */
    static fromJSON(data) {
        const character = new GameCharacter(data.id, data.genes, data.unlocked);
        if (data.stats) {
            character.stats = { ...data.stats };
        }
        return character;
    }
}