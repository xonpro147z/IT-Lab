// Mô hình 3D dựng bằng code cho phân hệ Khám phá phần cứng
import * as THREE from 'three';
import { SHAPES } from './photo/shapes.js';
import { box, cyl, mat, textTexture, label, simpleText, fan, caseModel, motherboardModel, cpuModel, coolerModel, ramModel, gpuModel, psuModel, hddModel, ssd25Model, m2Model } from '../pcbuild/models.js';

const METAL = () => mat(0xc3c8ce, { metalness: 0.9, roughness: 0.25 });
const GOLD = () => mat(0xd4af37, { metalness: 0.9, roughness: 0.3 });
const BLACK = () => mat(0x1b1c1f, { roughness: 0.6 });
const WHITE = () => mat(0xf2f2f2, { roughness: 0.5 });

// ---------- Hình 2D (mm, tâm ở gốc) ----------
const V = (x, y) => new THREE.Vector2(x, y);
function rrect(w, h, r, seg = 6) {
  r = Math.min(r, w / 2, h / 2); const p = [];
  const c = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2], [-w / 2 + r, -h / 2 + r, Math.PI], [w / 2 - r, -h / 2 + r, Math.PI * 1.5]];
  c.forEach(([cx, cy, a0]) => { for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * Math.PI / 2; p.push(V(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); } });
  return p;
}
// chamfer: kích thước vát ở góc [trên-phải, trên-trái, dưới-trái, dưới-phải]
function chamfer(w, h, [tr = 0, tl = 0, bl = 0, br = 0]) {
  const x = w / 2, y = h / 2, p = [];
  p.push(V(x, y - tr)); if (tr) p.push(V(x - tr, y));
  p.push(V(-x + tl, y)); if (tl) p.push(V(-x, y - tl));
  p.push(V(-x, -y + bl)); if (bl) p.push(V(-x + bl, -y));
  p.push(V(x - br, -y)); if (br) p.push(V(x, -y + br));
  return p;
}
// hình chữ D (D-sub): đáy hẹp hơn đỉnh, bo góc
function dsub(top, bottom, h, r = 1) {
  const pts = [V(top / 2, h / 2), V(-top / 2, h / 2), V(-bottom / 2, -h / 2), V(bottom / 2, -h / 2)];
  const out = [];
  for (let i = 0; i < 4; i++) {
    const p = pts[i], a = pts[(i + 3) % 4], b = pts[(i + 1) % 4];
    const da = a.clone().sub(p).normalize().multiplyScalar(r), db = b.clone().sub(p).normalize().multiplyScalar(r);
    for (let k = 0; k <= 4; k++) { const t = k / 4; const q1 = p.clone().add(da), q2 = p.clone().add(db); out.push(q1.clone().multiplyScalar((1 - t) * (1 - t)).add(p.clone().multiplyScalar(2 * t * (1 - t))).add(q2.clone().multiplyScalar(t * t))); }
  }
  return out;
}
const circle = (r, seg = 40) => Array.from({ length: seg }, (_, i) => V(Math.cos((i / seg) * Math.PI * 2) * r, Math.sin((i / seg) * Math.PI * 2) * r));
const scalePts = (pts, k) => pts.map((p) => p.clone().multiplyScalar(k));
function extrude(pts, depth, material, holes = []) {
  const s = new THREE.Shape(pts);
  holes.forEach((h) => s.holes.push(new THREE.Path(h)));
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 }), material);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function pins(rows, cols, pitch, r, len, material, z = 0, round = true) {
  const g = new THREE.Group();
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const m = round ? cyl(r, len, material, 0, 0, 0, 'z', 10) : box(r * 2, r * 2, len, material);
    m.position.set((j - (cols - 1) / 2) * pitch, ((rows - 1) / 2 - i) * pitch, z + len / 2); g.add(m);
  }
  return g;
}

// ---------- Phích cắm & cổng (dựng theo trục +z) ----------
function plug({ outline, len = 8, housing = [14, 8, 24], hColor = 0x1b1c1f, shell = METAL(), cableR = 2, cableColor = 0x1e1e1e, inner = null, rounded = 2, text = null, hollow = true }) {
  const g = new THREE.Group();
  if (outline && hollow) {
    // vỏ kim loại rỗng ruột + lòng tối bên trong (giống đầu cắm thật nhìn từ phía trước)
    const b = new THREE.Box2().setFromPoints(outline); const sz = b.getSize(new THREE.Vector2());
    const t = Math.min(0.45, sz.y * 0.12);
    const inset = outline.map((p) => new THREE.Vector2(p.x * (1 - (2 * t) / sz.x), p.y * (1 - (2 * t) / sz.y)));
    g.add(extrude(outline, len, shell, [inset]));
    const core = extrude(inset, len - 0.6, mat(0x0d0d0f, { roughness: 0.9 })); g.add(core);
  } else if (outline) g.add(extrude(outline, len, shell));
  if (inner) g.add(inner);
  const [w, h, d] = housing;
  g.add(box(w, h, d, mat(hColor, { roughness: 0.5 }), 0, 0, -d / 2, rounded));
  if (text) g.add(label(w * 0.7, h * 0.5, simpleText(text, { fg: hColor > 0x888888 ? '#333' : '#ddd', font: 'bold 70px Arial' }, 512, 200), 0, h / 2 + 0.02, -d / 2, [-Math.PI / 2, 0, Math.PI]));
  g.add(cyl(cableR * 1.4, 6, mat(hColor, { roughness: 0.6 }), 0, 0, -d - 3, 'z'));
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, -d - 5), new THREE.Vector3(0, 0, -d - 12), new THREE.Vector3(2, -3, -d - 19), new THREE.Vector3(5, -7, -d - 23)]);
  const c = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, cableR, 12, false), mat(cableColor, { roughness: 0.8 })); c.castShadow = true; g.add(c);
  return g;
}
function port({ outline, panel = [30, 20], depth = 9, plate = mat(0x2b2d31, { metalness: 0.6, roughness: 0.4 }), inner = null, ring = null }) {
  const g = new THREE.Group();
  g.add(extrude(rrect(panel[0], panel[1], 2), 1.2, plate, [outline]));
  const back = extrude(outline, depth, mat(0x0b0b0c, { roughness: 0.9 })); back.position.z = -depth; g.add(back);
  if (ring) { const rg = extrude(scalePts(outline, 1.12), 0.4, mat(ring, { roughness: 0.4 }), [outline]); rg.position.z = 1.2; g.add(rg); }
  if (inner) g.add(inner);
  return g;
}
// Đặt phích cắm bên trái hướng sang phải, cổng bên phải
function pair(p, q, gap = 22) {
  const g = new THREE.Group();
  // cả đầu cắm và cổng đều quay mặt về phía người xem để dễ nhận biết hình dạng
  p.rotation.y = 0.55; p.position.x = -gap * 0.8; g.add(p);
  q.rotation.y = -0.35; q.position.x = gap * 0.8; g.add(q);
  return g;
}

// ---------- Từng loại đầu nối ----------
const C = {};
C.usbA = (blue = false) => {
  const tongueP = box(11, 2, 7, mat(blue ? 0x1e63d6 : 0x111111), 0, -1, 3.6);
  const contacts = new THREE.Group(); for (let i = 0; i < 4; i++) contacts.add(box(1, 0.1, 4, GOLD(), -3 + i * 2, 0.05, 4));
  const p = plug({ outline: rrect(12, 4.5, 0.4), len: 12, housing: [16, 8, 26], inner: new THREE.Group().add(tongueP, contacts), text: 'USB' });
  const q = port({ outline: rrect(12.4, 4.9, 0.4), panel: [24, 14], depth: 13, inner: box(11, 1.8, 11, mat(blue ? 0x1e63d6 : 0x111111), 0, 1.1, -5.5) });
  return pair(p, q);
};
C.usbC = (bolt = false) => {
  const p = plug({ outline: rrect(8.3, 2.5, 1.25), len: 6.5, housing: [12, 6.5, 20], hColor: bolt ? 0x1b1c1f : 0xf0f0f0, cableColor: bolt ? 0x1e1e1e : 0xf0f0f0, cableR: 1.8, rounded: 3, text: bolt ? '⚡' : 'USB-C' });
  const q = port({ outline: rrect(8.6, 2.8, 1.4), panel: [18, 12], depth: 7, inner: new THREE.Group().add(box(6.6, 0.7, 6, mat(0x111111), 0, 0, -3), ...Array.from({ length: 12 }, (_, i) => box(0.3, 0.75, 4, GOLD(), -2.75 + i * 0.5, 0, -2.5))) });
  return pair(p, q, 16);
};
C.microUSB = () => {
  const out = chamfer(6.85, 1.8, [0, 0, 0.8, 0.8]);
  const p = plug({ outline: out, len: 5.5, housing: [10, 6, 16], cableR: 1.6 });
  const q = port({ outline: chamfer(7.2, 2.1, [0, 0, 0.9, 0.9]), panel: [16, 10], depth: 6, inner: box(5, 0.5, 4.5, mat(0x111111), 0, 0.4, -2.5) });
  return pair(p, q, 14);
};
C.miniUSB = () => {
  const out = chamfer(6.8, 3.1, [0, 0, 1.2, 1.2]);
  const p = plug({ outline: out, len: 7, housing: [12, 7.5, 18], cableR: 1.9 });
  const q = port({ outline: chamfer(7.2, 3.5, [0, 0, 1.3, 1.3]), panel: [18, 12], depth: 8, inner: box(5, 1.1, 6, mat(0x111111), 0, 0.6, -3.5) });
  return pair(p, q, 16);
};
C.usbB = () => {
  const out = chamfer(8, 7.3, [1.6, 1.6, 0, 0]);
  const p = plug({ outline: out, len: 9, housing: [14, 12, 24], inner: new THREE.Group().add(box(4, 3.5, 7, mat(0x111111), 0, 0, 3.5)) });
  const q = port({ outline: chamfer(8.4, 7.7, [1.7, 1.7, 0, 0]), panel: [20, 18], depth: 10, inner: box(4.6, 4, 9, mat(0x111111), 0, 0, -4.5) });
  return pair(p, q, 20);
};
C.lightning = () => {
  const g = new THREE.Group();
  g.add(extrude(rrect(6.7, 1.5, 0.75), 7.7, METAL()));
  for (let i = 0; i < 8; i++) { g.add(box(0.45, 0.1, 2.2, GOLD(), -2.1 + i * 0.6, 0.76, 6)); }
  const p = plug({ outline: null, housing: [9, 5, 16], hColor: 0xf5f5f5, cableColor: 0xf5f5f5, cableR: 1.5, inner: g, rounded: 2 });
  const q = port({ outline: rrect(7.2, 2, 1), panel: [16, 10], depth: 8, plate: mat(0xd9dde3, { metalness: 0.8, roughness: 0.3 }) });
  return pair(p, q, 15);
};
C.firewire = () => {
  const out = [...rrect(10.6, 5.8, 0.6).filter((v) => v.x > -2), ...circle(2.9, 24).filter((v) => v.x <= 0).map((v) => V(v.x - 2.4, v.y))].sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
  const shp = rrect(10.6, 5.8, 2.6);
  const p = plug({ outline: shp, len: 8, housing: [15, 10, 26], hColor: 0x6b7280, inner: box(7, 1.6, 6, mat(0x222222), 0, 0, 4) });
  const q = port({ outline: rrect(11, 6.2, 2.8), panel: [22, 14], depth: 9, inner: box(7, 1.4, 8, mat(0x222222), 0, 0, -4) });
  return pair(p, q, 18);
};
C.hdmi = (mini = false) => {
  const k = mini ? 0.75 : 1;
  const out = scalePts(chamfer(14, 4.5, [0, 0, 1.4, 1.4]), k);
  const p = plug({ outline: out, len: 10 * k, housing: [21 * k, 11 * k, 30 * k], text: 'HDMI', cableR: 3 * k, inner: box(10 * k, 1.2, 8 * k, mat(0x111111), 0, -1 * k, 5 * k) });
  const q = port({ outline: scalePts(chamfer(14.4, 4.9, [0, 0, 1.5, 1.5]), k), panel: [26 * k, 14 * k], depth: 11 * k, inner: box(10 * k, 1.3, 10 * k, mat(0x111111), 0, 0.8 * k, -5 * k) });
  return pair(p, q, 22 * k);
};
C.dp = (mini = false) => {
  const out = mini ? chamfer(7.5, 4.6, [0, 0, 1.3, 1.3]) : chamfer(16, 4.8, [0, 0, 0, 2]);
  const p = plug({ outline: out, len: mini ? 6 : 9, housing: mini ? [11, 8, 20] : [22, 10, 28], text: mini ? null : 'DP', cableR: mini ? 2 : 3, inner: box(mini ? 5 : 12, 1.2, 6, mat(0x111111), 0, -0.9, 4) });
  const q = port({ outline: mini ? chamfer(7.9, 5, [0, 0, 1.4, 1.4]) : chamfer(16.4, 5.2, [0, 0, 0, 2.1]), panel: mini ? [16, 12] : [26, 14], depth: 9, inner: box(mini ? 5 : 12, 1.2, 8, mat(0x111111), 0, 0.9, -4) });
  return pair(p, q, mini ? 16 : 22);
};
function dsubPair({ top, bottom, h, rows, hColor, pinsPlug = true, panelColor = 0x2b2d31, label: lbl = null, pinCount = null }) {
  const shell = dsub(top, bottom, h, 1.2);
  const pg = new THREE.Group();
  pg.add(extrude(shell, 6, METAL()));
  const ins = extrude(dsub(top - 1.6, bottom - 1.6, h - 1.6, 0.8), 5.5, mat(0x1b1c1f)); pg.add(ins);
  let k = 0; rows.forEach((n, ri) => { for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * (top / (rows[0] + 1)); const y = ((rows.length - 1) / 2 - ri) * (h / (rows.length + 0.8)); const pin = cyl(0.5, 5, METAL(), x, y, 7, 'z', 8); pg.add(pin); k++; } });
  const W = top + 14, H = h + 8;
  const p = plug({ outline: null, housing: [W, H, 20], hColor, inner: pg, cableR: 3.5, text: lbl });
  [-1, 1].forEach((sx) => p.add(cyl(1.4, 10, METAL(), sx * (top / 2 + 4), 0, 2, 'z', 12)));
  const q = new THREE.Group();
  q.add(extrude(rrect(W + 6, H + 4, 1), 1.2, mat(panelColor, { metalness: 0.6, roughness: 0.4 })));
  const qs = extrude(dsub(top, bottom, h, 1.2), 7, METAL(), [dsub(top - 1.6, bottom - 1.6, h - 1.6, 0.8)]); qs.position.z = 1.2; q.add(qs);
  const qi = extrude(dsub(top - 1.6, bottom - 1.6, h - 1.6, 0.8), 6, mat(0x2a2a2a)); qi.position.z = 1.2; q.add(qi);
  rows.forEach((n, ri) => { for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * (top / (rows[0] + 1)); const y = ((rows.length - 1) / 2 - ri) * (h / (rows.length + 0.8)); q.add(cyl(0.55, 0.1, mat(0x000000), x, y, 7.25, 'z', 8)); } });
  [-1, 1].forEach((sx) => q.add(cyl(1.6, 3, METAL(), sx * (top / 2 + 4), 0, 2.5, 'z', 6)));
  return pair(p, q, W * 0.9 + 6);
}
C.vga = () => dsubPair({ top: 17, bottom: 14.5, h: 8, rows: [5, 5, 5], hColor: 0x1f4e9e, label: 'VGA', panelColor: 0x1f4e9e });
C.db9 = () => dsubPair({ top: 17, bottom: 14.5, h: 8, rows: [5, 4], hColor: 0x2b2d31, label: 'RS-232' });
C.db25 = () => dsubPair({ top: 39, bottom: 36, h: 8, rows: [13, 12], hColor: 0x6d28d9, label: 'LPT', panelColor: 0x6d28d9 });
C.dvi = () => {
  const out = chamfer(26, 8.5, [0, 0, 2, 0]);
  const pg = new THREE.Group(); pg.add(extrude(out, 7, METAL()));
  const ins = extrude(chamfer(24, 7, [0, 0, 1.6, 0]), 6.5, mat(0xf5f5f5)); pg.add(ins);
  const pp = pins(3, 8, 1.9, 0.35, 5, GOLD(), 6.5); pp.position.x = 2.5; pg.add(pp);
  pg.add(box(5, 0.8, 5, GOLD(), -9, 0, 9));
  const p = plug({ outline: null, housing: [40, 15, 22], hColor: 0xf2f2f2, cableColor: 0xf2f2f2, inner: pg, cableR: 3.5, text: 'DVI' });
  [-1, 1].forEach((sx) => p.add(cyl(1.4, 10, METAL(), sx * 17, 0, 2, 'z', 12)));
  const q = port({ outline: chamfer(26.4, 8.9, [0, 0, 2, 0]), panel: [44, 16], depth: 8, plate: mat(0xf2f2f2, { roughness: 0.5 }) });
  return pair(p, q, 34);
};
C.rj45 = (rj11 = false) => {
  const w = rj11 ? 9.6 : 11.7, h = rj11 ? 6.6 : 8, n = rj11 ? 4 : 8;
  const body = new THREE.Group();
  const clear = new THREE.MeshPhysicalMaterial({ color: 0xe6f2ff, transmission: 0.7, roughness: 0.15, thickness: 1, transparent: true, opacity: 0.85 });
  body.add(box(w, h, 22, clear, 0, 0, 11, 0.6));
  for (let i = 0; i < n; i++) body.add(box(0.35, 1.4, 4, GOLD(), (i - (n - 1) / 2) * (w / (n + 1)), h / 2 - 0.9, 19));
  const clip = box(w * 0.45, 0.8, 12, clear, 0, -h / 2 - 1.2, 12); clip.rotation.x = 0.18; body.add(clip);
  const colors = [0xf5a623, 0xffffff, 0x2ea44f, 0x1d4ed8, 0xffffff, 0x2ea44f, 0xa0522d, 0xffffff];
  for (let i = 0; i < n; i++) body.add(box(0.8, 0.8, 8, mat(colors[i]), (i - (n - 1) / 2) * (w / (n + 1)), 0.5, 4));
  const p = plug({ outline: null, housing: [w + 2, h + 2, 10], hColor: rj11 ? 0xe5e7eb : 0x2563eb, cableColor: rj11 ? 0xe5e7eb : 0x2563eb, inner: body, cableR: 2.7, rounded: 1.5 });
  const q = port({ outline: [...chamfer(w + 0.6, h + 0.6, [0, 0, 0, 0])], panel: [w + 10, h + 12], depth: 18, plate: mat(0xc3c8ce, { metalness: 0.8, roughness: 0.3 }), inner: new THREE.Group().add(...Array.from({ length: n }, (_, i) => box(0.35, 0.3, 6, GOLD(), (i - (n - 1) / 2) * (w / (n + 1)), h / 2 - 1, -4))) });
  q.add(box(3, 0.6, 0.3, mat(0x22c55e, { emissive: 0x22c55e, emissiveIntensity: 0.8 }), -w / 2 + 1, h / 2 + 3.5, 1.3));
  q.add(box(3, 0.6, 0.3, mat(0xf59e0b, { emissive: 0xf59e0b, emissiveIntensity: 0.8 }), w / 2 - 1, h / 2 + 3.5, 1.3));
  return pair(p, q, 26);
};
C.audio = () => {
  const g = new THREE.Group();
  const segs = [[0, 6, METAL()], [6, 0.8, mat(0x111111)], [6.8, 3.8, METAL()], [10.6, 0.8, mat(0x111111)], [11.4, 3.2, METAL()]];
  segs.forEach(([z, l, m]) => g.add(cyl(1.75, l, m, 0, 0, 14 - z - l / 2, 'z', 24)));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(1.75, 20, 12), METAL()).translateZ(14));
  const p = plug({ outline: null, housing: [6, 6, 18], inner: g, cableR: 1.6, rounded: 2.9 });
  const q = port({ outline: circle(1.8), panel: [16, 16], depth: 14, ring: 0x22c55e });
  return pair(p, q, 18);
};
C.ps2 = (color = 0x7c3aed) => {
  const g = new THREE.Group();
  g.add(extrude(circle(4.75), 6, METAL()));
  const ins = extrude(circle(4.2), 5.8, mat(0x1b1c1f)); g.add(ins);
  [[-2.2, 1.6], [2.2, 1.6], [-3.2, -0.8], [3.2, -0.8], [-1.2, -2.6], [1.2, -2.6]].forEach(([x, y]) => g.add(cyl(0.4, 4, METAL(), x, y, 7.5, 'z', 8)));
  g.add(box(1.6, 1.4, 5.5, mat(0x1b1c1f), 0, 3.2, 3));
  const p = plug({ outline: null, housing: [11, 11, 22], hColor: color, cableColor: color, inner: g, cableR: 2.3, rounded: 5 });
  const q = port({ outline: circle(4.9), panel: [18, 18], depth: 8, plate: mat(color, { roughness: 0.5 }) });
  return pair(p, q, 18);
};
C.sata = () => {
  const g = new THREE.Group();
  const data = extrude(chamfer(10.5, 2.4, [0, 0, 0, 0]), 8, mat(0xdc2626, { roughness: 0.5 })); data.position.set(-11, 6, 0); g.add(data);
  g.add(box(8, 0.6, 30, mat(0xdc2626), -11, 6, -15));
  const pw = extrude(chamfer(21, 2.4, [0, 0, 0, 0]), 8, mat(0x111111)); pw.position.set(9, 6, 0); g.add(pw);
  ['#111', '#111', '#f5c400', '#111', '#e11d48'].forEach((c, i) => g.add(cyl(0.6, 30, mat(new THREE.Color(c).getHex()), 3 + i * 2.6, 6, -15, 'z', 8)));
  const drive = new THREE.Group();
  drive.add(box(70, 9, 50, mat(0x8f969e, { metalness: 0.8, roughness: 0.35 }), 0, -6, -34));
  drive.add(box(10.8, 2.6, 0.5, mat(0x111111), -11, 6, -6.5), box(21.3, 2.6, 0.5, mat(0x111111), 9, 6, -6.5));
  const p = g; p.position.z = 6;
  const out = new THREE.Group(); out.add(p, drive); out.rotation.y = -0.4;
  return out;
};
C.molex = () => {
  const g = new THREE.Group();
  g.add(extrude(chamfer(21, 8.5, [2, 2, 0, 0]), 12, WHITE()));
  [[-7.6], [-2.5], [2.5], [7.6]].forEach(([x], i) => { g.add(cyl(1.0, 1, mat(0x111111), x, 0, 12.4, 'z', 12)); g.add(cyl(0.8, 30, mat([0xf5c400, 0x111111, 0x111111, 0xe11d48][i]), x, 0, -15, 'z', 8)); });
  return g;
};
C.atx24 = () => { const g = new THREE.Group(); g.add(box(53, 10, 14, BLACK(), 0, 0, 0, 0.5)); const pp = pins(2, 12, 4.2, 1.3, 0.4, mat(0x000000), 7, false); g.add(pp); g.add(box(4, 2, 6, BLACK(), 0, 6, 0)); for (let i = 0; i < 24; i++) g.add(cyl(0.7, 40, mat([0xf5c400, 0x111111, 0xe11d48, 0xf97316, 0x16a34a, 0x7c3aed][i % 6]), -23 + (i % 12) * 4.2, i < 12 ? 2 : -2, -27, 'z', 6)); return g; };
C.pcie8 = () => { const g = new THREE.Group(); g.add(box(17.5, 9, 14, BLACK(), 0, 0, 0, 0.5)); g.add(pins(2, 4, 4.2, 1.3, 0.4, mat(0x000000), 7, false)); g.add(box(3.5, 2, 6, BLACK(), 0, 5.5, 0)); for (let i = 0; i < 8; i++) g.add(cyl(0.7, 36, mat(i < 4 ? 0xf5c400 : 0x111111), -6.3 + (i % 4) * 4.2, i < 4 ? 2 : -2, -25, 'z', 6)); return g; };
C.h12v = () => { const g = new THREE.Group(); g.add(box(19, 8, 14, BLACK(), 0, 0, 0, 0.5)); g.add(pins(2, 6, 3, 1, 0.4, mat(0x000000), 7, false)); g.add(box(12, 2, 14, BLACK(), 0, -5, 0)); g.add(pins(1, 4, 3, 0.5, 0.4, mat(0x000000), 7, false).translateY(-5)); g.add(box(3, 1.5, 5, BLACK(), 0, 4.8, 0)); for (let i = 0; i < 12; i++) g.add(cyl(0.6, 36, BLACK(), -7.5 + (i % 6) * 3, i < 6 ? 1.5 : -1.5, -25, 'z', 6)); return g; };
C.iec = () => {
  const out = chamfer(18, 14, [0, 0, 4, 4]);
  const g = new THREE.Group(); g.add(extrude(out, 10, BLACK()));
  [[-4.5, 2], [4.5, 2], [0, -3]].forEach(([x, y]) => { const h = box(1.5, 4, 0.2, mat(0x000000), x, y, 10.1); g.add(h); });
  const p = plug({ outline: null, housing: [22, 18, 26], inner: g, cableR: 4 });
  const q = port({ outline: chamfer(18.6, 14.6, [0, 0, 4.2, 4.2]), panel: [32, 24], depth: 12, plate: BLACK(), inner: new THREE.Group().add(...[[-4.5, 2], [4.5, 2], [0, -3]].map(([x, y]) => box(1.2, 4, 8, METAL(), x, y, -4))) });
  return pair(p, q, 26);
};
C.barrel = () => {
  const g = new THREE.Group(); g.add(extrude(circle(2.75), 9.5, METAL(), [circle(1.1)]));
  const p = plug({ outline: null, housing: [8, 8, 18], inner: g, cableR: 2, rounded: 3.9 });
  const q = port({ outline: circle(3), panel: [16, 16], depth: 12, inner: cyl(0.65, 10, METAL(), 0, 0, -5, 'z', 12) });
  return pair(p, q, 16);
};
C.magsafe = () => {
  const g = new THREE.Group(); g.add(extrude(rrect(13, 4.5, 2.25), 3, METAL()));
  for (let i = 0; i < 5; i++) g.add(cyl(0.6, 0.6, GOLD(), -4 + i * 2, 0, 3.2, 'z', 10));
  const p = plug({ outline: null, housing: [15, 6, 10], hColor: 0xd9dde3, cableColor: 0xf2f2f2, inner: g, cableR: 1.8, rounded: 2.9 });
  p.add(box(2, 0.6, 0.6, mat(0x22c55e, { emissive: 0x22c55e, emissiveIntensity: 1 }), 0, 3.1, -6));
  const q = port({ outline: rrect(13.4, 4.9, 2.4), panel: [24, 12], depth: 3, plate: mat(0x9aa0a6, { metalness: 0.8, roughness: 0.3 }), inner: new THREE.Group().add(...Array.from({ length: 5 }, (_, i) => cyl(0.6, 1, GOLD(), -4 + i * 2, 0, -2, 'z', 10))) });
  return pair(p, q, 16);
};

// ---------- Thiết bị khác ----------
const M = {};
function screenTex(draw, w = 512, h = 320) { return textTexture(draw, w, h); }
M.floppy = () => {
  const g = new THREE.Group();
  g.add(extrude(chamfer(90, 94, [0, 3, 0, 0]), 3.3, mat(0x2b4c8c, { roughness: 0.5 })));
  const sh = box(50, 28, 0.4, METAL(), 5, 33, 3.4); g.add(sh);
  g.add(box(10, 18, 0.5, mat(0x1d3566), 10, 33, 3.6));
  const lbl = label(70, 38, simpleText([{ t: '3½" HD', font: 'bold 60px Arial', color: '#1f2937' }, { t: '1.44 MB', font: 'bold 52px Arial', color: '#b91c1c' }], { bg: '#f8fafc' }, 512, 280), 0, -18, 3.35); g.add(lbl);
  g.add(box(4, 4, 0.5, mat(0x111111), -40, -41, 3.4));
  g.rotation.x = -0.35;
  return g;
};
M.disc = () => {
  const g = new THREE.Group();
  const m = new THREE.MeshPhysicalMaterial({ color: 0xdedede, metalness: 1, roughness: 0.12, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 800] });
  const d = new THREE.Mesh(new THREE.RingGeometry(7.5, 60, 96), m); d.material.side = THREE.DoubleSide; g.add(d);
  const hub = new THREE.Mesh(new THREE.RingGeometry(7.5, 22, 64), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, transparent: true, opacity: 0.6, side: THREE.DoubleSide })); hub.position.z = 0.05; g.add(hub);
  g.rotation.x = -1.0;
  return g;
};
M.opticalDrive = () => {
  const g = new THREE.Group();
  g.add(box(146, 42, 170, BLACK(), 0, 0, -85, 1));
  g.add(box(140, 3, 100, mat(0x222428), 0, 3, 50));
  const d = M.disc(); d.rotation.x = -Math.PI / 2; d.scale.setScalar(0.95); d.position.set(0, 5, 45); g.add(d);
  g.add(box(10, 3, 1, mat(0x555555), 55, -10, 0.6));
  g.add(box(3, 1.5, 0.6, mat(0x22c55e, { emissive: 0x22c55e }), -55, -10, 0.4));
  return g;
};
M.flash = () => {
  const g = new THREE.Group();
  g.add(box(18, 8, 40, mat(0x2563eb, { roughness: 0.35 }), 0, 0, -20, 3));
  g.add(extrude(rrect(12, 4.5, 0.4), 12, METAL()).translateY(0));
  g.add(box(11, 2, 11, mat(0x1e63d6), 0, -1, 6));
  g.add(cyl(2, 8.2, mat(0xcbd5e1, { metalness: 0.8 }), 0, 0, -35, 'y', 16).rotateZ(Math.PI / 2));
  g.add(label(14, 6, simpleText('64GB', { fg: '#fff', font: 'bold 90px Arial' }, 512, 200), 0, 4.05, -20, [-Math.PI / 2, 0, Math.PI]));
  g.rotation.y = 0.8;
  return g;
};
M.sdcard = () => {
  const g = new THREE.Group();
  const sd = extrude(chamfer(24, 32, [4.5, 0, 0, 0]), 2.1, mat(0x1b1c1f)); g.add(sd);
  for (let i = 0; i < 9; i++) g.add(box(1.6, 3.6, 0.2, GOLD(), -8.8 + i * 2.2, 13.2, -0.1));
  g.add(label(22, 20, simpleText([{ t: 'SD', font: 'bold 120px Arial', color: '#fff' }, { t: 'XC  128GB', font: 'bold 56px Arial', color: '#facc15' }], { bg: '#b91c1c' }, 400, 360), 0, -4, 2.15));
  const lock = box(1.2, 4, 1.2, WHITE(), -12.4, 5, 1); g.add(lock);
  const micro = extrude(chamfer(11, 15, [0, 0, 0, 0]), 1, mat(0x111111)); micro.position.set(26, -8, 0); g.add(micro);
  g.add(label(9, 9, simpleText([{ t: 'micro', font: 'bold 70px Arial', color: '#fff' }, { t: 'SD', font: 'bold 120px Arial', color: '#fff' }], { bg: '#1d4ed8' }, 300, 300), 26, -10, 1.05));
  return g;
};
M.hdd25 = () => { const g = hddModel({ brand: 'Laptop', size: 1000 }); g.scale.set(0.68, 0.36, 0.68); return g; };
M.extDrive = () => {
  const g = new THREE.Group();
  g.add(box(80, 14, 115, mat(0x111827, { roughness: 0.3 }), 0, 0, 0, 6));
  g.add(box(2, 1, 1, mat(0x22c55e, { emissive: 0x22c55e }), 30, 7.2, 50));
  g.add(label(40, 10, simpleText('PORTABLE', { fg: '#9ca3af', font: 'bold 70px Arial' }, 512, 128), 0, 7.05, 10, [-Math.PI / 2, 0, 0]));
  g.add(box(9, 3, 2, BLACK(), 0, 0, 58));
  return g;
};
M.keyboard = () => {
  const g = new THREE.Group();
  g.add(box(440, 14, 140, mat(0x1f2937), 0, 0, 0, 4));
  const keyM = mat(0x374151, { roughness: 0.6 });
  const rows = [15, 14, 14, 13, 12];
  rows.forEach((n, r) => { const pitch = 400 / n; for (let i = 0; i < n; i++) g.add(box(pitch - 3, 8, 17, keyM, -200 + pitch * (i + 0.5), 10, -50 + r * 20, 2)); });
  g.add(box(150, 8, 17, keyM, 0, 10, 50, 2));
  const tt = simpleText('Q   W   E   R   T   Y', { fg: '#e5e7eb', font: 'bold 44px Arial' }, 1024, 64);
  g.add(label(170, 9, tt, -105, 14.1, -30, [-Math.PI / 2, 0, 0]));
  return g;
};
M.mouse = () => {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(30, 40, 24), mat(0x1f2937, { roughness: 0.35 })); body.scale.set(0.62, 0.38, 1); g.add(body);
  g.add(box(1, 4, 28, mat(0x0b0b0b), 0, 9.5, -14));
  const wheel = cyl(3.5, 2.5, mat(0x6b7280), 0, 11, -14, 'x', 20); g.add(wheel);
  const led = new THREE.Mesh(new THREE.TorusGeometry(18, 0.6, 6, 48, Math.PI), mat(0x22d3ee, { emissive: 0x22d3ee, emissiveIntensity: 1 })); led.rotation.x = -Math.PI / 2; led.position.set(0, 0, 10); g.add(led);
  return g;
};
M.monitor = () => {
  const g = new THREE.Group();
  g.add(box(540, 320, 14, mat(0x111214), 0, 220, 0, 6));
  const scr = screenTex((ctx, W, H) => { const gr = ctx.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0a3d8f'); gr.addColorStop(1, '#6fb1ff'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 4; i++) ctx.fillRect(30, 30 + i * 60, 44, 44); ctx.fillStyle = '#1f2937'; ctx.fillRect(0, H - 26, W, 26); });
  g.add(label(524, 296, scr, 0, 222, 7.1, null, { emissive: 0xffffff, emissiveMap: scr, emissiveIntensity: 0.6 }));
  g.add(box(40, 160, 20, mat(0x2b2d31), 0, 80, -20, 4));
  g.add(box(220, 10, 160, mat(0x2b2d31), 0, 5, -10, 5));
  return g;
};
M.printer = () => {
  const g = new THREE.Group();
  g.add(box(420, 160, 320, mat(0xe5e7eb), 0, 80, 0, 10));
  g.add(box(380, 6, 140, mat(0xd1d5db), 0, 60, 200));
  g.add(box(300, 3, 120, mat(0xffffff), 0, 64, 190));
  g.add(box(320, 70, 10, mat(0x9ca3af), 0, 190, -170).rotateX(-0.5));
  g.add(box(110, 30, 3, mat(0x111827), 120, 140, 161));
  g.add(box(14, 6, 3, mat(0x22c55e, { emissive: 0x22c55e }), -160, 140, 161));
  return g;
};
M.webcam = () => {
  const g = new THREE.Group();
  g.add(box(90, 28, 26, mat(0x111214), 0, 40, 0, 12));
  g.add(cyl(10, 3, mat(0x0b0b0c, { metalness: 0.6, roughness: 0.1 }), 0, 40, 13.5, 'z', 32));
  g.add(cyl(6, 1, new THREE.MeshPhysicalMaterial({ color: 0x1e3a8a, metalness: 0.2, roughness: 0, clearcoat: 1 }), 0, 40, 15, 'z', 32));
  g.add(cyl(1.2, 1, mat(0xef4444, { emissive: 0xef4444 }), 25, 40, 13.6, 'z', 12));
  g.add(box(40, 6, 60, mat(0x1f2937), 0, 22, -10, 2));
  return g;
};
M.microphone = () => {
  const g = new THREE.Group();
  const grill = new THREE.Mesh(new THREE.SphereGeometry(28, 32, 24), new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.9, roughness: 0.4, wireframe: true })); grill.position.y = 210; grill.scale.y = 1.4; g.add(grill);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(25, 24, 16), mat(0x374151)).translateY(210));
  g.add(cyl(18, 90, mat(0x1f2937, { metalness: 0.5 }), 0, 140, 0, 'y', 32));
  g.add(cyl(4, 80, METAL(), 0, 60, 0, 'y', 12));
  g.add(cyl(60, 10, mat(0x1f2937), 0, 5, 0, 'y', 40));
  return g;
};
M.speakers = () => {
  const g = new THREE.Group();
  [-90, 90].forEach((x) => {
    g.add(box(120, 200, 130, mat(0x3f2a1d, { roughness: 0.7 }), x, 100, 0, 6));
    g.add(cyl(42, 4, mat(0x111111), x, 75, 66, 'z', 40)); g.add(cyl(14, 6, mat(0x2b2b2b), x, 75, 68, 'z', 30));
    g.add(cyl(18, 4, mat(0x111111), x, 155, 66, 'z', 30)); g.add(new THREE.Mesh(new THREE.SphereGeometry(8, 16, 8), METAL()).translateX(x).translateY(155).translateZ(66));
  });
  return g;
};
M.headphones = () => {
  const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.TorusGeometry(80, 7, 16, 60, Math.PI), mat(0x111214)); band.position.y = 80; g.add(band);
  [-80, 80].forEach((x) => {
    const cup = cyl(42, 30, mat(0x1f2937, { metalness: 0.3 }), x, 70, 0, 'x', 40); g.add(cup);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(32, 10, 12, 40), mat(0x0b0b0c, { roughness: 0.9 })); pad.rotation.y = Math.PI / 2; pad.position.set(x - Math.sign(x) * 18, 70, 0); g.add(pad);
    g.add(cyl(36, 1, mat(0x6b7280, { metalness: 0.8 }), x + Math.sign(x) * 15.5, 70, 0, 'x', 40));
  });
  return g;
};
M.projector = () => {
  const g = new THREE.Group();
  g.add(box(300, 100, 230, WHITE(), 0, 50, 0, 14));
  g.add(cyl(38, 30, mat(0x111214), -70, 55, 120, 'z', 40));
  g.add(cyl(30, 2, new THREE.MeshPhysicalMaterial({ color: 0x60a5fa, roughness: 0, clearcoat: 1, metalness: 0.3 }), -70, 55, 136, 'z', 40));
  for (let i = 0; i < 8; i++) g.add(box(4, 50, 2, mat(0x9ca3af), 60 + i * 9, 55, 116));
  g.add(box(80, 2, 40, mat(0xd1d5db), 70, 101, 0));
  return g;
};
M.controller = () => {
  const g = new THREE.Group();
  const b = mat(0x1f2937, { roughness: 0.4 });
  g.add(box(150, 30, 70, b, 0, 0, 0, 14));
  [-60, 60].forEach((x) => { const grip = new THREE.Mesh(new THREE.SphereGeometry(35, 24, 16), b); grip.scale.set(0.9, 0.5, 1.3); grip.position.set(x, -4, 30); g.add(grip); });
  [[-40, 0], [20, 22]].forEach(([x, z]) => { g.add(cyl(13, 6, mat(0x111111), x, 16, z, 'y', 24)); g.add(cyl(10, 8, mat(0x374151), x, 20, z, 'y', 24)); });
  [[45, -10, 0x22c55e], [58, 0, 0xef4444], [32, 0, 0x3b82f6], [45, 10, 0xfacc15]].forEach(([x, z, c]) => g.add(cyl(5, 6, mat(c), x, 16, z, 'y', 16)));
  g.add(box(26, 5, 8, mat(0x374151), -40, 17, 22)); g.add(box(8, 5, 26, mat(0x374151), -40, 17, 22));
  return g;
};
M.router = () => {
  const g = new THREE.Group();
  g.add(box(260, 40, 170, mat(0x111214), 0, 20, 0, 10));
  [-110, -40, 40, 110].forEach((x, i) => { const a = cyl(6, 170, mat(0x1f2937), x, 110, -80, 'y', 16); a.rotation.z = (i - 1.5) * 0.12; g.add(a); });
  for (let i = 0; i < 6; i++) g.add(box(6, 3, 2, mat(0x22d3ee, { emissive: 0x22d3ee, emissiveIntensity: 1 }), -60 + i * 22, 30, 86));
  return g;
};
M.switch = () => {
  const g = new THREE.Group();
  g.add(box(440, 44, 200, mat(0x1f2937, { metalness: 0.5 }), 0, 22, 0, 3));
  for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) {
    const x = -180 + i * 28 + (i >= 6 ? 20 : 0);
    g.add(box(15, 13, 2, mat(0x0b0b0c), x, 30 - r * 16, 100.5));
    g.add(box(3, 2, 2, mat(i % 3 ? 0x22c55e : 0xf59e0b, { emissive: i % 3 ? 0x22c55e : 0xf59e0b }), x - 5, 38.5 - r * 16, 100.6));
  }
  return g;
};
M.powerbank = () => {
  const g = new THREE.Group();
  g.add(box(70, 25, 150, mat(0x1f2937, { roughness: 0.35 }), 0, 0, 0, 10));
  g.add(extrude(rrect(8.6, 2.8, 1.4), 1, mat(0x000000)).translateZ(75).translateX(-15));
  g.add(extrude(rrect(12.4, 4.9, 0.4), 1, mat(0x000000)).translateZ(75).translateX(12));
  for (let i = 0; i < 4; i++) g.add(cyl(1.8, 1, mat(i < 3 ? 0x60a5fa : 0x374151, { emissive: i < 3 ? 0x60a5fa : 0, emissiveIntensity: 1 }), -9 + i * 6, 12.6, 55, 'y', 12));
  g.add(label(50, 22, simpleText([{ t: '20000 mAh', font: 'bold 70px Arial', color: '#e5e7eb' }, { t: 'PD 65W', font: 'bold 50px Arial', color: '#60a5fa' }], {}, 512, 220), 0, 12.55, -10, [-Math.PI / 2, 0, 0]));
  return g;
};
M.charger = () => {
  const g = new THREE.Group();
  g.add(box(45, 45, 40, WHITE(), 0, 0, 0, 8));
  [-6, 6].forEach((x) => g.add(box(2, 6, 16, METAL(), x, 0, -28)));
  g.add(extrude(rrect(8.6, 2.8, 1.4), 1, mat(0x111111)).translateZ(20).translateY(8));
  g.add(extrude(rrect(8.6, 2.8, 1.4), 1, mat(0x111111)).translateZ(20).translateY(-2));
  g.add(label(30, 10, simpleText('GaN 65W', { fg: '#6b7280', font: 'bold 80px Arial' }, 512, 160), 0, 22.6, 0, [-Math.PI / 2, 0, 0]));
  return g;
};
M.ups = () => {
  const g = new THREE.Group();
  g.add(box(100, 160, 260, mat(0x111214), 0, 80, 0, 6));
  g.add(box(50, 30, 2, mat(0x0f172a), 0, 120, 131));
  g.add(label(46, 26, simpleText([{ t: '230V', font: 'bold 60px Consolas, monospace', color: '#22d3ee' }, { t: '100%', font: 'bold 60px Consolas, monospace', color: '#22c55e' }], { bg: '#0f172a' }, 300, 180), 0, 120, 132.2, null, { emissive: 0xffffff, emissiveIntensity: 0.3 }));
  g.add(cyl(8, 3, mat(0x22c55e, { emissive: 0x22c55e, emissiveIntensity: 0.6 }), 0, 80, 131, 'z', 24));
  return g;
};
M.laptop = () => {
  const g = new THREE.Group();
  g.add(box(320, 16, 220, mat(0x9ca3af, { metalness: 0.7, roughness: 0.35 }), 0, 8, 0, 6));
  const kb = textTexture((ctx, W, H) => { ctx.fillStyle = '#1f2937'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#374151'; for (let r = 0; r < 5; r++) for (let i = 0; i < 14; i++) ctx.fillRect(10 + i * 35, 10 + r * 34, 30, 28); }, 512, 190);
  g.add(label(280, 100, kb, 0, 16.1, -30, [-Math.PI / 2, 0, 0]));
  g.add(box(110, 0.5, 65, mat(0x6b7280, { metalness: 0.6 }), 0, 16.3, 65));
  const lid = new THREE.Group(); lid.position.set(0, 16, -110); lid.rotation.x = -1.75 + Math.PI / 2;
  lid.add(box(320, 210, 8, mat(0x9ca3af, { metalness: 0.7, roughness: 0.35 }), 0, 105, 0, 6));
  const scr = textTexture((ctx, W, H) => { const gr = ctx.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0a3d8f'); gr.addColorStop(1, '#6fb1ff'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }, 256, 160);
  lid.add(label(296, 186, scr, 0, 108, 4.1, null, { emissive: 0xffffff, emissiveMap: scr, emissiveIntensity: 0.6 }));
  g.add(lid);
  return g;
};
M.phone = (tablet = false) => {
  const g = new THREE.Group();
  const [w, h] = tablet ? [180, 250] : [75, 160];
  g.add(box(w, h, 8, mat(0x1f2937, { metalness: 0.5 }), 0, 0, 0, tablet ? 12 : 9));
  const scr = textTexture((ctx, W, H) => { const gr = ctx.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#7c3aed'); gr.addColorStop(1, '#22d3ee'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) ctx.beginPath(), ctx.roundRect(20 + i * 60, 40 + r * 70, 42, 42, 10), ctx.fill(); }, 256, 420);
  g.add(label(w - 6, h - 6, scr, 0, 0, 4.1, null, { emissive: 0xffffff, emissiveMap: scr, emissiveIntensity: 0.6 }));
  if (!tablet) g.add(rrectMesh(16, 5, 2.5, 0x000000, 0, h / 2 - 10, 4.3));
  g.add(cyl(6, 2, mat(0x111111), -w / 2 + 14, h / 2 - 16, -4.5, 'z', 24));
  g.rotation.y = 0.5;
  return g;
};
function rrectMesh(w, h, r, color, x, y, z) { const m = extrude(rrect(w, h, r), 0.3, mat(color)); m.position.set(x, y, z); return m; }
M.cmos = () => {
  const g = new THREE.Group();
  g.add(cyl(10, 3.2, mat(0xc3c8ce, { metalness: 0.95, roughness: 0.2 }), 0, 0, 0, 'y', 48));
  g.add(label(14, 7, simpleText([{ t: 'CR2032', font: 'bold 80px Arial', color: '#333' }, { t: '3V', font: 'bold 70px Arial', color: '#333' }], {}, 400, 220), 0, 1.62, 0, [-Math.PI / 2, 0, 0]));
  g.rotation.x = 0.5;
  return g;
};
M.paste = () => {
  const g = new THREE.Group();
  g.add(cyl(5, 60, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.6, roughness: 0.2, transparent: true, opacity: 0.8 }), 0, 0, 0, 'x', 24));
  g.add(cyl(4.2, 56, mat(0x9ca3af, { metalness: 0.6 }), 0, 0, 0, 'x', 24));
  g.add(cyl(2, 12, WHITE(), 36, 0, 0, 'x', 16));
  g.add(cyl(1.5, 30, WHITE(), -40, 0, 0, 'x', 16)); g.add(cyl(7, 2, WHITE(), -55, 0, 0, 'x', 24));
  const cpu = cpuModel({ brand: 'amd', name: 'AMD Ryzen 7 9700X' }); cpu.scale.setScalar(10); cpu.position.set(0, -20, -60); cpu.rotation.x = -Math.PI / 2; g.add(cpu);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 10), mat(0x9ca3af)); dot.scale.y = 0.4; dot.position.set(0, -15, -60); g.add(dot);
  return g;
};
M.nic = () => {
  const g = new THREE.Group();
  g.add(box(120, 1.6, 70, mat(0x14532d), 0, 0, 0));
  g.add(box(60, 1.7, 6, GOLD(), -10, 0, 36));
  g.add(box(28, 4, 28, mat(0x9ca3af, { metalness: 0.8 }), 10, 3, -5));
  g.add(box(2, 120, 18, METAL(), -61, -40, -20));
  [-8, 8].forEach((x) => { g.add(cyl(4, 110, mat(0x111214), -68, -40 + x * 4, -20, 'y', 16).rotateZ(Math.PI / 2 - 0.2).translateY(-50)); });
  return g;
};
M.sodimm = () => {
  const g = new THREE.Group();
  g.add(box(69.6, 30, 1.2, mat(0x14532d), 0, 0, 0));
  for (let i = 0; i < 4; i++) g.add(box(10, 11, 1.4, mat(0x111111), -24 + i * 16, 3, 1.2));
  for (let i = 0; i < 60; i++) g.add(box(0.6, 3, 1.25, GOLD(), -33 + i * 1.1, -13.4, 0));
  g.add(label(26, 6, simpleText('DDR5 SO-DIMM 16GB', { fg: '#111', font: 'bold 40px Arial' }, 512, 100), 0, 11, 0.7, null));
  return g;
};
M.soundcard = () => {
  const g = new THREE.Group();
  g.add(box(140, 1.6, 90, mat(0x111827), 0, 0, 0));
  g.add(box(80, 10, 60, mat(0x7f1d1d, { metalness: 0.5 }), 10, 6, -5, 3));
  g.add(label(60, 14, simpleText('AUDIO', { fg: '#fff', font: 'bold 90px Arial' }, 512, 128), 10, 11.1, -5, [-Math.PI / 2, 0, 0]));
  g.add(box(46, 1.7, 6, GOLD(), -20, 0, 46));
  g.add(box(2, 100, 18, METAL(), -71, -40, -20));
  [0x22c55e, 0xec4899, 0x3b82f6].forEach((c, i) => g.add(cyl(4, 3, mat(c), -73, -10 - i * 22, -20, 'x', 20)));
  return g;
};
M.scanner = () => {
  const g = new THREE.Group();
  g.add(box(300, 50, 420, mat(0x2b2d31), 0, 25, 0, 8));
  const lid = box(300, 12, 420, mat(0x1f2937), 0, 0, 0, 6); lid.position.set(0, 70, -40); lid.rotation.x = -0.6; g.add(lid);
  g.add(box(280, 1, 400, new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, transmission: 0.5, roughness: 0, transparent: true, opacity: 0.6 }), 0, 50.5, 0));
  g.add(box(270, 2, 6, mat(0xffffff, { emissive: 0xffffff }), 0, 48, -50));
  return g;
};
M.tablet = () => M.phone(true);

// ---------- Mô hình từ ảnh chụp sản phẩm thật (tách nền + dựng khối theo đường viền) ----------
const PHOTO_BASE = new URL('./photo/', import.meta.url).href;
const photoLoader = new THREE.TextureLoader();
const photoTexCache = new Map();
function photoTex(name) {
  if (!photoTexCache.has(name)) { const t = photoLoader.load(PHOTO_BASE + name + '.webp'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; photoTexCache.set(name, t); }
  return photoTexCache.get(name);
}
// key: tên ảnh; width: bề ngang thật (mm); depth: độ dày (mm); back: ảnh mặt sau (nếu có); side: màu cạnh; sway: chỉ xoay nhẹ (ảnh chụp xiên)
function photoPiece(key, { width, depth = 2, back = null, side = 0x2b2d31, sway = 0 } = {}) {
  const S = SHAPES[key]; const H = (width * S.h) / S.w;
  const shape = new THREE.Shape(S.poly.map(([x, y]) => new THREE.Vector2(x, 1 - y)));
  const g = new THREE.Group();
  const front = new THREE.MeshStandardMaterial({ map: photoTex(key), alphaTest: 0.5, roughness: 0.55, metalness: 0.1, side: THREE.FrontSide });
  const fm = new THREE.Mesh(new THREE.ShapeGeometry(shape), front);
  const backGeo = new THREE.ShapeGeometry(shape);
  if (back) { const uv = backGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); }
  const bm = new THREE.Mesh(backGeo, back ? new THREE.MeshStandardMaterial({ map: photoTex(back), alphaTest: 0.5, roughness: 0.6, side: THREE.BackSide }) : new THREE.MeshStandardMaterial({ map: photoTex(key), color: 0x6b6f76, roughness: 0.7, side: THREE.BackSide }));
  const sideGeo = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false, curveSegments: 1 });
  const sm = new THREE.Mesh(sideGeo, [new THREE.MeshBasicMaterial({ visible: false }), new THREE.MeshStandardMaterial({ color: side, roughness: 0.6, metalness: 0.2 })]);
  const k = new THREE.Group();
  fm.position.z = depth / 2 + 0.001; bm.position.z = -depth / 2 - 0.001;
  sm.scale.z = depth; sm.position.z = -depth / 2;
  k.add(fm, bm, sm);
  [fm, bm, sm].forEach((m) => { m.castShadow = true; });
  k.scale.set(width, H, 1); k.position.set(-width / 2, -H / 2, 0);
  fm.scale.z = bm.scale.z = 1;
  g.add(k);
  g.userData.photo = { sway, credit: PHOTO_CREDIT[key] };
  return g;
}
const PHOTO_CREDIT = {"sd": "Dinkun Chen, CC BY-SA 4.0 · thẻ microSD: User5515, CC0 · mặt sau: CC BY 2.5", "usbstick": "DJDunsie, CC BY 3.0", "nic": "Dmitry Nosachev, CC BY-SA 4.0", "sound": "Papperskorgen, phạm vi công cộng", "sodimm": "ITEagle Europe – Sebastiaan Broekhoven, CC BY-SA 4.0", "cmos": "JanEhlebrecht, CC BY-SA 4.0", "dp": "Belkin + Abisys, CC BY-SA 3.0", "hdmi": "D-Kuru, CC BY-SA 3.0 AT", "vga": "Swift.Hg, CC BY-SA 3.0", "usbc": "Tomato86, CC BY-SA 4.0", "usb3b": "Anıl Öztaş, CC BY-SA 4.0", "usbminib": "Anıl Öztaş, CC BY-SA 4.0", "rj45": "Gutza, Mike1024, phạm vi công cộng", "jack": "Anıl Öztaş, CC BY-SA 4.0", "pcie8": "D-Kuru, CC BY-SA 3.0 AT"};
// Các hiện vật dùng ảnh thật (Wikimedia Commons – xem photo/CREDITS.md)
const PHOTO_MODELS = {
  sdcard: () => { const g = new THREE.Group(); const a = photoPiece('sd', { width: 24, depth: 2.1, back: 'sd_back', side: 0xd9dcdf }); a.position.x = -9; const b = photoPiece('microsd', { width: 11, depth: 1, side: 0x1b1c1f }); b.position.set(13, -8.5, 0); g.add(a, b); g.userData.photo = { sway: 0, credit: PHOTO_CREDIT.sd }; return g; },
  flash: () => photoPiece('usbstick', { width: 60, depth: 9, side: 0x22b7d8, sway: 0.5 }),
  nic: () => photoPiece('nic', { width: 125, depth: 6, side: 0x1f6b3a, sway: 0.45 }),
  soundcard: () => photoPiece('sound', { width: 175, depth: 3, side: 0x1f6b3a }),
  sodimm: () => photoPiece('sodimm', { width: 69.6, depth: 2.6, side: 0x1f6b3a }),
  cmos: () => photoPiece('cmos', { width: 20, depth: 1.5, side: 0xb8bcc2, sway: 0.5 }),
  dp: () => photoPiece('dp', { width: 62, depth: 4, side: 0x9aa0a6, sway: 0.45 }),
  hdmi: () => photoPiece('hdmi', { width: 40, depth: 4, side: 0x151515, sway: 0.45 }),
  vga: () => photoPiece('vga', { width: 60, depth: 5, side: 0x3b6fc4, sway: 0.45 }),
  usbC: () => photoPiece('usbc', { width: 36, depth: 3, side: 0x3a3a3a, sway: 0.45 }),
  usbB: () => photoPiece('usb3b', { width: 34, depth: 4, side: 0xa8adb3, sway: 0.45 }),
  miniUSB: () => photoPiece('usbminib', { width: 26, depth: 3, side: 0x151515, sway: 0.45 }),
  rj45: () => photoPiece('rj45', { width: 26, depth: 4, side: 0xd5dde3, sway: 0.45 }),
  audio: () => photoPiece('jack', { width: 62, depth: 1.5, side: 0xb02020, sway: 0.4 }),
  pcie8: () => photoPiece('pcie8', { width: 38, depth: 4, side: 0x1b1c1f, sway: 0.4 }),
};

// ---------- Bảng tra cứu mô hình ----------
export const MODELS = {
  ...Object.fromEntries(Object.entries({
    usbA: () => C.usbA(false), usb3: () => C.usbA(true), usbC: () => C.usbC(false), thunderbolt: () => C.usbC(true), microUSB: C.microUSB, miniUSB: C.miniUSB, usbB: C.usbB,
    lightning: C.lightning, firewire: C.firewire, hdmi: () => C.hdmi(false), miniHdmi: () => C.hdmi(true), dp: () => C.dp(false), miniDp: () => C.dp(true), vga: C.vga, dvi: C.dvi,
    db9: C.db9, db25: C.db25, rj45: () => C.rj45(false), rj11: () => C.rj45(true), audio: C.audio, ps2: () => C.ps2(0x7c3aed), sata: C.sata, molex: C.molex, atx24: C.atx24,
    pcie8: C.pcie8, h12v: C.h12v, iec: C.iec, barrel: C.barrel, magsafe: C.magsafe,
  })),
  ...M,
  mb: () => motherboardModel({ form: 'ATX', socket: 'AM5', color: 0x15171a, accent: 0xe11d48, label: 'ROG STRIX', chipset: 'X870E' }),
  cpu: () => { const g = new THREE.Group(); const c = cpuModel({ brand: 'intel', name: 'Intel Core i7-14700K' }); c.rotation.x = -Math.PI / 2; g.add(c); return g; },
  gpu: () => gpuModel({ brand: 'nvidia', maker: 'ASUS', name: 'ASUS GeForce RTX 5070', length: 300, fans: 3, thick: 5, pcie: 1, h16: true, color: 0x2a2d33 }),
  ram: () => ramModel({ type: 'DDR5', size: 32, mhz: 6000, color: 0x18191b, rgb: true, label: 'VENGEANCE' }),
  psu: () => psuModel({ watt: 750, eff: '80 PLUS GOLD' }),
  hdd: () => hddModel({ brand: 'Seagate', size: 2000 }),
  ssd25: () => ssd25Model({ brand: 'Samsung', name: 'Samsung 870 EVO 500GB' }),
  m2: () => m2Model({ size: 1000 }),
  cooler: () => coolerModel({ type: 'tower', label: 'HYPER 212' }),
  aio: () => coolerModel({ type: 'aio', rad: 240 }),
  fan: () => fan(12, { rgb: 0x8b5cf6 }),
  pccase: () => caseModel({ color: 0x1d1f24, accent: 0x00c6ff }),
  ...PHOTO_MODELS,
};
// Dựng mô hình cho linh kiện thật trong kho lắp ráp
export function modelForPart(p) {
  switch (p.cat) {
    case 'case': return caseModel(p);
    case 'mb': return motherboardModel(p);
    case 'cpu': { const g = new THREE.Group(); const c = cpuModel(p); c.rotation.x = -Math.PI / 2; g.add(c); return g; }
    case 'cooler': return coolerModel(p);
    case 'ram': return ramModel(p);
    case 'gpu': return gpuModel(p);
    case 'psu': return psuModel(p);
    case 'storage': return p.kind === 'm2' ? m2Model(p) : p.kind === 'ssd25' ? ssd25Model(p) : hddModel(p);
  }
  return new THREE.Group();
}
