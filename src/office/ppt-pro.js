// PowerPoint – extended features: Transitions (effect options, duration, sound, advance), Animations
// (entrance/emphasis/exit/motion paths, Add Animation, Animation Pane, timing), Insert Video/Audio with
// Playback tab, Picture Format tab (styles, corrections, color, artistic effects, crop, size) and the File backstage
const PX = (() => {
  // ========================= TRANSITIONS =========================
  const TR = {
    none: ['None', '∅', []], cut: ['Cut', '▮', []], fade: ['Fade', '◐', ['Smoothly', 'Through Black']], push: ['Push', '⇧', ['From Bottom', 'From Left', 'From Right', 'From Top']],
    wipe: ['Wipe', '▶', ['From Right', 'From Top', 'From Left', 'From Bottom']], split: ['Split', '⇔', ['Vertical Out', 'Vertical In', 'Horizontal Out', 'Horizontal In']],
    reveal: ['Reveal', '◧', ['Smoothly From Right', 'Smoothly From Left']], cover: ['Cover', '▤', ['From Right', 'From Top', 'From Left', 'From Bottom']],
    uncover: ['Uncover', '▥', ['From Right', 'From Top', 'From Left', 'From Bottom']], shape: ['Shape', '◯', ['Circle', 'Diamond', 'Plus']],
    zoom: ['Zoom', '⊕', ['In', 'Out']], flip: ['Flip', '↻', ['Right', 'Left']], clock: ['Clock', '🕐', ['Clockwise', 'Counterclockwise']],
    ripple: ['Ripple', '◎', ['Center']], curtains: ['Curtains', '🎭', []], vortex: ['Vortex', '🌀', ['From Left', 'From Right']], morph: ['Morph', '✧', ['Objects']],
  };
  const SOUNDS = ['[No Sound]', '[Stop Previous Sound]', 'Applause', 'Arrow', 'Bomb', 'Breeze', 'Camera', 'Cash Register', 'Chime', 'Click', 'Drum Roll', 'Explosion', 'Laser', 'Push', 'Suction', 'Typewriter', 'Whoosh', 'Wind'];
  const dirVec = (d) => /Right/.test(d) ? ['100%', '0'] : /Left/.test(d) ? ['-100%', '0'] : /Top/.test(d) ? ['0', '-100%'] : ['0', '100%'];
  function transCss(s) {
    const k = s.transition || 'none'; const o = s.tOpt || {}; const dur = (o.dur || (k === 'cut' ? 0.01 : 0.8)) + 's'; const d = o.dir || (TR[k] && TR[k][2][0]) || '';
    const [x, y] = dirVec(d);
    const name = { fade: d === 'Through Black' ? 'tFadeB' : 'tFade', push: 'tPush2', wipe: 'tWipe2', split: /Horizontal/.test(d) ? 'tSplitH' : 'tSplit', reveal: 'tReveal', cover: 'tCover', uncover: 'tCover', shape: d === 'Diamond' ? 'tDiamond' : 'tShape', zoom: d === 'Out' ? 'tZoomOut' : 'tZoom', flip: 'tFlip', clock: 'tClock', ripple: 'tRipple', curtains: 'tCurtains', vortex: 'tVortex', morph: 'tFade' }[k];
    if (!name) return null;
    const wipe = { 'From Right': 'inset(0 0 0 100%)', 'From Left': 'inset(0 100% 0 0)', 'From Top': 'inset(0 0 100% 0)', 'From Bottom': 'inset(100% 0 0 0)' }[d] || 'inset(0 100% 0 0)';
    return { anim: `${name} ${dur} ease both`, vars: { '--tx': x, '--ty': y, '--wipe': wipe } };
  }
  function playTrans(box, s) {
    const t = transCss(s); box.style.animation = 'none'; box.offsetWidth;
    if (!t) { box.style.animation = ''; return 0; }
    Object.entries(t.vars).forEach(([k, v]) => box.style.setProperty(k, v)); box.style.animation = t.anim;
    const snd = s.tOpt && s.tOpt.sound; if (snd && !/^\[/.test(snd)) beep(snd);
    return (s.tOpt && s.tOpt.dur) || 0.8;
  }
  let actx = null;
  function beep(kind) { try { actx = actx || new AudioContext(); const o = actx.createOscillator(), g = actx.createGain(); o.type = /Chime|Cash/.test(kind) ? 'sine' : 'triangle'; o.frequency.value = /Applause|Drum|Explosion|Bomb/.test(kind) ? 110 : /Laser|Whoosh|Arrow/.test(kind) ? 880 : 520; g.gain.setValueAtTime(0.15, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.5); o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.5); } catch {} }

  // ========================= ANIMATIONS =========================
  const AN = {
    in: { appear: ['Appear', '✦'], fade: ['Fade', '◐'], fly: ['Fly In', '⇧', ['From Bottom', 'From Bottom-Left', 'From Left', 'From Top-Left', 'From Top', 'From Top-Right', 'From Right', 'From Bottom-Right']], float: ['Float In', '⤊', ['Float Up', 'Float Down']], split: ['Split', '⇔', ['Vertical Out', 'Horizontal Out']], wipe: ['Wipe', '▶', ['From Bottom', 'From Left', 'From Right', 'From Top']], shape: ['Shape', '◯', ['In', 'Out']], wheel: ['Wheel', '✇'], bars: ['Random Bars', '▥', ['Horizontal', 'Vertical']], grow: ['Grow & Turn', '↗'], zoom: ['Zoom', '⊕', ['Object Center', 'Slide Center']], swivel: ['Swivel', '⟲'], bounce: ['Bounce', '⤒'], spin: ['Spin In', '↻'] },
    emph: { pulse: ['Pulse', '♥'], colorpulse: ['Color Pulse', '🎨'], teeter: ['Teeter', '〰'], spin: ['Spin', '↻', ['Clockwise', 'Counterclockwise']], grow: ['Grow/Shrink', '⤢', ['Larger', 'Smaller']], desat: ['Desaturate', '◑'], darken: ['Darken', '●'], transp: ['Transparency', '◌'], bold: ['Bold Flash', 'B'], wave: ['Wave', '≈'] },
    out: { disappear: ['Disappear', '✧'], fade: ['Fade', '◐'], fly: ['Fly Out', '⇩', ['To Bottom', 'To Left', 'To Right', 'To Top']], float: ['Float Out', '⤋'], split: ['Split', '⇔'], wipe: ['Wipe', '◀', ['From Bottom', 'From Left', 'From Right', 'From Top']], shape: ['Shape', '◯'], zoom: ['Zoom', '⊖'], spin: ['Spin Out', '↺'], bounce: ['Bounce', '⤓'] },
    path: { lines: ['Lines', '↓', ['Down', 'Left', 'Right', 'Up']], arcs: ['Arcs', '⌒', ['Down', 'Up']], turns: ['Turns', '↳', ['Down', 'Right']], circle: ['Shapes', '○', ['Circle', 'Square']], loops: ['Loops', '∞'] },
  };
  const CAT = { in: ['Entrance', '#2e8b57'], emph: ['Emphasis', '#c19c00'], out: ['Exit', '#c43e1c'], path: ['Motion Paths', '#777'] };
  const animName = (a) => (AN[a.cat] && AN[a.cat][a.eff] ? AN[a.cat][a.eff][0] : a.eff);
  const dirsOf = (a) => (AN[a.cat] && AN[a.cat][a.eff] && AN[a.cat][a.eff][2]) || [];
  function animCssFor(a) {
    const d = a.dir || dirsOf(a)[0] || ''; const dur = (a.dur || 0.5) + 's';
    let v = {}; let name;
    const flyVec = (dd, out) => { let x = '0', y = '0'; if (/Bottom/.test(dd)) y = '120vh'; if (/Top/.test(dd)) y = '-120vh'; if (/Left/.test(dd)) x = '-120vw'; if (/Right/.test(dd)) x = '120vw'; return { '--fx': x, '--fy': y }; };
    if (a.cat === 'in') {
      name = { appear: 'aAppear', fade: 'aFade', fly: 'aFly2', float: d === 'Float Down' ? 'aFloatD' : 'aFloat', split: /Horizontal/.test(d) ? 'aSplitH' : 'aSplit', wipe: 'aWipe2', shape: 'aShape', wheel: 'aWheel', bars: /Vertical/.test(d) ? 'aBarsV' : 'aBars', grow: 'aGrow', zoom: 'aZoom', swivel: 'aSwivel', bounce: 'aBounce', spin: 'aSpin' }[a.eff];
      if (a.eff === 'fly') v = flyVec(d);
      if (a.eff === 'wipe') v = { '--wipe': { 'From Right': 'inset(0 0 0 100%)', 'From Left': 'inset(0 100% 0 0)', 'From Top': 'inset(0 0 100% 0)', 'From Bottom': 'inset(100% 0 0 0)' }[d] || 'inset(100% 0 0 0)' };
      return { css: `${name} ${a.eff === 'appear' ? '0.01s' : dur} ease both`, vars: v, end: null };
    }
    if (a.cat === 'emph') {
      name = { pulse: 'ePulse', colorpulse: 'eColor', teeter: 'eTeeter', spin: d === 'Counterclockwise' ? 'eSpinCC' : 'eSpin', grow: d === 'Smaller' ? 'eShrink' : 'eGrow', desat: 'eDesat', darken: 'eDarken', transp: 'eTransp', bold: 'eBold', wave: 'eWave' }[a.eff];
      return { css: `${name} ${dur} ease ${['grow', 'desat', 'darken', 'transp', 'spin'].includes(a.eff) ? 'forwards' : 'both'}`, vars: {}, end: null };
    }
    if (a.cat === 'out') {
      name = { disappear: 'xGone', fade: 'xFade', fly: 'xFly', float: 'xFloat', split: 'xSplit', wipe: 'xWipe', shape: 'xShape', zoom: 'xZoom', spin: 'xSpin', bounce: 'xBounce' }[a.eff];
      if (a.eff === 'fly') v = flyVec(d.replace('To', 'From'));
      return { css: `${name} ${a.eff === 'disappear' ? '0.01s' : dur} ease forwards`, vars: v, end: 'hide' };
    }
    name = { lines: 'pLine', arcs: 'pArc', turns: 'pTurn', circle: d === 'Square' ? 'pSquare' : 'pCircle', loops: 'pLoop' }[a.eff];
    const ld = { Down: ['0', '160px'], Up: ['0', '-160px'], Left: ['-220px', '0'], Right: ['220px', '0'] }[d] || ['0', '160px'];
    return { css: `${name} ${Math.max(1, a.dur || 2)}s ease-in-out forwards`, vars: { '--px': ld[0], '--py': ld[1] }, end: null };
  }
  function seqOf(s) { if (!s.seq) s.seq = []; return s.seq; }
  function syncLegacy(s) { s.els.forEach((e) => { const a = seqOf(s).find((x) => x.el === e.id && x.cat === 'in'); e.anim = a ? a.eff : (seqOf(s).some((x) => x.el === e.id) ? (seqOf(s).find((x) => x.el === e.id).eff) : null); }); }
  function migrate(pres) {
    pres.slides.forEach((s) => {
      if (!s.seq) s.seq = s.els.filter((e) => e.anim).map((e) => ({ id: nid(), el: e.id, cat: 'in', eff: e.anim === 'wipe' ? 'wipe' : e.anim, dir: '', start: 'click', dur: 0.5, delay: 0 }));
      if (!s.tOpt) s.tOpt = { dur: 0.8, dir: '', sound: '[No Sound]', onClick: true, after: null };
    });
  }
  function applyAnim(cat, eff, add) {
    const o = selId && findEl(selId); if (!o) return toast('Select an object on the slide first.', 'warn');
    commitText(); snap(); const s = slide(); const seq = seqOf(s);
    if (!add) s.seq = seq.filter((a) => a.el !== o.id);
    if (!(cat === 'in' && eff === 'none')) seqOf(s).push({ id: nid(), el: o.id, cat, eff, dir: '', start: 'click', dur: cat === 'path' ? 2 : 0.5, delay: 0 });
    syncLegacy(s); selAnim = seqOf(s).filter((a) => a.el === o.id).slice(-1)[0]?.id || null;
    renderAll(); previewAnim(o);
  }
  let selAnim = null;
  const animsOfSel = () => { const o = selId && findEl(selId); return o ? seqOf(slide()).filter((a) => a.el === o.id) : []; };
  const curAnim = () => { const list = animsOfSel(); return list.find((a) => a.id === selAnim) || list[0] || null; };

  // ---- editor preview ----
  previewAnim = function (o) {
    const s = slide(); const list = seqOf(s).filter((a) => a.el === o.id); if (!list.length) return;
    const n = $(`#slideHost .el[data-id="${o.id}"]`); if (!n) return;
    let t = 0; list.forEach((a) => { setTimeout(() => runAnim(n, a, true), t * 1000); t += (a.delay || 0) + (a.dur || 0.5) + 0.1; });
  };
  function runAnim(n, a, preview) {
    const c = animCssFor(a); n.classList.remove('anim-hidden'); n.style.visibility = '';
    Object.entries(c.vars).forEach(([k, v]) => n.style.setProperty(k, v));
    n.style.animation = 'none'; n.offsetWidth; n.style.animation = c.css;
    if (c.end === 'hide' && preview) setTimeout(() => { n.style.animation = ''; }, ((a.dur || 0.5) + 0.4) * 1000);
  }
  previewTrans = function () { const sl = $('#slideHost .slide'); if (!sl) return; playTrans(sl, slide()); };

  // ========================= SLIDE SHOW ENGINE =========================
  let groups = [], gi = 0, autoTimer = null, playToken = 0;
  function buildGroups(s) {
    const g = []; seqOf(s).forEach((a, i) => { if (a.start === 'click' || !g.length) g.push({ auto: a.start !== 'click' && i === 0, items: [a] }); else g[g.length - 1].items.push(a); });
    return g;
  }
  function playGroup(grp) {
    let t = 0, prevEnd = 0;
    grp.items.forEach((a, k) => {
      const start = k === 0 || a.start === 'with' ? (k === 0 ? 0 : t) : prevEnd;
      const at = start + (a.delay || 0); t = start; prevEnd = at + (a.dur || 0.5);
      const tok = playToken;
      setTimeout(() => {
        if (tok !== playToken) return;
        const n = $(`#showSlide .el[data-id="${a.el}"]`); if (!n) return;
        const c = animCssFor(a); n.classList.remove('anim-hidden');
        Object.entries(c.vars).forEach(([kk, v]) => n.style.setProperty(kk, v));
        n.style.animation = 'none'; n.offsetWidth; n.style.animation = c.css;
        if (c.end === 'hide') setTimeout(() => { if (tok === playToken) n.style.visibility = 'hidden'; }, (a.dur || 0.5) * 1000 + 30);
        const v = n.querySelector('video,audio'); if (v && a.media) v.play().catch(() => {});
      }, at * 1000);
    });
  }
  drawShow = function (withTrans) {
    playToken++; clearTimeout(autoTimer);
    const s = P.slides[showIdx]; const box = $('#showSlide'); box.innerHTML = ''; delete box.dataset.end;
    const k = Math.min(innerWidth / SW, innerHeight / SH);
    box.style.width = SW * k + 'px'; box.style.height = SH * k + 'px';
    const d = slideDOM(s, { forShow: true }); d.style.transform = `scale(${k})`; box.appendChild(d);
    groups = buildGroups(s); gi = 0;
    // objects whose first effect is an entrance start hidden
    const firstOf = {}; seqOf(s).forEach((a) => { if (!(a.el in firstOf)) firstOf[a.el] = a; });
    Object.values(firstOf).forEach((a) => { if (a.cat === 'in') d.querySelector(`.el[data-id="${a.el}"]`)?.classList.add('anim-hidden'); });
    s.els.filter((e) => (e.type === 'video' || e.type === 'audio') && e.opts && e.opts.hide).forEach((e) => d.querySelector(`.el[data-id="${e.id}"]`)?.classList.add('vhide'));
    const tDur = withTrans ? playTrans(box, s) : (box.style.animation = '', 0);
    const tok = playToken;
    setTimeout(() => {
      if (tok !== playToken) return;
      if (groups[0] && groups[0].auto) { playGroup(groups[0]); gi = 1; }
      s.els.filter((e) => (e.type === 'video' || e.type === 'audio') && e.opts && e.opts.start === 'auto').forEach((e) => startMedia(e, d));
      scheduleAuto(s);
    }, tDur * 1000);
    d.querySelectorAll('.el').forEach((el) => { const e = s.els.find((x) => x.id === el.dataset.id); if (e && (e.type === 'video' || e.type === 'audio')) el.addEventListener('click', (ev) => { ev.stopPropagation(); toggleMedia(e, el); }); });
  };
  function scheduleAuto(s) { clearTimeout(autoTimer); const o = s.tOpt || {}; if (o.after != null && o.after !== '') autoTimer = setTimeout(() => { if (!$('#show').hidden) showNext(true); }, Math.max(0, +o.after) * 1000); }
  showNext = function (fromTimer) {
    if ($('#showSlide').dataset.end) return stopShow();
    const s = P.slides[showIdx];
    if (!fromTimer && s.tOpt && s.tOpt.onClick === false && gi >= groups.length) return;
    if (gi < groups.length) { playGroup(groups[gi]); gi++; return; }
    if (showIdx < P.slides.length - 1) { showIdx++; showStep = 0; drawShow(true); } else { playToken++; endShowScreen(); }
  };
  showPrev = function () { if (showIdx > 0) { showIdx--; drawShow(false); playToken++; $$('#showSlide .anim-hidden').forEach((n) => n.classList.remove('anim-hidden')); gi = groups.length; } };
  const _stopShow = stopShow; stopShow = function () { playToken++; clearTimeout(autoTimer); $$('#showSlide video,#showSlide audio').forEach((v) => v.pause()); _stopShow(); };

  // ========================= MEDIA (video / audio) =========================
  const STOCK = {
    ocean: { name: 'Ocean waves', len: 12, draw: (g, t, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#87ceeb'); gr.addColorStop(.5, '#4fa3d1'); gr.addColorStop(1, '#0b4f7c'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(W * .8, H * .2, 28, 0, 7); g.fill(); for (let k = 0; k < 5; k++) { g.fillStyle = `rgba(255,255,255,${.12 + k * .05})`; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 10) g.lineTo(x, H * .55 + k * 26 + Math.sin(x / 50 + t * 2 + k) * 10); g.lineTo(W, H); g.fill(); } } },
    city: { name: 'City time-lapse', len: 10, draw: (g, t, W, H) => { const night = (Math.sin(t / 2) + 1) / 2; g.fillStyle = `rgb(${20 + 200 * (1 - night)},${30 + 170 * (1 - night)},${70 + 160 * (1 - night)})`; g.fillRect(0, 0, W, H); for (let k = 0; k < 14; k++) { const bw = W / 14, bh = H * (.3 + ((k * 37) % 50) / 100); g.fillStyle = '#1c1c28'; g.fillRect(k * bw, H - bh, bw - 4, bh); for (let y = H - bh + 8; y < H - 8; y += 14) for (let x = k * bw + 6; x < (k + 1) * bw - 10; x += 10) { g.fillStyle = (x * y + Math.floor(t * 3)) % 7 < 3 ? `rgba(255,220,120,${night})` : 'rgba(0,0,0,0)'; g.fillRect(x, y, 5, 7); } } } },
    space: { name: 'Planets in space', len: 15, draw: (g, t, W, H) => { g.fillStyle = '#05050f'; g.fillRect(0, 0, W, H); for (let k = 0; k < 120; k++) { g.fillStyle = `rgba(255,255,255,${.3 + .7 * Math.abs(Math.sin(k + t))})`; g.fillRect((k * 97) % W, (k * 53) % H, 2, 2); } g.fillStyle = '#f4a340'; g.beginPath(); g.arc(W / 2, H / 2, 34, 0, 7); g.fill(); const a = t * .8; g.fillStyle = '#4fa3ff'; g.beginPath(); g.arc(W / 2 + Math.cos(a) * 140, H / 2 + Math.sin(a) * 60, 14, 0, 7); g.fill(); g.fillStyle = '#ccc'; g.beginPath(); g.arc(W / 2 + Math.cos(a) * 140 + Math.cos(a * 5) * 26, H / 2 + Math.sin(a) * 60 + Math.sin(a * 5) * 12, 5, 0, 7); g.fill(); } },
    count: { name: 'Countdown 10 s', len: 10, draw: (g, t, W, H) => { g.fillStyle = '#111'; g.fillRect(0, 0, W, H); g.strokeStyle = '#c43e1c'; g.lineWidth = 10; g.beginPath(); g.arc(W / 2, H / 2, H * .32, -Math.PI / 2, -Math.PI / 2 + (t % 1) * 6.283); g.stroke(); g.fillStyle = '#fff'; g.font = `bold ${H * .3}px Segoe UI, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(Math.max(0, 10 - Math.floor(t))), W / 2, H / 2); } },
    leaf: { name: 'Plant growing', len: 12, draw: (g, t, W, H) => { g.fillStyle = '#eaf6e0'; g.fillRect(0, 0, W, H); g.fillStyle = '#7a4a24'; g.fillRect(0, H * .82, W, H * .18); const h = Math.min(1, t / 9) * H * .6; g.strokeStyle = '#2e7d32'; g.lineWidth = 6; g.beginPath(); g.moveTo(W / 2, H * .82); g.quadraticCurveTo(W / 2 + 20 * Math.sin(t), H * .82 - h / 2, W / 2, H * .82 - h); g.stroke(); for (let k = 1; k <= Math.floor(h / 40); k++) { g.fillStyle = '#43a047'; g.beginPath(); g.ellipse(W / 2 + (k % 2 ? 22 : -22), H * .82 - k * 40, 20, 9, k % 2 ? .4 : -.4, 0, 7); g.fill(); } } },
  };
  const blobUrls = {};
  async function mediaUrl(e) {
    if (!e.src || e.src.startsWith('stock:')) return null;
    if (e.src.startsWith('blob:') || e.src.startsWith('data:')) return e.src;
    if (blobUrls[e.src]) return blobUrls[e.src];
    if (window.desktop && window.desktop.readMedia) { const r = await window.desktop.readMedia(e.src); if (r.ok) { blobUrls[e.src] = URL.createObjectURL(new Blob([r.data], { type: r.mime })); return blobUrls[e.src]; } }
    return null;
  }
  const rafs = new WeakMap();
  function stockPlayer(el, e, playing) {
    const cv = document.createElement('canvas'); cv.width = 480; cv.height = 270; cv.className = 'vcanvas'; el.appendChild(cv);
    const st = STOCK[e.src.slice(6)] || STOCK.ocean; const g = cv.getContext('2d');
    const t0 = (e.opts && e.opts.trimS) || 0; st.draw(g, e.poster != null ? e.poster : t0, 480, 270);
    cv.play = () => { const start = performance.now(); const end = (e.opts && e.opts.trimE) || st.len; const loop = () => { const t = t0 + (performance.now() - start) / 1000; if (t > end) { if (e.opts && e.opts.loop) { cv.play(); return; } cv.playing = false; return; } st.draw(g, t, 480, 270); el.querySelector('.vbar i') && (el.querySelector('.vbar i').style.width = ((t - t0) / (end - t0)) * 100 + '%'); rafs.set(cv, requestAnimationFrame(loop)); }; cv.playing = true; loop(); };
    cv.pause = () => { cancelAnimationFrame(rafs.get(cv)); cv.playing = false; };
    if (playing) cv.play();
    return cv;
  }
  function startMedia(e, root) { const el = root.querySelector(`.el[data-id="${e.id}"]`); if (!el) return; el.classList.remove('vhide'); const v = el.querySelector('video,audio,canvas'); if (v) { if (e.opts && e.opts.full && v.tagName !== 'AUDIO') el.classList.add('vfull'); v.play && v.play()?.catch?.(() => {}); } }
  function toggleMedia(e, el) { const v = el.querySelector('video,audio,canvas'); if (!v) return; if (v.tagName === 'CANVAS' ? v.playing : !v.paused) v.pause(); else { el.classList.remove('vhide'); v.play(); } }
  function renderMedia(el, e, forShow) {
    el.classList.add(e.type === 'audio' ? 'aud' : 'vid');
    if (e.type === 'audio') { el.innerHTML = '<div class="audico">🔊</div>'; mediaUrl(e).then((u) => { if (u) { const a = document.createElement('audio'); a.src = u; a.loop = !!(e.opts && e.opts.loop); el.appendChild(a); } }); if (!forShow) el.insertAdjacentHTML('beforeend', '<div class="vbar"><b>▶</b><i></i></div>'); return; }
    if (e.src && e.src.startsWith('stock:')) stockPlayer(el, e, false);
    else { const v = document.createElement('video'); v.muted = false; v.playsInline = true; v.loop = !!(e.opts && e.opts.loop); v.preload = 'metadata'; el.appendChild(v); mediaUrl(e).then((u) => { if (u) { v.src = u + (e.opts && (e.opts.trimS || e.opts.trimE) ? `#t=${e.opts.trimS || 0}${e.opts.trimE ? ',' + e.opts.trimE : ''}` : ''); v.volume = { low: .3, medium: .6, high: 1, mute: 0 }[(e.opts && e.opts.vol) || 'high']; } else el.insertAdjacentHTML('beforeend', '<div class="vmiss">Video file not found</div>'); }); }
    if (!forShow) { el.insertAdjacentHTML('beforeend', '<div class="vbar"><b>▶</b><i></i><span>' + (e.name || 'Video') + '</span></div>'); const b = el.querySelector('.vbar b'); b.addEventListener('mousedown', (ev) => { ev.stopPropagation(); ev.preventDefault(); toggleMedia(e, el); }); }
    applyPicFx(el, e, '.vcanvas,video');
  }
  async function insertVideo(kind) {
    let src, name;
    if (kind === 'file') {
      if (window.desktop && window.desktop.openMedia) { const r = await window.desktop.openMedia('video'); if (!r.ok) return; src = r.path; name = r.name; blobUrls[src] = URL.createObjectURL(new Blob([r.data], { type: r.mime })); }
      else { const f = await new Promise((res) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'video/*'; i.onchange = () => res(i.files[0]); i.click(); }); if (!f) return; src = URL.createObjectURL(f); name = f.name; }
    } else {
      const r = await modal(`<h3>Stock Videos</h3><div class="stockgrid">${Object.entries(STOCK).map(([k, v], i) => `<label class="stk"><input type="radio" name="stk" value="${k}" ${i ? '' : 'checked'}><canvas data-k="${k}" width="160" height="90"></canvas><span>${v.name} · 0:${String(v.len).padStart(2, '0')}</span></label>`).join('')}</div>`, [['Cancel'], ['Insert', 'primary']]);
      // (the canvases are drawn below by the observer)
      if (r.i !== 1) return; const k = Object.keys(STOCK)[r.v.findIndex((x) => x === true)] || 'ocean'; src = 'stock:' + k; name = STOCK[k].name;
    }
    addEl({ type: 'video', src, name, x: 240, y: 110, w: 480, h: 270, st: {}, fx: {}, opts: { start: 'click', vol: 'high', loop: false, rewind: false, full: false, hide: false, trimS: 0, trimE: 0, fadeIn: 0, fadeOut: 0 } });
    PRO.showCtx('playback', true, true);
  }
  new MutationObserver(() => { $$('.stockgrid canvas:not([data-done])').forEach((c) => { c.dataset.done = 1; STOCK[c.dataset.k].draw(c.getContext('2d'), 2, 160, 90); }); }).observe(document.body, { childList: true, subtree: true });
  async function insertAudio() {
    if (window.desktop && window.desktop.openMedia) { const r = await window.desktop.openMedia('audio'); if (!r.ok) return; blobUrls[r.path] = URL.createObjectURL(new Blob([r.data], { type: r.mime })); addEl({ type: 'audio', src: r.path, name: r.name, x: 450, y: 240, w: 60, h: 60, st: {}, opts: { start: 'click', vol: 'high', loop: false } }); }
    else { const f = await new Promise((res) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'audio/*'; i.onchange = () => res(i.files[0]); i.click(); }); if (!f) return; addEl({ type: 'audio', src: URL.createObjectURL(f), name: f.name, x: 450, y: 240, w: 60, h: 60, st: {}, opts: { start: 'click', vol: 'high' } }); }
  }

  // ========================= PICTURE FORMAT =========================
  const PSTYLES = {
    simpleWhite: ['Simple Frame, White', { border: '10px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,.35)' }],
    beveled: ['Beveled Matte, White', { border: '12px solid #f2f2f2', boxShadow: 'inset 0 0 0 2px #ccc, 0 4px 10px rgba(0,0,0,.35)' }],
    dropShadow: ['Drop Shadow Rectangle', { boxShadow: '8px 8px 16px rgba(0,0,0,.5)' }],
    rounded: ['Rounded Diagonal Corner, White', { border: '6px solid #fff', borderRadius: '40px 0', boxShadow: '0 3px 8px rgba(0,0,0,.3)' }],
    softEdge: ['Soft Edge Rectangle', { mask: 'radial-gradient(ellipse at center, #000 55%, transparent 75%)' }],
    reflected: ['Reflected Rounded Rectangle', { borderRadius: '16px', reflect: true }],
    oval: ['Metal Oval', { borderRadius: '50%', border: '6px solid #b8b8b8', boxShadow: '0 3px 10px rgba(0,0,0,.4)' }],
    thickBlack: ['Thick Matte, Black', { border: '14px solid #1d1d1d' }],
    rotated: ['Rotated, White', { border: '8px solid #fff', rotate: -6, boxShadow: '0 4px 12px rgba(0,0,0,.35)' }],
  };
  const SHAPES_CLIP = { circle: 'circle(50% at 50% 50%)', ellipse: 'ellipse(50% 50% at 50% 50%)', rounded: 'inset(0 round 18%)', triangle: 'polygon(50% 0, 100% 100%, 0 100%)', diamond: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)', hexagon: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)', star: 'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)', heart: 'polygon(50% 100%, 0 40%, 10% 10%, 30% 0, 50% 15%, 70% 0, 90% 10%, 100% 40%)' };
  const ART = { none: ['None', ''], blur: ['Blur', 'blur(3px)'], pencil: ['Pencil Grayscale', 'grayscale(1) contrast(1.8) brightness(1.15)'], sketch: ['Pencil Sketch', 'grayscale(1) contrast(3) brightness(1.4)'], line: ['Line Drawing', 'grayscale(1) contrast(5) brightness(1.6) invert(.05)'], paint: ['Paint Strokes', 'saturate(2) contrast(1.5)'], glow: ['Glow Diffused', 'blur(1.2px) brightness(1.25) saturate(1.3)'], film: ['Film Grain', 'contrast(1.15) sepia(.25) saturate(.9)'], cement: ['Cement', 'grayscale(.6) contrast(1.4)'], marker: ['Marker', 'saturate(3) contrast(1.8) brightness(1.1)'], glass: ['Glass', 'blur(1px) brightness(1.1) hue-rotate(10deg)'], photocopy: ['Photocopy', 'grayscale(1) contrast(6)'] };
  const RECOLOR = { none: ['No Recolor', ''], gray: ['Grayscale', 'grayscale(1)'], sepia: ['Sepia', 'sepia(1)'], wash: ['Washout', 'contrast(.35) brightness(1.5)'], bw: ['Black and White: 50%', 'grayscale(1) contrast(12)'], blue: ['Blue, Accent color 1 Dark', 'grayscale(1) sepia(1) hue-rotate(180deg) saturate(3)'], orange: ['Orange, Accent color 2 Light', 'grayscale(1) sepia(1) saturate(2.4) brightness(1.15)'], green: ['Green, Accent color 6 Dark', 'grayscale(1) sepia(1) hue-rotate(60deg) saturate(2.5)'] };
  function picFilter(fx) {
    const f = [];
    if (fx.bright) f.push(`brightness(${1 + fx.bright / 100})`); if (fx.contrast) f.push(`contrast(${1 + fx.contrast / 100})`);
    if (fx.sharp) f.push(fx.sharp > 0 ? `contrast(${1 + fx.sharp / 200})` : `blur(${-fx.sharp / 40}px)`);
    if (fx.sat !== undefined && fx.sat !== 100) f.push(`saturate(${fx.sat / 100})`); if (fx.tone) f.push(`sepia(${Math.max(0, (fx.tone - 6500) / 6000)}) hue-rotate(${fx.tone < 6500 ? (6500 - fx.tone) / 40 : 0}deg)`);
    if (fx.recolor && RECOLOR[fx.recolor]) f.push(RECOLOR[fx.recolor][1]); if (fx.art && ART[fx.art]) f.push(ART[fx.art][1]);
    if (fx.glow) f.push(`drop-shadow(0 0 8px ${fx.glow})`);
    return f.join(' ');
  }
  function applyPicFx(el, e, mediaSel = 'img') {
    const fx = e.fx || {}; const m = el.querySelector(mediaSel); if (!m) return;
    const crop = fx.crop || { l: 0, t: 0, r: 0, b: 0 };
    if (crop.l || crop.t || crop.r || crop.b) {
      const wrap = document.createElement('div'); wrap.className = 'cropbox'; m.replaceWith(wrap); wrap.appendChild(m);
      const W = 100 / (1 - crop.l - crop.r), Hh = 100 / (1 - crop.t - crop.b);
      Object.assign(m.style, { position: 'absolute', width: W + '%', height: Hh + '%', left: -crop.l * W + '%', top: -crop.t * Hh + '%', objectFit: 'fill', maxWidth: 'none' });
    }
    const tgt = m.parentElement.classList.contains('cropbox') ? m.parentElement : m;
    m.style.filter = picFilter(fx); m.style.opacity = fx.transp ? 1 - fx.transp / 100 : '';
    if (mediaSel === 'img') m.style.objectFit = crop.l || crop.t || crop.r || crop.b ? 'fill' : (e.fit || 'contain');
    const ps = fx.style && PSTYLES[fx.style] ? PSTYLES[fx.style][1] : {};
    Object.assign(tgt.style, { border: fx.border ? `${fx.border.w || 3}px ${fx.border.dash || 'solid'} ${fx.border.c || '#000'}` : ps.border || '', borderRadius: ps.borderRadius || '', boxShadow: [ps.boxShadow, fx.shadow ? '6px 6px 12px rgba(0,0,0,.5)' : ''].filter(Boolean).join(',') || '', overflow: 'hidden', boxSizing: 'border-box', width: '100%', height: '100%' });
    if (ps.mask || fx.soft) tgt.style.webkitMaskImage = ps.mask || `radial-gradient(ellipse at center, #000 ${70 - (fx.soft || 0)}%, transparent 100%)`;
    if (fx.removeBg) tgt.style.webkitMaskImage = 'radial-gradient(ellipse 42% 48% at 50% 52%, #000 70%, transparent 100%)';
    if (ps.reflect || fx.reflection) el.style.webkitBoxReflect = 'below 4px linear-gradient(transparent 60%, rgba(255,255,255,.45))';
    if (fx.shape && SHAPES_CLIP[fx.shape]) tgt.style.clipPath = SHAPES_CLIP[fx.shape];
    const rot = (e.rot || 0) + (ps.rotate || 0); const flip = `${fx.flipH ? ' scaleX(-1)' : ''}${fx.flipV ? ' scaleY(-1)' : ''}`;
    if (rot || flip) el.style.transform = `rotate(${rot}deg)${flip}`;
    if (fx.alt) m.alt = fx.alt;
  }
  const selPic = () => { const o = selId && findEl(selId); return o && (o.type === 'image' || o.type === 'video') ? o : null; };
  function picChange(fn) { const o = selPic(); if (!o) return toast('Select a picture first.', 'warn'); commitText(); snap(); o.fx = o.fx || {}; fn(o.fx, o); renderAll(); }
  const pct = (v) => (v > 0 ? '+' : '') + v + '%';
  function correctionsMenu(anchor) {
    const o = selPic(); const im = o && (o.src && !o.src.startsWith('stock:') ? o.src : null);
    const thumb = (fx) => im ? `<img src="${im}" style="width:58px;height:40px;object-fit:cover;filter:${picFilter(fx)}">` : `<span style="display:inline-block;width:58px;height:40px;background:linear-gradient(135deg,#6aa9e9,#f2c14e);filter:${picFilter(fx)}"></span>`;
    const sharp = [-50, -25, 0, 25, 50].map((v) => `<span class="pg" data-v="sharp:${v}" title="${v < 0 ? 'Soften' : v > 0 ? 'Sharpen' : 'Sharpen: 0% (Normal)'} ${pct(v)}">${thumb({ sharp: v })}</span>`).join('');
    let bc = ''; for (const b of [-40, -20, 0, 20, 40]) { bc += '<div class="pgrow">'; for (const c of [-40, -20, 0, 20, 40]) bc += `<span class="pg" data-v="bc:${b}:${c}" title="Brightness: ${pct(b)} Contrast: ${pct(c)}">${thumb({ bright: b, contrast: c })}</span>`; bc += '</div>'; }
    dropdown(anchor, `<div class="hd">Sharpen/Soften</div><div class="pgrow">${sharp}</div><div class="hd">Brightness/Contrast</div>${bc}<div class="sep"></div><div class="it" data-v="opts">Picture Corrections Options...</div>`, (v) => {
      if (v === 'opts') return pictureFormatPane();
      const [k, a, b] = v.split(':');
      picChange((fx) => { if (k === 'sharp') fx.sharp = +a; else { fx.bright = +a; fx.contrast = +b; } });
    });
  }
  function colorMenu(anchor) {
    const o = selPic(); const im = o && o.src && !o.src.startsWith('stock:') ? o.src : null;
    const thumb = (fx) => im ? `<img src="${im}" style="width:50px;height:34px;object-fit:cover;filter:${picFilter(fx)}">` : `<span style="display:inline-block;width:50px;height:34px;background:linear-gradient(135deg,#6aa9e9,#f2c14e);filter:${picFilter(fx)}"></span>`;
    dropdown(anchor, `<div class="hd">Color Saturation</div><div class="pgrow">${[0, 33, 66, 100, 200, 300, 400].map((s) => `<span class="pg" data-v="sat:${s}" title="Saturation: ${s}%">${thumb({ sat: s })}</span>`).join('')}</div>
      <div class="hd">Color Tone</div><div class="pgrow">${[4700, 5300, 5900, 6500, 7200, 8800, 11200].map((t) => `<span class="pg" data-v="tone:${t}" title="Temperature: ${t} K">${thumb({ tone: t })}</span>`).join('')}</div>
      <div class="hd">Recolor</div><div class="pgrow" style="flex-wrap:wrap;max-width:440px">${Object.entries(RECOLOR).map(([k, [n]]) => `<span class="pg" data-v="rc:${k}" title="${n}">${thumb({ recolor: k })}</span>`).join('')}</div><div class="sep"></div><div class="it" data-v="opts">Picture Color Options...</div>`, (v) => {
      if (v === 'opts') return pictureFormatPane();
      const [k, a] = v.split(':'); picChange((fx) => { if (k === 'sat') fx.sat = +a; if (k === 'tone') fx.tone = +a === 6500 ? 0 : +a; if (k === 'rc') fx.recolor = a === 'none' ? null : a; });
    });
  }
  function artMenu(anchor) {
    const o = selPic(); const im = o && o.src && !o.src.startsWith('stock:') ? o.src : null;
    const thumb = (k) => im ? `<img src="${im}" style="width:62px;height:42px;object-fit:cover;filter:${ART[k][1]}">` : `<span style="display:inline-block;width:62px;height:42px;background:linear-gradient(135deg,#6aa9e9,#f2c14e);filter:${ART[k][1]}"></span>`;
    dropdown(anchor, `<div class="pgrow" style="flex-wrap:wrap;max-width:300px">${Object.entries(ART).map(([k, [n]]) => `<span class="pg" data-v="${k}" title="${n}">${thumb(k)}</span>`).join('')}</div><div class="sep"></div><div class="it" data-v="opts">Artistic Effects Options...</div>`, (v) => { if (v === 'opts') return pictureFormatPane(); picChange((fx) => { fx.art = v === 'none' ? null : v; }); });
  }
  function pictureFormatPane() {
    const o = selPic(); if (!o) return;
    const fx = o.fx || {};
    const row = (lbl, k, min, max, val, unit = '%') => `<label class="pfr">${lbl}<input type="range" min="${min}" max="${max}" value="${val}" data-k="${k}"><output>${val}${unit}</output></label>`;
    const p = PRO.pane('picPane', 'Format Picture', `<p><b>Picture Corrections</b></p>${row('Sharpness', 'sharp', -100, 100, fx.sharp || 0)}${row('Brightness', 'bright', -100, 100, fx.bright || 0)}${row('Contrast', 'contrast', -100, 100, fx.contrast || 0)}
      <p><b>Picture Color</b></p>${row('Saturation', 'sat', 0, 400, fx.sat ?? 100)}${row('Temperature', 'tone', 1500, 11500, fx.tone || 6500, '')}
      <p><b>Picture Transparency</b></p>${row('Transparency', 'transp', 0, 100, fx.transp || 0)}
      <p><b>Alt Text</b></p><textarea class="rs alt" style="width:100%;height:50px" placeholder="Describe this picture for people who are blind or have low vision">${escapeHtml(fx.alt || '')}</textarea>
      <p><button class="btn" data-a="reset">Reset</button></p>`, { width: 290 });
    let snapped = false;
    p.querySelectorAll('input[type=range]').forEach((r) => (r.oninput = () => { r.nextElementSibling.textContent = r.value + (r.dataset.k === 'tone' ? '' : '%'); const ob = selPic(); if (!ob) return; if (!snapped) { snap(); snapped = true; } ob.fx = ob.fx || {}; ob.fx[r.dataset.k] = r.dataset.k === 'tone' && +r.value === 6500 ? 0 : +r.value; renderStage(); }));
    p.querySelector('.alt').onchange = (e) => { const ob = selPic(); if (ob) { ob.fx = ob.fx || {}; ob.fx.alt = e.target.value; } };
    p.querySelector('[data-a=reset]').onclick = () => { picChange((f, ob) => { ob.fx = {}; }); pictureFormatPane(); };
    p.addEventListener('mouseup', () => renderThumbs());
  }
  async function cropDialog() {
    const o = selPic(); if (!o) return toast('Select a picture first.', 'warn');
    const c = (o.fx && o.fx.crop) || { l: 0, t: 0, r: 0, b: 0 };
    const r = await modal(`<h3>Crop</h3><p class="muted" style="font-size:12px">Crop position (percent of the picture to remove from each side)</p><div class="cropd"><label>Left <input type="number" class="rs" min="0" max="45" value="${Math.round(c.l * 100)}">%</label><label>Right <input type="number" class="rs" min="0" max="45" value="${Math.round(c.r * 100)}">%</label><label>Top <input type="number" class="rs" min="0" max="45" value="${Math.round(c.t * 100)}">%</label><label>Bottom <input type="number" class="rs" min="0" max="45" value="${Math.round(c.b * 100)}">%</label></div>`, [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return;
    const [l, rr, t, b] = r.v.map((x) => Math.max(0, Math.min(45, +x || 0)) / 100);
    picChange((fx, ob) => { const old = fx.crop || { l: 0, t: 0, r: 0, b: 0 }; const fw = (1 - l - rr) / (1 - old.l - old.r), fh = (1 - t - b) / (1 - old.t - old.b); ob.w = Math.round(ob.w * fw); ob.h = Math.round(ob.h * fh); ob.ratio = ob.w / ob.h; fx.crop = { l, t, r: rr, b }; });
  }
  function cropMenu(anchor) {
    dropdown(anchor, `<div class="it" data-v="crop">✂ Crop...</div><div class="it" data-v="shape">Crop to Shape ▸</div><div class="shpgrid">${Object.keys(SHAPES_CLIP).map((k) => `<span data-v="shape:${k}" title="${k}"><i style="clip-path:${SHAPES_CLIP[k]}"></i></span>`).join('')}</div><div class="hd">Aspect Ratio</div>${['1:1', '3:2', '4:3', '16:9', '3:4'].map((x) => `<div class="it" data-v="ar:${x}">${x}</div>`).join('')}<div class="sep"></div><div class="it" data-v="fill">Fill</div><div class="it" data-v="fit">Fit</div><div class="it" data-v="nocrop">Reset crop</div>`, (v) => {
      if (v === 'crop') return cropDialog(); if (v === 'shape') return;
      const [k, a] = v.split(':');
      if (k === 'shape') picChange((fx) => { fx.shape = a; });
      if (k === 'ar') picChange((fx, ob) => { const [x, y] = a.split(':').map(Number); ob.h = Math.round(ob.w * y / x); ob.ratio = x / y; ob.fit = 'cover'; });
      if (v === 'fill') picChange((fx, ob) => { ob.fit = 'cover'; }); if (v === 'fit') picChange((fx, ob) => { ob.fit = 'contain'; });
      if (v === 'nocrop') picChange((fx) => { delete fx.crop; delete fx.shape; });
    });
  }

  // ========================= decorate slideDOM =========================
  const _slideDOM = slideDOM;
  slideDOM = function (s, o = {}) {
    const d = _slideDOM(s, o);
    s.els.forEach((e) => {
      const el = d.querySelector(`.el[data-id="${e.id}"]`); if (!el) return;
      if (e.type === 'image') { if (e.fit) el.querySelector('img').style.objectFit = e.fit; applyPicFx(el, e); }
      if (e.type === 'video' || e.type === 'audio') renderMedia(el, e, o.forShow);
      if (e.rot && e.type !== 'image') el.style.transform = `rotate(${e.rot}deg)`;
    });
    if (o.interactive) {
      d.querySelectorAll('.animTag').forEach((t) => t.remove());
      let n = 0; const tags = {};
      seqOf(s).forEach((a, i) => { if (a.start === 'click' || i === 0) n += a.start === 'click' ? 1 : 0; (tags[a.el] = tags[a.el] || []).push(a.start === 'click' ? n : n || 0); });
      Object.entries(tags).forEach(([id, ns]) => { const el = d.querySelector(`.el[data-id="${id}"]`); if (el) { const t = document.createElement('div'); t.className = 'animTag'; t.textContent = [...new Set(ns)].join(','); el.appendChild(t); } });
    }
    return d;
  };

  // ========================= RIBBON =========================
  function animGalleryHTML() {
    const o = selId && findEl(selId); const list = o ? seqOf(slide()).filter((a) => a.el === o.id) : [];
    const curA = list.find((a) => a.id === selAnim) || list[0];
    const items = [['in', 'none'], ['in', 'appear'], ['in', 'fade'], ['in', 'fly'], ['in', 'float'], ['in', 'split'], ['in', 'wipe'], ['in', 'shape'], ['in', 'wheel'], ['in', 'zoom'], ['in', 'bounce'], ['emph', 'pulse'], ['emph', 'spin'], ['out', 'fade'], ['out', 'fly']];
    return items.map(([c, k]) => { const nm = k === 'none' ? 'None' : AN[c][k][0]; const ic = k === 'none' ? '∅' : AN[c][k][1]; const on = k === 'none' ? !list.length : curA && curA.cat === c && curA.eff === k; return `<div class="galbtn ${on ? 'on' : ''}" data-cat="${c}" data-eff="${k}" style="${o ? '' : 'opacity:.45'}"><div style="font-size:20px;color:${CAT[c][1]}">${ic}</div>${nm}</div>`; }).join('') + '<div class="galbtn galmore" id="btnAnimMore">▾<br>More</div>';
  }
  function allAnimMenu(anchor, add) {
    dropdown(anchor, Object.entries(AN).map(([c, effs]) => `<div class="hd">${CAT[c][0]}</div><div class="animgrid">${Object.entries(effs).map(([k, [n, ic]]) => `<div class="ag" data-v="${c}:${k}"><b style="color:${CAT[c][1]}">${ic}</b>${n}</div>`).join('')}</div>`).join('') + '<div class="sep"></div><div class="it" data-v="more:in">More Entrance Effects...</div><div class="it" data-v="more:emph">More Emphasis Effects...</div><div class="it" data-v="more:out">More Exit Effects...</div>', (v) => {
      const [c, k] = v.split(':'); if (c === 'more') return toast('All available effects are shown in this gallery.', 'info');
      applyAnim(c, k, add);
    });
  }
  function transGalleryHTML() { const s = slide(); return Object.entries(TR).map(([k, [n, ic]]) => `<div class="galbtn ${s.transition === k ? 'on' : ''}" data-trans="${k}"><div style="font-size:20px">${ic}</div>${n}</div>`).join(''); }
  const _renderGalleries = renderGalleries;
  renderGalleries = function () {
    _renderGalleries();
    $('#transGallery').innerHTML = transGalleryHTML();
    $('#animGallery').innerHTML = animGalleryHTML();
    $('#btnAnimMore') && ($('#btnAnimMore').onclick = (e) => { e.stopPropagation(); allAnimMenu($('#btnAnimMore'), false); });
    const s = slide(); s.tOpt = s.tOpt || { dur: 0.8, sound: '[No Sound]', onClick: true, after: null };
    if ($('#tDur')) { $('#tDur').value = (s.tOpt.dur || 0.8).toFixed(2); $('#tSound').value = s.tOpt.sound || '[No Sound]'; $('#tClick').checked = s.tOpt.onClick !== false; $('#tAfterOn').checked = s.tOpt.after != null && s.tOpt.after !== ''; $('#tAfter').value = s.tOpt.after != null && s.tOpt.after !== '' ? (+s.tOpt.after).toFixed(2) : '00.00'; }
    const a = curAnim();
    if ($('#aStart')) { $('#aStart').value = a ? a.start : 'click'; $('#aDur').value = a ? (+a.dur).toFixed(2) : '00.50'; $('#aDelay').value = a ? (+a.delay).toFixed(2) : '00.00'; ['#aStart', '#aDur', '#aDelay', '#btnEarlier', '#btnLater', '#btnAnimEff'].forEach((x) => ($(x).disabled = !a)); }
    // contextual tabs
    const o = selId && findEl(selId);
    PRO.showCtx('picfmt', !!(o && o.type === 'image'));
    PRO.showCtx('playback', !!(o && (o.type === 'video' || o.type === 'audio')));
    PRO.showCtx('vidfmt', !!(o && o.type === 'video'));
    if (o && (o.type === 'image' || o.type === 'video')) { if ($('#pH')) { $('#pH').value = (o.h / 72).toFixed(2) + '"'; $('#pW').value = (o.w / 72).toFixed(2) + '"'; } }
    if (o && (o.type === 'video' || o.type === 'audio')) { const op = o.opts || {}; if ($('#vStart')) { $('#vStart').value = op.start || 'click'; $('#vFull').checked = !!op.full; $('#vHide').checked = !!op.hide; $('#vLoop').checked = !!op.loop; $('#vRewind').checked = !!op.rewind; $('#vFadeIn').value = (+op.fadeIn || 0).toFixed(2); $('#vFadeOut').value = (+op.fadeOut || 0).toFixed(2); } }
    if ($('#animPane')) animPane(true);
  };
  function animPane(refresh) {
    const s = slide(); const seq = seqOf(s);
    const nameOf = (id) => { const e = s.els.find((x) => x.id === id); if (!e) return '?'; const t = (e.html || '').replace(/<[^>]+>/g, '').trim(); return e.ph ? (e.ph === 'title' ? 'Title ' : e.ph === 'subtitle' ? 'Subtitle ' : 'Content Placeholder ') + (s.els.indexOf(e) + 1) + (t ? ': ' + t.slice(0, 18) : '') : e.type === 'image' ? 'Picture ' + (s.els.indexOf(e) + 1) : e.type === 'video' ? 'Video ' + (s.els.indexOf(e) + 1) : (e.type === 'shape' ? 'Shape ' : 'TextBox ') + (s.els.indexOf(e) + 1); };
    let n = 0;
    const html = `<div class="apbar"><button class="btn" data-a="play">▶ Play ${selAnim ? 'From' : 'All'}</button><span class="sp"></span><button class="btn" data-a="up" title="Move Earlier">▲</button><button class="btn" data-a="down" title="Move Later">▼</button></div>
      <div class="aplist">${seq.map((a, i) => { if (a.start === 'click') n++; return `<div class="api ${a.id === selAnim ? 'on' : ''}" data-id="${a.id}"><span class="apn">${a.start === 'click' ? n : ''}</span><span class="aps" title="${a.start === 'click' ? 'On Click' : a.start === 'with' ? 'With Previous' : 'After Previous'}">${a.start === 'click' ? '🖱' : a.start === 'with' ? '' : '🕘'}</span><b style="color:${CAT[a.cat][1]}">${AN[a.cat][a.eff] ? AN[a.cat][a.eff][1] : '★'}</b><span class="apt">${escapeHtml(nameOf(a.el))}</span><span class="apb" style="width:${Math.max(6, a.dur * 24)}px;margin-left:${a.delay * 24}px;background:${CAT[a.cat][1]}"></span><i data-x="${a.id}" title="Remove">✕</i></div>`; }).join('') || '<p class="muted">Select an object on the slide and choose an animation.</p>'}</div>`;
    const p = refresh && $('#animPane') ? $('#animPane') : PRO.pane('animPane', 'Animation Pane', '', { width: 290 });
    p.querySelector('.spb').innerHTML = html;
    p.querySelectorAll('.api').forEach((it) => (it.onclick = (e) => {
      const a = seq.find((x) => x.id === it.dataset.id); if (!a) return;
      if (e.target.dataset.x) { snap(); s.seq = seq.filter((x) => x.id !== a.id); syncLegacy(s); selAnim = null; renderAll(); return; }
      selAnim = a.id; selId = a.el; renderAll();
    }));
    p.querySelector('[data-a=play]').onclick = () => { renderStage(); const order = selAnim ? seq.slice(seq.findIndex((x) => x.id === selAnim)) : seq; let t = 0; order.forEach((a) => { const n2 = $(`#slideHost .el[data-id="${a.el}"]`); if (n2) setTimeout(() => runAnim(n2, a, true), t * 1000); t += (a.start === 'with' ? 0 : (a.dur || .5)) + (a.delay || 0); }); };
    p.querySelector('[data-a=up]').onclick = () => reorder(-1); p.querySelector('[data-a=down]').onclick = () => reorder(1);
  }
  function reorder(d) { const s = slide(); const seq = seqOf(s); const i = seq.findIndex((x) => x.id === (curAnim() || {}).id); const j = i + d; if (i < 0 || j < 0 || j >= seq.length) return; snap(); [seq[i], seq[j]] = [seq[j], seq[i]]; syncLegacy(s); renderAll(); }
  function setAnimProp(k, v) { const a = curAnim(); if (!a) return; snap(); a[k] = v; syncLegacy(slide()); renderAll(); }
  function effectOptions(anchor) {
    const a = curAnim(); if (!a) return toast('Select an animated object first.', 'warn');
    const dirs = dirsOf(a); if (!dirs.length) return toast('This effect has no options.', 'info');
    dropdown(anchor, '<div class="hd">Direction</div>' + dirs.map((d) => `<div class="it" data-v="${d}">${(a.dir || dirs[0]) === d ? '✓ ' : ''}${d}</div>`).join(''), (v) => { setAnimProp('dir', v); previewAnim(findEl(a.el)); });
  }
  function transEffectOptions(anchor) {
    const s = slide(); const dirs = (TR[s.transition] || [])[2] || [];
    if (!dirs.length) return toast('This transition has no effect options.', 'info');
    dropdown(anchor, dirs.map((d) => `<div class="it" data-v="${d}">${((s.tOpt && s.tOpt.dir) || dirs[0]) === d ? '✓ ' : ''}${d}</div>`).join(''), (v) => { snap(); s.tOpt.dir = v; renderAll(); previewTrans(); });
  }

  function buildRibbon() {
    // Transitions tab
    const tr = $('#rp-trans');
    tr.innerHTML = [
      PRO.grp('Preview', PRO.big('btnTransPreview2', 'trans', 'Preview')),
      `<div class="grp"><div class="gbody" id="transGallery"></div><div class="glabel">Transition to This Slide</div></div>`,
      PRO.grp('&nbsp;', PRO.big('btnTransEff', '⚙', 'Effect<br>Options', 'Effect Options', true)),
      PRO.grp('Timing', `<div class="col" style="gap:4px;padding-top:3px"><label class="ck">🔊 Sound: <select class="rs" id="tSound" style="width:130px">${SOUNDS.map((x) => `<option>${x}</option>`).join('')}</select></label><label class="ck">⏱ Duration: <input class="rs" id="tDur" style="width:56px" value="00.80"></label><button class="rb" id="btnTransAll2">⧉ Apply To All</button></div><div class="col" style="gap:4px;padding-top:3px"><b style="font-size:12px">Advance Slide</b><label class="ck"><input type="checkbox" id="tClick" checked> On Mouse Click</label><label class="ck"><input type="checkbox" id="tAfterOn"> After: <input class="rs" id="tAfter" style="width:56px" value="00.00"></label></div>`),
    ].join(''); applyIcons(tr); PRO.launchers(tr);
    $('#transGallery').addEventListener('click', (e) => { const g = e.target.closest('[data-trans]'); if (!g) return; snap(); const s = slide(); s.transition = g.dataset.trans; s.tOpt = { ...(s.tOpt || {}), dir: '' }; renderAll(); previewTrans(); });
    $('#btnTransPreview2').onclick = () => previewTrans();
    $('#btnTransEff').onclick = () => transEffectOptions($('#btnTransEff'));
    $('#tSound').onchange = (e) => { snap(); slide().tOpt.sound = e.target.value; if (!/^\[/.test(e.target.value)) beep(e.target.value); renderThumbs(); };
    $('#tDur').onchange = (e) => { const v = Math.max(0.01, Math.min(59, parseFloat(e.target.value) || 0.8)); snap(); slide().tOpt.dur = v; renderAll(); };
    $('#tClick').onchange = (e) => { snap(); slide().tOpt.onClick = e.target.checked; };
    $('#tAfterOn').onchange = (e) => { snap(); slide().tOpt.after = e.target.checked ? (parseFloat($('#tAfter').value) || 0) : null; renderThumbs(); };
    $('#tAfter').onchange = (e) => { snap(); slide().tOpt.after = Math.max(0, parseFloat(e.target.value) || 0); $('#tAfterOn').checked = true; renderAll(); };
    $('#btnTransAll2').onclick = () => { snap(); const s = slide(); P.slides.forEach((x) => { x.transition = s.transition; x.tOpt = JSON.parse(JSON.stringify(s.tOpt)); }); renderAll(); toast('Transition applied to all slides.', 'ok'); };
    // Animations tab
    const an = $('#rp-anim');
    an.innerHTML = [
      PRO.grp('Preview', PRO.big('btnAnimPreview2', 'anim', 'Preview')),
      `<div class="grp"><div class="gbody" id="animGallery"></div><div class="glabel">Animation</div></div>`,
      PRO.grp('&nbsp;', PRO.big('btnAnimEff', '⚙', 'Effect<br>Options', 'Effect Options', true)),
      PRO.grp('Advanced Animation', `${PRO.big('btnAddAnim', '✚', 'Add<br>Animation', 'Add Animation', true)}<div class="col">${PRO.small('btnAnimPane', '☰', 'Animation Pane')}${PRO.small('btnTrigger', '⚡', 'Trigger ▾')}${PRO.small('btnAnimPainter', '🖌', 'Animation Painter')}</div>`),
      PRO.grp('Timing', `<div class="col" style="gap:4px;padding-top:3px"><label class="ck">▶ Start: <select class="rs" id="aStart" style="width:120px"><option value="click">On Click</option><option value="with">With Previous</option><option value="after">After Previous</option></select></label><label class="ck">⏱ Duration: <input class="rs" id="aDur" style="width:56px"></label><label class="ck">🕘 Delay: <input class="rs" id="aDelay" style="width:56px"></label></div><div class="col" style="gap:4px;padding-top:3px"><b style="font-size:12px">Reorder Animation</b><button class="rb" id="btnEarlier">▲ Move Earlier</button><button class="rb" id="btnLater">▼ Move Later</button></div>`),
    ].join(''); applyIcons(an); PRO.launchers(an);
    $('#animGallery').addEventListener('click', (e) => { const g = e.target.closest('[data-eff]'); if (!g) return; applyAnim(g.dataset.cat, g.dataset.eff, false); });
    $('#btnAnimPreview2').onclick = () => { const s = slide(); renderStage(); let t = 0; seqOf(s).forEach((a) => { const n = $(`#slideHost .el[data-id="${a.el}"]`); if (n) setTimeout(() => runAnim(n, a, true), t * 1000); t += (a.start === 'with' ? 0 : (a.dur || .5)) + (a.delay || 0); }); };
    $('#btnAnimEff').onclick = () => effectOptions($('#btnAnimEff'));
    $('#btnAddAnim').onclick = () => allAnimMenu($('#btnAddAnim'), true);
    $('#btnAnimPane').onclick = () => ($('#animPane') ? PRO.closePane('animPane') : animPane());
    $('#btnTrigger').onclick = () => dropdown($('#btnTrigger'), '<div class="it" data-v="seq">On Click of ▸</div><div class="it" data-v="bm">On Bookmark ▸</div>', () => toast('Triggers: the effect starts when you click a specific object.', 'info'));
    $('#btnAnimPainter').onclick = () => { const list = animsOfSel(); if (!list.length) return toast('Select an animated object first.', 'warn'); PX.painter = list.map((a) => ({ ...a })); $('#btnAnimPainter').classList.add('on'); toast('Click another object to copy the animation.', 'info'); };
    $('#aStart').onchange = (e) => setAnimProp('start', e.target.value);
    $('#aDur').onchange = (e) => setAnimProp('dur', Math.max(0.01, Math.min(59, parseFloat(e.target.value) || 0.5)));
    $('#aDelay').onchange = (e) => setAnimProp('delay', Math.max(0, Math.min(59, parseFloat(e.target.value) || 0)));
    $('#btnEarlier').onclick = () => reorder(-1); $('#btnLater').onclick = () => reorder(1);
    $('#slideHost').addEventListener('mouseup', () => {
      if (!PX.painter) return; setTimeout(() => { const o = selId && findEl(selId); if (!o) return; snap(); const s = slide(); s.seq = seqOf(s).filter((a) => a.el !== o.id).concat(PX.painter.map((a) => ({ ...a, id: nid(), el: o.id }))); syncLegacy(s); PX.painter = null; $('#btnAnimPainter').classList.remove('on'); renderAll(); previewAnim(o); }, 20);
    });
    // Insert › Media
    PRO.addGroups('insert', PRO.grp('Media', `${PRO.big('btnVideo', '🎬', 'Video', 'Insert Video', true)}${PRO.big('btnAudio', '🔊', 'Audio', 'Insert Audio', true)}${PRO.big('btnScreenRec', '⏺', 'Screen<br>Recording')}`));
    $('#btnVideo').onclick = () => dropdown($('#btnVideo'), '<div class="it" data-v="file">💻 This Device...</div><div class="it" data-v="stock">🎞 Stock Videos...</div><div class="it" data-v="online">🌐 Online Videos...</div>', (v) => { if (v === 'online') return modal('<h3>Online Videos</h3><p>Enter the address of the online video:</p><input class="rs" style="width:100%" placeholder="https://www.youtube.com/watch?v=..."><p class="muted" style="font-size:12px">Online videos need an Internet connection. In the simulator, use Stock Videos or a video on this device.</p>', [['Cancel'], ['Insert', 'primary']]); insertVideo(v); });
    $('#btnAudio').onclick = () => dropdown($('#btnAudio'), '<div class="it" data-v="file">💻 Audio on My PC...</div><div class="it" data-v="rec">🎙 Record Audio...</div>', (v) => (v === 'file' ? insertAudio() : toast('Recording audio needs a microphone.', 'info')));
    $('#btnScreenRec').onclick = () => toast('Screen Recording is not available in the simulator.', 'info');
    // Picture Format contextual tab
    PRO.addTab('picfmt', 'Picture Format', [
      PRO.grp('Adjust', `${PRO.big('pRemoveBg', '✂', 'Remove<br>Background')}${PRO.big('pCorr', '☀', 'Corrections', 'Corrections', true)}${PRO.big('pColor', '🎨', 'Color', 'Color', true)}${PRO.big('pArt', '🖼', 'Artistic<br>Effects', 'Artistic Effects', true)}${PRO.big('pTransp', '◌', 'Transparency', 'Transparency', true)}<div class="col">${PRO.small('pCompress', '🗜', 'Compress Pictures')}${PRO.small('pChange', '🔁', 'Change Picture ▾')}${PRO.small('pReset', '↺', 'Reset Picture ▾')}</div>`),
      PRO.grp('Picture Styles', `<div id="pStyleGal" class="pstylegal">${Object.entries(PSTYLES).map(([k, [n, st]]) => `<div class="psg" data-st="${k}" title="${n}"><i style="${st.border ? `border:${st.border.replace(/\d+px/, (m) => Math.max(2, parseInt(m) / 3) + 'px')};` : ''}${st.borderRadius ? `border-radius:${st.borderRadius === '50%' ? '50%' : '6px'};` : ''}${st.boxShadow ? 'box-shadow:2px 2px 4px rgba(0,0,0,.4);' : ''}${st.rotate ? 'transform:rotate(-6deg);' : ''}"></i></div>`).join('')}</div><div class="col">${PRO.small('pBorder', '▭', 'Picture Border ▾')}${PRO.small('pEffects', '✨', 'Picture Effects ▾')}${PRO.small('pLayout', '▦', 'Picture Layout ▾')}</div>`),
      PRO.grp('Accessibility', PRO.big('pAlt', '💬', 'Alt<br>Text')),
      PRO.grp('Arrange', `<div class="col">${PRO.small('pFwd', '⬆', 'Bring Forward')}${PRO.small('pBack', '⬇', 'Send Backward')}${PRO.small('pSelPane', '☰', 'Selection Pane')}</div><div class="col">${PRO.small('pAlign', '⇔', 'Align ▾')}${PRO.small('pGroup', '⊞', 'Group ▾')}${PRO.small('pRotate', '⟳', 'Rotate ▾')}</div>`),
      PRO.grp('Size', `${PRO.big('pCrop', '⛶', 'Crop', 'Crop', true)}<div class="col" style="gap:4px;padding-top:4px"><label class="ck">↕ Height: <input class="rs" id="pH" style="width:62px"></label><label class="ck">↔ Width: <input class="rs" id="pW" style="width:62px"></label><label class="ck"><input type="checkbox" id="pLock" checked> Lock aspect ratio</label></div>`),
    ].join(''), { ctx: true });
    $('#pRemoveBg').onclick = () => picChange((fx) => { fx.removeBg = !fx.removeBg; toast(fx.removeBg ? 'Background removed. Click Remove Background again to restore it.' : 'Background restored.', 'info'); });
    $('#pCorr').onclick = () => correctionsMenu($('#pCorr')); $('#pColor').onclick = () => colorMenu($('#pColor')); $('#pArt').onclick = () => artMenu($('#pArt'));
    $('#pTransp').onclick = () => dropdown($('#pTransp'), [0, 15, 30, 50, 65, 80, 95].map((v) => `<div class="it" data-v="${v}">Transparency: ${v}%</div>`).join('') + '<div class="sep"></div><div class="it" data-v="opts">Picture Transparency Options...</div>', (v) => (v === 'opts' ? pictureFormatPane() : picChange((fx) => (fx.transp = +v))));
    $('#pCompress').onclick = async () => { const r = await modal('<h3>Compress Pictures</h3><p><b>Compression options:</b></p><p><label><input type="checkbox" checked> Apply only to this picture</label></p><p><label><input type="checkbox" checked> Delete cropped areas of pictures</label></p><p><b>Resolution:</b></p>' + ['High fidelity', 'HD (330 ppi)', 'Print (220 ppi)', 'Web (150 ppi)', 'E-mail (96 ppi)', 'Use default resolution'].map((x, i) => `<p><label><input type="radio" name="cr" ${i === 3 ? 'checked' : ''}> ${x}</label></p>`).join(''), [['Cancel'], ['OK', 'primary']]); if (r.i === 1) picChange((fx) => (fx.compressed = true)); };
    $('#pChange').onclick = () => dropdown($('#pChange'), `<div class="it" data-v="file">From a File...</div><div class="hd">Stock Images</div>${SAMPLE_IMAGES.map((im, i) => `<div class="it" data-v="${i}"><img src="${im.url}" style="width:48px;height:32px"> ${im.name}</div>`).join('')}`, async (v) => { const u = v === 'file' ? await pickImage() : SAMPLE_IMAGES[+v].url; if (u) picChange((fx, o) => { o.src = u; }); });
    $('#pReset').onclick = () => dropdown($('#pReset'), '<div class="it" data-v="r">Reset Picture</div><div class="it" data-v="rs">Reset Picture &amp; Size</div>', (v) => picChange((fx, o) => { o.fx = {}; delete o.fit; o.rot = 0; if (v === 'rs') { o.w = 480; o.h = Math.round(480 / (o.ratio || 1.5)); } }));
    $$('#pStyleGal .psg').forEach((g) => (g.onclick = () => picChange((fx) => { fx.style = fx.style === g.dataset.st ? null : g.dataset.st; })));
    $('#pBorder').onclick = () => { const d = colorPicker($('#pBorder'), (c) => picChange((fx) => { fx.border = c === 'none' ? null : { ...(fx.border || { w: 3 }), c }; }), { none: true, noneLabel: 'No Outline' }); setTimeout(() => { const dd = $('.dropdown'); if (dd) dd.insertAdjacentHTML('beforeend', `<div class="sep"></div><div class="hd">Weight</div>${[1, 3, 6, 10].map((w) => `<div class="it" data-v="w${w}"><span style="display:inline-block;width:60px;border-top:${w}px solid #444;vertical-align:middle"></span> ${w} pt</div>`).join('')}<div class="hd">Dashes</div><div class="it" data-v="dashed">- - - Dashed</div><div class="it" data-v="dotted">· · · Dotted</div>`); }, 0); };
    document.addEventListener('click', (e) => { const it = e.target.closest('.dropdown [data-v^="w"], .dropdown [data-v="dashed"], .dropdown [data-v="dotted"]'); if (!it || !selPic()) return; e.stopPropagation(); e.preventDefault(); const v = it.dataset.v; if (/^w\d+$/.test(v)) picChange((fx) => { fx.border = { c: '#000000', ...(fx.border || {}), w: +v.slice(1) }; }); if (v === 'dashed' || v === 'dotted') picChange((fx) => { fx.border = { c: '#000000', w: 3, ...(fx.border || {}), dash: v }; }); closeDropdown(); }, true);
    $('#pEffects').onclick = () => dropdown($('#pEffects'), '<div class="it" data-v="shadow">🌑 Shadow</div><div class="it" data-v="reflection">🪞 Reflection</div><div class="it" data-v="glow">✨ Glow</div><div class="it" data-v="soft">🌫 Soft Edges</div><div class="it" data-v="bevel">🔲 Bevel</div><div class="sep"></div><div class="it" data-v="none">No Effects</div>', (v) => picChange((fx) => { if (v === 'none') { fx.shadow = fx.reflection = false; fx.glow = null; fx.soft = 0; return; } if (v === 'glow') fx.glow = fx.glow ? null : '#ffc000'; else if (v === 'soft') fx.soft = fx.soft ? 0 : 25; else if (v === 'bevel') fx.style = 'beveled'; else fx[v] = !fx[v]; }));
    $('#pLayout').onclick = () => toast('Picture Layout converts pictures into a SmartArt graphic.', 'info');
    $('#pAlt').onclick = () => pictureFormatPane();
    const order = (d) => { const s = slide(); const i = s.els.findIndex((x) => x.id === selId); const j = i + d; if (i < 0 || j < 0 || j >= s.els.length) return; snap(); [s.els[i], s.els[j]] = [s.els[j], s.els[i]]; renderAll(); };
    $('#pFwd').onclick = () => order(1); $('#pBack').onclick = () => order(-1);
    $('#pSelPane').onclick = () => { const s = slide(); const p = PRO.pane('selPane', 'Selection', s.els.slice().reverse().map((e) => `<div class="api" data-id="${e.id}">${e.type === 'image' ? '🖼' : e.type === 'video' ? '🎬' : 'T'} ${e.ph ? e.ph : e.type} ${s.els.indexOf(e) + 1}</div>`).join(''), { width: 240 }); p.querySelectorAll('.api').forEach((x) => (x.onclick = () => { selId = x.dataset.id; renderAll(); })); };
    $('#pAlign').onclick = () => dropdown($('#pAlign'), ['Align Left', 'Align Center', 'Align Right', 'Align Top', 'Align Middle', 'Align Bottom'].map((x) => `<div class="it" data-v="${x}">${x}</div>`).join(''), (v) => { const o = findEl(selId); if (!o) return; snap(); if (v === 'Align Left') o.x = 0; if (v === 'Align Center') o.x = Math.round((SW - o.w) / 2); if (v === 'Align Right') o.x = SW - o.w; if (v === 'Align Top') o.y = 0; if (v === 'Align Middle') o.y = Math.round((SH - o.h) / 2); if (v === 'Align Bottom') o.y = SH - o.h; renderAll(); });
    $('#pGroup').onclick = () => toast('Select two or more objects to group them.', 'info');
    $('#pRotate').onclick = () => dropdown($('#pRotate'), '<div class="it" data-v="r90">⟳ Rotate Right 90°</div><div class="it" data-v="l90">⟲ Rotate Left 90°</div><div class="it" data-v="fv">⇅ Flip Vertical</div><div class="it" data-v="fh">⇆ Flip Horizontal</div>', (v) => picChange((fx, o) => { if (v === 'r90') o.rot = ((o.rot || 0) + 90) % 360; if (v === 'l90') o.rot = ((o.rot || 0) + 270) % 360; if (v === 'fv') fx.flipV = !fx.flipV; if (v === 'fh') fx.flipH = !fx.flipH; }));
    $('#pCrop').onclick = () => cropMenu($('#pCrop'));
    const sizeIn = (k) => (e) => { const o = selPic(); if (!o) return; const v = Math.max(0.2, parseFloat(e.target.value) || 1) * 72; snap(); if (k === 'h') { o.h = Math.round(v); if ($('#pLock').checked) o.w = Math.round(v * (o.w / (o.h || 1) || o.ratio || 1.5)); } else { const r = o.w / o.h; o.w = Math.round(v); if ($('#pLock').checked) o.h = Math.round(v / r); } renderAll(); };
    $('#pH').onchange = (e) => { const o = selPic(); if (!o) return; const r = o.w / o.h; const v = Math.max(0.2, parseFloat(e.target.value) || 1) * 72; snap(); o.h = Math.round(v); if ($('#pLock').checked) o.w = Math.round(v * r); renderAll(); };
    $('#pW').onchange = sizeIn('w');
    // Playback + Video Format contextual tabs
    PRO.addTab('vidfmt', 'Video Format', [
      PRO.grp('Preview', PRO.big('vPlay2', '▶', 'Play')),
      PRO.grp('Adjust', `${PRO.big('vCorr', '☀', 'Corrections', 'Corrections', true)}${PRO.big('vColor', '🎨', 'Color', 'Color', true)}${PRO.big('vPoster', '🖼', 'Poster<br>Frame', 'Poster Frame', true)}${PRO.big('vResetD', '↺', 'Reset<br>Design')}`),
      PRO.grp('Video Styles', `<div class="pstylegal">${['simpleWhite', 'dropShadow', 'rounded', 'oval', 'thickBlack', 'reflected'].map((k) => `<div class="psg vsg" data-st="${k}" title="${PSTYLES[k][0]}"><i style="border:2px solid #888"></i></div>`).join('')}</div>`),
      PRO.grp('Size', PRO.big('vCrop', '⛶', 'Crop')),
    ].join(''), { ctx: true });
    PRO.addTab('playback', 'Playback', [
      PRO.grp('Preview', PRO.big('vPlay', '▶', 'Play')),
      PRO.grp('Bookmarks', `${PRO.big('vAddBm', '🔖', 'Add<br>Bookmark')}`),
      PRO.grp('Editing', `${PRO.big('vTrim', '✂', 'Trim<br>Video')}<div class="col" style="gap:4px;padding-top:4px"><b style="font-size:12px">Fade Duration</b><label class="ck">Fade In: <input class="rs" id="vFadeIn" style="width:56px"></label><label class="ck">Fade Out: <input class="rs" id="vFadeOut" style="width:56px"></label></div>`),
      PRO.grp('Video Options', `${PRO.big('vVol', '🔊', 'Volume', 'Volume', true)}<div class="col" style="gap:3px;padding-top:3px"><label class="ck">Start: <select class="rs" id="vStart" style="width:150px"><option value="click">In Click Sequence</option><option value="auto">Automatically</option><option value="whenclicked">When Clicked On</option></select></label><label class="ck"><input type="checkbox" id="vFull"> Play Full Screen</label><label class="ck"><input type="checkbox" id="vHide"> Hide While Not Playing</label></div><div class="col" style="gap:3px;padding-top:3px"><label class="ck"><input type="checkbox" id="vLoop"> Loop until Stopped</label><label class="ck"><input type="checkbox" id="vRewind"> Rewind after Playing</label></div>`),
      PRO.grp('Captions', PRO.big('vCaps', '💬', 'Insert<br>Captions')),
    ].join(''), { ctx: true });
    const selMedia = () => { const o = selId && findEl(selId); return o && (o.type === 'video' || o.type === 'audio') ? o : null; };
    const mopt = (k, v) => { const o = selMedia(); if (!o) return; snap(); o.opts = o.opts || {}; o.opts[k] = v; renderAll(); };
    const play = () => { const o = selMedia(); if (!o) return; const el = $(`#slideHost .el[data-id="${o.id}"]`); el && toggleMedia(o, el); };
    $('#vPlay').onclick = play; $('#vPlay2').onclick = play;
    $('#vStart').onchange = (e) => mopt('start', e.target.value);
    $('#vFull').onchange = (e) => mopt('full', e.target.checked); $('#vHide').onchange = (e) => mopt('hide', e.target.checked);
    $('#vLoop').onchange = (e) => mopt('loop', e.target.checked); $('#vRewind').onchange = (e) => mopt('rewind', e.target.checked);
    $('#vFadeIn').onchange = (e) => mopt('fadeIn', Math.max(0, parseFloat(e.target.value) || 0)); $('#vFadeOut').onchange = (e) => mopt('fadeOut', Math.max(0, parseFloat(e.target.value) || 0));
    $('#vVol').onclick = () => dropdown($('#vVol'), ['low', 'medium', 'high', 'mute'].map((x) => `<div class="it" data-v="${x}">${(selMedia()?.opts?.vol || 'high') === x ? '✓ ' : ''}${x[0].toUpperCase() + x.slice(1)}</div>`).join(''), (v) => mopt('vol', v));
    $('#vTrim').onclick = async () => { const o = selMedia(); if (!o) return; const len = o.src.startsWith('stock:') ? (STOCK[o.src.slice(6)] || STOCK.ocean).len : 60; const r = await modal(`<h3>Trim Video</h3><p><b>${escapeHtml(o.name || 'Video')}</b> · Duration: 00:${String(len).padStart(2, '0')}</p><div class="trimbar"><i></i></div><p>Start Time: <input class="rs" type="number" step="0.1" min="0" value="${o.opts.trimS || 0}" style="width:70px"> s &nbsp; End Time: <input class="rs" type="number" step="0.1" min="0" value="${o.opts.trimE || len}" style="width:70px"> s</p>`, [['Cancel'], ['OK', 'primary']]); if (r.i !== 1) return; const s0 = Math.max(0, +r.v[0] || 0), e0 = Math.min(len, Math.max(s0 + 0.5, +r.v[1] || len)); snap(); o.opts.trimS = s0; o.opts.trimE = e0 === len ? 0 : e0; renderAll(); toast(`Video trimmed: ${s0}s – ${e0}s`, 'ok'); };
    $('#vAddBm').onclick = () => mopt('bookmark', 1); $('#vCaps').onclick = () => toast('Insert Captions: choose a .vtt caption file.', 'info');
    $('#vPoster').onclick = () => dropdown($('#vPoster'), '<div class="it" data-v="cur">Current Frame</div><div class="it" data-v="file">Image from File...</div><div class="it" data-v="reset">Reset</div>', async (v) => { const o = selMedia(); if (!o) return; snap(); if (v === 'cur') o.poster = 2 + Math.random() * 4; if (v === 'reset') delete o.poster; if (v === 'file') { const u = await pickImage(); if (u) o.posterImg = u; } renderAll(); });
    $('#vResetD').onclick = () => picChange((fx, o) => { o.fx = {}; });
    $('#vCorr').onclick = () => correctionsMenu($('#vCorr')); $('#vColor').onclick = () => colorMenu($('#vColor')); $('#vCrop').onclick = () => cropDialog();
    $$('.vsg').forEach((g) => (g.onclick = () => picChange((fx) => { fx.style = fx.style === g.dataset.st ? null : g.dataset.st; })));
    // F5 / Shift+F5 should use the new engine (old handler calls startShow which calls drawShow → new)
  }

  // ========================= FILE adapter =========================
  const adapter = {
    app: 'PowerPoint', noun: 'presentation', defaultName: 'Presentation1', blankName: 'Blank Presentation', nativeExt: 'pptx',
    formats: [
      { ext: 'pptx', label: 'PowerPoint Presentation (*.pptx)', desc: 'Uses the PowerPoint Presentation format' },
      { ext: 'pptm', label: 'PowerPoint Macro-Enabled Presentation (*.pptm)' },
      { ext: 'ppt', label: 'PowerPoint 97-2003 Presentation (*.ppt)', desc: 'Compatible with PowerPoint 97-2003' },
      { ext: 'ppsx', label: 'PowerPoint Show (*.ppsx)', desc: 'Automatically opens as a slide show' },
      { ext: 'potx', label: 'PowerPoint Template (*.potx)', desc: 'Starting point for new presentations' },
      { ext: 'pdf', label: 'PDF (*.pdf)', export: true },
      { ext: 'mp4', label: 'MPEG-4 Video (*.mp4)', export: true, hideInExport: true },
      { ext: 'png', label: 'PNG Portable Network Graphics Format (*.png)', export: true, desc: 'Each slide as an image' },
      { ext: 'odp', label: 'OpenDocument Presentation (*.odp)' },
    ],
    templates: Object.entries(THEMES).slice(1, 5).map(([k, t]) => ({ name: t.name, thumb: `<div class="tplslide" style="background:${t.bg};color:${t.title};font-family:${t.font}">${t.name}</div>`, load: () => { loadPres({ theme: k, slides: [makeSlide('title', { title: t.name + ' presentation', subtitle: 'Subtitle' })] }); } })),
    serialize() { commitText(); return JSON.parse(JSON.stringify(P)); },
    load(d) { loadPres(d); }, newBlank() { loadPres(null); }, setName: (n) => setPresName(n),
    stats: () => [['Slides', P.slides.length], ['Hidden slides', 0], ['Words', P.slides.reduce((n, s) => n + s.els.reduce((m, e) => m + ((e.html || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length), 0), 0)], ['Notes', P.slides.filter((s) => s.notes).length]],
    printPreview(box, Pp) {
      const per = { 'Full Page Slides': 1, 'Notes Pages': 1, Outline: 1, '1 Slides Handouts': 1, '2 Slides Handouts': 2, '3 Slides Handouts': 3, '6 Slides Horizontal': 6 }[Pp.layout] || 1;
      const pages = Math.ceil(P.slides.length / per); const land = per === 1 && Pp.layout === 'Full Page Slides';
      const pg = document.createElement('div'); pg.className = 'pvpage pvppt' + (land ? ' land' : ''); pg.style.width = (land ? 240 : 180) + 'px'; pg.style.height = (land ? 186 : 233) + 'px';
      P.slides.slice(0, per).forEach((s) => { const w = document.createElement('div'); w.className = 'pvs' + (per === 3 ? ' h3' : ''); const d = slideDOM(s, { forShow: true }); const sc = (land ? 220 : per === 1 ? 160 : per <= 3 ? 100 : 74) / 960; d.style.transform = `scale(${sc})`; d.style.transformOrigin = '0 0'; w.style.width = 960 * sc + 'px'; w.style.height = 540 * sc + 'px'; w.appendChild(d); pg.appendChild(w); if (per === 3) pg.insertAdjacentHTML('beforeend', '<div class="lines"><i></i><i></i><i></i><i></i></div>'); });
      if (Pp.color !== 'Color') pg.style.filter = Pp.color === 'Grayscale' ? 'grayscale(1)' : 'grayscale(1) contrast(4)';
      box.appendChild(pg); return Pp.what === 'current' ? 1 : pages;
    },
    printWhat: [['all', 'Print All Slides', 'Print entire presentation'], ['sel', 'Print Selection', 'Only print the selected slides'], ['current', 'Print Current Slide', 'Only print the current slide'], ['custom', 'Custom Range', 'Enter specific slides to print']],
    issues: () => [...(P.slides.some((s) => s.notes) ? ['Presentation notes'] : []), ...(P.slides.some((s) => s.els.some((e) => e.type === 'video')) ? ['Embedded media'] : [])],
    inspect: () => [...(P.slides.some((s) => s.notes) ? ['Presentation Notes'] : [])],
    access: () => { const n = P.slides.reduce((k, s) => k + s.els.filter((e) => e.type === 'image' && !(e.fx && e.fx.alt)).length, 0); const t = P.slides.filter((s) => !s.els.some((e) => e.ph === 'title' && (e.html || '').replace(/<[^>]+>/g, '').trim())).length; return (n ? `<p>⚠ <b>Missing alternative text (${n})</b> — select the picture › Picture Format › Alt Text.</p>` : '') + (t ? `<p>⚠ <b>Missing slide title (${t})</b></p>` : '') || '<p>✔ No accessibility issues found.</p>'; },
    setReadOnly: (ro) => document.body.classList.toggle('pptro', ro),
    download: () => { commitText(); saveJSON(presName, 'thp', P); },
  };
  // migrate presentation data whenever a presentation is loaded
  const _loadPres = loadPres;
  loadPres = function (d) { _loadPres(d); migrate(P); P.slides.forEach(syncLegacy); renderAll(); };
  return { TR, AN, adapter, buildRibbon, applyAnim, seqOf, migrate, insertVideo, picFilter, STOCK, animPane, painter: null, setAnimProp, get selAnim() { return selAnim; } };
})();

PX.buildRibbon();
PX.migrate(P); renderAll();
if (typeof PPT_EXERCISES_PRO === 'function') runner.exercises.push(...PPT_EXERCISES_PRO(makeSlide));
Object.assign(api, {
  PX, get FILE() { return Office.FILE; },
  seq: (i) => (P.slides[i] && P.slides[i].seq) || [],
});
Office.init(PX.adapter, runner);
