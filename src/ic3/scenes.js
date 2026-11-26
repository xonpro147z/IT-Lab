// Cảnh giao diện mô phỏng cho câu hỏi "bấm vào vùng trên hình" (tự vẽ, không dùng ảnh chụp thật)
// Mỗi cảnh: svg (viewBox 800x460) + các vùng bấm {id, x, y, w, h}
const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 13}" font-weight="${o.fw || 500}" fill="${o.fill || '#1d1d1f'}" text-anchor="${o.a || 'start'}" font-family="Segoe UI, Inter, system-ui, sans-serif">${s}</text>`;
const R = (x, y, w, h, f, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 6}" fill="${f}" ${o.st ? `stroke="${o.st}"` : ''}/>`;
const svg = (b) => `<svg viewBox="0 0 800 460" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;

export const SCENES = {
  desktop: {
    svg: svg(`<defs><linearGradient id="wp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a7bd5"/><stop offset="1" stop-color="#6dd5ed"/></linearGradient></defs>
      ${R(0, 0, 800, 460, 'url(#wp)', { rx: 0 })}
      ${[['🗑️', 'Thùng rác', 24], ['📁', 'Bài tập', 104], ['🌐', 'Trình duyệt', 184], ['📝', 'Ghi chú.txt', 264]].map(([i, l, y]) => T(46, y + 28, i, { fs: 30, a: 'middle' }) + T(46, y + 54, l, { fs: 11, fill: '#fff', a: 'middle' })).join('')}
      ${R(0, 412, 800, 48, 'rgba(240,243,250,.92)', { rx: 0 })}
      ${R(10, 420, 34, 32, '#fff')}${T(27, 443, '⊞', { fs: 20, a: 'middle', fill: '#0067c0', fw: 700 })}
      ${R(52, 422, 200, 28, '#fff', { rx: 14 })}${T(66, 441, '🔍  Tìm kiếm', { fs: 12, fill: '#666' })}
      ${T(282, 445, '📁', { fs: 22, a: 'middle' })}${T(322, 445, '🌐', { fs: 22, a: 'middle' })}${T(362, 445, '✉️', { fs: 22, a: 'middle' })}
      ${T(640, 442, '📶', { fs: 16, a: 'middle' })}${T(672, 442, '🔊', { fs: 16, a: 'middle' })}${T(704, 442, '🔋', { fs: 16, a: 'middle' })}
      ${T(760, 434, '9:41', { fs: 11, a: 'middle' })}${T(760, 449, '26/11/2026', { fs: 10, a: 'middle' })}`),
    regions: [
      { id: 'recycle', x: 14, y: 20, w: 64, h: 66 }, { id: 'folder', x: 14, y: 100, w: 64, h: 66 }, { id: 'browserIcon', x: 14, y: 180, w: 64, h: 66 }, { id: 'notes', x: 14, y: 260, w: 64, h: 66 },
      { id: 'start', x: 8, y: 418, w: 38, h: 36 }, { id: 'search', x: 52, y: 420, w: 200, h: 32 }, { id: 'explorer', x: 268, y: 418, w: 30, h: 36 }, { id: 'browser', x: 308, y: 418, w: 30, h: 36 }, { id: 'mail', x: 348, y: 418, w: 30, h: 36 },
      { id: 'wifi', x: 626, y: 420, w: 28, h: 32 }, { id: 'volume', x: 658, y: 420, w: 28, h: 32 }, { id: 'battery', x: 690, y: 420, w: 28, h: 32 }, { id: 'clock', x: 730, y: 418, w: 62, h: 36 },
    ],
  },
  browser: {
    svg: svg(`${R(0, 0, 800, 460, '#e9ecf2', { rx: 0 })}
      ${R(10, 8, 200, 30, '#fff', { rx: 8 })}${T(22, 28, '📘 Bách khoa Tin học', { fs: 12 })}${T(196, 28, '✕', { fs: 11, fill: '#888' })}
      ${R(214, 8, 170, 30, '#dde1e8', { rx: 8 })}${T(226, 28, '🔎 Tìm kiếm', { fs: 12, fill: '#555' })}
      ${T(400, 30, '+', { fs: 22, a: 'middle', fill: '#555' })}
      ${R(0, 44, 800, 44, '#fff', { rx: 0 })}
      ${T(22, 72, '←', { fs: 18, fill: '#555' })}${T(52, 72, '→', { fs: 18, fill: '#bbb' })}${T(82, 73, '⟳', { fs: 18, fill: '#555' })}
      ${R(112, 52, 520, 28, '#f1f3f4', { rx: 14 })}${T(128, 71, '🔒', { fs: 13 })}${T(150, 71, 'https://tinhoclab.edu.vn/bach-khoa', { fs: 13, fill: '#333' })}${T(610, 72, '☆', { fs: 16, a: 'middle', fill: '#555' })}
      ${T(660, 72, '⬇', { fs: 16, a: 'middle', fill: '#555' })}${T(700, 72, '🧩', { fs: 15, a: 'middle' })}${T(740, 72, '👤', { fs: 15, a: 'middle' })}${T(776, 72, '⋮', { fs: 20, a: 'middle', fill: '#555' })}
      ${R(0, 88, 800, 372, '#fff', { rx: 0 })}${R(40, 120, 320, 24, '#1d1d1f', { rx: 4 })}${[0, 1, 2, 3].map((i) => R(40, 166 + i * 22, 680 - i * 60, 10, '#e5e5ea', { rx: 5 })).join('')}
      ${R(40, 270, 210, 140, '#64d2ff', { rx: 12 })}${R(270, 270, 210, 140, '#ffd60a', { rx: 12 })}${R(500, 270, 210, 140, '#30d158', { rx: 12 })}`),
    regions: [
      { id: 'tab', x: 10, y: 8, w: 200, h: 30 }, { id: 'newtab', x: 388, y: 10, w: 26, h: 28 }, { id: 'back', x: 14, y: 54, w: 28, h: 26 }, { id: 'forward', x: 44, y: 54, w: 28, h: 26 }, { id: 'reload', x: 74, y: 54, w: 28, h: 26 },
      { id: 'lock', x: 120, y: 54, w: 26, h: 24 }, { id: 'address', x: 148, y: 52, w: 440, h: 28 }, { id: 'bookmark', x: 596, y: 54, w: 28, h: 24 }, { id: 'downloads', x: 646, y: 54, w: 28, h: 26 },
      { id: 'extensions', x: 686, y: 54, w: 28, h: 26 }, { id: 'profile', x: 726, y: 54, w: 28, h: 26 }, { id: 'menu', x: 762, y: 52, w: 30, h: 30 },
    ],
  },
  docs: {
    svg: svg(`${R(0, 0, 800, 460, '#f8f9fa', { rx: 0 })}
      ${T(20, 30, '📄', { fs: 22 })}${T(52, 26, 'Bài thuyết trình nhóm 3', { fs: 15, fw: 600 })}${T(52, 44, 'Tệp   Chỉnh sửa   Xem   Chèn   Định dạng   Công cụ', { fs: 11, fill: '#555' })}
      ${R(640, 14, 96, 32, '#c2e7ff', { rx: 16 })}${T(688, 35, '🔗 Chia sẻ', { fs: 13, a: 'middle', fw: 600, fill: '#0b57d0' })}${T(764, 36, '💬', { fs: 18, a: 'middle' })}
      ${R(14, 56, 772, 38, '#edf2fa', { rx: 19 })}
      ${T(36, 81, '↶', { fs: 17, a: 'middle' })}${T(64, 81, '↷', { fs: 17, a: 'middle' })}${T(96, 81, '🖨', { fs: 15, a: 'middle' })}
      ${R(122, 63, 86, 24, '#fff', { rx: 4 })}${T(130, 80, 'Arial  ▾', { fs: 12 })}${R(214, 63, 44, 24, '#fff', { rx: 4 })}${T(236, 80, '12', { fs: 12, a: 'middle' })}
      ${T(282, 81, 'B', { fs: 16, fw: 800, a: 'middle' })}${T(310, 81, 'I', { fs: 16, a: 'middle', ex: '' })}${T(336, 81, 'U', { fs: 16, a: 'middle' })}${T(364, 81, 'A', { fs: 16, a: 'middle', fill: '#d93025', fw: 700 })}
      ${T(400, 81, '🔗', { fs: 15, a: 'middle' })}${T(430, 81, '🖼', { fs: 15, a: 'middle' })}
      ${T(470, 81, '≡', { fs: 18, a: 'middle' })}${T(498, 81, '☰', { fs: 15, a: 'middle' })}${T(530, 81, '• ≡', { fs: 14, a: 'middle' })}${T(566, 81, '1. ≡', { fs: 13, a: 'middle' })}
      ${R(160, 110, 480, 340, '#fff', { rx: 2 })}${R(200, 150, 260, 18, '#1d1d1f', { rx: 3 })}${[0, 1, 2, 3, 4, 5, 6].map((i) => R(200, 190 + i * 24, 400 - (i % 3) * 50, 9, '#dadce0', { rx: 4 })).join('')}`),
    regions: [
      { id: 'share', x: 640, y: 14, w: 96, h: 32 }, { id: 'comment', x: 748, y: 16, w: 32, h: 30 }, { id: 'undo', x: 24, y: 62, w: 26, h: 26 }, { id: 'redo', x: 52, y: 62, w: 26, h: 26 }, { id: 'print', x: 84, y: 62, w: 26, h: 26 },
      { id: 'font', x: 122, y: 63, w: 86, h: 24 }, { id: 'size', x: 214, y: 63, w: 44, h: 24 }, { id: 'bold', x: 270, y: 62, w: 24, h: 26 }, { id: 'italic', x: 298, y: 62, w: 24, h: 26 }, { id: 'underline', x: 324, y: 62, w: 24, h: 26 },
      { id: 'color', x: 352, y: 62, w: 24, h: 26 }, { id: 'link', x: 388, y: 62, w: 26, h: 26 }, { id: 'image', x: 418, y: 62, w: 26, h: 26 }, { id: 'align', x: 456, y: 62, w: 28, h: 26 }, { id: 'bullets', x: 516, y: 62, w: 30, h: 26 }, { id: 'numbering', x: 550, y: 62, w: 34, h: 26 },
      { id: 'filemenu', x: 50, y: 34, w: 30, h: 14 },
    ],
  },
  email: {
    svg: svg(`${R(0, 0, 800, 460, '#eef2f7', { rx: 0 })}${R(120, 20, 560, 420, '#fff', { rx: 14 })}
      ${R(120, 20, 560, 40, '#404b5a', { rx: 14 })}${R(120, 44, 560, 16, '#404b5a', { rx: 0 })}${T(140, 46, 'Thư mới', { fs: 14, fill: '#fff', fw: 600 })}${T(650, 46, '— ⤢ ✕', { fs: 13, fill: '#fff', a: 'end' })}
      ${T(140, 88, 'Đến', { fs: 13, fill: '#666' })}${T(190, 88, 'co.lan@truong.edu.vn', { fs: 13 })}${T(610, 88, 'Cc', { fs: 13, fill: '#666' })}${T(645, 88, 'Bcc', { fs: 13, fill: '#666' })}
      <line x1="136" y1="100" x2="664" y2="100" stroke="#e5e5ea"/>
      ${T(140, 126, 'Lớp 7A – Nộp bài tập Tin học tuần 5', { fs: 13 })}<line x1="136" y1="138" x2="664" y2="138" stroke="#e5e5ea"/>
      ${T(140, 170, 'Em chào cô ạ,', { fs: 13 })}${T(140, 194, 'Em gửi cô bài tập trong tệp đính kèm.', { fs: 13 })}
      ${R(140, 330, 210, 34, '#f1f3f4', { rx: 8 })}${T(152, 352, '📎 BaiTap_Tuan5.docx (24 KB)', { fs: 12 })}
      ${R(140, 390, 86, 36, '#0b57d0', { rx: 18 })}${T(183, 413, 'Gửi', { fs: 14, fill: '#fff', fw: 600, a: 'middle' })}
      ${T(250, 414, 'A', { fs: 16, fw: 700, fill: '#555', a: 'middle' })}${T(282, 414, '📎', { fs: 16, a: 'middle' })}${T(312, 414, '🔗', { fs: 16, a: 'middle' })}${T(342, 414, '🙂', { fs: 16, a: 'middle' })}${T(372, 414, '🖼', { fs: 16, a: 'middle' })}${T(650, 414, '🗑', { fs: 16, a: 'middle' })}`),
    regions: [
      { id: 'to', x: 136, y: 72, w: 80, h: 24 }, { id: 'cc', x: 602, y: 72, w: 32, h: 24 }, { id: 'bcc', x: 638, y: 72, w: 34, h: 24 }, { id: 'subject', x: 136, y: 106, w: 520, h: 28 }, { id: 'attachment', x: 140, y: 330, w: 210, h: 34 },
      { id: 'send', x: 140, y: 390, w: 86, h: 36 }, { id: 'format', x: 236, y: 396, w: 28, h: 26 }, { id: 'attach', x: 268, y: 396, w: 28, h: 26 }, { id: 'link', x: 298, y: 396, w: 28, h: 26 }, { id: 'emoji', x: 328, y: 396, w: 28, h: 26 }, { id: 'photo', x: 358, y: 396, w: 28, h: 26 }, { id: 'discard', x: 636, y: 396, w: 28, h: 26 },
    ],
  },
  drive: {
    svg: svg(`${R(0, 0, 800, 460, '#f8fafd', { rx: 0 })}${T(24, 38, '☁️ Ổ đĩa', { fs: 18, fw: 600 })}
      ${R(240, 16, 420, 36, '#e9eef6', { rx: 18 })}${T(262, 39, '🔍 Tìm trong Ổ đĩa', { fs: 13, fill: '#555' })}${T(740, 40, '⚙️', { fs: 18, a: 'middle' })}
      ${R(20, 66, 110, 48, '#fff', { rx: 16 })}${T(75, 96, '＋ Mới', { fs: 15, fw: 600, a: 'middle' })}
      ${[['🏠 Trang chủ', 140], ['📂 Ổ đĩa của tôi', 172], ['👥 Được chia sẻ với tôi', 204], ['🕘 Gần đây', 236], ['⭐ Có gắn dấu sao', 268], ['🗑 Thùng rác', 300]].map(([s, y]) => T(30, y, s, { fs: 13 })).join('')}
      ${R(26, 360, 170, 6, '#e5e5ea', { rx: 3 })}${R(26, 360, 120, 6, '#1a73e8', { rx: 3 })}${T(26, 388, 'Đã dùng 10,8 GB / 15 GB', { fs: 11, fill: '#555' })}
      ${R(220, 66, 560, 380, '#fff', { rx: 16 })}${T(240, 98, 'Ổ đĩa của tôi  ›  Lớp 7A', { fs: 16, fw: 600 })}
      ${[['📁 Bài tập nhóm', 0], ['📄 Bai_thuyet_trinh.pptx', 1], ['📊 Diem_kiem_tra.xlsx', 2], ['📝 Ghi_chu.docx', 3]].map(([s, i]) => R(236, 120 + i * 50, 528, 42, i === 1 ? '#e8f0fe' : '#fff', { rx: 8 }) + T(250, 146 + i * 50, s, { fs: 13 }) + T(700, 147 + i * 50, '👤＋', { fs: 14, a: 'middle', fill: '#555' }) + T(736, 147 + i * 50, '⋮', { fs: 16, a: 'middle', fill: '#555' })).join('')}`),
    regions: [
      { id: 'new', x: 20, y: 66, w: 110, h: 48 }, { id: 'mydrive', x: 24, y: 158, w: 150, h: 22 }, { id: 'shared', x: 24, y: 190, w: 180, h: 22 }, { id: 'recent', x: 24, y: 222, w: 120, h: 22 }, { id: 'starred', x: 24, y: 254, w: 150, h: 22 }, { id: 'trash', x: 24, y: 286, w: 120, h: 22 },
      { id: 'storage', x: 20, y: 352, w: 190, h: 44 }, { id: 'search', x: 240, y: 16, w: 420, h: 36 }, { id: 'settings', x: 724, y: 20, w: 32, h: 30 },
      { id: 'shareFile', x: 684, y: 172, w: 34, h: 30 }, { id: 'moreFile', x: 724, y: 172, w: 26, h: 30 }, { id: 'folder', x: 236, y: 120, w: 440, h: 42 },
    ],
  },
  phone: {
    svg: svg(`${R(0, 0, 800, 460, '#dfe6ee', { rx: 0 })}${R(290, 10, 220, 440, '#111', { rx: 32 })}${R(300, 22, 200, 416, '#f2f2f7', { rx: 24 })}
      ${T(400, 60, 'Cài đặt', { fs: 18, fw: 700, a: 'middle' })}
      ${[['✈️', 'Chế độ máy bay', 'off'], ['📶', 'Wi-Fi', 'Nha_An_5G'], ['🔵', 'Bluetooth', 'on'], ['📍', 'Vị trí', 'on'], ['🔔', 'Thông báo', ''], ['🔒', 'Màn hình khoá', ''], ['🔄', 'Cập nhật phần mềm', ''], ['🔋', 'Pin', '']].map(([i, l, v], k) => R(310, 80 + k * 42, 180, 38, '#fff', { rx: 8 }) + T(322, 105 + k * 42, i, { fs: 14 }) + T(344, 104 + k * 42, l, { fs: 11.5 }) + (v === 'on' || v === 'off' ? R(452, 90 + k * 42, 30, 18, v === 'on' ? '#34c759' : '#d1d1d6', { rx: 9 }) + `<circle cx="${v === 'on' ? 473 : 461}" cy="${99 + k * 42}" r="7" fill="#fff"/>` : T(482, 104 + k * 42, v ? v.slice(0, 9) + ' ›' : '›', { fs: 10, a: 'end', fill: '#888' }))).join('')}`),
    regions: [
      { id: 'airplane', x: 310, y: 80, w: 180, h: 38 }, { id: 'wifi', x: 310, y: 122, w: 180, h: 38 }, { id: 'bluetooth', x: 310, y: 164, w: 180, h: 38 }, { id: 'location', x: 310, y: 206, w: 180, h: 38 },
      { id: 'notifications', x: 310, y: 248, w: 180, h: 38 }, { id: 'lockscreen', x: 310, y: 290, w: 180, h: 38 }, { id: 'update', x: 310, y: 332, w: 180, h: 38 }, { id: 'battery', x: 310, y: 374, w: 180, h: 38 },
    ],
  },
};
