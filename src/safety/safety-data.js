// Dữ liệu Phòng An toàn số (mạch D). Mọi tổ chức, tên miền, người gửi đều là HƯ CẤU để luyện tập.

// ---------- 1. Hộp thư lừa đảo ----------
// link: [chữ hiển thị, địa chỉ thật khi di chuột]
export const MAILS = [
  {
    id: 'm1', from: 'Ngân hàng Sao Việt', addr: 'canhbao@saoviet-bank-xacminh.com', time: '07:12', subject: '⚠ Tài khoản của bạn sẽ bị KHOÁ trong 24 giờ',
    body: [
      'Kính gửi Quý khách,',
      'Hệ thống phát hiện đăng nhập bất thường. Tài khoản của Quý khách sẽ bị <b>khoá vĩnh viễn trong 24 giờ</b> nếu không xác minh ngay.',
      'Vui lòng bấm vào đường dẫn sau và nhập <b>tên đăng nhập, mật khẩu và mã OTP</b>: {L0}',
      'Trân trọng, Bộ phận An ninh',
    ],
    links: [['https://saovietbank.vn/xac-minh', 'http://saoviet-bank.xacminh-tk.top/login']],
    phish: true,
    flags: ['Địa chỉ gửi <b>saoviet-bank-xacminh.com</b> không phải tên miền chính thức của ngân hàng.', 'Doạ "khoá vĩnh viễn trong 24 giờ" để em hoảng và làm theo vội.', 'Chữ trên đường link khác hẳn địa chỉ thật (đuôi <b>.top</b> lạ).', 'Ngân hàng <b>không bao giờ</b> hỏi mật khẩu hay mã OTP qua thư.'],
  },
  {
    id: 'm2', from: 'Cô Nguyễn Thị Lan', addr: 'lan.nguyen@thcshoasen.edu.vn', time: '06:45', subject: 'Lịch kiểm tra giữa học kỳ – lớp 7A',
    body: ['Chào các em,', 'Cô gửi lịch kiểm tra giữa học kỳ trong tệp đính kèm. Các em xem kỹ môn và phòng thi nhé.', 'Có thắc mắc gì hỏi cô trực tiếp trên lớp.', 'Cô Lan'],
    attach: 'lich-kiem-tra-7A.pdf', phish: false,
    flags: ['Người gửi dùng tên miền của trường <b>thcshoasen.edu.vn</b>, nội dung bình thường.', 'Tệp đính kèm là <b>.pdf</b> đúng như nội dung nói tới.', 'Không đòi mật khẩu, không doạ dẫm, không thúc giục.'],
  },
  {
    id: 'm3', from: 'GameVui – Sự kiện', addr: 'qua-tang@gamevui-free.xyz', time: 'Hôm qua', subject: '🎁 CHÚC MỪNG! Bạn trúng 10.000 kim cương MIỄN PHÍ',
    body: ['Bạn là người chơi may mắn thứ 1.000.000!', 'Để nhận 10.000 kim cương, hãy đăng nhập tài khoản game của bạn tại {L0} trong vòng 30 phút.', 'Chia sẻ cho 5 người bạn để nhận thêm quà!'],
    links: [['Nhận quà ngay', 'http://gamevui-free.xyz/dang-nhap?ref=qua']],
    phish: true,
    flags: ['"Trúng thưởng" mà em không hề tham gia – dấu hiệu lừa đảo kinh điển.', 'Đòi đăng nhập tài khoản qua một trang lạ để <b>đánh cắp tài khoản</b>.', 'Giới hạn "30 phút" và "chia sẻ cho 5 người" để lan nhanh.', 'Tên miền đuôi <b>.xyz</b>, có chữ "free" – không phải trang chính thức.'],
  },
  {
    id: 'm4', from: 'Thư viện trường', addr: 'thuvien@thcshoasen.edu.vn', time: 'Hôm qua', subject: 'Nhắc trả sách: "Dế Mèn phiêu lưu ký"',
    body: ['Chào em,', 'Cuốn sách em mượn ngày 02/11 đã đến hạn trả. Em mang sách đến thư viện trong giờ ra chơi nhé.', 'Cảm ơn em!'],
    phish: false,
    flags: ['Tên miền của trường, nội dung cụ thể, hợp lý.', 'Không có đường link, không đòi thông tin cá nhân hay tiền.'],
  },
  {
    id: 'm5', from: 'Giao hàng Sao Bay', addr: 'no-reply@saobay-delivery.info', time: 'Thứ Hai', subject: 'Đơn hàng của bạn đang bị GIỮ LẠI',
    body: ['Đơn hàng #VN8842 không giao được do thiếu phí vận chuyển <b>15.000đ</b>.', 'Vui lòng thanh toán bằng thẻ ngân hàng tại {L0}, nếu không đơn sẽ bị huỷ.', 'Xem hoá đơn trong tệp đính kèm.'],
    links: [['Thanh toán phí', 'http://saobay-delivery.info/pay/the-ngan-hang']],
    attach: 'hoadon.pdf.exe', phish: true,
    flags: ['Em có đặt hàng không? Kẻ gian gửi hàng loạt, ai đang chờ hàng sẽ dễ tin.', 'Số tiền nhỏ (15.000đ) để em không đề phòng – mục đích thật là lấy <b>số thẻ ngân hàng</b>.', 'Tệp <b>hoadon.pdf.exe</b> là chương trình (.exe) giả làm tệp PDF – mở ra là nhiễm mã độc!'],
  },
  {
    id: 'm6', from: 'Mạng xã hội KetNoi', addr: 'bao-mat@ketnoi.vn', time: 'Thứ Hai', subject: 'Có đăng nhập mới vào tài khoản của bạn',
    body: ['Tài khoản của bạn vừa đăng nhập trên <b>máy tính Windows</b> lúc 20:14.', 'Nếu đó là bạn, không cần làm gì thêm.', 'Nếu không phải bạn: hãy <b>tự mở ứng dụng KetNoi</b> → Cài đặt → Bảo mật để đổi mật khẩu. Chúng tôi không bao giờ hỏi mật khẩu qua thư.'],
    phish: false,
    flags: ['Thư thông báo, <b>không</b> có đường link bắt bấm, <b>không</b> hỏi mật khẩu.', 'Hướng dẫn em tự mở ứng dụng chính thức – đây là cách làm an toàn.'],
  },
  {
    id: 'm7', from: 'Minh (lớp 7A)', addr: 'minh.7a.hoasen@gmail-hotro.com', time: 'Chủ Nhật', subject: 'Giúp mình với!!!',
    body: ['Ơi bạn ơi, mình lỡ nhập số điện thoại của bạn vào tài khoản của mình.', 'Có một <b>mã 6 số</b> vừa gửi tới điện thoại bạn, bạn gửi lại cho mình ngay nhé, gấp lắm 🙏'],
    phish: true,
    flags: ['Mã OTP là "chìa khoá" tài khoản – <b>không bao giờ</b> đưa cho ai, kể cả bạn thân.', 'Tên giống bạn quen nhưng địa chỉ <b>gmail-hotro.com</b> là giả mạo.', 'Thúc giục "gấp lắm" để em không kịp suy nghĩ. Hãy gọi hỏi trực tiếp bạn Minh.'],
  },
  {
    id: 'm8', from: 'Phòng Giáo dục – Học bổng', addr: 'thongbao@pgd-hocbong.com', time: 'Thứ Sáu', subject: 'Em được chọn nhận học bổng 5.000.000đ',
    body: ['Chúc mừng em được xét học bổng khuyến học trị giá <b>5.000.000đ</b>.', 'Để nhận, phụ huynh chuyển <b>phí hồ sơ 200.000đ</b> vào tài khoản cá nhân dưới đây trong hôm nay.', 'Xem chi tiết: {L0}'],
    links: [['Danh sách học bổng', 'http://pgd-hocbong.com/nhan-thuong']],
    phish: true,
    flags: ['Học bổng thật <b>không thu phí</b> và không chuyển vào tài khoản cá nhân.', 'Cơ quan nhà nước dùng tên miền <b>.gov.vn</b> / <b>.edu.vn</b>, không dùng .com như thế này.', 'Đòi chuyển tiền "trong hôm nay".'],
  },
  {
    id: 'm9', from: 'CLB Tin học', addr: 'clbtinhoc@thcshoasen.edu.vn', time: 'Thứ Năm', subject: 'Buổi sinh hoạt CLB tuần này: làm game Scratch',
    body: ['Chào các bạn thành viên!', 'Chiều thứ Bảy 14:00 tại phòng máy 2, CLB sẽ cùng làm game Pac-Man bằng Scratch.', 'Xem nội dung buổi học tại {L0}.'],
    links: [['thcshoasen.edu.vn/clb-tin-hoc', 'https://thcshoasen.edu.vn/clb-tin-hoc']],
    phish: false,
    flags: ['Đường link hiển thị và địa chỉ thật <b>trùng nhau</b>, thuộc trang của trường, có https.', 'Không đòi thông tin cá nhân, không tiền bạc.'],
  },
  {
    id: 'm10', from: 'Hỗ trợ kỹ thuật PhầnMềmX', addr: 'support@phanmemx-hotro.help', time: 'Thứ Tư', subject: 'Máy tính của bạn bị nhiễm 5 virus!',
    body: ['Chúng tôi phát hiện <b>5 virus nguy hiểm</b> trên máy tính của bạn.', 'Tải ngay công cụ diệt virus tại {L0} và cho phép nó quyền quản trị.', 'Hoặc gọi đường dây nóng để kỹ thuật viên <b>điều khiển máy tính từ xa</b> giúp bạn.'],
    links: [['Tải công cụ diệt virus', 'http://phanmemx-hotro.help/download/fix.exe']],
    phish: true,
    flags: ['Không ai có thể "phát hiện virus trên máy em" qua thư.', 'Bắt tải tệp <b>.exe</b> từ trang lạ và cho quyền quản trị – đó chính là mã độc.', 'Cho người lạ điều khiển máy từ xa = giao chìa khoá nhà cho kẻ trộm.'],
  },
];

// ---------- 2. Mật khẩu ----------
export const COMMON = ['123456', '123456789', '12345678', '12345', '1234567', '111111', '000000', '123123', 'password', 'password1', 'matkhau', 'qwerty', 'qwerty123', 'abc123', 'iloveyou', 'anhyeuem', 'emyeuanh', 'admin', 'admin123', '1q2w3e4r', 'zxcvbnm', 'asdfgh', '654321', '666666', '888888', '999999', 'football', 'dragon', 'monkey', 'letmein', 'welcome', 'sunshine', 'princess', 'baseball', 'superman', 'batman', 'minecraft', 'freefire', 'lienquan', 'vietnam', 'hanoi', 'saigon', 'hello123', 'abcd1234', 'aaaaaa', 'p@ssw0rd', 'passw0rd', '1qaz2wsx', 'qazwsx', 'iloveu'];

// ---------- 3. Quyền riêng tư ----------
// Bài đăng nháp: những chi tiết em có thể bấm vào; risk = có nguy hiểm không
export const POST = {
  text: [
    ['Cuối tuần vui quá! 🎉 ', null],
    ['Nhà mình ở số 12 ngõ 34 phố Hoa Sữa', 'addr'],
    [', ai rảnh qua chơi nhé. ', null],
    ['Mai cả nhà đi Đà Lạt 5 ngày, nhà vắng hết', 'away'],
    [' 😆 Ảnh mới cắt tóc nè. ', null],
    ['SĐT mình 0912 345 678', 'phone'],
    [' ', null],
    ['#lop7A #THCSHoaSen', 'school'],
  ],
  // vùng có thể bấm trong ảnh (toạ độ trên khung 600×360)
  spots: [
    { id: 'card', x: 392, y: 214, w: 150, h: 92, label: 'Thẻ học sinh có họ tên, ngày sinh, mã số' },
    { id: 'ticket', x: 40, y: 228, w: 150, h: 80, label: 'Vé máy bay có mã đặt chỗ và họ tên' },
    { id: 'plate', x: 240, y: 40, w: 96, h: 52, label: 'Biển số nhà trong ảnh' },
    { id: 'cat', x: 470, y: 60, w: 90, h: 80, label: 'Con mèo đang ngủ', safe: true },
    { id: 'plant', x: 60, y: 60, w: 80, h: 100, label: 'Chậu cây', safe: true },
  ],
  settings: [
    { id: 'aud', label: 'Ai xem được', opts: ['Công khai (mọi người)', 'Bạn bè', 'Chỉ mình tôi'], good: [1, 2], bad: 0 },
    { id: 'loc', label: 'Gắn vị trí hiện tại', opts: ['Bật', 'Tắt'], good: [1], bad: 0 },
  ],
  why: {
    addr: 'Địa chỉ nhà: người lạ biết chính xác nơi em ở.',
    away: '"Nhà vắng 5 ngày": báo cho kẻ gian biết lúc nào nhà không có ai.',
    phone: 'Số điện thoại: dễ bị làm phiền, lừa đảo, hoặc dùng để chiếm tài khoản.',
    school: 'Tên trường + lớp: người lạ biết nơi tìm em mỗi ngày.',
    card: 'Thẻ học sinh: họ tên, ngày sinh, mã số – đủ để giả danh em.',
    ticket: 'Vé máy bay: mã đặt chỗ + họ tên có thể dùng để huỷ/đổi chuyến bay của gia đình.',
    plate: 'Biển số nhà: kết hợp với ảnh là tìm ra nhà em.',
  },
};

// ---------- 4. Ứng xử & pháp luật ----------
export const CASES = [
  {
    id: 'c1', tag: 'Bắt nạt qua mạng', q: 'Trong nhóm chat của lớp, vài bạn đăng ảnh chế giễu bạn Hà và rủ mọi người thả "haha". Em nên làm gì?',
    opts: ['Thả "haha" cho vui, ai cũng làm vậy', 'Lặng lẽ rời nhóm, coi như không thấy', 'Không hưởng ứng, nhắn động viên Hà, chụp màn hình làm bằng chứng và báo thầy cô hoặc bố mẹ', 'Đăng ảnh chế giễu lại các bạn kia'],
    a: 2, why: 'Hưởng ứng hay im lặng đều khiến việc bắt nạt kéo dài. Đứng về phía bạn bị bắt nạt, giữ bằng chứng và báo người lớn tin cậy là cách giúp hiệu quả nhất. Trả đũa chỉ làm mọi chuyện tệ hơn.',
  },
  {
    id: 'c2', tag: 'Bản quyền', q: 'Em làm bài thuyết trình và muốn dùng một bức ảnh đẹp tìm được trên mạng. Cách nào đúng?',
    opts: ['Lấy luôn, ảnh trên mạng là của chung', 'Dùng ảnh cho phép sử dụng lại (ví dụ giấy phép Creative Commons, kho ảnh miễn phí) và ghi rõ nguồn', 'Lấy ảnh rồi cắt bỏ hình mờ (watermark) của tác giả', 'Chụp màn hình bức ảnh thì không còn là của tác giả nữa'],
    a: 1, why: 'Ảnh, nhạc, video trên mạng đều có tác giả và được pháp luật về sở hữu trí tuệ bảo vệ. Hãy chọn tài nguyên cho phép dùng lại và ghi nguồn. Xoá hình mờ hay chụp màn hình không làm em có quyền sử dụng.',
  },
  {
    id: 'c3', tag: 'Người lạ trên mạng', q: 'Một tài khoản lạ khen em dễ thương, nói chuyện rất hợp, rồi xin ảnh riêng và rủ gặp mặt, dặn "đừng kể với ai". Em làm gì?',
    opts: ['Gửi ảnh vì bạn ấy rất tốt', 'Đi gặp nhưng rủ thêm một bạn cùng lớp', 'Không gửi ảnh, không hẹn gặp, chặn tài khoản và kể ngay với bố mẹ hoặc thầy cô', 'Giữ bí mật như bạn ấy dặn'],
    a: 2, why: 'Người tốt không bắt em giữ bí mật với bố mẹ. Lời khen, quà tặng rồi đòi ảnh riêng, hẹn gặp là dấu hiệu nguy hiểm. Kể với người lớn tin cậy không phải là "mách lẻo" – đó là bảo vệ chính mình.',
  },
  {
    id: 'c4', tag: 'Phần mềm lậu', q: 'Bạn cho em đường link tải bản "crack" của một trò chơi trả phí. Điều gì đúng?',
    opts: ['Không sao, ai cũng dùng bản crack', 'Vi phạm bản quyền và rất dễ chứa mã độc đánh cắp tài khoản, dữ liệu', 'Chỉ sai nếu đem bán lại', 'An toàn nếu máy có cài phần mềm diệt virus'],
    a: 1, why: 'Bản crack là sao chép trái phép – vi phạm quyền của người làm ra trò chơi. Kẻ phát tán còn hay cài thêm mã độc. Hãy dùng bản miễn phí chính thức hoặc phần mềm mã nguồn mở thay thế.',
  },
  {
    id: 'c5', tag: 'Tin giả', q: 'Nhóm chat của phụ huynh lan truyền: "Ngày mai bão lớn, toàn bộ học sinh nghỉ học 1 tuần!", không ghi nguồn. Em làm gì?',
    opts: ['Chia sẻ ngay cho cả lớp biết', 'Kiểm tra trên trang chính thức của trường, Sở/Phòng Giáo dục hoặc hỏi thầy cô trước khi tin và chia sẻ', 'Tin luôn vì nhiều người đã chia sẻ', 'Thêm vài chi tiết cho hấp dẫn rồi chia sẻ'],
    a: 1, why: 'Nhiều người chia sẻ không làm tin thành thật. Hãy tìm nguồn chính thức. Đăng hoặc chia sẻ thông tin sai sự thật có thể gây hoang mang và bị xử phạt theo pháp luật Việt Nam.',
  },
  {
    id: 'c6', tag: 'Tài khoản', q: 'Bạn thân hỏi mượn mật khẩu tài khoản game của em "chơi hộ một chút". Em nên…',
    opts: ['Cho mượn vì là bạn thân', 'Cho mượn rồi đổi mật khẩu sau', 'Từ chối nhẹ nhàng: mật khẩu là của riêng mỗi người', 'Cho mượn nếu bạn hứa không nói ai'],
    a: 2, why: 'Mật khẩu giống bàn chải đánh răng – không dùng chung. Bạn có thể vô tình làm lộ, đổi thông tin hoặc dùng tài khoản của em làm việc xấu mà em phải chịu trách nhiệm.',
  },
  {
    id: 'c7', tag: 'Dấu chân số', q: 'Em đang rất bực một bạn và muốn đăng một bài nói xấu bạn ấy. Điều gì cần nhớ?',
    opts: ['Đăng xong xoá đi là hết', 'Những gì đã đăng có thể bị chụp lại, lan truyền mãi; xúc phạm người khác trên mạng là sai và có thể vi phạm pháp luật', 'Đăng ở chế độ "chỉ bạn bè" thì không sao', 'Dùng tài khoản ảo thì không ai biết'],
    a: 1, why: 'Mọi thứ đăng lên tạo thành "dấu chân số" rất khó xoá. Hãy bình tĩnh, nói chuyện trực tiếp hoặc nhờ thầy cô. Tài khoản ảo vẫn có thể bị truy ra.',
  },
  {
    id: 'c8', tag: 'Trí tuệ nhân tạo', q: 'Em dùng một trợ lý AI khi làm bài tập. Cách dùng nào đúng?',
    opts: ['Chép nguyên câu trả lời của AI nộp làm bài của mình', 'Dùng AI để hỏi lại phần chưa hiểu, tự viết bài, kiểm tra lại thông tin và nói rõ với thầy cô phần nào có dùng AI', 'AI luôn đúng nên không cần kiểm tra', 'Nhập họ tên, địa chỉ, ảnh của bạn bè vào AI cho tiện'],
    a: 1, why: 'AI có thể trả lời sai một cách rất tự tin. Hãy dùng nó như một người hỗ trợ học tập, trung thực về việc sử dụng, và không đưa thông tin cá nhân của mình hay người khác vào.',
  },
];
