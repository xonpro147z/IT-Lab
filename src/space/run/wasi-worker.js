// Chạy chương trình C++ đã biên dịch (WebAssembly + WASI) với dữ liệu vào cho trước. Worker này bị huỷ khi quá giờ.
import { WASI, File, OpenFile, ConsoleStdout, WASIProcExit } from '../../vendor/wasi-shim/index.js';
onmessage = async (e) => {
  const { wasm, stdin } = e.data;
  const dec = new TextDecoder(); let total = 0, cut = false;
  const out = (k) => new ConsoleStdout((b) => { if (cut) return; total += b.length; if (total > 200000) { cut = true; postMessage({ type: 'err', text: '\n[Dừng: chương trình in ra quá nhiều]\n' }); return; } postMessage({ type: k, text: dec.decode(b, { stream: true }) }); });
  const fds = [new OpenFile(new File(new TextEncoder().encode(stdin || ''))), out('out'), out('err')];
  const wasi = new WASI(['main'], [], fds);
  const t0 = performance.now();
  try {
    const mod = await WebAssembly.compile(wasm);
    const inst = await WebAssembly.instantiate(mod, { wasi_snapshot_preview1: wasi.wasiImport });
    const code = wasi.start(inst);
    postMessage({ type: 'done', ok: code === 0, code, ms: Math.round(performance.now() - t0) });
  } catch (er) {
    const msg = er instanceof WASIProcExit ? '' : String(er && er.message || er);
    let vi = msg;
    if (/unreachable/.test(msg)) vi = 'Chương trình bị dừng đột ngột (có thể truy cập ngoài mảng, chia cho 0 hoặc lỗi bộ nhớ).';
    else if (/out of bounds|memory access/.test(msg)) vi = 'Truy cập bộ nhớ ngoài phạm vi (thường do chỉ số mảng vượt quá kích thước).';
    else if (/call stack|stack/.test(msg)) vi = 'Tràn ngăn xếp – có thể do đệ quy quá sâu.';
    else if (/divide by zero|integer divide/.test(msg)) vi = 'Phép chia cho 0.';
    postMessage({ type: 'done', ok: false, error: vi, ms: Math.round(performance.now() - t0) });
  }
};
