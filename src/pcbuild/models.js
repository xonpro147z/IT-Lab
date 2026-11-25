// Mô hình 3D linh kiện máy tính dựng bằng code (không cần tệp mô hình ngoài)
// Đơn vị: cm. Vỏ máy: mặt trước hướng +x, mặt hở (bên trái vỏ) hướng +z về phía người xem.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/three/RoundedBoxGeometry.js';

export const BOARD_ORIGIN = new THREE.Vector3(-20.6, 44.0, -9.6); // góc trên-trái (phía cổng I/O) của mainboard
export const BOARD_W = 24.4;
export const boardH = (form) => (form === 'ATX' ? 30.5 : 24.4);

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.25, ...opts }));
  return matCache.get(key);
}
const METAL = () => mat(0xb8bec6, { metalness: 0.85, roughness: 0.3 });
const DARKMETAL = () => mat(0x3a3f47, { metalness: 0.7, roughness: 0.4 });
const COPPER = () => mat(0xc8763a, { metalness: 0.9, roughness: 0.3 });
const GOLD = () => mat(0xd4af37, { metalness: 0.9, roughness: 0.3 });

export function box(w, h, d, material, x = 0, y = 0, z = 0, r = 0) {
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const g = rr > 0.01 ? new RoundedBoxGeometry(w, h, d, 2, rr) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function cyl(r, h, material, x = 0, y = 0, z = 0, axis = 'y', seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material);
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// Tạo texture chữ bằng canvas
export function textTexture(draw, w = 512, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function label(w, h, tex, x, y, z, rot = null, extra = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, metalness: 0.1, ...extra }));
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  return m;
}
const simpleText = (lines, { bg = null, fg = '#fff', font = 'bold 56px Segoe UI, Arial', align = 'center' } = {}, w = 512, h = 256) =>
  textTexture((ctx, W, H) => {
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = fg; ctx.textAlign = align; ctx.textBaseline = 'middle';
    const arr = Array.isArray(lines) ? lines : [lines];
    arr.forEach((ln, i) => {
      const f = typeof ln === 'object' ? ln : { t: ln };
      ctx.font = f.font || font; ctx.fillStyle = f.color || fg;
      ctx.fillText(f.t, align === 'center' ? W / 2 : 24, H * (i + 1) / (arr.length + 1));
    });
  }, w, h);

// ===== Quạt (mặt hướng +z, tâm ở gốc) =====
export function fan(size = 12, { frame = 0x15171a, blade = 0x22252b, rgb = null, thick = 2.5 } = {}) {
  const g = new THREE.Group();
  const fm = mat(frame);
  const s = size, b = s * 0.08;
  g.add(box(s, b, thick, fm, 0, s / 2 - b / 2, 0), box(s, b, thick, fm, 0, -s / 2 + b / 2, 0),
        box(b, s, thick, fm, s / 2 - b / 2, 0, 0), box(b, s, thick, fm, -s / 2 + b / 2, 0, 0));
  const rotor = new THREE.Group(); rotor.name = 'rotor';
  const hub = cyl(s * 0.17, thick * 0.8, mat(blade), 0, 0, 0, 'z');
  rotor.add(hub);
  const bm = mat(blade, { roughness: 0.4, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const bl = box(s * 0.36, s * 0.16, 0.12, bm);
    const piv = new THREE.Group();
    bl.position.x = s * 0.25; bl.rotation.x = 0.5;
    piv.add(bl); piv.rotation.z = (i / 7) * Math.PI * 2;
    rotor.add(piv);
  }
  g.add(rotor);
  if (rgb !== null) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(s * 0.44, s * 0.025, 8, 48), new THREE.MeshStandardMaterial({ color: rgb, emissive: rgb, emissiveIntensity: 0.25 }));
    ring.position.z = thick / 2; ring.name = 'rgb';
    g.add(ring);
  }
  return g;
}

// ===== Vỏ máy =====
export function caseModel(part) {
  const g = new THREE.Group();
  const c = part.color, light = c > 0x888888;
  const shell = mat(c, { metalness: 0.4, roughness: 0.45 });
  const inner = mat(light ? 0xdfe3e7 : 0x24272d, { metalness: 0.3, roughness: 0.7 });
  // khay mainboard (vách sau)
  g.add(box(44, 46, 0.4, inner, 0, 23, -10.7));
  // lỗ đi dây trên khay
  const hole = mat(0x0b0c0e);
  [[5.5, 34], [5.5, 22], [-14, 12.5]].forEach(([x, y], i) => g.add(box(i === 2 ? 8 : 2, i === 2 ? 1.6 : 6, 0.05, hole, x, y, -10.47, 0.3)));
  // nóc, đáy, mặt trước, mặt sau
  g.add(box(45, 0.7, 22, shell, 0, 46.35, 0, 0.3));
  g.add(box(45, 0.7, 22, shell, 0, -0.35, 0, 0.3));
  g.add(box(0.8, 47.4, 22, shell, 22.5, 23, 0, 0.3));
  g.add(box(0.6, 47.4, 22, shell, -22.4, 23, 0, 0.2));
  // lưới thoáng mặt trước
  const mesh = textTexture((ctx, W, H) => {
    ctx.fillStyle = light ? '#cfd4da' : '#111'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = light ? '#9aa1a9' : '#2a2d33';
    for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < W; x += 12) { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); }
  }, 256, 512);
  g.add(label(20, 44, mesh, 22.95, 23, 0, [0, Math.PI / 2, 0]));
  // khung viền phía mặt hở
  const edge = mat(c, { metalness: 0.5, roughness: 0.4 });
  g.add(box(45, 0.8, 0.8, edge, 0, 46.3, 10.9), box(45, 0.8, 0.8, edge, 0, -0.3, 10.9),
        box(0.8, 47, 0.8, edge, 22.4, 23, 10.9), box(0.8, 47, 0.8, edge, -22.4, 23, 10.9));
  // nắp chắn khe PCIe ở mặt sau
  for (let i = 0; i < 7; i++) g.add(box(0.15, 1.6, 12, mat(0x8b9199, { metalness: 0.8 }), -22.0, 28.4 - i * 2.03, 2.5));
  // vùng I/O mặt sau
  g.add(box(0.1, 10.2, 2.6, hole, -22.05, 38.6, -8.0));
  // nút nguồn trên nóc
  const btn = cyl(0.9, 0.5, mat(0x222222, { metalness: 0.6 }), 18.5, 46.9, 7.5);
  btn.name = 'powerButton';
  const led = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 8, 32), new THREE.MeshStandardMaterial({ color: 0x66ccff, emissive: 0x000000 }));
  led.rotation.x = Math.PI / 2; led.position.set(18.5, 47.15, 7.5); led.name = 'powerLed';
  g.add(btn, led);
  g.add(box(1.2, 0.3, 0.6, hole, 15.8, 46.8, 7.5, 0.1), box(1.2, 0.3, 0.6, hole, 13.8, 46.8, 7.5, 0.1));
  // chân đế
  [[-19, -8], [-19, 8], [19, -8], [19, 8]].forEach(([x, z]) => g.add(box(4, 1.2, 2, mat(0x111111), x, -1.3, z, 0.4)));
  // quạt mặt trước (hút gió) và quạt sau (thổi gió)
  [36, 23].forEach((y) => { const f = fan(12, { rgb: part.accent }); f.rotation.y = -Math.PI / 2; f.position.set(20.6, y, -0.5); g.add(f); });
  const rf = fan(12, { rgb: part.accent }); rf.rotation.y = Math.PI / 2; rf.position.set(-20.8, 37.5, 0.5); g.add(rf);
  // lồng ổ cứng phía trước dưới
  const cage = mat(light ? 0xc9ced4 : 0x2f333a, { metalness: 0.6 });
  g.add(box(13.4, 9, 0.3, cage, 13.2, 4.8, -7.6), box(13.4, 9, 0.3, cage, 13.2, 4.8, 3.9), box(13.4, 0.3, 11.8, cage, 13.2, 9.2, -1.85));
  g.add(box(13.4, 0.2, 0.8, cage, 13.2, 3.4, -7.1), box(13.4, 0.2, 0.8, cage, 13.2, 3.4, 3.4));
  return g;
}

// ===== Mainboard (gốc ở góc trên-trái, mặt linh kiện hướng +z) =====
export function motherboardModel(part) {
  const g = new THREE.Group();
  const H = boardH(part.form), W = BOARD_W;
  const pcb = mat(part.color, { roughness: 0.7, metalness: 0.15 });
  g.add(box(W, H, 0.16, pcb, W / 2, -H / 2, 0.08));
  const acc = '#' + part.accent.toString(16).padStart(6, '0');
  // in lụa: đường mạch + chữ
  const silk = textTexture((ctx, CW, CH) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      ctx.beginPath(); let x = Math.random() * CW, y = Math.random() * CH; ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) { if (k % 2) x += (Math.random() - 0.5) * 200; else y += (Math.random() - 0.5) * 200; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.fillStyle = acc; ctx.font = 'bold 44px Segoe UI, Arial'; ctx.save(); ctx.translate(CW * 0.92, CH * 0.62); ctx.rotate(-Math.PI / 2); ctx.fillText(part.label || part.chipset, 0, 0); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '20px monospace';
    ctx.fillText('CPU_FAN', CW * 0.30, CH * 0.06); ctx.fillText('ATX_PWR', CW * 0.86, CH * 0.20);
    ctx.fillText('PCIEX16_1', CW * 0.20, CH * (part.form === 'ATX' ? 0.565 : 0.70)); ctx.fillText('M.2_1', CW * 0.30, CH * (part.form === 'ATX' ? 0.45 : 0.57));
    ctx.fillText('F_PANEL', CW * 0.74, CH * 0.985); ctx.fillText('SATA6G', CW * 0.86, CH * (part.form === 'ATX' ? 0.53 : 0.66));
  }, 512, Math.round(512 * H / W));
  g.add(label(W, H, silk, W / 2, -H / 2, 0.165));
  const hs = mat(part.accent, { metalness: 0.8, roughness: 0.35 });
  // cụm cổng I/O + tản VRM
  g.add(box(3, 10, 2.4, DARKMETAL(), 1.9, -6, 1.36, 0.2));
  g.add(box(9, 1.8, 1.6, hs, 8.6, -1.7, 0.96, 0.2), box(1.6, 8, 1.6, hs, 4.4, -7.5, 0.96, 0.2));
  // socket CPU
  const sock = new THREE.Group(); sock.position.set(9.5, -7.5, 0.16);
  sock.add(box(4.6, 4.6, 0.3, mat(0x2a2a2a), 0, 0, 0.15));
  const frm = METAL();
  sock.add(box(4.8, 0.25, 0.45, frm, 0, 2.35, 0.22), box(4.8, 0.25, 0.45, frm, 0, -2.35, 0.22), box(0.25, 4.8, 0.45, frm, 2.35, 0, 0.22), box(0.25, 4.8, 0.45, frm, -2.35, 0, 0.22));
  sock.add(box(0.15, 4.4, 0.15, frm, 2.75, 0, 0.3));
  const pinTex = textTexture((ctx, W2, H2) => { ctx.fillStyle = '#3a3320'; ctx.fillRect(0, 0, W2, H2); ctx.fillStyle = '#c9a646'; for (let y = 6; y < H2; y += 8) for (let x = 6; x < W2; x += 8) ctx.fillRect(x, y, 3, 3); }, 256, 256);
  sock.add(label(3.9, 3.9, pinTex, 0, 0, 0.31));
  g.add(sock);
  // tụ điện quanh socket
  for (let i = 0; i < 6; i++) g.add(cyl(0.22, 0.7, mat(0x222222, { metalness: 0.6 }), 6.2 + i * 1.0, -10.9, 0.5, 'z', 12));
  // khe RAM
  [16.0, 16.9, 17.8, 18.7].forEach((x, i) => {
    g.add(box(0.65, 13.3, 0.9, mat(i % 2 ? 0x2b2f36 : 0x5b6069), x, -7.5, 0.61));
    g.add(box(0.7, 0.6, 1.1, mat(0xdddddd), x, -0.6, 0.71), box(0.7, 0.6, 1.1, mat(0xdddddd), x, -14.4, 0.71));
  });
  // cổng nguồn 24-pin và 8-pin
  g.add(box(1.0, 5.2, 1.2, mat(0x1a1a1a), 22.9, -10, 0.76));
  g.add(box(2.0, 1.0, 1.2, mat(0x1a1a1a), 5.6, -0.8, 0.76));
  // khe M.2
  g.add(box(0.6, 2.2, 0.5, mat(0x1a1a1a), 5.6, -12.6, 0.41), cyl(0.25, 0.4, METAL(), 13.9, -12.6, 0.36, 'z', 12));
  // khe PCIe
  const pcieY = -16;
  g.add(box(8.9, 0.8, 1.1, METAL(), 4 + 4.45, pcieY, 0.71));
  g.add(box(2.5, 0.8, 1.1, mat(0x1a1a1a), 5.25, -19.5, 0.71));
  if (part.form === 'ATX') { g.add(box(8.9, 0.8, 1.1, mat(0x2a2d33), 8.45, -25.5, 0.71)); g.add(box(2.5, 0.8, 1.1, mat(0x1a1a1a), 5.25, -22.2, 0.71)); }
  // chipset
  g.add(box(4.5, 4.5, 0.9, hs, 17.2, -19.5, 0.61, 0.3));
  g.add(label(3, 1.4, simpleText(part.chipset || '', { fg: '#fff' }), 17.2, -19.5, 1.07));
  // cổng SATA, pin CMOS, F_PANEL
  for (let i = 0; i < 4; i++) g.add(box(0.6, 1.0, 0.8, mat(0x1a1a1a), 23.7, -15.5 - i * 1.2, 0.56));
  g.add(cyl(1, 0.3, METAL(), 13, -22, 0.31, 'z'));
  g.add(box(1.6, 0.6, 0.8, mat(0x1a1a1a), 20.5, -H + 1.0, 0.56));
  return g;
}

// Điểm cắm (theo toạ độ cục bộ của mainboard)
export const BOARD_ANCHORS = {
  cpu: new THREE.Vector3(9.5, -7.5, 0.46),
  ram: new THREE.Vector3(17.8, -7.5, 1.06),
  m2: new THREE.Vector3(9.75, -12.6, 0.5),
  gpu: new THREE.Vector3(4, -16, 1.26),
  'c-24pin': new THREE.Vector3(22.9, -10, 1.4),
  'c-cpu8': new THREE.Vector3(5.6, -0.8, 1.4),
  'c-fp': (form) => new THREE.Vector3(20.5, -boardH(form) + 1.0, 1.0),
  'c-sata-mb': new THREE.Vector3(23.7, -16.1, 1.0),
};

// ===== CPU (gốc ở giữa socket) =====
export function cpuModel(part) {
  const g = new THREE.Group();
  const intel = part.brand === 'intel';
  const w = intel ? 3.75 : 4.0, h = intel ? 4.5 : 4.0;
  g.add(box(w, h, 0.12, mat(0x2e6b3a, { roughness: 0.6 }), 0, 0, 0.06));
  g.add(box(w * 0.85, h * 0.8, 0.32, mat(0xc5cad0, { metalness: 0.85, roughness: 0.25 }), 0, 0, 0.28, 0.12));
  const t = simpleText(intel
    ? [{ t: 'intel', font: 'italic bold 60px Arial', color: '#2b4f8e' }, { t: 'CORE', font: 'bold 40px Arial', color: '#333' }, { t: part.name.replace('Intel Core ', '').replace('Ultra ', 'Ultra '), font: 'bold 36px Arial', color: '#333' }]
    : [{ t: 'AMD', font: 'bold 64px Arial', color: '#222' }, { t: 'RYZEN', font: 'bold 44px Arial', color: '#333' }, { t: part.name.replace('AMD Ryzen ', ''), font: 'bold 36px Arial', color: '#333' }], {}, 256, 300);
  g.add(label(w * 0.8, h * 0.75, t, 0, 0, 0.45));
  // dấu tam giác ở góc
  const tri = new THREE.Mesh(new THREE.CircleGeometry(0.25, 3), mat(0xd4af37, { metalness: 0.8 }));
  tri.position.set(-w / 2 + 0.3, -h / 2 + 0.3, 0.13); g.add(tri);
  return g;
}

// ===== Tản nhiệt CPU (gốc ở giữa socket, mặt CPU tại z≈0.45) =====
export function coolerModel(part) {
  const g = new THREE.Group();
  const z0 = 0.5;
  if (part.type === 'aio') {
    // bơm gắn trên CPU; két nước gắn dưới nóc vỏ (toạ độ tính tương đối từ socket)
    g.add(box(6.2, 6.2, 1.2, mat(0x111214, { metalness: 0.5 }), 0, 0, z0 + 0.6, 0.6));
    g.add(cyl(3.0, 3.6, mat(0x1a1b1e, { metalness: 0.4 }), 0, 0, z0 + 3.0, 'z', 40));
    const cap = new THREE.Mesh(new THREE.CircleGeometry(2.7, 40), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: part.screen ? 0x2563eb : 0x7c3aed, emissiveIntensity: 0.4 }));
    cap.position.z = z0 + 4.81; cap.name = 'rgb'; g.add(cap);
    const capTx = label(4, 1.4, simpleText(part.screen ? 'KRAKEN' : 'DEEPCOOL', { fg: '#fff' }, 512, 160), 0, 0, z0 + 4.83);
    g.add(capTx);
    const L = part.rad === 360 ? 39.4 : 27.5;
    const rc = new THREE.Vector3(9.4, 8.1, 11.1); // tâm két so với socket
    g.add(box(L, 2.7, 12, mat(0x1b1c1f, { metalness: 0.6, roughness: 0.5 }), rc.x, rc.y, rc.z, 0.3));
    const finT = textTexture((ctx, W, H) => { ctx.fillStyle = '#26282c'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#3a3d42'; ctx.lineWidth = 2; for (let x = 0; x < W; x += 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } }, 512, 128);
    const fins = label(L - 3, 11, finT, rc.x, rc.y - 1.36, rc.z, [Math.PI / 2, 0, 0]); g.add(fins);
    const nF = part.rad === 360 ? 3 : 2;
    for (let i = 0; i < nF; i++) { const f = fan(12, { rgb: 0x7c3aed }); f.rotation.x = Math.PI / 2; f.position.set(rc.x - (nF - 1) * 6.1 + i * 12.2, rc.y - 2.7, rc.z); g.add(f); }
    const tube = (dz) => { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(1.5, 2.6, z0 + 3.5 + dz * 0.3), new THREE.Vector3(3, 6, z0 + 6 + dz), new THREE.Vector3(rc.x - L / 2 + 1.5, rc.y - 1, rc.z - 3 + dz)]); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.45, 10, false), mat(0x151515, { roughness: 0.8 })); m.castShadow = true; return m; };
    g.add(tube(0), tube(2.4));
    return g;
  }
  if (part.type === 'stock') {
    g.add(cyl(4.6, 2.4, mat(0x9aa0a6, { metalness: 0.8, roughness: 0.4 }), 0, 0, z0 + 1.2, 'z', 32));
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const fin = box(0.15, 1.2, 2.4, mat(0x8a9096, { metalness: 0.8 }), Math.cos(a) * 4.7, Math.sin(a) * 4.7, z0 + 1.2); fin.rotation.z = a; g.add(fin); }
    const f = fan(8.4, { thick: 1.6, blade: 0x111111 }); f.position.z = z0 + 3.3; g.add(f);
    g.add(box(9.2, 9.2, 0.3, mat(0x111111), 0, 0, z0 + 2.4, 0.5));
    return g;
  }
  const stack = (cx, fins = 34) => {
    const s = new THREE.Group();
    const finM = mat(0xc9ced4, { metalness: 0.85, roughness: 0.35 });
    for (let i = 0; i < fins; i++) s.add(box(4.6, 12.4, 0.07, finM, 0, 0, 3.2 + i * 0.35));
    const top = box(4.8, 12.6, 0.6, mat(0x15171a, { metalness: 0.6 }), 0, 0, 3.2 + fins * 0.35 + 0.3, 0.2);
    s.add(top);
    s.position.x = cx; return s;
  };
  g.add(box(4.2, 4.2, 0.8, COPPER(), 0, 0, z0 + 0.4, 0.15));
  for (let i = 0; i < 4; i++) g.add(cyl(0.3, 14.5, COPPER(), -0.9 + (i % 2) * 1.8, -1.5 + i * 1.0, z0 + 7.5, 'z', 12));
  if (part.type === 'tower') {
    g.add(stack(0));
    const f = fan(12, { rgb: null }); f.rotation.y = Math.PI / 2; f.position.set(3.6, 0, 9.0); g.add(f);
    g.add(label(4.4, 11.8, simpleText([{ t: part.label || 'TOWER', font: 'bold 60px Arial' }], { fg: '#7fd4ff' }, 512, 128), 0, 0, 3.2 + 34 * 0.35 + 0.62, [0, 0, Math.PI / 2]));
  } else {
    g.add(stack(-3.4), stack(3.4));
    const brown = part.fanColor === 'noctua' ? { frame: 0x5b3a29, blade: 0xc9a27e } : { frame: 0x1b1c1f, blade: 0x2a2d33 };
    const f1 = fan(14, brown); f1.rotation.y = Math.PI / 2; f1.position.set(0, 0, 9.2); f1.scale.setScalar(0.9); g.add(f1);
    const f2 = fan(14, brown); f2.rotation.y = Math.PI / 2; f2.position.set(6.4, 0, 9.2); f2.scale.setScalar(0.9); g.add(f2);
  }
  return g;
}

// ===== RAM (kit 2 thanh, khe 2 và 4) =====
export function ramModel(part) {
  const g = new THREE.Group();
  const ddr5 = part.type === 'DDR5';
  [-0.9, 0.9].forEach((dx) => {
    const s = new THREE.Group(); s.position.x = dx;
    s.add(box(0.12, 13.3, 3.0, mat(0x1f5c2e), 0, 0, 1.5));
    for (let i = 0; i < 40; i++) s.add(box(0.13, 0.18, 0.4, GOLD(), 0, -6.4 + i * 0.33, 0.2));
    s.add(box(0.62, 13.2, 3.0, mat(part.color, { metalness: 0.6, roughness: 0.35 }), 0, 0, 1.9, 0.08));
    const t = simpleText([{ t: ddr5 ? 'DDR5' : 'DDR4', font: 'bold 70px Arial' }, { t: `${part.label || ''} ${part.size / 2}GB`, font: 'bold 44px Arial' }],
      { fg: part.color > 0x888888 ? '#222' : '#eee' }, 512, 128);
    s.add(label(12, 2.2, t, 0.32, 0, 2.0, [0, Math.PI / 2, Math.PI / 2]));
    if (part.rgb) {
      const rgb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 13, 0.4), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x8844ff, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 }));
      rgb.position.z = 3.6; rgb.name = 'rgb'; s.add(rgb);
    }
    g.add(s);
  });
  return g;
}

// ===== SSD M.2 =====
export function m2Model(part) {
  const g = new THREE.Group();
  g.add(box(8.0, 2.2, 0.08, mat(0x111111), 0, 0, 0.04));
  g.add(box(0.4, 2.0, 0.09, GOLD(), -3.85, 0, 0.04));
  g.add(box(1.4, 1.4, 0.15, mat(0x222222), -2.3, 0, 0.15), box(1.6, 1.5, 0.15, mat(0x222222), 0.2, 0, 0.15), box(1.6, 1.5, 0.15, mat(0x222222), 2.4, 0, 0.15));
  const t = simpleText([{ t: 'NVMe SSD', font: 'bold 64px Arial', color: '#fff' }, { t: part.size >= 1000 ? '1TB  PCIe 4.0' : '500GB  PCIe 4.0', font: 'bold 44px Arial', color: '#9fe' }], { bg: '#1c2a44' }, 512, 140);
  g.add(label(6.6, 1.8, t, 0.4, 0, 0.24));
  return g;
}

// ===== Card đồ hoạ (gốc tại đầu khe PCIe, card kéo dài theo +x, quạt hướng xuống -y) =====
export function gpuModel(part) {
  const g = new THREE.Group();
  const L = part.length / 10, T = part.thick, Hh = 11.5;
  const x0 = -4.4;
  const shroud = mat(part.color, { metalness: 0.5, roughness: 0.45 });
  // PCB + chân cắm vàng
  g.add(box(L - 0.4, 0.16, Hh, mat(0x1a1a1a), x0 + 0.2 + (L - 0.4) / 2, 0, Hh / 2 + 0.3));
  g.add(box(8.6, 0.17, 0.9, GOLD(), 4.45, 0, 0.2));
  // backplate
  g.add(box(L - 0.4, 0.25, Hh, mat(0x2b2e33, { metalness: 0.7 }), x0 + 0.2 + (L - 0.4) / 2, 0.22, Hh / 2 + 0.3, 0.1));
  // vỏ tản nhiệt + quạt (mặt dưới)
  g.add(box(L, T - 0.3, Hh + 0.4, shroud, x0 + L / 2, -T / 2 - 0.05, Hh / 2 + 0.3, 0.4));
  const fd = Math.min(9, (L - 1) / part.fans - 0.4);
  for (let i = 0; i < part.fans; i++) {
    const f = fan(fd, { frame: part.color, blade: 0x141518, thick: 0.8 });
    f.rotation.x = Math.PI / 2;
    f.position.set(x0 + (L / part.fans) * (i + 0.5), -T - 0.05, Hh / 2 + 0.3);
    g.add(f);
  }
  // logo và dải RGB ở cạnh trên
  const brand = part.brand === 'nvidia' ? (part.name.includes('GTX') ? 'GEFORCE GTX' : 'GEFORCE RTX') : part.brand === 'intel' ? 'INTEL ARC' : 'RADEON';
  const bcol = part.brand === 'nvidia' ? '#76b900' : part.brand === 'intel' ? '#3ba1ff' : '#ed1c24';
  const name = (part.maker ? part.maker.toUpperCase() + '  ' : '') + (part.name.match(/(GTX|RTX|RX|Arc)\s?[A-Z]?\d{3,4}( Ti| SUPER| XT)*/) || [''])[0].replace('Arc ', '');
  const lt = simpleText([{ t: brand, font: 'bold 54px Arial', color: bcol }, { t: name, font: 'bold 40px Arial', color: part.color > 0x888888 ? '#222' : '#eee' }], {}, 512, 160);
  const lbl = label(Math.min(12, L * 0.5), T * 0.6, lt, x0 + L * 0.55, -T / 2, Hh + 0.71, [0, 0, 0]);
  g.add(lbl);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(L * 0.8, 0.25, 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: part.brand === 'nvidia' ? 0x76b900 : part.brand === 'intel' ? 0x3ba1ff : 0xed1c24, emissiveIntensity: 0.15 }));
  strip.position.set(x0 + L / 2, -T + 0.4, Hh + 0.72); strip.name = 'rgb'; g.add(strip);
  // ke chắn (bracket) phía sau
  g.add(box(0.12, Math.max(T + 0.6, 2.4), 12.2, METAL(), x0 - 0.2, -T / 2 + 0.2, 6.1));
  // cổng nguồn phụ
  if (part.pcie) g.add(box(part.h16 ? 1.9 : part.pcie * 2.0, part.h16 ? 0.7 : 0.9, 0.8, mat(0x111111), x0 + L - 4.5, -T / 2 + 0.3, Hh + 0.7));
  g.userData.powerAnchor = new THREE.Vector3(x0 + L - 4.5, -T / 2 + 0.3, Hh + 1.1);
  return g;
}

// ===== Bộ nguồn (gốc ở tâm hộp) =====
export const PSU_POS = new THREE.Vector3(-13.6, 4.9, -2.4);
export function psuModel(part) {
  const g = new THREE.Group();
  g.add(box(15, 8.6, 15, mat(0x1b1c1f, { metalness: 0.5, roughness: 0.5 }), 0, 0, 0, 0.3));
  const t = simpleText([{ t: `${part.watt}W`, font: 'bold 110px Arial', color: '#fff' }, { t: part.eff || '80 PLUS', font: 'bold 44px Arial', color: /PLATINUM/.test(part.eff) ? '#d9dde3' : /GOLD/.test(part.eff) ? '#e8c35a' : '#cd7f32' }], {}, 512, 300);
  g.add(label(9, 5.5, t, 0, 0, 7.52));
  const grill = textTexture((ctx, W, H) => { ctx.fillStyle = '#0d0d0f'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#555'; ctx.lineWidth = 3; for (let r = 20; r < 128; r += 16) { ctx.beginPath(); ctx.arc(128, 128, r, 0, 7); ctx.stroke(); } }, 256, 256);
  g.add(label(13, 13, grill, 0, -4.32, 0, [Math.PI / 2, 0, 0]));
  // cổng dây phía trước
  g.add(box(0.2, 6, 10, mat(0x0d0d0f), 7.55, 0, 0));
  g.add(box(0.3, 2, 3, mat(0x222222), -7.6, 2, -3), box(0.3, 1.4, 1.2, mat(0xaa2222), -7.6, -1.5, -3));
  return g;
}
export const PSU_OUT = new THREE.Vector3(7.6, 2.5, 4); // điểm ra dây (cục bộ)

// ===== HDD 3.5" (nằm ngang trong lồng ổ cứng) =====
export const HDD_POS = new THREE.Vector3(13.2, 4.8, -1.85);
export function hddModel(part) {
  const g = new THREE.Group();
  g.add(box(14.7, 2.6, 10.2, mat(0x8f969e, { metalness: 0.8, roughness: 0.35 }), 0, 0, 0, 0.15));
  const t = simpleText([{ t: 'HARD DRIVE', font: 'bold 64px Arial', color: '#111' }, { t: `${part.brand || ''} ${part.size >= 1000 ? part.size / 1000 + 'TB' : part.size + 'GB'} 7200 RPM`, font: 'bold 34px Arial', color: '#333' }], { bg: '#e8e8e8' }, 512, 200);
  g.add(label(9, 3.4, t, 0, 1.31, 0, [-Math.PI / 2, 0, 0]));
  g.add(box(0.3, 1.2, 3.2, mat(0x111111), -7.45, 0, 2.5));
  g.userData.port = new THREE.Vector3(-7.5, 0, 2.5);
  return g;
}
// SSD SATA 2.5 inch (đặt trong lồng ổ cứng)
export function ssd25Model(part) {
  const g = new THREE.Group();
  g.add(box(10, 0.7, 7, mat(part.brand === 'Samsung' ? 0x2b2d31 : 0x3a3f47, { metalness: 0.5, roughness: 0.4 }), 1.5, -0.8, 0, 0.15));
  const t = simpleText([{ t: part.brand === 'Samsung' ? 'SAMSUNG' : part.brand.toUpperCase(), font: 'bold 60px Arial', color: '#fff' }, { t: (part.name.match(/\d+(GB|TB)/) || [''])[0] + '  SSD SATA', font: 'bold 38px Arial', color: '#9fe' }], { bg: part.brand === 'Samsung' ? '#1f2a44' : '#3b2a55' }, 512, 220);
  g.add(label(7, 3.2, t, 1.5, -0.44, 0, [-Math.PI / 2, 0, 0]));
  g.add(box(0.3, 0.6, 3.0, mat(0x111111), -3.55, -0.8, 2.3));
  g.userData.port = new THREE.Vector3(-3.6, -0.8, 2.3);
  return g;
}
export const HDD_PORT = new THREE.Vector3(-7.5, 0, 2.5);

// ===== Ống cáp =====
export function cableMesh(points, radius = 0.35, color = 0x111111) {
  const curve = new THREE.CatmullRomCurve3(points);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 10, false), mat(color, { roughness: 0.8, metalness: 0.05 }));
  m.castShadow = true;
  return m;
}

export { label, simpleText };
