import type { Inspection } from "../types";

// Sinh UUID v4. LƯU Ý: crypto.randomUUID() chỉ chạy trong secure context (HTTPS/localhost),
// KHÔNG chạy trên http LAN (vd http://192.168.100.23:5173). crypto.getRandomValues KHÔNG
// bị giới hạn đó -> dùng nó dựng UUID v4; chót cùng fallback Math.random.
// (Cột id trên Supabase kiểu uuid -> bắt buộc đúng định dạng UUID, không dùng id tuỳ ý.)
export function genId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40; // version 4
      b[8] = (b[8] & 0x3f) | 0x80; // variant 10
      const h: string[] = [];
      for (let i = 0; i < 16; i++) h.push(b[i].toString(16).padStart(2, "0"));
      return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
    }
  } catch {
    /* rơi xuống fallback */
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// "Hôm nay" / "Hôm qua" / dd/MM/yyyy
export function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return "Hôm nay";
  if (sameDay(d, yesterday)) return "Hôm qua";
  return d.toLocaleDateString("vi-VN");
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// Nhóm danh sách theo nhãn ngày (giữ thứ tự mới -> cũ của input)
export function groupByDate(items: Inspection[]): { label: string; items: Inspection[] }[] {
  const groups: { label: string; items: Inspection[] }[] = [];
  for (const it of items) {
    const label = dateLabel(it.createdAt);
    let g = groups.find((x) => x.label === label);
    if (!g) {
      g = { label, items: [] };
      groups.push(g);
    }
    g.items.push(it);
  }
  return groups;
}

// Tóm tắt lỗi cho card lịch sử
export function defectSummary(it: Inspection): string {
  if (it.nDefects === 0) return "Không phát hiện lỗi";
  const parts: string[] = [];
  (["U", "M", "A", "T"] as const).forEach((k) => {
    if (it.counts[k] > 0) parts.push(`${k}:${it.counts[k]}`);
  });
  return `${it.nDefects} lỗi · ${parts.join(" ")}`;
}
