// Khu giáo viên – thẻ "Đấu trường": tạo phòng có mã, sảnh chờ, điều khiển từng câu, bảng xếp hạng, bục vinh quang.
import { qText, answerText, TYPE_LABEL } from './qrender.js';
import { portrait } from './world/portrait.js';

const DOMS = ['Kiến thức cơ bản về công nghệ', 'Công dân số', 'Quản lí thông tin', 'Sáng tạo nội dung', 'Truyền thông', 'Cộng tác', 'An toàn và bảo mật'];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let ST = null, timer = 0, lastPhaseKey = '', ctx = null;

export function paneArena(c) {
  ctx = c; const { T } = c;
  clearInterval(timer);
  T.arena('state').then((s) => { ST = s; render(); });
  timer = setInterval(async () => {
    if (!document.querySelector('#arenaPane')) { clearInterval(timer); return; }
    if (ST && (ST.phase === 'question')) { ST = await T.arena('state'); render(true); }
    else tickClock();
  }, 500);
}
export function onArenaEvent(s) { if (!document.querySelector('#arenaPane')) return; ST = s; render(true); }

function tickClock() { const el = document.querySelector('#arClock'); if (el && ST) el.textContent = ST.phase !== 'question' ? '' : ST.startIn > 0 ? 'Chuẩn bị…' : Math.ceil(ST.timeLeft / 1000) + ' s'; }

async function render(soft) {
  const { esc, $, T, toast, sure } = ctx; const P = $('#pane'); if (!P) return;
  if (!ST) return renderSetup();
  const key = ST.phase + ':' + ST.qi;
  // tránh vẽ lại toàn bộ khi chỉ đổi số liệu
  if (soft && key === lastPhaseKey && document.querySelector('#arenaPane')) return updateLive();
  lastPhaseKey = key;
  const players = ST.players || [];
  const head = `<div class="card arhead"><div><div class="arlbl">MÃ PHÒNG</div><div class="arcode">${ST.code.replace(/(\d{3})(\d{3})/, '$1 $2')}</div></div>
    <div class="arinfo"><b>${esc(ST.title)}</b><span>${ST.total} câu · ${ST.time} giây/câu · <span id="arN">${players.length}</span> học sinh</span>
    <small>Học sinh mở <b>Ôn IC3</b> → đi tới <b>Đấu trường</b> trên Đảo IC3 → nhập mã phòng.</small>
    <small class="arnet" id="arNet">${netLine()}</small></div>
    <div class="arbtns" id="arBtns"></div></div>`;
  let body = '';
  if (ST.phase === 'lobby') body = `<div class="card arlobby"><h3>Sảnh chờ <span class="muted" id="arWait">${players.length ? '' : '– đang chờ học sinh vào phòng…'}</span></h3><div class="argrid" id="arGrid">${players.map(pcard).join('')}</div></div>`;
  if (ST.phase === 'question' || ST.phase === 'reveal') {
    const q = ST.q;
    body = `<div class="arq"><div class="card arqbox"><div class="arqtop"><span class="pill">Câu ${ST.qi + 1}/${ST.total}</span><span class="pill">${TYPE_LABEL[q.t]}</span><span class="arclock" id="arClock"></span></div>
      <div class="arqtext">${qText(q)}</div>
      ${q.t === 'one' ? `<div class="aropts">${q.o.map((o, i) => `<div class="aro c${i % 4} ${ST.phase === 'reveal' && q.a === i ? 'ok' : ''} ${ST.phase === 'reveal' && q.a !== i ? 'dim' : ''}"><b>${'ABCD'[i] || i + 1}</b>${esc(o)}<span class="arcnt" data-o="${i}"></span></div>`).join('')}</div>` : ''}
      ${ST.phase === 'reveal' ? `<div class="arans">✅ Đáp án: <b>${esc(answerText(q))}</b></div>` : ''}
      <div class="arprog"><i id="arBar"></i></div><div class="muted" id="arAnsN"></div></div>
      <div class="card arside"><h3>Bảng xếp hạng</h3><ol class="arrank" id="arRank"></ol></div></div>`;
  }
  if (ST.phase === 'end') {
    const top = players.slice(0, 3);
    body = `<div class="card arend"><h3>🏆 Kết quả trận đấu</h3><div class="arpod">${[1, 0, 2].filter((i) => top[i]).map((i) => `<div class="pd p${i + 1}"><div class="pav">${portrait(top[i].look, 64)}</div><b>${esc(top[i].name)}</b><span>${top[i].score} điểm</span><div class="blk">${i + 1}</div></div>`).join('')}</div>
      <table class="tbl"><tr><th>Hạng</th><th>Học sinh</th><th>Lớp</th><th>Đúng</th><th>Điểm</th></tr>${players.map((p) => `<tr><td>${['🥇', '🥈', '🥉'][p.rank - 1] || p.rank}</td><td>${esc(p.name)}</td><td>${esc(p.class)}</td><td>${p.correct}/${ST.qi + 1}</td><td><b>${p.score}</b></td></tr>`).join('')}</table>
      <p class="muted" style="margin:10px 0 0">Kết quả đã được lưu vào thẻ "Kết quả" (chế độ Đấu trường).</p></div>`;
  }
  P.innerHTML = `<div id="arenaPane">${head}${body}</div>`;
  const B = $('#arBtns');
  const btn = (t, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = t; b.onclick = fn; B.appendChild(b); return b; };
  const act = async (op, arg) => { ST = await T.arena(op, arg); render(); };
  if (ST.phase === 'lobby') { const b = btn('▶ Bắt đầu', 'red', () => act('next')); b.id = 'arStart'; b.disabled = !players.length; }
  if (ST.phase === 'question') btn('⏭ Kết thúc câu này', 'ghost', () => act('next'));
  if (ST.phase === 'reveal') btn(ST.qi + 1 >= ST.total ? '🏆 Xem kết quả' : '▶ Câu tiếp theo', 'red', () => act('next'));
  if (ST.phase !== 'end' && ST.phase !== 'lobby') btn('Dừng trận', 'ghost', async () => { if (await sure('Dừng trận đấu?', 'Kết quả đến câu hiện tại sẽ được lưu.', 'Dừng')) act('end'); });
  if (ST.phase === 'end') btn('＋ Trận mới', 'red', async () => { await T.arena('close'); ST = null; render(); });
  btn('Đóng phòng', 'ghost', async () => { if (ST.phase === 'end' || await sure('Đóng phòng?', 'Học sinh trong phòng sẽ bị thoát ra.', 'Đóng phòng', true)) { await T.arena('close'); ST = null; render(); } });
  P.querySelectorAll('[data-kick]').forEach((b) => (b.onclick = async (e) => { e.stopPropagation(); ST = await T.arena('kick', b.dataset.kick); toast('Đã mời học sinh ra khỏi phòng'); render(); }));
  updateLive();
}
const pcard = (p) => `<div class="arp ${p.online ? '' : 'off'}"><span class="pav">${portrait(p.look, 46)}</span><span><b>${ctx.esc(p.name)}</b><small>${ctx.esc(p.class)}${p.net === 'web' ? ' · 🌐' : ''}</small></span><button class="x" data-kick="${p.pid}" title="Mời ra khỏi phòng">×</button></div>`;
function netLine() {
  const c = ST && ST.cloud;
  if (!c || !c.on) return '🖧 Chỉ trong mạng LAN của phòng máy';
  if (c.ok) return `🖧 LAN + 🌐 Internet – học sinh ở nhà cũng vào được${c.players ? ` (${c.players} em qua Internet)` : ''}`;
  return '🖧 LAN · 🌐 ' + ctx.esc(c.msg || 'Đang nối Internet…');
}
function updateLive() {
  const { esc, $ } = ctx; if (!ST) return;
  const nl = $('#arNet'); if (nl) nl.innerHTML = netLine();
  const players = ST.players || [];
  const n = $('#arN'); if (n) n.textContent = players.length;
  if (ST.phase === 'lobby') {
    const g = $('#arGrid'); if (g && g.children.length !== players.length) { g.innerHTML = players.map(pcard).join(''); g.querySelectorAll('[data-kick]').forEach((b) => (b.onclick = async () => { ST = await ctx.T.arena('kick', b.dataset.kick); render(); })); }
    const w = $('#arWait'); if (w) w.textContent = players.length ? '' : '– đang chờ học sinh vào phòng…';
    const s = $('#arStart'); if (s) s.disabled = !players.length;
  }
  if (ST.phase === 'question' || ST.phase === 'reveal') {
    tickClock();
    const d = ST.dist || { answered: 0, n: players.length };
    const a = $('#arAnsN'); if (a) a.textContent = `${d.answered}/${d.n} học sinh đã trả lời${ST.phase === 'reveal' ? ` · ${d.right} đúng` : ''}`;
    const bar = $('#arBar'); if (bar) bar.style.width = (ST.phase === 'reveal' ? 0 : Math.min(100, (ST.timeLeft / (ST.time * 1000)) * 100)) + '%';
    if (ST.phase === 'reveal' && d.opts) document.querySelectorAll('.arcnt').forEach((el) => (el.textContent = d.opts[+el.dataset.o] + ' người'));
    const r = $('#arRank'); if (r) r.innerHTML = players.slice(0, 10).map((p) => `<li><span class="pav">${portrait(p.look, 30)}</span><span class="nm">${esc(p.name)}</span>${ST.phase === 'question' ? `<span class="st ${p.answered ? 'on' : ''}">${p.answered ? '✓' : '…'}</span>` : p.last ? `<span class="st ${p.last.ok ? 'ok' : 'no'}">${p.last.ok ? '+' + p.last.pts : '✗'}</span>` : '<span class="st no">–</span>'}<b>${p.score}</b></li>`).join('');
  }
}

function renderSetup() {
  const { $, T, toast, esc } = ctx;
  T.lib().then((lib) => {
    const sets = (lib.sets || []).filter((s) => s.qs && s.qs.length);
    $('#pane').innerHTML = `<div id="arenaPane"><div class="card arsetup"><div class="arsico">⚔️</div><div style="flex:1"><h3>Tạo phòng thi đấu</h3><p class="muted">Học sinh vào <b>Đấu trường</b> trên Đảo IC3, nhập mã phòng để vào sảnh chờ. Khi đủ người, thầy cô bấm <b>Bắt đầu</b>. Trả lời đúng và nhanh được nhiều điểm hơn, đúng liên tiếp 3 câu được thưởng thêm.</p>
      <div class="arform">
        <label>Tên trận<input class="field" id="arTitle" value="Đấu trường IC3"></label>
        <label>Nguồn câu hỏi<select class="field" id="arSrc">
          <optgroup label="Ngân hàng câu hỏi"><option value="L1">Level 1 – tất cả chủ đề</option><option value="L2">Level 2 – tất cả chủ đề</option>${[1, 2].map((l) => DOMS.map((d, i) => `<option value="L${l}-D${i + 1}">Level ${l} – ${d}</option>`).join('')).join('')}</optgroup>
          ${sets.length ? `<optgroup label="Đề thầy cô soạn">${sets.map((s) => `<option value="S:${esc(s.id)}">${esc(s.title)} (${s.qs.length} câu)</option>`).join('')}</optgroup>` : ''}
        </select></label>
        <label>Số câu<select class="field" id="arCount">${[5, 10, 15, 20, 30].map((n) => `<option ${n === 10 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>Thời gian mỗi câu<select class="field" id="arTime">${[10, 15, 20, 30, 45, 60].map((n) => `<option value="${n}" ${n === 20 ? 'selected' : ''}>${n} giây</option>`).join('')}</select></label>
        <label class="chk"><input type="checkbox" id="arSimple" checked> Chỉ dùng câu chọn đáp án (hợp thi đấu nhanh)</label>
      </div>
      <button class="btn red" id="arCreate" style="margin-top:14px">⚔️ Tạo phòng</button></div></div>
      <div class="card arcloud" id="arCloud"></div></div>`;
    cloudCard();
    $('#arCreate').onclick = async () => {
      const src = $('#arSrc').value, n = +$('#arCount').value, simple = $('#arSimple').checked;
      let pool;
      if (src.startsWith('S:')) { const s = sets.find((x) => x.id === src.slice(2)); pool = s.qs.map((q) => ({ ...q })); }
      else { const [lv, dm] = src.split('-'); pool = (lv === 'L1' ? ctx.L1 : ctx.L2).filter((q) => !dm || 'D' + q.d === dm); }
      if (simple) { const p2 = pool.filter((q) => q.t === 'one' || q.t === 'multi' || q.t === 'yesno'); if (p2.length >= Math.min(n, 5)) pool = p2; }
      if (!pool.length) return toast('Nguồn này chưa có câu hỏi.');
      const qs = shuffle(pool).slice(0, n).map((q) => { const x = { ...q }; delete x._set; delete x._base; delete x.okm; delete x.nom; return x; });
      try { ST = await T.arena('create', { title: $('#arTitle').value, qs, time: +$('#arTime').value }); render(); }
      catch (e) { toast('Không tạo được phòng: ' + e.message); }
    };
  });
}

// ---------------- Thi qua Internet (Firebase) ----------------
const IC = () => window.desktop && window.desktop.ic3;
async function cloudCard() {
  const { $, esc, toast } = ctx, box = $('#arCloud'); if (!box || !IC()) return;
  const info = await IC().cloudInfo();
  if (info.on) {
    box.innerHTML = `<div class="arcl-h"><span class="arcl-ico">🌐</span><div><h3>Thi qua Internet: <span class="okc">đã bật</span></h3>
      <p class="muted">Mỗi phòng thầy cô tạo sẽ mở cả trong mạng LAN lẫn qua Internet (Firebase: <code>${esc(info.host)}</code>). Học sinh ở nhà nhập cùng mã phòng là vào được.</p></div></div>
      ${info.src === 'user' ? `<div class="arcl-share"><b>Mã kết nối cho máy học sinh</b> <small class="muted">(mỗi máy học sinh chỉ cần dán một lần: Đảo IC3 → Đấu trường → "🌐 Cài kết nối Internet")</small>
      <div class="arcl-code"><input class="field" readonly value="${esc(info.share)}" id="arShare"><button class="btn" id="arCopy">Sao chép</button></div></div>` : '<p class="muted">Kết nối đã được cài sẵn trong bản cài TinHocLab này – máy học sinh không cần làm gì thêm.</p>'}
      <div class="arcl-btns"><button class="btn ghost" id="arTest">Kiểm tra kết nối</button>${info.src === 'user' ? '<button class="btn ghost" id="arOff">Tắt thi qua Internet</button>' : ''}</div>`;
    $('#arCopy') && ($('#arCopy').onclick = () => { navigator.clipboard.writeText(info.share); toast('Đã sao chép mã kết nối'); });
    $('#arTest').onclick = async () => { $('#arTest').disabled = true; const r = await IC().cloudTest(); $('#arTest').disabled = false; toast(r.ok ? '✅ Kết nối Firebase tốt' : '⚠️ ' + r.msg); };
    $('#arOff') && ($('#arOff').onclick = async () => { await IC().cloudClear(); cloudCard(); });
    return;
  }
  box.innerHTML = `<div class="arcl-h"><span class="arcl-ico">🌐</span><div><h3>Thi qua Internet <span class="muted" style="font-weight:600">– miễn phí, không bắt buộc</span></h3>
    <p class="muted">Hiện Đấu trường chỉ chạy trong mạng LAN của phòng máy. Muốn học sinh ở nhà cũng vào thi được, thầy cô tạo một dự án <b>Firebase</b> (gói Spark miễn phí, không cần thẻ) rồi dán đoạn cấu hình vào đây.</p></div></div>
    <details class="arcl-guide"><summary>Hướng dẫn 5 bước (khoảng 10 phút)</summary><ol>
      <li>Vào <b>console.firebase.google.com</b> bằng tài khoản Google → <b>Tạo dự án</b> (có thể tắt Google Analytics).</li>
      <li>Menu <b>Build → Authentication</b> → <b>Get started</b> → thẻ <b>Sign-in method</b> → bật <b>Anonymous</b> (Ẩn danh).</li>
      <li>Menu <b>Build → Realtime Database</b> → <b>Create database</b> → chọn vị trí <b>Singapore</b> → chọn <b>Start in locked mode</b>.</li>
      <li>Thẻ <b>Rules</b> của Realtime Database → xoá hết, dán đoạn quy tắc bên dưới → <b>Publish</b>.<div class="arcl-code"><textarea class="field" readonly id="arRules" rows="3"></textarea><button class="btn" id="arCopyRules">Sao chép quy tắc</button></div></li>
      <li>Biểu tượng ⚙️ <b>Project settings</b> → mục <b>Your apps</b> → bấm biểu tượng <b>&lt;/&gt;</b> (Web) → đặt tên bất kì → <b>Register app</b> → sao chép cả đoạn <code>const firebaseConfig = {…}</code> và dán vào ô dưới.</li>
    </ol></details>
    <textarea class="field" id="arCfg" rows="5" placeholder="const firebaseConfig = {&#10;  apiKey: &quot;…&quot;,&#10;  databaseURL: &quot;https://…firebasedatabase.app&quot;,&#10;  …&#10;};"></textarea>
    <div class="arcl-btns"><button class="btn red" id="arSave">Lưu và kiểm tra</button><span class="err" id="arCfgErr"></span></div>`;
  IC().cloudRules().then((r) => { const t = $('#arRules'); if (t) t.value = r; });
  $('#arCopyRules').onclick = () => { navigator.clipboard.writeText($('#arRules').value); toast('Đã sao chép quy tắc'); };
  $('#arSave').onclick = async () => {
    const b = $('#arSave'); b.disabled = true; b.textContent = 'Đang kiểm tra…'; $('#arCfgErr').textContent = '';
    const r = await IC().cloudSet($('#arCfg').value);
    b.disabled = false; b.textContent = 'Lưu và kiểm tra';
    if (!r.ok) { $('#arCfgErr').textContent = '⚠️ ' + r.msg; return; }
    toast('✅ Đã bật thi qua Internet'); cloudCard();
  };
}
