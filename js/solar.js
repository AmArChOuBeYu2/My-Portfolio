/* ==========================================================================
   AMAR CHOUBEY — NASA-GRADE 3D SOLAR SYSTEM ENGINE (THREE.JS + GSAP)
   Selection Glow Aura, Comets, Black Hole Easter Egg, Procedural Shaders, WASD
   ========================================================================== */

class SolarAudioTrack {
    constructor(src) {
        this.audio = new Audio(src);
        this.audio.loop = true;
        this.audio.volume = 0.7;
        this.isPlaying = false;
    }

    async play() {
        try {
            await this.audio.play();
            this.isPlaying = true;
            return true;
        } catch (err) {
            console.warn('Solar audio play blocked or failed:', err);
            return false;
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
    }

    stop() {
        this.pause();
        this.audio.currentTime = 0;
    }

    setVolume(vol) {
        this.audio.volume = Math.max(0, Math.min(1, vol));
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
        return this.isPlaying;
    }
}

class SolarSystem {
    constructor() {
        this.container = document.getElementById('solar-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 3500);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });

        this.controls = null;
        this.planets = {};
        this.activePlanet = 'sun';
        this.isFreeFlight = false;

        // Visual Effects
        this.selectionGlowMesh = null;
        this.cometGroup = null;
        this.blackHoleGroup = null;

        // WASD Flight controls
        this.keys = {
            w: false, a: false, s: false, d: false,
            space: false, shift: false,
            ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
        };
        this.flightSpeed = 0.65;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.init();
    }

    init() {
        // Instant smooth page reveal
        requestAnimationFrame(() => {
            document.body.classList.add('loaded');
        });

        // High-performance renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls (Enabled by default for free 3D camera exploration)
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enabled = true;

        // Initial Camera Position
        this.camera.position.set(0, 10, 32);

        // Lighting System
        const ambientLight = new THREE.AmbientLight(0x222238, 0.95);
        this.scene.add(ambientLight);

        // Sun Point Light (Optimized Shadow Map)
        this.sunLight = new THREE.PointLight(0xFFF3E0, 3.5, 600);
        this.sunLight.position.set(0, 0, 0);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.bias = -0.0005;
        this.scene.add(this.sunLight);

        // Build Environment & Celestial Objects
        this.createSelectionGlowMesh();
        this.createDeepGalaxyBackground();
        this.createSun();
        this.createPlanets();
        this.createAsteroidBelt();
        this.createComet();
        this.createBlackHoleEasterEgg();

        // Audio & Telemetry Controller
        this.initSolarAudioController();

        // Event Listeners
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('click', (e) => this.onPlanetClick(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));

        this.setupDockListeners();
        this.setupHUDListeners();

        // Start render loop
        this.animate();
    }

    createSelectionGlowMesh() {
        // Selection Aura Sphere
        const glowGeo = new THREE.SphereGeometry(1, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00F0FF,
            transparent: true,
            opacity: 0.35,
            side: THREE.BackSide
        });
        this.selectionGlowMesh = new THREE.Mesh(glowGeo, glowMat);

        // Selection Wireframe Ring
        const ringGeo = new THREE.RingGeometry(1.2, 1.38, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00F0FF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85
        });
        this.selectionRingMesh = new THREE.Mesh(ringGeo, ringMat);
        this.selectionRingMesh.rotation.x = Math.PI / 2;
        this.selectionGlowMesh.add(this.selectionRingMesh);

        this.scene.add(this.selectionGlowMesh);
    }

    createDeepGalaxyBackground() {
        // Dense Starfield
        const starCount = 6500;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            starPos[i] = (Math.random() - 0.5) * 2000;
            starPos[i + 1] = (Math.random() - 0.5) * 2000;
            starPos[i + 2] = (Math.random() - 0.5) * 2000;

            const rand = Math.random();
            if (rand > 0.85) {
                starColors[i] = 1.0; starColors[i+1] = 0.75; starColors[i+2] = 0.4; // Gold
            } else if (rand > 0.5) {
                starColors[i] = 0.4; starColors[i+1] = 0.85; starColors[i+2] = 1.0; // Cyan Blue
            } else {
                starColors[i] = 1.0; starColors[i+1] = 1.0; starColors[i+2] = 1.0; // White
            }
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starMat = new THREE.PointsMaterial({
            size: 1.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.9
        });

        this.starField = new THREE.Points(starGeo, starMat);
        this.scene.add(this.starField);

        // Milky Way Nebula Particle Cloud
        const nebulaCount = 1600;
        const nebulaGeo = new THREE.BufferGeometry();
        const nebulaPos = new Float32Array(nebulaCount * 3);

        for (let i = 0; i < nebulaCount * 3; i += 3) {
            nebulaPos[i] = (Math.random() - 0.5) * 1500;
            nebulaPos[i + 1] = (Math.random() - 0.5) * 500 - 200;
            nebulaPos[i + 2] = (Math.random() - 0.5) * 1500;
        }

        nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
        const nebulaMat = new THREE.PointsMaterial({
            size: 4.0,
            color: 0x5B7C61,
            transparent: true,
            opacity: 0.28
        });
        this.nebula = new THREE.Points(nebulaGeo, nebulaMat);
        this.scene.add(this.nebula);
    }

    createSun() {
        const sunGeo = new THREE.SphereGeometry(3.8, 64, 64);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFB300 });

        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.scene.add(sunMesh);

        // Multi-layer Solar Corona Flares
        const coronaGeo = new THREE.SphereGeometry(4.4, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({
            color: 0xFF8F00,
            transparent: true,
            opacity: 0.45,
            side: THREE.BackSide
        });
        const corona = new THREE.Mesh(coronaGeo, coronaMat);
        sunMesh.add(corona);

        this.planets['sun'] = {
            mesh: sunMesh,
            distance: 0,
            speed: 0,
            angle: 0,
            radius: 3.8,
            name: 'Sun'
        };
    }

    generateProceduralTexture(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        if (type === 'jupiter') {
            ctx.fillStyle = '#C89354';
            ctx.fillRect(0, 0, 512, 256);
            for (let y = 0; y < 256; y += 12) {
                ctx.fillStyle = (y % 24 === 0) ? '#DDA15E' : '#A46B34';
                ctx.fillRect(0, y, 512, 8);
            }
            // Great Red Spot
            ctx.fillStyle = '#B54228';
            ctx.beginPath();
            ctx.ellipse(320, 160, 45, 25, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'earth') {
            ctx.fillStyle = '#1D5592';
            ctx.fillRect(0, 0, 512, 256);
            ctx.fillStyle = '#4E8052';
            ctx.beginPath();
            ctx.ellipse(120, 100, 70, 50, 0, 0, Math.PI * 2);
            ctx.ellipse(340, 140, 90, 60, 0, 0, Math.PI * 2);
            ctx.ellipse(220, 180, 50, 40, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'mars') {
            ctx.fillStyle = '#B84A2A';
            ctx.fillRect(0, 0, 512, 256);
            ctx.fillStyle = '#8C3218';
            ctx.fillRect(0, 80, 512, 90);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 512, 25);
            ctx.fillRect(0, 235, 512, 21);
        } else {
            ctx.fillStyle = '#888888';
            ctx.fillRect(0, 0, 512, 256);
        }

        return new THREE.CanvasTexture(canvas);
    }

    createPlanets() {
        const planetConfigs = [
            { key: 'mercury', name: 'Mercury', size: 0.65, dist: 8, color: 0x8C8C8C, speed: 0.015 },
            { key: 'venus', name: 'Venus', size: 1.0, dist: 12, color: 0xE5A958, speed: 0.011, hasAtmosphere: true },
            { key: 'earth', name: 'Earth (Socials)', size: 1.15, dist: 17, color: 0x2A75D3, speed: 0.008, isEarth: true },
            { key: 'mars', name: 'Mars', size: 0.78, dist: 23, color: 0xC84B31, speed: 0.006, isMars: true },
            { key: 'jupiter', name: 'Jupiter', size: 2.3, dist: 33, color: 0xDDA15E, speed: 0.004, isJupiter: true },
            { key: 'saturn', name: 'Saturn', size: 1.9, dist: 44, color: 0xE6C594, speed: 0.003, isSaturn: true },
            { key: 'uranus', name: 'Uranus', size: 1.45, dist: 54, color: 0x64DFDF, speed: 0.002, isUranus: true },
            { key: 'neptune', name: 'Neptune', size: 1.4, dist: 63, color: 0x3F37C9, speed: 0.0015 }
        ];

        planetConfigs.forEach((cfg) => {
            // Orbit Ring Line
            const orbitGeo = new THREE.BufferGeometry();
            const points = [];
            for (let i = 0; i <= 128; i++) {
                const theta = (i / 128) * Math.PI * 2;
                points.push(new THREE.Vector3(Math.cos(theta) * cfg.dist, 0, Math.sin(theta) * cfg.dist));
            }
            orbitGeo.setFromPoints(points);
            const orbitMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.1 });
            const orbitLine = new THREE.Line(orbitGeo, orbitMat);
            this.scene.add(orbitLine);

            // Planet Material Setup
            let matProps = { color: cfg.color, roughness: 0.5, metalness: 0.15 };
            if (cfg.isJupiter) matProps.map = this.generateProceduralTexture('jupiter');
            if (cfg.isEarth) matProps.map = this.generateProceduralTexture('earth');
            if (cfg.isMars) matProps.map = this.generateProceduralTexture('mars');

            const geom = new THREE.SphereGeometry(cfg.size, 32, 32);
            const mat = new THREE.MeshStandardMaterial(matProps);

            const mesh = new THREE.Mesh(geom, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const initialAngle = Math.random() * Math.PI * 2;
            mesh.position.x = Math.cos(initialAngle) * cfg.dist;
            mesh.position.z = Math.sin(initialAngle) * cfg.dist;

            // Earth Moon & Satellite Light
            if (cfg.isEarth) {
                const cloudGeo = new THREE.SphereGeometry(cfg.size * 1.03, 32, 32);
                const cloudMat = new THREE.MeshStandardMaterial({
                    color: 0xFFFFFF,
                    transparent: true,
                    opacity: 0.45
                });
                const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
                mesh.add(cloudMesh);
                mesh.userData.clouds = cloudMesh;

                const moonGeom = new THREE.SphereGeometry(0.3, 16, 16);
                const moonMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.8 });
                const moonMesh = new THREE.Mesh(moonGeom, moonMat);
                moonMesh.position.set(2.2, 0, 0);
                mesh.add(moonMesh);
                mesh.userData.moon = moonMesh;

                // Blinking Satellite Beacon
                const satGeom = new THREE.BoxGeometry(0.08, 0.08, 0.12);
                const satMat = new THREE.MeshBasicMaterial({ color: 0x00FF88 });
                const satMesh = new THREE.Mesh(satGeom, satMat);
                satMesh.position.set(-1.8, 0.5, 0);
                mesh.add(satMesh);
            }

            // Saturn Rings
            if (cfg.isSaturn) {
                const ringGeom = new THREE.RingGeometry(cfg.size * 1.4, cfg.size * 2.5, 32);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0xD4B28C,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8
                });
                const ringMesh = new THREE.Mesh(ringGeom, ringMat);
                ringMesh.rotation.x = Math.PI / 2.3;
                mesh.add(ringMesh);
            }

            this.scene.add(mesh);

            this.planets[cfg.key] = {
                mesh: mesh,
                distance: cfg.dist,
                speed: cfg.speed,
                angle: initialAngle,
                radius: cfg.size,
                name: cfg.name
            };
        });
    }

    createAsteroidBelt() {
        const asteroidCount = 480;
        const asteroidGroup = new THREE.Group();

        // Optimized Shared Geometry & Material to eliminate 480 WebGL allocations
        const sharedGeom = new THREE.DodecahedronGeometry(1, 0);
        const sharedMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 });

        for (let i = 0; i < asteroidCount; i++) {
            const dist = 27 + Math.random() * 4;
            const angle = Math.random() * Math.PI * 2;
            const size = 0.06 + Math.random() * 0.16;

            const mesh = new THREE.Mesh(sharedGeom, sharedMat);
            mesh.scale.set(size, size, size);

            mesh.position.x = Math.cos(angle) * dist;
            mesh.position.y = (Math.random() - 0.5) * 1.8;
            mesh.position.z = Math.sin(angle) * dist;

            mesh.rotation.x = Math.random() * Math.PI;
            mesh.rotation.y = Math.random() * Math.PI;

            asteroidGroup.add(mesh);
        }

        this.scene.add(asteroidGroup);
        this.asteroidBelt = asteroidGroup;
    }

    createComet() {
        const cometGroup = new THREE.Group();

        const cometGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const cometMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF });
        const cometHead = new THREE.Mesh(cometGeo, cometMat);
        cometGroup.add(cometHead);

        // Particle tail
        const tailCount = 60;
        const tailGeo = new THREE.BufferGeometry();
        const tailPos = new Float32Array(tailCount * 3);

        for (let i = 0; i < tailCount * 3; i += 3) {
            tailPos[i] = -(i / 3) * 0.15;
            tailPos[i + 1] = (Math.random() - 0.5) * 0.1;
            tailPos[i + 2] = (Math.random() - 0.5) * 0.1;
        }

        tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPos, 3));
        const tailMat = new THREE.PointsMaterial({ color: 0x00F0FF, size: 0.12, transparent: true, opacity: 0.7 });
        const tailPoints = new THREE.Points(tailGeo, tailMat);
        cometGroup.add(tailPoints);

        cometGroup.position.set(-100, 30, -80);
        this.scene.add(cometGroup);
        this.cometGroup = cometGroup;
    }

    createBlackHoleEasterEgg() {
        const bhGroup = new THREE.Group();

        // Event Horizon Center
        const centerGeo = new THREE.SphereGeometry(4, 32, 32);
        const centerMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const centerMesh = new THREE.Mesh(centerGeo, centerMat);
        bhGroup.add(centerMesh);

        // Gravitational Lensing Accretion Ring
        const ringGeo = new THREE.RingGeometry(4.5, 9, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00F0FF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 3;
        bhGroup.add(ringMesh);

        bhGroup.position.set(-350, 180, -450);
        this.scene.add(bhGroup);
        this.blackHoleGroup = bhGroup;
    }

    onKeyDown(e) {
        if (e.key === 'e' || e.key === 'E') {
            this.toggleFreeFlight();
            return;
        }

        const k = e.key.toLowerCase();
        if (this.keys.hasOwnProperty(k)) this.keys[k] = true;
        if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = true;
        if (e.key === ' ') this.keys.space = true;
        if (e.key === 'Shift') this.keys.shift = true;
    }

    onKeyUp(e) {
        const k = e.key.toLowerCase();
        if (this.keys.hasOwnProperty(k)) this.keys[k] = false;
        if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = false;
        if (e.key === ' ') this.keys.space = false;
        if (e.key === 'Shift') this.keys.shift = false;
    }

    updateWASDFlight() {
        if (!this.isFreeFlight || !this.controls) return;

        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);

        const side = new THREE.Vector3();
        side.crossVectors(dir, this.camera.up).normalize();

        const moveVec = new THREE.Vector3(0, 0, 0);

        if (this.keys.w || this.keys.ArrowUp) moveVec.addScaledVector(dir, this.flightSpeed);
        if (this.keys.s || this.keys.ArrowDown) moveVec.addScaledVector(dir, -this.flightSpeed);
        if (this.keys.a || this.keys.ArrowLeft) moveVec.addScaledVector(side, -this.flightSpeed);
        if (this.keys.d || this.keys.ArrowRight) moveVec.addScaledVector(side, this.flightSpeed);
        if (this.keys.space) moveVec.y += this.flightSpeed;
        if (this.keys.shift) moveVec.y -= this.flightSpeed;

        if (moveVec.lengthSq() > 0) {
            this.camera.position.add(moveVec);
            this.controls.target.add(moveVec);
        }
    }

    selectPlanet(key) {
        if (!this.planets[key]) return;
        this.activePlanet = key;

        document.querySelectorAll('.planet-pill').forEach((pill) => {
            pill.classList.toggle('active', pill.getAttribute('data-planet') === key);
        });

        const targetMesh = this.planets[key].mesh;
        const radius = this.planets[key].radius;

        if (this.selectionGlowMesh) {
            const scale = radius * 1.38;
            this.selectionGlowMesh.scale.set(scale, scale, scale);
            this.selectionGlowMesh.position.copy(targetMesh.position);
            this.selectionGlowMesh.visible = true;
        }

        this.updateCardContent(key);

        if (!this.isFreeFlight) {
            const offsetDist = radius * 3.5 + 2;
            const targetX = targetMesh.position.x + offsetDist * 0.7;
            const targetY = targetMesh.position.y + offsetDist * 0.4;
            const targetZ = targetMesh.position.z + offsetDist * 0.7;

            gsap.to(this.camera.position, {
                x: targetX,
                y: targetY,
                z: targetZ,
                duration: 1.8,
                ease: 'power2.inOut',
                onUpdate: () => {
                    this.camera.lookAt(targetMesh.position);
                }
            });
        }
    }

    updateCardContent(key) {
        const card = document.getElementById('celestial-card');
        const tag = document.getElementById('card-tag');
        const title = document.getElementById('card-title');
        const desc = document.getElementById('card-desc');
        const details = document.getElementById('card-details');
        const actions = document.getElementById('card-actions');

        if (!card) return;

        const data = this.getCelestialData(key);

        tag.innerText = `CELESTIAL HUB // ${key.toUpperCase()}`;
        title.innerText = data.title;
        desc.innerText = data.desc;

        details.innerHTML = data.details.map(d => `
            <div class="card-detail-item">
                <i data-lucide="${d.icon}"></i>
                <span>${d.text}</span>
            </div>
        `).join('');

        actions.innerHTML = data.buttons.map(b => `
            <a href="${b.url}" ${b.external ? 'target="_blank" rel="noopener"' : ''} ${b.download ? 'download' : ''} class="card-btn ${b.primary ? 'card-btn-primary' : 'card-btn-secondary'}">
                <i data-lucide="${b.icon}"></i>
                <span>${b.label}</span>
            </a>
        `).join('');

        if (window.lucide) lucide.createIcons();
        card.classList.add('active');
    }

    getCelestialData(key) {
        switch (key) {
            case 'sun':
                return {
                    title: 'Amar Choubey',
                    desc: 'Software Engineering Student @ NIAT (2nd Year) | Full-Stack Developer & AI Builder. Turning ambitious ideas into polished web products.',
                    details: [
                        { icon: 'zap', text: 'Specializes in Next.js, React, Node.js, AI Integrations & Scalable Architecture' },
                        { icon: 'target', text: 'Focus: High-touch UX, clean algorithms, real-world SaaS apps' }
                    ],
                    buttons: [
                        { label: 'View Projects', url: 'index.html#projects', primary: true, icon: 'layers' },
                        { label: 'Download Resume', url: 'Amar Choubey Resume.pdf', download: true, icon: 'download' }
                    ]
                };
            case 'mercury':
                return {
                    title: 'Technical Capabilities',
                    desc: 'Core programming languages, frontend frameworks, backend engines, and database systems.',
                    details: [
                        { icon: 'code-2', text: 'Languages: JavaScript, TypeScript, Python, Java, C++, SQL, HTML5/CSS3' },
                        { icon: 'layers', text: 'Frameworks: React, Next.js, Node.js, Tailwind CSS, REST APIs' },
                        { icon: 'database', text: 'Databases & Cloud: Supabase, MongoDB, Docker, Git & GitHub' }
                    ],
                    buttons: [
                        { label: 'Full Tech Stack', url: 'index.html#skills', primary: true, icon: 'cpu' }
                    ]
                };
            case 'venus':
                return {
                    title: 'Anchor — AI Employee',
                    desc: 'Featured AI product automating customer support, reservation bookings, FAQs, and business ops with a live admin dashboard.',
                    details: [
                        { icon: 'star', text: 'Featured SaaS Application' },
                        { icon: 'cpu', text: 'Tech Stack: Next.js, React, TypeScript, Tailwind CSS, AI APIs, Vercel' }
                    ],
                    buttons: [
                        { label: 'Launch Live App', url: 'https://anchor-fawn-tau.vercel.app/', external: true, primary: true, icon: 'external-link' },
                        { label: 'Admin Dashboard', url: 'https://anchor-fawn-tau.vercel.app/dashboard', external: true, primary: false, icon: 'layout-dashboard' }
                    ]
                };
            case 'earth':
                return {
                    title: 'Earth — Social & Contact Hub',
                    desc: 'Connect directly with Amar Choubey across all professional platforms and social hubs.',
                    details: [
                        { icon: 'github', text: 'GitHub: github.com/AmArChOuBeYu2' },
                        { icon: 'linkedin', text: 'LinkedIn: linkedin.com/in/amar-choubey' },
                        { icon: 'mail', text: 'Email: sc62970@gmail.com' },
                        { icon: 'phone', text: 'Phone: +91 7096093039' }
                    ],
                    buttons: [
                        { label: 'GitHub Profile', url: 'https://github.com/AmArChOuBeYu2', external: true, primary: true, icon: 'github' },
                        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/amar-choubey/', external: true, primary: false, icon: 'linkedin' },
                        { label: 'Direct Email', url: 'mailto:sc62970@gmail.com', primary: false, icon: 'send' }
                    ]
                };
            case 'mars':
                return {
                    title: 'Satyafy & Kisan Saathi',
                    desc: 'AI Fact-Checking verification platform & Smart Agricultural assistant with AI computer vision.',
                    details: [
                        { icon: 'shield-check', text: 'Satyafy: AI news & URL misinformation detector' },
                        { icon: 'sprout', text: 'Kisan Saathi: AI crop disease vision & weather telemetry' }
                    ],
                    buttons: [
                        { label: 'View Repositories', url: 'https://github.com/AmArChOuBeYu2', external: true, primary: true, icon: 'github' }
                    ]
                };
            case 'jupiter':
                return {
                    title: 'NIAT Academic Journey',
                    desc: '2nd Year Student in Software Engineering at NIAT. Building strong foundations in data structures, algorithms, and AI engineering.',
                    details: [
                        { icon: 'graduation-cap', text: 'NIAT — Software Engineering Degree' },
                        { icon: 'award', text: 'Focus: Full-Stack Web, AI Systems, High-Performance WebGL' }
                    ],
                    buttons: [
                        { label: 'Main Portfolio', url: 'index.html', primary: true, icon: 'arrow-left' }
                    ]
                };
            case 'saturn':
                return {
                    title: 'Projects & Code Repositories',
                    desc: 'Explore open-source repositories and product code bases on GitHub.',
                    details: [
                        { icon: 'folder-git-2', text: 'Public Repositories & Demos' },
                        { icon: 'star', text: 'Open for Collaboration & Internship Roles' }
                    ],
                    buttons: [
                        { label: 'Explore GitHub', url: 'https://github.com/AmArChOuBeYu2', external: true, primary: true, icon: 'github' }
                    ]
                };
            case 'uranus':
                return {
                    title: 'System Architecture',
                    desc: 'Clean REST API endpoints, Docker containerization, Supabase backends, and responsive UI performance.',
                    details: [
                        { icon: 'server', text: 'Containerized Deployment & Cloud Microservices' }
                    ],
                    buttons: [
                        { label: 'Back to Home', url: 'index.html', primary: true, icon: 'home' }
                    ]
                };
            case 'neptune':
                return {
                    title: 'Outer Boundary — Get In Touch',
                    desc: 'Ready to collaborate or hire Amar for your next software or AI project?',
                    details: [
                        { icon: 'mail', text: 'Inquiries: sc62970@gmail.com' },
                        { icon: 'phone', text: 'Call/WhatsApp: +91 7096093039' }
                    ],
                    buttons: [
                        { label: 'Send Email', url: 'mailto:sc62970@gmail.com', primary: true, icon: 'send' },
                        { label: 'Download Resume', url: 'Amar Choubey Resume.pdf', download: true, icon: 'download' }
                    ]
                };
            default:
                return { title: 'Solar System', desc: '', details: [], buttons: [] };
        }
    }

    onPointerMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        // Reticle hover tracking
        const reticle = document.getElementById('target-reticle');
        if (reticle) {
            reticle.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const meshes = Object.values(this.planets).map(p => p.mesh);
            const intersects = this.raycaster.intersectObjects(meshes);
            reticle.classList.toggle('active', intersects.length > 0);
        }
    }

    onPlanetClick(e) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const meshes = Object.values(this.planets).map(p => p.mesh);
        const intersects = this.raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            for (const key in this.planets) {
                if (this.planets[key].mesh === hitMesh) {
                    this.selectPlanet(key);
                    if (window.soundEngine) window.soundEngine.playChime();
                    break;
                }
            }
        }
    }

    setupDockListeners() {
        document.querySelectorAll('.planet-pill').forEach((pill) => {
            pill.addEventListener('click', () => {
                const planetKey = pill.getAttribute('data-planet');
                this.selectPlanet(planetKey);
                if (window.soundEngine) window.soundEngine.playChime();
            });
        });
    }

    initSolarAudioController() {
        const audioText = document.getElementById('audio-text');
        const solarVolume = document.getElementById('solar-volume');

        // Instantiate Oppenheimer soundtrack audio
        this.solarAudio = new SolarAudioTrack('Ludwig_G_ransson_-_Can_You_Hear_The_Music_Oppenheimer_Ost_(MP3.cc).mp3');

        // One-time interaction handler (mouse or touch) to comply with browser autoplay policies
        this.firstInteractionHandler = async () => {
            if (this.firstInteractionHandler) {
                window.removeEventListener('mousemove', this.firstInteractionHandler);
                window.removeEventListener('touchstart', this.firstInteractionHandler);
                this.firstInteractionHandler = null;
            }

            try {
                if (this.solarAudio) {
                    const played = await this.solarAudio.play();
                    if (played && audioText) {
                        audioText.innerText = 'SOUND ON';
                    }
                }
            } catch (err) {
                console.warn('Autoplay on interaction failed:', err);
            }
        };

        // Add one-time mousemove and touchstart listeners
        window.addEventListener('mousemove', this.firstInteractionHandler, { once: true });
        window.addEventListener('touchstart', this.firstInteractionHandler, { once: true });

        // Volume slider listener for sound intensity
        if (solarVolume) {
            solarVolume.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (this.solarAudio) {
                    this.solarAudio.setVolume(val);
                }
            });
        }

        // Exit / Cleanup handler when leaving Solar System page
        this.pageUnloadHandler = () => {
            if (this.firstInteractionHandler) {
                window.removeEventListener('mousemove', this.firstInteractionHandler);
                window.removeEventListener('touchstart', this.firstInteractionHandler);
                this.firstInteractionHandler = null;
            }
            if (this.solarAudio) {
                this.solarAudio.stop();
            }
        };

        window.addEventListener('beforeunload', this.pageUnloadHandler);
        window.addEventListener('pagehide', this.pageUnloadHandler);
    }

    deselectPlanet() {
        const card = document.getElementById('celestial-card');
        if (card) card.classList.remove('active');
        if (this.selectionGlowMesh) this.selectionGlowMesh.visible = false;
        document.querySelectorAll('.planet-pill').forEach(p => p.classList.remove('active'));
    }

    setupHUDListeners() {
        const flightBtn = document.getElementById('flight-toggle');
        const audioBtn = document.getElementById('audio-toggle');
        const audioText = document.getElementById('audio-text');
        const cardCloseBtn = document.getElementById('card-close');

        if (cardCloseBtn) {
            cardCloseBtn.addEventListener('click', () => this.deselectPlanet());
        }

        if (flightBtn) {
            flightBtn.addEventListener('click', () => this.toggleFreeFlight());
        }

        if (audioBtn) {
            audioBtn.addEventListener('click', async () => {
                if (this.solarAudio) {
                    if (this.solarAudio.isPlaying) {
                        this.solarAudio.pause();
                        if (audioText) audioText.innerText = 'SOUND OFF';
                    } else {
                        const success = await this.solarAudio.play();
                        if (success && audioText) audioText.innerText = 'SOUND ON';
                    }
                }
            });
        }
    }

    toggleFreeFlight() {
        this.isFreeFlight = !this.isFreeFlight;

        const flightBtn = document.getElementById('flight-toggle');
        const flightText = document.getElementById('flight-text');
        const flightGuide = document.getElementById('flight-guide');

        if (this.controls) {
            this.controls.enabled = this.isFreeFlight;
        }

        if (flightBtn) flightBtn.classList.toggle('active', this.isFreeFlight);
        if (flightText) flightText.innerText = this.isFreeFlight ? 'ORBIT MODE' : 'WASD FREE FLIGHT';

        if (flightGuide) {
            flightGuide.innerHTML = `<i data-lucide="gamepad-2"></i> <span>WASD / Arrows = Fly | Space = Up | Shift = Down | Click & Drag = Look Around</span>`;
            flightGuide.classList.toggle('active', this.isFreeFlight);
            if (window.lucide) lucide.createIcons();
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // WASD Controls
        this.updateWASDFlight();

        // Rotate Planets
        for (const key in this.planets) {
            const p = this.planets[key];
            if (key !== 'sun') {
                p.angle += p.speed * 0.5;
                p.mesh.position.x = Math.cos(p.angle) * p.distance;
                p.mesh.position.z = Math.sin(p.angle) * p.distance;
            }
            p.mesh.rotation.y += 0.005;

            if (key === 'earth') {
                if (p.mesh.userData.clouds) p.mesh.userData.clouds.rotation.y += 0.007;
                if (p.mesh.userData.moon) {
                    const moon = p.mesh.userData.moon;
                    moon.position.x = Math.cos(time * 2) * 2.2;
                    moon.position.z = Math.sin(time * 2) * 2.2;
                }
            }

            // Sync selection glow position
            if (key === this.activePlanet && this.selectionGlowMesh) {
                this.selectionGlowMesh.position.copy(p.mesh.position);
            }
        }

        // Animate Comet Sweep
        if (this.cometGroup) {
            this.cometGroup.position.x += 0.4;
            this.cometGroup.position.z += 0.2;
            if (this.cometGroup.position.x > 120) {
                this.cometGroup.position.set(-120, 35, -90);
            }
        }

        // Animate Black Hole Lensing Ring
        if (this.blackHoleGroup) {
            this.blackHoleGroup.rotation.z += 0.003;
        }

        // Rotate Selection Ring
        if (this.selectionGlowMesh) {
            this.selectionGlowMesh.rotation.y = time * 0.5;
            if (this.selectionRingMesh) this.selectionRingMesh.rotation.z = time * 0.8;
        }

        // Rotate Asteroids & Stars
        if (this.asteroidBelt) this.asteroidBelt.rotation.y += 0.0006;
        if (this.starField) this.starField.rotation.y += 0.0001;

        // Camera Focus
        if (!this.isFreeFlight && this.planets[this.activePlanet]) {
            const targetMesh = this.planets[this.activePlanet].mesh;
            this.camera.lookAt(targetMesh.position);
        } else if (this.controls && this.isFreeFlight) {
            this.controls.update();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.solarSystem = new SolarSystem();
