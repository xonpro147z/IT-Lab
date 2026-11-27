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

// ======================= Ảnh chụp thật (texture) =======================
// Ảnh linh kiện thật (Wikimedia Commons, giấy phép CC – xem tex/CREDITS.md)
const TEX_BASE = new URL('./tex/', import.meta.url).href;
const loader = new THREE.TextureLoader();
export const TEX_OPTS = { aniso: 8, small: false }; // pcbuild.js chỉnh theo mức đồ hoạ
function photo(name, { srgb = true } = {}) {
  return cachedTex('photo:' + name, () => {
    const t = loader.load(TEX_BASE + name);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = TEX_OPTS.aniso;
    return t;
  });
}
// Ảnh chụp + vẽ thêm chữ (ví dụ tên CPU đúng mẫu đang chọn)
function photoDraw(name, key, draw, maxW = 1024) {
  return cachedTex('pd:' + name + ':' + key, () => {
    const c = document.createElement('canvas'); c.width = 4; c.height = 4;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = TEX_OPTS.aniso;
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxW / img.width); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height); draw(ctx, c.width, c.height, img);
      t.dispose(); t.needsUpdate = true;
    };
    img.src = TEX_BASE + name;
    return t;
  });
}
// Gán UV chiếu phẳng từ trên xuống (trục z): điểm (x,y) cục bộ → vị trí trên ảnh.
// rect = [x0, y0, w, h]: vùng (theo toạ độ cục bộ) phủ toàn bộ ảnh, y0 là mép trên (y giảm dần xuống dưới).
function planarUV(geo, ox, oy, rect) {
  const [x0, y0, w, h] = rect; const p = geo.attributes.position; const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + ox - x0) / w; uv[i * 2 + 1] = 1 - (y0 - (p.getY(i) + oy)) / h; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}
// Khối nổi phủ ảnh chiếu phẳng – mặt trên là ảnh thật, cạnh bên lấy màu mép ảnh (giống chi tiết thật)
function reliefBox(x, y, w, h, d, material, rect, z0 = 0, r = 0.06) {
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const g = rr > 0.01 ? new RoundedBoxGeometry(w, h, d, 2, rr) : new THREE.BoxGeometry(w, h, d);
  const cx = x + w / 2, cy = -(y + h / 2);
  planarUV(g, cx, cy, rect);
  const m = new THREE.Mesh(g, material); m.position.set(cx, cy, z0 + d / 2); m.castShadow = true; m.receiveShadow = true;
  return m;
}

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
// Kiểu vỏ (theo các dòng vỏ phổ biến). Phần bên trong (khay mainboard, khoang nguồn) giữ nguyên toạ độ để mọi linh kiện lắp đúng chỗ.
//  front: hex | slat | tri | glass | wood | smooth | glassrgb      dual: thêm khoang sau (vỏ 2 buồng)      tall: cao thêm (cm)
//  pillarless: bỏ cột góc trước (kính liền 2 mặt)      bottomFans/topFans/frontFans: số quạt      screen: màn hình cảm ứng      legs: rubber | rail | post
export const CASE_STYLES = {
  airflow:  { label: 'Lưới thoáng khí (Airflow)', front: 'hex', frontFans: 3 },
  slat:     { label: 'Mặt trước nan chéo + quạt ARGB', front: 'slat', frontFans: 3, rgbFans: true },
  mesh_rgb: { label: 'Lưới tam giác + quạt ARGB', front: 'tri', frontFans: 3, rgbFans: true },
  panorama: { label: 'Bể cá 2 buồng, kính liền góc', front: 'glass', dual: 8, pillarless: true, frontFans: 0, bottomFans: 3, topFans: 3, legs: 'rail' },
  touch:    { label: 'Bể cá 2 buồng + màn hình cảm ứng 2.5K', front: 'glass', dual: 8, pillarless: true, frontFans: 0, bottomFans: 3, topFans: 3, screen: true, legs: 'rail' },
  aquarium: { label: 'Bể cá 7 quạt ARGB', front: 'glass', dual: 6, pillarless: true, frontFans: 3, bottomFans: 3, rgbFans: true, legs: 'rail' },
  wood:     { label: 'Full tower mặt gỗ óc chó', front: 'wood', tall: 5, frontFans: 3, legs: 'post' },
  smooth:   { label: 'Vỏ bo cong liền khối', front: 'smooth', frontFans: 3, bottomFans: 0, legs: 'rail' },
  full:     { label: 'Full tower 2 buồng cao cấp', front: 'glass', dual: 9, pillarless: true, tall: 8, frontFans: 0, bottomFans: 3, topFans: 3, legs: 'post' },
  budget:   { label: 'Kính cường lực mặt trước + quạt vòng LED', front: 'glassrgb', frontFans: 3, rgbFans: true },
};
function woodTex(light = false) {
  return cachedTex('wood' + light, () => textTexture((ctx, W, H) => {
    ctx.fillStyle = light ? '#c79a64' : '#5b3a22'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { // vân gỗ chạy dọc
      const x = Math.random() * W; ctx.strokeStyle = `rgba(${light ? '90,55,25' : '25,12,5'},${0.06 + Math.random() * 0.12})`; ctx.lineWidth = 0.6 + Math.random() * 2.2;
      ctx.beginPath(); ctx.moveTo(x, 0); for (let y = 0; y <= H; y += 32) ctx.lineTo(x + Math.sin(y / 70 + i) * 3, y); ctx.stroke();
    }
  }, 256, 1024));
}
function screenTex(on) {
  return cachedTex('hyteScreen' + on, () => textTexture((ctx, W, H) => {
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, on ? '#1d2b64' : '#06070a'); gr.addColorStop(1, on ? '#0b0f1e' : '#030304'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    if (!on) return;
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 110px Segoe UI, Arial'; ctx.fillText('10:09', W / 2, 190); ctx.font = '38px Segoe UI'; ctx.fillStyle = '#9fb6ff'; ctx.fillText('TinHocLab', W / 2, 245);
    const g = (y, t, v, c) => { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(40, y, W - 80, 150); ctx.fillStyle = '#cfd8ff'; ctx.font = '32px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(t, 64, y + 48); ctx.fillStyle = c; ctx.font = 'bold 70px Segoe UI'; ctx.fillText(v, 64, y + 125); ctx.fillRect(W - 210, y + 110, 150 * Math.random() + 20, 12); };
    g(330, 'CPU', '42°C', '#5eead4'); g(510, 'GPU', '38°C', '#fca5a5'); g(690, 'FAN', '920 RPM', '#fde68a');
    for (let i = 0; i < 6; i++) { ctx.fillStyle = `hsl(${i * 55},90%,60%)`; ctx.beginPath(); ctx.arc(80 + i * 72, 940, 24, 0, 7); ctx.fill(); }
  }, 512, 1024));
}
export function caseModel(part) {
  part = { name: '', ...part };
  const st = { front: 'hex', dual: 0, tall: 0, frontFans: 3, bottomFans: 0, topFans: 0, legs: 'rubber', ...(CASE_STYLES[part.style] || (/o11/.test(part.id) ? CASE_STYLES.panorama : CASE_STYLES.airflow)) };
  const g = new THREE.Group();
  const c = part.color, lt = light(c);
  const T = 47.4 + st.tall; // chiều cao thân
  const zb = -11.2 - st.dual; // mặt sau (vỏ 2 buồng sâu hơn)
  const D = 11.4 - zb, zc = (11.4 + zb) / 2; // độ sâu thân
  const shell = mat(c, { metalness: 0.55, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.4 });
  const inner = mat(lt ? 0xe9ecef : 0x1d2024, { metalness: 0.45, roughness: 0.6, roughnessMap: grain() });
  const darkHole = mat(lt ? 0x9aa1a8 : 0x0a0b0c, { roughness: 0.9 });
  const fanOpt = { rgb: part.accent ?? null, frame: lt ? 0xf2f2f2 : 0x15171a, blade: lt ? 0xf5f5f5 : 0x1d1f24 };
  if (st.rgbFans && fanOpt.rgb === null) fanOpt.rgb = 0x8a5cf6;
  // ---- khay mainboard + vách sau ----
  g.add(box(44.2, 46, 0.35, inner, 0, 23, -10.75));
  g.add(box(45, T, 0.3, shell, 0, T / 2 - 0.7, zb, 0.2));
  const grom = RUBBER();
  [[5.6, 37, 1.3, 5.5], [5.6, 27, 1.3, 5.5], [5.6, 17.5, 1.3, 4.5], [-16, 12.2, 7, 1.2], [-4, 12.2, 5, 1.2]].forEach(([x, y, w, h]) => { g.add(box(w, h, 0.3, grom, x, y, -10.5, Math.min(w, h) / 2 - 0.05)); g.add(box(w - 0.5, h - 0.5, 0.05, mat(0x050505), x, y, -10.33, Math.min(w, h) / 2 - 0.3)); });
  g.add(box(12, 11, 0.05, darkHole, -11, 36.5, -10.56, 0.6));
  if (st.dual) { // khoang sau: chứa dây, nhìn thấy qua kính trước
    g.add(box(0.3, T - 1.4, st.dual - 0.6, inner, 22.2, T / 2 - 0.7, -11.2 - st.dual / 2));
  }
  // ---- nóc, đáy ----
  const topY = T - 0.8;
  const rTop = st.front === 'smooth' ? 0.3 : 0.25;
  g.add(box(45, 0.6, D, shell, 0, topY, zc, rTop));
  const top = perforated(30, Math.min(D - 7, 15), lt ? 0xdfe3e8 : 0x111316, 'round', [9, 4.5]); top.rotation.x = -Math.PI / 2; top.position.set(-4, topY + 0.32, zc - 0.5); g.add(top);
  g.add(box(45, 0.6, D, shell, 0, -0.3, zc, 0.25));
  // ---- mặt trước ----
  const fx = 23;
  if (st.front === 'glass' || st.front === 'glassrgb') {
    g.add(box(0.8, 1.2, D, shell, fx, T - 1.4, zc), box(0.8, 1.2, D, shell, fx, 0.6, zc));
    const fg = noPick(new THREE.Mesh(new THREE.PlaneGeometry(D - 0.4, T - 3), glassMat(st.front === 'glassrgb' ? 0x2a2d33 : 0x9fb2c4)));
    if (st.front === 'glassrgb') { fg.material = fg.material.clone(); fg.material.opacity = 0.32; }
    fg.rotation.y = Math.PI / 2; fg.position.set(23.45, T / 2 - 0.7, zc); fg.name = 'glass'; g.add(fg);
    if (!st.pillarless) g.add(box(0.8, T - 1.4, 0.8, shell, fx, T / 2 - 0.7, 11.0));
  } else if (st.front === 'wood') {
    g.add(box(0.8, T, D, shell, fx, T / 2 - 0.7, zc, 0.25));
    const fm = perforated(D - 2, T - 2.4, 0x0f1012, 'round', [8, 22]); fm.rotation.y = Math.PI / 2; fm.position.set(23.42, T / 2 - 0.7, zc); g.add(fm);
    const wm = new THREE.MeshStandardMaterial({ map: woodTex(lt), roughness: 0.62, metalness: 0 });
    for (let i = 0; i < 12; i++) { const s = box(0.9, T - 1.4, 1.05, wm, 24.0, T / 2 - 0.7, zb + 1.6 + i * ((D - 3.2) / 11), 0.2); g.add(s); }
  } else if (st.front === 'smooth') {
    // mặt trước liền khối bo cong, khe gió 2 bên
    const sm = mat(c, { metalness: 0.15, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    g.add(box(2.6, T, D - 5.2, sm, 22.9, T / 2 - 0.7, zc, 1.25));
    [zc - D / 2 + 1.4, zc + D / 2 - 1.4].forEach((z) => { const v = perforated(2.2, T - 3, lt ? 0xd5d8dc : 0x0e0f11, 'round', [1, 26]); v.rotation.y = Math.PI / 2; v.position.set(23.6, T / 2 - 0.7, z); g.add(v); g.add(box(1.6, T - 2, 0.25, sm, 22.5, T / 2 - 0.7, z + (z < zc ? -1.2 : 1.2), 0.1)); });
    g.add(label(10, 1.4, simpleText([{ t: (part.brand || '').toUpperCase(), font: 'bold 64px Segoe UI, Arial', color: lt ? '#9aa0a6' : '#cfd3d8' }], {}, 512, 80), 24.22, 4, zc, [0, Math.PI / 2, 0]));
  } else {
    g.add(box(0.8, T, D, shell, fx, T / 2 - 0.7, zc, 0.25));
    const fm = perforated(D - 1.8, T - 2.4, lt ? 0xe7eaee : 0x0f1012, 'hex', st.front === 'tri' ? [8, 18] : [11, 24], { metalness: 0.3, roughness: 0.6 }); fm.rotation.y = Math.PI / 2; fm.position.set(23.45, T / 2 - 0.7, zc); g.add(fm);
    g.add(box(0.3, T - 1.4, 0.6, shell, 23.45, T / 2 - 0.7, zc + D / 2 - 0.8), box(0.3, T - 1.4, 0.6, shell, 23.45, T / 2 - 0.7, zc - D / 2 + 0.8));
    if (st.front === 'slat') { // nan chéo kiểu Corsair 3200D / Phanteks XT
      const sm = mat(c, { metalness: 0.4, roughness: 0.45 });
      for (let i = 0; i < 16; i++) { const s = box(0.5, 4.2, 0.35, sm, 23.85, 2.5 + i * ((T - 5) / 15), zc, 0.1); s.rotation.x = 0.5; s.scale.y = 1; const s2 = s.clone(); s.position.z = zc - D / 4; s2.position.z = zc + D / 4; s2.rotation.x = -0.5; g.add(s, s2); }
    }
    if (st.front === 'tri') { // khung tam giác nhô ra (kiểu Montech X3)
      const sm = mat(c, { metalness: 0.4, roughness: 0.45 });
      for (let i = 0; i < 5; i++) { const y = 5 + i * ((T - 10) / 4); g.add(box(0.6, 0.45, D - 3, sm, 23.9, y, zc, 0.1)); }
    }
  }
  // ---- mặt sau ----
  const back = mat(c, { metalness: 0.6, roughness: 0.45 });
  g.add(box(0.5, 9, D, back, -22.45, 42.2, zc), box(0.5, 13, 9.6, back, -22.45, 31.5, -6.2), box(0.5, 21, D, back, -22.45, 10.5, zc));
  if (st.dual) g.add(box(0.5, 13, st.dual + 1.4, back, -22.45, 31.5, -11.2 - st.dual / 2 + 0.2));
  if (st.tall) g.add(box(0.5, st.tall, D, back, -22.45, 46.4 + st.tall / 2, zc));
  const rh = perforated(13, 13, lt ? 0xd9dde1 : 0x121315, 'hex', [6, 6]); rh.rotation.y = -Math.PI / 2; rh.position.set(-22.72, 37.5, 4.2); g.add(rh);
  const slotTex = cachedTex('slotvent', () => textTexture((ctx, W, H) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#000'; for (let x = 10; x < W - 10; x += 16) ctx.fillRect(x, 8, 8, H - 16); }, 256, 32, { srgb: false }));
  for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 1.5), new THREE.MeshStandardMaterial({ color: lt ? 0xd4d8dc : 0x1b1c1f, metalness: 0.7, roughness: 0.4, alphaMap: slotTex, alphaTest: 0.5, side: THREE.DoubleSide })); p.rotation.y = -Math.PI / 2; p.position.set(-22.3, 28.4 - i * 2.03, 2.8); g.add(p); }
  g.add(box(0.35, 15, 0.8, back, -22.4, 22.4, -3.4));
  g.add(box(0.1, 10.2, 2.6, mat(0x050505), -22.72, 38.6, -8.0));
  // ---- khung + kính hông ----
  const edge = mat(c, { metalness: 0.6, roughness: 0.35 });
  g.add(box(45, 0.7, 0.7, edge, 0, T - 1.1, 11.0), box(45, 0.7, 0.7, edge, 0, -0.1, 11.0), box(0.7, T - 0.4, 0.7, edge, -22.4, T / 2 - 0.7, 11.0));
  if (!st.pillarless) g.add(box(0.7, T - 0.4, 0.7, edge, 22.9, T / 2 - 0.7, 11.0));
  const gl = noPick(new THREE.Mesh(new THREE.PlaneGeometry(44.6, T - 0.8), glassMat())); gl.position.set(0.2, T / 2 - 0.7, 11.42); gl.name = 'glass'; g.add(gl);
  const glFrame = noPick(new THREE.Mesh(new THREE.PlaneGeometry(44.6, T - 0.8), new THREE.MeshBasicMaterial({ map: cachedTex('glassedge' + (st.pillarless ? 'p' : ''), () => textTexture((ctx, W, H) => { ctx.clearRect(0, 0, W, H); ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 14; if (st.pillarless) { ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(0, 0); ctx.lineTo(0, H); ctx.lineTo(W, H); ctx.stroke(); } else ctx.strokeRect(0, 0, W, H); }, 512, 512)), transparent: true, depthWrite: false })));
  glFrame.position.set(0.2, T / 2 - 0.7, 11.44); glFrame.name = 'glass'; g.add(glFrame);
  // ---- tấm che nguồn ----
  const shroud = mat(lt ? 0xe4e7ea : 0x18191c, { metalness: 0.5, roughness: 0.5 });
  g.add(box(29, 0.35, 20.4, shroud, -7.6, 10.2, 0.4));
  const sf = perforated(28.6, 9.6, lt ? 0xe4e7ea : 0x18191c, 'round', [16, 5.4], { metalness: 0.5, roughness: 0.5 }); sf.position.set(-7.6, 5.2, 10.6); g.add(sf);
  g.add(box(0.35, 10, 20.4, shroud, 6.9, 5.1, 0.4));
  g.add(label(8, 1.6, simpleText([{ t: (part.brand || part.name.split(' ')[0]).toUpperCase(), font: 'bold 72px Segoe UI, Arial', color: lt ? '#40444a' : '#e8e8e8' }], {}, 512, 100), -7.6, 10.39, 6.8, [-Math.PI / 2, 0, 0]));
  [[-2, 6.5], [0.5, 1.5], [-12, 4]].forEach(([x, z]) => g.add(box(4.2, 0.1, 2.2, mat(0x050505), x, 10.39, z, 0.5)));
  // ---- nút nguồn, cổng USB ----
  const btn = cyl(0.9, 0.5, mat(0x222326, { metalness: 0.7, roughness: 0.3 }), 18.5, topY + 0.5, 7.5); btn.name = 'powerButton';
  const led = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.1, 8, 40), new THREE.MeshStandardMaterial({ color: 0x9adfff, emissive: 0x000000 }));
  led.rotation.x = Math.PI / 2; led.position.set(18.5, topY + 0.76, 7.5); led.name = 'powerLed';
  g.add(btn, led);
  g.add(box(1.2, 0.2, 0.5, mat(0x0a0a0a), 15.8, topY + 0.36, 7.5, 0.1), box(0.9, 0.2, 0.35, mat(0x0a0a0a), 14.2, topY + 0.36, 7.5, 0.15), cyl(0.2, 0.1, mat(0x0a0a0a), 12.8, topY + 0.35, 7.5, 'y', 12));
  // ---- chân đế ----
  if (st.legs === 'rail') [zb + 2, 9.4].forEach((z) => g.add(box(42, 1.2, 1.8, mat(lt ? 0xd8dbdf : 0x111214, { metalness: 0.6, roughness: 0.35 }), 0, -1.25, z, 0.4)));
  else if (st.legs === 'post') [[-19, zb + 3], [-19, 8.5], [19, zb + 3], [19, 8.5]].forEach(([x, z]) => g.add(cyl(0.9, 1.2, mat(st.front === 'wood' ? 0x5b3a22 : 0x2a2b2e, { metalness: st.front === 'wood' ? 0 : 0.7, roughness: 0.4, ...(st.front === 'wood' ? { map: woodTex(lt) } : {}) }), x, -1.25, z, 'y', 20)));
  else [[-19, zb + 3.2], [-19, 8], [19, zb + 3.2], [19, 8]].forEach(([x, z]) => g.add(box(5, 1.2, 2.4, RUBBER(), x, -1.25, z, 0.5)));
  // ---- quạt ----
  const F = (rx, ry, x, y, z) => { const f = fan(12, fanOpt); f.rotation.set(rx, ry, 0); f.position.set(x, y, z); g.add(f); };
  [36.5, 23.3, 10.2].slice(0, st.frontFans).forEach((y) => F(0, -Math.PI / 2, 21.0, y, -0.5));
  F(0, Math.PI / 2, -21.0, 37.5, 4.2); // quạt sau
  if (st.bottomFans) [-14, -1.5, 11].slice(0, st.bottomFans).forEach((x) => F(-Math.PI / 2, 0, x, 11.75, 0.5)); // quạt đáy hút lên
  if (st.topFans) [-12, 1, 14].slice(0, st.topFans).forEach((x) => F(Math.PI / 2, 0, x, topY - 1.4, 0.5));
  // vòng LED nổi trên mặt kính trước (vỏ giá rẻ)
  if (st.front === 'glassrgb') [36.5, 23.3, 10.2].forEach((y, i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(5.4, 0.22, 10, 60), new THREE.MeshStandardMaterial({ color: 0x3a3a3e, emissive: [0xff2d55, 0x34c759, 0x0a84ff][i], emissiveIntensity: 0.35 })); r.rotation.y = Math.PI / 2; r.position.set(22.4, y, -0.5); r.name = 'rgb'; g.add(r); });
  // ---- màn hình cảm ứng (HYTE Y70 Touch) ở mặt trước buồng sau ----
  if (st.screen) {
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(st.dual - 1, T - 4), new THREE.MeshStandardMaterial({ map: screenTex(true), emissive: 0xffffff, emissiveMap: screenTex(true), emissiveIntensity: 0.55, roughness: 0.2 }));
    sc.rotation.y = Math.PI / 2; sc.position.set(23.5, T / 2 - 0.7, -11.2 - st.dual / 2 + 0.2); g.add(sc);
  }
  // ---- lồng ổ cứng ----
  const cage = mat(lt ? 0xd0d5da : 0x2b2e33, { metalness: 0.65, roughness: 0.4 });
  g.add(box(13.4, 9, 0.3, cage, 13.2, 4.8, -7.6), box(13.4, 9, 0.3, cage, 13.2, 4.8, 3.9), box(13.4, 0.3, 11.8, cage, 13.2, 9.2, -1.85));
  g.add(box(13.4, 0.2, 0.8, cage, 13.2, 3.4, -7.1), box(13.4, 0.2, 0.8, cage, 13.2, 3.4, 3.4));
  if (part.accent != null) { const sl = new THREE.Mesh(new THREE.BoxGeometry(0.25, T - 5.4, 0.25), new THREE.MeshStandardMaterial({ color: 0x3a3a3e, emissive: part.accent, emissiveIntensity: 0.25 })); sl.position.set(22.3, T / 2, 10.3); sl.name = 'rgb'; g.add(sl); }
  g.userData.style = st;
  return g;
}

// ======================= Mainboard (gốc góc trên-trái, mặt linh kiện hướng +z) =======================
// Mỗi mẫu = 1 ảnh chụp thật đã nắn phẳng đúng kích thước (cm). Toạ độ [x, y] tính từ góc trên-trái, y hướng xuống.
// relief: [x, y, w, h, cao, kiểu] – khối nổi phủ ảnh (tản nhiệt, khe RAM/PCIe, đầu nguồn...) để có chiều sâu thật.
const RAMS = (xs, y0, y1) => xs.map((x) => [x - 0.32, y0, 0.64, y1 - y0, 0.85, 'p']);
const MB_TPL = {
  z690: { form: 'ATX', sock: 'LGA1700', cpu: [13.6, 8.6], sockBox: [5.4, 7.2], ram: [20.6, 9.0], pitch: 0.97, gpu: [4.2, 18.0], p24: [23.7, 7.3], p8: [5.0, 0.5], m2: [8.2, 19.9, 0.5], fp: [20.5, 29.7], sata: [23.8, 21.0],
    relief: [[0, 0, 8.2, 15.0, 2.6, 'm'], [8.0, 0.3, 10.2, 3.6, 2.0, 'm'], [4.0, 0, 2.0, 0.9, 1.2, 'p'], [6.1, 0, 2.0, 0.9, 1.2, 'p'], [23.1, 4.7, 1.2, 5.3, 1.2, 'p'],
      ...RAMS([18.6, 19.6, 20.6, 21.55], 2.1, 15.9), [4.2, 17.6, 12.2, 0.85, 1.1, 'p'], [0.3, 15.2, 17.4, 2.1, 0.7, 'm'],
      [11.4, 16.1, 12.7, 5.7, 0.8, 'm'], [6.8, 21.8, 17.3, 3.3, 0.7, 'm'], [2.5, 25.1, 21.6, 2.6, 0.7, 'm']] },
  z390: { form: 'ATX', sock: 'LGA1151', cpu: [12.9, 8.4], sockBox: [4.6, 5.8], ram: [20.4, 8.1], pitch: 0.98, gpu: [4.0, 17.7], p24: [23.6, 8.6], p8: [5.0, 0.5], m2: [12.0, 15.8, 0.5], fp: [20.5, 29.8], sata: [23.8, 20.5],
    relief: [[0, 0, 5.6, 12.5, 2.6, 'm'], [5.4, 0, 8.0, 2.6, 2.0, 'm'], [4.6, 2.6, 2.8, 9.0, 2.0, 'm'], [4.2, 0, 1.7, 0.9, 1.2, 'p'], [23.0, 6.0, 1.2, 5.3, 1.2, 'p'],
      ...RAMS([18.4, 19.4, 20.4, 21.35], 0.9, 15.3), [4.0, 17.3, 8.9, 0.85, 1.1, 'p'], [4.0, 23.6, 8.9, 0.85, 1.1, 'p'],
      [14.6, 17.3, 7.9, 8.1, 0.9, 'm'], [8.6, 25.4, 13.9, 1.8, 0.6, 'm']] },
  b550: { form: 'ATX', sock: 'AM4', cpu: [12.3, 9.6], sockBox: [4.4, 4.9], ram: [20.35, 9.4], pitch: 1.02, gpu: [3.7, 18.9], p24: [23.6, 10.1], p8: [3.9, 0.6], m2: [9.3, 16.75, 1.05], fp: [20.5, 29.8], sata: [23.8, 22.5],
    relief: [[0, 0, 6.9, 14.4, 2.6, 'm'], [6.9, 0, 9.7, 2.6, 2.2, 'm'], [3.0, 0, 1.9, 1.1, 1.2, 'p'], [23.0, 7.4, 1.2, 5.4, 1.2, 'p'],
      ...RAMS([18.3, 19.3, 20.4, 21.4], 2.2, 16.6), [3.3, 15.8, 11.9, 1.9, 0.8, 'm'], [3.7, 18.45, 9.2, 0.9, 1.1, 'p'], [3.9, 24.7, 9.0, 0.85, 1.1, 'p'],
      [14.0, 20.0, 9.3, 6.1, 0.9, 'm']] },
  ab350: { form: 'mATX', sock: 'AM4', cpu: [12.6, 8.4], sockBox: [4.4, 4.9], ram: [20.4, 8.1], pitch: 1.0, gpu: [5.3, 18.4], p24: [23.7, 9.1], p8: [5.3, 2.0], m2: [10.4, 15.6, 0.5], fp: [20.5, 23.7], sata: [23.8, 19.5],
    relief: [[0, 0, 4.2, 15.5, 3.0, 'p'], [4.7, 3.1, 3.7, 7.5, 2.4, 'm'], [4.7, 1.4, 1.3, 1.3, 1.2, 'p'], [23.2, 6.4, 1.2, 5.4, 1.2, 'p'],
      ...RAMS([18.4, 19.4, 20.4, 21.4], 0.7, 15.5), [18.0, 17.1, 4.8, 3.8, 1.0, 'm'], [5.3, 18.0, 10.2, 0.85, 1.1, 'p'], [5.3, 22.0, 10.2, 0.85, 1.1, 'p']] },
};
export function boardTemplate(part) {
  if (part.form !== 'ATX') return 'ab350';
  if (/TOMAHAWK/i.test(part.label || part.name)) return 'b550';
  if (/ROG/i.test(part.label || part.name)) return 'z390';
  return 'z690';
}
// Socket thật đặt chồng lên ảnh khi socket của mẫu ảnh khác socket của mainboard đang chọn
const SOCK_PHOTO = { LGA1700: ['sock_lga1700.jpg', 5.4, 7.2], LGA1851: ['sock_lga1700.jpg', 5.4, 7.2], AM5: ['sock_am5.jpg', 6.0, 7.3] };
export function motherboardModel(part) {
  part = { name: '', ...part };
  const key = boardTemplate(part), T = MB_TPL[key];
  const g = new THREE.Group();
  const H = boardH(part.form), W = BOARD_W, rect = [0, 0, W, H];
  const map = photo(`mb_${key}.jpg`);
  const nrm = TEX_OPTS.small ? null : photo(`mb_${key}_n.jpg`, { srgb: false });
  const pcbM = new THREE.MeshStandardMaterial({ color: 0xb4b4b4, map, normalMap: nrm, normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.68, metalness: 0.05, envMapIntensity: 0.6 });
  const metM = new THREE.MeshStandardMaterial({ color: 0xb8b8b8, map, normalMap: nrm, normalScale: new THREE.Vector2(0.35, 0.35), roughness: 0.5, metalness: 0.3, envMapIntensity: 0.7 });
  const plM = new THREE.MeshStandardMaterial({ color: 0xb4b4b4, map, roughness: 0.6, metalness: 0.05, envMapIntensity: 0.6 });
  // tấm mạch: mặt trên là ảnh thật, mép và mặt dưới màu PCB
  const edge = PCB(0x141518);
  const pcb = reliefBox(0, 0, W, H, 0.16, [edge, edge, edge, edge, pcbM, edge], rect, 0, 0);
  g.add(pcb);
  T.relief.forEach(([x, y, w, h, d, k]) => g.add(reliefBox(x, y, w, h, d, k === 'm' ? metM : plM, rect, 0.16)));
  // socket: dùng ảnh socket thật nếu khác loại, nếu cùng loại thì nổi khối socket trên ảnh
  const [cx, cy] = T.cpu;
  const need = part.socket && part.socket !== T.sock && !(T.sock === 'LGA1700' && part.socket === 'LGA1851');
  if (need && SOCK_PHOTO[part.socket]) {
    const [img, sw, sh] = SOCK_PHOTO[part.socket];
    // che vùng socket cũ của ảnh bằng màu PCB
    g.add(box(Math.max(sw, T.sockBox[0] + 0.6), Math.max(sh, T.sockBox[1] + 0.6), 0.03, PCB(0x17181b), cx, -cy, 0.175));
    const sm = new THREE.MeshStandardMaterial({ map: photo(img), roughness: 0.38, metalness: 0.55 });
    const sb = reliefBox(cx - sw / 2, cy - sh / 2, sw, sh, 0.3, sm, [cx - sw / 2, -(cy - sh / 2), sw, sh], 0.16, 0.05); g.add(sb);
    // cần gạt
    g.add(cyl(0.07, sh * 0.82, NICKEL(), cx + sw / 2 + 0.25, -cy, 0.38, 'y', 10));
  } else g.add(reliefBox(cx - T.sockBox[0] / 2, cy - T.sockBox[1] / 2, T.sockBox[0], T.sockBox[1], 0.3, plM, rect, 0.16, 0.05));
  const v = (x, y, z) => new THREE.Vector3(x, -y, z);
  g.userData.anchors = {
    cpu: v(cx, cy, 0.46), ram: v(T.ram[0], T.ram[1], 1.06), m2: v(T.m2[0], T.m2[1], T.m2[2]), gpu: v(T.gpu[0], T.gpu[1], 1.26),
    'c-24pin': v(T.p24[0], T.p24[1], 1.4), 'c-cpu8': v(T.p8[0], T.p8[1], 1.4), 'c-fp': v(T.fp[0], T.fp[1], 1.0), 'c-sata-mb': v(T.sata[0], T.sata[1], 1.0),
  };
  g.userData.ramPitch = T.pitch;
  g.userData.template = key;
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
// Ảnh chụp thật của CPU; dòng tên mẫu được xoá khỏi ảnh và vẽ lại đúng CPU đang chọn.
function cpuTexture(part, intel) {
  return photoDraw(intel ? 'cpu_intel.jpg' : 'cpu_amd.jpg', part.id || part.name, (ctx, W, H) => {
    if (intel) {
      const n = part.name.replace(/^Intel /, ''); const ultra = /Ultra/.test(n);
      const tier = ultra ? 'ULTRA ' + (n.match(/Ultra (\d)/) || ['', '5'])[1] : (n.match(/i\d/) || ['i5'])[0];
      const model = ultra ? n.replace(/Core Ultra \d /, '') : n.replace(/Core /, '');
      ctx.fillStyle = 'rgba(52,56,62,.88)'; ctx.font = `bold ${Math.round(W * 0.046)}px "Roboto Mono", monospace`;
      ctx.fillText('INTEL® CORE™ ' + tier, W * 0.262, H * 0.293); ctx.fillText(model, W * 0.262, H * 0.358);
    } else {
      ctx.fillStyle = 'rgba(48,50,54,.85)'; ctx.font = `italic bold ${Math.round(W * 0.06)}px Arial, sans-serif`;
      ctx.fillText(part.name.replace(/Ryzen (\d) /, 'Ryzen $1 '), W * 0.175, H * 0.168);
    }
  }, 512);
}
export function cpuModel(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const intel = part.brand === 'intel';
  const am5 = part.socket === 'AM5';
  const w = intel ? 3.75 : 4.0, h = intel ? 4.5 : 4.0;
  const rect = [-w / 2, h / 2, w, h];
  const tex = cpuTexture(part, intel);
  const subM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.15 });
  const ihsM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.34, metalness: 0.85, roughnessMap: brushed() });
  // đế (substrate) – cả mặt trên là ảnh thật
  const sub = new THREE.Mesh(planarUV(new THREE.BoxGeometry(w, h, 0.14), 0, 0, rect), subM); sub.position.z = 0.07; sub.castShadow = sub.receiveShadow = true; g.add(sub);
  // nắp IHS nổi lên, cùng ảnh chiếu phẳng nên chữ/logo nằm đúng chỗ
  const s = new THREE.Shape();
  if (intel) { const a = 1.45, b = 2.06, e = 0.13, q = 0.56; s.moveTo(-a, -b); s.lineTo(a, -b); s.lineTo(a, -q); s.lineTo(a + e, -q); s.lineTo(a + e, q); s.lineTo(a, q); s.lineTo(a, b); s.lineTo(-a, b); s.lineTo(-a, q); s.lineTo(-a - e, q); s.lineTo(-a - e, -q); s.lineTo(-a, -q); s.lineTo(-a, -b); }
  else if (am5) { const a = 1.7; s.moveTo(-a, -a); [[-0.9, -a], [-0.9, -1.95], [-0.45, -1.95], [-0.45, -a], [0.45, -a], [0.45, -1.95], [0.9, -1.95], [0.9, -a], [a, -a], [a, -0.9], [1.95, -0.9], [1.95, -0.45], [a, -0.45], [a, 0.45], [1.95, 0.45], [1.95, 0.9], [a, 0.9], [a, a], [0.9, a], [0.9, 1.95], [0.45, 1.95], [0.45, a], [-0.45, a], [-0.45, 1.95], [-0.9, 1.95], [-0.9, a], [-a, a], [-a, 0.9], [-1.95, 0.9], [-1.95, 0.45], [-a, 0.45], [-a, -0.45], [-1.95, -0.45], [-1.95, -0.9], [-a, -0.9], [-a, -a]].forEach(([x, y]) => s.lineTo(x, y)); }
  else { const r = 0.3, a = 1.82; s.moveTo(-a + r, -a); s.lineTo(a - r, -a); s.quadraticCurveTo(a, -a, a, -a + r); s.lineTo(a, a - r); s.quadraticCurveTo(a, a, a - r, a); s.lineTo(-a + r, a); s.quadraticCurveTo(-a, a, -a, a - r); s.lineTo(-a, -a + r); s.quadraticCurveTo(-a, -a, -a + r, -a); }
  if (intel || !am5) {
    const ig = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 8 });
    planarUV(ig, 0, 0, rect); const ihs = new THREE.Mesh(ig, ihsM); ihs.position.z = 0.15; ihs.castShadow = ihs.receiveShadow = true; g.add(ihs);
  } else {
    // AM5: nắp "bạch tuộc", mặt trên dùng phần kim loại của ảnh Ryzen
    const ig = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
    planarUV(ig, 0, 0, [-2.05, 2.05, 4.1, 4.1]); const ihs = new THREE.Mesh(ig, ihsM); ihs.position.z = 0.15; ihs.castShadow = true; g.add(ihs);
    g.add(instances(new THREE.BoxGeometry(0.28, 0.16, 0.04), mat(0x9a7b3a, { metalness: 0.6, roughness: 0.4 }), [[-0.68, -1.83, 0.16], [0.68, -1.83, 0.16], [-0.68, 1.83, 0.16], [0.68, 1.83, 0.16]]));
  }
  // tam giác đánh dấu chân số 1 (căn đúng với dấu trên socket)
  const tri = new THREE.Mesh(new THREE.CircleGeometry(0.2, 3), GOLD()); tri.rotation.z = Math.PI / 4; tri.position.set(-w / 2 + 0.28, -h / 2 + 0.28, 0.146); g.add(tri);
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
    const pm = new THREE.MeshStandardMaterial({ map: photo(ddr5 ? 'ram_ddr5.jpg' : 'ram_ddr4.jpg'), roughness: 0.5, metalness: 0.2 });
    const pcbG = new THREE.BoxGeometry(0.12, 13.3, 3.0); const pe = PCB(0x15412a);
    const pc = new THREE.Mesh(pcbG, [pm, pm, pe, pe, pe, pe]); pc.position.z = 1.5; pc.material[0].map.rotation = Math.PI / 2; pc.material[0].map.center.set(0.5, 0.5);
    s.add(pc);
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
  // ảnh SSD M.2 thật (mạch, chip, chân vàng) + tem nhãn vẽ lại theo đúng mẫu
  const t = photoDraw('m2.jpg', part.id || part.name, (ctx, W, H, img) => {
    ctx.save(); ctx.translate(W, H); ctx.rotate(Math.PI); ctx.drawImage(img, 0, 0, W, H); ctx.restore();
    const x0 = W * 0.17, y0 = H * 0.13, w = W * 0.8, h = H * 0.74;
    ctx.fillStyle = isSam ? '#0b0b0c' : isWD ? '#121212' : '#1a2440'; ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = isSam ? '#e0e0e0' : '#fff'; ctx.font = `bold ${H * 0.2}px Segoe UI, Arial`;
    ctx.fillText(isSam ? 'SAMSUNG' : isWD ? 'WD_BLACK' : (part.name.split(' ')[0] || '').toUpperCase(), x0 + W * 0.03, y0 + h * 0.36);
    ctx.font = `bold ${H * 0.15}px Segoe UI`; ctx.fillStyle = isWD ? '#cfcfcf' : '#9fd3ff';
    ctx.fillText((part.name.match(/\d{3,4}\s?(PRO|EVO|X|Plus)?/i) || [''])[0] + '  NVMe™ M.2', x0 + W * 0.03, y0 + h * 0.66);
    ctx.font = `${H * 0.1}px monospace`; ctx.fillStyle = '#9a9a9a';
    ctx.fillText((part.size >= 1000 ? part.size / 1000 + 'TB' : part.size + 'GB') + '  PCIe x4', x0 + W * 0.03, y0 + h * 0.9);
  }, 1024);
  g.add(label(8.0, 2.2, t, 0, 0, 0.085, null, { transparent: false, roughness: 0.5, metalness: 0.2 }));
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
  const face = (n, o = {}) => new THREE.MeshStandardMaterial({ map: photo(n), roughness: 0.55, metalness: 0.35, ...o });
  const black = mat(0x141518, { metalness: 0.5, roughness: 0.5, roughnessMap: grain() });
  // 6 mặt: +x cổng modular, -x ổ cắm AC + công tắc, +y nóc, -y quạt, +z mặt logo (hướng người xem), -z nhãn thông số
  const mats = [face('psu_modular.jpg'), face('psu_ac.jpg'), black, face('psu_fan.jpg'), face('psu_side.jpg'), face('psu_label.jpg')];
  const geo = new THREE.BoxGeometry(15, 8.6, 15);
  const m = new THREE.Mesh(geo, mats); m.castShadow = m.receiveShadow = true; g.add(m);
  // nhãn công suất/hiệu suất theo đúng mẫu đang chọn (dán ở nóc)
  const t = textTexture((ctx, W, H) => {
    ctx.fillStyle = '#121316'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 92px Segoe UI, Arial'; ctx.fillText((part.brand || part.name.split(' ')[0]).toUpperCase(), 40, 120);
    ctx.font = 'bold 150px Segoe UI'; ctx.fillText(part.watt + 'W', 40, 290);
    const effc = /PLATINUM/.test(part.eff) ? '#d9dde3' : /GOLD/.test(part.eff) ? '#e8c35a' : /TITANIUM/.test(part.eff) ? '#9fb2c8' : '#cd7f32';
    ctx.fillStyle = effc; ctx.beginPath(); ctx.arc(W - 150, 210, 100, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillText('80', W - 150, 190); ctx.font = 'bold 24px Arial'; ctx.fillText('PLUS', W - 150, 222); ctx.fillText((part.eff || '').replace('80 PLUS ', ''), W - 150, 252);
    ctx.textAlign = 'left'; ctx.fillStyle = '#9aa0a8'; ctx.font = '28px monospace'; ctx.fillText(part.name, 40, 380); ctx.fillText('+12V ' + Math.round(part.watt / 12) + 'A   +5V 22A   +3.3V 22A', 40, 425);
  }, 1024, 480);
  g.add(label(10.5, 4.9, t, 0, 4.31, 0, [-Math.PI / 2, 0, 0]));
  return g;
}
export const PSU_OUT = new THREE.Vector3(7.6, 2.5, 4);

// ======================= HDD 3.5" / SSD 2.5" =======================
export const HDD_POS = new THREE.Vector3(13.2, 4.8, -1.85);
export function hddModel(part) {
  part = { name: '', ...part };
  const g = new THREE.Group();
  const al = mat(0xaeb4bb, { metalness: 0.85, roughness: 0.4, roughnessMap: brushed() });
  const top = new THREE.MeshStandardMaterial({ map: photo('hdd_top.jpg'), roughness: 0.42, metalness: 0.55 });
  const bot = new THREE.MeshStandardMaterial({ map: photo('hdd_bottom.jpg'), roughness: 0.5, metalness: 0.3 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(14.7, 2.6, 10.2), [al, al, top, bot, al, al]); m.castShadow = m.receiveShadow = true; g.add(m);
  // dung lượng/hãng theo mẫu đang chọn
  g.add(label(3.2, 0.9, simpleText([{ t: (part.brand || '') + ' ' + (part.size >= 1000 ? part.size / 1000 + 'TB' : part.size + 'GB'), font: 'bold 64px Segoe UI, Arial', color: '#1b1b1b' }], { bg: '#f4f4f4' }, 512, 140), 3.6, 1.315, -2.6, [-Math.PI / 2, 0, 0]));
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
  g.add(sam ? label(9.9, 6.9, photo('ssd25.jpg'), 1.5, -0.44, 0, [-Math.PI / 2, 0, 0], { transparent: false, metalness: 0.4, roughness: 0.45 }) : label(7.6, 2.6, t, 1.5, -0.44, 0, [-Math.PI / 2, 0, 0]));
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
