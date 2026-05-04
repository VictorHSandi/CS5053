/**
 * SoundManager handles runtime-created game audio with the Web Audio API.
 * No external files needed. Call init() once, then use the play* methods.
 */
export type SoundtrackMode = "classic" | "epic";

export class SoundManager {
    private _ctx: AudioContext | null = null;
    private _masterGain!: GainNode;
    private _musicGain!: GainNode;
    private _sfxGain!: GainNode;
    private _musicLoop: ReturnType<typeof setInterval> | null = null;
    private _pigOinkLoop: ReturnType<typeof setInterval> | null = null;
    private _started = false;
    private _musicVolume = 0.65;
    private _sfxVolume = 0.7;
    private _soundtrackMode: SoundtrackMode = "classic";
    private _overrideMode: SoundtrackMode | null = null;

    // ── Bootstrap ─────────────────────────────────────────

    /**
     * Must be called from a user gesture (click/keydown) due to browser
     * autoplay policy. Safe to call multiple times — only inits once.
     */
    init(): void {
        if (this._started) return;
        this._started = true;

        this._ctx = new AudioContext();
        this._masterGain = this._ctx.createGain();
        this._masterGain.gain.value = 1;
        this._masterGain.connect(this._ctx.destination);

        this._musicGain = this._ctx.createGain();
        this._sfxGain = this._ctx.createGain();
        this._musicGain.connect(this._masterGain);
        this._sfxGain.connect(this._masterGain);

        this.setMusicVolume(this._musicVolume);
        this.setSfxVolume(this._sfxVolume);

        this._startBackgroundMusic();
    }

    setSoundtrackMode(mode: SoundtrackMode): void {
        this._soundtrackMode = mode;
        if (!this._overrideMode) {
            this._restartBackgroundMusic();
        }
    }

    get soundtrackMode(): SoundtrackMode {
        return this._soundtrackMode;
    }

    playCreditsTheme(): void {
        this._overrideMode = "epic";
        this._restartBackgroundMusic();
    }

    clearCreditsThemeOverride(): void {
        this._overrideMode = null;
        this._restartBackgroundMusic();
    }

    setMusicVolume(volume: number): void {
        this._musicVolume = this._clamp01(volume);
        if (this._musicGain) {
            this._musicGain.gain.value = this._musicVolume;
        }
    }

    setSfxVolume(volume: number): void {
        this._sfxVolume = this._clamp01(volume);
        if (this._sfxGain) {
            this._sfxGain.gain.value = this._sfxVolume;
        }
    }

    get musicVolume(): number {
        return this._musicVolume;
    }

    get sfxVolume(): number {
        return this._sfxVolume;
    }

    dispose(): void {
        if (this._musicLoop) clearInterval(this._musicLoop);
        if (this._pigOinkLoop) clearInterval(this._pigOinkLoop);
        this._ctx?.close();
    }

    // ── Background Music ──────────────────────────────────
    // A looping upbeat cartoon melody built from simple oscillators.
    // The melody repeats every ~4 seconds.

    private _startBackgroundMusic(): void {
        if (!this._ctx) return;

        const mode = this._overrideMode ?? this._soundtrackMode;
        if (mode === "epic") {
            this._startEpicBackgroundMusic();
            return;
        }

        // Pentatonic scale notes (Hz) — cheerful, hard to sound bad
        const notes = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3];
        // Melody pattern — indices into notes array
        const melody = [0, 2, 4, 5, 4, 2, 3, 1, 0, 2, 4, 7, 6, 4, 5, 3];
        const bpm = 145;
        const stepSec = 60 / bpm / 2; // eighth notes

        let step = 0;
        const tick = () => {
            if (!this._ctx || this._ctx.state === "closed") return;
            const freq = notes[melody[step % melody.length]];
            this._playTone(freq, stepSec * 0.7, 0.18, "square", "music");
            // Bass note every 4 steps
            if (step % 4 === 0) {
                this._playTone(notes[melody[step % melody.length]] / 2, stepSec * 1.8, 0.12, "triangle", "music");
            }
            step++;
        };

        tick();
        this._musicLoop = setInterval(tick, stepSec * 1000);
    }

    private _startEpicBackgroundMusic(): void {
        if (!this._ctx) return;

        const notes = [130.8, 164.8, 196.0, 220.0, 261.6, 329.6, 392.0, 440.0];
        const melody = [0, 2, 4, 6, 7, 6, 4, 2, 0, 3, 5, 7, 6, 5, 3, 2];
        const bpm = 96;
        const stepSec = 60 / bpm / 2;

        let step = 0;
        const tick = () => {
            if (!this._ctx || this._ctx.state === "closed") return;
            const freq = notes[melody[step % melody.length]];
            this._playTone(freq, stepSec * 1.2, 0.18, "sawtooth", "music");
            this._playTone(freq / 2, stepSec * 1.9, 0.11, "triangle", "music");
            if (step % 4 === 0) {
                this._playTone(freq * 2, stepSec * 0.55, 0.08, "square", "music");
            }
            step++;
        };

        tick();
        this._musicLoop = setInterval(tick, stepSec * 1000);
    }

    // ── Sound Effects ─────────────────────────────────────

    /** Whoosh + twang when bird is launched from slingshot */
    playLaunch(): void {
        if (!this._ctx) return;
        const ctx = this._ctx;
        const now = ctx.currentTime;

        // Elastic twang — descending pitch burst
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this._sfxGain);

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);

        // Whoosh — filtered noise
        this._playNoise(0.35, 0.25, 1200, 200);
    }

    /** Thud when bird hits a wood obstacle */
    playHitObstacle(): void {
        if (!this._ctx) return;
        const ctx = this._ctx;
        const now = ctx.currentTime;

        // Low thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this._sfxGain);

        osc.type = "sine";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);

        // Wood crack — short noise burst
        this._playNoise(0.12, 0.4, 800, 3000);
    }

    /** Splat when bird hits a pig */
    playHitPig(): void {
        if (!this._ctx) return;
        const ctx = this._ctx;
        const now = ctx.currentTime;

        // Cartoon boing
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this._sfxGain);

        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);

        // Short squeal
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(this._sfxGain);
        osc2.type = "square";
        osc2.frequency.setValueAtTime(900, now);
        osc2.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc2.start(now);
        osc2.stop(now + 0.18);
    }

    /** Oink — pig idle sound, called on a random timer */
    playPigOink(): void {
        if (!this._ctx) return;
        const ctx = this._ctx;
        const now = ctx.currentTime;

        // Two-note oink: short nasal grunt
        const freqs = [320, 260];
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = 600;
            filter.Q.value = 2;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this._sfxGain);

            osc.type = "sawtooth";
            const t = now + i * 0.12;
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + 0.1);
            gain.gain.setValueAtTime(0.0, t);
            gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            osc.start(t);
            osc.stop(t + 0.15);
        });
    }

    // ── Pig idle oink loop ────────────────────────────────

    /** Start random pig oinks every 4–10 seconds while pigs are alive. */
    startPigOinks(getAlivePigCount: () => number): void {
        if (this._pigOinkLoop) return;
        const schedule = () => {
            this._pigOinkLoop = setTimeout(() => {
                if (getAlivePigCount() > 0) {
                    this.playPigOink();
                }
                schedule();
            }, 4000 + Math.random() * 6000) as unknown as ReturnType<typeof setInterval>;
        };
        schedule();
    }

    stopPigOinks(): void {
        if (this._pigOinkLoop) {
            clearTimeout(this._pigOinkLoop as unknown as ReturnType<typeof setTimeout>);
            this._pigOinkLoop = null;
        }
    }

    // ── Helpers ───────────────────────────────────────────

    private _playTone(
        freq: number,
        duration: number,
        volume: number,
        type: OscillatorType,
        channel: "music" | "sfx" = "sfx",
    ): void {
        if (!this._ctx) return;
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(channel === "music" ? this._musicGain : this._sfxGain);
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.start(now);
        osc.stop(now + duration);
    }

    private _playNoise(
        duration: number,
        volume: number,
        freqStart: number,
        freqEnd: number,
    ): void {
        if (!this._ctx) return;
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(freqStart, now);
        filter.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this._sfxGain);
        source.start(now);
        source.stop(now + duration);
    }

    private _clamp01(value: number): number {
        if (!Number.isFinite(value)) return 0;
        return Math.max(0, Math.min(1, value));
    }

    private _restartBackgroundMusic(): void {
        if (!this._started) return;
        if (this._musicLoop) {
            clearInterval(this._musicLoop);
            this._musicLoop = null;
        }
        this._startBackgroundMusic();
    }
}