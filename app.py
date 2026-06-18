"""
PassME — Backend demo cho AI Vision Inspection (P&G).
- GET  /        : web UI (web/index.html) — chụp/chọn ảnh ngay trên trình duyệt điện thoại.
- POST /detect  : nhận 1 ảnh, chạy YOLO (best.pt), map TAMU theo diện tích bbox,
                  trả JSON (boxes + verdict) kèm ảnh đã vẽ box/nhãn/màu (base64).

Chạy (KHÔNG dùng --reload — nó watch .venv ~10k file, crash PyTorch trên M1):
    pip install fastapi uvicorn ultralytics opencv-python python-multipart pillow pillow-heif "numpy<2"
    uvicorn app:app --host 0.0.0.0 --port 8000
Điện thoại và máy này phải chung 1 mạng. Mở Safari: http://<IP-may>:8000
"""
import base64
import io
import time
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image
from ultralytics import YOLO

# iPhone chụp ảnh ra HEIC mặc định — cv2.imdecode không đọc được.
# pillow-heif đăng ký opener vào Pillow để fallback decode HEIC/HEIF.
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
    _HEIC_OK = True
except ImportError:
    _HEIC_OK = False
    print("[warn] pillow-heif chưa cài. iPhone HEIC sẽ fail. Cài: pip install pillow-heif")

# ---- Config (generic — works với mọi model: crack, bottle, etc.) ----
MODEL_PATH = "best.pt"          # đổi sang "bottle_defect.pt" khi swap model mới
CONF_THRES = 0.25               # ngưỡng confidence
# Bỏ qua các class KHÔNG phải defect (tên class trong model). Để [] = giữ hết.
# Crack model: ["no_crack"] (chỉ class crack là defect)
# Bottle model: [] (chỉ có 1 class "defect" — không cần filter)
IGNORE_CLASS_NAMES = ["no_crack"]
# Giới hạn kích thước ảnh để inference nhanh + đỡ tốn RAM (giữ longest side ≤ 1280)
MAX_IMAGE_DIM = 1280
# TAMU theo TỈ LỆ diện tích bbox / ảnh — scale đúng cho mọi resolution iPhone (3-12 MP).
# Calibrate lại tại Day 4 sau khi chụp thử với setup thực tế nếu cần.
TAMU_BANDS = [
    # (max_ratio, level, action, color_bgr, color_hex)
    (0.01,  "T", "PASS",     None,            "#9E9E9E"),   # ≤ 1%  ảnh: tiny → target
    (0.05,  "A", "PASS",     (76, 175, 80),   "#4CAF50"),   # 1-5%:  acceptable → xanh
    (0.15,  "M", "RE-CHECK", (0, 152, 255),   "#FF9800"),   # 5-15%: marginal → cam
    (1.01,  "U", "REJECT",   (53, 57, 229),   "#E53935"),   # > 15%: unacceptable → đỏ
]
VERDICT_RANK = {"PASS": 0, "RE-CHECK": 1, "REJECT": 2}

app = FastAPI(title="PassME Vision Demo")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)
model = YOLO(MODEL_PATH)


def classify_tamu(ratio: float):
    """Map ratio (bbox_area / image_area) -> TAMU level + action + colour."""
    for max_ratio, level, action, bgr, hex_ in TAMU_BANDS:
        if ratio <= max_ratio:
            return level, action, bgr, hex_
    return TAMU_BANDS[-1][1:]


# Web UI — đường dẫn tính theo vị trí app.py để chạy được từ bất kỳ cwd nào.
WEB_INDEX = Path(__file__).parent / "web" / "index.html"


@app.get("/")
def index():
    """Trang web demo (thay app Expo). Mở http://<IP-may>:8000 trên điện thoại."""
    if not WEB_INDEX.exists():
        return {"error": f"web/index.html không tồn tại tại {WEB_INDEX}"}
    return FileResponse(WEB_INDEX, media_type="text/html")


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_PATH}


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    t0 = time.perf_counter()
    raw = await file.read()
    # Thử cv2 trước (nhanh, đọc JPEG/PNG).
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    # Fallback sang Pillow nếu cv2 fail (HEIC/HEIF/WebP từ iPhone hoặc browser).
    if img is None:
        try:
            pil_img = Image.open(io.BytesIO(raw)).convert("RGB")
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            return {"error": f"cannot decode image (cv2 + Pillow fail): {type(e).__name__}: {e}"}

    # Resize nếu ảnh quá lớn (iPhone 12MP ~ 4032x3024) — giữ aspect, longest side ≤ MAX_IMAGE_DIM
    H0, W0 = img.shape[:2]
    scale = min(1.0, MAX_IMAGE_DIM / max(H0, W0))
    if scale < 1.0:
        img = cv2.resize(img, (int(W0 * scale), int(H0 * scale)), interpolation=cv2.INTER_AREA)

    H, W = img.shape[:2]
    image_area = float(H * W) if H and W else 1.0

    t_inf0 = time.perf_counter()
    results = model(img, conf=CONF_THRES, verbose=False)[0]
    inference_ms = round((time.perf_counter() - t_inf0) * 1000, 1)
    names = results.names

    detections = []
    counts = {"T": 0, "A": 0, "M": 0, "U": 0}
    verdict = "PASS"

    for box in results.boxes:
        cls_id = int(box.cls[0])
        cls = names[cls_id]
        # Bỏ qua class không phải defect (vd "no_crack"). Bottle model 1-class → IGNORE rỗng → giữ hết.
        if cls in IGNORE_CLASS_NAMES:
            continue
        x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
        conf = float(box.conf[0])
        area = max(0.0, (x2 - x1)) * max(0.0, (y2 - y1))
        ratio = area / image_area
        level, action, bgr, hex_ = classify_tamu(ratio)
        counts[level] += 1
        if VERDICT_RANK[action] > VERDICT_RANK[verdict]:
            verdict = action

        detections.append({
            "class": cls, "confidence": round(conf, 3),
            "bbox": [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
            "area": int(area), "area_ratio": round(ratio, 4),
            "tamu": level, "action": action, "color": hex_,
        })

        # vẽ box + nhãn (clamp toạ độ trong ảnh để không vẽ ngoài biên)
        draw_bgr = bgr if bgr else (160, 160, 160)
        ix1, iy1, ix2, iy2 = int(x1), int(y1), int(x2), int(y2)
        cv2.rectangle(img, (ix1, iy1), (ix2, iy2), draw_bgr, 3)
        label = f"{cls} {level} {conf:.2f}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
        ly = max(iy1 - 8, th + 4)  # nếu box gần đỉnh, vẽ label dưới đỉnh thay vì trên
        cv2.rectangle(img, (ix1, ly - th - 4), (min(ix1 + tw + 6, W - 1), ly + 2), draw_bgr, -1)
        cv2.putText(img, label, (ix1 + 3, ly - 2),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    b64 = base64.b64encode(buf).decode() if ok else ""
    total_ms = round((time.perf_counter() - t0) * 1000, 1)

    return {
        "summary": {
            "verdict": verdict, "counts": counts, "n_defects": len(detections),
            "image_size": {"w": int(W), "h": int(H)},
            "inference_ms": inference_ms, "total_ms": total_ms,
        },
        "detections": detections,
        "annotated_image": f"data:image/jpeg;base64,{b64}",
    }
