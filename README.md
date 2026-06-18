# PassME (P&G × RMIT Capstone 2026)

Prototype kiểm tra lỗi sản phẩm bằng thị giác máy. Điện thoại chụp ảnh → backend chạy YOLOv8 → trả verdict **PASS / RE-CHECK / REJECT** theo khung độ nặng **TAMU** của P&G. Có đăng nhập + phân quyền (QC / Quản lý / Admin), lưu lịch sử và thống kê chung.

## Kiến trúc

- **Backend** — FastAPI + YOLOv8 (`iOS Demo Plan/backend/`). Chạy *local trên máy mỗi người*. Endpoint `/detect`, `/health`. Model `best.pt` có sẵn trong repo.
- **Web app** — React + Vite (`iOS Demo Plan/webapp-v2/passme-web/`). Gọi backend để nhận diện, gọi Supabase để đăng nhập + lưu dữ liệu.
- **Supabase** — dịch vụ cloud **dùng chung** cho cả nhóm: đăng nhập, database, kho ảnh, phân quyền.

## Yêu cầu môi trường

- **Python 3.12**, **Node 18+**, **Git**.
- Backend chạy nhanh nhất trên Mac Apple Silicon (M1/M2). Máy Windows / Mac Intel / Linux vẫn chạy được nhưng dùng CPU nên chậm hơn (mỗi ảnh ~1–3 giây).

## Cài đặt cho thành viên mới (clone về là chạy theo được)

### Bước 1 — Clone repo
```bash
git clone https://github.com/s3830318/passme-P-G.git
cd passme-P-G
```

### Bước 2 — Backend (Terminal 1)
```bash
cd "iOS Demo Plan/backend"
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000     # KHÔNG dùng --reload
```
- `best.pt` (model) đã có sẵn trong repo — không cần xin riêng.
- Kiểm tra: mở `http://localhost:8000/health` → `{"status":"ok",...}`.

### Bước 3 — Web app (Terminal 2)
```bash
cd "iOS Demo Plan/webapp-v2/passme-web"
npm install
cp .env.example .env                 # rồi mở .env điền giá trị (xem Bước 4)
npm run dev -- --host
```
Mở `http://localhost:5173` (trên máy) hoặc `http://<IP-máy>:5173` (trên điện thoại cùng Wi-Fi — xem IP bằng `ipconfig getifaddr en0` trên Mac).

### Bước 4 — File `.env` của web

`.env.example` đã điền sẵn **Supabase URL + anon key** (project chung của nhóm), nên sau khi `cp .env.example .env` ở Bước 3 là dùng được ngay. Chỉ cần chỉnh **`VITE_BACKEND_URL`** khi:
- backend chạy ở máy/cổng khác, hoặc
- test trên điện thoại → đổi `localhost` thành IP LAN của máy chạy backend (vd `http://192.168.1.10:8000`).

```
VITE_BACKEND_URL=http://localhost:8000
VITE_SUPABASE_URL=https://aexexnougxobumqwvqqa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ…   # đã có sẵn trong .env.example
```
`anon key` là khoá **công khai**, an toàn ở client vì dữ liệu được RLS bảo vệ. **Không** dùng `service_role`/secret key.

### Bước 5 — Tài khoản đăng nhập (demo)

Supabase dùng chung, **không cho tự đăng ký** — Admin tạo sẵn tài khoản. Dùng các tài khoản demo dưới đây để đăng nhập và thử phân quyền:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `passme@gmail.com` | `passme@2026` |
| QC | `passmeqc@gmail.com` | `passme@2026` |

- **Admin**: thấy mọi bản ghi cả nhóm, chỉnh ngưỡng/model, quản lý người dùng.
- **QC**: chỉ thấy bản ghi của mình, không vào được Quản lý người dùng.

> Đây là tài khoản demo cho capstone. Đừng dùng mật khẩu này cho tài khoản cá nhân/quan trọng; sau khi bảo vệ xong nên đổi.

## Cấu trúc thư mục

```
iOS Demo Plan/
  backend/        FastAPI + YOLOv8 (best.pt). Endpoint /detect, /health.
  backend/web/    Web prototype HTML thuần (1 màn chụp→kết quả).
  passme-app/     App Expo cũ (React Native) — giữ tham khảo, không phát triển tiếp.
  webapp-v2/
    passme-web/   Web app React chính. Tài liệu thiết kế trong passme-web/docs/.
    UI_UX_SPEC.md Đặc tả giao diện.
```

## Tài liệu kỹ thuật (cho dev)

- **Database (Supabase)** — `iOS Demo Plan/webapp-v2/passme-web/docs/phase2-supabase.md`: schema, RLS, kho ảnh, SQL migration, các bước dựng Supabase.
- **Web app chi tiết** — `…/passme-web/docs/`: architecture, api-contract, design-system, auth-rbac.
- **Train model YOLO** — `iOS Demo Plan/training/`: kế hoạch chụp ảnh, hướng dẫn Roboflow, notebook Colab.
- **Đổi model (`best.pt`)** — `iOS Demo Plan/DEPLOY_NOTES.md`.

## Quy tắc làm việc nhóm (Git)

- **Không commit thẳng vào `main`.**
- Sửa lỗi → nhánh `bug/<mô-tả>`. Tính năng mới → nhánh `feature/<mô-tả>`.
- Xong việc → mở Pull Request, nhờ 1 thành viên review rồi mới merge.
- Không commit file lớn (`.venv`, `node_modules`, `.zip`, video, `.env`) — đã chặn trong `.gitignore`.

## Xử lý lỗi thường gặp

- **Web báo "Lỗi mạng" / Cài đặt báo "Offline"**: backend chưa chạy, hoặc `VITE_BACKEND_URL` sai, hoặc điện thoại khác Wi-Fi với máy chạy backend.
- **Cài `torch` lâu / nặng (Windows)**: bình thường, thư viện này lớn. Máy không phải Apple Silicon sẽ chạy CPU nên chậm hơn, vẫn ra kết quả.
- **Đăng nhập báo sai**: tài khoản chưa được Admin cấp, hoặc sai mật khẩu. Liên hệ Admin.
- **Đổi Wi-Fi / router cấp IP mới**: cập nhật `VITE_BACKEND_URL` cho khớp IP máy chạy backend.

## Nhóm PassME

| Người | Vai trò |
|---|---|
| Nguyen Thanh Dat (Tommy) | Tester |
| Le Nguyen Minh Quan | Project Manager |
| Nguyen Trong Nhan | Data Engineer |
| Nguyen Thach Khanh Dzi | Backend Developer |

Đối tác: P&G Vietnam · GVHD: Dr. Vinh Truong.
