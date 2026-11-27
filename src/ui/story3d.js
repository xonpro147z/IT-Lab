// Cảnh 3D kể chuyện theo cuộn trang: các linh kiện bay vào và lắp lên bo mạch chủ
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';
import { motherboardModel, cpuModel, coolerModel, ramModel, gpuModel, m2Model, BOARD_ANCHORS } from '../pcbuild/models.js';

const section = document.querySelector('#story');
const canvas = document.querySelector('#storyCanvas');
const caps = [...document.querySelectorAll('#story .cap')];
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.7;
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(20, 30, 40); scene.add(key);
const rim = new THREE.DirectionalLight(0x5ea8ff, 3); rim.position.set(-40, 10, -20); scene.add(rim);
const warm = new THREE.PointLight(0xff7a45, 300, 120, 1.6); warm.position.set(30, -20, 20); scene.add(warm);
const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 800);

const H = 30.5, W = 24.4;
const rig = new THREE.Group(); scene.add(rig);
const board = motherboardModel({ form: 'ATX', socket: 'AM5', color: 0x101114, accent: 0xe11d48, label: 'ROG STRIX', chipset: 'X870E' });
// điểm lắp theo đúng ảnh mainboard đang dùng (mỗi mẫu bo có vị trí socket/khe RAM/PCIe riêng)
const A = (k) => (board.userData.anchors?.[k] || BOARD_ANCHORS[k]).clone();
board.position.set(-W / 2, H / 2, 0); rig.add(board);
const parts = [];
function addPart(obj, anchor, from, range) { obj.position.copy(anchor); board.add(obj); parts.push({ obj, home: anchor.clone(), from, range }); }
addPart(cpuModel({ brand: 'amd', name: 'AMD Ryzen 7 9800X3D' }), A('cpu'), new THREE.Vector3(-6, 10, 40), [0.14, 0.3]);
addPart(coolerModel({ type: 'tower', label: 'TINHOCLAB' }), A('cpu'), new THREE.Vector3(0, 6, 70), [0.32, 0.48]);
addPart(ramModel({ type: 'DDR5', size: 32, mhz: 6000, color: 0xe5e7eb, rgb: true, label: 'DDR5' }), A('ram'), new THREE.Vector3(14, 4, 50), [0.5, 0.62]);
{ const pitch = board.userData.ramPitch; const ram = parts[parts.length - 1].obj; if (pitch) ram.children.forEach((c, i) => { c.position.x = (i ? 1 : -1) * pitch; }); }
addPart(m2Model({ size: 1000 }), A('m2'), new THREE.Vector3(-14, -6, 45), [0.56, 0.68]);
addPart(gpuModel({ brand: 'nvidia', maker: 'TinHocLab', name: 'GeForce RTX 5080', length: 330, fans: 3, thick: 6, pcie: 1, h16: true, color: 0x18191c }), A('gpu'), new THREE.Vector3(10, -24, 60), [0.7, 0.88]);

// ảnh linh kiện tải xong thì vẽ lại khung hình
THREE.DefaultLoadingManager.onLoad = () => { lastP = -1; };
function resize() { lastW = 0; const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.fov = camera.aspect < 1.2 ? 42 : 32; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3));
const clamp01 = (t) => Math.max(0, Math.min(1, t));
let progress = 0, shown = 0, visible = false;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '0px' }).observe(section);
function onScroll() {
  const r = section.getBoundingClientRect();
  progress = clamp01(-r.top / (r.height - innerHeight));
}
addEventListener('scroll', onScroll, { passive: true });

let lastP = -1, lastW = 0;
function frame(t) {
  requestAnimationFrame(frame);
  if (!visible) return;
  shown += (progress - shown) * 0.16; // trễ nhẹ cho chuyển động mềm
  if (Math.abs(progress - shown) < 0.0004) shown = progress;
  const p = shown;
  // chỉ vẽ lại khi có thay đổi để nhẹ máy (máy phòng tin học thường yếu)
  if (p === lastP && canvas.clientWidth === lastW) return;
  lastP = p; lastW = canvas.clientWidth;
  parts.forEach(({ obj, home, from, range }) => {
    const k = ease((p - range[0]) / (range[1] - range[0]));
    obj.position.set(home.x + from.x * (1 - k), home.y + from.y * (1 - k), home.z + from.z * (1 - k));
    obj.rotation.set((1 - k) * 0.9, (1 - k) * -0.7, 0);
    obj.visible = p > range[0] - 0.06;
    obj.traverse((o) => { if (o.material && o.material.transparent !== undefined && o.isMesh) o.material.opacity = 1; });
  });
  // máy quay lượn quanh bo mạch
  const a = -0.75 + p * 1.15, el = 0.32 - p * 0.18, dist = 104 - p * 12;
  camera.position.set(Math.sin(a) * dist, Math.sin(el) * dist + 4, Math.cos(a) * dist);
  camera.lookAt(0, 9, 6);
  board.traverse((o) => { if (o.name === 'rgb' && o.material) o.material.emissiveIntensity = 0.4 + p * 1.8; if (o.name === 'rotor') o.rotation.z = p * 40; });
  // mỗi thời điểm chỉ hiện một dòng chữ: hiện dần ở đầu khoảng, mờ dần ở cuối khoảng
  caps.forEach((c) => {
    const [a0, a1] = c.dataset.range.split(',').map(Number); const w = (a1 - a0) * 0.28;
    const o = p < a0 || p > a1 ? 0 : Math.min(clamp01((p - a0) / w), clamp01((a1 - p) / w));
    c.style.opacity = o; c.style.transform = `translateY(${(1 - o) * (p < (a0 + a1) / 2 ? 24 : -24)}px)`;
    c.style.visibility = o > 0.01 ? 'visible' : 'hidden';
  });
  renderer.render(scene, camera);
}
resize(); onScroll(); requestAnimationFrame(frame);
window.__story = { set: (v) => { progress = shown = v; } };
