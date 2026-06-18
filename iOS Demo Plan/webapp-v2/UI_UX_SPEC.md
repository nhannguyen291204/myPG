# PassME Web App — Đặc tả UI/UX (v1)

> Ngày tạo: 09/06/2026. Đây là tài liệu thiết kế, dùng làm đầu vào cho bước hiện thực hoá code.

## 0. Bối cảnh & quyết định đã chốt

- Chuyển từ app Expo (React Native) sang **web app responsive, mobile-first**, chạy được trên iOS + Android qua trình duyệt, không cần cài app.
- Backend FastAPI + YOLO **giữ nguyên** phần suy luận `/detect`; web chỉ đổi cách hiển thị và gọi API.
- Đã chốt với Tommy:
  - Phạm vi: **full app** — Kiểm tra + Lịch sử + Thống kê.
  - **Có đăng nhập + phân quyền** (3 vai trò).
  - Tông màu: **navy P&G** (giữ màu app hiện tại).
  - Frontend: **Vite + React + TypeScript + Tailwind + React Router + Recharts** (chốt 09/06, sau khi chấm điểm React vs HTML thuần — React thắng 8/9 tiêu chí cho app nhiều màn có đăng nhập).
- **Để ngỏ — bàn sau**: nơi lưu dữ liệu (Supabase / tự host FastAPI+Postgres / Firebase). Research đã nghiêng về Supabase vì có sẵn login + kho ảnh + phân quyền theo dòng (RLS). Giai đoạn 1 dùng mock + localStorage để UI chạy trước.

## 1. Nguyên tắc thiết kế

- Mobile-first: thao tác một tay, nút lớn, vùng chạm rộng.
- Điều hướng bằng **thanh tab dưới đáy** (chuẩn iOS/Android), bỏ sidebar desktop của mẫu VideoSystem.
- Responsive: điện thoại 1 cột; tablet/desktop có thể mở rộng thành layout 2 cột (lịch sử + chi tiết cạnh nhau) — làm sau.
- Cân nhắc PWA: cho "thêm vào màn hình chính" để giống app thật (tùy chọn, bàn sau).

## 2. Design system

### Màu
- Navy đậm `#1F3864` — header, tiêu đề, logo.
- Navy `#2E5496` — nút chính, tab đang chọn, link.
- Navy nhạt `#5A6B8C` — nút phụ, text mờ.
- Nền `#FFFFFF`; surface `#F5F7FA`; viền `#E5E8EE`.
- Verdict: PASS `#4CAF50` · RE-CHECK `#FF9800` · REJECT `#E53935`.
- TAMU: T `#9E9E9E` · A `#4CAF50` · M `#FF9800` · U `#E53935`.

### Typography
- Font hệ thống (San Francisco trên iOS, Roboto trên Android).
- Tiêu đề màn 18–22px; tiêu đề mục 15–16px; body 13–15px; chú thích 11–12px.
- Hai độ đậm: 400 thường, 500 đậm.

### Hình khối
- Bo góc: card 8–12px; nút 9–10px; khung điện thoại 20–22px.
- Khoảng cách: 8 / 12 / 16px.
- Đổ bóng nhẹ hoặc viền 0.5px cho card.

### Component tái dùng
- Nút chính (navy đặc) / nút phụ (viền navy).
- Badge verdict (pill màu theo verdict).
- Card lịch sử (thumbnail + verdict + TAMU + giờ + người).
- Metric card (số to + nhãn nhỏ).
- Thanh tab dưới (4 mục, icon + nhãn).
- Header navy (tiêu đề + nút phụ).

## 3. Điều hướng

Thanh tab dưới, 4 mục: **Kiểm tra · Lịch sử · Thống kê · Cài đặt**.

Màn phụ (không nằm trong tab):
- **Đăng nhập** — đứng trước, vào app mới hiện tab.
- **Chi tiết kiểm tra** — mở từ một dòng trong Lịch sử.
- **Quản lý người dùng** — mở từ Cài đặt, chỉ Quản lý/Admin thấy.

## 4. Các màn hình

### 4.1 Đăng nhập
- Logo PassME + tagline "AI Vision Inspection · P&G".
- Ô email, ô mật khẩu (có nút hiện/ẩn), nút "Đăng nhập", link "Quên mật khẩu?".
- Sau khi đăng nhập, vai trò được gán theo tài khoản → quyết định thấy gì.

### 4.2 Kiểm tra (màn chính)
- Header "Kiểm tra".
- Khung camera/placeholder lớn.
- Nút lớn "Chụp ảnh" + nút "Chọn từ thư viện".
- Dòng nhỏ: model hiện tại + ngưỡng tin cậy đang dùng.
- Khi gửi ảnh: hiện spinner; lỗi thì Alert (lỗi mạng / server / timeout — kế thừa logic App.tsx).

### 4.3 Kết quả
- Badge verdict lớn (PASS/RE-CHECK/REJECT) + rung phản hồi.
- "Phát hiện trong Xms".
- Ảnh đã vẽ box màu + nhãn.
- Hộp đếm TAMU: T/A/M/U.
- Danh sách từng lỗi: class · TAMU · action · % tin cậy.
- Nút "Chụp lại" + "Lưu" (lưu vào lịch sử).

### 4.4 Lịch sử
- Header "Lịch sử" + nút lọc (theo verdict / ngày / người).
- Nhóm theo ngày.
- Mỗi dòng: thumbnail + giờ + người kiểm + tóm tắt lỗi + badge verdict.
- Bấm vào → Chi tiết.
- QC chỉ thấy của mình; Quản lý/Admin thấy cả team.

### 4.5 Chi tiết kiểm tra
- Ảnh annotate to, đủ thông tin: verdict, TAMU, từng lỗi, model + phiên bản, giờ, người kiểm, ngưỡng lúc chạy.
- (Tùy chọn) ghi chú, đánh dấu xử lý.

### 4.6 Thống kê
- Metric card: số lần kiểm hôm nay, tỷ lệ PASS, RE-CHECK, REJECT.
- Biểu đồ 7 ngày (PASS vs REJECT).
- (Tùy chọn) lọc theo line/ca/người.

### 4.7 Cài đặt
- Card người dùng: tên, vai trò.
- Model đang dùng (đổi model — chỉ Quản lý/Admin).
- Ngưỡng tin cậy (slider — chỉ Quản lý/Admin).
- Quản lý người dùng (chỉ Quản lý/Admin).
- Trạng thái kết nối backend.
- Đăng xuất.

### 4.8 Quản lý người dùng (phân quyền)
- Danh sách tài khoản: tên, email, vai trò, trạng thái.
- Thêm/sửa/khóa tài khoản, đổi vai trò. Chỉ Admin.

## 5. Luồng chính

Đăng nhập → Kiểm tra → Chụp ảnh → (POST `/detect`) → Kết quả → Lưu → Lịch sử + Thống kê tự cập nhật.

## 6. Phân quyền 3 vai trò (đề xuất)

- **QC (Inspector)**: chụp + xem kết quả + xem lịch sử của mình.
- **Quản lý (Supervisor)**: như QC + xem lịch sử cả team + thống kê + chỉnh ngưỡng/model.
- **Admin**: như Quản lý + quản lý tài khoản + cấu hình hệ thống.

## 7. Trạng thái & xử lý lỗi (kế thừa App.tsx)

- Loading khi gửi ảnh.
- Lỗi mạng (không kết nối backend) → nhắc kiểm tra kết nối.
- Lỗi server (HTTP != 200) → báo mã lỗi.
- Timeout 30s → báo backend không phản hồi.
- Backend trả `error` (vd decode ảnh) → hiện đúng thông báo.

## 8. Cần chốt ở bước sau

- Nơi lưu dữ liệu: Supabase (đề xuất) / tự host / Firebase. Giai đoạn 1 dùng localStorage tạm.
- Ảnh lưu ở kho object storage, DB chỉ giữ metadata + link ảnh (không nhét base64).
- Có làm PWA (thêm vào màn hình chính, chạy offline cơ bản) không.
- Có cần đa ngôn ngữ (Việt/Anh) không.

## 9. Stack & cách triển khai (đã chốt)

Frontend: **Vite + React + TypeScript + Tailwind CSS + React Router + Recharts**.
Backend giữ nguyên FastAPI `/detect`. Lưu trữ thật (Supabase) làm ở giai đoạn 2.

Triển khai theo 2 giai đoạn:
- **Giai đoạn 1 (làm trước)**: dựng khung React, design system navy, 7 màn theo §4, điều hướng tab, đăng nhập + phân quyền dạng **mock** (chọn vai trò), lịch sử + thống kê chạy bằng **localStorage**, riêng màn Kiểm tra → Kết quả gọi **API `/detect` thật**.
- **Giai đoạn 2 (sau khi chốt §8)**: thay mock auth + localStorage bằng Supabase (đăng nhập thật, database, kho ảnh, RLS phân quyền).

Chi tiết triển khai theo 2 giai đoạn như mô tả ở trên.
