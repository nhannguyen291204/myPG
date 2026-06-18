import { NavLink } from "react-router-dom";
import { MAIN_NAV } from "../lib/nav";

// Thanh tab dưới — chỉ hiện ở mobile (< lg). Desktop dùng Sidebar.
export default function BottomTab() {
  return (
    <nav className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-line bg-white lg:hidden">
      {MAIN_NAV.map((t) => {
        const Icon = t.icon;
        return (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/"} // "/" chỉ active đúng trang chủ, không lan sang /history...
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[10px] ${
                isActive ? "text-navy-600" : "text-gray-400"
              }`
            }
          >
            <Icon size={22} />
            <span>{t.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
