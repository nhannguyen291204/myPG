import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, LoaderCircle, TriangleAlert } from "lucide-react";
import Header from "../components/Header";
import HistoryCard from "../components/HistoryCard";
import { useAuth } from "../lib/auth";
import { loadInspections } from "../lib/storage";
import { canSeeTeam } from "../lib/permissions";
import { groupByDate } from "../lib/format";
import type { Inspection, Verdict } from "../types";

type Filter = "ALL" | Verdict;
const FILTERS: Filter[] = ["ALL", "PASS", "RE-CHECK", "REJECT"];
const FILTER_LABEL: Record<Filter, string> = {
  ALL: "Tất cả",
  PASS: "PASS",
  "RE-CHECK": "RE-CHECK",
  REJECT: "REJECT",
};

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [items, setItems] = useState<Inspection[] | null>(null); // null = đang tải
  const [error, setError] = useState<string | null>(null);

  // RLS ở Supabase tự lọc: QC chỉ nhận bản ghi của mình, supervisor/admin nhận cả team.
  useEffect(() => {
    let alive = true;
    loadInspections()
      .then((list) => {
        if (alive) setItems(list);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Không tải được lịch sử.");
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () => (items ?? []).filter((x) => filter === "ALL" || x.verdict === filter),
    [items, filter],
  );
  const groups = groupByDate(filtered);

  return (
    <div>
      <Header title="Lịch sử" subtitle={user && canSeeTeam(user.role) ? "Cả team" : "Của tôi"} />
      <div className="p-4 lg:mx-auto lg:max-w-6xl lg:p-6">
        {/* Lọc theo verdict */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                filter === f
                  ? "border-navy-600 bg-navy-600 text-white"
                  : "border-line bg-white text-gray-500"
              }`}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>

        {items === null ? (
          <div className="mt-16 flex justify-center">
            <LoaderCircle className="animate-spin text-navy-600" size={28} />
          </div>
        ) : error ? (
          <div className="mt-16 flex flex-col items-center gap-2 text-center text-reject">
            <TriangleAlert size={36} />
            <p className="text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-2 text-center text-gray-400">
            <Inbox size={40} />
            <p className="text-sm">Chưa có bản ghi. Hãy kiểm tra một sản phẩm và bấm Lưu.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((g) => (
              <div key={g.label}>
                <h2 className="mb-2 text-xs font-medium text-gray-400">{g.label}</h2>
                <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
                  {g.items.map((it) => (
                    <HistoryCard
                      key={it.id}
                      item={it}
                      onClick={() => navigate(`/history/${it.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
