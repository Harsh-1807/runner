import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';

export class Hero {
    constructor(scene, radius = 0.2) {
        this.scene = scene;
        this.radius = radius;
        this.baseY = 1.8;
        this.mesh = this.createHeroMesh();
        this.trailEffect = this.createTrailEffect();
        
        this.position = {
            x: 0,
            y: this.baseY,
            z: 4.8
        };
        this.jumping = false;
        this.doubleJumping = false;
        this.bounceValue = 0;
        this.gravity = 0.015;
        this.jumpForce = 0.18;
        this.doubleJumpForce = 0.14;
        this.rollingSpeed = 0;
        this.particleSystem = new ParticleSystem(scene);
        
        this.lastPositions = []; // Store recent positions for trail effect
        this.updatePosition();
        
        // Debug info
        console.log('Hero initialized');
    }

    createHeroMesh() {
        // Create a more interesting hero geometry
        const geometry = new THREE.DodecahedronGeometry(this.radius, 1);
        
        // Create material with a metallic shine
        const material = new THREE.MeshStandardMaterial({
            color: 0x3498db, // Bright blue
            flatShading: true,
            metalness: 0.8,
            roughness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(this.radius * 1.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x3498db,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glow);
        
        this.scene.add(mesh);
        return mesh;
    }
    
    createTrailEffect() {
        const trailLength = 10;
        const trailGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(trailLength * 3);
        
        // Fill with initial positions
        for (let i = 0; i < trailLength; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = this.baseY;
            positions[i * 3 + 2] = 4.8;
        }
        
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create line material with gradient colors
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0x3498db,
            linewidth: 1,
            opacity: 0.7,
            transparent: true
        });
        
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        this.scene.add(trail);
        
        return trail;
    }

    updatePosition() {
        if (!this.mesh) return;
        
        this.mesh.position.set(
            this.position.x,
            this.position.y,
            this.position.z
        );
        
        // Update the trail effect
        this.updateTrail();
    }
    
    updateTrail() {
        if (!this.trailEffect) return;
        
        // Store current position in the trail array
        this.lastPositions.unshift({
            x: this.position.x,
            y: this.position.y,
            z: this.position.z
        });
        
        // Keep only the last 10 positions
        if (this.lastPositions.length > 10) {
            this.lastPositions.pop();
        }
        
        // Update trail geometry
        const positions = this.trailEffect.geometry.attributes.position.array;
        for (let i = 0; i < this.lastPositions.length; i++) {
            const pos = this.lastPositions[i];
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
        }
        
        this.trailEffect.geometry.attributes.position.needsUpdate = true;
    }

    setLane(lane) {
        this.position.x = lane;
    }

    update(deltaTime) {
        // Apply gravity and handle jumping
        if (this.jumping || this.doubleJumping) {
            // Apply gravity
            this.bounceValue -= this.gravity;
            
            // Update position
            this.position.y += this.bounceValue;
            
            // Check if landed
            if (this.position.y <= this.baseY) {
                this.position.y = this.baseY;
                this.jumping = false;
                this.doubleJumping = false;
                this.bounceValue = 0;
                
                // Debug info
                console.log('Hero landed');
            }
        }

        // Update hero rotation for rolling effect
        if (this.mesh) {
            this.mesh.rotation.x -= this.rollingSpeed;
            
            // Add slight wobble when moving
            if (this.jumping || this.doubleJumping) {
                this.mesh.rotation.z = Math.sin(Date.now() * 0.01) * 0.1;
            } else {
                this.mesh.rotation.z = 0;
            }
            
            // Add pulsing effect to the glow
            if (this.mesh.children.length > 0) {
                const glow = this.mesh.children[0];
                const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
                glow.scale.set(scale, scale, scale);
            }
        }

        this.updatePosition();
        
        // Update particle system
        this.particleSystem.update();
    }

    jump() {
        // Debug info
        console.log('Jump called', this.jumping, this.doubleJumping);
        
        if (!this.jumping) {
            // First jump
            this.jumping = true;
            this.bounceValue = this.jumpForce;
            
            // Add slight forward tilt
            if (this.mesh) {
                this.mesh.rotation.x = -0.3;
            }
            
            // Debug info
            console.log('First jump triggered');
        } else if (!this.doubleJumping) {
            // Double jump
            this.doubleJumping = true;
            this.bounceValue = this.doubleJumpForce;
            
            // Add slight backward tilt for style
            if (this.mesh) {
                this.mesh.rotation.x = 0.3;
            }
            
            // Debug info
            console.log('Double jump triggered');
        }
    }

    moveTo(targetX, deltaTime) {
        // Faster lane changing
        this.position.x = THREE.MathUtils.lerp(
            this.position.x,
            targetX,
            5 * deltaTime
        );
        
        // Add tilt when changing lanes
        if (this.mesh && Math.abs(this.position.x - targetX) > 0.01) {
            this.mesh.rotation.z = (targetX - this.position.x) * 0.5;
        }
    }

    getWorldPosition() {
        return this.mesh.position.clone();
    }

    explode() {
        this.particleSystem.explode(this.mesh.position);
        this.mesh.visible = false;
        if (this.trailEffect) {
            this.trailEffect.visible = false;
        }
    }

    reset() {
        if (this.mesh) {
            this.mesh.visible = true;
            this.mesh.rotation.set(0, 0, 0);
        }
        
        if (this.trailEffect) {
            this.trailEffect.visible = true;
        }
        
        this.position.y = this.baseY;
        this.bounceValue = 0;
        this.jumping = false;
        this.doubleJumping = false;
        this.lastPositions = [];
        this.updatePosition();
    }
} 