import { GameStates } from './GameState';

export class UIManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.gameState.addObserver(this);
        this.initializeUI();
    }

    initializeUI() {
        // Remove any existing UI elements
        document.querySelectorAll('.game-ui').forEach(el => el.remove());
        
        // Score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'game-ui game-score';
        this.scoreDisplay.style.position = 'absolute';
        this.scoreDisplay.style.top = '20px';
        this.scoreDisplay.style.left = '20px';
        this.scoreDisplay.style.color = '#ffffff';
        this.scoreDisplay.style.fontSize = '24px';
        this.scoreDisplay.style.fontFamily = 'Arial, sans-serif';
        this.scoreDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        document.body.appendChild(this.scoreDisplay);

        // High score display
        this.highScoreDisplay = document.createElement('div');
        this.highScoreDisplay.className = 'game-ui game-score';
        this.highScoreDisplay.style.position = 'absolute';
        this.highScoreDisplay.style.top = '50px';
        this.highScoreDisplay.style.left = '20px';
        this.highScoreDisplay.style.color = '#ffff00';
        this.highScoreDisplay.style.fontSize = '18px';
        this.highScoreDisplay.style.fontFamily = 'Arial, sans-serif';
        this.highScoreDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        document.body.appendChild(this.highScoreDisplay);

        // Start screen
        this.startScreen = document.createElement('div');
        this.startScreen.className = 'game-ui game-screen';
        this.startScreen.style.position = 'absolute';
        this.startScreen.style.top = '50%';
        this.startScreen.style.left = '50%';
        this.startScreen.style.transform = 'translate(-50%, -50%)';
        this.startScreen.style.textAlign = 'center';
        this.startScreen.style.color = '#ffffff';
        this.startScreen.style.fontSize = '24px';
        this.startScreen.style.fontFamily = 'Arial, sans-serif';
        this.startScreen.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        this.startScreen.style.zIndex = '1000';
        this.startScreen.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px;">3D Runner</h1>
            <p>Press ↑ to Start</p>
            <p>Use ← → to change lanes</p>
            <p>Press ↑ to jump over obstacles</p>
        `;
        document.body.appendChild(this.startScreen);

        // Game over screen
        this.gameOverScreen = document.createElement('div');
        this.gameOverScreen.className = 'game-ui game-over';
        this.gameOverScreen.style.position = 'absolute';
        this.gameOverScreen.style.top = '50%';
        this.gameOverScreen.style.left = '50%';
        this.gameOverScreen.style.transform = 'translate(-50%, -50%)';
        this.gameOverScreen.style.textAlign = 'center';
        this.gameOverScreen.style.color = '#ffffff';
        this.gameOverScreen.style.fontSize = '24px';
        this.gameOverScreen.style.fontFamily = 'Arial, sans-serif';
        this.gameOverScreen.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        this.gameOverScreen.style.display = 'none';
        this.gameOverScreen.style.zIndex = '1000';
        document.body.appendChild(this.gameOverScreen);

        this.updateUI();
    }

    updateUI() {
        // Update score displays
        this.scoreDisplay.textContent = `Score: ${Math.floor(this.gameState.score)}`;
        this.highScoreDisplay.textContent = `High Score: ${Math.floor(this.gameState.highScore)}`;

        switch (this.gameState.state) {
            case GameStates.MENU:
                this.startScreen.style.display = 'block';
                this.gameOverScreen.style.display = 'none';
                break;

            case GameStates.PLAYING:
                this.startScreen.style.display = 'none';
                this.gameOverScreen.style.display = 'none';
                break;

            case GameStates.GAME_OVER:
                this.startScreen.style.display = 'none';
                this.gameOverScreen.style.display = 'block';
                this.gameOverScreen.innerHTML = `
                    <h1 style="font-size: 48px; margin-bottom: 20px;">Game Over!</h1>
                    <p>Score: ${Math.floor(this.gameState.score)}</p>
                    <p>High Score: ${Math.floor(this.gameState.highScore)}</p>
                    <p>Press ↑ to Play Again</p>
                `;
                break;

            case GameStates.PAUSED:
                // Add pause screen if needed
                break;
        }
    }

    onGameStateChanged() {
        this.updateUI();
    }
} 