// electron tools/shotseq.js <page> <outPrefix> <js-expression-per-step...>
const { app, BrowserWindow } = require('electron');
const path = require('path'); const fs = require('fs');
const args = process.argv.filter(a => !a.startsWith('--')).slice(2);
const [page, prefix, ...steps] = args;
app.commandLine.appendSwitch('use-angle', 'swiftshader'); app.commandLine.appendSwitch('enable-unsafe-swiftshader');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1366, height: 800, show: true, webPreferences: { preload: path.join(__dirname, '..', 'preload.js') } });
  win.webContents.on('console-message', (e, level, msg) => { if (level >= 3) console.log('CONSOLE', msg); });
  await win.loadFile(path.join(__dirname, '..', 'src', page));
  await new Promise(r => setTimeout(r, 2500));
  for (let i = 0; i < steps.length; i++) {
    await win.webContents.executeJavaScript(steps[i]).catch(e => console.log('ERR', e.message));
    await new Promise(r => setTimeout(r, 1500));
    fs.writeFileSync(`${prefix}${i}.png`, (await win.webContents.capturePage()).toPNG());
  }
  app.quit();
});
