// Microsoft Word simulator (English UI)
buildTitlebar({ app: 'Word', letter: 'W' });
const body = $('#body'), page = $('#page');
document.execCommand('styleWithCSS', false, true);
document.execCommand('defaultParagraphSeparator', false, 'p');

const L = { margin: 'normal', orient: 'portrait', size: 'Letter', cols: 1, watermark: '', pageColor: '', pageBorder: '' };
const MARGINS = { normal: ['Normal', 'Top: 1" Bottom: 1" Left: 1" Right: 1"', [96, 96]], narrow: ['Narrow', 'Top: 0.5" Bottom: 0.5" Left: 0.5" Right: 0.5"', [48, 48]], moderate: ['Moderate', 'Top: 1" Bottom: 1" Left: 0.75" Right: 0.75"', [96, 72]], wide: ['Wide', 'Top: 1" Bottom: 1" Left: 2" Right: 2"', [96, 192]] };
const SIZES = { Letter: [816, 1056, 'Letter (8.5" x 11")'], Legal: [816, 1344, 'Legal (8.5" x 14")'], A4: [794, 1123, 'A4 (8.27" x 11.69")'], A5: [559, 794, 'A5 (5.83" x 8.27")'] };

// ===== Selection handling =====
let saved = null;
const editable = () => { const a = document.activeElement; return a && a.isContentEditable && page.contains(a) ? a : body; };
function saveSel() { const s = getSelection(); if (s.rangeCount && page.contains(s.anchorNode)) saved = s.getRangeAt(0).cloneRange(); }
function restoreSel() {
  if (!saved) { body.focus(); return; }
  const n = saved.startContainer.nodeType === 1 ? saved.startContainer : saved.startContainer.parentElement;
  const host = n && n.closest('[contenteditable=true]');
  (host || body).focus({ preventScroll: true });
  const s = getSelection(); s.removeAllRanges(); s.addRange(saved);
}
document.addEventListener('selectionchange', () => { saveSel(); updateUI(); });
function exec(cmd, val = null) { restoreSel(); document.execCommand(cmd, false, val); saveSel(); changed(); }
function selectNodes(first, last) { const r = document.createRange(); r.setStartBefore(first); r.setEndAfter(last); const s = getSelection(); s.removeAllRanges(); s.addRange(r); saved = r.cloneRange(); }
function setFontSize(pt) {
  restoreSel();
  if (getSelection().isCollapsed) { toast('Select some text first.', 'warn'); return; }
  document.execCommand('fontSize', false, '7');
  const made = [];
  $$('font[size="7"]', page).forEach((f) => { const s = document.createElement('span'); s.style.fontSize = pt + 'pt'; while (f.firstChild) s.appendChild(f.firstChild); f.replaceWith(s); made.push(s); });
  $$('span', page).forEach((s) => { if (s.style.fontSize === 'xxx-large' || s.style.fontSize === '-webkit-xxx-large') { s.style.fontSize = pt + 'pt'; made.push(s); } });
  made.forEach((s) => $$('[style]', s).forEach((c) => (c.style.fontSize = '')));
  if (made.length) selectNodes(made[0], made[made.length - 1]);
  changed();
}
function curFontPt() {
  const s = getSelection(); if (!s.rangeCount) return 11;
  let n = s.anchorNode; if (n && n.nodeType === 3) n = n.parentElement;
  if (!n || !page.contains(n)) return 11;
  return Math.round(parseFloat(getComputedStyle(n).fontSize) * 0.75 * 2) / 2;
}
function selectedBlocks() {
  if (!saved) return [];
  const root = editable();
  let blocks = $$('p,h1,h2,h3,li,blockquote,td,th,div.textbox', root).filter((b) => saved.intersectsNode(b) && !b.querySelector('p,h1,h2,h3,li,blockquote'));
  if (!blocks.length) { exec('formatBlock', 'p'); blocks = $$('p', root).filter((b) => saved && saved.intersectsNode(b)); }
  return blocks;
}

// ===== Ribbon state =====
function updateUI() {
  ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'].forEach((c) => {
    const b = $(`[data-cmd="${c}"]`); if (b) b.classList.toggle('on', document.queryCommandState(c));
  });
  const s = getSelection();
  if (s.rangeCount && page.contains(s.anchorNode)) {
    const n = s.anchorNode.nodeType === 3 ? s.anchorNode.parentElement : s.anchorNode;
    const fam = getComputedStyle(n).fontFamily.split(',')[0].replace(/["']/g, '').trim();
    const fn = $('#fontName');
    if (![...fn.options].some((o) => o.value === fam)) fn.add(new Option(fam));
    fn.value = fam;
    const pt = curFontPt(); const fs = $('#fontSize');
    if (![...fs.options].some((o) => +o.value === pt)) fs.add(new Option(pt));
    fs.value = String(pt);
    const blk = n.closest('p,h1,h2,h3,li,blockquote,td');
    if (blk) {
      const cs = getComputedStyle(blk);
      $('#indL').value = ((parseFloat(blk.style.marginLeft) || 0) / 37.8).toFixed(1).replace(/\.0$/, '');
      $('#spB').value = Math.round(parseFloat(cs.marginTop) * 0.75); $('#spA').value = Math.round(parseFloat(cs.marginBottom) * 0.75);
    }
    const inTable = !!n.closest('td,th') && body.contains(n);
    $('#tabTable').hidden = !inTable;
    if (!inTable && $('#tabTable').classList.contains('on')) $('[data-tab=home]').click();
  }
}

let changeT;
function changed() {
  clearTimeout(changeT);
  changeT = setTimeout(() => {
    const words = body.innerText.trim().split(/\s+/).filter(Boolean).length;
    $('#stWords').textContent = words + (words === 1 ? ' word' : ' words');
    const ph = SIZES[L.size][L.orient === 'portrait' ? 1 : 0];
    const pages = Math.max(1, Math.ceil(page.scrollHeight / ph)) + $$('.pagebreak', body).length;
    $('#stPage').textContent = `Page 1 of ${pages}`;
  }, 150);
}
body.addEventListener('input', changed);

// ===== Home tab =====
$$('[data-cmd]').forEach((b) => b.addEventListener('click', async () => {
  const c = b.dataset.cmd;
  if (c === 'grow' || c === 'shrink') {
    const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    const cur = curFontPt();
    setFontSize(c === 'grow' ? sizes.find((x) => x > cur) || 72 : [...sizes].reverse().find((x) => x < cur) || 8); return;
  }
  if (c === 'paste') { try { const t = await navigator.clipboard.readText(); exec('insertText', t); } catch { exec('paste'); } return; }
  exec(c);
}));
$('#fontName').addEventListener('change', (e) => exec('fontName', e.target.value));
$('#fontSize').addEventListener('change', (e) => setFontSize(+e.target.value));
let curColor = '#c00000', curHilite = '#ffff00';
const splitLeft = (btn, e, px = 26) => e.clientX < btn.getBoundingClientRect().left + px;
$('#btnColor').addEventListener('click', (e) => {
  if (splitLeft($('#btnColor'), e)) { exec('foreColor', curColor); return; }
  colorPicker($('#btnColor'), (c) => { curColor = c === 'none' ? '#000000' : c; $('#colorBar').style.background = curColor; exec('foreColor', curColor); }, { none: true, noneLabel: 'Automatic' });
});
$('#btnHilite').addEventListener('click', (e) => {
  if (splitLeft($('#btnHilite'), e)) { exec('hiliteColor', curHilite); return; }
  colorPicker($('#btnHilite'), (c) => { curHilite = c === 'none' ? 'transparent' : c; $('#hiliteBar').style.background = curHilite; exec('hiliteColor', curHilite); }, { none: true });
});
$('#btnShading').addEventListener('click', () => colorPicker($('#btnShading'), (c) => { selectedBlocks().forEach((b) => (b.style.backgroundColor = c === 'none' ? '' : c)); changed(); }, { none: true }));
$('#btnCase').addEventListener('click', () => dropdown($('#btnCase'), `<div class="it" data-v="sentence">Sentence case.</div><div class="it" data-v="lower">lowercase</div><div class="it" data-v="upper">UPPERCASE</div><div class="it" data-v="title">Capitalize Each Word</div><div class="it" data-v="toggle">tOGGLE cASE</div>`, (v) => {
  restoreSel(); const t = getSelection().toString(); if (!t) return toast('Select some text first.', 'warn');
  const out = v === 'lower' ? t.toLowerCase() : v === 'upper' ? t.toUpperCase() : v === 'title' ? t.toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase())
    : v === 'toggle' ? [...t].map((ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())).join('') : t.toLowerCase().replace(/(^\s*|[.!?]\s+)(\S)/g, (m, a, b) => a + b.toUpperCase());
  exec('insertText', out);
}));
function listStyle(tag, style) {
  restoreSel();
  let n = getSelection().anchorNode; n = n && (n.nodeType === 3 ? n.parentElement : n);
  let lst = n && n.closest(tag);
  if (!lst) { exec(tag === 'ul' ? 'insertUnorderedList' : 'insertOrderedList'); n = getSelection().anchorNode; n = n.nodeType === 3 ? n.parentElement : n; lst = n.closest(tag); }
  if (lst) lst.style.listStyleType = style; changed();
}
$('#btnBullets').addEventListener('click', (e) => {
  if (splitLeft($('#btnBullets'), e)) { exec('insertUnorderedList'); return; }
  dropdown($('#btnBullets'), `<div class="hd">Bullet Library</div><div class="it" data-v="disc">● Filled circle</div><div class="it" data-v="circle">○ Hollow circle</div><div class="it" data-v="square">■ Square</div><div class="it" data-v="'✓  '">✓ Check mark</div><div class="it" data-v="'➢  '">➢ Arrow</div><div class="sep"></div><div class="it" data-v="off">None</div>`, (v) => {
    if (v === 'off') { restoreSel(); const n = getSelection().anchorNode; if (n && (n.nodeType === 3 ? n.parentElement : n).closest('ul')) exec('insertUnorderedList'); return; }
    listStyle('ul', v);
  });
});
$('#btnNumbers').addEventListener('click', (e) => {
  if (splitLeft($('#btnNumbers'), e)) { exec('insertOrderedList'); return; }
  dropdown($('#btnNumbers'), `<div class="hd">Numbering Library</div><div class="it" data-v="decimal">1. 2. 3.</div><div class="it" data-v="lower-alpha">a. b. c.</div><div class="it" data-v="upper-alpha">A. B. C.</div><div class="it" data-v="upper-roman">I. II. III.</div><div class="it" data-v="lower-roman">i. ii. iii.</div>`, (v) => listStyle('ol', v));
});
$('#btnSpacing').addEventListener('click', () => dropdown($('#btnSpacing'), `${['1.0', '1.15', '1.5', '2.0', '2.5', '3.0'].map((x) => `<div class="it" data-v="${x}">${x}</div>`).join('')}<div class="sep"></div><div class="it" data-v="addB">Add Space Before Paragraph</div><div class="it" data-v="addA">Add Space After Paragraph</div><div class="it" data-v="rmA">Remove Space After Paragraph</div>`, (v) => {
  selectedBlocks().forEach((b) => {
    if (v === 'addB') b.style.marginTop = '12pt'; else if (v === 'addA') b.style.marginBottom = '12pt'; else if (v === 'rmA') b.style.marginBottom = '0';
    else b.style.lineHeight = v;
  });
  changed();
}));
$$('[data-block]').forEach((b) => b.addEventListener('click', () => {
  const v = b.dataset.block;
  exec('formatBlock', v === 'title' ? 'p' : v);
  selectedBlocks().forEach((bl) => bl.classList.toggle('title', v === 'title'));
  changed();
}));

// Format Painter
let painter = null;
$('#btnPainter').addEventListener('click', () => {
  restoreSel(); let n = getSelection().anchorNode; if (!n) return;
  n = n.nodeType === 3 ? n.parentElement : n;
  const cs = getComputedStyle(n);
  let u = false; for (let e = n; e && e !== body; e = e.parentElement) if (getComputedStyle(e).textDecorationLine.includes('underline')) u = true;
  painter = { b: parseInt(cs.fontWeight) >= 600, i: cs.fontStyle === 'italic', u, color: cs.color, size: parseFloat(cs.fontSize) * 0.75, fam: cs.fontFamily.split(',')[0].replace(/"/g, '') };
  $('#btnPainter').classList.add('on'); body.style.cursor = 'copy';
});
body.addEventListener('mouseup', () => {
  if (!painter) return;
  setTimeout(() => {
    if (getSelection().isCollapsed) return;
    const p = painter; painter = null; $('#btnPainter').classList.remove('on'); body.style.cursor = '';
    saveSel();
    if (document.queryCommandState('bold') !== p.b) exec('bold');
    if (document.queryCommandState('italic') !== p.i) exec('italic');
    if (document.queryCommandState('underline') !== p.u) exec('underline');
    exec('foreColor', p.color); exec('fontName', p.fam); setFontSize(p.size);
  }, 10);
});

// Find / Replace
function textNodes(root) { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const a = []; let n; while ((n = tw.nextNode())) a.push(n); return a; }
$('#btnFind').addEventListener('click', async () => {
  const r = await modal('<h3>Navigation – Find</h3><input class="rs" style="width:100%;height:30px" placeholder="Search document">', [['Close'], ['Find Next', 'primary']]);
  if (r.i !== 1 || !r.v[0]) return;
  const count = body.innerText.toLowerCase().split(r.v[0].toLowerCase()).length - 1;
  body.focus(); getSelection().collapse(body, 0);
  window.find(r.v[0], false, false, false, false, false, false);
  toast(count ? `${count} result${count > 1 ? 's' : ''}` : 'We couldn\'t find what you were looking for.', count ? 'ok' : 'warn');
});
$('#btnReplace').addEventListener('click', async () => {
  const r = await modal('<h3>Find and Replace</h3><p>Find what:</p><input class="rs" style="width:100%;height:30px"><p>Replace with:</p><input class="rs" style="width:100%;height:30px"><p><label><input type="checkbox"> Match case</label></p>', [['Cancel'], ['Replace All', 'primary']]);
  if (r.i !== 1 || !r.v[0]) return;
  const re = new RegExp(r.v[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g' + (r.v[2] === true ? '' : 'i'));
  let n = 0;
  textNodes(page).forEach((t) => { const nv = t.data.replace(re, () => { n++; return r.v[1]; }); if (nv !== t.data) t.data = nv; });
  changed();
  modal(`<h3>Microsoft Word</h3><p>All done. We made <b>${n}</b> replacement${n === 1 ? '' : 's'}.</p>`, [['OK', 'primary']]);
});

// ===== Insert tab =====
function insertHTML(html) { restoreSel(); document.execCommand('insertHTML', false, html); saveSel(); changed(); }
const PAGEBREAK = '<div class="pagebreak" contenteditable="false"></div><p><br></p>';
$('#btnPageBreak').addEventListener('click', () => insertHTML(PAGEBREAK));
$('#btnTable').addEventListener('click', () => {
  const d = dropdown($('#btnTable'), `<div class="hd" id="tgLbl">Insert Table</div><div class="tablegrid">${Array.from({ length: 80 }, (_, i) => `<span data-v="${(i % 10) + 1}x${Math.floor(i / 10) + 1}"></span>`).join('')}</div><div class="sep"></div><div class="it" data-v="custom"><span data-i="table"></span> Insert Table...</div>`, async (v) => {
    let c, rr;
    if (v === 'custom') { const r = await modal('<h3>Insert Table</h3><p>Number of columns: <input class="rs" type="number" value="5" min="1" max="20"></p><p>Number of rows: <input class="rs" type="number" value="2" min="1" max="100"></p>', [['Cancel'], ['OK', 'primary']]); if (r.i !== 1) return; [c, rr] = r.v.map(Number); }
    else [c, rr] = v.split('x').map(Number);
    insertHTML(`<table>${Array.from({ length: rr }, () => `<tr>${Array.from({ length: c }, () => '<td><br></td>').join('')}</tr>`).join('')}</table><p><br></p>`);
  });
  d.querySelectorAll('.tablegrid span').forEach((s) => s.addEventListener('mouseenter', () => {
    const [c, r] = s.dataset.v.split('x').map(Number);
    d.querySelectorAll('.tablegrid span').forEach((x) => { const [cc, rr] = x.dataset.v.split('x').map(Number); x.classList.toggle('on', cc <= c && rr <= r); });
    d.querySelector('#tgLbl').textContent = `${c}x${r} Table`;
  }));
});
$('#btnPicture').addEventListener('click', () => dropdown($('#btnPicture'), `<div class="it" data-v="file"><span data-i="picture"></span> This Device...</div><div class="sep"></div><div class="hd">Stock Images</div>${SAMPLE_IMAGES.map((im, i) => `<div class="it" data-v="${i}"><img src="${im.url}" style="width:48px;height:32px;border:1px solid #ddd"> ${im.name}</div>`).join('')}`, async (v) => {
  const url = v === 'file' ? await pickImage() : SAMPLE_IMAGES[+v].url;
  if (url) insertHTML(`<img src="${url}" style="width:50%">`);
}));
const SHAPES = {
  rect: ['Rectangle', '<rect x="4" y="4" width="152" height="92" fill="#4472c4" stroke="#2f528f" stroke-width="3"/>'],
  round: ['Rectangle: Rounded Corners', '<rect x="4" y="4" width="152" height="92" rx="20" fill="#4472c4" stroke="#2f528f" stroke-width="3"/>'],
  ellipse: ['Oval', '<ellipse cx="80" cy="50" rx="76" ry="46" fill="#4472c4" stroke="#2f528f" stroke-width="3"/>'],
  star: ['Star: 5 Points', '<polygon points="80,4 98,38 136,40 106,64 116,96 80,78 44,96 54,64 24,40 62,38" fill="#4472c4" stroke="#2f528f" stroke-width="3"/>'],
  arrow: ['Arrow: Right', '<polygon points="4,34 100,34 100,8 156,50 100,92 100,66 4,66" fill="#4472c4" stroke="#2f528f" stroke-width="3"/>'],
  heart: ['Heart', '<path d="M80 92 C10 50 20 4 56 10 C70 12 78 24 80 30 C82 24 90 12 104 10 C140 4 150 50 80 92Z" fill="#4472c4" stroke="#2f528f" stroke-width="3"/>'],
};
$('#btnShape').addEventListener('click', () => dropdown($('#btnShape'), '<div class="hd">Basic Shapes</div>' + Object.entries(SHAPES).map(([k, [n, s]]) => `<div class="it" data-v="${k}"><svg width="40" height="26" viewBox="0 0 160 100">${s}</svg> ${n}</div>`).join(''), (v) => insertHTML(`<span class="shape" contenteditable="false" data-shape="${v}"><svg width="160" height="100" viewBox="0 0 160 100">${SHAPES[v][1]}</svg></span>&nbsp;`)));
async function insertLink() {
  restoreSel(); const sel = getSelection().toString();
  const r = await modal(`<h3>Insert Hyperlink</h3><p>Text to display:</p><input class="rs" style="width:100%;height:30px" value="${escapeHtml(sel)}"><p>Address:</p><input class="rs" style="width:100%;height:30px" placeholder="https://">`, [['Cancel'], ['OK', 'primary']]);
  if (r.i !== 1 || !r.v[1]) return;
  const url = /^https?:|^mailto:/.test(r.v[1]) ? r.v[1] : 'https://' + r.v[1];
  if (sel && r.v[0] === sel) exec('createLink', url); else insertHTML(`<a href="${escapeHtml(url)}">${escapeHtml(r.v[0] || url)}</a>`);
}
$('#btnLink').addEventListener('click', insertLink);
body.addEventListener('click', (e) => { const a = e.target.closest('a'); if (a && (e.ctrlKey || e.metaKey)) window.open(a.href); });
const HF = '<div class="hd">Built-in</div><div class="it" data-v="blank">Blank</div><div class="it" data-v="three">Blank (Three Columns)</div><div class="sep"></div><div class="it" data-v="edit">Edit</div><div class="it" data-v="remove">Remove</div>';
function headerFooter(id, v) {
  const el = $('#' + id);
  if (v === 'remove') { el.innerHTML = ''; el.hidden = true; return; }
  el.hidden = false;
  if (v === 'three' && !el.textContent.trim()) el.innerHTML = '<div style="display:flex;justify-content:space-between"><span>[Type here]</span><span>[Type here]</span><span>[Type here]</span></div>';
  el.focus();
}
$('#btnHeader').addEventListener('click', () => dropdown($('#btnHeader'), HF, (v) => headerFooter('hdr', v)));
$('#btnFooter').addEventListener('click', () => dropdown($('#btnFooter'), HF, (v) => headerFooter('ftr', v)));
$('#btnPageNum').addEventListener('click', () => dropdown($('#btnPageNum'), '<div class="it" data-v="top">Top of Page</div><div class="it" data-v="bottom">Bottom of Page</div><div class="sep"></div><div class="it" data-v="remove">Remove Page Numbers</div>', (v) => {
  $$('.pgnum', page).forEach((x) => x.remove());
  if (v === 'remove') return;
  const el = $(v === 'top' ? '#hdr' : '#ftr'); el.hidden = false;
  el.insertAdjacentHTML('beforeend', '<div class="pgnum" style="text-align:center" contenteditable="false">1</div>');
}));
$('#btnDate').addEventListener('click', () => dropdown($('#btnDate'), (() => { const d = new Date(); const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; const opts = [`${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`, `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`, d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })]; return '<div class="hd">Available formats</div>' + opts.map((o) => `<div class="it" data-v="${o}">${o}</div>`).join(''); })(), (v) => exec('insertText', v)));
$('#btnTextbox').addEventListener('click', () => insertHTML('<div class="textbox">Type your text here</div><p><br></p>'));
$('#btnWordArt').addEventListener('click', () => insertHTML('<p class="wordart">Your text here</p><p><br></p>'));
const SYMBOLS = '© ® ™ ° ± × ÷ ≠ ≤ ≥ ∞ √ π Ω α β γ Δ € £ ¥ $ § ¶ • … ← → ↑ ↓ ↔ ⇒ ☺ ☎ ✉ ✓ ✗ ★ ☆ ♥ ♦ ♣ ♠ ♪'.split(' ');
$('#btnSymbol').addEventListener('click', () => dropdown($('#btnSymbol'), `<div class="swatches" style="grid-template-columns:repeat(8,26px)">${SYMBOLS.map((s) => `<span data-v="${s}" title="${s}" style="width:26px;height:26px;display:grid;place-items:center;font-size:16px">${s}</span>`).join('')}</div>`, (v) => exec('insertText', v)));
$('#btnEquation').addEventListener('click', async () => {
  const r = await modal('<h3>Insert New Equation</h3><p>Type an equation (use ^ for exponents and sqrt() for square roots):</p><input class="rs" style="width:100%;height:30px" value="a^2 + b^2 = c^2">', [['Cancel'], ['Insert', 'primary']]);
  if (r.i !== 1 || !r.v[0]) return;
  const h = escapeHtml(r.v[0]).replace(/\^(\w+)/g, '<sup>$1</sup>').replace(/sqrt\(([^)]*)\)/g, '√<span style="text-decoration:overline">$1</span>');
  insertHTML(`<span style="font-family:Cambria Math,Cambria,serif;font-style:italic">${h}</span>&nbsp;`);
});

// ===== Design tab =====
$('#btnWatermark').addEventListener('click', () => dropdown($('#btnWatermark'), '<div class="hd">Confidential</div>' + ['CONFIDENTIAL', 'DO NOT COPY'].map((w) => `<div class="it" data-v="${w}">${w}</div>`).join('') + '<div class="hd">Disclaimers</div>' + ['DRAFT', 'SAMPLE'].map((w) => `<div class="it" data-v="${w}">${w}</div>`).join('') + '<div class="hd">Urgent</div><div class="it" data-v="URGENT">URGENT</div><div class="sep"></div><div class="it" data-v="custom">Custom Watermark...</div><div class="it" data-v="">Remove Watermark</div>', async (v) => {
  if (v === 'custom') { const r = await modal('<h3>Printed Watermark</h3><p>Text:</p><input class="rs" style="width:100%;height:30px">', [['Cancel'], ['OK', 'primary']]); if (r.i !== 1) return; v = r.v[0]; }
  L.watermark = v; applyLayout();
}));
$('#btnPageColor').addEventListener('click', () => colorPicker($('#btnPageColor'), (c) => { L.pageColor = c === 'none' ? '' : c; applyLayout(); }, { none: true }));
$('#btnPageBorder').addEventListener('click', () => dropdown($('#btnPageBorder'), `<div class="hd">Borders and Shading – Page Border</div><div class="it" data-v="">None</div><div class="it" data-v="3px solid #000">Box – single line</div><div class="it" data-v="6px double #000">Box – double line</div><div class="it" data-v="3px dashed #2f5496">Box – dashed blue</div><div class="it" data-v="8px ridge #c00000">3-D – red</div>`, (v) => { L.pageBorder = v; applyLayout(); }));

// ===== Layout tab =====
function applyLayout() {
  const [w, h] = SIZES[L.size];
  const land = L.orient === 'landscape';
  const W = land ? h : w;
  page.style.width = W + 'px'; page.style.minHeight = (land ? w : h) + 'px';
  page.classList.toggle('landscape', land);
  const [tb, lr] = MARGINS[L.margin][2];
  page.style.padding = `${tb}px ${lr}px`;
  $('#hdr').style.left = $('#ftr').style.left = $('#hdr').style.right = $('#ftr').style.right = lr + 'px';
  page.classList.remove('cols2', 'cols3'); if (L.cols > 1) page.classList.add('cols' + L.cols);
  page.style.background = L.pageColor || '#fff';
  page.style.outline = L.pageBorder || ''; page.style.outlineOffset = L.pageBorder ? '-40px' : '';
  const wm = $('#watermark'); wm.hidden = !L.watermark; wm.textContent = L.watermark;
  drawRuler(); changed();
}
function drawRuler() {
  const ri = $('#rulerInner'); const z = parseFloat(page.style.zoom || 1);
  const W = page.offsetWidth * z; const [, lr] = MARGINS[L.margin][2];
  const left = page.getBoundingClientRect().left - $('#ruler').getBoundingClientRect().left;
  ri.style.left = left + 'px'; ri.style.width = W + 'px';
  let h = `<div class="mg" style="left:0;width:${lr * z}px"></div><div class="mg" style="right:0;width:${lr * z}px"></div>`;
  for (let i = 0; i * 12 * z <= W - lr * z; i++) {
    const x = lr * z + i * 12 * z; const inch = i % 8 === 0;
    h += inch && i ? `<span class="nb" style="left:${x}px">${i / 8}</span>` : `<div class="tk" style="left:${x}px;height:${i % 4 === 0 ? 6 : 3}px"></div>`;
  }
  ri.innerHTML = h;
}
addEventListener('resize', drawRuler);
$('#canvas').addEventListener('scroll', drawRuler);
$('#btnMargins').addEventListener('click', () => dropdown($('#btnMargins'), Object.entries(MARGINS).map(([k, [n, d]]) => `<div class="it" data-v="${k}"><span data-i="margins" data-sz="22"></span><div><b>${n}</b><div style="font-size:11px;color:#666">${d}</div></div></div>`).join(''), (v) => { L.margin = v; applyLayout(); }));
$('#btnOrient').addEventListener('click', () => dropdown($('#btnOrient'), '<div class="it" data-v="portrait">▯ Portrait</div><div class="it" data-v="landscape">▭ Landscape</div>', (v) => { L.orient = v; applyLayout(); }));
$('#btnSize').addEventListener('click', () => dropdown($('#btnSize'), Object.entries(SIZES).map(([k, v]) => `<div class="it" data-v="${k}"><div><b>${k}</b><div style="font-size:11px;color:#666">${v[2]}</div></div></div>`).join(''), (v) => { L.size = v; applyLayout(); }));
$('#btnColumns').addEventListener('click', () => dropdown($('#btnColumns'), '<div class="it" data-v="1">▯ One</div><div class="it" data-v="2">▥ Two</div><div class="it" data-v="3">▥▯ Three</div>', (v) => { L.cols = +v; applyLayout(); }));
$('#btnBreaks').addEventListener('click', () => dropdown($('#btnBreaks'), '<div class="hd">Page Breaks</div><div class="it" data-v="page"><b>Page</b>&nbsp;– Mark the point at which one page ends</div><div class="it" data-v="col"><b>Column</b>&nbsp;– Text after the break begins in the next column</div>', (v) => insertHTML(v === 'page' ? PAGEBREAK : '<div style="break-after:column"></div><p><br></p>')));
$('#indL').addEventListener('change', (e) => { selectedBlocks().forEach((b) => (b.style.marginLeft = +e.target.value * 37.8 + 'px')); changed(); });
$('#spB').addEventListener('change', (e) => { selectedBlocks().forEach((b) => (b.style.marginTop = e.target.value + 'pt')); changed(); });
$('#spA').addEventListener('change', (e) => { selectedBlocks().forEach((b) => (b.style.marginBottom = e.target.value + 'pt')); changed(); });

// ===== References tab =====
function buildTOC() {
  const hs = $$('h1,h2,h3', body).filter((h) => !h.closest('.toc') && h.textContent.trim());
  return `<div class="toc" contenteditable="false"><div class="toch">Contents</div>${hs.map((h, i) => `<div class="tl l${h.tagName[1]}"><span>${escapeHtml(h.textContent.trim())}</span><span></span><span>${1 + Math.floor(i / 12)}</span></div>`).join('') || '<div>No table of contents entries found.</div>'}</div>`;
}
$('#btnTOC').addEventListener('click', () => dropdown($('#btnTOC'), '<div class="hd">Built-In</div><div class="it" data-v="auto"><b>Automatic Table 1</b></div><div class="sep"></div><div class="it" data-v="remove">Remove Table of Contents</div>', (v) => {
  if (v === 'remove') { $$('.toc', body).forEach((t) => t.remove()); changed(); return; }
  const ex = $('.toc', body); if (ex) { ex.outerHTML = buildTOC(); changed(); return; }
  insertHTML(buildTOC() + '<p><br></p>');
}));
$('#btnUpdateTOC').addEventListener('click', () => { const ex = $('.toc', body); if (!ex) return toast('There is no table of contents in this document.', 'warn'); ex.outerHTML = buildTOC(); changed(); });
$('#btnFootnote').addEventListener('click', async () => {
  const r = await modal('<h3>Insert Footnote</h3><p>Footnote text:</p><input class="rs" style="width:100%;height:30px">', [['Cancel'], ['Insert', 'primary']]);
  if (r.i !== 1 || !r.v[0]) return;
  let fn = $('.footnotes', body);
  const n = (fn ? fn.children.length : 0) + 1;
  restoreSel(); const rg = getSelection().getRangeAt(0); rg.collapse(false);
  const sup = document.createElement('sup'); sup.className = 'fnref'; sup.textContent = n; rg.insertNode(sup);
  rg.setStartAfter(sup); rg.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(rg); saveSel();
  if (!fn) { body.insertAdjacentHTML('beforeend', '<div class="footnotes" contenteditable="false"></div>'); fn = $('.footnotes', body); }
  fn.insertAdjacentHTML('beforeend', `<div><sup>${n}</sup> ${escapeHtml(r.v[0])}</div>`);
  changed();
});

// ===== Review / View tabs =====
$('#btnWordCount').addEventListener('click', () => {
  const t = body.innerText;
  modal(`<h3>Word Count</h3><table style="width:100%;font-size:13px"><tr><td>Statistics:</td><td></td></tr><tr><td>Pages</td><td align="right">${$('#stPage').textContent.split(' of ')[1]}</td></tr><tr><td>Words</td><td align="right"><b>${t.trim().split(/\s+/).filter(Boolean).length}</b></td></tr><tr><td>Characters (no spaces)</td><td align="right">${t.replace(/\s/g, '').length}</td></tr><tr><td>Characters (with spaces)</td><td align="right">${t.replace(/\n/g, '').length}</td></tr><tr><td>Paragraphs</td><td align="right">${$$('p,h1,h2,h3,li,blockquote', body).filter((p) => p.innerText.trim()).length}</td></tr></table>`);
});
async function newComment() {
  restoreSel(); if (getSelection().isCollapsed) return toast('Select the text you want to comment on.', 'warn');
  const r = await modal('<h3>New Comment</h3><input class="rs" style="width:100%;height:30px" placeholder="Start a conversation">', [['Cancel'], ['Post', 'primary']]);
  if (r.i !== 1 || !r.v[0]) return;
  restoreSel(); const rg = getSelection().getRangeAt(0); const sp = document.createElement('span'); sp.className = 'comment'; sp.title = r.v[0];
  try { rg.surroundContents(sp); } catch { sp.appendChild(rg.extractContents()); rg.insertNode(sp); }
  changed();
}
$('#btnComment').addEventListener('click', newComment); $('#btnComment2').addEventListener('click', newComment);
$('#btnDelComments').addEventListener('click', () => { $$('.comment', body).forEach((c) => c.replaceWith(...c.childNodes)); changed(); });
function setZoom(z) { page.style.zoom = z; $('#zoom').value = Math.round(z * 100); $('#zoomPct').textContent = Math.round(z * 100) + '%'; drawRuler(); }
$('#zoom').addEventListener('input', (e) => setZoom(e.target.value / 100));
$$('[data-zoom]').forEach((b) => b.addEventListener('click', () => setZoom(b.dataset.zoom === 'fit' ? Math.min(2, ($('#canvas').clientWidth - 40) / page.offsetWidth) : 1)));
$('#btnPrint').addEventListener('click', () => window.print());
$('#btnRuler').addEventListener('click', () => { $('#ruler').classList.toggle('off'); $('#btnRuler').classList.toggle('on'); drawRuler(); });

// ===== Table Layout =====
function curCell() { const s = getSelection(); let n = s.anchorNode; if (!n) return null; n = n.nodeType === 3 ? n.parentElement : n; return n.closest('td,th'); }
function tableAction(a) {
  restoreSel();
  const cell = curCell(); if (!cell) return toast('Place the cursor in a table cell.', 'warn');
  const tr = cell.parentElement, table = cell.closest('table'), ci = cell.cellIndex;
  const mk = () => { const td = document.createElement('td'); td.innerHTML = '<br>'; return td; };
  switch (a) {
    case 'rowAbove': case 'rowBelow': { const nr = document.createElement('tr'); for (let i = 0; i < tr.cells.length; i++) nr.appendChild(mk()); tr.parentElement.insertBefore(nr, a === 'rowAbove' ? tr : tr.nextSibling); break; }
    case 'colLeft': case 'colRight': [...table.rows].forEach((r) => { const ref = r.cells[ci]; r.insertBefore(mk(), a === 'colLeft' ? ref : ref ? ref.nextSibling : null); }); break;
    case 'delRow': if (table.rows.length > 1) tr.remove(); else table.remove(); break;
    case 'delCol': if (tr.cells.length > 1) [...table.rows].forEach((r) => r.cells[ci] && r.cells[ci].remove()); else table.remove(); break;
    case 'delTable': table.remove(); $('#tabTable').hidden = true; $('[data-tab=home]').click(); break;
    case 'header': [...table.rows[0].cells].forEach((c) => { c.style.fontWeight = c.style.fontWeight === 'bold' ? '' : 'bold'; c.style.backgroundColor = c.style.backgroundColor ? '' : '#d9e2f3'; }); break;
    case 'noborder': table.classList.toggle('noborder'); break;
  }
  changed();
}
$$('[data-tbl]').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.tbl === 'delMenu') return dropdown(b, '<div class="it" data-v="delCol">Delete Columns</div><div class="it" data-v="delRow">Delete Rows</div><div class="it" data-v="delTable">Delete Table</div>', tableAction);
  tableAction(b.dataset.tbl);
}));
$('#btnCellShade').addEventListener('click', () => colorPicker($('#btnCellShade'), (c) => {
  restoreSel();
  const cells = $$('td,th', body).filter((td) => saved && saved.intersectsNode(td));
  (cells.length ? cells : [curCell()].filter(Boolean)).forEach((td) => (td.style.backgroundColor = c === 'none' ? '' : c));
  changed();
}, { none: true }));

// ===== Picture Format =====
let selImg = null;
body.addEventListener('click', (e) => {
  $$('img.sel', body).forEach((i) => i.classList.remove('sel'));
  if (e.target.tagName === 'IMG') { selImg = e.target; selImg.classList.add('sel'); $('#tabPicture').hidden = false; $('#tabPicture').click(); $('#imgWidth').value = selImg.style.width || ''; }
  else { selImg = null; if ($('#tabPicture').classList.contains('on')) $('[data-tab=home]').click(); $('#tabPicture').hidden = true; }
});
$('#imgWidth').addEventListener('change', (e) => { if (selImg && e.target.value) { selImg.style.width = e.target.value; selImg.style.height = 'auto'; changed(); } });
$$('[data-wrap]').forEach((b) => b.addEventListener('click', () => {
  if (!selImg) return; const w = b.dataset.wrap;
  selImg.style.float = w === 'center' ? '' : w; selImg.style.display = w === 'center' ? 'block' : ''; selImg.style.margin = w === 'center' ? '6px auto' : w === 'left' ? '4px 12px 4px 0' : '4px 0 4px 12px';
  changed();
}));
$$('[data-imgfx]').forEach((b) => b.addEventListener('click', () => {
  if (!selImg) return; const f = b.dataset.imgfx;
  if (f === 'border') selImg.style.border = selImg.style.border ? '' : '3px solid #222';
  if (f === 'shadow') selImg.style.boxShadow = selImg.style.boxShadow ? '' : '6px 6px 12px rgba(0,0,0,.45)';
  if (f === 'round') selImg.style.borderRadius = selImg.style.borderRadius ? '' : '18px';
  if (f === 'del') { selImg.remove(); selImg = null; $('#tabPicture').hidden = true; $('[data-tab=home]').click(); }
  changed();
}));

// ===== Keyboard shortcuts =====
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  const map = { l: 'justifyLeft', e: 'justifyCenter', r: 'justifyRight', j: 'justifyFull' };
  if (map[k]) { e.preventDefault(); exec(map[k]); }
  if (k === 's') { e.preventDefault(); saveDoc(); }
  if (k === 'h') { e.preventDefault(); $('#btnReplace').click(); }
  if (k === 'f') { e.preventDefault(); $('#btnFind').click(); }
  if (k === 'k') { e.preventDefault(); insertLink(); }
  if (k === 'enter') { e.preventDefault(); insertHTML(PAGEBREAK); }
  if (k === ']') { e.preventDefault(); $('[data-cmd=grow]').click(); }
  if (k === '[') { e.preventDefault(); $('[data-cmd=shrink]').click(); }
});
$('#qaUndo').onclick = () => exec('undo');
$('#qaRedo').onclick = () => exec('redo');
$('#qaSave').onclick = () => saveDoc();

// ===== File =====
let docName = 'Document1';
function setDocName(n) { docName = n; setDocTitle(n, 'Word'); }
function getDoc() { return { html: body.innerHTML, hdr: $('#hdr').innerHTML, ftr: $('#ftr').innerHTML, L }; }
function setDoc(d) {
  body.innerHTML = d.html || '<p><br></p>';
  $('#hdr').innerHTML = d.hdr || ''; $('#hdr').hidden = !d.hdr;
  $('#ftr').innerHTML = d.ftr || ''; $('#ftr').hidden = !d.ftr;
  Object.assign(L, { margin: 'normal', orient: 'portrait', size: 'Letter', cols: 1, watermark: '', pageColor: '', pageBorder: '' }, d.L || {});
  applyLayout(); changed();
}
const saveDoc = () => saveJSON(docName, 'thw', getDoc());
function exportDoc() {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${escapeHtml(docName)}</title><style>body{font-family:Calibri;font-size:11pt}table{border-collapse:collapse}td,th{border:1px solid #000;padding:3px 6px}@page{size:${L.orient === 'landscape' ? 'landscape' : 'portrait'}}</style></head><body>${$('#hdr').innerHTML ? '<div>' + $('#hdr').innerHTML + '</div><hr>' : ''}${body.innerHTML.replace(/<div class="pagebreak"[^>]*><\/div>/g, '<br style="page-break-before:always">')}${$('#ftr').innerHTML ? '<hr><div>' + $('#ftr').innerHTML + '</div>' : ''}</body></html>`;
  exportText(docName, 'doc', 'Word 97-2003 Document', html);
}
const runner = new TaskRunner({ app: 'word', exercises: WORD_EXERCISES(), load: (ex) => { setDoc(ex ? { html: ex.start, L: ex.layout } : {}); setDocName(ex ? ex.title : 'Document1'); body.focus(); getSelection().collapse(body, 0); }, api: null });
function fileMenu(start = 0) {
  backstage([
    { label: 'Practice', render: (b, close) => runner.renderPicker(b, close) },
    { label: 'New', action: () => runner.free() },
    { label: 'Open', action: async () => { const d = await openJSON('thw'); if (d) { runner.free(); setDoc(d); } } },
    { label: 'Save', action: saveDoc },
    { label: 'Export (.doc)', action: exportDoc },
    { label: 'Print', action: () => window.print() },
  ], start);
}
runner.onList = () => fileMenu(0);
initRibbon(() => fileMenu(1));
$('#btnEx').onclick = () => fileMenu(0);

// ===== API used by the auto-grader =====
const api = {
  body, page, L,
  text: () => body.innerText.replace(/ /g, ' '),
  html: () => body.innerHTML,
  nodes(phrase, root = body) {
    const tn = textNodes(root).filter((n) => !n.parentElement.closest('.toc,.footnotes')); let txt = ''; const map = [];
    tn.forEach((n) => { map.push([n, txt.length]); txt += n.data.replace(/ /g, ' '); });
    const i = txt.toLowerCase().indexOf(phrase.toLowerCase()); if (i < 0) return [];
    const end = i + phrase.length;
    return map.filter(([n, st]) => st < end && st + n.data.length > i && n.data.trim()).map(([n]) => n.parentElement);
  },
  all(phrase, pred) { const ns = this.nodes(phrase); return ns.length > 0 && ns.every((el) => pred(getComputedStyle(el), el)); },
  block(phrase) { const ns = this.nodes(phrase); return ns.length ? ns[0].closest('p,h1,h2,h3,li,blockquote,td,th,div') : null; },
  bold: (cs) => parseInt(cs.fontWeight) >= 600,
  italic: (cs) => cs.fontStyle === 'italic',
  underline: (cs, el) => { for (let e = el; e && e !== body; e = e.parentElement) if (getComputedStyle(e).textDecorationLine.includes('underline')) return true; return false; },
  pt: (cs) => Math.round(parseFloat(cs.fontSize) * 0.75 * 2) / 2,
  rgb: (str) => (str.match(/\d+(\.\d+)?/g) || [0, 0, 0]).map(Number),
  bg(el) { for (let e = el; e && e !== body; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return this.rgb(c); } return null; },
};
runner.api = api;
window.__word = { api, runner, setDoc };
setDoc({ html: '<p><br></p>' });

