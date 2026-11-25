// TinHocLab – Phần mềm thực hành Tin học
// Tiến trình chính của Electron
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win;

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
