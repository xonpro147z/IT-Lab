/**
 * TinHocLab – dựng thư viện mô hình linh kiện từ OpenDB (chạy bằng Node 22+):
 *
 *   node --experimental-strip-types lib/thl/procgen/cli.ts <thư mục OpenDB> <thư mục thư viện> [--force]
 *
 * <thư mục OpenDB>: các thư mục con theo nhóm OpenDB (RAM, GPU, PCCase…) chứa <opendb_id>.json.
 * <thư mục thư viện>: ghi <nhóm>/<sku>.glb + <nhóm>/<sku>.json (metadata), manifest.json, catalog.json.
 * Có bộ nhớ đệm: SKU nào đã có GLB cùng GENERATOR_VERSION và cùng băm thông số thì bỏ qua (trừ khi --force).
 * Mỗi GLB vừa xuất được đọc lại và kiểm tra (tên mesh, kích thước, vật liệu PBR); lỗi thì dừng với mã 1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { GENERATOR_VERSION, generate, type ModelMeta } from './index.ts';
import { exportGLB, validateGLB } from './glb.ts';
import { CATEGORY_OF, hashRecord } from './spec.ts';

// GLTFExporter dùng FileReader của trình duyệt; Node 22 có Blob nhưng không có FileReader
const G = globalThis as Record<string, unknown>;
if (!G.FileReader)
  G.FileReader = class {
    result: ArrayBuffer | string | null = null;
    onload: (() => void) | null = null;
    onloadend: (() => void) | null = null;
    readAsArrayBuffer(b: Blob) {
      b.arrayBuffer().then((buf) => {
        this.result = buf;
        this.onload?.();
        this.onloadend?.();
      });
    }
    readAsDataURL(b: Blob) {
      b.arrayBuffer().then((buf) => {
        this.result = 'data:application/octet-stream;base64,' + Buffer.from(buf).toString('base64');
        this.onload?.();
        this.onloadend?.();
      });
    }
  };

const [src, out] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const force = process.argv.includes('--force');
if (!src || !out) {
  console.error('Cách dùng: cli.ts <thư mục OpenDB> <thư mục thư viện> [--force]');
  process.exit(2);
}
const FOLDER: Record<string, string> = { ram: 'ram', ssd: 'ssd', cpu: 'cpu', gpu: 'gpu', motherboard: 'motherboard', psu: 'psu', case: 'case', cooler: 'cooler' };

type Entry = { sku: string; category: string; file: string; meta: string; productName: string; manufacturer: string; accuracy: string; generatorVersion: string; specHash: string; bytes: number };
const manifest: { generatorVersion: string; generatedDate: string; models: Entry[] } = { generatorVersion: GENERATOR_VERSION, generatedDate: new Date().toISOString(), models: [] };
const catalog: { opendbCategory: string; record: unknown }[] = [];
let built = 0,
  cached = 0,
  failed = 0;

for (const cat of Object.keys(CATEGORY_OF)) {
  const dir = path.join(src, cat);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const record = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    catalog.push({ opendbCategory: cat, record });
    const sku = String(record.opendb_id);
    const folder = FOLDER[CATEGORY_OF[cat]];
    const glbRel = `${folder}/${sku}.glb`,
      metaRel = `${folder}/${sku}.json`;
    const glbPath = path.join(out, glbRel),
      metaPath = path.join(out, metaRel);
    const hash = hashRecord(record);
    let meta: ModelMeta | null = null;
    if (!force && fs.existsSync(glbPath) && fs.existsSync(metaPath)) {
      const old = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as ModelMeta;
      if (old.generatorVersion === GENERATOR_VERSION && old.specHash === hash) {
        meta = old;
        cached++;
      }
    }
    if (!meta) {
      const g = generate(record, cat);
      const buf = await exportGLB(g.root);
      const check = await validateGLB(buf, g.root);
      if (!check.ok) {
        console.error(`✗ ${cat}/${sku} ${g.meta.productName}: ${check.problems.join('; ')}`);
        failed++;
        continue;
      }
      fs.mkdirSync(path.dirname(glbPath), { recursive: true });
      fs.writeFileSync(glbPath, Buffer.from(buf));
      meta = g.meta;
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
      built++;
      console.log(`✓ ${glbRel}  ${(buf.byteLength / 1024).toFixed(0)} KB  ${check.meshes} mesh  ${check.size.map((v) => v.toFixed(1)).join(' × ')} mm  [${meta.accuracy}]  ${meta.productName}`);
    }
    manifest.models.push({ sku, category: meta.category, file: glbRel, meta: metaRel, productName: meta.productName, manufacturer: meta.manufacturer, accuracy: meta.accuracy, generatorVersion: meta.generatorVersion, specHash: meta.specHash, bytes: fs.statSync(glbPath).size });
  }
}
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(out, 'catalog.json'), JSON.stringify({ source: 'BuildCores OpenDB (CC BY-NC-SA 4.0) – https://github.com/buildcores/buildcores-open-db', items: catalog }));
console.log(`Thư viện: ${manifest.models.length} mô hình (${built} sinh mới, ${cached} lấy từ bộ nhớ đệm, ${failed} lỗi) → ${out}`);
if (failed) process.exit(1);
