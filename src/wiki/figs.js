// Hình minh hoạ SVG cho các bài viết (tự vẽ bằng code)
const C = { blue: '#0071e3', green: '#34c759', orange: '#ff9500', red: '#ff3b30', purple: '#af52de', teal: '#30b0c7', gray: '#8e8e93', ink: '#1d1d1f', soft: '#f2f2f7', yellow: '#ffcc00', pink: '#ff2d55', indigo: '#5856d6' };
const t = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 13}" font-weight="${o.fw || 500}" fill="${o.fill || C.ink}" text-anchor="${o.a || 'middle'}" ${o.extra || ''}>${s}</text>`;
const rect = (x, y, w, h, fill, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 10}" fill="${fill}" ${o.stroke ? `stroke="${o.stroke}" stroke-width="${o.sw || 1.5}"` : ''} ${o.extra || ''}/>`;
const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="Inter, Segoe UI, system-ui, sans-serif">${body}</svg>`;
const arrow = (x1, y1, x2, y2, col = C.gray) => { const a = Math.atan2(y2 - y1, x2 - x1), L = 8; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="2"/><path d="M${x2} ${y2} L${x2 - L * Math.cos(a - 0.45)} ${y2 - L * Math.sin(a - 0.45)} L${x2 - L * Math.cos(a + 0.45)} ${y2 - L * Math.sin(a + 0.45)} Z" fill="${col}"/>`; };

// ---- biểu đồ mẫu dùng chung ----
function bars(data, { w = 520, h = 240, horiz = false, colors = [C.blue], unit = '', max = null, labels = true, gap = 0.7 } = {}) {
  const M = Math.max(max || 0, ...data.map((d) => d[1]));
  let b = '';
  if (horiz) {
    const bh = (h - 20) / data.length;
    data.forEach(([l, v], i) => { const y = 10 + i * bh, bw = ((w - 170) * v) / M; b += t(100, y + bh / 2 + 4, l, { a: 'end' }) + rect(110, y + bh * 0.18, bw, bh * 0.64, colors[i % colors.length], { rx: 5 }) + t(116 + bw, y + bh / 2 + 4, v + unit, { a: 'start', fw: 600 }); });
  } else {
    const bw = (w - 60) / data.length;
    b += `<line x1="40" y1="${h - 30}" x2="${w - 10}" y2="${h - 30}" stroke="#ccc"/>`;
    data.forEach(([l, v], i) => { const x = 50 + i * bw, bh = ((h - 70) * v) / M; b += rect(x + bw * (1 - gap) / 2, h - 30 - bh, bw * gap, bh, colors[i % colors.length], { rx: 4 }) + (labels ? t(x + bw / 2, h - 34 - bh, v + unit, { fs: 12, fw: 600 }) : '') + t(x + bw / 2, h - 12, l, { fs: 12 }); });
  }
  return svg(w, h, b);
}

export const FIGS = {
  'os-layers': () => svg(520, 260, [['Người dùng', C.soft, C.ink], ['Ứng dụng (Word, Chrome, game…)', '#e8f1ff', C.blue], ['Hệ điều hành (nhân – kernel, trình điều khiển)', '#e9f8ee', '#1f8a3b'], ['Phần cứng (CPU, RAM, ổ cứng, màn hình…)', '#fff3e0', '#b35c00']].map(([s, f, col], i) => rect(40 + i * 12, 14 + i * 60, 440 - i * 24, 48, f, { stroke: col }) + t(260, 44 + i * 60, s, { fw: 600, fill: col })).join('') + arrow(500, 40, 500, 220, C.gray) + t(505, 250, 'yêu cầu đi xuống', { fs: 11, a: 'end', fill: C.gray })),

  'os-timeline': () => {
    const ev = [[1969, 'UNIX', C.gray], [1981, 'MS-DOS', C.gray], [1984, 'Mac System 1', C.purple], [1985, 'Windows 1.0', C.blue], [1991, 'Linux', C.orange], [1995, 'Windows 95', C.blue], [2001, 'Windows XP · Mac OS X', C.blue], [2007, 'iPhone OS (iOS)', C.purple], [2008, 'Android', C.green], [2011, 'Chrome OS', C.teal], [2015, 'Windows 10', C.blue], [2021, 'Windows 11', C.blue], [2025, 'iOS 26 · macOS 26', C.purple]];
    const x = (y) => 30 + ((y - 1966) / 62) * 820;
    let b = `<line x1="20" y1="120" x2="870" y2="120" stroke="${C.ink}" stroke-width="2"/>`;
    ev.forEach(([y, l, col], i) => { const up = i % 2 === 0, yy = up ? 60 - (i % 4 === 0 ? 0 : 22) : 180 + (i % 4 === 1 ? 0 : 22); b += `<line x1="${x(y)}" y1="120" x2="${x(y)}" y2="${up ? yy + 8 : yy - 18}" stroke="${col}" stroke-width="1.5"/><circle cx="${x(y)}" cy="120" r="6" fill="${col}"/>` + t(x(y), yy, l, { fs: 12, fw: 600, fill: col }) + t(x(y), up ? yy - 15 : yy + 15, y, { fs: 11, fill: C.gray }); });
    return svg(890, 240, b);
  },

  'mem-ladder': () => {
    const st = [['bit', '0 hoặc 1', C.gray], ['Byte', '8 bit · 1 chữ cái', C.teal], ['KB', '1.024 B · 1 trang chữ', C.blue], ['MB', '1.024 KB · 1 bài hát MP3 ≈ 4 MB', C.indigo], ['GB', '1.024 MB · 1 bộ phim HD ≈ 2–4 GB', C.purple], ['TB', '1.024 GB · ổ cứng phổ biến', C.orange], ['PB', '1.024 TB · trung tâm dữ liệu', C.red]];
    return svg(620, 330, st.map(([n, d, col], i) => rect(20 + i * 26, 286 - i * 44, 200, 36, col, { rx: 8 }) + t(120 + i * 26, 310 - i * 44, n, { fill: '#fff', fw: 700, fs: 15 }) + t(232 + i * 26, 309 - i * 44, d, { a: 'start', fs: 13 })).join('') + t(600, 24, '×1.024 mỗi bậc', { a: 'end', fs: 12, fill: C.gray }));
  },

  'cloud-flow': () => svg(700, 250,
    rect(20, 90, 140, 70, '#e8f1ff', { stroke: C.blue }) + t(90, 120, '💻 📱 Thiết bị', { fw: 600 }) + t(90, 140, 'của em', { fs: 12, fill: C.gray }) +
    `<path d="M250 150 q -40 0 -40 -35 q 0 -35 45 -32 q 10 -35 55 -30 q 40 -20 70 15 q 45 -5 45 40 q 0 42 -45 42 Z" fill="#f2f8ff" stroke="${C.blue}" stroke-width="1.5"/>` + t(318, 118, 'Internet', { fw: 700, fill: C.blue }) + t(318, 136, 'HTTPS (mã hoá)', { fs: 11, fill: C.gray }) +
    rect(470, 40, 210, 170, '#f5f5f7', { stroke: C.gray }) + t(575, 64, 'Trung tâm dữ liệu', { fw: 700 }) +
    [0, 1, 2].map((i) => rect(490 + i * 64, 80, 52, 90, '#1d1d1f', { rx: 5 }) + [0, 1, 2, 3, 4].map((k) => `<rect x="${496 + i * 64}" y="${88 + k * 16}" width="40" height="10" rx="2" fill="#3a3a3c"/><circle cx="${530 + i * 64}" cy="${93 + k * 16}" r="2" fill="${C.green}"/>`).join('')).join('') + t(575, 194, 'máy chủ · lưu trữ · sao lưu', { fs: 11, fill: C.gray }) +
    arrow(162, 118, 205, 118, C.blue) + arrow(430, 118, 466, 118, C.blue) + arrow(466, 140, 430, 140, C.green) + arrow(205, 140, 162, 140, C.green) + t(318, 225, 'Gửi yêu cầu → máy chủ xử lý → trả kết quả về thiết bị', { fs: 12, fill: C.gray })),

  'cloud-stack': () => {
    const layers = ['Ứng dụng', 'Dữ liệu', 'Môi trường chạy', 'Hệ điều hành', 'Máy ảo', 'Máy chủ · lưu trữ · mạng'];
    const cols = [['Tự quản lý', 6], ['IaaS', 4], ['PaaS', 2], ['SaaS', 0]];
    let b = '';
    cols.forEach(([n, you], ci) => { const x = 20 + ci * 170; b += t(x + 75, 22, n, { fw: 700 }); layers.forEach((l, li) => { const mine = li < you; b += rect(x, 34 + li * 36, 150, 30, mine ? '#e8f1ff' : '#eef8f0', { stroke: mine ? C.blue : C.green, sw: 1, rx: 6 }) + t(x + 75, 54 + li * 36, l, { fs: 12, fill: mine ? C.blue : '#1f8a3b' }); }); });
    b += rect(200, 260, 14, 14, '#e8f1ff', { stroke: C.blue, rx: 3 }) + t(220, 272, 'Em / nhà trường tự lo', { a: 'start', fs: 12 }) + rect(400, 260, 14, 14, '#eef8f0', { stroke: C.green, rx: 3 }) + t(420, 272, 'Nhà cung cấp đám mây lo', { a: 'start', fs: 12 });
    return svg(700, 285, b);
  },

  'browser-share': () => bars([['Chrome', 68.22], ['Safari', 16.47], ['Edge', 5.37], ['Firefox', 3.34], ['Samsung Internet', 2.06], ['Opera', 1.88]], { horiz: true, w: 600, h: 230, unit: '%', colors: [C.green, C.blue, C.teal, C.orange, C.indigo, C.red] }),

  'net-dns': () => svg(720, 230,
    rect(20, 80, 130, 60, '#e8f1ff', { stroke: C.blue }) + t(85, 108, 'Trình duyệt', { fw: 600 }) + t(85, 126, 'gõ vnexpress.net', { fs: 11, fill: C.gray }) +
    rect(290, 10, 150, 56, '#fff3e0', { stroke: C.orange }) + t(365, 34, 'Máy chủ DNS', { fw: 600 }) + t(365, 52, '“danh bạ” của Internet', { fs: 11, fill: C.gray }) +
    rect(560, 80, 140, 60, '#e9f8ee', { stroke: C.green }) + t(630, 108, 'Máy chủ web', { fw: 600 }) + t(630, 126, 'IP 111.65.250.2', { fs: 11, fill: C.gray }) +
    arrow(150, 90, 288, 46, C.orange) + t(200, 56, '① hỏi địa chỉ IP', { fs: 11, fill: C.orange }) + arrow(290, 60, 152, 104, C.orange) + t(250, 96, '② trả lời IP', { fs: 11, fill: C.orange }) +
    arrow(152, 124, 556, 124, C.blue) + t(354, 118, '③ gửi yêu cầu HTTPS', { fs: 11, fill: C.blue }) + arrow(556, 138, 152, 138, C.green) + t(354, 156, '④ trả về trang web (HTML, ảnh…)', { fs: 11, fill: C.green }) + t(360, 210, 'Địa chỉ IP trong hình chỉ là ví dụ minh hoạ', { fs: 11, fill: C.gray })),

  'reset-ladder': () => {
    const st = [['Khởi động lại', 'Tắt mở lại – sửa phần lớn lỗi tạm thời', 'Giữ nguyên mọi thứ', C.green], ['Đặt lại cài đặt', 'Đưa cài đặt (mạng, hiển thị…) về mặc định', 'Giữ tệp và ứng dụng', C.blue], ['Đặt lại máy, giữ tệp', 'Cài lại hệ điều hành', 'Mất ứng dụng, giữ tệp cá nhân', C.orange], ['Khôi phục cài đặt gốc', 'Xoá sạch, như máy mới mua', 'Mất TẤT CẢ dữ liệu', C.red]];
    return svg(700, 260, st.map(([n, d, k, col], i) => rect(20, 14 + i * 60, 660, 50, '#fff', { stroke: col, sw: 2 }) + rect(20, 14 + i * 60, 10, 50, col, { rx: 3 }) + t(44, 36 + i * 60, `${i + 1}. ${n}`, { a: 'start', fw: 700, fill: col }) + t(44, 54 + i * 60, d, { a: 'start', fs: 12, fill: C.gray }) + t(668, 46 + i * 60, k, { a: 'end', fs: 12, fw: 600 })).join(''));
  },

  'ai-nested': () => svg(520, 300,
    `<ellipse cx="260" cy="155" rx="245" ry="140" fill="#f2f2f7" stroke="${C.gray}"/>` + t(260, 38, 'Trí tuệ nhân tạo (AI)', { fw: 700 }) +
    `<ellipse cx="260" cy="170" rx="190" ry="110" fill="#e8f1ff" stroke="${C.blue}"/>` + t(260, 82, 'Học máy (Machine Learning)', { fw: 700, fill: C.blue }) +
    `<ellipse cx="260" cy="185" rx="135" ry="80" fill="#f3e8ff" stroke="${C.purple}"/>` + t(260, 125, 'Học sâu (Deep Learning)', { fw: 700, fill: C.purple }) +
    `<ellipse cx="260" cy="205" rx="85" ry="48" fill="#ffe8ee" stroke="${C.pink}"/>` + t(260, 200, 'AI tạo sinh', { fw: 700, fill: C.pink }) + t(260, 218, 'chatbot, tạo ảnh…', { fs: 11, fill: C.gray })),

  'cc-grid': () => {
    const L = [['CC BY', 1, 0, 0, 0], ['CC BY-SA', 1, 1, 0, 0], ['CC BY-NC', 1, 0, 1, 0], ['CC BY-NC-SA', 1, 1, 1, 0], ['CC BY-ND', 1, 0, 0, 1], ['CC BY-NC-ND', 1, 0, 1, 1]];
    const H = ['Ghi công (BY)', 'Chia sẻ tương tự (SA)', 'Phi thương mại (NC)', 'Không phái sinh (ND)'];
    let b = H.map((h, i) => t(230 + i * 125, 22, h, { fs: 12, fw: 700 })).join('');
    L.forEach((r, ri) => { const y = 36 + ri * 38; b += rect(10, y, 150, 30, ri % 2 ? '#f5f5f7' : '#fff', { rx: 6 }) + t(20, y + 20, r[0], { a: 'start', fw: 700 }); r.slice(1).forEach((v, i) => { b += v ? `<circle cx="${230 + i * 125}" cy="${y + 15}" r="10" fill="${[C.blue, C.green, C.orange, C.red][i]}"/>` + t(230 + i * 125, y + 20, '✓', { fill: '#fff', fw: 800 }) : t(230 + i * 125, y + 20, '–', { fill: '#bbb' }); }); });
    b += t(10, 280, 'Càng nhiều điều kiện, người khác càng ít quyền sử dụng tác phẩm. CC0 = từ bỏ quyền, dùng tự do.', { a: 'start', fs: 12, fill: C.gray });
    return svg(720, 290, b);
  },

  'twofa': () => svg(700, 170,
    rect(20, 40, 170, 80, '#e8f1ff', { stroke: C.blue }) + t(105, 72, '① Điều em BIẾT', { fw: 700, fill: C.blue }) + t(105, 94, 'mật khẩu', { fs: 12 }) +
    rect(265, 40, 170, 80, '#e9f8ee', { stroke: C.green }) + t(350, 72, '② Điều em CÓ', { fw: 700, fill: '#1f8a3b' }) + t(350, 94, 'mã trên điện thoại, khoá USB', { fs: 12 }) +
    rect(510, 40, 170, 80, '#fff3e0', { stroke: C.orange }) + t(595, 72, '③ Em LÀ AI', { fw: 700, fill: '#b35c00' }) + t(595, 94, 'vân tay, khuôn mặt', { fs: 12 }) +
    t(227, 86, '+', { fs: 28, fw: 700 }) + t(472, 86, '+', { fs: 28, fw: 700 }) + t(350, 155, 'Xác thực nhiều yếu tố = kết hợp ít nhất 2 loại khác nhau', { fs: 12, fill: C.gray })),

  'footprint': () => svg(640, 200,
    `<circle cx="320" cy="100" r="46" fill="${C.ink}"/>` + t(320, 96, 'Danh tính', { fill: '#fff', fw: 700 }) + t(320, 114, 'số của em', { fill: '#fff', fw: 700 }) +
    [['Tài khoản & hồ sơ', 120, 30], ['Bài đăng, bình luận', 520, 30], ['Ảnh được gắn thẻ', 90, 170], ['Lịch sử tìm kiếm', 540, 170], ['Dữ liệu vị trí', 320, 190]].map(([s, x, y]) => `<line x1="320" y1="100" x2="${x}" y2="${y - 6}" stroke="#ccc" stroke-dasharray="4 4"/>` + rect(x - 75, y - 20, 150, 28, '#fff', { stroke: C.blue, rx: 14 }) + t(x, y - 1, s, { fs: 12 })).join('')),
};

// biểu đồ minh hoạ trong bài "Các loại biểu đồ"
const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
FIGS['chart-column'] = () => bars([['Lớp 6A', 32], ['6B', 28], ['6C', 35], ['6D', 30]], { w: 360, h: 200, colors: [C.blue] });
FIGS['chart-bar'] = () => bars([['Bóng đá', 18], ['Cầu lông', 12], ['Bơi', 9], ['Cờ vua', 6]], { horiz: true, w: 360, h: 170, colors: [C.teal] });
FIGS['chart-line'] = () => { const v = [12, 15, 14, 19, 23, 27]; const px = (i) => 40 + i * 58, py = (x) => 170 - x * 5; return svg(360, 200, `<line x1="30" y1="170" x2="350" y2="170" stroke="#ccc"/>` + `<polyline points="${v.map((x, i) => px(i) + ',' + py(x)).join(' ')}" fill="none" stroke="${C.orange}" stroke-width="3"/>` + v.map((x, i) => `<circle cx="${px(i)}" cy="${py(x)}" r="4" fill="${C.orange}"/>` + t(px(i), 188, months[i], { fs: 11 })).join('') + t(200, 20, 'Nhiệt độ trung bình (°C)', { fs: 12, fill: C.gray })); };
FIGS['chart-pie'] = () => { const d = [[45, C.blue, 'Video'], [25, C.green, 'Mạng xã hội'], [18, C.orange, 'Học tập'], [12, C.purple, 'Khác']]; let a = -Math.PI / 2, b = ''; d.forEach(([p, col, l], i) => { const a2 = a + (p / 100) * Math.PI * 2; const big = a2 - a > Math.PI ? 1 : 0; b += `<path d="M100 100 L${100 + 80 * Math.cos(a)} ${100 + 80 * Math.sin(a)} A80 80 0 ${big} 1 ${100 + 80 * Math.cos(a2)} ${100 + 80 * Math.sin(a2)} Z" fill="${col}" stroke="#fff" stroke-width="2"/>`; b += rect(210, 40 + i * 30, 14, 14, col, { rx: 3 }) + t(230, 52 + i * 30, `${l} ${p}%`, { a: 'start', fs: 12 }); a = a2; }); return svg(360, 200, b); };
FIGS['chart-scatter'] = () => { const pts = [[1, 4], [2, 5.5], [2.5, 5], [3, 6.5], [4, 7], [4.5, 8], [5, 7.6], [6, 9], [1.5, 4.8], [3.5, 6], [5.5, 8.6]]; return svg(360, 200, `<line x1="40" y1="170" x2="340" y2="170" stroke="#ccc"/><line x1="40" y1="20" x2="40" y2="170" stroke="#ccc"/>` + pts.map(([x, y]) => `<circle cx="${40 + x * 48}" cy="${170 - y * 16}" r="5" fill="${C.indigo}" opacity=".8"/>`).join('') + t(190, 192, 'Số giờ tự học / tuần', { fs: 11, fill: C.gray }) + t(14, 95, 'Điểm', { fs: 11, fill: C.gray, extra: 'transform="rotate(-90 14 95)"' })); };
FIGS['chart-area'] = () => { const v = [5, 9, 7, 12, 15, 13]; const px = (i) => 40 + i * 58, py = (x) => 170 - x * 9; return svg(360, 200, `<path d="M${px(0)} 170 ${v.map((x, i) => 'L' + px(i) + ' ' + py(x)).join(' ')} L${px(5)} 170 Z" fill="${C.green}" opacity=".35"/><polyline points="${v.map((x, i) => px(i) + ',' + py(x)).join(' ')}" fill="none" stroke="${C.green}" stroke-width="2.5"/>` + months.map((m, i) => t(px(i), 188, m, { fs: 11 })).join('')); };
FIGS['chart-hist'] = () => bars([['0–2', 2], ['2–4', 5], ['4–6', 11], ['6–8', 14], ['8–10', 6]], { w: 360, h: 200, colors: [C.purple], gap: 0.98 });
FIGS['chart-combo'] = () => { const v = [30, 42, 38, 50, 61, 55], r = [10, 12, 9, 14, 18, 15]; const px = (i) => 55 + i * 50; let b = `<line x1="30" y1="170" x2="340" y2="170" stroke="#ccc"/>`; v.forEach((x, i) => (b += rect(px(i) - 15, 170 - x * 2.2, 30, x * 2.2, C.blue, { rx: 3 }))); b += `<polyline points="${r.map((x, i) => px(i) + ',' + (170 - x * 7)).join(' ')}" fill="none" stroke="${C.orange}" stroke-width="3"/>` + r.map((x, i) => `<circle cx="${px(i)}" cy="${170 - x * 7}" r="4" fill="${C.orange}"/>` + t(px(i), 188, months[i], { fs: 11 })).join(''); return svg(360, 200, b); };
FIGS['chart-gallery'] = () => `<div class="figgrid">${['column', 'bar', 'line', 'pie', 'scatter', 'area', 'hist', 'combo'].map((k) => `<div>${FIGS['chart-' + k]()}<span>${{ column: 'Cột', bar: 'Thanh ngang', line: 'Đường', pie: 'Tròn', scatter: 'Phân tán', area: 'Vùng', hist: 'Tần suất (histogram)', combo: 'Kết hợp cột + đường' }[k]}</span></div>`).join('')}</div>`;
