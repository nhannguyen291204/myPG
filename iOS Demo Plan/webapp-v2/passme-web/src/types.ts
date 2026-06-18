// Kiểu dữ liệu dùng chung cho PassME Web.

// 3 vai trò — dùng key ổn định cho logic phân quyền; nhãn hiển thị ở constants.ts
export type Role = "qc" | "supervisor" | "admin";

export type Verdict = "PASS" | "RE-CHECK" | "REJECT";
export type Tamu = "T" | "A" | "M" | "U";

export type Counts = Record<Tamu, number>;

// 1 detection trả về từ backend /detect (khớp app.py)
export type Detection = {
  class: string;
  confidence: number; // 0..1
  bbox: [number, number, number, number]; // x, y, w, h
  area: number;
  area_ratio: number;
  tamu: Tamu;
  action: Verdict;
  color: string; // hex màu theo TAMU
};

export type DetectSummary = {
  verdict: Verdict;
  counts: Counts;
  n_defects: number;
  image_size: { w: number; h: number };
  inference_ms: number;
  total_ms: number;
};

// Toàn bộ phản hồi /detect
export type DetectResponse = {
  summary: DetectSummary;
  detections: Detection[];
  annotated_image: string; // data URL "data:image/jpeg;base64,..."
};

// 1 bản ghi lịch sử (lưu localStorage key passme.inspections)
export type Inspection = {
  id: string;
  createdAt: string; // ISO
  userId: string;
  userName: string;
  verdict: Verdict;
  counts: Counts;
  nDefects: number;
  detections: Detection[];
  annotatedImage: string; // data URL (giai đoạn 1 lưu tạm; giai đoạn 2 -> kho ảnh)
  modelVersion: string; // "best.pt"
  confThreshold: number; // 0.25
  inferenceMs: number; // tiện hiển thị lại ở Chi tiết
  imageSize: { w: number; h: number };
};

// Tài khoản (mock — giai đoạn 1)
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

// Model tùy chỉnh — đợt này train MÔ PHỎNG ở frontend (localStorage), backend nối sau.
export type ModelStatus = "queued" | "running" | "done" | "failed";
export type ModelJob = {
  id: string;
  name: string;
  epochs: number;
  baseModel: string;
  datasetName: string; // tên file zip
  datasetSize: number; // bytes
  status: ModelStatus;
  progress: number; // 0..100
  map50?: number; // chỉ số sau khi xong (mô phỏng)
  durationSec?: number; // thời lượng train (mô phỏng)
  createdAt: string; // ISO
};
