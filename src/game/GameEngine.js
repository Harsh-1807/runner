import * as THREE from 'three';
import { GameStates } from './GameState';
import { SceneManager } from './components/SceneManager';
import { WorldManager } from './components/WorldManager';
import { Hero } from './components/Hero';
import { CollectibleManager } from './components/CollectibleManager';
import { AudioManager } from './audio/AudioManager';

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
        // Get delta time
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();

        if (this.gameState.state === GameStates.PLAYING) {
            // Update hero
            this.hero.moveTo(this.currentLane, deltaTime);
            this.hero.update(deltaTime);

            // Update world with increasing speed based on difficulty
            const currentSpeed = this.rollingSpeed * this.difficultyFactor;
            this.worldManager.update(currentSpeed);
            this.hero.rollingSpeed = currentSpeed * this.worldRadius / this.heroRadius / 5;

            // Update atmospheric particles
            if (this.environmentParticles) {
                this.environmentParticles.rotation.y += deltaTime * 0.05;
            }

            // Update score continuously with multiplier
            const pointMultiplier = this.hasDoublePoints ? 2 : 1;
            this.score += deltaTime * 10 * this.difficultyFactor * pointMultiplier;
            this.updateScore(this.score);

            // Spawn trees and collectibles
            this.updateTrees(elapsedTime);
            this.updateCollectibles(elapsedTime);
            
            // Check collisions
            this.checkCollisions();
            
            // Update power-ups
            this.updatePowerups(deltaTime);

            // Update score and difficulty
            this.updateGameProgress(elapsedTime);
        }

        // Always render scene
        this.sceneManager.render();
    }
    
    updatePowerups(deltaTime) {
        // Update shield
        if (this.hasShield) {
            this.shieldTimeRemaining -= deltaTime;
            this.shieldIndicator.timerElement.textContent = this.shieldTimeRemaining.toFixed(1) + 's';
            
            if (this.shieldTimeRemaining <= 0) {
                this.hasShield = false;
                this.shieldIndicator.element.style.display = 'none';
                
                // Visual effect for shield expiring
                if (this.hero.shieldEffect) {
                    this.hero.shieldEffect.visible = false;
                }
            }
        }
        
        // Update magnet
        if (this.hasMagnet) {
            this.magnetTimeRemaining -= deltaTime;
            this.magnetIndicator.timerElement.textContent = this.magnetTimeRemaining.toFixed(1) + 's';
            
            if (this.magnetTimeRemaining <= 0) {
                this.hasMagnet = false;
                this.magnetIndicator.element.style.display = 'none';
            } else {
                // Apply magnet effect - attract nearby coins
                this.attractCoins();
            }
        }
        
        // Update double points
        if (this.hasDoublePoints) {
            this.doublePointsTimeRemaining -= deltaTime;
            this.doublePointsIndicator.timerElement.textContent = this.doublePointsTimeRemaining.toFixed(1) + 's';
            
            if (this.doublePointsTimeRemaining <= 0) {
                this.hasDoublePoints = false;
                this.doublePointsIndicator.element.style.display = 'none';
            }
        }
    }
    
    attractCoins() {
        const heroPos = this.hero.getWorldPosition();
        const magnetRadius = 3.0; // Range of the magnet
        
        for (const collectible of this.collectibleManager.activeCollectibles) {
            if (collectible.type === 'coin' && collectible.active && collectible.mesh) {
                const collectiblePos = new THREE.Vector3();
                collectiblePos.setFromMatrixPosition(collectible.mesh.matrixWorld);
                
                const distance = collectiblePos.distanceTo(heroPos);
                
                if (distance < magnetRadius) {
                    // Calculate direction to hero
                    const direction = new THREE.Vector3().subVectors(heroPos, collectiblePos).normalize();
                    
                    // Move coin towards hero
                    collectiblePos.add(direction.multiplyScalar(0.2));
                    collectible.mesh.position.copy(collectiblePos);
                }
            }
        }
    }

    updateCollectibles(elapsedTime) {
        // Update existing collectibles
        this.collectibleManager.update();
        
        // Spawn new collectibles
        if (elapsedTime > this.nextCollectibleSpawn) {
            this.collectibleManager.spawnCollectible(this.worldManager.rollingGroundSphere);
            
            // Set next spawn time
            const spawnInterval = this.collectibleReleaseInterval / this.difficultyFactor;
            this.nextCollectibleSpawn = elapsedTime + spawnInterval;
        }
        
        // Check for collectible collisions
        const heroPos = this.hero.getWorldPosition();
        const collectedItems = this.collectibleManager.checkCollisions(heroPos);
        
        // Process collected items
        for (const itemType of collectedItems) {
            this.processCollectible(itemType);
        }
    }
    
    processCollectible(type) {
        // Play sound
        this.audioManager.playCollectible(type);
        
        switch(type) {
            case 'coin':
                // Add points
                const pointsToAdd = this.coinValue * (this.hasDoublePoints ? 2 : 1);
                this.score += pointsToAdd;
                this.gameState.coins++;
                break;
                
            case 'shield':
                // Activate shield
                this.hasShield = true;
                this.shieldTimeRemaining = this.shieldDuration;
                this.shieldIndicator.element.style.display = 'block';
                
                // Add visual shield effect
                if (!this.hero.shieldEffect) {
                    const shieldGeometry = new THREE.SphereGeometry(0.3, 16, 16);
                    const shieldMaterial = new THREE.MeshBasicMaterial({
                        color: 0x0088FF,
                        transparent: true,
                        opacity: 0.4,
                        side: THREE.DoubleSide
                    });
                    this.hero.shieldEffect = new THREE.Mesh(shieldGeometry, shieldMaterial);
                    this.hero.mesh.add(this.hero.shieldEffect);
                } else {
                    this.hero.shieldEffect.visible = true;
                }
                break;
                
            case 'magnet':
                // Activate magnet
                this.hasMagnet = true;
                this.magnetTimeRemaining = this.magnetDuration;
                this.magnetIndicator.element.style.display = 'block';
                break;
                
            case 'doublePoints':
                // Activate double points
                this.hasDoublePoints = true;
                this.doublePointsTimeRemaining = this.doublePointsDuration;
                this.doublePointsIndicator.element.style.display = 'block';
                break;
                
            case 'extraLife':
                // Add extra life (up to maximum)
                if (this.lives < this.maxLives) {
                    this.lives++;
                    this.updateLivesDisplay();
                }
                break;
        }
    }

    resetGame() {
        // Remove any existing game over display
        if (this.gameOverDisplay && this.gameOverDisplay.parentNode) {
            this.gameOverDisplay.parentNode.removeChild(this.gameOverDisplay);
        }

        this.currentLane = this.middleLane;
        this.hero.setLane(this.currentLane);
        this.hero.reset();
        this.lastTreeSpawn = 0;
        this.difficultyFactor = 1.0;
        this.nextTreeSpawn = this.treeReleaseInterval;
        this.nextCollectibleSpawn = this.collectibleReleaseInterval;
        this.score = 0;
        this.scoreMultiplier = 1;
        this.updateScore(0);
        this.lives = 3;
        this.updateLivesDisplay();
        
        // Reset power-ups
        this.hasShield = false;
        this.hasMagnet = false;
        this.hasDoublePoints = false;
        this.shieldIndicator.element.style.display = 'none';
        this.magnetIndicator.element.style.display = 'none';
        this.doublePointsIndicator.element.style.display = 'none';
        
        // Reset shield effect
        if (this.hero.shieldEffect) {
            this.hero.shieldEffect.visible = false;
        }
        
        // Reset collectibles
        this.collectibleManager.reset();
        
        // Reset gamestate coins
        this.gameState.coins = 0;
        
        // Start background music
        this.audioManager.startBackgroundMusic();

        // Clear existing trees
        while (this.worldManager.treesInPath.length > 0) {
            const tree = this.worldManager.treesInPath[0];
            this.worldManager.removeTree(tree);
        }
        
        this.clock.start();
    }

    onGameStateChanged(gameState) {
        // Remove any existing game over display
        const existingGameOver = document.querySelector('.game-over');
        if (existingGameOver) {
            existingGameOver.remove();
        }

        switch (gameState.state) {
            case GameStates.PLAYING:
                this.resetGame();
                this.audioManager.startBackgroundMusic();
                break;
            case GameStates.GAME_OVER:
                // Check for shield or lives FIRST, before declaring "final" game over actions.

                if (this.hasShield) {
                    this.hasShield = false;
                    this.shieldIndicator.element.style.display = 'none';
                    if (this.hero.shieldEffect) {
                        this.hero.shieldEffect.visible = false;
                    }
                    
                    // Visual effect for shield breaking
                    const shieldBreakGeometry = new THREE.BufferGeometry();
                    const positions = new Float32Array(50 * 3);
                    const colors = new Float32Array(50 * 3);
                    
                    for (let i = 0; i < 50; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const radius = Math.random() * 0.5;
                        positions[i * 3] = Math.cos(angle) * radius;
                        positions[i * 3 + 1] = Math.sin(angle) * radius;
                        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
                        
                        colors[i * 3] = 0;
                        colors[i * 3 + 1] = 0.5;
                        colors[i * 3 + 2] = 1;
                    }
                    
                    shieldBreakGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    shieldBreakGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                    
                    const shieldBreakMaterial = new THREE.PointsMaterial({ 
                        size: 0.05, 
                        vertexColors: true,
                        transparent: true,
                        opacity: 0.8 
                    });
                    const shieldBreakParticles = new THREE.Points(shieldBreakGeometry, shieldBreakMaterial);
                    
                    if (this.hero.mesh) { // Ensure hero mesh exists
                        this.hero.mesh.add(shieldBreakParticles);
                    }
                    
                    // Remove particles after 1 second
                    setTimeout(() => {
                        if (this.hero.mesh) {
                            this.hero.mesh.remove(shieldBreakParticles);
                        }
                    }, 1000);

                    this.audioManager.play('shield'); // Sound for shield used/broken

                    gameState.state = GameStates.PLAYING; // Go back to playing
                    return; // Game continues
                }
                
                // Reduce lives if available (if current lives are 2 or more, can lose one)
                if (this.lives > 1) { 
                    this.lives--;
                    this.updateLivesDisplay();
                    this.audioManager.playCollision(); // Sound for losing life
                    
                    // Visual effect for life lost
                    if (this.hero.mesh) { // Ensure hero mesh exists
                        this.hero.mesh.visible = false;
                        setTimeout(() => {
                            if (this.hero.mesh) {
                                this.hero.mesh.visible = true;
                            }
                        }, 200);
                    }
                    
                    gameState.state = GameStates.PLAYING; // Go back to playing
                    return; // Game continues
                }
                
                // If neither shield nor extra lives were used, THEN it's truly game over.
                this.audioManager.playGameOver(); 
                
                if (this.hero) { // Ensure hero exists
                    this.hero.explode();
                }
                // this.audioManager.playCollision(); // Potentially redundant if hero.explode() has sound or playGameOver is sufficient
                
                const finalScore = Math.floor(this.score);
                this.updateHighScore(finalScore);
                
                // Create game over display
                const gameOverDiv = document.createElement('div');
                gameOverDiv.className = 'game-over';
                gameOverDiv.style.position = 'absolute';
                gameOverDiv.style.top = '50%';
                gameOverDiv.style.left = '50%';
                gameOverDiv.style.transform = 'translate(-50%, -50%)';
                gameOverDiv.style.color = '#ffffff';
                gameOverDiv.style.fontSize = '36px';
                gameOverDiv.style.fontFamily = 'Arial, sans-serif';
                gameOverDiv.style.textAlign = 'center';
                gameOverDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
                gameOverDiv.style.zIndex = '1000';
                gameOverDiv.innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 20px;">Game Over!</div>
                    <div style="margin-bottom: 10px">Final Score: ${finalScore}</div>
                    <div style="margin-bottom: 20px">Coins Collected: ${this.gameState.coins}</div>
                    <div style="font-size: 24px; margin-top: 20px">Press ↑ to Restart</div>
                `;
                document.body.appendChild(gameOverDiv);
                break;
        }
    }

    checkCollisions() {
        const heroPos = this.hero.getWorldPosition();
        
        for (const obstacle of this.worldManager.treesInPath) {
            const obstaclePos = new THREE.Vector3();
            obstaclePos.setFromMatrixPosition(obstacle.matrixWorld);
            
            // Don't process obstacles that are behind the player (optimization)
            if (obstaclePos.z > 6) continue;
            
            // Different collision detection based on obstacle type
            if (obstacle.userData.obstacleType === 'rock') {
                // For rock obstacles, only check collision if not jumping high enough
                const horizontalDistance = new THREE.Vector2(
                    heroPos.x - obstaclePos.x,
                    heroPos.z - obstaclePos.z
                ).length();
                
                // Rock collision test - close horizontally but not jumping high enough
                if (horizontalDistance < 0.8 && heroPos.y < this.hero.baseY + 0.4) {
                    console.log('Rock collision detected!');
                    this.gameState.gameOver();
                    break;
                }
            } else {
                // For vertical obstacles (trees), check normal collision
                const distance = obstaclePos.distanceTo(heroPos);
                if (distance <= 0.6) {
                    console.log('Tree collision detected!');
                    this.gameState.gameOver();
                    break;
                }
            }
        }
    }

    updateTrees(elapsedTime) {
        // Remove trees that are out of view
        for (const tree of [...this.worldManager.treesInPath]) {
            const treePos = new THREE.Vector3();
            treePos.setFromMatrixPosition(tree.matrixWorld);
            if (treePos.z > 7 && tree.visible) {
                this.worldManager.removeTree(tree);
            }
        }

        // Add new trees based on difficulty
        if (elapsedTime > this.nextTreeSpawn) {
            // Calculate number of trees to spawn based on difficulty
            const spawnChance = Math.min(0.8, 0.3 + (this.difficultyFactor - 1) * 0.2);
            const numTrees = Math.random() < spawnChance ? 2 : 1;
            
            // Get available lanes
            const lanes = [-1, 0, 1];
            
            // Spawn trees with pattern variations
            if (numTrees === 2 && Math.random() < 0.3) {
                // Special pattern: adjacent trees (harder to dodge)
                const startLane = Math.random() < 0.5 ? -1 : 0;
                this.worldManager.addTree(true, startLane);
                this.worldManager.addTree(true, startLane + 1);
            } else {
                // Random pattern
                for (let i = 0; i < numTrees; i++) {
                    if (lanes.length === 0) break;
                    const laneIndex = Math.floor(Math.random() * lanes.length);
                    const lane = lanes[laneIndex];
                    lanes.splice(laneIndex, 1);
                    this.worldManager.addTree(true, lane);
                }
            }
            
            // Set next spawn time with difficulty adjustment
            const adjustedInterval = Math.max(
                this.minSpawnInterval,
                this.treeReleaseInterval / this.difficultyFactor
            );
            this.nextTreeSpawn = elapsedTime + adjustedInterval;
        }
    }

    updateGameProgress(elapsedTime) {
        // Increase difficulty over time (max 3.0 after 120 seconds)
        this.difficultyFactor = Math.min(3.0, 1.0 + elapsedTime / 40.0);
        
        // Update score with difficulty bonus
        if (elapsedTime > this.nextTreeSpawn) {
            const baseScore = Math.floor(this.treeReleaseInterval * 10);
            const difficultyBonus = Math.floor(this.difficultyFactor * 10);
            this.gameState.addScore(baseScore + difficultyBonus);
            
            // Calculate next spawn time with difficulty
            const adjustedInterval = Math.max(
                this.minSpawnInterval,
                this.treeReleaseInterval / this.difficultyFactor
            );
            this.nextTreeSpawn = elapsedTime + adjustedInterval;
        }
    }

    addBackgroundTrees() {
        const numTrees = 36;
        const gap = 6.28 / 36;
        for (let i = 0; i < numTrees; i++) {
            this.worldManager.addTree(false, i * gap, true);
            this.worldManager.addTree(false, i * gap, false);
        }
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.sceneManager.handleResize(width, height);
    }

    // Input handlers
    moveLeft() {
        if (this.gameState.state === GameStates.PLAYING) {
            if (this.currentLane === this.middleLane) {
                this.currentLane = this.leftLane;
            } else if (this.currentLane === this.rightLane) {
                this.currentLane = this.middleLane;
            }
        }
    }

    moveRight() {
        if (this.gameState.state === GameStates.PLAYING) {
            if (this.currentLane === this.middleLane) {
                this.currentLane = this.rightLane;
            } else if (this.currentLane === this.leftLane) {
                this.currentLane = this.middleLane;
            }
        }
    }

    jump() {
        if (this.gameState.state === GameStates.PLAYING) {
            // Debug the jump function
            console.log('GameEngine: Jump command received');
            
            if (!this.hero.jumping) {
                this.audioManager.playJump(false);
            } else if (!this.hero.doubleJumping) {
                this.audioManager.playJump(true);
            }
            
            this.hero.jump();
        } else if (this.gameState.state === GameStates.GAME_OVER) {
            // If at game over screen, pressing jump restarts the game
            this.gameState.startGame();
        }
    }
}