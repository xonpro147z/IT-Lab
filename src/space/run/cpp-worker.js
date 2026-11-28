// TinHocLab Space – biên dịch C++ bằng Clang chạy trong WebAssembly (không cần cài trình biên dịch)
import { runClang } from '../../vendor/clang/bundle.js';
const FLAGS = ['clang++', '-std=c++17', '-O1', '-fno-exceptions', '-Wall', '-fno-color-diagnostics', 'main.cpp', '-o', 'main.wasm'];
let warmed = false;
async function compile(code) {
  let err = '';
  const dec = new TextDecoder();
  const sink = (b) => { if (b) err += dec.decode(b, { stream: true }); };
  try {
    const out = await runClang(FLAGS, { 'main.cpp': code }, { stdout: sink, stderr: sink, decodeASCII: false, fetchProgress: () => {} });
    return { ok: true, wasm: out['main.wasm'], diag: err };
  } catch (e) {
    return { ok: false, diag: err || String(e.message || e) };
  }
}
onmessage = async (e) => {
  const { id, type, code } = e.data;
  if (type === 'warm') { if (!warmed) { await compile('int main(){return 0;}'); warmed = true; } postMessage({ id, type: 'ready' }); return; }
  const t0 = performance.now();
  const r = await compile(code); warmed = true;
  postMessage({ id, type: 'compiled', ok: r.ok, wasm: r.wasm, diag: r.diag, ms: Math.round(performance.now() - t0) }, r.wasm ? [r.wasm.buffer] : []);
};
