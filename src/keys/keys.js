// Phòng luyện phím tắt: Tra cứu · Luyện tập · Kiểm tra
import { CATS, SHORTCUTS, macOf } from './shortcuts.js';
import { VirtualKeyboard, keyName, comboFromEvent, keycaps, MODS } from './keyboard.js';
import { OS, esc, W, H } from './os.js';
import { HELP } from './apps.js';

const $ = (s) => document.querySelector(s);
const IS_MAC = /Mac/.test(navigator.platform);
const IS_WIN = /Win/.test(navigator.platform);
const catOf = (id) => CATS.find((c) => c.id === id);
const APPNAME = { os: 'Bất kỳ đâu', notepad: 'Ghi chú', explorer: 'File Explorer', browser: 'Trình duyệt', word: 'Word', excel: 'Excel', ppt: 'PowerPoint' };

// tổ hợp tương đương được chấp nhận
const ALT = { 'Ctrl+=': ['Ctrl+Shift+='], F5: ['Ctrl+R'], 'Ctrl+L': ['Alt+D', 'F6'], 'Ctrl+Tab': ['Ctrl+PageDown'], 'Ctrl+Shift+Tab': ['Ctrl+PageUp'], 'Win+.': ['Win+;'], 'Ctrl+W': ['Ctrl+F4'],
  'explorer:Backspace': ['Alt+Left'], 'ppt:Right': ['Space', 'Down', 'N', 'Enter', 'PageDown'], 'ppt:Left': ['Up', 'P', 'PageUp', 'Backspace'], 'ppt:B': ['.'], 'ppt:W': [','], PrtScn: ['Win+PrtScn'] };
const matches = (s, combo) => s.k === combo || (ALT[s.k] || []).includes(combo) || (ALT[s.cat + ':' + s.k] || []).includes(combo);

// ---------- Khởi tạo ----------
const os = new OS($('#screen'), { onChange: () => {} });
const kb = new VirtualKeyboard($('#kb'), (combo, ctx) => dispatch(combo, ctx));
window.__keys = { os, kb, dispatch: (c) => dispatch(c, { virtual: true }), SHORTCUTS };
if (window.desktop?.kbCapture) {
  window.desktop.kbCapture(true);
  window.desktop.onCombo((c) => dispatch(c, { native: false }));
  window.desktop.onCloseWarn?.(() => toast('Đang ở phòng luyện phím tắt: bấm đóng thêm lần nữa nếu thật sự muốn thoát.', 'warn', 4000));
  addEventListener('beforeunload', () => window.desktop.kbCapture(false));
}
$('#osNote').textContent = IS_MAC ? 'Trên Mac: phím ⌘ được tính là Ctrl' : IS_WIN ? 'Phím có dấu ◆ nên bấm trên bàn phím ảo' : 'Phím có dấu ◆ nên bấm trên bàn phím ảo';

// ---------- Bố cục: co giãn màn hình + bàn phím ----------
function fit() {
  const st = $('#stage'); const sw = st.clientWidth, sh = st.clientHeight;
  const u = Math.max(24, Math.min(40, (sw - 60) / 18.9, (sh * 0.3) / 6.7));
  document.documentElement.style.setProperty('--u', u + 'px');
  const kbH = $('#kbWrap').offsetHeight, stripH = $('#strip').offsetHeight;
  const availH = sh - kbH - stripH - 44, availW = sw - 60;
  const s = Math.max(0.3, Math.min(availW / (W + 28), availH / (H + 40)));
  $('#screen').style.transform = `scale(${s})`;
  Object.assign($('#monitor').style, { width: W * s + 'px', height: H * s + 'px' });
}
new ResizeObserver(fit).observe($('#stage')); fit();

// ---------- Nhận phím thật ----------
let lastMod = null, used = false;
const isSideField = (t) => t && t.closest && t.closest('#side, #top') && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
addEventListener('keydown', (e) => {
  if (isSideField(e.target)) { if (e.key === 'Escape') e.target.blur(); return; }
  let name = keyName(e.code); if (IS_MAC && name === 'Win') name = 'Ctrl';
  if (name) kb.press(name, true);
  if (MODS.includes(name)) { if (!e.repeat) { lastMod = name; used = false; } if (name === 'Alt' || name === 'Win') e.preventDefault(); return; }
  const combo = comboFromEvent(e); if (!combo) return;
  used = true;
  if (combo === 'Alt+F4') { e.preventDefault(); return; } // đã nhận qua tiến trình chính
  const native = os.wantsNative(combo, e.target);
  if (!native) e.preventDefault();
  dispatch(combo, { native });
}, true);
addEventListener('keyup', (e) => {
  let name = keyName(e.code); if (IS_MAC && name === 'Win') name = 'Ctrl';
  if (name) kb.press(name, false);
  if (name === 'Win' && !IS_MAC && lastMod === 'Win' && !used && !isSideField(e.target)) { e.preventDefault(); dispatch('Win', {}); }
  if (MODS.includes(name)) { os.modUp(name); lastMod = null; }
  if (name === 'PrtScn') dispatch('PrtScn', {}); // nhiều hệ điều hành chỉ gửi keyup cho PrtScn
}, true);
addEventListener('blur', () => kb.releaseAll());

// ---------- Điều phối ----------
let mode = 'ref', lesson = null, quiz = null, lastPrt = 0;
function dispatch(combo, ctx = {}) {
  if (combo === 'PrtScn') { if (Date.now() - lastPrt < 400) return; lastPrt = Date.now(); }
  const before = os.activeApp();
  if (!ctx.virtual) kb.flash([]);
  if (ctx.virtual) { /* phím ảo đã nháy */ }
  os.handle(combo, ctx);
  showStrip(combo, before);
  if (lesson) lessonCombo(combo, before);
  if (quiz) quizCombo(combo, before);
}

function describe(combo, ctxApp) {
  const app = ctxApp === 'show' ? 'ppt' : ctxApp;
  const list = SHORTCUTS.filter((s) => matches(s, combo));
  return (list.find((s) => s.app === app && (!s.show || ctxApp === 'show')) || list.find((s) => s.app === 'os') || (ctxApp === 'desktop' ? null : list.find((s) => s.cat === 'text')) || null);
}
function showStrip(combo, ctxApp) {
  if (quiz && !quiz.reveal) { $('#strip').innerHTML = `<div class="sk">${keycaps(combo)}</div><div class="sd muted">Đã ghi nhận</div>`; return; }
  const s = describe(combo, ctxApp);
  const simple = /^(Shift\+)?[A-Z0-9]$|^Space$/.test(combo) && ctxApp !== 'show';
  $('#strip').innerHTML = `<div class="sk">${keycaps(combo)}</div><div class="sd">${s ? esc(s.d) : simple ? 'Gõ chữ' : '<span class="muted">' + (APPNAME[ctxApp] ? 'Không có phím tắt riêng trong ' + esc(APPNAME[ctxApp]) : ctxApp === 'desktop' ? 'Không có phím tắt riêng ở màn hình nền' : 'Đã bấm') + '</span>'}</div>`;
  $('#strip').classList.remove('pop'); void $('#strip').offsetWidth; $('#strip').classList.add('pop');
}

// ---------- Chế độ ----------
document.querySelectorAll('#modes button').forEach((b) => (b.onclick = () => setMode(b.dataset.m)));
$('#btnReset').onclick = () => { os.reset(); toast('Đã làm mới máy tính giả lập', 'info', 1500); };
function setMode(m) {
  mode = m; lesson = null; quiz = null; kb.hint(null);
  document.querySelectorAll('#modes button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
  ({ ref: renderRef, learn: renderLearnHome, quiz: renderQuizHome })[m]();
}

// ===== Tra cứu =====
let refCat = 'all', refQ = '';
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
function renderRef() {
  $('#side').innerHTML = `<div class="sidehead"><h2>Tra cứu</h2><p class="muted">${SHORTCUTS.length} phím tắt, chia theo nơi dùng. Nhấp một dòng để thử ngay trên máy.</p>
    <input class="field" id="refQ" placeholder="Tìm — sao chép, tab, Ctrl+Z…" value="${esc(refQ)}"><div class="chips">${[['all', 'Tất cả'], ...CATS.map((c) => [c.id, c.name])].map(([id, n]) => `<span class="chip${refCat === id ? ' on' : ''}" data-c="${id}">${n}</span>`).join('')}</div></div><div id="refList" class="scroll"></div>`;
  const draw = () => {
    const q = norm(refQ.trim());
    const list = SHORTCUTS.filter((s) => (refCat === 'all' || s.cat === refCat) && (!q || norm(s.d + ' ' + s.k + ' ' + catOf(s.cat).name).includes(q) || norm(s.k).replace(/\s/g, '').includes(q.replace(/\s/g, ''))));
    let html = '', last = '';
    list.forEach((s, i) => {
      if (s.cat !== last) { last = s.cat; const c = catOf(s.cat); html += `<div class="grp"><i style="background:${c.color}"></i>${c.name}<small>${c.sub}</small></div>`; }
      html += `<div class="row" data-i="${SHORTCUTS.indexOf(s)}"><div class="rd">${esc(s.d)}${s.os ? ' <span class="osb" title="Hệ điều hành thật có thể giành phím này — hãy bấm trên bàn phím ảo">◆</span>' : ''}</div><div class="rk">${keycaps(s.k, 'sm')}</div><div class="rm">macOS: ${esc(macOf(s))}</div></div>`;
    });
    $('#refList').innerHTML = html || '<p class="muted pad">Không tìm thấy phím tắt nào.</p>';
    $('#refList').querySelectorAll('.row').forEach((r) => (r.onclick = () => {
      const s = SHORTCUTS[+r.dataset.i]; $('#refList .row.on')?.classList.remove('on'); r.classList.add('on');
      kb.hint(s.k); prepare(s); showStrip(s.k, s.app);
      $('#strip .sd').insertAdjacentHTML('beforeend', ' <span class="muted">— bấm thử ngay</span>');
    }));
  };
  $('#refQ').addEventListener('input', (e) => { refQ = e.target.value; draw(); });
  document.querySelectorAll('#side .chip').forEach((c) => (c.onclick = () => { refCat = c.dataset.c; renderRef(); }));
  draw();
}

// ===== Chuẩn bị ngữ cảnh cho từng phím tắt =====
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function taSel(w, text, mode = 'select') {
  const ta = w.state.ta; ta.focus();
  if (mode === 'start') { ta.setSelectionRange(0, 0); return; }
  if (mode === 'end') { ta.setSelectionRange(ta.value.length, ta.value.length); return; }
  let i = ta.value.indexOf(text); if (i < 0) i = 0;
  if (mode === 'select') ta.setSelectionRange(i, i + text.length);
  if (mode === 'before') ta.setSelectionRange(i, i);
  if (mode === 'after') ta.setSelectionRange(i + text.length, i + text.length);
}
function wordSel(w, text, collapse) {
  const p = w.state.paper; p.focus();
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const n = walker.currentNode; const i = n.data.indexOf(text); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + text.length); if (collapse) r.collapse(collapse === 'start'); getSelection().removeAllRanges(); getSelection().addRange(r); return; } }
  const r = document.createRange(); r.selectNodeContents(p); r.collapse(false); getSelection().removeAllRanges(); getSelection().addRange(r);
}
function exGo(w, folder, select) {
  const st = w.state; const root = HELP.getFS(os); st.renaming = null;
  const dir = folder ? root.kids.find((k) => k.name === folder) : null;
  const path = dir ? [root, dir] : [root];
  if (st.path[st.path.length - 1] !== path[path.length - 1]) { st.back.push(st.path); st.path = path; }
  st.sel.clear(); w.body.querySelector('.exs').value = '';
  if (select) { const items = HELP.exItems(w); const i = items.findIndex((n) => n.name === select || n.name.startsWith(select)); if (i >= 0) { st.sel.add(items[i]); st.focus = i; } }
  HELP.exRender(w, os); document.activeElement?.blur();
}
function xlSel(w, a, b, si = 0) { const st = w.state; if (st.edit) { st.edit.remove(); st.edit = null; } const P = (x) => ({ c: 'ABCDEFGH'.indexOf(x[0]), r: +x.slice(1) - 1 }); st.si = si; st.anc = P(a); st.cur = P(b || a); HELP.render(w); document.activeElement?.blur(); }

const SETUP = {
  // Hệ điều hành
  'win:Alt+Tab': () => { os.ensure('browser'); os.ensure('notepad'); },
  'win:Win+Up': () => restore(os.ensure('notepad')),
  'win:Win+Down': () => { const w = os.ensure('notepad'); w.max = true; os.layout(w); },
  'win:Win+Left': () => restore(os.ensure('notepad')),
  'win:Win+Right': () => restore(os.ensure('notepad')),
  'win:Win+D': () => { os.ensure('notepad'); },
  'win:Win+M': () => { os.ensure('word'); os.ensure('notepad'); },
  'win:Win+Tab': () => { os.ensure('word'); os.ensure('notepad'); },
  'win:Alt+F4': () => os.ensure('run') && os.ensure('notepad'),
  'win:Win+V': () => { os.addClip('Phím tắt giúp em làm việc nhanh hơn'); os.addClip('Ctrl + C để sao chép'); taSel(os.ensure('notepad'), '', 'end'); },
  'win:Win+.': () => taSel(os.ensure('notepad'), '', 'end'),
  // Soạn thảo
  'text:Ctrl+A': (w) => taSel(w, '', 'start'),
  'text:Ctrl+C': (w) => taSel(w, 'phần cứng'),
  'text:Ctrl+V': (w) => { if (!os.clip.length) { os.addClip('phần cứng'); try { navigator.clipboard.writeText('phần cứng'); } catch {} } taSel(w, '', 'end'); },
  'text:Ctrl+X': (w) => taSel(w, 'gấp đôi'),
  'text:Home': (w) => taSel(w, 'có thể nhìn', 'before'),
  'text:End': (w) => taSel(w, 'có thể nhìn', 'before'),
  'text:Ctrl+Home': (w) => taSel(w, 'chương trình', 'before'),
  'text:Ctrl+End': (w) => taSel(w, '', 'start'),
  'text:Ctrl+Right': (w) => taSel(w, '', 'start'),
  'text:Ctrl+Left': (w) => taSel(w, 'chương trình', 'after'),
  'text:Shift+End': (w) => taSel(w, 'Phần cứng là', 'before'),
  'text:Ctrl+Shift+Right': (w) => taSel(w, 'Phần mềm là', 'before'),
  'text:Ctrl+Backspace': (w) => taSel(w, 'Luyện phím', 'after'),
  // Quản lý tệp
  'explorer:Enter': (w) => exGo(w, null, 'Hình ảnh'),
  'explorer:Backspace': (w) => { if (!w.state.back.length || w.state.path.length < 2) { exGo(w, null); exGo(w, 'Hình ảnh'); } },
  'explorer:Alt+Up': (w) => { if (w.state.path.length < 2) exGo(w, 'Nhạc'); },
  'explorer:Ctrl+Shift+N': (w) => exGo(w, 'Tài liệu'),
  'explorer:F2': (w) => exGo(w, 'Tài liệu', 'Ghi chú'),
  'explorer:Ctrl+A': (w) => exGo(w, 'Tài liệu'),
  'explorer:Ctrl+C': (w) => exGo(w, 'Tài liệu', 'Báo cáo nhóm'),
  'explorer:Ctrl+V': (w) => { exGo(w, 'Tài liệu'); if (!os.fileClip) { const d = HELP.getFS(os).kids[0]; os.fileClip = { nodes: [d.kids.find((k) => k.name.startsWith('Báo cáo'))].filter(Boolean), from: d }; } },
  'explorer:Delete': (w) => { exGo(w, 'Tài liệu', 'Báo cáo nhóm - Bản sao'); if (!w.state.sel.size) exGo(w, 'Tài liệu', 'Bảng điểm'); },
  'explorer:Shift+Delete': (w) => exGo(w, 'Tải xuống', 'Đề cương'),
  'explorer:Alt+Enter': (w) => exGo(w, 'Hình ảnh', 'Ảnh lớp'),
  'explorer:F5': (w) => exGo(w, 'Tài liệu'),
  // Trình duyệt
  'browser:Ctrl+W': (w) => { while (w.state.tabs.length < 3) HELP.newTab(w, 'https://tintuc.tinhoc.vn'); },
  'browser:Ctrl+Shift+T': (w) => { if (!w.state.closed.length) { HELP.newTab(w, 'https://video.tinhoc.vn'); w.state.closed.push(w.state.tabs.pop()); w.state.cur = w.state.tabs.length - 1; HELP.bRender(w); } },
  'browser:Ctrl+Tab': (w) => { while (w.state.tabs.length < 3) HELP.newTab(w, 'https://video.tinhoc.vn'); w.state.cur = 0; HELP.bRender(w); },
  'browser:Ctrl+Shift+Tab': (w) => { while (w.state.tabs.length < 3) HELP.newTab(w, 'https://video.tinhoc.vn'); },
  'browser:Ctrl+1': (w) => { while (w.state.tabs.length < 3) HELP.newTab(w, 'https://video.tinhoc.vn'); w.state.cur = w.state.tabs.length - 1; HELP.bRender(w); },
  'browser:Ctrl+9': (w) => { w.state.cur = 0; HELP.bRender(w); },
  'browser:Alt+Left': (w) => { const t = w.state.tabs[w.state.cur]; if (t.hi === 0) HELP.nav(w, 'https://wiki.tinhoc.vn/Ban_phim'); },
  'browser:Alt+Right': (w) => { const t = w.state.tabs[w.state.cur]; if (t.hi >= t.hist.length - 1) { HELP.nav(w, 'https://wiki.tinhoc.vn/Ban_phim'); t.hi--; HELP.bRender(w); } },
  'browser:Ctrl+F': (w) => { HELP.nav(w, 'https://wiki.tinhoc.vn/Ban_phim'); },
  // Word
  'word:Ctrl+B': (w) => wordSel(w, 'phím tắt'),
  'word:Ctrl+I': (w) => wordSel(w, 'thật nhanh'),
  'word:Ctrl+U': (w) => wordSel(w, 'không cần dùng chuột'),
  'word:Ctrl+E': (w) => wordSel(w, 'Bài thực hành', 'start'),
  'word:Ctrl+R': (w) => wordSel(w, 'Trường THCS', 'start'),
  'word:Ctrl+L': (w) => wordSel(w, 'Bài thực hành', 'start'),
  'word:Ctrl+J': (w) => wordSel(w, 'Phím tắt giúp', 'start'),
  'word:Ctrl+]': (w) => wordSel(w, 'Trường THCS Kết Nối Tri Thức'),
  'word:Ctrl+[': (w) => wordSel(w, 'Trường THCS Kết Nối Tri Thức'),
  'word:Ctrl+Shift+=': (w) => wordSel(w, 'a2', 'x') || selectLast(w, 'a2', 1),
  'word:Ctrl+=': (w) => selectLast(w, 'H2O', 1, 1),
  'word:Ctrl+2': (w) => wordSel(w, 'Phím tắt giúp', 'start'),
  'word:Ctrl+1': (w) => wordSel(w, 'Phím tắt giúp', 'start'),
  'word:Ctrl+Shift+L': (w) => wordSel(w, 'Trường THCS', 'start'),
  'word:Ctrl+K': (w) => wordSel(w, 'Trường THCS Kết Nối Tri Thức'),
  'word:Ctrl+Space': (w) => wordSel(w, 'phím tắt'),
  'word:Ctrl+Enter': (w) => wordSel(w, 'Trường THCS Kết Nối Tri Thức', 'end'),
  // Excel
  'excel:Ctrl+Home': (w) => xlSel(w, 'D6'),
  'excel:Ctrl+Down': (w) => xlSel(w, 'C2'),
  'excel:Ctrl+Right': (w) => xlSel(w, 'A3'),
  'excel:Ctrl+End': (w) => xlSel(w, 'A1'),
  'excel:F2': (w) => xlSel(w, 'C3'),
  'excel:Alt+=': (w) => xlSel(w, 'F2'),
  'excel:Ctrl+;': (w) => xlSel(w, 'B11'),
  'excel:Ctrl+Shift+;': (w) => xlSel(w, 'B12'),
  'excel:Ctrl+D': (w) => { const sh = w.state.sheets[0]; if (!sh.F2) sh.F2 = { v: '=SUM(C2:E2)' }; xlSel(w, 'F2', 'F8'); },
  'excel:Ctrl+Space': (w) => xlSel(w, 'D4'),
  'excel:Shift+Space': (w) => xlSel(w, 'D4'),
  'excel:Ctrl+B': (w) => xlSel(w, 'B2', 'B8'),
  'excel:Delete': (w) => { const sh = w.state.sheets[0]; if (!sh.B11) sh.B11 = { v: '01/01/2026' }; xlSel(w, 'B11'); },
  'excel:Ctrl+1': (w) => xlSel(w, 'C2'),
  'excel:Ctrl+PageDown': (w) => xlSel(w, 'A1', 'A1', 0),
  'excel:Ctrl+PageUp': (w) => xlSel(w, 'A1', 'A1', 1),
  // PowerPoint
  'ppt:Ctrl+D': (w) => { w.state.cur = 1; HELP.pRender(w); },
  'ppt:Delete': (w) => { if (w.state.slides.length < 5) { w.state.slides.splice(2, 0, { ...w.state.slides[1] }); } w.state.cur = 2; HELP.pRender(w); },
  'ppt:F5': (w) => { w.state.cur = 2; HELP.pRender(w); },
  'ppt:Shift+F5': (w) => { w.state.cur = 1; HELP.pRender(w); },
};
function restore(w) { w.max = false; w.snap = null; w.min = false; os.layout(w); os.focus(w); return w; }
function selectLast(w, word, off, len = 1) {
  const p = w.state.paper; p.focus(); const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const n = walker.currentNode; const i = n.data.indexOf(word); if (i >= 0) { const r = document.createRange(); r.setStart(n, i + off); r.setEnd(n, i + off + len); getSelection().removeAllRanges(); getSelection().addRange(r); return true; } }
  return false;
}
SETUP['word:Ctrl+Shift+='] = (w) => selectLast(w, 'a2', 1);

// Mở đúng ứng dụng và đặt sẵn tình huống cho một phím tắt
function prepare(s) {
  if (os.locked) os.unlock();
  const keepShow = s.show && os.ov?.type === 'show';
  if (!keepShow) os.closeOverlay();
  if (os.active?.dialog) os.closeDialog(os.active);
  os.active?.state?.findbar?.remove?.(); os.active?.state?.fb?.remove?.();
  if (s.cat === 'ppt' && !keepShow) { /* đóng trình chiếu cũ */ }
  let w = null;
  if (s.app !== 'os') {
    w = os.ensure(s.app);
    if (w.min || w.max || w.snap) restore(w);
    if (w.full) { w.full = false; os.layout(w); }
  }
  if (s.show && !keepShow) { w = os.ensure('ppt'); HELP.slideShow(w, os, 0); }
  SETUP[s.cat + ':' + s.k]?.(w);
  if (w && w.app === 'excel' && !SETUP[s.cat + ':' + s.k]) xlSel(w, 'C3');
  if (w && w.app === 'notepad' && !SETUP[s.cat + ':' + s.k]) taSel(w, '', 'end');
  return w;
}

// ===== Luyện tập =====
function renderLearnHome() {
  $('#side').innerHTML = `<div class="sidehead"><h2>Luyện tập</h2><p class="muted">Chọn một nhóm. Máy tính sẽ mở sẵn đúng phần mềm, em chỉ việc bấm phím.</p></div>
    <div class="scroll cards">${CATS.map((c) => { const n = SHORTCUTS.filter((s) => s.cat === c.id).length; const p = Progress.get('keys', 'learn-' + c.id);
      return `<div class="lcard" data-c="${c.id}"><i style="background:${c.color}"></i><div><b>${c.name}</b><span>${c.sub} · ${n} phím</span></div><em>${p ? (p.score === p.max ? '✓' : p.score + '/' + p.max) : '›'}</em></div>`; }).join('')}</div>`;
  document.querySelectorAll('.lcard').forEach((c) => (c.onclick = () => startLesson(c.dataset.c)));
}
function startLesson(cat) {
  os.reset();
  lesson = { cat, steps: SHORTCUTS.filter((s) => s.cat === cat), i: 0, done: new Set(), miss: 0 };
  drawLesson(); runStep();
}
function runStep() {
  const s = lesson.steps[lesson.i]; lesson.miss = 0; lesson.busy = false;
  prepare(s); kb.hint(s.k); drawLesson();
}
function drawLesson() {
  const L = lesson; const c = catOf(L.cat); const s = L.steps[L.i];
  const osWarn = s?.os && !(IS_MAC);
  $('#side').innerHTML = `<div class="sidehead"><a class="back">‹ Các nhóm</a><h2>${c.name}</h2><div class="pbar"><span style="width:${L.done.size / L.steps.length * 100}%;background:${c.color}"></span></div><p class="muted">${L.done.size}/${L.steps.length} phím tắt</p></div>
    ${s ? `<div class="step" id="stepCard"><div class="sn">Bước ${L.i + 1} · ${APPNAME[s.show ? 'ppt' : s.app]}</div><div class="sq">${esc(s.d)}</div><div class="skeys">${keycaps(s.k)}</div>
      ${osWarn ? '<p class="warn">◆ Trên máy thật, hệ điều hành có thể dùng phím này trước. Hãy <b>nhấp chuột trên bàn phím ảo</b>: nhấp các phím Ctrl/Alt/Shift/Win trước (chúng sẽ sáng lên), rồi nhấp phím còn lại.</p>' : ''}
      <div class="sact"><button class="pill sm light" id="btnSkip">Bỏ qua</button><button class="pill sm light" id="btnAgain">Đặt lại tình huống</button></div></div>`
    : `<div class="step done"><div class="sq">Hoàn thành!</div><p>Em đã thực hiện đúng ${L.done.size}/${L.steps.length} phím tắt nhóm ${c.name}.</p><div class="sact"><button class="pill sm" id="btnRe">Luyện lại</button><button class="pill sm light" id="btnQuizIt">Kiểm tra nhóm này</button></div></div>`}
    <div class="scroll steps">${L.steps.map((x, i) => `<div class="si${i === L.i ? ' cur' : ''}${L.done.has(i) ? ' ok' : ''}" data-i="${i}"><span class="ck">${L.done.has(i) ? '✓' : i + 1}</span><span class="t">${esc(x.d)}</span><span class="k">${keycaps(x.k, 'xs')}</span></div>`).join('')}</div>`;
  $('.back').onclick = () => setMode('learn');
  $('#btnSkip')?.addEventListener('click', () => nextStep());
  $('#btnAgain')?.addEventListener('click', () => runStep());
  $('#btnRe')?.addEventListener('click', () => startLesson(L.cat));
  $('#btnQuizIt')?.addEventListener('click', () => { setMode('quiz'); startQuiz(L.cat); });
  document.querySelectorAll('.steps .si').forEach((x) => (x.onclick = () => { lesson.i = +x.dataset.i; runStep(); }));
  $('.steps .si.cur')?.scrollIntoView({ block: 'nearest' });
}
function nextStep() {
  const L = lesson; let n = L.i + 1;
  while (n < L.steps.length && L.done.has(n)) n++;
  if (n >= L.steps.length) { n = L.steps.findIndex((_, i) => !L.done.has(i)); if (n < 0) n = L.steps.length; }
  L.i = n;
  if (L.i >= L.steps.length) { kb.hint(null); Progress.record('keys', 'learn-' + L.cat, L.done.size, L.steps.length); drawLesson(); toast('Hoàn thành nhóm ' + catOf(L.cat).name + '!', 'ok'); return; }
  runStep();
}
function lessonCombo(combo, before) {
  const L = lesson; const s = L.steps[L.i]; if (!s || L.busy) return;
  if (matches(s, combo)) {
    const need = s.show ? 'show' : s.app;
    if (need !== 'os' && before !== need && !(need === 'ppt' && before === 'show')) {
      toast(`Đúng phím rồi, nhưng cần bấm khi đang ở ${APPNAME[need === 'show' ? 'ppt' : need]}. Làm lại nhé!`, 'warn'); setTimeout(() => prepare(s), 400); return;
    }
    L.busy = true; L.done.add(L.i); kb.result(s.k, true);
    $('#stepCard')?.classList.add('good');
    setTimeout(() => { if (lesson === L) nextStep(); }, 1100);
  } else if (!/^(Shift\+)?[A-Z0-9]$/.test(combo) || s.k.length === 1) {
    L.miss++; $('#stepCard')?.classList.remove('shake'); void $('#stepCard')?.offsetWidth; $('#stepCard')?.classList.add('shake');
    if (L.miss === 2) toast('Gợi ý: các phím cần bấm đang sáng xanh trên bàn phím ảo.', 'info');
  }
}

// ===== Kiểm tra =====
let quizScope = 'all';
function renderQuizHome() {
  quiz = null;
  $('#side').innerHTML = `<div class="sidehead"><h2>Kiểm tra</h2><p class="muted">10 câu ngẫu nhiên. Đọc yêu cầu và bấm đúng phím tắt — không có gợi ý.</p>
    <div class="chips">${[['all', 'Tất cả'], ...CATS.map((c) => [c.id, c.name])].map(([id, n]) => `<span class="chip${quizScope === id ? ' on' : ''}" data-c="${id}">${n}</span>`).join('')}</div>
    <button class="pill" id="btnStartQuiz" style="margin-top:18px">Bắt đầu</button></div>
    <div class="scroll best">${[['all', 'Tất cả'], ...CATS.map((c) => [c.id, c.name])].map(([id, n]) => { const p = Progress.get('keys', 'quiz-' + id); return p ? `<div class="brow"><span>${n}</span><b>${p.score}/${p.max}</b></div>` : ''; }).join('')}</div>`;
  document.querySelectorAll('#side .chip').forEach((c) => (c.onclick = () => { quizScope = c.dataset.c; renderQuizHome(); }));
  $('#btnStartQuiz').onclick = () => startQuiz(quizScope);
}
function startQuiz(scope) {
  quizScope = scope; os.reset(); kb.hint(null);
  const pool = SHORTCUTS.filter((s) => scope === 'all' || s.cat === scope);
  const qs = pool.slice().sort(() => Math.random() - 0.5).slice(0, Math.min(10, pool.length));
  quiz = { scope, qs, i: 0, score: 0, t0: Date.now(), reveal: false, log: [] };
  askQ();
}
function askQ() {
  const Q = quiz; const s = Q.qs[Q.i]; Q.reveal = false; Q.wait = false;
  if (!s) return endQuiz();
  prepare(s); kb.hint(null);
  $('#side').innerHTML = `<div class="sidehead"><a class="back">‹ Dừng</a><h2>Câu ${Q.i + 1}<span class="muted">/${Q.qs.length}</span></h2><div class="pbar"><span style="width:${Q.i / Q.qs.length * 100}%"></span></div><p class="muted">Điểm: ${Q.score} · ${catOf(s.cat).name}</p></div>
    <div class="step" id="stepCard"><div class="sn">Đang ở: ${APPNAME[s.show ? 'ppt' : s.app]}${s.show ? ' (đang trình chiếu)' : ''}</div><div class="sq">${esc(s.d)}?</div><div class="skeys" id="qAns"><span class="muted">Bấm phím tắt trên bàn phím…</span></div>
    ${s.os && !IS_MAC ? '<p class="warn">◆ Có thể cần bấm trên bàn phím ảo.</p>' : ''}<div class="sact"><button class="pill sm light" id="btnIdk">Không biết</button></div></div>`;
  $('.back').onclick = () => setMode('quiz');
  $('#btnIdk').onclick = () => quizCombo('', null);
}
function quizCombo(combo, before) {
  const Q = quiz; const s = Q.qs[Q.i]; if (!s || Q.wait) return;
  Q.wait = true; Q.reveal = true;
  const ok = combo && matches(s, combo);
  if (ok) Q.score++;
  Q.log.push({ s, combo, ok });
  $('#qAns').innerHTML = keycaps(s.k) + `<span class="verdict ${ok ? 'ok' : 'bad'}">${ok ? 'Chính xác' : combo ? 'Chưa đúng — em đã bấm ' + esc(combo.replace(/\+/g, ' + ')) : 'Đáp án'}</span>`;
  $('#stepCard').classList.add(ok ? 'good' : 'badc');
  if (!ok) kb.hint(s.k); else kb.result(s.k, true);
  setTimeout(() => { if (quiz !== Q) return; kb.hint(null); Q.i++; askQ(); }, ok ? 1000 : 2200);
}
function endQuiz() {
  const Q = quiz; const sec = Math.round((Date.now() - Q.t0) / 1000);
  Progress.record('keys', 'quiz-' + Q.scope, Q.score, Q.qs.length);
  $('#side').innerHTML = `<div class="sidehead"><a class="back">‹ Kiểm tra</a><h2>Kết quả</h2></div><div class="result"><div class="big" style="color:${Q.score >= 8 ? '#1a7f37' : Q.score >= 5 ? '#a15c00' : '#c4291c'}">${Q.score}<span>/${Q.qs.length}</span></div><p class="muted">Thời gian: ${Math.floor(sec / 60)} phút ${sec % 60} giây</p>
    <div class="sact"><button class="pill sm" id="btnAgainQ">Làm lại</button><button class="pill sm light" id="btnOther">Nhóm khác</button></div></div>
    <div class="scroll steps">${Q.log.map((x) => `<div class="si ${x.ok ? 'ok' : 'no'}"><span class="ck">${x.ok ? '✓' : '✕'}</span><span class="t">${esc(x.s.d)}</span><span class="k">${keycaps(x.s.k, 'xs')}</span></div>`).join('')}</div>`;
  quiz = null;
  $('.back').onclick = () => setMode('quiz');
  $('#btnAgainQ').onclick = () => startQuiz(Q.scope);
  $('#btnOther').onclick = () => setMode('quiz');
}

Object.assign(window.__keys, { state: () => ({ mode, lesson, quiz }), startLesson, startQuiz, setMode });
setMode('ref');
setTimeout(() => os.open('notepad'), 300);
