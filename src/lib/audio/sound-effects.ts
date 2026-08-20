// Procedural Scrabble Sound Effects using Web Audio API (Zero external assets, instant & reliable)

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!audioCtx) {
		const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
		if (AudioContextClass) {
			audioCtx = new AudioContextClass();
		}
	}
	if (audioCtx && audioCtx.state === 'suspended') {
		audioCtx.resume();
	}
	return audioCtx;
}

export function setMuted(muted: boolean) {
	isMuted = muted;
}

export function getMuted(): boolean {
	return isMuted;
}

// 1. Wood Tile Placement Tap (Subtle thud)
export function playTilePlaceSound() {
	if (isMuted) return;
	const ctx = getAudioContext();
	if (!ctx) return;

	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = 'triangle';
	osc.frequency.setValueAtTime(320, ctx.currentTime);
	osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);

	gain.gain.setValueAtTime(0.18, ctx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.start();
	osc.stop(ctx.currentTime + 0.05);
}

// 2. Recall / Whoosh Sound
export function playRecallSound() {
	if (isMuted) return;
	const ctx = getAudioContext();
	if (!ctx) return;

	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = 'sine';
	osc.frequency.setValueAtTime(240, ctx.currentTime);
	osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.06);

	gain.gain.setValueAtTime(0.12, ctx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.start();
	osc.stop(ctx.currentTime + 0.07);
}

// 3. Shuffle Rack Sound (Double light click)
export function playShuffleSound() {
	if (isMuted) return;
	const ctx = getAudioContext();
	if (!ctx) return;

	[0, 0.04, 0.08].forEach((delay, idx) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = 'triangle';
		const freq = 280 + idx * 40;
		osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
		osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + delay + 0.03);

		gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.04);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(ctx.currentTime + delay);
		osc.stop(ctx.currentTime + delay + 0.04);
	});
}

// 4. Valid Move Success Chime (Pleasant upward major chord)
export function playSuccessSound() {
	if (isMuted) return;
	const ctx = getAudioContext();
	if (!ctx) return;

	const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
	notes.forEach((freq, idx) => {
		const delay = idx * 0.06;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

		gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(ctx.currentTime + delay);
		osc.stop(ctx.currentTime + delay + 0.3);
	});
}

// 5. Bingo Bonus Fanfare (+50 points)
export function playBingoSound() {
	if (isMuted) return;
	const ctx = getAudioContext();
	if (!ctx) return;

	const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
	notes.forEach((freq, idx) => {
		const delay = idx * 0.08;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = 'triangle';
		osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

		gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(ctx.currentTime + delay);
		osc.stop(ctx.currentTime + delay + 0.4);
	});
}

// 6. Invalid Move / Error Warning Sound (Low buzz)
export function playErrorSound() {
	if (isMuted) return;
	const ctx = getAudioContext();
	if (!ctx) return;

	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = 'sawtooth';
	osc.frequency.setValueAtTime(160, ctx.currentTime);
	osc.frequency.setValueAtTime(130, ctx.currentTime + 0.08);

	gain.gain.setValueAtTime(0.14, ctx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.start();
	osc.stop(ctx.currentTime + 0.18);
}

// 7. Emote Pop Sound
export function playEmoteSound() {
	if (isMuted) return;
	const ctx = getAudioContext();
	if (!ctx) return;

	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = 'sine';
	osc.frequency.setValueAtTime(600, ctx.currentTime);
	osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);

	gain.gain.setValueAtTime(0.12, ctx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.start();
	osc.stop(ctx.currentTime + 0.1);
}
