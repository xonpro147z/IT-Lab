// Mô hình 3D linh kiện máy tính dựng bằng code (không cần tệp mô hình ngoài) – bản chi tiết
// Đơn vị: cm. Vỏ máy: mặt trước hướng +x, mặt kính (bên trái vỏ) hướng +z về phía người xem.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/three/RoundedBoxGeometry.js';

export const BOARD_ORIGIN = new THREE.Vector3(-20.6, 44.0, -9.6); // góc trên-trái (phía cổng I/O) của mainboard
export const BOARD_W = 24.4;
export const boardH = (form) => (form === 'ATX' ? 30.5 : 24.4);

// ======================= Vật liệu =======================
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts, (k, v) => (v && v.isTexture ? v.uuid : v));
  if (!matCache.has(key)) {
    const P = opts.clearcoat !== undefined || opts.sheen !== undefined;
    const M = new (P ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({ color, roughness: 0.55, metalness: 0.2, ...opts });
    matCache.set(key, M);
  }
  return matCache.get(key);
}
const texCache = new Map();
function cachedTex(key, make) { if (!texCache.has(key)) texCache.set(key, make()); return texCache.get(key); }
export function textTexture(draw, w = 512, h = 256, { srgb = true, repeat = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
// kim loại xước (brushed) – dùng làm roughnessMap
const brushed = () => cachedTex('brushed', () => textTexture((ctx, W, H) => {
  ctx.fillStyle = '#7a7a7a'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { const y = Math.random() * H; const g = 90 + Math.random() * 90; ctx.fillStyle = `rgba(${g},${g},${g},.35)`; ctx.fillRect(Math.random() * W, y, 30 + Math.random() * 160, 1); }
}, 512, 512, { srgb: false, repeat: [1, 1] }));
const grain = () => cachedTex('grain', () => textTexture((ctx, W, H) => {
  const d = ctx.createImageData(W, H); for (let i = 0; i < d.data.length; i += 4) { const v = 120 + Math.random() * 70; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } ctx.putImageData(d, 0, 0);
}, 256, 256, { srgb: false, repeat: [4, 4] }));
const METAL = () => mat(0xc4c9cf, { metalness: 0.9, roughness: 0.32, roughnessMap: brushed() });
const ALU_DARK = () => mat(0x2d3036, { metalness: 0.8, roughness: 0.38, roughnessMap: brushed() });
const NICKEL = () => mat(0xd9dde2, { metalness: 1, roughness: 0.18 });
const COPPER = () => mat(0xc97a45, { metalness: 1, roughness: 0.28 });
const GOLD = () => mat(0xe0b64a, { metalness: 1, roughness: 0.25 });
const PLASTIC = (c = 0x16171a) => mat(c, { metalness: 0.05, roughness: 0.62, roughnessMap: grain() });
const RUBBER = () => mat(0x0c0c0d, { metalness: 0, roughness: 0.9 });
const PCB = (c) => mat(c, { metalness: 0.15, roughness: 0.5 });
function emissive(color, k = 0.25) { return new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: k, roughness: 0.4 }); }

// ======================= Hình khối =======================
export function box(w, h, d, material, x = 0, y = 0, z = 0, r = 0) {
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const g = rr > 0.01 ? new RoundedBoxGeometry(w, h, d, 3, rr) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function cyl(r, h, material, x = 0, y = 0, z = 0, axis = 'y', seg = 32, r2 = r) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2, h, seg), material);
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
// Mảng lặp (InstancedMesh) – nhẹ cho máy yếu
function instances(geo, material, list) {
  const im = new THREE.InstancedMesh(geo, material, list.length);
  const o = new THREE.Object3D();
  list.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.rotation.set(p[3] || 0, p[4] || 0, p[5] || 0); o.scale.set(p[6] || 1, p[7] || 1, p[8] || 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  im.castShadow = true; im.receiveShadow = true;
  return im;
}
function extrude(shape, depth, material, bevel = 0.05) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 24 });
  const m = new THREE.Mesh(g, material); m.castShadow = true; m.receiveShadow = true; return m;
}
function rrectShape(w, h, r, cx = 0, cy = 0) {
  const s = new THREE.Shape(); const x = cx - w / 2, y = cy - h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function label(w, h, tex, x, y, z, rot = null, extra = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.55, metalness: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, ...extra }));
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.renderOrder = 2;
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
const hex = (c) => '#' + (c >>> 0).toString(16).padStart(6, '0');
const light = (c) => ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11 > 150;

// lưới lỗ tròn / tổ ong dùng làm alphaMap
const perfTex = (kind = 'round', dens = 12) => cachedTex('perf' + kind + dens, () => textTexture((ctx, W, H) => {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#000';
  if (kind === 'hex') { const s = dens; for (let y = 0, r = 0; y < H + s; y += s * 0.87, r++) for (let x = r % 2 ? s / 2 : 0; x < W + s; x += s) { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k + Math.PI / 6; ctx.lineTo(x + Math.cos(a) * s * 0.42, y + Math.sin(a) * s * 0.42); } ctx.fill(); } }
  else for (let y = dens / 2, r = 0; y < H; y += dens * 0.87, r++) for (let x = r % 2 ? dens : dens / 2; x < W; x += dens) { ctx.beginPath(); ctx.arc(x, y, dens * 0.36, 0, 7); ctx.fill(); }
}, 256, 256, { srgb: false, repeat: [1, 1] }));
function perforated(w, h, color, kind, rep, extra = {}) {
  const a = perfTex(kind).clone(); a.needsUpdate = true; a.wrapS = a.wrapT = THREE.RepeatWrapping; a.repeat.set(rep[0], rep[1]);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.4, alphaMap: a, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, ...extra }));
}

// ======================= Quạt (mặt hướng +z, tâm ở gốc) =======================
const bladeGeoCache = new Map();
function bladeGeo(s) {
  const k = s.toFixed(2); if (bladeGeoCache.has(k)) return bladeGeoCache.get(k);
  const r0 = s * 0.17, r1 = s * 0.455;
  const sh = new THREE.Shape(); sh.moveTo(r0, -s * 0.05);
  sh.bezierCurveTo(r0 + (r1 - r0) * 0.4, -s * 0.12, r1 * 0.95, -s * 0.11, r1, -s * 0.02);
  sh.bezierCurveTo(r1 * 0.98, s * 0.10, r0 + (r1 - r0) * 0.5, s * 0.13, r0, s * 0.08); sh.lineTo(r0, -s * 0.05);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false, curveSegments: 10 });
  // xoắn cánh: nghiêng dần theo bán kính
  const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const t = (v.x - r0) / (r1 - r0); const a = 0.55 - t * 0.25; const y = v.y, z = v.z; p.setXYZ(i, v.x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)); }
  g.computeVertexNormals(); bladeGeoCache.set(k, g); return g;
}
export function fan(size = 12, { frame = 0x15171a, blade = 0x1d1f24, rgb = null, thick = 2.5, blades = 9, corners = 0x2a2c30, logo = '' } = {}) {
  const g = new THREE.Group();
  const s = size;
  // khung: hình vuông bo góc có lỗ tròn
  const sh = rrectShape(s, s, s * 0.08); const hole = new THREE.Path(); hole.absarc(0, 0, s * 0.475, 0, Math.PI * 2, true); sh.holes.push(hole);
  const fr = extrude(sh, thick - 0.1, PLASTIC(frame), 0.05); fr.position.z = -thick / 2; g.add(fr);
  // đệm cao su 4 góc + lỗ vít
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { g.add(cyl(s * 0.055, thick + 0.04, mat(corners, { roughness: 0.85 }), a * s * 0.41, b * s * 0.41, 0, 'z', 16)); g.add(cyl(s * 0.022, thick + 0.08, RUBBER(), a * s * 0.41, b * s * 0.41, 0, 'z', 10)); });
  // khung đỡ động cơ phía sau (4 thanh)
  for (let i = 0; i < 4; i++) { const st = box(s * 0.33, s * 0.025, 0.25, PLASTIC(frame), 0, 0, -thick / 2 + 0.15); st.geometry.translate(s * 0.31, 0, 0); st.rotation.z = Math.PI / 4 + i * Math.PI / 2; g.add(st); }
  g.add(cyl(s * 0.16, 0.3, PLASTIC(frame), 0, 0, -thick / 2 + 0.2, 'z'));
  const rotor = new THREE.Group(); rotor.name = 'rotor';
  const hub = cyl(s * 0.17, thick * 0.75, mat(blade, { roughness: 0.5 }), 0, 0, 0, 'z', 40); rotor.add(hub);
  const hubCap = new THREE.Mesh(new THREE.CircleGeometry(s * 0.15, 40), new THREE.MeshStandardMaterial({ map: simpleText([{ t: logo || '', font: 'bold 70px Arial', color: '#ddd' }], { bg: hex(blade) }, 256, 256), roughness: 0.5 }));
  hubCap.position.z = thick * 0.38; rotor.add(hubCap);
  const bm = rgb !== null ? new THREE.MeshStandardMaterial({ color: 0x8d939b, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.88, emissive: rgb, emissiveIntensity: 0.05, side: THREE.DoubleSide }) : mat(blade, { roughness: 0.45, side: THREE.DoubleSide });
  if (rgb !== null) bm.name = 'rgbBlade';
  const bg = bladeGeo(s);
  for (let i = 0; i < blades; i++) { const b = new THREE.Mesh(bg, bm); b.rotation.z = (i / blades) * Math.PI * 2; b.position.z = -0.03; b.castShadow = true; rotor.add(b); }
  g.add(rotor);
  if (rgb !== null) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(s * 0.475, s * 0.018, 8, 64), new THREE.MeshStandardMaterial({ color: 0x3a3a3e, emissive: rgb, emissiveIntensity: 0.25 }));
    ring.position.z = thick / 2 - 0.02; ring.name = 'rgb'; g.add(ring);
    const hubGlow = new THREE.Mesh(new THREE.TorusGeometry(s * 0.155, s * 0.012, 8, 48), new THREE.MeshStandardMaterial({ color: 0x3a3a3e, emissive: rgb, emissiveIntensity: 0.25 }));
    hubGlow.position.z = thick * 0.38; hubGlow.name = 'rgb'; rotor.add(hubGlow);
  }
  return g;
}

// ======================= Vỏ máy =======================
function glassMat(tint = 0x9fb2c4) {
  const m = new THREE.MeshStandardMaterial({ color: tint, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.07, envMapIntensity: 0.35, depthWrite: false, side: THREE.FrontSide });
  return m;
}
const noPick = (m) => { m.raycast = () => {}; return m; };
export function caseModel(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const c = part.color, lt = light(c);
  const shell = mat(c, { metalness: 0.55, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.4 });
  const inner = mat(lt ? 0xe9ecef : 0x1d2024, { metalness: 0.45, roughness: 0.6, roughnessMap: grain() });
  const darkHole = mat(lt ? 0x9aa1a8 : 0x0a0b0c, { roughness: 0.9 });
  const o11 = /o11/.test(part.id);
  // ---- khay mainboard + vách sau (đặc) ----
  g.add(box(44.2, 46, 0.35, inner, 0, 23, -10.75));
  g.add(box(45, 47.4, 0.3, shell, 0, 23, -11.2, 0.2));
  // lỗ đi dây bọc cao su trên khay
  const grom = RUBBER();
  [[5.6, 37, 1.3, 5.5], [5.6, 27, 1.3, 5.5], [5.6, 17.5, 1.3, 4.5], [-16, 12.2, 7, 1.2], [-4, 12.2, 5, 1.2]].forEach(([x, y, w, h]) => { g.add(box(w, h, 0.3, grom, x, y, -10.5, Math.min(w, h) / 2 - 0.05)); g.add(box(w - 0.5, h - 0.5, 0.05, mat(0x050505), x, y, -10.33, Math.min(w, h) / 2 - 0.3)); });
  // lỗ CPU cut-out phía sau socket
  g.add(box(12, 11, 0.05, darkHole, -11, 36.5, -10.56, 0.6));
  // ---- nóc, đáy (lưới), mặt trước, mặt sau ----
  g.add(box(45, 0.6, 22.4, shell, 0, 46.6, 0, 0.25));
  const top = perforated(30, 15, lt ? 0xdfe3e8 : 0x111316, 'round', [9, 4.5]); top.rotation.x = -Math.PI / 2; top.position.set(-4, 46.92, -0.5); g.add(top);
  g.add(box(45, 0.6, 22.4, shell, 0, -0.3, 0, 0.25));
  // mặt trước: khung + lưới (hoặc kính với O11)
  g.add(box(0.8, 47.4, 22.4, shell, 23, 23, 0, 0.25).translateX(0));
  if (o11) {
    const fg = noPick(new THREE.Mesh(new THREE.PlaneGeometry(21.6, 46.4), glassMat())); fg.rotation.y = Math.PI / 2; fg.position.set(23.45, 23.2, 0); fg.name = 'glass'; g.add(fg);
  } else {
    const fm = perforated(20.6, 45, lt ? 0xe7eaee : 0x0f1012, 'hex', [11, 24], { metalness: 0.3, roughness: 0.6 }); fm.rotation.y = Math.PI / 2; fm.position.set(23.45, 23.2, 0); g.add(fm);
    g.add(box(0.3, 46, 0.6, shell, 23.45, 23.2, 10.6), box(0.3, 46, 0.6, shell, 23.45, 23.2, -10.6));
  }
  // mặt sau: tấm thép có ô I/O, quạt sau dạng tổ ong, khe PCIe thông gió
  const back = mat(c, { metalness: 0.6, roughness: 0.45 });
  g.add(box(0.5, 9, 22.4, back, -22.45, 42.2, 0), box(0.5, 13, 9.6, back, -22.45, 31.5, -6.2), box(0.5, 21, 22.4, back, -22.45, 10.5, 0));
  const rh = perforated(13, 13, lt ? 0xd9dde1 : 0x121315, 'hex', [6, 6]); rh.rotation.y = -Math.PI / 2; rh.position.set(-22.72, 37.5, 4.2); g.add(rh);
  // nắp khe PCIe (7 khe, có lỗ thông gió)
  const slotTex = cachedTex('slotvent', () => textTexture((ctx, W, H) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#000'; for (let x = 10; x < W - 10; x += 16) ctx.fillRect(x, 8, 8, H - 16); }, 256, 32, { srgb: false }));
  for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 1.5), new THREE.MeshStandardMaterial({ color: lt ? 0xd4d8dc : 0x1b1c1f, metalness: 0.7, roughness: 0.4, alphaMap: slotTex, alphaTest: 0.5, side: THREE.DoubleSide })); p.rotation.y = -Math.PI / 2; p.position.set(-22.3, 28.4 - i * 2.03, 2.8); g.add(p); }
  g.add(box(0.35, 15, 0.8, back, -22.4, 22.4, -3.4));
  // ô I/O mặt sau
  g.add(box(0.1, 10.2, 2.6, mat(0x050505), -22.72, 38.6, -8.0));
  // ---- khung trước kính ----
  const edge = mat(c, { metalness: 0.6, roughness: 0.35 });
  g.add(box(45, 0.7, 0.7, edge, 0, 46.3, 11.0), box(45, 0.7, 0.7, edge, 0, -0.1, 11.0), box(0.7, 47, 0.7, edge, 22.9, 23, 11.0), box(0.7, 47, 0.7, edge, -22.4, 23, 11.0));
  // kính cường lực bên hông (không chặn chuột)
  const gl = noPick(new THREE.Mesh(new THREE.PlaneGeometry(44.6, 46.6), glassMat())); gl.position.set(0.2, 23.1, 11.42); gl.name = 'glass'; g.add(gl);
  const glFrame = noPick(new THREE.Mesh(new THREE.PlaneGeometry(44.6, 46.6), new THREE.MeshBasicMaterial({ map: cachedTex('glassedge', () => textTexture((ctx, W, H) => { ctx.clearRect(0, 0, W, H); ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 14; ctx.strokeRect(0, 0, W, H); }, 512, 512)), transparent: true, depthWrite: false })));
  glFrame.position.set(0.2, 23.1, 11.44); glFrame.name = 'glass'; g.add(glFrame);
  // ---- tấm che nguồn (PSU shroud) có lỗ thông gió và logo ----
  const shroud = mat(lt ? 0xe4e7ea : 0x18191c, { metalness: 0.5, roughness: 0.5 });
  g.add(box(29, 0.35, 20.4, shroud, -7.6, 10.2, 0.4));
  const sf = perforated(28.6, 9.6, lt ? 0xe4e7ea : 0x18191c, 'round', [16, 5.4], { metalness: 0.5, roughness: 0.5 }); sf.position.set(-7.6, 5.2, 10.6); g.add(sf);
  g.add(box(0.35, 10, 20.4, shroud, 6.9, 5.1, 0.4));
  g.add(label(8, 1.6, simpleText([{ t: (part.brand || part.name.split(' ')[0]).toUpperCase(), font: 'bold 72px Segoe UI, Arial', color: lt ? '#40444a' : '#e8e8e8' }], {}, 512, 100), -7.6, 10.39, 6.8, [-Math.PI / 2, 0, 0]));
  // lỗ cáp trên shroud (chỗ cáp nguồn đi lên)
  [[-2, 6.5], [0.5, 1.5], [-12, 4]].forEach(([x, z]) => g.add(box(4.2, 0.1, 2.2, mat(0x050505), x, 10.39, z, 0.5)));
  // ---- nút nguồn, cổng USB trên nóc ----
  const btn = cyl(0.9, 0.5, mat(0x222326, { metalness: 0.7, roughness: 0.3 }), 18.5, 47.1, 7.5); btn.name = 'powerButton';
  const led = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.1, 8, 40), new THREE.MeshStandardMaterial({ color: 0x9adfff, emissive: 0x000000 }));
  led.rotation.x = Math.PI / 2; led.position.set(18.5, 47.36, 7.5); led.name = 'powerLed';
  g.add(btn, led);
  g.add(box(1.2, 0.2, 0.5, mat(0x0a0a0a), 15.8, 46.96, 7.5, 0.1), box(0.9, 0.2, 0.35, mat(0x0a0a0a), 14.2, 46.96, 7.5, 0.15), cyl(0.2, 0.1, mat(0x0a0a0a), 12.8, 46.95, 7.5, 'y', 12));
  // chân đế
  [[-19, -8], [-19, 8], [19, -8], [19, 8]].forEach(([x, z]) => g.add(box(5, 1.2, 2.4, RUBBER(), x, -1.25, z, 0.5)));
  // ---- quạt trước (hút) và quạt sau (thổi) ----
  const ac = part.accent ?? null;
  [36.5, 23.3].concat(o11 ? [] : [10.2]).forEach((y) => { const f = fan(12, { rgb: ac, frame: lt ? 0xf2f2f2 : 0x15171a, blade: lt ? 0xf5f5f5 : 0x1d1f24 }); f.rotation.y = -Math.PI / 2; f.position.set(21.0, y, -0.5); g.add(f); });
  const rf = fan(12, { rgb: ac, frame: lt ? 0xf2f2f2 : 0x15171a, blade: lt ? 0xf5f5f5 : 0x1d1f24 }); rf.rotation.y = Math.PI / 2; rf.position.set(-21.0, 37.5, 4.2); g.add(rf);
  // ---- lồng ổ cứng phía trước dưới (trong shroud) ----
  const cage = mat(lt ? 0xd0d5da : 0x2b2e33, { metalness: 0.65, roughness: 0.4 });
  g.add(box(13.4, 9, 0.3, cage, 13.2, 4.8, -7.6), box(13.4, 9, 0.3, cage, 13.2, 4.8, 3.9), box(13.4, 0.3, 11.8, cage, 13.2, 9.2, -1.85));
  g.add(box(13.4, 0.2, 0.8, cage, 13.2, 3.4, -7.1), box(13.4, 0.2, 0.8, cage, 13.2, 3.4, 3.4));
  // dải LED trang trí (nếu vỏ có màu nhấn)
  if (ac !== null) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.25, 42, 0.25), new THREE.MeshStandardMaterial({ color: 0x3a3a3e, emissive: ac, emissiveIntensity: 0.25 })); st.position.set(22.3, 24, 10.3); st.name = 'rgb'; g.add(st); }
  return g;
}

// ======================= Mainboard (gốc góc trên-trái, mặt linh kiện hướng +z) =======================
function pcbTexture(part, W, H) {
  const accent = hex(part.accent ?? 0x888888);
  return textTexture((ctx, CW, CH) => {
    const k = CW / W; // px / cm
    ctx.fillStyle = hex(part.color); ctx.fillRect(0, 0, CW, CH);
    // vân sợi thuỷ tinh rất nhẹ
    for (let i = 0; i < 4000; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`; ctx.fillRect(Math.random() * CW, Math.random() * CH, 2, 2); }
    // đường mạch đồng
    ctx.strokeStyle = 'rgba(255,255,255,0.055)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 260; i++) { ctx.beginPath(); let x = Math.random() * CW, y = Math.random() * CH; ctx.moveTo(x, y); for (let s = 0; s < 3; s++) { if (s % 2) x += (Math.random() - 0.5) * 160; else y += (Math.random() - 0.5) * 160; ctx.lineTo(x, y); } ctx.stroke(); }
    // linh kiện SMD nhỏ
    for (let i = 0; i < 900; i++) { ctx.fillStyle = Math.random() < 0.5 ? '#c9c2b0' : '#2a2a2a'; const x = Math.random() * CW, y = Math.random() * CH; ctx.fillRect(x, y, 3 + Math.random() * 3, 2); }
    // lỗ bắt vít mạ bạc
    [[0.64, 0.64], [W - 0.64, 0.64], [0.64, H - 0.64], [W - 0.64, H - 0.64], [W * 0.62, 0.64], [W * 0.62, H - 0.64], [0.64, H * 0.52], [W - 0.64, H * 0.52]].forEach(([x, y]) => { ctx.fillStyle = '#c9ccd0'; ctx.beginPath(); ctx.arc(x * k, y * k, 0.45 * k, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x * k, y * k, 0.2 * k, 0, 7); ctx.fill(); });
    // chữ in lụa
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `${0.36 * k}px monospace`;
    [['CPU_FAN', 13.0, 1.2], ['ATX_24P', 21.4, 6.8], ['DIMMA1 DIMMA2 DIMMB1 DIMMB2', 15.6, 15.2], ['PCIE_1', 2, 15.2], ['M2_1', 6, 11.8], ['JFP1', 19.6, H - 1.2], ['SATA', 22.2, 14.4], ['JUSB1', 14.4, H - 1.2], ['JAUD1', 1.2, H - 1.2], ['BAT1', 12, H * 0.72]].forEach(([t, x, y]) => ctx.fillText(t, x * k, y * k));
    // logo dọc theo mép phải
    ctx.save(); ctx.translate(W * 0.955 * k, H * 0.86 * k); ctx.rotate(-Math.PI / 2); ctx.fillStyle = accent; ctx.font = `bold ${0.9 * k}px Segoe UI, Arial`; ctx.fillText(part.label || part.chipset, 0, 0); ctx.restore();
    // vùng âm thanh tách biệt
    ctx.strokeStyle = 'rgba(255,215,120,.35)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeRect(0.3 * k, (H - 6.5) * k, 5.2 * k, 6.1 * k); ctx.setLineDash([]);
  }, 1024, Math.round(1024 * H / W));
}
export function motherboardModel(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const H = boardH(part.form), W = BOARD_W;
  const intel = /^LGA/.test(part.socket || '');
  const acc = part.accent ?? 0x888888;
  const pcbM = new THREE.MeshStandardMaterial({ map: pcbTexture(part, W, H), roughness: 0.5, metalness: 0.15 });
  g.add(box(W, H, 0.16, [PCB(part.color), PCB(part.color), PCB(part.color), PCB(part.color), pcbM, PCB(part.color)], W / 2, -H / 2, 0.08));
  // ---- cụm I/O có nắp che + tản VRM dạng khối có rãnh ----
  const hsM = mat(acc, { metalness: 0.85, roughness: 0.35, roughnessMap: brushed() });
  const ioCover = box(3.2, 11, 3.0, ALU_DARK(), 1.9, -6.2, 1.66, 0.35); g.add(ioCover);
  g.add(label(2.4, 7.5, simpleText([{ t: (part.label || '').split(' ')[0] || part.chipset, font: 'bold 70px Segoe UI, Arial', color: hex(acc) }], {}, 512, 128), 1.9, -6.2, 3.18, [0, 0, Math.PI / 2]));
  const vrmTop = new THREE.Group(); vrmTop.add(box(9.4, 2.0, 1.7, hsM, 0, 0, 0, 0.25));
  for (let i = 0; i < 12; i++) vrmTop.add(box(0.12, 1.6, 0.4, mat(0x111111), -4.2 + i * 0.75, 0, 0.75));
  vrmTop.position.set(8.9, -1.9, 1.05); g.add(vrmTop);
  const vrmLeft = new THREE.Group(); vrmLeft.add(box(2.0, 9.2, 1.7, hsM, 0, 0, 0, 0.25));
  for (let i = 0; i < 11; i++) vrmLeft.add(box(1.6, 0.12, 0.4, mat(0x111111), 0, -4 + i * 0.8, 0.75));
  vrmLeft.position.set(4.6, -7.4, 1.05); g.add(vrmLeft);
  // cuộn cảm (choke) và tụ quanh VRM
  const chokeG = new THREE.BoxGeometry(0.75, 0.75, 0.55);
  g.add(instances(chokeG, mat(0x6b6e73, { metalness: 0.6, roughness: 0.5 }), [...Array(9)].map((_, i) => [5.2 + i * 0.9, -3.4, 0.45]).concat([...Array(8)].map((_, i) => [6.2, -3.6 - i * 0.9, 0.45]))));
  const capG = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 14); capG.rotateX(Math.PI / 2);
  g.add(instances(capG, mat(0x1a1a1c, { metalness: 0.7, roughness: 0.3 }), [...Array(7)].map((_, i) => [6.2 + i * 1.0, -11.2, 0.46])));
  // ---- socket CPU ----
  const sock = new THREE.Group(); sock.position.set(9.5, -7.5, 0.16);
  sock.add(box(5.2, 5.6, 0.35, PLASTIC(0x1c1c1e), 0, 0, 0.17, 0.1));
  const pinTex = cachedTex('pins', () => textTexture((ctx, W2, H2) => { ctx.fillStyle = '#2b2617'; ctx.fillRect(0, 0, W2, H2); ctx.fillStyle = '#d8b356'; for (let y = 5; y < H2; y += 7) for (let x = 5; x < W2; x += 7) ctx.fillRect(x, y, 3, 3); ctx.fillStyle = '#2b2617'; ctx.fillRect(W2 * 0.35, H2 * 0.35, W2 * 0.3, H2 * 0.3); }, 256, 256));
  sock.add(label(3.9, 3.9, pinTex, 0, 0, 0.36));
  // khung giữ (load plate) + cần gạt
  const lp = new THREE.Shape(); lp.moveTo(-2.6, -2.8); lp.lineTo(2.6, -2.8); lp.lineTo(2.6, 2.8); lp.lineTo(-2.6, 2.8); lp.lineTo(-2.6, -2.8);
  const lph = new THREE.Path(); lph.moveTo(-1.95, -2.15); lph.lineTo(-1.95, 2.15); lph.lineTo(1.95, 2.15); lph.lineTo(1.95, -2.15); lph.lineTo(-1.95, -2.15); lp.holes.push(lph);
  const plate = extrude(lp, 0.12, METAL(), 0.02); plate.position.z = 0.4; sock.add(plate);
  sock.add(cyl(0.08, 5.4, NICKEL(), 2.95, 0, 0.5, 'y', 10), box(0.5, 0.2, 0.25, NICKEL(), 3.05, -2.75, 0.5));
  [[-2.4, 2.6], [2.4, 2.6], [-2.4, -2.6], [2.4, -2.6]].forEach(([x, y]) => sock.add(cyl(0.18, 0.2, NICKEL(), x, y, 0.5, 'z', 12)));
  g.add(sock);
  // lỗ bắt tản (4 lỗ)
  const mh = intel ? 3.75 : [4.5, 5.4];
  (intel ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [9.5 + a * 3.75, -7.5 + b * 3.75]) : [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [9.5 + a * 2.7, -7.5 + b * 4.5])).forEach(([x, y]) => g.add(cyl(0.38, 0.05, NICKEL(), x, y, 0.19, 'z', 16)));
  // ---- khe RAM (4 khe, chốt 2 đầu) ----
  [16.0, 16.9, 17.8, 18.7].forEach((x, i) => {
    g.add(box(0.62, 13.3, 0.85, PLASTIC(i % 2 ? 0x24272c : 0x4d525a), x, -7.5, 0.59, 0.08));
    g.add(box(0.15, 12.6, 0.05, mat(0x050505), x, -7.5, 1.03));
    g.add(box(0.72, 0.7, 1.25, PLASTIC(0xe5e7ea), x, -0.55, 0.8, 0.1), box(0.72, 0.7, 1.25, PLASTIC(0xe5e7ea), x, -14.45, 0.8, 0.1));
    if (part.rgbSlots !== false && i % 2 === 0) g.add(box(0.66, 13.2, 0.08, METAL(), x, -7.5, 0.18));
  });
  // ---- đầu nguồn 24-pin, 8-pin, quạt ----
  g.add(box(1.1, 5.4, 1.25, PLASTIC(0x121212), 22.9, -10, 0.78, 0.08));
  g.add(instances(new THREE.BoxGeometry(0.32, 0.32, 0.05), mat(0x050505), [...Array(24)].map((_, i) => [22.65 + (i % 2) * 0.48, -12.5 + Math.floor(i / 2) * 0.43, 1.42])));
  g.add(box(2.1, 1.1, 1.25, PLASTIC(0x121212), 5.6, -0.8, 0.78, 0.08));
  g.add(instances(new THREE.BoxGeometry(0.32, 0.32, 0.05), mat(0x050505), [...Array(8)].map((_, i) => [4.9 + (i % 4) * 0.46, -1.02 + Math.floor(i / 4) * 0.44, 1.42])));
  [[12.8, -0.5], [20.4, -0.6], [23.6, -20]].forEach(([x, y]) => g.add(box(1.0, 0.5, 0.6, PLASTIC(0xf2f2f2), x, y, 0.46)));
  // ---- khe M.2 + tản M.2 thứ 2 ----
  g.add(box(0.55, 2.3, 0.45, PLASTIC(0x111111), 5.6, -12.6, 0.38), cyl(0.28, 0.35, NICKEL(), 13.9, -12.6, 0.34, 'z', 14));
  const m2hs = box(9.0, 2.6, 0.55, hsM, 9.6, part.form === 'ATX' ? -21.0 : -20.6, 0.45, 0.2); g.add(m2hs);
  g.add(label(5, 1.1, simpleText([{ t: 'M.2  SHIELD', font: 'bold 60px Segoe UI', color: '#eee' }], {}, 512, 110), 9.6, m2hs.position.y, 0.74));
  // ---- khe PCIe: x16 bọc thép + x1 + x16 phụ ----
  const pcieY = -16;
  g.add(box(8.9, 0.85, 1.15, PLASTIC(0x16171a), 8.45, pcieY, 0.73, 0.05));
  g.add(box(9.1, 0.95, 1.0, NICKEL(), 8.45, pcieY, 0.72, 0.06));
  g.add(box(8.5, 0.18, 0.06, mat(0x050505), 8.45, pcieY, 1.23));
  g.add(box(0.6, 1.2, 1.2, PLASTIC(0xe5e7ea), 13.2, pcieY, 0.75, 0.1));
  g.add(box(2.5, 0.8, 1.1, PLASTIC(0x16171a), 5.25, -19.0, 0.71, 0.05));
  if (part.form === 'ATX') { g.add(box(8.9, 0.8, 1.1, PLASTIC(0x2a2d33), 8.45, -25.6, 0.71, 0.05)); g.add(box(2.5, 0.8, 1.1, PLASTIC(0x16171a), 5.25, -23.4, 0.71, 0.05)); }
  // ---- chipset: tấm tản lớn có logo ----
  const cs = box(6.2, 6.0, 0.75, hsM, 17.6, part.form === 'ATX' ? -22.5 : -19.6, 0.55, 0.35); g.add(cs);
  g.add(label(4.6, 1.4, simpleText([{ t: part.chipset || '', font: 'bold 72px Segoe UI, Arial', color: '#f2f2f2' }], {}, 512, 140), 17.6, cs.position.y + 0.6, 0.94));
  if (part.accent !== undefined) { const rl = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 0.1), new THREE.MeshStandardMaterial({ color: 0x3a3a3e, emissive: acc, emissiveIntensity: 0.25 })); rl.position.set(17.6, cs.position.y - 1.6, 0.95); rl.name = 'rgb'; g.add(rl); }
  // ---- SATA (xếp chồng, quay ngang), pin CMOS, audio, header ----
  for (let i = 0; i < 4; i++) { g.add(box(0.95, 1.05, 0.85, PLASTIC(0x111111), 23.7, -15.0 - i * 1.25, 0.5, 0.05)); g.add(box(0.5, 0.18, 0.05, mat(0x050505), 23.8, -15.0 - i * 1.25, 0.94)); }
  g.add(cyl(1.0, 0.32, NICKEL(), 13, part.form === 'ATX' ? -17.8 : -22.4, 0.32, 'z', 32));
  const audioCap = new THREE.CylinderGeometry(0.32, 0.32, 0.9, 16); audioCap.rotateX(Math.PI / 2);
  g.add(instances(audioCap, mat(0xd4af37, { metalness: 0.7, roughness: 0.3 }), [[1.3, -H + 2.0, 0.6], [2.2, -H + 2.0, 0.6], [3.1, -H + 2.0, 0.6], [1.3, -H + 3.1, 0.6], [2.2, -H + 3.1, 0.6]]));
  g.add(box(1.8, 0.6, 0.75, PLASTIC(0x111111), 20.5, -H + 1.0, 0.5), box(1.6, 0.6, 0.75, PLASTIC(0x111111), 15.4, -H + 1.0, 0.5), box(1.3, 0.6, 0.75, PLASTIC(0x111111), 11, -H + 1.0, 0.5));
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

// ======================= CPU (gốc ở giữa socket) =======================
export function cpuModel(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const intel = part.brand === 'intel';
  const w = intel ? 3.75 : 4.0, h = intel ? 4.5 : 4.0;
  g.add(box(w, h, 0.14, PCB(intel ? 0x1f5a37 : 0x1d4d33), 0, 0, 0.07, 0.05));
  // linh kiện nhỏ trên đế
  g.add(instances(new THREE.BoxGeometry(0.12, 0.06, 0.05), GOLD(), [...Array(14)].map((_, i) => [-w / 2 + 0.25 + (i % 7) * (w - 0.5) / 6, (i < 7 ? -1 : 1) * (h / 2 - 0.18), 0.16])));
  // nắp IHS: Intel hình chữ nhật có tai; AMD AM5 hình "bạch tuộc"
  const s = new THREE.Shape();
  if (intel) { const a = w * 0.42, b = h * 0.38; s.moveTo(-a, -b); s.lineTo(a, -b); s.lineTo(a, -0.6); s.lineTo(a + 0.25, -0.6); s.lineTo(a + 0.25, 0.6); s.lineTo(a, 0.6); s.lineTo(a, b); s.lineTo(-a, b); s.lineTo(-a, 0.6); s.lineTo(-a - 0.25, 0.6); s.lineTo(-a - 0.25, -0.6); s.lineTo(-a, -0.6); s.lineTo(-a, -b); }
  else { const a = 1.7; s.moveTo(-a, -a); [[-0.9, -a], [-0.9, -1.95], [-0.45, -1.95], [-0.45, -a], [0.45, -a], [0.45, -1.95], [0.9, -1.95], [0.9, -a], [a, -a], [a, -0.9], [1.95, -0.9], [1.95, -0.45], [a, -0.45], [a, 0.45], [1.95, 0.45], [1.95, 0.9], [a, 0.9], [a, a], [0.9, a], [0.9, 1.95], [0.45, 1.95], [0.45, a], [-0.45, a], [-0.45, 1.95], [-0.9, 1.95], [-0.9, a], [-a, a], [-a, 0.9], [-1.95, 0.9], [-1.95, 0.45], [-a, 0.45], [-a, -0.45], [-1.95, -0.45], [-1.95, -0.9], [-a, -0.9], [-a, -a]].forEach(([x, y]) => s.lineTo(x, y)); }
  const ihsM = new THREE.MeshStandardMaterial({ color: 0xd2d6db, metalness: 1, roughness: 0.28, roughnessMap: brushed() });
  const ihs = extrude(s, 0.22, ihsM, 0.03); ihs.position.z = 0.15; g.add(ihs);
  const t = simpleText(intel
    ? [{ t: 'intel', font: 'italic bold 64px Arial', color: '#3a4350' }, { t: /Ultra/.test(part.name) ? 'CORE ULTRA' : 'CORE', font: 'bold 38px Arial', color: '#3a4350' }, { t: part.name.replace(/Intel Core (Ultra )?/, ''), font: 'bold 34px Arial', color: '#3a4350' }, { t: 'SRMB' + (part.cores || 8) + 'X  V' + (part.power || 65), font: '26px monospace', color: '#596270' }]
    : [{ t: 'AMD', font: 'bold 66px Arial', color: '#2a2f36' }, { t: 'RYZEN', font: 'bold 46px Arial', color: '#2a2f36' }, { t: part.name.replace('AMD Ryzen ', ''), font: 'bold 34px Arial', color: '#2a2f36' }, { t: '100-000001084  2451', font: '24px monospace', color: '#4b525c' }], {}, 300, 320);
  g.add(label(w * 0.74, h * 0.68, t, 0, 0, 0.42, null, { opacity: 0.85 }));
  const tri = new THREE.Mesh(new THREE.CircleGeometry(0.22, 3), GOLD()); tri.position.set(-w / 2 + 0.3, -h / 2 + 0.3, 0.15); g.add(tri);
  return g;
}

// ======================= Tản nhiệt CPU (gốc ở giữa socket, mặt CPU tại z≈0.45) =======================
function heatpipe(points, r = 0.3, m = NICKEL()) { const c = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))); const t = new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 12, false), m); t.castShadow = true; return t; }
function finStack(w, h, n, gap, z0, { color = 0xcfd4d9, topColor = 0x15171a, logo = '' } = {}) {
  const s = new THREE.Group();
  const finM = mat(color, { metalness: 0.55, roughness: 0.4 });
  // lá tản có mép răng cưa: dùng hình có rãnh
  const fs = new THREE.Shape(); fs.moveTo(-w / 2, -h / 2); for (let i = 0; i <= 10; i++) { const y = -h / 2 + (h * i) / 10; fs.lineTo(-w / 2 + (i % 2 ? 0.25 : 0), y); } fs.lineTo(w / 2, h / 2); for (let i = 10; i >= 0; i--) { const y = -h / 2 + (h * i) / 10; fs.lineTo(w / 2 - (i % 2 ? 0.25 : 0), y); }
  const fg = new THREE.ShapeGeometry(fs);
  const im = new THREE.InstancedMesh(fg, finM, n); const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) { o.position.set(0, 0, z0 + i * gap); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.castShadow = true; im.receiveShadow = true; finM.side = THREE.DoubleSide; s.add(im);
  const topZ = z0 + n * gap + 0.25;
  s.add(box(w + 0.2, h + 0.2, 0.5, mat(topColor, { metalness: 0.6, roughness: 0.35, roughnessMap: brushed() }), 0, 0, topZ, 0.18));
  if (logo) s.add(label(w * 0.9, h * 0.6, simpleText([{ t: logo, font: 'bold 64px Segoe UI, Arial', color: '#e6e6e6' }], {}, 512, 120), 0, 0, topZ + 0.26, [0, 0, Math.PI / 2]));
  // đầu ống nhiệt nhô lên mặt trên
  [-1.35, -0.45, 0.45, 1.35].forEach((y) => [-1, 1].forEach((x) => s.add(cyl(0.3, 0.3, NICKEL(), x * 1.3, y * 2.2, topZ + 0.3, 'z', 16))));
  s.userData.topZ = topZ;
  return s;
}
export function coolerModel(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const z0 = 0.5;
  if (part.type === 'aio') {
    // ---- bơm: thân tròn + nắp gương vô cực / màn hình LCD ----
    g.add(box(6.0, 6.0, 1.0, ALU_DARK(), 0, 0, z0 + 0.5, 0.6));
    g.add(cyl(3.1, 3.4, mat(0x15161a, { metalness: 0.5, roughness: 0.35, clearcoat: 0.6 }), 0, 0, z0 + 2.7, 'z', 64));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.12, 12, 64), METAL()).translateZ(z0 + 4.4));
    const capM = new THREE.MeshStandardMaterial({ color: 0x050505, emissive: part.screen ? 0x2563eb : 0x7c3aed, emissiveIntensity: 0.35, roughness: 0.1, metalness: 0.4,
      emissiveMap: part.screen ? simpleText([{ t: '45°C', font: 'bold 120px Segoe UI', color: '#fff' }, { t: 'CPU', font: 'bold 50px Segoe UI', color: '#9cf' }], { bg: '#203a8c' }, 256, 256) : textTexture((ctx, W, H) => { const gr = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2); gr.addColorStop(0, '#000'); gr.addColorStop(0.55, '#333'); gr.addColorStop(0.62, '#fff'); gr.addColorStop(0.7, '#000'); gr.addColorStop(0.82, '#888'); gr.addColorStop(0.9, '#000'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }, 256, 256) });
    const cap = new THREE.Mesh(new THREE.CircleGeometry(2.95, 64), capM); cap.position.z = z0 + 4.42; cap.name = 'rgb'; g.add(cap);
    g.add(label(3.6, 0.9, simpleText(part.screen ? 'NZXT' : 'DEEPCOOL', { fg: '#fff', font: 'bold 60px Segoe UI' }, 512, 120), 0, -1.9, z0 + 4.44));
    // ---- két nước dưới nóc ----
    const L = part.rad === 360 ? 39.4 : 27.5;
    const rc = new THREE.Vector3(9.4, 8.1, 11.1);
    const radM = mat(0x16171a, { metalness: 0.6, roughness: 0.45 });
    g.add(box(L - 3.4, 2.7, 0.5, radM, rc.x, rc.y, rc.z - 5.9), box(L - 3.4, 2.7, 0.5, radM, rc.x, rc.y, rc.z + 5.9));
    g.add(box(1.8, 3.2, 12.6, radM, rc.x - L / 2 + 0.9, rc.y, rc.z, 0.3), box(1.8, 3.2, 12.6, radM, rc.x + L / 2 - 0.9, rc.y, rc.z, 0.3));
    // lá tản lượn sóng: các tấm mỏng xếp dày
    const finG = new THREE.PlaneGeometry(2.6, 11.3); const fl = [];
    for (let x = rc.x - L / 2 + 2; x < rc.x + L / 2 - 2; x += 0.22) fl.push([x, rc.y, rc.z, 0, Math.PI / 2, 0]);
    g.add(instances(finG, mat(0x2a2c31, { metalness: 0.7, roughness: 0.5, side: THREE.DoubleSide }), fl));
    const nF = part.rad === 360 ? 3 : 2;
    for (let i = 0; i < nF; i++) { const f = fan(12, { rgb: 0x7c3aed }); f.rotation.x = Math.PI / 2; f.position.set(rc.x - (nF - 1) * 6.1 + i * 12.2, rc.y - 2.7, rc.z); g.add(f); }
    // ống bọc lưới + khớp nối
    const sleeve = mat(0x111214, { roughness: 0.75, roughnessMap: grain() });
    const tube = (dz) => { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(2.2, 2.2, z0 + 3.2 + dz * 0.3), new THREE.Vector3(4, 5.5, z0 + 6 + dz), new THREE.Vector3(rc.x - L / 2 + 0.9, rc.y - 2.2, rc.z - 3.5 + dz * 1.2), new THREE.Vector3(rc.x - L / 2 + 0.9, rc.y - 1.6, rc.z - 3.5 + dz * 1.2)]); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 48, 0.5, 14, false), sleeve); m.castShadow = true; return m; };
    g.add(tube(0), tube(2.4));
    g.add(cyl(0.6, 0.9, METAL(), 2.2, 2.2, z0 + 3.0, 'z', 20), cyl(0.6, 0.9, METAL(), 2.7, 2.4, z0 + 3.4, 'z', 20));
    return g;
  }
  if (part.type === 'stock') {
    // AMD Wraith / Intel Laminar: lõi đồng + vây toả tròn + quạt + vỏ có logo
    g.add(cyl(1.8, 2.4, COPPER(), 0, 0, z0 + 1.2, 'z', 32));
    const fin = new THREE.BoxGeometry(2.8, 0.1, 2.4); const fl = [];
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; fl.push([Math.cos(a) * 3.1, Math.sin(a) * 3.1, z0 + 1.2, 0, 0, a]); }
    g.add(instances(fin, mat(0xb9bec4, { metalness: 0.9, roughness: 0.35 }), fl));
    const f = fan(8.4, { thick: 1.6, blade: 0x111111, frame: 0x111111 }); f.position.z = z0 + 3.3; g.add(f);
    const sh = rrectShape(9.6, 9.6, 1.6); const hole = new THREE.Path(); hole.absarc(0, 0, 4.2, 0, Math.PI * 2, true); sh.holes.push(hole);
    const cover = extrude(sh, 0.4, PLASTIC(0x111111), 0.08); cover.position.z = z0 + 4.1; g.add(cover);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.25, 0.1, 8, 64), new THREE.MeshStandardMaterial({ color: 0x3a3a3e, emissive: 0xff3b3b, emissiveIntensity: 0.25 })); ring.position.z = z0 + 4.6; ring.name = 'rgb'; g.add(ring);
    g.add(label(2.4, 0.9, simpleText(part.brand === 'intel' ? 'intel' : 'AMD', { fg: '#ddd', font: 'bold 80px Arial' }, 256, 96), 0, 0, z0 + 4.15));
    return g;
  }
  // ---- tản tháp: đế đồng mạ nickel + ống nhiệt chữ U + chồng lá tản ----
  g.add(box(4.0, 4.0, 0.55, NICKEL(), 0, 0, z0 + 0.28, 0.12));
  g.add(box(4.6, 3.0, 0.35, ALU_DARK(), 0, 0, z0 + 0.72, 0.12));
  const pipes = part.type === 'dual' ? 6 : 4; const zf = 3.2;
  if (part.type === 'tower') {
    const st = finStack(4.6, 12.6, 46, 0.24, zf, { logo: (part.label || '').toUpperCase(), topColor: 0x15171a }); g.add(st);
    for (let i = 0; i < pipes; i++) { const y = -1.6 + i * (3.2 / (pipes - 1)); const x = (i % 2 ? 0.7 : -0.7); g.add(heatpipe([[x, y * 0.5, z0 + 0.6], [x, y * 0.5, z0 + 1.6], [x * 1.4, y * 1.6, zf - 0.5], [x * 1.4, y * 2.1, st.userData.topZ]], 0.3, COPPER())); }
    const f = fan(12, { rgb: part.rgb ? 0xff3355 : null, logo: (part.label || '').slice(0, 2) }); f.rotation.y = Math.PI / 2; f.position.set(3.65, 0, zf + 5.6); g.add(f);
    // kẹp quạt
    [-1, 1].forEach((s) => g.add(heatpipe([[3.5, s * 6.2, zf + 0.5], [2.6, s * 6.6, zf + 0.5], [2.6, s * 6.6, zf + 10.8], [3.5, s * 6.2, zf + 10.8]], 0.05, METAL())));
  } else {
    const brown = part.fanColor === 'noctua' ? { frame: 0x6b3e2a, blade: 0xcfa889, corners: 0x5a2f24, logo: 'N' } : { frame: 0x1b1c1f, blade: 0x2a2d33 };
    const s1 = finStack(4.6, 12.6, 46, 0.24, zf, { topColor: part.fanColor === 'noctua' ? 0xd4d8dc : 0x15171a, logo: part.fanColor === 'noctua' ? 'NOCTUA' : (part.label || '') }); s1.position.x = -3.6; g.add(s1);
    const s2 = finStack(4.6, 12.6, 46, 0.24, zf, { topColor: part.fanColor === 'noctua' ? 0xd4d8dc : 0x15171a, logo: part.fanColor === 'noctua' ? 'NOCTUA' : '' }); s2.position.x = 3.6; g.add(s2);
    for (let i = 0; i < 3; i++) { const y = -1.2 + i * 1.2; [-1, 1].forEach((sd) => g.add(heatpipe([[sd * 0.6, y, z0 + 0.6], [sd * 1.2, y, z0 + 1.4], [sd * 3.6, y * 1.8, zf - 0.4], [sd * 3.6, y * 2.4, s1.userData.topZ]], 0.3, NICKEL()))); }
    const f1 = fan(14, brown); f1.rotation.y = Math.PI / 2; f1.position.set(0, 0, 9.0); f1.scale.setScalar(0.92); g.add(f1);
    const f2 = fan(14, brown); f2.rotation.y = Math.PI / 2; f2.position.set(6.5, 0, 9.0); f2.scale.setScalar(0.92); g.add(f2);
  }
  return g;
}

// ======================= RAM (kit 2 thanh, khe 2 và 4) =======================
export function ramModel(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const ddr5 = part.type === 'DDR5';
  const col = part.color, lt = light(col);
  // hồ sơ tản nhiệt (nhìn từ cạnh): đỉnh có bậc / răng
  const prof = new THREE.Shape(); const L = 13.25, Hh = part.rgb ? 3.4 : 3.1;
  prof.moveTo(-L / 2, 0); prof.lineTo(L / 2, 0); prof.lineTo(L / 2, Hh - 0.6); prof.lineTo(L / 2 - 0.5, Hh - 0.6);
  const teeth = /trident|tz/i.test(part.id) ? 9 : 0;
  if (teeth) { for (let i = 0; i < teeth; i++) { const x1 = L / 2 - 0.5 - i * ((L - 1) / teeth); prof.lineTo(x1, Hh); prof.lineTo(x1 - ((L - 1) / teeth) * 0.5, Hh - 0.35); } }
  else { prof.lineTo(L / 2 - 1.5, Hh); prof.lineTo(-L / 2 + 1.5, Hh); }
  prof.lineTo(-L / 2 + 0.5, Hh - 0.6); prof.lineTo(-L / 2, Hh - 0.6); prof.lineTo(-L / 2, 0);
  const spreader = new THREE.ExtrudeGeometry(prof, { depth: 0.58, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
  spreader.rotateZ(Math.PI / 2); spreader.rotateY(Math.PI / 2); // cạnh dài theo y, cao theo z
  const sprM = mat(col, { metalness: 0.75, roughness: 0.35, roughnessMap: brushed(), clearcoat: 0.3 });
  const brandT = simpleText([{ t: (part.label || '').toUpperCase(), font: 'bold 64px Segoe UI, Arial', color: lt ? '#1e1e1e' : '#f0f0f0' }, { t: `${ddr5 ? 'DDR5' : 'DDR4'} · ${part.size / 2}GB · ${part.speed || ''}`, font: 'bold 34px Arial', color: lt ? '#555' : '#9aa0a8' }], {}, 1024, 180);
  [-0.9, 0.9].forEach((dx) => {
    const s = new THREE.Group(); s.position.x = dx;
    s.add(box(0.12, 13.3, 3.0, PCB(0x15412a), 0, 0, 1.5));
    // chân cắm vàng
    s.add(instances(new THREE.BoxGeometry(0.13, 0.17, 0.42), GOLD(), [...Array(36)].map((_, i) => [0, -6.3 + i * 0.36, 0.22])));
    const sp = new THREE.Mesh(spreader, sprM); sp.position.set(-0.29, 0, 0.35); sp.castShadow = true; s.add(sp);
    s.add(label(11.5, 2.0, brandT, 0.32, 0, 1.75, [0, Math.PI / 2, Math.PI / 2]));
    s.add(label(11.5, 2.0, brandT, -0.32, 0, 1.75, [0, -Math.PI / 2, Math.PI / 2]));
    if (part.rgb) {
      const dif = new THREE.Mesh(new THREE.BoxGeometry(0.5, 12.2, 0.55), new THREE.MeshStandardMaterial({ color: 0x3a3a3e, emissive: 0x8844ff, emissiveIntensity: 0.35, roughness: 0.8, transparent: true, opacity: 0.95 }));
      dif.position.z = Hh + 0.55; dif.name = 'rgb'; s.add(dif);
    }
    g.add(s);
  });
  return g;
}

// ======================= SSD M.2 =======================
export function m2Model(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const isSam = /samsung|990|980/i.test(part.name), isWD = /wd|sn\d/i.test(part.name);
  g.add(box(8.0, 2.2, 0.08, PCB(0x0d0d0d), 0, 0, 0.04));
  g.add(instances(new THREE.BoxGeometry(0.11, 0.3, 0.09), GOLD(), [...Array(14)].map((_, i) => [-3.92, -0.95 + i * 0.146, 0.045])));
  g.add(box(1.3, 1.3, 0.14, PLASTIC(0x202022), -2.4, 0, 0.15), box(1.5, 1.5, 0.14, PLASTIC(0x202022), 0.1, 0, 0.15), box(1.5, 1.5, 0.14, PLASTIC(0x202022), 2.2, 0, 0.15));
  const t = textTexture((ctx, W, H) => {
    ctx.fillStyle = isSam ? '#0b0b0c' : isWD ? '#111' : '#1a2440'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = isSam ? '#d8d8d8' : '#fff'; ctx.font = 'bold 48px Segoe UI, Arial'; ctx.fillText(isSam ? 'SAMSUNG' : isWD ? 'WD_BLACK' : (part.name.split(' ')[0] || '').toUpperCase(), 20, 60);
    ctx.font = 'bold 36px Segoe UI'; ctx.fillStyle = isWD ? '#cfcfcf' : '#9fd3ff'; ctx.fillText((part.name.match(/\d{3,4}\s?(PRO|EVO|X|Plus)?/i) || [''])[0] + '  NVMe™ M.2', 20, 110);
    ctx.font = '26px monospace'; ctx.fillStyle = '#9a9a9a'; ctx.fillText((part.size >= 1000 ? part.size / 1000 + 'TB' : part.size + 'GB') + '  PCIe 4.0 x4  ·  S/N 3R2NJ0X', 20, 150);
    ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) ctx.fillRect(560 + i * 9, 30, i % 3 ? 3 : 5, 60);
  }, 1024, 180);
  g.add(label(6.8, 1.9, t, 0.45, 0, 0.23));
  return g;
}

// ======================= Card đồ hoạ (gốc tại đầu khe PCIe, card theo +x, quạt hướng xuống -y) =======================
export function gpuModel(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const L = part.length / 10, T = part.thick, Hh = 11.8;
  const x0 = -4.4, zc = Hh / 2 + 0.3, xc = x0 + L / 2;
  const lt = light(part.color);
  const shroudM = mat(part.color, { metalness: 0.55, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.25 });
  const accent = part.brand === 'nvidia' ? 0x76b900 : part.brand === 'intel' ? 0x3ba1ff : 0xed1c24;
  // PCB + chân cắm
  g.add(box(L - 1.5, 0.16, Hh - 0.4, PCB(0x111111), x0 + 0.6 + (L - 1.5) / 2, 0, zc));
  g.add(instances(new THREE.BoxGeometry(0.12, 0.18, 0.75), GOLD(), [...Array(30)].map((_, i) => [0.3 + i * 0.27, 0, 0.2])));
  // backplate kim loại có khe thông gió + logo
  const bpT = textTexture((ctx, W, H) => {
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#000';
    for (let i = 0; i < 22; i++) ctx.fillRect(W * 0.72 + (i % 2) * 14, 40 + i * 18, W * 0.22, 8);
  }, 512, 512, { srgb: false });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(L - 0.4, 0.22, Hh), [ALU_DARK(), ALU_DARK(), new THREE.MeshStandardMaterial({ color: 0x24272c, metalness: 0.85, roughness: 0.35, roughnessMap: brushed(), alphaMap: bpT, alphaTest: 0.5 }), ALU_DARK(), ALU_DARK(), ALU_DARK()]).translateX(x0 + 0.2 + (L - 0.4) / 2).translateY(0.2).translateZ(zc));
  g.add(label(6, 1.4, simpleText([{ t: (part.maker || '').toUpperCase(), font: 'bold 80px Segoe UI', color: '#d5d8dc' }], {}, 512, 120), xc - L * 0.2, 0.32, zc, [-Math.PI / 2, 0, 0]));
  // khối tản (lá nhôm) nhìn thấy ở cạnh
  const fins = []; for (let x = x0 + 0.8; x < x0 + L - 0.8; x += 0.18) fins.push([x, -T * 0.42, zc]);
  g.add(instances(new THREE.BoxGeometry(0.05, T * 0.6, Hh - 1.2), mat(0xb9bec4, { metalness: 0.9, roughness: 0.35 }), fins));
  // vỏ quạt (shroud): khung có lỗ tròn cho từng quạt
  const fd = Math.min(9.2, (L - 1.2) / part.fans - 0.3);
  const sh = rrectShape(L, Hh + 0.4, 0.8); const fx = (i) => -L / 2 + (L / part.fans) * (i + 0.5);
  for (let i = 0; i < part.fans; i++) { const hp = new THREE.Path(); hp.absarc(fx(i), 0, fd * 0.49, 0, Math.PI * 2, true); sh.holes.push(hp); }
  const shroud = extrude(sh, 0.9, shroudM, 0.12); shroud.rotation.x = Math.PI / 2; shroud.position.set(xc, -T + 0.85, zc); g.add(shroud);
  // gờ trang trí (đường chéo) trên shroud
  [0.25, 0.75].forEach((k) => { const ln = box(L * 0.18, 0.12, 0.25, mat(accent, { metalness: 0.4, roughness: 0.3 }), x0 + L * k, -T - 0.08, zc + (k < 0.5 ? 4.6 : -4.6), 0.05); ln.rotation.y = 0.5; g.add(ln); });
  // mặt bên trên (hướng người xem): khung shroud + logo + dải RGB
  g.add(box(L, T - 0.9, 0.5, shroudM, xc, -T / 2 + 0.05, Hh + 0.35, 0.15));
  const brand = part.brand === 'nvidia' ? (part.name.includes('GTX') ? 'GEFORCE GTX' : 'GEFORCE RTX') : part.brand === 'intel' ? 'INTEL ARC' : 'RADEON';
  const name = (part.name.match(/(GTX|RTX|RX|Arc)\s?[A-Z]?\d{3,4}( Ti| SUPER| XT| XTX)*/) || [''])[0].replace('Arc ', '');
  g.add(label(Math.min(14, L * 0.5), T * 0.55, simpleText([{ t: brand, font: 'bold 60px Arial', color: hex(accent) }, { t: (part.maker ? part.maker.toUpperCase() + '  ' : '') + name, font: 'bold 40px Arial', color: lt ? '#2a2a2a' : '#eaeaea' }], {}, 640, 170), x0 + L * 0.58, -T / 2 + 0.1, Hh + 0.61));
  const strip = new THREE.Mesh(new THREE.BoxGeometry(L * 0.32, 0.22, 0.08), new THREE.MeshStandardMaterial({ color: 0x3a3a3e, emissive: accent, emissiveIntensity: 0.25 }));
  strip.position.set(x0 + L * 0.22, -T / 2 + 0.1, Hh + 0.62); strip.name = 'rgb'; g.add(strip);
  // quạt lõm trong shroud
  for (let i = 0; i < part.fans; i++) {
    const f = fan(fd, { frame: part.color, blade: lt ? 0xf0f0f0 : 0x141518, thick: 0.85, blades: 11, corners: part.color, logo: '' });
    f.children[0].visible = false; // ẩn khung vuông, dùng lỗ tròn của shroud
    f.children.filter((ch) => ch.geometry && ch.geometry.type === 'CylinderGeometry' && Math.abs(ch.position.x) > 0.1).forEach((ch) => (ch.visible = false));
    f.rotation.x = Math.PI / 2; f.position.set(x0 + (L / part.fans) * (i + 0.5), -T + 0.5, zc); g.add(f);
  }
  // ke chắn (bracket) với cổng DP/HDMI
  const brM = METAL();
  g.add(box(0.12, Math.max(T + 0.6, 2.4), 12.2, brM, x0 - 0.2, -T / 2 + 0.25, 6.1));
  const portM = mat(0x0b0b0b);
  [[-0.6, 1.6], [-0.6, 3.6], [-0.6, 5.6], [-0.6, 7.8]].forEach(([dy, z], i) => g.add(box(0.15, i === 3 ? 0.6 : 0.55, i === 3 ? 1.5 : 1.7, portM, x0 - 0.28, dy - 0.1, z)));
  // cổng nguồn phụ ở mép trên
  const pw = part.h16 ? 1.9 : part.pcie * 2.0;
  if (part.pcie) { g.add(box(pw, part.h16 ? 0.7 : 0.95, 0.85, PLASTIC(0x0e0e0e), x0 + L - 4.5, -T / 2 + 0.3, Hh + 0.75, 0.05)); }
  g.userData.powerAnchor = new THREE.Vector3(x0 + L - 4.5, -T / 2 + 0.3, Hh + 1.1);
  return g;
}

// ======================= Bộ nguồn (gốc ở tâm hộp) =======================
export const PSU_POS = new THREE.Vector3(-13.6, 4.9, -2.4);
export function psuModel(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const body = mat(0x17181b, { metalness: 0.6, roughness: 0.45, roughnessMap: grain() });
  g.add(box(15, 8.6, 15, body, 0, 0, 0, 0.35));
  // nhãn thông số bên hông
  const t = textTexture((ctx, W, H) => {
    ctx.fillStyle = '#121316'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 92px Segoe UI, Arial'; ctx.fillText((part.brand || part.name.split(' ')[0]).toUpperCase(), 40, 120);
    ctx.font = 'bold 150px Segoe UI'; ctx.fillText(part.watt + 'W', 40, 290);
    const effc = /PLATINUM/.test(part.eff) ? '#d9dde3' : /GOLD/.test(part.eff) ? '#e8c35a' : /TITANIUM/.test(part.eff) ? '#9fb2c8' : '#cd7f32';
    ctx.fillStyle = effc; ctx.beginPath(); ctx.arc(W - 150, 210, 100, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillText('80', W - 150, 190); ctx.font = 'bold 24px Arial'; ctx.fillText('PLUS', W - 150, 222); ctx.fillText((part.eff || '').replace('80 PLUS ', ''), W - 150, 252);
    ctx.textAlign = 'left'; ctx.fillStyle = '#9aa0a8'; ctx.font = '28px monospace'; ctx.fillText('FULLY MODULAR  ·  ATX 3.1  ·  PCIe 5.1', 40, 380); ctx.fillText('+12V ' + Math.round(part.watt / 12) + 'A   +5V 22A   +3.3V 22A', 40, 425);
  }, 1024, 480);
  g.add(label(13.4, 6.3, t, 0, 0, 7.53));
  // lưới quạt tổ ong ở mặt dưới (hướng xuống) + quạt bên trong
  const gr = perforated(13.4, 13.4, 0x222428, 'hex', [10, 10]); gr.rotation.x = Math.PI / 2; gr.position.y = -4.33; g.add(gr);
  const f = fan(12, { frame: 0x111111, blade: 0x1a1a1a, thick: 2 }); f.rotation.x = Math.PI / 2; f.position.y = -3.2; g.add(f);
  // mặt cắm dây modular (phía trước, +x)
  g.add(box(0.2, 7.2, 13, PLASTIC(0x0c0c0c), 7.56, 0, 0));
  const sockets = [[2.2, -4.6, 2.6], [2.2, -1.6, 2.6], [2.2, 1.4, 1.8], [2.2, 3.8, 1.8], [-0.3, -4.6, 1.8], [-0.3, -2.4, 1.8], [-0.3, 0.2, 1.8], [-0.3, 2.6, 1.8], [-2.6, -4, 1.4], [-2.6, -1.8, 1.4], [-2.6, 0.6, 1.4]];
  sockets.forEach(([y, z, w]) => g.add(box(0.25, 1.0, w, PLASTIC(0x050505), 7.66, y, z, 0.05)));
  // mặt sau: ổ cắm AC + công tắc + lưới
  g.add(box(0.3, 2.2, 3.2, PLASTIC(0x111111), -7.6, 2.2, -3.4, 0.1), box(0.3, 1.4, 0.9, mat(0xa42020, { roughness: 0.4 }), -7.62, -1.4, -3.4, 0.1));
  const rg = perforated(10, 7, 0x2a2c30, 'hex', [8, 6]); rg.rotation.y = -Math.PI / 2; rg.position.set(-7.6, 0, 2.6); g.add(rg);
  return g;
}
export const PSU_OUT = new THREE.Vector3(7.6, 2.5, 4);

// ======================= HDD 3.5" / SSD 2.5" =======================
export const HDD_POS = new THREE.Vector3(13.2, 4.8, -1.85);
export function hddModel(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const al = mat(0xb6bcc3, { metalness: 0.9, roughness: 0.38, roughnessMap: brushed() });
  g.add(box(14.7, 2.6, 10.2, al, 0, 0, 0, 0.2));
  g.add(box(14.4, 0.3, 9.9, PCB(0x0e3b22), 0, -1.4, 0));
  const t = textTexture((ctx, W, H) => {
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = part.brand === 'Seagate' ? '#2c9a3c' : '#0b3d91'; ctx.fillRect(0, 0, W, 90);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 60px Segoe UI, Arial'; ctx.fillText((part.brand || 'HDD').toUpperCase(), 30, 66);
    ctx.fillStyle = '#111'; ctx.font = 'bold 54px Segoe UI'; ctx.fillText(part.size >= 1000 ? part.size / 1000 + 'TB' : part.size + 'GB', 30, 170);
    ctx.font = '28px monospace'; ctx.fillStyle = '#444'; ctx.fillText('7200 RPM · SATA 6Gb/s · 3.5"', 30, 220); ctx.fillText('MODEL: ' + (part.name.match(/\w+\d+\w*/) || ['HDD'])[0], 30, 262);
    for (let i = 0; i < 46; i++) { ctx.fillStyle = '#111'; ctx.fillRect(560 + i * 8, 300, i % 3 ? 3 : 5, 70); }
  }, 1024, 400);
  g.add(label(11, 4.3, t, -0.6, 1.31, 0, [-Math.PI / 2, 0, 0]));
  [[-6.8, -4.5], [6.8, -4.5], [-6.8, 4.5], [6.8, 4.5], [0, -4.5], [0, 4.5]].forEach(([x, z]) => g.add(cyl(0.25, 0.06, NICKEL(), x, 1.32, z, 'y', 12)));
  g.add(box(0.3, 1.2, 3.2, PLASTIC(0x111111), -7.45, 0, 2.5));
  g.userData.port = new THREE.Vector3(-7.5, 0, 2.5);
  return g;
}
export function ssd25Model(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const sam = part.brand === 'Samsung';
  g.add(box(10, 0.7, 7, mat(sam ? 0x2b2d31 : 0x3a3f47, { metalness: 0.7, roughness: 0.35, roughnessMap: brushed() }), 1.5, -0.8, 0, 0.18));
  const t = textTexture((ctx, W, H) => {
    ctx.fillStyle = sam ? '#141519' : '#3b2a55'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 72px Segoe UI, Arial'; ctx.fillText(sam ? 'SAMSUNG' : part.brand.toUpperCase(), 40, 110);
    ctx.fillStyle = sam ? '#ff8a00' : '#9fe'; ctx.font = 'bold 56px Segoe UI'; ctx.fillText(sam ? 'SSD 870 EVO' : 'MX500 SSD', 40, 200);
    ctx.fillStyle = '#bbb'; ctx.font = '34px Segoe UI'; ctx.fillText(((part.name.match(/\d+(GB|TB)/) || [''])[0]) + '  ·  SATA III 2.5"', 40, 270);
  }, 1024, 340);
  g.add(label(7.6, 2.6, t, 1.5, -0.44, 0, [-Math.PI / 2, 0, 0]));
  g.add(box(0.3, 0.6, 3.0, PLASTIC(0x111111), -3.55, -0.8, 2.3));
  g.userData.port = new THREE.Vector3(-3.6, -0.8, 2.3);
  return g;
}
export const HDD_PORT = new THREE.Vector3(-7.5, 0, 2.5);

// ======================= Cáp bọc lưới (nhiều sợi song song) =======================
const sleeveTex = () => cachedTex('sleeve', () => textTexture((ctx, W, H) => { ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#b0b0b0'; ctx.lineWidth = 2; for (let i = -H; i < W; i += 6) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i + H, 0); ctx.lineTo(i, H); ctx.stroke(); } }, 128, 32, { srgb: false, repeat: [60, 1] }));
export function cableMesh(points, radius = 0.35, color = 0x111111) {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.Group();
  const strands = radius >= 0.5 ? 6 : radius >= 0.35 ? 4 : radius >= 0.25 ? 2 : 1;
  const r = strands > 1 ? radius / (strands * 0.62) : radius;
  const m = mat(color, { roughness: 0.75, metalness: 0.05, roughnessMap: sleeveTex(), bumpMap: sleeveTex(), bumpScale: 0.6 });
  const N = 64; const frames = curve.computeFrenetFrames(N, false);
  for (let s = 0; s < strands; s++) {
    const off = (s - (strands - 1) / 2) * r * 2.05;
    const pts = []; for (let i = 0; i <= N; i++) { const p = curve.getPointAt(i / N); pts.push(p.add(frames.binormals[i].clone().multiplyScalar(off))); }
    const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, r, 10, false), m); t.castShadow = true; g.add(t);
  }
  // đầu cắm ở cuối
  const end = curve.getPointAt(1), tan = curve.getTangentAt(1);
  const plug = box(Math.max(0.5, strands * r * 2.2), r * 2.6 + 0.3, 1.0, PLASTIC(0x0d0d0d), 0, 0, 0, 0.05);
  plug.position.copy(end).addScaledVector(tan, -0.5); plug.lookAt(end.clone().add(tan)); g.add(plug);
  return g;
}

export { label, simpleText };
