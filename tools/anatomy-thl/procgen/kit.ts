/**
 * TinHocLab – bộ dụng cụ dựng hình cho bộ sinh mô hình linh kiện (đơn vị mm).
 *
 * Chuyển thể từ Teardown (https://github.com/elvarofficial/teardown, MIT), sims/v8-shared/engine.js:
 * `discGeo` (đĩa đùn có vát mép và lỗ trục), `helixGeo` → `tubeGeo` (ống theo đường cong), cách dựng
 * mọi thứ bằng code theo mm và bảng vật liệu PBR theo quy tắc trong SKILL.md: mặt lớn có roughness ≥ 0.45
 * và envMapIntensity ≈ 0.5 để không loá, phần phát sáng (RGB) giữ dưới 1.0.
 *
 * Mọi mesh có tên có nghĩa (GPU_Fan_01, RAM_PCB…), mọi bộ phận là một Group có `userData.explode`
 * (hướng × khoảng cách, mm) cho chế độ bung rời. GLTFExporter ghi userData vào "extras".
 */
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type V3 = [number, number, number];

// ---------------------------------------------------------------- vật liệu PBR
export type Palette = ReturnType<typeof palette>;
/** Màu chủ đạo của sản phẩm từ trường `color` của OpenDB. */
export function bodyColor(colors: string[], fallback = '#1c1d20') {
  const c = (colors[0] ?? '').toUpperCase();
  return c === 'WHITE' ? '#e9eaec' : c === 'SILVER' ? '#b9bdc2' : c === 'GRAY' || c === 'GREY' ? '#6c7076' : c === 'RED' ? '#a3141c' : c === 'BLUE' ? '#1d3f8a' : c === 'GREEN' ? '#2f6b3a' : c === 'GOLD' ? '#b89a55' : c === 'BLACK' ? '#1c1d20' : fallback;
}
export function palette(body = '#1c1d20', accent = '#8f959c') {
  const std = (name: string, color: string, roughness: number, metalness: number, extra: Partial<T.MeshStandardMaterialParameters> = {}) => {
    const m = new T.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.5, ...extra });
    m.name = name;
    return m;
  };
  return {
    body: std('Body', body, 0.5, 0.35),
    accent: std('Accent', accent, 0.45, 0.6),
    pcbGreen: std('PCB_Green', '#1f4d2b', 0.55, 0.05),
    pcbBlack: std('PCB_Black', '#17191b', 0.6, 0.05),
    silicon: std('Silicon', '#3a3f52', 0.25, 0.6),
    chip: std('Chip_Package', '#121315', 0.45, 0.1),
    gold: std('Gold_Contacts', '#c9a24a', 0.3, 1),
    copper: std('Copper', '#b8734a', 0.35, 1),
    alu: std('Aluminium', '#c9ccd0', 0.45, 0.85),
    aluDark: std('Aluminium_Dark', '#3b3e43', 0.48, 0.8),
    nickel: std('Nickel', '#d8dade', 0.3, 1),
    steel: std('Steel', '#8d9196', 0.45, 0.9),
    plastic: std('Plastic_Black', '#151618', 0.6, 0),
    plasticGrey: std('Plastic_Grey', '#55595f', 0.6, 0),
    plasticWhite: std('Plastic_White', '#e3e4e6', 0.55, 0),
    rubber: std('Rubber', '#0d0d0e', 0.85, 0),
    fanBlade: std('Fan_Blade', body === '#e9eaec' ? '#f1f1f3' : '#202124', 0.55, 0),
    rgb: std('RGB_Diffuser', '#f4f4f6', 0.4, 0, { emissive: new T.Color('#9a7cff'), emissiveIntensity: 0.85 }),
    glass: (() => {
      const m = new T.MeshPhysicalMaterial({ color: '#d8e2e8', roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 0.22, envMapIntensity: 0.9 });
      m.name = 'Tempered_Glass';
      return m;
    })(),
    label: std('Label', '#d9d9dc', 0.7, 0),
  };
}

// ---------------------------------------------------------------- mesh, nhóm
/** Một bộ phận: Group có tên, có hướng bung rời. */
export function part(parent: T.Object3D, name: string, explode: V3 = [0, 0, 0], at: V3 = [0, 0, 0]) {
  const g = new T.Group();
  g.name = name;
  g.position.set(...at);
  g.userData.explode = explode;
  parent.add(g);
  return g;
}
/** Một mesh có tên, đặt tại `at`, xoay `rot` (radian). */
export function mesh(parent: T.Object3D, name: string, geo: T.BufferGeometry, mat: T.Material, at: V3 = [0, 0, 0], rot: V3 = [0, 0, 0]) {
  const m = new T.Mesh(geo, mat);
  m.name = name;
  m.position.set(...at);
  m.rotation.set(...rot);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
/** Hộp, bo cạnh khi r > 0 (bo cạnh giúp ánh sáng viền đọc ra khối). */
export function box(w: number, h: number, d: number, r = 0) {
  const rr = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
  return rr > 0.05 ? new RoundedBoxGeometry(w, h, d, 2, rr) : new T.BoxGeometry(w, h, d);
}
/** Hộp có mặt đáy tại y = 0 (tiện xếp chồng). */
export const boxUp = (w: number, h: number, d: number, r = 0) => box(w, h, d, r).translate(0, h / 2, 0);

/** Đĩa đùn có vát mép và lỗ trục, trục quay theo Z (chuyển thể `discGeo` của Teardown). */
export function discGeo(r: number, width: number, holeR = 0, seg = 48, bevel = 0.6) {
  const sh = new T.Shape();
  sh.absarc(0, 0, r, 0, Math.PI * 2, false);
  if (holeR) {
    const h = new T.Path();
    h.absarc(0, 0, holeR, 0, Math.PI * 2, true);
    sh.holes.push(h);
  }
  const b = Math.min(bevel, width / 3, r / 4);
  const g = new T.ExtrudeGeometry(sh, { depth: Math.max(0.01, width - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: seg });
  g.translate(0, 0, -(width - 2 * b) / 2);
  return g;
}
/** Ống tròn theo các điểm (chuyển thể `helixGeo` của Teardown: TubeGeometry trên CatmullRom). */
export function tubeGeo(points: V3[], radius: number, seg = 48, radial = 10) {
  const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)), false, 'centripetal');
  return new T.TubeGeometry(curve, seg, radius, radial, false);
}
/** Tấm phẳng (trục dày theo Z) có các lỗ tròn – lưới thông gió, mặt quạt. */
export function perforatedPlate(w: number, h: number, thick: number, holes: { x: number; y: number; r: number }[], outerR = 0, holeSeg = 10) {
  const sh = new T.Shape();
  const x0 = -w / 2,
    y0 = -h / 2,
    r = Math.min(outerR, w / 2, h / 2);
  sh.moveTo(x0 + r, y0);
  sh.lineTo(x0 + w - r, y0);
  if (r) sh.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  sh.lineTo(x0 + w, y0 + h - r);
  if (r) sh.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  sh.lineTo(x0 + r, y0 + h);
  if (r) sh.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  sh.lineTo(x0, y0 + r);
  if (r) sh.quadraticCurveTo(x0, y0, x0 + r, y0);
  for (const o of holes) {
    const p = new T.Path();
    p.absarc(o.x, o.y, o.r, 0, Math.PI * 2, true);
    sh.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: holeSeg });
  g.translate(0, 0, -thick / 2);
  return g;
}
/** Lưới lỗ tổ ong (so le) trong khung w × h. */
export function honeycomb(w: number, h: number, r: number, gap: number) {
  const out: { x: number; y: number; r: number }[] = [];
  const dx = 2 * r + gap,
    dy = dx * 0.866;
  for (let j = 0, y = -h / 2 + r + gap; y <= h / 2 - r - gap; j++, y += dy)
    for (let x = -w / 2 + r + gap + (j % 2 ? dx / 2 : 0); x <= w / 2 - r - gap; x += dx) out.push({ x, y, r });
  return out;
}
/** Gộp nhiều hình học thành một (lá tản nhiệt, khe tản) – ít mesh, xuất GLB gọn. */
export function merged(geos: T.BufferGeometry[]) {
  const ok = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of ok) for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  return mergeGeometries(ok, false)!;
}

/**
 * Quạt: khung vuông có lỗ tròn, trục, cánh xoắn. Mặt quạt vuông góc với Z (gió thổi theo −Z).
 * size: cỡ quạt (mm, từ OpenDB), thick: bề dày khung.
 */
export function fan(parent: T.Object3D, prefix: string, size: number, thick: number, P: Palette, opts: { blades?: number; frame?: boolean; ring?: boolean; holes?: number } = {}) {
  const g = new T.Group();
  g.name = prefix;
  parent.add(g);
  const R = size / 2 - 2.5;
  if (opts.frame !== false) {
    const sh = new T.Shape();
    const h = size / 2,
      c = 4;
    sh.moveTo(-h + c, -h);
    sh.lineTo(h - c, -h);
    sh.quadraticCurveTo(h, -h, h, -h + c);
    sh.lineTo(h, h - c);
    sh.quadraticCurveTo(h, h, h - c, h);
    sh.lineTo(-h + c, h);
    sh.quadraticCurveTo(-h, h, -h, h - c);
    sh.lineTo(-h, -h + c);
    sh.quadraticCurveTo(-h, -h, -h + c, -h);
    const hole = new T.Path();
    hole.absarc(0, 0, R + 1, 0, Math.PI * 2, true);
    sh.holes.push(hole);
    // lỗ bắt vít ở bốn góc theo khoảng cách chuẩn của cỡ quạt
    const hp = (opts.holes ?? size * 0.875) / 2;
    for (const [x, y] of [[-hp, -hp], [hp, -hp], [hp, hp], [-hp, hp]]) {
      const p = new T.Path();
      p.absarc(x, y, 2.2, 0, Math.PI * 2, true);
      sh.holes.push(p);
    }
    const geo = new T.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 32 });
    geo.translate(0, 0, -thick / 2);
    mesh(g, prefix + '_Frame', geo, P.plastic);
  }
  if (opts.ring) mesh(g, prefix + '_RGBRing', new T.TorusGeometry(R + 0.4, 0.9, 6, 64), P.rgb, [0, 0, thick / 2 - 0.9]);
  const hubR = size * 0.17;
  mesh(g, prefix + '_Hub', discGeo(hubR, thick * 0.72, 0, 32), P.plastic);
  mesh(g, prefix + '_Label', discGeo(hubR * 0.8, 0.4, 0, 32), P.label, [0, 0, thick * 0.36 + 0.2]);
  // cánh: hình cánh đùn mỏng, xoắn quanh trục bán kính để có góc tấn
  const n = opts.blades ?? 9;
  const blade = new T.Shape();
  blade.moveTo(hubR - 1, -size * 0.06);
  blade.quadraticCurveTo(R * 0.7, -size * 0.14, R - 0.8, -size * 0.04);
  blade.quadraticCurveTo(R * 0.75, size * 0.11, hubR - 1, size * 0.07);
  blade.closePath();
  const bg = new T.ExtrudeGeometry(blade, { depth: 1.1, bevelEnabled: false, curveSegments: 10 });
  const pos = bg.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    // xoắn: điểm càng xa trục càng nghiêng
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    const tw = 0.55 + (0.25 * (x - hubR)) / (R - hubR);
    pos.setXYZ(i, x, y * Math.cos(tw) - (z - 0.55) * Math.sin(tw), y * Math.sin(tw) * 0.9 + (z - 0.55) * Math.cos(tw));
  }
  bg.computeVertexNormals();
  const blades: T.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) blades.push(bg.clone().rotateZ((i / n) * Math.PI * 2));
  mesh(g, prefix + '_Blades', merged(blades), P.fanBlade);
  g.userData.spin = true;
  return g;
}
