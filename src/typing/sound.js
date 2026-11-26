// Âm thanh bàn phím cơ tổng hợp bằng Web Audio (không cần tệp âm thanh)
let ctx = null, master = null, noise = null;
let volume = +(localStorage.getItem('thl.type.vol') ?? 0.6);

function init() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = volume;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4;
  master.connect(comp); comp.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
export function setVolume(v) { volume = v; localStorage.setItem('thl.type.vol', v); if (master) master.gain.value = v; }
export const getVolume = () => volume;

const env = (g, t, a, peak, dec) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); };
function thock(t, f, dec, gain) {
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + dec);
  const g = ctx.createGain(); env(g, t, 0.002, gain, dec); o.connect(g); g.connect(master); o.start(t); o.stop(t + dec + 0.05);
}
function clack(t, f, q, dec, gain, type = 'bandpass') {
  const s = ctx.createBufferSource(); s.buffer = noise; s.playbackRate.value = 0.9 + Math.random() * 0.2;
  const bp = ctx.createBiquadFilter(); bp.type = type; bp.frequency.value = f; bp.Q.value = q;
  const g = ctx.createGain(); env(g, t, 0.001, gain, dec);
  s.connect(bp); bp.connect(g); g.connect(master); s.start(t, Math.random() * 0.3); s.stop(t + dec + 0.05);
}
function click(t, f, gain) { // tiếng "tách" của switch clicky
  clack(t, f * 1.4, 0.8, 0.006, gain, 'highpass');
  const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; const g = ctx.createGain(); env(g, t, 0.0005, gain * 0.35, 0.012); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.03);
}
function ping(t, f, dec, gain) { // tiếng lò xo ngân
  [1, 1.48, 2.1].forEach((m, i) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * m; const g = ctx.createGain(); env(g, t, 0.002, gain / (i + 1), dec / (i * 0.5 + 1)); o.connect(g); g.connect(master); o.start(t); o.stop(t + dec + 0.05); });
}

// Mỗi loại switch: down(t, k) / up(t, k) với k = hệ số cho phím lớn
export const SWITCHES = {
  blue: { name: 'Cherry MX Blue (clicky)', down: (t, k) => { click(t, 4300, 0.55); clack(t + 0.004, 2400, 1, 0.025, 0.3 * k); thock(t + 0.006, 190 / k, 0.04, 0.22 * k); }, up: (t) => click(t, 3900, 0.32) },
  yellow: { name: 'Gateron Yellow (thock, êm)', down: (t, k) => { thock(t, 115 / k, 0.075, 0.55 * k); clack(t, 900, 1, 0.04, 0.35 * k); }, up: (t) => thock(t, 150, 0.03, 0.08) },
  brown: { name: 'Cherry MX Brown (khấc nhẹ)', down: (t, k) => { clack(t, 1800, 1.2, 0.03, 0.42 * k); thock(t + 0.003, 150 / k, 0.05, 0.33 * k); }, up: (t) => clack(t, 2000, 1.2, 0.015, 0.12) },
  panda: { name: 'Holy Panda (khấc mạnh, giòn)', down: (t, k) => { clack(t, 1400, 1.5, 0.035, 0.55 * k); thock(t + 0.004, 130 / k, 0.06, 0.45 * k); clack(t, 3200, 2, 0.008, 0.16); }, up: (t) => clack(t, 1600, 1.5, 0.02, 0.2) },
  topre: { name: 'Topre (trầm, đục)', down: (t, k) => { thock(t, 92 / k, 0.09, 0.6 * k); clack(t, 620, 0.8, 0.06, 0.38 * k); }, up: (t) => thock(t, 125, 0.04, 0.15) },
  black: { name: 'Gateron Black (trầm, nặng)', down: (t, k) => { thock(t, 82 / k, 0.09, 0.62 * k); clack(t, 700, 1, 0.05, 0.3 * k); }, up: (t) => thock(t, 110, 0.03, 0.1) },
  cream: { name: 'NovelKeys Cream (mượt)', down: (t, k) => { thock(t, 140 / k, 0.06, 0.45 * k); clack(t, 1200, 2, 0.045, 0.25 * k); }, up: (t) => clack(t, 1300, 2, 0.02, 0.1) },
  jade: { name: 'Box Jade (clicky sắc)', down: (t, k) => { click(t, 5400, 0.7); clack(t + 0.003, 3000, 1.2, 0.02, 0.33 * k); thock(t + 0.005, 205 / k, 0.03, 0.2 * k); }, up: (t) => click(t, 5000, 0.5) },
  alps: { name: 'Alps (giòn, rõ)', down: (t, k) => { clack(t, 2200, 2, 0.025, 0.5 * k); click(t, 3800, 0.25); thock(t, 170 / k, 0.03, 0.2 * k); }, up: (t) => clack(t, 2400, 2, 0.012, 0.2) },
  typewriter: { name: 'Máy đánh chữ', down: (t, k, key) => { clack(t, 1600, 0.7, 0.06, 0.7 * k); thock(t, 220 / k, 0.04, 0.4 * k); ping(t + 0.01, 1800, 0.08, 0.03); if (key === 'Enter') ping(t + 0.05, 2100, 0.9, 0.25); }, up: (t) => clack(t, 1900, 1, 0.02, 0.15) },
  spring: { name: 'Buckling spring (IBM Model M)', down: (t, k) => { clack(t, 1300, 1, 0.04, 0.6 * k); click(t, 3500, 0.45); ping(t + 0.004, 2600, 0.15, 0.09); }, up: (t) => { click(t, 3300, 0.3); ping(t, 2500, 0.08, 0.04); } },
  marsh: { name: 'Silent (giảm âm)', down: (t, k) => { thock(t, 160 / k, 0.03, 0.2 * k); clack(t, 800, 1, 0.02, 0.1 * k); }, up: () => {} },
  speed: { name: 'Kailh Speed Silver (cao, nhanh)', down: (t, k) => { clack(t, 3500, 2, 0.015, 0.42 * k); thock(t, 260 / k, 0.025, 0.2 * k); }, up: (t) => clack(t, 3800, 2, 0.01, 0.15) },
};

export function play(sw, key, up = false) {
  if (!sw || !SWITCHES[sw] || volume <= 0) return;
  init(); if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime + 0.002;
  const big = key === ' ' || key === 'Space' || key === 'Enter' || key === 'Backspace' || key === 'Shift';
  const k = (big ? 1.35 : 1) * (0.9 + Math.random() * 0.2);
  const S = SWITCHES[sw];
  if (up) S.up(t, k, key); else { S.down(t, k, key); if (big) clack(t + 0.012, 900, 1, 0.02, 0.18); } // phím dài có tiếng lục cục của thanh cân bằng
}
export function unlock() { init(); if (ctx.state === 'suspended') ctx.resume(); }
// tiếng mèo kêu "rừ rừ" khi được vuốt
let lastPurr = 0;
export function purr() {
  if (volume <= 0) return; init(); if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime; if (t - lastPurr < 1.2) return; lastPurr = t;
  const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.Q.value = 3;
  const am = ctx.createGain(); am.gain.value = 0;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 24; const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1.4, t + 0.15); g.gain.setValueAtTime(1.4, t + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  s.connect(lp); lp.connect(am); am.connect(g); g.connect(master);
  s.start(t); lfo.start(t); s.stop(t + 1.35); lfo.stop(t + 1.35);
}
