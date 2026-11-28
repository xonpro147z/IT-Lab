// TinHocLab Space – viết code như VS Code, chạy ngay trong ứng dụng, vượt thử thách tự chấm.
import { TRACKS, LEVELS, CHALLENGES, byId } from './challenges.js';
import { PyRunner } from './run/py.js';
import { buildDoc } from './run/web.js';
import { CppRunner } from './run/cpp.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const app = $('#app');
function toast(t, ms = 2200) { const d = document.createElement('div'); d.textContent = t; $('#toast').appendChild(d); setTimeout(() => d.remove(), ms); }

// ---------- lưu tiến độ và code trên máy ----------
const LS = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const prog = () => LS.get('thl.space', { done: {}, tries: {} });
function markDone(id, score, max) {
  const p = prog(); p.tries[id] = (p.tries[id] || 0) + 1;
  if (score === max && !p.done[id]) p.done[id] = Date.now();
  LS.set('thl.space', p);
  try { window.Progress && Progress.record('space', id, score, max); } catch {}
}
const codeKey = (k) => 'thl.space.code.' + k;

// ---------- Monaco (lõi soạn thảo của VS Code) ----------
let monacoP = null;
function loadMonaco() {
  if (monacoP) return monacoP;
  monacoP = new Promise((res, rej) => {
    const base = new URL('../vendor/monaco/vs', location.href).href;
    window.MonacoEnvironment = { getWorkerUrl: () => base + '/base/worker/workerMain.js' };
    window.require.config({ paths: { vs: base } });
    window.require(['vs/editor/editor.main'], () => {
      const m = window.monaco;
      m.editor.defineTheme('fx', { base: 'vs', inherit: true, rules: [{ token: 'comment', foreground: '8a8a8a', fontStyle: 'italic' }, { token: 'keyword', foreground: '7a1fa2' }, { token: 'string', foreground: '0a7a3a' }, { token: 'number', foreground: 'b35900' }],
        colors: { 'editor.background': '#ffffff', 'editor.lineHighlightBackground': '#f6f6f6', 'editorLineNumber.foreground': '#b8b8b8', 'editorLineNumber.activeForeground': '#111111', 'editorIndentGuide.background1': '#efefef', 'editor.selectionBackground': '#d9e2ff' } });
      res(m);
    }, rej);
  });
  return monacoP;
}

// ---------- định dạng đề bài (đánh dấu rút gọn) ----------
function inline(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>'); }
function md(text) {
  const L = text.split('\n'); let out = '', i = 0;
  while (i < L.length) {
    const ln = L[i];
    if (ln.startsWith('```')) { const b = []; i++; while (i < L.length && !L[i].startsWith('```')) b.push(L[i++]); i++; out += `<pre class="code">${esc(b.join('\n'))}</pre>`; continue; }
    if (ln.startsWith('|')) { const r = []; while (i < L.length && L[i].startsWith('|')) r.push(L[i++]); out += `<table>${r.map((x) => `<tr>${x.replace(/^\||\|$/g, '').split('|').map((c) => `<td>${inline(c.trim())}</td>`).join('')}</tr>`).join('')}</table>`; continue; }
    if (ln.startsWith('- ')) { const r = []; while (i < L.length && L[i].startsWith('- ')) r.push(L[i++].slice(2)); out += `<ul>${r.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`; continue; }
    if (!ln.trim()) { i++; continue; }
    const p = []; while (i < L.length && L[i].trim() && !/^(```|\||- )/.test(L[i])) p.push(L[i++]);
    out += `<p>${p.map(inline).join('<br>')}</p>`;
  }
  return out;
}

// ---------- so sánh kết quả ----------
const norm = (s) => String(s ?? '').replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');

// ---------- giải thích lỗi Python bằng tiếng Việt ----------
function pyHint(err) {
  const m = (re) => err.match(re);
  let r;
  if (m(/IndentationError|TabError/)) return 'Lỗi thụt lề: các lệnh trong cùng một khối (sau if, for, def…) phải thụt vào bằng nhau, thường là 4 dấu cách.';
  if ((r = m(/SyntaxError: (.*)/))) return 'Lỗi cú pháp – Python không hiểu câu lệnh. Kiểm tra: dấu hai chấm ":" cuối dòng if/for/while/def, dấu ngoặc đóng mở đủ cặp, dấu nháy của chuỗi.' + (/never closed|EOF/.test(r[1]) ? ' (Có dấu ngoặc chưa đóng.)' : '');
  if ((r = m(/NameError: name '(\w+)' is not defined/))) return `Python chưa biết "${r[1]}" là gì. Có thể em gõ sai chính tả (chữ hoa/thường khác nhau), dùng biến trước khi tạo, hoặc quên dấu nháy nếu đó là chữ.`;
  if (m(/TypeError: can only concatenate str/) || m(/TypeError: unsupported operand type\(s\) for \+: 'int' and 'str'/) || m(/must be str, not int/)) return 'Đang cộng chữ (str) với số (int). Đổi số sang chữ bằng str(), hoặc chữ sang số bằng int().';
  if ((r = m(/ValueError: invalid literal for int\(\) with base 10: '(.*)'/))) return `int() không đổi được "${r[1]}" thành số nguyên. Dữ liệu vào có phải số nguyên không, hay cần float()? Nếu nhiều số trên một dòng thì dùng split().`;
  if (m(/ValueError: could not convert string to float/)) return 'float() không đổi được chuỗi này thành số. Kiểm tra dữ liệu vào.';
  if (m(/ZeroDivisionError/)) return 'Phép chia cho 0. Hãy kiểm tra số chia trước khi chia.';
  if (m(/EOFError/)) return 'Chương trình gọi input() nhiều lần hơn số dòng dữ liệu vào. Kiểm tra ô Dữ liệu vào (Input) hoặc số lần đọc.';
  if (m(/IndexError/)) return 'Truy cập vị trí vượt quá độ dài danh sách hoặc chuỗi. Nhớ chỉ số bắt đầu từ 0.';
  if (m(/KeyError/)) return 'Khoá này không có trong từ điển (dict).';
  if (m(/AttributeError/)) return 'Đối tượng không có thuộc tính hoặc phương thức này. Kiểm tra tên hàm, ví dụ .append(), .split().';
  if (m(/RecursionError/)) return 'Hàm gọi lại chính nó quá nhiều lần (đệ quy không dừng).';
  if (m(/ModuleNotFoundError/)) return 'Thư viện này chưa có trong TinHocLab. Các thư viện chuẩn của Python (math, random…) và turtle dùng được.';
  return '';
}
const errLine = (err) => { const all = [...String(err).matchAll(/File "main\.py", line (\d+)/g)]; return all.length ? +all[all.length - 1][1] : 0; };

// ---------- trang chủ & danh sách ----------
function navHtml(cur) {
  const p = prog();
  const cnt = (t) => { const L = CHALLENGES.filter((c) => c.track === t); return `${L.filter((c) => p.done[c.id]).length}/${L.length}`; };
  return `<nav class="nav"><div class="browse"><i>≡</i> Duyệt</div>
    <a href="#/" class="${cur === 'home' ? 'on' : ''}">Bắt đầu</a>
    <div class="sec">THỬ THÁCH</div>
    ${TRACKS.map((t) => `<a href="#/t/${t.id}" class="${cur === t.id ? 'on' : ''}">${t.name}<small>${CHALLENGES.some((c) => c.track === t.id) ? cnt(t.id) : 'sắp có'}</small></a>`).join('')}
    <div class="sec">SÂN CHƠI</div>
    ${TRACKS.map((t) => `<a href="#/play/${t.id}">${t.name}<small>${t.file}</small></a>`).join('')}
  </nav>`;
}
function rowsHtml(list) {
  const p = prog();
  return `<div class="rows">${list.map((c, i) => `<a class="row ${p.done[c.id] ? 'done' : ''}" href="#/c/${c.id}"><span class="st">${p.done[c.id] ? '✓' : '○'}</span><span class="no">${String(i + 1).padStart(2, '0')}</span><span class="t">${esc(c.title)}${c.turtle ? '<span class="tag">turtle</span>' : ''}</span><span class="lv">${LEVELS[c.level]}</span><span class="go">›</span></a>`).join('')}</div>`;
}
function home() {
  setTop('', '');
  const p = prog(), total = CHALLENGES.length, done = CHALLENGES.filter((c) => p.done[c.id]).length;
  app.innerHTML = `<div class="docs">${navHtml('home')}<main class="page">
    <h1>Space</h1>
    <p>Viết code, chạy thử và vượt thử thách – ngay trong TinHocLab, <b>không cần mạng</b>. Trình soạn thảo dùng chính lõi của <b>Visual Studio Code</b>: tô màu cú pháp, gợi ý, tự thụt lề.</p>
    <p>Mở một thử thách và bắt đầu:</p>
    <pre class="codebox">chọn thử thách  →  viết code  →  ▶ Chạy  <span class="c">(Ctrl+Enter)</span>
                               →  ✓ Nộp bài <span class="c">(Ctrl+Shift+Enter)</span></pre>
    <p>Mỗi thử thách có <b>ví dụ mẫu</b> để em tự thử và các <b>bài kiểm tra ẩn</b>. Nộp bài khi qua hết mọi bài kiểm tra là hoàn thành. Bí quá thì bấm <b>Gợi ý</b>.</p>
    <p>Đã hoàn thành <b>${done}/${total}</b> thử thách.</p>
    <div class="bar"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div>
    <div class="cards">${TRACKS.map((t) => { const L = CHALLENGES.filter((c) => c.track === t.id); return `<a href="#/t/${t.id}"><b>${t.name}</b><span>${L.length ? `${L.filter((c) => p.done[c.id]).length}/${L.length} thử thách` : 'sắp có thử thách'}</span></a>`; }).join('')}</div>
    <p>Muốn tự do sáng tạo? Mở <b>Sân chơi</b>:</p>
    <pre class="codebox" style="white-space:pre-wrap">${TRACKS.map((t) => `<a href="#/play/${t.id}">space play ${t.id}</a>${' '.repeat(8 - t.id.length)}<span class="c"># ${esc(t.desc)}</span>`).join('\n')}</pre>
    ${TRACKS.filter((t) => CHALLENGES.some((c) => c.track === t.id)).map((t) => `<h2>${t.name}<small>${CHALLENGES.filter((c) => c.track === t.id && p.done[c.id]).length}/${CHALLENGES.filter((c) => c.track === t.id).length} đã xong</small></h2>${rowsHtml(CHALLENGES.filter((c) => c.track === t.id))}`).join('')}
  </main></div>`;
}
function trackPage(tid) {
  const t = TRACKS.find((x) => x.id === tid); if (!t) return home();
  setTop(`<b>${t.name}</b>`, '');
  const L = CHALLENGES.filter((c) => c.track === tid), p = prog(), done = L.filter((c) => p.done[c.id]).length;
  app.innerHTML = `<div class="docs">${navHtml(tid)}<main class="page">
    <h1>${t.name}</h1><p>${esc(t.desc)}</p>
    ${L.length ? `<p>Đã hoàn thành <b>${done}/${L.length}</b>.</p><div class="bar"><i style="width:${(done / L.length) * 100}%"></i></div>
    ${[1, 2, 3].map((lv) => { const x = L.filter((c) => c.level === lv); return x.length ? `<h2>${LEVELS[lv]}<small>${x.filter((c) => p.done[c.id]).length}/${x.length}</small></h2>${rowsHtml(x)}` : ''; }).join('')}`
      : `<p class="soon">Thử thách ${t.name} sẽ có trong bản tới. Em có thể dùng Sân chơi ngay bây giờ:</p><pre class="codebox"><a href="#/play/${t.id}">space play ${t.id}</a></pre>`}
  </main></div>`;
}
function setTop(crumb, actions) { $('#crumb').innerHTML = crumb; $('#actions').innerHTML = actions; }

// ---------- không gian làm bài ----------
let cur = null; // { editor, models, track, ... }
let py = null, cpp = null;
const getPy = () => (py ||= new PyRunner());
const getCpp = () => (cpp ||= new CppRunner());

function starterFiles(c, track) {
  if (track === 'web') return { 'index.html': '', 'style.css': '', 'script.js': '', ...(c ? c.files : { 'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>Sân chơi</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Xin chào!</h1>\n  <script src="script.js"></script>\n</body>\n</html>\n', 'style.css': 'body {\n  font-family: system-ui, sans-serif;\n  padding: 24px;\n}\n', 'script.js': "console.log('Trang đã chạy');\n" }) };
  const f = TRACKS.find((t) => t.id === track).file;
  const def = track === 'cpp' ? '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Xin chào!" << endl;\n    return 0;\n}\n' : 'print("Xin chào!")\n';
  return { [f]: c ? c.starter ?? '' : def };
}

async function workspace(c, track) {
  const key = c ? c.id : 'play-' + track;
  const T = TRACKS.find((t) => t.id === track);
  const saved = LS.get(codeKey(key), null);
  const files = { ...starterFiles(c, track), ...(saved || {}) };
  const names = Object.keys(files);
  const isWeb = track === 'web';
  const hasTests = !!c;
  setTop(c ? `<a href="#/t/${track}">${T.name}</a> / <b>${esc(c.title)}</b>` : `sân chơi / <b>${T.name}</b>`,
    `${c ? '<button class="btn" id="bHint">💡 Gợi ý</button>' : ''}<button class="btn" id="bReset">↺ Làm lại</button><button class="btn" id="bRun">▶ Chạy<kbd>Ctrl+↵</kbd></button>${hasTests ? '<button class="btn pri" id="bSubmit">✓ Nộp bài</button>' : ''}`);

  const sample = c && !isWeb ? c.tests.filter((t) => t.out !== null).slice(0, 2) : [];
  const showTurtle = c ? !!c.turtle : track === 'python';
  app.innerHTML = `<div class="ws" style="--left:${c ? '34%' : '22%'}">
    <section class="pane">
      <div class="tabs"><button class="on" data-l="doc">${c ? 'Đề bài' : 'Tệp'}</button>${hasTests ? '<button data-l="res">Kết quả</button>' : ''}</div>
      <div class="scroll" id="left">${c ? `<div class="doc"><h1>${esc(c.title)}</h1><div class="meta">${T.name} · ${LEVELS[c.level]} · ${isWeb ? c.tests.length + ' bài kiểm tra' : c.tests.length + ' bài kiểm tra (' + sample.length + ' ví dụ)'}${prog().done[c.id] ? ' · ✓ đã hoàn thành' : ''}</div>
        ${md(c.body)}
        ${sample.length ? `<h3>Ví dụ</h3>${sample.map((t) => `<div class="ex"><div><small>Dữ liệu vào</small><pre>${esc(t.in) || '<span style="color:#aaa">(trống)</span>'}</pre></div><div><small>Kết quả đúng</small><pre>${esc(t.out)}</pre></div></div>`).join('')}` : ''}
        ${isWeb ? `<h3>Bài kiểm tra</h3><ul>${c.tests.map((t) => `<li>${esc(t.name)}</li>`).join('')}</ul>` : ''}
        <div id="hintBox"></div></div>` : `<div class="files" id="fileList"></div><div class="doc"><p style="color:var(--mute)">Code tự lưu trên máy này.${track === 'python' ? ' Dùng được <code>input()</code> (gõ dữ liệu vào ô Input), thư viện chuẩn và <code>turtle</code>.' : ''}</p></div>`}</div>
    </section>
    <div class="split" id="vsplit"></div>
    <section class="pane right" id="rightPane">
      <div class="pane">
        <div class="tabs" id="fileTabs">${names.map((n, i) => `<button data-f="${esc(n)}" class="${i ? '' : 'on'}">${esc(n)}</button>`).join('')}<span class="sp"></span></div>
        <div id="editor"><div class="loading">Đang mở trình soạn thảo…</div></div>
      </div>
      <div class="hsplit" id="hsplit"></div>
      <div class="bottom" style="--side:${isWeb ? '0px' : showTurtle ? '42%' : '34%'}">
        <div class="pane">
          <div class="tabs" id="botTabs">${isWeb ? '<button class="on" data-b="preview">Xem trước</button><button data-b="console">Console</button>' : '<button class="on" data-b="term">Terminal</button>'}<span class="sp"></span><button data-b="clear" title="Xoá">⌫</button></div>
          ${isWeb ? `<iframe class="preview" id="preview" sandbox="allow-scripts allow-modals"></iframe><div class="scroll term" id="console" hidden></div>` : `<div class="scroll term" id="term"><span class="s">Bấm ▶ Chạy (Ctrl+Enter) để chạy chương trình.</span></div>`}
        </div>
        ${isWeb ? '<div></div>' : `<div class="pane"><div class="tabs" id="sideTabs"><button class="${showTurtle ? '' : 'on'}" data-s="in">Input</button>${track === 'python' ? `<button class="${showTurtle ? 'on' : ''}" data-s="draw">Hình vẽ</button>` : ''}</div>
          <textarea class="stdin" id="stdin" placeholder="Dữ liệu vào cho input()&#10;mỗi dòng một giá trị" spellcheck="false" ${showTurtle ? 'hidden' : ''}>${esc(sample[0] ? sample[0].in : '')}</textarea>
          <div class="scroll" id="draw" ${showTurtle ? '' : 'hidden'}><canvas class="turtle" id="canvas" width="400" height="400"></canvas></div></div>`}
      </div>
    </section>
  </div>
  <div class="status"><span id="stLang">${T.name}${track === 'python' ? ' 3.13 (Pyodide)' : ''}</span><span id="stPos">Ln 1, Col 1</span><span class="grow"></span><span id="stSave">Đã lưu</span><span id="stRun"></span></div>`;

  // kéo đổi kích thước khung
  dragSplit($('#vsplit'), 'x', (v) => $('.ws').style.setProperty('--left', v + 'px'));
  dragSplit($('#hsplit'), 'y', (v) => $('#rightPane').style.setProperty('--bottom', ($('#rightPane').getBoundingClientRect().bottom - v) + 'px'));

  const monaco = await loadMonaco();
  if (!document.getElementById('editor')) return; // đã rời trang
  $('#editor').innerHTML = '';
  const langOf = (n) => (/\.py$/.test(n) ? 'python' : /\.cpp$/.test(n) ? 'cpp' : /\.css$/.test(n) ? 'css' : /\.js$/.test(n) ? 'javascript' : 'html');
  const models = {};
  for (const n of names) models[n] = monaco.editor.createModel(files[n], langOf(n), monaco.Uri.parse('file:///' + key + '/' + n));
  const editor = monaco.editor.create($('#editor'), {
    model: models[names[0]], theme: 'fx', fontFamily: "'JetBrains Mono', monospace", fontSize: 14, lineHeight: 22, minimap: { enabled: false },
    automaticLayout: true, scrollBeyondLastLine: false, tabSize: track === 'python' || track === 'cpp' ? 4 : 2, insertSpaces: true, renderLineHighlight: 'line',
    contextmenu: false, padding: { top: 10 }, wordWrap: 'off', fixedOverflowWidgets: true, quickSuggestions: true, bracketPairColorization: { enabled: true }, guides: { indentation: true },
  });
  cur = { editor, models, key, c, track, monaco, docHtml: $('#left').innerHTML };
  editor.focus();
  editor.onDidChangeCursorPosition((e) => ($('#stPos').textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`));
  let saveT = 0, prevT = 0;
  const save = () => { const o = {}; for (const n of names) o[n] = models[n].getValue(); LS.set(codeKey(key), o); $('#stSave').textContent = 'Đã lưu'; };
  for (const n of names) models[n].onDidChangeContent(() => {
    $('#stSave').textContent = 'Đang sửa…'; clearTimeout(saveT); saveT = setTimeout(save, 500);
    monaco.editor.setModelMarkers(models[n], 'run', []);
    if (isWeb) { clearTimeout(prevT); prevT = setTimeout(() => runWeb(false), 700); }
  });
  // tab tệp
  $('#fileTabs').onclick = (e) => { const b = e.target.closest('[data-f]'); if (!b) return; $('#fileTabs').querySelectorAll('[data-f]').forEach((x) => x.classList.toggle('on', x === b)); editor.setModel(models[b.dataset.f]); editor.focus(); };
  if (!c && $('#fileList')) { $('#fileList').innerHTML = names.map((n, i) => `<a data-f="${esc(n)}" class="${i ? '' : 'on'}">📄 ${esc(n)}</a>`).join(''); $('#fileList').onclick = (e) => { const a = e.target.closest('[data-f]'); if (!a) return; $('#fileList').querySelectorAll('a').forEach((x) => x.classList.toggle('on', x === a)); $(`#fileTabs [data-f="${a.dataset.f}"]`).click(); }; }
  // tab trái
  $('.pane .tabs').onclick = (e) => { const b = e.target.closest('[data-l]'); if (!b || !c) return; showLeft(b.dataset.l); };
  // tab dưới
  $('#botTabs').onclick = (e) => {
    const b = e.target.closest('[data-b]'); if (!b) return;
    if (b.dataset.b === 'clear') { if (isWeb) $('#console').innerHTML = ''; else $('#term').innerHTML = ''; return; }
    $('#botTabs').querySelectorAll('[data-b]:not([data-b=clear])').forEach((x) => x.classList.toggle('on', x === b));
    if (isWeb) { $('#preview').hidden = b.dataset.b !== 'preview'; $('#console').hidden = b.dataset.b !== 'console'; }
  };
  if ($('#sideTabs')) $('#sideTabs').onclick = (e) => { const b = e.target.closest('[data-s]'); if (!b) return; $('#sideTabs').querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x === b)); $('#stdin').hidden = b.dataset.s !== 'in'; $('#draw').hidden = b.dataset.s !== 'draw'; };

  // nút
  $('#bRun').onclick = () => (isWeb ? runWeb(true) : runCode());
  if ($('#bSubmit')) $('#bSubmit').onclick = () => submit();
  $('#bReset').onclick = () => { if (!confirm('Xoá code đang viết và trở về code ban đầu?')) return; const st = starterFiles(c, track); for (const n of names) models[n].setValue(st[n] || ''); toast('Đã đặt lại code'); };
  if ($('#bHint')) $('#bHint').onclick = () => { showLeft('doc'); $('#hintBox').innerHTML = `<div class="hintbox"><b>💡 Gợi ý</b><pre>${esc(c.hint || 'Đọc kỹ ví dụ và thử từng bước nhỏ.')}</pre></div>`; $('#hintBox').scrollIntoView({ behavior: 'smooth' }); };
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => $('#bRun').click());
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => $('#bSubmit') && $('#bSubmit').click());
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => { save(); toast('Đã lưu'); });
  if (isWeb) runWeb(false);
  if (track === 'python') getPy(); // khởi động Python sớm
  if (track === 'cpp') getCpp().warm && getCpp().warm();
}
function showLeft(which) {
  const c = cur.c; if (!c) return;
  document.querySelectorAll('[data-l]').forEach((x) => x.classList.toggle('on', x.dataset.l === which));
  const left = $('#left');
  if (which === 'doc') { if (left.dataset.mode === 'res') { left.dataset.mode = ''; left.innerHTML = cur.docHtml; } return; }
  left.dataset.mode = 'res';
  left.innerHTML = cur.lastResult || '<div class="doc" style="color:var(--mute)">Bấm ✓ Nộp bài để chấm.</div>';
}
function dragSplit(el, axis, apply) {
  el.onpointerdown = (e) => {
    el.setPointerCapture(e.pointerId); el.classList.add('drag');
    const mv = (ev) => apply(axis === 'x' ? Math.max(220, Math.min(innerWidth - 360, ev.clientX)) : Math.max(150, Math.min(innerHeight - 120, ev.clientY)));
    const up = () => { el.classList.remove('drag'); el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
  };
}
const files = () => { const o = {}; for (const [n, m] of Object.entries(cur.models)) o[n] = m.getValue(); return o; };
const mainFile = () => TRACKS.find((t) => t.id === cur.track).file;

// ---- Python / C++: chạy với Input ----
function term() { return $('#term'); }
function tprint(html) { const t = term(); if (!t) return; t.insertAdjacentHTML('beforeend', html); t.scrollTop = t.scrollHeight; }
async function runCode() {
  const code = files()[mainFile()], stdin = $('#stdin') ? $('#stdin').value : '';
  const t = term(); t.innerHTML = '';
  const runner = cur.track === 'cpp' ? getCpp() : getPy();
  const b = $('#bRun'); b.disabled = true; $('#stRun').textContent = '● đang chạy';
  const slow = setTimeout(() => { if (cur.track === 'python' && !runner.ready) tprint('<span class="s">Đang khởi động Python (lần đầu mất vài giây)…\n</span>'); if (cur.track === 'cpp' && !runner.ready) tprint('<span class="s">Đang chuẩn bị trình biên dịch C++ (lần đầu mất vài giây)…\n</span>'); }, 400);
  tprint(`<span class="s">$ ${cur.track === 'cpp' ? 'g++ main.cpp && ./main' : 'python main.py'}\n</span>`);
  const stopBtn = document.createElement('button'); stopBtn.className = 'btn'; stopBtn.textContent = '■ Dừng'; stopBtn.onclick = () => runner.stop(); $('#actions').prepend(stopBtn);
  const r = await runner.run(code, stdin, { timeoutMs: 10000, onOut: (txt, k) => tprint(k === 'err' ? `<span class="e">${esc(txt)}</span>` : k === 'warn' ? `<span class="s">${esc(txt)}</span>` : esc(txt)) });
  clearTimeout(slow); stopBtn.remove(); b.disabled = false; $('#stRun').textContent = '';
  if (r.error) { tprint(`<span class="e">${esc((r.out && !r.out.endsWith('\n') ? '\n' : '') + r.error)}\n</span>`); explain(r.error); }
  tprint(`<span class="s">\n[${r.ok ? 'kết thúc' : 'dừng'} · ${r.ms} ms]</span>`);
  if (r.turtle) drawTurtle(r.turtle);
}
function explain(error) {
  const h = cur.track === 'cpp' ? cppHint(error) : pyHint(error);
  if (h) tprint(`<span class="h">💡 ${esc(h)}</span>`);
  const ln = cur.track === 'cpp' ? cppLine(error) : errLine(error);
  if (ln) {
    const m = cur.models[mainFile()];
    cur.monaco.editor.setModelMarkers(m, 'run', [{ startLineNumber: ln, endLineNumber: ln, startColumn: 1, endColumn: m.getLineMaxColumn(ln), message: error.split('\n').filter(Boolean).slice(-1)[0], severity: cur.monaco.MarkerSeverity.Error }]);
    cur.editor.revealLineInCenterIfOutsideViewport(ln);
  }
}
function drawTurtle(ops) {
  const cv = $('#canvas'); if (!cv) return;
  if ($('#sideTabs')) $('#sideTabs').querySelector('[data-s=draw]').click();
  const box = $('#draw').getBoundingClientRect();
  const dpr = devicePixelRatio || 1, W = Math.max(160, box.width - 20), H = Math.max(160, box.height - 20);
  cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d');
  const bg = (ops.filter((o) => o[0] === 'bg').pop() || [0, '#fff'])[1];
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // khung bao các nét vẽ (luôn chứa gốc toạ độ, nơi rùa xuất phát) → thu phóng cho vừa khung
  let x0 = 0, y0 = 0, x1 = 0, y1 = 0; const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (const o of ops) { if (o[0] === 'line') { add(o[1], o[2]); add(o[3], o[4]); } else if (o[0] === 'fill') o[1].forEach(([x, y]) => add(x, y)); else if (o[0] === 'dot' || o[0] === 'text') add(o[1], o[2]); }
  const k = Math.min(1.5, (W - 30) / Math.max(1, x1 - x0), (H - 30) / Math.max(1, y1 - y0));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  g.setTransform(dpr * k, 0, 0, -dpr * k, dpr * (W / 2 - cx * k), dpr * (H / 2 + cy * k)); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const o of ops) {
    if (o[0] === 'fill') { g.fillStyle = o[2]; g.beginPath(); o[1].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); }
    else if (o[0] === 'line') { g.strokeStyle = o[5]; g.lineWidth = o[6] / Math.max(k, .5); g.beginPath(); g.moveTo(o[1], o[2]); g.lineTo(o[3], o[4]); g.stroke(); }
    else if (o[0] === 'dot') { g.fillStyle = o[4]; g.beginPath(); g.arc(o[1], o[2], o[3] / 2 / Math.max(k, .5), 0, Math.PI * 2); g.fill(); }
    else if (o[0] === 'text') { g.save(); g.translate(o[1], o[2]); g.scale(1 / k, -1 / k); g.fillStyle = o[4]; g.font = '14px sans-serif'; g.textAlign = o[5]; g.fillText(o[3], 0, 0); g.restore(); }
  }
}

// ---- C++: gợi ý lỗi ----
function cppHint(err) {
  const m = (re) => err.match(re); let r;
  if (m(/expected ';'/)) return 'Thiếu dấu chấm phẩy ";" ở cuối câu lệnh – xem vị trí có dấu ^ bên trên.';
  if ((r = m(/use of undeclared identifier '(\w+)'/))) return `"${r[1]}" chưa được khai báo. Kiểm tra chính tả, khai báo biến trước khi dùng, hoặc thiếu "using namespace std;" / #include.`;
  if (m(/expected '}'/)) return 'Thiếu dấu ngoặc nhọn đóng "}".';
  if (m(/no member named|no matching function/)) return 'Gọi hàm hoặc thành phần không tồn tại / sai kiểu tham số.';
  if (m(/file not found/)) return 'Thư viện #include này không có. Các thư viện chuẩn như <iostream>, <vector>, <string>, <algorithm>, <cmath> dùng được.';
  return '';
}
const cppLine = (err) => { const r = String(err).match(/main\.cpp:(\d+):\d+: error/); return r ? +r[1] : 0; };

// ---- Web ----
let webListen = null;
function runWeb(manual, tests) {
  const fr = $('#preview'); if (!fr) return;
  const con = $('#console');
  if (manual) con.innerHTML = '';
  return new Promise((resolve) => {
    if (webListen) removeEventListener('message', webListen);
    webListen = (e) => {
      if (e.source !== fr.contentWindow || !e.data || e.data.thl !== 'web') return;
      if (e.data.type === 'tests') { resolve(e.data.results); return; }
      con.insertAdjacentHTML('beforeend', `<div class="${e.data.type === 'error' ? 'e' : ''}">${e.data.type === 'error' ? '✗ ' : '› '}${esc(e.data.text)}</div>`);
      if (e.data.type === 'error') { const bt = $('#botTabs [data-b=console]'); if (bt) bt.textContent = 'Console •'; }
    };
    addEventListener('message', webListen);
    fr.srcdoc = buildDoc(files(), tests);
    if (!tests) resolve(null);
    else setTimeout(() => resolve(tests.map(() => ({ ok: false, msg: 'Trang không phản hồi (có thể JavaScript bị lỗi hoặc lặp vô hạn).' }))), 6000);
  });
}

// ---- Nộp bài ----
async function submit() {
  const c = cur.c; if (!c) return;
  const b = $('#bSubmit'); b.disabled = true; b.textContent = '… đang chấm';
  let results = [];
  try {
    if (cur.track === 'web') {
      const R = await runWeb(true, c.tests);
      results = c.tests.map((t, i) => ({ name: t.name, ok: !!(R[i] && R[i].ok), msg: R[i] && R[i].msg }));
    } else {
      const runner = cur.track === 'cpp' ? getCpp() : getPy();
      const code = files()[mainFile()];
      const nSample = c.tests.filter((t) => t.out !== null).slice(0, 2).length;
      for (let i = 0; i < c.tests.length; i++) {
        const t = c.tests[i];
        b.textContent = `… test ${i + 1}/${c.tests.length}`;
        const r = await runner.run(code, t.in, { timeoutMs: 6000 });
        let ok, msg = '';
        if (r.error) { ok = false; msg = r.timeout ? 'Quá thời gian – có thể lặp vô hạn.' : (r.error.split('\n').filter(Boolean).slice(-1)[0] || 'Lỗi khi chạy'); if (i === 0) { $('#term').innerHTML = ''; tprint(`<span class="e">${esc(r.error)}</span>\n`); explain(r.error); } }
        else if (c.check) { const ops = r.turtle || []; try { const v = new Function('ops', c.check)(ops); ok = v === true; msg = ok ? '' : String(v); } catch (e) { ok = false; msg = e.message; } if (r.turtle) drawTurtle(r.turtle); }
        else { ok = norm(r.out) === norm(t.out); if (!ok) msg = 'Kết quả chưa đúng.'; }
        results.push({ name: c.check ? 'Kiểm tra hình vẽ' : i < nSample ? `Ví dụ ${i + 1}` : `Test ẩn ${i + 1}`, ok, msg, show: !c.check && i < nSample ? { in: t.in, want: t.out, got: r.out } : null });
        if (r.error && (r.timeout || /SyntaxError|IndentationError|error:/.test(r.error)) && i === 0) { for (let j = 1; j < c.tests.length; j++) results.push({ name: j < nSample ? `Ví dụ ${j + 1}` : `Test ẩn ${j + 1}`, ok: false, msg: r.timeout ? 'Bỏ qua do test đầu đã quá thời gian' : 'Bỏ qua do lỗi cú pháp/biên dịch' }); break; }
      }
    }
  } finally { b.disabled = false; b.textContent = '✓ Nộp bài'; }
  const pass = results.filter((r) => r.ok).length, all = results.length, done = pass === all;
  const before = !!prog().done[c.id];
  markDone(c.id, pass, all);
  cur.lastResult = `<div class="summary ${done ? 'ok' : 'bad'}"><b>${done ? '✓ Hoàn thành!' : '✗ Chưa đạt'}</b> – qua ${pass}/${all} bài kiểm tra${done && !before ? '. Tuyệt vời! 🎉' : ''}</div>
    <div class="tests">${results.map((r) => `<div class="test ${r.ok ? 'ok' : 'bad'}"><div class="hd"><span class="ic">${r.ok ? '✓' : '✗'}</span><b>${esc(r.name)}</b></div>${r.msg && !r.ok ? `<div class="msg">${esc(r.msg)}</div>` : ''}${r.show && !r.ok ? `<div class="ex"><div><small>Dữ liệu vào</small><pre>${esc(r.show.in)}</pre></div><div><small>Kết quả đúng</small><pre>${esc(r.show.want)}</pre></div><div><small>Của em</small><pre>${esc(r.show.got)}</pre></div></div>` : ''}</div>`).join('')}</div>
    ${done ? nextLink(c) : '<div class="doc" style="color:var(--mute)">Sửa code rồi nộp lại. Bí quá thì bấm 💡 Gợi ý.</div>'}`;
  showLeft('res');
  const rt = document.querySelector('[data-l=res]'); if (rt) rt.innerHTML = `Kết quả <span class="dot">${done ? '●' : ''}</span>`;
  if (done) toast('✓ Hoàn thành thử thách!');
}
function nextLink(c) {
  const L = CHALLENGES.filter((x) => x.track === c.track), i = L.indexOf(c), n = L.slice(i + 1).find((x) => !prog().done[x.id]) || L[i + 1];
  return n ? `<div class="doc"><a class="btn pri" href="#/c/${n.id}" style="text-decoration:none">Thử thách tiếp: ${esc(n.title)} ›</a></div>` : `<div class="doc">Em đã đi hết các thử thách ${esc(TRACKS.find((t) => t.id === c.track).name)}! 🏆</div>`;
}

// ---------- điều hướng ----------
function route() {
  if (cur) { for (const m of Object.values(cur.models)) m.dispose(); cur.editor.dispose(); cur = null; }
  if (webListen) { removeEventListener('message', webListen); webListen = null; }
  const [, kind, arg] = decodeURIComponent(location.hash.slice(1) || '/').split('/');
  window.scrollTo(0, 0);
  document.body.classList.toggle('wsmode', kind === 'c' || kind === 'play');
  if (kind === 'c') { const c = byId(arg); if (c) return workspace(c, c.track); }
  if (kind === 'play' && TRACKS.some((t) => t.id === arg)) return workspace(null, arg);
  if (kind === 't') return trackPage(arg);
  home();
}
addEventListener('hashchange', route);
route();
window.__space = { CHALLENGES, getPy, getCpp, get cur() { return cur; } };
