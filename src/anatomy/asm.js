// TinHocLab – Phòng lắp ráp dùng mô hình 3D của PC Anatomy.
// Học sinh lấy từng linh kiện trên khay lắp vào thùng máy theo đúng trình tự, làm đúng các thao tác,
// rồi bật nguồn. Có chế độ luyện (có gợi ý) và bài thi chấm điểm gửi về máy giáo viên qua mạng LAN.
(function () {
  const params = new URLSearchParams(location.search);
  const A = (t, why) => ({ t, why });
  // Các bước lắp: concept của PC Anatomy → tên, điều kiện, thao tác
  const STEPS = {
    ioshield: { name: 'Tấm chắn I/O', req: [], title: 'Lắp tấm chắn I/O', steps: [
      A('Xác định đúng mặt tấm chắn khớp với cụm cổng của mainboard'),
      A('Ấn tấm chắn vào ô chữ nhật phía sau vỏ từ bên trong ra'),
      A('Ấn đều bốn góc đến khi tấm chắn khớp chặt vào vỏ'),
    ], wrong: [A('Lắp mainboard trước rồi mới gắn tấm chắn I/O', 'Lắp mainboard rồi sẽ không còn chỗ để gắn tấm chắn từ bên trong.')] },
    motherboard: { name: 'Bo mạch chủ', req: ['ioshield'], title: 'Lắp mainboard vào vỏ', steps: [
      A('Kiểm tra các cọc đồng (standoff) khớp đúng các lỗ vít của mainboard'),
      A('Đặt mainboard nghiêng, đưa cụm cổng I/O khớp vào tấm chắn rồi hạ xuống'),
      A('Bắt vít theo thứ tự chéo nhau, siết vừa tay'),
    ], wrong: [
      A('Đặt mainboard thẳng lên khay vỏ, không cần cọc đồng', 'Mặt dưới mainboard chạm vỏ kim loại sẽ bị chập điện.'),
      A('Siết thật chặt từng con vít một cho chắc', 'Siết quá chặt có thể làm nứt mạch; nên siết vừa tay, theo kiểu chéo.'),
    ] },
    processor: { name: 'CPU', req: ['motherboard'], title: 'Lắp CPU vào socket', steps: [
      A('Ấn cần gạt xuống, đẩy ra ngoài rồi nâng lên để mở socket'),
      A('Mở khung giữ kim loại (load plate)'),
      A('Cầm CPU ở hai cạnh, căn tam giác vàng với dấu tam giác trên socket'),
      A('Đặt CPU thẳng xuống, không trượt hay xoay'),
      A('Hạ khung giữ, khoá cần gạt (nắp nhựa bảo vệ tự bật ra)'),
    ], wrong: [
      A('Ấn mạnh CPU xuống cho khít', 'CPU chỉ cần đặt nhẹ; ấn mạnh sẽ cong chân socket.'),
      A('Dùng tay lau các chân tiếp xúc cho sạch bụi', 'Mồ hôi/dầu trên tay làm bẩn và có thể làm cong chân tiếp xúc.'),
      A('Xoay CPU đến khi thấy vừa', 'CPU chỉ vào một chiều duy nhất, phải căn dấu tam giác trước khi đặt.'),
    ] },
    ram: { name: 'RAM', req: ['motherboard'], title: 'Lắp RAM', steps: [
      A('Mở lẫy ở đầu khe RAM số 2 và số 4 (A2, B2)'),
      A('Căn khấc trên chân RAM trùng với gờ trong khe'),
      A('Ấn đều hai đầu thanh RAM đến khi lẫy tự khoá kêu "tách"'),
    ], wrong: [
      A('Cắm 2 thanh vào 2 khe sát nhau (khe 1 và 2)', 'Khe sát nhau cùng một kênh – RAM chạy kênh đơn, chậm hơn.'),
      A('Ấn một đầu trước rồi bẻ đầu còn lại xuống', 'Phải ấn đều hai đầu, bẻ nghiêng dễ làm hỏng khe.'),
    ] },
    nvme: { name: 'SSD M.2', req: ['motherboard'], title: 'Lắp SSD M.2', steps: [
      A('Tháo tấm tản nhiệt M.2 trên mainboard'),
      A('Cắm SSD nghiêng khoảng 30° vào khe M.2'),
      A('Ấn SSD nằm xuống và bắt vít / gạt chốt giữ'),
      A('Gỡ nilon miếng dán tản nhiệt rồi lắp tấm tản M.2 lại'),
    ], wrong: [A('Cắm SSD nằm ngang rồi đẩy mạnh vào khe', 'Phải cắm nghiêng rồi mới ấn xuống, đẩy mạnh dễ gãy chân.')] },
    cpucooler: { name: 'Tản nhiệt CPU', req: ['processor'], title: 'Lắp tản nhiệt CPU', steps: [
      A('Bôi một chấm keo tản nhiệt cỡ hạt đậu ở giữa CPU'),
      A('Gỡ miếng nilon bảo vệ ở đế tản nhiệt'),
      A('Đặt tản thẳng lên CPU, vặn vít chéo nhau từng chút một'),
      A('Cắm dây quạt tản vào chân CPU_FAN trên mainboard'),
    ], wrong: [
      A('Bôi thật nhiều keo phủ kín cả CPU', 'Keo quá dày dẫn nhiệt kém hơn và có thể tràn ra socket.'),
      A('Cắm dây quạt vào chân SYS_FAN', 'Quạt CPU phải cắm CPU_FAN, nếu không mainboard có thể báo lỗi.'),
    ] },
    psu: { name: 'Bộ nguồn', req: [], title: 'Lắp bộ nguồn', steps: [
      A('Gạt công tắc nguồn sang O (tắt) và chưa cắm điện'),
      A('Đặt nguồn vào khoang dưới, quạt hướng xuống lưới lọc bụi'),
      A('Bắt 4 vít ở mặt sau vỏ'),
    ], wrong: [
      A('Cắm điện và bật công tắc trước khi lắp cho tiện thử', 'Không bao giờ lắp ráp khi máy đang có điện – nguy hiểm.'),
      A('Úp quạt nguồn sát sàn vỏ kín không có lỗ thông gió', 'Nguồn sẽ không hút được gió mát và quá nhiệt.'),
    ] },
    graphicscard: { name: 'Card đồ hoạ', req: ['motherboard'], title: 'Lắp card đồ hoạ', steps: [
      A('Tháo các nắp chắn khe PCIe ở mặt sau vỏ'),
      A('Mở lẫy khoá ở cuối khe PCIe x16 trên cùng'),
      A('Cắm card thẳng xuống đến khi lẫy tự khoá'),
      A('Bắt vít giữ ke card vào vỏ'),
    ], wrong: [A('Cắm card vào khe PCIe x1 ngắn', 'Card đồ hoạ phải cắm khe x16 (khe dài nhất, thường có ốp thép).')] },
    ssd: { name: 'SSD SATA 2.5"', req: [], title: 'Lắp ổ SSD 2.5"', steps: [
      A('Đặt ổ vào khay ổ cứng, mặt nhãn hướng lên'),
      A('Bắt vít hoặc gài khay giữ cho ổ không rung'),
      A('Xoay đầu cắm SATA của ổ ra phía dễ đi dây'),
    ], wrong: [A('Để ổ nằm tự do trong vỏ, không cần bắt vít', 'Ổ bị rung/va đập dễ hỏng và dây dễ tuột.')] },
    psucable: { name: 'Dây nguồn', req: ['psu', 'motherboard', 'processor', 'graphicscard'], title: 'Cắm dây nguồn', steps: [
      A('Cắm đầu 24-pin vào mainboard, ấn đến khi lẫy khoá'),
      A('Cắm cáp CPU (EPS 8-pin) vào cổng CPU_PWR góc trên bên trái mainboard'),
      A('Cắm cáp nguồn PCIe / 12V-2x6 vào card đồ hoạ, cắm hết đầu'),
      A('Cắm dây nguồn SATA và dây dữ liệu SATA cho ổ 2.5"'),
      A('Đi dây gọn ra phía sau khay mainboard qua các lỗ cao su'),
    ], wrong: [
      A('Dùng cáp PCIe 8-pin cắm vào cổng CPU', 'Hai loại khác cách sắp xếp chân; cắm nhầm có thể gây chập/hỏng.'),
      A('Chỉ cắm một nửa đầu 12V-2x6 cho dễ tháo', 'Cắm hở đầu 12V-2x6 có thể làm chảy đầu cắm.'),
    ] },
    sidepanel: { name: 'Kính hông', req: '*', title: 'Đóng kính hông', steps: [
      A('Kiểm tra lại tất cả dây đã cắm chặt, không vướng quạt'),
      A('Gỡ màng nilon bảo vệ trên tấm kính'),
      A('Đặt kính vào ray và vặn vít giữ'),
    ], wrong: [A('Đóng kính rồi mới kiểm tra dây', 'Kiểm tra dây trước, nếu không sẽ phải tháo kính ra lại.')] },
  };
  window.__thlSteps = STEPS; // dùng lại trong chế độ Tháo lắp 3D (teardown.js)
  const ORDER = ['ioshield', 'motherboard', 'processor', 'ram', 'nvme', 'cpucooler', 'psu', 'graphicscard', 'ssd', 'psucable', 'sidepanel'];
  const EXAM_MIN = 20;
  let S = { mode: 'practice', steps: [], pre: [], done: new Set(), mistakes: [], exam: null, booted: false };
  const $ = (q) => document.querySelector(q);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const desk = () => window.desktop || (window.parent !== window && window.parent.desktop) || null;

  // ---------- giao diện ----------
  const css = document.createElement('style');
  css.textContent = `
  body.asm .disassembly{display:none!important}
  body.asm .explorer{visibility:hidden}
  #asmPanel{position:fixed;z-index:60;left:0;top:76px;bottom:0;width:300px;background:#11161a;border-right:1px solid #263035;color:#dfe7ea;font:14px/1.45 system-ui,'Segoe UI',sans-serif;display:flex;flex-direction:column}
  #asmPanel.mini{top:auto;bottom:46px;left:12px;width:290px;border:1px solid #263035;border-radius:14px}
  #asmPanel.mini .bd{display:none}
  #asmPanel .hd{padding:14px 16px 8px}#asmPanel h2{margin:0;font-size:18px}
  #asmPanel .tabs{display:flex;gap:4px;margin-top:10px;background:#0b0f12;border-radius:10px;padding:3px}
  #asmPanel .tabs button{flex:1;border:0;background:none;color:#9fb0b6;padding:7px 4px;border-radius:8px;cursor:pointer;font:inherit;font-size:13px}
  #asmPanel .tabs button.on{background:#24333a;color:#fff}
  #asmPanel .bd{flex:1;overflow:auto;padding:6px 16px 16px}
  #asmPanel .note{color:#9fb0b6;font-size:13px;margin:6px 0 10px}
  #asmPanel ol{padding:0;margin:0;list-style:none}
  #asmPanel li{display:flex;gap:8px;align-items:center;padding:7px 9px;border-radius:9px;margin:3px 0;background:#161d21;font-size:13.5px}
  #asmPanel li .i{width:20px;text-align:center}
  #asmPanel li.done{color:#7fd6a0}#asmPanel li.next{outline:2px solid #e8b86a;background:#2a2417}
  #asmPanel .btn{display:block;width:100%;border:0;border-radius:10px;padding:10px;margin-top:10px;font:600 14px system-ui;cursor:pointer;background:#2c3a41;color:#fff}
  #asmPanel .btn.pri{background:#e8b86a;color:#1a1305}#asmPanel .btn.go{background:#2f9e5b}
  #asmPanel .exam{background:#1c1712;border:1px solid #4a3a22;border-radius:10px;padding:10px;margin:8px 0;font-size:13px}
  #asmToast{position:fixed;z-index:80;left:50%;top:92px;transform:translateX(-50%);background:#1f272b;color:#fff;padding:10px 16px;border-radius:12px;font:14px system-ui;box-shadow:0 8px 30px rgba(0,0,0,.4);max-width:560px;text-align:center;transition:opacity .3s}
  #asmToast.err{background:#5a1d1d}#asmToast.ok{background:#1d4a30}
  .asmModal{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.55);display:grid;place-items:center;font:14px/1.5 system-ui,'Segoe UI',sans-serif}
  .asmModal .card{background:#fff;color:#1d1d1f;border-radius:18px;padding:22px 24px;width:min(600px,92vw);max-height:88vh;overflow:auto}
  .asmModal h3{margin:0 0 4px;font-size:19px}.asmModal .sub{color:#666;font-size:13px;margin-bottom:8px}
  .asmModal .opts{display:grid;gap:8px;margin-top:10px}
  .asmModal .opt{text-align:left;font:inherit;padding:11px 14px;border-radius:12px;border:0;background:#f2f2f5;cursor:pointer}
  .asmModal .opt:hover{background:#e7eefc}.asmModal .opt.hint{box-shadow:0 0 0 2px #ffb020;background:#fff6e0}
  .asmModal .opt.bad{background:#ffe5e3;color:#9b1c13;text-decoration:line-through;cursor:default}
  .asmModal ol.done{color:#1a7f37;margin:6px 0;padding-left:22px}
  .asmModal .msg{min-height:20px;margin-top:8px}.asmModal .msg.ok{color:#1a7f37}.asmModal .msg.err{color:#c62828}
  .asmModal .act{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}
  .asmModal .act button{border:0;border-radius:10px;padding:9px 14px;font:600 14px system-ui;cursor:pointer;background:#eceef1}
  .asmModal .act button.pri{background:#1d1d1f;color:#fff}
  .asmModal input{display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:9px 11px;border-radius:10px;border:1px solid #ccc;font:inherit}
  .asmModal .screen{background:linear-gradient(135deg,#1e6bff,#4fc3ff);color:#fff;border-radius:12px;padding:40px 20px;text-align:center;font-size:40px;font-weight:700}`;
  document.head.appendChild(css);
  window.__thlToast = (t, k) => toast(t, k);
  function toast(t, k = '') {
    let el = $('#asmToast'); if (!el) { el = document.createElement('div'); el.id = 'asmToast'; document.body.appendChild(el); }
    el.className = k; el.textContent = t; el.style.opacity = 1; clearTimeout(toast.t); toast.t = setTimeout(() => (el.style.opacity = 0), 3800);
  }
  function modal(html) {
    const bg = document.createElement('div'); bg.className = 'asmModal';
    bg.innerHTML = `<div class="card">${html}</div>`; document.body.appendChild(bg); return bg;
  }

  const name = (c) => (STEPS[c] ? STEPS[c].name : c);
  const reqOf = (c) => (STEPS[c].req === '*' ? S.steps.filter((x) => x !== c) : STEPS[c].req.filter((r) => S.steps.includes(r)));
  const nextSuggest = () => S.steps.find((c) => !S.done.has(c) && reqOf(c).every((r) => S.done.has(r)));
  function render() {
    const p = $('#asmPanel'); if (!p) return;
    const sug = S.mode === 'practice' ? nextSuggest() : null;
    const left = S.exam ? Math.max(0, EXAM_MIN * 60 - Math.round((Date.now() - S.exam.t0) / 1000)) : 0;
    p.querySelector('.bd').innerHTML = (S.mode === 'teardown' ? `<p class="note">Đang ở chế độ tháo lắp 3D: kéo linh kiện để tháo, thả đúng chỗ để lắp lại. Bảng bên phải có góc nhìn, X-quang, mặt cắt và hướng dẫn.</p>` : S.mode === 'explore' ? `<p class="note">Đang ở chế độ khám phá: bấm vào linh kiện để đi sâu vào bên trong, kéo thanh "Tháo rời" để xem máy tách ra. Bấm "Luyện lắp" hoặc "Bài thi" để quay lại lắp ráp.</p>` :
      (S.exam ? `<div class="exam">🎓 <b>${esc(S.exam.name)}</b> · ${esc(S.exam.cls)}<br>⏱ <b id="asmT">${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}</b> · Lỗi: <b>${S.mistakes.length}</b></div>` :
        `<p class="note">Bấm vào linh kiện trên khay (bên phải thùng máy) để lắp. Lắp đúng trình tự và làm đúng thao tác. Ô viền vàng là gợi ý bước tiếp theo.</p>`) +
      `<ol>${S.steps.map((c) => `<li class="${S.done.has(c) ? 'done' : c === sug ? 'next' : ''}"><span class="i">${S.done.has(c) ? '✓' : c === sug ? '➜' : '•'}</span>${esc(name(c))}</li>`).join('')}</ol>
      ${S.done.size === S.steps.length ? `<button class="btn go" data-a="boot">⚡ Bật nguồn</button>` : ''}
      ${S.exam ? `<button class="btn pri" data-a="submit">📨 Nộp bài</button>` : `<button class="btn" data-a="reset">↺ Làm lại từ đầu</button>`}`);
    p.classList.toggle('mini', S.mode === 'explore' || S.mode === 'teardown');
    p.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.m === S.mode));
    p.querySelectorAll('.bd [data-a]').forEach((b) => (b.onclick = () => ({ boot, submit: () => submitExam(false), reset: () => restart() })[b.dataset.a]()));
  }
  function buildPanel() {
    const p = document.createElement('div'); p.id = 'asmPanel';
    p.innerHTML = `<div class="hd"><h2>🔧 Phòng lắp ráp</h2><div class="tabs"><button data-m="practice">Luyện lắp</button><button data-m="exam">🎓 Bài thi</button><button data-m="explore">🔬 Khám phá</button><button data-m="teardown">🛠 Tháo lắp 3D</button></div></div><div class="bd"></div>`;
    document.body.appendChild(p);
    p.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => setMode(b.dataset.m)));
  }

  // ---------- trạng thái ----------
  function restart() {
    const asm = window.__asm; const all = asm.concepts();
    S.steps = ORDER.filter((c) => all.includes(c));
    S.pre = all.filter((c) => !STEPS[c]);
    S.done = new Set(); S.mistakes = []; S.booted = false;
    asm.reset(S.pre);
    render();
  }
  function setMode(m) {
    if (S.exam && m !== 'exam') { toast('Đang làm bài thi – hãy nộp bài trước.', 'err'); return; }
    const asm = window.__asm;
    if (m !== 'teardown' && document.body.classList.contains('td')) window.__tdUI?.close();
    if (m === 'explore') { S.mode = m; asm.setActive(false); document.body.classList.remove('asm'); render(); return; }
    if (new URLSearchParams(location.search).get('scale') !== 'pc' && !asm.pieces.some((p) => p.concept === 'motherboard')) { location.search = '?scale=pc&asm=' + m; return; }
    if (m === 'teardown') { S.mode = m; asm.setActive(false); document.body.classList.remove('asm'); window.__tdUI?.open(); render(); return; }
    document.body.classList.add('asm');
    if (m === 'exam') { startExam(); return; }
    S.mode = m; restart(); asm.setActive(true);
  }
  function startExam() {
    let me = {}; try { me = JSON.parse(localStorage.getItem('thl.pc.student')) || {}; } catch {}
    const bg = modal(`<h3>🎓 Bài thi lắp ráp máy tính</h3><div class="sub">Thời gian ${EXAM_MIN} phút. Không có gợi ý. Trừ điểm khi lắp sai trình tự, làm sai thao tác hoặc bật nguồn khi máy chưa xong.</div>
      <label>Họ và tên<input id="asmN" value="${esc(me.name || '')}"></label><label style="display:block;margin-top:8px">Lớp<input id="asmC" value="${esc(me.cls || '')}"></label><div class="msg err" id="asmE"></div>
      <div class="act"><button data-x>Huỷ</button><button class="pri" data-go>Bắt đầu</button></div>`);
    bg.querySelector('[data-x]').onclick = () => { bg.remove(); if (!S.exam) setMode('practice'); };
    bg.querySelector('[data-go]').onclick = () => {
      const n = bg.querySelector('#asmN').value.trim().replace(/\s+/g, ' '), c = bg.querySelector('#asmC').value.trim().toUpperCase();
      if (!n || !c) { bg.querySelector('#asmE').textContent = 'Nhập họ tên và lớp.'; return; }
      try { localStorage.setItem('thl.pc.student', JSON.stringify({ name: n, cls: c })); } catch {}
      bg.remove(); S.mode = 'exam'; restart(); window.__asm.setActive(true);
      S.exam = { name: n, cls: c, t0: Date.now() };
      try { desk()?.ic3?.hello?.({ name: n, class: c, activity: 'Đang thi lắp ráp PC' })?.catch?.(() => {}); } catch {}
      render(); toast('Bắt đầu bài thi – chúc em làm tốt!', 'ok');
    };
  }
  setInterval(() => {
    if (!S.exam) return;
    const left = EXAM_MIN * 60 - Math.round((Date.now() - S.exam.t0) / 1000);
    const el = $('#asmT'); if (el) el.textContent = `${String(Math.floor(Math.max(0, left) / 60)).padStart(2, '0')}:${String(Math.max(0, left) % 60).padStart(2, '0')}`;
    if (left <= 0 && !S.exam.auto) { S.exam.auto = true; toast('Hết giờ! Bài được nộp tự động.', 'err'); submitExam(true); }
  }, 1000);
  const miss = (t) => { S.mistakes.push(t); render(); };

  // ---------- lắp một linh kiện ----------
  window.addEventListener('asm:pick', (e) => {
    if (S.mode === 'explore' || !e.detail) return;
    const c = e.detail.concept;
    if (!STEPS[c]) { toast('Phần này thuộc vỏ máy, đã có sẵn.'); return; }
    if (S.done.has(c)) { toast(`${name(c)} đã được lắp.`); return; }
    const need = reqOf(c).filter((r) => !S.done.has(r));
    if (need.length) {
      toast(`Chưa lắp ${name(c)} được: cần lắp ${need.map(name).join(', ')} trước.`, 'err');
      miss(`Sai trình tự: chọn ${name(c)} khi chưa lắp ${need.map(name).join(', ')}`);
      return;
    }
    procedure(c);
  });
  function procedure(c) {
    const st = STEPS[c]; const exam = !!S.exam;
    const items = shuffle([...st.steps.map((a, i) => ({ ...a, ok: true, i })), ...st.wrong.map((a) => ({ ...a, ok: false }))]);
    let next = 0;
    const bg = modal(`<h3>🔧 ${esc(st.title)}</h3><div class="sub">${exam ? 'Chọn các thao tác <b>đúng</b> theo <b>đúng thứ tự</b>. Chọn sai sẽ bị trừ điểm.' : 'Bấm lần lượt các thao tác theo đúng thứ tự. Cẩn thận: có thao tác <b>sai</b> lẫn vào!'}</div>
      <ol class="done"></ol><div class="opts">${items.map((it, k) => `<button class="opt" data-k="${k}">${esc(it.t)}</button>`).join('')}</div><div class="msg"></div>
      <div class="act">${exam ? '' : '<button data-h>💡 Gợi ý</button>'}<button data-x>Để sau</button></div>`);
    const msg = (t, k) => { const m = bg.querySelector('.msg'); m.className = 'msg ' + k; m.innerHTML = t; };
    bg.querySelectorAll('.opt').forEach((b) => (b.onclick = () => {
      const it = items[+b.dataset.k];
      bg.querySelectorAll('.opt.hint').forEach((x) => x.classList.remove('hint'));
      if (it.ok && it.i === next) {
        next++; b.remove(); bg.querySelector('ol.done').insertAdjacentHTML('beforeend', `<li>${esc(it.t)}</li>`); msg('✓ Đúng', 'ok');
        if (next === st.steps.length) setTimeout(() => { bg.remove(); S.done.add(c); window.__asm.install(c); render(); toast(`Đã lắp ${name(c)}.`, 'ok'); }, 350);
      } else if (it.ok) { msg(exam ? '✗ Sai thứ tự.' : '✗ Chưa đến bước này – còn thao tác khác phải làm trước.', 'err'); miss(`${st.title}: sai thứ tự – “${it.t}”`); }
      else { b.disabled = true; b.classList.add('bad'); msg(exam ? '✗ Thao tác sai.' : '✗ Sai: ' + esc(it.why), 'err'); miss(`${st.title}: thao tác sai – “${it.t}”`); }
    }));
    const h = bg.querySelector('[data-h]'); if (h) h.onclick = () => { const k = items.findIndex((it) => it.ok && it.i === next); bg.querySelector(`.opt[data-k="${k}"]`)?.classList.add('hint'); };
    bg.querySelector('[data-x]').onclick = () => bg.remove();
  }
  function boot() {
    if (S.done.size < S.steps.length) { const left = S.steps.filter((c) => !S.done.has(c)).map(name); toast('Máy chưa lắp xong: còn ' + left.join(', '), 'err'); if (S.exam) miss('Bật nguồn khi chưa lắp xong'); return; }
    S.booted = true;
    const bg = modal(`<h3>⚡ Bật nguồn</h3><div class="screen">Xin chào.</div><p>Máy tính của em đã khởi động thành công. ${S.exam ? 'Bấm Nộp bài để gửi kết quả.' : ''}</p><div class="act"><button class="pri" data-x>Đóng</button></div>`);
    bg.querySelector('[data-x]').onclick = () => bg.remove();
    render();
  }
  async function submitExam(auto) {
    const E = S.exam; if (!E) return;
    if (!auto && !confirm('Nộp bài và kết thúc bài thi?')) return;
    const secs = Math.round((Date.now() - E.t0) / 1000);
    const doneAll = S.done.size === S.steps.length;
    const ded = [];
    const order = S.mistakes.filter((m) => m.startsWith('Sai trình tự')).length, act = S.mistakes.length - order;
    if (order) ded.push([order * 5, `${order} lần sai trình tự × 5`]);
    if (act) ded.push([act * 4, `${act} thao tác sai × 4`]);
    const missing = S.steps.filter((c) => !S.done.has(c));
    if (missing.length) ded.push([missing.length * 8, `Chưa lắp: ${missing.map(name).join(', ')} (× 8)`]);
    if (!S.booted) ded.push([20, 'Chưa bật nguồn khởi động máy']);
    if (secs > EXAM_MIN * 60) ded.push([10, 'Quá thời gian']);
    const score = Math.max(0, 100 - ded.reduce((a, [d]) => a + d, 0));
    const crit = [[doneAll, 'Lắp đủ linh kiện'], [S.booted, 'Khởi động thành công'], [S.mistakes.length === 0, 'Không mắc lỗi']];
    const rec = { name: E.name, class: E.cls, school: '', level: 0, testId: 'pc-anatomy', testTitle: 'Lắp ráp PC (mô hình 3D)', mode: 'pcbuild', score: score * 10,
      correct: crit.filter(([o]) => o).length, total: crit.length, duration: secs, xp: Math.round(score / 2), wrong: S.mistakes.slice(), at: Date.now(), domains: {}, qids: [] };
    let sent = null; try { sent = desk()?.ic3?.submit ? await desk().ic3.submit(rec) : null; } catch { sent = null; }
    S.exam = null; S.mode = 'practice';
    const bg = modal(`<h3>${score >= 50 ? '🎉' : '📋'} Kết quả: ${(score / 10).toFixed(1)} / 10</h3><div class="sub">${esc(E.name)} · ${esc(E.cls)} · ${Math.floor(secs / 60)} phút ${secs % 60} giây</div>
      <ul>${crit.map(([o, t]) => `<li>${o ? '✅' : '❌'} ${esc(t)}</li>`).join('')}</ul>
      ${ded.length ? `<b>Bị trừ điểm</b><ul>${ded.map(([d, t]) => `<li><b style="color:#c62828">−${d}</b> ${esc(t)}</li>`).join('')}</ul>` : '<p>✅ Không bị trừ điểm nào. Xuất sắc!</p>'}
      ${S.mistakes.length ? `<details><summary>Chi tiết ${S.mistakes.length} lỗi</summary><ol>${S.mistakes.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></details>` : ''}
      <p class="msg ${sent && sent.sent ? 'ok' : ''}">${!sent ? 'Máy này không kết nối lớp học nên không gửi được kết quả.' : sent.sent ? '📨 Đã gửi kết quả về máy giáo viên.' : '⏳ Chưa thấy máy giáo viên – kết quả đã lưu và sẽ tự gửi khi kết nối.'}</p>
      <div class="act"><button class="pri" data-x>Đóng</button></div>`);
    bg.querySelector('[data-x]').onclick = () => { bg.remove(); restart(); };
    render();
  }

  // ---------- khởi động ----------
  function boot0() {
    const want = params.get('asm');
    if (!want) return; // chỉ bật khi mở từ TinHocLab với ?asm=...
    const asm = window.__asm;
    if (!asm || !asm.pieces.some((p) => p.concept === 'motherboard')) { setTimeout(boot0, 300); return; }
    buildPanel();
    setMode(want === 'exam' ? 'exam' : want === 'explore' ? 'explore' : want === 'teardown' ? 'teardown' : 'practice');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot0, 500)); else setTimeout(boot0, 500);
})();
