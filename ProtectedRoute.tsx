import { Navigate, Outlet } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import type { Role } from "../types";
import { useAuth } from "../lib/auth";
import { roleAtLeast } from "../lib/permissions";

type Props = { requireRole?: Role };

// Chưa đăng nhập -> /login. Không đủ vai trò -> về trang chủ.
export default function ProtectedRoute({ requireRole }: Props) {
  const { user, loading } = useAuth();
  // Đang khôi phục phiên (reload trang) -> chờ, đừng đá về /login vội.
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface">
        <LoaderCircle className="animate-spin text-navy-600" size={28} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && !roleAtLeast(user.role, requireRole)) return <Navigate to="/" replace />;
  return <Outlet />;
}
