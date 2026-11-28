// Trang chủ: mô hình 3D các linh kiện bay vào lắp lên bo mạch chủ (kiểu bản vẽ kỹ thuật – khung dây)
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';
import { motherboardModel, cpuModel, coolerModel, ramModel, gpuModel, m2Model, BOARD_ANCHORS } from '../pcbuild/models.js';

const box = document.querySelector('#hero3d');
const canvas = box.querySelector('canvas');
const hudYaw = box.querySelector('[data-hud=yaw]');
const hudNow = box.querySelector('[data-hud=now]');
const hudTo = box.querySelector('[data-hud=to]');
const tagLayer = box.querySelector('.tags');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.75;
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(20, 30, 40); scene.add(key);
const rim = new THREE.DirectionalLight(0x5ea8ff, 3); rim.position.set(-40, 10, -20); scene.add(rim);
const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 800);

const H = 30.5, W = 24.4;
const board = motherboardModel({ form: 'ATX', socket: 'AM5', color: 0x101114, accent: 0x2346ff, label: 'TINHOCLAB', chipset: 'X870E' });
const A = (k) => (board.userData.anchors?.[k] || BOARD_ANCHORS[k]).clone();
board.position.set(-W / 2, H / 2, 0); scene.add(board);

// ---- linh kiện: thứ tự lắp, hướng bay vào, nhãn ----
const parts = [];
function addPart(obj, anchor, from, info) { obj.position.copy(anchor); board.add(obj); parts.push({ obj, home: anchor.clone(), from, ...info }); }
addPart(cpuModel({ brand: 'amd', name: 'AMD Ryzen 7 9800X3D' }), A('cpu'), new THREE.Vector3(-6, 10, 34), { tag: 'CPU', now: 'CPU AMD RYZEN 7 9800X3D', to: '→ SOCKET AM5 · KHỚP TAM GIÁC VÀNG', col: 0xffd400 });
addPart(coolerModel({ type: 'tower', label: 'TINHOCLAB' }), A('cpu'), new THREE.Vector3(0, 8, 56), { tag: 'TẢN NHIỆT', now: 'TẢN NHIỆT THÁP', to: '→ PHỦ KEO · BẮT 4 VÍT CHÉO', col: 0x38e1ff });
addPart(ramModel({ type: 'DDR5', size: 32, mhz: 6000, color: 0xe5e7eb, rgb: true, label: 'DDR5' }), A('ram'), new THREE.Vector3(16, 4, 40), { tag: 'RAM', now: 'RAM DDR5 2 × 16 GB', to: '→ KHE A2 + B2 · NGHE "TÁCH"', col: 0x7dff9a });
{ const pitch = board.userData.ramPitch; const ram = parts[parts.length - 1].obj; if (pitch) ram.children.forEach((c, i) => { c.position.x = (i ? 1 : -1) * pitch; }); }
addPart(m2Model({ size: 1000 }), A('m2'), new THREE.Vector3(-16, -6, 36), { tag: 'SSD M.2', now: 'SSD NVME M.2 1 TB', to: '→ KHE M.2 · NGHIÊNG 30° RỒI ẤN', col: 0xff7ad9 });
addPart(gpuModel({ brand: 'nvidia', maker: 'TinHocLab', name: 'GeForce RTX 5080', length: 330, fans: 3, thick: 6, pcie: 1, h16: true, color: 0x18191c }), A('gpu'), new THREE.Vector3(10, -24, 48), { tag: 'GPU', now: 'CARD ĐỒ HOẠ RTX 5080', to: '→ KHE PCIE X16 · CẮM NGUỒN 16-PIN', col: 0xff9f3a });

// ---- khung dây: viền cạnh cho từng khối ----
const edgesOf = new Map();
function addEdges(root, color) {
  const meshes = []; root.traverse((o) => { if (o.isMesh && o.geometry) meshes.push(o); });
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
  const list = [];
  for (const m of meshes) {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 28), mat);
    e.position.copy(m.position); e.quaternion.copy(m.quaternion); e.scale.copy(m.scale);
    e.userData.edge = true; m.parent.add(e); list.push(e);
  }
  edgesOf.set(root, { list, mat, meshes });
}
// bo mạch: chỉ lấy khối của chính nó (không lấy linh kiện con)
{
  const own = []; board.children.forEach((c) => { if (!parts.some((p) => p.obj === c)) own.push(c); });
  const g = new THREE.Group(); // gom tạm để duyệt
  const meshes = []; own.forEach((c) => c.traverse((o) => { if (o.isMesh && o.geometry) meshes.push(o); }));
  const mat = new THREE.LineBasicMaterial({ color: 0xe8eefc, transparent: true, opacity: 0.55 });
  const list = meshes.map((m) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 28), mat); e.position.copy(m.position); e.quaternion.copy(m.quaternion); e.scale.copy(m.scale); m.parent.add(e); return e; });
  edgesOf.set(board, { list, mat, meshes }); void g;
}
parts.forEach((p) => addEdges(p.obj, p.col));

let wire = true;
function setWire(on) {
  wire = on;
  // bo mạch luôn hiện ảnh thật (để thấy socket, khe RAM…); linh kiện chuyển giữa khung dây và ảnh thật
  for (const [root, { list, meshes }] of edgesOf) {
    if (root === board) { list.forEach((e) => (e.visible = false)); meshes.forEach((m) => (m.visible = true)); continue; }
    list.forEach((e) => (e.visible = on)); meshes.forEach((m) => (m.visible = !on));
  }
  box.classList.toggle('solid', !on);
}

// ---- nhãn nổi gắn theo linh kiện ----
const tags = parts.map((p) => { const d = document.createElement('span'); d.textContent = p.tag; d.style.setProperty('--c', '#' + p.col.toString(16).padStart(6, '0')); tagLayer.appendChild(d); return d; });

// ---- máy quay ----
const center = new THREE.Box3().setFromObject(board).getCenter(new THREE.Vector3());
let yaw = 0.5, pitch = 0.38, dist = 96, autoSpin = true, spinT = 0;
function resize() { const r = canvas.getBoundingClientRect(); if (!r.width) return; renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; yaw = drag.yaw - (e.clientX - drag.x) * 0.008; pitch = Math.max(-0.2, Math.min(1.2, drag.pitch + (e.clientY - drag.y) * 0.006)); });
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => { e.preventDefault(); dist = Math.max(55, Math.min(150, dist + e.deltaY * 0.05)); }, { passive: false });

// ---- dòng thời gian: bay vào lần lượt → giữ → tách rời → giữ → lặp ----
const EX = 0.32; // tách rời: lùi 32% quãng bay
const FLY = 1.1, GAP = 0.25, HOLD = 2.6, EXPL = 1.3, HOLD2 = 2.0;
const N = parts.length, T_IN = N * (FLY + GAP), CYCLE = T_IN + HOLD + EXPL + HOLD2 + EXPL * 0.8;
let t = 0, last = performance.now(), mode = 'auto'; // auto | exploded | built
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
const easeIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
let manual = 0, target1 = 0; // 0 = lắp, 1 = tách (khi người dùng bấm nút)

function state(time) {
  // trả về [k cho từng linh kiện: 0 = đang ở xa, 1 = đã lắp], linh kiện đang bay
  if (mode !== 'auto') { const k = 1 - EX * manual; return { ks: parts.map(() => k), active: -1 }; }
  const c = time % CYCLE;
  if (c < T_IN) {
    const ks = parts.map((_, i) => ease((c - i * (FLY + GAP)) / FLY));
    const active = Math.min(N - 1, Math.floor(c / (FLY + GAP)));
    return { ks: ks.map((k, i) => (c < i * (FLY + GAP) ? 0 : k)), active, hidden: parts.map((_, i) => c < i * (FLY + GAP) - 0.05) };
  }
  let d = c - T_IN;
  if (d < HOLD) return { ks: parts.map(() => 1), active: -2 };
  d -= HOLD;
  if (d < EXPL) return { ks: parts.map(() => 1 - EX * easeIO(d / EXPL)), active: -3 };
  d -= EXPL;
  if (d < HOLD2) return { ks: parts.map(() => 1 - EX), active: -3 };
  d -= HOLD2;
  return { ks: parts.map(() => 1 - EX + EX * easeIO(d / (EXPL * 0.8))), active: -2 };
}

const v = new THREE.Vector3();
let visible = true;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(box);
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!visible || document.hidden) return;
  t += dt;
  // lắc qua lắc lại trong khoảng ±50° để luôn nhìn thấy mặt trước bo mạch
  if (autoSpin && !drag) { spinT += dt; const tgt = 0.85 * Math.sin(spinT * 0.32 + 0.6); yaw += (tgt - yaw) * Math.min(1, dt * 1.2); }
  const s = state(t);
  parts.forEach((p, i) => {
    const k = s.ks[i];
    p.obj.position.set(p.home.x + p.from.x * (1 - k), p.home.y + p.from.y * (1 - k), p.home.z + p.from.z * (1 - k));
    p.obj.rotation.set((1 - k) * 0.8, (1 - k) * -0.6, 0);
    p.obj.visible = !(s.hidden && s.hidden[i]);
    const e = edgesOf.get(p.obj); if (e) e.mat.opacity = i === s.active ? 1 : 0.75;
  });
  // chữ trên màn hình
  if (s.active >= 0) { hudNow.textContent = 'ĐANG LẮP: ' + parts[s.active].now; hudTo.textContent = parts[s.active].to; }
  else if (s.active === -2 || (mode !== 'auto' && manual < 0.5)) { hudNow.textContent = 'ĐÃ LẮP XONG: 5/5 LINH KIỆN'; hudTo.textContent = '→ SẴN SÀNG BẬT NGUỒN'; }
  else { hudNow.textContent = 'CHẾ ĐỘ TÁCH RỜI'; hudTo.textContent = '→ QUAN SÁT TỪNG LINH KIỆN'; }
  const yd = ((yaw * 180 / Math.PI) % 360 + 360) % 360;
  hudYaw.textContent = `YAW ${yd > 180 ? '−' + Math.round(360 - yd) : '+' + Math.round(yd)}° · PITCH +${Math.round(pitch * 180 / Math.PI)}°`;
  camera.position.set(center.x + Math.sin(yaw) * Math.cos(pitch) * dist, center.y + Math.sin(pitch) * dist, center.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  camera.lookAt(center);
  board.traverse((o) => { if (o.name === 'rotor') o.rotation.z += dt * 6; });
  // nhãn nổi
  const r = canvas.getBoundingClientRect();
  parts.forEach((p, i) => {
    p.obj.getWorldPosition(v); v.project(camera);
    const el = tags[i];
    const show = p.obj.visible && v.z < 1;
    el.style.opacity = show ? (i === s.active ? 1 : 0.8) : 0;
    el.style.transform = `translate(${(v.x * 0.5 + 0.5) * r.width}px, ${(-v.y * 0.5 + 0.5) * r.height}px)`;
    el.classList.toggle('on', i === s.active);
  });
  renderer.render(scene, camera);
}

// ---- nút điều khiển ----
const btn = (n) => box.querySelector(`[data-act=${n}]`);
const sync = () => {
  btn('spin').classList.toggle('on', autoSpin);
  btn('wire').classList.toggle('on', wire);
  const ex = mode !== 'auto' && target1 === 1;
  btn('explode').classList.toggle('on', ex);
  btn('explode').textContent = ex ? 'LẮP LẠI' : 'TÁCH RỜI';
};
btn('spin').onclick = () => { autoSpin = !autoSpin; sync(); };
btn('wire').onclick = () => { setWire(!wire); sync(); };
btn('explode').onclick = () => {
  const k0 = mode === 'auto' ? Math.min(1, Math.max(0, (1 - Math.min(...state(t).ks)) / EX)) : manual;
  const target = mode === 'auto' ? 1 : (manual > 0.5 ? 0 : 1);
  mode = 'manual'; target1 = target; const start = performance.now();
  const step = (n) => { const x = easeIO((n - start) / 900); manual = k0 + (target - k0) * x; if (x < 1) requestAnimationFrame(step); else manual = target; };
  manual = k0; requestAnimationFrame(step); sync();
};
btn('reset').onclick = () => { mode = 'auto'; t = 0; spinT = 0; yaw = 0.5; pitch = 0.38; dist = 96; autoSpin = true; setWire(true); sync(); };

THREE.DefaultLoadingManager.onLoad = () => {};
setWire(true); sync(); resize(); requestAnimationFrame(frame);
window.__hero = { parts, setWire, get t() { return t; }, set t(x) { t = x; } };
