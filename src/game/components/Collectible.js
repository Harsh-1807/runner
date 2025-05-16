import * as THREE from 'three';

export class Collectible {
    constructor(scene, type = 'coin') {
        this.scene = scene;
        this.type = type;
        this.mesh = this.createMesh();
        this.active = false;
        this.rotationSpeed = 0.02;
        this.floatSpeed = 0.005;
        this.floatHeight = 0;
    }

    createMesh() {
        let mesh;

        switch(this.type) {
            case 'magnet':
                mesh = this.createMagnet();
                break;
            case 'shield':
                mesh = this.createShield();
                break;
            case 'doublePoints':
                mesh = this.createDoublePoints();
                break;
            case 'extraLife':
                mesh = this.createExtraLife();
                break;
            case 'coin':
            default:
                mesh = this.createCoin();
                break;
        }

        this.scene.add(mesh);
        return mesh;
    }

    createCoin() {
        const group = new THREE.Group();
        
        // Create gold coin
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFD700, // Gold
            metalness: 1,
            roughness: 0.3,
            emissive: 0xFFD700,
            emissiveIntensity: 0.2
        });
        
        const coin = new THREE.Mesh(geometry, material);
        coin.rotation.x = Math.PI / 2; // Make coin face the player
        group.add(coin);
        
        // Add edge detail to the coin
        const edgeGeometry = new THREE.TorusGeometry(0.3, 0.03, 16, 32);
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0xDAA520, // Darker gold
            metalness: 1,
            roughness: 0.3
        });
        
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edge.rotation.x = Math.PI / 2;
        group.add(edge);
        
        // Add glow
        const glowGeometry = new THREE.CircleGeometry(0.4, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = Math.PI / 2;
        glow.position.z = 0.02;
        group.add(glow);

        group.userData.type = 'coin';
        return group;
    }

    createMagnet() {
        const group = new THREE.Group();
        
        // Create magnet body
        const bodyGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF0000, // Red
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0xFF0000,
            emissiveIntensity: 0.2
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        
        // Create the magnet arms
        const armGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.1);
        
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.2, -0.2, 0);
        leftArm.rotation.z = Math.PI / 2;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.2, -0.2, 0);
        rightArm.rotation.z = Math.PI / 2;
        group.add(rightArm);
        
        group.userData.type = 'magnet';
        return group;
    }

    createShield() {
        const group = new THREE.Group();
        
        // Create shield
        const geometry = new THREE.SphereGeometry(0.4, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const material = new THREE.MeshStandardMaterial({
            color: 0x0088FF, // Blue
            transparent: true,
            opacity: 0.7,
            metalness: 0.9,
            roughness: 0.2,
            side: THREE.DoubleSide
        });
        
        const shield = new THREE.Mesh(geometry, material);
        shield.rotation.x = Math.PI;
        group.add(shield);
        
        // Add glow
        const glowGeometry = new THREE.SphereGeometry(0.42, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x0088FF,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = Math.PI;
        group.add(glow);
        
        group.userData.type = 'shield';
        return group;
    }

    createDoublePoints() {
        const group = new THREE.Group();
        
        // Create star
        const geometry = new THREE.OctahedronGeometry(0.3, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFFF00, // Yellow
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0xFFFF00,
            emissiveIntensity: 0.3
        });
        
        const star = new THREE.Mesh(geometry, material);
        star.rotation.x = Math.PI / 5;
        star.rotation.y = Math.PI / 5;
        group.add(star);
        
        // Add glow
        const glowGeometry = new THREE.OctahedronGeometry(0.4, 0);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.3
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = Math.PI / 5;
        glow.rotation.y = Math.PI / 5;
        group.add(glow);
        
        group.userData.type = 'doublePoints';
        return group;
    }

    createExtraLife() {
        const group = new THREE.Group();
        
        // Create heart
        const heartShape = new THREE.Shape();
        heartShape.moveTo(0, 0);
        heartShape.bezierCurveTo(0, -0.05, -0.15, -0.15, -0.3, -0.05);
        heartShape.bezierCurveTo(-0.4, 0, -0.3, 0.2, 0, 0.3);
        heartShape.bezierCurveTo(0.3, 0.2, 0.4, 0, 0.3, -0.05);
        heartShape.bezierCurveTo(0.15, -0.15, 0, -0.05, 0, 0);
        
        const extrudeSettings = {
            steps: 1,
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelSegments: 3
        };
        
        const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFF4444, // Red
            metalness: 0.2,
            roughness: 0.6,
            emissive: 0xFF0000,
            emissiveIntensity: 0.2
        });
        
        const heart = new THREE.Mesh(geometry, material);
        heart.scale.set(0.7, 0.7, 0.7);
        heart.rotation.z = Math.PI;
        group.add(heart);
        
        group.userData.type = 'extraLife';
        return group;
    }

    update() {
        if (!this.active || !this.mesh) return;

        // Rotate the collectible
        this.mesh.rotation.y += this.rotationSpeed;

        // Make it float up and down
        this.floatHeight += this.floatSpeed;
        this.mesh.position.y = Math.sin(this.floatHeight) * 0.1 + 1.9;
    }

    setPosition(x, y, z) {
        if (this.mesh) {
            this.mesh.position.set(x, y, z);
        }
    }

    collect() {
        this.active = false;
        if (this.mesh) {
            this.mesh.visible = false;
        }
    }

    reset() {
        this.active = true;
        if (this.mesh) {
            this.mesh.visible = true;
        }
    }
} 