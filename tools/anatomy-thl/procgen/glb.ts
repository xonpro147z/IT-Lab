/**
 * TinHocLab – GLB Exporter (Teardown không có chức năng xuất GLB; phần này viết mới trên three.js GLTFExporter).
 *
 * Giữ nguyên cây đối tượng, tên mesh, vật liệu PBR (metallic-roughness, emissive), kích thước. glTF dùng mét,
 * nên gốc được thu 0.001 lần (mm → m) lúc xuất; khi nạp, nhân lại 1000 là ra mm.
 * Sau khi xuất, đọc lại file bằng GLTFLoader và so: tên mọi mesh, kích thước hộp bao (sai số ≤ 0.05 mm).
 */
import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const MM_PER_M = 1000;

export async function exportGLB(root: T.Object3D): Promise<ArrayBuffer> {
  // bọc trong một nút "mm→m" để chính các nút của mô hình giữ nguyên toạ độ mm
  const wrap = new T.Group();
  wrap.name = 'TinHocLab_Model_m';
  wrap.scale.setScalar(1 / MM_PER_M);
  const parent = root.parent;
  wrap.add(root);
  try {
    const out = await new GLTFExporter().parseAsync(wrap, { binary: true, onlyVisible: false, trs: true });
    return out as ArrayBuffer;
  } finally {
    if (parent) parent.add(root);
    else wrap.remove(root);
  }
}

/** Đọc GLB → nhóm theo mm (bỏ nút mm→m). */
export async function parseGLB(buf: ArrayBuffer): Promise<T.Group> {
  const gltf = await new GLTFLoader().parseAsync(buf, '');
  const scene = gltf.scene;
  const wrap = scene.getObjectByName('TinHocLab_Model_m') ?? scene;
  const model = (wrap.children[0] ?? wrap) as T.Group;
  model.removeFromParent();
  model.updateMatrixWorld(true);
  return model;
}

/** Đọc phần đầu GLB: magic, phiên bản, độ dài, JSON chunk. */
export function inspectGLB(buf: ArrayBuffer) {
  const dv = new DataView(buf);
  const magic = dv.getUint32(0, true);
  const version = dv.getUint32(4, true);
  const length = dv.getUint32(8, true);
  const jsonLen = dv.getUint32(12, true);
  const jsonType = dv.getUint32(16, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
  return { ok: magic === 0x46546c67 && version === 2 && length === buf.byteLength && jsonType === 0x4e4f534a, version, length, json };
}

export type Check = { ok: boolean; problems: string[]; bytes: number; meshes: number; materials: number; size: [number, number, number] };
/** Kiểm tra file GLB vừa xuất so với mô hình gốc. */
export async function validateGLB(buf: ArrayBuffer, original: T.Object3D): Promise<Check> {
  const problems: string[] = [];
  const head = inspectGLB(buf);
  if (!head.ok) problems.push('Phần đầu GLB không hợp lệ');
  const back = await parseGLB(buf);
  const names = (o: T.Object3D) => {
    const n: string[] = [];
    o.traverse((x) => (x as T.Mesh).isMesh && n.push(x.name));
    return n.sort();
  };
  const a = names(original),
    b = names(back);
  if (a.join('|') !== b.join('|')) problems.push(`Tên mesh khác nhau (${a.length} → ${b.length})`);
  original.updateMatrixWorld(true);
  const sa = new T.Box3().setFromObject(original).getSize(new T.Vector3());
  const sb = new T.Box3().setFromObject(back).getSize(new T.Vector3());
  if (sa.distanceTo(sb) > 0.05) problems.push(`Kích thước lệch: ${sa.toArray().map((v) => v.toFixed(2))} → ${sb.toArray().map((v) => v.toFixed(2))} mm`);
  const mats = new Set<string>();
  back.traverse((x) => {
    const m = (x as T.Mesh).material;
    if (m) for (const one of [m].flat()) {
      mats.add(one.name);
      if (!(one as T.MeshStandardMaterial).isMeshStandardMaterial) problems.push(`Vật liệu không phải PBR: ${one.name}`);
    }
  });
  return { ok: !problems.length, problems, bytes: buf.byteLength, meshes: b.length, materials: mats.size, size: sb.toArray() as [number, number, number] };
}
