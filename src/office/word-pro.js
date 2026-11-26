// Word – extended features: File backstage, Track Changes, Compare/Combine, Restrict Editing,
// Styles gallery & Modify Style, Header & Footer tools, Page Numbers, Table of Contents
const WP = (() => {
  const author = () => (Progress.student() || 'Student').trim();
  const AUTHOR_COLORS = ['#b4009e', '#2b579a', '#c43e1c', '#107c41', '#8764b8', '#986f0b'];
  const colorOf = (a) => AUTHOR_COLORS[[...a].reduce((s, c) => s + c.charCodeAt(0), 0) % AUTHOR_COLORS.length];

  // ========================= STYLES =========================
  const STYLES = [
    { n: 'Normal', k: 'p', t: 'para', prev: 'font-size:14px' },
    { n: 'No Spacing', k: 'p.nospace', t: 'para', prev: 'font-size:14px' },
    { n: 'Heading 1', k: 'h1', t: 'para', prev: 'font-size:15px;color:#2f5496' },
    { n: 'Heading 2', k: 'h2', t: 'para', prev: 'font-size:14px;color:#2f5496' },
    { n: 'Heading 3', k: 'h3', t: 'para', prev: 'font-size:13px;color:#1f3763' },
    { n: 'Heading 4', k: 'h4', t: 'para', prev: 'font-size:13px;color:#2f5496;font-style:italic' },
    { n: 'Title', k: 'p.title', t: 'para', prev: 'font-size:18px' },
    { n: 'Subtitle', k: 'p.subtitle', t: 'para', prev: 'font-size:13px;color:#5a5a5a;letter-spacing:1px' },
    { n: 'Subtle Emphasis', k: 'span.st-subtle', t: 'char', prev: 'font-size:13px;font-style:italic;color:#404040' },
    { n: 'Emphasis', k: 'em', t: 'char', prev: 'font-size:13px;font-style:italic' },
    { n: 'Intense Emphasis', k: 'span.st-intense', t: 'char', prev: 'font-size:13px;font-style:italic;color:#4472c4' },
    { n: 'Strong', k: 'strong', t: 'char', prev: 'font-size:13px;font-weight:bold' },
    { n: 'Quote', k: 'blockquote', t: 'para', prev: 'font-size:13px;font-style:italic;color:#404040' },
    { n: 'Intense Quote', k: 'blockquote.intense', t: 'para', prev: 'font-size:13px;font-style:italic;color:#4472c4' },
    { n: 'Subtle Reference', k: 'span.st-sref', t: 'char', prev: 'font-size:12px;font-variant:small-caps;color:#5a5a5a' },
    { n: 'Intense Reference', k: 'span.st-iref', t: 'char', prev: 'font-size:12px;font-variant:small-caps;font-weight:bold;color:#4472c4' },
    { n: 'Book Title', k: 'span.st-book', t: 'char', prev: 'font-size:12px;font-style:italic;font-weight:bold;letter-spacing:1px' },
    { n: 'List Paragraph', k: 'p.listp', t: 'para', prev: 'font-size:13px;padding-left:8px' },
  ];
  const PARA_CLASSES = ['nospace', 'title', 'subtitle', 'intense', 'listp'];
  L.styleMods = L.styleMods || {}; L.custom = L.custom || [];
  const allStyles = () => [...STYLES, ...L.custom.map((c) => ({ n: c.n, k: 'span.cs-' + c.id, t: 'char', custom: c }))];
  const styleBy = (n) => allStyles().find((s) => s.n === n);
  const selFor = (k) => { const [tag, cls] = k.split('.'); return cls ? `${tag}.${cls}` : tag === 'p' ? `p:not(.${PARA_CLASSES.join('):not(.')})` : tag; };

  function blocksInSel() {
    restoreSel(); const s = getSelection(); if (!s.rangeCount) return [];
    const r = s.getRangeAt(0);
    let blocks = $$('p,h1,h2,h3,h4,blockquote,li', body).filter((b) => r.intersectsNode(b) && !b.querySelector('p,h1,h2,h3,h4,blockquote'));
    if (!blocks.length) { let n = r.startContainer; n = n.nodeType === 3 ? n.parentElement : n; const b = n && n.closest('p,h1,h2,h3,h4,blockquote,li'); if (b && body.contains(b)) blocks = [b]; }
    return blocks;
  }
  function retag(b, tag) {
    if (b.tagName.toLowerCase() === tag) return b;
    if (b.tagName === 'LI') return b;
    const n = document.createElement(tag); [...b.attributes].forEach((a) => n.setAttribute(a.name, a.value)); while (b.firstChild) n.appendChild(b.firstChild); b.replaceWith(n); return n;
  }
  function applyStyle(name) {
    const st = styleBy(name); if (!st) return;
    if (st.t === 'para') {
      const [tag, cls] = st.k.split('.');
      const bl = blocksInSel(); if (!bl.length) return toast('Click in a paragraph first.', 'warn');
      const made = bl.map((b) => { const n = retag(b, tag); PARA_CLASSES.forEach((c) => n.classList.remove(c)); if (cls) n.classList.add(cls); n.style.fontSize = ''; n.style.color = ''; n.style.fontFamily = ''; return n; });
      selectNodes(made[0], made[made.length - 1]);
    } else {
      restoreSel(); const s = getSelection(); if (!s.rangeCount || s.isCollapsed) return toast('Select the text you want to format.', 'warn');
      const [tag, cls] = st.k.split('.'); const r = s.getRangeAt(0);
      const w = document.createElement(tag); if (cls) w.className = cls;
      w.appendChild(r.extractContents()); r.insertNode(w); selectNodes(w, w);
    }
    saveSel(); changed(); paintGallery();
  }
  function styleCSS() {
    const out = [];
    Object.entries(L.styleMods || {}).forEach(([n, m]) => {
      const st = styleBy(n); if (!st) return;
      const sel = '#body ' + selFor(st.k);
      const r = [];
      if (m.font) r.push(`font-family:"${m.font}",sans-serif`); if (m.size) r.push(`font-size:${m.size}pt`); if (m.color) r.push(`color:${m.color}`);
      if (m.bold !== undefined) r.push(`font-weight:${m.bold ? 'bold' : 'normal'}`); if (m.italic !== undefined) r.push(`font-style:${m.italic ? 'italic' : 'normal'}`);
      if (m.underline) r.push('text-decoration:underline'); if (m.align) r.push(`text-align:${m.align}`); if (m.line) r.push(`line-height:${m.line}`);
      out.push(`${sel}{${r.join(';')}}`);
    });
    (L.custom || []).forEach((c) => out.push(`#body .cs-${c.id}{${c.css}}`));
    let tag = $('#docStyles'); if (!tag) { tag = document.createElement('style'); tag.id = 'docStyles'; document.head.appendChild(tag); }
    tag.textContent = out.join('\n');
  }
  function curStyleName() {
    const s = getSelection(); if (!s.rangeCount || !page.contains(s.anchorNode)) return null;
    let n = s.anchorNode; n = n.nodeType === 3 ? n.parentElement : n;
    const ch = n.closest('em,strong,span[class^="st-"],span[class^="cs-"]');
    if (ch && body.contains(ch)) { const st = allStyles().find((x) => ch.matches(selFor(x.k))); if (st) return st.n; }
    const b = n.closest('p,h1,h2,h3,h4,blockquote'); if (!b) return 'Normal';
    return (allStyles().find((x) => x.t === 'para' && b.matches(selFor(x.k))) || { n: 'Normal' }).n;
  }
  function paintGallery() {
    const cur = curStyleName();
    $$('#styleGal .rb').forEach((b) => b.classList.toggle('on', b.dataset.st === cur));
    $$('#stylePane .sti').forEach((b) => b.classList.toggle('on', b.dataset.st === cur));
  }
  function buildGallery() {
    const box = $('#rp-home .stylebox'); if (!box) return;
    box.id = 'styleGal';
    const shown = ['Normal', 'No Spacing', 'Heading 1', 'Heading 2', 'Heading 3', 'Title', 'Subtitle', 'Emphasis', 'Strong', 'Quote', ...L.custom.filter((c) => c.gallery !== false).map((c) => c.n)];
    box.innerHTML = shown.map((n) => { const st = styleBy(n); return `<button class="rb" data-st="${n}" title="${n}"><span style="${st.custom ? st.custom.css : st.prev}">AaBbCcDd</span><small>${n}</small></button>`; }).join('') + '<button class="rb galmore" id="btnStyleMore" title="More">▾</button>';
    box.querySelectorAll('[data-st]').forEach((b) => {
      b.addEventListener('click', () => applyStyle(b.dataset.st));
      b.addEventListener('contextmenu', (e) => { e.preventDefault(); styleMenu(b.dataset.st, e.clientX, e.clientY); });
    });
    $('#btnStyleMore').onclick = () => dropdown($('#btnStyleMore'), `<div class="stylegrid">${allStyles().map((s) => `<div class="sg" data-v="${s.n}"><span style="${s.custom ? s.custom.css : s.prev}">AaBbCcDd</span><small>${s.n}</small></div>`).join('')}</div><div class="sep"></div><div class="it" data-v="__create">🅰 Create a Style</div><div class="it" data-v="__clear">🧹 Clear Formatting</div><div class="it" data-v="__apply">Apply Styles...</div>`, (v) => {
      if (v === '__create') return createStyle(); if (v === '__clear') return exec('removeFormat'); if (v === '__apply') return stylesPane();
      applyStyle(v);
    });
    const lbl = box.parentElement.querySelector('.glabel .launch'); if (lbl) { lbl.onclick = stylesPane; lbl.title = 'Styles (Alt+Ctrl+Shift+S)'; }
  }
  function styleMenu(n, x, y) {
    PRO.ctxMenu(x, y, [{ v: 'upd', t: `Update ${n} to Match Selection` }, { v: 'mod', t: 'Modify...', ic: '✎' }, '-', { v: 'all', t: 'Select All: Instances' }, { v: 'rm', t: 'Remove from Style Gallery', dis: !styleBy(n)?.custom }], (v) => {
      if (v === 'mod') modifyStyle(n);
      if (v === 'upd') { restoreSel(); const s = getSelection(); let el = s.anchorNode; if (!el) return; el = el.nodeType === 3 ? el.parentElement : el; const cs = getComputedStyle(el); L.styleMods[n] = { ...(L.styleMods[n] || {}), font: cs.fontFamily.split(',')[0].replace(/"/g, ''), size: Math.round(parseFloat(cs.fontSize) * 0.75), color: rgbHex(cs.color), bold: parseInt(cs.fontWeight) >= 600, italic: cs.fontStyle === 'italic' }; styleCSS(); changed(); }
      if (v === 'all') { const st = styleBy(n); const els = $$(selFor(st.k), body); if (!els.length) return toast('No instances of this style.', 'info'); selectNodes(els[0], els[els.length - 1]); toast(`${els.length} instance${els.length > 1 ? 's' : ''} selected.`, 'info'); }
      if (v === 'rm') { const c = styleBy(n).custom; c.gallery = false; buildGallery(); }
    });
  }
  const rgbHex = (c) => { const m = (c.match(/\d+/g) || [0, 0, 0]).slice(0, 3).map(Number); return '#' + m.map((x) => x.toString(16).padStart(2, '0')).join(''); };
  async function modifyStyle(n) {
    const st = styleBy(n); const sample = $$(selFor(st.k), body)[0]; const cs = sample ? getComputedStyle(sample) : null;
    const m = { font: cs ? cs.fontFamily.split(',')[0].replace(/"/g, '') : 'Calibri', size: cs ? Math.round(parseFloat(cs.fontSize) * 0.75) : 11, color: cs ? rgbHex(cs.color) : '#000000', bold: cs ? parseInt(cs.fontWeight) >= 600 : false, italic: cs ? cs.fontStyle === 'italic' : false, underline: false, align: cs ? cs.textAlign.replace('start', 'left') : 'left', ...(L.styleMods[n] || {}) };
    const fonts = ['Calibri', 'Calibri Light', 'Arial', 'Times New Roman', 'Cambria', 'Georgia', 'Verdana', 'Tahoma', 'Segoe UI', 'Courier New'];
    const r = await modal(`<h3>Modify Style</h3><div class="msd"><p><b>Properties</b></p><p>Name: <input class="rs" value="${n}" disabled style="width:220px"></p><p>Style type: <b>${st.t === 'para' ? 'Paragraph' : 'Character'}</b> &nbsp; Style based on: <b>${n === 'Normal' ? '(no style)' : '¶ Normal'}</b></p>
      <p><b>Formatting</b></p><p><select class="rs">${fonts.map((f) => `<option ${f === m.font ? 'selected' : ''}>${f}</option>`).join('')}</select> <select class="rs">${[8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 36].map((x) => `<option ${x === m.size ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <label><input type="checkbox" ${m.bold ? 'checked' : ''}> <b>B</b></label> <label><input type="checkbox" ${m.italic ? 'checked' : ''}> <i>I</i></label> <label><input type="checkbox" ${m.underline ? 'checked' : ''}> <u>U</u></label> <input type="color" value="${m.color}"></p>
      <p>Alignment: <select class="rs">${['left', 'center', 'right', 'justify'].map((a) => `<option ${a === m.align ? 'selected' : ''}>${a}</option>`).join('')}</select> &nbsp; Line spacing: <select class="rs">${['', '1.0', '1.15', '1.5', '2.0'].map((x) => `<option ${String(m.line || '') === x ? 'selected' : ''}>${x}</option>`).join('')}</select></p>
      <div class="msprev" style="font-family:${m.font};font-size:${m.size}pt;color:${m.color}">Sample Text Sample Text Sample Text</div>
      <p><label><input type="checkbox" checked> Add to the Styles gallery</label> &nbsp; <label><input type="checkbox"> Automatically update</label></p>
      <p><label><input type="radio" name="msr" checked> Only in this document</label> &nbsp; <label><input type="radio" name="msr"> New documents based on this template</label></p></div>`, [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return;
    const v = r.v; // [name, font, size, b, i, u, color, align, line, gallery, auto, r1, r2]
    L.styleMods[n] = { font: v[1], size: +v[2], bold: v[3], italic: v[4], underline: v[5], color: v[6], align: v[7], line: v[8] || undefined };
    styleCSS(); changed(); toast(`Style "${n}" modified.`, 'ok');
  }
  async function createStyle() {
    restoreSel(); const s = getSelection(); let el = s.anchorNode; el = el && (el.nodeType === 3 ? el.parentElement : el);
    const cs = el && page.contains(el) ? getComputedStyle(el) : null;
    const r = await modal('<h3>Create New Style from Formatting</h3><p>Name:</p><input class="rs" style="width:100%;height:28px" value="Style1"><p class="muted" style="font-size:12px">The new style uses the formatting of the selected text.</p>', [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1 || !r.v[0].trim()) return;
    const name = r.v[0].trim(); if (styleBy(name)) return modal('<h3>Microsoft Word</h3><p>A style with this name already exists.</p>', [['OK', 'primary']]);
    const css = cs ? `font-family:${cs.fontFamily};font-size:${cs.fontSize};color:${cs.color};font-weight:${cs.fontWeight};font-style:${cs.fontStyle}` : '';
    L.custom.push({ id: Date.now().toString(36), n: name, css }); styleCSS(); buildGallery();
    if (s.rangeCount && !s.isCollapsed) applyStyle(name);
    toast(`Style "${name}" created.`, 'ok');
  }
  function stylesPane() {
    const p = PRO.pane('stylePane', 'Styles', `<div class="stlist">${allStyles().map((s) => `<div class="sti" data-st="${s.n}"><span style="${s.custom ? s.custom.css : s.prev}">${s.n}</span><em>${s.t === 'para' ? '¶' : 'a'}</em><i class="stm" title="Options">▾</i></div>`).join('')}</div>
      <p><label><input type="checkbox" checked> Show Preview</label></p><div class="spbtns"><button class="btn" data-a="new">🅰 New Style</button><button class="btn" data-a="clear">Clear All</button></div>`, { width: 270 });
    p.querySelectorAll('.sti').forEach((x) => { x.onclick = (e) => { if (e.target.classList.contains('stm')) { const r = e.target.getBoundingClientRect(); return styleMenu(x.dataset.st, r.left, r.bottom); } applyStyle(x.dataset.st); }; });
    p.querySelector('[data-a=new]').onclick = createStyle; p.querySelector('[data-a=clear]').onclick = () => exec('removeFormat');
    paintGallery();
  }
  document.addEventListener('selectionchange', () => paintGallery());
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey && e.altKey)) return;
    const k = e.key; if (k === '1' || k === '2' || k === '3') { e.preventDefault(); applyStyle('Heading ' + k); }
    if (e.shiftKey && k.toLowerCase() === 's') { e.preventDefault(); stylesPane(); }
  });

  // ========================= TRACK CHANGES =========================
  const TC = { on: false, view: 'all', locked: false };
  function setTrack(on) {
    if (TC.locked && !on) return modal('<h3>Microsoft Word</h3><p>This document is protected to track changes. To turn off Track Changes, stop protection first (Review › Restrict Editing).</p>', [['OK', 'primary']]);
    TC.on = on; $('#btnTrack')?.classList.toggle('on', on);
    const st = $('#stTrack'); if (st) st.textContent = 'Track Changes: ' + (on ? 'On' : 'Off');
  }
  const stamp = (el) => { el.className = 'tc'; el.dataset.a = author(); el.dataset.t = new Date().toISOString(); el.style.setProperty('--tcc', colorOf(author())); el.title = `${el.tagName === 'INS' ? 'Inserted' : 'Deleted'}: ${author()}`; return el; };
  const mine = (el) => el && el.dataset.a === author();
  function inBody(n) { return n && body.contains(n.nodeType === 3 ? n.parentElement : n); }
  function insertTracked(range, text) {
    let sc = range.startContainer; const scEl = sc.nodeType === 3 ? sc.parentElement : sc;
    const del = scEl.closest('del.tc'); if (del) { range.setStartAfter(del); range.collapse(true); }
    const ins = (range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer).closest('ins.tc');
    let tn;
    if (ins && mine(ins)) { tn = document.createTextNode(text); range.insertNode(tn); }
    else { const n = stamp(document.createElement('ins')); tn = document.createTextNode(text); n.appendChild(tn); range.insertNode(n); }
    const s = getSelection(); s.removeAllRanges(); const r = document.createRange(); r.setStart(tn, tn.length); r.collapse(true); s.addRange(r);
  }
  function markDeleted(range, back) {
    const nodes = textNodes(body).filter((t) => range.intersectsNode(t));
    let firstDel = null, lastDel = null;
    nodes.forEach((t) => {
      const st = t === range.startContainer ? range.startOffset : 0;
      const en = t === range.endContainer ? range.endOffset : t.length;
      if (en <= st) return;
      const parent = t.parentElement;
      if (parent.closest('del.tc')) { firstDel = firstDel || parent.closest('del.tc'); lastDel = parent.closest('del.tc'); return; }
      const ins = parent.closest('ins.tc');
      if (ins && mine(ins)) { t.deleteData(st, en - st); if (!ins.textContent) { const ref = document.createTextNode(''); ins.replaceWith(ref); lastDel = lastDel || null; } return; }
      let mid = t; if (st > 0) mid = t.splitText(st); if (en - st < mid.length) mid.splitText(en - st);
      const prev = mid.previousSibling;
      if (prev && prev.nodeName === 'DEL' && prev.classList.contains('tc') && mine(prev)) { prev.appendChild(mid); firstDel = firstDel || prev; lastDel = prev; return; }
      const d = stamp(document.createElement('del')); mid.replaceWith(d); d.appendChild(mid);
      const nx = d.nextSibling; if (nx && nx.nodeName === 'DEL' && nx.classList.contains('tc') && mine(nx)) { while (nx.firstChild) d.appendChild(nx.firstChild); nx.remove(); }
      firstDel = firstDel || d; lastDel = d;
    });
    const s = getSelection(); s.removeAllRanges(); const r = document.createRange();
    if (back && firstDel) r.setStartBefore(firstDel); else if (lastDel) r.setStartAfter(lastDel); else { r.setStart(range.startContainer, Math.min(range.startOffset, range.startContainer.length ?? 0)); }
    r.collapse(true); s.addRange(r);
  }
  body.addEventListener('beforeinput', (e) => {
    if (!TC.on) return;
    const t = e.inputType; const s = getSelection(); if (!s.rangeCount || !inBody(s.anchorNode)) return;
    if (['insertText', 'insertReplacementText', 'insertFromPaste', 'insertFromDrop'].includes(t)) {
      let text = e.data ?? (e.dataTransfer ? e.dataTransfer.getData('text/plain') : '') ?? '';
      if (!text) return; e.preventDefault();
      let r = s.getRangeAt(0); if (!r.collapsed) { markDeleted(r, false); r = getSelection().getRangeAt(0); }
      insertTracked(r, text.replace(/\r?\n/g, ' ')); changed(); listChanges();
    } else if (t.startsWith('delete')) {
      let r = s.getRangeAt(0).cloneRange();
      if (r.collapsed) {
        s.modify('extend', t.includes('Backward') ? 'backward' : 'forward', t.includes('Word') ? 'word' : 'character');
        r = s.getRangeAt(0).cloneRange(); if (r.collapsed) return;
        // crossing a paragraph boundary: let Word merge paragraphs untracked
        if (r.startContainer !== r.endContainer && (r.toString() === '' || r.toString() === '\n')) { return; }
      }
      e.preventDefault(); markDeleted(r, t.includes('Backward')); changed(); listChanges();
    }
  });
  function changesList() { return $$('ins.tc,del.tc', body); }
  function acceptEl(el) { if (el.tagName === 'INS') el.replaceWith(...el.childNodes); else el.remove(); }
  function rejectEl(el) { if (el.tagName === 'DEL') el.replaceWith(...el.childNodes); else el.remove(); }
  function curChange() { const s = getSelection(); if (!s.rangeCount) return null; let n = s.anchorNode; n = n && (n.nodeType === 3 ? n.parentElement : n); const c = n && n.closest('ins.tc,del.tc'); if (c && body.contains(c)) return c; return changesList().find((x) => s.getRangeAt(0).intersectsNode(x)) || null; }
  function gotoChange(dir) {
    const list = changesList(); if (!list.length) { modal('<h3>Microsoft Word</h3><p>The document contains no comments or tracked changes.</p>', [['OK', 'primary']]); return null; }
    const s = getSelection(); const r = s.rangeCount ? s.getRangeAt(0) : null;
    let target;
    if (!r) target = list[0];
    else if (dir > 0) target = list.find((x) => { const xr = document.createRange(); xr.selectNode(x); return xr.compareBoundaryPoints(Range.START_TO_END, r) >= 0 && !(r.intersectsNode(x) && !r.collapsed); }) || list[0];
    else target = [...list].reverse().find((x) => { const xr = document.createRange(); xr.selectNode(x); return xr.compareBoundaryPoints(Range.END_TO_START, r) <= 0 && !r.intersectsNode(x); }) || list[list.length - 1];
    selectNodes(target, target); target.scrollIntoView({ block: 'center' }); return target;
  }
  function accept(mode) {
    if (TC.restrictLock()) return;
    if (mode === 'all' || mode === 'allStop') { changesList().forEach(acceptEl); if (mode === 'allStop') setTrack(false); }
    else { const c = curChange() || gotoChange(1); if (!c) return; acceptEl(c); if (mode === 'next') gotoChange(1); }
    body.normalize(); changed(); listChanges();
  }
  function reject(mode) {
    if (TC.restrictLock()) return;
    if (mode === 'all' || mode === 'allStop') { changesList().forEach(rejectEl); if (mode === 'allStop') setTrack(false); }
    else { const c = curChange() || gotoChange(1); if (!c) return; rejectEl(c); if (mode === 'next') gotoChange(1); }
    body.normalize(); changed(); listChanges();
  }
  TC.restrictLock = () => { if (RESTRICT && RESTRICT.mode === 'tracked') { modal('<h3>Microsoft Word</h3><p>You can\'t accept or reject changes while the document is protected for tracked changes.</p>', [['OK', 'primary']]); return true; } return false; };
  function setView(v) { TC.view = v; ['all', 'simple', 'none', 'orig'].forEach((x) => document.body.classList.toggle('tc-' + x, x === v)); const sel = $('#tcView'); if (sel) sel.value = v; }
  function listChanges() {
    const p = $('#revPane'); if (!p) return;
    const list = changesList();
    p.querySelector('.spb').innerHTML = `<p class="muted">${list.length} revision${list.length === 1 ? '' : 's'}</p>` + list.map((x, i) => `<div class="rev" data-i="${i}"><b style="color:${x.style.getPropertyValue('--tcc')}">${escapeHtml(x.dataset.a || 'Author')}</b> <span>${x.tagName === 'INS' ? 'Inserted' : 'Deleted'}</span><div>${escapeHtml(x.textContent.slice(0, 80))}</div></div>`).join('');
    p.querySelectorAll('.rev').forEach((r) => (r.onclick = () => { const x = changesList()[+r.dataset.i]; if (x) { selectNodes(x, x); x.scrollIntoView({ block: 'center' }); } }));
  }
  function reviewPane() { PRO.pane('revPane', 'Revisions', '', { width: 260 }); listChanges(); }

  // ========================= COMPARE / COMBINE =========================
  function docBlocks(html) {
    const d = document.createElement('div'); d.innerHTML = html || '';
    d.querySelectorAll('del.tc,.toc,.footnotes').forEach((x) => x.remove());
    const blocks = [...d.querySelectorAll('p,h1,h2,h3,h4,blockquote,li')].filter((b) => !b.querySelector('p,h1,h2,h3,h4,blockquote,li'));
    return blocks.map((b) => ({ tag: b.tagName.toLowerCase() === 'li' ? 'p' : b.tagName.toLowerCase(), cls: b.className.replace(/\btc\b/g, '').trim(), text: b.textContent.replace(/ /g, ' ') }));
  }
  function tokens(blocks) { const t = []; blocks.forEach((b, i) => { (b.text.match(/\S+\s*|\s+/g) || []).forEach((w) => t.push({ w })); t.push({ p: i, tag: b.tag, cls: b.cls, w: '¶' + b.tag }); }); return t; }
  function diff(a, b) {
    const n = a.length, m = b.length; const W = m + 1; const dp = new Uint16Array((n + 1) * (m + 1));
    const eq = (x, y) => x.w.trim() === y.w.trim() && (!!x.p === !!y.p || x.p === undefined && y.p === undefined);
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i * W + j] = eq(a[i], b[j]) ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    const ops = []; let i = 0, j = 0;
    while (i < n && j < m) { if (eq(a[i], b[j])) { ops.push(['=', b[j]]); i++; j++; } else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) { ops.push(['-', a[i]]); i++; } else { ops.push(['+', b[j]]); j++; } }
    while (i < n) ops.push(['-', a[i++]]); while (j < m) ops.push(['+', b[j++]]);
    return ops;
  }
  function diffHTML(origHtml, revHtml, revAuthor) {
    const ops = diff(tokens(docBlocks(origHtml)), tokens(docBlocks(revHtml)));
    const t = new Date().toISOString(); const col = colorOf(revAuthor);
    const att = `class="tc" data-a="${escapeHtml(revAuthor)}" data-t="${t}" style="--tcc:${col}"`;
    let out = '', buf = '', lastTag = 'p', lastCls = '', kind = null, run = '';
    const flushRun = () => { if (!run) return; buf += kind === '+' ? `<ins ${att} title="Inserted: ${escapeHtml(revAuthor)}">${escapeHtml(run)}</ins>` : kind === '-' ? `<del ${att} title="Deleted: ${escapeHtml(revAuthor)}">${escapeHtml(run)}</del>` : escapeHtml(run); run = ''; };
    ops.forEach(([op, tk]) => {
      if (tk.p !== undefined) { if (op === '-') { return; } flushRun(); kind = null; out += `<${tk.tag}${tk.cls ? ` class="${tk.cls}"` : ''}>${buf || '<br>'}</${tk.tag}>`; buf = ''; lastTag = tk.tag; lastCls = tk.cls; return; }
      if (op !== kind) { flushRun(); kind = op; }
      run += tk.w;
    });
    flushRun(); if (buf) out += `<${lastTag}>${buf}</${lastTag}>`;
    return out;
  }
  async function compareDialog(combine) {
    const files = Office.FS.recent().filter((f) => f.app === 'Word' && f.data);
    const opts = `<option value="__cur">(Current document) ${escapeHtml(docName)}</option>` + files.map((f, i) => `<option value="${i}">${escapeHtml(f.folder)} › ${escapeHtml(f.name)}</option>`).join('');
    const r = await modal(`<h3>${combine ? 'Combine Documents' : 'Compare Documents'}</h3><div class="cmpd"><div><p><b>${combine ? 'Original document' : 'Original document'}</b></p><select class="rs" style="width:100%">${opts}</select><p>Label unmarked changes with:</p><input class="rs" style="width:100%" value="Original"></div>
      <div><p><b>${combine ? 'Revised document' : 'Revised document'}</b></p><select class="rs" style="width:100%">${opts}</select><p>Label unmarked changes with:</p><input class="rs" style="width:100%" value="${escapeHtml(author())}"></div></div>
      <p class="muted" style="font-size:12px">📁 Files saved in the simulator (File › Save As) appear in these lists.</p>
      <details><summary>More &gt;&gt;</summary><p><b>Comparison settings</b></p><p>${['Insertions and deletions', 'Moves', 'Comments', 'Formatting', 'Case changes', 'White space', 'Tables', 'Headers and footers', 'Footnotes and endnotes', 'Textboxes', 'Fields'].map((x) => `<label style="display:inline-block;width:48%"><input type="checkbox" checked> ${x}</label>`).join('')}</p>
      <p><b>Show changes in:</b> <label><input type="radio" name="sci"> Original document</label> <label><input type="radio" name="sci"> Revised document</label> <label><input type="radio" name="sci" checked> New document</label></p></details>`, [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return;
    const [o, oLbl, rv, rLbl] = r.v;
    if (o === rv) return modal('<h3>Microsoft Word</h3><p>The original and revised documents are the same. Choose two different documents.</p>', [['OK', 'primary']]);
    const get = async (v) => {
      if (v === '__cur') return getDoc();
      const f = files[+v];
      if (f.password) { const p = await modal(`<h3>Password</h3><p>Enter password to open file<br>${escapeHtml(f.name)}</p><input type="password" class="rs" style="width:100%;height:28px">`, [['Cancel'], ['OK', 'primary']]); if (p.i !== 1 || p.v[0] !== f.password) { await modal('<h3>Microsoft Word</h3><p>The password is incorrect. Word cannot open the document.</p>', [['OK', 'primary']]); return null; } }
      return f.data;
    };
    const A = await get(o); if (!A) return; const B = await get(rv); if (!B) return;
    const nameOf = (v) => v === '__cur' ? docName : files[+v].name.replace(/\.[^.]+$/, '');
    const html = diffHTML(A.html, B.html, rLbl || author());
    setDoc({ html, hdr: B.hdr, ftr: B.ftr, L: B.L || {} });
    WP.compareInfo = { combine, original: nameOf(o), revised: nameOf(rv), changes: changesList().length }; WP.history.push(WP.compareInfo);
    const nm = combine ? 'Document' + (Math.floor(Math.random() * 9) + 2) : 'Compare Result ' + (++WP.cmpN);
    Office.resetFile(nm); setDocName(nm); setView('all'); reviewPane();
    toast(`${combine ? 'Combined' : 'Compared'} "${nameOf(o)}" with "${nameOf(rv)}": ${WP.compareInfo.changes} changes.`, 'ok', 3500);
  }

  // ========================= RESTRICT EDITING =========================
  let RESTRICT = null;
  function restrictPane() {
    if (RESTRICT) {
      PRO.pane('restrictPane', 'Restrict Editing', `<p><b>Your permissions</b></p><p>This document is protected from unintentional editing.</p><p>You may only ${RESTRICT.mode === 'tracked' ? 'make changes that will be tracked' : RESTRICT.mode === 'comments' ? 'insert comments' : RESTRICT.mode === 'forms' ? 'fill in forms' : 'view'} in this document.</p><button class="btn" id="btnStopProt">Stop Protection</button>`, { width: 280 });
      $('#btnStopProt').onclick = async () => { if ((await stopRestrict()) !== false) restrictPane(); };
      return;
    }
    PRO.pane('restrictPane', 'Restrict Editing', `<p><b>1. Formatting restrictions</b></p><p><label><input type="checkbox" id="rsFmt"> Limit formatting to a selection of styles</label></p>
      <p><b>2. Editing restrictions</b></p><p><label><input type="checkbox" id="rsEdit"> Allow only this type of editing in the document:</label></p><select class="rs" id="rsMode" style="width:100%" disabled><option value="tracked">Tracked changes</option><option value="comments">Comments</option><option value="forms">Filling in forms</option><option value="readonly" selected>No changes (Read only)</option></select>
      <p><b>3. Start enforcement</b></p><p class="muted">Are you ready to apply these settings? (You can turn them off later)</p><button class="btn primary" id="rsStart" disabled>Yes, Start Enforcing Protection</button>`, { width: 280 });
    const upd = () => { $('#rsMode').disabled = !$('#rsEdit').checked; $('#rsStart').disabled = !($('#rsEdit').checked || $('#rsFmt').checked); };
    $('#rsEdit').onchange = upd; $('#rsFmt').onchange = upd;
    $('#rsStart').onclick = async () => {
      const r = await modal('<h3>Start Enforcing Protection</h3><p><b>Protection method</b></p><p><label><input type="radio" name="pm" checked> Password</label></p><p>The document is not encrypted. Malicious users can edit the file and remove the password.</p><p>Enter new password (optional):</p><input type="password" class="rs" style="width:100%;height:28px"><p>Reenter password to confirm:</p><input type="password" class="rs" style="width:100%;height:28px">', [['Cancel'], ['OK', 'primary']]);
      if (r.i !== 1) return;
      if (r.v[1] !== r.v[2]) return modal('<h3>Microsoft Word</h3><p>The password confirmation does not match.</p>', [['OK', 'primary']]);
      applyRestrict({ mode: $('#rsEdit').checked ? $('#rsMode').value : 'formatting', formatting: $('#rsFmt').checked, password: r.v[1] });
      restrictPane();
    };
  }
  function applyRestrict(R) {
    RESTRICT = R;
    if (!R) { TC.locked = false; Office.setReadOnly(false); return; }
    if (R.mode === 'tracked') { TC.locked = false; setTrack(true); TC.locked = true; Office.setReadOnly(false); }
    else if (R.mode === 'readonly' || R.mode === 'comments' || R.mode === 'forms') Office.setReadOnly(true, 'restrict');
  }
  async function stopRestrict() {
    if (!RESTRICT) return true;
    if (RESTRICT.password) {
      const r = await modal('<h3>Unprotect Document</h3><p>Password:</p><input type="password" class="rs" style="width:100%;height:28px">', [['Cancel'], ['OK', 'primary']]);
      if (r.i !== 1) return false;
      if (r.v[0] !== RESTRICT.password) { await modal('<h3>Microsoft Word</h3><p>The password is incorrect.</p>', [['OK', 'primary']]); return false; }
    }
    applyRestrict(null); toast('Protection stopped.', 'info'); if ($('#restrictPane')) restrictPane(); return true;
  }
  function setEditable(on) { body.contentEditable = on ? 'true' : 'false'; $('#hdr').contentEditable = on ? 'true' : 'false'; $('#ftr').contentEditable = on ? 'true' : 'false'; }

  // ========================= HEADER & FOOTER =========================
  const docTitle = () => (Office.FILE.props && Office.FILE.props.title) || docName || 'Document Title';
  const HF_DESIGNS = {
    blank: ['Blank', () => '<p>[Type here]</p>'],
    three: ['Blank (Three Columns)', () => '<div class="hf3"><span>[Type here]</span><span>[Type here]</span><span>[Type here]</span></div>'],
    austin: ['Austin', (k) => k === 'hdr' ? `<div class="hf-austin"><span>${escapeHtml(docTitle())}</span></div>` : '<div class="hf-austin f"><span class="pgnum" contenteditable="false" data-fmt="1">1</span></div>'],
    banded: ['Banded', (k) => k === 'hdr' ? `<div class="hf-banded">${escapeHtml(docTitle()).toUpperCase()}</div>` : '<div class="hf-banded"><span class="pgnum" contenteditable="false" data-fmt="1">1</span></div>'],
    facet: ['Facet', (k) => k === 'hdr' ? `<div class="hf-facet"><b>${escapeHtml(docTitle())}</b><i></i></div>` : `<div class="hf-facet f"><span>${escapeHtml(docTitle())}</span><span class="pgnum" contenteditable="false" data-fmt="1">1</span></div>`],
    ion: ['Ion (Dark)', (k) => k === 'hdr' ? `<div class="hf-ion"><span>${escapeHtml(docTitle()).toUpperCase()}</span><b class="pgnum" contenteditable="false" data-fmt="1">1</b></div>` : `<div class="hf-ion"><span>${escapeHtml(author()).toUpperCase()}</span><b class="pgnum" contenteditable="false" data-fmt="1">1</b></div>`],
  };
  const hfMenu = (k) => `<div class="hd">Built-in</div>${Object.entries(HF_DESIGNS).map(([v, [n]]) => `<div class="it big" data-v="${v}"><div class="hfprev ${k} ${v}">${n}</div></div>`).join('')}<div class="sep"></div><div class="it" data-v="edit">✎ Edit ${k === 'hdr' ? 'Header' : 'Footer'}</div><div class="it" data-v="remove">✕ Remove ${k === 'hdr' ? 'Header' : 'Footer'}</div>`;
  function setHF(k, v) {
    const el = $('#' + k);
    if (v === 'remove') { el.innerHTML = ''; el.hidden = true; closeHF(); changed(); return; }
    el.hidden = false;
    if (v !== 'edit') el.innerHTML = HF_DESIGNS[v][1](k);
    renderFields(); openHF(k); changed();
  }
  function openHF(k) {
    const el = $('#' + k); el.hidden = false; document.body.classList.add('hfedit');
    PRO.showCtx('hf', true, true); el.focus();
    const t = el.querySelector('p,span:not(.pgnum),div'); if (t && /\[Type here\]/.test(el.textContent)) { const r = document.createRange(); r.selectNodeContents(t.tagName === 'DIV' ? (t.querySelector('span') || t) : t); getSelection().removeAllRanges(); getSelection().addRange(r); }
  }
  function closeHF() { document.body.classList.remove('hfedit'); PRO.showCtx('hf', false); ['hdr', 'ftr'].forEach((k) => { const el = $('#' + k); if (!el.textContent.trim() && !el.querySelector('.pgnum,img')) el.hidden = true; }); body.focus(); }
  ['hdr', 'ftr'].forEach((k) => {
    $('#' + k).addEventListener('focusin', () => { document.body.classList.add('hfedit'); PRO.showCtx('hf', true); });
    $('#' + k).addEventListener('dblclick', () => openHF(k));
  });
  body.addEventListener('focusin', () => { if (document.body.classList.contains('hfedit')) closeHF(); });
  page.addEventListener('dblclick', (e) => {
    if (e.target !== page) return;
    const r = page.getBoundingClientRect(); const y = (e.clientY - r.top) / (parseFloat(page.style.zoom) || 1);
    if (y < 90) openHF('hdr'); else if (y > page.offsetHeight - 90) openHF('ftr');
  });
  const HFO = { first: false, oddEven: false, top: 0.5, bottom: 0.5 };

  // ========================= PAGE NUMBERS & FIELDS =========================
  const roman = (n, up) => { const t = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]; let s = ''; t.forEach(([v, r]) => { while (n >= v) { s += r; n -= v; } }); return up ? s.toUpperCase() : s; };
  const PNF = { fmt: '1', start: 1 };
  const fmtNum = (n, f) => f === 'i' ? roman(n) : f === 'I' ? roman(n, true) : f === 'a' ? String.fromCharCode(96 + ((n - 1) % 26) + 1) : f === 'A' ? String.fromCharCode(64 + ((n - 1) % 26) + 1) : f === '-1-' ? `- ${n} -` : String(n);
  function pageCount() { const ph = SIZES[L.size][L.orient === 'portrait' ? 1 : 0]; return Math.max(1, Math.ceil(page.scrollHeight / ph)) + $$('.pagebreak', body).length; }
  function renderFields() {
    $$('.pgnum', page).forEach((x) => (x.textContent = fmtNum(PNF.start, PNF.fmt)));
    $$('.numpages', page).forEach((x) => (x.textContent = pageCount()));
    $$('.fld-author', page).forEach((x) => (x.textContent = author()));
    $$('.fld-file', page).forEach((x) => (x.textContent = docName));
    $$('.fld-title', page).forEach((x) => (x.textContent = docTitle()));
  }
  function pageNumMenu() {
    const pos = (k, lbl) => `<div class="hd">${lbl}</div><div class="it" data-v="${k}:left"><span class="pnprev l">#</span> Plain Number 1</div><div class="it" data-v="${k}:center"><span class="pnprev c">#</span> Plain Number 2</div><div class="it" data-v="${k}:right"><span class="pnprev r">#</span> Plain Number 3</div><div class="it" data-v="${k}:xofy"><span class="pnprev c">#/#</span> Page X of Y (Bold Numbers)</div>`;
    dropdown($('#btnPageNum'), pos('top', 'Top of Page') + pos('bottom', 'Bottom of Page') + '<div class="hd">Current Position</div><div class="it" data-v="cur:plain">Plain Number</div><div class="sep"></div><div class="it" data-v="format">#️⃣ Format Page Numbers...</div><div class="it" data-v="remove">✕ Remove Page Numbers</div>', async (v) => {
      if (v === 'format') return formatPN();
      if (v === 'remove') { $$('.pgwrap', page).forEach((x) => x.remove()); $$('.pgnum', page).forEach((x) => x.remove()); ['hdr', 'ftr'].forEach((k) => { if (!$('#' + k).textContent.trim()) $('#' + k).hidden = true; }); changed(); return; }
      const [where, how] = v.split(':');
      if (where === 'cur') { insertHTML('<span class="pgnum" contenteditable="false" data-fmt="1">1</span>'); renderFields(); return; }
      $$('.pgwrap', page).forEach((x) => x.remove());
      const el = $(where === 'top' ? '#hdr' : '#ftr'); el.hidden = false;
      const inner = how === 'xofy' ? 'Page <b class="pgnum" contenteditable="false">1</b> of <b class="numpages" contenteditable="false">1</b>' : '<span class="pgnum" contenteditable="false">1</span>';
      el.insertAdjacentHTML(where === 'top' ? 'afterbegin' : 'beforeend', `<div class="pgwrap" style="text-align:${how === 'xofy' ? 'center' : how}">${inner}</div>`);
      renderFields(); openHF(where === 'top' ? 'hdr' : 'ftr'); changed();
    });
  }
  async function formatPN() {
    const r = await modal(`<h3>Page Number Format</h3><p>Number format: <select class="rs">${[['1', '1, 2, 3, …'], ['-1-', '- 1 -, - 2 -, - 3 -, …'], ['a', 'a, b, c, …'], ['A', 'A, B, C, …'], ['i', 'i, ii, iii, …'], ['I', 'I, II, III, …']].map(([v, t]) => `<option value="${v}" ${PNF.fmt === v ? 'selected' : ''}>${t}</option>`).join('')}</select></p><p><label><input type="checkbox"> Include chapter number</label></p><p><b>Page numbering</b></p><p><label><input type="radio" name="pnn" ${PNF.start === 1 ? 'checked' : ''}> Continue from previous section</label></p><p><label><input type="radio" name="pnn" ${PNF.start !== 1 ? 'checked' : ''}> Start at:</label> <input type="number" class="rs" value="${PNF.start}" min="0" style="width:60px"></p>`, [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return;
    PNF.fmt = r.v[0]; PNF.start = r.v[3] ? Math.max(0, +r.v[4] || 1) : 1; renderFields(); changed();
  }

  // ========================= TABLE OF CONTENTS =========================
  const TOCO = { title: 'Contents', levels: 3, pn: true, right: true, leader: 'dots', manual: false };
  function headingPage(h) { const ph = SIZES[L.size][L.orient === 'portrait' ? 1 : 0]; const breaks = $$('.pagebreak', body).filter((b) => b.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING).length; return 1 + breaks + Math.floor(h.offsetTop / ph); }
  buildTOC = function () {
    const sel = ['h1', 'h2', 'h3', 'h4'].slice(0, TOCO.levels).join(',');
    const hs = $$(sel, body).filter((h) => !h.closest('.toc') && h.textContent.trim() && !h.classList.contains('notoc'));
    const items = TOCO.manual ? ['Type chapter title (level 1)', 'Type chapter title (level 2)', 'Type chapter title (level 3)'].map((t, i) => `<div class="tl l${i + 1}" contenteditable="true"><span>${t}</span><span class="ld ${TOCO.leader}"></span><span>${i + 1}</span></div>`).join('')
      : hs.map((h) => `<div class="tl l${h.tagName[1]}" data-target="${ensureId(h)}"><span>${escapeHtml(h.textContent.replace(/¶/g, '').trim())}</span>${TOCO.pn ? `<span class="ld ${TOCO.right ? TOCO.leader : 'none'}"></span><span>${headingPage(h)}</span>` : ''}</div>`).join('');
    return `<div class="toc" contenteditable="false" data-title="${escapeHtml(TOCO.title)}" data-levels="${TOCO.levels}" data-leader="${TOCO.leader}" data-pn="${TOCO.pn ? 1 : 0}"><div class="toch">${escapeHtml(TOCO.title)}</div>${items || '<div>No table of contents entries found.<br><small>Apply Heading 1, Heading 2… styles to your titles, then update the table.</small></div>'}</div>`;
  };
  const ensureId = (h) => { if (!h.id) h.id = 'h' + Math.random().toString(36).slice(2, 8); return h.id; };
  function insertTOC(kind) {
    TOCO.title = kind === 'auto2' ? 'Table of Contents' : 'Contents'; TOCO.manual = kind === 'manual';
    const ex = $('.toc', body); if (ex) { ex.outerHTML = buildTOC(); changed(); return; }
    restoreSel(); insertHTML(buildTOC() + '<p><br></p>');
  }
  async function customTOC() {
    const r = await modal(`<h3>Table of Contents</h3><div class="tocdlg"><div class="tocpv"><div class="toch">Heading 1 ........ 1</div><div style="padding-left:12px">Heading 2 ...... 3</div><div style="padding-left:24px">Heading 3 .... 5</div></div>
      <p><label><input type="checkbox" ${TOCO.pn ? 'checked' : ''}> Show page numbers</label></p><p><label><input type="checkbox" ${TOCO.right ? 'checked' : ''}> Right align page numbers</label></p>
      <p>Tab leader: <select class="rs">${[['dots', '.......'], ['dashes', '-------'], ['line', '_______'], ['none', '(none)']].map(([v, t]) => `<option value="${v}" ${TOCO.leader === v ? 'selected' : ''}>${t}</option>`).join('')}</select></p>
      <p>Formats: <select class="rs"><option>From template</option><option>Classic</option><option>Distinctive</option><option>Fancy</option><option>Modern</option><option>Formal</option><option>Simple</option></select> &nbsp; Show levels: <input type="number" class="rs" min="1" max="4" value="${TOCO.levels}" style="width:50px"></p></div>`, [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return;
    Object.assign(TOCO, { pn: r.v[0], right: r.v[1], leader: r.v[2], levels: Math.max(1, Math.min(4, +r.v[4] || 3)), manual: false });
    const ex = $('.toc', body);
    if (ex) { const r2 = await modal('<h3>Microsoft Word</h3><p>Do you want to replace the selected table of contents?</p>', [['No'], ['Yes', 'primary']]); if (r2.i !== 1) return; ex.outerHTML = buildTOC(); changed(); }
    else { restoreSel(); insertHTML(buildTOC() + '<p><br></p>'); }
  }
  async function updateTOC() {
    const ex = $('.toc', body); if (!ex) return toast('There is no table of contents in this document.', 'warn');
    const r = await modal('<h3>Update Table of Contents</h3><p>Word is updating the table of contents. Select one of the following options:</p><p><label><input type="radio" name="ut"> Update page numbers only</label></p><p><label><input type="radio" name="ut" checked> Update entire table</label></p>', [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return;
    TOCO.levels = +ex.dataset.levels || 3; TOCO.leader = ex.dataset.leader || 'dots'; TOCO.pn = ex.dataset.pn !== '0'; TOCO.title = ex.dataset.title || 'Contents';
    ex.outerHTML = buildTOC(); WP.tocUpdated = Date.now(); changed();
  }
  body.addEventListener('click', (e) => {
    const tl = e.target.closest('.toc .tl[data-target]'); if (!tl) return;
    if (e.ctrlKey || e.metaKey) { const h = document.getElementById(tl.dataset.target); if (h) { h.scrollIntoView({ block: 'start', behavior: 'smooth' }); const r = document.createRange(); r.selectNodeContents(h); r.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(r); } }
    else toast('Ctrl+Click to follow link', 'info', 1500);
  });

  // ========================= RIBBON =========================
  function buildRibbon() {
    // Home › Styles gallery
    buildGallery();
    // Insert: replace Page Number / Header / Footer menus
    PRO.rebind('#btnHeader', () => dropdown($('#btnHeader'), hfMenu('hdr'), (v) => setHF('hdr', v)));
    PRO.rebind('#btnFooter', () => dropdown($('#btnFooter'), hfMenu('ftr'), (v) => setHF('ftr', v)));
    PRO.rebind('#btnPageNum', pageNumMenu);
    // References › TOC
    PRO.rebind('#btnTOC', () => dropdown($('#btnTOC'), '<div class="hd">Built-In</div><div class="it big" data-v="auto1"><div class="tocprev"><b>Automatic Table 1</b><small>Contents · Heading 1 … 1</small></div></div><div class="it big" data-v="auto2"><div class="tocprev"><b>Automatic Table 2</b><small>Table of Contents · Heading 1 … 1</small></div></div><div class="it big" data-v="manual"><div class="tocprev"><b>Manual Table</b><small>Type chapter title (level 1) … 1</small></div></div><div class="sep"></div><div class="it" data-v="custom">📑 Custom Table of Contents...</div><div class="it" data-v="remove">✕ Remove Table of Contents</div>', (v) => {
      if (v === 'remove') { $$('.toc', body).forEach((t) => t.remove()); changed(); return; }
      if (v === 'custom') return customTOC();
      insertTOC(v);
    }));
    PRO.rebind('#btnUpdateTOC', updateTOC);
    PRO.addGroups('refs', PRO.grp('Table of Contents', `<div class="col">${PRO.small('btnAddText', '➕', 'Add Text ▾')}${PRO.small('btnUpdTOC2', '🔄', 'Update Table')}</div>`, 'g-toc2'), { after: $('#btnTOC').closest('.grp') });
    $('#btnUpdTOC2').onclick = updateTOC;
    $('#btnAddText').onclick = () => dropdown($('#btnAddText'), '<div class="it" data-v="0">Do Not Show in Table of Contents</div><div class="it" data-v="1">Level 1</div><div class="it" data-v="2">Level 2</div><div class="it" data-v="3">Level 3</div>', (v) => { if (v === '0') { blocksInSel().forEach((b) => retag(b, 'p')); changed(); } else applyStyle('Heading ' + v); });
    // Review tab: Tracking, Changes, Compare, Protect
    const rv = $('#rp-review');
    PRO.addGroups('review', [
      PRO.grp('Tracking', `${PRO.big('btnTrack', '📝', 'Track<br>Changes', 'Track Changes (Ctrl+Shift+E)', true)}<div class="col" style="gap:4px;padding-top:4px"><select class="rs" id="tcView" title="Display for Review"><option value="simple">Simple Markup</option><option value="all" selected>All Markup</option><option value="none">No Markup</option><option value="orig">Original</option></select>${PRO.small('btnShowMarkup', '☰', 'Show Markup ▾')}${PRO.small('btnRevPane', '📋', 'Reviewing Pane')}</div>`),
      PRO.grp('Changes', `${PRO.big('btnAccept', '✅', 'Accept', 'Accept', true)}${PRO.big('btnReject', '❎', 'Reject', 'Reject', true)}<div class="col">${PRO.small('btnPrevChg', '⬆', 'Previous')}${PRO.small('btnNextChg', '⬇', 'Next')}</div>`),
      PRO.grp('Compare', PRO.big('btnCompare', '⚖', 'Compare', 'Compare', true)),
      PRO.grp('Protect', `${PRO.big('btnBlock', '🚫', 'Block<br>Authors', 'Block Authors')}${PRO.big('btnRestrict', '🛡', 'Restrict<br>Editing', 'Restrict Editing')}`),
    ].join(''));
    $('#btnTrack').onclick = (e) => { if (e.offsetY > 50 || e.target.classList.contains('caret')) return dropdown($('#btnTrack'), '<div class="it" data-v="me">For Everyone</div><div class="it" data-v="lock">🔒 Lock Tracking...</div>', async (v) => { if (v === 'lock') { const p = await PRO.askPassword('Lock Tracking', { label: 'Prevent other authors from turning off Track Changes. Enter password (optional):' }); if (p === null) return; setTrack(true); TC.locked = true; TC.lockPw = p; toast('Tracking locked.', 'ok'); } else setTrack(!TC.on); }); setTrack(!TC.on); };
    $('#tcView').onchange = (e) => setView(e.target.value);
    $('#btnShowMarkup').onclick = () => dropdown($('#btnShowMarkup'), ['Comments', 'Ink', 'Insertions and Deletions', 'Formatting', 'Balloons ▸', 'Specific People ▸'].map((x) => `<div class="it" data-v="x">✓ ${x}</div>`).join(''), () => {});
    $('#btnRevPane').onclick = () => ($('#revPane') ? PRO.closePane('revPane') : reviewPane());
    $('#btnAccept').onclick = () => dropdown($('#btnAccept'), '<div class="it" data-v="next">Accept and Move to Next</div><div class="it" data-v="one">Accept This Change</div><div class="it" data-v="all">Accept All Changes</div><div class="it" data-v="allStop">Accept All Changes and Stop Tracking</div>', accept);
    $('#btnReject').onclick = () => dropdown($('#btnReject'), '<div class="it" data-v="next">Reject and Move to Next</div><div class="it" data-v="one">Reject Change</div><div class="it" data-v="all">Reject All Changes</div><div class="it" data-v="allStop">Reject All Changes and Stop Tracking</div>', reject);
    $('#btnPrevChg').onclick = () => gotoChange(-1); $('#btnNextChg').onclick = () => gotoChange(1);
    $('#btnCompare').onclick = () => dropdown($('#btnCompare'), '<div class="it big" data-v="cmp"><span class="bi">⚖</span><div><b>Compare...</b><small>Compare two versions of a document (legal blackline).</small></div></div><div class="it big" data-v="comb"><span class="bi">🔀</span><div><b>Combine...</b><small>Combine revisions from multiple authors into a single document.</small></div></div>', (v) => compareDialog(v === 'comb'));
    $('#btnRestrict').onclick = () => ($('#restrictPane') ? PRO.closePane('restrictPane') : restrictPane());
    $('#btnBlock').onclick = () => toast('Block Authors is available for documents stored on SharePoint.', 'info');
    document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') { e.preventDefault(); setTrack(!TC.on); } }, true);
    // Header & Footer contextual tab
    PRO.addTab('hf', 'Header & Footer', [
      PRO.grp('Header &amp; Footer', `${PRO.big('hfHeader', 'header', 'Header', 'Header', true)}${PRO.big('hfFooter', 'header', 'Footer', 'Footer', true)}${PRO.big('hfPageNum', '#️⃣', 'Page<br>Number', 'Page Number', true)}`),
      PRO.grp('Insert', `${PRO.big('hfDate', '📅', 'Date &amp;<br>Time', 'Date & Time')}${PRO.big('hfInfo', '📄', 'Document<br>Info', 'Document Info', true)}${PRO.big('hfPic', 'picture', 'Pictures')}`),
      PRO.grp('Navigation', `${PRO.big('hfGoH', '⬆', 'Go to<br>Header')}${PRO.big('hfGoF', '⬇', 'Go to<br>Footer')}`),
      PRO.grp('Options', `<div class="col" style="gap:3px;padding-top:4px"><label class="ck"><input type="checkbox" id="hfFirst"> Different First Page</label><label class="ck"><input type="checkbox" id="hfOdd"> Different Odd &amp; Even Pages</label><label class="ck"><input type="checkbox" checked id="hfShow"> Show Document Text</label></div>`),
      PRO.grp('Position', `<div class="col" style="gap:4px;padding-top:4px"><label class="ck">Header from Top: <input class="rs" id="hfTop" value="0.5&quot;" style="width:52px"></label><label class="ck">Footer from Bottom: <input class="rs" id="hfBot" value="0.5&quot;" style="width:52px"></label></div>`),
      PRO.grp('Close', PRO.big('hfClose', '✖', 'Close Header<br>and Footer', 'Close Header and Footer (Esc)')),
    ].join(''), { ctx: true });
    $('#hfHeader').onclick = () => dropdown($('#hfHeader'), hfMenu('hdr'), (v) => setHF('hdr', v));
    $('#hfFooter').onclick = () => dropdown($('#hfFooter'), hfMenu('ftr'), (v) => setHF('ftr', v));
    $('#hfPageNum').onclick = () => { const b = $('#btnPageNum'); b ? pageNumMenu() : 0; };
    $('#hfDate').onclick = async () => { const d = new Date(); const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; const opts = [`${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`, `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`, `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`, d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })]; const r = await modal(`<h3>Date and Time</h3><select class="rs" size="5" style="width:100%">${opts.map((o, i) => `<option ${i ? '' : 'selected'}>${o}</option>`).join('')}</select><p><label><input type="checkbox"> Update automatically</label></p>`, [['Cancel'], ['OK', 'primary']]); if (r.i === 1) { restoreSel(); document.execCommand('insertText', false, r.v[0]); } };
    $('#hfInfo').onclick = () => dropdown($('#hfInfo'), '<div class="it" data-v="author">Author</div><div class="it" data-v="file">File Name</div><div class="it" data-v="title">Document Title</div>', (v) => { restoreSel(); document.execCommand('insertHTML', false, `<span class="fld-${v}" contenteditable="false">x</span>&nbsp;`); renderFields(); });
    $('#hfPic').onclick = async () => { const u = await pickImage(); if (u) { restoreSel(); document.execCommand('insertHTML', false, `<img src="${u}" style="height:40px">`); } };
    $('#hfGoH').onclick = () => openHF('hdr'); $('#hfGoF').onclick = () => openHF('ftr'); $('#hfClose').onclick = closeHF;
    $('#hfFirst').onchange = (e) => { HFO.first = e.target.checked; }; $('#hfOdd').onchange = (e) => { HFO.oddEven = e.target.checked; };
    $('#hfShow').onchange = (e) => document.body.classList.toggle('hfhide', !e.target.checked);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('hfedit') && !$('.modal-bg') && !$('#backstage')) closeHF(); });
    // status bar
    $('#stWords')?.insertAdjacentHTML('afterend', '<span id="stTrack" title="Track Changes" style="cursor:pointer">Track Changes: Off</span>');
    $('#stTrack')?.addEventListener('click', () => setTrack(!TC.on));
    setView('all');
  }

  // ========================= FILE: adapter for the Office backstage =========================
  const tplHtml = {
    report: '<p class="title">Report Title</p><p class="subtitle">Subtitle</p><h1>Introduction</h1><p>Start typing here. To replace any placeholder text, just select it and start typing.</p><h1>Heading 1</h1><h2>Heading 2</h2><p>Body text goes here.</p>',
    letter: '<p>[Your Name]<br>[Street Address]<br>[City, ST ZIP Code]</p><p>[Date]</p><p>Dear [Recipient],</p><p>Start typing your letter here.</p><p>Sincerely,</p><p>[Your Name]</p>',
    newsletter: '<p class="title">School Newsletter</p><p class="subtitle">Volume 1 · Issue 1</p><h1>Headline</h1><p>Write your first article here.</p><h2>Upcoming Events</h2><ul><li>Event one</li><li>Event two</li></ul>',
  };
  const thumb = (inner) => `<div class="tplpage">${inner}</div>`;
  const adapter = {
    app: 'Word', noun: 'document', defaultName: 'Document1', blankName: 'Blank document', nativeExt: 'docx',
    formats: [
      { ext: 'docx', label: 'Word Document (*.docx)', desc: 'Uses the Word Document format' },
      { ext: 'docm', label: 'Word Macro-Enabled Document (*.docm)' },
      { ext: 'doc', label: 'Word 97-2003 Document (*.doc)', desc: 'Uses the Word 97-2003 Document format' },
      { ext: 'dotx', label: 'Word Template (*.dotx)', desc: 'Starting point for new documents' },
      { ext: 'pdf', label: 'PDF (*.pdf)', export: true, desc: 'Preserves layout and formatting' },
      { ext: 'xps', label: 'XPS Document (*.xps)', export: true },
      { ext: 'rtf', label: 'Rich Text Format (*.rtf)', desc: 'Preserves text formatting information' },
      { ext: 'txt', label: 'Plain Text (*.txt)', desc: 'Contains only the text' },
      { ext: 'odt', label: 'OpenDocument Text (*.odt)', desc: 'Uses the OpenDocument format' },
    ],
    templates: [
      { name: 'Report', thumb: thumb('<b style="font-size:9px">Report Title</b><i></i><i></i><i class="h"></i><i></i>'), load: () => setDoc({ html: tplHtml.report }) },
      { name: 'Letter', thumb: thumb('<i class="s"></i><i class="s"></i><i></i><i></i><i></i>'), load: () => setDoc({ html: tplHtml.letter }) },
      { name: 'Newsletter', thumb: thumb('<b style="font-size:9px;color:#2f5496">Newsletter</b><i class="h"></i><i></i><i></i>'), load: () => setDoc({ html: tplHtml.newsletter }) },
    ],
    serialize: () => ({ ...getDoc(), L: JSON.parse(JSON.stringify(L)), restrict: RESTRICT, track: TC.on, pnf: { ...PNF }, toco: { ...TOCO } }),
    load(d) { setDoc(d); },
    newBlank() { setDoc({}); },
    setName: (n) => setDocName(n),
    stats: () => [['Pages', pageCount()], ['Words', body.innerText.trim().split(/\s+/).filter(Boolean).length], ['Total Editing Time', Math.max(1, Math.round((Date.now() - Office.FILE.created) / 60000)) + ' Minutes'], ['Template', 'Normal']],
    orient: () => L.orient, setOrient: (o) => { L.orient = o; applyLayout(); },
    printPreview(box, P) {
      const n = pageCount(); const w = 180, h = w * (P.orient === 'landscape' ? 0.77 : 1.29);
      const clone = page.cloneNode(true); clone.removeAttribute('id'); clone.style.zoom = ''; clone.style.transform = `scale(${w / page.offsetWidth})`; clone.style.transformOrigin = '0 0';
      $$('[id]', clone).forEach((x) => x.removeAttribute('id'));
      const sheet = document.createElement('div'); sheet.className = 'pvpage'; sheet.style.width = w + 'px'; sheet.style.height = h + 'px'; sheet.appendChild(clone);
      if (P.color === 'Grayscale') sheet.style.filter = 'grayscale(1)';
      box.appendChild(sheet); return P.what === 'current' ? 1 : n;
    },
    printWhat: [['all', 'Print All Pages', 'The whole thing'], ['current', 'Print Current Page', 'Just this page'], ['custom', 'Custom Print', 'Type specific pages, sections or ranges'], ['markup', 'Print Markup', 'Include tracked changes']],
    protectItems: [['restrict', '🛡', 'Restrict Editing', 'Control what types of changes others can make to this document.']],
    onProtect(k) { if (k === 'restrict') { restrictPane(); $('#tabs button[data-tab=review]').click(); } },
    protectState: () => RESTRICT ? ['Restricted editing: ' + ({ readonly: 'No changes (Read only)', tracked: 'Tracked changes', comments: 'Comments', forms: 'Filling in forms', formatting: 'Formatting restrictions' }[RESTRICT.mode]) + '.'] : [],
    stopRestrict, setReadOnly: (ro) => setEditable(!ro),
    issues: () => [...(changesList().length ? ['Revisions (tracked changes)'] : []), ...($$('.comment', body).length ? ['Comments'] : []), ...(($('#hdr').textContent + $('#ftr').textContent).trim() ? ['Headers and footers'] : [])],
    inspect: () => [...(changesList().length ? ['Comments, Revisions and Versions'] : []), ...(($('#hdr').textContent + $('#ftr').textContent).trim() ? ['Headers, Footers and Watermarks'] : [])],
    access: () => { const imgs = $$('img', body).filter((i) => !i.alt).length; return imgs ? `<p>⚠ <b>Missing alternative text (${imgs})</b><br>Pictures should have alt text so screen readers can describe them.</p>` : '<p>✔ No accessibility issues found.</p>'; },
    download: () => saveJSON(docName, 'thw', getDoc()),
    pageSetup: () => { Office.closeBackstage(); $('#tabs button[data-tab=layout]').click(); },
  };
  // setDoc must restore the extended state too
  const _setDoc = setDoc;
  setDoc = function (d = {}) {
    _setDoc(d);
    L.styleMods = (d.L && d.L.styleMods) || {}; L.custom = (d.L && d.L.custom) || [];
    Object.assign(PNF, { fmt: '1', start: 1 }, d.pnf || {}); Object.assign(TOCO, { title: 'Contents', levels: 3, pn: true, right: true, leader: 'dots', manual: false }, d.toco || {});
    TC.locked = false; RESTRICT = null; setTrack(!!d.track); if (d.restrict) applyRestrict(d.restrict); else Office.setReadOnly && document.body.classList.contains('readonly') && Office.setReadOnly(false);
    styleCSS(); buildGallery(); renderFields(); closeHF(); listChanges();
  };
  return { TC, setTrack, setView, accept, reject, changesList, compareDialog, diffHTML, restrictPane, applyRestrict, stopRestrict, get RESTRICT() { return RESTRICT; }, applyStyle, modifyStyle, createStyle, stylesPane, setHF, openHF, closeHF, renderFields, pageCount, insertTOC, updateTOC, PNF, TOCO, HFO, adapter, buildRibbon, cmpN: 0, compareInfo: null, history: [], styleBy, selFor };
})();

WP.buildRibbon();
{ const _ld = runner.load; runner.load = (ex) => { if (ex && ex.onStart) ex.onStart(); _ld(ex); WP.history.length = 0; WP.compareInfo = null; if (ex && ex.after) ex.after(); }; }
// Old file menu replaced by the full backstage
if (typeof WORD_EXERCISES_PRO === 'function') runner.exercises.push(...WORD_EXERCISES_PRO());
Object.assign(api, {
  get FILE() { return Office.FILE; }, WP, L,
  changes: () => WP.changesList().map((x) => ({ type: x.tagName === 'INS' ? 'ins' : 'del', text: x.textContent, author: x.dataset.a })),
  styleOf(phrase) { const b = api.block(phrase); if (!b) return null; const st = ['Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Title', 'Subtitle', 'Quote', 'Intense Quote', 'No Spacing', 'List Paragraph', 'Normal'].find((n) => b.matches(WP.selFor(WP.styleBy(n).k))); return st || null; },
  hdr: () => $('#hdr'), ftr: () => $('#ftr'),
});
Office.init(WP.adapter, runner);
