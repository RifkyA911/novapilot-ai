/**
 * NovaPilot AI Corporate Sound Engine
 * Synthesizes ultra-clean, modern, Sony-grade studio acoustic sound design
 * using the Web Audio API (Zero external MP3 dependencies, 100% offline).
 * 
 * Includes 4 Distinct Professional Sound Themes:
 * 1. Sony Crystal (PlayStation UI Inspired) - Default
 * 2. Sony Xperia Pro (Tokyo Minimal Hi-Fi)
 * 3. Bravia Cinema (Warm Ambient Glass)
 * 4. Cyber Clean (Quantum Glass)
 */

export type SoundTheme = "sony_crystal" | "sony_xperia" | "bravia_cinema" | "cyber_clean";

export interface SoundThemeInfo {
	id: SoundTheme;
	name: string;
	description: string;
	badge: string;
	brand: string;
}

export const SOUND_THEMES: SoundThemeInfo[] = [
	{
		id: "sony_crystal",
		name: "Sony Crystal (PlayStation UI)",
		description: "Lonceng kristal akustik dual-harmonic bernada hangat, jernih, dan berkelas seperti sound design konsol flagship Sony.",
		badge: "Default Sony",
		brand: "Sony PS5"
	},
	{
		id: "sony_xperia",
		name: "Sony Xperia Pro (Tokyo Minimal)",
		description: "Sinyal micro-haptic studio Tokyo yang presisi, ultra-bersih, dan memanjakan telinga tanpa distorsi.",
		badge: "Studio Hi-Fi",
		brand: "Xperia"
	},
	{
		id: "bravia_cinema",
		name: "Bravia Cinema (Warm Ambient)",
		description: "Lonceng resonansi Rhodes sinematik dengan sustain lembut yang ramah untuk ruang kerja on-call tenang.",
		badge: "Cinematic",
		brand: "Bravia"
	},
	{
		id: "cyber_clean",
		name: "Cyber Clean (Quantum Glass)",
		description: "Harmoni kristal digital modern untuk operasi monitoring transaksi berkecepatan tinggi.",
		badge: "Futuristic",
		brand: "Cyber"
	}
];

type SoundListener = () => void;

class SoundEngine {
	private ctx: AudioContext | null = null;
	private _enabled: boolean = true;
	private _navEnabled: boolean = true;
	private _volume: number = 0.7; // 0.0 to 1.0
	private _theme: SoundTheme = "sony_crystal";
	private listeners: Set<SoundListener> = new Set();

	constructor() {
		if (typeof window !== "undefined") {
			const savedEnabled = localStorage.getItem("novapilot_sound_enabled");
			if (savedEnabled !== null) {
				this._enabled = savedEnabled === "true";
			}

			const savedNav = localStorage.getItem("novapilot_sound_nav_enabled");
			if (savedNav !== null) {
				this._navEnabled = savedNav === "true";
			}

			const savedVol = localStorage.getItem("novapilot_sound_volume");
			if (savedVol !== null) {
				const parsed = parseFloat(savedVol);
				if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
					this._volume = parsed;
				}
			}

			const savedTheme = localStorage.getItem("novapilot_sound_theme") as SoundTheme;
			if (savedTheme && ["sony_crystal", "sony_xperia", "bravia_cinema", "cyber_clean"].includes(savedTheme)) {
				this._theme = savedTheme;
			} else {
				this._theme = "sony_crystal";
			}
		}
	}

	subscribe(fn: SoundListener): () => void {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	private notify() {
		this.listeners.forEach(fn => fn());
	}

	get enabled(): boolean {
		return this._enabled;
	}

	set enabled(val: boolean) {
		this._enabled = val;
		if (typeof window !== "undefined") {
			localStorage.setItem("novapilot_sound_enabled", String(val));
		}
		this.notify();
	}

	get navEnabled(): boolean {
		return this._navEnabled;
	}

	set navEnabled(val: boolean) {
		this._navEnabled = val;
		if (typeof window !== "undefined") {
			localStorage.setItem("novapilot_sound_nav_enabled", String(val));
		}
		this.notify();
	}

	get volume(): number {
		return this._volume;
	}

	set volume(val: number) {
		this._volume = Math.max(0, Math.min(1, val));
		if (typeof window !== "undefined") {
			localStorage.setItem("novapilot_sound_volume", String(this._volume));
		}
		this.notify();
	}

	get theme(): SoundTheme {
		return this._theme;
	}

	set theme(val: SoundTheme) {
		if (["sony_crystal", "sony_xperia", "bravia_cinema", "cyber_clean"].includes(val)) {
			this._theme = val;
			if (typeof window !== "undefined") {
				localStorage.setItem("novapilot_sound_theme", val);
			}
			this.notify();
		}
	}

	private getContext(): AudioContext | null {
		if (typeof window === "undefined") return null;
		if (!this.ctx) {
			const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
			if (AudioCtx) {
				this.ctx = new AudioCtx();
			}
		}
		if (this.ctx && this.ctx.state === "suspended") {
			this.ctx.resume().catch(() => {});
		}
		return this.ctx;
	}

	/**
	 * Navigation Menu Item Click: Ultra-subtle haptic tactile switch
	 * Sony Style: Ceramic/glass micro-tap without ear-fatiguing high clicks.
	 */
	playNavClick(themeOverride?: SoundTheme): void {
		if (!this._enabled || !this._navEnabled || this._volume <= 0) return;
		const ctx = this.getContext();
		if (!ctx) return;

		const theme = themeOverride || this._theme;
		const now = ctx.currentTime;
		const masterVol = this._volume;

		try {
			if (theme === "sony_crystal") {
				// Sony PS5 Glass/Ceramic Tap: 220Hz damped body + 1200Hz warm micro-tick
				const filter = ctx.createBiquadFilter();
				filter.type = "lowpass";
				filter.frequency.setValueAtTime(1400, now);
				filter.connect(ctx.destination);

				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = "sine";
				osc.frequency.setValueAtTime(240, now);
				osc.frequency.exponentialRampToValueAtTime(90, now + 0.014);

				gain.gain.setValueAtTime(0, now);
				gain.gain.linearRampToValueAtTime(0.09 * masterVol, now + 0.001);
				gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

				osc.connect(gain);
				gain.connect(filter);
				osc.start(now);
				osc.stop(now + 0.018);

				// Micro-transient surface tick
				const oscTick = ctx.createOscillator();
				const gainTick = ctx.createGain();
				oscTick.type = "triangle";
				oscTick.frequency.setValueAtTime(1500, now);
				oscTick.frequency.exponentialRampToValueAtTime(700, now + 0.007);

				gainTick.gain.setValueAtTime(0, now);
				gainTick.gain.linearRampToValueAtTime(0.025 * masterVol, now + 0.0008);
				gainTick.gain.exponentialRampToValueAtTime(0.0001, now + 0.009);

				oscTick.connect(gainTick);
				gainTick.connect(ctx.destination);
				oscTick.start(now);
				oscTick.stop(now + 0.01);
			} else if (theme === "sony_xperia") {
				// Tokyo Minimal Hi-Fi: Ultra-crisp 10ms micro-thud (340Hz -> 130Hz)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = "sine";
				osc.frequency.setValueAtTime(340, now);
				osc.frequency.exponentialRampToValueAtTime(130, now + 0.011);

				gain.gain.setValueAtTime(0, now);
				gain.gain.linearRampToValueAtTime(0.08 * masterVol, now + 0.0008);
				gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start(now);
				osc.stop(now + 0.013);
			} else if (theme === "bravia_cinema") {
				// Deep acoustic wood thud: 180Hz -> 75Hz
				const filter = ctx.createBiquadFilter();
				filter.type = "lowpass";
				filter.frequency.setValueAtTime(600, now);
				filter.connect(ctx.destination);

				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = "sine";
				osc.frequency.setValueAtTime(180, now);
				osc.frequency.exponentialRampToValueAtTime(75, now + 0.022);

				gain.gain.setValueAtTime(0, now);
				gain.gain.linearRampToValueAtTime(0.12 * masterVol, now + 0.002);
				gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.024);

				osc.connect(gain);
				gain.connect(filter);
				osc.start(now);
				osc.stop(now + 0.026);
			} else {
				// Cyber Clean: Crisp digital micro-click
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = "sine";
				osc.frequency.setValueAtTime(980, now);
				osc.frequency.exponentialRampToValueAtTime(450, now + 0.015);

				gain.gain.setValueAtTime(0, now);
				gain.gain.linearRampToValueAtTime(0.06 * masterVol, now + 0.001);
				gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start(now);
				osc.stop(now + 0.02);
			}
		} catch (e) {
			console.debug("Audio play skipped:", e);
		}
	}

	/**
	 * Inbound Message: Professional Sony Glass Chime
	 * Authentic acoustic harmonic crystal bells with silky smooth sustain.
	 */
	playInboundPing(themeOverride?: SoundTheme): void {
		if (!this._enabled || this._volume <= 0) return;
		const ctx = this.getContext();
		if (!ctx) return;

		const theme = themeOverride || this._theme;
		const now = ctx.currentTime;
		const masterVol = this._volume;

		try {
			if (theme === "sony_crystal") {
				// SONY PLAYSTATION 5 ACOUSTIC CRYSTAL CHIME
				// Pure sine harmonic additive synthesis with warm 3800Hz low-pass filter
				const filter = ctx.createBiquadFilter();
				filter.type = "lowpass";
				filter.frequency.setValueAtTime(3800, now);
				filter.Q.setValueAtTime(1.0, now);
				filter.connect(ctx.destination);

				// 1. Warm Glass Body: G5 (783.99 Hz)
				const oscBody = ctx.createOscillator();
				const gainBody = ctx.createGain();
				oscBody.type = "sine";
				oscBody.frequency.setValueAtTime(783.99, now);
				gainBody.gain.setValueAtTime(0, now);
				gainBody.gain.linearRampToValueAtTime(0.09 * masterVol, now + 0.005);
				gainBody.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
				oscBody.connect(gainBody);
				gainBody.connect(filter);
				oscBody.start(now);
				oscBody.stop(now + 0.40);

				// 2. Primary Note: C6 (1046.50 Hz)
				const osc1 = ctx.createOscillator();
				const gain1 = ctx.createGain();
				osc1.type = "sine";
				osc1.frequency.setValueAtTime(1046.50, now);
				gain1.gain.setValueAtTime(0, now);
				gain1.gain.linearRampToValueAtTime(0.20 * masterVol, now + 0.004);
				gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
				osc1.connect(gain1);
				gain1.connect(filter);
				osc1.start(now);
				osc1.stop(now + 0.50);

				// 3. Perfect Fifth Harmonic: G6 (1567.98 Hz) entering at +40ms
				const osc2 = ctx.createOscillator();
				const gain2 = ctx.createGain();
				osc2.type = "sine";
				osc2.frequency.setValueAtTime(1567.98, now + 0.040);
				gain2.gain.setValueAtTime(0, now + 0.040);
				gain2.gain.linearRampToValueAtTime(0.18 * masterVol, now + 0.045);
				gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);
				osc2.connect(gain2);
				gain2.connect(filter);
				osc2.start(now + 0.040);
				osc2.stop(now + 0.70);

				// 4. Silky Crystal Sparkle: C7 (2093.00 Hz) entering at +72ms
				const osc3 = ctx.createOscillator();
				const gain3 = ctx.createGain();
				osc3.type = "sine";
				osc3.frequency.setValueAtTime(2093.00, now + 0.072);
				gain3.gain.setValueAtTime(0, now + 0.072);
				gain3.gain.linearRampToValueAtTime(0.08 * masterVol, now + 0.078);
				gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
				osc3.connect(gain3);
				gain3.connect(filter);
				osc3.start(now + 0.072);
				osc3.stop(now + 0.60);
			} else if (theme === "sony_xperia") {
				// SONY XPERIA PRO: Tokyo Minimalist Celesta Strike (Eb6 -> Bb6)
				const filter = ctx.createBiquadFilter();
				filter.type = "lowpass";
				filter.frequency.setValueAtTime(4200, now);
				filter.connect(ctx.destination);

				const osc1 = ctx.createOscillator();
				const gain1 = ctx.createGain();
				osc1.type = "sine";
				osc1.frequency.setValueAtTime(1244.51, now); // Eb6
				gain1.gain.setValueAtTime(0, now);
				gain1.gain.linearRampToValueAtTime(0.18 * masterVol, now + 0.003);
				gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
				osc1.connect(gain1);
				gain1.connect(filter);
				osc1.start(now);
				osc1.stop(now + 0.36);

				const osc2 = ctx.createOscillator();
				const gain2 = ctx.createGain();
				osc2.type = "sine";
				osc2.frequency.setValueAtTime(1864.66, now + 0.035); // Bb6
				gain2.gain.setValueAtTime(0, now + 0.035);
				gain2.gain.linearRampToValueAtTime(0.14 * masterVol, now + 0.039);
				gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
				osc2.connect(gain2);
				gain2.connect(filter);
				osc2.start(now + 0.035);
				osc2.stop(now + 0.46);
			} else if (theme === "bravia_cinema") {
				// BRAVIA CINEMA: Warm Rhodes Acoustic Chime (A4 + E5 + A5)
				const filter = ctx.createBiquadFilter();
				filter.type = "lowpass";
				filter.frequency.setValueAtTime(2600, now);
				filter.connect(ctx.destination);

				const notes = [
					{ freq: 440.00, delay: 0.0, vol: 0.14, len: 0.70 },
					{ freq: 659.25, delay: 0.03, vol: 0.16, len: 0.75 },
					{ freq: 880.00, delay: 0.06, vol: 0.12, len: 0.85 }
				];
				notes.forEach(n => {
					const start = now + n.delay;
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.type = "sine";
					osc.frequency.setValueAtTime(n.freq, start);
					gain.gain.setValueAtTime(0, start);
					gain.gain.linearRampToValueAtTime(n.vol * masterVol, start + 0.005);
					gain.gain.exponentialRampToValueAtTime(0.0001, start + n.len);
					osc.connect(gain);
					gain.connect(filter);
					osc.start(start);
					osc.stop(start + n.len + 0.01);
				});
			} else {
				// CYBER CLEAN: Quantum Harmonic Chime (F#6 -> C#7)
				const osc1 = ctx.createOscillator();
				const gain1 = ctx.createGain();
				osc1.type = "sine";
				osc1.frequency.setValueAtTime(1479.98, now); // F#6
				gain1.gain.setValueAtTime(0, now);
				gain1.gain.linearRampToValueAtTime(0.16 * masterVol, now + 0.003);
				gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
				osc1.connect(gain1);
				gain1.connect(ctx.destination);
				osc1.start(now);
				osc1.stop(now + 0.39);

				const osc2 = ctx.createOscillator();
				const gain2 = ctx.createGain();
				osc2.type = "sine";
				osc2.frequency.setValueAtTime(2217.46, now + 0.045); // C#7
				gain2.gain.setValueAtTime(0, now + 0.045);
				gain2.gain.linearRampToValueAtTime(0.12 * masterVol, now + 0.05);
				gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.50);
				osc2.connect(gain2);
				gain2.connect(ctx.destination);
				osc2.start(now + 0.045);
				osc2.stop(now + 0.51);
			}
		} catch (e) {
			console.debug("Audio play skipped:", e);
		}
	}

	/**
	 * Action / Approval: Ascending Major-9th Crystal Chord
	 * Satisfying, inspiring confirmation sound straight from Sony's UI philosophy.
	 */
	playActionChime(themeOverride?: SoundTheme): void {
		if (!this._enabled || this._volume <= 0) return;
		const ctx = this.getContext();
		if (!ctx) return;

		const theme = themeOverride || this._theme;
		const now = ctx.currentTime;
		const masterVol = this._volume;

		try {
			if (theme === "sony_crystal") {
				// Sony PS5 Major-9th Victory Affirmation: D5 -> A5 -> F#6 -> C#7
				const filter = ctx.createBiquadFilter();
				filter.type = "lowpass";
				filter.frequency.setValueAtTime(3600, now);
				filter.connect(ctx.destination);

				const notes = [
					{ freq: 587.33, delay: 0.0, vol: 0.15, len: 0.50 },
					{ freq: 880.00, delay: 0.045, vol: 0.14, len: 0.58 },
					{ freq: 1479.98, delay: 0.090, vol: 0.12, len: 0.65 },
					{ freq: 2217.46, delay: 0.135, vol: 0.07, len: 0.75 }
				];
				notes.forEach(n => {
					const start = now + n.delay;
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.type = "sine";
					osc.frequency.setValueAtTime(n.freq, start);
					gain.gain.setValueAtTime(0, start);
					gain.gain.linearRampToValueAtTime(n.vol * masterVol, start + 0.004);
					gain.gain.exponentialRampToValueAtTime(0.0001, start + n.len);
					osc.connect(gain);
					gain.connect(filter);
					osc.start(start);
					osc.stop(start + n.len + 0.01);
				});
			} else if (theme === "sony_xperia") {
				// Tokyo Pentatonic Triad: Eb5 -> Ab5 -> C6
				const notes = [
					{ freq: 622.25, delay: 0.0, vol: 0.14, len: 0.35 },
					{ freq: 830.61, delay: 0.04, vol: 0.14, len: 0.40 },
					{ freq: 1046.50, delay: 0.08, vol: 0.12, len: 0.48 }
				];
				notes.forEach(n => {
					const start = now + n.delay;
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.type = "sine";
					osc.frequency.setValueAtTime(n.freq, start);
					gain.gain.setValueAtTime(0, start);
					gain.gain.linearRampToValueAtTime(n.vol * masterVol, start + 0.003);
					gain.gain.exponentialRampToValueAtTime(0.0001, start + n.len);
					osc.connect(gain);
					gain.connect(ctx.destination);
					osc.start(start);
					osc.stop(start + n.len + 0.01);
				});
			} else if (theme === "bravia_cinema") {
				// Warm Orchestral Triad: C5 -> G5 -> E6
				const filter = ctx.createBiquadFilter();
				filter.type = "lowpass";
				filter.frequency.setValueAtTime(2800, now);
				filter.connect(ctx.destination);

				const notes = [
					{ freq: 523.25, delay: 0.0, vol: 0.16, len: 0.65 },
					{ freq: 783.99, delay: 0.06, vol: 0.15, len: 0.70 },
					{ freq: 1318.51, delay: 0.12, vol: 0.11, len: 0.80 }
				];
				notes.forEach(n => {
					const start = now + n.delay;
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.type = "sine";
					osc.frequency.setValueAtTime(n.freq, start);
					gain.gain.setValueAtTime(0, start);
					gain.gain.linearRampToValueAtTime(n.vol * masterVol, start + 0.005);
					gain.gain.exponentialRampToValueAtTime(0.0001, start + n.len);
					osc.connect(gain);
					gain.connect(filter);
					osc.start(start);
					osc.stop(start + n.len + 0.01);
				});
			} else {
				// Cyber Clean Triad: F#5 -> B5 -> E6
				const notes = [
					{ freq: 739.99, delay: 0.0, vol: 0.14, len: 0.40 },
					{ freq: 987.77, delay: 0.05, vol: 0.13, len: 0.45 },
					{ freq: 1318.51, delay: 0.10, vol: 0.10, len: 0.50 }
				];
				notes.forEach(n => {
					const start = now + n.delay;
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.type = "sine";
					osc.frequency.setValueAtTime(n.freq, start);
					gain.gain.setValueAtTime(0, start);
					gain.gain.linearRampToValueAtTime(n.vol * masterVol, start + 0.003);
					gain.gain.exponentialRampToValueAtTime(0.0001, start + n.len);
					osc.connect(gain);
					gain.connect(ctx.destination);
					osc.start(start);
					osc.stop(start + n.len + 0.01);
				});
			}
		} catch (e) {
			console.debug("Audio play skipped:", e);
		}
	}

	/**
	 * Soft Alert / Warning
	 * Sony Style: Elegant dual crystal caution tone without jarring annoyance.
	 */
	playAlertChime(themeOverride?: SoundTheme): void {
		if (!this._enabled || this._volume <= 0) return;
		const ctx = this.getContext();
		if (!ctx) return;

		const theme = themeOverride || this._theme;
		const now = ctx.currentTime;
		const masterVol = this._volume;

		try {
			if (theme === "sony_crystal" || theme === "sony_xperia") {
				// Gentle dual crystal pulse
				const filter = ctx.createBiquadFilter();
				filter.type = "lowpass";
				filter.frequency.setValueAtTime(2800, now);
				filter.connect(ctx.destination);

				const pulses = [
					{ notes: [830.61, 1244.51], start: now, len: 0.22, vol: 0.12 },
					{ notes: [659.25, 987.77], start: now + 0.15, len: 0.35, vol: 0.14 }
				];
				pulses.forEach(p => {
					p.notes.forEach(f => {
						const osc = ctx.createOscillator();
						const gain = ctx.createGain();
						osc.type = "sine";
						osc.frequency.setValueAtTime(f, p.start);
						gain.gain.setValueAtTime(0, p.start);
						gain.gain.linearRampToValueAtTime(p.vol * masterVol, p.start + 0.004);
						gain.gain.exponentialRampToValueAtTime(0.0001, p.start + p.len);
						osc.connect(gain);
						gain.connect(filter);
						osc.start(p.start);
						osc.stop(p.start + p.len + 0.01);
					});
				});
			} else if (theme === "bravia_cinema") {
				// Warm gong pulse
				const filter = ctx.createBiquadFilter();
				filter.type = "lowpass";
				filter.frequency.setValueAtTime(1200, now);
				filter.connect(ctx.destination);

				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = "sine";
				osc.frequency.setValueAtTime(320, now);
				osc.frequency.exponentialRampToValueAtTime(260, now + 0.25);

				gain.gain.setValueAtTime(0, now);
				gain.gain.linearRampToValueAtTime(0.18 * masterVol, now + 0.008);
				gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

				osc.connect(gain);
				gain.connect(filter);
				osc.start(now);
				osc.stop(now + 0.40);
			} else {
				// Cyber Clean Warning
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = "sine";
				osc.frequency.setValueAtTime(659.25, now);
				osc.frequency.exponentialRampToValueAtTime(440.00, now + 0.18);

				gain.gain.setValueAtTime(0, now);
				gain.gain.linearRampToValueAtTime(0.14 * masterVol, now + 0.004);
				gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start(now);
				osc.stop(now + 0.30);
			}
		} catch (e) {
			console.debug("Audio play skipped:", e);
		}
	}
}

export const sound = new SoundEngine();
