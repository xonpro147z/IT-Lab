// Đảo IC3 – dựng bản đồ: đảo cỏ, đường đá, cây hoa, hàng rào, Thư viện Ôn luyện, Đấu trường, Tủ đồ, Bảng vàng.
import * as THREE from 'three';
import { makeAvatar, randomLook } from './avatar.js';

const M = new Map();
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!M.has(k)) M.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true, ...o })); return M.get(k); };
function mesh(geo, m, x = 0, y = 0, z = 0, parent, cast = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; parent.add(o); return o; }
const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();

export const ZONES = {
  study: { name: 'Khu ôn luyện', icon: '📚', pos: [-20, -15], color: '#ffcf3f' },
  arena: { name: 'Đấu trường', icon: '⚔️', pos: [22, -16], color: '#e53935' },
  closet: { name: 'Tủ đồ thời trang', icon: '👕', pos: [-18, 15], color: '#ff7eb6' },
  board: { name: 'Bảng vàng', icon: '🏆', pos: [17, 15], color: '#ffd400' },
  home: { name: 'Về TinHocLab', icon: '🏠', pos: [0, 41], color: '#43a047' },
};
export const ISLAND_R = 45;

export function buildWorld(scene) {
  const W = { colliders: [], triggers: [], labels: [], updaters: [], podium: [], arenaSpots: [] };
  const root = new THREE.Group(); scene.add(root);
  const col = (x, z, r) => W.colliders.push({ x, z, r });

  // ---------- nước & đảo ----------
  const water = mesh(new THREE.CircleGeometry(160, 48), new THREE.MeshStandardMaterial({ color: '#5ec8f2', roughness: 0.25, metalness: 0.1 }), 0, -0.9, 0, root, false); water.rotation.x = -Math.PI / 2;
  mesh(new THREE.CylinderGeometry(ISLAND_R + 1.2, ISLAND_R - 1, 2.4, 48), mat('#b98a55'), 0, -1.25, 0, root);
  const grass = mesh(new THREE.CylinderGeometry(ISLAND_R + 1.2, ISLAND_R + 1.2, 0.3, 48), mat('#8fd46a'), 0, -0.15, 0, root, false); grass.name = 'ground';
  W.ground = grass;
  // các mảng cỏ đậm nhạt
  for (let i = 0; i < 40; i++) { const a = rnd() * Math.PI * 2, r = rnd() * (ISLAND_R - 4); const p = mesh(new THREE.CircleGeometry(1.5 + rnd() * 3, 7), mat(rnd() > 0.5 ? '#84cc5f' : '#9adb74'), Math.cos(a) * r, 0.01, Math.sin(a) * r, root, false); p.rotation.x = -Math.PI / 2; }

  // ---------- quảng trường & đài phun nước ----------
  const plaza = mesh(new THREE.CylinderGeometry(7, 7, 0.12, 24), mat('#e6dfd2'), 0, 0.02, 0, root, false);
  mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.7, 16), mat('#cfc6b6'), 0, 0.35, 0, root);
  const fw = mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.1, 16), new THREE.MeshStandardMaterial({ color: '#66d0ff', roughness: 0.1, emissive: '#1a7fb5', emissiveIntensity: 0.15 }), 0, 0.66, 0, root, false);
  mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.6, 8), mat('#cfc6b6'), 0, 1.3, 0, root);
  mesh(new THREE.CylinderGeometry(1.0, 0.4, 0.3, 12), mat('#cfc6b6'), 0, 2.1, 0, root);
  const jet = mesh(new THREE.ConeGeometry(0.5, 1.4, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#bfeaff', transparent: true, opacity: 0.7, emissive: '#7fd3ff', emissiveIntensity: 0.4 }), 0, 2.9, 0, root, false);
  W.updaters.push((t) => { jet.scale.y = 1 + Math.sin(t * 4) * 0.12; fw.material.emissiveIntensity = 0.12 + Math.sin(t * 2) * 0.05; });
  col(0, 0, 2.8);

  // ---------- đường đá ----------
  const stone = mat('#d9d4cb');
  const path = (x0, z0, x1, z1) => {
    const n = Math.floor(Math.hypot(x1 - x0, z1 - z0) / 1.6);
    for (let i = 0; i <= n; i++) { const t = i / n; const s = mesh(new THREE.CylinderGeometry(0.55 + rnd() * 0.2, 0.6, 0.12, 7), stone, x0 + (x1 - x0) * t + (rnd() - 0.5) * 0.7, 0.03, z0 + (z1 - z0) * t + (rnd() - 0.5) * 0.7, root, false); s.rotation.y = rnd() * 3; }
  };
  path(-5, -4, -15, -11); path(5, -4, 14, -13); path(-5, 5, -14, 12); path(5, 5, 13, 12); path(0, 7, 0, 38);

  // ---------- cây, bụi, đá, hoa ----------
  const tree = (x, z, kind = 'round', s = 1) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    mesh(new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 1.6 * s, 6), mat('#8a5a35'), 0, 0.8 * s, 0, g);
    if (kind === 'pine') { mesh(new THREE.ConeGeometry(1.6 * s, 2.4 * s, 7), mat('#3e9b4f'), 0, 2.3 * s, 0, g); mesh(new THREE.ConeGeometry(1.2 * s, 1.9 * s, 7), mat('#47ad59'), 0, 3.4 * s, 0, g); }
    else if (kind === 'cherry') { for (let i = 0; i < 4; i++) mesh(new THREE.IcosahedronGeometry((0.9 + rnd() * 0.4) * s, 0), mat(i % 2 ? '#ffb3cf' : '#ff9cc2'), (rnd() - 0.5) * 1.4 * s, (2.2 + rnd() * 0.8) * s, (rnd() - 0.5) * 1.4 * s, g); }
    else mesh(new THREE.IcosahedronGeometry(1.5 * s, 0), mat(rnd() > 0.5 ? '#5bbf5a' : '#6ccb63'), 0, 2.6 * s, 0, g);
    g.rotation.y = rnd() * 6; col(x, z, 0.8 * s); return g;
  };
  const bush = (x, z) => { const b = mesh(new THREE.IcosahedronGeometry(0.7 + rnd() * 0.3, 0), mat('#4fae55'), x, 0.5, z, root); b.scale.y = 0.75; };
  const rock = (x, z, s = 1) => { const r = mesh(new THREE.DodecahedronGeometry(0.6 * s, 0), mat('#a3a8ad'), x, 0.3 * s, z, root); r.rotation.set(rnd(), rnd(), rnd()); col(x, z, 0.6 * s); };
  const flowers = (x, z, n = 8) => { const cs = ['#ff5a7a', '#ffd400', '#ffffff', '#b36bff', '#ff8a3d']; for (let i = 0; i < n; i++) { const fx = x + (rnd() - 0.5) * 3, fz = z + (rnd() - 0.5) * 3; mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4), mat('#3d8b3d'), fx, 0.2, fz, root, false); mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), mat(cs[i % 5]), fx, 0.45, fz, root, false); } };
  const away = (x, z) => [[0, 0, 9], ...Object.values(ZONES).map((zz) => [zz.pos[0], zz.pos[1], 11]), [2, 27, 7]].every(([a, b, r]) => Math.hypot(x - a, z - b) > r);
  let k = 0;
  while (k < 70) {
    const a = rnd() * Math.PI * 2, r = 12 + rnd() * (ISLAND_R - 15), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!away(x, z) || Math.abs(x) < 3 && z > 6) continue;
    const t = rnd(); if (t < 0.35) tree(x, z, 'cherry', 0.9 + rnd() * 0.4); else if (t < 0.6) tree(x, z, 'round', 0.8 + rnd() * 0.5); else if (t < 0.75) tree(x, z, 'pine', 0.9 + rnd() * 0.4); else if (t < 0.88) bush(x, z); else rock(x, z, 0.7 + rnd());
    k++;
  }
  for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, r = 9 + rnd() * 32, x = Math.cos(a) * r, z = Math.sin(a) * r; if (away(x, z)) flowers(x, z, 5); }

  // ---------- hàng rào quanh đảo ----------
  const wood = mat('#c79058'), wood2 = mat('#a8743f');
  const N = 72;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, x = Math.cos(a) * (ISLAND_R - 1.2), z = Math.sin(a) * (ISLAND_R - 1.2);
    if (Math.abs(a - Math.PI / 2) < 0.05) continue; // lối ra cổng TinHocLab
    mesh(new THREE.BoxGeometry(0.25, 1.2, 0.25), wood2, x, 0.6, z, root);
    const a2 = ((i + 0.5) / N) * Math.PI * 2, len = (2 * Math.PI * (ISLAND_R - 1.2)) / N;
    for (const y of [0.45, 0.9]) { const r = mesh(new THREE.BoxGeometry(len, 0.12, 0.08), wood, Math.cos(a2) * (ISLAND_R - 1.2), y, Math.sin(a2) * (ISLAND_R - 1.2), root); r.rotation.y = -a2 + Math.PI / 2; }
  }

  // ---------- Thư viện Ôn luyện ----------
  {
    const [x, z] = ZONES.study.pos; const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    const face = Math.atan2(-x, -z); g.rotation.y = face; // cửa hướng về quảng trường
    mesh(new THREE.CylinderGeometry(6.4, 6.6, 0.4, 10), mat('#d9cbb0'), 0, 0.2, 0, g);
    mesh(new THREE.CylinderGeometry(5.6, 5.6, 4, 10), mat('#f6e7c8'), 0, 2.4, 0, g);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 10; mesh(new THREE.BoxGeometry(0.5, 4, 0.5), mat('#c9a77a'), Math.sin(a) * 5.7, 2.4, Math.cos(a) * 5.7, g); }
    for (const [r, h, y, c] of [[7.6, 2.2, 5.4, '#ffcf3f'], [6.0, 1.9, 6.9, '#ffd95e'], [3.6, 1.6, 8.3, '#ffcf3f']]) mesh(new THREE.CylinderGeometry(r * 0.55, r, h, 10), mat(c), 0, y, 0, g);
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 6), mat('#6b4a2b'), 0, 9.6, 0, g); mesh(new THREE.IcosahedronGeometry(0.4, 0), mat('#7ed957'), 0, 10.3, 0, g);
    // cửa + bậc + cửa sổ + biển sách
    mesh(new THREE.BoxGeometry(2.2, 3, 0.4), mat('#8a5a35'), 0, 1.9, 5.55, g); mesh(new THREE.BoxGeometry(2.6, 0.3, 1.4), mat('#cfc6b6'), 0, 0.15, 6.6, g);
    for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(1.2, 1.2, 0.3), mat('#9fdcff', { emissive: '#5bb8e6', emissiveIntensity: 0.2 }), s * 3.2, 2.8, 4.75, g).rotation.y = s * -0.55; }
    const sign = mesh(new THREE.BoxGeometry(3.4, 1.1, 0.25), mat('#fff6db'), 0, 4.0, 5.75, g); sign.material = new THREE.MeshStandardMaterial({ map: textTex('📚 ÔN LUYỆN', '#fff6db', '#7a4a12'), roughness: 0.8 });
    col(x, z, 6.4);
    const door = new THREE.Vector3(0, 0, 8.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), face).add(new THREE.Vector3(x, 0, z));
    W.triggers.push({ id: 'study', x: door.x, z: door.z, r: 3 });
    W.labels.push({ id: 'study', text: 'Khu ôn luyện', icon: '📚', pos: new THREE.Vector3(x, 11.5, z) });
  }

  // ---------- Đấu trường ----------
  {
    const [x, z] = ZONES.arena.pos; const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    const R = 12, gateA = Math.atan2(-z, -x); // cổng hướng về quảng trường
    W.arena = { x, z, R: R - 1.2, gateA };
    mesh(new THREE.CylinderGeometry(R, R, 0.16, 40), mat('#e9c98b'), 0, 0.05, 0, g, false);
    const ring = mesh(new THREE.RingGeometry(4.2, 4.8, 40), mat('#d4ad6a'), 0, 0.15, 0, g, false); ring.rotation.x = -Math.PI / 2;
    const em = mesh(new THREE.CircleGeometry(3, 6), new THREE.MeshStandardMaterial({ map: textTex('IC3', '#c94a3a', '#fff4d6', 80), roughness: 0.8 }), 0, 0.16, 0, g, false); em.rotation.x = -Math.PI / 2;
    const segs = 36, stoneM = mat('#cfc3b0'), stone2 = mat('#b9ab96'), red = mat('#d73b32'), blue = mat('#2f6fd6');
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2; let d = Math.abs(((a - gateA + Math.PI) % (2 * Math.PI)) - Math.PI); if (d < 0.32) continue;
      const sx = Math.cos(a) * R, sz = Math.sin(a) * R, len = (2 * Math.PI * R) / segs + 0.05;
      const wall = mesh(new THREE.BoxGeometry(len, 2.6, 1.2), i % 2 ? stoneM : stone2, sx, 1.3, sz, g); wall.rotation.y = -a + Math.PI / 2;
      const st = mesh(new THREE.BoxGeometry(len, 1.2, 1.6), stone2, Math.cos(a) * (R + 1.3), 0.6, Math.sin(a) * (R + 1.3), g); st.rotation.y = -a + Math.PI / 2;
      W.colliders.push({ x: x + sx, z: z + sz, r: 1.2 });
      if (i % 4 === 0) { mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 6), mat('#6b4a2b'), sx, 2.5, sz, g); const f = mesh(new THREE.BoxGeometry(1.4, 0.9, 0.05), i % 8 ? red : blue, sx + Math.cos(a + 1.57) * 0.75, 4.4, sz + Math.sin(a + 1.57) * 0.75, g); f.rotation.y = -a; W.updaters.push((t) => { f.rotation.y = -a + Math.sin(t * 3 + i) * 0.25; }); }
    }
    // cổng
    const gx = Math.cos(gateA) * R, gz = Math.sin(gateA) * R;
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(1.2, 5.2, 1.2), mat('#a33a2a'), gx + Math.cos(gateA + Math.PI / 2) * 2.9 * s, 2.6, gz + Math.sin(gateA + Math.PI / 2) * 2.9 * s, g);
    const lintel = mesh(new THREE.BoxGeometry(7.4, 1.3, 1.4), new THREE.MeshStandardMaterial({ map: textTex('⚔ ĐẤU TRƯỜNG', '#a33a2a', '#ffe08a'), roughness: 0.8 }), gx, 5.4, gz, g); lintel.rotation.y = -gateA + Math.PI / 2;
    // bục vinh quang
    const pdA = gateA + Math.PI, px = Math.cos(pdA) * 6.6, pz = Math.sin(pdA) * 6.6, side = new THREE.Vector3(Math.cos(pdA + Math.PI / 2), 0, Math.sin(pdA + Math.PI / 2));
    [[0, 1.6, '#ffd400'], [-2.2, 1.1, '#cfd6de'], [2.2, 0.7, '#e3a066']].forEach(([o, h, c], i) => {
      const bx = px + side.x * o, bz = pz + side.z * o;
      const b = mesh(new THREE.BoxGeometry(2, h, 2), mat(c, { metalness: i === 0 ? 0.3 : 0.1 }), bx, h / 2, bz, g);
      const n = mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshStandardMaterial({ map: textTex(String(i + 1), c, '#1d1d1f', 90), roughness: 0.8 }), bx + Math.cos(gateA) * 1.01, h / 2, bz + Math.sin(gateA) * 1.01, g); n.rotation.y = -gateA + Math.PI / 2;
      W.podium.push(new THREE.Vector3(x + bx, h, z + bz));
    });
    // chỗ đứng trong sảnh chờ: các vòng tròn quanh tâm
    for (let ring = 0; ring < 4; ring++) { const rr = 3.2 + ring * 2.1, n = 8 + ring * 6; for (let i = 0; i < n; i++) { const a = gateA + (i / n) * Math.PI * 2 + ring * 0.2; W.arenaSpots.push(new THREE.Vector3(x + Math.cos(a) * rr, 0, z + Math.sin(a) * rr)); } }
    W.triggers.push({ id: 'arena', x: x + Math.cos(gateA) * (R + 2.5), z: z + Math.sin(gateA) * (R + 2.5), r: 3.4 });
    W.labels.push({ id: 'arena', text: 'Đấu trường', icon: '⚔️', pos: new THREE.Vector3(x + gx, 7.6, z + gz) });
  }

  // ---------- Tủ đồ thời trang ----------
  {
    const [x, z] = ZONES.closet.pos; const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    const face = Math.atan2(-x, -z); g.rotation.y = face;
    mesh(new THREE.BoxGeometry(7, 0.3, 5), mat('#e7d7bb'), 0, 0.15, 0, g);
    mesh(new THREE.BoxGeometry(6.6, 3.2, 0.3), mat('#ffffff'), 0, 1.9, -2.3, g);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.3, 3.4, 4.6), mat('#ffffff'), s * 3.3, 1.9, 0, g);
    for (let i = 0; i < 8; i++) { const st = mesh(new THREE.BoxGeometry(0.9, 0.12, 5.6), mat(i % 2 ? '#ffffff' : '#ff6aa6'), -3.15 + i * 0.9, 3.9, 0.2, g); st.rotation.x = 0.28; }
    for (let i = 0; i < 8; i++) mesh(new THREE.ConeGeometry(0.45, 0.5, 3), mat(i % 2 ? '#ffffff' : '#ff6aa6'), -3.15 + i * 0.9, 3.05, 3.05, g).rotation.x = Math.PI;
    mesh(new THREE.BoxGeometry(5.6, 0.12, 0.12), mat('#9aa0a6', { metalness: 0.6 }), 0, 3.0, -1.6, g);
    const cols = ['#e53935', '#1e88e5', '#ffd400', '#43a047', '#8e24aa', '#ff9800'];
    for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(0.8, 1.0, 0.1), mat(cols[i]), -2.4 + i * 0.95, 2.4, -1.6, g);
    const mirror = mesh(new THREE.BoxGeometry(1.2, 2.4, 0.1), new THREE.MeshStandardMaterial({ color: '#dff4ff', roughness: 0.05, metalness: 0.8 }), 2.4, 1.6, -2.1, g);
    const sign = mesh(new THREE.BoxGeometry(3.6, 0.9, 0.2), new THREE.MeshStandardMaterial({ map: textTex('👕 TỦ ĐỒ', '#ff6aa6', '#ffffff'), roughness: 0.8 }), 0, 4.6, 2.6, g); sign.rotation.x = -0.1;
    // ma-nơ-canh mặc đồ ngẫu nhiên
    for (const s of [-1, 1]) { const av = makeAvatar(randomLook()); av.position.set(s * 4.6, 0, 2.2); av.rotation.y = s * 0.4; av.userData.pose = 'wave'; g.add(av); W.mannequins = (W.mannequins || []).concat(av); mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 12), mat('#ffffff'), s * 4.6, 0.1, 2.2, g); { const v = new THREE.Vector3(s * 4.6, 0, 2.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), face); col(x + v.x, z + v.z, 0.9); } }
    col(x, z, 3.8);
    const door = new THREE.Vector3(0, 0, 5).applyAxisAngle(new THREE.Vector3(0, 1, 0), face).add(new THREE.Vector3(x, 0, z));
    W.triggers.push({ id: 'closet', x: door.x, z: door.z, r: 3 });
    W.labels.push({ id: 'closet', text: 'Tủ đồ thời trang', icon: '👕', pos: new THREE.Vector3(x, 6.2, z) });
  }

  // ---------- Bảng vàng ----------
  {
    const [x, z] = ZONES.board.pos; const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    const face = Math.atan2(-x, -z); g.rotation.y = face;
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.4, 4.6, 0.4), wood2, s * 3, 2.3, 0, g);
    const board = mesh(new THREE.BoxGeometry(6.6, 4, 0.3), mat('#7a5230'), 0, 3, 0, g);
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 300;
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    mesh(new THREE.PlaneGeometry(6.1, 3.55), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), 0, 3, 0.16, g, false);
    mesh(new THREE.BoxGeometry(7.2, 0.5, 0.6), mat('#ffcf3f'), 0, 5.2, 0, g);
    W.board = { canvas, tex };
    col(x, z, 3.4);
    const front = new THREE.Vector3(0, 0, 3.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), face).add(new THREE.Vector3(x, 0, z));
    W.triggers.push({ id: 'board', x: front.x, z: front.z, r: 3 });
    W.labels.push({ id: 'board', text: 'Bảng vàng', icon: '🏆', pos: new THREE.Vector3(x, 6.4, z) });
  }

  // ---------- ao nước ----------
  {
    const px = 2, pz = 27; const pond = mesh(new THREE.CircleGeometry(5, 18), new THREE.MeshStandardMaterial({ color: '#4fc3f7', roughness: 0.15, metalness: 0.1 }), px, 0.04, pz, root, false); pond.rotation.x = -Math.PI / 2;
    const rim = mesh(new THREE.RingGeometry(5, 5.6, 18), mat('#cfc6b6'), px, 0.05, pz, root, false); rim.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 5; i++) { const l = mesh(new THREE.CircleGeometry(0.6, 6), mat('#58b05a'), px + (rnd() - 0.5) * 6, 0.07, pz + (rnd() - 0.5) * 6, root, false); l.rotation.x = -Math.PI / 2; }
    col(px, pz, 5.2);
  }

  // ---------- cổng về TinHocLab ----------
  {
    const gx = 0, gz = ISLAND_R - 2;
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.6, 4, 0.6), mat('#2e7d32'), s * 2.2, 2, gz, root);
    mesh(new THREE.BoxGeometry(5.4, 1, 0.5), new THREE.MeshStandardMaterial({ map: textTex('🏠 TinHocLab', '#2e7d32', '#ffffff'), roughness: 0.8 }), gx, 4.1, gz, root);
    W.triggers.push({ id: 'home', x: gx, z: gz - 2.5, r: 2.6 });
  }
  // đèn & ghế dọc đường chính
  for (const z of [12, 20, 30]) for (const s of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.1, 0.12, 3, 6), mat('#3a3f45'), s * 2.4, 1.5, z, root);
    mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat('#fff3b0', { emissive: '#ffd54f', emissiveIntensity: 0.6 }), s * 2.4, 3.1, z, root); col(s * 2.4, z, 0.3);
  }
  W.root = root;
  return W;
}

export function textTex(text, bg, fg, size = 60) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.fillStyle = fg; g.font = `800 ${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function drawBoard(W, rows, title) {
  const { canvas: c, tex } = W.board; const g = c.getContext('2d');
  g.fillStyle = '#2f5d3a'; g.fillRect(0, 0, 512, 300);
  g.fillStyle = '#ffe08a'; g.font = '800 30px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(title, 256, 40);
  g.textAlign = 'left'; g.font = '600 24px system-ui, sans-serif';
  if (!rows.length) { g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('Chưa có ai – hãy là người đầu tiên!', 256, 160); }
  rows.slice(0, 6).forEach((r, i) => { const y = 82 + i * 36; g.fillStyle = ['#ffd400', '#e0e6ee', '#f0a868'][i] || '#ffffff'; g.fillText(`${i + 1}. ${r.name}`.slice(0, 26), 30, y); g.textAlign = 'right'; g.fillText(`${r.xp} XP`, 482, y); g.textAlign = 'left'; });
  tex.needsUpdate = true;
}
