/**
 * TinHocLab – chế độ "Tháo lắp 3D".
 *
 * Chạy ngay trên viewer của PC Anatomy (cùng renderer, camera, OrbitControls), không dựng
 * bộ máy three.js thứ hai. Mỗi linh kiện có một trục rút (axis) và độ sâu khớp (depth):
 * kéo một linh kiện đang lắp thì nó chỉ trượt dọc trục đó, như rút RAM khỏi khe; ra hết độ
 * sâu khớp thì nó tự do, kéo đi đâu cũng được nhưng không xuyên qua vách thùng hay linh kiện
 * khác. Thả gần đúng chỗ và đúng hướng thì nó tự trượt về và cắm vào.
 *
 * Các kỹ thuật lấy ý tưởng từ Teardown (https://github.com/elvarofficial/teardown, MIT):
 * bung rời theo lớp, lớp ngoài đi trước (engine.js – explode), bản sao trong suốt của vật liệu
 * để X-quang/cô lập (engine.js – GHOST), mặt cắt (setCut), góc camera đặt tên sẵn (film.js –
 * VIEW_FN), hàng đợi trình diễn tự chạy và nhường quyền khi người dùng thao tác (live.js).
 *
 * Toạ độ thùng máy: +X phía trước, +Y lên trên, +Z phía kính hông. 1 đơn vị = 35 mm.
 */
import * as T from 'three';
import type { Piece } from '../models.ts';
import { resolvePick } from '../picking.ts';
import { fitCameraToBounds } from '../stage-runtime.ts';
import { clamp01, easeInOutCubic, layer } from './ease.ts';
import * as lib from './procgen/library.ts';
import type { ModelMeta } from './procgen/index.ts';

type Model = { root: T.Group; pieces: Piece[] };
type V3 = [number, number, number];

type Rule = {
  /** Hướng rút ra khỏi chỗ lắp. */
  axis: V3;
  /** Phải rút bao xa (đơn vị thùng máy) thì linh kiện mới rời khỏi khe/chân cắm. */
  depth: number;
  /** Linh kiện phải có sẵn trong máy trước khi lắp được linh kiện này. */
  req: string[];
  /** Lớp khi bung rời: 0 là lớp ngoài cùng, đi trước. */
  layer: number;
  /** Lắc nhẹ quanh trục lúc mới nhấc (độ) – tản nhiệt phải xoay nhẹ để tách lớp keo. */
  twist?: number;
};

export const RULES: Record<string, Rule> = {
  sidepanel: { axis: [0, 0, 1], depth: 0.5, req: [], layer: 0 },
  psucable: { axis: [0, 0, 1], depth: 0.35, req: ['psu', 'motherboard', 'processor', 'graphicscard', 'ssd'], layer: 1 },
  graphicscard: { axis: [0, 0, 1], depth: 0.4, req: ['motherboard'], layer: 2 },
  cpucooler: { axis: [0, 0, 1], depth: 0.55, req: ['processor'], layer: 2, twist: 7 },
  ssd: { axis: [0, 0, 1], depth: 0.6, req: [], layer: 2 },
  psu: { axis: [1, 0, 0], depth: 0.45, req: [], layer: 2 },
  ram: { axis: [0, 0, 1], depth: 0.35, req: ['motherboard'], layer: 3 },
  nvme: { axis: [0, 0, 1], depth: 0.22, req: ['motherboard'], layer: 3 },
  processor: { axis: [0, 0, 1], depth: 0.22, req: ['motherboard'], layer: 4 },
  motherboard: { axis: [0.3, 0, 1], depth: 0.35, req: ['ioshield'], layer: 5 },
  ioshield: { axis: [1, 0, 0], depth: 0.2, req: [], layer: 6 },
};
/** Thứ tự tháo (ngược thứ tự lắp của phòng lắp ráp). */
export const REMOVE_ORDER = ['sidepanel', 'psucable', 'graphicscard', 'cpucooler', 'ssd', 'nvme', 'ram', 'processor', 'psu', 'motherboard', 'ioshield'];
/** Vỏ máy: những phần X-quang "vỏ" làm trong suốt. */
const CASE = new Set(['chassis', 'sidepanel', 'frontpanel', 'toppanel', 'dustfilter', 'frontio', 'drivecage', 'casefan', 'psushroud']);

const SNAP = 1.1; // thả cách chỗ lắp dưới khoảng này thì tự cắm vào
const SNAP_ANGLE = T.MathUtils.degToRad(22); // lệch hướng tối đa còn cắm được

type Pose = { pull: number; off: T.Vector3; rot: T.Quaternion };
type Anim = { to: Partial<Pose>; dur: number; t?: number; from?: Pose; done?: () => void };
type PS = Pose & {
  rule: Rule;
  axis: T.Vector3;
  home: T.Vector3;
  anim: Anim[];
  /** Khoảng bung rời (dọc trục) và lúc bắt đầu đi, theo lớp. */
  exDist: number;
  exStart: number;
  park: T.Vector3;
  /** Dịch theo +Z đủ để ra khỏi vỏ (tính từ lúc đã rút hết độ sâu khớp). */
  clear: number;
};

type Ctx = {
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  camera: T.PerspectiveCamera;
  controls: { enabled: boolean; target: T.Vector3 };
  scene: T.Scene;
  renderer: T.WebGLRenderer;
  model: () => Model;
  level: () => string;
  wake: () => void;
  refit: () => void;
};

export type Status = 'seated' | 'moving' | 'loose' | 'out';
export type ViewName = 'overview' | 'side' | 'rear' | 'top' | 'socket' | 'ram' | 'gpu' | 'psu' | 'storage' | 'selected';
const VIEWS: Record<ViewName, { focus: string[] | null; dir: V3; pad: number }> = {
  overview: { focus: null, dir: [0.7, 0.55, 1.2], pad: 1.0 },
  side: { focus: null, dir: [0.02, 0.06, 1], pad: 0.95 },
  rear: { focus: null, dir: [-1, 0.14, 0.3], pad: 0.85 },
  top: { focus: null, dir: [0.05, 1, 0.3], pad: 0.85 },
  socket: { focus: ['processor', 'cpucooler'], dir: [0.35, 0.3, 1], pad: 1.5 },
  ram: { focus: ['ram'], dir: [0.3, 0.4, 1], pad: 1.8 },
  gpu: { focus: ['graphicscard'], dir: [0.35, 0.3, 1], pad: 1.25 },
  psu: { focus: ['psu'], dir: [0.5, 0.25, 1], pad: 1.6 },
  storage: { focus: ['nvme', 'ssd'], dir: [0.3, 0.3, 1], pad: 1.5 },
  selected: { focus: [], dir: [0.35, 0.3, 1], pad: 1.6 },
};

const ID = new T.Quaternion();
const emit = (type: string, detail: unknown) => window.dispatchEvent(new CustomEvent(type, { detail }));

let ctx: Ctx | null = null;

export const td = {
  active: false,
  model: null as Model | null,
  st: new Map<Piece, PS>(),
  selected: null as Piece | null,
  view: '' as ViewName | '',
  xray: 'off' as 'off' | 'case' | 'focus',
  cut: { axis: null as null | 'x' | 'y' | 'z', pos: 0.5 },
  explode: 0,
  exNow: 0,
  labels: true,
  /** Phần khung nhìn bị giao diện che (px): tâm hình được dời vào vùng còn trống (stage3d.js của Teardown). */
  inset: { right: 0, top: 0 },
  /** Hệ số tốc độ chuyển động (kiểm thử, hoặc xem chậm). */
  speed: 1,
  queue: [] as (() => void | number)[],
  wait: 0,
  dirty: true,
  matDirty: false,
  /** Ngoài vỏ và vách thùng máy, để tránh va chạm. */
  outer: new T.Box3(),
  walls: [] as T.Box3[],

  // ---------------------------------------------------------------- bật/tắt
  setActive(on: boolean) {
    if (on === this.active) return;
    this.active = on;
    this.queue = [];
    this.selected = null;
    this.explode = this.exNow = 0;
    this.xray = 'off';
    this.cut.axis = null;
    skuReset();
    restoreMaterials();
    if (on) {
      this.model = null; // setModel ở khung hình kế tiếp
      this.view = 'overview';
      ctx?.refit();
    } else this.st.clear();
    this.matDirty = true;
    this.touch();
  },
  touch() {
    this.dirty = true;
    ctx?.wake();
  },

  // ---------------------------------------------------------------- truy vấn
  status(p: Piece): Status {
    const s = this.st.get(p);
    if (!s) return 'seated';
    if (s.anim.length || (drag && drag.piece === p)) return 'moving';
    if (s.pull <= 0 && s.off.lengthSq() < 1e-8) return 'seated';
    return s.pull >= 1 && s.off.lengthSq() > 0.25 ? 'out' : 'loose';
  },
  pieces(concept?: string) {
    return [...this.st.keys()].filter((p) => !concept || p.concept === concept);
  },
  /** Linh kiện đang chặn, phải tháo trước. */
  blockers(p: Piece) {
    const out = new Set<string>();
    if (p.concept !== 'sidepanel' && glassIn()) out.add('sidepanel');
    for (const [q, s] of this.st)
      if (q !== p && s.rule.req.includes(p.concept) && this.status(q) !== 'out' && this.status(q) !== 'loose') out.add(q.concept);
    return [...out];
  },
  /** Linh kiện còn thiếu, phải lắp trước. */
  missing(p: Piece) {
    const s = this.st.get(p);
    if (!s) return [];
    const out = new Set<string>();
    if (p.concept !== 'sidepanel' && glassIn()) out.add('sidepanel!');
    for (const r of s.rule.req) for (const q of this.pieces(r)) if (this.status(q) !== 'seated') out.add(r);
    return [...out];
  },
  list() {
    return [...this.st.keys()].map((p) => ({
      concept: p.concept,
      instance: p.instance,
      status: this.status(p),
      blockers: this.blockers(p),
      missing: this.missing(p),
      selected: p === this.selected,
    }));
  },

  // ---------------------------------------------------------------- thao tác
  select(p: Piece | null) {
    if (p === this.selected) return;
    this.selected = p;
    if (this.xray === 'focus') this.matDirty = true;
    emit('td:select', p ? { concept: p.concept, instance: p.instance, status: this.status(p) } : null);
    if (this.view === 'selected') ctx?.refit();
    this.touch();
  },
  selectBy(concept: string, instance = 0) {
    this.select(this.pieces(concept).find((p) => p.instance === instance) ?? this.pieces(concept)[0] ?? null);
  },
  /** Tháo: rút dọc trục ra hết độ sâu khớp rồi đặt lên bàn cạnh máy. */
  remove(p: Piece, quiet = false) {
    const s = this.st.get(p);
    if (!s || this.status(p) === 'out') return false;
    if (s.pull <= 0) {
      const b = this.blockers(p);
      if (b.length) {
        if (!quiet) emit('td:msg', { kind: 'err', code: 'blocked', concept: p.concept, need: b });
        return false;
      }
    }
    // rút dọc khe → ra khỏi vỏ phía kính → đi ngang tới bàn → đặt xuống chỗ của nó
    const k = s.park;
    s.anim.push(
      { to: { pull: 1 }, dur: 0.35 + s.rule.depth * 0.9 },
      { to: { off: new T.Vector3(s.off.x, s.off.y, Math.max(s.off.z, s.clear)), rot: ID.clone() }, dur: 0.55 },
      { to: { off: new T.Vector3(k.x, k.y, Math.max(s.off.z, s.clear)) }, dur: 0.75 },
      { to: { off: k.clone() }, dur: 0.45, done: emitState },
    );
    this.touch();
    return true;
  },
  /** Lắp: về đúng hướng, đến trước chỗ lắp, rồi trượt vào theo trục. */
  install(p: Piece, quiet = false) {
    const s = this.st.get(p);
    if (!s || this.status(p) === 'seated') return false;
    const need = this.missing(p);
    if (need.length) {
      if (!quiet) emit('td:msg', { kind: 'err', code: 'missing', concept: p.concept, need });
      return false;
    }
    if (s.off.length() > SNAP * 1.5) {
      // từ xa: ra trước mặt kính, đi ngang về trước chỗ lắp, rồi mới vào trong vỏ
      const cz = Math.max(s.off.z, s.clear);
      s.anim.push(
        { to: { off: new T.Vector3(s.off.x, s.off.y, cz) }, dur: 0.45 },
        { to: { off: new T.Vector3(0, 0, cz), rot: ID.clone() }, dur: 0.75 },
        { to: { off: new T.Vector3() }, dur: 0.55 },
      );
    } else if (s.off.lengthSq() > 1e-6 || angleOf(s.rot) > 1e-3) s.anim.push({ to: { off: new T.Vector3(), rot: ID.clone() }, dur: 0.5 });
    s.anim.push({ to: { pull: 0 }, dur: 0.35 + s.rule.depth * 0.9, done: () => (emitState(), emit('td:msg', { kind: 'ok', code: 'installed', concept: p.concept })) });
    this.touch();
    return true;
  },
  /** Xoay linh kiện đang ở ngoài (độ, quanh trục X/Y/Z của thùng máy). */
  rotate(p: Piece, axis: 'x' | 'y' | 'z', deg: number) {
    const s = this.st.get(p);
    if (!s || this.status(p) === 'seated' || this.status(p) === 'moving') return false;
    const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0), T.MathUtils.degToRad(deg));
    s.anim.push({ to: { rot: q.multiply(s.rot.clone()) }, dur: 0.35, done: emitState });
    this.touch();
    return true;
  },
  straighten(p: Piece) {
    const s = this.st.get(p);
    if (!s || this.status(p) !== 'out') return;
    s.anim.push({ to: { rot: ID.clone() }, dur: 0.4, done: emitState });
    this.touch();
  },
  removeAll() {
    for (const c of REMOVE_ORDER)
      for (const p of this.pieces(c))
        this.enqueue(() => (this.remove(p, true) ? 0.05 : 0));
  },
  installAll() {
    for (const c of [...REMOVE_ORDER].reverse())
      for (const p of this.pieces(c))
        this.enqueue(() => (this.install(p, true) ? 0.05 : 0));
  },
  /** Hàng đợi trình diễn: mỗi việc chạy khi mọi chuyển động trước đã xong; trả về số giây chờ thêm. */
  enqueue(fn: () => void | number) {
    this.queue.push(fn);
    this.touch();
  },
  stopQueue() {
    this.queue = [];
    this.wait = 0;
  },
  setView(v: ViewName) {
    this.view = v;
    ctx?.refit();
  },
  setXray(mode: 'off' | 'case' | 'focus') {
    this.xray = mode;
    this.matDirty = true;
    this.touch();
  },
  setCut(axis: null | 'x' | 'y' | 'z', pos?: number) {
    const changed = axis !== this.cut.axis;
    this.cut.axis = axis;
    this.cut.pos = clamp01(pos ?? this.cut.pos);
    if (changed) this.matDirty = true;
    placeCut();
    this.touch();
  },
  setExplode(v: number) {
    this.explode = clamp01(v);
    if (this.explode > 0) computeExplode();
    this.touch();
  },
};
(globalThis as unknown as { __td: typeof td }).__td = td;

const glassIn = () => td.pieces('sidepanel').some((g) => td.status(g) !== 'out' && td.status(g) !== 'loose');
const angleOf = (q: T.Quaternion) => 2 * Math.acos(Math.min(1, Math.abs(q.w)));
let lastState = '';
function emitState() {
  // đang trình diễn tự chạy: căn lại camera theo những gì vừa đặt ra bàn
  if (td.queue.length && td.view && td.view !== 'selected') ctx?.refit();
  const l = td.list();
  const sig = JSON.stringify(l);
  if (sig === lastState) return;
  lastState = sig;
  emit('td:state', l);
}

// ------------------------------------------------------------------ mô hình
function setModel(m: Model) {
  skuReset(); // mô hình SKU gắn vào máy cũ: trả lại mô hình gốc trước khi đổi máy
  td.model = m;
  td.st.clear();
  restoreMaterials();
  // ngoài vỏ: hợp các khung 'chassis'
  td.outer.makeEmpty();
  const b = new T.Box3();
  for (const p of m.pieces) if (p.concept === 'chassis' && !p.batch) td.outer.union(rest(p, b));
  for (const p of m.pieces) {
    const rule = RULES[p.concept];
    if (!rule || p.batch) continue;
    if (p.concept === 'sidepanel' && p.instance !== 0) continue; // tấm sau khay mainboard: cố định
    td.st.set(p, {
      rule,
      axis: new T.Vector3(...rule.axis).normalize(),
      pull: 0,
      off: new T.Vector3(),
      rot: new T.Quaternion(),
      home: p.object.position.clone(),
      anim: [],
      exDist: 0,
      exStart: 0,
      park: new T.Vector3(),
      clear: 0,
    });
  }
  // vách thùng máy (để mở phía kính, +Z): sau, trước, đáy, nóc, và khay mainboard
  const o = td.outer,
    t = 0.22;
  const board = td.pieces('motherboard')[0];
  const trayZ = board ? rest(board, b).min.z - 0.03 : o.min.z + t;
  td.walls = o.isEmpty()
    ? []
    : [
        new T.Box3(new T.Vector3(o.min.x, o.min.y, o.min.z), new T.Vector3(o.min.x + t, o.max.y, o.max.z)),
        new T.Box3(new T.Vector3(o.max.x - t, o.min.y, o.min.z), new T.Vector3(o.max.x, o.max.y, o.max.z)),
        new T.Box3(new T.Vector3(o.min.x, o.min.y, o.min.z), new T.Vector3(o.max.x, o.min.y + t, o.max.z)),
        new T.Box3(new T.Vector3(o.min.x, o.max.y - t, o.min.z), new T.Vector3(o.max.x, o.max.y, o.max.z)),
        new T.Box3(new T.Vector3(o.min.x, o.min.y, o.min.z), new T.Vector3(o.max.x, o.max.y, trayZ)),
      ];
  computeParking();
  computeExplode();
  placeCut();
  emitState();
}

/** Hộp bao của linh kiện ở vị trí lắp (chưa cộng phần tháo lắp). */
function rest(p: Piece, out: T.Box3) {
  const s = p.object.scale.x || 1;
  const base = td.st.get(p)?.home ?? p.object.position;
  return out.setFromCenterAndSize(c3.copy(p.center).multiplyScalar(s).add(base), e3.copy(p.extent).multiplyScalar(s));
}
const c3 = new T.Vector3(),
  e3 = new T.Vector3(),
  m4 = new T.Matrix4();
/** Hộp bao của linh kiện ở một tư thế (pull, off, rot) bất kỳ. */
function boxAt(p: Piece, s: PS, pull: number, off: T.Vector3, rot: T.Quaternion, out: T.Box3) {
  const sc = p.object.scale.x || 1;
  out.setFromCenterAndSize(c3.copy(p.center).multiplyScalar(sc), e3.copy(p.extent).multiplyScalar(sc));
  if (angleOf(rot) > 1e-4) out.applyMatrix4(m4.makeRotationFromQuaternion(rot));
  return out.translate(c3.copy(s.home).addScaledVector(s.axis, pull * s.rule.depth + s.exDist * exOf(s)).add(off));
}
function boxNow(p: Piece, out: T.Box3) {
  const s = td.st.get(p);
  if (!s) {
    const sc = p.object.scale.x || 1;
    return out.setFromCenterAndSize(c3.copy(p.center).multiplyScalar(sc).add(p.object.position), e3.copy(p.extent).multiplyScalar(sc));
  }
  return boxAt(p, s, s.pull, s.off, s.rot, out);
}

/** Chỗ đặt linh kiện đã tháo: một "bàn" trước mặt kính, xếp theo thứ tự tháo, không chồng lên nhau. */
function computeParking() {
  const o = td.outer;
  if (o.isEmpty()) return;
  const b = new T.Box3(),
    size = new T.Vector3(),
    centre = new T.Vector3();
  // bàn bên phải máy (phía trước thùng, +X): xếp theo cột, mỗi cột đi dần ra sau (−Z)
  let x = o.max.x + 1.3,
    z = o.max.z,
    colW = 0;
  for (const c of REMOVE_ORDER)
    for (const p of td.pieces(c)) {
      const s = td.st.get(p)!;
      rest(p, b).translate(c3.copy(s.axis).multiplyScalar(s.rule.depth));
      b.getSize(size);
      b.getCenter(centre);
      // ra khỏi vỏ theo phía kính trước, rồi mới đi ngang: không xuyên qua vách
      s.clear = Math.max(0, o.max.z + 0.45 - b.min.z);
      if (p.concept === 'sidepanel') {
        // kính dựng bên trái máy, tránh xa chỗ làm việc
        s.park.set(o.min.x - 0.9 - size.x / 2 - centre.x, 0, s.clear);
        continue;
      }
      if (z - size.z < o.min.z - 1 && z < o.max.z) {
        x += colW + 0.7;
        z = o.max.z;
        colW = 0;
      }
      const want = new T.Vector3(x + size.x / 2, o.min.y + size.y / 2, z - size.z / 2);
      s.park.copy(want).sub(centre);
      z -= size.z + 0.6;
      colW = Math.max(colW, size.x);
    }
}

/**
 * Bung rời có tính va chạm: xếp từ lớp trong ra lớp ngoài, mỗi linh kiện đi dọc trục của nó
 * vừa đủ xa để vượt qua mọi linh kiện cùng hướng nằm chồng bên dưới nó, cộng một khe hở.
 */
function computeExplode() {
  for (const s of td.st.values()) s.exDist = 0;
  const items = [...td.st.entries()].filter(([p]) => td.status(p) === 'seated');
  const dom = (a: T.Vector3) => (Math.abs(a.x) > Math.abs(a.y) && Math.abs(a.x) > Math.abs(a.z) ? 'x' : Math.abs(a.y) > Math.abs(a.z) ? 'y' : 'z');
  items.sort((a, b) => b[1].rule.layer - a[1].rule.layer); // trong cùng trước
  const placed: { box: T.Box3; d: number; k: 'x' | 'y' | 'z' }[] = [];
  const maxLayer = Math.max(1, ...items.map(([, s]) => s.rule.layer));
  for (const [p, s] of items) {
    const k = dom(s.axis);
    const sign = Math.sign(s.axis[k]);
    const box = rest(p, new T.Box3());
    const others = (['x', 'y', 'z'] as const).filter((a) => a !== k);
    let need = s.rule.depth + 0.5; // tối thiểu: rút khỏi khe và thêm chút khoảng cách
    for (const q of placed) {
      if (q.k !== k) continue;
      if (!others.every((a) => box.min[a] < q.box.max[a] - 0.02 && box.max[a] > q.box.min[a] + 0.02)) continue;
      const gap = 0.45;
      const reach = sign > 0 ? q.box.max[k] + q.d - box.min[k] + gap : box.max[k] - (q.box.min[k] - q.d) + gap;
      need = Math.max(need, reach);
    }
    s.exDist = need / Math.abs(s.axis[k]);
    // lớp ngoài cùng (layer 0) bắt đầu ngay; lớp trong cùng bắt đầu muộn nhất
    s.exStart = (s.rule.layer / maxLayer) * 0.5;
    placed.push({ box, d: need, k });
  }
}
const exOf = (s: PS) => layer(td.exNow, s.exStart, 0.5);

// ------------------------------------------------------------------ tư thế (gọi từ applyPiecePose)
const qTwist = new T.Quaternion(),
  qBase = new T.Quaternion();
export function tdApply(piece: Piece, level: string) {
  const o = piece.object;
  if (!td.active || level !== 'pc') {
    if (o.userData.tdRest) {
      if (!piece.lie) o.quaternion.copy(o.userData.tdRest as T.Quaternion);
      delete o.userData.tdRest;
    }
    return;
  }
  const s = td.st.get(piece);
  if (!s) return;
  s.home.copy(o.position);
  o.position.addScaledVector(s.axis, s.pull * s.rule.depth + s.exDist * exOf(s)).add(s.off);
  if (!o.userData.tdRest) o.userData.tdRest = o.quaternion.clone();
  qBase.copy(piece.lie && piece.restQuat ? o.quaternion : (o.userData.tdRest as T.Quaternion));
  // tản nhiệt: lắc nhẹ quanh trục trong đoạn đầu lúc nhấc ra, như tách lớp keo tản nhiệt
  const tw = s.rule.twist && s.pull > 0 && s.pull < 0.45 ? Math.sin((s.pull / 0.45) * Math.PI * 2) * T.MathUtils.degToRad(s.rule.twist) : 0;
  qTwist.setFromAxisAngle(s.axis, tw);
  o.quaternion.copy(s.rot).multiply(qTwist).multiply(qBase);
}

// ------------------------------------------------------------------ mỗi khung hình
const lerpPose = (a: Pose, b: Partial<Pose>, k: number, s: PS) => {
  if (b.pull !== undefined) s.pull = a.pull + (b.pull - a.pull) * k;
  if (b.off) s.off.copy(a.off).lerp(b.off, k);
  if (b.rot) s.rot.copy(a.rot).slerp(b.rot, k);
};
let viewSig = '';
function applyViewOffset() {
  const cam = ctx!.camera;
  const w = ctx!.host.clientWidth,
    h = ctx!.host.clientHeight;
  const on = td.active && ctx!.level() === 'pc' && (td.inset.right || td.inset.top);
  const sig = on ? [w, h, td.inset.right, td.inset.top].join(',') : '';
  if (sig === viewSig && (!on || cam.view?.enabled)) return false;
  viewSig = sig;
  if (on && w && h) cam.setViewOffset(w, h, td.inset.right / 2, -td.inset.top / 2, w, h);
  else cam.clearViewOffset();
  return true;
}
export function tdTick(dt: number) {
  if (!ctx) return false;
  const m = ctx.model();
  const viewMoved = applyViewOffset();
  if (!td.active || ctx.level() !== 'pc') {
    if (applyViewOffset()) td.dirty = true;
    if (td.matDirty) {
      restoreMaterials();
      td.matDirty = false;
    }
    const d = td.dirty;
    td.dirty = false;
    return d;
  }
  if (m !== td.model) setModel(m);
  dt *= td.speed;
  let moving = td.dirty || viewMoved;
  td.dirty = false;
  // bung rời: tiến tới giá trị đặt, đều tay
  if (td.exNow !== td.explode) {
    const step = dt / 1.6;
    td.exNow = td.explode > td.exNow ? Math.min(td.explode, td.exNow + step) : Math.max(td.explode, td.exNow - step);
    moving = true;
  }
  let animating = false;
  for (const [, s] of td.st) {
    const a = s.anim[0];
    if (!a) continue;
    animating = moving = true;
    a.from ??= { pull: s.pull, off: s.off.clone(), rot: s.rot.clone() };
    a.t = Math.min(1, (a.t ?? 0) + dt / a.dur);
    lerpPose(a.from, a.to, easeInOutCubic(a.t), s);
    if (a.t >= 1) {
      s.anim.shift();
      a.done?.();
      if (!s.anim.length) emitState();
    }
  }
  // hàng đợi trình diễn
  if (td.queue.length && !animating && !drag) {
    td.wait -= dt;
    if (td.wait <= 0) {
      const w = td.queue.shift()!();
      td.wait = typeof w === 'number' ? w : 0;
    }
    moving = true;
  }
  if (td.matDirty) {
    applyMaterials();
    td.matDirty = false;
  }
  if (tickPreview()) moving = true;
  updateHelpers();
  return moving;
}

// ------------------------------------------------------------------ camera
const tmpBox = new T.Box3(),
  tmpSize = new T.Vector3(),
  tmpDir = new T.Vector3();
/** Ghi đè điểm nhìn khi đang chọn một góc camera đặt tên. Trả về true nếu đã ghi đè. */
export function tdFit(targetPosition: T.Vector3, targetLook: T.Vector3, camera: T.PerspectiveCamera) {
  if (td.active && preview) return fitBox(new T.Box3().setFromObject(preview.holder), [0.8, 0.55, 1.1], 1.05, 0.5, targetPosition, targetLook, camera);
  if (!td.active || !td.view || !td.model) return false;
  const v = VIEWS[td.view];
  const focus = td.view === 'selected' ? (td.selected ? [td.selected] : []) : v.focus ? td.model.pieces.filter((p) => v.focus!.includes(p.concept) && p.visible) : [];
  tmpBox.makeEmpty();
  const b = new T.Box3();
  if (focus.length) for (const p of focus) tmpBox.union(boxNow(p, b));
  else if (!td.outer.isEmpty()) tmpBox.copy(td.outer);
  else return false;
  if (!focus.length) for (const [p, s] of td.st) if (s.pull > 0 || s.off.lengthSq() > 0) tmpBox.union(boxNow(p, b)); // gồm cả bàn linh kiện đã tháo
  if (td.exNow > 0) for (const p of td.st.keys()) tmpBox.union(boxNow(p, b));
  const root = td.model.root;
  root.updateMatrixWorld();
  tmpBox.applyMatrix4(root.matrixWorld);
  // khung còn trống sau khi trừ phần giao diện che
  const aspect = camera.aspect,
    W = ctx!.host.clientWidth,
    H = ctx!.host.clientHeight;
  if (W > td.inset.right && H > td.inset.top) camera.aspect = (W - td.inset.right) / (H - td.inset.top);
  const fovY = camera.fov;
  if (H > td.inset.top) camera.fov = T.MathUtils.radToDeg(2 * Math.atan(Math.tan(T.MathUtils.degToRad(fovY) / 2) * (1 - td.inset.top / H)));
  fitCameraToBounds(tmpBox, camera, targetPosition, targetLook, tmpDir.set(...v.dir), tmpSize, v.pad, focus.length ? 2.2 : 6);
  camera.aspect = aspect;
  camera.fov = fovY;
  return true;
}

// ------------------------------------------------------------------ X-quang, mặt cắt
const CLIP = new T.Plane(new T.Vector3(0, 0, -1), 0);
const ghosts = new Map<T.Material, T.Material>();
const capMat = new T.MeshBasicMaterial({ color: '#e8b86a', side: T.BackSide, clippingPlanes: [CLIP], polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const touched = new Set<T.Mesh>();
let ghosted = new Set<Piece>();
const meshesOf = (p: Piece, fn: (m: T.Mesh) => void) =>
  p.object.traverse((o) => {
    if ((o as T.Mesh).isMesh && !(o as T.InstancedMesh).isInstancedMesh && !o.userData.tdTwin) fn(o as T.Mesh);
  });
function ghostOf(m: T.Material, opacity: number) {
  let g = ghosts.get(m);
  if (!g) {
    g = m.clone();
    g.transparent = true;
    g.depthWrite = false;
    ghosts.set(m, g);
  }
  g.opacity = Math.min(m.transparent ? m.opacity : 1, 1) * opacity;
  return g;
}
function ghostLevel(p: Piece) {
  if (td.xray === 'case' && CASE.has(p.concept)) return p.concept === 'sidepanel' ? 0.05 : 0.1;
  if (td.xray === 'focus' && td.selected && p !== td.selected) return 0.12;
  return 0;
}
function placeCut() {
  const o = td.outer;
  if (!td.cut.axis || o.isEmpty()) return;
  const k = td.cut.axis;
  CLIP.normal.set(k === 'x' ? -1 : 0, k === 'y' ? -1 : 0, k === 'z' ? -1 : 0);
  // mặt phẳng trong toạ độ thế giới; gốc mô hình có thể bị co giãn
  const local = T.MathUtils.lerp(o.min[k], o.max[k], 0.04 + td.cut.pos * 0.92);
  const root = td.model?.root;
  const p = new T.Vector3(k === 'x' ? local : 0, k === 'y' ? local : 0, k === 'z' ? local : 0);
  if (root) {
    root.updateMatrixWorld();
    p.applyMatrix4(root.matrixWorld);
  }
  CLIP.constant = -CLIP.normal.dot(p);
}
function setClip(m: T.Material, on: boolean) {
  const u = m.userData;
  if (on) {
    if (!('tdClip0' in u)) u.tdClip0 = m.clippingPlanes;
    m.clippingPlanes = [...((u.tdClip0 as T.Plane[] | null) ?? []), CLIP];
  } else if ('tdClip0' in u) {
    m.clippingPlanes = u.tdClip0 as T.Plane[] | null;
    delete u.tdClip0;
  } else return;
  m.needsUpdate = true;
}
function applyMaterials() {
  if (!td.model || !ctx) return;
  const cut = !!td.cut.axis;
  ctx.renderer.localClippingEnabled = cut || ctx.renderer.localClippingEnabled;
  ghosted = new Set();
  for (const p of td.model.pieces) {
    if (p.batch) continue;
    const g = ghostLevel(p);
    if (g) ghosted.add(p);
    meshesOf(p, (mesh) => {
      const u = mesh.userData;
      if (g) {
        if (!u.tdMat0) {
          u.tdMat0 = mesh.material;
          u.tdShadow = mesh.castShadow;
        }
        const m0 = u.tdMat0 as T.Material | T.Material[];
        mesh.material = Array.isArray(m0) ? m0.map((x) => ghostOf(x, g)) : ghostOf(m0, g);
        mesh.castShadow = false;
      } else if (u.tdMat0) {
        mesh.material = u.tdMat0;
        mesh.castShadow = u.tdShadow;
        delete u.tdMat0;
      }
      for (const m of [mesh.material].flat()) setClip(m, cut);
      // nắp mặt cắt: bản sao mặt sau, tô màu nhấn, chỉ hiện chỗ bị cắt lộ ra bên trong khối đặc
      let twin = u.tdTwin as T.Mesh | undefined;
      const solid = [mesh.material].flat().every((m) => !m.transparent);
      if (cut && solid && !g && !twin) {
        twin = new T.Mesh(mesh.geometry, capMat);
        twin.userData.tdTwin = true;
        twin.raycast = () => {};
        twin.castShadow = twin.receiveShadow = false;
        mesh.add(twin);
        u.tdTwin = twin;
      }
      if (twin) twin.visible = cut && solid && !g;
      touched.add(mesh);
    });
  }
}
function restoreMaterials() {
  for (const mesh of touched) {
    const u = mesh.userData;
    if (u.tdMat0) {
      mesh.material = u.tdMat0;
      mesh.castShadow = u.tdShadow;
      delete u.tdMat0;
    }
    for (const m of [mesh.material].flat()) setClip(m, false);
    if (u.tdTwin) (u.tdTwin as T.Mesh).visible = false;
  }
  for (const g of ghosts.values()) setClip(g, false);
  touched.clear();
  ghosted = new Set();
}

// ------------------------------------------------------------------ khung chọn, gợi ý chỗ lắp
let selHelper: T.Box3Helper | null = null,
  hintHelper: T.Box3Helper | null = null;
function updateHelpers() {
  if (!ctx || !td.model) return;
  if (!selHelper) {
    selHelper = new T.Box3Helper(new T.Box3(), 0xe8b86a);
    hintHelper = new T.Box3Helper(new T.Box3(), 0x3ecf7a);
    for (const h of [selHelper, hintHelper]) {
      h.visible = false;
      (h.material as T.LineBasicMaterial).depthTest = false;
      h.renderOrder = 10;
    }
  }
  const root = td.model.root;
  if (selHelper.parent !== root) root.add(selHelper, hintHelper!);
  const p = td.selected;
  selHelper.visible = td.active && !!p && p.visible;
  if (p && selHelper.visible) boxNow(p, selHelper.box).expandByScalar(0.03);
  hintHelper!.visible = false;
  if (drag && drag.mode === 'free') {
    const s = drag.s;
    if (s.off.length() < SNAP * 2.6) {
      hintHelper!.visible = true;
      rest(drag.piece, hintHelper!.box).expandByScalar(0.04);
      const ok = s.off.length() < SNAP && angleOf(s.rot) < SNAP_ANGLE && !td.missing(drag.piece).length;
      (hintHelper!.material as T.LineBasicMaterial).color.set(ok ? 0x3ecf7a : 0xe05a4f);
    }
  }
}

// ------------------------------------------------------------------ nhãn chú thích (toạ độ màn hình)
let lastFrame = '';
const proj = new T.Vector3();
export function tdAfterRender() {
  if (!ctx || !td.active || !td.model) return;
  if (preview) return previewLabels();
  // toạ độ màn hình (viewport) để lớp nhãn đặt position:fixed
  const r = ctx.host.getBoundingClientRect();
  const w = r.width,
    h = r.height;
  const root = td.model.root;
  const items: { concept: string; instance: number; x: number; y: number; status: Status; selected: boolean }[] = [];
  const b = new T.Box3();
  // ở góc nhìn cận cảnh chỉ gọi tên những linh kiện đang được nhìn
  const focus = td.view && td.view !== 'selected' ? VIEWS[td.view].focus : null;
  for (const p of td.st.keys()) {
    if (!p.visible || ghosted.has(p)) continue;
    if ((!td.labels || (focus && !focus.includes(p.concept) && td.status(p) === 'seated')) && p !== td.selected) continue;
    boxNow(p, b).getCenter(proj).applyMatrix4(root.matrixWorld).project(ctx.camera);
    if (proj.z > 1 || Math.abs(proj.x) > 1 || Math.abs(proj.y) > 1) continue;
    items.push({ concept: p.concept, instance: p.instance, x: Math.round(r.left + ((proj.x + 1) / 2) * w), y: Math.round(r.top + ((1 - proj.y) / 2) * h), status: td.status(p), selected: p === td.selected });
  }
  const sig = JSON.stringify(items);
  if (sig === lastFrame) return;
  lastFrame = sig;
  emit('td:frame', items);
}

// ------------------------------------------------------------------ kéo, xoay, thả
type Drag = {
  piece: Piece;
  s: PS;
  mode: 'pull' | 'free' | 'spin';
  id: number;
  t0: number;
  pull0: number;
  plane: T.Plane;
  grab: T.Vector3;
  off0: T.Vector3;
  rot0: T.Quaternion;
  x0: number;
  y0: number;
  stuck: Set<T.Box3 | Piece>;
};
let drag: Drag | null = null;
const raycaster = new T.Raycaster(),
  ndc = new T.Vector2(),
  inv = new T.Matrix4(),
  ray = new T.Ray();
/** Tia từ con trỏ, trong toạ độ của mô hình. */
function localRay(e: { clientX: number; clientY: number }) {
  const r = ctx!.canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, ctx!.camera);
  const root = td.model!.root;
  root.updateMatrixWorld();
  inv.copy(root.matrixWorld).invert();
  ray.copy(raycaster.ray).applyMatrix4(inv);
  ray.direction.normalize();
  return ray;
}
function pick(e: PointerEvent) {
  if (!td.model || !td.model.root.visible) return null;
  localRay(e);
  const hits = raycaster.intersectObject(td.model.root, true).filter((h) => {
    let o: T.Object3D | null = h.object;
    if (o.userData.tdTwin || o.userData.tdMat0) return false;
    while (o) {
      const p = o.userData.piece as Piece | undefined;
      if (p) return !ghosted.has(p);
      o = o.parent;
    }
    return true;
  });
  // Bộ chọn gốc nhìn xuyên qua kính. Ở đây kính còn đóng thì phải bấm được vào kính để tháo nó,
  // vì chưa mở kính thì không đụng được gì bên trong.
  for (const h of hits) {
    let o: T.Object3D | null = h.object;
    while (o && !o.userData.piece) o = o.parent;
    const g = o?.userData.piece as Piece | undefined;
    if (!g) continue;
    if (g.concept === 'sidepanel' && td.st.has(g) && td.status(g) === 'seated') return g;
    break;
  }
  return resolvePick(hits);
}
/** Tham số t của điểm trên đường thẳng (gốc o, hướng a) gần tia nhất. */
function closestOnLine(o: T.Vector3, a: T.Vector3, r: T.Ray) {
  const w = new T.Vector3().subVectors(o, r.origin);
  const b = a.dot(r.direction),
    d = a.dot(w),
    e = r.direction.dot(w);
  const den = 1 - b * b;
  if (den < 1e-4) return 0;
  return (b * e - d) / den;
}
/** Vật cản cho linh kiện đang kéo: vách thùng và mọi linh kiện khác (trừ khung vỏ). */
function obstacles(self: Piece) {
  const out: [T.Box3 | Piece, T.Box3][] = td.walls.map((w) => [w, w]);
  for (const p of td.model!.pieces) {
    if (p === self || !p.visible || p.batch || p.concept === 'chassis') continue;
    if (p.concept === 'sidepanel' && p.instance !== 0) continue;
    out.push([p, boxNow(p, new T.Box3())]);
  }
  return out;
}
const candBox = new T.Box3();
function collides(d: Drag, off: T.Vector3, rot: T.Quaternion, obs: [T.Box3 | Piece, T.Box3][]) {
  boxAt(d.piece, d.s, d.s.pull, off, rot, candBox).expandByScalar(-0.03);
  for (const [k, b] of obs) if (!d.stuck.has(k) && candBox.intersectsBox(b)) return true;
  return false;
}
function beginFree(d: Drag, e: PointerEvent) {
  d.mode = 'free';
  const camDir = ctx!.camera.getWorldDirection(new T.Vector3()).transformDirection(inv).normalize();
  const at = boxAt(d.piece, d.s, d.s.pull, d.s.off, d.s.rot, new T.Box3()).getCenter(new T.Vector3());
  d.plane.setFromNormalAndCoplanarPoint(camDir, at);
  d.grab = localRay(e).intersectPlane(d.plane, new T.Vector3()) ?? at;
  d.off0.copy(d.s.off);
  // những thứ đang chạm sẵn lúc bắt đầu thì bỏ qua cho tới khi tách ra
  boxAt(d.piece, d.s, d.s.pull, d.s.off, d.s.rot, candBox).expandByScalar(-0.03);
  d.stuck = new Set(obstacles(d.piece).filter(([, b]) => candBox.intersectsBox(b)).map(([k]) => k));
}
function down(e: PointerEvent) {
  if (!ctx || !td.active || ctx.level() !== 'pc' || !td.model) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (preview) return; // đang xem riêng một mô hình: kéo để xoay camera
  const p = pick(e);
  // người dùng chạm vào: dừng trình diễn tự chạy
  if (td.queue.length) {
    td.stopQueue();
    emit('td:takeover', null);
  }
  if (!p) return;
  const s = td.st.get(p);
  td.select(p);
  if (!s) return; // linh kiện cố định (khung vỏ, quạt…): chỉ xem thông tin, kéo để xoay camera
  if (s.anim.length) return;
  if (td.exNow > 0.01) {
    emit('td:msg', { kind: 'info', code: 'exploded' });
    return;
  }
  const status = td.status(p);
  if (status === 'seated') {
    const b = td.blockers(p);
    if (b.length) {
      emit('td:msg', { kind: 'err', code: 'blocked', concept: p.concept, need: b });
      return;
    }
  }
  e.stopPropagation();
  e.preventDefault();
  ctx.controls.enabled = false;
  const r = localRay(e);
  const line0 = s.home.clone().addScaledVector(s.axis, s.exDist * exOf(s));
  drag = {
    piece: p,
    s,
    mode: e.shiftKey && status !== 'seated' ? 'spin' : 'pull',
    id: e.pointerId,
    t0: closestOnLine(line0, s.axis, r),
    pull0: s.pull,
    plane: new T.Plane(),
    grab: new T.Vector3(),
    off0: s.off.clone(),
    rot0: s.rot.clone(),
    x0: e.clientX,
    y0: e.clientY,
    stuck: new Set(),
  };
  if (drag.mode === 'pull' && (s.pull >= 1 || s.off.lengthSq() > 1e-6)) beginFree(drag, e);
  addEventListener('pointermove', move, true);
  addEventListener('pointerup', up, true);
  addEventListener('pointercancel', up, true);
  td.touch();
}
function move(e: PointerEvent) {
  const d = drag;
  if (!d || e.pointerId !== d.id || !ctx) return;
  e.stopPropagation();
  const s = d.s;
  if (d.mode === 'spin') {
    // Shift + kéo: xoay tự do quanh trục đứng và trục ngang của màn hình
    const cam = ctx.camera;
    const upL = new T.Vector3(0, 1, 0).applyQuaternion(cam.quaternion).transformDirection(inv);
    const rightL = new T.Vector3(1, 0, 0).applyQuaternion(cam.quaternion).transformDirection(inv);
    const q = new T.Quaternion()
      .setFromAxisAngle(upL, (e.clientX - d.x0) * 0.012)
      .multiply(new T.Quaternion().setFromAxisAngle(rightL, (e.clientY - d.y0) * 0.012));
    const next = q.multiply(d.rot0);
    if (!collides(d, s.off, next, obstacles(d.piece))) s.rot.copy(next);
  } else if (d.mode === 'pull') {
    const r = localRay(e);
    const line0 = s.home.clone().addScaledVector(s.axis, s.exDist * exOf(s));
    const t = closestOnLine(line0, s.axis, r);
    const pull = d.pull0 + (t - d.t0) / s.rule.depth;
    s.pull = clamp01(pull);
    if (pull > 1.15) beginFree(d, e); // đã rời khe: từ đây kéo tự do
  } else {
    const r = localRay(e);
    const hit = r.intersectPlane(d.plane, new T.Vector3());
    if (hit) {
      const want = d.off0.clone().add(hit.sub(d.grab));
      const obs = obstacles(d.piece);
      // bỏ "đang chạm sẵn" khi đã tách khỏi vật đó
      boxAt(d.piece, s, s.pull, s.off, s.rot, candBox).expandByScalar(-0.03);
      for (const [k, b] of obs) if (d.stuck.has(k) && !candBox.intersectsBox(b)) d.stuck.delete(k);
      if (!collides(d, want, s.rot, obs)) s.off.copy(want);
      else {
        // trượt theo bề mặt: thử từng trục một
        const next = s.off.clone();
        for (const k of ['x', 'y', 'z'] as const) {
          const trial = next.clone();
          trial[k] = want[k];
          if (!collides(d, trial, s.rot, obs)) next.copy(trial);
        }
        s.off.copy(next);
        emit('td:bump', null);
      }
    }
  }
  td.touch();
}
function up(e: PointerEvent) {
  const d = drag;
  if (!d || e.pointerId !== d.id || !ctx) return;
  e.stopPropagation();
  drag = null;
  removeEventListener('pointermove', move, true);
  removeEventListener('pointerup', up, true);
  removeEventListener('pointercancel', up, true);
  ctx.controls.enabled = true;
  const s = d.s,
    p = d.piece;
  if (d.mode === 'pull') {
    // thả giữa chừng: chưa qua nửa thì tụt về khe, quá nửa thì rút hẳn ra
    if (s.pull > 0 && s.pull < 1) s.anim.push({ to: { pull: s.pull < 0.5 ? 0 : 1 }, dur: 0.25 });
    if (s.pull >= 1) emit('td:msg', { kind: 'ok', code: 'released', concept: p.concept });
  } else if (d.mode === 'free') {
    const dist = s.off.length();
    if (dist < SNAP) {
      if (angleOf(s.rot) >= SNAP_ANGLE) emit('td:msg', { kind: 'err', code: 'orient', concept: p.concept });
      else {
        const need = td.missing(p);
        if (need.length) emit('td:msg', { kind: 'err', code: 'missing', concept: p.concept, need });
        else td.install(p);
      }
    }
  }
  emitState();
  td.touch();
}

// ------------------------------------------------------------------ gắn vào viewer
export function tdBind(c: Ctx) {
  ctx = c;
  // pha capture trên khung chứa: chạy trước OrbitControls và trình xử lý của viewer trên canvas
  c.host.addEventListener('pointerdown', down, true);
  addEventListener('keydown', (e) => {
    if (!td.active || !td.selected || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as HTMLElement)?.closest?.('input,textarea,select')) return;
    const k = e.key.toLowerCase();
    const p = td.selected;
    if (k === 'q') td.rotate(p, 'y', -90);
    else if (k === 'e') td.rotate(p, 'y', 90);
    else if (k === 'r') td.rotate(p, 'x', 90);
    else if (k === 'f') td.rotate(p, 'z', 90);
    else if (k === 't') td.straighten(p);
    else if (k === 'delete' || k === 'backspace') td.remove(p);
    else if (k === 'enter') td.install(p);
    else return;
    e.preventDefault();
  });
}
/** Trả về true nếu viewer phải bỏ qua cú bấm (chế độ tháo lắp tự xử lý). */
export const tdOwnsClicks = (level: string) => td.active && level === 'pc';

// ================================================================== P4: mô hình theo SKU (thư viện procgen)
/** 1 đơn vị của thùng máy PC Anatomy = 35 mm (lib/machine.ts: mm(v) = v / 35). */
const UNIT = 35;
type Item = lib.Item;
/** Linh kiện nào trong máy đổi được sang mô hình SKU, và SKU nào hợp với chỗ lắp đó. */
export const SWAP: Record<string, { category: string; accept?: (it: Item) => boolean; kit?: boolean }> = {
  ram: { category: 'ram', kit: true },
  nvme: { category: 'ssd', accept: (it) => /M\.2/.test(it.formFactor ?? '') },
  ssd: { category: 'ssd', accept: (it) => it.formFactor === '2.5"' },
  processor: { category: 'cpu' },
  graphicscard: { category: 'gpu' },
  psu: { category: 'psu' },
  cpucooler: { category: 'cooler', accept: (it) => !it.water },
};
/** Mặt tựa khi thay: mô hình mới áp đúng mặt này của chỗ cũ (mặt cắm vào bo, mặt ke sau vỏ…), các trục khác căn giữa. */
const ANCHOR: Record<string, Partial<Record<'x' | 'y' | 'z', -1 | 1>>> = {
  graphicscard: { x: -1, y: 1, z: -1 },
  ram: { z: -1 },
  nvme: { z: -1 },
  processor: { z: -1 },
  cpucooler: { z: -1 },
  psu: { x: -1, y: -1 },
  ssd: { y: -1 },
};
type Orig = { children: T.Object3D[]; extent: T.Vector3; center: T.Vector3; size: number };
const swapped = new Map<Piece, { sku: string; meta: ModelMeta; orig: Orig }>();

/** 24 phép quay vuông góc; chọn phép làm kích thước mô hình mới khớp chỗ cũ nhất (ưu tiên giữ nguyên hướng). */
const ROTS: T.Quaternion[] = (() => {
  const out: T.Quaternion[] = [];
  const seen = new Set<string>();
  const e = new T.Euler();
  for (let a = 0; a < 4; a++)
    for (let b = 0; b < 4; b++)
      for (let c = 0; c < 4; c++) {
        const q = new T.Quaternion().setFromEuler(e.set((a * Math.PI) / 2, (b * Math.PI) / 2, (c * Math.PI) / 2));
        const m = new T.Matrix4().makeRotationFromQuaternion(q).elements.map((v) => Math.round(v)).join(',');
        if (!seen.has(m)) seen.add(m), out.push(q);
      }
  return out;
})();
function bestRotation(size: T.Vector3, want: T.Vector3) {
  let best = ROTS[0],
    score = Infinity;
  const v = new T.Vector3();
  for (const q of ROTS) {
    v.copy(size).applyQuaternion(q);
    let sc = 0;
    for (const k of ['x', 'y', 'z'] as const) sc += Math.abs(Math.log(Math.max(0.02, Math.abs(v[k])) / Math.max(0.02, want[k])));
    if (q === ROTS[0]) sc -= 0.3;
    if (sc < score) (score = sc), (best = q);
  }
  return best;
}

function applySwap(p: Piece, model: T.Group, meta: ModelMeta) {
  const o = p.object;
  let rec = swapped.get(p);
  const orig: Orig = rec?.orig ?? { children: [...o.children], extent: p.extent.clone(), center: p.center.clone(), size: p.size };
  for (const c of [...o.children]) o.remove(c);
  model.traverse((m) => {
    const mesh = m as T.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = mesh.receiveShadow = true;
    for (const mat of [mesh.material].flat()) (mat as T.MeshStandardMaterial).envMapIntensity = 0.8;
  });
  const scaled = new T.Group();
  scaled.scale.setScalar(1 / UNIT);
  scaled.add(model);
  const turn = new T.Group();
  turn.add(scaled);
  scaled.updateMatrixWorld(true);
  const size = new T.Box3().setFromObject(scaled).getSize(new T.Vector3());
  turn.quaternion.copy(bestRotation(size, orig.extent));
  turn.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(turn);
  const oMin = orig.center.clone().addScaledVector(orig.extent, -0.5),
    oMax = orig.center.clone().addScaledVector(orig.extent, 0.5);
  const a = ANCHOR[p.concept] ?? {};
  for (const k of ['x', 'y', 'z'] as const) turn.position[k] = a[k] === -1 ? oMin[k] - box.min[k] : a[k] === 1 ? oMax[k] - box.max[k] : (oMin[k] + oMax[k]) / 2 - (box.min[k] + box.max[k]) / 2;
  const holder = new T.Group();
  holder.name = 'SKU_' + meta.sku;
  holder.quaternion.copy(((o.userData.tdRest as T.Quaternion) ?? o.quaternion).clone().invert());
  holder.add(turn);
  o.add(holder);
  box.translate(turn.position);
  p.extent.copy(box.getSize(new T.Vector3()));
  p.center.copy(box.getCenter(new T.Vector3()));
  p.size = Math.max(p.extent.x, p.extent.y, p.extent.z, 0.1);
  swapped.set(p, { sku: meta.sku, meta, orig });
  rec = swapped.get(p);
  void rec;
}
function unswap(p: Piece) {
  const r = swapped.get(p);
  if (!r) return;
  const o = p.object;
  for (const c of [...o.children]) o.remove(c);
  for (const c of r.orig.children) o.add(c);
  p.extent.copy(r.orig.extent);
  p.center.copy(r.orig.center);
  p.size = r.orig.size;
  swapped.delete(p);
}
function relayout() {
  computeParking();
  if (td.explode > 0) computeExplode();
  td.matDirty = true; // vật liệu của mô hình mới cũng phải theo X-quang, mặt cắt
  emitState();
  td.touch();
}
function skuReset() {
  closePreview();
  for (const p of [...swapped.keys()]) unswap(p);
}

// ------------------------------------------------------------------ xem riêng một mô hình (bung rời được)
let preview: { holder: T.Group; parts: { o: T.Object3D; base: T.Vector3; e: T.Vector3 }[]; meta: ModelMeta } | null = null;
function closePreview() {
  if (!preview) return;
  preview.holder.removeFromParent();
  if (td.model) td.model.root.visible = true;
  preview = null;
  td.explode = td.exNow = 0;
  emit('td:preview', null);
  ctx?.refit();
  td.touch();
}
function tickPreview() {
  if (!preview) return false;
  for (const { o, base, e } of preview.parts) o.position.copy(base).addScaledVector(e, td.exNow * 1.4);
  return td.exNow !== td.explode;
}
function previewLabels() {
  const r = ctx!.host.getBoundingClientRect();
  const items: { concept: string; instance: number; x: number; y: number; status: Status; selected: boolean }[] = [];
  const b = new T.Box3();
  for (const { o } of preview!.parts) {
    b.setFromObject(o).getCenter(proj).project(ctx!.camera);
    if (proj.z > 1 || Math.abs(proj.x) > 1 || Math.abs(proj.y) > 1) continue;
    items.push({ concept: 'part:' + o.name.replace(/_Assembly$/, ''), instance: 0, x: Math.round(r.left + ((proj.x + 1) / 2) * r.width), y: Math.round(r.top + ((1 - proj.y) / 2) * r.height), status: 'seated', selected: false });
  }
  const sig = JSON.stringify(items);
  if (sig === lastFrame) return;
  lastFrame = sig;
  emit('td:frame', items);
}
function fitBox(box: T.Box3, dir: V3, pad: number, minDist: number, targetPosition: T.Vector3, targetLook: T.Vector3, camera: T.PerspectiveCamera) {
  const aspect = camera.aspect,
    fovY = camera.fov,
    W = ctx!.host.clientWidth,
    H = ctx!.host.clientHeight;
  if (W > td.inset.right && H > td.inset.top) camera.aspect = (W - td.inset.right) / (H - td.inset.top);
  if (H > td.inset.top) camera.fov = T.MathUtils.radToDeg(2 * Math.atan(Math.tan(T.MathUtils.degToRad(fovY) / 2) * (1 - td.inset.top / H)));
  fitCameraToBounds(box, camera, targetPosition, targetLook, new T.Vector3(...dir), new T.Vector3(), pad, minDist);
  camera.aspect = aspect;
  camera.fov = fovY;
  return true;
}

Object.assign(td, {
  /** Thư viện mô hình linh kiện (procgen): danh mục SKU, nạp theo SKU. */
  lib,
  swapRules: SWAP,
  /** SKU đang gắn ở một linh kiện trong máy (null: mô hình gốc của PC Anatomy). */
  skuOf(p: Piece) {
    const r = swapped.get(p);
    return r ? { sku: r.sku, meta: r.meta } : null;
  },
  /** Thay linh kiện trong máy bằng mô hình của SKU (null: trả về mô hình gốc). RAM đổi cả bộ. */
  async swapSku(p: Piece, sku: string | null) {
    const rule = SWAP[p.concept];
    if (!rule) throw new Error('Linh kiện này chưa đổi được theo SKU');
    const targets = rule.kit ? td.pieces(p.concept) : [p];
    if (!sku) {
      for (const q of targets) unswap(q);
      relayout();
      return null;
    }
    let first: lib.Loaded | null = null;
    for (const q of targets) {
      const got = await lib.load(sku);
      first ??= got;
      applySwap(q, got.model, got.meta);
    }
    relayout();
    emit('td:sku', { concept: p.concept, sku, meta: first!.meta, from: first!.from });
    return first;
  },
  /** Xem riêng mô hình một SKU giữa sân khấu; thanh "Bung rời" tách các bộ phận theo hướng ghi trong GLB. */
  async previewSku(sku: string | null) {
    if (!sku) return closePreview();
    if (!ctx || !td.model) return;
    const got = await lib.load(sku);
    closePreview();
    const holder = new T.Group();
    holder.name = 'THL_Preview';
    holder.scale.setScalar(1 / UNIT);
    const box = new T.Box3().setFromObject(got.model);
    got.model.position.sub(box.getCenter(new T.Vector3()));
    holder.add(got.model);
    got.model.traverse((m) => {
      if ((m as T.Mesh).isMesh) (m as T.Mesh).castShadow = (m as T.Mesh).receiveShadow = true;
    });
    td.model.root.updateMatrixWorld();
    holder.position.copy(td.outer.getCenter(new T.Vector3())).applyMatrix4(td.model.root.matrixWorld);
    const parts: { o: T.Object3D; base: T.Vector3; e: T.Vector3 }[] = [];
    got.model.traverse((o) => {
      const e = o.userData.explode as V3 | undefined;
      if (e && (e[0] || e[1] || e[2])) parts.push({ o, base: o.position.clone(), e: new T.Vector3(...e) });
    });
    ctx.scene.add(holder);
    td.model.root.visible = false;
    preview = { holder, parts, meta: got.meta };
    td.explode = td.exNow = 0;
    emit('td:preview', { meta: got.meta, from: got.from });
    ctx.refit();
    td.touch();
    return got;
  },
});
