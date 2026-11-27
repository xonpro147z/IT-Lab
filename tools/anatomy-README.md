# Phòng lắp ráp + Giải phẫu máy tính 3D

Dựng từ **PC Anatomy** – https://github.com/Yoosseph/pc-anatomy (tác giả Yoseph, giấy phép MIT, xem LICENSE-pc-anatomy.txt).

TinHocLab đã thêm/thay đổi:
- `asm.js` + `lib/assembly-mode.ts`: **chế độ lắp ráp** – linh kiện thật của PC Anatomy bày trên khay cạnh thùng máy, học sinh lắp từng phần theo đúng trình tự (I/O shield → mainboard → CPU → RAM → SSD M.2 → tản nhiệt → nguồn → card đồ hoạ → SSD SATA → dây nguồn → kính hông), mỗi bước phải chọn đúng các thao tác; có bài thi chấm điểm gửi về máy giáo viên qua LAN.
- RAM và SSD M.2 được tách khỏi mainboard thành linh kiện riêng trong thùng máy (`lib/machine.ts`, `lib/mainboard.ts`).
- `vi.js`: Việt hoá giao diện. Mô tả dài từng linh kiện vẫn là tiếng Anh gốc.
- Bỏ thống kê truy cập và nút gửi góp ý để chạy ngoại tuyến; máy không có card đồ hoạ thì tắt bóng đổ.

Mở: `index.html?scale=pc&asm=practice` (luyện), `asm=exam` (bài thi), `asm=explore` (khám phá).
Dựng lại từ mã nguồn: `bash tools/build-anatomy.sh`
