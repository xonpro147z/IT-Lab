// Hệ điều hành giả lập "TinHoc OS": màn hình nền, cửa sổ, thanh tác vụ, menu Start và các màn hình hệ thống
import { APPS } from './apps.js';
import { parts, MODS } from './keyboard.js';

export const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const SHIFTED = { '1': '!', '2': '@', '3': '#', '4': '$', '5': '%', '6': '^', '7': '&', '8': '*', '9': '(', '0': ')', '-': '_', '=': '+', '[': '{', ']': '}', '\\': '|', ';': ':', "'": '"', ',': '<', '.': '>', '/': '?', '`': '~' };
export const W = 960, H = 560, TB = 44;

export function charOf(combo) {
  const p = parts(combo); const main = p[p.length - 1]; const mods = p.slice(0, -1);
  if (mods.some((m) => m !== 'Shift')) return null;
  const sh = mods.includes('Shift');
  if (main === 'Space') return ' ';
  if (main.length !== 1) return null;
  if (/[A-Z]/.test(main)) return sh ? main : main.toLowerCase();
  return sh ? (SHIFTED[main] || main) : main;
}

const EDIT_CTRL = new Set(['Ctrl+A', 'Ctrl+C', 'Ctrl+X', 'Ctrl+V', 'Ctrl+Z', 'Ctrl+Left', 'Ctrl+Right', 'Ctrl+Home', 'Ctrl+End', 'Ctrl+Up', 'Ctrl+Down',
  'Ctrl+Shift+Left', 'Ctrl+Shift+Right', 'Ctrl+Shift+Home', 'Ctrl+Shift+End', 'Ctrl+Backspace', 'Ctrl+Delete']);
const NON_EDIT_PLAIN = /^(Shift\+)?(Esc|Tab|F\d+|PrtScn|Insert|ScrLk|Pause|Menu|CapsLock)$/;

export class OS {
  constructor(screen, opts = {}) {
    this.s = screen; this.wins = []; this.z = 10; this.active = null; this.ov = null; this.locked = false;
    this.clip = []; this.fileClip = null; this.lastEditable = null; this.onChange = opts.onChange || (() => {});
    this.build();
    document.addEventListener('focusin', (e) => { if (this.isEditable(e.target)) this.lastEditable = e.target; });
  }

  // ===================== Dựng màn hình =====================
  build() {
    this.s.innerHTML = `<div class="wall"></div>
      <div class="dicons">${[['explorer', 'Tệp'], ['browser', 'Trình duyệt'], ['notepad', 'Ghi chú'], ['word', 'Word'], ['excel', 'Excel'], ['ppt', 'PowerPoint'], ['recycle', 'Thùng rác']]
        .map(([a, n]) => `<div class="dicon" data-app="${a}">${appIcon(a, 34)}<span>${n}</span></div>`).join('')}</div>
      <div class="winlayer"></div>
      <div class="taskbar"><div class="tbc"><button class="tbi start" title="Start">${startGlyph()}</button>
        ${['explorer', 'browser', 'notepad', 'word', 'excel', 'ppt'].map((a) => `<button class="tbi" data-app="${a}" title="${APPS[a].name}">${appIcon(a, 24)}<i></i></button>`).join('')}<span class="tbrun"></span></div>
        <div class="tray"><span>VIE</span><span>⌔</span><span>🔊</span><span class="clock"></span></div></div>
      <div class="ovlayer"></div><div class="ntfs"></div>`;
    this.layer = this.s.querySelector('.winlayer'); this.ovl = this.s.querySelector('.ovlayer');
    this.s.querySelectorAll('.dicon').forEach((d) => {
      d.onclick = () => { this.s.querySelectorAll('.dicon.sel').forEach((x) => x.classList.remove('sel')); d.classList.add('sel'); };
      d.ondblclick = () => d.dataset.app === 'recycle' ? this.open('explorer', { path: 'recycle' }) : this.open(d.dataset.app);
    });
    this.s.querySelector('.start').onclick = () => this.toggleStart();
    this.s.querySelectorAll('.tbc > .tbi[data-app]').forEach((b) => (b.onclick = () => this.taskbarClick(b.dataset.app)));
    this.layer.addEventListener('mousedown', (e) => { const w = this.wins.find((x) => x.el.contains(e.target)); if (w && w !== this.active) this.focus(w); }, true);
    this.s.querySelector('.wall').onmousedown = () => { this.closeOverlay(); this.active = null; this.paint(); };
    const tick = () => { const d = new Date(); this.s.querySelector('.clock').innerHTML = `${pad(d.getHours())}:${pad(d.getMinutes())}<br>${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
    tick(); setInterval(tick, 10000);
  }

  reset() {
    this.closeOverlay(); this.locked = false; this.s.querySelector('.lock')?.remove();
    [...this.wins].forEach((w) => this.close(w, true)); this.clip = []; this.fileClip = null; this.paint();
  }

  // ===================== Cửa sổ =====================
  open(app, opts = {}) {
    const def = APPS[app]; if (!def) return null;
    this.closeOverlay();
    const n = this.wins.length;
    const w = { os: this, id: Math.random().toString(36).slice(2), app, def, title: def.name, x: 70 + (n % 6) * 34, y: 26 + (n % 6) * 26, w: def.w || 640, h: def.h || 400, min: false, max: !!def.max, snap: null, state: {}, opts };
    w.el = h(`<div class="win ${def.cls || ''}" data-app="${app}"><div class="tbar"><span class="ico">${appIcon(app, 16)}</span><span class="tt"></span><span class="sp"></span>
      <button class="wb" data-a="min" title="Thu nhỏ (Win+↓)">─</button><button class="wb" data-a="max" title="Phóng to (Win+↑)">▢</button><button class="wb cls" data-a="close" title="Đóng (Alt+F4)">✕</button></div><div class="wbody"></div></div>`);
    w.body = w.el.querySelector('.wbody');
    w.el.querySelectorAll('.wb').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const a = b.dataset.a; a === 'min' ? this.minimize(w) : a === 'max' ? this.toggleMax(w) : this.close(w); }));
    this.drag(w);
    this.layer.appendChild(w.el); this.wins.push(w);
    def.init(w, this, opts);
    this.setTitle(w, w.title); this.layout(w); this.focus(w);
    w.el.classList.add('opening'); setTimeout(() => w.el.classList.remove('opening'), 260);
    this.paint(); this.onChange();
    return w;
  }
  ensure(app, opts) { const w = this.wins.find((x) => x.app === app); if (w) { this.focus(w); return w; } return this.open(app, opts); }
  setTitle(w, t) { w.title = t; w.el.querySelector('.tt').textContent = t; this.paint(); }
  focus(w) {
    if (!w) return; w.min = false; w.el.style.zIndex = ++this.z; this.active = w; this.layout(w); this.paint();
    w.def.focus?.(w, this);
  }
  close(w, silent) {
    if (!w) return; if (!silent && w.def.beforeClose && w.def.beforeClose(w, this) === false) return;
    w.def.destroy?.(w, this);
    w.el.classList.add('closing'); setTimeout(() => w.el.remove(), silent ? 0 : 180);
    this.wins = this.wins.filter((x) => x !== w);
    if (this.active === w) this.active = this.topWindow();
    this.paint(); this.onChange();
  }
  topWindow() { return this.wins.filter((x) => !x.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0] || null; }
  minimize(w) { w.min = true; this.layout(w); if (this.active === w) this.active = this.topWindow(); if (this.active) this.focus(this.active); this.paint(); }
  toggleMax(w) { w.max = !w.max; w.snap = null; this.layout(w); }
  snap(w, side) { w.max = false; w.snap = w.snap && w.snap !== side ? null : side; this.layout(w); }
  layout(w) {
    const st = w.el.style;
    w.el.classList.toggle('min', w.min); w.el.classList.toggle('max', !!w.max || !!w.snap); w.el.classList.toggle('full', !!w.full);
    if (w.full) Object.assign(st, { left: '0px', top: '0px', width: W + 'px', height: H + 'px' });
    else if (w.max) Object.assign(st, { left: '0px', top: '0px', width: W + 'px', height: H - TB + 'px' });
    else if (w.snap) Object.assign(st, { left: (w.snap === 'right' ? W / 2 : 0) + 'px', top: '0px', width: W / 2 + 'px', height: H - TB + 'px' });
    else Object.assign(st, { left: w.x + 'px', top: w.y + 'px', width: w.w + 'px', height: w.h + 'px' });
  }
  drag(w) {
    const bar = w.el.querySelector('.tbar');
    bar.ondblclick = (e) => { if (!e.target.closest('.wb')) this.toggleMax(w); };
    bar.onmousedown = (e) => {
      if (e.target.closest('.wb') || w.max || w.snap) return;
      const sc = this.scale(); const sx = e.clientX, sy = e.clientY, ox = w.x, oy = w.y;
      w.el.classList.add('dragging');
      const mv = (ev) => { w.x = Math.round(ox + (ev.clientX - sx) / sc); w.y = Math.max(0, Math.round(oy + (ev.clientY - sy) / sc)); this.layout(w); };
      const up = () => { w.el.classList.remove('dragging'); removeEventListener('mousemove', mv); removeEventListener('mouseup', up); };
      addEventListener('mousemove', mv); addEventListener('mouseup', up);
    };
  }
  scale() { return this.s.getBoundingClientRect().width / W || 1; }
  taskbarClick(app) {
    const ws = this.wins.filter((x) => x.app === app);
    if (!ws.length) return this.open(app);
    const w = ws[0];
    if (this.active === w && !w.min) this.minimize(w); else this.focus(w);
  }
  paint() {
    this.wins.forEach((w) => w.el.classList.toggle('active', w === this.active));
    this.s.querySelectorAll('.tbc > .tbi[data-app]').forEach((b) => {
      const ws = this.wins.filter((x) => x.app === b.dataset.app);
      b.classList.toggle('run', ws.length > 0); b.classList.toggle('act', !!this.active && this.active.app === b.dataset.app && !this.active.min);
    });
    const extra = this.wins.filter((w) => !['explorer', 'browser', 'notepad', 'word', 'excel', 'ppt'].includes(w.app));
    const run = this.s.querySelector('.tbrun');
    run.innerHTML = extra.map((w) => `<button class="tbi run${w === this.active ? ' act' : ''}" data-id="${w.id}" title="${esc(w.title)}">${appIcon(w.app, 24)}<i></i></button>`).join('');
    run.querySelectorAll('.tbi').forEach((b) => (b.onclick = () => { const w = this.wins.find((x) => x.id === b.dataset.id); this.active === w && !w.min ? this.minimize(w) : this.focus(w); }));
  }
  activeApp() { if (this.locked) return 'lock'; if (this.ov) return this.ov.type; return this.active && !this.active.min ? this.active.app : 'desktop'; }

  // ===================== Hộp thoại trong cửa sổ =====================
  dialog(w, { title, html, buttons, onOpen }) {
    this.closeDialog(w);
    const d = h(`<div class="dlgbg"><div class="dlg"><div class="dh">${esc(title)}</div><div class="dc">${html || ''}</div><div class="db">${buttons.map((b, i) => `<button data-i="${i}" class="${b.primary ? 'pri' : ''}">${esc(b.t)}</button>`).join('')}</div></div></div>`);
    w.el.appendChild(d);
    const run = (b) => { if (!b) return; const r = b.act?.(d); if (r !== false) this.closeDialog(w); };
    d.querySelectorAll('.db button').forEach((b) => (b.onclick = () => run(buttons[+b.dataset.i])));
    w.dialog = {
      el: d,
      key: (combo) => {
        if (combo === 'Enter') { run(buttons.find((b) => b.primary)); return true; }
        if (combo === 'Esc') { run(buttons.find((b) => b.cancel) || { act: () => {} }); return true; }
        return false;
      },
    };
    const inp = d.querySelector('input'); if (inp) setTimeout(() => { inp.focus(); inp.select(); }, 30);
    onOpen?.(d);
    return d;
  }
  closeDialog(w) { if (w?.dialog) { w.dialog.el.remove(); w.dialog = null; w.def.focus?.(w, this); } }

  // ===================== Lớp phủ hệ thống =====================
  openOverlay(type, el, key, onClose) { this.closeOverlay(); this.ovl.appendChild(el); this.ov = { type, el, key, onClose }; this.onChange(); return el; }
  closeOverlay() { if (!this.ov) return; const o = this.ov; this.ov = null; o.onClose?.(); o.el.classList.add('out'); setTimeout(() => o.el.remove(), 160); this.onChange(); if (this.active) this.active.def.focus?.(this.active, this); }
  notify(title, text) {
    const n = h(`<div class="ntf"><b>${esc(title)}</b><span>${esc(text || '')}</span></div>`);
    this.s.querySelector('.ntfs').appendChild(n); setTimeout(() => { n.classList.add('out'); setTimeout(() => n.remove(), 300); }, 2600);
  }
  flashScreen() { const f = h('<div class="flash"></div>'); this.s.appendChild(f); setTimeout(() => f.remove(), 500); }

  toggleStart() {
    if (this.ov?.type === 'start') return this.closeOverlay();
    const apps = ['explorer', 'browser', 'notepad', 'word', 'excel', 'ppt', 'settings', 'taskmgr', 'run'];
    const el = h(`<div class="startm"><input class="ss" placeholder="Nhập để tìm kiếm ứng dụng"><div class="stl">Đã ghim</div><div class="sg"></div>
      <div class="sf"><span class="user"><i>HS</i>Học sinh</span><button class="pw" title="Nguồn">⏻</button></div></div>`);
    const grid = el.querySelector('.sg'); const inp = el.querySelector('.ss');
    const draw = () => {
      const q = inp.value.trim().toLowerCase();
      const list = apps.filter((a) => !q || (APPS[a].name + ' ' + (APPS[a].kw || '')).toLowerCase().includes(q));
      grid.innerHTML = list.map((a, i) => `<div class="sa${q && i === 0 ? ' best' : ''}" data-app="${a}">${appIcon(a, 30)}<span>${APPS[a].name}</span></div>`).join('') || '<div class="none">Không tìm thấy</div>';
      grid.querySelectorAll('.sa').forEach((x) => (x.onclick = () => this.open(x.dataset.app)));
      return list;
    };
    inp.addEventListener('input', draw); draw();
    el.querySelector('.pw').onclick = () => this.shutdownDialog();
    this.openOverlay('start', el, (combo) => {
      if (combo === 'Esc' || combo === 'Win') { this.closeOverlay(); return true; }
      if (combo === 'Enter') { const l = draw(); if (l[0]) this.open(l[0]); return true; }
      return false;
    });
    setTimeout(() => inp.focus(), 40);
  }

  altTab(dir = 1, virtual = false) {
    const list = this.wins.slice().sort((a, b) => b.el.style.zIndex - a.el.style.zIndex);
    if (!list.length) return false;
    if (this.ov?.type !== 'alttab') {
      this.atIdx = list.length > 1 ? 1 : 0;
      const el = h('<div class="alttab"><div class="atw"></div></div>');
      this.openOverlay('alttab', el, (combo) => {
        if (combo === 'Alt+Tab' || combo === 'Alt+Shift+Tab') { this.altTab(combo === 'Alt+Tab' ? 1 : -1); return true; }
        if (combo === 'Esc' || combo === 'Alt+Esc') { this.closeOverlay(); return true; }
        if (combo === 'Enter') { this.commitAltTab(); return true; }
        return true;
      });
      this.atList = list;
    } else this.atIdx = (this.atIdx + dir + this.atList.length) % this.atList.length;
    const box = this.ov.el.querySelector('.atw');
    box.innerHTML = this.atList.map((w, i) => `<div class="atc${i === this.atIdx ? ' on' : ''}" data-i="${i}"><div class="atp">${appIcon(w.app, 40)}</div><span>${esc(w.title)}</span></div>`).join('');
    box.querySelectorAll('.atc').forEach((c) => (c.onclick = () => { this.atIdx = +c.dataset.i; this.commitAltTab(); }));
    clearTimeout(this.atTimer);
    this.atTimer = setTimeout(() => this.commitAltTab(), virtual ? 900 : 4000);
    return true;
  }
  commitAltTab() { clearTimeout(this.atTimer); if (this.ov?.type !== 'alttab') return; const w = this.atList[this.atIdx]; this.closeOverlay(); if (w) this.focus(w); }
  modUp(m) { if (m === 'Alt' && this.ov?.type === 'alttab') this.commitAltTab(); }

  taskView() {
    if (this.ov?.type === 'taskview') return this.closeOverlay();
    const el = h(`<div class="taskview"><div class="tvt">Task View — các cửa sổ đang mở</div><div class="tvg">${this.wins.map((w, i) => `<div class="tvc" data-i="${i}"><div class="tvh">${appIcon(w.app, 16)} ${esc(w.title)}</div><div class="tvp">${appIcon(w.app, 54)}</div></div>`).join('') || '<p>Chưa mở cửa sổ nào.</p>'}</div><div class="tvd"><span>Màn hình 1</span><span class="add">+ Màn hình mới</span></div></div>`);
    el.querySelectorAll('.tvc').forEach((c) => (c.onclick = () => { const w = this.wins[+c.dataset.i]; this.closeOverlay(); this.focus(w); }));
    el.onclick = (e) => { if (e.target === el) this.closeOverlay(); };
    this.openOverlay('taskview', el, (c) => { if (c === 'Esc' || c === 'Win+Tab') { this.closeOverlay(); return true; } return true; });
  }

  lock() {
    this.closeOverlay(); this.locked = true;
    const d = new Date(); const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const el = h(`<div class="lock"><div class="lt">${pad(d.getHours())}:${pad(d.getMinutes())}</div><div class="ld">${days[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}</div><div class="lkh">Bấm phím bất kỳ hoặc nhấp chuột để mở khoá</div></div>`);
    el.onclick = () => this.unlock(); this.s.appendChild(el); this.onChange();
  }
  unlock() { const l = this.s.querySelector('.lock'); if (!l) return; l.classList.add('up'); setTimeout(() => l.remove(), 450); this.locked = false; this.onChange(); }

  security() {
    const el = h(`<div class="secur"><div class="sx">${['Khoá', 'Đổi người dùng', 'Đăng xuất', 'Đổi mật khẩu', 'Task Manager'].map((x) => `<a data-a="${x}">${x}</a>`).join('')}<button class="cancel">Huỷ</button></div><div class="sh">Bấm Esc để quay lại</div></div>`);
    el.querySelectorAll('a').forEach((a) => (a.onclick = () => { const x = a.dataset.a; this.closeOverlay(); if (x === 'Khoá') this.lock(); else if (x === 'Task Manager') this.open('taskmgr'); else this.notify('TinHoc OS', 'Chức năng "' + x + '" chỉ có trên máy thật.'); }));
    el.querySelector('.cancel').onclick = () => this.closeOverlay();
    this.openOverlay('security', el, (c) => { if (c === 'Esc') this.closeOverlay(); return true; });
  }

  snip() {
    const el = h('<div class="snip"><div class="snbar"><span>▭ Hình chữ nhật</span><span>✎ Tự do</span><span>▣ Cửa sổ</span><span>⛶ Toàn màn hình</span><span class="x">✕</span></div><div class="snr"></div><div class="snh">Kéo chuột để chọn vùng cần chụp · Esc để huỷ</div></div>');
    const r = el.querySelector('.snr');
    el.querySelector('.x').onclick = () => this.closeOverlay();
    el.onmousedown = (e) => {
      if (e.target.closest('.snbar')) return;
      const box = this.s.getBoundingClientRect(), sc = this.scale();
      const x0 = (e.clientX - box.left) / sc, y0 = (e.clientY - box.top) / sc;
      const mv = (ev) => { const x = (ev.clientX - box.left) / sc, y = (ev.clientY - box.top) / sc; Object.assign(r.style, { display: 'block', left: Math.min(x, x0) + 'px', top: Math.min(y, y0) + 'px', width: Math.abs(x - x0) + 'px', height: Math.abs(y - y0) + 'px' }); };
      const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); this.closeOverlay(); this.flashScreen(); this.addClip('[Ảnh chụp một vùng màn hình]'); this.notify('Công cụ Cắt', 'Ảnh chụp đã được chép vào bộ nhớ tạm.'); };
      addEventListener('mousemove', mv); addEventListener('mouseup', up);
    };
    this.openOverlay('snip', el, (c) => { if (c === 'Esc') this.closeOverlay(); return true; });
  }

  addClip(t) { if (!t) return; this.clip = [t, ...this.clip.filter((x) => x !== t)].slice(0, 12); }

  panel(type, html, cls, onKey) {
    if (this.ov?.type === type) { this.closeOverlay(); return null; }
    const target = this.lastEditable;
    const el = h(`<div class="panel ${cls}">${html}</div>`);
    this.openOverlay(type, el, (c) => { if (c === 'Esc') { this.closeOverlay(); return true; } return onKey ? onKey(c) : false; });
    el.target = target; return el;
  }
  insertInto(target, text) {
    if (!target || !document.contains(target)) { this.notify('Chưa chọn chỗ dán', 'Hãy nhấp vào một ô soạn thảo trước.'); return; }
    this.closeOverlay(); target.focus(); document.execCommand('insertText', false, text);
  }
  clipboardPanel() {
    const el = this.panel('clipboard', `<div class="ph">Bộ nhớ tạm <span>Win + V</span></div>${this.clip.length ? this.clip.map((c, i) => `<div class="ci" data-i="${i}">${esc(c.length > 120 ? c.slice(0, 120) + '…' : c)}</div>`).join('') : '<div class="empty">Chưa có gì. Hãy sao chép (Ctrl + C) một đoạn chữ trước.</div>'}`, 'clipp');
    el?.querySelectorAll('.ci').forEach((c) => (c.onclick = () => this.insertInto(el.target, this.clip[+c.dataset.i])));
  }
  emojiPanel() {
    const E = '😀😃😄😁😆😅😂🤣😊😇🙂😉😍🥰😘😎🤓🧐🤔🤗😴😭😡👍👎👏🙏💪✌️👋❤️🔥⭐🎉🎂📚✏️💻⌨️🖱️🖥️📱🔋💾📀🎮🎧📷'.match(/\p{Extended_Pictographic}️?/gu);
    const el = this.panel('emoji', `<div class="ph">Biểu tượng cảm xúc <span>Win + .</span></div><div class="eg">${E.map((e) => `<span>${e}</span>`).join('')}</div>`, 'emojip');
    el?.querySelectorAll('.eg span').forEach((s) => (s.onclick = () => this.insertInto(el.target, s.textContent)));
  }
  quickSettings() {
    const el = this.panel('quick', `<div class="qg">${['Wi-Fi', 'Bluetooth', 'Chế độ máy bay', 'Tiết kiệm pin', 'Ánh sáng ban đêm', 'Hỗ trợ tiếp cận'].map((t, i) => `<button class="${i < 2 ? 'on' : ''}">${t}</button>`).join('')}</div>
      <label>☀ <input type="range" value="70"></label><label>🔊 <input type="range" value="45"></label><div class="qb">🔋 86%</div>`, 'quickp');
    el?.querySelectorAll('.qg button').forEach((b) => (b.onclick = () => b.classList.toggle('on')));
  }
  quickLink() {
    const items = [['Ứng dụng đã cài', null], ['Trình xem sự kiện', null], ['Hệ thống', 'settings'], ['Quản lý thiết bị', null], ['Task Manager', 'taskmgr'], ['Cài đặt', 'settings'], ['File Explorer', 'explorer'], ['Tìm kiếm', 'start'], ['Run', 'run'], ['Màn hình nền', 'desktop']];
    const el = this.panel('quicklink', items.map(([t, a]) => `<div class="qi" data-a="${a || ''}">${t}</div>`).join(''), 'qlink');
    el?.querySelectorAll('.qi').forEach((q) => (q.onclick = () => { const a = q.dataset.a; this.closeOverlay(); if (a === 'start') this.toggleStart(); else if (a === 'desktop') this.showDesktop(); else if (a) this.open(a); else this.notify('TinHoc OS', 'Mục này chỉ có trên máy thật.'); }));
  }
  showDesktop() {
    const vis = this.wins.filter((w) => !w.min);
    if (vis.length) { this.hiddenByD = vis; vis.forEach((w) => { w.min = true; this.layout(w); }); this.active = null; }
    else if (this.hiddenByD?.length) { this.hiddenByD.filter((w) => this.wins.includes(w)).forEach((w) => this.focus(w)); this.hiddenByD = null; }
    this.paint();
  }
  shutdownDialog() {
    const el = h(`<div class="shut"><div class="sdb"><div class="sdt">Tắt Windows</div><p>Bạn muốn máy tính làm gì?</p><select><option>Tắt máy</option><option>Khởi động lại</option><option>Ngủ</option><option>Đăng xuất</option></select><div class="sbt"><button class="pri">OK</button><button>Huỷ</button></div></div></div>`);
    const go = () => {
      const v = el.querySelector('select').value; this.closeOverlay();
      if (v === 'Ngủ') return this.lock();
      const b = h(`<div class="boot"><div>${v === 'Tắt máy' ? 'Đang tắt máy…' : 'Đang khởi động lại…'}</div></div>`); this.s.appendChild(b);
      setTimeout(() => { this.reset(); b.innerHTML = '<div>TinHoc OS</div><small>Đang khởi động…</small>'; setTimeout(() => b.remove(), 1100); }, 1300);
    };
    el.querySelector('.pri').onclick = go; el.querySelectorAll('button')[1].onclick = () => this.closeOverlay();
    this.openOverlay('shutdown', el, (c) => { if (c === 'Enter') go(); else if (c === 'Esc') this.closeOverlay(); else if (c === 'Down' || c === 'Up') { const s = el.querySelector('select'); s.selectedIndex = Math.max(0, Math.min(3, s.selectedIndex + (c === 'Down' ? 1 : -1))); } return true; });
  }

  // ===================== Xử lý phím =====================
  isEditable(el) { return !!el && this.s.contains(el) && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|)$/.test(el.type)) || el.isContentEditable); }
  editable() { const a = document.activeElement; return this.isEditable(a) ? a : null; }
  isEditCombo(combo, el) {
    if (EDIT_CTRL.has(combo)) return true;
    const p = parts(combo);
    if (p.some((x) => ['Ctrl', 'Alt', 'Win'].includes(x))) return false;
    if (NON_EDIT_PLAIN.test(combo)) return false;
    if (/^(Shift\+)?Enter$/.test(combo) && el && el.tagName === 'INPUT') return false;
    if (/^(Up|Down)$/.test(combo) && el && el.tagName === 'INPUT') return false;
    return true;
  }
  // Phím vật lý: cho trình duyệt tự xử lý khi đang gõ chữ trong ô soạn thảo
  wantsNative(combo, target) { if (this.locked || (this.ov && !['start'].includes(this.ov.type))) return false; return this.isEditable(target) && this.isEditCombo(combo, target); }

  handle(combo, ctx = {}) {
    if (this.locked) { this.unlock(); return true; }
    if (this.ov?.key) { const r = this.ov.key(combo, ctx); if (r) return true; }
    if (this.global(combo, ctx)) return true;
    const w = this.active && !this.active.min ? this.active : null;
    if (w?.dialog && w.dialog.key(combo, ctx)) return true;
    const ed = this.editable();
    if (ed && this.isEditCombo(combo, ed)) {
      if (w && w.def.editKey?.(combo, w, this, ctx, ed)) return true;
      if (ctx.native) { if (combo === 'Ctrl+C' || combo === 'Ctrl+X') this.addClip(selText(ed)); return true; }
      return this.emulate(combo, ed);
    }
    if (w && w.def.key?.(combo, w, this, ctx)) return true;
    if (!w) return this.desktopKey(combo);
    return false;
  }

  global(combo, ctx) {
    const w = this.active && !this.active.min ? this.active : null;
    switch (combo) {
      case 'Win': this.toggleStart(); return true;
      case 'Win+E': this.open('explorer'); return true;
      case 'Win+D': this.closeOverlay(); this.showDesktop(); return true;
      case 'Win+M': this.closeOverlay(); this.wins.forEach((x) => { x.min = true; this.layout(x); }); this.active = null; this.paint(); return true;
      case 'Win+Up': if (w) { if (w.snap) w.snap = null; else w.max = true; this.layout(w); } return true;
      case 'Win+Down': if (w) { if (w.max || w.snap) { w.max = false; w.snap = null; this.layout(w); } else this.minimize(w); } return true;
      case 'Win+Left': if (w) this.snap(w, 'left'); return true;
      case 'Win+Right': if (w) this.snap(w, 'right'); return true;
      case 'Win+Tab': this.taskView(); return true;
      case 'Alt+Tab': case 'Alt+Shift+Tab': if (!this.altTab(combo === 'Alt+Tab' ? 1 : -1, ctx.virtual)) this.notify('Alt + Tab', 'Chưa có cửa sổ nào đang mở.'); return true;
      case 'Alt+F4': this.closeOverlay(); if (w) this.close(w); else this.shutdownDialog(); return true;
      case 'Win+I': this.ensure('settings'); return true;
      case 'Win+R': this.ensure('run'); return true;
      case 'Win+V': this.clipboardPanel(); return true;
      case 'Win+.': case 'Win+;': this.emojiPanel(); return true;
      case 'Win+A': this.quickSettings(); return true;
      case 'Win+X': this.quickLink(); return true;
      case 'PrtScn': case 'Win+PrtScn': this.flashScreen(); this.addClip('[Ảnh chụp toàn màn hình]'); this.notify('Đã chụp màn hình', 'Ảnh đã được chép vào bộ nhớ tạm. Dán (Ctrl + V) vào Word hoặc Paint để dùng.'); return true;
      case 'Win+Shift+S': this.snip(); return true;
      case 'Ctrl+Shift+Esc': this.closeOverlay(); this.ensure('taskmgr'); return true;
      case 'Ctrl+Alt+Delete': this.security(); return true;
      case 'Win+L': this.lock(); return true;
    }
    return false;
  }

  desktopKey(combo) {
    const icons = [...this.s.querySelectorAll('.dicon')]; let i = icons.findIndex((d) => d.classList.contains('sel'));
    const sel = (j) => { icons.forEach((d) => d.classList.remove('sel')); icons[(j + icons.length) % icons.length].classList.add('sel'); };
    if (combo === 'Down' || combo === 'Right') { sel(i + 1); return true; }
    if (combo === 'Up' || combo === 'Left') { sel(i < 0 ? 0 : i - 1); return true; }
    if (combo === 'Enter' && i >= 0) { icons[i].ondblclick(); return true; }
    return false;
  }

  // Giả lập thao tác soạn thảo khi bấm trên bàn phím ảo
  emulate(combo, el) {
    const ta = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT';
    el.focus();
    const ch = charOf(combo);
    if (ch !== null) { document.execCommand('insertText', false, ch); return true; }
    switch (combo) {
      case 'Ctrl+A': if (ta) el.select(); else { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } return true;
      case 'Ctrl+C': case 'Ctrl+X': { const t = selText(el); if (t) { this.addClip(t); try { navigator.clipboard.writeText(t); } catch {} if (combo === 'Ctrl+X') document.execCommand('delete'); } return true; }
      case 'Ctrl+V': if (this.clip[0]) document.execCommand('insertText', false, this.clip[0]); return true;
      case 'Ctrl+Z': document.execCommand('undo'); return true;
      case 'Backspace': document.execCommand('delete'); return true;
      case 'Delete': document.execCommand('forwardDelete'); return true;
      case 'Ctrl+Backspace': move(el, 'Left', true, true); document.execCommand('delete'); return true;
      case 'Ctrl+Delete': move(el, 'Right', true, true); document.execCommand('delete'); return true;
      case 'Enter': case 'Shift+Enter': ta ? document.execCommand('insertText', false, '\n') : document.execCommand(combo === 'Enter' ? 'insertParagraph' : 'insertLineBreak'); return true;
    }
    const p = parts(combo); const key = p[p.length - 1];
    if (['Left', 'Right', 'Up', 'Down', 'Home', 'End', 'PageUp', 'PageDown'].includes(key)) { move(el, key, p.includes('Ctrl'), p.includes('Shift')); return true; }
    return false;
  }
}

export function selText(el) {
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value.slice(el.selectionStart, el.selectionEnd);
  return String(getSelection());
}

// Di chuyển con trỏ (giả lập phím mũi tên, Home, End…)
export function move(el, key, ctrl, shift) {
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    const v = el.value; const back = el.selectionDirection === 'backward';
    let a = back ? el.selectionEnd : el.selectionStart, f = back ? el.selectionStart : el.selectionEnd;
    const hasSel = el.selectionStart !== el.selectionEnd;
    const ls = (i) => v.lastIndexOf('\n', i - 1) + 1, le = (i) => { const j = v.indexOf('\n', i); return j < 0 ? v.length : j; };
    let n = f;
    if (key === 'Left') n = ctrl ? prevWord(v, f) : (!shift && hasSel ? Math.min(a, f) : Math.max(0, f - 1));
    if (key === 'Right') n = ctrl ? nextWord(v, f) : (!shift && hasSel ? Math.max(a, f) : Math.min(v.length, f + 1));
    if (key === 'Home') n = ctrl ? 0 : ls(f);
    if (key === 'End') n = ctrl ? v.length : le(f);
    if (key === 'Up' || key === 'PageUp') { const s = ls(f), col = f - s; if (s === 0) n = 0; else { const ps = ls(s - 1); n = Math.min(ps + col, s - 1); } }
    if (key === 'Down' || key === 'PageDown') { const s = ls(f), col = f - s, e = le(f); if (e >= v.length) n = v.length; else { const ne = le(e + 1); n = Math.min(e + 1 + col, ne); } }
    if (shift) { el.setSelectionRange(Math.min(a, n), Math.max(a, n), n < a ? 'backward' : 'forward'); } else el.setSelectionRange(n, n);
    return;
  }
  const s = getSelection(); const alter = shift ? 'extend' : 'move';
  const map = { Left: ['backward', ctrl ? 'word' : 'character'], Right: ['forward', ctrl ? 'word' : 'character'], Up: ['backward', ctrl ? 'paragraph' : 'line'], Down: ['forward', ctrl ? 'paragraph' : 'line'],
    Home: ['backward', ctrl ? 'documentboundary' : 'lineboundary'], End: ['forward', ctrl ? 'documentboundary' : 'lineboundary'], PageUp: ['backward', 'documentboundary'], PageDown: ['forward', 'documentboundary'] };
  const [d, g] = map[key]; s.modify(alter, d, g);
}
const isW = (c) => /[\p{L}\p{N}_]/u.test(c);
function prevWord(v, i) { while (i > 0 && !isW(v[i - 1])) i--; while (i > 0 && isW(v[i - 1])) i--; return i; }
function nextWord(v, i) { while (i < v.length && isW(v[i])) i++; while (i < v.length && !isW(v[i]) && v[i] !== '\n') i++; return i; }

// ===================== Biểu tượng =====================
const ICON = {
  explorer: ['#f8c93c', '<path d="M5 9h8l2 2h12v12H5z" fill="#fff" opacity=".9"/>'],
  browser: ['linear', '<circle cx="16" cy="16" r="7" fill="#fff"/><circle cx="16" cy="16" r="3.4" fill="#1a8cd8"/>'],
  notepad: ['#5e5ce6', '<rect x="9" y="7" width="14" height="18" rx="2" fill="#fff"/><path d="M12 12h8M12 16h8M12 20h5" stroke="#5e5ce6" stroke-width="1.6"/>'],
  word: ['#185abd', '<text x="16" y="21.5" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="Arial">W</text>'],
  excel: ['#107c41', '<text x="16" y="21.5" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="Arial">X</text>'],
  ppt: ['#c43e1c', '<text x="16" y="21.5" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="Arial">P</text>'],
  recycle: ['#8e8e93', '<path d="M11 11h10l-1 13h-8z" fill="#fff"/><path d="M10 10h12M14 8h4" stroke="#fff" stroke-width="1.6"/>'],
  settings: ['#636366', '<circle cx="16" cy="16" r="6" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="3 2"/><circle cx="16" cy="16" r="2.4" fill="#fff"/>'],
  taskmgr: ['#30b0c7', '<path d="M8 20l4-5 4 3 4-7 4 4" fill="none" stroke="#fff" stroke-width="2"/>'],
  run: ['#3a3a3c', '<path d="M12 10l9 6-9 6z" fill="#fff"/>'],
};
export function appIcon(app, size = 24) {
  const [bg, g] = ICON[app] || ['#888', ''];
  const fill = bg === 'linear' ? 'url(#gB)' : bg;
  return `<svg class="aico" width="${size}" height="${size}" viewBox="0 0 32 32"><defs><linearGradient id="gB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34c759"/><stop offset=".5" stop-color="#0a84ff"/><stop offset="1" stop-color="#ff375f"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="${fill}"/>${g}</svg>`;
}
function startGlyph() { return '<svg width="22" height="22" viewBox="0 0 22 22"><rect x="2" y="2" width="8" height="8" rx="2" fill="#0a84ff"/><rect x="12" y="2" width="8" height="8" rx="2" fill="#5e5ce6"/><rect x="2" y="12" width="8" height="8" rx="2" fill="#30b0c7"/><rect x="12" y="12" width="8" height="8" rx="2" fill="#34c759"/></svg>'; }
export { MODS };
