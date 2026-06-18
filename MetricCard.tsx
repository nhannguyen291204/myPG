import type { ReactNode } from "react";

type Props = { label: string; value: ReactNode; accent?: string; sub?: string };

export default function MetricCard({ label, value, accent, sub }: Props) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div
        className="text-2xl font-medium leading-none"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
      {sub && <div className="text-[11px] text-gray-400">{sub}</div>}
    </div>
  );
}
