import { EventBus } from './eventBus.js';
import { GameState } from './state.js';
import { GameEngine } from './engine.js';
import { Renderer } from './renderer.js';
import { Camera } from './camera.js';
import { InputManager } from './input.js';
import { Timer } from './timer.js';
import { MapManager } from './map/map.js';
import { UIManager } from './ui/ui.js';
import { SaveManager } from './save/save.js';

class Game {
    constructor() {
        console.log('🎮 Qalamrostan Initializing...');
        
        // Core systems
        this.eventBus = new EventBus();
        this.state = new GameState();
        this.engine = new GameEngine();
        this.renderer = new Renderer();
        this.camera = new Camera();
        this.input = new InputManager();
        this.timer = new Timer();
        
        // Game systems
        this.map = new MapManager();
        this.ui = new UIManager();
        this.save = new SaveManager();
        
        // Initialize all systems
        this.init();
    }
    
    async init() {
        try {
            // Setup canvas
            const canvas = document.getElementById('gameCanvas');
            this.renderer.init(canvas);
            this.camera.init(canvas);
            
            // Load game data
            await this.loadGameData();
            
            // Initialize systems
            this.map.init();
            this.ui.init();
            this.timer.init();
            
            // Setup event listeners
            this.setupEvents();
            
            // Start game loop
            this.engine.start(this.update.bind(this), this.render.bind(this));
            
            // Show main menu
            this.ui.showMenu('main');
            
            console.log('✅ Game initialized successfully!');
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
            this.ui.showError('Failed to initialize game. Please refresh.');
        }
    }
    
    async loadGameData() {
        try {
            // Load countries data
            const countriesResponse = await fetch('data/countries.json');
            this.state.countriesData = await countriesResponse.json();
            
            // Load colors
            const colorsResponse = await fetch('data/colors.json');
            this.state.colorsData = await colorsResponse.json();
            
            // Load settings
            const settingsResponse = await fetch('data/settings.json');
            this.state.settings = await settingsResponse.json();
            
            // Load units
            const unitsResponse = await fetch('data/units.json');
            this.state.unitsData = await unitsResponse.json();
            
            console.log('📦 Game data loaded');
        } catch (error) {
            console.warn('Using default data:', error);
            // Use default data
            this.state.countriesData = this.getDefaultCountries();
            this.state.colorsData = this.getDefaultColors();
            this.state.settings = this.getDefaultSettings();
            this.state.unitsData = this.getDefaultUnits();
        }
    }
    
    setupEvents() {
        // Game events
        this.eventBus.on('game:start', () => {
            this.ui.hideMenu();
            this.startGame();
        });
        
        this.eventBus.on('game:save', () => {
            this.save.saveGame(this.state);
        });
        
        this.eventBus.on('game:load', (saveData) => {
            this.loadGame(saveData);
        });
        
        // Map events
        this.eventBus.on('province:selected', (province) => {
            this.ui.updateSidebar(province);
        });
        
        // Notification events
        this.eventBus.on('notification:add', (notification) => {
            this.ui.addNotification(notification);
        });
    }
    
    startGame() {
        // Generate or load map
        if (this.state.settings.generateRandomMap) {
            this.map.generateRandom();
        } else {
            this.map.loadMap(this.state.settings.mapFile || 'maps/world.json');
        }
        
        // Initialize players
        this.state.initializePlayers();
        
        // Start game timer
        this.timer.start();
        
        console.log('🚀 Game started!');
    }
    
    loadGame(saveData) {
        // TODO: Implement game loading
        console.log('📂 Loading game...');
    }
    
    // Default data for fallback
    getDefaultCountries() {
        return {
            countries: [
                { id: 1, name: 'ایران', capital: 'تهران' },
                { id: 2, name: 'عثمانی', capital: 'قسطنطنیه' },
                { id: 3, name: 'روسیه', capital: 'مسکو' },
                { id: 4, name: 'مغولستان', capital: 'قراقروم' }
            ]
        };
    }
    
    getDefaultColors() {
        return {
            colors: [
                '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
                '#6c5ce7', '#00b894', '#e17055', '#0984e3'
            ]
        };
    }
    
    getDefaultSettings() {
        return {
            generateRandomMap: true,
            mapSize: 100,
            numPlayers: 4,
            difficulty: 'normal',
            speed: 'normal'
        };
    }
    
    getDefaultUnits() {
        return {
            units: [
                { id: 'infantry', name: 'پیاده', cost: 10, attack: 5, defense: 3, speed: 2 },
                { id: 'cavalry', name: 'سواره', cost: 20, attack: 8, defense: 2, speed: 4 },
                { id: 'archer', name: 'کماندار', cost: 15, attack: 6, defense: 1, speed: 3 }
            ]
        };
    }
    
    update(deltaTime) {
        // Update game state
        this.timer.update(deltaTime);
        this.map.update(deltaTime);
        this.input.update(deltaTime);
        
        // Update AI
        if (this.state.aiEnabled) {
            this.updateAI(deltaTime);
        }
    }
    
    render() {
        this.renderer.render();
    }
    
    updateAI(deltaTime) {
        // TODO: AI logic
    }
}

// Start the game
const game = new Game();
window.game = game; // For debugging
