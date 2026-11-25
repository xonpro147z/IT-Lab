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
