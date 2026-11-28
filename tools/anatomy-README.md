# Phòng lắp ráp + Giải phẫu máy tính 3D

Dựng từ **PC Anatomy** – https://github.com/Yoosseph/pc-anatomy (tác giả Yoseph, giấy phép MIT, xem LICENSE-pc-anatomy.txt).

TinHocLab đã thêm/thay đổi:
- `asm.js` + `lib/assembly-mode.ts`: **chế độ lắp ráp** – linh kiện thật của PC Anatomy bày trên khay cạnh thùng máy, học sinh lắp từng phần theo đúng trình tự (I/O shield → mainboard → CPU → RAM → SSD M.2 → tản nhiệt → nguồn → card đồ hoạ → SSD SATA → dây nguồn → kính hông), bấm vào linh kiện để lắp.
- RAM và SSD M.2 được tách khỏi mainboard thành linh kiện riêng trong thùng máy (`lib/machine.ts`, `lib/mainboard.ts`).
- `vi.js`: Việt hoá giao diện. Tên, mô tả, chức năng và thông số của từng linh kiện được dịch trong `lib/vi-concepts.json`; tên và mô tả các cấp độ trong `lib/vi-levels.json` (bản gốc: `tools/anatomy-vi-concepts.json`, `tools/anatomy-vi-levels.json`).
- Bỏ thống kê truy cập và nút gửi góp ý để chạy ngoại tuyến; máy không có card đồ hoạ thì tắt bóng đổ.

Mở: `index.html?scale=pc&asm=explore` (khám phá – mặc định), `asm=practice` (luyện lắp).
Dựng lại từ mã nguồn: `bash tools/build-anatomy.sh`

## Danh mục linh kiện để chọn cấu hình

Phần "Chọn linh kiện" dùng danh mục khoảng 1.700 linh kiện thật cùng các quy tắc kiểm tra tương thích, phỏng theo dự án **pc-builder-emulator** của lhristo (giấy phép MIT): https://github.com/lhristo/pc-builder-emulator

- `pccat.js` được tạo bằng `node tools/make-pccat.mjs <pc-builder-emulator>/data/feed-components.js`. Thông số gốc được làm sạch lại (socket, chuẩn RAM, kích thước bo mạch và vỏ máy, chiều dài card, công suất nguồn). Giá quy đổi từ USD chỉ để tham khảo khi học.
- `pccheck.js` chứa các quy tắc tương thích bằng tiếng Việt và cách chọn mô hình 3D gần nhất của PC Anatomy cho từng linh kiện.
- Ảnh sản phẩm trong màn hình chọn linh kiện được tải trực tiếp từ trang của nhà phân phối (đường dẫn có sẵn trong dữ liệu pc-builder-emulator) khi máy có mạng; TinHocLab không lưu kèm ảnh.

## Thực hành theo bài (lab.html)

Trang `lab.html` là một điểm vào riêng (`lab/main.ts`) dùng lại mô hình bo mạch ASUS TUF Z890, CPU, RAM, SSD, tản nhiệt và ánh sáng của PC Anatomy. Giao diện và nội dung bài nằm trong `labs/labs3d.js` và `labs/labs.css` (bản gốc ở `tools/anatomy-labs3d.js`, `tools/anatomy-labs.css`).
