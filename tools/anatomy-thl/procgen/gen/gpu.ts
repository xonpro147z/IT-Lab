/**
 * Card đồ hoạ: bo mạch, chân PCIe, GPU die, chip VRAM, cuộn cảm VRM, cụm lá tản, ống dẫn nhiệt, vỏ (shroud),
 * quạt, tấm lưng (backplate), ke (bracket) và cổng xuất hình, đầu cấp nguồn.
 * Hệ trục như khi cắm trong thùng máy đứng: dài theo +X (ke ở x = 0, phía sau vỏ), bo mạch nằm ngang,
 * tấm lưng hướng lên (+Y), quạt hướng xuống (−Y), mép chân PCIe ở z = 0 và card nhô ra +Z.
 */
import * as T from 'three';
import { bodyColor, box, fan, honeycomb, merged, mesh, palette, part, perforatedPlate, tubeGeo } from '../kit.ts';
import { D, F, type Spec } from '../spec.ts';

export function generateGPU(spec: Spec) {
  const L = D(spec, 'length'),
    TH = D(spec, 'thickness'),
    pcbH = D(spec, 'pcbHeight'),
    shH = D(spec, 'shroudHeight');
  const P = palette(bodyColor(F<string[]>(spec, 'color')), '#7d8288');
  const root = new T.Group();
  root.name = 'GPU';
  const pcbT = 1.6;
  const yTop = pcbT + 2 + 2; // mặt trên tấm lưng
  const yBot = yTop - TH; // đáy vỏ quạt
  const pcbL = L - 20;

  // ---------------------------------------------------- bo mạch và linh kiện
  const board = part(root, 'GPU_Board');
  mesh(board, 'GPU_PCB', box(pcbL, pcbT, pcbH, 0.5), P.pcbBlack, [pcbL / 2 + 2, pcbT / 2, pcbH / 2]);
  // chân PCIe x16: 89 mm chân cắm (PCI-SIG CEM), cách ke ≈ 42 mm (ước lượng)
  const fingers: T.BufferGeometry[] = [];
  for (const y of [-0.02, pcbT + 0.02]) fingers.push(box(89 - 11.65, 0.04, 7.5).translate(42 + 11.65 + (89 - 11.65) / 2, y, 3.8), box(11.65, 0.04, 7.5).translate(42 + 11.65 / 2 - 0.6, y, 3.8));
  mesh(board, 'GPU_PCIe_Fingers', merged(fingers), P.gold);
  const dieX = Math.min(L * 0.38, 120),
    dieZ = pcbH * 0.55;
  mesh(board, 'GPU_Substrate', box(42, 1.2, 42, 0.5), P.pcbGreen, [dieX, -0.6, dieZ]);
  mesh(board, 'GPU_Die', box(22, 0.9, 20, 0.2), P.silicon, [dieX, -1.6, dieZ]);
  const nv = F<number>(spec, 'vram');
  for (let i = 0; i < nv; i++) {
    // quanh die: hai bên và phía trên, mỗi chip 14 × 12 mm
    const a = -Math.PI / 2 + (i / Math.max(1, nv - 1)) * Math.PI * 1.0 - Math.PI / 2;
    const ring = 34;
    mesh(board, `GPU_VRAM_${String(i + 1).padStart(2, '0')}`, box(14, 1.1, 12, 0.3), P.chip, [dieX + Math.cos(a) * ring, -0.55, dieZ + Math.sin(a) * ring * 0.9]);
  }
  const chokes: T.BufferGeometry[] = [];
  for (let x = dieX + 45; x < Math.min(pcbL - 10, dieX + 110); x += 9) for (const z of [pcbH * 0.35, pcbH * 0.75]) chokes.push(box(7, 6, 7, 0.6).translate(x, -3, z));
  if (chokes.length) mesh(board, 'GPU_VRM_Chokes', merged(chokes), P.plasticGrey);

  // ---------------------------------------------------- nguồn cấp
  const pw = F<{ pin8: number; pin6: number; hpwr: number }>(spec, 'power');
  const btf = F<boolean>(spec, 'btf');
  const plugs = part(board, 'GPU_PowerConnectors', btf ? [0, 10, 0] : [0, 0, 10]);
  const list = pw.hpwr ? ['12V'] : [...Array(pw.pin8).fill('8'), ...Array(pw.pin6).fill('6')];
  list.forEach((k, i) => {
    const w = k === '12V' ? 19 : k === '8' ? 21 : 16;
    if (btf) mesh(plugs, `GPU_Power_${k}pin_${i + 1}`, box(w, 8, 7, 0.4), P.plastic, [L * 0.55 + i * 24, yTop + 4, 14]);
    else mesh(plugs, `GPU_Power_${k}pin_${i + 1}`, box(w, 7, 9, 0.4), P.plastic, [L * 0.62 + i * 24, -4.5, pcbH + 4]);
  });

  // ---------------------------------------------------- tản nhiệt
  const sink = part(root, 'GPU_Heatsink', [0, -22, 0]);
  const fins: T.BufferGeometry[] = [];
  const finTop = -5,
    finBot = yBot + 17;
  for (let x = 10; x < L - 8; x += 2.3) fins.push(box(0.4, finTop - finBot, shH - 16).translate(x, (finTop + finBot) / 2, 8 + (shH - 16) / 2));
  mesh(sink, 'GPU_Heatsink_Fins', merged(fins), P.alu);
  mesh(sink, 'GPU_Coldplate', box(48, 3, 46, 0.6), P.copper, [dieX, -3.6, dieZ]);
  const pipes = 4 + (TH > 60 ? 2 : 0);
  for (let i = 0; i < pipes; i++) {
    const z = dieZ + (i - (pipes - 1) / 2) * 8;
    const yP = -6 - (i % 2) * 3;
    mesh(sink, `GPU_Heatpipe_${String(i + 1).padStart(2, '0')}`, tubeGeo([[14, finBot + 6, z], [20, yP - 2, z], [dieX, yP, z], [L - 26, yP - 2, z], [L - 18, finBot + 6, z]], 3, 40, 8), P.copper);
  }

  // ---------------------------------------------------- vỏ và quạt
  const shroud = part(root, 'GPU_Shroud', [0, -48, 0]);
  const n = F<number>(spec, 'fans');
  const blower = F<boolean>(spec, 'blower');
  const fanT = 13;
  const span = L - 24;
  const fd = Math.max(60, Math.min(span / Math.max(1, n) - 4, shH - 14, 100));
  const centres = Array.from({ length: n }, (_, i) => 14 + (span / n) * (i + 0.5));
  const zc = 6 + (shH - 6) / 2;
  // tấm đáy có lỗ tròn cho từng quạt (tấm trục dày theo Z → xoay cho dày theo Y)
  const plate = perforatedPlate(L - 6, shH - 6, 2, blower ? [] : centres.map((x) => ({ x: x - L / 2 + 3, y: zc - 6 - (shH - 6) / 2, r: fd / 2 })), 6);
  plate.rotateX(Math.PI / 2);
  mesh(shroud, 'GPU_Shroud_Cover', plate, P.body, [L / 2 + 3, yBot + 1, 6 + (shH - 6) / 2]);
  // vành viền dọc hai mép dài
  for (const [z, nm] of [[7, 'GPU_Shroud_Rim_Inner'], [shH - 1, 'GPU_Shroud_Rim_Outer']] as const) mesh(shroud, nm, box(L - 6, 9, 2, 0.6), P.body, [L / 2 + 3, yBot + 5.5, z]);
  mesh(shroud, 'GPU_Shroud_Accent', box(L * 0.5, 0.6, 3, 0.2), P.accent, [L * 0.55, yBot + 0.2, shH - 6]);
  centres.forEach((x, i) => {
    const f = fan(shroud, `GPU_Fan_${String(i + 1).padStart(2, '0')}`, fd, fanT, P, { frame: false, blades: 11 });
    f.rotation.x = Math.PI / 2;
    f.position.set(x, yBot + 2 + fanT / 2, zc);
  });

  // ---------------------------------------------------- tấm lưng
  if (F<boolean>(spec, 'backplate')) {
    const bp = part(root, 'GPU_Backplate', [0, 26, 0]);
    const vents = honeycomb(60, shH - 30, 3, 1.6).map((h) => ({ x: h.x + (L - 10) / 2 - 38, y: h.y, r: h.r }));
    const g = perforatedPlate(L - 10, shH - 8, 1.6, L > 250 ? vents : [], 3, 6);
    g.rotateX(Math.PI / 2);
    mesh(bp, 'GPU_Backplate', g, P.aluDark, [L / 2 + 5, yTop - 0.8, 4 + (shH - 8) / 2]);
  }

  // ---------------------------------------------------- ke và cổng xuất hình
  const br = part(root, 'GPU_Bracket', [-28, 0, 0]);
  const bw = Math.ceil(TH / 20.32) * 20.32 - 2;
  mesh(br, 'GPU_Bracket', box(1, bw, 120, 0.2), P.steel, [-0.5, yTop - bw / 2, 52]);
  for (let i = 0; i < 4; i++) mesh(br, `GPU_IO_Port_${i + 1}`, box(4, i === 0 ? 6 : 5, i === 0 ? 15 : 17, 0.4), P.plastic, [-1.8, yTop - 7, 14 + i * 22]);
  return root;
}
