// Chú mèo gõ phím: vẽ bằng SVG, hai chân trước gõ đúng phím người dùng bấm
const NS = 'http://www.w3.org/2000/svg';

// Mỗi màu lông đi kèm một bộ keycap và một loại switch (âm thanh)
export const CATS = [
  { id: 'tuxedo', name: 'Tuxedo', body: '#2b2b2e', dark: '#141416', light: '#f7f4ee', pattern: 'tuxedo', eye: '#9bd36b', bg: '#e6ebf3', keys: { alpha: '#f4f4f1', mod: '#26262a', acc: '#f4f4f1', legend: '#222', legendMod: '#eee', case: '#1a1a1c' }, sw: 'blue' },
  { id: 'orange', name: 'Orange tabby', body: '#ec9a45', dark: '#c66d22', light: '#fbe4c8', pattern: 'tabby', eye: '#6f9a3e', bg: '#ffd877', keys: { alpha: '#fbf8f0', mod: '#e4dfd3', acc: '#efa24b', legend: '#333', legendMod: '#555', case: '#1e1e1e' }, sw: 'yellow' },
  { id: 'brown', name: 'Brown tabby', body: '#8b6a4e', dark: '#4d3726', light: '#dcc6a8', pattern: 'tabby', eye: '#c9a83a', bg: '#eadcc6', keys: { alpha: '#e9dcc3', mod: '#8a6c51', acc: '#b8432f', legend: '#4a3a2a', legendMod: '#f2e6d0', case: '#3b2c20' }, sw: 'brown' },
  { id: 'calico', name: 'Calico', body: '#fbf6ee', dark: '#2b2b2b', light: '#fbf6ee', p1: '#e58b38', p2: '#2e2b29', pattern: 'calico', eye: '#86b24f', bg: '#fde3c8', keys: { alpha: '#fbf7ef', mod: '#2b2b2b', acc: '#e58b38', legend: '#2b2b2b', legendMod: '#f4efe6', case: '#efe9df' }, sw: 'panda' },
  { id: 'siamese', name: 'Siamese', body: '#efe3cf', dark: '#4f3a2b', light: '#f7efe2', pattern: 'points', eye: '#4fa3e3', bg: '#efe5d8', keys: { alpha: '#efe4d1', mod: '#5a4433', acc: '#4fa3e3', legend: '#4f3a2b', legendMod: '#f2e7d6', case: '#2f241b' }, sw: 'topre' },
  { id: 'black', name: 'Black', body: '#232326', dark: '#0d0d0e', light: '#38383d', pattern: 'solid', eye: '#e8c547', bg: '#d7d3e6', keys: { alpha: '#2a2a2e', mod: '#1c1c1f', acc: '#e8c547', legend: '#bdbdc4', legendMod: '#8d8d94', case: '#121214' }, sw: 'black' },
  { id: 'white', name: 'White', body: '#fbfbf8', dark: '#c9c9c2', light: '#ffffff', pattern: 'solid', eye: '#69b3e8', eye2: '#e0b13d', bg: '#dcf0f4', keys: { alpha: '#ffffff', mod: '#f1f1ef', acc: '#bfe3f0', legend: '#9a9a9a', legendMod: '#9a9a9a', case: '#f6f6f4' }, sw: 'cream' },
  { id: 'bluegray', name: 'Blue-gray', body: '#8795a5', dark: '#5c6876', light: '#c7d0da', pattern: 'solid', eye: '#e2b146', bg: '#d9e3ef', keys: { alpha: '#cfd8e3', mod: '#6f7d8e', acc: '#3c5a80', legend: '#3c4654', legendMod: '#e8eef5', case: '#4a5563' }, sw: 'jade' },
  { id: 'graywhite', name: 'Gray & white', body: '#9a9a9a', dark: '#676767', light: '#fafafa', pattern: 'bicolor', eye: '#93c95f', bg: '#e7e7e7', keys: { alpha: '#fafafa', mod: '#9a9a9a', acc: '#6c6c6c', legend: '#555', legendMod: '#fff', case: '#7a7a7a' }, sw: 'alps' },
  { id: 'orangewhite', name: 'Orange & white', body: '#f0a04b', dark: '#c4722b', light: '#ffffff', pattern: 'bicolor', eye: '#7da744', bg: '#ffe1bd', keys: { alpha: '#ffffff', mod: '#f0a04b', acc: '#e0662f', legend: '#5a3a1a', legendMod: '#fff', case: '#f2efe9' }, sw: 'typewriter' },
  { id: 'tortie', name: 'Tortoiseshell', body: '#3a2a22', dark: '#1c130f', light: '#5a3e2c', p1: '#c8722e', p2: '#7a4a26', pattern: 'tortie', eye: '#d6a23a', bg: '#f0dcc8', keys: { alpha: '#4a3426', mod: '#2a1d16', acc: '#d07a34', legend: '#f2d2b0', legendMod: '#d9b48d', case: '#1e1410' }, sw: 'spring' },
  { id: 'cream', name: 'Cream', body: '#f2d9b0', dark: '#d4b07c', light: '#fbf1df', pattern: 'tabby', eye: '#c08a3a', bg: '#fbefda', keys: { alpha: '#fbf1df', mod: '#ecd6b2', acc: '#e8b980', legend: '#8a6a40', legendMod: '#8a6a40', case: '#efe2cc' }, sw: 'marsh' },
  { id: 'silver', name: 'Silver', body: '#c7cbd1', dark: '#717780', light: '#eef0f3', pattern: 'tabby', eye: '#6cb25a', bg: '#e3e8ee', keys: { alpha: '#e6e9ed', mod: '#a9afb7', acc: '#5f6670', legend: '#4a4f56', legendMod: '#fff', case: '#8b9199' }, sw: 'speed' },
];

// ---------- Bố cục bàn phím (đơn vị = 1 phím) ----------
const ROWS = [
  [['Backquote', '`'], ['Digit1', '1'], ['Digit2', '2'], ['Digit3', '3'], ['Digit4', '4'], ['Digit5', '5'], ['Digit6', '6'], ['Digit7', '7'], ['Digit8', '8'], ['Digit9', '9'], ['Digit0', '0'], ['Minus', '-'], ['Equal', '='], ['Backspace', '⌫', 2, 'mod']],
  [['Tab', 'tab', 1.5, 'mod'], ['KeyQ', 'q'], ['KeyW', 'w'], ['KeyE', 'e'], ['KeyR', 'r'], ['KeyT', 't'], ['KeyY', 'y'], ['KeyU', 'u'], ['KeyI', 'i'], ['KeyO', 'o'], ['KeyP', 'p'], ['BracketLeft', '['], ['BracketRight', ']'], ['Backslash', '\\', 1.5, 'mod']],
  [['CapsLock', 'caps', 1.75, 'mod'], ['KeyA', 'a'], ['KeyS', 's'], ['KeyD', 'd'], ['KeyF', 'f'], ['KeyG', 'g'], ['KeyH', 'h'], ['KeyJ', 'j'], ['KeyK', 'k'], ['KeyL', 'l'], ['Semicolon', ';'], ['Quote', "'"], ['Enter', 'enter', 2.25, 'acc']],
  [['ShiftLeft', 'shift', 2.25, 'mod'], ['KeyZ', 'z'], ['KeyX', 'x'], ['KeyC', 'c'], ['KeyV', 'v'], ['KeyB', 'b'], ['KeyN', 'n'], ['KeyM', 'm'], ['Comma', ','], ['Period', '.'], ['Slash', '/'], ['ShiftRight', 'shift', 2.75, 'mod']],
  [['ControlLeft', 'ctrl', 1.25, 'mod'], ['MetaLeft', 'win', 1.25, 'mod'], ['AltLeft', 'alt', 1.25, 'mod'], ['Space', '', 6.25, 'alpha'], ['AltRight', 'alt', 1.25, 'mod'], ['Fn', 'fn', 1.25, 'mod'], ['ContextMenu', 'menu', 1.25, 'acc'], ['ControlRight', 'ctrl', 1.25, 'mod']],
];
const CX = 210, U = 21, ROW_Y0 = 243, ROW_DY = 17, KH = 13, LIP = 4;
const rowScale = (r) => 0.86 + 0.035 * r;

function el(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

export class Cat {
  constructor(host) {
    this.host = host;
    this.svg = el('svg', { viewBox: '0 0 420 345', class: 'catsvg' });
    host.appendChild(this.svg);
    this.keys = new Map();
    this.paws = {
      L: { rest: [150, 266], x: 150, y: 266, tx: 150, ty: 266, t: 0 },
      R: { rest: [270, 266], x: 270, y: 266, tx: 270, ty: 266, t: 0 },
    };
    this.look = [0, 0]; this.lookT = [0, 0]; this.dil = 0;
    this.lastHit = 0; this.lastActive = performance.now(); this.blinkAt = performance.now() + 2500;
    this.mood = ''; this.moodUntil = 0; this.headTilt = 0; this.pet = 0; this.fx = [];
    this.pointer = null;
    this.build(CATS[1]);
    // mắt nhìn theo con trỏ chuột; vuốt đầu mèo
    window.addEventListener('pointermove', (e) => {
      const m = this.svg.getScreenCTM(); if (!m) return;
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      this.pointer = { x: pt.x, y: pt.y, t: performance.now() };
      const onHead = Math.hypot((pt.x - 210) / 80, (pt.y - 118) / 68) < 1;
      if (onHead && e.target.closest && e.target.closest('.catsvg')) { this.pet = performance.now(); this.wake(); if (Math.random() < 0.08) this.spawn('♥', pt.x, pt.y - 10, '#ff6b8a'); }
    });
    this.svg.addEventListener('pointerdown', (e) => {
      const m = this.svg.getScreenCTM(); const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      this.wake(); this.pet = performance.now();
      for (let i = 0; i < 3; i++) setTimeout(() => this.spawn('♥', pt.x + (Math.random() - 0.5) * 30, pt.y - 10, '#ff6b8a'), i * 120);
      if (this.onPet) this.onPet();
    });
    const loop = (t) => { this.tick(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  spawn(txt, x, y, color, size = 18) {
    const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 700, fill: color, 'font-family': 'Arial, sans-serif' }, this.fxLayer);
    t.textContent = txt; this.fx.push({ t, x, y, born: performance.now(), life: 1400, dx: (Math.random() - 0.5) * 20 });
  }
  wake() { if (this.sleeping) { this.sleeping = false; this.spawn('!', 262, 60, '#333', 22); } this.lastActive = performance.now(); }

  build(c) {
    this.c = c;
    const s = this.svg; s.innerHTML = '';
    const defs = el('defs', {}, s);
    const outline = shade(c.body, lumHex(c.body) > 0.75 ? -0.2 : -0.3);
    const grad = (id, col) => { const g = el('radialGradient', { id, cx: '42%', cy: '35%', r: '75%' }, defs); el('stop', { offset: '0%', 'stop-color': shade(col, 0.16) }, g); el('stop', { offset: '70%', 'stop-color': col }, g); el('stop', { offset: '100%', 'stop-color': shade(col, -0.12) }, g); return `url(#${id})`; };
    const furBody = grad('gBody', c.body), furHead = grad('gHead', c.body);
    const legCol = c.pattern === 'points' ? c.dark : c.body;
    const pawCol = ['tuxedo', 'bicolor', 'calico'].includes(c.pattern) ? c.light : c.pattern === 'points' ? shade(c.dark, 0.1) : c.pattern === 'tabby' ? c.light : shade(c.body, 0.08);
    this.pawCol = pawCol;
    // bóng dưới
    el('ellipse', { cx: 210, cy: 300, rx: 120, ry: 12, fill: 'rgba(0,0,0,.10)' }, s);
    // ---- đuôi (cuộn tròn, mập) ----
    this.tail = el('g', {}, s);
    const tailD = 'M266 262 C 318 268, 344 236, 336 204 C 331 186, 344 172, 358 180';
    el('path', { d: tailD, fill: 'none', stroke: outline, 'stroke-width': 27, 'stroke-linecap': 'round' }, this.tail);
    el('path', { d: tailD, fill: 'none', stroke: c.pattern === 'points' || c.pattern === 'tortie' ? c.dark : c.body, 'stroke-width': 23, 'stroke-linecap': 'round' }, this.tail);
    if (c.pattern === 'tabby') [[322, 240], [336, 214], [343, 190]].forEach(([x, y]) => el('path', { d: `M${x - 8} ${y + 5} q 8 -7 17 -3`, stroke: c.dark, 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round', opacity: 0.7 }, this.tail));
    if (['tuxedo', 'bicolor'].includes(c.pattern)) el('circle', { cx: 356, cy: 180, r: 10, fill: c.light }, this.tail);
    // ---- thân tròn như bánh mochi ----
    this.bodyG = el('g', {}, s);
    const bodyPath = 'M128 296 C 112 236, 140 176, 210 172 C 280 176, 308 236, 292 296 C 260 306, 160 306, 128 296 Z';
    el('clipPath', { id: 'clipBody' }, defs).appendChild(el('path', { d: bodyPath }));
    el('path', { d: bodyPath, fill: furBody, stroke: outline, 'stroke-width': 2.4 }, this.bodyG);
    const bp = el('g', { 'clip-path': 'url(#clipBody)' }, this.bodyG);
    if (['tuxedo', 'bicolor', 'calico', 'tabby'].includes(c.pattern)) el('ellipse', { cx: 210, cy: 250, rx: c.pattern === 'tuxedo' ? 34 : 44, ry: 66, fill: c.light, opacity: c.pattern === 'tabby' ? 0.85 : 1 }, bp);
    if (c.pattern === 'tabby') [[140, 214], [146, 240], [280, 214], [274, 240]].forEach(([x, y], i) => el('path', { d: i < 2 ? `M${x - 14} ${y} q 16 -6 26 6` : `M${x + 14} ${y} q -16 -6 -26 6`, stroke: c.dark, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round', opacity: 0.6 }, bp));
    if (c.pattern === 'calico') { el('ellipse', { cx: 150, cy: 210, rx: 34, ry: 30, fill: c.p1 }, bp); el('ellipse', { cx: 282, cy: 262, rx: 30, ry: 36, fill: c.p2 }, bp); el('ellipse', { cx: 256, cy: 190, rx: 18, ry: 13, fill: c.p1 }, bp); }
    if (c.pattern === 'tortie') { el('ellipse', { cx: 156, cy: 226, rx: 26, ry: 34, fill: c.p1, opacity: 0.85 }, bp); el('ellipse', { cx: 262, cy: 202, rx: 22, ry: 16, fill: c.p2 }, bp); el('ellipse', { cx: 248, cy: 270, rx: 24, ry: 18, fill: c.p1, opacity: 0.7 }, bp); }
    // ---- đầu to, má phúng phính ----
    this.head = el('g', {}, s);
    const H = this.head;
    el('ellipse', { cx: 210, cy: 184, rx: 64, ry: 10, fill: 'rgba(0,0,0,.10)' }, H);
    const earL = c.pattern === 'points' ? c.dark : c.pattern === 'calico' ? c.p2 : c.pattern === 'tortie' ? c.p1 : c.body;
    const earR = c.pattern === 'points' ? c.dark : c.pattern === 'calico' ? c.p1 : c.body;
    this.earL = el('g', {}, H); this.earR = el('g', {}, H);
    el('path', { d: 'M142 92 Q 140 42 166 34 Q 186 48 196 70 Z', fill: earL, stroke: outline, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, this.earL);
    el('path', { d: 'M152 82 Q 152 52 166 46 Q 178 56 184 70 Z', fill: '#f6a7b0' }, this.earL);
    el('path', { d: 'M278 92 Q 280 42 254 34 Q 234 48 224 70 Z', fill: earR, stroke: outline, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, this.earR);
    el('path', { d: 'M268 82 Q 268 52 254 46 Q 242 56 236 70 Z', fill: '#f6a7b0' }, this.earR);
    const headPath = 'M128 126 C 126 78, 164 56, 210 56 C 256 56, 294 78, 292 126 C 294 152, 280 168, 262 176 C 244 184, 176 184, 158 176 C 140 168, 126 152, 128 126 Z';
    el('clipPath', { id: 'clipHead' }, defs).appendChild(el('path', { d: headPath }));
    el('path', { d: headPath, fill: furHead, stroke: outline, 'stroke-width': 2.4 }, H);
    const hp = el('g', { 'clip-path': 'url(#clipHead)' }, H);
    if (c.pattern === 'tabby') {
      [[194, 60], [210, 58], [226, 60]].forEach(([x, y]) => el('path', { d: `M${x} ${y} q ${(x - 210) / 8} 12 ${(x - 210) / 16} 22`, stroke: c.dark, 'stroke-width': 5.5, fill: 'none', 'stroke-linecap': 'round', opacity: 0.65 }, hp));
      [[130, 128], [132, 142], [290, 128], [288, 142]].forEach(([x, y]) => el('path', { d: x < 200 ? `M${x - 4} ${y} l 16 2` : `M${x + 4} ${y} l -16 2`, stroke: c.dark, 'stroke-width': 4.5, 'stroke-linecap': 'round', opacity: 0.6 }, hp));
    }
    if (c.pattern === 'calico') { el('ellipse', { cx: 156, cy: 86, rx: 38, ry: 30, fill: c.p2 }, hp); el('ellipse', { cx: 266, cy: 92, rx: 30, ry: 26, fill: c.p1 }, hp); }
    if (c.pattern === 'tortie') { el('ellipse', { cx: 160, cy: 96, rx: 28, ry: 24, fill: c.p1, opacity: 0.85 }, hp); el('ellipse', { cx: 262, cy: 150, rx: 24, ry: 16, fill: c.p2 }, hp); }
    if (c.pattern === 'points') el('ellipse', { cx: 210, cy: 146, rx: 44, ry: 36, fill: c.dark, opacity: 0.75 }, hp);
    if (['tuxedo', 'bicolor'].includes(c.pattern)) el('path', { d: 'M210 104 C 192 118, 166 140, 168 186 L 252 186 C 254 140, 228 118, 210 104 Z', fill: c.light }, hp);
    if (c.pattern === 'tabby' || c.pattern === 'solid') el('ellipse', { cx: 210, cy: 152, rx: 30, ry: 18, fill: c.light, opacity: c.pattern === 'tabby' ? 0.7 : 0.25 }, hp);
    // má hồng
    this.blush = [el('ellipse', { cx: 156, cy: 146, rx: 14, ry: 8, fill: '#ff8fa3', opacity: 0.38 }, H), el('ellipse', { cx: 264, cy: 146, rx: 14, ry: 8, fill: '#ff8fa3', opacity: 0.38 }, H)];
    // mắt to tròn, long lanh
    this.eyes = [];
    [[178, 122, c.eye], [242, 122, c.eye2 || c.eye]].forEach(([x, y, col]) => {
      const open = el('g', {}, H);
      el('circle', { cx: x, cy: y, r: 18, fill: '#2a211d' }, open);
      el('circle', { cx: x, cy: y + 2, r: 15.5, fill: col }, open);
      el('circle', { cx: x, cy: y + 5, r: 10, fill: shade(col, 0.25), opacity: 0.55 }, open);
      const pupil = el('ellipse', { cx: x, cy: y + 1, rx: 9, ry: 11, fill: '#1b1513' }, open);
      const hl1 = el('circle', { cx: x - 6, cy: y - 6, r: 5.2, fill: '#fff' }, open);
      const hl2 = el('circle', { cx: x + 6, cy: y + 7, r: 2.4, fill: '#fff', opacity: 0.9 }, open);
      const cid = 'eyeClip' + x; el('clipPath', { id: cid }, defs).appendChild(el('circle', { cx: x, cy: y, r: 18.5 }));
      const lid = el('rect', { x: x - 20, y: y - 60, width: 40, height: 40, fill: c.pattern === 'points' ? shade(c.dark, 0.2) : c.body, 'clip-path': `url(#${cid})` }, open);
      const happy = el('path', { d: `M${x - 13} ${y + 4} Q ${x} ${y - 10} ${x + 13} ${y + 4}`, fill: 'none', stroke: '#2a211d', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 }, H);
      const sleep = el('path', { d: `M${x - 13} ${y} Q ${x} ${y + 10} ${x + 13} ${y}`, fill: 'none', stroke: '#2a211d', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0 }, H);
      const oops = el('path', { d: `M${x - 10} ${y - 8} L ${x + 8} ${y} L ${x - 10} ${y + 8}`.replace(/L/g, 'L'), fill: 'none', stroke: '#2a211d', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0, transform: x > 210 ? `rotate(180 ${x} ${y})` : '' }, H);
      this.eyes.push({ open, pupil, hl1, hl2, lid, happy, sleep, oops, x, y });
    });
    // mũi, miệng chữ ω, ria
    el('path', { d: 'M204 141 Q 210 138 216 141 Q 214 147 210 148 Q 206 147 204 141 Z', fill: '#f58a9a' }, H);
    this.mouth = el('path', { d: '', fill: 'none', stroke: '#2a211d', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, H);
    this.tongue = el('ellipse', { cx: 210, cy: 158, rx: 4, ry: 3.5, fill: '#ff7d93', opacity: 0 }, H);
    const wc = lumHex(c.body) < 0.3 ? 'rgba(255,255,255,.75)' : 'rgba(60,40,30,.45)';
    [[-1, 0], [-1, 1], [1, 0], [1, 1]].forEach(([sd, i]) => el('path', { d: `M${210 + sd * 36} ${146 + i * 7} q ${sd * 16} ${-4 + i * 4} ${sd * 32} ${-2 + i * 6}`, stroke: wc, 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, H));
    this.sweat = el('path', { d: 'M282 92 q 7 10 0 15 q -7 -5 0 -15 Z', fill: '#8ccfff', opacity: 0 }, H);
    // ---- bàn phím ----
    this.kb = el('g', { class: 'kb' }, s);
    const k = c.keys;
    const w0 = 15 * U * rowScale(-0.5) + 16, w1 = 15 * U * rowScale(4.6) + 18;
    const yTop = ROW_Y0 - 8, yBot = ROW_Y0 + 4 * ROW_DY + KH + 9;
    el('path', { d: `M${CX - w0 / 2} ${yTop} L ${CX + w0 / 2} ${yTop} L ${CX + w1 / 2} ${yBot} L ${CX - w1 / 2} ${yBot} Z`, fill: k.case, stroke: 'rgba(0,0,0,.35)', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, this.kb);
    el('path', { d: `M${CX - w1 / 2} ${yBot} L ${CX + w1 / 2} ${yBot} L ${CX + w1 / 2 - 2} ${yBot + 9} L ${CX - w1 / 2 + 2} ${yBot + 9} Z`, fill: shade(k.case, -0.35) }, this.kb);
    this.keys.clear();
    ROWS.forEach((row, r) => {
      const sc = rowScale(r); let x = -7.5 * U;
      const y = ROW_Y0 + r * ROW_DY;
      row.forEach(([code, lab, w = 1, kind = 'alpha']) => {
        const kw = w * U;
        const x0 = CX + (x + 1.2) * sc, x1 = CX + (x + kw - 1.2) * sc;
        const col = kind === 'mod' ? k.mod : kind === 'acc' ? k.acc : k.alpha;
        const g = el('g', { class: 'key' }, this.kb);
        el('rect', { x: x0, y: y + 3, width: x1 - x0, height: KH + LIP - 3, rx: 2.5, fill: shade(col, -0.28) }, g);
        const top = el('rect', { x: x0 + 0.6, y, width: x1 - x0 - 1.2, height: KH - 1, rx: 2.5, fill: col }, g);
        if (lab && lab.length === 1) { const t = el('text', { x: (x0 + x1) / 2, y: y + 8.6, 'text-anchor': 'middle', 'font-size': 6.4, 'font-family': 'Arial, sans-serif', 'font-weight': 700, fill: kind === 'mod' ? k.legendMod : k.legend }, g); t.textContent = lab.toUpperCase(); }
        else if (lab) { const t = el('text', { x: (x0 + x1) / 2, y: y + 8, 'text-anchor': 'middle', 'font-size': 4.6, 'font-family': 'Arial, sans-serif', fill: kind === 'mod' ? k.legendMod : k.legend }, g); t.textContent = lab; }
        this.keys.set(code, { g, top, cx: (x0 + x1) / 2, cy: y + KH / 2, col });
        x += kw;
      });
    });
    // ---- hai chân trước ngắn, bàn chân mochi có đệm hồng ----
    this.legs = {};
    for (const side of ['L', 'R']) {
      const g = el('g', {}, s);
      const ol = el('path', { fill: 'none', stroke: outline, 'stroke-width': 30, 'stroke-linecap': 'round' }, g);
      const fill = el('path', { fill: 'none', stroke: (c.pattern === 'calico' && side === 'L') ? c.p1 : legCol, 'stroke-width': 25.5, 'stroke-linecap': 'round' }, g);
      const stripes = el('g', {}, g);
      const paw = el('g', {}, g);
      el('ellipse', { cx: 0, cy: 0, rx: 17, ry: 12.5, fill: pawCol, stroke: outline, 'stroke-width': 2.2 }, paw);
      el('path', { d: 'M-6 -4 l 0 6 M6 -4 l 0 6', stroke: outline, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.55 }, paw);
      const beans = el('g', { opacity: 0 }, paw);
      el('ellipse', { cx: 0, cy: 4, rx: 6, ry: 4.5, fill: '#f7a1b1' }, beans);
      [-8, 0, 8].forEach((x) => el('circle', { cx: x, cy: -4, r: 2.6, fill: '#f7a1b1' }, beans));
      this.legs[side] = { ol, fill, paw, beans, stripes, shoulder: side === 'L' ? [180, 214] : [240, 214] };
      if (c.pattern === 'tabby') for (let i = 0; i < 2; i++) el('path', { stroke: c.dark, 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none', opacity: 0.6 }, stripes);
    }
    this.fxLayer = el('g', { 'pointer-events': 'none' }, s);
    this.fx = [];
    this.zText = el('text', { x: 286, y: 70, 'font-size': 20, 'font-weight': 800, fill: '#4b5563', opacity: 0, 'font-family': 'Arial, sans-serif' }, s);
    this.zText.textContent = 'z';
    this.host.style.setProperty('--cat-bg', c.bg);
  }

  // gọi khi có phím được bấm (code theo KeyboardEvent.code)
  press(code) {
    const K = this.keys.get(code) || this.keys.get(code === 'ShiftRight' ? 'ShiftLeft' : code === 'NumpadEnter' ? 'Enter' : '');
    const now = performance.now();
    this.wake();
    if (!K) return;
    let side = K.cx < CX ? 'L' : 'R';
    if (code === 'Space') side = this.lastSide === 'L' ? 'R' : 'L';
    const p = this.paws[side];
    const tx = code === 'Space' ? K.cx + (side === 'L' ? -26 : 26) : K.cx;
    p.tx = tx; p.ty = K.cy + 2; p.t = now;
    this.lastSide = side; this.lastHit = now;
    this.lookT = [Math.max(-5, Math.min(5, (tx - CX) / 20)), 5];
    this.headTilt = (tx - CX) / 50 + (Math.random() - 0.5) * 2;
    K.top.setAttribute('transform', 'translate(0 2.4)'); K.top.setAttribute('fill', shade(K.col, -0.12));
    clearTimeout(K.tm); K.tm = setTimeout(() => { K.top.removeAttribute('transform'); K.top.setAttribute('fill', K.col); }, 110);
  }
  react(kind) { this.mood = kind; this.moodUntil = performance.now() + (kind === 'happy' ? 3200 : 700); if (kind === 'happy') for (let i = 0; i < 4; i++) setTimeout(() => this.spawn(i % 2 ? '✦' : '♥', 170 + Math.random() * 80, 70, i % 2 ? '#ffb020' : '#ff6b8a'), i * 160); }

  tick(now) {
    const dt = Math.min(0.05, (now - (this.prev || now)) / 1000); this.prev = now;
    if (!this.sleeping && now - this.lastActive > 25000) this.sleeping = true;
    const sleeping = this.sleeping;
    const petting = now - this.pet < 500;
    // chân
    for (const side of ['L', 'R']) {
      const p = this.paws[side], L = this.legs[side];
      if (now - p.t > 650) { p.tx = p.rest[0]; p.ty = p.rest[1] + (sleeping ? 4 : 0); }
      const age = now - p.t;
      const k = Math.min(1, (1 - Math.pow(0.0001, dt * 1.4)) * 3.2);
      p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
      const lift = age < 45 ? (age / 45) * 12 : age < 95 ? 12 * (1 - (age - 45) / 50) : 0;
      const y = p.y - lift;
      const [sx, sy] = L.shoulder;
      const mx = (sx + p.x) / 2 + (side === 'L' ? -6 : 6), my = Math.min(sy, y) + (y - sy) * 0.4;
      const d = `M${sx} ${sy} Q ${mx} ${my} ${p.x} ${y - 4}`;
      L.ol.setAttribute('d', d); L.fill.setAttribute('d', d);
      const squash = age < 130 && age > 45;
      L.paw.setAttribute('transform', `translate(${p.x} ${y}) scale(${squash ? 1.08 : 1} ${squash ? 0.88 : 1})`);
      L.beans.setAttribute('opacity', lift > 4 ? 1 : 0);
      [...L.stripes.children].forEach((st, i) => { const t = 0.35 + i * 0.22; const x = sx + (p.x - sx) * t, yy = sy + (y - sy) * t; st.setAttribute('d', `M${x - 11} ${yy} l 22 2`); });
    }
    // hướng nhìn: phím vừa gõ > con trỏ chuột > nhìn thẳng
    let near = 0;
    if (now - this.lastHit > 900) {
      const P = this.pointer;
      if (P && now - P.t < 6000) {
        const dx = P.x - 210, dy = P.y - 122, dist = Math.hypot(dx, dy);
        const k = Math.min(1, dist / 160);
        this.lookT = [(dx / (dist || 1)) * 5.5 * k, (dy / (dist || 1)) * 5 * k];
        near = Math.max(0, 1 - dist / 170);
      } else this.lookT = [0, 1];
    }
    this.look[0] += (this.lookT[0] - this.look[0]) * 0.2; this.look[1] += (this.lookT[1] - this.look[1]) * 0.2;
    this.dil += (near - this.dil) * 0.1;
    let blink = 0;
    if (now > this.blinkAt) { const a = now - this.blinkAt; blink = a < 80 ? a / 80 : a < 160 ? 1 - (a - 80) / 80 : 0; if (a > 160) this.blinkAt = now + 2000 + Math.random() * 3500; }
    const happy = (this.mood === 'happy' && now < this.moodUntil) || petting;
    const oops = this.mood === 'oops' && now < this.moodUntil;
    this.eyes.forEach((e) => {
      const lx = this.look[0], ly = this.look[1];
      e.pupil.setAttribute('cx', e.x + lx); e.pupil.setAttribute('cy', e.y + 1 + ly);
      e.pupil.setAttribute('rx', 8 + this.dil * 4); e.pupil.setAttribute('ry', 10.5 + this.dil * 3);
      e.hl1.setAttribute('cx', e.x - 6 + lx * 0.4); e.hl1.setAttribute('cy', e.y - 6 + ly * 0.4);
      e.hl2.setAttribute('cx', e.x + 6 + lx * 0.4); e.hl2.setAttribute('cy', e.y + 7 + ly * 0.4);
      e.lid.setAttribute('transform', `translate(0 ${blink * 40})`);
      e.open.style.opacity = happy || sleeping || oops ? 0 : 1;
      e.happy.setAttribute('opacity', happy && !sleeping ? 1 : 0);
      e.sleep.setAttribute('opacity', sleeping ? 1 : 0);
      e.oops.setAttribute('opacity', oops && !sleeping ? 1 : 0);
    });
    this.blush.forEach((b) => b.setAttribute('opacity', happy ? 0.7 : 0.38));
    this.sweat.setAttribute('opacity', oops ? 1 : 0);
    this.mouth.setAttribute('d', happy ? 'M198 150 q 6 7 12 0 q 6 7 12 0' : sleeping ? 'M205 152 q 5 3 10 0' : oops ? 'M202 156 q 8 -6 16 0' : 'M200 150 q 5 6 10 0 q 5 6 10 0');
    this.tongue.setAttribute('opacity', happy ? 1 : 0);
    this.sweat.setAttribute('opacity', oops ? 1 : 0);
    // đầu: gật theo nhịp gõ, nghiêng khi được vuốt, gục khi ngủ
    const since = now - this.lastHit;
    const bob = since < 160 ? Math.sin((since / 160) * Math.PI) * 2 : 0;
    let tilt = (since < 600 ? this.headTilt : 0) + Math.sin(now / 1500) * 1.4;
    if (petting && this.pointer) tilt = (this.pointer.x - 210) / 12;
    const droop = sleeping ? 6 + Math.sin(now / 900) * 1.5 : 0;
    this.head.setAttribute('transform', `rotate(${tilt} 210 175) translate(0 ${bob + droop})`);
    // tai giật nhẹ
    const twitch = (now % 5200) < 140 ? -6 : 0;
    this.earR.setAttribute('transform', `rotate(${twitch} 250 70)`);
    this.earL.setAttribute('transform', `rotate(${oops ? 8 : 0} 170 70)`);
    // thở
    const br = 1 + Math.sin(now / (sleeping ? 900 : 600)) * (sleeping ? 0.018 : 0.008);
    this.bodyG.setAttribute('transform', `translate(210 300) scale(${2 - br} ${br}) translate(-210 -300)`);
    this.tail.setAttribute('transform', `rotate(${Math.sin(now / (happy ? 150 : sleeping ? 1600 : 700)) * (happy ? 10 : sleeping ? 2 : 5)} 266 262)`);
    // chữ z khi ngủ
    if (sleeping) { const a = (now % 2400) / 2400; this.zText.setAttribute('opacity', Math.sin(a * Math.PI)); this.zText.setAttribute('x', 286 + a * 18); this.zText.setAttribute('y', 72 - a * 34); this.zText.setAttribute('font-size', 14 + a * 14); }
    else this.zText.setAttribute('opacity', 0);
    // hiệu ứng trái tim / ngôi sao bay lên
    this.fx = this.fx.filter((f) => { const a = (now - f.born) / f.life; if (a >= 1) { f.t.remove(); return false; } f.t.setAttribute('x', f.x + f.dx * a); f.t.setAttribute('y', f.y - a * 50); f.t.setAttribute('opacity', 1 - a); return true; });
  }
}

function lumHex(hex) { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255; }
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}
export { shade };
