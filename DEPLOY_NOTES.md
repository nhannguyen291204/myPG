# Deploy Notes — Sáng mai khi có bottle_defect.pt

## Swap model mới — 1 phút, 4 lệnh

```bash
cd "iOS Demo Plan/backend"   # từ thư mục gốc dự án

# 1. Backup crack model cũ (phòng demo bottle fail thì roll-back nhanh)
cp best.pt best_crack.pt

# 2. Copy model mới (sau khi download từ Colab)
cp ~/Downloads/bottle_defect.pt best.pt

# 3. SỬA 1 DÒNG TRONG app.py:
#    Tìm: IGNORE_CLASS_NAMES = ["no_crack"]
#    Sửa thành: IGNORE_CLASS_NAMES = []
#    (Vì bottle_defect.pt chỉ có 1 class "defect", không cần filter)

# 4. Restart backend (Ctrl+C terminal cũ rồi):
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Roll-back về crack model (nếu bottle model dở):

```bash
cp best_crack.pt best.pt
# Sửa app.py: IGNORE_CLASS_NAMES = ["no_crack"]
# Restart
```

## Test sau swap

```bash
# Terminal khác:
cd "iOS Demo Plan/backend"   # từ thư mục gốc dự án
source .venv/bin/activate

# Health check
curl http://192.168.100.7:8000/health

# Test với 1 ảnh perfect (mong đợi PASS xanh, không có detection)
curl -s -X POST -F "file=@<ảnh_perfect>.jpg" http://localhost:8000/detect | python /tmp/check.py

# Test với 1 ảnh damaged (mong đợi REJECT đỏ, có detection)
curl -s -X POST -F "file=@<ảnh_damaged>.jpg" http://localhost:8000/detect | python /tmp/check.py
```

## Trên iPhone

- Expo Go đã có server quảng bá (nếu npx expo start vẫn chạy)
- Tap server → app load lại tự động (Metro hot reload)
- Tap "Chụp ảnh" → chụp chai perfect → mong đợi badge PASS xanh
- Tap "Chụp ảnh" → chụp chai damaged → mong đợi badge REJECT đỏ + box

## Nếu detection sai (false positive trên ảnh perfect)

→ Tăng `CONF_THRES = 0.25` lên `0.45` trong app.py + restart. Model sẽ chỉ giữ detection cực confident.

## Nếu detection miss (không detect được damage rõ)

→ Giảm `CONF_THRES` xuống `0.15` trong app.py + restart. Sensitivity cao hơn.

## Nếu TAMU level toàn ra U (chai damaged nào cũng REJECT)

→ Sửa TAMU_BANDS, tăng các ngưỡng (vd `0.05 → 0.10`, `0.15 → 0.25`) để có thêm A/M không chỉ U.

## Backup plan nếu bottle model FAIL hoàn toàn

1. Roll-back về best_crack.pt (lệnh ở trên)
2. Demo bằng `real_crack.jpeg` AirDrop sẵn trên iPhone
3. Câu chuyện: "Demo POC pipeline + slide kế hoạch fine-tune custom"
4. **An toàn 95% — không sợ embarrassing**
