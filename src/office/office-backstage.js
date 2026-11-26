// Full Office "File" backstage shared by Word / Excel / PowerPoint (English UI)
// Includes a simulated Windows file system, Save As / Open dialogs, Info > Protect, Print and Options.
const Office = (() => {
  const params = new URLSearchParams(location.search);
  const MODE = params.get('ex') ? 'practice' : 'free';
  const FILE = {};
  let A = null; // adapter of the current app
  const p2 = (n) => String(n).padStart(2, '0');
  const nowStr = (t = Date.now()) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${d.getHours() % 12 || 12}:${p2(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`; };

  function resetFile(name) {
    Object.keys(FILE).forEach((k) => delete FILE[k]);
    Object.assign(FILE, { name: name || A?.defaultName || 'Document1', savedAs: null, saves: [], folder: null, ext: null, password: '', modifyPassword: '', readOnlyRec: false, final: false, signed: false,
      print: null, exported: [], shared: null, emailed: null, props: { title: '', tags: '', comments: '', subject: '', author: Progress.student() || 'Student', company: '' }, created: Date.now(), inspected: false });
  }

  // ---------------- Simulated file system ----------------
  const FOLDERS = ['Desktop', 'Documents', 'Downloads', 'Pictures'];
  const FS = {
    all() { let d; try { d = JSON.parse(localStorage.getItem('thl.simfs') || 'null'); } catch {} if (!d || typeof d !== 'object') d = {}; FOLDERS.forEach((f) => (d[f] = d[f] || [])); return d; },
    put(folder, entry) {
      const d = this.all(); d[folder] = d[folder].filter((x) => x.name.toLowerCase() !== entry.name.toLowerCase()); d[folder].push(entry);
      try { localStorage.setItem('thl.simfs', JSON.stringify(d)); return true; } catch { toast('Not enough storage space to save this file. Delete old files in File > Open.', 'err', 4000); return false; }
    },
    remove(folder, name) { const d = this.all(); d[folder] = d[folder].filter((x) => x.name !== name); try { localStorage.setItem('thl.simfs', JSON.stringify(d)); } catch {} },
    find(folder, name) { return this.all()[folder].find((x) => x.name.toLowerCase() === name.toLowerCase()); },
    recent() { const d = this.all(); return FOLDERS.flatMap((f) => d[f].map((x) => ({ ...x, folder: f }))).sort((a, b) => b.at - a.at); },
  };
  const extOf = (n) => (/\.([a-z0-9]+)$/i.exec(n) || [])[1]?.toLowerCase() || '';
  const baseOf = (n) => n.replace(/\.[a-z0-9]+$/i, '');
  const icon = (ext) => ({ docx: 'W', docm: 'W', doc: 'W', dotx: 'W', rtf: 'W', txt: 'T', pdf: 'PDF', xps: 'XPS', xlsx: 'X', xlsm: 'X', xls: 'X', xltx: 'X', csv: 'CSV', pptx: 'P', pptm: 'P', ppt: 'P', ppsx: 'P', potx: 'P', mp4: '▶', png: '▣', jpg: '▣', html: '◎', odt: 'W', ods: 'X', odp: 'P' }[ext] || '□');
  const iconColor = (ext) => /^(docx|docm|doc|dotx|rtf|odt)$/.test(ext) ? '#185abd' : /^(xlsx|xlsm|xls|xltx|csv|ods)$/.test(ext) ? '#107c41' : /^(pptx|pptm|ppt|ppsx|potx|odp)$/.test(ext) ? '#c43e1c' : ext === 'pdf' ? '#d13438' : '#605e5c';
  const fileIcon = (ext, s = 28) => `<span class="ficon" style="width:${s}px;height:${s}px;background:${iconColor(ext)};font-size:${s * 0.38}px">${icon(ext)}</span>`;

  // ---------------- Windows-style Save As / Open dialog ----------------
  function winDialog({ mode, title, name = '', types, type, folder = 'Documents', showTools = true }) {
    return new Promise((resolve) => {
      let cur = folder; let opts = { password: FILE.password, modifyPassword: FILE.modifyPassword, readOnlyRec: FILE.readOnlyRec };
      const bg = document.createElement('div'); bg.className = 'modal-bg wdbg';
      bg.innerHTML = `<div class="wd">
        <div class="wdt"><span>${title}</span><b class="wdx">✕</b></div>
        <div class="wdbar"><button disabled>←</button><button disabled>→</button><button class="up">↑</button><div class="crumb"></div><input class="wsearch" placeholder="Search ${folder}"></div>
        <div class="wdcmd"><span>Organize ▾</span><span class="nf">New folder</span></div>
        <div class="wdmain"><div class="wdnav"><div class="hd">★ Quick access</div>${FOLDERS.map((f) => `<div data-f="${f}">${{ Desktop: '🖥', Documents: '📄', Downloads: '⬇', Pictures: '🖼' }[f]} ${f}</div>`).join('')}<div class="hd">💻 This PC</div><div data-f="Documents">  Local Disk (C:)</div></div>
          <div class="wdlist"></div></div>
        <div class="wdform">
          <label>File name:</label><input class="fname" value="${escapeHtml(name)}" spellcheck="false">
          ${mode === 'save' ? `<label>Save as type:</label><select class="ftype">${types.map((t) => `<option value="${t.ext}" ${t.ext === type ? 'selected' : ''}>${t.label}</option>`).join('')}</select>
          <label>Authors:</label><span class="meta">${escapeHtml(FILE.props?.author || 'Student')}</span>` : `<label>Type:</label><select class="ftype"><option value="*">All ${A.app} files</option>${types.map((t) => `<option value="${t.ext}">${t.label}</option>`).join('')}</select>`}
        </div>
        <div class="wdbtns">${mode === 'save' && showTools ? '<button class="btn tools">Tools ▾</button>' : ''}<span style="flex:1"></span><button class="btn primary ok">${mode === 'save' ? 'Save' : 'Open'}</button><button class="btn cancel">Cancel</button></div></div>`;
      document.body.appendChild(bg);
      const list = bg.querySelector('.wdlist'), fname = bg.querySelector('.fname'), ftype = bg.querySelector('.ftype');
      const exts = types.map((t) => t.ext);
      const draw = () => {
        bg.querySelector('.crumb').innerHTML = `💻 This PC <i>›</i> ${cur}`;
        bg.querySelectorAll('.wdnav [data-f]').forEach((n) => n.classList.toggle('on', n.dataset.f === cur && !n.textContent.includes('Local')));
        const q = bg.querySelector('.wsearch').value.trim().toLowerCase();
        const files = FS.all()[cur].filter((f) => (mode === 'save' || ftype.value === '*' ? exts.includes(extOf(f.name)) || mode === 'save' : extOf(f.name) === ftype.value) && (!q || f.name.toLowerCase().includes(q)));
        list.innerHTML = `<div class="lh"><span>Name</span><span>Date modified</span><span>Type</span><span>Size</span></div>` + (files.length ? files.map((f) => `<div class="li" data-n="${escapeHtml(f.name)}">${fileIcon(extOf(f.name), 18)}<span>${escapeHtml(f.name)}</span><span>${nowStr(f.at)}</span><span>${typeLabel(extOf(f.name))}</span><span>${f.size || '1 KB'}</span></div>`).join('') : '<div class="none">No items match your search.</div>');
        list.querySelectorAll('.li').forEach((li) => {
          li.onclick = () => { list.querySelectorAll('.li').forEach((x) => x.classList.remove('on')); li.classList.add('on'); fname.value = mode === 'save' ? baseOf(li.dataset.n) : li.dataset.n; };
          li.ondblclick = () => { fname.value = mode === 'save' ? baseOf(li.dataset.n) : li.dataset.n; ok(); };
        });
      };
      const close = (v) => { bg.remove(); resolve(v); };
      const ok = async () => {
        let n = fname.value.trim(); if (!n) return;
        if (/[\\/:*?"<>|]/.test(n)) return msgBox('The file name is not valid.', 'File name');
        if (mode === 'save') {
          const ext = ftype.value; n = extOf(n) === ext ? n : baseOf(n) + '.' + ext;
          if (FS.find(cur, n)) { const r = await modal(`<h3>Confirm Save As</h3><p>${escapeHtml(n)} already exists.<br>Do you want to replace it?</p>`, [['No'], ['Yes', 'primary']]); if (r.i !== 1) return; }
          close({ folder: cur, name: n, ext, opts });
        } else {
          const f = FS.find(cur, n) || FS.find(cur, n + '.' + (ftype.value === '*' ? exts[0] : ftype.value));
          if (!f) return msgBox(`${escapeHtml(n)}\nFile not found.\nCheck the file name and try again.`, title);
          close({ folder: cur, file: f });
        }
      };
      bg.querySelectorAll('.wdnav [data-f]').forEach((n) => (n.onclick = () => { cur = n.dataset.f; draw(); }));
      bg.querySelector('.up').onclick = () => {};
      bg.querySelector('.wsearch').oninput = draw; ftype.onchange = () => { if (mode === 'save' && fname.value) fname.value = baseOf(fname.value); draw(); };
      bg.querySelector('.ok').onclick = ok; bg.querySelector('.cancel').onclick = () => close(null); bg.querySelector('.wdx').onclick = () => close(null);
      bg.querySelector('.nf').onclick = () => toast('New folders are not available in the simulator.', 'info');
      fname.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ok(); } if (e.key === 'Escape') close(null); });
      const tools = bg.querySelector('.tools');
      if (tools) tools.onclick = () => dropdown(tools, '<div class="it" data-v="net">Map Network Drive...</div><div class="it" data-v="web">Web Options...</div><div class="it" data-v="gen">General Options...</div><div class="it" data-v="pic">Compress Pictures...</div>', async (v) => {
        if (v !== 'gen') return toast('This option is not available in the simulator.', 'info');
        const r = await modal(`<h3>General Options</h3><p style="color:#616161">File encryption options for this document</p><p>Password to open: <input type="password" class="rs" value="${escapeHtml(opts.password)}"></p><p style="color:#616161">File sharing options for this document</p><p>Password to modify: <input type="password" class="rs" value="${escapeHtml(opts.modifyPassword)}"></p><p><label><input type="checkbox" ${opts.readOnlyRec ? 'checked' : ''}> Read-only recommended</label></p>`, [['Cancel'], ['OK', 'primary']]);
        if (r.i !== 1) return;
        if (r.v[0] && r.v[0] !== opts.password) { const c = await confirmPassword('open'); if (c !== r.v[0]) return msgBox('The confirmation password is not identical.', 'Confirm Password'); }
        if (r.v[1] && r.v[1] !== opts.modifyPassword) { const c = await confirmPassword('modify'); if (c !== r.v[1]) return msgBox('The confirmation password is not identical.', 'Confirm Password'); }
        opts = { password: r.v[0], modifyPassword: r.v[1], readOnlyRec: r.v[2] };
      });
      draw(); setTimeout(() => { fname.focus(); fname.select(); }, 40);
    });
  }
  async function confirmPassword(kind) {
    const r = await modal(`<h3>Confirm Password</h3><p>Reenter password to ${kind}:</p><input type="password" class="rs" style="width:100%;height:28px"><p style="color:#616161;font-size:12px">Caution: If you lose or forget the password, it cannot be recovered. Remember that passwords are case-sensitive.</p>`, [['Cancel'], ['OK', 'primary']]);
    return r.i === 1 ? r.v[0] : null;
  }
  const msgBox = (text, title = 'Microsoft ' + (A?.app || 'Office')) => modal(`<h3>${escapeHtml(title)}</h3><p style="white-space:pre-line">${text}</p>`, [['OK', 'primary']]);
  function typeLabel(ext) { const t = (A?.formats || []).find((f) => f.ext === ext); return t ? t.label.replace(/\s*\(\*\.[^)]*\)/, '') : ext.toUpperCase() + ' File'; }

  // ---------------- Saving & opening ----------------
  async function writeFile({ folder, name, ext, opts }) {
    const fmt = (A.formats || []).find((f) => f.ext === ext) || {};
    if (A.beforeSave) { const ok = await A.beforeSave(ext); if (ok === false) return false; }
    if (opts) Object.assign(FILE, { password: opts.password || '', modifyPassword: opts.modifyPassword || '', readOnlyRec: !!opts.readOnlyRec });
    const data = A.serialize();
    const entry = { name, app: A.app, data: fmt.export ? null : data, password: FILE.password, modifyPassword: FILE.modifyPassword, readOnlyRec: FILE.readOnlyRec, final: FILE.final, props: FILE.props, at: Date.now(), size: Math.max(1, Math.round(JSON.stringify(data).length / 1024)) + ' KB' };
    if (!FS.put(folder, entry)) return false;
    FILE.saves.push({ folder, name, ext, at: Date.now(), password: FILE.password });
    if (fmt.export) { FILE.exported.push({ folder, name, ext }); toast(`Published ${name} to ${folder}.`, 'ok'); return true; }
    FILE.savedAs = { folder, name, ext }; FILE.folder = folder; FILE.ext = ext; FILE.name = baseOf(name);
    A.setName(baseOf(name)); toast(`Saved to ${folder} › ${name}`, 'ok');
    return true;
  }
  async function saveAs(defType) {
    const r = await winDialog({ mode: 'save', title: 'Save As', name: FILE.name, types: A.formats, type: defType || FILE.ext || A.formats[0].ext, folder: FILE.folder || 'Documents' });
    if (r) { await writeFile(r); closeBackstage(); }
  }
  async function save() {
    if (!FILE.savedAs) return saveAs();
    await writeFile({ ...FILE.savedAs, opts: null }); closeBackstage();
  }
  async function openEntry(folder, f) {
    if (f.app && f.app !== A.app) return msgBox(`${A.app} cannot open "${escapeHtml(f.name)}" because the file format or file extension is not valid.`);
    if (!f.data) return msgBox(`${escapeHtml(f.name)} was exported as ${extOf(f.name).toUpperCase()} and can't be edited in ${A.app}.`);
    if (f.password) {
      const r = await modal(`<h3>Password</h3><p>Enter password to open file<br>${escapeHtml(f.name)}</p><input type="password" class="rs" style="width:100%;height:28px">`, [['Cancel'], ['OK', 'primary']]);
      if (r.i !== 1) return;
      if (r.v[0] !== f.password) return msgBox('The password you supplied is not correct. Verify that the CAPS LOCK key is off and be sure to use the correct capitalization.');
    }
    let readOnly = false;
    if (f.modifyPassword) {
      const r = await modal(`<h3>Password</h3><p>'${escapeHtml(f.name)}' is reserved by ${escapeHtml(f.props?.author || 'Student')}</p><p>Enter password for write access, or open read only.</p><input type="password" class="rs" style="width:100%;height:28px">`, [['Cancel'], ['Read Only'], ['OK', 'primary']]);
      if (r.i === 0) return; if (r.i === 1) readOnly = true; else if (r.v[0] !== f.modifyPassword) return msgBox('The password you supplied is not correct.');
    } else if (f.readOnlyRec) {
      const r = await modal(`<h3>Microsoft ${A.app}</h3><p>The author would like you to open this as read-only unless you need to make changes. Open as read-only?</p>`, [['Cancel'], ['No'], ['Yes', 'primary']]);
      if (r.i === 0) return; readOnly = r.i === 2;
    }
    A.load(JSON.parse(JSON.stringify(f.data)));
    resetFile(baseOf(f.name));
    Object.assign(FILE, { savedAs: { folder, name: f.name, ext: extOf(f.name) }, folder, ext: extOf(f.name), password: f.password || '', modifyPassword: f.modifyPassword || '', readOnlyRec: !!f.readOnlyRec, final: !!f.final, props: { ...FILE.props, ...(f.props || {}) } });
    A.setName(baseOf(f.name)); setReadOnly(readOnly || FILE.final, FILE.final ? 'final' : readOnly ? 'readonly' : null);
    closeBackstage(); toast('Opened ' + f.name, 'ok');
  }
  async function browseOpen() {
    const r = await winDialog({ mode: 'open', title: 'Open', types: A.formats.filter((f) => !f.export), folder: FILE.folder || 'Documents' });
    if (r) openEntry(r.folder, r.file);
  }

  // ---------------- Read-only bar (Mark as Final / Restrict / Read-only) ----------------
  function setReadOnly(on, kind) {
    $('#robar')?.remove();
    A.setReadOnly?.(!!on);
    document.body.classList.toggle('readonly', !!on);
    if (!on) return;
    const msg = { final: ['MARKED AS FINAL', `An author has marked this ${A.noun} as final to discourage editing.`], readonly: ['READ-ONLY', `This ${A.noun} was opened as read-only. To save changes, save a copy.`], restrict: ['RESTRICTED EDITING', `This ${A.noun} is protected from unintentional editing. You may only view this region.`] }[kind] || ['READ-ONLY', ''];
    const bar = document.createElement('div'); bar.id = 'robar';
    bar.innerHTML = `<b>${msg[0]}</b><span>${msg[1]}</span>${kind === 'restrict' ? '<button>Stop Protection</button>' : '<button>Edit Anyway</button>'}`;
    $('#ribbon').after(bar);
    bar.querySelector('button').onclick = async () => {
      if (kind === 'restrict') { if (A.stopRestrict && (await A.stopRestrict()) === false) return; }
      if (kind === 'final') FILE.final = false;
      setReadOnly(false);
    };
  }

  // ---------------- Backstage ----------------
  let bsEl = null;
  function closeBackstage() { if (bsEl) { bsEl.remove(); bsEl = null; } }
  const NAV = [['home', 'Home', '⌂'], ['new', 'New', '🗋'], ['open', 'Open', '📂'], ['-'], ['info', 'Info'], ['save', 'Save'], ['saveas', 'Save As'], ['print', 'Print'], ['share', 'Share'], ['export', 'Export'], ['close', 'Close'], ['--'], ['account', 'Account'], ['options', 'Options']];
  function openBackstage(page = 'info') {
    closeDropdown(); closeBackstage();
    A.beforeBackstage?.();
    bsEl = document.createElement('div'); bsEl.id = 'backstage'; bsEl.className = 'bs2';
    bsEl.innerHTML = `<div class="bs-nav"><div class="back" title="Back">⟵</div>${NAV.map(([k, l, ic]) => k === '-' ? '<i class="sep"></i>' : k === '--' ? '<span class="grow"></span>' : `<div data-k="${k}">${ic ? `<em>${ic}</em>` : ''}${l}</div>`).join('')}${MODE === 'practice' ? '' : '<div data-k="exit" class="exit">Office Home</div>'}</div><div class="bs-body"></div>`;
    document.body.appendChild(bsEl);
    bsEl.querySelector('.back').onclick = closeBackstage;
    bsEl.querySelectorAll('.bs-nav [data-k]').forEach((n) => (n.onclick = () => show(n.dataset.k)));
    show(page);
  }
  async function show(k) {
    if (!bsEl || !bsEl.isConnected) return;
    if (k === 'exit') { location.href = 'index.html'; return; }
    if (k === 'save') return save();
    if (k === 'close') return closeDoc();
    if (k === 'options') return optionsDialog();
    bsEl.querySelectorAll('.bs-nav [data-k]').forEach((n) => n.classList.toggle('on', n.dataset.k === k));
    const b = bsEl.querySelector('.bs-body'); b.innerHTML = ''; b.className = 'bs-body p-' + k;
    PAGES[k](b);
  }
  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
  const recentList = (files) => files.length ? `<div class="rlist"><div class="rh"><span>Name</span><span>Date modified</span></div>${files.map((f, i) => `<div class="rf" data-i="${i}">${fileIcon(extOf(f.name))}<div><b>${escapeHtml(f.name)}</b><small>This PC › ${f.folder}</small></div><span>${nowStr(f.at)}</span>${f.password ? '<span class="lock" title="Password protected">🔒</span>' : ''}</div>`).join('')}</div>` : '<p class="muted">You haven\'t opened any files recently. To browse for a file, start by clicking on Browse.</p>';
  function bindRecent(b, files) { b.querySelectorAll('.rf').forEach((r) => (r.onclick = () => { const f = files[+r.dataset.i]; openEntry(f.folder, f); })); }
  const templateCards = () => [{ name: A.blankName, blank: true }, ...(A.templates || [])].map((t, i) => `<div class="tpl" data-i="${i}"><div class="tth">${t.thumb || ''}</div><span>${t.name}</span></div>`).join('');
  function bindTemplates(b) {
    const list = [{ blank: true }, ...(A.templates || [])];
    b.querySelectorAll('.tpl').forEach((t) => (t.onclick = async () => {
      if (MODE === 'practice') { const r = await modal('<h3>Leave the project?</h3><p>Creating a new file will replace the project you are working on.</p>', [['Cancel'], ['Continue', 'primary']]); if (r.i !== 1) return; }
      const x = list[+t.dataset.i]; x.blank ? A.newBlank() : x.load(); resetFile(A.defaultName); A.setName(A.defaultName); setReadOnly(false); closeBackstage();
    }));
  }
  const PAGES = {
    home(b) {
      const files = FS.recent().filter((f) => f.app === A.app).slice(0, 8);
      b.innerHTML = `<h1>${greet()}</h1><div class="tplrow">${templateCards()}</div><div class="more"><a data-go="new">More templates →</a></div>
        <div class="tabs2"><b>Recent</b><span>Pinned</span><span>Shared with Me</span></div>${recentList(files)}<div class="more"><a data-go="open">More documents →</a></div>`;
      bindTemplates(b); bindRecent(b, files); b.querySelectorAll('[data-go]').forEach((a) => (a.onclick = () => show(a.dataset.go)));
    },
    new(b) { b.innerHTML = `<h1>New</h1><input class="bsearch" placeholder="Search for online templates"><div class="tplgrid">${templateCards()}</div>`; bindTemplates(b); },
    open(b) {
      const files = FS.recent().filter((f) => f.app === A.app);
      b.innerHTML = `<h1>Open</h1><div class="two"><div class="places"><div class="on">🕘 Recent</div><div>👥 Shared with Me</div><div class="hd">Other locations</div><div data-a="pc">💻 This PC</div><div data-a="browse">📁 Browse</div></div>
        <div class="pane"><input class="bsearch" placeholder="Search"><div class="tabs2"><b>${A.noun[0].toUpperCase() + A.noun.slice(1)}s</b><span>Folders</span></div>${recentList(files)}</div></div>`;
      bindRecent(b, files);
      b.querySelectorAll('.places [data-a]').forEach((p) => (p.onclick = () => browseOpen()));
    },
    info(b) {
      const st = A.stats ? A.stats() : [];
      const prot = [];
      if (FILE.password) prot.push('A password is required to open this ' + A.noun + '.');
      if (FILE.modifyPassword) prot.push('A password is required to modify this ' + A.noun + '.');
      if (FILE.readOnlyRec) prot.push('This ' + A.noun + ' has been set to open as read-only by default.');
      if (FILE.final) prot.push('This ' + A.noun + ' has been marked as final to discourage editing.');
      if (A.protectState) prot.push(...A.protectState());
      b.innerHTML = `<h1>Info</h1><div class="docpath"><b>${escapeHtml(FILE.name)}</b><span>${FILE.savedAs ? 'This PC » ' + FILE.savedAs.folder : 'This file has not been saved yet.'}</span></div>
        <div class="info2"><div class="tiles">
          ${tile('protect', '🔒', 'Protect<br>' + A.Noun, 'Protect ' + A.Noun, prot.length ? prot.map((x) => `<div class="warnline">${x}</div>`).join('') : `Control what types of changes people can make to this ${A.noun}.`, prot.length)}
          ${tile('inspect', '🔍', 'Check for<br>Issues', 'Inspect ' + A.Noun, `Before publishing this file, be aware that it contains:<ul><li>Document properties and author's name</li>${A.issues ? A.issues().map((x) => `<li>${x}</li>`).join('') : ''}</ul>`)}
          ${tile('versions', '🕘', 'Version<br>History', 'Version History', 'View and restore previous versions.')}
          ${tile('manage', '🗂', 'Manage<br>' + A.Noun, 'Manage ' + A.Noun, 'There are no unsaved changes.')}
        </div>
        <div class="props"><h3>Properties ▾</h3>${st.map(([k, v]) => `<div class="pr"><span>${k}</span><span>${v}</span></div>`).join('')}
          ${['title', 'tags', 'comments'].map((k) => `<div class="pr"><span>${k[0].toUpperCase() + k.slice(1)}</span><input data-p="${k}" placeholder="Add ${k === 'tags' ? 'a tag' : k === 'title' ? 'a title' : 'comments'}" value="${escapeHtml(FILE.props[k] || '')}"></div>`).join('')}
          <h3>Related Dates</h3><div class="pr"><span>Last Modified</span><span>${FILE.saves.length ? nowStr(FILE.saves[FILE.saves.length - 1].at) : ''}</span></div><div class="pr"><span>Created</span><span>${nowStr(FILE.created)}</span></div>
          <h3>Related People</h3><div class="pr"><span>Author</span><span class="person"><i>${escapeHtml((FILE.props.author || 'S')[0])}</i>${escapeHtml(FILE.props.author)}</span></div></div></div>`;
      b.querySelectorAll('[data-p]').forEach((i) => i.addEventListener('change', () => (FILE.props[i.dataset.p] = i.value)));
      b.querySelectorAll('.tile').forEach((t) => (t.onclick = () => tileMenu(t.dataset.t, t)));
    },
    saveas(b) {
      const d = FS.all();
      b.innerHTML = `<h1>Save As</h1><div class="two"><div class="places"><div>🕘 Recent</div><div class="dim">☁ OneDrive - Personal</div><div class="on">💻 This PC</div><div class="dim">➕ Add a Place</div><div data-a="browse">📁 Browse</div></div>
        <div class="pane"><div class="crumb2">↑ 📁 ${FILE.folder || 'Documents'}</div><div class="saverow"><input class="fn" value="${escapeHtml(FILE.name)}" spellcheck="false"><button class="btn primary sv">💾 Save</button></div>
        <select class="ft">${A.formats.map((f) => `<option value="${f.ext}" ${f.ext === (FILE.ext || A.formats[0].ext) ? 'selected' : ''}>${f.label}</option>`).join('')}</select><div class="moreopt"><a data-a="browse">More options...</a></div>
        <div class="flist"><div class="rh"><span>Name ↑</span><span>Date modified</span></div>${(d[FILE.folder || 'Documents']).map((f) => `<div class="rf">${fileIcon(extOf(f.name), 22)}<div><b>${escapeHtml(f.name)}</b></div><span>${nowStr(f.at)}</span></div>`).join('') || '<p class="muted">This folder is empty.</p>'}</div></div></div>`;
      b.querySelectorAll('[data-a=browse]').forEach((x) => (x.onclick = () => saveAs(b.querySelector('.ft').value)));
      const go = async () => {
        const ext = b.querySelector('.ft').value; const n = baseOf(b.querySelector('.fn').value.trim() || FILE.name) + '.' + ext; const folder = FILE.folder || 'Documents';
        if (FS.find(folder, n)) { const r = await modal(`<h3>Confirm Save As</h3><p>${escapeHtml(n)} already exists.<br>Do you want to replace it?</p>`, [['No'], ['Yes', 'primary']]); if (r.i !== 1) return; }
        if (await writeFile({ folder, name: n, ext, opts: null })) closeBackstage();
      };
      b.querySelector('.sv').onclick = go; b.querySelector('.fn').addEventListener('keydown', (e) => e.key === 'Enter' && go());
    },
    print(b) {
      const P = Object.assign({ copies: 1, printer: 'Microsoft Print to PDF', what: 'all', pages: '', sides: 'one', collate: true, orient: A.orient ? A.orient() : 'portrait', paper: 'Letter', margins: 'Normal Margins', perSheet: 1, scaling: 'No Scaling', layout: 'Full Page Slides', color: 'Color' }, A.printDefaults ? A.printDefaults() : {});
      const whatOpts = A.printWhat || [['all', 'Print All Pages', 'The whole thing'], ['current', 'Print Current Page', 'Just this page'], ['custom', 'Custom Print', 'Type specific pages, sections or ranges']];
      const sel = (key, opts) => `<select data-k="${key}">${opts.map((o) => { const [v, t, s] = Array.isArray(o) ? o : [o, o]; return `<option value="${v}" ${String(P[key]) === String(v) ? 'selected' : ''}>${t}${s ? ' — ' + s : ''}</option>`; }).join('')}</select>`;
      b.innerHTML = `<h1>Print</h1><div class="printwrap"><div class="pset">
        <div class="prow"><button class="btn primary bigprint">🖨<br>Print</button><label>Copies: <input type="number" min="1" max="99" value="${P.copies}" data-k="copies" class="rs" style="width:60px"></label></div>
        <h4>Printer</h4>${sel('printer', ['Microsoft Print to PDF', 'HP LaserJet Pro (Computer Lab)', 'Canon PIXMA (Library)', 'OneNote (Desktop)'])}<a class="pp">Printer Properties</a>
        <h4>Settings</h4>${sel('what', whatOpts)}<div class="pagesrow"><label>${A.app === 'PowerPoint' ? 'Slides' : 'Pages'}: <input data-k="pages" class="rs" value="${escapeHtml(P.pages)}" placeholder="e.g. 1-3, 5" style="width:150px"></label></div>
        ${A.app === 'PowerPoint' ? sel('layout', ['Full Page Slides', 'Notes Pages', 'Outline', '1 Slide Handouts', '2 Slides Handouts', '3 Slides Handouts', '6 Slides Horizontal']) : ''}
        ${sel('sides', [['one', 'Print One Sided', 'Only print on one side of the page'], ['both', 'Print on Both Sides', 'Flip pages on long edge'], ['manual', 'Manually Print on Both Sides', 'Reload paper when prompted']])}
        ${sel('collate', [['true', 'Collated', '1,2,3  1,2,3  1,2,3'], ['false', 'Uncollated', '1,1,1  2,2,2  3,3,3']])}
        ${A.app !== 'PowerPoint' ? sel('orient', [['portrait', 'Portrait Orientation'], ['landscape', 'Landscape Orientation']]) + sel('paper', ['Letter', 'Legal', 'A4', 'A5']) + sel('margins', ['Normal Margins', 'Narrow Margins', 'Moderate Margins', 'Wide Margins']) : sel('color', ['Color', 'Grayscale', 'Pure Black and White'])}
        ${A.app === 'Word' ? sel('perSheet', [['1', '1 Page Per Sheet'], ['2', '2 Pages Per Sheet'], ['4', '4 Pages Per Sheet']]) : ''}
        ${A.app === 'Excel' ? sel('scaling', ['No Scaling', 'Fit Sheet on One Page', 'Fit All Columns on One Page', 'Fit All Rows on One Page']) : ''}
        <a class="pp" data-a="setup">Page Setup</a></div>
        <div class="ppreview"><div class="pvbox"></div><div class="pvnav"><span>◀</span><span class="pvn">1</span> of <span class="pvt">1</span><span>▶</span><span class="sp"></span><span>${A.app === 'PowerPoint' ? '' : '⊞ Zoom to Page'}</span></div></div></div>`;
      const pv = b.querySelector('.pvbox');
      const read = () => { b.querySelectorAll('[data-k]').forEach((x) => { let v = x.value; if (x.dataset.k === 'copies') v = Math.max(1, +v || 1); if (x.dataset.k === 'collate') v = v === 'true'; if (x.dataset.k === 'perSheet') v = +v; P[x.dataset.k] = v; }); };
      const draw = () => { read(); b.querySelector('.pagesrow').style.display = P.what === 'custom' ? '' : 'none'; pv.innerHTML = ''; const n = A.printPreview ? A.printPreview(pv, P) : 1; b.querySelector('.pvt').textContent = n; b.querySelector('.pvn').textContent = n ? 1 : 0; };
      b.querySelectorAll('[data-k]').forEach((x) => x.addEventListener('change', () => { draw(); if (x.dataset.k === 'orient' && A.setOrient) A.setOrient(x.value); }));
      b.querySelector('[data-a=setup]').onclick = () => A.pageSetup ? A.pageSetup() : toast('Page Setup is available on the Layout tab.', 'info');
      b.querySelector('.bigprint').onclick = () => {
        read();
        if (P.what === 'custom' && !/^\s*\d+(\s*-\s*\d+)?(\s*,\s*\d+(\s*-\s*\d+)?)*\s*$/.test(P.pages)) return msgBox(`The page range you entered is not valid. Type page numbers and/or page ranges separated by commas, for example: 1,3,5-12.`);
        FILE.print = { ...P, at: Date.now() };
        closeBackstage();
        toast(`Printing ${P.copies} cop${P.copies > 1 ? 'ies' : 'y'} on ${P.printer}…`, 'ok', 3200);
      };
      draw();
    },
    share(b) {
      b.innerHTML = `<h1>Share</h1><div class="two"><div class="places"><div class="on">👥 Share with People</div><div data-e="mail">✉ Email</div></div><div class="pane sharepane">
        <h3>Share with People</h3><p class="muted">Step 1: Save your ${A.noun} to a OneDrive location. Step 2: Invite people.</p><p><input class="rs em" placeholder="Enter a name or email address" style="width:360px;height:30px"></p>
        <p><select class="rs perm"><option>Can edit</option><option>Can view</option></select></p><p><textarea class="rs msg" placeholder="Include a personal message with the invitation" style="width:360px;height:70px"></textarea></p><button class="btn primary shbtn">Share</button>
        <h3 style="margin-top:30px">Email</h3><div class="mrow"><button class="btn" data-m="att">📎 Send as Attachment</button><button class="btn" data-m="pdf">📕 Send as PDF</button><button class="btn" data-m="link">🔗 Send a Link</button></div></div></div>`;
      b.querySelector('.shbtn').onclick = () => { const e = b.querySelector('.em').value.trim(); if (!/\S+@\S+\.\S+/.test(e)) return msgBox('Type a valid email address, for example: name@school.edu.vn'); FILE.shared = { to: e, perm: b.querySelector('.perm').value, msg: b.querySelector('.msg').value }; toast('Invitation sent to ' + e, 'ok'); closeBackstage(); };
      b.querySelectorAll('[data-m]').forEach((x) => (x.onclick = async () => { const r = await modal(`<h3>New Email</h3><p>To: <input class="rs" style="width:280px" placeholder="name@school.edu.vn"></p><p>Subject: <b>${escapeHtml(FILE.name)}</b></p><p class="muted">Attachment: ${escapeHtml(FILE.name)}.${x.dataset.m === 'pdf' ? 'pdf' : A.formats[0].ext}</p>`, [['Cancel'], ['Send', 'primary']]); if (r.i === 1 && r.v[0]) { FILE.emailed = { to: r.v[0], as: x.dataset.m }; toast('Email sent.', 'ok'); } }));
    },
    export(b) {
      const types = A.formats.filter((f) => !f.hideInExport);
      b.innerHTML = `<h1>Export</h1><div class="two"><div class="places"><div class="on" data-x="pdf">📕 Create PDF/XPS Document</div><div data-x="type">🔁 Change File Type</div>${A.app === 'PowerPoint' ? '<div data-x="video">🎬 Create a Video</div>' : ''}<div data-x="dl">⬇ Download a Copy (TinHocLab)</div></div><div class="pane xpane"></div></div>`;
      const pane = b.querySelector('.xpane');
      const tab = (x) => {
        b.querySelectorAll('[data-x]').forEach((d) => d.classList.toggle('on', d.dataset.x === x));
        if (x === 'pdf') { pane.innerHTML = `<h3>Create a PDF/XPS Document</h3><ul><li>Preserves layout, formatting, fonts, and images</li><li>Content can't be easily changed</li><li>Free viewers are available on the web</li></ul><button class="btn primary big2">📕<br>Create PDF/XPS</button>`; pane.querySelector('button').onclick = () => saveAs('pdf'); }
        if (x === 'type') { pane.innerHTML = `<h3>Change File Type</h3><div class="ftypes">${types.map((t) => `<div data-t="${t.ext}">${fileIcon(t.ext, 26)}<div><b>${t.label.replace(/\s*\(.*\)/, '')}</b><small>${t.desc || '*.' + t.ext}</small></div></div>`).join('')}</div><button class="btn primary big2 sa">💾<br>Save As</button>`; let pick = types[0].ext; pane.querySelectorAll('[data-t]').forEach((d) => (d.onclick = () => { pane.querySelectorAll('[data-t]').forEach((e) => e.classList.remove('on')); d.classList.add('on'); pick = d.dataset.t; })); pane.querySelector('[data-t]').classList.add('on'); pane.querySelector('.sa').onclick = () => saveAs(pick); }
        if (x === 'video') { pane.innerHTML = `<h3>Create a Video</h3><p>Save your presentation as a video that you can burn to a disc, upload to the web, or email.</p><p><select class="rs"><option>Full HD (1080p)</option><option>HD (720p)</option><option>Standard (480p)</option></select></p><p><select class="rs"><option>Don't Use Recorded Timings and Narrations</option></select></p><p>Seconds spent on each slide: <input class="rs" value="05.00" style="width:60px"></p><button class="btn primary big2">🎬<br>Create Video</button>`; pane.querySelector('button').onclick = () => saveAs('mp4'); }
        if (x === 'dl') { pane.innerHTML = `<h3>Download a copy to this computer</h3><p>Saves a real file (.${A.nativeExt}) that you can open again in TinHocLab on any computer.</p><button class="btn primary big2">⬇<br>Download</button>`; pane.querySelector('button').onclick = () => A.download(); }
      };
      b.querySelectorAll('[data-x]').forEach((d) => (d.onclick = () => tab(d.dataset.x))); tab('pdf');
    },
    account(b) {
      const name = Progress.student() || 'Student';
      b.innerHTML = `<h1>Account</h1><div class="two acc"><div><h3>User Information</h3><div class="user2"><i>${escapeHtml(name.trim().split(/\s+/).map((w) => w[0]).slice(-2).join('').toUpperCase())}</i><div><b>${escapeHtml(name)}</b><small>student@tinhoclab.local</small><a>Sign out</a></div></div>
        <h3>Office Background</h3><select class="rs"><option>No Background</option><option>Circles and Stripes</option><option>Clouds</option></select><h3>Office Theme</h3><select class="rs thm"><option value="">Colorful</option><option value="dark">Dark Gray</option><option value="white">White</option></select></div>
        <div><h3>Product Information</h3><div class="prod"><b>Microsoft 365 Simulator</b><p>TinHocLab practice edition. This product contains Word, Excel and PowerPoint simulators for classroom practice.</p><p class="muted">Not affiliated with Microsoft.</p></div></div></div>`;
      const thm = b.querySelector('.thm'); thm.value = localStorage.getItem('thl.offtheme') || ''; thm.onchange = () => { localStorage.setItem('thl.offtheme', thm.value); applyTheme(); };
    },
  };
  function tile(t, ic, label, title, desc, warn) { return `<div class="tile ${warn ? 'warn' : ''}" data-t="${t}"><div class="tbtn"><span>${ic}</span><small>${label} ▾</small></div><div class="tdesc"><b>${title}</b><div>${desc}</div></div></div>`; }
  function tileMenu(t, el) {
    const anchor = el.querySelector('.tbtn');
    if (t === 'protect') {
      const items = [['ro', '📖', 'Always Open Read-Only', 'Prevent accidental changes by asking readers to opt-in to editing.'], ['enc', '🔑', 'Encrypt with Password', 'Password-protect this ' + A.noun + '.'], ...(A.protectItems || []), ['sig', '✍', 'Add a Digital Signature', 'Ensure the integrity of the ' + A.noun + ' by adding an invisible digital signature.'], ['final', '🏁', 'Mark as Final', 'Let readers know the ' + A.noun + ' is final.']];
      dropdown(anchor, items.map(([k, ic, n, d]) => `<div class="it big" data-v="${k}"><span class="bi">${ic}</span><div><b>${n}</b><small>${d}</small></div></div>`).join(''), protectAction);
    } else if (t === 'inspect') dropdown(anchor, `<div class="it big" data-v="inspect"><span class="bi">🔍</span><div><b>Inspect ${A.Noun}</b><small>Check the ${A.noun} for hidden properties or personal information.</small></div></div><div class="it big" data-v="access"><span class="bi">♿</span><div><b>Check Accessibility</b><small>Check the ${A.noun} for content that people with disabilities might find difficult to read.</small></div></div><div class="it big" data-v="compat"><span class="bi">🔁</span><div><b>Check Compatibility</b><small>Check for features not supported by earlier versions.</small></div></div>`, inspectAction);
    else if (t === 'versions') modal(`<h3>Version History</h3>${FILE.saves.length ? FILE.saves.slice().reverse().map((s) => `<p>${nowStr(s.at)} — ${escapeHtml(s.name)} (${s.folder})</p>`).join('') : '<p>Versions appear after you save this file.</p>'}`);
    else if (t === 'manage') dropdown(anchor, '<div class="it big" data-v="rec"><span class="bi">♻</span><div><b>Recover Unsaved ' + A.Noun + 's</b><small>Browse recent copies of unsaved files.</small></div></div>', () => modal('<h3>Recover Unsaved Files</h3><p>There are no unsaved files to recover.</p>'));
  }
  async function protectAction(k) {
    if (k === 'ro') { FILE.readOnlyRec = !FILE.readOnlyRec; toast(FILE.readOnlyRec ? 'This file will open as read-only by default.' : 'Read-only recommendation removed.', 'ok'); }
    else if (k === 'enc') {
      const r = await modal(`<h3>Encrypt ${A.Noun}</h3><p style="color:#616161">Encrypt the contents of this file</p><p>Password:</p><input type="password" class="rs" style="width:100%;height:28px" value="${escapeHtml(FILE.password)}"><p style="color:#616161;font-size:12px">Caution: If you lose or forget the password, it cannot be recovered. It is advisable to keep a list of passwords and their corresponding document names in a safe place. (Remember that passwords are case-sensitive.)</p>`, [['Cancel'], ['OK', 'primary']]);
      if (r.i !== 1) return;
      if (!r.v[0]) { FILE.password = ''; toast('Password removed.', 'info'); }
      else { const c = await confirmPassword('open'); if (c === null) return; if (c !== r.v[0]) return msgBox('The confirmation password is not identical.', 'Confirm Password'); FILE.password = r.v[0]; }
    } else if (k === 'sig') return msgBox('To sign a Microsoft Office document, you need a digital ID. The simulator cannot create digital IDs.');
    else if (k === 'final') {
      const r = await modal(`<h3>Microsoft ${A.app}</h3><p>This ${A.noun} will be marked as final and then saved.</p>`, [['Cancel'], ['OK', 'primary']]);
      if (r.i !== 1) return;
      FILE.final = true; if (FILE.savedAs) await writeFile({ ...FILE.savedAs, opts: null });
      await modal(`<h3>Microsoft ${A.app}</h3><p>This ${A.noun} has been marked as final to indicate that editing is complete and that this is the final version of the ${A.noun}.</p><p style="color:#616161">When a ${A.noun} is marked as final, the status property is set to "Final" and typing, editing commands, and proofing marks are turned off.</p>`, [['OK', 'primary']]);
      setReadOnly(true, 'final'); closeBackstage(); return;
    } else if (A.onProtect) { closeBackstage(); return A.onProtect(k); }
    show('info');
  }
  async function inspectAction(k) {
    if (k === 'inspect') {
      const r = await modal(`<h3>Document Inspector</h3><p>To check the ${A.noun} for the selected content, click Inspect.</p>${['Comments, Revisions and Versions', 'Document Properties and Personal Information', 'Headers, Footers and Watermarks', 'Hidden Text'].map((x) => `<p><label><input type="checkbox" checked> ${x}</label></p>`).join('')}`, [['Close'], ['Inspect', 'primary']]);
      if (r.i !== 1) return;
      const found = A.inspect ? A.inspect() : [];
      const r2 = await modal(`<h3>Document Inspector</h3><p>Review the inspection results.</p>${['Document Properties and Personal Information', ...found].map((x, i) => `<div class="insp"><span>${i ? '!' : '!'}</span><div><b>${x}</b><small>${i ? 'The following items were found.' : 'The following document information was found: Document properties, Author.'}</small></div><button class="btn rmall" data-i="${i}">Remove All</button></div>`).join('')}`, [['Close', 'primary']]);
      FILE.inspected = true; return r2;
    }
    if (k === 'access') return modal(`<h3>Accessibility Checker</h3>${A.access ? A.access() : '<p>✔ No accessibility issues found. People with disabilities should not have difficulty reading this ' + A.noun + '.</p>'}`);
    if (k === 'compat') return modal(`<h3>Compatibility Checker</h3><p>No compatibility issues were found.</p>`);
  }
  async function closeDoc() {
    const r = await modal(`<h3>Microsoft ${A.app}</h3><p>Want to save your changes to "${escapeHtml(FILE.name)}"?</p>`, [["Don't Save"], ['Cancel'], ['Save', 'primary']]);
    if (r.i === 1) return;
    if (r.i === 2) { await (FILE.savedAs ? writeFile({ ...FILE.savedAs, opts: null }) : saveAs()); }
    A.newBlank(); resetFile(A.defaultName); A.setName(A.defaultName); setReadOnly(false); show('home');
  }
  // ---------------- Options dialog ----------------
  function optionsDialog() {
    const cats = ['General', 'Display', 'Proofing', 'Save', 'Language', 'Accessibility', 'Advanced', 'Customize Ribbon', 'Quick Access Toolbar', 'Add-ins', 'Trust Center'];
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal optdlg"><h3>${A.app} Options</h3><div class="ob"><div class="oc">${cats.map((c, i) => `<div data-c="${c}" class="${i ? '' : 'on'}">${c}</div>`).join('')}</div><div class="op"></div></div><div class="actions"><button class="btn primary ok">OK</button><button class="btn cc">Cancel</button></div></div>`;
    document.body.appendChild(bg);
    const st = { user: Progress.student() || 'Student', autosave: 10 };
    const op = bg.querySelector('.op');
    const pane = (c) => {
      bg.querySelectorAll('.oc div').forEach((d) => d.classList.toggle('on', d.dataset.c === c));
      if (c === 'General') op.innerHTML = `<h4>General options for working with ${A.app}.</h4><p><b>Personalize your copy of Microsoft Office</b></p><p>User name: <input class="rs u" value="${escapeHtml(st.user)}" style="width:220px"></p><p>Initials: <input class="rs" value="${escapeHtml(st.user.split(/\s+/).map((w) => w[0]).join('').slice(-2).toUpperCase())}" style="width:60px"></p><p>Office Theme: <select class="rs"><option>Colorful</option><option>Dark Gray</option><option>White</option></select></p>`;
      else if (c === 'Save') op.innerHTML = `<h4>Customize how ${A.noun}s are saved.</h4><p>Save files in this format: <select class="rs">${A.formats.filter((f) => !f.export).map((f) => `<option>${f.label}</option>`).join('')}</select></p><p><label><input type="checkbox" checked> Save AutoRecover information every <input class="rs" type="number" value="${st.autosave}" style="width:50px"> minutes</label></p><p>Default local file location: <input class="rs" value="C:\\Users\\Student\\Documents\\" style="width:260px"></p>`;
      else if (c === 'Customize Ribbon') {
        const tabs = ribbonTabs();
        op.innerHTML = `<h4>Customize the Ribbon and keyboard shortcuts.</h4><div class="crib"><div><b>Choose commands from:</b><select class="rs"><option>Popular Commands</option></select><div class="cl">${['Copy', 'Cut', 'Paste', 'Font', 'Font Size', 'Insert Picture', 'New', 'Open', 'Print Preview and Print', 'Save', 'Undo'].map((x) => `<div>${x}</div>`).join('')}</div></div><div><b>Customize the Ribbon:</b><select class="rs"><option>Main Tabs</option></select><div class="cl">${Object.entries(tabs).map(([k, on]) => `<label><input type="checkbox" data-tab="${k}" ${on ? 'checked' : ''} ${k === 'home' ? 'disabled' : ''}> ${k === 'developer' ? 'Developer' : k[0].toUpperCase() + k.slice(1)}</label>`).join('')}</div></div></div>`;
        op.querySelectorAll('[data-tab]').forEach((x) => x.addEventListener('change', () => (st['tab_' + x.dataset.tab] = x.checked)));
      } else if (c === 'Trust Center') op.innerHTML = `<h4>Help keep your documents safe and your computer secure and healthy.</h4><p><b>Macro Settings</b></p>${['Disable VBA macros without notification', 'Disable VBA macros with notification', 'Disable VBA macros except digitally signed macros', 'Enable VBA macros (not recommended; potentially dangerous code can run)'].map((x, i) => `<p><label><input type="radio" name="mac" ${i === 1 ? 'checked' : ''}> ${x}</label></p>`).join('')}`;
      else op.innerHTML = `<h4>${c}</h4><p class="muted">These options are shown for practice. Changes here do not affect the simulator.</p>${['Show the Start screen when this application starts', 'Enable Live Preview', 'Show Mini Toolbar on selection', 'Update document content while dragging'].map((x) => `<p><label><input type="checkbox" checked> ${x}</label></p>`).join('')}`;
      const u = op.querySelector('.u'); if (u) u.oninput = () => (st.user = u.value);
    };
    bg.querySelectorAll('.oc div').forEach((d) => (d.onclick = () => pane(d.dataset.c))); pane('General');
    bg.querySelector('.cc').onclick = () => bg.remove();
    bg.querySelector('.ok').onclick = () => {
      Object.keys(st).filter((k) => k.startsWith('tab_')).forEach((k) => setRibbonTab(k.slice(4), st[k]));
      if (st.user && st.user !== (Progress.student() || 'Student')) { FILE.props.author = st.user; }
      bg.remove();
    };
  }
  function ribbonTabs() { const o = {}; $$('#tabs button[data-tab]:not(.ctx)').forEach((b) => (o[b.dataset.tab] = !b.hidden)); return o; }
  function setRibbonTab(k, on) { const b = $(`#tabs button[data-tab="${k}"]`); if (!b) return; b.hidden = !on; if (!on && b.classList.contains('on')) $('#tabs button[data-tab=home]').click(); try { localStorage.setItem('thl.tab.' + A.app + '.' + k, on ? '1' : '0'); } catch {} }
  function applyTheme() { const t = localStorage.getItem('thl.offtheme') || ''; document.body.classList.toggle('th-dark', t === 'dark'); document.body.classList.toggle('th-white', t === 'white'); }

  // ---------------- Init ----------------
  function init(adapter, runner) {
    A = adapter; A.Noun = A.noun[0].toUpperCase() + A.noun.slice(1);
    resetFile(A.defaultName); applyTheme();
    $$('#tabs button[data-tab]:not(.ctx)').forEach((b) => { const v = localStorage.getItem('thl.tab.' + A.app + '.' + b.dataset.tab); if (v !== null) b.hidden = v === '0'; });
    $$('#tabs .file').forEach((f) => { const n = f.cloneNode(true); f.replaceWith(n); n.addEventListener('click', () => openBackstage('info')); });
    const ex = $('#btnEx');
    if (MODE === 'practice') {
      ex.textContent = (typeof OfficeLang !== 'undefined' ? OfficeLang.t('Exit Practice', 'Thoát luyện tập') : 'Exit Practice'); ex.onclick = () => (location.href = 'practice.html#' + A.app.toLowerCase());
      runner.onList = () => (location.href = 'practice.html#' + A.app.toLowerCase());
      const e = runner.exercises.find((x) => x.id === params.get('ex'));
      if (e) { runner.start(e); resetFile(e.title); }
    } else {
      ex.textContent = 'Practice'; ex.title = 'Open the practice area (auto-graded projects)'; ex.onclick = () => (location.href = 'practice.html#' + A.app.toLowerCase());
      runner.pane && (runner.pane.hidden = true);
      const op = params.get('open');
      if (op) { const [folder, name] = op.split('|'); const f = FS.find(folder, name); if (f) setTimeout(() => openEntry(folder, f), 30); else openBackstage('home'); }
      else if (params.get('new')) { const t = params.get('tpl'); if (t !== null && A.templates && A.templates[+t]) { A.templates[+t].load(); } }
      else openBackstage('home');
    }
    document.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey)) { if (e.key === 'F12' && !e.shiftKey) { e.preventDefault(); saveAs(); } return; }
      const k = e.key.toLowerCase();
      if (k === 's' && !e.shiftKey) { e.preventDefault(); e.stopImmediatePropagation(); save(); }
      if (k === 's' && e.shiftKey) { e.preventDefault(); e.stopImmediatePropagation(); saveAs(); }
      if (k === 'p') { e.preventDefault(); e.stopImmediatePropagation(); openBackstage('print'); }
      if (k === 'o') { e.preventDefault(); e.stopImmediatePropagation(); openBackstage('open'); }
      if (k === 'n') { e.preventDefault(); e.stopImmediatePropagation(); openBackstage('new'); }
    }, true);
    const qs = $('#qaSave'); if (qs) { const n = qs.cloneNode(true); qs.replaceWith(n); n.onclick = () => save(); }
  }
  return { init, ribbonTabs, setRibbonTab, FILE, FS, MODE, openBackstage, closeBackstage, save, saveAs, setReadOnly, resetFile, msgBox, winDialog, writeFile, get adapter() { return A; } };
})();
