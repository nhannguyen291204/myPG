import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LoaderCircle } from "lucide-react";
import Header from "../components/Header";
import MetricCard from "../components/MetricCard";
import { useAuth } from "../lib/auth";
import { loadInspections } from "../lib/storage";
import { canSeeTeam } from "../lib/permissions";
import { sameDay } from "../lib/format";
import { VERDICT_HEX } from "../constants";
import type { Inspection } from "../types";

export default function Stats() {
  const { user } = useAuth();
  const [items, setItems] = useState<Inspection[] | null>(null); // null = đang tải

  // RLS tự lọc theo vai trò.
  useEffect(() => {
    let alive = true;
    loadInspections()
      .then((l) => {
        if (alive) setItems(l);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const data = useMemo(() => {
    const scoped = items ?? [];
    const today = new Date();
    const todayCount = scoped.filter((x) => sameDay(new Date(x.createdAt), today)).length;
    const total = scoped.length;
    const countOf = (v: string) => scoped.filter((x) => x.verdict === v).length;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

    const days: { day: string; PASS: number; REJECT: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const inDay = scoped.filter((x) => sameDay(new Date(x.createdAt), d));
      days.push({
        day: d.toLocaleDateString("vi-VN", { weekday: "short" }),
        PASS: inDay.filter((x) => x.verdict === "PASS").length,
        REJECT: inDay.filter((x) => x.verdict === "REJECT").length,
      });
    }
    return {
      total,
      todayCount,
      pass: pct(countOf("PASS")),
      recheck: pct(countOf("RE-CHECK")),
      reject: pct(countOf("REJECT")),
      days,
    };
  }, [items]);

  return (
    <div>
      <Header title="Thống kê" subtitle={user && canSeeTeam(user.role) ? "Cả team" : "Của tôi"} />
      <div className="p-4 lg:mx-auto lg:max-w-5xl lg:p-6">
        {items === null ? (
          <div className="mt-16 flex justify-center">
            <LoaderCircle className="animate-spin text-navy-600" size={28} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard label="Lượt kiểm hôm nay" value={data.todayCount} />
              <MetricCard label="Tỷ lệ PASS" value={`${data.pass}%`} accent={VERDICT_HEX.PASS} />
              <MetricCard
                label="Tỷ lệ RE-CHECK"
                value={`${data.recheck}%`}
                accent={VERDICT_HEX["RE-CHECK"]}
              />
              <MetricCard label="Tỷ lệ REJECT" value={`${data.reject}%`} accent={VERDICT_HEX.REJECT} />
            </div>

            <div className="mt-5 rounded-xl border border-line bg-white p-3">
              <h2 className="mb-3 text-sm font-medium text-gray-600">7 ngày gần nhất</h2>
              {data.total === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">Chưa có dữ liệu để vẽ biểu đồ.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.days} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e8ee" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#5a6b8c" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#5a6b8c" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="PASS" fill={VERDICT_HEX.PASS} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="REJECT" fill={VERDICT_HEX.REJECT} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <p className="mt-3 text-center text-[11px] text-gray-400">
              Số liệu đọc từ Supabase (RLS theo vai trò).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
