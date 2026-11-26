// Danh sách từ và câu luyện gõ (tự biên soạn)
export const EN = `the be of and a to in he have it that for they with as not on she at by this we you do but from or which one would all will there say who make when can more if no man out other so what time up go about than into could state only new year some take come these know see use get like then first any work now may such give over think most even find day also after way many must look before great back through long where much should well people down own just because good each those feel seem how high too place little world very still nation hand old life tell write become here show house both between need mean call develop under last right move thing general school never same another begin while number part turn real leave might want point form off child few small since against ask late home interest large person end open public follow during present without again hold govern around possible head consider word program problem however lead system set order eye plan run keep face fact group play stand increase early course change help line city put close case force meet once water upon war build hear light unite live every country bring center let side try provide continue name certain power pay result question study woman member until far night always service away report something company week church toward start social room figure nature though young less enough almost read include president nothing yet better big boy cost business value second why clear expect family complete act sense mind experience art next near direct car law industry important girl food several matter usual rather per often kind among white reason action return foot care simple within love human along appear doctor believe speak active student month drive concern best door hope example inform body ever least probable understand reach effect different idea whole control condition field pass fall note special talk particular today measure walk teacher computer keyboard screen mouse file folder type learn practice finger`.split(/\s+/);

// Từ ghép thông dụng – tách thành từng tiếng khi luyện
export const VI = `học sinh giáo viên máy tính bàn phím màn hình con chuột trường học lớp học bài tập thực hành tin học phần mềm phần cứng mạng internet thư mục tệp tin văn bản trình chiếu bảng tính công thức dữ liệu chương trình cài đặt khởi động tắt máy lưu trữ ổ cứng bộ nhớ thông tin truy cập trang web tìm kiếm điện thoại gia đình bố mẹ anh chị em ông bà bạn bè thầy cô hôm nay ngày mai buổi sáng buổi chiều buổi tối mùa xuân mùa hè mùa thu mùa đông thời tiết trời mưa nắng đẹp cây xanh bông hoa con mèo con chó con cá chim non dòng sông ngọn núi biển cả bầu trời mặt trời mặt trăng ngôi sao quê hương đất nước Việt Nam thủ đô Hà Nội thành phố làng quê cánh đồng lúa vàng bữa cơm nấu ăn quả táo quả cam trái chuối nước mát sức khỏe thể thao bóng đá chạy bộ bơi lội âm nhạc bài hát vẽ tranh đọc sách viết chữ câu chuyện cuộc sống ước mơ tương lai cố gắng chăm chỉ kiên nhẫn trung thực lễ phép yêu thương giúp đỡ chia sẻ đoàn kết vui vẻ hạnh phúc thân thiện sáng tạo khám phá suy nghĩ hiểu biết kiến thức kỹ năng luyện tập kiểm tra điểm số tiến bộ thành công thử thách nhanh chóng chính xác cẩn thận gọn gàng sạch sẽ ngăn nắp trật tự an toàn bảo vệ môi trường tiết kiệm điện năng nguồn nước rừng xanh không khí trong lành giao thông đường phố xe đạp xe buýt tàu hỏa máy bay du lịch nghỉ hè lễ hội Tết Nguyên Đán bánh chưng áo dài nón lá phở bò cà phê trà đá tiếng Việt tiếng Anh toán học lịch sử địa lý khoa học vật lý hóa học sinh học ngữ văn mỹ thuật thư viện sân trường giờ ra chơi đồng phục khăn quàng cặp sách bút chì thước kẻ quyển vở trang giấy ánh sáng âm thanh hình ảnh màu sắc người bạn đồng hành tiếp tục bắt đầu kết thúc quan trọng cần thiết đơn giản phức tạp dễ dàng khó khăn tuyệt vời xuất sắc`.split(/\s+/);

export const QUOTES = {
  en: [
    'Practice a little every day and your fingers will learn the way on their own.',
    'A computer is a tool, and like every tool it works best in skilled hands.',
    'Keep your eyes on the screen and let your fingers find the keys.',
    'Slow and accurate typing always turns into fast and accurate typing.',
    'The home row is where your fingers rest and where every word begins.',
    'Saving your work often is a habit that will rescue you one day.',
    'Good posture, relaxed shoulders and steady breathing make typing easier.',
    'Every expert was once a beginner who refused to give up.',
    'Mistakes are not failures; they are notes that tell you what to practice next.',
    'Learning to type well is like learning to ride a bike: once you know it, you never forget it.',
    'A clear folder structure saves more time than the fastest computer in the room.',
    'Read the question twice, think once more, and then start to type your answer.',
    'Small steps taken every day will carry you further than one giant leap taken once.',
    'The quick brown fox jumps over the lazy dog while the cat watches the keyboard.',
  ],
  vi: [
    'Có công mài sắt, có ngày nên kim.',
    'Học đi đôi với hành.',
    'Không có việc gì khó, chỉ sợ lòng không bền.',
    'Đi một ngày đàng, học một sàng khôn.',
    'Muốn gõ nhanh, trước hết phải gõ đúng. Tốc độ sẽ đến khi đôi tay đã quen với bàn phím.',
    'Hãy đặt các ngón tay lên hàng phím cơ sở và giữ mắt nhìn vào màn hình.',
    'Máy tính chỉ là công cụ, người sử dụng mới là người tạo ra giá trị.',
    'Mỗi ngày luyện tập mười lăm phút, sau một tháng em sẽ thấy sự khác biệt rõ rệt.',
    'Đừng sợ sai, vì mỗi lần sai là một lần biết thêm điều cần luyện tập.',
    'Lưu bài thường xuyên là thói quen tốt của người làm việc với máy tính.',
    'Ngồi thẳng lưng, thả lỏng vai và giữ cổ tay ngang với bàn phím.',
    'Tiếng Việt có sáu thanh điệu: ngang, huyền, sắc, hỏi, ngã và nặng.',
    'Chú mèo nhỏ ngồi bên bàn phím, chăm chú nhìn từng chữ hiện lên màn hình.',
    'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.',
  ],
};

// Bài luyện theo hàng phím
const HOME = 'asdfghjkl', TOP = 'qwertyuiop', BOT = 'zxcvbnm';
export const LESSONS = [
  { id: 'home', name: 'Hàng phím cơ sở (A S D F – J K L)', letters: HOME },
  { id: 'top', name: 'Hàng trên (Q W E R T Y U I O P)', letters: HOME + TOP, focus: TOP },
  { id: 'bottom', name: 'Hàng dưới (Z X C V B N M)', letters: HOME + BOT, focus: BOT },
  { id: 'all', name: 'Cả ba hàng chữ cái', letters: HOME + TOP + BOT },
  { id: 'num', name: 'Hàng số (1 – 0)', digits: true },
  { id: 'caps', name: 'Chữ hoa và dấu câu', caps: true },
  { id: 'vnmark', name: 'Tiếng Việt: dấu thanh (Telex: s f r x j)', vi: 'má mà mả mã mạ bé bè bẻ bẽ bẹ cá cà cả lá là lả lã lạ tí tì tỉ tị đó đò đỏ đọ thú thù thủ thũ thụ ký kỳ kỷ kỹ' },
  { id: 'vnvowel', name: 'Tiếng Việt: chữ ă â ê ô ơ ư đ', vi: 'ăn mặc khăn tấm cân đất bên đêm tên ông cô sông ơi mơ thơ lớn ưa mưa sửa đi đến đường đẹp đọc đâu dượng tươi người nước được' },
];

function pseudo(letters, focus, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const len = 2 + Math.floor(Math.random() * 4);
    let w = '';
    for (let j = 0; j < len; j++) { const src = focus && Math.random() < 0.55 ? focus : letters; w += src[Math.floor(Math.random() * src.length)]; }
    out.push(w);
  }
  return out;
}
export function lessonWords(lesson, n) {
  if (lesson.vi) { const L = lesson.vi.split(' '); return Array.from({ length: n }, () => L[Math.floor(Math.random() * L.length)]); }
  if (lesson.digits) return Array.from({ length: n }, () => String(Math.floor(Math.random() * (Math.random() < 0.5 ? 100 : 10000))));
  if (lesson.caps) return Array.from({ length: n }, (_, i) => { let w = EN[Math.floor(Math.random() * 120)]; if (Math.random() < 0.5) w = w[0].toUpperCase() + w.slice(1); if (Math.random() < 0.3) w += ',.;:?!'[Math.floor(Math.random() * 6)]; return w; });
  const set = new Set(lesson.letters);
  const real = EN.filter((w) => [...w].every((c) => set.has(c)) && (!lesson.focus || [...w].some((c) => lesson.focus.includes(c))));
  return Array.from({ length: n }, () => (real.length > 8 && Math.random() < 0.5 ? real[Math.floor(Math.random() * real.length)] : pseudo(lesson.letters, lesson.focus, 1)[0]));
}

const PUNCT = [',', '.', '?', '!', ';', ':'];
export function genWords(lang, n, { punct = false, nums = false } = {}) {
  const out = [];
  if (lang === 'vi') {
    while (out.length < n) {
      const start = Math.floor(Math.random() * (VI.length / 2)) * 2; // bắt đầu ở đầu một từ ghép (2 tiếng)
      out.push(VI[start], VI[start + 1] || VI[0]);
    }
  } else for (let i = 0; i < n; i++) out.push(EN[Math.floor(Math.random() * EN.length)]);
  let cap = true;
  return out.slice(0, n).map((w) => {
    if (nums && Math.random() < 0.1) return String(Math.floor(Math.random() * 1000));
    if (punct) {
      if (cap) { w = w[0].toUpperCase() + w.slice(1); cap = false; }
      if (Math.random() < 0.14) { const p = PUNCT[Math.floor(Math.random() * PUNCT.length)]; w += p; if ('.?!'.includes(p)) cap = true; }
    }
    return w;
  });
}
