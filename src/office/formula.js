// Bộ tính công thức cho bảng tính giả lập (cú pháp giống Excel)
const XL = (() => {
  class XErr { constructor(code) { this.code = code; } toString() { return this.code; } }
  const E = { div0: new XErr('#DIV/0!'), name: new XErr('#NAME?'), value: new XErr('#VALUE!'), ref: new XErr('#REF!'), na: new XErr('#N/A'), num: new XErr('#NUM!'), circ: new XErr('#CIRC!') };
  const isErr = (v) => v instanceof XErr;

  // ---- địa chỉ ô ----
  const colName = (c) => { let s = ''; c++; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
  const colIndex = (s) => { let n = 0; for (const ch of s.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
  const addr = (r, c) => colName(c) + (r + 1);
  const parseAddr = (a) => { const m = /^\$?([A-Z]{1,2})\$?(\d+)$/i.exec(a); return m ? { r: +m[2] - 1, c: colIndex(m[1]) } : null; };

  // ---- tách từ tố ----
  function tokenize(src) {
    const out = []; let i = 0;
    const re = {
      ws: /^\s+/, num: /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i, str: /^"((?:[^"]|"")*)"/,
      range: /^(\$?[A-Z]{1,2}\$?\d+):(\$?[A-Z]{1,2}\$?\d+)/i, ref: /^\$?[A-Z]{1,2}\$?\d+(?![A-Z0-9_(])/i,
      func: /^([A-Z][A-Z0-9.]*)\s*\(/i, bool: /^(TRUE|FALSE)(?![A-Z0-9_(])/i, op: /^(<>|<=|>=|[-+*/^&=<>%])/,
    };
    while (i < src.length) {
      const s = src.slice(i); let m;
      if ((m = re.ws.exec(s))) { i += m[0].length; continue; }
      if ((m = re.str.exec(s))) { out.push({ t: 'str', v: m[1].replace(/""/g, '"') }); i += m[0].length; continue; }
      if ((m = re.range.exec(s))) { out.push({ t: 'range', a: m[1].toUpperCase(), b: m[2].toUpperCase() }); i += m[0].length; continue; }
      if ((m = re.func.exec(s))) { out.push({ t: 'func', v: m[1].toUpperCase() }); i += m[0].length; continue; }
      if ((m = re.bool.exec(s))) { out.push({ t: 'bool', v: m[1].toUpperCase() === 'TRUE' }); i += m[0].length; continue; }
      if ((m = re.ref.exec(s))) { out.push({ t: 'ref', v: m[0].toUpperCase() }); i += m[0].length; continue; }
      if ((m = re.num.exec(s))) { out.push({ t: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if ((m = re.op.exec(s))) { out.push({ t: 'op', v: m[0] }); i += m[0].length; continue; }
      const ch = s[0];
      if (ch === '(' || ch === ')') { out.push({ t: ch }); i++; continue; }
      if (ch === ',' || ch === ';') { out.push({ t: ',' }); i++; continue; }
      if (/[A-Z_]/i.test(ch)) { const w = /^[A-Z_][A-Z0-9_]*/i.exec(s)[0]; out.push({ t: 'name', v: w }); i += w.length; continue; }
      throw new Error('invalid character ' + ch);
    }
    return out;
  }

  // ---- phân tích cú pháp ----
  function parse(src) {
    const tk = tokenize(src); let p = 0;
    const peek = () => tk[p]; const next = () => tk[p++];
    const isOp = (...ops) => peek() && peek().t === 'op' && ops.includes(peek().v);
    function cmp() { let l = concat(); while (isOp('=', '<>', '<', '>', '<=', '>=')) { const o = next().v; l = { k: 'bin', o, l, r: concat() }; } return l; }
    function concat() { let l = add(); while (isOp('&')) { next(); l = { k: 'bin', o: '&', l, r: add() }; } return l; }
    function add() { let l = mul(); while (isOp('+', '-')) { const o = next().v; l = { k: 'bin', o, l, r: mul() }; } return l; }
    function mul() { let l = pow(); while (isOp('*', '/')) { const o = next().v; l = { k: 'bin', o, l, r: pow() }; } return l; }
    function pow() { let l = unary(); while (isOp('^')) { next(); l = { k: 'bin', o: '^', l, r: unary() }; } return l; }
    function unary() { if (isOp('-')) { next(); return { k: 'neg', e: unary() }; } if (isOp('+')) { next(); return unary(); } return postfix(); }
    function postfix() { let e = prim(); while (isOp('%')) { next(); e = { k: 'pct', e }; } return e; }
    function prim() {
      const t = next();
      if (!t) throw new Error('the formula is incomplete');
      switch (t.t) {
        case 'num': return { k: 'num', v: t.v };
        case 'str': return { k: 'str', v: t.v };
        case 'bool': return { k: 'bool', v: t.v };
        case 'ref': return { k: 'ref', v: t.v };
        case 'range': return { k: 'range', a: t.a, b: t.b };
        case 'name': return { k: 'badname', v: t.v };
        case '(': { const e = cmp(); if (!peek() || next().t !== ')') throw new Error('missing closing parenthesis'); return e; }
        case 'func': {
          const args = [];
          if (peek() && peek().t === ')') { next(); return { k: 'call', f: t.v, args }; }
          for (;;) {
            if (peek() && (peek().t === ',' || peek().t === ')')) args.push({ k: 'empty' }); else args.push(cmp());
            const n = next(); if (!n) throw new Error('missing closing parenthesis');
            if (n.t === ')') break; if (n.t !== ',') throw new Error('missing comma between arguments');
          }
          return { k: 'call', f: t.v, args };
        }
      }
      throw new Error('unexpected token');
    }
    const ast = cmp();
    if (p < tk.length) throw new Error('unexpected text after the formula');
    return ast;
  }

  // ---- chuyển đổi kiểu ----
  const num = (v) => {
    if (isErr(v)) return v;
    if (typeof v === 'number') return v; if (typeof v === 'boolean') return v ? 1 : 0; if (v === '' || v == null) return 0;
    const n = Number(String(v).replace(/,/g, '')); return isNaN(n) ? E.value : n;
  };
  const str = (v) => (v == null ? '' : typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : typeof v === 'number' ? String(+v.toPrecision(15)) : String(v));
  const truthy = (v) => (typeof v === 'string' ? (v.toUpperCase() === 'TRUE' ? true : v.toUpperCase() === 'FALSE' ? false : E.value) : !!num(v));
  const flat = (args) => { const o = []; args.forEach((a) => (Array.isArray(a) ? a.flat().forEach((x) => o.push({ v: x, fromRange: true })) : o.push({ v: a, fromRange: false }))); return o; };
  const nums = (args) => { const o = []; for (const { v, fromRange } of flat(args)) { if (isErr(v)) return v; if (typeof v === 'number') o.push(v); else if (!fromRange && v !== '') { const n = num(v); if (isErr(n)) return n; o.push(n); } } return o; };

  // điều kiện của COUNTIF/SUMIF
  function crit(c) {
    if (typeof c === 'number') return (v) => typeof v === 'number' ? v === c : String(v) === String(c);
    const m = /^(<>|<=|>=|=|<|>)?(.*)$/.exec(String(c)); const op = m[1] || '='; const rhs = m[2];
    const rn = rhs !== '' && !isNaN(Number(rhs)) ? Number(rhs) : null;
    const pat = new RegExp('^' + rhs.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
    return (v) => {
      if (rn !== null && typeof v === 'number') return { '=': v === rn, '<>': v !== rn, '<': v < rn, '>': v > rn, '<=': v <= rn, '>=': v >= rn }[op];
      if (rn !== null && op !== '=' && op !== '<>') return false;
      const s = str(v);
      if (op === '=') return rhs === '' ? s === '' : pat.test(s);
      if (op === '<>') return rhs === '' ? s !== '' : !pat.test(s);
      return { '<': s < rhs, '>': s > rhs, '<=': s <= rhs, '>=': s >= rhs }[op];
    };
  }
  const dateToSerial = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);
  const serialToDate = (n) => new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000);
  const round = (x, d) => { const f = Math.pow(10, d); return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f; };

  const F = {
    SUM: (...a) => { const n = nums(a); return isErr(n) ? n : n.reduce((s, x) => s + x, 0); },
    AVERAGE: (...a) => { const n = nums(a); return isErr(n) ? n : n.length ? n.reduce((s, x) => s + x, 0) / n.length : E.div0; },
    MIN: (...a) => { const n = nums(a); return isErr(n) ? n : n.length ? Math.min(...n) : 0; },
    MAX: (...a) => { const n = nums(a); return isErr(n) ? n : n.length ? Math.max(...n) : 0; },
    COUNT: (...a) => flat(a).filter(({ v, fromRange }) => typeof v === 'number' || (!fromRange && !isNaN(Number(v)) && v !== '')).length,
    COUNTA: (...a) => flat(a).filter(({ v }) => v !== '' && v != null).length,
    COUNTBLANK: (r) => flat([r]).filter(({ v }) => v === '' || v == null).length,
    COUNTIF: (r, c) => { const f = crit(c); return flat([r]).filter(({ v }) => f(v)).length; },
    SUMIF: (r, c, s) => { const f = crit(c); const R = flat([r]); const S = s ? flat([s]) : R; let t = 0; R.forEach(({ v }, i) => { if (f(v) && S[i] && typeof S[i].v === 'number') t += S[i].v; }); return t; },
    AVERAGEIF: (r, c, s) => { const f = crit(c); const R = flat([r]); const S = s ? flat([s]) : R; let t = 0, n = 0; R.forEach(({ v }, i) => { if (f(v) && S[i] && typeof S[i].v === 'number') { t += S[i].v; n++; } }); return n ? t / n : E.div0; },
    COUNTIFS: (...a) => { const R = []; for (let i = 0; i < a.length; i += 2) R.push([flat([a[i]]), crit(a[i + 1])]); return R[0][0].filter((_, k) => R.every(([rr, f]) => rr[k] && f(rr[k].v))).length; },
    SUMIFS: (s, ...a) => { const S = flat([s]); const R = []; for (let i = 0; i < a.length; i += 2) R.push([flat([a[i]]), crit(a[i + 1])]); return S.reduce((t, x, k) => (R.every(([rr, f]) => rr[k] && f(rr[k].v)) && typeof x.v === 'number' ? t + x.v : t), 0); },
    IF: (c, a, b) => { if (isErr(c)) return c; const t = truthy(c); if (isErr(t)) return t; return t ? (a === undefined ? true : a) : (b === undefined ? false : b); },
    IFERROR: (v, alt) => (isErr(v) ? alt : v),
    ISERROR: (v) => isErr(v), ISNUMBER: (v) => typeof v === 'number', ISBLANK: (v) => v === '' || v == null, ISTEXT: (v) => typeof v === 'string' && v !== '',
    AND: (...a) => { for (const { v } of flat(a)) { if (isErr(v)) return v; if (v === '') continue; const t = truthy(v); if (isErr(t)) return t; if (!t) return false; } return true; },
    OR: (...a) => { for (const { v } of flat(a)) { if (isErr(v)) return v; if (v === '') continue; const t = truthy(v); if (isErr(t)) return t; if (t) return true; } return false; },
    NOT: (v) => { const t = truthy(v); return isErr(t) ? t : !t; },
    ROUND: (x, d = 0) => { x = num(x); d = num(d); return isErr(x) ? x : round(x, d); },
    ROUNDUP: (x, d = 0) => { x = num(x); const f = Math.pow(10, num(d)); return Math.sign(x) * Math.ceil(Math.abs(x) * f - 1e-9) / f; },
    ROUNDDOWN: (x, d = 0) => { x = num(x); const f = Math.pow(10, num(d)); return Math.sign(x) * Math.floor(Math.abs(x) * f + 1e-9) / f; },
    INT: (x) => Math.floor(num(x)), ABS: (x) => Math.abs(num(x)), SQRT: (x) => (num(x) < 0 ? E.num : Math.sqrt(num(x))),
    POWER: (x, y) => Math.pow(num(x), num(y)), MOD: (x, y) => (num(y) === 0 ? E.div0 : ((num(x) % num(y)) + num(y)) % num(y)), PI: () => Math.PI,
    PRODUCT: (...a) => { const n = nums(a); return isErr(n) ? n : n.reduce((s, x) => s * x, 1); },
    LEN: (s) => str(s).length, UPPER: (s) => str(s).toLocaleUpperCase('vi'), LOWER: (s) => str(s).toLocaleLowerCase('vi'),
    PROPER: (s) => str(s).toLocaleLowerCase('vi').replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toLocaleUpperCase('vi')),
    TRIM: (s) => str(s).trim().replace(/\s+/g, ' '),
    LEFT: (s, n = 1) => str(s).slice(0, num(n)), RIGHT: (s, n = 1) => { s = str(s); return num(n) ? s.slice(-num(n)) : ''; }, MID: (s, a, n) => str(s).substr(num(a) - 1, num(n)),
    CONCATENATE: (...a) => a.map(str).join(''), CONCAT: (...a) => flat(a).map(({ v }) => str(v)).join(''),
    TODAY: () => { const d = new Date(); return dateToSerial(d.getFullYear(), d.getMonth() + 1, d.getDate()); },
    NOW: () => { const d = new Date(); return dateToSerial(d.getFullYear(), d.getMonth() + 1, d.getDate()) + (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400; },
    DATE: (y, m, d) => dateToSerial(num(y), num(m), num(d)),
    YEAR: (s) => { const x = num(s); return isErr(x) ? x : serialToDate(x).getUTCFullYear(); },
    MONTH: (s) => { const x = num(s); return isErr(x) ? x : serialToDate(x).getUTCMonth() + 1; },
    DAY: (s) => { const x = num(s); return isErr(x) ? x : serialToDate(x).getUTCDate(); },
    VLOOKUP: (v, tbl, col, approx = true) => {
      if (!Array.isArray(tbl)) return E.value; col = num(col); if (col < 1 || col > tbl[0].length) return E.ref;
      const exact = approx === false || approx === 0 || approx === 'FALSE';
      if (exact) { const i = tbl.findIndex((r) => (typeof v === 'number' ? r[0] === v : str(r[0]).toLowerCase() === str(v).toLowerCase())); return i < 0 ? E.na : tbl[i][col - 1]; }
      let found = -1; for (let i = 0; i < tbl.length; i++) { const k = tbl[i][0]; if (k === '') continue; if ((typeof v === 'number' ? num(k) <= v : str(k) <= str(v))) found = i; else break; }
      return found < 0 ? E.na : tbl[found][col - 1];
    },
    HLOOKUP: (v, tbl, row, approx = true) => {
      if (!Array.isArray(tbl)) return E.value; const T = tbl[0].map((_, c) => tbl.map((r) => r[c])); return F.VLOOKUP(v, T, row, approx);
    },
    INDEX: (tbl, r, c = 1) => (Array.isArray(tbl) ? ((tbl[num(r) - 1] || [])[num(c) - 1] ?? E.ref) : tbl),
    MATCH: (v, rng, type = 1) => { const a = flat([rng]).map((x) => x.v); const i = a.findIndex((x) => str(x).toLowerCase() === str(v).toLowerCase()); return i < 0 ? E.na : i + 1; },
    RANK: (v, rng, order = 0) => { v = num(v); const a = flat([rng]).map((x) => x.v).filter((x) => typeof x === 'number'); if (!a.includes(v)) return E.na; return 1 + a.filter((x) => (num(order) ? x < v : x > v)).length; },
  };
  F['RANK.EQ'] = F.RANK;
  const FUNC_LIST = Object.keys(F).sort();

  function evaluate(ast, ctx) {
    switch (ast.k) {
      case 'num': case 'str': case 'bool': return ast.v;
      case 'empty': return undefined;
      case 'badname': return E.name;
      case 'ref': { const p = parseAddr(ast.v); return p ? ctx.get(p.r, p.c) : E.ref; }
      case 'range': { const a = parseAddr(ast.a), b = parseAddr(ast.b); const out = []; for (let r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++) { const row = []; for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) row.push(ctx.get(r, c)); out.push(row); } return out; }
      case 'neg': { const v = num(scalar(evaluate(ast.e, ctx))); return isErr(v) ? v : -v; }
      case 'pct': { const v = num(scalar(evaluate(ast.e, ctx))); return isErr(v) ? v : v / 100; }
      case 'call': {
        const f = F[ast.f]; if (!f) return E.name;
        const args = ast.args.map((a) => evaluate(a, ctx));
        const lazyOk = ['IF', 'IFERROR', 'ISERROR', 'COUNT', 'COUNTA', 'COUNTIF', 'COUNTBLANK'];
        if (!lazyOk.includes(ast.f)) { const e = args.find((a) => isErr(a)); if (e) return e; }
        try { const r = f(...args); return r === undefined ? 0 : Array.isArray(r) ? r[0][0] : r; } catch { return E.value; }
      }
      case 'bin': {
        const l = scalar(evaluate(ast.l, ctx)), r = scalar(evaluate(ast.r, ctx));
        if (isErr(l)) return l; if (isErr(r)) return r;
        if (ast.o === '&') return str(l) + str(r);
        if (['=', '<>', '<', '>', '<=', '>='].includes(ast.o)) {
          let a = l, b = r;
          if (typeof a === 'string' || typeof b === 'string') { a = str(a).toLowerCase(); b = str(b).toLowerCase(); }
          return { '=': a === b, '<>': a !== b, '<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b }[ast.o];
        }
        const x = num(l), y = num(r); if (isErr(x)) return x; if (isErr(y)) return y;
        switch (ast.o) { case '+': return x + y; case '-': return x - y; case '*': return x * y; case '/': return y === 0 ? E.div0 : x / y; case '^': return Math.pow(x, y); }
      }
    }
    return E.value;
  }
  const scalar = (v) => (Array.isArray(v) ? (v.length === 1 && v[0].length === 1 ? v[0][0] : E.value) : v === undefined ? 0 : v);

  // Dịch tham chiếu tương đối khi sao chép công thức
  function mapRefs(formula, fn) {
    return formula.split(/("(?:[^"]|"")*")/).map((seg, i) => (i % 2 ? seg : seg.replace(/(?<![A-Za-z_$\d.])(\$?)([A-Z]{1,2})(\$?)(\d+)(?![A-Za-z_\d(])/gi, (m, d1, col, d2, row) => {
      const r = fn({ c: colIndex(col), r: +row - 1, absC: !!d1, absR: !!d2 });
      if (!r) return '#REF!';
      return (d1 ? '$' : '') + colName(r.c) + (d2 ? '$' : '') + (r.r + 1);
    }))).join('');
  }
  const shift = (formula, dr, dc) => mapRefs(formula, (x) => { const r = x.absR ? x.r : x.r + dr, c = x.absC ? x.c : x.c + dc; return r < 0 || c < 0 ? null : { r, c }; });

  return { dateToSerial, serialToDate, parse, evaluate, XErr, E, isErr, colName, colIndex, addr, parseAddr, shift, mapRefs, FUNC_LIST, str, num };
})();
