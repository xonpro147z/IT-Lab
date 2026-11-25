// Shared components for the Word / Excel / PowerPoint simulators (English UI)
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---- Title bar (Office 365 look) ----
function buildTitlebar({ app, letter }) {
  const tb = $('#titlebar');
  tb.innerHTML = `
    <div class="waffle" title="App launcher"><svg width="16" height="16" viewBox="0 0 16 16">${[0, 6, 12].map((x) => [0, 6, 12].map((y) => `<rect x="${x}" y="${y}" width="3.5" height="3.5" fill="#fff"/>`).join('')).join('')}</svg></div>
    <div class="applogo">${letter}</div>
    <div class="autosave">AutoSave <span class="toggle"></span><span>Off</span></div>
    <button class="qa" id="qaSave" title="Save (Ctrl+S)">${iconSVG('save', 16)}</button>
    <button class="qa" id="qaUndo" title="Undo (Ctrl+Z)">${iconSVG('undo', 16)}</button>
    <button class="qa" id="qaRedo" title="Redo (Ctrl+Y)">${iconSVG('redo', 16)}</button>
    ${app === 'PowerPoint' ? `<button class="qa" id="qaShow" title="Start From Beginning (F5)">${iconSVG('play', 16)}</button>` : ''}
    <div class="docname"><span id="docname">${app}</span><div class="search">${iconSVG('search', 14)}<input id="tellme" placeholder="Search (Alt+Q)"></div></div>
    <div class="spacer"></div>
    <button class="exbtn" id="btnEx">Practice Projects</button>
    <div class="user" id="user">ST</div>`;
  const ini = (Progress.student() || 'Student').trim().split(/\s+/).map((w) => w[0]).slice(-2).join('').toUpperCase();
  $('#user').textContent = ini; $('#user').title = Progress.student() || 'Student';
  // "Tell me" search: find a ribbon command by its label and click it
  $('#tellme').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = e.target.value.trim().toLowerCase(); if (!q) return;
    const btn = $$('#ribbon .rb, #ribbon [title]').find((b) => (b.title + ' ' + b.textContent).toLowerCase().includes(q));
    if (!btn) return toast(`No command found for "${e.target.value}"`, 'warn');
    const panel = btn.closest('.rpanel'); const tab = panel && $(`#tabs [data-tab="${panel.id.slice(3)}"]`); if (tab) tab.click();
    btn.style.outline = '2px solid #f29d2b'; setTimeout(() => (btn.style.outline = ''), 1500);
    e.target.value = ''; e.target.blur();
  });
  document.addEventListener('keydown', (e) => { if (e.altKey && e.key.toLowerCase() === 'q') { e.preventDefault(); $('#tellme').focus(); } });
}
function setDocTitle(name, app) { $('#docname').textContent = `${name} - ${app}`; document.title = `${name} - ${app}`; }

// ---- Ribbon tabs ----
function initRibbon(onFile) {
  applyIcons();
  $$('#tabs button[data-tab]').forEach((b) => b.addEventListener('click', () => {
    $$('#tabs button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    $$('.rpanel').forEach((p) => p.classList.toggle('on', p.id === 'rp-' + b.dataset.tab));
  }));
  const f = $('#tabs .file'); if (f) f.addEventListener('click', onFile);
  // keep the document selection when clicking ribbon buttons
  $('#ribbon').addEventListener('mousedown', (e) => { if (!e.target.closest('select,input')) e.preventDefault(); });
  // group dialog launchers
  $$('.grp .glabel').forEach((g) => { if (!g.querySelector('.launch')) g.insertAdjacentHTML('beforeend', '<svg class="launch" viewBox="0 0 12 12"><path d="M2 2h3M2 2v3M2 2l7 7M9 5v4H5" fill="none" stroke="#616161" stroke-width="1"/></svg>'); });
  $('#tabs').insertAdjacentHTML('beforeend', `<span class="tabsep"></span><span class="rbtn">💬 Comments</span><span class="rbtn share">Share ▾</span>`);
}

// ---- Dropdowns ----
let openDD = null;
function closeDropdown() { if (openDD) { openDD.remove(); openDD = null; } }
function dropdown(anchor, html, onPick) {
  closeDropdown();
  const d = document.createElement('div');
  d.className = 'dropdown'; d.innerHTML = html;
  document.body.appendChild(d);
  applyIcons(d);
  const r = anchor.getBoundingClientRect();
  d.style.left = Math.max(4, Math.min(r.left, innerWidth - d.offsetWidth - 8)) + 'px';
  d.style.top = Math.min(r.bottom + 2, innerHeight - d.offsetHeight - 6) + 'px';
  d.addEventListener('mousedown', (e) => e.preventDefault());
  d.addEventListener('click', (e) => { const it = e.target.closest('[data-v]'); if (it) { closeDropdown(); onPick(it.dataset.v, it); } });
  openDD = d;
  setTimeout(() => document.addEventListener('mousedown', function h(e) { if (!d.contains(e.target)) { closeDropdown(); document.removeEventListener('mousedown', h); } }), 0);
  return d;
}
const PALETTE = ['#000000', '#ffffff', '#e7e6e6', '#44546a', '#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47',
  '#7f7f7f', '#f2f2f2', '#d0cece', '#d6dce4', '#d9e2f3', '#fbe5d5', '#ededed', '#fff2cc', '#deebf6', '#e2efd9',
  '#595959', '#d8d8d8', '#aeaaaa', '#adb9ca', '#b4c6e7', '#f7cbac', '#dbdbdb', '#fee599', '#bdd7ee', '#c5e0b3',
  '#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'];
const COLOR_NAMES = { '#c00000': 'Dark Red', '#ff0000': 'Red', '#ffc000': 'Orange', '#ffff00': 'Yellow', '#92d050': 'Light Green', '#00b050': 'Green', '#00b0f0': 'Light Blue', '#0070c0': 'Blue', '#002060': 'Dark Blue', '#7030a0': 'Purple', '#000000': 'Black', '#ffffff': 'White' };
function colorPicker(anchor, onPick, { none = false, noneLabel = 'No Color' } = {}) {
  dropdown(anchor, `${none ? `<div class="it" data-v="none">${noneLabel}</div><div class="sep"></div>` : ''}<div class="hd">Theme Colors</div><div class="swatches">${PALETTE.slice(0, 30).map((c) => `<span data-v="${c}" title="${COLOR_NAMES[c] || c}" style="background:${c}"></span>`).join('')}</div><div class="hd">Standard Colors</div><div class="swatches">${PALETTE.slice(30).map((c) => `<span data-v="${c}" title="${COLOR_NAMES[c] || c}" style="background:${c}"></span>`).join('')}</div>`, onPick);
}

function modal(html, buttons = [['Close', 'primary']]) {
  return new Promise((resolve) => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal">${html}<div class="actions">${buttons.map(([t, c], i) => `<button class="btn ${c || ''}" data-i="${i}">${t}</button>`).join('')}</div></div>`;
    document.body.appendChild(bg);
    bg.querySelectorAll('.actions button').forEach((b) => b.onclick = () => { const v = $$('input,select,textarea', bg).map((x) => (x.type === 'checkbox' ? x.checked : x.value)); bg.remove(); resolve({ i: +b.dataset.i, v }); });
    const first = bg.querySelector('input'); if (first) setTimeout(() => first.focus(), 30);
    bg.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { const p = bg.querySelector('.btn.primary'); p && p.click(); } });
  });
}

// ---- Backstage (File tab) ----
function backstage(items, startTab) {
  const bs = document.createElement('div'); bs.id = 'backstage';
  bs.innerHTML = `<div class="bs-nav"><div data-k="back" class="back">⟵</div>${items.map((it, i) => `<div data-k="${i}">${it.label}</div>`).join('')}<div data-k="home" style="margin-top:30px">Exit to TinHocLab</div></div><div class="bs-body"></div>`;
  document.body.appendChild(bs);
  const body = bs.querySelector('.bs-body');
  const show = (i) => { const it = items[i]; if (it.render) { body.innerHTML = ''; it.render(body, () => bs.remove()); } else { bs.remove(); it.action(); } };
  bs.querySelector('.bs-nav').onclick = (e) => {
    const k = e.target.dataset.k; if (k === undefined) return;
    if (k === 'back') bs.remove(); else if (k === 'home') location.href = '../index.html'; else show(+k);
  };
  show(startTab || 0);
  return bs;
}

async function saveJSON(name, ext, obj) {
  const content = JSON.stringify(obj);
  if (window.desktop) { const r = await window.desktop.saveFile({ defaultName: name + '.' + ext, filters: [{ name: 'TinHocLab file', extensions: [ext] }], content }); if (r.ok) toast('Saved: ' + r.path, 'ok'); }
  else { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content])); a.download = name + '.' + ext; a.click(); }
}
async function openJSON(ext) {
  if (!window.desktop) return null;
  const r = await window.desktop.openFile({ filters: [{ name: 'TinHocLab file', extensions: [ext] }] });
  if (!r.ok) return null;
  try { return JSON.parse(r.content); } catch { toast('This file is not valid.', 'err'); return null; }
}
async function exportText(name, ext, label, content) {
  if (window.desktop) { const r = await window.desktop.saveFile({ defaultName: name + '.' + ext, filters: [{ name: label, extensions: [ext] }], content }); if (r.ok) toast('Exported: ' + r.path, 'ok'); }
}
async function pickImage() {
  if (window.desktop) { const r = await window.desktop.openImage(); return r.ok ? r.dataUrl : null; }
  return new Promise((res) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = () => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(i.files[0]); }; i.click(); });
}

// ---- MOS-style exam task pane ----
class TaskRunner {
  constructor({ app, exercises, load, api }) {
    Object.assign(this, { app, exercises, load, api });
    this.ex = null; this.cur = 0; this.results = null; this.marks = {}; this.t0 = 0; this.timer = null;
    this.pane = $('#taskpane');
  }
  listHTML() {
    return `<div class="exlist">${this.exercises.map((ex, i) => {
      const r = Progress.get(this.app, ex.id);
      return `<div class="excard" data-i="${i}"><span class="st">${r ? (r.score === r.max ? '✔ Completed' : `${r.score}/${r.max}`) : ''}</span><b>Project ${i + 1}: ${escapeHtml(ex.title)}</b><p>${escapeHtml(ex.intro)}</p><p style="color:#8a8886">${ex.tasks.length} tasks</p></div>`;
    }).join('')}</div>`;
  }
  renderPicker(body, close) {
    body.innerHTML = `<h2>Practice Projects</h2><p style="color:#616161;margin-top:-8px;font-size:13px">Choose a project, complete each task, then click <b>Submit project</b> to see your score.</p>${this.listHTML()}
      <h2 style="margin-top:30px;font-size:22px">Blank</h2><div class="exlist"><div class="excard" data-free="1"><b>Blank document</b><p>Free practice without scoring.</p></div></div>`;
    body.querySelectorAll('.excard').forEach((c) => c.onclick = () => { close(); if (c.dataset.free) this.free(); else this.start(this.exercises[+c.dataset.i]); });
  }
  free() { this.ex = null; this.pane.hidden = true; clearInterval(this.timer); this.load(null); }
  start(ex) {
    this.ex = ex; this.cur = 0; this.results = null; this.marks = {};
    this.load(ex);
    this.pane.hidden = false; this.pane.classList.remove('min');
    this.t0 = Date.now(); clearInterval(this.timer);
    this.timer = setInterval(() => { const el = $('#tpTimer'); if (el) el.textContent = this.elapsed(); }, 1000);
    this.render();
  }
  elapsed() { const s = Math.floor((Date.now() - this.t0) / 1000); const p = (x) => String(x).padStart(2, '0'); return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`; }
  render() {
    const ex = this.ex; if (!ex) return;
    const t = ex.tasks[this.cur]; const res = this.results; const mk = this.marks[this.cur] || {};
    const idx = this.exercises.indexOf(ex) + 1;
    this.pane.innerHTML = `<div class="tp-head"><span class="proj">Project ${idx} of ${this.exercises.length}</span><b>${escapeHtml(ex.title)}</b>
        <span class="timer" title="Time elapsed">⏱ <span id="tpTimer">${this.elapsed()}</span></span>
        <button class="hbtn" data-a="list">Projects</button><button class="hbtn" data-a="restart">Restart project</button><button class="hbtn submit" data-a="check">Submit project</button><button class="hbtn" data-a="min" title="Minimize">▾</button></div>
      <div class="tp-body"><div class="tp-tabs">${ex.tasks.map((_, i) => { const m = this.marks[i] || {}; const st = res ? (res[i] ? 'ok' : 'bad') : ''; return `<button data-i="${i}" class="${i === this.cur ? 'on' : ''} ${st}">Task ${i + 1}<span class="m">${res ? (res[i] ? '✔' : '✘') : (m.done ? '✓' : '') + (m.review ? ' ⚑' : '')}</span></button>`; }).join('')}</div>
      <div class="tp-text">${t.text}${res ? `<div class="res" style="color:${res[this.cur] ? '#107c10' : '#c50f1f'}">${res[this.cur] ? '✔ Correct' : '✘ Not correct yet' + (t.hint ? ' — Hint: ' + t.hint : '')}</div>` : ''}</div>
      <div class="tp-act"><label><input type="checkbox" data-m="done" ${mk.done ? 'checked' : ''}> Mark task complete</label><label><input type="checkbox" data-m="review" ${mk.review ? 'checked' : ''}> Mark for review</label>
        <div style="display:flex;gap:6px;margin-top:auto"><button class="btn" data-a="prev">◀ Previous</button><button class="btn" data-a="next">Next ▶</button></div></div></div>`;
    this.pane.querySelectorAll('.tp-tabs button').forEach((b) => b.onclick = () => { this.cur = +b.dataset.i; this.render(); });
    this.pane.querySelectorAll('[data-m]').forEach((c) => c.onchange = () => { this.marks[this.cur] = { ...(this.marks[this.cur] || {}), [c.dataset.m]: c.checked }; this.render(); });
    this.pane.onclick = async (e) => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'check') this.check();
      if (a === 'next') { this.cur = (this.cur + 1) % ex.tasks.length; this.render(); }
      if (a === 'prev') { this.cur = (this.cur - 1 + ex.tasks.length) % ex.tasks.length; this.render(); }
      if (a === 'min') { this.pane.classList.toggle('min'); e.target.textContent = this.pane.classList.contains('min') ? '▴' : '▾'; }
      if (a === 'restart') { const r = await modal('<h3>Restart project</h3><p>All changes you made in this project will be lost. Do you want to restart?</p>', [['Cancel'], ['Restart', 'primary']]); if (r.i === 1) this.start(ex); }
      if (a === 'list') this.onList && this.onList();
    };
  }
  check() {
    const ex = this.ex;
    this.results = ex.tasks.map((t) => { try { return !!t.check(this.api); } catch (err) { console.warn(err); return false; } });
    const score = this.results.filter(Boolean).length;
    Progress.record(this.app, ex.id, score, ex.tasks.length);
    this.render();
    const pct = Math.round(score / ex.tasks.length * 100);
    modal(`<h3>${score === ex.tasks.length ? '🎉 Excellent work!' : 'Project results'}</h3>
      <p><b>${escapeHtml(ex.title)}</b>${Progress.student() ? ' — ' + escapeHtml(Progress.student()) : ''} · Time: ${this.elapsed()}</p>
      <div style="font-size:30px;font-weight:700;color:${pct >= 80 ? '#107c10' : pct >= 50 ? '#b35c00' : '#c50f1f'}">${score}/${ex.tasks.length} tasks correct (${pct}%)</div>
      <div style="margin-top:10px">${ex.tasks.map((t, i) => `<div style="padding:3px 0">${this.results[i] ? '✅' : '❌'} Task ${i + 1}: ${t.text.replace(/<[^>]+>/g, '')}</div>`).join('')}</div>`);
  }
}

// ---- Shared shortcuts ----
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDropdown(); const bs = $('#backstage'); if (bs) bs.remove(); } });
