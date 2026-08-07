/* ==========================================================================
   AMAR CHOUBEY PORTFOLIO — THREE.JS 3D SCENE & PHYSICS WORLD
   ========================================================================== */

class World3D {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.objects = [];
        this.whisperNodes = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.targetCameraPos = { x: 0, y: 0, z: 12 };
        this.currentCameraPos = { x: 0, y: 0, z: 12 };
        
        this.targetCameraLookAt = { x: 0, y: 0, z: 0 };
        this.currentCameraLookAt = { x: 0, y: 0, z: 0 };

        this.init();
    }

    init() {
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Camera initial position
        this.camera.position.set(0, 0, 12);

        // Lighting System (Soft Warm Sage & Terracotta Sunlight)
        const ambientLight = new THREE.AmbientLight(0xF7F6F2, 0.85);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xFFF8EE, 1.1);
        dirLight.position.set(10, 15, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        const fillLight = new THREE.PointLight(0x5B7C61, 0.6, 20); // Sage fill light
        fillLight.position.set(-8, 5, 5);
        this.scene.add(fillLight);

        const warmLight = new THREE.PointLight(0xC86A4B, 0.5, 20); // Terracotta accent light
        warmLight.position.set(8, -5, 5);
        this.scene.add(warmLight);

        // Build Environment Objects & Particle Cloud
        this.createFloatingShapes();
        this.createParticleCloud();

        // Window resize listener
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('click', (e) => this.onPointerClick(e));

        // Start render loop
        this.animate();
    }

    createFloatingShapes() {
        // Materials matching psychological color palette (Refined Minimal & Subtle Matte Aesthetic)
        const sageMat = new THREE.MeshStandardMaterial({
            color: 0x5B7C61,
            roughness: 0.65,
            metalness: 0.02
        });

        const terracottaMat = new THREE.MeshStandardMaterial({
            color: 0xC86A4B,
            roughness: 0.75,
            metalness: 0.0
        });

        const alabasterMat = new THREE.MeshStandardMaterial({
            color: 0xEFECE6,
            roughness: 0.60,
            metalness: 0.02
        });

        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xFFFFFF,
            transmission: 0.85,
            opacity: 0.95,
            transparent: true,
            roughness: 0.25,
            ior: 1.5
        });

        // Geometries
        const geometries = [
            new THREE.IcosahedronGeometry(0.8, 0),
            new THREE.TorusGeometry(0.7, 0.25, 16, 32),
            new THREE.BoxGeometry(1.2, 1.2, 1.2),
            new THREE.OctahedronGeometry(0.9),
            new THREE.DodecahedronGeometry(0.7)
        ];

        const materials = [sageMat, terracottaMat, alabasterMat, glassMat];

        for (let i = 0; i < 18; i++) {
            const geom = geometries[i % geometries.length];
            const mat = materials[i % materials.length];

            const mesh = new THREE.Mesh(geom, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Random positions around the scroll space
            mesh.position.x = (Math.random() - 0.5) * 16;
            mesh.position.y = (Math.random() - 0.5) * 20 - (i * 1.5);
            mesh.position.z = (Math.random() - 0.5) * 8 - 2;

            mesh.rotation.x = Math.random() * Math.PI;
            mesh.rotation.y = Math.random() * Math.PI;

            mesh.userData = {
                rotSpeedX: (Math.random() - 0.5) * 0.015,
                rotSpeedY: (Math.random() - 0.5) * 0.015,
                floatSpeed: Math.random() * 0.002 + 0.001,
                floatOffset: Math.random() * Math.PI * 2,
                initialY: mesh.position.y
            };

            this.scene.add(mesh);
            this.objects.push(mesh);
        }
    }

    createParticleCloud() {
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 30;
            positions[i + 1] = (Math.random() - 0.5) * 40;
            positions[i + 2] = (Math.random() - 0.5) * 20;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x5B7C61,
            size: 0.08,
            transparent: true,
            opacity: 0.4
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    addWhisperNode(author, message) {
        // Create a 3D badge mesh floating in the scene
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Draw soft glass badge on canvas
        ctx.fillStyle = 'rgba(247, 246, 242, 0.9)';
        ctx.roundRect(10, 10, 492, 236, 24);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#5B7C61';
        ctx.stroke();

        ctx.fillStyle = '#5B7C61';
        ctx.font = 'bold 26px monospace';
        ctx.fillText(`@${author}`, 40, 65);

        ctx.fillStyle = '#1B1C1E';
        ctx.font = '30px sans-serif';
        ctx.fillText(`"${message}"`, 40, 140);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);

        sprite.scale.set(3, 1.5, 1);
        sprite.position.set((Math.random() - 0.5) * 6, -8 + (Math.random() - 0.5) * 4, 1);

        this.scene.add(sprite);
        this.whisperNodes.push(sprite);
    }

    onPointerMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    onPointerClick(e) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects);

        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            hitObject.userData.rotSpeedX += (Math.random() - 0.5) * 0.1;
            hitObject.userData.rotSpeedY += (Math.random() - 0.5) * 0.1;
            if (window.soundEngine) window.soundEngine.playChime();
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateCameraForScroll(progress) {
        // Waypoint camera movement as page scrolls
        this.targetCameraPos.y = -progress * 25;
        this.targetCameraPos.x = Math.sin(progress * Math.PI * 2) * 2;
        this.targetCameraPos.z = 12 - Math.cos(progress * Math.PI) * 2;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Apple & Bruno Simon style subtle mouse parallax
        const parallaxStrengthX = 0.8;
        const parallaxStrengthY = 0.6;

        // Mouse right (mouse.x > 0) -> camera position offset left (-x) & points right -> scene turns toward right cursor
        // Mouse up (mouse.y > 0) -> camera position offset down (-y) & points up -> scene turns toward top cursor
        const desiredX = this.targetCameraPos.x - this.mouse.x * parallaxStrengthX;
        const desiredY = this.targetCameraPos.y - this.mouse.y * parallaxStrengthY;
        const desiredZ = this.targetCameraPos.z;

        // Ultra-smooth lerping with inertia (dampening factor 0.04)
        this.currentCameraPos.x += (desiredX - this.currentCameraPos.x) * 0.04;
        this.currentCameraPos.y += (desiredY - this.currentCameraPos.y) * 0.04;
        this.currentCameraPos.z += (desiredZ - this.currentCameraPos.z) * 0.04;

        // Symmetrical lookAt lerping across scroll stages
        const targetLookAtY = this.targetCameraPos.y;
        this.currentCameraLookAt.x += (this.targetCameraLookAt.x - this.currentCameraLookAt.x) * 0.04;
        this.currentCameraLookAt.y += (targetLookAtY - this.currentCameraLookAt.y) * 0.04;

        this.camera.position.set(this.currentCameraPos.x, this.currentCameraPos.y, this.currentCameraPos.z);
        this.camera.lookAt(this.currentCameraLookAt.x, this.currentCameraLookAt.y, 0);

        // Animate floating objects
        this.objects.forEach((obj) => {
            obj.rotation.x += obj.userData.rotSpeedX;
            obj.rotation.y += obj.userData.rotSpeedY;

            // Soft floating motion
            obj.position.y = obj.userData.initialY + Math.sin(time * 2 + obj.userData.floatOffset) * 0.3;
        });

        // Rotate particles subtly
        if (this.particles) {
            this.particles.rotation.y = time * 0.03;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.world3D = new World3D();
