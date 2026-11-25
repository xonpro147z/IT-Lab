// Linh kiện thật của các hãng. Giá (VNĐ) và một số thông số (chiều dài VGA, công suất) chỉ mang tính tham khảo cho học tập.
const vnd = (n) => n;
const mk = (cat, slot, list, specFn) => list.map((p) => ({ cat, slot, ...p, specs: specFn(p) }));

// ===== Vỏ máy =====
const CASES = mk('case', 'case', [
  { id: 'case-h5', brand: 'NZXT', name: 'NZXT H5 Flow (2024)', price: vnd(2290000), forms: ['ATX', 'mATX'], maxGpu: 365, maxCooler: 165, maxRad: 280, color: 0x1d1f24, accent: 0x8a5cf6 },
  { id: 'case-4000d', brand: 'Corsair', name: 'Corsair 4000D Airflow', price: vnd(2390000), forms: ['ATX', 'mATX'], maxGpu: 360, maxCooler: 170, maxRad: 280, color: 0xeeeeee, accent: 0x00c6ff },
  { id: 'case-o11', brand: 'Lian Li', name: 'Lian Li O11 Dynamic EVO', price: vnd(3990000), forms: ['ATX', 'mATX'], maxGpu: 426, maxCooler: 167, maxRad: 360, color: 0x2a2a2e, accent: 0xff4fa3 },
  { id: 'case-air903', brand: 'Montech', name: 'Montech AIR 903 MAX', price: vnd(2190000), forms: ['ATX', 'mATX'], maxGpu: 400, maxCooler: 180, maxRad: 360, color: 0x16181c, accent: 0x34d399 },
  { id: 'case-q300l', brand: 'Cooler Master', name: 'Cooler Master MasterBox Q300L', price: vnd(1090000), forms: ['mATX'], maxGpu: 360, maxCooler: 159, maxRad: 240, color: 0x121212, accent: 0xffffff },
], (p) => [`Hỗ trợ mainboard ${p.forms.join(', ')}`, `VGA dài tối đa ${p.maxGpu} mm`, `Tản khí cao tối đa ${p.maxCooler} mm`, `Két nước trên nóc tối đa ${p.maxRad} mm`]);

// ===== Mainboard =====
const MBS = mk('mb', 'mb', [
  { id: 'mb-h610m', brand: 'ASUS', name: 'ASUS PRIME H610M-E D4', price: vnd(1990000), socket: 'LGA1700', mem: 'DDR4', form: 'mATX', chipset: 'H610', label: 'PRIME', color: 0x1a1d21, accent: 0x9aa4ad },
  { id: 'mb-b760m', brand: 'ASUS', name: 'ASUS PRIME B760M-A D4', price: vnd(2890000), socket: 'LGA1700', mem: 'DDR4', form: 'mATX', chipset: 'B760', label: 'PRIME', color: 0x1a1d21, accent: 0xc0c6cc },
  { id: 'mb-b760m-msi', brand: 'MSI', name: 'MSI PRO B760M-A WIFI (DDR5)', price: vnd(3390000), socket: 'LGA1700', mem: 'DDR5', form: 'mATX', chipset: 'B760', label: 'PRO', color: 0x1c1f24, accent: 0x9aa4ad },
  { id: 'mb-z790-tom', brand: 'MSI', name: 'MSI MAG Z790 TOMAHAWK WIFI', price: vnd(6290000), socket: 'LGA1700', mem: 'DDR5', form: 'ATX', chipset: 'Z790', label: 'TOMAHAWK', color: 0x15171a, accent: 0x6b7280 },
  { id: 'mb-z790-rog', brand: 'ASUS', name: 'ASUS ROG STRIX Z790-E GAMING WIFI II', price: vnd(11990000), socket: 'LGA1700', mem: 'DDR5', form: 'ATX', chipset: 'Z790', label: 'ROG STRIX', color: 0x111316, accent: 0xe11d48 },
  { id: 'mb-z890', brand: 'ASUS', name: 'ASUS PRIME Z890-P WIFI', price: vnd(6990000), socket: 'LGA1851', mem: 'DDR5', form: 'ATX', chipset: 'Z890', label: 'PRIME', color: 0x1a1d21, accent: 0xd1d5db },
  { id: 'mb-b450m', brand: 'ASRock', name: 'ASRock B450M Steel Legend', price: vnd(2090000), socket: 'AM4', mem: 'DDR4', form: 'mATX', chipset: 'B450', label: 'STEEL LEGEND', color: 0x1b1b1b, accent: 0xd4d4d4 },
  { id: 'mb-b550m', brand: 'Gigabyte', name: 'Gigabyte B550M DS3H', price: vnd(2290000), socket: 'AM4', mem: 'DDR4', form: 'mATX', chipset: 'B550', label: 'GIGABYTE', color: 0x1b1b1b, accent: 0xf59e0b },
  { id: 'mb-b550-tom', brand: 'MSI', name: 'MSI MAG B550 TOMAHAWK', price: vnd(3690000), socket: 'AM4', mem: 'DDR4', form: 'ATX', chipset: 'B550', label: 'TOMAHAWK', color: 0x15171a, accent: 0x6b7280 },
  { id: 'mb-b650m', brand: 'Gigabyte', name: 'Gigabyte B650M AORUS ELITE AX', price: vnd(4590000), socket: 'AM5', mem: 'DDR5', form: 'mATX', chipset: 'B650', label: 'AORUS', color: 0x15171a, accent: 0xf97316 },
  { id: 'mb-b650-tom', brand: 'MSI', name: 'MSI MAG B650 TOMAHAWK WIFI', price: vnd(5290000), socket: 'AM5', mem: 'DDR5', form: 'ATX', chipset: 'B650', label: 'TOMAHAWK', color: 0x15171a, accent: 0x6b7280 },
  { id: 'mb-x870e', brand: 'ASUS', name: 'ASUS ROG STRIX X870E-E GAMING WIFI', price: vnd(12990000), socket: 'AM5', mem: 'DDR5', form: 'ATX', chipset: 'X870E', label: 'ROG STRIX', color: 0x111316, accent: 0xe11d48 },
], (p) => [`Socket ${p.socket}, chipset ${p.chipset}`, `RAM ${p.mem}, ${p.id === 'mb-h610m' ? 2 : 4} khe`, `Kích thước ${p.form}`, p.socket === 'AM4' ? 'CPU Ryzen 3000–5000' : p.socket === 'AM5' ? 'CPU Ryzen 7000–9000' : p.socket === 'LGA1851' ? 'CPU Intel Core Ultra 200S' : 'CPU Intel Core thế hệ 12–14']);

// ===== CPU =====
const CPUS = mk('cpu', 'cpu', [
  { id: 'cpu-i3-12100', brand: 'intel', name: 'Intel Core i3-12100', price: vnd(2490000), socket: 'LGA1700', cores: 4, threads: 8, ghz: 4.3, power: 89, igpu: true, gpuName: 'UHD 730' },
  { id: 'cpu-i3-14100', brand: 'intel', name: 'Intel Core i3-14100', price: vnd(3190000), socket: 'LGA1700', cores: 4, threads: 8, ghz: 4.7, power: 110, igpu: true, gpuName: 'UHD 730' },
  { id: 'cpu-i5-12400f', brand: 'intel', name: 'Intel Core i5-12400F', price: vnd(2690000), socket: 'LGA1700', cores: 6, threads: 12, ghz: 4.4, power: 117, igpu: false },
  { id: 'cpu-i5-13400f', brand: 'intel', name: 'Intel Core i5-13400F', price: vnd(4090000), socket: 'LGA1700', cores: 10, threads: 16, ghz: 4.6, power: 148, igpu: false },
  { id: 'cpu-i5-14400f', brand: 'intel', name: 'Intel Core i5-14400F', price: vnd(4490000), socket: 'LGA1700', cores: 10, threads: 16, ghz: 4.7, power: 148, igpu: false },
  { id: 'cpu-i5-14600k', brand: 'intel', name: 'Intel Core i5-14600K', price: vnd(7290000), socket: 'LGA1700', cores: 14, threads: 20, ghz: 5.3, power: 181, igpu: true, gpuName: 'UHD 770' },
  { id: 'cpu-i7-14700k', brand: 'intel', name: 'Intel Core i7-14700K', price: vnd(9490000), socket: 'LGA1700', cores: 20, threads: 28, ghz: 5.6, power: 253, igpu: true, gpuName: 'UHD 770' },
  { id: 'cpu-i9-14900k', brand: 'intel', name: 'Intel Core i9-14900K', price: vnd(13490000), socket: 'LGA1700', cores: 24, threads: 32, ghz: 6.0, power: 253, igpu: true, gpuName: 'UHD 770' },
  { id: 'cpu-u5-245k', brand: 'intel', name: 'Intel Core Ultra 5 245K', price: vnd(7490000), socket: 'LGA1851', cores: 14, threads: 14, ghz: 5.2, power: 159, igpu: true, gpuName: 'Intel Graphics (Xe)' },
  { id: 'cpu-u7-265k', brand: 'intel', name: 'Intel Core Ultra 7 265K', price: vnd(9990000), socket: 'LGA1851', cores: 20, threads: 20, ghz: 5.5, power: 250, igpu: true, gpuName: 'Intel Graphics (Xe)' },
  { id: 'cpu-u9-285k', brand: 'intel', name: 'Intel Core Ultra 9 285K', price: vnd(15490000), socket: 'LGA1851', cores: 24, threads: 24, ghz: 5.7, power: 250, igpu: true, gpuName: 'Intel Graphics (Xe)' },
  { id: 'cpu-r5-5600', brand: 'amd', name: 'AMD Ryzen 5 5600', price: vnd(2890000), socket: 'AM4', cores: 6, threads: 12, ghz: 4.4, power: 88, igpu: false },
  { id: 'cpu-r5-5600g', brand: 'amd', name: 'AMD Ryzen 5 5600G', price: vnd(2990000), socket: 'AM4', cores: 6, threads: 12, ghz: 4.4, power: 88, igpu: true, gpuName: 'Radeon Vega 7' },
  { id: 'cpu-r7-5700x3d', brand: 'amd', name: 'AMD Ryzen 7 5700X3D', price: vnd(5490000), socket: 'AM4', cores: 8, threads: 16, ghz: 4.1, power: 142, igpu: false },
  { id: 'cpu-r5-7500f', brand: 'amd', name: 'AMD Ryzen 5 7500F', price: vnd(3590000), socket: 'AM5', cores: 6, threads: 12, ghz: 5.0, power: 88, igpu: false },
  { id: 'cpu-r5-7600', brand: 'amd', name: 'AMD Ryzen 5 7600', price: vnd(4990000), socket: 'AM5', cores: 6, threads: 12, ghz: 5.1, power: 88, igpu: true, gpuName: 'Radeon Graphics' },
  { id: 'cpu-r7-7800x3d', brand: 'amd', name: 'AMD Ryzen 7 7800X3D', price: vnd(9990000), socket: 'AM5', cores: 8, threads: 16, ghz: 5.0, power: 162, igpu: true, gpuName: 'Radeon Graphics' },
  { id: 'cpu-r5-9600x', brand: 'amd', name: 'AMD Ryzen 5 9600X', price: vnd(6290000), socket: 'AM5', cores: 6, threads: 12, ghz: 5.4, power: 88, igpu: true, gpuName: 'Radeon Graphics' },
  { id: 'cpu-r7-9700x', brand: 'amd', name: 'AMD Ryzen 7 9700X', price: vnd(8290000), socket: 'AM5', cores: 8, threads: 16, ghz: 5.5, power: 88, igpu: true, gpuName: 'Radeon Graphics' },
  { id: 'cpu-r7-9800x3d', brand: 'amd', name: 'AMD Ryzen 7 9800X3D', price: vnd(12990000), socket: 'AM5', cores: 8, threads: 16, ghz: 5.2, power: 162, igpu: true, gpuName: 'Radeon Graphics' },
  { id: 'cpu-r9-9950x', brand: 'amd', name: 'AMD Ryzen 9 9950X', price: vnd(15990000), socket: 'AM5', cores: 16, threads: 32, ghz: 5.7, power: 200, igpu: true, gpuName: 'Radeon Graphics' },
], (p) => [`${p.cores} nhân / ${p.threads} luồng, tối đa ${p.ghz} GHz`, `Socket ${p.socket}`, p.igpu ? `Có đồ hoạ tích hợp ${p.gpuName}` : 'KHÔNG có đồ hoạ tích hợp – cần VGA rời', `Điện năng tối đa ~${p.power} W`]);

// ===== Tản nhiệt =====
const ALL_SOCKETS = ['LGA1700', 'LGA1851', 'AM4', 'AM5'];
const COOLERS = mk('cooler', 'cooler', [
  { id: 'cool-rm1', brand: 'Intel', name: 'Intel Laminar RM1 (tản theo hộp CPU)', price: vnd(150000), type: 'stock', height: 52, maxTdp: 90, sockets: ['LGA1700'] },
  { id: 'cool-wraith', brand: 'AMD', name: 'AMD Wraith Stealth (tản theo hộp CPU)', price: vnd(150000), type: 'stock', height: 54, maxTdp: 90, sockets: ['AM4', 'AM5'] },
  { id: 'cool-212', brand: 'Cooler Master', name: 'Cooler Master Hyper 212 Black', price: vnd(690000), type: 'tower', height: 159, maxTdp: 180, sockets: ALL_SOCKETS, label: 'HYPER 212' },
  { id: 'cool-ak400', brand: 'DeepCool', name: 'DeepCool AK400', price: vnd(590000), type: 'tower', height: 155, maxTdp: 220, sockets: ALL_SOCKETS, label: 'DEEPCOOL' },
  { id: 'cool-pa120', brand: 'Thermalright', name: 'Thermalright Peerless Assassin 120 SE', price: vnd(890000), type: 'dual', height: 155, maxTdp: 245, sockets: ALL_SOCKETS, fanColor: 0x22252b },
  { id: 'cool-nhd15', brand: 'Noctua', name: 'Noctua NH-D15', price: vnd(3290000), type: 'dual', height: 165, maxTdp: 260, sockets: ALL_SOCKETS, fanColor: 'noctua' },
  { id: 'cool-le520', brand: 'DeepCool', name: 'DeepCool LE520 (tản nước AIO 240 mm)', price: vnd(1790000), type: 'aio', rad: 240, height: 55, maxTdp: 260, sockets: ALL_SOCKETS },
  { id: 'cool-kraken360', brand: 'NZXT', name: 'NZXT Kraken 360 (tản nước AIO 360 mm)', price: vnd(4990000), type: 'aio', rad: 360, height: 55, maxTdp: 320, sockets: ALL_SOCKETS, screen: true },
], (p) => [p.type === 'aio' ? `Tản nước AIO, két ${p.rad} mm gắn trên nóc vỏ` : `Tản khí cao ${p.height} mm`, `Tản tối đa ~${p.maxTdp} W`, `Hỗ trợ ${p.sockets.join(', ')}`, p.type === 'stock' ? 'Tản cơ bản, đủ cho CPU tầm thấp' : p.type === 'dual' ? 'Tháp đôi, 2 quạt' : p.type === 'aio' ? 'Bơm + ống dẫn + két tản nhiệt' : 'Tháp đơn, 1 quạt 120 mm']);

// ===== RAM =====
const RAMS = mk('ram', 'ram', [
  { id: 'ram-fury4-16', brand: 'Kingston', name: 'Kingston FURY Beast DDR4 16GB (2×8GB) 3200', price: vnd(990000), type: 'DDR4', size: 16, mhz: 3200, color: 0x1f2329, rgb: false, label: 'FURY' },
  { id: 'ram-delta4-16', brand: 'TeamGroup', name: 'T-Force Delta RGB DDR4 16GB (2×8GB) 3600', price: vnd(1290000), type: 'DDR4', size: 16, mhz: 3600, color: 0xf2f2f2, rgb: true, label: 'T-FORCE' },
  { id: 'ram-lpx4-32', brand: 'Corsair', name: 'Corsair Vengeance LPX DDR4 32GB (2×16GB) 3200', price: vnd(1890000), type: 'DDR4', size: 32, mhz: 3200, color: 0x18191b, rgb: false, label: 'VENGEANCE' },
  { id: 'ram-ripv4-32', brand: 'G.Skill', name: 'G.Skill Ripjaws V DDR4 32GB (2×16GB) 3600', price: vnd(1990000), type: 'DDR4', size: 32, mhz: 3600, color: 0xb91c1c, rgb: false, label: 'RIPJAWS' },
  { id: 'ram-fury5-16', brand: 'Kingston', name: 'Kingston FURY Beast DDR5 16GB (2×8GB) 5600', price: vnd(1490000), type: 'DDR5', size: 16, mhz: 5600, color: 0x1f2329, rgb: false, label: 'FURY' },
  { id: 'ram-veng5-32', brand: 'Corsair', name: 'Corsair Vengeance RGB DDR5 32GB (2×16GB) 6000', price: vnd(2890000), type: 'DDR5', size: 32, mhz: 6000, color: 0x18191b, rgb: true, label: 'VENGEANCE' },
  { id: 'ram-tz5-32', brand: 'G.Skill', name: 'G.Skill Trident Z5 RGB DDR5 32GB (2×16GB) 6400', price: vnd(3290000), type: 'DDR5', size: 32, mhz: 6400, color: 0xc0c4ca, rgb: true, label: 'TRIDENT Z5' },
  { id: 'ram-ren5-64', brand: 'Kingston', name: 'Kingston FURY Renegade RGB DDR5 64GB (2×32GB) 6000', price: vnd(6490000), type: 'DDR5', size: 64, mhz: 6000, color: 0x2b2f36, rgb: true, label: 'RENEGADE' },
], (p) => [`${p.type}, bus ${p.mhz} MT/s`, `Kit 2 thanh × ${p.size / 2} GB = ${p.size} GB`, p.rgb ? 'Có đèn RGB' : 'Tản nhôm, không đèn', `Hãng ${p.brand}`]);

// ===== Lưu trữ =====
const STORAGE = mk('storage', null, [
  { id: 'ssd-nv2', brand: 'Kingston', name: 'Kingston NV2 500GB (NVMe)', price: vnd(890000), kind: 'm2', slot: 'm2', size: 500, read: 3500, gen: 'PCIe 4.0' },
  { id: 'ssd-p3p', brand: 'Crucial', name: 'Crucial P3 Plus 1TB (NVMe)', price: vnd(1590000), kind: 'm2', slot: 'm2', size: 1000, read: 5000, gen: 'PCIe 4.0' },
  { id: 'ssd-990pro', brand: 'Samsung', name: 'Samsung 990 PRO 1TB (NVMe)', price: vnd(2690000), kind: 'm2', slot: 'm2', size: 1000, read: 7450, gen: 'PCIe 4.0' },
  { id: 'ssd-sn850x', brand: 'WD', name: 'WD_BLACK SN850X 2TB (NVMe)', price: vnd(4290000), kind: 'm2', slot: 'm2', size: 2000, read: 7300, gen: 'PCIe 4.0' },
  { id: 'ssd-870evo', brand: 'Samsung', name: 'Samsung 870 EVO 500GB (SSD SATA 2.5")', price: vnd(1290000), kind: 'ssd25', slot: 'hdd', size: 500, read: 560, gen: 'SATA III' },
  { id: 'ssd-mx500', brand: 'Crucial', name: 'Crucial MX500 1TB (SSD SATA 2.5")', price: vnd(1890000), kind: 'ssd25', slot: 'hdd', size: 1000, read: 560, gen: 'SATA III' },
  { id: 'hdd-wd1t', brand: 'WD', name: 'WD Blue 1TB 7200rpm (HDD 3.5")', price: vnd(1190000), kind: 'hdd', slot: 'hdd', size: 1000, read: 150, gen: 'SATA III' },
  { id: 'hdd-sg2t', brand: 'Seagate', name: 'Seagate BarraCuda 2TB 7200rpm (HDD 3.5")', price: vnd(1590000), kind: 'hdd', slot: 'hdd', size: 2000, read: 220, gen: 'SATA III' },
], (p) => [p.kind === 'm2' ? `SSD M.2 2280 NVMe ${p.gen}` : p.kind === 'ssd25' ? 'SSD 2.5 inch chuẩn SATA III' : 'Ổ cứng cơ (đĩa từ quay) 3.5 inch', `Dung lượng ${p.size >= 1000 ? p.size / 1000 + ' TB' : p.size + ' GB'}`, `Tốc độ đọc ~${p.read.toLocaleString('vi-VN')} MB/s`, p.kind === 'm2' ? 'Cắm trực tiếp vào khe M.2' : 'Đặt trong lồng ổ cứng, cần cáp SATA']);

// ===== Card đồ hoạ =====
const GPUS = mk('gpu', 'gpu', [
  { id: 'gpu-1650', brand: 'nvidia', maker: 'ASUS', name: 'ASUS Phoenix GeForce GTX 1650 4GB', price: vnd(3490000), vram: 4, power: 75, length: 174, fans: 1, thick: 3.6, pcie: 0, color: 0x23272e },
  { id: 'gpu-3050', brand: 'nvidia', maker: 'Gigabyte', name: 'Gigabyte GeForce RTX 3050 WINDFORCE OC 6G', price: vnd(4290000), vram: 6, power: 70, length: 191, fans: 2, thick: 3.8, pcie: 0, color: 0x1f2125 },
  { id: 'gpu-rx7600', brand: 'amd', maker: 'Sapphire', name: 'Sapphire PULSE Radeon RX 7600 8GB', price: vnd(6990000), vram: 8, power: 165, length: 240, fans: 2, thick: 4.2, pcie: 1, color: 0x1e1e22 },
  { id: 'gpu-b580', brand: 'intel', maker: 'Intel', name: 'Intel Arc B580 Limited Edition 12GB', price: vnd(7290000), vram: 12, power: 190, length: 272, fans: 2, thick: 4, pcie: 1, color: 0x2b2d31 },
  { id: 'gpu-4060', brand: 'nvidia', maker: 'ASUS', name: 'ASUS Dual GeForce RTX 4060 OC 8GB', price: vnd(8290000), vram: 8, power: 115, length: 227, fans: 2, thick: 4, pcie: 1, color: 0xe5e7eb },
  { id: 'gpu-4060ti', brand: 'nvidia', maker: 'MSI', name: 'MSI GeForce RTX 4060 Ti VENTUS 2X 8G', price: vnd(10490000), vram: 8, power: 160, length: 199, fans: 2, thick: 4.2, pcie: 1, color: 0x2a2d33 },
  { id: 'gpu-5060ti', brand: 'nvidia', maker: 'MSI', name: 'MSI GeForce RTX 5060 Ti 16G VENTUS 2X', price: vnd(12490000), vram: 16, power: 180, length: 197, fans: 2, thick: 4.2, pcie: 1, color: 0x2a2d33 },
  { id: 'gpu-4070s', brand: 'nvidia', maker: 'Gigabyte', name: 'Gigabyte GeForce RTX 4070 SUPER WINDFORCE OC 12G', price: vnd(15990000), vram: 12, power: 220, length: 261, fans: 3, thick: 4.4, pcie: 1, color: 0x1f2125 },
  { id: 'gpu-5070', brand: 'nvidia', maker: 'ASUS', name: 'ASUS PRIME GeForce RTX 5070 12GB', price: vnd(16990000), vram: 12, power: 250, length: 304, fans: 3, thick: 5, pcie: 1, h16: true, color: 0xd1d5db },
  { id: 'gpu-7800xt', brand: 'amd', maker: 'PowerColor', name: 'PowerColor Hellhound Radeon RX 7800 XT 16GB', price: vnd(13990000), vram: 16, power: 263, length: 322, fans: 3, thick: 5.2, pcie: 2, color: 0x1b1d22 },
  { id: 'gpu-9070xt', brand: 'amd', maker: 'Sapphire', name: 'Sapphire NITRO+ Radeon RX 9070 XT 16GB', price: vnd(21990000), vram: 16, power: 340, length: 321, fans: 3, thick: 6, pcie: 1, h16: true, color: 0x26292e },
  { id: 'gpu-5080', brand: 'nvidia', maker: 'Gigabyte', name: 'Gigabyte GeForce RTX 5080 GAMING OC 16G', price: vnd(34990000), vram: 16, power: 360, length: 340, fans: 3, thick: 6, pcie: 1, h16: true, color: 0x18191c },
  { id: 'gpu-5090', brand: 'nvidia', maker: 'ASUS', name: 'ASUS ROG Astral GeForce RTX 5090 32GB', price: vnd(79990000), vram: 32, power: 600, length: 358, fans: 4, thick: 7.6, pcie: 1, h16: true, color: 0x111214 },
], (p) => [`VRAM ${p.vram} GB`, `Dài ${p.length} mm, ${p.fans} quạt`, `Điện năng ~${p.power} W`, p.pcie === 0 ? 'Không cần dây nguồn phụ' : p.h16 ? 'Cần dây nguồn 16-pin (12V-2x6)' : `Cần ${p.pcie} dây nguồn PCIe 8-pin`]);

// ===== Nguồn =====
const PSUS = mk('psu', 'psu', [
  { id: 'psu-cv550', brand: 'Corsair', name: 'Corsair CV550 550W', price: vnd(1190000), watt: 550, eff: '80 PLUS BRONZE', h16: false },
  { id: 'psu-mwe650', brand: 'Cooler Master', name: 'Cooler Master MWE 650 Bronze V2', price: vnd(1490000), watt: 650, eff: '80 PLUS BRONZE', h16: false },
  { id: 'psu-rm750e', brand: 'Corsair', name: 'Corsair RM750e (ATX 3.1)', price: vnd(2690000), watt: 750, eff: '80 PLUS GOLD', h16: true },
  { id: 'psu-a850gl', brand: 'MSI', name: 'MSI MAG A850GL PCIE5', price: vnd(2590000), watt: 850, eff: '80 PLUS GOLD', h16: true },
  { id: 'psu-gx850', brand: 'Seasonic', name: 'Seasonic FOCUS GX-850', price: vnd(3290000), watt: 850, eff: '80 PLUS GOLD', h16: false },
  { id: 'psu-thor1000', brand: 'ASUS', name: 'ASUS ROG THOR 1000W Platinum II', price: vnd(7990000), watt: 1000, eff: '80 PLUS PLATINUM', h16: true },
  { id: 'psu-hx1200i', brand: 'Corsair', name: 'Corsair HX1200i (ATX 3.1)', price: vnd(6990000), watt: 1200, eff: '80 PLUS PLATINUM', h16: true },
], (p) => [`Công suất ${p.watt} W`, `Hiệu suất ${p.eff}`, p.h16 ? 'Có dây 16-pin (12V-2x6) cho VGA đời mới' : 'Dây PCIe 8-pin (không có 16-pin)', `Hãng ${p.brand}`]);

// ===== Cáp =====
const CABLES = [
  { id: 'c-24pin', cat: 'cable', slot: 'c-24pin', cable: true, name: 'Cáp nguồn mainboard 24-pin', price: 0, needs: ['psu', 'mb'], specs: ['Từ nguồn → cổng 24-pin bên phải mainboard', 'Cấp điện chính cho mainboard'] },
  { id: 'c-cpu8', cat: 'cable', slot: 'c-cpu8', cable: true, name: 'Cáp nguồn CPU 8-pin (EPS)', price: 0, needs: ['psu', 'mb'], specs: ['Từ nguồn → cổng 8-pin góc trên bên trái mainboard', 'Cấp điện cho CPU'] },
  { id: 'c-pcie', cat: 'cable', slot: 'c-pcie', cable: true, name: 'Cáp nguồn cho VGA (PCIe / 16-pin)', price: 0, needs: ['psu', 'gpu'], specs: ['Từ nguồn → cạnh trên card đồ hoạ', 'Chỉ cần với VGA có cổng nguồn phụ'] },
  { id: 'c-sata', cat: 'cable', slot: 'c-sata', cable: true, name: 'Cáp SATA (dữ liệu + nguồn)', price: 0, needs: ['psu', 'hdd', 'mb'], specs: ['Cáp dữ liệu SATA: ổ → mainboard', 'Cáp nguồn SATA: nguồn → ổ', 'Dùng cho HDD và SSD SATA 2.5"'] },
  { id: 'c-fp', cat: 'cable', slot: 'c-fp', cable: true, name: 'Cáp Front Panel (nút nguồn, đèn)', price: 0, needs: ['mb'], specs: ['Từ mặt trước vỏ máy → chân F_PANEL góc dưới mainboard', 'Nút nguồn chỉ hoạt động khi đã cắm cáp này'] },
];

export const PARTS = [...CASES, ...MBS, ...CPUS, ...COOLERS, ...RAMS, ...STORAGE, ...GPUS, ...PSUS, ...CABLES];
