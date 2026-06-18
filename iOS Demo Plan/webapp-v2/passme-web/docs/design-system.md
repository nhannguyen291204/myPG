# Design System — PassME Web

Tông navy P&G, mobile-first. Giữ nhất quán với app cũ và báo cáo.

## Tokens màu (`src/index.css`, `@theme` của Tailwind v4)

Khai báo bằng biến `--color-*`; Tailwind tự sinh utility tương ứng (`bg-navy-600`, `text-navy-900`, `border-line`, `bg-surface`...).

| Token | Hex | Dùng cho |
|---|---|---|
| `navy-900` | `#1f3864` | header, tiêu đề, logo |
| `navy-600` | `#2e5496` | nút chính, tab đang chọn, link |
| `navy-400` | `#5a6b8c` | nút phụ, chữ mờ |
| `surface` | `#f5f7fa` | nền trang |
| `line` | `#e5e8ee` | viền, đường kẻ |
| `pass` | `#4caf50` | verdict PASS |
| `recheck` | `#ff9800` | verdict RE-CHECK |
| `reject` | `#e53935` | verdict REJECT |
| `tamu-t/a/m/u` | `#9e9e9e / #4caf50 / #ff9800 / #e53935` | nhãn TAMU |

KHÔNG tạo `tailwind.config.js`. Muốn thêm token → thêm biến trong `@theme`.

## Màu động dùng inline, không class Tailwind

Verdict/TAMU thay đổi theo dữ liệu. Tailwind v4 chỉ sinh class thấy tĩnh trong source, nên class kiểu `bg-${verdict}` sẽ KHÔNG được sinh. Vì vậy verdict/TAMU lấy hex từ `src/constants.ts` và gán `style={{ background: ... }}`:

- `VERDICT_HEX[verdict]`, `TAMU_HEX[tamu]` — màu.
- `TAMU_LABEL[tamu]` — diễn giải ("Target · ≤1% khung"...), khớp ngưỡng `app.py`.
- `ROLE_LABELS[role]` — nhãn vai trò tiếng Việt.
- `MODEL_VERSION = "best.pt"`, `DEFAULT_THRESHOLD = 0.25`.

## Font & nền

Font hệ thống (San Francisco trên iOS, Roboto trên Android) khai trong `body`. Nền `surface`, chữ `#1a1a1a`. `color-scheme: light` (chưa làm dark mode).

## Layout

- `AppLayout`: cột giữa `max-w-[480px] mx-auto`, tối thiểu cao `min-h-dvh`, `BottomTab` cố định cuối cột. Mọi màn nằm trong khung này.
- Thanh tab dưới: 4 mục Kiểm tra · Lịch sử · Thống kê · Cài đặt; mục đang chọn màu `navy-600`.

## Component (`src/components/`)

`Button` (nút chính/phụ), `Header` (thanh tiêu đề navy), `BottomTab`, `VerdictBadge` (pill verdict), `TamuCounts` (hộp đếm T/A/M/U), `DetectionRow` (1 dòng lỗi), `HistoryCard` (1 dòng lịch sử), `MetricCard` (thẻ số thống kê), `ProtectedRoute` (chặn route theo đăng nhập/vai trò). Icon dùng `lucide-react`.

## Quy ước

- Bo góc card 8–12px, nút 9–10px. Hai độ đậm chữ 400/500.
- Tiêu đề 18–22px, body 13–15px, chú thích 11–12px.
- Thêm màn mới: tái dùng component trên, đặt trong `AppLayout`, không tự dựng khung riêng.
