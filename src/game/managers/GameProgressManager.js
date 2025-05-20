export class GameProgressManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Game progression parameters
        this.difficultyFactor = 1.0;
        this.baseTreeReleaseInterval = 0.8;
        this.minSpawnInterval = 0.3;
        this.difficultyIncreaseInterval = 30; // seconds
        this.difficultyIncreaseAmount = 0.1;
        this.maxDifficultyFactor = 3.0;
        
        // Timing variables
        this.lastDifficultyIncrease = 0;
        this.gameTime = 0;
    }

    update(deltaTime) {
        this.gameTime += deltaTime;
        this.updateDifficulty();
    }

    updateDifficulty() {
        if (this.gameTime - this.lastDifficultyIncrease >= this.difficultyIncreaseInterval) {
            this.increaseDifficulty();
            this.lastDifficultyIncrease = this.gameTime;
        }
    }

    increaseDifficulty() {
        if (this.difficultyFactor < this.maxDifficultyFactor) {
            this.difficultyFactor += this.difficultyIncreaseAmount;
            console.log(`Difficulty increased to: ${this.difficultyFactor.toFixed(1)}`);
        }
    }

    getTreeSpawnInterval() {
        // Decrease spawn interval as difficulty increases
        const interval = this.baseTreeReleaseInterval / this.difficultyFactor;
        return Math.max(interval, this.minSpawnInterval);
    }

    getCollectibleSpawnInterval() {
        // Keep collectible spawn rate constant
        return 1.0;
    }

    getObstacleSpeed() {
        // Increase obstacle speed with difficulty
        return 0.1 * this.difficultyFactor;
    }

    reset() {
        this.difficultyFactor = 1.0;
        this.gameTime = 0;
        this.lastDifficultyIncrease = 0;
    }

    getDifficultyFactor() {
        return this.difficultyFactor;
    }

    getGameTime() {
        return this.gameTime;
    }
} 