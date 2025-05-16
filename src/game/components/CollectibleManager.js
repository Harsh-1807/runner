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

        // Get an available collectible
        let collectible = null;
        
        // Determine type to spawn based on rarity
        const random = Math.random();
        let typeToSpawn = 'coin';
        
        if (random < 0.01) {
            typeToSpawn = 'extraLife'; // 1% chance
        } else if (random < 0.05) {
            typeToSpawn = 'shield'; // 4% chance
        } else if (random < 0.10) {
            typeToSpawn = 'doublePoints'; // 5% chance
        } else if (random < 0.15) {
            typeToSpawn = 'magnet'; // 5% chance
        }
        
        // Find an inactive collectible of the right type
        for (let i = 0; i < this.collectibles.length; i++) {
            if (!this.collectibles[i].active && this.collectibles[i].type === typeToSpawn) {
                collectible = this.collectibles[i];
                break;
            }
        }
        
        // If no collectible found, create a new one
        if (!collectible) {
            collectible = new Collectible(this.scene, typeToSpawn);
            this.collectibles.push(collectible);
        }
        
        // Pick a random lane
        const lanes = [-1, 0, 1];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        
        // Position the collectible in the chosen lane
        const sphericalHelper = new THREE.Spherical();
        const pathAngle = this.pathAngleValues[lane.toString()];
        
        sphericalHelper.set(
            this.worldRadius - 0.3,
            pathAngle,
            -rollingGroundSphere.rotation.x + 4
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