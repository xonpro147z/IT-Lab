// Các ứng dụng trong hệ điều hành giả lập
import { h, esc, move } from './os.js';

const pad = (n) => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

// ---------- Hệ thống tệp dùng chung ----------
const F = (name, size, date = '12/10/2026') => ({ name, type: 'file', size, date });
const D = (name, kids) => ({ name, type: 'dir', date: '01/09/2026', kids });
export function getFS(os) {
  if (!os.fs) {
    os.fs = D('Máy tính này', [
      D('Tài liệu', [F('Bài tập Tin học.docx', '24 KB'), F('Báo cáo nhóm.docx', '58 KB'), F('Bảng điểm lớp 8A.xlsx', '17 KB'), F('Thuyết trình khoa học.pptx', '2,1 MB'), F('Ghi chú.txt', '1 KB')]),
      D('Hình ảnh', [F('Ảnh lớp 8A.jpg', '3,4 MB'), F('Phong cảnh Đà Lạt.png', '5,8 MB'), F('Sơ đồ máy tính.png', '420 KB')]),
      D('Nhạc', [F('Quốc ca.mp3', '2,6 MB'), F('Nhạc nền thuyết trình.mp3', '4,0 MB')]),
      D('Tải xuống', [F('TinHocLab-Setup.exe', '78 MB'), F('Đề cương ôn tập.pdf', '1,2 MB')]),
    ]);
    os.recycle = D('Thùng rác', []);
  }
  return os.fs;
}
const kind = (n) => n.type === 'dir' ? 'Thư mục' : ({ docx: 'Tài liệu Word', xlsx: 'Trang tính Excel', pptx: 'Bản trình bày PowerPoint', txt: 'Tệp văn bản', jpg: 'Ảnh JPG', png: 'Ảnh PNG', mp3: 'Tệp âm thanh', exe: 'Ứng dụng', pdf: 'Tài liệu PDF' }[n.name.split('.').pop()] || 'Tệp');
const fileIcon = (n) => n.type === 'dir' ? '📁' : ({ docx: '📘', xlsx: '📗', pptx: '📙', txt: '📄', jpg: '🖼️', png: '🖼️', mp3: '🎵', exe: '⚙️', pdf: '📕' }[n.name.split('.').pop()] || '📄');
function saveToFS(os, name) {
  const docs = getFS(os).kids[0];
  const ex = docs.kids.find((k) => k.name === name);
  if (ex) ex.date = today(); else docs.kids.push(F(name, '1 KB', today()));
  os.wins.filter((w) => w.app === 'explorer').forEach((w) => w.state.render?.());
}
function saveDialog(w, os, ext, base) {
  os.dialog(w, {
    title: 'Lưu thành', html: `<label class="row">Thư mục: <b>Tài liệu</b></label><label class="row">Tên tệp: <input class="fn" value="${esc(base)}"></label><label class="row">Kiểu: <span>${ext}</span></label>`,
    buttons: [{ t: 'Lưu', primary: true, act: (d) => { const n = d.querySelector('.fn').value.trim() || base; const full = n.endsWith(ext) ? n : n + ext; saveToFS(os, full); w.state.saved = full; os.setTitle(w, full + ' — ' + w.def.name); os.notify('Đã lưu', full + ' trong thư mục Tài liệu'); } }, { t: 'Huỷ', cancel: true }],
  });
}
function printDialog(w, os) {
  os.dialog(w, {
    title: 'In', html: `<div class="prt"><div class="pv"><i></i><i></i><i></i><i class="s"></i></div><div><label class="row">Máy in: <b>Máy in phòng Tin</b></label><label class="row">Số bản: <b>1</b></label><label class="row">Khổ giấy: <b>A4</b></label></div></div>`,
    buttons: [{ t: 'In', primary: true, act: () => os.notify('Đang in…', 'Đã gửi tới Máy in phòng Tin') }, { t: 'Huỷ', cancel: true }],
  });
}
function openDialog(w, os, ext, onPick) {
  const files = getFS(os).kids[0].kids.filter((f) => f.name.endsWith(ext));
  let i = 0;
  const d = os.dialog(w, {
    title: 'Mở', html: `<div class="olist">${files.map((f, j) => `<div data-i="${j}" class="${j === 0 ? 'on' : ''}">${fileIcon(f)} ${esc(f.name)}</div>`).join('') || '<p>Không có tệp ' + ext + ' trong Tài liệu.</p>'}</div>`,
    buttons: [{ t: 'Mở', primary: true, act: () => { if (files[i]) onPick(files[i]); } }, { t: 'Huỷ', cancel: true }],
  });
  d.querySelectorAll('.olist div').forEach((x) => { x.onclick = () => { d.querySelectorAll('.olist div').forEach((y) => y.classList.remove('on')); x.classList.add('on'); i = +x.dataset.i; }; x.ondblclick = () => { i = +x.dataset.i; onPick(files[i]); os.closeDialog(w); }; });
}
function findBar(w, os, host, onFind, withReplace) {
  host.querySelector('.findbar')?.remove();
  const b = h(`<div class="findbar"><input class="fq" placeholder="Tìm"><span class="fc"></span>${withReplace ? '<input class="fr" placeholder="Thay bằng"><button class="rp">Thay tất cả</button>' : ''}<button class="fx">✕</button></div>`);
  host.prepend(b);
  const q = b.querySelector('.fq');
  q.addEventListener('input', () => onFind(q.value, false, b));
  b.querySelector('.fx').onclick = () => { b.remove(); w.def.focus(w, os); };
  if (withReplace) b.querySelector('.rp').onclick = () => onFind(q.value, 'replace', b);
  setTimeout(() => q.focus(), 20);
  w.state.findbar = b;
}

// =====================================================================
const NOTE_TEXT = `Máy tính gồm hai phần: phần cứng và phần mềm.
Phần cứng là những bộ phận có thể nhìn thấy và chạm vào như CPU, RAM, ổ cứng, bàn phím.
Phần mềm là các chương trình giúp máy tính làm việc, ví dụ Word, Excel và trình duyệt web.

Luyện phím tắt mỗi ngày giúp em làm việc nhanh gấp đôi!`;

export const APPS = {
  // ---------------- Ghi chú ----------------
  notepad: {
    name: 'Ghi chú', kw: 'notepad text', w: 600, h: 360,
    init(w, os, o) {
      w.body.innerHTML = `<div class="np"><div class="mbar"><span>Tệp</span><span>Sửa</span><span>Xem</span></div><div class="nph"></div><textarea spellcheck="false"></textarea><div class="sbar"><span class="pos">Dòng 1, Cột 1</span><span>100%</span><span>UTF-8</span></div></div>`;
      const ta = w.state.ta = w.body.querySelector('textarea');
      ta.value = o.text ?? (o.blank ? '' : NOTE_TEXT);
      const upd = () => { const v = ta.value.slice(0, ta.selectionEnd); const ln = v.split('\n'); w.body.querySelector('.pos').textContent = `Dòng ${ln.length}, Cột ${ln[ln.length - 1].length + 1}` + (ta.selectionStart !== ta.selectionEnd ? ` · đã chọn ${ta.selectionEnd - ta.selectionStart} ký tự` : ''); };
      ['keyup', 'click', 'select', 'input', 'focus'].forEach((e) => ta.addEventListener(e, upd));
      document.addEventListener('selectionchange', () => { if (document.activeElement === ta) upd(); });
      w.title = (o.name || 'Không tên') + ' — Ghi chú';
    },
    focus(w) { if (!w.dialog && !w.state.findbar?.isConnected) setTimeout(() => w.state.ta.focus(), 0); },
    key(c, w, os) {
      const ta = w.state.ta;
      const find = (q, mode, bar) => {
        if (!q) return;
        if (mode === 'replace') { const r = bar.querySelector('.fr').value; const n = ta.value.split(q).length - 1; ta.focus(); ta.select(); document.execCommand('insertText', false, ta.value.split(q).join(r)); bar.querySelector('.fc').textContent = `Đã thay ${n} chỗ`; return; }
        const from = mode === 'next' ? ta.selectionEnd : 0; let i = ta.value.toLowerCase().indexOf(q.toLowerCase(), from); if (i < 0) i = ta.value.toLowerCase().indexOf(q.toLowerCase());
        bar.querySelector('.fc').textContent = i < 0 ? 'Không thấy' : `${ta.value.toLowerCase().split(q.toLowerCase()).length - 1} kết quả`;
        if (i >= 0) ta.setSelectionRange(i, i + q.length);
      };
      switch (c) {
        case 'Ctrl+Y': ta.focus(); document.execCommand('redo'); return true;
        case 'Ctrl+F': findBar(w, os, w.body.querySelector('.np'), find); return true;
        case 'Ctrl+H': findBar(w, os, w.body.querySelector('.np'), find, true); return true;
        case 'Enter': if (w.state.findbar?.isConnected) { find(w.state.findbar.querySelector('.fq').value, 'next', w.state.findbar); return true; } return false;
        case 'Esc': if (w.state.findbar?.isConnected) { w.state.findbar.remove(); ta.focus(); return true; } return false;
        case 'Ctrl+S': saveDialog(w, os, '.txt', w.state.saved?.replace(/\.txt$/, '') || 'Ghi chú mới'); return true;
        case 'Ctrl+P': printDialog(w, os); return true;
        case 'Ctrl+N': os.open('notepad', { blank: true }); return true;
        case 'Ctrl+O': openDialog(w, os, '.txt', (f) => { ta.value = 'Nội dung của tệp ' + f.name + '\n\nĐây là một ghi chú mẫu trong thư mục Tài liệu.'; w.state.saved = f.name; os.setTitle(w, f.name + ' — Ghi chú'); }); return true;
      }
      return false;
    },
    editKey(c, w, os, ctx, ed) {
      if (ed !== w.state.ta) return false;
      if (c === 'Enter' && w.state.findbar?.isConnected && document.activeElement !== w.state.ta) return false;
      return false;
    },
  },

  // ---------------- Word ----------------
  word: {
    name: 'Word', kw: 'winword văn bản', w: 720, h: 440,
    init(w, os) {
      w.body.innerHTML = `<div class="wd"><div class="rib"><span class="rt">Trang đầu</span><span class="fnt">Calibri</span><span class="fsz">11</span>
        <b data-c="bold">B</b><i data-c="italic">I</i><u data-c="underline">U</u><span data-c="subscript">x₂</span><span data-c="superscript">x²</span><span class="sep"></span>
        <span data-c="justifyLeft">⇤</span><span data-c="justifyCenter">≡</span><span data-c="justifyRight">⇥</span><span data-c="justifyFull">☰</span><span class="sep"></span><span data-c="insertUnorderedList">•≡</span></div>
        <div class="wpage"><div class="paper" contenteditable="true" spellcheck="false"><h2>Bài thực hành phím tắt</h2><p>Công thức hoá học của nước là H2O.</p><p>Diện tích hình vuông cạnh a là S = a2.</p><p>Phím tắt giúp em định dạng văn bản thật nhanh mà không cần dùng chuột. Hãy chọn một đoạn chữ rồi thử in đậm, in nghiêng, căn giữa và đổi cỡ chữ.</p><p>Trường THCS Kết Nối Tri Thức</p></div></div></div>`;
      const paper = w.state.paper = w.body.querySelector('.paper');
      const upd = () => {
        if (!paper.contains(getSelection().anchorNode)) return;
        w.body.querySelectorAll('.rib [data-c]').forEach((b) => { let on = false; try { on = document.queryCommandState(b.dataset.c); } catch {} b.classList.toggle('on', on); });
        const n = getSelection().anchorNode; const el = n?.nodeType === 3 ? n.parentElement : n;
        if (el) w.body.querySelector('.fsz').textContent = Math.round(parseFloat(getComputedStyle(el).fontSize) * 0.75);
      };
      w.state.upd = upd;
      document.addEventListener('selectionchange', upd);
      w.body.querySelectorAll('.rib [data-c]').forEach((b) => b.addEventListener('mousedown', (e) => { e.preventDefault(); document.execCommand(b.dataset.c); upd(); }));
      w.title = 'Tài liệu 1 — Word';
    },
    focus(w) { if (!w.dialog) setTimeout(() => { const p = w.state.paper; if (!p.contains(document.activeElement)) { p.focus(); if (!p.contains(getSelection().anchorNode)) { const r = document.createRange(); r.selectNodeContents(p); r.collapse(false); getSelection().removeAllRanges(); getSelection().addRange(r); } } }, 0); },
    editKey(c, w, os) { if (c === 'Ctrl+Z') { return false; } return false; },
    key(c, w, os) {
      const p = w.state.paper; if (!p.contains(getSelection().anchorNode)) { p.focus(); }
      const cmd = (x, v) => { document.execCommand(x, false, v); w.state.upd(); return true; };
      const block = () => { let n = getSelection().anchorNode; n = n?.nodeType === 3 ? n.parentElement : n; return n?.closest('p,h2,li,div.pb') || p.querySelector('p'); };
      const size = (d) => {
        const n = getSelection().anchorNode; const el = n?.nodeType === 3 ? n.parentElement : n;
        const pt = Math.max(1, Math.round(parseFloat(getComputedStyle(el || p).fontSize) * 0.75) + d);
        if (getSelection().isCollapsed) { const b = block(); if (b) b.style.fontSize = pt + 'pt'; }
        else { document.execCommand('fontSize', false, '7'); p.querySelectorAll('font[size="7"]').forEach((f) => { const s = document.createElement('span'); s.style.fontSize = pt + 'pt'; s.innerHTML = f.innerHTML; f.replaceWith(s); }); }
        w.state.upd(); return true;
      };
      switch (c) {
        case 'Ctrl+B': return cmd('bold');
        case 'Ctrl+I': return cmd('italic');
        case 'Ctrl+U': return cmd('underline');
        case 'Ctrl+E': return cmd('justifyCenter');
        case 'Ctrl+L': return cmd('justifyLeft');
        case 'Ctrl+R': return cmd('justifyRight');
        case 'Ctrl+J': return cmd('justifyFull');
        case 'Ctrl+]': return size(1);
        case 'Ctrl+[': return size(-1);
        case 'Ctrl+=': return cmd('subscript');
        case 'Ctrl+Shift+=': return cmd('superscript');
        case 'Ctrl+1': block().style.lineHeight = '1.15'; return true;
        case 'Ctrl+2': block().style.lineHeight = '2'; return true;
        case 'Ctrl+5': block().style.lineHeight = '1.5'; return true;
        case 'Ctrl+Shift+L': return cmd('insertUnorderedList');
        case 'Ctrl+Space': return cmd('removeFormat');
        case 'Ctrl+Enter': return cmd('insertHTML', '<div class="pb" contenteditable="false">Ngắt trang</div><p><br></p>');
        case 'Ctrl+Y': return cmd('redo');
        case 'Ctrl+K': {
          const r = getSelection().rangeCount ? getSelection().getRangeAt(0).cloneRange() : null; const t = String(getSelection());
          os.dialog(w, { title: 'Chèn liên kết', html: `<label class="row">Văn bản hiển thị: <b>${esc(t || '(chưa chọn chữ)')}</b></label><label class="row">Địa chỉ: <input class="u" value="https://"></label>`,
            buttons: [{ t: 'OK', primary: true, act: (d) => { p.focus(); if (r) { getSelection().removeAllRanges(); getSelection().addRange(r); } const u = d.querySelector('.u').value; if (t) document.execCommand('createLink', false, u); else document.execCommand('insertHTML', false, `<a href="#">${esc(u)}</a>`); } }, { t: 'Huỷ', cancel: true }] });
          return true;
        }
        case 'Ctrl+S': saveDialog(w, os, '.docx', 'Tài liệu 1'); return true;
        case 'Ctrl+P': printDialog(w, os); return true;
        case 'Ctrl+N': os.open('word'); return true;
        case 'Ctrl+O': openDialog(w, os, '.docx', (f) => os.setTitle(w, f.name + ' — Word')); return true;
      }
      return false;
    },
    destroy(w) { document.removeEventListener('selectionchange', w.state.upd); },
  },

  // ---------------- Excel ----------------
  excel: {
    name: 'Excel', kw: 'bảng tính spreadsheet', w: 740, h: 440,
    init(w, os) {
      const data = [['STT', 'Họ và tên', 'Toán', 'Văn', 'Anh', 'Tổng'], [1, 'Nguyễn An', 8, 7, 9], [2, 'Trần Bình', 6, 8, 7], [3, 'Lê Chi', 9, 9, 8], [4, 'Phạm Dũng', 7, 6, 8], [5, 'Hoàng Giang', 10, 8, 9], [6, 'Vũ Hà', 8, 9, 10], [7, 'Đỗ Khánh', 5, 7, 6]];
      const sheet = {}; data.forEach((row, r) => row.forEach((v, c) => { if (v !== undefined) sheet[ref(r, c)] = { v: String(v), b: r === 0 } }));
      w.state = { sheets: [sheet, {}, {}], si: 0, cur: { r: 1, c: 2 }, anc: { r: 1, c: 2 }, undo: [], edit: null };
      w.body.innerHTML = `<div class="xl"><div class="xrib"><span class="rt">Trang đầu</span><span class="xb">B</span><span class="xsum">Σ AutoSum</span><span class="xfmt">Định dạng</span></div>
        <div class="fbar"><span class="nb"></span><span class="fx">fx</span><span class="fv"></span></div><div class="xgrid"></div>
        <div class="xtabs"><span data-s="0">Sheet1</span><span data-s="1">Sheet2</span><span data-s="2">Sheet3</span><i>+</i></div></div>`;
      w.state.grid = w.body.querySelector('.xgrid');
      w.body.querySelectorAll('.xtabs span').forEach((t) => (t.onclick = () => { w.state.si = +t.dataset.s; render(w); }));
      w.state.grid.addEventListener('mousedown', (e) => {
        const td = e.target.closest('td[data-r]'); if (!td) return; e.preventDefault(); commit(w, false);
        const p = { r: +td.dataset.r, c: +td.dataset.c }; w.state.cur = p; if (!e.shiftKey) w.state.anc = { ...p }; render(w);
      });
      w.state.grid.addEventListener('dblclick', (e) => { const td = e.target.closest('td[data-r]'); if (td) startEdit(w, null); });
      w.title = 'Bảng điểm lớp 8A — Excel';
      render(w);
    },
    focus(w) { if (!w.state.edit && !w.dialog) setTimeout(() => document.activeElement?.blur?.(), 0); },
    editKey(c, w) {
      // khi đang sửa ô: Enter/Tab/Esc xử lý riêng
      if (!w.state.edit) return false;
      return false;
    },
    key(c, w, os, ctx) {
      const st = w.state; const sh = st.sheets[st.si];
      const P = c.split('+'); const k = P[P.length - 1]; const ctrl = P.includes('Ctrl'), shift = P.includes('Shift');
      if (st.edit) {
        if (c === 'Enter' || c === 'Tab' || c === 'Shift+Enter' || c === 'Shift+Tab') { commit(w, true); moveCur(w, c.includes('Tab') ? 0 : c.startsWith('Shift') ? -1 : 1, c.includes('Tab') ? (c.startsWith('Shift') ? -1 : 1) : 0, false); return true; }
        if (c === 'Esc') { st.edit.remove(); st.edit = null; render(w); return true; }
        if (c === 'Ctrl+;') { document.execCommand('insertText', false, today()); return true; }
        if (c === 'Ctrl+Shift+;') { document.execCommand('insertText', false, nowTime()); return true; }
        return false;
      }
      const dirs = { Up: [-1, 0], Down: [1, 0], Left: [0, -1], Right: [0, 1] };
      if (dirs[k] && !P.includes('Alt')) {
        const [dr, dc] = dirs[k];
        if (ctrl) { const p = jump(sh, st.cur, dr, dc); st.cur = p; if (!shift) st.anc = { ...p }; render(w); }
        else moveCur(w, dr, dc, shift);
        return true;
      }
      const charIn = (/^(Shift\+)?[A-Z0-9]$/.test(c) || /^(Shift\+)?[=\-.,;/]$/.test(c) || c === 'Space');
      if (charIn && !ctrl) { const ch = c === 'Space' ? ' ' : (shift ? ({ '=': '+', ';': ':', '/': '?', ',': '<', '.': '>', '-': '_' }[k] || k) : k.toLowerCase()); startEdit(w, ch); return true; }
      const snap = () => { st.undo.push(JSON.stringify(st.sheets)); if (st.undo.length > 40) st.undo.shift(); };
      const range = () => { const r0 = Math.min(st.anc.r, st.cur.r), r1 = Math.max(st.anc.r, st.cur.r), c0 = Math.min(st.anc.c, st.cur.c), c1 = Math.max(st.anc.c, st.cur.c); return { r0, r1, c0, c1 }; };
      switch (c) {
        case 'Enter': moveCur(w, 1, 0); return true;
        case 'Shift+Enter': moveCur(w, -1, 0); return true;
        case 'Tab': moveCur(w, 0, 1); return true;
        case 'Shift+Tab': moveCur(w, 0, -1); return true;
        case 'Home': st.cur = { r: st.cur.r, c: 0 }; st.anc = { ...st.cur }; render(w); return true;
        case 'Ctrl+Home': st.cur = { r: 0, c: 0 }; st.anc = { r: 0, c: 0 }; render(w); return true;
        case 'Ctrl+End': { let mr = 0, mc = 0; Object.keys(sh).forEach((a) => { if (sh[a].v !== '') { const p = parseRef(a); mr = Math.max(mr, p.r); mc = Math.max(mc, p.c); } }); st.cur = { r: mr, c: mc }; st.anc = { ...st.cur }; render(w); return true; }
        case 'PageDown': moveCur(w, 8, 0); return true;
        case 'PageUp': moveCur(w, -8, 0); return true;
        case 'F2': startEdit(w, null); return true;
        case 'Delete': case 'Backspace': { snap(); const R = range(); for (let r = R.r0; r <= R.r1; r++) for (let cc = R.c0; cc <= R.c1; cc++) delete sh[ref(r, cc)]; if (c === 'Backspace') startEdit(w, ''); else render(w); return true; }
        case 'Ctrl+;': snap(); sh[ref(st.cur.r, st.cur.c)] = { v: today() }; render(w); return true;
        case 'Ctrl+Shift+;': snap(); sh[ref(st.cur.r, st.cur.c)] = { v: nowTime() }; render(w); return true;
        case 'Alt+=': { snap(); const { r, c: cc } = st.cur; let r0 = r - 1; while (r0 >= 0 && isNum(sh, r0, cc)) r0--;
          let f;
          if (r0 < r - 1) f = `=SUM(${ref(r0 + 1, cc)}:${ref(r - 1, cc)})`;
          else { let c0 = cc - 1; while (c0 >= 0 && isNum(sh, r, c0)) c0--; if (c0 < cc - 1) f = `=SUM(${ref(r, c0 + 1)}:${ref(r, cc - 1)})`; }
          if (!f) { os.notify('AutoSum', 'Không thấy dãy số ở phía trên hoặc bên trái ô này.'); return true; }
          sh[ref(r, cc)] = { v: f }; render(w); return true; }
        case 'Ctrl+D': { snap(); const R = range(); if (R.r1 === R.r0) { if (R.r0 === 0) return true; R.r0--; } for (let cc = R.c0; cc <= R.c1; cc++) { const top = sh[ref(R.r0, cc)]; for (let r = R.r0 + 1; r <= R.r1; r++) { if (top) sh[ref(r, cc)] = { ...top, v: shiftRows(top.v, r - R.r0) }; else delete sh[ref(r, cc)]; } } render(w); return true; }
        case 'Ctrl+R': { snap(); const R = range(); if (R.c1 === R.c0) { if (R.c0 === 0) return true; R.c0--; } for (let r = R.r0; r <= R.r1; r++) { const l = sh[ref(r, R.c0)]; for (let cc = R.c0 + 1; cc <= R.c1; cc++) { if (l) sh[ref(r, cc)] = { ...l }; } } render(w); return true; }
        case 'Ctrl+Space': st.anc = { r: 0, c: st.cur.c }; st.cur = { r: ROWS - 1, c: st.cur.c }; render(w); return true;
        case 'Shift+Space': st.anc = { r: st.cur.r, c: 0 }; st.cur = { r: st.cur.r, c: COLS - 1 }; render(w); return true;
        case 'Ctrl+A': st.anc = { r: 0, c: 0 }; st.cur = { r: ROWS - 1, c: COLS - 1 }; render(w); return true;
        case 'Ctrl+B': { snap(); const R = range(); const cur = sh[ref(st.cur.r, st.cur.c)]; const on = !(cur && cur.b); for (let r = R.r0; r <= R.r1; r++) for (let cc = R.c0; cc <= R.c1; cc++) { const a = ref(r, cc); sh[a] = { ...(sh[a] || { v: '' }), b: on }; } render(w); return true; }
        case 'Ctrl+1': os.dialog(w, { title: 'Định dạng ô', html: `<div class="tabs"><b>Số</b><span>Căn lề</span><span>Phông chữ</span><span>Viền</span><span>Tô màu</span><span>Bảo vệ</span></div><div class="olist">${['Chung', 'Số', 'Tiền tệ', 'Ngày', 'Giờ', 'Phần trăm', 'Văn bản'].map((x, i) => `<div class="${i ? '' : 'on'}">${x}</div>`).join('')}</div>`, buttons: [{ t: 'OK', primary: true }, { t: 'Huỷ', cancel: true }] }); return true;
        case 'Ctrl+PageDown': st.si = (st.si + 1) % 3; render(w); return true;
        case 'Ctrl+PageUp': st.si = (st.si + 2) % 3; render(w); return true;
        case 'Ctrl+Z': if (st.undo.length) { st.sheets = JSON.parse(st.undo.pop()); render(w); } return true;
        case 'Ctrl+C': case 'Ctrl+X': { const R = range(); st.copy = { R, cut: c === 'Ctrl+X', si: st.si, cells: {} }; for (let r = R.r0; r <= R.r1; r++) for (let cc = R.c0; cc <= R.c1; cc++) st.copy.cells[(r - R.r0) + ',' + (cc - R.c0)] = sh[ref(r, cc)]; os.addClip(`[Vùng ô ${ref(R.r0, R.c0)}:${ref(R.r1, R.c1)}]`); render(w); return true; }
        case 'Ctrl+V': { if (!st.copy) return true; snap(); const cp = st.copy; Object.entries(cp.cells).forEach(([k2, v]) => { const [dr, dc] = k2.split(',').map(Number); const a = ref(st.cur.r + dr, st.cur.c + dc); if (v) sh[a] = { ...v, v: shiftRows(v.v, st.cur.r - cp.R.r0) }; else delete sh[a]; });
          if (cp.cut) { const src = st.sheets[cp.si]; for (let r = cp.R.r0; r <= cp.R.r1; r++) for (let cc = cp.R.c0; cc <= cp.R.c1; cc++) { const rr = r - cp.R.r0 + st.cur.r, ccc = cc - cp.R.c0 + st.cur.c; if (rr !== r || ccc !== cc) delete src[ref(r, cc)]; } st.copy = null; }
          render(w); return true; }
        case 'Esc': if (st.copy) { st.copy = null; render(w); } return true;
        case 'Ctrl+S': saveDialog(w, os, '.xlsx', 'Bảng điểm lớp 8A'); return true;
        case 'Ctrl+P': printDialog(w, os); return true;
        case 'Ctrl+N': os.open('excel'); return true;
      }
      return false;
    },
  },

  // ---------------- PowerPoint ----------------
  ppt: {
    name: 'PowerPoint', kw: 'powerpnt trình chiếu slide', w: 740, h: 440,
    init(w, os) {
      w.state = { cur: 0, slides: [
        { t: 'Phím tắt máy tính', s: 'Bài thuyết trình nhóm 3 · Lớp 8A', bg: 'linear-gradient(135deg,#0a84ff,#5e5ce6)' },
        { t: 'Vì sao nên dùng phím tắt?', s: '• Nhanh hơn dùng chuột\n• Ít mỏi tay\n• Chuyên nghiệp hơn', bg: '#fff' },
        { t: 'Ctrl + C và Ctrl + V', s: 'Sao chép và dán — hai phím tắt dùng nhiều nhất', bg: '#fff' },
        { t: 'Cảm ơn thầy cô và các bạn!', s: 'Hỏi & đáp', bg: 'linear-gradient(135deg,#ff9f0a,#ff375f)' },
      ] };
      w.body.innerHTML = `<div class="pp"><div class="prib"><span class="rt">Trang đầu</span><span class="pnew">＋ Slide mới</span><span class="pshow">▶ Trình chiếu</span></div><div class="pmain"><div class="pthumbs"></div><div class="pstage"><div class="pslide"></div><div class="pnote">Bấm để thêm ghi chú</div></div></div></div>`;
      w.body.querySelector('.pnew').onclick = () => APPS.ppt.key('Ctrl+M', w, os);
      w.body.querySelector('.pshow').onclick = () => APPS.ppt.key('F5', w, os);
      w.title = 'Thuyết trình khoa học — PowerPoint';
      pRender(w);
    },
    focus() { setTimeout(() => document.activeElement?.blur?.(), 0); },
    key(c, w, os) {
      const st = w.state;
      switch (c) {
        case 'Ctrl+M': st.slides.splice(st.cur + 1, 0, { t: 'Bấm để thêm tiêu đề', s: 'Bấm để thêm nội dung', bg: '#fff', fresh: true }); st.cur++; pRender(w); return true;
        case 'Ctrl+D': st.slides.splice(st.cur + 1, 0, { ...st.slides[st.cur] }); st.cur++; pRender(w); return true;
        case 'Delete': case 'Backspace': if (st.slides.length > 1) { st.slides.splice(st.cur, 1); st.cur = Math.min(st.cur, st.slides.length - 1); pRender(w); } return true;
        case 'Up': case 'Left': case 'PageUp': st.cur = Math.max(0, st.cur - 1); pRender(w); return true;
        case 'Down': case 'Right': case 'PageDown': st.cur = Math.min(st.slides.length - 1, st.cur + 1); pRender(w); return true;
        case 'Home': st.cur = 0; pRender(w); return true;
        case 'End': st.cur = st.slides.length - 1; pRender(w); return true;
        case 'F5': slideShow(w, os, 0); return true;
        case 'Shift+F5': slideShow(w, os, st.cur); return true;
        case 'Ctrl+S': saveDialog(w, os, '.pptx', 'Thuyết trình khoa học'); return true;
        case 'Ctrl+P': printDialog(w, os); return true;
        case 'Ctrl+N': os.open('ppt'); return true;
      }
      return false;
    },
  },

  // ---------------- File Explorer ----------------
  explorer: {
    name: 'File Explorer', kw: 'tệp thư mục explorer', w: 700, h: 420,
    init(w, os, o) {
      const root = getFS(os);
      const st = w.state = { path: [root], back: [], fwd: [], sel: new Set(), focus: 0, undo: [] };
      if (o.path === 'recycle') st.path = [os.recycle];
      else st.path = [root, root.kids[0]];
      w.body.innerHTML = `<div class="ex"><div class="exbar"><button data-a="back">←</button><button data-a="fwd">→</button><button data-a="up">↑</button><div class="addr"></div><input class="exs" placeholder="Tìm kiếm"></div>
        <div class="excmd"><span data-a="new">＋ Mới</span><span data-a="cut">✂ Cắt</span><span data-a="copy">⧉ Sao chép</span><span data-a="paste">📋 Dán</span><span data-a="ren">✎ Đổi tên</span><span data-a="del">🗑 Xoá</span></div>
        <div class="exmain"><div class="nav"></div><div class="list"></div></div><div class="sbar exst"></div></div>`;
      st.render = () => exRender(w, os);
      w.body.querySelectorAll('.exbar button, .excmd span').forEach((b) => (b.onclick = () => {
        const m = { back: 'Alt+Left', fwd: 'Alt+Right', up: 'Alt+Up', new: 'Ctrl+Shift+N', cut: 'Ctrl+X', copy: 'Ctrl+C', paste: 'Ctrl+V', ren: 'F2', del: 'Delete' }[b.dataset.a];
        APPS.explorer.key(m, w, os);
      }));
      w.body.querySelector('.exs').addEventListener('input', () => exRender(w, os));
      exRender(w, os);
    },
    focus(w) { if (!w.dialog && !w.state.renaming) setTimeout(() => document.activeElement?.blur?.(), 0); },
    editKey(c, w, os, ctx, ed) {
      if (!w.state.renaming || ed !== w.state.renaming.input) return false;
      return false;
    },
    key(c, w, os) {
      const st = w.state; const dir = st.path[st.path.length - 1]; const items = exItems(w);
      const go = (node, push = true) => { if (push) { st.back.push(st.path.slice()); st.fwd = []; } st.path = node; st.sel.clear(); st.focus = 0; exRender(w, os); };
      const selected = () => items.filter((n) => st.sel.has(n));
      if (st.renaming) {
        if (c === 'Enter') { const { node, input, old } = st.renaming; const v = input.value.trim(); if (v && v !== old) { node.name = v; st.undo.push({ t: 'rename', node, old }); } st.renaming = null; exRender(w, os); return true; }
        if (c === 'Esc') { st.renaming = null; exRender(w, os); return true; }
        return false;
      }
      const P = c.split('+');
      switch (c) {
        case 'Down': case 'Up': case 'Shift+Down': case 'Shift+Up': case 'Home': case 'End': {
          if (!items.length) return true;
          const n = c === 'Home' ? 0 : c === 'End' ? items.length - 1 : Math.max(0, Math.min(items.length - 1, st.focus + (c.includes('Down') ? 1 : -1)));
          if (!P.includes('Shift')) st.sel.clear(); st.focus = n; st.sel.add(items[n]); exRender(w, os); return true;
        }
        case 'Enter': { const n = selected()[0] || (st.sel.size ? null : null); if (!n) return true; if (n.type === 'dir') go([...st.path, n]); else openFile(os, n); return true; }
        case 'Backspace': case 'Alt+Left': if (st.back.length) { st.fwd.push(st.path); st.path = st.back.pop(); st.sel.clear(); exRender(w, os); } return true;
        case 'Alt+Right': if (st.fwd.length) { st.back.push(st.path); st.path = st.fwd.pop(); st.sel.clear(); exRender(w, os); } return true;
        case 'Alt+Up': if (st.path.length > 1) go(st.path.slice(0, -1)); return true;
        case 'Ctrl+A': items.forEach((n) => st.sel.add(n)); exRender(w, os); return true;
        case 'F2': { const n = selected()[0]; if (n) { st.renaming = { node: n, old: n.name }; exRender(w, os); } return true; }
        case 'Ctrl+Shift+N': { let nm = 'Thư mục mới', i = 2; while (dir.kids.some((k) => k.name === nm)) nm = `Thư mục mới (${i++})`; const n = D(nm, []); n.date = today(); dir.kids.push(n); st.undo.push({ t: 'new', dir, node: n }); st.sel = new Set([n]); st.renaming = { node: n, old: n.name }; exRender(w, os); return true; }
        case 'Delete': case 'Shift+Delete': {
          const sel = selected(); if (!sel.length) return true;
          if (dir === os.recycle || c === 'Shift+Delete') {
            os.dialog(w, { title: 'Xoá vĩnh viễn', html: `<p>Bạn có chắc muốn <b>xoá vĩnh viễn</b> ${sel.length > 1 ? sel.length + ' mục' : '"' + esc(sel[0].name) + '"'}? Không thể lấy lại từ Thùng rác.</p>`,
              buttons: [{ t: 'Có', primary: true, act: () => { dir.kids = dir.kids.filter((k) => !sel.includes(k)); st.sel.clear(); exRender(w, os); } }, { t: 'Không', cancel: true }] });
            return true;
          }
          dir.kids = dir.kids.filter((k) => !sel.includes(k)); sel.forEach((n) => { n.from = dir; os.recycle.kids.push(n); });
          st.undo.push({ t: 'del', dir, nodes: sel }); st.sel.clear(); exRender(w, os); return true;
        }
        case 'Ctrl+Z': { const u = st.undo.pop(); if (!u) return true;
          if (u.t === 'del') { u.nodes.forEach((n) => { os.recycle.kids = os.recycle.kids.filter((k) => k !== n); u.dir.kids.push(n); }); st.sel = new Set(u.nodes); }
          if (u.t === 'rename') u.node.name = u.old;
          if (u.t === 'new' || u.t === 'paste') u.dir.kids = u.dir.kids.filter((k) => !(u.nodes || [u.node]).includes(k));
          exRender(w, os); return true; }
        case 'Ctrl+C': case 'Ctrl+X': { const sel = selected(); if (!sel.length) return true; os.fileClip = { nodes: sel, from: dir, cut: c === 'Ctrl+X' }; exRender(w, os); return true; }
        case 'Ctrl+V': { const fc = os.fileClip; if (!fc) return true; const added = [];
          fc.nodes.forEach((n) => { let nm = n.name; if (dir.kids.some((k) => k.name === nm)) { const dot = nm.lastIndexOf('.'); nm = dot > 0 && n.type === 'file' ? nm.slice(0, dot) + ' - Bản sao' + nm.slice(dot) : nm + ' - Bản sao'; }
            const copy = JSON.parse(JSON.stringify({ ...n, from: undefined })); copy.name = nm; copy.date = today(); dir.kids.push(copy); added.push(copy); });
          if (fc.cut && fc.from !== dir) { fc.from.kids = fc.from.kids.filter((k) => !fc.nodes.includes(k)); os.fileClip = null; }
          st.undo.push({ t: 'paste', dir, nodes: added }); st.sel = new Set(added); exRender(w, os); return true; }
        case 'Alt+Enter': { const n = selected()[0] || dir; os.dialog(w, { title: 'Thuộc tính: ' + n.name, html: `<table class="props"><tr><td>Loại</td><td>${kind(n)}</td></tr><tr><td>Vị trí</td><td>${esc(st.path.map((p) => p.name).join(' › '))}</td></tr><tr><td>Kích thước</td><td>${n.size || (n.kids ? n.kids.length + ' mục' : '')}</td></tr><tr><td>Ngày tạo</td><td>${n.date}</td></tr><tr><td>Thuộc tính</td><td>☐ Chỉ đọc &nbsp; ☐ Ẩn</td></tr></table>`, buttons: [{ t: 'OK', primary: true }, { t: 'Huỷ', cancel: true }] }); return true; }
        case 'F5': { const l = w.body.querySelector('.list'); l.classList.add('refresh'); setTimeout(() => l.classList.remove('refresh'), 400); exRender(w, os); return true; }
        case 'Ctrl+F': case 'Ctrl+E': w.body.querySelector('.exs').focus(); return true;
        case 'Ctrl+N': os.open('explorer'); return true;
      }
      return false;
    },
  },

  // ---------------- Trình duyệt ----------------
  browser: {
    name: 'Trình duyệt', kw: 'chrome edge web internet', w: 760, h: 450,
    init(w, os, o) {
      const st = w.state = { tabs: [], cur: 0, closed: [], marks: new Set(), hist: [], inc: !!o.incognito };
      w.el.classList.toggle('incog', st.inc);
      w.body.innerHTML = `<div class="br"><div class="btabs"></div><div class="btool"><button data-a="back">←</button><button data-a="fwd">→</button><button data-a="reload">⟳</button><input class="url" spellcheck="false"><button class="star" data-a="star">☆</button><button>⋮</button></div>
        <div class="bmarks"></div><div class="bview"><div class="bpage"></div></div><div class="bzoom"></div></div>`;
      w.body.querySelectorAll('.btool button[data-a]').forEach((b) => (b.onclick = () => APPS.browser.key({ back: 'Alt+Left', fwd: 'Alt+Right', reload: 'F5', star: 'Ctrl+D' }[b.dataset.a], w, os)));
      w.body.querySelector('.bview').addEventListener('click', (e) => { const a = e.target.closest('[data-href]'); if (a) { e.preventDefault(); nav(w, a.dataset.href); } });
      newTab(w, o.url || 'https://tinhoc.vn');
      w.title = st.inc ? 'Cửa sổ ẩn danh' : 'Trình duyệt';
    },
    focus(w) { if (!w.dialog && document.activeElement?.closest?.('.win') !== w.el) setTimeout(() => document.activeElement?.blur?.(), 0); },
    key(c, w, os) {
      const st = w.state; const t = st.tabs[st.cur]; const url = w.body.querySelector('.url');
      if (document.activeElement === url && c === 'Enter') { let v = url.value.trim(); if (!/^(https?|tinhoc):/.test(v)) v = /\.\w{2,}/.test(v) && !v.includes(' ') ? 'https://' + v : 'https://timkiem.tinhoc.vn/?q=' + encodeURIComponent(v); nav(w, v); url.blur(); return true; }
      const nt = document.activeElement?.matches?.('[data-nt]') ? document.activeElement : null;
      if (nt && c === 'Enter') { const v = nt.value.trim(); if (v) nav(w, /\.\w{2,}/.test(v) && !v.includes(' ') ? 'https://' + v : 'https://timkiem.tinhoc.vn/?q=' + encodeURIComponent(v)); return true; }
      if (document.activeElement === url && c === 'Esc') { url.value = t.hist[t.hi]; url.blur(); return true; }
      const n = /^Ctrl\+([1-8])$/.exec(c);
      if (n) { st.cur = Math.min(st.tabs.length - 1, +n[1] - 1); bRender(w); return true; }
      switch (c) {
        case 'Ctrl+T': newTab(w, 'tinhoc://newtab'); setTimeout(() => { url.focus(); url.select(); }, 30); return true;
        case 'Ctrl+W': case 'Ctrl+F4': st.closed.push(st.tabs.splice(st.cur, 1)[0]); if (!st.tabs.length) { os.close(w); return true; } st.cur = Math.min(st.cur, st.tabs.length - 1); bRender(w); return true;
        case 'Ctrl+Shift+T': { const r = st.closed.pop(); if (r) { st.tabs.push(r); st.cur = st.tabs.length - 1; bRender(w); } return true; }
        case 'Ctrl+Tab': case 'Ctrl+PageDown': st.cur = (st.cur + 1) % st.tabs.length; bRender(w); return true;
        case 'Ctrl+Shift+Tab': case 'Ctrl+PageUp': st.cur = (st.cur - 1 + st.tabs.length) % st.tabs.length; bRender(w); return true;
        case 'Ctrl+9': st.cur = st.tabs.length - 1; bRender(w); return true;
        case 'Ctrl+L': case 'Alt+D': case 'F6': url.focus(); url.select(); return true;
        case 'F5': case 'Ctrl+R': { const p = w.body.querySelector('.bpage'); p.classList.add('loading'); w.body.querySelector('.btool [data-a=reload]').classList.add('spin'); setTimeout(() => { p.classList.remove('loading'); w.body.querySelector('.btool [data-a=reload]').classList.remove('spin'); }, 600); return true; }
        case 'Alt+Left': if (t.hi > 0) { t.hi--; bRender(w); } return true;
        case 'Alt+Right': if (t.hi < t.hist.length - 1) { t.hi++; bRender(w); } return true;
        case 'Ctrl+D': { const u = t.hist[t.hi]; if (st.marks.has(u)) { st.marks.delete(u); os.notify('Đã xoá dấu trang', pageOf(u).title); } else { st.marks.add(u); os.notify('Đã thêm dấu trang ★', pageOf(u).title); } bRender(w); return true; }
        case 'Ctrl+F': bFind(w, os); return true;
        case 'Enter': if (w.state.fb?.isConnected) { bFindNext(w); return true; } return false;
        case 'Esc': if (w.state.fb?.isConnected) { w.state.fb.remove(); clearMarks(w); return true; } if (w.full) { w.full = false; os.layout(w); return true; } return false;
        case 'Ctrl+=': case 'Ctrl+Shift+=': zoom(w, 1); return true;
        case 'Ctrl+-': zoom(w, -1); return true;
        case 'Ctrl+0': zoom(w, 0); return true;
        case 'Ctrl+H': newTab(w, 'tinhoc://history'); return true;
        case 'Ctrl+J': newTab(w, 'tinhoc://downloads'); return true;
        case 'Ctrl+N': os.open('browser'); return true;
        case 'Ctrl+Shift+N': os.open('browser', { incognito: true }); return true;
        case 'F11': w.full = !w.full; os.layout(w); if (w.full) os.notify('Toàn màn hình', 'Bấm F11 hoặc Esc để thoát'); return true;
        case 'Ctrl+P': printDialog(w, os); return true;
        case 'Ctrl+S': saveDialog(w, os, '.html', pageOf(t.hist[t.hi]).title); return true;
        case 'Space': case 'PageDown': w.body.querySelector('.bview').scrollBy({ top: 220, behavior: 'smooth' }); return true;
        case 'Shift+Space': case 'PageUp': w.body.querySelector('.bview').scrollBy({ top: -220, behavior: 'smooth' }); return true;
        case 'Home': w.body.querySelector('.bview').scrollTo({ top: 0, behavior: 'smooth' }); return true;
        case 'End': w.body.querySelector('.bview').scrollTo({ top: 1e5, behavior: 'smooth' }); return true;
        case 'Down': w.body.querySelector('.bview').scrollBy({ top: 40 }); return true;
        case 'Up': w.body.querySelector('.bview').scrollBy({ top: -40 }); return true;
      }
      return false;
    },
  },

  // ---------------- Ứng dụng hệ thống ----------------
  taskmgr: {
    name: 'Task Manager', kw: 'quản lý tác vụ', w: 520, h: 360,
    init(w, os) {
      w.state = { sel: 0 };
      w.body.innerHTML = `<div class="tm"><div class="tmh"><b>Tiến trình</b><span>Hiệu suất</span><span>Khởi động</span></div><table><thead><tr><th>Tên</th><th>CPU</th><th>Bộ nhớ</th></tr></thead><tbody></tbody></table><div class="tmf"><button class="end">Kết thúc tác vụ</button></div></div>`;
      w.state.draw = () => {
        const rows = os.wins.filter((x) => x !== w);
        w.state.rows = rows; w.state.sel = Math.min(w.state.sel, Math.max(0, rows.length - 1));
        const bg = [['Windows Explorer', '0,4%', '62 MB'], ['Bộ gõ tiếng Việt', '0%', '8 MB'], ['Diệt virus', '1,2%', '140 MB']];
        w.body.querySelector('tbody').innerHTML = rows.map((x, i) => `<tr class="${i === w.state.sel ? 'on' : ''}" data-i="${i}"><td>${esc(x.title)}</td><td>${(Math.random() * 6).toFixed(1).replace('.', ',')}%</td><td>${80 + ((i * 53) % 300)} MB</td></tr>`).join('') + `<tr class="sub"><td colspan="3">Tiến trình nền</td></tr>` + bg.map((b) => `<tr class="bg"><td>${b[0]}</td><td>${b[1]}</td><td>${b[2]}</td></tr>`).join('');
        w.body.querySelectorAll('tbody tr[data-i]').forEach((r) => (r.onclick = () => { w.state.sel = +r.dataset.i; w.state.draw(); }));
      };
      w.body.querySelector('.end').onclick = () => APPS.taskmgr.key('Delete', w, os);
      os.taskmgrDraw = () => w.state.draw();
      const prev = os.onChange; w.state.prev = prev; os.onChange = () => { prev(); if (w.el.isConnected) w.state.draw(); };
      w.state.draw();
    },
    destroy(w, os) { os.onChange = w.state.prev; },
    key(c, w, os) {
      const st = w.state;
      if (c === 'Down' || c === 'Up') { st.sel = Math.max(0, Math.min(st.rows.length - 1, st.sel + (c === 'Down' ? 1 : -1))); st.draw(); return true; }
      if (c === 'Delete' || c === 'Alt+E') { const t = st.rows[st.sel]; if (t) { os.close(t, true); os.focus(w); os.notify('Task Manager', 'Đã kết thúc: ' + t.title); } return true; }
      return false;
    },
  },
  settings: {
    name: 'Cài đặt', kw: 'settings control', w: 600, h: 380,
    init(w) {
      w.body.innerHTML = `<div class="set"><div class="snav">${['Hệ thống', 'Bluetooth & thiết bị', 'Mạng & Internet', 'Cá nhân hoá', 'Ứng dụng', 'Tài khoản', 'Thời gian & ngôn ngữ', 'Hỗ trợ tiếp cận', 'Cập nhật'].map((x, i) => `<div class="${i ? '' : 'on'}">${x}</div>`).join('')}</div>
        <div class="smain"><h3>Hệ thống</h3>${[['Màn hình', 'Độ sáng, độ phân giải 1920 × 1080'], ['Âm thanh', 'Âm lượng, thiết bị phát'], ['Thông báo', 'Thông báo từ ứng dụng và hệ thống'], ['Nguồn & pin', 'Chế độ ngủ, tiết kiệm pin'], ['Lưu trữ', 'Còn trống 214 GB / 476 GB'], ['Thông tin máy', 'TinHoc OS · CPU 8 nhân · RAM 16 GB']].map(([a, b]) => `<div class="srow"><b>${a}</b><span>${b}</span><i>›</i></div>`).join('')}</div></div>`;
      w.body.querySelectorAll('.snav div').forEach((d) => (d.onclick = () => { w.body.querySelectorAll('.snav div').forEach((x) => x.classList.remove('on')); d.classList.add('on'); w.body.querySelector('.smain h3').textContent = d.textContent; }));
    },
  },
  run: {
    name: 'Run', kw: 'chạy lệnh', w: 400, h: 190,
    init(w) {
      w.el.classList.add('small');
      w.body.innerHTML = `<div class="runb"><p>Nhập tên chương trình, thư mục hoặc trang web, máy tính sẽ mở nó cho bạn.</p><label>Mở: <input class="rin" value="notepad" spellcheck="false"></label><div class="rbt"><button class="pri">OK</button><button class="cc">Huỷ</button></div></div>`;
      w.state.inp = w.body.querySelector('.rin');
    },
    focus(w) { setTimeout(() => { w.state.inp.focus(); w.state.inp.select(); }, 0); },
    key(c, w, os) {
      if (c === 'Esc') { os.close(w); return true; }
      if (c !== 'Enter') return false;
      const v = w.state.inp.value.trim().toLowerCase();
      const m = { notepad: 'notepad', winword: 'word', excel: 'excel', powerpnt: 'ppt', explorer: 'explorer', chrome: 'browser', msedge: 'browser', firefox: 'browser', taskmgr: 'taskmgr', control: 'settings', 'ms-settings:': 'settings' }[v];
      if (m) { os.close(w, true); os.open(m); } else os.dialog(w, { title: v, html: `<p>Không tìm thấy "<b>${esc(v)}</b>". Hãy thử: notepad, winword, excel, powerpnt, explorer, chrome, taskmgr.</p>`, buttons: [{ t: 'OK', primary: true }] });
      return true;
    },
  },
};
APPS.run.w = 400; APPS.run.h = 190;
for (const b of [APPS.run]) { const i = b.init; b.init = (w, os, o) => { i(w, os, o); w.body.querySelector('.pri').onclick = () => b.key('Enter', w, os); w.body.querySelector('.cc').onclick = () => os.close(w); }; }

// ===================== Excel: hàm phụ =====================
const COLS = 8, ROWS = 16, L = 'ABCDEFGH';
const ref = (r, c) => L[c] + (r + 1);
const parseRef = (a) => ({ c: L.indexOf(a[0]), r: +a.slice(1) - 1 });
function cellVal(sh, a, depth = 0) {
  const x = sh[a]; if (!x || x.v === '') return '';
  if (String(x.v).startsWith('=')) return evalF(sh, x.v.slice(1), depth + 1);
  return x.v;
}
const isNum = (sh, r, c) => { const v = cellVal(sh, ref(r, c)); return v !== '' && !isNaN(+v); };
function rangeVals(sh, a, b, depth) { const p = parseRef(a), q = parseRef(b); const out = []; for (let r = Math.min(p.r, q.r); r <= Math.max(p.r, q.r); r++) for (let c = Math.min(p.c, q.c); c <= Math.max(p.c, q.c); c++) { const v = cellVal(sh, ref(r, c), depth); if (v !== '' && !isNaN(+v)) out.push(+v); } return out; }
function evalF(sh, f, depth) {
  if (depth > 20) return '#REF!';
  try {
    let s = f.toUpperCase().replace(/(SUM|AVERAGE|MAX|MIN|COUNT)\(([A-H]\d+):([A-H]\d+)\)/g, (_, fn, a, b) => { const v = rangeVals(sh, a, b, depth); return String({ SUM: v.reduce((x, y) => x + y, 0), AVERAGE: v.length ? v.reduce((x, y) => x + y, 0) / v.length : 0, MAX: v.length ? Math.max(...v) : 0, MIN: v.length ? Math.min(...v) : 0, COUNT: v.length }[fn]); });
    s = s.replace(/[A-H]\d+/g, (a) => { const v = cellVal(sh, a, depth); return v === '' ? '0' : isNaN(+v) ? 'NaN' : String(+v); });
    const r = arith(s); return isNaN(r) ? '#VALUE!' : String(Math.round(r * 1e9) / 1e9).replace('.', ',');
  } catch { return '#NAME?'; }
}
function arith(s) {
  let i = 0; const t = s.replace(/\s+/g, '');
  const num = () => { if (t[i] === '(') { i++; const v = expr(); i++; return v; } if (t[i] === '-') { i++; return -num(); } const m = /^\d+(\.\d+)?/.exec(t.slice(i)); if (!m) throw 0; i += m[0].length; return +m[0]; };
  const term = () => { let v = num(); while (t[i] === '*' || t[i] === '/') { const o = t[i++]; const b = num(); v = o === '*' ? v * b : v / b; } return v; };
  const expr = () => { let v = term(); while (t[i] === '+' || t[i] === '-') { const o = t[i++]; const b = term(); v = o === '+' ? v + b : v - b; } return v; };
  const v = expr(); if (i < t.length) throw 0; return v;
}
const shiftRows = (v, d) => String(v).startsWith('=') ? v.replace(/([A-H])(\d+)/g, (_, c, r) => c + (+r + d)) : v;
function jump(sh, p, dr, dc) {
  const ok = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS; const has = (r, c) => sh[ref(r, c)] && sh[ref(r, c)].v !== '';
  let r = p.r, c = p.c;
  if (!ok(r + dr, c + dc)) return { r, c };
  if (has(r, c) && has(r + dr, c + dc)) { while (ok(r + dr, c + dc) && has(r + dr, c + dc)) { r += dr; c += dc; } return { r, c }; }
  r += dr; c += dc; while (ok(r, c) && !has(r, c)) { if (!ok(r + dr, c + dc)) return { r, c }; r += dr; c += dc; }
  return { r, c };
}
function moveCur(w, dr, dc, extend) { const st = w.state; st.cur = { r: Math.max(0, Math.min(ROWS - 1, st.cur.r + dr)), c: Math.max(0, Math.min(COLS - 1, st.cur.c + dc)) }; if (!extend) st.anc = { ...st.cur }; render(w); }
function startEdit(w, ch) {
  const st = w.state; const sh = st.sheets[st.si]; const a = ref(st.cur.r, st.cur.c);
  const td = st.grid.querySelector(`td[data-r="${st.cur.r}"][data-c="${st.cur.c}"]`);
  const inp = document.createElement('input'); inp.className = 'xedit'; inp.spellcheck = false;
  inp.value = ch === null ? (sh[a]?.v ?? '') : ch;
  td.textContent = ''; td.appendChild(inp); st.edit = inp; inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
  inp.addEventListener('input', () => (w.body.querySelector('.fv').textContent = inp.value));
  w.body.querySelector('.fv').textContent = inp.value;
}
function commit(w) {
  const st = w.state; if (!st.edit) return; const sh = st.sheets[st.si];
  st.undo.push(JSON.stringify(st.sheets));
  const v = st.edit.value; const a = ref(st.cur.r, st.cur.c);
  if (v === '') delete sh[a]; else sh[a] = { ...(sh[a] || {}), v };
  st.edit.remove(); st.edit = null; render(w);
}
function render(w) {
  const st = w.state; const sh = st.sheets[st.si];
  const r0 = Math.min(st.anc.r, st.cur.r), r1 = Math.max(st.anc.r, st.cur.r), c0 = Math.min(st.anc.c, st.cur.c), c1 = Math.max(st.anc.c, st.cur.c);
  const cp = st.copy && st.copy.si === st.si ? st.copy.R : null;
  let html = '<table><thead><tr><th class="corner"></th>' + [...L].map((x, c) => `<th class="${c >= c0 && c <= c1 ? 'hl' : ''}">${x}</th>`).join('') + '</tr></thead><tbody>';
  for (let r = 0; r < ROWS; r++) {
    html += `<tr><th class="${r >= r0 && r <= r1 ? 'hl' : ''}">${r + 1}</th>`;
    for (let c = 0; c < COLS; c++) {
      const a = ref(r, c); const x = sh[a]; const v = x ? cellVal(sh, a) : '';
      const cls = [r === st.cur.r && c === st.cur.c ? 'cur' : '', r >= r0 && r <= r1 && c >= c0 && c <= c1 && (r1 > r0 || c1 > c0) ? 'sel' : '', x?.b ? 'b' : '', v !== '' && !isNaN(+String(v).replace(',', '.')) ? 'n' : '', cp && r >= cp.r0 && r <= cp.r1 && c >= cp.c0 && c <= cp.c1 ? 'ants' : ''].join(' ');
      html += `<td data-r="${r}" data-c="${c}" class="${cls}">${esc(v)}</td>`;
    }
    html += '</tr>';
  }
  st.grid.innerHTML = html + '</tbody></table>';
  w.body.querySelector('.nb').textContent = ref(st.cur.r, st.cur.c);
  w.body.querySelector('.fv').textContent = sh[ref(st.cur.r, st.cur.c)]?.v ?? '';
  w.body.querySelectorAll('.xtabs span').forEach((t) => t.classList.toggle('on', +t.dataset.s === st.si));
  st.grid.querySelector('td.cur')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

// ===================== PowerPoint: hàm phụ =====================
const slideHtml = (s) => `<div class="sl" style="background:${s.bg}"><div class="slt${s.bg.startsWith('#fff') ? '' : ' w'}${s.fresh ? ' ph' : ''}">${esc(s.t)}</div><div class="sls${s.bg.startsWith('#fff') ? '' : ' w'}${s.fresh ? ' ph' : ''}">${esc(s.s).replace(/\n/g, '<br>')}</div></div>`;
function pRender(w) {
  const st = w.state;
  w.body.querySelector('.pthumbs').innerHTML = st.slides.map((s, i) => `<div class="pt${i === st.cur ? ' on' : ''}" data-i="${i}"><span>${i + 1}</span><div class="ptb">${slideHtml(s)}</div></div>`).join('');
  w.body.querySelectorAll('.pt').forEach((t) => (t.onclick = () => { st.cur = +t.dataset.i; pRender(w); }));
  w.body.querySelector('.pslide').innerHTML = slideHtml(st.slides[st.cur]);
  w.body.querySelector('.pthumbs .on')?.scrollIntoView({ block: 'nearest' });
}
function slideShow(w, os, start) {
  const st = w.state; let i = start, mode = null;
  const el = h('<div class="show"><div class="shs"></div><div class="shc"></div><div class="shh">→ / Space: tiếp · ←: lùi · B: màn đen · W: màn trắng · Esc: thoát</div></div>');
  const draw = () => {
    const box = el.querySelector('.shs');
    if (i >= st.slides.length) box.innerHTML = '<div class="shend">Kết thúc trình chiếu. Bấm để thoát.</div>';
    else { box.innerHTML = slideHtml(st.slides[i]); box.firstElementChild.classList.add('in'); }
    el.querySelector('.shc').className = 'shc' + (mode ? ' ' + mode : '');
  };
  const next = () => { mode = null; if (i >= st.slides.length) { os.closeOverlay(); return; } i++; draw(); };
  const prev = () => { mode = null; i = Math.max(0, i - 1); draw(); };
  el.onclick = next;
  os.openOverlay('show', el, (c) => {
    if (['Right', 'Down', 'Space', 'N', 'Enter', 'PageDown'].includes(c)) next();
    else if (['Left', 'Up', 'P', 'Backspace', 'PageUp'].includes(c)) prev();
    else if (c === 'Home') { i = 0; mode = null; draw(); }
    else if (c === 'End') { i = st.slides.length - 1; mode = null; draw(); }
    else if (c === 'B' || c === '.') { mode = mode === 'black' ? null : 'black'; draw(); }
    else if (c === 'W' || c === ',') { mode = mode === 'white' ? null : 'white'; draw(); }
    else if (c === 'Esc' || c === '-') { st.cur = Math.min(i, st.slides.length - 1); os.closeOverlay(); pRender(w); }
    else return /^(Win|Alt\+Tab|Alt\+F4|Ctrl\+Alt|Ctrl\+Shift\+Esc|PrtScn)/.test(c) ? false : true;
    return true;
  }, () => {});
  draw();
}

// ===================== Explorer: hàm phụ =====================
function exItems(w) {
  const st = w.state; const dir = st.path[st.path.length - 1];
  const q = w.body.querySelector('.exs')?.value.trim().toLowerCase();
  return dir.kids.filter((k) => !q || k.name.toLowerCase().includes(q)).sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, 'vi') : a.type === 'dir' ? -1 : 1));
}
function exRender(w, os) {
  const st = w.state; const dir = st.path[st.path.length - 1]; const items = exItems(w); const root = getFS(os);
  w.body.querySelector('.addr').innerHTML = st.path.map((p) => `<span>${esc(p.name)}</span>`).join('<i>›</i>');
  w.body.querySelector('.nav').innerHTML = [...root.kids.filter((k) => k.type === 'dir'), os.recycle].map((n) => `<div class="${dir === n ? 'on' : ''}">${n === os.recycle ? '🗑' : '📁'} ${esc(n.name)}</div>`).join('');
  w.body.querySelectorAll('.nav div').forEach((d, i) => (d.onclick = () => { const n = [...root.kids.filter((k) => k.type === 'dir'), os.recycle][i]; st.back.push(st.path); st.path = n === os.recycle ? [n] : [root, n]; st.sel.clear(); exRender(w, os); }));
  const fc = os.fileClip;
  w.body.querySelector('.list').innerHTML = `<div class="lh"><span>Tên</span><span>Ngày sửa đổi</span><span>Loại</span><span>Kích thước</span></div>` + (items.map((n, i) => `<div class="li${st.sel.has(n) ? ' on' : ''}${i === st.focus ? ' foc' : ''}${fc?.cut && fc.nodes.includes(n) ? ' cut' : ''}" data-i="${i}"><span>${fileIcon(n)} ${st.renaming?.node === n ? `<input class="ren" value="${esc(n.name)}" spellcheck="false">` : esc(n.name)}</span><span>${n.date}</span><span>${kind(n)}</span><span>${n.size || ''}</span></div>`).join('') || `<div class="empty">${dir === os.recycle ? 'Thùng rác trống' : 'Thư mục này trống'}</div>`);
  w.body.querySelectorAll('.list .li').forEach((r) => {
    r.onmousedown = (e) => { if (e.target.tagName === 'INPUT') return; const n = items[+r.dataset.i]; if (!e.ctrlKey && !e.shiftKey) st.sel.clear(); st.sel.add(n); st.focus = +r.dataset.i; exRender(w, os); };
    r.ondblclick = () => { const n = items[+r.dataset.i]; if (n.type === 'dir') { st.back.push(st.path.slice()); st.path = [...st.path, n]; st.sel.clear(); exRender(w, os); } else openFile(os, n); };
  });
  const ren = w.body.querySelector('.ren');
  if (ren) { st.renaming.input = ren; setTimeout(() => { ren.focus(); const dot = ren.value.lastIndexOf('.'); ren.setSelectionRange(0, dot > 0 && st.renaming.node.type === 'file' ? dot : ren.value.length); }, 10); }
  w.body.querySelector('.exst').innerHTML = `<span>${dir.kids.length} mục</span>${st.sel.size ? `<span>Đã chọn ${st.sel.size} mục</span>` : ''}${os.recycle.kids.length ? `<span>Thùng rác: ${os.recycle.kids.length}</span>` : ''}`;
  os.setTitle(w, dir.name + ' — File Explorer');
}
function openFile(os, n) {
  const ext = n.name.split('.').pop();
  const app = { txt: 'notepad', docx: 'word', xlsx: 'excel', pptx: 'ppt', html: 'browser' }[ext];
  if (app === 'notepad') os.open('notepad', { name: n.name, text: 'Đây là nội dung của tệp "' + n.name + '".' });
  else if (app) { const w = os.open(app); os.setTitle(w, n.name + ' — ' + w.def.name); }
  else os.notify('Mở ' + n.name, ext === 'exe' ? 'Không chạy được chương trình cài đặt trong máy giả lập.' : 'Định dạng ' + kind(n).toLowerCase() + ' — trên máy thật sẽ mở bằng ứng dụng phù hợp.');
}

// ===================== Trình duyệt: trang web giả =====================
const PAGES = {
  'tinhoc://newtab': { title: 'Thẻ mới', html: `<div class="nt"><div class="ntlogo">TinHoc</div><input class="nts" placeholder="Tìm kiếm hoặc nhập địa chỉ web" data-nt><div class="ntg">${[['Trang chủ', 'https://tinhoc.vn'], ['Bách khoa', 'https://wiki.tinhoc.vn/Ban_phim'], ['Tin tức', 'https://tintuc.tinhoc.vn'], ['Video', 'https://video.tinhoc.vn']].map(([a, b]) => `<a data-href="${b}"><i>${a[0]}</i>${a}</a>`).join('')}</div></div>` },
  'https://tinhoc.vn': { title: 'TinHoc.vn — Trang chủ', html: `<div class="site"><h1>TinHoc.vn</h1><p class="lead">Cổng học Tin học cho học sinh THCS.</p><div class="cards"><a data-href="https://wiki.tinhoc.vn/Ban_phim"><b>Bàn phím máy tính</b><span>Lịch sử, cấu tạo và các nhóm phím</span></a><a data-href="https://tintuc.tinhoc.vn"><b>Tin công nghệ</b><span>Những điều mới trong tuần</span></a><a data-href="https://video.tinhoc.vn"><b>Video bài giảng</b><span>Học qua video ngắn</span></a></div>${lorem(4)}</div>` },
  'https://wiki.tinhoc.vn/Ban_phim': { title: 'Bàn phím — Bách khoa TinHoc', html: `<div class="site wiki"><h1>Bàn phím máy tính</h1><p><b>Bàn phím</b> là thiết bị nhập dữ liệu phổ biến nhất của máy tính. Bố cục QWERTY được Christopher Sholes thiết kế cho máy đánh chữ từ những năm 1870 và vẫn được dùng đến ngày nay.</p><h2>Các nhóm phím</h2><p>Bàn phím gồm nhóm phím chữ và số, nhóm phím chức năng F1 đến F12, nhóm phím điều khiển như Ctrl, Alt, Shift, phím Windows, nhóm phím di chuyển con trỏ và bàn phím số.</p><h2>Phím tắt</h2><p>Phím tắt là tổ hợp phím giúp thực hiện nhanh một lệnh. Ví dụ Ctrl + C để sao chép, Ctrl + V để dán, Ctrl + Z để hoàn tác. Người dùng thành thạo phím tắt có thể làm việc nhanh hơn nhiều so với chỉ dùng chuột.</p><h2>Tư thế gõ phím</h2><p>Khi gõ phím, hai ngón trỏ đặt lên hai phím có gờ là F và J. Lưng thẳng, mắt cách màn hình khoảng 50 đến 70 cm.</p>${lorem(3)}<p><a data-href="https://tinhoc.vn">← Về trang chủ</a></p></div>` },
  'https://tintuc.tinhoc.vn': { title: 'Tin công nghệ — TinHoc', html: `<div class="site"><h1>Tin công nghệ</h1>${['Học sinh Việt Nam đoạt huy chương Olympic Tin học', 'Mẹo bảo vệ mật khẩu cho tài khoản học tập', 'Vì sao nên sao lưu dữ liệu thường xuyên?', 'Trí tuệ nhân tạo trong lớp học'].map((t, i) => `<div class="news"><div class="th" style="background:hsl(${i * 70 + 190},70%,60%)"></div><div><b>${t}</b><span>${i + 1} giờ trước</span></div></div>`).join('')}${lorem(2)}</div>` },
  'https://video.tinhoc.vn': { title: 'Video bài giảng — TinHoc', html: `<div class="site"><h1>Video bài giảng</h1><div class="vg">${['Gõ 10 ngón', 'Phím tắt Word', 'Lắp ráp máy tính', 'An toàn trên mạng', 'Excel cơ bản', 'Lập trình Scratch'].map((t, i) => `<div><div class="vth" style="background:hsl(${i * 55},60%,55%)">▶</div><b>${t}</b><span>${3 + i} phút</span></div>`).join('')}</div></div>` },
};
function lorem(n) { const s = ['Máy tính ngày nay có mặt ở khắp nơi, từ lớp học đến bệnh viện và nhà máy.', 'Mỗi ngày dành mười lăm phút luyện gõ phím sẽ giúp tốc độ gõ tăng lên rõ rệt.', 'Hãy luôn đăng xuất tài khoản khi dùng máy tính chung ở phòng Tin.', 'Dữ liệu quan trọng nên được lưu ở ít nhất hai nơi khác nhau.', 'Internet là kho kiến thức khổng lồ nhưng cần biết chọn lọc thông tin.']; return Array.from({ length: n }, (_, i) => `<p>${s[i % s.length]} ${s[(i + 2) % s.length]}</p>`).join(''); }
function pageOf(u, w) {
  if (PAGES[u]) return PAGES[u];
  if (u === 'tinhoc://history') return { title: 'Lịch sử', html: `<div class="site"><h1>Lịch sử</h1>${(w?.state.hist || []).slice().reverse().map((x) => `<div class="hrow"><span>${x.t}</span><a data-href="${x.u}">${esc(pageOf(x.u).title)}</a><small>${esc(x.u)}</small></div>`).join('') || '<p>Chưa có lịch sử.</p>'}</div>` };
  if (u === 'tinhoc://downloads') return { title: 'Tệp đã tải xuống', html: `<div class="site"><h1>Tệp đã tải xuống</h1>${[['TinHocLab-Setup.exe', '78 MB'], ['Đề cương ôn tập.pdf', '1,2 MB']].map(([a, b]) => `<div class="hrow"><span>📄</span><b>${a}</b><small>${b} · Hôm qua</small></div>`).join('')}</div>` };
  const q = /q=([^&]*)/.exec(u);
  if (q) { const t = decodeURIComponent(q[1]); return { title: t + ' — Tìm kiếm', html: `<div class="site"><p class="muted">Khoảng 12.400 kết quả cho "<b>${esc(t)}</b>"</p>${[['Bàn phím máy tính — Bách khoa', 'https://wiki.tinhoc.vn/Ban_phim'], ['TinHoc.vn — Trang chủ', 'https://tinhoc.vn'], ['Video bài giảng', 'https://video.tinhoc.vn']].map(([a, b]) => `<div class="res"><small>${b}</small><a data-href="${b}">${a}</a><span>Trang có thông tin liên quan đến "${esc(t)}".</span></div>`).join('')}</div>` }; }
  return { title: u.replace(/^https?:\/\//, ''), html: `<div class="site"><h1>Không thể truy cập trang web này</h1><p>Máy giả lập chỉ có vài trang mẫu. Thử: tinhoc.vn, wiki.tinhoc.vn/Ban_phim, tintuc.tinhoc.vn, video.tinhoc.vn.</p></div>` };
}
function newTab(w, u) { const st = w.state; st.tabs.push({ hist: [u], hi: 0, zoom: 100 }); st.cur = st.tabs.length - 1; logHist(w, u); bRender(w); }
function nav(w, u) { const st = w.state; const t = st.tabs[st.cur]; t.hist = t.hist.slice(0, t.hi + 1); t.hist.push(u); t.hi++; logHist(w, u); bRender(w); }
function logHist(w, u) { if (!w.state.inc && !u.startsWith('tinhoc://')) w.state.hist.push({ u, t: nowTime() }); }
function bRender(w) {
  const st = w.state; const t = st.tabs[st.cur]; const u = t.hist[t.hi]; const pg = pageOf(u, w);
  w.body.querySelector('.btabs').innerHTML = st.tabs.map((x, i) => `<div class="bt${i === st.cur ? ' on' : ''}" data-i="${i}"><span>${esc(pageOf(x.hist[x.hi], w).title)}</span><i data-x="${i}">✕</i></div>`).join('') + '<b class="bplus">+</b>';
  w.body.querySelectorAll('.bt').forEach((b) => (b.onclick = (e) => { if (e.target.dataset.x) { st.cur = +e.target.dataset.x; APPS.browser.key('Ctrl+W', w, w.os); } else { st.cur = +b.dataset.i; bRender(w); } }));
  w.body.querySelector('.bplus').onclick = () => APPS.browser.key('Ctrl+T', w, w.os);
  const url = w.body.querySelector('.url'); if (document.activeElement !== url) url.value = u.startsWith('tinhoc://newtab') ? '' : u;
  url.placeholder = 'Tìm kiếm hoặc nhập địa chỉ web';
  w.body.querySelector('.star').textContent = st.marks.has(u) ? '★' : '☆'; w.body.querySelector('.star').classList.toggle('on', st.marks.has(u));
  w.body.querySelector('.bmarks').innerHTML = [...st.marks].map((m) => `<a data-href="${m}">★ ${esc(pageOf(m).title.slice(0, 22))}</a>`).join('') || '<span>Bấm Ctrl + D để thêm trang vào thanh dấu trang</span>';
  w.body.querySelectorAll('.bmarks a').forEach((a) => (a.onclick = () => nav(w, a.dataset.href)));
  const page = w.body.querySelector('.bpage'); page.innerHTML = pg.html; page.style.zoom = t.zoom / 100;
  page.querySelector('[data-nt]')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); } });
  w.body.querySelector('.bview').scrollTop = 0;
  w.state.fb?.remove(); w.state.fb = null;
}
function zoom(w, d) {
  const steps = [25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300]; const t = w.state.tabs[w.state.cur];
  const i = steps.indexOf(t.zoom); t.zoom = d === 0 ? 100 : steps[Math.max(0, Math.min(steps.length - 1, i + d))];
  w.body.querySelector('.bpage').style.zoom = t.zoom / 100;
  const z = w.body.querySelector('.bzoom'); z.textContent = 'Thu phóng: ' + t.zoom + '%'; z.classList.add('show'); clearTimeout(z.t); z.t = setTimeout(() => z.classList.remove('show'), 1400);
}
function clearMarks(w) { w.body.querySelectorAll('mark.hit').forEach((m) => m.replaceWith(document.createTextNode(m.textContent))); w.body.querySelector('.bpage').normalize(); }
function bFind(w) {
  w.state.fb?.remove();
  const b = h('<div class="findbar br-f"><input class="fq" placeholder="Tìm trong trang"><span class="fc"></span><button class="fx">✕</button></div>');
  w.body.querySelector('.bview').before(b); w.state.fb = b;
  const q = b.querySelector('.fq'); w.state.fi = 0;
  q.addEventListener('input', () => {
    clearMarks(w); const s = q.value.trim(); if (!s) { b.querySelector('.fc').textContent = ''; return; }
    const walker = document.createTreeWalker(w.body.querySelector('.bpage'), NodeFilter.SHOW_TEXT); const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    let n = 0; const re = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    nodes.forEach((t) => { if (!re.test(t.data)) return; re.lastIndex = 0; const span = document.createElement('span'); span.innerHTML = esc(t.data).replace(new RegExp(esc(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (m) => { n++; return `<mark class="hit">${m}</mark>`; }); t.replaceWith(...span.childNodes); });
    w.state.fi = 0; b.querySelector('.fc').textContent = n ? `1/${n}` : '0/0'; hitCur(w);
  });
  b.querySelector('.fx').onclick = () => { b.remove(); clearMarks(w); };
  setTimeout(() => q.focus(), 20);
}
function hitCur(w) { const hs = w.body.querySelectorAll('mark.hit'); hs.forEach((m, i) => m.classList.toggle('cur', i === w.state.fi)); hs[w.state.fi]?.scrollIntoView({ block: 'center' }); }
function bFindNext(w) { const hs = w.body.querySelectorAll('mark.hit'); if (!hs.length) return; w.state.fi = (w.state.fi + 1) % hs.length; w.state.fb.querySelector('.fc').textContent = `${w.state.fi + 1}/${hs.length}`; hitCur(w); }

export { move };
export const HELP = { getFS, exRender, exItems, nav, newTab, bRender, render, ref, pRender, slideShow };
