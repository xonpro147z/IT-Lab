// Bộ biểu tượng SVG tự vẽ theo phong cách Fluent (viewBox 24×24)
const ICONS = (() => {
  const D = '#424242', B = '#0f6cbd', L = '#9fc5f0', G = '#107c41', R = '#c43e1c', Y = '#f2c200', W = '#ffffff', GR = '#8a8886';
  const s = (d, c = D, w = 1.5) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const f = (d, c = D) => `<path d="${d}" fill="${c}"/>`;
  const r = (x, y, w, h, c = D, rx = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}"/>`;
  const ro = (x, y, w, h, c = D, rx = 1.5, fill = 'none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${c}" stroke-width="1.5"/>`;
  const t = (x, y, txt, c = D, size = 9, weight = 700, fam = 'Segoe UI, Arial') => `<text x="${x}" y="${y}" fill="${c}" font-size="${size}" font-weight="${weight}" font-family="${fam}" text-anchor="middle">${txt}</text>`;
  const lines = (x, y0, n, w, gap = 4, c = D) => Array.from({ length: n }, (_, i) => s(`M${x} ${y0 + i * gap}h${Array.isArray(w) ? w[i] : w}`, c)).join('');
  const page = (c = D) => s('M6 3h8l4 4v14H6z M14 3v4h4', c);
  return {
    paste: ro(5, 5, 14, 16, D, 2) + r(9, 3, 6, 4, B, 1) + r(8, 10, 8, 1.6, GR) + r(8, 14, 6, 1.6, GR),
    cut: s('M7 4l10 12 M17 4L7 16') + `<circle cx="7" cy="18" r="2.6" fill="none" stroke="${B}" stroke-width="1.6"/><circle cx="17" cy="18" r="2.6" fill="none" stroke="${B}" stroke-width="1.6"/>`,
    copy: ro(8, 7, 11, 14, D, 2) + s('M5 17V5a2 2 0 0 1 2-2h9', D),
    painter: r(4, 3, 14, 6, Y, 2) + s('M18 6h2v5h-8v4', D) + r(10.5, 15, 3, 7, B, 1),
    bold: t(12, 18, 'B', D, 17, 800), italic: t(12, 18, 'I', D, 17, 400, 'Georgia, serif').replace('<text', '<text font-style="italic"'), underline: t(12, 16, 'U', D, 15, 500) + s('M6 20h12'),
    strike: t(12, 17, 'ab', D, 12, 500) + s('M4 12.5h16', R), sub: t(9, 16, 'x', D, 14, 500) + t(18, 21, '2', B, 9), sup: t(9, 19, 'x', D, 14, 500) + t(18, 10, '2', B, 9),
    grow: t(10, 18, 'A', D, 16, 600) + f('M17 7l3 4h-6z', D), shrink: t(10, 18, 'A', D, 13, 600) + f('M14 8l3 4 3-4z', D),
    case: t(12, 17, 'Aa', D, 13, 600), clearfmt: t(10, 17, 'A', D, 15, 600) + s('M15 13l6 6 M21 13l-6 6', R),
    color: t(12, 15, 'A', D, 15, 700), hilite: s('M6 15l7-9 4 3-7 9z', D) + r(4, 17, 6, 2, Y, 0),
    bullets: `<circle cx="5" cy="6" r="1.6" fill="${B}"/><circle cx="5" cy="12" r="1.6" fill="${B}"/><circle cx="5" cy="18" r="1.6" fill="${B}"/>` + lines(9, 6, 3, 11, 6),
    numbering: t(5, 8, '1', B, 7) + t(5, 14, '2', B, 7) + t(5, 20, '3', B, 7) + lines(9, 6, 3, 11, 6),
    outdent: lines(4, 5, 4, 16, 4.6) + f('M9 9.5l-4 2.5 4 2.5z', B), indent: lines(4, 5, 4, 16, 4.6) + f('M5 9.5l4 2.5-4 2.5z', B),
    alignL: lines(4, 6, 4, [16, 10, 16, 10]), alignC: lines(4, 6, 4, [16, 10, 16, 10]).replace(/M4 (10|18)h10/g, (m, y) => `M7 ${y}h10`),
    alignR: lines(4, 6, 4, [16, 10, 16, 10]).replace(/M4 (10|18)h10/g, (m, y) => `M10 ${y}h10`), justify: lines(4, 6, 4, 16),
    spacing: lines(10, 6, 3, 10, 6) + s('M5 4v16 M3 6l2-2 2 2 M3 18l2 2 2-2', B), shading: s('M5 12l6-7 7 7-6 7z') + f('M18 14c0 2 1.5 3 1.5 4.5a1.5 1.5 0 0 1-3 0c0-1.5 1.5-2.5 1.5-4.5z', B) + r(3, 20, 18, 2, Y, 0),
    borders: ro(4, 4, 16, 16, GR, 0) + s('M4 12h16 M12 4v16', GR, 1) + s('M4 20h16', D, 2),
    find: `<circle cx="10" cy="10" r="5.5" fill="none" stroke="${D}" stroke-width="1.6"/>` + s('M14 14l6 6', D, 2), replace: t(7, 10, 'ab', D, 8) + t(16, 21, 'ac', B, 8) + s('M15 4h3v4 M9 20H6v-4', D), select: ro(4, 4, 16, 16, D, 1).replace('stroke-width="1.5"', 'stroke-width="1.5" stroke-dasharray="3 2"') + f('M10 9l8 4-3.5 1 2 4-1.6.8-2-4L10 17z', D),
    table: ro(3, 4, 18, 16, D, 1) + r(3, 4, 18, 4, B, 1) + s('M3 12h18 M3 16h18 M9 4v16 M15 4v16', D, 1),
    picture: ro(3, 5, 18, 14, D, 1.5) + `<circle cx="9" cy="10" r="2" fill="${Y}"/>` + f('M4 18l5-5 3 3 4-5 4 7z', G),
    shapes: `<circle cx="9" cy="9" r="5" fill="${L}" stroke="${B}" stroke-width="1.4"/>` + r(11, 11, 9, 9, '#f7cbac', 1) + `<rect x="11" y="11" width="9" height="9" fill="none" stroke="#c55a11" stroke-width="1.4"/>`,
    link: s('M10 14l4-4 M8.5 11.5l-2 2a3 3 0 0 0 4.2 4.2l2-2 M15.5 12.5l2-2a3 3 0 0 0-4.2-4.2l-2 2', B, 1.8),
    header: page() + r(8, 6, 8, 2.5, B, .5) + lines(8, 12, 3, 7, 3, GR), footer: page() + lines(8, 7, 3, 7, 3, GR) + r(8, 16.5, 8, 2.5, B, .5), pagenum: page() + t(12, 18, '#', B, 9),
    textbox: ro(3, 5, 18, 14, D, 1) + t(12, 16, 'A', B, 11), wordart: t(12, 19, 'A', R, 20, 900) + t(12, 19, 'A', 'none', 20, 900).replace('fill="none"', 'fill="none" stroke="#7a1f0d" stroke-width=".6"'),
    symbol: t(12, 18, 'Ω', D, 17, 500), equation: t(12, 18, 'π', B, 18, 500), date: ro(4, 5, 16, 15, D, 2) + r(4, 5, 16, 4, B, 1) + s('M8 3v4 M16 3v4') + lines(7, 13, 2, 10, 3.5, GR),
    pagebreak: s('M6 3v6h12V3 M6 21v-6h12v6', D) + s('M3 12h18', B, 1.4).replace('/>', ' stroke-dasharray="2 2"/>'), comment: s('M4 5h16v11H11l-4 4v-4H4z', B) + lines(7, 9, 2, 10, 3.5, GR),
    margins: page() + ro(8.5, 8, 7, 10, B, 0).replace('stroke-width="1.5"', 'stroke-width="1" stroke-dasharray="2 1.5"'), orientation: ro(5, 3, 10, 14, D, 1) + ro(9, 11, 12, 9, B, 1),
    size: ro(7, 3, 11, 15, GR, 1) + ro(4, 7, 10, 14, D, 1), columns: page() + lines(8, 9, 3, 3, 3.5, B) + lines(13, 9, 3, 3, 3.5, B), breaks: page() + s('M3 13h18', R, 1.4).replace('/>', ' stroke-dasharray="2 2"/>'),
    watermark: page() + t(12, 16, 'A', '#c8c6c4', 10).replace('<text', '<text transform="rotate(-35 12 13)"'), pagecolor: page() + f('M8 20l3-7 3 7z', B) + r(6, 20, 12, 2, Y, 0), pageborder: ro(4, 3, 16, 18, B, 0) + ro(7, 6, 10, 12, D, 0),
    wordcount: t(8, 10, 'ABC', D, 6.5) + t(16, 20, '123', B, 7), print: ro(5, 3, 14, 6, D, 1) + ro(3, 9, 18, 8, D, 2) + ro(7, 14, 10, 7, D, 0).replace('fill="none"', `fill="${W}"`),
    zoom100: `<circle cx="10" cy="10" r="6" fill="none" stroke="${D}" stroke-width="1.6"/>` + s('M14.5 14.5l6 6', D, 2) + t(10, 12.5, '1:1', B, 5.5), pagewidth: ro(6, 3, 12, 18, D, 1) + s('M3 12h18 M5 10l-2 2 2 2 M19 10l2 2-2 2', B),
    toc: page() + lines(8, 8, 4, [7, 5, 7, 5], 3, B), footnote: page() + lines(8, 7, 2, 8, 3, GR) + s('M8 15h8', D, .8) + t(9, 19.5, '1', B, 5) + s('M11 18.5h5', GR, 1),
    newslide: ro(2, 5, 16, 11, D, 1) + r(4, 7, 12, 2.4, B, .5) + `<circle cx="18" cy="17" r="5" fill="${G}"/>` + s('M18 14.5v5 M15.5 17h5', W, 1.6),
    layout: ro(3, 4, 18, 16, D, 1) + r(5, 6, 14, 3, B, .5) + ro(5, 11, 6, 7, GR, .5) + ro(13, 11, 6, 7, GR, .5), reset: s('M5 12a7 7 0 1 0 2-5 M5 3v4h4', B, 1.8),
    duplicate: ro(7, 7, 13, 10, D, 1) + s('M4 14V5h12', D), deleteslide: ro(4, 4, 14, 10, D, 1) + `<circle cx="17" cy="17" r="5" fill="${R}"/>` + s('M14.5 17h5', W, 1.6),
    themes: r(3, 4, 18, 16, '#fbe5d5', 2) + r(3, 4, 18, 5, R, 2) + t(10, 17, 'Aa', D, 8) + r(15, 12, 4, 6, B, 1), background: ro(3, 4, 18, 16, D, 1) + f('M3 20 L21 4 V20Z', L),
    trans: ro(2, 6, 11, 12, D, 1) + ro(11, 6, 11, 12, B, 1).replace('fill="none"', `fill="${L}"`) + s('M9 12h6 M13 10l2 2-2 2', D),
    anim: t(10, 18, '★', Y, 16, 400) + s('M15 6l2-2 M17 9h3 M15 12l2 2', B), preview: `<circle cx="12" cy="12" r="9" fill="none" stroke="${D}" stroke-width="1.5"/>` + f('M10 8l6 4-6 4z', B),
    fromstart: ro(3, 5, 18, 13, D, 1) + f('M10 8.5l5 3-5 3z', B) + s('M8 21h8'), fromcur: ro(3, 5, 18, 13, D, 1) + f('M11 8.5l5 3-5 3z', G) + s('M7 8.5v6', G, 1.6) + s('M8 21h8'),
    applyall: ro(7, 3, 14, 10, GR, 1) + ro(3, 9, 14, 10, D, 1) + s('M6 14l2.5 2.5L14 11', G, 1.8),
    fill: s('M5 12l6-7 7 7-6 7z') + f('M18 14c0 2 1.5 3 1.5 4.5a1.5 1.5 0 0 1-3 0c0-1.5 1.5-2.5 1.5-4.5z', B), outline: ro(4, 6, 14, 12, B, 2) + s('M18 18l3 3', D),
    arrange: ro(3, 3, 11, 11, GR, 1).replace('fill="none"', `fill="${L}"`) + ro(10, 10, 11, 11, D, 1).replace('fill="none"', `fill="${W}"`),
    merge: ro(3, 6, 18, 12, D, 1) + s('M7 12h10 M9 10l-2 2 2 2 M15 10l2 2-2 2', B), wrap: lines(4, 6, 1, 16) + s('M4 12h13a3 3 0 0 1 0 6h-4 M15 16l-2 2 2 2', B) + s('M4 18h6'),
    currency: t(12, 17, '$', G, 15), percent: t(12, 17, '%', D, 14), comma: t(12, 15, ',', D, 18, 900), decinc: t(8, 11, '.0', D, 7.5) + t(14, 21, '.00', B, 7.5) + s('M17 5l3 0', D, 1), decdec: t(8, 11, '.00', D, 7.5) + t(16, 21, '.0', B, 7.5),
    condfmt: ro(3, 3, 18, 18, D, 1) + r(5, 5, 6, 4, '#ffc7ce', 0) + r(13, 5, 6, 4, '#c6efce', 0) + r(5, 11, 6, 4, '#ffeb9c', 0) + r(13, 11, 6, 4, '#ffc7ce', 0) + r(5, 17, 14, 2, B, 0),
    fmttable: ro(3, 4, 18, 16, D, 1) + r(3, 4, 18, 4, B, 1) + r(3, 12, 18, 4, L, 0) + s('M9 4v16 M15 4v16', D, .8), cellstyles: ro(3, 5, 8, 6, D, 0).replace('fill="none"', 'fill="#c6efce"') + ro(13, 5, 8, 6, D, 0).replace('fill="none"', 'fill="#ffc7ce"') + ro(3, 13, 8, 6, D, 0).replace('fill="none"', 'fill="#ffeb9c"') + ro(13, 13, 8, 6, D, 0).replace('fill="none"', `fill="${W}"`),
    insertcells: ro(3, 3, 14, 14, D, 0) + s('M3 10h14 M10 3v14', D, 1) + `<circle cx="18" cy="18" r="4.5" fill="${G}"/>` + s('M18 15.8v4.4 M15.8 18h4.4', W, 1.5),
    deletecells: ro(3, 3, 14, 14, D, 0) + s('M3 10h14 M10 3v14', D, 1) + `<circle cx="18" cy="18" r="4.5" fill="${R}"/>` + s('M15.8 18h4.4', W, 1.5), formatcells: ro(3, 3, 18, 18, D, 0) + s('M3 9h18 M3 15h18 M9 3v18 M15 3v18', D, 1) + r(9, 9, 6, 6, B, 0),
    autosum: s('M17 5H6l6 7-6 7h11', D, 1.8), clear: s('M7 19h12 M5 15l8-9 5 5-6 7H8z', D) + r(5, 13, 5, 4, '#f7a1b4', 1), sort: t(8, 10, 'A', B, 7.5) + t(8, 21, 'Z', D, 7.5) + s('M17 4v15 M14 16l3 3 3-3', D),
    sortasc: t(8, 10, 'A', B, 7.5) + t(8, 21, 'Z', D, 7.5) + s('M17 4v15 M14 16l3 3 3-3', D), sortdesc: t(8, 10, 'Z', D, 7.5) + t(8, 21, 'A', B, 7.5) + s('M17 4v15 M14 16l3 3 3-3', D), sortcustom: r(3, 4, 18, 16, '#f3f2f1', 1) + t(8, 10, 'A', B, 7) + t(8, 19, 'Z', D, 7) + s('M14 8h6 M14 12h6 M14 16h4'),
    colchart: r(4, 12, 3.5, 8, B, 0) + r(10, 6, 3.5, 14, '#ed7d31', 0) + r(16, 9, 3.5, 11, GR, 0) + s('M3 20.5h18', D, 1), barchart: r(4, 4, 8, 3.5, B, 0) + r(4, 10, 14, 3.5, '#ed7d31', 0) + r(4, 16, 11, 3.5, GR, 0) + s('M3.5 3v18', D, 1),
    linechart: s('M3 20.5h18 M3.5 3v18', D, 1) + s('M5 16l4-5 4 3 6-8', B, 2), piechart: f('M12 3a9 9 0 1 0 9 9h-9z', B) + f('M14 2a8 8 0 0 1 8 8h-8z', '#ed7d31'),
    func: t(12, 17, 'ƒx', D, 13, 500, 'Georgia, serif'), showf: t(12, 17, 'ƒ', D, 16, 500, 'Georgia, serif') + ro(3, 3, 18, 18, B, 2), gridlines: ro(3, 3, 18, 18, D, 0) + s('M3 9h18 M3 15h18 M9 3v18 M15 3v18', GR, 1), headings: ro(3, 3, 18, 18, D, 0) + r(3, 3, 18, 5, L, 0) + r(3, 3, 5, 18, L, 0) + t(14, 7, 'A', D, 4.5) + t(5.5, 14, '1', D, 4.5),
    chartelem: r(4, 12, 3.5, 8, B, 0) + r(10, 8, 3.5, 12, B, 0) + `<circle cx="18" cy="7" r="4" fill="${G}"/>` + s('M18 5v4 M16 7h4', W, 1.4), datalabels: r(4, 12, 4, 8, B, 0) + r(12, 8, 4, 12, B, 0) + t(6, 10, '5', D, 5.5) + t(14, 6, '8', D, 5.5),
    legend: ro(3, 5, 18, 14, D, 1) + r(6, 9, 3, 3, B, 0) + r(6, 14, 3, 3, '#ed7d31', 0) + s('M11 10.5h7 M11 15.5h7', GR), charttitle: ro(3, 3, 18, 18, D, 1) + r(6, 6, 12, 2.5, B, .5) + r(6, 13, 2.5, 5, GR, 0) + r(11, 11, 2.5, 7, GR, 0), trash: s('M5 7h14 M9 7V4h6v3 M7 7l1 13h8l1-13', D),
    changechart: r(4, 12, 3.5, 8, B, 0) + r(10, 6, 3.5, 14, '#ed7d31', 0) + s('M17 5a4 4 0 0 1 3 4 M20 9l1-2 M20 9l-2-1', D),
    save: ro(4, 4, 16, 16, W, 2) + r(7, 4, 10, 5, W, 0) + r(8, 13, 8, 7, W, 0), undo: s('M9 6L4 11l5 5 M4 11h10a6 6 0 0 1 0 12', W, 1.8), redo: s('M15 6l5 5-5 5 M20 11H10a6 6 0 0 0 0 12', W, 1.8),
    play: f('M8 5l11 7-11 7z', W), search: `<circle cx="10" cy="10" r="5.5" fill="none" stroke="${D}" stroke-width="1.6"/>` + s('M14 14l6 6', D, 2),
  };
})();
function iconSVG(name, size = 16) { const b = ICONS[name]; return b ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${b}</svg>` : ''; }
function applyIcons(root = document) {
  root.querySelectorAll('[data-i]').forEach((el) => { if (el.dataset.done) return; el.innerHTML = iconSVG(el.dataset.i, el.closest('.rb.big') ? 32 : el.dataset.sz ? +el.dataset.sz : 16); el.dataset.done = 1; });
}
