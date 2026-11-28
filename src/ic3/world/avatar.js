// Đảo IC3 – nhân vật dạng khối (kiểu đồ chơi lắp ghép), thay được tóc, mặt, áo, quần, giày, mũ, phụ kiện.
import * as THREE from 'three';

// ---------- danh mục đồ ----------
// lv: cấp IC3 cần đạt để mở khoá (cấp lấy từ XP ôn luyện)
export const CATALOG = {
  skin: { label: 'Màu da', colors: ['#ffe0c2', '#f6c9a0', '#e8b07f', '#c98d5c', '#9a6440', '#6b4128'] },
  hair: { label: 'Kiểu tóc', items: [['none', 'Trọc'], ['short', 'Ngắn'], ['spiky', 'Dựng'], ['side', 'Mái lệch'], ['bob', 'Bob'], ['long', 'Dài'], ['pony', 'Đuôi ngựa'], ['buns', 'Búi đôi'], ['curly', 'Xoăn'], ['mohawk', 'Mohican', 3]] },
  hairColor: { label: 'Màu tóc', colors: ['#1b1b1f', '#4a2f1f', '#8a5a2b', '#e8c46a', '#c0392b', '#ff7eb6', '#4f7cff', '#8e5cf7', '#2fbf71', '#f2f2f2'] },
  face: { label: 'Khuôn mặt', items: [['smile', 'Cười'], ['grin', 'Cười tươi'], ['wink', 'Nháy mắt'], ['cool', 'Ngầu'], ['wow', 'Ngạc nhiên'], ['cat', 'Mèo con'], ['star', 'Mắt sao', 2], ['focus', 'Quyết tâm']] },
  top: { label: 'Áo', items: [['tee', 'Áo thun'], ['uniform', 'Đồng phục'], ['hoodie', 'Áo hoodie'], ['jacket', 'Áo khoác'], ['jersey', 'Áo thể thao'], ['aodai', 'Áo dài', 2], ['suit', 'Vest', 4], ['astro', 'Đồ phi hành gia', 6]] },
  topColor: { label: 'Màu áo', colors: ['#ffffff', '#1d1d1f', '#e53935', '#ff9800', '#ffd400', '#43a047', '#1e88e5', '#3949ab', '#8e24aa', '#ec407a', '#00acc1', '#795548'] },
  print: { label: 'Hình in', items: [['none', 'Trơn'], ['ic3', 'Chữ IC3'], ['star', 'Ngôi sao'], ['heart', 'Trái tim'], ['bolt', 'Tia chớp'], ['stripe', 'Kẻ sọc'], ['pixel', 'Pixel'], ['cat', 'Mèo', 2], ['code', '</>', 3]] },
  bottom: { label: 'Quần / váy', items: [['pants', 'Quần dài'], ['shorts', 'Quần short'], ['skirt', 'Váy'], ['jeans', 'Quần jean']] },
  bottomColor: { label: 'Màu quần', colors: ['#1d1d1f', '#3c4a6b', '#2f5fb3', '#6d4c41', '#9e9e9e', '#ffffff', '#c62828', '#2e7d32', '#ec407a', '#f5deb3'] },
  shoes: { label: 'Giày', items: [['sneaker', 'Giày thể thao'], ['boot', 'Bốt'], ['sandal', 'Dép']] },
  shoeColor: { label: 'Màu giày', colors: ['#ffffff', '#1d1d1f', '#e53935', '#1e88e5', '#ffd400', '#43a047', '#ff7eb6'] },
  hat: { label: 'Mũ', items: [['none', 'Không'], ['cap', 'Mũ lưỡi trai'], ['beanie', 'Mũ len'], ['nonla', 'Nón lá'], ['phones', 'Tai nghe'], ['bunny', 'Tai thỏ'], ['flower', 'Kẹp hoa'], ['wizard', 'Mũ phù thuỷ', 3], ['crown', 'Vương miện', 5]] },
  hatColor: { label: 'Màu mũ', colors: ['#e53935', '#1e88e5', '#ffd400', '#43a047', '#1d1d1f', '#ffffff', '#8e24aa', '#ff9800'] },
  acc: { label: 'Phụ kiện', items: [['none', 'Không'], ['glasses', 'Kính cận'], ['shades', 'Kính râm'], ['bag', 'Ba lô'], ['scarf', 'Khăn choàng'], ['cape', 'Áo choàng', 2], ['wings', 'Đôi cánh', 4], ['halo', 'Vầng sáng', 6]] },
};
export const DEFAULT = { skin: '#f6c9a0', hair: 'short', hairColor: '#1b1b1f', face: 'smile', top: 'uniform', topColor: '#ffffff', print: 'none', bottom: 'pants', bottomColor: '#3c4a6b', shoes: 'sneaker', shoeColor: '#ffffff', hat: 'none', hatColor: '#e53935', acc: 'none' };
export function itemLv(cat, id) { const it = (CATALOG[cat].items || []).find((x) => x[0] === id); return it && it[2] ? it[2] : 1; }
export function randomLook() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const o = {};
  for (const [k, c] of Object.entries(CATALOG)) o[k] = c.colors ? pick(c.colors) : pick(c.items.filter((x) => !x[2]))[0];
  return o;
}
export function sanitize(look) {
  const o = { ...DEFAULT };
  if (look && typeof look === 'object') for (const [k, c] of Object.entries(CATALOG)) {
    const v = look[k]; if (c.colors ? c.colors.includes(v) : c.items.some((x) => x[0] === v)) o[k] = v;
  }
  return o;
}

// ---------- vật liệu & hình khối ----------
const MATS = new Map();
function mat(color, opt = {}) {
  const key = color + JSON.stringify(opt);
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, flatShading: true, ...opt }));
  return MATS.get(key);
}
function box(w, h, d, m, x = 0, y = 0, z = 0, parent) {
  const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.position.set(x, y, z); g.castShadow = true; g.receiveShadow = false; if (parent) parent.add(g); return g;
}
const darker = (hex, k = 0.75) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };

// ---------- vẽ mặt và hình in bằng canvas ----------
function faceTex(face, skin) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = skin; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#1d1d1f'; g.strokeStyle = '#1d1d1f'; g.lineWidth = 3.2; g.lineCap = 'round';
  const eye = (x, y, r = 4.2) => { g.beginPath(); g.ellipse(x, y, r * 0.8, r, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 1.2, y - 1.4, 1.3, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1d1d1f'; };
  const blush = () => { g.fillStyle = 'rgba(255,110,130,.35)'; g.beginPath(); g.ellipse(14, 40, 6, 3.5, 0, 0, 7); g.ellipse(50, 40, 6, 3.5, 0, 0, 7); g.fill(); g.fillStyle = '#1d1d1f'; };
  const arc = (x, y, r, a0, a1) => { g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); };
  if (face === 'smile') { eye(22, 28); eye(42, 28); arc(32, 38, 9, 0.2 * Math.PI, 0.8 * Math.PI); blush(); }
  if (face === 'grin') { eye(22, 27); eye(42, 27); g.beginPath(); g.moveTo(20, 38); g.quadraticCurveTo(32, 54, 44, 38); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(24, 38, 16, 4); g.fillStyle = '#1d1d1f'; blush(); }
  if (face === 'wink') { eye(22, 28); arc(42, 30, 5, 1.1 * Math.PI, 1.9 * Math.PI); arc(32, 38, 9, 0.2 * Math.PI, 0.8 * Math.PI); blush(); }
  if (face === 'cool') { g.fillRect(14, 23, 16, 9); g.fillRect(34, 23, 16, 9); g.fillRect(28, 25, 8, 3); g.beginPath(); g.moveTo(26, 44); g.lineTo(40, 41); g.stroke(); }
  if (face === 'wow') { eye(22, 27, 5); eye(42, 27, 5); g.beginPath(); g.ellipse(32, 44, 4, 5, 0, 0, 7); g.fill(); }
  if (face === 'cat') { eye(22, 28); eye(42, 28); g.beginPath(); g.moveTo(24, 40); g.quadraticCurveTo(28, 45, 32, 40); g.quadraticCurveTo(36, 45, 40, 40); g.stroke(); blush(); }
  if (face === 'star') {
    const star = (x, y) => { g.fillStyle = '#ffb300'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.6 : 6.4, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); g.fillStyle = '#1d1d1f'; };
    star(22, 28); star(42, 28); arc(32, 38, 8, 0.15 * Math.PI, 0.85 * Math.PI); blush();
  }
  if (face === 'focus') { g.beginPath(); g.moveTo(15, 21); g.lineTo(28, 24); g.moveTo(49, 21); g.lineTo(36, 24); g.stroke(); eye(22, 30, 3.6); eye(42, 30, 3.6); g.beginPath(); g.moveTo(25, 43); g.lineTo(39, 43); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function shirtTex(L) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  const base = L.top === 'uniform' ? '#ffffff' : L.top === 'astro' ? '#eceff1' : L.topColor;
  g.fillStyle = base; g.fillRect(0, 0, 64, 64);
  const ink = new THREE.Color(base).getHSL({}).l > 0.6 ? '#1d1d1f' : '#ffffff';
  const accent = L.top === 'uniform' ? '#1e88e5' : ink;
  if (L.top === 'uniform') { g.fillStyle = '#e53935'; g.beginPath(); g.moveTo(18, 0); g.lineTo(32, 16); g.lineTo(46, 0); g.lineTo(40, 0); g.lineTo(32, 9); g.lineTo(24, 0); g.fill(); g.beginPath(); g.moveTo(30, 14); g.lineTo(26, 34); g.lineTo(32, 30); g.lineTo(38, 34); g.lineTo(34, 14); g.fill(); g.fillStyle = '#ddd'; for (let y = 22; y < 60; y += 10) g.fillRect(31, y, 2, 2); }
  if (L.top === 'jacket') { g.fillStyle = '#f4f4f4'; g.fillRect(24, 0, 16, 64); g.fillStyle = darker(base, 0.8); g.fillRect(22, 0, 3, 64); g.fillRect(39, 0, 3, 64); }
  if (L.top === 'hoodie') { g.fillStyle = darker(base, 0.8); g.fillRect(16, 40, 32, 14); g.strokeStyle = ink; g.lineWidth = 2; g.beginPath(); g.moveTo(28, 0); g.lineTo(27, 16); g.moveTo(36, 0); g.lineTo(37, 16); g.stroke(); }
  if (L.top === 'jersey') { g.fillStyle = ink; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText('10', 32, 48); g.fillRect(0, 0, 64, 4); }
  if (L.top === 'aodai') { g.fillStyle = darker(base, 0.85); g.beginPath(); g.moveTo(26, 0); g.lineTo(32, 8); g.lineTo(38, 0); g.fill(); g.fillStyle = '#ffd400'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(20 + i * 6, 30 + (i % 2) * 8, 2.4, 0, 7); g.fill(); } }
  if (L.top === 'suit') { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(22, 0); g.lineTo(32, 30); g.lineTo(42, 0); g.fill(); g.fillStyle = '#c62828'; g.beginPath(); g.moveTo(30, 6); g.lineTo(34, 6); g.lineTo(35, 26); g.lineTo(32, 30); g.lineTo(29, 26); g.fill(); }
  if (L.top === 'astro') { g.fillStyle = '#1e88e5'; g.fillRect(18, 20, 28, 18); g.fillStyle = '#e53935'; g.fillRect(22, 24, 6, 4); g.fillStyle = '#ffd400'; g.fillRect(30, 24, 6, 4); g.fillStyle = '#43a047'; g.fillRect(38, 24, 4, 4); g.fillStyle = '#90a4ae'; g.fillRect(0, 50, 64, 4); }
  if (L.top !== 'uniform' && L.top !== 'suit' && L.top !== 'astro') {
    g.fillStyle = ink; g.strokeStyle = ink; g.textAlign = 'center';
    const p = L.print;
    if (p === 'ic3') { g.font = 'bold 20px sans-serif'; g.fillText('IC3', 32, 40); }
    if (p === 'star') { g.fillStyle = '#ffd400'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(32 + Math.cos(a) * r, 34 + Math.sin(a) * r); } g.fill(); }
    if (p === 'heart') { g.fillStyle = '#ff3b6b'; g.beginPath(); g.moveTo(32, 46); g.bezierCurveTo(14, 34, 20, 18, 32, 28); g.bezierCurveTo(44, 18, 50, 34, 32, 46); g.fill(); }
    if (p === 'bolt') { g.fillStyle = '#ffd400'; g.beginPath(); g.moveTo(36, 18); g.lineTo(24, 36); g.lineTo(32, 36); g.lineTo(28, 50); g.lineTo(42, 30); g.lineTo(33, 30); g.fill(); }
    if (p === 'stripe') { g.fillStyle = darker(base, 0.65); for (let y = 6; y < 64; y += 12) g.fillRect(0, y, 64, 5); }
    if (p === 'pixel') { const cols = ['#e53935', '#ffd400', '#43a047', '#1e88e5']; for (let i = 0; i < 16; i++) { g.fillStyle = cols[(i * 7) % 4]; g.fillRect(20 + (i % 4) * 6, 22 + Math.floor(i / 4) * 6, 6, 6); } }
    if (p === 'cat') { g.fillStyle = ink; g.beginPath(); g.arc(32, 36, 10, 0, 7); g.moveTo(23, 30); g.lineTo(24, 20); g.lineTo(30, 27); g.moveTo(41, 30); g.lineTo(40, 20); g.lineTo(34, 27); g.fill(); g.fillStyle = base; g.fillRect(27, 34, 3, 3); g.fillRect(35, 34, 3, 3); }
    if (p === 'code') { g.font = 'bold 18px monospace'; g.fillText('</>', 32, 40); }
  }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- dựng nhân vật ----------
// Kích thước (đơn vị ~ mét): chân 0–0.9, thân 0.9–1.85, đầu 1.85–2.65
export function makeAvatar(lookIn) {
  const L = sanitize(lookIn);
  const root = new THREE.Group(); root.name = 'avatar';
  const body = new THREE.Group(); root.add(body); // nhún nhảy
  const skinM = mat(L.skin);
  const topBase = L.top === 'uniform' ? '#ffffff' : L.top === 'astro' ? '#eceff1' : L.topColor;
  const topM = mat(topBase), sleeveM = L.top === 'tee' || L.top === 'uniform' || L.top === 'jersey' ? null : topM;
  const botM = mat(L.top === 'astro' ? '#eceff1' : L.bottom === 'jeans' ? (L.bottomColor === '#1d1d1f' ? '#2b3550' : L.bottomColor) : L.bottomColor);
  const shoeM = mat(L.shoeColor), soleM = mat('#333333');

  // chân (xoay quanh hông)
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0.24 * s, 0.9, 0); body.add(hip);
    box(0.46, 0.78, 0.5, L.bottom === 'shorts' || L.bottom === 'skirt' ? skinM : botM, 0, -0.39, 0, hip);
    if (L.bottom === 'shorts') box(0.48, 0.34, 0.52, botM, 0, -0.17, 0, hip);
    if (L.bottom === 'jeans') box(0.47, 0.04, 0.51, mat(darker(L.bottomColor === '#1d1d1f' ? '#2b3550' : L.bottomColor, 0.7)), 0, -0.6, 0, hip);
    const shoeH = L.shoes === 'boot' ? 0.3 : 0.16;
    box(0.5, shoeH, 0.58, L.shoes === 'sandal' ? skinM : shoeM, 0, -0.78 + shoeH / 2, 0.04, hip);
    box(0.5, 0.05, 0.6, soleM, 0, -0.78 + 0.025, 0.04, hip);
    if (L.shoes === 'sandal') box(0.5, 0.05, 0.1, shoeM, 0, -0.66, 0.12, hip);
    legs.push(hip);
  }
  // thân
  const tex = shirtTex(L);
  const torsoMats = [topM, topM, topM, topM, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, flatShading: true }), topM];
  const torso = box(0.98, 0.95, 0.5, torsoMats, 0, 1.375, 0, body);
  if (L.bottom === 'skirt') { const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.68, 0.48, 8), botM); sk.position.set(0, 0.78, 0); sk.castShadow = true; body.add(sk); }
  else box(1.0, 0.16, 0.52, botM, 0, 0.92, 0, body); // cạp quần
  if (L.top === 'aodai') { box(0.9, 0.7, 0.06, topM, 0, 0.55, 0.24, body); box(0.9, 0.7, 0.06, topM, 0, 0.55, -0.24, body); }
  if (L.top === 'hoodie') box(0.8, 0.34, 0.24, mat(darker(topBase, 0.85)), 0, 1.82, -0.32, body);
  if (L.top === 'suit') box(1.0, 0.25, 0.52, topM, 0, 0.92, 0, body);
  // tay (xoay quanh vai)
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(0.7 * s, 1.78, 0); body.add(sh);
    if (sleeveM) box(0.4, 0.9, 0.44, sleeveM, 0, -0.42, 0, sh);
    else { box(0.42, 0.34, 0.46, topM, 0, -0.14, 0, sh); box(0.38, 0.6, 0.42, skinM, 0, -0.6, 0, sh); }
    if (L.top === 'astro') box(0.42, 0.14, 0.46, mat('#90a4ae'), 0, -0.82, 0, sh);
    box(0.36, 0.16, 0.4, skinM, 0, -0.93, 0, sh); // bàn tay
    arms.push(sh);
  }
  // đầu
  const neck = new THREE.Group(); neck.position.set(0, 1.86, 0); body.add(neck);
  const fm = new THREE.MeshStandardMaterial({ map: faceTex(L.face, L.skin), roughness: 0.8, flatShading: true });
  const head = box(0.82, 0.8, 0.8, [skinM, skinM, skinM, skinM, fm, skinM], 0, 0.42, 0, neck);
  if (L.top === 'astro') { const h = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 10), new THREE.MeshStandardMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.25, roughness: 0.1 })); h.position.y = 0.42; neck.add(h); }
  addHair(neck, L);
  addHat(neck, L);
  addAcc(body, neck, L);

  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  root.userData = { L, body, legs, arms, neck, head, t: Math.random() * 10, speed: 0, pose: 'idle' };
  return root;
}
function addHair(neck, L) {
  const m = mat(L.hairColor), y = 0.42;
  if (L.hat === 'nonla' || L.hat === 'wizard' || L.hat === 'beanie') { if (L.hair === 'long' || L.hair === 'pony' || L.hair === 'bob') box(0.86, 0.6, 0.18, m, 0, y - 0.18, -0.36, neck); if (L.hair === 'pony') box(0.24, 0.6, 0.22, m, 0, y - 0.4, -0.52, neck); return; }
  switch (L.hair) {
    case 'none': return;
    case 'short': box(0.88, 0.2, 0.86, m, 0, y + 0.44, 0, neck); box(0.88, 0.42, 0.14, m, 0, y + 0.2, -0.38, neck); box(0.1, 0.3, 0.84, m, -0.44, y + 0.25, 0, neck); box(0.1, 0.3, 0.84, m, 0.44, y + 0.25, 0, neck); break;
    case 'spiky': box(0.88, 0.2, 0.86, m, 0, y + 0.44, 0, neck); for (let i = 0; i < 5; i++) { const s = box(0.16, 0.3, 0.16, m, -0.32 + i * 0.16, y + 0.62, (i % 2) * 0.16 - 0.08, neck); s.rotation.z = (i - 2) * 0.18; } box(0.88, 0.4, 0.14, m, 0, y + 0.2, -0.38, neck); break;
    case 'side': box(0.9, 0.22, 0.88, m, 0, y + 0.44, 0, neck); box(0.5, 0.22, 0.1, m, -0.18, y + 0.3, 0.42, neck); box(0.88, 0.5, 0.14, m, 0, y + 0.16, -0.38, neck); box(0.1, 0.4, 0.84, m, -0.45, y + 0.2, 0, neck); break;
    case 'bob': box(0.92, 0.22, 0.9, m, 0, y + 0.44, 0, neck); box(0.14, 0.7, 0.9, m, -0.46, y + 0.06, 0, neck); box(0.14, 0.7, 0.9, m, 0.46, y + 0.06, 0, neck); box(0.92, 0.72, 0.14, m, 0, y + 0.06, -0.42, neck); box(0.84, 0.14, 0.08, m, 0, y + 0.3, 0.42, neck); break;
    case 'long': box(0.92, 0.22, 0.9, m, 0, y + 0.44, 0, neck); box(0.14, 0.9, 0.9, m, -0.46, y - 0.04, 0, neck); box(0.14, 0.9, 0.9, m, 0.46, y - 0.04, 0, neck); box(0.92, 1.1, 0.16, m, 0, y - 0.14, -0.42, neck); break;
    case 'pony': box(0.9, 0.22, 0.88, m, 0, y + 0.44, 0, neck); box(0.88, 0.5, 0.14, m, 0, y + 0.2, -0.38, neck); box(0.26, 0.26, 0.26, m, 0, y + 0.36, -0.52, neck); box(0.22, 0.7, 0.22, m, 0, y - 0.1, -0.6, neck); break;
    case 'buns': box(0.9, 0.22, 0.88, m, 0, y + 0.44, 0, neck); box(0.88, 0.46, 0.14, m, 0, y + 0.2, -0.38, neck); box(0.32, 0.32, 0.32, m, -0.34, y + 0.62, -0.06, neck); box(0.32, 0.32, 0.32, m, 0.34, y + 0.62, -0.06, neck); break;
    case 'curly': for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; box(0.34, 0.34, 0.34, m, Math.cos(a) * 0.4, y + 0.42 + (i % 2) * 0.08, Math.sin(a) * 0.38 - 0.04, neck); } box(0.8, 0.3, 0.8, m, 0, y + 0.52, 0, neck); break;
    case 'mohawk': box(0.2, 0.42, 0.9, m, 0, y + 0.6, -0.02, neck); box(0.86, 0.06, 0.84, mat(darker(L.hairColor, 0.8)), 0, y + 0.41, 0, neck); break;
  }
}
function addHat(neck, L) {
  const m = mat(L.hatColor), y = 0.42;
  switch (L.hat) {
    case 'cap': box(0.92, 0.26, 0.9, m, 0, y + 0.5, 0, neck); box(0.86, 0.06, 0.4, m, 0, y + 0.38, 0.6, neck); box(0.16, 0.06, 0.16, mat('#ffffff'), 0, y + 0.66, 0, neck); break;
    case 'beanie': box(0.94, 0.4, 0.92, m, 0, y + 0.46, 0, neck); box(0.96, 0.12, 0.94, mat(darker(L.hatColor, 0.8)), 0, y + 0.28, 0, neck); box(0.2, 0.2, 0.2, mat('#ffffff'), 0, y + 0.76, 0, neck); break;
    case 'nonla': { const c = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.62, 16), mat('#e9d59a')); c.position.set(0, y + 0.66, 0); c.castShadow = true; neck.add(c); box(0.06, 0.5, 0.06, mat('#c0392b'), -0.4, y + 0.1, 0.1, neck); box(0.06, 0.5, 0.06, mat('#c0392b'), 0.4, y + 0.1, 0.1, neck); break; }
    case 'phones': box(1.0, 0.1, 0.16, m, 0, y + 0.47, 0, neck); box(0.14, 0.34, 0.34, m, -0.48, y + 0.06, 0, neck); box(0.14, 0.34, 0.34, m, 0.48, y + 0.06, 0, neck); break;
    case 'bunny': { const w = mat('#ffffff'), p = mat('#ffb3c7'); for (const s of [-1, 1]) { const e = box(0.18, 0.62, 0.12, w, 0.22 * s, y + 0.74, 0, neck); e.rotation.z = -0.14 * s; box(0.08, 0.4, 0.04, p, 0.22 * s, y + 0.74, 0.07, neck).rotation.z = -0.14 * s; } break; }
    case 'flower': { const f = mat(L.hatColor); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; box(0.12, 0.12, 0.06, f, 0.3 + Math.cos(a) * 0.1, y + 0.36 + Math.sin(a) * 0.1, 0.42, neck); } box(0.08, 0.08, 0.08, mat('#ffd400'), 0.3, y + 0.36, 0.44, neck); break; }
    case 'wizard': { const c = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 8), m); c.position.set(0, y + 0.95, 0); c.rotation.z = 0.15; c.castShadow = true; neck.add(c); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 12), m); b.position.set(0, y + 0.42, 0); neck.add(b); box(0.12, 0.12, 0.04, mat('#ffd400'), 0.1, y + 0.8, 0.36, neck); break; }
    case 'crown': { const g = mat('#ffcc00', { metalness: 0.5, roughness: 0.35 }); box(0.86, 0.16, 0.84, g, 0, y + 0.52, 0, neck); for (const [x, z] of [[-0.36, 0.36], [0, 0.36], [0.36, 0.36], [-0.36, -0.36], [0.36, -0.36]]) box(0.14, 0.22, 0.14, g, x, y + 0.68, z, neck); box(0.12, 0.12, 0.04, mat('#e53935'), 0, y + 0.52, 0.43, neck); break; }
  }
}
function addAcc(body, neck, L) {
  const y = 0.42;
  switch (L.acc) {
    case 'glasses': { const k = mat('#1d1d1f'); box(0.26, 0.04, 0.04, k, -0.2, y + 0.12, 0.42, neck); box(0.26, 0.04, 0.04, k, 0.2, y + 0.12, 0.42, neck); box(0.26, 0.04, 0.04, k, -0.2, y - 0.06, 0.42, neck); box(0.26, 0.04, 0.04, k, 0.2, y - 0.06, 0.42, neck); for (const x of [-0.33, -0.07, 0.07, 0.33]) box(0.04, 0.2, 0.04, k, x, y + 0.03, 0.42, neck); break; }
    case 'shades': box(0.74, 0.16, 0.04, mat('#111111', { roughness: 0.2 }), 0, y + 0.06, 0.42, neck); break;
    case 'bag': box(0.8, 0.8, 0.32, mat(darker(L.topColor === '#ffffff' ? '#1e88e5' : L.topColor, 0.6)), 0, 1.35, -0.42, body); box(0.6, 0.3, 0.08, mat('#ffd400'), 0, 1.2, -0.6, body); break;
    case 'scarf': box(1.0, 0.18, 0.56, mat(L.hatColor), 0, 1.84, 0, body); box(0.22, 0.5, 0.08, mat(L.hatColor), 0.24, 1.55, 0.28, body); break;
    case 'cape': { const c = box(1.0, 1.4, 0.06, mat('#c62828'), 0, 1.15, -0.32, body); c.rotation.x = 0.08; break; }
    case 'wings': { const w = mat('#ffffff', { emissive: '#bfe6ff', emissiveIntensity: 0.25 }); for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(0.2 * s, 1.55, -0.3); body.add(g); box(0.9, 0.5, 0.06, w, 0.45 * s, 0.1, 0, g); box(0.7, 0.35, 0.06, w, 0.4 * s, -0.3, 0, g); g.rotation.y = 0.35 * s; g.userData.wing = s; } break; }
    case 'halo': { const h = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 6, 20), new THREE.MeshStandardMaterial({ color: '#ffe066', emissive: '#ffcc00', emissiveIntensity: 0.8 })); h.rotation.x = Math.PI / 2; h.position.set(0, y + 0.85, 0); neck.add(h); h.userData.halo = true; break; }
  }
}

// ---------- chuyển động ----------
export function animate(av, dt) {
  const u = av.userData; u.t += dt;
  const sp = u.speed; // 0..1 tốc độ đi
  const sw = Math.sin(u.t * 9) * 0.75 * Math.min(1, sp);
  u.legs[0].rotation.x = sw; u.legs[1].rotation.x = -sw;
  if (u.pose === 'cheer') { const a = -2.6 + Math.sin(u.t * 10) * 0.3; u.arms[0].rotation.set(0, 0, -0.3); u.arms[1].rotation.set(0, 0, 0.3); u.arms[0].rotation.x = a; u.arms[1].rotation.x = a; u.body.position.y = Math.abs(Math.sin(u.t * 6)) * 0.35; }
  else if (u.pose === 'wave') { u.arms[1].rotation.set(-2.7, 0, 0.3 + Math.sin(u.t * 8) * 0.4); u.arms[0].rotation.set(0, 0, 0); u.body.position.y = 0; }
  else if (u.pose === 'sad') { u.arms[0].rotation.set(0.15, 0, 0); u.arms[1].rotation.set(0.15, 0, 0); u.neck.rotation.x = 0.35; u.body.position.y = 0; }
  else { u.arms[0].rotation.set(-sw, 0, 0); u.arms[1].rotation.set(sw, 0, 0); u.neck.rotation.x = 0; u.body.position.y = sp > 0.05 ? Math.abs(Math.sin(u.t * 9)) * 0.06 : Math.sin(u.t * 2) * 0.015; }
  av.traverse((o) => { if (o.userData.wing) o.rotation.y = (0.35 + Math.sin(u.t * 4) * 0.18) * o.userData.wing; if (o.userData.halo) o.position.y = 0.42 + 0.85 + Math.sin(u.t * 2) * 0.04; });
}
export function disposeAvatar(av) {
  av.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { if (m.map) { m.map.dispose(); m.dispose(); } }); } });
}
