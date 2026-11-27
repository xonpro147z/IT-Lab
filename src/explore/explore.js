// Phân hệ Khám phá phần cứng: tìm kiếm + xem mô hình 3D + thông tin + đố vui
import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';
import { HW, HW_CATS } from './hw-data.js';
import { MODELS, modelForPart } from './hw-models.js';
import { PARTS, CATEGORIES } from '../pcbuild/catalog.js';

const $ = (s) => document.querySelector(s);
const fmtVnd = (n) => n.toLocaleString('vi-VN') + 'đ';
const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[-_/().,]/g, ' ').replace(/\s+/g, ' ');

// ---------- Dữ liệu: phần cứng phổ thông + sản phẩm thật trong kho lắp ráp ----------
const CAT_ICON = Object.fromEntries(HW_CATS.map((c) => [c.id, c.icon]));
const PART_ICON = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.icon]));
const ITEMS = [
  ...HW,
  ...PARTS.filter((p) => p.cat !== 'cable').map((p) => {
    const cat = CATEGORIES.find((c) => c.id === p.cat);
    return { id: 'p-' + p.id, part: p, cat: 'product', name: p.name, en: cat.name, aka: [p.brand, p.maker, p.socket, p.type, p.chipset].filter(Boolean), desc: cat.info, specs: p.specs.map((s) => ['•', s]), price: p.price, icon: PART_ICON[p.cat] };
  }),
];
ITEMS.forEach((it) => { it.hay = norm([it.name, it.en, ...(it.aka || []), HW_CATS.find((c) => c.id === it.cat).name, it.desc].join(' ')); it.nameN = norm(it.name + ' ' + it.en + ' ' + (it.aka || []).join(' ')); });

// ---------- Cảnh 3D ----------
const canvas = $('#c3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(1, 2, 1.5); scene.add(sun);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 5000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.2;
let current = null, shadow = null, home = null, sway = 0, swayOn = true;
// bóng mờ dưới vật thể
const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();

function resize() { const r = canvas.parentElement.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);

function show3D(it) {
  if (current) { scene.remove(current); current.traverse((o) => o.geometry && o.geometry.dispose()); }
  if (shadow) scene.remove(shadow);
  let obj;
  try { obj = it.part ? modelForPart(it.part) : (MODELS[it.model] || (() => new THREE.Group()))(); } catch (e) { console.warn(e); obj = new THREE.Group(); }
  const wrap = new THREE.Group(); wrap.add(obj);
  const box = new THREE.Box3().setFromObject(wrap);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
  scene.add(wrap); current = wrap;
  const R = Math.max(size.x, size.y, size.z) || 1;
  shadow = new THREE.Mesh(new THREE.PlaneGeometry(R * 1.6, R * 1.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -size.y / 2 - R * 0.02; scene.add(shadow);
  const sphereR = size.length() / 2;
  const vf = (camera.fov * Math.PI) / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  const dist = (sphereR / Math.sin(Math.min(vf, hf) / 2)) * 1.12;
  // hiện vật dựng từ ảnh chụp thật: nhìn chính diện, chỉ lắc nhẹ nếu ảnh chụp xiên
  const ph = obj.userData.photo; sway = ph ? ph.sway : 0;
  controls.autoRotate = swayOn && !(ph && sway);
  controls.minAzimuthAngle = ph && sway ? -sway : -Infinity; controls.maxAzimuthAngle = ph && sway ? sway : Infinity;
  home = (ph ? new THREE.Vector3(0.1, 0.16, 1) : new THREE.Vector3(0.35, 0.38, 0.86)).normalize().multiplyScalar(ph ? dist * 0.92 : dist);
  camera.near = R / 100; camera.far = R * 100; camera.updateProjectionMatrix();
  controls.minDistance = R * 0.3; controls.maxDistance = dist * 3;
  camera.position.copy(home); controls.target.set(0, 0, 0); controls.update();
  $('#vcap').textContent = it.cat === 'port' && !['sata', 'molex', 'atx24', 'pcie8', '12vhpwr'].includes(it.id) ? '◀ Đầu cắm (phích) · Cổng trên thiết bị ▶' : '';
}
function loop() {
  // vật dựng từ ảnh chụp xiên: lắc qua lại thay vì xoay tròn
  if (sway && current) { controls.autoRotate = false; if (swayOn) current.rotation.y = Math.sin(performance.now() / 1400) * sway * 0.8; }
  else if (current) current.rotation.y = 0;
  controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop);
}
$('#btnRotate').onclick = () => { swayOn = !swayOn; controls.autoRotate = !controls.autoRotate; $('#btnRotate').textContent = 'Tự xoay: ' + (controls.autoRotate ? 'Bật' : 'Tắt'); };
$('#btnReset').onclick = () => { if (home) { camera.position.copy(home); controls.target.set(0, 0, 0); } };

// ---------- Danh sách & tìm kiếm ----------
let cat = 'all', query = '', sel = null, quiz = null;
function renderCats() {
  const counts = Object.fromEntries(HW_CATS.map((c) => [c.id, ITEMS.filter((i) => i.cat === c.id).length]));
  $('#cats').innerHTML = `<button data-c="all" class="${cat === 'all' ? 'on' : ''}">Tất cả (${ITEMS.length})</button>` + HW_CATS.map((c) => `<button data-c="${c.id}" class="${cat === c.id ? 'on' : ''}">${c.icon} ${c.name} (${counts[c.id]})</button>`).join('');
  $('#cats').querySelectorAll('button').forEach((b) => (b.onclick = () => { cat = b.dataset.c; renderCats(); renderList(); }));
}
function score(it, terms) {
  let s = 0;
  const phrase = terms.join(' ');
  if (terms.length > 1 && it.nameN.includes(phrase)) s += 12;
  for (const t of terms) { if (!it.hay.includes(t)) return -1; s += it.nameN.includes(t) ? 3 : 1; if (it.nameN.startsWith(t)) s += 2; }
  return s;
}
function hl(text) {
  if (!query.trim()) return escapeHtml(text);
  const terms = norm(query).split(/\s+/).filter(Boolean);
  const n = norm(text); const marks = new Array(text.length).fill(false);
  terms.forEach((t) => { let i = n.indexOf(t); while (i >= 0) { for (let k = i; k < i + t.length; k++) marks[k] = true; i = n.indexOf(t, i + 1); } });
  let out = ''; for (let i = 0; i < text.length; i++) { const ch = escapeHtml(text[i]); out += marks[i] && !marks[i - 1] ? '<mark>' + ch : ch; if (marks[i] && !marks[i + 1]) out += '</mark>'; }
  return out;
}
function results() {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  let list = ITEMS.filter((i) => cat === 'all' || i.cat === cat);
  if (terms.length) list = list.map((i) => [i, score(i, terms)]).filter(([, s]) => s >= 0).sort((a, b) => b[1] - a[1]).map(([i]) => i);
  return list;
}
function renderList() {
  const list = results();
  $('#count').textContent = query ? `${list.length} kết quả cho "${query}"` : `${list.length} mục`;
  if (!list.length) {
    const q = escapeHtml(query);
    $('#list').innerHTML = `<div class="empty">Chưa có "<b>${q}</b>" trong thư viện của phần mềm.<br>Bạn có thể tìm trên Internet:
      <button class="tb" data-w="img">🖼️ Xem hình ảnh "${q}" trên Google</button>
      <button class="tb" data-w="wiki">📖 Tra cứu "${q}" trên Wikipedia</button>
      <button class="tb" data-w="web">🌐 Tìm kiếm "${q}" trên Google</button></div>`;
    $('#list').querySelectorAll('[data-w]').forEach((b) => (b.onclick = () => openWeb(b.dataset.w, query)));
    return;
  }
  $('#list').innerHTML = list.map((i) => `<div class="item ${sel && sel.id === i.id ? 'on' : ''}" data-id="${i.id}"><div class="ic">${i.icon || CAT_ICON[i.cat]}</div><div><div class="nm">${hl(i.name)}</div><div class="sub">${hl(i.en)}${i.year ? ' · ' + i.year : ''}${i.price ? ' · ' + fmtVnd(i.price) : ''}</div></div></div>`).join('');
  $('#list').querySelectorAll('.item').forEach((el) => (el.onclick = () => select(ITEMS.find((i) => i.id === el.dataset.id))));
}
function openWeb(kind, q) {
  const e = encodeURIComponent(q);
  const url = kind === 'img' ? `https://www.google.com/search?tbm=isch&q=${e}` : kind === 'wiki' ? `https://vi.wikipedia.org/w/index.php?search=${e}` : `https://www.google.com/search?q=${e}`;
  window.open(url, '_blank');
}
function select(it) {
  if (quiz) endQuiz(true);
  sel = it; show3D(it); renderInfo(it);
  document.querySelectorAll('.item').forEach((el) => el.classList.toggle('on', el.dataset.id === it.id));
}
function renderInfo(it) {
  const c = HW_CATS.find((x) => x.id === it.cat);
  const q = it.part ? it.name : it.en;
  $('#info').innerHTML = `<div class="kicker">${c.name}</div><h2>${escapeHtml(it.name)}</h2><div class="en">${escapeHtml(it.en)}</div>
    ${it.year ? `<div class="yearbig">${it.year}</div><div class="yearcap">Năm ra đời</div>` : ''}
    ${it.price ? `<div class="price">${fmtVnd(it.price)}</div><div class="yearcap">Giá tham khảo</div>` : ''}
    <p class="leadp">${escapeHtml(it.desc)}</p>
    <h4>Thông số</h4><table>${it.specs.map(([k, v]) => k === '•' ? `<tr><td colspan="2">• ${escapeHtml(v)}</td></tr>` : `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>
    ${it.uses ? `<h4>Dùng để làm gì?</h4><p>${escapeHtml(it.uses)}</p>` : ''}
    ${it.fact ? `<div class="fact"><b>Bạn có biết?</b>${escapeHtml(it.fact)}</div>` : ''}
    ${it.part ? `<p style="font-size:12.5px;color:#8f99a6">Linh kiện này có trong phần <b>Lắp ráp máy tính 3D</b>.</p>` : ''}
    <div class="web"><button class="tb" data-w="img">Ảnh thật trên Internet ↗</button><button class="tb" data-w="wiki">Wikipedia ↗</button></div>`;
  $('#info').querySelectorAll('[data-w]').forEach((b) => (b.onclick = () => openWeb(b.dataset.w, q)));
}
const qInput = $('#q');
let qT;
qInput.addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(() => { query = qInput.value.trim(); renderList(); const r = results(); if (query && r.length && (!sel || !r.includes(sel))) select(r[0]); }, 120); });
qInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const r = results(); if (r.length) select(r[0]); else openWeb('img', query); } });
$('#qClear').onclick = () => { qInput.value = ''; query = ''; renderList(); qInput.focus(); };

// ---------- Đố vui ----------
const QUIZ_POOL = HW.filter((i) => ['port', 'storage', 'peripheral', 'component', 'mobile', 'network'].includes(i.cat));
function startQuiz() {
  const order = [...QUIZ_POOL].sort(() => Math.random() - 0.5).slice(0, 10);
  quiz = { order, i: 0, score: 0 }; controls.autoRotate = true;
  askQuiz();
}
function askQuiz() {
  const it = quiz.order[quiz.i];
  show3D(it); $('#vcap').textContent = 'Đây là phần cứng gì?';
  const same = QUIZ_POOL.filter((x) => x.cat === it.cat && x.id !== it.id).sort(() => Math.random() - 0.5);
  const others = QUIZ_POOL.filter((x) => x.id !== it.id && !same.includes(x)).sort(() => Math.random() - 0.5);
  const opts = [it, ...[...same, ...others].slice(0, 3)].sort(() => Math.random() - 0.5);
  $('#info').innerHTML = `<div class="quiz"><h3>Đây là gì?</h3><div class="score">Câu ${quiz.i + 1}/${quiz.order.length} · Điểm: ${quiz.score}</div><div class="bar"><span style="width:${(quiz.i / quiz.order.length) * 100}%"></span></div>
    <p>Quan sát mô hình 3D (có thể xoay, phóng to) và chọn tên đúng:</p>${opts.map((o) => `<button class="opt" data-id="${o.id}">${escapeHtml(o.name)}</button>`).join('')}<div id="qfb"></div><button class="tb" id="qQuit" style="margin-top:10px">Thoát đố vui</button></div>`;
  document.querySelectorAll('.opt').forEach((b) => (b.onclick = () => {
    if (quiz.answered) return; quiz.answered = true;
    const ok = b.dataset.id === it.id; if (ok) quiz.score++;
    document.querySelectorAll('.opt').forEach((x) => x.classList.toggle('ok', x.dataset.id === it.id));
    if (!ok) b.classList.add('bad');
    $('#qfb').innerHTML = `<p style="font-weight:600">${ok ? 'Chính xác.' : `Chưa đúng — đáp án là <b>${escapeHtml(it.name)}</b>.`}</p><p style="font-size:13px;color:#aab3bf">${escapeHtml(it.desc)}</p><button class="tb accent" id="qNext">${quiz.i + 1 < quiz.order.length ? 'Câu tiếp theo ➜' : 'Xem kết quả'}</button>`;
    $('#qNext').onclick = () => { quiz.answered = false; quiz.i++; if (quiz.i < quiz.order.length) askQuiz(); else endQuiz(false); };
  }));
  $('#qQuit').onclick = () => endQuiz(true);
}
function endQuiz(silent) {
  const q = quiz; quiz = null; $('#vcap').textContent = '';
  if (silent || !q) { if (sel) renderInfo(sel); return; }
  Progress.record('explore', 'quiz', q.score, q.order.length);
  $('#info').innerHTML = `<div class="quiz"><h3>Kết quả</h3><p style="font-family:var(--font-display);font-size:72px;font-weight:700;letter-spacing:-0.04em;margin:10px 0;color:${q.score >= 8 ? '#1a7f37' : q.score >= 5 ? '#a15c00' : '#c4291c'}">${q.score}/${q.order.length} câu đúng</p><p>${q.score >= 8 ? 'Tuyệt vời! Em nhận biết phần cứng rất tốt.' : q.score >= 5 ? 'Khá tốt! Hãy xem lại các mục còn nhầm nhé.' : 'Hãy khám phá thêm thư viện rồi thử lại nhé!'}</p><button class="tb accent" id="qAgain">Chơi lại</button></div>`;
  $('#qAgain').onclick = startQuiz;
}
$('#btnQuiz').onclick = startQuiz;

// ---------- Khởi động ----------
resize(); renderCats(); renderList();
const qs = new URLSearchParams(location.search).get('q');
if (qs) { qInput.value = qs; query = qs; renderList(); }
select(results()[0] || ITEMS.find((i) => i.id === 'usb-c'));
loop();
window.__ex = { ITEMS, select, MODELS, camera, controls, scene, canvas, get current() { return current; } };
