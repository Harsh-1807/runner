import * as THREE from 'three';

export class WorldManager {
    constructor(scene, worldRadius = 26) {
        this.scene = scene;
        this.worldRadius = worldRadius;
        this.rollingGroundSphere = null;
        this.treesInPath = [];
        this.treesPool = [];
        this.rocksPool = [];
        // Fixed path angles for each lane
        this.pathAngleValues = {
            '-1': 1.62, // Left lane
            '0': 1.57,  // Middle lane
            '1': 1.52   // Right lane
        };
        this.createWorld();
        this.createTreesPool(10);
        this.createRocksPool(5);
    }

    createWorld() {
        const sides = 50;
        const tiers = 50;
        const sphereGeometry = new THREE.SphereGeometry(this.worldRadius, sides, tiers);
        
        // Create more attractive ground material
        const sphereMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x7cba3d,
            flatShading: true,
            roughness: 0.8,
            metalness: 0.2
        });

        // Get the position attribute
        const positions = sphereGeometry.attributes.position;

        // Modify the terrain with more pronounced features
        for(let j = 1; j < tiers - 2; j++) {
            for(let i = 0; i < sides; i++) {
                const vertexIndex = (j * sides) + i;
                const x = positions.getX(vertexIndex);
                const y = positions.getY(vertexIndex);
                const z = positions.getZ(vertexIndex);
                
                const vertex = new THREE.Vector3(x, y, z);
                const heightValue = (Math.random() * 0.1) - 0.05;
                const normalized = vertex.clone().normalize();
                vertex.add(normalized.multiplyScalar(heightValue));
                
                positions.setXYZ(vertexIndex, vertex.x, vertex.y, vertex.z);
            }
        }

        positions.needsUpdate = true;

        this.rollingGroundSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.rollingGroundSphere.receiveShadow = true;
        this.rollingGroundSphere.castShadow = true;
        this.rollingGroundSphere.rotation.z = -Math.PI/2;
        this.scene.add(this.rollingGroundSphere);
        this.rollingGroundSphere.position.y = -24;
        this.rollingGroundSphere.position.z = 2;
    }

    createTreesPool(maxTrees = 10) {
        for(let i = 0; i < maxTrees; i++) {
            const tree = this.createTree();
            this.treesPool.push(tree);
        }
    }

    createRocksPool(maxRocks = 5) {
        for(let i = 0; i < maxRocks; i++) {
            const rock = this.createRock();
            this.rocksPool.push(rock);
        }
    }

    createTree() {
        const sides = 12;
        const tiers = 8;
        const scalarMultiplier = (Math.random() * 0.15) + 0.85;
        
        // Create more detailed tree
        const treeGroup = new THREE.Object3D();
        
        // Create more realistic tree top
        const treeGeometry = new THREE.ConeGeometry(0.5 * scalarMultiplier, 1.2 * scalarMultiplier, sides, tiers);
        const treeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2E8B57, // Sea green - more vibrant
            flatShading: true,
            roughness: 0.9,
            metalness: 0.1
        });

        // Randomize tree shape
        const positions = treeGeometry.attributes.position;
        for(let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            const vertex = new THREE.Vector3(x, y, z);
            const random = Math.random() * 0.15;
            vertex.x *= 1 + random;
            vertex.z *= 1 + random;
            vertex.y *= 1 + random * 0.3;
            
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        positions.needsUpdate = true;

        const treeTop = new THREE.Mesh(treeGeometry, treeMaterial);
        treeTop.castShadow = true;
        treeTop.receiveShadow = true;
        treeTop.position.y = 0.9;
        treeTop.rotation.y = Math.random() * Math.PI;
        treeGroup.add(treeTop);

        // Create more detailed trunk
        const trunkGeometry = new THREE.CylinderGeometry(
            0.1 * scalarMultiplier,
            0.12 * scalarMultiplier,
            0.5 * scalarMultiplier,
            8
        );
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown - more vibrant
            flatShading: true,
            roughness: 1,
            metalness: 0
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.position.y = 0.25;
        treeGroup.add(trunk);
        
        // Add slight random rotation
        treeGroup.rotation.x = (Math.random() - 0.5) * 0.2;
        treeGroup.rotation.z = (Math.random() - 0.5) * 0.2;
        treeGroup.userData.obstacleType = 'tree';
        
        return treeGroup;
    }

    createRock() {
        // Create a more visible rock obstacle
        const rockGroup = new THREE.Object3D();
        
        // Create main rock barrier - wider and more visible
        const mainRockGeometry = new THREE.BoxGeometry(2.4, 0.4, 0.6);
        const rockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xA52A2A, // Brown color for better contrast
            flatShading: true,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const mainRock = new THREE.Mesh(mainRockGeometry, rockMaterial);
        mainRock.castShadow = true;
        mainRock.receiveShadow = true;
        mainRock.position.y = 0.2; // Slightly raised
        rockGroup.add(mainRock);
        
        // Add some smaller rocks on top for visual interest
        for (let i = 0; i < 3; i++) {
            const smallRockSize = 0.15 + Math.random() * 0.1;
            const smallRockGeometry = new THREE.DodecahedronGeometry(smallRockSize, 0);
            const smallRockMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513, // Saddle brown
                flatShading: true,
                roughness: 0.9,
                metalness: 0.1
            });
            
            const smallRock = new THREE.Mesh(smallRockGeometry, smallRockMaterial);
            smallRock.castShadow = true;
            smallRock.receiveShadow = true;
            
            // Position small rocks on top of main rock at random positions
            smallRock.position.x = (Math.random() - 0.5) * 1.8;
            smallRock.position.y = 0.4 + (Math.random() * 0.1);
            smallRock.position.z = (Math.random() - 0.5) * 0.4;
            smallRock.rotation.set(
                Math.random() * Math.PI, 
                Math.random() * Math.PI, 
                Math.random() * Math.PI
            );
            
            rockGroup.add(smallRock);
        }
        
        // Tag as horizontal obstacle for collision detection
        rockGroup.userData.obstacleType = 'rock';
        rockGroup.userData.isHorizontalObstacle = true;
        
        return rockGroup;
    }

    addTree(inPath, lane, isLeft) {
        let obstacle;
        const sphericalHelper = new THREE.Spherical();

        if(inPath) {
            // Decide whether to spawn a tree or rock
            const spawnRock = Math.random() < 0.3; // 30% chance for rock
            
            if (spawnRock && this.rocksPool.length > 0) {
                // Get a rock from pool
                obstacle = this.rocksPool.pop();
                console.log('Spawning rock obstacle');
            } else if (this.treesPool.length > 0) {
                // Get a tree from pool
                obstacle = this.treesPool.pop();
                console.log('Spawning tree obstacle');
            } else {
                return; // No obstacles available
            }
            
            obstacle.visible = true;
            this.treesInPath.push(obstacle);
            
            // Use the correct path angle based on lane
            const pathAngle = this.pathAngleValues[lane.toString()];
            
            sphericalHelper.set(
                this.worldRadius - 0.3,
                pathAngle,
                -this.rollingGroundSphere.rotation.x + 4
            );
        } else {
            // Background trees always use tree obstacles
            obstacle = this.createTree();
            const forestAreaAngle = isLeft ? 
                1.70 + Math.random() * 0.15 : 
                1.44 - Math.random() * 0.15;
            sphericalHelper.set(this.worldRadius - 0.3, forestAreaAngle, lane);
        }

        obstacle.position.setFromSpherical(sphericalHelper);
        const rollingGroundVector = this.rollingGroundSphere.position.clone().normalize();
        const treeVector = obstacle.position.clone().normalize();
        obstacle.quaternion.setFromUnitVectors(treeVector, rollingGroundVector);
        
        // Don't add random rotation to rocks as it makes them harder to see
        if (obstacle.userData.obstacleType !== 'rock') {
            obstacle.rotation.x += (Math.random() * 0.2) - 0.1;
            obstacle.rotation.z += (Math.random() * 0.2) - 0.1;
        }

        this.rollingGroundSphere.add(obstacle);
        return obstacle;
    }

    removeTree(obstacle) {
        const index = this.treesInPath.indexOf(obstacle);
        if(index !== -1) {
            this.treesInPath.splice(index, 1);
            obstacle.visible = false;
            
            // Return to appropriate pool
            if (obstacle.userData.obstacleType === 'rock') {
                this.rocksPool.push(obstacle);
            } else {
                this.treesPool.push(obstacle);
            }
        }
    }

    update(rollingSpeed) {
        if(this.rollingGroundSphere) {
            this.rollingGroundSphere.rotation.x += rollingSpeed;
        }
    }
} 