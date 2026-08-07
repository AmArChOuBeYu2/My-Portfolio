/* ==========================================================================
   AMAR CHOUBEY PORTFOLIO — INTERSTELLAR ACOUSTIC SOUND ENGINE (WEB AUDIO API)
   Hans Zimmer-inspired Space Organ & Cosmic Ambient Synthesizer
   ========================================================================== */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.masterGain = null;
        this.organOscillators = [];
        this.interstellarInterval = null;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
    }

    async play() {
        try {
            if (!this.ctx) this.init();
            if (this.ctx && this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }
            if (!this.isPlaying) {
                this.startInterstellar();
                this.isPlaying = true;
            }
            return true;
        } catch (err) {
            console.warn('Audio playback prevented or failed:', err);
            return false;
        }
    }

    pause() {
        if (this.isPlaying) {
            this.stopInterstellar();
            this.isPlaying = false;
        }
        if (this.ctx && this.ctx.state === 'running') {
            try {
                this.ctx.suspend();
            } catch (e) {}
        }
    }

    stop() {
        this.pause();
    }

    reset() {
        this.stop();
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
        return this.isPlaying;
    }

    startInterstellar() {
        if (!this.ctx) return;

        // Interstellar-inspired arpeggio sequence notes (Frequencies in Hz)
        // Inspired by Hans Zimmer: A minor / F major / C major / G major progression
        const notes = [
            220.00, 261.63, 329.63, 440.00, // A3, C4, E4, A4
            174.61, 220.00, 261.63, 349.23, // F3, A3, C4, F4
            130.81, 164.81, 196.00, 261.63, // C3, E3, G3, C4
            196.00, 246.94, 293.66, 392.00  // G3, B3, D4, G4
        ];

        let noteIdx = 0;

        const playOrganNote = (freq) => {
            if (!this.isPlaying) return;
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();

            // Pipe organ timbre synthesis
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime); // Octave octave harmonic

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, this.ctx.currentTime);

            noteGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
            noteGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);

            osc.connect(filter);
            osc2.connect(filter);
            filter.connect(noteGain);
            noteGain.connect(this.masterGain);

            osc.start();
            osc2.start();
            osc.stop(this.ctx.currentTime + 0.85);
            osc2.stop(this.ctx.currentTime + 0.85);
        };

        this.interstellarInterval = setInterval(() => {
            playOrganNote(notes[noteIdx % notes.length]);
            noteIdx++;
        }, 320);
    }

    stopInterstellar() {
        if (this.interstellarInterval) {
            clearInterval(this.interstellarInterval);
            this.interstellarInterval = null;
        }
    }

    playChime() {
        if (!this.ctx || !this.isPlaying) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, this.ctx.currentTime + 0.3); // C6

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }
}

window.soundEngine = new SoundEngine();
window.audio = window.soundEngine;
