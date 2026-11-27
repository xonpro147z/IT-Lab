/**
 * Bộ nguồn: vỏ (nắp chữ U + đáy), quạt và lưới quạt, lưới tổ ong mặt sau, ổ cắm AC IEC C14, công tắc,
 * bảng cắm dây rời (modular) với số cổng theo `connectors` của OpenDB, và linh kiện bên trong (minh hoạ).
 * Hệ trục như khi đặt ở khoang dưới thùng máy: dài theo X (mặt sau ở −X), cao theo Y, rộng theo Z,
 * quạt hướng xuống (−Y). Gốc: tâm khối.
 */
import * as T from 'three';
import { bodyColor, box, discGeo, fan, honeycomb, merged, mesh, palette, part, perforatedPlate } from '../kit.ts';
import { D, F, type Spec } from '../spec.ts';

export function generatePSU(spec: Spec) {
  const L = D(spec, 'length'),
    W = D(spec, 'width'),
    H = D(spec, 'height'),
    fs = D(spec, 'fan');
  const P = palette(bodyColor(F<string[]>(spec, 'color')), '#3a3d42');
  const root = new T.Group();
  root.name = 'PSU';
  const t = 1.0;
  // vỏ: nắp chữ U (trên + hai bên) bung lên trên; đáy có lỗ quạt
  const cover = part(root, 'PSU_Cover', [0, 45, 0]);
  mesh(cover, 'PSU_Cover_Top', box(L, t, W, 0.5), P.body, [0, H / 2 - t / 2, 0]);
  for (const s of [-1, 1]) mesh(cover, s < 0 ? 'PSU_Cover_Side_L' : 'PSU_Cover_Side_R', box(L, H - t, t, 0.5), P.body, [0, -t / 2, s * (W / 2 - t / 2)]);
  mesh(cover, 'PSU_Label', box(L * 0.45, H * 0.35, 0.1), P.plasticGrey, [0, 0, W / 2 + 0.06]);
  const fanless = F<boolean>(spec, 'fanless');
  const bottomGeo = perforatedPlate(L, W, t, fanless ? [] : [{ x: 0, y: 0, r: fs / 2 - 1 }], 1);
  bottomGeo.rotateX(Math.PI / 2);
  mesh(part(root, 'PSU_Housing'), 'PSU_Housing_Bottom', bottomGeo, P.body, [0, -H / 2 + t / 2, 0]);

  if (!fanless) {
    const fp = part(root, 'PSU_Fan', [0, -30, 0]);
    const f = fan(fp, 'PSU_Fan', fs - 4, 15, P, { frame: false, blades: 7 });
    f.rotation.x = Math.PI / 2;
    f.position.set(0, -H / 2 + 10, 0);
    // lưới quạt: các vòng đồng tâm + thanh chữ thập
    const wires: T.BufferGeometry[] = [];
    for (let r = 12; r < fs / 2 - 2; r += 9) wires.push(new T.TorusGeometry(r, 0.6, 4, 48).rotateX(Math.PI / 2).translate(0, -H / 2 - 0.8, 0));
    for (const a of [0, Math.PI / 2]) wires.push(box(fs - 4, 1.2, 1.2).rotateY(a).translate(0, -H / 2 - 0.8, 0));
    mesh(part(root, 'PSU_FanGrille', [0, -45, 0]), 'PSU_FanGrille', merged(wires), P.steel);
  }

  // mặt sau (−X): lưới tổ ong, ổ cắm AC, công tắc
  const rear = part(root, 'PSU_Rear', [-30, 0, 0]);
  const rw = W - 2 * t,
    rh = H - 2 * t;
  const holes = honeycomb(rw * 0.58, rh - 8, 3.2, 1.4).map((h) => ({ x: h.x + rw * 0.2, y: h.y, r: h.r }));
  const rg = perforatedPlate(rw, rh, t, holes, 1, 6);
  rg.rotateY(Math.PI / 2);
  mesh(rear, 'PSU_RearVent', rg, P.body, [-L / 2 + t / 2, 0, 0]);
  mesh(rear, 'PSU_ACInlet', box(4, 24, 31, 1.5), P.plastic, [-L / 2 - 1, -H * 0.08, -W / 2 + 26]);
  mesh(rear, 'PSU_Switch', box(4, 13, 9, 0.8), P.plastic, [-L / 2 - 1, -H * 0.08, -W / 2 + 47]);

  // mặt trước (+X): bảng cắm dây rời theo số cổng thật của OpenDB
  const front = part(root, 'PSU_Front', [30, 0, 0]);
  mesh(front, 'PSU_FrontPlate', box(t, rh, rw, 0.4), P.body, [L / 2 - t / 2, 0, 0]);
  const modular = F<string>(spec, 'modular');
  const c = (F<Record<string, number>>(spec, 'connectors') ?? {}) as Record<string, number>;
  if (modular !== 'Non-Modular') {
    // cổng trên bảng: 24 chân (2 ổ), EPS 8 chân, PCIe, ổ ngoại vi (SATA/Molex, ~4 đầu mỗi dây)
    const ports: [string, number, number][] = [];
    if (modular === 'Full' && (c.atx_24_pin ?? 1)) ports.push(['ATX24_A', 18, 9], ['ATX24_B', 13, 9]);
    for (let i = 0; i < (c.eps_8_pin ?? 1); i++) ports.push([`EPS_${i + 1}`, 13, 9]);
    for (let i = 0; i < Math.min(6, c.pcie_6_plus_2_pin ?? 2); i++) ports.push([`PCIe_${i + 1}`, 13, 9]);
    if (c.pcie_12vhpwr) ports.push(['12VHPWR', 15, 7]);
    for (let i = 0; i < Math.ceil(((c.sata ?? 4) + (c.molex_4_pin ?? 0)) / 4); i++) ports.push([`Peripheral_${i + 1}`, 13, 9]);
    const panel = part(front, 'PSU_ModularPanel');
    const cols = Math.ceil(ports.length / 2);
    ports.forEach(([nm, w, h], i) => {
      const col = Math.floor(i / 2),
        row = i % 2;
      mesh(panel, `PSU_Connector_${nm}`, box(2, h, w, 0.4), P.plastic, [L / 2 + 0.6, (row - 0.5) * (h + 6), -rw / 2 + 12 + (col * (rw - 24)) / Math.max(1, cols - 1 || 1)]);
    });
  } else {
    mesh(front, 'PSU_CableGrommet', discGeo(14, 6, 0, 24).rotateY(Math.PI / 2), P.rubber, [L / 2 + 2, 0, 0]);
  }

  // bên trong (minh hoạ cho bài học; chỉ thấy khi bung rời / X-quang)
  const inside = part(root, 'PSU_Internals', [0, 12, 0]);
  mesh(inside, 'PSU_PCB', box(L - 10, 1.6, W - 8), P.pcbGreen, [0, -H / 2 + 6, 0]);
  mesh(inside, 'PSU_Transformer', box(26, 26, 30, 2), P.plasticGrey, [L * 0.08, -H / 2 + 20, W * 0.12]);
  for (let i = 0; i < 2; i++) mesh(inside, `PSU_Capacitor_${i + 1}`, new T.CylinderGeometry(9, 9, 32, 24), P.plastic, [-L * 0.22, -H / 2 + 23, -W * 0.18 + i * 22]);
  mesh(inside, 'PSU_Heatsink', box(4, 30, W * 0.55, 0.5), P.alu, [L * 0.3, -H / 2 + 22, 0]);
  return root;
}
