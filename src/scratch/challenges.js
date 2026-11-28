// Thử thách Scratch – được chấm tự động ngay trên máy bằng cách chạy dự án trong Scratch VM.
// Mỗi thử thách: check(env) trả về danh sách mục [{name, ok, note?}].
// env (xem scratch.js): has(opcode), count(opcode), run({...}) → {says, path, costumeChanges, main, sayAfterAnswer}, varValue(name), setup(...)

export const LEVELS = { 1: 'Làm quen', 2: 'Lặp & thời gian', 3: 'Biến, hỏi đáp, điều kiện' };

const near = (a, b, t = 1.5) => Math.abs(a - b) <= t;

export const CHALLENGES = [
  {
    id: 'sc-buoc-di', level: 1, title: 'Mèo bước đi',
    body: `<p>Khi bấm <b>lá cờ xanh</b>, nhân vật đi <b>100 bước</b> về phía trước.</p>
<div class="codebox">khi bấm vào 🏴
di chuyển (100) bước</div>
<p>Khi chấm, máy đặt nhân vật ở giữa sân khấu (x: 0, y: 0) và quay sang phải.</p>`,
    hint: 'Kéo khối “khi bấm vào lá cờ xanh” (nhóm Sự kiện) rồi gắn khối “di chuyển 10 bước” (nhóm Chuyển động) bên dưới, sửa 10 thành 100.',
    async check(env) {
      const r = await env.run({ flag: true, setup: { x: 0, y: 0, dir: 90 }, ms: 2500 });
      return [
        { name: 'Có khối “khi bấm vào lá cờ xanh”', ok: env.has('event_whenflagclicked') },
        { name: 'Nhân vật đi đúng 100 bước sang phải', ok: near(r.main.x, 100) && near(r.main.y, 0), note: `vị trí sau khi chạy: x = ${Math.round(r.main.x)}, y = ${Math.round(r.main.y)}` },
      ];
    },
  },
  {
    id: 'sc-xin-chao', level: 1, title: 'Lời chào',
    body: `<p>Khi bấm <b>lá cờ xanh</b>, nhân vật nói <code>Xin chào!</code> trong 2 giây.</p>`,
    hint: 'Nhóm Hiển thị có khối “nói … trong … giây”.',
    async check(env) {
      const r = await env.run({ flag: true, ms: 3000 });
      return [
        { name: 'Có khối “khi bấm vào lá cờ xanh”', ok: env.has('event_whenflagclicked') },
        { name: 'Nhân vật nói “Xin chào!”', ok: r.says.some((s) => env.norm(s).includes('xin chao')), note: r.says.length ? `đã nói: ${r.says.map((s) => '“' + s + '”').join(', ')}` : 'nhân vật chưa nói gì' },
      ];
    },
  },
  {
    id: 'sc-phim-mui-ten', level: 1, title: 'Điều khiển bằng phím',
    body: `<p>Bấm phím <b>mũi tên phải</b> → nhân vật đi sang phải <b>10</b> bước.<br>Bấm phím <b>mũi tên trái</b> → nhân vật đi sang trái <b>10</b> bước.</p>
<p>Gợi ý: dùng khối <code>khi bấm phím …</code> và <code>thay đổi x một lượng …</code>.</p>`,
    hint: 'Hai đoạn mã riêng: “khi bấm phím mũi tên phải → thay đổi x một lượng 10” và “khi bấm phím mũi tên trái → thay đổi x một lượng -10”.',
    async check(env) {
      const a = await env.run({ keys: ['ArrowRight'], setup: { x: 0, y: 0, dir: 90 }, ms: 900 });
      const b = await env.run({ keys: ['ArrowLeft'], setup: { x: 0, y: 0, dir: 90 }, ms: 900 });
      return [
        { name: 'Mũi tên phải: x tăng 10', ok: near(a.main.x, 10), note: `x sau khi bấm: ${Math.round(a.main.x)}` },
        { name: 'Mũi tên trái: x giảm 10', ok: near(b.main.x, -10), note: `x sau khi bấm: ${Math.round(b.main.x)}` },
      ];
    },
  },
  {
    id: 'sc-dem-nguoc', level: 2, title: 'Đếm ngược',
    body: `<p>Khi bấm cờ xanh, nhân vật lần lượt nói <code>3</code>, <code>2</code>, <code>1</code> (mỗi số 1 giây) rồi nói <code>Bắt đầu!</code>.</p>
<p>Thử dùng một <b>biến</b> và khối <b>lặp lại</b> thay vì kéo 3 khối nói giống nhau.</p>`,
    hint: 'đặt [số] thành 3 → lặp lại 3 lần { nói (số) trong 1 giây; thay đổi [số] một lượng -1 } → nói “Bắt đầu!”.',
    async check(env) {
      const r = await env.run({ flag: true, ms: 6000 });
      const seq = r.says.map((s) => env.norm(s)).filter(Boolean);
      const i3 = seq.indexOf('3'), i2 = seq.indexOf('2'), i1 = seq.indexOf('1');
      const iGo = seq.findIndex((s) => s.includes('bat dau'));
      return [
        { name: 'Nói 3, 2, 1 theo đúng thứ tự', ok: i3 >= 0 && i2 > i3 && i1 > i2, note: seq.length ? `đã nói: ${r.says.filter(Boolean).join(' → ')}` : 'nhân vật chưa nói gì' },
        { name: 'Cuối cùng nói “Bắt đầu!”', ok: iGo > i1 && i1 >= 0 },
      ];
    },
  },
  {
    id: 'sc-nhay-mua', level: 2, title: 'Nhảy múa',
    body: `<p>Khi bấm cờ xanh, nhân vật <b>đổi trang phục liên tục</b> để trông như đang nhảy múa: ít nhất <b>6 lần</b>, mỗi lần cách nhau một chút.</p>
<p>Dùng <code>lặp lại</code> (hoặc <code>liên tục</code>), <code>trang phục kế tiếp</code> và <code>đợi … giây</code>.</p>`,
    hint: 'lặp lại 10 lần { trang phục kế tiếp; đợi 0.2 giây }',
    async check(env) {
      const r = await env.run({ flag: true, ms: 4000 });
      return [
        { name: 'Có khối lặp (lặp lại / liên tục)', ok: env.has('control_repeat') || env.has('control_forever') },
        { name: 'Có khối “đợi … giây”', ok: env.has('control_wait') },
        { name: 'Đổi trang phục ít nhất 6 lần', ok: r.costumeChanges >= 6, note: `đã đổi ${r.costumeChanges} lần trong 4 giây` },
      ];
    },
  },
  {
    id: 'sc-hinh-vuong', level: 2, title: 'Đi hình vuông',
    body: `<p>Khi bấm cờ xanh, nhân vật đi theo một <b>hình vuông cạnh 100 bước</b> rồi quay về đúng chỗ cũ.</p>
<p>Bắt buộc dùng khối <code>lặp lại 4</code> – một hình vuông có 4 cạnh và 4 góc 90°.</p>`,
    hint: 'lặp lại 4 lần { di chuyển 100 bước; xoay ↻ 90 độ; đợi 0.3 giây }',
    async check(env) {
      const r = await env.run({ flag: true, setup: { x: 0, y: 0, dir: 90 }, ms: 4000 });
      const xs = r.path.map((p) => p[0]), ys = r.path.map((p) => p[1]);
      const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
      return [
        { name: 'Có khối “lặp lại”', ok: env.has('control_repeat') },
        { name: 'Đường đi là hình vuông cạnh 100', ok: near(w, 100, 3) && near(h, 100, 3), note: `khung đường đi: ${Math.round(w)} × ${Math.round(h)}` },
        { name: 'Đi một vòng rồi quay về vị trí ban đầu', ok: w > 50 && near(r.main.x, 0, 2) && near(r.main.y, 0, 2) },
      ];
    },
  },
  {
    id: 'sc-bien-diem', level: 3, title: 'Biến điểm',
    body: `<p>Tạo một biến tên <code>điểm</code>. Khi bấm cờ xanh: đặt <code>điểm</code> bằng 0, rồi dùng <b>lặp lại 10 lần</b> để mỗi lần tăng <code>điểm</code> thêm 1.</p>
<p>Kết thúc chương trình, <code>điểm</code> phải bằng <b>10</b>.</p>`,
    hint: 'Nhóm Các biến → “Tạo một biến” → đặt tên “điểm”. Sau đó: đặt điểm thành 0; lặp lại 10 { thay đổi điểm một lượng 1 }.',
    async check(env) {
      const r = await env.run({ flag: true, ms: 3000, resetVars: { 'điểm': 999 } });
      const v = env.varValue('điểm');
      return [
        { name: 'Có biến tên “điểm”', ok: v !== undefined },
        { name: 'Dùng khối “lặp lại” và “thay đổi … một lượng”', ok: env.has('control_repeat') && env.has('data_changevariableby') },
        { name: 'Điểm cuối cùng bằng 10', ok: Number(r.vars['điểm']) === 10, note: v === undefined ? '' : `giá trị sau khi chạy: ${r.vars['điểm']}` },
      ];
    },
  },
  {
    id: 'sc-hoi-ten', level: 3, title: 'Hỏi tên',
    body: `<p>Khi bấm cờ xanh, nhân vật hỏi <code>Bạn tên gì?</code> rồi chào lại bằng đúng tên vừa nhập, ví dụ nhập <b>Minh</b> thì nói <code>Xin chào Minh</code>.</p>
<p>Dùng <code>hỏi … và đợi</code>, <code>câu trả lời</code> và <code>kết hợp … …</code> (nhóm Các phép toán).</p>`,
    hint: 'hỏi “Bạn tên gì?” và đợi → nói (kết hợp “Xin chào ” (câu trả lời)) trong 2 giây',
    async check(env) {
      const r = await env.run({ flag: true, answers: ['Minh'], ms: 4000 });
      return [
        { name: 'Có khối “hỏi … và đợi”', ok: env.has('sensing_askandwait') },
        { name: 'Nhân vật nói lời chào có tên “Minh”', ok: r.sayAfterAnswer.some((s) => env.norm(s).includes('minh') && env.norm(s).includes('chao')), note: r.sayAfterAnswer.length ? `sau khi trả lời “Minh”, nhân vật nói: ${r.sayAfterAnswer.map((s) => '“' + s + '”').join(', ')}` : 'chưa nói gì sau khi nhận câu trả lời' },
      ];
    },
  },
  {
    id: 'sc-lon-nho', level: 3, title: 'Lớn hay nhỏ?',
    body: `<p>Nhân vật hỏi <code>Nhập một số</code>. Nếu số đó <b>lớn hơn 10</b> thì nói <code>Lớn</code>, ngược lại nói <code>Nhỏ</code>.</p>
<p>Máy sẽ chấm hai lần: nhập 15 và nhập 3.</p>`,
    hint: 'nếu < (câu trả lời) > 10 > thì { nói Lớn } nếu không thì { nói Nhỏ }',
    async check(env) {
      const a = await env.run({ flag: true, answers: ['15'], ms: 3500 });
      const b = await env.run({ flag: true, answers: ['3'], ms: 3500 });
      const said = (r, w) => r.sayAfterAnswer.some((s) => env.norm(s) === w);
      return [
        { name: 'Có khối “nếu … thì … nếu không thì”', ok: env.has('control_if_else') || env.has('control_if') },
        { name: 'Nhập 15 → nói “Lớn”', ok: said(a, 'lon') && !said(a, 'nho'), note: `đã nói: ${a.sayAfterAnswer.join(', ') || '(không)'}` },
        { name: 'Nhập 3 → nói “Nhỏ”', ok: said(b, 'nho') && !said(b, 'lon'), note: `đã nói: ${b.sayAfterAnswer.join(', ') || '(không)'}` },
      ];
    },
  },
];

export const byId = (id) => CHALLENGES.find((c) => c.id === id);
