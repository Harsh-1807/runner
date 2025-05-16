import * as THREE from 'three';
import { Collectible } from './Collectible';

export class CollectibleManager {
    constructor(scene, worldRadius) {
        this.scene = scene;
        this.worldRadius = worldRadius;
        this.collectibles = [];
        this.activeCollectibles = [];
        this.pathAngleValues = {
            '-1': 1.62, // Left lane
            '0': 1.57,  // Middle lane
            '1': 1.52   // Right lane
        };
        this.collectibleTypes = ['coin', 'magnet', 'shield', 'doublePoints', 'extraLife'];
        this.createCollectiblePool();
    }

    createCollectiblePool() {
        // Create coins (most common)
        for (let i = 0; i < 20; i++) {
            this.collectibles.push(new Collectible(this.scene, 'coin'));
        }

        // Create power-ups (less common)
        this.collectibles.push(new Collectible(this.scene, 'magnet'));
        this.collectibles.push(new Collectible(this.scene, 'shield'));
        this.collectibles.push(new Collectible(this.scene, 'doublePoints'));
        this.collectibles.push(new Collectible(this.scene, 'extraLife'));
    }

    spawnCollectible(rollingGroundSphere) {
        // Don't spawn too many collectibles at once
        if (this.activeCollectibles.length > 10) return;

        // Select a spawn pattern
        const patternType = Math.random();
        
        if (patternType < 0.2) {
            // 20% chance to spawn a line across lanes
            this.spawnHorizontalLine(rollingGroundSphere);
        } else if (patternType < 0.4) {
            // 20% chance to spawn a diagonal line
            this.spawnDiagonalLine(rollingGroundSphere);
        } else if (patternType < 0.6) {
            // 20% chance to spawn a zigzag pattern
            this.spawnZigzag(rollingGroundSphere);
        } else {
            // 40% chance to spawn a single collectible (original behavior)
            this.spawnSingleCollectible(rollingGroundSphere);
        }
    }
    
    spawnSingleCollectible(rollingGroundSphere) {
        // Get an available collectible
        let collectible = this.getAvailableCollectible();
        if (!collectible) return null;
        
        // Pick a random lane
        const lanes = [-1, 0, 1];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        
        // Position the collectible in the chosen lane
        const distanceOffset = 0; // No offset for single collectible
        this.positionCollectible(collectible, rollingGroundSphere, lane, distanceOffset);
        
        return collectible;
    }
    
    spawnHorizontalLine(rollingGroundSphere) {
        // Spawn 3 coins in a horizontal line across all lanes
        const lanes = [-1, 0, 1];
        
        // Determine if we should include a power-up
        const includePowerup = Math.random() < 0.15; // 15% chance
        const powerupLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        // Spawn collectibles in all lanes at the same distance
        for (const lane of lanes) {
            // Determine collectible type
            const type = (includePowerup && lane === powerupLane) ? 
                this.getRandomPowerupType() : 'coin';
            
            const collectible = this.getAvailableCollectible(type);
            if (collectible) {
                this.positionCollectible(collectible, rollingGroundSphere, lane, 0);
            }
        }
    }
    
    spawnDiagonalLine(rollingGroundSphere) {
        // Spawn a diagonal line of collectibles
        const lanes = [-1, 0, 1];
        
        // Determine direction (left-to-right or right-to-left)
        const leftToRight = Math.random() < 0.5;
        const orderedLanes = leftToRight ? lanes : [...lanes].reverse();
        
        // Spawn collectibles in diagonal pattern
        for (let i = 0; i < orderedLanes.length; i++) {
            const lane = orderedLanes[i];
            const distanceOffset = i * 0.5; // Increase distance for each lane
            
            // 10% chance for a power-up at the end of the diagonal
            const type = (i === orderedLanes.length - 1 && Math.random() < 0.1) ? 
                this.getRandomPowerupType() : 'coin';
            
            const collectible = this.getAvailableCollectible(type);
            if (collectible) {
                this.positionCollectible(collectible, rollingGroundSphere, lane, distanceOffset);
            }
        }
    }
    
    spawnZigzag(rollingGroundSphere) {
        // Spawn a zigzag pattern of collectibles
        const pattern = [0, -1, 0, 1, 0]; // Middle, left, middle, right, middle
        
        // Spawn collectibles in zigzag pattern
        for (let i = 0; i < pattern.length; i++) {
            const lane = pattern[i];
            const distanceOffset = i * 0.4; // Increase distance for each position
            
            // 5% chance for a power-up in the middle of the zigzag
            const type = (i === Math.floor(pattern.length / 2) && Math.random() < 0.05) ? 
                this.getRandomPowerupType() : 'coin';
            
            const collectible = this.getAvailableCollectible(type);
            if (collectible) {
                this.positionCollectible(collectible, rollingGroundSphere, lane, distanceOffset);
            }
        }
    }
    
    getAvailableCollectible(typeToSpawn = null) {
        // Determine type to spawn based on rarity if not specified
        if (!typeToSpawn) {
            const random = Math.random();
            typeToSpawn = 'coin';
            
            if (random < 0.01) {
                typeToSpawn = 'extraLife'; // 1% chance
            } else if (random < 0.05) {
                typeToSpawn = 'shield'; // 4% chance
            } else if (random < 0.10) {
                typeToSpawn = 'doublePoints'; // 5% chance
            } else if (random < 0.15) {
                typeToSpawn = 'magnet'; // 5% chance
            }
        }
        
        // Find an inactive collectible of the right type
        for (let i = 0; i < this.collectibles.length; i++) {
            if (!this.collectibles[i].active && this.collectibles[i].type === typeToSpawn) {
                return this.collectibles[i];
            }
        }
        
        // If no collectible found, create a new one
        const collectible = new Collectible(this.scene, typeToSpawn);
        this.collectibles.push(collectible);
        return collectible;
    }
    
    getRandomPowerupType() {
        const powerups = ['shield', 'magnet', 'doublePoints', 'extraLife'];
        return powerups[Math.floor(Math.random() * powerups.length)];
    }
    
    positionCollectible(collectible, rollingGroundSphere, lane, distanceOffset = 0) {
        // Position the collectible in the chosen lane
        const sphericalHelper = new THREE.Spherical();
        const pathAngle = this.pathAngleValues[lane.toString()];
        
        sphericalHelper.set(
            this.worldRadius - 0.3,
            pathAngle,
            -rollingGroundSphere.rotation.x + 4 + distanceOffset
        );
        
        collectible.mesh.position.setFromSpherical(sphericalHelper);
        
        // Align with ground
        const rollingGroundVector = rollingGroundSphere.position.clone().normalize();
        const collectibleVector = collectible.mesh.position.clone().normalize();
        collectible.mesh.quaternion.setFromUnitVectors(collectibleVector, rollingGroundVector);
        
        // Activate
        collectible.active = true;
        collectible.mesh.visible = true;
        this.activeCollectibles.push(collectible);
        
        // Add to rolling ground
        rollingGroundSphere.add(collectible.mesh);
        
        return collectible;
    }

    update() {
        // Update all active collectibles
        for (let i = this.activeCollectibles.length - 1; i >= 0; i--) {
            const collectible = this.activeCollectibles[i];
            collectible.update();
            
            // Check if the collectible is out of view
            if (collectible.mesh && collectible.active) {
                const collectiblePos = new THREE.Vector3();
                collectiblePos.setFromMatrixPosition(collectible.mesh.matrixWorld);
                
                if (collectiblePos.z > 6) {
                    collectible.active = false;
                    collectible.mesh.visible = false;
                    this.activeCollectibles.splice(i, 1);
                }
            }
        }
    }

    checkCollisions(heroPos, radius = 0.6) {
        const collectedItems = [];
        
        for (let i = this.activeCollectibles.length - 1; i >= 0; i--) {
            const collectible = this.activeCollectibles[i];
            
            if (collectible.active && collectible.mesh) {
                const collectiblePos = new THREE.Vector3();
                collectiblePos.setFromMatrixPosition(collectible.mesh.matrixWorld);
                
                // Check for collision
                if (collectiblePos.distanceTo(heroPos) < radius) {
                    // Collect the item
                    collectible.collect();
                    collectedItems.push(collectible.type);
                    this.activeCollectibles.splice(i, 1);
                }
            }
        }
        
        return collectedItems;
    }

    reset() {
        // Reset all active collectibles
        for (const collectible of this.activeCollectibles) {
            collectible.active = false;
            collectible.mesh.visible = false;
        }
        
        this.activeCollectibles = [];
    }
} 