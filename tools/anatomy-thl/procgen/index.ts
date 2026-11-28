/**
 * TinHocLab – Procedural 3D Model Generator.
 *
 * BuildCores JSON → SKU Parser → Dimension Parser (spec.ts) → Component Geometry Generator (gen/*.ts)
 * → Material Generator (kit.ts: palette PBR) → GLB Exporter (glb.ts) → Model Library (library.ts / cli.ts).
 *
 * Đổi cách dựng của bất kỳ bộ sinh nào thì tăng GENERATOR_VERSION: mọi mô hình trong thư viện và bộ nhớ đệm
 * sẽ được sinh lại. Đổi thông số SKU thì băm Spec đổi, chỉ SKU đó được sinh lại.
 */
import * as T from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { accuracyOf, parseSpec, type Category, type Rec, type Spec } from './spec.ts';
import { generateRAM } from './gen/ram.ts';
import { generateSSD } from './gen/ssd.ts';
import { generateCPU } from './gen/cpu.ts';
import { generateGPU } from './gen/gpu.ts';
import { generateMotherboard } from './gen/motherboard.ts';
import { generatePSU } from './gen/psu.ts';
import { generateCase } from './gen/case.ts';
import { generateCooler } from './gen/cooler.ts';

export const GENERATOR_VERSION = '1.0.0';
export const GENERATORS: Record<Category, (spec: Spec) => T.Group> = {
  ram: generateRAM,
  ssd: generateSSD,
  cpu: generateCPU,
  gpu: generateGPU,
  motherboard: generateMotherboard,
  psu: generatePSU,
  case: generateCase,
  cooler: generateCooler,
};

export type ModelMeta = {
  sku: string;
  category: Category;
  opendbCategory: string;
  manufacturer: string;
  productName: string;
  partNumbers: string[];
  /** Hộp bao thực của mô hình đã dựng (mm, theo trục X/Y/Z của mô hình). */
  dimensions: { x: number; y: number; z: number; unit: 'mm' };
  /** Từng kích thước bộ sinh dùng, kèm nguồn. */
  specDimensions: Spec['dims'];
  features: Spec['features'];
  modelSource: string;
  accuracy: 'exact' | 'dimension-based' | 'approximate';
  estimates: { key: string; value: unknown; rule: string }[];
  generatorVersion: string;
  generatedDate: string;
  specHash: string;
  meshes: string[];
  license: string;
};

/**
 * glTF không bắt buộc tên duy nhất nhưng GLTFLoader đổi tên nút trùng (thêm _1). Bộ phận (Group) trùng tên với
 * mesh bên trong được thêm hậu tố "_Assembly" để tên mesh giữ nguyên sau khi xuất/nhập.
 */
function uniqueNames(root: T.Object3D) {
  const seen = new Map<string, number>();
  const meshes: T.Object3D[] = [],
    groups: T.Object3D[] = [];
  root.traverse((o) => ((o as T.Mesh).isMesh ? meshes : groups).push(o));
  for (const o of [...meshes, ...groups]) {
    let n = o.name || 'Node';
    if (seen.has(n)) n = (o as T.Mesh).isMesh ? `${n}_${seen.get(n)! + 1}` : `${n}_Assembly`;
    seen.set(o.name || 'Node', (seen.get(o.name || 'Node') ?? 0) + 1);
    o.name = n;
  }
}
/** Không có texture nên bỏ toạ độ UV; gộp đỉnh trùng để file nhẹ. */
function stripForExport(root: T.Object3D) {
  root.traverse((o) => {
    const m = o as T.Mesh;
    if (!m.isMesh) return;
    if (m.geometry.attributes.uv) m.geometry.deleteAttribute('uv');
    if (!m.geometry.index) m.geometry = mergeVertices(m.geometry, 1e-4);
  });
}

/** Sinh mô hình (mm) và metadata từ một bản ghi OpenDB. */
export function generate(record: Rec, opendbCategory: string, now = new Date()) {
  const spec = parseSpec(record, opendbCategory);
  const root = GENERATORS[spec.category](spec);
  root.name = `${spec.category.toUpperCase()}_${spec.sku}`;
  uniqueNames(root);
  stripForExport(root);
  root.updateMatrixWorld(true);
  const size = new T.Box3().setFromObject(root).getSize(new T.Vector3());
  const meshes: string[] = [];
  root.traverse((o) => (o as T.Mesh).isMesh && meshes.push(o.name));
  const estimates = [
    ...Object.entries(spec.dims).filter(([, d]) => d.source === 'estimate').map(([key, d]) => ({ key, value: d.value, rule: d.ref })),
    ...Object.entries(spec.features).filter(([, f]) => f.source === 'estimate').map(([key, f]) => ({ key, value: f.value, rule: f.ref })),
  ];
  const meta: ModelMeta = {
    sku: spec.sku,
    category: spec.category,
    opendbCategory,
    manufacturer: spec.manufacturer,
    productName: spec.name,
    partNumbers: spec.partNumbers,
    dimensions: { x: +size.x.toFixed(2), y: +size.y.toFixed(2), z: +size.z.toFixed(2), unit: 'mm' },
    specDimensions: spec.dims,
    features: spec.features,
    modelSource: 'procedural: TinHocLab procgen từ BuildCores OpenDB (CC BY-NC-SA 4.0)',
    accuracy: accuracyOf(spec),
    estimates,
    generatorVersion: GENERATOR_VERSION,
    generatedDate: now.toISOString(),
    specHash: spec.hash,
    meshes,
    license: 'Dữ liệu: BuildCores OpenDB, CC BY-NC-SA 4.0. Mô hình: sinh tự động bởi TinHocLab.',
  };
  // gắn metadata vào gốc: GLTFExporter ghi userData thành "extras" của node
  root.userData.tinhoclab = { sku: meta.sku, category: meta.category, accuracy: meta.accuracy, generatorVersion: meta.generatorVersion, specHash: meta.specHash, productName: meta.productName };
  return { root, meta, spec };
}
