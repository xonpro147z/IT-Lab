/**
 * SSD. M.2: bo mạch, chân cắm khoá M, controller, DRAM, chip NAND, nhãn, tản nhiệt (nếu SKU có).
 * Hệ trục M.2: dài theo X (chân cắm ở −X), rộng theo Y, linh kiện nhô +Z. Gốc: giữa mặt dưới bo.
 * 2.5": vỏ hai nửa, bo mạch bên trong, cổng SATA. Nằm phẳng: dài X, rộng Z, dày Y. Gốc: giữa đáy.
 */
import * as T from 'three';
import { box, merged, mesh, palette, part } from '../kit.ts';
import { D, F, type Spec } from '../spec.ts';

export function generateSSD(spec: Spec) {
  return F<string>(spec, 'kind') === 'm2' ? m2(spec) : sata(spec);
}

function m2(spec: Spec) {
  const L = D(spec, 'length'),
    W = D(spec, 'width'),
    pcb = D(spec, 'pcb'),
    top = D(spec, 'top');
  const P = palette('#1c1d20');
  const root = new T.Group();
  root.name = 'SSD_M2';
  const board = part(root, 'SSD_Board');
  // bo có nửa lỗ bắt vít ở đầu +X
  const sh = new T.Shape();
  sh.moveTo(-L / 2, -W / 2);
  sh.lineTo(L / 2, -W / 2);
  sh.lineTo(L / 2, -1.75);
  sh.absarc(L / 2, 0, 1.75, -Math.PI / 2, Math.PI / 2, true);
  sh.lineTo(L / 2, W / 2);
  sh.lineTo(-L / 2, W / 2);
  sh.closePath();
  mesh(board, 'SSD_PCB', new T.ExtrudeGeometry(sh, { depth: pcb, bevelEnabled: false, curveSegments: 12 }), P.pcbBlack);
  // chân cắm khoá M: khe khoá lệch về một bên
  const fingers: T.BufferGeometry[] = [];
  for (const side of [0, pcb + 0.02]) {
    fingers.push(box(3.8, W - 7, 0.04).translate(-L / 2 + 2, -3.5 + 0.0, side));
    fingers.push(box(3.8, 4.2, 0.04).translate(-L / 2 + 2, W / 2 - 3.6, side));
  }
  mesh(board, 'SSD_Connector', merged(fingers), P.gold);
  const z = pcb + top / 2;
  const chips = part(board, 'SSD_Chips', [0, 0, 6]);
  mesh(chips, 'SSD_Controller', box(12, 12, top * 0.9, 0.3), P.chip, [-L / 2 + 16, 0, z]);
  if (F(spec, 'dram') !== false) mesh(chips, 'SSD_DRAM', box(8, 11, top * 0.85, 0.3), P.chip, [-L / 2 + 28, 0, z]);
  const n = F<number>(spec, 'nand');
  const start = -L / 2 + 36,
    span = L / 2 - 6 - start;
  for (let i = 0; i < n; i++) {
    const w = Math.min(16, span / n - 1.5);
    mesh(chips, `SSD_NAND_${String(i + 1).padStart(2, '0')}`, box(w, Math.min(W - 4, 14), top * 0.9, 0.3), P.chip, [start + (i + 0.5) * (span / n), 0, z]);
  }
  if (F<boolean>(spec, 'heatsink')) {
    const hh = D(spec, 'heatsinkHeight');
    const hs = part(root, 'SSD_Heatsink', [0, 0, 16]);
    const coverH = hh - pcb - 1.2;
    mesh(hs, 'SSD_Heatsink_Cover', box(L - 8, W + 1, coverH, 0.8), P.aluDark, [4, 0, pcb + 0.2 + coverH / 2]);
    const ribs: T.BufferGeometry[] = [];
    for (let x = -L / 2 + 14; x < L / 2 - 4; x += 4) ribs.push(box(1.4, W - 2, 0.8).translate(x, 0, pcb + 0.2 + coverH + 0.4));
    mesh(hs, 'SSD_Heatsink_Fins', merged(ribs), P.aluDark);
    const base = part(root, 'SSD_Heatsink_Base', [0, 0, -8]);
    mesh(base, 'SSD_Heatsink_Base', box(L - 8, W + 1, 1, 0.3), P.aluDark, [4, 0, -0.6]);
  } else {
    // nhãn dán phủ chip, như ổ M.2 bán lẻ
    mesh(chips, 'SSD_Label', box(L - 12, W - 1, 0.1), P.label, [4, 0, pcb + top * 0.9 + 0.08]);
  }
  return root;
}

function sata(spec: Spec) {
  const L = D(spec, 'length'),
    W = D(spec, 'width'),
    H = D(spec, 'height');
  const P = palette('#2a2c30');
  const root = new T.Group();
  root.name = 'SSD_25';
  const t = 0.8;
  const bottom = part(root, 'SSD_Shell_Bottom', [0, -12, 0]);
  mesh(bottom, 'SSD_Shell_Bottom', box(L, H * 0.45, W, 0.8), P.aluDark, [0, (H * 0.45) / 2, 0]);
  const topP = part(root, 'SSD_Shell_Top', [0, 22, 0]);
  mesh(topP, 'SSD_Shell_Top', box(L, H * 0.55, W, 0.8), P.body, [0, H * 0.45 + (H * 0.55) / 2, 0]);
  mesh(topP, 'SSD_Label', box(L * 0.7, 0.1, W * 0.75), P.label, [0, H + 0.05, 0]);
  // bo mạch bên trong (thấy khi bung rời hoặc X-quang)
  const inside = part(root, 'SSD_Internals', [0, 8, 0]);
  const pl = L * 0.55;
  mesh(inside, 'SSD_PCB', box(pl, t, W - 8), P.pcbGreen, [-L / 2 + pl / 2 + 2, H * 0.45, 0]);
  mesh(inside, 'SSD_Controller', box(12, 1.2, 12, 0.3), P.chip, [-L / 2 + 14, H * 0.45 + 1, 0]);
  for (let i = 0; i < 2; i++) mesh(inside, `SSD_NAND_${String(i + 1).padStart(2, '0')}`, box(14, 1.2, 18, 0.3), P.chip, [-L / 2 + 32 + i * 17, H * 0.45 + 1, 0]);
  // cổng SATA ở đầu −X: dữ liệu 7 chân + nguồn 15 chân
  const port = part(root, 'SSD_SATA_Connector', [-10, 0, 0]);
  mesh(port, 'SSD_SATA_Data', box(2, 2.5, 8.5, 0.3), P.plastic, [-L / 2 - 0.5, H / 2, -W / 2 + 16]);
  mesh(port, 'SSD_SATA_Power', box(2, 2.5, 15, 0.3), P.plastic, [-L / 2 - 0.5, H / 2, -W / 2 + 31]);
  return root;
}
