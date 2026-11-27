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

### Cập nhật tự động (updater.js)
- Phần mềm tự kiểm tra GitHub Releases (xonpro147z/IT-Lab) khi mở, mỗi 3 giờ, hoặc khi bấm nút **⟳ Cập nhật** ở trang chủ / menu Tệp → Kiểm tra cập nhật.
- Windows (bản cài Setup) và Linux (.deb, AppImage): tự tải ngầm, thông báo "Khởi động lại & cập nhật"; nếu để sau thì cài khi tắt phần mềm.
- macOS và bản Portable: tự tải bộ cài mới vào thư mục Tải xuống, bấm "Mở bộ cài" để cài.
- Kiến thức Bách khoa: tải các bài .md trong thư mục content/wiki trên GitHub, không cần phát hành phiên bản mới. Xem content/wiki/HUONG-DAN.md.

### Bách khoa Tin học (src/wiki)
- Kho kiến thức kiểu Wikipedia, 17 bài trong 6 chủ đề: hệ điều hành và lược sử, đơn vị bộ nhớ, lỗi máy tính, đặt lại thiết bị, mạng và Internet, điện toán đám mây, ứng dụng đám mây, trình duyệt, toán tử tìm kiếm, danh tính số, sở hữu trí tuệ và giấy phép phần mềm, Creative Commons, bảo mật, biểu đồ, AI, dùng AI trong học tập.
- 49 ảnh thật và biểu tượng từ Wikimedia Commons (giấy phép CC hoặc phạm vi công cộng), ghi tác giả dưới ảnh và trong mục "Nguồn ảnh"; danh sách đầy đủ ở src/wiki/photos/CREDITS.md.
- Mục lục, hộp thông tin, liên kết nội bộ, hình minh hoạ SVG, tìm kiếm có/không dấu, câu hỏi kiểm tra cuối bài, theo dõi bài đã đọc.
- Thêm bài: thêm đối tượng vào src/wiki/articles-*.js (cú pháp ## tiêu đề, - danh sách, | bảng |, > ghi chú, [[id|liên kết]], {{fig:tên|chú thích}}).

### Luyện gõ phím (src/typing)
- Đo WPM, raw, độ chính xác, độ ổn định, biểu đồ theo giây – kiểu MonkeyType; lịch sử và kỷ lục lưu trên máy.
- Chế độ: thời gian (15/30/60/120 giây), số từ, trích dẫn, bài luyện hàng phím (cơ sở, trên, dưới, số, chữ hoa, dấu tiếng Việt).
- English và Tiếng Việt; bộ gõ Telex/VNI tích hợp (không cần Unikey) hoặc dùng bộ gõ của máy. Chấp nhận cả hai kiểu đặt dấu (hòa/hoà).
- Chú mèo gõ theo từng phím; 13 màu lông, mỗi màu một bộ keycap và âm thanh switch bàn phím cơ (tổng hợp bằng Web Audio).

### Phím tắt (src/keys)
- Máy tính ảo "TinHoc OS": cửa sổ kéo thả, thanh tác vụ, menu Start, Alt+Tab, Task View, màn hình khoá, chụp màn hình…
- Ứng dụng trong máy ảo: Ghi chú, Word, Excel, PowerPoint (có trình chiếu), File Explorer (có Thùng rác), trình duyệt nhiều thẻ, Task Manager, Cài đặt, Run.
- Bàn phím ảo sáng đèn theo phím thật; có thể nhấp chuột để bấm tổ hợp (dùng cho phím mà hệ điều hành thật giành trước như Win, Alt+Tab, Ctrl+Alt+Delete).
- 119 phím tắt chia 7 nhóm (shortcuts.js), kèm cách bấm trên macOS. Ba chế độ: Tra cứu, Luyện tập (từng bước, tự chuẩn bị tình huống), Kiểm tra (10 câu, lưu điểm).

### Office: hai khu riêng
- **Khu Office** (`src/office/index.html`): trang khởi động kiểu Microsoft 365, tạo tệp trống/mẫu, mở tệp gần đây. Word/Excel/PowerPoint dùng tự do với tab File đầy đủ (Info › Protect, Save As, Print, Share, Export, Options).
- **Khu Luyện tập** (`src/office/practice.html`): danh sách dự án chấm điểm (Word 12, Excel 8, PowerPoint 8). Mỗi dự án mở ứng dụng với `?ex=<id>`.
- Word: Styles (gallery, Modify Style, Create Style, Styles pane), Header/Footer (mẫu dựng sẵn, tab Header & Footer), Page Number (định dạng i/ii, Page X of Y), Table of Contents (Automatic 1/2, Custom, Update), Track Changes (Accept/Reject, Display for Review, Reviewing Pane), Compare/Combine, Restrict Editing.
- Excel: nhiều trang tính (đổi tên, màu tab, chèn/xoá, Move or Copy, ẩn/hiện), Lock Cell, Protect Sheet/Workbook, Macro (Record/Stop, Run, Ctrl+phím, VBA editor, cảnh báo .xlsm), tab Review và Developer.
- PowerPoint: Transition (Effect Options, Duration, Sound, Advance After), Animation (Entrance/Emphasis/Exit/Motion Path, Add Animation, Animation Pane, Start/Duration/Delay, Reorder), chèn Video/Audio (Stock hoặc tệp trên máy) + tab Playback, tab Picture Format (Picture Styles, Corrections, Color, Artistic Effects, Transparency, Crop, Crop to Shape, Size, Alt Text).
- Mã nguồn phần mở rộng: `pro-common.js`, `office-backstage.js`, `word-pro.js`, `excel-pro.js`, `ppt-pro.js`, `exercises-*-pro.js`, `pro.css`.

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
src/typing/                Luyện gõ: vn.js (Telex/VNI) · words.js · sound.js · cat.js · typing.js
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

## Ôn luyện IC3 GS6 (v1.10.0)

- **Học sinh**: mở *Ôn IC3*, nhập họ tên + lớp (trường không bắt buộc). 113 câu tự biên soạn (không phải đề IIG) cho Level 1 và Level 2, 7 chủ đề GS6; 6 dạng: một đáp án, nhiều đáp án, đúng/sai nhiều ý, kéo thả ghép nối, sắp thứ tự, bấm trên hình.
- Chế độ: Luyện tập (chấm ngay, combo), Kiểm tra theo chủ đề, Thi thử 35 câu/50 phút, Thử thách 60 giây, Ôn câu sai. Thang 0–1000, đạt từ 700.
- Trò chơi hoá: XP và cấp độ, chuỗi ngày học, 14 huy hiệu, bảng xếp hạng lớp (tuần / mọi lúc).
- **Giáo viên**: bấm *🔒 Giáo viên* → đặt mật khẩu lần đầu → bật *Nhận kết quả*. Máy học sinh cùng mạng LAN tự tìm thấy (UDP 47124, HTTP 47123). Nếu không tự tìm thấy, học sinh bấm nút kết nối và nhập IP hiển thị trên máy giáo viên.
  - Windows: lần đầu bật, chọn **Allow access** ở hộp thoại Tường lửa (Private networks).
  - Kết quả lọc theo lớp/cấp/bài/chế độ/ngày/điểm, xem chi tiết từng bài, xuất Excel (CSV UTF‑8), thống kê theo lớp, theo chủ đề, 15 câu hay sai nhất, học sinh đang online.
  - Học sinh làm khi chưa kết nối: kết quả được xếp hàng và tự gửi lại khi thấy máy giáo viên.

## v1.11.0 – Soạn đề, nhập PDF/Word, meme

- **Mật khẩu giáo viên**: đổi mật khẩu có thông báo rõ ràng; **mã khôi phục** (XXXX-XXXX) cấp khi tạo mật khẩu hoặc trong Cài đặt; màn khoá có “Quên mật khẩu?”.
- **Soạn đề** (khu giáo viên → 📝 Soạn đề): 6 dạng câu (một đáp án, nhiều đáp án, Đúng/Sai nhiều ý, ghép nối kéo thả, sắp xếp thứ tự, bấm vào hình với vùng tự khoanh). Mỗi câu chèn được ảnh/GIF/video: dán Ctrl+V, kéo thả từ trình duyệt, chọn tệp hoặc dán link. Tự lưu; xem thử như học sinh; bật “Phát cho học sinh”.
- **Nhập từ PDF / Word (.docx) / văn bản**: tự nhận dạng dạng câu và đáp án (dòng “Đáp án:”, chữ in đậm, gạch chân, tô màu, bảng đáp án cuối đề…), sau đó xem lại trước khi tạo đề. Mẫu: `src/ic3/mau/`.
- **Meme**: meme chung cho mọi bài luyện tập, meme riêng cho từng đề và từng câu (đúng/sai); meme cuối bài kiểm tra.
- Học sinh nhận đề qua LAN (ảnh/video tải về máy và lưu sẵn), mục “📚 Đề của thầy cô” trên trang chính; kết quả gửi về như bài IC3 (cấp độ “Đề GV”).

- v1.11.1: sửa lỗi không gõ được mật khẩu ở màn khoá giáo viên.

## v1.12.0 – Sửa ribbon, đề luyện tập song ngữ
- Ribbon Word/Excel/PowerPoint: ô Styles không còn chữ tràn/đè; tên tệp trên thanh tiêu đề không đè nút Undo/Redo; khi cửa sổ hẹp, các nhóm bên phải tự thu gọn thành một nút (bấm để mở) như Office thật; nhóm Paragraph có thêm Sort, Show/Hide ¶, Borders.
- Luyện tập Office: đề bài, gợi ý, tên dự án và khung làm bài có **Tiếng Việt / English** (đổi được cả khi đang làm). Tài liệu và cách chấm giữ nguyên.

- v1.12.1: đóng gói phông Roboto Mono (OFL) để chữ tiếng Việt có hai dấu (ế, ố, ồ…) hiển thị đúng trên Linux; vẽ lại tay mèo (liền thân, thon dần, đệm chân, bóng chạm phím); sửa lỗi phải bấm Space 2 lần khi dùng bộ gõ ibus/fcitx trên Linux.
- v1.12.2: tay mèo liền với thân (cùng lớp màu, bo tròn ở vai, viền mờ dần), bàn tay cùng màu với chỗ nó nằm.

### macOS: báo “TinHocLab bị hỏng và không thể mở”
Ứng dụng chưa được ký bởi tài khoản Apple Developer nên macOS chặn ứng dụng tải từ Internet. Sau khi kéo TinHocLab vào thư mục Applications, mở Terminal và chạy một lần:
```
xattr -cr /Applications/TinHocLab.app
```
Từ v1.12.2 ứng dụng được ký ad-hoc; nếu macOS báo “không thể xác minh nhà phát triển”, vào Cài đặt hệ thống › Quyền riêng tư & Bảo mật › bấm “Vẫn mở”.
