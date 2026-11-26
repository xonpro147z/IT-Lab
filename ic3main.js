// Nối phần Ôn luyện IC3 (giao diện) với kết nối LAN (lan.js)
const { app, ipcMain, BrowserWindow, dialog, shell, net } = require('electron');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { TeacherServer, StudentClient, lanIPs } = require('./lan');

let teacher, student, authed = false;
// ---- đọc .docx (zip) không cần thư viện ngoài ----
function unzipEntry(buf, want) {
  const zlib = require('zlib');
  let e = buf.length - 22; while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error('Tệp Word bị hỏng');
  let p = buf.readUInt32LE(e + 16); const n = buf.readUInt16LE(e + 10);
  for (let i = 0; i < n; i++) {
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nl);
    if (name === want) { const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28); const data = buf.subarray(start, start + csize); return method === 8 ? zlib.inflateRawSync(data) : data; }
    p += 46 + nl + xl + cl;
  }
  return null;
}
function readDocx(buf) {
  const xml = unzipEntry(buf, 'word/document.xml'); if (!xml) throw new Error('Không phải tệp Word (.docx)');
  const s = xml.toString('utf8'); const dec = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  const paras = [];
  for (const pm of s.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)) {
    const spans = [];
    for (const rm of pm[0].matchAll(/<w:r[ >][\s\S]*?<\/w:r>/g)) {
      const r = rm[0]; const pr = (r.match(/<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0];
      const on = (tag) => { const m = pr.match(new RegExp(`<w:${tag}(?:\\s+w:val="([^"]*)")?\\s*/>`)); return !!m && !/^(0|false|none)$/i.test(m[1] || ''); };
      const col = (pr.match(/<w:color w:val="([0-9A-Fa-f]{6})"/) || [])[1];
      const colored = col && !/^(000000|auto)$/i.test(col) && (() => { const v = parseInt(col, 16), R = v >> 16, G = (v >> 8) & 255, B = v & 255; return Math.max(R, G, B) - Math.min(R, G, B) > 60; })();
      const mark = on('b') || on('u') || /<w:highlight /.test(pr) || colored;
      for (const tm of r.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/g)) spans.push({ s: tm[1] !== undefined ? dec(tm[1]) : ' ', b: mark });
    }
    paras.push(spans);
  }
  return paras;
}
const newCode = () => Array.from(crypto.randomBytes(8), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('').replace(/(.{4})(.{4})/, '$1-$2');
const fileURL = (d) => pathToFileURL(d).href + '/';
const broadcast = (ch, d) => BrowserWindow.getAllWindows().forEach((w) => !w.isDestroyed() && w.webContents.send(ch, d));
const hash = (s) => crypto.createHash('sha256').update('thl-ic3:' + s).digest('hex');

function init() {
  const dir = path.join(app.getPath('userData'), 'ic3');
  teacher = new TeacherServer(dir, (type, d) => broadcast('ic3:teacher', { type, data: d }));
  student = new StudentClient(dir, (type, d) => broadcast('ic3:student', { type, data: d }));
  if (teacher.cfg.autoStart) teacher.start();

  // ----- học sinh -----
  ipcMain.handle('ic3:status', () => student.status());
  ipcMain.handle('ic3:submit', (_e, r) => student.submit(r));
  ipcMain.handle('ic3:hello', (_e, p) => student.hello(p));
  ipcMain.handle('ic3:leaderboard', async (_e, { cls, period }) => { try { return { ok: true, rows: await student.leaderboard(cls, period) }; } catch (e) { return { ok: false, error: String(e.message) }; } });
  ipcMain.handle('ic3:sets', async () => {
    const r = await student.fetchSets();
    const sets = r.sets.map((x) => ({ ...x, base: fileURL(r.dir) }));
    let memes = { ...r.memes, base: fileURL(r.dir) };
    // máy này cũng là máy giáo viên: dùng luôn đề của mình (không cần mạng)
    const own = teacher.publicLib();
    for (const x of own.sets) { const i = sets.findIndex((y) => y.id === x.id); const v = { ...x, base: fileURL(teacher.mediaDir), own: true }; if (i >= 0) sets[i] = v; else sets.push(v); }
    if (!(memes.ok.length || memes.no.length) && (own.memes.ok.length || own.memes.no.length)) memes = { ...own.memes, base: fileURL(teacher.mediaDir) };
    return { sets, memes, fresh: r.fresh, from: r.from || '' };
  });
  ipcMain.handle('ic3:setHost', (_e, host) => student.setManualHost(host));

  // ----- giáo viên -----
  ipcMain.handle('ic3:t:hasPassword', () => ({ has: !!teacher.cfg.pass, rec: !!teacher.cfg.rec }));
  ipcMain.handle('ic3:t:login', (_e, pass) => {
    pass = String(pass || '');
    if (!teacher.cfg.pass) { if (pass.length < 4) return false; teacher.cfg.pass = hash(pass); teacher.saveCfg(); authed = true; return true; }
    authed = teacher.cfg.pass === hash(pass); return authed;
  });
  ipcMain.handle('ic3:t:setPassword', (_e, { old, next }) => {
    next = String(next || '');
    if (next.length < 4) return { ok: false, msg: 'Mật khẩu mới cần ít nhất 4 ký tự' };
    if (teacher.cfg.pass && teacher.cfg.pass !== hash(String(old || ''))) return { ok: false, msg: 'Mật khẩu hiện tại không đúng' };
    teacher.cfg.pass = hash(next); teacher.saveCfg(); return { ok: true };
  });
  ipcMain.handle('ic3:t:newRecovery', () => { if (!authed) return null; const c = newCode(); teacher.cfg.rec = hash(c.replace('-', '')); teacher.saveCfg(); return c; });
  ipcMain.handle('ic3:t:recover', (_e, { code, next }) => {
    const c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!teacher.cfg.rec || teacher.cfg.rec !== hash(c)) return { ok: false, msg: 'Mã khôi phục không đúng' };
    if (String(next || '').length < 4) return { ok: false, msg: 'Mật khẩu mới cần ít nhất 4 ký tự' };
    teacher.cfg.pass = hash(String(next)); teacher.saveCfg(); authed = true; return { ok: true };
  });
  ipcMain.handle('ic3:t:openData', () => shell.openPath(dir));
  ipcMain.handle('ic3:t:dataPath', () => path.join(dir, 'teacher.json'));
  // ----- soạn đề -----
  const guard = () => { if (!authed) throw new Error('Chưa đăng nhập giáo viên'); };
  ipcMain.handle('ic3:t:lib', () => { guard(); return { ...teacher.lib, base: fileURL(teacher.mediaDir) }; });
  ipcMain.handle('ic3:t:putSet', (_e, set) => { guard(); return teacher.putSet(set); });
  ipcMain.handle('ic3:t:delSet', (_e, id) => { guard(); return teacher.delSet(id); });
  ipcMain.handle('ic3:t:setMemes', (_e, m) => { guard(); return teacher.setMemes(m); });
  ipcMain.handle('ic3:t:saveMedia', (_e, bytes) => { guard(); try { return { ok: true, ...teacher.saveMedia(Buffer.from(bytes)) }; } catch (e) { return { ok: false, msg: e.message }; } });
  ipcMain.handle('ic3:t:mediaFromUrl', async (_e, url) => {
    guard();
    try {
      url = String(url || '').trim();
      if (url.startsWith('data:')) { const m = url.match(/^data:[^;,]*(;base64)?,(.*)$/s); if (!m) throw new Error('Dữ liệu ảnh không hợp lệ'); return { ok: true, ...teacher.saveMedia(m[1] ? Buffer.from(m[2], 'base64') : Buffer.from(decodeURIComponent(m[2]))) }; }
      if (!/^https?:\/\//i.test(url)) throw new Error('Đường dẫn phải bắt đầu bằng http:// hoặc https://');
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 30000);
      const r = await net.fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 TinHocLab' } }); clearTimeout(to);
      if (!r.ok) throw new Error('Không tải được (mã ' + r.status + ')');
      const len = +r.headers.get('content-length') || 0; if (len > 80 * 1024 * 1024) throw new Error('Tệp quá lớn (tối đa 80 MB)');
      return { ok: true, ...teacher.saveMedia(Buffer.from(await r.arrayBuffer())) };
    } catch (e) { return { ok: false, msg: e.name === 'AbortError' ? 'Tải quá lâu, hãy thử lại' : e.message }; }
  });
  ipcMain.handle('ic3:t:readDocx', (_e, bytes) => { try { return { ok: true, paras: readDocx(Buffer.from(bytes)) }; } catch (e) { return { ok: false, msg: e.message }; } });
  ipcMain.handle('ic3:t:sample', async (_e, kind) => {
    const src = path.join(__dirname, 'src', 'ic3', 'mau', kind === 'docx' ? 'Mau-de-IC3.docx' : 'Mau-de-IC3.pdf');
    const r = await dialog.showSaveDialog({ defaultPath: path.basename(src) });
    if (r.canceled || !r.filePath) return false; fs.copyFileSync(src, r.filePath); shell.showItemInFolder(r.filePath); return r.filePath;
  });
  ipcMain.handle('ic3:t:info', () => teacher.info());
  ipcMain.handle('ic3:t:start', () => teacher.start());
  ipcMain.handle('ic3:t:stop', () => teacher.stop(true));
  ipcMain.handle('ic3:t:setRoom', (_e, { room, name }) => { teacher.cfg.room = String(room || 'Phòng máy').slice(0, 40); teacher.cfg.teacher = String(name || 'Giáo viên').slice(0, 40); teacher.saveCfg(); return teacher.info(); });
  ipcMain.handle('ic3:t:results', () => teacher.results);
  ipcMain.handle('ic3:t:delete', (_e, ids) => { const s = new Set(ids); teacher.results = teacher.results.filter((r) => !s.has(r.id)); fs.writeFileSync(teacher.file, JSON.stringify(teacher.results)); return teacher.results.length; });
  ipcMain.handle('ic3:t:export', async (_e, { name, csv }) => {
    const r = await dialog.showSaveDialog({ defaultPath: name, filters: [{ name: 'Excel (CSV)', extensions: ['csv'] }] });
    if (r.canceled || !r.filePath) return false;
    fs.writeFileSync(r.filePath, '﻿' + csv, 'utf8'); // BOM để Excel đọc đúng tiếng Việt
    return r.filePath;
  });
  ipcMain.handle('ic3:t:import', async () => { // nhập kết quả từ máy khác (khi không có mạng LAN)
    const r = await dialog.showOpenDialog({ filters: [{ name: 'Kết quả IC3', extensions: ['json'] }], properties: ['openFile', 'multiSelections'] });
    if (r.canceled) return 0; let n = 0;
    for (const f of r.filePaths) { try { const arr = JSON.parse(fs.readFileSync(f, 'utf8')); for (const x of Array.isArray(arr) ? arr : [arr]) { const res = teacher.addResult(x, 'file'); if (res && res !== 'dup') n++; } } catch {} }
    return n;
  });
  ipcMain.handle('ic3:exportOutbox', async (_e, items) => {
    const r = await dialog.showSaveDialog({ defaultPath: 'ket-qua-ic3.json', filters: [{ name: 'Kết quả IC3', extensions: ['json'] }] });
    if (r.canceled || !r.filePath) return false; fs.writeFileSync(r.filePath, JSON.stringify(items)); return r.filePath;
  });
  ipcMain.handle('ic3:ips', () => lanIPs().map((x) => x.address));
}
module.exports = { init, readDocx };
