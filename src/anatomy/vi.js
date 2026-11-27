// Việt hoá giao diện PC Anatomy (TinHocLab). Dịch các chuỗi hiển thị ngay trên trang, không sửa mã gốc.
// Mô tả dài của từng linh kiện vẫn giữ tiếng Anh gốc.
(function () {
  const D = {
    // ---- khung giao diện ----
    'PC Anatomy': 'Giải phẫu máy tính', 'Switch to light': 'Chuyển sang nền sáng', 'Switch to dark': 'Chuyển sang nền tối', 'Created by': 'Tác giả',
    'Guide': 'Hướng dẫn', 'Search components': 'Tìm linh kiện', 'About': 'Giới thiệu', 'About and credits': 'Giới thiệu và ghi công', 'About and sources': 'Giới thiệu và nguồn',
    'Desktop PC': 'Máy để bàn', 'Laptops': 'Laptop', 'Mac': 'Mac', 'Compare components': 'So sánh linh kiện', 'Build your own PC': 'Tự ráp cấu hình', 'Build your PC': 'Tự ráp cấu hình',
    'Case, board, power, storage and cooling': 'Vỏ, bo mạch, nguồn, lưu trữ và tản nhiệt', 'VISIBLE SYSTEMS': 'HỆ THỐNG HIỂN THỊ', 'Visible systems': 'Hệ thống hiển thị', 'System visibility': 'Hiển thị hệ thống',
    'Hide all': 'Ẩn tất cả', 'Show all': 'Hiện tất cả', 'Hide': 'Ẩn', 'Show': 'Hiện', 'Isolate': 'Chỉ xem phần này', 'Focus': 'Phóng tới', 'Details': 'Chi tiết', 'Less': 'Thu gọn',
    'The complete machine.': 'Cả bộ máy hoàn chỉnh.', 'Click a part to open it, right-click to inspect it, or press Auto.': 'Bấm vào linh kiện để mở bên trong, chuột phải để xem thông tin, hoặc bấm Tự động.',
    'Tap a part to see what it is and take it apart, or press Auto.': 'Chạm vào linh kiện để xem và tháo nó ra, hoặc bấm Tự động.',
    'Left-click to open · right-click to inspect': 'Chuột trái: mở bên trong · Chuột phải: xem thông tin',
    'Smoother 3D exploration': 'Xem 3D mượt hơn', 'Try enabling browser hardware acceleration for smoother rendering.': 'Hãy bật tăng tốc phần cứng (card đồ hoạ) để hình 3D mượt hơn.', 'How to enable it': 'Cách bật',
    '3D': '3D', 'TOP': 'TRÊN', 'FRONT': 'TRƯỚC', 'BACK': 'SAU', 'Top view': 'Nhìn từ trên', 'Front view': 'Nhìn từ trước', 'Back view': 'Nhìn từ sau', 'Perspective view': 'Phối cảnh',
    'Airflow': 'Luồng gió', 'Power': 'Nguồn điện', 'Off': 'Tắt', 'On': 'Bật', 'Disassemble': 'Tháo rời', 'DRAG OR PLAY': 'KÉO HOẶC BẤM CHẠY', 'Auto': 'Tự động', 'AUTO': 'TỰ ĐỘNG',
    'Assembled': 'Đã lắp', 'Dissection': 'Đang tháo', 'Inventory': 'Bày linh kiện', 'Coming apart': 'Đang tách ra', 'Reset': 'Đặt lại', 'Pause': 'Tạm dừng',
    'Take it apart automatically': 'Tự động tháo rời', 'Pause automatic disassembly': 'Dừng tháo tự động', 'Reset camera and assembly': 'Đặt lại góc nhìn và lắp lại', 'Explosion control': 'Điều khiển tháo rời',
    'Enter fullscreen': 'Toàn màn hình', 'Exit fullscreen': 'Thoát toàn màn hình', 'Camera controls': 'Góc nhìn', 'Reload viewer': 'Tải lại khung 3D',
    'The 3D context was interrupted. Reload the viewer to continue.': 'Khung 3D bị gián đoạn. Bấm tải lại để tiếp tục.', 'The 3D viewer could not load. Reload to try again.': 'Không tải được khung 3D. Hãy tải lại.',
    'Show airflow': 'Hiện luồng gió', 'Hide airflow': 'Ẩn luồng gió', 'Show the path the air takes through the machine': 'Hiện đường đi của không khí qua máy', 'Hide the path the air takes': 'Ẩn đường đi của không khí',
    'Show airflow — it draws on the assembled machine': 'Hiện luồng gió – chỉ vẽ khi máy đang lắp hoàn chỉnh', 'Show power flow': 'Hiện luồng điện', 'Hide power flow': 'Ẩn luồng điện', 'Power flow': 'Luồng điện',
    'Trace power from the PSU to each component': 'Lần theo dòng điện từ bộ nguồn tới từng linh kiện', 'Power destination': 'Điện đi tới', 'All': 'Tất cả',
    'Find a component': 'Tìm linh kiện', 'Search parts, models or architecture…': 'Tìm linh kiện, mẫu hoặc kiến trúc…', 'Try Tensor, GDDR7, L2 or SM…': 'Thử: Tensor, GDDR7, L2 hoặc SM…',
    'Exploration scale': 'Cấp độ khám phá', 'Back one level': 'Lùi ra một cấp', 'Component hierarchy': 'Cây linh kiện', 'Component inventory': 'Danh sách linh kiện', 'Parts on the tray': 'Linh kiện trên khay',
    'Choose a system': 'Chọn hệ máy', 'Close systems': 'Đóng danh sách', 'Toggle systems': 'Mở/đóng danh sách', 'Hardware': 'Phần cứng', 'Explorer': 'Khám phá', 'Back to explorer': 'Quay lại khám phá',
    'Physical hardware': 'Phần cứng thật', 'Logical architecture': 'Kiến trúc logic', 'Architecture diagram': 'Sơ đồ kiến trúc', 'Diagram': 'Sơ đồ', 'Specs': 'Thông số', 'Parts': 'Linh kiện', 'All parts': 'Tất cả linh kiện',
    'Interactive 3D computer model': 'Mô hình máy tính 3D tương tác', 'Learn about PC components': 'Tìm hiểu linh kiện máy tính', 'Expand': 'Mở rộng', 'Close component details': 'Đóng thông tin linh kiện',
    'Disassemble the specimen': 'Tháo rời mẫu', 'Explore the specimen': 'Khám phá mẫu', 'Dismiss hint': 'Ẩn gợi ý', 'Dismiss performance tip': 'Ẩn mẹo', '3D performance tip': 'Mẹo hiệu năng 3D',
    'Fullscreen is blocked by this browser. Press F11 instead.': 'Trình duyệt chặn toàn màn hình. Hãy bấm F11.',
    // ---- so sánh ----
    'Comparison pair': 'Cặp so sánh', 'Disassemble both': 'Tháo rời cả hai', 'Expand both': 'Mở rộng cả hai', 'Explore both': 'Khám phá cả hai', 'Swap comparison sides': 'Đổi bên so sánh',
    'Close specification comparison': 'Đóng so sánh thông số', 'Close part picker': 'Đóng bảng chọn', 'Shared disassembly control': 'Điều khiển tháo chung', 'Visible comparison side': 'Bên đang xem',
    'Matching structures': 'Cấu trúc tương ứng', 'Model scale': 'Tỉ lệ mô hình', 'Same physical scale in both panes.': 'Hai bên cùng tỉ lệ kích thước thật.', 'Each model fits its pane. Sizes are not relative.': 'Mỗi mô hình vừa khung của nó; kích thước không so được với nhau.',
    'Each model fits its pane. Diagrams and illustrative parts have no physical scale.': 'Mỗi mô hình vừa khung; sơ đồ và chi tiết minh hoạ không theo tỉ lệ thật.',
    'Different kinds of parts, with each model’s own specifications.': 'Các loại linh kiện khác nhau, mỗi mẫu có thông số riêng.',
    'Matching fields are aligned. Not listed means the catalogue has no value for that model.': 'Các mục giống nhau xếp thẳng hàng. Không ghi nghĩa là chưa có số liệu cho mẫu đó.',
    'A · Left': 'A · Trái', 'B · Right': 'B · Phải', 'Search parts': 'Tìm linh kiện', 'Part categories': 'Nhóm linh kiện', 'Selected': 'Đã chọn',
    // ---- tự ráp cấu hình ----
    'Compatibility': 'Tương thích', 'Show compatibility': 'Xem tương thích', 'Checks': 'Kiểm tra', 'Check': 'Kiểm tra', 'Conflicts': 'Xung đột', 'Problems to fix': 'Lỗi cần sửa', 'Problem': 'Lỗi',
    'Worth checking': 'Nên xem lại', 'Passing': 'Đạt', 'Works': 'Đạt', 'Everything works together': 'Mọi linh kiện đều tương thích', 'checks pass': 'mục đạt', 'pass': 'đạt',
    'Share your build': 'Chia sẻ cấu hình', 'Copy a link to this build': 'Sao chép link cấu hình', 'Copied': 'Đã chép', 'Build panels': 'Bảng cấu hình', 'Hide the panels': 'Ẩn bảng', 'Show the panels': 'Hiện bảng',
    'Show context': 'Xem bối cảnh', 'Slots': 'Khe cắm', 'Click to find its slot': 'Bấm để tìm khe cắm', 'Click to inspect': 'Bấm để xem',
    'Paste it into a message or a post. Whoever opens it sees this build, part for part.': 'Dán vào tin nhắn hoặc bài đăng. Ai mở link sẽ thấy đúng cấu hình này.',
    'The browser did not allow copying, so the link is selected for you to copy.': 'Không chép tự động được, link đã được bôi đen để em tự chép.',
    'Processor options': 'Chọn CPU', 'Motherboard options': 'Chọn mainboard', 'Memory options': 'Chọn RAM', 'Storage options': 'Chọn ổ lưu trữ', 'Graphics card options': 'Chọn card đồ hoạ',
    'Power supply options': 'Chọn bộ nguồn', 'CPU cooler options': 'Chọn tản nhiệt CPU', 'Filter graphics card by maker': 'Lọc card theo hãng', 'Filter motherboard by maker': 'Lọc mainboard theo hãng',
    'Processor fits the socket': 'CPU vừa socket', 'Processor does not fit the socket': 'CPU không vừa socket', 'Memory fits the slots': 'RAM vừa khe cắm', 'Memory does not fit the slots': 'RAM không vừa khe cắm',
    'Memory speed is within reach': 'Tốc độ RAM chạy được', 'Four modules run slower': 'Cắm 4 thanh sẽ chạy chậm hơn', 'Board fits the case': 'Mainboard vừa vỏ', 'Card fits the case': 'Card vừa vỏ',
    'Cooler fits under the side panel': 'Tản nhiệt vừa dưới kính hông', 'Power cable matches the card': 'Cáp nguồn khớp với card', 'Both drives are connected': 'Cả hai ổ đã được nối',
    'Supply meets the card maker’s figure': 'Nguồn đạt mức hãng card khuyến nghị', 'Supply is below the card maker’s recommendation': 'Nguồn thấp hơn mức hãng card khuyến nghị',
    'Processor and card are within the supply’s rating': 'CPU + card nằm trong công suất nguồn', 'Processor and card add up to more than the supply': 'CPU + card vượt công suất nguồn',
    'Rated draw': 'Công suất tiêu thụ', 'Fixed cables': 'Dây liền', 'Modular': 'Dây rời (modular)', 'One drive · no cables': '1 ổ · không cần cáp', 'Two drives · one SATA cable': '2 ổ · 1 cáp SATA',
    'M.2 NVMe SSD only': 'Chỉ SSD M.2 NVMe', 'M.2 NVMe + 2.5-inch SATA SSD': 'M.2 NVMe + SSD SATA 2.5"',
    // ---- hệ thống / nhóm ----
    'Chassis': 'Vỏ máy', 'Cooling': 'Tản nhiệt', 'Board': 'Bo mạch', 'Memory': 'Bộ nhớ RAM', 'Storage': 'Lưu trữ', 'Compute': 'Xử lý', 'Graphics': 'Đồ hoạ', 'Cabling': 'Dây cáp',
    'Motherboard': 'Bo mạch chủ', 'Processor': 'Bộ vi xử lý (CPU)', 'Power supply': 'Bộ nguồn', 'GPU': 'Card đồ hoạ (GPU)', 'Graphics card': 'Card đồ hoạ', 'System': 'Hệ thống',
    'CPU cooler': 'Tản nhiệt CPU', 'Case fan': 'Quạt vỏ', 'Liquid cooling': 'Tản nhiệt nước', 'Tower air cooler': 'Tản khí dạng tháp', 'SATA SSD': 'SSD SATA', 'M.2 NVMe SSD': 'SSD M.2 NVMe', 'NVMe SSD': 'SSD NVMe',
    'DDR5 RAM': 'RAM DDR5', 'Cooler': 'Tản nhiệt', 'Fan': 'Quạt', 'Display': 'Màn hình', 'Battery': 'Pin', 'Keyboard and palm rest': 'Bàn phím và kê tay', 'Touchpad': 'Bàn di chuột',
    // ---- tên chi tiết thường gặp ----
    'Heat pipe': 'Ống dẫn nhiệt', 'Heat pipes': 'Ống dẫn nhiệt', 'Heat-pipe assembly': 'Cụm ống dẫn nhiệt', 'Heatsink': 'Tản nhiệt (lá tản)', 'Heatsinks': 'Tản nhiệt', 'Fins': 'Lá tản nhiệt', 'Vapor chamber': 'Buồng hơi',
    'Backplate': 'Tấm lưng', 'Back plate': 'Tấm lưng', 'Shroud': 'Vỏ ốp', 'Bracket': 'Ke chặn', 'I/O bracket': 'Ke cổng xuất hình', 'I/O shield': 'Tấm chắn I/O', 'Rear I/O': 'Cổng I/O phía sau', 'Front I/O': 'Cổng I/O phía trước',
    'Front panel': 'Mặt trước', 'Top panel': 'Nóc', 'Side panel': 'Kính hông', 'Dust filter': 'Lưới lọc bụi', 'PSU shroud': 'Tấm che nguồn', 'Standoff': 'Cọc đồng', 'Mounting standoffs': 'Cọc đồng bắt mainboard',
    'Board mounting screws': 'Vít bắt mainboard', 'Screw': 'Vít', 'Socket': 'Socket CPU', 'DIMM slot': 'Khe RAM', 'M.2 socket': 'Khe M.2', 'M.2 connector': 'Khe cắm M.2', 'M.2 cover': 'Tấm tản M.2', 'M.2 retaining screw': 'Vít giữ M.2',
    'Chipset': 'Chipset', 'CPU VRM': 'Mạch cấp điện CPU (VRM)', 'VRM heatsink': 'Tản nhiệt VRM', 'Voltage regulation': 'Ổn áp', 'Power stage': 'Tầng công suất', 'PWM controller': 'IC điều khiển PWM', 'Choke': 'Cuộn cảm', 'Inductor': 'Cuộn cảm', 'Inductors': 'Cuộn cảm',
    'Capacitor': 'Tụ điện', 'Capacitors': 'Tụ điện', 'Ceramic capacitor': 'Tụ gốm', 'Resistor': 'Điện trở', 'Crystal': 'Thạch anh', 'Reference clock crystal': 'Thạch anh xung nhịp', 'Fuse': 'Cầu chì', 'Transformer': 'Biến áp', 'Rectifier': 'Mạch chỉnh lưu',
    'Fan header': 'Chân cắm quạt', 'Fan headers': 'Chân cắm quạt', 'ARGB header': 'Chân cắm LED ARGB', 'Front header': 'Chân cắm mặt trước', 'Fan cable': 'Dây quạt', 'Fan motor': 'Động cơ quạt', 'Impeller': 'Cánh quạt', 'Bearing': 'Bạc đạn', 'Stator': 'Stator (cuộn dây)', 'Frame': 'Khung',
    'Radiator': 'Két nước', 'Pump block': 'Bơm + đế tản', 'Tubing': 'Ống dẫn nước', 'Coolant': 'Dung dịch làm mát', 'Cold plate': 'Đế đồng', 'Coldplate': 'Đế đồng', 'Baseplate': 'Đế', 'Thermal pad': 'Miếng dán tản nhiệt', 'TIM': 'Keo tản nhiệt', 'Thermal interfaces': 'Lớp dẫn nhiệt',
    'Power connector': 'Đầu cấp nguồn', 'Power socket': 'Ổ cắm nguồn', 'Mains inlet': 'Ổ cắm điện lưới', 'EMI filter': 'Mạch lọc nhiễu', 'PFC stage': 'Mạch PFC', 'Supply fan': 'Quạt nguồn', 'Output panel': 'Mặt cổng ra', 'Bulk cap': 'Tụ lọc lớn', 'Output caps': 'Tụ đầu ra',
    'SATA data': 'Dây dữ liệu SATA', 'SATA power': 'Dây nguồn SATA', 'SATA port': 'Cổng SATA', 'Lead': 'Dây cáp', 'Display cable': 'Cáp màn hình', 'Ethernet': 'Cổng mạng LAN', 'Audio': 'Âm thanh', 'Wireless networking': 'Mạng không dây (Wi-Fi)',
    'NAND flash': 'Chip nhớ NAND', '3D NAND flash packages': 'Chip nhớ NAND 3D', 'NVMe controller': 'Bộ điều khiển NVMe', 'NVMe DRAM cache': 'Bộ đệm DRAM của NVMe', 'SSD PCB': 'Mạch SSD', 'M.2 circuit board': 'Mạch M.2', 'M-key edge contacts': 'Chân cắm M-key',
    'Module board': 'Mạch thanh RAM', 'DRAM package': 'Chip DRAM', 'Die': 'Nhân (die)', 'Bank': 'Bank nhớ', 'Bank group': 'Nhóm bank', 'Cells': 'Ô nhớ', 'DRAM memory cell': 'Ô nhớ DRAM', 'DRAM memory banks': 'Các bank nhớ DRAM',
    'Storage capacitor': 'Tụ lưu điện tích', 'Access transistor': 'Transistor truy cập', 'Wordline': 'Đường từ (wordline)', 'Bitline': 'Đường bit (bitline)', 'Sense amplifiers': 'Mạch khuếch đại đọc', 'Sense amp': 'Khuếch đại đọc', 'Row decoder': 'Bộ giải mã hàng', 'Column decoder': 'Bộ giải mã cột', 'Refresh': 'Làm tươi',
    'Substrate': 'Đế mạch', 'Package substrate': 'Đế chip', 'Spreader': 'Nắp tản nhiệt (IHS)', 'Contacts': 'Chân tiếp xúc', 'Pads': 'Điểm tiếp xúc', 'Balls': 'Bi hàn', 'Bond wires': 'Dây hàn', 'Mold cap': 'Lớp nhựa bọc',
    'L1 cache': 'Bộ nhớ đệm L1', 'L2 cache': 'Bộ nhớ đệm L2', 'Shared L3 cache': 'Bộ nhớ đệm L3 dùng chung', 'Instruction cache': 'Bộ đệm lệnh', 'Instruction decode': 'Giải mã lệnh', 'Instruction fetch': 'Nạp lệnh', 'Scheduler': 'Bộ lập lịch', 'Register files': 'Tệp thanh ghi', 'Registers': 'Thanh ghi',
    'Memory controller': 'Bộ điều khiển bộ nhớ', 'Memory controllers': 'Bộ điều khiển bộ nhớ', 'Performance cores': 'Nhân hiệu năng', 'Efficiency cores': 'Nhân tiết kiệm điện', 'GPU cores': 'Nhân GPU', 'Streaming multiprocessors': 'Cụm xử lý SM', 'Tensor Cores': 'Nhân Tensor', 'Ray tracing core': 'Nhân dò tia (RT)',
    'Texture units': 'Bộ xử lý texture', 'Display engine': 'Bộ xuất hình', 'Media engine': 'Bộ mã hoá video', 'NVENC video encoders': 'Bộ mã hoá video NVENC', 'NVDEC video decoders': 'Bộ giải mã video NVDEC', 'VBIOS flash memory': 'Chip BIOS của card',
    'GPU die': 'Nhân GPU (die)', 'GPU package': 'Chip GPU', 'Logic board': 'Bo mạch chính', 'System board': 'Bo mạch hệ thống', 'Unified memory': 'Bộ nhớ hợp nhất', 'Neural Engine': 'Bộ xử lý AI (Neural Engine)',
  };
  const R = [ // quy tắc có số / tiền tố
    [/^(Hide|Show|Isolate|Focus|Open|Inspect) (.+)$/, (m, a, b) => ({ Hide: 'Ẩn ', Show: 'Hiện ', Isolate: 'Chỉ xem ', Focus: 'Phóng tới ', Open: 'Mở ', Inspect: 'Xem ' }[a] + (tr(b) || b))],
    [/^(\d+) boards?$/, '$1 bo mạch'], [/^(\d+) models?$/, '$1 mẫu'], [/^(\d+) cards? · (\d+) scales$/, '$1 card · $2 cấp độ'], [/^(\d+) processors? · (\d+) scales$/, '$1 CPU · $2 cấp độ'],
    [/^(\d+) generations · (\d+) scales$/, '$1 thế hệ · $2 cấp độ'], [/^(\d+) scales? inside$/, '$1 cấp độ bên trong'], [/^(\d+) checks$/, '$1 mục kiểm tra'], [/^All (\d+) checks pass$/, 'Đạt cả $1 mục kiểm tra'],
    [/^(\d+) of (\d+) mm$/, '$1 / $2 mm'], [/^(\d+) of (\d+) W rated$/, '$1 / $2 W định mức'], [/^(\d+) mm tall$/, 'cao $1 mm'], [/^(\d+) slots$/, '$1 khe'], [/^All (\d+)$/, 'Tất cả ($1)'],
    [/^(\d+) W · modular$/, '$1 W · dây rời'], [/^(\d+) W · fixed cables$/, '$1 W · dây liền'], [/^Card room (\d+) mm$/, 'Chỗ cho card: $1 mm'],
  ];
  function tr(s) {
    if (D[s]) return D[s];
    for (const [re, to] of R) if (re.test(s)) return s.replace(re, to);
    return null;
  }
  const done = new WeakMap();
  function fixText(n) {
    const raw = n.nodeValue; if (!raw || !/[A-Za-z]/.test(raw)) return;
    if (done.get(n) === raw) return;
    const t = raw.trim(); const v = tr(t);
    if (v) { const out = raw.replace(t, v); done.set(n, out); n.nodeValue = out; } else done.set(n, raw);
  }
  function fixAttrs(el) {
    for (const a of ['placeholder', 'aria-label', 'title']) { const v = el.getAttribute && el.getAttribute(a); if (v) { const t = tr(v.trim()); if (t) el.setAttribute(a, t); } }
  }
  function walk(root) {
    if (root.nodeType === 3) return fixText(root);
    if (root.nodeType !== 1) return;
    fixAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n; while ((n = tw.nextNode())) { if (n.nodeType === 3) fixText(n); else fixAttrs(n); }
  }
  function start() {
    document.documentElement.lang = 'vi'; document.title = 'Giải phẫu máy tính – TinHocLab';
    walk(document.body);
    new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') fixText(m.target); else if (m.type === 'attributes') fixAttrs(m.target); else m.addedNodes.forEach(walk); } })
      .observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title'] });
    // nút quay về TinHocLab + ghi công
    const back = document.createElement('a'); back.href = '../index.html'; back.textContent = '‹ TinHocLab'; back.className = 'thl-back'; document.body.appendChild(back);
  }
  const css = document.createElement('style');
  css.textContent = '.feedback-button{display:none!important} .thl-back{position:fixed;left:10px;bottom:10px;z-index:9999;font:600 13px system-ui,sans-serif;color:#a1d9e2;background:rgba(10,12,14,.8);padding:6px 10px;border-radius:8px;text-decoration:none}';
  document.head.appendChild(css);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
