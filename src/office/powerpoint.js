// Microsoft PowerPoint simulator (English UI)
buildTitlebar({ app: 'PowerPoint', letter: 'P' });
const SW = 960, SH = 540;
$('#fontSize').innerHTML = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 96].map((s) => `<option>${s}</option>`).join('');

const THEMES = {
  office: { name: 'Office', bg: '#ffffff', title: '#262626', text: '#404040', accent: '#4472c4', font: 'Calibri' },
  blue: { name: 'Ion', bg: 'linear-gradient(135deg,#0b3d91,#1e6fd9)', title: '#ffffff', text: '#e6f0ff', accent: '#ffc000', font: 'Segoe UI' },
  wood: { name: 'Organic', bg: 'linear-gradient(160deg,#fdf3e1,#f2d6a8)', title: '#7a3e00', text: '#4a2b0f', accent: '#c55a11', font: 'Georgia' },
  dark: { name: 'Midnight', bg: 'linear-gradient(160deg,#1f1f2e,#3a3a55)', title: '#ffd966', text: '#f2f2f2', accent: '#00b0f0', font: 'Verdana' },
  green: { name: 'Nature', bg: 'linear-gradient(180deg,#e2f0d9 0%,#ffffff 60%)', title: '#38761d', text: '#274e13', accent: '#70ad47', font: 'Tahoma' },
  sunset: { name: 'Sunset', bg: 'linear-gradient(135deg,#f7971e,#ffd200)', title: '#5b1a00', text: '#3d1400', accent: '#c00000', font: 'Arial' },
};
const LAYOUTS = {
  title: { name: 'Title Slide', ph: [['title', 80, 150, 800, 130, 48, 'center'], ['subtitle', 80, 295, 800, 80, 24, 'center']] },
  titleContent: { name: 'Title and Content', ph: [['title', 60, 30, 840, 90, 40, 'left'], ['body', 60, 135, 840, 370, 24, 'left']] },
  twoContent: { name: 'Two Content', ph: [['title', 60, 30, 840, 90, 40, 'left'], ['body', 60, 135, 410, 370, 22, 'left'], ['body2', 490, 135, 410, 370, 22, 'left']] },
  section: { name: 'Section Header', ph: [['title', 80, 190, 800, 110, 44, 'left'], ['subtitle', 80, 310, 800, 60, 20, 'left']] },
  titleOnly: { name: 'Title Only', ph: [['title', 60, 30, 840, 90, 40, 'left']] },
  blank: { name: 'Blank', ph: [] },
};
const PH_TEXT = { title: 'Click to add title', subtitle: 'Click to add subtitle', body: 'Click to add text', body2: 'Click to add text' };
const TRANS = { none: ['None', '∅'], fade: ['Fade', '◐'], push: ['Push', '⇧'], wipe: ['Wipe', '▶'], split: ['Split', '⇔'], zoom: ['Zoom', '⊕'], flip: ['Flip', '↻'] };
const ANIMS = { none: ['None', '∅'], appear: ['Appear', '✦'], fade: ['Fade', '◐'], fly: ['Fly In', '⇧'], zoom: ['Zoom', '⊕'], wipe: ['Wipe', '▶'], bounce: ['Bounce', '⤒'], spin: ['Spin', '↻'] };
const SHAPES = {
  rect: ['Rectangle', (f, s) => `<rect x="2" y="2" width="96" height="96" fill="${f}" stroke="${s}" stroke-width="2" vector-effect="non-scaling-stroke"/>`],
  round: ['Rectangle: Rounded Corners', (f, s) => `<rect x="2" y="2" width="96" height="96" rx="14" fill="${f}" stroke="${s}" stroke-width="2" vector-effect="non-scaling-stroke"/>`],
  ellipse: ['Oval', (f, s) => `<ellipse cx="50" cy="50" rx="48" ry="48" fill="${f}" stroke="${s}" stroke-width="2" vector-effect="non-scaling-stroke"/>`],
  triangle: ['Isosceles Triangle', (f, s) => `<polygon points="50,2 98,98 2,98" fill="${f}" stroke="${s}" stroke-width="2" vector-effect="non-scaling-stroke"/>`],
  arrow: ['Arrow: Right', (f, s) => `<polygon points="2,30 62,30 62,4 98,50 62,96 62,70 2,70" fill="${f}" stroke="${s}" stroke-width="2" vector-effect="non-scaling-stroke"/>`],
  star: ['Star: 5 Points', (f, s) => `<polygon points="50,2 62,37 98,37 69,59 80,96 50,74 20,96 31,59 2,37 38,37" fill="${f}" stroke="${s}" stroke-width="2" vector-effect="non-scaling-stroke"/>`],
  callout: ['Speech Bubble', (f, s) => `<path d="M4 4 H96 V70 H40 L22 96 L26 70 H4 Z" fill="${f}" stroke="${s}" stroke-width="2" vector-effect="non-scaling-stroke"/>`],
  heart: ['Heart', (f, s) => `<path d="M50 94 C8 62 2 34 18 16 C32 2 46 10 50 22 C54 10 68 2 82 16 C98 34 92 62 50 94Z" fill="${f}" stroke="${s}" stroke-width="2" vector-effect="non-scaling-stroke"/>`],
};

let P = null, cur = 0, selId = null, editId = null, played = false;
let uid = 1; const nid = () => 'e' + Date.now().toString(36) + (uid++);
const th = () => THEMES[P.theme] || THEMES.office;
const slide = () => P.slides[cur];

// ================= Tạo dữ liệu =================
function makeSlide(layout = 'titleContent', texts = {}) {
  const s = { id: nid(), layout, bg: null, transition: 'none', notes: '', els: [] };
  LAYOUTS[layout].ph.forEach(([ph, x, y, w, h, fs, al]) => {
    let html = texts[ph] || '';
    if ((ph === 'body' || ph === 'body2') && html && !html.startsWith('<')) html = '<ul>' + html.split('\n').map((l) => `<li>${escapeHtml(l)}</li>`).join('') + '</ul>';
    s.els.push({ id: nid(), type: 'text', ph, x, y, w, h, html: html && !html.startsWith('<') ? escapeHtml(html) : html, st: { fontSize: fs, align: al }, anim: null });
  });
  return s;
}
function newPres() { return { theme: 'office', slides: [makeSlide('title')] }; }

// ================= Hoàn tác =================
const undoStack = [], redoStack = [];
function snap() { undoStack.push(JSON.stringify({ P, cur })); if (undoStack.length > 80) undoStack.shift(); redoStack.length = 0; }
function undo() { commitText(); if (!undoStack.length) return; redoStack.push(JSON.stringify({ P, cur })); const d = JSON.parse(undoStack.pop()); P = d.P; cur = Math.min(d.cur, P.slides.length - 1); selId = editId = null; renderAll(); }
function redo() { if (!redoStack.length) return; undoStack.push(JSON.stringify({ P, cur })); const d = JSON.parse(redoStack.pop()); P = d.P; cur = Math.min(d.cur, P.slides.length - 1); selId = editId = null; renderAll(); }

// ================= Vẽ trang chiếu =================
function elStyle(e, t) {
  const st = e.st || {};
  const isTitle = e.ph === 'title';
  return {
    fontSize: (st.fontSize || 24) + 'px', color: st.color || (isTitle ? t.title : t.text), fontFamily: (st.font || t.font) + ', Calibri, Carlito, "Segoe UI", Arial, sans-serif',
    fontWeight: st.bold ? 'bold' : '', fontStyle: st.italic ? 'italic' : '', textDecoration: [st.underline ? 'underline' : '', st.strike ? 'line-through' : ''].join(' ').trim(),
    textAlign: st.align || 'left', lineHeight: st.line || '', textShadow: st.shadow ? '2px 2px 4px rgba(0,0,0,.45)' : '',
  };
}
function slideDOM(s, { interactive = false, forShow = false } = {}) {
  const t = th();
  const d = document.createElement('div'); d.className = 'slide';
  d.style.background = s.bg || t.bg;
  s.els.forEach((e, i) => {
    const el = document.createElement('div');
    el.className = 'el' + (e.ph ? ' ph ph-' + e.ph : '') + (e.type === 'text' && e.html && e.html.replace(/<[^>]+>/g, '').trim() ? ' has' : '');
    el.dataset.id = e.id;
    Object.assign(el.style, { left: e.x + 'px', top: e.y + 'px', width: e.w + 'px', height: e.h + 'px', zIndex: i + 1 });
    if (e.st && e.st.bgFill && e.type === 'text') el.style.background = e.st.bgFill === 'none' ? '' : e.st.bgFill;
    if (e.st && e.st.stroke && e.type === 'text') el.style.border = '2px solid ' + e.st.stroke;
    if (e.type === 'shape') {
      el.innerHTML = `<svg class="shp" viewBox="0 0 100 100" preserveAspectRatio="none">${SHAPES[e.shape][1](e.st.fill || t.accent, e.st.stroke || 'rgba(0,0,0,.35)')}</svg>`;
    }
    if (e.type === 'image') el.innerHTML = `<img src="${e.src}">`;
    if (e.type === 'text' || e.type === 'shape') {
      const tx = document.createElement('div'); tx.className = 'tx';
      if (e.ph && !forShow) tx.dataset.ph = PH_TEXT[e.ph];
      tx.innerHTML = e.html || '';
      Object.assign(tx.style, elStyle(e, t));
      if (e.type === 'shape') { tx.style.position = 'relative'; tx.style.justifyContent = 'center'; if (!e.st.color) tx.style.color = '#fff'; if (!e.st.align) tx.style.textAlign = 'center'; }
      if (e.wordart) { tx.style.webkitTextStroke = '1px rgba(0,0,0,.3)'; tx.style.fontWeight = 'bold'; }
      el.appendChild(tx);
    }
    if (forShow && e.type === 'text' && e.ph && !(e.html || '').replace(/<[^>]+>/g, '').trim()) el.style.display = 'none';
    if (interactive && e.anim) { const tag = document.createElement('div'); tag.className = 'animTag'; tag.textContent = s.els.filter((x) => x.anim).indexOf(e) + 1; el.appendChild(tag); }
    d.appendChild(el);
  });
  if (P.slideNums) { const n = document.createElement('div'); n.textContent = P.slides.indexOf(s) + 1; Object.assign(n.style, { position: 'absolute', right: '24px', bottom: '14px', fontSize: '16px', color: t.text, opacity: 0.7 }); d.appendChild(n); }
  return d;
}

let scale = 1;
function fitStage() {
  const st = $('#stage'); const W = st.clientWidth - 40, H = st.clientHeight - 30;
  scale = Math.max(0.2, Math.min(W / SW, H / SH));
  const host = $('#slideHost'); host.style.width = SW * scale + 'px'; host.style.height = SH * scale + 'px';
  const sl = host.firstChild; if (sl) { sl.style.transform = `scale(${scale})`; sl.style.transformOrigin = '0 0'; }
}
addEventListener('resize', () => { fitStage(); });

function renderStage() {
  const host = $('#slideHost'); host.innerHTML = '';
  const d = slideDOM(slide(), { interactive: true });
  host.appendChild(d); fitStage();
  d.querySelectorAll('.el').forEach((el) => {
    const e = findEl(el.dataset.id);
    if (e.id === selId) { el.classList.add('sel'); ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach((k) => { const h = document.createElement('div'); h.className = 'hd ' + k; h.dataset.h = k; el.appendChild(h); }); }
    if (e.id === editId) { el.classList.add('edit'); const tx = el.querySelector('.tx'); tx.contentEditable = 'true'; }
  });
  $('#notes').value = slide().notes || '';
  $('#stSlide').textContent = `Slide ${cur + 1} of ${P.slides.length}`;
  syncRibbon();
}
function renderThumbs() {
  const box = $('#thumbs'); box.innerHTML = '';
  P.slides.forEach((s, i) => {
    const t = document.createElement('div'); t.className = 'thumb' + (i === cur ? ' on' : ''); t.draggable = true; t.dataset.i = i;
    t.innerHTML = `<div class="num">${i + 1}${s.transition !== 'none' ? '<small>★</small>' : ''}</div><div class="tbox"></div>`;
    t.querySelector('.tbox').appendChild(slideDOM(s));
    box.appendChild(t);
  });
}
function renderAll() { renderThumbs(); renderStage(); renderGalleries(); }
const findEl = (id) => slide().els.find((e) => e.id === id);

// ================= Chọn & kéo đối tượng =================
function commitText() {
  if (!editId) return;
  const el = $(`#slideHost .el[data-id="${editId}"] .tx`); const e = findEl(editId);
  if (el && e) { const h = el.innerHTML.replace(/^<br>$/, ''); if (h !== e.html) { e.html = h; } }
  editId = null;
}
function selectEl(id, edit = false) {
  if (editId && editId !== id) { commitText(); renderThumbs(); }
  selId = id; editId = edit ? id : null;
  renderStage();
  if (edit) { const tx = $(`#slideHost .el[data-id="${id}"] .tx`); if (tx) { tx.focus(); const r = document.createRange(); r.selectNodeContents(tx); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } }
}
$('#slideHost').addEventListener('mousedown', (e) => {
  const elDiv = e.target.closest('.el');
  if (!elDiv) { if (selId) { commitText(); selId = null; renderAll(); } return; }
  const id = elDiv.dataset.id; const obj = findEl(id);
  if (editId === id && !e.target.classList.contains('hd')) return; // typing text
  e.preventDefault();
  const wasSel = selId === id;
  if (!wasSel || editId) selectEl(id);
  const handle = e.target.classList.contains('hd') ? e.target.dataset.h : null;
  const x0 = e.clientX, y0 = e.clientY, o = { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
  let moved = false;
  const node = () => $(`#slideHost .el[data-id="${id}"]`);
  const mv = (ev) => {
    const dx = (ev.clientX - x0) / scale, dy = (ev.clientY - y0) / scale;
    if (!moved && Math.hypot(dx, dy) < 3) return;
    if (!moved) { snap(); moved = true; }
    if (handle) {
      let { x, y, w, h } = o;
      if (handle.includes('e')) w = Math.max(20, o.w + dx); if (handle.includes('s')) h = Math.max(20, o.h + dy);
      if (handle.includes('w')) { w = Math.max(20, o.w - dx); x = o.x + o.w - w; } if (handle.includes('n')) { h = Math.max(20, o.h - dy); y = o.y + o.h - h; }
      if (obj.type === 'image' && handle.length === 2 && obj.ratio) h = w / obj.ratio;
      Object.assign(obj, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    } else { obj.x = Math.round(o.x + dx); obj.y = Math.round(o.y + dy); }
    const n = node(); Object.assign(n.style, { left: obj.x + 'px', top: obj.y + 'px', width: obj.w + 'px', height: obj.h + 'px' });
  };
  const up = () => {
    document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up);
    if (moved) renderThumbs();
    else if (wasSel && (obj.type === 'text' || obj.type === 'shape') && !handle) selectEl(id, true);
  };
  document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
});
$('#slideHost').addEventListener('dblclick', (e) => { const elDiv = e.target.closest('.el'); if (elDiv) { const o = findEl(elDiv.dataset.id); if (o.type !== 'image') selectEl(o.id, true); } });
$('#slideHost').addEventListener('input', () => { const tx = $(`#slideHost .el[data-id="${editId}"] .tx`); if (tx) tx.parentElement.classList.toggle('has', !!tx.textContent.trim()); });
$('#slideHost').addEventListener('focusout', () => { setTimeout(() => { if (editId && !$('#slideHost').contains(document.activeElement) && !document.querySelector('.dropdown')) { const id = editId; commitText(); selId = id; renderThumbs(); } }, 0); });
$('#notes').addEventListener('input', (e) => { slide().notes = e.target.value; });

// ================= Bàn phím =================
document.addEventListener('keydown', (e) => {
  if ($('#backstage') || $('.modal-bg')) return;
  if (!$('#show').hidden) return showKey(e);
  if (e.key === 'F5') { e.preventDefault(); startShow(e.shiftKey ? cur : 0); return; }
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key.toLowerCase() === 'z' && !editId) { e.preventDefault(); undo(); return; }
  if (ctrl && e.key.toLowerCase() === 'y' && !editId) { e.preventDefault(); redo(); return; }
  if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); savePres(); return; }
  if (ctrl && e.key.toLowerCase() === 'm') { e.preventDefault(); addSlide('titleContent'); return; }
  if (editId || document.activeElement === $('#notes') || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
    if (e.key === 'Escape' && editId) { const id = editId; commitText(); selId = id; renderAll(); }
    return;
  }
  if (selId && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); snap(); slide().els = slide().els.filter((x) => x.id !== selId); selId = null; renderAll(); return; }
  if (selId && e.key.startsWith('Arrow')) { e.preventDefault(); const o = findEl(selId); const d = e.shiftKey ? 10 : 2; snap(); if (e.key === 'ArrowLeft') o.x -= d; if (e.key === 'ArrowRight') o.x += d; if (e.key === 'ArrowUp') o.y -= d; if (e.key === 'ArrowDown') o.y += d; renderAll(); return; }
  if (selId && e.key.length === 1 && !ctrl) { const o = findEl(selId); if (o.type !== 'image') { selectEl(selId, true); } return; }
  if (document.activeElement === $('#thumbs') || !selId) {
    if (e.key === 'Delete') { e.preventDefault(); deleteSlide(); }
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goSlide(cur + 1); }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goSlide(cur - 1); }
  }
});

// ================= Trang chiếu =================
function goSlide(i) { commitText(); cur = Math.max(0, Math.min(P.slides.length - 1, i)); selId = editId = null; renderAll(); const t = $$('.thumb')[cur]; t && t.scrollIntoView({ block: 'nearest' }); }
function addSlide(layout) { commitText(); snap(); P.slides.splice(cur + 1, 0, makeSlide(layout)); goSlide(cur + 1); }
function deleteSlide() { commitText(); if (P.slides.length <= 1) return toast('A presentation must have at least one slide.', 'warn'); snap(); P.slides.splice(cur, 1); goSlide(Math.min(cur, P.slides.length - 1)); }
function dupSlide() { commitText(); snap(); const c = JSON.parse(JSON.stringify(slide())); c.id = nid(); c.els.forEach((e) => e.id = nid()); P.slides.splice(cur + 1, 0, c); goSlide(cur + 1); }
function moveSlide(from, to) { if (to < 0 || to >= P.slides.length || from === to) return; snap(); const [s] = P.slides.splice(from, 1); P.slides.splice(to, 0, s); cur = to; renderAll(); }
function changeLayout(lay) {
  commitText(); snap(); const s = slide(); const old = s.els; s.layout = lay;
  const keep = old.filter((e) => !e.ph); const fresh = makeSlide(lay).els;
  fresh.forEach((f) => { const prev = old.find((e) => e.ph === f.ph) || (f.ph === 'body' && old.find((e) => e.ph === 'subtitle')); if (prev) { f.html = prev.html; f.anim = prev.anim; f.st = { ...prev.st, fontSize: prev.st.fontSize }; } });
  s.els = [...fresh, ...keep]; renderAll();
}
const layoutMenu = () => Object.entries(LAYOUTS).map(([k, l]) => `<div class="it" data-v="${k}">▭ ${l.name}</div>`).join('');
$('#btnNewSlide').addEventListener('click', (e) => { const r = $('#btnNewSlide').getBoundingClientRect(); if (e.clientY < r.top + 40) return addSlide(cur === 0 && slide().layout === 'title' ? 'titleContent' : slide().layout === 'title' ? 'titleContent' : slide().layout); dropdown($('#btnNewSlide'), layoutMenu(), (v) => addSlide(v)); });
$('#btnNewSlide2').addEventListener('click', () => dropdown($('#btnNewSlide2'), layoutMenu(), (v) => addSlide(v)));
$('#btnLayout').addEventListener('click', () => dropdown($('#btnLayout'), layoutMenu(), changeLayout));
$('#btnDup').addEventListener('click', dupSlide);
$('#btnDelSlide').addEventListener('click', deleteSlide);
// thanh trang chiếu: chọn, kéo thả, menu chuột phải
$('#thumbs').tabIndex = 0;
$('#thumbs').addEventListener('click', (e) => { const t = e.target.closest('.thumb'); if (t) goSlide(+t.dataset.i); });
let dragFrom = null;
$('#thumbs').addEventListener('dragstart', (e) => { const t = e.target.closest('.thumb'); dragFrom = +t.dataset.i; e.dataTransfer.effectAllowed = 'move'; });
$('#thumbs').addEventListener('dragover', (e) => { e.preventDefault(); $$('.thumb').forEach((x) => x.classList.remove('dragover')); const t = e.target.closest('.thumb'); if (t) t.classList.add('dragover'); });
$('#thumbs').addEventListener('drop', (e) => { e.preventDefault(); const t = e.target.closest('.thumb'); const to = t ? +t.dataset.i : P.slides.length - 1; if (dragFrom !== null) moveSlide(dragFrom, to); dragFrom = null; });
$('#thumbs').addEventListener('contextmenu', (e) => {
  e.preventDefault(); const t = e.target.closest('.thumb'); if (t) goSlide(+t.dataset.i);
  const fake = { getBoundingClientRect: () => ({ left: e.clientX, bottom: e.clientY, top: e.clientY, right: e.clientX }) };
  dropdown(fake, '<div class="it" data-v="new"><span data-i="newslide"></span> New Slide</div><div class="it" data-v="dup"><span data-i="duplicate"></span> Duplicate Slide</div><div class="it" data-v="del"><span data-i="deleteslide"></span> Delete Slide</div><div class="sep"></div><div class="it" data-v="up">⬆ Move Up</div><div class="it" data-v="down">⬇ Move Down</div>', (v) => {
    if (v === 'new') addSlide('titleContent'); if (v === 'dup') dupSlide(); if (v === 'del') deleteSlide(); if (v === 'up') moveSlide(cur, cur - 1); if (v === 'down') moveSlide(cur, cur + 1);
  });
});

// ================= Định dạng văn bản =================
function syncRibbon() {
  const o = selId && findEl(selId);
  const st = (o && o.st) || {};
  $('#fontSize').value = String(st.fontSize || 24);
  $('#fontName').value = st.font || th().font;
  ['bold', 'italic', 'underline'].forEach((k) => { const b = $(`[data-tx="${k}"]`); b.classList.toggle('on', editId ? document.queryCommandState(k) : !!st[k]); });
  $$('[data-al]').forEach((b) => b.classList.toggle('on', (st.align || 'left') === b.dataset.al && !!o));
}
document.addEventListener('selectionchange', () => { if (editId) syncRibbon(); });
let saved = null;
document.addEventListener('selectionchange', () => { const s = getSelection(); if (editId && s.rangeCount && $('#slideHost').contains(s.anchorNode)) saved = s.getRangeAt(0).cloneRange(); });
function restoreSel() { const tx = $(`#slideHost .el[data-id="${editId}"] .tx`); if (!tx) return false; tx.focus(); if (saved && tx.contains(saved.startContainer)) { const s = getSelection(); s.removeAllRanges(); s.addRange(saved); } return true; }
function withTarget(onWhole, onInline) {
  const o = selId && findEl(selId);
  if (!o) return toast('Select a text box or shape first.', 'warn');
  if (editId && restoreSel() && !getSelection().isCollapsed && onInline) { snap(); onInline(); const tx = $(`#slideHost .el[data-id="${editId}"] .tx`); findEl(editId).html = tx.innerHTML; renderThumbs(); return; }
  if (editId) commitText();
  snap(); onWhole(o); selId = o.id; renderAll();
}
$$('[data-tx]').forEach((b) => b.addEventListener('click', () => {
  const c = b.dataset.tx;
  if (['insertUnorderedList', 'insertOrderedList', 'indent', 'outdent'].includes(c)) {
    const o = selId && findEl(selId); if (!o) return toast('Select a text box first.', 'warn');
    if (!editId) selectEl(o.id, true);
    restoreSel();
    if (getSelection().isCollapsed && !editId) { const tx = $(`#slideHost .el[data-id="${o.id}"] .tx`); const r = document.createRange(); r.selectNodeContents(tx); getSelection().removeAllRanges(); getSelection().addRange(r); }
    snap(); document.execCommand(c); findEl(o.id).html = $(`#slideHost .el[data-id="${o.id}"] .tx`).innerHTML; renderThumbs(); return;
  }
  const key = { bold: 'bold', italic: 'italic', underline: 'underline', strikeThrough: 'strike' }[c];
  withTarget((o) => { o.st[key] = !o.st[key]; }, () => document.execCommand(c));
}));
$('#btnShadow').addEventListener('click', () => withTarget((o) => o.st.shadow = !o.st.shadow));
$$('[data-al]').forEach((b) => b.addEventListener('click', () => withTarget((o) => o.st.align = b.dataset.al)));
$('#fontSize').addEventListener('change', (e) => { const v = +e.target.value; withTarget((o) => o.st.fontSize = v, () => { document.execCommand('fontSize', false, '7'); $$('#slideHost font[size="7"]').forEach((f) => { const s = document.createElement('span'); s.style.fontSize = v + 'px'; s.innerHTML = f.innerHTML; f.replaceWith(s); }); $$('#slideHost span').forEach((s) => { if (s.style.fontSize === 'xxx-large') s.style.fontSize = v + 'px'; }); }); });
$$('[data-fs]').forEach((b) => b.addEventListener('click', () => withTarget((o) => o.st.fontSize = Math.max(8, Math.min(120, (o.st.fontSize || 24) + +b.dataset.fs)))));
$('#fontName').addEventListener('change', (e) => { const v = e.target.value; withTarget((o) => o.st.font = v, () => document.execCommand('fontName', false, v)); });
let curColor = '#c00000';
$('#btnColor').addEventListener('click', (e) => {
  const r = $('#btnColor').getBoundingClientRect();
  const apply = (c) => withTarget((o) => o.st.color = c, () => document.execCommand('foreColor', false, c));
  if (e.clientX < r.left + 24) return apply(curColor);
  colorPicker($('#btnColor'), (c) => { curColor = c; $('#colorBar').style.background = c; apply(c); });
});
$('#btnLine').addEventListener('click', () => dropdown($('#btnLine'), ['1.0', '1.2', '1.5', '2.0'].map((x) => `<div class="it" data-v="${x}">${x.replace('.', ',')}</div>`).join(''), (v) => withTarget((o) => o.st.line = v)));
$('#btnFill').addEventListener('click', () => colorPicker($('#btnFill'), (c) => withTarget((o) => { if (o.type === 'shape') o.st.fill = c === 'none' ? 'transparent' : c; else o.st.bgFill = c; }), { none: true }));
$('#btnOutline').addEventListener('click', () => colorPicker($('#btnOutline'), (c) => withTarget((o) => { o.st.stroke = c === 'none' ? 'transparent' : c; }), { none: true }));
$('#btnArrange').addEventListener('click', () => dropdown($('#btnArrange'), '<div class="hd">Order Objects</div><div class="it" data-v="front">⬆ Bring to Front</div><div class="it" data-v="back">⬇ Send to Back</div>', (v) => withTarget((o) => { const a = slide().els; a.splice(a.indexOf(o), 1); v === 'front' ? a.push(o) : a.unshift(o); })));

// ================= Chèn =================
function addEl(e) { commitText(); snap(); slide().els.push({ id: nid(), anim: null, st: {}, ...e }); selId = slide().els[slide().els.length - 1].id; editId = null; renderAll(); }
$('#btnTextbox').addEventListener('click', () => { addEl({ type: 'text', x: 330, y: 220, w: 300, h: 70, html: 'Text', st: { fontSize: 24, align: 'left' } }); selectEl(selId, true); document.execCommand('selectAll'); });
$('#btnWordArt').addEventListener('click', () => addEl({ type: 'text', wordart: true, x: 180, y: 200, w: 600, h: 120, html: 'Your text here', st: { fontSize: 66, align: 'center', color: '#c43e1c', shadow: true, bold: true } }));
const shapeMenu = () => Object.entries(SHAPES).map(([k, [n, f]]) => `<div class="it" data-v="${k}"><svg width="34" height="24" viewBox="0 0 100 100" preserveAspectRatio="none">${f('#4472c4', '#2f528f')}</svg> ${n}</div>`).join('');
const addShape = (k) => addEl({ type: 'shape', shape: k, x: 380, y: 190, w: 200, h: 160, html: '', st: {} });
$('#btnShapes').addEventListener('click', () => dropdown($('#btnShapes'), shapeMenu(), addShape));
$('#btnShapes2').addEventListener('click', () => dropdown($('#btnShapes2'), shapeMenu(), addShape));
$('#btnPicture').addEventListener('click', () => dropdown($('#btnPicture'), `<div class="it" data-v="file"><span data-i="picture"></span> This Device...</div><div class="sep"></div><div class="hd">Stock Images</div>${SAMPLE_IMAGES.map((im, i) => `<div class="it" data-v="${i}"><img src="${im.url}" style="width:48px;height:32px;border:1px solid #ddd"> ${im.name}</div>`).join('')}`, async (v) => {
  const url = v === 'file' ? await pickImage() : SAMPLE_IMAGES[+v].url; if (!url) return;
  const img = new Image(); img.onload = () => { const ratio = img.width / img.height || 1.5; const w = Math.min(480, 320 * ratio); addEl({ type: 'image', src: url, ratio, x: (SW - w) / 2, y: (SH - w / ratio) / 2, w, h: w / ratio }); }; img.src = url;
}));
$('#btnSlideNum').addEventListener('click', () => { snap(); P.slideNums = !P.slideNums; renderAll(); toast(P.slideNums ? 'Slide numbers turned on.' : 'Slide numbers turned off.', 'info'); });

// ================= Thiết kế / Chuyển tiếp / Hiệu ứng =================
function renderGalleries() {
  $('#themeGallery').innerHTML = Object.entries(THEMES).map(([k, t]) => `<div class="galbtn ${P.theme === k ? 'on' : ''}" data-theme="${k}"><div class="sw" style="background:${t.bg};color:${t.title};font-family:${t.font}">Aa</div>${t.name}</div>`).join('');
  $('#transGallery').innerHTML = Object.entries(TRANS).map(([k, [n, ic]]) => `<div class="galbtn ${slide().transition === k ? 'on' : ''}" data-trans="${k}"><div style="font-size:20px">${ic}</div>${n}</div>`).join('');
  const o = selId && findEl(selId);
  $('#animGallery').innerHTML = Object.entries(ANIMS).map(([k, [n, ic]]) => `<div class="galbtn ${o && (o.anim || 'none') === k ? 'on' : ''}" data-anim="${k}" style="${o ? '' : 'opacity:.45'}"><div style="font-size:20px;color:#2e8b57">${ic}</div>${n}</div>`).join('');
}
$('#themeGallery').addEventListener('click', (e) => { const g = e.target.closest('[data-theme]'); if (!g) return; commitText(); snap(); P.theme = g.dataset.theme; renderAll(); });
$('#btnBg').addEventListener('click', () => {
  const grads = ['linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#43cea2,#185a9d)', 'linear-gradient(135deg,#ff9a9e,#fad0c4)', 'linear-gradient(135deg,#f6d365,#fda085)'];
  const d = dropdown($('#btnBg'), `<div class="hd">Solid fill</div><div class="swatches">${PALETTE.map((c) => `<span data-v="${c}" style="background:${c}"></span>`).join('')}</div><div class="hd">Gradient fill</div><div class="swatches" style="grid-template-columns:repeat(4,40px)">${grads.map((g) => `<span data-v="${g}" style="width:40px;height:24px;background:${g}"></span>`).join('')}</div><div class="it" data-v="pic"><span data-i="picture"></span> Picture fill...</div><div class="sep"></div><div class="it" data-v="reset">Reset Background</div>`, async (v) => {
    commitText(); snap();
    if (v === 'reset') slide().bg = null;
    else if (v === 'pic') { const u = await pickImage(); if (u) slide().bg = `center/cover no-repeat url("${u}")`; }
    else slide().bg = v;
    renderAll();
  });
});
$('#btnBgAll').addEventListener('click', () => { commitText(); snap(); const bg = slide().bg; P.slides.forEach((s) => s.bg = bg); renderAll(); toast('Background applied to all slides.', 'ok'); });
$('#transGallery').addEventListener('click', (e) => { const g = e.target.closest('[data-trans]'); if (!g) return; snap(); slide().transition = g.dataset.trans; renderAll(); previewTrans(); });
$('#btnTransAll').addEventListener('click', () => { snap(); const t = slide().transition; P.slides.forEach((s) => s.transition = t); renderAll(); toast('Transition applied to all slides.', 'ok'); });
function previewTrans() { const sl = $('#slideHost .slide'); const k = slide().transition; if (!sl || k === 'none') return; sl.style.animation = 'none'; sl.offsetWidth; sl.style.animation = `t${k[0].toUpperCase() + k.slice(1)} .8s ease`; }
$('#btnTransPreview').addEventListener('click', previewTrans);
$('#animGallery').addEventListener('click', (e) => {
  const g = e.target.closest('[data-anim]'); if (!g) return;
  const o = selId && findEl(selId); if (!o) return toast('Select an object on the slide first.', 'warn');
  commitText(); snap(); o.anim = g.dataset.anim === 'none' ? null : g.dataset.anim; selId = o.id; renderAll(); previewAnim(o);
});
function animCss(k) { return { appear: 'none', fade: 'aFade .7s ease', fly: 'aFly .7s cubic-bezier(.2,.8,.3,1)', zoom: 'aZoom .6s ease', wipe: 'aWipe .7s ease', bounce: 'aBounce 1s ease', spin: 'aSpin .8s ease' }[k]; }
function previewAnim(o) { const n = $(`#slideHost .el[data-id="${o.id}"]`); if (!n || !o.anim) return; n.style.animation = 'none'; n.offsetWidth; n.style.animation = animCss(o.anim); }
$('#btnAnimPreview').addEventListener('click', () => { slide().els.filter((e) => e.anim).forEach((o, i) => setTimeout(() => previewAnim(o), i * 700)); });

// ================= Trình chiếu =================
let showIdx = 0, showStep = 0;
function startShow(from = 0) {
  commitText(); played = true;
  $('#show').hidden = false; showIdx = from; showStep = 0;
  document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
  drawShow(true);
}
function drawShow(withTrans) {
  const s = P.slides[showIdx]; const box = $('#showSlide'); box.innerHTML = '';
  const k = Math.min(innerWidth / SW, innerHeight / SH);
  box.style.width = SW * k + 'px'; box.style.height = SH * k + 'px';
  const d = slideDOM(s, { forShow: true }); d.style.transform = `scale(${k})`; box.appendChild(d);
  const anims = s.els.filter((e) => e.anim);
  anims.forEach((e, i) => { if (i >= showStep) d.querySelector(`.el[data-id="${e.id}"]`).classList.add('anim-hidden'); });
  if (withTrans && s.transition !== 'none') { box.style.animation = 'none'; box.offsetWidth; box.style.animation = `t${s.transition[0].toUpperCase() + s.transition.slice(1)} .8s ease`; } else box.style.animation = '';
}
function showNext() {
  const s = P.slides[showIdx]; const anims = s.els.filter((e) => e.anim);
  if (showStep < anims.length) { const e = anims[showStep]; const n = $(`#showSlide .el[data-id="${e.id}"]`); n.classList.remove('anim-hidden'); n.style.animation = animCss(e.anim); showStep++; return; }
  if (showIdx < P.slides.length - 1) { showIdx++; showStep = 0; drawShow(true); } else endShowScreen();
}
function showPrev() { if (showIdx > 0) { showIdx--; showStep = P.slides[showIdx].els.filter((e) => e.anim).length; drawShow(false); } }
function endShowScreen() { const box = $('#showSlide'); if (box.dataset.end) return stopShow(); box.dataset.end = '1'; box.innerHTML = '<div style="color:#fff;font:20px Segoe UI;display:grid;place-items:center;height:100%">End of slide show, click to exit.</div>'; box.style.animation = ''; }
function stopShow() { $('#show').hidden = true; delete $('#showSlide').dataset.end; if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }
function showKey(e) {
  e.preventDefault();
  if (e.key === 'Escape') return stopShow();
  if ($('#showSlide').dataset.end) return stopShow();
  if (['ArrowRight', 'ArrowDown', ' ', 'Enter', 'PageDown', 'n'].includes(e.key)) showNext();
  if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p'].includes(e.key)) showPrev();
}
$('#show').addEventListener('click', () => ($('#showSlide').dataset.end ? stopShow() : showNext()));
$('#show').addEventListener('contextmenu', (e) => { e.preventDefault(); showPrev(); });
$('#btnShowStart').addEventListener('click', () => startShow(0));
$('#btnShowCur').addEventListener('click', () => startShow(cur));
$('#qaShow').addEventListener('click', () => startShow(0));

// ================= Tệp =================
let presName = 'Presentation1';
function setPresName(n) { presName = n; setDocTitle(n, 'PowerPoint'); }
function loadPres(d) { P = d ? JSON.parse(JSON.stringify(d)) : newPres(); P.slides.forEach((s) => { s.id = s.id || nid(); s.els.forEach((e) => { e.id = e.id || nid(); e.st = e.st || {}; }); }); cur = 0; selId = editId = null; played = false; undoStack.length = 0; redoStack.length = 0; renderAll(); }
const savePres = () => { commitText(); saveJSON(presName, 'thp', P); };
function exportHTML() {
  commitText();
  const slidesHtml = P.slides.map((s) => slideDOM(s, { forShow: true }).outerHTML).join('');
  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(presName)}</title><style>body{margin:0;background:#000;display:grid;place-items:center;height:100vh;overflow:hidden}.slide{width:960px;height:540px;position:absolute;overflow:hidden;font-family:Calibri,sans-serif;display:none;transform-origin:center}.slide.on{display:block}.el{position:absolute}.tx{width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:6px 12px;box-sizing:border-box}.shp{position:absolute;inset:0;width:100%;height:100%}.el img{width:100%;height:100%;object-fit:contain}</style></head><body>${slidesHtml}<script>const s=[...document.querySelectorAll('.slide')];let i=0;const fit=()=>s.forEach(x=>x.style.transform='scale('+Math.min(innerWidth/960,innerHeight/540)+')');const show=()=>s.forEach((x,k)=>x.classList.toggle('on',k===i));fit();show();onresize=fit;onclick=()=>{i=Math.min(s.length-1,i+1);show()};onkeydown=e=>{if(e.key==='ArrowLeft')i=Math.max(0,i-1);else i=Math.min(s.length-1,i+1);show()}<\/script></body></html>`;
  exportText(presName, 'html', 'Web Page', html);
}
const runner = new TaskRunner({ app: 'ppt', exercises: PPT_EXERCISES(makeSlide), load: (ex) => { loadPres(ex ? ex.start() : null); setPresName(ex ? ex.title : 'Presentation1'); }, api: null });
function fileMenu(start = 0) {
  backstage([
    { label: 'Practice', render: (b, close) => runner.renderPicker(b, close) },
    { label: 'New', action: () => runner.free() },
    { label: 'Open', action: async () => { const d = await openJSON('thp'); if (d) { runner.free(); loadPres(d); } } },
    { label: 'Save', action: savePres },
    { label: 'Export (.html)', action: exportHTML },
  ], start);
}
runner.onList = () => fileMenu(0);
initRibbon(() => fileMenu(1));
$('#btnEx').onclick = () => fileMenu(0);
$('#qaUndo').onclick = undo; $('#qaRedo').onclick = redo; $('#qaSave').onclick = savePres;
// ribbon nhấn chuột không làm mất vùng chọn, nhưng select vẫn hoạt động
$('#ribbon').addEventListener('mousedown', (e) => { if (e.target.closest('select')) return; });

// ================= API chấm điểm =================
const plain = (h) => { const d = document.createElement('div'); d.innerHTML = h || ''; return d.textContent.replace(/ /g, ' ').trim(); };
const api = {
  get P() { commitTextSoft(); return P; },
  get played() { return played; },
  title: (i) => { const s = P.slides[i]; const t = s && s.els.find((e) => e.ph === 'title'); return t ? plain(t.html) : ''; },
  text: (e) => plain(e.html),
  els: (i, pred = () => true) => (P.slides[i] ? P.slides[i].els.filter(pred) : []),
  findSlide: (re) => P.slides.findIndex((s, i) => re.test(api.title(i))),
  rgb: (hex) => { if (!hex) return null; const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex); return m ? [1, 2, 3].map((k) => parseInt(m[k], 16)) : null; },
  lines: (e) => { const d = document.createElement('div'); d.innerHTML = e.html || ''; const li = d.querySelectorAll('li'); return li.length ? [...li].map((x) => x.textContent.trim()).filter(Boolean) : d.innerText.split('\n').map((s) => s.trim()).filter(Boolean); },
};
function commitTextSoft() { if (!editId) return; const el = $(`#slideHost .el[data-id="${editId}"] .tx`); const e = findEl(editId); if (el && e) e.html = el.innerHTML; }
runner.api = api;
window.__ppt = { api, runner, get P() { return P; }, selectEl, goSlide, addSlide, startShow, stopShow };

loadPres(null);
new ResizeObserver(fitStage).observe($('#stage'));
setTimeout(() => fileMenu(0), 50);
