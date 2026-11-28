// TinHocLab – kiểm tra độ tương thích của một cấu hình máy tính (dùng cho Phòng lắp ráp).
// Quy tắc dựa theo pc-builder-emulator (MIT, https://github.com/lhristo/pc-builder-emulator), viết lại bằng tiếng Việt.
// Dùng được cả trong trình duyệt (window.PCCHECK) lẫn Node (module.exports).
(function (root) {
  const SLOTS = ['case', 'motherboard', 'cpu', 'ram', 'gpu', 'storage', 'psu', 'cooler'];
  const LABEL = { case: 'Vỏ máy', motherboard: 'Bo mạch chủ', cpu: 'CPU', ram: 'RAM', gpu: 'Card đồ hoạ', storage: 'Ổ lưu trữ', psu: 'Bộ nguồn', cooler: 'Tản nhiệt CPU' };
  const FF = { 'Mini-ITX': 0, mATX: 1, ATX: 2 };
  const FFNAME = { 'Mini-ITX': 'Mini-ITX', mATX: 'Micro-ATX', ATX: 'ATX' };
  // LGA1851 dùng chung kiểu gá tản nhiệt với LGA1700
  const coolerFits = (cool, sock) => cool.sockets.includes(sock) || (sock === 'LGA1851' && cool.sockets.includes('LGA1700')) || (sock === 'LGA1700' && cool.sockets.includes('LGA1851'));

  // b: { case, motherboard, cpu, gpu, psu, cooler: part|null, ram: {part, qty}|null, storage: [part] }
  function power(b) {
    let w = 50;
    if (b.cpu) w += b.cpu.w;
    if (b.gpu) w += b.gpu.w;
    if (b.ram) w += 4 * b.ram.part.n * b.ram.qty;
    w += 6 * (b.storage || []).length;
    if (b.cooler) w += b.cooler.style === 'Liquid' ? 10 : 4;
    return w;
  }
  function price(b) {
    let p = 0;
    for (const s of ['case', 'motherboard', 'cpu', 'gpu', 'psu', 'cooler']) if (b[s]) p += b[s].p;
    if (b.ram) p += b.ram.part.p * b.ram.qty;
    for (const d of b.storage || []) p += d.p;
    return p;
  }
  function check(b) {
    const errors = [], warnings = [], ok = [];
    const mb = b.motherboard, cpu = b.cpu, cs = b.case, gpu = b.gpu, psu = b.psu, cool = b.cooler, ram = b.ram, sto = b.storage || [];
    const missing = SLOTS.filter((s) => (s === 'storage' ? !sto.length : !b[s]));
    if (mb && cpu) {
      if (mb.socket !== cpu.socket) errors.push(`CPU dùng socket ${cpu.socket} nhưng bo mạch chủ có socket ${mb.socket} – không cắm vừa.`);
      else ok.push(`CPU và bo mạch chủ cùng socket ${cpu.socket}.`);
    }
    if (mb && ram) {
      const slots = mb.ff === 'Mini-ITX' ? 2 : 4, sticks = ram.part.n * ram.qty;
      if (ram.part.ram !== mb.ram) errors.push(`RAM ${ram.part.ram} không lắp được vào bo mạch chủ dùng ${mb.ram} (khác chuẩn, khác vị trí khấc).`);
      else ok.push(`RAM ${ram.part.ram} đúng chuẩn bo mạch chủ.`);
      if (sticks > slots) errors.push(`Cần ${sticks} khe RAM nhưng bo mạch chủ chỉ có ${slots} khe.`);
      else if (sticks === 1) warnings.push('Chỉ có 1 thanh RAM nên không chạy được kênh đôi (dual channel) – nên dùng 2 thanh.');
    }
    if (ram) ok.push(`Tổng dung lượng RAM: ${ram.part.gb * ram.qty} GB.`);
    if (cs && mb) {
      if (FF[mb.ff] > FF[cs.ff]) errors.push(`Bo mạch chủ ${FFNAME[mb.ff]} quá lớn so với vỏ máy ${FFNAME[cs.ff]}.`);
      else ok.push(`Bo mạch chủ ${FFNAME[mb.ff]} vừa vỏ máy.`);
    }
    if (cs && gpu) {
      if (gpu.len > cs.gpu) errors.push(`Card đồ hoạ dài ${gpu.len} mm, vỏ máy chỉ chứa được card dài tối đa ${cs.gpu} mm.`);
      else ok.push(`Card đồ hoạ vừa vỏ máy (còn dư ${cs.gpu - gpu.len} mm).`);
    }
    if (mb && sto.length) {
      const m2 = sto.filter((d) => d.iface === 'M.2').length, sata = sto.length - m2;
      if (m2 > mb.m2) errors.push(`Cần ${m2} khe M.2 nhưng bo mạch chủ chỉ có ${mb.m2}.`);
      if (sata > mb.sata) errors.push(`Cần ${sata} cổng SATA nhưng bo mạch chủ chỉ có ${mb.sata}.`);
      if (!sto.some((d) => d.kind !== 'HDD')) warnings.push('Máy chỉ có ổ cứng HDD nên khởi động và mở phần mềm sẽ chậm – nên có thêm SSD.');
    }
    if (cpu && cool) {
      if (!coolerFits(cool, cpu.socket)) errors.push(`Tản nhiệt không có bộ gá cho socket ${cpu.socket}.`);
      else if (cool.cap < cpu.w) errors.push(`Tản nhiệt chỉ giải được khoảng ${cool.cap} W, CPU toả ${cpu.w} W – CPU sẽ quá nóng.`);
      else if (cool.cap < cpu.w * 1.3) warnings.push('Tản nhiệt vừa đủ cho CPU, khi chạy nặng có thể nóng và ồn.');
      else ok.push('Tản nhiệt hợp với CPU.');
    }
    if (cs && cool && cool.style === 'Liquid' && cool.rad > cs.rad) errors.push(`Tản nước cần chỗ gắn két ${cool.rad} mm, vỏ máy chỉ hỗ trợ ${cs.rad} mm.`);
    const need = power(b);
    if (psu) {
      const rec = Math.ceil((need * 1.3) / 10) * 10;
      if (psu.watts < need) errors.push(`Máy cần khoảng ${need} W nhưng nguồn chỉ ${psu.watts} W – máy sẽ sập nguồn.`);
      else if (psu.watts < rec) errors.push(`Nguồn ${psu.watts} W quá sát mức tiêu thụ ${need} W – nên dùng nguồn từ ${rec} W trở lên (dư ít nhất 30%).`);
      else ok.push(`Nguồn ${psu.watts} W đủ cho máy (tiêu thụ khoảng ${need} W).`);
    }
    return { errors, warnings, ok, missing, watts: need, price: price(b) };
  }
  // Ánh xạ cấu hình sang các mô hình 3D có sẵn của PC Anatomy (tham số trên địa chỉ trang)
  function toAnatomy(b) {
    const q = {};
    if (b.cpu) q.cpu = /^AM/.test(b.cpu.socket) ? 'ryzen' : 'corei9';
    if (b.motherboard) {
      const m = b.motherboard, amd = /^AM/.test(m.socket);
      q.board = amd ? (m.ff === 'ATX' ? (m.brand === 'MSI' ? 'tomahawk' : 'motherboard') : (m.brand === 'ASROCK' ? 'b850m' : 'b650m')) : (m.brand === 'GIGABYTE' ? 'aorus' : 'z890');
      q.cpu = amd ? 'ryzen' : 'corei9'; // mô hình 3D: CPU luôn khớp socket bo mạch
    }
    if (b.ram) q.ram = b.ram.part.n * b.ram.qty >= 4 ? 'dimm4' : 'dimm';
    if (b.gpu) {
      // Chọn mẫu 3D theo hãng chip và độ mạnh (công suất) của card
      const g = b.gpu, n = g.name.toUpperCase(), v = g.vram;
      if (/5090|4090|5080|4080|7900/.test(n) || v >= 20) q.gpu = 'card';
      else if (/\bARC\b|B580|B570|A770|A750/.test(n)) q.gpu = 'arcb580';
      else if (v >= 16 || (/RX|RADEON/.test(n) && v >= 12)) q.gpu = 'rx9070';
      else if (v >= 10) q.gpu = 'arcb580';
      else if (v >= 6) q.gpu = 'rtx5060ti';
      else q.gpu = 'rtx5060';
    }
    if (b.storage) q.storage = b.storage.some((d) => d.iface === 'SATA') ? 'nvmesata' : 'nvme';
    if (b.psu) { const w = b.psu.watts; q.psu = w <= 650 ? 'psu650' : w <= 750 ? 'psubronze' : w <= 850 ? 'psu' : w <= 1000 ? 'psu1000' : 'psu1200'; }
    if (b.cooler) q.cooler = b.cooler.style === 'Liquid' ? 'liquid' : 'cooler';
    q.full = { ...q };
    // Bỏ các giá trị trùng máy gốc
    const def = { cpu: 'ryzen', board: 'motherboard', ram: 'dimm', gpu: 'card', storage: 'nvmesata', psu: 'psu1000', cooler: 'cooler' };
    const full = q.full; delete q.full;
    for (const k of Object.keys(q)) if (q[k] === def[k]) delete q[k];
    Object.defineProperty(q, 'full', { value: { ...def, ...full }, enumerable: false });
    return q;
  }
  // Đề bài thi: yêu cầu của khách hàng
  const BRIEFS = [
    { id: 'office', title: 'Máy văn phòng cho phòng kế toán', budget: 0, req: [['ramGB', 8], ['ssd', 1]], text: 'Soạn thảo, bảng tính, chạy phần mềm kế toán. Yêu cầu: RAM từ 8 GB, có ổ SSD.' },
    { id: 'study', title: 'Máy học lập trình cho học sinh', budget: 0, req: [['cores', 6], ['ramGB', 16], ['nvme', 1]], text: 'Lập trình, chạy máy ảo nhỏ. Yêu cầu: CPU từ 6 nhân, RAM từ 16 GB, có SSD NVMe.' },
    { id: 'game', title: 'Máy chơi game tầm trung', budget: 0, req: [['vram', 8], ['ramGB', 16], ['nvme', 1]], text: 'Chơi game Full HD. Yêu cầu: card đồ hoạ từ 8 GB, RAM từ 16 GB, có SSD NVMe.' },
    { id: 'creator', title: 'Máy dựng phim, đồ hoạ', budget: 0, req: [['cores', 12], ['ramGB', 32], ['vram', 12], ['storeGB', 2000]], text: 'Dựng phim 4K, thiết kế 3D. Yêu cầu: CPU từ 12 nhân, RAM từ 32 GB, card đồ hoạ từ 12 GB, tổng dung lượng lưu trữ từ 2 TB.' },
  ];
  const REQNAME = { ramGB: (v) => `RAM từ ${v} GB`, ssd: () => 'Có ổ SSD', nvme: () => 'Có SSD NVMe (M.2)', cores: (v) => `CPU từ ${v} nhân`, vram: (v) => `Card đồ hoạ từ ${v} GB`, storeGB: (v) => `Lưu trữ từ ${v >= 1000 ? v / 1000 + ' TB' : v + ' GB'}` };
  function reqMet(b, [k, v]) {
    const sto = b.storage || [];
    switch (k) {
      case 'ramGB': return !!b.ram && b.ram.part.gb * b.ram.qty >= v;
      case 'ssd': return sto.some((d) => d.kind !== 'HDD');
      case 'nvme': return sto.some((d) => d.kind === 'NVMe');
      case 'cores': return !!b.cpu && b.cpu.cores >= v;
      case 'vram': return !!b.gpu && b.gpu.vram >= v;
      case 'storeGB': return sto.reduce((a, d) => a + d.gb, 0) >= v;
    }
    return false;
  }
  // Tên mẫu 3D có sẵn trong PC Anatomy
  const MODEL3D = {
    cpu: { ryzen: 'CPU AMD Ryzen (socket AM5)', corei9: 'CPU Intel Core Ultra (LGA1851)' },
    board: { motherboard: 'Bo ATX AMD – ASUS TUF X670E', tomahawk: 'Bo ATX AMD – MSI X870 Tomahawk', b650m: 'Bo Micro-ATX AMD – ASUS B650M', b850m: 'Bo Micro-ATX AMD – ASRock B850M', z890: 'Bo ATX Intel – ASUS Z890', aorus: 'Bo ATX Intel – GIGABYTE Z890 Aorus' },
    ram: { dimm: '2 thanh RAM', dimm4: '4 thanh RAM (đủ 4 khe)' },
    gpu: { card: 'Card lớn 3 quạt (dài 348 mm)', rx9070: 'Card 3 quạt (dài 331 mm)', arcb580: 'Card 2 quạt (dài 272 mm)', rtx5060ti: 'Card 2 quạt ngắn (dài 229 mm)', rtx5060: 'Card nhỏ 1 quạt (dài 145 mm)' },
    storage: { nvmesata: 'SSD M.2 + ổ SATA 2.5"', nvme: 'Chỉ SSD M.2' },
    psu: { psu650: 'Nguồn 650 W', psubronze: 'Nguồn 750 W', psu: 'Nguồn 850 W', psu1000: 'Nguồn 1000 W', psu1200: 'Nguồn 1200 W' },
    cooler: { cooler: 'Tản khí dạng tháp', liquid: 'Tản nước AIO 360 mm' },
  };
  const api = { MODEL3D, SLOTS, LABEL, FFNAME, check, power, price, toAnatomy, BRIEFS, REQNAME, reqMet, coolerFits };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PCCHECK = api;
})(typeof window !== 'undefined' ? window : globalThis);
