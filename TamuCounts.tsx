import type { Counts, Tamu } from "../types";
import { TAMU_HEX, TAMU_LABEL } from "../constants";

const ORDER: Tamu[] = ["T", "A", "M", "U"];

export default function TamuCounts({ counts }: { counts: Counts }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ORDER.map((k) => (
        <div
          key={k}
          className="flex flex-col items-center rounded-lg border border-line bg-surface py-2.5"
          title={TAMU_LABEL[k]}
        >
          <span className="text-lg font-medium leading-none" style={{ color: TAMU_HEX[k] }}>
            {k}
          </span>
          <span className="mt-1 text-base font-medium text-gray-800">{counts[k] ?? 0}</span>
        </div>
      ))}
    </div>
  );
}
