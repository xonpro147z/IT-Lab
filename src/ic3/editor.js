// Khu vực giáo viên – SOẠN ĐỀ: danh sách đề, trình soạn câu hỏi (6 dạng), ảnh/GIF/video, meme, nhập PDF/Word, xem thử
import { renderQ, isAnswered, isCorrect, mediaEl, showMeme, TYPE_LABEL, qText } from './qrender.js';
import { extractPdf, extractDocx, extractText, parseQuestions } from './pdfimport.js';

let C; // ngữ cảnh từ teacher.js: { T, toast, sure, esc, $ }
let lib = null, view = 'list', editId = null, openQ = -1, saveTm = null, importState = null;
const rid = (p) => p + Math.random().toString(16).slice(2, 10);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const TYPES = [['one', '◉ Một đáp án'], ['multi', '☑ Nhiều đáp án'], ['yesno', '✓✗ Đúng / Sai'], ['match', '⇄ Ghép nối kéo thả'], ['order', '↕ Sắp xếp thứ tự'], ['hot', '🎯 Bấm vào hình']];
const TNAME = Object.fromEntries(TYPES);
const pane = () => C.$('#pane');

export async function paneSets(ctx) {
  C = ctx;
  if (!lib) lib = await C.T.lib();
  if (view === 'edit' && lib.sets.find((s) => s.id === editId)) return drawEdit();
  if (view === 'import') return drawImport();
  if (view === 'memes') return drawMemes();
  view = 'list'; drawList();
}

// ================= LƯU =================
function cur() { return lib.sets.find((s) => s.id === editId); }
function touch(now) {
  const st = C.$('#saveSt'); if (st) { st.textContent = 'Đang lưu…'; st.className = 'savest'; }
  clearTimeout(saveTm);
  const go = async () => { const s = cur(); if (!s) return; await C.T.putSet(JSON.parse(JSON.stringify(s))); const e = C.$('#saveSt'); if (e) { e.textContent = '✓ Đã lưu'; e.className = 'savest ok'; } refreshBadges(); };
  if (now) return go(); saveTm = setTimeout(go, 600);
}
function newSet(title, qs = []) { return { id: rid('s'), title: title || 'Đề mới', desc: '', practice: true, exam: true, time: 15, shuffle: true, published: false, memes: { ok: [], no: [] }, qs, updated: Date.now() }; }
function blankQ(t) {
  const q = { id: rid('g'), t, q: '', e: '' };
  if (t === 'one') Object.assign(q, { o: ['', '', '', ''], a: 0 });
  if (t === 'multi') Object.assign(q, { o: ['', '', '', ''], a: [0, 1], n: 2 });
  if (t === 'yesno') Object.assign(q, { s: ['', ''], a: [true, false] });
  if (t === 'match') Object.assign(q, { L: ['', '', ''], R: ['', '', ''], a: [0, 1, 2] });
  if (t === 'order') Object.assign(q, { items: ['', '', ''] });
  if (t === 'hot') Object.assign(q, { img: null, box: null, a: 'box' });
  return q;
}
// đổi dạng câu: giữ lại nội dung dùng được
function convertQ(q, t) {
  const n = blankQ(t); n.id = q.id; n.q = q.q; n.e = q.e; if (q.media) n.media = q.media; if (q.okm) n.okm = q.okm; if (q.nom) n.nom = q.nom;
  const texts = q.o || q.s || q.items || q.L || [];
  if (t === 'one' || t === 'multi') { if (texts.length >= 2) n.o = texts.slice(); if (t === 'one') n.a = Array.isArray(q.a) ? q.a[0] || 0 : typeof q.a === 'number' ? q.a : 0; else { n.a = Array.isArray(q.a) ? q.a.slice() : typeof q.a === 'number' ? [q.a] : [0]; n.n = n.a.length; } }
  if (t === 'yesno' && texts.length) { n.s = texts.slice(); n.a = n.s.map(() => true); }
  if (t === 'order' && texts.length >= 2) n.items = texts.slice();
  if (t === 'match' && texts.length >= 2) { n.L = texts.slice(); n.R = q.R ? q.R.slice() : texts.map(() => ''); n.a = n.L.map((_, i) => i); }
  if (t === 'hot' && q.media && q.media.k === 'img') { n.img = q.media; delete n.media; }
  return n;
}
export function problems(q) {
  const p = [], empty = (a) => !a || a.some((x) => !String(x).trim());
  if (!String(q.q || '').trim()) p.push('Chưa có nội dung câu hỏi');
  if (q.t === 'one' || q.t === 'multi') { if (q.o.length < 2) p.push('Cần ít nhất 2 phương án'); if (empty(q.o)) p.push('Có phương án đang trống'); }
  if (q.t === 'multi' && q.a.length < 2) p.push('Dạng nhiều đáp án cần ít nhất 2 đáp án đúng');
  if (q.t === 'yesno') { if (!q.s.length) p.push('Cần ít nhất 1 ý'); if (empty(q.s)) p.push('Có ý đang trống'); }
  if (q.t === 'match') { if (q.L.length < 2) p.push('Cần ít nhất 2 cặp'); if (empty(q.L) || empty(q.R)) p.push('Có ô ghép đang trống'); if (new Set(q.R).size !== q.R.length) p.push('Hai vế phải trùng nhau'); }
  if (q.t === 'order') { if (q.items.length < 2) p.push('Cần ít nhất 2 bước'); if (empty(q.items)) p.push('Có bước đang trống'); }
  if (q.t === 'hot') { if (!q.img) p.push('Chưa có ảnh'); else if (!q.box || q.box.w < 1) p.push('Chưa khoanh vùng đúng trên ảnh'); }
  return p;
}

// ================= MEDIA: dán / kéo thả / chọn tệp / link =================
async function bytesOf(file) { return new Uint8Array(await file.arrayBuffer()); }
async function saveFile(file) { if (file.size > 80 * 1024 * 1024) return C.toast('Tệp quá lớn (tối đa 80 MB)'); const r = await C.T.saveMedia(await bytesOf(file)); if (!r.ok) C.toast('⚠️ ' + r.msg); return r.ok ? { f: r.f, k: r.k } : null; }
async function saveUrl(u) { const r = await C.T.mediaFromUrl(u); if (!r.ok) C.toast('⚠️ ' + r.msg); return r.ok ? { f: r.f, k: r.k } : null; }
// lấy media từ dữ liệu dán/kéo thả: ưu tiên link gốc (giữ được ảnh động GIF), sau đó tới tệp
async function fromTransfer(dt) {
  const html = dt.getData('text/html'), uri = (dt.getData('text/uri-list') || '').split('\n').find((x) => x && !x.startsWith('#')), txt = dt.getData('text/plain');
  const src = (html.match(/<img[^>]+src="([^"]+)"/i) || [])[1];
  const files = [...(dt.files || [])].filter((f) => /^(image|video)\//.test(f.type));
  const isGif = (u) => /\.gif(\?|$)|giphy|tenor/i.test(u || '');
  if (src && /^https?:/i.test(src) && (isGif(src) || !files.length)) return [await saveUrl(src.replace(/&amp;/g, '&'))];
  if (files.length) { const out = []; for (const f of files) out.push(await saveFile(f)); return out; }
  if (src) return [await saveUrl(src)];
  const u = uri || (/^(https?:|data:image)/i.test((txt || '').trim()) ? txt.trim() : '');
  if (u) return [await saveUrl(u)];
  return [];
}
function askLink() {
  return new Promise((res) => {
    const d = h(`<div class="ic3-modal"><div class="card"><h3>Dán link ảnh / GIF / video</h3><p class="muted">Trên Google Ảnh: bấm chuột phải vào ảnh → <b>Sao chép địa chỉ hình ảnh</b>, rồi dán vào đây. Với GIF nên dùng cách này để ảnh vẫn chuyển động. Video: link trực tiếp tới tệp .mp4 / .webm.</p><input class="field" placeholder="https://…"><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn ghost" data-v="0">Huỷ</button><button class="btn" data-v="1">Tải về</button></div></div></div>`);
    document.body.appendChild(d); const i = d.querySelector('input'); i.focus();
    const done = (ok) => { d.remove(); res(ok ? i.value.trim() : ''); };
    d.querySelectorAll('button').forEach((b) => (b.onclick = () => done(b.dataset.v === '1'))); i.onkeydown = (e) => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); };
  });
}
// Ô nhận media. opts: {value, onSet(m), onClear(), imgOnly, multiple, label, small}
function mediaSlot(o) {
  const el = h(`<div class="mslot ${o.small ? 'small' : ''}" tabindex="0"></div>`);
  const busy = (b) => el.classList.toggle('busy', b);
  const take = async (list) => {
    list = list.filter(Boolean);
    if (o.imgOnly) { const bad = list.filter((m) => m.k !== 'img'); if (bad.length) C.toast('Ô này chỉ nhận ảnh (PNG/JPG/GIF)'); list = list.filter((m) => m.k === 'img'); }
    if (list.length) o.multiple ? list.forEach((m) => o.onSet(m)) : o.onSet(list[0]);
  };
  const draw = () => {
    el.innerHTML = '';
    if (o.value && !o.multiple) {
      const pv = h('<div class="mprev"></div>'); pv.appendChild(mediaEl(o.value, lib.base, { controls: o.value.k === 'video' }));
      pv.appendChild(h(`<button class="mx" title="Bỏ">✕</button>`)); pv.querySelector('.mx').onclick = (e) => { e.stopPropagation(); o.onClear(); };
      el.appendChild(pv); return;
    }
    el.appendChild(h(`<div class="mdrop"><div class="mic">${o.small ? '＋' : '🖼️'}</div>${o.small ? '' : `<div><b>${o.label || 'Thêm ảnh / GIF / video'}</b><div class="muted">Bấm vào đây rồi <kbd>Ctrl</kbd>+<kbd>V</kbd> để dán ảnh vừa sao chép, hoặc kéo thả tệp/ảnh từ trình duyệt vào.</div><div class="mbtns"><button class="btn sm ghost" data-f>📁 Chọn tệp</button><button class="btn sm ghost" data-l>🔗 Dán link</button></div></div>`}</div>`));
    const inp = h(`<input type="file" hidden ${o.multiple ? 'multiple' : ''} accept="${o.imgOnly ? 'image/*' : 'image/*,video/mp4,video/webm'}">`); el.appendChild(inp);
    inp.onchange = async () => { busy(true); const out = []; for (const f of inp.files) out.push(await saveFile(f)); busy(false); take(out); };
    const fb = el.querySelector('[data-f]'); if (fb) fb.onclick = (e) => { e.stopPropagation(); inp.click(); };
    const lb = el.querySelector('[data-l]'); if (lb) lb.onclick = async (e) => { e.stopPropagation(); const u = await askLink(); if (u) { busy(true); take([await saveUrl(u)]); busy(false); } };
    if (o.small) el.onclick = () => inp.click();
  };
  el.ondragover = (e) => { e.preventDefault(); el.classList.add('over'); };
  el.ondragleave = () => el.classList.remove('over');
  el.ondrop = async (e) => { e.preventDefault(); el.classList.remove('over'); busy(true); take(await fromTransfer(e.dataTransfer)); busy(false); };
  el.onpaste = async (e) => { e.preventDefault(); e.stopPropagation(); busy(true); take(await fromTransfer(e.clipboardData)); busy(false); };
  el.addEventListener('click', () => el.focus());
  draw();
  return el;
}
function memeRow(list, onChange, label) {
  const row = h(`<div class="mrow2"><div class="mlabel">${label}</div><div class="mthumbs"></div></div>`);
  const th = row.querySelector('.mthumbs');
  const draw = () => {
    th.innerHTML = '';
    list.forEach((m, i) => { const t = h('<div class="mthumb"></div>'); t.appendChild(mediaEl(m, lib.base, {})); if (m.k === 'video') t.insertAdjacentHTML('beforeend', '<span class="vbadge">▶</span>'); const x = h('<button class="mx">✕</button>'); x.onclick = () => { list.splice(i, 1); onChange(); draw(); }; t.appendChild(x); t.onclick = (e) => { if (e.target !== x) showMeme([m], lib.base, label.includes('đúng')); }; th.appendChild(t); });
    th.appendChild(mediaSlot({ small: true, multiple: true, onSet: (m) => { list.push(m); onChange(); draw(); } }));
  };
  draw(); return row;
}

// ================= DANH SÁCH ĐỀ =================
function counts(qs) { const c = {}; qs.forEach((q) => (c[q.t] = (c[q.t] || 0) + 1)); return Object.entries(c).map(([t, n]) => `${n} ${TNAME[t].split(' ').slice(1).join(' ').toLowerCase()}`).join(' · '); }
function drawList() {
  const S = lib.sets;
  pane().innerHTML = '';
  const top = h(`<div class="card edhead"><div style="flex:1"><h3 style="margin:0">📝 Đề của thầy cô</h3><div class="muted" style="font-size:13.5px;margin-top:4px">Đề bật <b>Phát cho học sinh</b> sẽ hiện ở mục “Đề của thầy cô” trên máy học sinh (cùng mạng LAN, máy này đang bật nhận kết quả). Kết quả làm bài gửi về thẻ Kết quả như bài IC3.</div></div>
    <div class="edbtns"><button class="btn red" id="nw">＋ Tạo đề mới</button><button class="btn" id="imp">📄 Nhập từ PDF / Word</button><button class="btn ghost" id="mm">😂 Meme chung</button></div></div>`);
  pane().appendChild(top);
  const grid = h('<div class="setgrid"></div>');
  if (!S.length) grid.appendChild(h(`<div class="card empty"><div style="font-size:44px">📚</div><h3>Chưa có đề nào</h3><p class="muted">Bắt đầu bằng cách tạo đề mới, hoặc nhập nhanh từ tệp PDF/Word theo mẫu.</p><div style="display:flex;gap:8px;justify-content:center"><button class="btn sm ghost" data-sample="pdf">⬇ Tải mẫu PDF</button><button class="btn sm ghost" data-sample="docx">⬇ Tải mẫu Word</button></div></div>`));
  S.forEach((s) => {
    const bad = s.qs.filter((q) => problems(q).length).length;
    const c = h(`<div class="card setcard"><div class="sct"><b>${C.esc(s.title)}</b><button class="pubpill ${s.published ? 'on' : ''}" title="Phát cho học sinh">${s.published ? '● Đang phát' : '○ Chưa phát'}</button></div>
      <div class="muted">${s.qs.length} câu${s.qs.length ? ' · ' + counts(s.qs) : ''}</div>
      <div class="muted">${[s.practice && 'Luyện tập', s.exam && `Kiểm tra ${s.time ? s.time + ' phút' : ''}`].filter(Boolean).join(' · ')}${s.memes.ok.length + s.memes.no.length ? ` · 😂 ${s.memes.ok.length + s.memes.no.length} meme` : ''}</div>
      ${bad ? `<div class="warnline">⚠ ${bad} câu cần sửa</div>` : ''}
      <div class="scb"><button class="btn sm" data-e>✏️ Soạn</button><button class="btn sm ghost" data-p>👁 Xem thử</button><button class="btn sm ghost" data-d title="Nhân bản">⧉</button><button class="btn sm ghost" data-x title="Xoá" style="color:#d70015">🗑</button></div></div>`);
    c.querySelector('[data-e]').onclick = () => { view = 'edit'; editId = s.id; openQ = -1; drawEdit(); };
    c.querySelector('[data-p]').onclick = () => s.qs.length ? preview(s, 0) : C.toast('Đề chưa có câu nào');
    c.querySelector('[data-d]').onclick = async () => { const n = JSON.parse(JSON.stringify(s)); n.id = rid('s'); n.title = s.title + ' (bản sao)'; n.published = false; n.qs.forEach((q) => (q.id = rid('g'))); lib.sets.unshift(n); await C.T.putSet(n); drawList(); };
    c.querySelector('[data-x]').onclick = async () => { if (!(await C.sure('Xoá đề này?', `“${s.title}” (${s.qs.length} câu) sẽ bị xoá. Kết quả học sinh đã làm vẫn được giữ.`, 'Xoá', true))) return; await C.T.delSet(s.id); lib.sets = lib.sets.filter((x) => x.id !== s.id); drawList(); };
    c.querySelector('.pubpill').onclick = async () => { if (!s.published && s.qs.some((q) => problems(q).length)) return C.toast('Hãy sửa các câu còn lỗi trước khi phát'); if (!s.published && !s.qs.length) return C.toast('Đề chưa có câu nào'); s.published = !s.published; await C.T.putSet(s); drawList(); C.toast(s.published ? '📡 Đã phát cho học sinh' : 'Đã ngừng phát'); };
    grid.appendChild(c);
  });
  pane().appendChild(grid);
  if (S.length) pane().appendChild(h(`<p class="muted" style="font-size:13px">Mẫu soạn đề để nhập nhanh: <a href="#" data-sample="pdf">tải mẫu PDF</a> · <a href="#" data-sample="docx">tải mẫu Word</a></p>`));
  pane().querySelectorAll('[data-sample]').forEach((b) => (b.onclick = async (e) => { e.preventDefault(); const p = await C.T.sample(b.dataset.sample); if (p) C.toast('Đã lưu: ' + p, 4000); }));
  C.$('#nw').onclick = async () => { const s = newSet('Đề mới ' + new Date().toLocaleDateString('vi-VN'), [blankQ('one')]); lib.sets.unshift(s); await C.T.putSet(s); view = 'edit'; editId = s.id; openQ = 0; drawEdit(); };
  C.$('#imp').onclick = () => { view = 'import'; importState = null; drawImport(); };
  C.$('#mm').onclick = () => { view = 'memes'; drawMemes(); };
}

// ================= MEME CHUNG =================
function drawMemes() {
  pane().innerHTML = '';
  const save = () => C.T.setMemes(lib.memes);
  const card = h(`<div class="card edcard"><div class="edtop"><button class="btn sm ghost" id="bk">‹ Danh sách đề</button><h3 style="margin:0">😂 Meme chung</h3></div>
    <p class="muted" style="font-size:13.5px">Meme hiện lên mỗi khi học sinh trả lời đúng hoặc sai ở chế độ luyện tập – áp dụng cho <b>tất cả</b> bài IC3 có sẵn và các đề của thầy cô (đề nào có meme riêng thì dùng meme riêng). Nhận ảnh, GIF động và video ngắn (MP4/WEBM). Bấm vào ảnh nhỏ để xem thử.</p></div>`);
  card.appendChild(memeRow(lib.memes.ok, save, '🎉 Khi làm đúng'));
  card.appendChild(memeRow(lib.memes.no, save, '😅 Khi làm sai'));
  card.appendChild(h(`<p class="muted" style="font-size:12.5px;margin-top:14px">Lưu ý bản quyền: ảnh/GIF lấy từ Internet nên chỉ dùng trong lớp học; tránh nội dung không phù hợp với học sinh.</p>`));
  pane().appendChild(card);
  C.$('#bk').onclick = () => { view = 'list'; drawList(); };
}

// ================= SOẠN ĐỀ =================
function refreshBadges() {
  const s = cur(); if (!s) return;
  pane().querySelectorAll('.qitem').forEach((el) => { const q = s.qs[+el.dataset.i]; if (!q) return; const p = problems(q); const w = el.querySelector('.qwarn'); if (w) w.textContent = p.length ? '⚠ ' + p[0] : ''; const pr = el.querySelector('.qpv'); if (pr && +el.dataset.i !== openQ) pr.textContent = q.q || '(chưa có nội dung)'; });
}
function drawEdit() {
  const s = cur(); if (!s) { view = 'list'; return drawList(); }
  pane().innerHTML = '';
  const head = h(`<div class="card edcard">
    <div class="edtop"><button class="btn sm ghost" id="bk">‹ Danh sách đề</button><input class="field ttl" id="ttl" value="${C.esc(s.title)}" placeholder="Tên đề"><span class="savest ok" id="saveSt">✓ Đã lưu</span>
      <button class="btn ghost" id="pv">👁 Xem thử</button><button class="pubpill big ${s.published ? 'on' : ''}" id="pub">${s.published ? '● Đang phát cho học sinh' : '○ Phát cho học sinh'}</button></div>
    <div class="edopts"><label class="chk"><input type="checkbox" id="oP" ${s.practice ? 'checked' : ''}> Cho làm <b>Luyện tập</b> (chấm từng câu, có meme)</label>
      <label class="chk"><input type="checkbox" id="oE" ${s.exam ? 'checked' : ''}> Cho làm <b>Kiểm tra</b>, thời gian <input class="field mini" id="oT" type="number" min="0" max="180" value="${s.time || 0}"> phút (0 = không giới hạn)</label>
      <label class="chk"><input type="checkbox" id="oS" ${s.shuffle ? 'checked' : ''}> Trộn thứ tự câu</label></div>
    <details class="memebox" ${s.memes.ok.length + s.memes.no.length ? 'open' : ''}><summary>😂 Meme riêng của đề này <span class="muted">(${s.memes.ok.length + s.memes.no.length}) – để trống thì dùng Meme chung</span></summary></details></div>`);
  pane().appendChild(head);
  const mb = head.querySelector('.memebox');
  mb.appendChild(memeRow(s.memes.ok, () => touch(), '🎉 Khi làm đúng'));
  mb.appendChild(memeRow(s.memes.no, () => touch(), '😅 Khi làm sai'));
  C.$('#bk').onclick = () => { touch(true); view = 'list'; drawList(); };
  C.$('#ttl').oninput = (e) => { s.title = e.target.value; touch(); };
  C.$('#oP').onchange = (e) => { s.practice = e.target.checked; if (!s.practice && !s.exam) { s.exam = true; C.$('#oE').checked = true; } touch(); };
  C.$('#oE').onchange = (e) => { s.exam = e.target.checked; if (!s.practice && !s.exam) { s.practice = true; C.$('#oP').checked = true; } touch(); };
  C.$('#oT').oninput = (e) => { s.time = Math.max(0, Math.min(180, +e.target.value || 0)); touch(); };
  C.$('#oS').onchange = (e) => { s.shuffle = e.target.checked; touch(); };
  C.$('#pv').onclick = () => s.qs.length ? preview(s, Math.max(0, openQ)) : C.toast('Đề chưa có câu nào');
  C.$('#pub').onclick = () => {
    if (!s.published) { const bad = s.qs.findIndex((q) => problems(q).length); if (!s.qs.length) return C.toast('Đề chưa có câu nào'); if (bad >= 0) { openQ = bad; drawEdit(); return C.toast(`Câu ${bad + 1}: ${problems(s.qs[bad])[0]}`); } }
    s.published = !s.published; touch(true); const b = C.$('#pub'); b.classList.toggle('on', s.published); b.textContent = s.published ? '● Đang phát cho học sinh' : '○ Phát cho học sinh'; C.toast(s.published ? '📡 Học sinh đã thấy đề này' : 'Đã ngừng phát');
  };

  const list = h('<div class="qlist"></div>');
  s.qs.forEach((q, i) => list.appendChild(qItem(s, q, i)));
  pane().appendChild(list);
  const add = h(`<div class="card addq"><b>＋ Thêm câu:</b>${TYPES.map(([t, l]) => `<button class="btn sm ghost" data-t="${t}">${l}</button>`).join('')}</div>`);
  add.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { s.qs.push(blankQ(b.dataset.t)); openQ = s.qs.length - 1; touch(); drawEdit(); setTimeout(() => { const el = pane().querySelector(`.qitem[data-i="${openQ}"]`); el && el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const ta = el && el.querySelector('textarea'); ta && ta.focus(); }, 50); }));
  pane().appendChild(add);
}
function qItem(s, q, i) {
  const open = i === openQ, p = problems(q);
  const el = h(`<div class="card qitem ${open ? 'open' : ''}" data-i="${i}"><div class="qrow"><span class="qn">${i + 1}</span><span class="tbadge t-${q.t}">${TNAME[q.t]}</span><span class="qpv">${C.esc(q.q || '(chưa có nội dung)')}</span>${q.media || q.img ? '<span title="Có ảnh/video">🖼️</span>' : ''}${q.okm || q.nom ? '<span title="Có meme riêng">😂</span>' : ''}<span class="qwarn">${p.length ? '⚠ ' + C.esc(p[0]) : ''}</span>
    <span class="qact"><button data-a="up" title="Lên">▲</button><button data-a="dn" title="Xuống">▼</button><button data-a="cp" title="Nhân bản">⧉</button><button data-a="rm" title="Xoá">🗑</button></span></div></div>`);
  el.querySelector('.qrow').onclick = (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'up' && i > 0) { [s.qs[i - 1], s.qs[i]] = [s.qs[i], s.qs[i - 1]]; if (openQ === i) openQ--; touch(); return drawEdit(); }
    if (a === 'dn' && i < s.qs.length - 1) { [s.qs[i + 1], s.qs[i]] = [s.qs[i], s.qs[i + 1]]; if (openQ === i) openQ++; touch(); return drawEdit(); }
    if (a === 'cp') { const n = JSON.parse(JSON.stringify(q)); n.id = rid('g'); s.qs.splice(i + 1, 0, n); openQ = i + 1; touch(); return drawEdit(); }
    if (a === 'rm') { C.sure('Xoá câu này?', `Câu ${i + 1}: ${q.q || '(chưa có nội dung)'}`, 'Xoá', true).then((ok) => { if (!ok) return; s.qs.splice(i, 1); openQ = -1; touch(); drawEdit(); }); return; }
    if (a) return;
    openQ = open ? -1 : i; drawEdit();
    if (!open) setTimeout(() => { const x = pane().querySelector(`.qitem[data-i="${i}"]`); x && x.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 30);
  };
  if (open) el.appendChild(qEditor(s, q, i));
  return el;
}
function qEditor(s, q, i) {
  const ed = h(`<div class="qed"></div>`);
  const set = (k, v) => { q[k] = v; touch(); };
  const redraw = () => { const old = pane().querySelector(`.qitem[data-i="${i}"]`); const nu = qItem(s, q, i); old.replaceWith(nu); };
  // dạng câu
  const tsel = h(`<div class="trow"><span class="lbl">Dạng câu</span><div class="tseg">${TYPES.map(([t, l]) => `<button data-t="${t}" class="${q.t === t ? 'on' : ''}">${l}</button>`).join('')}</div></div>`);
  tsel.querySelectorAll('button').forEach((b) => (b.onclick = () => { if (b.dataset.t === q.t) return; s.qs[i] = convertQ(q, b.dataset.t); touch(); drawEdit(); }));
  ed.appendChild(tsel);
  const ta = h(`<div><span class="lbl">Câu hỏi</span><textarea class="field" rows="2" placeholder="Nhập nội dung câu hỏi…">${C.esc(q.q)}</textarea></div>`);
  ta.querySelector('textarea').oninput = (e) => set('q', e.target.value);
  ed.appendChild(ta);
  if (q.t !== 'hot') {
    const mw = h(`<div><span class="lbl">Ảnh / GIF / video minh hoạ <span class="muted">(không bắt buộc)</span></span></div>`);
    mw.appendChild(mediaSlot({ value: q.media, onSet: (m) => { q.media = m; touch(); redraw(); }, onClear: () => { delete q.media; touch(); redraw(); } }));
    ed.appendChild(mw);
  }
  ed.appendChild(answerEditor(q, () => touch(), redraw));
  const ex = h(`<div><span class="lbl">Giải thích <span class="muted">(hiện sau khi học sinh trả lời)</span></span><textarea class="field" rows="2" placeholder="Vì sao đáp án này đúng?">${C.esc(q.e || '')}</textarea></div>`);
  ex.querySelector('textarea').oninput = (e) => set('e', e.target.value);
  ed.appendChild(ex);
  const mm = h(`<details class="memebox" ${q.okm || q.nom ? 'open' : ''}><summary>😂 Meme riêng cho câu này <span class="muted">(không bắt buộc)</span></summary><div class="mm2"></div></details>`);
  const mm2 = mm.querySelector('.mm2');
  [['okm', '🎉 Khi làm đúng'], ['nom', '😅 Khi làm sai']].forEach(([k, l]) => { const w = h(`<div><span class="lbl">${l}</span></div>`); w.appendChild(mediaSlot({ value: q[k], label: l, onSet: (m) => { q[k] = m; touch(); redraw(); }, onClear: () => { delete q[k]; touch(); redraw(); } })); mm2.appendChild(w); });
  ed.appendChild(mm);
  const p = problems(q);
  ed.appendChild(h(`<div class="qfootx">${p.length ? `<span class="warnline">⚠ ${p.map(C.esc).join(' · ')}</span>` : '<span class="okline">✓ Câu hợp lệ</span>'}<span style="flex:1"></span><button class="btn sm ghost" data-pv>👁 Xem thử câu này</button><button class="btn sm" data-done>Xong</button></div>`));
  ed.querySelector('[data-pv]').onclick = () => preview(s, i);
  ed.querySelector('[data-done]').onclick = () => { openQ = -1; drawEdit(); };
  return ed;
}
function answerEditor(q, changed, redraw) {
  const box = h('<div class="ansed"></div>');
  const rows = (title, arr, render, addLabel, onAdd, max = 8) => {
    box.appendChild(h(`<span class="lbl">${title}</span>`));
    arr.forEach((_, k) => box.appendChild(render(k)));
    if (arr.length < max) { const b = h(`<button class="btn sm ghost addrow">＋ ${addLabel}</button>`); b.onclick = () => { onAdd(); changed(); redraw(); }; box.appendChild(b); }
  };
  const del = (fn) => { const b = h('<button class="rx" title="Xoá dòng">✕</button>'); b.onclick = () => { fn(); changed(); redraw(); }; return b; };
  if (q.t === 'one' || q.t === 'multi') {
    rows(q.t === 'one' ? 'Phương án – bấm vòng tròn để chọn đáp án đúng' : 'Phương án – tích các đáp án đúng (học sinh phải chọn đủ)', q.o, (k) => {
      const on = q.t === 'one' ? q.a === k : q.a.includes(k);
      const r = h(`<div class="arow"><button class="pick ${q.t} ${on ? 'on' : ''}">${on ? '✓' : ''}</button><span class="let">${String.fromCharCode(65 + k)}</span><input class="field" value="${C.esc(q.o[k])}" placeholder="Phương án ${String.fromCharCode(65 + k)}"></div>`);
      r.querySelector('.pick').onclick = () => { if (q.t === 'one') q.a = k; else { const s = new Set(q.a); s.has(k) ? s.delete(k) : s.add(k); q.a = [...s].sort(); q.n = q.a.length; } changed(); redraw(); };
      r.querySelector('input').oninput = (e) => { q.o[k] = e.target.value; changed(); };
      if (q.o.length > 2) r.appendChild(del(() => { q.o.splice(k, 1); if (q.t === 'one') q.a = q.a === k ? 0 : q.a > k ? q.a - 1 : q.a; else { q.a = q.a.filter((x) => x !== k).map((x) => (x > k ? x - 1 : x)); q.n = q.a.length; } }));
      return r;
    }, 'Thêm phương án', () => q.o.push(''));
  }
  if (q.t === 'yesno') rows('Các ý – chọn Đúng hoặc Sai cho từng ý', q.s, (k) => {
    const r = h(`<div class="arow"><span class="let">${String.fromCharCode(97 + k)})</span><input class="field" value="${C.esc(q.s[k])}" placeholder="Nội dung ý ${String.fromCharCode(97 + k)}"><div class="tf"><button class="${q.a[k] ? 'on y' : ''}">Đúng</button><button class="${!q.a[k] ? 'on n' : ''}">Sai</button></div></div>`);
    r.querySelector('input').oninput = (e) => { q.s[k] = e.target.value; changed(); };
    const [by, bn] = r.querySelectorAll('.tf button'); by.onclick = () => { q.a[k] = true; changed(); redraw(); }; bn.onclick = () => { q.a[k] = false; changed(); redraw(); };
    if (q.s.length > 1) r.appendChild(del(() => { q.s.splice(k, 1); q.a.splice(k, 1); }));
    return r;
  }, 'Thêm ý', () => { q.s.push(''); q.a.push(true); });
  if (q.t === 'match') rows('Các cặp ghép đúng – học sinh sẽ thấy vế phải bị xáo trộn để kéo thả', q.L, (k) => {
    const r = h(`<div class="arow"><input class="field" value="${C.esc(q.L[k])}" placeholder="Vế trái ${k + 1}"><span class="arr">⇄</span><input class="field" value="${C.esc(q.R[q.a[k]] ?? '')}" placeholder="Vế phải ${k + 1}"></div>`);
    const [l, rr] = r.querySelectorAll('input'); l.oninput = (e) => { q.L[k] = e.target.value; changed(); }; rr.oninput = (e) => { q.R[q.a[k]] = e.target.value; changed(); };
    if (q.L.length > 2) r.appendChild(del(() => { const ri = q.a[k]; q.L.splice(k, 1); q.R.splice(ri, 1); q.a.splice(k, 1); q.a = q.a.map((x) => (x > ri ? x - 1 : x)); }));
    return r;
  }, 'Thêm cặp', () => { q.L.push(''); q.R.push(''); q.a.push(q.R.length - 1); });
  if (q.t === 'order') rows('Các bước – nhập theo ĐÚNG thứ tự, học sinh sẽ thấy bị xáo trộn', q.items, (k) => {
    const r = h(`<div class="arow"><span class="let">${k + 1}</span><input class="field" value="${C.esc(q.items[k])}" placeholder="Bước ${k + 1}"><span class="mvb"><button ${k ? '' : 'disabled'}>▲</button><button ${k < q.items.length - 1 ? '' : 'disabled'}>▼</button></span></div>`);
    r.querySelector('input').oninput = (e) => { q.items[k] = e.target.value; changed(); };
    const [u, d] = r.querySelectorAll('.mvb button'); u.onclick = () => { [q.items[k - 1], q.items[k]] = [q.items[k], q.items[k - 1]]; changed(); redraw(); }; d.onclick = () => { [q.items[k + 1], q.items[k]] = [q.items[k], q.items[k + 1]]; changed(); redraw(); };
    if (q.items.length > 2) r.appendChild(del(() => q.items.splice(k, 1)));
    return r;
  }, 'Thêm bước', () => q.items.push(''), 10);
  if (q.t === 'hot') {
    box.appendChild(h(`<span class="lbl">Ảnh và vùng đúng – ${q.img ? '<b>kéo chuột trên ảnh</b> để khoanh vùng học sinh cần bấm' : 'thêm ảnh chụp màn hình (dán Ctrl+V, kéo thả hoặc chọn tệp)'}</span>`));
    if (!q.img) box.appendChild(mediaSlot({ imgOnly: true, label: 'Thêm ảnh chụp màn hình', onSet: (m) => { q.img = m; q.box = null; changed(); redraw(); } }));
    else {
      const wrap = h('<div class="hoted"></div>'); const im = mediaEl(q.img, lib.base, {}); wrap.appendChild(im);
      const bx = h('<div class="hbox"></div>'); wrap.appendChild(bx);
      const show = () => { if (!q.box) { bx.hidden = true; return; } bx.hidden = false; Object.assign(bx.style, { left: q.box.x + '%', top: q.box.y + '%', width: q.box.w + '%', height: q.box.h + '%' }); };
      let st = null;
      const pt = (e) => { const r = wrap.getBoundingClientRect(); return { x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)), y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)) }; };
      wrap.onpointerdown = (e) => { e.preventDefault(); st = pt(e); wrap.setPointerCapture(e.pointerId); q.box = { x: st.x, y: st.y, w: 0, h: 0 }; show(); };
      wrap.onpointermove = (e) => { if (!st) return; const p = pt(e); q.box = { x: Math.min(st.x, p.x), y: Math.min(st.y, p.y), w: Math.abs(p.x - st.x), h: Math.abs(p.y - st.y) }; show(); };
      wrap.onpointerup = () => { if (!st) return; st = null; if (q.box.w < 1 || q.box.h < 1) { q.box = null; C.toast('Hãy kéo chuột để vẽ một khung'); } else { for (const k in q.box) q.box[k] = Math.round(q.box[k] * 10) / 10; } changed(); redraw(); };
      show(); box.appendChild(wrap);
      const b = h('<button class="btn sm ghost addrow">🔄 Đổi ảnh khác</button>'); b.onclick = () => { q.img = null; q.box = null; changed(); redraw(); }; box.appendChild(b);
    }
  }
  return box;
}

// ================= XEM THỬ (như học sinh) =================
function preview(s, start) {
  let i = start, st = {};
  const d = h(`<div class="ic3-modal pvw"><div class="card"><div class="pvtop"><b>👁 Xem thử: ${C.esc(s.title)}</b><span class="muted" id="pvn"></span><span style="flex:1"></span><button class="btn sm ghost" data-x>Đóng</button></div><div class="qbox"><div class="qhead"><span class="num" id="pvi"></span><div class="qt" id="pvq"></div></div><div class="qbody" id="pvb"></div>
    <div class="qfoot"><button class="btn ghost" data-p>‹ Câu trước</button><span class="sp"></span><button class="btn" data-c>Kiểm tra</button><button class="btn ghost" data-n>Câu sau ›</button></div></div></div></div>`);
  document.body.appendChild(d);
  const draw = () => {
    const q = { ...s.qs[i], _base: lib.base }; st = {};
    d.querySelector('#pvi').textContent = `${i + 1}/${s.qs.length}`; d.querySelector('#pvq').innerHTML = qText(q);
    const b = d.querySelector('#pvb'); b.innerHTML = '';
    const p = problems(q); if (p.length) { b.innerHTML = `<div class="feedback no">⚠ Câu này chưa hoàn chỉnh: ${p.map(C.esc).join(' · ')}</div>`; return; }
    b.appendChild(renderQ(q, st, () => (st.touched = true)));
  };
  d.querySelector('[data-p]').onclick = () => { if (i > 0) { i--; draw(); } };
  d.querySelector('[data-n]').onclick = () => { if (i < s.qs.length - 1) { i++; draw(); } };
  d.querySelector('[data-x]').onclick = () => d.remove();
  d.querySelector('[data-c]').onclick = () => {
    const q = s.qs[i]; if (st.locked || problems(q).length) return;
    if (!isAnswered(q, st) || (q.t === 'hot' && !st.ans)) return C.toast('Hãy trả lời trước đã');
    const ok = isCorrect(q, st); st.locked = true; st.reveal && st.reveal();
    d.querySelector('#pvb').insertAdjacentHTML('beforeend', `<div class="feedback ${ok ? 'ok' : 'no'}"><b>${ok ? '✅ Chính xác!' : '❌ Chưa đúng.'}</b> ${C.esc(q.e || '')}</div>`);
    const own = ok ? q.okm : q.nom; const list = own ? [own] : (ok ? s.memes.ok : s.memes.no).length ? (ok ? s.memes.ok : s.memes.no) : ok ? lib.memes.ok : lib.memes.no;
    showMeme(list, lib.base, ok);
  };
  draw();
}

// ================= NHẬP TỪ PDF / WORD =================
function drawImport() {
  pane().innerHTML = '';
  if (importState && importState.res) return drawReview();
  const c = h(`<div class="card edcard"><div class="edtop"><button class="btn sm ghost" id="bk">‹ Danh sách đề</button><h3 style="margin:0">📄 Nhập đề từ PDF / Word</h3></div>
    <div class="impdrop" id="drop" tabindex="0"><div style="font-size:46px">📄</div><b>Kéo thả tệp PDF hoặc Word (.docx) vào đây</b><div class="muted">hoặc</div><button class="btn red" id="pick">Chọn tệp…</button><input type="file" id="fi" hidden accept=".pdf,.docx,.txt"><div class="muted" id="prog"></div></div>
    <details class="howto"><summary>Cách viết đề để ứng dụng tự nhận dạng tốt nhất</summary><div class="howgrid">
      <div><b>Mỗi câu</b> bắt đầu bằng <code>Câu 1:</code>, <code>Câu 2.</code>…</div>
      <div><b>Một / nhiều đáp án</b>: phương án <code>A.</code> <code>B.</code> <code>C.</code>… (có thể nhiều phương án trên một dòng). Đáp án ghi <code>Đáp án: B</code> hoặc <code>Đáp án: A, C</code>, hoặc <b>in đậm</b> phương án đúng.</div>
      <div><b>Đúng/Sai</b>: các ý <code>a)</code> <code>b)</code> <code>c)</code>, đáp án <code>Đáp án: a-Đ, b-S, c-Đ</code> hoặc cuối ý ghi <code>(Đ)</code> / <code>(S)</code>.</div>
      <div><b>Ghép nối</b>: mỗi dòng <code>Vế trái = Vế phải</code>; hoặc cột <code>1. 2. 3.</code> và cột <code>a. b. c.</code> kèm <code>Đáp án: 1-b, 2-c, 3-a</code>.</div>
      <div><b>Sắp xếp</b>: ghi “Sắp xếp…” trong câu hỏi, liệt kê các bước theo đúng thứ tự (hoặc ghi <code>Đáp án: 3, 1, 2</code>).</div>
      <div><b>Bảng đáp án cuối đề</b> kiểu <code>ĐÁP ÁN: 1.B 2.C 3.A</code> cũng được. Có thể ghi rõ dạng câu bằng nhãn <code>[Nhiều đáp án]</code> <code>[Đúng/Sai]</code> <code>[Ghép nối]</code> <code>[Sắp xếp]</code>. Dòng <code>Giải thích:</code> là tuỳ chọn.</div>
    </div><p class="muted" style="font-size:13px">PDF dạng ảnh chụp/scan không đọc được chữ. Word tự đánh số (danh sách tự động) có thể mất số “Câu 1” – khi đó hãy Lưu thành PDF rồi nhập. Câu “bấm vào hình” và ảnh minh hoạ thêm sau trong trình soạn đề.</p>
    <div style="display:flex;gap:8px"><button class="btn sm ghost" data-sample="pdf">⬇ Tải mẫu PDF</button><button class="btn sm ghost" data-sample="docx">⬇ Tải mẫu Word</button></div></details>
    <details class="howto"><summary>Hoặc dán văn bản đề trực tiếp</summary><textarea class="field" id="txt" rows="8" placeholder="Câu 1: …&#10;A. …&#10;B. …&#10;Đáp án: B"></textarea><button class="btn sm" id="ptxt" style="margin-top:8px">Nhận dạng văn bản</button></details></div>`);
  pane().appendChild(c);
  C.$('#bk').onclick = () => { view = 'list'; drawList(); };
  c.querySelectorAll('[data-sample]').forEach((b) => (b.onclick = async () => { const p = await C.T.sample(b.dataset.sample); if (p) C.toast('Đã lưu: ' + p, 4000); }));
  const drop = C.$('#drop'), fi = C.$('#fi');
  C.$('#pick').onclick = () => fi.click();
  fi.onchange = () => fi.files[0] && readFile(fi.files[0]);
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); }; drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) readFile(f); };
  C.$('#ptxt').onclick = () => { const t = C.$('#txt').value; if (!t.trim()) return C.toast('Hãy dán nội dung đề'); finishImport(extractText(t), 'Đề dán từ văn bản'); };
}
async function readFile(f) {
  const prog = C.$('#prog'), name = f.name.replace(/\.(pdf|docx|txt)$/i, '');
  try {
    prog.textContent = 'Đang đọc tệp…';
    let ex;
    if (/\.pdf$/i.test(f.name)) ex = await extractPdf(await f.arrayBuffer(), (p, n) => (prog.textContent = `Đang đọc trang ${p}/${n}…`));
    else if (/\.docx$/i.test(f.name)) { const r = await C.T.readDocx(new Uint8Array(await f.arrayBuffer())); if (!r.ok) throw new Error(r.msg); ex = extractDocx(r.paras); }
    else if (/\.txt$/i.test(f.name)) ex = extractText(await f.text());
    else throw new Error('Chỉ nhận tệp .pdf, .docx hoặc .txt (tệp .doc cũ hãy mở bằng Word rồi Lưu thành .docx/PDF)');
    if (ex.scanned) { prog.innerHTML = '<span style="color:#d70015">PDF này là ảnh chụp/scan nên không đọc được chữ. Hãy dùng tệp Word gốc hoặc PDF xuất từ Word.</span>'; return; }
    finishImport(ex, name);
  } catch (e) { prog.innerHTML = `<span style="color:#d70015">Không đọc được tệp: ${C.esc(e.message || e)}</span>`; }
}
function finishImport(ex, name) {
  const res = parseQuestions(ex);
  if (!res.length) { C.toast('Không tìm thấy câu hỏi nào. Mỗi câu cần bắt đầu bằng “Câu 1:”, “Câu 2:”…', 5000); return; }
  importState = { name, res: res.map((r) => ({ ...r, use: !r.skip })) };
  drawReview();
}
function ansSummary(q) {
  if (q.t === 'one') return String.fromCharCode(65 + q.a);
  if (q.t === 'multi') return q.a.map((x) => String.fromCharCode(65 + x)).join(', ');
  if (q.t === 'yesno') return q.a.map((v, k) => `${String.fromCharCode(97 + k)}-${v ? 'Đ' : 'S'}`).join(' ');
  if (q.t === 'match') return q.L.map((l, k) => `${l} → ${q.R[q.a[k]]}`).join('; ');
  if (q.t === 'order') return q.items.join(' → ');
  return '';
}
function drawReview() {
  pane().innerHTML = '';
  const R = importState.res, ok = R.filter((r) => !r.skip), warnN = ok.filter((r) => r.warn.length).length;
  const byT = {}; ok.forEach((r) => (byT[r.q.t] = (byT[r.q.t] || 0) + 1));
  const c = h(`<div class="card edcard"><div class="edtop"><button class="btn sm ghost" id="bk">‹ Chọn tệp khác</button><h3 style="margin:0">Kết quả nhận dạng</h3></div>
    <div class="sumrow">${[['Nhận được', ok.length + ' câu'], ...Object.entries(byT).map(([t, n]) => [TNAME[t], n]), ['Cần kiểm tra', warnN], ['Bỏ qua', R.length - ok.length]].map(([a, b]) => `<div class="card sum"><b>${b}</b><span>${a}</span></div>`).join('')}</div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="lbl" style="margin:0">Tên đề</span><input class="field" id="nm" value="${C.esc(importState.name)}" style="max-width:380px"><span style="flex:1"></span><button class="btn red" id="mk">Tạo đề ›</button></div></div>`);
  pane().appendChild(c);
  const tb = h(`<div class="card" style="padding:6px 14px;margin-top:14px"><table class="tbl rvw"><tr><th></th><th>Câu</th><th>Dạng</th><th>Nội dung</th><th>Đáp án nhận được</th></tr></table></div>`);
  const t = tb.querySelector('table');
  R.forEach((r, k) => {
    const tr = h(r.skip ? `<tr class="skip"><td></td><td>${r.num}</td><td>—</td><td>${C.esc(r.q || '')}</td><td class="muted">⏭ ${C.esc(r.why)}</td></tr>`
      : `<tr class="${r.warn.length ? 'warn' : ''}"><td><input type="checkbox" ${r.use ? 'checked' : ''}></td><td>${r.num}</td><td><span class="tbadge t-${r.q.t}">${TNAME[r.q.t]}</span></td><td>${C.esc(r.q.q)}${r.q.o ? `<div class="muted" style="font-size:12.5px">${r.q.o.map((o, i) => String.fromCharCode(65 + i) + '. ' + C.esc(o)).join(' · ')}</div>` : r.q.s ? `<div class="muted" style="font-size:12.5px">${r.q.s.map((o, i) => String.fromCharCode(97 + i) + ') ' + C.esc(o)).join(' · ')}</div>` : ''}${r.warn.length ? `<div class="warnline">⚠ ${r.warn.map(C.esc).join(' · ')}</div>` : ''}</td><td>${C.esc(ansSummary(r.q))}</td></tr>`);
    const cb = tr.querySelector('input'); if (cb) cb.onchange = () => { r.use = cb.checked; C.$('#mk').textContent = `Tạo đề (${R.filter((x) => x.use).length} câu) ›`; };
    t.appendChild(tr);
  });
  pane().appendChild(tb);
  C.$('#mk').textContent = `Tạo đề (${R.filter((x) => x.use).length} câu) ›`;
  C.$('#bk').onclick = () => { importState = null; drawImport(); };
  C.$('#mk').onclick = async () => {
    const qs = R.filter((r) => r.use).map((r) => ({ id: rid('g'), ...r.q }));
    if (!qs.length) return C.toast('Hãy chọn ít nhất một câu');
    const s = newSet(C.$('#nm').value.trim() || importState.name, qs);
    lib.sets.unshift(s); await C.T.putSet(s); importState = null;
    view = 'edit'; editId = s.id; openQ = qs.findIndex((q) => problems(q).length); drawEdit();
    C.toast(`✅ Đã tạo đề ${qs.length} câu. Thầy/cô xem lại, thêm ảnh/meme rồi bật “Phát cho học sinh”.`, 5000);
  };
}
