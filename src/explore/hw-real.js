// Mô hình dựng bằng code theo kích thước và cấu tạo thật (mm) – thay cho bản dựng từ ảnh.
// Cách làm giống PC Anatomy: không dùng ảnh, mọi chi tiết là khối hình học + vân bề mặt vẽ bằng canvas.
import * as THREE from 'three';
import { mat, textTexture } from '../pcbuild/models.js';

const V = (x, y) => new THREE.Vector2(x, y);
// ---------- vật liệu ----------
const M = {
  gold: () => mat(0xd9b45a, { metalness: 1, roughness: 0.28 }),
  nickel: () => mat(0xc9ccd0, { metalness: 1, roughness: 0.22 }),
  steel: () => mat(0xaeb3b8, { metalness: 0.9, roughness: 0.38 }),
  tin: () => mat(0xdfe2e6, { metalness: 0.85, roughness: 0.3 }),
  black: () => mat(0x141517, { roughness: 0.55 }),
  matte: (c) => mat(c, { roughness: 0.7 }),
  plastic: (c) => mat(c, { roughness: 0.45 }),
  rubber: (c = 0x18191b) => mat(c, { roughness: 0.85 }),
  clear: () => new THREE.MeshPhysicalMaterial({ color: 0xf3f6f8, roughness: 0.08, transmission: 0.85, thickness: 1.2, ior: 1.46, transparent: true }),
};
// vân mạch in: phủ màu, đường mạch, lỗ via
function pcbTex(color = '#1b5e34', trace = 'rgba(120,200,140,.35)', seed = 1) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return textTexture((ctx, W, H) => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = trace; ctx.lineWidth = 2;
    for (let i = 0; i < 140; i++) {
      let x = rnd() * W, y = rnd() * H; ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k < 3; k++) { if (rnd() > 0.5) x += (rnd() - 0.5) * 160; else y += (rnd() - 0.5) * 160; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(230,200,120,.8)';
    for (let i = 0; i < 160; i++) { ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 2.2, 0, 7); ctx.fill(); }
  }, 1024, 1024);
}
const pcbMat = (color, trace, seed) => new THREE.MeshStandardMaterial({ map: pcbTex(color, trace, seed), roughness: 0.55, metalness: 0.1 });
function printTex(draw, w = 512, h = 256) { return textTexture(draw, w, h); }

// ---------- hình học ----------
function rrectPts(w, h, r, seg = 6) {
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001); const p = [];
  [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2], [-w / 2 + r, -h / 2 + r, Math.PI], [w / 2 - r, -h / 2 + r, Math.PI * 1.5]]
    .forEach(([cx, cy, a0]) => { for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * Math.PI / 2; p.push(V(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); } });
  return p;
}
const circlePts = (r, seg = 48) => Array.from({ length: seg }, (_, i) => V(Math.cos((i / seg) * Math.PI * 2) * r, Math.sin((i / seg) * Math.PI * 2) * r));
function ext(pts, depth, material, { holes = [], bevel = 0 } = {}) {
  const s = new THREE.Shape(pts); holes.forEach((h) => s.holes.push(new THREE.Path(h)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 16 });
  const m = new THREE.Mesh(g, material); m.castShadow = m.receiveShadow = true; return m;
}
function rbox(w, h, d, material, x = 0, y = 0, z = 0, r = 0.2) {
  const m = ext(rrectPts(w, h, r), Math.max(0.01, d - 2 * Math.min(r, d / 2.2)), material, { bevel: Math.min(r, d / 2.2) });
  m.geometry.translate(0, 0, -(d - 2 * Math.min(r, d / 2.2)) / 2); m.position.set(x, y, z); return m;
}
function blk(w, h, d, material, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; }
function cyl(r, h, material, x = 0, y = 0, z = 0, axis = 'y', seg = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material); m.position.set(x, y, z);
  if (axis === 'x') m.rotation.z = Math.PI / 2; if (axis === 'z') m.rotation.x = Math.PI / 2; m.castShadow = m.receiveShadow = true; return m;
}
// mặt phẳng in chữ/nhãn
function decal(w, h, tex, x, y, z, rot = [0, 0, 0], extra = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, ...extra }));
  m.position.set(x, y, z); m.rotation.set(...rot); return m;
}
// chip IC (đen, chữ khắc mờ)
function chip(w, d, h, text, sub = '') {
  const g = new THREE.Group();
  g.add(rbox(w, d, h, mat(0x1a1b1d, { roughness: 0.6 }), 0, 0, h / 2, 0.15));
  g.add(decal(w * 0.85, d * 0.6, printTex((c, W, H) => { c.fillStyle = 'rgba(200,200,205,.75)'; c.font = `bold ${H * 0.32}px Arial`; c.textAlign = 'center'; c.fillText(text, W / 2, H * 0.45); c.font = `${H * 0.2}px monospace`; c.fillText(sub, W / 2, H * 0.78); }, 256, 128), 0, 0, h + 0.01));
  return g;
}
// cạnh tiếp xúc mạ vàng: count chân, bước pitch
function goldEdge(count, pitch, w, h, z, keyAt = -1) {
  const g = new THREE.Group(); const gm = M.gold();
  for (let i = 0; i < count; i++) { if (i === keyAt) continue; g.add(blk(w, h, 0.04, gm, (i - (count - 1) / 2) * pitch, 0, z)); }
  return g;
}
// dây cáp cong
function cable(points, r, material) {
  const c = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 40, r, 14, false), material);
  c.castShadow = true; return c;
}
// thân nhựa bọc đầu cắm (overmold) có gân bóp + đuôi chống gãy dây
function overmold(w, h, len, color, cableR, { grip = true, tail = 9 } = {}) {
  const g = new THREE.Group(); const pm = M.plastic(color);
  g.add(rbox(w, h, len, pm, 0, 0, -len / 2, Math.min(w, h) * 0.3));
  if (grip) for (let i = 0; i < 5; i++) g.add(rbox(w * 0.7, 0.35, 0.8, M.matte(color), 0, h / 2, -len * 0.35 - i * 1.6, 0.15));
  // đuôi thon dần
  const tg = new THREE.CylinderGeometry(cableR * 1.25, Math.min(w, h) * 0.42, tail, 24); const t = new THREE.Mesh(tg, pm); t.rotation.x = -Math.PI / 2; t.position.z = -len - tail / 2 + 0.5; g.add(t);
  g.add(cable([[0, 0, -len - tail + 1], [0, 0, -len - tail - 10], [2, -3, -len - tail - 22], [6, -9, -len - tail - 30]], cableR, M.rubber(color)));
  return g;
}
// tấm panel máy (mặt sau case/laptop) có lỗ cổng
function panel(w, h, hole, depth = 1) {
  const g = new THREE.Group();
  g.add(ext(rrectPts(w, h, 1.5), depth, mat(0x2a2c30, { metalness: 0.6, roughness: 0.45 }), { holes: [hole] }));
  return g;
}
function pair(plug, port, gap = 26) {
  const g = new THREE.Group(); plug.rotation.y = 0.55; plug.position.x = -gap * 0.8; port.rotation.y = -0.35; port.position.x = gap * 0.8; g.add(plug, port); return g;
}

// ======================= Thẻ nhớ SD + microSD =======================
function sdShape(w = 24, h = 32, c = 4) { return [V(w / 2, -h / 2), V(w / 2, h / 2 - c), V(w / 2 - c, h / 2), V(-w / 2, h / 2), V(-w / 2, -h / 2)]; }
function sdcard() {
  const g = new THREE.Group();
  // thẻ SD 24×32×2,1 mm – góc vát trên phải, rãnh khoá ghi bên trái
  const sd = new THREE.Group();
  sd.add(ext(sdShape(), 2.1, M.plastic(0x1c1d21), { bevel: 0 }));
  sd.add(blk(1.0, 6, 1.4, M.plastic(0x1c1d21), -12.5, 4, 0.7)); // gờ rãnh
  const lock = blk(1.2, 2.2, 1.2, M.plastic(0xf2f2f2), -12.6, 6.5, 1.05); sd.add(lock); // lẫy khoá ghi
  const lab = printTex((c, W, H) => {
    const gr = c.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#c0161c'); gr.addColorStop(1, '#5c0a0d'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = '#fff'; c.font = 'bold 120px Arial'; c.fillText('128', 30, 190); c.font = 'bold 54px Arial'; c.fillText('GB', 250, 190);
    c.font = 'bold 44px Arial'; c.fillText('SDXC', 30, 70); c.fillStyle = '#ffd34d'; c.fillText('Extreme', 160, 70);
    c.fillStyle = '#fff'; c.font = 'bold 40px Arial'; c.fillText('U3  V30  A2', 30, 300); c.font = '30px Arial'; c.fillText('UHS-I  ·  170 MB/s', 30, 350);
    c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.arc(W - 70, 310, 28, 0, 7); c.stroke(); c.font = 'bold 34px Arial'; c.fillText('3', W - 80, 322);
  }, 360, 420);
  sd.add(decal(20.5, 24, lab, 0.2, -2.6, 2.11));
  // mặt sau: 9 chân tiếp xúc trong rãnh
  const back = new THREE.Group();
  [-9.5, -7, -4.6, -2.2, 0.3, 2.8, 5.3, 7.8].forEach((x, i) => { back.add(blk(1.7, 3.6, 0.05, M.gold(), x, 12.6, -0.03)); back.add(blk(0.5, 4, 0.3, M.plastic(0x1c1d21), x + 1.25, 12.4, -0.1)); });
  back.add(blk(1.4, 3.6, 0.05, M.gold(), 9.9, 11.6, -0.03));
  sd.add(back);
  sd.position.x = -10;
  // microSD 11×15×1 mm – bậc lõm một bên
  const ms = new THREE.Group();
  const mpts = [V(5.5, -7.5), V(5.5, 6.4), V(4.6, 7.5), V(-5.5, 7.5), V(-5.5, 1.4), V(-4.6, 0.9), V(-4.6, -0.2), V(-5.5, -0.7), V(-5.5, -7.5)];
  ms.add(ext(mpts, 1.0, M.plastic(0x18191b)));
  ms.add(decal(9.4, 7.5, printTex((c, W, H) => { c.fillStyle = '#d61f26'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; c.font = 'bold 90px Arial'; c.fillText('64', 20, 120); c.font = 'bold 36px Arial'; c.fillText('microSD XC', 20, 200); c.fillText('U3 A1 V30', 20, 250); }, 300, 280), 0, -3, 1.01));
  for (let i = 0; i < 8; i++) ms.add(blk(0.8, 3.4, 0.04, M.gold(), -3.8 + i * 1.1, 4.6, -0.02));
  ms.position.set(13, -8.5, 0);
  g.add(sd, ms);
  g.rotation.x = -0.25;
  return g;
}

// ======================= USB flash =======================
function usbFlash() {
  const g = new THREE.Group();
  const body = M.plastic(0x1f8fd6);
  g.add(rbox(18, 7.5, 40, body, 0, 0, -20, 3));
  g.add(rbox(18.4, 7.9, 6, M.plastic(0x15181c), 0, 0, -1, 2)); // vòng cổ
  g.add(cyl(2.2, 8.2, M.plastic(0x15181c), 0, 0, -36, 'y', 24));
  const hole = cyl(1.3, 8.4, M.black(), 0, 0, -36, 'y', 20); g.add(hole);
  g.add(decal(12, 6, printTex((c, W, H) => { c.fillStyle = '#fff'; c.font = 'bold 110px Arial'; c.fillText('64GB', 30, 140); c.font = 'bold 50px Arial'; c.fillText('USB 3.2', 40, 210); }, 400, 240), 0, 3.76, -20, [-Math.PI / 2, 0, Math.PI]));
  g.add(cyl(0.7, 0.2, mat(0x8ff5a0, { emissive: 0x22c55e, emissiveIntensity: 0.8 }), 5.5, 3.78, -6, 'y', 12)); // đèn LED
  // đầu USB-A: vỏ thép 12×4,5×12 mm, 2 lỗ vuông, lưỡi nhựa xanh + 4 chân vàng (USB 3: thêm 5 chân)
  const sh = ext(rrectPts(12, 4.5, 0.35), 12, M.nickel(), { holes: [rrectPts(11.2, 3.7, 0.25)] }); g.add(sh);
  [[-3, 2.26], [3, 2.26], [-3, -2.26], [3, -2.26]].forEach(([x, y]) => g.add(blk(2.4, 0.06, 2.4, M.black(), x, y, 8.5)));
  g.add(blk(11, 1.9, 11.4, M.plastic(0x1e63d6), 0, -0.85, 5.8));
  for (let i = 0; i < 4; i++) g.add(blk(1, 0.06, 4, M.gold(), -3 + i * 2, 0.13, 9.2));
  for (let i = 0; i < 5; i++) g.add(blk(0.7, 0.06, 2.2, M.gold(), -3.6 + i * 1.8, 0.13, 6.4));
  g.rotation.y = 0.7;
  return g;
}

// ======================= Card mạng PCIe (2 cổng RJ45) =======================
function rj45Jack(withLeds = true) {
  const g = new THREE.Group();
  g.add(blk(15.8, 13.5, 21, M.tin(), 0, 0, -10.5)); // vỏ chống nhiễu
  g.add(blk(11.8, 9, 0.3, M.black(), 0, -0.8, 0.02)); // miệng cổng
  g.add(blk(5.5, 2, 0.3, M.black(), 0, -5.9, 0.02)); // khe lẫy
  for (let i = 0; i < 8; i++) g.add(blk(0.4, 0.15, 6, M.gold(), -3.5 + i * 1, 3, -3));
  if (withLeds) { g.add(blk(2.2, 1.6, 0.4, mat(0x9dff9d, { emissive: 0x22c55e, emissiveIntensity: 0.9 }), -5.8, 5.4, 0.1)); g.add(blk(2.2, 1.6, 0.4, mat(0xffd27a, { emissive: 0xf59e0b, emissiveIntensity: 0.9 }), 5.8, 5.4, 0.1)); }
  return g;
}
function bracket(h, cutouts = [], color = 0xc2c6cb) {
  // ke chặn PCIe 120×18,4 mm (đứng), có tai bắt vít
  const g = new THREE.Group(); const sm = mat(color, { metalness: 0.85, roughness: 0.35 });
  const outer = [V(-9.2, -h / 2), V(9.2, -h / 2), V(9.2, h / 2 - 4), V(12, h / 2 - 4), V(12, h / 2), V(-9.2, h / 2)];
  g.add(ext(outer, 0.8, sm, { holes: cutouts }));
  g.add(blk(0.8, 8, 4, sm, 11.6, h / 2 - 2, -2));
  return g;
}
function nic() {
  const g = new THREE.Group();
  // mạch 105×68 mm, chân PCIe x4 (vàng), chip Intel i350 có tản nhỏ, thạch anh, tụ
  const pcb = new THREE.Group();
  pcb.add(blk(105, 68, 1.6, pcbMat('#1d5f37', 'rgba(140,220,160,.28)', 7), 0, 0, 0));
  // chân PCIe x4: 32 tiếp điểm, khe khoá
  const edge = new THREE.Group(); for (let i = 0; i < 32; i++) { if (i === 11) continue; edge.add(blk(0.7, 4.5, 1.65, M.gold(), -18 + i * 1.0, -36, 0)); }
  pcb.add(edge); pcb.add(blk(12, 4.5, 1.6, pcbMat('#1d5f37', 'rgba(0,0,0,0)', 9), -26, -36, 0));
  const ic = chip(17, 17, 1.8, 'intel', 'i350-AM2'); ic.position.set(12, 6, 0.8); pcb.add(ic);
  pcb.add(rbox(18, 18, 6, mat(0x3a3f46, { metalness: 0.7, roughness: 0.4 }), 12, 6, 6, 0.6)); // tản nhôm
  for (let i = 0; i < 7; i++) pcb.add(blk(16, 0.8, 4, mat(0x4a5058, { metalness: 0.7, roughness: 0.4 }), 12, -1.2 + i * 2.4, 9));
  pcb.add(rbox(5, 3.2, 1.2, M.steel(), -8, 18, 1.4, 0.8)); // thạch anh
  const flash = chip(6, 5, 1.2, '25Q'); flash.position.set(30, -14, 0.8); pcb.add(flash);
  for (let i = 0; i < 10; i++) pcb.add(blk(1.6, 0.8, 0.8, mat(0xb08560), -4 + (i % 5) * 3, -10 - Math.floor(i / 5) * 3, 1.2)); // tụ dán
  [[34, 20], [40, 20], [34, 26]].forEach(([x, y]) => { pcb.add(cyl(2.5, 5, M.steel(), x, y, 3.3, 'z', 20)); }); // tụ nhôm
  // 2 cổng RJ45 xếp chồng ở mép ke
  const j1 = rj45Jack(); j1.rotation.y = -Math.PI / 2; j1.position.set(-42, 14, 8.6); pcb.add(j1);
  const j2 = rj45Jack(); j2.rotation.y = -Math.PI / 2; j2.position.set(-42, -6, 8.6); pcb.add(j2);
  g.add(pcb);
  const br = bracket(120, [rrectPts(15, 13, 0.5).map((p) => V(p.x, p.y + 14)), rrectPts(15, 13, 0.5).map((p) => V(p.x, p.y - 6))]);
  br.rotation.y = Math.PI / 2; br.position.set(-53, -10, 8); g.add(br);
  g.rotation.set(-0.55, 0.4, 0);
  return g;
}

// ======================= Card âm thanh PCIe =======================
function soundcard() {
  const g = new THREE.Group();
  const pcb = new THREE.Group();
  pcb.add(blk(120, 68, 1.6, pcbMat('#141518', 'rgba(140,150,170,.25)', 3), 0, 0, 0));
  const edge = new THREE.Group(); for (let i = 0; i < 18; i++) { if (i === 11) continue; edge.add(blk(0.7, 4.5, 1.65, M.gold(), -14 + i * 1.0, -36, 0)); } pcb.add(edge);
  // tấm chắn nhiễu EMI kim loại đỏ phủ khu vực analog, có logo
  const shield = rbox(70, 46, 3, mat(0x8b1b1f, { metalness: 0.75, roughness: 0.35 }), 10, 4, 2.4, 0.8); pcb.add(shield);
  pcb.add(decal(50, 12, printTex((c, W, H) => { c.fillStyle = '#f3f3f3'; c.font = 'bold 120px Arial'; c.fillText('AUDIO', 20, 150); c.font = '40px Arial'; c.fillText('24-bit / 192 kHz · 7.1', 24, 220); }, 600, 250), 10, 8, 3.95));
  // tụ âm thanh vàng, chip DAC, chân header
  [[52, 22], [52, 12], [52, 2], [-28, 22]].forEach(([x, y]) => pcb.add(cyl(3, 7, mat(0xc9a14a, { metalness: 0.5, roughness: 0.45 }), x, y, 4.3, 'z', 24)));
  const dsp = chip(12, 12, 1.4, 'CA0132', 'SB'); dsp.position.set(-30, 0, 0.8); pcb.add(dsp);
  for (let i = 0; i < 10; i++) pcb.add(blk(0.6, 0.6, 6, M.gold(), 40 + (i % 5) * 2.54, -22 - Math.floor(i / 5) * 2.54, 3.8));
  pcb.add(blk(14, 6, 6, M.black(), 45, -24, 3.6));
  // 5 jack 3,5 mm màu theo chuẩn + cổng quang (Toslink)
  [0x22c55e, 0xec4899, 0x3b82f6, 0xf59e0b, 0x111111].forEach((c, i) => {
    const jy = 24 - i * 11;
    pcb.add(blk(10, 9, 12, M.black(), -54, jy, 6.4));
    pcb.add(cyl(3.2, 1.4, M.plastic(c), -59.5, jy, 6.4, 'x', 24));
    pcb.add(cyl(1.8, 1.6, M.black(), -59.7, jy, 6.4, 'x', 18));
  });
  pcb.add(blk(9, 9, 12, M.black(), -54, -31, 6.4));
  g.add(pcb);
  const holes = [0, 1, 2, 3, 4].map((i) => circlePts(3.3, 24).map((p) => V(p.x + 6.4 - 6.4, p.y + 24 - i * 11)));
  const br = bracket(120, holes.map((h) => h.map((p) => V(p.x, p.y - 10 + 10))), 0x1c1d20);
  br.rotation.y = Math.PI / 2; br.position.set(-61, -10, 6.4); g.add(br);
  g.rotation.set(-0.55, 0.4, 0);
  return g;
}

// ======================= RAM laptop SO-DIMM DDR5 =======================
function sodimm() {
  const g = new THREE.Group();
  const w = 69.6, h = 30;
  // mạch có khấc 2 bên và khấc khoá lệch tâm ở mép chân
  const pts = [V(-w / 2, -h / 2), V(-2.2, -h / 2), V(-2.2, -h / 2 + 3.5), V(-1.2, -h / 2 + 3.5), V(-1.2, -h / 2), V(w / 2, -h / 2), V(w / 2, -5), V(w / 2 - 1.5, -4), V(w / 2 - 1.5, -2), V(w / 2, -1), V(w / 2, h / 2), V(-w / 2, h / 2), V(-w / 2, -1), V(-w / 2 + 1.5, -2), V(-w / 2 + 1.5, -4), V(-w / 2, -5)];
  const pm = pcbMat('#1f6b3c', 'rgba(160,230,170,.25)', 5);
  const board = ext(pts, 1.2, pm); board.position.z = -0.6; g.add(board);
  // chip DRAM 4 mặt trước, chip PMIC, SPD hub
  for (let i = 0; i < 4; i++) { const c = chip(10, 11, 1.1, 'D8CPT', 'MT60B2G8'); c.position.set(-24 + i * 14.5 + (i > 1 ? 4 : 0), 3, 0.6); g.add(c); }
  const pmic = chip(4, 4, 0.9, 'PMIC'); pmic.position.set(-1, 9.5, 0.6); g.add(pmic);
  for (let i = 0; i < 12; i++) g.add(blk(1, 0.5, 0.5, mat(0xb08560), -30 + i * 5.2, -7.5, 0.85));
  // tem nhãn
  g.add(decal(28, 6, printTex((c, W, H) => { c.fillStyle = '#fafafa'; c.fillRect(0, 0, W, H); c.fillStyle = '#111'; c.font = 'bold 44px Arial'; c.fillText('16GB 1Rx8 PC5-5600S', 14, 60); c.font = '30px monospace'; c.fillText('SO-DIMM DDR5  ▌▌▌▌▌▌▌▌▌▌▌', 14, 110); }, 620, 130), -6, 11.2, 0.62));
  // 262 chân (131 mỗi mặt) vàng, khấc khoá lệch tâm
  const gm = M.gold();
  for (let i = 0; i < 131; i++) { const x = -33.4 + i * 0.5; if (x > -2.3 && x < -1.1) continue; g.add(blk(0.3, 2.6, 0.04, gm, x, -13.4, 0.61)); g.add(blk(0.3, 2.6, 0.04, gm, x, -13.4, -0.61)); }
  g.rotation.set(-0.5, 0.25, 0);
  return g;
}

// ======================= Pin CMOS CR2032 =======================
function cmos() {
  const g = new THREE.Group();
  // cực dương: cốc thép Ø20 × 3,2 mm, mép vát; cực âm: nắp nhỏ Ø15 + gioăng nhựa
  const prof = [V(0, 0), V(9.6, 0), V(10, 0.4), V(10, 2.9), V(9.75, 3.2), V(0, 3.2)];
  const lathe = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), M.nickel()); lathe.castShadow = true; g.add(lathe);
  g.add(cyl(7.6, 0.25, M.nickel(), 0, -0.1, 0, 'y', 64));
  const gasket = new THREE.Mesh(new THREE.RingGeometry(7.7, 9.6, 64), M.matte(0x2a2b2e)); gasket.rotation.x = Math.PI / 2; gasket.position.y = -0.01; g.add(gasket);
  const top = decal(15, 15, printTex((c, W, H) => { c.fillStyle = 'rgba(60,62,66,.75)'; c.textAlign = 'center'; c.font = 'bold 74px Arial'; c.fillText('CR2032', W / 2, 190); c.font = 'bold 60px Arial'; c.fillText('3V  +', W / 2, 270); c.font = '30px Arial'; c.fillText('LITHIUM CELL', W / 2, 330); }, 400, 400), 0, 3.21, 0, [-Math.PI / 2, 0, 0], { roughness: 0.3, metalness: 0.6 });
  g.add(top);
  g.rotation.set(0.9, 0, 0.15);
  return g;
}

// ======================= Đầu cắm & cổng =======================
function hdmiShape(s = 1) { return [V(7, 2.25), V(-7, 2.25), V(-7, -0.6), V(-5.2, -2.25), V(5.2, -2.25), V(7, -0.6)].map((p) => p.multiplyScalar(s)); }
function hdmi() {
  // đầu cắm: vỏ thép 13,9×4,45 có lưỡi nhựa 19 chân, 4 lẫy dập; cổng: lỗ hình thang trên tấm panel
  const plug = new THREE.Group();
  plug.add(ext(hdmiShape(), 11, M.nickel(), { holes: [hdmiShape(0.9)] }));
  plug.add(blk(10.5, 1.4, 9, M.black(), 0, -0.3, 5));
  for (let i = 0; i < 10; i++) plug.add(blk(0.35, 0.05, 4, M.gold(), -4.2 + i * 0.93, 0.42, 7.5));
  for (let i = 0; i < 9; i++) plug.add(blk(0.35, 0.05, 4, M.gold(), -3.7 + i * 0.93, -1.02, 7.5));
  [-4, 4].forEach((x) => { plug.add(blk(1.6, 0.25, 2, M.steel(), x, 2.3, 6)); plug.add(blk(1.6, 0.25, 2, M.steel(), x, -2.3, 6)); });
  const om = overmold(20, 10, 16, 0x15161a, 2.8); plug.add(om);
  plug.add(decal(9, 3, printTex((c, W, H) => { c.fillStyle = '#bdbfc3'; c.font = 'bold italic 150px Arial'; c.fillText('HDMI', 20, 175); }, 512, 200), 0, 5.01, -8, [-Math.PI / 2, 0, Math.PI]));
  const port = panel(30, 18, hdmiShape(1.03));
  const cav = ext(hdmiShape(1.03), 9, M.black()); cav.position.z = -9; port.add(cav);
  port.add(blk(10.5, 1.4, 8, M.black(), 0, -0.3, -4.5));
  for (let i = 0; i < 19; i++) port.add(blk(0.3, 0.05, 3, M.gold(), -4.2 + (i >> 1) * 0.93 + (i % 2) * 0.46, i % 2 ? -1.02 : 0.42, -2.5));
  return pair(plug, port);
}
function dpShape(s = 1) { return [V(8, 2.4), V(-8, 2.4), V(-8, -2.4), V(5.6, -2.4), V(8, 0)].map((p) => p.multiplyScalar(s)); }
function displayport() {
  const plug = new THREE.Group();
  plug.add(ext(dpShape(), 9, M.nickel(), { holes: [dpShape(0.9)] }));
  plug.add(blk(12, 1.2, 7, M.black(), -0.6, -0.5, 4.5));
  for (let i = 0; i < 10; i++) plug.add(blk(0.4, 0.05, 3.5, M.gold(), -5 + i * 1, 0.12, 6.5));
  // 2 móc khoá trên đỉnh + nút bấm nhả khoá
  [-4.5, 4.5].forEach((x) => plug.add(blk(1.4, 0.6, 3, M.steel(), x, 2.6, 7)));
  plug.add(overmold(22, 10, 18, 0xbfc3c8, 2.8, { grip: false }));
  plug.add(rbox(10, 1.4, 8, M.plastic(0x2a2c30), 0, 5.4, -6, 0.6)); // nút nhả khoá
  plug.add(decal(6, 6, printTex((c, W, H) => { c.fillStyle = '#4a4d52'; c.font = 'bold 200px Arial'; c.fillText('D', 50, 200); }, 256, 256), 0, 5.02, -14, [-Math.PI / 2, 0, Math.PI]));
  const port = panel(30, 18, dpShape(1.04));
  const cav = ext(dpShape(1.04), 9, M.black()); cav.position.z = -9; port.add(cav);
  port.add(blk(12, 1.2, 7, M.black(), -0.6, 0.6, -4));
  for (let i = 0; i < 20; i++) port.add(blk(0.35, 0.05, 3, M.gold(), -5 + (i >> 1) * 1 + (i % 2) * 0.5, i % 2 ? 0.0 : 1.22, -2.5));
  return pair(plug, port);
}
function dShape(top, bottom, h, s = 1) { return [V(top / 2, h / 2), V(-top / 2, h / 2), V(-bottom / 2, -h / 2), V(bottom / 2, -h / 2)].map((p) => p.multiplyScalar(s)); }
function vga() {
  // DE-15: vỏ thép hình D 16,9×8,3, 15 chân 3 hàng; thân nhựa xanh + 2 vít vặn tay
  const plug = new THREE.Group();
  plug.add(ext(rrectPts(31, 12.5, 1), 0.8, M.nickel())); // mặt bích
  const d = ext(dShape(16.4, 13.6, 7.9), 6, M.nickel(), { holes: [dShape(16.4, 13.6, 7.9, 0.88)] }); d.position.z = 0.8; plug.add(d);
  const ins = ext(dShape(16.4, 13.6, 7.9, 0.88), 5, M.black()); ins.position.z = 0.8; plug.add(ins);
  const rows = [5, 5, 5], pitch = 2.29;
  rows.forEach((n, r) => { for (let i = 0; i < n; i++) plug.add(cyl(0.5, 5, M.gold(), (i - (n - 1) / 2) * pitch + (r === 1 ? -pitch / 2 + 1.15 : 0), 2 - r * 2, 5.5, 'z', 10)); });
  plug.add(rbox(33, 16, 14, M.plastic(0x2f6fd1), 0, 0, -7, 2.5));
  [-12.5, 12.5].forEach((x) => { plug.add(cyl(1.6, 22, M.nickel(), x, 0, -3, 'z', 16)); plug.add(cyl(3.4, 8, M.plastic(0x2f6fd1), x, 0, -16, 'z', 12)); });
  plug.add(cable([[0, 0, -14], [0, 0, -26], [4, -5, -38], [9, -12, -44]], 3.2, M.rubber(0x26282c)));
  const port = panel(40, 20, dShape(17.3, 14.5, 8.8));
  const cav = ext(dShape(17.3, 14.5, 8.8), 6, M.black()); cav.position.z = -6; port.add(cav);
  rows.forEach((n, r) => { for (let i = 0; i < n; i++) { const hole = cyl(0.55, 0.2, mat(0x000000), (i - (n - 1) / 2) * pitch + (r === 1 ? -pitch / 2 + 1.15 : 0), 2 - r * 2, 0.05, 'z', 10); port.add(hole); } });
  [-12.5, 12.5].forEach((x) => { const hx = cyl(2.6, 4, M.nickel(), x, 0, 2, 'z', 6); port.add(hx); port.add(cyl(1.3, 4.2, M.black(), x, 0, 2, 'z', 12)); });
  port.add(ext(dShape(18, 15.2, 9.5), 0.5, M.plastic(0x2f6fd1), { holes: [dShape(17.3, 14.5, 8.8)] }).translateZ(1));
  return pair(plug, port, 30);
}
function usbc() {
  // USB-C: vỏ thép oval 8,25×2,4 mm, hốc rỗng chứa chân hai hàng; cổng có lưỡi giữa 24 chân
  const o = rrectPts(8.25, 2.4, 1.2, 10), oi = rrectPts(7.5, 1.7, 0.85, 10);
  const plug = new THREE.Group();
  plug.add(ext(o, 6.5, M.nickel(), { holes: [oi] }));
  const inner = ext(oi, 5.5, M.black()); plug.add(inner);
  for (let i = 0; i < 12; i++) { plug.add(blk(0.25, 0.05, 2.5, M.gold(), -2.75 + i * 0.5, 0.62, 5.6)); plug.add(blk(0.25, 0.05, 2.5, M.gold(), -2.75 + i * 0.5, -0.62, 5.6)); }
  plug.add(overmold(12, 6.5, 15, 0xeeeeef, 2, { grip: false }));
  const port = panel(18, 11, rrectPts(8.6, 2.8, 1.4, 10));
  const cav = ext(rrectPts(8.6, 2.8, 1.4, 10), 6, M.nickel()); cav.position.z = -6; port.add(cav);
  port.add(blk(6.6, 0.7, 5, M.black(), 0, 0, -2.6));
  for (let i = 0; i < 12; i++) { port.add(blk(0.25, 0.04, 3, M.gold(), -2.75 + i * 0.5, 0.36, -1.8)); port.add(blk(0.25, 0.04, 3, M.gold(), -2.75 + i * 0.5, -0.36, -1.8)); }
  return pair(plug, port, 18);
}
function usbBShape(s = 1) { return [V(4, 3.8), V(-4, 3.8), V(-4, -2.6), V(-2.8, -3.8), V(2.8, -3.8), V(4, -2.6)].map((p) => p.multiplyScalar(s)); }
function usbB() {
  // USB-B (đầu máy in): vỏ 8×7,6 mm, 2 góc dưới vát; cổng có lõi nhựa vuông 4 chân
  const plug = new THREE.Group();
  const o = usbBShape(); plug.add(ext(o, 10, M.nickel(), { holes: [usbBShape(0.88)] }));
  const core = ext(usbBShape(0.88), 9, M.black(), { holes: [rrectPts(4.4, 3.6, 0.3)] }); plug.add(core);
  [[-1.2, 1], [1.2, 1], [-1.2, -1], [1.2, -1]].forEach(([x, y]) => plug.add(blk(0.7, 0.06, 4, M.gold(), x, y * 1.8, 7)));
  plug.add(overmold(15, 13, 16, 0x1d1e21, 2.6));
  const port = panel(22, 18, usbBShape(1.04));
  const cav = ext(usbBShape(1.04), 10, M.nickel()); cav.position.z = -10; port.add(cav);
  port.add(blk(4.3, 3.5, 9, M.plastic(0xf2f2f2), 0, 0, -4.4));
  return pair(plug, port, 20);
}
function rj45() {
  // đầu RJ45 nhựa trong 11,7×8 mm, 8 lưỡi vàng, lẫy gài; 8 sợi dây màu chuẩn T568B
  const plug = new THREE.Group();
  const body = rbox(11.7, 8, 21, M.clear(), 0, 0, -10.5, 0.6); plug.add(body);
  for (let i = 0; i < 8; i++) plug.add(blk(0.35, 1.6, 4, M.gold(), -3.57 + i * 1.02, 3.2, -2));
  const cols = [0xf8c2a1, 0xf28c28, 0xc9f0c9, 0x2563eb, 0xb8d4ff, 0x22a34a, 0xe8c9a8, 0x7a4b23];
  cols.forEach((c, i) => plug.add(blk(0.9, 0.9, 14, M.plastic(c), -3.57 + i * 1.02, 1.6 - (i % 2) * 0.4, -8)));
  // lẫy gài cong bên dưới
  const latch = new THREE.Mesh(new THREE.BoxGeometry(6, 0.9, 14), M.clear()); latch.position.set(0, -5.2, -7); latch.rotation.x = -0.18; plug.add(latch);
  plug.add(rbox(12.4, 9, 10, M.plastic(0x2a74d8), 0, 0, -25, 2)); // ống bọc chống gãy
  plug.add(cable([[0, 0, -29], [0, 0, -40], [3, -4, -52], [8, -10, -58]], 3, M.rubber(0x2a74d8)));
  const port = rj45Jack(); port.position.z = 0;
  const p2 = new THREE.Group(); p2.add(panel(24, 22, rrectPts(16, 13.8, 0.5)).translateZ(0.2)); p2.add(port);
  return pair(plug, p2, 22);
}
function audio() {
  // giắc 3,5 mm TRS: đầu (tip), vòng (ring), thân (sleeve) ngăn bởi vòng cách điện đen
  const plug = new THREE.Group();
  const prof = [V(0, 14), V(0.9, 13.8), V(1.6, 12.8), V(1.75, 12.2), V(1.2, 11.6), V(1.2, 11), V(1.75, 10.8), V(1.75, 8.4), V(1.75, 0), V(0, 0)];
  const metal = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), M.gold()); metal.rotation.x = Math.PI / 2; plug.add(metal);
  [10.2, 7.4].forEach((z) => plug.add(cyl(1.78, 0.8, M.black(), 0, 0, z, 'z', 32)));
  plug.add(cyl(3, 1, M.nickel(), 0, 0, -0.2, 'z', 32));
  plug.add(overmold(6.5, 6.5, 16, 0x1b1c1f, 1.8, { grip: false, tail: 8 }));
  const port = panel(16, 16, circlePts(1.85, 32));
  const ring = ext(circlePts(3.4, 40), 0.6, M.plastic(0x22c55e), { holes: [circlePts(1.9, 32)] }); ring.position.z = 1; port.add(ring);
  const cav = ext(circlePts(1.85, 32), 12, M.black()); cav.position.z = -12; port.add(cav);
  return pair(plug, port, 16);
}
function pcie8() {
  // đầu 6+2 pin: 2 khối nhựa đen, chân lỗ vuông/bát giác xen kẽ (chống cắm ngược), lẫy gài, dây 18AWG vàng/đen
  const g = new THREE.Group();
  const shapeSq = rrectPts(3.6, 3.6, 0.3), shapeOct = [V(1.8, 0.9), V(0.9, 1.8), V(-0.9, 1.8), V(-1.8, 0.9), V(-1.8, -0.9), V(-0.9, -1.8), V(0.9, -1.8), V(1.8, -0.9)];
  const housing = (cols, x0) => {
    const h = new THREE.Group();
    const w = cols * 4.2 + 0.6, holes = [];
    for (let c = 0; c < cols; c++) for (let r = 0; r < 2; r++) { const sq = (c + r) % 2 === 0; holes.push((sq ? shapeSq : shapeOct).map((p) => V(p.x + (c - (cols - 1) / 2) * 4.2, p.y + (r ? -2.1 : 2.1)))); }
    h.add(ext(rrectPts(w, 9, 0.6), 11, M.black(), { holes })); h.position.x = x0;
    for (let c = 0; c < cols; c++) for (let r = 0; r < 2; r++) h.add(blk(1.6, 1.6, 0.2, M.tin(), (c - (cols - 1) / 2) * 4.2, r ? -2.1 : 2.1, 3));
    return h;
  };
  const six = housing(3, -2.4); g.add(six);
  const two = housing(1, 8.6); g.add(two);
  g.add(rbox(3, 1.4, 5, M.black(), -2.4, 5.4, 6, 0.4)); // lẫy gài
  g.add(blk(2.2, 1, 4, M.black(), -2.4, 6.2, 8.6));
  // dây: 3 vàng (+12V) và 5 đen (GND)
  const cols = [0xf5c518, 0xf5c518, 0xf5c518, 0x141414, 0x141414, 0x141414, 0x141414, 0x141414];
  for (let i = 0; i < 8; i++) {
    const x = i < 6 ? -2.4 + ((i % 3) - 1) * 4.2 : 8.6, y = i < 6 ? (i < 3 ? 2.1 : -2.1) : i === 6 ? 2.1 : -2.1;
    g.add(cable([[x, y, 0], [x, y, -8], [x * 0.5 + 2, y - 4, -22], [x * 0.3 + 6, y - 10, -34]], 1.05, M.rubber(cols[i])));
  }
  g.rotation.set(0.3, 0.6, 0);
  return g;
}

export const REAL_MODELS = {
  sdcard, flash: usbFlash, nic, soundcard, sodimm, cmos, hdmi, dp: displayport, vga, usbC: usbc, usbB, rj45, audio, pcie8,
};
