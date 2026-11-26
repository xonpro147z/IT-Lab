// Luyện gõ phím kiểu MonkeyType – đo WPM, độ chính xác; tiếng Anh & tiếng Việt; chú mèo gõ theo
import { applyKey, compareWord, sameWord, hasVietnamese } from './vn.js';
import { genWords, QUOTES, LESSONS, lessonWords } from './words.js';
import { play, setVolume, getVolume, SWITCHES, unlock, purr } from './sound.js';
import { Cat, CATS, shade } from './cat.js';

const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const cfg = Object.assign({ lang: 'en', punct: false, nums: false, mode: 'time', time: 30, words: 25, quote: 'short', lesson: 'home', lessonN: 25, ime: 'telex', cat: 'orange', sound: 'auto' }, store.get('thl.type.cfg', {}));
const saveCfg = () => store.set('thl.type.cfg', cfg);

// ================= Mèo + âm thanh =================
const cat = new Cat($('#catHost'));
cat.onPet = () => purr();
const catDef = () => CATS.find((c) => c.id === cfg.cat) || CATS[1];
const switchId = () => (cfg.sound === 'auto' ? catDef().sw : cfg.sound === 'off' ? null : cfg.sound);
function lum(hex) { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255; }
function applyCat() {
  const c = catDef(); cat.build(c);
  $('#catStage').style.background = c.bg;
  let acc = c.keys.acc; if (lum(acc) > 0.62) acc = shade(c.dark, lum(c.dark) > 0.5 ? -0.3 : 0); if (lum(acc) < 0.12) acc = c.eye;
  document.documentElement.style.setProperty('--accent', acc);
  document.querySelectorAll('.chip').forEach((ch) => ch.classList.toggle('on', ch.dataset.id === c.id));
  renderSoundSel();
}
function renderChips() {
  $('#chips').innerHTML = CATS.map((c) => {
    const b = c.pattern === 'calico' ? c.p1 : c.pattern === 'tortie' ? c.p1 : ['tuxedo', 'bicolor', 'points'].includes(c.pattern) ? (c.pattern === 'points' ? c.dark : c.light) : c.dark;
    const a = c.pattern === 'calico' ? c.p2 : c.body;
    return `<button class="chip" data-id="${c.id}"><span class="sw" style="background:linear-gradient(135deg, ${a} 50%, ${b} 50%)"></span>${c.name}</button>`;
  }).join('');
  $('#chips').onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; cfg.cat = b.dataset.id; saveCfg(); applyCat(); play(switchId(), 'a'); refocus(); };
}
function renderSoundSel() {
  const c = catDef();
  $('#soundSel').innerHTML = `<option value="auto">Theo màu mèo – ${SWITCHES[c.sw].name}</option>` + Object.entries(SWITCHES).map(([k, s]) => `<option value="${k}">${s.name}</option>`).join('') + '<option value="off">Tắt âm thanh</option>';
  $('#soundSel').value = cfg.sound;
  const sw = switchId();
  $('#swNote').textContent = sw ? `Keycap ${c.name} · switch ${SWITCHES[sw].name}` : 'Đang tắt âm thanh';
}
$('#soundSel').onchange = () => { cfg.sound = $('#soundSel').value; saveCfg(); renderSoundSel(); play(switchId(), 'a'); refocus(); };
$('#vol').value = getVolume();
$('#vol').oninput = () => { setVolume(+$('#vol').value); };
$('#vol').onchange = () => { play(switchId(), 'a'); refocus(); };

const KEYNAME = { ' ': '␣', Backspace: '⌫', Enter: '⏎', Shift: '⇧', Tab: '⇥', Control: 'Ctrl', Alt: 'Alt', CapsLock: '⇪', Escape: 'Esc', Meta: 'Win' };
const lastKeys = [];
function showKey(k) {
  const n = KEYNAME[k] || (k.length === 1 ? k.toUpperCase() : k.slice(0, 4));
  lastKeys.push(n); if (lastKeys.length > 3) lastKeys.shift();
  $('#lastKeys').innerHTML = lastKeys.map((x) => `<b>${x.replace(/[<&]/g, '')}</b>`).join('');
}
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  unlock();
  cat.press(e.code);
  play(switchId(), e.key === ' ' ? 'Space' : e.key);
  showKey(e.key);
  $('#capsWarn').classList.toggle('on', !!e.getModifierState && e.getModifierState('CapsLock'));
}, true);
document.addEventListener('keyup', (e) => { play(switchId(), e.key, true); });

// ================= Cấu hình =================
const AMOUNTS = { time: [15, 30, 60, 120], words: [10, 25, 50, 100], quote: [['short', 'ngắn'], ['medium', 'vừa'], ['long', 'dài'], ['all', 'tất cả']], lesson: [25, 50, 100] };
function renderConfig() {
  const set = (sel, val) => document.querySelectorAll(sel + ' button').forEach((b) => b.classList.toggle('on', b.dataset.v === String(val)));
  set('#cfgLang', cfg.lang); set('#cfgMode', cfg.mode); set('#cfgIme', cfg.ime);
  document.querySelectorAll('#cfgExtra button').forEach((b) => b.classList.toggle('on', !!cfg[b.dataset.v]));
  const am = AMOUNTS[cfg.mode];
  const cur = cfg.mode === 'time' ? cfg.time : cfg.mode === 'words' ? cfg.words : cfg.mode === 'quote' ? cfg.quote : cfg.lessonN;
  $('#cfgAmount').innerHTML = am.map((a) => { const [v, l] = Array.isArray(a) ? a : [a, a]; return `<button data-v="${v}" class="${String(v) === String(cur) ? 'on' : ''}">${l}</button>`; }).join('');
  $('#cfgExtra').style.opacity = cfg.mode === 'quote' || cfg.mode === 'lesson' ? 0.35 : 1;
  $('#cfgLang').style.opacity = cfg.mode === 'lesson' ? 0.35 : 1;
  $('#lessonSel').style.display = cfg.mode === 'lesson' ? '' : 'none';
  $('#imeBox').style.display = isVi() ? '' : 'none';
}
const isVi = () => (cfg.mode === 'lesson' ? !!(LESSONS.find((l) => l.id === cfg.lesson) || {}).vi : cfg.lang === 'vi');
$('#lessonSel').innerHTML = LESSONS.map((l) => `<option value="${l.id}">${l.name}</option>`).join('');
$('#lessonSel').value = cfg.lesson;
$('#lessonSel').onchange = () => { cfg.lesson = $('#lessonSel').value; saveCfg(); renderConfig(); newTest(); };
$('#config').onclick = (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const g = b.parentElement.id, v = b.dataset.v;
  if (g === 'cfgLang') cfg.lang = v;
  if (g === 'cfgExtra') cfg[v] = !cfg[v];
  if (g === 'cfgMode') cfg.mode = v;
  if (g === 'cfgAmount') { if (cfg.mode === 'time') cfg.time = +v; else if (cfg.mode === 'words') cfg.words = +v; else if (cfg.mode === 'quote') cfg.quote = v; else cfg.lessonN = +v; }
  saveCfg(); renderConfig(); newTest();
};
$('#cfgIme').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; cfg.ime = b.dataset.v; saveCfg(); renderConfig(); newTest(); };

// ================= Bài gõ =================
let T = null;
const words = $('#words'), input = $('#hidden'), caret = $('#caret'), wrap = $('#wordsWrap');
function makeWords() {
  if (cfg.mode === 'quote') {
    const all = QUOTES[cfg.lang];
    const pool = all.filter((q) => cfg.quote === 'all' || (cfg.quote === 'short' ? q.length < 60 : cfg.quote === 'medium' ? q.length >= 60 && q.length < 90 : q.length >= 90));
    const list = pool.length ? pool : all;
    const q = list[Math.floor(Math.random() * list.length)];
    return q.split(' ');
  }
  if (cfg.mode === 'lesson') return lessonWords(LESSONS.find((l) => l.id === cfg.lesson) || LESSONS[0], cfg.lessonN);
  return genWords(cfg.lang, cfg.mode === 'words' ? cfg.words : 80, { punct: cfg.punct, nums: cfg.nums });
}
function newTest(repeat = false) {
  clearInterval(T && T.iv);
  const list = repeat && T ? T.src.slice() : makeWords();
  T = { src: list.slice(), words: list, typed: [], cur: '', idx: 0, started: false, ended: false, t0: 0, ks: 0, ksOk: 0, raw: {}, err: {}, hist: [], vi: isVi(), builtin: isVi() && cfg.ime !== 'os', shift: 0 };
  $('#result').hidden = true; $('#test').hidden = false;
  input.value = '';
  words.style.transform = 'translateY(0)';
  words.innerHTML = T.words.map((w) => wordHTML(w)).join('');
  $('#imeWarn').textContent = '';
  updateLive(); placeCaret(); refocus();
  caret.classList.add('blink');
}
const esc = (c) => (c === '<' ? '&lt;' : c === '&' ? '&amp;' : c);
function wordHTML(target, typed = null, active = false) {
  const G = [...target];
  if (typed === null) return `<div class="word">${G.map((c) => `<i>${esc(c)}</i>`).join('')}</div>`;
  const st = compareWord(typed, target, active, T.vi);
  const Tt = [...typed.normalize('NFC')];
  let h = '';
  for (let i = 0; i < st.length; i++) {
    if (st[i] === 'extra') h += `<i class="extra">${esc(Tt[i])}</i>`;
    else h += `<i class="${st[i] === 'none' ? '' : st[i]}">${esc(G[i])}</i>`;
  }
  return h;
}
function renderWord(i) {
  const el = words.children[i]; if (!el) return;
  if (i < T.idx) { el.innerHTML = wordHTML(T.words[i], T.typed[i], false); el.classList.toggle('err', !sameWord(T.typed[i], T.words[i], T.vi)); }
  else if (i === T.idx) { el.innerHTML = wordHTML(T.words[i], T.cur, true); el.classList.remove('err'); }
  else { el.innerHTML = [...T.words[i]].map((c) => `<i>${esc(c)}</i>`).join(''); el.classList.remove('err'); }
}
function placeCaret() {
  const el = words.children[T.idx]; if (!el) return;
  const lh = parseFloat(getComputedStyle(wrap).getPropertyValue('--lh')) || 46;
  const line = Math.round(el.offsetTop / lh);
  const shift = Math.max(0, line - 1) * lh;
  if (shift !== T.shift) { T.shift = shift; words.style.transform = `translateY(${-shift}px)`; }
  const letters = el.querySelectorAll('i');
  const n = [...T.cur.normalize('NFC')].length;
  let x;
  if (n < letters.length) x = el.offsetLeft + letters[n].offsetLeft; else { const l = letters[letters.length - 1]; x = el.offsetLeft + (l ? l.offsetLeft + l.offsetWidth : 0); }
  caret.style.left = x - 1 + 'px';
  caret.style.top = el.offsetTop - shift + (lh - 34) / 2 + 'px';
}
function refocus() { if (document.activeElement !== input) input.focus({ preventScroll: true }); }
input.addEventListener('focus', () => wrap.classList.remove('blur'));
input.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== input && !$('#test').hidden) wrap.classList.add('blur'); }, 400));
wrap.addEventListener('mousedown', (e) => { e.preventDefault(); refocus(); });

const sec = () => Math.floor((performance.now() - T.t0) / 1000);
function start() {
  T.started = true; T.t0 = performance.now(); caret.classList.remove('blink');
  let lastSec = 0;
  T.iv = setInterval(() => {
    const s = sec();
    while (lastSec < s) { lastSec++; const c = calc(lastSec); T.hist.push({ s: lastSec, wpm: c.wpm, raw: (T.raw[lastSec - 1] || 0) * 12, err: T.err[lastSec - 1] || 0 }); }
    if (cfg.mode === 'time' && performance.now() - T.t0 >= cfg.time * 1000) finish();
    updateLive();
  }, 100);
}
function updateLive() {
  if (!T) return;
  const el = (performance.now() - T.t0) / 1000;
  $('#lvProgress').textContent = cfg.mode === 'time' ? (T.started ? Math.max(0, Math.ceil(cfg.time - el)) : cfg.time) : `${T.idx}/${T.words.length}`;
  if (T.started && el > 1) { const c = calc(el); $('#lvWpm').textContent = c.wpm + ' wpm'; $('#lvAcc').textContent = c.acc + '%'; }
  else { $('#lvWpm').textContent = ''; $('#lvAcc').textContent = ''; }
}

// Tính kết quả tại thời điểm elapsed (giây)
function calc(elapsed) {
  let ok = 0, bad = 0, extra = 0, miss = 0, correctChars = 0, rawChars = 0;
  for (let i = 0; i < T.idx; i++) {
    const st = compareWord(T.typed[i], T.words[i], false, T.vi);
    st.forEach((s) => { if (s === 'ok') ok++; else if (s === 'bad') bad++; else if (s === 'extra') extra++; else if (s === 'none') miss++; });
    const last = i === T.words.length - 1;
    if (sameWord(T.typed[i], T.words[i], T.vi)) correctChars += [...T.words[i]].length + (last ? 0 : 1);
    rawChars += [...T.typed[i]].length + (last ? 0 : 1);
  }
  if (!T.ended || cfg.mode === 'time') {
    const st = compareWord(T.cur, T.words[T.idx] || '', true, T.vi);
    st.forEach((s) => { if (s === 'ok') { ok++; correctChars++; } else if (s === 'bad') bad++; else if (s === 'extra') extra++; });
    rawChars += [...T.cur].length;
  }
  const min = Math.max(elapsed, 0.5) / 60;
  return { wpm: Math.round(correctChars / 5 / min), raw: Math.round(rawChars / 5 / min), acc: T.ks ? Math.round((T.ksOk / T.ks) * 100) : 100, ok, bad, extra, miss };
}

function onType(inserted) {
  if (T.ended) return;
  if (!T.started) start();
  const target = T.words[T.idx] || '';
  if (inserted) {
    T.ks++;
    const st = compareWord(T.cur, target, true, T.vi);
    const s = sec();
    T.raw[s] = (T.raw[s] || 0) + 1;
    if (st.some((x) => x === 'bad' || x === 'extra')) { T.err[s] = (T.err[s] || 0) + 1; cat.react('oops'); } else T.ksOk++;
  }
  renderWord(T.idx); placeCaret();
  if (!T.vi && hasVietnamese(T.cur)) $('#imeWarn').textContent = 'Đang bật bộ gõ tiếng Việt (Unikey/EVKey)? Hãy tắt khi gõ tiếng Anh.';
  if (cfg.mode !== 'time' && T.idx === T.words.length - 1 && sameWord(T.cur, target, T.vi) && [...T.cur].length === [...target].length) commit(true);
}
function commit(final = false) {
  const target = T.words[T.idx];
  T.typed[T.idx] = T.cur.normalize('NFC');
  if (!final) { T.ks++; const s = sec(); T.raw[s] = (T.raw[s] || 0) + 1; if (sameWord(T.cur, target, T.vi)) T.ksOk++; else { T.err[s] = (T.err[s] || 0) + 1; cat.react('oops'); } }
  T.idx++; T.cur = ''; input.value = '';
  renderWord(T.idx - 1);
  if (cfg.mode !== 'time' && T.idx >= T.words.length) return finish();
  if (cfg.mode === 'time' && T.words.length - T.idx < 40) {
    const more = genWords(cfg.lang, 40, { punct: cfg.punct, nums: cfg.nums });
    T.words.push(...more); words.insertAdjacentHTML('beforeend', more.map((w) => wordHTML(w)).join(''));
  }
  renderWord(T.idx); placeCaret(); updateLive();
}

// Bộ gõ có "chữ đang soạn" (ibus/fcitx trên Linux, bộ gõ Telex của hệ điều hành…):
// phím Space đầu tiên bị bộ gõ dùng để chốt chữ → ghi nhớ lại để tự sang từ mới, không bắt bấm 2 lần.
let pendSpace = false;
const isSpaceKey = (e) => e.key === ' ' || e.code === 'Space' || e.keyCode === 32;
input.addEventListener('compositionend', () => {
  setTimeout(() => {
    if (!pendSpace || !T || T.ended) { pendSpace = false; return; }
    pendSpace = false;
    const v = input.value.normalize('NFC').replace(/ /g, '');
    if (v.length) { T.cur = v; if (!T.started) start(); commit(); }
  }, 0);
});
input.addEventListener('keydown', (e) => {
  if (!T || T.ended) return;
  if (e.isComposing || e.keyCode === 229) { if (isSpaceKey(e)) pendSpace = true; return; }
  if (e.key === ' ') { e.preventDefault(); if (T.cur.length) { if (!T.started) start(); commit(); } return; }
  if (e.key === 'Backspace') {
    if (!T.cur.length) {
      e.preventDefault();
      if (T.idx > 0 && !sameWord(T.typed[T.idx - 1], T.words[T.idx - 1], T.vi)) { T.idx--; T.cur = T.typed[T.idx]; input.value = T.cur; renderWord(T.idx + 1); renderWord(T.idx); placeCaret(); }
      return;
    }
    if (e.ctrlKey || e.altKey) { e.preventDefault(); T.cur = ''; input.value = ''; onType(false); return; }
    if (T.builtin) { e.preventDefault(); T.cur = [...T.cur].slice(0, -1).join(''); input.value = T.cur; onType(false); }
    return;
  }
  if (e.key === 'Enter') { e.preventDefault(); return; }
  if (T.builtin && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    T.cur = applyKey(T.cur, e.key, cfg.ime); input.value = T.cur; onType(true);
  }
});
input.addEventListener('input', (e) => {
  if (!T || T.ended) { input.value = ''; return; }
  let v = input.value.normalize('NFC');
  if (v.includes(' ')) {
    // bộ gõ chốt chữ kèm dấu cách ("the ") → dấu cách vẫn là sang từ mới
    if (e.isComposing) { pendSpace = true; v = v.replace(/ /g, ''); input.value = v; T.cur = v; onType(true); return; }
    const parts = v.split(' '); const rest = parts.pop();
    for (const w of parts) { if (!w) continue; T.cur = w; if (!T.started) start(); onType(true); if (T.ended) return; commit(); if (T.ended) return; }
    pendSpace = false; T.cur = rest; input.value = rest; if (rest) onType(true); else { renderWord(T.idx); placeCaret(); }
    return;
  }
  T.cur = v; onType(!e.inputType || e.inputType.startsWith('insert'));
});

document.addEventListener('keydown', (e) => {
  const tgt = e.target;
  if (tgt && tgt !== input && (tgt.tagName === 'INPUT' || tgt.tagName === 'SELECT' || tgt.tagName === 'TEXTAREA')) { if (e.key === 'Tab' || e.key === 'Escape') { e.preventDefault(); tgt.blur(); newTest(); } return; }
  if (!$('#histModal').hidden) { if (e.key === 'Escape') $('#histModal').hidden = true; return; }
  if (e.key === 'Tab') { e.preventDefault(); newTest(); return; }
  if (e.key === 'Escape') { e.preventDefault(); newTest(); return; }
  if (!$('#result').hidden) { if (e.key === 'Enter') { e.preventDefault(); newTest(); } return; }
  if (document.activeElement !== input && (e.key.length === 1 || e.key === 'Backspace')) refocus();
});
$('#btnRestart').onclick = () => newTest();
$('#btnNext').onclick = () => newTest();
$('#btnRepeat').onclick = () => newTest(true);

// ================= Kết thúc + kết quả =================
function finish() {
  if (T.ended) return;
  const elapsed = cfg.mode === 'time' ? cfg.time : (performance.now() - T.t0) / 1000;
  clearInterval(T.iv);
  // ghi nhận giây cuối
  const s = Math.ceil(elapsed);
  while (T.hist.length < s) { const n = T.hist.length + 1; T.hist.push({ s: n, wpm: calc(Math.min(n, elapsed)).wpm, raw: (T.raw[n - 1] || 0) * 12 * (n > elapsed ? 1 / Math.max(0.2, elapsed - (n - 1)) : 1), err: T.err[n - 1] || 0 }); }
  T.ended = true;
  const c = calc(elapsed);
  const raws = T.hist.map((h) => h.raw);
  const mean = raws.reduce((a, b) => a + b, 0) / (raws.length || 1);
  const sd = Math.sqrt(raws.reduce((a, b) => a + (b - mean) ** 2, 0) / (raws.length || 1));
  const cons = mean ? Math.max(0, Math.round(100 * (1 - sd / mean))) : 0;
  const lesson = LESSONS.find((l) => l.id === cfg.lesson);
  const type = cfg.mode === 'time' ? `${cfg.time} giây` : cfg.mode === 'words' ? `${cfg.words} từ` : cfg.mode === 'quote' ? 'trích dẫn' : 'bài luyện';
  const langName = cfg.mode === 'lesson' ? lesson.name : (cfg.lang === 'vi' ? 'Tiếng Việt' + (cfg.ime === 'os' ? '' : ' · ' + cfg.ime.toUpperCase()) : 'English') + (cfg.punct ? ' · dấu câu' : '') + (cfg.nums ? ' · số' : '');
  $('#rWpm').textContent = c.wpm; $('#rAcc').textContent = c.acc + '%';
  $('#rType').innerHTML = `${type}<div class="muted" style="font-size:13px;font-weight:400">${langName}</div>`;
  $('#rRaw').textContent = c.raw;
  $('#rChars').textContent = `${c.ok}/${c.bad}/${c.extra}/${c.miss}`;
  $('#rCons').textContent = cons + '%';
  $('#rTime').textContent = Math.round(elapsed) + 's';
  $('#test').hidden = true; $('#result').hidden = false;
  drawChart();
  // lưu lịch sử + kỷ lục
  const key = cfg.mode === 'lesson' ? `lesson|${cfg.lesson}|${cfg.lessonN}` : `${cfg.lang}|${cfg.mode}|${cfg.mode === 'time' ? cfg.time : cfg.mode === 'words' ? cfg.words : cfg.quote}|${cfg.punct ? 'p' : ''}${cfg.nums ? 'n' : ''}`;
  const valid = c.acc >= 50 && elapsed >= 3 && T.idx > 0;
  const pbs = store.get('thl.type.pb', {});
  let badge = '';
  if (valid) {
    const hist = store.get('thl.type.hist', []);
    hist.unshift({ at: new Date().toISOString(), name: $('#student').value.trim(), key, type, lang: langName, wpm: c.wpm, raw: c.raw, acc: c.acc, cons, time: Math.round(elapsed) });
    store.set('thl.type.hist', hist.slice(0, 300));
    if (!pbs[key] || c.wpm > pbs[key].wpm) { if (pbs[key]) badge = `👑 Kỷ lục mới! (cũ: ${pbs[key].wpm} wpm)`; else badge = '👑 Kỷ lục đầu tiên cho kiểu bài này'; pbs[key] = { wpm: c.wpm, acc: c.acc, type, lang: langName, at: new Date().toISOString() }; store.set('thl.type.pb', pbs); }
    else badge = `Kỷ lục của em: ${pbs[key].wpm} wpm`;
    try { Progress.record('typing', key, c.wpm, Math.max(c.wpm, pbs[key].wpm)); } catch {}
  } else badge = 'Bài chưa hợp lệ (độ chính xác dưới 50% hoặc quá ngắn) – không lưu kết quả.';
  $('#rBadge').textContent = badge;
  cat.react(c.acc >= 85 ? 'happy' : 'oops');
  input.blur();
}
function drawChart() {
  const cv = $('#chart'), dpr = devicePixelRatio || 1;
  const W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
  const x = cv.getContext('2d'); x.scale(dpr, dpr); x.clearRect(0, 0, W, H);
  const h = T.hist; if (!h.length) return;
  const max = Math.max(10, ...h.map((p) => Math.max(p.wpm, p.raw))) * 1.15;
  const L = 36, R = 30, B = 24, Tp = 10;
  const px = (i) => L + (h.length === 1 ? (W - L - R) / 2 : (i / (h.length - 1)) * (W - L - R));
  const py = (v) => Tp + (1 - v / max) * (H - Tp - B);
  x.font = '11px system-ui'; x.fillStyle = '#86868b'; x.strokeStyle = 'rgba(0,0,0,.07)'; x.lineWidth = 1;
  for (let k = 0; k <= 4; k++) { const v = (max / 4) * k; x.beginPath(); x.moveTo(L, py(v)); x.lineTo(W - R, py(v)); x.stroke(); x.fillText(Math.round(v), 4, py(v) + 4); }
  h.forEach((p, i) => { if (h.length < 20 || i % Math.ceil(h.length / 12) === 0) x.fillText(p.s, px(i) - 4, H - 6); });
  const line = (key, col, w) => { x.beginPath(); h.forEach((p, i) => (i ? x.lineTo(px(i), py(p[key])) : x.moveTo(px(i), py(p[key])))); x.strokeStyle = col; x.lineWidth = w; x.lineJoin = 'round'; x.stroke(); };
  line('raw', '#c7c7cc', 2);
  line('wpm', getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#e2a33b', 3);
  x.strokeStyle = '#e24a4a'; x.lineWidth = 2;
  h.forEach((p, i) => { if (p.err) { const cx = px(i), cy = py(Math.min(max * 0.95, p.wpm)); x.beginPath(); x.moveTo(cx - 4, cy - 4); x.lineTo(cx + 4, cy + 4); x.moveTo(cx + 4, cy - 4); x.lineTo(cx - 4, cy + 4); x.stroke(); } });
  x.fillStyle = '#86868b'; x.fillText('wpm', W - R + 4, 14);
}

// ================= Lịch sử =================
$('#btnHistory').onclick = () => {
  const hist = store.get('thl.type.hist', []), pbs = store.get('thl.type.pb', {});
  $('#pbBox').innerHTML = Object.values(pbs).sort((a, b) => b.wpm - a.wpm).slice(0, 8).map((p) => `<div class="pb"><b>${p.wpm} wpm</b>${p.type} · ${escapeHtml(p.lang)} · ${p.acc}%</div>`).join('') || '<span class="muted">Chưa có kỷ lục nào.</span>';
  $('#histTbl').innerHTML = '<tr><th>Thời điểm</th><th>Học sinh</th><th>Kiểu bài</th><th>Ngôn ngữ</th><th>WPM</th><th>Raw</th><th>Chính xác</th><th>Ổn định</th></tr>' +
    hist.map((r) => `<tr><td>${new Date(r.at).toLocaleString('vi-VN')}</td><td>${escapeHtml(r.name || '—')}</td><td>${r.type}</td><td>${escapeHtml(r.lang)}</td><td><b>${r.wpm}</b></td><td>${r.raw}</td><td>${r.acc}%</td><td>${r.cons}%</td></tr>`).join('');
  $('#histModal').hidden = false;
};
$('#btnCloseHist').onclick = () => { $('#histModal').hidden = true; refocus(); };
$('#btnClearHist').onclick = () => { if (confirm('Xoá toàn bộ lịch sử và kỷ lục luyện gõ trên máy này?')) { store.set('thl.type.hist', []); store.set('thl.type.pb', {}); $('#btnHistory').onclick(); } };
$('#histModal').onclick = (e) => { if (e.target.id === 'histModal') { $('#histModal').hidden = true; refocus(); } };

// tên học sinh dùng chung với trang chủ
$('#student').value = (typeof Progress !== 'undefined' && Progress.student()) || '';
$('#student').onchange = () => { try { Progress.setStudent($('#student').value.trim()); } catch {} };
window.addEventListener('resize', () => { if (T && !T.ended) placeCaret(); else if (T && T.ended) drawChart(); });

renderChips(); applyCat(); renderConfig(); newTest();
window.__type = { T: () => T, cfg, cat, newTest, applyKey };
