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
  let S = { mode: 'explore', steps: [], pre: [], done: new Set(), mistakes: [], exam: null, booted: false };
  const $ = (q) => document.querySelector(q);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const desk = () => window.desktop || (window.parent !== window && window.parent.desktop) || null;

  // ---------- giao diện ----------
  const css = document.createElement('style');
  css.textContent = `
  body.asm .byline{position:fixed!important;right:14px;bottom:12px;left:auto!important;top:auto!important;transform:none!important;z-index:30;display:inline-flex!important;background:rgba(20,24,34,.82);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:5px 12px;backdrop-filter:blur(6px)}
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
  #asmPanel .cfg{background:#161d21;border:1px solid #263035;border-radius:10px;padding:9px 10px;margin:6px 0 8px;font-size:13px}
  #asmPanel .cfg b{color:#fff}#asmPanel .cfg .pr{color:#e8b86a}
  #asmPanel .btn.sm{padding:7px;font-size:13px;margin-top:6px}
  #asmPanel li small{display:block;color:#7f9197;font-size:11.5px;line-height:1.3;margin-top:1px}
  #asmPanel li .t{flex:1;min-width:0}
  #asmCfg{position:fixed;inset:0;z-index:85;background:#0c1013;color:#dfe7ea;font:14px/1.45 system-ui,'Segoe UI',sans-serif;display:grid;grid-template-columns:270px 1fr 330px;grid-template-rows:auto 1fr}
  #asmCfg header{grid-column:1/-1;display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid #222b30;background:#11161a}
  #asmCfg header h2{margin:0;font-size:18px;flex:1}#asmCfg header .tm{font:700 16px ui-monospace,monospace;color:#e8b86a}
  #asmCfg header button,#asmCfg .act button{border:0;border-radius:10px;padding:9px 14px;font:600 14px system-ui;cursor:pointer;background:#2c3a41;color:#fff}
  #asmCfg button.pri{background:#e8b86a;color:#1a1305}#asmCfg button.go{background:#2f9e5b;color:#fff}
  #asmCfg .slots{overflow:auto;padding:10px;border-right:1px solid #222b30}
  #asmCfg .slot{display:block;width:100%;text-align:left;border:1px solid #263035;background:#141a1e;color:inherit;border-radius:11px;padding:9px 11px;margin-bottom:7px;cursor:pointer;font:inherit}
  #asmCfg .slot.on{border-color:#e8b86a;background:#231f15}#asmCfg .slot .k{font-size:12px;color:#8ea0a6;display:flex;justify-content:space-between}
  #asmCfg .slot .v{font-size:13.5px;color:#fff;margin-top:2px}#asmCfg .slot .v.no{color:#6d7d83;font-style:italic}
  #asmCfg .slot .bad{color:#ff7b72}#asmCfg .slot .x{color:#ff8a80;cursor:pointer;padding:0 6px;font-weight:700}
  #asmCfg .qty{display:flex;gap:6px;align-items:center;margin-top:5px}#asmCfg .qty button{width:26px;height:26px;border-radius:7px;border:0;background:#2c3a41;color:#fff;cursor:pointer}
  #asmCfg .list{display:flex;flex-direction:column;min-height:0}
  #asmCfg .flt{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid #222b30}
  #asmCfg .flt input[type=search],#asmCfg .flt select{background:#141a1e;border:1px solid #2c373c;color:#fff;border-radius:9px;padding:7px 10px;font:inherit}
  #asmCfg .flt input[type=search]{flex:1;min-width:180px}#asmCfg .flt label{font-size:13px;color:#a9b8bd;display:flex;gap:5px;align-items:center}
  #asmCfg .items{overflow:auto;padding:8px 14px 20px}
  #asmCfg .it{display:flex;gap:12px;align-items:center;border-bottom:1px solid #1c2428;padding:9px 4px}
  #asmCfg .it .nm{flex:1;min-width:0}#asmCfg .it .nm b{display:block;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #asmCfg .it .nm span{font-size:12.5px;color:#8ea0a6}#asmCfg .it .pr{font-weight:600;color:#e8b86a;white-space:nowrap}
  #asmCfg .it button{border:0;border-radius:9px;padding:7px 12px;font:600 13px system-ui;cursor:pointer;background:#2c3a41;color:#fff;min-width:64px}
  #asmCfg .it.sel{background:#1b2a20}#asmCfg .it.sel button{background:#2f9e5b}
  #asmCfg .it.inc .nm b{color:#c98f8a}#asmCfg .it .tag{font-size:11px;color:#ff8a80;margin-left:6px}
  #asmCfg .more{margin:12px auto;display:block;border:0;border-radius:9px;padding:8px 16px;background:#2c3a41;color:#fff;cursor:pointer}
  #asmCfg .side{overflow:auto;padding:12px 14px;border-left:1px solid #222b30;background:#0f1417}
  #asmCfg .side h4{margin:12px 0 6px;font-size:13px;color:#8ea0a6;text-transform:uppercase;letter-spacing:.04em}
  #asmCfg .tot{display:grid;grid-template-columns:1fr 1fr;gap:8px}#asmCfg .tot div{background:#161d21;border-radius:10px;padding:8px 10px}
  #asmCfg .tot b{display:block;font-size:17px;color:#fff}#asmCfg .tot span{font-size:12px;color:#8ea0a6}#asmCfg .tot .over b{color:#ff7b72}
  #asmCfg .chk{list-style:none;padding:0;margin:0;font-size:13px}#asmCfg .chk li{padding:6px 8px;border-radius:8px;margin:4px 0;background:#161d21}
  #asmCfg .chk li.e{background:#3a1717;color:#ffb4ab}#asmCfg .chk li.w{background:#33290f;color:#ffd27a}#asmCfg .chk li.o{color:#8fd8a8}
  #asmCfg .preset{display:block;width:100%;text-align:left;border:1px solid #263035;background:#141a1e;color:#fff;border-radius:10px;padding:8px 10px;margin:5px 0;cursor:pointer;font:inherit}
  #asmCfg .preset span{display:block;font-size:12px;color:#8ea0a6}
  #asmCfg .brief{background:#1c1712;border:1px solid #4a3a22;border-radius:10px;padding:10px;font-size:13px}
  #asmCfg .act{display:grid;gap:8px;margin-top:14px}
  #asmCfg .th{width:54px;height:54px;flex:none;border-radius:9px;background:#fff;display:grid;place-items:center;overflow:hidden;font-size:22px}
  #asmCfg .th img{max-width:100%;max-height:100%;object-fit:contain;cursor:zoom-in}#asmCfg .th.none{background:#1b2328}
  #asmCfg .th.sm{width:40px;height:40px;font-size:17px}#asmCfg .slot .sv{display:flex;gap:9px;align-items:center;margin-top:3px}
  .asmInsp .pic{flex:1;min-height:0;display:grid;place-items:center;background:#fff;margin:10px 18px;border-radius:12px;overflow:hidden}
  .asmInsp .pic img{max-width:100%;max-height:100%;object-fit:contain}.asmInsp .pic .st{color:#555}
  #asmCfg .flt select.f{max-width:150px}
  #asmCfg .saved{list-style:none;padding:0;margin:6px 0 0;font-size:13px}#asmCfg .saved li{display:flex;gap:6px;align-items:center;background:#161d21;border-radius:8px;padding:6px 8px;margin:4px 0}
  #asmCfg .saved li span{flex:1;min-width:0}#asmCfg .saved li small{display:block;color:#8ea0a6}#asmCfg .saved button{border:0;border-radius:7px;padding:5px 8px;background:#2c3a41;color:#fff;cursor:pointer;font:600 12px system-ui}
  #asmCfg .saverow{display:flex;gap:6px}#asmCfg .saverow input{flex:1;min-width:0;background:#141a1e;border:1px solid #2c373c;color:#fff;border-radius:9px;padding:7px 9px;font:inherit}
  #asmCfg .saverow button{border:0;border-radius:9px;padding:7px 10px;background:#2c3a41;color:#fff;cursor:pointer;font:600 13px system-ui}
  .asmInsp{position:fixed;inset:0;z-index:95;background:rgba(0,0,0,.6);display:grid;place-items:center;font:14px/1.45 system-ui,'Segoe UI',sans-serif}
  .asmInsp .card{background:#11161a;color:#dfe7ea;border:1px solid #263035;border-radius:18px;width:min(860px,94vw);height:min(640px,90vh);display:flex;flex-direction:column;overflow:hidden}
  .asmInsp header{display:flex;gap:10px;align-items:flex-start;padding:14px 18px 8px}.asmInsp h3{margin:0;font-size:18px;flex:1}.asmInsp header .pr{color:#e8b86a;font-weight:700}
  .asmInsp .sp{padding:0 18px;color:#8ea0a6;font-size:13px}
  .asmInsp .tools{display:flex;gap:8px;flex-wrap:wrap;padding:10px 18px;align-items:center}
  .asmInsp button{border:0;border-radius:9px;padding:7px 12px;background:#2c3a41;color:#fff;cursor:pointer;font:600 13px system-ui}
  .asmInsp .note{font-size:12px;color:#7f9197;margin-left:auto}
  .asmInsp .cr{padding:0 18px 12px;font-size:12.5px;color:#9fb0b6}.asmInsp .cr a{color:#7cc4ff}.asmInsp .cr button{padding:4px 9px;font-size:12px;margin-left:6px}
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
    p.querySelector('.bd').innerHTML = S.mode === 'teardown' ? `<p class="note">Đang ở chế độ Tháo lắp 3D: kéo linh kiện để tháo ra, thả đúng chỗ và đúng hướng để lắp lại. Bảng bên phải có góc nhìn, X-quang, mặt cắt, bung rời và trình diễn tự chạy.</p>` : ((S.mode === 'explore' ? `<p class="note">Đang ở chế độ khám phá: bấm vào linh kiện để đi sâu vào bên trong, kéo thanh "Tháo rời" để xem máy tách ra. Bấm "Luyện lắp" để bắt đầu lắp ráp.</p>` :
        `<p class="note">Chọn linh kiện cho máy rồi bấm vào từng linh kiện trên khay (bên phải thùng máy) để lắp. Lắp đúng trình tự; dấu ➜ là gợi ý bước tiếp theo.</p>`) +
      (S.mode === 'practice' ? cfgBlock() : '') +
      `<ol>${S.steps.map((c) => { const sub = partOf(c); return `<li class="${S.done.has(c) ? 'done' : c === sug ? 'next' : ''}"><span class="i">${S.done.has(c) ? '✓' : c === sug ? '➜' : '•'}</span><span class="t">${esc(name(c))}${sub ? `<small>${esc(sub)}</small>` : ''}</span></li>`; }).join('')}</ol>
      ${S.done.size === S.steps.length ? `<button class="btn go" data-a="boot">⚡ Bật nguồn</button>` : ''}
      <button class="btn" data-a="reset">↺ Làm lại từ đầu</button>`);
    p.classList.toggle('mini', S.mode === 'explore' || S.mode === 'teardown');
    p.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.m === S.mode));
    p.querySelectorAll('.bd [data-a]').forEach((b) => (b.onclick = () => ({ boot, reset: () => restart(), cfg: () => openCfg('practice'), def: () => useDefault() })[b.dataset.a]()));
  }
  function buildPanel() {
    const p = document.createElement('div'); p.id = 'asmPanel';
    p.innerHTML = `<div class="hd"><h2>🔧 Phòng lắp ráp</h2><div class="tabs"><button data-m="explore">🔬 Khám phá</button><button data-m="practice">🔧 Luyện lắp</button><button data-m="teardown">🛠 Tháo lắp 3D</button></div></div><div class="bd"></div>`;
    document.body.appendChild(p);
    p.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => setMode(b.dataset.m)));
  }

  // ---------- trạng thái ----------
  function restart() {
    const asm = window.__asm; const all = asm.concepts();
    S.steps = ORDER.filter((c) => all.includes(c));
    S.pre = all.filter((c) => !STEPS[c]);
    if (CFG && CFG.b && !CFG.b.storage.some((d) => d.iface === 'M.2') && S.steps.includes('nvme')) { S.steps = S.steps.filter((c) => c !== 'nvme'); S.pre.push('nvme'); }
    S.done = new Set(); S.mistakes = []; S.booted = false;
    asm.reset(S.pre);
    render();
  }
  function setMode(m) {
    const asm = window.__asm;
    if (m !== 'teardown' && document.body.classList.contains('td')) window.__tdUI?.close();
    if (m === 'explore') { S.mode = m; asm.setActive(false); document.body.classList.remove('asm'); render(); return; }
    if (new URLSearchParams(location.search).get('scale') !== 'pc' && !asm.pieces.some((p) => p.concept === 'motherboard')) { location.search = '?scale=pc&asm=' + m; return; }
    if (m === 'teardown') { S.mode = m; asm.setActive(false); document.body.classList.remove('asm'); window.__tdUI?.open(); render(); return; }
    document.body.classList.add('asm');
    S.mode = m; restart(); asm.setActive(true);
  }
  const miss = (t) => { S.mistakes.push(t); render(); };

  // ---------- lắp một linh kiện ----------
  window.addEventListener('asm:pick', (e) => {
    if (S.mode === 'explore' || S.mode === 'teardown' || !e.detail) return;
    const c = e.detail.concept;
    if (!STEPS[c] || !S.steps.includes(c)) { toast('Phần này đã có sẵn trong máy.'); return; }
    if (S.done.has(c)) { toast(`${name(c)} đã được lắp.`); return; }
    const need = reqOf(c).filter((r) => !S.done.has(r));
    if (need.length) {
      toast(`Chưa lắp ${name(c)} được: cần lắp ${need.map(name).join(', ')} trước.`, 'err');
      miss(`Sai trình tự: chọn ${name(c)} khi chưa lắp ${need.map(name).join(', ')}`);
      return;
    }
    S.done.add(c); window.__asm.install(c); render(); toast(`Đã lắp ${name(c)}.`, 'ok');
  });
  function boot() {
    if (S.done.size < S.steps.length) { const left = S.steps.filter((c) => !S.done.has(c)).map(name); toast('Máy chưa lắp xong: còn ' + left.join(', '), 'err'); return; }
    S.booted = true;
    const bg = modal(`<h3>⚡ Bật nguồn</h3><div class="screen">Xin chào.</div><p>Máy tính của em đã khởi động thành công.</p><div class="act"><button class="pri" data-x>Đóng</button></div>`);
    bg.querySelector('[data-x]').onclick = () => bg.remove();
    render();
  }
  // ---------- chọn linh kiện (danh mục từ pc-builder-emulator, MIT) ----------
  let CFG = null; // { sel: {slot: id | {id,qty} | [ids]}, b: cấu hình đã giải, name }
  const money = (v) => (v || 0).toLocaleString('vi-VN') + ' đ';
  const emptySel = () => ({ case: null, motherboard: null, cpu: null, ram: null, gpu: null, storage: [], psu: null, cooler: null });
  let catP = null;
  function loadCat() {
    if (window.PCCAT && window.PCCHECK) return Promise.resolve();
    if (catP) return catP;
    const add = (src) => new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
    catP = add('./pccheck.js').then(() => add('./pccat.js'));
    return catP;
  }
  let BYID = null;
  const part = (id) => { if (!BYID) { BYID = new Map(); for (const x of window.PCCAT.parts) BYID.set(x.id, x); } return BYID.get(id) || null; };
  function resolve(sel) {
    const b = {};
    for (const k of ['case', 'motherboard', 'cpu', 'gpu', 'psu', 'cooler']) b[k] = sel[k] ? part(sel[k]) : null;
    b.ram = sel.ram && part(sel.ram.id) ? { part: part(sel.ram.id), qty: sel.ram.qty } : null;
    b.storage = (sel.storage || []).map(part).filter(Boolean);
    return b;
  }
  const SLOT_OF = { processor: 'cpu', motherboard: 'motherboard', ram: 'ram', cpucooler: 'cooler', psu: 'psu', graphicscard: 'gpu' };
  function partOf(c) {
    if (!CFG || !CFG.b) return '';
    const b = CFG.b;
    if (c === 'ram') return b.ram ? `${b.ram.part.name}${b.ram.qty > 1 ? ' × ' + b.ram.qty : ''}` : '';
    if (c === 'nvme') return b.storage.filter((d) => d.iface === 'M.2').map((d) => d.name).join(', ');
    if (c === 'ssd') return b.storage.filter((d) => d.iface === 'SATA').map((d) => d.name).join(', ');
    return SLOT_OF[c] && b[SLOT_OF[c]] ? b[SLOT_OF[c]].name : '';
  }
  function cfgBlock() {
    if (!CFG || !CFG.b) return `<div class="cfg">Đang dùng <b>máy mẫu</b> của PC Anatomy.<button class="btn sm pri" data-a="cfg">🛒 Chọn linh kiện cho máy</button></div>`;
    const r = window.PCCHECK.check(CFG.b);
    return `<div class="cfg">Cấu hình: <b>${esc(CFG.name || 'Tự chọn')}</b><br>Giá: <span class="pr">${money(r.price)}</span> · ${r.watts} W${CFG.look ? `<br>Vỏ máy 3D: ${LOOKNAME[CFG.look.color]}, ${LOOKNAME[CFG.look.front]}` : ''}${r.errors.length ? `<br><span style="color:#ff8a80">⚠ ${r.errors.length} lỗi không tương thích</span>` : ''}
      <button class="btn sm pri" data-a="cfg">🛒 Đổi linh kiện</button><button class="btn sm" data-a="def">Dùng lại máy mẫu</button></div>`;
  }
  function useDefault() { try { sessionStorage.removeItem('thl.asm.cfg'); } catch {} location.search = '?scale=pc&asm=practice'; }
  // Nhãn trên khay: mô hình 3D chỉ có RAM DDR5 nên đổi chữ cho đúng loại RAM đã chọn
  function relabel() {
    const t = CFG && CFG.b && CFG.b.ram ? CFG.b.ram.part.ram : null;
    if (!t || t === 'DDR5') return;
    const fix = () => document.querySelectorAll('body *').forEach((el) => { if (el.childNodes.length === 1 && el.firstChild.nodeType === 3 && el.firstChild.nodeValue.trim() === 'RAM DDR5') el.firstChild.nodeValue = 'RAM ' + t; });
    fix(); new MutationObserver(fix).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  const CAT_ORDER = ['cpu', 'motherboard', 'ram', 'cooler', 'gpu', 'storage', 'psu', 'case'];
  const ICON = { cpu: '🧠', motherboard: '🟩', ram: '📏', cooler: '❄️', gpu: '🎮', storage: '💾', psu: '🔌', case: '🖥️' };
  const gbTxt = (g) => (g >= 1000 ? +(g / 1000).toFixed(1) + ' TB' : g + ' GB');
  function specLine(x) {
    const F = window.PCCHECK.FFNAME;
    switch (x.c) {
      case 'cpu': return `${x.socket} · ${x.cores} nhân${x.ghz ? ' · ' + x.ghz + ' GHz' : ''} · ${x.w} W`;
      case 'motherboard': return `${x.socket}${x.chip ? ' · ' + x.chip : ''} · ${F[x.ff]} · ${x.ram} · ${x.m2} khe M.2 · ${x.sata} SATA`;
      case 'ram': return `${x.ram}${x.mhz ? ' · ' + x.mhz + ' MHz' : ''} · ${x.n} thanh · ${x.sku || ''}`;
      case 'gpu': return `${x.vram} GB VRAM · dài ${x.len} mm · ${x.w} W`;
      case 'storage': return `${x.kind} · ${gbTxt(x.gb)} · ${x.form}`;
      case 'psu': return `${x.watts} W${x.rating ? ' · ' + x.rating : ''}`;
      case 'cooler': return `${x.style === 'Liquid' ? 'Tản nước ' + x.rad + ' mm' : 'Tản khí'} · ${x.cap} W · ${x.sockets.join(', ')}`;
      case 'case': return `${F[x.ff]} · card dài ≤ ${x.gpu} mm · két nước ≤ ${x.rad} mm`;
    }
    return '';
  }
  function openCfg(mode) {
    loadCat().then(() => {
      const exam = mode === 'exam';
      const sel = JSON.parse(JSON.stringify(CFG && CFG.sel ? CFG.sel : emptySel()));
      if (exam) CFG = { ...(CFG || {}), live: sel };
      let cur = 'cpu', q = '', onlyOk = !exam, shown = 60, sort = 'p', pname = CFG && CFG.name ? CFG.name : '', flt = {};
      $('#asmCfg')?.remove();
      const el = document.createElement('div'); el.id = 'asmCfg'; document.body.appendChild(el);
      const brief = exam ? window.PCCHECK.BRIEFS.find((b) => b.id === S.exam.brief) : null;
      el.innerHTML = `<header><h2>🛒 ${exam ? 'Bài thi – Phần 1: chọn linh kiện' : 'Chọn linh kiện cho máy tính'}</h2>${exam ? '<span class="tm" id="asmCfgT"></span>' : '<button data-close>✕ Đóng</button>'}</header>
        <div class="slots"></div><div class="list"><div class="flt"></div><div class="items"></div></div><div class="side"></div>`;
      if (!exam) el.querySelector('[data-close]').onclick = () => el.remove();
      const all = window.PCCAT.parts;
      const errCount = (s2) => window.PCCHECK.check(resolve(s2)).errors.length;
      function candidate(x) {
        const s2 = JSON.parse(JSON.stringify(sel));
        if (x.c === 'storage') s2.storage = [...s2.storage, x.id];
        else if (x.c === 'ram') s2.ram = { id: x.id, qty: sel.ram ? sel.ram.qty : 1 };
        else s2[x.c] = x.id;
        const base = JSON.parse(JSON.stringify(sel)); if (x.c !== 'storage') { if (x.c === 'ram') base.ram = null; else base[x.c] = null; }
        return errCount(s2) <= errCount(base);
      }
      function drawSlots() {
        const b = resolve(sel), L = window.PCCHECK.LABEL;
        el.querySelector('.slots').innerHTML = CAT_ORDER.map((k) => {
          let v = '';
          if (k === 'storage') v = b.storage.length ? b.storage.map((d, i) => `<div>${esc(d.name)}<span class="x" data-rm="${i}" title="Bỏ">✕</span></div>`).join('') : '';
          else if (k === 'ram') v = b.ram ? `${esc(b.ram.part.name)}<div class="qty">Số bộ: <button data-q="-1">−</button><b>${b.ram.qty}</b><button data-q="1">+</button></div>` : '';
          else v = b[k] ? esc(b[k].name) : '';
          const one = k === 'storage' ? b.storage[0] : k === 'ram' ? b.ram && b.ram.part : b[k];
          const pr = k === 'storage' ? b.storage.reduce((a, d) => a + d.p, 0) : k === 'ram' ? (b.ram ? b.ram.part.p * b.ram.qty : 0) : b[k] ? b[k].p : 0;
          return `<div class="slot ${cur === k ? 'on' : ''}" data-k="${k}"><div class="k"><span>${ICON[k]} ${L[k]}</span><span>${pr ? money(pr) : ''}</span></div><div class="sv">${one ? thumb(one, 'sm') : ''}<div class="v ${v ? '' : 'no'}">${v || 'Chưa chọn'}</div></div></div>`;
        }).join('');
        el.querySelectorAll('.slot').forEach((d) => (d.onclick = (e) => {
          if (e.target.dataset.img) return viewImg(part(e.target.dataset.img));
          if (e.target.dataset.rm != null) { sel.storage.splice(+e.target.dataset.rm, 1); return redraw(); }
          if (e.target.dataset.q) { sel.ram.qty = Math.max(1, Math.min(4, sel.ram.qty + +e.target.dataset.q)); return redraw(); }
          cur = d.dataset.k; shown = 60; q = ''; flt = {}; redraw(true);
        }));
      }
      function drawFilters() {
        el.querySelector('.flt').innerHTML = `<input type="search" placeholder="Tìm ${window.PCCHECK.LABEL[cur].toLowerCase()}…" value="${esc(q)}">
          <select data-s><option value="p">Giá thấp → cao</option><option value="-p">Giá cao → thấp</option><option value="n">Tên A → Z</option></select>
          ${filterHtml(cur, flt)}
          ${exam ? '' : `<label><input type="checkbox" data-ok ${onlyOk ? 'checked' : ''}> Chỉ hiện linh kiện hợp với máy</label>`}`;
        el.querySelectorAll('.flt select.f').forEach((se) => (se.onchange = () => { if (se.value === '') delete flt[se.dataset.f]; else flt[se.dataset.f] = se.value; shown = 60; drawItems(); }));
        const inp = el.querySelector('.flt input[type=search]');
        inp.oninput = () => { q = inp.value; shown = 60; drawItems(); };
        const so = el.querySelector('[data-s]'); so.value = sort; so.onchange = () => { sort = so.value; drawItems(); };
        const ck = el.querySelector('[data-ok]'); if (ck) ck.onchange = () => { onlyOk = ck.checked; shown = 60; drawItems(); };
      }
      function drawItems() {
        const words = q.toLowerCase().split(/\s+/).filter(Boolean);
        let arr = all.filter((x) => x.c === cur && words.every((w) => (x.name + ' ' + specLine(x)).toLowerCase().includes(w)) && passFilter(x, flt));
        const marks = new Map(); if (!exam) for (const x of arr) marks.set(x.id, candidate(x));
        if (onlyOk && !exam) arr = arr.filter((x) => marks.get(x.id));
        arr.sort((a, b) => (sort === 'n' ? a.name.localeCompare(b.name) : sort === '-p' ? b.p - a.p : a.p - b.p));
        const isSel = (x) => (cur === 'storage' ? sel.storage.includes(x.id) : cur === 'ram' ? sel.ram && sel.ram.id === x.id : sel[cur] === x.id);
        const box = el.querySelector('.items');
        box.innerHTML = (arr.length ? '' : '<p style="color:#8ea0a6">Không có linh kiện phù hợp. Thử bỏ dấu “Chỉ hiện linh kiện hợp với máy” hoặc đổi linh kiện khác.</p>') +
          arr.slice(0, shown).map((x) => `<div class="it ${isSel(x) ? 'sel' : ''} ${!exam && !marks.get(x.id) ? 'inc' : ''}">${thumb(x)}<div class="nm"><b title="${esc(x.name)}">${esc(x.name)}${!exam && !marks.get(x.id) ? '<span class="tag">không hợp</span>' : ''}</b><span>${esc(specLine(x))}</span></div><div class="pr">${money(x.p)}</div><button data-id="${x.id}">${isSel(x) ? (cur === 'storage' ? '+ Thêm' : '✓ Đã chọn') : 'Chọn'}</button></div>`).join('') +
          (arr.length > shown ? `<button class="more">Xem thêm (${arr.length - shown})</button>` : '');
        box.querySelectorAll('[data-img]').forEach((im) => (im.onclick = () => viewImg(part(im.dataset.img))));
        box.querySelectorAll('.it button[data-id]').forEach((bt) => (bt.onclick = () => {
          const id = bt.dataset.id;
          if (cur === 'storage') { if (sel.storage.length >= 4) return toast('Tối đa 4 ổ lưu trữ.', 'err'); sel.storage.push(id); }
          else if (cur === 'ram') sel.ram = { id, qty: sel.ram ? sel.ram.qty : 1 };
          else sel[cur] = id;
          pname = '';
          if (cur !== 'storage') { const nx = CAT_ORDER.find((k) => (k === 'storage' ? !sel.storage.length : !sel[k])); if (nx) { cur = nx; q = ''; shown = 60; flt = {}; return redraw(true); } }
          redraw();
        }));
        const mo = box.querySelector('.more'); if (mo) mo.onclick = () => { shown += 60; drawItems(); };
      }
      function drawSide() {
        const b = resolve(sel), r = window.PCCHECK.check(b);
        const over = exam && r.price > S.exam.budget;
        let h = '';
        if (exam) h += `<div class="brief"><b>📋 ${esc(brief.title)}</b><br>${esc(brief.text)}<br>Ngân sách tối đa: <b>${money(S.exam.budget)}</b></div>`;
        h += `<h4>Tổng</h4><div class="tot"><div class="${over ? 'over' : ''}"><b>${money(r.price)}</b><span>Giá tham khảo</span></div><div><b>${r.watts} W</b><span>Công suất ước tính</span></div></div>`;
        if (!exam) {
          const m = window.PCCHECK.toAnatomy(b).full, M = window.PCCHECK.MODEL3D;
          h += `<h4>Hình 3D sẽ hiển thị</h4><ul class="chk">${[['cpu', 'cpu'], ['board', 'motherboard'], ['ram', 'ram'], ['cooler', 'cooler'], ['gpu', 'gpu'], ['storage', 'storage'], ['psu', 'psu']].filter(([, k]) => (k === 'storage' ? b.storage.length : b[k])).map(([k]) => `<li>${M[k][m[k]]}</li>`).join('')}</ul><p style="font-size:12px;color:#8ea0a6;margin:4px 0 0">Thư viện 3D chỉ có vài mẫu đại diện cho mỗi loại, nên nhiều linh kiện khác nhau dùng chung một hình. Vỏ máy 3D luôn là một mẫu. Hình thay đổi sau khi bấm “Lắp ráp cấu hình này”.</p>`;
          h += `<h4>Kiểm tra tương thích</h4><ul class="chk">${r.missing.length ? `<li>Còn thiếu: ${r.missing.map((k) => window.PCCHECK.LABEL[k]).join(', ')}</li>` : ''}${r.errors.map((t) => `<li class="e">✗ ${esc(t)}</li>`).join('')}${r.warnings.map((t) => `<li class="w">⚠ ${esc(t)}</li>`).join('')}${r.ok.map((t) => `<li class="o">✓ ${esc(t)}</li>`).join('')}</ul>`;
          h += `<h4>Cấu hình mẫu</h4>${window.PCCAT.presets.map((p) => `<button class="preset" data-p="${p.id}">${esc(p.name)} – ${money(p.price)}<span>${esc(p.desc)}</span></button>`).join('')}`;
          h += `<div class="act"><button class="go" data-go>🔧 Lắp ráp cấu hình này</button><button data-clear>Xoá hết, chọn lại</button></div>`;
          const sv = savedList();
          h += `<h4>Cấu hình đã lưu</h4><div class="saverow"><input data-sn placeholder="Đặt tên cấu hình…" value="${esc(pname)}" maxlength="60"><button data-save>💾 Lưu</button></div>
            <ul class="saved">${sv.length ? sv.map((x) => `<li><span>${esc(x.name)}<small>${money(x.price)} · ${new Date(x.at).toLocaleDateString('vi-VN')}</small></span><button data-open="${x.id}">Mở</button><button data-del="${x.id}">✕</button></li>`).join('') : '<li style="color:#8ea0a6">Chưa lưu cấu hình nào.</li>'}</ul>`;
        } else h += `<div class="act"><button class="pri" data-go>✅ Chốt cấu hình và lắp ráp</button></div><p style="font-size:12px;color:#8ea0a6">Sau khi chốt sẽ không đổi được linh kiện nữa.</p>`;
        el.querySelector('.side').innerHTML = h;
        el.querySelectorAll('[data-p]').forEach((bt) => (bt.onclick = () => { const p = window.PCCAT.presets.find((x) => x.id === bt.dataset.p); Object.assign(sel, JSON.parse(JSON.stringify(p.build))); pname = p.name; redraw(); toast('Đã nạp cấu hình mẫu: ' + p.name, 'ok'); }));
        const svb = el.querySelector('[data-save]');
        if (svb) svb.onclick = () => {
          const nm = el.querySelector('[data-sn]').value.trim();
          if (!nm) return toast('Hãy đặt tên cho cấu hình.', 'err');
          if (!CAT_ORDER.some((k) => (k === 'storage' ? sel.storage.length : sel[k]))) return toast('Chưa chọn linh kiện nào.', 'err');
          const list = savedList(), old = list.find((x) => x.name.toLowerCase() === nm.toLowerCase());
          if (old && !confirm(`Đã có cấu hình “${old.name}”. Ghi đè?`)) return;
          const rec = { id: old ? old.id : 'c' + Date.now().toString(36), name: nm, sel: JSON.parse(JSON.stringify(sel)), price: r.price, at: Date.now() };
          writeSaved([rec, ...list.filter((x) => x !== old)].slice(0, 30)); pname = nm; drawSide(); toast('Đã lưu cấu hình “' + nm + '”.', 'ok');
        };
        el.querySelectorAll('[data-open]').forEach((bt) => (bt.onclick = () => { const x = savedList().find((y) => y.id === bt.dataset.open); if (!x) return; Object.assign(sel, emptySel(), JSON.parse(JSON.stringify(x.sel))); pname = x.name; redraw(); toast('Đã mở cấu hình “' + x.name + '”.', 'ok'); }));
        el.querySelectorAll('[data-del]').forEach((bt) => (bt.onclick = () => { const x = savedList().find((y) => y.id === bt.dataset.del); if (x && confirm(`Xoá cấu hình “${x.name}”?`)) { writeSaved(savedList().filter((y) => y.id !== x.id)); drawSide(); } }));
        const cl = el.querySelector('[data-clear]'); if (cl) cl.onclick = () => { Object.assign(sel, emptySel()); pname = ''; cur = 'cpu'; redraw(true); };
        el.querySelector('[data-go]').onclick = () => {
          if (r.missing.length && !exam) return toast('Còn thiếu: ' + r.missing.map((k) => window.PCCHECK.LABEL[k]).join(', '), 'err');
          if (r.errors.length && !exam) return toast('Cấu hình còn ' + r.errors.length + ' lỗi không tương thích – sửa trước khi lắp nhé.', 'err');
          if (exam && !confirm(r.missing.length ? `Còn thiếu ${r.missing.length} nhóm linh kiện. Vẫn chốt?` : 'Chốt cấu hình này?')) return;
          go(sel, pname, b, exam);
        };
      }
      function redraw(full) { drawSlots(); if (full) drawFilters(); drawItems(); drawSide(); }
      redraw(true);
    });
  }
  // ----- bộ lọc nâng cao -----
  const FILTERS = {
    cpu: [['brand', 'Hãng'], ['socket', 'Socket'], ['cores', 'Số nhân']],
    motherboard: [['brand', 'Hãng'], ['socket', 'Socket'], ['ram', 'Loại RAM'], ['ff', 'Kích cỡ']],
    ram: [['brand', 'Hãng'], ['ram', 'Loại'], ['gb', 'Dung lượng']],
    cooler: [['style', 'Kiểu'], ['sockets', 'Socket']],
    gpu: [['brand', 'Hãng'], ['vram', 'Bộ nhớ']],
    storage: [['kind', 'Loại'], ['gb', 'Dung lượng']],
    psu: [['brand', 'Hãng'], ['watts', 'Công suất']],
    case: [['brand', 'Hãng'], ['ff', 'Kích cỡ']],
  };
  const PRICE = [[0, 1e6, 'Dưới 1 triệu'], [1e6, 3e6, '1 – 3 triệu'], [3e6, 6e6, '3 – 6 triệu'], [6e6, 12e6, '6 – 12 triệu'], [12e6, 25e6, '12 – 25 triệu'], [25e6, 1e12, 'Trên 25 triệu']];
  const fval = (k, v) => (k === 'ff' ? window.PCCHECK.FFNAME[v] : k === 'style' ? (v === 'Liquid' ? 'Tản nước' : 'Tản khí') : k === 'gb' ? gbTxt(+v) : k === 'vram' ? v + ' GB' : k === 'watts' ? v + ' W' : k === 'cores' ? v + ' nhân' : v);
  function filterHtml(cat, flt) {
    const items = window.PCCAT.parts.filter((x) => x.c === cat);
    let h = (FILTERS[cat] || []).map(([k, lb]) => {
      const vals = [...new Set(items.flatMap((x) => (Array.isArray(x[k]) ? x[k] : [x[k]])).filter((v) => v !== '' && v != null))];
      if (vals.length < 2) return '';
      vals.sort((a, b) => (typeof a === 'number' ? a - b : String(a).localeCompare(String(b))));
      return `<select class="f" data-f="${k}"><option value="">${lb}: tất cả</option>${vals.map((v) => `<option value="${esc(v)}" ${String(flt[k]) === String(v) ? 'selected' : ''}>${esc(fval(k, v))}</option>`).join('')}</select>`;
    }).join('');
    h += `<select class="f" data-f="price"><option value="">Giá: tất cả</option>${PRICE.map((p, i) => `<option value="${i}" ${flt.price === String(i) ? 'selected' : ''}>${p[2]}</option>`).join('')}</select>`;
    return h;
  }
  function passFilter(x, flt) {
    for (const [k, v] of Object.entries(flt)) {
      if (k === 'price') { const [a, b] = PRICE[+v]; if (x.p < a || x.p >= b) return false; continue; }
      const xv = x[k];
      if (Array.isArray(xv) ? !xv.map(String).includes(v) : String(xv) !== v) return false;
    }
    return true;
  }
  // ----- cấu hình đã lưu (trên máy này) -----
  const savedList = () => { try { return JSON.parse(localStorage.getItem('thl.asm.saved') || '[]'); } catch { return []; } };
  const writeSaved = (l) => { try { localStorage.setItem('thl.asm.saved', JSON.stringify(l)); } catch { toast('Không lưu được trên máy này.', 'err'); } };
  // ----- ảnh sản phẩm (tải từ trang của nhà phân phối khi có mạng) -----
  const SRC = (u) => { try { return new URL(u).hostname; } catch { return ''; } };
  function thumb(x, cls = '') {
    if (!x.img) return `<div class="th ${cls} none">${ICON[x.c] || ''}</div>`;
    return `<div class="th ${cls}"><img src="${esc(x.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-img="${x.id}" title="Bấm để xem ảnh lớn" onerror="this.parentNode.classList.add('none');this.parentNode.textContent='${ICON[x.c] || ''}'"></div>`;
  }
  function viewImg(x) {
    if (!x) return;
    const bg = document.createElement('div'); bg.className = 'asmInsp';
    bg.innerHTML = `<div class="card"><header><h3>${esc(x.name)}</h3><span class="pr">${money(x.p)}</span><button data-x>✕ Đóng</button></header><div class="sp">${esc(window.PCCHECK.LABEL[x.c])} · ${esc(specLine(x))}</div>
      <div class="pic">${x.img ? `<img src="${esc(x.img)}" alt="${esc(x.name)}" referrerpolicy="no-referrer"><p class="st">Đang tải ảnh…</p>` : '<p class="st">Linh kiện này chưa có ảnh.</p>'}</div>
      <div class="cr">${x.img ? `Ảnh sản phẩm từ trang của nhà phân phối (${esc(SRC(x.img))}), chỉ hiện khi máy có mạng. Ảnh có thể là ảnh chung cho cả dòng sản phẩm hoặc ảnh hộp.` : ''}</div></div>`;
    document.body.appendChild(bg);
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    bg.querySelector('[data-x]').onclick = close; bg.onclick = (e) => { if (e.target === bg) close(); };
    const im = bg.querySelector('.pic img');
    if (im) { im.onload = () => bg.querySelector('.st')?.remove(); im.onerror = () => { im.remove(); bg.querySelector('.st').textContent = 'Không tải được ảnh – máy chưa có mạng hoặc trang nguồn đã gỡ ảnh.'; }; }
  }
  // ----- vỏ máy trong phòng lắp: đổi màu và mặt trước theo vỏ đã chọn -----
  function caseLook(x) {
    // Đoán màu và mặt trước từ tên vỏ (cách đoán phỏng theo pc-builder-emulator)
    const n = x.name;
    const color = /\b(WHITE|WH|SNOW|ICE)\b/i.test(n) ? 'white' : /\b(SILVER|AERO|CREATOR)\b/i.test(n) ? 'silver' : 'black';
    const front = /glass|view|showcase|panoram/i.test(n) ? 'glass' : /wood/i.test(n) ? 'slats' : /air|mesh|flow/i.test(n) ? 'mesh' : 'panel';
    return { color, front, rgb: /RGB|ARGB|LIGHT/i.test(n) };
  }
  const LOOKNAME = { white: 'màu trắng', silver: 'màu bạc', black: 'màu đen', glass: 'mặt trước kính', mesh: 'mặt trước lưới thoáng khí', slats: 'mặt trước nan gỗ', panel: 'mặt trước kín' };
  function applyCase() {
    const T = globalThis.__THREE, asm = window.__asm;
    if (!CFG || !CFG.b || !CFG.b.case || !T || !asm || !asm.pieces.length) return;
    const lk = caseLook(CFG.b.case); if (!lk) return;
    CFG.look = lk;
    const BODY = ['chassis', 'toppanel', 'psushroud', 'drivecage', 'frontio', 'dustfilter'];
    const tone = { white: new T.Color('#e4e7ea'), silver: new T.Color('#a3acb4') }[lk.color];
    const hsl = {};
    const done = new Set();
    const edit = (o, fn) => o.traverse((m) => { if (!m.isMesh || done.has(m)) return; done.add(m); const mats = Array.isArray(m.material) ? m.material : [m.material]; const nm = mats.map((mt) => { const c = mt.clone(); fn(c); return c; }); m.material = Array.isArray(m.material) ? nm : nm[0]; });
    for (const pc of asm.pieces) {
      if (tone && BODY.includes(pc.concept)) edit(pc.object, (mt) => { if (!mt.color || mt.transparent) return; mt.color.getHSL(hsl); if (hsl.l < 0.45) mt.color.copy(tone).offsetHSL(0, 0, (hsl.l - 0.2) * 0.4); });
      if (pc.concept === 'frontpanel') edit(pc.object, (mt) => {
        if (!mt.color) return;
        if (lk.front === 'glass') { mt.transparent = true; mt.opacity = 0.22; mt.color.set('#a7cbd9'); mt.depthWrite = false; mt.alphaMap = null; mt.map = null; }
        else if (lk.front === 'slats') { mt.color.set('#8b6b45'); mt.map = null; }
        else if (lk.front === 'panel') { mt.alphaMap = null; mt.alphaTest = 0; mt.transparent = false; mt.opacity = 1; mt.map = null; if (tone) mt.color.copy(tone); else mt.color.set('#1d2228'); }
        else if (tone) { mt.color.getHSL(hsl); if (hsl.l < 0.45) mt.color.copy(tone).offsetHSL(0, 0, -0.1); }
        mt.needsUpdate = true;
      });
      if (pc.batch && (BODY.includes(pc.concept) || pc.concept === 'frontpanel') && tone && pc.batch.setColorAt && pc.index != null) { pc.batch.setColorAt(pc.index, tone); if (pc.batch.instanceColor) pc.batch.instanceColor.needsUpdate = true; }
    }
    asm.wake(); render();
  }
  function go(sel, pname, b, exam) {
    try { sessionStorage.setItem('thl.asm.cfg', JSON.stringify(sel)); sessionStorage.setItem('thl.asm.cfgname', pname || ''); } catch {}
    const qs = new URLSearchParams({ scale: 'pc', asm: 'practice', cfg: '1', ...window.PCCHECK.toAnatomy(b) });
    location.search = '?' + qs.toString();
  }

  // ---------- khởi động ----------
  function boot0() {
    const want = params.get('asm');
    if (!want) return; // chỉ bật khi mở từ TinHocLab với ?asm=...
    const asm = window.__asm;
    if (!asm || !asm.pieces.some((p) => p.concept === 'motherboard')) { setTimeout(boot0, 300); return; }
    buildPanel();
    try { sessionStorage.removeItem('thl.asm.exam'); } catch {}
    if (params.get('cfg')) {
      loadCat().then(() => {
        let sel = null; try { sel = JSON.parse(sessionStorage.getItem('thl.asm.cfg') || 'null'); } catch {}
        if (sel) CFG = { sel, b: resolve(sel), name: sessionStorage.getItem('thl.asm.cfgname') || '' };
        relabel();
        const tryCase = (n) => { if (globalThis.__THREE && window.__asm.pieces.length) applyCase(); else if (n > 0) setTimeout(() => tryCase(n - 1), 400); };
        tryCase(20);
        setMode(want === 'practice' ? 'practice' : want === 'teardown' ? 'teardown' : 'explore');
      });
      return;
    }
    setMode(want === 'practice' ? 'practice' : want === 'teardown' ? 'teardown' : 'explore'); // mặc định mở Khám phá trước
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot0, 500)); else setTimeout(boot0, 500);
})();
