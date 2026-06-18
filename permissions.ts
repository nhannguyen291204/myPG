import type { Role } from "../types";

// Thứ hạng vai trò: qc < supervisor < admin
const RANK: Record<Role, number> = { qc: 0, supervisor: 1, admin: 2 };

export function roleAtLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

// Xem lịch sử/thống kê của cả team (không chỉ của mình)
export function canSeeTeam(role: Role): boolean {
  return roleAtLeast(role, "supervisor");
}

// Chỉnh ngưỡng tin cậy / model
export function canEditThreshold(role: Role): boolean {
  return roleAtLeast(role, "supervisor");
}

// Mở màn Quản lý người dùng (Quản lý được xem, Admin được sửa)
export function canViewUsers(role: Role): boolean {
  return roleAtLeast(role, "supervisor");
}

// Thực sự đổi vai trò / khoá tài khoản — chỉ Admin
export function canManageUsers(role: Role): boolean {
  return role === "admin";
}
