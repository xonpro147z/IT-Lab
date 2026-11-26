// Hiển thị & chấm câu hỏi – dùng chung cho học sinh (ic3.js) và giáo viên xem trước (editor.js)
import { SCENES } from './scenes.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let toast = (m) => console.log(m);
export function setToast(fn) { toast = fn; }

// Ảnh / GIF / video (m = {f, k}; base = thư mục chứa tệp)
export function mediaEl(m, base, { controls = false, cls = '', autoplay = false, loop = false } = {}) {
  const src = (base || '') + m.f;
  let el;
  if (m.k === 'video') { el = document.createElement('video'); el.src = src; el.controls = controls; el.playsInline = true; el.preload = 'auto'; if (autoplay) el.autoplay = true; if (loop) el.loop = true; }
  else { el = document.createElement('img'); el.src = src; el.alt = ''; el.draggable = false; }
  if (cls) el.className = cls;
  return el;
}

// Meme hiện lên khi làm đúng / sai. list = [{f,k}], base = thư mục
let memeEl = null;
export function showMeme(list, base, ok, ms = 3500, tag) {
  if (!list || !list.length) return false;
  if (memeEl) memeEl.remove();
  const m = list[Math.floor(Math.random() * list.length)];
  const d = document.createElement('div'); d.className = 'meme ' + (ok ? 'ok' : 'no');
  const card = document.createElement('div'); card.className = 'mcard';
  const el = mediaEl(m, base, { autoplay: true });
  card.appendChild(el); card.insertAdjacentHTML('beforeend', `<div class="mtag">${tag || (ok ? '🎉 Chính xác!' : '😅 Sai rồi!')}</div>`);
  d.appendChild(card); document.body.appendChild(d); memeEl = d;
  let tm;
  const close = () => { clearTimeout(tm); d.classList.add('out'); setTimeout(() => d.remove(), 220); if (memeEl === d) memeEl = null; };
  d.onclick = close;
  if (m.k === 'video') { el.onended = close; tm = setTimeout(close, 15000); el.play().catch(() => { el.muted = true; el.play().catch(() => {}); }); }
  else tm = setTimeout(close, ms);
  return true;
}

export const TYPE_LABEL = { one: 'Chọn 1 đáp án', multi: 'Chọn nhiều đáp án', yesno: 'Chọn Đúng hoặc Sai cho từng ý', match: 'Kéo thả để ghép nối', order: 'Kéo thả để sắp xếp thứ tự', hot: 'Bấm vào vị trí đúng trên hình' };
export function qText(q) { return esc(q.q).replace(/\n/g, '<br>').replace(/\((Chọn \d)\)/, '<em>($1)</em>'); }
export function renderQ(q, st, onChange) {
  // st: trạng thái lưu cho câu (perm, ans)
  const box = document.createElement('div');
  box.innerHTML = `<div class="qtype">${TYPE_LABEL[q.t]}</div>`;
  if (q.media && q.media.f) box.appendChild(mediaEl(q.media, q._base, { controls: true, cls: 'qmedia' }));
  const ch = () => onChange && onChange();
  if (q.t === 'one' || q.t === 'multi') {
    st.perm = st.perm || shuffle(q.o.map((_, i) => i));
    if (st.ans === undefined) st.ans = q.t === 'one' ? null : [];
    const wrap = document.createElement('div'); wrap.className = 'opts';
    st.perm.forEach((oi, k) => {
      const b = document.createElement('button'); b.className = 'opt' + (q.t === 'one' ? ' radio' : ''); b.dataset.oi = oi;
      b.innerHTML = `<span class="mk"></span><span>${esc(q.o[oi])}</span>`;
      b.onclick = () => { if (st.locked) return; if (q.t === 'one') st.ans = oi; else { const s = new Set(st.ans); s.has(oi) ? s.delete(oi) : s.size < q.n ? s.add(oi) : toast(`Chỉ chọn ${q.n} đáp án`); st.ans = [...s]; } paint(); ch(); };
      wrap.appendChild(b);
    });
    const paint = () => wrap.querySelectorAll('.opt').forEach((b) => { const oi = +b.dataset.oi; const on = q.t === 'one' ? st.ans === oi : st.ans.includes(oi); b.classList.toggle('sel', on); b.querySelector('.mk').textContent = on ? '✓' : ''; });
    st.reveal = () => wrap.querySelectorAll('.opt').forEach((b) => { const oi = +b.dataset.oi; const correct = q.t === 'one' ? q.a === oi : q.a.includes(oi); const chosen = q.t === 'one' ? st.ans === oi : st.ans.includes(oi); b.classList.toggle('right', correct); b.classList.toggle('wrong', chosen && !correct); b.classList.remove('sel'); });
    paint(); box.appendChild(wrap);
  }
  if (q.t === 'yesno') {
    if (!st.ans) st.ans = q.s.map(() => null);
    const tb = document.createElement('table'); tb.className = 'yn';
    tb.innerHTML = `<tr><th></th><th class="c">Đúng</th><th class="c">Sai</th></tr>` + q.s.map((s, i) => `<tr><td>${esc(s)}</td><td class="c"><button class="ynb" data-i="${i}" data-v="1">Đ</button></td><td class="c"><button class="ynb" data-i="${i}" data-v="0">S</button></td></tr>`).join('');
    const paint = () => tb.querySelectorAll('.ynb').forEach((b) => b.classList.toggle('sel', st.ans[+b.dataset.i] === (b.dataset.v === '1')));
    tb.querySelectorAll('.ynb').forEach((b) => (b.onclick = () => { if (st.locked) return; st.ans[+b.dataset.i] = b.dataset.v === '1'; paint(); ch(); }));
    st.reveal = () => tb.querySelectorAll('.ynb').forEach((b) => { const i = +b.dataset.i, v = b.dataset.v === '1'; b.classList.remove('sel'); if (q.a[i] === v) b.classList.add('right'); else if (st.ans[i] === v) b.classList.add('wrong'); });
    paint(); box.appendChild(tb);
  }
  if (q.t === 'match') {
    if (!st.ans) st.ans = q.L.map(() => null);
    st.rperm = st.rperm || shuffle(q.R.map((_, i) => i));
    const wrap = document.createElement('div'); wrap.className = 'match';
    const left = document.createElement('div'), bank = document.createElement('div'); bank.className = 'bank';
    let picked = null;
    const chipEl = (ri) => { const c = document.createElement('div'); c.className = 'chip'; c.draggable = true; c.dataset.ri = ri; c.textContent = q.R[ri]; c.ondragstart = (e) => { e.dataTransfer.setData('text', ri); }; c.onclick = (e) => { e.stopPropagation(); if (st.locked) return; picked = picked === ri ? null : ri; draw(); }; return c; };
    const place = (li, ri) => { if (st.locked) return; st.ans = st.ans.map((x) => (x === ri ? null : x)); if (li !== null) st.ans[li] = ri; picked = null; draw(); ch(); };
    const draw = () => {
      left.innerHTML = ''; bank.innerHTML = '<div class="ttl">KÉO CÁC THẺ NÀY VÀO Ô BÊN TRÁI</div>';
      q.L.forEach((l, li) => {
        const row = document.createElement('div'); row.className = 'mrow';
        row.innerHTML = `<div class="ml">${esc(l)}</div>`;
        const slot = document.createElement('div'); slot.className = 'slot'; slot.dataset.li = li;
        if (st.ans[li] !== null) slot.appendChild(chipEl(st.ans[li]));
        slot.ondragover = (e) => { e.preventDefault(); slot.classList.add('over'); }; slot.ondragleave = () => slot.classList.remove('over');
        slot.ondrop = (e) => { e.preventDefault(); slot.classList.remove('over'); place(li, +e.dataTransfer.getData('text')); };
        slot.onclick = () => { if (picked !== null) place(li, picked); };
        if (st.revealed) slot.classList.add(st.ans[li] === q.a[li] ? 'right' : 'wrong');
        row.appendChild(slot);
        if (st.revealed && st.ans[li] !== q.a[li]) row.insertAdjacentHTML('beforeend', `<small style="color:#1f8a3b">✓ ${esc(q.R[q.a[li]])}</small>`);
        left.appendChild(row);
      });
      st.rperm.filter((ri) => !st.ans.includes(ri)).forEach((ri) => { const c = chipEl(ri); if (picked === ri) c.classList.add('pick'); bank.appendChild(c); });
      bank.ondragover = (e) => e.preventDefault(); bank.ondrop = (e) => { e.preventDefault(); place(null, +e.dataTransfer.getData('text')); };
    };
    st.reveal = () => { st.revealed = true; draw(); };
    draw(); wrap.append(left, bank); box.appendChild(wrap);
  }
  if (q.t === 'order') {
    if (!st.ans) { let p; do { p = shuffle(q.items.map((_, i) => i)); } while (p.every((x, i) => x === i)); st.ans = p; }
    const list = document.createElement('div'); list.className = 'order';
    let dragI = null;
    const draw = () => {
      list.innerHTML = '';
      st.ans.forEach((ii, pos) => {
        const it = document.createElement('div'); it.className = 'oitem'; it.draggable = !st.locked;
        it.innerHTML = `<span class="n">${pos + 1}</span><span>${esc(q.items[ii])}</span><span class="mv"><button data-d="-1">▲</button><button data-d="1">▼</button></span>`;
        if (st.revealed) it.classList.add(ii === pos ? 'right' : 'wrong');
        it.ondragstart = () => { dragI = pos; it.classList.add('drag'); }; it.ondragend = () => it.classList.remove('drag');
        it.ondragover = (e) => e.preventDefault();
        it.ondrop = (e) => { e.preventDefault(); if (dragI === null || st.locked) return; const a = st.ans.slice(); const [x] = a.splice(dragI, 1); a.splice(pos, 0, x); st.ans = a; dragI = null; draw(); ch(); };
        it.querySelectorAll('button').forEach((b) => (b.onclick = () => { if (st.locked) return; const t = pos + +b.dataset.d; if (t < 0 || t >= st.ans.length) return; const a = st.ans.slice(); [a[pos], a[t]] = [a[t], a[pos]]; st.ans = a; draw(); ch(); }));
        list.appendChild(it);
      });
      if (st.revealed && !st.ans.every((x, i) => x === i)) list.insertAdjacentHTML('beforeend', `<div class="muted" style="font-size:14px;margin-top:6px">Thứ tự đúng: ${q.items.map((s, i) => `${i + 1}. ${esc(s)}`).join(' → ')}</div>`);
    };
    st.reveal = () => { st.revealed = true; st.locked = true; draw(); };
    draw(); box.appendChild(list);
  }
  if (q.t === 'hot' && q.img) { // vùng bấm trên ảnh do giáo viên tự chọn (toạ độ %)
    const h = document.createElement('div'); h.className = 'hot himg';
    h.appendChild(mediaEl(q.img, q._base, { cls: 'hotimg' }));
    const B = q.box || { x: 0, y: 0, w: 0, h: 0 };
    const pin = () => { h.querySelectorAll('.pin').forEach((p) => p.remove()); if (st.ans) { const p = document.createElement('div'); p.className = 'pin'; p.style.left = st.ans.x + '%'; p.style.top = st.ans.y + '%'; h.appendChild(p); } };
    h.onclick = (e) => {
      if (st.locked) return;
      const r = h.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 100;
      st.ans = { id: x >= B.x && x <= B.x + B.w && y >= B.y && y <= B.y + B.h ? 'box' : null, x, y }; pin(); ch();
    };
    st.reveal = () => { const z = document.createElement('div'); z.className = 'zone'; Object.assign(z.style, { left: B.x + '%', top: B.y + '%', width: B.w + '%', height: B.h + '%' }); h.appendChild(z); };
    pin(); box.appendChild(h);
  } else if (q.t === 'hot') {
    const sc = SCENES[q.scene];
    const h = document.createElement('div'); h.className = 'hot'; h.innerHTML = sc.svg;
    const pin = () => { h.querySelectorAll('.pin').forEach((p) => p.remove()); if (st.ans) { const p = document.createElement('div'); p.className = 'pin'; p.style.left = (st.ans.x / 800) * 100 + '%'; p.style.top = (st.ans.y / 460) * 100 + '%'; h.appendChild(p); } };
    h.onclick = (e) => {
      if (st.locked) return;
      const r = h.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * 800, y = ((e.clientY - r.top) / r.height) * 460;
      const hit = sc.regions.find((g) => x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h);
      st.ans = { id: hit ? hit.id : null, x, y }; pin(); ch();
    };
    st.reveal = () => { const g = sc.regions.find((r) => r.id === q.a); const z = document.createElement('div'); z.className = 'zone'; Object.assign(z.style, { left: (g.x / 800) * 100 + '%', top: (g.y / 460) * 100 + '%', width: (g.w / 800) * 100 + '%', height: (g.h / 460) * 100 + '%' }); h.appendChild(z); };
    pin(); box.appendChild(h);
  }
  return box;
}
export function isAnswered(q, st) {
  if (st.ans === undefined || st.ans === null) return false;
  if (q.t === 'multi') return st.ans.length === q.n;
  if (q.t === 'yesno' || q.t === 'match') return st.ans.every((x) => x !== null);
  if (q.t === 'order') return !!st.touched || true;
  return true;
}
export function isCorrect(q, st) {
  const a = st.ans; if (a === undefined || a === null) return false;
  switch (q.t) {
    case 'one': return a === q.a;
    case 'multi': return a.length === q.a.length && q.a.every((x) => a.includes(x));
    case 'yesno': case 'match': return a.every((x, i) => x === q.a[i]);
    case 'order': return a.every((x, i) => x === i);
    case 'hot': return a.id === (q.img ? 'box' : q.a);
  }
  return false;
}


export function answerText(q) {
  switch (q.t) {
    case 'one': return q.o[q.a];
    case 'multi': return q.a.map((i) => q.o[i]).join('; ');
    case 'yesno': return q.s.map((s, i) => `${q.a[i] ? 'Đúng' : 'Sai'}`).join(' – ');
    case 'match': return q.L.map((l, i) => `${l} → ${q.R[q.a[i]]}`).join('; ');
    case 'order': return q.items.join(' → ');
    case 'hot': return 'Vị trí được tô xanh trên hình (xem lại trong chế độ luyện tập)';
  }
}

