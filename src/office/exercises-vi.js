// Bản tiếng Việt của đề bài luyện tập Office (tên dự án, giới thiệu, nhiệm vụ, gợi ý).
// Tên lệnh giữ tiếng Anh như trên ribbon; chữ trong tài liệu giữ nguyên để học sinh dò đúng.
const EXERCISES_VI = {
  // ===================== WORD =====================
  w1: { title: 'Thư mời họp phụ huynh', intro: 'Định dạng ký tự và đoạn văn: phông chữ, cỡ chữ, màu chữ và căn lề.', tasks: [
    ['Định dạng đoạn <b>"PARENT-TEACHER MEETING INVITATION"</b>: <b>Bold</b> (in đậm), cỡ chữ <b>16 pt</b> và căn giữa (<b>Center</b>).', 'Bôi đen đoạn chữ, rồi dùng Bold, Font Size và Center trên thẻ Home.'],
    ['Đổi màu chữ của <b>"NGUYEN DU SECONDARY SCHOOL"</b> thành màu xanh dương (<b>Blue</b>).', 'Home > mũi tên Font Color > Standard Colors > Blue.'],
    ['Căn đều hai bên (<b>Justify</b>) cho đoạn văn bắt đầu bằng <b>"We are pleased to invite you"</b>.', null],
    ['Gạch chân (<b>Underline</b>) đoạn chữ <b>"7:30 AM, Sunday, December 14, 2026"</b>.', null],
    ['Đổi phông chữ của <b>toàn bộ văn bản</b> thành <b>Times New Roman</b>.', 'Nhấn Ctrl+A để chọn tất cả, rồi chọn phông chữ.'],
    ['Căn phải (<b>Align Right</b>) đoạn <b>"HOMEROOM TEACHER"</b> và in đậm (<b>Bold</b>).', null],
  ] },
  w2: { title: 'Trường em', intro: 'Dùng Styles có sẵn, danh sách gạch đầu dòng và giãn dòng.', tasks: [
    ['Áp dụng style <b>Title</b> cho đoạn <b>"Our School"</b>.', 'Bấm vào đoạn văn, rồi chọn Title trong bộ Styles.'],
    ['Áp dụng style <b>Heading 1</b> cho các đoạn "History", "Facilities" và "School Motto".', null],
    ['Chuyển bốn đoạn từ "Computer lab..." đến "Mini football field" thành <b>danh sách gạch đầu dòng</b> (Bullets).', null],
    ['Định dạng câu khẩu hiệu <b>"Learn to know, learn to do, learn to live together."</b>: in nghiêng (<b>Italic</b>), cỡ chữ <b>14 pt</b>.', null],
    ['Đặt giãn dòng <b>1.5</b> cho đoạn văn bắt đầu bằng "Our school was founded".', 'Home > Line and Paragraph Spacing.'],
  ] },
  w3: { title: 'Thời khoá biểu', intro: 'Chèn bảng, nhập dữ liệu và định dạng bảng.', tasks: [
    ['Tại đoạn trống ở cuối văn bản, chèn một bảng có <b>4 cột và 5 hàng</b>.', 'Insert > Table, rồi kéo chuột chọn 4x5.'],
    ['Ở hàng đầu tiên của bảng, nhập: <b>Period</b> | <b>Monday</b> | <b>Tuesday</b> | <b>Wednesday</b>.', null],
    ['Ở cột "Period", nhập <b>1, 2, 3, 4</b> vào bốn hàng tiếp theo.', null],
    ['Tô màu nền (<b>Shading</b>, màu bất kỳ) cho tất cả các ô ở hàng đầu tiên của bảng.', 'Bấm vào bảng > Table Layout > Shading, hoặc Header Row.'],
    ['Định dạng <b>"CLASS 7B TIMETABLE"</b>: màu đỏ (<b>Red</b>), cỡ chữ <b>18 pt</b> và căn giữa (<b>Center</b>).', null],
  ] },
  w4: { title: 'Bản tin Câu lạc bộ Tin học', intro: 'Thiết lập trang: hướng giấy, lề, chia cột, đầu trang và hình mờ.', tasks: [
    ['Đổi hướng giấy thành nằm ngang (<b>Landscape</b>).', null],
    ['Chọn lề hẹp (<b>Narrow</b>).', null],
    ['Chia văn bản thành <b>hai cột</b>.', null],
    ['Chèn <b>đầu trang</b> (Header) có nội dung <b>"Computer Club"</b>.', 'Insert > Header > Blank, rồi gõ nội dung.'],
    ['Thêm hình mờ (Watermark) <b>DRAFT</b>.', 'Design > Watermark.'],
  ] },
  w5: { title: 'Nội quy phòng máy', intro: 'Dùng Tìm và Thay thế, tô sáng chữ, đổi chữ hoa/thường, chỉ số trên và ký hiệu đặc biệt.', tasks: [
    ['Thay thế <b>tất cả</b> cụm từ <b>"computer room"</b> bằng <b>"computer lab"</b>.', 'Home > Replace (Ctrl+H).'],
    ['Tô sáng màu vàng (<b>Yellow</b> highlight) cho cụm từ <b>"central processing unit"</b>.', null],
    ['Chuyển <b>"important note"</b> thành <b>CHỮ IN HOA</b> (UPPERCASE).', 'Bôi đen đoạn chữ, rồi Home > Change Case > UPPERCASE.'],
    ['Định dạng số <b>2</b> trong <b>"60 m2"</b> thành chỉ số trên (<b>Superscript</b>) để được m².', null],
    ['Chèn ký hiệu <b>©</b> ngay sau chữ <b>"Copyright"</b> ở cuối văn bản.', 'Insert > Symbol.'],
  ] },
  w6: { title: 'Hướng dẫn đăng ký câu lạc bộ', intro: 'Chèn và đổi cỡ hình ảnh, thêm liên kết, danh sách đánh số và chân trang.', tasks: [
    ['Chèn <b>một hình ảnh</b> vào đoạn trống ở cuối văn bản (có thể dùng ảnh có sẵn – Stock Image).', 'Insert > Pictures.'],
    ['Đặt chiều rộng hình ảnh là <b>75%</b>.', 'Bấm vào hình > Picture Format > Width.'],
    ['Tạo <b>liên kết</b> (Hyperlink) cho cụm từ <b>"school website"</b> trỏ tới <b>https://school.edu</b>.', null],
    ['Chuyển bốn bước (từ "Open the registration page" đến "Click the Submit button") thành <b>danh sách đánh số</b> (Numbering).', null],
    ['Chèn <b>chân trang</b> (Footer) có nội dung <b>"Class 8A – Group 3"</b>.', null],
  ] },
  w7: { title: 'Báo cáo Khoa học', intro: 'Làm việc với đề mục, mục lục, chú thích cuối trang và số trang.', tasks: [
    ['Áp dụng style <b>Heading 1</b> cho "Evaporation", "Condensation" và "Precipitation".', null],
    ['Áp dụng style <b>Title</b> cho <b>"The Water Cycle"</b>.', null],
    ['Chèn <b>mục lục tự động</b> (Table of Contents) bên dưới tiêu đề. Mục lục phải có đủ ba đề mục.', 'References > Table of Contents > Automatic Table 1.'],
    ['Chèn <b>chú thích cuối trang</b> (Footnote) ở cuối câu nói về mây, nội dung <b>"Clouds can contain millions of droplets."</b>', 'References > Insert Footnote.'],
    ['Thêm <b>số trang</b> ở cuối trang (<b>Bottom of Page</b>).', null],
  ] },
  w8: { title: 'Quản lý và bảo vệ tệp', intro: 'Dùng thẻ File (Backstage): thuộc tính tài liệu, Lưu thành, xuất PDF, đặt mật khẩu và in.', skills: ['File › Info', 'Lưu thành (Save As)', 'Xuất PDF', 'Bảo vệ tài liệu', 'In'], tasks: [
    ['Đặt thuộc tính <b>Title</b> của tài liệu là <b>Science Club Report</b>.', 'File › Info › Properties › Title (bấm "Add a title").'],
    ['Lưu tài liệu vào thư mục <b>Documents</b> với tên tệp <b>Science Club Report</b>, định dạng <b>Word Document (*.docx)</b>.', 'File › Save As › Browse (hoặc nhấn F12).'],
    ['Xuất tài liệu thành tệp <b>PDF</b> ra <b>Desktop</b> với tên <b>Science Club Report</b>.', 'File › Export › Create PDF/XPS, chọn Desktop.'],
    ['Mã hoá tài liệu bằng mật khẩu <b>Club2026</b>.', 'File › Info › Protect Document › Encrypt with Password.'],
    ['In <b>2 bản</b>, hướng giấy nằm ngang (<b>Landscape Orientation</b>) trên máy in <b>HP LaserJet Pro (Computer Lab)</b>.', 'File › Print (Ctrl+P). Chọn máy in, số bản và hướng giấy, rồi bấm Print.'],
    ['<b>Đánh dấu tài liệu là bản cuối</b> (Mark as Final).', 'File › Info › Protect Document › Mark as Final.'],
  ] },
  w9: { title: 'Styles và Mục lục', intro: 'Áp dụng style có sẵn, sửa một style, rồi tạo và cập nhật mục lục tự động.', skills: ['Styles', 'Sửa Style', 'Mục lục', 'Cập nhật mục lục'], tasks: [
    ['Áp dụng style <b>Title</b> cho đoạn đầu tiên <b>"Computer Basics"</b>.', 'Home › Styles › Title.'],
    ['Áp dụng style <b>Heading 1</b> cho <b>Introduction</b>, <b>Hardware</b>, <b>Software</b> và <b>Conclusion</b>.', 'Bấm vào từng đoạn, rồi Home › Styles › Heading 1 (hoặc Ctrl+Alt+1).'],
    ['Áp dụng style <b>Heading 2</b> cho <b>Input Devices</b> và <b>Output Devices</b>.', null],
    ['Sửa style <b>Heading 1</b>: cỡ chữ <b>16 pt</b> và màu chữ đỏ (<b>Red</b>, sắc đỏ nào cũng được).', 'Chuột phải vào Heading 1 trong bộ Styles › Modify...'],
    ['Bấm vào đầu đoạn <b>Introduction</b> và chèn mục lục <b>Automatic Table 2</b> (tiêu đề "Table of Contents").', 'Bấm vào đầu đoạn "Introduction", References › Table of Contents › Automatic Table 2.'],
    ['Ở cuối văn bản, gõ thêm đoạn mới <b>References</b>, áp dụng <b>Heading 1</b>, rồi <b>cập nhật toàn bộ mục lục</b> (Update entire table).', 'References › Update Table › Update entire table.'],
  ] },
  w10: { title: 'Đầu trang, chân trang và số trang', intro: 'Làm việc với đầu trang, chân trang, số trang và thẻ ngữ cảnh Header & Footer.', skills: ['Đầu trang', 'Chân trang', 'Số trang', 'Thông tin tài liệu', 'Thẻ Header & Footer'], tasks: [
    ['Chèn đầu trang kiểu <b>Blank</b> và gõ <b>TinHoc School Newsletter</b> vào đó.', 'Insert › Header › Blank, rồi thay chữ [Type here].'],
    ['Chèn số trang ở cuối trang (<b>Bottom of Page</b>) kiểu <b>Plain Number 2</b> (căn giữa).', 'Insert › Page Number › Bottom of Page › Plain Number 2.'],
    ['Đổi định dạng số trang thành <b>i, ii, iii, …</b>', 'Page Number › Format Page Numbers...'],
    ['Trong chân trang, chèn trường <b>Author</b> (tác giả) từ Document Info.', 'Thẻ Header & Footer › Document Info › Author.'],
    ['Bật tuỳ chọn <b>Different First Page</b> (trang đầu khác).', 'Thẻ Header & Footer › Options.'],
    ['Đóng chế độ đầu/chân trang (<b>Close Header and Footer</b>).', null],
  ] },
  w11: { title: 'Theo dõi thay đổi và hạn chế chỉnh sửa', intro: 'Cô Lan đã xem thông báo câu lạc bộ của em. Hãy duyệt các chỉnh sửa của cô, tự sửa có theo dõi và bảo vệ tài liệu.', skills: ['Track Changes', 'Chấp nhận/Từ chối', 'Chế độ hiển thị', 'Hạn chế chỉnh sửa'], tasks: [
    ['Bật <b>Track Changes</b> (theo dõi thay đổi).', 'Review › Track Changes (Ctrl+Shift+E).'],
    ['Khi đang bật theo dõi, thay <b>Friday</b> bằng <b>Saturday</b>.', 'Bôi đen chữ "Friday" rồi gõ "Saturday".'],
    ['Chấp nhận (Accept) chữ <b>important</b> mà cô Lan đã chèn.', 'Bấm vào chữ được chèn, Review › Accept › Accept This Change.'],
    ['Từ chối (Reject) chữ <b>really</b> cô Lan chèn và việc cô xoá chữ <b>free</b>.', 'Review › Reject › Reject Change.'],
    ['Đổi chế độ hiển thị <b>Display for Review</b> thành <b>Simple Markup</b>.', null],
    ['Hạn chế chỉnh sửa, chỉ cho phép <b>Tracked changes</b>, với mật khẩu <b>Review1</b>.', 'Review › Restrict Editing › 2. Editing restrictions › Tracked changes › Yes, Start Enforcing Protection.'],
  ] },
  w12: { title: 'So sánh và gộp văn bản', intro: 'Ba phiên bản bài văn đã được lưu trong Documents: "Essay - Draft", "Essay - Teacher" và "Essay - Friend". Hãy gộp và so sánh chúng.', skills: ['Gộp (Combine)', 'So sánh (Compare)', 'Reviewing Pane', 'Chấp nhận tất cả', 'Lưu thành'], tasks: [
    ['<b>Gộp</b> (Combine) văn bản gốc <b>Essay - Draft</b> với văn bản đã sửa <b>Essay - Friend</b>.', 'Review › Compare › Combine...'],
    ['<b>So sánh</b> (Compare) văn bản gốc <b>Essay - Draft</b> với văn bản đã sửa <b>Essay - Teacher</b> (hiện thay đổi trong văn bản mới).', 'Review › Compare › Compare...'],
    ['Mở <b>Reviewing Pane</b> để xem danh sách các chỉnh sửa.', null],
    ['<b>Chấp nhận tất cả thay đổi</b> (Accept All Changes) trong văn bản so sánh.', null],
    ['Lưu kết quả vào <b>Documents</b> với tên <b>Essay - Final</b> (Word Document).', null],
  ] },

  // ===================== EXCEL =====================
  x1: { title: 'Bảng điểm học kì', intro: 'Dùng SUM, AVERAGE, MAX, MIN; định dạng số thập phân; gộp ô tiêu đề.', tasks: [
    ['Ở cột <b>Total</b> (F3:F12), nhập công thức cộng ba điểm của mỗi học sinh.', 'Gõ =SUM(C3:E3) vào F3, rồi kéo nút điền (fill handle) xuống F12.'],
    ['Ở cột <b>Average</b> (G3:G12), dùng hàm <b>AVERAGE</b> để tính điểm trung bình của mỗi học sinh.', null],
    ['Ở hàng <b>Highest</b> (C13:E13) dùng hàm MAX, ở hàng <b>Lowest</b> (C14:E14) dùng hàm MIN cho từng môn.', null],
    ['Định dạng cột <b>Average</b> (G3:G12) hiển thị <b>một chữ số thập phân</b>.', 'Chọn G3:G12, rồi dùng Increase Decimal / Decrease Decimal.'],
    ['Tô <b>màu nền</b> (màu bất kỳ) cho hàng tiêu đề cột A2:G2.', null],
    ['<b>Merge &amp; Center</b> (gộp và căn giữa) tiêu đề trên A1:G1, rồi in đậm (<b>Bold</b>) và cỡ chữ <b>16 pt</b>.', null],
  ] },
  x2: { title: 'Xếp loại học lực', intro: 'Dùng hàm IF lồng nhau, COUNTIF và định dạng có điều kiện.', tasks: [
    ['Ở cột <b>Rank</b> (D3:D12), dùng hàm <b>IF</b>: từ 8 trở lên là "Excellent", từ 6.5 trở lên là "Good", từ 5 trở lên là "Average", còn lại là "Weak".', '=IF(C3>=8,"Excellent",IF(C3>=6.5,"Good",IF(C3>=5,"Average","Weak")))'],
    ['Ở cột <b>Result</b> (E3:E12), hiện "Pass" nếu điểm trung bình từ 5 trở lên; ngược lại hiện "Fail".', null],
    ['Ở H3:H6, dùng hàm <b>COUNTIF</b> để đếm số học sinh theo từng loại ghi ở cột G.', '=COUNTIF($D$3:$D$12,G3)'],
    ['Dùng <b>Conditional Formatting</b> để tô nổi bật các ô điểm trung bình (C3:C12) <b>nhỏ hơn 5</b> (Less Than).', 'Chọn C3:C12 > Conditional Formatting > Less Than... > 5.'],
    ['<b>Merge &amp; Center</b> tiêu đề trên A1:E1.', null],
  ] },
  x3: { title: 'Hoá đơn bán hàng', intro: 'Tính thành tiền, tạm tính và thuế; định dạng tiền tệ và kẻ khung.', tasks: [
    ['Ở cột <b>Amount</b> (D4:D9), nhân Quantity (số lượng) với Unit Price (đơn giá).', null],
    ['Ở ô <b>D10</b>, dùng hàm SUM để tính Subtotal (tạm tính).', null],
    ['Ở ô <b>D11</b>, tính Tax (thuế) bằng 10% của Subtotal.', null],
    ['Ở ô <b>D12</b>, tính Total Due (tổng phải trả) = Subtotal + Tax.', null],
    ['Áp dụng định dạng số <b>Currency</b> hoặc <b>Accounting</b> cho C4:C9 và D4:D12.', null],
    ['Kẻ khung tất cả các ô (<b>All Borders</b>) cho vùng A3:D12.', null],
  ] },
  x4: { title: 'Tra cứu giá (VLOOKUP)', intro: 'Dùng VLOOKUP với địa chỉ tuyệt đối, và COUNTIF.', tasks: [
    ['Ở cột <b>Unit Price</b> (C4:C10), dùng hàm <b>VLOOKUP</b> để tra giá của từng Product Code trong bảng PRICE LIST (F4:G7).', '=VLOOKUP(A4,$F$4:$G$7,2,FALSE) – dùng địa chỉ tuyệt đối cho bảng giá.'],
    ['Ở cột <b>Amount</b> (D4:D10), nhân Quantity với Unit Price.', null],
    ['Ở ô <b>D12</b>, tính Total Revenue (tổng doanh thu).', null],
    ['Ở ô <b>D13</b>, dùng hàm <b>COUNTIF</b> để đếm số đơn hàng có số lượng lớn hơn 10.', '=COUNTIF(B4:B10,">10")'],
    ['Áp dụng định dạng số <b>Currency</b> hoặc <b>Accounting</b> cho D4:D10 và D12.', null],
  ] },
  x5: { title: 'Thi đua các lớp', intro: 'Địa chỉ tuyệt đối, định dạng phần trăm, hàm RANK, kẻ khung và độ rộng cột.', tasks: [
    ['Ở ô <b>C10</b>, tính tổng điểm của tất cả các lớp.', null],
    ['Ở cột <b>Share</b> (E4:E9), chia điểm của mỗi lớp cho Total ở C10. Dùng địa chỉ tuyệt đối <b>$C$10</b> để có thể kéo công thức xuống.', null],
    ['Áp dụng định dạng phần trăm (<b>Percentage</b>) cho E4:E9.', null],
    ['Ở cột <b>Rank</b> (D4:D9), dùng hàm <b>RANK</b> sao cho lớp nhiều điểm nhất xếp hạng 1.', '=RANK(C4,$C$4:$C$9)'],
    ['Merge &amp; Center A1:E1, và kẻ khung <b>All Borders</b> cho A3:E10.', null],
    ['Tăng độ rộng <b>cột B</b> lên ít nhất 110 điểm ảnh (pixel).', 'Kéo mép phải của tiêu đề cột B, hoặc Format > Column Width.'],
  ] },
  x6: { title: 'Sắp xếp và biểu đồ', intro: 'Tính tổng, sắp xếp dữ liệu, tạo biểu đồ cột và dùng cell styles.', tasks: [
    ['Ở ô <b>B11</b>, tính tổng số sách. Ở ô <b>B12</b>, tính số sách trung bình mỗi lớp.', null],
    ['<b>Sắp xếp</b> dữ liệu A3:B9 theo cột Books từ <b>lớn đến nhỏ</b>.', 'Chọn A3:B9 với ô hiện hành ở cột B, rồi Data > Sort Z to A.'],
    ['Chèn biểu đồ cột <b>Clustered Column</b> thể hiện số sách của mỗi lớp (A3:B9).', null],
    ['Đổi tiêu đề biểu đồ thành <b>"Books Read"</b> và hiện nhãn dữ liệu (<b>Data Labels</b>).', 'Chọn biểu đồ > Chart Design > Chart Title / Data Labels.'],
    ['Áp dụng cell style <b>Title</b> cho ô A1.', 'Home > Cell Styles > Title.'],
  ] },
  x7: { title: 'Trang tính và bảo vệ', intro: 'Sắp xếp các trang tính của sổ điểm và bảo vệ để tránh sửa nhầm.', skills: ['Đổi tên trang tính', 'Màu thẻ', 'Thêm/Xoá/Di chuyển trang tính', 'Bảo vệ trang tính', 'Bảo vệ sổ tính'], tasks: [
    ['Đổi tên <b>Sheet1</b> thành <b>Term 1</b>.', 'Bấm đúp vào thẻ trang tính, gõ tên mới rồi nhấn Enter.'],
    ['Đổi tên <b>Sheet2</b> thành <b>Term 2</b> và đổi màu thẻ thành xanh lá (<b>Green</b>).', 'Chuột phải vào thẻ › Tab Color › Standard Colors › Green.'],
    ['Xoá <b>Sheet3</b>.', null],
    ['Chèn trang tính mới tên <b>Summary</b> và di chuyển để nó là trang tính <b>đầu tiên</b>.', 'Bấm ⊕, đổi tên, rồi chuột phải › Move or Copy... › Before sheet: Term 1.'],
    ['Trên <b>Term 1</b>, mở khoá các ô điểm <b>C3:E7</b>, rồi <b>bảo vệ trang tính</b> (Protect Sheet) với mật khẩu <b>8A2026</b>.', 'Chọn C3:E7 › Home › Format › Lock Cell (tắt). Sau đó Review › Protect Sheet.'],
    ['<b>Bảo vệ cấu trúc sổ tính</b> (Protect Workbook) với mật khẩu <b>Book2026</b>.', 'Review › Protect Workbook.'],
    ['Lưu sổ tính vào <b>Documents</b> với tên <b>Class 8A Grades</b> (Excel Workbook *.xlsx).', null],
  ] },
  x8: { title: 'Ghi và chạy Macro', intro: 'Ghi một macro định dạng hàng tiêu đề thời khoá biểu và chạy nó cho tuần khác.', skills: ['Thẻ Developer', 'Ghi Macro', 'Chạy Macro', 'Visual Basic', 'Lưu .xlsm'], tasks: [
    ['Hiện thẻ <b>Developer</b> trên ribbon.', 'File › Options › Customize Ribbon › đánh dấu Developer.'],
    ['Trên <b>Week 1</b>, chọn <b>A1:D1</b>, rồi ghi macro tên <b>HeaderStyle</b> với phím tắt <b>Ctrl+q</b>: in đậm (<b>Bold</b>) và tô nền vàng (<b>Yellow</b>). Sau đó dừng ghi.', 'Developer › Record Macro (hoặc View › Macros). Bấm Bold + Fill Color › Yellow, rồi Stop Recording.'],
    ['Chuyển sang <b>Week 2</b> và <b>chạy</b> macro <b>HeaderStyle</b>.', 'Developer › Macros (Alt+F8) › Run, hoặc nhấn Ctrl+q.'],
    ['Mở trình soạn <b>Visual Basic</b> để xem mã macro.', 'Developer › Visual Basic (Alt+F11), hoặc Macros › Edit.'],
    ['Lưu sổ tính vào <b>Documents</b> với tên <b>Timetable Macro</b>, định dạng <b>Excel Macro-Enabled Workbook (*.xlsm)</b>.', null],
  ] },

  // ===================== POWERPOINT =====================
  p1: { title: 'Giới thiệu bản thân', intro: 'Tạo trang tiêu đề, thêm trang chiếu mới, nhập nội dung gạch đầu dòng và áp dụng chủ đề.', tasks: [
    ['Ở trang chiếu 1, nhập tiêu đề <b>"About Me"</b> và gõ <b>họ tên đầy đủ của em</b> vào ô phụ đề.', 'Bấm vào ô "Click to add title" rồi gõ.'],
    ['Thêm <b>trang chiếu mới</b> dùng bố cục <b>Title and Content</b>.', null],
    ['Ở trang chiếu 2, nhập tiêu đề <b>"My Hobbies"</b> và liệt kê <b>ít nhất ba</b> sở thích trong ô nội dung.', null],
    ['Thêm trang chiếu 3 có tiêu đề <b>"My Dream"</b>.', null],
    ['Áp dụng một <b>chủ đề</b> (Theme) bất kỳ khác chủ đề Office mặc định.', 'Design > Themes.'],
  ] },
  p2: { title: 'Trường em', intro: 'Chèn hình ảnh, hình vẽ và hộp văn bản; định dạng chữ.', tasks: [
    ['Ở trang chiếu 1, chèn <b>một hình ảnh</b> (có thể dùng ảnh có sẵn "School").', null],
    ['Ở trang chiếu 1, đổi màu chữ tiêu đề thành đỏ (<b>Red</b>) và in đậm (<b>Bold</b>).', 'Bấm vào viền ô tiêu đề để chọn, rồi bấm Bold và Font Color.'],
    ['Ở trang chiếu 2, chèn một <b>hình vẽ</b> (Shape) bất kỳ và gõ <b>"Computer Lab"</b> vào trong.', 'Insert > Shapes. Bấm đúp vào hình để gõ chữ.'],
    ['Đổi màu tô (<b>Shape Fill</b>) của hình vẽ ở trang chiếu 2 sang màu khác.', null],
    ['Ở trang chiếu 2, chèn một <b>hộp văn bản</b> (Text Box) có nội dung <b>"Welcome, everyone!"</b>.', null],
  ] },
  p3: { title: 'Vòng đời của bướm', intro: 'Áp dụng hiệu ứng chuyển trang, hiệu ứng động cho đối tượng rồi trình chiếu.', tasks: [
    ['Áp dụng hiệu ứng chuyển trang <b>Fade</b> cho trang chiếu 1.', null],
    ['Áp dụng một hiệu ứng chuyển trang (bất kỳ) cho <b>tất cả</b> các trang chiếu.', 'Transitions > chọn hiệu ứng > Apply To All.'],
    ['Ở trang chiếu 2, áp dụng hiệu ứng động <b>Fly In</b> cho tiêu đề.', 'Chọn ô tiêu đề > Animations > Fly In.'],
    ['Ở trang chiếu 3, áp dụng hiệu ứng động <b>Zoom</b> cho ô nội dung.', null],
    ['<b>Trình chiếu</b> từ đầu (F5).', null],
  ] },
  p4: { title: 'Hệ Mặt Trời', intro: 'Xoá, sắp xếp lại và nhân bản trang chiếu; đổi bố cục và thêm ghi chú cho người trình bày.', tasks: [
    ['<b>Xoá</b> trang chiếu có tiêu đề "DRAFT – DELETE THIS SLIDE".', null],
    ['<b>Sắp xếp lại</b> các trang chiếu theo thứ tự: The Solar System, Mercury, Venus, Earth.', 'Kéo các hình thu nhỏ, hoặc chuột phải vào hình thu nhỏ > Move Up / Move Down.'],
    ['Thêm ghi chú <b>"Earth is the only planet known to support life."</b> cho trang chiếu "Earth".', 'Gõ vào khung Notes bên dưới trang chiếu.'],
    ['Đổi bố cục của trang chiếu "Venus" thành <b>Two Content</b>.', null],
    ['<b>Nhân bản</b> (Duplicate) trang chiếu "The Solar System", chuyển bản sao xuống <b>cuối</b> bài và đổi tiêu đề thành <b>"Thank You"</b>.', null],
  ] },
  p5: { title: 'An toàn trên Internet', intro: 'Định dạng nền trang chiếu, cỡ chữ, màu chữ và chèn hình vẽ.', tasks: [
    ['Đổi <b>nền</b> của trang chiếu 1 (màu đơn hoặc chuyển sắc đều được).', 'Design > Format Background.'],
    ['Áp dụng nền đó cho <b>tất cả</b> các trang chiếu.', null],
    ['Đổi cỡ chữ tiêu đề trang chiếu 1 thành <b>54 pt</b>.', null],
    ['Đổi màu chữ tiêu đề trang chiếu 3 thành vàng (<b>Yellow</b>).', null],
    ['Ở trang chiếu 3, chèn hình <b>Star: 5 Points</b> (ngôi sao 5 cánh).', null],
  ] },
  p6: { title: 'Chuyển trang và hiệu ứng động', intro: 'Làm cho bài trình chiếu về tái chế thêm sinh động bằng hiệu ứng chuyển trang và hiệu ứng động.', skills: ['Chuyển trang', 'Effect Options', 'Thời lượng', 'Hiệu ứng động', 'Add Animation', 'Thời gian'], tasks: [
    ['Áp dụng hiệu ứng chuyển trang <b>Fade</b> cho <b>tất cả trang chiếu</b>.', 'Transitions › Fade › Apply To All.'],
    ['Đổi hiệu ứng chuyển trang của <b>trang chiếu 2</b> thành <b>Push</b> với tuỳ chọn <b>From Right</b>.', 'Chọn trang chiếu 2 › Transitions › Push › Effect Options › From Right.'],
    ['Đặt thời lượng chuyển trang (<b>Duration</b>) của trang chiếu 2 là <b>1.50</b> giây.', null],
    ['Ở trang chiếu 1, áp dụng hiệu ứng xuất hiện <b>Fly In</b> cho <b>tiêu đề</b> với tuỳ chọn <b>From Left</b>.', 'Chọn tiêu đề › Animations › Fly In › Effect Options › From Left.'],
    ['Áp dụng hiệu ứng xuất hiện <b>Zoom</b> cho <b>phụ đề</b> của trang chiếu 1. Đặt <b>Start: After Previous</b> và <b>Delay: 0.50</b>.', null],
    ['Dùng <b>Add Animation</b> để thêm hiệu ứng nhấn mạnh <b>Pulse</b> cho tiêu đề trang chiếu 1 (giữ nguyên Fly In).', 'Animations › Add Animation › Emphasis › Pulse.'],
    ['Đặt <b>trang chiếu 4</b> tự chuyển sau <b>5</b> giây (<b>After</b>).', 'Transitions › Timing › Advance Slide › After.'],
    ['Mở <b>Animation Pane</b> và trình chiếu từ đầu (<b>From Beginning</b>).', null],
  ] },
  p7: { title: 'Hình ảnh và video', intro: 'Chèn và chỉnh sửa hình ảnh, rồi chèn video và đặt tuỳ chọn phát.', skills: ['Chèn hình', 'Picture Styles', 'Corrections', 'Color', 'Artistic Effects', 'Cắt hình', 'Chèn video', 'Playback'], tasks: [
    ['Ở <b>trang chiếu 2</b>, chèn ảnh có sẵn <b>Computer</b>.', 'Insert › Pictures › Stock Images › Computer.'],
    ['Áp dụng kiểu ảnh <b>Drop Shadow Rectangle</b>.', 'Chọn ảnh › Picture Format › Picture Styles.'],
    ['Áp dụng chỉnh độ sáng <b>Brightness: +20% Contrast: +20%</b>.', 'Picture Format › Corrections.'],
    ['Đổi màu ảnh thành đen trắng (<b>Grayscale</b>).', 'Picture Format › Color › Recolor.'],
    ['Áp dụng hiệu ứng nghệ thuật <b>Pencil Sketch</b>.', 'Picture Format › Artistic Effects.'],
    ['Cắt ảnh theo hình <b>Circle</b> (hình tròn) và đặt chiều cao (<b>Height</b>) là <b>3"</b> (giữ tỉ lệ).', 'Picture Format › Crop › Crop to Shape; Size › Height.'],
    ['Ở <b>trang chiếu 3</b>, chèn video có sẵn <b>Ocean waves</b>.', 'Insert › Video › Stock Videos...'],
    ['Đặt video <b>Start: Automatically</b> (tự phát) và <b>Loop until Stopped</b> (lặp lại).', 'Chọn video › thẻ Playback.'],
  ] },
  p8: { title: 'Lưu, xuất và in', intro: 'Chuẩn bị bài trình chiếu cho hội chợ khoa học bằng thẻ File.', skills: ['Lưu thành', 'PowerPoint Show', 'Xuất PDF', 'In bản phát tay', 'Thuộc tính'], tasks: [
    ['Thêm thuộc tính <b>Tags</b> là <b>science, grade 8</b>.', 'File › Info › Properties › Tags.'],
    ['Lưu bài trình chiếu vào <b>Documents</b> với tên <b>Science Fair</b> (*.pptx).', null],
    ['Lưu một bản sao dạng <b>PowerPoint Show (*.ppsx)</b> ra <b>Desktop</b> với tên <b>Science Fair Show</b>.', 'File › Save As › Browse › Save as type.'],
    ['Xuất bài trình chiếu thành <b>PDF</b> ra <b>Desktop</b> với tên <b>Science Fair</b>.', null],
    ['In <b>2 bản</b> kiểu <b>3 Slides Handouts</b> (3 trang chiếu/tờ) ở chế độ <b>Grayscale</b>.', 'File › Print › Full Page Slides › 3 Slides Handouts; Color › Grayscale.'],
  ] },
};

// ---- Ngôn ngữ đề bài: 'vi' hoặc 'en' (lưu trên máy) ----
const OfficeLang = {
  get() { try { return localStorage.getItem('thl.office.lang') || 'vi'; } catch { return 'vi'; } },
  set(l) { try { localStorage.setItem('thl.office.lang', l); } catch {} },
  t(en, vi) { return this.get() === 'vi' ? vi : en; },
  // trả về bản sao bài tập đã dịch; giữ nguyên tài liệu (start) và hàm chấm (check)
  localize(list) {
    if (this.get() !== 'vi') return list;
    return list.map((ex) => {
      const v = EXERCISES_VI[ex.id]; if (!v) return ex;
      return { ...ex, title: v.title, intro: v.intro, skills: v.skills || ex.skills, tasks: ex.tasks.map((t, i) => (v.tasks[i] ? { ...t, text: v.tasks[i][0], hint: v.tasks[i][1] || t.hint } : t)) };
    });
  },
};
