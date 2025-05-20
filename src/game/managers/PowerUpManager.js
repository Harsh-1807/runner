import { AudioManager } from '../audio/AudioManager';

export class PowerUpManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.audioManager = new AudioManager();
        
        // Power-up states
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

        // UI elements
        this.powerupContainer = null;
        this.shieldIndicator = null;
        this.magnetIndicator = null;
        this.doublePointsIndicator = null;
        
        this.initializeUI();
    }

    initializeUI() {
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
        
        // Create indicators for each power-up
        this.shieldIndicator = this.createPowerupIndicator('Shield', '#0088FF');
        this.magnetIndicator = this.createPowerupIndicator('Magnet', '#FF0000');
        this.doublePointsIndicator = this.createPowerupIndicator('2x Points', '#FFFF00');
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

    update(deltaTime) {
        this.updatePowerupTimers(deltaTime);
        this.updatePowerupIndicators();
    }

    updatePowerupTimers(deltaTime) {
        if (this.hasShield) {
            this.shieldTimeRemaining -= deltaTime;
            if (this.shieldTimeRemaining <= 0) {
                this.deactivateShield();
            }
        }

        if (this.hasMagnet) {
            this.magnetTimeRemaining -= deltaTime;
            if (this.magnetTimeRemaining <= 0) {
                this.deactivateMagnet();
            }
        }

        if (this.hasDoublePoints) {
            this.doublePointsTimeRemaining -= deltaTime;
            if (this.doublePointsTimeRemaining <= 0) {
                this.deactivateDoublePoints();
            }
        }
    }

    updatePowerupIndicators() {
        // Update shield indicator
        if (this.hasShield) {
            this.shieldIndicator.element.style.display = 'block';
            this.shieldIndicator.timerElement.textContent = `${this.shieldTimeRemaining.toFixed(1)}s`;
        } else {
            this.shieldIndicator.element.style.display = 'none';
        }

        // Update magnet indicator
        if (this.hasMagnet) {
            this.magnetIndicator.element.style.display = 'block';
            this.magnetIndicator.timerElement.textContent = `${this.magnetTimeRemaining.toFixed(1)}s`;
        } else {
            this.magnetIndicator.element.style.display = 'none';
        }

        // Update double points indicator
        if (this.hasDoublePoints) {
            this.doublePointsIndicator.element.style.display = 'block';
            this.doublePointsIndicator.timerElement.textContent = `${this.doublePointsTimeRemaining.toFixed(1)}s`;
        } else {
            this.doublePointsIndicator.element.style.display = 'none';
        }
    }

    activateShield() {
        this.hasShield = true;
        this.shieldTimeRemaining = this.shieldDuration;
        this.audioManager.playSound('shield');
    }

    deactivateShield() {
        this.hasShield = false;
        this.shieldTimeRemaining = 0;
    }

    activateMagnet() {
        this.hasMagnet = true;
        this.magnetTimeRemaining = this.magnetDuration;
        this.audioManager.playSound('magnet');
    }

    deactivateMagnet() {
        this.hasMagnet = false;
        this.magnetTimeRemaining = 0;
    }

    activateDoublePoints() {
        this.hasDoublePoints = true;
        this.doublePointsTimeRemaining = this.doublePointsDuration;
        this.audioManager.playSound('doublePoints');
    }

    deactivateDoublePoints() {
        this.hasDoublePoints = false;
        this.doublePointsTimeRemaining = 0;
    }

    hasActiveShield() {
        return this.hasShield;
    }

    hasActiveMagnet() {
        return this.hasMagnet;
    }

    hasActiveDoublePoints() {
        return this.hasDoublePoints;
    }

    getScoreMultiplier() {
        return this.hasDoublePoints ? 2 : 1;
    }
} 