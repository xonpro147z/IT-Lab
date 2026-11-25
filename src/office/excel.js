// Microsoft Excel simulator (English UI)
buildTitlebar({ app: 'Excel', letter: 'X' });
const ROWS = 100, COLS = 26, DEFW = 80;
const { addr, colName, parseAddr } = XL;
const grid = $('#grid'), wrap = $('#gridWrap'), inner = $('#gridInner'), editor = $('#cellEditor'), fx = $('#fx');

const S = { cells: {}, merges: [], cond: [], charts: [], colW: Array(COLS).fill(DEFW) };
let sel = { r1: 0, c1: 0, r2: 0, c2: 0 }, act = { r: 0, c: 0 };
let vals = {}, visiting = new Set();
let showFormulas = false, zoom = 1;

// ================= Dữ liệu ô =================
const cell = (r, c) => S.cells[addr(r, c)];
function setRaw(r, c, raw) {
  const a = addr(r, c);
  const old = S.cells[a] || { raw: '', s: {} };
  if (raw === '' && !Object.keys(old.s || {}).length) delete S.cells[a];
  else S.cells[a] = { raw, s: old.s || {} };
}
function setStyle(r, c, patch) {
  const a = addr(r, c);
  const o = S.cells[a] || (S.cells[a] = { raw: '', s: {} });
  o.s = { ...o.s, ...patch };
  Object.keys(o.s).forEach((k) => (o.s[k] === undefined || o.s[k] === null || o.s[k] === false) && delete o.s[k]);
}
function literal(raw) {
  if (raw === '' || raw == null) return '';
  if (raw[0] === "'") return raw.slice(1);
  const t = raw.trim();
  if (/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(t)) return parseFloat(t);
  if (/^-?\d+,\d{1,2}$/.test(t)) return parseFloat(t.replace(',', '.'));
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return parseFloat(t.replace(/,/g, ''));
  if (/^-?\d+(\.\d+)?%$/.test(t)) return parseFloat(t) / 100;
  if (/^(true|false)$/i.test(t)) return t.toUpperCase() === 'TRUE';
  const dm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t); if (dm) return XL.dateToSerial(+dm[3], +dm[1], +dm[2]);
  return raw;
}
const ctx = { get: (r, c) => getVal(r, c) };
const astCache = new Map();
function getVal(r, c) {
  const a = addr(r, c);
  if (a in vals) return vals[a];
  const o = S.cells[a];
  if (!o || o.raw === '') return '';
  if (o.raw[0] !== '=' || o.raw.length === 1) return (vals[a] = literal(o.raw));
  if (visiting.has(a)) return XL.E.circ;
  visiting.add(a);
  let v;
  try {
    let ast = astCache.get(o.raw);
    if (!ast) { ast = XL.parse(o.raw.slice(1)); astCache.set(o.raw, ast); }
    v = XL.evaluate(ast, ctx);
  } catch { v = XL.E.name; }
  visiting.delete(a);
  if (Array.isArray(v)) v = v[0][0];
  return (vals[a] = v);
}
function recalc() { vals = {}; visiting = new Set(); }

// ================= Định dạng hiển thị =================
function fmt(v, s = {}) {
  if (XL.isErr(v)) return v.code;
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v !== 'number') return String(v);
  const f = s.fmt || 'general';
  const dec = s.dec;
  const n = (x, d) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  switch (f) {
    case 'number': return n(v, dec ?? 2);
    case 'int': return n(v, dec ?? 2);
    case 'currency': return (v < 0 ? '-$' : '$') + n(Math.abs(v), dec ?? 2);
    case 'accounting': return '$ ' + (v < 0 ? '(' + n(-v, dec ?? 2) + ')' : n(v, dec ?? 2));
    case 'percent': return (v * 100).toLocaleString('en-US', { minimumFractionDigits: dec ?? 0, maximumFractionDigits: dec ?? 0 }) + '%';
    case 'date': { const d = XL.serialToDate(v); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`; }
    default:
      if (dec !== undefined) return v.toFixed(dec);
      if (Number.isInteger(v)) return String(v);
      return String(+v.toPrecision(11));
  }
}
function condStyle(r, c, v) {
  for (const k of S.cond) {
    if (r < k.r1 || r > k.r2 || c < k.c1 || c > k.c2) continue;
    let ok = false;
    const x = typeof v === 'number' ? v : NaN;
    if (k.op === 'gt') ok = x > k.v1; if (k.op === 'lt') ok = x < k.v1; if (k.op === 'eq') ok = typeof v === 'number' ? x === k.v1 : String(v).toLowerCase() === String(k.v1).toLowerCase();
    if (k.op === 'between') ok = x >= k.v1 && x <= k.v2; if (k.op === 'text') ok = String(v).toLowerCase().includes(String(k.v1).toLowerCase());
    if (ok) return k;
  }
  return null;
}

// ================= Dựng lưới =================
function buildGrid() {
  let h = '<colgroup><col style="width:44px">' + S.colW.map((w) => `<col style="width:${w}px">`).join('') + '</colgroup>';
  h += '<thead><tr><th class="corner rh"></th>' + Array.from({ length: COLS }, (_, c) => `<th data-c="${c}">${colName(c)}<span class="rz" data-c="${c}"></span></th>`).join('') + '</tr></thead><tbody>';
  for (let r = 0; r < ROWS; r++) h += `<tr><th class="rh" data-r="${r}">${r + 1}</th>` + Array.from({ length: COLS }, (_, c) => `<td data-r="${r}" data-c="${c}"></td>`).join('') + '</tr>';
  grid.innerHTML = h + '</tbody>';
}
const td = (r, c) => grid.tBodies[0].rows[r].cells[c + 1];
function renderCell(r, c) {
  const el = td(r, c); const o = cell(r, c); const s = (o && o.s) || {};
  const v = getVal(r, c);
  let txt = showFormulas && o && o.raw[0] === '=' ? o.raw : (s.fmt === 'text' && o ? o.raw : fmt(v, s));
  if (!showFormulas && !s.fmt && s.dec === undefined && typeof v === 'number' && !Number.isInteger(v)) {
    // giống Excel: kiểu Chung tự rút gọn số chữ số thập phân cho vừa độ rộng cột
    const maxc = Math.max(3, Math.floor((S.colW[c] - 8) / 8));
    if (txt.length > maxc) { const intLen = String(Math.trunc(Math.abs(v))).length + (v < 0 ? 1 : 0); txt = String(+v.toFixed(Math.max(0, maxc - intLen - 1))); }
  }
  el.textContent = txt;
  const cs = condStyle(r, c, v);
  const st = el.style;
  st.fontWeight = s.b ? 'bold' : ''; st.fontStyle = s.i ? 'italic' : ''; st.textDecoration = s.u ? 'underline' : '';
  st.color = cs ? cs.color : s.color || ''; st.backgroundColor = cs ? cs.fill : s.fill || '';
  st.fontFamily = s.font || ''; st.fontSize = s.size ? s.size + 'pt' : '';
  st.textAlign = s.al || (typeof v === 'number' && !showFormulas ? 'right' : typeof v === 'boolean' || XL.isErr(v) ? 'center' : 'left');
  const B = '1px solid #000', BT = '2px solid #000';
  st.borderTop = s.bt ? B : ''; st.borderBottom = s.bb === 2 ? BT : s.bb ? B : ''; st.borderLeft = s.bl ? B : ''; st.borderRight = s.br ? B : '';
  el.classList.toggle('wrap', !!s.wrap);
  // văn bản dài tràn sang ô trống bên phải (giống Excel)
  st.overflow = typeof v === 'string' && v !== '' && !s.wrap && st.textAlign === 'left' && c < COLS - 1 && getVal(r, c + 1) === '' ? 'visible' : '';
  el.classList.toggle('err', XL.isErr(v));
}
function renderAll() {
  recalc();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const el = td(r, c); el.style.display = ''; el.colSpan = 1; el.rowSpan = 1; renderCell(r, c); }
  S.merges.forEach((m) => {
    const el = td(m.r1, m.c1); el.colSpan = m.c2 - m.c1 + 1; el.rowSpan = m.r2 - m.r1 + 1;
    for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) if (r !== m.r1 || c !== m.c1) td(r, c).style.display = 'none';
    const s = (cell(m.r1, m.c1) || { s: {} }).s; if (!s.al) el.style.textAlign = 'center';
  });
  $$('col', grid).forEach((col, i) => { if (i) col.style.width = S.colW[i - 1] + 'px'; });
  grid.style.width = 44 + S.colW.reduce((a, b) => a + b, 0) + 'px';
  drawSel(); renderCharts(); updateStatus();
}

// ================= Vùng chọn =================
const norm = (s) => ({ r1: Math.min(s.r1, s.r2), c1: Math.min(s.c1, s.c2), r2: Math.max(s.r1, s.r2), c2: Math.max(s.c1, s.c2) });
function mergeAt(r, c) { return S.merges.find((m) => r >= m.r1 && r <= m.r2 && c >= m.c1 && c <= m.c2); }
function expandForMerges(n) {
  let changed = true;
  while (changed) { changed = false; for (const m of S.merges) if (!(m.r2 < n.r1 || m.r1 > n.r2 || m.c2 < n.c1 || m.c1 > n.c2)) { const o = { ...n }; n.r1 = Math.min(n.r1, m.r1); n.c1 = Math.min(n.c1, m.c1); n.r2 = Math.max(n.r2, m.r2); n.c2 = Math.max(n.c2, m.c2); if (JSON.stringify(o) !== JSON.stringify(n)) changed = true; } }
  return n;
}
function cellRect(r, c) { const el = td(r, c); return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }; }
function drawSel() {
  const n = expandForMerges(norm(sel));
  const a = cellRect(n.r1, n.c1), m2 = mergeAt(n.r2, n.c2);
  const b = cellRect(m2 ? m2.r1 : n.r2, m2 ? m2.c1 : n.c2);
  const box = $('#selBox');
  box.style.display = 'block';
  box.style.left = a.x - 1 + 'px'; box.style.top = a.y - 1 + 'px';
  box.style.width = b.x + b.w - a.x + 1 + 'px'; box.style.height = b.y + b.h - a.y + 1 + 'px';
  $$('#grid th.hl').forEach((h) => h.classList.remove('hl'));
  for (let c = n.c1; c <= n.c2; c++) grid.tHead.rows[0].cells[c + 1].classList.add('hl');
  for (let r = n.r1; r <= n.r2; r++) grid.tBodies[0].rows[r].cells[0].classList.add('hl');
  $('#nameBox').value = n.r1 === n.r2 && n.c1 === n.c2 ? addr(act.r, act.c) : `${addr(n.r1, n.c1)}:${addr(n.r2, n.c2)}`;
  if (!editing) { const o = cell(act.r, act.c); fx.value = o ? o.raw : ''; }
  syncRibbon(); updateStatus();
}
function select(r1, c1, r2 = r1, c2 = c1, a = null) {
  r1 = clamp(r1, 0, ROWS - 1); r2 = clamp(r2, 0, ROWS - 1); c1 = clamp(c1, 0, COLS - 1); c2 = clamp(c2, 0, COLS - 1);
  sel = { r1, c1, r2, c2 }; act = a || { r: r1, c: c1 };
  drawSel(); scrollIntoView(act.r, act.c);
}
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function scrollIntoView(r, c) {
  const rc = cellRect(r, c); const W = wrap; const z = zoom;
  if (rc.x * z < W.scrollLeft + 44) W.scrollLeft = rc.x * z - 44; else if ((rc.x + rc.w) * z > W.scrollLeft + W.clientWidth) W.scrollLeft = (rc.x + rc.w) * z - W.clientWidth + 4;
  if (rc.y * z < W.scrollTop + 24) W.scrollTop = rc.y * z - 24; else if ((rc.y + rc.h) * z > W.scrollTop + W.clientHeight) W.scrollTop = (rc.y + rc.h) * z - W.clientHeight + 4;
}
function eachSel(fn) { const n = norm(sel); for (let r = n.r1; r <= n.r2; r++) for (let c = n.c1; c <= n.c2; c++) fn(r, c); }
function syncRibbon() {
  const s = (cell(act.r, act.c) || { s: {} }).s;
  $$('[data-st]').forEach((b) => b.classList.toggle('on', !!s[b.dataset.st]));
  $$('[data-al]').forEach((b) => b.classList.toggle('on', s.al === b.dataset.al));
  $('#numFmt').value = s.fmt || 'general';
  $('#fontName').value = s.font || 'Calibri';
  $('#fontSize').value = String(s.size || 11);
}
function updateStatus() {
  const n = norm(sel); const nums = []; let cnt = 0;
  for (let r = n.r1; r <= n.r2; r++) for (let c = n.c1; c <= n.c2; c++) { const v = getVal(r, c); if (v !== '') cnt++; if (typeof v === 'number') nums.push(v); }
  const multi = n.r1 !== n.r2 || n.c1 !== n.c2;
  $('#stAgg').textContent = multi && cnt ? (nums.length ? `Average: ${fmt(nums.reduce((a, b) => a + b, 0) / nums.length, { dec: nums.every(Number.isInteger) ? undefined : 2 })}    Count: ${cnt}    Sum: ${fmt(nums.reduce((a, b) => a + b, 0))}` : `Count: ${cnt}`) : '';
  $('#stMode').textContent = editing ? (fx.value.startsWith('=') ? 'Point' : 'Enter') : 'Ready';
}

// ================= Hoàn tác =================
const undoStack = [], redoStack = [];
function snapshot() { undoStack.push(JSON.stringify(S)); if (undoStack.length > 80) undoStack.shift(); redoStack.length = 0; }
function restore(json) { const d = JSON.parse(json); Object.assign(S, d); buildGrid(); renderAll(); }
function undo() { if (!undoStack.length) return; redoStack.push(JSON.stringify(S)); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(JSON.stringify(S)); restore(redoStack.pop()); }

// ================= Soạn thảo ô =================
let editing = false, editFromFx = false, refInsert = null;
function startEdit(initial = null, fromFx = false) {
  const m = mergeAt(act.r, act.c); const r = m ? m.r1 : act.r, c = m ? m.c1 : act.c;
  const rc = cellRect(r, c); const el = td(r, c);
  const o = cell(r, c);
  editing = true; editFromFx = fromFx;
  editor.hidden = false;
  editor.style.left = rc.x + 'px'; editor.style.top = rc.y + 'px';
  editor.style.minWidth = el.offsetWidth + 'px'; editor.style.width = Math.max(el.offsetWidth, 120) + 'px'; editor.style.height = el.offsetHeight + 'px';
  const s = (o && o.s) || {};
  editor.style.fontWeight = s.b ? 'bold' : ''; editor.style.fontStyle = s.i ? 'italic' : '';
  editor.value = initial !== null ? initial : o ? o.raw : '';
  fx.value = editor.value;
  if (!fromFx) { editor.focus(); editor.setSelectionRange(editor.value.length, editor.value.length); }
  updateStatus();
}
function commitEdit(move = null) {
  if (!editing) return;
  const val = editFromFx ? fx.value : editor.value;
  editing = false; editor.hidden = true; refInsert = null;
  const m = mergeAt(act.r, act.c); const r = m ? m.r1 : act.r, c = m ? m.c1 : act.c;
  const o = cell(r, c);
  if (!o || o.raw !== val) {
    if (val.startsWith('=') && val.length > 1) { try { XL.parse(val.slice(1)); } catch (e) { toast('There\'s a problem with this formula: ' + e.message, 'err', 3500); } }
    snapshot(); setRaw(r, c, autoClose(val));
    const st0 = (cell(r, c) || { s: {} }).s;
    if (!st0.fmt && (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val.trim()) || /^=.*\b(TODAY|DATE)\(/i.test(val))) setStyle(r, c, { fmt: 'date' });
    if (!st0.fmt && /^-?\$[\d,]+(\.\d+)?$/.test(val.trim())) { setStyle(r, c, { fmt: 'currency' }); setRaw(r, c, val.replace(/[$,]/g, '')); }
    renderAll();
  }
  if (move) select(act.r + move[0], act.c + move[1]); else drawSel();
  updateStatus();
}
function autoClose(v) { if (!v.startsWith('=')) return v; const open = (v.match(/\(/g) || []).length - (v.match(/\)/g) || []).length; return open > 0 ? v + ')'.repeat(open) : v; }
function cancelEdit() { editing = false; editor.hidden = true; refInsert = null; drawSel(); }
editor.addEventListener('input', () => { fx.value = editor.value; refInsert = null; updateStatus(); });
fx.addEventListener('focus', () => { if (!editing) startEdit(null, true); });
fx.addEventListener('input', () => { if (!editing) startEdit(fx.value, true); editor.value = fx.value; refInsert = null; });
fx.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commitEdit([1, 0]); fx.blur(); } if (e.key === 'Escape') { cancelEdit(); fx.blur(); } });
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); commitEdit([e.shiftKey ? -1 : 1, 0]); }
  else if (e.key === 'Tab') { e.preventDefault(); commitEdit([0, e.shiftKey ? -1 : 1]); }
  else if (e.key === 'Escape') cancelEdit();
});
// chèn địa chỉ ô khi đang gõ công thức
function inFormulaRefMode() {
  if (!editing) return false;
  const inp = editFromFx ? fx : editor; const v = inp.value;
  if (!v.startsWith('=')) return false;
  if (refInsert) return true;
  const before = v.slice(0, inp.selectionStart).trimEnd();
  return /[=(,;+\-*/^&<>:]$/.test(before);
}
function insertRef(text) {
  const inp = editFromFx ? fx : editor;
  if (!refInsert) refInsert = { start: inp.selectionStart, len: 0 };
  const v = inp.value;
  inp.value = v.slice(0, refInsert.start) + text + v.slice(refInsert.start + refInsert.len);
  refInsert.len = text.length;
  const pos = refInsert.start + text.length;
  (editFromFx ? fx : editor).value = inp.value; (editFromFx ? editor : fx).value = inp.value;
  inp.focus(); inp.setSelectionRange(pos, pos);
}

// ================= Chuột trên lưới =================
let dragging = null;
grid.addEventListener('mousedown', (e) => {
  const t = e.target;
  if (t.classList.contains('rz')) return startResize(e, +t.dataset.c);
  const tdEl = t.closest('td'); const th = t.closest('th');
  deselectChart();
  if (tdEl) {
    const r = +tdEl.dataset.r, c = +tdEl.dataset.c;
    if (inFormulaRefMode()) { e.preventDefault(); refAnchor = { r, c }; insertRef(addr(r, c)); dragging = 'ref'; return; }
    if (editing) commitEdit();
    if (painter) { applyPainter(r, c); return; }
    if (e.shiftKey) select(act.r, act.c, r, c, act); else select(r, c);
    dragging = 'sel';
    e.preventDefault();
  } else if (th) {
    if (editing) commitEdit();
    if (th.classList.contains('corner')) select(0, 0, ROWS - 1, COLS - 1);
    else if (th.dataset.c !== undefined) { const c = +th.dataset.c; select(0, c, ROWS - 1, c); dragging = 'col'; }
    else if (th.dataset.r !== undefined) { const r = +th.dataset.r; select(r, 0, r, COLS - 1); dragging = 'row'; }
    e.preventDefault();
  }
});
let refAnchor = null;
grid.addEventListener('mouseover', (e) => {
  if (!dragging) return;
  const tdEl = e.target.closest('td'); const th = e.target.closest('th');
  if (dragging === 'sel' && tdEl) { sel.r2 = +tdEl.dataset.r; sel.c2 = +tdEl.dataset.c; drawSel(); }
  if (dragging === 'ref' && tdEl) { const r = +tdEl.dataset.r, c = +tdEl.dataset.c; insertRef(r === refAnchor.r && c === refAnchor.c ? addr(r, c) : `${addr(Math.min(r, refAnchor.r), Math.min(c, refAnchor.c))}:${addr(Math.max(r, refAnchor.r), Math.max(c, refAnchor.c))}`); }
  if (dragging === 'col' && th && th.dataset.c !== undefined) { sel.c2 = +th.dataset.c; drawSel(); }
  if (dragging === 'row' && th && th.dataset.r !== undefined) { sel.r2 = +th.dataset.r; drawSel(); }
  if (dragging === 'fill' && tdEl) updateFill(+tdEl.dataset.r, +tdEl.dataset.c);
});
document.addEventListener('mouseup', () => { if (dragging === 'fill') endFill(); dragging = null; });
grid.addEventListener('dblclick', (e) => { const tdEl = e.target.closest('td'); if (tdEl) startEdit(); });

// đổi độ rộng cột
function startResize(e, c) {
  e.preventDefault(); e.stopPropagation();
  const x0 = e.clientX, w0 = S.colW[c]; snapshot();
  const mv = (ev) => { S.colW[c] = Math.max(20, Math.round(w0 + (ev.clientX - x0) / zoom)); $$('col', grid)[c + 1].style.width = S.colW[c] + 'px'; grid.style.width = 44 + S.colW.reduce((a, b) => a + b, 0) + 'px'; drawSel(); };
  const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); renderAll(); };
  document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
}

// ================= Kéo điền (fill handle) =================
let fillTarget = null;
$('#fillHandle').addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); if (editing) commitEdit(); dragging = 'fill'; fillTarget = null; $('#selBox').classList.add('filling'); });
function updateFill(r, c) {
  const n = norm(sel);
  let t;
  if (r > n.r2 && Math.abs(r - n.r2) >= Math.abs(c - n.c2)) t = { ...n, r2: r };
  else if (c > n.c2) t = { ...n, c2: c };
  else t = null;
  fillTarget = t;
  let fb = $('#fillBox'); if (!fb) { fb = document.createElement('div'); fb.id = 'fillBox'; inner.appendChild(fb); }
  if (!t) { fb.style.display = 'none'; return; }
  const a = cellRect(t.r1, t.c1), b = cellRect(t.r2, t.c2);
  Object.assign(fb.style, { display: 'block', left: a.x - 1 + 'px', top: a.y - 1 + 'px', width: b.x + b.w - a.x + 1 + 'px', height: b.y + b.h - a.y + 1 + 'px' });
}
function seriesOf(raws) {
  // trả về hàm sinh giá trị thứ k (k>=raws.length)
  const nums = raws.map((x) => (x !== '' && x[0] !== '=' && typeof literal(x) === 'number' ? literal(x) : null));
  if (raws.length >= 2 && nums.every((x) => x !== null)) { const step = nums[1] - nums[0]; if (nums.every((x, i) => i === 0 || Math.abs(x - nums[i - 1] - step) < 1e-9)) return (k) => String(+(nums[0] + step * k).toPrecision(12)); }
  if (raws.length === 1) { const m = /^(.*?)(\d+)$/.exec(raws[0]); if (m && raws[0][0] !== '=' && isNaN(Number(raws[0]))) return (k) => m[1] + (+m[2] + k); }
  return null;
}
function endFill() {
  $('#selBox').classList.remove('filling'); const fb = $('#fillBox'); if (fb) fb.style.display = 'none';
  if (!fillTarget) return;
  const n = norm(sel), t = fillTarget; snapshot();
  if (t.r2 > n.r2) {
    for (let c = n.c1; c <= n.c2; c++) {
      const src = []; for (let r = n.r1; r <= n.r2; r++) src.push(cell(r, c) || { raw: '', s: {} });
      const ser = seriesOf(src.map((x) => x.raw)); const h = src.length;
      for (let r = n.r2 + 1; r <= t.r2; r++) {
        const k = r - n.r1, s = src[k % h];
        const raw = ser ? ser(k) : s.raw[0] === '=' ? XL.shift(s.raw, r - (n.r1 + (k % h)), 0) : s.raw;
        setRaw(r, c, raw); setStyle(r, c, { ...s.s });
      }
    }
  } else {
    for (let r = n.r1; r <= n.r2; r++) {
      const src = []; for (let c = n.c1; c <= n.c2; c++) src.push(cell(r, c) || { raw: '', s: {} });
      const ser = seriesOf(src.map((x) => x.raw)); const w = src.length;
      for (let c = n.c2 + 1; c <= t.c2; c++) {
        const k = c - n.c1, s = src[k % w];
        const raw = ser ? ser(k) : s.raw[0] === '=' ? XL.shift(s.raw, 0, c - (n.c1 + (k % w))) : s.raw;
        setRaw(r, c, raw); setStyle(r, c, { ...s.s });
      }
    }
  }
  sel = { ...t }; fillTarget = null; renderAll();
}

// ================= Bàn phím =================
document.addEventListener('keydown', (e) => {
  if ($('#backstage') || $('.modal-bg')) return;
  if (document.activeElement === fx || document.activeElement === $('#nameBox') || document.activeElement.tagName === 'SELECT') return;
  const ctrl = e.ctrlKey || e.metaKey; const k = e.key;
  if (selChart !== null && (k === 'Delete' || k === 'Backspace')) { e.preventDefault(); deleteChart(); return; }
  if (editing) {
    if (inFormulaRefMode() && k.startsWith('Arrow') && refInsert) { e.preventDefault(); const p = parseAddr(editor.value.slice(refInsert.start, refInsert.start + refInsert.len).split(':')[0]) || act; const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k]; insertRef(addr(clamp(p.r + d[0], 0, ROWS - 1), clamp(p.c + d[1], 0, COLS - 1))); }
    return;
  }
  if (ctrl) {
    const kk = k.toLowerCase();
    if (kk === 'c') { e.preventDefault(); copySel(false); } else if (kk === 'x') { e.preventDefault(); copySel(true); }
    else if (kk === 'v') { e.preventDefault(); paste(); } else if (kk === 'z') { e.preventDefault(); undo(); } else if (kk === 'y') { e.preventDefault(); redo(); }
    else if (kk === 'b' || kk === 'i' || kk === 'u') { e.preventDefault(); toggleStyle(kk); }
    else if (kk === 's') { e.preventDefault(); saveBook(); }
    else if (kk === 'a') { e.preventDefault(); select(0, 0, ROWS - 1, COLS - 1); }
    return;
  }
  const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
  if (mv) {
    e.preventDefault();
    if (e.shiftKey) { sel.r2 = clamp(sel.r2 + mv[0], 0, ROWS - 1); sel.c2 = clamp(sel.c2 + mv[1], 0, COLS - 1); drawSel(); scrollIntoView(sel.r2, sel.c2); }
    else { const m = mergeAt(act.r, act.c); let r = act.r + mv[0], c = act.c + mv[1]; if (m) { if (mv[0] > 0) r = m.r2 + 1; if (mv[1] > 0) c = m.c2 + 1; } select(r, c); }
    return;
  }
  if (k === 'Enter') { e.preventDefault(); select(act.r + (e.shiftKey ? -1 : 1), act.c); return; }
  if (k === 'Tab') { e.preventDefault(); select(act.r, act.c + (e.shiftKey ? -1 : 1)); return; }
  if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); snapshot(); eachSel((r, c) => setRaw(r, c, '')); renderAll(); return; }
  if (k === 'F2') { e.preventDefault(); startEdit(); return; }
  if (k.length === 1 && !e.altKey) { e.preventDefault(); startEdit(k); }
});

// ================= Sao chép / dán =================
let clip = null;
function copySel(cut) {
  const n = norm(sel); const data = [];
  for (let r = n.r1; r <= n.r2; r++) { const row = []; for (let c = n.c1; c <= n.c2; c++) { const o = cell(r, c); row.push(o ? { raw: o.raw, s: { ...o.s } } : { raw: '', s: {} }); } data.push(row); }
  clip = { ...n, data, cut };
  const tsv = data.map((row, i) => row.map((x, j) => fmt(getVal(n.r1 + i, n.c1 + j), x.s)).join('\t')).join('\n');
  navigator.clipboard && navigator.clipboard.writeText(tsv).catch(() => {});
  clip.tsv = tsv;
  toast('Select destination and press ENTER or choose Paste', 'info', 1600);
}
async function paste() {
  let sys = null; try { sys = await navigator.clipboard.readText(); } catch {}
  snapshot();
  if (clip && (!sys || sys === clip.tsv)) {
    const dr = act.r - clip.r1, dc = act.c - clip.c1;
    if (clip.cut) for (let r = clip.r1; r <= clip.r2; r++) for (let c = clip.c1; c <= clip.c2; c++) { delete S.cells[addr(r, c)]; }
    clip.data.forEach((row, i) => row.forEach((x, j) => {
      const r = act.r + i, c = act.c + j; if (r >= ROWS || c >= COLS) return;
      setRaw(r, c, x.raw[0] === '=' && !clip.cut ? XL.shift(x.raw, dr, dc) : x.raw); const o = S.cells[addr(r, c)]; if (o) o.s = { ...x.s }; else if (Object.keys(x.s).length) S.cells[addr(r, c)] = { raw: '', s: { ...x.s } };
    }));
    select(act.r, act.c, act.r + clip.data.length - 1, act.c + clip.data[0].length - 1);
    if (clip.cut) clip = null;
  } else if (sys) {
    sys.replace(/\r/g, '').replace(/\n$/, '').split('\n').forEach((line, i) => line.split('\t').forEach((v, j) => { if (act.r + i < ROWS && act.c + j < COLS) setRaw(act.r + i, act.c + j, v); }));
  }
  renderAll();
}

// ================= Định dạng =================
function toggleStyle(k) { const on = !((cell(act.r, act.c) || { s: {} }).s[k]); snapshot(); eachSel((r, c) => setStyle(r, c, { [k]: on || undefined })); renderAll(); }
$$('[data-st]').forEach((b) => b.addEventListener('click', () => toggleStyle(b.dataset.st)));
$$('[data-al]').forEach((b) => b.addEventListener('click', () => { const v = b.dataset.al; const cur = (cell(act.r, act.c) || { s: {} }).s.al; snapshot(); eachSel((r, c) => setStyle(r, c, { al: cur === v ? undefined : v })); renderAll(); }));
$('#fontName').addEventListener('change', (e) => { snapshot(); eachSel((r, c) => setStyle(r, c, { font: e.target.value === 'Calibri' ? undefined : e.target.value })); renderAll(); });
$('#fontSize').addEventListener('change', (e) => { snapshot(); eachSel((r, c) => setStyle(r, c, { size: +e.target.value === 11 ? undefined : +e.target.value })); renderAll(); });
let curFill = '#ffff00', curColor = '#c00000';
$('#btnFill').addEventListener('click', (e) => {
  const rr = $('#btnFill').getBoundingClientRect();
  if (e.clientX < rr.left + 28) { snapshot(); eachSel((r, c) => setStyle(r, c, { fill: curFill })); renderAll(); return; }
  colorPicker($('#btnFill'), (c0) => { const v = c0 === 'none' ? undefined : c0; if (v) { curFill = v; $('#fillBar').style.background = v; } snapshot(); eachSel((r, c) => setStyle(r, c, { fill: v })); renderAll(); }, { none: true });
});
$('#btnColor').addEventListener('click', (e) => {
  const rr = $('#btnColor').getBoundingClientRect();
  if (e.clientX < rr.left + 24) { snapshot(); eachSel((r, c) => setStyle(r, c, { color: curColor })); renderAll(); return; }
  colorPicker($('#btnColor'), (c0) => { curColor = c0; $('#colorBar').style.background = c0; snapshot(); eachSel((r, c) => setStyle(r, c, { color: c0 === '#000000' ? undefined : c0 })); renderAll(); });
});
$('#btnBorder').addEventListener('click', () => dropdown($('#btnBorder'), `<div class="hd">Borders</div><div class="it" data-v="bottom">▁ Bottom Border</div><div class="it" data-v="none">⬚ No Border</div><div class="it" data-v="all">⊞ All Borders</div><div class="it" data-v="out">□ Outside Borders</div><div class="it" data-v="thickb">▬ Thick Bottom Border</div>`, (v) => {
  const n = norm(sel); snapshot();
  eachSel((r, c) => {
    if (v === 'all') setStyle(r, c, { bt: 1, bb: 1, bl: 1, br: 1 });
    if (v === 'none') setStyle(r, c, { bt: undefined, bb: undefined, bl: undefined, br: undefined });
    if (v === 'out') setStyle(r, c, { bt: r === n.r1 ? 1 : undefined, bb: r === n.r2 ? 1 : undefined, bl: c === n.c1 ? 1 : undefined, br: c === n.c2 ? 1 : undefined });
    if (v === 'bottom' && r === n.r2) setStyle(r, c, { bb: 1 });
    if (v === 'thickb' && r === n.r2) setStyle(r, c, { bb: 2 });
  });
  renderAll();
}));
$('#btnMerge').addEventListener('click', () => dropdown($('#btnMerge'), `<div class="it" data-v="mc">Merge &amp; Center</div><div class="it" data-v="m">Merge Cells</div><div class="it" data-v="un">Unmerge Cells</div>`, (v) => {
  const n = norm(sel); snapshot();
  S.merges = S.merges.filter((m) => m.r2 < n.r1 || m.r1 > n.r2 || m.c2 < n.c1 || m.c1 > n.c2);
  if (v !== 'un') {
    if (n.r1 === n.r2 && n.c1 === n.c2) return toast('Select two or more cells to merge.', 'warn');
    let lost = false; eachSel((r, c) => { if ((r !== n.r1 || c !== n.c1) && cell(r, c) && cell(r, c).raw) lost = true; });
    if (lost) toast('Merging cells only keeps the upper-left value and discards other values.', 'warn');
    eachSel((r, c) => { if (r !== n.r1 || c !== n.c1) setRaw(r, c, ''); });
    S.merges.push({ ...n });
    if (v === 'mc') setStyle(n.r1, n.c1, { al: 'center' });
  }
  select(n.r1, n.c1, n.r2, n.c2); renderAll();
}));
$('#numFmt').addEventListener('change', (e) => { snapshot(); eachSel((r, c) => setStyle(r, c, { fmt: e.target.value === 'general' ? undefined : e.target.value, dec: undefined })); renderAll(); });
$$('[data-nf]').forEach((b) => b.addEventListener('click', () => { snapshot(); eachSel((r, c) => setStyle(r, c, { fmt: b.dataset.nf, dec: undefined })); renderAll(); }));
function changeDec(d) {
  snapshot();
  eachSel((r, c) => {
    const o = cell(r, c) || { s: {} }; const v = getVal(r, c);
    const shown = (td(r, c).textContent.split('.')[1] || '').replace(/\D/g, '').length;
    const curDec = o.s.dec ?? ({ number: 2, int: 2, currency: 2, accounting: 2, percent: 0 }[o.s.fmt] ?? (typeof v === 'number' ? shown : 0));
    setStyle(r, c, { dec: Math.max(0, Math.min(10, curDec + d)), fmt: o.s.fmt || 'number' });
  });
  renderAll();
}
$('#decInc').addEventListener('click', () => changeDec(1));
$('#decDec').addEventListener('click', () => changeDec(-1));

// sao chép định dạng
let painter = null;
$('#btnPainter').addEventListener('click', () => { painter = { ...((cell(act.r, act.c) || { s: {} }).s) }; $('#btnPainter').classList.add('on'); toast('Click a cell to apply the formatting.', 'info'); });
function applyPainter(r, c) { snapshot(); setStyle(r, c, {}); S.cells[addr(r, c)].s = { ...painter }; painter = null; $('#btnPainter').classList.remove('on'); select(r, c); renderAll(); }

// định dạng có điều kiện
const CF_STYLES = { red: ['#ffc7ce', '#9c0006', 'Light Red Fill with Dark Red Text'], yellow: ['#ffeb9c', '#9c5700', 'Yellow Fill with Dark Yellow Text'], green: ['#c6efce', '#006100', 'Green Fill with Dark Green Text'] };
$('#btnCond').addEventListener('click', () => dropdown($('#btnCond'), `<div class="hd">Highlight Cells Rules</div><div class="it" data-v="gt">Greater Than...</div><div class="it" data-v="lt">Less Than...</div><div class="it" data-v="between">Between...</div><div class="it" data-v="eq">Equal To...</div><div class="it" data-v="text">Text that Contains...</div><div class="sep"></div><div class="hd">Clear Rules</div><div class="it" data-v="clear">Clear Rules from Selected Cells</div><div class="it" data-v="clearall">Clear Rules from Entire Sheet</div>`, async (v) => {
  const n = norm(sel);
  if (v === 'clear') { snapshot(); S.cond = S.cond.filter((k) => k.r2 < n.r1 || k.r1 > n.r2 || k.c2 < n.c1 || k.c1 > n.c2); renderAll(); return; }
  if (v === 'clearall') { snapshot(); S.cond = []; renderAll(); return; }
  const lbl = { gt: 'Format cells that are GREATER THAN:', lt: 'Format cells that are LESS THAN:', between: 'Format cells that are BETWEEN:', eq: 'Format cells that are EQUAL TO:', text: 'Format cells that contain the text:' }[v];
  const r = await modal(`<h3>${lbl}</h3><input class="rs" style="width:${v === 'between' ? '45%' : '100%'};height:30px">${v === 'between' ? ' and <input class="rs" style="width:45%;height:30px">' : ''}<p>with</p><select class="rs" style="width:100%;height:30px">${Object.entries(CF_STYLES).map(([k, x]) => `<option value="${k}">${x[2]}</option>`).join('')}</select>`, [['Cancel'], ['OK', 'primary']]);
  if (r.i !== 1) return;
  const vv = r.v; const st = CF_STYLES[vv[vv.length - 1]];
  const v1 = v === 'text' ? vv[0] : isNaN(Number(vv[0])) ? vv[0] : Number(vv[0]);
  snapshot(); S.cond.push({ ...n, op: v, v1, v2: v === 'between' ? Number(vv[1]) : undefined, fill: st[0], color: st[1] }); renderAll();
}));

// ================= Chèn / xoá hàng cột =================
function remapAll(fn) {
  const nc = {};
  Object.entries(S.cells).forEach(([a, o]) => { const p = parseAddr(a); const q = fn({ r: p.r, c: p.c }); if (q && q.r < ROWS && q.c < COLS) nc[addr(q.r, q.c)] = { raw: o.raw[0] === '=' ? XL.mapRefs(o.raw, (x) => fn(x)) : o.raw, s: o.s }; });
  S.cells = nc;
  const mr = (m) => { const a = fn({ r: m.r1, c: m.c1 }), b = fn({ r: m.r2, c: m.c2 }); return a && b ? { ...m, r1: a.r, c1: a.c, r2: b.r, c2: b.c } : null; };
  S.merges = S.merges.map(mr).filter(Boolean); S.cond = S.cond.map(mr).filter(Boolean);
}
$('#btnInsertCells').addEventListener('click', () => dropdown($('#btnInsertCells'), '<div class="it" data-v="row">Insert Sheet Rows</div><div class="it" data-v="col">Insert Sheet Columns</div>', (v) => {
  snapshot(); const n = norm(sel);
  if (v === 'row') { const k = n.r2 - n.r1 + 1; remapAll((p) => ({ r: p.r >= n.r1 ? p.r + k : p.r, c: p.c })); }
  else { const k = n.c2 - n.c1 + 1; remapAll((p) => ({ r: p.r, c: p.c >= n.c1 ? p.c + k : p.c })); S.colW.splice(n.c1, 0, ...Array(k).fill(DEFW)); S.colW.length = COLS; }
  renderAll();
}));
$('#btnDeleteCells').addEventListener('click', () => dropdown($('#btnDeleteCells'), '<div class="it" data-v="row">Delete Sheet Rows</div><div class="it" data-v="col">Delete Sheet Columns</div>', (v) => {
  snapshot(); const n = norm(sel);
  if (v === 'row') { const k = n.r2 - n.r1 + 1; remapAll((p) => (p.r >= n.r1 && p.r <= n.r2 ? null : { r: p.r > n.r2 ? p.r - k : p.r, c: p.c })); }
  else { const k = n.c2 - n.c1 + 1; remapAll((p) => (p.c >= n.c1 && p.c <= n.c2 ? null : { r: p.r, c: p.c > n.c2 ? p.c - k : p.c })); S.colW.splice(n.c1, k); while (S.colW.length < COLS) S.colW.push(DEFW); }
  renderAll();
}));
$('#btnFormatCells').addEventListener('click', () => dropdown($('#btnFormatCells'), '<div class="hd">Cell Size</div><div class="it" data-v="w">Column Width...</div><div class="it" data-v="auto">AutoFit Column Width</div>', async (v) => {
  const n = norm(sel);
  if (v === 'w') { const r = await modal(`<h3>Column Width</h3><p>Column width (pixels):</p><input class="rs" type="number" value="${S.colW[act.c]}" style="width:100%;height:30px">`, [['Cancel'], ['OK', 'primary']]); if (r.i !== 1) return; snapshot(); for (let c = n.c1; c <= n.c2; c++) S.colW[c] = Math.max(20, +r.v[0]); }
  else { snapshot(); const cv = document.createElement('canvas').getContext('2d'); cv.font = '15px Calibri, Carlito, Arial'; for (let c = n.c1; c <= n.c2; c++) { let w = 40; for (let r = 0; r < ROWS; r++) { if (mergeAt(r, c)) continue; const t = td(r, c).textContent; if (t) w = Math.max(w, cv.measureText(t).width + 14); } S.colW[c] = Math.ceil(w); } }
  renderAll();
}));

// ================= Chỉnh sửa: AutoSum, xoá, sắp xếp =================
function autoRange() {
  let r = act.r - 1; while (r >= 0 && typeof getVal(r, act.c) === 'number') r--;
  if (r < act.r - 1) return `${addr(r + 1, act.c)}:${addr(act.r - 1, act.c)}`;
  let c = act.c - 1; while (c >= 0 && typeof getVal(act.r, c) === 'number') c--;
  if (c < act.c - 1) return `${addr(act.r, c + 1)}:${addr(act.r, act.c - 1)}`;
  return '';
}
function insertFunc(name) {
  const n = norm(sel); let rng = '';
  if (n.r1 !== n.r2 || n.c1 !== n.c2) { rng = `${addr(n.r1, n.c1)}:${addr(n.r2, n.c2)}`; act = { r: n.r2 + 1, c: n.c1 }; sel = { r1: act.r, c1: act.c, r2: act.r, c2: act.c }; drawSel(); }
  else if (['SUM', 'AVERAGE', 'MAX', 'MIN', 'COUNT'].includes(name)) rng = autoRange();
  startEdit(`=${name}(${rng}`);
  if (!rng) refInsert = null;
}
$('#btnAutoSum').addEventListener('click', (e) => {
  const rr = $('#btnAutoSum').getBoundingClientRect();
  if (e.clientX < rr.right - 16) { insertFunc('SUM'); return; }
  dropdown($('#btnAutoSum'), '<div class="it" data-v="SUM">Σ Sum</div><div class="it" data-v="AVERAGE">Average</div><div class="it" data-v="COUNT">Count Numbers</div><div class="it" data-v="MAX">Max</div><div class="it" data-v="MIN">Min</div><div class="sep"></div><div class="it" data-v="more">More Functions...</div>', (v) => (v === 'more' ? funcDialog() : insertFunc(v)));
});
$$('[data-fn]').forEach((b) => b.addEventListener('click', () => insertFunc(b.dataset.fn)));
const FDESC = {
  SUM: ['SUM(number1,[number2],...)', 'Adds all the numbers in a range of cells.'], AVERAGE: ['AVERAGE(number1,[number2],...)', 'Returns the average (arithmetic mean) of its arguments.'], MAX: ['MAX(number1,[number2],...)', 'Returns the largest value in a set of values.'], MIN: ['MIN(number1,[number2],...)', 'Returns the smallest number in a set of values.'],
  COUNT: ['COUNT(value1,[value2],...)', 'Counts the number of cells in a range that contain numbers.'], COUNTA: ['COUNTA(value1,[value2],...)', 'Counts the number of cells in a range that are not empty.'], COUNTIF: ['COUNTIF(range,criteria)', 'Counts the number of cells within a range that meet the given condition.'],
  SUMIF: ['SUMIF(range,criteria,[sum_range])', 'Adds the cells specified by a given condition or criteria.'], AVERAGEIF: ['AVERAGEIF(range,criteria,[average_range])', 'Finds the average for the cells specified by a given condition.'],
  IF: ['IF(logical_test,[value_if_true],[value_if_false])', 'Checks whether a condition is met, and returns one value if TRUE, and another value if FALSE.'], AND: ['AND(logical1,[logical2],...)', 'Checks whether all arguments are TRUE.'], OR: ['OR(logical1,[logical2],...)', 'Checks whether any of the arguments are TRUE.'],
  VLOOKUP: ['VLOOKUP(lookup_value,table_array,col_index_num,[range_lookup])', 'Looks for a value in the leftmost column of a table, and then returns a value in the same row from a column you specify.'], ROUND: ['ROUND(number,num_digits)', 'Rounds a number to a specified number of digits.'],
  RANK: ['RANK(number,ref,[order])', 'Returns the rank of a number in a list of numbers.'], LEFT: ['LEFT(text,[num_chars])', 'Returns the specified number of characters from the start of a text string.'], RIGHT: ['RIGHT(text,[num_chars])', 'Returns the specified number of characters from the end of a text string.'], MID: ['MID(text,start_num,num_chars)', 'Returns the characters from the middle of a text string.'],
  LEN: ['LEN(text)', 'Returns the number of characters in a text string.'], UPPER: ['UPPER(text)', 'Converts a text string to all uppercase letters.'], TODAY: ['TODAY()', 'Returns the current date.'], IFERROR: ['IFERROR(value,value_if_error)', 'Returns value_if_error if expression is an error and the value of the expression itself otherwise.'],
};
async function funcDialog() {
  let pick = 'SUM';
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal" style="width:520px"><h3>Insert Function</h3><p style="margin:0 0 6px">Select a function:</p><div class="fnlist">${XL.FUNC_LIST.map((f) => `<div data-f="${f}">${f}</div>`).join('')}</div><p id="fsig" style="font-family:Consolas,monospace;font-weight:600"></p><p id="fdesc" style="color:#605e5c"></p><div class="actions"><button class="btn">Cancel</button><button class="btn primary">OK</button></div></div>`;
  document.body.appendChild(bg);
  const show = (f) => { pick = f; $$('.fnlist div', bg).forEach((d) => d.classList.toggle('on', d.dataset.f === f)); const d = FDESC[f] || [f + '(...)', '']; $('#fsig', bg).textContent = d[0]; $('#fdesc', bg).textContent = d[1]; };
  show('SUM');
  $('.fnlist', bg).onclick = (e) => e.target.dataset.f && show(e.target.dataset.f);
  $('.fnlist', bg).ondblclick = () => { bg.remove(); insertFunc(pick); };
  const [cancel, ok] = $$('.actions button', bg); cancel.onclick = () => bg.remove(); ok.onclick = () => { bg.remove(); insertFunc(pick); };
}
$('#btnInsFunc').addEventListener('click', funcDialog); $('#btnInsFunc2').addEventListener('click', funcDialog);
$('#btnClear').addEventListener('click', () => dropdown($('#btnClear'), '<div class="it" data-v="all">Clear All</div><div class="it" data-v="fmt">Clear Formats</div><div class="it" data-v="val">Clear Contents</div>', (v) => {
  snapshot(); eachSel((r, c) => { const o = cell(r, c); if (!o) return; if (v === 'all') delete S.cells[addr(r, c)]; if (v === 'fmt') o.s = {}; if (v === 'val') setRaw(r, c, ''); }); renderAll();
}));
function dataRegion() {
  const n = norm(sel);
  if (n.r1 !== n.r2 || n.c1 !== n.c2) return n;
  // tự mở rộng vùng dữ liệu liền kề
  let { r: r1, c: c1 } = act, r2 = r1, c2 = c1;
  const filled = (r, c) => r >= 0 && c >= 0 && r < ROWS && c < COLS && getVal(r, c) !== '';
  let grow = true;
  while (grow) {
    grow = false;
    if ([...Array(c2 - c1 + 1)].some((_, i) => filled(r1 - 1, c1 + i))) { r1--; grow = true; }
    if ([...Array(c2 - c1 + 1)].some((_, i) => filled(r2 + 1, c1 + i))) { r2++; grow = true; }
    if ([...Array(r2 - r1 + 1)].some((_, i) => filled(r1 + i, c1 - 1))) { c1--; grow = true; }
    if ([...Array(r2 - r1 + 1)].some((_, i) => filled(r1 + i, c2 + 1))) { c2++; grow = true; }
  }
  // bỏ hàng tiêu đề bảng nếu là ô gộp tiêu đề
  while (S.merges.some((m) => m.r1 === r1 && m.r2 === r1 && m.c1 <= c1 && m.c2 >= c2 - 0) && r1 < r2) r1++;
  return { r1, c1, r2, c2 };
}
function sortRange(n, col, desc, header) {
  const start = header ? n.r1 + 1 : n.r1;
  if (start > n.r2) return;
  snapshot();
  const rows = [];
  for (let r = start; r <= n.r2; r++) { const row = []; for (let c = n.c1; c <= n.c2; c++) { const o = cell(r, c); row.push(o ? { raw: o.raw, s: { ...o.s } } : null); } rows.push({ r, row, key: getVal(r, col) }); }
  rows.sort((a, b) => {
    const x = a.key, y = b.key;
    if (x === '' && y !== '') return 1; if (y === '' && x !== '') return -1;
    let d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'vi');
    return desc ? -d : d;
  });
  rows.forEach((it, i) => {
    const r = start + i;
    it.row.forEach((o, j) => { const a = addr(r, n.c1 + j); if (!o) delete S.cells[a]; else S.cells[a] = { raw: o.raw[0] === '=' ? XL.shift(o.raw, r - it.r, 0) : o.raw, s: o.s }; });
  });
  renderAll();
}
const looksHeader = (n) => { let t = 0; for (let c = n.c1; c <= n.c2; c++) if (typeof getVal(n.r1, c) === 'string' && getVal(n.r1, c) !== '') t++; let nb = 0; for (let c = n.c1; c <= n.c2; c++) if (typeof getVal(n.r1 + 1, c) === 'number') nb++; return t === n.c2 - n.c1 + 1 && nb > 0 || (t === n.c2 - n.c1 + 1 && (cell(n.r1, n.c1) || { s: {} }).s.b); };
function quickSort(desc) { const n = dataRegion(); const col = clamp(act.c, n.c1, n.c2); sortRange(n, col, desc, looksHeader(n)); select(n.r1, n.c1, n.r2, n.c2, act); }
$('#btnSort').addEventListener('click', () => dropdown($('#btnSort'), '<div class="it" data-v="asc"><span data-i="sortasc"></span> Sort A to Z</div><div class="it" data-v="desc"><span data-i="sortdesc"></span> Sort Z to A</div><div class="it" data-v="dlg"><span data-i="sortcustom"></span> Custom Sort...</div>', (v) => (v === 'dlg' ? sortDialog() : quickSort(v === 'desc'))));
$$('[data-sort]').forEach((b) => b.addEventListener('click', () => quickSort(b.dataset.sort === 'desc')));
async function sortDialog() {
  const n = dataRegion(); const hdr = looksHeader(n);
  const opts = []; for (let c = n.c1; c <= n.c2; c++) opts.push(`<option value="${c}" ${c === act.c ? 'selected' : ''}>${hdr ? escapeHtml(String(getVal(n.r1, c))) + ' (Column ' + colName(c) + ')' : 'Column ' + colName(c)}</option>`);
  const r = await modal(`<h3>Sort ${addr(n.r1, n.c1)}:${addr(n.r2, n.c2)}</h3><p>Sort by: <select class="rs" style="height:28px">${opts.join('')}</select></p><p>Order: <select class="rs" style="height:28px"><option value="asc">Smallest to Largest / A to Z</option><option value="desc">Largest to Smallest / Z to A</option></select></p><p><label><input type="checkbox" ${hdr ? 'checked' : ''}> My data has headers</label></p>`, [['Cancel'], ['OK', 'primary']]);
  if (r.i !== 1) return;
  sortRange(n, +r.v[0], r.v[1] === 'desc', r.v[2] === true);
}
$('#btnSortDlg').addEventListener('click', sortDialog);

// ================= Bảng tạm, xem =================
$$('[data-act]').forEach((b) => b.addEventListener('click', () => { const a = b.dataset.act; if (a === 'copy') copySel(false); if (a === 'cut') copySel(true); if (a === 'paste') paste(); }));
$('#btnShowF').addEventListener('click', () => { showFormulas = !showFormulas; $('#btnShowF').classList.toggle('on', showFormulas); renderAll(); });
$('#zoom').addEventListener('input', (e) => { zoom = e.target.value / 100; inner.style.zoom = zoom; $('#zoomPct').textContent = e.target.value + '%'; });
$('#nameBox').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return; e.preventDefault();
  const v = e.target.value.toUpperCase().split(':'); const a = parseAddr(v[0]), b = v[1] ? parseAddr(v[1]) : a;
  if (a && b) { select(a.r, a.c, b.r, b.c); e.target.blur(); } else toast('Reference isn\'t valid.', 'err');
});
$('#qaUndo').onclick = undo; $('#qaRedo').onclick = redo; $('#qaSave').onclick = () => saveBook();

// ================= Biểu đồ =================
const CPAL = ['#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47', '#264478', '#9e480e', '#636363', '#997300'];
let selChart = null;
function chartData(ch) {
  const n = ch;
  const firstColText = [...Array(n.r2 - n.r1 + 1)].some((_, i) => typeof getVal(n.r1 + i, n.c1) === 'string' && getVal(n.r1 + i, n.c1) !== '');
  const firstRowText = [...Array(n.c2 - n.c1 + 1)].every((_, j) => j === 0 && firstColText || typeof getVal(n.r1, n.c1 + j) === 'string');
  const r0 = firstRowText ? n.r1 + 1 : n.r1, c0 = firstColText ? n.c1 + 1 : n.c1;
  const cats = []; for (let r = r0; r <= n.r2; r++) cats.push(firstColText ? String(fmt(getVal(r, n.c1))) : String(r - r0 + 1));
  const series = []; for (let c = c0; c <= n.c2; c++) { const vs = []; for (let r = r0; r <= n.r2; r++) { const v = getVal(r, c); vs.push(typeof v === 'number' ? v : 0); } series.push({ name: firstRowText ? String(getVal(n.r1, c)) : 'Series' + (c - c0 + 1), vs }); }
  return { cats, series };
}
function drawChart(ch, cv) {
  const dpr = devicePixelRatio || 1; const W = ch.w, H = ch.h;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, W, H);
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  const { cats, series } = chartData(ch);
  g.fillStyle = '#404040'; g.font = '600 15px Calibri, Carlito, Arial'; g.textAlign = 'center';
  const top = ch.title ? 36 : 14; if (ch.title) g.fillText(ch.title, W / 2, 24);
  g.font = '12px Calibri, Carlito, Arial';
  const legendH = ch.legend !== false ? 24 : 0;
  if (ch.type === 'pie') {
    const s = series[0] || { vs: [] }; const tot = s.vs.reduce((a, b) => a + Math.max(0, b), 0) || 1;
    const cx = W / 2, cy = top + (H - top - legendH) / 2, R = Math.max(10, Math.min(W, H - top - legendH) / 2 - 10);
    let a0 = -Math.PI / 2;
    s.vs.forEach((v, i) => {
      const a1 = a0 + (Math.max(0, v) / tot) * Math.PI * 2;
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath(); g.fillStyle = CPAL[i % CPAL.length]; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      if (ch.labels) { const am = (a0 + a1) / 2; g.fillStyle = '#fff'; g.font = '600 12px Calibri, Arial'; g.fillText(Math.round(v / tot * 100) + '%', cx + Math.cos(am) * R * 0.65, cy + Math.sin(am) * R * 0.65 + 4); }
      a0 = a1;
    });
    if (legendH) legend(g, cats.map((c, i) => [c, CPAL[i % CPAL.length]]), W, H);
    return;
  }
  const all = series.flatMap((s) => s.vs); let mx = Math.max(0, ...all), mn = Math.min(0, ...all); if (mx === mn) mx = mn + 1;
  const step = niceStep((mx - mn) / 5); mx = Math.ceil(mx / step) * step; mn = Math.floor(mn / step) * step;
  const L = ch.type === 'bar' ? 80 : 50, R = W - 14, T = top + 4, B = H - legendH - 26;
  g.strokeStyle = '#d9d9d9'; g.lineWidth = 1; g.fillStyle = '#595959'; g.textAlign = ch.type === 'bar' ? 'center' : 'right';
  for (let v = mn; v <= mx + 1e-9; v += step) {
    if (ch.type === 'bar') { const x = L + (v - mn) / (mx - mn) * (R - L); g.beginPath(); g.moveTo(x, T); g.lineTo(x, B); g.stroke(); g.fillText(shortNum(v), x, B + 14); }
    else { const y = B - (v - mn) / (mx - mn) * (B - T); g.beginPath(); g.moveTo(L, y); g.lineTo(R, y); g.stroke(); g.fillText(shortNum(v), L - 6, y + 4); }
  }
  const nC = cats.length || 1, nS = series.length || 1;
  if (ch.type === 'bar') {
    const bandH = (B - T) / nC; g.textAlign = 'right';
    cats.forEach((cname, i) => {
      g.fillStyle = '#595959'; g.fillText(cname.slice(0, 12), L - 6, T + bandH * (i + 0.5) + 4);
      series.forEach((s, j) => { const bh = bandH * 0.7 / nS; const y = T + bandH * i + bandH * 0.15 + j * bh; const x0 = L + (0 - mn) / (mx - mn) * (R - L), x1 = L + (s.vs[i] - mn) / (mx - mn) * (R - L); g.fillStyle = CPAL[j % CPAL.length]; g.fillRect(Math.min(x0, x1), y, Math.abs(x1 - x0), bh - 1); if (ch.labels) { g.fillStyle = '#404040'; g.textAlign = 'left'; g.fillText(shortNum(s.vs[i]), x1 + 3, y + bh / 2 + 4); g.textAlign = 'right'; } });
    });
  } else {
    const bandW = (R - L) / nC; g.textAlign = 'center';
    cats.forEach((cname, i) => { g.fillStyle = '#595959'; g.fillText(cname.length > 10 ? cname.slice(0, 9) + '…' : cname, L + bandW * (i + 0.5), B + 16); });
    const y0 = B - (0 - mn) / (mx - mn) * (B - T);
    series.forEach((s, j) => {
      g.fillStyle = g.strokeStyle = CPAL[j % CPAL.length];
      if (ch.type === 'column') s.vs.forEach((v, i) => { const bw = bandW * 0.7 / nS; const x = L + bandW * i + bandW * 0.15 + j * bw; const y = B - (v - mn) / (mx - mn) * (B - T); g.fillStyle = CPAL[j % CPAL.length]; g.fillRect(x, Math.min(y, y0), bw - 1, Math.abs(y0 - y)); if (ch.labels) { g.fillStyle = '#404040'; g.fillText(shortNum(v), x + bw / 2, Math.min(y, y0) - 4); } });
      else { g.lineWidth = 2.5; g.beginPath(); s.vs.forEach((v, i) => { const x = L + bandW * (i + 0.5), y = B - (v - mn) / (mx - mn) * (B - T); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); s.vs.forEach((v, i) => { const x = L + bandW * (i + 0.5), y = B - (v - mn) / (mx - mn) * (B - T); g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); if (ch.labels) { g.fillStyle = '#404040'; g.fillText(shortNum(v), x, y - 8); g.fillStyle = CPAL[j % CPAL.length]; } }); }
    });
  }
  g.strokeStyle = '#bfbfbf'; g.beginPath(); if (ch.type === 'bar') { g.moveTo(L, T); g.lineTo(L, B); } else { g.moveTo(L, B - (0 - mn) / (mx - mn) * (B - T)); g.lineTo(R, B - (0 - mn) / (mx - mn) * (B - T)); } g.stroke();
  if (legendH) legend(g, series.map((s, j) => [s.name, CPAL[j % CPAL.length]]), W, H);
}
function legend(g, items, W, H) {
  g.font = '12px Calibri, Carlito, Arial'; g.textAlign = 'left';
  const widths = items.map(([t]) => g.measureText(t).width + 26); const tot = widths.reduce((a, b) => a + b, 0);
  let x = Math.max(6, (W - tot) / 2); const y = H - 12;
  items.forEach(([t, c], i) => { g.fillStyle = c; g.fillRect(x, y - 8, 10, 10); g.fillStyle = '#595959'; g.fillText(t, x + 14, y + 1); x += widths[i]; });
}
const niceStep = (x) => { const p = Math.pow(10, Math.floor(Math.log10(x || 1))); const f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };
const shortNum = (v) => (Math.abs(v) >= 1e6 ? +(v / 1e6).toFixed(1) + 'Tr' : Math.abs(v) >= 1e4 ? +(v / 1e3).toFixed(1) + 'N' : String(+v.toFixed(2)));
function renderCharts() {
  const box = $('#charts'); box.innerHTML = '';
  S.charts.forEach((ch, i) => {
    const d = document.createElement('div'); d.className = 'chart' + (selChart === i ? ' sel' : '');
    Object.assign(d.style, { left: ch.x + 'px', top: ch.y + 'px', width: ch.w + 'px', height: ch.h + 'px' });
    const cv = document.createElement('canvas'); d.appendChild(cv);
    const rs = document.createElement('div'); rs.className = 'rs'; d.appendChild(rs);
    box.appendChild(d); drawChart(ch, cv);
    d.addEventListener('mousedown', (e) => {
      e.stopPropagation(); if (editing) commitEdit();
      selChart = i; $$('#charts .chart').forEach((x, k) => x.classList.toggle('sel', k === i)); $('#tabChart').hidden = false; $('#tabChart').click();
      const resize = e.target === rs; const x0 = e.clientX, y0 = e.clientY, o = { ...ch }; let moved = false;
      const mv = (ev) => { const dx = (ev.clientX - x0) / zoom, dy = (ev.clientY - y0) / zoom; if (!moved) { snapshot(); moved = true; } if (resize) { ch.w = Math.max(200, o.w + dx); ch.h = Math.max(150, o.h + dy); d.style.width = ch.w + 'px'; d.style.height = ch.h + 'px'; drawChart(ch, cv); } else { ch.x = Math.max(0, o.x + dx); ch.y = Math.max(0, o.y + dy); d.style.left = ch.x + 'px'; d.style.top = ch.y + 'px'; } };
      const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
    });
    d.addEventListener('dblclick', () => $('#btnChartTitle').click());
  });
}
function deselectChart() { if (selChart === null) return; selChart = null; $$('#charts .chart').forEach((x) => x.classList.remove('sel')); if ($('#tabChart').classList.contains('on')) $('[data-tab=home]').click(); $('#tabChart').hidden = true; }
function deleteChart() { snapshot(); S.charts.splice(selChart, 1); selChart = null; $('#tabChart').hidden = true; $('[data-tab=home]').click(); renderCharts(); }
$$('[data-chart]').forEach((b) => b.addEventListener('click', () => {
  let n = norm(sel);
  if (n.r1 === n.r2 && n.c1 === n.c2) n = dataRegion();
  if (n.r1 === n.r2 && n.c1 === n.c2) return toast('Select the data you want to chart first.', 'warn');
  snapshot();
  const last = cellRect(n.r1, Math.min(COLS - 1, n.c2 + 1));
  const ch = { type: b.dataset.chart, ...n, x: last.x + 20, y: Math.max(4, last.y), w: 440, h: 280, title: 'Chart Title', legend: true, labels: false };
  S.charts.push(ch); selChart = S.charts.length - 1; renderCharts(); $('#tabChart').hidden = false; $('#tabChart').click();
}));
$('#btnChartTitle').addEventListener('click', async () => { if (selChart === null) return; const r = await modal(`<h3>Chart Title</h3><input class="rs" style="width:100%;height:30px" value="${escapeHtml(S.charts[selChart].title || '')}">`, [['Cancel'], ['OK', 'primary']]); if (r.i !== 1) return; snapshot(); S.charts[selChart].title = r.v[0]; renderCharts(); });
$('#btnChartLegend').addEventListener('click', () => { if (selChart === null) return; snapshot(); S.charts[selChart].legend = S.charts[selChart].legend === false; renderCharts(); });
$('#btnChartLabels').addEventListener('click', () => { if (selChart === null) return; snapshot(); S.charts[selChart].labels = !S.charts[selChart].labels; renderCharts(); });
$('#btnChartDel').addEventListener('click', () => selChart !== null && deleteChart());
wrap.addEventListener('mousedown', (e) => { if (e.target === wrap || e.target === inner) deselectChart(); });


// ================= Extra Home features =================
const FS_STEPS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];
function bumpFont(up) { const cur = (cell(act.r, act.c) || { s: {} }).s.size || 11; const nx = up ? FS_STEPS.find((x) => x > cur) || 72 : [...FS_STEPS].reverse().find((x) => x < cur) || 8; snapshot(); eachSel((r, c) => setStyle(r, c, { size: nx === 11 ? undefined : nx })); renderAll(); }
$('#fsUp').addEventListener('click', () => bumpFont(true)); $('#fsDown').addEventListener('click', () => bumpFont(false));
const CELL_STYLES = {
  Normal: { reset: true },
  Good: { fill: '#c6efce', color: '#006100' }, Bad: { fill: '#ffc7ce', color: '#9c0006' }, Neutral: { fill: '#ffeb9c', color: '#9c5700' },
  Title: { size: 18, color: '#44546a', b: 1 }, 'Heading 1': { size: 15, b: 1, color: '#44546a', bb: 2 }, 'Heading 2': { size: 13, b: 1, color: '#44546a', bb: 1 },
  Total: { b: 1, bt: 1, bb: 2 }, Note: { fill: '#ffffcc', bt: 1, bb: 1, bl: 1, br: 1 }, Accent1: { fill: '#4472c4', color: '#ffffff' },
};
$('#btnCellStyles').addEventListener('click', () => dropdown($('#btnCellStyles'), `<div class="hd">Good, Bad and Neutral</div><div style="display:flex;gap:4px;padding:4px">${['Normal', 'Good', 'Bad', 'Neutral'].map((k) => `<div class="it" data-v="${k}" style="border:1px solid #ddd;background:${CELL_STYLES[k].fill || '#fff'};color:${CELL_STYLES[k].color || '#000'}">${k}</div>`).join('')}</div><div class="hd">Titles and Headings</div><div style="display:flex;gap:4px;padding:4px">${['Title', 'Heading 1', 'Heading 2', 'Total'].map((k) => `<div class="it" data-v="${k}" style="border:1px solid #ddd;font-weight:700;color:${CELL_STYLES[k].color || '#000'}">${k}</div>`).join('')}</div><div class="hd">Data and Model</div><div style="display:flex;gap:4px;padding:4px">${['Note', 'Accent1'].map((k) => `<div class="it" data-v="${k}" style="border:1px solid #ddd;background:${CELL_STYLES[k].fill};color:${CELL_STYLES[k].color || '#000'}">${k}</div>`).join('')}</div>`, (k) => {
  snapshot(); const st = CELL_STYLES[k];
  eachSel((r, c) => { if (st.reset) { const o = cell(r, c); if (o) o.s = {}; } else setStyle(r, c, { ...st, cs: k }); });
  renderAll();
}));
const TABLE_STYLES = { blue: ['#4472c4', '#d9e1f2', 'Blue, Table Style Medium 2'], orange: ['#ed7d31', '#fce4d6', 'Orange, Table Style Medium 3'], gray: ['#7f7f7f', '#ededed', 'Gray, Table Style Medium 1'], gold: ['#ffc000', '#fff2cc', 'Gold, Table Style Medium 5'], green: ['#70ad47', '#e2efda', 'Green, Table Style Medium 7'] };
function formatAsTable(key) {
  let n = norm(sel); if (n.r1 === n.r2 && n.c1 === n.c2) n = dataRegion();
  if (n.r1 === n.r2) return toast('Select the range for your table first.', 'warn');
  const [dark, light] = TABLE_STYLES[key];
  snapshot();
  for (let r = n.r1; r <= n.r2; r++) for (let c = n.c1; c <= n.c2; c++) {
    if (r === n.r1) setStyle(r, c, { fill: dark, color: '#ffffff', b: 1, bt: 1, bb: 1 });
    else setStyle(r, c, { fill: (r - n.r1) % 2 ? light : undefined, bb: 1, color: undefined });
  }
  S.tables = (S.tables || []).filter((t) => t.r2 < n.r1 || t.r1 > n.r2 || t.c2 < n.c1 || t.c1 > n.c2);
  S.tables.push({ ...n, style: key, name: 'Table' + (S.tables.length + 1) });
  select(n.r1, n.c1, n.r2, n.c2); renderAll();
  toast(`Created ${S.tables[S.tables.length - 1].name} (${addr(n.r1, n.c1)}:${addr(n.r2, n.c2)}) with headers.`, 'ok');
}
$('#btnFmtTable').addEventListener('click', () => dropdown($('#btnFmtTable'), `<div class="hd">Medium</div>${Object.entries(TABLE_STYLES).map(([k, [d, l, name]]) => `<div class="it" data-v="${k}"><svg width="44" height="30"><rect width="44" height="7" fill="${d}"/><rect y="8" width="44" height="7" fill="${l}"/><rect y="16" width="44" height="7" fill="#fff" stroke="${l}"/><rect y="24" width="44" height="6" fill="${l}"/></svg> ${name}</div>`).join('')}`, formatAsTable));
$('#btnInsTable').addEventListener('click', () => formatAsTable('blue'));
$('#btnFind').addEventListener('click', () => dropdown($('#btnFind'), '<div class="it" data-v="find"><span data-i="find"></span> Find...</div><div class="it" data-v="goto">→ Go To...</div><div class="it" data-v="formulas">ƒx Formulas</div>', async (v) => {
  if (v === 'goto') { $('#nameBox').focus(); $('#nameBox').select(); return; }
  if (v === 'formulas') { const list = Object.keys(S.cells).filter((a) => S.cells[a].raw[0] === '='); if (!list.length) return toast('No cells were found.', 'warn'); const ps = list.map(parseAddr); select(ps[0].r, ps[0].c); toast(`${list.length} cells contain formulas: ${list.slice(0, 8).join(', ')}${list.length > 8 ? '…' : ''}`, 'info', 4000); return; }
  const r = await modal('<h3>Find and Replace</h3><p>Find what:</p><input class="rs" style="width:100%;height:28px">', [['Close'], ['Find Next', 'primary']]);
  if (r.i !== 1 || !r.v[0]) return; const q = r.v[0].toLowerCase();
  const start = act.r * COLS + act.c;
  for (let k = 1; k <= ROWS * COLS; k++) { const i = (start + k) % (ROWS * COLS); const rr = Math.floor(i / COLS), cc = i % COLS; const v2 = getVal(rr, cc); if (v2 !== '' && String(fmt(v2, (cell(rr, cc) || { s: {} }).s)).toLowerCase().includes(q)) { select(rr, cc); return; } }
  modal('<h3>Microsoft Excel</h3><p>We couldn\'t find what you were looking for.</p>', [['OK', 'primary']]);
}));
const FN_GROUPS = { fnLogical: ['IF', 'AND', 'OR', 'NOT', 'IFERROR'], fnText: ['CONCAT', 'LEFT', 'LEN', 'LOWER', 'MID', 'PROPER', 'RIGHT', 'TRIM', 'UPPER'], fnMath: ['ABS', 'INT', 'MOD', 'POWER', 'PRODUCT', 'ROUND', 'ROUNDDOWN', 'ROUNDUP', 'SQRT', 'SUM', 'SUMIF', 'SUMIFS'], fnLookup: ['HLOOKUP', 'INDEX', 'MATCH', 'VLOOKUP'], fnStat: ['AVERAGE', 'AVERAGEIF', 'COUNT', 'COUNTA', 'COUNTBLANK', 'COUNTIF', 'COUNTIFS', 'MAX', 'MIN', 'RANK'] };
Object.entries(FN_GROUPS).forEach(([id, fns]) => $('#' + id).addEventListener('click', () => dropdown($('#' + id), fns.map((f) => `<div class="it" data-v="${f}" title="${(FDESC[f] || [''])[0]}">${f}</div>`).join(''), insertFunc)));
$('#btnChartElem').addEventListener('click', () => { if (selChart === null) return; const ch = S.charts[selChart]; dropdown($('#btnChartElem'), `<div class="it" data-v="title">${ch.title ? '✓' : '&nbsp;&nbsp;'} Chart Title</div><div class="it" data-v="labels">${ch.labels ? '✓' : '&nbsp;&nbsp;'} Data Labels</div><div class="it" data-v="legend">${ch.legend !== false ? '✓' : '&nbsp;&nbsp;'} Legend</div>`, (v) => { snapshot(); if (v === 'title') ch.title = ch.title ? '' : 'Chart Title'; if (v === 'labels') ch.labels = !ch.labels; if (v === 'legend') ch.legend = ch.legend === false; renderCharts(); }); });
$('#btnChangeType').addEventListener('click', () => { if (selChart === null) return; dropdown($('#btnChangeType'), '<div class="it" data-v="column"><span data-i="colchart"></span> Clustered Column</div><div class="it" data-v="bar"><span data-i="barchart"></span> Clustered Bar</div><div class="it" data-v="line"><span data-i="linechart"></span> Line with Markers</div><div class="it" data-v="pie"><span data-i="piechart"></span> Pie</div>', (v) => { snapshot(); S.charts[selChart].type = v; renderCharts(); }); });
$('#chkGrid').addEventListener('change', (e) => document.body.classList.toggle('nogrid', !e.target.checked));
$('#chkHead').addEventListener('change', (e) => document.body.classList.toggle('noheads', !e.target.checked));
$('#chkFx').addEventListener('change', (e) => ($('#fxbar').style.display = e.target.checked ? '' : 'none'));
$('#btnZoom100').addEventListener('click', () => { zoom = 1; inner.style.zoom = 1; $('#zoom').value = 100; $('#zoomPct').textContent = '100%'; });
$('.fxsep .x').addEventListener('mousedown', (e) => { e.preventDefault(); if (editing) cancelEdit(); });
$('.fxsep .ok').addEventListener('mousedown', (e) => { e.preventDefault(); if (editing) commitEdit(); });
$('.fxsep i').addEventListener('click', () => funcDialog());

// ================= File & practice projects =================
let bookName = 'Book1';
function setBookName(n) { bookName = n; setDocTitle(n, 'Excel'); }
function loadBook(d) {
  S.cells = {}; S.merges = []; S.cond = []; S.charts = []; S.tables = []; S.colW = Array(COLS).fill(DEFW);
  if (d) {
    if (d.cells) Object.entries(d.cells).forEach(([a, v]) => { S.cells[a] = typeof v === 'object' ? { raw: v.raw ?? '', s: { ...(v.s || {}) } } : { raw: String(v), s: {} }; });
    if (d.styles) Object.entries(d.styles).forEach(([rng, st]) => { const [a, b] = rng.split(':').map(parseAddr); for (let r = a.r; r <= (b || a).r; r++) for (let c = a.c; c <= (b || a).c; c++) setStyle(r, c, st); });
    if (d.merges) S.merges = d.merges.map((m) => (typeof m === 'string' ? (([a, b]) => ({ r1: a.r, c1: a.c, r2: b.r, c2: b.c }))(m.split(':').map(parseAddr)) : m));
    if (d.cond) S.cond = d.cond; if (d.charts) S.charts = d.charts;
    if (Array.isArray(d.colW)) S.colW = d.colW.slice(); else if (d.colW) Object.entries(d.colW).forEach(([c, w]) => S.colW[XL.colIndex(c)] = w);
  }
  undoStack.length = 0; redoStack.length = 0; selChart = null; $('#tabChart').hidden = true;
  buildGrid(); renderAll(); select(0, 0);
}
const saveBook = () => saveJSON(bookName, 'thx', S);
function exportCSV() {
  let maxR = 0, maxC = 0; Object.keys(S.cells).forEach((a) => { const p = parseAddr(a); if (S.cells[a].raw !== '') { maxR = Math.max(maxR, p.r); maxC = Math.max(maxC, p.c); } });
  const q = (s) => (/[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);
  const lines = []; for (let r = 0; r <= maxR; r++) { const row = []; for (let c = 0; c <= maxC; c++) { const v = getVal(r, c); row.push(q(XL.isErr(v) ? v.code : typeof v === 'number' ? String(v) : String(v))); } lines.push(row.join(',')); }
  exportText(bookName, 'csv', 'CSV (Comma delimited)', '﻿' + lines.join('\r\n'));
}
const runner = new TaskRunner({ app: 'excel', exercises: EXCEL_EXERCISES(), load: (ex) => { loadBook(ex ? ex.start : null); setBookName(ex ? ex.title : 'Book1'); }, api: null });
function fileMenu(start = 0) {
  backstage([
    { label: 'Practice', render: (b, close) => runner.renderPicker(b, close) },
    { label: 'New', action: () => runner.free() },
    { label: 'Open', action: async () => { const d = await openJSON('thx'); if (d) { runner.free(); loadBook(d); } } },
    { label: 'Save', action: saveBook },
    { label: 'Export (.csv)', action: exportCSV },
  ], start);
}
runner.onList = () => fileMenu(0);
initRibbon(() => fileMenu(1));
$('#btnEx').onclick = () => fileMenu(0);
$('#ribbon').addEventListener('mousedown', () => { if (editing && !inFormulaRefMode()) commitEdit(); });

// ================= API chấm điểm =================
const api = {
  S,
  val: (a) => { const p = parseAddr(a); return getVal(p.r, p.c); },
  raw: (a) => (S.cells[a.toUpperCase()] || { raw: '' }).raw,
  formula: (a) => api.raw(a).replace(/\s+/g, '').toUpperCase(),
  isF: (a) => api.raw(a).startsWith('='),
  style: (a) => (S.cells[a.toUpperCase()] || { s: {} }).s,
  range(rng) { const [a, b] = rng.toUpperCase().split(':').map(parseAddr); const out = []; for (let r = a.r; r <= (b || a).r; r++) for (let c = a.c; c <= (b || a).c; c++) out.push(addr(r, c)); return out; },
  merged: (rng) => { const [a, b] = rng.toUpperCase().split(':').map(parseAddr); return S.merges.some((m) => m.r1 === a.r && m.c1 === a.c && m.r2 === b.r && m.c2 === b.c); },
  near: (x, y, eps = 0.01) => typeof x === 'number' && Math.abs(x - y) <= eps,
  colW: (c) => S.colW[XL.colIndex(c)],
};
runner.api = api;
window.__xl = { api, runner, select, startEdit, commitEdit, setRaw: (a, v) => { const p = parseAddr(a); setRaw(p.r, p.c, v); renderAll(); }, S };

buildGrid(); renderAll(); select(0, 0);
setTimeout(() => fileMenu(0), 50);
