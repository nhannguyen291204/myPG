# API Contract — backend `/detect` & `/health`

Web là client của backend FastAPI (`../backend/app.py`). KHÔNG đổi shape dưới đây nếu chưa đổi backend.

Base URL: `import.meta.env.VITE_BACKEND_URL` (mặc định `http://192.168.100.7:8000`). Code trong `lib/api.ts`.

## POST `/detect`

- Body: `multipart/form-data`, field tên **`file`** (ảnh JPEG/PNG/HEIC).
- Hàm: `detect(file: Blob, filename = "photo.jpg")`, timeout 30s (AbortController).

Phản hồi thành công:
```jsonc
{
  "summary": {
    "verdict": "PASS" | "RE-CHECK" | "REJECT",
    "counts": { "T": 0, "A": 0, "M": 0, "U": 1 },
    "n_defects": 1,
    "image_size": { "w": 1280, "h": 960 },
    "inference_ms": 87,
    "total_ms": 142
  },
  "detections": [
    {
      "class": "crack", "confidence": 0.972,
      "bbox": [x, y, w, h], "area": 50381, "area_ratio": 0.9996,
      "tamu": "U", "action": "REJECT", "color": "#E53935"
    }
  ],
  "annotated_image": "data:image/jpeg;base64,..."
}
```

- `bbox` là `[x, y, w, h]` (góc trái-trên + rộng/cao), KHÔNG phải `[x1,y1,x2,y2]`.
- `tamu`, `action`, `color` đã do backend tính — web dùng thẳng, không tính lại.

Phản hồi lỗi từ backend: `{ "error": "cannot decode image ..." }` (vd HEIC fail).

## GET `/health`

- Hàm: `checkHealth()`, timeout 8s. Trả `{ status: "ok", model: "best.pt" }`.
- `lib/api.ts` chuẩn hoá thành `{ ok: boolean, model?, error? }`. Màn Cài đặt dùng để hiện trạng thái backend.

## Phân loại lỗi — `ApiError` (`lib/api.ts`)

`ApiError.kind` có 4 giá trị, UI hiển thị thông báo tiếng Việt tương ứng:

- `backend` — phản hồi có field `error` (vd decode ảnh thất bại).
- `server` — `!res.ok` (HTTP ≠ 2xx), hoặc lỗi không phân loại được.
- `timeout` — quá 30s, `AbortError`.
- `network` — `fetch` ném `TypeError` ("Failed to fetch" / Safari "Load failed") → mất kết nối; nhắc kiểm tra cùng Wi-Fi + `VITE_BACKEND_URL`.

## Ràng buộc khi mở rộng

- Thêm trường mới phải sửa cả `types.ts` (`Detection`/`DetectSummary`) cho khớp backend.
- Không gọi backend từ component trực tiếp — luôn qua `lib/api.ts` để giữ một chỗ xử lý lỗi + timeout.
