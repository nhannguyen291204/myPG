# Architecture — PassME Web

## Cấu trúc thư mục (`src/`)

```
main.tsx            điểm vào, render <App/>
App.tsx             providers + định tuyến (routing)
index.css           @import tailwindcss + tokens @theme
constants.ts        màu verdict/TAMU, nhãn vai trò, MODEL_VERSION, DEFAULT_THRESHOLD
types.ts            kiểu dữ liệu dùng chung
routes/AppLayout.tsx  khung mobile (cột 480px) + <BottomTab/> + <Outlet/>
pages/              Login, Inspect, Result, History, InspectionDetail, Stats, Settings, UserManagement
components/         VerdictBadge, TamuCounts, DetectionRow, HistoryCard, MetricCard, BottomTab, Header, Button, ProtectedRoute
lib/
  api.ts            gọi /detect, /health (xem api-contract.md)
  auth.tsx          AuthProvider + useAuth (mock, xem auth-rbac.md)
  permissions.ts    bảng quyền theo vai trò (xem auth-rbac.md)
  storage.ts        đọc/ghi localStorage
  draft.tsx         giữ tạm kết quả giữa Kiểm tra -> Kết quả
  format.ts         tiện ích định dạng
```

## Routing (`App.tsx`)

Cây provider: `AuthProvider` → `DraftProvider` → `BrowserRouter`.

- `/login` — công khai.
- Bọc trong `ProtectedRoute` (chưa đăng nhập → `/login`):
  - `/` Kiểm tra · `/result` Kết quả · `/history` Lịch sử · `/history/:id` Chi tiết · `/stats` Thống kê · `/settings` Cài đặt (đều nằm trong `AppLayout`).
  - `/users` Quản lý người dùng — bọc thêm `ProtectedRoute requireRole="supervisor"` (QC bị đẩy về `/`).
- `*` → chuyển hướng về `/`.

## Hai context (state toàn cục, không thư viện ngoài)

- `AuthProvider` (`lib/auth.tsx`): người dùng hiện tại, `login(role)`, `logout`, `updateUser`. Nguồn sự thật cho phân quyền.
- `DraftProvider` (`lib/draft.tsx`): giữ **tạm** kết quả `/detect` + preview ảnh gốc trong RAM để chuyển từ Kiểm tra sang Kết quả. KHÔNG đi qua localStorage. `clearDraft()` khi "Chụp lại".

## Luồng dữ liệu một lần kiểm tra

1. `Inspect` chụp/chọn ảnh → `api.detect(file)`.
2. Kết quả set vào `DraftContext` → điều hướng `/result`.
3. `Result` đọc draft, hiển thị verdict + ảnh annotate + TAMU + detections.
4. Nút "Lưu" → tạo `Inspection` → `storage.saveInspection()` (unshift, mới nhất lên đầu).
5. `History` + `Stats` đọc `storage.loadInspections()`. QC chỉ thấy bản ghi `userId` của mình (lọc theo `canSeeTeam`).

## localStorage (keys trong `storage.ts`)

- `passme.inspections` — mảng `Inspection[]`.
- `passme.user` — người đăng nhập hiện tại.
- `passme.users` — danh sách tài khoản (seed `DEFAULT_USERS` lần đầu).
- `passme.threshold` — ngưỡng tin cậy (mặc định `DEFAULT_THRESHOLD = 0.25`).

Ghi lỗi (localStorage đầy do ảnh base64 nặng) chỉ `console.warn`, không chặn app. Đây là giới hạn giai đoạn 1.

## Kiểu dữ liệu chính (`types.ts`)

- `Detection` — khớp 1:1 với backend: `class, confidence, bbox [x,y,w,h], area, area_ratio, tamu, action, color`.
- `DetectResponse` — `{ summary, detections, annotated_image }`.
- `Inspection` — bản ghi lịch sử: thêm `id, createdAt, userId, userName, modelVersion, confThreshold, inferenceMs, imageSize` quanh dữ liệu detect.
- `User` — `{ id, name, email, role, active }`.

## Giai đoạn 1 vs 2

Giai đoạn 1 (hiện tại): auth mock + localStorage. Giai đoạn 2: thay `storage.ts` + `auth.tsx` bằng Supabase (database + kho ảnh + RLS), `annotatedImage` chuyển từ data URL sang link kho ảnh. Giao diện và `api.ts` gần như giữ nguyên.
