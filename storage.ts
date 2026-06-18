import type { Inspection, Role, User } from "../types";
import { DEFAULT_THRESHOLD } from "../constants";
import { supabase, INSPECTIONS_BUCKET } from "./supabase";

const K_THRESHOLD = "passme.threshold";
const SIGNED_URL_TTL = 3600; // giây — đủ cho 1 phiên xem

// ---- Map hàng DB (snake_case) <-> Inspection (camelCase trong app) ----
type InspectionRow = {
  id: string;
  user_id: string;
  user_name: string;
  created_at: string;
  verdict: Inspection["verdict"];
  counts: Inspection["counts"];
  n_defects: number;
  detections: Inspection["detections"];
  model_version: string;
  conf_threshold: number;
  inference_ms: number | null;
  image_w: number | null;
  image_h: number | null;
  annotated_path: string | null;
};

// annotatedImage: ở DB là đường dẫn; khi đọc ta gắn signed URL để <img> hiển thị được.
function rowToInspection(r: InspectionRow, annotatedImage: string): Inspection {
  return {
    id: r.id,
    createdAt: r.created_at,
    userId: r.user_id,
    userName: r.user_name,
    verdict: r.verdict,
    counts: r.counts,
    nDefects: r.n_defects,
    detections: r.detections ?? [],
    annotatedImage,
    modelVersion: r.model_version,
    confThreshold: Number(r.conf_threshold),
    inferenceMs: Number(r.inference_ms ?? 0),
    imageSize: { w: r.image_w ?? 0, h: r.image_h ?? 0 },
  };
}

// Data URL base64 -> Blob để upload (KHÔNG nhét base64 vào DB).
function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const head = dataUrl.slice(0, comma);
  const b64 = dataUrl.slice(comma + 1);
  const mime = /data:(.*?);base64/.exec(head)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// ---- Inspections (RLS tự lọc theo vai trò: QC chỉ thấy của mình) ----
export async function loadInspections(): Promise<Inspection[]> {
  const { data, error } = await supabase
    .from("inspections")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as InspectionRow[];

  // Ký signed URL hàng loạt cho thumbnail (1 lần gọi cho cả danh sách).
  const paths = rows.map((r) => r.annotated_path).filter((p): p is string => !!p);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data: urls } = await supabase.storage
      .from(INSPECTIONS_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);
    (urls ?? []).forEach((u) => {
      if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
    });
  }
  return rows.map((r) =>
    rowToInspection(r, r.annotated_path ? (signed.get(r.annotated_path) ?? "") : ""),
  );
}

export async function getInspection(id: string): Promise<Inspection | undefined> {
  const { data, error } = await supabase.from("inspections").select("*").eq("id", id).single();
  if (error || !data) return undefined; // không tồn tại hoặc RLS chặn (không có quyền)
  const r = data as InspectionRow;
  let url = "";
  if (r.annotated_path) {
    const { data: signed } = await supabase.storage
      .from(INSPECTIONS_BUCKET)
      .createSignedUrl(r.annotated_path, SIGNED_URL_TTL);
    url = signed?.signedUrl ?? "";
  }
  return rowToInspection(r, url);
}

export async function saveInspection(item: Inspection): Promise<void> {
  // 1) Upload ảnh annotate lên bucket private, đường dẫn {user_id}/{id}.jpg
  const path = `${item.userId}/${item.id}.jpg`;
  const blob = dataUrlToBlob(item.annotatedImage);
  const { error: upErr } = await supabase.storage
    .from(INSPECTIONS_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (upErr) throw upErr;

  // 2) Insert hàng inspections — chỉ lưu annotated_path (không base64)
  const { error: insErr } = await supabase.from("inspections").insert({
    id: item.id,
    user_id: item.userId,
    user_name: item.userName,
    verdict: item.verdict,
    counts: item.counts,
    n_defects: item.nDefects,
    detections: item.detections,
    model_version: item.modelVersion,
    conf_threshold: item.confThreshold,
    inference_ms: item.inferenceMs,
    image_w: item.imageSize.w,
    image_h: item.imageSize.h,
    annotated_path: path,
  });
  if (insErr) {
    // Rollback ảnh đã upload để khỏi rác trong bucket.
    try {
      await supabase.storage.from(INSPECTIONS_BUCKET).remove([path]);
    } catch {
      /* bỏ qua lỗi rollback */
    }
    throw insErr;
  }
}

// ---- Users (bảng profiles). profiles KHÔNG lưu email (email ở auth.users) ----
type ProfileRow = { id: string; full_name: string; role: Role; active: boolean };

export async function loadUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, active")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as ProfileRow[]).map((p) => ({
    id: p.id,
    name: p.full_name || "(chưa đặt tên)",
    email: "", // profiles không có email; chỉ hiển thị tên trong Quản lý người dùng
    role: p.role,
    active: p.active,
  }));
}

// Cập nhật profiles — RLS (profiles_update_admin) chỉ cho Admin; người khác update 0 hàng.
export async function updateUserRole(id: string, role: Role): Promise<void> {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) throw error;
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("profiles").update({ active }).eq("id", id);
  if (error) throw error;
}

// ---- Ngưỡng tin cậy: GIỮ localStorage (cài đặt theo máy, không lên DB) ----
export function loadThreshold(): number {
  try {
    const raw = localStorage.getItem(K_THRESHOLD);
    return raw ? Number(raw) : DEFAULT_THRESHOLD;
  } catch {
    return DEFAULT_THRESHOLD;
  }
}
export function saveThreshold(v: number): void {
  try {
    localStorage.setItem(K_THRESHOLD, String(v));
  } catch {
    /* bỏ qua */
  }
}
