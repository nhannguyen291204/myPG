import { Outlet } from "react-router-dom";
import BottomTab from "../components/BottomTab";
import Sidebar from "../components/Sidebar";

// Mobile-first:
//  - < lg: cột giữa tối đa 480px + BottomTab cố định dưới (như cũ, KHÔNG đổi).
//  - >= lg: Sidebar trái cố định + vùng nội dung rộng bên phải; ẩn BottomTab.
export default function AppLayout() {
  return (
    <div className="lg:flex lg:min-h-dvh lg:bg-surface">
      <Sidebar />
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-surface shadow-sm lg:mx-0 lg:max-w-none lg:flex-1 lg:shadow-none">
        <div className="flex-1">
          <Outlet />
        </div>
        <BottomTab />
      </div>
    </div>
  );
}
