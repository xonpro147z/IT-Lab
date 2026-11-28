// TinHocLab – Thi đấu qua Internet bằng Firebase Realtime Database (gói Spark miễn phí).
// Không dùng SDK: gọi REST API + luồng sự kiện (text/event-stream) từ tiến trình chính của Electron.
// Máy giáo viên vẫn là "trọng tài": chấm điểm, tính giờ. Firebase chỉ chuyển tin giữa các máy.
//
// Cấu trúc dữ liệu:
//   arena/{mã}/owner              uid của máy giáo viên
//   arena/{mã}/down/pub/{khoá}    trạng thái chung (chuỗi JSON) – học sinh đọc
//   arena/{mã}/down/me/{uid}      trạng thái riêng của từng học sinh (chuỗi JSON)
//   arena/{mã}/media/{tệp}        ảnh của câu hỏi (base64) – học sinh tải một lần khi vào phòng
//   arena/{mã}/up/join/{uid}      học sinh xin vào phòng
//   arena/{mã}/up/hb/{uid}        "em vẫn đang ở đây" (5 giây/lần)
//   arena/{mã}/up/ans/{câu}/{uid} câu trả lời (mỗi câu chỉ ghi được một lần)
const fs = require('fs');
const path = require('path');

const ID_URL = process.env.THL_FB_AUTH || 'https://identitytoolkit.googleapis.com';
const TOK_URL = process.env.THL_FB_TOKEN || 'https://securetoken.googleapis.com';
const ALLOW_HTTP = !!process.env.THL_FB_AUTH; // chỉ dùng khi chạy thử với máy chủ giả lập
const MEDIA_RE = /[a-f0-9]{16}\.(?:png|jpg|gif|webp)/g;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- cấu hình ----------
function parseConfig(text) {
  text = String(text || '').trim();
  let c = null;
  if (/^THL1\./.test(text)) { try { const o = JSON.parse(Buffer.from(text.slice(5), 'base64url').toString('utf8')); c = { apiKey: o.k, databaseURL: o.u }; } catch {} }
  else {
    try { const o = JSON.parse(text); c = { apiKey: o.apiKey, databaseURL: o.databaseURL }; } catch {
      const g = (k) => (text.match(new RegExp(k + '\\s*[:=]\\s*["\'`]([^"\'`]+)["\'`]')) || [])[1];
      c = { apiKey: g('apiKey'), databaseURL: g('databaseURL') };
    }
  }
  if (!c || !c.apiKey) throw new Error('Không thấy "apiKey" trong đoạn cấu hình.');
  if (!c.databaseURL) throw new Error('Không thấy "databaseURL". Hãy tạo Realtime Database trước rồi sao chép lại đoạn cấu hình.');
  c.apiKey = String(c.apiKey).trim(); c.databaseURL = String(c.databaseURL).trim().replace(/\/+$/, '');
  if (!/^[\w-]{20,60}$/.test(c.apiKey)) throw new Error('apiKey không hợp lệ.');
  const okUrl = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(firebaseio\.com|firebasedatabase\.app)$/i.test(c.databaseURL) || (ALLOW_HTTP && /^http:\/\/127\.0\.0\.1:\d+$/.test(c.databaseURL));
  if (!okUrl) throw new Error('databaseURL phải có dạng https://…firebaseio.com hoặc https://…firebasedatabase.app');
  return c;
}
const shareCode = (c) => 'THL1.' + Buffer.from(JSON.stringify({ k: c.apiKey, u: c.databaseURL })).toString('base64url');

class CloudConfig {
  constructor(dir, bundled) { this.file = path.join(dir, 'cloud.json'); this.bundled = bundled; }
  get() {
    for (const [f, src] of [[this.file, 'user'], [this.bundled, 'bundle']]) {
      try { const c = parseConfig(fs.readFileSync(f, 'utf8')); return { ...c, src }; } catch {}
    }
    return null;
  }
  set(text) { const c = parseConfig(text); fs.mkdirSync(path.dirname(this.file), { recursive: true }); fs.writeFileSync(this.file, JSON.stringify(c, null, 2)); return c; }
  clear() { try { fs.unlinkSync(this.file); } catch {} }
  info() { const c = this.get(); return c ? { on: true, src: c.src, host: c.databaseURL.replace(/^https?:\/\//, ''), share: shareCode(c) } : { on: false }; }
}

// ---------- lời báo lỗi dễ hiểu ----------
function niceErr(e) {
  const m = String((e && e.message) || e);
  if (/ADMIN_ONLY_OPERATION|OPERATION_NOT_ALLOWED/.test(m)) return 'Chưa bật đăng nhập "Ẩn danh" (Anonymous) trong Firebase Authentication.';
  if (/API_KEY_INVALID|API key not valid|INVALID_API_KEY/i.test(m)) return 'apiKey không đúng.';
  if (/Permission denied|permission_denied|401/i.test(m)) return 'Firebase từ chối truy cập – kiểm tra lại Quy tắc (Rules) của Realtime Database.';
  if (/404/.test(m)) return 'Không tìm thấy Realtime Database – kiểm tra databaseURL.';
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|aborted|timeout/i.test(m)) return 'Máy không vào được Internet hoặc mạng quá chậm.';
  return m.slice(0, 160);
}

// ---------- Firebase REST ----------
// Mỗi máy chỉ tạo tài khoản ẩn danh MỘT lần rồi dùng lại (Firebase giới hạn 100 tài khoản mới/giờ cho mỗi địa chỉ IP –
// cả trường thường dùng chung một IP).
class Fb {
  constructor(cfg, store) {
    this.cfg = cfg; this.store = store; this.tok = null; this.exp = 0; this.refresh = null; this.uid = null;
    if (store) try { const o = JSON.parse(fs.readFileSync(store, 'utf8')); if (o.k === cfg.apiKey && o.u === cfg.databaseURL) { this.refresh = o.r; this.uid = o.id; } } catch {}
  }
  save() { if (!this.store || !this.refresh) return; try { fs.mkdirSync(path.dirname(this.store), { recursive: true }); fs.writeFileSync(this.store, JSON.stringify({ k: this.cfg.apiKey, u: this.cfg.databaseURL, r: this.refresh, id: this.uid })); } catch {} }
  async signIn() {
    if (this.tok && Date.now() < this.exp - 60000) return this.uid;
    const k = encodeURIComponent(this.cfg.apiKey);
    let r, j;
    if (this.refresh) {
      r = await fetch(`${TOK_URL}/v1/token?key=${k}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(this.refresh), signal: AbortSignal.timeout(10000) });
      j = await r.json().catch(() => ({}));
      if (r.ok) { this.tok = j.id_token; this.refresh = j.refresh_token; this.uid = j.user_id; this.exp = Date.now() + (+j.expires_in || 3600) * 1000; this.save(); return this.uid; }
      this.refresh = null;
    }
    r = await fetch(`${ID_URL}/v1/accounts:signUp?key=${k}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }), signal: AbortSignal.timeout(10000) });
    j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || 'Đăng nhập Firebase lỗi ' + r.status);
    this.tok = j.idToken; this.refresh = j.refreshToken; this.uid = j.localId; this.exp = Date.now() + (+j.expiresIn || 3600) * 1000; this.save();
    return this.uid;
  }
  url(p) { return `${this.cfg.databaseURL}/${p}.json?auth=${encodeURIComponent(this.tok)}`; }
  async req(method, p, body, timeout = 8000, retry = true) {
    await this.signIn();
    const r = await fetch(this.url(p), { method, headers: body !== undefined ? { 'Content-Type': 'application/json' } : {}, body: body !== undefined ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeout) });
    const t = await r.text();
    if (r.status === 401 && retry && /expired|invalid|auth/i.test(t) && !/Permission denied/i.test(t)) { this.tok = null; return this.req(method, p, body, timeout, false); }
    if (!r.ok) { const e = new Error(`${r.status} ${(t.match(/"error"\s*:\s*"([^"]+)"/) || [])[1] || t.slice(0, 100)}`); e.status = r.status; throw e; }
    return t ? JSON.parse(t) : null;
  }
  get(p, t) { return this.req('GET', p, undefined, t); }
  put(p, v, t) { return this.req('PUT', p, v, t); }
  patch(p, v, t) { return this.req('PATCH', p, v, t); }
  del(p, t) { return this.req('DELETE', p, undefined, t); }

  // Luồng sự kiện: nhận toàn bộ dữ liệu ở lần đầu, sau đó chỉ nhận phần thay đổi.
  stream(p, onData, onState = () => {}) {
    const S = { closed: false, ctl: null, tree: null, alive: false, lastAt: 0 };
    const run = async () => {
      let wait = 800;
      while (!S.closed) {
        try {
          await this.signIn();
          S.ctl = new AbortController();
          const r = await fetch(this.url(p), { headers: { Accept: 'text/event-stream' }, signal: S.ctl.signal, redirect: 'follow' });
          if (!r.ok) { const t = await r.text().catch(() => ''); throw Object.assign(new Error(`${r.status} ${t.slice(0, 100)}`), { status: r.status }); }
          S.alive = true; S.lastAt = Date.now(); onState('open'); wait = 800;
          const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
          const dog = setInterval(() => { if (Date.now() - S.lastAt > 75000) S.ctl.abort(); }, 5000);
          try {
            for (;;) {
              const { value, done } = await rd.read(); if (done) break;
              S.lastAt = Date.now();
              buf += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n');
              let i;
              while ((i = buf.indexOf('\n\n')) >= 0) {
                const blk = buf.slice(0, i); buf = buf.slice(i + 2);
                const ev = (blk.match(/^event:\s*(.*)$/m) || [])[1], data = blk.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('\n');
                if (ev === 'put' || ev === 'patch') { const d = JSON.parse(data); S.tree = applyTree(S.tree, d.path, d.data, ev === 'patch'); onData(S.tree, d); }
                else if (ev === 'auth_revoked') { this.tok = null; S.ctl.abort(); }
                else if (ev === 'cancel') { onState('cancel', data); S.ctl.abort(); }
              }
            }
          } finally { clearInterval(dog); }
        } catch (e) {
          if (S.closed) break;
          S.err = e; if (e.status === 401) this.tok = null;
        }
        S.alive = false; if (S.closed) break;
        onState('down', S.err); await sleep(wait); wait = Math.min(wait * 2, 8000);
      }
    };
    run();
    return { get alive() { return S.alive; }, get lastAt() { return S.lastAt; }, get tree() { return S.tree; }, close() { S.closed = true; try { S.ctl && S.ctl.abort(); } catch {} } };
  }
}
function applyTree(root, p, data, patch) {
  const segs = String(p || '/').split('/').filter(Boolean);
  const set = (node, ks, v) => {
    if (!ks.length) return v;
    const o = node && typeof node === 'object' ? { ...node } : {};
    const r = set(o[ks[0]], ks.slice(1), v);
    if (r === null || r === undefined || (typeof r === 'object' && !Object.keys(r).length)) delete o[ks[0]]; else o[ks[0]] = r;
    return o;
  };
  if (!patch) return set(root, segs, data) ?? null;
  let t = root;
  for (const [k, v] of Object.entries(data || {})) t = set(t, segs.concat(k.split('/').filter(Boolean)), v);
  return t ?? null;
}

// ======================= MÁY GIÁO VIÊN =======================
class CloudTeacher {
  constructor(conf, teacher) {
    this.conf = conf; this.T = teacher; this.store = path.join(path.dirname(conf.file), 'cloud-auth.json'); this.st = { on: false };
    teacher.cloudStatus = () => this.status();
  }
  status() { return { ...this.st, players: this.uidPid ? new Set(this.uidPid.values()).size : 0 }; }
  setSt(s) { this.st = { ...this.st, ...s }; const A = this.T.arena; if (A) this.T.onEvent('arena', this.T.arenaTeacherState()); }
  async start() {
    this.stop(false);
    const cfg = this.conf.get(), A = this.T.arena;
    if (!cfg || !A) { this.st = { on: false }; return; }
    const code = A.code, fb = new Fb(cfg, this.store);
    Object.assign(this, { fb, code, uidPid: new Map(), errs: new Map(), joinSeen: new Map(), hbSeen: new Map(), done: new Set(), last: {}, busy: false, run: true });
    this.st = { on: true, ok: false, msg: 'Đang nối Firebase…' };
    try {
      await fb.signIn();
      await fb.put(`arena/${code}/owner`, fb.uid);
      await this.uploadMedia(A.qs);
      if (!this.run || this.code !== code) return;
      this.up = fb.stream(`arena/${code}/up`, (tree) => this.onUp(tree), (s, e) => this.setSt(s === 'open' ? { ok: true, msg: '' } : { ok: false, msg: 'Mất kết nối Internet, đang thử lại… ' + (e ? '(' + niceErr(e) + ')' : '') }));
      this.timer = setInterval(() => this.sync(), 400);
      this.setSt({ ok: true, msg: '' }); this.sync();
    } catch (e) { this.setSt({ ok: false, msg: niceErr(e) }); this.retry = setTimeout(() => this.run && this.T.arena && this.T.arena.code === code && this.start(), 8000); }
  }
  async uploadMedia(qs) {
    const names = [...new Set((JSON.stringify(qs).match(MEDIA_RE) || []))];
    let total = 0; const out = {};
    for (const n of names) {
      const f = path.join(this.T.mediaDir, n); if (!fs.existsSync(f)) continue;
      const sz = fs.statSync(f).size; if (sz > 600 * 1024 || total + sz > 6 * 1024 * 1024) continue;
      total += sz; out[n.replace('.', '_')] = fs.readFileSync(f).toString('base64');
    }
    if (Object.keys(out).length) await this.fb.put(`arena/${this.code}/media`, out, 60000);
  }
  onUp(tree) {
    const A = this.T.arena; if (!A || A.code !== this.code || !tree) return;
    for (const [uid, v] of Object.entries(tree.join || {})) {
      if (!v || this.joinSeen.get(uid) === v.d) continue;
      this.joinSeen.set(uid, v.d);
      let d; try { d = JSON.parse(v.d); } catch { continue; }
      const r = this.T.arenaJoin({ code: A.code, name: d.name, class: d.class, look: d.look }, 'internet');
      if (r.ok) { this.uidPid.set(uid, r.pid); this.errs.delete(uid); } else this.errs.set(uid, r.msg);
    }
    for (const [uid, t] of Object.entries(tree.hb || {})) {
      if (this.hbSeen.get(uid) === t) continue; this.hbSeen.set(uid, t);
      const p = A.players.get(this.uidPid.get(uid)); if (p) p.seen = Date.now();
    }
    for (const [qi, m] of Object.entries(tree.ans || {})) for (const [uid, v] of Object.entries(m || {})) {
      const k = qi + '/' + uid; if (this.done.has(k)) continue; this.done.add(k);
      const pid = this.uidPid.get(uid); if (!pid) continue;
      let ans; try { ans = JSON.parse(v.a); } catch { continue; }
      this.T.arenaAnswer({ code: A.code, pid, qi: +qi, ans });
    }
    this.sync();
  }
  async sync() {
    const A = this.T.arena; if (!this.run || !A || A.code !== this.code || this.busy) return;
    const pub = this.T.arenaPub(null), patch = {};
    const keys = new Set([...Object.keys(pub), ...Object.keys(this.last).filter((k) => k.startsWith('pub/')).map((k) => k.slice(4))]);
    for (const k of keys) {
      if (k === 'startIn' || k === 'timeLeft' || k === 'ok') continue;
      const s = pub[k] === undefined ? null : JSON.stringify(pub[k]);
      if (this.last['pub/' + k] !== s) patch['pub/' + k] = s;
    }
    if (Object.keys(patch).length) { patch['pub/startIn'] = String(pub.startIn); patch['pub/timeLeft'] = String(pub.timeLeft); }
    for (const uid of new Set([...this.uidPid.keys(), ...this.errs.keys()])) {
      const p = A.players.get(this.uidPid.get(uid));
      const me = p ? this.T.arenaMe(p) : this.errs.has(uid) ? { err: this.errs.get(uid) } : { kicked: true };
      const s = JSON.stringify(me); if (this.last['me/' + uid] !== s) patch['me/' + uid] = s;
    }
    if (!Object.keys(patch).length) return;
    this.busy = true;
    try { await this.fb.patch(`arena/${this.code}/down`, patch); Object.assign(this.last, patch); if (!this.st.ok && this.up && this.up.alive) this.setSt({ ok: true, msg: '' }); }
    catch (e) { if (this.st.ok) this.setSt({ ok: false, msg: 'Không gửi được lên Firebase: ' + niceErr(e) }); }
    finally { this.busy = false; }
  }
  stop(remove = true) {
    this.run = false; clearInterval(this.timer); clearTimeout(this.retry);
    if (this.up) this.up.close(); this.up = null;
    if (remove && this.fb && this.code) this.fb.del(`arena/${this.code}`).catch(() => {});
    this.st = { on: false };
  }
}

// ======================= MÁY HỌC SINH =======================
class CloudStudent {
  constructor(conf, dir) { this.conf = conf; this.dir = dir; this.s = null; this.store = path.join(dir, 'cloud-auth.json'); }
  close() {
    const s = this.s; this.s = null; if (!s) return;
    clearInterval(s.hb); if (s.stream) s.stream.close();
  }
  async join(d) {
    const cfg = this.conf.get(); if (!cfg) return { ok: false, nocfg: true, msg: 'Máy này chưa cài kết nối Internet.' };
    const code = String(d.code || '').trim(), body = { d: JSON.stringify({ name: d.name, class: d.class, look: d.look || {} }) };
    // đổi trang phục khi đang ở trong phòng: chỉ cần gửi lại
    if (this.s && this.s.code === code && this.s.me) { this.s.fb.put(`arena/${code}/up/join/${this.s.uid}`, body).catch(() => {}); return { ok: true, pid: this.s.me.pid, code, title: this.s.title, base: this.s.base }; }
    this.close();
    const fb = new Fb(cfg, this.store);
    try {
      const uid = await fb.signIn();
      const phase = await fb.get(`arena/${code}/down/pub/phase`);
      if (phase === null) return { ok: false, msg: 'Không tìm thấy phòng ' + code + ' trên Internet. Kiểm tra lại mã phòng.' };
      const s = this.s = { fb, uid, code, recvAt: Date.now(), title: '', me: null, base: '' };
      await fb.put(`arena/${code}/up/join/${uid}`, body);
      let gotTree = false;
      s.stream = fb.stream(`arena/${code}/down`, (tree, ev) => {
        if (tree && tree.pub && (ev.path === '/' || ev.path.startsWith('/pub') || (ev.data && typeof ev.data === 'object' && Object.keys(ev.data).some((k) => k.startsWith('pub'))))) s.recvAt = Date.now();
        if (tree) gotTree = true; else if (gotTree) s.closed = true;
      });
      const t0 = Date.now(); let me = null;
      while (Date.now() - t0 < 12000) {
        const v = s.stream.tree && s.stream.tree.me && s.stream.tree.me[uid];
        if (v) { me = JSON.parse(v); break; }
        await sleep(150); if (this.s !== s) return { ok: false, msg: 'Đã huỷ.' };
      }
      if (!me) { this.close(); return { ok: false, net: true, msg: 'Máy giáo viên chưa phản hồi. Thầy cô cần mở phòng trên máy có Internet.' }; }
      if (me.err || me.kicked) { this.close(); return { ok: false, msg: me.err || 'Em không vào được phòng này.' }; }
      s.me = me; s.title = JSON.parse((s.stream.tree.pub || {}).title || '""');
      s.base = await this.fetchMedia(fb, code).catch(() => '');
      s.hb = setInterval(() => fb.put(`arena/${code}/up/hb/${uid}`, Date.now()).catch(() => {}), 5000);
      return { ok: true, pid: me.pid, code, title: s.title, base: s.base, via: 'internet' };
    } catch (e) { this.close(); return { ok: false, net: true, msg: niceErr(e) }; }
  }
  async fetchMedia(fb, code) {
    const m = await fb.get(`arena/${code}/media`, 60000); if (!m) return '';
    const dir = path.join(this.dir, 'arena-media'); fs.mkdirSync(dir, { recursive: true });
    for (const [k, b64] of Object.entries(m)) { const n = k.replace('_', '.'); if (/^[a-f0-9]{16}\.(png|jpg|gif|webp)$/.test(n)) fs.writeFileSync(path.join(dir, n), Buffer.from(b64, 'base64')); }
    return require('url').pathToFileURL(dir).href + '/';
  }
  state(code) {
    const s = this.s;
    if (!s || s.code !== String(code)) return { ok: false, closed: true, msg: 'Phòng đã đóng.' };
    if (s.closed) { this.close(); return { ok: false, closed: true, msg: 'Thầy cô đã đóng phòng.' }; }
    const tree = s.stream.tree;
    if (!s.stream.alive && Date.now() - s.stream.lastAt > 4000) return { ok: false, net: true, msg: 'Mất kết nối Internet…' };
    if (!tree || !tree.pub) return { ok: false, net: true, msg: 'Đang tải…' };
    const meRaw = tree.me && tree.me[s.uid]; const me = meRaw ? JSON.parse(meRaw) : null;
    if (!me || me.kicked || me.err) { this.close(); return { ok: false, kicked: true, msg: me && me.err ? me.err : 'Em không còn trong phòng.' }; }
    s.me = me;
    const st = { ok: true, base: s.base, via: 'internet' };
    for (const [k, v] of Object.entries(tree.pub)) { try { st[k] = JSON.parse(v); } catch {} }
    const el = Date.now() - s.recvAt;
    st.startIn = Math.max(0, (+st.startIn || 0) - el); st.timeLeft = Math.max(0, (+st.timeLeft || 0) - el);
    // câu hỏi được gửi xuống ngay khi đến giờ; nếu chưa tới thì vẫn đếm ngược
    if (st.phase === 'question' && st.startIn > 0) delete st.q;
    for (const k of ['players', 'top']) if (Array.isArray(st[k])) st[k] = st[k].map((x) => ({ ...x, me: x.pid === me.pid }));
    st.me = me;
    return st;
  }
  async answer(d) {
    const s = this.s; if (!s || s.code !== String(d.code)) return { ok: false, msg: 'Phòng đã đóng.' };
    try { await s.fb.put(`arena/${s.code}/up/ans/${+d.qi}/${s.uid}`, { a: JSON.stringify(d.ans === undefined ? null : d.ans) }, 6000); return { ok: true }; }
    catch (e) { if (e.status === 401) return { ok: true, dup: true }; return { ok: false, net: true, msg: 'Mất kết nối, đang thử lại…' }; }
  }
}

// Kiểm tra cấu hình: đăng nhập ẩn danh + thử ghi/đọc/xoá một phòng nháp
async function testConfig(cfg, store) {
  const fb = new Fb(cfg, store), code = 'test' + Math.floor(Math.random() * 1e6);
  try {
    await fb.signIn();
    await fb.put(`arena/${code}/owner`, fb.uid);
    await fb.patch(`arena/${code}/down`, { 'pub/phase': '"test"' });
    const v = await fb.get(`arena/${code}/down/pub/phase`);
    await fb.del(`arena/${code}`);
    if (v !== '"test"') throw new Error('Đọc lại dữ liệu không khớp.');
    return { ok: true };
  } catch (e) { return { ok: false, msg: niceErr(e) }; }
}

const RULES = {
  rules: {
    arena: {
      $code: {
        '.write': "auth != null && data.child('owner').val() === auth.uid",
        owner: { '.write': 'auth != null && !data.exists() && newData.val() === auth.uid' },
        down: { '.read': 'auth != null' },
        media: { '.read': 'auth != null' },
        up: {
          '.read': "auth != null && root.child('arena/' + $code + '/owner').val() === auth.uid",
          join: { $uid: { '.write': 'auth != null && auth.uid === $uid && newData.child(\'d\').isString() && newData.child(\'d\').val().length < 4000' } },
          hb: { $uid: { '.write': 'auth != null && auth.uid === $uid && newData.isNumber()' } },
          ans: { $qi: { $uid: { '.write': 'auth != null && auth.uid === $uid && !data.exists() && newData.child(\'a\').isString() && newData.child(\'a\').val().length < 4000' } } },
        },
      },
    },
  },
};

module.exports = { CloudConfig, CloudTeacher, CloudStudent, Fb, parseConfig, shareCode, testConfig, niceErr, applyTree, RULES };
