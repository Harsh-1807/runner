import { GameStates } from './GameState';

export class InputManager {
    constructor(gameState, gameEngine) {
        this.gameState = gameState;
        this.gameEngine = gameEngine;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    }

    handleKeyDown(event) {
        if (this.gameState.state === GameStates.PLAYING) {
            switch(event.code) {
                case 'ArrowLeft':
                    event.preventDefault();
                    this.gameEngine.moveLeft();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    this.gameEngine.moveRight();
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    this.gameEngine.jump();
                    break;
            }
        } else if (this.gameState.state === GameStates.GAME_OVER) {
            if (event.code === 'ArrowUp') {
                event.preventDefault();
                this.gameState.startGame();
            }
        } else if (this.gameState.state === GameStates.MENU) {
            if (event.code === 'ArrowUp') {
                event.preventDefault();
                this.gameState.startGame();
            }
        }
    }
} 