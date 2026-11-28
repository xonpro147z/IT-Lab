// Đảo IC3 – thế giới 3D cho học sinh: đi lại, Khu ôn luyện, Tủ đồ thời trang, Đấu trường, Bảng vàng
import * as THREE from 'three';
import { buildWorld, ZONES, ISLAND_R, drawBoard } from './map.js';
import { makeAvatar, animate, CATALOG, DEFAULT, sanitize, itemLv, disposeAvatar, randomLook } from './avatar.js';
import { portrait, itemIcon } from './portrait.js';
import { createArena } from './arena-client.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const api = window.desktop && window.desktop.ic3;
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const keyOf = (name, cls) => name.trim().toLowerCase() + '|' + cls.trim().toUpperCase();
function toast(msg, ms = 2600) { const d = document.createElement('div'); d.textContent = msg; $('#toast').appendChild(d); setTimeout(() => d.remove(), ms); }

// ---------- cấp độ (giống phần ôn luyện) ----------
const LV = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7600, 9200];
const LV_TITLE = ['Người mới', 'Tập sự số', 'Nhà khám phá', 'Thám tử thông tin', 'Công dân số', 'Chiến binh bảo mật', 'Nhà sáng tạo', 'Đội trưởng cộng tác', 'Chuyên gia nhí', 'Cao thủ IC3', 'Bậc thầy IC3', 'Huyền thoại số', 'Siêu sao IC3', 'Đại sứ số', 'Vô địch IC3'];
const levelInfo = (xp) => { let l = 0; while (l + 1 < LV.length && xp >= LV[l + 1]) l++; const next = LV[l + 1] ?? LV[l] + 2000; return { lv: l + 1, title: LV_TITLE[l], cur: xp - LV[l], need: next - LV[l] }; };

// ---------- hồ sơ học sinh (dùng chung với phần ôn luyện) ----------
let profiles = {}, meKey = null, me = null;
const newProfile = (name, cls, school) => ({ name, class: cls, school, xp: 0, streak: 0, lastDay: '', best: {}, wrong: {}, badges: {}, st: { answered: 0, correct: 0, tests: 0, perfect: 0, passes: 0, maxCombo: 0, hotOk: 0, chBest: 0, fixed: 0 }, created: Date.now() });
function loadMe() { profiles = store.get('thl.ic3.profiles', {}); meKey = sessionStorage.getItem('thl.ic3.me'); me = meKey && profiles[meKey] ? profiles[meKey] : null; }
function saveMe() { if (!me) return; profiles = store.get('thl.ic3.profiles', {}); profiles[meKey] = me; store.set('thl.ic3.profiles', profiles); }
const looks = () => store.get('thl.ic3.looks', {});
const myLook = () => sanitize(looks()[meKey] || DEFAULT);
function saveLook(L) { const all = looks(); all[meKey] = L; store.set('thl.ic3.looks', all); }

// ---------- nhiệm vụ hằng ngày ----------
function daily() {
  const t = new Date().toISOString().slice(0, 10); let d = store.get('thl.ic3.daily', {});
  if (d.date !== t || d.key !== meKey) { d = { date: t, key: meKey, base: me.st.answered, closet: false, arena: false }; store.set('thl.ic3.daily', d); }
  return d;
}
const markDaily = (k) => { const d = daily(); if (!d[k]) { d[k] = true; store.set('thl.ic3.daily', d); drawQuest(); } };

// ======================= KHỞI TẠO 3D =======================
const canvas = $('#cv');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9dcff'); scene.fog = new THREE.Fog('#a9dcff', 70, 150);
const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 400);
scene.add(new THREE.HemisphereLight('#ffffff', '#88b36a', 1.35));
const sun = new THREE.DirectionalLight('#fff6e0', 1.9); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 120 }); sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);
const W = buildWorld(scene);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---------- người chơi ----------
const P = { pos: new THREE.Vector3(0, 0, 6), vel: new THREE.Vector3(), face: Math.PI, y: 0, vy: 0, target: null, onArrive: null, stuck: 0, lock: false, bounds: null };
let player = null;
function spawnPlayer() {
  if (player) { scene.remove(player); disposeAvatar(player); }
  player = makeAvatar(myLook()); scene.add(player);
}
const cam = { yaw: Math.PI * 0.22, pitch: 0.82, dist: 26, look: new THREE.Vector3(), focus: null };

// ---------- điều khiển ----------
const keys = new Set();
const typing = (e) => e.target.closest && e.target.closest('input,textarea,select,iframe');
const overlayOpen = () => [...document.querySelectorAll('.ov')].some((o) => !o.hidden) || arena.blocking();
addEventListener('keydown', (e) => {
  if (typing(e)) return;
  if (e.key === 'Escape') { closeOverlays(); return; }
  if (overlayOpen()) return;
  keys.add(e.key.toLowerCase());
  const k = e.key.toLowerCase();
  if (k === 'e' || k === 'enter') { if (near) act(near.id); }
  if (k === 't') goTo('closet'); if (k === 'o') goTo('study'); if (k === 'b') goTo('arena'); if (k === 'l') goTo('board'); if (k === 'h') help();
  if (k === ' ' && P.y <= 0.001) { P.vy = 7.5; e.preventDefault(); }
  if (k === 'q') cam.yaw -= Math.PI / 8; if (k === 'r') cam.yaw += Math.PI / 8;
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { P.target = null; P.onArrive = null; }
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
let drag = null;
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, moved: false, btn: e.button }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.hypot(dx, dy) > 5) drag.moved = true;
  if (drag.moved) { cam.yaw = drag.yaw - dx * 0.006; cam.pitch = Math.max(0.35, Math.min(1.25, drag.pitch + dy * 0.004)); }
});
canvas.addEventListener('pointerup', (e) => {
  const d = drag; drag = null; if (!d || d.moved || d.btn !== 0 || P.lock || overlayOpen()) return;
  // bấm để đi tới
  const r = canvas.getBoundingClientRect(); const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  const ray = new THREE.Raycaster(); ray.setFromCamera(v, camera);
  const hit = new THREE.Vector3(); if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) { P.target = hit; P.onArrive = null; P.stuck = 0; clickMark(hit); }
});
canvas.addEventListener('wheel', (e) => { cam.dist = Math.max(11, Math.min(40, cam.dist + e.deltaY * 0.02)); }, { passive: true });
let mark = null;
function clickMark(p) {
  if (!mark) { mark = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.55, 20), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 })); mark.rotation.x = -Math.PI / 2; scene.add(mark); }
  mark.position.set(p.x, 0.06, p.z); mark.userData.t = 0; mark.visible = true;
}

// ---------- di chuyển & va chạm ----------
function collide(p) {
  const R = 0.55;
  for (const c of W.colliders) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + R; if (d < m && d > 1e-4) { p.x = c.x + (dx / d) * m; p.z = c.z + (dz / d) * m; } }
  const d0 = Math.hypot(p.x, p.z), lim = ISLAND_R - 2.2; if (d0 > lim && !(Math.abs(p.x) < 2 && p.z > 0)) { p.x *= lim / d0; p.z *= lim / d0; }
  if (Math.hypot(p.x, p.z) > ISLAND_R - 1) { p.x *= (ISLAND_R - 1) / Math.hypot(p.x, p.z); p.z *= (ISLAND_R - 1) / Math.hypot(p.x, p.z); }
  if (P.bounds) { const b = P.bounds, dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz); if (d > b.r) { p.x = b.x + (dx / d) * b.r; p.z = b.z + (dz / d) * b.r; } }
}
function step(dt) {
  let ix = 0, iz = 0;
  if (!P.lock && !overlayOpen()) {
    if (keys.has('w') || keys.has('arrowup')) iz -= 1; if (keys.has('s') || keys.has('arrowdown')) iz += 1;
    if (keys.has('a') || keys.has('arrowleft')) ix -= 1; if (keys.has('d') || keys.has('arrowright')) ix += 1;
  }
  let dir = new THREE.Vector3();
  if (ix || iz) { const f = new THREE.Vector3(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw)), rt = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)); dir.addScaledVector(f, -iz).addScaledVector(rt, ix).normalize(); }
  else if (P.target && !P.lock) {
    const d = new THREE.Vector3(P.target.x - P.pos.x, 0, P.target.z - P.pos.z); const L = d.length();
    if (L < 0.5) { P.target = null; const cb = P.onArrive; P.onArrive = null; if (mark) mark.visible = false; if (cb) cb(); }
    else dir = d.normalize();
  }
  const speed = keys.has('shift') ? 10.5 : 7.5;
  const want = dir.multiplyScalar(speed);
  P.vel.lerp(want, Math.min(1, dt * 12));
  const before = P.pos.clone();
  P.pos.addScaledVector(P.vel, dt); collide(P.pos);
  if (P.target) { const moved = before.distanceTo(P.pos); P.stuck = moved < speed * dt * 0.25 ? P.stuck + dt : 0; if (P.stuck > 1.2) { const t = P.target, cb = P.onArrive; P.pos.set(t.x, 0, t.z); collide(P.pos); P.target = null; P.onArrive = null; P.stuck = 0; if (cb) cb(); } }
  // nhảy
  P.vy -= 22 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y === 0) P.vy = 0;
  const sp = P.vel.length();
  if (sp > 0.3) { const a = Math.atan2(P.vel.x, P.vel.z); let d = a - P.face; d = Math.atan2(Math.sin(d), Math.cos(d)); P.face += d * Math.min(1, dt * 12); }
  player.position.set(P.pos.x, P.y + (P.baseY || 0), P.pos.z); player.rotation.y = P.face;
  player.userData.speed = sp / 7.5;
}

// ---------- tương tác theo khu vực ----------
let near = null;
const ACT = {
  study: { ic: '📚', t: 'Khu ôn luyện', s: 'Luyện tập, kiểm tra, thử thách 60 giây', b: 'Vào ôn luyện' },
  arena: { ic: '⚔️', t: 'Đấu trường', s: 'Nhập mã phòng thầy cô cho để thi đấu', b: 'Vào thi đấu' },
  closet: { ic: '👕', t: 'Tủ đồ thời trang', s: 'Thay tóc, áo, mũ, phụ kiện', b: 'Thay đồ' },
  board: { ic: '🏆', t: 'Bảng vàng', s: 'Xếp hạng XP của lớp em', b: 'Xem bảng' },
  home: { ic: '🏠', t: 'Cổng TinHocLab', s: 'Về trang chủ TinHocLab', b: 'Ra cổng' },
};
function updateNear() {
  let best = null;
  if (!arena.active()) for (const t of W.triggers) { const d = Math.hypot(P.pos.x - t.x, P.pos.z - t.z); if (d < t.r && (!best || d < best.d)) best = { ...t, d }; }
  if ((best && best.id) !== (near && near.id)) {
    near = best; const el = $('#prompt');
    if (!near || overlayOpen()) { el.hidden = true; return; }
    const a = ACT[near.id];
    el.innerHTML = `<span class="ic">${a.ic}</span><span><b>${a.t}</b><small>${a.s}</small></span><button class="btn sm ${near.id === 'arena' ? 'red' : ''}"><kbd>E</kbd>${a.b}</button>`;
    el.querySelector('button').onclick = () => act(near.id); el.hidden = false;
  }
}
function act(id) {
  P.target = null; keys.clear();
  if (id === 'study') openStudy();
  if (id === 'closet') openCloset();
  if (id === 'arena') arena.openJoin();
  if (id === 'board') showBoard();
  if (id === 'home') { document.body.classList.add('leaving'); setTimeout(() => (location.href = '../../index.html'), 150); }
}
function goTo(id) {
  if (arena.active()) { toast('Em đang ở trong Đấu trường – bấm "Rời phòng" trước nhé.'); return; }
  const t = W.triggers.find((x) => x.id === id); if (!t) return;
  if (Math.hypot(P.pos.x - t.x, P.pos.z - t.z) < t.r) { act(id); return; }
  P.target = new THREE.Vector3(t.x, 0, t.z); P.stuck = 0; P.onArrive = () => act(id); clickMark(P.target);
}
$('#hudSkills').onclick = (e) => { const b = e.target.closest('[data-go]'); if (b) goTo(b.dataset.go); };

// ---------- nhãn công trình & tên người chơi ----------
const labelEls = W.labels.map((l) => { const d = document.createElement('div'); d.className = 'lbl'; d.innerHTML = `<i style="background:${ZONES[l.id].color}">${l.icon}</i>${esc(l.text)}`; d.onclick = () => goTo(l.id); $('#labels').appendChild(d); return d; });
const tags = new Map(); // avatar -> element
export function tagFor(av, html, me) { let el = tags.get(av); if (!el) { el = document.createElement('div'); el.className = 'tag' + (me ? ' me' : ''); $('#labels').appendChild(el); tags.set(av, el); } el.innerHTML = html; return el; }
function dropTag(av) { const el = tags.get(av); if (el) { el.remove(); tags.delete(av); } }
const v3 = new THREE.Vector3();
function project(p, el, dy = 0) {
  v3.copy(p); v3.y += dy; v3.project(camera);
  const vis = v3.z < 1 && Math.abs(v3.x) < 1.2 && Math.abs(v3.y) < 1.2;
  el.style.display = vis ? '' : 'none';
  if (vis) el.style.transform = `translate(${(v3.x * 0.5 + 0.5) * innerWidth}px, ${(-v3.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -100%)`;
}
function drawLabels() {
  W.labels.forEach((l, i) => { project(l.pos, labelEls[i]); labelEls[i].style.opacity = arena.active() ? 0 : 1; });
  for (const [av, el] of tags) { if (!av.parent) { dropTag(av); continue; } project(av.position, el, 3.7); }
}

// ---------- bản đồ nhỏ ----------
const mini = $('#mini'), mg = mini.getContext('2d');
function drawMini() {
  const S = 180, k = (S / 2 - 8) / ISLAND_R, cx = S / 2, cy = S / 2;
  mg.clearRect(0, 0, S, S);
  mg.fillStyle = '#5ec8f2'; mg.fillRect(0, 0, S, S);
  mg.save(); mg.translate(cx, cy); mg.rotate(cam.yaw); // xoay theo hướng nhìn
  mg.fillStyle = '#8fd46a'; mg.beginPath(); mg.arc(0, 0, ISLAND_R * k, 0, 7); mg.fill();
  mg.fillStyle = '#e6dfd2'; mg.beginPath(); mg.arc(0, 0, 7 * k, 0, 7); mg.fill();
  mg.strokeStyle = '#e6dfd2'; mg.lineWidth = 4; mg.beginPath(); mg.moveTo(0, 6 * k); mg.lineTo(0, 40 * k); mg.stroke();
  mg.fillStyle = '#4fc3f7'; mg.beginPath(); mg.arc(2 * k, 27 * k, 5 * k, 0, 7); mg.fill();
  mg.font = '16px system-ui'; mg.textAlign = 'center'; mg.textBaseline = 'middle';
  for (const [id, z] of Object.entries(ZONES)) { const x = z.pos[0] * k, y = z.pos[1] * k; mg.fillStyle = '#fff'; mg.beginPath(); mg.arc(x, y, 11, 0, 7); mg.fill(); mg.save(); mg.translate(x, y); mg.rotate(-cam.yaw); mg.fillText(z.icon, 0, 1); mg.restore(); }
  // người chơi
  mg.save(); mg.translate(P.pos.x * k, P.pos.z * k); mg.rotate(-P.face + Math.PI); mg.fillStyle = '#ff3b30'; mg.strokeStyle = '#fff'; mg.lineWidth = 2; mg.beginPath(); mg.moveTo(0, -8); mg.lineTo(6, 6); mg.lineTo(0, 3); mg.lineTo(-6, 6); mg.closePath(); mg.fill(); mg.stroke(); mg.restore();
  mg.restore();
  mg.fillStyle = '#1d1d1f'; mg.font = 'bold 12px system-ui'; mg.fillText('N', cx + Math.sin(-cam.yaw) * (S / 2 - 12), cy - Math.cos(-cam.yaw) * (S / 2 - 12));
}

// ---------- HUD ----------
function drawMe() {
  const L = levelInfo(me.xp);
  $('#hudMe').innerHTML = `<span class="pav">${portrait(myLook(), 50)}<span class="lv">${L.lv}</span></span><span><b>${esc(me.name)}</b><small>${esc(L.title)}</small><div class="xpb"><i style="width:${(L.cur / L.need) * 100}%"></i><span>${L.cur}/${L.need} XP</span></div><span class="cls">Lớp ${esc(me.class)}</span></span>`;
  $('#hudMe').className = 'hud hud-me card2';
  $('#hudMe').onclick = () => openCloset();
}
let questMin = false;
function drawQuest() {
  const d = daily(), n = Math.min(10, me.st.answered - d.base);
  const q = [
    { ic: '📚', t: 'Ôn luyện 10 câu', s: `${n}/10 câu hôm nay`, p: n / 10, go: 'study' },
    { ic: '👕', t: 'Thay một bộ đồ mới', s: d.closet ? 'Đã xong ✓' : 'Ghé Tủ đồ thời trang', p: d.closet ? 1 : 0, go: 'closet' },
    { ic: '⚔️', t: 'Tham gia Đấu trường', s: d.arena ? 'Đã xong ✓' : 'Khi thầy cô mở phòng', p: d.arena ? 1 : 0, go: 'arena' },
  ];
  const el = $('#hudQuest'); el.className = 'hud hud-quest card2' + (questMin ? ' min' : '');
  el.innerHTML = `<h4>NHIỆM VỤ HÔM NAY <button id="qMin">${questMin ? 'Mở' : 'Thu gọn'}</button></h4>${q.map((x) => `<div class="q" data-go="${x.go}"><i>${x.ic}</i><span style="flex:1"><b>${x.t}</b><small>${x.s}</small><div class="bar"><u style="width:${x.p * 100}%"></u></div></span></div>`).join('')}`;
  $('#qMin').onclick = (e) => { e.stopPropagation(); questMin = !questMin; drawQuest(); };
  el.querySelectorAll('.q').forEach((x) => (x.onclick = () => goTo(x.dataset.go)));
}
async function drawNet() {
  const el = $('#hudNet'); if (!api) { el.innerHTML = '<i></i>Một máy'; return; }
  const s = await api.status(); el.className = 'chip' + (s.connected ? ' on' : '');
  el.innerHTML = `<i></i>${s.connected ? 'Đã nối máy giáo viên' : 'Chưa nối máy giáo viên'}`;
}
function showHUD(on) { ['#hudMe', '#hudQuest', '#hudTop', '#hudMap', '#hudSkills', '#hudHome'].forEach((s) => ($(s).hidden = !on)); }

// ---------- âm thanh nhỏ ----------
let ac, mute = store.get('thl.ic3.mute', false);
export function tone(freqs, dur = 0.12, type = 'sine', gap = 0.09, vol = 0.15) {
  if (mute) return;
  try { ac = ac || new AudioContext(); const t0 = ac.currentTime; freqs.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0 + i * gap); g.gain.exponentialRampToValueAtTime(vol, t0 + i * gap + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * gap + dur); o.connect(g); g.connect(ac.destination); o.start(t0 + i * gap); o.stop(t0 + i * gap + dur + 0.05); }); } catch {}
}
$('#bSound').textContent = mute ? '🔇' : '🔊';
$('#bSound').onclick = () => { mute = !mute; store.set('thl.ic3.mute', mute); $('#bSound').textContent = mute ? '🔇' : '🔊'; };
$('#bHelp').onclick = () => help();
function help() {
  modal(`<div class="big">🗺️</div><h2>Cách chơi</h2><div style="text-align:left;line-height:1.9;font-size:14.5px">
    <b>Di chuyển:</b> phím <kbd>W A S D</kbd> hoặc mũi tên · <b>bấm chuột</b> xuống đất để đi tới đó<br>
    <b>Chạy nhanh:</b> giữ <kbd>Shift</kbd> · <b>Nhảy:</b> <kbd>Space</kbd><br>
    <b>Xoay góc nhìn:</b> kéo chuột hoặc <kbd>Q</kbd> / <kbd>R</kbd> · <b>Phóng to:</b> lăn chuột<br>
    <b>Vào công trình:</b> đến gần rồi bấm <kbd>E</kbd><br>
    <b>Đi nhanh:</b> <kbd>T</kbd> Tủ đồ · <kbd>O</kbd> Ôn luyện · <kbd>B</kbd> Đấu trường · <kbd>L</kbd> Bảng vàng</div>
    <button class="btn red" data-x style="margin-top:16px">Đã hiểu!</button>`);
}
function modal(html, cls = 'dlg') {
  const o = $('#ovModal'); o.innerHTML = `<div class="pane ${cls}">${html}</div>`; o.hidden = false; $('#prompt').hidden = true; near = null;
  o.onclick = (e) => { if (e.target === o || e.target.closest('[data-x]')) o.hidden = true; };
  return o.firstElementChild;
}
function closeOverlays() {
  if (!$('#ovStudy').hidden) return closeStudy();
  if (!$('#ovCloset').hidden) return closeCloset(false);
  if (!$('#ovModal').hidden) { $('#ovModal').hidden = true; return; }
  arena.escape();
}

// ======================= ĐĂNG NHẬP =======================
function viewLogin() {
  showHUD(false);
  const recent = Object.values(profiles).sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0)).slice(0, 8);
  const L = looks();
  const o = $('#ovLogin'); o.hidden = false;
  o.innerHTML = `<div class="pane login2"><h1>Chào mừng tới Đảo IC3! 🏝️</h1><p class="muted" style="margin:0">Nhập họ tên và lớp để tạo nhân vật của em. Thầy cô sẽ xem được kết quả ôn luyện và thi đấu.</p>
    <label>Họ và tên</label><input class="field" id="lgName" placeholder="Ví dụ: Nguyễn Văn An" maxlength="50" autocomplete="off">
    <div class="row"><div><label>Trường (không bắt buộc)</label><input class="field" id="lgSchool" placeholder="THCS …" maxlength="50"></div><div><label>Lớp</label><input class="field" id="lgClass" placeholder="7A" maxlength="10" style="text-transform:uppercase"></div></div>
    <button class="btn red" id="lgGo" style="width:100%;margin-top:20px">Vào đảo ›</button>
    ${recent.length ? `<label>Hoặc chọn tên đã dùng trên máy này</label><div class="recent">${recent.map((p) => { const k = keyOf(p.name, p.class); return `<button data-k="${esc(k)}"><span class="pav">${portrait(sanitize(L[k] || DEFAULT), 28)}</span>${esc(p.name)} · ${esc(p.class)}</button>`; }).join('')}</div>` : ''}</div>`;
  const go = (name, cls, school) => {
    name = name.trim().replace(/\s+/g, ' '); cls = cls.trim().toUpperCase();
    if (name.split(' ').length < 2) return toast('Hãy nhập đầy đủ họ và tên');
    if (!cls) return toast('Hãy nhập lớp');
    meKey = keyOf(name, cls); me = profiles[meKey] || newProfile(name, cls, school);
    if (school) me.school = school; me.lastLogin = Date.now(); saveMe();
    sessionStorage.setItem('thl.ic3.me', meKey);
    o.hidden = true; enter(!looks()[meKey]);
  };
  $('#lgGo').onclick = () => go($('#lgName').value, $('#lgClass').value, $('#lgSchool').value.trim());
  o.querySelectorAll('.recent button').forEach((b) => (b.onclick = () => { const p = profiles[b.dataset.k]; go(p.name, p.class, p.school); }));
  o.querySelectorAll('.field').forEach((f) => f.addEventListener('keydown', (e) => e.key === 'Enter' && $('#lgGo').click()));
  setTimeout(() => $('#lgName').focus(), 50);
}
function enter(firstTime) {
  spawnPlayer(); P.pos.set(0, 0, 9); P.face = 0;
  tagFor(player, esc(me.name), true);
  showHUD(true); drawMe(); drawQuest(); drawNet(); refreshBoard();
  if (firstTime) { saveLook(DEFAULT); setTimeout(() => openCloset(true), 400); }
  else if (!store.get('thl.ic3.helped', false)) { store.set('thl.ic3.helped', true); help(); }
  arena.resume();
}

// ======================= KHU ÔN LUYỆN =======================
function openStudy() {
  const f = $('#studyFrame');
  if (!f.src) f.src = '../ic3.html?embed=1';
  else try { f.contentWindow.__ic3 && f.contentWindow.__ic3.me && f.contentWindow.__ic3.viewHome(); } catch {}
  $('#ovStudy').hidden = false; $('#prompt').hidden = true; near = null;
}
function closeStudy() {
  $('#ovStudy').hidden = true;
  const old = me.xp; loadMe(); if (!me) return viewLogin();
  drawMe(); drawQuest(); refreshBoard();
  if (me.xp > old) { toast(`⭐ +${me.xp - old} XP từ ôn luyện!`); tone([523, 659, 784]); }
  P.pos.add(new THREE.Vector3(Math.sin(P.face), 0, Math.cos(P.face)).multiplyScalar(-2.5));
}
addEventListener('message', (e) => { if (e.data === 'ic3-close') closeStudy(); if (e.data === 'ic3-logout') { $('#ovStudy').hidden = true; sessionStorage.removeItem('thl.ic3.me'); loadMe(); viewLogin(); } });

// ======================= BẢNG VÀNG =======================
let boardRows = [];
async function refreshBoard() {
  let rows = [];
  const r = api ? await api.leaderboard(me.class, 'week').catch(() => ({ ok: false })) : { ok: false };
  if (r.ok) rows = r.rows;
  else rows = Object.values(store.get('thl.ic3.profiles', {})).filter((p) => p.class === me.class).map((p) => ({ name: p.name, xp: p.xp })).sort((a, b) => b.xp - a.xp);
  boardRows = rows; drawBoard(W, rows, `🏆 Lớp ${me.class} – ${r.ok ? 'tuần này' : 'trên máy này'}`);
}
function showBoard() {
  refreshBoard().then(() => {
    modal(`<div class="big">🏆</div><h2>Bảng vàng lớp ${esc(me.class)}</h2><table class="lbtbl">${boardRows.slice(0, 15).map((x, i) => `<tr style="${x.name.toLowerCase() === me.name.toLowerCase() ? 'background:#fff8e1' : ''}"><td style="width:36px;font-weight:800">${['🥇', '🥈', '🥉'][i] || i + 1}</td><td>${esc(x.name)}</td><td style="text-align:right"><b>${x.xp}</b> XP</td></tr>`).join('') || '<tr><td class="muted" style="text-align:center;padding:20px">Chưa có ai – hãy ôn luyện để lên bảng!</td></tr>'}</table><button class="btn" data-x style="margin-top:16px">Đóng</button>`);
  });
}

// ======================= TỦ ĐỒ THỜI TRANG =======================
let closet = null;
const TABS = [['hair', '💇 Tóc', ['hair', 'hairColor']], ['face', '😊 Mặt & da', ['face', 'skin']], ['top', '👕 Áo', ['top', 'topColor', 'print']], ['bottom', '👖 Quần & giày', ['bottom', 'bottomColor', 'shoes', 'shoeColor']], ['hat', '🧢 Mũ', ['hat', 'hatColor']], ['acc', '🎒 Phụ kiện', ['acc']]];
function openCloset(first) {
  $('#prompt').hidden = true; near = null;
  const o = $('#ovCloset'); o.hidden = false;
  const L0 = myLook(); const lv = levelInfo(me.xp).lv;
  closet = { L: { ...L0 }, L0, tab: 'hair', first };
  o.innerHTML = `<div class="pane closet"><div class="stage"><div class="nm">${first ? 'Tạo nhân vật của em ✨' : esc(me.name)}</div><canvas id="clCv"></canvas><div class="sbtn"><button class="btn sm ghost" id="clRnd">🎲 Ngẫu nhiên</button><button class="btn sm ghost" id="clPose">👋 Tạo dáng</button></div></div>
    <div class="side"><div class="tabs2" id="clTabs"></div><div class="items" id="clItems"></div>
    <div class="foot"><span class="muted">Cấp ${lv} · đồ có 🔒 sẽ mở khi em lên cấp bằng cách ôn luyện</span>${first ? '' : '<button class="btn ghost" id="clCancel">Huỷ</button>'}<button class="btn red" id="clSave">${first ? 'Xong, vào đảo!' : 'Lưu bộ đồ'}</button></div></div></div>`;
  // xem trước 3D
  const cv = $('#clCv'); const rr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); rr.setPixelRatio(Math.min(devicePixelRatio, 2)); rr.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#ffffff', '#ffb3d1', 1.6)); const dl = new THREE.DirectionalLight('#ffffff', 1.6); dl.position.set(3, 6, 6); sc.add(dl);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.2, 32), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 })); floor.position.y = -0.1; sc.add(floor);
  const cm = new THREE.PerspectiveCamera(30, 1, 0.1, 50); cm.position.set(0, 2.0, 10.5); cm.lookAt(0, 1.45, 0);
  closet.rr = rr; closet.sc = sc; closet.cm = cm; closet.rot = 0.4; closet.spin = true;
  let dg = null; cv.onpointerdown = (e) => { dg = { x: e.clientX, r: closet.rot }; closet.spin = false; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = (e) => { if (dg) closet.rot = dg.r + (e.clientX - dg.x) * 0.01; }; cv.onpointerup = () => (dg = null);
  const rebuild = () => { if (closet.av) { sc.remove(closet.av); disposeAvatar(closet.av); } closet.av = makeAvatar(closet.L); closet.av.userData.pose = closet.pose || 'idle'; sc.add(closet.av); };
  closet.rebuild = rebuild; rebuild();
  const tabs = () => { $('#clTabs').innerHTML = TABS.map(([k, t]) => `<button data-t="${k}" class="${closet.tab === k ? 'on' : ''}">${t}</button>`).join(''); };
  const items = () => {
    const [, , cats] = TABS.find((x) => x[0] === closet.tab);
    $('#clItems').innerHTML = cats.map((c) => {
      const C = CATALOG[c];
      if (C.colors) return `<h5>${C.label}</h5><div class="sw">${C.colors.map((col) => `<button data-c="${c}" data-v="${col}" class="${closet.L[c] === col ? 'on' : ''}" style="background:${col}"></button>`).join('')}</div>`;
      return `<h5>${C.label}</h5><div class="grid">${C.items.map(([id, name, need]) => { const lock = (need || 1) > lv; return `<button class="it ${closet.L[c] === id ? 'on' : ''} ${lock ? 'lock' : ''}" data-c="${c}" data-v="${id}" ${lock ? `data-lock="${need}"` : ''}><span class="pv">${itemIcon(c, id, closet.L)}</span>${esc(name)}${lock ? `<span class="lk">🔒 Cấp ${need}</span>` : ''}</button>`; }).join('')}</div>`;
    }).join('');
  };
  tabs(); items();
  $('#clTabs').onclick = (e) => { const b = e.target.closest('[data-t]'); if (b) { closet.tab = b.dataset.t; tabs(); items(); } };
  $('#clItems').onclick = (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    if (b.dataset.lock) { toast(`🔒 Món này mở ở Cấp ${b.dataset.lock}. Ôn luyện để nhận thêm XP nhé!`); return; }
    closet.L[b.dataset.c] = b.dataset.v; rebuild(); items(); tone([880], 0.05, 'triangle', 0, 0.06);
  };
  $('#clRnd').onclick = () => { const r = randomLook(); for (const k of Object.keys(r)) if (CATALOG[k].items && itemLv(k, r[k]) > lv) r[k] = closet.L[k]; closet.L = r; rebuild(); items(); };
  $('#clPose').onclick = () => { closet.pose = closet.pose === 'cheer' ? 'wave' : closet.pose === 'wave' ? 'idle' : 'cheer'; closet.av.userData.pose = closet.pose; };
  $('#clSave').onclick = () => closeCloset(true);
  if ($('#clCancel')) $('#clCancel').onclick = () => closeCloset(false);
  requestAnimationFrame(() => { const r = cv.getBoundingClientRect(); rr.setSize(r.width, r.height, false); cm.aspect = r.width / r.height; cm.updateProjectionMatrix(); });
}
function closeCloset(save) {
  if (!closet) return; if (closet.first && !save) return;
  if (save) {
    const changed = JSON.stringify(closet.L) !== JSON.stringify(closet.L0);
    saveLook(closet.L); spawnPlayer(); tagFor(player, esc(me.name), true); drawMe();
    if (changed && !closet.first) { markDaily('closet'); toast('✨ Bộ đồ mới đẹp quá!'); tone([660, 880, 1320], 0.1, 'triangle'); player.userData.pose = 'cheer'; setTimeout(() => player && (player.userData.pose = 'idle'), 1600); }
    if (closet.first) { markDaily('closet'); setTimeout(help, 300); store.set('thl.ic3.helped', true); }
    arena.lookChanged();
  }
  if (closet.av) disposeAvatar(closet.av); closet.rr.dispose(); closet = null;
  $('#ovCloset').hidden = true;
}

// ======================= ĐẤU TRƯỜNG =======================
const arena = createArena({
  THREE, scene, W, api, toast, tone, esc, modal, portrait, makeAvatar, animate, disposeAvatar, tagFor,
  get me() { return me; }, get look() { return myLook(); }, get player() { return player; }, P, cam,
  addXP(x) { if (!x) return; loadMe(); me.xp += x; saveMe(); drawMe(); },
  done() { markDaily('arena'); },
  showHUD(on) { ['#hudQuest', '#hudSkills', '#hudHome', '#hudTop', '#hudMap'].forEach((s) => ($(s).hidden = !on)); },
});

// ======================= VÒNG LẶP =======================
let last = performance.now(), T = 0, netT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
  if (me && player) {
    step(dt); animate(player, dt); updateNear();
    if (!$('#prompt').hidden && overlayOpen()) $('#prompt').hidden = true;
    arena.update(dt);
    // máy quay bám theo
    const tgt = cam.focus || player.position;
    cam.look.lerp(new THREE.Vector3(tgt.x, 1.6, tgt.z), Math.min(1, dt * 6));
    const cp = Math.cos(cam.pitch);
    camera.position.set(cam.look.x + Math.sin(cam.yaw) * cp * cam.dist, cam.look.y + Math.sin(cam.pitch) * cam.dist, cam.look.z + Math.cos(cam.yaw) * cp * cam.dist);
    camera.lookAt(cam.look);
    sun.position.set(cam.look.x + 18, 34, cam.look.z + 12); sun.target.position.set(cam.look.x, 0, cam.look.z);
    drawMini(); drawLabels();
    netT += dt; if (netT > 10) { netT = 0; drawNet(); }
  } else { camera.position.set(Math.sin(T * 0.1) * 50, 30, Math.cos(T * 0.1) * 50); camera.lookAt(0, 0, 0); }
  for (const f of W.updaters) f(T);
  (W.mannequins || []).forEach((m) => animate(m, dt));
  if (mark && mark.visible) { mark.userData.t += dt; mark.scale.setScalar(1 + mark.userData.t * 0.8); mark.material.opacity = Math.max(0, 0.9 - mark.userData.t); }
  renderer.render(scene, camera);
  if (closet) { closet.av.rotation.y = closet.rot; if (closet.spin) closet.rot += dt * 0.6; animate(closet.av, dt); closet.rr.render(closet.sc, closet.cm); }
}
requestAnimationFrame(loop);
setTimeout(() => $('#loading').classList.add('done'), 300);
loadMe();
if (me) enter(!looks()[meKey]); else viewLogin();
window.__world = { get me() { return me; }, P, cam, W, act, goTo, arena, openCloset, scene, get player() { return player; } };
