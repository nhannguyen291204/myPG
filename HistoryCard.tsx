import type { Inspection } from "../types";
import VerdictBadge from "./VerdictBadge";
import { timeLabel, defectSummary } from "../lib/format";

type Props = { item: Inspection; onClick: () => void };

export default function HistoryCard({ item, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white p-3 text-left active:bg-surface"
    >
      <img
        src={item.annotatedImage}
        alt=""
        className="h-14 w-14 shrink-0 rounded-lg bg-surface object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{timeLabel(item.createdAt)}</span>
          <span>·</span>
          <span className="truncate">{item.userName}</span>
        </div>
        <div className="mt-0.5 truncate text-sm text-gray-800">{defectSummary(item)}</div>
      </div>
      <VerdictBadge verdict={item.verdict} />
    </button>
  );
}
