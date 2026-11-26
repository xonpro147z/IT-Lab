// Ôn luyện IC3 – khu vực giáo viên: bật máy chủ LAN, xem/lọc/xuất kết quả, học sinh đang online, thống kê câu hỏi
import L1 from './bank-l1.js';
import L2 from './bank-l2.js';
import { paneSets } from './editor.js';
import { setToast } from './qrender.js';

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function sure(title, text, okLabel = 'Đồng ý', danger = false) {
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
const T = window.desktop && window.desktop.ic3 && window.desktop.ic3.t;
const QBY = Object.fromEntries([...L1, ...L2].map((q) => [q.id, q]));
const DOMS = ['Kiến thức cơ bản về công nghệ', 'Công dân số', 'Quản lí thông tin', 'Sáng tạo nội dung', 'Truyền thông', 'Cộng tác', 'An toàn và bảo mật'];
const PASS = 700;
const color = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h} 70% 50%)`; };
function toast(msg, ms = 2600) { const d = document.createElement('div'); d.textContent = msg; $('#toast').appendChild(d); setTimeout(() => d.remove(), ms); }
setToast(toast);
const lvName = (l) => (+l === 0 ? 'Đề GV' : 'L' + l);
async function loadCustomQs() { try { const L = await T.lib(); for (const st of L.sets) for (const q of st.qs) QBY[q.id] = { ...q, _set: st.title }; } catch {} }
const fmtT = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}'${String(s % 60).padStart(2, '0')}"`;
const dstr = (t) => new Date(t).toLocaleString('vi-VN');
const iso = (d) => d.toISOString().slice(0, 10);
const MODE = { exam: 'Kiểm tra', practice: 'Luyện tập', review: 'Ôn câu sai', challenge: 'Thử thách 60s' };

let info = null, results = [], tab = 'results', newIds = new Set();
const F = { cls: '', level: '', test: '', mode: '', from: iso(new Date(Date.now() - 6 * 864e5)), to: iso(new Date()), min: 0, best: false, q: '' };

if (!T) app.innerHTML = '<div class="tw"><div class="card" style="padding:30px">Khu vực giáo viên chỉ dùng được trong ứng dụng TinHocLab trên máy tính.</div></div>';
else lock();

async function lock() {
  $('#logout').hidden = true;
  const { has, rec } = await T.hasPassword();
  app.innerHTML = `<div class="lockbox"><div class="card"><div style="font-size:46px">🔒</div><h2 style="margin:6px 0">${has ? 'Nhập mật khẩu giáo viên' : 'Tạo mật khẩu giáo viên'}</h2>
    <p class="muted" style="font-size:14px">${has ? 'Học sinh không vào được khu vực này nếu không có mật khẩu.' : 'Lần đầu sử dụng: đặt mật khẩu để học sinh không xem được bảng điểm.'}</p>
    <input class="field" type="password" id="pw" placeholder="Mật khẩu" style="margin-top:10px">${has ? '' : '<input class="field" type="password" id="pw2" placeholder="Nhập lại mật khẩu" style="margin-top:10px">'}
    <div class="pwmsg" id="pwmsg"></div>
    <button class="btn red" id="go" style="width:100%;margin-top:12px">${has ? 'Mở khoá' : 'Tạo mật khẩu'}</button>
    ${has ? '<button class="linkbtn" id="forgot">Quên mật khẩu?</button>' : ''}</div></div>`;
  const msg = (t, ok) => { const m = $('#pwmsg'); m.textContent = t; m.className = 'pwmsg ' + (ok ? 'ok' : 'no'); };
  const go = async () => {
    const p = $('#pw').value; if (p.length < 4) return msg('Mật khẩu cần ít nhất 4 ký tự');
    if (!has && p !== $('#pw2').value) return msg('Hai mật khẩu chưa khớp');
    if (await T.login(p)) { if (!has) await showRecovery(true); main(); } else { msg('Sai mật khẩu, thầy/cô thử lại nhé'); $('#pw').value = ''; $('#pw').focus(); }
  };
  $('#go').onclick = go; app.querySelectorAll('input').forEach((i) => (i.onkeydown = (e) => { if (e.key === 'Enter') go(); })); $('#pw').focus();
  const f = $('#forgot'); if (f) f.onclick = () => forgot(rec);
}
// Hiện mã khôi phục (chỉ hiện một lần) để lấy lại mật khẩu khi quên
async function showRecovery(first) {
  const code = await T.newRecovery(); if (!code) return;
  await new Promise((res) => {
    const d = document.createElement('div'); d.className = 'ic3-modal';
    d.innerHTML = `<div class="card"><h3>🔑 Mã khôi phục mật khẩu</h3><p class="muted">${first ? 'Đã tạo mật khẩu. ' : ''}Thầy/cô hãy ghi lại mã này ở nơi an toàn. Khi quên mật khẩu, dùng mã này để đặt mật khẩu mới. Mã chỉ hiện <b>một lần</b>.</p>
      <div class="reccode">${code}</div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn ghost" data-c>📋 Sao chép</button><button class="btn" data-ok>Tôi đã ghi lại</button></div></div>`;
    document.body.appendChild(d);
    d.querySelector('[data-c]').onclick = () => { navigator.clipboard.writeText(code); toast('Đã sao chép mã'); };
    d.querySelector('[data-ok]').onclick = () => { d.remove(); res(); };
  });
}
async function forgot(rec) {
  const d = document.createElement('div'); d.className = 'ic3-modal';
  if (!rec) {
    const p = await T.dataPath();
    d.innerHTML = `<div class="card"><h3>Quên mật khẩu</h3><p class="muted">Máy này chưa có mã khôi phục. Để đặt lại, thầy/cô đóng ứng dụng, mở tệp sau bằng Notepad và xoá dòng <code>"pass":"…"</code> (kết quả học sinh và đề đã soạn không bị mất):</p>
      <code class="pathbox">${esc(p)}</code><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn ghost" data-open>📂 Mở thư mục</button><button class="btn" data-x>Đóng</button></div></div>`;
    document.body.appendChild(d);
    d.querySelector('[data-open]').onclick = () => T.openData();
    d.querySelector('[data-x]').onclick = () => d.remove();
    return;
  }
  d.innerHTML = `<div class="card"><h3>Đặt lại mật khẩu</h3><p class="muted">Nhập mã khôi phục (dạng XXXX-XXXX) được cấp khi tạo mật khẩu.</p>
    <input class="field" id="rc" placeholder="Mã khôi phục" style="text-transform:uppercase"><input class="field" type="password" id="rn" placeholder="Mật khẩu mới" style="margin-top:8px"><input class="field" type="password" id="rn2" placeholder="Nhập lại mật khẩu mới" style="margin-top:8px">
    <div class="pwmsg" id="rmsg"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button class="btn ghost" data-x>Huỷ</button><button class="btn red" data-ok>Đặt lại</button></div></div>`;
  document.body.appendChild(d);
  const m = (t) => { const e = d.querySelector('#rmsg'); e.textContent = t; e.className = 'pwmsg no'; };
  d.querySelector('[data-x]').onclick = () => d.remove();
  d.querySelector('[data-ok]').onclick = async () => {
    if (d.querySelector('#rn').value !== d.querySelector('#rn2').value) return m('Hai mật khẩu chưa khớp');
    const r = await T.recover({ code: d.querySelector('#rc').value, next: d.querySelector('#rn').value });
    if (!r.ok) return m(r.msg);
    d.remove(); toast('✅ Đã đặt mật khẩu mới'); await showRecovery(false); main();
  };
  d.querySelector('#rc').focus();
}

async function main() {
  $('#logout').hidden = false; $('#logout').onclick = lock;
  info = await T.info(); results = await T.results(); await loadCustomQs();
  T.onEvent((e) => {
    if (e.type === 'result') { results.push(e.data); newIds.add(e.data.id); toast(`📥 ${e.data.name} (${e.data.class}) vừa nộp: ${e.data.score}/1000`); if (tab === 'results' || tab === 'stats') draw(); }
    if (e.type === 'online') { info.online = e.data; if (tab === 'online') draw(); drawSrv(); }
    if (e.type === 'state') { info = e.data; drawSrv(); if (tab !== 'results') draw(); else drawTop(); }
    if (e.type === 'error') toast('⚠️ ' + e.data);
  });
  setInterval(async () => { info = await T.info(); drawSrv(); if (tab === 'online') draw(); }, 10000);
  draw();
}
function drawSrv() { const b = $('#srv'); b.className = 'net' + (info.running ? ' on' : ''); b.innerHTML = `<i></i>${info.running ? `Đang nhận kết quả · ${info.online.length} học sinh online` : 'Chưa bật nhận kết quả'}`; b.onclick = () => { tab = 'results'; draw(); }; }

function drawTop() {
  const top = $('#topcard'); if (!top) return;
  top.innerHTML = `<div class="big">${info.running ? '📡' : '💤'}</div>
    <div><h3>${info.running ? 'Đang nhận kết quả từ máy học sinh trong mạng LAN' : 'Bật để máy học sinh tự gửi kết quả về máy này'}</h3>
      <div class="muted" style="font-size:13.5px;margin-top:4px">${info.running ? 'Máy học sinh cùng mạng sẽ tự tìm thấy máy này. Nếu không tự tìm thấy, học sinh bấm vào nút kết nối và nhập một trong các địa chỉ:' : 'Hãy bật trước giờ học. Lần đầu bật trên Windows, nếu tường lửa hỏi, chọn “Cho phép” (Allow) cho mạng riêng (Private).'}</div>
      ${info.running ? `<div class="ips">${info.ips.map((x) => `<code>${x}</code>`).join('') || '<span class="muted">Không tìm thấy địa chỉ mạng – kiểm tra dây mạng/Wi-Fi</span>'}</div>` : ''}
      <div style="display:flex;gap:8px;margin-top:10px;align-items:center;font-size:13px"><span class="muted">Tên phòng</span><input class="field" id="room" value="${esc(info.room)}" style="width:160px;padding:6px 10px;font-size:13px"><span class="muted">Giáo viên</span><input class="field" id="tname" value="${esc(info.teacher)}" style="width:160px;padding:6px 10px;font-size:13px"><button class="btn sm ghost" id="saveRoom">Lưu</button></div></div>
    <button class="switch ${info.running ? 'on' : ''}" id="sw" title="Bật/tắt nhận kết quả"></button>`;
  $('#sw').onclick = async () => { info = info.running ? (await T.stop(), await T.info()) : await T.start(); drawSrv(); drawTop(); };
  $('#saveRoom').onclick = async () => { info = await T.setRoom({ room: $('#room').value, name: $('#tname').value }); toast('Đã lưu. Máy học sinh sẽ thấy tên mới.'); };
}

function draw() {
  drawSrv();
  const onlineN = info.online.length;
  app.innerHTML = `<div class="tw"><div class="card srvcard" id="topcard"></div>
    <div class="tabs">${[['results', '📋 Kết quả'], ['sets', '📝 Soạn đề'], ['online', `🟢 Đang online${onlineN ? `<span class="cnt">${onlineN}</span>` : ''}`], ['stats', '📊 Thống kê'], ['lb', '🏆 Xếp hạng XP'], ['settings', '⚙️ Cài đặt']].map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div id="pane"></div></div>`;
  drawTop();
  app.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
  ({ results: paneResults, sets: () => paneSets({ T, toast, sure, esc, $ }), online: paneOnline, stats: paneStats, lb: paneLb, settings: paneSettings })[tab]();
  if (tab !== 'sets') loadCustomQs();
}

// ---------- kết quả ----------
function filtered() {
  const from = new Date(F.from + 'T00:00:00').getTime(), to = new Date(F.to + 'T23:59:59').getTime();
  let r = results.filter((x) => (!F.cls || x.class === F.cls) && (!F.level || String(x.level) === F.level) && (!F.test || x.testId === F.test) && (!F.mode || x.mode === F.mode) && x.at >= from && x.at <= to && x.score >= F.min && (!F.q || x.name.toLowerCase().includes(F.q.toLowerCase())));
  if (F.best) { const m = new Map(); for (const x of r) { const k = x.name.toLowerCase() + '|' + x.class + '|' + x.testId; if (!m.has(k) || m.get(k).score < x.score) m.set(k, x); } r = [...m.values()]; }
  return r.sort((a, b) => b.at - a.at);
}
function paneResults() {
  const classes = [...new Set(results.map((x) => x.class))].sort();
  const tests = [...new Map(results.map((x) => [x.testId, x.testTitle.replace(/ \(\d+ điểm\)$/, '')])).entries()].sort();
  const r = filtered();
  const students = new Set(r.map((x) => x.name.toLowerCase() + '|' + x.class)).size;
  const rs = r.filter((x) => x.mode !== 'challenge');
  const avg = rs.length ? Math.round(rs.reduce((s, x) => s + x.score, 0) / rs.length) : 0;
  const passRate = rs.length ? Math.round((rs.filter((x) => x.score >= PASS).length / rs.length) * 100) : 0;
  $('#pane').innerHTML = `<div class="card filters">
      <label>Lớp<select id="fCls"><option value="">Tất cả</option>${classes.map((c) => `<option ${F.cls === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
      <label>Cấp độ<select id="fLv"><option value="">Tất cả</option><option value="1" ${F.level === '1' ? 'selected' : ''}>Level 1</option><option value="2" ${F.level === '2' ? 'selected' : ''}>Level 2</option><option value="0" ${F.level === '0' ? 'selected' : ''}>Đề của GV</option></select></label>
      <label>Bài thi<select id="fTest" style="max-width:260px"><option value="">Tất cả</option>${tests.map(([id, t]) => `<option value="${esc(id)}" ${F.test === id ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
      <label>Chế độ<select id="fMode"><option value="">Tất cả</option>${Object.entries(MODE).map(([k, v]) => `<option value="${k}" ${F.mode === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Từ ngày<input type="date" id="fFrom" value="${F.from}"></label><label>Đến ngày<input type="date" id="fTo" value="${F.to}"></label>
      <label>Điểm tối thiểu<input type="number" id="fMin" value="${F.min}" min="0" max="1000" step="50" style="min-width:90px;width:90px"></label>
      <label>Tìm tên<input id="fQ" value="${esc(F.q)}" placeholder="Nguyễn…"></label>
      <label class="chk"><input type="checkbox" id="fBest" ${F.best ? 'checked' : ''}> Chỉ điểm cao nhất</label>
      <span style="flex:1"></span><button class="btn sm ghost" id="fReset">↺ Đặt lại</button><button class="btn sm" id="exp">⬇ Xuất Excel</button>
    </div>
    <div class="sumrow"><div class="card sum"><b>${r.length}</b><span>lượt làm bài</span></div><div class="card sum"><b>${students}</b><span>học sinh</span></div><div class="card sum"><b>${avg}</b><span>điểm TB (không tính thử thách)</span></div><div class="card sum"><b>${passRate}%</b><span>tỉ lệ đạt (≥ 700)</span></div></div>
    <div class="card tblwrap"><table class="tbl"><thead><tr><th>STT</th><th>Tên</th><th>Lớp</th><th>Trường</th><th>Cấp độ</th><th>Bài thi</th><th>Chế độ</th><th>Điểm</th><th>Đúng</th><th>Thời gian</th><th>Nộp bài</th></tr></thead>
    <tbody>${r.map((x, i) => `<tr data-id="${x.id}" class="${newIds.has(x.id) ? 'new' : ''}"><td>${i + 1}</td><td><b>${esc(x.name)}</b></td><td>${esc(x.class)}</td><td>${esc(x.school)}</td><td>${lvName(x.level)}</td><td>${esc(x.testTitle)}</td><td>${MODE[x.mode] || esc(x.mode)}</td><td><span class="sc ${x.score >= PASS ? 'p' : x.score >= 500 ? 'm' : 'f'}">${x.score}</span></td><td>${x.correct}/${x.total}</td><td>${fmtT(x.duration)}</td><td>${dstr(x.at)}</td></tr>`).join('') || '<tr><td colspan="11" class="muted" style="text-align:center;padding:40px">Chưa có kết quả nào trong khoảng thời gian này.</td></tr>'}</tbody></table></div>`;
  newIds.clear();
  const bind = (id, k, num) => ($('#' + id).onchange = (e) => { F[k] = e.target.type === 'checkbox' ? e.target.checked : num ? +e.target.value : e.target.value; paneResults(); });
  bind('fCls', 'cls'); bind('fLv', 'level'); bind('fTest', 'test'); bind('fMode', 'mode'); bind('fFrom', 'from'); bind('fTo', 'to'); bind('fMin', 'min', true); bind('fBest', 'best');
  $('#fQ').oninput = (e) => { F.q = e.target.value; clearTimeout(window.__fq); window.__fq = setTimeout(() => { paneResults(); const i = $('#fQ'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); };
  $('#fReset').onclick = () => { Object.assign(F, { cls: '', level: '', test: '', mode: '', from: iso(new Date(Date.now() - 6 * 864e5)), to: iso(new Date()), min: 0, best: false, q: '' }); paneResults(); };
  $('#exp').onclick = () => exportCsv(r);
  app.querySelectorAll('.tbl tr[data-id]').forEach((tr) => (tr.onclick = () => detail(results.find((x) => x.id === tr.dataset.id))));
}
function exportCsv(r) {
  const head = ['STT', 'Họ tên', 'Lớp', 'Trường', 'Cấp độ', 'Bài thi', 'Chế độ', 'Điểm (/1000)', 'Số câu đúng', 'Tổng số câu', 'Đạt', 'Thời gian (giây)', 'XP', ...DOMS.map((d, i) => `CĐ${i + 1} ${d}`), 'Nộp bài'];
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = r.map((x, i) => [i + 1, x.name, x.class, x.school, +x.level === 0 ? 'Đề giáo viên' : 'Level ' + x.level, x.testTitle, MODE[x.mode] || x.mode, x.score, x.correct, x.total, x.mode === 'challenge' ? '' : x.score >= PASS ? 'Đạt' : 'Chưa đạt', x.duration, x.xp, ...DOMS.map((_, d) => (x.domains[d + 1] ? `${x.domains[d + 1][0]}/${x.domains[d + 1][1]}` : '')), dstr(x.at)]);
  const csv = [head, ...rows].map((row) => row.map(q).join(',')).join('\r\n');
  T.exportCsv(`KetQua_IC3_${F.cls || 'TatCa'}_${F.from}_${F.to}.csv`, csv).then((p) => p && toast('Đã xuất: ' + p, 4000));
}
function detail(x) {
  const d = document.createElement('div'); d.className = 'ic3-modal detail';
  const wrong = (x.wrong || []).map((id) => QBY[id]).filter(Boolean);
  d.innerHTML = `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">${esc(x.name)} · ${esc(x.class)}</h3><button class="btn sm ghost" data-x>Đóng</button></div>
    <p class="muted">${esc(x.testTitle)} · ${MODE[x.mode] || ''} · ${dstr(x.at)} · máy ${esc(x.ip)}</p>
    <div class="sumrow"><div class="card sum"><b>${x.score}</b><span>điểm /1000</span></div><div class="card sum"><b>${x.correct}/${x.total}</b><span>câu đúng</span></div><div class="card sum"><b>${fmtT(x.duration)}</b><span>thời gian</span></div><div class="card sum"><b>+${x.xp}</b><span>XP</span></div></div>
    <div class="bars">${DOMS.map((n, i) => x.domains[i + 1] ? (() => { const [c, t] = x.domains[i + 1]; const p = Math.round((c / t) * 100); return `<div class="br"><span>${i + 1}. ${n}</span><div class="bt"><i style="width:${p}%;background:${p > 80 ? '#34c759' : p > 50 ? '#ffcc00' : '#ff3b30'}"></i></div><b>${c}/${t}</b></div>`; })() : '').join('')}</div>
    ${wrong.length ? `<h4>Câu làm sai (${wrong.length})</h4><ol style="font-size:14px;line-height:1.6">${wrong.map((q) => `<li>${esc(q.q)} <span class="muted">– ${q._set ? esc(q._set) : `CĐ${q.d}, ${q.id[0] === '1' ? 'Level 1' : 'Level 2'}`}</span></li>`).join('')}</ol>` : '<p>✅ Không có câu sai.</p>'}
    <div style="margin-top:14px"><button class="btn sm ghost" data-del style="color:#d70015">Xoá kết quả này</button></div></div>`;
  document.body.appendChild(d);
  d.onclick = (e) => { if (e.target === d || e.target.closest('[data-x]')) d.remove(); };
  d.querySelector('[data-del]').onclick = async () => { if (!(await sure('Xoá kết quả này?', 'Kết quả sẽ bị xoá vĩnh viễn khỏi máy giáo viên.', 'Xoá', true))) return; await T.del([x.id]); results = results.filter((r) => r.id !== x.id); d.remove(); draw(); };
}

// ---------- online ----------
function paneOnline() {
  const on = info.online.slice().sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name, 'vi'));
  $('#pane').innerHTML = on.length ? `<div class="onl">${on.map((s) => `<div class="card"><span class="av" style="background:${color(s.name)}">${esc(s.name.trim().split(' ').pop()[0])}</span><div><b>${esc(s.name)} · ${esc(s.class)}</b><small>${esc(s.activity || '—')}</small><br><small>${esc(s.ip)} · ${Math.round((Date.now() - s.at) / 1000)} giây trước</small></div></div>`).join('')}</div>`
    : `<div class="card" style="padding:30px;text-align:center">${info.running ? 'Chưa có học sinh nào online. Học sinh cần mở phần Ôn luyện IC3 và đăng nhập.' : 'Hãy bật “nhận kết quả” ở trên để thấy học sinh online.'}</div>`;
}

// ---------- thống kê ----------
function paneStats() {
  const r = filtered().filter((x) => x.mode !== 'challenge');
  const byClass = new Map();
  for (const x of r) { const e = byClass.get(x.class) || { n: 0, s: 0, pass: 0, st: new Set() }; e.n++; e.s += x.score; if (x.score >= PASS) e.pass++; e.st.add(x.name.toLowerCase()); byClass.set(x.class, e); }
  const dom = DOMS.map(() => [0, 0]); for (const x of r) for (const [k, v] of Object.entries(x.domains || {})) { if (!dom[k - 1]) continue; dom[k - 1][0] += v[0]; dom[k - 1][1] += v[1]; }
  const qs = new Map(); for (const x of r) { for (const id of x.qids || []) { const e = qs.get(id) || [0, 0]; e[1]++; qs.set(id, e); } for (const id of x.wrong || []) { const e = qs.get(id) || [0, 0]; e[0]++; qs.set(id, e); } }
  const hard = [...qs.entries()].filter(([id, [, n]]) => QBY[id] && n >= 2).map(([id, [w, n]]) => ({ q: QBY[id], w, n, p: w / n })).sort((a, b) => b.p - a.p || b.n - a.n).slice(0, 15);
  $('#pane').innerHTML = `<p class="muted">Thống kê theo bộ lọc ở thẻ Kết quả (từ ${F.from} đến ${F.to}${F.cls ? ', lớp ' + esc(F.cls) : ''}). Không tính Thử thách 60 giây.</p>
  <div class="grid2"><div class="card"><h3>Theo lớp</h3><table class="tbl"><tr><th>Lớp</th><th>Học sinh</th><th>Lượt</th><th>TB</th><th>Đạt</th></tr>${[...byClass.entries()].sort().map(([c, e]) => `<tr><td><b>${esc(c)}</b></td><td>${e.st.size}</td><td>${e.n}</td><td>${Math.round(e.s / e.n)}</td><td>${Math.round((e.pass / e.n) * 100)}%</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Chưa có dữ liệu</td></tr>'}</table></div>
  <div class="card"><h3>Tỉ lệ đúng theo chủ đề</h3><div class="bars">${DOMS.map((n, i) => { const [c, t] = dom[i]; const p = t ? Math.round((c / t) * 100) : 0; return `<div class="br"><span>${i + 1}. ${n}</span><div class="bt"><i style="width:${p}%;background:${p > 80 ? '#34c759' : p > 50 ? '#ffcc00' : '#ff3b30'}"></i></div><b>${t ? p + '%' : '–'}</b></div>`; }).join('')}</div><p class="muted" style="font-size:12.5px">Chủ đề có tỉ lệ thấp nên được ôn lại trên lớp.</p></div></div>
  <div class="card" style="padding:18px 20px;margin-top:16px"><h3 style="margin:0 0 10px">15 câu học sinh hay sai nhất</h3><table class="tbl"><tr><th>Câu hỏi</th><th>Chủ đề</th><th>Cấp</th><th>Sai / lượt</th><th>Tỉ lệ sai</th></tr>${hard.map((h) => `<tr><td>${esc(h.q.q)}</td><td>${h.q._set ? esc(h.q._set) : h.q.d}</td><td>${h.q._set ? 'GV' : 'L' + h.q.id[0]}</td><td>${h.w}/${h.n}</td><td><span class="sc ${h.p > 0.5 ? 'f' : h.p > 0.2 ? 'm' : 'p'}">${Math.round(h.p * 100)}%</span></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Cần ít nhất 2 lượt làm mỗi câu để thống kê</td></tr>'}</table></div>`;
}

// ---------- xếp hạng ----------
function paneLb() {
  const classes = [...new Set(results.map((x) => x.class))].sort();
  const cls = F.lbCls ?? classes[0] ?? '';
  const m = new Map(); for (const x of results) { if (cls && x.class !== cls) continue; const k = x.name.toLowerCase(); const e = m.get(k) || { name: x.name, xp: 0, n: 0, best: 0 }; e.xp += x.xp; e.n++; e.best = Math.max(e.best, x.score); m.set(k, e); }
  const rows = [...m.values()].sort((a, b) => b.xp - a.xp);
  $('#pane').innerHTML = `<div class="card filters"><label>Lớp<select id="lbC">${classes.map((c) => `<option ${c === cls ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label></div>
    <div class="card" style="padding:6px 12px;margin-top:12px"><table class="lb"><tr><th>Hạng</th><th>Học sinh</th><th>Tổng XP</th><th>Số lượt</th><th>Điểm cao nhất</th></tr>${rows.map((x, i) => `<tr><td class="rk">${['🥇', '🥈', '🥉'][i] || i + 1}</td><td>${esc(x.name)}</td><td><b>${x.xp}</b></td><td>${x.n}</td><td>${x.best}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Chưa có dữ liệu</td></tr>'}</table></div>`;
  const s = $('#lbC'); if (s) s.onchange = (e) => { F.lbCls = e.target.value; paneLb(); };
}

// ---------- cài đặt ----------
function paneSettings() {
  $('#pane').innerHTML = `<div class="grid2"><div class="card"><h3>Đổi mật khẩu giáo viên</h3>
    <input class="field" type="password" id="o" placeholder="Mật khẩu hiện tại"><input class="field" type="password" id="n" placeholder="Mật khẩu mới (ít nhất 4 ký tự)" style="margin-top:8px"><input class="field" type="password" id="n2" placeholder="Nhập lại mật khẩu mới" style="margin-top:8px">
    <div class="pwmsg" id="cpmsg"></div><button class="btn sm" id="cp" style="margin-top:8px">Đổi mật khẩu</button>
    <h3 style="margin-top:22px">Mã khôi phục</h3><p class="muted" style="font-size:13.5px">Dùng khi quên mật khẩu. Tạo mã mới sẽ làm mã cũ hết hiệu lực.</p><button class="btn sm ghost" id="rec">🔑 Tạo mã khôi phục mới</button></div>
    <div class="card"><h3>Nhập kết quả từ tệp</h3><p class="muted" style="font-size:13.5px">Dùng khi không có mạng LAN: trên máy học sinh, các bài chưa gửi được có thể xuất ra tệp .json để nhập vào đây.</p><button class="btn sm ghost" id="imp">📂 Chọn tệp kết quả…</button>
    <h3 style="margin-top:20px">Dữ liệu</h3><p class="muted" style="font-size:13.5px">Đang lưu ${results.length} kết quả trên máy này.</p><button class="btn sm ghost" id="clr" style="color:#d70015">Xoá các kết quả đang lọc (${filtered().length})</button></div></div>`;
  const cpm = (t, ok) => { const m = $('#cpmsg'); m.textContent = t; m.className = 'pwmsg ' + (ok ? 'ok' : 'no'); };
  $('#cp').onclick = async () => {
    if (!$('#o').value) return cpm('Hãy nhập mật khẩu hiện tại');
    if ($('#n').value.length < 4) return cpm('Mật khẩu mới cần ít nhất 4 ký tự');
    if ($('#n').value !== $('#n2').value) return cpm('Hai ô mật khẩu mới chưa khớp');
    const r = await T.setPassword({ old: $('#o').value, next: $('#n').value });
    if (r.ok) { ['o', 'n', 'n2'].forEach((k) => ($('#' + k).value = '')); cpm('✅ Đã đổi mật khẩu. Lần sau mở khoá bằng mật khẩu mới.', true); toast('✅ Đã đổi mật khẩu'); } else cpm(r.msg);
  };
  $('#rec').onclick = () => showRecovery(false);
  $('#imp').onclick = async () => { const n = await T.importFiles(); results = await T.results(); toast(`Đã nhập ${n} kết quả`); draw(); };
  $('#clr').onclick = async () => { const ids = filtered().map((x) => x.id); if (!ids.length || !(await sure('Xoá kết quả đang lọc?', `Xoá vĩnh viễn ${ids.length} kết quả. Không thể hoàn tác.`, 'Xoá', true))) return; await T.del(ids); results = await T.results(); draw(); };
}
