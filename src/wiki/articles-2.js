// Nhóm bài: Internet, đám mây, tìm kiếm, công dân số
export default [
{
  id: 'dien-toan-dam-may', cat: 'internet', icon: '☁️', title: 'Điện toán đám mây',
  aliases: ['cloud', 'cloud computing', 'iaas', 'paas', 'saas', 'aws', 'azure', 'google cloud', 'trung tâm dữ liệu', 'data center'],
  summary: 'Dùng máy chủ, lưu trữ và phần mềm qua Internet thay vì cài đặt, cất giữ trên máy của mình.',
  infobox: { title: 'Điện toán đám mây', rows: [['Tiếng Anh', 'Cloud computing'], ['Mô hình dịch vụ', 'IaaS · PaaS · SaaS'], ['Mô hình triển khai', 'Công cộng · Riêng · Lai'], ['Nhà cung cấp lớn', 'AWS, Microsoft Azure, Google Cloud'], ['Ví dụ hằng ngày', 'Gmail, Google Drive, OneDrive, Canva']] },
  body: `
**Điện toán đám mây** (*cloud computing*) là việc sử dụng tài nguyên máy tính như máy chủ, bộ nhớ lưu trữ, cơ sở dữ liệu và phần mềm **thông qua Internet**, theo nhu cầu. Dùng bao nhiêu, trả bấy nhiêu, hoặc dùng miễn phí trong một giới hạn.

“Đám mây” không ở trên trời. Dữ liệu được lưu trong các **trung tâm dữ liệu** khổng lồ: những toà nhà chứa hàng nghìn máy chủ, có điện dự phòng, hệ thống làm mát và bảo vệ 24/7.

{{fig:cloud-flow|Khi em mở Google Drive, thiết bị gửi yêu cầu qua Internet tới máy chủ trong trung tâm dữ liệu.}}

## Cách hoạt động
1. Em dùng một **thiết bị bất kỳ** có Internet: máy tính, điện thoại, máy tính bảng.
2. Ứng dụng hoặc trình duyệt gửi yêu cầu (đã mã hoá) tới máy chủ của nhà cung cấp.
3. Máy chủ xử lý và lưu dữ liệu. Dữ liệu thường được **sao chép sang nhiều nơi** để không mất khi một máy hỏng.
4. Kết quả được gửi về và hiển thị trên thiết bị của em. Mọi thiết bị đăng nhập cùng tài khoản đều thấy dữ liệu giống nhau nhờ **đồng bộ**.

Công nghệ cốt lõi là **ảo hoá**: một máy chủ vật lý mạnh được chia thành nhiều *máy ảo*, mỗi máy ảo phục vụ một khách hàng khác nhau.

## Ba mô hình dịch vụ
{{fig:cloud-stack|Phần màu xanh dương là việc người dùng phải tự quản lý; phần màu xanh lá do nhà cung cấp lo.}}

| Mô hình | Em nhận được gì | Ví dụ |
| **IaaS** – Hạ tầng như một dịch vụ | Máy ảo, ổ lưu trữ, mạng; tự cài hệ điều hành và phần mềm | Amazon EC2, Azure Virtual Machines, Google Compute Engine |
| **PaaS** – Nền tảng như một dịch vụ | Môi trường để lập trình viên chạy ứng dụng, không lo máy chủ | Google App Engine, Azure App Service |
| **SaaS** – Phần mềm như một dịch vụ | Phần mềm hoàn chỉnh, dùng ngay trên trình duyệt | Gmail, Microsoft 365, Google Docs, Canva, Zoom |

Học sinh chủ yếu dùng **SaaS**; xem [[ung-dung-dam-may|Ứng dụng đám mây]].

## Mô hình triển khai
- **Đám mây công cộng:** dùng chung hạ tầng của nhà cung cấp lớn, rẻ và linh hoạt.
- **Đám mây riêng:** dành riêng cho một tổ chức như ngân hàng hay cơ quan nhà nước, an toàn và kiểm soát cao hơn.
- **Đám mây lai:** kết hợp hai loại trên.

## Thị trường
Theo Synergy Research Group, trong quý 1/2026 Amazon Web Services (AWS) chiếm khoảng 28% thị trường hạ tầng đám mây toàn cầu, Microsoft Azure khoảng 21% và Google Cloud khoảng 14%.

## Ưu điểm và hạn chế
| Ưu điểm | Hạn chế |
| Truy cập mọi lúc, mọi nơi, trên nhiều thiết bị | Cần Internet; mạng yếu thì làm việc khó khăn |
| Không cần máy mạnh, không lo cài đặt | Dữ liệu nằm trên máy chủ của công ty khác (vấn đề quyền riêng tư) |
| Tự động sao lưu, khó mất dữ liệu | Gói miễn phí có giới hạn dung lượng, nhiều dịch vụ thu phí hằng tháng |
| Làm việc nhóm cùng lúc trên một tệp | Tài khoản bị lộ mật khẩu thì mất toàn bộ dữ liệu |
| Mở rộng nhanh khi cần thêm tài nguyên | Phụ thuộc nhà cung cấp; dịch vụ có thể ngừng hoặc đổi chính sách |

> Mẹo: Bảo vệ tài khoản đám mây bằng mật khẩu mạnh và **xác thực hai lớp**; xem [[bao-mat-thiet-bi|Bảo mật thiết bị]].
`,
  related: ['ung-dung-dam-may', 'mang-may-tinh', 'bao-mat-thiet-bi'],
  quiz: [
    { q: 'Gmail và Google Docs thuộc mô hình dịch vụ đám mây nào?', o: ['IaaS', 'PaaS', 'SaaS', 'LAN'], a: 2, e: 'SaaS: phần mềm hoàn chỉnh dùng qua trình duyệt.' },
    { q: 'Dữ liệu “trên đám mây” thực chất được lưu ở đâu?', o: ['Trong các đám mây trên trời', 'Trong máy chủ ở các trung tâm dữ liệu', 'Chỉ trong điện thoại của em', 'Trong vệ tinh'], a: 1, e: 'Đám mây là các trung tâm dữ liệu có hàng nghìn máy chủ.' },
    { q: 'Hạn chế lớn của điện toán đám mây là gì?', o: ['Không thể chia sẻ tệp', 'Cần có kết nối Internet', 'Chỉ dùng được trên Windows', 'Không thể làm việc nhóm'], a: 1, e: 'Không có mạng thì khó truy cập (trừ khi bật chế độ ngoại tuyến).' },
    { q: 'Công nghệ chia một máy chủ thành nhiều máy ảo gọi là:', o: ['Ảo hoá', 'Nén dữ liệu', 'Mã hoá', 'Định tuyến'], a: 0, e: 'Ảo hoá (virtualization) là nền tảng của đám mây.' },
  ],
},
{
  id: 'ung-dung-dam-may', cat: 'internet', icon: '📂', title: 'Ứng dụng đám mây',
  aliases: ['google drive', 'onedrive', 'icloud', 'dropbox', 'google docs', 'microsoft 365', 'canva', 'chia sẻ tệp', 'đồng bộ', 'sync', 'quyền chia sẻ'],
  summary: 'Lưu trữ, đồng bộ, soạn thảo cùng nhau và chia sẻ an toàn với Google Drive, OneDrive, Microsoft 365…',
  infobox: { title: 'Gói miễn phí phổ biến', rows: [['Google Drive', '15 GB dùng chung Gmail, Photos'], ['OneDrive', '5 GB'], ['iCloud', '5 GB'], ['Ghi chú', 'Dung lượng có thể thay đổi theo chính sách']] },
  body: `
**Ứng dụng đám mây** là phần mềm chạy và lưu dữ liệu trên [[dien-toan-dam-may|đám mây]]. Em chỉ cần trình duyệt hoặc một ứng dụng nhỏ, đăng nhập tài khoản là làm việc được ở bất cứ đâu.

## Các nhóm ứng dụng thường gặp
| Nhóm | Ví dụ | Dùng để |
| Lưu trữ và đồng bộ | Google Drive, OneDrive, iCloud Drive, Dropbox | Cất tệp, sao lưu ảnh, truy cập trên mọi thiết bị |
| Văn phòng trực tuyến | Google Docs/Sheets/Slides, Microsoft 365 (Word, Excel, PowerPoint trên web) | Soạn thảo, tính toán, trình chiếu; nhiều người sửa cùng lúc |
| Thư điện tử và lịch | Gmail, Outlook.com, Google Calendar | Liên lạc, lên lịch học |
| Học tập | Google Classroom, Microsoft Teams, Quizizz | Nộp bài, học trực tuyến, kiểm tra |
| Thiết kế | Canva, Figma | Làm poster, slide, thiết kế giao diện |
| Họp trực tuyến | Google Meet, Zoom, Teams | Gọi video, chia sẻ màn hình |

## Đồng bộ là gì?
{{fig:sync|Mọi thiết bị đăng nhập cùng tài khoản đều thấy bản mới nhất.}}

**Đồng bộ** (*sync*) là tự động giữ cho các bản sao của một tệp giống nhau trên mọi thiết bị. Em sửa tệp trên máy ở trường, về nhà mở điện thoại vẫn thấy bản mới nhất. Ứng dụng đồng bộ thường hiện các trạng thái:
- ✅ đã đồng bộ;
- 🔄 đang đồng bộ;
- ☁️ chỉ có trên đám mây, sẽ tải về khi mở;
- ❌ lỗi đồng bộ, thường do hết dung lượng hoặc mất mạng.

## Chia sẻ và phân quyền
{{fig:share-dialog|Hộp thoại chia sẻ (mô phỏng): mỗi người có một vai trò.}}

Khi chia sẻ một tệp, em chọn **ai** được truy cập và **được làm gì**:
- **Người xem** (*Viewer*): chỉ đọc.
- **Người nhận xét** (*Commenter*): đọc và góp ý, không sửa nội dung.
- **Người chỉnh sửa** (*Editor*): sửa trực tiếp.

Phạm vi chia sẻ gồm: *chỉ những người được mời*, *mọi người trong trường hoặc tổ chức*, hoặc *bất kỳ ai có đường liên kết*.

> Cẩn thận: Chế độ “**Bất kỳ ai có đường liên kết**” rất tiện nhưng đường link có thể bị chuyển tiếp cho người lạ. Đừng dùng chế độ này cho tài liệu có thông tin cá nhân.

## Làm việc nhóm hiệu quả
- **Sửa cùng lúc:** mỗi người hiện một con trỏ màu khác nhau.
- **Nhận xét và @nhắc tên** để giao việc: gõ @ rồi chọn tên bạn.
- **Lịch sử phiên bản:** xem ai sửa gì và khôi phục bản cũ khi lỡ xoá. Google Docs: *Tệp → Lịch sử phiên bản*; Word trên web: *Tệp → Thông tin → Lịch sử phiên bản*.
- **Chế độ đề xuất** (*Suggesting*) hoặc **Theo dõi thay đổi** (*Track Changes*): sửa nhưng chờ chủ tài liệu duyệt.

## Mẹo dùng an toàn
- Đặt tên tệp, thư mục rõ ràng, ví dụ \`Toan_Lop7A_BaiTapNhom3.docx\`.
- Kiểm tra dung lượng còn trống; dọn thùng rác của Drive vì tệp trong đó vẫn chiếm chỗ.
- Bật **xác thực hai lớp** cho tài khoản.
- **Đăng xuất** khi dùng máy công cộng hoặc máy ở phòng tin.
`,
  related: ['dien-toan-dam-may', 'bao-mat-thiet-bi', 'so-huu-tri-tue'],
  quiz: [
    { q: 'Em muốn bạn chỉ được góp ý, không được sửa tài liệu. Em chọn quyền nào?', o: ['Người chỉnh sửa', 'Người nhận xét', 'Chủ sở hữu', 'Bất kỳ ai có liên kết'], a: 1, e: 'Commenter: đọc và nhận xét, không sửa được nội dung.' },
    { q: 'Lỡ xoá mất một đoạn trong Google Docs đã lưu từ hôm qua, em dùng tính năng nào?', o: ['Lịch sử phiên bản', 'Kiểm tra chính tả', 'In tài liệu', 'Đổi phông chữ'], a: 0, e: 'Lịch sử phiên bản cho phép khôi phục bản cũ.' },
    { q: 'Đồng bộ (sync) nghĩa là:', o: ['Xoá tệp cũ', 'Giữ các bản sao giống nhau trên mọi thiết bị', 'Nén tệp cho nhỏ', 'Đổi tên tệp'], a: 1, e: 'Sửa ở một nơi, nơi khác tự cập nhật.' },
  ],
},
{
  id: 'trinh-duyet', cat: 'internet', icon: '🧭', title: 'Trình duyệt web',
  aliases: ['browser', 'chrome', 'safari', 'edge', 'firefox', 'opera', 'cốc cốc', 'brave', 'samsung internet', 'tab ẩn danh', 'cookie', 'bộ nhớ đệm', 'cache'],
  summary: 'Các trình duyệt phổ biến trên thế giới, nhân hiển thị, thị phần, ưu nhược điểm và tính năng cần biết.',
  infobox: { title: 'Thị phần (StatCounter, 7/2026)', rows: [['Chrome', '68,2%'], ['Safari', '16,5%'], ['Edge', '5,4%'], ['Firefox', '3,3%'], ['Samsung Internet', '2,1%'], ['Opera', '1,9%']] },
  body: `
**Trình duyệt web** (*web browser*) là phần mềm dùng để truy cập và hiển thị trang web. Nó tải mã HTML, CSS, JavaScript từ máy chủ rồi “vẽ” thành trang em nhìn thấy; xem [[mang-may-tinh|Mạng máy tính và Internet]].

## Nhân trình duyệt
{{fig:browser-anatomy|Các thành phần chính của cửa sổ trình duyệt (mô phỏng).}}

Bên trong mỗi trình duyệt có một **nhân hiển thị** (*rendering engine*) quyết định cách trang web được vẽ. Hiện nay có 3 nhân chính:
- **Blink:** Chrome, Edge, Opera, Brave, Cốc Cốc, Samsung Internet.
- **WebKit:** Safari.
- **Gecko:** Firefox.

Vì nhiều trình duyệt dùng chung nhân Blink, một trang web thường hiển thị gần giống nhau trên chúng.

## Thị phần toàn cầu
{{fig:browser-share|Thị phần trình duyệt trên mọi thiết bị, tháng 7/2026 (nguồn: StatCounter).}}

Riêng trên máy tính để bàn, Edge đứng thứ hai với khoảng 11%, vì được cài sẵn trên Windows.

## So sánh các trình duyệt phổ biến
| Trình duyệt | Hãng | Ưu điểm | Nhược điểm |
| **Google Chrome** | Google | Nhanh, kho tiện ích lớn nhất, đồng bộ tốt với tài khoản Google, có trên mọi nền tảng | Tốn RAM; thu thập nhiều dữ liệu cho quảng cáo |
| **Safari** | Apple | Tiết kiệm pin trên máy Apple, chú trọng quyền riêng tư, đồng bộ iCloud | Chỉ có trên thiết bị Apple; ít tiện ích |
| **Microsoft Edge** | Microsoft | Cài sẵn trên Windows, có chế độ tiết kiệm tài nguyên, đọc to văn bản, tích hợp Copilot, dùng được tiện ích của Chrome | Hay nhắc dùng dịch vụ Microsoft; nhiều tính năng gây rối |
| **Mozilla Firefox** | Mozilla (phi lợi nhuận) | Mã nguồn mở, chặn theo dõi mạnh, tuỳ biến cao | Thị phần nhỏ, đôi khi web chưa tối ưu cho Firefox |
| **Opera / Opera GX** | Opera | VPN miễn phí tích hợp, chặn quảng cáo; bản GX cho game thủ | Nhiều tính năng phụ, quảng cáo dịch vụ |
| **Brave** | Brave Software | Chặn quảng cáo và trình theo dõi mặc định, nhanh | Một số trang lỗi do bị chặn; tích hợp tiền mã hoá gây tranh cãi |
| **Cốc Cốc** | Công ty Việt Nam | Tối ưu cho tiếng Việt: sửa lỗi chính tả, từ điển, tải video | Chủ yếu dùng ở Việt Nam; nhiều quảng cáo |
| **Samsung Internet** | Samsung | Cài sẵn trên điện thoại Samsung, chặn quảng cáo | Chủ yếu trên Android |

> Không có trình duyệt “tốt nhất” cho mọi người. Hãy chọn theo thiết bị, nhu cầu bảo mật và thói quen; quan trọng nhất là **luôn cập nhật** bản mới.

## Tính năng cần biết
| Tính năng | Ý nghĩa | Phím tắt (Windows) |
| Tab mới / đóng tab | Mở nhiều trang cùng lúc | Ctrl + T / Ctrl + W |
| Mở lại tab vừa đóng | Lỡ tay đóng nhầm | Ctrl + Shift + T |
| **Cửa sổ ẩn danh** | Không lưu lịch sử, cookie *trên máy này* sau khi đóng | Ctrl + Shift + N (Chrome/Edge), Ctrl + Shift + P (Firefox) |
| Dấu trang (bookmark) | Lưu trang hay dùng | Ctrl + D |
| Lịch sử | Xem lại trang đã vào | Ctrl + H |
| Tải xuống | Xem tệp đã tải | Ctrl + J |
| Tìm trong trang | Tìm từ khoá trên trang đang mở | Ctrl + F |
| Phóng to / thu nhỏ | Đọc chữ dễ hơn | Ctrl + (+) / Ctrl + (−) |

## Cookie, bộ nhớ đệm và chế độ ẩn danh
- **Cookie:** tệp nhỏ trang web lưu trên máy để nhớ đăng nhập, giỏ hàng; cũng dùng để theo dõi quảng cáo.
- **Bộ nhớ đệm** (*cache*): lưu tạm hình ảnh, tệp của trang để lần sau tải nhanh hơn. Trang hiển thị lỗi thì thử xoá cache (Ctrl + Shift + Delete).
- **Ẩn danh không phải vô hình:** nhà trường, nhà mạng và trang web vẫn có thể biết em truy cập gì. Ẩn danh chỉ không lưu dấu vết **trên máy em đang dùng**; xem [[danh-tinh-so|Danh tính kỹ thuật số]].

## Dùng trình duyệt an toàn
- Chỉ cài **tiện ích mở rộng** từ cửa hàng chính thức và thật sự cần thiết.
- Không bấm “Cho phép thông báo” trên trang lạ.
- Để trình duyệt cảnh báo trang nguy hiểm (Google Safe Browsing, Microsoft SmartScreen).
- Dùng trình quản lý mật khẩu thay vì ghi mật khẩu ra giấy.
`,
  related: ['mang-may-tinh', 'tim-kiem', 'danh-tinh-so'],
  quiz: [
    { q: 'Trình duyệt phổ biến nhất thế giới hiện nay là:', o: ['Safari', 'Firefox', 'Google Chrome', 'Opera'], a: 2, e: 'Chrome chiếm khoảng 68% thị phần trên mọi thiết bị (StatCounter, 7/2026).' },
    { q: 'Chế độ ẩn danh giúp gì?', o: ['Không ai biết em truy cập trang nào', 'Không lưu lịch sử và cookie trên máy đang dùng', 'Chặn mọi virus', 'Tăng tốc Internet'], a: 1, e: 'Nhà mạng, nhà trường, trang web vẫn có thể ghi nhận.' },
    { q: 'Phím tắt mở lại tab vừa đóng nhầm:', o: ['Ctrl + T', 'Ctrl + W', 'Ctrl + Shift + T', 'Ctrl + D'], a: 2, e: 'Ctrl + Shift + T mở lại tab vừa đóng.' },
    { q: 'Firefox dùng nhân hiển thị nào?', o: ['Blink', 'WebKit', 'Gecko', 'Trident'], a: 2, e: 'Firefox dùng Gecko; Chrome/Edge dùng Blink; Safari dùng WebKit.' },
  ],
},
{
  id: 'tim-kiem', cat: 'internet', icon: '🔎', title: 'Tìm kiếm thông tin hiệu quả',
  aliases: ['toán tử tìm kiếm', 'search operators', 'google', 'site:', 'filetype:', 'từ khoá', 'thu hẹp tìm kiếm', 'đánh giá nguồn', 'crap test', 'tin giả'],
  summary: 'Chọn từ khoá, dùng toán tử tìm kiếm để thu hẹp kết quả và đánh giá độ tin cậy của nguồn.',
  infobox: { title: 'Toán tử hay dùng', rows: [['"…"', 'Đúng cụm từ'], ['-', 'Loại trừ từ'], ['site:', 'Trong một trang / tên miền'], ['filetype:', 'Đúng loại tệp'], ['OR', 'Hoặc'], ['intitle:', 'Có trong tiêu đề']] },
  body: `
Công cụ tìm kiếm (Google, Bing, Cốc Cốc…) trả về hàng triệu kết quả trong chưa đến một giây. Kỹ năng quan trọng không phải là *tìm được* mà là **tìm đúng** và **chọn được nguồn tin cậy**.

## Bước 1: Chọn từ khoá tốt
- Dùng **danh từ chính**, bỏ từ thừa. ❌ *làm thế nào để tôi có thể biết được thủ đô của nước Úc là gì* → ✅ *thủ đô Úc*.
- Thêm **ngữ cảnh**: lớp, môn, năm, địa điểm. Ví dụ: *nhiệt độ trung bình Hà Nội tháng 1*.
- Dùng **từ chuyên môn** nếu biết: *quang hợp* thay cho *cây làm ra thức ăn*.
- Thử **tiếng Anh** cho chủ đề công nghệ, khoa học; tài liệu thường nhiều hơn.

## Bước 2: Dùng toán tử để thu hẹp phạm vi
{{fig:search-mock|Kết hợp nhiều toán tử trong một lần tìm kiếm.}}

Toán tử là ký hiệu đặc biệt “ra lệnh” cho công cụ tìm kiếm.

| Toán tử | Tác dụng | Ví dụ |
| \`"…"\` | Tìm **đúng cụm từ**, đúng thứ tự | \`"có công mài sắt"\` |
| \`-\` | **Loại trừ** từ | \`jaguar -xe\` (tìm loài báo, bỏ hãng xe) |
| \`site:\` | Chỉ tìm trong **một trang** hoặc một loại tên miền | \`biến đổi khí hậu site:gov.vn\`, \`site:edu.vn\` |
| \`filetype:\` | Chỉ tìm **một loại tệp** | \`đề cương tin học 7 filetype:pdf\` |
| \`OR\` (viết hoa) | Tìm trang có **một trong các** từ | \`học bổng OR trao đổi sinh viên\` |
| \`intitle:\` | Từ khoá phải nằm trong **tiêu đề** | \`intitle:"hệ điều hành"\` |
| \`*\` | **Ký tự đại diện**, thay cho một từ chưa biết | \`"đi một ngày * học một sàng khôn"\` |
| \`define:\` | Tra **định nghĩa** | \`define:algorithm\` |
| \`a..b\` | Trong **khoảng số** | \`laptop học tập 10..15 triệu\` |

> Toán tử viết **liền** với từ khoá, không có dấu cách: viết \`site:edu.vn\`, không viết \`site: edu.vn\`. Có thể kết hợp nhiều toán tử: \`"trí tuệ nhân tạo" site:gov.vn filetype:pdf\`.

Một số toán tử có thể thay đổi theo thời gian. Ngoài ra, Google còn có **Công cụ tìm kiếm nâng cao** (google.com/advanced_search).

## Bước 3: Dùng bộ lọc có sẵn
- **Tab loại kết quả:** Tất cả, Hình ảnh, Tin tức, Video, Sách…
- **Công cụ → Thời gian:** giờ qua, 24 giờ qua, tuần qua… Rất quan trọng với tin tức và số liệu.
- **Hình ảnh → Công cụ → Quyền sử dụng:** lọc ảnh có giấy phép **Creative Commons** để dùng hợp pháp; xem [[giay-phep-cc|Giấy phép Creative Commons]].
- **Tìm bằng hình ảnh** (Google Lens): tìm nguồn gốc một bức ảnh, phát hiện ảnh bị cắt ghép.

## Bước 4: Đánh giá độ tin cậy của nguồn
Kiểm tra theo **5 câu hỏi** (dựa trên bộ tiêu chí *CRAAP* quen thuộc):

| Tiêu chí | Câu hỏi |
| **Mới** (Currency) | Đăng khi nào? Có còn đúng không? |
| **Liên quan** (Relevance) | Có trả lời đúng câu hỏi của em không? |
| **Tác giả** (Authority) | Ai viết? Có chuyên môn không? Tên miền \`.gov.vn\`, \`.edu.vn\` thường đáng tin hơn blog cá nhân |
| **Chính xác** (Accuracy) | Có dẫn nguồn không? Các nguồn khác có nói giống vậy không? |
| **Mục đích** (Purpose) | Viết để thông tin, để bán hàng hay để câu view, kích động? |

Dấu hiệu **tin giả**: tiêu đề giật gân, nhiều chữ in hoa và dấu chấm than; không có tác giả và ngày đăng; tên miền nhái (ví dụ \`vnexpres.net\`); kêu gọi “chia sẻ ngay trước khi bị xoá”.

> Kiểm tra chéo: một thông tin quan trọng nên được xác nhận bởi **ít nhất 2–3 nguồn độc lập, uy tín**. Câu trả lời của AI cũng cần kiểm tra như vậy; xem [[ai-hoc-tap|Dùng AI trong học tập]].

## Kết quả được tài trợ
Các kết quả có nhãn **Được tài trợ** / **Sponsored** là quảng cáo, được trả tiền để xuất hiện ở đầu trang. Chúng không nhất thiết là kết quả tốt nhất.
`,
  related: ['trinh-duyet', 'giay-phep-cc', 'ai-hoc-tap'],
  quiz: [
    { q: 'Muốn chỉ tìm tài liệu PDF về “đề cương tin học 7”, em gõ:', o: ['đề cương tin học 7 pdf!', 'đề cương tin học 7 filetype:pdf', 'filetype đề cương', '"pdf" OR tin học'], a: 1, e: 'filetype:pdf giới hạn kết quả là tệp PDF.' },
    { q: 'Tìm thông tin chỉ trên các trang web chính phủ Việt Nam:', o: ['site:gov.vn', 'intitle:gov', '-gov.vn', 'define:gov'], a: 0, e: 'site:gov.vn chỉ tìm trong các tên miền .gov.vn.' },
    { q: 'Tìm loài báo Jaguar nhưng không muốn kết quả về hãng xe:', o: ['jaguar +xe', 'jaguar -xe', '"jaguar xe"', 'jaguar OR xe'], a: 1, e: 'Dấu trừ (-) loại bỏ từ khỏi kết quả.' },
    { q: 'Dấu hiệu nào cho thấy một bài viết có thể là tin giả?', o: ['Có tác giả và ngày đăng rõ ràng', 'Dẫn nguồn từ cơ quan chính thức', 'Tiêu đề giật gân, kêu gọi chia sẻ gấp', 'Đăng trên trang .edu.vn'], a: 2, e: 'Tin giả thường giật gân và thúc giục chia sẻ.' },
  ],
},
{
  id: 'danh-tinh-so', cat: 'cong-dan-so', icon: '🪪', title: 'Danh tính kỹ thuật số',
  aliases: ['digital identity', 'dấu chân số', 'digital footprint', 'quyền riêng tư', 'privacy', 'mạng xã hội', 'thông tin cá nhân', 'công dân số'],
  summary: 'Tất cả thông tin về em trên mạng tạo nên “em” trong thế giới số. Hãy xây dựng nó có chủ đích và bảo vệ nó.',
  infobox: { title: 'Ghi nhớ', rows: [['Dấu chân chủ động', 'Những gì em tự đăng'], ['Dấu chân bị động', 'Dữ liệu bị thu thập ngầm'], ['Nguyên tắc', 'Nghĩ trước khi đăng'], ['Không chia sẻ', 'Địa chỉ nhà, số điện thoại, mật khẩu, ảnh giấy tờ']] },
  body: `
**Danh tính kỹ thuật số** (*digital identity*) là tập hợp mọi thông tin gắn với một người trên môi trường số: tên tài khoản, ảnh đại diện, bài đăng, bình luận, lượt thích, lịch sử mua hàng, vị trí… Người khác, kể cả thầy cô, nhà tuyển dụng và trường đại học sau này, có thể dựa vào đó để đánh giá em.

{{fig:footprint|Những nguồn dữ liệu tạo nên danh tính số.}}

## Dấu chân số
Mỗi hoạt động trên mạng để lại một **dấu chân số** (*digital footprint*) và rất khó xoá hoàn toàn.
- **Dấu chân chủ động:** những gì em **tự chia sẻ**, như bài đăng, ảnh, video, bình luận, đánh giá sản phẩm.
- **Dấu chân bị động:** dữ liệu **bị thu thập** mà em không để ý, như địa chỉ IP, vị trí GPS, cookie, lịch sử xem video dùng để gợi ý quảng cáo.

> Ảnh chụp màn hình có thể lưu lại một bài đăng **mãi mãi**, kể cả khi em đã xoá hay đăng ở chế độ “tin 24 giờ”.

## Xây dựng danh tính số tích cực
- Dùng **tên tài khoản và ảnh đại diện phù hợp**; email học tập nên có dạng \`ho.ten@...\`.
- Chia sẻ thành tích, dự án, sản phẩm học tập em tự hào.
- Bình luận lịch sự, tôn trọng; không tham gia bắt nạt qua mạng.
- Ghi nguồn khi dùng tác phẩm của người khác; xem [[so-huu-tri-tue|Sở hữu trí tuệ]].
- Thử **tự tìm tên mình** trên Google để biết người khác thấy gì về em.

## Bảo vệ thông tin cá nhân
| Có thể chia sẻ có chọn lọc | **Không** nên chia sẻ công khai |
| Sở thích, thành tích học tập | Địa chỉ nhà, tên trường kèm lớp và lịch đi học |
| Ảnh hoạt động tập thể (khi bạn bè đồng ý) | Số điện thoại, ngày sinh đầy đủ |
| Ý kiến được trình bày tôn trọng | Mật khẩu, mã OTP, ảnh CCCD hay giấy tờ |
|  | Vị trí theo thời gian thực, ảnh có lộ biển số nhà |

**Thiết lập quyền riêng tư:**
- Đặt tài khoản mạng xã hội ở chế độ **riêng tư** hoặc chỉ bạn bè xem.
- Tắt **gắn thẻ vị trí** khi đăng ảnh.
- Kiểm tra quyền của ứng dụng: ứng dụng đèn pin không cần quyền truy cập danh bạ.
- Duyệt trước khi người khác gắn thẻ em.

## Danh tính và tài khoản
- Mỗi người có thể có nhiều tài khoản, nhưng chỉ nên dùng **một danh tính nhất quán, trung thực**.
- **Không mạo danh** người khác, không tạo tài khoản giả để trêu chọc. Hành vi này có thể vi phạm pháp luật.
- Bảo vệ tài khoản bằng mật khẩu mạnh và **xác thực hai lớp**; xem [[bao-mat-thiet-bi|Bảo mật thiết bị]].
- Khi không dùng nữa, hãy **xoá tài khoản** thay vì bỏ hoang.

## Khi gặp sự cố
Nếu bị mạo danh, bị lộ ảnh hoặc bị bắt nạt qua mạng:
1. **Không trả đũa.**
2. Chụp màn hình làm bằng chứng.
3. Dùng chức năng **Báo cáo** (Report) và **Chặn** (Block) của nền tảng.
4. Báo ngay cho cha mẹ hoặc thầy cô.
`,
  related: ['bao-mat-thiet-bi', 'so-huu-tri-tue', 'trinh-duyet'],
  quiz: [
    { q: 'Lịch sử xem video được nền tảng thu thập để gợi ý quảng cáo là dấu chân số loại nào?', o: ['Chủ động', 'Bị động', 'Không phải dấu chân số', 'Ngoại tuyến'], a: 1, e: 'Dữ liệu bị thu thập mà em không chủ động chia sẻ là dấu chân bị động.' },
    { q: 'Thông tin nào KHÔNG nên đăng công khai?', o: ['Giải thưởng em đạt được', 'Ảnh căn cước công dân', 'Sở thích đọc sách', 'Sản phẩm Scratch em làm'], a: 1, e: 'Ảnh giấy tờ tuỳ thân có thể bị lợi dụng để lừa đảo, mạo danh.' },
    { q: 'Bị bắt nạt qua mạng, việc nên làm đầu tiên là:', o: ['Đăng bài chửi lại', 'Chụp màn hình làm bằng chứng, báo cáo, chặn và báo người lớn', 'Xoá tài khoản của mình ngay', 'Im lặng chịu đựng'], a: 1, e: 'Giữ bằng chứng, báo cáo, chặn và nhờ người lớn hỗ trợ.' },
  ],
},
];
