// Thử thách Phòng Mạng (mạch B – Mạng máy tính và Internet). Mỗi thử thách:
//  setup(net): dựng sơ đồ ban đầu; check(net, ctx): trả về [{name, ok, note}] (chạy thử trên bản sao của mạng)
import { ip2n, sameNet, hostOk, maskLen } from './net-engine.js';

export const LEVELS = { 1: 'Mạng LAN', 2: 'Router & dịch vụ', 3: 'Ra Internet' };

const hosts = (net) => net.devs.filter((d) => ['pc', 'laptop', 'phone', 'server'].includes(d.type));
const linked = (net, a, b) => net.links.some((l) => (l.a.dev === a.id && l.b.dev === b.id) || (l.a.dev === b.id && l.b.dev === a.id));
const ipOf = (d) => d.ports[0].ip;
function pairs(arr) { const r = []; for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) r.push([arr[i], arr[j]]); return r; }
function pingAll(net, list) {
  const bad = [];
  for (const [a, b] of pairs(list)) if (!ipOf(b) || !net.probePing(a.name, ipOf(b))) bad.push(`${a.name} → ${b.name}`);
  return bad;
}

export const MISSIONS = [
  {
    id: 'net-hai-may', level: 1, title: 'Hai máy nói chuyện',
    goal: 'Nối cáp giữa hai máy tính, đặt địa chỉ IP cùng mạng rồi ping thành công.',
    steps: [
      'Chọn công cụ <b>Nối cáp</b> (thanh bên trái), bấm PC0 rồi bấm PC1.',
      'Bấm đúp vào từng máy → thẻ <b>Cấu hình</b>: PC0 = <code>192.168.1.10</code>, PC1 = <code>192.168.1.11</code>, Subnet mask <code>255.255.255.0</code>.',
      'Mở <b>Dòng lệnh</b> của PC0, gõ <code>ping 192.168.1.11</code>.',
    ],
    setup(net) { net.add('pc', 260, 260); net.add('pc', 620, 260); },
    check(net) {
      const [a, b] = ['PC0', 'PC1'].map((n) => net.dev(n));
      if (!a || !b) return [{ name: 'Còn đủ PC0 và PC1', ok: false }];
      return [
        { name: 'PC0 và PC1 được nối cáp', ok: linked(net, a, b) },
        { name: 'Hai máy có IP hợp lệ, cùng một mạng', ok: hostOk(ipOf(a), a.ports[0].mask) && hostOk(ipOf(b), b.ports[0].mask) && sameNet(ipOf(a), ipOf(b), a.ports[0].mask) && ipOf(a) !== ipOf(b), note: `${ipOf(a) || '(chưa có)'} / ${ipOf(b) || '(chưa có)'}` },
        { name: 'PC0 ping được PC1', ok: !!ipOf(b) && net.probePing('PC0', ipOf(b)) },
      ];
    },
  },
  {
    id: 'net-switch', level: 1, title: 'Mạng LAN với switch',
    goal: 'Dùng một switch nối 3 máy tính thành mạng LAN 192.168.10.0/24 – máy nào cũng ping được máy khác.',
    steps: ['Nối PC0, PC1, PC2 vào Switch0.', 'Đặt IP 192.168.10.x (x khác nhau, từ 1 đến 254), mask 255.255.255.0.', 'Thử ping giữa các máy. Mở chế độ <b>Mô phỏng</b> để xem switch học địa chỉ MAC.'],
    setup(net) { net.add('switch', 440, 180); net.add('pc', 220, 380); net.add('pc', 440, 420); net.add('pc', 660, 380); },
    check(net) {
      const sw = net.dev('Switch0'); const pcs = ['PC0', 'PC1', 'PC2'].map((n) => net.dev(n)).filter(Boolean);
      const wired = sw && pcs.length === 3 && pcs.every((p) => linked(net, p, sw));
      const inNet = pcs.every((p) => sameNet(ipOf(p), '192.168.10.1', '255.255.255.0') && p.ports[0].mask === '255.255.255.0' && hostOk(ipOf(p), '255.255.255.0'));
      const bad = wired ? pingAll(net, pcs) : ['chưa nối đủ'];
      return [
        { name: '3 máy đều nối vào Switch0', ok: !!wired },
        { name: 'Địa chỉ thuộc mạng 192.168.10.0/24', ok: inNet, note: pcs.map((p) => ipOf(p) || '—').join(', ') },
        { name: 'Mọi cặp máy ping được nhau', ok: bad.length === 0, note: bad.length ? 'chưa thông: ' + bad.join(', ') : '' },
      ];
    },
  },
  {
    id: 'net-tim-loi', level: 1, title: 'Bác sĩ mạng',
    goal: 'Phòng máy có 4 máy nhưng vài máy không liên lạc được. Tìm và sửa lỗi để tất cả ping được nhau.',
    steps: ['Mở cấu hình từng máy và so sánh: IP, Subnet mask.', 'Gợi ý: có máy <b>trùng địa chỉ</b>, có máy <b>khác mạng</b>, có máy <b>sai mask</b>.', 'Dùng lệnh <code>ipconfig</code> và <code>ping</code> để kiểm tra.'],
    setup(net) {
      const sw = net.add('switch', 440, 170);
      const cfg = [['192.168.5.11', '255.255.255.0'], ['192.168.5.12', '255.255.255.0'], ['192.168.5.12', '255.255.255.0'], ['192.168.6.14', '255.255.255.0']];
      cfg.forEach(([ip, mask], i) => { const p = net.add('pc', 180 + i * 175, 400, { ip, mask }); net.connect(p.id, sw.id); });
      net.dev('PC1').ports[0].mask = '255.255.0.255';
    },
    check(net) {
      const pcs = ['PC0', 'PC1', 'PC2', 'PC3'].map((n) => net.dev(n)).filter(Boolean);
      const ips = pcs.map(ipOf); const uniq = new Set(ips).size === ips.length;
      const masks = pcs.every((p) => maskLen(p.ports[0].mask) >= 8);
      const bad = pcs.length === 4 ? pingAll(net, pcs) : ['thiếu máy'];
      return [
        { name: 'Không có hai máy trùng địa chỉ IP', ok: uniq, note: ips.join(', ') },
        { name: 'Mọi Subnet mask đều hợp lệ', ok: masks },
        { name: 'Cả 4 máy ping được nhau', ok: bad.length === 0, note: bad.length ? 'chưa thông: ' + bad.slice(0, 4).join(', ') : '' },
      ];
    },
  },
  {
    id: 'net-wifi', level: 1, title: 'Wi-Fi trong lớp học',
    goal: 'Cho Laptop0 và Điện thoại 0 vào mạng qua Bộ phát Wi-Fi để liên lạc với máy tính của giáo viên (PC0).',
    steps: ['Nối Bộ phát Wi-Fi với Switch0 (dây mạng).', 'Nối Laptop0 và Điện thoại 0 tới Bộ phát Wi-Fi (đường nét đứt = sóng Wi-Fi).', 'Đặt IP cùng mạng 192.168.20.0/24 với PC0 (192.168.20.1) rồi ping PC0 từ điện thoại.'],
    setup(net) {
      const sw = net.add('switch', 330, 220); const pc = net.add('pc', 140, 400, { ip: '192.168.20.1' }); net.connect(pc.id, sw.id);
      net.add('ap', 620, 220); net.add('laptop', 540, 430); net.add('phone', 760, 420);
    },
    check(net) {
      const ap = net.dev('Wi-Fi 0'), lap = net.dev('Laptop0'), ph = net.dev('Điện thoại 0');
      if (!ap || !lap || !ph) return [{ name: 'Còn đủ thiết bị ban đầu', ok: false }];
      return [
        { name: 'Laptop và điện thoại kết nối Wi-Fi', ok: linked(net, ap, lap) && linked(net, ap, ph) },
        { name: 'Điện thoại ping được PC0', ok: net.probePing('Điện thoại 0', '192.168.20.1') },
        { name: 'Laptop ping được PC0', ok: net.probePing('Laptop0', '192.168.20.1') },
      ];
    },
  },
  {
    id: 'net-router', level: 2, title: 'Hai mạng, một router',
    goal: 'Phòng A (192.168.1.0/24) và phòng B (192.168.2.0/24) cần liên lạc với nhau qua Router0.',
    steps: ['Mở Router0 → thẻ <b>Cổng</b>: đặt G0/0 = <code>192.168.1.1</code>, G0/1 = <code>192.168.2.1</code> (mask 255.255.255.0).', 'Ở mỗi máy, điền <b>Default Gateway</b> là địa chỉ cổng router cùng phòng.', 'Ping từ PC0 (phòng A) sang PC2 (phòng B), thử thêm lệnh <code>tracert</code>.'],
    setup(net) {
      const r = net.add('router', 450, 150);
      const sa = net.add('switch', 230, 300), sb = net.add('switch', 670, 300);
      net.connect(r.id, sa.id, 0); net.connect(r.id, sb.id, 1);
      const p0 = net.add('pc', 140, 470, { ip: '192.168.1.10' }), p1 = net.add('pc', 320, 470, { ip: '192.168.1.11' }), p2 = net.add('pc', 670, 470, { ip: '192.168.2.10' });
      [p0, p1].forEach((p) => net.connect(p.id, sa.id)); net.connect(p2.id, sb.id);
    },
    check(net) {
      const r = net.dev('Router0');
      const gws = ['PC0', 'PC1', 'PC2'].every((n) => { const d = net.dev(n); return d && d.gw && r && r.ports.some((p) => p.ip === d.gw); });
      return [
        { name: 'Router có địa chỉ ở cả hai mạng', ok: !!r && r.ports.some((p) => sameNet(p.ip, '192.168.1.1', '255.255.255.0')) && r.ports.some((p) => sameNet(p.ip, '192.168.2.1', '255.255.255.0')) },
        { name: 'Mọi máy có Default Gateway là router', ok: gws },
        { name: 'PC0 ping được PC2 (khác mạng)', ok: net.probePing('PC0', ipOf(net.dev('PC2')) || '0.0.0.0') },
        { name: 'PC2 ping được PC1', ok: net.probePing('PC2', ipOf(net.dev('PC1')) || '0.0.0.0') },
      ];
    },
  },
  {
    id: 'net-dhcp', level: 2, title: 'Tự động cấp địa chỉ (DHCP)',
    goal: 'Thay vì đặt IP bằng tay cho từng máy, hãy bật DHCP trên Router0 để các máy tự nhận địa chỉ.',
    steps: ['Mở Router0 → thẻ <b>Cổng</b>: G0/0 = <code>192.168.50.1</code>/24, tích <b>Cấp DHCP</b>, địa chỉ bắt đầu <code>192.168.50.100</code>.', 'Ở mỗi máy (đã đặt chế độ DHCP), mở Dòng lệnh và gõ <code>ipconfig /renew</code>.', 'Chuyển sang <b>Mô phỏng</b> để xem 4 bước DHCP: Discover → Offer → Request → Ack.'],
    setup(net) {
      const r = net.add('router', 450, 150), sw = net.add('switch', 450, 300); net.connect(r.id, sw.id, 0);
      [0, 1, 2].forEach((i) => { const p = net.add(i === 2 ? 'laptop' : 'pc', 220 + i * 230, 470, { set: { dhcp: true } }); net.connect(p.id, sw.id); });
    },
    check(net) {
      const list = ['PC0', 'PC1', 'Laptop0'].map((n) => net.dev(n)).filter(Boolean);
      const got = list.every((d) => d.dhcp && sameNet(ipOf(d), '192.168.50.1', '255.255.255.0') && d.gw);
      const bad = got ? pingAll(net, list) : ['chưa nhận IP'];
      return [
        { name: 'Router bật DHCP', ok: !!net.dev('Router0')?.ports.some((p) => p.pool && p.pool.on) },
        { name: 'Các máy tự nhận IP 192.168.50.x và gateway', ok: got, note: list.map((d) => `${d.name}: ${ipOf(d) || '—'}`).join(' · ') },
        { name: 'Các máy ping được nhau', ok: bad.length === 0 },
      ];
    },
  },
  {
    id: 'net-dns', level: 2, title: 'Đặt tên cho máy chủ (DNS)',
    goal: 'Học sinh muốn gõ tên <code>web.lop.vn</code> thay vì nhớ địa chỉ IP. Hãy dựng máy chủ DNS cho lớp.',
    steps: ['Mở Máy chủ 0 → thẻ <b>Dịch vụ</b>: bật DNS, thêm bản ghi <code>web.lop.vn</code> → <code>192.168.30.5</code> (chính máy chủ).', 'Ở PC0, điền <b>DNS Server</b> = <code>192.168.30.5</code>.', 'Mở <b>Trình duyệt</b> của PC0, vào <code>web.lop.vn</code>.'],
    setup(net) {
      const sw = net.add('switch', 450, 220); const s = net.add('server', 700, 400, { ip: '192.168.30.5' }); const p = net.add('pc', 220, 400, { ip: '192.168.30.10' });
      net.connect(s.id, sw.id); net.connect(p.id, sw.id);
    },
    check(net) {
      const s = net.dev('Máy chủ 0'); const rec = s && s.svc.dns.on && s.svc.dns.records.find((r) => r.name.trim().toLowerCase() === 'web.lop.vn');
      const h = net.probeHttp('PC0', 'web.lop.vn');
      return [
        { name: 'Máy chủ bật DNS và có bản ghi web.lop.vn', ok: !!rec },
        { name: 'Bản ghi trỏ đúng địa chỉ máy chủ', ok: !!rec && s && rec.ip === ipOf(s) },
        { name: 'PC0 mở được trang web.lop.vn', ok: h.ok, note: h.ok ? '' : h.err },
      ];
    },
  },
  {
    id: 'net-internet', level: 3, title: 'Kết nối Internet',
    goal: 'Đưa mạng gia đình ra Internet và mở trang <code>tinhoc.vn</code>.',
    steps: ['Nối cổng G0/1 của Router0 với đám mây <b>Internet</b>.', 'Router0 → <b>Cổng</b>: G0/1 = <code>100.64.0.2</code>, mask <code>255.255.255.252</code>. Thẻ <b>Định tuyến</b>: thêm tuyến mặc định <code>0.0.0.0</code> / <code>0.0.0.0</code> qua <code>100.64.0.1</code>.', 'PC0: Gateway = <code>192.168.1.1</code>, DNS = <code>8.8.8.8</code>. Mở trình duyệt vào <code>tinhoc.vn</code>. Thử <code>tracert 8.8.8.8</code>.'],
    setup(net) {
      const r = net.add('router', 450, 260); r.ports[0].ip = '192.168.1.1'; r.ports[0].mask = '255.255.255.0';
      const sw = net.add('switch', 450, 400); net.connect(r.id, sw.id, 0);
      const p = net.add('pc', 260, 520, { ip: '192.168.1.20' }); net.connect(p.id, sw.id);
      net.add('cloud', 450, 90);
    },
    check(net) {
      const r = net.dev('Router0'), c = net.dev('Internet0') || net.devs.find((d) => d.type === 'cloud');
      const h = net.probeHttp('PC0', 'tinhoc.vn');
      return [
        { name: 'Router được nối với Internet', ok: !!(r && c && linked(net, r, c)) },
        { name: 'Router có tuyến mặc định 0.0.0.0/0', ok: !!r && r.routes.some((x) => x.net === '0.0.0.0' && x.mask === '0.0.0.0') },
        { name: 'PC0 ping được 8.8.8.8', ok: net.probePing('PC0', '8.8.8.8') },
        { name: 'PC0 mở được tinhoc.vn', ok: h.ok, note: h.ok ? '' : h.err },
      ];
    },
  },
  {
    id: 'net-goi-tin', level: 3, title: 'Thám tử gói tin',
    goal: 'Quan sát trong chế độ <b>Mô phỏng</b> rồi trả lời: khi PC0 ping PC1 lần đầu, <b>gói tin đầu tiên</b> PC0 gửi đi thuộc loại nào, và vì sao?',
    steps: ['Bấm <b>Mô phỏng</b>, rồi dùng công cụ <b>Gửi gói tin</b> (hình phong bì): bấm PC0 rồi PC1.', 'Bấm ⏭ từng bước, xem cột <b>Loại</b> trong danh sách sự kiện. Bấm vào một dòng để xem chi tiết gói tin.', 'Chọn đáp án bên dưới.'],
    quiz: {
      q: 'Gói tin đầu tiên PC0 gửi là gì?',
      options: ['ICMP – vì ping dùng giao thức ICMP', 'ARP – vì PC0 cần hỏi địa chỉ MAC của PC1 trước', 'DNS – vì phải đổi tên PC1 thành địa chỉ IP', 'DHCP – vì PC0 cần xin địa chỉ IP'],
      answer: 1,
    },
    setup(net) { const sw = net.add('switch', 450, 220); [['PC0', '10.0.0.1', 230], ['PC1', '10.0.0.2', 450], ['PC2', '10.0.0.3', 670]].forEach(([n, ip, x]) => { const p = net.add('pc', x, 420, { ip, mask: '255.0.0.0' }); net.connect(p.id, sw.id); }); },
    check(net, ctx) {
      return [
        { name: 'Đã quan sát gói ARP trong chế độ mô phỏng', ok: ctx.sawArp, note: ctx.sawArp ? '' : 'hãy gửi một gói tin ở chế độ Mô phỏng' },
        { name: 'Trả lời đúng', ok: ctx.answer === 1, note: ctx.answer === undefined ? 'chưa chọn đáp án' : ctx.answer === 1 ? 'Đúng: máy chỉ biết IP của PC1, phải hỏi ARP để biết MAC rồi mới đóng khung Ethernet gửi gói ICMP.' : 'Chưa đúng – xem lại cột Loại ở dòng đầu tiên.' },
      ];
    },
  },
];
export const byId = (id) => MISSIONS.find((m) => m.id === id);
export { ip2n };
