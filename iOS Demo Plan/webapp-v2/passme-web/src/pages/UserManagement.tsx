import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, Lock, TriangleAlert, Unlock } from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../lib/auth";
import { loadUsers, setUserActive, updateUserRole } from "../lib/storage";
import { canManageUsers } from "../lib/permissions";
import { ROLE_LABELS } from "../constants";
import type { Role, User } from "../types";

const ROLES: Role[] = ["qc", "supervisor", "admin"];

export default function UserManagement() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[] | null>(null); // null = đang tải
  const [busy, setBusy] = useState<string | null>(null); // id đang cập nhật
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadUsers()
      .then((l) => {
        if (alive) setUsers(l);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Không tải được danh sách.");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!user) return null;
  const canEdit = canManageUsers(user.role);

  async function changeRole(id: string, role: Role) {
    setError(null);
    setBusy(id);
    try {
      await updateUserRole(id, role);
      setUsers((prev) => prev?.map((u) => (u.id === id ? { ...u, role } : u)) ?? null);
      if (id === user!.id) updateUser({ ...user!, role });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cập nhật thất bại (RLS chỉ cho Admin).");
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(id: string) {
    const target = users?.find((u) => u.id === id);
    if (!target) return;
    setError(null);
    setBusy(id);
    try {
      await setUserActive(id, !target.active);
      setUsers((prev) => prev?.map((u) => (u.id === id ? { ...u, active: !u.active } : u)) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cập nhật thất bại (RLS chỉ cho Admin).");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <Header
        title="Quản lý người dùng"
        onBack={() => navigate(-1)}
        subtitle={canEdit ? "Admin" : "Chỉ xem"}
      />
      <div className="flex flex-col gap-3 p-4 lg:mx-auto lg:max-w-5xl lg:p-6">
        {!canEdit && (
          <p className="rounded-lg bg-surface p-2 text-center text-[11px] text-gray-500">
            Bạn đang xem ở chế độ chỉ đọc. Đổi vai trò / khoá tài khoản cần quyền Admin (RLS bảo đảm).
          </p>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-reject/30 bg-reject/5 p-2.5 text-sm text-reject">
            <TriangleAlert size={16} /> {error}
          </div>
        )}

        {users === null ? (
          <div className="mt-16 flex justify-center">
            <LoaderCircle className="animate-spin text-navy-600" size={28} />
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl border border-line bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-800">{u.name}</div>
                    {u.id === user.id && <div className="text-[11px] text-navy-400">Bạn</div>}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                      u.active ? "bg-pass/10 text-pass" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {u.active ? "Hoạt động" : "Đã khoá"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={u.role}
                    disabled={!canEdit || busy === u.id}
                    onChange={(e) => void changeRole(u.id, e.target.value as Role)}
                    className="flex-1 rounded-lg border border-line bg-white px-2 py-1.5 text-sm disabled:opacity-60"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void toggleActive(u.id)}
                    disabled={!canEdit || busy === u.id}
                    className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm text-gray-600 disabled:opacity-60"
                  >
                    {u.active ? <Lock size={15} /> : <Unlock size={15} />}
                    {u.active ? "Khoá" : "Mở"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
