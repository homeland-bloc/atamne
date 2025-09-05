// Game Configuration and Constants
// All game data, colors, symbols, and rules are defined here

// Core gene types
export const GENES = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];

// Primary gene colors
export const GENE_COLORS = {
    'Red': '#ef5350',
    'Orange': '#ff8a65', 
    'Yellow': '#ffeb3b',
    'Green': '#66bb6a',
    'Blue': '#42a5f5',
    'Purple': '#ab47bc'
};

// Lighter versions for same-gene gradients
export const GENE_LIGHT_COLORS = {
    'Red': '#ffcdd2',
    'Orange': '#ffccbc', 
    'Yellow': '#fff9c4',
    'Green': '#c8e6c9',
    'Blue': '#bbdefb',
    'Purple': '#e1bee7'
};

// Darker versions for same-gene gradients
export const GENE_DARK_COLORS = {
    'Red': '#c62828',
    'Orange': '#e65100', 
    'Yellow': '#f57f17',
    'Green': '#2e7d32',
    'Blue': '#1565c0',
    'Purple': '#6a1b9a'
};

// Gene symbols/emojis
export const GENE_SYMBOLS = {
    'Red': '🥀',
    'Orange': '🔥',
    'Yellow': '🌤️',
    'Green': '🍃',
    'Blue': '🌊',
    'Purple': '🔮'
};

// Type effectiveness system: Red→Orange→Yellow→Green→Blue→Purple→Red
// Values: 1.5 = very effective (+50%), 1.25 = effective (+25%), 
//         1.0 = normal, 0.75 = not very effective (-25%), 0.5 = not effective (-50%)
export const TYPE_EFFECTIVENESS = {
    'Red': { 'Orange': 1.5, 'Yellow': 1.25, 'Purple': 0.5, 'Blue': 0.75 },
    'Orange': { 'Yellow': 1.5, 'Green': 1.25, 'Red': 0.5, 'Purple': 0.75 },
    'Yellow': { 'Green': 1.5, 'Blue': 1.25, 'Orange': 0.5, 'Red': 0.75 },
    'Green': { 'Blue': 1.5, 'Purple': 1.25, 'Yellow': 0.5, 'Orange': 0.75 },
    'Blue': { 'Purple': 1.5, 'Red': 1.25, 'Green': 0.5, 'Yellow': 0.75 },
    'Purple': { 'Red': 1.5, 'Orange': 1.25, 'Blue': 0.5, 'Green': 0.75 }
};

// Character stat distributions
// Budget formula: (HP÷3) + Attack + Speed = 200 for all characters
// 40 minimum rule applied: no stat below 40
export const CHARACTER_STATS = {
    // Single genes (HP tripled, but (HP÷3) + ATK + SPD = 200)
    'Red': [120, 120, 40],        // (120÷3) + 120 + 40 = 200
    'Orange': [240, 80, 40],      // (240÷3) + 80 + 40 = 200  
    'Yellow': [360, 40, 40],      // (360÷3) + 40 + 40 = 200
    'Green': [240, 40, 80],       // (240÷3) + 40 + 80 = 200
    'Blue': [120, 40, 120],       // (120÷3) + 40 + 120 = 200
    'Purple': [120, 80, 80],      // (120÷3) + 80 + 80 = 200
    
    // Same-gene doubles (HP tripled, but (HP÷3) + ATK + SPD = 200)
    'Red-Red': [144, 104, 48],       // (144÷3) + 104 + 48 = 200
    'Orange-Orange': [216, 72, 56], // (216÷3) + 72 + 56 = 200
    'Yellow-Yellow': [312, 48, 48], // (312÷3) + 48 + 48 = 200
    'Green-Green': [216, 56, 72],   // (216÷3) + 56 + 72 = 200
    'Blue-Blue': [144, 48, 104],    // (144÷3) + 48 + 104 = 200
    'Purple-Purple': [168, 72, 72], // (168÷3) + 72 + 72 = 200
    
    // Different-gene doubles (HP tripled, 40 minimum rule applied)
    'Red-Orange': [216, 88, 40],    // (216÷3) + 88 + 40 = 200
    'Red-Yellow': [300, 60, 40],    // (300÷3) + 60 + 40 = 200
    'Red-Green': [216, 56, 72],     // (216÷3) + 56 + 72 = 200
    'Red-Blue': [120, 60, 100],     // (120÷3) + 60 + 100 = 200
    'Red-Purple': [120, 88, 72],    // (120÷3) + 88 + 72 = 200

    'Orange-Red': [156, 108, 40],   // (156÷3) + 108 + 40 = 200
    'Orange-Yellow': [324, 52, 40], // (324÷3) + 52 + 40 = 200
    'Orange-Green': [240, 48, 72],  // (240÷3) + 48 + 72 = 200
    'Orange-Blue': [156, 52, 96],   // (156÷3) + 52 + 96 = 200
    'Orange-Purple': [144, 80, 72], // (144÷3) + 80 + 72 = 200

    'Yellow-Red': [180, 100, 40],   // (180÷3) + 100 + 40 = 200
    'Yellow-Orange': [264, 72, 40], // (264÷3) + 72 + 40 = 200
    'Yellow-Green': [264, 40, 72],  // (264÷3) + 40 + 72 = 200
    'Yellow-Blue': [180, 40, 100],  // (180÷3) + 40 + 100 = 200
    'Yellow-Purple': [168, 72, 72], // (168÷3) + 72 + 72 = 200
    
    'Green-Red': [156, 96, 52],     // (156÷3) + 96 + 52 = 200
    'Green-Orange': [240, 72, 48],  // (240÷3) + 72 + 48 = 200
    'Green-Yellow': [324, 40, 52],  // (324÷3) + 40 + 52 = 200
    'Green-Blue': [156, 40, 108],   // (156÷3) + 40 + 108 = 200
    'Green-Purple': [144, 72, 80],  // (144÷3) + 72 + 80 = 200
    
    'Blue-Red': [120, 100, 60],     // (120÷3) + 100 + 60 = 200
    'Blue-Orange': [216, 72, 56],   // (216÷3) + 72 + 56 = 200
    'Blue-Yellow': [300, 40, 60],   // (300÷3) + 40 + 60 = 200
    'Blue-Green': [216, 40, 88],    // (216÷3) + 40 + 88 = 200
    'Blue-Purple': [120, 72, 88],   // (120÷3) + 72 + 88 = 200
    
    'Purple-Red': [120, 108, 52],   // (120÷3) + 108 + 52 = 200
    'Purple-Orange': [216, 80, 48], // (216÷3) + 80 + 48 = 200
    'Purple-Yellow': [288, 52, 52], // (288÷3) + 52 + 52 = 200
    'Purple-Green': [216, 48, 80],  // (216÷3) + 48 + 80 = 200
    'Purple-Blue': [120, 52, 108]   // (120÷3) + 52 + 108 = 200
};

// Battle system constants
export const BATTLE_CONFIG = {
    ACTION_THRESHOLD: 1000,  // Action bar threshold for taking turns
    TEAM_SIZE: 3,           // Number of characters per team
    SPLASH_DAMAGE_MULTIPLIER: 0.5  // Splash attacks do half damage
};

// AI Difficulty settings
export const AI_DIFFICULTY = {
    EASY: {
        name: 'Easy',
        smartMoveChance: 0,
        description: 'Random moves'
    },
    NORMAL: {
        name: 'Normal', 
        smartMoveChance: 0.5,
        description: 'Semi-smart'
    },
    HARD: {
        name: 'Hard',
        smartMoveChance: 0.8,
        description: 'Strategic'
    },
    EXTREME: {
        name: 'Extreme',
        smartMoveChance: 1.0,
        description: 'Perfect play'
    }
};

// Animation and timing constants
export const ANIMATION_CONFIG = {
    BREEDING_ANIMATION_STEPS: 20,
    BREEDING_ANIMATION_SPEED: 150,
    DAMAGE_ANIMATION_DURATION: 2500,
    BATTLE_SHAKE_DURATION: 600,
    AI_THINK_TIME: 2000,
    TURN_TRANSITION_TIME: 2500
};