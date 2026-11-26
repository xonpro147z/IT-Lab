// Bộ gõ tiếng Việt tích hợp (Telex / VNI) + so khớp chữ có dấu
// Thanh: 0 ngang, 1 huyền, 2 sắc, 3 hỏi, 4 ngã, 5 nặng
const ROWS = {
  a: 'aàáảãạ', 'ă': 'ăằắẳẵặ', 'â': 'âầấẩẫậ', e: 'eèéẻẽẹ', 'ê': 'êềếểễệ', i: 'iìíỉĩị',
  o: 'oòóỏõọ', 'ô': 'ôồốổỗộ', 'ơ': 'ơờớởỡợ', u: 'uùúủũụ', 'ư': 'ưừứửữự', y: 'yỳýỷỹỵ',
};
const DEC = new Map(); // ký tự → {v, t}
for (const [v, row] of Object.entries(ROWS)) [...row].forEach((ch, t) => DEC.set(ch, { v, t }));
const PLAIN = { 'ă': 'a', 'â': 'a', 'ê': 'e', 'ô': 'o', 'ơ': 'o', 'ư': 'u', 'đ': 'd' };
const MODDED = new Set(['ă', 'â', 'ê', 'ô', 'ơ', 'ư']);

export const plain = (v) => PLAIN[v] || v;
export function dec(ch) {
  const lo = ch.toLowerCase(), up = ch !== lo;
  const d = DEC.get(lo);
  if (d) return { v: d.v, t: d.t, up, vowel: true };
  return { v: lo, t: 0, up, vowel: false };
}
export function comp(v, t, up) {
  const ch = ROWS[v] ? ROWS[v][t] : v;
  return up ? ch.toUpperCase() : ch;
}
const isVowel = (ch) => DEC.has(ch.toLowerCase());

// Nhóm nguyên âm của âm tiết (bỏ "qu", "gi" ở đầu)
function vowelGroup(w) {
  const lo = w.toLowerCase();
  let start = 0;
  if (/^qu/.test(lo) && lo.length > 2 && isVowel(lo[2])) start = 2;
  else if (/^gi/.test(lo) && lo.length > 2 && isVowel(lo[2])) start = 2;
  let s = -1, e = -1;
  for (let i = start; i < lo.length; i++) {
    if (isVowel(lo[i])) { if (s < 0 || e < i - 1) { s = i; } e = i; }
  }
  if (s < 0 && start === 2) { s = 1; e = 1; } // "gi" đứng một mình như "gì"
  if (s < 0) return null;
  // nếu có hai cụm nguyên âm, lấy cụm sau cùng (gõ dở)
  let s2 = e; while (s2 - 1 >= start && isVowel(lo[s2 - 1])) s2--;
  return { s: s2, e, hasFinal: e < lo.length - 1 };
}
export function toneOf(w) { for (const ch of w) { const d = DEC.get(ch.toLowerCase()); if (d && d.t) return d.t; } return 0; }
export function stripTone(w) { return [...w].map((ch) => { const d = dec(ch); return d.vowel ? comp(d.v, 0, d.up) : ch; }).join(''); }

// Đặt dấu thanh theo kiểu truyền thống (hòa, khỏe, thủy)
function toneIndex(w) {
  const g = vowelGroup(w); if (!g) return -1;
  const vs = []; for (let i = g.s; i <= g.e; i++) vs.push(i);
  const lo = w.toLowerCase();
  const vv = vs.map((i) => dec(lo[i]).v);
  const oi = vv.indexOf('ơ'); if (oi >= 0) return vs[oi];
  const mi = vv.findIndex((v) => MODDED.has(v)); if (mi >= 0) return vs[mi];
  if (vs.length === 1) return vs[0];
  if (vs.length >= 3) return vs[1];
  return g.hasFinal ? vs[1] : vs[0];
}
export function placeTone(w, t = toneOf(w)) {
  const s = stripTone(w); if (!t) return s;
  const k = toneIndex(s); if (k < 0) return s;
  const arr = [...s]; const d = dec(arr[k]); arr[k] = comp(d.v, t, d.up); return arr.join('');
}
export const canon = (w) => placeTone(w.normalize('NFC'));

function setChar(w, i, v) { const arr = [...w]; const d = dec(arr[i]); arr[i] = comp(v, d.t, d.up); return arr.join(''); }
function groupIdx(w) { const g = vowelGroup(w); if (!g) return []; const r = []; for (let i = g.s; i <= g.e; i++) r.push(i); return r; }

// Áp một phím vào từ đang gõ. Trả về từ mới.
export function applyKey(word, key, method = 'telex') {
  const k = key.toLowerCase(), up = key !== k;
  const lo = word.toLowerCase();
  const gi = groupIdx(word);
  const vAt = (i) => dec(word[i]).v;
  const tone = (t) => {
    if (!gi.length) return word + key;
    const cur = toneOf(word);
    if (cur === t && t !== 0) return placeTone(word, 0) + key; // gõ lặp: bỏ dấu, giữ chữ
    if (t === 0 && cur === 0) return word + key;
    return placeTone(word, t);
  };
  if (method === 'telex') {
    const T = { s: 2, f: 1, r: 3, x: 4, j: 5, z: 0 };
    if (k in T && gi.length && !(k === 'z' && !toneOf(word))) return tone(T[k]);
    if (k === 'd') {
      const i = lo.indexOf('d'); if (i === 0) return (word[0] === 'D' ? 'Đ' : 'đ') + word.slice(1);
      const j = lo.indexOf('đ'); if (j === 0 && lo.length === 1) return (word[0] === 'Đ' ? 'D' : 'd') + key;
      return word + key;
    }
    if (k === 'a' || k === 'e' || k === 'o') {
      const circ = { a: 'â', e: 'ê', o: 'ô' }[k];
      const i = gi.find((x) => plain(vAt(x)) === k);
      if (i !== undefined) {
        if (vAt(i) === circ) return placeTone(setChar(word, i, k)) + key;
        return placeTone(setChar(word, i, circ));
      }
      return placeTone(word + key);
    }
    if (k === 'w') {
      const vs = gi.map(vAt);
      const uo = vs.findIndex((v, n) => plain(v) === 'u' && plain(vs[n + 1] || '') === 'o');
      if (uo >= 0 && !(vs[uo] === 'ư' && vs[uo + 1] === 'ơ')) return placeTone(setChar(setChar(word, gi[uo], 'ư'), gi[uo + 1], 'ơ'));
      const wMod = vs.some((v) => v === 'ă' || v === 'ơ' || v === 'ư');
      if (wMod) { // gõ lặp w: hoàn tác
        let w2 = word; gi.forEach((x) => { const v = vAt(x); if (v === 'ă' || v === 'ơ' || v === 'ư') w2 = setChar(w2, x, plain(v)); });
        return placeTone(w2) + key;
      }
      const ia = vs.findIndex((v) => plain(v) === 'a');
      const iu = vs.findIndex((v) => v === 'u');
      const io = vs.findIndex((v) => plain(v) === 'o');
      const afterO = ia > 0 && plain(vs[ia - 1]) === 'o';
      if (ia >= 0 && (afterO || /^qu/.test(lo) || (iu < 0 && io < 0))) return placeTone(setChar(word, gi[ia], 'ă'));
      if (iu >= 0) return placeTone(setChar(word, gi[iu], 'ư'));
      if (io >= 0) return placeTone(setChar(word, gi[io], 'ơ'));
      if (ia >= 0) return placeTone(setChar(word, gi[ia], 'ă'));
      return word + (up ? 'Ư' : 'ư');
    }
    return placeTone(word + key);
  }
  // VNI
  if (/[0-9]/.test(k) && gi.length) {
    const n = +k;
    if (n >= 1 && n <= 5) return tone([0, 2, 1, 3, 4, 5][n]);
    if (n === 0) return toneOf(word) ? placeTone(word, 0) : word + key;
    if (n === 6) { const i = gi.find((x) => 'aeo'.includes(plain(vAt(x)))); if (i !== undefined) { const c = { a: 'â', e: 'ê', o: 'ô' }[plain(vAt(i))]; return vAt(i) === c ? placeTone(setChar(word, i, plain(c))) + key : placeTone(setChar(word, i, c)); } }
    if (n === 7) { const vs = gi.map(vAt); const uo = vs.findIndex((v, m) => plain(v) === 'u' && plain(vs[m + 1] || '') === 'o'); if (uo >= 0) return placeTone(setChar(setChar(word, gi[uo], 'ư'), gi[uo + 1], 'ơ')); const i = gi.find((x) => 'ou'.includes(plain(vAt(x)))); if (i !== undefined) { const c = plain(vAt(i)) === 'o' ? 'ơ' : 'ư'; return vAt(i) === c ? placeTone(setChar(word, i, plain(c))) + key : placeTone(setChar(word, i, c)); } }
    if (n === 8) { const i = gi.find((x) => plain(vAt(x)) === 'a'); if (i !== undefined) return vAt(i) === 'ă' ? placeTone(setChar(word, i, 'a')) + key : placeTone(setChar(word, i, 'ă')); }
  }
  if (k === '9') { if (lo[0] === 'd') return (word[0] === 'D' ? 'Đ' : 'đ') + word.slice(1); }
  return placeTone(word + key);
}

// ----- So khớp từng ký tự giữa chữ gõ và chữ mẫu -----
// trả về mảng trạng thái cho từng vị trí: 'ok' | 'part' | 'bad' | 'extra'
export function compareWord(typed, target, active, vietnamese) {
  typed = typed.normalize('NFC'); target = target.normalize('NFC');
  const T = [...typed], G = [...target];
  const res = [];
  if (!vietnamese) {
    for (let i = 0; i < Math.max(T.length, G.length); i++) {
      if (i >= T.length) res.push('none'); else if (i >= G.length) res.push('extra'); else res.push(T[i] === G[i] ? 'ok' : 'bad');
    }
    return res;
  }
  const tT = toneOf(typed), gT = toneOf(target);
  const ts = [...stripTone(typed)], gs = [...stripTone(target)];
  const gToneAt = (() => { for (let i = 0; i < G.length; i++) if (dec(G[i]).t) return i; return -1; })();
  for (let i = 0; i < Math.max(T.length, G.length); i++) {
    if (i >= T.length) { res.push('none'); continue; }
    if (i >= G.length) { res.push('extra'); continue; }
    const a = dec(ts[i]), b = dec(gs[i]);
    let st;
    if (ts[i] === gs[i]) st = 'ok';
    else if (a.up === b.up && plain(a.v) === plain(b.v) && a.v === plain(a.v) && (b.vowel || b.v === 'đ')) st = 'part';
    else st = 'bad';
    if (st !== 'bad' && i === gToneAt && tT !== gT) st = tT === 0 ? 'part' : 'bad';
    res.push(st);
  }
  // dấu thanh gõ sai mà vị trí dấu ở mẫu chưa gõ tới / không có dấu
  if (tT && tT !== gT && (gToneAt < 0 || gToneAt >= T.length)) { for (let i = T.length - 1; i >= 0; i--) if (dec(T[i]).t) { res[i] = 'bad'; break; } }
  if (!active) for (let i = 0; i < res.length; i++) if (res[i] === 'part') res[i] = 'bad';
  return res;
}
export function sameWord(typed, target, vietnamese) {
  typed = typed.normalize('NFC'); target = target.normalize('NFC');
  if (!vietnamese) return typed === target;
  return stripTone(typed) === stripTone(target) && toneOf(typed) === toneOf(target);
}
export const hasVietnamese = (s) => /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(s);
