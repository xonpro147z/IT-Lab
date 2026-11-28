// Quản lý C++: một worker biên dịch (giữ sẵn, nạp Clang một lần) + mỗi lần chạy một worker riêng (huỷ được khi lặp vô hạn).
export class CppRunner {
  constructor() { this.seq = 0; this.cache = new Map(); this.ready = false; this.spawnCompiler(); }
  spawnCompiler() {
    this.cw = new Worker(new URL('./cpp-worker.js', import.meta.url), { type: 'module' });
    this.waiting = new Map();
    this.cw.onmessage = (e) => { const f = this.waiting.get(e.data.id); if (f) { this.waiting.delete(e.data.id); f(e.data); } };
  }
  call(msg) { const id = ++this.seq; return new Promise((res) => { this.waiting.set(id, res); this.cw.postMessage({ ...msg, id }); }); }
  warm() { if (!this.warmP) this.warmP = this.call({ type: 'warm' }).then(() => (this.ready = true)); return this.warmP; }
  async compile(code) {
    if (this.cache.has(code)) return this.cache.get(code);
    const r = await this.call({ type: 'compile', code }); this.ready = true;
    const v = { ok: r.ok, wasm: r.wasm, diag: clean(r.diag || ''), ms: r.ms };
    this.cache.clear(); this.cache.set(code, v); // chỉ giữ bản gần nhất
    return v;
  }
  async run(code, stdin = '', { timeoutMs = 8000, onOut } = {}) {
    this.stop();
    const token = (this.token = {});
    const c = await this.compile(code);
    if (token !== this.token) return { ok: false, out: '', err: '', error: 'Đã dừng.', ms: 0, stopped: true };
    if (!c.ok) return { ok: false, out: '', err: c.diag, error: c.diag || 'Biên dịch thất bại', ms: c.ms, compile: true };
    if (c.diag && onOut) onOut(c.diag + '\n', 'warn');
    return new Promise((resolve) => {
      const w = (this.rw = new Worker(new URL('./wasi-worker.js', import.meta.url), { type: 'module' }));
      let out = '', err = '';
      const finish = (r) => { clearTimeout(t); w.terminate(); if (this.rw === w) this.rw = null; this.fin = null; resolve({ out, err, ...r }); };
      this.fin = finish;
      const t = setTimeout(() => finish({ ok: false, timeout: true, error: `Quá thời gian (${timeoutMs / 1000} giây). Có thể chương trình bị lặp vô hạn hoặc đang chờ nhập thêm dữ liệu.`, ms: timeoutMs }), timeoutMs);
      w.onmessage = (e) => {
        const m = e.data;
        if (m.type === 'out') { out += m.text; onOut && onOut(m.text, 'out'); }
        else if (m.type === 'err') { err += m.text; onOut && onOut(m.text, 'err'); }
        else if (m.type === 'done') finish({ ok: m.ok, error: m.error || (m.ok ? '' : m.code ? `Chương trình kết thúc với mã ${m.code}` : ''), ms: m.ms });
      };
      w.onerror = (e) => finish({ ok: false, error: 'Lỗi khi chạy: ' + (e.message || ''), ms: 0 });
      w.postMessage({ wasm: c.wasm, stdin });
    });
  }
  stop() { this.token = {}; if (this.fin) this.fin({ ok: false, stopped: true, error: 'Đã dừng chương trình.', ms: 0 }); }
}
// rút gọn thông báo của clang: bỏ đường dẫn tạm, giữ main.cpp:dòng:cột
function clean(s) { return s.replace(/\/tmp\/[^\s:]+/g, '').replace(/^clang\+\+: error: linker command failed.*$/m, '').trim(); }
