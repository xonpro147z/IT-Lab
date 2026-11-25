// Danh sách phím tắt theo nhóm. k: tổ hợp chuẩn (Ctrl, Alt, Shift, Win + phím)
// app: ứng dụng cần mở để thực hành ('os' = dùng ở bất kỳ đâu)
// mac: phím tương ứng trên macOS (nếu khác cách đổi Ctrl → ⌘)
// os: true = hệ điều hành thật thường "giành" phím này → nên bấm trên bàn phím ảo
export const CATS = [
  { id: 'win', name: 'Hệ điều hành', sub: 'Cửa sổ, màn hình, hệ thống', app: 'os', color: '#0071e3' },
  { id: 'text', name: 'Soạn thảo chung', sub: 'Dùng trong hầu hết phần mềm', app: 'notepad', color: '#5e5ce6' },
  { id: 'explorer', name: 'Quản lý tệp', sub: 'File Explorer', app: 'explorer', color: '#ff9f0a' },
  { id: 'browser', name: 'Trình duyệt web', sub: 'Chrome, Edge, Firefox, Cốc Cốc', app: 'browser', color: '#30b0c7' },
  { id: 'word', name: 'Word', sub: 'Soạn thảo văn bản', app: 'word', color: '#185abd' },
  { id: 'excel', name: 'Excel', sub: 'Bảng tính', app: 'excel', color: '#107c41' },
  { id: 'ppt', name: 'PowerPoint', sub: 'Trình chiếu', app: 'ppt', color: '#c43e1c' },
];

const S = (cat, k, d, extra = {}) => ({ cat, k, d, ...extra });

export const SHORTCUTS = [
  // ===== Hệ điều hành =====
  S('win', 'Win', 'Mở hoặc đóng menu Start', { mac: '⌘ + Space (Spotlight)', os: true }),
  S('win', 'Win+E', 'Mở File Explorer (quản lý tệp)', { mac: '⌘ + ⌥ + Space (Finder)', os: true }),
  S('win', 'Win+D', 'Ẩn tất cả cửa sổ, hiện màn hình nền', { mac: 'F11', os: true }),
  S('win', 'Alt+Tab', 'Chuyển qua lại giữa các cửa sổ', { mac: '⌘ + Tab', os: true }),
  S('win', 'Win+Up', 'Phóng to cửa sổ', { mac: '—', os: true }),
  S('win', 'Win+Down', 'Thu nhỏ hoặc khôi phục cửa sổ', { mac: '⌘ + M', os: true }),
  S('win', 'Win+Left', 'Ghép cửa sổ vào nửa trái màn hình', { mac: '—', os: true }),
  S('win', 'Win+Right', 'Ghép cửa sổ vào nửa phải màn hình', { mac: '—', os: true }),
  S('win', 'Win+Tab', 'Xem tất cả cửa sổ (Task View)', { mac: '⌃ + ↑ (Mission Control)', os: true }),
  S('win', 'Win+M', 'Thu nhỏ tất cả cửa sổ', { mac: '⌘ + ⌥ + M', os: true }),
  S('win', 'Alt+F4', 'Đóng cửa sổ đang dùng', { mac: '⌘ + Q' }),
  S('win', 'Win+I', 'Mở Cài đặt', { mac: '⌘ + ,', os: true }),
  S('win', 'Win+R', 'Mở hộp thoại Run (chạy lệnh)', { mac: '—', os: true }),
  S('win', 'Win+V', 'Xem lịch sử bộ nhớ tạm (Clipboard)', { mac: '—', os: true }),
  S('win', 'Win+.', 'Chèn biểu tượng cảm xúc (emoji)', { mac: '⌃ + ⌘ + Space', os: true }),
  S('win', 'PrtScn', 'Chụp toàn bộ màn hình', { mac: '⌘ + ⇧ + 3', os: true }),
  S('win', 'Win+Shift+S', 'Chụp một vùng màn hình', { mac: '⌘ + ⇧ + 4', os: true }),
  S('win', 'Win+A', 'Mở Cài đặt nhanh (Wi-Fi, âm lượng…)', { mac: '—', os: true }),
  S('win', 'Win+X', 'Mở menu liên kết nhanh', { mac: '—', os: true }),
  S('win', 'Ctrl+Shift+Esc', 'Mở Task Manager (quản lý tác vụ)', { mac: '⌘ + ⌥ + Esc', os: true }),
  S('win', 'Ctrl+Alt+Delete', 'Mở màn hình bảo mật', { mac: '—', os: true }),
  S('win', 'Win+L', 'Khoá máy tính', { mac: '⌃ + ⌘ + Q', os: true }),

  // ===== Soạn thảo chung (Ghi chú) =====
  S('text', 'Ctrl+A', 'Chọn tất cả'),
  S('text', 'Ctrl+C', 'Sao chép phần đang chọn'),
  S('text', 'Ctrl+V', 'Dán'),
  S('text', 'Ctrl+X', 'Cắt phần đang chọn'),
  S('text', 'Ctrl+Z', 'Hoàn tác (quay lại thao tác trước)'),
  S('text', 'Ctrl+Y', 'Làm lại thao tác vừa hoàn tác', { mac: '⌘ + ⇧ + Z' }),
  S('text', 'Home', 'Đưa con trỏ về đầu dòng', { mac: '⌘ + ←' }),
  S('text', 'End', 'Đưa con trỏ về cuối dòng', { mac: '⌘ + →' }),
  S('text', 'Ctrl+Home', 'Về đầu văn bản', { mac: '⌘ + ↑' }),
  S('text', 'Ctrl+End', 'Về cuối văn bản', { mac: '⌘ + ↓' }),
  S('text', 'Ctrl+Right', 'Nhảy sang từ tiếp theo', { mac: '⌥ + →' }),
  S('text', 'Ctrl+Left', 'Lùi về từ phía trước', { mac: '⌥ + ←' }),
  S('text', 'Shift+End', 'Chọn từ con trỏ đến cuối dòng', { mac: '⌘ + ⇧ + →' }),
  S('text', 'Ctrl+Shift+Right', 'Chọn thêm một từ', { mac: '⌥ + ⇧ + →' }),
  S('text', 'Ctrl+Backspace', 'Xoá cả từ phía trước con trỏ', { mac: '⌥ + Delete' }),
  S('text', 'Ctrl+F', 'Tìm kiếm'),
  S('text', 'Ctrl+H', 'Tìm và thay thế', { mac: '⌘ + ⌥ + F' }),
  S('text', 'Ctrl+S', 'Lưu tệp'),
  S('text', 'Ctrl+P', 'In'),
  S('text', 'Ctrl+N', 'Tạo tệp mới'),
  S('text', 'Ctrl+O', 'Mở tệp có sẵn'),

  // ===== Quản lý tệp =====
  S('explorer', 'Enter', 'Mở thư mục hoặc tệp đang chọn', { mac: '⌘ + ↓' }),
  S('explorer', 'Backspace', 'Quay lại thư mục trước', { mac: '⌘ + [' }),
  S('explorer', 'Alt+Up', 'Lên thư mục cha', { mac: '⌘ + ↑' }),
  S('explorer', 'Ctrl+Shift+N', 'Tạo thư mục mới', { mac: '⌘ + ⇧ + N' }),
  S('explorer', 'F2', 'Đổi tên tệp/thư mục', { mac: 'Return' }),
  S('explorer', 'Ctrl+A', 'Chọn tất cả tệp', { app: 'explorer' }),
  S('explorer', 'Ctrl+C', 'Sao chép tệp', { app: 'explorer' }),
  S('explorer', 'Ctrl+V', 'Dán tệp vừa sao chép', { app: 'explorer' }),
  S('explorer', 'Delete', 'Xoá tệp vào Thùng rác', { mac: '⌘ + Delete' }),
  S('explorer', 'Ctrl+Z', 'Hoàn tác (lấy lại tệp vừa xoá)', { app: 'explorer' }),
  S('explorer', 'Shift+Delete', 'Xoá vĩnh viễn, không qua Thùng rác', { mac: '⌘ + ⌥ + Delete' }),
  S('explorer', 'Alt+Enter', 'Xem thuộc tính (dung lượng, ngày tạo)', { mac: '⌘ + I' }),
  S('explorer', 'F5', 'Làm mới danh sách', { mac: '—' }),

  // ===== Trình duyệt =====
  S('browser', 'Ctrl+T', 'Mở thẻ (tab) mới'),
  S('browser', 'Ctrl+W', 'Đóng thẻ hiện tại'),
  S('browser', 'Ctrl+Shift+T', 'Mở lại thẻ vừa đóng'),
  S('browser', 'Ctrl+Tab', 'Chuyển sang thẻ kế tiếp', { mac: '⌃ + Tab' }),
  S('browser', 'Ctrl+Shift+Tab', 'Chuyển về thẻ phía trước', { mac: '⌃ + ⇧ + Tab' }),
  S('browser', 'Ctrl+1', 'Chuyển đến thẻ đầu tiên'),
  S('browser', 'Ctrl+9', 'Chuyển đến thẻ cuối cùng'),
  S('browser', 'Ctrl+L', 'Chọn thanh địa chỉ để gõ trang web'),
  S('browser', 'F5', 'Tải lại trang', { mac: '⌘ + R' }),
  S('browser', 'Alt+Left', 'Quay lại trang trước', { mac: '⌘ + [' }),
  S('browser', 'Alt+Right', 'Đi tới trang sau', { mac: '⌘ + ]' }),
  S('browser', 'Ctrl+D', 'Đánh dấu trang (Bookmark)'),
  S('browser', 'Ctrl+F', 'Tìm chữ trong trang', { app: 'browser' }),
  S('browser', 'Ctrl+=', 'Phóng to trang (phím = hoặc +)'),
  S('browser', 'Ctrl+-', 'Thu nhỏ trang'),
  S('browser', 'Ctrl+0', 'Đưa trang về cỡ ban đầu'),
  S('browser', 'Ctrl+H', 'Xem lịch sử duyệt web', { mac: '⌘ + Y', app: 'browser' }),
  S('browser', 'Ctrl+J', 'Xem các tệp đã tải xuống', { mac: '⌘ + ⌥ + L' }),
  S('browser', 'Ctrl+Shift+N', 'Mở cửa sổ ẩn danh', { app: 'browser' }),
  S('browser', 'F11', 'Bật/tắt toàn màn hình', { mac: '⌃ + ⌘ + F' }),

  // ===== Word =====
  S('word', 'Ctrl+B', 'In đậm'),
  S('word', 'Ctrl+I', 'In nghiêng'),
  S('word', 'Ctrl+U', 'Gạch chân'),
  S('word', 'Ctrl+E', 'Căn giữa đoạn văn'),
  S('word', 'Ctrl+R', 'Căn phải'),
  S('word', 'Ctrl+L', 'Căn trái', { app: 'word' }),
  S('word', 'Ctrl+J', 'Căn đều hai bên', { app: 'word' }),
  S('word', 'Ctrl+]', 'Tăng cỡ chữ 1 điểm'),
  S('word', 'Ctrl+[', 'Giảm cỡ chữ 1 điểm'),
  S('word', 'Ctrl+Shift+=', 'Chỉ số trên (x²)'),
  S('word', 'Ctrl+=', 'Chỉ số dưới (H₂O)', { app: 'word' }),
  S('word', 'Ctrl+2', 'Giãn dòng đôi'),
  S('word', 'Ctrl+1', 'Giãn dòng đơn', { app: 'word' }),
  S('word', 'Ctrl+Shift+L', 'Tạo danh sách dấu đầu dòng'),
  S('word', 'Ctrl+K', 'Chèn liên kết'),
  S('word', 'Ctrl+Space', 'Xoá định dạng ký tự', { app: 'word' }),
  S('word', 'Ctrl+Enter', 'Ngắt sang trang mới', { mac: '⌘ + Return' }),

  // ===== Excel =====
  S('excel', 'Ctrl+Home', 'Về ô A1', { app: 'excel' }),
  S('excel', 'Ctrl+Down', 'Nhảy xuống ô cuối của vùng dữ liệu', { mac: '⌘ + ↓' }),
  S('excel', 'Ctrl+Right', 'Nhảy sang ô cuối bên phải của vùng dữ liệu', { mac: '⌘ + →', app: 'excel' }),
  S('excel', 'Ctrl+End', 'Đến ô cuối cùng có dữ liệu', { app: 'excel' }),
  S('excel', 'F2', 'Sửa nội dung ô đang chọn', { mac: '⌃ + U', app: 'excel' }),
  S('excel', 'Alt+=', 'Tự động tính tổng (AutoSum)', { mac: '⌘ + ⇧ + T' }),
  S('excel', 'Ctrl+;', 'Nhập ngày hôm nay'),
  S('excel', 'Ctrl+Shift+;', 'Nhập giờ hiện tại'),
  S('excel', 'Ctrl+D', 'Điền xuống (chép ô trên cùng xuống vùng chọn)', { app: 'excel' }),
  S('excel', 'Ctrl+Space', 'Chọn cả cột', { mac: '⌃ + Space', app: 'excel' }),
  S('excel', 'Shift+Space', 'Chọn cả hàng'),
  S('excel', 'Ctrl+B', 'In đậm ô', { app: 'excel' }),
  S('excel', 'Delete', 'Xoá nội dung ô', { app: 'excel' }),
  S('excel', 'Ctrl+1', 'Mở hộp thoại Định dạng ô', { app: 'excel' }),
  S('excel', 'Ctrl+PageDown', 'Sang trang tính (Sheet) kế tiếp', { mac: '⌥ + →' }),
  S('excel', 'Ctrl+PageUp', 'Về trang tính phía trước', { mac: '⌥ + ←' }),

  // ===== PowerPoint =====
  S('ppt', 'Ctrl+M', 'Thêm slide mới'),
  S('ppt', 'Ctrl+D', 'Nhân bản slide đang chọn', { app: 'ppt' }),
  S('ppt', 'Delete', 'Xoá slide đang chọn', { app: 'ppt' }),
  S('ppt', 'F5', 'Trình chiếu từ slide đầu tiên', { mac: '⌘ + ⇧ + Return', app: 'ppt' }),
  S('ppt', 'Right', 'Sang slide tiếp theo (khi trình chiếu)', { show: true }),
  S('ppt', 'Left', 'Về slide trước (khi trình chiếu)', { show: true }),
  S('ppt', 'B', 'Tạm tắt màn hình đen (khi trình chiếu)', { show: true }),
  S('ppt', 'W', 'Tạm chuyển màn hình trắng (khi trình chiếu)', { show: true }),
  S('ppt', 'Esc', 'Kết thúc trình chiếu', { show: true }),
  S('ppt', 'Shift+F5', 'Trình chiếu từ slide đang chọn', { mac: '⌘ + Return' }),
];

for (const s of SHORTCUTS) if (!s.app) s.app = CATS.find((c) => c.id === s.cat).app;

// Đổi sang cách viết trên macOS
export function macOf(s) {
  if (s.mac) return s.mac;
  return s.k.split('+').map((p) => ({ Ctrl: '⌘', Alt: '⌥', Shift: '⇧', Win: '⌃', Enter: 'Return', Backspace: 'Delete', Up: '↑', Down: '↓', Left: '←', Right: '→' }[p] || p)).join(' + ');
}
