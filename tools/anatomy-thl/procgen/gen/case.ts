/**
 * Thùng máy: khung, kính hông (hoặc tấm đặc theo `side_panel`), tấm hông sau khay, mặt trước lưới, nóc lưới,
 * mặt sau có ô cổng I/O và số khe mở rộng theo OpenDB, sàn, khay mainboard có lỗ đi dây, tấm che nguồn (nếu có),
 * quạt, chân đế. Kích thước ngoài lấy từ `dimensions_mm` của OpenDB.
 * Hệ trục: sâu theo X (mặt sau ở −X), cao theo +Y, rộng theo Z (phía kính ở +Z). Gốc: tâm đáy.
 */
import * as T from 'three';
import { bodyColor, box, fan, honeycomb, merged, mesh, palette, part, perforatedPlate } from '../kit.ts';
import { D, F, type Spec } from '../spec.ts';

export function generateCase(spec: Spec) {
  const DP = D(spec, 'depth'),
    W = D(spec, 'width'),
    H = D(spec, 'height'),
    t = D(spec, 'wall');
  const P = palette(bodyColor(F<string[]>(spec, 'color')), '#55595f');
  const root = new T.Group();
  root.name = 'Case';
  const feet = 12;
  const y0 = feet,
    h = H - feet,
    yc = y0 + h / 2;

  // khung: các thanh dọc cạnh
  const frame = part(root, 'Case_Frame');
  const rails: T.BufferGeometry[] = [];
  const r = 10;
  for (const x of [-DP / 2 + r / 2, DP / 2 - r / 2]) for (const z of [-W / 2 + r / 2, W / 2 - r / 2]) rails.push(box(r, h, r).translate(x, yc, z));
  for (const y of [y0 + r / 2, H - r / 2]) for (const z of [-W / 2 + r / 2, W / 2 - r / 2]) rails.push(box(DP, r, r).translate(0, y, z));
  mesh(frame, 'Case_Frame', merged(rails), P.body);
  mesh(frame, 'Case_Floor', box(DP - 2 * r, t, W - 2 * r), P.body, [0, y0 + t / 2, 0]);
  const fts: T.BufferGeometry[] = [];
  for (const x of [-DP / 2 + 30, DP / 2 - 30]) for (const z of [-W / 2 + 25, W / 2 - 25]) fts.push(box(40, feet, 14, 3).translate(x, feet / 2, z));
  mesh(frame, 'Case_Feet', merged(fts), P.rubber);

  // khay mainboard: cách tấm hông sau ≈ 25 mm (khoang đi dây – ước lượng)
  const trayZ = -W / 2 + 25;
  const trayGeo = perforatedPlate(DP - 2 * r, h - 2 * r, t, [
    { x: DP * 0.28, y: h * 0.18, r: 12 },
    { x: DP * 0.28, y: -h * 0.05, r: 12 },
    { x: -DP * 0.1, y: h * 0.38, r: 10 },
  ]);
  mesh(part(root, 'Case_Tray', [0, 0, -18]), 'Case_Tray', trayGeo, P.body, [0, yc, trayZ]);

  // tấm che nguồn
  if (F<boolean>(spec, 'shroud')) {
    const sh = part(root, 'Case_PSUShroud', [0, 0, 30]);
    const sH = Math.min(110, h * 0.22);
    mesh(sh, 'Case_PSUShroud_Top', box(DP - 2 * r, t, W - 2 * r - 25), P.body, [0, y0 + sH, 12.5]);
    mesh(sh, 'Case_PSUShroud_Side', box(DP - 2 * r, sH, t), P.body, [0, y0 + sH / 2, W / 2 - r - t]);
  }

  // mặt sau: ô cổng I/O (158.75 × 44.45 theo ATX), khe mở rộng, ô quạt 120 mm
  const rear = part(root, 'Case_Panel_Rear', [-30, 0, 0]);
  const slots = F<number>(spec, 'slots');
  const ioY = H - 30 - 158.75 / 2,
    ioZ = trayZ + 25 + 44.45 / 2;
  const rg = perforatedPlate(W - 2 * r, h - 2 * r, t, honeycomb(116, 116, 4, 2).map((p) => ({ x: p.x + trayZ + 100, y: p.y + (H - 100 - yc), r: p.r })), 0, 6);
  rg.rotateY(-Math.PI / 2);
  mesh(rear, 'Case_Panel_Rear', rg, P.body, [-DP / 2 + t / 2, yc, 0]);
  mesh(rear, 'Case_IO_Cutout', box(2, 158.75, 44.45), P.plastic, [-DP / 2 - 0.2, ioY, ioZ]);
  const sl: T.BufferGeometry[] = [];
  const slotTop = ioY - 158.75 / 2 - 30;
  for (let i = 0; i < slots; i++) sl.push(box(2, 14.5, 18, 0.4).translate(-DP / 2 - 0.5, slotTop - i * 20.32, trayZ + 40));
  mesh(rear, 'Case_ExpansionSlots', merged(sl), P.steel);

  // kính hông (+Z) hoặc tấm đặc
  const side = F<string>(spec, 'sidePanel') ?? 'Solid';
  const glass = /Glass|Acrylic/i.test(side);
  const gp = part(root, 'Case_Panel_Side', [0, 0, 70]);
  if (glass) {
    mesh(gp, 'Case_Panel_Glass', box(DP - 6, h - 6, 4, 1), P.glass, [0, yc, W / 2 - 2]);
    mesh(gp, 'Case_Panel_Glass_Trim', box(DP - 6, 6, 4.4, 1), P.plastic, [0, H - 6, W / 2 - 2]);
  } else mesh(gp, 'Case_Panel_SideSolid', box(DP - 6, h - 6, t, 0.5), P.body, [0, yc, W / 2 - t / 2]);
  mesh(part(root, 'Case_Panel_Back', [0, 0, -50]), 'Case_Panel_Back', box(DP - 6, h - 6, t, 0.5), P.body, [0, yc, -W / 2 + t / 2]);

  // mặt trước: lưới thông gió
  const fr = part(root, 'Case_Panel_Front', [50, 0, 0]);
  const fg = perforatedPlate(W - 4, h - 4, 2, honeycomb(W - 30, h - 60, 6, 3), 4, 6);
  fg.rotateY(Math.PI / 2);
  mesh(fr, 'Case_Panel_Front', fg, P.body, [DP / 2 + 1, yc, 0]);
  // nóc
  const tp = part(root, 'Case_Panel_Top', [0, 40, 0]);
  const tg = perforatedPlate(DP - 20, W - 20, t, honeycomb(DP * 0.6, W * 0.6, 6, 3), 3, 6);
  tg.rotateX(Math.PI / 2);
  mesh(tp, 'Case_Panel_Top', tg, P.body, [0, H - t / 2, 0]);

  // quạt: 2 trước + 1 sau (ước lượng – OpenDB không ghi quạt kèm theo)
  const fans = part(root, 'Case_Fans', [25, 0, 0]);
  const fz = (trayZ + W / 2) / 2;
  for (let i = 0; i < 2; i++) {
    const f = fan(fans, `Case_Fan_${String(i + 1).padStart(2, '0')}`, 120, 25, P, { holes: 105 });
    f.rotation.y = Math.PI / 2;
    f.position.set(DP / 2 - 30, H - 90 - i * 130, fz);
  }
  const ex = fan(fans, 'Case_Fan_03', 120, 25, P, { holes: 105 });
  ex.rotation.y = Math.PI / 2;
  ex.position.set(-DP / 2 + 18, H - 100, trayZ + 40 + 60);
  return root;
}
