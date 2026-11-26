// Nhập đề từ PDF / Word / văn bản: trích từng dòng (giữ thông tin chữ đậm/đánh dấu) rồi nhận dạng câu hỏi.
// Hỗ trợ: 1 đáp án, nhiều đáp án, Đúng/Sai nhiều ý, ghép nối, sắp xếp thứ tự.

// ---------------- 1) TRÍCH DÒNG ----------------
// Mỗi dòng: { t: 'chuỗi', b: [true/false theo từng ký tự] } – b = chữ đậm / gạch chân / tô màu
function makeLine(spans) {
  let t = '', b = [];
  const merged = [];
  for (const sp of spans) { // dấu thanh tách rời (một số PDF) → nhập vào chữ trước
    if (/^[̀-ͯ]+$/.test(sp.s) && merged.length) merged[merged.length - 1].s += sp.s; else merged.push({ ...sp });
  }
  for (const sp of merged) {
    for (const ch of sp.s.normalize('NFC')) {
      if (/\s/.test(ch)) { if (!t || t.endsWith(' ')) continue; t += ' '; b.push(false); }
      else { t += ch; b.push(!!sp.b); }
    }
  }
  while (t.endsWith(' ')) { t = t.slice(0, -1); b.pop(); }
  return { t, b };
}

export async function extractPdf(buf, onProgress) {
  const pdfjs = await import('../vendor/pdfjs/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, standardFontDataUrl: new URL('../vendor/pdfjs/standard_fonts/', import.meta.url).href }).promise;
  const lines = [];
  let textChars = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    onProgress && onProgress(p, doc.numPages);
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    try { await page.getOperatorList(); } catch {} // nạp phông để biết chữ đậm
    const cache = {};
    const bold = (fn) => {
      if (fn in cache) return cache[fn];
      let r = false;
      try { const f = page.commonObjs.has(fn) ? page.commonObjs.get(fn) : null; const nm = `${f ? f.name || '' : ''} ${(tc.styles[fn] || {}).fontFamily || ''}`; r = !!(f && (f.bold || f.black)) || /bold|black|heavy|semibold|demi/i.test(nm); } catch {}
      return (cache[fn] = r);
    };
    let cur = [], lastY = null, lastX = null;
    const push = () => { if (cur.length) { const L = makeLine(cur); if (L.t) lines.push(L); } cur = []; };
    for (const it of tc.items) {
      if (!('str' in it)) continue;
      const x = it.transform[4], y = it.transform[5], h = it.height || Math.abs(it.transform[3]) || 10;
      if (lastY !== null && Math.abs(y - lastY) > Math.max(2, h * 0.55)) { push(); lastX = null; }
      if (it.str) {
        const prev = cur.length ? cur[cur.length - 1].s : '';
        if (cur.length && lastX !== null && x - lastX > h * 0.2 && !/\s$/.test(prev) && !/^\s/.test(it.str) && !/^[̀-ͯ]/.test(it.str)) cur.push({ s: ' ', b: false });
        cur.push({ s: it.str, b: bold(it.fontName) });
        textChars += it.str.trim().length;
      }
      lastY = y; lastX = x + (it.width || 0);
      if (it.hasEOL) { push(); lastY = null; lastX = null; }
    }
    push();
    lines.push({ t: '', b: [], page: true });
  }
  return { lines, pages: doc.numPages, scanned: textChars < 20 * doc.numPages };
}

export function extractDocx(paras) {
  return { lines: paras.map((sp) => makeLine(sp)), pages: 1, scanned: false };
}

export function extractText(txt) {
  return { lines: String(txt).replace(/\r/g, '').split('\n').map((s) => makeLine([{ s, b: false }])), pages: 1, scanned: false };
}

// ---------------- 2) NHẬN DẠNG CÂU HỎI ----------------
const Q_RE = /^(?:câu\s*hỏi|câu|question|bài)\s*(\d{1,3})\s*[:.)\-–]?\s*/i;
const NUM_RE = /^(\d{1,3})\s*[.)]\s+/;
const OPT_RE = /^[*✓✔√]?\s*([A-H])\s*[.)]\s+/;
const STMT_RE = /^[*✓✔√]?\s*([a-h])\s*[.)]\s+/;
const ANS_RE = /^(?:đáp\s*án(?:\s*đúng)?|đ\/a|answer|key)\s*[:：\-–]\s*(.*)$/i;
const EXP_RE = /^(?:giải\s*thích|lời\s*giải|hướng\s*dẫn(?:\s*giải)?|gợi\s*ý)\s*[:：\-–]?\s*(.*)$/i;
const PAIR_RE = /\s(?:=|→|->|=>|⇒|⟶|\|)\s/;
const ITEM_RE = /^(?:[-•●▪◦+–]|\d{1,2}\s*[.)])\s+/;
const TAGS = [
  [/\[\s*(?:một|1)\s*đáp\s*án\s*\]/i, 'one'],
  [/\[\s*(?:nhiều|chọn\s*nhiều)[^\]]*\]/i, 'multi'],
  [/\[\s*(?:đúng\s*\/?\s*sai|đ\s*\/\s*s|true\s*\/?\s*false)\s*\]/i, 'yesno'],
  [/\[\s*(?:ghép(?:\s*nối)?|nối|kéo\s*thả|matching)\s*\]/i, 'match'],
  [/\[\s*(?:sắp\s*xếp|thứ\s*tự|order)\s*\]/i, 'order'],
];
const MARK_END = /\s*(?:\((?:đúng|đ|x|✓)\)|\[(?:đúng|đ|x)\]|[*✓✔√])\s*$/i;
const TF_END = /\s*(?:[(\[]\s*(đúng|sai|đ|s)\s*[)\]]|[-–→:]\s*(đúng|sai))\s*$/i;
const tf = (w) => /^(đúng|đ|t|true|x)$/i.test(String(w).trim());
const clean = (s) => s.replace(/\s+/g, ' ').trim();

function sectionType(t) {
  if (!/^(?:phần|part|dạng)\s*([IVX]+|\d+)\b/i.test(t)) return undefined;
  if (/đúng\s*[\/-]?\s*sai/i.test(t)) return 'yesno';
  if (/ghép|nối|kéo\s*thả/i.test(t)) return 'match';
  if (/sắp\s*xếp|thứ\s*tự/i.test(t)) return 'order';
  if (/trả\s*lời\s*ngắn|tự\s*luận|điền/i.test(t)) return 'skip';
  return null; // trắc nghiệm thường → tự nhận
}

// tách nhiều phương án trên cùng một dòng: "A. xx   B. yy   C. zz"
function splitOptions(L) {
  const re = /(?:^|\s)([*✓✔√]?)\s*([A-H])\s*[.)]\s+/g; const found = []; let m, want = null;
  while ((m = re.exec(L.t))) {
    const letter = m[2];
    if (want === null) { if (m.index !== 0) break; want = letter; }
    if (letter !== want) continue;
    const start = m.index + (m[0].startsWith(' ') ? 1 : 0);
    found.push({ letter, start, body: m.index + m[0].length, star: !!m[1] });
    want = String.fromCharCode(letter.charCodeAt(0) + 1);
  }
  return found.map((f, i) => {
    const end = i + 1 < found.length ? found[i + 1].start : L.t.length;
    let text = L.t.slice(f.body, end).trim(); const bs = L.b.slice(f.body, end);
    const nonSp = [...L.t.slice(f.body, end)].map((c, k) => (c === ' ' ? null : bs[k])).filter((x) => x !== null);
    const bold = nonSp.length > 0 && nonSp.filter(Boolean).length / nonSp.length > 0.6;
    let mark = f.star; if (MARK_END.test(text)) { mark = true; text = text.replace(MARK_END, ''); }
    return { letter: f.letter, text, mark, bold };
  });
}

function blockLines(lines) {
  const hasCau = lines.some((L) => Q_RE.test(L.t));
  const startRe = hasCau ? Q_RE : NUM_RE;
  const blocks = []; let cur = null, sec = null, key = null;
  for (const L of lines) {
    if (!L.t) continue;
    if (key !== null) { key += ' ' + L.t; continue; }
    if (/^(?:bảng\s*)?đáp\s*án(?:\s*(?:và|&)\s*(?:hướng\s*dẫn|lời\s*giải).*)?\s*:?$|^(?:phần\s*)?đáp\s*án\s*(?:trắc\s*nghiệm|tham\s*khảo)/i.test(L.t)) { key = ''; cur = null; continue; }
    if (/^(?:trang\s*\d+|\d+\s*\/\s*\d+|-\s*\d+\s*-)$/i.test(L.t)) continue; // số trang
    const st = sectionType(L.t);
    if (st !== undefined) { sec = st; cur = null; continue; }
    const m = L.t.match(startRe);
    if (m) { const off = m[0].length; cur = { num: +m[1], sec, head: { t: L.t.slice(off), b: L.b.slice(off) }, lines: [] }; blocks.push(cur); continue; }
    if (cur) cur.lines.push(L);
  }
  // bảng đáp án cuối đề: "1.B 2.C 3.A,C" hoặc "Câu 1: B"
  const keys = {};
  if (key) for (const m of key.matchAll(/(?:câu\s*)?(\d{1,3})\s*[.:)\-–]?\s*([A-H](?:\s*[,;và]+\s*[A-H])*)(?![\p{L}])/giu)) keys[+m[1]] = m[2];
  if (key) for (const m of key.matchAll(/(?:câu\s*)?(\d{1,3})\s*[.:)\-–]?\s*((?:đúng|sai|đ|s)(?:[\s,;\-–]+(?:[a-h]\s*[).:\-–]?\s*)?(?:đúng|sai|đ|s))+)(?![\p{L}])/giu)) keys[+m[1]] = m[2];
  return { blocks, hasCau, keys };
}

function parseBlock(B, keyAns) {
  const warn = [];
  let qtext = B.head.t, ans = '', exp = '', state = 'q', tag = null;
  const opts = [], stmts = [], pairs = [], items = [];
  const addLine = (L) => {
    const t = L.t; let m;
    if ((m = t.match(ANS_RE))) { ans += ' ' + m[1]; state = 'ans'; return; }
    if ((m = t.match(EXP_RE))) { exp += ' ' + m[1]; state = 'exp'; return; }
    if (state === 'exp' || state === 'ans') { exp += ' ' + t; state = 'exp'; return; }
    if (OPT_RE.test(t)) { const os = splitOptions(L); if (os.length) { opts.push(...os); state = 'opt'; return; } }
    if ((m = t.match(STMT_RE))) {
      let text = t.slice(m[0].length).trim(), val = null, mk = /^[*✓✔√]/.test(t);
      const tm = text.match(TF_END); if (tm) { val = tf(tm[1] || tm[2]); text = text.replace(TF_END, ''); }
      if (MARK_END.test(text)) { mk = true; text = text.replace(MARK_END, ''); }
      const bs = L.b.slice(m[0].length); const nb = bs.filter(Boolean).length;
      stmts.push({ letter: m[1], text, val, mark: mk, bold: bs.length > 0 && nb / bs.length > 0.6 }); state = 'stmt'; return;
    }
    if (PAIR_RE.test(t) && t.length < 200) { const [l, ...r] = t.replace(ITEM_RE, '').split(PAIR_RE); pairs.push([clean(l), clean(r.join(' '))]); state = 'pair'; return; }
    if ((m = t.match(ITEM_RE))) { items.push({ label: (m[0].match(/\d+/) || [''])[0], text: t.slice(m[0].length).trim() }); state = 'item'; return; }
    // dòng tiếp nối (văn bản bị xuống dòng)
    if (state === 'q') qtext += ' ' + t;
    else if (state === 'opt') opts[opts.length - 1].text += ' ' + t;
    else if (state === 'stmt') stmts[stmts.length - 1].text += ' ' + t;
    else if (state === 'item') items[items.length - 1].text += ' ' + t;
    else if (state === 'pair') pairs[pairs.length - 1][1] += ' ' + t;
  };
  // phương án có thể nằm ngay trên dòng "Câu 1: ... A. x B. y"
  const head = B.head; const hm = head.t.match(/\s([*✓✔√]?)\s*A\s*[.)]\s+.*\sB\s*[.)]\s+/);
  if (hm) { const k = hm.index + 1; qtext = head.t.slice(0, k - 1); addLine({ t: head.t.slice(k), b: head.b.slice(k) }); }
  B.lines.forEach(addLine);
  for (const [re, ty] of TAGS) if (re.test(qtext)) { tag = ty; qtext = qtext.replace(re, ''); }
  if (!ans.trim() && keyAns) ans = keyAns;
  qtext = clean(qtext); ans = clean(ans); exp = clean(exp);
  const nPick = (qtext.match(/\(?\s*chọn\s*(\d|hai|ba|bốn)\s*(?:đáp\s*án|phương\s*án|ý)?\s*\)?/i) || [])[1];
  const nWant = nPick ? ({ hai: 2, ba: 3, bốn: 4 }[nPick.toLowerCase()] || +nPick) : 0;

  // ---- xác định dạng câu ----
  let t = tag || (B.sec && B.sec !== 'skip' ? B.sec : null);
  if (B.sec === 'skip' && !tag) return { skip: true, num: B.num, q: qtext, why: 'Câu trả lời ngắn / tự luận – chưa hỗ trợ' };
  const W = (x) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${x})(?![\\p{L}\\p{N}])`, 'giu');
  const one1 = ans.match(/^([A-H])\s*[.)]\s/); // "Đáp án: D. Cả A và B" → chỉ lấy D
  const ansLetters = one1 ? [one1[1]] : (ans.match(W('[A-Ha-h]')) || (/^[A-H]{2,8}$/.test(ans) ? ans.split('') : [])).map((x) => x.toUpperCase());
  const ansTF = ans.match(W('đúng|sai|đ|s|true|false')) || (/^[ĐS]{2,8}$/i.test(ans.replace(/[\s,;\-–]/g, '')) ? ans.replace(/[\s,;\-–]/g, '').split('') : null);
  const ansPairs = [...ans.matchAll(/(\d{1,2})\s*[-–→>:.)]?\s*([a-hA-H])(?![\p{L}])/gu)].map((m) => [+m[1], m[2].toLowerCase()]);
  if (!t) {
    if (pairs.length >= 2) t = 'match';
    else if (items.length >= 2 && stmts.length >= 2 && ansPairs.length >= 2) t = 'match';
    else if (!opts.length && (items.length >= 2 || stmts.length >= 2) && /sắp\s*xếp|thứ\s*tự|trình\s*tự|các\s*bước/i.test(qtext)) t = 'order';
    else if (stmts.length && !opts.length && (stmts.some((s) => s.val !== null) || ansTF || /đúng\s*hay\s*sai|đúng\s*[\/-]\s*sai|đúng\s*sai/i.test(qtext))) t = 'yesno';
    else if (opts.length >= 2) t = 'one';
    else if (stmts.length >= 2) t = 'one';
    else return { skip: true, num: B.num, q: qtext, why: 'Không thấy phương án trả lời' };
  }
  if ((t === 'one' || t === 'multi') && !opts.length && stmts.length) opts.push(...stmts.map((s) => ({ letter: s.letter.toUpperCase(), text: s.text, mark: s.mark, bold: s.bold })));

  const out = { t, q: qtext, e: exp };
  if (t === 'one' || t === 'multi') {
    if (opts.length < 2) return { skip: true, num: B.num, q: qtext, why: 'Cần ít nhất 2 phương án' };
    out.o = opts.map((o) => clean(o.text));
    let correct = ansLetters.map((l) => opts.findIndex((o) => o.letter === l)).filter((i) => i >= 0);
    if (!correct.length) correct = opts.map((o, i) => (o.mark ? i : -1)).filter((i) => i >= 0);
    if (!correct.length) { const nb = opts.filter((o) => o.bold).length; if (nb && nb < opts.length) correct = opts.map((o, i) => (o.bold ? i : -1)).filter((i) => i >= 0); }
    correct = [...new Set(correct)];
    if (t === 'one' && (correct.length > 1 || nWant > 1)) t = out.t = 'multi';
    if (!correct.length) { warn.push('Chưa tìm thấy đáp án đúng – hãy chọn lại'); correct = [0]; }
    if (out.t === 'one') out.a = correct[0];
    else { out.a = correct; out.n = correct.length; if (nWant && nWant !== correct.length) warn.push(`Đề ghi chọn ${nWant} nhưng tìm thấy ${correct.length} đáp án`); }
  }
  if (t === 'yesno') {
    const src = stmts.length ? stmts : opts.map((o) => ({ ...o, val: null }));
    if (!src.length) return { skip: true, num: B.num, q: qtext, why: 'Không thấy các ý a), b), c)…' };
    out.s = src.map((s) => clean(s.text));
    let vals = src.map((s) => s.val);
    if (vals.some((v) => v === null) && ansTF && ansTF.length >= src.length) vals = ansTF.slice(0, src.length).map(tf);
    if (vals.some((v) => v === null)) { const byLetter = [...ans.matchAll(/([a-h])\s*[).:\-–]?\s*(đúng|sai|đ|s)(?![\p{L}])/giu)]; byLetter.forEach((m) => { const i = src.findIndex((s) => s.letter.toLowerCase() === m[1].toLowerCase()); if (i >= 0) vals[i] = tf(m[2]); }); }
    if (vals.some((v) => v === null) && src.some((s) => s.mark || s.bold) && !src.every((s) => s.bold)) vals = src.map((s) => !!(s.mark || s.bold));
    if (vals.some((v) => v === null)) { warn.push('Chưa rõ ý nào Đúng/Sai – hãy kiểm tra lại'); vals = vals.map((v) => v ?? true); }
    out.a = vals;
  }
  if (t === 'match') {
    if (pairs.length >= 2) { out.L = pairs.map((p) => p[0]); out.R = pairs.map((p) => p[1]); out.a = pairs.map((_, i) => i); }
    else {
      const left = items.length ? items : opts.map((o) => ({ text: o.text })), right = stmts.length ? stmts : [];
      if (left.length < 2 || right.length < 2) return { skip: true, num: B.num, q: qtext, why: 'Câu ghép nối cần các dòng dạng “Vế trái = Vế phải”' };
      out.L = left.map((x) => clean(x.text)); out.R = right.map((x) => clean(x.text));
      out.a = out.L.map((_, i) => { const p = ansPairs.find((x) => x[0] === i + 1); const k = p ? right.findIndex((r) => r.letter === p[1]) : -1; return k >= 0 ? k : i; });
      if (!ansPairs.length) warn.push('Chưa có đáp án ghép (vd: 1-b, 2-a) – đang ghép theo thứ tự');
      if (out.R.length !== out.L.length) warn.push('Số vế trái và vế phải khác nhau');
    }
  }
  if (t === 'order') {
    const src = items.length >= 2 ? items.map((x, i) => ({ key: x.label || String(i + 1), text: x.text })) : stmts.length >= 2 ? stmts.map((x) => ({ key: x.letter, text: x.text })) : opts.map((x) => ({ key: x.letter.toLowerCase(), text: x.text }));
    if (src.length < 2) return { skip: true, num: B.num, q: qtext, why: 'Câu sắp xếp cần ít nhất 2 bước' };
    const keys = ans.match(/(?<![\p{L}\p{N}])(\d{1,2}|[a-hA-H])(?![\p{L}\p{N}])/gu);
    let order = null;
    if (keys && keys.length === src.length) { const idx = keys.map((k) => src.findIndex((s) => s.key.toLowerCase() === k.toLowerCase())); if (idx.every((i) => i >= 0) && new Set(idx).size === idx.length) order = idx; }
    out.items = (order || src.map((_, i) => i)).map((i) => clean(src[i].text));
    if (!order && ans) warn.push('Không hiểu đáp án thứ tự – đang giữ thứ tự như trong đề');
  }
  if (!out.q) warn.push('Thiếu nội dung câu hỏi');
  return { num: B.num, q: out, warn };
}

export function parseQuestions(extracted) {
  const { blocks, keys } = blockLines(extracted.lines);
  return blocks.map((B) => parseBlock(B, keys[B.num]));
}
