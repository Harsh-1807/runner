import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.setupScene();
    }

    setupScene() {
        // Create sky gradient background
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 0, 128);
        gradient.addColorStop(0, '#1e90ff'); // Dodger blue at top
        gradient.addColorStop(1, '#87ceeb'); // Sky blue at bottom
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;

        // Add subtle ambient lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Add atmospheric fog - subtle depth effect
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.12);
    }

    setupCamera(width, height) {
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.z = 6.5;
        this.camera.position.y = 3.5;
        this.camera.lookAt(0, 0, 0);
        return this.camera;
    }

    setupRenderer(width, height) {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x87ceeb, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setSize(width, height);
        
        // Enable tone mapping for better contrast
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Use sRGB color space for proper color display
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        return this.renderer;
    }

    setupLights() {
        // Main hemisphere light - sky and ground colors
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4a7023, 0.8);
        this.scene.add(hemisphereLight);

        // Main directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(12, 6, -7);
        sun.castShadow = true;

        // Improve shadow quality
        sun.shadow.mapSize.width = 1024; // Increased resolution
        sun.shadow.mapSize.height = 1024;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 50;
        sun.shadow.camera.left = -10;
        sun.shadow.camera.right = 10;
        sun.shadow.camera.top = 10;
        sun.shadow.camera.bottom = -10;
        sun.shadow.bias = -0.001;
        sun.shadow.normalBias = 0.02; // Reduce shadow acne

        this.scene.add(sun);

        // Add fill light for more balanced lighting
        const fillLight = new THREE.DirectionalLight(0xffe6cc, 0.4); // Warm fill light
        fillLight.position.set(-15, 2, 1);
        this.scene.add(fillLight);
        
        // Add rim light for depth
        const rimLight = new THREE.DirectionalLight(0xadd8e6, 0.3); // Light blue rim light
        rimLight.position.set(0, 0, -15);
        this.scene.add(rimLight);

        return { hemisphereLight, sun, fillLight, rimLight };
    }

    // Create dust particles for atmosphere
    createEnvironmentParticles() {
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Distribute particles in a cylinder shape around the path
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 3;
            
            positions[i * 3] = Math.cos(angle) * radius; // x
            positions[i * 3 + 1] = Math.random() * 4; // y
            positions[i * 3 + 2] = Math.sin(angle) * radius; // z
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        
        return particles;
    }

    add(object) {
        this.scene.add(object);
    }

    remove(object) {
        this.scene.remove(object);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    handleResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }
} 