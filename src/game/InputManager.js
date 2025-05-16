import { GameStates } from './GameState';

export class InputManager {
    constructor(gameState, gameEngine) {
        this.gameState = gameState;
        this.gameEngine = gameEngine;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleKeyDown(event) {
        // Handle key presses
        switch(event.keyCode) {
            case 37: // Left arrow
                this.gameEngine.moveLeft();
                break;
            case 39: // Right arrow
                this.gameEngine.moveRight();
                break;
            case 38: // Up arrow (jump)
                if (this.gameState.state === GameStates.PLAYING) {
                    this.gameEngine.jump();
                } else if (this.gameState.state === GameStates.GAME_OVER) {
                    // Restart game when pressing up at game over screen
                    this.gameState.startGame();
                }
                break;
            case 32: // Space (alternative jump)
                if (this.gameState.state === GameStates.PLAYING) {
                    this.gameEngine.jump();
                } else if (this.gameState.state === GameStates.GAME_OVER) {
                    // Restart game when pressing space at game over screen
                    this.gameState.startGame();
                }
                break;
            case 80: // P key (pause)
                if (this.gameState.state === GameStates.PLAYING) {
                    this.gameState.pauseGame();
                } else if (this.gameState.state === GameStates.PAUSED) {
                    this.gameState.resumeGame();
                }
                break;
            case 27: // Escape (pause/resume)
                if (this.gameState.state === GameStates.PLAYING) {
                    this.gameState.pauseGame();
                } else if (this.gameState.state === GameStates.PAUSED) {
                    this.gameState.resumeGame();
                }
                break;
        }
    }

    // Touch handlers for mobile support
    handleTouchStart(event) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        
        if (this.gameState.state === GameStates.GAME_OVER) {
            // Tap anywhere to restart when game over
            this.gameState.startGame();
        }
    }

    handleTouchMove(event) {
        if (this.gameState.state !== GameStates.PLAYING) return;
        if (!this.touchStartX) return;
        
        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;
        const diffX = touchX - this.touchStartX;
        const diffY = this.touchStartY - touchY; // Inverted for y-axis
        
        // Swipe left/right
        if (Math.abs(diffX) > 30) {
            if (diffX > 0) {
                this.gameEngine.moveRight();
            } else {
                this.gameEngine.moveLeft();
            }
            this.touchStartX = touchX;
        }
        
        // Swipe up (jump)
        if (diffY > 50) {
            this.gameEngine.jump();
            this.touchStartY = touchY;
        }
    }

    handleTouchEnd() {
        this.touchStartX = null;
        this.touchStartY = null;
    }
} 