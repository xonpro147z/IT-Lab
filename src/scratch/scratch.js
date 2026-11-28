// TinHocLab Scratch: khung thử thách + tự chấm bằng Scratch VM + tự lưu dự án (IndexedDB)
import { CHALLENGES, LEVELS, byId } from './challenges.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toast = (t) => { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2200); };

// ---------- tiến độ ----------
const PKEY = 'thl.scratch';
const prog = (() => { try { return JSON.parse(localStorage.getItem(PKEY)) || { done: {} }; } catch { return { done: {} }; } })();
const saveProg = () => { try { localStorage.setItem(PKEY, JSON.stringify(prog)); } catch {} };
const showProg = () => { $('#prog').textContent = `${Object.keys(prog.done).filter((k) => byId(k)).length}/${CHALLENGES.length}`; };

// ---------- lưu dự án vào IndexedDB ----------
const db = new Promise((res) => {
  try {
    const r = indexedDB.open('thl-scratch', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('p');
    r.onsuccess = () => res(r.result); r.onerror = () => res(null);
  } catch { res(null); }
});
const idb = async (mode, fn) => { const d = await db; if (!d) return null; return new Promise((res) => { const tx = d.transaction('p', mode); const q = fn(tx.objectStore('p')); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); };
const putProject = (buf) => idb('readwrite', (s) => s.put({ buf, t: Date.now() }, 'cur'));
const getProject = () => idb('readonly', (s) => s.get('cur'));
const delProject = () => idb('readwrite', (s) => s.delete('cur'));

// ---------- chờ VM ----------
const vmReady = new Promise((res) => {
  if (window.vm) return res(window.vm);
  window.addEventListener('thl-vm', (e) => res(e.detail), { once: true });
});

let vm, loadingOwn = false, saveTimer = 0;
const setSave = (t) => { $('#save').textContent = t; };

async function boot() {
  vm = await vmReady;
  // đợi Scratch nạp xong dự án mặc định
  for (let i = 0; i < 200 && !vm.runtime.targets.some((t) => !t.isStage); i++) await sleep(100);
  const saved = await getProject();
  if (saved && saved.buf) {
    try { loadingOwn = true; await vm.loadProject(saved.buf); setSave('đã mở dự án lần trước'); }
    catch (e) { console.warn('Không mở được dự án đã lưu', e); }
    finally { loadingOwn = false; }
  }
  vm.on('PROJECT_CHANGED', () => {
    if (loadingOwn || checking) return;
    setSave('đang lưu…'); clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try { const blob = await vm.saveProjectSb3(); await putProject(await blob.arrayBuffer()); setSave('đã lưu ✓'); }
      catch { setSave('không lưu được'); }
    }, 1500);
  });
  $('#boot').classList.add('gone');
  if (!$('#side').hidden) showSide(true);
  $('#bCheck').disabled = !cur;
}

// ---------- môi trường chấm ----------
const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[!.?,…]+$/g, '').trim();
const sprites = () => vm.runtime.targets.filter((t) => !t.isStage && t.isOriginal);
const allBlocks = () => vm.runtime.targets.flatMap((t) => Object.values(t.blocks._blocks || {}));
const findVar = (name) => {
  const n = norm(name);
  for (const t of vm.runtime.targets) for (const v of Object.values(t.variables || {})) if (v.type === '' && norm(v.name) === n) return v;
  return undefined;
};

function snapshot() {
  return vm.runtime.targets.map((t) => ({
    t, x: t.x, y: t.y, dir: t.direction, size: t.size, vis: t.visible, cos: t.currentCostume,
    vars: Object.fromEntries(Object.entries(t.variables || {}).map(([k, v]) => [k, JSON.parse(JSON.stringify(v.value))])),
  }));
}
function restore(snap) {
  for (const s of snap) {
    if (!vm.runtime.targets.includes(s.t)) continue;
    s.t.setXY(s.x, s.y); s.t.setDirection(s.dir); s.t.setSize(s.size); s.t.setVisible(s.vis); s.t.setCostume(s.cos);
    for (const [k, v] of Object.entries(s.vars)) if (s.t.variables[k]) s.t.variables[k].value = v;
  }
}

async function run(opts = {}) {
  const main = sprites()[0];
  if (!main) throw new Error('Dự án chưa có nhân vật nào.');
  vm.stopAll();
  await sleep(60);
  if (opts.setup) { const s = opts.setup; if (s.x !== undefined) main.setXY(s.x, s.y); if (s.dir !== undefined) main.setDirection(s.dir); }
  if (opts.resetVars) for (const [n, v] of Object.entries(opts.resetVars)) { const vr = findVar(n); if (vr) vr.value = v; }

  const says = [], sayAfterAnswer = [], path = [];
  let answered = false, costumeChanges = 0, lastCos = main.currentCostume;
  const answers = [...(opts.answers || [])];
  const onSay = (target, type, text) => {
    if (target && !target.isOriginal && target.sprite !== main.sprite) return;
    if (text === '' || text === undefined || text === null) return;
    says.push(String(text)); if (answered) sayAfterAnswer.push(String(text));
  };
  const onQ = (q) => {
    if (q === null) return;
    setTimeout(() => { answered = true; vm.runtime.emit('ANSWER', answers.length ? answers.shift() : ''); }, 120);
  };
  vm.runtime.on('SAY', onSay); vm.runtime.on('QUESTION', onQ);
  const samp = setInterval(() => {
    path.push([main.x, main.y]);
    if (main.currentCostume !== lastCos) { costumeChanges++; lastCos = main.currentCostume; }
  }, 8);
  path.push([main.x, main.y]);

  if (opts.flag) vm.greenFlag();
  for (const k of opts.keys || []) {
    await sleep(80);
    vm.postIOData('keyboard', { key: k, isDown: true });
    await sleep(60);
    vm.postIOData('keyboard', { key: k, isDown: false });
  }
  const t0 = Date.now(), max = opts.ms || 3000;
  let idle = 0;
  while (Date.now() - t0 < max) {
    await sleep(50);
    idle = vm.runtime.threads.length === 0 ? idle + 1 : 0;
    if (idle >= 4 && Date.now() - t0 > 300) break;
  }
  clearInterval(samp);
  path.push([main.x, main.y]);
  const out = {
    says, sayAfterAnswer, path, costumeChanges,
    main: { x: main.x, y: main.y, dir: main.direction },
    vars: {},
  };
  for (const n of Object.keys(opts.resetVars || {})) { const v = findVar(n); out.vars[n] = v ? v.value : undefined; }
  vm.runtime.off('SAY', onSay); vm.runtime.off('QUESTION', onQ);
  vm.stopAll();
  return out;
}

const env = {
  norm,
  has: (op) => allBlocks().some((b) => b.opcode === op),
  count: (op) => allBlocks().filter((b) => b.opcode === op).length,
  varValue: (n) => { const v = findVar(n); return v ? v.value : undefined; },
  run,
};

// ---------- giao diện thử thách ----------
let cur = null, checking = false;

function renderList() {
  const el = $('#list');
  let h = `<div class="intro"><b>Thử thách Scratch</b>Chọn một thử thách, lập trình trong Scratch rồi bấm <b>▶ Kiểm tra</b>. Máy sẽ chạy dự án của em và chấm ngay.</div>`;
  for (const lv of Object.keys(LEVELS)) {
    h += `<h3>CẤP ${lv} · ${LEVELS[lv].toUpperCase()}</h3>`;
    CHALLENGES.filter((c) => String(c.level) === lv).forEach((c, i) => {
      h += `<a data-id="${c.id}" class="${prog.done[c.id] ? 'done' : ''} ${cur && cur.id === c.id ? 'on' : ''}"><span class="st">${prog.done[c.id] ? '✓' : '○'}</span><span>${esc(c.title)}</span><small>${lv}.${i + 1}</small></a>`;
    });
  }
  h += `<h3>KHÁC</h3><a data-id=""><span class="st">·</span><span>Tự do sáng tạo (không chấm)</span><small></small></a>`;
  el.innerHTML = h;
}

function openChallenge(id) {
  cur = id ? byId(id) : null;
  $('#list').hidden = true;
  $('#bCheck').disabled = !cur || !vm;
  if (!cur) { $('#side').hidden = true; $('#crumb').innerHTML = ''; history.replaceState(null, '', location.pathname + location.search); return; }
  history.replaceState(null, '', location.pathname + location.search + '#' + cur.id);
  $('#crumb').innerHTML = `/ <b>${esc(cur.title)}</b>`;
  $('#sTitle').textContent = cur.title;
  $('#sBody').innerHTML = `<div class="lv">cấp ${cur.level} · ${esc(LEVELS[cur.level])}${prog.done[cur.id] ? ' · <span style="color:var(--ok)">✓ đã hoàn thành</span>' : ''}</div>${cur.body}<details><summary>Gợi ý</summary><p>${esc(cur.hint)}</p></details>`;
  $('#sRes').innerHTML = '';
  showSide(true);
}

// Khi mở bảng thử thách, chuyển sân khấu Scratch sang cỡ nhỏ để vừa màn hình; đóng bảng thì trả lại cỡ thường
function stageBtn(i) { return document.querySelectorAll('#scratch-root [class*="stage-header_stage-size-toggle-group"] button')[i]; }
function showSide(on) {
  $('#side').hidden = !on;
  const narrow = window.innerWidth < 1500;
  const b = stageBtn(on && narrow ? 0 : 1);
  if (b) b.click();
  window.dispatchEvent(new Event('resize'));
}

async function check() {
  if (!cur || !vm || checking) return;
  checking = true; $('#bCheck').disabled = true; $('#bCheck').textContent = '… đang chấm';
  if ($('#side').hidden) showSide(true);
  $('#sRes').innerHTML = '<div class="sum">Đang chạy dự án của em…</div>';
  const snap = snapshot();
  let items;
  try { items = await cur.check(env); }
  catch (e) { items = [{ name: 'Không chạy được dự án', ok: false, note: e.message }]; }
  finally { restore(snap); }
  const pass = items.filter((i) => i.ok).length, all = items.length, ok = pass === all;
  if (ok) { prog.done[cur.id] = Date.now(); saveProg(); showProg(); }
  $('#sRes').innerHTML = `<div class="sum ${ok ? 'ok' : 'bad'}">${ok ? '✓ Hoàn thành! 🎉' : '✗ Chưa đạt'} – ${pass}/${all}</div>` +
    items.map((i) => `<div class="it ${i.ok ? 'ok' : 'bad'}"><i>${i.ok ? '✓' : '✗'}</i><span>${esc(i.name)}${i.note ? `<small>${esc(i.note)}</small>` : ''}</span></div>`).join('');
  checking = false; $('#bCheck').disabled = false; $('#bCheck').textContent = '▶ Kiểm tra';
  window.__scratch.last = { id: cur.id, ok, items };
}

$('#bList').onclick = () => { renderList(); $('#list').hidden = !$('#list').hidden; };
$('#list').onclick = (e) => { const a = e.target.closest('a[data-id]'); if (a) openChallenge(a.dataset.id); };
$('#sClose').onclick = () => showSide(false);
$('#bCheck').onclick = check;
$('#bNew').onclick = async () => {
  if (!vm || !confirm('Xoá dự án hiện tại và bắt đầu dự án mới?\n(Muốn giữ lại, hãy dùng Tệp → Lưu về máy tính trước.)')) return;
  await delProject();
  location.reload();
};
window.addEventListener('thl-logo', () => { renderList(); $('#list').hidden = false; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#list').hidden = true; });

window.__scratch = { env, check, openChallenge, get vm() { return vm; } };
showProg();
const want = location.hash.slice(1);
if (want && byId(want)) openChallenge(want); else { renderList(); $('#list').hidden = false; }
boot();
