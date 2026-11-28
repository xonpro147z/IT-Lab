/**
 * Bo mạch chủ: bo mạch, socket (khung + tấm giữ + cần gạt), khe RAM, khe PCIe (dài theo số lane), khe M.2
 * kèm tấm tản, cụm VRM (cuộn cảm + tản nhiệt), tản chipset, che cụm cổng I/O và các cổng, đầu nguồn 24 chân,
 * EPS 8 chân, cổng SATA, lỗ bắt vít.
 * Hệ trục như trong thùng máy đứng: bo nằm trong mặt phẳng XY, linh kiện nhô +Z; mép cổng I/O ở −X (mặt sau),
 * mép trên ở +Y. Gốc: tâm mặt dưới bo. Vị trí linh kiện theo bố cục ATX thông dụng (ước lượng – OpenDB không có toạ độ).
 */
import * as T from 'three';
import { bodyColor, box, merged, mesh, palette, part, perforatedPlate } from '../kit.ts';
import { D, F, type Spec } from '../spec.ts';
import { SLOT_PITCH } from '../standards.ts';

/** Chiều dài đầu khe PCIe theo số lane (PCI-SIG CEM). */
const SLOT_LEN: Record<number, number> = { 1: 25, 4: 39, 8: 56, 16: 89 };

export function generateMotherboard(spec: Spec) {
  const H = D(spec, 'height'),
    DP = D(spec, 'depth'),
    pcb = D(spec, 'pcb');
  const P = palette(bodyColor(F<string[]>(spec, 'color'), '#2a2d31'), '#7a8088');
  const root = new T.Group();
  root.name = 'Motherboard';
  const X0 = -DP / 2,
    Y1 = H / 2;
  const z0 = pcb;
  const board = part(root, 'MB_Board');
  // lỗ bắt vít ở các vị trí gần góc và giữa (ước lượng theo ATX)
  const holes = [
    [X0 + 6.35, Y1 - 10.16],
    [X0 + 6.35, Y1 - 165],
    [X0 + 157, Y1 - 10.16],
    [X0 + 157, Y1 - 165],
    [DP / 2 - 6.35, Y1 - 10.16],
    [DP / 2 - 6.35, Y1 - 165],
  ].filter(([x, y]) => x < DP / 2 && y > -H / 2);
  const pcbGeo = perforatedPlate(DP, H, pcb, holes.map(([x, y]) => ({ x, y, r: 2 })), 2);
  pcbGeo.translate(0, 0, pcb / 2);
  mesh(board, 'MB_PCB', pcbGeo, P.pcbBlack);

  // ---------------------------------------------------- socket CPU
  const sx = X0 + Math.min(DP * 0.42, 110),
    sy = Y1 - 80;
  const sock = part(root, 'MB_Socket', [0, 0, 12], [sx, sy, z0]);
  mesh(sock, 'MB_Socket_Base', box(56, 66, 5, 1), P.plastic, [0, 0, 2.5]);
  mesh(sock, 'MB_Socket_LoadPlate', box(54, 64, 1.2, 0.5), P.steel, [0, 0, 5.8]);
  mesh(sock, 'MB_Socket_Lever', box(2, 60, 2, 0.8), P.steel, [30, -2, 6]);
  const tri = new T.Shape();
  tri.moveTo(0, 0);
  tri.lineTo(4, 0);
  tri.lineTo(0, 4);
  tri.closePath();
  mesh(sock, 'MB_Socket_Pin1_Mark', new T.ExtrudeGeometry(tri, { depth: 0.1, bevelEnabled: false }), P.gold, [-27, -32, 5]);

  // ---------------------------------------------------- VRM: cuộn cảm và tản nhiệt quanh socket (trên và phía sau)
  const vrm = part(root, 'MB_VRM', [0, 0, 22]);
  const chokes: T.BufferGeometry[] = [];
  for (let i = 0; i < 8; i++) chokes.push(box(7, 7, 6, 0.6).translate(sx - 30 + i * 8.5, sy + 46, z0 + 3));
  for (let i = 0; i < 6; i++) chokes.push(box(7, 7, 6, 0.6).translate(sx - 44, sy - 26 + i * 8.5, z0 + 3));
  mesh(vrm, 'MB_VRM_Chokes', merged(chokes), P.plasticGrey);
  mesh(vrm, 'MB_VRM_Heatsink_Top', box(72, 16, 22, 2), P.body, [sx - 1, sy + 47, z0 + 6 + 11]);
  mesh(vrm, 'MB_VRM_Heatsink_Rear', box(16, 56, 26, 2), P.body, [sx - 45, sy - 4, z0 + 6 + 13]);

  // ---------------------------------------------------- khe RAM (phía trước socket, dọc theo Y)
  const nd = F<number>(spec, 'dimms');
  const dimms = part(root, 'MB_DIMM_Slots', [0, 0, 6]);
  const dx0 = sx + 42;
  for (let i = 0; i < nd; i++) {
    const x = dx0 + i * 9.5;
    if (x > DP / 2 - 8) break;
    mesh(dimms, `MB_DIMM_Slot_${String(i + 1).padStart(2, '0')}`, box(6, 142, 8, 0.6), i % 2 ? P.plasticGrey : P.plastic, [x, sy - 6, z0 + 4]);
    mesh(dimms, `MB_DIMM_Latch_${String(i + 1).padStart(2, '0')}`, box(6, 4, 11, 0.6), P.plasticGrey, [x, sy - 6 + 73, z0 + 5.5]);
  }

  // ---------------------------------------------------- khe PCIe (ngang, theo X) – bước khe chuẩn 20.32 mm
  const pcie = F<{ lanes: number }[]>(spec, 'pcie');
  const slots = part(root, 'MB_PCIe_Slots', [0, 0, 8]);
  const firstY = sy - 92;
  pcie.forEach((s, i) => {
    const y = firstY - i * SLOT_PITCH.value * (i === 0 ? 1 : 1.5);
    if (y < -H / 2 + 8) return;
    const len = SLOT_LEN[s.lanes] ?? 89;
    const x = X0 + 46 + len / 2;
    mesh(slots, `MB_PCIe_Slot_${String(i + 1).padStart(2, '0')}_x${s.lanes}`, box(len, 7.5, 11, 0.6), s.lanes === 16 && i === 0 ? P.steel : P.plastic, [x, y, z0 + 5.5]);
  });

  // ---------------------------------------------------- M.2 (giữa các khe PCIe) và tấm tản
  const m2n = F<number>(spec, 'm2');
  const m2 = part(root, 'MB_M2', [0, 0, 16]);
  for (let i = 0; i < Math.min(m2n, 3); i++) {
    const y = firstY + 22 - i * 40;
    if (y < -H / 2 + 26) break;
    const x = X0 + 70;
    mesh(m2, `MB_M2_Slot_${String(i + 1).padStart(2, '0')}`, box(4.5, 22, 4.5, 0.5), P.plastic, [x - 42, y - 12, z0 + 2.3]);
    mesh(m2, `MB_M2_Heatsink_${String(i + 1).padStart(2, '0')}`, box(84, 25, 6, 1.2), P.body, [x, y - 12, z0 + 7]);
  }

  // ---------------------------------------------------- chipset
  mesh(part(root, 'MB_Chipset', [0, 0, 14]), 'MB_Chipset_Heatsink', box(44, 44, 9, 2), P.body, [DP / 2 - 52, -H / 2 + 60, z0 + 4.5]);

  // ---------------------------------------------------- cụm cổng I/O (khe 158.75 mm theo chuẩn ATX)
  const io = part(root, 'MB_IO', [-24, 0, 0]);
  const ioH = 158.75 * 0.92;
  mesh(io, 'MB_IO_Cover', box(26, ioH, 24, 2), P.body, [X0 + 13, Y1 - 8 - ioH / 2, z0 + 12]);
  const nPorts = Math.max(6, Math.min(14, F<number>(spec, 'ports') ?? 10));
  for (let i = 0; i < nPorts; i++) {
    const y = Y1 - 18 - i * (ioH - 16) / nPorts;
    mesh(io, `MB_IO_Port_${String(i + 1).padStart(2, '0')}`, box(9, 7, 13, 0.6), i % 3 === 0 ? P.steel : P.plastic, [X0 - 1.5, y, z0 + 10]);
  }

  // ---------------------------------------------------- đầu cắm nguồn và SATA
  const conn = part(root, 'MB_Connectors', [0, 0, 10]);
  mesh(conn, 'MB_ATX24', box(10, 52, 10, 0.8), P.plasticWhite, [DP / 2 - 7, sy - 40, z0 + 5]);
  mesh(conn, 'MB_EPS8', box(18, 9, 10, 0.8), P.plasticWhite, [X0 + 30, Y1 - 7, z0 + 5]);
  for (let i = 0; i < 4; i++) mesh(conn, `MB_SATA_${i + 1}`, box(9, 6, 8, 0.5), P.plastic, [DP / 2 - 6, -H / 2 + 20 + i * 8, z0 + 4]);
  return root;
}
