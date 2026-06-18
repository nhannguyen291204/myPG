import type { ModelJob } from "../types";
import { genId } from "./format";

// ====================================================================
// LỚP MÔ PHỎNG TRAIN MODEL (frontend-first). Dữ liệu lưu localStorage.
//
// TODO Giai đoạn sau — thay phần mô phỏng bằng luồng THẬT:
//   1) Upload file .zip dataset (đã gán nhãn, YOLO format) lên backend (multipart).
//   2) Backend train YOLO trên máy local (KHÔNG train trong trình duyệt).
//   3) Frontend POLL trạng thái train + tiến trình từ backend.
//   4) Train xong: backend trả model + mAP -> lưu lại, cho chọn dùng ở màn Kiểm tra.
// ====================================================================

const K_MODELS = "passme.models";
const K_ACTIVE = "passme.activeModel"; // "global" (mặc định) hoặc modelId của model đã train

function read(): ModelJob[] {
  try {
    const raw = localStorage.getItem(K_MODELS);
    return raw ? (JSON.parse(raw) as ModelJob[]) : [];
  } catch {
    return [];
  }
}

function write(list: ModelJob[]): void {
  try {
    localStorage.setItem(K_MODELS, JSON.stringify(list));
  } catch (e) {
    console.warn("[training] không ghi được passme.models", e);
  }
}

export type TrainOpts = { name: string; epochs: number; baseModel: string };

// Tạo 1 job train mới (trạng thái queued). Trả modelId.
// (Đợt này: chỉ tạo bản ghi; tiến trình do UI tick qua advanceJobs — xem TODO trên.)
export function startTraining(file: File, opts: TrainOpts): string {
  const job: ModelJob = {
    id: genId(),
    name: opts.name.trim(),
    epochs: opts.epochs,
    baseModel: opts.baseModel,
    datasetName: file.name,
    datasetSize: file.size,
    status: "queued",
    progress: 0,
    createdAt: new Date().toISOString(),
  };
  const list = read();
  list.unshift(job); // mới nhất lên đầu
  write(list);
  return job.id;
}

export function listModels(): ModelJob[] {
  return read();
}

// Mô phỏng 1 bước tiến trình: queued -> running -> done (gán mAP + thời lượng).
// (Sẽ bị thay bằng poll trạng thái thật từ backend.)
export function advanceJobs(list: ModelJob[]): ModelJob[] {
  let changed = false;
  const next = list.map((j) => {
    if (j.status === "queued") {
      changed = true;
      return { ...j, status: "running" as const, progress: Math.max(j.progress, 4) };
    }
    if (j.status === "running") {
      changed = true;
      const p = Math.min(100, j.progress + 6 + Math.floor(Math.random() * 12));
      if (p >= 100) {
        const map50 = Math.round((0.6 + Math.random() * 0.3) * 1000) / 1000; // ~0.6–0.9
        const durationSec = Math.max(
          1,
          Math.round((Date.now() - new Date(j.createdAt).getTime()) / 1000),
        );
        return { ...j, status: "done" as const, progress: 100, map50, durationSec };
      }
      return { ...j, progress: p };
    }
    return j;
  });
  if (changed) write(next);
  return next;
}

// ---- Lựa chọn model đang dùng cho màn Kiểm tra (gồm Global) ----
// Lưu ở passme.activeModel: "global" hoặc modelId. Không còn dùng cờ active trên từng job.
export type ActiveSelection = { type: "global" } | { type: "model"; model: ModelJob };

export function getActiveSelection(): ActiveSelection {
  let sel: string | null = null;
  try {
    sel = localStorage.getItem(K_ACTIVE);
  } catch {
    /* bỏ qua */
  }
  if (sel && sel !== "global") {
    // Chỉ chấp nhận model đã train xong; nếu không còn/không hợp lệ -> về Global.
    const m = read().find((j) => j.id === sel && j.status === "done");
    if (m) return { type: "model", model: m };
  }
  return { type: "global" };
}

export function setActiveSelection(sel: "global" | string): void {
  try {
    localStorage.setItem(K_ACTIVE, sel);
  } catch {
    /* bỏ qua */
  }
}
