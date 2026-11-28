// TinHocLab – Phòng An toàn số (mạch D)
import { MAILS, COMMON, POST, CASES } from './safety-data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KEY = 'thl.safe';
const P = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
P.mail = P.mail || { ans: {}, best: 0 }; P.pass = P.pass || { done: {} }; P.priv = P.priv || { best: 0, done: false }; P.cases = P.cases || { ans: {}, best: 0 };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch {} showScore(); };
function showScore() {
  const mail = Object.entries(P.mail.ans).filter(([id, v]) => MAILS.find((m) => m.id === id)?.phish === v).length;
  const cs = Object.entries(P.cases.ans).filter(([id, v]) => CASES.find((c) => c.id === id)?.a === v).length;
  $('#score').textContent = `THƯ ${mail}/${MAILS.length} · MẬT KHẨU ${Object.keys(P.pass.done).length}/3 · RIÊNG TƯ ${P.priv.done ? '✓' : '—'} · TÌNH HUỐNG ${cs}/${CASES.length}`;
}

// ---------- thẻ ----------
function showPane(p) { $$('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.p === p)); $$('.pane').forEach((s) => (s.hidden = s.id !== 'p-' + p)); history.replaceState(null, '', '#' + p); }
$('#tabs').onclick = (e) => { const a = e.target.closest('a[data-p]'); if (a) showPane(a.dataset.p); };

// ---------- 1. hộp thư ----------
let curMail = MAILS[0].id;
const status = $('#status');
function mailList() {
  $('#mlist').innerHTML = MAILS.map((m) => {
    const a = P.mail.ans[m.id]; const has = a !== undefined; const right = has && a === m.phish;
    return `<div class="mi ${m.id === curMail ? 'on' : ''} ${has ? '' : 'unread'}" data-id="${m.id}"><b>${esc(m.from)}</b><span class="t">${esc(m.time)}</span><span class="s">${esc(m.subject)}</span>${has ? `<span class="tag ${right ? 'ok' : 'bad'}">${right ? '✓ ĐÚNG' : '✗ SAI'} · ${m.phish ? 'LỪA ĐẢO' : 'AN TOÀN'}</span>` : ''}</div>`;
  }).join('');
  const n = Object.keys(P.mail.ans).length, ok = Object.entries(P.mail.ans).filter(([id, v]) => MAILS.find((m) => m.id === id).phish === v).length;
  $('#mailScore').textContent = `ĐÃ XÉT ${n}/${MAILS.length} · ĐÚNG ${ok}`;
}
function mailRead() {
  const m = MAILS.find((x) => x.id === curMail); const a = P.mail.ans[m.id];
  let body = m.body.map((p) => `<p>${p.replace(/\{L(\d)\}/g, (_, i) => `<a data-href="${esc(m.links[i][1])}">${esc(m.links[i][0])}</a>`)}</p>`).join('');
  const done = Object.keys(P.mail.ans).length === MAILS.length;
  $('#mread').innerHTML = `<div class="from"><span class="av">${esc(m.from[0])}</span><div><b>${esc(m.from)}</b><div class="addr">&lt;${esc(m.addr)}&gt; · tới: em</div></div></div>
    <h3>${esc(m.subject)}</h3><div class="body">${body}</div>${m.attach ? `<span class="att">📎 ${esc(m.attach)}</span>` : ''}
    ${a === undefined ? `<div class="act"><span style="align-self:center;color:var(--mute)">Thư này là…</span><button class="bb safe" data-v="0">✓ AN TOÀN</button><button class="bb phish" data-v="1">⚠ LỪA ĐẢO</button></div>`
      : `<div class="verdict ${a === m.phish ? 'ok' : 'bad'}"><h4>${a === m.phish ? '✓ Chính xác!' : '✗ Chưa đúng.'} Đây là thư ${m.phish ? '<span style="color:var(--pink)">LỪA ĐẢO</span>' : '<span style="color:var(--green)">AN TOÀN</span>'}.</h4><ul>${m.flags.map((f) => `<li>${f}</li>`).join('')}</ul></div>
         <div class="act">${done ? `<span style="align-self:center">Em đã xét hết ${MAILS.length} thư.</span><button class="bb ghost" id="mailRedo">LÀM LẠI TỪ ĐẦU</button>` : `<button class="bb" id="mailNext">THƯ TIẾP THEO ›</button>`}</div>`}`;
  $$('#mread .body a').forEach((l) => {
    l.onmouseenter = () => { status.textContent = l.dataset.href; status.classList.add('on'); };
    l.onmouseleave = () => status.classList.remove('on');
    l.onclick = (e) => { e.preventDefault(); status.textContent = 'Bài luyện tập – link không mở. Địa chỉ thật: ' + l.dataset.href; status.classList.add('on'); setTimeout(() => status.classList.remove('on'), 2500); };
  });
  $$('#mread [data-v]').forEach((b) => (b.onclick = () => {
    P.mail.ans[m.id] = b.dataset.v === '1';
    const ok = Object.entries(P.mail.ans).filter(([id, v]) => MAILS.find((x) => x.id === id).phish === v).length; P.mail.best = Math.max(P.mail.best, ok);
    save(); mailList(); mailRead();
  }));
  const nx = $('#mailNext'); if (nx) nx.onclick = () => { const n = MAILS.find((x) => P.mail.ans[x.id] === undefined); if (n) { curMail = n.id; mailList(); mailRead(); } };
  const rd = $('#mailRedo'); if (rd) rd.onclick = () => { P.mail.ans = {}; save(); curMail = MAILS[0].id; mailList(); mailRead(); };
}
$('#mlist').onclick = (e) => { const it = e.target.closest('.mi'); if (it) { curMail = it.dataset.id; mailList(); mailRead(); } };

// ---------- 2. mật khẩu ----------
const SEQS = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1qaz2wsx3edc'];
function analyze(pw) {
  const r = { len: [...pw].length, lower: /[a-z]/.test(pw), upper: /[A-Z]/.test(pw), digit: /\d/.test(pw), sym: /[^A-Za-z0-9]/.test(pw), common: false, pattern: false, year: /(19|20)\d\d/.test(pw), words: 0 };
  const low = pw.toLowerCase();
  r.common = COMMON.includes(low) || COMMON.includes(low.replace(/\d+$/, '')) || COMMON.includes(low.replace(/[!@#.]+$/, ''));
  let seq = 0;
  for (const s of SEQS) for (let i = 0; i + 4 <= s.length; i++) { if (low.includes(s.slice(i, i + 4))) seq++; if (low.includes([...s.slice(i, i + 4)].reverse().join(''))) seq++; }
  r.pattern = seq > 0 || /(.)\1\1/.test(pw);
  const parts = pw.split(/[\s\-_.]+/).filter((w) => w.length >= 3); r.words = parts.length;
  let pool = (r.lower ? 26 : 0) + (r.upper ? 26 : 0) + (r.digit ? 10 : 0) + (r.sym ? 33 : 0); if (/[^\x00-\x7f]/.test(pw)) pool += 40;
  let bits = r.len * Math.log2(Math.max(pool, 1));
  if (r.pattern) bits -= Math.min(bits * 0.35, 4 * Math.log2(Math.max(pool, 2)) * (seq || 1));
  if (r.year) bits -= 10;
  if (r.words >= 4) bits = Math.max(bits * 0.75, r.words * 11 + (r.digit ? 3 : 0));
  else bits *= 0.8; // con người đặt mật khẩu không ngẫu nhiên
  if (r.common) bits = 6;
  r.bits = Math.max(0, bits);
  r.level = !pw ? -1 : r.bits < 28 ? 0 : r.bits < 40 ? 1 : r.bits < 60 ? 2 : r.bits < 80 ? 3 : 4;
  return r;
}
function crackTime(bits) {
  const s = Math.pow(2, bits) / 2 / 1e10; // 10 tỉ lần đoán mỗi giây
  if (s < 1) return 'ngay lập tức';
  if (s > 3.15e13) return 'hơn một triệu năm';
  const u = [[60, 'giây'], [60, 'phút'], [24, 'giờ'], [365, 'ngày'], [Infinity, 'năm']];
  let v = s; for (const [k, n] of u) { if (v < k) return `khoảng ${Math.max(1, Math.round(v)).toLocaleString('vi-VN')} ${n}`; v /= k; }
  return 'hàng triệu năm';
}
const LV = [['Rất yếu', '#e0287d', 8], ['Yếu', '#ff7a1a', 25], ['Trung bình', '#ffd400', 50], ['Mạnh', '#19a55a', 78], ['Rất mạnh', '#0a7a3a', 100]];
const TASKS = [
  ['common', 'Gõ thử một mật khẩu <b>phổ biến</b> (như 123456) để thấy nó bị đoán nhanh thế nào.'],
  ['strong', 'Tạo mật khẩu <b>≥ 12 ký tự</b>, đủ chữ thường, chữ hoa, số, ký hiệu, đạt mức <b>Mạnh</b>.'],
  ['phrase', 'Tạo một <b>cụm mật khẩu</b> từ ít nhất 4 từ (nối bằng dấu - hoặc cách), dài ≥ 20 ký tự, đạt mức <b>Mạnh</b>.'],
];
function pwUpdate() {
  const pw = $('#pw').value, r = analyze(pw);
  const lv = r.level < 0 ? null : LV[r.level];
  $('#pwBar').style.width = lv ? lv[2] + '%' : '0'; $('#pwBar').style.background = lv ? lv[1] : '';
  $('#pwLevel').textContent = lv ? lv[0] : '—'; $('#pwLevel').style.color = lv ? lv[1] : '';
  $('#pwTime').textContent = pw ? `Máy tính mạnh đoán ra trong: ${crackTime(r.bits)}` : '';
  const items = [[r.len >= 12, `Dài ít nhất 12 ký tự (đang ${r.len})`], [r.lower, 'Có chữ thường'], [r.upper, 'Có chữ HOA'], [r.digit, 'Có chữ số'], [r.sym, 'Có ký hiệu (! @ # - …)'], [!r.common, 'Không phải mật khẩu phổ biến', r.common], [!r.pattern, 'Không có dãy dễ đoán (1234, abcd, qwer, aaa)', r.pattern], [!r.year, 'Không chứa năm sinh / năm (19xx, 20xx)', r.year]];
  $('#pwChecks').innerHTML = pw ? items.map(([ok, t, bad]) => `<li class="${ok ? 'ok' : bad ? 'bad' : ''}">${t}</li>`).join('') : '';
  if (pw) {
    if (r.common) P.pass.done.common = 1;
    if (r.len >= 12 && r.lower && r.upper && r.digit && r.sym && r.level >= 3) P.pass.done.strong = 1;
    if (r.words >= 4 && r.len >= 20 && r.level >= 3) P.pass.done.phrase = 1;
    save(); tasks();
  }
}
function tasks() { $('#pwTasks').innerHTML = TASKS.map(([k, t]) => `<li class="${P.pass.done[k] ? 'ok' : ''}">${t}</li>`).join(''); }
const WORDS = ['meo', 'voi', 'ga', 'chim', 'ca', 'tao', 'cam', 'xoai', 'dua', 'mua', 'nang', 'gio', 'may', 'sao', 'trang', 'bien', 'nui', 'song', 'xanh', 'tim', 'vang', 'nhay', 'bay', 'boi', 'chay', 'hat', 'cuoi', 'banh', 'keo', 'sach', 'but', 'diem', 'ruong', 'lua', 'que', 'ho', 'rua', 'tho', 'cua', 'tom', 'oc', 'ban', 'ghe', 'den', 'cay', 'la', 'hoa', 'quat'];
$('#pwGen').onclick = () => { const r = new Uint32Array(5); crypto.getRandomValues(r); const w = [0, 1, 2, 3].map((i) => WORDS[r[i] % WORDS.length]); w[1] = w[1][0].toUpperCase() + w[1].slice(1); $('#pwIdea').textContent = w.join('-') + '-' + (r[4] % 90 + 10); };
$('#pw').addEventListener('input', pwUpdate);
$('#pwShow').onclick = () => { const i = $('#pw'); i.type = i.type === 'password' ? 'text' : 'password'; $('#pwShow').textContent = i.type === 'password' ? 'HIỆN' : 'ẨN'; };

// ---------- 3. quyền riêng tư ----------
const picked = new Set(); let checked = false;
const RISK = ['addr', 'away', 'phone', 'school', 'card', 'ticket', 'plate'];
function scene() {
  return `<svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="360" fill="#f3e6cf"/><rect y="205" width="600" height="155" fill="#b07a4a"/><rect y="205" width="600" height="10" fill="#8f5f36"/>
  <rect x="160" y="30" width="60" height="120" fill="#cfe7ff" stroke="#7a5a3a" stroke-width="6"/>
  <g><rect x="80" y="120" width="40" height="38" fill="#c86a3c"/><path d="M100 120c-30-20-28-50-8-60 2 20 6 30 8 60zm0 0c28-20 30-48 10-60-4 22-8 34-10 60zm0 0c-4-25 0-45 0-58 6 14 6 34 0 58z" fill="#3f9a4f"/></g>
  <g><rect x="244" y="46" width="88" height="40" rx="4" fill="#1d4ed8"/><text x="288" y="63" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="system-ui">SỐ 12</text><text x="288" y="78" text-anchor="middle" font-size="9" fill="#fff" font-family="system-ui">NGÕ 34 HOA SỮA</text></g>
  <rect x="455" y="130" width="120" height="8" fill="#8f5f36"/><g fill="#555"><ellipse cx="515" cy="118" rx="34" ry="14"/><circle cx="488" cy="106" r="12"/><path d="M480 96l3-10 6 8zM492 96l5-9 3 10z"/><path d="M548 118c14-4 16 6 6 10" stroke="#555" stroke-width="5" fill="none"/></g>
  <g><circle cx="320" cy="150" r="46" fill="#f6cfa7"/><path d="M274 150c0-40 20-56 46-56s46 16 46 56c-8-22-22-30-46-30s-38 8-46 30z" fill="#2b1d14"/><circle cx="304" cy="152" r="5" fill="#222"/><circle cx="336" cy="152" r="5" fill="#222"/><path d="M304 172q16 12 32 0" stroke="#a33" stroke-width="3" fill="none"/><rect x="282" y="196" width="76" height="40" rx="14" fill="#e0287d"/></g>
  <g transform="rotate(-4 115 268)"><rect x="40" y="232" width="150" height="74" rx="4" fill="#fff" stroke="#999"/><rect x="40" y="232" width="150" height="16" fill="#0ea5e9"/><text x="48" y="244" font-size="9" fill="#fff" font-weight="700" font-family="system-ui">THẺ LÊN MÁY BAY</text><text x="48" y="262" font-size="9" font-family="system-ui">NGUYEN THI NA</text><text x="48" y="276" font-size="9" font-family="system-ui">HÀ NỘI → ĐÀ LẠT · 29/11</text><text x="48" y="292" font-size="10" font-weight="700" font-family="monospace">MÃ ĐẶT CHỖ: X7K2PQ</text></g>
  <g transform="rotate(5 467 260)"><rect x="392" y="216" width="150" height="88" rx="6" fill="#fffbe6" stroke="#999"/><rect x="400" y="232" width="34" height="42" fill="#cbd5e1"/><text x="442" y="232" font-size="9" font-weight="700" font-family="system-ui">THẺ HỌC SINH</text><text x="442" y="248" font-size="9" font-family="system-ui">Nguyễn Thị Na</text><text x="442" y="261" font-size="9" font-family="system-ui">Lớp 7A</text><text x="442" y="274" font-size="9" font-family="system-ui">Sinh: 12/03/2013</text><text x="400" y="294" font-size="9" font-family="monospace">Mã HS: HS2013-0457</text></g>
  ${POST.spots.map((s) => `<rect class="spot ${spotCls(s)}" data-k="${s.id}" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="6"><title>${esc(s.label)}</title></rect>`).join('')}
  </svg>`;
}
function spotCls(s) { if (!checked) return picked.has(s.id) ? 'pick' : ''; if (s.safe) return picked.has(s.id) ? 'wrong' : ''; return picked.has(s.id) ? 'pick' : 'miss'; }
function renderPost() {
  $('#post').innerHTML = `<div class="ph"><span class="av"></span><div><b>Nguyễn Thị Na</b><div style="color:var(--mute);font-size:12px">đang soạn bài · <span id="audLbl"></span></div></div></div>
    <div class="ptx">${POST.text.map(([t, k]) => (k ? `<span data-k="${k}" class="${!checked ? (picked.has(k) ? 'pick' : '') : picked.has(k) ? 'pick' : 'miss'}">${esc(t)}</span>` : esc(t))).join('')}</div>${scene()}`;
  $('#audLbl').textContent = POST.settings[0].opts[setVal.aud];
}
const setVal = { aud: 0, loc: 0 };
function renderSet() {
  $('#privSet').innerHTML = POST.settings.map((s) => `<div class="setrow"><span>${s.label}</span><select data-s="${s.id}">${s.opts.map((o, i) => `<option value="${i}" ${setVal[s.id] === i ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`).join('');
  $$('#privSet select').forEach((sel) => (sel.onchange = () => { setVal[sel.dataset.s] = +sel.value; renderPost(); }));
}
$('#post').onclick = (e) => { const t = e.target.closest('[data-k]'); if (!t || checked) return; const k = t.dataset.k; picked.has(k) ? picked.delete(k) : picked.add(k); renderPost(); };
$('#privCheck').onclick = () => {
  checked = true; renderPost();
  const found = RISK.filter((k) => picked.has(k)), miss = RISK.filter((k) => !picked.has(k)), wrong = POST.spots.filter((s) => s.safe && picked.has(s.id));
  const setOk = POST.settings.every((s) => s.good.includes(setVal[s.id]));
  const ok = !miss.length && !wrong.length && setOk;
  P.priv.best = Math.max(P.priv.best, found.length); if (ok) P.priv.done = true; save();
  $('#privRes').innerHTML = `<div class="res"><h4 class="${ok ? 'ok' : 'bad'}">${ok ? '✓ Bài đăng đã an toàn! 🎉' : `Tìm được ${found.length}/${RISK.length} chi tiết nguy hiểm`}</h4><ul>
    ${found.map((k) => `<li class="ok">✓ ${POST.why[k]}</li>`).join('')}${miss.map((k) => `<li class="bad">✗ Bỏ sót – ${POST.why[k]}</li>`).join('')}
    ${wrong.map((s) => `<li>• ${esc(s.label)}: chi tiết này không nguy hiểm.</li>`).join('')}
    <li class="${setOk ? 'ok' : 'bad'}">${setOk ? '✓ Cài đặt an toàn: chỉ bạn bè xem, tắt vị trí.' : '✗ Cài đặt: nên để "Bạn bè" (hoặc "Chỉ mình tôi") và tắt gắn vị trí.'}</li></ul>
    <p style="font-size:12.5px;color:var(--ink2);margin:10px 0 0">Quy tắc nhanh: trước khi đăng, tự hỏi <b>"Người lạ có thể dùng chi tiết này để tìm ra mình, giả danh mình, hoặc biết khi nào nhà vắng không?"</b></p></div>`;
};
$('#privReset').onclick = () => { picked.clear(); checked = false; setVal.aud = 0; setVal.loc = 0; renderSet(); renderPost(); $('#privRes').innerHTML = ''; };

// ---------- 4. tình huống ----------
let ci = 0;
function renderCase() {
  const c = CASES[ci], a = P.cases.ans[c.id];
  const ok = Object.entries(P.cases.ans).filter(([id, v]) => CASES.find((x) => x.id === id).a === v).length;
  $('#caseScore').textContent = `ĐÚNG ${ok}/${CASES.length}`;
  $('#case').innerHTML = `<div class="casebox"><div class="card" style="--sc:var(--green)"><span class="lb">TÌNH HUỐNG ${ci + 1}/${CASES.length} · ${esc(c.tag.toUpperCase())}</span><h3>${esc(c.q)}</h3>
    ${c.opts.map((o, i) => `<button class="opt ${a !== undefined ? (i === c.a ? 'right' : i === a ? 'wrongp' : '') : ''}" data-i="${i}" ${a !== undefined ? 'disabled' : ''}>${'ABCD'[i]}. ${esc(o)}</button>`).join('')}
    ${a !== undefined ? `<div class="why ${a === c.a ? '' : 'bad'}"><b>${a === c.a ? '✓ Đúng rồi!' : '✗ Chưa phải cách tốt nhất.'}</b> ${esc(c.why)}</div>` : ''}
    <div style="display:flex;gap:10px;margin-top:16px">${ci > 0 ? '<button class="bb ghost" id="cPrev">‹ TRƯỚC</button>' : ''}${ci < CASES.length - 1 ? '<button class="bb" id="cNext">TIẾP ›</button>' : `<button class="bb ghost" id="cRedo">LÀM LẠI TẤT CẢ</button>`}</div></div>
    <div class="card"><span class="lb">TIẾN ĐỘ</span><div class="dots">${CASES.map((x, i) => { const v = P.cases.ans[x.id]; return `<i class="${v === undefined ? '' : v === x.a ? 'ok' : 'bad'} ${i === ci ? 'cur' : ''}" data-j="${i}">${i + 1}</i>`; }).join('')}</div>
    <p style="font-size:12.5px;color:var(--ink2);margin-top:16px">Khi gặp chuyện không ổn trên mạng: <b>Dừng lại – Không trả lời – Lưu bằng chứng – Kể với người lớn tin cậy.</b></p></div></div>`;
  $$('#case .opt').forEach((b) => (b.onclick = () => { P.cases.ans[c.id] = +b.dataset.i; P.cases.best = Math.max(P.cases.best, Object.entries(P.cases.ans).filter(([id, v]) => CASES.find((x) => x.id === id).a === v).length); save(); renderCase(); }));
  const pv = $('#cPrev'), nx = $('#cNext'), rd = $('#cRedo');
  if (pv) pv.onclick = () => { ci--; renderCase(); }; if (nx) nx.onclick = () => { ci++; renderCase(); };
  if (rd) rd.onclick = () => { P.cases.ans = {}; save(); ci = 0; renderCase(); };
  $$('#case .dots i').forEach((d) => (d.onclick = () => { ci = +d.dataset.j; renderCase(); }));
}

// ---------- khởi động ----------
mailList(); mailRead(); tasks(); renderSet(); renderPost(); renderCase(); showScore();
const want = location.hash.slice(1); if (['mail', 'pass', 'priv', 'cases'].includes(want)) showPane(want);
window.__safe = { P, analyze, showPane };
