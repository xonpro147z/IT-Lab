// Công cụ kiểm thử: mở 1 trang, chạy script, chụp màn hình. Dùng: electron tools/shot.js <page> <out.png> [script.js]
const { app, BrowserWindow } = require('electron');
const path = require('path'); const fs = require('fs');
const [page, out, scriptFile] = process.argv.filter(a => !a.startsWith('--')).slice(2);
app.commandLine.appendSwitch('use-angle', 'swiftshader');
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1366, height: 800, show: true, webPreferences: { preload: path.join(__dirname, '..', 'preload.js') } });
  win.webContents.on('console-message', (e, level, msg, line, src) => { if (level >= 2) console.log('CONSOLE', level, msg, src + ':' + line); });
  await win.loadFile(path.join(__dirname, '..', 'src', page));
  await new Promise(r => setTimeout(r, 2500));
  if (scriptFile) {
    const code = fs.readFileSync(scriptFile, 'utf8');
    try { const r = await win.webContents.executeJavaScript(code); if (r !== undefined) console.log('RESULT', JSON.stringify(r)); } catch (e) { console.log('SCRIPT ERROR', e.message); }
    await new Promise(r => setTimeout(r, 2500));
  }
  const img = await win.webContents.capturePage();
  fs.writeFileSync(out, img.toPNG());
  app.quit();
});
