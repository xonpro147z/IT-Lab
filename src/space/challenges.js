// TinHocLab Space – thử thách lập trình (tự chấm trên máy)
// Python / C++: mỗi test là { in, out }; 2 test đầu (sample) hiện cho học sinh xem, các test sau ẩn.
// Web: mỗi test là { name, js } – đoạn JS chạy trong trang xem trước, trả về true nếu đạt (hoặc chuỗi giải thích nếu chưa đạt).
// Python có thể có { turtle: 'mã JS' } kiểm tra các nét vẽ turtle (biến ops).

export const TRACKS = [
  { id: 'python', name: 'Python', file: 'main.py', lang: 'python', desc: 'Ngôn ngữ dễ học, dùng nhiều trong khoa học dữ liệu và AI.' },
  { id: 'web', name: 'Web', file: 'index.html', lang: 'html', desc: 'HTML dựng khung trang, CSS trang trí, JavaScript làm trang tương tác.' },
  { id: 'cpp', name: 'C++', file: 'main.cpp', lang: 'cpp', desc: 'Ngôn ngữ nhanh, dùng trong thi lập trình và phần mềm hệ thống.' },
];
export const LEVELS = { 1: 'Cơ bản', 2: 'Trung bình', 3: 'Nâng cao' };

const PY = [
  {
    id: 'py-xin-chao', level: 1, title: 'Xin chào, thế giới!',
    body: `Chương trình đầu tiên của mọi lập trình viên.

In ra màn hình đúng một dòng:
\`\`\`
Xin chào, thế giới!
\`\`\`
Gợi ý: dùng hàm \`print()\`.`,
    starter: `# Viết lệnh in ra dòng chữ bên dưới\n`,
    hint: 'print("Xin chào, thế giới!")',
    tests: [{ in: '', out: 'Xin chào, thế giới!' }],
  },
  {
    id: 'py-chao-ten', level: 1, title: 'Chào theo tên',
    body: `Đọc **tên** của một bạn rồi in ra lời chào.

**Đầu vào:** một dòng là tên.
**Đầu ra:** \`Xin chào, <tên>!\``,
    starter: `ten = input()\n# in lời chào ở đây\n`,
    hint: 'Ghép chuỗi: print("Xin chào, " + ten + "!") hoặc dùng f-string: print(f"Xin chào, {ten}!")',
    tests: [{ in: 'An', out: 'Xin chào, An!' }, { in: 'Bình', out: 'Xin chào, Bình!' }, { in: 'Nguyễn Thu Hà', out: 'Xin chào, Nguyễn Thu Hà!' }],
  },
  {
    id: 'py-tong-hai-so', level: 1, title: 'Tổng hai số',
    body: `Đọc hai số nguyên **a** và **b** (mỗi số một dòng), in ra tổng của chúng.

Lưu ý: \`input()\` trả về *chuỗi*, cần đổi sang số bằng \`int()\`.`,
    starter: `a = input()\nb = input()\n`,
    hint: 'a = int(input()) rồi print(a + b)',
    tests: [{ in: '3\n5', out: '8' }, { in: '-4\n10', out: '6' }, { in: '1000000\n2000000', out: '3000000' }, { in: '0\n0', out: '0' }],
  },
  {
    id: 'py-chan-le', level: 1, title: 'Chẵn hay lẻ?',
    body: `Đọc một số nguyên **n**. In \`Chẵn\` nếu n chia hết cho 2, ngược lại in \`Lẻ\`.

Gợi ý: phép chia lấy dư là \`%\`.`,
    starter: `n = int(input())\n`,
    hint: 'if n % 2 == 0: ... else: ...',
    tests: [{ in: '4', out: 'Chẵn' }, { in: '7', out: 'Lẻ' }, { in: '0', out: 'Chẵn' }, { in: '-3', out: 'Lẻ' }, { in: '1000001', out: 'Lẻ' }],
  },
  {
    id: 'py-xep-loai', level: 1, title: 'Xếp loại học lực',
    body: `Đọc điểm trung bình (số thực từ 0 đến 10) và in xếp loại:

| Điểm | Xếp loại |
| từ 8.0 | Giỏi |
| từ 6.5 đến dưới 8.0 | Khá |
| từ 5.0 đến dưới 6.5 | Trung bình |
| dưới 5.0 | Yếu |`,
    starter: `diem = float(input())\n`,
    hint: 'Dùng if / elif / else, kiểm tra từ mức cao xuống thấp.',
    tests: [{ in: '8.5', out: 'Giỏi' }, { in: '6.5', out: 'Khá' }, { in: '8', out: 'Giỏi' }, { in: '7.9', out: 'Khá' }, { in: '5', out: 'Trung bình' }, { in: '4.9', out: 'Yếu' }, { in: '0', out: 'Yếu' }],
  },
  {
    id: 'py-cuu-chuong', level: 1, title: 'Bảng cửu chương',
    body: `Đọc số **n** và in bảng nhân n từ 1 đến 10, mỗi dòng có dạng:
\`\`\`
n x i = kết quả
\`\`\``,
    starter: `n = int(input())\nfor i in range(1, 11):\n    pass  # in một dòng ở đây\n`,
    hint: 'print(f"{n} x {i} = {n * i}")',
    tests: [
      { in: '3', out: [...Array(10)].map((_, i) => `3 x ${i + 1} = ${3 * (i + 1)}`).join('\n') },
      { in: '7', out: [...Array(10)].map((_, i) => `7 x ${i + 1} = ${7 * (i + 1)}`).join('\n') },
      { in: '12', out: [...Array(10)].map((_, i) => `12 x ${i + 1} = ${12 * (i + 1)}`).join('\n') },
    ],
  },
  {
    id: 'py-tong-1-n', level: 2, title: 'Tổng từ 1 đến n',
    body: `Đọc số nguyên dương **n** và in tổng \`1 + 2 + … + n\`.

Thử thách thêm: làm được mà không dùng vòng lặp không?`,
    starter: `n = int(input())\n`,
    hint: 'Dùng vòng for cộng dồn, hoặc công thức n * (n + 1) // 2',
    tests: [{ in: '5', out: '15' }, { in: '1', out: '1' }, { in: '100', out: '5050' }, { in: '1000000', out: '500000500000' }],
  },
  {
    id: 'py-so-nguyen-to', level: 2, title: 'Số nguyên tố',
    body: `Đọc số nguyên **n** (n ≥ 0). In \`YES\` nếu n là số nguyên tố, ngược lại in \`NO\`.

Số nguyên tố là số lớn hơn 1 và chỉ chia hết cho 1 và chính nó.`,
    starter: `n = int(input())\n`,
    hint: 'Chỉ cần thử chia cho các số từ 2 đến căn bậc hai của n.',
    tests: [{ in: '7', out: 'YES' }, { in: '12', out: 'NO' }, { in: '1', out: 'NO' }, { in: '0', out: 'NO' }, { in: '2', out: 'YES' }, { in: '97', out: 'YES' }, { in: '1000003', out: 'YES' }, { in: '999999', out: 'NO' }],
  },
  {
    id: 'py-so-lon-nhat', level: 2, title: 'Số lớn nhất trong dãy',
    body: `Dòng 1 là số lượng phần tử **n**. Dòng 2 gồm n số nguyên cách nhau một dấu cách.

In ra số lớn nhất.`,
    starter: `n = int(input())\nday = list(map(int, input().split()))\n`,
    hint: 'Có hàm max() sẵn, hoặc tự duyệt và giữ lại số lớn nhất.',
    tests: [{ in: '5\n3 9 2 7 4', out: '9' }, { in: '3\n-5 -2 -9', out: '-2' }, { in: '1\n42', out: '42' }, { in: '6\n0 0 0 1 0 0', out: '1' }],
  },
  {
    id: 'py-dao-chuoi', level: 2, title: 'Đảo ngược chuỗi',
    body: `Đọc một dòng chữ và in ra dòng đó theo thứ tự ngược lại.

Ví dụ \`TinHocLab\` → \`baLcoHniT\`.`,
    starter: `s = input()\n`,
    hint: 'Cắt chuỗi với bước -1: s[::-1]',
    tests: [{ in: 'TinHocLab', out: 'baLcoHniT' }, { in: 'abc', out: 'cba' }, { in: 'a', out: 'a' }, { in: 'xin chao', out: 'oahc nix' }],
  },
  {
    id: 'py-fibonacci', level: 2, title: 'Dãy Fibonacci',
    body: `Dãy Fibonacci bắt đầu bằng \`1 1\`, mỗi số sau bằng tổng hai số đứng trước: \`1 1 2 3 5 8 …\`

Đọc **n** (1 ≤ n ≤ 50) và in **n** số đầu tiên của dãy trên một dòng, cách nhau một dấu cách.`,
    starter: `n = int(input())\n`,
    hint: 'Giữ hai biến a, b; mỗi bước: a, b = b, a + b',
    tests: [{ in: '6', out: '1 1 2 3 5 8' }, { in: '1', out: '1' }, { in: '2', out: '1 1' }, { in: '10', out: '1 1 2 3 5 8 13 21 34 55' }, { in: '50', out: fib(50).join(' ') }],
  },
  {
    id: 'py-trung-binh', level: 2, title: 'Điểm trung bình',
    body: `Dòng 1 là số môn **n**, dòng 2 là n điểm (số thực).

In điểm trung bình, **làm tròn 2 chữ số thập phân** (luôn in đủ 2 chữ số, ví dụ \`7.50\`).`,
    starter: `n = int(input())\ndiem = list(map(float, input().split()))\n`,
    hint: 'print(f"{tb:.2f}") sẽ in đủ 2 chữ số sau dấu chấm.',
    tests: [{ in: '3\n8 7 7.5', out: '7.50' }, { in: '4\n10 9 8 7', out: '8.50' }, { in: '1\n6.25', out: '6.25' }, { in: '3\n1 2 2', out: '1.67' }],
  },
  {
    id: 'py-dem-tu', level: 3, title: 'Đếm số từ',
    body: `Đọc một câu và in ra **số từ** trong câu. Các từ được tách bởi một hoặc nhiều dấu cách; đầu và cuối câu có thể thừa dấu cách.`,
    starter: `cau = input()\n`,
    hint: 'split() không truyền tham số sẽ tự bỏ các dấu cách thừa.',
    tests: [{ in: 'Em yeu tin hoc', out: '4' }, { in: '   xin    chao  ', out: '2' }, { in: 'TinHocLab', out: '1' }, { in: 'a b c d e f g', out: '7' }],
  },
  {
    id: 'py-hinh-vuong', level: 1, title: 'Rùa vẽ hình vuông', turtle: true,
    body: `Thư viện **turtle** điều khiển một chú rùa vẽ trên màn hình.

Hãy vẽ một **hình vuông cạnh 100**. Rùa bắt đầu ở giữa, hướng sang phải.
- \`forward(100)\`: đi thẳng 100 bước
- \`left(90)\`: quay trái 90 độ`,
    starter: `from turtle import *\n\n# vẽ hình vuông cạnh 100\n`,
    hint: 'Lặp 4 lần: forward(100) rồi left(90).',
    tests: [{ in: '', out: null }],
    check: `var L=ops.filter(function(o){return o[0]==='line'}); if(L.length<4) return 'Mới vẽ '+L.length+' nét, hình vuông cần 4 cạnh.';
var near=function(a,b){return Math.abs(a-b)<0.5}; var len=function(o){return Math.hypot(o[3]-o[1],o[4]-o[2])};
var four=L.slice(0,4); if(!four.every(function(o){return near(len(o),100)})) return 'Mỗi cạnh phải dài đúng 100.';
var last=four[3]; if(!(near(last[3],four[0][1])&&near(last[4],four[0][2]))) return 'Hình chưa khép kín: điểm cuối chưa trùng điểm đầu.';
return true;`,
  },
  {
    id: 'py-ngoi-sao', level: 3, title: 'Rùa vẽ ngôi sao', turtle: true,
    body: `Vẽ một **ngôi sao 5 cánh**, mỗi nét dài 150.

Gợi ý: sau mỗi nét, rùa quay một góc 144 độ. Thử tô màu bằng \`color("orange")\`, \`begin_fill()\` và \`end_fill()\`.`,
    starter: `from turtle import *\n\n`,
    hint: 'for i in range(5): forward(150); right(144)',
    tests: [{ in: '', out: null }],
    check: `var L=ops.filter(function(o){return o[0]==='line'}); if(L.length<5) return 'Ngôi sao cần 5 nét, em mới vẽ '+L.length+'.';
var five=L.slice(0,5), near=function(a,b){return Math.abs(a-b)<0.5};
if(!five.every(function(o){return near(Math.hypot(o[3]-o[1],o[4]-o[2]),150)})) return 'Mỗi nét phải dài 150.';
if(!(near(five[4][3],five[0][1])&&near(five[4][4],five[0][2]))) return 'Ngôi sao chưa khép kín – góc quay đã đúng 144 độ chưa?';
return true;`,
  },
];

const WEB = [
  {
    id: 'web-tieu-de', level: 1, title: 'Trang web đầu tiên',
    body: `Trong \`index.html\`, tạo:
- một tiêu đề lớn \`<h1>\` với nội dung **Xin chào**
- một đoạn văn \`<p>\` giới thiệu về em (ít nhất 10 ký tự)`,
    files: { 'index.html': `<!DOCTYPE html>\n<html>\n<head>\n  <title>Trang của em</title>\n</head>\n<body>\n\n</body>\n</html>\n` },
    hint: '<h1>Xin chào</h1>\n<p>Em tên là ... học lớp ...</p>',
    tests: [
      { name: 'Có thẻ <h1> nội dung "Xin chào"', js: `var h=document.querySelector('h1'); return !!h && h.textContent.trim()==='Xin chào' || 'Chưa có <h1>Xin chào</h1>';` },
      { name: 'Có đoạn <p> từ 10 ký tự', js: `var p=document.querySelector('p'); return !!p && p.textContent.trim().length>=10 || 'Đoạn <p> còn thiếu hoặc quá ngắn';` },
    ],
  },
  {
    id: 'web-danh-sach', level: 1, title: 'Danh sách sở thích',
    body: `Tạo một danh sách **không đánh số** \`<ul>\` gồm **3** sở thích của em, mỗi sở thích là một thẻ \`<li>\`.`,
    files: { 'index.html': `<!DOCTYPE html>\n<html>\n<body>\n  <h2>Sở thích của em</h2>\n\n</body>\n</html>\n` },
    hint: '<ul>\n  <li>Đọc sách</li>\n  ...\n</ul>',
    tests: [
      { name: 'Có thẻ <ul>', js: `return !!document.querySelector('ul') || 'Chưa có <ul>';` },
      { name: 'Có đúng 3 mục <li> không rỗng', js: `var L=[].slice.call(document.querySelectorAll('ul > li')); return L.length===3 && L.every(function(l){return l.textContent.trim()}) || 'Đang có '+L.length+' mục <li>';` },
    ],
  },
  {
    id: 'web-lien-ket', level: 1, title: 'Liên kết và hình ảnh',
    body: `Tạo:
- một liên kết \`<a>\` tới **https://scratch.mit.edu** với chữ hiển thị **Scratch**
- một ảnh \`<img>\` có thuộc tính \`alt\` mô tả ảnh (ảnh nào cũng được, kể cả chưa hiện)`,
    files: { 'index.html': `<!DOCTYPE html>\n<html>\n<body>\n\n</body>\n</html>\n` },
    hint: '<a href="https://scratch.mit.edu">Scratch</a>\n<img src="meo.png" alt="Chú mèo Scratch">',
    tests: [
      { name: 'Liên kết đúng địa chỉ và chữ', js: `var a=document.querySelector('a'); if(!a) return 'Chưa có thẻ <a>'; if(!/^https:\\/\\/scratch\\.mit\\.edu\\/?$/.test(a.getAttribute('href')||'')) return 'href chưa đúng'; return a.textContent.trim()==='Scratch' || 'Chữ hiển thị phải là Scratch';` },
      { name: 'Ảnh có alt mô tả', js: `var i=document.querySelector('img'); return !!i && (i.getAttribute('alt')||'').trim().length>=3 || 'Thẻ <img> cần alt mô tả ảnh';` },
    ],
  },
  {
    id: 'web-mau-chu', level: 1, title: 'Tô màu bằng CSS',
    body: `Trong \`style.css\`:
- chữ của \`h1\` màu **đỏ** (\`red\`)
- nền trang (\`body\`) màu **#fff7e6**
- chữ trong \`p\` cỡ **18px**`,
    files: { 'index.html': `<!DOCTYPE html>\n<html>\n<head><link rel="stylesheet" href="style.css"></head>\n<body>\n  <h1>CSS thật vui</h1>\n  <p>CSS giúp trang web đẹp hơn.</p>\n</body>\n</html>\n`, 'style.css': `/* viết CSS ở đây */\n` },
    hint: 'h1 { color: red; }\nbody { background: #fff7e6; }\np { font-size: 18px; }',
    tests: [
      { name: 'h1 màu đỏ', js: `return getComputedStyle(document.querySelector('h1')).color==='rgb(255, 0, 0)' || 'Màu h1 đang là '+getComputedStyle(document.querySelector('h1')).color;` },
      { name: 'Nền body #fff7e6', js: `return getComputedStyle(document.body).backgroundColor==='rgb(255, 247, 230)' || 'Nền body chưa đúng';` },
      { name: 'Chữ p cỡ 18px', js: `return getComputedStyle(document.querySelector('p')).fontSize==='18px' || 'Cỡ chữ p đang là '+getComputedStyle(document.querySelector('p')).fontSize;` },
    ],
  },
  {
    id: 'web-the-card', level: 2, title: 'Thẻ giới thiệu',
    body: `Trang đã có \`<div class="card">\`. Hãy dùng CSS để thẻ:
- có khoảng đệm (\`padding\`) ít nhất **16px**
- bo góc (\`border-radius\`) ít nhất **8px**
- có viền hoặc bóng đổ (\`border\` hoặc \`box-shadow\`)
- rộng không quá **400px**`,
    files: { 'index.html': `<!DOCTYPE html>\n<html>\n<head><link rel="stylesheet" href="style.css"></head>\n<body>\n  <div class="card">\n    <h2>Nguyễn An</h2>\n    <p>Lớp 8A · Thích lập trình và bóng rổ</p>\n  </div>\n</body>\n</html>\n`, 'style.css': `.card {\n\n}\n` },
    hint: '.card { padding: 20px; border-radius: 12px; border: 1px solid #ddd; max-width: 360px; }',
    tests: [
      { name: 'padding ≥ 16px', js: `var s=getComputedStyle(document.querySelector('.card')); return ['Top','Right','Bottom','Left'].every(function(k){return parseFloat(s['padding'+k])>=16}) || 'padding chưa đủ 16px ở mọi phía';` },
      { name: 'Bo góc ≥ 8px', js: `return parseFloat(getComputedStyle(document.querySelector('.card')).borderTopLeftRadius)>=8 || 'border-radius chưa đủ 8px';` },
      { name: 'Có viền hoặc bóng', js: `var s=getComputedStyle(document.querySelector('.card')); return (parseFloat(s.borderTopWidth)>0 && s.borderTopStyle!=='none') || (s.boxShadow && s.boxShadow!=='none') || 'Chưa có border hoặc box-shadow';` },
      { name: 'Rộng không quá 400px', js: `return document.querySelector('.card').getBoundingClientRect().width<=400 || 'Thẻ đang rộng '+Math.round(document.querySelector('.card').getBoundingClientRect().width)+'px';` },
    ],
  },
  {
    id: 'web-bo-dem', level: 2, title: 'Nút bấm đếm số',
    body: `Trang có nút \`#btn\` và số \`#count\` (ban đầu là 0).

Trong \`script.js\`, mỗi lần bấm nút thì số tăng thêm 1.`,
    files: { 'index.html': `<!DOCTYPE html>\n<html>\n<body>\n  <button id="btn">Bấm tôi</button>\n  <p>Đã bấm: <span id="count">0</span> lần</p>\n  <script src="script.js"></script>\n</body>\n</html>\n`, 'script.js': `const btn = document.getElementById('btn');\nconst count = document.getElementById('count');\n\n` },
    hint: "let n = 0;\nbtn.addEventListener('click', () => { n++; count.textContent = n; });",
    tests: [
      { name: 'Ban đầu là 0', js: `return document.getElementById('count').textContent.trim()==='0' || 'Ban đầu phải hiện 0';` },
      { name: 'Bấm 3 lần → 3', js: `var b=document.getElementById('btn'); b.click(); b.click(); b.click(); return document.getElementById('count').textContent.trim()==='3' || 'Sau 3 lần bấm đang hiện '+document.getElementById('count').textContent;` },
    ],
  },
  {
    id: 'web-che-do-toi', level: 2, title: 'Chế độ tối',
    body: `Bấm nút \`#toggle\` thì thêm class \`dark\` vào \`<body>\`; bấm lần nữa thì bỏ đi.

Trong CSS, khi body có class \`dark\`: nền **#111**, chữ **#eee**.`,
    files: { 'index.html': `<!DOCTYPE html>\n<html>\n<head><link rel="stylesheet" href="style.css"></head>\n<body>\n  <h1>Chế độ tối</h1>\n  <button id="toggle">Đổi giao diện</button>\n  <script src="script.js"></script>\n</body>\n</html>\n`, 'style.css': `body { background: #fff; color: #111; }\n`, 'script.js': `` },
    hint: "document.getElementById('toggle').onclick = () => document.body.classList.toggle('dark');\n/* CSS */ body.dark { background: #111; color: #eee; }",
    tests: [
      { name: 'Bấm 1 lần → có class dark', js: `document.getElementById('toggle').click(); return document.body.classList.contains('dark') || 'Chưa thêm class dark';` },
      { name: 'Màu khi tối đúng', js: `var s=getComputedStyle(document.body); return (s.backgroundColor==='rgb(17, 17, 17)' && s.color==='rgb(238, 238, 238)') || 'Nền/chữ khi tối chưa đúng';` },
      { name: 'Bấm lần nữa → bỏ class dark', js: `document.getElementById('toggle').click(); return !document.body.classList.contains('dark') || 'Bấm lần 2 phải bỏ class dark';` },
    ],
  },
  {
    id: 'web-loi-chao', level: 3, title: 'Ô nhập lời chào',
    body: `Người dùng gõ tên vào ô \`#ten\` rồi bấm nút \`#chao\`. Hiện vào \`#loi-chao\` dòng **Xin chào, <tên>!**

Nếu ô trống thì hiện **Hãy nhập tên.**`,
    files: { 'index.html': `<!DOCTYPE html>\n<html>\n<body>\n  <input id="ten" placeholder="Tên của em">\n  <button id="chao">Chào</button>\n  <p id="loi-chao"></p>\n  <script src="script.js"></script>\n</body>\n</html>\n`, 'script.js': `` },
    hint: "Lấy giá trị bằng document.getElementById('ten').value.trim()",
    tests: [
      { name: 'Ô trống → nhắc nhập tên', js: `document.getElementById('ten').value=''; document.getElementById('chao').click(); return document.getElementById('loi-chao').textContent.trim()==='Hãy nhập tên.' || 'Đang hiện: '+document.getElementById('loi-chao').textContent;` },
      { name: 'Nhập "Lan" → Xin chào, Lan!', js: `document.getElementById('ten').value='Lan'; document.getElementById('chao').click(); return document.getElementById('loi-chao').textContent.trim()==='Xin chào, Lan!' || 'Đang hiện: '+document.getElementById('loi-chao').textContent;` },
      { name: 'Bỏ dấu cách thừa', js: `document.getElementById('ten').value='  Minh  '; document.getElementById('chao').click(); return document.getElementById('loi-chao').textContent.trim()==='Xin chào, Minh!' || 'Nên dùng trim() để bỏ dấu cách thừa';` },
    ],
  },
];


const CPP = [
  {
    id: 'cpp-xin-chao', level: 1, title: 'Xin chào C++',
    body: `In ra màn hình đúng một dòng:
\`\`\`
Xin chào, C++!
\`\`\`
Trong C++, in bằng \`cout << ... << endl;\` – nhớ dấu chấm phẩy cuối câu lệnh.`,
    starter: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // in ra lời chào\n\n    return 0;\n}\n`,
    hint: 'cout << "Xin chào, C++!" << endl;',
    tests: [{ in: '', out: 'Xin chào, C++!' }],
  },
  {
    id: 'cpp-tong-hai-so', level: 1, title: 'Tổng hai số',
    body: `Đọc hai số nguyên **a**, **b** (cách nhau bởi dấu cách hoặc xuống dòng) và in tổng.

Dùng \`long long\` vì a, b có thể tới 10⁹.`,
    starter: `#include <iostream>\nusing namespace std;\n\nint main() {\n    long long a, b;\n    cin >> a >> b;\n\n    return 0;\n}\n`,
    hint: 'cout << a + b << endl;',
    tests: [{ in: '3 5', out: '8' }, { in: '-4\n10', out: '6' }, { in: '1000000000 1000000000', out: '2000000000' }, { in: '0 0', out: '0' }],
  },
  {
    id: 'cpp-chan-le', level: 1, title: 'Chẵn hay lẻ?',
    body: `Đọc số nguyên **n**. In \`Chan\` nếu n chẵn, ngược lại in \`Le\` (không dấu).`,
    starter: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n\n    return 0;\n}\n`,
    hint: 'if (n % 2 == 0) cout << "Chan"; else cout << "Le";',
    tests: [{ in: '4', out: 'Chan' }, { in: '7', out: 'Le' }, { in: '0', out: 'Chan' }, { in: '-3', out: 'Le' }],
  },
  {
    id: 'cpp-giai-thua', level: 2, title: 'Giai thừa',
    body: `Đọc **n** (0 ≤ n ≤ 20) và in **n!** = 1 × 2 × … × n (quy ước 0! = 1).

20! rất lớn, cần kiểu \`long long\`.`,
    starter: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n\n    return 0;\n}\n`,
    hint: 'long long gt = 1; for (int i = 2; i <= n; i++) gt *= i;',
    tests: [{ in: '5', out: '120' }, { in: '0', out: '1' }, { in: '1', out: '1' }, { in: '10', out: '3628800' }, { in: '20', out: '2432902008176640000' }],
  },
  {
    id: 'cpp-tong-chu-so', level: 2, title: 'Tổng các chữ số',
    body: `Đọc số nguyên dương **n** (tới 10¹⁸) và in tổng các chữ số của n.

Gợi ý: \`n % 10\` lấy chữ số cuối, \`n / 10\` bỏ chữ số cuối.`,
    starter: `#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n;\n    cin >> n;\n\n    return 0;\n}\n`,
    hint: 'while (n > 0) { s += n % 10; n /= 10; }',
    tests: [{ in: '1234', out: '10' }, { in: '9', out: '9' }, { in: '1000000000000000000', out: '1' }, { in: '987654321', out: '45' }],
  },
  {
    id: 'cpp-max', level: 2, title: 'Số lớn nhất',
    body: `Dòng 1 là **n**, dòng 2 gồm n số nguyên. In ra số lớn nhất.`,
    starter: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n\n    return 0;\n}\n`,
    hint: 'Đọc số đầu tiên làm mx, rồi so sánh từng số còn lại.',
    tests: [{ in: '5\n3 9 2 7 4', out: '9' }, { in: '3\n-5 -2 -9', out: '-2' }, { in: '1\n42', out: '42' }],
  },
  {
    id: 'cpp-sap-xep', level: 2, title: 'Sắp xếp tăng dần',
    body: `Dòng 1 là **n**, dòng 2 gồm n số nguyên. In dãy đã **sắp xếp tăng dần** trên một dòng, cách nhau một dấu cách.

Gợi ý: \`vector<int>\` và \`sort\` trong \`<algorithm>\`.`,
    starter: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n\n    return 0;\n}\n`,
    hint: 'sort(a.begin(), a.end()); rồi in từng phần tử.',
    tests: [{ in: '5\n3 9 2 7 4', out: '2 3 4 7 9' }, { in: '1\n5', out: '5' }, { in: '6\n0 -1 5 -1 3 0', out: '-1 -1 0 0 3 5' }],
  },
  {
    id: 'cpp-dem-nguyen-to', level: 3, title: 'Đếm số nguyên tố',
    body: `Đọc **n** (1 ≤ n ≤ 10⁶). In số lượng số nguyên tố **không vượt quá n**.

Thử thách: chương trình phải chạy nhanh với n = 10⁶ – hãy tìm hiểu **sàng Eratosthenes**.`,
    starter: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n\n    return 0;\n}\n`,
    hint: 'vector<bool> la(n + 1, true); đánh dấu bội của từng số nguyên tố là false.',
    tests: [{ in: '10', out: '4' }, { in: '1', out: '0' }, { in: '2', out: '1' }, { in: '100', out: '25' }, { in: '1000000', out: '78498' }],
  },
];

function fib(n) { const r = []; let a = 1, b = 1; for (let i = 0; i < n; i++) { r.push(a); [a, b] = [b, a + b]; } return r; }

export const CHALLENGES = [
  ...PY.map((c) => ({ ...c, track: 'python' })),
  ...WEB.map((c) => ({ ...c, track: 'web' })),
  ...CPP.map((c) => ({ ...c, track: 'cpp' })),
];
export const byId = (id) => CHALLENGES.find((c) => c.id === id);
