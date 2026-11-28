// Ôn luyện IC3 GS6 – phần học sinh: đăng nhập, luyện tập, kiểm tra, thử thách, ôn câu sai, XP, huy hiệu, bảng xếp hạng
import L1 from './bank-l1.js';
import L2 from './bank-l2.js';
import { TYPE_LABEL, qText, renderQ, isAnswered, isCorrect, answerText, setToast, showMeme, mediaEl } from './qrender.js';

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const api = window.desktop && window.desktop.ic3;

export const DOMAINS = [
  { id: 1, name: 'Kiến thức cơ bản về công nghệ', icon: '💻', c: '#0a84ff' },
  { id: 2, name: 'Công dân số', icon: '🪪', c: '#ff9f0a' },
  { id: 3, name: 'Quản lí thông tin', icon: '🔎', c: '#30b0c7' },
  { id: 4, name: 'Sáng tạo nội dung', icon: '🎨', c: '#bf5af2' },
  { id: 5, name: 'Truyền thông', icon: '✉️', c: '#34c759' },
  { id: 6, name: 'Cộng tác', icon: '🤝', c: '#ff375f' },
  { id: 7, name: 'An toàn và bảo mật', icon: '🔐', c: '#5e5ce6' },
];
const BANK = { 1: L1, 2: L2 };
const QBY = Object.fromEntries([...L1, ...L2].map((q) => [q.id, q]));
const levelOfQ = (q) => +q.id[0];
const PASS = 700;

// ---------- cấp độ & huy hiệu ----------
const LV = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7600, 9200];
const LV_TITLE = ['Người mới', 'Tập sự số', 'Nhà khám phá', 'Thám tử thông tin', 'Công dân số', 'Chiến binh bảo mật', 'Nhà sáng tạo', 'Đội trưởng cộng tác', 'Chuyên gia nhí', 'Cao thủ IC3', 'Bậc thầy IC3', 'Huyền thoại số', 'Siêu sao IC3', 'Đại sứ số', 'Vô địch IC3'];
const levelInfo = (xp) => { let l = 0; while (l + 1 < LV.length && xp >= LV[l + 1]) l++; const next = LV[l + 1] ?? LV[l] + 2000; return { lv: l + 1, title: LV_TITLE[l], cur: xp - LV[l], need: next - LV[l] }; };
const BADGES = [
  { id: 'first', ic: '🎯', name: 'Khởi đầu', desc: 'Hoàn thành bài đầu tiên', ok: (p) => p.st.tests >= 1 },
  { id: 'pass', ic: '✅', name: 'Vượt ngưỡng', desc: 'Đạt từ 700 điểm trong một bài kiểm tra', ok: (p) => p.st.passes >= 1 },
  { id: 'perfect', ic: '💯', name: 'Điểm tuyệt đối', desc: 'Đạt 1000/1000 điểm', ok: (p) => p.st.perfect >= 1 },
  { id: 'combo10', ic: '🔥', name: 'Chuỗi lửa', desc: 'Đúng liên tiếp 10 câu', ok: (p) => p.st.maxCombo >= 10 },
  { id: 'streak3', ic: '📅', name: 'Chăm chỉ', desc: 'Học 3 ngày liên tiếp', ok: (p) => p.streak >= 3 },
  { id: 'streak7', ic: '🗓️', name: 'Bền bỉ', desc: 'Học 7 ngày liên tiếp', ok: (p) => p.streak >= 7 },
  { id: 'q100', ic: '💪', name: 'Trăm câu', desc: 'Trả lời 100 câu hỏi', ok: (p) => p.st.answered >= 100 },
  { id: 'q300', ic: '🏋️', name: 'Không biết mệt', desc: 'Trả lời 300 câu hỏi', ok: (p) => p.st.answered >= 300 },
  { id: 'eagle', ic: '🦅', name: 'Mắt tinh', desc: 'Bấm đúng 15 câu trên hình', ok: (p) => p.st.hotOk >= 15 },
  { id: 'speed', ic: '⚡', name: 'Tia chớp', desc: 'Đạt 1500 điểm Thử thách 60 giây', ok: (p) => p.st.chBest >= 1500 },
  { id: 'fixer', ic: '🧠', name: 'Sửa sai', desc: 'Ôn lại đúng 10 câu từng làm sai', ok: (p) => p.st.fixed >= 10 },
  { id: 'all1', ic: '🥉', name: 'Toàn tài Level 1', desc: 'Đạt từ 700 ở cả 7 chủ đề Level 1', ok: (p) => DOMAINS.every((d) => (p.best[`L1-D${d.id}`] || 0) >= PASS) },
  { id: 'all2', ic: '🥈', name: 'Toàn tài Level 2', desc: 'Đạt từ 700 ở cả 7 chủ đề Level 2', ok: (p) => DOMAINS.every((d) => (p.best[`L2-D${d.id}`] || 0) >= PASS) },
  { id: 'mock', ic: '🏆', name: 'Sẵn sàng thi', desc: 'Đạt từ 700 trong bài thi thử', ok: (p) => (p.best['L1-MOCK'] || 0) >= PASS || (p.best['L2-MOCK'] || 0) >= PASS },
];

// ---------- hồ sơ học sinh (lưu trên máy) ----------
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const keyOf = (name, cls) => name.trim().toLowerCase() + '|' + cls.trim().toUpperCase();
let profiles = store.get('thl.ic3.profiles', {});
let me = null;
const newProfile = (name, cls, school) => ({ name, class: cls, school, xp: 0, streak: 0, lastDay: '', best: {}, wrong: {}, badges: {}, st: { answered: 0, correct: 0, tests: 0, perfect: 0, passes: 0, maxCombo: 0, hotOk: 0, chBest: 0, fixed: 0 }, created: Date.now() });
const save = () => { if (me) { profiles[keyOf(me.name, me.class)] = me; store.set('thl.ic3.profiles', profiles); } };
const today = () => new Date().toISOString().slice(0, 10);
function touchStreak() {
  const t = today(); if (me.lastDay === t) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  me.streak = me.lastDay === y ? me.streak + 1 : 1; me.lastDay = t;
}
function checkBadges() { const got = []; for (const b of BADGES) if (!me.badges[b.id] && b.ok(me)) { me.badges[b.id] = Date.now(); got.push(b); } return got; }
const color = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h} 70% 50%)`; };
const initials = (n) => n.trim().split(/\s+/).slice(-1)[0][0].toUpperCase();

// ---------- âm thanh ----------
let ac;
function tone(freqs, dur = 0.12, type = 'sine', gap = 0.09, vol = 0.18) {
  try {
    ac = ac || new AudioContext(); const t0 = ac.currentTime;
    freqs.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0 + i * gap); g.gain.exponentialRampToValueAtTime(vol, t0 + i * gap + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * gap + dur); o.connect(g); g.connect(ac.destination); o.start(t0 + i * gap); o.stop(t0 + i * gap + dur + 0.05); });
  } catch {}
}
const sfx = { ok: () => tone([660, 880]), no: () => tone([220, 165], 0.18, 'square', 0.12, 0.08), combo: () => tone([523, 659, 784, 1046], 0.1, 'triangle', 0.07), level: () => tone([523, 659, 784, 1046, 1318], 0.18, 'triangle', 0.1, 0.2), tick: () => tone([1200], 0.03, 'square', 0, 0.04) };
export function ask(title, text, value = '', ph = '') {
  return new Promise((res) => {
    const d = document.createElement('div'); d.className = 'ic3-modal';
    d.innerHTML = `<div class="card"><h3>${esc(title)}</h3><p class="muted">${esc(text)}</p><input class="field" value="${esc(value)}" placeholder="${esc(ph)}"><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn ghost" data-v="0">Huỷ</button><button class="btn" data-v="1">Đồng ý</button></div></div>`;
    document.body.appendChild(d); const inp = d.querySelector('input'); inp.focus(); inp.select();
    const done = (ok) => { d.remove(); res(ok ? inp.value.trim() : null); };
    d.querySelectorAll('button').forEach((b) => (b.onclick = () => done(b.dataset.v === '1')));
    inp.onkeydown = (e) => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); };
  });
}
export function sure(title, text, okLabel = 'Đồng ý', danger = false) {
  return new Promise((res) => {
    const d = document.createElement('div'); d.className = 'ic3-modal';
    d.innerHTML = `<div class="card"><h3>${esc(title)}</h3><p class="muted">${esc(text)}</p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn ghost" data-v="0">Huỷ</button><button class="btn ${danger ? 'red' : ''}" data-v="1">${esc(okLabel)}</button></div></div>`;
    document.body.appendChild(d);
    const done = (ok) => { d.remove(); document.removeEventListener('keydown', key, true); res(ok); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); done(true); } };
    document.addEventListener('keydown', key, true);
    d.onclick = (e) => { if (e.target === d) done(false); };
    d.querySelectorAll('button').forEach((b) => (b.onclick = () => done(b.dataset.v === '1')));
    d.querySelector('[data-v="1"]').focus();
  });
}
function toast(msg, ms = 2600) { const d = document.createElement('div'); d.textContent = msg; $('#toast').appendChild(d); setTimeout(() => d.remove(), ms); }
setToast(toast);
function floatXP(txt, el) { const r = (el || document.body).getBoundingClientRect(); const d = document.createElement('div'); d.className = 'xpfloat'; d.textContent = txt; d.style.left = r.left + r.width / 2 - 30 + 'px'; d.style.top = r.top + 10 + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 1000); }

// ---------- kết nối máy giáo viên ----------
let net = { connected: false, pending: 0 };
function drawNet() {
  const b = $('#net');
  if (!api) { b.innerHTML = '<i></i>Chế độ một máy'; return; }
  b.className = 'net' + (net.connected ? ' on' : '');
  b.innerHTML = `<i></i>${net.connected ? `Đã kết nối: ${esc(net.teacher.teacher || 'Giáo viên')} · ${esc(net.teacher.room || '')}` : 'Chưa kết nối máy giáo viên'}${net.pending ? ` · ${net.pending} bài chờ gửi` : ''}`;
}
if (api) { api.status().then((s) => { net = s; drawNet(); }); api.onStudent((e) => { if (e.type === 'status') { const was = net.connected; net = e.data; drawNet(); if (!was && net.connected) toast('🟢 Đã kết nối với máy giáo viên'); } }); }
else drawNet();
$('#net').onclick = async () => {
  if (!api) return;
  const h = await ask('Kết nối máy giáo viên', 'Nhập địa chỉ IP hiện trên máy giáo viên (ví dụ 192.168.1.10). Để trống nếu muốn phần mềm tự tìm trong mạng LAN.', net.manualHost || '', '192.168.1.10');
  if (h === null) return; const ok = await api.setHost(h);
  toast(h ? (ok ? '🟢 Đã kết nối tới ' + h : '⚠️ Không kết nối được tới ' + h) : 'Đang tự tìm máy giáo viên trong mạng LAN…');
};
let activity = 'Đang ở trang chủ';
// ---------- đề của thầy cô (nhận qua LAN, lưu sẵn trên máy) ----------
let TS = { sets: [], memes: { ok: [], no: [], base: '' } }, tsSig = '';
async function loadSets() {
  if (!api || !api.sets) return;
  try {
    const r = await api.sets(); TS = r;
    for (const st of r.sets) for (const q of st.qs) QBY[q.id] = { ...q, d: 0, _base: st.base, _set: st.id };
    const sig = JSON.stringify(r.sets.map((x) => [x.id, x.updated, x.qs.length]));
    if (sig !== tsSig) { const first = !tsSig; tsSig = sig; if (me && app.querySelector('.hero')) viewHome(); if (!first && r.sets.length) toast('📚 Thầy cô vừa cập nhật đề mới'); }
  } catch {}
}
if (api) { loadSets(); setInterval(loadSets, 30000); api.onStudent((e) => { if (e.type === 'status' && e.data.connected) loadSets(); }); }
function setCards() {
  if (!TS.sets.length) return '';
  return `<h2 class="h2">📚 Đề của thầy cô</h2><div class="tsets">${TS.sets.map((x) => { const best = me.best['T-' + x.id]; const hasMedia = x.qs.some((q) => q.media || q.img); return `<div class="card tset"><div class="tsi">📝</div><div style="flex:1;min-width:0"><h3>${esc(x.title)}</h3><small>${x.qs.length} câu${x.exam && x.time ? ` · kiểm tra ${x.time} phút` : ''}${hasMedia ? ' · có hình ảnh' : ''}${x.memes && x.memes.ok.length + x.memes.no.length ? ' · 😂 có meme' : ''} · tốt nhất: ${best !== undefined ? best + '/1000' : 'chưa làm'}</small></div>
    <div class="acts">${x.practice ? `<button class="btn sm ghost" data-tp="${x.id}">📘 Luyện tập</button>` : ''}${x.exam ? `<button class="btn sm" data-tx="${x.id}">📝 Kiểm tra</button>` : ''}</div></div>`; }).join('')}</div>`;
}
function startSet(id, mode) {
  const x = TS.sets.find((y) => y.id === id); if (!x) return;
  const qs = (x.shuffle ? shuffle(x.qs) : x.qs).map((q) => ({ ...q, d: 0, _base: x.base, _set: x.id }));
  startQuiz({ key: 'T-' + x.id, title: x.title, mode, level: 0, domainId: null, qs, time: mode === 'exam' && x.time ? x.time * 60 : 0, set: x });
}
// meme: riêng của câu → của đề → meme chung
function memeFor(q, ok) {
  const own = ok ? q.okm : q.nom; if (own) return [[own], q._base];
  const st = S && S.set; const sl = st && st.memes && (ok ? st.memes.ok : st.memes.no);
  if (sl && sl.length) return [sl, st.base];
  const g = ok ? TS.memes.ok : TS.memes.no; return [g || [], TS.memes.base];
}
setInterval(() => { if (api && me) api.hello({ name: me.name, class: me.class, activity }); }, 15000);

// ================= ĐĂNG NHẬP =================
function viewLogin() {
  activity = '';
  $('#me').hidden = true;
  const recent = Object.values(profiles).sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0)).slice(0, 8);
  app.innerHTML = `<div class="login"><div class="card">
    <h1>Xin chào! 👋</h1><p class="muted" style="margin:0">Nhập họ tên và lớp để bắt đầu. Thầy cô sẽ xem được kết quả luyện tập của em.</p>
    <label>Họ và tên</label><input class="field" id="lgName" placeholder="Ví dụ: Nguyễn Văn An" maxlength="50" autocomplete="off">
    <div class="row"><div><label>Trường (không bắt buộc)</label><input class="field" id="lgSchool" placeholder="THCS …" maxlength="50"></div><div><label>Lớp</label><input class="field" id="lgClass" placeholder="7A" maxlength="10" style="text-transform:uppercase"></div></div>
    <div style="margin-top:22px;display:flex;gap:10px"><button class="btn red" id="lgGo" style="flex:1">Bắt đầu ôn luyện ›</button></div>
    ${recent.length ? `<label>Hoặc chọn tên đã dùng trên máy này</label><div class="recent">${recent.map((p) => `<button data-k="${esc(keyOf(p.name, p.class))}"><span class="av" style="background:${color(p.name)}">${esc(initials(p.name))}</span>${esc(p.name)} · ${esc(p.class)}</button>`).join('')}</div>` : ''}
    <div class="netbox" id="lgNet">${api ? (net.connected ? `🟢 Đã kết nối máy giáo viên (${esc(net.teacher.room || '')})` : '🟠 Chưa thấy máy giáo viên. Em vẫn làm bài bình thường, kết quả sẽ tự gửi khi kết nối được.') : 'Đang chạy ở chế độ một máy.'}</div>
  </div></div>`;
  const go = (name, cls, school) => {
    name = name.trim().replace(/\s+/g, ' '); cls = cls.trim().toUpperCase();
    if (name.split(' ').length < 2) return toast('Hãy nhập đầy đủ họ và tên');
    if (!cls) return toast('Hãy nhập lớp');
    const k = keyOf(name, cls);
    me = profiles[k] || newProfile(name, cls, school);
    if (school) me.school = school;
    me.lastLogin = Date.now(); save();
    sessionStorage.setItem('thl.ic3.me', k);
    viewHome();
  };
  $('#lgGo').onclick = () => go($('#lgName').value, $('#lgClass').value, $('#lgSchool').value.trim());
  app.querySelectorAll('.recent button').forEach((b) => (b.onclick = () => { const p = profiles[b.dataset.k]; go(p.name, p.class, p.school); }));
  app.querySelectorAll('.field').forEach((f) => f.addEventListener('keydown', (e) => e.key === 'Enter' && $('#lgGo').click()));
  setTimeout(() => $('#lgName').focus(), 50);
}
function drawMe() {
  const b = $('#me'); b.hidden = false;
  const L = levelInfo(me.xp);
  b.innerHTML = `<span class="av" style="background:${color(me.name)}">${esc(initials(me.name))}</span>${esc(me.name)} · ${esc(me.class)} · Cấp ${L.lv}`;
  b.onclick = async () => { if (await sure('Đăng xuất?', 'Đăng xuất để bạn khác đăng nhập trên máy này.', 'Đăng xuất')) { sessionStorage.removeItem('thl.ic3.me'); me = null; if (new URLSearchParams(location.search).has('embed') && window.parent !== window) { parent.postMessage('ic3-logout', '*'); return; } viewLogin(); } };
}

// ================= TRANG CHÍNH =================
let curLevel = +(sessionStorage.getItem('thl.ic3.level') || 1);
const ring = (v, c, size = 64) => { const r = 26, C = 2 * Math.PI * r; return `<div class="ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${r}" fill="none" stroke="#eee" stroke-width="7"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(v / 1000) * C} ${C}"/></svg><b>${v || '–'}</b></div>`; };
function viewHome() {
  activity = 'Đang ở trang chủ'; drawMe();
  const L = levelInfo(me.xp), C = 2 * Math.PI * 42;
  const wrongN = Object.keys(me.wrong).filter((id) => QBY[id]).length;
  const nb = Object.keys(me.badges).length;
  app.innerHTML = `<div class="wrap">
    <div class="hero">
      <div class="card prof">
        <div class="lvl"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="9"/><circle cx="50" cy="50" r="42" fill="none" stroke="#ffd60a" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(L.cur / L.need) * C} ${C}"/></svg><div><span>CẤP</span><b>${L.lv}</b></div></div>
        <div style="flex:1;position:relative;z-index:1"><h2>${esc(me.name)}</h2><div class="title">${esc(L.title)} · Lớp ${esc(me.class)}${me.school ? ' · ' + esc(me.school) : ''}</div>
          <div class="xpbar"><i style="width:${(L.cur / L.need) * 100}%"></i></div>
          <div class="stats"><span>⭐ ${me.xp} XP</span><span>🔥 ${me.streak} ngày liên tiếp</span><span>🎖 ${nb}/${BADGES.length} huy hiệu</span><span>✔ ${me.st.answered} câu</span></div></div>
      </div>
      <div class="quick">
        <button class="qa" id="qaChal"><span class="ic">⚡</span><b>Thử thách 60 giây</b><span>Trả lời thật nhanh, ghép combo nhân điểm</span></button>
        <button class="qa" id="qaWrong">${wrongN ? `<span class="pill">${wrongN}</span>` : ''}<span class="ic">🧠</span><b>Ôn câu sai</b><span>Sổ tay những câu em từng làm sai</span></button>
        <button class="qa" id="qaLb"><span class="ic">🏆</span><b>Bảng xếp hạng</b><span>So tài XP với các bạn cùng lớp</span></button>
        <button class="qa" id="qaBadge"><span class="ic">🎖</span><b>Huy hiệu</b><span>${nb}/${BADGES.length} đã mở khoá</span></button>
      </div>
    </div>
    ${setCards()}
    <div class="seg" id="lvSeg"><button data-l="1" class="${curLevel === 1 ? 'on' : ''}">Level 1</button><button data-l="2" class="${curLevel === 2 ? 'on' : ''}">Level 2</button></div>
    <h2 class="h2">7 chủ đề IC3 GS6 – Level ${curLevel}</h2>
    <div class="domains">${DOMAINS.map((d) => { const n = BANK[curLevel].filter((q) => q.d === d.id).length; const best = me.best[`L${curLevel}-D${d.id}`] || 0; return `<div class="card dom" style="--c:${d.c}"><div class="di">${d.icon}</div><div><small>Chủ đề ${d.id}</small><h3>${d.name}</h3><small>${n} câu · tốt nhất: ${best ? best + '/1000' : 'chưa làm'}</small></div>${ring(best, best >= PASS ? '#34c759' : best ? '#ff9f0a' : '#ddd')}<div class="acts"><button class="btn sm ghost" data-p="${d.id}">📘 Luyện tập</button><button class="btn sm" data-x="${d.id}" style="background:${d.c}">📝 Kiểm tra</button></div></div>`; }).join('')}</div>
    <div class="card mock"><div class="ic">🎓</div><div style="flex:1"><h3>Thi thử Level ${curLevel}</h3><div class="muted">35 câu trộn từ cả 7 chủ đề · 50 phút · đạt từ 700/1000 · tốt nhất: ${me.best[`L${curLevel}-MOCK`] ? me.best[`L${curLevel}-MOCK`] + '/1000' : 'chưa làm'}</div></div><button class="btn red" id="mockGo">Vào thi thử ›</button></div>
  </div>`;
  $('#lvSeg').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; curLevel = +b.dataset.l; sessionStorage.setItem('thl.ic3.level', curLevel); viewHome(); };
  app.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => startDomain(+b.dataset.p, 'practice')));
  app.querySelectorAll('[data-x]').forEach((b) => (b.onclick = () => startDomain(+b.dataset.x, 'exam')));
  $('#mockGo').onclick = () => startMock();
  app.querySelectorAll('[data-tp]').forEach((b) => (b.onclick = () => startSet(b.dataset.tp, 'practice')));
  app.querySelectorAll('[data-tx]').forEach((b) => (b.onclick = () => startSet(b.dataset.tx, 'exam')));
  $('#qaChal').onclick = () => viewChallenge();
  $('#qaWrong').onclick = () => startNotebook();
  $('#qaLb').onclick = () => viewLeaderboard();
  $('#qaBadge').onclick = () => viewBadges();
}
function startDomain(d, mode) {
  const dom = DOMAINS[d - 1];
  const qs = shuffle(BANK[curLevel].filter((q) => q.d === d));
  startQuiz({ key: `L${curLevel}-D${d}`, title: `Chủ đề ${d}: ${dom.name} – Level ${curLevel}`, mode, level: curLevel, domainId: d, qs, time: mode === 'exam' ? qs.length * 90 : 0 });
}
function startMock() {
  const qs = shuffle(DOMAINS.flatMap((d) => shuffle(BANK[curLevel].filter((q) => q.d === d.id)).slice(0, 5)));
  startQuiz({ key: `L${curLevel}-MOCK`, title: `Thi thử IC3 GS6 – Level ${curLevel}`, mode: 'exam', level: curLevel, domainId: null, qs, time: 50 * 60 });
}
function startNotebook() {
  const ids = Object.keys(me.wrong).filter((id) => QBY[id]);
  if (!ids.length) return toast('🎉 Sổ tay trống: em chưa có câu sai nào cần ôn!');
  startQuiz({ key: 'NOTEBOOK', title: `Ôn câu sai (${ids.length} câu)`, mode: 'review', level: 0, domainId: null, qs: shuffle(ids.map((id) => QBY[id])).slice(0, 20), time: 0 });
}

// ================= HIỂN THỊ CÂU HỎI =================
// ================= LÀM BÀI =================
let S = null, timerIv = null;
function startQuiz(cfg) {
  clearInterval(timerIv);
  S = { ...cfg, st: cfg.qs.map(() => ({})), idx: 0, flags: new Set(), checked: [], t0: Date.now(), combo: 0, maxCombo: 0, xp: 0 };
  if (S.time) timerIv = setInterval(tickTimer, 1000);
  drawPlayer();
}
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
function tickTimer() {
  const left = S.time - Math.floor((Date.now() - S.t0) / 1000);
  const t = $('#timer'); if (t) { t.textContent = '⏱ ' + fmt(Math.max(0, left)); t.classList.toggle('low', left <= 60); }
  if (left <= 0) { clearInterval(timerIv); toast('⏰ Hết giờ! Bài làm được nộp tự động.'); finishQuiz(); }
}
function drawPlayer() {
  const q = S.qs[S.idx], st = S.st[S.idx], exam = S.mode === 'exam';
  activity = `Đang làm: ${S.title} – câu ${S.idx + 1}/${S.qs.length}`;
  const answeredN = S.st.filter((s, i) => isAnswered(S.qs[i], s)).length;
  app.innerHTML = `<div class="player">
    <div class="pbar"><button class="btn sm ghost" id="quit">✕ Thoát</button><h2>${esc(S.title)}</h2>${!exam ? `<span class="combo" id="combo">${S.combo >= 2 ? `🔥 Combo x${S.combo}` : ''}</span><span class="timer">⭐ +${S.xp} XP</span>` : ''}${S.time ? `<span class="timer" id="timer">⏱ --:--</span>` : ''}</div>
    <div class="prog"><i style="width:${((exam ? answeredN : S.checked.filter(Boolean).length) / S.qs.length) * 100}%"></i></div>
    <div class="card qbox">
      <div class="qhead"><span class="num">${S.idx + 1}/${S.qs.length}</span><div class="qt">${qText(q)}</div>${exam ? `<button class="flag ${S.flags.has(S.idx) ? 'on' : ''}" id="flag" title="Đánh dấu để xem lại">🚩</button>` : ''}</div>
      <div class="qbody" id="qbody"></div>
      <div class="qfoot">${exam ? `<button class="btn ghost" id="prev" ${S.idx ? '' : 'disabled'}>‹ Câu trước</button><span class="sp"></span><button class="btn ghost" id="next" ${S.idx < S.qs.length - 1 ? '' : 'disabled'}>Câu sau ›</button><button class="btn red" id="submit">Nộp bài</button>`
        : `<span class="muted" id="hint">${q.d ? `${DOMAINS[q.d - 1].icon} ${DOMAINS[q.d - 1].name}` : '📚 Đề của thầy cô'}</span><span class="sp"></span><button class="btn" id="check">Kiểm tra</button>`}</div>
    </div>
    <div class="side"><div class="card outline"><h4>Danh sách câu</h4><div class="qgrid">${S.qs.map((qq, i) => { const c = exam ? (isAnswered(qq, S.st[i]) && S.st[i].touched ? 'ans' : '') : S.checked[i] === undefined ? '' : S.checked[i] ? 'ok' : 'no'; return `<button data-i="${i}" class="${c} ${i === S.idx ? 'cur' : ''} ${S.flags.has(i) ? 'fl' : ''}">${i + 1}</button>`; }).join('')}</div>
      <div class="legend">${exam ? '<span>■ đã trả lời</span><span>🚩 đánh dấu</span>' : '<span style="color:#34c759">■ đúng</span><span style="color:#ff3b30">■ sai</span>'}</div></div>
      <div class="card outline"><h4>Mẹo</h4><div class="muted" style="font-size:13.5px;line-height:1.5">${exam ? 'Bài kiểm tra chỉ chấm khi nộp. Đạt từ 700/1000 là vượt qua. Câu chưa chắc thì đánh dấu 🚩 để quay lại.' : 'Chế độ luyện tập: bấm “Kiểm tra” để xem ngay đúng/sai và lời giải. Trả lời đúng liên tiếp để nhận thưởng combo!'}</div></div>
    </div></div>`;
  const body = $('#qbody');
  body.appendChild(renderQ(q, st, () => { st.touched = true; if (exam) refreshGrid(); }));
  if (S.checked[S.idx] !== undefined) { st.locked = true; st.reveal && st.reveal(); showFeedback(q, S.checked[S.idx]); swapToNext(); }
  if (S.time) tickTimer();
  $('#quit').onclick = async () => { if (await sure('Thoát bài làm?', 'Kết quả bài này sẽ không được lưu.', 'Thoát', true)) { clearInterval(timerIv); viewHome(); } };
  app.querySelectorAll('.qgrid button').forEach((b) => (b.onclick = () => { S.idx = +b.dataset.i; drawPlayer(); }));
  if (exam) {
    $('#prev').onclick = () => { S.idx--; drawPlayer(); };
    $('#next').onclick = () => { S.idx++; drawPlayer(); };
    $('#flag').onclick = () => { S.flags.has(S.idx) ? S.flags.delete(S.idx) : S.flags.add(S.idx); drawPlayer(); };
    $('#submit').onclick = async () => { const left = S.qs.filter((qq, i) => !(isAnswered(qq, S.st[i]) && S.st[i].touched)).length; if (await sure('Nộp bài?', left ? `Còn ${left} câu chưa trả lời. Em vẫn muốn nộp bài?` : 'Em đã trả lời hết. Nộp bài và xem kết quả nhé!', 'Nộp bài', true)) finishQuiz(); };
  } else $('#check').onclick = () => checkPractice();
}
function refreshGrid() { app.querySelectorAll('.qgrid button').forEach((b) => { const i = +b.dataset.i; b.classList.toggle('ans', isAnswered(S.qs[i], S.st[i]) && !!S.st[i].touched); }); const n = S.st.filter((s, i) => isAnswered(S.qs[i], s) && s.touched).length; $('.prog i').style.width = (n / S.qs.length) * 100 + '%'; }
function showFeedback(q, ok) { $('#qbody').insertAdjacentHTML('beforeend', `<div class="feedback ${ok ? 'ok' : 'no'}"><b>${ok ? '✅ Chính xác!' : '❌ Chưa đúng.'}</b> ${esc(q.e || '')}</div>`); }
function swapToNext() {
  const b = $('#check'); if (!b) return;
  const last = S.idx === S.qs.length - 1 || S.checked.filter((x) => x !== undefined).length === S.qs.length;
  b.textContent = last ? 'Xem kết quả ›' : 'Câu tiếp ›'; b.className = 'btn red';
  b.onclick = () => { if (last && S.checked.filter((x) => x !== undefined).length === S.qs.length) return finishQuiz(); const nx = S.qs.findIndex((_, i) => S.checked[i] === undefined && i > S.idx); S.idx = nx >= 0 ? nx : S.qs.findIndex((_, i) => S.checked[i] === undefined); drawPlayer(); };
}
function checkPractice() {
  const q = S.qs[S.idx], st = S.st[S.idx];
  if (!isAnswered(q, st) || (q.t !== 'order' && !st.touched && q.t !== 'hot')) return toast(q.t === 'multi' ? `Hãy chọn đủ ${q.n} đáp án` : 'Em hãy trả lời trước đã');
  if (q.t === 'hot' && !st.ans) return toast('Hãy bấm vào một vị trí trên hình');
  const ok = isCorrect(q, st); S.checked[S.idx] = ok; st.locked = true; st.reveal && st.reveal();
  me.st.answered++;
  if (ok) {
    me.st.correct++; S.combo++; S.maxCombo = Math.max(S.maxCombo, S.combo); if (q.t === 'hot') me.st.hotOk++;
    const gain = 10 + (S.combo >= 3 ? 5 : 0) + (S.combo >= 6 ? 5 : 0); S.xp += gain;
    floatXP(`+${gain} XP`, $('#check')); S.combo >= 3 && S.combo % 3 === 0 ? sfx.combo() : sfx.ok();
    if (me.wrong[q.id]) { delete me.wrong[q.id]; me.st.fixed++; toast('🧠 Đã xoá câu này khỏi sổ tay câu sai'); }
  } else { S.combo = 0; sfx.no(); me.wrong[q.id] = (me.wrong[q.id] || 0) + 1; }
  save();
  showFeedback(q, ok);
  const [ml, mb] = memeFor(q, ok); showMeme(ml, mb, ok);
  const cb = $('#combo'); if (cb) cb.textContent = S.combo >= 2 ? `🔥 Combo x${S.combo}` : '';
  app.querySelector(`.qgrid button[data-i="${S.idx}"]`).classList.add(ok ? 'ok' : 'no');
  $('.prog i').style.width = (S.checked.filter((x) => x !== undefined).length / S.qs.length) * 100 + '%';
  app.querySelector('.timer:not(#timer)') && (app.querySelector('.timer:not(#timer)').textContent = `⭐ +${S.xp} XP`);
  swapToNext();
}

// ================= KẾT QUẢ =================
async function finishQuiz() {
  clearInterval(timerIv);
  const exam = S.mode === 'exam';
  const res = S.qs.map((q, i) => (exam ? isCorrect(q, S.st[i]) : !!S.checked[i]));
  const correct = res.filter(Boolean).length, total = S.qs.length;
  const score = Math.round((correct / total) * 1000);
  const dur = Math.round((Date.now() - S.t0) / 1000);
  const doms = {}; S.qs.forEach((q, i) => { doms[q.d] = doms[q.d] || [0, 0]; doms[q.d][1]++; if (res[i]) doms[q.d][0]++; });
  const L0 = levelInfo(me.xp).lv;
  if (exam) {
    me.st.answered += total; me.st.correct += correct;
    S.qs.forEach((q, i) => { if (!res[i]) me.wrong[q.id] = (me.wrong[q.id] || 0) + 1; else if (q.t === 'hot') me.st.hotOk++; });
    S.xp = correct * 10 + (score >= PASS ? 50 : 0) + (score === 1000 ? 100 : 0);
    let c = 0; res.forEach((r) => { c = r ? c + 1 : 0; S.maxCombo = Math.max(S.maxCombo, c); });
  }
  me.xp += S.xp; me.st.tests++; if (score === 1000) me.st.perfect++; if (exam && score >= PASS) me.st.passes++;
  me.st.maxCombo = Math.max(me.st.maxCombo, S.maxCombo);
  if (S.key !== 'NOTEBOOK') me.best[S.key] = Math.max(me.best[S.key] || 0, score);
  touchStreak();
  const newBadges = checkBadges(); save();
  const L1v = levelInfo(me.xp).lv;
  // gửi kết quả cho giáo viên
  let sent = null;
  if (api) { try { const r = await api.submit({ name: me.name, class: me.class, school: me.school || '', level: S.level, testId: S.key, testTitle: S.title, mode: S.mode, domainId: S.domainId, score, correct, total, duration: dur, xp: S.xp, domains: doms, qids: S.qs.map((q) => q.id), wrong: S.qs.filter((q, i) => !res[i]).map((q) => q.id), at: Date.now() }); sent = r.sent; } catch { sent = false; } }
  if (L1v > L0) { sfx.level(); setTimeout(() => toast(`🎉 Lên cấp ${L1v}: ${levelInfo(me.xp).title}!`, 3500), 600); } else if (score >= PASS) sfx.combo();
  newBadges.forEach((b, i) => setTimeout(() => toast(`${b.ic} Mở khoá huy hiệu: ${b.name}`, 3500), 1200 + i * 700));
  viewResult({ score, correct, total, dur, doms, res, sent, newBadges, lvUp: L1v > L0 });
  if (exam) { const [ml, mb] = memeFor({}, score >= PASS); setTimeout(() => showMeme(ml, mb, score >= PASS, 4500, score >= PASS ? '🎉 Đạt rồi! ' + score + '/1000' : '💪 Cố lên lần sau nhé!'), 400); }
}
function gaugeSVG(score) {
  const a = Math.PI * (1 - score / 1000), x = 150 + 120 * Math.cos(a), y = 150 - 120 * Math.sin(a);
  return `<svg viewBox="0 0 300 175"><path d="M30 150 A120 120 0 0 1 270 150" fill="none" stroke="#e5e5ea" stroke-width="18" stroke-linecap="round"/>${score ? `<path d="M30 150 A120 120 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="${score >= PASS ? '#34c759' : score >= 500 ? '#ff9f0a' : '#ff3b30'}" stroke-width="18" stroke-linecap="round"/>` : ''}<text x="30" y="172" font-size="13" text-anchor="middle" fill="#6e6e73">0</text><text x="270" y="172" font-size="13" text-anchor="middle" fill="#6e6e73">1000</text></svg>`;
}
function viewResult(R) {
  activity = `Vừa xong: ${S.title} – ${R.score}/1000`;
  const pass = R.score >= PASS;
  const dotC = (c, t) => { const p = t ? c / t : 0; return p > 0.8 ? '#34c759' : p > 0.5 ? '#ffcc00' : '#ff3b30'; };
  app.innerHTML = `<div class="result">
    <div class="backrow"><button class="btn sm ghost" id="home">‹ Trang chủ</button><h2 class="h2" style="margin:0">${esc(S.title)}</h2></div>
    <div class="card rcard">
      <div class="rinfo"><div style="font-size:15px;color:var(--ink3);margin-bottom:12px">${esc(me.name)} · ${esc(me.class)}</div><dl>
        <div><dt>Chế độ</dt><dd>${S.mode === 'exam' ? 'Kiểm tra' : S.mode === 'review' ? 'Ôn câu sai' : 'Luyện tập'}</dd></div><div><dt>Thời gian</dt><dd>${fmt(R.dur)}${S.time ? ' / ' + fmt(S.time) : ''}</dd></div>
        <div><dt>Số câu đúng</dt><dd>${R.correct}/${R.total}</dd></div><div><dt>Cần đạt</dt><dd>${Math.ceil(R.total * 0.7)}/${R.total}</dd></div>
        <div><dt>Gửi giáo viên</dt><dd>${!api ? '—' : R.sent ? '🟢 Đã gửi' : '🟠 Chờ gửi khi kết nối'}</dd></div><div><dt>Ngày nộp</dt><dd>${new Date().toLocaleString('vi-VN')}</dd></div>
      </dl></div>
      <div class="gauge">${gaugeSVG(R.score)}<div style="margin-top:-118px"><div class="st ${pass ? 'pass' : 'fail'}">${pass ? 'Đạt' : 'Chưa đạt'}</div><div class="sc">${R.score}</div><div class="muted">${pass ? (R.score === 1000 ? 'Hoàn hảo! 🌟' : 'Làm tốt lắm! 🎉') : 'Đừng bỏ cuộc! 💪'}</div></div></div>
      ${!DOMAINS.some((d) => R.doms[d.id]) ? `<div class="doms"><b>📚 Đề của thầy cô</b><div class="muted" style="margin-top:8px;font-size:14px">Đúng ${R.correct}/${R.total} câu. Bấm “Xem lại bài làm” để xem đáp án và lời giải từng câu.</div></div>` : ''}<div class="doms" ${DOMAINS.some((d) => R.doms[d.id]) ? '' : 'hidden'}><b>Theo chủ đề</b>${DOMAINS.filter((d) => R.doms[d.id]).map((d) => `<div class="drow"><i class="dot" style="background:${dotC(...R.doms[d.id])}"></i><span>${d.name}</span><b>${R.doms[d.id][0]}/${R.doms[d.id][1]}</b></div>`).join('')}
        <div class="legend"><span style="color:#ff3b30">● 0–50%</span><span style="color:#d4a700">● 51–80%</span><span style="color:#34c759">● 81–100%</span></div></div>
    </div>
    <div class="rewards">
      <div class="card reward"><span class="ic">⭐</span><div><b>+${S.xp} XP</b><span class="muted">${R.lvUp ? `Lên cấp ${levelInfo(me.xp).lv}!` : `Cấp ${levelInfo(me.xp).lv} · ${levelInfo(me.xp).title}`}</span></div></div>
      <div class="card reward"><span class="ic">🔥</span><div><b>${me.streak} ngày</b><span class="muted">học liên tiếp</span></div></div>
      ${R.newBadges.map((b) => `<div class="card reward"><span class="ic">${b.ic}</span><div><b>${b.name}</b><span class="muted">Huy hiệu mới!</span></div></div>`).join('')}
    </div>
    <div style="display:flex;gap:10px;margin-top:20px"><button class="btn red" id="again">↻ Làm lại</button><button class="btn ghost" id="toggleRv">📋 Xem lại bài làm</button>${R.res.some((r) => !r) ? '<button class="btn ghost" id="wrongNow">🧠 Ôn ngay các câu sai</button>' : ''}</div>
    <div class="review" id="rv" hidden>${S.qs.map((q, i) => `<div class="card rv ${R.res[i] ? '' : 'no'}"><div class="q">${i + 1}. ${esc(q.q)}</div><div class="a">${R.res[i] ? '✅ Đúng' : '❌ Sai'} · <b>Đáp án:</b> ${esc(answerText(q))}<br>${esc(q.e || '')}</div></div>`).join('')}</div>
  </div>`;
  $('#home').onclick = () => viewHome();
  $('#again').onclick = () => startQuiz({ ...S, qs: shuffle(S.qs) });
  $('#toggleRv').onclick = () => { $('#rv').hidden = !$('#rv').hidden; };
  const w = $('#wrongNow'); if (w) w.onclick = () => startQuiz({ key: 'NOTEBOOK', title: 'Ôn các câu vừa làm sai', mode: 'review', level: 0, domainId: null, qs: S.qs.filter((_, i) => !R.res[i]), time: 0 });
}
// ================= THỬ THÁCH 60 GIÂY =================
function viewChallenge() {
  const pool = shuffle(BANK[curLevel].filter((q) => q.t === 'one' || q.t === 'yesno' || q.t === 'hot' || q.t === 'multi'));
  const C = { left: 60, pts: 0, combo: 0, maxCombo: 0, answered: 0, correct: 0, i: 0, t0: Date.now() };
  activity = 'Đang chơi Thử thách 60 giây';
  app.innerHTML = `<div class="chal"><div class="chalbar"><button class="btn sm ghost" id="quit">✕</button><div class="bigtime" id="ct">60</div><div style="flex:1"><div class="prog"><i id="cbar" style="width:100%"></i></div></div><div class="score" id="cs">0</div></div>
    <div class="card qbox" style="min-height:auto"><div class="qhead"><span class="num" id="cc">x1</span><div class="qt" id="cq"></div></div><div class="qbody" id="cb"></div><div class="qfoot"><span class="combo" id="ccombo"></span><span class="sp"></span><button class="btn red" id="cgo">Trả lời ›</button></div></div></div>`;
  let st, q;
  const next = () => { q = pool[C.i++ % pool.length]; st = {}; $('#cq').innerHTML = qText(q); const b = $('#cb'); b.innerHTML = ''; b.appendChild(renderQ(q, st, () => { st.touched = true; if (q.t === 'one' || q.t === 'hot') answer(); })); };
  const mult = () => 1 + Math.floor(C.combo / 3) * 0.5;
  const answer = () => {
    if (!isAnswered(q, st) || (q.t === 'hot' && !st.ans)) return toast('Hãy trả lời trước');
    const ok = isCorrect(q, st); C.answered++;
    if (ok) { C.correct++; C.combo++; C.maxCombo = Math.max(C.maxCombo, C.combo); const g = Math.round(100 * mult()); C.pts += g; floatXP('+' + g, $('#cs')); C.combo % 3 === 0 ? sfx.combo() : sfx.ok(); }
    else { C.combo = 0; sfx.no(); C.left = Math.max(0, C.left - 3); floatXP('−3 giây', $('#ct')); }
    $('#cs').textContent = C.pts; $('#cc').textContent = 'x' + mult(); $('#ccombo').textContent = C.combo >= 2 ? `🔥 Combo ${C.combo}` : '';
    next();
  };
  $('#cgo').onclick = answer;
  $('#quit').onclick = () => { clearInterval(iv); viewHome(); };
  const iv = setInterval(() => {
    C.left -= 1; $('#ct').textContent = Math.max(0, C.left); $('#cbar').style.width = (Math.max(0, C.left) / 60) * 100 + '%';
    if (C.left <= 10 && C.left > 0) sfx.tick();
    if (C.left <= 0) { clearInterval(iv); endChallenge(C); }
  }, 1000);
  next();
}
async function endChallenge(C) {
  const xp = Math.round(C.pts / 20);
  const best = C.pts > me.st.chBest; me.st.chBest = Math.max(me.st.chBest, C.pts);
  me.xp += xp; me.st.answered += C.answered; me.st.correct += C.correct; me.st.maxCombo = Math.max(me.st.maxCombo, C.maxCombo); touchStreak();
  const nb = checkBadges(); save();
  if (api && C.answered) api.submit({ name: me.name, class: me.class, school: me.school || '', level: curLevel, testId: `L${curLevel}-CHAL`, testTitle: `Thử thách 60 giây – Level ${curLevel} (${C.pts} điểm)`, mode: 'challenge', score: C.answered ? Math.round((C.correct / C.answered) * 1000) : 0, correct: C.correct, total: C.answered, duration: 60, xp, domains: {}, qids: [], wrong: [], at: Date.now() }).catch(() => {});
  sfx.level(); nb.forEach((b, i) => setTimeout(() => toast(`${b.ic} Mở khoá huy hiệu: ${b.name}`, 3500), 800 + i * 700));
  app.innerHTML = `<div class="chal" style="text-align:center"><div class="card" style="padding:40px"><div style="font-size:60px">${best ? '🏆' : '⚡'}</div><h2 class="h2">${best ? 'Kỷ lục mới!' : 'Hết giờ!'}</h2>
    <div class="score" style="font-size:64px">${C.pts}</div><p class="muted">Đúng ${C.correct}/${C.answered} câu · combo cao nhất ${C.maxCombo} · kỷ lục ${me.st.chBest}</p><p><b>+${xp} XP</b></p>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:18px"><button class="btn red" id="re">Chơi lại</button><button class="btn ghost" id="hm">Trang chủ</button></div></div></div>`;
  $('#re').onclick = () => viewChallenge(); $('#hm').onclick = () => viewHome();
}

// ================= BẢNG XẾP HẠNG & HUY HIỆU =================
async function viewLeaderboard(period = 'week') {
  activity = 'Đang xem bảng xếp hạng';
  app.innerHTML = `<div class="wrap"><div class="backrow"><button class="btn sm ghost" id="home">‹ Trang chủ</button><h2 class="h2" style="margin:0">🏆 Bảng xếp hạng lớp ${esc(me.class)}</h2></div>
    <div class="seg" style="margin-top:0"><button data-p="week" class="${period === 'week' ? 'on' : ''}">Tuần này</button><button data-p="all" class="${period === 'all' ? 'on' : ''}">Mọi lúc</button></div><div id="lbBody" class="muted">Đang tải…</div></div>`;
  $('#home').onclick = () => viewHome();
  app.querySelectorAll('.seg button').forEach((b) => (b.onclick = () => viewLeaderboard(b.dataset.p)));
  let rows, note = '';
  const r = api ? await api.leaderboard(me.class, period) : { ok: false };
  if (r.ok) rows = r.rows;
  else { rows = Object.values(profiles).filter((p) => p.class === me.class).map((p) => ({ name: p.name, class: p.class, xp: p.xp, tests: p.st.tests, best: Math.max(0, ...Object.values(p.best)) })).sort((a, b) => b.xp - a.xp); note = 'Chưa kết nối máy giáo viên: đang hiển thị các bạn đã dùng máy này (tính tổng XP mọi lúc).'; }
  const meRow = (x) => x.name.toLowerCase() === me.name.toLowerCase();
  const top = rows.slice(0, 3);
  $('#lbBody').innerHTML = rows.length ? `${note ? `<p class="muted">${note}</p>` : ''}
    <div class="podium">${[1, 0, 2].filter((i) => top[i]).map((i) => `<div class="p${i + 1}"><div style="font-size:30px">${['🥇', '🥈', '🥉'][i]}</div><b>${esc(top[i].name)}</b><span>${top[i].xp} XP</span></div>`).join('')}</div>
    <div class="card" style="padding:6px 10px"><table class="lb"><tr><th>Hạng</th><th>Học sinh</th><th>XP</th><th>Số bài</th><th>Điểm cao nhất</th></tr>${rows.map((x, i) => `<tr class="${meRow(x) ? 'mine' : ''}"><td class="rk">${['🥇', '🥈', '🥉'][i] || i + 1}</td><td>${esc(x.name)}</td><td><b>${x.xp}</b></td><td>${x.tests}</td><td>${x.best}</td></tr>`).join('')}</table></div>`
    : '<div class="card" style="padding:30px;text-align:center">Chưa có ai trong bảng xếp hạng. Hãy làm bài đầu tiên nhé! 🚀</div>';
}
function viewBadges() {
  activity = 'Đang xem huy hiệu';
  app.innerHTML = `<div class="wrap"><div class="backrow"><button class="btn sm ghost" id="home">‹ Trang chủ</button><h2 class="h2" style="margin:0">🎖 Huy hiệu của em (${Object.keys(me.badges).length}/${BADGES.length})</h2></div>
    <div class="badgegrid">${BADGES.map((b) => `<div class="card badge ${me.badges[b.id] ? 'got' : ''}"><div class="ic">${b.ic}</div><b>${b.name}</b><span>${b.desc}</span>${me.badges[b.id] ? `<div class="muted" style="font-size:11px;margin-top:6px">${new Date(me.badges[b.id]).toLocaleDateString('vi-VN')}</div>` : ''}</div>`).join('')}</div></div>`;
  $('#home').onclick = () => viewHome();
}

// ---------- chạy bên trong Đảo IC3 (khung nhúng) ----------
const EMBED = new URLSearchParams(location.search).has('embed') && window.parent !== window;
if (EMBED) {
  document.body.classList.add('embed');
  const b = document.querySelector('#top [data-nav="../index.html"]'); if (b) { b.removeAttribute('data-nav'); b.textContent = '‹ Về Đảo IC3'; b.onclick = () => parent.postMessage('ic3-close', '*'); }
  const t = document.querySelector('#top [data-nav="teacher.html"]'); if (t) t.hidden = true;
}
// ---------- khởi động ----------
const k = sessionStorage.getItem('thl.ic3.me');
if (k && profiles[k]) { me = profiles[k]; viewHome(); } else viewLogin();
window.__ic3 = { get me() { return me; }, get S() { return S; }, startQuiz, viewHome, DOMAINS, BANK };
