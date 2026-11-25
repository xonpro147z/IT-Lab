// Bàn phím ảo + chuẩn hoá tổ hợp phím
export const MODS = ['Ctrl', 'Alt', 'Shift', 'Win'];
const IS_MAC = /Mac/.test(navigator.platform);

const CODE_NAME = {
  Escape: 'Esc', Enter: 'Enter', NumpadEnter: 'Enter', Space: 'Space', Backspace: 'Backspace', Tab: 'Tab', Delete: 'Delete', Insert: 'Insert',
  Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  PrintScreen: 'PrtScn', Equal: '=', NumpadAdd: '=', Minus: '-', NumpadSubtract: '-', Period: '.', NumpadDecimal: '.', Comma: ',', Semicolon: ';', Quote: "'",
  BracketLeft: '[', BracketRight: ']', Backslash: '\\', Slash: '/', NumpadDivide: '/', Backquote: '`', ContextMenu: 'Menu', CapsLock: 'CapsLock',
  ScrollLock: 'ScrLk', Pause: 'Pause', NumpadMultiply: '*',
};
const MOD_CODE = { ControlLeft: 'Ctrl', ControlRight: 'Ctrl', AltLeft: 'Alt', AltRight: 'Alt', ShiftLeft: 'Shift', ShiftRight: 'Shift', MetaLeft: 'Win', MetaRight: 'Win', OSLeft: 'Win', OSRight: 'Win' };

export function keyName(code) {
  if (MOD_CODE[code]) return MOD_CODE[code];
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  if (/^Numpad\d$/.test(code)) return code.slice(6);
  if (/^F\d{1,2}$/.test(code)) return code;
  return CODE_NAME[code] || null;
}

export function comboFromEvent(e) {
  const main = keyName(e.code);
  if (!main) return null;
  const m = new Set();
  // Trên Mac: ⌘ và control đều tính là Ctrl (phím Win chỉ bấm trên bàn phím ảo)
  if (e.ctrlKey || (IS_MAC && e.metaKey)) m.add('Ctrl');
  if (e.altKey) m.add('Alt');
  if (e.shiftKey) m.add('Shift');
  if (e.metaKey && !IS_MAC) m.add('Win');
  if (MODS.includes(main)) return null; // chỉ phím bổ trợ
  return join(m, main);
}

export function join(mods, main) { return [...MODS.filter((x) => mods.has(x)), main].join('+'); }

// tách tổ hợp: 'Ctrl+=' → ['Ctrl','='] ; 'Ctrl+-' → ['Ctrl','-']
export function parts(combo) { const p = combo.split('+'); if (combo.endsWith('+') && p[p.length - 1] === '') { p.pop(); p.pop(); p.push('+'); } return p; }

const LABEL = { Win: IS_MAC ? 'Win' : 'Win', Up: '↑', Down: '↓', Left: '←', Right: '→', Backspace: '⌫ Backspace', Enter: 'Enter ↵', PageUp: 'PgUp', PageDown: 'PgDn', Space: 'Space', Delete: 'Delete' };
export function keycaps(combo, cls = '') { return parts(combo).map((p) => `<kbd class="${cls}">${LABEL[p] || p}</kbd>`).join('<span class="plus">+</span>'); }

// ===== Bố cục bàn phím (đơn vị = 1 phím) =====
const R = (k, w = 1, label) => ({ k, w, label });
const GAP = (w) => ({ gap: w });
const ROWS = [
  [R('Esc'), GAP(1), R('F1'), R('F2'), R('F3'), R('F4'), GAP(.5), R('F5'), R('F6'), R('F7'), R('F8'), GAP(.5), R('F9'), R('F10'), R('F11'), R('F12'), GAP(.25), R('PrtScn'), R('ScrLk'), R('Pause')],
  [R('`', 1, '~<br>`'), R('1', 1, '!<br>1'), R('2', 1, '@<br>2'), R('3', 1, '#<br>3'), R('4', 1, '$<br>4'), R('5', 1, '%<br>5'), R('6', 1, '^<br>6'), R('7', 1, '&<br>7'), R('8', 1, '*<br>8'), R('9', 1, '(<br>9'), R('0', 1, ')<br>0'), R('-', 1, '_<br>-'), R('=', 1, '+<br>='), R('Backspace', 2, 'Backspace'), GAP(.25), R('Insert', 1, 'Ins'), R('Home'), R('PageUp', 1, 'PgUp')],
  [R('Tab', 1.5), ...'QWERTYUIOP'.split('').map((c) => R(c)), R('[', 1, '{<br>['), R(']', 1, '}<br>]'), R('\\', 1.5, '|<br>\\'), GAP(.25), R('Delete', 1, 'Del'), R('End'), R('PageDown', 1, 'PgDn')],
  [R('CapsLock', 1.75, 'Caps Lock'), ...'ASDFGHJKL'.split('').map((c) => R(c)), R(';', 1, ':<br>;'), R("'", 1, '"<br>\''), R('Enter', 2.25), GAP(3.25)],
  [R('Shift', 2.25), ...'ZXCVBNM'.split('').map((c) => R(c)), R(',', 1, '&lt;<br>,'), R('.', 1, '&gt;<br>.'), R('/', 1, '?<br>/'), R('Shift', 2.75), GAP(1.25), R('Up', 1, '↑'), GAP(1)],
  [R('Ctrl', 1.25), R('Win', 1.25, IS_MAC ? 'Win<small>⌃</small>' : 'Win'), R('Alt', 1.25), R('Space', 6.25, ''), R('Alt', 1.25), R('Win', 1.25), R('Menu', 1.25, '☰'), R('Ctrl', 1.25), GAP(.25), R('Left', 1, '←'), R('Down', 1, '↓'), R('Right', 1, '→')],
];
export const TOTAL_U = 18.5;

export class VirtualKeyboard {
  constructor(el, onCombo) {
    this.el = el; this.onCombo = onCombo; this.sticky = new Set();
    el.innerHTML = ROWS.map((row, i) => `<div class="kr${i === 0 ? ' fn' : ''}">${row.map((k) => k.gap ? `<span class="kgap" style="--w:${k.gap}"></span>`
      : `<button class="key${MODS.includes(k.k) ? ' mod' : ''}${k.k.length === 1 && /[A-Z0-9]/.test(k.k) ? ' ch' : ''}" data-k="${k.k}" style="--w:${k.w}" tabindex="-1">${k.label ?? k.k}</button>`).join('')}</div>`).join('');
    // không lấy mất con trỏ của ô đang gõ
    el.addEventListener('mousedown', (e) => e.preventDefault());
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.key'); if (!b) return;
      const k = b.dataset.k;
      if (MODS.includes(k)) {
        if (this.sticky.has(k) && this.sticky.size === 1 && k === 'Win') { this.sticky.clear(); this.paintSticky(); this.flash(['Win']); this.onCombo('Win', { virtual: true }); return; }
        this.sticky.has(k) ? this.sticky.delete(k) : this.sticky.add(k); this.paintSticky(); return;
      }
      const combo = join(this.sticky, k);
      this.flash([...this.sticky, k]);
      this.sticky.clear(); this.paintSticky();
      this.onCombo(combo, { virtual: true });
    });
  }
  keysFor(name) { return this.el.querySelectorAll(`.key[data-k="${CSS.escape(name)}"]`); }
  press(name, on) { this.keysFor(name).forEach((b) => b.classList.toggle('down', on)); }
  releaseAll() { this.el.querySelectorAll('.key.down').forEach((b) => b.classList.remove('down')); }
  flash(names) { names.forEach((n) => this.keysFor(n).forEach((b) => { b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 220); })); }
  paintSticky() { this.el.querySelectorAll('.key.mod').forEach((b) => b.classList.toggle('sticky', this.sticky.has(b.dataset.k))); }
  hint(combo) { this.el.querySelectorAll('.key.hint').forEach((b) => b.classList.remove('hint')); if (combo) parts(combo).forEach((p) => this.keysFor(p).forEach((b) => b.classList.add('hint'))); }
  result(combo, ok) { parts(combo).forEach((p) => this.keysFor(p).forEach((b) => { b.classList.add(ok ? 'good' : 'bad'); setTimeout(() => b.classList.remove('good', 'bad'), 700); })); }
}
