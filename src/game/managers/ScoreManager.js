export class ScoreManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.coinValue = 10;
        this.scoreMultiplier = 1;
        
        // UI elements
        this.scoreDisplay = null;
        this.highScoreDisplay = null;
        this.coinsDisplay = null;
        
        this.initializeUI();
    }

    initializeUI() {
        // Create score container
        const scoreContainer = document.createElement('div');
        scoreContainer.className = 'game-ui score-container';
        scoreContainer.style.position = 'absolute';
        scoreContainer.style.top = '20px';
        scoreContainer.style.left = '20px';
        scoreContainer.style.display = 'flex';
        scoreContainer.style.flexDirection = 'column';
        scoreContainer.style.gap = '5px';
        document.body.appendChild(scoreContainer);

        // Create score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'game-ui score';
        this.scoreDisplay.style.fontFamily = 'Arial, sans-serif';
        this.scoreDisplay.style.fontSize = '24px';
        this.scoreDisplay.style.color = 'white';
        this.scoreDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        scoreContainer.appendChild(this.scoreDisplay);

        // Create high score display
        this.highScoreDisplay = document.createElement('div');
        this.highScoreDisplay.className = 'game-ui high-score';
        this.highScoreDisplay.style.fontFamily = 'Arial, sans-serif';
        this.highScoreDisplay.style.fontSize = '16px';
        this.highScoreDisplay.style.color = '#FFD700';
        this.highScoreDisplay.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
        scoreContainer.appendChild(this.highScoreDisplay);

        // Create coins display
        this.coinsDisplay = document.createElement('div');
        this.coinsDisplay.className = 'game-ui coins';
        this.coinsDisplay.style.fontFamily = 'Arial, sans-serif';
        this.coinsDisplay.style.fontSize = '20px';
        this.coinsDisplay.style.color = '#FFD700';
        this.coinsDisplay.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
        scoreContainer.appendChild(this.coinsDisplay);

        this.updateDisplays();
    }

    updateDisplays() {
        this.scoreDisplay.textContent = `Score: ${this.score}`;
        this.highScoreDisplay.textContent = `High Score: ${this.highScore}`;
        this.coinsDisplay.textContent = `Coins: ${Math.floor(this.score / this.coinValue)}`;
    }

    addScore(points) {
        const multipliedPoints = points * this.scoreMultiplier;
        this.score += multipliedPoints;
        this.updateHighScore();
        this.updateDisplays();
        return multipliedPoints;
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
    }

    loadHighScore() {
        const savedHighScore = localStorage.getItem('highScore');
        return savedHighScore ? parseInt(savedHighScore) : 0;
    }

    saveHighScore() {
        localStorage.setItem('highScore', this.highScore.toString());
    }

    setScoreMultiplier(multiplier) {
        this.scoreMultiplier = multiplier;
    }

    reset() {
        this.score = 0;
        this.scoreMultiplier = 1;
        this.updateDisplays();
    }

    getScore() {
        return this.score;
    }

    getHighScore() {
        return this.highScore;
    }

    getCoins() {
        return Math.floor(this.score / this.coinValue);
    }
} 