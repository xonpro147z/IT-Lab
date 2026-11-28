/**
 * TinHocLab – SKU Parser + Dimension Parser.
 *
 * Bản ghi BuildCores OpenDB (JSON) → `Spec`: mã SKU, hãng, tên, và mọi kích thước bộ sinh cần, đơn vị mm.
 * Mỗi kích thước ghi rõ nguồn: `opendb` (có trong bản ghi), `standard` (tiêu chuẩn công bố, xem standards.ts)
 * hoặc `estimate` (quy tắc ước lượng có giới hạn – ghi lại quy tắc). Không có số nào không rõ nguồn.
 *
 * Theo quy tắc của Teardown (SKILL.md): "Real numbers, one source" – mô hình, nhãn và metadata đều đọc từ Spec.
 */
import { BOARD, CPU_PACKAGE, DIMM, FAN_HOLES, M2_PCB, M2_TOP, m2Size, PCIE_FULL_HEIGHT, PSU_BOX, SFF_25, SLOT_PITCH, type Std } from './standards.ts';

export type Category = 'ram' | 'ssd' | 'cpu' | 'gpu' | 'motherboard' | 'psu' | 'case' | 'cooler';
export type Source = 'opendb' | 'standard' | 'estimate';
export type Dim = { value: number; source: Source; ref: string };
export type Accuracy = 'exact' | 'dimension-based' | 'approximate';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Rec = Record<string, any>;

export type Spec = {
  sku: string;
  category: Category;
  opendbCategory: string;
  manufacturer: string;
  name: string;
  partNumbers: string[];
  dims: Record<string, Dim>;
  /** Đặc điểm rời rạc (số quạt, có tản nhiệt không…), cùng nguồn như dims. */
  features: Record<string, { value: unknown; source: Source; ref: string }>;
  /** Kích thước quyết định độ chính xác của cả mô hình. */
  primary: string[];
  hash: string;
};

export const CATEGORY_OF: Record<string, Category> = {
  RAM: 'ram',
  Storage: 'ssd',
  CPU: 'cpu',
  GPU: 'gpu',
  Motherboard: 'motherboard',
  PSU: 'psu',
  PCCase: 'case',
  CPUCooler: 'cooler',
};

/** Băm ổn định (FNV-1a 32 bit) của bản ghi: đổi thông số → đổi băm → sinh lại mô hình. */
export function hashRecord(rec: unknown) {
  const sorted = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(sorted) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v as Rec).sort().map((k) => [k, sorted((v as Rec)[k])])) : v;
  const str = JSON.stringify(sorted(rec));
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const num = (v: unknown) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : null);

function builder() {
  const dims: Record<string, Dim> = {};
  const features: Spec['features'] = {};
  return {
    dims,
    features,
    db(k: string, v: number, field: string) {
      dims[k] = { value: v, source: 'opendb', ref: field };
    },
    std(k: string, v: Std) {
      dims[k] = { value: v.value, source: 'standard', ref: v.source };
    },
    est(k: string, v: number, rule: string) {
      dims[k] = { value: v, source: 'estimate', ref: rule };
    },
    /** Lấy từ OpenDB nếu có, nếu không thì ước lượng theo quy tắc. */
    dbOr(k: string, v: unknown, field: string, fallback: number, rule: string) {
      const n = num(v);
      if (n !== null) this.db(k, n, field);
      else this.est(k, fallback, rule);
    },
    f(k: string, value: unknown, source: Source, ref: string) {
      features[k] = { value, source, ref };
    },
  };
}

/** Bản ghi OpenDB → Spec. `opendbCategory` là tên thư mục trong OpenDB (RAM, GPU, PCCase…). */
export function parseSpec(rec: Rec, opendbCategory: string): Spec {
  const category = CATEGORY_OF[opendbCategory];
  if (!category) throw new Error('Chưa hỗ trợ nhóm linh kiện: ' + opendbCategory);
  const md = rec.metadata ?? {};
  const b = builder();
  let primary: string[] = [];
  const lighting: string[] = Array.isArray(rec.lighting) ? rec.lighting : [];
  const color: string[] = Array.isArray(rec.color) ? rec.color : [];
  b.f('color', color, color.length ? 'opendb' : 'estimate', color.length ? 'color' : 'không có màu trong OpenDB → màu trung tính');
  b.f('lighting', lighting, 'opendb', 'lighting');

  if (category === 'ram') {
    const ff = (rec.form_factor as string) in DIMM ? (rec.form_factor as string) : null;
    const d = DIMM[ff ?? '288-pin DIMM'];
    if (!ff) b.f('formFactor', '288-pin DIMM', 'estimate', 'thiếu form_factor → giả định DIMM 288 chân');
    else b.f('formFactor', ff, 'opendb', 'form_factor');
    b.std('length', d.length);
    b.std('pcbHeight', d.pcbHeight);
    b.std('pcb', d.pcb);
    const spreader = rec.heat_spreader === true || (rec.heat_spreader == null && num(rec.height) !== null && rec.height > 33);
    b.f('heatSpreader', spreader, rec.heat_spreader == null ? 'estimate' : 'opendb', rec.heat_spreader == null ? 'suy từ height > 33 mm' : 'heat_spreader');
    const rgb = rec.rgb === true || lighting.some((l) => /RGB/i.test(l));
    b.f('rgb', rgb, 'opendb', rec.rgb != null ? 'rgb' : 'lighting');
    if (num(rec.height)) b.db('height', rec.height, 'height');
    else if (!spreader) b.std('height', d.pcbHeight);
    else b.est('height', 42, 'thanh RAM có tản nhiệt thường cao 35–45 mm → 42 mm');
    if (spreader) b.est('thickness', 7.5, 'bề dày tản nhiệt nhôm hai mặt ≈ 7–8 mm');
    else b.est('thickness', d.pcb.value + 2 * 1.2, 'bo 1.27 mm + chip BGA ≈ 1.2 mm mỗi mặt');
    const cap = num(rec.modules?.capacity_gb);
    b.f('modules', num(rec.modules?.quantity) ?? 1, rec.modules?.quantity ? 'opendb' : 'estimate', rec.modules?.quantity ? 'modules.quantity' : 'thiếu → 1 thanh');
    b.f('ramType', rec.ram_type ?? 'DDR5', rec.ram_type ? 'opendb' : 'estimate', 'ram_type');
    // 64 bit dữ liệu / chip x8 = 8 chip mỗi rank; từ 32 GB mỗi thanh thường là hai rank (hai mặt)
    b.f('sides', cap && cap >= 32 ? 2 : 1, 'estimate', '≥ 32 GB/thanh → hai mặt chip (dual rank)');
    primary = ['length', 'height'];
  } else if (category === 'ssd') {
    const ff: string = rec.form_factor ?? '';
    const m2 = m2Size(ff);
    b.f('formFactor', ff || 'M.2-2280', ff ? 'opendb' : 'estimate', ff ? 'form_factor' : 'thiếu → M.2-2280');
    if (m2 || !ff) {
      const m = m2 ?? m2Size('M.2-2280')!;
      b.std('length', m.length);
      b.std('width', m.width);
      b.std('pcb', M2_PCB);
      b.std('top', M2_TOP);
      const heatsink = /heat ?sink/i.test(md.name ?? '');
      b.f('heatsink', heatsink, 'opendb', 'metadata.name ("Heatsink")');
      if (heatsink) b.est('heatsinkHeight', 8.0, 'tản nhiệt SSD M.2 kèm theo ≈ 8 mm tổng chiều dày');
      const capGB = num(rec.capacity) ?? 1000;
      b.f('nand', Math.min(4, Math.max(1, Math.round(capGB / 1000))), 'estimate', 'mỗi ~1 TB một chip NAND, tối đa 4');
      b.f('dram', num(rec.cache) ? true : rec.cache === 0 ? false : null, rec.cache == null ? 'estimate' : 'opendb', 'cache');
      b.f('kind', 'm2', 'opendb', 'form_factor');
      primary = ['length', 'width'];
    } else {
      b.std('length', SFF_25.length);
      b.std('width', SFF_25.width);
      b.std('height', SFF_25.height);
      b.f('kind', ff === '3.5"' ? 'hdd35' : 'sata25', 'opendb', 'form_factor');
      primary = ['length', 'width', 'height'];
    }
    b.f('capacity', num(rec.capacity), 'opendb', 'capacity');
  } else if (category === 'cpu') {
    const pk = CPU_PACKAGE[rec.socket as string];
    b.f('socket', rec.socket ?? null, 'opendb', 'socket');
    if (pk) {
      b.std('width', pk.w);
      b.std('depth', pk.h);
      b.f('contacts', pk.kind, 'standard', pk.w.source);
    } else {
      b.est('width', 40, 'socket chưa có trong bảng chuẩn → 40 × 40 mm');
      b.est('depth', 40, 'socket chưa có trong bảng chuẩn → 40 × 40 mm');
      b.f('contacts', 'LGA', 'estimate', 'mặc định LGA');
    }
    b.est('substrate', 1.2, 'đế CPU (substrate) ≈ 1.1–1.3 mm');
    b.est('ihsHeight', 3.4, 'nắp tản nhiệt IHS ≈ 3–4 mm tính cả gờ');
    const total = num(rec.cores?.total);
    const amd = /AMD/i.test(md.manufacturer ?? '');
    b.f('vendor', amd ? 'AMD' : 'Intel', 'opendb', 'metadata.manufacturer');
    // Zen 4/5 trên AM5: mỗi CCD tối đa 8 nhân, cộng một I/O die; Intel desktop: một khối die
    b.f('dies', amd ? [total && total > 8 ? 2 : 1, 1] : [1, 0], amd ? 'estimate' : 'estimate', amd ? 'AMD chiplet: ≤ 8 nhân → 1 CCD, > 8 → 2 CCD, + 1 I/O die' : 'Intel desktop: một die');
    b.f('cores', total, total ? 'opendb' : 'estimate', 'cores.total');
    primary = ['width', 'depth'];
  } else if (category === 'gpu') {
    b.dbOr('length', rec.length, 'length', 240, 'thiếu chiều dài → 240 mm (card 2 quạt phổ biến)');
    const slots = num(rec.total_slot_width) ?? num(rec.case_expansion_slot_width);
    if (slots) {
      b.dims.thickness = { value: slots * SLOT_PITCH.value, source: 'opendb', ref: `total_slot_width × ${SLOT_PITCH.value} mm (${SLOT_PITCH.source})` };
      b.f('slots', slots, 'opendb', 'total_slot_width');
    } else {
      b.est('thickness', 2 * SLOT_PITCH.value, 'thiếu số slot → 2 slot');
      b.f('slots', 2, 'estimate', 'thiếu số slot → 2');
    }
    b.std('pcbHeight', PCIE_FULL_HEIGHT);
    b.est('shroudHeight', PCIE_FULL_HEIGHT.value + 12, 'vỏ tản nhiệt thường nhô quá bo PCIe full-height ≈ 10–15 mm');
    const cooling: string = rec.cooling ?? '';
    const fans = /(\d) Fan/.exec(cooling);
    b.f('cooling', cooling || '2 Fans', cooling ? 'opendb' : 'estimate', 'cooling');
    b.f('fans', fans ? +fans[1] : /Blower/i.test(cooling) ? 1 : /Passive/i.test(cooling) ? 0 : 2, cooling ? 'opendb' : 'estimate', 'cooling');
    b.f('blower', /Blower/i.test(cooling), 'opendb', 'cooling');
    const bus = num(rec.memory_bus);
    // mỗi chip GDDR có giao tiếp 32 bit
    b.f('vram', bus ? Math.round(bus / 32) : Math.max(4, Math.round((num(rec.memory) ?? 8) / 2)), bus ? 'opendb' : 'estimate', bus ? 'memory_bus / 32 bit mỗi chip GDDR' : 'thiếu memory_bus → 1 chip mỗi 2 GB');
    const pc = rec.power_connectors ?? {};
    b.f('power', { pin8: (pc.pcie_8_pin ?? 0) as number, pin6: (pc.pcie_6_pin ?? 0) as number, hpwr: ((pc.pcie_12VHPWR ?? 0) + (pc.pcie_12V_2x6 ?? 0)) as number }, rec.power_connectors ? 'opendb' : 'estimate', 'power_connectors');
    b.f('btf', /BTF/i.test(md.name ?? ''), 'opendb', 'metadata.name ("BTF": đầu nguồn ở mép cắm)');
    b.f('backplate', true, 'estimate', 'card nhiều quạt hiện nay đều có tấm lưng');
    b.f('chipset', rec.chipset ?? null, 'opendb', 'chipset');
    primary = ['length', 'thickness'];
  } else if (category === 'motherboard') {
    const ff = rec.form_factor in BOARD ? rec.form_factor : null;
    const bd = BOARD[ff ?? 'ATX'];
    b.f('formFactor', ff ?? 'ATX', ff ? 'opendb' : 'estimate', 'form_factor');
    b.std('height', bd.w); // dọc mặt sau vỏ (trục Y)
    b.std('depth', bd.d); // vào trong vỏ (trục X)
    b.est('pcb', 1.6, 'bo mạch chủ ≈ 1.6 mm');
    b.f('socket', rec.socket ?? null, 'opendb', 'socket');
    b.f('dimms', num(rec.memory?.slots) ?? 4, rec.memory?.slots ? 'opendb' : 'estimate', 'memory.slots');
    const pcie: { lanes: number; gen: string }[] = [];
    for (const s of Array.isArray(rec.pcie_slots) ? rec.pcie_slots : []) for (let i = 0; i < (s.quantity ?? 1); i++) pcie.push({ lanes: s.lanes ?? 1, gen: s.gen ?? '' });
    pcie.sort((a, c) => c.lanes - a.lanes);
    b.f('pcie', pcie.length ? pcie : [{ lanes: 16, gen: '' }], pcie.length ? 'opendb' : 'estimate', 'pcie_slots');
    b.f('m2', Array.isArray(rec.m2_slots) ? rec.m2_slots.length : 1, rec.m2_slots ? 'opendb' : 'estimate', 'm2_slots');
    b.f('ports', Array.isArray(rec.back_panel_ports) ? rec.back_panel_ports.length : null, 'opendb', 'back_panel_ports');
    b.f('wifi', !!rec.wireless_networking || /wi-?fi/i.test(md.name ?? ''), 'opendb', 'wireless_networking');
    b.f('layout', 'ATX', 'estimate', 'vị trí socket, khe RAM, khe PCIe theo bố cục ATX thông dụng (không có toạ độ trong OpenDB)');
    primary = ['height', 'depth'];
  } else if (category === 'psu') {
    const ff = rec.form_factor in PSU_BOX ? rec.form_factor : null;
    const box = PSU_BOX[ff ?? 'ATX'];
    b.f('formFactor', ff ?? 'ATX', ff ? 'opendb' : 'estimate', 'form_factor');
    b.std('width', box.w);
    b.std('height', box.h);
    if (num(rec.length)) b.db('length', rec.length, 'length');
    else if (box.len) b.std('length', box.len);
    else b.est('length', 160, 'thiếu chiều dài ATX → 160 mm');
    b.f('modular', rec.modular ?? 'Non-Modular', rec.modular ? 'opendb' : 'estimate', 'modular');
    b.f('connectors', rec.connectors ?? null, 'opendb', 'connectors');
    b.f('fanless', rec.fanless === true, 'opendb', 'fanless');
    b.est('fan', ff === 'SFX' || ff === 'SFX-L' ? 92 : 135, 'quạt nguồn ATX thường 120–140 mm, SFX 92 mm');
    b.f('wattage', num(rec.wattage), 'opendb', 'wattage');
    primary = ['width', 'height', 'length'];
  } else if (category === 'case') {
    const d = rec.dimensions_mm ?? {};
    let dd = num(d.depth),
      w = num(d.width),
      h = num(d.height);
    if ((!dd || !w || !h) && typeof rec.dimensions === 'string') {
      const n = (rec.dimensions.match(/[\d.]+/g) ?? []).map(Number);
      if (n.length >= 3) [dd, w, h] = [n[0], n[1], n[2]];
    }
    b.dbOr('depth', dd, 'dimensions_mm.depth', 450, 'thiếu → vỏ ATX mid tower ≈ 450 mm');
    b.dbOr('width', w, 'dimensions_mm.width', 230, 'thiếu → 230 mm');
    b.dbOr('height', h, 'dimensions_mm.height', 470, 'thiếu → 470 mm');
    b.est('wall', 1.0, 'tôn vỏ ≈ 0.8–1.2 mm');
    b.f('sidePanel', rec.side_panel ?? 'Solid', rec.side_panel ? 'opendb' : 'estimate', 'side_panel');
    b.f('shroud', rec.power_supply_shroud ?? true, rec.power_supply_shroud == null ? 'estimate' : 'opendb', 'power_supply_shroud');
    b.f('slots', num(rec.expansion_slots) ?? 7, rec.expansion_slots ? 'opendb' : 'estimate', 'expansion_slots');
    b.f('maxGpu', num(rec.max_video_card_length), 'opendb', 'max_video_card_length');
    b.f('maxCooler', num(rec.max_cpu_cooler_height), 'opendb', 'max_cpu_cooler_height');
    b.f('fans', 3, 'estimate', 'OpenDB không ghi quạt kèm vỏ → vẽ 2 quạt trước + 1 quạt sau 120 mm');
    primary = ['depth', 'width', 'height'];
  } else if (category === 'cooler') {
    const water = rec.water_cooled === true;
    b.f('water', water, 'opendb', 'water_cooled');
    b.dbOr('fanSize', rec.fan_size, 'fan_size', 120, 'thiếu cỡ quạt → 120 mm');
    b.f('fans', num(rec.fan_quantity) ?? (water ? Math.max(1, Math.round((num(rec.radiator_size) ?? 240) / 120)) : 1), rec.fan_quantity ? 'opendb' : 'estimate', 'fan_quantity');
    const fs = b.dims.fanSize.value;
    if (FAN_HOLES[fs]) b.std('fanHoles', FAN_HOLES[fs]);
    if (water) {
      b.dbOr('radiator', rec.radiator_size, 'radiator_size', 240, 'thiếu → két 240 mm');
      b.est('radThickness', 27, 'két tản nước thường dày 27–38 mm → 27 mm');
      b.dbOr('pumpHeight', rec.height, 'height', 60, 'thiếu → khối bơm cao 60 mm');
      primary = ['radiator', 'fanSize'];
    } else {
      b.dbOr('height', rec.height, 'height', 155, 'thiếu → tản tháp 155 mm');
      const fans = b.features.fans.value as number;
      b.f('towers', fans >= 2 ? 2 : 1, 'estimate', '2 quạt trở lên → tản tháp đôi');
      b.est('towerDepth', b.features.towers.value === 2 ? 48 : 55, 'bề dày một tháp lá tản ≈ 45–55 mm');
      b.f('heatpipes', b.features.towers.value === 2 ? 6 : 4, 'estimate', 'tháp đôi 6 ống dẫn nhiệt, tháp đơn 4');
      b.est('base', 40, 'đế tiếp xúc ≈ 40 × 40 mm');
      primary = ['height', 'fanSize'];
    }
  }
  return {
    sku: String(rec.opendb_id ?? md.part_numbers?.[0] ?? 'unknown'),
    category,
    opendbCategory,
    manufacturer: md.manufacturer ?? '',
    name: (md.name ?? '').trim(),
    partNumbers: Array.isArray(md.part_numbers) ? md.part_numbers : [],
    dims: b.dims,
    features: b.features,
    primary,
    hash: hashRecord(rec),
  };
}

/**
 * Độ chính xác: "exact" chỉ khi có bản vẽ/ảnh tham chiếu (chưa có SKU nào); "dimension-based" khi mọi kích thước
 * chính đến từ OpenDB hoặc tiêu chuẩn; còn lại "approximate".
 */
export function accuracyOf(spec: Spec, reference = false): Accuracy {
  if (reference) return 'exact';
  return spec.primary.every((k) => spec.dims[k] && spec.dims[k].source !== 'estimate') ? 'dimension-based' : 'approximate';
}

export const D = (spec: Spec, k: string) => {
  const d = spec.dims[k];
  if (!d) throw new Error(`Spec ${spec.sku} thiếu kích thước "${k}"`);
  return d.value;
};
export const F = <V = unknown>(spec: Spec, k: string) => spec.features[k]?.value as V;
