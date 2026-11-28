// TinHocLab – Phòng Hướng nghiệp (mạch G)
import { GROUPS, ROOMS, CAREERS, QUIZ, DIMS } from './career-data.js';
import { MAILS as SMAILS, CASES as SCASES } from '../safety/safety-data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ls = (k, d = {}) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
const KEY = 'thl.career';
const ST = ls(KEY, { quiz: {} });
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch {} };
const DIMC = { build: '#2346ff', fix: '#19a55a', data: '#8b5cf6', design: '#ff7a1a', protect: '#e0287d', help: '#0ea5e9' };

function showPane(p) { $$('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.p === p)); $$('.pane').forEach((s) => (s.hidden = s.id !== 'p-' + p)); history.replaceState(null, '', '#' + p); if (p === 'me') renderMe(); }
$('#tabs').onclick = (e) => { const a = e.target.closest('a[data-p]'); if (a) showPane(a.dataset.p); };
const roomLinks = (ids) => ids.map((r) => `<a data-nav="${ROOMS[r][1]}">▶ ${esc(ROOMS[r][0])}</a>`).join('');

// ---------- năng lực từ các phòng khác ----------
function skills() {
  const space = Object.keys(ls('thl.space').done || {});
  const sp = (p) => space.filter((id) => id.startsWith(p)).length;
  const safe = ls('thl.safe'); const SAFE_MAX = SMAILS.length + 3 + 1 + SCASES.length;
  const mailOk = Object.entries((safe.mail || {}).ans || {}).filter(([id, v]) => SMAILS.find((m) => m.id === id)?.phish === v).length;
  const caseOk = Object.entries((safe.cases || {}).ans || {}).filter(([id, v]) => SCASES.find((c) => c.id === id)?.a === v).length;
  const safeScore = mailOk + Object.keys((safe.pass || {}).done || {}).length + ((safe.priv || {}).done ? 1 : 0) + caseOk;
  const P = window.Progress || { doneCount: () => 0 };
  const rows = [
    { k: 'A', name: 'Phần cứng', v: P.doneCount('pc'), max: 4, room: 'pc', c: '#c9a400' },
    { k: 'B', name: 'Mạng & Internet', v: Object.keys(ls('thl.net').done || {}).length, max: 9, room: 'net', c: '#19a55a' },
    { k: 'D', name: 'An toàn số', v: safeScore, max: SAFE_MAX, room: 'safe', c: '#e0287d' },
    { k: 'E', name: 'Tin học văn phòng', v: P.doneCount('word') + P.doneCount('excel') + P.doneCount('ppt'), max: 28, room: 'word', c: '#ff7a1a' },
    { k: 'F', name: 'Python', v: sp('py-'), max: 15, room: 'py', c: '#2346ff' },
    { k: 'F', name: 'Web (HTML/CSS/JS)', v: sp('web-'), max: 8, room: 'web', c: '#2346ff' },
    { k: 'F', name: 'C++', v: sp('cpp-'), max: 8, room: 'cpp', c: '#2346ff' },
    { k: 'F', name: 'Scratch', v: Object.keys(ls('thl.scratch').done || {}).length, max: 9, room: 'scratch', c: '#8b5cf6' },
  ];
  rows.forEach((r) => (r.p = Math.min(1, r.v / r.max)));
  const g = (n) => rows.find((r) => r.name === n).p;
  const dims = {
    build: (g('Python') + g('Web (HTML/CSS/JS)') + g('C++') + g('Scratch')) / 4,
    fix: (g('Phần cứng') + g('Mạng & Internet')) / 2,
    data: (g('Python') + g('C++')) / 2 * 0.6 + g('Tin học văn phòng') * 0.4,
    design: g('Web (HTML/CSS/JS)') * 0.5 + g('Scratch') * 0.3 + g('Tin học văn phòng') * 0.2,
    protect: g('An toàn số') * 0.7 + g('Mạng & Internet') * 0.3,
    help: g('Tin học văn phòng') * 0.5 + g('An toàn số') * 0.25 + g('Phần cứng') * 0.25,
  };
  return { rows, dims, space };
}
function quizDims() {
  const d = Object.fromEntries(Object.keys(DIMS).map((k) => [k, 0])), mx = { ...d };
  QUIZ.forEach(([, w], i) => { const a = ST.quiz[i]; for (const k in w) { mx[k] += w[k] * 2; if (a !== undefined) d[k] += w[k] * a; } });
  for (const k in d) d[k] = mx[k] ? d[k] / mx[k] : 0;
  return d;
}
function rank(dq, ds) {
  return CAREERS.map((c) => {
    let s = 0, w = 0; for (const k in c.dims) { s += c.dims[k] * ((dq ? dq[k] : 0) * 0.65 + (ds ? ds[k] : 0) * 0.35); w += c.dims[k]; }
    return { c, s: w ? s / w : 0 };
  }).sort((a, b) => b.s - a.s);
}

// ---------- 1. bản đồ nghề ----------
let grp = 'all', cur = null;
function renderMap() {
  $('#chips').innerHTML = `<button class="chip ${grp === 'all' ? 'on' : ''}" data-g="all">TẤT CẢ</button>` + Object.entries(GROUPS).map(([k, g]) => `<button class="chip ${grp === k ? 'on' : ''}" data-g="${k}"><i style="background:${g.color}"></i>${g.name.toUpperCase()}</button>`).join('');
  const answered = Object.keys(ST.quiz).length >= 6; const top = answered ? rank(quizDims(), skills().dims).slice(0, 3).map((x) => x.c.id) : [];
  $('#cgrid').innerHTML = CAREERS.filter((c) => grp === 'all' || c.g === grp).map((c) => `<div class="cc ${cur === c.id ? 'on' : ''}" data-id="${c.id}" style="--c:${GROUPS[c.g].color}">${top.includes(c.id) ? '<span class="fit">HỢP VỚI EM</span>' : ''}<div class="ic">${c.icon}</div><h3>${esc(c.name)}</h3><p>${esc(c.short)}</p><span class="g">${GROUPS[c.g].name.toUpperCase()}</span></div>`).join('');
  renderDetail();
}
function renderDetail() {
  const c = CAREERS.find((x) => x.id === cur), D = $('#detail');
  if (!c) { D.style.removeProperty('--c'); D.innerHTML = '<div class="empty2">← Chọn một nghề để xem<br>một ngày làm việc, kỹ năng cần có,<br>ngành học và phòng thực hành liên quan.</div>'; return; }
  D.style.setProperty('--c', GROUPS[c.g].color);
  D.innerHTML = `<span class="lb" style="color:${GROUPS[c.g].color}">${GROUPS[c.g].name.toUpperCase()}</span><h3>${c.icon} ${esc(c.name)}</h3><p class="lead2">${esc(c.short)}</p>
    <h5>MỘT NGÀY LÀM VIỆC</h5><p>${esc(c.day)}</p>
    <h5>KỸ NĂNG CẦN CÓ</h5><div class="tagl">${c.skills.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
    <h5>MÔN HỌC NÊN HỌC TỐT</h5><div class="tagl">${c.subjects.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
    <h5>NGÀNH HỌC THAM KHẢO</h5><div class="tagl">${c.majors.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
    ${c.certs.length ? `<h5>CHỨNG CHỈ CÓ THỂ HỮU ÍCH</h5><div class="tagl">${c.certs.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : ''}
    <h5>THỬ NGAY TRONG TINHOCLAB</h5><div class="tagl">${roomLinks(c.rooms)}</div>`;
}
$('#chips').onclick = (e) => { const b = e.target.closest('[data-g]'); if (b) { grp = b.dataset.g; renderMap(); } };
$('#cgrid').onclick = (e) => { const c = e.target.closest('.cc'); if (c) { cur = c.dataset.id; renderMap(); } };

// ---------- 2. trắc nghiệm sở thích ----------
const LK = ['Không thích', 'Bình thường', 'Rất thích'];
function renderQuiz() {
  const n = Object.keys(ST.quiz).length, dq = quizDims();
  const top = n >= 6 ? rank(dq, skills().dims).slice(0, 3) : [];
  $('#quiz').innerHTML = `<div class="qbox"><div class="qcard">${QUIZ.map(([q], i) => `<div class="qrow"><span class="n">${String(i + 1).padStart(2, '0')}</span><span>${esc(q)}</span><span class="lk">${LK.map((l, v) => `<button data-q="${i}" data-v="${v}" class="${ST.quiz[i] === v ? 'on' : ''}">${l}</button>`).join('')}</span></div>`).join('')}</div>
    <div class="side"><span class="lb">KẾT QUẢ (${n}/${QUIZ.length})</span>
      <div class="bars" style="margin-top:10px">${Object.entries(DIMS).map(([k, t]) => `<div style="--c:${DIMC[k]}"><b>${t}<span>${Math.round(dq[k] * 100)}%</span></b><i><u style="width:${dq[k] * 100}%"></u></i></div>`).join('')}</div>
      ${n >= 6 ? `<span class="lb" style="display:block;margin-top:14px">3 NGHỀ GỢI Ý CHO EM</span><ul class="top3">${top.map((x) => `<li data-id="${x.c.id}"><b>${x.c.icon} ${esc(x.c.name)}</b><small>${esc(x.c.short)}</small></li>`).join('')}</ul><p style="font-size:12px;color:var(--mute);margin:6px 0 0">Gợi ý dựa trên sở thích (65%) và kết quả em đã làm trong các phòng TinHocLab (35%). Đây chỉ là tham khảo – sở thích của em sẽ còn thay đổi!</p>`
        : '<p style="font-size:12.5px;color:var(--mute);margin-top:12px">Trả lời ít nhất 6 câu để xem nghề gợi ý.</p>'}
      <button class="bb ghost" id="qReset" style="margin-top:12px">LÀM LẠI</button></div></div>`;
  $$('#quiz [data-q]').forEach((b) => (b.onclick = () => { ST.quiz[+b.dataset.q] = +b.dataset.v; save(); renderQuiz(); }));
  $$('#quiz .top3 li').forEach((li) => (li.onclick = () => { cur = li.dataset.id; grp = 'all'; renderMap(); showPane('map'); }));
  $('#qReset').onclick = () => { ST.quiz = {}; save(); renderQuiz(); };
}

// ---------- 3. hồ sơ năng lực ----------
function renderMe() {
  const { rows, dims } = skills(); const name = (window.Progress && window.Progress.student()) || '';
  $('#meName').textContent = name ? name.toUpperCase() : 'NHẬP TÊN Ở TRANG CHỦ';
  const R = Object.fromEntries(rows.map((r) => [r.name, r]));
  const BADGES = [
    ['🔧', 'Thợ lắp máy', 'Hoàn thành 4/4 bài lắp ráp', R['Phần cứng'].v >= 4],
    ['🛰', 'Kỹ sư mạng nhí', '5 thử thách Phòng Mạng', R['Mạng & Internet'].v >= 5],
    ['🛡', 'Người gác cổng số', '80% Phòng An toàn số', R['An toàn số'].p >= 0.8],
    ['🐍', 'Thợ săn Python', '8 thử thách Python', R['Python'].v >= 8],
    ['🌐', 'Thợ dệt Web', '5 thử thách Web', R['Web (HTML/CSS/JS)'].v >= 5],
    ['⚙', 'Chiến binh C++', '5 thử thách C++', R['C++'].v >= 5],
    ['🐱', 'Nhà sáng tạo Scratch', '6 thử thách Scratch', R['Scratch'].v >= 6],
    ['📄', 'Cao thủ văn phòng', '14 bài Word/Excel/PowerPoint', R['Tin học văn phòng'].v >= 14],
  ];
  const weakest = [...rows].sort((a, b) => a.p - b.p).slice(0, 3);
  const answered = Object.keys(ST.quiz).length >= 6;
  const top = rank(answered ? quizDims() : null, dims).slice(0, 3);
  $('#me').innerHTML = `<div class="meg"><div>
    <div class="panel"><h4>KỸ NĂNG THEO CHƯƠNG TRÌNH TIN HỌC</h4>${rows.map((r) => `<div class="sk" style="--c:${r.c}"><a data-nav="${ROOMS[r.room][1]}">Mạch ${r.k} · ${esc(r.name)}</a><div class="bar"><u style="width:${r.p * 100}%"></u></div><span>${r.v}/${r.max}</span></div>`).join('')}
      <p style="font-size:12px;color:var(--mute);margin:8px 0 0">Số liệu lấy từ kết quả em làm trên máy này. Bấm vào tên để mở phòng tương ứng.</p></div>
    <div class="panel" style="margin-top:18px"><h4>HUY HIỆU</h4><div class="badges">${BADGES.map(([i, t, d, on]) => `<div class="bd ${on ? 'on' : ''}"><b>${i}</b>${t}<small>${d}</small></div>`).join('')}</div></div>
  </div><div>
    <div class="panel"><h4>THẾ MẠNH CỦA EM</h4><div class="bars">${Object.entries(DIMS).map(([k, t]) => `<div style="--c:${DIMC[k]}"><b>${t}<span>${Math.round(dims[k] * 100)}%</span></b><i><u style="width:${dims[k] * 100}%"></u></i></div>`).join('')}</div></div>
    <div class="panel" style="margin-top:18px"><h4>NGHỀ PHÙ HỢP ${answered ? '' : '(LÀM TRẮC NGHIỆM Ở THẺ 02 ĐỂ CHÍNH XÁC HƠN)'}</h4><ul class="top3">${top.map((x) => `<li data-id="${x.c.id}"><b>${x.c.icon} ${esc(x.c.name)}</b><small>${esc(x.c.short)}</small></li>`).join('')}</ul></div>
    <div class="panel" style="margin-top:18px"><h4>NÊN LUYỆN TIẾP</h4><ul class="next">${weakest.map((r) => `<li><a data-nav="${ROOMS[r.room][1]}">${esc(ROOMS[r.room][0])}</a> – mạch ${r.k}, em đang đạt ${Math.round(r.p * 100)}%</li>`).join('')}</ul></div>
  </div></div>`;
  $$('#me .top3 li').forEach((li) => (li.onclick = () => { cur = li.dataset.id; grp = 'all'; renderMap(); showPane('map'); }));
}

// ---------- 4. lộ trình ----------
function renderRoad() {
  $('#road').innerHTML = `<div class="road">
    <div style="--c:var(--yellow)"><span class="st" style="color:#111">THCS</span><h4>Khám phá</h4><ul><li>Học tốt Toán, Tin học, Tiếng Anh.</li><li>Lập trình Scratch, rồi Python.</li><li>Tự lắp ráp, tìm hiểu máy tính, mạng.</li><li>Tham gia CLB Tin học, hội thi Tin học trẻ.</li><li>Rèn kỹ năng an toàn số.</li></ul></div>
    <div style="--c:var(--blue)"><span class="st">THPT</span><h4>Định hướng</h4><ul><li>Môn Tin học lớp 10–12 có hai hướng: <b>Khoa học máy tính</b> và <b>Tin học ứng dụng</b> – chọn theo nghề em thích.</li><li>Làm dự án nhỏ: trang web, ứng dụng, game.</li><li>Lấy chứng chỉ IC3 / MOS nếu cần.</li></ul></div>
    <div style="--c:var(--pink)"><span class="st">SAU THPT</span><h4>Học chuyên sâu</h4><ul><li>Đại học: Khoa học máy tính, Kỹ thuật phần mềm, Công nghệ thông tin, Hệ thống thông tin, An toàn thông tin, Khoa học dữ liệu, Trí tuệ nhân tạo…</li><li>Cao đẳng / trung cấp nghề: quản trị mạng, kỹ thuật máy tính, thiết kế đồ hoạ…</li><li>Tự học trực tuyến + làm dự án thật.</li></ul></div>
    <div style="--c:var(--green)"><span class="st">ĐI LÀM</span><h4>Phát triển</h4><ul><li>Bắt đầu ở vị trí thực tập, nhân viên.</li><li>Học suốt đời: công nghệ thay đổi rất nhanh.</li><li>Chứng chỉ nghề giúp chứng minh năng lực.</li><li>Giữ đạo đức nghề nghiệp: trung thực, tôn trọng dữ liệu người khác.</li></ul></div></div>
  <div class="certs">
    <div class="panel"><span class="lb">TIN HỌC CƠ BẢN</span><h4>IC3 Digital Literacy</h4><p>Kiến thức máy tính, Internet, an toàn số. Ôn ngay trong phòng <a data-nav="../ic3/ic3.html" style="color:var(--blue);font-weight:700">Ôn IC3</a>.</p></div>
    <div class="panel"><span class="lb">VĂN PHÒNG</span><h4>MOS – Word, Excel, PowerPoint</h4><p>Chứng chỉ dùng thành thạo phần mềm văn phòng. Luyện trong <a data-nav="../office/practice.html" style="color:var(--blue);font-weight:700">Luyện tập Office</a>.</p></div>
    <div class="panel"><span class="lb">LẬP TRÌNH</span><h4>Thi lập trình & dự án</h4><p>Các cuộc thi lập trình cho học sinh và sản phẩm em tự làm (đưa lên GitHub) là "hồ sơ" có giá trị.</p></div>
    <div class="panel"><span class="lb">CHUYÊN NGHIỆP</span><h4>Mạng, bảo mật, đám mây</h4><p>Khi lớn hơn: chứng chỉ của hãng thiết bị mạng, chứng chỉ bảo mật, chứng chỉ đám mây. Nền tảng bắt đầu từ <a data-nav="../network/network.html" style="color:var(--blue);font-weight:700">Phòng Mạng</a> và <a data-nav="../safety/safety.html" style="color:var(--blue);font-weight:700">An toàn số</a>.</p></div>
  </div>`;
}

renderMap(); renderQuiz(); renderRoad();
const want = location.hash.slice(1); if (['map', 'quiz', 'me', 'road'].includes(want)) showPane(want);
window.__career = { showPane, skills, rank };
