// Nhóm bài: Công dân số, an toàn, dữ liệu và AI
export default [
{
  id: 'so-huu-tri-tue', cat: 'cong-dan-so', icon: '©️', title: 'Sở hữu trí tuệ và giấy phép phần mềm',
  aliases: ['bản quyền', 'copyright', 'nhãn hiệu', 'trademark', 'sáng chế', 'patent', 'phần mềm lậu', 'crack', 'mã nguồn mở', 'open source', 'freeware', 'shareware', 'eula', 'gpl', 'mit', 'public domain', 'phạm vi công cộng', 'đạo văn'],
  summary: 'Quyền tác giả, nhãn hiệu, sáng chế; các loại giấy phép phần mềm; vì sao không dùng phần mềm lậu.',
  infobox: { title: 'Ba loại quyền chính', rows: [['Quyền tác giả ©', 'Sách, nhạc, ảnh, phim, phần mềm'], ['Nhãn hiệu ™ ®', 'Tên, logo thương hiệu'], ['Sáng chế', 'Giải pháp kỹ thuật mới'], ['Tại Việt Nam', 'Luật Sở hữu trí tuệ']] },
  body: `
**Sở hữu trí tuệ** là quyền của con người đối với **sản phẩm trí óc** của mình: một bài hát, một bức ảnh, một phần mềm, một phát minh hay một thương hiệu. Pháp luật bảo vệ các quyền này để người sáng tạo được ghi nhận và hưởng lợi từ công sức của họ. Ở Việt Nam, lĩnh vực này được điều chỉnh bởi **Luật Sở hữu trí tuệ**.

## Các loại quyền sở hữu trí tuệ
{{fig:ip-types|Bốn loại quyền sở hữu trí tuệ thường gặp.}}

| Loại | Bảo vệ cái gì | Ví dụ | Ký hiệu |
| **Quyền tác giả** (bản quyền) | Cách thể hiện một tác phẩm: văn bản, âm nhạc, hình ảnh, phim, **chương trình máy tính** | Bộ phim hoạt hình, phần mềm Microsoft Word | © |
| **Nhãn hiệu** | Tên, logo, khẩu hiệu giúp phân biệt sản phẩm | Logo quả táo của Apple | ™ (đang dùng), ® (đã đăng ký) |
| **Sáng chế** | Giải pháp kỹ thuật mới, có tính sáng tạo | Một loại pin mới | Bằng sáng chế |
| **Kiểu dáng công nghiệp** | Hình dáng bên ngoài của sản phẩm | Kiểu dáng một chiếc xe máy | |
| **Bí mật kinh doanh** | Thông tin bí mật mang lại lợi thế | Công thức một loại nước giải khát | |

**Quyền tác giả phát sinh tự động** ngay khi tác phẩm được tạo ra và thể hiện dưới dạng nhất định, không cần đăng ký. Bức tranh em vẽ, đoạn code Scratch em viết đều thuộc quyền tác giả của em. Theo luật Việt Nam, với đa số loại tác phẩm, quyền này kéo dài suốt cuộc đời tác giả và **50 năm** sau khi tác giả mất. Sau thời gian đó, tác phẩm thuộc **phạm vi công cộng**, ai cũng được dùng.

## Giấy phép phần mềm
Khi “mua” phần mềm, thực ra em mua **giấy phép sử dụng**, chứ không mua bản quyền. Điều khoản nằm trong **Thoả thuận cấp phép người dùng cuối** (*EULA*) mà em bấm “Tôi đồng ý” khi cài đặt.

| Loại | Đặc điểm | Ví dụ |
| **Phần mềm độc quyền / thương mại** | Phải trả phí; không được xem hay sửa mã nguồn; giới hạn số máy cài | Microsoft Office, Adobe Photoshop, Windows |
| **Thuê bao** (subscription) | Trả phí theo tháng hoặc năm; ngừng trả là ngừng dùng | Microsoft 365, Canva Pro |
| **Phần mềm miễn phí** (freeware) | Dùng miễn phí nhưng vẫn giữ bản quyền, không được sửa hay bán lại | Zoom (gói cơ bản), Adobe Acrobat Reader |
| **Phần mềm dùng thử** (shareware / trial) | Dùng thử có giới hạn thời gian hoặc tính năng, sau đó phải mua | WinRAR, bản thử 30 ngày |
| **Mã nguồn mở** (open source) | Công khai mã nguồn; được xem, sửa, chia sẻ theo điều kiện của giấy phép | Linux, Firefox, LibreOffice, Scratch, VLC |
| **Phạm vi công cộng** (public domain) | Không còn bản quyền hoặc tác giả từ bỏ quyền | Tác phẩm rất cũ, nội dung CC0 |

Các giấy phép mã nguồn mở phổ biến:
- **GPL:** được sửa và chia sẻ, nhưng sản phẩm sửa đổi cũng phải mở mã nguồn theo GPL.
- **MIT, Apache:** rất thoáng, chỉ cần giữ thông báo bản quyền gốc.

## Vì sao không dùng phần mềm lậu, crack?
- **Vi phạm pháp luật**, có thể bị phạt hành chính, cơ quan và nhà trường có thể bị kiểm tra.
- **Rủi ro bảo mật rất cao:** tệp crack hay chứa [[bao-mat-thiet-bi|mã độc]], phần mềm đánh cắp mật khẩu.
- Không được cập nhật và hỗ trợ.
- Thiếu tôn trọng công sức của lập trình viên.

> Thay thế hợp pháp: LibreOffice hoặc Google Docs thay cho Office; GIMP thay cho Photoshop; Microsoft 365 bản web miễn phí; học sinh, giáo viên thường được dùng Microsoft 365 Education hay Canva for Education miễn phí qua email trường.

## Dùng tác phẩm của người khác khi học tập
- **Trích dẫn** ngắn, có ghi rõ nguồn (tác giả, tên tác phẩm, đường link, ngày truy cập).
- Luật cho phép một số trường hợp **sử dụng hợp lý** (ví dụ trích dẫn để nghiên cứu, giảng dạy, phê bình) mà không cần xin phép, nhưng vẫn phải ghi nguồn và không ảnh hưởng tới quyền lợi của tác giả.
- **Đạo văn** là chép ý tưởng hoặc câu chữ của người khác rồi nhận là của mình. Đây là vi phạm nghiêm trọng trong học tập, kể cả khi chép từ AI; xem [[ai-hoc-tap|Dùng AI trong học tập]].
- Tìm ảnh, nhạc, video có **giấy phép Creative Commons** để dùng hợp pháp; xem [[giay-phep-cc|Giấy phép CC]].
`,
  related: ['giay-phep-cc', 'danh-tinh-so', 'ai-hoc-tap'],
  quiz: [
    { q: 'Bức tranh em tự vẽ có quyền tác giả từ khi nào?', o: ['Khi đăng ký với cơ quan nhà nước', 'Ngay khi em vẽ xong', 'Khi bán được tranh', 'Khi được 18 tuổi'], a: 1, e: 'Quyền tác giả phát sinh tự động khi tác phẩm được tạo ra.' },
    { q: 'Phần mềm cho phép xem, sửa và chia sẻ mã nguồn gọi là:', o: ['Phần mềm độc quyền', 'Shareware', 'Mã nguồn mở', 'Phần mềm crack'], a: 2, e: 'Ví dụ: Linux, Firefox, LibreOffice.' },
    { q: 'Ký hiệu ® cho biết:', o: ['Nhãn hiệu đã được đăng ký', 'Phần mềm miễn phí', 'Tác phẩm phạm vi công cộng', 'Sáng chế đang chờ duyệt'], a: 0, e: '® = Registered trademark.' },
    { q: 'Rủi ro lớn nhất khi tải phần mềm crack là:', o: ['Máy chạy nhanh hơn', 'Dễ nhiễm mã độc và vi phạm pháp luật', 'Được cập nhật thường xuyên', 'Không có rủi ro'], a: 1, e: 'Crack thường đi kèm mã độc.' },
  ],
},
{
  id: 'giay-phep-cc', cat: 'cong-dan-so', icon: '🅭', title: 'Giấy phép Creative Commons',
  aliases: ['creative commons', 'cc', 'cc by', 'cc by-sa', 'cc by-nc', 'cc by-nd', 'cc0', 'ghi công', 'tài nguyên mở'],
  summary: 'Bộ giấy phép giúp tác giả cho phép mọi người dùng lại tác phẩm với những điều kiện rõ ràng.',
  infobox: { title: 'Creative Commons', rows: [['Thành lập', '2001 (tổ chức phi lợi nhuận)'], ['Phiên bản hiện tại', '4.0'], ['Số giấy phép', '6 giấy phép + CC0'], ['Bốn điều kiện', 'BY · SA · NC · ND']] },
  body: `
**Creative Commons** (CC) là tổ chức phi lợi nhuận đưa ra bộ **giấy phép miễn phí**. Tác giả dùng các giấy phép này để nói trước với mọi người: “Bạn **được phép** dùng tác phẩm của tôi, miễn là tuân theo các điều kiện sau.” Nhờ vậy người dùng không cần xin phép từng lần. Wikipedia, nhiều kho ảnh và tài liệu học tập mở dùng giấy phép CC.

## Bốn điều kiện cơ bản
| Ký hiệu | Tên | Ý nghĩa |
| **BY** | Ghi công (*Attribution*) | Phải ghi tên tác giả, nguồn và giấy phép. **Có trong mọi giấy phép CC** |
| **SA** | Chia sẻ tương tự (*ShareAlike*) | Nếu em chỉnh sửa, phối lại, sản phẩm mới phải dùng **cùng giấy phép** |
| **NC** | Phi thương mại (*NonCommercial*) | **Không được dùng để kiếm tiền** |
| **ND** | Không phái sinh (*NoDerivatives*) | Chỉ được dùng nguyên bản, **không được chỉnh sửa** |

## Sáu giấy phép
{{fig:cc-grid|Sáu giấy phép CC kết hợp từ bốn điều kiện, xếp từ thoáng nhất đến chặt nhất.}}

| Giấy phép | Được sửa? | Được dùng thương mại? | Ghi chú |
| CC BY | ✓ | ✓ | Thoáng nhất, chỉ cần ghi công |
| CC BY-SA | ✓ (cùng giấy phép) | ✓ | Wikipedia dùng giấy phép này |
| CC BY-NC | ✓ | ✗ | |
| CC BY-NC-SA | ✓ (cùng giấy phép) | ✗ | |
| CC BY-ND | ✗ | ✓ | |
| CC BY-NC-ND | ✗ | ✗ | Chặt nhất: chỉ được chia sẻ nguyên bản, ghi công, không kiếm tiền |

Ngoài ra, **CC0** (“không giữ quyền”) nghĩa là tác giả từ bỏ quyền ở mức tối đa, đưa tác phẩm vào **phạm vi công cộng**. Em dùng tự do, không bắt buộc ghi công, nhưng ghi công vẫn là việc nên làm.

## Ghi công đúng cách: công thức TASL
- **T**itle: tên tác phẩm.
- **A**uthor: tác giả.
- **S**ource: nguồn, đường link.
- **L**icense: giấy phép, kèm link nếu có.

Ví dụ: *“Hoàng hôn trên vịnh Hạ Long” của Nguyễn Văn A, nguồn: example.com/anh-123, giấy phép CC BY 4.0.*

Nếu em chỉnh sửa (cắt, ghép, đổi màu), hãy ghi thêm: *“đã được cắt và chỉnh màu”*.

## Tìm nội dung có giấy phép CC
- **Google Hình ảnh** → Công cụ → Quyền sử dụng → *Giấy phép Creative Commons*.
- Openverse, Wikimedia Commons, Pixabay, Unsplash (hai trang cuối có giấy phép riêng, cũng cho dùng miễn phí).
- Kho nhạc miễn phí của YouTube Studio, Free Music Archive.

## Áp dụng cho bài tập
- Làm **poster nộp lớp** (không bán) → dùng được CC BY, BY-SA, BY-NC, BY-NC-SA. Nếu giữ nguyên ảnh thì dùng được cả ND.
- Làm **sản phẩm để bán** ở hội chợ → chỉ dùng CC BY, BY-SA (hoặc BY-ND nếu không sửa) và CC0.
- **Chia sẻ sản phẩm của chính em** với giấy phép CC để người khác học hỏi, ví dụ dự án Scratch được chia sẻ công khai mặc định theo CC BY-SA.

Xem thêm [[so-huu-tri-tue|Sở hữu trí tuệ và giấy phép phần mềm]].
`,
  related: ['so-huu-tri-tue', 'tim-kiem'],
  quiz: [
    { q: 'Điều kiện nào có trong MỌI giấy phép Creative Commons?', o: ['NC – phi thương mại', 'BY – ghi công', 'ND – không phái sinh', 'SA – chia sẻ tương tự'], a: 1, e: 'Mọi giấy phép CC đều yêu cầu ghi công (BY).' },
    { q: 'Ảnh có giấy phép CC BY-ND. Em có được cắt ghép ảnh vào poster không?', o: ['Được, miễn ghi công', 'Không, vì ND là không được chỉnh sửa', 'Được nếu không bán', 'Chỉ được khi đổi màu'], a: 1, e: 'ND (NoDerivatives) cấm tạo bản chỉnh sửa.' },
    { q: 'Em muốn bán áo in hình. Ảnh với giấy phép nào dùng được?', o: ['CC BY-NC', 'CC BY-NC-SA', 'CC BY', 'CC BY-NC-ND'], a: 2, e: 'Các giấy phép có NC không cho dùng thương mại.' },
    { q: 'Công thức ghi công TASL gồm:', o: ['Tên, Tác giả, Nguồn, Giấy phép', 'Thời gian, Địa chỉ, Số trang, Lớp', 'Tiêu đề, Ảnh, Slide, Link', 'Tác giả, Ảnh, Năm, Giá'], a: 0, e: 'Title – Author – Source – License.' },
  ],
},
{
  id: 'bao-mat-thiet-bi', cat: 'an-toan', icon: '🔐', title: 'Bảo mật thiết bị và tài khoản',
  aliases: ['mật khẩu', 'password', '2fa', 'xác thực hai lớp', 'mfa', 'virus', 'mã độc', 'malware', 'ransomware', 'phishing', 'lừa đảo', 'antivirus', 'windows security', 'tường lửa', 'firewall', 'otp', 'wifi công cộng', 'passkey'],
  summary: 'Mật khẩu mạnh, xác thực hai lớp, cập nhật, phần mềm diệt virus và cách nhận biết mã độc, lừa đảo trực tuyến.',
  infobox: { title: '6 thói quen an toàn', rows: [['1', 'Mật khẩu dài, khác nhau'], ['2', 'Bật xác thực hai lớp'], ['3', 'Luôn cập nhật'], ['4', 'Khoá màn hình'], ['5', 'Cảnh giác với link lạ'], ['6', 'Sao lưu dữ liệu']] },
  body: `
Thiết bị và tài khoản chứa ảnh, tin nhắn, bài học và tài khoản ngân hàng của gia đình. Chỉ một sơ suất nhỏ, như mật khẩu yếu hay bấm nhầm link, cũng có thể khiến em mất dữ liệu hoặc bị mạo danh.

## Mật khẩu mạnh
- **Dài** ít nhất 12 ký tự. Độ dài quan trọng hơn sự phức tạp.
- Dùng **cụm mật khẩu** (*passphrase*) dễ nhớ, khó đoán. Ví dụ: \`MeoVang-AnCa-7Lan!\`.
- **Mỗi tài khoản một mật khẩu khác nhau.** Một trang bị lộ thì các tài khoản khác vẫn an toàn.
- Không dùng tên, ngày sinh, \`123456\`, \`password\`, tên trường.
- Dùng **trình quản lý mật khẩu** (có sẵn trong trình duyệt, Google, Apple) để ghi nhớ hộ.
- **Không bao giờ** đưa mật khẩu hoặc **mã OTP** cho ai, kể cả người tự xưng là nhân viên ngân hàng hay quản trị viên.

Nhiều dịch vụ hiện hỗ trợ **khoá truy cập** (*passkey*): đăng nhập bằng vân tay hoặc khuôn mặt trên thiết bị của em, không cần gõ mật khẩu, khó bị đánh cắp hơn.

## Xác thực nhiều yếu tố (2FA / MFA)
{{fig:twofa|Xác thực hai lớp yêu cầu ít nhất hai loại bằng chứng khác nhau.}}

Kể cả khi kẻ xấu biết mật khẩu, chúng vẫn **không đăng nhập được** nếu thiếu yếu tố thứ hai. Nên ưu tiên ứng dụng xác thực (Google Authenticator, Microsoft Authenticator) hơn mã gửi qua tin nhắn SMS.

## Bảo vệ thiết bị
- **Cập nhật** hệ điều hành và ứng dụng ngay khi có bản mới, vì bản cập nhật vá các lỗ hổng bảo mật.
- **Khoá màn hình** bằng mã PIN, vân tay hoặc khuôn mặt; đặt tự khoá sau 1–5 phút. Rời máy tính thì nhấn **Windows + L**.
- Bật **phần mềm diệt virus**. Windows đã có sẵn *Windows Security* (Microsoft Defender).
- Bật **tường lửa** (*firewall*) để chặn kết nối lạ.
- Chỉ cài ứng dụng từ **kho chính thức** (Microsoft Store, Google Play, App Store) và để ý quyền ứng dụng xin.
- Bật **Tìm thiết bị** (Find My Device / Find My) để định vị hoặc xoá dữ liệu từ xa khi mất máy.
- **Mã hoá ổ đĩa** (BitLocker, FileVault). Điện thoại hiện đại thường mã hoá sẵn.
- Không cắm **USB lạ** nhặt được.

## Các loại mã độc
| Loại | Cách hoạt động |
| **Virus** | Bám vào tệp hoặc chương trình, lây khi tệp được mở |
| **Sâu** (worm) | Tự lây lan qua mạng, không cần người dùng mở tệp |
| **Trojan** (ngựa thành Troy) | Giả làm phần mềm hữu ích (game, crack) để cài cửa hậu |
| **Mã độc tống tiền** (ransomware) | Mã hoá toàn bộ tệp rồi đòi tiền chuộc |
| **Phần mềm gián điệp** (spyware, keylogger) | Lén ghi lại thao tác, mật khẩu |
| **Phần mềm quảng cáo** (adware) | Hiện quảng cáo liên tục, đổi trang chủ trình duyệt |

Dấu hiệu nghi nhiễm: máy chậm bất thường, quảng cáo bật lên liên tục, trình duyệt tự đổi trang chủ, tệp bị đổi đuôi lạ, tài khoản tự gửi tin nhắn cho bạn bè.

## Lừa đảo trực tuyến (phishing)
{{fig:phishing-mock|Một email lừa đảo (mô phỏng) với 6 dấu hiệu nhận biết.}}

Kẻ gian giả danh ngân hàng, nhà mạng, trường học, người quen hoặc trang trao thưởng để lừa em **bấm link, nhập mật khẩu hay OTP, chuyển tiền**.

Dấu hiệu nhận biết:
- **Thúc giục, đe doạ:** “Tài khoản sẽ bị khoá sau 24 giờ!”
- **Phần thưởng quá hấp dẫn:** “Bạn trúng iPhone, bấm để nhận!”
- **Địa chỉ lạ, viết sai:** \`faceb00k-login.com\`, \`vietcombank-xacminh.top\`.
- Lỗi chính tả, yêu cầu cung cấp mật khẩu hay OTP. Tổ chức uy tín **không bao giờ** hỏi những thông tin này.
- Tin nhắn từ “bạn bè” mượn tiền gấp: hãy **gọi điện xác minh**.

> Nghi ngờ thì **không bấm**: tự gõ địa chỉ chính thức vào trình duyệt, hoặc hỏi người lớn. Lỡ nhập mật khẩu vào trang giả thì **đổi mật khẩu ngay** và bật xác thực hai lớp.

## Wi-Fi công cộng
- Tránh đăng nhập tài khoản quan trọng hoặc chuyển tiền khi dùng Wi-Fi quán cà phê.
- Kiểm tra đúng tên mạng; kẻ gian có thể phát Wi-Fi giả trùng tên.
- Tắt chế độ tự động kết nối Wi-Fi lạ.

Xem thêm: [[danh-tinh-so|Danh tính kỹ thuật số]] · [[dat-lai-thiet-bi|Đặt lại thiết bị]].
`,
  related: ['danh-tinh-so', 'dat-lai-thiet-bi', 'loi-may-tinh'],
  quiz: [
    { q: 'Mật khẩu nào mạnh nhất?', o: ['123456', 'nguyenvanan2012', 'MeoVang-AnCa-7Lan!', 'password'], a: 2, e: 'Dài, có nhiều loại ký tự và không chứa thông tin cá nhân.' },
    { q: 'Mã độc mã hoá dữ liệu rồi đòi tiền chuộc gọi là:', o: ['Adware', 'Ransomware', 'Worm', 'Firewall'], a: 1, e: 'Ransomware: mã độc tống tiền.' },
    { q: 'Có người nhắn tự xưng nhân viên ngân hàng, xin mã OTP để “xác minh tài khoản”. Em nên:', o: ['Gửi ngay để tránh bị khoá', 'Không cung cấp, báo cho người lớn', 'Gửi một nửa mã', 'Hỏi lại họ tên rồi gửi'], a: 1, e: 'Ngân hàng không bao giờ hỏi OTP.' },
    { q: 'Xác thực hai lớp giúp gì?', o: ['Máy chạy nhanh hơn', 'Kẻ xấu biết mật khẩu vẫn không đăng nhập được', 'Không cần mật khẩu nữa', 'Chặn quảng cáo'], a: 1, e: 'Cần thêm yếu tố thứ hai như mã trên điện thoại.' },
    { q: 'Phím tắt khoá máy tính nhanh khi rời chỗ ngồi:', o: ['Ctrl + L', 'Windows + L', 'Alt + F4', 'Windows + D'], a: 1, e: 'Windows + L khoá máy ngay.' },
  ],
},
{
  id: 'bieu-do', cat: 'du-lieu', icon: '📊', title: 'Các loại biểu đồ trực quan hoá dữ liệu',
  aliases: ['chart', 'biểu đồ cột', 'biểu đồ đường', 'biểu đồ tròn', 'pie chart', 'histogram', 'scatter', 'phân tán', 'trực quan hoá', 'excel chart', 'data visualization'],
  summary: 'Chọn đúng biểu đồ cho đúng câu hỏi: so sánh, xu hướng, tỉ lệ, phân bố, tương quan.',
  infobox: { title: 'Chọn nhanh', rows: [['So sánh', 'Cột, thanh ngang'], ['Xu hướng theo thời gian', 'Đường, vùng'], ['Tỉ lệ của tổng', 'Tròn (≤ 5 phần)'], ['Phân bố', 'Histogram'], ['Mối liên hệ', 'Phân tán']] },
  body: `
**Trực quan hoá dữ liệu** là biến những con số khô khan thành hình ảnh để người xem hiểu nhanh và nhớ lâu. Một biểu đồ tốt trả lời **một câu hỏi rõ ràng**. Vì vậy hãy hỏi trước: *Mình muốn người xem thấy điều gì?*

{{fig:chart-gallery|Tám loại biểu đồ thường dùng trong Excel, Google Sheets (số liệu minh hoạ).}}

## Chọn biểu đồ theo mục đích
| Em muốn thể hiện | Loại biểu đồ | Ví dụ |
| **So sánh** giữa các nhóm | **Cột** (column) | Số học sinh của các lớp 6A, 6B, 6C |
| So sánh khi **tên nhóm dài** hoặc có nhiều nhóm | **Thanh ngang** (bar) | Số bạn thích từng môn thể thao |
| **Xu hướng theo thời gian** | **Đường** (line) | Nhiệt độ trung bình 12 tháng |
| Xu hướng và **độ lớn tích luỹ** | **Vùng** (area) | Lượng mưa cộng dồn |
| **Tỉ lệ phần trăm** của một tổng thể | **Tròn** (pie) hoặc **vành khuyên** (doughnut) | Thời gian dùng điện thoại cho từng việc |
| **Phân bố** của dữ liệu | **Tần suất** (histogram) | Phổ điểm bài kiểm tra |
| **Mối liên hệ** giữa hai đại lượng | **Phân tán** (scatter) | Số giờ tự học và điểm số |
| Hai loại số liệu khác đơn vị | **Kết hợp** (combo) cột + đường | Doanh thu (cột) và lợi nhuận (đường) |

## Nguyên tắc vẽ biểu đồ dễ đọc
- **Tiêu đề rõ ràng**, nói được ý chính. Ví dụ: “Lớp 6C có nhiều học sinh nhất”.
- **Ghi tên trục và đơn vị** (°C, %, triệu đồng…).
- Trục số của biểu đồ cột nên **bắt đầu từ 0**. Cắt trục làm chênh lệch trông lớn hơn thực tế, một cách “nói dối bằng biểu đồ”.
- Biểu đồ tròn chỉ nên có **tối đa 5–6 phần** và tổng phải là **100%**.
- **Hạn chế màu sắc**; dùng một màu nổi bật cho điều muốn nhấn mạnh.
- **Tránh hiệu ứng 3D**, vì chúng làm sai lệch cảm nhận về kích thước.
- Sắp xếp cột hoặc thanh theo thứ tự lớn → nhỏ khi so sánh.

## Tạo biểu đồ trong Excel / Google Sheets
1. **Bôi đen** vùng dữ liệu, gồm cả dòng tiêu đề.
2. Excel: thẻ **Insert → Charts**, hoặc nhấn **Alt + F1** để tạo nhanh. Google Sheets: **Chèn → Biểu đồ**.
3. Thêm **tiêu đề, nhãn dữ liệu, chú thích** (*Chart Elements*, nút dấu cộng).
4. Đổi loại biểu đồ: chuột phải → **Change Chart Type**.

> Em có thể luyện tạo và định dạng biểu đồ trong phần **Luyện tập Office → Excel** của TinHocLab.

## Đọc biểu đồ có tư duy phản biện
{{fig:chart-trap|Cùng một bộ số liệu, cắt trục làm chênh lệch trông lớn hơn nhiều.}}

- Biểu đồ lấy dữ liệu **từ đâu**? Mẫu có đủ lớn không?
- Trục có bị cắt hoặc co giãn không?
- **Tương quan không phải nhân quả.** Kem và đuối nước cùng tăng vào mùa hè, nhưng ăn kem không gây đuối nước; cả hai đều do trời nóng.
`,
  related: ['tim-kiem', 'ai-hoc-tap'],
  quiz: [
    { q: 'Thể hiện nhiệt độ thay đổi qua 12 tháng, nên dùng biểu đồ:', o: ['Tròn', 'Đường', 'Phân tán', 'Tần suất'], a: 1, e: 'Biểu đồ đường phù hợp với xu hướng theo thời gian.' },
    { q: 'Biểu đồ tròn phù hợp nhất để thể hiện:', o: ['Xu hướng theo năm', 'Tỉ lệ các phần của một tổng thể', 'Mối liên hệ giữa hai đại lượng', 'So sánh 20 nhóm'], a: 1, e: 'Các phần cộng lại phải bằng 100%.' },
    { q: 'Muốn xem số giờ tự học có liên quan đến điểm số không, dùng biểu đồ:', o: ['Phân tán', 'Tròn', 'Vùng', 'Thanh ngang'], a: 0, e: 'Scatter cho thấy mối liên hệ giữa hai biến.' },
    { q: 'Phím tắt tạo nhanh biểu đồ trong Excel:', o: ['Ctrl + C', 'Alt + F1', 'F5', 'Ctrl + P'], a: 1, e: 'Alt + F1 tạo biểu đồ ngay trên trang tính; F11 tạo trên trang riêng.' },
  ],
},
{
  id: 'tri-tue-nhan-tao', cat: 'ai', icon: '🤖', title: 'Trí tuệ nhân tạo',
  aliases: ['ai', 'artificial intelligence', 'học máy', 'machine learning', 'deep learning', 'học sâu', 'ai tạo sinh', 'generative ai', 'llm', 'mô hình ngôn ngữ lớn', 'chatgpt', 'gemini', 'copilot', 'claude', 'chatbot', 'thị giác máy tính'],
  summary: 'AI là gì, các loại AI theo năng lực và theo chức năng, AI tạo sinh hoạt động ra sao và giới hạn của nó.',
  infobox: { title: 'Trí tuệ nhân tạo', rows: [['Tiếng Anh', 'Artificial Intelligence (AI)'], ['Thuật ngữ ra đời', '1956 (hội thảo Dartmouth)'], ['Nhánh chính', 'Học máy, học sâu, AI tạo sinh'], ['Ví dụ', 'Trợ lý ảo, nhận diện khuôn mặt, dịch máy, chatbot']] },
  body: `
**Trí tuệ nhân tạo** (*Artificial Intelligence*, AI) là lĩnh vực nghiên cứu tạo ra máy móc, phần mềm có thể làm những việc vốn cần trí thông minh của con người: nhận biết hình ảnh và giọng nói, hiểu ngôn ngữ, ra quyết định, sáng tạo nội dung. Thuật ngữ “AI” xuất hiện từ năm **1956**, nhưng chỉ bùng nổ trong khoảng 15 năm gần đây nhờ dữ liệu lớn và máy tính mạnh.

{{fig:ai-nested|AI là lĩnh vực rộng nhất; học máy, học sâu và AI tạo sinh lần lượt là các nhánh nhỏ hơn bên trong.}}

## Các khái niệm lồng nhau
- **Học máy** (*Machine Learning*): thay vì lập trình từng quy tắc, ta cho máy **học từ dữ liệu**. Ví dụ: cho xem hàng nghìn email đã đánh dấu “rác” để máy tự học cách lọc thư rác.
- **Học sâu** (*Deep Learning*): học máy dùng **mạng nơ-ron nhân tạo** nhiều lớp, mô phỏng một cách đơn giản cách các tế bào thần kinh kết nối. Học sâu giỏi xử lý ảnh, âm thanh, ngôn ngữ.
- **AI tạo sinh** (*Generative AI*): AI **tạo ra nội dung mới** như văn bản, hình ảnh, âm nhạc, video, mã lập trình.

## Phân loại theo năng lực
| Loại | Mô tả | Hiện trạng |
| **AI hẹp** (Narrow AI / ANI) | Giỏi một hoặc một nhóm nhiệm vụ cụ thể | **Mọi AI hiện nay** đều thuộc loại này, kể cả chatbot rất giỏi |
| **AI tổng quát** (AGI) | Làm được mọi việc trí óc như con người, tự học lĩnh vực mới | Đang được nghiên cứu, còn nhiều tranh luận |
| **Siêu trí tuệ** (ASI) | Vượt xa con người ở mọi mặt | Giả thuyết |

## Phân loại theo chức năng (ứng dụng)
| Nhóm | Làm gì | Ví dụ quen thuộc |
| **Xử lý ngôn ngữ tự nhiên** (NLP) | Hiểu và tạo văn bản | Dịch máy, chatbot, kiểm tra chính tả |
| **Thị giác máy tính** | Hiểu hình ảnh, video | Mở khoá bằng khuôn mặt, Google Lens, xe tự lái |
| **Nhận dạng giọng nói** | Chuyển giọng nói thành chữ và ngược lại | Trợ lý ảo, phụ đề tự động |
| **Hệ thống gợi ý** | Đoán điều em thích | Gợi ý video, sản phẩm, bài hát |
| **AI tạo sinh** | Tạo nội dung mới | Chatbot (ChatGPT, Gemini, Copilot, Claude…), tạo ảnh, tạo nhạc |
| **Robot và điều khiển** | Hành động trong thế giới thật | Robot hút bụi, cánh tay robot trong nhà máy |

## Chatbot AI hoạt động thế nào?
Chatbot dựa trên **mô hình ngôn ngữ lớn** (*LLM*), được huấn luyện trên lượng văn bản khổng lồ. Về cơ bản, mô hình học cách **dự đoán từ tiếp theo** hợp lý nhất. Nhờ vậy nó viết được câu trả lời trôi chảy, nhưng điều đó **không có nghĩa là nó luôn đúng**.

## Giới hạn và rủi ro
- **“Ảo giác”** (*hallucination*): AI có thể bịa ra thông tin, số liệu, nguồn trích dẫn nghe rất thuyết phục.
- **Thiên lệch:** dữ liệu huấn luyện có định kiến thì AI cũng có thể có định kiến.
- **Kiến thức có giới hạn thời gian:** mô hình có thể không biết sự kiện mới nếu không tra cứu.
- **Quyền riêng tư:** những gì em nhập có thể được lưu lại.
- **Nội dung giả mạo** (*deepfake*): ảnh, giọng nói, video giả rất giống thật.

Muốn dùng AI hiệu quả và trung thực khi học, đọc tiếp [[ai-hoc-tap|Dùng AI hợp lý trong học tập]].
`,
  related: ['ai-hoc-tap', 'tim-kiem', 'danh-tinh-so'],
  quiz: [
    { q: 'Chatbot giỏi trò chuyện hiện nay thuộc loại AI nào theo năng lực?', o: ['AI hẹp (ANI)', 'AI tổng quát (AGI)', 'Siêu trí tuệ (ASI)', 'Không phải AI'], a: 0, e: 'Mọi AI hiện nay đều là AI hẹp.' },
    { q: 'Mở khoá điện thoại bằng khuôn mặt là ứng dụng của nhánh:', o: ['Xử lý ngôn ngữ', 'Thị giác máy tính', 'Hệ thống gợi ý', 'Bảng tính'], a: 1, e: 'Thị giác máy tính giúp máy “nhìn” và nhận diện.' },
    { q: '“Ảo giác” (hallucination) của AI là gì?', o: ['AI bị nhiễm virus', 'AI bịa ra thông tin nghe có vẻ đúng', 'AI từ chối trả lời', 'AI chạy chậm'], a: 1, e: 'Vì vậy luôn phải kiểm tra lại thông tin.' },
    { q: 'Quan hệ đúng giữa các khái niệm là:', o: ['Học sâu ⊂ Học máy ⊂ AI', 'AI ⊂ Học máy ⊂ Học sâu', 'Học máy ⊂ Học sâu ⊂ AI', 'Ba khái niệm không liên quan'], a: 0, e: 'Học sâu là một phần của học máy, học máy là một phần của AI.' },
  ],
},
{
  id: 'ai-hoc-tap', cat: 'ai', icon: '🎓', title: 'Dùng AI hợp lý trong học tập',
  aliases: ['ai học tập', 'chatgpt làm bài', 'gian lận', 'prompt', 'câu lệnh ai', 'trích dẫn ai', 'liêm chính học thuật', 'đạo văn ai'],
  summary: 'Biến AI thành “gia sư” giúp em hiểu bài, không phải “máy làm bài hộ”. Nguyên tắc, cách đặt câu lệnh và những điều tuyệt đối tránh.',
  infobox: { title: 'Nguyên tắc 4 Đ', rows: [['Được phép', 'Hỏi thầy cô trước'], ['Đúng', 'Kiểm tra lại thông tin'], ['Đủ riêng tư', 'Không nhập thông tin cá nhân'], ['Đề rõ nguồn', 'Ghi rõ đã dùng AI thế nào']] },
  body: `
Các công cụ [[tri-tue-nhan-tao|AI]] có thể là một **gia sư kiên nhẫn 24/7**, nhưng cũng có thể khiến em **học kém đi** nếu để AI làm thay. Mục tiêu của việc học là **bộ não của em** tiến bộ, không phải là có một bài nộp đẹp.

## Nguyên tắc 4 Đ
1. **Được phép:** mỗi môn, mỗi bài có quy định riêng. **Hỏi thầy cô** trước khi dùng AI cho bài tập. Bài kiểm tra thường **không được** dùng AI.
2. **Đúng:** AI có thể sai hoặc bịa nguồn. Hãy **kiểm tra lại** bằng sách giáo khoa và nguồn tin cậy; xem [[tim-kiem|Tìm kiếm thông tin hiệu quả]].
3. **Đủ riêng tư:** không nhập họ tên đầy đủ, địa chỉ, số điện thoại, ảnh cá nhân, mật khẩu hay thông tin của bạn bè vào chatbot. Kiểm tra **độ tuổi tối thiểu** của từng dịch vụ và hỏi ý kiến cha mẹ.
4. **Đề rõ nguồn:** nếu được phép dùng, hãy **ghi rõ** em đã dùng công cụ nào, vào việc gì. Nộp bài AI viết mà nhận là của mình là **gian lận** và đạo văn; xem [[so-huu-tri-tue|Sở hữu trí tuệ]].

## Nên và không nên
| ✅ Nên dùng AI để… | ❌ Không nên dùng AI để… |
| Giải thích lại khái niệm khó theo cách đơn giản, có ví dụ | Chép nguyên văn câu trả lời làm bài nộp |
| Tạo câu hỏi ôn tập, flashcard để tự kiểm tra | Làm bài kiểm tra hoặc thi hộ |
| Gợi ý dàn ý để em **tự viết** | Viết toàn bộ bài văn, bài luận |
| Chỉ ra lỗi sai trong bài em đã làm và giải thích vì sao sai | Giải hộ bài tập mà không hiểu cách làm |
| Luyện hội thoại tiếng Anh, sửa ngữ pháp | Tạo ảnh hoặc video giả mạo bạn bè, thầy cô |
| Giải thích từng dòng code em chưa hiểu | Tin tuyệt đối vào số liệu, ngày tháng, trích dẫn AI đưa ra |
| Lên kế hoạch ôn thi | Nhập thông tin cá nhân của mình hoặc người khác |

## Đặt câu lệnh (prompt) hiệu quả
{{fig:prompt-compare|Cùng một bài toán, hai cách hỏi cho kết quả học tập rất khác nhau.}}

Một câu lệnh tốt gồm 4 phần: **vai trò, nhiệm vụ, bối cảnh, yêu cầu về đầu ra**.

❌ *giải bài này*

✅ *“Em là học sinh lớp 7. Hãy đóng vai gia sư Toán. Đừng cho em đáp án ngay. Hãy gợi ý từng bước để em tự giải bài: Tìm x biết 3x + 5 = 20. Sau mỗi bước, hỏi em làm tiếp thế nào.”*

Mẹo:
- Yêu cầu AI **hỏi ngược lại** để kiểm tra mức hiểu của em.
- Đề nghị AI **giải thích bằng ví dụ** gần gũi, hoặc “giải thích như cho học sinh lớp 5”.
- Yêu cầu **liệt kê nguồn**, rồi tự mở các nguồn đó ra kiểm tra.
- Hỏi lại: *“Câu trả lời trên có chỗ nào có thể sai không?”*

## Cách ghi nguồn khi dùng AI
Ví dụ: *“Em đã dùng [tên công cụ] ngày 20/11/2026 để gợi ý dàn ý cho phần mở bài. Nội dung bài viết do em tự viết.”*

> Thử thách cho em: Sau khi học với AI, hãy **gấp máy lại** và tự giải thích bài cho một người bạn. Nếu em giải thích được, em đã thật sự hiểu.

## Nhận biết nội dung do AI tạo
- Ảnh có chi tiết lạ: bàn tay nhiều ngón, chữ trong ảnh bị méo, bóng đổ sai.
- Video hoặc giọng nói của người nổi tiếng nói điều bất thường thì nên nghi ngờ **deepfake**.
- Dùng tìm kiếm bằng hình ảnh để kiểm tra nguồn gốc.
`,
  related: ['tri-tue-nhan-tao', 'tim-kiem', 'so-huu-tri-tue'],
  quiz: [
    { q: 'Cách dùng AI nào giúp em học tốt hơn?', o: ['Nhờ AI viết cả bài văn rồi nộp', 'Nhờ AI gợi ý từng bước để em tự giải', 'Dùng AI trong giờ kiểm tra', 'Chép số liệu AI đưa ra mà không kiểm tra'], a: 1, e: 'AI là gia sư, không phải người làm bài hộ.' },
    { q: 'Thông tin nào KHÔNG nên nhập vào chatbot?', o: ['Câu hỏi về quang hợp', 'Số điện thoại và địa chỉ nhà', 'Yêu cầu tạo câu hỏi ôn tập', 'Đoạn code em viết'], a: 1, e: 'Không chia sẻ thông tin cá nhân với AI.' },
    { q: 'AI đưa ra một số liệu kèm nguồn trích dẫn. Em nên:', o: ['Tin ngay vì có nguồn', 'Mở nguồn ra kiểm tra; nguồn có thể bị bịa', 'Bỏ qua phần nguồn', 'Hỏi bạn có tin không'], a: 1, e: 'AI có thể “ảo giác” cả nguồn trích dẫn.' },
    { q: 'Một câu lệnh (prompt) tốt nên có:', o: ['Càng ngắn càng tốt', 'Vai trò, nhiệm vụ, bối cảnh và yêu cầu đầu ra', 'Chỉ cần dán đề bài', 'Nhiều biểu tượng cảm xúc'], a: 1, e: 'Câu lệnh rõ ràng thì câu trả lời phù hợp hơn.' },
  ],
},
];
