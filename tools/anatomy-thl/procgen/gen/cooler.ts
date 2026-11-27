/**
 * Tản nhiệt CPU.
 * Tản khí: đế tiếp xúc, ống dẫn nhiệt chữ U, một hoặc hai tháp lá tản, nắp trên, quạt (cỡ và số lượng từ OpenDB).
 *   Hệ trục như khi lắp trên mainboard trong thùng đứng: đế ở z = 0 trên mặt CPU, tháp vươn ra +Z,
 *   gió đi từ trước ra sau (quạt ở mặt +X thổi về −X). Gốc: tâm mặt đế.
 * Tản nước AIO: khối bơm (cao theo OpenDB `height`), ống mềm, két tản (dài theo `radiator_size`), quạt.
 *   Két đặt minh hoạ ở nóc thùng (phía +Y), ống nối về khối bơm.
 */
import * as T from 'three';
import { bodyColor, box, discGeo, fan, merged, mesh, palette, part, tubeGeo } from '../kit.ts';
import { D, F, type Spec } from '../spec.ts';

export function generateCooler(spec: Spec) {
  return F<boolean>(spec, 'water') ? aio(spec) : tower(spec);
}

function tower(spec: Spec) {
  const H = D(spec, 'height'),
    fs = D(spec, 'fanSize'),
    td = D(spec, 'towerDepth'),
    b = D(spec, 'base');
  const towers = F<number>(spec, 'towers'),
    nFans = F<number>(spec, 'fans'),
    pipes = F<number>(spec, 'heatpipes');
  const P = palette(bodyColor(F<string[]>(spec, 'color'), '#1c1d20'), '#9aa0a6');
  const nickel = F<string[]>(spec, 'color').some((c) => /BLACK/i.test(c)) ? P.aluDark : P.alu;
  const root = new T.Group();
  root.name = 'Cooler';
  const fw = fs + 5; // lá tản rộng hơn cỡ quạt một chút
  const gap = towers === 2 ? 26 : 0; // khe giữa hai tháp (chỗ quạt giữa)
  const finBottom = Math.max(32, H - fs - 12),
    finTop = H - 3; // nắp dày 3 mm nằm trên cùng: đỉnh nắp đúng bằng chiều cao OpenDB
  const xs = towers === 2 ? [-(gap / 2 + td / 2), gap / 2 + td / 2] : [0];

  const base = part(root, 'Cooler_Base', [0, 0, -16]);
  mesh(base, 'Cooler_Base', box(b, b + 4, 6, 1), P.nickel, [0, 0, 3]);
  mesh(base, 'Cooler_Base_Clamp', box(b + 34, 12, 4, 1), P.steel, [0, 0, 8]);

  // ống dẫn nhiệt: từ đế đi lên rồi xuyên qua tháp lá tản (mỗi ống chữ U, hai nhánh)
  const hp = part(root, 'Cooler_Heatpipes', [0, 0, 6]);
  for (let i = 0; i < pipes / 2; i++) {
    const y = (i - (pipes / 2 - 1) / 2) * 7.5;
    const x0 = towers === 2 ? xs[0] : -td / 4,
      x1 = towers === 2 ? xs[1] : td / 4;
    const pts: [number, number, number][] = [
      [x0, y, finTop - 2],
      [x0, y, finBottom - 6],
      [x0 * 0.55, y, 10],
      [0, y, 4],
      [x1 * 0.55, y, 10],
      [x1, y, finBottom - 6],
      [x1, y, finTop - 2],
    ];
    mesh(hp, `Cooler_Heatpipe_${String(i + 1).padStart(2, '0')}`, tubeGeo(pts, 3, 64, 10), P.copper);
  }

  // tháp lá tản: các lá xếp chồng theo Z, mỗi lá nằm trong mặt XY
  xs.forEach((x, k) => {
    const tw = part(root, `Cooler_Tower_${String(k + 1).padStart(2, '0')}`, [0, 0, 20 + k * 6]);
    const plates: T.BufferGeometry[] = [];
    for (let z = finBottom; z <= finTop - 1.5; z += 2.2) plates.push(box(td, fw, 0.45).translate(x, 0, z));
    mesh(tw, `Cooler_FinStack_${String(k + 1).padStart(2, '0')}`, merged(plates), nickel);
    mesh(tw, `Cooler_TopCover_${String(k + 1).padStart(2, '0')}`, box(td + 1, fw + 1, 3, 1), P.body, [x, 0, H - 1.5]);
  });

  // quạt: trục theo X; quạt 1 ở mặt trước tháp trước, quạt 2 (nếu có) giữa hai tháp
  const fanT = 25;
  const fanZ = finBottom + (finTop - finBottom) / 2;
  const front = Math.max(...xs) + td / 2 + fanT / 2 + 1;
  const spots = towers === 2 ? [front, 0] : [front, Math.min(...xs) - td / 2 - fanT / 2 - 1];
  for (let i = 0; i < nFans && i < spots.length; i++) {
    const fp = part(root, `Cooler_Fan_${String(i + 1).padStart(2, '0')}`, [40 - i * 10, 0, 50]);
    const f = fan(fp, `Cooler_Fan_${String(i + 1).padStart(2, '0')}`, fs, fanT, P, { holes: spec.dims.fanHoles ? D(spec, 'fanHoles') : fs * 0.875, ring: F<string[]>(spec, 'lighting').length > 0 });
    f.rotation.y = Math.PI / 2;
    f.position.set(spots[i], 0, Math.min(fanZ, H - fs / 2));
  }
  return root;
}

function aio(spec: Spec) {
  const rad = D(spec, 'radiator'),
    fs = D(spec, 'fanSize'),
    rt = D(spec, 'radThickness'),
    ph = D(spec, 'pumpHeight');
  const P = palette(bodyColor(F<string[]>(spec, 'color')), '#4a4e54');
  const root = new T.Group();
  root.name = 'Cooler_AIO';
  const rgb = F<string[]>(spec, 'lighting').length > 0;
  const pump = part(root, 'AIO_Pump', [0, 0, 20]);
  mesh(pump, 'AIO_Pump_ColdPlate', box(42, 42, 4, 1), P.copper, [0, 0, 2]);
  mesh(pump, 'AIO_Pump_Housing', box(66, 66, ph - 10, 6), P.body, [0, 0, 4 + (ph - 10) / 2]);
  mesh(pump, 'AIO_Pump_Cap', discGeo(28, 6, 0, 48), P.plastic, [0, 0, ph - 3]);
  if (rgb) mesh(pump, 'AIO_Pump_RGBRing', new T.TorusGeometry(29, 1.2, 8, 64), P.rgb, [0, 0, ph - 2]);

  // két tản nằm ngang dưới nóc thùng: dài theo X, rộng theo Z, dày theo Y
  const rw = fs + 4,
    tank = 18;
  const ry = 200,
    rx = 0;
  const radiator = part(root, 'AIO_Radiator', [0, 40, 0], [rx, ry, 60]);
  mesh(radiator, 'AIO_Radiator_Core', box(rad, rt, rw, 1), P.aluDark);
  const fins: T.BufferGeometry[] = [];
  for (let x = -rad / 2 + 2; x < rad / 2 - 2; x += 1.8) fins.push(box(0.3, rt - 2, rw - 4).translate(x, 0, 0));
  mesh(radiator, 'AIO_Radiator_Fins', merged(fins), P.alu);
  for (const s of [-1, 1]) mesh(radiator, s < 0 ? 'AIO_Radiator_Tank_A' : 'AIO_Radiator_Tank_B', box(tank, rt + 4, rw + 2, 3), P.body, [s * (rad / 2 + tank / 2), 0, 0]);
  const nf = F<number>(spec, 'fans');
  for (let i = 0; i < nf; i++) {
    const f = fan(radiator, `AIO_Fan_${String(i + 1).padStart(2, '0')}`, fs, 25, P, { ring: rgb });
    f.rotation.x = Math.PI / 2;
    f.position.set(-rad / 2 + fs / 2 + i * fs, -rt / 2 - 13, 0);
  }
  // hai ống mềm từ khối bơm tới đầu két
  const tubes = part(root, 'AIO_Tubes', [0, 20, 0]);
  for (const k of [-1, 1]) {
    const z0 = 20 + k * 12;
    mesh(tubes, k < 0 ? 'AIO_Tube_01' : 'AIO_Tube_02', tubeGeo([[24, k * 14, ph - 14], [70, k * 18, ph + 20], [rad / 2 + 4, ry - 60, z0 + 20], [rx + rad / 2 + tank / 2, ry - rt / 2 - 2, 60 + k * 30]], 5.5, 64, 12), P.rubber);
  }
  return root;
}
