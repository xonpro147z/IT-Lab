# Phòng lắp ráp + Giải phẫu máy tính 3D

Dựng từ **PC Anatomy** – https://github.com/Yoosseph/pc-anatomy (tác giả Yoseph, giấy phép MIT, xem LICENSE-pc-anatomy.txt).

TinHocLab đã thêm/thay đổi:
- `asm.js` + `lib/assembly-mode.ts`: **chế độ lắp ráp** – linh kiện thật của PC Anatomy bày trên khay cạnh thùng máy, học sinh lắp từng phần theo đúng trình tự (I/O shield → mainboard → CPU → RAM → SSD M.2 → tản nhiệt → nguồn → card đồ hoạ → SSD SATA → dây nguồn → kính hông), mỗi bước phải chọn đúng các thao tác; có bài thi chấm điểm gửi về máy giáo viên qua LAN.
- RAM và SSD M.2 được tách khỏi mainboard thành linh kiện riêng trong thùng máy (`lib/machine.ts`, `lib/mainboard.ts`).
- `teardown.js` + `lib/thl/teardown.ts` (mã nguồn ở `tools/anatomy-thl/`): **chế độ Tháo lắp 3D** – kéo từng linh kiện ra theo đúng hướng rút khỏi khe, kéo tự do không xuyên vỏ/linh kiện khác, xoay, thả đúng chỗ và đúng hướng để lắp lại; có ràng buộc thứ tự (phải mở kính, tháo tản nhiệt trước CPU…), X-quang, mặt cắt, bung rời theo lớp, góc camera đặt sẵn, nhãn chú thích và trình diễn tự chạy. Chạy ngay trên viewer của PC Anatomy, không thêm bộ máy 3D nào. Ý tưởng từ Teardown (MIT, xem NOTICE-teardown.txt).
- **Thư viện mô hình linh kiện (P4)** – `tools/anatomy-thl/procgen/`: bộ sinh mô hình 3D theo SKU từ dữ liệu BuildCores OpenDB.
  Chuỗi xử lý: bản ghi JSON → `spec.ts` (SKU + kích thước, mỗi số ghi nguồn: OpenDB / tiêu chuẩn / ước lượng) →
  `gen/<loại>.ts` (8 bộ sinh: RAM, SSD, CPU, GPU, bo mạch chủ, nguồn, thùng máy, tản nhiệt) → `kit.ts` (hình học + vật liệu PBR,
  chuyển thể từ Teardown) → `glb.ts` (xuất GLB bằng GLTFExporter, đọc lại để kiểm tra tên mesh, kích thước, vật liệu) →
  `cli.ts` (dựng thư viện `tools/model-library/components/<loại>/<sku>.glb` + `<sku>.json` + `manifest.json`, có bộ nhớ đệm) và
  `library.ts` (trong ứng dụng: tìm theo SKU → thư viện → IndexedDB → sinh mới). Dữ liệu mẫu: `tools/opendb/` (19 SKU, CC BY-NC-SA 4.0,
  xem NOTICE-OpenDB.md). Trong chế độ Tháo lắp 3D, chọn linh kiện → "Mẫu linh kiện (SKU)" để thay mô hình trong máy, hoặc mở
  "Thư viện mô hình" để xem riêng và bung rời từng mô hình. Thêm SKU: chép bản ghi OpenDB vào `tools/opendb/<Nhóm>/` rồi dựng lại.
  Đổi cách dựng: tăng `GENERATOR_VERSION` trong `procgen/index.ts`.
- `vi.js`: Việt hoá giao diện. Mô tả dài từng linh kiện vẫn là tiếng Anh gốc.
- Bỏ thống kê truy cập và nút gửi góp ý để chạy ngoại tuyến; máy không có card đồ hoạ thì tắt bóng đổ.

Mở: `index.html?scale=pc&asm=practice` (luyện), `asm=exam` (bài thi), `asm=explore` (khám phá), `asm=teardown` (tháo lắp 3D).
Dựng lại từ mã nguồn: `bash tools/build-anatomy.sh` (ghim pc-anatomy ở commit 485a649).
