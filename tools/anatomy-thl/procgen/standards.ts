/**
 * TinHocLab – kích thước theo tiêu chuẩn đã công bố (mm).
 *
 * Chỉ ghi những con số có trong tiêu chuẩn công nghiệp, kèm nguồn. Thông số riêng của từng sản phẩm
 * lấy từ BuildCores OpenDB; khi OpenDB thiếu mà tiêu chuẩn có, dùng số ở đây (độ chính xác vẫn là
 * "dimension-based"). Khi cả hai đều không có, bộ sinh dùng quy tắc ước lượng (`estimate`) và ghi lại.
 */
export type Std = { value: number; source: string };
const s = (value: number, source: string): Std => ({ value, source });

/** Thanh RAM (JEDEC). Chiều cao là của bo mạch trần, chưa có tản nhiệt. */
export const DIMM: Record<string, { length: Std; pcbHeight: Std; pcb: Std }> = {
  '288-pin DIMM': {
    length: s(133.35, 'JEDEC MO-309 (DDR4/DDR5 UDIMM)'),
    pcbHeight: s(31.25, 'JEDEC MO-309 (DDR4/DDR5 UDIMM)'),
    pcb: s(1.27, 'JEDEC MO-309'),
  },
  '240-pin DIMM': {
    length: s(133.35, 'JEDEC MO-269 (DDR3 UDIMM)'),
    pcbHeight: s(30.0, 'JEDEC MO-269'),
    pcb: s(1.27, 'JEDEC MO-269'),
  },
};

/** M.2: "M.2-2280" → rộng 22, dài 80 (PCI-SIG M.2 Specification). */
export function m2Size(formFactor: string | null | undefined) {
  const m = /M\.2-(\d\d)(\d{2,3})/.exec(formFactor ?? '');
  if (!m) return null;
  return { width: s(+m[1], 'PCI-SIG M.2 ' + m[0].slice(4)), length: s(+m[2], 'PCI-SIG M.2 ' + m[0].slice(4)) };
}
/** Mặt trên linh kiện của M.2 một mặt, loại S3 (PCI-SIG M.2: 1.5 mm linh kiện + 0.8 mm bo). */
export const M2_PCB = s(0.8, 'PCI-SIG M.2 (bo 0.8 mm)');
export const M2_TOP = s(1.5, 'PCI-SIG M.2 (S3: linh kiện cao tối đa 1.5 mm)');

/** Ổ 2.5 inch (SFF-8201). Chiều dày 7 mm là cấp phổ biến của SSD; ổ 9.5 mm cũng hợp chuẩn. */
export const SFF_25 = { length: s(100.45, 'SFF-8201'), width: s(69.85, 'SFF-8201'), height: s(7.0, 'SFF-8201 (cấp 7 mm)') };

/** Vỏ CPU (package) theo socket. */
export const CPU_PACKAGE: Record<string, { w: Std; h: Std; kind: 'LGA' | 'PGA' }> = {
  AM5: { w: s(40, 'AMD Socket AM5 (package 40 × 40 mm)'), h: s(40, 'AMD Socket AM5'), kind: 'LGA' },
  AM4: { w: s(40, 'AMD Socket AM4 (package 40 × 40 mm)'), h: s(40, 'AMD Socket AM4'), kind: 'PGA' },
  'LGA 1700': { w: s(37.5, 'Intel LGA1700 (package 37.5 × 45 mm)'), h: s(45, 'Intel LGA1700'), kind: 'LGA' },
  'LGA 1851': { w: s(37.5, 'Intel LGA1851 (package 37.5 × 45 mm)'), h: s(45, 'Intel LGA1851'), kind: 'LGA' },
  'LGA 1200': { w: s(37.5, 'Intel LGA1200 (package 37.5 × 37.5 mm)'), h: s(37.5, 'Intel LGA1200'), kind: 'LGA' },
  'LGA 1151': { w: s(37.5, 'Intel LGA1151 (package 37.5 × 37.5 mm)'), h: s(37.5, 'Intel LGA1151'), kind: 'LGA' },
};

/** Bo mạch chủ (ATX Specification 2.2; Mini-ITX: VIA). Rộng = cạnh dọc mặt sau vỏ. */
export const BOARD: Record<string, { w: Std; d: Std }> = {
  ATX: { w: s(305, 'ATX 2.2 (305 × 244 mm)'), d: s(244, 'ATX 2.2') },
  'Micro ATX': { w: s(244, 'microATX 1.2 (244 × 244 mm)'), d: s(244, 'microATX 1.2') },
  'Mini-ITX': { w: s(170, 'Mini-ITX (170 × 170 mm)'), d: s(170, 'Mini-ITX') },
  EATX: { w: s(305, 'SSI EEB/EATX (305 × 330 mm)'), d: s(330, 'SSI EEB/EATX') },
};
/** Khoảng cách khe mở rộng (PCI-SIG CEM), cũng là bề rộng một "slot" của card. */
export const SLOT_PITCH = s(20.32, 'PCI-SIG CEM (0.8 inch)');
/** Card PCIe cao đủ (full-height) – chiều cao bo mạch tính từ mép chân cắm. */
export const PCIE_FULL_HEIGHT = s(111.15, 'PCI-SIG CEM (full-height)');
/** Mặt nạ (bracket) card mở rộng. */
export const PCIE_BRACKET_H = s(120.02, 'PCI-SIG CEM (bracket)');

/** Bộ nguồn: rộng × cao (ATX12V / SFX12V Design Guide). Dài lấy từ OpenDB. */
export const PSU_BOX: Record<string, { w: Std; h: Std; len?: Std }> = {
  ATX: { w: s(150, 'ATX12V Design Guide (150 × 86 mm)'), h: s(86, 'ATX12V Design Guide') },
  SFX: { w: s(125, 'SFX12V Design Guide (125 × 63.5 mm)'), h: s(63.5, 'SFX12V Design Guide'), len: s(100, 'SFX12V Design Guide') },
  'SFX-L': { w: s(125, 'SFX12V Design Guide (SFX-L)'), h: s(63.5, 'SFX12V Design Guide'), len: s(130, 'SFX12V Design Guide (SFX-L)') },
};

/** Quạt máy tính: khoảng lỗ vít theo cỡ quạt (cỡ quạt lấy từ OpenDB). */
export const FAN_HOLES: Record<number, Std> = {
  80: s(71.5, 'Cỡ quạt 80 mm (lỗ vít 71.5 mm)'),
  92: s(82.5, 'Cỡ quạt 92 mm (lỗ vít 82.5 mm)'),
  120: s(105, 'Cỡ quạt 120 mm (lỗ vít 105 mm)'),
  140: s(124.5, 'Cỡ quạt 140 mm (lỗ vít 124.5 mm)'),
};
