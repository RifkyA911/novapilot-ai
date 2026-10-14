/**
 * NovaPilot AI Corporate Sound Engine
 * Synthesizes ultra-clean, modern, corporate AI sound design
 * using the Web Audio API (Zero external MP3 dependencies, 100% offline).
 */

class SoundEngine {
	private ctx: AudioContext | null = null;
	private _enabled: boolean = true;

	constructor() {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("novapilot_sound_enabled");
			if (saved !== null) {
				this._enabled = saved === "true";
			}
		}
	}

	get enabled(): boolean {
		return this._enabled;
	}

	set enabled(val: boolean) {
		this._enabled = val;
		if (typeof window !== "undefined") {
			localStorage.setItem("novapilot_sound_enabled", String(val));
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
	 * Inbound Message: AI Corporate Glass Chime
	 * High-tech, subtle, harmonic dual-tone (D5 587.33Hz -> A5 880Hz)
	 * Clean attack with soft exponential cosine release.
	 */
	playInboundPing(): void {
		if (!this._enabled) return;
		const ctx = this.getContext();
		if (!ctx) return;

		try {
			const now = ctx.currentTime;

			// Primary Note: D5 (587.33 Hz) -> A5 (880 Hz)
			const osc1 = ctx.createOscillator();
			const gain1 = ctx.createGain();
			osc1.type = "sine";
			osc1.frequency.setValueAtTime(587.33, now);
			osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.08);

			gain1.gain.setValueAtTime(0, now);
			gain1.gain.linearRampToValueAtTime(0.18, now + 0.015);
			gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

			osc1.connect(gain1);
			gain1.connect(ctx.destination);
			osc1.start(now);
			osc1.stop(now + 0.33);

			// Shimmer Overtone: E6 (1318.5 Hz)
			const osc2 = ctx.createOscillator();
			const gain2 = ctx.createGain();
			osc2.type = "triangle";
			osc2.frequency.setValueAtTime(1174.66, now + 0.04);
			osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12);

			gain2.gain.setValueAtTime(0, now + 0.04);
			gain2.gain.linearRampToValueAtTime(0.07, now + 0.05);
			gain2.gain.exponentialRampToValueAtTime(0.0005, now + 0.28);

			osc2.connect(gain2);
			gain2.connect(ctx.destination);
			osc2.start(now + 0.04);
			osc2.stop(now + 0.29);
		} catch (e) {
			console.debug("Audio play skipped:", e);
		}
	}

	/**
	 * Action / Approval: Ascending Major Triad
	 * Satisfying confirmation chord (F#5 -> A5 -> D6)
	 */
	playActionChime(): void {
		if (!this._enabled) return;
		const ctx = this.getContext();
		if (!ctx) return;

		try {
			const now = ctx.currentTime;
			const notes = [739.99, 880.0, 1174.66]; // F#5, A5, D6

			notes.forEach((freq, i) => {
				const start = now + i * 0.06;
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();

				osc.type = "sine";
				osc.frequency.setValueAtTime(freq, start);

				gain.gain.setValueAtTime(0, start);
				gain.gain.linearRampToValueAtTime(0.14, start + 0.015);
				gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start(start);
				osc.stop(start + 0.36);
			});
		} catch (e) {
			console.debug("Audio play skipped:", e);
		}
	}

	/**
	 * Soft Alert / Warning
	 */
	playAlertChime(): void {
		if (!this._enabled) return;
		const ctx = this.getContext();
		if (!ctx) return;

		try {
			const now = ctx.currentTime;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = "sine";
			osc.frequency.setValueAtTime(440, now);
			osc.frequency.exponentialRampToValueAtTime(370, now + 0.15);

			gain.gain.setValueAtTime(0, now);
			gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.26);
		} catch (e) {
			console.debug("Audio play skipped:", e);
		}
	}
}

export const sound = new SoundEngine();
