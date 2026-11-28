// TinHocLab – Kết nối mạng LAN phòng máy cho phần Ôn luyện IC3
// Máy giáo viên: chạy máy chủ HTTP nhận kết quả + phát tín hiệu UDP để máy học sinh tự tìm thấy.
// Máy học sinh: nghe tín hiệu, gửi kết quả; nếu chưa kết nối được thì xếp hàng chờ gửi lại.
const http = require('http');
const dgram = require('dgram');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HTTP_PORT = 47123, UDP_PORT = 47124, MAGIC = 'TINHOCLAB-IC3';

function lanIPs() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push({ name, address: a.address, netmask: a.netmask });
  return out;
}
const broadcastOf = (ip, mask) => ip.split('.').map((p, i) => (+p | (~+mask.split('.')[i] & 255)) & 255).join('.');
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJSON = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); const tmp = f + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(v)); fs.renameSync(tmp, f); };
const weekKey = (t) => { const d = new Date(t); const day = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10); };
const MEDIA_RE = /^[a-f0-9]{16}\.(png|jpg|gif|webp|mp4|webm|ogg)$/;
const MIME = { png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg' };
// nhận dạng định dạng bằng chữ ký đầu tệp (không tin phần mở rộng)
function sniff(buf) {
  const h = buf.subarray(0, 16), a = (i, str) => h.toString('latin1', i, i + str.length) === str;
  if (h[0] === 0x89 && a(1, 'PNG')) return 'png';
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return 'jpg';
  if (a(0, 'GIF8')) return 'gif';
  if (a(0, 'RIFF') && a(8, 'WEBP')) return 'webp';
  if (a(4, 'ftyp')) return 'mp4';
  if (h[0] === 0x1a && h[1] === 0x45 && h[2] === 0xdf && h[3] === 0xa3) return 'webm';
  if (a(0, 'OggS')) return 'ogg';
  return null;
}
const kindOf = (f) => (/\.(mp4|webm|ogg)$/.test(f) ? 'video' : 'img');
// gom tên các tệp media được dùng trong đề / meme
function mediaRefs(o, out = new Set()) {
  if (!o || typeof o !== 'object') return out;
  if (Array.isArray(o)) { o.forEach((x) => mediaRefs(x, out)); return out; }
  if (typeof o.f === 'string' && MEDIA_RE.test(o.f)) out.add(o.f);
  for (const v of Object.values(o)) if (v && typeof v === 'object') mediaRefs(v, out);
  return out;
}
const normName = (s) => String(s || '').trim().replace(/\s+/g, ' ').slice(0, 60);

// ======================= MÁY GIÁO VIÊN =======================
class TeacherServer {
  constructor(dataDir, onEvent) {
    this.dir = dataDir; this.onEvent = onEvent || (() => {});
    this.file = path.join(dataDir, 'results.json');
    this.results = readJSON(this.file, []);
    this.online = new Map(); // key -> {name, class, ip, activity, at}
    this.server = null; this.udp = null; this.beacon = null;
    this.cfg = readJSON(path.join(dataDir, 'teacher.json'), { room: 'Phòng máy', teacher: 'Giáo viên', autoStart: false });
    this.setsFile = path.join(dataDir, 'sets.json');
    this.mediaDir = path.join(dataDir, 'media');
    this.lib = readJSON(this.setsFile, { sets: [], memes: { ok: [], no: [] } });
  }
  // ---------- đề do giáo viên soạn ----------
  saveLib() { writeJSON(this.setsFile, this.lib); }
  putSet(set) {
    if (!set || !set.id) return null;
    set.updated = Date.now();
    const i = this.lib.sets.findIndex((x) => x.id === set.id);
    if (i >= 0) this.lib.sets[i] = set; else this.lib.sets.unshift(set);
    this.saveLib(); this.gcMedia(); this.onEvent('sets', this.lib.sets.length);
    return set;
  }
  delSet(id) { this.lib.sets = this.lib.sets.filter((x) => x.id !== id); this.saveLib(); this.gcMedia(); return true; }
  setMemes(m) { this.lib.memes = { ok: Array.isArray(m?.ok) ? m.ok : [], no: Array.isArray(m?.no) ? m.no : [] }; this.saveLib(); this.gcMedia(); return this.lib.memes; }
  publicLib() { return { sets: this.lib.sets.filter((x) => x.published && x.qs && x.qs.length), memes: this.lib.memes }; }
  saveMedia(buf) {
    buf = Buffer.from(buf);
    if (buf.length > 80 * 1024 * 1024) throw new Error('Tệp quá lớn (tối đa 80 MB)');
    const ext = sniff(buf); if (!ext) throw new Error('Chỉ hỗ trợ ảnh PNG/JPG/GIF/WEBP và video MP4/WEBM');
    const f = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16) + '.' + ext;
    fs.mkdirSync(this.mediaDir, { recursive: true });
    const p = path.join(this.mediaDir, f); if (!fs.existsSync(p)) fs.writeFileSync(p, buf);
    return { f, k: kindOf(f) };
  }
  gcMedia() { // xoá tệp không còn dùng (chừa tệp mới tải lên trong 6 giờ, có thể chưa lưu vào đề)
    try {
      const used = mediaRefs(this.lib);
      for (const f of fs.readdirSync(this.mediaDir)) { const p = path.join(this.mediaDir, f); if (!used.has(f) && Date.now() - fs.statSync(p).mtimeMs > 6 * 3600e3) fs.unlinkSync(p); }
    } catch {}
  }

  // ======================= ĐẤU TRƯỜNG (thi đấu trực tiếp) =======================
  arenaCreate({ title, qs, time }) {
    if (!Array.isArray(qs) || !qs.length) throw new Error('Chưa có câu hỏi');
    let code; do { code = String(100000 + crypto.randomInt(900000)); } while (this.arena && this.arena.code === code);
    this.arena = { code, title: String(title || 'Đấu trường IC3').slice(0, 80), time: Math.max(5, Math.min(120, +time || 20)), qs: qs.slice(0, 60), qi: -1, phase: 'lobby', players: new Map(), qStart: 0, deadline: 0, created: Date.now(), saved: false };
    this.onEvent('arena', this.arenaTeacherState());
    return this.arenaTeacherState();
  }
  arenaJoin(d, ip) {
    const A = this.arena; const name = normName(d.name), cls = normName(d.class).toUpperCase();
    if (!A || String(d.code || '').trim() !== A.code) return { ok: false, msg: 'Mã phòng không đúng hoặc phòng đã đóng.' };
    if (!name || !cls) return { ok: false, msg: 'Thiếu họ tên hoặc lớp.' };
    const key = name.toLowerCase() + '|' + cls;
    let p = [...A.players.values()].find((x) => x.key === key);
    if (!p) {
      if (A.phase === 'end') return { ok: false, msg: 'Trận đấu đã kết thúc.' };
      if (A.players.size >= 80) return { ok: false, msg: 'Phòng đã đủ người.' };
      p = { pid: crypto.randomUUID(), key, name, class: cls, look: d.look && typeof d.look === 'object' ? d.look : {}, score: 0, streak: 0, correct: 0, answers: {}, ip, seen: Date.now(), joined: Date.now() };
      A.players.set(p.pid, p);
    } else if (d.look && typeof d.look === 'object') p.look = d.look;
    p.seen = Date.now();
    this.onEvent('arena', this.arenaTeacherState());
    return { ok: true, pid: p.pid, code: A.code, title: A.title };
  }
  arenaGrade(q, a) {
    if (a === undefined || a === null) return false;
    try {
      switch (q.t) {
        case 'one': return a === q.a;
        case 'multi': return Array.isArray(a) && a.length === q.a.length && q.a.every((x) => a.includes(x));
        case 'yesno': case 'match': return Array.isArray(a) && a.length === q.a.length && a.every((x, i) => x === q.a[i]);
        case 'order': return Array.isArray(a) && a.length === q.items.length && a.every((x, i) => x === i);
        case 'hot': return !!a && a.id === (q.img ? 'box' : q.a);
      }
    } catch {}
    return false;
  }
  arenaAnswer(d) {
    const A = this.arena; if (!A || d.code !== A.code) return { ok: false, msg: 'Phòng đã đóng.' };
    const p = A.players.get(d.pid); if (!p) return { ok: false, kicked: true };
    this.arenaTick();
    if (A.phase !== 'question' || +d.qi !== A.qi) return { ok: false, msg: 'Hết giờ trả lời câu này.' };
    if (p.answers[A.qi]) return { ok: true, dup: true };
    const now = Date.now(); if (now < A.qStart) return { ok: false, msg: 'Câu hỏi chưa bắt đầu.' };
    const q = A.qs[A.qi], ok = this.arenaGrade(q, d.ans);
    const el = Math.min(1, (now - A.qStart) / (A.time * 1000));
    p.streak = ok ? p.streak + 1 : 0;
    const pts = ok ? 500 + Math.round(500 * (1 - el)) + (p.streak >= 3 ? 100 : 0) : 0;
    p.answers[A.qi] = { ans: d.ans, ok, pts, t: now - A.qStart }; p.score += pts; if (ok) p.correct++; p.seen = now;
    this.arenaTick(); this.onEvent('arena', this.arenaTeacherState());
    return { ok: true };
  }
  arenaTick() {
    const A = this.arena; if (!A || A.phase !== 'question') return;
    const active = [...A.players.values()].filter((p) => Date.now() - p.seen < 15000);
    const all = active.length > 0 && active.every((p) => p.answers[A.qi]);
    if (Date.now() > A.deadline || all) { A.phase = 'reveal'; A.revealAt = Date.now(); this.onEvent('arena', this.arenaTeacherState()); }
  }
  arenaNext() {
    const A = this.arena; if (!A) return null;
    this.arenaTick();
    if (A.phase === 'question') { A.phase = 'reveal'; A.revealAt = Date.now(); }
    else if (A.qi + 1 >= A.qs.length) return this.arenaEnd();
    else { A.qi++; A.phase = 'question'; A.qStart = Date.now() + 3500; A.deadline = A.qStart + A.time * 1000 + 800; }
    this.onEvent('arena', this.arenaTeacherState());
    return this.arenaTeacherState();
  }
  arenaEnd() {
    const A = this.arena; if (!A) return null;
    A.phase = 'end';
    if (!A.saved && A.qi >= 0) {
      A.saved = true; const n = A.qi + 1;
      for (const p of A.players.values()) this.addResult({ id: `arena-${A.code}-${p.pid}`, name: p.name, class: p.class, school: '', level: 0, testId: 'ARENA-' + A.code, testTitle: 'Đấu trường: ' + A.title, mode: 'arena', score: Math.round((p.correct / n) * 1000), correct: p.correct, total: n, duration: Math.round((Date.now() - A.created) / 1000), xp: Math.round(p.score / 50), domains: {}, qids: A.qs.slice(0, n).map((q) => q.id), wrong: A.qs.slice(0, n).filter((q, i) => !(p.answers[i] && p.answers[i].ok)).map((q) => q.id), at: Date.now() }, p.ip);
    }
    this.onEvent('arena', this.arenaTeacherState());
    return this.arenaTeacherState();
  }
  arenaKick(pid) { if (this.arena) { this.arena.players.delete(pid); this.onEvent('arena', this.arenaTeacherState()); } return this.arenaTeacherState(); }
  arenaClose() { this.arena = null; this.onEvent('arena', null); return null; }
  arenaRanked() { return [...this.arena.players.values()].sort((a, b) => b.score - a.score || a.joined - b.joined); }
  arenaDist() {
    const A = this.arena, q = A.qs[A.qi]; if (!q) return null;
    const ps = [...A.players.values()], ans = ps.filter((p) => p.answers[A.qi]);
    const d = { answered: ans.length, right: ans.filter((p) => p.answers[A.qi].ok).length, n: ps.length };
    if (q.t === 'one') d.opts = q.o.map((_, i) => ans.filter((p) => p.answers[A.qi].ans === i).length);
    return d;
  }
  arenaTeacherState() {
    const A = this.arena; if (!A) return null;
    this.arenaTick();
    const now = Date.now(), q = A.qs[A.qi] || null;
    return { code: A.code, title: A.title, phase: A.phase, qi: A.qi, total: A.qs.length, time: A.time, startIn: Math.max(0, A.qStart - now), timeLeft: Math.max(0, A.deadline - now), q, dist: q ? this.arenaDist() : null,
      cloud: this.cloudStatus ? this.cloudStatus() : null,
      players: this.arenaRanked().map((p, i) => ({ pid: p.pid, name: p.name, class: p.class, look: p.look, score: p.score, correct: p.correct, rank: i + 1, online: now - p.seen < 15000, net: p.ip === 'internet' ? 'web' : 'lan', answered: !!p.answers[A.qi], last: p.answers[A.qi] || null })) };
  }
  arenaStudentState(code, pid) {
    const A = this.arena; if (!A || A.code !== String(code)) return { ok: false, closed: true, msg: 'Phòng đã đóng.' };
    const p = A.players.get(pid); if (!p) return { ok: false, kicked: true, msg: 'Em không còn trong phòng.' };
    p.seen = Date.now();
    const s = this.arenaPub(p); s.me = this.arenaMe(p); return s;
  }
  // phần trạng thái giống nhau cho mọi học sinh (dùng cho LAN và cho Firebase)
  arenaPub(meP) {
    const A = this.arena; this.arenaTick();
    const now = Date.now(), ranked = this.arenaRanked();
    const pub = (x, i) => ({ pid: x.pid, name: x.name, class: x.class, look: x.look, score: x.score, rank: i + 1, me: x === meP });
    const s = { ok: true, code: A.code, title: A.title, phase: A.phase, qi: A.qi, total: A.qs.length, time: A.time, startIn: Math.max(0, A.qStart - now), timeLeft: Math.max(0, A.deadline - now), n: ranked.length };
    if (A.phase === 'lobby' || A.phase === 'end') s.players = ranked.slice(0, 80).map(pub);
    else s.top = ranked.slice(0, 5).map(pub);
    if ((A.phase === 'question' && now >= A.qStart) || A.phase === 'reveal') { const q = { ...A.qs[A.qi] }; if (A.phase === 'question') delete q.a; s.q = q; }
    if (A.phase === 'question' && now < A.qStart) s.qType = A.qs[A.qi].t;
    if (A.phase === 'reveal') s.dist = this.arenaDist();
    return s;
  }
  arenaMe(p) {
    const A = this.arena, rank = this.arenaRanked().indexOf(p) + 1;
    return { pid: p.pid, score: p.score, rank, streak: p.streak, correct: p.correct, answered: !!p.answers[A.qi], last: A.phase === 'reveal' || A.phase === 'end' ? (p.answers[A.qi] ? { ok: p.answers[A.qi].ok, pts: p.answers[A.qi].pts } : { ok: false, pts: 0, none: true }) : null };
  }
  saveCfg() { writeJSON(path.join(this.dir, 'teacher.json'), this.cfg); }
  get running() { return !!this.server; }
  info() { return { running: this.running, port: HTTP_PORT, ips: lanIPs().map((x) => x.address), room: this.cfg.room, teacher: this.cfg.teacher, count: this.results.length, online: [...this.online.values()].filter((s) => Date.now() - s.at < 60000) }; }
  addResult(r, ip) {
    const rec = {
      id: r.id || crypto.randomUUID(), name: normName(r.name), class: normName(r.class).toUpperCase(), school: normName(r.school), level: +r.level === 0 ? 0 : +r.level || 1,
      testId: String(r.testId || ''), testTitle: String(r.testTitle || '').slice(0, 120), mode: String(r.mode || ''), domainId: r.domainId ?? null,
      score: Math.max(0, Math.min(1000, Math.round(+r.score || 0))), correct: +r.correct || 0, total: +r.total || 0, duration: +r.duration || 0, xp: +r.xp || 0,
      domains: r.domains && typeof r.domains === 'object' ? r.domains : {}, wrong: Array.isArray(r.wrong) ? r.wrong.slice(0, 200).map(String) : [], qids: Array.isArray(r.qids) ? r.qids.slice(0, 200).map(String) : [],
      at: +r.at || Date.now(), receivedAt: Date.now(), ip: ip || '',
    };
    if (!rec.name || !rec.class) return null;
    if (this.results.some((x) => x.id === rec.id)) return 'dup'; // gửi lại do mất mạng: bỏ qua bản trùng
    this.results.push(rec); writeJSON(this.file, this.results);
    this.onEvent('result', rec);
    return rec;
  }
  leaderboard(cls, period) {
    const wk = weekKey(Date.now());
    const map = new Map();
    for (const r of this.results) {
      if (cls && r.class !== cls) continue;
      if (period === 'week' && weekKey(r.at) !== wk) continue;
      const k = r.name.toLowerCase() + '|' + r.class;
      const e = map.get(k) || { name: r.name, class: r.class, xp: 0, tests: 0, best: 0 };
      e.xp += r.xp; e.tests++; e.best = Math.max(e.best, r.score); map.set(k, e);
    }
    return [...map.values()].sort((a, b) => b.xp - a.xp).slice(0, 50);
  }
  start() {
    if (this.server) return this.info();
    this.server = http.createServer((req, res) => this.handle(req, res));
    this.server.on('error', (e) => { this.onEvent('error', String(e.message)); this.stop(); });
    this.server.listen(HTTP_PORT, '0.0.0.0');
    // phát tín hiệu mỗi 2 giây để máy học sinh tự tìm thấy
    this.udp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.udp.on('error', () => {});
    this.udp.bind(() => { try { this.udp.setBroadcast(true); } catch {} });
    const send = () => {
      const msg = Buffer.from(JSON.stringify({ magic: MAGIC, port: HTTP_PORT, room: this.cfg.room, teacher: this.cfg.teacher }));
      for (const ip of lanIPs()) { try { this.udp.send(msg, UDP_PORT, broadcastOf(ip.address, ip.netmask)); } catch {} }
      try { this.udp.send(msg, UDP_PORT, '255.255.255.255'); } catch {}
    };
    this.beacon = setInterval(send, 2000); send();
    this.cfg.autoStart = true; this.saveCfg();
    this.onEvent('state', this.info());
    return this.info();
  }
  stop(manual) {
    if (this.server) { try { this.server.close(); } catch {} this.server = null; }
    if (this.udp) { try { this.udp.close(); } catch {} this.udp = null; }
    clearInterval(this.beacon); this.beacon = null;
    if (manual) { this.cfg.autoStart = false; this.saveCfg(); }
    this.onEvent('state', this.info());
  }
  handle(req, res) {
    const ip = (req.socket.remoteAddress || '').replace('::ffff:', '');
    const json = (code, v) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(v)); };
    const u = new URL(req.url, 'http://x');
    if (req.method === 'GET' && u.pathname === '/api/ping') return json(200, { ok: true, magic: MAGIC, room: this.cfg.room, teacher: this.cfg.teacher });
    if (req.method === 'GET' && u.pathname === '/api/sets') return json(200, { ok: true, ...this.publicLib() });
    if (req.method === 'GET' && u.pathname.startsWith('/media/')) {
      const f = u.pathname.slice(7); const p = path.join(this.mediaDir, f);
      if (!MEDIA_RE.test(f) || !fs.existsSync(p)) return json(404, { ok: false });
      res.writeHead(200, { 'Content-Type': MIME[f.split('.').pop()], 'Content-Length': fs.statSync(p).size });
      return fs.createReadStream(p).pipe(res);
    }
    if (req.method === 'GET' && u.pathname === '/api/arena/state') return json(200, this.arenaStudentState(u.searchParams.get('code'), u.searchParams.get('pid')));
    if (req.method === 'POST' && (u.pathname === '/api/arena/join' || u.pathname === '/api/arena/answer')) {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 2e5) req.destroy(); });
      req.on('end', () => { let d; try { d = JSON.parse(body); } catch { return json(400, { ok: false }); } json(200, u.pathname.endsWith('join') ? this.arenaJoin(d, ip) : this.arenaAnswer(d)); });
      return;
    }
    if (req.method === 'GET' && u.pathname === '/api/leaderboard') return json(200, { ok: true, rows: this.leaderboard((u.searchParams.get('class') || '').toUpperCase(), u.searchParams.get('period')) });
    if (req.method === 'POST' && (u.pathname === '/api/result' || u.pathname === '/api/hello')) {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
      req.on('end', () => {
        let d; try { d = JSON.parse(body); } catch { return json(400, { ok: false }); }
        const name = normName(d.name), cls = normName(d.class).toUpperCase();
        if (name && cls) { this.online.set(name.toLowerCase() + '|' + cls, { name, class: cls, ip, activity: String(d.activity || '').slice(0, 120), at: Date.now() }); this.onEvent('online', this.info().online); }
        if (u.pathname === '/api/hello') return json(200, { ok: true });
        const r = this.addResult(d, ip);
        json(r ? 200 : 400, { ok: !!r });
      });
      return;
    }
    json(404, { ok: false });
  }
}

// ======================= MÁY HỌC SINH =======================
class StudentClient {
  constructor(dataDir, onEvent) {
    this.dir = dataDir; this.onEvent = onEvent || (() => {});
    this.outboxFile = path.join(dataDir, 'outbox.json');
    this.outbox = readJSON(this.outboxFile, []);
    this.cfg = readJSON(path.join(dataDir, 'client.json'), { manualHost: '' });
    this.teacher = null; // {host, port, room, teacher, at}
    this.sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.sock.on('error', () => {});
    this.sock.on('message', (msg, rinfo) => {
      try { const d = JSON.parse(String(msg)); if (d.magic !== MAGIC) return; const was = this.teacher && this.teacher.host; this.teacher = { host: rinfo.address, port: d.port || HTTP_PORT, room: d.room, teacher: d.teacher, at: Date.now() }; if (was !== rinfo.address) { this.emit(); this.flush(); } else this.teacher.at = Date.now(); } catch {}
    });
    try { this.sock.bind(UDP_PORT); } catch {}
    this.timer = setInterval(() => { this.checkAlive(); this.flush(); }, 15000);
    if (this.cfg.manualHost) this.tryHost(this.cfg.manualHost);
  }
  status() { return { connected: !!(this.teacher && Date.now() - this.teacher.at < 20000), teacher: this.teacher, pending: this.outbox.length, manualHost: this.cfg.manualHost }; }
  emit() { this.onEvent('status', this.status()); }
  request(method, p, body, timeout = 4000) {
    return new Promise((resolve, reject) => {
      if (!this.teacher) return reject(new Error('Chưa kết nối máy giáo viên'));
      const data = body ? Buffer.from(JSON.stringify(body)) : null;
      const req = http.request({ host: this.teacher.host, port: this.teacher.port, path: p, method, timeout, headers: data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {} }, (res) => {
        let s = ''; res.on('data', (c) => (s += c)); res.on('end', () => { try { resolve(JSON.parse(s)); } catch { reject(new Error('Phản hồi lỗi')); } });
      });
      req.on('timeout', () => req.destroy(new Error('Hết thời gian chờ')));
      req.on('error', reject);
      if (data) req.write(data); req.end();
    });
  }
  async tryHost(host) {
    const prev = this.teacher;
    this.teacher = { host, port: HTTP_PORT, at: Date.now() };
    try { const r = await this.request('GET', '/api/ping'); if (r.magic !== MAGIC) throw new Error('x'); this.teacher = { host, port: HTTP_PORT, room: r.room, teacher: r.teacher, at: Date.now() }; this.emit(); this.flush(); return true; }
    catch { this.teacher = prev; this.emit(); return false; }
  }
  async setManualHost(host) { this.cfg.manualHost = String(host || '').trim(); writeJSON(path.join(this.dir, 'client.json'), this.cfg); return this.cfg.manualHost ? this.tryHost(this.cfg.manualHost) : (this.emit(), true); }
  async checkAlive() {
    if (!this.teacher) { if (this.cfg.manualHost) this.tryHost(this.cfg.manualHost); return; }
    try { await this.request('GET', '/api/ping', null, 3000); this.teacher.at = Date.now(); } catch { if (Date.now() - this.teacher.at > 20000) { this.teacher = null; } }
    this.emit();
  }
  async submit(result) {
    result.id = result.id || crypto.randomUUID();
    this.outbox.push(result); writeJSON(this.outboxFile, this.outbox);
    await this.flush();
    return { sent: !this.outbox.some((r) => r.id === result.id), status: this.status() };
  }
  async flush() {
    if (!this.teacher || !this.outbox.length || this.flushing) return;
    this.flushing = true;
    try {
      while (this.outbox.length) {
        const r = this.outbox[0];
        const res = await this.request('POST', '/api/result', r);
        if (!res.ok && res.ok !== false) break;
        this.outbox.shift(); writeJSON(this.outboxFile, this.outbox);
      }
    } catch { /* mất kết nối: giữ lại để gửi sau */ }
    this.flushing = false; this.emit();
  }
  async fetchSets() {
    const cacheFile = path.join(this.dir, 'sets-cache.json'), mdir = path.join(this.dir, 'media-cache');
    let lib = readJSON(cacheFile, null), fresh = false;
    if (this.teacher) {
      try {
        const r = await this.request('GET', '/api/sets', null, 10000);
        if (r.ok) {
          fs.mkdirSync(mdir, { recursive: true });
          for (const f of mediaRefs(r)) { const p = path.join(mdir, f); if (!fs.existsSync(p)) await this.download('/media/' + f, p).catch(() => {}); }
          lib = { sets: r.sets || [], memes: r.memes || { ok: [], no: [] }, at: Date.now(), from: this.teacher.teacher || '' };
          writeJSON(cacheFile, lib); fresh = true;
        }
      } catch {}
    }
    return { ...(lib || { sets: [], memes: { ok: [], no: [] } }), fresh, dir: mdir };
  }
  download(p, dest) {
    return new Promise((resolve, reject) => {
      const req = http.get({ host: this.teacher.host, port: this.teacher.port, path: p, timeout: 30000 }, (res) => {
        if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
        const tmp = dest + '.part', out = fs.createWriteStream(tmp);
        res.pipe(out); out.on('finish', () => { out.close(() => { fs.renameSync(tmp, dest); resolve(); }); }); out.on('error', reject);
      });
      req.on('timeout', () => req.destroy(new Error('timeout'))); req.on('error', reject);
    });
  }
  // ----- đấu trường -----
  arenaBase() { return this.teacher ? `http://${this.teacher.host}:${this.teacher.port}/media/` : ''; }
  async arenaJoin(d) { try { return { ...(await this.request('POST', '/api/arena/join', d, 5000)), base: this.arenaBase() }; } catch (e) { return { ok: false, msg: this.teacher ? 'Không kết nối được máy giáo viên.' : 'Chưa kết nối máy giáo viên. Hãy kiểm tra mạng LAN của phòng máy.', net: true }; } }
  async arenaState(code, pid) { try { return { ...(await this.request('GET', `/api/arena/state?code=${encodeURIComponent(code)}&pid=${encodeURIComponent(pid)}`, null, 3000)), base: this.arenaBase() }; } catch { return { ok: false, net: true, msg: 'Mất kết nối máy giáo viên…' }; } }
  async arenaAnswer(d) { try { return await this.request('POST', '/api/arena/answer', d, 4000); } catch { return { ok: false, net: true, msg: 'Mất kết nối, đang thử lại…' }; } }
  async hello(p) { try { await this.request('POST', '/api/hello', p, 2500); } catch {} }
  async leaderboard(cls, period) { const r = await this.request('GET', `/api/leaderboard?class=${encodeURIComponent(cls || '')}&period=${period || 'all'}`); return r.rows || []; }
}

module.exports = { TeacherServer, StudentClient, lanIPs, HTTP_PORT, UDP_PORT, weekKey, sniff };
