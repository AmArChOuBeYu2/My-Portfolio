/* ==========================================================================
   AMAR CHOUBEY PORTFOLIO — INTERACTIVITY, CURSOR & SCRAPBOOK DECK
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initCustomCursor();
    initProjectCardInteractions();
    initWhisperModal();
    initSkillChipToggles();
});

// Custom Follower Cursor
function initCustomCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');

    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    });

    function renderCursor() {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;

        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(renderCursor);
    }
    renderCursor();

    // Hover effect on interactive elements
    const hoverElements = document.querySelectorAll('a, button, .glass-card, .skill-chip, .project-card');
    hoverElements.forEach((el) => {
        el.addEventListener('mouseenter', () => {
            ring.style.width = '54px';
            ring.style.height = '54px';
            ring.style.borderColor = 'var(--accent-terracotta)';
        });
        el.addEventListener('mouseleave', () => {
            ring.style.width = '36px';
            ring.style.height = '36px';
            ring.style.borderColor = 'var(--accent-sage)';
        });
    });
}

// Jackie Zhang-Inspired Project Deck Dragging / Hover Tilt
function initProjectCardInteractions() {
    const cards = document.querySelectorAll('.project-card');

    cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            const tiltX = (y / rect.height) * -8;
            const tiltY = (x / rect.width) * 8;

            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });
}

// Spatial Whisper Modal & Dynamic Creation
function initWhisperModal() {
    const openBtn = document.getElementById('open-whisper-modal');
    const closeBtn = document.getElementById('close-whisper-modal');
    const modal = document.getElementById('whisper-modal');
    const form = document.getElementById('whisper-form');
    const grid = document.getElementById('whispers-list');

    if (!modal) return;

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Default initial whispers
    const defaultWhispers = [
        { author: 'Sarah K.', text: 'Anchor dashboard demo looks super clean! 🔥' },
        { author: 'DevTeam', text: 'Loved the 3D WebGL physics and calm colors!' },
        { author: 'NIAT Peer', text: 'Kisan Saathi vision model is brilliant. 🌾' }
    ];

    defaultWhispers.forEach((w) => appendWhisper(w.author, w.text));

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('whisper-name').value.trim();
            const msg = document.getElementById('whisper-msg').value.trim();

            if (name && msg) {
                appendWhisper(name, msg);

                // Add to 3D canvas
                if (window.world3D) {
                    window.world3D.addWhisperNode(name, msg);
                }

                // Chime sound
                if (window.soundEngine) {
                    window.soundEngine.playChime();
                }

                form.reset();
                modal.classList.remove('active');
            }
        });
    }

    function appendWhisper(author, text) {
        if (!grid) return;
        const card = document.createElement('div');
        card.className = 'whisper-card';
        card.innerHTML = `
            <div class="whisper-author"><i data-lucide="message-square"></i> @${author}</div>
            <div class="whisper-text">"${text}"</div>
        `;
        grid.prepend(card);
        if (window.lucide) lucide.createIcons();
    }
}

// Skill Chip Filter Toggles
function initSkillChipToggles() {
    const chips = document.querySelectorAll('.skill-chip');
    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            if (window.soundEngine) window.soundEngine.playChime();
        });
    });
}
