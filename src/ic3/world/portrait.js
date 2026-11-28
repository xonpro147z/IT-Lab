// Ảnh đại diện 2D (SVG) vẽ từ bộ đồ của nhân vật – dùng cho danh sách người chơi, trang giáo viên
const SKIN = '#f6c9a0';
export function portrait(look = {}, size = 44) {
  const s = look.skin || SKIN, h = look.hairColor || '#1b1b1f', top = look.top === 'uniform' ? '#ffffff' : look.top === 'astro' ? '#eceff1' : (look.topColor || '#1e88e5');
  const hat = look.hat || 'none', hc = look.hatColor || '#e53935', hair = look.hair || 'short';
  const p = [];
  p.push(`<rect x="10" y="40" width="28" height="12" rx="2" fill="${top}" stroke="rgba(0,0,0,.15)"/>`);
  if (look.top === 'uniform') p.push('<path d="M20 40l4 6 4-6" fill="#e53935"/>');
  // tóc phía sau
  if (['long', 'bob'].includes(hair) && !['nonla', 'wizard', 'beanie'].includes(hat)) p.push(`<rect x="9" y="12" width="30" height="${hair === 'long' ? 30 : 24}" rx="2" fill="${h}"/>`);
  p.push(`<rect x="11" y="12" width="26" height="26" rx="3" fill="${s}"/>`);
  // tóc
  if (!['nonla', 'wizard', 'beanie', 'crown'].includes(hat)) {
    if (hair === 'short' || hair === 'side' || hair === 'pony' || hair === 'buns' || hair === 'bob' || hair === 'long') p.push(`<rect x="10" y="9" width="28" height="8" rx="2" fill="${h}"/>`);
    if (hair === 'side') p.push(`<rect x="10" y="15" width="14" height="4" fill="${h}"/>`);
    if (hair === 'spiky') p.push(`<path d="M10 17l3-9 4 6 4-8 4 8 4-8 4 7 3-6v10z" fill="${h}"/>`);
    if (hair === 'buns') p.push(`<rect x="7" y="4" width="9" height="9" rx="2" fill="${h}"/><rect x="32" y="4" width="9" height="9" rx="2" fill="${h}"/>`);
    if (hair === 'curly') p.push(`<circle cx="14" cy="11" r="6" fill="${h}"/><circle cx="24" cy="8" r="7" fill="${h}"/><circle cx="34" cy="11" r="6" fill="${h}"/>`);
    if (hair === 'mohawk') p.push(`<rect x="21" y="3" width="6" height="11" fill="${h}"/>`);
  }
  // mặt
  const f = look.face || 'smile';
  if (f === 'cool') p.push('<rect x="14" y="21" width="9" height="5" fill="#111"/><rect x="25" y="21" width="9" height="5" fill="#111"/><rect x="22" y="22" width="4" height="2" fill="#111"/>');
  else if (f === 'star') p.push('<text x="18.5" y="27" font-size="8" text-anchor="middle" fill="#ffb300">★</text><text x="29.5" y="27" font-size="8" text-anchor="middle" fill="#ffb300">★</text>');
  else if (f === 'wink') p.push('<circle cx="19" cy="24" r="2" fill="#1d1d1f"/><path d="M27 25q2.5-3 5 0" stroke="#1d1d1f" stroke-width="1.6" fill="none"/>');
  else p.push('<circle cx="19" cy="24" r="2" fill="#1d1d1f"/><circle cx="29" cy="24" r="2" fill="#1d1d1f"/>');
  if (f === 'wow') p.push('<ellipse cx="24" cy="32" rx="2" ry="2.6" fill="#1d1d1f"/>');
  else if (f === 'grin') p.push('<path d="M18 30q6 7 12 0z" fill="#1d1d1f"/>');
  else if (f === 'focus' || f === 'cool') p.push('<path d="M20 32h8" stroke="#1d1d1f" stroke-width="1.6"/>');
  else p.push('<path d="M19 30q5 5 10 0" stroke="#1d1d1f" stroke-width="1.6" fill="none"/>');
  if (look.acc === 'glasses') p.push('<rect x="14" y="20" width="9" height="7" fill="none" stroke="#1d1d1f" stroke-width="1.2"/><rect x="25" y="20" width="9" height="7" fill="none" stroke="#1d1d1f" stroke-width="1.2"/>');
  if (look.acc === 'shades') p.push('<rect x="13" y="21" width="22" height="5" rx="1" fill="#111"/>');
  // mũ
  if (hat === 'cap') p.push(`<rect x="10" y="7" width="28" height="8" rx="2" fill="${hc}"/><rect x="22" y="13" width="18" height="3" fill="${hc}"/>`);
  if (hat === 'beanie') p.push(`<rect x="9" y="6" width="30" height="12" rx="3" fill="${hc}"/><circle cx="24" cy="5" r="3" fill="#fff"/>`);
  if (hat === 'nonla') p.push('<path d="M2 16L24 2l22 14z" fill="#e9d59a" stroke="#b89b53"/>');
  if (hat === 'wizard') p.push(`<path d="M8 14L26 -2 40 14z" fill="${hc}"/><rect x="5" y="12" width="38" height="4" rx="2" fill="${hc}"/>`);
  if (hat === 'crown') p.push('<path d="M11 14V5l5 5 4-7 4 7 4-7 4 7 5-5v9z" fill="#ffcc00" stroke="#c99a00"/>');
  if (hat === 'phones') p.push(`<path d="M9 22V14a15 13 0 0 1 30 0v8" stroke="${hc}" stroke-width="3" fill="none"/><rect x="6" y="18" width="6" height="9" rx="2" fill="${hc}"/><rect x="36" y="18" width="6" height="9" rx="2" fill="${hc}"/>`);
  if (hat === 'bunny') p.push('<rect x="15" y="-6" width="6" height="17" rx="3" fill="#fff" stroke="#ddd"/><rect x="27" y="-6" width="6" height="17" rx="3" fill="#fff" stroke="#ddd"/>');
  if (hat === 'flower') p.push(`<circle cx="33" cy="14" r="4" fill="${hc}"/><circle cx="33" cy="14" r="1.6" fill="#ffd400"/>`);
  if (look.acc === 'halo') p.push('<ellipse cx="24" cy="3" rx="10" ry="2.5" fill="none" stroke="#ffcc00" stroke-width="2"/>');
  return `<svg viewBox="0 -6 48 58" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${p.join('')}</svg>`;
}

// Biểu tượng cho từng món đồ trong Tủ đồ (áo, hình in, quần, giày, phụ kiện)
export function itemIcon(cat, id, L = {}, size = 58) {
  const svg = (inner) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const tc = L.topColor || '#1e88e5', bc = L.bottomColor || '#3c4a6b', sc = L.shoeColor || '#ffffff';
  const shirt = (fill, extra = '') => `<path d="M14 8l-9 6 4 8 5-3v23h20V19l5 3 4-8-9-6c-2 3-5 4-10 4s-8-1-10-4z" fill="${fill}" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/>${extra}`;
  if (cat === 'top') {
    const T = {
      tee: shirt(tc), uniform: shirt('#ffffff', '<path d="M18 8l6 8 6-8" fill="#e53935"/><path d="M23 15l-2 9 3-2 3 2-2-9z" fill="#e53935"/>'),
      hoodie: shirt(tc, `<path d="M17 8q7 9 14 0" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="2"/><rect x="17" y="30" width="14" height="6" rx="2" fill="rgba(0,0,0,.15)"/>`),
      jacket: shirt(tc, '<rect x="21" y="10" width="6" height="32" fill="#f4f4f4"/>'),
      jersey: shirt(tc, '<text x="24" y="33" font-size="11" font-weight="800" text-anchor="middle" fill="rgba(255,255,255,.9)" stroke="rgba(0,0,0,.3)" stroke-width=".4">10</text>'),
      aodai: `<path d="M16 6l-8 6 3 7 5-3v28h16V16l5 3 3-7-8-6c-2 2-4 3-8 3s-6-1-8-3z" fill="${tc}" stroke="rgba(0,0,0,.25)"/><circle cx="20" cy="24" r="1.6" fill="#ffd400"/><circle cx="26" cy="29" r="1.6" fill="#ffd400"/><circle cx="22" cy="34" r="1.6" fill="#ffd400"/>`,
      suit: shirt(tc, '<path d="M18 8l6 14 6-14z" fill="#fff"/><path d="M23 10h2l1 10-2 3-2-3z" fill="#c62828"/>'),
      astro: shirt('#eceff1', '<rect x="18" y="20" width="12" height="8" fill="#1e88e5"/><rect x="19.5" y="22" width="3" height="2" fill="#e53935"/><rect x="24" y="22" width="3" height="2" fill="#ffd400"/>'),
    };
    return svg(T[id] || shirt(tc));
  }
  if (cat === 'print') {
    const P = { none: '', ic3: '<text x="24" y="31" font-size="9" font-weight="800" text-anchor="middle" fill="#1d1d1f">IC3</text>', star: '<text x="24" y="33" font-size="13" text-anchor="middle" fill="#ffd400">★</text>', heart: '<text x="24" y="33" font-size="12" text-anchor="middle" fill="#ff3b6b">♥</text>', bolt: '<path d="M26 18l-6 9h4l-2 8 7-11h-4z" fill="#ffd400"/>', stripe: '<g fill="rgba(0,0,0,.22)"><rect x="14" y="21" width="20" height="3"/><rect x="14" y="27" width="20" height="3"/><rect x="14" y="33" width="20" height="3"/></g>', pixel: '<g><rect x="19" y="22" width="4" height="4" fill="#e53935"/><rect x="23" y="22" width="4" height="4" fill="#ffd400"/><rect x="19" y="26" width="4" height="4" fill="#43a047"/><rect x="23" y="26" width="4" height="4" fill="#1e88e5"/></g>', cat: '<text x="24" y="33" font-size="12" text-anchor="middle">🐱</text>', code: '<text x="24" y="31" font-size="8" font-weight="800" text-anchor="middle" fill="#1d1d1f" font-family="monospace">&lt;/&gt;</text>' };
    const base = L.top === 'uniform' || L.top === 'suit' || L.top === 'astro' ? '#ffffff' : tc;
    return svg(shirt(base, P[id] || ''));
  }
  if (cat === 'bottom') {
    const B = {
      pants: `<path d="M14 6h20l2 38h-9l-3-26-3 26h-9z" fill="${bc}" stroke="rgba(0,0,0,.25)"/>`,
      jeans: `<path d="M14 6h20l2 38h-9l-3-26-3 26h-9z" fill="${bc === '#1d1d1f' ? '#2b3550' : bc}" stroke="rgba(0,0,0,.25)"/><path d="M15 10h18" stroke="rgba(255,255,255,.5)" stroke-dasharray="2 2"/>`,
      shorts: `<path d="M13 10h22l2 20h-10l-3-10-3 10h-10z" fill="${bc}" stroke="rgba(0,0,0,.25)"/>`,
      skirt: `<path d="M16 10h16l7 24H9z" fill="${bc}" stroke="rgba(0,0,0,.25)"/>`,
    };
    return svg(B[id] || B.pants);
  }
  if (cat === 'shoes') {
    const S = {
      sneaker: `<path d="M8 30h16l4-6h6l6 8v6H8z" fill="${sc}" stroke="rgba(0,0,0,.3)"/><rect x="8" y="36" width="32" height="3" fill="#333"/>`,
      boot: `<path d="M12 12h12v18l12 3v6H12z" fill="${sc}" stroke="rgba(0,0,0,.3)"/><rect x="12" y="37" width="24" height="3" fill="#333"/>`,
      sandal: `<rect x="8" y="34" width="32" height="4" rx="2" fill="#333"/><path d="M14 34l6-8 6 8" fill="none" stroke="${sc}" stroke-width="3"/>`,
    };
    return svg(S[id] || S.sneaker);
  }
  if (cat === 'acc') {
    const A = { none: '✖️', glasses: '👓', shades: '🕶️', bag: '🎒', scarf: '🧣', cape: '🦸', wings: '🪽', halo: '😇' };
    return svg(`<text x="24" y="33" font-size="24" text-anchor="middle">${A[id] || '❔'}</text>`);
  }
  return portrait({ ...L, [cat]: id }, size);
}
