// Nhóm bài: Máy tính & hệ điều hành
export default [
{
  id: 'he-dieu-hanh', cat: 'he-thong', icon: '🖥️', title: 'Hệ điều hành',
  aliases: ['operating system', 'OS', 'HĐH', 'windows', 'macos', 'linux', 'android', 'ios'],
  summary: 'Phần mềm nền tảng quản lý phần cứng và là “cầu nối” giữa người dùng, ứng dụng với máy tính.',
  infobox: { title: 'Hệ điều hành', rows: [['Tên tiếng Anh', 'Operating System (OS)'], ['Vai trò', 'Quản lý phần cứng, tệp, bộ nhớ, ứng dụng'], ['Máy tính', 'Windows, macOS, Linux, ChromeOS'], ['Điện thoại', 'Android, iOS'], ['Phổ biến nhất (mọi thiết bị)', 'Android'], ['Phổ biến nhất (máy tính)', 'Windows']] },
  body: `
**Hệ điều hành** (tiếng Anh: *operating system*, viết tắt **OS**) là phần mềm quan trọng nhất trên một thiết bị. Nó khởi động đầu tiên khi em bật máy, quản lý mọi phần cứng và tạo môi trường để các ứng dụng khác như Word, Chrome hay trò chơi có thể chạy.

Có thể hình dung hệ điều hành như **người quản lý toà nhà**: các ứng dụng là cư dân, còn phần cứng là điện, nước, thang máy. Cư dân không tự kéo dây điện mà nhờ người quản lý cấp cho.

{{fig:os-layers|Các lớp của một hệ thống máy tính: yêu cầu của người dùng đi qua ứng dụng, hệ điều hành rồi mới tới phần cứng.}}

## Chức năng chính
- **Quản lý tiến trình:** chia thời gian CPU cho nhiều chương trình chạy cùng lúc (đa nhiệm).
- **Quản lý bộ nhớ:** cấp phát RAM cho từng ứng dụng và thu hồi khi ứng dụng đóng.
- **Quản lý tệp và thư mục:** tổ chức dữ liệu trên ổ cứng theo cây thư mục; ví dụ hệ thống tệp NTFS (Windows), APFS (macOS), ext4 (Linux).
- **Quản lý thiết bị:** dùng *trình điều khiển* (driver) để làm việc với máy in, chuột, card đồ hoạ…
- **Giao diện người dùng:** giao diện đồ hoạ (GUI) với cửa sổ, biểu tượng; hoặc giao diện dòng lệnh (CLI) như Command Prompt, Terminal.
- **Bảo mật:** tài khoản người dùng, mật khẩu, phân quyền, tường lửa, cập nhật bảo mật.

## Các hệ điều hành phổ biến
{{fig:devices|Hệ điều hành có mặt trên mọi loại thiết bị, từ máy tính, điện thoại đến TV và ô tô.}}

| Hệ điều hành | Hãng phát triển | Thiết bị | Đặc điểm |
| Windows | Microsoft | Máy tính để bàn, laptop | Phổ biến nhất trên máy tính, nhiều phần mềm và trò chơi |
| macOS | Apple | Máy Mac | Giao diện đẹp, ổn định, chỉ chạy trên máy Apple |
| Linux (Ubuntu, Mint, Fedora…) | Cộng đồng mã nguồn mở | Máy tính, máy chủ | Miễn phí, tuỳ biến cao, chạy phần lớn máy chủ Internet |
| ChromeOS | Google | Chromebook | Nhẹ, làm việc chủ yếu trên trình duyệt và đám mây |
| Android | Google (dựa trên Linux) | Điện thoại, máy tính bảng | Hệ điều hành có nhiều người dùng nhất thế giới |
| iOS / iPadOS | Apple | iPhone, iPad | Kho ứng dụng kiểm duyệt chặt, cập nhật đồng loạt |

Theo số liệu StatCounter tháng 9/2026, tính trên mọi loại thiết bị, Android chiếm khoảng 42%, Windows khoảng 30% và iOS khoảng 19%.

## Phân loại
- **Theo giấy phép:** *độc quyền* (Windows, macOS, iOS) và *mã nguồn mở* (Linux, phần lõi của Android). Xem [[so-huu-tri-tue|Sở hữu trí tuệ và giấy phép phần mềm]].
- **Theo số người dùng:** đơn người dùng hoặc đa người dùng (nhiều tài khoản trên một máy).
- **Theo mục đích:** hệ điều hành cho máy cá nhân, máy chủ, thiết bị di động, thiết bị nhúng (TV, ô tô, đồng hồ thông minh).

## Phiên bản và cập nhật
Hệ điều hành được cập nhật thường xuyên để **vá lỗ hổng bảo mật** và thêm tính năng. Khi một phiên bản hết hạn hỗ trợ, máy vẫn chạy nhưng không còn nhận bản vá nên dễ bị tấn công. Ví dụ, Microsoft đã ngừng hỗ trợ Windows 10 từ ngày 14/10/2025.

> Mẹo: Trên Windows, nhấn **Windows + R**, gõ \`winver\` rồi Enter để xem phiên bản đang dùng. Trên máy Mac, chọn menu Apple → *Giới thiệu về máy Mac này*.

Muốn biết các hệ điều hành ra đời và thay đổi thế nào, xem [[lich-su-hdh|Lược sử hệ điều hành]].
`,
  related: ['lich-su-hdh', 'dat-lai-thiet-bi', 'bao-mat-thiet-bi'],
  quiz: [
    { q: 'Phần mềm nào khởi động đầu tiên và quản lý toàn bộ phần cứng?', o: ['Trình duyệt web', 'Hệ điều hành', 'Phần mềm diệt virus', 'Microsoft Word'], a: 1, e: 'Hệ điều hành là phần mềm nền tảng, chạy trước mọi ứng dụng khác.' },
    { q: 'Trình điều khiển (driver) dùng để làm gì?', o: ['Giúp hệ điều hành làm việc với một thiết bị phần cứng', 'Lái xe tự động', 'Tăng tốc Internet', 'Xoá virus'], a: 0, e: 'Driver là phần mềm nhỏ giúp hệ điều hành “nói chuyện” với máy in, card đồ hoạ…' },
    { q: 'Hệ điều hành nào là mã nguồn mở?', o: ['Windows 11', 'macOS', 'Linux', 'iOS'], a: 2, e: 'Linux được phát triển mở, ai cũng có thể xem và sửa mã nguồn.' },
    { q: 'Vì sao không nên dùng hệ điều hành đã hết hạn hỗ trợ?', o: ['Máy sẽ không bật được', 'Không còn nhận bản vá bảo mật nên dễ bị tấn công', 'Màn hình bị đen trắng', 'Không thể gõ tiếng Việt'], a: 1, e: 'Máy vẫn chạy, nhưng lỗ hổng mới phát hiện sẽ không được vá.' },
  ],
},
{
  id: 'lich-su-hdh', cat: 'he-thong', icon: '📜', title: 'Lược sử hệ điều hành',
  aliases: ['lịch sử', 'unix', 'ms-dos', 'windows 95', 'mac os x', 'linus torvalds'],
  summary: 'Hành trình hơn 50 năm từ những hệ thống dòng lệnh trên máy tính lớn đến giao diện cảm ứng trên điện thoại.',
  infobox: { title: 'Các mốc chính', rows: [['1969', 'UNIX ra đời ở Bell Labs'], ['1981', 'MS-DOS trên máy IBM PC'], ['1984', 'Macintosh – giao diện đồ hoạ phổ thông'], ['1991', 'Nhân Linux'], ['1995', 'Windows 95 và nút Start'], ['2007–2008', 'iPhone và Android'], ['2021', 'Windows 11']] },
  body: `
Những máy tính đầu tiên (thập niên 1940–1950) **không có hệ điều hành**: kỹ sư nạp từng chương trình bằng bìa đục lỗ hoặc công tắc. Hệ điều hành ra đời để tự động hoá việc này, rồi dần trở thành thứ chúng ta thấy mỗi ngày.

{{fig:os-timeline|Dòng thời gian một số hệ điều hành tiêu biểu.}}

## Thời kỳ máy tính lớn (1950–1970)
Các hệ thống *xử lý theo lô* (batch) cho phép xếp hàng nhiều công việc để máy tự chạy lần lượt. Sau đó xuất hiện hệ thống *chia sẻ thời gian*, cho nhiều người cùng dùng một máy tính lớn qua các thiết bị đầu cuối.

Năm **1969**, Ken Thompson và Dennis Ritchie tại Bell Labs (Mỹ) phát triển **UNIX**. UNIX được viết lại bằng ngôn ngữ C nên dễ chuyển sang máy khác. Nhiều ý tưởng của UNIX như cây thư mục, “mọi thứ là tệp”, kết hợp các lệnh nhỏ vẫn còn trong Linux và macOS ngày nay.

## Máy tính cá nhân và dòng lệnh (1980)
Năm **1981**, IBM ra mắt máy tính cá nhân IBM PC, chạy **MS-DOS** của Microsoft. Người dùng phải gõ lệnh như \`dir\`, \`copy\`, \`cd\` để làm việc. Đây là lý do cửa sổ *Command Prompt* trên Windows vẫn hiểu nhiều lệnh giống DOS.

## Cuộc cách mạng giao diện đồ hoạ (1984–1995)
- **1984:** Apple Macintosh đưa giao diện đồ hoạ với cửa sổ, biểu tượng và chuột đến người dùng phổ thông. Ý tưởng này bắt nguồn từ phòng thí nghiệm Xerox PARC.
- **1985:** Microsoft phát hành **Windows 1.0**, ban đầu chạy “bên trên” MS-DOS.
- **1995:** **Windows 95** giới thiệu nút **Start**, thanh Taskbar và hỗ trợ Internet, trở thành hiện tượng toàn cầu.

## Mã nguồn mở và Linux (1991)
Năm **1991**, sinh viên Phần Lan **Linus Torvalds** công bố nhân **Linux** và mời mọi người cùng phát triển. Kết hợp với các công cụ của dự án GNU, Linux trở thành hệ điều hành miễn phí, mã nguồn mở. Ngày nay Linux chạy hầu hết máy chủ web, siêu máy tính và là nền móng của Android.

## Thế kỷ 21: ổn định, an toàn và di động
- **2001:** Windows XP, hệ điều hành phổ thông đầu tiên của Microsoft dùng nhân NT ổn định; cùng năm Apple ra Mac OS X dựa trên UNIX.
- **2007:** iPhone ra mắt cùng iPhone OS (sau đổi tên **iOS**), mở ra kỷ nguyên điện thoại cảm ứng.
- **2008:** Điện thoại Android đầu tiên được bán; Android sau đó trở thành hệ điều hành có nhiều người dùng nhất thế giới.
- **2011:** Chromebook với ChromeOS, hệ điều hành “sống trên trình duyệt”.
- **2015:** Windows 10; **2021:** Windows 11 với thanh Taskbar căn giữa.
- **2025:** Apple đổi cách đặt tên theo năm (iOS 26, macOS 26); Microsoft ngừng hỗ trợ Windows 10 (14/10/2025).
- **2026:** Google phát hành Android 17 (6/2026).

## Xu hướng hiện nay
- **Trí tuệ nhân tạo tích hợp:** trợ lý AI có sẵn trong hệ điều hành; xem [[tri-tue-nhan-tao|Trí tuệ nhân tạo]].
- **Đồng bộ đám mây:** tài khoản, ảnh, tệp tự động đồng bộ giữa các thiết bị; xem [[dien-toan-dam-may|Điện toán đám mây]].
- **Bảo mật mặc định:** mã hoá ổ đĩa, đăng nhập bằng vân tay hoặc khuôn mặt, cập nhật tự động.
`,
  related: ['he-dieu-hanh', 'dien-toan-dam-may'],
  quiz: [
    { q: 'Hệ điều hành UNIX ra đời năm nào?', o: ['1959', '1969', '1985', '1991'], a: 1, e: 'UNIX được phát triển tại Bell Labs năm 1969.' },
    { q: 'Ai đã tạo ra nhân Linux năm 1991?', o: ['Bill Gates', 'Steve Jobs', 'Linus Torvalds', 'Dennis Ritchie'], a: 2, e: 'Linus Torvalds, khi đó là sinh viên ở Phần Lan.' },
    { q: 'Phiên bản Windows nào lần đầu có nút Start?', o: ['Windows 1.0', 'Windows 95', 'Windows XP', 'Windows 11'], a: 1, e: 'Windows 95 (1995) giới thiệu nút Start và Taskbar.' },
    { q: 'Android được xây dựng dựa trên nhân hệ điều hành nào?', o: ['Windows', 'Linux', 'macOS', 'MS-DOS'], a: 1, e: 'Android dùng nhân Linux.' },
  ],
},
{
  id: 'don-vi-bo-nho', cat: 'he-thong', icon: '📏', title: 'Đơn vị đo dung lượng bộ nhớ',
  aliases: ['bit', 'byte', 'kb', 'mb', 'gb', 'tb', 'kib', 'gib', 'dung lượng', 'ram', 'ổ cứng'],
  summary: 'Bit, byte, KB, MB, GB, TB… và vì sao ổ cứng 1 TB chỉ hiện khoảng 931 GB.',
  infobox: { title: 'Bảng quy đổi', rows: [['1 Byte', '8 bit'], ['1 KB', '1.024 Byte'], ['1 MB', '1.024 KB'], ['1 GB', '1.024 MB'], ['1 TB', '1.024 GB'], ['1 PB', '1.024 TB']] },
  body: `
Máy tính lưu mọi thứ (chữ, ảnh, nhạc, video) dưới dạng các con số **0 và 1**. Để biết một tệp “nặng” bao nhiêu hay một ổ cứng chứa được bao nhiêu, ta dùng các **đơn vị đo dung lượng**.

## Bit và Byte
- **Bit** (*binary digit*) là đơn vị nhỏ nhất, chỉ nhận một trong hai giá trị **0** hoặc **1**, giống công tắc tắt/bật.
- **Byte** gồm **8 bit**. Một byte biểu diễn được 2⁸ = 256 giá trị khác nhau, đủ để lưu một chữ cái tiếng Anh. Chữ tiếng Việt có dấu thường cần 2–3 byte (mã UTF-8).

> Phân biệt chữ viết tắt: **b** thường là *bit*, **B** hoa là *Byte*. Tốc độ mạng hay ghi bằng bit (100 Mbps = 100 megabit mỗi giây), còn dung lượng tệp ghi bằng Byte (100 MB). Vì 1 Byte = 8 bit, mạng 100 Mbps tải tối đa khoảng 12,5 MB mỗi giây.

## Các bậc đơn vị
{{fig:mem-ladder|Mỗi bậc lớn gấp 1.024 lần bậc trước. Các ví dụ là ước lượng.}}

| Đơn vị | Bằng | Ví dụ thực tế (ước lượng) |
| Kilobyte (KB) | 1.024 Byte | Một tệp văn bản ngắn |
| Megabyte (MB) | 1.024 KB | Một bức ảnh điện thoại 3–5 MB, một bài hát MP3 khoảng 4 MB |
| Gigabyte (GB) | 1.024 MB | Một bộ phim HD 2–4 GB; RAM máy tính 8–32 GB |
| Terabyte (TB) | 1.024 GB | Ổ cứng máy tính 1–2 TB |
| Petabyte (PB) | 1.024 TB | Dữ liệu của trung tâm dữ liệu lớn |

Sau PB còn có Exabyte (EB), Zettabyte (ZB) và Yottabyte (YB).

## Vì sao là 1.024 mà không phải 1.000?
Máy tính dùng hệ **nhị phân** (cơ số 2), và 2¹⁰ = 1.024 là luỹ thừa của 2 gần với 1.000 nhất. Tuy nhiên có **hai cách tính** đang cùng tồn tại:

| Cách tính | Ký hiệu | 1 “kilo” bằng | Ai dùng |
| Thập phân (SI) | KB, MB, GB, TB | 1.000 | Nhà sản xuất ổ cứng, USB, thẻ nhớ; macOS |
| Nhị phân (IEC) | KiB, MiB, GiB, TiB | 1.024 | Windows (nhưng vẫn ghi là KB, MB, GB); RAM |

## Vì sao ổ 1 TB chỉ hiện khoảng 931 GB?
{{fig:drive-931|Cùng một lượng dữ liệu, chỉ khác cách đếm.}}

Nhà sản xuất tính 1 TB = 1.000.000.000.000 byte. Windows lại chia cho 1.024 ba lần:

\`1.000.000.000.000 ÷ 1.024 ÷ 1.024 ÷ 1.024 ≈ 931 GB\`

Ổ cứng **không bị thiếu dung lượng**, chỉ là hai bên dùng hai cách đếm khác nhau. Ngoài ra hệ điều hành và phân vùng khôi phục cũng chiếm thêm một phần.

## Bộ nhớ trong và bộ nhớ ngoài
- **RAM** (bộ nhớ tạm): lưu dữ liệu đang dùng, mất khi tắt máy. RAM càng lớn, mở được càng nhiều chương trình cùng lúc.
- **Ổ lưu trữ** (HDD, SSD, USB, thẻ nhớ): lưu lâu dài, không mất khi tắt máy. Xem thêm phần [[loi-may-tinh|lỗi “ổ đĩa đầy”]].
- **Bộ nhớ đám mây**: lưu trên máy chủ qua Internet, ví dụ Google Drive, OneDrive; xem [[ung-dung-dam-may|Ứng dụng đám mây]].
`,
  related: ['loi-may-tinh', 'ung-dung-dam-may'],
  quiz: [
    { q: '1 Byte bằng bao nhiêu bit?', o: ['2', '8', '10', '1.024'], a: 1, e: '1 Byte = 8 bit.' },
    { q: 'Sắp xếp từ nhỏ đến lớn:', o: ['GB < MB < TB', 'KB < MB < GB < TB', 'MB < KB < GB', 'TB < GB < MB'], a: 1, e: 'KB → MB → GB → TB, mỗi bậc gấp 1.024 lần.' },
    { q: 'Mạng 100 Mbps tải tối đa khoảng bao nhiêu MB mỗi giây?', o: ['100 MB/s', '12,5 MB/s', '800 MB/s', '1 MB/s'], a: 1, e: 'Chia cho 8: 100 ÷ 8 = 12,5 MB/s.' },
    { q: 'Vì sao ổ cứng 1 TB chỉ hiện khoảng 931 GB trên Windows?', o: ['Ổ cứng bị lỗi', 'Nhà sản xuất tính 1.000, Windows tính 1.024', 'Virus chiếm dung lượng', 'Windows nén dữ liệu'], a: 1, e: 'Hai cách tính đơn vị khác nhau.' },
  ],
},
{
  id: 'loi-may-tinh', cat: 'he-thong', icon: '🛠️', title: 'Lỗi máy tính phổ biến và cách khắc phục',
  aliases: ['sửa lỗi', 'máy chậm', 'treo máy', 'màn hình xanh', 'không vào mạng', 'troubleshoot', 'khắc phục sự cố'],
  summary: 'Máy chậm, treo, không vào mạng, không in được, màn hình xanh… và quy trình xử lý từng bước.',
  infobox: { title: 'Quy tắc vàng', rows: [['Bước 1', 'Bình tĩnh, đọc thông báo lỗi'], ['Bước 2', 'Khởi động lại'], ['Bước 3', 'Kiểm tra dây, kết nối'], ['Bước 4', 'Tìm kiếm mã lỗi'], ['Bước 5', 'Hỏi thầy cô, kỹ thuật viên']] },
  body: `
Hầu hết sự cố máy tính hằng ngày đều có thể tự xử lý nếu làm **theo trình tự**: từ cách đơn giản, an toàn đến phức tạp. Kỹ thuật viên gọi quá trình này là **khắc phục sự cố** (*troubleshooting*).

## Quy trình 5 bước
{{fig:troubleshoot|Khắc phục sự cố: đi từ việc đơn giản, an toàn đến phức tạp.}}

1. **Xác định vấn đề:** chuyện gì xảy ra, từ khi nào, vừa làm gì trước đó? Chụp lại hoặc ghi lại **thông báo lỗi**.
2. **Thử cách đơn giản nhất:** khởi động lại ứng dụng, rồi khởi động lại máy. Cách này sửa được rất nhiều lỗi tạm thời.
3. **Kiểm tra phần cứng và kết nối:** dây nguồn, dây mạng, cáp màn hình, pin, Wi-Fi.
4. **Tìm kiếm thông tin:** gõ nguyên văn mã lỗi vào công cụ tìm kiếm, ưu tiên trang hỗ trợ chính thức; xem [[tim-kiem|Tìm kiếm thông tin hiệu quả]].
5. **Nhờ hỗ trợ:** nếu vẫn chưa được, báo thầy cô hoặc kỹ thuật viên, kèm mô tả và ảnh lỗi.

## Bảng lỗi thường gặp
| Hiện tượng | Nguyên nhân thường gặp | Cách khắc phục |
| Máy chạy chậm | Mở quá nhiều chương trình; ổ đĩa gần đầy; chương trình chạy ngầm khi khởi động; mã độc | Đóng bớt ứng dụng; mở **Task Manager** (Ctrl + Shift + Esc) để xem chương trình nào tốn tài nguyên; xoá tệp rác, gỡ phần mềm không dùng; tắt bớt chương trình khởi động cùng máy; quét virus |
| Ứng dụng bị treo (Not Responding) | Ứng dụng lỗi hoặc quá tải | Chờ ít giây; dùng Task Manager → **End task**; lần sau nhớ lưu bài thường xuyên (Ctrl + S) |
| Không vào được mạng | Wi-Fi bị tắt; sai mật khẩu; bộ phát lỗi | Kiểm tra biểu tượng Wi-Fi và chế độ máy bay; quên mạng rồi kết nối lại; khởi động lại modem/router; chạy *Network troubleshooter* |
| Không in được | Máy in tắt, hết giấy, kẹt giấy; chọn nhầm máy in; hàng đợi in bị kẹt | Kiểm tra nguồn, giấy, mực; chọn đúng máy in; xoá lệnh in bị kẹt trong hàng đợi; cài lại driver |
| Không có âm thanh | Tắt tiếng; chọn sai thiết bị phát | Kiểm tra biểu tượng loa, nút tắt tiếng; chọn đúng loa/tai nghe; cắm lại tai nghe |
| Màn hình đen nhưng máy vẫn chạy | Cáp lỏng; chọn sai cổng hình; độ sáng quá thấp | Kiểm tra cáp và nguồn màn hình; nhấn **Windows + P** chọn chế độ hiển thị; tăng độ sáng |
| Màn hình xanh (BSOD) | Lỗi driver, lỗi RAM hoặc ổ đĩa | Ghi lại mã dừng (stop code); khởi động lại; gỡ driver hoặc phần mềm vừa cài; báo kỹ thuật viên nếu lặp lại |
| “Ổ đĩa đầy” | Tệp lớn, thùng rác, tệp tạm | Dọn thùng rác; dùng *Disk Cleanup* / *Storage Sense*; chuyển ảnh, video lên đám mây hoặc ổ ngoài |
| Bàn phím gõ ra chữ sai | Bật Caps Lock hoặc Num Lock; sai bộ gõ; bộ gõ tiếng Việt đang bật | Kiểm tra đèn Caps Lock; đổi ngôn ngữ nhập (Windows + Space); tắt Unikey khi gõ tiếng Anh |
| Quên lưu, mất bài | Tắt ứng dụng hoặc mất điện | Mở lại Word/Excel và xem bảng *Document Recovery*; bật **AutoSave** khi lưu trên OneDrive |
| Pin laptop tụt nhanh | Màn hình quá sáng, nhiều ứng dụng nền, pin chai | Giảm độ sáng; bật chế độ tiết kiệm pin; kiểm tra tình trạng pin |

> Nhớ: **Không tự ý tháo máy** hoặc can thiệp phần cứng khi máy đang cắm điện. Phòng máy trường học thì hãy báo thầy cô.

## Phòng bệnh hơn chữa bệnh
- Cập nhật hệ điều hành và ứng dụng thường xuyên.
- **Sao lưu dữ liệu** theo quy tắc 3-2-1: 3 bản sao, trên 2 loại thiết bị, 1 bản ở nơi khác (ví dụ đám mây).
- Tắt máy đúng cách, không rút điện đột ngột.
- Không tải phần mềm lậu hoặc tệp không rõ nguồn; xem [[bao-mat-thiet-bi|Bảo mật thiết bị]].
- Nếu mọi cách đều thất bại, có thể [[dat-lai-thiet-bi|đặt lại thiết bị]] (nhớ sao lưu trước).
`,
  related: ['dat-lai-thiet-bi', 'bao-mat-thiet-bi', 'don-vi-bo-nho'],
  quiz: [
    { q: 'Ứng dụng bị treo, không phản hồi. Em nên dùng công cụ nào để đóng nó?', o: ['Control Panel', 'Task Manager', 'Paint', 'File Explorer'], a: 1, e: 'Mở Task Manager (Ctrl + Shift + Esc), chọn ứng dụng rồi nhấn End task.' },
    { q: 'Bước đầu tiên nên làm khi gặp lỗi là gì?', o: ['Cài lại Windows ngay', 'Xác định vấn đề và đọc thông báo lỗi', 'Tháo máy ra kiểm tra', 'Mua máy mới'], a: 1, e: 'Luôn xác định vấn đề trước, rồi thử từ cách đơn giản nhất.' },
    { q: 'Gõ chữ ra toàn chữ IN HOA, nguyên nhân có thể là:', o: ['Máy bị virus', 'Đang bật Caps Lock', 'Hết pin', 'Ổ cứng đầy'], a: 1, e: 'Kiểm tra đèn và phím Caps Lock.' },
    { q: 'Quy tắc sao lưu 3-2-1 nghĩa là gì?', o: ['3 bản sao, 2 loại thiết bị, 1 bản ở nơi khác', '3 ổ cứng, 2 máy tính, 1 USB', 'Sao lưu 3 lần mỗi 2 ngày', '3 mật khẩu, 2 tài khoản, 1 email'], a: 0, e: '3 bản sao – 2 loại thiết bị lưu trữ – 1 bản cất ở nơi khác.' },
  ],
},
{
  id: 'dat-lai-thiet-bi', cat: 'he-thong', icon: '🔄', title: 'Đặt lại thiết bị',
  aliases: ['reset', 'factory reset', 'khôi phục cài đặt gốc', 'restart', 'khởi động lại', 'cài lại win', 'reset this pc'],
  summary: 'Khởi động lại, đặt lại cài đặt, khôi phục cài đặt gốc: khác nhau thế nào và làm sao cho an toàn.',
  infobox: { title: 'Trước khi đặt lại', rows: [['Sao lưu', 'Ảnh, tài liệu, danh bạ'], ['Ghi nhớ', 'Tài khoản và mật khẩu'], ['Đăng xuất', 'Tài khoản Google / Apple / Microsoft'], ['Sạc pin', 'Trên 50% hoặc cắm sạc']] },
  body: `
**Đặt lại** (*reset*) là đưa thiết bị về một trạng thái trước đó để sửa lỗi, tăng tốc hoặc chuẩn bị bán, tặng máy. Có nhiều mức độ, từ nhẹ nhàng đến xoá sạch. Hãy luôn chọn **mức nhẹ nhất** có thể giải quyết vấn đề.

{{fig:reset-ladder|Bốn mức đặt lại, từ an toàn nhất đến mạnh nhất.}}

## Các mức đặt lại
- **Khởi động lại** (*restart*) xoá dữ liệu tạm trong RAM và tải lại hệ điều hành. Dữ liệu không bị mất. Đây là cách đầu tiên nên thử với hầu hết lỗi.
- **Khởi động lại cưỡng bức** (*hard reset*): khi máy đơ hoàn toàn, nhấn giữ nút nguồn khoảng 10 giây (máy tính, Android), hoặc dùng tổ hợp phím riêng của iPhone. Có thể mất phần bài chưa lưu.
- **Đặt lại cài đặt:** chỉ đưa một nhóm cài đặt về mặc định, ví dụ *đặt lại cài đặt mạng* khi Wi-Fi gặp lỗi. Tệp và ứng dụng vẫn còn.
- **Đặt lại máy, giữ tệp cá nhân:** cài lại hệ điều hành, xoá ứng dụng đã cài nhưng giữ tài liệu.
- **Khôi phục cài đặt gốc** (*factory reset*): xoá **toàn bộ** dữ liệu, ứng dụng và tài khoản, đưa máy về như lúc mới mua.

## Khi nào cần đặt lại?
- Máy lỗi liên tục, đã thử mọi cách trong bài [[loi-may-tinh|Lỗi máy tính phổ biến]] mà không được.
- Máy nhiễm mã độc nặng.
- **Trước khi bán, tặng hoặc trả máy** (bắt buộc khôi phục cài đặt gốc để bảo vệ [[danh-tinh-so|danh tính số]]).

## Cách thực hiện trên từng hệ điều hành
Tên mục có thể khác đôi chút tuỳ phiên bản.

| Thiết bị | Đường dẫn |
| Windows 11 | Settings → System → Recovery → **Reset this PC** → chọn *Keep my files* (giữ tệp) hoặc *Remove everything* (xoá hết) |
| macOS | System Settings → General → Transfer or Reset → **Erase All Content and Settings** |
| Android | Cài đặt → Hệ thống → Tuỳ chọn đặt lại → **Xoá mọi dữ liệu (đặt lại cài đặt gốc)** |
| iPhone / iPad | Cài đặt → Cài đặt chung → Chuyển hoặc đặt lại iPhone → **Xoá tất cả nội dung và cài đặt** |

## Checklist an toàn
1. **Sao lưu** dữ liệu quan trọng lên đám mây hoặc ổ ngoài; xem [[ung-dung-dam-may|Ứng dụng đám mây]].
2. Ghi nhớ mật khẩu tài khoản Google, Apple ID, Microsoft. Sau khi đặt lại, nhiều máy yêu cầu đăng nhập lại tài khoản cũ để chống trộm (*khoá kích hoạt*).
3. Khi bán hoặc tặng máy: **đăng xuất** tài khoản, tắt *Tìm thiết bị* (Find My), tháo thẻ SIM và thẻ nhớ.
4. Cắm sạc trong suốt quá trình. **Không tắt máy giữa chừng.**

> Cẩn thận: Khôi phục cài đặt gốc **không thể hoàn tác**. Ở phòng máy trường học, đây là việc của thầy cô hoặc kỹ thuật viên.
`,
  related: ['loi-may-tinh', 'bao-mat-thiet-bi', 'danh-tinh-so'],
  quiz: [
    { q: 'Cách nào nhẹ nhàng nhất, nên thử đầu tiên khi máy lỗi?', o: ['Khôi phục cài đặt gốc', 'Khởi động lại', 'Cài lại hệ điều hành', 'Format ổ cứng'], a: 1, e: 'Khởi động lại sửa được nhiều lỗi tạm thời mà không mất dữ liệu.' },
    { q: 'Trước khi bán điện thoại cũ, em cần làm gì?', o: ['Chỉ xoá ảnh', 'Sao lưu, đăng xuất tài khoản rồi khôi phục cài đặt gốc', 'Tắt máy là đủ', 'Đổi hình nền'], a: 1, e: 'Phải xoá sạch để người khác không truy cập được dữ liệu và tài khoản của em.' },
    { q: 'Wi-Fi trên điện thoại thường xuyên lỗi. Mức đặt lại phù hợp là:', o: ['Đặt lại cài đặt mạng', 'Khôi phục cài đặt gốc', 'Gỡ mọi ứng dụng', 'Thay màn hình'], a: 0, e: 'Chỉ cần đưa cài đặt mạng về mặc định, dữ liệu vẫn còn.' },
  ],
},
{
  id: 'mang-may-tinh', cat: 'internet', icon: '🌐', title: 'Mạng máy tính và Internet',
  aliases: ['internet', 'lan', 'wan', 'wifi', 'ip', 'dns', 'http', 'https', 'router', 'modem', 'url'],
  summary: 'Internet hoạt động thế nào khi em gõ một địa chỉ web: địa chỉ IP, DNS, HTTP và HTTPS.',
  infobox: { title: 'Thuật ngữ nhanh', rows: [['LAN', 'Mạng cục bộ (phòng máy, gia đình)'], ['WAN', 'Mạng diện rộng (Internet)'], ['IP', 'Địa chỉ của thiết bị trên mạng'], ['DNS', 'Đổi tên miền thành địa chỉ IP'], ['HTTPS', 'Truy cập web có mã hoá']] },
  body: `
**Mạng máy tính** là nhiều thiết bị được kết nối để trao đổi dữ liệu và dùng chung tài nguyên (máy in, Internet, tệp). **Internet** là mạng của các mạng, kết nối hàng tỉ thiết bị trên toàn thế giới.

## Các loại mạng
- **LAN** (mạng cục bộ): trong phạm vi nhỏ như phòng máy, nhà ở, văn phòng.
- **WAN** (mạng diện rộng): kết nối giữa các thành phố, quốc gia; Internet là WAN lớn nhất.
- **Có dây và không dây:** cáp mạng (Ethernet) ổn định, nhanh; **Wi-Fi** tiện lợi; dữ liệu di động 4G/5G dùng khi ra ngoài.

## Thiết bị mạng
- **Modem:** kết nối nhà em với nhà cung cấp Internet (Viettel, VNPT, FPT…).
- **Router (bộ định tuyến):** chia sẻ kết nối cho nhiều thiết bị và phát Wi-Fi. Nhiều gia đình dùng thiết bị kết hợp cả hai.
- **Switch:** nối nhiều máy tính bằng dây trong phòng máy.

## Điều gì xảy ra khi em gõ một địa chỉ web?
{{fig:net-dns|Hành trình của một yêu cầu truy cập trang web.}}

1. Em gõ **URL** (địa chỉ web), ví dụ \`https://vnexpress.net\`.
2. Máy hỏi **máy chủ DNS** để đổi *tên miền* thành **địa chỉ IP**. Có thể coi DNS như danh bạ điện thoại.
3. Trình duyệt gửi yêu cầu theo giao thức **HTTP/HTTPS** tới máy chủ có địa chỉ IP đó.
4. Máy chủ gửi về các tệp HTML, CSS, hình ảnh; trình duyệt ghép chúng lại thành trang web.

## Cấu tạo một URL
\`https://www.example.com/hoc-tap/bai-1?trang=2\`
- \`https\`: giao thức (có **S** là đã mã hoá, an toàn hơn).
- \`www.example.com\`: tên miền; phần đuôi như \`.com\`, \`.vn\`, \`.edu.vn\`, \`.gov.vn\` gợi ý loại tổ chức.
- \`/hoc-tap/bai-1\`: đường dẫn tới trang cụ thể.
- \`?trang=2\`: tham số.

> Biểu tượng ổ khoá hay **https** chỉ cho biết đường truyền được **mã hoá**, không đảm bảo trang đó đáng tin. Trang lừa đảo cũng có thể dùng https; xem [[bao-mat-thiet-bi|Bảo mật thiết bị]].

## Tốc độ mạng
Tốc độ đo bằng **bit mỗi giây** (Mbps, Gbps), khác với dung lượng tệp đo bằng Byte; xem [[don-vi-bo-nho|Đơn vị đo dung lượng]]. **Độ trễ** (ping, tính bằng mili giây) càng thấp thì chơi game trực tuyến, gọi video càng mượt.
`,
  related: ['trinh-duyet', 'dien-toan-dam-may', 'bao-mat-thiet-bi'],
  quiz: [
    { q: 'DNS có nhiệm vụ gì?', o: ['Diệt virus', 'Đổi tên miền thành địa chỉ IP', 'Tăng tốc Wi-Fi', 'Lưu mật khẩu'], a: 1, e: 'DNS giống như danh bạ: tra tên miền ra địa chỉ IP.' },
    { q: 'Mạng trong một phòng máy của trường gọi là:', o: ['WAN', 'LAN', 'DNS', 'URL'], a: 1, e: 'LAN là mạng cục bộ trong phạm vi nhỏ.' },
    { q: 'Chữ “S” trong HTTPS cho biết:', o: ['Trang web chắc chắn không lừa đảo', 'Dữ liệu truyền đi được mã hoá', 'Trang web tải nhanh hơn', 'Trang web của trường học'], a: 1, e: 'HTTPS mã hoá đường truyền nhưng không chứng minh trang đáng tin.' },
  ],
},
];
