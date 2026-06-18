import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, LogOut, SlidersHorizontal, Users, Wifi, WifiOff } from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../lib/auth";
import { MODEL_VERSION, ROLE_LABELS } from "../constants";
import { canEditThreshold, canViewUsers, roleAtLeast } from "../lib/permissions";
import { loadThreshold, saveThreshold } from "../lib/storage";
import { backendUrl, checkHealth } from "../lib/api";
import type { HealthResult } from "../lib/api";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [threshold, setThreshold] = useState(() => loadThreshold());
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    // checking khởi tạo = true sẵn, nên không cần setChecking(true) ở đây.
    checkHealth().then((h) => {
      if (alive) {
        setHealth(h);
        setChecking(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!user) return null;
  const editable = canEditThreshold(user.role);

  function onThreshold(v: number) {
    setThreshold(v);
    saveThreshold(v);
  }

  async function onLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <Header title="Cài đặt" />
      <div className="flex flex-col gap-4 p-4 lg:mx-auto lg:max-w-2xl lg:p-6">
        {/* Card người dùng */}
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-600 font-medium text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-gray-800">{user.name}</div>
              <div className="truncate text-xs text-gray-500">
                {ROLE_LABELS[user.role]}
                {user.email ? ` · ${user.email}` : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Model + ngưỡng */}
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Model đang dùng</span>
            <span className="font-medium text-gray-800">{MODEL_VERSION}</span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ngưỡng tin cậy</span>
              <span className="font-medium text-gray-800">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.9}
              step={0.05}
              value={threshold}
              disabled={!editable}
              onChange={(e) => onThreshold(Number(e.target.value))}
              className="mt-2 w-full accent-navy-600 disabled:opacity-50"
            />
            {!editable && <p className="text-[11px] text-gray-400">Chỉ Quản lý/Admin được chỉnh.</p>}
          </div>
        </div>

        {/* Quản lý người dùng (Quản lý xem, Admin sửa) */}
        {canViewUsers(user.role) && (
          <button
            type="button"
            onClick={() => navigate("/users")}
            className="flex items-center justify-between rounded-xl border border-line bg-white p-4 text-left"
          >
            <span className="flex items-center gap-2 text-sm text-gray-800">
              <Users size={18} className="text-navy-600" /> Quản lý người dùng
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        )}

        {/* Model tùy chỉnh (Quản lý/Admin) — link cho mobile; desktop có ở Sidebar */}
        {roleAtLeast(user.role, "supervisor") && (
          <button
            type="button"
            onClick={() => navigate("/models")}
            className="flex items-center justify-between rounded-xl border border-line bg-white p-4 text-left"
          >
            <span className="flex items-center gap-2 text-sm text-gray-800">
              <SlidersHorizontal size={18} className="text-navy-600" /> Model tùy chỉnh
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        )}

        {/* Trạng thái backend */}
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Backend</span>
            {checking ? (
              <span className="text-gray-400">Đang kiểm tra…</span>
            ) : health?.ok ? (
              <span className="flex items-center gap-1 text-pass">
                <Wifi size={16} /> Online · {health.model}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-reject">
                <WifiOff size={16} /> Offline
              </span>
            )}
          </div>
          <div className="mt-1 break-all text-[11px] text-gray-400">{backendUrl()}</div>
        </div>

        {/* Đăng xuất */}
        <button
          type="button"
          onClick={() => void onLogout()}
          className="flex items-center justify-center gap-2 rounded-xl border border-reject/40 p-3 text-sm font-medium text-reject"
        >
          <LogOut size={18} /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
