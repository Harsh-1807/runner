import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particleCount = 20;
        this.particles = this.createParticles();
        this.explosionPower = 1.07;
        this.particles.visible = false;
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        
        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xfffafa,
            size: 0.2
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        return particles;
    }

    explode(position) {
        this.particles.position.copy(position);
        
        const positions = this.particles.geometry.attributes.position.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] = -0.2 + Math.random() * 0.4;
            positions[i * 3 + 1] = -0.2 + Math.random() * 0.4;
            positions[i * 3 + 2] = -0.2 + Math.random() * 0.4;
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
        this.explosionPower = 1.07;
        this.particles.visible = true;
    }

    update() {
        if (!this.particles.visible) return;
        
        const positions = this.particles.geometry.attributes.position.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] *= this.explosionPower;
            positions[i * 3 + 1] *= this.explosionPower;
            positions[i * 3 + 2] *= this.explosionPower;
        }
        
        if (this.explosionPower > 1.005) {
            this.explosionPower -= 0.001;
        } else {
            this.particles.visible = false;
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
    }
} 