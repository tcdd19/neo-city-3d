// Web Audio Synthesizer for Neo City 3D
export class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(freq = 440, duration = 0.12, type = 'sine', gainVal = 0.12) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playBuild() {
    this.playTone(260, 0.1, 'triangle', 0.15);
    setTimeout(() => this.playTone(390, 0.14, 'sine', 0.14), 60);
    setTimeout(() => this.playTone(520, 0.18, 'sine', 0.12), 120);
  }

  playDemolish() {
    this.playTone(150, 0.22, 'sawtooth', 0.14);
    setTimeout(() => this.playTone(95, 0.25, 'triangle', 0.15), 70);
  }

  playDrop(combo = 1, isPerfect = false) {
    const base = 320 + Math.min(combo, 10) * 45;
    this.playTone(base, 0.14, 'triangle', 0.18);
    if (isPerfect) {
      setTimeout(() => this.playTone(base * 1.25, 0.16, 'sine', 0.16), 70);
      setTimeout(() => this.playTone(base * 1.5, 0.24, 'sine', 0.16), 140);
    }
  }

  playMiss() {
    this.playTone(180, 0.25, 'sawtooth', 0.18);
    setTimeout(() => this.playTone(130, 0.32, 'sawtooth', 0.16), 110);
  }

  playThunder() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 1.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.45));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(190, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }
}
