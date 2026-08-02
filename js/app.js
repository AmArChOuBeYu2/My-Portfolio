/* ==========================================================================
   AMAR CHOUBEY PORTFOLIO — MAIN APPLICATION CONTROLLER & HUD TELEMETRY
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initScrollTelemetry();
    initHUDControls();
});

// Preloader Progress & Dismissal
function initPreloader() {
    const preloader = document.getElementById('preloader');
    const loaderBar = document.getElementById('loader-bar');
    const loaderPercent = document.getElementById('loader-percent');

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                if (preloader) preloader.classList.add('hidden');
            }, 300);
        }
        if (loaderBar) loaderBar.style.width = `${progress}%`;
        if (loaderPercent) loaderPercent.innerText = `${progress}%`;
    }, 60);
}

// Scroll Telemetry & Stage Sync
function initScrollTelemetry() {
    const stageEl = document.getElementById('hud-stage');
    const scrollEl = document.getElementById('hud-scroll');
    const fpsEl = document.getElementById('hud-fps');
    const sections = document.querySelectorAll('section[data-stage]');

    // FPS Meter
    let frameCount = 0;
    let lastTime = performance.now();

    function updateFPS() {
        const now = performance.now();
        frameCount++;
        if (now >= lastTime + 1000) {
            const fps = Math.round((frameCount * 1000) / (now - lastTime));
            if (fpsEl) fpsEl.innerText = `${fps}`;
            frameCount = 0;
            lastTime = now;
        }
        requestAnimationFrame(updateFPS);
    }
    updateFPS();

    // Scroll Progress & Active Stage
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100)));

        if (scrollEl) scrollEl.innerText = `${scrollPercent}%`;

        // Update Three.js camera scroll position
        if (window.world3D) {
            window.world3D.updateCameraForScroll(scrollTop / docHeight);
        }

        // Active Section Stage Detection
        sections.forEach((sec) => {
            const rect = sec.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4) {
                const stage = sec.getAttribute('data-stage');
                if (stageEl && stage) stageEl.innerText = stage;
            }
        });
    });
}

// HUD Controls Event Binding
function initHUDControls() {
    const soundBtn = document.getElementById('sound-toggle');
    const soundState = document.getElementById('sound-state');
    const cameraResetBtn = document.getElementById('camera-reset');
    const spawnNodeBtn = document.getElementById('spawn-node');

    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            if (window.soundEngine) {
                const active = window.soundEngine.toggle();
                if (soundState) soundState.innerText = active ? 'SOUND ON' : 'SOUND OFF';
            }
        });
    }

    if (cameraResetBtn) {
        cameraResetBtn.addEventListener('click', () => {
            if (window.world3D) {
                window.world3D.targetCameraPos = { x: 0, y: 0, z: 12 };
            }
        });
    }

    if (spawnNodeBtn) {
        spawnNodeBtn.addEventListener('click', () => {
            if (window.world3D) {
                window.world3D.createFloatingShapes();
                if (window.soundEngine) window.soundEngine.playChime();
            }
        });
    }
}
