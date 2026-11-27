// Danh mục linh kiện, thử thách và các bước hướng dẫn lắp ráp
// Giá chỉ mang tính tham khảo (VNĐ) phục vụ học tập.

export const CATEGORIES = [
  { id: 'case', name: 'Vỏ máy (Case)', icon: '🗄️',
    info: 'Vỏ máy chứa và bảo vệ toàn bộ linh kiện, có quạt hút/thổi gió để làm mát. Cần chọn vỏ hỗ trợ đúng kích thước mainboard (ATX, mATX) và đủ chỗ cho card đồ hoạ, tản nhiệt.' },
  { id: 'mb', name: 'Bo mạch chủ', icon: '🟩',
    info: 'Bo mạch chủ (mainboard) là tấm mạch chính kết nối mọi linh kiện: CPU, RAM, ổ cứng, card đồ hoạ. Socket CPU và loại RAM (DDR4/DDR5) của mainboard quyết định CPU và RAM nào lắp được.' },
  { id: 'cpu', name: 'CPU (Bộ xử lý)', icon: '🔲',
    info: 'CPU – bộ xử lý trung tâm, "bộ não" của máy tính, thực hiện các lệnh của chương trình. CPU phải cùng socket với mainboard. CPU có chữ F (Intel) hoặc không có chữ G (AMD đời cũ) thường không có đồ hoạ tích hợp.' },
  { id: 'cooler', name: 'Tản nhiệt CPU', icon: '❄️',
    info: 'Tản nhiệt CPU giúp giải nhiệt cho CPU. Giữa CPU và đế tản cần có keo tản nhiệt. Tản phải hỗ trợ socket CPU, đủ công suất tản (W) và không cao hơn giới hạn của vỏ máy.' },
  { id: 'ram', name: 'RAM (Bộ nhớ trong)', icon: '📏',
    info: 'RAM là bộ nhớ tạm thời, lưu dữ liệu của chương trình đang chạy; mất dữ liệu khi tắt máy. RAM DDR4 và DDR5 có khấc khác nhau nên không lắp lẫn được. Nên lắp 2 thanh để chạy kênh đôi (dual channel).' },
  { id: 'storage', name: 'Ổ lưu trữ', icon: '💾',
    info: 'Ổ lưu trữ (SSD, HDD) lưu hệ điều hành và dữ liệu lâu dài, không mất khi tắt máy. SSD M.2 NVMe nhanh hơn rất nhiều so với ổ cứng cơ HDD. Máy cần ít nhất một ổ để cài hệ điều hành.' },
  { id: 'gpu', name: 'Card đồ hoạ (VGA)', icon: '🎮',
    info: 'Card đồ hoạ (GPU/VGA) xử lý hình ảnh, cần thiết cho chơi game, dựng phim, đồ hoạ 3D. Nếu CPU có đồ hoạ tích hợp thì có thể không cần lắp VGA rời. VGA mạnh thường cần thêm dây nguồn PCIe.' },
  { id: 'psu', name: 'Nguồn (PSU)', icon: '🔌',
    info: 'Bộ nguồn (PSU) chuyển điện xoay chiều 220V thành điện một chiều 12V, 5V, 3.3V cho linh kiện. Công suất nguồn phải lớn hơn tổng điện năng tiêu thụ, nên dư khoảng 30%.' },
  { id: 'cable', name: 'Cáp kết nối', icon: '〰️',
    info: 'Các dây cáp truyền điện và tín hiệu: cáp 24-pin cấp điện cho mainboard, cáp 8-pin cho CPU, cáp PCIe cho VGA, cáp SATA cho ổ cứng HDD, cáp Front Panel nối nút nguồn của vỏ máy với mainboard.' },
];

import { PARTS } from './parts.js';
export { PARTS };

export const partById = (id) => PARTS.find(p => p.id === id);

// ===== Thử thách =====
export const CHALLENGES = [
  { id: 'office', title: 'Máy văn phòng tiết kiệm',
    desc: 'Lắp một máy tính văn phòng KHÔNG dùng card đồ hoạ rời, tổng chi phí không quá 15 triệu đồng, khởi động thành công.',
    check: (b) => [
      [!b.parts.gpu, 'Không lắp card đồ hoạ rời'],
      [b.total <= 15000000, 'Tổng chi phí ≤ 15.000.000đ'],
      [b.booted, 'Khởi động thành công'],
    ] },
  { id: 'gaming', title: 'Máy chơi game tầm trung',
    desc: 'Lắp máy chơi game có card đồ hoạ rời, tổng chi phí không quá 30 triệu đồng, không có cảnh báo nào và khởi động thành công.',
    check: (b) => [
      [!!b.parts.gpu, 'Có card đồ hoạ rời'],
      [b.total <= 30000000, 'Tổng chi phí ≤ 30.000.000đ'],
      [b.warnings === 0, 'Không có cảnh báo'],
      [b.booted, 'Khởi động thành công'],
    ] },
  { id: 'amd', title: 'Máy AMD thế hệ mới',
    desc: 'Lắp máy dùng CPU AMD socket AM5 và RAM DDR5, khởi động thành công.',
    check: (b) => [
      [b.parts.cpu && b.parts.cpu.socket === 'AM5', 'CPU socket AM5'],
      [b.parts.ram && b.parts.ram.type === 'DDR5', 'RAM DDR5'],
      [b.booted, 'Khởi động thành công'],
    ] },
  { id: 'workstation', title: 'Máy đồ hoạ – dựng phim cao cấp',
    desc: 'CPU từ 8 nhân trở lên, RAM ít nhất 32GB, VGA có ít nhất 16GB VRAM, không có cảnh báo, khởi động thành công.',
    check: (b) => [
      [b.parts.cpu && b.parts.cpu.cores >= 8, 'CPU ≥ 8 nhân'],
      [b.parts.ram && b.parts.ram.size >= 32, 'RAM ≥ 32 GB'],
      [b.parts.gpu && b.parts.gpu.vram >= 16, 'VGA ≥ 16 GB VRAM'],
      [b.warnings === 0, 'Không có cảnh báo'],
      [b.booted, 'Khởi động thành công'],
    ] },
];

// ===== Các bước hướng dẫn =====
// done(s): đã hoàn thành bước; skip(s): bước không cần thiết với cấu hình hiện tại
export const GUIDE_STEPS = [
  { slot: 'case', title: 'Chọn vỏ máy',
    text: 'Chọn một vỏ máy ở cột bên trái (nhóm "Vỏ máy"). Vỏ Mid Tower rộng rãi, hỗ trợ mainboard ATX; vỏ Mini Tower nhỏ gọn, chỉ hỗ trợ mATX. Bấm "Tiếp tục" khi đã chọn xong.',
    manual: true },
  { slot: 'mb', title: 'Lắp bo mạch chủ vào vỏ',
    text: 'Chọn một mainboard, sau đó bấm vào vùng phát sáng trên khay vỏ máy. Mainboard được bắt vít lên các cọc đồng (standoff) để không chạm vào vỏ kim loại. Lưu ý: kích thước mainboard phải phù hợp với vỏ.' },
  { slot: 'cpu', title: 'Lắp CPU vào socket',
    text: 'Chọn CPU cùng socket với mainboard. Thực tế: mở lẫy socket, đặt CPU khớp với hình tam giác đánh dấu ở góc, nhẹ nhàng hạ xuống – không ấn mạnh – rồi khoá lẫy lại.' },
  { slot: 'cooler', title: 'Lắp tản nhiệt CPU',
    text: 'Bôi một lớp keo tản nhiệt mỏng lên mặt CPU, đặt tản nhiệt lên và vặn vít chéo nhau từng chút một. Tản phải đủ công suất cho CPU và không cao quá giới hạn của vỏ.' },
  { slot: 'ram', title: 'Lắp RAM',
    text: 'Chọn RAM đúng loại mainboard hỗ trợ (DDR4 hoặc DDR5). Mở lẫy khe RAM, đặt thanh RAM khớp với khấc rồi ấn đều hai đầu đến khi nghe "tách". Kit 2 thanh nên cắm khe số 2 và 4 để chạy kênh đôi.' },
  { slot: 'storage', title: 'Lắp ổ lưu trữ',
    text: 'Lắp SSD M.2 vào khe M.2 giữa socket CPU và khe PCIe (cắm nghiêng 30° rồi ấn xuống và bắt vít), hoặc lắp ổ HDD vào lồng ổ cứng phía trước dưới vỏ. Máy cần ít nhất 1 ổ để cài hệ điều hành.' },
  { slot: 'psu', title: 'Lắp bộ nguồn',
    text: 'Đặt bộ nguồn vào khoang dưới phía sau vỏ, quạt hướng xuống dưới để hút gió mát, rồi bắt 4 vít ở mặt sau vỏ. Chọn nguồn có công suất dư khoảng 30% so với tổng điện năng.' },
  { slot: 'gpu', title: 'Lắp card đồ hoạ',
    text: 'Tháo nắp chắn khe PCIe ở mặt sau vỏ, cắm card vào khe PCIe x16 trên cùng đến khi lẫy khoá bật lên, rồi bắt vít giữ card. Nếu CPU có đồ hoạ tích hợp, bạn có thể bỏ qua bước này.',
    optional: true },
  { slot: 'c-24pin', title: 'Cắm cáp 24-pin cho mainboard',
    text: 'Chọn "Cáp nguồn mainboard 24-pin" trong nhóm Cáp và bấm vào cổng phát sáng ở cạnh phải mainboard. Đây là nguồn điện chính của mainboard.' },
  { slot: 'c-cpu8', title: 'Cắm cáp nguồn CPU 8-pin',
    text: 'Chọn "Cáp nguồn CPU 8-pin" và cắm vào cổng ở góc trên bên trái mainboard. Thiếu dây này CPU sẽ không có điện và máy không khởi động.' },
  { slot: 'c-pcie', title: 'Cắm cáp nguồn cho VGA',
    text: 'Card đồ hoạ này cần nguồn phụ. Chọn "Cáp nguồn PCIe cho VGA" và cắm vào cạnh trên của card.',
    skipIf: (s) => !s.parts.gpu || !s.parts.gpu.pcie },
  { slot: 'c-sata', title: 'Cắm cáp SATA cho HDD',
    text: 'Ổ HDD cần 2 dây: dây dữ liệu SATA nối về mainboard và dây nguồn SATA từ bộ nguồn.',
    skipIf: (s) => !s.parts.hdd },
  { slot: 'c-fp', title: 'Cắm cáp Front Panel',
    text: 'Cắm các dây nhỏ (POWER SW, RESET SW, HDD LED, POWER LED) từ mặt trước vỏ vào chân F_PANEL ở góc dưới bên phải mainboard. Thiếu dây này nút nguồn trên vỏ sẽ không hoạt động.' },
  { slot: 'boot', title: 'Bật nguồn!',
    text: 'Bấm nút "⚡ Bật nguồn" ở cột bên phải hoặc bấm vào nút nguồn trên nóc vỏ máy để kiểm tra thành quả.', manual: true },
];

// ======================= Thao tác lắp chi tiết =======================
// steps: các thao tác đúng theo thứ tự; wrong: thao tác SAI hay gặp (kèm lý do) – dùng để luyện và chấm thi.
const A = (t, why) => ({ t, why });
export const ACTIONS = {
  mb: { title: 'Lắp mainboard vào vỏ', steps: [
    A('Lắp tấm chắn I/O (I/O shield) vào lỗ phía sau vỏ (nếu mainboard chưa gắn sẵn)'),
    A('Kiểm tra các cọc đồng (standoff) khớp đúng các lỗ vít của mainboard'),
    A('Đặt mainboard nghiêng, đưa cụm cổng I/O khớp vào tấm chắn rồi hạ xuống'),
    A('Bắt vít theo thứ tự chéo nhau, siết vừa tay'),
  ], wrong: [
    A('Đặt mainboard thẳng lên khay vỏ, không cần cọc đồng', 'Mặt dưới mainboard chạm vỏ kim loại sẽ bị chập điện.'),
    A('Siết thật chặt từng con vít một cho chắc', 'Siết quá chặt có thể làm nứt mạch; nên siết vừa tay, theo kiểu chéo.'),
  ] },
  cpu: { title: 'Lắp CPU vào socket', steps: (p) => p && p.socket === 'AM4' ? [
    A('Nâng cần gạt của socket lên thẳng đứng (90°)'),
    A('Căn tam giác vàng ở góc CPU trùng với dấu tam giác trên socket'),
    A('Thả CPU nhẹ nhàng vào socket, để CPU tự lọt vào lỗ chân'),
    A('Hạ cần gạt xuống và gài vào lẫy để khoá CPU'),
  ] : [
    A('Ấn cần gạt xuống, đẩy ra ngoài rồi nâng lên để mở socket'),
    A('Mở khung giữ kim loại (load plate)'),
    A('Cầm CPU ở hai cạnh, căn tam giác vàng / khấc với dấu trên socket'),
    A('Đặt CPU thẳng xuống, không trượt hay xoay'),
    A('Hạ khung giữ, khoá cần gạt (nắp nhựa bảo vệ tự bật ra)'),
  ], wrong: [
    A('Ấn mạnh CPU xuống cho khít', 'CPU chỉ cần đặt nhẹ; ấn mạnh sẽ cong chân socket/CPU.'),
    A('Dùng tay lau các chân tiếp xúc cho sạch bụi', 'Mồ hôi/dầu trên tay làm bẩn và có thể làm cong chân tiếp xúc.'),
    A('Xoay CPU đến khi thấy vừa', 'CPU chỉ vào một chiều duy nhất, phải căn dấu tam giác trước khi đặt.'),
  ] },
  cooler: { title: 'Lắp tản nhiệt CPU', steps: [
    A('Lau sạch mặt CPU (nếu có keo cũ)'),
    A('Bôi một chấm keo tản nhiệt cỡ hạt đậu ở giữa CPU'),
    A('Gỡ miếng nilon bảo vệ ở đế tản nhiệt'),
    A('Đặt tản thẳng lên CPU, vặn vít chéo nhau từng chút một'),
    A('Cắm dây quạt tản vào chân CPU_FAN trên mainboard'),
  ], wrong: [
    A('Bôi thật nhiều keo phủ kín cả CPU', 'Keo quá dày dẫn nhiệt kém hơn và có thể tràn ra socket.'),
    A('Cắm dây quạt vào chân SYS_FAN', 'Quạt CPU phải cắm CPU_FAN, nếu không mainboard có thể báo lỗi và không điều tốc.'),
  ] },
  ram: { title: 'Lắp RAM', steps: [
    A('Mở lẫy ở đầu khe RAM số 2 và số 4 (A2, B2)'),
    A('Căn khấc trên chân RAM trùng với gờ trong khe'),
    A('Ấn đều hai đầu thanh RAM đến khi lẫy tự khoá kêu "tách"'),
  ], wrong: [
    A('Cắm 2 thanh vào 2 khe sát nhau (khe 1 và 2)', 'Khe sát nhau cùng một kênh – RAM chạy kênh đơn, chậm hơn.'),
    A('Ấn một đầu trước rồi bẻ đầu còn lại xuống', 'Phải ấn đều hai đầu, bẻ nghiêng dễ làm hỏng khe.'),
  ] },
  m2: { title: 'Lắp SSD M.2', steps: [
    A('Tháo tản nhiệt M.2 trên mainboard (nếu có)'),
    A('Cắm SSD nghiêng khoảng 30° vào khe M.2'),
    A('Ấn SSD nằm xuống và bắt vít / gạt chốt giữ'),
    A('Gỡ nilon miếng dán tản nhiệt rồi lắp tản M.2 lại'),
  ], wrong: [
    A('Cắm SSD nằm ngang rồi đẩy mạnh vào khe', 'Phải cắm nghiêng rồi mới ấn xuống, đẩy mạnh dễ gãy chân.'),
  ] },
  hdd: { title: 'Lắp ổ cứng 2.5"/3.5"', steps: [
    A('Đặt ổ vào khay/lồng ổ cứng, mặt nhãn hướng lên'),
    A('Bắt vít hoặc gài khay giữ cho ổ không rung'),
    A('Xoay đầu cắm SATA của ổ ra phía dễ đi dây'),
  ], wrong: [
    A('Để ổ nằm tự do trong vỏ, không cần bắt vít', 'Ổ bị rung/va đập sẽ hỏng (nhất là HDD có đĩa quay).'),
  ] },
  psu: { title: 'Lắp bộ nguồn', steps: [
    A('Gạt công tắc nguồn sang O (tắt) và chưa cắm điện'),
    A('Đặt nguồn vào khoang dưới, quạt hướng xuống lưới lọc bụi'),
    A('Bắt 4 vít ở mặt sau vỏ'),
  ], wrong: [
    A('Cắm điện và bật công tắc trước khi lắp cho tiện thử', 'Không bao giờ lắp ráp khi máy đang có điện – nguy hiểm.'),
    A('Úp quạt nguồn sát mặt sàn vỏ kín không có lỗ thông gió', 'Nguồn sẽ không hút được gió mát và quá nhiệt.'),
  ] },
  gpu: { title: 'Lắp card đồ hoạ', steps: [
    A('Tháo các nắp chắn khe PCIe ở mặt sau vỏ'),
    A('Mở lẫy khoá ở cuối khe PCIe x16 trên cùng'),
    A('Cắm card thẳng xuống đến khi lẫy tự khoá'),
    A('Bắt vít giữ ke card vào vỏ'),
  ], wrong: [
    A('Cắm card vào khe PCIe x1 ngắn', 'Card đồ hoạ phải cắm khe x16 (khe dài nhất, thường có ốp thép).'),
  ] },
  'c-24pin': { title: 'Cắm cáp nguồn 24-pin', steps: [
    A('Căn lẫy cài của đầu cáp trùng với gờ trên cổng 24-pin'),
    A('Ấn thẳng đến khi nghe "tách"'),
  ], wrong: [A('Lắc qua lắc lại để ấn cho vào', 'Ấn thẳng, lắc mạnh có thể làm gãy chân cắm.')] },
  'c-cpu8': { title: 'Cắm cáp nguồn CPU 8-pin', steps: [
    A('Lấy đúng cáp có ghi CPU / EPS (không phải cáp PCIe)'),
    A('Cắm vào cổng CPU_PWR ở góc trên bên trái mainboard'),
  ], wrong: [A('Dùng cáp PCIe 8-pin cắm vào cổng CPU', 'Hai loại khác cách sắp xếp chân; cắm nhầm có thể gây chập/hỏng.')] },
  'c-pcie': { title: 'Cắm cáp nguồn VGA', steps: [
    A('Lấy cáp có ghi PCIe/VGA từ bộ nguồn'),
    A('Cắm hết các đầu cắm (6+2 pin hoặc 12V-2x6) vào card đến khi khớp hoàn toàn'),
  ], wrong: [A('Chỉ cắm một nửa đầu 12V-2x6 cho dễ tháo', 'Cắm hở đầu 12V-2x6 có thể làm chảy đầu cắm.')] },
  'c-sata': { title: 'Cắm cáp SATA', steps: [
    A('Cắm dây dữ liệu SATA từ ổ về cổng SATA trên mainboard'),
    A('Cắm dây nguồn SATA từ bộ nguồn vào ổ'),
  ], wrong: [A('Chỉ cần cắm dây dữ liệu, ổ tự lấy điện từ mainboard', 'Ổ SATA cần cả dây nguồn riêng từ bộ nguồn.')] },
  'c-fp': { title: 'Cắm Front Panel', steps: [
    A('Xem sơ đồ chân F_PANEL in trên mainboard / sách hướng dẫn'),
    A('Cắm POWER SW và RESET SW (không phân cực)'),
    A('Cắm POWER LED và HDD LED đúng cực + / −'),
  ], wrong: [A('Cắm đại vào các chân gần nhau rồi thử bấm nút', 'Cắm sai có thể khiến nút nguồn không hoạt động; luôn xem sơ đồ chân.')] },
};
export function actionsFor(slot, part) {
  const a = ACTIONS[slot]; if (!a) return null;
  return { title: a.title, steps: typeof a.steps === 'function' ? a.steps(part) : a.steps, wrong: a.wrong || [] };
}
