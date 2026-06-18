import type { Role, Tamu, Verdict } from "./types";

// Màu verdict + TAMU — dùng inline style để chắc chắn render đúng,
// không phụ thuộc việc Tailwind scan class động.
export const VERDICT_HEX: Record<Verdict, string> = {
  PASS: "#4caf50",
  "RE-CHECK": "#ff9800",
  REJECT: "#e53935",
};

export const TAMU_HEX: Record<Tamu, string> = {
  T: "#9e9e9e",
  A: "#4caf50",
  M: "#ff9800",
  U: "#e53935",
};

// Diễn giải TAMU (tooltip) — khớp ngưỡng diện tích trong app.py
export const TAMU_LABEL: Record<Tamu, string> = {
  T: "Target · ≤1% khung",
  A: "Acceptable · 1–5%",
  M: "Marginal · 5–15%",
  U: "Unacceptable · >15%",
};

// Nhãn vai trò tiếng Việt
export const ROLE_LABELS: Record<Role, string> = {
  qc: "QC (Inspector)",
  supervisor: "Quản lý",
  admin: "Admin",
};

export const MODEL_VERSION = "best.pt";
export const DEFAULT_THRESHOLD = 0.25;
