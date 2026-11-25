# TinHocLab – Phần mềm thực hành Tin học

Ứng dụng máy tính (Windows `.exe`, macOS `.dmg`, Linux `.deb`) giúp học sinh thực hành:

1. **Lắp ráp máy tính 3D**: chọn trong 82 linh kiện thật của các hãng (ASUS, MSI, Gigabyte, Intel, AMD, NVIDIA, Corsair, Samsung, NZXT, Noctua…), kiểm tra tương thích, lắp vào vỏ máy trong không gian 3D, cắm cáp và bật nguồn.
3. **Khám phá phần cứng**: tìm kiếm (gõ có dấu hoặc không dấu) và xem mô hình 3D của hơn 150 phần cứng: cổng và cáp (USB-A/C, Micro/Mini USB, Lightning, FireWire, Thunderbolt, HDMI, DisplayPort, VGA, DVI, RJ45, PS/2, COM, LPT, SATA, Molex, 16-pin…), thiết bị lưu trữ (HDD, SSD, NVMe, đĩa mềm, CD/DVD, USB, thẻ nhớ), linh kiện, thiết bị ngoại vi, thiết bị mạng, sạc dự phòng, UPS… kèm năm ra đời, thông số, công dụng, "Bạn có biết?" và trò đố vui nhận biết. Không tìm thấy thì có nút tìm ảnh trên Google/Wikipedia.
2. **Tin học văn phòng**: giả lập Word, Excel, PowerPoint **hoàn toàn bằng tiếng Anh**, giao diện sát Microsoft 365 (ribbon, biểu tượng Fluent tự vẽ, thanh tiêu đề có AutoSave/Search, thước kẻ, thanh trạng thái), với các dự án luyện tập chấm điểm tự động theo dạng bài thi MOS 365 (Task 1…n, Mark for review, Submit project, đồng hồ).

Phần mềm chạy hoàn toàn offline, không cần Internet.

## Tính năng

### Lắp ráp máy tính 3D (Three.js)
- 29 linh kiện thuộc 8 nhóm: vỏ, mainboard (LGA1700/AM4/AM5, DDR4/DDR5, ATX/mATX), CPU, tản nhiệt, RAM, SSD M.2/HDD, VGA, nguồn, cùng 5 loại cáp.
- Kiểm tra tương thích: socket CPU, loại RAM, kích thước mainboard so với vỏ, chiều dài VGA, chiều cao tản nhiệt, công suất nguồn, CPU không có đồ hoạ tích hợp.
- **Chế độ hướng dẫn từng bước** (14 bước), có giải thích cách lắp ngoài thực tế.
- **Bật nguồn**: chẩn đoán lỗi như ngoài đời thật (quên cáp 24-pin, quên RAM, CPU quá nhiệt, không có ổ khởi động, VGA thiếu nguồn…), có màn hình POST/BIOS.
- 4 thử thách: máy văn phòng ≤ 15 triệu, máy chơi game ≤ 30 triệu, máy AMD AM5, máy đồ hoạ cao cấp.

### Phím tắt (src/keys)
- Máy tính ảo "TinHoc OS": cửa sổ kéo thả, thanh tác vụ, menu Start, Alt+Tab, Task View, màn hình khoá, chụp màn hình…
- Ứng dụng trong máy ảo: Ghi chú, Word, Excel, PowerPoint (có trình chiếu), File Explorer (có Thùng rác), trình duyệt nhiều thẻ, Task Manager, Cài đặt, Run.
- Bàn phím ảo sáng đèn theo phím thật; có thể nhấp chuột để bấm tổ hợp (dùng cho phím mà hệ điều hành thật giành trước như Win, Alt+Tab, Ctrl+Alt+Delete).
- 119 phím tắt chia 7 nhóm (shortcuts.js), kèm cách bấm trên macOS. Ba chế độ: Tra cứu, Luyện tập (từng bước, tự chuẩn bị tình huống), Kiểm tra (10 câu, lưu điểm).

### Word
Phông chữ, cỡ chữ, màu chữ, tô sáng, B/I/U, chỉ số trên/dưới, đổi chữ hoa/thường, sao chép định dạng, dấu đầu dòng, đánh số, căn lề, giãn dòng, tô nền đoạn, Kiểu tiêu đề, Tìm/Thay thế, bảng (thêm/xoá hàng cột, tô màu ô), ảnh (kích thước, bao quanh chữ), hình khối, liên kết, đầu trang/chân trang, ký hiệu, phương trình, hình mờ, màu trang, viền trang, lề, hướng giấy, khổ giấy, chia cột, mục lục tự động (Table of Contents), chú thích cuối trang (Footnote), số trang, đếm từ, bình luận. Xuất ra tệp `.doc` mở được bằng Microsoft Word.

### Excel
Bộ tính công thức riêng với hơn 50 hàm (SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, COUNTIF(S), SUMIF(S), AVERAGEIF, IF, AND, OR, ROUND, VLOOKUP, HLOOKUP, INDEX, MATCH, RANK, IFERROR, LEFT, RIGHT, MID, LEN, UPPER, TODAY…). Hỗ trợ địa chỉ tương đối/tuyệt đối ($A$1), kéo nút điền (fill handle) và tự sinh dãy số, bấm vào ô để chèn địa chỉ khi gõ công thức, sao chép/dán, hoàn tác, gộp ô, kẻ viền, định dạng số/tiền tệ/phần trăm, định dạng có điều kiện, Cell Styles, Format as Table, chèn/xoá hàng cột, sắp xếp, biểu đồ cột/thanh/đường/tròn, hiện công thức. Xuất CSV.

### PowerPoint
Bố trí trang chiếu, kéo thả/đổi kích thước đối tượng, hộp văn bản, chữ nghệ thuật, 8 loại hình khối, ảnh, 6 chủ đề, định dạng nền (màu, chuyển sắc, ảnh), 7 hiệu ứng chuyển trang, 7 hiệu ứng động, sắp xếp trang bằng kéo thả, nhân bản, ghi chú, số trang, trình chiếu toàn màn hình (F5). Xuất trang web trình chiếu `.html`.

### Bài tập chấm tự động
- Word: 7 dự án · Excel: 6 dự án · PowerPoint: 5 dự án · Lắp ráp: 4 thử thách.
- Mỗi bài gồm 5–6 nhiệm vụ. Học sinh bấm **Nộp bài** để xem nhiệm vụ đúng/sai kèm gợi ý.
- Họ tên học sinh và kết quả được lưu trên máy (nhập ở màn hình chính).

## Chạy thử khi phát triển

```bash
npm install
npm start
```

## Đóng gói

| Nền tảng | Lệnh | Kết quả trong `dist/` |
|---|---|---|
| Windows | `npm run dist:win` (chạy trên Windows) | `TinHocLab-1.0.0-Setup.exe`, `TinHocLab-1.0.0-Portable.exe` |
| macOS | `npm run dist:mac` (chạy trên Mac) | `TinHocLab-1.0.0-x64.dmg`, `TinHocLab-1.0.0-arm64.dmg` |
| Linux | `npm run dist:linux` | `TinHocLab-1.0.0-amd64.deb`, `.AppImage` |

**Cách dễ nhất là dùng GitHub Actions**: đẩy mã nguồn lên GitHub, sau đó tạo tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Workflow `.github/workflows/build.yml` sẽ tự đóng gói cả 3 nền tảng trên máy chủ Windows, macOS và Ubuntu rồi đính kèm vào trang Releases. Bạn cũng có thể vào thẻ **Actions → Build TinHocLab → Run workflow** để chạy thủ công và tải về trong mục Artifacts.

> Bản `.dmg` chưa được ký số của Apple. Lần đầu mở trên Mac, hãy chuột phải vào ứng dụng → **Open**, hoặc chạy `xattr -cr /Applications/TinHocLab.app`.

## Cấu trúc thư mục

```
main.js, preload.js        Tiến trình chính Electron (cửa sổ, lưu/mở tệp)
src/index.html             Màn hình chính
src/pcbuild/               Lắp ráp máy tính 3D
  parts.js                 Linh kiện thật các hãng  ← thêm linh kiện ở đây
  catalog.js               Nhóm linh kiện, thử thách, các bước hướng dẫn
  models.js                Mô hình 3D dựng bằng code
  pcbuild.js               Logic lắp ráp, tương thích, khởi động
src/keys/                  Phím tắt: shortcuts.js (danh sách) · keyboard.js (bàn phím ảo) · os.js + apps.js (máy tính ảo) · keys.js (chế độ học)
src/ui/                    Giao diện chung kiểu Apple (apple.css, motion.js, story3d.js) · src/fonts: phông Inter
src/explore/                Khám phá phần cứng (hw-data.js: dữ liệu, hw-models.js: mô hình 3D)
src/office/
  office-common.js         Ribbon, menu, khung bài tập dùng chung
  formula.js               Bộ tính công thức Excel
  word.* / excel.* / powerpoint.*
  exercises-word.js        Bài tập Word      ← thêm/sửa bài tập ở đây
  exercises-excel.js       Bài tập Excel
  exercises-ppt.js         Bài tập PowerPoint
src/vendor/three/          Thư viện Three.js (đóng kèm để chạy offline)
build/icon.png             Biểu tượng ứng dụng
```

### Thêm bài tập mới
Mỗi bài tập là một đối tượng `{ id, title, intro, start, tasks: [{ text, hint, check(api) }] }`. Hàm `check` nhận `api` để đọc trạng thái tài liệu, ví dụ với Excel:

```js
{ text: 'Ô D10 tính tổng bằng hàm SUM', check: (a) => a.formula('D10').includes('SUM') && a.val('D10') === 502000 }
```

Tệp bài làm được lưu với đuôi `.thw` (Word), `.thx` (Excel), `.thp` (PowerPoint).
