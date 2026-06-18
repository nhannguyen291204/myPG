# PassME Web — AI Vision Inspection (P&G)

Web app React mobile-first thay cho app Expo cũ. iPhone/Android mở bằng trình duyệt, không cần cài app. Backend FastAPI + YOLOv8 (`/detect`) giữ nguyên — web chỉ gọi API.

> **Giai đoạn 2** (bản này): đăng nhập thật + database + kho ảnh + phân quyền **RLS** qua **Supabase**. Lịch sử/Thống kê đọc từ DB; ảnh annotate lưu trên Supabase Storage (bucket private, hiển thị qua **signed URL**). Luồng Kiểm tra → `/detect` (backend YOLO) **giữ nguyên**, độc lập Supabase.
> Giai đoạn 1 (mock auth + localStorage) đã được thay thế.

## Stack

Vite + React + TypeScript · Tailwind CSS v4 · React Router v7 · Recharts · lucide-react · **Supabase** (Auth + Postgres + Storage).

## Chạy dev

```bash
cd "iOS Demo Plan/webapp-v2/passme-web"
npm install
npm run dev            # vite.config đã bật host:true (bind 0.0.0.0)
```

- Máy: http://localhost:5173
- Điện thoại cùng Wi-Fi: **http://<IP-Mac>:5173** (`ipconfig getifaddr en0`).
- `npx tsc --noEmit -p tsconfig.app.json` để kiểm type; `npm run build` để build production.

## Biến môi trường (`.env`)

```
# Backend FastAPI/YOLO — KHÔNG hardcode IP trong code
VITE_BACKEND_URL=http://192.168.100.7:8000

# Supabase (Dashboard → Settings → API). anon key là khoá CÔNG KHAI, an toàn ở client
# vì RLS bảo vệ dữ liệu. KHÔNG đặt service_role key vào client.
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

`.env` thật **không commit** (đã trong `.gitignore`); xem mẫu ở `.env.example`. Backend phải bind `0.0.0.0:8000` + CORS `*`.

## Supabase — dựng 1 lần

Xem `docs/phase2-supabase.md` (migration SQL §2, RLS, bucket, cách tạo Admin §6). Tóm tắt:
1. Tạo project Supabase, chạy migration §2 (bảng `profiles` + `inspections`, hàm `is_admin`/`is_supervisor_or_admin`, RLS, bucket `inspections`).
2. **Tắt self-signup** (Authentication → Providers). Tài khoản do Admin tạo ở Dashboard.
3. Tạo Admin đầu tiên: Authentication → Users → Add user → SQL `update profiles set role='admin', full_name='...' where id='<uuid>';`.

## Đăng nhập + phân quyền (RLS thật)

Đăng nhập bằng email + mật khẩu thật (Supabase Auth). Phân quyền **ở tầng database (RLS)** — client không vượt được; `lib/permissions.ts` chỉ ẩn/hiện UI.

| Vai trò | Quyền (RLS bảo đảm) |
|---|---|
| **qc** | Tạo + xem lịch sử/ảnh **của mình** |
| **supervisor** | + xem lịch sử/thống kê **cả team** + chỉnh ngưỡng (local) |
| **admin** | + **đổi vai trò / khoá** tài khoản (`profiles_update_admin`) |

## Cấu trúc

```
src/
  App.tsx              router + AuthProvider + DraftProvider
  routes/AppLayout     khung mobile + bottom tab + <Outlet/>
  pages/               Login, Inspect, Result, History, InspectionDetail, Stats, Settings, UserManagement
  components/          VerdictBadge, TamuCounts, DetectionRow, HistoryCard, MetricCard, Header, BottomTab, ProtectedRoute, Button
  lib/                 supabase (client) · auth (Supabase Auth + profiles) · storage (DB + Storage)
                       · api (detect/health — KHÔNG đổi) · draft (Kiểm tra→Kết quả) · permissions · format
  types.ts  constants.ts  index.css (@theme tokens navy)
public/sample.jpg      ảnh cho nút "Dùng ảnh mẫu"
```

- **Ảnh**: `/detect` trả base64 → khi "Lưu": base64 → Blob → upload bucket `inspections` path `{user_id}/{id}.jpg`; DB chỉ lưu `annotated_path`. Hiển thị bằng signed URL.
- **localStorage** giờ chỉ giữ `passme.threshold` (ngưỡng theo máy) + token phiên của Supabase.
- `id` bản ghi là **UUID v4** (`genId()` dựng qua `crypto.getRandomValues` để chạy được cả trên http LAN).

## Ghi chú

- **profiles không lưu email** (email ở `auth.users`) → màn Quản lý người dùng hiển thị theo tên; email thật chỉ hiện cho user đang đăng nhập (lấy từ session).
- Ngưỡng tin cậy vẫn là cài đặt theo máy (localStorage) + đóng dấu vào bản ghi; backend vẫn chạy cố định `0.25`.
- Tạo user mới = Admin làm ở Supabase Dashboard. Tạo user ngay trong app cần Edge Function dùng `service_role` (không để key đó ở client) — chưa làm.

## Cập nhật UI

- **Responsive desktop**: `< lg` giữ nguyên mobile (cột 480px + `BottomTab` dưới); `>= lg` có `Sidebar` trái cố định + nội dung rộng (lưới thẻ ở Lịch sử / Thống kê / Quản lý người dùng). `BottomTab` ẩn ở desktop.
- **Model tùy chỉnh** (`/models`, chỉ Quản lý/Admin): tải dataset `.zip` (YOLO export từ Roboflow) → đặt tên → train → ra model + mAP, chọn model "đang dùng". **Train đang MÔ PHỎNG** ở frontend (`lib/training.ts`, lưu `passme.models` trong localStorage); backend train YOLO thật nối sau — xem TODO trong `lib/training.ts`.

## Việc về sau (tuỳ chọn)

PWA "thêm vào màn hình chính" · đa ngôn ngữ Việt/Anh · layout 2 cột cho tablet/desktop · tạo user trong app qua Edge Function · truyền ngưỡng tin cậy xuống backend.
