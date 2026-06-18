import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, ScanLine } from "lucide-react";
import { useAuth } from "../lib/auth";
import Button from "../components/Button";

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đã đăng nhập (vd reload) -> vào thẳng app.
  if (!loading && user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-navy-900 px-6 py-10">
      <div className="mx-auto w-full max-w-[400px]">
        {/* Logo + tagline */}
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <ScanLine size={34} />
          </div>
          <h1 className="text-2xl font-medium tracking-wide">PassME</h1>
          <p className="mt-1 text-sm text-white/70">AI Vision Inspection · P&amp;G</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-lg">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@passme.vn"
            autoComplete="email"
            required
            className="mb-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-navy-600"
          />

          <label className="mb-1.5 block text-xs font-medium text-gray-500">Mật khẩu</label>
          <div className="relative mb-4">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-line px-3 py-2.5 pr-10 text-sm outline-none focus:border-navy-600"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400"
              aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-reject/30 bg-reject/5 p-2.5 text-sm text-reject">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <LoaderCircle className="animate-spin" size={18} />}
            {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-white/50">
          Tài khoản do Admin cấp. Quên mật khẩu? Liên hệ quản trị viên.
        </p>
      </div>
    </div>
  );
}
