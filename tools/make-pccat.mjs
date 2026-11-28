// Tạo danh mục linh kiện cho Phòng lắp ráp từ dữ liệu của pc-builder-emulator (MIT).
// Dùng: node tools/make-pccat.mjs <đường-dẫn>/data/feed-components.js
// Dữ liệu gốc lấy từ bảng giá một nhà phân phối nên có nhiều thông số sai/thiếu – ở đây được làm sạch lại.
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
const require = createRequire(import.meta.url);
const C = require('./anatomy-pccheck.js');
const src = process.argv[2];
const { feedComponents: feed } = await import(pathToFileURL(src).href);
const RATE = 25500; // 1 USD ≈ 25.500 đ (giá tham khảo)
const vnd = (usd) => Math.round((usd * RATE) / 10000) * 10000;
const num = (s) => { const m = String(s ?? '').replace(/,/g, '.').match(/\d+(\.\d+)?/); return m ? +m[0] : null; };
const BRAND = { GB: 'GIGABYTE', FD: 'FRACTAL DESIGN', SG: 'SEAGATE', WD: 'WD', 'KINGSTON FURY': 'KINGSTON', ASROCK: 'ASROCK', TEAM: 'TEAMGROUP' };
const brandOf = (x) => { const m = (x.specs.manufacturer || '').toUpperCase().trim(); return /NONAME|^_/.test(m) ? '' : BRAND[m] || m; };
const tidy = (s) => s.replace(/\s+/g, ' ').replace(/\b(MPK|BOX|TRAY|BULK)\b/gi, '').replace(/\s+\/\s*$/, '').trim();

function cpuName(n) {
  let s = tidy(n);
  let m = s.match(/^(I[3579])-(\d{4,5}[A-Z]*)/i);
  if (m) return `Intel Core ${m[1].toLowerCase()}-${m[2].toUpperCase()}`;
  m = s.match(/ULTRA\s*([3579])\s*-?\s*(\d{3}[A-Z]*)/i);
  if (m) return `Intel Core Ultra ${m[1]} ${m[2].toUpperCase()}`;
  m = s.match(/^G(\d{4}[A-Z]*)/i);
  if (m) return `Intel ${+m[1][0] >= 6 ? 'Pentium Gold' : 'Celeron'} G${m[1]}`;
  s = s.replace(/^AMD\s+/i, 'AMD ').replace(/RYZEN/i, 'Ryzen').replace(/ATHLON/i, 'Athlon').replace(/THREADRIPPER/i, 'Threadripper');
  return s.split('/')[0].trim();
}
const clean = [];
for (const x of feed) {
  const s = x.specs, cat = x.category, brand = brandOf(x);
  const img = /^https:\/\//.test(s.image || '') ? s.image : undefined;
  const base = { id: x.id.replace('feed-', ''), c: cat, brand, p: vnd(x.price), ...(img && { img }) };
  if (!x.price || x.price < 5) continue;
  if (cat === 'cpu') {
    let sock = (s.sourceSubcategory.match(/AM4|AM5|LGA\s?1200|LGA\s?1700|LGA\s?1851/) || [s.socket])[0].replace(/\s/g, '');
    if (/Ultra/i.test(s.sourceSubcategory)) sock = 'LGA1851';
    const name = cpuName(x.name);
    const ghz = Math.max(...String(s.boost).split(/[;,]/).map(num).filter((v) => v && v < 7), 0) || null;
    clean.push({ ...base, n: name, socket: sock, cores: s.cores, w: x.wattage, ghz });
  } else if (cat === 'motherboard') {
    let sock = (s.sourceSubcategory.match(/AM4|AM5|LGA1200|LGA1700|LGA1851/) || [s.socket])[0];
    const n = tidy(x.name.replace(/\s*\/\s*(LGA)?\d{4}\b.*$/i, ''));
    let ram = sock === 'AM5' || sock === 'LGA1851' ? 'DDR5' : sock === 'AM4' || sock === 'LGA1200' ? 'DDR4' : /D(DR)?5|DDR5/i.test(x.name) ? 'DDR5' : /D(DR)?4/i.test(x.name) ? 'DDR4' : s.ramType;
    const ff = /\bITX\b|-I\b|MITX/i.test(x.name) ? 'Mini-ITX' : /\b[A-Z]\d{3}M\b|\bM-?ATX\b|MATX|MICRO/i.test(x.name) ? 'mATX' : 'ATX';
    const chip = (x.name.match(/\b(X870E|X870|X670E|X670|B850|B840|B650E|B650|A620|Z890|B860|H810|Z790|B760|B660|H610|H670|Z690|B550|B450|A520|X570|H510|B560|H470|B460)/i) || [s.chipset])[0];
    clean.push({ ...base, n: (brand === 'GIGABYTE' ? 'GIGABYTE ' : '') + n.replace(/^GB\s+/, ''), socket: sock, ram, ff, m2: ff === 'Mini-ITX' ? Math.min(s.m2 || 1, 2) : Math.min(Math.max(s.m2 || 1, 1), 5), sata: ff === 'Mini-ITX' ? 2 : Math.max(s.sata || 4, 2), chip: chip && chip.toUpperCase() });
  } else if (cat === 'ram') {
    const gbAll = num((x.name.match(/(\d+)\s*GB/i) || [])[1]) || num(s.capacity) || 8;
    const kit = x.name.match(/(\d)\s*[xX]\s*(\d+)\s*GB/);
    const n = kit ? +kit[1] : s.modules || 1;
    const gb = kit ? +kit[1] * +kit[2] : gbAll;
    const mhz = num((x.name.match(/\b(\d{4})\b/) || [])[1]) || num(s.speed);
    const B = brand.charAt(0) + brand.slice(1).toLowerCase();
    clean.push({ ...base, n: `${B === 'Teamgroup' ? 'TeamGroup ' : B ? B + ' ' : 'RAM '}${s.ramType}-${mhz} · ${n > 1 ? `${n} × ${gb / n} GB` : `${gb} GB`}`, sku: tidy(x.name), ram: s.ramType, gb, n_: n, mhz });
  } else if (cat === 'gpu') {
    let len = s.length;
    const w = x.wattage;
    if (!len || len < 120 || len > 420) len = w <= 75 ? 170 : w <= 160 ? 240 : w <= 250 ? 285 : 330;
    let vram = num((x.name.match(/\b(\d{1,2})\s*G(B|D\d?)?\b/i) || [])[1]) || num(s.memory) || 8;
    const low = /GT\s?7[1-4]0|GT\s?1030|N7[1-3]0|N210|GT\s?210|P400|P620|T400|T600|T1000|GT\s?610/i.test(x.name);
    if (/GT\s?7[1-4]0|GT\s?1030|N7[1-3]0|N210|GT\s?210|P400|P620|T400|T600|T1000|GT\s?610/i.test(x.name)) vram = Math.min(vram, /T1000|T600/i.test(x.name) ? 4 : 2);
    clean.push({ ...base, n: tidy(x.name.replace(/^GB\s+/, 'GIGABYTE ')), len: low ? Math.min(len, 190) : len, vram, w: low ? Math.min(w, 50) : w, slots: s.slots || 2 });
  } else if (cat === 'storage') {
    if (/for NB/i.test(s.sourceSubcategory)) continue;
    const kind = /HDD/.test(s.sourceSubcategory) ? 'HDD' : /PCIE/i.test(s.sourceSubcategory) ? 'NVMe' : 'SATA SSD';
    const iface = /M2/.test(s.sourceSubcategory) ? 'M.2' : 'SATA';
    let gb = num(s.capacity) || 500; const tb = x.name.match(/(\d+(\.\d+)?)\s*TB/i); if (tb) gb = Math.round(+tb[1] * 1000); else { const g = x.name.match(/(\d{3,4})\s*G/i); if (g) gb = +g[1]; }
    clean.push({ ...base, n: tidy(x.name.replace(/^SG\s+/, 'SEAGATE ')), kind, iface, gb, form: /3\.5/.test(s.sourceSubcategory) ? '3.5"' : iface === 'M.2' ? 'M.2 2280' : '2.5"' });
  } else if (cat === 'psu') {
    const cands = (x.name.match(/\d{3,4}/g) || []).map(Number).filter((v) => v >= 250 && v <= 2200 && v !== 1200 || v === 1200);
    const watts = cands.length ? cands[cands.length - 1] : s.watts >= 250 ? s.watts : null;
    if (!watts) continue;
    const rating = (x.name.match(/PLATINUM|TITANIUM|GOLD|SILVER|BRONZE/i) || [''])[0].toUpperCase() || (/85\+|80\+/.test(x.name) ? '80+' : '');
    clean.push({ ...base, n: tidy(x.name.replace(/^PSU\s+/, '').replace(/^FD\s+/, 'FRACTAL DESIGN ')), watts, rating: rating ? (rating === '80+' ? '80 Plus' : '80 Plus ' + rating[0] + rating.slice(1).toLowerCase()) : '' });
  } else if (cat === 'cooler') {
    if (/\/1151|SNK-|\b[12]U\b|PASSIVE/i.test(x.name)) continue;
    let sockets = s.supportedSockets;
    if (/FOR AMD|\/AM4\b/i.test(x.name)) sockets = ['AM4', 'AM5'];
    else if (/FOR INTEL/i.test(x.name)) sockets = ['LGA1200', 'LGA1700'];
    clean.push({ ...base, n: tidy(x.name.replace(/^FD\s+/, 'FRACTAL DESIGN ')), sockets, style: s.style === 'Liquid' ? 'Liquid' : 'Air', cap: s.coolingCapacity, rad: s.style === 'Liquid' ? s.radiator || 240 : 0 });
  } else if (cat === 'case') {
    const ff = /\bM-?ITX\b|\bITX\b/i.test(x.name) ? 'Mini-ITX' : /MICRO|M-?ATX|MATX/i.test(x.name) ? 'mATX' : 'ATX';
    let g = s.maxGpu; if (!g || g < 150 || g > 480) g = ff === 'ATX' ? 360 : ff === 'mATX' ? 320 : 300;
    if (ff === 'Mini-ITX') g = Math.min(g, 330);
    clean.push({ ...base, n: tidy(x.name.replace(/^FD\s+/, 'FRACTAL DESIGN ')), ff, gpu: g, rad: ff === 'Mini-ITX' ? Math.min(s.radiator || 240, 280) : s.radiator || 280 });
  }
}
// RAM: n_ → n
for (const r of clean) if (r.c === 'ram') { r.n_kit = r.n; }
const parts = clean.map((r) => { if (r.c !== 'ram') return r; const { n_, n_kit, ...o } = r; return { ...o, n: n_kit, mods: n_ }; });
// pccheck dùng .n cho số thanh RAM → đổi tên tên RAM sang .name chung cho mọi linh kiện
const out = parts.map((r) => { const { n, mods, ...o } = r; return r.c === 'ram' ? { ...o, name: n, n: mods } : { ...o, name: n }; });

// ---------- cấu hình mẫu: chọn tự động rồi kiểm tra ----------
const by = (c) => out.filter((r) => r.c === c);
const cheapest = (arr) => arr.slice().sort((a, b) => a.p - b.p)[0];
function make(o) {
  const b = { storage: [] };
  b.cpu = cheapest(by('cpu').filter(o.cpu));
  b.motherboard = cheapest(by('motherboard').filter((m) => m.socket === b.cpu.socket && (o.mb ? o.mb(m) : true)));
  b.ram = { part: cheapest(by('ram').filter((r) => r.ram === b.motherboard.ram && o.ram(r))), qty: o.qty || 1 };
  b.gpu = cheapest(by('gpu').filter(o.gpu));
  b.storage = o.sto.map((f) => cheapest(by('storage').filter(f)));
  b.cooler = cheapest(by('cooler').filter((c) => C.coolerFits(c, b.cpu.socket) && c.cap >= b.cpu.w * 1.35 && (o.cool ? o.cool(c) : true)));
  b.case = cheapest(by('case').filter((c) => ({ 'Mini-ITX': 0, mATX: 1, ATX: 2 })[c.ff] >= ({ 'Mini-ITX': 0, mATX: 1, ATX: 2 })[b.motherboard.ff] && c.gpu >= b.gpu.len + 10 && (!b.cooler.rad || c.rad >= b.cooler.rad)));
  const need = C.power(b);
  b.psu = cheapest(by('psu').filter((p) => p.watts >= Math.ceil((need * 1.4) / 10) * 10 && (o.psu ? o.psu(p) : true)));
  return b;
}
const PRESETS = [
  { id: 'office', name: 'Văn phòng tiết kiệm', desc: 'Soạn thảo, bảng tính, xem phim. Ưu tiên rẻ và êm.', o: { cpu: (c) => c.socket === 'LGA1700' && /i3-/.test(c.name), mb: (m) => m.ff === 'mATX', ram: (r) => r.gb === 8 && r.n === 1, qty: 2, gpu: (g) => g.vram >= 2 && g.vram <= 4, sto: [(d) => d.kind === 'SATA SSD' && d.gb >= 480] } },
  { id: 'study', name: 'Học tập – đa năng', desc: 'Học lập trình, làm đồ hoạ nhẹ, chơi game nhẹ.', o: { cpu: (c) => c.socket === 'AM4' && c.cores >= 6, ram: (r) => r.gb >= 16 && r.n === 2, gpu: (g) => g.vram >= 6 && g.vram <= 8, sto: [(d) => d.kind === 'NVMe' && d.gb >= 500] } },
  { id: 'game', name: 'Chơi game tầm trung', desc: 'Game Full HD/2K mượt, nền tảng AM5 mới.', o: { cpu: (c) => c.socket === 'AM5' && c.cores >= 6 && c.cores <= 8, mb: (m) => /B650|B850/.test(m.chip || ''), ram: (r) => r.gb >= 32 && r.n === 2, gpu: (g) => /4060 TI|5060 TI|RX 9060|4070|5070/i.test(g.name) && g.vram >= 12, sto: [(d) => d.kind === 'NVMe' && d.gb >= 1000] } },
  { id: 'creator', name: 'Đồ hoạ – dựng phim', desc: 'CPU nhiều nhân, RAM lớn, tản nước, thêm ổ HDD chứa dữ liệu.', o: { cpu: (c) => c.socket === 'AM5' && c.cores >= 16, mb: (m) => m.ff === 'ATX', ram: (r) => r.gb >= 64, gpu: (g) => /5070 TI|4070 TI|5080/i.test(g.name), sto: [(d) => d.kind === 'NVMe' && d.gb >= 2000, (d) => d.kind === 'HDD' && d.gb >= 4000], cool: (c) => c.style === 'Liquid' && c.rad >= 360, psu: (p) => /GOLD|PLATINUM/i.test(p.rating) } },
  { id: 'intel', name: 'Intel Core Ultra', desc: 'Nền tảng Intel mới nhất (LGA1851, DDR5).', o: { cpu: (c) => c.socket === 'LGA1851' && c.cores >= 14, mb: (m) => m.ff === 'ATX', ram: (r) => r.gb >= 32 && r.n === 2, gpu: (g) => /5070|4070/i.test(g.name) && !/TI/i.test(g.name), sto: [(d) => d.kind === 'NVMe' && d.gb >= 1000] } },
];
const presets = [];
for (const P of PRESETS) {
  const b = make(P.o);
  const r = C.check(b);
  if (Object.values(b).some((v) => v === undefined) || b.storage.some((d) => !d) || !b.ram.part) { console.error('Thiếu linh kiện cho mẫu', P.id, Object.entries(b).filter(([, v]) => !v).map(([k]) => k)); continue; }
  console.log(P.id, (r.price / 1e6).toFixed(1) + 'tr', r.errors, r.warnings, Object.fromEntries(Object.entries(b).map(([k, v]) => [k, k === 'ram' ? v.part.name + ' x' + v.qty : k === 'storage' ? v.map((d) => d.name) : v.name])));
  presets.push({ id: P.id, name: P.name, desc: P.desc, build: { case: b.case.id, motherboard: b.motherboard.id, cpu: b.cpu.id, ram: { id: b.ram.part.id, qty: b.ram.qty }, gpu: b.gpu.id, storage: b.storage.map((d) => d.id), psu: b.psu.id, cooler: b.cooler.id }, price: r.price });
}
// Ngân sách đề thi: ~1,35 lần cấu hình rẻ nhất đáp ứng yêu cầu (làm tròn tới triệu)
const budgets = {};
const BR = { office: PRESETS[0].o, study: PRESETS[1].o, game: { ...PRESETS[2].o, gpu: (g) => g.vram >= 8 && g.vram <= 8, ram: (r) => r.gb >= 16 && r.n === 2 }, creator: { ...PRESETS[3].o, ram: (r) => r.gb >= 32, gpu: (g) => g.vram >= 12 } };
for (const br of C.BRIEFS) {
  const b = make(BR[br.id]);
  const r = C.check(b);
  const allReq = br.req.every((q) => C.reqMet(b, q));
  budgets[br.id] = Math.ceil((r.price * 1.35) / 1e6) * 1e6;
  console.log('đề', br.id, (r.price / 1e6).toFixed(1) + 'tr → ngân sách', budgets[br.id] / 1e6, 'tr', allReq ? 'đạt' : 'KHÔNG ĐẠT', r.errors);
}
const counts = {}; out.forEach((r) => (counts[r.c] = (counts[r.c] || 0) + 1));
console.log(counts, out.length);
writeFileSync(new URL('./anatomy-pccat.js', import.meta.url), `// Danh mục linh kiện cho Phòng lắp ráp – tạo bởi tools/make-pccat.mjs từ dữ liệu pc-builder-emulator (MIT, https://github.com/lhristo/pc-builder-emulator).\n// Giá quy đổi tham khảo 1 USD ≈ ${RATE} đ, chỉ dùng cho học tập.\nwindow.PCCAT=${JSON.stringify({ rate: RATE, parts: out, presets, budgets })};\n`);
