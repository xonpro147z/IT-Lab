// TinHocLab – giao diện chế độ "Tháo lắp 3D" (lõi ở lib/thl/teardown.ts, đối tượng window.__td).
// Chọn linh kiện, kéo để rút ra theo đúng hướng, xoay, thả gần chỗ lắp để lắp lại; X-quang, mặt cắt,
// bung rời theo lớp, góc camera đặt sẵn, nhãn chú thích có đường dẫn và trình diễn tự chạy.
// Ý tưởng giao diện từ Teardown (https://github.com/elvarofficial/teardown, MIT).
(function () {
  const NAME = {
    sidepanel: 'Kính hông', psucable: 'Dây nguồn', graphicscard: 'Card đồ hoạ (GPU)', cpucooler: 'Tản nhiệt CPU',
    ssd: 'SSD SATA 2.5"', psu: 'Bộ nguồn (PSU)', ram: 'RAM', nvme: 'SSD M.2 NVMe', processor: 'CPU',
    motherboard: 'Bo mạch chủ', ioshield: 'Tấm chắn I/O', chassis: 'Khung vỏ', frontpanel: 'Mặt trước',
    toppanel: 'Nắp trên', dustfilter: 'Lưới lọc bụi', frontio: 'Cổng mặt trước', drivecage: 'Khay ổ cứng', casefan: 'Quạt vỏ', psushroud: 'Tấm che nguồn', boardstandoff: 'Cọc đồng', aio: 'Tản nước AIO',
  };
  const ROLE = {
    sidepanel: 'Tấm kính che bên hông, giữ luồng gió đi đúng đường và chắn bụi. Phải mở ra trước khi làm gì bên trong.',
    psucable: 'Dây dẫn điện từ bộ nguồn tới mainboard (24-pin), CPU (8-pin), card đồ hoạ (PCIe) và ổ SATA.',
    graphicscard: 'Xử lý hình ảnh và xuất ra màn hình. Cắm vào khe PCIe x16 – khe dài nhất trên mainboard.',
    cpucooler: 'Hút nhiệt từ CPU qua lớp keo tản nhiệt và thải ra bằng lá tản và quạt.',
    ssd: 'Ổ lưu trữ 2.5 inch dùng chuẩn SATA, cần một dây nguồn và một dây dữ liệu.',
    psu: 'Đổi điện xoay chiều 220 V thành điện một chiều 12 V, 5 V, 3.3 V cho các linh kiện.',
    ram: 'Bộ nhớ tạm, chứa chương trình và dữ liệu đang chạy. Mất điện là mất dữ liệu.',
    nvme: 'Ổ SSD dạng thanh, cắm thẳng vào khe M.2 trên mainboard, nhanh hơn SSD SATA nhiều lần.',
    processor: 'Bộ xử lý trung tâm – "bộ não" thực hiện lệnh. Chỉ lắp được theo một chiều (dấu tam giác vàng).',
    motherboard: 'Tấm mạch nối mọi linh kiện với nhau: socket CPU, khe RAM, khe PCIe, khe M.2, cổng cắm.',
    ioshield: 'Tấm kim loại che quanh cụm cổng sau của mainboard, chống bụi và nhiễu điện từ.',
    chassis: 'Khung thép giữ mọi linh kiện, có sẵn cọc đồng để bắt mainboard.',
    casefan: 'Quạt hút gió mát vào và thổi gió nóng ra khỏi thùng máy.',
    drivecage: 'Khay giữ ổ cứng 2.5"/3.5".',
  };
  const OUT = {
    sidepanel: ['Tắt máy, rút dây điện, chờ khoảng 30 giây', 'Vặn vít giữ kính ở mặt sau', 'Giữ kính bằng hai tay, kéo ra khỏi ray'],
    psucable: ['Cầm đầu cắm, bóp lẫy rồi rút – không kéo dây', 'Rút đầu 24-pin, cáp CPU 8-pin, cáp PCIe và cáp SATA'],
    graphicscard: ['Rút cáp nguồn PCIe', 'Tháo vít ke card ở mặt sau vỏ', 'Ấn lẫy ở cuối khe PCIe x16', 'Rút card thẳng ra, không bẻ nghiêng'],
    cpucooler: ['Rút dây quạt khỏi chân CPU_FAN', 'Nới các vít chéo nhau, mỗi vít một ít', 'Xoay nhẹ tản qua lại để tách lớp keo rồi nhấc thẳng lên'],
    ssd: ['Rút dây nguồn và dây dữ liệu SATA', 'Mở chốt/vít giữ ổ', 'Kéo ổ ra khỏi khay'],
    nvme: ['Tháo tấm tản nhiệt M.2', 'Tháo vít giữ – đầu SSD bật nghiêng lên', 'Rút SSD theo hướng nghiêng ra khỏi khe'],
    ram: ['Mở lẫy hai đầu khe RAM', 'Cầm hai mép thanh RAM, rút thẳng lên'],
    processor: ['Ấn cần gạt xuống, đẩy ra rồi nâng lên', 'Mở khung giữ kim loại', 'Cầm hai cạnh, nhấc CPU thẳng lên – không chạm chân tiếp xúc'],
    psu: ['Rút hết dây nguồn khỏi các linh kiện', 'Tháo 4 vít ở mặt sau vỏ', 'Trượt bộ nguồn ra khỏi khoang dưới'],
    motherboard: ['Tháo hết linh kiện và dây cắm trên mainboard', 'Tháo các vít theo thứ tự chéo', 'Nhấc mainboard khỏi cọc đồng, rút cụm cổng ra khỏi tấm chắn I/O'],
    ioshield: ['Ấn tấm chắn từ ngoài vào trong cho bật ra'],
  };
  const VIEW_OF = { processor: 'socket', cpucooler: 'socket', ram: 'ram', graphicscard: 'gpu', psu: 'psu', nvme: 'storage', ssd: 'storage', motherboard: 'side', ioshield: 'rear', sidepanel: 'overview', psucable: 'side' };
  const VIEWS = [['overview', 'Tổng thể'], ['side', 'Hông'], ['rear', 'Sau'], ['top', 'Trên'], ['socket', 'Socket CPU'], ['ram', 'Khe RAM'], ['gpu', 'Khe PCIe'], ['psu', 'Nguồn'], ['storage', 'Ổ lưu trữ']];
  const STATUS = { seated: ['Đang lắp', '#7fd6a0'], moving: ['Đang di chuyển', '#e8b86a'], loose: ['Đã rút khỏi khe', '#e8b86a'], out: ['Đã tháo ra', '#9fb0b6'] };
  const nm = (c) => NAME[c] || c;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (q) => document.querySelector(q);
  const td = () => window.__td;
  const needText = (need) => need.map((c) => (c === 'sidepanel!' ? 'mở kính hông' : nm(c))).join(', ');

  const css = document.createElement('style');
  css.textContent = `
  body.td .disassembly{display:none!important}
  body.td .explorer,body.td .stage-heading,body.td .stage-tools{visibility:hidden}
  body.td .workbench .viewport{left:0!important;top:76px!important;right:0!important;bottom:0!important;width:auto!important;height:auto!important;margin:0!important}
  #tdPanel,#tdBar,#tdCap,#tdLabels{font:14px/1.45 system-ui,'Segoe UI',sans-serif;color:#dfe7ea}
  #tdPanel{position:fixed;z-index:60;right:0;top:76px;bottom:0;width:320px;background:#11161a;border-left:1px solid #263035;display:flex;flex-direction:column}
  #tdPanel .hd{padding:14px 16px 6px}#tdPanel h2{margin:0;font-size:18px}
  #tdPanel .bd{flex:1;overflow:auto;padding:4px 16px 16px}
  #tdPanel h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7f9097;margin:16px 0 6px}
  #tdPanel .card{background:#161d21;border-radius:12px;padding:12px}
  #tdPanel .card b.n{font-size:16px}#tdPanel .chip{display:inline-block;font-size:12px;padding:1px 8px;border-radius:99px;background:#0b0f12;margin-left:6px}
  #tdPanel .role{color:#b7c4c9;font-size:13px;margin:6px 0}
  #tdPanel ol.steps{margin:4px 0 0;padding-left:20px;font-size:13px;color:#c9d4d8}
  #tdPanel .warn{color:#f0a38f;font-size:13px;margin-top:6px}
  #tdPanel .row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  #tdPanel button,#tdBar button{border:0;border-radius:9px;padding:7px 10px;font:600 13px system-ui;cursor:pointer;background:#24333a;color:#fff}
  #tdPanel button:hover,#tdBar button:hover{filter:brightness(1.15)}
  #tdPanel button:disabled{opacity:.4;cursor:default}
  #tdPanel button.pri{background:#e8b86a;color:#1a1305}#tdPanel button.go{background:#2f9e5b}
  #tdPanel ul.parts{list-style:none;padding:0;margin:0}
  #tdPanel ul.parts li{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:9px;margin:2px 0;background:#161d21;cursor:pointer;font-size:13.5px}
  #tdPanel ul.parts li.sel{outline:2px solid #e8b86a}#tdPanel ul.parts li i{width:9px;height:9px;border-radius:50%;flex:none}
  #tdPanel .help{color:#8a9aa0;font-size:12.5px;margin-top:8px}
  #tdPanel kbd{background:#0b0f12;border-radius:4px;padding:0 5px;font-size:11.5px}
  #tdBar{position:fixed;z-index:59;top:84px;left:12px;right:332px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:center;pointer-events:none}
  #tdBar .grp{display:flex;gap:3px;align-items:center;background:rgba(17,22,26,.92);border:1px solid #263035;border-radius:12px;padding:4px 6px;pointer-events:auto}
  #tdBar .grp>span{font-size:11.5px;color:#7f9097;margin:0 4px;text-transform:uppercase;letter-spacing:.06em}
  #tdBar button{padding:5px 9px;font-size:12.5px;background:none;color:#b7c4c9}
  #tdBar button.on{background:#e8b86a;color:#1a1305}
  #tdBar input[type=range]{width:110px;accent-color:#e8b86a}
  #tdCap{position:fixed;z-index:61;left:50%;bottom:28px;transform:translateX(-50%);max-width:640px;background:rgba(17,22,26,.95);border:1px solid #e8b86a;border-radius:14px;padding:10px 18px;text-align:center;display:none}
  #tdCap b{color:#e8b86a}
  #tdLabels{position:fixed;inset:0;z-index:58;pointer-events:none}
  #tdLabels svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
  #tdLabels .lb{position:absolute;transform:translateY(-50%);white-space:nowrap;background:rgba(17,22,26,.88);border:1px solid #33434a;border-radius:8px;padding:2px 8px;font-size:12.5px}
  #tdLabels .lb.sel{border-color:#e8b86a;color:#fff}#tdLabels .lb.out{opacity:.75}
  body:not(.td) #tdPanel,body:not(.td) #tdBar,body:not(.td) #tdCap,body:not(.td) #tdLabels{display:none}`;
  document.head.appendChild(css);

  let built = false, sel = null, list = [], frame = [];
  function toast(t, k) { if (window.__thlToast) window.__thlToast(t, k); }

  function build() {
    if (built) return; built = true;
    const bar = document.createElement('div'); bar.id = 'tdBar';
    bar.innerHTML = `
      <div class="grp" data-g="view"><span>Góc nhìn</span>${VIEWS.map(([k, t]) => `<button data-v="${k}">${t}</button>`).join('')}</div>
      <div class="grp" data-g="xray"><span>X-quang</span><button data-x="off">Tắt</button><button data-x="case">Vỏ</button><button data-x="focus">Tập trung</button></div>
      <div class="grp" data-g="cut"><span>Mặt cắt</span><button data-c="">Tắt</button><button data-c="z">Dọc</button><button data-c="x">Ngang</button><button data-c="y">Đứng</button><input type="range" min="0" max="100" value="50" data-cp></div>
      <div class="grp"><span>Bung rời</span><input type="range" min="0" max="100" value="0" data-ex></div>
      <div class="grp"><button data-lb class="on">Nhãn</button></div>`;
    document.body.appendChild(bar);
    bar.querySelectorAll('[data-v]').forEach((b) => (b.onclick = () => { td().setView(b.dataset.v); syncBar(); }));
    bar.querySelectorAll('[data-x]').forEach((b) => (b.onclick = () => { td().setXray(b.dataset.x); syncBar(); }));
    bar.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { td().setCut(b.dataset.c || null); syncBar(); }));
    bar.querySelector('[data-cp]').oninput = (e) => td().setCut(td().cut.axis, e.target.value / 100);
    bar.querySelector('[data-ex]').oninput = (e) => td().setExplode(e.target.value / 100);
    bar.querySelector('[data-lb]').onclick = (e) => { td().labels = !td().labels; td().touch(); e.target.classList.toggle('on', td().labels); };

    const p = document.createElement('div'); p.id = 'tdPanel';
    p.innerHTML = `<div class="hd"><h2>🛠 Tháo lắp 3D</h2></div><div class="bd"></div>`;
    document.body.appendChild(p);
    const cap = document.createElement('div'); cap.id = 'tdCap'; document.body.appendChild(cap);
    const lab = document.createElement('div'); lab.id = 'tdLabels'; lab.innerHTML = '<svg></svg><div></div>'; document.body.appendChild(lab);
  }
  function syncBar() {
    const t = td(); if (!t) return;
    document.querySelectorAll('#tdBar [data-v]').forEach((b) => b.classList.toggle('on', b.dataset.v === t.view));
    document.querySelectorAll('#tdBar [data-x]').forEach((b) => b.classList.toggle('on', b.dataset.x === t.xray));
    document.querySelectorAll('#tdBar [data-c]').forEach((b) => b.classList.toggle('on', (b.dataset.c || null) === t.cut.axis));
    const cp = $('#tdBar [data-cp]'); if (cp) cp.disabled = !t.cut.axis;
  }

  function render() {
    const bd = $('#tdPanel .bd'); if (!bd) return;
    const t = td();
    const item = sel && list.find((x) => x.concept === sel.concept && x.instance === sel.instance);
    const multi = (c) => list.filter((x) => x.concept === c).length > 1;
    const label = (x) => nm(x.concept) + (multi(x.concept) ? ' ' + (x.instance + 1) : '');
    const steps = window.__thlSteps || {};
    let info = '<p class="help">Bấm vào một linh kiện trong máy để xem thông tin. Kéo nó để rút ra theo đúng hướng lắp.</p>';
    if (sel) {
      const st = item ? STATUS[item.status] : null;
      const ins = steps[sel.concept] ? steps[sel.concept].steps.map((a) => a.t) : [];
      info = `<div class="card"><b class="n">${esc(item ? label(item) : nm(sel.concept))}</b>${st ? `<span class="chip" style="color:${st[1]}">${st[0]}</span>` : '<span class="chip">Cố định</span>'}
        <div class="role">${esc(ROLE[sel.concept] || '')}</div>
        ${item && item.status === 'seated' && item.blockers.length ? `<div class="warn">⛔ Cần tháo trước: ${esc(needText(item.blockers))}</div>` : ''}
        ${item && item.status !== 'seated' && item.missing.length ? `<div class="warn">⛔ Muốn lắp lại cần: ${esc(needText(item.missing))}</div>` : ''}
        ${item ? `<div class="row"><button class="pri" data-a="remove" ${item.status === 'out' || item.status === 'moving' ? 'disabled' : ''}>⬆ Tháo ra</button>
          <button class="go" data-a="install" ${item.status === 'seated' || item.status === 'moving' ? 'disabled' : ''}>⬇ Lắp vào</button>
          <button data-a="focus">🎯 Nhìn gần</button></div>
          <div class="row"><button data-r="y,-90" title="Q">↺ Xoay trái</button><button data-r="y,90" title="E">↻ Xoay phải</button><button data-r="x,90" title="R">⤾ Lật</button><button data-r="z,90" title="F">⟳ Nghiêng</button><button data-a="straight" title="T">Căn thẳng</button></div>` : ''}
        ${OUT[sel.concept] ? `<h3>Cách tháo</h3><ol class="steps">${OUT[sel.concept].map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
        ${ins.length ? `<h3>Cách lắp</h3><ol class="steps">${ins.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}</div>`;
    }
    bd.innerHTML = `${info}
      <h3>Linh kiện</h3><ul class="parts">${list.map((x) => `<li data-c="${x.concept}" data-i="${x.instance}" class="${sel && sel.concept === x.concept && sel.instance === x.instance ? 'sel' : ''}"><i style="background:${STATUS[x.status][1]}"></i>${esc(label(x))}<span style="margin-left:auto;font-size:12px;color:#7f9097">${STATUS[x.status][0]}</span></li>`).join('')}</ul>
      <h3>Hướng dẫn</h3><div class="row"><button data-a="tourOut">▶ Xem cách tháo</button><button data-a="tourIn">▶ Xem cách lắp</button></div>
      <div class="row"><button data-a="all-out">Tháo hết</button><button data-a="all-in">Lắp lại hết</button></div>
      <p class="help">Kéo linh kiện: rút dọc theo khe, ra khỏi khe thì kéo tự do (không xuyên qua vỏ hay linh kiện khác). <kbd>Shift</kbd>+kéo: xoay tự do. <kbd>Q</kbd>/<kbd>E</kbd>/<kbd>R</kbd>/<kbd>F</kbd>: xoay 90°, <kbd>T</kbd>: căn thẳng. Thả gần chỗ lắp (khung xanh) và đúng hướng để lắp lại. Kéo khoảng trống để xoay camera.</p>`;
    const pc = () => t.pieces(sel.concept).find((p) => p.instance === sel.instance);
    bd.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'remove') t.remove(pc());
      else if (a === 'install') t.install(pc());
      else if (a === 'focus') { t.setView('selected'); syncBar(); }
      else if (a === 'straight') t.straighten(pc());
      else if (a === 'all-out') { t.stopQueue(); t.removeAll(); }
      else if (a === 'all-in') { t.stopQueue(); t.installAll(); }
      else if (a === 'tourOut') tour(false);
      else if (a === 'tourIn') tour(true);
    }));
    bd.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => { const [ax, d] = b.dataset.r.split(','); if (!t.rotate(pc(), ax, +d)) toast('Chỉ xoay được linh kiện đã tháo ra khỏi máy.'); }));
    bd.querySelectorAll('ul.parts li').forEach((li) => (li.onclick = () => t.selectBy(li.dataset.c, +li.dataset.i)));
  }

  // Trình diễn tự chạy (mẫu "auto tour" của Teardown): chạm vào máy là dừng, nhường quyền ngay.
  function caption(html) { const c = $('#tdCap'); if (!c) return; c.innerHTML = html; c.style.display = html ? 'block' : 'none'; }
  function tour(install) {
    const t = td(); t.stopQueue(); t.setExplode(0); $('#tdBar [data-ex]').value = 0;
    const order = ['sidepanel', 'psucable', 'graphicscard', 'cpucooler', 'ssd', 'nvme', 'ram', 'processor', 'psu', 'motherboard', 'ioshield'];
    const seq = install ? [...order].reverse() : order;
    const steps = window.__thlSteps || {};
    t.enqueue(() => { caption(install ? '<b>Lắp ráp</b> – lắp từ trong ra ngoài, mỗi linh kiện cắm thẳng theo khe' : '<b>Tháo máy</b> – tháo từ ngoài vào trong, ngược thứ tự lắp'); t.setView('overview'); syncBar(); return 1.6; });
    for (const c of seq) {
      const pieces = t.pieces(c); if (!pieces.length) continue;
      t.enqueue(() => {
        t.select(pieces[0]); t.setView(VIEW_OF[c] || 'overview'); syncBar();
        const how = install ? (steps[c] ? steps[c].steps.map((a) => a.t) : []) : OUT[c] || [];
        caption(`<b>${esc(install ? 'Lắp ' : 'Tháo ')}${esc(nm(c))}</b><br>${how.map(esc).join(' → ')}`);
        return 1.8;
      });
      for (const p of pieces) t.enqueue(() => ((install ? t.install(p, true) : t.remove(p, true)) ? 0.25 : 0));
      t.enqueue(() => 0.5);
    }
    t.enqueue(() => { caption(install ? '✅ Đã lắp xong. Bấm Hướng dẫn để xem lại, hoặc tự tay tháo lắp.' : '✅ Đã tháo xong. Bây giờ em thử tự lắp lại nhé!'); t.setView('overview'); syncBar(); return 3; });
    t.enqueue(() => { caption(''); });
  }

  // Nhãn chú thích có đường dẫn: hai cột nhãn hai bên máy, không che linh kiện nó gọi tên,
  // xếp theo chiều cao để các đường dẫn không cắt nhau (bảng gọi tên của Teardown).
  function drawLabels() {
    const box = $('#tdLabels'); if (!box) return;
    const W = innerWidth, H = innerHeight, R = W - 332, TOP = 140, GAP = 25;
    const multi = (c) => frame.filter((x) => x.concept === c).length > 1;
    let svg = '', html = '';
    if (frame.length) {
      const xs = frame.map((it) => it.x);
      const minX = Math.min(...xs), maxX = Math.max(...xs), mid = (minX + maxX) / 2;
      const cols = [
        { items: frame.filter((it) => it.x < mid || (frame.length === 1 && it.x < (R + 12) / 2)), x: Math.max(150, minX - 70), left: true },
        { items: [], x: Math.min(R - 150, maxX + 70), left: false },
      ];
      cols[1].items = frame.filter((it) => !cols[0].items.includes(it));
      for (const col of cols) {
        const its = col.items.sort((a, b) => a.y - b.y);
        const ys = its.map((it) => Math.max(TOP, it.y));
        for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + GAP);
        const over = ys.length ? ys[ys.length - 1] - (col.left ? H - 200 : H - 30) : 0; // cột trái tránh bảng Phòng lắp ráp
        if (over > 0) for (let i = ys.length - 1; i >= 0; i--) ys[i] = Math.max(TOP, Math.min(ys[i] - over, i < ys.length - 1 ? ys[i + 1] - GAP : Infinity));
        its.forEach((it, i) => {
          const ly = ys[i], c = it.selected ? '#e8b86a' : '#8fa3aa';
          const ex = col.left ? col.x + 6 : col.x - 6;
          svg += `<polyline points="${it.x},${it.y} ${ex},${ly} ${col.x},${ly}" fill="none" stroke="${c}" stroke-width="1.1"/><circle cx="${it.x}" cy="${it.y}" r="3" fill="${it.selected ? '#e8b86a' : '#dfe7ea'}"/>`;
          const text = nm(it.concept) + (multi(it.concept) ? ' ' + (it.instance + 1) : '');
          html += `<div class="lb ${it.selected ? 'sel' : ''} ${it.status === 'out' ? 'out' : ''}" style="${col.left ? `right:${W - col.x}px` : `left:${col.x}px`};top:${ly}px">${esc(text)}</div>`;
        });
      }
    }
    box.querySelector('svg').innerHTML = svg;
    box.querySelector('div').innerHTML = html;
  }

  const MSG = {
    blocked: (d) => [`Chưa tháo được ${nm(d.concept)}: cần tháo ${needText(d.need)} trước.`, 'err'],
    missing: (d) => [`Chưa lắp được ${nm(d.concept)}: cần ${needText(d.need)} trước.`, 'err'],
    orient: (d) => [`${nm(d.concept)} đang sai hướng – xoay lại cho đúng chiều (phím T: căn thẳng).`, 'err'],
    installed: (d) => [`Đã lắp ${nm(d.concept)}.`, 'ok'],
    released: (d) => [`Đã rút ${nm(d.concept)} khỏi khe – kéo tiếp để đặt ra ngoài.`, ''],
    exploded: () => ['Đang bung rời – kéo thanh "Bung rời" về 0 để tháo lắp.', ''],
  };
  addEventListener('td:msg', (e) => { if (!document.body.classList.contains('td')) return; const f = MSG[e.detail.code]; if (f) toast(...f(e.detail)); });
  addEventListener('td:state', (e) => { list = e.detail; render(); });
  addEventListener('td:select', (e) => { sel = e.detail; render(); });
  addEventListener('td:frame', (e) => { frame = e.detail; drawLabels(); });
  addEventListener('td:takeover', () => caption(''));
  addEventListener('resize', drawLabels);

  // phần màn hình bị bảng phải và thanh công cụ che: tâm hình dời vào vùng còn trống
  function fitInset() {
    const t = td(), bar = $('#tdBar'); if (!t || !bar) return;
    const top = Math.max(0, Math.round(bar.getBoundingClientRect().bottom - 76 + 8));
    if (t.inset.right === 320 && t.inset.top === top) return;
    t.inset.right = 320; t.inset.top = top; t.touch(); t.setView(t.view || 'overview');
  }
  addEventListener('resize', () => document.body.classList.contains('td') && fitInset());
  window.__tdUI = {
    open() {
      build(); document.body.classList.add('td');
      const t = td(); if (!t) return;
      fitInset();
      t.setActive(true); list = t.list(); sel = null; render(); syncBar();
      $('#tdBar [data-ex]').value = 0;
    },
    close() { document.body.classList.remove('td'); caption(''); const t = td(); if (t) t.setActive(false); },
  };
})();
