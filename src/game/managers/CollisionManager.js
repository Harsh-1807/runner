import * as THREE from 'three';

export class CollisionManager {
    constructor(gameState, hero, worldManager, collectibleManager) {
        this.gameState = gameState;
        this.hero = hero;
        this.worldManager = worldManager;
        this.collectibleManager = collectibleManager;
        
        // Collision detection parameters
        this.heroRadius = hero.radius;
        this.worldRadius = worldManager.worldRadius;
    }

    update() {
        this.checkHeroWorldCollision();
        this.checkHeroObstacleCollisions();
        this.checkHeroCollectibleCollisions();
    }

    checkHeroWorldCollision() {
        const heroPosition = this.hero.mesh.position;
        const distanceFromCenter = Math.sqrt(
            heroPosition.x * heroPosition.x +
            heroPosition.y * heroPosition.y +
            heroPosition.z * heroPosition.z
        );

        // Check if hero is too far from the world surface
        if (Math.abs(distanceFromCenter - this.worldRadius) > this.heroRadius * 2) {
            this.gameState.loseLife();
        }
    }

    checkHeroObstacleCollisions() {
        const heroPosition = this.hero.mesh.position;
        const obstacles = this.worldManager.getActiveObstacles();

        for (const obstacle of obstacles) {
            if (!obstacle.visible) continue;

            const distance = heroPosition.distanceTo(obstacle.position);
            const collisionThreshold = this.heroRadius + obstacle.userData.radius;

            if (distance < collisionThreshold) {
                this.handleObstacleCollision(obstacle);
                break; // Only handle one collision at a time
            }
        }
    }

    checkHeroCollectibleCollisions() {
        const heroPosition = this.hero.mesh.position;
        const collectibles = this.collectibleManager.getActiveCollectibles();
        const magnetActive = this.gameState.powerUpManager.hasActiveMagnet();
        const magnetRadius = magnetActive ? this.heroRadius * 5 : this.heroRadius;

        for (const collectible of collectibles) {
            if (!collectible.visible) continue;

            const distance = heroPosition.distanceTo(collectible.position);
            const collisionThreshold = this.heroRadius + collectible.userData.radius;

            if (distance < collisionThreshold || (magnetActive && distance < magnetRadius)) {
                this.handleCollectibleCollision(collectible);
                break; // Only handle one collision at a time
            }
        }
    }

    handleObstacleCollision(obstacle) {
        if (this.gameState.powerUpManager.hasActiveShield()) {
            // Shield protects from one hit
            this.gameState.powerUpManager.deactivateShield();
            this.gameState.audioManager.playSound('shieldBreak');
        } else {
            this.gameState.loseLife();
            this.gameState.audioManager.playSound('hit');
        }

        // Hide the obstacle after collision
        obstacle.visible = false;
    }

    handleCollectibleCollision(collectible) {
        const collectibleType = collectible.userData.type;
        const points = this.processCollectible(collectibleType);
        
        // Update score
        this.gameState.scoreManager.addScore(points);
        
        // Hide the collectible after collection
        collectible.visible = false;
        
        // Play collection sound
        this.gameState.audioManager.playSound('collect');
    }

    processCollectible(type) {
        switch (type) {
            case 'coin':
                return 10;
            case 'shield':
                this.gameState.powerUpManager.activateShield();
                return 0;
            case 'magnet':
                this.gameState.powerUpManager.activateMagnet();
                return 0;
            case 'doublePoints':
                this.gameState.powerUpManager.activateDoublePoints();
                this.gameState.scoreManager.setScoreMultiplier(2);
                return 0;
            default:
                return 0;
        }
    }

    isPointInMagnetRange(point) {
        if (!this.gameState.powerUpManager.hasActiveMagnet()) {
            return false;
        }

        const heroPosition = this.hero.mesh.position;
        const distance = heroPosition.distanceTo(point);
        const magnetRadius = this.heroRadius * 5;

        return distance < magnetRadius;
    }
} 