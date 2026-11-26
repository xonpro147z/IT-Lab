// Excel – extended features: multiple worksheets (rename, tab color, move/copy, hide), Protect Sheet / Workbook,
// macros (record, run, VBA view, .xlsm), Review & Developer tabs and the full File backstage
const XP = (() => {
  const BK = { sheets: [], active: 0, wbProt: null, macros: [], macrosBlocked: false };
  const FLAGS = {};
  let loading = false;
  const blank = () => ({ cells: {}, merges: [], cond: [], charts: [], tables: [], colW: Array(COLS).fill(DEFW) });
  const sheetData = () => JSON.parse(JSON.stringify({ cells: S.cells, merges: S.merges, cond: S.cond, charts: S.charts, tables: S.tables || [], colW: S.colW }));
  const cur = () => BK.sheets[BK.active];
  function putSheetData(d) {
    loading = true;
    d = d || blank();
    S.cells = JSON.parse(JSON.stringify(d.cells || {})); S.merges = d.merges || []; S.cond = d.cond || []; S.charts = d.charts || []; S.tables = d.tables || []; S.colW = (d.colW || Array(COLS).fill(DEFW)).slice();
    undoStack.length = 0; redoStack.length = 0; selChart = null; $('#tabChart').hidden = true;
    buildGrid(); renderAll(); select(0, 0);
    loading = false;
  }
  function saveCur() { if (cur()) cur().data = sheetData(); }
  function switchSheet(i) {
    if (i === BK.active || !BK.sheets[i]) return;
    if (editing) commitEdit();
    saveCur(); BK.active = i; putSheetData(cur().data); renderTabs(); updateProtUI();
  }
  // ---- loadBook handles single-sheet data, exercise starts with several sheets and saved workbooks ----
  const _loadBook = loadBook;
  loadBook = function (d) {
    loading = true;
    if (d && d.sheets) {
      BK.sheets = d.sheets.map((sh) => {
        if (sh.data) return { name: sh.name, color: sh.color || '', hidden: !!sh.hidden, prot: sh.prot || null, data: sh.data };
        _loadBook(sh.start || null); return { name: sh.name, color: sh.color || '', hidden: !!sh.hidden, prot: sh.prot || null, data: sheetData() };
      });
      BK.active = Math.min(d.active || 0, BK.sheets.length - 1); BK.wbProt = d.wbProt || null; BK.macros = d.macros || [];
      putSheetData(cur().data);
    } else {
      _loadBook(d);
      BK.sheets = [{ name: (d && d.sheetName) || 'Sheet1', color: '', hidden: false, prot: null, data: sheetData() }]; BK.active = 0; BK.wbProt = null; BK.macros = (d && d.macros) || [];
    }
    BK.macrosBlocked = false; $('#macroBar')?.remove();
    loading = false; renderTabs(); updateProtUI();
  };

  // ========================= SHEET TABS =========================
  function renderTabs() {
    const bar = $('#sheetbar');
    bar.innerHTML = `<span class="nav"><b data-n="-1" title="Previous sheet">◀</b><b data-n="1" title="Next sheet">▶</b></span>` +
      BK.sheets.map((s, i) => s.hidden ? '' : `<span class="sheet${i === BK.active ? ' on' : ''}" data-i="${i}" style="${s.color ? `--tab:${s.color}` : ''}" title="${escapeHtml(s.name)}${s.prot ? ' (protected)' : ''}">${escapeHtml(s.name)}${s.prot ? ' 🔒' : ''}</span>`).join('') +
      `<span class="add" title="New sheet (Shift+F11)">⊕</span>`;
    bar.querySelectorAll('.sheet').forEach((t) => {
      t.onclick = () => switchSheet(+t.dataset.i);
      t.ondblclick = () => renameSheet(+t.dataset.i);
      t.oncontextmenu = (e) => { e.preventDefault(); switchSheet(+t.dataset.i); tabMenu(e.clientX, e.clientY); };
    });
    bar.querySelectorAll('.nav b').forEach((b) => (b.onclick = () => { const vis = BK.sheets.map((s, i) => (s.hidden ? -1 : i)).filter((i) => i >= 0); const k = vis.indexOf(BK.active) + +b.dataset.n; if (vis[k] !== undefined) switchSheet(vis[k]); }));
    bar.querySelector('.add').onclick = () => insertSheet();
  }
  const wbLocked = () => { if (BK.wbProt) { modal('<h3>Microsoft Excel</h3><p>Workbook is protected and cannot be changed.</p>', [['OK', 'primary']]); return true; } return false; };
  const validName = (n, except) => {
    if (!n.trim()) return 'You typed an invalid name for a sheet or chart. Make sure that:\n• The name that you type does not exceed 31 characters.\n• The name does not contain any of the following characters: : \\ / ? * [ or ]\n• You did not leave the name blank.';
    if (n.length > 31 || /[:\\/?*[\]]/.test(n)) return 'You typed an invalid name for a sheet or chart. Make sure that:\n• The name that you type does not exceed 31 characters.\n• The name does not contain any of the following characters: : \\ / ? * [ or ]';
    if (BK.sheets.some((s, i) => i !== except && s.name.toLowerCase() === n.trim().toLowerCase())) return 'That name is already taken. Try a different one.';
    return null;
  };
  function nextName() { let i = BK.sheets.length + 1; while (BK.sheets.some((s) => s.name === 'Sheet' + i)) i++; return 'Sheet' + i; }
  function insertSheet(at) {
    if (wbLocked()) return;
    saveCur(); const pos = at === undefined ? BK.active + 1 : at;
    BK.sheets.splice(pos, 0, { name: nextName(), color: '', hidden: false, prot: null, data: blank() });
    BK.active = pos; putSheetData(cur().data); renderTabs(); updateProtUI();
  }
  async function deleteSheet() {
    if (wbLocked()) return;
    if (BK.sheets.filter((s) => !s.hidden).length <= 1) return modal('<h3>Microsoft Excel</h3><p>A workbook must contain at least one visible worksheet.</p>', [['OK', 'primary']]);
    if (Object.keys(S.cells).length) { const r = await modal('<h3>Microsoft Excel</h3><p>Microsoft Excel will permanently delete this sheet. Do you want to continue?</p>', [['Cancel'], ['Delete', 'primary']]); if (r.i !== 1) return; }
    BK.sheets.splice(BK.active, 1); BK.active = Math.max(0, BK.active - 1); while (BK.sheets[BK.active].hidden) BK.active = (BK.active + 1) % BK.sheets.length;
    putSheetData(cur().data); renderTabs(); updateProtUI();
  }
  function renameSheet(i = BK.active) {
    if (wbLocked()) return;
    const t = $(`#sheetbar .sheet[data-i="${i}"]`); if (!t) return;
    const inp = document.createElement('input'); inp.className = 'tabren'; inp.value = BK.sheets[i].name; t.textContent = ''; t.appendChild(inp); inp.focus(); inp.select();
    let done = false;
    const finish = async (ok) => {
      if (done) return; done = true;
      const v = inp.value;
      if (ok && v !== BK.sheets[i].name) { const err = validName(v, i); if (err) { await modal(`<h3>Microsoft Excel</h3><p style="white-space:pre-line">${escapeHtml(err)}</p>`, [['OK', 'primary']]); renderTabs(); return renameSheet(i); } BK.sheets[i].name = v.trim(); }
      renderTabs();
    };
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
    inp.addEventListener('blur', () => finish(true));
  }
  const TAB_COLORS = ['#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'];
  function tabMenu(x, y) {
    const hiddenN = BK.sheets.filter((s) => s.hidden).length;
    PRO.ctxMenu(x, y, [{ v: 'ins', t: 'Insert...' }, { v: 'del', t: 'Delete', ic: '🗑' }, { v: 'ren', t: 'Rename' }, { v: 'move', t: 'Move or Copy...' }, { v: 'code', t: 'View Code', ic: '⌨' }, { v: 'prot', t: cur().prot ? 'Unprotect Sheet...' : 'Protect Sheet...', ic: '🔒' }, { v: 'color', t: 'Tab Color', sub: 1 }, '-', { v: 'hide', t: 'Hide' }, { v: 'unhide', t: 'Unhide...', dis: !hiddenN }, '-', { v: 'all', t: 'Select All Sheets' }], (v, el) => {
      if (v === 'ins') return insertDialog(); if (v === 'del') return deleteSheet(); if (v === 'ren') return renameSheet();
      if (v === 'move') return moveCopy(); if (v === 'code') return vbaEditor(); if (v === 'prot') return cur().prot ? unprotectSheet() : protectSheet();
      if (v === 'color') { const r = el.getBoundingClientRect(); return tabColor(r.right, r.top); }
      if (v === 'hide') return hideSheet(); if (v === 'unhide') return unhideSheet(); if (v === 'all') toast('All sheets selected (Group).', 'info');
    });
  }
  function tabColor(x, y) {
    if (wbLocked()) return;
    const d = PRO.ctxMenu(x, y, [{ v: 'none', t: 'No Color' }], (v) => { cur().color = v === 'none' ? '' : v; renderTabs(); });
    d.insertAdjacentHTML('afterbegin', `<div class="hd">Theme Colors</div><div class="swatches">${PALETTE.slice(0, 30).map((c) => `<span data-v="${c}" style="background:${c}" title="${c}"></span>`).join('')}</div><div class="hd">Standard Colors</div><div class="swatches">${TAB_COLORS.map((c) => `<span data-v="${c}" style="background:${c}" title="${COLOR_NAMES[c] || c}"></span>`).join('')}</div>`);
  }
  async function insertDialog() {
    const r = await modal('<h3>Insert</h3><div class="insg"><label><input type="radio" name="ins" checked> 📄 Worksheet</label><label><input type="radio" name="ins"> 📊 Chart</label><label><input type="radio" name="ins"> 📜 MS Excel 4.0 Macro</label></div>', [['Cancel'], ['OK', 'primary']]);
    if (r.i === 1) insertSheet(BK.active);
  }
  async function moveCopy() {
    if (wbLocked()) return;
    const r = await modal(`<h3>Move or Copy</h3><p>Move selected sheets<br>To book: <select class="rs"><option>${escapeHtml(bookName)}</option><option>(new book)</option></select></p><p>Before sheet:</p><select class="rs" size="6" style="width:100%">${BK.sheets.map((s, i) => `<option value="${i}" ${i === BK.active + 1 ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}<option value="end" ${BK.active === BK.sheets.length - 1 ? 'selected' : ''}>(move to end)</option></select><p><label><input type="checkbox"> Create a copy</label></p>`, [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return;
    saveCur(); const to = r.v[1] === 'end' ? BK.sheets.length : +r.v[1]; const copy = r.v[2];
    if (copy) {
      const src = cur(); let n = src.name + ' (2)'; let k = 2; while (BK.sheets.some((s) => s.name === n)) n = `${src.name} (${++k})`;
      BK.sheets.splice(to, 0, { ...JSON.parse(JSON.stringify(src)), name: n, prot: null }); BK.active = to;
    } else { const [s] = BK.sheets.splice(BK.active, 1); const t = to > BK.active ? to - 1 : to; BK.sheets.splice(t, 0, s); BK.active = t; }
    putSheetData(cur().data); renderTabs(); updateProtUI();
  }
  function hideSheet() {
    if (wbLocked()) return;
    if (BK.sheets.filter((s) => !s.hidden).length <= 1) return modal('<h3>Microsoft Excel</h3><p>A workbook must contain at least one visible worksheet. To hide, delete, or move the selected sheets, you must first insert a new sheet or unhide a sheet that is already hidden.</p>', [['OK', 'primary']]);
    saveCur(); cur().hidden = true; const i = BK.sheets.findIndex((s) => !s.hidden); BK.active = i; putSheetData(cur().data); renderTabs(); updateProtUI();
  }
  async function unhideSheet() {
    if (wbLocked()) return;
    const hid = BK.sheets.map((s, i) => [s, i]).filter(([s]) => s.hidden);
    const r = await modal(`<h3>Unhide</h3><p>Unhide sheet:</p><select class="rs" size="5" style="width:100%">${hid.map(([s, i], k) => `<option value="${i}" ${k ? '' : 'selected'}>${escapeHtml(s.name)}</option>`).join('')}</select>`, [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return; const i = +r.v[0]; BK.sheets[i].hidden = false; switchSheet(i); renderTabs();
  }

  // ========================= PROTECTION =========================
  const ALLOW = [['selL', 'Select locked cells', true], ['selU', 'Select unlocked cells', true], ['fmtC', 'Format cells'], ['fmtCol', 'Format columns'], ['fmtRow', 'Format rows'], ['insCol', 'Insert columns'], ['insRow', 'Insert rows'], ['link', 'Insert hyperlinks'], ['delCol', 'Delete columns'], ['delRow', 'Delete rows'], ['sort', 'Sort'], ['filter', 'Use AutoFilter'], ['pivot', 'Use PivotTable & PivotChart'], ['obj', 'Edit objects'], ['scen', 'Edit scenarios']];
  const isLocked = (r, c) => { const o = S.cells[addr(r, c)]; return !(o && o.s && o.s.unl); };
  const prot = () => (cur() && cur().prot) || null;
  const PROT_MSG = 'The cell or chart you\'re trying to change is on a protected sheet. To make a change, unprotect the sheet. You might be requested to enter a password.';
  let msgOpen = false;
  function protMsg() { if (msgOpen) return; msgOpen = true; modal(`<h3>Microsoft Excel</h3><p>⚠ ${PROT_MSG}</p>`, [['OK', 'primary']]).then(() => (msgOpen = false)); }
  class ProtErr extends Error { constructor() { super('protected'); this.__prot = true; } }
  addEventListener('error', (e) => { if (e.error && e.error.__prot) e.preventDefault(); });
  addEventListener('unhandledrejection', (e) => { if (e.reason && e.reason.__prot) e.preventDefault(); });
  function selHasLocked() { const n = norm(sel); for (let r = n.r1; r <= n.r2; r++) for (let c = n.c1; c <= n.c2; c++) if (isLocked(r, c)) return true; return false; }
  const _snapshot = snapshot;
  snapshot = function () { if (!loading && !replaying && prot() && selHasLocked()) { protMsg(); throw new ProtErr(); } recordTick(); return _snapshot(); };
  const _startEdit = startEdit;
  startEdit = function (...a) { if (prot() && isLocked(act.r, act.c)) { protMsg(); return; } return _startEdit(...a); };
  const _setRaw = setRaw;
  setRaw = function (r, c, raw) { if (!loading && prot() && isLocked(r, c)) return; if (REC && !replaying && !loading) recVal(r, c, raw); return _setRaw(r, c, raw); };
  const _setStyle = setStyle;
  setStyle = function (r, c, patch) { if (!loading && !replaying && prot() && isLocked(r, c) && !('unl' in patch)) return; if (REC && !replaying && !loading) recStyle(r, c, patch); return _setStyle(r, c, patch); };
  async function protectSheet() {
    if (prot()) return unprotectSheet();
    const r = await modal(`<h3>Protect Sheet</h3><p><label><input type="checkbox" checked> Protect worksheet and contents of locked cells</label></p><p>Password to unprotect sheet:</p><input type="password" class="rs" style="width:100%;height:28px"><p>Allow all users of this worksheet to:</p><div class="allowlist">${ALLOW.map(([k, t, on]) => `<label><input type="checkbox" ${on ? 'checked' : ''}> ${t}</label>`).join('')}</div>`, [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return;
    const pw = r.v[1];
    if (pw) { const c = await modal('<h3>Confirm Password</h3><p>Reenter password to proceed.</p><input type="password" class="rs" style="width:100%;height:28px"><p class="muted" style="font-size:12px">Caution: If you lose or forget the password, it cannot be recovered.</p>', [['Cancel'], ['OK', 'primary']]); if (c.i !== 1) return; if (c.v[0] !== pw) return modal('<h3>Microsoft Excel</h3><p>Confirmation password is not identical.</p>', [['OK', 'primary']]); }
    const allow = {}; ALLOW.forEach(([k], i) => (allow[k] = r.v[2 + i]));
    cur().prot = { password: pw, allow }; renderTabs(); updateProtUI(); toast(`Sheet "${cur().name}" protected.`, 'ok');
  }
  async function unprotectSheet() {
    const p = prot(); if (!p) return;
    if (p.password) { const r = await modal('<h3>Unprotect Sheet</h3><p>Password:</p><input type="password" class="rs" style="width:100%;height:28px">', [['Cancel'], ['OK', 'primary']]); if (r.i !== 1) return; if (r.v[0] !== p.password) return modal('<h3>Microsoft Excel</h3><p>The password you supplied is not correct. Verify that the CAPS LOCK key is off and be sure to use the correct capitalization.</p>', [['OK', 'primary']]); }
    cur().prot = null; renderTabs(); updateProtUI(); toast('Sheet unprotected.', 'info');
  }
  async function protectWorkbook() {
    if (BK.wbProt) {
      if (BK.wbProt.password) { const r = await modal('<h3>Unprotect Workbook</h3><p>Password:</p><input type="password" class="rs" style="width:100%;height:28px">', [['Cancel'], ['OK', 'primary']]); if (r.i !== 1) return; if (r.v[0] !== BK.wbProt.password) return modal('<h3>Microsoft Excel</h3><p>The password you supplied is not correct.</p>', [['OK', 'primary']]); }
      BK.wbProt = null; updateProtUI(); return toast('Workbook structure unprotected.', 'info');
    }
    const r = await modal('<h3>Protect Structure and Windows</h3><p>Protect workbook for</p><p><label><input type="checkbox" checked> Structure</label></p><p><label><input type="checkbox" disabled> Windows</label></p><p>Password (optional):</p><input type="password" class="rs" style="width:100%;height:28px">', [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return;
    if (!r.v[0]) return;
    const pw = r.v[2];
    if (pw) { const c = await modal('<h3>Confirm Password</h3><p>Reenter password to proceed.</p><input type="password" class="rs" style="width:100%;height:28px">', [['Cancel'], ['OK', 'primary']]); if (c.i !== 1) return; if (c.v[0] !== pw) return modal('<h3>Microsoft Excel</h3><p>Confirmation password is not identical.</p>', [['OK', 'primary']]); }
    BK.wbProt = { password: pw, structure: true }; updateProtUI(); toast('Workbook structure protected.', 'ok');
  }
  function toggleLock() { const n = norm(sel); const on = !isLocked(act.r, act.c); loading = true; for (let r = n.r1; r <= n.r2; r++) for (let c = n.c1; c <= n.c2; c++) _setStyle(r, c, { unl: on ? undefined : 1 }); loading = false; renderAll(); toast(on ? 'Cells locked.' : 'Cells unlocked — they stay editable when the sheet is protected.', 'info'); }
  async function formatCellsProtection() {
    const r = await modal(`<h3>Format Cells</h3><div class="tabs"><span>Number</span><span>Alignment</span><span>Font</span><span>Border</span><span>Fill</span><b>Protection</b></div><p><label><input type="checkbox" ${isLocked(act.r, act.c) ? 'checked' : ''}> Locked</label></p><p><label><input type="checkbox"> Hidden</label></p><p class="muted" style="font-size:12px">Locking cells or hiding formulas has no effect until you protect the worksheet (Review tab, Protect group, Protect Sheet button).</p>`, [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return; const n = norm(sel); loading = true;
    for (let rr = n.r1; rr <= n.r2; rr++) for (let c = n.c1; c <= n.c2; c++) _setStyle(rr, c, { unl: r.v[0] ? undefined : 1, hid: r.v[1] ? 1 : undefined });
    loading = false; renderAll();
  }
  function updateProtUI() {
    const p = !!prot();
    const b = $('#btnProtSheet'); if (b) { b.innerHTML = `${PRO.ic('🔒')}${p ? 'Unprotect<br>Sheet' : 'Protect<br>Sheet'}`; }
    const w = $('#btnProtWB'); if (w) { w.classList.toggle('on', !!BK.wbProt); }
    $('#stProt') && ($('#stProt').textContent = p ? '🔒 Protected sheet' : '');
  }

  // ========================= MACROS =========================
  let REC = null, replaying = false, relRefs = false, tickStep = null;
  function recordTick() { tickStep = null; }
  function newStep(kind) { const n = norm(sel); const st = { kind, sel: { ...n }, act: { ...act }, cells: [] }; REC.steps.push(st); tickStep = st; Promise.resolve().then(() => { if (tickStep === st) tickStep = null; }); return st; }
  function recStyle(r, c, patch) { const st = tickStep && tickStep.kind === 'style' ? tickStep : newStep('style'); st.cells.push([r, c, { ...patch }]); }
  function recVal(r, c, raw) { const st = tickStep && tickStep.kind === 'val' ? tickStep : newStep('val'); st.cells.push([r, c, raw]); }
  async function recordDialog() {
    if (REC) return stopRecording();
    const r = await modal(`<h3>Record Macro</h3><p>Macro name:</p><input class="rs" style="width:100%;height:28px" value="Macro${BK.macros.length + 1}"><p>Shortcut key: Ctrl+ <input class="rs" maxlength="1" style="width:34px"></p><p>Store macro in:</p><select class="rs" style="width:100%"><option>This Workbook</option><option>New Workbook</option><option>Personal Macro Workbook</option></select><p>Description:</p><textarea class="rs" style="width:100%;height:50px"></textarea>`, [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return;
    const name = r.v[0].trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return modal('<h3>Microsoft Excel</h3><p>The macro name is not valid. Macro names must begin with a letter and contain no spaces or special characters.</p>', [['OK', 'primary']]);
    if (BK.macros.some((m) => m.name.toLowerCase() === name.toLowerCase())) { const q = await modal(`<h3>Microsoft Excel</h3><p>A macro named '${escapeHtml(name)}' already exists. Do you want to replace it?</p>`, [['No'], ['Yes', 'primary']]); if (q.i !== 1) return; BK.macros = BK.macros.filter((m) => m.name.toLowerCase() !== name.toLowerCase()); }
    const key = (r.v[1] || '').trim().toLowerCase();
    REC = { name, key, desc: r.v[3], rel: relRefs, steps: [], start: { ...act } };
    paintRec(); toast('Recording macro "' + name + '"… Do the actions, then click Stop Recording.', 'info', 3000);
  }
  function stopRecording() {
    if (!REC) return;
    REC.steps = REC.steps.filter((s) => s.cells.length);
    BK.macros.push({ name: REC.name, key: REC.key, desc: REC.desc, rel: REC.rel, start: REC.start, steps: REC.steps });
    toast(`Macro "${REC.name}" recorded (${REC.steps.length} action${REC.steps.length === 1 ? '' : 's'}).`, 'ok');
    REC = null; paintRec();
  }
  function paintRec() {
    const on = !!REC;
    ['#btnRecMacro', '#btnRecMacro2'].forEach((id) => { const b = $(id); if (b) b.innerHTML = `${PRO.ic(on ? '⏹' : '⏺')}${on ? 'Stop<br>Recording' : 'Record<br>Macro'}`; });
    const s = $('#stRec'); if (s) { s.textContent = on ? '⏹' : '⏺'; s.title = on ? 'A macro is being recorded. Click to stop recording.' : 'Record Macro'; s.classList.toggle('rec', on); }
  }
  function runMacro(name) {
    const m = BK.macros.find((x) => x.name === name); if (!m) return;
    if (BK.macrosBlocked) return modal('<h3>Microsoft Excel</h3><p>Cannot run the macro. The macro may not be available in this workbook or all macros may be disabled. Click <b>Enable Content</b> on the message bar.</p>', [['OK', 'primary']]);
    try { snapshot(); } catch (e) { return; }
    replaying = true;
    const base = { ...act }; const n0 = norm(sel);
    m.steps.forEach((st) => {
      const dr = m.rel ? base.r - m.start.r : 0, dc = m.rel ? base.c - m.start.c : 0;
      st.cells.forEach(([r, c, v]) => {
        const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= ROWS || cc >= COLS) return;
        if (prot() && isLocked(rr, cc)) return;
        if (st.kind === 'style') _setStyle(rr, cc, v); else _setRaw(rr, cc, v);
      });
    });
    replaying = false; renderAll(); select(n0.r1, n0.c1, n0.r2, n0.c2, base);
    FLAGS.lastRun = { name, sheet: cur().name, at: Date.now() };
    toast(`Macro "${name}" ran.`, 'ok', 1500);
  }
  const vbColor = (hex) => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || ''); return m ? parseInt(m[3] + m[2] + m[1], 16) : 0; };
  function vba(m) {
    const L = [`Sub ${m.name}()`, `'`, `' ${m.name} Macro`, ...(m.desc ? [`' ${m.desc}`] : []), ...(m.key ? [`'`, `' Keyboard Shortcut: Ctrl+${m.key}`] : []), `'`];
    m.steps.forEach((st) => {
      const rs = st.cells.map((x) => x[0]), cs = st.cells.map((x) => x[1]);
      const r1 = Math.min(...rs), r2 = Math.max(...rs), c1 = Math.min(...cs), c2 = Math.max(...cs);
      const rng = m.rel ? `ActiveCell.Offset(${r1 - m.start.r}, ${c1 - m.start.c}).Range("A1${r2 > r1 || c2 > c1 ? ':' + addr(r2 - r1, c2 - c1) : ''}")` : `Range("${addr(r1, c1)}${r2 > r1 || c2 > c1 ? ':' + addr(r2, c2) : ''}")`;
      L.push(`    ${rng}.Select`);
      if (st.kind === 'val') st.cells.forEach(([r, c, v]) => L.push(`    ${m.rel ? `ActiveCell.Offset(${r - r1}, ${c - c1})` : `Range("${addr(r, c)}")`}.${String(v).startsWith('=') ? 'FormulaR1C1' : 'Value'} = "${String(v).replace(/"/g, '""')}"`));
      else {
        const p = st.cells[0][2];
        if ('b' in p) L.push(`    Selection.Font.Bold = ${p.b ? 'True' : 'False'}`);
        if ('i' in p) L.push(`    Selection.Font.Italic = ${p.i ? 'True' : 'False'}`);
        if ('u' in p) L.push(`    Selection.Font.Underline = ${p.u ? 'xlUnderlineStyleSingle' : 'xlUnderlineStyleNone'}`);
        if ('size' in p) L.push(`    Selection.Font.Size = ${p.size || 11}`);
        if ('font' in p) L.push(`    Selection.Font.Name = "${p.font || 'Calibri'}"`);
        if ('color' in p) L.push(`    Selection.Font.Color = ${vbColor(p.color || '#000000')}`);
        if ('fill' in p) L.push('    With Selection.Interior', '        .Pattern = xlSolid', `        .Color = ${vbColor(p.fill || '#ffffff')}`, '    End With');
        if ('al' in p) L.push(`    Selection.HorizontalAlignment = xl${{ left: 'Left', center: 'Center', right: 'Right' }[p.al] || 'General'}`);
        if ('fmt' in p) L.push(`    Selection.NumberFormat = "${{ currency: '$#,##0.00', percent: '0%', date: 'm/d/yyyy', number: '0.00' }[p.fmt] || 'General'}"`);
        if (['bt', 'bb', 'bl', 'br'].some((k) => k in p)) L.push('    Selection.Borders.LineStyle = xlContinuous');
      }
    });
    L.push('End Sub'); return L.join('\n');
  }
  async function macrosDialog() {
    const r = await modal(`<h3>Macro</h3><p>Macro name:</p><select class="rs mlist" size="7" style="width:100%">${BK.macros.map((m, i) => `<option value="${escapeHtml(m.name)}" ${i ? '' : 'selected'}>${escapeHtml(m.name)}</option>`).join('')}</select><p>Macros in: <select class="rs"><option>All Open Workbooks</option><option>This Workbook</option></select></p><p class="muted" style="font-size:12px">${BK.macros.length ? 'Description: ' + escapeHtml(BK.macros[0].desc || '') : 'There are no macros in this workbook. Use Record Macro to create one.'}</p>`, [['Cancel'], ['Delete'], ['Edit'], ['Run', 'primary']]);
    const name = r.v[0];
    if (!name) return;
    if (r.i === 3) runMacro(name);
    if (r.i === 2) vbaEditor(name);
    if (r.i === 1) { const q = await modal(`<h3>Microsoft Excel</h3><p>Do you want to delete the macro ${escapeHtml(name)}?</p>`, [['No'], ['Yes', 'primary']]); if (q.i === 1) BK.macros = BK.macros.filter((m) => m.name !== name); }
  }
  function vbaEditor(focus) {
    FLAGS.vba = true;
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    const code = BK.macros.length ? BK.macros.map(vba).join('\n\n') : "' No macros in this workbook.";
    bg.innerHTML = `<div class="vbe"><div class="vbt"><span>Microsoft Visual Basic for Applications - ${escapeHtml(bookName)} - [Module1 (Code)]</span><b class="vbx">✕</b></div><div class="vbm">File &nbsp; Edit &nbsp; View &nbsp; Insert &nbsp; Format &nbsp; Debug &nbsp; Run &nbsp; Tools &nbsp; Add-Ins &nbsp; Window &nbsp; Help</div>
      <div class="vbb"><div class="vbp"><b>Project - VBAProject</b><div>📁 VBAProject (${escapeHtml(bookName)})</div><div style="padding-left:14px">📁 Microsoft Excel Objects</div>${BK.sheets.map((s, i) => `<div style="padding-left:28px">▦ Sheet${i + 1} (${escapeHtml(s.name)})</div>`).join('')}<div style="padding-left:28px">▦ ThisWorkbook</div><div style="padding-left:14px">📁 Modules</div><div style="padding-left:28px" class="on">⚙ Module1</div></div>
      <pre class="vbc">${escapeHtml(code).replace(/^(\s*)('.*)$/gm, '$1<span class="cm">$2</span>').replace(/\b(Sub|End Sub|With|End With|True|False|Range|Selection|ActiveCell)\b/g, '<span class="kw">$1</span>')}</pre></div></div>`;
    document.body.appendChild(bg);
    bg.querySelector('.vbx').onclick = () => bg.remove();
    if (focus) { const pre = bg.querySelector('.vbc'); const i = pre.textContent.indexOf('Sub ' + focus); if (i > 0) pre.scrollTop = (pre.textContent.slice(0, i).split('\n').length - 2) * 17; }
  }
  document.addEventListener('keydown', (e) => {
    if ($('.modal-bg') || $('#backstage')) return;
    if (e.altKey && e.key === 'F8') { e.preventDefault(); macrosDialog(); return; }
    if (e.altKey && e.key === 'F11') { e.preventDefault(); vbaEditor(); return; }
    if (e.shiftKey && e.key === 'F11') { e.preventDefault(); insertSheet(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'PageDown' || e.key === 'PageUp')) { e.preventDefault(); const vis = BK.sheets.map((s, i) => (s.hidden ? -1 : i)).filter((i) => i >= 0); const k = vis.indexOf(BK.active) + (e.key === 'PageDown' ? 1 : -1); if (vis[k] !== undefined) switchSheet(vis[k]); return; }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !editing && e.key.length === 1) {
      const m = BK.macros.find((x) => x.key && x.key === e.key.toLowerCase() && !e.shiftKey);
      if (m) { e.preventDefault(); e.stopImmediatePropagation(); runMacro(m.name); }
    }
  }, true);
  function macroBar() {
    if (!BK.macros.length) return;
    BK.macrosBlocked = true; $('#macroBar')?.remove();
    const bar = document.createElement('div'); bar.id = 'macroBar';
    bar.innerHTML = '<b>⚠ SECURITY WARNING</b><span>Macros have been disabled.</span><button>Enable Content</button><i>✕</i>';
    $('#ribbon').after(bar);
    bar.querySelector('button').onclick = () => { BK.macrosBlocked = false; bar.remove(); toast('Macros enabled for this workbook.', 'ok'); };
    bar.querySelector('i').onclick = () => bar.remove();
  }

  // ========================= RIBBON =========================
  function buildRibbon() {
    PRO.addTab('review', 'Review', [
      PRO.grp('Proofing', `${PRO.big('btnSpell', '✔', 'Spelling', 'Spelling (F7)')}${PRO.big('btnThes', '📖', 'Thesaurus')}`),
      PRO.grp('Comments', `${PRO.big('btnXComment', '💬', 'New<br>Comment')}`),
      PRO.grp('Protect', `${PRO.big('btnProtSheet', '🔒', 'Protect<br>Sheet')}${PRO.big('btnProtWB', '📘', 'Protect<br>Workbook')}${PRO.big('btnAllowRanges', '🔓', 'Allow Edit<br>Ranges')}${PRO.big('btnUnshare', '👥', 'Unshare<br>Workbook')}`),
    ].join(''), { before: 'view' });
    PRO.addTab('developer', 'Developer', [
      PRO.grp('Code', `${PRO.big('btnVB', '⌨', 'Visual<br>Basic', 'Visual Basic (Alt+F11)')}${PRO.big('btnMacros', '▶', 'Macros', 'Macros (Alt+F8)')}<div class="col">${PRO.small('btnRecMacro2', '⏺', 'Record Macro')}${PRO.small('btnRelRef', '⇲', 'Use Relative References')}${PRO.small('btnMacroSec', '⚠', 'Macro Security')}</div>`),
      PRO.grp('Add-ins', `${PRO.big('btnAddins', '🧩', 'Excel<br>Add-ins')}`),
      PRO.grp('Controls', `${PRO.big('btnCtlInsert', '🔘', 'Insert', 'Insert Controls', true)}${PRO.big('btnDesign', '📐', 'Design<br>Mode')}`),
    ].join(''), { before: 'chart', hidden: true });
    const devBtn = $('#tabs button[data-tab=developer]'); if (localStorage.getItem('thl.tab.Excel.developer') === null) devBtn.hidden = true;
    PRO.addGroups('view', PRO.grp('Macros', `<button class="rb big" id="btnViewMacros" title="Macros">${PRO.ic('▶')}Macros<span class="caret">▾</span></button>`));
    PRO.addGroups('view', PRO.grp('Window', `${PRO.big('btnNewWin', '🗗', 'New<br>Window')}${PRO.big('btnFreeze', '❄', 'Freeze<br>Panes', 'Freeze Panes', true)}`), { after: $('#btnZoom100').closest('.grp') });
    $('#btnViewMacros').onclick = () => dropdown($('#btnViewMacros'), `<div class="it" data-v="view">▶ View Macros</div><div class="it" data-v="rec">${REC ? '⏹ Stop Recording' : '⏺ Record Macro...'}</div><div class="it" data-v="rel">${relRefs ? '✓ ' : ''}Use Relative References</div>`, (v) => { if (v === 'view') macrosDialog(); if (v === 'rec') recordDialog(); if (v === 'rel') toggleRel(); });
    $('#btnFreeze').onclick = () => dropdown($('#btnFreeze'), '<div class="it" data-v="p">Freeze Panes</div><div class="it" data-v="r">Freeze Top Row</div><div class="it" data-v="c">Freeze First Column</div>', (v) => { XP.freeze = v; $('#gridWrap').classList.toggle('frz-r', v !== 'c'); $('#gridWrap').classList.toggle('frz-c', v !== 'r'); toast('Panes frozen.', 'info'); });
    $('#btnNewWin').onclick = () => toast('A new window of this workbook would open in Excel.', 'info');
    $('#btnProtSheet').onclick = protectSheet; $('#btnProtWB').onclick = protectWorkbook;
    $('#btnAllowRanges').onclick = () => modal('<h3>Allow Users to Edit Ranges</h3><p>Ranges unlocked by a password when sheet is protected:</p><div style="border:1px solid #ccc;height:80px"></div><p class="muted" style="font-size:12px">Tip: select cells and use Home › Format › Lock Cell to unlock them before protecting the sheet.</p>', [['OK', 'primary']]);
    $('#btnUnshare').onclick = () => toast('This workbook is not shared.', 'info');
    $('#btnSpell').onclick = () => modal('<h3>Microsoft Excel</h3><p>The spelling check is complete for the entire sheet.</p>', [['OK', 'primary']]);
    $('#btnThes').onclick = () => toast('Thesaurus: select a cell with a word first.', 'info');
    $('#btnXComment').onclick = async () => { const r = await modal('<h3>New Comment</h3><input class="rs" style="width:100%;height:30px" placeholder="Start a conversation">', [['Cancel'], ['Post', 'primary']]); if (r.i === 1 && r.v[0]) { try { snapshot(); } catch { return; } _setStyle(act.r, act.c, { note: r.v[0] }); renderAll(); } };
    $('#btnVB').onclick = () => vbaEditor(); $('#btnMacros').onclick = macrosDialog; $('#btnRecMacro2').onclick = recordDialog;
    $('#btnRelRef').onclick = toggleRel;
    $('#btnMacroSec').onclick = () => modal('<h3>Trust Center – Macro Settings</h3>' + ['Disable VBA macros without notification', 'Disable VBA macros with notification', 'Disable VBA macros except digitally signed macros', 'Enable VBA macros (not recommended)'].map((x, i) => `<p><label><input type="radio" name="ms" ${i === 1 ? 'checked' : ''}> ${x}</label></p>`).join(''), [['Cancel'], ['OK', 'primary']]);
    $('#btnAddins').onclick = () => modal('<h3>Add-ins</h3><p>Add-ins available:</p>' + ['Analysis ToolPak', 'Analysis ToolPak - VBA', 'Euro Currency Tools', 'Solver Add-in'].map((x) => `<p><label><input type="checkbox"> ${x}</label></p>`).join(''), [['Cancel'], ['OK', 'primary']]);
    $('#btnCtlInsert').onclick = () => dropdown($('#btnCtlInsert'), '<div class="hd">Form Controls</div><div class="it" data-v="btn">🔘 Button (Form Control)</div>', async () => {
      if (!BK.macros.length) return modal('<h3>Assign Macro</h3><p>Record a macro first, then insert a button to run it.</p>', [['OK', 'primary']]);
      const r = await modal(`<h3>Assign Macro</h3><p>Macro name:</p><select class="rs" style="width:100%">${BK.macros.map((m) => `<option>${escapeHtml(m.name)}</option>`).join('')}</select><p>Button text:</p><input class="rs" style="width:100%" value="Run">`, [['Cancel'], ['OK', 'primary']]);
      if (r.i !== 1) return; addMacroButton(r.v[0], r.v[1] || 'Button 1');
    });
    $('#btnDesign').onclick = () => $('#btnDesign').classList.toggle('on');
    // Home › Format: add protection items
    PRO.rebind('#btnFormatCells', () => dropdown($('#btnFormatCells'), `<div class="hd">Cell Size</div><div class="it" data-v="w">Column Width...</div><div class="it" data-v="auto">AutoFit Column Width</div><div class="hd">Organize Sheets</div><div class="it" data-v="ren">Rename Sheet</div><div class="it" data-v="move">Move or Copy Sheet...</div><div class="it" data-v="color">Tab Color ▸</div><div class="hd">Protection</div><div class="it" data-v="prot">🔒 ${prot() ? 'Unprotect Sheet...' : 'Protect Sheet...'}</div><div class="it" data-v="lock">${isLocked(act.r, act.c) ? '✓ ' : ''}🔐 Lock Cell</div><div class="it" data-v="fmt">Format Cells...</div>`, async (v) => {
      const n = norm(sel);
      if (v === 'w') { const r = await modal(`<h3>Column Width</h3><p>Column width (pixels):</p><input class="rs" type="number" value="${S.colW[act.c]}" style="width:100%;height:30px">`, [['Cancel'], ['OK', 'primary']]); if (r.i !== 1) return; try { snapshot(); } catch { return; } for (let c = n.c1; c <= n.c2; c++) S.colW[c] = Math.max(20, +r.v[0]); renderAll(); }
      if (v === 'auto') { try { snapshot(); } catch { return; } const cv = document.createElement('canvas').getContext('2d'); cv.font = '15px Calibri, Carlito, Arial'; for (let c = n.c1; c <= n.c2; c++) { let w = 40; for (let r = 0; r < ROWS; r++) { const t = td(r, c).textContent; if (t) w = Math.max(w, cv.measureText(t).width + 14); } S.colW[c] = Math.ceil(w); } renderAll(); }
      if (v === 'ren') renameSheet(); if (v === 'move') moveCopy(); if (v === 'color') { const r = $('#btnFormatCells').getBoundingClientRect(); tabColor(r.left, r.bottom); }
      if (v === 'prot') protectSheet(); if (v === 'lock') toggleLock(); if (v === 'fmt') formatCellsProtection();
    }));
    // status bar: macro record button + protection
    $('#stMode')?.insertAdjacentHTML('afterend', '<span id="stRec" class="strec" title="Record Macro">⏺</span><span id="stProt"></span>');
    $('#stRec').onclick = () => (REC ? stopRecording() : recordDialog());
    renderTabs();
  }
  function toggleRel() { relRefs = !relRefs; $('#btnRelRef')?.classList.toggle('on', relRefs); toast(relRefs ? 'Relative references ON.' : 'Absolute references.', 'info'); }
  function addMacroButton(macro, text) {
    const b = document.createElement('button'); b.className = 'xlbtn'; b.textContent = text; b.dataset.macro = macro;
    const rc = cellRect(act.r, act.c + 1); Object.assign(b.style, { left: rc.x + 'px', top: rc.y + 'px' });
    b.onclick = () => { if ($('#btnDesign').classList.contains('on')) return; runMacro(macro); };
    $('#gridInner').appendChild(b);
  }

  // ========================= FILE adapter =========================
  const adapter = {
    app: 'Excel', noun: 'workbook', defaultName: 'Book1', blankName: 'Blank workbook', nativeExt: 'xlsx',
    formats: [
      { ext: 'xlsx', label: 'Excel Workbook (*.xlsx)', desc: 'Uses the Excel Workbook format' },
      { ext: 'xlsm', label: 'Excel Macro-Enabled Workbook (*.xlsm)', desc: 'Workbook that can contain macros' },
      { ext: 'xls', label: 'Excel 97-2003 Workbook (*.xls)', desc: 'Compatible with Excel 97-2003' },
      { ext: 'xltx', label: 'Excel Template (*.xltx)', desc: 'Starting point for new workbooks' },
      { ext: 'csv', label: 'CSV (Comma delimited) (*.csv)', desc: 'Saves only the active sheet' },
      { ext: 'pdf', label: 'PDF (*.pdf)', export: true },
      { ext: 'ods', label: 'OpenDocument Spreadsheet (*.ods)' },
    ],
    templates: [
      { name: 'Personal monthly budget', thumb: '<div class="tplsheet"><i class="h"></i><i></i><i></i><i></i></div>', load: () => loadBook({ cells: { A1: { raw: 'Monthly Budget', s: { b: 1, size: 16 } }, A3: 'Category', B3: 'Budget', C3: 'Actual', D3: 'Difference', A4: 'Food', B4: '1500000', C4: '1350000', D4: '=B4-C4', A5: 'Transport', B5: '400000', C5: '450000', D5: '=B5-C5', A6: 'Books', B6: '300000', C6: '200000', D6: '=B6-C6' }, styles: { 'A3:D3': { b: 1, fill: '#d9e1f2' } } }) },
      { name: 'Class grade book', thumb: '<div class="tplsheet"><i class="h"></i><i></i><i></i></div>', load: () => loadBook({ cells: { A1: { raw: 'Grade Book', s: { b: 1, size: 16 } }, A3: 'Student', B3: 'Test 1', C3: 'Test 2', D3: 'Average', A4: 'An', B4: '8', C4: '9', D4: '=AVERAGE(B4:C4)', A5: 'Binh', B5: '7', C5: '6.5', D5: '=AVERAGE(B5:C5)' }, styles: { 'A3:D3': { b: 1, fill: '#e2efda' } } }) },
    ],
    serialize() { saveCur(); return { sheets: JSON.parse(JSON.stringify(BK.sheets)), active: BK.active, wbProt: BK.wbProt, macros: BK.macros }; },
    load(d) { loadBook(d); if (d.macros && d.macros.length) setTimeout(macroBar, 50); },
    newBlank() { loadBook(null); },
    setName: (n) => setBookName(n),
    async beforeSave(ext) {
      if (BK.macros.length && !['xlsm', 'xls', 'pdf'].includes(ext)) {
        const r = await modal('<h3>Microsoft Excel</h3><p>The following features cannot be saved in macro-free workbooks:</p><p>• VB project</p><p>To save a file with these features, click <b>No</b>, and then choose a macro-enabled file type in the File Type list.<br>To continue saving as a macro-free workbook, click <b>Yes</b>.</p>', [['No'], ['Yes', 'primary']]);
        if (r.i !== 1) return false;
        BK.macrosDroppedOnSave = true; return true;
      }
      if (ext === 'csv' && BK.sheets.length > 1) { const r = await modal('<h3>Microsoft Excel</h3><p>The selected file type does not support workbooks that contain multiple sheets. Only the active sheet will be saved.</p>', [['Cancel'], ['OK', 'primary']]); if (r.i !== 1) return false; }
      return true;
    },
    stats: () => [['Size', Math.max(8, Math.round(JSON.stringify(S).length / 1024)) + 'KB'], ['Sheets', BK.sheets.length], ['Macros', BK.macros.length], ['Categories', 'Add a category']],
    printPreview(box, P) {
      const used = Object.keys(S.cells).map(parseAddr); const mr = Math.min(30, Math.max(5, ...used.map((p) => p.r + 1))); const mc = Math.min(10, Math.max(3, ...used.map((p) => p.c + 1)));
      const land = P.orient === 'landscape'; const w = land ? 230 : 180; const h = land ? 178 : 233;
      let t = '<table class="pvt">'; for (let r = 0; r < mr; r++) { t += '<tr>'; for (let c = 0; c < mc; c++) { const v = getVal(r, c); const o = S.cells[addr(r, c)]; t += `<td style="${o && o.s.b ? 'font-weight:bold;' : ''}${o && o.s.fill ? 'background:' + o.s.fill : ''}">${escapeHtml(XL.isErr(v) ? v.code : v === '' || v === null || v === undefined ? '' : String(v))}</td>`; } t += '</tr>'; } t += '</table>';
      box.innerHTML = `<div class="pvpage" style="width:${w}px;height:${h}px;padding:10px">${t}</div>`; return P.what === 'all' ? BK.sheets.length : 1;
    },
    printWhat: [['active', 'Print Active Sheets', 'Only print the active sheets'], ['all', 'Print Entire Workbook', 'Print the entire workbook'], ['selection', 'Print Selection', 'Only print the current selection']],
    protectItems: [['cursheet', '🔒', 'Protect Current Sheet', 'Control what types of changes people can make to the current sheet.'], ['wbstruct', '📘', 'Protect Workbook Structure', 'Prevent unwanted changes to the structure of the workbook, such as adding sheets.']],
    onProtect(k) { if (k === 'cursheet') protectSheet(); if (k === 'wbstruct') protectWorkbook(); },
    protectState: () => [...BK.sheets.filter((s) => s.prot).map((s) => `Sheet "${escapeHtml(s.name)}" is protected.`), ...(BK.wbProt ? ['The workbook structure has been locked to prevent unwanted changes.'] : [])],
    issues: () => [...(BK.macros.length ? ['Macros (VBA project)'] : []), ...(BK.sheets.some((s) => s.hidden) ? ['Hidden worksheets'] : [])],
    inspect: () => [...(BK.sheets.some((s) => s.hidden) ? ['Hidden Worksheets'] : []), ...(BK.macros.length ? ['Macros, Forms, and ActiveX Controls'] : [])],
    setReadOnly: (ro) => document.body.classList.toggle('xlro', ro),
    download: () => saveJSON(bookName, 'thx', adapter.serialize()),
    pageSetup: () => modal('<h3>Page Setup</h3><div class="tabs"><b>Page</b><span>Margins</span><span>Header/Footer</span><span>Sheet</span></div><p>Orientation: <label><input type="radio" name="po" checked> Portrait</label> <label><input type="radio" name="po"> Landscape</label></p><p>Scaling: Adjust to <input class="rs" value="100" style="width:50px">% normal size</p>', [['Cancel'], ['OK', 'primary']]),
  };
  return { FLAGS, BK, adapter, buildRibbon, switchSheet, insertSheet, deleteSheet, renameSheet, protectSheet, unprotectSheet, protectWorkbook, recordDialog, stopRecording, runMacro, macrosDialog, vba, toggleLock, isLocked, get REC() { return REC; }, renderTabs, sheetData, saveCur, macroBar, lastRun: null };
})();

XP.buildRibbon();
// re-run the initial load so the workbook model exists
loadBook(null);
if (typeof EXCEL_EXERCISES_PRO === 'function') runner.exercises.push(...EXCEL_EXERCISES_PRO());
Object.assign(api, {
  XP, get FILE() { return Office.FILE; },
  sheets: () => { XP.saveCur(); return XP.BK.sheets; },
  sheet: (name) => { XP.saveCur(); return XP.BK.sheets.find((s) => s.name === name); },
  cellOn(sheetName, a) { const sh = api.sheet(sheetName); return sh && sh.data.cells[a.toUpperCase()]; },
});
Office.init(XP.adapter, runner);
