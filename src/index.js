import * as THREE from 'three';
import { GameState } from './game/GameState';
import { UIManager } from './game/UIManager';
import { InputManager } from './game/InputManager';
import { GameEngine } from './game/GameEngine';

class Game {
	constructor() {
		// Ensure DOM is loaded
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => this.init());
		} else {
			this.init();
		}
	}

	init() {
		try {
			// Initialize game components
			this.gameState = new GameState();
			this.gameEngine = new GameEngine(this.gameState);
			this.uiManager = new UIManager(this.gameState);
			this.inputManager = new InputManager(this.gameState, this.gameEngine);
			
			// Start the game
			this.gameState.startGame();
			
			// Start the game loop
			this.update();

			console.log('Game initialized successfully');
		} catch (error) {
			console.error('Error initializing game:', error);
		}
	}

	update() {
		try {
			// Update game logic
			this.gameEngine.update();
			
			// Request next frame
			requestAnimationFrame(() => this.update());
		} catch (error) {
			console.error('Error in game loop:', error);
		}
	}
}

// Create game instance when window loads
window.addEventListener('load', () => {
	new Game();
});