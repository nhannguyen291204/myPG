# Giai đoạn 2 — Tích hợp Supabase (đăng nhập thật + database + kho ảnh)

Thay lớp mock (localStorage + chọn vai trò) bằng Supabase: đăng nhập thật, dữ liệu chung nhiều người, phân quyền ở tầng database (RLS), ảnh lưu kho riêng. Backend FastAPI/YOLO (`/detect`) giữ nguyên.

Quyết định đã chốt: **Admin tạo tài khoản** (KHÔNG cho tự đăng ký). 3 vai trò `qc < supervisor < admin` (khớp `lib/permissions.ts`).

## 1. Mô hình dữ liệu

### Bảng `profiles` (1-1 với `auth.users`)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| full_name | text | tên hiển thị |
| role | enum `app_role` | qc / supervisor / admin |
| active | boolean | khoá tài khoản (mặc định true) |
| created_at | timestamptz | |

### Bảng `inspections`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | người kiểm |
| user_name | text | tên người kiểm (lưu sẵn để khỏi join — khớp `Inspection.userName`) |
| created_at | timestamptz | |
| verdict | text | PASS / RE-CHECK / REJECT |
| counts | jsonb | `{T,A,M,U}` |
| n_defects | int | |
| detections | jsonb | mảng `Detection` (khớp `types.ts`, lưu nguyên cho gọn) |
| model_version | text | "best.pt" |
| conf_threshold | numeric | ngưỡng lúc chạy |
| inference_ms | numeric | |
| image_w, image_h | int | |
| annotated_path | text | đường dẫn ảnh trong bucket `inspections` |

Lý do `detections` để jsonb: app luôn đọc/ghi cả cụm cùng 1 inspection, không query lẻ từng box → khỏi cần bảng riêng + join. Nếu sau cần thống kê theo loại lỗi thì tách bảng.

## 2. SQL migration (chạy 1 lần — xem cách chạy ở §6)

```sql
-- 2.1 Enum + bảng
create type public.app_role as enum ('qc','supervisor','admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'qc',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null default '',
  created_at timestamptz not null default now(),
  verdict text not null check (verdict in ('PASS','RE-CHECK','REJECT')),
  counts jsonb not null,
  n_defects int not null default 0,
  detections jsonb not null default '[]',
  model_version text not null default 'best.pt',
  conf_threshold numeric not null default 0.25,
  inference_ms numeric,
  image_w int, image_h int,
  annotated_path text
);
create index on public.inspections (user_id, created_at desc);

-- 2.2 Hàm kiểm vai trò (security definer để RLS không đệ quy)
create or replace function public.is_supervisor_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles
    where id = auth.uid() and role in ('supervisor','admin') and active);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active);
$$;

-- 2.3 Tự tạo profile khi Admin thêm user mới (mặc định vai trò qc)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'qc');
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- 2.4 Bật RLS
alter table public.profiles enable row level security;
alter table public.inspections enable row level security;

-- profiles: tự xem mình; supervisor/admin xem cả team; chỉ admin sửa
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_supervisor_or_admin());
create policy profiles_update_admin on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- inspections: tạo bản ghi của mình; xem của mình hoặc cả team; admin xoá
create policy inspections_insert_own on public.inspections for insert
  with check (user_id = auth.uid());
create policy inspections_select on public.inspections for select
  using (user_id = auth.uid() or public.is_supervisor_or_admin());
create policy inspections_delete_admin on public.inspections for delete
  using (public.is_admin());

-- 2.5 Kho ảnh (bucket private) + RLS
insert into storage.buckets (id, name, public)
  values ('inspections','inspections', false) on conflict (id) do nothing;

create policy insp_obj_insert on storage.objects for insert
  with check (bucket_id = 'inspections'
    and (storage.foldername(name))[1] = auth.uid()::text);
create policy insp_obj_select on storage.objects for select
  using (bucket_id = 'inspections'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_supervisor_or_admin()));
```

## 3. Phân quyền — khớp `lib/permissions.ts`

| Hành động | RLS bảo đảm |
|---|---|
| QC xem lịch sử của mình | `inspections_select`: `user_id = auth.uid()` |
| Supervisor/Admin xem cả team | `is_supervisor_or_admin()` |
| Chỉ Admin đổi vai trò / khoá | `profiles_update_admin` |
| Ảnh: QC xem của mình, cấp trên xem hết | policy storage theo thư mục `{user_id}/` |

RLS là tầng bảo vệ thật (client không vượt được). Hàm `canSeeTeam`/`canManageUsers` ở client chỉ để ẩn/hiện UI.

## 4. Kho ảnh

- Ảnh annotate (`/detect` trả base64) → khi bấm "Lưu": chuyển base64 → Blob → upload lên bucket `inspections`, đường dẫn `{user_id}/{inspection_id}.jpg`; lưu `annotated_path` vào hàng inspections.
- Hiển thị (History/Detail): tạo **signed URL** từ `annotated_path` (bucket private), không nhúng base64 vào DB nữa.

## 5. Ghép vào code passme-web (giữ tối đa interface cũ)

- `lib/supabase.ts` (mới): `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`.
- `lib/auth.tsx`: `login(email, password)` async → `signInWithPassword` → đọc `profiles` → set `user`; `logout` → `signOut`; lắng `onAuthStateChange` để giữ phiên. `User` map từ profile + email auth.
- `lib/storage.ts` → chuyển sang Supabase, **các hàm thành async**: `loadInspections`, `saveInspection` (upload ảnh + insert), `getInspection`, `loadUsers` (đọc profiles), đổi `saveUsers` thành `updateUserRole(id, role)` + `setUserActive(id, active)`. `loadThreshold/saveThreshold` giữ localStorage (cài đặt theo máy).
- Pages async hoá: `History`, `Stats`, `Settings`, `UserManagement`, `InspectionDetail` dùng `useEffect` + trạng thái loading; `Result.save()` async; `Login` đổi UI bỏ chọn vai trò, nhập email+mật khẩu thật.
- `Inspect.tsx` + `lib/api.ts` (gọi `/detect`) **không đổi** — phần YOLO độc lập Supabase.
- `.env` thêm: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon key là khoá công khai, an toàn ở client vì đã có RLS).

## 6. Các bước dựng Supabase (làm 1 lần)

1. Vào supabase.com, đăng nhập bằng tài khoản GitHub của dự án. Free tier đủ cho demo. (Nếu trình duyệt đang nhớ tài khoản khác, dùng cửa sổ ẩn danh.)
2. New project (đặt tên `passme`, chọn region gần VN: Singapore). Lưu **Project URL** + **anon public key** (Settings → API) → cho vào `.env`.
3. SQL Editor → dán toàn bộ migration §2 → Run.
4. Authentication → Sign In / Providers → **tắt** "Allow new users to sign up" (chỉ Admin tạo).
5. Tạo Admin đầu tiên: Authentication → Users → Add user (email + password) → rồi Table editor / SQL: `update public.profiles set role='admin', full_name='...' where id='<uuid user vừa tạo>';`
6. Tạo thêm QC/supervisor tương tự (Add user → set role nếu cần khác qc).

## 7. Giữ nguyên / không làm

- Không đổi backend `/detect`, không đổi TAMU.
- Không bật self-signup.
- Tạo user mới = Admin làm ở Supabase Dashboard (§6.5). Nếu sau muốn tạo user ngay trong app: thêm Edge Function dùng `service_role` (không để key này ở client) — phần nâng cao, chưa làm giai đoạn 2.
