import type { Verdict } from "../types";
import { VERDICT_HEX } from "../constants";

type Props = { verdict: Verdict; size?: "sm" | "lg" };

export default function VerdictBadge({ verdict, size = "sm" }: Props) {
  const cls = size === "lg" ? "px-7 py-2.5 text-xl tracking-wide" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-block rounded-full font-medium text-white ${cls}`}
      style={{ backgroundColor: VERDICT_HEX[verdict] }}
    >
      {verdict}
    </span>
  );
}
