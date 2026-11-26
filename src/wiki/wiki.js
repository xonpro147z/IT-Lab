// Bách khoa Tin học – trình hiển thị bài viết kiểu Wikipedia
import A1 from './articles-1.js';
import A2 from './articles-2.js';
import A3 from './articles-3.js';
import { FIGS } from './figs.js';
import { MOCKS, heroSVG, GRAD } from './illus.js';
Object.assign(FIGS, MOCKS);

export const CATS = [
  { id: 'he-thong', name: 'Máy tính & hệ điều hành', icon: '🖥️', desc: 'Hệ điều hành, bộ nhớ, sự cố và cách khắc phục' },
  { id: 'internet', name: 'Internet & đám mây', icon: '🌐', desc: 'Mạng, trình duyệt, đám mây, tìm kiếm thông tin' },
  { id: 'cong-dan-so', name: 'Công dân số', icon: '🪪', desc: 'Danh tính số, bản quyền, giấy phép' },
  { id: 'an-toan', name: 'An toàn thông tin', icon: '🔐', desc: 'Mật khẩu, mã độc, lừa đảo trực tuyến' },
  { id: 'du-lieu', name: 'Dữ liệu & biểu đồ', icon: '📊', desc: 'Trực quan hoá và đọc hiểu dữ liệu' },
  { id: 'ai', name: 'Trí tuệ nhân tạo', icon: '🤖', desc: 'AI là gì và dùng AI có trách nhiệm' },
];
const BUILTIN = [...A1, ...A2, ...A3];
let ARTS = BUILTIN.slice();
let BY = Object.fromEntries(ARTS.map((a) => [a.id, a]));

// ---------- Gói kiến thức tải về từ GitHub (content/wiki/*.md) ----------
// Định dạng một bài: phần đầu (front matter) giữa hai dòng ---, rồi nội dung, cuối cùng là mục "## Kiểm tra nhanh".
export function parseMd(text) {
  text = text.replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/); if (!m) return null;
  const meta = {}, rows = [];
  m[1].split('\n').forEach((ln) => { const k = ln.match(/^([\w.]+):\s*(.*)$/); if (!k) return; if (k[1] === 'box') { const [a, ...b] = k[2].split('|'); rows.push([a.trim(), b.join('|').trim()]); } else meta[k[1]] = k[2].trim(); });
  if (!meta.id || !meta.title) return null;
  let body = m[2]; const quiz = [];
  const qi = body.search(/^##\s*Kiểm tra nhanh\s*$/mi);
  if (qi >= 0) {
    const qs = body.slice(qi).split('\n').slice(1); body = body.slice(0, qi);
    let cur = null;
    qs.forEach((ln) => { ln = ln.trim(); if (ln.startsWith('?')) { cur = { q: ln.slice(1).trim(), o: [], a: 0, e: '' }; quiz.push(cur); } else if (cur && /^[-+]\s/.test(ln)) { if (ln[0] === '+') cur.a = cur.o.length; cur.o.push(ln.slice(2).trim()); } else if (cur && ln.startsWith('=')) cur.e = ln.slice(1).trim(); });
  }
  const list = (v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
  return { id: meta.id.replace(/[^\w-]/g, ''), title: meta.title, cat: meta.cat || 'he-thong', icon: meta.icon || '📄', summary: meta.summary || '', aliases: list(meta.aliases), related: list(meta.related), infobox: rows.length ? { title: meta.boxTitle || 'Thông tin nhanh', rows } : null, body: body.trim(), quiz: quiz.filter((q) => q.o.length >= 2) };
}
async function loadPack() {
  try {
    const pack = window.desktop && window.desktop.content ? await window.desktop.content.get('wiki') : null;
    ARTS = BUILTIN.slice();
    if (pack && pack.files) for (const f of pack.files) {
      const a = parseMd(f.text); if (!a) continue;
      if (!CATS.some((c) => c.id === a.cat)) a.cat = 'he-thong';
      const i = ARTS.findIndex((x) => x.id === a.id);
      if (i >= 0) { a.packTag = 'Cập nhật'; ARTS[i] = a; } else { a.packTag = 'Mới'; ARTS.push(a); }
    }
  } catch { ARTS = BUILTIN.slice(); }
  BY = Object.fromEntries(ARTS.map((a) => [a.id, a]));
  INDEX = buildIndex();
}
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

// ---------- tiến độ ----------
const store = { get() { try { return JSON.parse(localStorage.getItem('thl.wiki') || '{}'); } catch { return {}; } }, set(v) { try { localStorage.setItem('thl.wiki', JSON.stringify(v)); } catch {} } };
const P = Object.assign({ read: {}, quiz: {} }, store.get());
const save = () => store.set(P);

// ---------- chuyển mã đánh dấu thành HTML ----------
function inline(s) {
  const keep = [];
  const hold = (h) => `\u0001${keep.push(h) - 1}\u0002`;
  s = s.replace(/`([^`]+)`/g, (_, c) => hold(`<code>${esc(c)}</code>`));
  s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, id, txt) => { const a = BY[id]; return hold(`<a class="${a ? 'wl' : 'wl red'}" href="#/a/${id}" title="${esc(a ? a.title : 'Bài chưa có')}">${esc(txt || (a ? a.title : id))}</a>`); });
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<i>$2</i>');
  return s.replace(/\u0001(\d+)\u0002/g, (_, i) => keep[+i]);
}
export const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function render(md) {
  const L = md.trim().split('\n');
  let out = '', i = 0; const toc = [];
  const take = (re) => { const r = []; while (i < L.length && re.test(L[i])) r.push(L[i++]); return r; };
  while (i < L.length) {
    const ln = L[i];
    if (!ln.trim()) { i++; continue; }
    if (ln.startsWith('## ')) { const t = ln.slice(3).trim(); const id = slug(t); toc.push({ t, id, lv: 2 }); out += `<h2 id="${id}">${inline(t)}</h2>`; i++; continue; }
    if (ln.startsWith('### ')) { const t = ln.slice(4).trim(); const id = slug(t); toc.push({ t, id, lv: 3 }); out += `<h3 id="${id}">${inline(t)}</h3>`; i++; continue; }
    const fig = ln.match(/^\{\{fig:([\w-]+)(?:\|(.+))?\}\}$/);
    if (fig) { const f = FIGS[fig[1]]; out += `<figure class="fig">${f ? f() : ''}${fig[2] ? `<figcaption>${inline(fig[2])}</figcaption>` : ''}</figure>`; i++; continue; }
    if (/^\|/.test(ln)) {
      const rows = take(/^\|/).map((r) => r.replace(/\[\[[^\]]*\]\]/g, (m) => m.replace(/\|/g, '\u0003')).replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim().replace(/\u0003/g, '|')));
      out += `<div class="tblw"><table class="wt"><thead><tr>${rows[0].map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      continue;
    }
    if (/^- /.test(ln)) { out += `<ul>${take(/^- /).map((x) => `<li>${inline(x.slice(2))}</li>`).join('')}</ul>`; continue; }
    if (/^\d+\. /.test(ln)) { out += `<ol>${take(/^\d+\. /).map((x) => `<li>${inline(x.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`; continue; }
    if (ln.startsWith('> ')) {
      const txt = take(/^> /).map((x) => x.slice(2)).join(' ');
      const kind = /^(Cẩn thận|Cảnh báo)/.test(txt) ? 'warn' : /^(Mẹo|Thử thách)/.test(txt) ? 'tip' : 'note';
      out += `<div class="callout ${kind}">${inline(txt)}</div>`; continue;
    }
    const para = []; while (i < L.length && L[i].trim() && !/^(#{2,3} |\||- |\d+\. |> |\{\{fig:)/.test(L[i])) para.push(L[i++]);
    out += `<p>${inline(para.join(' '))}</p>`;
  }
  return { html: out, toc };
}
const plain = (md) => md.replace(/\{\{[^}]+\}\}/g, ' ').replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, a, b) => b || (BY[a] ? BY[a].title : a)).replace(/[*`#>|]/g, ' ').replace(/\s+/g, ' ');
const buildIndex = () => ARTS.map((a) => ({ a, title: norm(a.title), alias: norm((a.aliases || []).join(' | ')), sum: norm(a.summary), body: norm(plain(a.body)), raw: plain(a.body) }));
let INDEX = buildIndex();

// ---------- tìm kiếm ----------
export function search(q) {
  const terms = norm(q).split(/\s+/).filter(Boolean); if (!terms.length) return [];
  const phrase = norm(q).trim();
  return INDEX.map((x) => {
    let s = 0;
    for (const t of terms) {
      // từ ngắn (≤3 ký tự) phải khớp nguyên từ để tránh “tu” khớp vào “tuyển”
      const re = t.length <= 3 ? new RegExp('(^|[^a-z0-9])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^a-z0-9])', 'g') : null;
      const has = (str) => (re ? (re.lastIndex = 0, re.test(str)) : str.includes(t));
      const inT = has(x.title), inA = has(x.alias), inS = has(x.sum);
      const n = re ? (x.body.match(re) || []).length : x.body.split(t).length - 1;
      if (!inT && !inA && !inS && !n) return null;
      s += (inT ? 12 : 0) + (inA ? 7 : 0) + (inS ? 3 : 0) + Math.min(n, 8);
    }
    if (x.title.includes(phrase)) s += 20; if (x.alias.includes(phrase)) s += 10; if (x.body.includes(phrase)) s += 4;
    return { a: x.a, s, snip: snippet(x, terms) };
  }).filter(Boolean).sort((a, b) => b.s - a.s);
}
function snippet(x, terms) {
  const k = terms.filter((t) => t.length > 3).concat(terms).map((t) => x.body.indexOf(t)).filter((v) => v >= 0)[0];
  if (k === undefined) return esc(x.a.summary);
  const st = Math.max(0, k - 60);
  let s = (st ? '…' : '') + x.raw.slice(st, st + 200) + '…';
  s = esc(s);
  // tô đậm (so khớp không dấu trên chuỗi gốc)
  const n = norm(s);
  const marks = [];
  terms.forEach((t) => { let p = 0; while ((p = n.indexOf(t, p)) >= 0) { const okB = t.length > 3 || ((p === 0 || !/[a-z0-9]/.test(n[p - 1])) && !/[a-z0-9]/.test(n[p + t.length] || '')); if (okB) marks.push([p, p + t.length]); p += t.length; } });
  marks.sort((a, b) => b[0] - a[0]).forEach(([a, b]) => { s = s.slice(0, a) + '<mark>' + s.slice(a, b) + '</mark>' + s.slice(b); });
  return s;
}

// ---------- các trang ----------
const main = $('#content');
const catOf = (a) => CATS.find((c) => c.id === a.cat);
const gradCss = (cat) => { const [a, b] = GRAD[cat] || GRAD['he-thong']; return `linear-gradient(135deg, ${a}, ${b})`; };
const minutes = (a) => Math.max(2, Math.round(plain(a.body).split(' ').length / 180));
const heroCache = new Map();
const hero = (a) => { if (!heroCache.has(a.id)) heroCache.set(a.id, heroSVG(a)); return heroCache.get(a.id); };
function pills(cur) {
  $('#pills').innerHTML = `<a href="#/" class="${cur === 'home' ? 'on' : ''}">Tất cả chủ đề</a>` + CATS.map((c) => `<a href="#/c/${c.id}" class="${cur === c.id ? 'on' : ''}" style="--g:${gradCss(c.id)}">${c.icon} ${c.name}</a>`).join('') + `<a href="#/random" class="rnd">🎲 Ngẫu nhiên</a>`;
}
const card = (a, big = false) => `<a class="acard ${big ? 'big' : ''}" href="#/a/${a.id}">
  <div class="thumb">${hero(a)}${a.packTag ? `<span class="newtag">${a.packTag}</span>` : ''}${P.read[a.id] ? '<span class="done">✓ Đã đọc</span>' : ''}</div>
  <div class="ainfo"><span class="eyebrow" style="--g:${gradCss(a.cat)}">${catOf(a).name}</span><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><small>${minutes(a)} phút đọc · ${a.quiz ? a.quiz.length : 0} câu hỏi${P.quiz[a.id] !== undefined ? ` · 🏅 ${P.quiz[a.id]}/${a.quiz.length}` : ''}</small></div></a>`;

function home() {
  pills('home');
  const readN = Object.keys(P.read).filter((k) => BY[k]).length;
  const day = Math.floor(Date.now() / 864e5);
  const feat = [0, 1, 2].map((k) => ARTS[(day + k * 6) % ARTS.length]);
  const facts = [
    ['💾', 'Ổ cứng ghi 1 TB nhưng Windows chỉ hiện khoảng 931 GB, vì hai bên đếm đơn vị khác nhau.', 'don-vi-bo-nho', '#0a84ff'],
    ['🐧', 'Linux do một sinh viên 21 tuổi tạo ra năm 1991, nay chạy hầu hết máy chủ Internet và là nền móng của Android.', 'lich-su-hdh', '#5e5ce6'],
    ['🕵️', 'Chế độ ẩn danh không giúp em vô hình với nhà mạng hay nhà trường.', 'trinh-duyet', '#32ade6'],
    ['🔎', 'Thêm site:gov.vn sau từ khoá để chỉ tìm trên trang của cơ quan nhà nước.', 'tim-kiem', '#30d158'],
    ['🅭', 'Wikipedia dùng giấy phép CC BY-SA: ai cũng được dùng lại nếu ghi công và chia sẻ cùng giấy phép.', 'giay-phep-cc', '#ff9f0a'],
    ['🤖', 'Chatbot AI có thể bịa ra cả nguồn trích dẫn; hiện tượng này gọi là “ảo giác”.', 'tri-tue-nhan-tao', '#bf5af2'],
    ['🔐', 'Ngân hàng không bao giờ hỏi mã OTP của em.', 'bao-mat-thiet-bi', '#0f766e'],
  ];
  const pick = [0, 1, 2, 3].map((k) => facts[(day + k) % facts.length]);
  const pct = Math.round((readN / ARTS.length) * 100);
  main.innerHTML = `
  <section class="hero">
    <p class="kicker">Bách khoa Tin học</p>
    <h1>Khám phá thế giới<br><span class="grad">tin học.</span></h1>
    <p class="sub">${ARTS.length} bài viết dễ hiểu, minh hoạ sinh động, kèm câu hỏi kiểm tra sau mỗi bài.</p>
    <button class="bigsearch" id="bigSearch">🔎 Em muốn tìm hiểu điều gì? <kbd>/</kbd></button>
    <div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="#e5e5ea" stroke-width="10"/><circle cx="60" cy="60" r="50" fill="none" stroke="url(#rg)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(pct / 100) * 314} 314" transform="rotate(-90 60 60)"/><defs><linearGradient id="rg"><stop offset="0" stop-color="#0a84ff"/><stop offset="1" stop-color="#bf5af2"/></linearGradient></defs></svg><div><b>${readN}/${ARTS.length}</b><span>bài đã đọc</span></div></div>
  </section>
  <section class="band"><h2 class="h2">Nổi bật hôm nay.</h2><div class="featured">${feat.map((a) => card(a, true)).join('')}</div></section>
  <section class="band"><h2 class="h2">Bạn có biết?</h2><div class="facts">${pick.map(([ic, f, id, c]) => `<a class="fact" href="#/a/${id}" style="--c:${c}"><span class="fi">${ic}</span><p>${esc(f)}</p><em>Tìm hiểu thêm ›</em></a>`).join('')}</div></section>
  ${CATS.map((c) => `<section class="band"><div class="bandhd"><h2 class="h2"><span class="cdot" style="background:${gradCss(c.id)}">${c.icon}</span>${c.name}.</h2><a href="#/c/${c.id}">Xem tất cả ›</a></div><div class="grid">${ARTS.filter((a) => a.cat === c.id).map((a) => card(a)).join('')}</div></section>`).join('')}`;
  $('#bigSearch').onclick = () => $('#q').focus();
  document.title = 'Bách khoa Tin học – TinHocLab';
}
function catPage(id) {
  const c = CATS.find((x) => x.id === id); if (!c) return home();
  pills(id);
  main.innerHTML = `<section class="cathero" style="background:${gradCss(id)}"><span>${c.icon}</span><h1>${c.name}</h1><p>${c.desc}.</p></section><section class="band"><div class="grid">${ARTS.filter((a) => a.cat === id).map((a) => card(a)).join('')}</div></section>`;
}
function allPage() {
  pills('home');
  const sorted = [...ARTS].sort((a, b) => a.title.localeCompare(b.title, 'vi'));
  main.innerHTML = `<section class="band"><h2 class="h2">Tất cả bài viết.</h2><div class="grid">${sorted.map((a) => card(a)).join('')}</div></section>`;
}
function searchPage(q) {
  pills(null);
  const r = search(q);
  $('#q').value = q;
  main.innerHTML = `<section class="band"><p class="kicker">Kết quả tìm kiếm</p><h2 class="h2">“${esc(q)}”</h2><p class="muted">${r.length ? `Tìm thấy ${r.length} bài.` : 'Không tìm thấy bài nào. Thử từ khoá ngắn hơn, hoặc gõ không dấu.'}</p>
  <div class="results">${r.map((x) => `<a class="res" href="#/a/${x.a.id}"><div class="rthumb">${hero(x.a)}</div><div><span class="eyebrow" style="--g:${gradCss(x.a.cat)}">${catOf(x.a).name}</span><h3>${esc(x.a.title)}</h3><p>${x.snip}</p></div></a>`).join('')}</div></section>`;
}
function article(id) {
  const a = BY[id]; if (!a) { main.innerHTML = `<section class="band"><h2 class="h2">Chưa có bài “${esc(id)}”.</h2><p><a href="#/">Về trang chính</a></p></section>`; return; }
  pills(a.cat);
  const { html, toc } = render(a.body);
  const cat = catOf(a);
  const idx = ARTS.indexOf(a), prev = ARTS[(idx - 1 + ARTS.length) % ARTS.length], next = ARTS[(idx + 1) % ARTS.length];
  const box = a.infobox ? `<div class="side-card info"><h4>${esc(a.infobox.title || 'Thông tin nhanh')}</h4>${a.infobox.rows.map(([k, v]) => `<div class="kv"><span>${inline(k)}</span><b>${inline(v)}</b></div>`).join('')}</div>` : '';
  const h2s = toc.filter((t) => t.lv === 2);
  const tocH = `<div class="side-card toc"><h4>Trong bài này</h4>${h2s.map((t) => `<a data-jump="${t.id}">${inline(t.t)}</a>`).join('')}${a.quiz ? '<a data-jump="quiz">✏️ Kiểm tra nhanh</a>' : ''}</div>`;
  const rel = (a.related || []).filter((r) => BY[r]);
  main.innerHTML = `<article class="art" style="--g:${gradCss(a.cat)}">
    <header class="ahead">
      <a class="eyebrow" href="#/c/${cat.id}" style="--g:${gradCss(a.cat)}">${cat.icon} ${cat.name}</a>
      <h1>${esc(a.title)}</h1>
      <p class="sub">${esc(a.summary)}</p>
      <div class="meta">${a.packTag ? `<span class="newpill">✨ ${a.packTag === 'Mới' ? 'Bài mới' : 'Vừa cập nhật'}</span>` : ''}<span>⏱ ${minutes(a)} phút đọc</span>${a.quiz ? `<span data-jump="quiz" class="link">✏️ ${a.quiz.length} câu hỏi</span>` : ''}<span id="readBtn" class="link">${P.read[id] ? '✓ Đã đọc' : '○ Đánh dấu đã đọc'}</span></div>
    </header>
    <div class="ahero">${hero(a)}</div>
    <div class="acols">
      <div class="body">${html}
        ${a.quiz ? `<h2 id="quiz">Kiểm tra nhanh</h2><div id="quizBox"></div>` : ''}
        ${rel.length ? `<h2 id="xem-them">Xem thêm</h2><div class="grid mini">${rel.map((r) => card(BY[r])).join('')}</div>` : ''}
        <p class="foot">Nội dung biên soạn cho học sinh, cập nhật 11/2026. Một số số liệu (thị phần, phiên bản) thay đổi theo thời gian; khi cần chính xác, hãy kiểm tra nguồn mới nhất. Hình minh hoạ được vẽ mô phỏng, không phải ảnh chụp màn hình thật.</p>
      </div>
      <aside class="aside">${box}${tocH}</aside>
    </div>
    <nav class="pn"><a href="#/a/${prev.id}"><small>‹ Bài trước</small><b>${prev.icon} ${esc(prev.title)}</b></a><a href="#/a/${next.id}" class="nx"><small>Bài tiếp theo ›</small><b>${next.icon} ${esc(next.title)}</b></a></nav>
  </article>`;
  document.title = a.title + ' – Bách khoa Tin học';
  main.querySelectorAll('[data-jump]').forEach((el) => (el.onclick = (e) => { e.preventDefault(); const t = document.getElementById(el.dataset.jump); if (t) $('#main').scrollTo({ top: t.offsetTop - 70, behavior: 'smooth' }); }));
  const setRead = (v) => { if (v) P.read[id] = true; else delete P.read[id]; save(); $('#readBtn').textContent = P.read[id] ? '✓ Đã đọc' : '○ Đánh dấu đã đọc'; };
  $('#readBtn').onclick = () => setRead(!P.read[id]);
  if (a.quiz) quiz(a);
  // thanh tiến độ đọc + mục lục đang đọc + tự đánh dấu đã đọc
  const sc = $('#main'), bar = $('#readbar'), links = [...main.querySelectorAll('.toc a')];
  bar.style.background = gradCss(a.cat);
  sc.onscroll = () => {
    const p = sc.scrollTop / Math.max(1, sc.scrollHeight - sc.clientHeight);
    bar.style.width = p * 100 + '%';
    let cur = null; for (const t of [...h2s.map((x) => x.id), 'quiz']) { const el = document.getElementById(t); if (el && el.offsetTop - 120 < sc.scrollTop) cur = t; }
    links.forEach((l) => l.classList.toggle('on', l.dataset.jump === cur));
    if (!P.read[id] && p > 0.85) setRead(true);
  };
}
function quiz(a) {
  const box = $('#quizBox'); const ans = {};
  const draw = () => {
    const done = Object.keys(ans).length === a.quiz.length;
    const score = a.quiz.filter((q, i) => ans[i] === q.a).length;
    box.innerHTML = a.quiz.map((q, i) => `<div class="qq"><div class="qt"><span>${i + 1}</span>${inline(q.q)}</div><div class="qo">${q.o.map((o, k) => {
      const st = ans[i] === undefined ? '' : k === q.a ? 'right' : ans[i] === k ? 'wrong' : 'dim';
      return `<button data-q="${i}" data-k="${k}" class="${st}" ${ans[i] !== undefined ? 'disabled' : ''}><i>${String.fromCharCode(65 + k)}</i>${inline(o)}</button>`;
    }).join('')}</div>${ans[i] !== undefined ? `<div class="qe ${ans[i] === q.a ? 'ok' : 'no'}"><b>${ans[i] === q.a ? 'Chính xác!' : 'Chưa đúng.'}</b> ${inline(q.e || '')}</div>` : ''}</div>`).join('') +
      (done ? `<div class="qres"><div class="big">${score}/${a.quiz.length}</div><div><b>${score === a.quiz.length ? 'Xuất sắc! 🎉' : score >= a.quiz.length / 2 ? 'Khá tốt! 👍' : 'Cố lên! 💪'}</b><p>${score === a.quiz.length ? 'Em đã nắm vững bài này.' : 'Đọc lại các phần liên quan rồi thử lần nữa nhé.'}</p></div><button id="qAgain">Làm lại</button></div>` : '');
    box.querySelectorAll('button[data-q]').forEach((b) => (b.onclick = () => {
      ans[+b.dataset.q] = +b.dataset.k; draw();
      if (Object.keys(ans).length === a.quiz.length) { const s = a.quiz.filter((q, i) => ans[i] === q.a).length; P.quiz[a.id] = Math.max(P.quiz[a.id] || 0, s); P.read[a.id] = true; save(); if (s === a.quiz.length) confetti(); try { Progress.record('wiki', a.id, s, a.quiz.length); } catch {} }
    }));
    const ag = $('#qAgain'); if (ag) ag.onclick = () => { for (const k in ans) delete ans[k]; draw(); };
  };
  draw();
}
function confetti() {
  const c = document.createElement('div'); c.className = 'confetti';
  c.innerHTML = [...Array(60)].map((_, i) => `<i style="left:${Math.random() * 100}%;background:${['#0a84ff', '#30d158', '#ff9f0a', '#ff375f', '#bf5af2', '#ffd60a'][i % 6]};animation-delay:${Math.random() * 0.4}s;animation-duration:${1.4 + Math.random()}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join('');
  document.body.appendChild(c); setTimeout(() => c.remove(), 2600);
}
// ---------- điều hướng ----------
function route() {
  const h = decodeURIComponent(location.hash.slice(1) || '/');
  const [, kind, arg] = h.split('/');
  $('#main').scrollTop = 0; $('#main').onscroll = null; $('#readbar').style.width = '0';
  if (kind === 'a') article(arg);
  else if (kind === 's') searchPage(h.slice(3));
  else if (kind === 'c') catPage(arg);
  else if (kind === 'all') allPage();
  else if (kind === 'random') { location.replace('#/a/' + ARTS[Math.floor(Math.random() * ARTS.length)].id); return; }
  else home();
  if (kind !== 's') $('#q').value = '';
}
addEventListener('hashchange', route);

// ô tìm kiếm có gợi ý
const q = $('#q'), sug = $('#sug');
let sel = -1;
q.oninput = () => {
  const r = search(q.value).slice(0, 7); sel = -1;
  sug.innerHTML = r.map((x) => `<a href="#/a/${x.a.id}"><span>${x.a.icon}</span><div><b>${esc(x.a.title)}</b><small>${esc(x.a.summary)}</small></div></a>`).join('') + (q.value.trim() ? `<a href="#/s/${encodeURIComponent(q.value.trim())}" class="all">🔎 Tìm “${esc(q.value.trim())}” trong mọi bài</a>` : '');
  sug.hidden = !q.value.trim();
};
q.onkeydown = (e) => {
  const items = [...sug.querySelectorAll('a')];
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((x, i) => x.classList.toggle('sel', i === sel)); }
  if (e.key === 'Enter') { e.preventDefault(); if (sel >= 0 && items[sel]) location.hash = items[sel].getAttribute('href'); else if (q.value.trim()) location.hash = '#/s/' + encodeURIComponent(q.value.trim()); sug.hidden = true; q.blur(); }
  if (e.key === 'Escape') { sug.hidden = true; q.blur(); }
};
q.onblur = () => setTimeout(() => (sug.hidden = true), 150);
sug.onclick = () => (sug.hidden = true);
document.addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); } });

await loadPack();
route();
if (window.desktop && window.desktop.content) window.desktop.content.onUpdated(async () => { heroCache.clear(); await loadPack(); route(); });
window.__wiki = { get ARTS() { return ARTS; }, search, render, parseMd };
