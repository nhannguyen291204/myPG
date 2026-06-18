import { Camera, ChartColumn, ClipboardCheck, History, Settings } from "lucide-react";
import type { ComponentType } from "react";

// Các mục điều hướng chính — dùng chung cho BottomTab (mobile) và Sidebar (desktop)
// để 2 nơi luôn khớp nhau.
export type NavItem = { to: string; label: string; icon: ComponentType<{ size?: number }> };

export const MAIN_NAV: NavItem[] = [
  { to: "/", label: "Kiểm tra", icon: Camera },
  { to: "/check-image", label: "Check", icon: ClipboardCheck },
  { to: "/history", label: "Lịch sử", icon: History },
  { to: "/stats", label: "Thống kê", icon: ChartColumn },
  { to: "/settings", label: "Cài đặt", icon: Settings },
];
