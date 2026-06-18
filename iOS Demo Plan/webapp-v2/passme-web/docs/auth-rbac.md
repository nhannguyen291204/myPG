# Auth & Phân quyền — PassME Web

Giai đoạn 1 dùng **mock** (không mật khẩu thật). Giai đoạn 2 thay bằng Supabase Auth + RLS.

## Ba vai trò (`types.ts` → `Role`)

| Key | Nhãn (`ROLE_LABELS`) | Ý nghĩa |
|---|---|---|
| `qc` | QC (Inspector) | chụp + xem lịch sử của mình |
| `supervisor` | Quản lý | + xem cả team, chỉnh ngưỡng/model, xem Quản lý người dùng |
| `admin` | Admin | + thực sự đổi vai trò / khoá tài khoản |

Thứ hạng (`permissions.ts`): `qc(0) < supervisor(1) < admin(2)`.

## Bảng quyền (`lib/permissions.ts`)

| Hàm | Đúng khi vai trò ≥ | Dùng ở |
|---|---|---|
| `canSeeTeam` | supervisor | Lịch sử/Thống kê: xem cả team hay chỉ mình |
| `canEditThreshold` | supervisor | Cài đặt: sửa ngưỡng tin cậy / model |
| `canViewUsers` | supervisor | mở màn Quản lý người dùng |
| `canManageUsers` | admin (đúng `=== "admin"`) | thực sự đổi vai trò / khoá tài khoản |

Quy tắc: dùng `roleAtLeast(role, min)` cho phân quyền, đừng so sánh chuỗi vai trò rải rác trong component.

## Mock login (`lib/auth.tsx`)

- `login(role)` chọn tài khoản demo đầu tiên có vai trò đó từ `loadUsers()`, lưu vào `passme.user`.
- `logout()` xoá. `updateUser(u)` cập nhật khi tự đổi vai trò mình ở Quản lý người dùng.
- Tài khoản demo (`storage.ts → DEFAULT_USERS`): `u-qc`, `u-sup`, `u-admin` (seed lần đầu vào `passme.users`).
- `useAuth()` là nguồn sự thật; phải nằm trong `<AuthProvider>`.

## Chặn route (`components/ProtectedRoute.tsx`)

- Chưa đăng nhập → chuyển `/login`.
- `requireRole` + vai trò thấp hơn → chuyển `/`.
- `/users` được bọc `requireRole="supervisor"` trong `App.tsx`, nên QC không vào được.

## Lọc dữ liệu theo vai trò

Lịch sử + Thống kê: nếu `canSeeTeam(role)` sai (tức QC) thì chỉ lấy `Inspection` có `userId === user.id`. Supervisor/Admin thấy tất cả.

## Hướng giai đoạn 2 (Supabase)

- Thay mock `login` bằng Supabase Auth (email/mật khẩu thật).
- `Role` lưu ở bảng `profiles`; phân quyền chuyển sang **RLS** (Row-Level Security) — chính sách SQL ép cùng quy tắc bảng quyền trên, ở tầng database.
- Giữ nguyên tên hàm `canSeeTeam`/`canManageUsers`... ở client để UI ẩn/hiện, nhưng quyền thật do RLS quyết định (client không tin được).
