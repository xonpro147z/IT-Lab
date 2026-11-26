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
      L: { rest: [140, 268], x: 140, y: 268, tx: 140, ty: 268, lift: 0, down: 0, t: 0 },
      R: { rest: [280, 268], x: 280, y: 268, tx: 280, ty: 268, lift: 0, down: 0, t: 0 },
    };
    this.look = [0, 0]; this.lookT = [0, 0];
    this.lastHit = 0; this.blinkAt = performance.now() + 2500; this.mood = ''; this.moodUntil = 0;
    this.headTilt = 0;
    this.build(CATS[1]);
    const loop = (t) => { this.tick(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  build(c) {
    this.c = c;
    const s = this.svg; s.innerHTML = '';
    const defs = el('defs', {}, s);
    // ---- đuôi ----
    this.tail = el('g', { class: 'tail' }, s);
    el('path', { d: 'M262 250 C 315 252, 330 220, 328 196 C 327 182, 340 176, 350 184', fill: 'none', stroke: c.dark, 'stroke-width': 21, 'stroke-linecap': 'round' }, this.tail);
    el('path', { d: 'M262 250 C 315 252, 330 220, 328 196 C 327 182, 340 176, 350 184', fill: 'none', stroke: c.pattern === 'points' ? c.dark : c.pattern === 'calico' ? c.p1 : c.body, 'stroke-width': 17, 'stroke-linecap': 'round' }, this.tail);
    if (c.pattern === 'tabby') [[318, 232], [329, 207], [338, 184]].forEach(([x, y]) => el('path', { d: `M${x - 7} ${y + 4} q 7 -6 15 -2`, stroke: c.dark, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, this.tail));
    // ---- thân ----
    const bodyPath = 'M150 290 C 132 230, 150 168, 210 166 C 270 168, 290 230, 272 290 Z';
    el('clipPath', { id: 'clipBody' }, defs).appendChild(el('path', { d: bodyPath }));
    const body = el('g', {}, s);
    el('path', { d: bodyPath, fill: c.body, stroke: c.dark, 'stroke-width': 2.5 }, body);
    const bp = el('g', { 'clip-path': 'url(#clipBody)' }, body);
    if (c.pattern === 'tuxedo' || c.pattern === 'bicolor') el('ellipse', { cx: 211, cy: 222, rx: c.pattern === 'tuxedo' ? 26 : 36, ry: 58, fill: c.light }, bp);
    if (c.pattern === 'tabby') [[160, 205], [164, 232], [258, 205], [255, 232]].forEach(([x, y], i) => el('path', { d: i < 2 ? `M${x - 12} ${y} q 14 -4 22 6` : `M${x + 12} ${y} q -14 -4 -22 6`, stroke: c.dark, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: 0.8 }, bp));
    if (c.pattern === 'calico') { el('ellipse', { cx: 168, cy: 205, rx: 30, ry: 26, fill: c.p1 }, bp); el('ellipse', { cx: 262, cy: 245, rx: 26, ry: 34, fill: c.p2 }, bp); el('ellipse', { cx: 240, cy: 188, rx: 16, ry: 12, fill: c.p1 }, bp); }
    if (c.pattern === 'tortie') { el('ellipse', { cx: 172, cy: 220, rx: 22, ry: 30, fill: c.p1, opacity: 0.85 }, bp); el('ellipse', { cx: 250, cy: 200, rx: 18, ry: 14, fill: c.p2 }, bp); el('ellipse', { cx: 236, cy: 258, rx: 20, ry: 16, fill: c.p1, opacity: 0.7 }, bp); }
    // ---- đầu ----
    this.head = el('g', { class: 'head' }, s);
    const H = this.head;
    const earFill = c.pattern === 'points' ? c.dark : c.pattern === 'calico' ? c.p2 : c.body;
    el('path', { d: 'M150 104 L 158 46 L 196 78 Z', fill: earFill, stroke: c.dark, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, H);
    el('path', { d: 'M218 78 L 256 44 L 264 104 Z', fill: c.pattern === 'calico' ? c.p1 : earFill, stroke: c.dark, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, H);
    el('path', { d: 'M158 92 L 162 60 L 184 79 Z', fill: '#f1a9a0', opacity: 0.75 }, H);
    el('path', { d: 'M230 79 L 252 59 L 256 92 Z', fill: '#f1a9a0', opacity: 0.75 }, H);
    const headPath = 'M146 122 C 144 82, 180 66, 207 66 C 236 66, 270 82, 268 122 C 266 156, 238 170, 207 170 C 176 170, 148 156, 146 122 Z';
    el('clipPath', { id: 'clipHead' }, defs).appendChild(el('path', { d: headPath }));
    el('path', { d: headPath, fill: c.body, stroke: c.dark, 'stroke-width': 2.5 }, H);
    const hp = el('g', { 'clip-path': 'url(#clipHead)' }, H);
    if (c.pattern === 'tabby') { [[196, 74, 0], [207, 72, 0], [218, 74, 0]].forEach(([x, y]) => el('path', { d: `M${x} ${y} q ${x < 207 ? -2 : x > 207 ? 2 : 0} 10 0 18`, stroke: c.dark, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', opacity: 0.85 }, hp)); [[150, 120], [150, 132], [264, 120], [264, 132]].forEach(([x, y]) => el('path', { d: x < 200 ? `M${x - 4} ${y} l 14 2` : `M${x + 4} ${y} l -14 2`, stroke: c.dark, 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0.8 }, hp)); }
    if (c.pattern === 'calico') { el('ellipse', { cx: 166, cy: 92, rx: 30, ry: 24, fill: c.p2 }, hp); el('ellipse', { cx: 250, cy: 96, rx: 24, ry: 22, fill: c.p1 }, hp); }
    if (c.pattern === 'tortie') { el('ellipse', { cx: 172, cy: 100, rx: 22, ry: 20, fill: c.p1, opacity: 0.85 }, hp); el('ellipse', { cx: 246, cy: 140, rx: 20, ry: 14, fill: c.p2 }, hp); }
    if (c.pattern === 'points') el('ellipse', { cx: 207, cy: 140, rx: 36, ry: 32, fill: c.dark, opacity: 0.85 }, hp);
    if (c.pattern === 'tuxedo' || c.pattern === 'bicolor') { el('path', { d: 'M207 108 C 192 122, 178 140, 180 170 L 234 170 C 236 140, 222 122, 207 108 Z', fill: c.light }, hp); }
    // mắt (mi nặng, hơi ngái ngủ như hình mẫu)
    this.eyes = [];
    [[181, 116, c.eye], [233, 116, c.eye2 || c.eye]].forEach(([x, y, col]) => {
      const g = el('g', {}, H);
      el('ellipse', { cx: x, cy: y, rx: 14, ry: 9.5, fill: '#fff', stroke: c.dark, 'stroke-width': 1.6 }, g);
      el('ellipse', { cx: x, cy: y + 1, rx: 12, ry: 8, fill: col }, g);
      const pupil = el('ellipse', { cx: x, cy: y + 1, rx: 4, ry: 6.5, fill: '#111' }, g);
      el('circle', { cx: x - 4, cy: y - 2, r: 2, fill: '#fff', opacity: 0.9 }, g);
      const lid = el('path', { d: `M${x - 15} ${y - 1} Q ${x} ${y - 14} ${x + 15} ${y - 1} L ${x + 15} ${y - 12} L ${x - 15} ${y - 12} Z`, fill: c.pattern === 'points' ? c.body : c.body, stroke: 'none' }, g);
      el('path', { d: `M${x - 15} ${y - 1} Q ${x} ${y - 6} ${x + 15} ${y - 1}`, fill: 'none', stroke: c.dark, 'stroke-width': 2.2, 'stroke-linecap': 'round', class: 'lidline' }, g);
      const happy = el('path', { d: `M${x - 11} ${y + 3} Q ${x} ${y - 9} ${x + 11} ${y + 3}`, fill: 'none', stroke: c.dark, 'stroke-width': 3.2, 'stroke-linecap': 'round', opacity: 0 }, H);
      this.eyes.push({ g, pupil, x, y, lid, happy });
    });
    // mũi, miệng, ria
    el('path', { d: 'M201 132 L 213 132 L 207 139 Z', fill: '#e88b8f', stroke: c.dark, 'stroke-width': 1, 'stroke-linejoin': 'round' }, H);
    this.mouth = el('path', { d: 'M207 139 q -5 7 -11 3 M207 139 q 5 7 11 3', fill: 'none', stroke: c.dark, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, H);
    const wc = c.pattern === 'black' || c.body === '#232326' ? '#bbb' : c.pattern === 'points' ? '#eee' : c.dark;
    [[-1, 0], [-1, 1], [-1, 2], [1, 0], [1, 1], [1, 2]].forEach(([sd, i]) => el('path', { d: `M${207 + sd * 20} ${136 + i * 5} q ${sd * 22} ${-6 + i * 5} ${sd * 44} ${-3 + i * 7}`, stroke: wc, 'stroke-width': 1.1, fill: 'none', opacity: 0.8 }, H));
    this.sweat = el('path', { d: 'M262 78 q 6 9 0 13 q -6 -4 0 -13 Z', fill: '#7cc4ff', opacity: 0 }, H);
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
    // ---- hai chân trước (vẽ sau cùng để đè lên bàn phím) ----
    this.legs = {};
    for (const side of ['L', 'R']) {
      const g = el('g', {}, s);
      const outline = el('path', { fill: 'none', stroke: c.dark, 'stroke-width': 27, 'stroke-linecap': 'round' }, g);
      const fill = el('path', { fill: 'none', stroke: c.pattern === 'points' ? c.dark : (c.pattern === 'calico' && side === 'L') ? c.p1 : c.body, 'stroke-width': 22.5, 'stroke-linecap': 'round' }, g);
      const stripes = el('g', {}, g);
      const pawCol = ['tuxedo', 'bicolor'].includes(c.pattern) ? c.light : c.pattern === 'points' ? shade(c.dark, 0.15) : c.pattern === 'calico' ? '#fbf6ee' : c.pattern === 'tabby' ? c.light : c.body;
      const paw = el('g', {}, g);
      el('ellipse', { cx: 0, cy: 0, rx: 15, ry: 10.5, fill: pawCol, stroke: c.dark, 'stroke-width': 2.3 }, paw);
      el('path', { d: 'M-5 -1 l 0 7 M5 -1 l 0 7', stroke: c.dark, 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: 0.6 }, paw);
      this.legs[side] = { outline, fill, paw, stripes, shoulder: side === 'L' ? [176, 206] : [244, 206] };
      if (c.pattern === 'tabby') for (let i = 0; i < 2; i++) el('path', { stroke: c.dark, 'stroke-width': 3.5, 'stroke-linecap': 'round', fill: 'none', opacity: 0.75 }, stripes);
    }
    this.host.style.setProperty('--cat-bg', c.bg);
  }

  // gọi khi có phím được bấm (code theo KeyboardEvent.code)
  press(code) {
    const K = this.keys.get(code) || this.keys.get(code === 'ShiftRight' ? 'ShiftLeft' : code === 'NumpadEnter' ? 'Enter' : '');
    const now = performance.now();
    if (!K) return;
    let side = K.cx < CX ? 'L' : 'R';
    if (code === 'Space') side = this.lastSide === 'L' ? 'R' : 'L';
    const p = this.paws[side];
    // phím Space: đặt chân ở hai phía thanh space
    const tx = code === 'Space' ? K.cx + (side === 'L' ? -26 : 26) : K.cx;
    p.tx = tx; p.ty = K.cy + 3; p.t = now; p.lift = 1;
    this.lastSide = side; this.lastHit = now;
    this.lookT = [Math.max(-4, Math.min(4, (tx - CX) / 22)), 3];
    this.headTilt = (tx - CX) / 60 + (Math.random() - 0.5) * 2;
    K.top.setAttribute('transform', 'translate(0 2.2)'); K.top.setAttribute('fill', shade(K.col, -0.12));
    clearTimeout(K.tm); K.tm = setTimeout(() => { K.top.removeAttribute('transform'); K.top.setAttribute('fill', K.col); }, 110);
  }
  react(kind) { this.mood = kind; this.moodUntil = performance.now() + (kind === 'happy' ? 3200 : 700); }

  tick(now) {
    const dt = Math.min(0.05, (now - (this.prev || now)) / 1000); this.prev = now;
    // chân: nhấc lên rồi đập xuống phím; lâu không gõ thì về chỗ nghỉ
    for (const side of ['L', 'R']) {
      const p = this.paws[side], L = this.legs[side];
      if (now - p.t > 650) { p.tx = p.rest[0]; p.ty = p.rest[1]; }
      const age = now - p.t;
      const k = 1 - Math.pow(0.0001, dt * 1.4);
      p.x += (p.tx - p.x) * Math.min(1, k * 3.2); p.y += (p.ty - p.y) * Math.min(1, k * 3.2);
      const lift = age < 45 ? (age / 45) * 10 : age < 95 ? 10 * (1 - (age - 45) / 50) : 0;
      const y = p.y - lift;
      const [sx, sy] = L.shoulder;
      const mx = (sx + p.x) / 2 + (side === 'L' ? -8 : 8), my = Math.min(sy, y) + (y - sy) * 0.35;
      const d = `M${sx} ${sy} Q ${mx} ${my} ${p.x} ${y - 3}`;
      L.outline.setAttribute('d', d); L.fill.setAttribute('d', d);
      L.paw.setAttribute('transform', `translate(${p.x} ${y}) scale(${age < 120 && age > 45 ? 1.06 : 1} ${age < 120 && age > 45 ? 0.9 : 1})`);
      [...L.stripes.children].forEach((st, i) => { const t = 0.4 + i * 0.2; const x = sx + (p.x - sx) * t, yy = sy + (y - sy) * t; st.setAttribute('d', `M${x - 10} ${yy} l 20 2`); });
    }
    // mắt nhìn theo chân, chớp mắt
    this.look[0] += (this.lookT[0] - this.look[0]) * 0.2; this.look[1] += (this.lookT[1] - this.look[1]) * 0.2;
    if (now - this.lastHit > 900) this.lookT = [0, 1];
    let blink = 0;
    if (now > this.blinkAt) { const a = now - this.blinkAt; blink = a < 90 ? a / 90 : a < 180 ? 1 - (a - 90) / 90 : 0; if (a > 180) this.blinkAt = now + 2200 + Math.random() * 3500; }
    const happy = this.mood === 'happy' && now < this.moodUntil;
    const oops = this.mood === 'oops' && now < this.moodUntil;
    this.eyes.forEach((e) => {
      e.pupil.setAttribute('cx', e.x + this.look[0]); e.pupil.setAttribute('cy', e.y + 1 + this.look[1] * 0.7);
      e.pupil.setAttribute('rx', oops ? 5.5 : 4);
      const lidDrop = oops ? -4 : blink * 11;
      e.lid.setAttribute('transform', `translate(0 ${lidDrop})`);
      e.g.style.opacity = happy ? 0 : 1; e.happy.setAttribute('opacity', happy ? 1 : 0);
    });
    this.sweat.setAttribute('opacity', oops ? 1 : 0);
    this.mouth.setAttribute('d', happy ? 'M199 140 q 8 9 16 0' : oops ? 'M201 144 q 6 -4 12 0' : 'M207 139 q -5 7 -11 3 M207 139 q 5 7 11 3');
    // gật đầu nhẹ theo nhịp gõ, đuôi vẫy
    const since = now - this.lastHit;
    const bob = since < 160 ? Math.sin((since / 160) * Math.PI) * 1.6 : 0;
    this.head.setAttribute('transform', `rotate(${(since < 600 ? this.headTilt : 0) + Math.sin(now / 1500) * 1.2} 207 165) translate(0 ${bob})`);
    this.tail.setAttribute('transform', `rotate(${Math.sin(now / (happy ? 160 : 700)) * (happy ? 9 : 5)} 262 250)`);
  }
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}
export { shade };
