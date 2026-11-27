/**
 * TinHocLab – Model Library (chạy trong trình duyệt / Electron).
 *
 * Tìm mô hình theo SKU (opendb_id):
 *  1. thư viện dựng sẵn `models/components/manifest.json` – nếu cùng GENERATOR_VERSION và cùng băm thông số;
 *  2. bộ nhớ đệm IndexedDB của máy – GLB đã sinh ở lần trước;
 *  3. chưa có thì gọi bộ sinh → xuất GLB → kiểm tra → lưu IndexedDB → dùng.
 * Mỗi lần mở trang không sinh lại GLB; chỉ sinh khi SKU chưa có hoặc thông số/bộ sinh đã đổi.
 * Đọc file bằng XMLHttpRequest (chạy được cả trên file:// của Electron, nơi fetch không đọc file cục bộ).
 */
import type * as T from 'three';
import { GENERATOR_VERSION, generate, type ModelMeta } from './index.ts';
import { exportGLB, parseGLB, validateGLB } from './glb.ts';
import { CATEGORY_OF, hashRecord, type Rec } from './spec.ts';

type Entry = { sku: string; category: string; file: string; meta: string; productName: string; manufacturer: string; accuracy: string; generatorVersion: string; specHash: string };
export type Item = { sku: string; category: string; opendbCategory: string; productName: string; manufacturer: string; formFactor: string | null; water: boolean; record: Rec; entry: Entry | null };
export type Loaded = { model: T.Group; meta: ModelMeta; from: 'library' | 'cache' | 'generated' };

let base = './models/components/';
export const setLibraryBase = (b: string) => (base = b.endsWith('/') ? b : b + '/');

function xhr<R>(url: string, type: 'arraybuffer' | 'json'): Promise<R> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('GET', url);
    x.responseType = type;
    x.onload = () => ((x.status === 200 || x.status === 0) && x.response ? resolve(x.response as R) : reject(new Error(`${url}: ${x.status}`)));
    x.onerror = () => reject(new Error(`${url}: không đọc được`));
    x.send();
  });
}

let itemsP: Promise<Item[]> | null = null;
/** Danh mục SKU (bản ghi OpenDB đi kèm) và mục thư viện tương ứng nếu có. */
export function items(): Promise<Item[]> {
  itemsP ??= (async () => {
    const [cat, man] = await Promise.all([
      xhr<{ items: { opendbCategory: string; record: Rec }[] }>(base + 'catalog.json', 'json'),
      xhr<{ models: Entry[] }>(base + 'manifest.json', 'json').catch(() => ({ models: [] as Entry[] })),
    ]);
    const bySku = new Map(man.models.map((m) => [m.sku, m]));
    return cat.items.map(({ opendbCategory, record }) => ({
      sku: String(record.opendb_id),
      category: CATEGORY_OF[opendbCategory],
      opendbCategory,
      productName: (record.metadata?.name ?? '').trim(),
      manufacturer: record.metadata?.manufacturer ?? '',
      formFactor: record.form_factor ?? null,
      water: record.water_cooled === true,
      record,
      entry: bySku.get(String(record.opendb_id)) ?? null,
    }));
  })();
  return itemsP;
}

// ---------------------------------------------------------------- IndexedDB
const DB = 'thl-procgen',
  STORE = 'glb';
function db(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
type Cached = { version: string; hash: string; glb: ArrayBuffer; meta: ModelMeta };
async function cacheGet(sku: string): Promise<Cached | null> {
  const d = await db();
  if (!d) return null;
  return new Promise((resolve) => {
    const r = d.transaction(STORE).objectStore(STORE).get(sku);
    r.onsuccess = () => resolve((r.result as Cached) ?? null);
    r.onerror = () => resolve(null);
  });
}
async function cachePut(sku: string, v: Cached) {
  const d = await db();
  if (!d) return;
  await new Promise<void>((resolve) => {
    const t = d.transaction(STORE, 'readwrite');
    t.objectStore(STORE).put(v, sku);
    t.oncomplete = t.onerror = () => resolve();
  });
}

// ---------------------------------------------------------------- tra cứu
const memo = new Map<string, Promise<{ glb: ArrayBuffer; meta: ModelMeta; from: Loaded['from'] }>>();
/** Mô hình của một SKU (mm). Mỗi lần gọi trả một bản sao để gắn vào cảnh độc lập. */
export async function load(sku: string): Promise<Loaded> {
  if (!memo.has(sku)) memo.set(sku, resolveGLB(sku));
  let got;
  try {
    got = await memo.get(sku)!;
  } catch (e) {
    memo.delete(sku);
    throw e;
  }
  return { model: await parseGLB(got.glb), meta: got.meta, from: got.from };
}
async function resolveGLB(sku: string) {
  const it = (await items()).find((x) => x.sku === sku);
  if (!it) throw new Error('SKU không có trong danh mục: ' + sku);
  const hash = hashRecord(it.record);
  const e = it.entry;
  if (e && e.generatorVersion === GENERATOR_VERSION && e.specHash === hash) {
    try {
      const [glb, meta] = await Promise.all([xhr<ArrayBuffer>(base + e.file, 'arraybuffer'), xhr<ModelMeta>(base + e.meta, 'json')]);
      return { glb, meta, from: 'library' as const };
    } catch {
      /* file thiếu: sinh lại bên dưới */
    }
  }
  const c = await cacheGet(sku);
  if (c && c.version === GENERATOR_VERSION && c.hash === hash) return { glb: c.glb, meta: c.meta, from: 'cache' as const };
  const g = generate(it.record, it.opendbCategory);
  const glb = await exportGLB(g.root);
  const check = await validateGLB(glb, g.root);
  if (!check.ok) throw new Error('GLB không đạt kiểm tra: ' + check.problems.join('; '));
  await cachePut(sku, { version: GENERATOR_VERSION, hash, glb, meta: g.meta });
  return { glb, meta: g.meta, from: 'generated' as const };
}
