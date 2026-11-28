// TinHocLab – Phòng Mạng: bộ mô phỏng mạng theo sự kiện rời rạc.
// Mô phỏng tầng 2 (Ethernet, ARP, switch học MAC, hub, bộ phát Wi-Fi), tầng 3 (IP, router, tuyến tĩnh, TTL)
// và một số dịch vụ: ICMP (ping, tracert), DHCP, DNS, HTTP. Thời gian tính bằng "đơn vị" – mỗi chặng dây = 1 đơn vị.

export const TYPES = {
  pc:     { label: 'Máy tính',      kind: 'host',   ports: ['Fa0'],  pre: 'PC' },
  laptop: { label: 'Laptop',        kind: 'host',   ports: ['Fa0'],  pre: 'Laptop' },
  phone:  { label: 'Điện thoại',    kind: 'host',   ports: ['Wlan0'], pre: 'Điện thoại ', wifiOnly: true },
  server: { label: 'Máy chủ',       kind: 'host',   ports: ['Fa0'],  pre: 'Máy chủ ' },
  switch: { label: 'Switch',        kind: 'switch', ports: 8,        pre: 'Switch' },
  hub:    { label: 'Hub',           kind: 'hub',    ports: 6,        pre: 'Hub' },
  ap:     { label: 'Bộ phát Wi-Fi', kind: 'switch', ports: 8,        pre: 'Wi-Fi ' },
  router: { label: 'Router',        kind: 'router', ports: ['G0/0', 'G0/1', 'G0/2', 'G0/3'], pre: 'Router' },
  cloud:  { label: 'Internet (ISP)', kind: 'cloud', ports: ['WAN'],  pre: 'Internet' },
};

// ---------- tiện ích địa chỉ IP ----------
export function ip2n(s) {
  if (typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const p = m.slice(1).map(Number);
  if (p.some((x) => x > 255)) return null;
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}
export const n2ip = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
export function maskLen(s) {
  const n = ip2n(s); if (n === null) return -1;
  const inv = (~n) >>> 0; if ((inv & (inv + 1)) !== 0) return -1; // phải là dãy 1 liên tục
  let c = 0; for (let i = 31; i >= 0; i--) if ((n >>> i) & 1) c++; return c;
}
export const lenMask = (l) => n2ip(l === 0 ? 0 : ((0xffffffff << (32 - l)) >>> 0));
export function sameNet(a, b, mask) {
  const x = ip2n(a), y = ip2n(b), m = ip2n(mask);
  if (x === null || y === null || m === null) return false;
  return ((x & m) >>> 0) === ((y & m) >>> 0);
}
export const netOf = (ip, mask) => n2ip((ip2n(ip) & ip2n(mask)) >>> 0);
export function hostOk(ip, mask) {
  // địa chỉ máy hợp lệ: không phải địa chỉ mạng / quảng bá
  const x = ip2n(ip), m = ip2n(mask); if (x === null || m === null || maskLen(mask) < 0) return false;
  const host = (x & ~m) >>> 0, bc = (~m) >>> 0; if (maskLen(mask) >= 31) return true;
  return host !== 0 && host !== bc;
}
const BCAST = 'FF:FF:FF:FF:FF:FF';
const TAGS = { arp: 'ARP', icmp: 'ICMP', dhcp: 'DHCP', dns: 'DNS', http: 'HTTP' };
export const TAG_COLOR = { ARP: '#ffd400', ICMP: '#38e1ff', DHCP: '#7dff9a', DNS: '#c49bff', HTTP: '#ff9f3a' };
const tagOf = (fr) => (fr.type === 'arp' ? 'ARP' : TAGS[fr.ip.app.kind] || 'IP');

// Internet ảo phía sau đám mây ISP
const CLOUD_IP = '100.64.0.1', CLOUD_MASK = '255.255.255.252';
const CLOUD_HOSTS = {
  '8.8.8.8': { dns: true },
  '1.1.1.1': { dns: true },
  '203.0.113.10': { web: { title: 'Tin học vui', body: 'Chào mừng em đến với trang tinhoc.vn!\nNếu em đọc được dòng này nghĩa là: máy tính → switch → router → Internet → máy chủ web đều đã thông.\nĐường đi của em vừa qua: DNS (đổi tên thành địa chỉ IP) rồi HTTP (lấy trang web).' } },
  '203.0.113.20': { web: { title: 'Học tập trực tuyến', body: 'hoctap.vn – thư viện bài giảng.\nTrang này nằm trên một máy chủ khác ngoài Internet, địa chỉ 203.0.113.20.' } },
  '203.0.113.30': { web: { title: 'Thư viện số', body: 'thuvien.vn – mượn sách điện tử.\nMáy chủ: 203.0.113.30.' } },
};
const CLOUD_DNS = { 'tinhoc.vn': '203.0.113.10', 'www.tinhoc.vn': '203.0.113.10', 'hoctap.vn': '203.0.113.20', 'thuvien.vn': '203.0.113.30' };

const HOP = 1, ARP_TO = 10, PING_TO = 20, PING_GAP = 5, DHCP_TO = 20, DNS_TO = 24, HTTP_TO = 24;
let uid = 1;
const nid = (p) => p + (uid++).toString(36);

export class Net {
  constructor() {
    this.devs = []; this.links = [];
    this.time = 0; this.q = []; this.qseq = 0;
    this.events = []; this.flashes = []; this.macSeq = 0x10;
    this.listeners = new Set(); this.recording = true;
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(type, data) { for (const f of this.listeners) f(type, data); }

  // ---------- dựng mạng ----------
  newMac() { const n = this.macSeq++; const h = (x) => x.toString(16).padStart(2, '0').toUpperCase(); return `00:E0:F7:${h((n >> 16) & 255)}:${h((n >> 8) & 255)}:${h(n & 255)}`; }
  add(type, x, y, cfg = {}) {
    const T = TYPES[type]; if (!T) throw new Error('loại thiết bị lạ ' + type);
    const pn = Array.isArray(T.ports) ? T.ports : Array.from({ length: T.ports }, (_, i) => `Fa0/${i + 1}`);
    const count = this.devs.filter((d) => d.type === type).length;
    let name = cfg.name || (type === 'cloud' ? 'Internet' : T.pre + count); let k = count;
    while (!cfg.name && type !== 'cloud' && this.devs.some((d) => d.name === name)) name = T.pre + (++k);
    const d = {
      id: cfg.id || nid('d'), type, name, x, y,
      ports: pn.map((n) => ({ name: n, mac: this.newMac(), ip: '', mask: '', link: null, pool: null })),
      gw: '', dns: '', dhcp: false, routes: [],
      svc: { dhcp: { on: false, start: '', count: 50, mask: '255.255.255.0', gw: '', dns: '' }, dns: { on: false, records: [] }, web: { on: false, title: 'Trang chủ', body: 'Xin chào! Đây là trang web trên máy chủ của lớp.' } },
      rt: null,
    };
    if (type === 'cloud') { d.ports[0].ip = CLOUD_IP; d.ports[0].mask = CLOUD_MASK; }
    if (type === 'server') d.svc.web.on = true;
    Object.assign(d, cfg.set || {});
    if (cfg.ip) { d.ports[0].ip = cfg.ip; d.ports[0].mask = cfg.mask || '255.255.255.0'; }
    this.resetRt(d); this.devs.push(d); this.emit('topo'); return d;
  }
  dev(idOrName) { return this.devs.find((d) => d.id === idOrName || d.name === idOrName); }
  remove(id) {
    const d = this.dev(id); if (!d) return;
    this.links.filter((l) => l.a.dev === d.id || l.b.dev === d.id).forEach((l) => this.disconnect(l.id));
    this.devs = this.devs.filter((x) => x !== d); this.emit('topo');
  }
  isWireless(l) { const A = this.dev(l.a.dev), B = this.dev(l.b.dev); return (A.type === 'ap' && B.type !== 'switch' && B.type !== 'router' && B.type !== 'hub' && B.type !== 'cloud' && B.type !== 'ap') || (B.type === 'ap' && A.type !== 'switch' && A.type !== 'router' && A.type !== 'hub' && A.type !== 'cloud' && A.type !== 'ap'); }
  connect(aId, bId, aPort = null, bPort = null) {
    const A = this.dev(aId), B = this.dev(bId);
    if (!A || !B) return { ok: false, msg: 'Không tìm thấy thiết bị.' };
    if (A === B) return { ok: false, msg: 'Không thể nối một thiết bị với chính nó.' };
    if (this.links.some((l) => (l.a.dev === A.id && l.b.dev === B.id) || (l.a.dev === B.id && l.b.dev === A.id))) return { ok: false, msg: `${A.name} và ${B.name} đã được nối với nhau rồi.` };
    for (const [X, Y] of [[A, B], [B, A]]) if (TYPES[X.type].wifiOnly && Y.type !== 'ap') return { ok: false, msg: `${X.name} chỉ kết nối được bằng Wi-Fi – hãy nối tới một Bộ phát Wi-Fi.` };
    const pick = (D, want) => { if (want !== null) return D.ports[want] && !D.ports[want].link ? want : -1; return D.ports.findIndex((p) => !p.link); };
    const pa = pick(A, aPort), pb = pick(B, bPort);
    if (pa < 0) return { ok: false, msg: `${A.name} đã hết cổng trống.` };
    if (pb < 0) return { ok: false, msg: `${B.name} đã hết cổng trống.` };
    const l = { id: nid('l'), a: { dev: A.id, port: pa }, b: { dev: B.id, port: pb } };
    A.ports[pa].link = l.id; B.ports[pb].link = l.id; this.links.push(l);
    this.emit('topo');
    // máy đặt chế độ DHCP tự xin địa chỉ khi vừa được cắm dây
    for (const D of [A, B]) if (TYPES[D.type].kind === 'host' && D.dhcp) this.call(2, () => this.dhcpRenew(D));
    return { ok: true, link: l, msg: `Đã nối ${A.name} (${A.ports[pa].name}) ↔ ${B.name} (${B.ports[pb].name})` };
  }
  disconnect(lid) {
    const l = this.links.find((x) => x.id === lid); if (!l) return;
    const A = this.dev(l.a.dev), B = this.dev(l.b.dev);
    if (A) A.ports[l.a.port].link = null; if (B) B.ports[l.b.port].link = null;
    this.links = this.links.filter((x) => x !== l);
    this.q = this.q.filter((it) => it.link !== lid);
    for (const D of [A, B]) if (D && D.rt) { D.rt.mac = {}; }
    this.emit('topo');
  }
  peer(dev, pi) { const l = this.links.find((x) => x.id === dev.ports[pi].link); if (!l) return null; return l.a.dev === dev.id && l.a.port === pi ? { dev: this.dev(l.b.dev), port: l.b.port, link: l } : { dev: this.dev(l.a.dev), port: l.a.port, link: l }; }

  resetRt(d) { d.rt = { arp: {}, mac: {}, pending: [], arpAsk: {}, pings: {}, leases: {}, dhcp: null, dnsq: {}, http: {}, }; }
  resetRuntime() { this.q = []; this.events = []; this.flashes = []; this.time = 0; this.devs.forEach((d) => this.resetRt(d)); this.emit('events'); this.emit('reset'); }

  toJSON() {
    return { v: 1, devs: this.devs.map(({ rt, ...d }) => JSON.parse(JSON.stringify(d))), links: JSON.parse(JSON.stringify(this.links)), macSeq: this.macSeq };
  }
  load(j) {
    this.devs = (j.devs || []).map((d) => { const x = JSON.parse(JSON.stringify(d)); this.resetRt(x); return x; });
    this.links = JSON.parse(JSON.stringify(j.links || [])); this.macSeq = j.macSeq || 0x100;
    this.q = []; this.events = []; this.flashes = []; this.time = 0; this.emit('topo'); this.emit('events');
    return this;
  }
  static from(j) { return new Net().load(j); }

  // ---------- hàng đợi sự kiện ----------
  push(it) { it.seq = this.qseq++; this.q.push(it); }
  call(dt, fn) { this.push({ t: this.time + dt, kind: 'call', fn }); }
  nextT() { let m = Infinity; for (const it of this.q) if (it.t < m) m = it.t; return m; }
  popNext() { let bi = -1; for (let i = 0; i < this.q.length; i++) { const a = this.q[i], b = this.q[bi]; if (bi < 0 || a.t < b.t || (a.t === b.t && a.seq < b.seq)) bi = i; } return bi < 0 ? null : this.q.splice(bi, 1)[0]; }
  run(it) {
    this.time = Math.max(this.time, it.t);
    if (it.kind === 'call') it.fn();
    else if (it.kind === 'deliver') this.deliver(it);
  }
  tick(dt) { const target = this.time + dt; let n = 0; while (this.q.length && this.nextT() <= target && n++ < 5000) this.run(this.popNext()); this.time = target; }
  // chế độ mô phỏng: chạy tới khi một gói tin tới nơi
  step() { let n = 0; while (this.q.length && n++ < 5000) { const it = this.popNext(); this.run(it); if (it.kind === 'deliver') return true; } return false; }
  runUntilIdle(maxT = 400) { const end = this.time + maxT; let n = 0; while (this.q.length && n++ < 200000) { const t = this.nextT(); if (t > end) break; this.run(this.popNext()); } }
  inflight() { return this.q.filter((it) => it.kind === 'deliver').map((it) => ({ ...it, f: Math.max(0, Math.min(1, (this.time - it.t0) / (it.t - it.t0))) })); }

  // ---------- truyền khung ----------
  send(dev, pi, frame) {
    const p = this.peer(dev, pi); if (!p) return false;
    const f = JSON.parse(JSON.stringify(frame));
    f.id = f.id || nid('f');
    this.push({ t: this.time + HOP, t0: this.time, kind: 'deliver', frame: f, from: dev.id, fromPort: pi, to: p.dev.id, toPort: p.port, link: p.link.id });
    return true;
  }
  deliver(it) {
    const D = this.dev(it.to), F = this.dev(it.from); if (!D) return;
    const res = this.receive(D, it.toPort, it.frame) || {};
    const ev = { t: this.time, last: F ? F.name : '?', at: D.name, atId: D.id, tag: tagOf(it.frame), frame: it.frame, note: res.note || '', drop: !!res.drop };
    if (this.recording) { this.events.push(ev); if (this.events.length > 800) this.events.splice(0, 200); this.emit('event', ev); }
    if (res.drop) this.flashes.push({ dev: D.id, t: this.time, kind: 'drop' });
  }

  receive(D, pi, fr) {
    const kind = TYPES[D.type].kind;
    if (kind === 'hub') { D.ports.forEach((p, i) => { if (i !== pi && p.link) this.send(D, i, fr); }); return { note: 'Hub phát lại khung tới mọi cổng khác (không cần biết ai nhận).' }; }
    if (kind === 'switch') {
      D.rt.mac[fr.eth.src] = pi;
      const out = fr.eth.dst === BCAST ? undefined : D.rt.mac[fr.eth.dst];
      if (out === undefined) { D.ports.forEach((p, i) => { if (i !== pi && p.link) this.send(D, i, fr); }); return { note: fr.eth.dst === BCAST ? 'Khung quảng bá → switch gửi ra mọi cổng khác.' : 'Switch chưa biết MAC đích ở cổng nào → gửi ra mọi cổng (flood).' }; }
      if (out === pi) return { note: 'MAC đích nằm ở chính cổng vào → switch bỏ khung.', drop: true };
      this.send(D, out, fr); return { note: `Switch tra bảng MAC: ${fr.eth.dst} ở cổng ${D.ports[out].name} → chỉ gửi ra cổng đó.` };
    }
    const port = D.ports[pi];
    const mine = fr.eth.dst === BCAST || fr.eth.dst === port.mac;
    if (!mine) return { note: 'MAC đích không phải của thiết bị này → bỏ qua.', drop: true };
    if (fr.type === 'arp') return this.onArp(D, pi, fr);
    if (kind === 'cloud') return this.cloudIp(D, pi, fr);
    if (kind === 'router') return this.routerIp(D, pi, fr);
    return this.hostIp(D, pi, fr);
  }

  // ---------- ARP ----------
  onArp(D, pi, fr) {
    const a = fr.arp, port = D.ports[pi];
    if (a.op === 'req') {
      if (port.ip && a.tip === port.ip) {
        D.rt.arp[a.sip] = { mac: a.smac, port: pi };
        this.send(D, pi, { type: 'arp', eth: { src: port.mac, dst: a.smac }, arp: { op: 'rep', sip: port.ip, smac: port.mac, tip: a.sip, tmac: a.smac } });
        this.flushPending(D, a.sip);
        return { note: `ARP: "Ai có ${a.tip}?" – chính là mình → trả lời MAC ${port.mac}.` };
      }
      return { note: `ARP: hỏi ${a.tip}, không phải địa chỉ của mình → bỏ qua.`, drop: true };
    }
    D.rt.arp[a.sip] = { mac: a.smac, port: pi };
    this.flushPending(D, a.sip);
    return { note: `ARP: biết được ${a.sip} có MAC ${a.smac} → lưu vào bảng ARP, gửi tiếp các gói đang chờ.` };
  }
  flushPending(D, ip) {
    const go = D.rt.pending.filter((p) => p.nh === ip); D.rt.pending = D.rt.pending.filter((p) => p.nh !== ip);
    delete D.rt.arpAsk[ip];
    go.forEach((p) => this.emitIp(D, p.pi, D.rt.arp[ip].mac, p.pkt));
  }
  emitIp(D, pi, dmac, pkt) { this.send(D, pi, { type: 'ip', eth: { src: D.ports[pi].mac, dst: dmac }, ip: pkt }); }
  resolveSend(D, pi, nh, pkt) {
    if (nh === '255.255.255.255') return this.emitIp(D, pi, BCAST, pkt);
    const e = D.rt.arp[nh];
    if (e) return this.emitIp(D, pi, e.mac, pkt);
    D.rt.pending.push({ nh, pi, pkt, t: this.time });
    if (!D.rt.arpAsk[nh]) {
      D.rt.arpAsk[nh] = this.time;
      const port = D.ports[pi];
      this.send(D, pi, { type: 'arp', eth: { src: port.mac, dst: BCAST }, arp: { op: 'req', sip: port.ip, smac: port.mac, tip: nh, tmac: '00:00:00:00:00:00' } });
      this.call(ARP_TO, () => { if (D.rt.arpAsk[nh] !== undefined && !D.rt.arp[nh]) { delete D.rt.arpAsk[nh]; D.rt.pending = D.rt.pending.filter((p) => p.nh !== nh); } });
    }
  }

  // ---------- IP: máy trạm / máy chủ ----------
  hostSend(D, pkt) {
    const port = D.ports[0];
    if (!port.link) return 'Máy chưa được cắm dây mạng.';
    if (pkt.dst === '255.255.255.255') { this.resolveSend(D, 0, '255.255.255.255', pkt); return null; }
    if (!port.ip || ip2n(port.ip) === null) return 'Máy chưa có địa chỉ IP.';
    if (ip2n(port.mask) === null || maskLen(port.mask) < 0) return 'Subnet mask chưa đúng.';
    const nh = sameNet(pkt.dst, port.ip, port.mask) ? pkt.dst : (D.gw && ip2n(D.gw) !== null ? D.gw : null);
    if (!nh) return 'Đích ở mạng khác nhưng máy chưa có Default Gateway.';
    if (!sameNet(nh, port.ip, port.mask)) return 'Default Gateway không cùng mạng với máy.';
    this.resolveSend(D, 0, nh, pkt); return null;
  }
  hostIp(D, pi, fr) {
    const ip = fr.ip, port = D.ports[0], app = ip.app;
    const toMe = (port.ip && ip.dst === port.ip) || ip.dst === '255.255.255.255';
    if (!toMe) return { note: `Gói IP gửi tới ${ip.dst}, không phải máy này → bỏ qua.`, drop: true };
    return this.app(D, pi, fr, port.ip || '0.0.0.0', (pkt) => this.hostSend(D, pkt));
  }

  // ---------- IP: router ----------
  route(D, dst) {
    let best = null;
    D.ports.forEach((p, i) => {
      if (!p.ip || !p.link || maskLen(p.mask) < 0) return;
      if (sameNet(dst, p.ip, p.mask)) { const l = maskLen(p.mask); if (!best || l > best.l) best = { pi: i, nh: dst, l, how: `mạng nối trực tiếp ${netOf(p.ip, p.mask)}/${l} (cổng ${p.name})` }; }
    });
    for (const r of D.routes) {
      const l = maskLen(r.mask); if (l < 0 || ip2n(r.net) === null) continue;
      if (sameNet(dst, r.net, r.mask) && (!best || l > best.l)) {
        const pi = D.ports.findIndex((p) => p.ip && p.link && sameNet(r.via, p.ip, p.mask));
        if (pi >= 0) best = { pi, nh: r.via, l, how: `tuyến tĩnh ${r.net}/${l} qua ${r.via}` };
      }
    }
    return best;
  }
  routerSend(D, pkt) {
    const r = this.route(D, pkt.dst); if (!r) return 'Không có tuyến tới ' + pkt.dst;
    if (!pkt.src || pkt.src === '0.0.0.0') pkt.src = D.ports[r.pi].ip;
    this.resolveSend(D, r.pi, r.nh, pkt); return null;
  }
  routerIp(D, pi, fr) {
    const ip = fr.ip, port = D.ports[pi];
    if (ip.dst === '255.255.255.255') {
      if (ip.app.kind === 'dhcp' && port.pool && port.pool.on) return this.dhcpServe(D, pi, fr, port.pool, port.ip, (pkt) => this.emitIp(D, pi, pkt.app.chaddr, pkt));
      return { note: 'Router không chuyển tiếp gói quảng bá sang mạng khác.', drop: true };
    }
    if (D.ports.some((p) => p.ip && p.ip === ip.dst)) return this.app(D, pi, fr, ip.dst, (pkt) => this.routerSend(D, pkt));
    const r = this.route(D, ip.dst);
    if (!r) { this.icmpBack(D, pi, fr, 'unreach'); return { note: `Router không có tuyến nào tới ${ip.dst} → bỏ gói, báo "không tới được đích".`, drop: true }; }
    if (ip.ttl <= 1) { this.icmpBack(D, pi, fr, 'ttl'); return { note: 'TTL hết (=1) → router bỏ gói và báo "hết thời gian sống" về máy gửi (tracert dựa vào điều này).', drop: true }; }
    const pkt = { ...ip, ttl: ip.ttl - 1 };
    this.resolveSend(D, r.pi, r.nh, pkt);
    return { note: `Router tra bảng định tuyến: ${r.how} → chuyển ra cổng ${D.ports[r.pi].name}, TTL ${ip.ttl}→${ip.ttl - 1}.` };
  }
  icmpBack(D, pi, fr, op) {
    if (fr.ip.app.kind !== 'icmp' || fr.ip.app.op !== 'echo') return;
    const src = D.ports[pi].ip;
    this.routerSend(D, { src, dst: fr.ip.src, ttl: 255, app: { kind: 'icmp', op, id: fr.ip.app.id, seq: fr.ip.app.seq, from: src } });
  }

  // ---------- Internet (đám mây) ----------
  cloudIp(D, pi, fr) {
    const ip = fr.ip, app = ip.app; const me = ip.dst === CLOUD_IP ? {} : CLOUD_HOSTS[ip.dst];
    if (!me) {
      this.cloudReply(D, pi, fr, { src: CLOUD_IP, dst: ip.src, ttl: 250, app: { kind: 'icmp', op: 'unreach', id: app.id, seq: app.seq, from: CLOUD_IP } }, app.kind === 'icmp' && app.op === 'echo');
      return { note: `Internet không có máy nào mang địa chỉ ${ip.dst}.`, drop: true };
    }
    const reply = (a) => this.cloudReply(D, pi, fr, { src: ip.dst, dst: ip.src, ttl: 54, app: a }, true);
    if (app.kind === 'icmp' && app.op === 'echo') { reply({ kind: 'icmp', op: 'reply', id: app.id, seq: app.seq }); return { note: `Máy ${ip.dst} ngoài Internet trả lời ping.` }; }
    if (app.kind === 'dns' && app.op === 'q' && me.dns) { const r = CLOUD_DNS[app.name.toLowerCase()] || null; reply({ kind: 'dns', op: 'r', id: app.id, name: app.name, ip: r }); return { note: `Máy chủ DNS ${ip.dst}: ${app.name} → ${r || 'không tồn tại'}.` }; }
    if (app.kind === 'http' && app.op === 'get' && me.web) { reply({ kind: 'http', op: 'res', id: app.id, status: 200, ...me.web }); return { note: `Máy chủ web ${ip.dst} gửi trang về.` }; }
    return { note: 'Máy ngoài Internet không phục vụ yêu cầu này.', drop: true };
  }
  cloudReply(D, pi, fr, pkt, ok) { if (ok) this.send(D, pi, { type: 'ip', eth: { src: D.ports[pi].mac, dst: fr.eth.src }, ip: pkt }); }

  // ---------- tầng ứng dụng ----------
  app(D, pi, fr, myIp, sendFn) {
    const ip = fr.ip, a = ip.app;
    if (a.kind === 'icmp') {
      if (a.op === 'echo') { const e = sendFn({ src: myIp, dst: ip.src, ttl: D.type === 'router' ? 255 : 128, app: { kind: 'icmp', op: 'reply', id: a.id, seq: a.seq } }); return { note: e ? 'Nhận ping nhưng không gửi trả lời được: ' + e : `Nhận yêu cầu ping (echo) từ ${ip.src} → gửi trả lời (echo reply).` }; }
      const p = D.rt.pings[a.id]; if (p) p.onIcmp(a, ip, this.time);
      return { note: a.op === 'reply' ? `Nhận trả lời ping từ ${ip.src}. Thành công!` : a.op === 'ttl' ? `Router ${a.from} báo: hết TTL.` : `Nhận báo lỗi: không tới được đích (từ ${a.from}).` };
    }
    if (a.kind === 'dhcp') {
      if (a.op === 'discover' || a.op === 'request') {
        if (D.type === 'server' && D.svc.dhcp.on) return this.dhcpServe(D, pi, fr, { ...D.svc.dhcp }, D.ports[0].ip, (pkt) => this.emitIp(D, 0, pkt.app.chaddr, pkt));
        return { note: 'Thiết bị không bật dịch vụ DHCP → bỏ qua.', drop: true };
      }
      return this.dhcpClient(D, a);
    }
    if (a.kind === 'dns') {
      if (a.op === 'q') {
        if (D.type === 'server' && D.svc.dns.on) {
          const rec = D.svc.dns.records.find((r) => r.name.trim().toLowerCase() === a.name.trim().toLowerCase());
          sendFn({ src: myIp, dst: ip.src, ttl: 128, app: { kind: 'dns', op: 'r', id: a.id, name: a.name, ip: rec ? rec.ip : null } });
          return { note: rec ? `Máy chủ DNS tra được ${a.name} → ${rec.ip}.` : `Máy chủ DNS không có bản ghi ${a.name}.` };
        }
        return { note: 'Thiết bị không bật dịch vụ DNS → bỏ qua.', drop: true };
      }
      const q = D.rt.dnsq[a.id]; if (q) q(a); return { note: `Nhận trả lời DNS: ${a.name} → ${a.ip || 'không có'}.` };
    }
    if (a.kind === 'http') {
      if (a.op === 'get') {
        if (D.type === 'server' && D.svc.web.on) { sendFn({ src: myIp, dst: ip.src, ttl: 128, app: { kind: 'http', op: 'res', id: a.id, status: 200, title: D.svc.web.title, body: D.svc.web.body } }); return { note: 'Máy chủ web nhận yêu cầu GET → gửi trang web về.' }; }
        return { note: 'Thiết bị không bật dịch vụ Web (HTTP) → không trả lời.', drop: true };
      }
      const h = D.rt.http[a.id]; if (h) h(a); return { note: 'Nhận được trang web.' };
    }
    return { note: '' };
  }

  // ---------- DHCP ----------
  dhcpServe(D, pi, fr, pool, serverIp, sendTo) {
    const a = fr.ip.app;
    if (!serverIp || ip2n(pool.start) === null || maskLen(pool.mask) < 0) return { note: 'Dịch vụ DHCP chưa cấu hình đủ (địa chỉ bắt đầu, subnet mask).', drop: true };
    const leases = D.rt.leases; const key = a.chaddr;
    let ip = leases[key];
    if (!ip) {
      const used = new Set(Object.values(leases)); used.add(serverIp);
      for (let i = 0; i < (Number(pool.count) || 1); i++) { const c = n2ip((ip2n(pool.start) + i) >>> 0); if (!used.has(c) && !this.devs.some((d) => d.ports.some((p) => p.ip === c))) { ip = c; break; } }
      if (!ip) return { note: 'DHCP đã hết địa chỉ để cấp.', drop: true };
      leases[key] = ip;
    }
    const op = a.op === 'discover' ? 'offer' : 'ack';
    sendTo({ src: serverIp, dst: '255.255.255.255', ttl: 128, app: { kind: 'dhcp', op, xid: a.xid, chaddr: a.chaddr, yiaddr: ip, mask: pool.mask, gw: pool.gw || '', dns: pool.dns || '', server: serverIp } });
    return { note: a.op === 'discover' ? `Máy chủ DHCP nhận "xin địa chỉ" → đề nghị cấp ${ip}.` : `Máy chủ DHCP xác nhận: cấp ${ip} cho máy ${a.chaddr}.` };
  }
  dhcpClient(D, a) {
    const st = D.rt.dhcp; if (!st || a.xid !== st.xid || a.chaddr !== D.ports[0].mac) return { note: 'Gói DHCP không dành cho máy này → bỏ qua.', drop: true };
    if (a.op === 'offer' && st.state === 'disc') {
      st.state = 'req';
      this.hostSend(D, { src: '0.0.0.0', dst: '255.255.255.255', ttl: 128, app: { kind: 'dhcp', op: 'request', xid: st.xid, chaddr: D.ports[0].mac, want: a.yiaddr } });
      return { note: `Nhận đề nghị ${a.yiaddr} → gửi "xin nhận địa chỉ này" (request).` };
    }
    if (a.op === 'ack' && st.state === 'req') {
      const p = D.ports[0]; p.ip = a.yiaddr; p.mask = a.mask; D.gw = a.gw; D.dns = a.dns; st.state = 'done';
      D.rt.arp = {}; st.cb && st.cb(null); this.emit('config', D);
      return { note: `Nhận xác nhận → máy dùng IP ${a.yiaddr}, gateway ${a.gw || '(trống)'}, DNS ${a.dns || '(trống)'}.` };
    }
    return { note: 'Gói DHCP thừa → bỏ qua.', drop: true };
  }
  dhcpRenew(D, cb) {
    if (TYPES[D.type].kind !== 'host') return;
    const p = D.ports[0];
    if (!p.link) { cb && cb('Máy chưa được cắm dây mạng.'); return; }
    p.ip = ''; p.mask = ''; D.gw = ''; D.dns = ''; this.emit('config', D);
    const xid = Math.floor(Math.random() * 1e9);
    D.rt.dhcp = { xid, state: 'disc', cb };
    this.hostSend(D, { src: '0.0.0.0', dst: '255.255.255.255', ttl: 128, app: { kind: 'dhcp', op: 'discover', xid, chaddr: p.mac } });
    this.call(DHCP_TO, () => {
      if (D.rt.dhcp && D.rt.dhcp.xid === xid && D.rt.dhcp.state !== 'done') {
        // Windows tự đặt địa chỉ APIPA 169.254.x.x khi không xin được
        const b = p.mac.split(':').slice(-2).map((x) => parseInt(x, 16));
        p.ip = `169.254.${b[0] || 1}.${b[1] || 1}`; p.mask = '255.255.0.0'; D.rt.dhcp.state = 'fail'; this.emit('config', D);
        cb && cb('Không nhận được địa chỉ từ máy chủ DHCP – máy tự đặt địa chỉ tạm 169.254.x.x (APIPA).');
      }
    });
  }

  // ---------- công cụ cho người dùng: ping, tracert, nslookup, http ----------
  sendFrom(D, pkt) { return TYPES[D.type].kind === 'router' ? this.routerSend(D, pkt) : this.hostSend(D, pkt); }
  srcIp(D, dst) { if (TYPES[D.type].kind === 'router') { const r = this.route(D, dst); return r ? D.ports[r.pi].ip : ''; } return D.ports[0].ip; }
  resolve(D, name, cb) {
    if (ip2n(name) !== null) return cb(null, name);
    if (!D.dns || ip2n(D.dns) === null) return cb('Máy chưa có địa chỉ máy chủ DNS nên không đổi được tên "' + name + '" thành địa chỉ IP.');
    const id = nid('q'); let done = false;
    D.rt.dnsq[id] = (a) => { if (done) return; done = true; delete D.rt.dnsq[id]; a.ip ? cb(null, a.ip) : cb(`Máy chủ DNS không tìm thấy tên "${name}".`); };
    const e = this.sendFrom(D, { src: this.srcIp(D, D.dns), dst: D.dns, ttl: 128, app: { kind: 'dns', op: 'q', id, name } });
    if (e) { done = true; delete D.rt.dnsq[id]; return cb(e); }
    this.call(DNS_TO, () => { if (!done) { done = true; delete D.rt.dnsq[id]; cb('Máy chủ DNS không trả lời (hết thời gian chờ).'); } });
  }
  ping(D, target, { count = 4, ttl = 128, out = () => {}, done = () => {} } = {}) {
    this.resolve(D, target, (err, dst) => {
      if (err) { out(err, 'err'); done({ sent: 0, recv: 0, err }); return; }
      out(`Pinging ${dst}${dst !== target ? ` [${target}]` : ''} with 32 bytes of data:`);
      const id = nid('p'); let seq = 0, recv = 0; const st = { sent: 0, recv: 0, dst, replies: [] };
      const waiting = {};
      D.rt.pings[id] = { onIcmp: (a, ip, now) => {
        const w = waiting[a.seq]; if (!w) return; delete waiting[a.seq];
        if (a.op === 'reply') { recv++; st.recv = recv; st.replies.push(ip.src); out(`Reply from ${ip.src}: bytes=32 time=${Math.max(1, Math.round(now - w.t))}ms TTL=${ip.ttl}`, 'ok'); }
        else if (a.op === 'ttl') out(`Reply from ${a.from}: TTL expired in transit.`, 'err');
        else out(`Reply from ${a.from}: Destination host unreachable.`, 'err');
      } };
      const one = () => {
        const s = ++seq; st.sent = s;
        const e = this.sendFrom(D, { src: this.srcIp(D, dst), dst, ttl, app: { kind: 'icmp', op: 'echo', id, seq: s } });
        if (e) { out(e, 'err'); } else waiting[s] = { t: this.time };
        this.call(PING_TO, () => { if (waiting[s]) { delete waiting[s]; out('Request timed out.', 'err'); } });
        if (s < count) this.call(PING_GAP, one);
        else this.call(PING_TO + 0.5, () => {
          const lost = st.sent - recv;
          out(`Ping statistics for ${dst}:`); out(`    Packets: Sent = ${st.sent}, Received = ${recv}, Lost = ${lost} (${Math.round(lost / st.sent * 100)}% loss)`);
          delete D.rt.pings[id]; done(st);
        });
      };
      one();
    });
  }
  tracert(D, target, { out = () => {}, done = () => {} } = {}) {
    this.resolve(D, target, (err, dst) => {
      if (err) { out(err, 'err'); done({ ok: false }); return; }
      out(`Tracing route to ${dst} over a maximum of 15 hops:`); out('');
      const id = nid('t'); let hop = 0; let fin = false;
      const next = () => {
        hop++; const h = hop; let got = false;
        D.rt.pings[id] = { onIcmp: (a, ip, now) => {
          if (got || a.seq !== h) return; got = true;
          const who = a.op === 'reply' ? ip.src : a.from;
          out(`  ${String(h).padStart(2)}    ${Math.max(1, Math.round(now - t0))} ms    ${who}`, a.op === 'reply' ? 'ok' : '');
          if (a.op === 'reply' || a.op === 'unreach' || h >= 15) { fin = true; out(''); out(a.op === 'reply' ? 'Trace complete.' : 'Destination unreachable.'); delete D.rt.pings[id]; done({ ok: a.op === 'reply', hops: h }); }
          else next();
        } };
        const t0 = this.time;
        const e = this.sendFrom(D, { src: this.srcIp(D, dst), dst, ttl: h, app: { kind: 'icmp', op: 'echo', id, seq: h } });
        if (e) { out(e, 'err'); done({ ok: false }); return; }
        this.call(PING_TO, () => { if (!got && !fin) { got = true; out(`  ${String(h).padStart(2)}     *        Request timed out.`, 'err'); if (h >= 6) { fin = true; done({ ok: false }); } else next(); } });
      };
      next();
    });
  }
  http(D, url, cb) {
    const m = String(url).trim().replace(/^https?:\/\//i, '').split('/'); const host = m[0];
    if (!host) return cb('Hãy nhập địa chỉ trang web.');
    this.resolve(D, host, (err, ip) => {
      if (err) return cb(err);
      const id = nid('h'); let done = false;
      D.rt.http[id] = (a) => { if (done) return; done = true; delete D.rt.http[id]; cb(null, { ip, host, ...a }); };
      const e = this.sendFrom(D, { src: this.srcIp(D, ip), dst: ip, ttl: 128, app: { kind: 'http', op: 'get', id, host, path: '/' + m.slice(1).join('/') } });
      if (e) { done = true; return cb(e); }
      this.call(HTTP_TO, () => { if (!done) { done = true; delete D.rt.http[id]; cb(`Không kết nối được tới ${host} (${ip}) – máy đó không trả lời hoặc không có dịch vụ Web.`); } });
    });
  }

  // ---------- chấm bài: chạy thử trên bản sao, không ảnh hưởng mạng đang hiển thị ----------
  probePing(srcName, target) {
    const c = Net.from(this.toJSON()); c.recording = false; const D = c.dev(srcName); if (!D) return false;
    let res = null; c.ping(D, target, { count: 2, done: (s) => { res = s; } }); c.runUntilIdle(300);
    return !!(res && res.recv > 0);
  }
  probeHttp(srcName, url) {
    const c = Net.from(this.toJSON()); c.recording = false; const D = c.dev(srcName); if (!D) return { ok: false };
    let res = { ok: false, err: 'không có kết quả' }; c.http(D, url, (err, page) => { res = err ? { ok: false, err } : { ok: true, page }; }); c.runUntilIdle(300);
    return res;
  }
}
