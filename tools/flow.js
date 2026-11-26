// Kiểm thử luồng: electron tools/flow.js <page> <steps.js> [out.png]
// steps.js exports async function (t) với t.js(code), t.key(k, mods), t.type(text), t.wait(ms), t.shot(file), t.log(...)
const { app, BrowserWindow } = require('electron'); const path = require('path'); const fs = require('fs');
const args = process.argv.filter((a) => !a.startsWith('--')).slice(2);
const [page, stepsFile] = args;
app.commandLine.appendSwitch('use-angle', 'swiftshader'); app.commandLine.appendSwitch('enable-unsafe-swiftshader');
const LOG = '/tmp/flow.log'; fs.writeFileSync(LOG, '');
const log = (...a) => fs.appendFileSync(LOG, a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + '\n');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1366, height: 800, show: true, webPreferences: { preload: path.join(__dirname, '..', 'preload.js') } });
  win.webContents.on('console-message', (e, l, m, line, src) => { if (l >= 2) log('CONSOLE', m, (src || '').split('/').pop() + ':' + line); });
  const [file, q] = page.split('?');
  await win.loadFile(path.join(__dirname, '..', 'src', file), q ? { search: q } : {});
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  await wait(1800);
  const t = {
    js: (c) => Promise.race([win.webContents.executeJavaScript(c), wait(5000).then(() => 'TIMEOUT')]),
    async key(k, mods = []) { win.webContents.sendInputEvent({ type: 'keyDown', keyCode: k, modifiers: mods }); if (k.length === 1 && !mods.some((m) => ['control', 'alt', 'meta'].includes(m))) win.webContents.sendInputEvent({ type: 'char', keyCode: mods.includes('shift') ? k.toUpperCase() : k, modifiers: mods }); win.webContents.sendInputEvent({ type: 'keyUp', keyCode: k, modifiers: mods }); await wait(60); },
    async type(s) { for (const ch of s) { win.webContents.sendInputEvent({ type: 'char', keyCode: ch }); await wait(25); } await wait(60); },
    wait, log,
    async shot(f) { fs.writeFileSync(f, (await win.webContents.capturePage()).toPNG()); },
  };
  try { await require(path.resolve(stepsFile))(t); } catch (e) { log('STEP ERROR', e.message); }
  app.quit();
});
