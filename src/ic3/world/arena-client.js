// Đảo IC3 – Đấu trường phía học sinh: nhập mã, sảnh chờ (thấy nhân vật các bạn), trả lời câu hỏi, xếp hạng, bục vinh quang
import { renderQ, qText, isAnswered, answerText, TYPE_LABEL, setToast } from '../qrender.js';

const $ = (s, r = document) => r.querySelector(s);
const SKEY = 'thl.ic3.arena';

export function createArena(C) {
  const { THREE, esc } = C;
  setToast(C.toast);
  let S = null;            // trạng thái mới nhất từ máy giáo viên
  let sess = null;         // { code, pid }
  let active = false, pollT = 0, polling = false, netFail = 0;
  let qKey = '', qSt = null, sending = false, endShown = false, xpGiven = false, lastPhase = '';
  let tLocal = { start: 0, dead: 0 };
  const others = new Map(); // pid -> { av, look }
  const ui = $('#arenaUI');

  // ---------- nhập mã ----------
  function openJoin() {
    if (!C.api) { C.modal('<div class="big">⚔️</div><h2>Đấu trường</h2><p class="muted">Đấu trường cần chạy trong ứng dụng TinHocLab, nối mạng LAN với máy giáo viên hoặc có kết nối Internet.</p><button class="btn" data-x>Đóng</button>'); return; }
    const box = C.modal(`<div class="big">⚔️</div><h2>Vào Đấu trường</h2><p class="muted" style="margin:0">Nhập <b>mã phòng 6 số</b> thầy cô đưa cho em.</p>
      <div class="codein">${Array.from({ length: 6 }, (_, i) => `<input maxlength="1" inputmode="numeric" data-i="${i}">`).join('')}</div>
      <div class="err" id="arErr"></div><div class="muted" id="arNet" style="font-size:13px;margin-bottom:12px"></div>
      <div style="display:flex;gap:10px;justify-content:center"><button class="btn ghost" data-x>Để sau</button><button class="btn red" id="arGo">Vào phòng ›</button></div>`);
    const ins = [...box.querySelectorAll('.codein input')];
    ins.forEach((inp, i) => {
      inp.oninput = () => { inp.value = inp.value.replace(/\D/g, '').slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); if (ins.every((x) => x.value)) $('#arGo').focus(); };
      inp.onkeydown = (e) => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); if (e.key === 'Enter') $('#arGo').click(); };
      inp.onpaste = (e) => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (t.length) { e.preventDefault(); t.split('').forEach((c, k) => (ins[k].value = c)); ins[Math.min(5, t.length)].focus(); } };
    });
    setTimeout(() => ins[0].focus(), 50);
    Promise.all([C.api.status(), C.api.cloudInfo ? C.api.cloudInfo() : { on: false }]).then(([s, c]) => {
      const n = $('#arNet'); if (!n) return;
      const lan = s.connected ? `🟢 Đã nối máy giáo viên${s.teacher && s.teacher.room ? ' – ' + esc(s.teacher.room) : ''}` : c.on ? '' : '🟠 Chưa thấy máy giáo viên trong mạng LAN – hãy báo thầy cô bật máy chủ.';
      n.innerHTML = [lan, c.on ? '🌐 Có thể vào phòng qua Internet' : ''].filter(Boolean).join('<br>') + `<br><a href="#" id="arCloudSet" style="color:#0a66c2">${c.on ? '⚙️ Đổi kết nối Internet' : '🌐 Cài kết nối Internet (thi ở nhà)'}</a>`;
      $('#arCloudSet').onclick = (e) => { e.preventDefault(); cloudSetup(); };
    });
    $('#arGo').onclick = async () => {
      const code = ins.map((x) => x.value).join('');
      if (code.length !== 6) { $('#arErr').textContent = 'Mã phòng gồm 6 chữ số.'; return; }
      $('#arGo').disabled = true; $('#arErr').textContent = '';
      const r = await C.api.arenaJoin({ code, name: C.me.name, class: C.me.class, look: C.look });
      $('#arGo') && ($('#arGo').disabled = false);
      if (!r.ok) { $('#arErr').textContent = r.msg || 'Không vào được phòng.'; C.tone([220, 165], 0.15, 'square', 0.1, 0.06); return; }
      $('#ovModal').hidden = true;
      sess = { code: r.code, pid: r.pid }; sessionStorage.setItem(SKEY, JSON.stringify(sess));
      enter(); C.tone([523, 659, 784, 1046], 0.1, 'triangle', 0.07);
    };
  }
  function cloudSetup() {
    const box = C.modal(`<div class="big">🌐</div><h2>Kết nối Internet</h2><p class="muted" style="margin:0 0 12px">Dán <b>mã kết nối</b> thầy cô gửi (bắt đầu bằng <code>THL1.</code>). Mỗi máy chỉ cần làm một lần.</p>
      <textarea id="arCloudIn" rows="3" style="width:100%;box-sizing:border-box;border:2px solid #d2d2d7;border-radius:12px;padding:10px;font:13px ui-monospace,Menlo,monospace" placeholder="THL1.…"></textarea>
      <div class="err" id="arCloudErr"></div>
      <div style="display:flex;gap:10px;justify-content:center"><button class="btn ghost" id="arCloudBack">‹ Quay lại</button><button class="btn red" id="arCloudOk">Lưu</button></div>`);
    setTimeout(() => box.querySelector('#arCloudIn').focus(), 50);
    $('#arCloudBack').onclick = () => openJoin();
    $('#arCloudOk').onclick = async () => {
      const b = $('#arCloudOk'); b.disabled = true; b.textContent = 'Đang kiểm tra…';
      const r = await C.api.cloudSet($('#arCloudIn').value);
      if (!$('#arCloudOk')) return; b.disabled = false; b.textContent = 'Lưu';
      if (!r.ok) { $('#arCloudErr').textContent = r.msg; return; }
      C.tone([523, 784], 0.1, 'triangle', 0.07); openJoin();
    };
  }
  function resume() {
    try { sess = JSON.parse(sessionStorage.getItem(SKEY)); } catch { sess = null; }
    if (sess && C.api) C.api.arenaState(sess.code, sess.pid).then((s) => { if (s.ok) { enter(); apply(s); } else { sess = null; sessionStorage.removeItem(SKEY); } });
  }

  // ---------- vào / ra đấu trường ----------
  function enter() {
    active = true; endShown = false; xpGiven = false; qKey = ''; lastPhase = '';
    const A = C.W.arena; const g = A.gateA;
    C.P.pos.set(A.x + Math.cos(g) * 6, 0, A.z + Math.sin(g) * 6); C.P.face = Math.atan2(-Math.cos(g), -Math.sin(g)); C.P.target = null;
    C.P.bounds = { x: A.x, z: A.z, r: A.R - 0.6 };
    C.cam.dist = 30; C.cam.pitch = 0.95; C.cam.focus = new THREE.Vector3(A.x, 0, A.z);
    C.showHUD(false);
    ui.hidden = false; ui.innerHTML = '<div class="ar-bar" id="arBar"></div><div id="arMain"></div>';
    poll();
  }
  function leave(msg) {
    active = false; S = null; sess = null; sessionStorage.removeItem(SKEY);
    for (const o of others.values()) { C.scene.remove(o.av); C.disposeAvatar(o.av); } others.clear();
    const A = C.W.arena, g = A.gateA;
    C.P.bounds = null; C.P.lock = false; C.P.baseY = 0; C.P.pos.set(A.x + Math.cos(g) * (A.R + 4.5), 0, A.z + Math.sin(g) * (A.R + 4.5)); C.P.face = Math.atan2(Math.cos(g), Math.sin(g));
    C.cam.focus = null; C.cam.dist = 26; C.cam.pitch = 0.82;
    if (C.player) C.player.userData.pose = 'idle';
    ui.hidden = true; ui.innerHTML = ''; C.showHUD(true);
    if (msg) C.toast(msg, 3500);
  }
  async function poll() {
    if (!active || polling || !sess) return; polling = true;
    const s = await C.api.arenaState(sess.code, sess.pid); polling = false;
    if (!active) return;
    if (!s.ok) {
      if (s.net) { netFail++; if (netFail > 25) leave('Mất kết nối với phòng thi đấu.'); else bar(true); return; }
      leave(s.kicked ? 'Em đã được mời ra khỏi phòng.' : 'Thầy cô đã đóng phòng thi đấu.'); return;
    }
    netFail = 0; apply(s);
  }
  function apply(s) {
    S = s; const now = performance.now();
    tLocal = { start: now + s.startIn, dead: now + s.timeLeft };
    syncOthers(); bar(); render();
  }

  // ---------- nhân vật các bạn ----------
  function syncOthers() {
    const A = C.W.arena; const list = S.players || null;
    if (S.phase === 'lobby' && list) {
      const ids = new Set(list.filter((p) => !p.me).map((p) => p.pid));
      for (const [pid, o] of others) if (!ids.has(pid)) { C.scene.remove(o.av); C.disposeAvatar(o.av); others.delete(pid); }
      list.filter((p) => !p.me).forEach((p, i) => {
        let o = others.get(p.pid);
        const lk = JSON.stringify(p.look || {});
        if (o && o.lk !== lk) { C.scene.remove(o.av); C.disposeAvatar(o.av); o = null; }
        if (!o) { const av = C.makeAvatar(p.look); av.userData.pose = Math.random() < 0.4 ? 'wave' : 'idle'; C.scene.add(av); o = { av, lk, name: p.name }; others.set(p.pid, o); }
        const spot = C.W.arenaSpots[(i + 3) % C.W.arenaSpots.length];
        o.av.position.copy(spot); o.av.rotation.y = Math.atan2(A.x - spot.x, A.z - spot.z);
        C.tagFor(o.av, `${esc(p.name)}<small>${esc(p.class)}</small>`);
      });
    }
    if (S.phase === 'end' && S.players && !endShown) podium();
  }
  function podium() {
    endShown = true;
    const top = S.players.slice(0, 3), topIds = new Set(top.map((p) => p.pid));
    // các bạn còn lại đứng thành hai hàng hai bên bục, nhìn về phía bục
    const A = C.W.arena, g = A.gateA, pd0 = C.W.podium[0];
    const fwd = new THREE.Vector3(Math.cos(g), 0, Math.sin(g)), side = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const rest = S.players.filter((p) => !topIds.has(p.pid));
    rest.forEach((p, k) => {
      const s2 = k % 2 ? 1 : -1, row = Math.floor(k / 2), col = row % 3, ln = Math.floor(row / 3);
      const pos = new THREE.Vector3(pd0.x, 0, pd0.z).addScaledVector(side, s2 * (4.6 + col * 1.5)).addScaledVector(fwd, 1.2 + ln * 1.6);
      if (p.me) { C.P.pos.set(pos.x, 0, pos.z); C.P.lock = true; C.P.face = Math.atan2(pd0.x - pos.x, pd0.z - pos.z); C.player.userData.pose = 'wave'; return; }
      const o = others.get(p.pid); if (!o) return;
      o.av.position.copy(pos); o.av.rotation.y = Math.atan2(pd0.x - pos.x, pd0.z - pos.z); o.av.userData.pose = 'wave';
    });
    top.forEach((p, i) => {
      const pos = C.W.podium[i];
      if (p.me) { C.P.pos.set(pos.x, 0, pos.z); C.P.baseY = pos.y; C.P.lock = true; C.P.face = Math.atan2(Math.cos(C.W.arena.gateA), Math.sin(C.W.arena.gateA)); C.player.userData.pose = 'cheer'; }
      else { let o = others.get(p.pid); if (!o) { const av = C.makeAvatar(p.look); C.scene.add(av); o = { av, lk: JSON.stringify(p.look || {}) }; others.set(p.pid, o); } o.av.position.set(pos.x, pos.y, pos.z); o.av.rotation.y = Math.atan2(Math.cos(C.W.arena.gateA), Math.sin(C.W.arena.gateA)); o.av.userData.pose = 'cheer'; C.tagFor(o.av, `${['🥇', '🥈', '🥉'][i]} ${esc(p.name)}<small>${p.score} điểm</small>`); }
    });
    const pd = C.W.podium[0]; C.cam.focus = new THREE.Vector3(pd.x, 0, pd.z); C.cam.dist = 17; C.cam.pitch = 0.45;
    // tính góc nhìn thẳng vào bục từ phía cổng
    C.cam.yaw = Math.atan2(Math.cos(g), Math.sin(g));
    confetti();
  }

  // ---------- giao diện ----------
  function bar(lost) {
    const b = $('#arBar'); if (!b || !S) return;
    b.innerHTML = `<div><small>MÃ PHÒNG</small><span class="code">${S.code}</span></div><div><b>${esc(S.title)}</b><small>${S.n} người chơi${S.phase !== 'lobby' ? ` · Câu ${Math.max(1, S.qi + 1)}/${S.total}` : ''}</small></div>
      ${S.phase !== 'lobby' ? `<div><small>ĐIỂM CỦA EM</small><b style="font-size:20px">${S.me.score}</b> <small>hạng ${S.me.rank}/${S.n}${S.me.streak >= 2 ? ` · 🔥 ${S.me.streak}` : ''}</small></div>` : ''}
      ${lost ? '<span style="color:#ffb3ad">⚠ đang kết nối lại…</span>' : ''}<button class="btn sm" id="arLeave">Rời phòng</button>`;
    $('#arLeave').onclick = () => { if (S.phase === 'end' || S.phase === 'lobby' || confirm('Rời phòng giữa trận? Em vẫn có thể vào lại bằng mã cũ.')) leave(); };
  }
  function render() {
    const M = $('#arMain'); if (!M) return;
    const ph = S.phase, now = performance.now();
    C.P.lock = ph === 'question' || ph === 'reveal' || ph === 'end';
    if (ph === 'lobby') {
      if (lastPhase !== 'lobby') { M.innerHTML = '<div class="ar-wait"><span style="font-size:26px">⏳</span><span id="arWaitTx"></span><span class="dots"><i></i><i></i><i></i></span></div>'; if (C.player) C.player.userData.pose = 'idle'; C.P.baseY = 0; }
      $('#arWaitTx').textContent = `Đã có ${S.n} bạn trong sảnh. Chờ thầy cô bắt đầu… (em có thể đi dạo trong đấu trường)`;
    }
    if (ph === 'question') {
      const key = 'q' + S.qi;
      if (now < tLocal.start) { if (lastPhase !== 'count' + S.qi) { lastPhase = 'count' + S.qi; M.innerHTML = `<div class="ar-count"><div><span>Câu ${S.qi + 1}/${S.total} · ${TYPE_LABEL[S.qType] || ''}</span><b id="arCnt">3</b><span>Chuẩn bị…</span></div></div>`; C.tone([660], 0.08, 'square', 0, 0.06); } return;
      }
      if (S.me.answered && qKey === key && qSt && qSt.sent) { /* giữ màn hình "đã gửi" */ }
      else if (qKey !== key && S.q) {
        qKey = key; qSt = {}; const q = { ...S.q }; if (q.media || q.img) q._base = S.base;
        const kahoot = q.t === 'one' && q.o.length <= 4;
        M.innerHTML = `<div class="ar-q ${kahoot ? 'kahoot' : ''}"><div class="top"><span class="pill">Câu ${S.qi + 1}/${S.total}</span><span class="pill">${TYPE_LABEL[q.t]}</span><span class="clock" id="arClock">${S.time}</span></div>
          <div class="tbar"><i id="arT" style="width:100%"></i></div><div class="qt">${qText(q)}</div><div id="arQ"></div>
          <div class="send" id="arSend">${kahoot ? '<span class="muted">Bấm vào một đáp án để chốt</span>' : '<button class="btn red" id="arOk" disabled>Chốt đáp án ✓</button>'}</div></div>`;
        const box = renderQ(q, qSt, () => { if (kahoot) send(); else $('#arOk').disabled = !isAnswered(q, qSt); });
        box.querySelector('.qtype') && box.querySelector('.qtype').remove();
        $('#arQ').appendChild(box);
        if (!kahoot) $('#arOk').onclick = send;
        if (S.me.answered) sentView();
      }
    }
    if (ph === 'reveal' && lastPhase !== 'reveal' + S.qi) {
      lastPhase = 'reveal' + S.qi; qKey = '';
      const L = S.me.last || { ok: false, pts: 0, none: true };
      if (C.player) C.player.userData.pose = L.ok ? 'cheer' : 'sad';
      L.ok ? C.tone([523, 659, 784, 1046], 0.1, 'triangle', 0.08) : C.tone([300, 220], 0.2, 'sawtooth', 0.14, 0.05);
      M.innerHTML = `<div class="ar-res ${L.ok ? 'ok' : 'no'}"><div class="big">${L.ok ? '🎉 Chính xác!' : L.none ? '⏰ Hết giờ!' : '😢 Chưa đúng'}</div>
        <div class="pts">${L.ok ? '+' + L.pts : '+0'}</div>${S.me.streak >= 3 ? `<div>🔥 Chuỗi ${S.me.streak} câu đúng – thưởng thêm!</div>` : ''}
        <div class="ans">Đáp án: ${esc(answerText(S.q))}</div>
        <div class="muted">Em đang hạng <b>${S.me.rank}</b>/${S.n} với <b>${S.me.score}</b> điểm${S.dist ? ` · ${S.dist.right}/${S.dist.n} bạn trả lời đúng` : ''}</div>
        <ol>${(S.top || []).map((p) => `<li class="${p.me ? 'me' : ''}"><span class="rk">${['🥇', '🥈', '🥉'][p.rank - 1] || p.rank}</span>${C.portrait(p.look, 28)}<span>${esc(p.name)}</span><b>${p.score}</b></li>`).join('')}</ol>
        <p class="muted" style="margin:10px 0 0;font-size:13px">Chờ thầy cô chuyển câu tiếp theo…</p></div>`;
    }
    if (ph === 'end' && lastPhase !== 'end') {
      lastPhase = 'end';
      if (!xpGiven) { xpGiven = true; const xp = Math.round(S.me.score / 50); C.addXP(xp); C.done(); }
      M.innerHTML = `<div class="ar-end"><h3>🏆 Kết thúc trận đấu!</h3><p style="margin:0 0 6px">Em xếp hạng <b>${S.me.rank}/${S.n}</b> · ${S.me.correct}/${S.qi + 1} câu đúng · <b>${S.me.score}</b> điểm<br><span class="muted">+${Math.round(S.me.score / 50)} XP cho nhân vật</span></p>
        <ol style="list-style:none;padding:0;margin:0">${S.players.slice(0, 20).map((p) => `<li style="display:flex;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid #f2f2f2;${p.me ? 'background:#fff8e1;border-radius:8px' : ''}"><b style="width:26px;text-align:center">${['🥇', '🥈', '🥉'][p.rank - 1] || p.rank}</b>${C.portrait(p.look, 26)}<span style="flex:1">${esc(p.name)}</span><b>${p.score}</b></li>`).join('')}</ol>
        <button class="btn red" id="arOut" style="width:100%;margin-top:12px">Rời đấu trường</button></div>`;
      $('#arOut').onclick = () => leave();
    }
    if (ph !== 'question' && !ph.startsWith('count')) { if (!lastPhase.startsWith('reveal') && !lastPhase.startsWith('end')) lastPhase = ph; }
  }
  async function send() {
    if (sending || !S || !qSt || qSt.sent) return;
    sending = true; qSt.locked = true;
    const r = await C.api.arenaAnswer({ code: sess.code, pid: sess.pid, qi: S.qi, ans: qSt.ans });
    sending = false;
    if (r.ok) { qSt.sent = true; sentView(); C.tone([880, 1175], 0.08, 'triangle', 0.06, 0.08); }
    else { qSt.locked = false; C.toast(r.msg || 'Chưa gửi được đáp án, thử lại nhé.'); }
  }
  function sentView() { const s = $('#arSend'); if (s) s.innerHTML = '<div class="sent" style="flex:1">✅ Đã chốt đáp án! Chờ các bạn khác…</div>'; document.querySelectorAll('#arQ button').forEach((b) => (b.disabled = true)); }
  function confetti() {
    const cs = ['#ff3b30', '#ffcc00', '#34c759', '#0a84ff', '#ff2d55', '#af52de'];
    for (let i = 0; i < 90; i++) { const d = document.createElement('div'); d.className = 'confetti'; d.style.left = Math.random() * 100 + 'vw'; d.style.background = cs[i % 6]; d.style.animationDuration = 2 + Math.random() * 2.5 + 's'; d.style.animationDelay = Math.random() * 0.8 + 's'; document.body.appendChild(d); setTimeout(() => d.remove(), 5500); }
    C.tone([523, 659, 784, 1046, 1318], 0.18, 'triangle', 0.1, 0.18);
  }

  // ---------- mỗi khung hình ----------
  function update(dt) {
    for (const o of others.values()) C.animate(o.av, dt);
    if (!active) return;
    pollT += dt;
    const fast = S && (S.phase === 'question' || S.phase === 'reveal');
    if (pollT > (fast ? 0.5 : 0.9)) { pollT = 0; poll(); }
    if (!S) return;
    const now = performance.now();
    if (S.phase === 'question') {
      if (now < tLocal.start) { const c = $('#arCnt'); const n = Math.ceil((tLocal.start - now) / 1000); if (c && c.textContent !== String(n)) { c.textContent = n; C.tone([n > 1 ? 660 : 990], 0.08, 'square', 0, 0.06); } }
      else {
        if (lastPhase.startsWith('count')) { lastPhase = 'q' + S.qi; render(); }
        const left = Math.max(0, tLocal.dead - now - 800), tot = S.time * 1000;
        const ck = $('#arClock'); if (ck) ck.textContent = Math.ceil(left / 1000);
        const tb = $('#arT'); if (tb) tb.style.width = Math.max(0, (left / tot) * 100) + '%';
      }
    }
  }
  return {
    openJoin, resume, update,
    active: () => active,
    blocking: () => active && S && (S.phase === 'question' || S.phase === 'reveal'),
    escape() {},
    lookChanged() { if (active && sess) C.api.arenaJoin({ code: sess.code, name: C.me.name, class: C.me.class, look: C.look }); },
  };
}
