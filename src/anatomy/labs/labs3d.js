// TinHocLab – Thực hành theo bài (3D). Dùng mô hình bo mạch ASUS TUF Z890, tản nhiệt và ánh sáng của PC Anatomy (MIT).
// Học sinh cầm linh kiện trên khay (bấm vào), đưa tới đúng chỗ trên bo mạch (bấm vào chỗ đó). Sai thì có giải thích.
(function () {
  const ready = () => new Promise((r) => { if (window.__PCLAB) return r(); window.addEventListener('pclab-ready', r, { once: true }); const t = setInterval(() => { if (window.__PCLAB) { clearInterval(t); r(); } }, 100); });
  const $ = (q) => document.querySelector(q);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'thl.labs';
  const loadP = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const saveP = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} };

  document.body.innerHTML = `
  <header id="top"><button class="tb" id="bBack">‹ TinHocLab</button><div class="seg2"><a id="bExplore">🔍 Khám phá phần cứng</a><a class="on">🛠 Thực hành 3D</a></div><div class="title" id="title">Thực hành theo bài</div><span class="spacer"></span><span class="note" id="prog"></span><button class="tb" id="btnList" hidden>☰ Danh sách bài</button></header>
  <main id="home"></main>
  <main id="lab" hidden><aside id="steps"></aside>
    <section id="stageWrap"><div id="view3d"></div><div id="tags"></div><div id="toast"></div>
      <div id="tools3d"><button data-z="0.8" title="Phóng to">＋</button><button data-z="1.25" title="Thu nhỏ">－</button><button id="bView" title="Về góc nhìn của bước">⌖</button><button id="bRot" title="Xoay linh kiện đang cầm (phím R)" hidden>⟳ Xoay</button></div>
      <div id="help3d">Kéo chuột để xoay góc nhìn · lăn chuột để phóng to · bấm vào linh kiện để cầm lên, bấm vào chỗ cần lắp để đặt</div></section>
    <aside id="panel"></aside></main>`;
  $('#bBack').onclick = () => { location.href = '../index.html'; };
  $('#bExplore').onclick = () => { location.href = '../explore/explore.html'; };

  ready().then(start);

  function start() {
    const { T, createStageRuntime, buildModel } = window.__PCLAB;
    const V = (x, y, z) => new T.Vector3(x, y, z);
    let W = null; // thế giới 3D của bài đang mở
    let L = null, st = null;

    // ======================= dựng thế giới =======================
    function canvasTex(w, h, draw) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
    }
    function silk(text, x, z, w = 0.9, rot = 0, size = 46) { // chữ in trắng trên bo mạch
      const tex = canvasTex(512, 96, (g, cw, ch) => { g.fillStyle = 'rgba(230,236,240,.92)'; g.font = `600 ${size}px Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cw / 2, ch / 2); });
      const m = new T.Mesh(new T.PlaneGeometry(w, w * 96 / 512), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, 0.09, z); W.scene.add(m); return m;
    }
    const mat = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1, ...o });
    const boxMesh = (sx, sy, sz, m) => { const b = new T.Mesh(new T.BoxGeometry(sx, sy, sz), m); b.castShadow = true; b.receiveShadow = true; return b; };

    function build(lab) {
      const host = $('#view3d'); host.innerHTML = ''; $('#tags').innerHTML = '';
      const rt = createStageRuntime(host, (m) => toast(m, 'err'));
      const w = { rt, scene: rt.scene, cam: rt.camera, ctl: rt.controls, zones: {}, hots: {}, parts: {}, tags: [], tick: [], anims: [] };
      W = w;
      // bàn làm việc + thảm chống tĩnh điện
      const desk = new T.Mesh(new T.BoxGeometry(46, 0.6, 30), mat('#c9b9a0', { roughness: 0.8 })); desk.position.set(3, -0.42, 0); desk.receiveShadow = true; w.scene.add(desk);
      const matt = new T.Mesh(new T.BoxGeometry(26, 0.06, 19), mat('#2f5f73', { roughness: 0.95 })); matt.position.set(3.2, -0.1, 0.3); matt.receiveShadow = true; w.scene.add(matt);
      // bo mạch chủ
      const m = buildModel('z890'); w.board = m; w.scene.add(m.root);
      m.root.traverse((o) => { if (o.userData.powerTick || o.userData.airflowTick) o.visible = false; if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      m.root.updateMatrixWorld(true);
      w.piece = (key) => m.pieces.find((p) => p.key === key);
      // khung giữ CPU (để mở/đóng): các lớp 7–9 của socket quay quanh bản lề phía sau
      const sock = w.piece('z890socket-0').object;
      const hinge = new T.Group(); hinge.position.copy(sock.worldToLocal(V(0.38, 0.3, -4.44))); sock.add(hinge);
      [7, 8, 9].map((i) => sock.children[i]).filter(Boolean).forEach((c) => { c.position.sub(hinge.position); hinge.add(c); });
      w.hinge = hinge; w.setLever = (open, now) => anim(hinge.rotation, 'x', open ? -1.75 : 0, now ? 0 : 0.6);
      // tam giác vàng đánh dấu góc socket
      const tri = new T.Mesh(new T.CircleGeometry(0.13, 3), new T.MeshBasicMaterial({ color: '#f2c233' })); tri.rotation.set(-Math.PI / 2, 0, Math.PI / 4); tri.position.set(-1.12, 0.1, -1.12); w.scene.add(tri);
      // chữ in trên bo mạch
      ['A1', 'A2', 'B1', 'B2'].forEach((n, i) => silk(n, [2.86, 3.32, 3.77, 4.23][i], -6.05, 0.7));
      silk('LGA1851', 0.38, -4.85, 1.4); silk('M.2_1', -2.9, 0.1, 1.0);
      w.FANS = [['CPU_FAN', 3.1, -6.41], ['CPU_OPT', 3.95, -6.41], ['AIO_PUMP', 5.18, -4.09], ['CHA_FAN1', 5.13, 4.32], ['CHA_FAN2', -2.22, 6.68], ['CHA_FAN3', 2.18, 6.77]];
      w.FANS.forEach(([n, x, z], i) => { silk(n, x, i < 2 ? z - 0.36 : i < 4 ? z - 0.34 : z - 0.36, 1.05); zone('fan' + i, V(x, 0.2, z), V(0.75, 0.5, 0.5), { pos: V(x, 0.36, z), rotY: 0, label: n }); });
      w.FRONT = [['AAFP', -3.23], ['USB_E12', -1.23], ['USB_E34', 0.86], ['F_PANEL', 3.45]];
      w.FRONT.forEach(([n, x], i) => { silk(n, x, 6.3, 1.1); zone('fh' + i, V(x, 0.2, 6.68), V(0.8, 0.5, 0.45), { pos: V(x, 0.45, 6.68), rotY: 0, label: n }); });
      // đầu USB 3.0 (19 chân) ở mép phải
      const u3 = new T.Group(); u3.position.set(5.2, 0.05, 1.05);
      const shroud = boxMesh(0.36, 0.3, 1.36, mat('#1f5fd1', { roughness: 0.45 })); shroud.position.y = 0.15; u3.add(shroud);
      const inner = boxMesh(0.26, 0.31, 1.24, mat('#0d1a33')); inner.position.y = 0.16; u3.add(inner);
      const key = boxMesh(0.06, 0.32, 0.22, mat('#1d3a31')); key.position.set(-0.17, 0.16, 0); u3.add(key);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 10; c++) { if (r === 0 && c === 9) continue; const pin = boxMesh(0.025, 0.2, 0.025, mat('#d8b65a', { metalness: 0.9, roughness: 0.3 })); pin.position.set(-0.055 + r * 0.11, 0.2, -0.56 + c * 0.124); u3.add(pin); }
      w.scene.add(u3); silk('U31G1_12', 4.62, 1.05, 1.1, Math.PI / 2);
      zone('usb3', V(5.2, 0.25, 1.05), V(0.6, 0.6, 1.6), { pos: V(5.2, 0.5, 1.05), rotY: 0, label: 'U31G1_12' });
      w.scene.add(new T.AmbientLight(0xffffff, 0.15));
      fitView(lab.views.start, true);
      return w;
    }
    // vùng thả / điểm bấm (hộp trong suốt dùng để dò chuột)
    function zone(id, c, size, place) {
      const m = new T.Mesh(new T.BoxGeometry(size.x, size.y, size.z), new T.MeshBasicMaterial({ color: '#0a84ff', transparent: true, opacity: 0, depthWrite: false }));
      m.position.copy(c); m.userData.zone = id; W.scene.add(m); W.zones[id] = { id, mesh: m, place, label: place && place.label };
      return W.zones[id];
    }
    function hot(id, c, size) { const z = zone(id, c, size); z.mesh.userData.zone = null; z.mesh.userData.hot = id; W.hots[id] = z; delete W.zones[id]; return z; }
    // đưa một vật thể vào "tay cầm" có tâm ở giữa hình để xoay/di chuyển cho tự nhiên
    function holder(obj, parent = W.scene) {
      obj.updateMatrixWorld(true);
      const b = new T.Box3().setFromObject(obj); const c = b.getCenter(new T.Vector3());
      const h = new T.Group(); h.position.copy(c); parent.add(h);
      const wm = obj.matrixWorld.clone(); h.updateMatrixWorld(true);
      obj.removeFromParent(); h.add(obj);
      obj.matrix.copy(h.matrixWorld.clone().invert().multiply(wm)); obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
      return { h, size: b.getSize(new T.Vector3()) };
    }
    function part(id, obj, o) {
      const { h, size } = obj.isGroup && o.wrapped ? { h: obj, size: o.size } : holder(obj);
      const p = { id, h, size, inst: { pos: h.position.clone(), rotY: 0 }, rotY: 0, placed: true, rotStep: 180, ...o };
      h.userData.part = id; h.traverse((x) => { x.userData.part = id; });
      W.parts[id] = p; return p;
    }
    const setHome = (p, x, z, rotY = 0) => { p.home = { pos: V(x, p.wrapped ? -0.06 : p.size.y / 2 - 0.07, z), rotY }; };
    function toHome(p, now) { p.placed = null; p.rotY = p.home.rotY; move(p, p.home.pos, p.home.rotY, now ? 0 : 0.45); }
    function toPlace(p, pos, rotY, zoneId, now) { p.placed = zoneId; p.rotY = rotY; move(p, pos, rotY, now ? 0 : 0.45); }
    function move(p, pos, rotY, dur) {
      if (!dur) { p.h.position.copy(pos); p.h.rotation.y = rotY * Math.PI / 180; return; }
      const from = p.h.position.clone(), r0 = p.h.rotation.y, r1 = rotY * Math.PI / 180, lift = Math.max(from.y, pos.y) + 0.8;
      W.anims.push({ t: 0, dur, f: (k) => { const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; p.h.position.lerpVectors(from, pos, e); p.h.position.y += Math.sin(Math.PI * e) * (lift - Math.max(from.y, pos.y)); p.h.rotation.y = r0 + (r1 - r0) * e; } });
    }
    function anim(obj, prop, to, dur) { const from = obj[prop]; if (!dur) { obj[prop] = to; return; } W.anims.push({ t: 0, dur, f: (k) => { obj[prop] = from + (to - from) * (1 - Math.pow(1 - k, 3)); } }); }
    function tag(text, getPos, cls = '') { const el = document.createElement('div'); el.className = 'tag3 ' + cls; el.textContent = text; $('#tags').appendChild(el); const t = { el, getPos }; W.tags.push(t); return t; }

    // ---------- tản nhiệt (mô hình "cooler" của PC Anatomy, thu nhỏ theo tỉ lệ bo mạch) ----------
    function addCooler() {
      const cm = buildModel('cooler'); const g = new T.Group(); cm.root.scale.setScalar(0.4); cm.root.position.y = -0.056; g.add(cm.root);
      cm.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      const back = cm.pieces.find((p) => p.concept === 'coolermount'); if (back && back.object.children[0]) back.object.children[0].visible = false; // tấm đỡ sau lưng bo mạch
      W.scene.add(g); g.position.set(0.36, 0.39, -2.91);
      const paste = cm.pieces.find((p) => p.concept === 'coolerpaste'); W.coolerPaste = paste && paste.object;
      // 4 vít/chốt ở 4 góc
      W.screws = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], i) => {
        const s = new T.Group(); s.position.set(sx * 1.52, 0.62, sz * 1.52);
        const head = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.14, 20), mat('#c9cdd2', { metalness: 0.85, roughness: 0.3 })); head.castShadow = true; s.add(head);
        const slot = new T.Mesh(new T.BoxGeometry(0.22, 0.03, 0.04), mat('#555')); slot.position.y = 0.075; s.add(slot);
        g.add(s); s.userData.screw = i; s.traverse((x) => (x.userData.screw = i));
        return s;
      });
      const p = part('cooler', g, { wrapped: true, size: V(5.2, 6.3, 5.2), label: 'Tản nhiệt CPU', rotStep: 90 });
      p.inst = { pos: V(0.36, 0.39, -2.91), rotY: 0 };
      p.fanAnchor = V(2.2, 2.4, 1.6);
      return p;
    }
    function addFanPlug() {
      const g = new T.Group();
      const body = boxMesh(0.5, 0.2, 0.22, mat('#f1f1ef', { roughness: 0.6 })); body.position.y = 0.1; g.add(body);
      ['#111', '#c42020', '#e6c01c', '#2456c8'].forEach((c, i) => { const wv = boxMesh(0.05, 0.05, 0.12, mat(c)); wv.position.set(-0.17 + i * 0.113, 0.13, 0.15); g.add(wv); });
      W.scene.add(g);
      const p = part('fanplug', g, { wrapped: true, size: V(0.5, 0.25, 0.3), label: 'Dây quạt CPU', rotStep: 180 });
      // dây cáp từ quạt tới đầu cắm
      const cab = new T.Mesh(new T.BufferGeometry(), mat('#1b1b1b', { roughness: 0.7 })); cab.castShadow = true; W.scene.add(cab);
      let last = '';
      W.tick.push(() => {
        const c = W.parts.cooler; const show = c && p.h.visible && c.h.visible;
        cab.visible = !!show; if (!show) return;
        const a = c.fanAnchor.clone().applyMatrix4(c.h.matrixWorld), b = p.h.position.clone().add(V(0, 0.12, 0.2));
        const k = a.toArray().map((v) => v.toFixed(2)).join() + b.toArray().map((v) => v.toFixed(2)).join(); if (k === last) return; last = k;
        const mid = a.clone().lerp(b, 0.5); mid.y = Math.max(a.y, b.y) + 0.6;
        cab.geometry.dispose(); cab.geometry = new T.TubeGeometry(new T.CatmullRomCurve3([a, V(a.x, a.y - 0.4, a.z + 0.3), mid, V(b.x, b.y + 0.5, b.z + 0.5), b]), 40, 0.045, 6);
      });
      return p;
    }
    // ---------- đầu cắm dây mặt trước của vỏ máy ----------
    function addConnector(id, label, w, color, pol, wires) {
      const g = new T.Group();
      const body = boxMesh(w, 0.24, 0.12, mat(color === 'usb3' ? '#1f5fd1' : '#1c1c1e', { roughness: 0.5 })); body.position.y = 0.12; g.add(body);
      if (pol) { const plus = new T.Mesh(new T.CircleGeometry(0.035, 3), new T.MeshBasicMaterial({ color: '#ffffff' })); plus.rotation.x = -Math.PI / 2; plus.position.set(-w / 4, 0.245, 0); g.add(plus); }
      (wires || []).forEach((c, i) => { const wv = boxMesh(0.04, 0.04, 0.5, mat(c)); wv.position.set(-w / 2 + (i + 0.5) * w / wires.length, 0.12, 0.3); g.add(wv); });
      W.scene.add(g);
      const p = part(id, g, { wrapped: true, size: V(w, 0.24, 0.6), label, rotStep: 180, pol });
      return p;
    }

    // ======================= dữ liệu bài =======================
    const FAN_RULES = { fan0: true,
      fan1: 'CPU_OPT dành cho quạt thứ hai của tản nhiệt. Quạt chính phải cắm vào CPU_FAN – nếu không, máy báo lỗi “CPU Fan Error” khi khởi động.',
      fan2: 'AIO_PUMP dành cho bơm của tản nước. Quạt tản khí cắm vào CPU_FAN.',
      fan3: 'CHA_FAN dành cho quạt của vỏ máy. Quạt tản CPU phải cắm vào CPU_FAN để bo mạch chỉnh tốc độ theo nhiệt độ CPU.',
      fan4: 'CHA_FAN dành cho quạt của vỏ máy, không dành cho quạt CPU.', fan5: 'CHA_FAN dành cho quạt của vỏ máy, không dành cho quạt CPU.' };
    const fanRot = (p) => p.rotY % 360 === 0 || 'Đầu cắm quạt có gờ định vị – gờ phải khớp với thanh nhựa trên đế. Bấm “⟳ Xoay” (hoặc phím R) khi đang cầm.';
    const VIEWS = {
      start: { t: [3.6, 0, 0.4], o: [2.5, 21, 18] },
      socket: { t: [3.8, 0.3, -3.2], o: [1.0, 10, 8] },
      dimm: { t: [5.4, 0.4, -2.0], o: [3.0, 9.5, 9.0] },
      m2: { t: [3.5, 0.3, 0.2], o: [0.6, 10, 8.5] },
      bench: { t: [6.5, 0, -1], o: [1.5, 17, 14] },
      cooler: { t: [2.5, 1.5, -2.4], o: [6, 9.5, 10] },
      fan: { t: [5.8, 0.4, -4.8], o: [1.5, 7.5, 6.5] },
      bottom: { t: [0.6, 0.2, 6.3], o: [0.2, 4.2, 3.6] },
      fpanel: { t: [3.45, 0.2, 6.6], o: [0.1, 2.0, 1.6] },
      usb3: { t: [5.1, 0.3, 1.1], o: [2.6, 3.2, 1.2] },
      cpu: { t: [0.4, 0.4, -2.9], o: [0.6, 3.8, 3.0] },
      socketC: { t: [0.4, 0.3, -2.9], o: [1.0, 5.6, 4.6] },
      dimmC: { t: [3.6, 0.5, -2.4], o: [2.6, 6.5, 6.0] },
      m2C: { t: [-0.4, 0.3, 0.6], o: [0.5, 4.8, 4.4] },
      fanC: { t: [3.4, 0.4, -6.2], o: [0.8, 3.4, 3.2] },
      fpanelBench: { t: [3.4, 0.2, 7.7], o: [0, 4.6, 3.8] },
      usb3Bench: { t: [6.2, 0.3, 2.5], o: [2.2, 6.5, 4.5] },
      bottomBench: { t: [-0.6, 0.2, 7.6], o: [0, 5.8, 4.6] },
    };

    const LABS = [
      { id: 'motherboard', no: 1, icon: '🧩', minutes: 10, title: 'Lắp linh kiện lên bo mạch chủ',
        desc: 'Lắp CPU Intel Core Ultra (socket LGA1851), 2 thanh RAM DDR5 chạy kênh đôi, SSD M.2 và tản nhiệt lên bo mạch ASUS TUF Z890 – làm trên bàn, trước khi đưa vào vỏ.',
        views: VIEWS,
        setup(w) {
          const cpu = part('cpu', w.piece('z890cpu-0').object, { label: 'CPU Intel Core Ultra' });
          const tri = new T.Mesh(new T.CircleGeometry(0.11, 3), new T.MeshBasicMaterial({ color: '#f2c233' })); tri.rotation.set(-Math.PI / 2, 0, Math.PI / 4); tri.position.set(-0.72, 0.1, 0.9); cpu.h.add(tri);
          const r1 = part('ram1', w.piece('z890ram-0').object, { label: 'RAM DDR5' }), r2 = part('ram2', w.piece('z890ram-1').object, { label: 'RAM DDR5' });
          const nv = part('m2', w.piece('z890nvme-0').object, { label: 'SSD M.2' });
          const hs = part('m2hs', w.piece('z890m2heatsink-0').object, { label: 'Tấm tản nhiệt M.2' });
          const cool = addCooler(); const plug = addFanPlug();
          setHome(cpu, 11.6, -5.6, 180); setHome(r1, 8.4, 1.0, 0); setHome(r2, 10.2, 1.0, 180); setHome(nv, 12.8, -1.8, 180); setHome(hs, 11.4, 5.4, 0);
          // RAM nằm ngang trên khay
          cool.home = { pos: V(8.8, -0.07, -5.6), rotY: 0 }; plug.home = { pos: V(7.3, -0.07, -3.6), rotY: 180 };
          [cpu, r1, r2, nv, cool].forEach((p) => toHome(p, true));
          hs.inst = { pos: hs.h.position.clone(), rotY: 0 }; toHome(hs, true);
          plug.h.visible = false; toHome(plug, true);
          // RAM đặt nằm trên khay cho tự nhiên
          [r1, r2].forEach((r) => { r.lay = true; r.h.rotation.z = Math.PI / 2; r.home.pos.y = 0.1; r.h.position.y = 0.1; });
          w.setLever(false, true);
          ['dimm0', 'dimm1', 'dimm2', 'dimm3'].forEach((id, i) => zone(id, V([2.86, 3.32, 3.77, 4.23][i], 0.4, -2.64), V(0.4, 0.9, 6.3), { pos: V([2.86, 3.32, 3.77, 4.23][i], 0.89 + 0.08, -2.64), rotY: 0, label: ['A1', 'A2', 'B1', 'B2'][i] }));
          zone('socket', V(0.38, 0.3, -2.91), V(2.7, 0.6, 3.3), { pos: cpu.inst.pos.clone(), rotY: 0 });
          zone('m2', V(-0.45, 0.25, 0.5), V(3.9, 0.4, 1.1), { pos: nv.inst.pos.clone(), rotY: 0, label: 'M.2_1' });
          hot('lever', V(1.62, 0.35, -2.9), V(0.35, 0.5, 3.2));
          hot('m2screw', V(1.32, 0.25, 0.5), V(0.45, 0.4, 0.45));
          W.zones.socket.place.cooler = { pos: cool.inst.pos.clone(), rotY: 0 };
        },
        steps: [
          { type: 'choose', view: 'start', title: 'Chống tĩnh điện', do: 'Trước khi chạm vào linh kiện, em chuẩn bị chỗ làm thế nào?',
            opts: [
              { t: 'Đeo vòng chống tĩnh điện (hoặc chạm tay vào khung kim loại có nối đất), làm trên thảm chống tĩnh điện như trên bàn này', ok: true },
              { t: 'Đặt bo mạch lên thảm len hoặc áo len cho êm', why: 'Len, nỉ, thảm dễ sinh tĩnh điện. Một tia tĩnh điện có thể làm hỏng linh kiện mà không để lại dấu vết gì.' },
              { t: 'Không cần, linh kiện mới rất bền', why: 'Linh kiện bán dẫn rất nhạy với tĩnh điện, kể cả khi còn mới.' }],
            real: 'Thợ thường làm trên thảm cao su chống tĩnh điện (màu xanh như trên bàn), đeo vòng tĩnh điện kẹp vào khung kim loại, và chạm tay vào vỏ kim loại trước khi cầm linh kiện.' },
          { type: 'click', view: 'socket', title: 'Mở khung giữ CPU', do: 'Bấm vào cần gạt kim loại ở cạnh phải socket để mở khung giữ CPU.', hint: 'lever', targets: { lever: true },
            real: 'Ấn cần gạt xuống, đẩy nhẹ ra ngoài cho thoát móc rồi nâng lên – khung kim loại sẽ bật mở.',
            after(w) { w.setLever(true); } },
          { type: 'drag', view: 'socket', title: 'Đặt CPU vào socket', do: 'Bấm vào CPU trên khay để cầm lên, rồi bấm vào socket để đặt. Tam giác vàng trên CPU phải trùng tam giác vàng ở góc socket.',
            parts: ['cpu'], zones: { cpu: { socket: true } }, hint: 'socket', close: 'socketC',
            rot: (p) => p.rotY % 360 === 0 || 'Sai chiều! Tam giác vàng ở góc CPU phải nằm cùng góc với tam giác vàng in trên bo mạch (góc dưới bên trái socket). Bấm “⟳ Xoay” khi đang cầm CPU.',
            real: 'Cầm CPU ở hai cạnh, khớp 2 khấc lõm trên CPU với 2 gờ trong socket, rồi đặt thẳng xuống nhẹ nhàng. Không ấn, không trượt.',
            warn: 'Chân socket LGA rất mảnh. Làm rơi CPU vào socket hoặc chạm tay vào chân là có thể cong chân và hỏng bo mạch.' },
          { type: 'click', view: 'socket', title: 'Đóng khung giữ CPU', do: 'Bấm vào cần gạt để hạ khung kim loại xuống và khoá lại.', hint: 'lever', targets: { lever: true },
            real: 'Hạ khung, đưa mép trước vào dưới con vít rồi ấn cần gạt xuống và móc lại. Cần hơi nặng tay là bình thường. Nắp nhựa bảo vệ sẽ tự bật ra – cất lại để khi cần bảo hành.',
            after(w) { w.setLever(false); } },
          { type: 'drag', view: 'dimm', title: 'Lắp 2 thanh RAM (kênh đôi)', do: 'Cầm từng thanh RAM trên khay và lắp vào đúng khe để chạy kênh đôi. Khấc trên thanh RAM phải khớp gờ trong khe.',
            parts: ['ram1', 'ram2'], hint: 'dimm1', close: 'dimmC',
            zones: { '*': { dimm1: true, dimm3: true,
              dimm0: 'Khi chỉ lắp 2 thanh, sách hướng dẫn bo mạch yêu cầu dùng khe A2 và B2 (khe thứ 2 và thứ 4 tính từ CPU) để chạy kênh đôi ổn định.',
              dimm2: 'Khi chỉ lắp 2 thanh, sách hướng dẫn bo mạch yêu cầu dùng khe A2 và B2 (khe thứ 2 và thứ 4 tính từ CPU) để chạy kênh đôi ổn định.' } },
            rot: (p) => p.rotY % 360 === 0 || 'Khấc trên thanh RAM không khớp với gờ trong khe – thanh RAM chỉ cắm được một chiều. Bấm “⟳ Xoay” khi đang cầm.',
            real: 'Mở lẫy ở hai đầu khe, khớp khấc trên thanh RAM với gờ trong khe, rồi ấn đều hai đầu xuống tới khi lẫy tự bật lại kêu “tách”.',
            warn: 'Nếu ấn thấy rất cứng, kiểm tra lại chiều – ép sai chiều sẽ gãy khe hoặc hỏng RAM.' },
          { type: 'drag', view: 'm2', title: 'Lắp SSD M.2', do: 'Cầm SSD M.2 và lắp vào khe M.2_1 (phía dưới socket). Tấm tản nhiệt M.2 đã được tháo sẵn ra khay.',
            parts: ['m2'], zones: { m2: { m2: true } }, hint: 'm2', close: 'm2C',
            rot: (p) => p.rotY % 360 === 0 || 'Đầu có chân vàng phải hướng vào khe M.2 (phía bên trái). Bấm “⟳ Xoay” khi đang cầm.',
            real: 'Cắm SSD nghiêng khoảng 30° vào khe, rồi ấn phẳng đầu kia xuống trụ đỡ.' },
          { type: 'click', view: 'm2C', title: 'Chốt giữ SSD', do: 'Bấm vào chốt ở cuối SSD để khoá SSD lại.', hint: 'm2screw', targets: { m2screw: true, 'part:m2': true },
            real: 'Bo mạch ASUS mới dùng chốt nhựa xoay (Q-Latch) thay cho vít: xoay chốt đè lên đầu SSD là xong.' },
          { type: 'drag', view: 'm2', title: 'Lắp lại tấm tản nhiệt M.2', do: 'Cầm tấm tản nhiệt M.2 trên khay và đặt lại lên SSD.', hint: 'm2',
            parts: ['m2hs'], zones: { m2hs: { m2: true } }, rot: () => true, close: 'm2C',
            real: 'Nhớ bóc lớp nilon bảo vệ trên miếng đệm tản nhiệt trước khi lắp – quên bóc thì SSD sẽ nóng.',
            before(w) { W.zones.m2.place.m2hs = { pos: W.parts.m2hs.inst.pos.clone(), rotY: 0 }; } },
          { type: 'choose', view: 'bench', title: 'Kiểm tra keo tản nhiệt', do: 'Tản nhiệt mới mua đã có sẵn một lớp keo ở mặt đáy. Em làm gì?',
            opts: [
              { t: 'Giữ nguyên lớp keo có sẵn, không chạm tay vào', ok: true },
              { t: 'Bôi thêm thật nhiều keo cho chắc', why: 'Keo quá nhiều sẽ tràn ra ngoài và tạo lớp dày – truyền nhiệt kém hơn.' },
              { t: 'Lau sạch lớp keo có sẵn đi', why: 'Lau đi mà không bôi lại thì giữa CPU và tản chỉ còn không khí – CPU sẽ rất nóng.' }],
            real: 'Keo có sẵn trên tản mới đã đủ dùng. Nếu tản đã từng lắp rồi tháo ra, phải lau keo cũ và bôi keo mới (xem bài “Thay keo tản nhiệt”).' },
          { type: 'drag', view: 'cooler', title: 'Đặt tản nhiệt lên CPU', do: 'Cầm tản nhiệt và đặt lên CPU, sao cho 4 vít thẳng 4 lỗ quanh socket.', hint: 'socket',
            parts: ['cooler'], zones: { cooler: { socket: true } }, rot: () => true,
            real: 'Xoay tản sao cho dây quạt hướng về phía đầu CPU_FAN, đặt thẳng xuống một lần để không làm nhoè keo.' },
          { type: 'seq', view: 'cooler', title: 'Siết vít tản theo đường chéo', do: 'Bấm lần lượt 4 vít ở 4 góc tản nhiệt theo thứ tự chéo nhau.', mode: 'tight',
            real: 'Siết theo đường chéo (ví dụ 1 → 3 → 2 → 4), mỗi vít vài vòng rồi chuyển, để tản ép đều lên CPU.',
            after(w) { W.parts.fanplug.h.visible = true; } },
          { type: 'drag', view: 'fan', title: 'Cắm dây quạt CPU', do: 'Cầm đầu dây quạt của tản nhiệt và cắm vào đúng đầu cắm trên bo mạch.', hint: 'fan0',
            parts: ['fanplug'], zones: { fanplug: FAN_RULES }, rot: fanRot, close: 'fanC',
            real: 'Đầu cắm quạt 4 chân có gờ định vị; trượt đầu cắm vào tới khi gờ khớp vào thanh nhựa. Dây nên đi gọn, không chạm cánh quạt.' },
        ] },
      // ------------------------------------------------------------------
      { id: 'frontpanel', no: 2, icon: '🔌', minutes: 8, title: 'Cắm dây mặt trước vỏ máy',
        desc: 'Nối nút nguồn, nút Reset, đèn nguồn, đèn ổ cứng vào F_PANEL, rồi cắm USB 3.0, USB 2.0 và âm thanh mặt trước – đúng chân, đúng cực.',
        views: VIEWS,
        setup(w) {
          // dây từ mặt trước vỏ máy để sẵn ở mép dưới bàn
          const c = [
            addConnector('pwrsw', 'POWER SW', 0.23, null, false, ['#2456c8', '#eee']),
            addConnector('rstsw', 'RESET SW', 0.23, null, false, ['#1e8f4e', '#eee']),
            addConnector('pled', 'POWER LED', 0.23, null, true, ['#2dbf5c', '#eee']),
            addConnector('hddled', 'H.D.D LED', 0.23, null, true, ['#d0342c', '#eee']),
            addConnector('usb3', 'USB 3.0', 1.2, 'usb3', false, ['#1f5fd1', '#1f5fd1', '#1f5fd1']),
            addConnector('audio', 'HD AUDIO', 0.6, null, false, ['#222', '#d33', '#2a6', '#ddd']),
            addConnector('usb2', 'USB 2.0', 0.6, null, false, ['#111', '#c22', '#fff', '#2a6']),
          ];
          setHome(c[0], 2.4, 9.0); setHome(c[1], 3.1, 9.0, 180); setHome(c[2], 3.8, 9.0); setHome(c[3], 4.5, 9.0, 180);
          setHome(c[4], 7.4, 4.0, 270); setHome(c[5], -2.6, 9.0); setHome(c[6], -0.6, 9.0);
          c.forEach((p) => toHome(p, true));
          // các cặp chân trên F_PANEL (2 hàng × 5 chân, bước 2,54 mm)
          const fx = 3.455, P = 0.116;
          const pair = (id, col, row, lab) => zone(id, V(fx + (col + 0.5 - 2) * P, 0.36, 6.62 + row * 0.13), V(0.22, 0.06, 0.12), { pos: V(fx + (col + 0.5 - 2) * P, 0.42, 6.62 + row * 0.13), rotY: 0, label: lab });
          pair('fp_pled', 0, 0, 'PLED'); pair('fp_pwr', 2, 0, 'PWR'); pair('fp_hdd', 0, 1, 'HDD'); pair('fp_rst', 2, 1, 'RST');
          // chữ in nhỏ cạnh từng cặp chân
          silk('PLED+  PLED−   PWR   PWR', fx - 0.02, 6.43, 0.7, 0, 34); silk('+HDD  −HDD    RST    RST', fx - 0.02, 6.94, 0.7, 0, 34);
          W.zones.usb3.place.rotY = 90; W.zones.usb3.place.pos = V(5.2, 0.45, 1.05);
        },
        steps: [
          { type: 'click', view: 'bottom', title: 'Tìm đầu F_PANEL', do: 'Các dây nút bấm và đèn của vỏ máy cắm vào đầu F_PANEL ở mép dưới bo mạch. Bấm vào đầu F_PANEL.', hint: 'fh3',
            targets: { fh3: true, fh0: 'Đây là AAFP – đầu cắm âm thanh mặt trước.', fh1: 'Đây là đầu USB 2.0 (USB_E12).', fh2: 'Đây là đầu USB 2.0 (USB_E34).', fan4: 'Đây là đầu quạt vỏ máy CHA_FAN2.', fan5: 'Đây là đầu quạt vỏ máy CHA_FAN3.' },
            real: 'Đọc chữ in nhỏ trên bo mạch cạnh mỗi đầu cắm, hoặc xem sơ đồ trong sách hướng dẫn. F_PANEL thường nằm ở góc dưới bên phải bo mạch.' },
          { type: 'drag', view: 'fpanelBench', close: 'fpanel', title: 'Cắm dây nút nguồn (POWER SW)', do: 'Cầm đầu POWER SW và cắm vào cặp chân PWR.', hint: 'fp_pwr', keepRot: true,
            parts: ['pwrsw'], zones: { pwrsw: { fp_pwr: true, fp_rst: 'Đây là cặp chân RST (nút Reset).', fp_pled: 'Đây là cặp chân PLED (đèn nguồn).', fp_hdd: 'Đây là cặp chân HDD (đèn ổ cứng).' } },
            real: 'Dây nút bấm (SW) không có cực + −, cắm chiều nào cũng được. Nhìn chữ in trên bo mạch: PWR là 2 chân ở hàng trên, cột 3 và 4.' },
          { type: 'drag', view: 'fpanelBench', close: 'fpanel', title: 'Cắm dây nút Reset', do: 'Cầm đầu RESET SW và cắm vào cặp chân RST.', hint: 'fp_rst', keepRot: true,
            parts: ['rstsw'], zones: { rstsw: { fp_rst: true, fp_pled: 'Đây là cặp chân PLED (đèn nguồn).', fp_hdd: 'Đây là cặp chân HDD (đèn ổ cứng).' } },
            real: 'Nút Reset cũng không có cực. Nhiều vỏ máy mới không có nút Reset – khi đó bỏ trống cặp chân này.' },
          { type: 'drag', view: 'fpanelBench', close: 'fpanel', title: 'Cắm dây đèn nguồn (POWER LED)', do: 'Cầm đầu POWER LED và cắm vào cặp chân PLED, đúng cực + và −. Dấu tam giác trắng trên đầu cắm là chân +.', hint: 'fp_pled',
            parts: ['pled'], zones: { pled: { fp_pled: true, fp_hdd: 'Đây là cặp chân HDD (đèn ổ cứng), không phải đèn nguồn.', fp_rst: 'Đây là cặp chân RST.' } },
            rot: (p) => p.rotY % 360 === 0 || 'Ngược cực! Dấu tam giác (chân +) phải ở phía chân PLED+. Bấm “⟳ Xoay” khi đang cầm.',
            real: 'Đèn LED có cực: dây màu thường là +, dây trắng hoặc đen là −. Trên đầu cắm thường có in mũi tên ▲ ở chân dương.' },
          { type: 'drag', view: 'fpanelBench', close: 'fpanel', title: 'Cắm dây đèn ổ cứng (HDD LED)', do: 'Cầm đầu H.D.D LED và cắm vào cặp chân +HDD / −HDD.', hint: 'fp_hdd',
            parts: ['hddled'], zones: { hddled: { fp_hdd: true, fp_rst: 'Đây là cặp chân RST (nút Reset).' } },
            rot: (p) => p.rotY % 360 === 0 || 'Ngược cực! Dấu tam giác (chân +) phải ở phía chân +HDD. Bấm “⟳ Xoay” khi đang cầm.',
            real: 'Đèn HDD nhấp nháy khi máy đọc/ghi ổ đĩa – giúp biết máy đang làm việc hay bị treo.' },
          { type: 'choose', view: 'fpanelBench', title: 'Nếu cắm ngược đèn LED?', do: 'Nếu cắm ngược cực đầu POWER LED, điều gì sẽ xảy ra?',
            opts: [
              { t: 'Đèn nguồn không sáng, máy vẫn chạy bình thường – chỉ cần cắm đảo lại', ok: true },
              { t: 'Máy bị chập, cháy bo mạch', why: 'Đèn LED chỉ cho dòng điện đi một chiều; cắm ngược thì đèn không sáng chứ không gây chập.' },
              { t: 'Máy không khởi động được', why: 'Đèn chỉ để báo hiệu. Máy không lên là do nút nguồn (PWR) cắm sai, không phải do đèn.' }],
            real: 'Lắp xong, bấm thử nút nguồn: máy lên nhưng đèn không sáng thì đảo đầu LED. Máy không lên thì kiểm tra lại dây POWER SW.' },
          { type: 'drag', view: 'usb3Bench', close: 'usb3', title: 'Cắm cáp USB 3.0 mặt trước', do: 'Cầm đầu cáp USB 3.0 (màu xanh) và cắm vào đầu U31G1_12 ở mép phải bo mạch. Gờ trên đầu cắm phải khớp khấc trên đế.', hint: 'usb3',
            parts: ['usb3'], zones: { usb3: { usb3: true, fh1: 'Đầu USB 3.0 (19 chân) không cắm vào đầu USB 2.0 (9 chân).', fh2: 'Đầu USB 3.0 (19 chân) không cắm vào đầu USB 2.0 (9 chân).', fh0: 'Đầu USB 3.0 không cắm vào AAFP.' } },
            rot: (p) => p.rotY % 360 === 90 || 'Sai chiều! Đầu cắm phải nằm dọc theo đế, gờ nhô ra hướng vào phía khấc của đế. Bấm “⟳ Xoay” khi đang cầm.',
            warn: '19 chân của đầu USB 3.0 rất dễ cong. Phải căn thẳng rồi mới ấn; ấn lệch là cong chân, hỏng cổng.' },
          { type: 'drag', view: 'bottomBench', close: 'bottom', title: 'Cắm dây âm thanh mặt trước', do: 'Cầm đầu HD AUDIO và cắm vào đầu AAFP.', hint: 'fh0',
            parts: ['audio'], zones: { audio: { fh0: true,
              fh1: 'NGUY HIỂM! Đầu HD AUDIO cắm vào đầu USB 2.0 có thể gây chập, hỏng cổng hoặc thiết bị. Hai đầu trông giống nhau nhưng vị trí chân khuyết khác nhau – đọc chữ AAFP in trên bo mạch.',
              fh2: 'NGUY HIỂM! Đầu HD AUDIO cắm vào đầu USB 2.0 có thể gây chập, hỏng cổng hoặc thiết bị. Đọc chữ AAFP in trên bo mạch.', fh3: 'Đây là F_PANEL.' } }, keepRot: true,
            real: 'Đầu AAFP khuyết chân số 8, đầu USB 2.0 khuyết chân số 10. Nhìn kỹ chân khuyết và chữ in trên bo mạch trước khi cắm.' },
          { type: 'drag', view: 'bottomBench', close: 'bottom', title: 'Cắm cáp USB 2.0 mặt trước', do: 'Cầm đầu USB 2.0 và cắm vào một đầu USB 2.0 trên bo mạch.', hint: 'fh1', keepRot: true,
            parts: ['usb2'], zones: { usb2: { fh1: true, fh2: true, fh0: 'Đây là AAFP (âm thanh), không phải USB.', fh3: 'Đây là F_PANEL.' } },
            real: 'Cắm xong tất cả, bó dây gọn bằng dây rút, tránh để dây chạm quạt.' },
        ] },
      // ------------------------------------------------------------------
      { id: 'thermalpaste', no: 3, icon: '🧴', minutes: 8, title: 'Thay keo tản nhiệt CPU',
        desc: 'Tháo tản nhiệt, lau sạch keo cũ đã khô, bôi keo mới đúng lượng rồi lắp tản lại và kiểm tra nhiệt độ.',
        views: VIEWS,
        setup(w) {
          const cpu = part('cpu', w.piece('z890cpu-0').object, { label: 'CPU' });
          const cool = addCooler(); const plug = addFanPlug();
          cool.home = { pos: V(8.8, -0.07, -3.6), rotY: 0 };
          toPlace(cool, cool.inst.pos, 0, 'socket', true);
          plug.home = { pos: V(2.6, 0.03, -6.0), rotY: 0 };
          toPlace(plug, V(3.1, 0.36, -6.41), 0, 'fan0', true);
          zone('socket', V(0.38, 0.3, -2.91), V(2.7, 0.6, 3.3), { pos: cpu.inst.pos.clone(), rotY: 0, cooler: { pos: cool.inst.pos.clone(), rotY: 0 } });
          W.zones.socket.place.cooler = { pos: cool.inst.pos.clone(), rotY: 0 };
          // keo cũ (vết loang xám) và keo mới (hạt đậu)
          const oldTex = canvasTex(256, 256, (g) => { g.fillStyle = '#8f949a'; g.beginPath(); for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, r = 95 + Math.sin(i * 2.7) * 18 + Math.cos(i * 1.3) * 10; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.fill(); g.fillStyle = 'rgba(70,74,78,.5)'; for (let i = 0; i < 120; i++) { g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, Math.random() * 6, 0, 7); g.fill(); } });
          const old = new T.Mesh(new T.PlaneGeometry(1.5, 1.6), new T.MeshStandardMaterial({ map: oldTex, transparent: true, roughness: 0.9, depthWrite: false }));
          old.rotation.x = -Math.PI / 2; old.position.set(0.36, 0.40, -2.91); old.visible = false; W.scene.add(old); W.oldPaste = old;
          const dot = new T.Mesh(new T.SphereGeometry(0.16, 20, 12), mat('#c7ccd2', { roughness: 0.35, metalness: 0.2 })); dot.scale.y = 0.45; dot.position.set(0.36, 0.42, -2.91); dot.visible = false; W.scene.add(dot); W.newPaste = dot;
          hot('cpuTop', V(0.36, 0.45, -2.91), V(1.8, 0.2, 2.1));
        },
        steps: [
          { type: 'choose', view: 'cooler', title: 'Tắt và ngắt điện', do: 'Trước khi tháo tản nhiệt, em làm gì?',
            opts: [
              { t: 'Tắt máy, rút dây nguồn, bấm giữ nút nguồn vài giây để xả hết điện, chờ tản nguội', ok: true },
              { t: 'Chỉ cần tắt máy bằng Windows là đủ', why: 'Khi còn cắm điện, bộ nguồn vẫn cấp điện chờ (5V) cho bo mạch. Phải rút dây nguồn.' },
              { t: 'Tháo luôn khi máy đang chạy cho nhanh', why: 'Tuyệt đối không! Có thể chập điện, và CPU sẽ quá nóng ngay khi mất tản.' }],
            real: 'Mẹo của thợ: cho máy chạy vài phút trước khi tắt để keo ấm và mềm – tản sẽ dễ tháo hơn.' },
          { type: 'click', view: 'fan', title: 'Rút dây quạt CPU', do: 'Bấm vào đầu dây quạt đang cắm ở CPU_FAN để rút ra.', hint: 'fan0', targets: { 'part:fanplug': true, fan0: true },
            real: 'Cầm vào đầu nhựa để rút, không kéo vào dây.',
            after(w) { toHome(W.parts.fanplug); } },
          { type: 'seq', view: 'cooler', title: 'Nới vít tản theo đường chéo', do: 'Bấm lần lượt 4 vít ở 4 góc tản nhiệt theo thứ tự chéo nhau để nới ra.', mode: 'loose',
            real: 'Nới mỗi vít vài vòng theo đường chéo để tản không bị kênh một bên, rồi mới nới hẳn.' },
          { type: 'choose', view: 'cooler', title: 'Nhấc tản nhiệt ra', do: 'Keo cũ đã khô làm tản dính vào CPU. Em nhấc tản ra thế nào?',
            opts: [
              { t: 'Xoay nhẹ tản qua lại vài lần cho keo bong ra, rồi nhấc thẳng lên', ok: true },
              { t: 'Kéo mạnh thẳng lên ngay', why: 'Keo khô dính rất chặt: kéo mạnh có thể nhổ cả CPU ra khỏi socket (hay gặp ở CPU AMD AM4) và làm cong chân.' },
              { t: 'Lấy tua vít cạy ở mép', why: 'Cạy có thể làm xước bo mạch, đứt đường mạch hoặc mẻ CPU.' }],
            after(w) { toHome(W.parts.cooler); W.parts.fanplug.h.visible = false; W.oldPaste.visible = true; W.oldPaste.material.opacity = 1; } },
          { type: 'choose', view: 'cpu', title: 'Chọn đồ lau keo cũ', do: 'Em dùng gì để lau sạch keo cũ trên CPU và đế tản nhiệt?',
            opts: [
              { t: 'Cồn isopropyl (từ 90% trở lên) và khăn giấy hoặc vải không xơ', ok: true },
              { t: 'Nước rửa chén và nước', why: 'Nước có thể đọng lại trên socket, gây chập khi bật máy.' },
              { t: 'Giấy nhám', why: 'Giấy nhám làm xước mặt CPU và mặt đế tản – truyền nhiệt kém đi.' },
              { t: 'Xăng thơm hoặc dầu', why: 'Để lại lớp dầu, có mùi và có thể làm hỏng nhựa.' }],
            real: 'Cồn isopropyl bay hơi nhanh, không để lại cặn. Mua ở hiệu thuốc hoặc cửa hàng linh kiện.' },
          { type: 'scrub', view: 'cpu', title: 'Lau sạch keo cũ', do: 'Giữ chuột trái và rê qua lại trên mặt CPU để lau sạch keo cũ.',
            real: 'Lau từ mép vào giữa để keo không rơi vào chân socket. Lau cả mặt đế tản nhiệt cho sạch bóng.',
            warn: 'Không để keo hay cồn chảy vào khe giữa CPU và socket.',
            after(w) { if (W.coolerPaste) W.coolerPaste.visible = false; } },
          { type: 'choose', view: 'cpu', title: 'Bôi keo mới', do: 'Em bôi keo tản nhiệt mới như thế nào?',
            opts: [
              { t: 'Một hạt nhỏ cỡ hạt đậu ở giữa CPU – lực ép của tản sẽ tự dàn đều', ok: true },
              { t: 'Bóp thật nhiều cho phủ kín và tràn ra mép', why: 'Keo thừa tràn ra mép, có thể lẫn vào socket; lớp keo dày còn làm truyền nhiệt kém hơn.' },
              { t: 'Dùng ngón tay trét đều', why: 'Dầu và bụi trên tay lẫn vào keo. Nếu muốn trét thì dùng que hoặc thẻ nhựa sạch đi kèm tuýp keo.' },
              { t: 'Không cần keo, mặt kim loại áp vào nhau là đủ', why: 'Hai mặt kim loại có khe li ti chứa không khí – không có keo, CPU sẽ rất nóng.' }],
            after(w) { W.newPaste.visible = true; } },
          { type: 'drag', view: 'cooler', title: 'Lắp lại tản nhiệt', do: 'Cầm tản nhiệt trên khay và đặt lại lên CPU.', hint: 'socket',
            parts: ['cooler'], zones: { cooler: { socket: true } }, rot: () => true,
            real: 'Đặt thẳng xuống một lần, không xoay trượt qua lại trên keo.',
            after(w) { W.newPaste.visible = false; if (W.coolerPaste) W.coolerPaste.visible = true; } },
          { type: 'seq', view: 'cooler', title: 'Siết vít tản theo đường chéo', do: 'Bấm lần lượt 4 vít theo thứ tự chéo để siết tản.', mode: 'tight',
            real: 'Siết theo đường chéo để tản ép đều; không siết hết cỡ một vít rồi mới sang vít khác.',
            after(w) { W.parts.fanplug.h.visible = true; } },
          { type: 'drag', view: 'fan', title: 'Cắm lại dây quạt CPU', do: 'Cầm đầu dây quạt và cắm lại vào đúng đầu cắm.', hint: 'fan0',
            parts: ['fanplug'], zones: { fanplug: FAN_RULES }, rot: fanRot, close: 'fanC' },
          { type: 'choose', view: 'cooler', title: 'Kiểm tra nhiệt độ', do: 'Bật máy, vào BIOS xem nhiệt độ CPU lúc máy nghỉ. Khoảng bao nhiêu là bình thường?',
            opts: [
              { t: 'Khoảng 30 – 50 °C', ok: true },
              { t: 'Khoảng 90 – 100 °C', why: 'Quá nóng! Kiểm tra lại: tản đã siết đủ 4 vít chưa, có quên bôi keo hoặc quên bóc nilon dưới đế tản không, quạt có quay không.' },
              { t: 'Khoảng 0 °C', why: 'CPU luôn nóng hơn nhiệt độ phòng khi chạy – 0 °C là không thể với tản khí thông thường.' }],
            real: 'Trong Windows có thể xem nhiệt độ bằng phần mềm như HWMonitor. Khi chạy nặng, CPU 70–85 °C vẫn là bình thường.' },
        ] },
    ];
    const SOON = [
      { icon: '🖥️', title: 'Kết nối và khởi động lần đầu', desc: 'Cắm màn hình, bàn phím, chuột, nguồn; bật máy, đọc màn hình POST và vào BIOS/UEFI.' },
      { icon: '💾', title: 'Nâng cấp ổ lưu trữ', desc: 'Lắp thêm ổ HDD 3.5", SSD 2.5" SATA và SSD M.2; cắm cáp SATA và nguồn.' },
      { icon: '🌀', title: 'Lắp thêm quạt vỏ máy', desc: 'Chọn chiều gió hút/thổi, bắt quạt trước, cắm vào CHA_FAN.' },
      { icon: '📶', title: 'Lắp card mở rộng Wi-Fi', desc: 'Lắp card PCIe, gắn ăng-ten, cắm cáp Bluetooth vào USB trong.' },
      { icon: '⚡', title: 'Kiểm tra bộ nguồn', desc: 'Kích nguồn bằng dây nối PS_ON, đo điện áp bằng đồng hồ vạn năng.' },
    ];

    // ======================= giao diện =======================
    function home() {
      stopWorld(); L = null;
      $('#lab').hidden = true; $('#home').hidden = false; $('#btnList').hidden = true;
      $('#title').textContent = 'Thực hành theo bài';
      const P = loadP(); const done = LABS.filter((l) => P[l.id] && P[l.id].done).length;
      $('#prog').textContent = `Đã xong ${done}/${LABS.length} bài`;
      $('#home').innerHTML = `<h1>Thực hành theo bài</h1>
        <p class="lead">Mỗi bài là một việc thợ máy tính làm hằng ngày, làm trên bo mạch 3D như thật và chia thành từng bước ngắn. Làm sai sẽ có giải thích vì sao sai, và mỗi bước đều có phần <b>“Ngoài đời làm thế nào”</b>.</p>
        <div class="labgrid">${LABS.map((l) => { const p = P[l.id]; return `<button class="labcard" data-lab="${l.id}"><div class="ic">${l.icon}</div><div class="no">Bài ${l.no} · khoảng ${l.minutes} phút</div><h3>${esc(l.title)}</h3><p>${esc(l.desc)}</p><div class="meta"><span>${l.steps.length} bước</span><span class="st ${p && p.done ? 'ok' : ''}">${p && p.done ? `✓ Đã xong${p.best != null ? ` · ${p.best} lỗi` : ''}` : 'Bắt đầu ›'}</span></div></button>`; }).join('')}
        ${SOON.map((l) => `<div class="labcard soon"><div class="ic">${l.icon}</div><div class="no">Sắp có</div><h3>${esc(l.title)}</h3><p>${esc(l.desc)}</p></div>`).join('')}</div>
        <p class="tip">Mô hình 3D bo mạch, CPU, RAM, SSD và tản nhiệt lấy từ dự án PC Anatomy (giấy phép MIT). Thực hành trên máy không thay được giờ thực hành với linh kiện thật – khi lắp máy thật, luôn đọc sách hướng dẫn của bo mạch chủ.</p>`;
      $('#home').querySelectorAll('[data-lab]').forEach((b) => (b.onclick = () => open(b.dataset.lab)));
      history.replaceState(null, '', location.pathname);
    }
    function stopWorld() { if (W) { cancelAnimationFrame(W.raf); W.rt.dispose(); W = null; } $('#tags').innerHTML = ''; }
    function open(id) {
      L = LABS.find((l) => l.id === id); if (!L) return home();
      stopWorld();
      $('#home').hidden = true; $('#lab').hidden = false; $('#btnList').hidden = false;
      $('#title').textContent = `Bài ${L.no}: ${L.title}`;
      build(L); L.setup(W);
      for (const p of Object.values(W.parts)) if (p.label && p.home) tag(p.label, () => (p.placed || !p.h.visible || st && st.held === p ? null : p.h.position.clone().add(V(0, p.size.y / 2 + 0.25, 0))), 'part');
      for (const z of Object.values(W.zones)) if (z.label) tag(z.label, () => (W.tagZones && W.tagZones.has(z.id) ? z.mesh.position.clone().add(V(0, 0.35, 0)) : null), 'zone');
      st = { i: 0, mistakes: [], t0: Date.now(), held: null };
      history.replaceState(null, '', '#' + id);
      resize(); loop(); go(0);
    }
    function resize() { if (!W) return; const h = $('#view3d'); const w = h.clientWidth, hh = h.clientHeight; W.rt.renderer.setSize(w, hh); W.cam.aspect = w / hh; W.cam.updateProjectionMatrix(); }
    addEventListener('resize', resize);
    let lastT = performance.now();
    function loop() {
      if (!W) return;
      W.raf = requestAnimationFrame(loop);
      const now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
      W.anims = W.anims.filter((a) => { a.t += dt; const k = Math.min(1, a.t / a.dur); a.f(k); return k < 1; });
      if (W.camAnim) { const a = W.camAnim; a.t += dt; const k = Math.min(1, a.t / 0.8), e = 1 - Math.pow(1 - k, 3); W.ctl.target.lerpVectors(a.t0, a.t1, e); W.cam.position.lerpVectors(a.p0, a.p1, e); if (k >= 1) W.camAnim = null; }
      if (st && st.held) { const p = st.held; p.h.position.lerp(st.holdAt, 0.35); p.h.rotation.y += ((p.rotY * Math.PI / 180) - p.h.rotation.y) * 0.3; }
      W.tick.forEach((f) => f(dt));
      const pulse = 0.18 + 0.14 * Math.sin(now / 220);
      for (const z of Object.values(W.zones)) z.mesh.material.opacity = z.glow ? pulse : 0;
      for (const z of Object.values(W.hots)) z.mesh.material.opacity = z.glow ? pulse : 0;
      W.ctl.update();
      W.rt.renderer.render(W.scene, W.cam);
      // nhãn
      const r = $('#view3d').getBoundingClientRect();
      for (const t of W.tags) { const p = t.getPos(); if (!p) { t.el.style.display = 'none'; continue; } const v = p.project(W.cam); if (v.z > 1) { t.el.style.display = 'none'; continue; } t.el.style.display = ''; t.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * r.width}px, ${(-v.y * 0.5 + 0.5) * r.height}px) translate(-50%,-100%)`; }
    }
    function fitPoints(pts) {
      const b = new T.Box3(); pts.forEach((p) => b.expandByPoint(p)); const c = b.getCenter(new T.Vector3()); const r = Math.max(2.2, b.getSize(new T.Vector3()).length() / 2);
      const fov = (W.cam.fov * Math.PI) / 180, k = Math.sin((fov / 2) * Math.min(1, W.cam.aspect));
      const dist = (r / k) * 1.05, dir = V(0.08, 0.78, 0.62).normalize();
      W.camAnim = { t: 0, t0: W.ctl.target.clone(), t1: c, p0: W.cam.position.clone(), p1: c.clone().add(dir.multiplyScalar(dist)) };
    }
    function stepView(s) {
      if (s.type !== 'drag') return fitView(s.view || 'start');
      const pts = [];
      s.parts.forEach((id) => { const p = W.parts[id]; if (!p.placed) { const q = p.h.position.clone(); pts.push(q.clone().add(V(p.size.x / 2, 0, p.size.z / 2)), q.clone().sub(V(p.size.x / 2, 0, p.size.z / 2))); } });
      const rules = Object.values(s.zones).flatMap((r) => Object.keys(r).filter((k) => r[k] === true));
      rules.forEach((id) => { const z = W.zones[id]; if (z) pts.push(z.mesh.position.clone()); });
      if (pts.length) fitPoints(pts); else fitView(s.view || 'start');
    }
    function fitView(name, now) {
      const v = (L && L.views[name]) || VIEWS[name] || VIEWS.start; const t1 = V(...v.t), p1 = t1.clone().add(V(...v.o));
      if (now || !W.cam) { W.ctl.target.copy(t1); W.cam.position.copy(p1); W.ctl.update(); return; }
      W.camAnim = { t: 0, t0: W.ctl.target.clone(), t1, p0: W.cam.position.clone(), p1 };
    }
    document.querySelectorAll('#tools3d [data-z]').forEach((b) => (b.onclick = () => { if (!W) return; const d = W.cam.position.clone().sub(W.ctl.target).multiplyScalar(+b.dataset.z); W.camAnim = { t: 0, t0: W.ctl.target.clone(), t1: W.ctl.target.clone(), p0: W.cam.position.clone(), p1: W.ctl.target.clone().add(d) }; }));
    $('#bView').onclick = () => { if (L && st && L.steps[st.i]) { if (st.held && L.steps[st.i].close) fitView(L.steps[st.i].close); else stepView(L.steps[st.i]); } };
    $('#bRot').onclick = () => rotateHeld();
    addEventListener('keydown', (e) => { if ((e.key === 'r' || e.key === 'R') && st && st.held) rotateHeld(); if (e.key === 'Escape' && st && st.held) dropBack(); });
    function rotateHeld() { const p = st.held; if (!p) return; p.rotY = (p.rotY + (p.rotStep || 180)) % 360; }

    function stepsList() {
      $('#steps').innerHTML = `<h4>Các bước</h4><ol>${L.steps.map((s, i) => `<li class="${i < st.i ? 'done' : i === st.i ? 'cur' : ''}"><span class="n">${i < st.i ? '✓' : i + 1}</span><span>${esc(s.title)}</span></li>`).join('')}</ol>`;
      $('#prog').textContent = `Bước ${Math.min(st.i + 1, L.steps.length)}/${L.steps.length} · ${st.mistakes.length} lỗi`;
    }
    function go(i) {
      st.i = i; st.order = []; st.scrub = 0; st.busy = false; st.held = null; $('#bRot').hidden = true;
      clearGlow();
      if (i >= L.steps.length) return finish();
      const s = L.steps[i];
      if (s.before) s.before(W);
      if (s.type === 'seq') W.screws.forEach((sc) => { sc.userData.done = false; sc.children[0].material = sc.children[0].material.clone(); sc.children[0].material.color.set('#c9cdd2'); });
      W.ctl.enabled = s.type !== 'scrub';
      W.tagZones = new Set(s.type === 'drag' ? Object.values(s.zones).flatMap((r) => Object.keys(r)) : s.type === 'click' ? Object.keys(s.targets) : []);
      stepView(s);
      stepsList(); panel(s);
    }
    function panel(s, fb) {
      let h = `<div class="k">Bước ${st.i + 1} / ${L.steps.length}</div><h2>${esc(s.title)}</h2><p class="do">${esc(s.do)}</p>`;
      if (s.type === 'choose') h += `<div class="opts">${s.opts.map((o, k) => `<button class="opt" data-o="${k}">${esc(o.t)}</button>`).join('')}</div>`;
      h += `<div id="fb">${fb || ''}</div>`;
      if (s.real) h += `<div class="real"><b>🔧 Ngoài đời làm thế nào</b>${esc(s.real)}</div>`;
      if (s.warn) h += `<div class="warn"><b>⚠ Cẩn thận</b>${esc(s.warn)}</div>`;
      h += `<div class="acts">${s.type !== 'choose' ? '<button class="btn" id="bHint">💡 Gợi ý</button>' : ''}<button class="btn" id="bRestart">↺ Làm lại bài</button></div>`;
      $('#panel').innerHTML = h;
      $('#panel').querySelectorAll('[data-o]').forEach((b) => (b.onclick = () => choose(s, +b.dataset.o, b)));
      const bh = $('#bHint'); if (bh) bh.onclick = () => hint(s);
      $('#bRestart').onclick = () => { if (confirm('Làm lại bài này từ đầu?')) open(L.id); };
    }
    function feedback(msg, kind) { const f = $('#fb'); if (f) f.innerHTML = `<div class="fb ${kind}">${esc(msg)}</div>`; }
    function toast(msg, kind = '') { const t = $('#toast'); t.textContent = msg; t.className = 'on ' + kind; clearTimeout(toast.h); toast.h = setTimeout(() => (t.className = ''), 2800); }
    function miss(msg) { st.mistakes.push({ title: L.steps[st.i].title, msg }); feedback(msg, 'err'); toast('Chưa đúng – đọc giải thích bên phải', 'err'); stepsList(); }
    function complete(msg) {
      const s = L.steps[st.i]; if (st.busy) return; st.busy = true; clearGlow();
      if (s.after) s.after(W);
      feedback(msg || '✓ Đúng rồi!', 'ok'); toast('✓ ' + (msg || 'Đúng rồi!'), 'ok');
      setTimeout(() => go(st.i + 1), 1100);
    }
    function clearGlow() { if (!W) return; Object.values(W.zones).forEach((z) => (z.glow = false)); Object.values(W.hots).forEach((z) => (z.glow = false)); }
    function hint(s) {
      if (s.type === 'seq') { toast('Bấm theo đường chéo: một góc, rồi góc đối diện chéo với nó, rồi hai góc còn lại.'); return; }
      if (s.type === 'scrub') { toast('Giữ chuột trái và rê qua lại trên mặt CPU.'); return; }
      const id = s.hint; const z = W.zones[id] || W.hots[id]; if (!z) return;
      z.glow = 'hint'; setTimeout(() => { if (z.glow === 'hint') z.glow = false; }, 2600);
    }
    function choose(s, k, btn) {
      const o = s.opts[k]; if (btn.classList.contains('bad') || st.busy) return;
      if (o.ok) { btn.classList.add('good'); complete(o.msg || 'Chính xác!'); } else { btn.classList.add('bad'); miss(o.why || 'Chưa đúng.'); }
    }

    // ---------- chuột ----------
    const ray = new T.Raycaster(), ndc = new T.Vector2();
    const setRay = (e) => { const r = W.rt.renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, W.cam); };
    let down = null;
    const view = $('#view3d');
    view.addEventListener('pointerdown', (e) => { if (!W || !st) return; down = { x: e.clientX, y: e.clientY }; if (L.steps[st.i] && L.steps[st.i].type === 'scrub') { st.scrubbing = true; scrubAt(e); } });
    view.addEventListener('pointermove', (e) => {
      if (!W || !st) return;
      if (st.scrubbing) { scrubAt(e); return; }
      if (st.held) { setRay(e); const y = st.holdY; const pl = new T.Plane(V(0, 1, 0), -y); const hit = new T.Vector3(); if (ray.ray.intersectPlane(pl, hit)) st.holdAt.set(hit.x, y, hit.z); }
    });
    addEventListener('pointerup', (e) => {
      if (!W || !st || !down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6; down = null;
      if (st.scrubbing) { st.scrubbing = false; return; }
      if (moved || e.target !== W.rt.renderer.domElement) return;
      click(e);
    });
    function hitList(e) {
      setRay(e);
      const objs = [...Object.values(W.zones).map((z) => z.mesh), ...Object.values(W.hots).map((z) => z.mesh), ...Object.values(W.parts).filter((p) => p.h.visible).map((p) => p.h)];
      return ray.intersectObjects(objs, true);
    }
    function click(e) {
      const s = L.steps[st.i]; if (!s || st.busy) return;
      const hits = hitList(e);
      if (s.type === 'seq') { setRay(e); const h = ray.intersectObjects(W.screws, true)[0]; if (h) seqClick(s, h.object.userData.screw); return; }
      if (s.type === 'click') {
        for (const h of hits) {
          const ud = h.object.userData; const id = ud.part ? 'part:' + ud.part : ud.hot || ud.zone;
          if (!id || s.targets[id] == null) continue;
          if (s.targets[id] === true) complete(); else miss(s.targets[id]);
          return;
        }
        return;
      }
      if (s.type !== 'drag') return;
      if (!st.held) {
        const h = hits.find((x) => x.object.userData.part && s.parts.includes(x.object.userData.part) && !W.parts[x.object.userData.part].placed) || hits.find((x) => x.object.userData.part);
        if (!h) return;
        const p = W.parts[h.object.userData.part];
        if (p.placed) return;
        if (!s.parts.includes(p.id)) { toast('Bước này chưa dùng tới ' + p.label + '.'); return; }
        pick(p, s);
        return;
      }
      // đang cầm: tìm vùng thả
      const p = st.held; const rules = s.zones[p.id] || s.zones['*'] || {};
      const z = hits.map((h) => h.object.userData.zone).find((id) => id && rules[id] != null);
      if (!z) { const any = hits.map((h) => h.object.userData.zone).find(Boolean); if (any) miss(`Không phải chỗ này. ${p.label} không lắp vào đây.`); else toast('Bấm vào chỗ cần lắp trên bo mạch (vùng sáng xanh). Bấm Esc để đặt lại xuống khay.'); return; }
      const r = rules[z];
      if (r !== true) { miss(r); return; }
      if (s.parts.some((id) => id !== p.id && W.parts[id].placed === z)) { toast('Chỗ này đã có linh kiện rồi.'); return; }
      if (s.rot) { const ok = s.rot(p); if (ok !== true) { miss(ok); return; } }
      const zone = W.zones[z]; const pl = (zone.place && zone.place[p.id]) || zone.place;
      const pos = pl.pos;
      const rotY = s.keepRot ? p.rotY : (pl.rotY || 0);
      st.held = null; $('#bRot').hidden = true; clearGlow();
      if (p.lay) anim(p.h.rotation, 'z', 0, 0.3);
      toPlace(p, pos.clone ? pos.clone() : pos, rotY, z);
      if (s.parts.every((id) => W.parts[id].placed)) complete(); else { stepView(s); toast('✓ Đã lắp ' + p.label + '. Lắp tiếp linh kiện còn lại.', 'ok'); feedback('✓ Đã lắp ' + p.label + '.', 'ok'); }
    }
    function pick(p, s) {
      st.held = p; $('#bRot').hidden = false;
      st.holdY = Math.max(1.4, p.size.y + 0.9); st.holdAt = p.h.position.clone().setY(st.holdY);
      if (p.lay) anim(p.h.rotation, 'z', 0, 0.3);
      const rules = s.zones[p.id] || s.zones['*'] || {};
      Object.keys(rules).forEach((id) => { if (W.zones[id]) W.zones[id].glow = true; });
      toast('Đang cầm ' + p.label + ' – bấm vào chỗ cần lắp. Phím R để xoay, Esc để đặt lại.');
      if (s.close) fitView(s.close);
    }
    function dropBack() { const p = st.held; if (!p) return; st.held = null; stepView(L.steps[st.i]); $('#bRot').hidden = true; clearGlow(); toHome(p); if (p.lay) anim(p.h.rotation, 'z', Math.PI / 2, 0.3); }

    // ---------- vít chéo ----------
    const OPP = { 0: 2, 1: 3, 2: 0, 3: 1 };
    function seqClick(s, k) {
      const o = st.order; if (o.includes(k)) return;
      if (o.length % 2 === 1 && k !== OPP[o[o.length - 1]]) { miss(`Phải bấm theo đường chéo: sau vít ${o[o.length - 1] + 1} là vít đối diện chéo (vít ${OPP[o[o.length - 1]] + 1}), để tản ép đều lên CPU.`); return; }
      o.push(k);
      const sc = W.screws[k]; sc.children[0].material.color.set(s.mode === 'loose' ? '#8b9096' : '#34c759');
      anim(sc.rotation, 'y', sc.rotation.y + (s.mode === 'loose' ? -6 : 6), 0.5);
      anim(sc.position, 'y', s.mode === 'loose' ? 0.8 : 0.62, 0.5);
      tag(String(o.length), () => sc.getWorldPosition(new T.Vector3()).add(V(0, 0.4, 0)), 'num');
      if (o.length === 4) { setTimeout(() => { W.tags = W.tags.filter((t) => { if (t.el.classList.contains('num')) { t.el.remove(); return false; } return true; }); }, 1000); complete(s.mode === 'loose' ? 'Đã nới đều 4 vít.' : 'Đã siết đều 4 vít.'); }
    }
    // ---------- lau keo ----------
    function scrubAt(e) {
      setRay(e); const h = ray.intersectObject(W.hots.cpuTop.mesh)[0];
      if (h) { if (st.lastScrub) st.scrub += h.point.distanceTo(st.lastScrub); st.lastScrub = h.point.clone(); } else st.lastScrub = null;
      const left = Math.max(0, 1 - st.scrub / 14); W.oldPaste.material.opacity = left;
      if (left <= 0.03 && !st.busy) { W.oldPaste.visible = false; complete('Mặt CPU đã sạch bóng.'); }
    }

    // ---------- kết thúc ----------
    function finish() {
      W.ctl.enabled = true; W.tagZones = new Set();
      const secs = Math.round((Date.now() - st.t0) / 1000);
      const P = loadP(); const prev = P[L.id];
      P[L.id] = { done: true, best: prev && prev.best != null ? Math.min(prev.best, st.mistakes.length) : st.mistakes.length, at: Date.now() };
      saveP(P); stepsList(); fitView('start');
      const next = LABS.find((l) => l.no === L.no + 1);
      $('#panel').innerHTML = `<div class="k">Hoàn thành</div><h2>🎉 Em đã làm xong bài ${L.no}!</h2>
        <div class="stat"><div><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</b><span>Thời gian</span></div><div><b>${st.mistakes.length}</b><span>Lần làm sai</span></div></div>
        ${st.mistakes.length ? `<p><b>Những chỗ cần nhớ:</b></p><ol class="mist">${st.mistakes.map((m) => `<li><b>${esc(m.title)}:</b> ${esc(m.msg)}</li>`).join('')}</ol>` : '<p>Không sai bước nào – rất tốt!</p>'}
        <div class="acts">${next ? `<button class="btn pri" id="bNext">Bài tiếp: ${esc(next.title)} ›</button>` : ''}<button class="btn" id="bAgain">↺ Làm lại</button><button class="btn" id="bHome">Danh sách bài</button></div>`;
      if (next) $('#bNext').onclick = () => open(next.id);
      $('#bAgain').onclick = () => open(L.id); $('#bHome').onclick = home;
      $('#prog').textContent = `Hoàn thành · ${st.mistakes.length} lỗi`;
    }

    $('#btnList').onclick = home;
    const want = location.hash.slice(1);
    if (want && LABS.some((l) => l.id === want)) open(want); else home();
    window.__labs = { open, home, state: () => st, world: () => W, T };
  }
})();
