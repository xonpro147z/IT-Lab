// Chuyển động: hiện dần khi cuộn, chuyển trang mượt, đếm số
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    if (e.target.dataset.count !== undefined) countUp(e.target);
    io.unobserve(e.target);
  }), { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  function scan(root = document) { root.querySelectorAll('.reveal, .reveal-scale, [data-count]').forEach((el) => io.observe(el)); }
  function countUp(el) {
    const to = +el.dataset.count, dur = reduce ? 1 : 1400, t0 = performance.now(), suf = el.dataset.suffix || '';
    const step = (t) => { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(to * e).toLocaleString('vi-VN') + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  // chuyển trang mượt cho các liên kết có data-nav
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-nav]'); if (!a) return;
    e.preventDefault(); const href = a.dataset.nav;
    if (reduce) { location.href = href; return; }
    document.body.classList.add('leaving'); setTimeout(() => (location.href = href), 300);
  });
  window.Motion = { scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan()); else scan();
})();
