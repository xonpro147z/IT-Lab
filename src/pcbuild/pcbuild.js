// Phân hệ lắp ráp máy tính 3D
import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';
import { EffectComposer } from '../vendor/three/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/postprocessing/OutputPass.js';
import { CATEGORIES, PARTS, partById, CHALLENGES, GUIDE_STEPS, actionsFor } from './catalog.js';
import * as M from './models.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => n.toLocaleString('vi-VN') + 'đ';

// ================= Trạng thái =================
const S = { glass: true, 
  parts: { case: partById('case-h5') }, // slot -> part
  objs: {},                              // slot -> Object3D
  cat: 'case',
  selected: null,
  mode: 'free',
  manualDone: new Set(),
  gpuSkipped: false,
  powered: false,
  bootOk: false,
  challenge: null,
};
const CABLE_SLOTS = ['c-24pin', 'c-cpu8', 'c-pcie', 'c-sata', 'c-fp'];
const BOARD_SLOTS = ['cpu', 'ram', 'm2', 'gpu'];

// ================= Cảnh 3D =================
const canvas = $('#c3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
// Chất lượng đồ hoạ: 'auto' (tự chọn theo card đồ hoạ + đo FPS), 'high', 'medium', 'low'
const QNAME = { high: 'Cao', medium: 'Vừa', low: 'Nhẹ' };
let QSET = localStorage.getItem('thl.pc.quality') || 'auto';
if (!['auto', 'high', 'medium', 'low'].includes(QSET)) QSET = 'auto';
function detectQuality() {
  try {
    const gl = renderer.getContext(); const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const r = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).toLowerCase();
    if (/swiftshader|llvmpipe|softpipe|software|microsoft basic/.test(r)) return 'low';
    if (/intel\(r\)? (hd|uhd) graphics [2-6]\d\d\b|hd graphics( \d{4})?$|gma|mali-[gt][0-7]\d\b|adreno \(tm\) [1-5]/.test(r)) return 'low';
    if (/intel|uhd|iris|radeon\(tm\) graphics|radeon graphics|vega \d+ graphics|apple m1$|mali|adreno|powervr/.test(r)) return 'medium';
    return 'high';
  } catch { return 'medium'; }
}
let QUALITY = QSET === 'auto' ? detectQuality() : QSET;
M.TEX_OPTS.small = QUALITY === 'low'; M.TEX_OPTS.aniso = QUALITY === 'high' ? 8 : QUALITY === 'medium' ? 4 : 2;
renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITY === 'high' ? 2 : 1));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
// nền studio sáng (gradient) + môi trường phản chiếu cho kim loại, kính
scene.background = (() => { const c = document.createElement('canvas'); c.width = 16; c.height = 512; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#fdfdfe'); gr.addColorStop(0.62, '#eeeff3'); gr.addColorStop(1, '#dcdee4'); x.fillStyle = gr; x.fillRect(0, 0, 16, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.85;
const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 1000);
const HOME_CAM = { pos: new THREE.Vector3(40, 50, 84), target: new THREE.Vector3(-1, 22, 0) };
camera.position.copy(HOME_CAM.pos);
const controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME_CAM.target);
controls.enableDamping = true;
controls.minDistance = 12; controls.maxDistance = 180;
controls.maxPolarAngle = Math.PI * 0.53;

scene.add(new THREE.HemisphereLight(0xffffff, 0x4a4540, 0.45));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(45, 85, 70); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.blurSamples = 12;
Object.assign(key.shadow.camera, { left: -45, right: 45, top: 60, bottom: -15, near: 20, far: 220 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
scene.add(key);
const rim = new THREE.DirectionalLight(0xbfd8ff, 1.1); rim.position.set(-70, 40, -40); scene.add(rim);
const inside = new THREE.PointLight(0xffffff, 110, 60, 1.6); inside.position.set(-4, 34, 9); scene.add(inside);
const inside2 = new THREE.PointLight(0xe6efff, 70, 50, 1.6); inside2.position.set(6, 14, 9); scene.add(inside2);

// mặt sàn chỉ nhận bóng đổ (kiểu ảnh sản phẩm)
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.22 }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -1.95, 0); ground.receiveShadow = true; scene.add(ground);

// hậu kỳ: phát sáng (bloom) cho đèn RGB
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.45, 0.35, 1.0);
composer.addPass(bloom);
composer.addPass(new OutputPass());
function applyQuality() {
  const hi = QUALITY === 'high', lo = QUALITY === 'low';
  renderer.setPixelRatio(Math.min(devicePixelRatio, hi ? 2 : lo ? 0.85 : 1));
  renderer.shadowMap.type = hi ? THREE.VSMShadowMap : THREE.PCFShadowMap;
  key.castShadow = !lo; inside.intensity = lo ? 140 : 110; inside2.visible = !lo;
  key.shadow.mapSize.set(hi ? 2048 : 1024, hi ? 2048 : 1024); key.shadow.map?.dispose(); key.shadow.map = null;
  scene.environmentIntensity = lo ? 0.7 : 0.85;
  bloom.enabled = hi;
  const b = document.getElementById('btnQuality'); if (b) b.textContent = 'Đồ hoạ: ' + (QSET === 'auto' ? 'Tự động (' + QNAME[QUALITY] + ')' : QNAME[QUALITY]);
  fpsProbe = { t0: 0, n: 0 };
  resize();
}
// Tự hạ mức đồ hoạ nếu máy chạy không mượt (chỉ ở chế độ Tự động)
let fpsProbe = { t0: 0, n: 0 };
function probeFps(now) {
  if (QSET !== 'auto' || QUALITY === 'low' || document.hidden) return;
  if (!fpsProbe.t0) { fpsProbe = { t0: now, n: 0 }; return; }
  fpsProbe.n++;
  const dt = now - fpsProbe.t0;
  if (dt > 4000) {
    const fps = (fpsProbe.n * 1000) / dt;
    if (fps < 24) { QUALITY = QUALITY === 'high' ? 'medium' : 'low'; applyQuality(); }
    else fpsProbe = { t0: now, n: 0 };
  }
}
const world = new THREE.Group(); scene.add(world);
const markerGroup = new THREE.Group(); scene.add(markerGroup);
const cableGroup = new THREE.Group(); scene.add(cableGroup);

function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(r.width, r.height);
  camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

// ================= Dựng mô hình =================
function buildModel(slot, part) {
  switch (part.cat) {
    case 'case': return M.caseModel(part);
    case 'mb': return M.motherboardModel(part);
    case 'cpu': return M.cpuModel(part);
    case 'cooler': return M.coolerModel(part);
    case 'ram': return M.ramModel(part);
    case 'gpu': return M.gpuModel(part);
    case 'psu': return M.psuModel(part);
    case 'storage': return part.kind === 'm2' ? M.m2Model(part) : part.kind === 'ssd25' ? M.ssd25Model(part) : M.hddModel(part);
  }
}
// Điểm cắm theo mẫu mainboard đang lắp (mỗi ảnh mainboard có bố cục riêng)
function A(k) { const a = S.objs.mb?.userData.anchors; const v = a?.[k] ?? M.BOARD_ANCHORS[k]; return (typeof v === 'function' ? v(S.parts.mb?.form) : v).clone(); }
// Vị trí và đối tượng cha của từng khe
function slotPlacement(slot) {
  const board = S.objs.mb;
  switch (slot) {
    case 'case': return { parent: world, pos: new THREE.Vector3() };
    case 'mb': return { parent: world, pos: M.BOARD_ORIGIN.clone() };
    case 'cpu': return { parent: board, pos: A('cpu').clone() };
    case 'cooler': return { parent: board, pos: A('cpu').clone() };
    case 'ram': return { parent: board, pos: A('ram').clone() };
    case 'm2': return { parent: board, pos: A('m2').clone() };
    case 'gpu': return { parent: board, pos: A('gpu').clone() };
    case 'psu': return { parent: world, pos: M.PSU_POS.clone() };
    case 'hdd': return { parent: world, pos: M.HDD_POS.clone() };
  }
}
// Hộp đánh dấu vùng lắp (toạ độ cục bộ của đối tượng cha) cho linh kiện đang chọn
function slotMarkerBox(slot, part) {
  const pl = slotPlacement(slot);
  const c = pl.pos.clone();
  let size;
  switch (slot) {
    case 'mb': { const H = M.boardH(part.form); size = [M.BOARD_W, H, 0.6]; c.add(new THREE.Vector3(M.BOARD_W / 2, -H / 2, 0.3)); break; }
    case 'cpu': size = [5, 5, 0.8]; break;
    case 'cooler': size = [10, 10, part.height / 10]; c.z += part.height / 20 + 0.4; break;
    case 'ram': size = [2.6, 13.6, 3.4]; c.z += 1.7; break;
    case 'm2': size = [8.4, 2.6, 0.6]; break;
    case 'gpu': { const L = part.length / 10; size = [L, part.thick, 12]; c.add(new THREE.Vector3(-4.4 + L / 2, -part.thick / 2, 6.3)); break; }
    case 'psu': size = [15.2, 8.8, 15.2]; break;
    case 'hdd': if (part.kind === 'ssd25') { size = [10.2, 0.9, 7.2]; c.x += 1.5; c.y -= 0.8; } else size = [14.9, 2.8, 10.4]; break;
  }
  return { parent: pl.parent, center: c, size };
}
function cableTargetBox(slot) {
  const b = S.objs.mb;
  switch (slot) {
    case 'c-24pin': return { parent: b, center: A('c-24pin'), size: [1.8, 6, 1.6] };
    case 'c-cpu8': return { parent: b, center: A('c-cpu8'), size: [2.8, 1.8, 1.6] };
    case 'c-fp': return { parent: b, center: A('c-fp'), size: [2.4, 1.4, 1.4] };
    case 'c-pcie': return { parent: S.objs.gpu, center: S.objs.gpu.userData.powerAnchor, size: [S.parts.gpu.pcie * 2 + 0.8, 1.6, 1.4] };
    case 'c-sata': return { parent: S.objs.hdd, center: S.objs.hdd.userData.port || M.HDD_PORT, size: [1, 1.8, 3.8] };
  }
}

function setPartData(obj, slot, part) {
  obj.traverse((o) => { o.userData.slot = slot; o.userData.partId = part.id; });
}

function placeCase() {
  if (S.objs.case) world.remove(S.objs.case);
  const m = M.caseModel(S.parts.case);
  setPartData(m, 'case', S.parts.case);
  if (S.glass === false) m.traverse((o) => { if (o.name === 'glass') o.visible = false; });
  world.add(m); S.objs.case = m;
}

// hoạt cảnh: linh kiện bay từ ngoài vào vị trí
const tweens = [];
function tween(dur, fn, done) { tweens.push({ t0: performance.now(), dur, fn, done }); }
const ease = (t) => 1 - Math.pow(1 - t, 3);

function attach(slot, part, animate = true) {
  const pl = slotPlacement(slot);
  const obj = buildModel(slot, part);
  setPartData(obj, slot, part);
  // khoảng cách giữa các khe RAM khác nhau theo từng mainboard
  const pitch = S.objs.mb?.userData.ramPitch;
  if (slot === 'ram' && pitch) obj.children.forEach((c, i) => { c.position.x = (i ? 1 : -1) * pitch; });
  pl.parent.add(obj);
  S.objs[slot] = obj;
  const end = pl.pos.clone();
  if (animate) {
    const start = end.clone();
    if (slot === 'psu' || slot === 'hdd') start.z += 30; else start.z += 22;
    obj.position.copy(start);
    tween(650, (t) => obj.position.lerpVectors(start, end, ease(t)));
  } else obj.position.copy(end);
}
function detach(slot) {
  const o = S.objs[slot];
  if (o && o.parent) o.parent.remove(o);
  delete S.objs[slot];
}

// ================= Cáp =================
function rebuildCables() {
  cableGroup.clear();
  if (!S.objs.psu) return;
  scene.updateMatrixWorld(true);
  const psu = S.objs.psu, board = S.objs.mb;
  const P0 = psu.localToWorld(M.PSU_OUT.clone());
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const W = (obj, v) => obj.localToWorld(v.clone());
  if (S.parts['c-24pin'] && board) {
    const T = W(board, A('c-24pin'));
    cableGroup.add(M.cableMesh([P0, V(0, 11, 4), V(5.5, 16, -2), V(5.6, T.y - 4, -6), V(T.x + 1.6, T.y, T.z + 0.8), V(T.x + 0.3, T.y, T.z)], 0.55, 0x15161a));
  }
  if (S.parts['c-cpu8'] && board) {
    const T = W(board, A('c-cpu8'));
    cableGroup.add(M.cableMesh([P0, V(-2, 11, 5), V(6.5, 20, -3), V(6.5, 42, -7), V(-4, 45.4, -8), V(T.x, T.y + 1.4, T.z + 0.4), V(T.x, T.y + 0.3, T.z)], 0.35, 0x15161a));
  }
  if (S.parts['c-pcie'] && S.objs.gpu) {
    const T = W(S.objs.gpu, S.objs.gpu.userData.powerAnchor);
    cableGroup.add(M.cableMesh([P0, V(T.x + 3, 13, 8), V(T.x + 1, T.y - 1, T.z + 2.5), V(T.x, T.y, T.z + 0.4)], 0.4, 0x15161a));
  }
  if (S.parts['c-sata'] && S.objs.hdd && board) {
    const T = W(S.objs.hdd, S.objs.hdd.userData.port || M.HDD_PORT);
    const B = W(board, A('c-sata-mb'));
    cableGroup.add(M.cableMesh([P0, V(1, 7, 6), V(T.x - 1.5, T.y + 0.5, T.z + 1.5), V(T.x - 0.2, T.y + 0.4, T.z + 0.6)], 0.25, 0x222222));
    cableGroup.add(M.cableMesh([V(T.x - 0.2, T.y - 0.4, T.z - 0.6), V(T.x - 2, T.y, T.z - 2), V(4.5, 14, -4), V(B.x + 1.2, B.y, B.z + 0.5), V(B.x + 0.3, B.y, B.z)], 0.18, 0xc62828));
  }
  if (S.parts['c-fp'] && board) {
    const T = W(board, A('c-fp'));
    cableGroup.add(M.cableMesh([V(21.5, 45.5, 6), V(19.5, 40, 6), V(18.5, 14, -3), V(T.x + 3, T.y - 1.2, T.z + 1), V(T.x, T.y - 0.3, T.z)], 0.15, 0x3a6ea5));
  }
  cableGroup.traverse((o) => { o.userData.slot = 'cable'; });
}

// ================= Kiểm tra tương thích =================
function estPower(p) { return 60 + (p.cpu ? p.cpu.power : 0) + (p.gpu ? p.gpu.power : 0) + (p.hdd ? 10 : 0); }
function validate(p) {
  const out = [];
  const add = (level, msg, slots) => out.push({ level, msg, slots });
  const { case: c, mb, cpu, cooler, ram, gpu, psu } = p;
  if (c && mb && !c.forms.includes(mb.form)) add('err', `Mainboard ${mb.form} không vừa vỏ "${c.name}" (vỏ chỉ hỗ trợ ${c.forms.join(', ')}).`, ['mb', 'case']);
  if (mb && cpu && cpu.socket !== mb.socket) add('err', `${cpu.name} dùng socket ${cpu.socket}, nhưng mainboard có socket ${mb.socket} – không lắp vừa.`, ['cpu', 'mb']);
  if (mb && ram && ram.type !== mb.mem) add('err', `RAM ${ram.type} không cắm được vào mainboard hỗ trợ ${mb.mem} (khấc RAM khác nhau).`, ['ram', 'mb']);
  if (cpu && cooler && !cooler.sockets.includes(cpu.socket)) add('err', `Tản nhiệt không hỗ trợ socket ${cpu.socket}.`, ['cooler', 'cpu']);
  if (c && cooler && cooler.height > c.maxCooler) add('err', `Tản nhiệt cao ${cooler.height} mm, vượt giới hạn ${c.maxCooler} mm của vỏ – không đóng được nắp.`, ['cooler', 'case']);
  if (c && gpu && gpu.length > c.maxGpu) add('err', `Card đồ hoạ dài ${gpu.length} mm, vỏ chỉ chứa được tối đa ${c.maxGpu} mm.`, ['gpu', 'case']);
  if (cpu && cooler && cpu.power > cooler.maxTdp) add('warn', `Tản nhiệt chỉ tản được ~${cooler.maxTdp} W nhưng CPU toả tới ~${cpu.power} W: CPU sẽ rất nóng và tự giảm hiệu năng.`, ['cooler', 'cpu']);
  if (psu) {
    const need = estPower(p);
    if (psu.watt < need) add('err', `Nguồn ${psu.watt} W không đủ cho hệ thống cần ~${need} W.`, ['psu', 'gpu', 'cpu']);
    else if (psu.watt < need * 1.3) add('warn', `Nguồn ${psu.watt} W hơi sát với mức tiêu thụ ~${need} W. Nên dùng nguồn từ ${Math.ceil(need * 1.3 / 50) * 50} W.`, ['psu']);
  }
  if (c && cooler && cooler.type === 'aio' && cooler.rad > (c.maxRad || 0)) add('err', `Két nước ${cooler.rad} mm không vừa nóc vỏ "${c.name}" (tối đa ${c.maxRad} mm).`, ['cooler', 'case']);
  if (gpu && psu && gpu.h16 && !psu.h16) add('warn', `${gpu.name} dùng đầu nguồn 16-pin nhưng nguồn ${psu.name} không có dây 16-pin: phải dùng dây chuyển từ nhiều đầu 8-pin.`, ['gpu', 'psu']);
  if (cpu && !gpu && !cpu.igpu) add('warn', `${cpu.name} không có đồ hoạ tích hợp và chưa lắp card đồ hoạ: màn hình sẽ không có tín hiệu.`, ['cpu', 'gpu']);
  return out;
}

// ================= Lắp / tháo =================
function hostReady(slot) {
  if (slot === 'case') return true;
  if (slot === 'mb' || slot === 'psu' || slot === 'hdd') return true;
  if (slot === 'cooler') return !!S.parts.cpu || 'Cần lắp CPU trước khi lắp tản nhiệt.';
  if (BOARD_SLOTS.includes(slot)) return !!S.parts.mb || 'Cần lắp mainboard vào vỏ trước.';
  return true;
}
function cableReady(part) {
  const names = { psu: 'bộ nguồn', mb: 'mainboard', gpu: 'card đồ hoạ', hdd: 'ổ cứng HDD' };
  for (const n of part.needs) if (!S.parts[n]) return `Cần lắp ${names[n]} trước.`;
  if (part.slot === 'c-pcie' && !S.parts.gpu.pcie) return 'Card đồ hoạ này không cần dây nguồn phụ.';
  return true;
}

function canInstall(part) {
  const slot = part.slot;
  if (part.cable) { const r = cableReady(part); if (r !== true) return r; if (S.parts[slot]) return 'Cáp này đã được cắm.'; return true; }
  const hr = hostReady(slot); if (hr !== true) return hr;
  if (slot !== 'case' && S.parts[slot]) return S.parts[slot].id === part.id ? 'Linh kiện này đã được lắp.' : `Khe này đã có "${S.parts[slot].name}". Hãy tháo ra trước (bấm ✕ ở cột phải hoặc chuột phải vào linh kiện).`;
  const trial = { ...S.parts, [slot]: part };
  const errs = validate(trial).filter((e) => e.level === 'err' && e.slots.includes(slot) && !(e.slots.includes('psu') && slot !== 'psu'));
  if (errs.length && slot !== 'case') return errs[0].msg;
  return true;
}

function guideAllows(part) {
  if (S.mode !== 'guided') return true;
  const st = currentStep();
  if (!st) return true;
  const ok = st.slot === part.slot || (st.slot === 'storage' && part.cat === 'storage');
  return ok || `Bước hiện tại: "${st.title}". Hãy làm theo thứ tự hướng dẫn.`;
}

function install(part, opts = {}) {
  const g = guideAllows(part);
  if (g !== true) { toast(g, 'warn', 3500); return false; }
  const r = canInstall(part);
  if (r !== true) {
    if (S.exam && isCompatErr(part)) S.exam.rejects.push(`Chọn linh kiện không tương thích: ${part.name} – ${r}`);
    toast(r, 'err', 4200); showDetail(part, r); return false;
  }
  // chế độ hướng dẫn / thi: phải làm đúng các thao tác lắp trước khi linh kiện được lắp vào
  if (!opts.procDone && part.slot !== 'case' && (S.mode === 'guided' || S.exam) && actionsFor(part.slot, part)) {
    runProcedure(part).then((ok) => ok && install(part, { procDone: true }));
    return false;
  }
  powerOff();
  if (part.slot === 'case') {
    S.parts.case = part; placeCase(); afterChange();
    toast('Đã đổi vỏ máy: ' + part.name, 'ok');
    return true;
  }
  S.parts[part.slot] = part;
  if (!part.cable) attach(part.slot, part);
  setTimeout(rebuildCables, part.cable ? 0 : 680);
  toast((part.cable ? 'Đã cắm: ' : 'Đã lắp: ') + part.name, 'ok');
  S.selected = null;
  afterChange();
  return true;
}

function isCompatErr(part) {
  if (part.cable || part.slot === 'case' || S.parts[part.slot] || hostReady(part.slot) !== true) return false;
  return validate({ ...S.parts, [part.slot]: part }).some((e) => e.level === 'err' && e.slots.includes(part.slot));
}

// ================= Thao tác lắp chi tiết (luyện tập + chấm thi) =================
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function runProcedure(part) {
  return new Promise((resolve) => {
    const A = actionsFor(part.slot, part); const exam = !!S.exam;
    const items = shuffle([...A.steps.map((a, i) => ({ ...a, ok: true, i })), ...A.wrong.map((a) => ({ ...a, ok: false }))]);
    let next = 0;
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal proc"><h3>🔧 ${escapeHtml(A.title)}</h3><div class="psub">${escapeHtml(part.name)}</div>
      <p class="pnote">${exam ? 'Chọn các thao tác <b>đúng</b> theo <b>đúng thứ tự</b>. Có thao tác sai lẫn vào – chọn sai hoặc sai thứ tự sẽ bị trừ điểm.' : 'Bấm lần lượt các thao tác theo đúng thứ tự thực tế. Cẩn thận: có vài thao tác <b>sai</b> lẫn vào!'}</p>
      <ol class="pdone"></ol><div class="popts">${items.map((it, k) => `<button class="popt" data-k="${k}">${escapeHtml(it.t)}</button>`).join('')}</div>
      <div class="pmsg"></div><div class="actions">${exam ? '' : '<button class="btn" data-a="hint">💡 Gợi ý</button>'}<button class="btn" data-a="cancel">Để sau</button></div></div>`;
    document.body.appendChild(bg);
    const msg = (t, k) => { const m = bg.querySelector('.pmsg'); m.className = 'pmsg ' + k; m.innerHTML = t; };
    const miss = (t) => { if (S.exam) S.exam.mistakes.push(`${A.title}: ${t}`); };
    bg.querySelectorAll('.popt').forEach((b) => b.onclick = () => {
      const it = items[+b.dataset.k];
      bg.querySelectorAll('.popt.hint').forEach((x) => x.classList.remove('hint'));
      if (it.ok && it.i === next) {
        next++; b.remove();
        bg.querySelector('.pdone').insertAdjacentHTML('beforeend', `<li>${escapeHtml(it.t)}</li>`);
        msg('✓ Đúng', 'ok');
        if (next === A.steps.length) { setTimeout(() => { bg.remove(); resolve(true); }, 380); }
      } else if (it.ok) {
        msg(exam ? '✗ Sai thứ tự.' : '✗ Chưa đến bước này – còn thao tác khác phải làm trước.', 'err'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400);
        miss(`làm sai thứ tự – “${it.t}”`);
      } else {
        b.disabled = true; b.classList.add('bad');
        msg(exam ? '✗ Thao tác sai.' : `✗ Sai: ${escapeHtml(it.why)}`, 'err');
        miss(`thao tác sai – “${it.t}”`);
      }
    });
    const hint = bg.querySelector('[data-a=hint]');
    if (hint) hint.onclick = () => { const k = items.findIndex((it) => it.ok && it.i === next); bg.querySelector(`.popt[data-k="${k}"]`)?.classList.add('hint'); };
    bg.querySelector('[data-a=cancel]').onclick = () => { bg.remove(); resolve(false); };
  });
}

function dependents(slot) {
  const d = [];
  if (slot === 'mb') BOARD_SLOTS.concat('cooler').forEach((s) => S.parts[s] && d.push(s));
  if (slot === 'cpu' && S.parts.cooler) d.push('cooler');
  return d;
}
function remove(slot) {
  if (slot === 'case' || !S.parts[slot]) return;
  const dep = dependents(slot);
  if (dep.length) { toast(`Hãy tháo ${dep.map((s) => S.parts[s].name).join(', ')} trước.`, 'warn', 3800); return; }
  powerOff();
  const name = S.parts[slot].name;
  delete S.parts[slot];
  detach(slot);
  // tháo các cáp liên quan
  CABLE_SLOTS.forEach((cs) => { const cp = partById(PARTS.find((p) => p.slot === cs).id); if (S.parts[cs] && cp.needs.includes(slot)) delete S.parts[cs]; });
  if (slot === 'gpu' && S.parts['c-pcie']) delete S.parts['c-pcie'];
  if (slot === 'gpu') S.gpuSkipped = false;
  rebuildCables();
  toast('Đã tháo: ' + name, 'info');
  afterChange();
}

// ================= Đánh dấu vùng lắp =================
let markers = [];
function clearMarkers() { markers.forEach((m) => m.parent && m.parent.remove(m)); markers = []; }
function showMarkerFor(part) {
  clearMarkers();
  if (!part || part.slot === 'case') return;
  let mb;
  if (part.cable) { if (cableReady(part) !== true || S.parts[part.slot]) return; mb = cableTargetBox(part.slot); }
  else { if (hostReady(part.slot) !== true || S.parts[part.slot]) return; mb = slotMarkerBox(part.slot, part); }
  if (!mb || !mb.parent) return;
  const ok = canInstall(part) === true;
  const color = ok ? 0x34c759 : 0xff453a;
  const geo = new THREE.BoxGeometry(...mb.size);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false }));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color }));
  mesh.add(edges);
  mesh.position.copy(mb.center);
  mesh.userData.marker = part.id;
  mb.parent.add(mesh); markers.push(mesh);
  focusOn(mesh);
}

// ================= Camera =================
function camTo(pos, target, dur = 700) {
  const p0 = camera.position.clone(), t0 = controls.target.clone();
  tween(dur, (t) => { const e = ease(t); camera.position.lerpVectors(p0, pos, e); controls.target.lerpVectors(t0, target, e); });
}
function focusOn(obj) {
  scene.updateMatrixWorld(true);
  const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
  const dist = obj.userData.marker && (obj.geometry.parameters.width > 20 || obj.geometry.parameters.height > 20) ? 70 : 48;
  const dir = new THREE.Vector3(0.35, 0.35, 1).normalize();
  camTo(c.clone().add(dir.multiplyScalar(dist)), c);
}

// ================= Chọn chuột =================
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let downPos = null;
function pick(ev, list) {
  const r = canvas.getBoundingClientRect();
  mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  return ray.intersectObjects(list, true);
}
canvas.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; $('#ctxMenu').hidden = true; });
canvas.addEventListener('pointerup', (e) => {
  if (!downPos || Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]) > 5 || e.button !== 0) return;
  const hm = pick(e, markers);
  if (hm.length) { const p = partById(hm[0].object.userData.marker || hm[0].object.parent.userData.marker); if (p) install(p); return; }
  const h = pick(e, [world]);
  if (h.length) {
    const o = h[0].object;
    if (o.name === 'powerButton' || o.name === 'powerLed') { powerOn(); return; }
    const slot = o.userData.slot;
    if (slot && S.parts[slot]) { const cat = S.parts[slot].cat; selectCat(cat); }
  }
});
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (downPos && Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]) > 5) return;
  const h = pick(e, [world]);
  if (!h.length) return;
  const slot = h[0].object.userData.slot;
  if (!slot || slot === 'case' || !S.parts[slot]) return;
  const menu = $('#ctxMenu');
  const r = canvas.getBoundingClientRect();
  menu.innerHTML = `<div data-a="rm">🔧 Tháo "${escapeHtml(S.parts[slot].name)}"</div><div data-a="info">ℹ️ Thông tin linh kiện</div><div data-a="anat">🔬 Xem bên trong (giải phẫu 3D)</div>`;
  menu.style.left = (e.clientX - r.left) + 'px'; menu.style.top = (e.clientY - r.top) + 'px';
  menu.hidden = false;
  menu.onclick = (ev) => { const a = ev.target.dataset.a; menu.hidden = true; if (a === 'rm') remove(slot); if (a === 'info') showDetail(S.parts[slot]); if (a === 'anat') openAnatomy(anatomyScale(S.parts[slot])); };
});
let hoverT = 0;
canvas.addEventListener('pointermove', (e) => {
  const now = performance.now(); if (now - hoverT < 50) return; hoverT = now;
  const tip = $('#tooltip');
  const h = pick(e, [world]);
  const slot = h.length && h[0].object.userData.slot;
  const name = h.length && h[0].object.name;
  canvas.style.cursor = pick(e, markers).length || name === 'powerButton' ? 'pointer' : '';
  if (name === 'powerButton' || name === 'powerLed') { tip.innerHTML = '<b>Nút nguồn</b><br>Bấm để bật máy'; }
  else if (slot && S.parts[slot]) {
    const p = S.parts[slot]; const cat = CATEGORIES.find((c) => c.id === p.cat);
    tip.innerHTML = `<b>${cat.icon} ${escapeHtml(p.name)}</b><br>${escapeHtml(cat.info.split('. ')[0])}.`;
  } else { tip.hidden = true; return; }
  const r = canvas.getBoundingClientRect();
  tip.style.left = Math.min(e.clientX - r.left + 16, r.width - 310) + 'px'; tip.style.top = (e.clientY - r.top + 16) + 'px';
  tip.hidden = false;
});
canvas.addEventListener('pointerleave', () => { $('#tooltip').hidden = true; });

// ================= Giao diện bên trái =================
function slotFilled(cat) {
  if (cat === 'storage') return !!(S.parts.m2 || S.parts.hdd);
  if (cat === 'cable') return CABLE_SLOTS.some((s) => S.parts[s]);
  return !!S.parts[cat];
}
function renderCats() {
  $('#cats').innerHTML = CATEGORIES.map((c) => `<button data-cat="${c.id}" class="${S.cat === c.id ? 'on' : ''} ${slotFilled(c.id) ? 'done' : ''}" title="${c.name}">${c.icon}<small>${c.name.split(' (')[0]}</small></button>`).join('');
  $('#cats').querySelectorAll('button').forEach((b) => b.onclick = () => selectCat(b.dataset.cat));
  const cat = CATEGORIES.find((c) => c.id === S.cat);
  $('#catInfo').innerHTML = `<b>${cat.icon} ${cat.name}</b>${cat.info}`;
}
let partQuery = '', partBrand = '';
const normVi = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
function renderFilter() {
  const all = PARTS.filter((p) => p.cat === S.cat);
  const brands = [...new Set(all.map((p) => p.maker || p.brand).filter(Boolean))];
  const box = $('#partFilter');
  if (S.cat === 'cable') { box.hidden = true; return; }
  box.hidden = false;
  const sel = $('#partBrand');
  sel.innerHTML = '<option value="">Tất cả hãng</option>' + brands.map((b) => `<option ${b === partBrand ? 'selected' : ''}>${escapeHtml(b)}</option>`).join('');
}
function renderParts() {
  const q = normVi(partQuery);
  const list = PARTS.filter((p) => p.cat === S.cat && (!partBrand || (p.maker || p.brand) === partBrand) && (!q || normVi(p.name + ' ' + p.specs.join(' ')).includes(q)));
  $('#partCount').textContent = list.length + ' sản phẩm';
  $('#parts').innerHTML = list.map((p) => {
    const inst = S.parts[p.slot] && S.parts[p.slot].id === p.id;
    const chk = inst ? true : canInstall(p);
    const tag = inst ? `<span class="tag">${p.cable ? 'Đã cắm' : 'Đã lắp'}</span>` : (chk !== true && !/đã có|trước|đã được/.test(chk) ? '<span class="tag bad">Không tương thích</span>' : '');
    return `<div class="part ${S.selected && S.selected.id === p.id ? 'sel' : ''} ${inst ? 'inst' : ''}" data-id="${p.id}">
      <div class="nm"><span>${escapeHtml(p.name)}</span>${tag}</div>
      <ul>${p.specs.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
      ${p.price ? `<div class="pr">${fmt(p.price)}</div>` : ''}</div>`;
  }).join('');
  $('#parts').querySelectorAll('.part').forEach((el) => el.onclick = () => selectPart(partById(el.dataset.id)));
}
function selectCat(cat) { if (cat !== S.cat) { partBrand = ''; } S.cat = cat; renderCats(); renderFilter(); renderParts(); }
function selectPart(part) {
  S.selected = part;
  renderParts();
  if (part.slot === 'case') { showDetail(part); return; }
  showMarkerFor(part);
  showDetail(part);
}
function showDetail(part, err) {
  const d = $('#detail');
  const inst = S.parts[part.slot] && S.parts[part.slot].id === part.id;
  const chk = err || (inst ? true : canInstall(part));
  const g = inst ? true : guideAllows(part);
  let msg = '';
  if (inst) msg = `<div class="msg">✔ Linh kiện đang được ${part.cable ? 'cắm' : 'lắp'} trong máy.</div>`;
  else if (chk !== true) msg = `<div class="msg bad">✖ ${escapeHtml(chk)}</div>`;
  else if (g !== true) msg = `<div class="msg bad">${escapeHtml(g)}</div>`;
  else if (part.slot !== 'case') msg = `<div class="msg">➜ Bấm vào vùng <b style="color:#34c759">phát sáng màu xanh</b> trong khung 3D, hoặc bấm nút "Lắp vào".</div>`;
  d.innerHTML = `<h4>${escapeHtml(part.name)}</h4><ul>${part.specs.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
    ${part.price ? `<div style="color:#ffd166;font-weight:600">${fmt(part.price)}</div>` : ''}${msg}
    <div class="act">${inst ? (part.slot !== 'case' ? '<button class="pbtn ghost" data-a="rm">Tháo ra</button>' : '') : `<button class="pbtn" data-a="in" ${chk !== true ? 'disabled style="opacity:.5"' : ''}>${part.slot === 'case' ? 'Chọn vỏ này' : part.cable ? 'Cắm cáp' : 'Lắp vào'}</button>`}<button class="pbtn anat" data-a="anat">🔬 Xem bên trong</button><button class="pbtn ghost" data-a="x">Đóng</button></div>`;
  d.hidden = false;
  d.querySelectorAll('button').forEach((b) => b.onclick = () => {
    const a = b.dataset.a;
    if (a === 'in') install(part);
    if (a === 'rm') remove(part.slot);
    if (a === 'anat') { d.hidden = true; openAnatomy(anatomyScale(part)); }
    if (a === 'x') { d.hidden = true; clearMarkers(); S.selected = null; renderParts(); }
  });
}

// ================= Cột phải: cấu hình =================
const BUILD_ROWS = [['case', '🗄️'], ['mb', '🟩'], ['cpu', '🔲'], ['cooler', '❄️'], ['ram', '📏'], ['m2', '💾'], ['hdd', '💽'], ['gpu', '🎮'], ['psu', '🔌']];
const ROW_LABEL = { case: 'Vỏ máy', mb: 'Mainboard', cpu: 'CPU', cooler: 'Tản nhiệt', ram: 'RAM', m2: 'SSD M.2', hdd: 'Ổ SATA (HDD/SSD)', gpu: 'Card đồ hoạ', psu: 'Nguồn' };
function total() { return Object.values(S.parts).reduce((s, p) => s + (p.price || 0), 0); }
function renderBuild() {
  const rows = BUILD_ROWS.map(([slot, ic]) => {
    const p = S.parts[slot];
    return `<div class="bl"><span class="ic">${ic}</span><div class="tx"><small>${ROW_LABEL[slot]}</small>${p ? escapeHtml(p.name) : '<span class="empty">Chưa lắp</span>'}</div>${p && slot !== 'case' ? `<span class="x" data-slot="${slot}" title="Tháo">✕</span>` : ''}</div>`;
  });
  const cables = CABLE_SLOTS.filter((s) => S.parts[s]).length;
  const needC = CABLE_SLOTS.filter((s) => !(s === 'c-pcie' && (!S.parts.gpu || !S.parts.gpu.pcie)) && !(s === 'c-sata' && !S.parts.hdd)).length;
  rows.push(`<div class="bl"><span class="ic">〰️</span><div class="tx"><small>Cáp kết nối</small>${cables}/${needC} cáp đã cắm</div></div>`);
  $('#buildList').innerHTML = rows.join('');
  $('#buildList').querySelectorAll('.x').forEach((x) => x.onclick = () => remove(x.dataset.slot));
  $('#total').textContent = fmt(total());
  const pw = estPower(S.parts);
  const psuW = S.parts.psu ? S.parts.psu.watt : 0;
  $('#power').textContent = `${pw} W` + (psuW ? ` / ${psuW} W` : '');
  const bar = $('#pbar');
  bar.style.width = psuW ? Math.min(100, (pw / psuW) * 100) + '%' : '0';
  bar.style.background = !psuW ? '#34c759' : pw > psuW ? '#ff453a' : pw * 1.3 > psuW ? '#ffb020' : '#34c759';
  const v = validate(S.parts);
  $('#checks').innerHTML = v.length ? v.map((e) => `<div class="${e.level}">${e.level === 'err' ? '⛔' : '⚠️'} ${escapeHtml(e.msg)}</div>`).join('') : '<div class="ok">✅ Các linh kiện đã lắp tương thích với nhau.</div>';
}

// ================= Chế độ hướng dẫn =================
function stepDone(st) {
  if (st.manual) return S.manualDone.has(st.slot) || (st.slot === 'boot' && S.bootOk);
  if (st.slot === 'storage') return !!(S.parts.m2 || S.parts.hdd);
  if (st.slot === 'gpu') return !!S.parts.gpu || S.gpuSkipped;
  return !!S.parts[st.slot];
}
function stepSkipped(st) { return st.skipIf ? st.skipIf(S) : false; }
function currentStep() { return GUIDE_STEPS.find((st) => !stepSkipped(st) && !stepDone(st)); }
function renderGuide() {
  const g = $('#guide');
  if (S.mode !== 'guided') { g.hidden = true; return; }
  g.hidden = false;
  const cur = currentStep();
  const bars = GUIDE_STEPS.map((st) => `<span class="${stepSkipped(st) ? 's' : stepDone(st) ? 'd' : st === cur ? 'c' : ''}" title="${st.title}"></span>`).join('');
  if (!cur) {
    g.innerHTML = `<div class="steps">${bars}</div><h4>Hoàn thành.</h4>Bạn đã lắp ráp và khởi động thành công một bộ máy tính. Hãy thử chế độ "Thử thách" để rèn luyện thêm.`;
    return;
  }
  const idx = GUIDE_STEPS.indexOf(cur) + 1;
  const extra = [];
  if (cur.slot === 'case') extra.push('<button class="pbtn" data-a="next">Tiếp tục ➜</button>');
  if (cur.slot === 'gpu') extra.push(S.parts.cpu && S.parts.cpu.igpu ? '<button class="pbtn ghost" data-a="skipgpu">Bỏ qua (dùng đồ hoạ tích hợp)</button>' : '');
  if (cur.slot === 'boot') extra.push('<button class="pbtn" data-a="boot">⚡ Bật nguồn</button>');
  g.innerHTML = `<div class="steps">${bars}</div><h4>Bước ${idx}/${GUIDE_STEPS.length}: ${cur.title}</h4>${cur.text}<div class="act">${extra.join('')}</div>`;
  g.querySelectorAll('button').forEach((b) => b.onclick = () => {
    if (b.dataset.a === 'next') { S.manualDone.add('case'); afterChange(); }
    if (b.dataset.a === 'skipgpu') { S.gpuSkipped = true; afterChange(); }
    if (b.dataset.a === 'boot') powerOn();
  });
  // tự chuyển nhóm linh kiện theo bước
  const catOf = { case: 'case', mb: 'mb', cpu: 'cpu', cooler: 'cooler', ram: 'ram', storage: 'storage', psu: 'psu', gpu: 'gpu' };
  const want = catOf[cur.slot] || (cur.slot.startsWith('c-') ? 'cable' : null);
  if (want && want !== S.cat && renderGuide.last !== cur) selectCat(want);
  renderGuide.last = cur;
}

function afterChange() {
  S.bootOk = false;
  renderCats(); renderParts(); renderBuild(); renderGuide(); renderChallenge();
  if (S.selected) showMarkerFor(S.selected); else clearMarkers();
  if (!S.selected) $('#detail').hidden = true;
}

// ================= Khởi động =================
function setGlow(on) {
  world.traverse((o) => {
    if (o.name === 'rgb' && o.material) o.material.emissiveIntensity = on ? 2.2 : 0.2;
    if (o.name === 'powerLed') o.material.emissive.setHex(on ? 0x33aaff : 0x000000);
  });
}
function powerOff() { S.powered = false; setGlow(false); }
function diagnose() {
  const p = S.parts;
  const v = validate(p);
  const errs = v.filter((e) => e.level === 'err');
  if (!p.mb || !p.psu) return { stage: 'dead', msg: 'Bấm nút nguồn nhưng không có gì xảy ra.', why: `Máy chưa có ${!p.mb ? 'mainboard' : 'bộ nguồn'}.` };
  if (!p['c-fp']) return { stage: 'dead', msg: 'Bấm nút nguồn trên vỏ nhưng không có gì xảy ra.', why: 'Chưa cắm cáp Front Panel nên nút nguồn chưa nối với mainboard.' };
  if (!p['c-24pin']) return { stage: 'dead', msg: 'Không có gì xảy ra: mainboard không có điện.', why: 'Chưa cắm cáp nguồn 24-pin cho mainboard.' };
  if (errs.length) return { stage: 'dead', msg: 'Không thể khởi động do linh kiện không tương thích.', why: errs[0].msg };
  if (!p.cpu) return { stage: 'fan', msg: 'Quạt quay nhưng đèn báo lỗi CPU trên mainboard sáng đỏ, màn hình đen.', why: 'Chưa lắp CPU.' };
  if (!p['c-cpu8']) return { stage: 'fan', msg: 'Quạt quay vài giây rồi tắt, đèn báo lỗi CPU sáng đỏ.', why: 'Chưa cắm cáp nguồn CPU 8-pin.' };
  if (!p.ram) return { stage: 'fan', msg: 'Loa mainboard kêu bíp liên tục, đèn DRAM sáng đỏ, màn hình đen.', why: 'Chưa lắp RAM.' };
  if (p.gpu && p.gpu.pcie && !p['c-pcie']) return { stage: 'fan', msg: 'Quạt quay, đèn VGA sáng đỏ, màn hình không có tín hiệu.', why: 'Card đồ hoạ chưa được cắm dây nguồn PCIe.' };
  if (!p.gpu && !p.cpu.igpu) return { stage: 'fan', msg: 'Máy chạy, quạt quay nhưng màn hình báo "No Signal".', why: 'CPU không có đồ hoạ tích hợp và chưa lắp card đồ hoạ rời.' };
  if (!p.cooler) return { stage: 'overheat', msg: 'Máy lên hình được vài giây rồi tự tắt.', why: 'Chưa lắp tản nhiệt CPU, CPU quá nhiệt (trên 100°C) và tự ngắt để bảo vệ.' };
  const hasBoot = p.m2 || (p.hdd && p['c-sata']);
  if (!hasBoot) return { stage: 'noboot', why: p.hdd ? 'Ổ HDD chưa được cắm cáp SATA nên mainboard không nhận ổ.' : 'Chưa lắp ổ lưu trữ nào để chứa hệ điều hành.' };
  return { stage: 'ok', warns: v.filter((e) => e.level === 'warn') };
}
let bootTimer = [];
function powerOn() {
  bootTimer.forEach(clearTimeout); bootTimer = [];
  const d = diagnose();
  const mon = $('#monitor'), scr = $('#screen');
  if (d.stage === 'dead') { powerOff(); toast(d.msg, 'err', 4000); showResult(false, d); return; }
  S.powered = true; setGlow(true);
  scr.className = 'screen'; scr.innerHTML = '';
  mon.hidden = false;
  const p = S.parts;
  const lines = [];
  const say = (t, delay, cls = '') => bootTimer.push(setTimeout(() => { scr.innerHTML += cls ? `<span class="${cls}">${escapeHtml(t)}</span>\n` : escapeHtml(t) + '\n'; }, delay));
  if (d.stage === 'fan') {
    say('', 0); say('            ( Không có tín hiệu – No Signal )', 600, 'err');
    bootTimer.push(setTimeout(() => showResult(false, d), 1800));
    return;
  }
  say('TinHocLab UEFI BIOS  v2.26', 100);
  say(`Mainboard : ${p.mb.name}`, 400);
  say(`CPU       : ${p.cpu.name}  @ ${p.cpu.ghz} GHz  (${p.cpu.cores} nhân / ${p.cpu.threads} luồng)`, 700);
  say(`Bộ nhớ    : ${p.ram.size * 1024} MB ${p.ram.type}-${p.ram.mhz}  ............ OK`, 1100);
  say(`Đồ hoạ    : ${p.gpu ? p.gpu.name : 'Đồ hoạ tích hợp của CPU'}`, 1400);
  if (p.m2) say(`NVMe      : ${p.m2.name} ... OK`, 1700);
  if (p.hdd) say(`SATA 1    : ${p['c-sata'] ? p.hdd.name + ' ... OK' : 'Không phát hiện thiết bị'}`, 1900);
  say(`Nguồn     : ${p.psu.watt} W  –  tiêu thụ ước tính ${estPower(p)} W`, 2100);
  if (d.stage === 'overheat') {
    say('', 2500); say('CẢNH BÁO: Nhiệt độ CPU 105°C!  CPU Over Temperature Error!', 2700, 'err'); say('Hệ thống tự tắt để bảo vệ...', 3300, 'err');
    bootTimer.push(setTimeout(() => { powerOff(); showResult(false, d); }, 4300));
    return;
  }
  if (d.stage === 'noboot') {
    say('', 2500); say('Reboot and Select proper Boot device', 2800, 'err'); say('or Insert Boot Media in selected Boot device and press a key_', 2900, 'err');
    bootTimer.push(setTimeout(() => showResult(false, d), 4000));
    return;
  }
  d.warns.forEach((w, i) => say('⚠ ' + w.msg, 2400 + i * 200, 'err'));
  say('', 2600); say('Nhấn DEL để vào BIOS Setup ...   Đang khởi động hệ điều hành', 2800, 'ok');
  bootTimer.push(setTimeout(() => {
    scr.className = 'screen win';
    scr.innerHTML = '<div style="font-size:54px;font-weight:700;letter-spacing:-0.04em">Xin chào.</div><div style="font-size:15px;opacity:.85;margin-top:10px;font-weight:500">Máy tính của em đã khởi động thành công.</div>';
    S.bootOk = true;
    renderGuide();
    showResult(true, d);
  }, 4200));
}
$('#btnCloseMon').onclick = () => { $('#monitor').hidden = true; bootTimer.forEach(clearTimeout); };
$('#btnPower').onclick = powerOn;

function showResult(ok, d) {
  if (S.exam && !ok) S.exam.badBoots.push('Bật nguồn khi máy chưa hoàn chỉnh – ' + (d.why || ''));
  if (!ok) {
    modal(`<h3>❌ Máy chưa khởi động được</h3><p><b>Hiện tượng:</b> ${escapeHtml(d.msg || 'Màn hình báo không tìm thấy ổ khởi động.')}</p><p><b>Nguyên nhân:</b> ${escapeHtml(d.why)}</p><p style="color:#666">Hãy kiểm tra lại cấu hình rồi bấm Bật nguồn lần nữa.</p>`);
    return;
  }
  if (S.challenge) {
    const ch = CHALLENGES.find((c) => c.id === S.challenge);
    const res = ch.check(buildFacts(true));
    const pass = res.every((r) => r[0]);
    const score = res.filter((r) => r[0]).length;
    Progress.record('pc', ch.id, score, res.length);
    setTimeout(() => modal(`<h3>${pass ? '🏆 Hoàn thành thử thách!' : '🔎 Chưa đạt thử thách'}</h3><p><b>${escapeHtml(ch.title)}</b></p>${res.map(([ok2, t]) => `<div>${ok2 ? '✅' : '❌'} ${escapeHtml(t)}</div>`).join('')}<p>Điểm: <b>${score}/${res.length}</b> · Tổng chi phí: ${fmt(total())}</p>`), 900);
  }
}
function buildFacts(booted) {
  return { parts: S.parts, total: total(), warnings: validate(S.parts).filter((e) => e.level === 'warn').length, booted };
}

function modal(html) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal">${html}<div class="actions"><button class="btn primary">Đóng</button></div></div>`;
  bg.querySelector('.actions button').onclick = () => bg.remove();
  bg.onclick = (e) => { if (e.target === bg) bg.remove(); };
  document.body.appendChild(bg);
  return bg;
}

// ================= Thử thách =================
function renderChallenge() {
  const box = $('#challengeBox');
  if (S.exam) { renderExam(); return; }
  if (!S.challenge) { box.hidden = true; return; }
  const ch = CHALLENGES.find((c) => c.id === S.challenge);
  const res = ch.check(buildFacts(S.bootOk));
  box.hidden = false;
  box.innerHTML = `<h4>🏆 ${escapeHtml(ch.title)}</h4><div style="color:#e8d9b0">${escapeHtml(ch.desc)}</div><ul style="margin:6px 0 0">${res.map(([ok, t]) => `<li>${ok ? '✅' : '⬜'} ${escapeHtml(t)}</li>`).join('')}</ul><a href="#" id="chQuit" style="color:#ffd166;font-size:12px">Bỏ thử thách</a>`;
  $('#chQuit').onclick = (e) => { e.preventDefault(); S.challenge = null; renderChallenge(); };
}
$('#btnChallenge').onclick = () => {
  if (S.exam) { toast('Đang làm bài thi – hãy nộp bài hoặc huỷ bài thi trước.', 'warn', 3500); return; }
  const bg = modal(`<h3>🏆 Chọn thử thách</h3><p>Hoàn thành yêu cầu rồi bấm <b>Bật nguồn</b> để được chấm điểm.</p>${CHALLENGES.map((c) => {
    const r = Progress.get('pc', c.id);
    return `<div class="chl" data-id="${c.id}"><span class="st">${r ? (r.score === r.max ? '✔ Đã hoàn thành' : `${r.score}/${r.max}`) : ''}</span><b>${escapeHtml(c.title)}</b><div style="font-size:13px;color:#555;margin-top:4px">${escapeHtml(c.desc)}</div></div>`;
  }).join('')}`);
  bg.querySelectorAll('.chl').forEach((el) => el.onclick = () => {
    bg.remove(); resetBuild(); S.challenge = el.dataset.id; setMode('free'); afterChange();
    toast('Bắt đầu thử thách: ' + CHALLENGES.find((c) => c.id === S.challenge).title, 'info');
  });
};

// ================= Bài thi lắp ráp có chấm điểm (gửi kết quả về máy giáo viên qua mạng LAN) =================
const EXAM_MIN = 25;
const EXAMS = [
  { id: 'basic', title: 'Lắp máy hoàn chỉnh', desc: 'Lắp đủ linh kiện, cắm đủ dây, không có cảnh báo tương thích và khởi động thành công.',
    check: (b) => [[b.booted, 'Khởi động thành công'], [b.warnings === 0, 'Không có cảnh báo tương thích']] },
  ...CHALLENGES,
];
const studentStore = { get() { try { return JSON.parse(localStorage.getItem('thl.pc.student')) || null; } catch { return null; } }, set(v) { try { localStorage.setItem('thl.pc.student', JSON.stringify(v)); } catch {} } };
function lastIc3Profile() { try { const p = Object.values(JSON.parse(localStorage.getItem('thl.ic3.profiles')) || {}); p.sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0)); return p[0] ? { name: p[0].name, cls: p[0].class } : null; } catch { return null; } }
$('#btnExam').onclick = () => {
  if (S.exam) { submitExam(); return; }
  const me = studentStore.get() || lastIc3Profile() || { name: '', cls: '' };
  const bg = modal(`<h3>🎓 Bài thi lắp ráp máy tính</h3>
    <p style="color:#555;margin-top:-4px">Thời gian ${EXAM_MIN} phút. Không có hướng dẫn từng bước; mỗi linh kiện phải làm đúng các thao tác lắp. Điểm bị trừ khi chọn linh kiện không tương thích, làm sai thao tác, bật nguồn khi máy chưa xong hoặc không đạt yêu cầu đề.</p>
    <div class="exf"><label>Họ và tên<input id="exName" value="${escapeHtml(me.name || '')}" placeholder="Nguyễn Văn A"></label><label>Lớp<input id="exCls" value="${escapeHtml(me.cls || '')}" placeholder="10A1"></label></div>
    <div style="font-weight:600;margin:10px 0 2px">Chọn đề</div>
    ${EXAMS.map((c, i) => `<div class="chl" data-id="${c.id}"><b>Đề ${i + 1}: ${escapeHtml(c.title)}</b><div style="font-size:13px;color:#555;margin-top:4px">${escapeHtml(c.desc)}</div></div>`).join('')}
    <div class="pmsg err" id="exErr"></div>`);
  bg.querySelector('.actions button').textContent = 'Huỷ';
  bg.querySelectorAll('.chl').forEach((el) => el.onclick = () => {
    const name = bg.querySelector('#exName').value.trim().replace(/\s+/g, ' '), cls = bg.querySelector('#exCls').value.trim().toUpperCase();
    if (!name || !cls) { bg.querySelector('#exErr').textContent = 'Nhập họ tên và lớp trước khi chọn đề.'; return; }
    studentStore.set({ name, cls });
    bg.remove(); resetBuild(); S.challenge = null; setMode('free');
    S.exam = { id: el.dataset.id, name, cls, t0: Date.now(), mistakes: [], rejects: [], badBoots: [] };
    $('#btnExam').textContent = '📨 Nộp bài';
    try { window.desktop?.ic3?.hello?.({ name, class: cls, activity: 'Đang thi lắp ráp PC' })?.catch?.(() => {}); } catch {}
    afterChange();
    toast('Bắt đầu bài thi – chúc em làm tốt!', 'info');
  });
};
function examScore() {
  const E = S.exam, ch = EXAMS.find((c) => c.id === E.id);
  const crit = ch.check(buildFacts(S.bootOk));
  const secs = Math.round((Date.now() - E.t0) / 1000);
  const ded = [];
  if (E.mistakes.length) ded.push([E.mistakes.length * 4, `${E.mistakes.length} thao tác sai × 4`]);
  if (E.rejects.length) ded.push([E.rejects.length * 5, `${E.rejects.length} lần chọn linh kiện không tương thích × 5`]);
  if (E.badBoots.length) ded.push([E.badBoots.length * 5, `${E.badBoots.length} lần bật nguồn khi máy chưa xong × 5`]);
  crit.forEach(([ok, t]) => { if (!ok) ded.push([/Khởi động/.test(t) ? 30 : 15, 'Chưa đạt: ' + t]); });
  if (secs > EXAM_MIN * 60) ded.push([10, 'Quá thời gian']);
  const score = Math.max(0, 100 - ded.reduce((a, [d]) => a + d, 0));
  return { ch, crit, secs, ded, score };
}
function renderExam() {
  const box = $('#challengeBox'); const E = S.exam; if (!E) return;
  const { ch, crit, score } = examScore();
  const left = Math.max(0, EXAM_MIN * 60 - Math.round((Date.now() - E.t0) / 1000));
  box.hidden = false;
  box.innerHTML = `<h4>🎓 ${escapeHtml(ch.title)}</h4><div style="display:flex;gap:14px;margin:4px 0 6px"><span>⏱ <b id="exT">${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}</b></span><span>Lỗi: <b>${E.mistakes.length + E.rejects.length + E.badBoots.length}</b></span><span>Điểm tạm: <b>${(score / 10).toFixed(1)}</b></span></div>
    <div style="color:#555">${escapeHtml(ch.desc)}</div><ul style="margin:6px 0 0">${crit.map(([ok, t]) => `<li>${ok ? '✅' : '⬜'} ${escapeHtml(t)}</li>`).join('')}</ul>
    <button class="pbtn" id="exSubmit" style="margin-top:8px">📨 Nộp bài</button> <a href="#" id="exQuit" style="font-size:12px;margin-left:8px">Huỷ bài thi</a>`;
  $('#exSubmit').onclick = () => submitExam();
  $('#exQuit').onclick = (e) => { e.preventDefault(); if (confirm('Huỷ bài thi? Kết quả sẽ không được lưu.')) endExam(); };
}
function endExam() { S.exam = null; $('#btnExam').textContent = '🎓 Bài thi'; afterChange(); }
setInterval(() => {
  if (!S.exam) return;
  const left = EXAM_MIN * 60 - Math.round((Date.now() - S.exam.t0) / 1000);
  const el = $('#exT'); if (el) el.textContent = `${String(Math.floor(Math.max(0, left) / 60)).padStart(2, '0')}:${String(Math.max(0, left) % 60).padStart(2, '0')}`;
  if (left <= 0 && !S.exam.auto) { S.exam.auto = true; toast('Hết giờ! Bài được nộp tự động.', 'warn', 4000); submitExam(true); }
}, 1000);
async function submitExam(auto = false) {
  const E = S.exam; if (!E) return;
  if (!auto && !confirm('Nộp bài và kết thúc bài thi?')) return;
  const { ch, crit, secs, ded, score } = examScore();
  const errors = [...E.rejects, ...E.badBoots, ...E.mistakes];
  const rec = { name: E.name, class: E.cls, school: '', level: 0, testId: 'pc-' + ch.id, testTitle: 'Lắp ráp PC: ' + ch.title, mode: 'pcbuild',
    score: score * 10, correct: crit.filter(([ok]) => ok).length, total: crit.length, duration: secs, xp: Math.round(score / 2), wrong: errors, at: Date.now(),
    domains: {}, qids: [] };
  let sent = null;
  try { sent = window.desktop?.ic3?.submit ? await window.desktop.ic3.submit(rec) : null; } catch { sent = null; }
  try { Progress.record('pc', 'exam-' + ch.id, score, 100); } catch {}
  S.exam = null; $('#btnExam').textContent = '🎓 Bài thi'; $('#monitor').hidden = true; bootTimer.forEach(clearTimeout);
  const g = score / 10;
  modal(`<h3>${g >= 5 ? '🎉' : '📋'} Kết quả bài thi: ${g.toFixed(1)} / 10</h3>
    <p style="color:#555;margin-top:-6px">${escapeHtml(E.name)} · ${escapeHtml(E.cls)} · ${escapeHtml(ch.title)} · ${Math.floor(secs / 60)} phút ${secs % 60} giây</p>
    <ul style="margin:6px 0 10px">${crit.map(([ok, t]) => `<li>${ok ? '✅' : '❌'} ${escapeHtml(t)}</li>`).join('')}</ul>
    ${ded.length ? `<b>Bị trừ điểm</b><ul class="exded">${ded.map(([d, t]) => `<li><span>−${d}</span> ${escapeHtml(t)}</li>`).join('')}</ul>` : '<p>✅ Không bị trừ điểm nào. Xuất sắc!</p>'}
    ${errors.length ? `<details><summary>Chi tiết ${errors.length} lỗi</summary><ol style="font-size:13px">${errors.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ol></details>` : ''}
    <p class="pmsg ${sent && sent.sent ? 'ok' : ''}">${!sent ? 'Không gửi được kết quả (máy này không có kết nối lớp học).' : sent.sent ? '📨 Đã gửi kết quả về máy giáo viên.' : '⏳ Chưa thấy máy giáo viên – kết quả đã được lưu và sẽ tự gửi khi kết nối được.'}</p>`);
  afterChange();
}

// ================= Nguồn ảnh (giấy phép CC – bắt buộc ghi công tác giả) =================
const CREDITS = [
  ['Mainboard ASUS ROG STRIX Z690-A, socket LGA1700', 'Jacek Halicki', 'CC BY-SA 4.0'],
  ['Mainboard ASUS ROG Strix Z390-F', 'PantheraLeo1359531', 'CC BY 4.0'],
  ['Mainboard MSI B550 Tomahawk', 'Michael Wolf', 'CC BY-SA 3.0'],
  ['Mainboard ASRock AB350M Pro4', 'Ilya Plekhanov', 'CC BY-SA 4.0'],
  ['Socket AMD AM5', 'CristoCalis', 'CC BY-SA 4.0'],
  ['CPU Intel Core i5-13600K', '4300streetcar', 'CC BY 4.0'],
  ['CPU AMD Ryzen 7 3700X', 'Smial', 'Free Art License 1.3'],
  ['RAM DDR4, DDR5; SSD Samsung 870 QVO, Corsair MP400; bộ nguồn be quiet! Straight Power 12', 'PantheraLeo1359531', 'CC BY 4.0'],
  ['Ổ cứng Seagate Barracuda 500GB', 'Adryan R. Villanueva', 'CC BY-SA 4.0'],
];
$('#hint').insertAdjacentHTML('beforeend', ' · <a href="#" id="credits" style="color:inherit">Nguồn ảnh linh kiện</a>');
$('#credits').onclick = (e) => {
  e.preventDefault();
  modal(`<h3>📷 Nguồn ảnh linh kiện</h3><p style="color:#555;margin-top:-4px">Bề mặt các linh kiện dùng ảnh chụp thật từ Wikimedia Commons (đã nắn phẳng, cắt đúng kích thước thật). Ảnh là <b>mẫu đại diện</b> cho từng loại – logo trên ảnh có thể khác mẫu đang chọn; socket CPU luôn được thay đúng loại.</p>
    <table class="crd">${CREDITS.map(([w, a, l]) => `<tr><td>${escapeHtml(w)}</td><td>${escapeHtml(a)}</td><td>${escapeHtml(l)}</td></tr>`).join('')}</table>
    <p style="font-size:12px;color:#888">Chi tiết đường dẫn ảnh gốc: tệp src/pcbuild/tex/CREDITS.md trong mã nguồn.</p>`);
};

// ================= Giải phẫu 3D (PC Anatomy) ngay trong phòng lắp ráp =================
// Mỗi nhóm linh kiện mở đúng cấp độ tương ứng bên giải phẫu (đi sâu tới chip, nhân, ô nhớ...)
function anatomyScale(part) {
  if (!part) return 'pc';
  switch (part.cat) {
    case 'mb': return 'motherboard';
    case 'cpu': return part.brand === 'intel' ? 'corei9' : 'ryzen';
    case 'ram': return /DDR4/i.test(part.type || part.name) ? 'ddr4' : 'dimm';
    case 'gpu': return /radeon|amd/i.test(part.brand + ' ' + part.name) ? 'rx9070' : /arc|intel/i.test(part.brand + ' ' + part.name) ? 'arcb580' : /5060 ?ti/i.test(part.name) ? 'rtx5060ti' : /5060/.test(part.name) ? 'rtx5060' : 'card';
    case 'psu': return 'psu1000';
    case 'cooler': return part.type === 'aio' ? 'liquid' : 'cooler';
    case 'storage': return part.kind === 'm2' ? 'nvme' : 'ssd';
    default: return 'pc';
  }
}
const ANAT_NAME = { pc: 'cả bộ máy', motherboard: 'bo mạch chủ', ryzen: 'CPU AMD Ryzen', corei9: 'CPU Intel Core', ddr4: 'RAM DDR4', dimm: 'RAM DDR5', rx9070: 'card AMD Radeon', arcb580: 'card Intel Arc', rtx5060ti: 'card RTX 5060 Ti', rtx5060: 'card RTX 5060', card: 'card NVIDIA RTX', psu1000: 'bộ nguồn', liquid: 'tản nhiệt nước', cooler: 'tản nhiệt khí', nvme: 'SSD NVMe', ssd: 'SSD SATA' };
let anatPrevMode = 'free';
function openAnatomy(scale = 'pc') {
  if (S.exam) { toast('Đang làm bài thi – nộp bài hoặc huỷ bài thi trước khi xem giải phẫu.', 'warn', 3500); return; }
  if (S.mode !== 'anatomy') anatPrevMode = S.mode;
  const fr = $('#anatomyFrame');
  const url = '../anatomy/index.html?scale=' + encodeURIComponent(scale);
  if (fr.dataset.scale !== scale) { fr.src = url; fr.dataset.scale = scale; }
  document.body.classList.add('anat'); $('#anatomyView').hidden = false;
  S.mode = 'anatomy';
  document.querySelectorAll('#modeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.mode === 'anatomy'));
  powerOff(); $('#ctxMenu').hidden = true;
  if (scale !== 'pc') toast('Đang mở phần giải phẫu: ' + (ANAT_NAME[scale] || scale) + '. Bấm "Lắp tự do" để quay lại lắp ráp.', 'info', 4000);
}
function closeAnatomy() { document.body.classList.remove('anat'); $('#anatomyView').hidden = true; resize(); }

// ================= Thanh công cụ =================
function setMode(m) {
  if (m === 'anatomy') { openAnatomy('pc'); return; }
  if (S.mode === 'anatomy') closeAnatomy();
  S.mode = m;
  document.querySelectorAll('#modeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  renderGuide.last = null;
  afterChange();
}
document.querySelectorAll('#modeSeg button').forEach((b) => b.onclick = () => {
  if (S.exam) { toast('Đang làm bài thi – hãy nộp bài hoặc huỷ bài thi trước.', 'warn', 3500); return; }
  if (b.dataset.mode === 'anatomy') { openAnatomy('pc'); return; }
  if (b.dataset.mode === 'guided' && Object.keys(S.parts).length > 1 && !confirm('Chuyển sang chế độ hướng dẫn sẽ bắt đầu lại từ đầu. Tiếp tục?')) return;
  if (b.dataset.mode === 'guided') resetBuild();
  setMode(b.dataset.mode);
});
function resetBuild() {
  Object.keys(S.objs).forEach((s) => s !== 'case' && s !== 'mb' && detach(s));
  detach('mb');
  S.parts = { case: S.parts.case || partById('case-h5') };
  S.manualDone.clear(); S.gpuSkipped = false; S.selected = null; S.bootOk = false;
  powerOff(); rebuildCables(); clearMarkers();
  $('#detail').hidden = true; $('#monitor').hidden = true;
}
$('#btnReset').onclick = () => { if (confirm('Tháo toàn bộ linh kiện và làm lại từ đầu?')) { resetBuild(); afterChange(); camTo(HOME_CAM.pos, HOME_CAM.target); } };
const VIEWS = [
  [HOME_CAM.pos, HOME_CAM.target],
  [new THREE.Vector3(-2, 30, 70), new THREE.Vector3(-4, 26, 0)],
  [new THREE.Vector3(-9, 38, 34), new THREE.Vector3(-9, 32, -8)],
  [new THREE.Vector3(60, 35, -40), new THREE.Vector3(0, 22, 0)],
];
let viewIdx = 0;
$('#btnView').onclick = () => { viewIdx = (viewIdx + 1) % VIEWS.length; camTo(VIEWS[viewIdx][0].clone(), VIEWS[viewIdx][1].clone()); };

// ================= Vòng lặp vẽ =================
const clock = new THREE.Clock();
function loop() {
  const dt = clock.getDelta();
  const now = performance.now();
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i]; const t = Math.min(1, (now - tw.t0) / tw.dur);
    tw.fn(t); if (t >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
  }
  if (S.powered) world.traverse((o) => { if (o.name === 'rotor') o.rotation.z += dt * 14; if (o.name === 'rgb' && o.material) o.material.emissive.setHSL((now / 4000) % 1, 1, 0.5); });
  const pulse = 0.18 + 0.14 * Math.sin(now / 220);
  markers.forEach((m) => { m.material.opacity = pulse; });
  if (S.mode === 'anatomy') { requestAnimationFrame(loop); return; } // đang xem giải phẫu: dừng vẽ cảnh lắp ráp cho nhẹ máy
  controls.update();
  if (QUALITY === 'high') composer.render(); else renderer.render(scene, camera);
  probeFps(now);
  requestAnimationFrame(loop);
}

// ================= Khởi tạo =================
$('#btnQuality') && ($('#btnQuality').onclick = () => { const order = ['auto', 'high', 'medium', 'low']; QSET = order[(order.indexOf(QSET) + 1) % 4]; localStorage.setItem('thl.pc.quality', QSET); QUALITY = QSET === 'auto' ? detectQuality() : QSET; applyQuality(); });
$('#btnGlass') && ($('#btnGlass').onclick = () => { S.glass = !S.glass; world.traverse((o) => { if (o.name === 'glass') o.visible = S.glass; }); $('#btnGlass').textContent = 'Kính hông: ' + (S.glass ? 'Bật' : 'Tắt'); });
placeCase();
applyQuality();
resize();
afterChange();
loop();
window.__pc = { camera, controls,  S, install, remove, powerOn, partById, openAnatomy, anatomyScale }; // hỗ trợ kiểm thử

$('#partSearch').addEventListener('input', (e) => { partQuery = e.target.value; renderParts(); });
$('#partBrand').addEventListener('change', (e) => { partBrand = e.target.value; renderParts(); });
renderFilter();

// mở thẳng chế độ giải phẫu từ trang chủ: pcbuild.html#anatomy hoặc #anatomy=motherboard
if (/^#anatomy/.test(location.hash)) openAnatomy(location.hash.split('=')[1] || 'pc');
