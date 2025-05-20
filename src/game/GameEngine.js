import * as THREE from 'three';
import { GameStates } from './GameState';
import { SceneManager } from './components/SceneManager';
import { WorldManager } from './components/WorldManager';
import { Hero } from './components/Hero';
import { CollectibleManager } from './components/CollectibleManager';
import { AudioManager } from './audio/AudioManager';
import { PowerUpManager } from './managers/PowerUpManager';
import { ScoreManager } from './managers/ScoreManager';
import { CollisionManager } from './managers/CollisionManager';
import { GameProgressManager } from './managers/GameProgressManager';

export class GameEngine {
    constructor(gameState) {
        this.gameState = gameState;
        this.gameState.addObserver(this);
        this.setupGameVariables();
        this.initializeGame();
        this.setupScoreDisplay();
        this.setupAudio();
    }

    setupAudio() {
        this.audioManager = new AudioManager();
    }

    setupGameVariables() {
        // Game mechanics variables
        this.rollingSpeed = 0.006;
        this.worldRadius = 26;
        this.heroRadius = 0.2;
        
        // Lane positions
        this.leftLane = -1;
        this.rightLane = 1;
        this.middleLane = 0;
        this.currentLane = this.middleLane;

        // Tree spawning
        this.treeReleaseInterval = 0.8;
        this.lastTreeSpawn = 0;
        this.difficultyFactor = 1.0;
        this.nextTreeSpawn = this.treeReleaseInterval;
        this.minSpawnInterval = 0.3;
        
        // Collectible spawning
        this.collectibleReleaseInterval = 1.0;
        this.nextCollectibleSpawn = this.collectibleReleaseInterval;
        
        // Score tracking
        this.score = 0;
        this.scoreMultiplier = 1;
        this.coinValue = 10;
        
        // Lives and power-ups
        this.lives = 3;
        this.maxLives = 5;
        this.hasShield = false;
        this.shieldTimeRemaining = 0;
        this.hasMagnet = false;
        this.magnetTimeRemaining = 0;
        this.hasDoublePoints = false;
        this.doublePointsTimeRemaining = 0;
        
        // Power-up durations (in seconds)
        this.shieldDuration = 10;
        this.magnetDuration = 15;
        this.doublePointsDuration = 20;

        // Initialize clock
        this.clock = new THREE.Clock();
        this.clock.start();
    }

    initializeGame() {
        // Initialize scene manager
        this.sceneManager = new SceneManager();
        
        // Setup camera and renderer
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera = this.sceneManager.setupCamera(width, height);
        this.renderer = this.sceneManager.setupRenderer(width, height);
        
        // Add renderer to DOM
        const container = document.getElementById('TutContainer');
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            console.error('Container element not found!');
            return;
        }

        // Setup lights
        this.sceneManager.setupLights();
        
        // Add atmosphere particles
        this.environmentParticles = this.sceneManager.createEnvironmentParticles();

        // Initialize world
        this.worldManager = new WorldManager(this.sceneManager.scene, this.worldRadius);

        // Initialize hero
        this.hero = new Hero(this.sceneManager.scene, this.heroRadius);
        this.hero.setLane(this.currentLane);
        this.hero.rollingSpeed = this.rollingSpeed * this.worldRadius / this.heroRadius / 5;
        
        // Initialize collectibles
        this.collectibleManager = new CollectibleManager(this.sceneManager.scene, this.worldRadius);

        // Initialize managers
        this.audioManager = new AudioManager();
        this.powerUpManager = new PowerUpManager(this.gameState);
        this.scoreManager = new ScoreManager(this.gameState);
        this.gameProgressManager = new GameProgressManager(this.gameState);
        this.collisionManager = new CollisionManager(
            this.gameState,
            this.hero,
            this.worldManager,
            this.collectibleManager
        );

        // Add background trees
        this.addBackgroundTrees();

        // Setup window resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Create power-up indicators
        this.createPowerupIndicators();
    }
    
    createPowerupIndicators() {
        // Create container for power-up indicators
        this.powerupContainer = document.createElement('div');
        this.powerupContainer.className = 'game-ui powerup-container';
        this.powerupContainer.style.position = 'absolute';
        this.powerupContainer.style.bottom = '20px';
        this.powerupContainer.style.right = '20px';
        this.powerupContainer.style.display = 'flex';
        this.powerupContainer.style.flexDirection = 'column';
        this.powerupContainer.style.alignItems = 'flex-end';
        this.powerupContainer.style.gap = '10px';
        document.body.appendChild(this.powerupContainer);
        
        // Create shield indicator
        this.shieldIndicator = this.createPowerupIndicator('Shield', '#0088FF');
        
        // Create magnet indicator
        this.magnetIndicator = this.createPowerupIndicator('Magnet', '#FF0000');
        
        // Create double points indicator
        this.doublePointsIndicator = this.createPowerupIndicator('2x Points', '#FFFF00');
        
        // Create lives indicator
        this.livesContainer = document.createElement('div');
        this.livesContainer.className = 'game-ui lives-container';
        this.livesContainer.style.position = 'absolute';
        this.livesContainer.style.top = '20px';
        this.livesContainer.style.right = '20px';
        this.livesContainer.style.display = 'flex';
        this.livesContainer.style.gap = '5px';
        document.body.appendChild(this.livesContainer);
        
        this.updateLivesDisplay();
    }
    
    createPowerupIndicator(name, color) {
        const indicator = document.createElement('div');
        indicator.className = 'game-ui powerup-indicator';
        indicator.style.backgroundColor = color;
        indicator.style.padding = '5px 10px';
        indicator.style.borderRadius = '5px';
        indicator.style.color = 'white';
        indicator.style.fontFamily = 'Arial, sans-serif';
        indicator.style.fontWeight = 'bold';
        indicator.style.fontSize = '14px';
        indicator.style.display = 'none';
        indicator.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        indicator.style.minWidth = '120px';
        indicator.style.textAlign = 'center';
        
        const labelElement = document.createElement('div');
        labelElement.textContent = name;
        indicator.appendChild(labelElement);
        
        const timerElement = document.createElement('div');
        timerElement.style.fontSize = '12px';
        timerElement.textContent = '0.0s';
        indicator.appendChild(timerElement);
        
        this.powerupContainer.appendChild(indicator);
        
        return {
            element: indicator,
            timerElement: timerElement
        };
    }
    
    updateLivesDisplay() {
        // Clear existing hearts
        this.livesContainer.innerHTML = '';
        
        // Add heart icons for each life
        for (let i = 0; i < this.lives; i++) {
            const heart = document.createElement('div');
            heart.className = 'game-ui heart';
            heart.style.width = '25px';
            heart.style.height = '25px';
            heart.style.backgroundColor = '#FF4444';
            heart.style.clipPath = 'path("M12.5,0 C5.6,0 0,5.6 0,12.5 C0,25 12.5,25 12.5,25 C12.5,25 25,25 25,12.5 C25,5.6 19.4,0 12.5,0 Z")';
            heart.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
            this.livesContainer.appendChild(heart);
        }
    }

    setupScoreDisplay() {
        // Remove any existing score displays first
        document.querySelectorAll('.game-score').forEach(el => el.remove());

        // Create score display
        this.scoreElement = document.createElement('div');
        this.scoreElement.className = 'game-ui game-score';
        this.scoreElement.style.position = 'absolute';
        this.scoreElement.style.top = '20px';
        this.scoreElement.style.left = '20px';
        this.scoreElement.style.color = '#ffffff';
        this.scoreElement.style.fontSize = '24px';
        this.scoreElement.style.fontFamily = 'Arial, sans-serif';
        this.scoreElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        this.scoreElement.style.zIndex = '1000';
        document.body.appendChild(this.scoreElement);
        
        // Create high score display
        this.highScoreElement = document.createElement('div');
        this.highScoreElement.className = 'game-ui game-score';
        this.highScoreElement.style.position = 'absolute';
        this.highScoreElement.style.top = '50px';
        this.highScoreElement.style.left = '20px';
        this.highScoreElement.style.color = '#ffff00';
        this.highScoreElement.style.fontSize = '18px';
        this.highScoreElement.style.fontFamily = 'Arial, sans-serif';
        this.highScoreElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        this.highScoreElement.style.zIndex = '1000';
        document.body.appendChild(this.highScoreElement);
        
        // Update high score from localStorage
        this.updateHighScore(0);
        
        // Create coin display
        this.coinContainer = document.createElement('div');
        this.coinContainer.className = 'game-ui coin-display';
        this.coinContainer.style.position = 'absolute';
        this.coinContainer.style.top = '80px';
        this.coinContainer.style.left = '20px';
        this.coinContainer.style.color = '#FFD700';
        this.coinContainer.style.fontSize = '18px';
        this.coinContainer.style.fontFamily = 'Arial, sans-serif';
        this.coinContainer.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        this.coinContainer.style.display = 'flex';
        this.coinContainer.style.alignItems = 'center';
        this.coinContainer.style.gap = '10px';
        document.body.appendChild(this.coinContainer);
        
        // Create coin icon
        const coinIcon = document.createElement('div');
        coinIcon.style.width = '20px';
        coinIcon.style.height = '20px';
        coinIcon.style.borderRadius = '50%';
        coinIcon.style.backgroundColor = '#FFD700';
        coinIcon.style.boxShadow = '0 0 5px rgba(255, 215, 0, 0.7)';
        this.coinContainer.appendChild(coinIcon);
        
        // Create coin count
        this.coinCountElement = document.createElement('span');
        this.coinCountElement.textContent = '0';
        this.coinContainer.appendChild(this.coinCountElement);
        
        // Create mute button
        this.muteButton = document.createElement('button');
        this.muteButton.className = 'game-ui mute-button';
        this.muteButton.style.position = 'absolute';
        this.muteButton.style.bottom = '20px';
        this.muteButton.style.left = '20px';
        this.muteButton.style.width = '40px';
        this.muteButton.style.height = '40px';
        this.muteButton.style.borderRadius = '50%';
        this.muteButton.style.border = 'none';
        this.muteButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        this.muteButton.style.color = 'white';
        this.muteButton.style.fontSize = '20px';
        this.muteButton.style.cursor = 'pointer';
        this.muteButton.innerHTML = '🔊';
        this.muteButton.onclick = () => this.toggleMute();
        document.body.appendChild(this.muteButton);
    }

    toggleMute() {
        const isMuted = this.audioManager.toggleMute();
        this.muteButton.innerHTML = isMuted ? '🔇' : '🔊';
    }

    updateScore(score) {
        this.scoreElement.textContent = `Score: ${Math.floor(score)}`;
        this.updateHighScore(score);
        
        // Update coin display
        this.coinCountElement.textContent = this.gameState.coins;
    }

    updateHighScore(currentScore) {
        const highScore = Math.max(
            currentScore,
            parseInt(localStorage.getItem('highScore') || '0')
        );
        localStorage.setItem('highScore', highScore.toString());
        this.highScoreElement.textContent = `High Score: ${Math.floor(highScore)}`;
    }

    update() {
        try {
            const deltaTime = this.clock.getDelta();
            const elapsedTime = this.clock.getElapsedTime();

            // Update game progress
            this.gameProgressManager.update(deltaTime);

            // Update hero
            this.hero.update(deltaTime);

            // Update world and obstacles
            this.worldManager.update(deltaTime, this.gameProgressManager.getObstacleSpeed());

            // Update collectibles
            this.updateCollectibles(elapsedTime);

            // Update power-ups
            this.powerUpManager.update(deltaTime);

            // Check collisions
            this.collisionManager.update();

            // Update trees
            this.updateTrees(elapsedTime);

            // Render scene
            this.renderer.render(this.sceneManager.scene, this.camera);

            // Request next frame
            requestAnimationFrame(() => this.update());
        } catch (error) {
            console.error('Error in game loop:', error);
        }
    }
    
    updateCollectibles(elapsedTime) {
        // Spawn new collectibles
        if (elapsedTime >= this.nextCollectibleSpawn) {
            this.collectibleManager.spawnCollectible();
            this.nextCollectibleSpawn = elapsedTime + this.gameProgressManager.getCollectibleSpawnInterval();
        }

        // Update existing collectibles
        this.collectibleManager.update(deltaTime);
    }

    updateTrees(elapsedTime) {
        // Spawn new trees
        if (elapsedTime >= this.nextTreeSpawn) {
            this.worldManager.spawnTree();
            this.nextTreeSpawn = elapsedTime + this.gameProgressManager.getTreeSpawnInterval();
        }
    }

    addBackgroundTrees() {
        this.worldManager.addBackgroundTrees();
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    moveLeft() {
        if (this.currentLane > this.leftLane) {
            this.currentLane--;
            this.hero.moveToLane(this.currentLane);
        }
    }

    moveRight() {
        if (this.currentLane < this.rightLane) {
            this.currentLane++;
            this.hero.moveToLane(this.currentLane);
        }
    }

    jump() {
        this.hero.jump();
    }

    resetGame() {
        // Reset game state
        this.gameState.reset();
        
        // Reset managers
        this.powerUpManager.reset();
        this.scoreManager.reset();
        this.gameProgressManager.reset();
        
        // Reset hero
        this.hero.reset();
        this.currentLane = this.middleLane;
        this.hero.setLane(this.currentLane);
        
        // Reset world and collectibles
        this.worldManager.reset();
        this.collectibleManager.reset();
        
        // Reset timing variables
        this.clock.start();
        this.nextTreeSpawn = 0;
        this.nextCollectibleSpawn = 0;
    }

    onGameStateChanged(gameState) {
        if (gameState.currentState === GameStates.GAME_OVER) {
            this.showGameOver();
        }
    }

    showGameOver() {
        // Create game over container
        const gameOverContainer = document.createElement('div');
        gameOverContainer.className = 'game-ui game-over-container';
        gameOverContainer.style.position = 'absolute';
        gameOverContainer.style.top = '50%';
        gameOverContainer.style.left = '50%';
        gameOverContainer.style.transform = 'translate(-50%, -50%)';
        gameOverContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        gameOverContainer.style.padding = '20px';
        gameOverContainer.style.borderRadius = '10px';
        gameOverContainer.style.textAlign = 'center';
        gameOverContainer.style.color = 'white';
        gameOverContainer.style.fontFamily = 'Arial, sans-serif';
        
        // Add game over text
        const gameOverText = document.createElement('h1');
        gameOverText.textContent = 'Game Over';
        gameOverText.style.margin = '0 0 20px 0';
        gameOverText.style.fontSize = '36px';
        gameOverText.style.color = '#FF4444';
        gameOverContainer.appendChild(gameOverText);
        
        // Add final score
        const finalScore = document.createElement('div');
        finalScore.textContent = `Final Score: ${this.scoreManager.getScore()}`;
        finalScore.style.fontSize = '24px';
        finalScore.style.marginBottom = '20px';
        gameOverContainer.appendChild(finalScore);
        
        // Add high score
        const highScore = document.createElement('div');
        highScore.textContent = `High Score: ${this.scoreManager.getHighScore()}`;
        highScore.style.fontSize = '20px';
        highScore.style.color = '#FFD700';
        highScore.style.marginBottom = '30px';
        gameOverContainer.appendChild(highScore);
        
        // Add restart button
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        restartButton.style.padding = '10px 20px';
        restartButton.style.fontSize = '18px';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.transition = 'background-color 0.3s';
        
        restartButton.onmouseover = () => {
            restartButton.style.backgroundColor = '#45a049';
        };
        
        restartButton.onmouseout = () => {
            restartButton.style.backgroundColor = '#4CAF50';
        };
        
        restartButton.onclick = () => {
            document.body.removeChild(gameOverContainer);
            this.resetGame();
            this.gameState.startGame();
        };
        
        gameOverContainer.appendChild(restartButton);
        document.body.appendChild(gameOverContainer);
    }
}