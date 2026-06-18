import type { DetectResponse } from "../types";

// Đọc IP backend từ biến môi trường (.env), KHÔNG hardcode trong code.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://192.168.100.7:8000";
const DETECT_TIMEOUT_MS = 30000;
const HEALTH_TIMEOUT_MS = 8000;

export function backendUrl(): string {
  return BACKEND_URL;
}

export type ApiErrorKind = "network" | "server" | "timeout" | "backend";

// Lỗi gọi API có phân loại — UI hiển thị thông báo tiếng Việt theo kind.
export class ApiError extends Error {
  kind: ApiErrorKind;
  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
  }
}

// POST /detect — gửi 1 ảnh, nhận verdict + detections + ảnh annotate.
// Kế thừa logic xử lý lỗi của App.tsx cũ: timeout 30s, phân biệt mạng/server/backend.
export async function detect(file: Blob, filename = "photo.jpg"): Promise<DetectResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DETECT_TIMEOUT_MS);
  try {
    const form = new FormData();
    form.append("file", file, filename);
    const res = await fetch(`${BACKEND_URL}/detect`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);

    // Backend tự báo lỗi (vd decode ảnh): { "error": "..." }
    if (data && typeof data === "object" && "error" in data && data.error) {
      throw new ApiError("backend", String(data.error));
    }
    if (!res.ok) {
      throw new ApiError("server", `Backend trả về mã ${res.status}`);
    }
    return data as DetectResponse;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const err = e as { name?: string; message?: string };
    if (err?.name === "AbortError") {
      throw new ApiError(
        "timeout",
        "Quá 30 giây không có phản hồi — backend có thể đang bận hoặc chưa chạy.",
      );
    }
    // Lỗi mạng: fetch ném TypeError ("Failed to fetch" / Safari "Load failed").
    const msg = String(err?.message ?? e);
    const isNetwork =
      err?.name === "TypeError" ||
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("Load failed");
    if (isNetwork) {
      throw new ApiError(
        "network",
        "Không kết nối được backend. Kiểm tra điện thoại và Mac cùng Wi-Fi, và VITE_BACKEND_URL đúng IP.",
      );
    }
    throw new ApiError("server", msg);
  } finally {
    clearTimeout(timer);
  }
}

export type HealthResult = { ok: boolean; model?: string; error?: string };

// GET /health — kiểm tra backend sống + model đang load.
export async function checkHealth(): Promise<HealthResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: controller.signal });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: data?.status === "ok", model: data?.model };
  } catch (e) {
    const err = e as { name?: string };
    return { ok: false, error: err?.name === "AbortError" ? "Timeout" : "Không kết nối" };
  } finally {
    clearTimeout(timer);
  }
}
