import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, ScanLine, SlidersHorizontal } from "lucide-react";
import { MAIN_NAV } from "../lib/nav";
import { useAuth } from "../lib/auth";
import { roleAtLeast } from "../lib/permissions";
import { ROLE_LABELS } from "../constants";

// Sidebar chỉ hiện ở desktop (>= lg). Mobile dùng BottomTab.
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? "bg-navy-600/10 text-navy-600" : "text-gray-500 hover:bg-surface"
  }`;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  // "Model tùy chỉnh" chỉ cho Quản lý/Admin (giống route /models).
  const showModels = user ? roleAtLeast(user.role, "supervisor") : false;

  return (
    <aside className="hidden lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-line lg:bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white">
          <ScanLine size={20} />
        </div>
        <div>
          <div className="text-base font-medium leading-none text-navy-900">PassME</div>
          <div className="text-[11px] text-gray-400">AI Vision · P&amp;G</div>
        </div>
      </div>

      {/* Nav dọc */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {MAIN_NAV.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink key={it.to} to={it.to} end={it.to === "/"} className={linkClass}>
              <Icon size={20} />
              {it.label}
            </NavLink>
          );
        })}
        {showModels && (
          <NavLink to="/models" className={linkClass}>
            <SlidersHorizontal size={20} />
            Model tùy chỉnh
          </NavLink>
        )}
      </nav>

      {/* Người dùng + đăng xuất */}
      {user && (
        <div className="border-t border-line p-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600 text-sm font-medium text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-gray-800">{user.name}</div>
              <div className="truncate text-[11px] text-gray-400">{ROLE_LABELS[user.role]}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-reject hover:bg-reject/5"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      )}
    </aside>
  );
}
