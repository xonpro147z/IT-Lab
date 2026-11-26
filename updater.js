// TinHocLab – Cập nhật tự động
// 1) Phần mềm: tải phiên bản mới từ GitHub Releases (electron-updater). Trên máy không tự cài được
//    (macOS chưa ký số, bản Portable) thì tự tải bộ cài về thư mục Tải xuống.
// 2) Kiến thức: tải gói bài viết Bách khoa (content/wiki) từ GitHub, không cần cài lại phần mềm.
const { app, ipcMain, shell, net, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const OWNER = 'xonpro147z', REPO = 'IT-Lab', BRANCH = 'main';
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/content/wiki/`;
const CHECK_EVERY = 3 * 60 * 60 * 1000; // 3 giờ

let autoUpdater = null;
try { ({ autoUpdater } = require('electron-updater')); } catch { autoUpdater = null; }

const S = { phase: 'idle', current: app.getVersion(), version: null, percent: 0, notes: '', url: null, file: null, error: null, manual: false, mode: null, content: null };
const send = () => BrowserWindow.getAllWindows().forEach((w) => !w.isDestroyed() && w.webContents.send('upd:state', S));
const set = (o) => { Object.assign(S, o); send(); };

const cmp = (a, b) => { const x = String(a).replace(/^v/, '').split('.').map(Number), y = String(b).replace(/^v/, '').split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
const isPortable = () => !!process.env.PORTABLE_EXECUTABLE_DIR;
// Có tự cài được bằng electron-updater không?
function canAutoInstall() {
  if (!app.isPackaged || !autoUpdater) return false;
  if (process.platform === 'win32') return !isPortable();
  if (process.platform === 'linux') return true; // AppImage hoặc .deb
  return false; // macOS chưa ký số: không tự cài được
}

async function getJSON(url) {
  const r = await net.fetch(url, { headers: { 'User-Agent': 'TinHocLab', Accept: 'application/vnd.github+json' }, cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
async function getText(url) {
  const r = await net.fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), { headers: { 'User-Agent': 'TinHocLab' }, cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}

// ---------- 1. Cập nhật phần mềm ----------
if (autoUpdater) {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => set({ phase: 'checking', error: null }));
  autoUpdater.on('update-available', (i) => set({ phase: 'downloading', version: i.version, notes: notesOf(i.releaseNotes), percent: 0 }));
  autoUpdater.on('update-not-available', () => set({ phase: 'latest', version: null }));
  autoUpdater.on('download-progress', (p) => set({ phase: 'downloading', percent: Math.round(p.percent) }));
  autoUpdater.on('update-downloaded', (i) => set({ phase: 'ready', version: i.version, percent: 100, notes: notesOf(i.releaseNotes) }));
  autoUpdater.on('error', (e) => { if (S.mode === 'auto') { S.mode = 'manual'; manualCheck().catch((er) => set({ phase: 'error', error: String(er.message || er) })); } else set({ phase: 'error', error: String(e && e.message ? e.message : e) }); });
}
const notesOf = (n) => (Array.isArray(n) ? n.map((x) => x.note).join('\n') : String(n || '')).replace(/<[^>]+>/g, '').trim().slice(0, 600);

function pickAsset(assets) {
  const n = (a) => a.name.toLowerCase();
  if (process.platform === 'win32') return assets.find((a) => n(a).endsWith(isPortable() ? 'portable.exe' : 'setup.exe')) || assets.find((a) => n(a).endsWith('.exe'));
  if (process.platform === 'darwin') { const arch = process.arch === 'arm64' ? 'arm64' : 'x64'; return assets.find((a) => n(a).endsWith(`${arch}.dmg`)) || assets.find((a) => n(a).endsWith('.dmg')); }
  return assets.find((a) => n(a).endsWith(process.env.APPIMAGE ? '.appimage' : '.deb')) || assets.find((a) => n(a).endsWith('.deb'));
}
// Kiểm tra qua GitHub API rồi tự tải bộ cài về thư mục Tải xuống
async function manualCheck() {
  set({ phase: 'checking', error: null });
  const rel = await getJSON(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`);
  const ver = String(rel.tag_name || '').replace(/^v/, '');
  if (!ver || cmp(ver, app.getVersion()) <= 0) return set({ phase: 'latest', version: null });
  const asset = pickAsset(rel.assets || []);
  set({ phase: 'downloading', version: ver, notes: notesOf(rel.body), url: rel.html_url, percent: 0 });
  if (!asset) return set({ phase: 'manual', file: null });
  const dest = path.join(app.getPath('downloads'), asset.name);
  if (fs.existsSync(dest) && fs.statSync(dest).size === asset.size) return set({ phase: 'manual', file: dest, percent: 100 });
  await download(asset.browser_download_url, dest + '.part', asset.size);
  fs.renameSync(dest + '.part', dest);
  set({ phase: 'manual', file: dest, percent: 100 });
}
async function download(url, dest, total) {
  const r = await net.fetch(url, { headers: { 'User-Agent': 'TinHocLab' } });
  if (!r.ok || !r.body) throw new Error('Không tải được bộ cài (HTTP ' + r.status + ')');
  const out = fs.createWriteStream(dest); let got = 0, last = 0;
  const reader = r.body.getReader();
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    out.write(Buffer.from(value)); got += value.length;
    const p = total ? Math.round((got / total) * 100) : 0; if (p !== last) { last = p; set({ percent: p }); }
  }
  await new Promise((res, rej) => out.end((e) => (e ? rej(e) : res())));
}
async function checkApp(manual) {
  S.manual = manual;
  if (!app.isPackaged) { // chạy thử khi phát triển: chỉ kiểm tra, không tải
    try { const rel = await getJSON(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`); const v = String(rel.tag_name || '').replace(/^v/, ''); set(cmp(v, app.getVersion()) > 0 ? { phase: 'manual', version: v, url: rel.html_url, file: null, notes: notesOf(rel.body) } : { phase: 'latest' }); } catch (e) { set({ phase: 'error', error: String(e.message || e) }); }
    return;
  }
  if (canAutoInstall()) { S.mode = 'auto'; try { await autoUpdater.checkForUpdates(); } catch { /* chuyển sang tải thủ công trong sự kiện error */ } }
  else { S.mode = 'manual'; try { await manualCheck(); } catch (e) { set({ phase: 'error', error: String(e.message || e) }); } }
}

// ---------- 2. Cập nhật kiến thức (gói bài Bách khoa) ----------
const contentDir = () => path.join(app.getPath('userData'), 'content', 'wiki');
const bundledDir = () => path.join(__dirname, 'content', 'wiki');
function readPack(dir) {
  try { const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); return { manifest: m, files: (m.articles || []).map((f) => ({ name: f, text: fs.readFileSync(path.join(dir, f), 'utf8') })) }; } catch { return null; }
}
const hashPack = (p) => crypto.createHash('sha1').update(JSON.stringify(p.manifest) + p.files.map((f) => f.text).join('\u0000')).digest('hex');
function localPack() {
  const a = readPack(contentDir()), b = readPack(bundledDir());
  if (a && b) return (a.manifest.version || 0) >= (b.manifest.version || 0) ? a : b;
  return a || b;
}
const titleOf = (t) => ((t.match(/^title:\s*(.+)$/m) || [])[1] || '').trim();
const idOf = (t) => ((t.match(/^id:\s*(.+)$/m) || [])[1] || '').trim();
async function checkContent() {
  try {
    const manifest = JSON.parse(await getText(RAW + 'manifest.json'));
    if (manifest.minApp && cmp(manifest.minApp, app.getVersion()) > 0) return; // cần bản phần mềm mới hơn
    const names = (manifest.articles || []).filter((f) => /^[\w.-]+\.md$/.test(f)).slice(0, 300);
    const files = [];
    for (const f of names) files.push({ name: f, text: await getText(RAW + encodeURIComponent(f)) });
    const fresh = { manifest, files };
    const old = localPack();
    if (old && hashPack(old) === hashPack(fresh)) return;
    const dir = contentDir(); fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    for (const f of files) fs.writeFileSync(path.join(dir, f.name), f.text);
    const before = new Map((old ? old.files : []).map((f) => [idOf(f.text), f.text]));
    const added = files.filter((f) => !before.has(idOf(f.text))).map((f) => ({ id: idOf(f.text), title: titleOf(f.text) }));
    const updated = files.filter((f) => before.has(idOf(f.text)) && before.get(idOf(f.text)) !== f.text).map((f) => ({ id: idOf(f.text), title: titleOf(f.text) }));
    set({ content: { version: manifest.version || 0, added, updated, at: Date.now() } });
    BrowserWindow.getAllWindows().forEach((w) => !w.isDestroyed() && w.webContents.send('content:updated', { added, updated }));
  } catch { /* không có mạng: dùng bản đã lưu */ }
}

async function checkAll(manual = false) {
  await Promise.all([checkContent(), checkApp(manual)]);
  return S;
}

function init() {
  ipcMain.handle('upd:state', () => S);
  ipcMain.handle('upd:check', () => checkAll(true));
  ipcMain.handle('upd:install', () => {
    if (S.phase === 'ready' && autoUpdater) { setImmediate(() => autoUpdater.quitAndInstall(false, true)); return true; }
    if (S.phase === 'manual' && S.file) { shell.openPath(S.file); return true; }
    if (S.url) { shell.openExternal(S.url); return true; }
    return false;
  });
  ipcMain.handle('upd:showFile', () => { if (S.file) shell.showItemInFolder(S.file); });
  // chỉ dùng khi phát triển để thử giao diện thông báo
  ipcMain.handle('upd:_simulate', (_e, o) => { if (app.isPackaged) return; if (o.content) BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('content:updated', o.content)); else set(o); });
  ipcMain.handle('content:get', (_e, name) => (name === 'wiki' ? localPack() : null));
  setTimeout(() => checkAll(false), 6000);
  setInterval(() => checkAll(false), CHECK_EVERY);
}
module.exports = { init, checkAll };
