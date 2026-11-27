/**
 * RAM: bo mạch, chân tiếp xúc, chip nhớ (hai mặt nếu dual rank), PMIC (DDR5), tản nhiệt hai nửa, thanh RGB.
 * Hệ trục: dài theo Y, cao theo +Z (khỏi khe cắm), dày theo X. Gốc: giữa mép chân tiếp xúc.
 */
import * as T from 'three';
import { bodyColor, box, merged, mesh, palette, part } from '../kit.ts';
import { D, F, type Spec } from '../spec.ts';

export function generateRAM(spec: Spec) {
  const L = D(spec, 'length'),
    H = D(spec, 'height'),
    pcbH = D(spec, 'pcbHeight'),
    pcb = D(spec, 'pcb'),
    thick = D(spec, 'thickness');
  const spreader = F<boolean>(spec, 'heatSpreader');
  const rgb = F<boolean>(spec, 'rgb');
  const ddr5 = /DDR5/.test(F<string>(spec, 'ramType') ?? '');
  const P = palette(bodyColor(F<string[]>(spec, 'color'), spreader ? '#1c1d20' : '#1f4d2b'));
  const root = new T.Group();
  root.name = 'RAM';

  const board = part(root, 'RAM_Board');
  mesh(board, 'RAM_PCB', box(pcb, L, pcbH, 0.3), spreader ? P.pcbBlack : P.pcbGreen, [0, 0, pcbH / 2]);
  // chân tiếp xúc hai mặt, chia hai đoạn ở khấc định vị (lệch tâm – vị trí ước lượng)
  const notch = 6;
  const pads: T.BufferGeometry[] = [];
  for (const side of [-1, 1])
    for (const [a, b] of [[-L / 2 + 1, notch - 1], [notch + 1, L / 2 - 1]]) pads.push(box(0.05, b - a, 3.2).translate(side * (pcb / 2 + 0.03), (a + b) / 2, 1.8));
  mesh(board, 'RAM_Contacts', merged(pads), P.gold);

  // chip nhớ: 8 chip x8 mỗi mặt (64 bit dữ liệu); thanh dual rank có chip cả hai mặt
  const sides = F<number>(spec, 'sides') === 2 ? [-1, 1] : [1];
  let n = 0;
  for (const side of sides) {
    const chips = part(board, side > 0 ? 'RAM_Chips_Front' : 'RAM_Chips_Back', [side * 5, 0, 0]);
    for (let i = 0; i < 8; i++) {
      const y = -L / 2 + 8 + i * ((L - 16) / 7.5) + (i >= 4 ? (L - 16) / 15 : 0);
      mesh(chips, `RAM_Chip_${String(++n).padStart(2, '0')}`, box(1.2, 10, 11, 0.2), P.chip, [side * (pcb / 2 + 0.6), y, pcbH * 0.52]);
    }
  }
  if (ddr5) mesh(board, 'RAM_PMIC', box(1, 5, 5, 0.2), P.chip, [pcb / 2 + 0.5, 0, pcbH * 0.52]); // DDR5: bộ quản lý nguồn trên thanh

  if (spreader) {
    const top = rgb ? H - 7 : H;
    for (const side of [-1, 1]) {
      const hs = part(root, side < 0 ? 'RAM_Heatspreader_L' : 'RAM_Heatspreader_R', [side * 16, 0, 0]);
      const t = Math.max(0.8, (thick - pcb) / 2 - 1.2);
      const x = side * (pcb / 2 + 1.4 + t / 2);
      mesh(hs, side < 0 ? 'RAM_Heatspreader_L' : 'RAM_Heatspreader_R', box(t, L - 1, top - 5, 0.6), P.body, [x, 0, 5 + (top - 5) / 2]);
      // gân trang trí chạy dọc mặt ngoài
      mesh(hs, side < 0 ? 'RAM_Heatspreader_L_Trim' : 'RAM_Heatspreader_R_Trim', box(0.6, L - 12, 3, 0.2), P.accent, [x + side * (t / 2 + 0.2), 0, top - 9]);
    }
    if (rgb) {
      const bar = part(root, 'RAM_RGB', [0, 0, 14]);
      mesh(bar, 'RAM_RGB_Diffuser', box(thick - 1.5, L - 4, 6.5, 1.2), P.rgb, [0, 0, H - 3.4]);
      mesh(bar, 'RAM_RGB_Housing', box(thick, L - 1, 1.5, 0.4), P.body, [0, 0, top - 0.6]);
    }
  }
  return root;
}
