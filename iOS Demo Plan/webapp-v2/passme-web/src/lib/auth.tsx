import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User as SupaUser } from "@supabase/supabase-js";
import type { Role, User } from "../types";
import { supabase } from "./supabase";

type AuthValue = {
  user: User | null;
  loading: boolean; // đang khôi phục phiên (tránh ProtectedRoute đá về /login khi reload)
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (u: User) => void; // cập nhật state local (vd đổi vai trò chính mình)
};

type ProfileRow = { id: string; full_name: string; role: Role; active: boolean };

const AuthContext = createContext<AuthValue | null>(null);

// Dựng User từ phiên auth: đọc bảng profiles. Trả null nếu thiếu profile hoặc bị khoá.
async function buildUser(authUser: SupaUser): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", authUser.id)
    .single();
  if (error || !data) return null;
  const p = data as ProfileRow;
  if (!p.active) return null; // tài khoản bị khoá
  return {
    id: p.id,
    name: p.full_name || authUser.email || "Người dùng",
    email: authUser.email ?? "",
    role: p.role,
    active: p.active,
  };
}

function mapAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "Email hoặc mật khẩu không đúng.";
  if (/email not confirmed/i.test(msg)) return "Email chưa được xác nhận.";
  return msg;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // Lắng thay đổi phiên — gồm INITIAL_SESSION khi tải lại trang (khôi phục đăng nhập).
    // KHÔNG await trực tiếp trong callback (tránh deadlock auth); xử lý profile trong IIFE.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      void (async () => {
        try {
          if (session?.user) {
            const u = await buildUser(session.user);
            if (alive) setUser(u);
          } else if (alive) {
            setUser(null);
          }
        } catch {
          if (alive) setUser(null);
        } finally {
          if (alive) setLoading(false);
        }
      })();
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(mapAuthError(error.message));
    const u = data.user ? await buildUser(data.user) : null;
    if (!u) {
      await supabase.auth.signOut();
      throw new Error("Tài khoản đã bị khoá hoặc chưa được cấp quyền. Liên hệ Admin.");
    }
    setUser(u);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  function updateUser(u: User) {
    setUser(u);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải nằm trong <AuthProvider>");
  return ctx;
}
