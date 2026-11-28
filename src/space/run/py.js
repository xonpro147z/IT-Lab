// Quản lý Python worker: giữ một worker sẵn sàng, dừng được, giới hạn thời gian.
export class PyRunner {
  constructor() { this.seq = 0; this.spawn(); }
  spawn() {
    if (this.w) this.w.terminate();
    this.ready = false; this.pending = null;
    this.w = new Worker(new URL('./py-worker.js', import.meta.url));
    this.readyP = new Promise((res) => (this._res = res));
    this.w.onmessage = (e) => this.onMsg(e.data);
    this.w.onerror = (e) => { if (this.pending) this.finish({ ok: false, error: 'Lỗi trình chạy Python: ' + (e.message || '') }); };
  }
  onMsg(m) {
    if (m.type === 'ready') { this.ready = true; this._res(); return; }
    const p = this.pending; if (!p || m.id !== p.id) return;
    if (m.type === 'out') { p.out += m.text; p.onOut && p.onOut(m.text, 'out'); }
    else if (m.type === 'err') { p.err += m.text; p.onOut && p.onOut(m.text, 'err'); }
    else if (m.type === 'turtle') p.turtle = m.ops;
    else if (m.type === 'done') this.finish({ ok: m.ok, error: m.error, ms: m.ms });
  }
  finish(r) {
    const p = this.pending; if (!p) return; this.pending = null; clearTimeout(p.timer);
    p.resolve({ ok: r.ok, out: p.out, err: p.err, error: r.error || '', ms: r.ms || 0, turtle: p.turtle || null, timeout: !!r.timeout, stopped: !!r.stopped });
  }
  // chạy code; timeoutMs tính từ lúc Python đã sẵn sàng
  async run(code, stdin = '', { timeoutMs = 8000, onOut } = {}) {
    if (this.pending) this.stop();
    const id = ++this.seq;
    const p = { id, out: '', err: '', onOut };
    const done = new Promise((resolve) => (p.resolve = resolve));
    this.pending = p;
    await this.readyP;
    if (this.pending !== p) return done;
    p.timer = setTimeout(() => { this.finish({ ok: false, timeout: true, error: `Quá thời gian (${timeoutMs / 1000} giây). Có thể chương trình bị lặp vô hạn.` }); this.spawn(); }, timeoutMs);
    this.w.postMessage({ id, code, stdin });
    return done;
  }
  stop() { if (this.pending) { this.finish({ ok: false, stopped: true, error: 'Đã dừng chương trình.' }); this.spawn(); } }
}
