/**
 * TinHocLab – hàm làm mượt chuyển động.
 * Chuyển từ teardown/sims/kit/util.js (https://github.com/elvarofficial/teardown, MIT,
 * gốc từ whaleyxbt/claude-motion, MIT).
 */
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const smooth = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};
/** Như `smooth` nhưng đạo hàm bậc hai cũng bằng 0 ở hai đầu (live.js của bản V8). */
export const smoother = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeInOutCubic = (x: number) => {
  const k = clamp01(x);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
/**
 * Bung rời theo lớp (engine.js của bản V8): lớp bắt đầu ở `start` và đi hết trong `span`,
 * lớp ngoài cùng đi trước nên không phần nào xuyên qua phần nào.
 */
export const layer = (value: number, start: number, span = 0.45) =>
  smoother((value - start) / span);
