const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  saveFile: (opts) => ipcRenderer.invoke('file:save', opts),
  openFile: (opts) => ipcRenderer.invoke('file:open', opts),
  openImage: () => ipcRenderer.invoke('file:openImage'),
  version: () => ipcRenderer.invoke('app:version'),
  openMedia: (kind) => ipcRenderer.invoke('file:openMedia', kind),
  readMedia: (p) => ipcRenderer.invoke('file:readMedia', p),
  platform: process.platform,
  kbCapture: (on) => ipcRenderer.send('kb:capture', on),
  onCombo: (cb) => ipcRenderer.on('kb:combo', (_e, c) => cb(c)),
  onCloseWarn: (cb) => ipcRenderer.on('kb:closeWarn', () => cb()),
  // cập nhật phần mềm và kiến thức
  update: {
    state: () => ipcRenderer.invoke('upd:state'),
    check: () => ipcRenderer.invoke('upd:check'),
    install: () => ipcRenderer.invoke('upd:install'),
    onState: (cb) => ipcRenderer.on('upd:state', (_e, s) => cb(s)),
    _simulate: (o) => ipcRenderer.invoke('upd:_simulate', o),
  },
  ic3: {
    status: () => ipcRenderer.invoke('ic3:status'),
    submit: (r) => ipcRenderer.invoke('ic3:submit', r),
    hello: (p) => ipcRenderer.invoke('ic3:hello', p),
    leaderboard: (cls, period) => ipcRenderer.invoke('ic3:leaderboard', { cls, period }),
    setHost: (h) => ipcRenderer.invoke('ic3:setHost', h),
    sets: () => ipcRenderer.invoke('ic3:sets'),
    exportOutbox: (items) => ipcRenderer.invoke('ic3:exportOutbox', items),
    onStudent: (cb) => ipcRenderer.on('ic3:student', (_e, d) => cb(d)),
    t: {
      hasPassword: () => ipcRenderer.invoke('ic3:t:hasPassword'),
      login: (p) => ipcRenderer.invoke('ic3:t:login', p),
      setPassword: (o) => ipcRenderer.invoke('ic3:t:setPassword', o),
      info: () => ipcRenderer.invoke('ic3:t:info'),
      start: () => ipcRenderer.invoke('ic3:t:start'),
      stop: () => ipcRenderer.invoke('ic3:t:stop'),
      setRoom: (o) => ipcRenderer.invoke('ic3:t:setRoom', o),
      results: () => ipcRenderer.invoke('ic3:t:results'),
      del: (ids) => ipcRenderer.invoke('ic3:t:delete', ids),
      exportCsv: (name, csv) => ipcRenderer.invoke('ic3:t:export', { name, csv }),
      importFiles: () => ipcRenderer.invoke('ic3:t:import'),
      ips: () => ipcRenderer.invoke('ic3:ips'),
      onEvent: (cb) => ipcRenderer.on('ic3:teacher', (_e, d) => cb(d)),
      newRecovery: () => ipcRenderer.invoke('ic3:t:newRecovery'),
      recover: (o) => ipcRenderer.invoke('ic3:t:recover', o),
      openData: () => ipcRenderer.invoke('ic3:t:openData'),
      dataPath: () => ipcRenderer.invoke('ic3:t:dataPath'),
      lib: () => ipcRenderer.invoke('ic3:t:lib'),
      putSet: (s) => ipcRenderer.invoke('ic3:t:putSet', s),
      delSet: (id) => ipcRenderer.invoke('ic3:t:delSet', id),
      setMemes: (m) => ipcRenderer.invoke('ic3:t:setMemes', m),
      saveMedia: (bytes) => ipcRenderer.invoke('ic3:t:saveMedia', bytes),
      mediaFromUrl: (u) => ipcRenderer.invoke('ic3:t:mediaFromUrl', u),
      sample: (k) => ipcRenderer.invoke('ic3:t:sample', k),
      readDocx: (bytes) => ipcRenderer.invoke('ic3:t:readDocx', bytes),
    },
  },
  content: {
    get: (name) => ipcRenderer.invoke('content:get', name),
    onUpdated: (cb) => ipcRenderer.on('content:updated', (_e, d) => cb(d)),
  },
});

// ===== Thông báo cập nhật (hiện trên mọi trang) =====
window.addEventListener('DOMContentLoaded', () => {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483000;';
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host { all: initial; }
    .card { font: 13px -apple-system, 'Segoe UI', Inter, system-ui, sans-serif; color: #1d1d1f; width: 320px; background: rgba(255,255,255,.94); backdrop-filter: blur(20px); border-radius: 18px; box-shadow: 0 18px 50px rgba(0,0,0,.22), 0 0 0 1px rgba(0,0,0,.06); padding: 14px 16px; margin-top: 10px; animation: in .35s cubic-bezier(.2,.8,.2,1); position: relative; }
    @keyframes in { from { opacity: 0; transform: translateY(14px) scale(.98); } }
    .t { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; padding-right: 18px; }
    .d { color: #6e6e73; margin-top: 4px; line-height: 1.45; white-space: pre-line; max-height: 90px; overflow: auto; }
    .bar { height: 6px; background: #e5e5ea; border-radius: 6px; margin-top: 10px; overflow: hidden; }
    .bar i { display: block; height: 100%; background: linear-gradient(90deg, #0a84ff, #bf5af2); border-radius: 6px; transition: width .3s; }
    .row { display: flex; gap: 8px; margin-top: 12px; }
    button { font: 600 12.5px inherit; font-family: inherit; border: 0; border-radius: 980px; padding: 8px 14px; cursor: pointer; background: #f2f2f7; color: #1d1d1f; }
    button.p { background: #0071e3; color: #fff; }
    .x { position: absolute; top: 8px; right: 10px; background: none; padding: 4px 6px; color: #8e8e93; font-size: 14px; }
    .spin { width: 14px; height: 14px; border: 2px solid #d1d1d6; border-top-color: #0a84ff; border-radius: 50%; animation: sp .8s linear infinite; }
    @keyframes sp { to { transform: rotate(360deg); } }
  </style><div id="box"></div>`;
  const box = root.getElementById('box');
  const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let appCard = '', contentCard = '', hideApp = null, hidden = {};
  const draw = () => { box.innerHTML = contentCard + appCard; bind(); };
  const bind = () => {
    root.querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => {
      const a = b.dataset.act;
      if (a === 'install') ipcRenderer.invoke('upd:install');
      if (a === 'folder') ipcRenderer.invoke('upd:showFile');
      if (a === 'close-app') { hidden[b.dataset.key] = true; appCard = ''; draw(); }
      if (a === 'close-content') { contentCard = ''; draw(); }
      if (a === 'wiki') { const m = location.href.match(/^(.*\/src\/)/); if (m) location.href = m[1] + 'wiki/wiki.html' + (b.dataset.id ? '#/a/' + b.dataset.id : ''); contentCard = ''; draw(); }
    }));
  };
  const card = (key, icon, title, desc, extra = '') => `<div class="card"><button class="x" data-act="close-app" data-key="${key}">✕</button><div class="t">${icon} ${title}</div>${desc ? `<div class="d">${desc}</div>` : ''}${extra}</div>`;
  ipcRenderer.on('upd:state', (_e, s) => {
    clearTimeout(hideApp);
    const key = s.phase + (s.version || '');
    if (hidden[key]) return;
    const v = esc(s.version);
    if (s.phase === 'checking') appCard = s.manual ? card(key, '<span class="spin"></span>', 'Đang kiểm tra cập nhật…', '') : '';
    else if (s.phase === 'downloading') appCard = card(key, '⬇️', `Đang tải phiên bản ${v}`, 'Em vẫn dùng phần mềm bình thường trong lúc tải.', `<div class="bar"><i style="width:${s.percent || 0}%"></i></div><div class="d">${s.percent || 0}%</div>`);
    else if (s.phase === 'ready') appCard = card(key, '✨', `Phiên bản ${v} đã sẵn sàng`, esc(s.notes) || 'Khởi động lại để dùng bản mới. Nếu để sau, bản mới sẽ được cài khi em tắt phần mềm.', `<div class="row"><button class="p" data-act="install">Khởi động lại &amp; cập nhật</button><button data-act="close-app" data-key="${key}">Để sau</button></div>`);
    else if (s.phase === 'manual') appCard = s.file
      ? card(key, '📦', `Đã tải bộ cài ${v}`, `Bộ cài đã nằm trong thư mục Tải xuống. Hãy đóng phần mềm rồi mở bộ cài để cập nhật.`, `<div class="row"><button class="p" data-act="install">Mở bộ cài</button><button data-act="folder">Xem trong thư mục</button></div>`)
      : card(key, '🆕', `Có phiên bản mới ${v}`, esc(s.notes), `<div class="row"><button class="p" data-act="install">Mở trang tải về</button></div>`);
    else if (s.phase === 'latest' && s.manual) { appCard = card(key, '✅', 'Em đang dùng phiên bản mới nhất', 'Phiên bản ' + esc(s.current)); hideApp = setTimeout(() => { appCard = ''; draw(); }, 4000); }
    else if (s.phase === 'error' && s.manual) { appCard = card(key, '⚠️', 'Chưa kiểm tra được cập nhật', 'Hãy kiểm tra kết nối Internet rồi thử lại.\n' + esc(s.error).slice(0, 160)); hideApp = setTimeout(() => { appCard = ''; draw(); }, 8000); }
    else appCard = '';
    draw();
  });
  ipcRenderer.on('content:updated', (_e, d) => {
    const n = d.added.length, m = d.updated.length; if (!n && !m) return;
    const first = d.added[0] || d.updated[0];
    const list = [...d.added.map((a) => '• Mới: ' + a.title), ...d.updated.map((a) => '• Cập nhật: ' + a.title)].slice(0, 5).map(esc).join('\n');
    contentCard = `<div class="card"><button class="x" data-act="close-content">✕</button><div class="t">📚 Bách khoa có kiến thức mới</div><div class="d">${list}</div><div class="row"><button class="p" data-act="wiki" data-id="${esc(first.id)}">Xem ngay</button></div></div>`;
    draw();
  });
  ipcRenderer.invoke('upd:state').then((s) => { if (s && (s.phase === 'ready' || s.phase === 'downloading' || (s.phase === 'manual' && s.file))) ipcRenderer.emit('upd:state', null, s); }).catch(() => {});
});
