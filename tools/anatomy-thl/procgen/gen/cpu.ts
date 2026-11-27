/**
 * CPU: đế (substrate), mặt tiếp xúc LGA / chân PGA, die (AMD: CCD + I/O die; Intel: một die), lớp hàn,
 * nắp IHS, dấu tam giác chân số 1. Hệ trục: mặt phẳng XY, +Z lên khỏi socket. Gốc: giữa mặt dưới đế.
 */
import * as T from 'three';
import { box, merged, mesh, palette, part } from '../kit.ts';
import { D, F, type Spec } from '../spec.ts';

export function generateCPU(spec: Spec) {
  const W = D(spec, 'width'),
    Dp = D(spec, 'depth'),
    sub = D(spec, 'substrate'),
    ihsH = D(spec, 'ihsHeight');
  const amd = F<string>(spec, 'vendor') === 'AMD';
  const P = palette();
  const root = new T.Group();
  root.name = 'CPU';

  const base = part(root, 'CPU_Package');
  const substrate = new T.MeshStandardMaterial({ color: amd ? '#2e5a33' : '#24452c', roughness: 0.55, metalness: 0.1, envMapIntensity: 0.5 });
  substrate.name = 'CPU_Substrate';
  mesh(base, 'CPU_Substrate', box(W, Dp, sub, 0.4), substrate, [0, 0, sub / 2]);
  // dấu tam giác vàng chỉ chân số 1 (căn với dấu trên socket khi lắp)
  const tri = new T.Shape();
  tri.moveTo(0, 0);
  tri.lineTo(3.2, 0);
  tri.lineTo(0, 3.2);
  tri.closePath();
  mesh(base, 'CPU_Pin1_Mark', new T.ExtrudeGeometry(tri, { depth: 0.05, bevelEnabled: false }), P.gold, [-W / 2 + 0.8, -Dp / 2 + 0.8, sub]);

  const contacts = part(root, 'CPU_Contacts', [0, 0, -8]);
  const pads: T.BufferGeometry[] = [];
  const pitch = 1.6; // thưa hơn thực tế (~1 mm) để file nhẹ; hình ảnh vẫn đọc ra mặt tiếp xúc
  if (F(spec, 'contacts') === 'PGA') {
    for (let x = -W / 2 + 2; x <= W / 2 - 2; x += pitch * 1.2) for (let y = -Dp / 2 + 2; y <= Dp / 2 - 2; y += pitch * 1.2) if (Math.abs(x) > 5 || Math.abs(y) > 5) pads.push(new T.CylinderGeometry(0.15, 0.15, 1.5, 4, 1, true).rotateX(Math.PI / 2).translate(x, y, -0.75));
  } else {
    // mặt LGA: lưới đệm tiếp xúc mạ vàng, chừa vùng giữa
    for (let x = -W / 2 + 2; x <= W / 2 - 2; x += pitch) for (let y = -Dp / 2 + 2; y <= Dp / 2 - 2; y += pitch) if (Math.abs(x) > W * 0.22 || Math.abs(y) > Dp * 0.22) pads.push(new T.PlaneGeometry(0.9, 0.9).rotateX(Math.PI).translate(x, y, -0.01));
  }
  mesh(contacts, 'CPU_Contacts', merged(pads), P.gold);

  const dies = part(root, 'CPU_Dies', [0, 0, 7]);
  const [ccd, iod] = F<number[]>(spec, 'dies');
  const dz = sub + 0.4;
  if (amd) {
    for (let i = 0; i < ccd; i++) mesh(dies, `CPU_Die_CCD_${String(i + 1).padStart(2, '0')}`, box(10.5, 6.8, 0.75), P.silicon, [W * 0.18, (i - (ccd - 1) / 2) * 8.5 + (ccd === 1 ? Dp * 0.12 : 0), dz]);
    if (iod) mesh(dies, 'CPU_Die_IO', box(12.5, 9.8, 0.75), P.silicon, [-W * 0.17, 0, dz]);
  } else mesh(dies, 'CPU_Die_01', box(W * 0.5, Dp * 0.42, 0.75), P.silicon, [0, 0, dz]);
  mesh(dies, 'CPU_TIM', box(W * 0.62, Dp * 0.55, 0.15), P.nickel, [0, 0, dz + 0.45]);

  // IHS: AMD AM5 có các "tai" lõm hai bên chừa chỗ cho tụ; Intel LGA1700 có tai hai đầu
  const ihs = part(root, 'CPU_IHS', [0, 0, 16]);
  const iw = W * (amd ? 0.83 : 0.78),
    id = Dp * (amd ? 0.83 : 0.72);
  const sh = new T.Shape();
  const r = 2.5;
  sh.moveTo(-iw / 2 + r, -id / 2);
  if (amd) {
    // khoét nửa giữa mỗi cạnh dọc trục X
    sh.lineTo(-iw / 6, -id / 2);
    sh.lineTo(-iw / 6, -id / 2 + 3);
    sh.lineTo(iw / 6, -id / 2 + 3);
    sh.lineTo(iw / 6, -id / 2);
  }
  sh.lineTo(iw / 2 - r, -id / 2);
  sh.quadraticCurveTo(iw / 2, -id / 2, iw / 2, -id / 2 + r);
  sh.lineTo(iw / 2, id / 2 - r);
  sh.quadraticCurveTo(iw / 2, id / 2, iw / 2 - r, id / 2);
  if (amd) {
    sh.lineTo(iw / 6, id / 2);
    sh.lineTo(iw / 6, id / 2 - 3);
    sh.lineTo(-iw / 6, id / 2 - 3);
    sh.lineTo(-iw / 6, id / 2);
  }
  sh.lineTo(-iw / 2 + r, id / 2);
  sh.quadraticCurveTo(-iw / 2, id / 2, -iw / 2, id / 2 - r);
  sh.lineTo(-iw / 2, -id / 2 + r);
  sh.quadraticCurveTo(-iw / 2, -id / 2, -iw / 2 + r, -id / 2);
  const lid = new T.ExtrudeGeometry(sh, { depth: ihsH - 0.8, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2, curveSegments: 6 });
  mesh(ihs, 'CPU_IHS', lid, P.nickel, [0, 0, sub + 0.4]);
  if (amd) {
    // tụ SMD lộ trên mặt đế ở chỗ khoét
    const caps: T.BufferGeometry[] = [];
    for (const s of [-1, 1]) for (let x = -iw / 7; x <= iw / 7; x += 1.6) caps.push(box(1, 0.5, 0.5).translate(x, s * (id / 2 - 1.3), sub + 0.25));
    mesh(base, 'CPU_Capacitors', merged(caps), P.steel);
  }
  return root;
}
