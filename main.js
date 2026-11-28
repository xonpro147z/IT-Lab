// TinHocLab – Phần mềm thực hành Tin học
// Tiến trình chính của Electron
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
let kbCapture = false, lastAltF4 = 0, lastCloseTry = 0;
function setCapture(on) { kbCapture = !!on; if (win && !win.isDestroyed()) win.webContents.setIgnoreMenuShortcuts(kbCapture); }
ipcMain.on('kb:capture', (_e, on) => setCapture(on));

function createWindow() {
  win = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1100,
    minHeight: 680,
    title: 'TinHocLab – Thực hành Tin học',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#f3f2f1',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  // Phòng luyện phím tắt: tạm bỏ phím tắt của menu, chặn Alt+F4 đóng ứng dụng
  win.webContents.on('before-input-event', (e, input) => {
    if (!kbCapture || input.type !== 'keyDown') return;
    if (input.alt && input.key === 'F4') { lastAltF4 = Date.now(); e.preventDefault(); win.webContents.send('kb:combo', 'Alt+F4'); }
  });
  win.on('close', (e) => {
    if (!kbCapture) return;
    const now = Date.now();
    if (now - lastAltF4 < 1500) { e.preventDefault(); return; }
    // Trên Linux/macOS, Alt+F4 có thể bị hệ điều hành bắt trước: chặn lần đầu, lần thứ hai mới thoát
    if (now - lastCloseTry > 4000) { lastCloseTry = now; e.preventDefault(); win.webContents.send('kb:combo', 'Alt+F4'); win.webContents.send('kb:closeWarn'); }
  });
  win.webContents.on('did-start-navigation', (_e, _url, _inPlace, isMain) => { if (isMain) setCapture(false); });
  // Liên kết web (http/https) luôn mở bằng trình duyệt hệ thống, không mở trong cửa sổ ứng dụng
  win.webContents.on('will-navigate', (e, url) => { if (/^https?:/.test(url)) { e.preventDefault(); shell.openExternal(url); } });
  win.webContents.on('will-frame-navigate', (e) => { if (/^https?:/.test(e.url)) { e.preventDefault(); shell.openExternal(e.url); } });
  // Mở liên kết ngoài bằng trình duyệt hệ thống
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

const menuTemplate = [
  ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
  {
    label: 'Tệp',
    submenu: [
      { label: 'Về màn hình chính', accelerator: 'CmdOrCtrl+H', click: () => win && win.loadFile(path.join(__dirname, 'src', 'index.html')) },
      { label: 'Kiểm tra cập nhật…', click: () => require('./updater').checkAll(true) },
      { type: 'separator' },
      process.platform === 'darwin' ? { role: 'close', label: 'Đóng' } : { role: 'quit', label: 'Thoát' },
    ],
  },
  {
    label: 'Sửa',
    submenu: [
      { role: 'undo', label: 'Hoàn tác' }, { role: 'redo', label: 'Làm lại' }, { type: 'separator' },
      { role: 'cut', label: 'Cắt' }, { role: 'copy', label: 'Sao chép' }, { role: 'paste', label: 'Dán' },
      { role: 'selectAll', label: 'Chọn tất cả' },
    ],
  },
  {
    label: 'Xem',
    submenu: [
      { role: 'reload', label: 'Tải lại' },
      { role: 'toggleDevTools', label: 'Công cụ phát triển' },
      { type: 'separator' },
      { role: 'resetZoom', label: 'Cỡ thật' }, { role: 'zoomIn', label: 'Phóng to' }, { role: 'zoomOut', label: 'Thu nhỏ' },
      { type: 'separator' },
      { role: 'togglefullscreen', label: 'Toàn màn hình' },
    ],
  },
];

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  createWindow();
  require('./updater').init();
  require('./ic3main').init();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ===== Lưu / mở tệp bài làm =====
ipcMain.handle('file:save', async (_e, { defaultName, filters, content, encoding }) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: defaultName, filters });
  if (r.canceled || !r.filePath) return { ok: false };
  if (encoding === 'base64') fs.writeFileSync(r.filePath, Buffer.from(content, 'base64'));
  else fs.writeFileSync(r.filePath, content, 'utf8');
  return { ok: true, path: r.filePath };
});

ipcMain.handle('file:open', async (_e, { filters }) => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters });
  if (r.canceled || !r.filePaths.length) return { ok: false };
  const p = r.filePaths[0];
  return { ok: true, path: p, content: fs.readFileSync(p, 'utf8') };
});

ipcMain.handle('file:openImage', async () => {
  const r = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Hình ảnh', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }],
  });
  if (r.canceled || !r.filePaths.length) return { ok: false };
  const p = r.filePaths[0];
  const ext = path.extname(p).slice(1).toLowerCase().replace('jpg', 'jpeg');
  return { ok: true, dataUrl: `data:image/${ext};base64,${fs.readFileSync(p).toString('base64')}` };
});

ipcMain.handle('app:version', () => app.getVersion());

// ===== Video / audio cho PowerPoint =====
const MEDIA = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/mp4', ogv: 'video/ogg', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', ogg: 'audio/ogg' };
const mediaMime = (p) => MEDIA[path.extname(p).slice(1).toLowerCase()];
ipcMain.handle('file:openMedia', async (_e, kind) => {
  const exts = kind === 'audio' ? ['mp3', 'wav', 'm4a', 'ogg'] : ['mp4', 'webm', 'mov', 'm4v', 'ogv'];
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: kind === 'audio' ? 'Audio Files' : 'Video Files', extensions: exts }] });
  if (r.canceled || !r.filePaths.length) return { ok: false };
  const p = r.filePaths[0];
  if (fs.statSync(p).size > 300 * 1024 * 1024) return { ok: false, error: 'too big' };
  return { ok: true, path: p, name: path.basename(p), mime: mediaMime(p), data: fs.readFileSync(p) };
});
ipcMain.handle('file:readMedia', async (_e, p) => {
  try { if (!mediaMime(p) || !fs.existsSync(p)) return { ok: false }; return { ok: true, mime: mediaMime(p), data: fs.readFileSync(p) }; } catch { return { ok: false }; }
});
