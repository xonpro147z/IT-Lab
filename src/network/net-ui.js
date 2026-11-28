// TinHocLab – Phòng Mạng: giao diện (vẽ sơ đồ, công cụ, cửa sổ thiết bị, dòng lệnh, mô phỏng, thử thách)
import { Net, TYPES, TAG_COLOR, ip2n, maskLen, sameNet, hostOk, netOf, lenMask } from './net-engine.js';
import { MISSIONS, LEVELS, byId } from './net-missions.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SVGNS = 'http://www.w3.org/2000/svg';
const toast = (t, k = '') => { const el = $('#toast'); el.textContent = t; el.className = 'on ' + k; clearTimeout(toast.t); toast.t = setTimeout(() => (el.className = ''), 2600); };

// ---------- biểu tượng ----------
const ICON = {
  pc: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2.5 19h19l-1.8-4H4.3z"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
  server: '<rect x="4" y="3" width="16" height="7" rx="1.5"/><rect x="4" y="14" width="16" height="7" rx="1.5"/><path d="M7.5 6.5h.01M7.5 17.5h.01M12 6.5h5M12 17.5h5"/>',
  switch: '<rect x="2.5" y="7" width="19" height="10" rx="2"/><path d="M6 11h2M10 11h2M14 11h2M6 14h2M10 14h2M14 14h2"/>',
  hub: '<rect x="3" y="8" width="18" height="8" rx="2"/><circle cx="7.5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="16.5" cy="12" r="1"/>',
  ap: '<path d="M2 9.5a14 14 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8 15.5a5.5 5.5 0 0 1 8 0"/><circle cx="12" cy="18.6" r="1"/>',
  router: '<rect x="3" y="12" width="18" height="7" rx="2"/><path d="M7 15.5h.01M10 15.5h.01M16.5 12V7M14 9.2a3.6 3.6 0 0 1 5 0"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 9.5 4.25 4.25 0 0 0 7 18z"/><path d="M12 16v-5M9.6 13.4 12 11l2.4 2.4"/>',
  ends: '<rect x="2" y="4" width="14" height="10" rx="1.6"/><path d="M6 18h6M9 14v4"/><rect x="16" y="9" width="6" height="11" rx="1.4"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  cable: '<circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="6" r="2.4"/><path d="M7.7 16.3l8.6-8.6"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24">${ICON[k]}</svg>`;
const DOCK = [
  { k: 'ends', label: 'Thiết bị đầu cuối', items: ['pc', 'laptop', 'phone'] },
  { k: 'router', label: 'Router', items: ['router'] },
  { k: 'switch', label: 'Switch & Hub', items: ['switch', 'hub'] },
  { k: 'ap', label: 'Không dây', items: ['ap'] },
  { k: 'server', label: 'Máy chủ', items: ['server'] },
  { k: 'cloud', label: 'Internet', items: ['cloud'] },
  { k: 'cable', label: 'Cáp mạng', tool: 'connect' },
];

// ---------- trạng thái ----------
const net = new Net();
const S = {
  view: { x: 0, y: 0, z: 1 }, tool: 'select', placing: null, sel: null, from: null, mode: 'rt', playing: false, stepping: false,
  filters: new Set(['ARP', 'ICMP', 'DHCP', 'DNS', 'HTTP']), mission: null, ctx: { sawArp: false }, cursor: null,
};
const term = {}; // nhật ký dòng lệnh theo thiết bị
const flashes = []; // dấu ✕ khi thiết bị bỏ gói
const PKEY = 'thl.net', prog = (() => { try { return JSON.parse(localStorage.getItem(PKEY)) || { done: {} }; } catch { return { done: {} }; } })();
const saveProg = () => { try { localStorage.setItem(PKEY, JSON.stringify(prog)); } catch {} };
const topoKey = () => 'thl.net.topo.' + (S.mission ? S.mission.id : 'free');
let saveT = 0;
const saveTopo = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(topoKey(), JSON.stringify(net.toJSON())); } catch {} }, 400); };

const svg = $('#svg'), world = $('#world'), gL = $('#gLinks'), gD = $('#gDevs'), gP = $('#gPkts'), rubber = $('#rubber');
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

// ---------- vẽ sơ đồ ----------
function center(d) { return { x: d.x, y: d.y }; }
function ipLabel(d) {
  if (d.type === 'cloud') return 'ISP · 100.64.0.1/30';
  const ips = d.ports.filter((p) => p.ip).map((p) => `${p.ip}/${Math.max(0, maskLen(p.mask))}`);
  if (TYPES[d.type].kind === 'switch' || d.type === 'hub') { const n = d.ports.filter((p) => p.link).length; return `${n}/${d.ports.length} cổng đang dùng`; }
  if (!ips.length) return d.dhcp ? 'DHCP – chưa có IP' : 'chưa có IP';
  return ips.length > 2 ? ips.slice(0, 2).join(' · ') + ' …' : ips.join(' · ');
}
function renderTopo() {
  gL.innerHTML = ''; gD.innerHTML = '';
  for (const l of net.links) {
    const A = net.dev(l.a.dev), B = net.dev(l.b.dev); if (!A || !B) continue;
    const a = center(A), b = center(B);
    const wifi = net.isWireless(l);
    el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'lk' + (wifi ? ' wifi' : '') + (S.sel && S.sel.link === l.id ? ' sel' : '') }, gL);
    const hit = el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'lkhit', 'data-link': l.id }, gL);
    el('title', {}, hit).textContent = `${A.name} ${A.ports[l.a.port].name} ↔ ${B.name} ${B.ports[l.b.port].name}${wifi ? ' (Wi-Fi)' : ''}`;
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
    for (const [P, s, port] of [[a, 1, A.ports[l.a.port]], [b, -1, B.ports[l.b.port]]]) {
      const px = P.x + ux * 40 * s, py = P.y + uy * 40 * s;
      el('circle', { cx: px, cy: py, r: 4, class: 'pt' }, gL);
      if (len > 170) { const lx = P.x + ux * 62 * s - uy * 11, ly = P.y + uy * 62 * s + ux * 11 + 3; const t = el('text', { x: lx, y: ly, class: 'pl', 'text-anchor': 'middle' }, gL); t.textContent = port.name; }
    }
  }
  for (const d of net.devs) {
    const g = el('g', { class: 'dv' + (S.sel && S.sel.dev === d.id ? ' sel' : '') + (S.from === d.id ? ' src' : ''), transform: `translate(${d.x},${d.y})`, 'data-id': d.id }, gD);
    el('rect', { x: -40, y: -40, width: 80, height: 80, rx: 26, fill: 'rgba(47,107,255,.22)', class: 'glow', filter: 'blur(10px)' }, g);
    el('rect', { x: -26, y: -26, width: 52, height: 52, rx: 13, class: 'bx' }, g);
    const ic = el('g', { class: 'ic', transform: 'translate(-12,-12)' }, g); ic.innerHTML = ICON[d.type];
    el('text', { x: 38, y: -3, class: 'nm' }, g).textContent = d.name;
    el('text', { x: 38, y: 15, class: 'ip' }, g).textContent = ipLabel(d);
  }
}
function applyView() { world.setAttribute('transform', `translate(${S.view.x},${S.view.y}) scale(${S.view.z})`); }
function toWorld(e) { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left - S.view.x) / S.view.z, y: (e.clientY - r.top - S.view.y) / S.view.z }; }
function fit() {
  const r = svg.getBoundingClientRect();
  if (!net.devs.length) { S.view = { x: r.width / 2 - 450, y: r.height / 2 - 300, z: 1 }; return applyView(); }
  const xs = net.devs.map((d) => d.x), ys = net.devs.map((d) => d.y);
  const x0 = Math.min(...xs) - 80, x1 = Math.max(...xs) + 220, y0 = Math.min(...ys) - 80, y1 = Math.max(...ys) + 80;
  const padR = S.mode === 'sim' ? 360 : 40, padB = 110, padL = 80;
  const z = Math.min(1.25, (r.width - padL - padR) / (x1 - x0), (r.height - 70 - padB) / (y1 - y0));
  S.view = { z, x: padL + ((r.width - padL - padR) - (x1 - x0) * z) / 2 - x0 * z, y: 60 + ((r.height - 60 - padB) - (y1 - y0) * z) / 2 - y0 * z };
  applyView();
}

// gói tin đang bay
function renderPackets() {
  gP.innerHTML = '';
  for (const it of net.inflight()) {
    const A = net.dev(it.from), B = net.dev(it.to); if (!A || !B) continue;
    const x = A.x + (B.x - A.x) * it.f, y = A.y + (B.y - A.y) * it.f;
    const tag = it.frame.type === 'arp' ? 'ARP' : ({ icmp: 'ICMP', dhcp: 'DHCP', dns: 'DNS', http: 'HTTP' }[it.frame.ip.app.kind] || 'IP');
    if (!S.filters.has(tag) && S.mode === 'sim') continue;
    const g = el('g', { class: 'pk', transform: `translate(${x - 11},${y - 8})` }, gP);
    el('rect', { x: 0, y: 0, width: 22, height: 15, rx: 2.5, fill: TAG_COLOR[tag] || '#fff' }, g);
    el('path', { d: 'M1.5 2l9.5 7 9.5-7' }, g);
  }
  const now = performance.now();
  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i]; if (now > f.until) { flashes.splice(i, 1); continue; }
    const D = net.dev(f.dev); if (!D) continue;
    const g = el('g', { transform: `translate(${D.x + 22},${D.y - 30})`, opacity: Math.min(1, (f.until - now) / 400) }, gP);
    el('path', { d: 'M-6 -6L6 6M6 -6L-6 6', class: 'drop' }, g);
  }
}

// ---------- vòng lặp thời gian ----------
let last = performance.now();
const RT_RATE = 7, SIM_RATE = 1.5;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (S.mode === 'rt') net.tick(dt * RT_RATE);
  else if (S.playing) net.tick(dt * SIM_RATE);
  renderPackets();
}

// ---------- sự kiện từ engine ----------
net.on((type, d) => {
  if (type === 'topo') { renderTopo(); saveTopo(); }
  if (type === 'config') { renderTopo(); saveTopo(); if (win.dev === d.id && win.tab === 'cfg' && !win.el.contains(document.activeElement)) renderWin(); }
  if (type === 'event') {
    if (d.drop && (S.mode === 'rt' || S.filters.has(d.tag))) flashes.push({ dev: d.atId, until: performance.now() + (S.mode === 'sim' ? 1600 : 700) });
    if (S.mode === 'sim') { if (d.tag === 'ARP') S.ctx.sawArp = true; addEvRow(d); if (S.stepping && S.filters.has(d.tag)) { S.playing = false; S.stepping = false; syncPlay(); } }
    if (win.dev && win.tab === 'mac') renderWin();
  }
  if (type === 'events') rebuildEv();
});

// ---------- công cụ & tương tác ----------
function setTool(t) {
  S.tool = t; S.from = null; rubber.setAttribute('d', ''); S.placing = null; svg.classList.remove('place');
  $$('#rail [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
  svg.className.baseVal = 'tool-' + t;
  $$('#dock button').forEach((b) => b.classList.toggle('on', t === 'connect' && b.dataset.k === 'cable'));
  hint(t === 'connect' ? 'Nối cáp: bấm thiết bị thứ nhất, rồi bấm thiết bị thứ hai' : t === 'pdu' ? 'Gửi gói tin: bấm máy GỬI, rồi bấm máy NHẬN' : t === 'delete' ? 'Xoá: bấm vào thiết bị hoặc dây cáp' : '');
  renderTopo();
}
let hintT = 0;
function hint(t, ms = 0) { const h = $('#hint'); h.textContent = t; h.classList.toggle('on', !!t); clearTimeout(hintT); if (ms) hintT = setTimeout(() => h.classList.remove('on'), ms); }
$$('#rail [data-tool]').forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));
$('#rail [data-act=zin]').onclick = () => zoomAt(1.2);
$('#rail [data-act=zout]').onclick = () => zoomAt(1 / 1.2);
$('#rail [data-act=fit]').onclick = fit;
function zoomAt(k, cx, cy) {
  const r = svg.getBoundingClientRect(); cx = cx ?? r.width / 2; cy = cy ?? r.height / 2;
  const z = Math.max(0.35, Math.min(2.5, S.view.z * k)); const f = z / S.view.z;
  S.view.x = cx - (cx - S.view.x) * f; S.view.y = cy - (cy - S.view.y) * f; S.view.z = z; applyView();
}
svg.addEventListener('wheel', (e) => { e.preventDefault(); const r = svg.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top); }, { passive: false });

let drag = null;
svg.addEventListener('pointerdown', (e) => {
  closePops();
  const dg = e.target.closest('.dv'), lk = e.target.closest('[data-link]');
  const p = toWorld(e);
  if (S.placing) { placeAt(S.placing, p); return; }
  if (dg) {
    const id = dg.dataset.id, D = net.dev(id);
    if (S.tool === 'delete') { net.remove(id); if (win.dev === id) closeWin(); S.sel = null; toast('Đã xoá ' + D.name); return; }
    if (S.tool === 'connect') {
      if (!S.from) { S.from = id; renderTopo(); hint(`Nối từ ${D.name}… bấm thiết bị thứ hai`); return; }
      const r = net.connect(S.from, id); toast(r.msg, r.ok ? 'ok' : 'err'); S.from = null; rubber.setAttribute('d', ''); renderTopo(); hint('Nối cáp: bấm thiết bị thứ nhất, rồi bấm thiết bị thứ hai'); return;
    }
    if (S.tool === 'pdu') return pduClick(D);
    S.sel = { dev: id }; renderTopo();
    drag = { kind: 'dev', id, ox: p.x - D.x, oy: p.y - D.y, moved: false };
    svg.setPointerCapture(e.pointerId);
    return;
  }
  if (lk) {
    if (S.tool === 'delete') { net.disconnect(lk.dataset.link); toast('Đã gỡ dây cáp'); return; }
    S.sel = { link: lk.dataset.link }; renderTopo(); return;
  }
  if (S.tool === 'connect' && S.from) { S.from = null; rubber.setAttribute('d', ''); renderTopo(); return; }
  S.sel = null; renderTopo();
  drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: S.view.x, vy: S.view.y }; svg.classList.add('panning'); svg.setPointerCapture(e.pointerId);
});
svg.addEventListener('pointermove', (e) => {
  const p = toWorld(e); S.cursor = p;
  if (S.tool === 'connect' && S.from) { const A = net.dev(S.from); if (A) rubber.setAttribute('d', `M${A.x},${A.y}L${p.x},${p.y}`); }
  if (!drag) return;
  if (drag.kind === 'dev') { const D = net.dev(drag.id); if (!D) return; D.x = Math.round(p.x - drag.ox); D.y = Math.round(p.y - drag.oy); drag.moved = true; renderTopo(); }
  else { S.view.x = drag.vx + e.clientX - drag.sx; S.view.y = drag.vy + e.clientY - drag.sy; applyView(); }
});
svg.addEventListener('pointerup', () => { if (drag && drag.kind === 'dev' && drag.moved) saveTopo(); drag = null; svg.classList.remove('panning'); });
svg.addEventListener('dblclick', (e) => { const dg = e.target.closest('.dv'); if (dg && S.tool === 'select') openWin(dg.dataset.id); });
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input,textarea,select')) return;
  if (e.key === 'Escape') { setTool('select'); closePops(); }
  if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { if (S.sel.dev) { if (win.dev === S.sel.dev) closeWin(); net.remove(S.sel.dev); } else net.disconnect(S.sel.link); S.sel = null; }
  const k = e.key.toLowerCase(); if (k === 'v') setTool('select'); if (k === 'c') setTool('connect'); if (k === 'p') setTool('pdu');
});

function pduClick(D) {
  if (TYPES[D.type].kind !== 'host' && D.type !== 'router') { toast('Hãy chọn máy tính, laptop, điện thoại, máy chủ hoặc router.', 'err'); return; }
  if (!S.from) { S.from = D.id; renderTopo(); hint(`Gửi từ ${D.name}… bấm máy NHẬN`); return; }
  const A = net.dev(S.from); S.from = null; renderTopo(); hint('Gửi gói tin: bấm máy GỬI, rồi bấm máy NHẬN');
  const dst = D.ports.find((p) => p.ip)?.ip;
  if (!dst) { toast(`${D.name} chưa có địa chỉ IP.`, 'err'); return; }
  if (S.mode === 'sim') hint('Đã tạo gói tin – bấm ▶ hoặc ⏭ ở Bảng mô phỏng để xem nó di chuyển', 3500);
  net.ping(A, dst, { count: 1, done: (st) => toast(st.recv ? `✓ ${A.name} → ${D.name}: thành công` : `✗ ${A.name} → ${D.name}: thất bại${st.err ? ' – ' + st.err : ''}`, st.recv ? 'ok' : 'err') });
}

// thanh thiết bị
const dock = $('#dock'), pop = $('#pop');
dock.innerHTML = DOCK.map((c) => `<button data-k="${c.k}">${icon(c.k)}<span class="tip">${c.label}</span></button>`).join('');
dock.onclick = (e) => {
  const b = e.target.closest('button'); if (!b) return; const c = DOCK.find((x) => x.k === b.dataset.k);
  if (c.tool) { closePops(); setTool(c.tool); return; }
  const open = !pop.hidden && pop.dataset.k === c.k; closePops(); if (open) return;
  pop.dataset.k = c.k; pop.hidden = false; b.classList.add('on');
  pop.innerHTML = c.items.map((t) => `<button data-t="${t}">${icon(t)}<span>${TYPES[t].label}</span></button>`).join('');
  const r = b.getBoundingClientRect(), sr = $('#stage').getBoundingClientRect(); pop.style.left = (r.left + r.width / 2 - sr.left) + 'px';
};
pop.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('button'); if (!b) return; e.preventDefault();
  S.placing = b.dataset.t; svg.classList.add('place'); $$('#pop button').forEach((x) => x.classList.toggle('on', x === b));
  hint(`Bấm vào vùng vẽ để đặt ${TYPES[S.placing].label} (hoặc kéo thả vào)`);
  const up = (ev) => { document.removeEventListener('pointerup', up); const sr = svg.getBoundingClientRect(); if (S.placing && ev.target.closest && ev.target.closest('#svg') && ev.clientY < sr.bottom - 80) placeAt(S.placing, toWorld(ev)); };
  document.addEventListener('pointerup', up);
});
function placeAt(t, p) {
  if (t === 'cloud' && net.devs.some((d) => d.type === 'cloud')) { toast('Sơ đồ đã có một đám mây Internet.', 'err'); S.placing = null; svg.classList.remove('place'); hint(''); return; }
  const D = net.add(t, Math.round(p.x), Math.round(p.y)); S.placing = null; svg.classList.remove('place'); closePops(); hint('');
  S.sel = { dev: D.id }; renderTopo(); toast(`Đã thêm ${D.name} – bấm đúp để cấu hình`);
}
function closePops() { pop.hidden = true; $$('#dock button').forEach((b) => b.classList.toggle('on', S.tool === 'connect' && b.dataset.k === 'cable')); $('#menu').hidden = true; }

// ---------- chế độ thời gian thực / mô phỏng ----------
$$('#modes button').forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
function setMode(m) {
  S.mode = m; S.playing = false; S.stepping = false;
  $$('#modes button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  $('#sim').hidden = m !== 'sim';
  fit();
  if (m === 'sim') { net.events = []; rebuildEv(); hint('Chế độ Mô phỏng: gói tin chỉ chạy khi em bấm ▶ hoặc ⏭', 3000); }
  syncPlay();
}
function syncPlay() { $('#bPlay').textContent = S.playing ? '❚❚' : '▶'; }
$('#bPlay').onclick = () => { S.playing = !S.playing; S.stepping = false; syncPlay(); };
$('#bStep').onclick = () => { if (!net.inflight().length && !net.q.length) { toast('Không có gói tin nào đang chờ. Hãy gửi gói tin trước.'); return; } S.playing = true; S.stepping = true; syncPlay(); };
const resetSim = () => { net.resetRuntime(); S.playing = false; syncPlay(); toast('Đã xoá các gói tin, bảng ARP và bảng MAC.'); };
$('#bBack').onclick = resetSim; $('#bReset').onclick = resetSim;
$('#flt').innerHTML = Object.keys(TAG_COLOR).map((t) => `<label><input type="checkbox" data-f="${t}" checked><i style="background:${TAG_COLOR[t]}"></i>${t}</label>`).join('');
$('#flt').onchange = (e) => { const t = e.target.dataset.f; if (!t) return; e.target.checked ? S.filters.add(t) : S.filters.delete(t); rebuildEv(); };
$('#bAll').onclick = () => { Object.keys(TAG_COLOR).forEach((t) => S.filters.add(t)); $$('#flt input').forEach((i) => (i.checked = true)); rebuildEv(); };
function evRow(ev, i) {
  return `<tr class="r" data-i="${i}"><td><svg viewBox="0 0 24 24" width="14" height="14" style="stroke:#888;fill:none;stroke-width:1.8"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></td><td>${(ev.t / 1000).toFixed(3)}</td><td>${esc(ev.last)}</td><td>${esc(ev.at)}</td><td class="ty${ev.drop ? ' dr' : ''}">${ev.tag}<i style="background:${ev.drop ? 'var(--red)' : TAG_COLOR[ev.tag]}"></i></td></tr>`;
}
function rebuildEv() {
  const list = net.events.map((e, i) => [e, i]).filter(([e]) => S.filters.has(e.tag)).slice(-300);
  $('#evBody').innerHTML = list.map(([e, i]) => evRow(e, i)).join('');
  $('#evEmpty').hidden = list.length > 0;
  const box = $('.evt'); box.scrollTop = box.scrollHeight;
}
function addEvRow(ev) {
  if (!S.filters.has(ev.tag)) return;
  const i = net.events.indexOf(ev); $('#evBody').insertAdjacentHTML('beforeend', evRow(ev, i)); $('#evEmpty').hidden = true;
  $$('#evBody tr.cur').forEach((r) => r.classList.remove('cur')); $('#evBody tr:last-child').classList.add('cur');
  const box = $('.evt'); box.scrollTop = box.scrollHeight;
}
$('#evBody').onclick = (e) => { const tr = e.target.closest('tr'); if (!tr) return; const ev = net.events[+tr.dataset.i]; if (ev) openPkt(ev); };

// ---------- chi tiết gói tin ----------
function openPkt(ev) {
  const f = ev.frame, P = $('#pkt'); const L = [];
  const mac = (m) => m === 'FF:FF:FF:FF:FF:FF' ? 'FF:FF:FF:FF:FF:FF <i style="color:#ffd400">(gửi tất cả)</i>' : m;
  L.push(`<div class="layer"><h5>Tầng 2 – Ethernet <span>địa chỉ vật lý (MAC)</span></h5><div><b>MAC nguồn</b>${f.eth.src}<br><b>MAC đích</b>${mac(f.eth.dst)}</div></div>`);
  if (f.type === 'arp') {
    const a = f.arp;
    L.push(`<div class="layer"><h5>ARP – ${a.op === 'req' ? 'hỏi' : 'trả lời'} <span>đổi IP → MAC</span></h5><div>${a.op === 'req' ? `"Ai có địa chỉ <b style="min-width:0;color:#ffd400">${a.tip}</b>? Hãy báo cho ${a.sip}."` : `"${a.sip} có MAC là ${a.smac}."`}<br><b>IP người gửi</b>${a.sip}<br><b>MAC người gửi</b>${a.smac}<br><b>IP cần tìm</b>${a.tip}</div></div>`);
  } else {
    const ip = f.ip, a = ip.app;
    L.push(`<div class="layer"><h5>Tầng 3 – IP <span>địa chỉ logic</span></h5><div><b>IP nguồn</b>${ip.src}<br><b>IP đích</b>${ip.dst}<br><b>TTL</b>${ip.ttl} <span class="mut">(mỗi router đi qua trừ 1)</span></div></div>`);
    const app = {
      icmp: () => ({ echo: 'Echo request – "Bạn có ở đó không?"', reply: 'Echo reply – "Có, mình đây!"', ttl: 'Time exceeded – hết TTL trên đường đi', unreach: 'Destination unreachable – không tới được đích' }[a.op] + `<br><b>Lần thứ</b>${a.seq}`),
      dhcp: () => ({ discover: 'DHCP Discover – "Có máy chủ DHCP nào không? Cho mình xin địa chỉ."', offer: `DHCP Offer – "Mình đề nghị cấp ${a.yiaddr}."`, request: `DHCP Request – "Mình xin nhận ${a.want}."`, ack: `DHCP Ack – "Đồng ý. Dùng ${a.yiaddr}, gateway ${a.gw || '—'}, DNS ${a.dns || '—'}."` }[a.op]),
      dns: () => (a.op === 'q' ? `DNS Query – "Địa chỉ IP của <b style="min-width:0;color:#c49bff">${esc(a.name)}</b> là gì?"` : `DNS Response – ${esc(a.name)} → ${a.ip || 'không tìm thấy'}`),
      http: () => (a.op === 'get' ? `HTTP GET http://${esc(a.host)}${esc(a.path || '/')}` : `HTTP 200 OK – trang "${esc(a.title)}"`),
    }[a.kind];
    L.push(`<div class="layer"><h5>Tầng ứng dụng – ${ev.tag} <span>${{ ICMP: 'kiểm tra kết nối', DHCP: 'xin địa chỉ IP', DNS: 'đổi tên → IP', HTTP: 'trang web' }[ev.tag] || ''}</span></h5><div>${app ? app() : ''}</div></div>`);
  }
  P.innerHTML = `<div class="wh"><span class="wic" style="background:${TAG_COLOR[ev.tag]}">${icon('folder').replace('<svg', '<svg style="stroke:#111"')}</span><div><b>Gói tin ${ev.tag}</b><div class="ty">${esc(ev.last)} → ${esc(ev.at)} · lúc ${(ev.t / 1000).toFixed(3)}</div></div><button class="x">×</button></div>
  <div class="wb"><div class="note" style="margin:0 0 12px;${ev.drop ? 'border-color:#7a2c2d' : ''}"><b>Tại ${esc(ev.at)}:</b> ${esc(ev.note)}</div>${L.join('')}</div>`;
  P.hidden = false; $('.x', P).onclick = () => (P.hidden = true); dragWin(P);
}

// ---------- cửa sổ thiết bị ----------
const win = { el: $('#win'), dev: null, tab: null };
function tabsFor(D) {
  const k = TYPES[D.type].kind;
  if (k === 'host') return D.type === 'server' ? [['cfg', 'Cấu hình'], ['svc', 'Dịch vụ'], ['cmd', 'Dòng lệnh'], ['web', 'Trình duyệt']] : [['cfg', 'Cấu hình'], ['cmd', 'Dòng lệnh'], ['web', 'Trình duyệt']];
  if (k === 'router') return [['ports', 'Cổng'], ['routes', 'Định tuyến'], ['cmd', 'Dòng lệnh']];
  if (k === 'switch') return [['sports', 'Cổng'], ['mac', 'Bảng MAC']];
  if (k === 'hub') return [['sports', 'Cổng']];
  return [['info', 'Thông tin']];
}
function openWin(id, tab) {
  const D = net.dev(id); if (!D) return;
  win.dev = id; win.tab = tab || tabsFor(D)[0][0]; win.el.hidden = false; renderWin();
}
function closeWin() { win.el.hidden = true; win.dev = null; }
function renderWin() {
  const D = net.dev(win.dev); if (!D) return closeWin();
  const W = win.el;
  W.innerHTML = `<div class="wh"><span class="wic">${icon(D.type)}</span><div><input id="wName" value="${esc(D.name)}" spellcheck="false"><div class="ty">${TYPES[D.type].label}</div></div><button class="x" id="wX">×</button></div>
  <div class="wt">${tabsFor(D).map(([k, t]) => `<button data-t="${k}" class="${k === win.tab ? 'on' : ''}">${t}</button>`).join('')}</div><div class="wb" id="wb"></div>`;
  $('#wX').onclick = closeWin;
  $('#wName').onchange = (e) => { const v = e.target.value.trim(); if (!v) return; if (net.devs.some((x) => x !== D && x.name === v)) { toast('Đã có thiết bị trùng tên.', 'err'); e.target.value = D.name; return; } D.name = v; renderTopo(); saveTopo(); };
  $$('.wt button', W).forEach((b) => (b.onclick = () => { win.tab = b.dataset.t; renderWin(); }));
  dragWin(W);
  ({ cfg: tabCfg, svc: tabSvc, cmd: tabCmd, web: tabWeb, ports: tabPorts, routes: tabRoutes, sports: tabSPorts, mac: tabMac, info: tabInfo })[win.tab](D, $('#wb'));
}
function dragWin(W) {
  const h = $('.wh', W); if (!h || h._d) return; h._d = true;
  h.addEventListener('pointerdown', (e) => {
    if (e.target.closest('input,button')) return;
    const r = W.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
    const mv = (ev) => { W.style.left = Math.max(0, ev.clientX - sx) + 'px'; W.style.top = Math.max(0, ev.clientY - sy) + 'px'; W.style.right = 'auto'; };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  });
}
const isIp = (v) => ip2n(v) !== null;
function defMask(ip) { const a = ip2n(ip); if (a === null) return ''; const f = a >>> 24; return f < 128 ? '255.0.0.0' : f < 192 ? '255.255.0.0' : '255.255.255.0'; }
function bindIp(input, onOk, { allowEmpty = true, mask = false } = {}) {
  const val = () => input.value.trim();
  const ok = () => { const v = val(); return (allowEmpty && !v) || (mask ? maskLen(v) >= 0 : isIp(v)); };
  input.addEventListener('input', () => input.classList.toggle('bad', !ok()));
  input.addEventListener('change', () => { if (ok()) onOk(val()); else toast(mask ? 'Subnet mask không hợp lệ (ví dụ 255.255.255.0).' : 'Địa chỉ không hợp lệ – gồm 4 số từ 0 đến 255, ví dụ 192.168.1.10.', 'err'); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
}
function hostWarnings(D) {
  const p = D.ports[0], w = [];
  if (!p.link) w.push('Máy chưa được cắm dây mạng.');
  if (p.ip && p.mask && maskLen(p.mask) >= 0 && !hostOk(p.ip, p.mask)) w.push(`${p.ip} là địa chỉ mạng hoặc địa chỉ quảng bá – không đặt cho máy được.`);
  if (p.ip && net.devs.some((x) => x !== D && x.ports.some((q) => q.ip === p.ip))) w.push(`Trùng địa chỉ IP với ${net.devs.find((x) => x !== D && x.ports.some((q) => q.ip === p.ip)).name}!`);
  if (D.gw && p.ip && maskLen(p.mask) >= 0 && !sameNet(D.gw, p.ip, p.mask)) w.push('Default Gateway không cùng mạng với địa chỉ IP của máy.');
  if (p.ip && p.ip.startsWith('169.254.')) w.push('Địa chỉ 169.254.x.x nghĩa là máy KHÔNG xin được IP từ DHCP.');
  return w;
}
function tabCfg(D, B) {
  const p = D.ports[0], dh = D.dhcp;
  B.innerHTML = `<div class="fg">
    <label>Cách lấy địa chỉ</label><div><span class="seg"><button data-m="0" class="${dh ? '' : 'on'}">Tĩnh (tự nhập)</button><button data-m="1" class="${dh ? 'on' : ''}">DHCP (tự động)</button></span></div>
    <label>Địa chỉ IP</label><input class="in" id="fIp" value="${esc(p.ip)}" placeholder="vd. 192.168.1.10" ${dh ? 'readonly' : ''}>
    <label>Subnet mask</label><input class="in" id="fMask" value="${esc(p.mask)}" placeholder="vd. 255.255.255.0" ${dh ? 'readonly' : ''}>
    <label>Default Gateway</label><input class="in" id="fGw" value="${esc(D.gw)}" placeholder="địa chỉ router, vd. 192.168.1.1" ${dh ? 'readonly' : ''}>
    <label>DNS Server</label><input class="in" id="fDns" value="${esc(D.dns)}" placeholder="vd. 8.8.8.8" ${dh ? 'readonly' : ''}>
    <label>Địa chỉ MAC</label><input class="in" value="${p.mac}" readonly>
  </div>
  ${hostWarnings(D).map((w) => `<div class="note" style="border-color:#6b5a1d;color:#ffd98a">⚠ ${esc(w)}</div>`).join('')}
  <div class="note"><b>Mẹo:</b> hai máy nói chuyện trực tiếp được khi <b>cùng mạng</b> – tức là phần mạng của địa chỉ (theo Subnet mask) giống nhau. Muốn sang mạng khác phải đi qua <b>Default Gateway</b> (router).${p.ip && maskLen(p.mask) >= 0 ? `<br>Mạng của máy này: <code>${netOf(p.ip, p.mask)}/${maskLen(p.mask)}</code>` : ''}</div>`;
  $$('.seg button', B).forEach((b) => (b.onclick = () => {
    const want = b.dataset.m === '1'; if (want === D.dhcp) return; D.dhcp = want; saveTopo();
    if (want) { toast('Đang xin địa chỉ từ máy chủ DHCP…'); net.dhcpRenew(D, (err) => { toast(err ? err : `${D.name} đã nhận IP ${D.ports[0].ip}`, err ? 'err' : 'ok'); renderTopo(); if (win.dev === D.id) renderWin(); }); }
    renderWin();
  }));
  if (dh) return;
  bindIp($('#fIp', B), (v) => { p.ip = v; if (v && !p.mask) p.mask = defMask(v); D.rt.arp = {}; net.emit('config', D); renderWin(); });
  bindIp($('#fMask', B), (v) => { p.mask = v; net.emit('config', D); renderWin(); }, { mask: true });
  bindIp($('#fGw', B), (v) => { D.gw = v; net.emit('config', D); renderWin(); });
  bindIp($('#fDns', B), (v) => { D.dns = v; net.emit('config', D); });
}
function tabSvc(D, B) {
  const s = D.svc;
  B.innerHTML = `<fieldset><legend>DHCP – tự động cấp địa chỉ IP</legend><label class="sw"><input type="checkbox" id="dOn" ${s.dhcp.on ? 'checked' : ''}> Bật dịch vụ DHCP</label>
    <div class="fg"><label>Địa chỉ bắt đầu</label><input class="in" id="dStart" value="${esc(s.dhcp.start)}" placeholder="vd. 192.168.1.100"><label>Số địa chỉ tối đa</label><input class="in" id="dCount" type="number" min="1" max="250" value="${s.dhcp.count}"><label>Subnet mask</label><input class="in" id="dMask" value="${esc(s.dhcp.mask)}"><label>Default Gateway cấp cho máy</label><input class="in" id="dGw" value="${esc(s.dhcp.gw)}"><label>DNS Server cấp cho máy</label><input class="in" id="dDns" value="${esc(s.dhcp.dns)}"></div></fieldset>
  <fieldset><legend>DNS – đổi tên miền thành địa chỉ IP</legend><label class="sw"><input type="checkbox" id="nOn" ${s.dns.on ? 'checked' : ''}> Bật dịch vụ DNS</label>
    <table class="tbl"><thead><tr><th>Tên miền</th><th>Địa chỉ IP</th><th></th></tr></thead><tbody>${s.dns.records.map((r, i) => `<tr><td><code>${esc(r.name)}</code></td><td><code>${esc(r.ip)}</code></td><td><button class="btn" data-del="${i}">Xoá</button></td></tr>`).join('') || '<tr><td colspan="3" class="mut">Chưa có bản ghi nào.</td></tr>'}</tbody></table>
    <div style="display:flex;gap:8px;margin-top:10px"><input class="in" id="nName" placeholder="tên, vd. web.lop.vn"><input class="in" id="nIp" placeholder="IP, vd. 192.168.1.5"><button class="btn pri" id="nAdd">Thêm</button></div></fieldset>
  <fieldset><legend>Web (HTTP) – trang web của máy chủ</legend><label class="sw"><input type="checkbox" id="wOn" ${s.web.on ? 'checked' : ''}> Bật dịch vụ Web</label>
    <div class="fg"><label>Tiêu đề trang</label><input class="in" id="wTitle" value="${esc(s.web.title)}" style="font-family:var(--sans)"><label>Nội dung</label><textarea class="in" id="wBody" rows="4" style="font-family:var(--sans);resize:vertical">${esc(s.web.body)}</textarea></div></fieldset>`;
  const sv = () => saveTopo();
  $('#dOn', B).onchange = (e) => { s.dhcp.on = e.target.checked; if (s.dhcp.on && !s.dhcp.start && D.ports[0].ip) { const n = ip2n(D.ports[0].ip); s.dhcp.start = netOf(D.ports[0].ip, D.ports[0].mask || '255.255.255.0').replace(/\d+$/, '100'); s.dhcp.mask = D.ports[0].mask || '255.255.255.0'; void n; renderWin(); } sv(); };
  bindIp($('#dStart', B), (v) => { s.dhcp.start = v; sv(); }); bindIp($('#dMask', B), (v) => { s.dhcp.mask = v; sv(); }, { mask: true });
  bindIp($('#dGw', B), (v) => { s.dhcp.gw = v; sv(); }); bindIp($('#dDns', B), (v) => { s.dhcp.dns = v; sv(); });
  $('#dCount', B).onchange = (e) => { s.dhcp.count = Math.max(1, Math.min(250, +e.target.value || 1)); sv(); };
  $('#nOn', B).onchange = (e) => { s.dns.on = e.target.checked; sv(); };
  $('#nAdd', B).onclick = () => { const n = $('#nName', B).value.trim().toLowerCase(), ip = $('#nIp', B).value.trim(); if (!n || !isIp(ip)) { toast('Nhập tên miền và một địa chỉ IP hợp lệ.', 'err'); return; } s.dns.records = s.dns.records.filter((r) => r.name !== n); s.dns.records.push({ name: n, ip }); sv(); renderWin(); };
  $$('[data-del]', B).forEach((b) => (b.onclick = () => { s.dns.records.splice(+b.dataset.del, 1); sv(); renderWin(); }));
  $('#wOn', B).onchange = (e) => { s.web.on = e.target.checked; sv(); };
  $('#wTitle', B).onchange = (e) => { s.web.title = e.target.value; sv(); }; $('#wBody', B).onchange = (e) => { s.web.body = e.target.value; sv(); };
}
function peerName(D, i) { const p = net.peer(D, i); return p ? `${p.dev.name} (${p.dev.ports[p.port].name})` : ''; }
function tabPorts(D, B) {
  B.innerHTML = `<table class="tbl"><thead><tr><th>Cổng</th><th>Nối tới</th><th>Địa chỉ IP</th><th>Subnet mask</th><th>DHCP</th></tr></thead><tbody>
  ${D.ports.map((p, i) => `<tr><td><span class="dot ${p.link ? 'on' : ''}"></span>${p.name}</td><td class="mut" style="font-size:11.5px">${esc(peerName(D, i)) || '—'}</td><td><input class="in" data-ip="${i}" value="${esc(p.ip)}" placeholder="—"></td><td><input class="in" data-mask="${i}" value="${esc(p.mask)}" placeholder="—"></td><td><input type="checkbox" data-dh="${i}" ${p.pool && p.pool.on ? 'checked' : ''} title="Cấp DHCP cho mạng ở cổng này"></td></tr>
  ${p.pool && p.pool.on ? `<tr><td></td><td colspan="4"><div style="display:flex;gap:8px;align-items:center;font-size:12px"><span class="mut">Cấp từ</span><input class="in" data-ps="${i}" value="${esc(p.pool.start)}" style="width:140px"><span class="mut">số lượng</span><input class="in" data-pc="${i}" type="number" value="${p.pool.count}" style="width:70px"><span class="mut">DNS</span><input class="in" data-pd="${i}" value="${esc(p.pool.dns)}" placeholder="vd. 8.8.8.8" style="width:120px"></div></td></tr>` : ''}`).join('')}
  </tbody></table>
  <div class="note"><b>Router</b> nối nhiều mạng với nhau. Mỗi cổng thuộc một mạng riêng và có một địa chỉ IP trong mạng đó – các máy trong mạng dùng địa chỉ này làm <b>Default Gateway</b>.<br>Tích <b>DHCP</b> để router tự cấp địa chỉ cho các máy ở cổng đó (gateway = địa chỉ của cổng).</div>`;
  const sync = (p) => { if (p.pool) { p.pool.gw = p.ip; p.pool.mask = p.mask || '255.255.255.0'; } };
  $$('[data-ip]', B).forEach((inp) => bindIp(inp, (v) => { const p = D.ports[+inp.dataset.ip]; p.ip = v; if (v && !p.mask) p.mask = defMask(v); sync(p); D.rt.arp = {}; net.emit('config', D); renderWin(); }));
  $$('[data-mask]', B).forEach((inp) => bindIp(inp, (v) => { const p = D.ports[+inp.dataset.mask]; p.mask = v; sync(p); net.emit('config', D); }, { mask: true }));
  $$('[data-dh]', B).forEach((c) => (c.onchange = () => {
    const p = D.ports[+c.dataset.dh];
    if (c.checked && !p.ip) { toast('Hãy đặt địa chỉ IP cho cổng trước.', 'err'); c.checked = false; return; }
    p.pool = p.pool || { on: false, start: netOf(p.ip, p.mask || '255.255.255.0').replace(/\d+$/, '100'), count: 50, mask: p.mask, gw: p.ip, dns: '' };
    p.pool.on = c.checked; sync(p); saveTopo(); renderWin();
  }));
  $$('[data-ps]', B).forEach((inp) => bindIp(inp, (v) => { D.ports[+inp.dataset.ps].pool.start = v; saveTopo(); }));
  $$('[data-pd]', B).forEach((inp) => bindIp(inp, (v) => { D.ports[+inp.dataset.pd].pool.dns = v; saveTopo(); }));
  $$('[data-pc]', B).forEach((inp) => (inp.onchange = () => { D.ports[+inp.dataset.pc].pool.count = Math.max(1, Math.min(250, +inp.value || 1)); saveTopo(); }));
}
function tabRoutes(D, B) {
  const conn = D.ports.filter((p) => p.ip && p.link && maskLen(p.mask) >= 0);
  B.innerHTML = `<table class="tbl"><thead><tr><th></th><th>Mạng đích</th><th>Mask</th><th>Đi qua</th><th></th></tr></thead><tbody>
  ${conn.map((p) => `<tr><td><b>C</b></td><td><code>${netOf(p.ip, p.mask)}</code></td><td><code>${p.mask}</code></td><td class="mut">nối trực tiếp · ${p.name}</td><td></td></tr>`).join('')}
  ${D.routes.map((r, i) => `<tr><td><b>S</b></td><td><code>${esc(r.net)}</code></td><td><code>${esc(r.mask)}</code></td><td><code>${esc(r.via)}</code></td><td><button class="btn" data-del="${i}">Xoá</button></td></tr>`).join('')}
  ${!conn.length && !D.routes.length ? '<tr><td colspan="5" class="mut">Bảng định tuyến đang trống – hãy đặt IP cho các cổng có cắm dây.</td></tr>' : ''}</tbody></table>
  <div style="display:flex;gap:8px;margin-top:12px"><input class="in" id="rNet" placeholder="mạng đích, vd. 0.0.0.0"><input class="in" id="rMask" placeholder="mask, vd. 0.0.0.0"><input class="in" id="rVia" placeholder="qua, vd. 100.64.0.1"><button class="btn pri" id="rAdd">Thêm</button></div>
  <div class="note"><b>C</b> = mạng nối trực tiếp (router tự biết). <b>S</b> = tuyến tĩnh em tự thêm.<br>Tuyến <code>0.0.0.0</code> / <code>0.0.0.0</code> là <b>tuyến mặc định</b>: "không biết gửi đi đâu thì gửi qua đây" – thường trỏ ra Internet.</div>`;
  $('#rAdd', B).onclick = () => {
    const n = $('#rNet', B).value.trim(), m = $('#rMask', B).value.trim(), v = $('#rVia', B).value.trim();
    if (!isIp(n) || maskLen(m) < 0 || !isIp(v)) { toast('Nhập đủ mạng đích, mask và địa chỉ "đi qua" hợp lệ.', 'err'); return; }
    if (!D.ports.some((p) => p.ip && maskLen(p.mask) >= 0 && sameNet(v, p.ip, p.mask))) toast('Lưu ý: địa chỉ "đi qua" phải nằm trong mạng của một cổng router.', 'err');
    D.routes.push({ net: netOf(n, m), mask: m, via: v }); saveTopo(); renderWin();
  };
  $$('[data-del]', B).forEach((b) => (b.onclick = () => { D.routes.splice(+b.dataset.del, 1); saveTopo(); renderWin(); }));
}
function tabSPorts(D, B) {
  B.innerHTML = `<table class="tbl"><thead><tr><th>Cổng</th><th>Nối tới</th><th>MAC của cổng</th></tr></thead><tbody>${D.ports.map((p, i) => `<tr><td><span class="dot ${p.link ? 'on' : ''}"></span>${p.name}</td><td>${esc(peerName(D, i)) || '<span class="mut">—</span>'}</td><td class="mut"><code>${p.mac}</code></td></tr>`).join('')}</tbody></table>
  <div class="note">${D.type === 'hub' ? '<b>Hub</b> rất "ngây thơ": nhận khung ở cổng nào thì phát lại ra <b>tất cả</b> cổng còn lại. Mọi máy đều nhận được, máy không phải người nhận sẽ bỏ qua – vì thế mạng dùng hub chậm và kém an toàn.' : D.type === 'ap' ? '<b>Bộ phát Wi-Fi</b> (Access Point) hoạt động như một switch, chỉ khác là nối với máy bằng sóng thay cho dây. Đường <b>nét đứt</b> trên sơ đồ là kết nối Wi-Fi.' : '<b>Switch</b> thông minh hơn hub: nó <b>học</b> xem địa chỉ MAC nào nằm ở cổng nào (xem thẻ Bảng MAC) rồi chỉ gửi khung tới đúng cổng cần thiết.'} Switch và hub không cần địa chỉ IP.</div>`;
}
function tabMac(D, B) {
  const rows = Object.entries(D.rt.mac);
  B.innerHTML = `<table class="tbl"><thead><tr><th>Địa chỉ MAC</th><th>Ở cổng</th><th>Của thiết bị</th></tr></thead><tbody>${rows.map(([m, pi]) => { const owner = net.devs.find((x) => x.ports.some((p) => p.mac === m)); return `<tr><td><code>${m}</code></td><td>${D.ports[pi].name}</td><td class="mut">${owner ? esc(owner.name) : ''}</td></tr>`; }).join('') || '<tr><td colspan="3" class="mut">Bảng trống – switch chưa thấy khung nào. Hãy ping giữa các máy rồi xem lại.</td></tr>'}</tbody></table>
  <div class="note">Mỗi khi một khung đi vào, switch ghi lại <b>MAC nguồn</b> và <b>cổng</b> nó đi vào. Lần sau có khung gửi tới MAC đó, switch chỉ gửi ra đúng cổng ấy.</div>`;
}
function tabInfo(D, B) {
  B.innerHTML = `<div class="note" style="margin:0"><b>Internet (nhà cung cấp dịch vụ – ISP)</b><br><br>
  Địa chỉ cổng WAN của ISP: <code>100.64.0.1</code> / <code>255.255.255.252</code><br>
  Router nhà em nối vào đây cần: cổng có IP <code>100.64.0.2</code> / <code>255.255.255.252</code> và <b>tuyến mặc định</b> <code>0.0.0.0/0</code> qua <code>100.64.0.1</code>.<br><br>
  Máy chủ DNS ngoài Internet: <code>8.8.8.8</code>, <code>1.1.1.1</code><br>
  Trang web có thể vào: <code>tinhoc.vn</code>, <code>hoctap.vn</code>, <code>thuvien.vn</code><br><br>
  <span class="mut">Trong thực tế router gia đình còn làm NAT (đổi địa chỉ riêng 192.168.x.x thành một địa chỉ công cộng). Ở đây đã được làm sẵn để em tập trung vào gateway, định tuyến và DNS.</span></div>`;
}

// ---------- dòng lệnh ----------
function T(D) { return (term[D.id] = term[D.id] || { lines: [{ t: TYPES[D.type].kind === 'router' ? `${D.name} – gõ "help" để xem các lệnh.` : 'TinHocLab Command Prompt – gõ "help" để xem các lệnh.', c: 'vi' }], hist: [], hi: 0, busy: false }); }
function prompt(D) { return TYPES[D.type].kind === 'router' ? `${D.name}#` : 'C:\\>'; }
function tabCmd(D, B) {
  const st = T(D);
  B.innerHTML = `<div class="term" id="term"></div>`;
  const box = $('#term', B);
  const draw = () => {
    box.innerHTML = st.lines.map((l) => `<div class="${l.c || ''}">${esc(l.t) || '&nbsp;'}</div>`).join('') + (st.busy ? '' : `<div class="line"><span class="cmd">${esc(prompt(D))}&nbsp;</span><input id="tin" spellcheck="false" autocomplete="off"></div>`);
    box.scrollTop = box.scrollHeight;
    const inp = $('#tin', box); if (!inp) return;
    inp.focus();
    inp.onkeydown = (e) => {
      if (e.key === 'Enter') { const v = inp.value; st.hist.push(v); st.hi = st.hist.length; st.lines.push({ t: prompt(D) + ' ' + v, c: 'cmd' }); run(D, v.trim(), st, draw); draw(); }
      if (e.key === 'ArrowUp') { st.hi = Math.max(0, st.hi - 1); inp.value = st.hist[st.hi] || ''; e.preventDefault(); }
      if (e.key === 'ArrowDown') { st.hi = Math.min(st.hist.length, st.hi + 1); inp.value = st.hist[st.hi] || ''; e.preventDefault(); }
    };
  };
  st.redraw = () => { if (win.dev === D.id && win.tab === 'cmd') draw(); };
  box.onclick = () => $('#tin', box)?.focus();
  draw();
}
function run(D, cmd, st, draw) {
  const out = (t, c = '') => { st.lines.push({ t, c }); if (st.lines.length > 400) st.lines.splice(0, 100); st.redraw && st.redraw(); };
  const busy = (on) => { st.busy = on; st.redraw && st.redraw(); };
  const simNote = () => { if (S.mode === 'sim') out('(Đang ở chế độ Mô phỏng – bấm ▶ hoặc ⏭ ở Bảng mô phỏng để gói tin chạy.)', 'vi'); };
  if (!cmd) return;
  const [c0, ...args] = cmd.split(/\s+/); const c = c0.toLowerCase();
  const isR = TYPES[D.type].kind === 'router';
  if (c === 'help' || c === '?') {
    (isR ? ['ping <địa chỉ>            kiểm tra kết nối', 'traceroute <địa chỉ>      xem đường đi qua các router', 'show ip route             bảng định tuyến', 'show ip interface brief   địa chỉ các cổng', 'show arp                  bảng ARP (IP ↔ MAC)', 'clear                     xoá màn hình']
      : ['ipconfig            xem địa chỉ IP của máy', 'ipconfig /all       xem đầy đủ (MAC, DNS, DHCP)', 'ipconfig /renew     xin lại địa chỉ từ DHCP', 'ping <IP hoặc tên>  kiểm tra kết nối tới máy khác', 'tracert <IP/tên>    xem gói tin đi qua những router nào', 'nslookup <tên>      hỏi DNS địa chỉ IP của một tên miền', 'arp -a              bảng ARP: IP ↔ MAC máy đã biết', 'hostname            tên máy', 'cls                 xoá màn hình']).forEach((l) => out(l));
    return;
  }
  if (c === 'cls' || c === 'clear') { st.lines = []; st.redraw(); return; }
  if (c === 'hostname') return out(D.name);
  if (c === 'ping') {
    const ni = args.indexOf('-n'); const count = ni >= 0 ? Math.max(1, Math.min(10, +args[ni + 1] || 4)) : 4;
    const tg = args.find((a, i) => !a.startsWith('-') && !(ni >= 0 && i === ni + 1)); if (!tg) return out('Cách dùng: ping <địa chỉ IP hoặc tên miền>', 'err');
    busy(true); simNote(); out('');
    net.ping(D, tg, { count, out: (t, k) => out(t, k), done: (s) => {
      if (s.recv > 0) out(`✓ Thông mạng: ${D.name} liên lạc được với ${tg}.`, 'vi');
      else if (s.sent) out(pingWhy(D, s.dst || tg), 'vi');
      busy(false);
    } });
    return;
  }
  if (c === 'tracert' || c === 'traceroute') { const tg = args[0]; if (!tg) return out('Cách dùng: tracert <địa chỉ>', 'err'); busy(true); simNote(); net.tracert(D, tg, { out, done: () => busy(false) }); return; }
  if (isR) {
    const sub = args.join(' ').toLowerCase();
    if (c === 'show' && sub.startsWith('ip route')) {
      out('Codes: C - nối trực tiếp, S - tĩnh'); out('');
      D.ports.filter((p) => p.ip && p.link && maskLen(p.mask) >= 0).forEach((p) => out(`C    ${netOf(p.ip, p.mask)}/${maskLen(p.mask)} is directly connected, ${p.name}`));
      D.routes.forEach((r) => out(`S    ${r.net}/${maskLen(r.mask)} [1/0] via ${r.via}`));
      if (!D.routes.some((r) => r.net === '0.0.0.0')) out('Gateway of last resort is not set', 'vi');
      return;
    }
    if (c === 'show' && sub.startsWith('ip int')) { out('Interface   IP-Address        Status'); D.ports.forEach((p) => out(`${p.name.padEnd(11)} ${(p.ip || 'unassigned').padEnd(17)} ${p.link ? 'up' : 'down'}`)); return; }
    if (c === 'show' && sub.startsWith('arp')) { out('Address          Hardware Addr        Interface'); Object.entries(D.rt.arp).forEach(([ip, e]) => out(`${ip.padEnd(16)} ${e.mac}    ${D.ports[e.port].name}`)); return; }
    return out(`% Lệnh không hợp lệ: "${cmd}" – gõ help`, 'err');
  }
  if (c === 'ipconfig') {
    const p = D.ports[0], a = (args[0] || '').toLowerCase();
    if (a === '/renew') {
      if (!D.dhcp) return out('Máy đang đặt IP tĩnh. Hãy chọn "DHCP (tự động)" trong thẻ Cấu hình trước.', 'err');
      busy(true); simNote(); out('Đang xin địa chỉ từ máy chủ DHCP…');
      net.dhcpRenew(D, (err) => { if (err) out(err, 'err'); else { out(`IPv4 Address. . . . . : ${p.ip}`, 'ok'); out(`Subnet Mask . . . . . : ${p.mask}`); out(`Default Gateway . . . : ${D.gw}`); } busy(false); renderTopo(); });
      return;
    }
    if (a === '/release') { if (!D.dhcp) return out('Máy đang đặt IP tĩnh.', 'err'); p.ip = ''; p.mask = ''; D.gw = ''; D.dns = ''; net.emit('config', D); return out('Đã trả lại địa chỉ IP.'); }
    out(''); out('Ethernet adapter ' + p.name + ':'); out('');
    if (!p.link) out('   Media State . . . . . . . . . . . : Media disconnected (chưa cắm dây)', 'err');
    if (a === '/all') { out(`   Physical Address. . . . . . . . . : ${p.mac}`); out(`   DHCP Enabled. . . . . . . . . . . : ${D.dhcp ? 'Yes' : 'No'}`); }
    out(`   IPv4 Address. . . . . . . . . . . : ${p.ip || '(chưa có)'}`); out(`   Subnet Mask . . . . . . . . . . . : ${p.mask || '(chưa có)'}`); out(`   Default Gateway . . . . . . . . . : ${D.gw || ''}`);
    if (a === '/all') out(`   DNS Servers . . . . . . . . . . . : ${D.dns || ''}`);
    return;
  }
  if (c === 'nslookup') {
    const n = args[0]; if (!n) return out('Cách dùng: nslookup <tên miền>', 'err');
    busy(true); simNote(); out(`Server:  ${D.dns || '(chưa đặt)'}`); out('');
    net.resolve(D, n, (err, ip) => { if (err) out(err, 'err'); else { out(`Name:    ${n}`); out(`Address: ${ip}`, 'ok'); } busy(false); });
    return;
  }
  if (c === 'arp') { const e = Object.entries(D.rt.arp); if (!e.length) return out('Bảng ARP trống (chưa liên lạc với máy nào).', 'vi'); out('  Internet Address      Physical Address'); e.forEach(([ip, x]) => out(`  ${ip.padEnd(21)} ${x.mac}`)); return; }
  out(`'${c0}' không phải là lệnh hợp lệ. Gõ help để xem các lệnh.`, 'err');
}
function pingWhy(D, dst) {
  if (TYPES[D.type].kind === 'router') return '✗ Không thông. Kiểm tra bảng định tuyến (show ip route) và địa chỉ các cổng.';
  const p = D.ports[0];
  if (!p.link) return '✗ Gợi ý: máy chưa được cắm dây mạng.';
  if (!p.ip) return '✗ Gợi ý: máy chưa có địa chỉ IP.';
  if (ip2n(dst) !== null && !sameNet(dst, p.ip, p.mask) && !D.gw) return '✗ Gợi ý: máy đích ở mạng khác – cần đặt Default Gateway.';
  const target = net.devs.find((x) => x.ports.some((q) => q.ip === dst));
  if (target && TYPES[target.type].kind === 'host' && !sameNet(p.ip, dst, p.mask) && sameNet(p.ip, dst, target.ports[0].mask || '255.255.255.0') === false && !D.gw) return '✗ Gợi ý: hai máy không cùng mạng.';
  if (target && TYPES[target.type].kind === 'host' && target.ports[0].ip && ip2n(target.ports[0].mask) !== null && !sameNet(target.ports[0].ip, p.ip, target.ports[0].mask) && !target.gw) return `✗ Gợi ý: ${target.name} không biết đường gửi trả lời (khác mạng và chưa có gateway).`;
  if (!target && ip2n(dst) !== null && !dst.startsWith('8.') && !dst.startsWith('1.') && !dst.startsWith('203.')) return `✗ Gợi ý: không có thiết bị nào mang địa chỉ ${dst} trên sơ đồ.`;
  return '✗ Không thông. Kiểm tra dây nối, địa chỉ IP, Subnet mask và Default Gateway ở cả hai đầu.';
}

// ---------- trình duyệt ----------
const browserState = {};
function tabWeb(D, B) {
  const st = (browserState[D.id] = browserState[D.id] || { url: 'http://', html: '<div class="page err"><h1>Trình duyệt</h1><p>Nhập địa chỉ trang web, ví dụ <b>tinhoc.vn</b> hoặc địa chỉ IP của một máy chủ.</p></div>' });
  B.innerHTML = `<div class="brw"><div class="bar"><button class="btn" id="bBk" title="Tải lại">↻</button><input class="in" id="url" value="${esc(st.url)}" spellcheck="false"><button class="btn pri" id="go">Đi</button></div><div id="pg">${st.html}</div></div>`;
  const go = () => {
    st.url = $('#url', B).value.trim(); st.html = `<div class="page err"><h1>Đang tải…</h1><p>${esc(st.url)}${S.mode === 'sim' ? '\n(Chế độ Mô phỏng: bấm ▶ để gói tin chạy.)' : ''}</p></div>`; $('#pg', B).innerHTML = st.html;
    net.http(D, st.url, (err, page) => {
      st.html = err ? `<div class="page err"><h1>Không mở được trang</h1><p>${esc(err)}</p></div>` : `<div class="page"><h1>${esc(page.title)}</h1><p>${esc(page.body)}</p><p style="color:#888;font-size:12px;margin-top:18px">Máy chủ ${esc(page.ip)} · ${esc(page.host)}</p></div>`;
      if (win.dev === D.id && win.tab === 'web') $('#pg', B).innerHTML = st.html;
    });
  };
  $('#go', B).onclick = go; $('#bBk', B).onclick = go; $('#url', B).onkeydown = (e) => { if (e.key === 'Enter') go(); };
}

// ---------- thử thách ----------
function renderMenu() {
  const m = $('#menu');
  let h = `<a data-id=""><span class="st">◇</span>Tự do – vẽ mạng của riêng em<small></small></a>`;
  for (const lv of Object.keys(LEVELS)) {
    h += `<h4>CẤP ${lv} · ${LEVELS[lv].toUpperCase()}</h4>`;
    MISSIONS.filter((x) => String(x.level) === lv).forEach((x, i) => { h += `<a data-id="${x.id}" class="${prog.done[x.id] ? 'done' : ''}"><span class="st">${prog.done[x.id] ? '✓' : '○'}</span>${esc(x.title)}<small>${lv}.${i + 1}</small></a>`; });
  }
  m.innerHTML = h;
}
$('#bMissions').onclick = (e) => { e.stopPropagation(); const m = $('#menu'); const open = m.hidden; closePops(); if (open) { renderMenu(); m.hidden = false; } };
$('#menu').onclick = (e) => { const a = e.target.closest('a'); if (!a) return; $('#menu').hidden = true; openMission(a.dataset.id || null); };
function loadTopoFor(m) {
  let saved = null; try { saved = JSON.parse(localStorage.getItem(topoKey())); } catch {}
  if (saved && saved.devs) net.load(saved);
  else { net.load({ devs: [], links: [] }); if (m) m.setup(net); }
}
function openMission(id, fresh = false) {
  closeWin(); $('#pkt').hidden = true;
  S.mission = id ? byId(id) : null; S.ctx = { sawArp: false };
  if (fresh) { try { localStorage.removeItem(topoKey()); } catch {} }
  net.resetRuntime(); loadTopoFor(S.mission); S.sel = null; setTool('select');
  try { localStorage.setItem('thl.net.last', id || ''); } catch {}
  const m = S.mission;
  $('#title').textContent = m ? m.title : 'Tự do'; $('#missionShort').textContent = m ? `Thử thách ${MISSIONS.indexOf(m) + 1}/${MISSIONS.length}` : 'Thử thách';
  const card = $('#mission'); card.hidden = !m; card.classList.remove('min');
  if (m) {
    $('#mLv').textContent = `Cấp ${m.level} · ${LEVELS[m.level]}${prog.done[m.id] ? ' · ✓ đã xong' : ''}`;
    $('#mTitle').textContent = m.title;
    $('#mBody').innerHTML = `<p>${m.goal}</p><ol>${m.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`;
    $('#mQuiz').innerHTML = m.quiz ? `<div class="q">${esc(m.quiz.q)}</div>${m.quiz.options.map((o, i) => `<label><input type="radio" name="qz" value="${i}">${esc(o)}</label>`).join('')}` : '';
    $$('#mQuiz input').forEach((r) => (r.onchange = () => (S.ctx.answer = +r.value)));
    $('#mRes').innerHTML = '';
  }
  renderTopo(); fit();
  history.replaceState(null, '', location.pathname + (id ? '#' + id : ''));
}
$('#mMin').onclick = () => { const c = $('#mission'); c.classList.toggle('min'); $('#mMin').textContent = c.classList.contains('min') ? '+' : '–'; };
$('#mRestart').onclick = () => { if (confirm('Dựng lại sơ đồ ban đầu của thử thách? Những gì em đã làm sẽ mất.')) openMission(S.mission.id, true); };
$('#mCheck').onclick = () => {
  const m = S.mission; if (!m) return;
  let items; try { items = m.check(net, S.ctx); } catch (e) { items = [{ name: 'Không chấm được', ok: false, note: e.message }]; }
  const pass = items.filter((i) => i.ok).length, ok = pass === items.length;
  if (ok) { prog.done[m.id] = Date.now(); saveProg(); $('#mLv').textContent = `Cấp ${m.level} · ${LEVELS[m.level]} · ✓ đã xong`; }
  $('#mRes').innerHTML = `<div class="sum ${ok ? 'ok' : 'bad'}">${ok ? '✓ Hoàn thành! 🎉' : '✗ Chưa đạt'} – ${pass}/${items.length}</div>` + items.map((i) => `<div class="it ${i.ok ? 'ok' : 'bad'}"><i>${i.ok ? '✓' : '✗'}</i><span>${esc(i.name)}${i.note ? `<small>${esc(i.note)}</small>` : ''}</span></div>`).join('');
  window.__net.last = { id: m.id, ok, items };
};

// ---------- lưu / mở / mới ----------
$('#bSave').onclick = () => {
  const blob = new Blob([JSON.stringify(net.toJSON(), null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (S.mission ? S.mission.id : 'so-do-mang') + '.thlnet'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('#bOpen').onclick = () => $('#file').click();
$('#file').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { const j = JSON.parse(await f.text()); if (!j.devs) throw 0; net.resetRuntime(); net.load(j); renderTopo(); fit(); saveTopo(); toast('Đã mở ' + f.name, 'ok'); } catch { toast('Tệp không đúng định dạng sơ đồ mạng.', 'err'); }
  e.target.value = '';
};
$('#bClear').onclick = () => { if (!net.devs.length || confirm('Xoá toàn bộ sơ đồ hiện tại?')) { closeWin(); net.resetRuntime(); net.load({ devs: [], links: [] }); renderTopo(); fit(); saveTopo(); } };
addEventListener('resize', () => applyView());
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#menu,#bMissions')) $('#menu').hidden = true; });

// ---------- khởi động ----------
window.__net = { net, S, openMission, openWin, setMode, run: (dev, cmd) => { const D = net.dev(dev); const st = T(D); run(D, cmd, st, () => {}); return st; } };
const start = location.hash.slice(1) || (() => { try { return localStorage.getItem('thl.net.last') || ''; } catch { return ''; } })();
openMission(byId(start) ? start : null);
requestAnimationFrame(loop);
