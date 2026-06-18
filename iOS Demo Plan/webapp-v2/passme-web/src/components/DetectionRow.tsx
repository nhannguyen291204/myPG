import type { Detection } from "../types";

export default function DetectionRow({ d }: { d: Detection }) {
  return (
    <div
      className="flex items-center justify-between rounded-md border-l-4 bg-surface px-3 py-2"
      style={{ borderLeftColor: d.color }}
    >
      <span className="text-sm text-gray-800">
        <span className="font-medium">{d.class}</span> · {d.tamu} · {d.action}
      </span>
      <span className="text-sm text-gray-500">{Math.round(d.confidence * 100)}%</span>
    </div>
  );
}
