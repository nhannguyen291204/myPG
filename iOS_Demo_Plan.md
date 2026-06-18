# PassME — iOS Demo Plan (P&G AI Vision Inspection)

**Mục tiêu:** Một app iPhone chụp ảnh sản phẩm → gửi về backend chạy YOLO → trả về defect có bounding box + nhãn TAMU (màu) + kết luận PASS / RE-CHECK / REJECT.
**Deadline demo:** Thứ 4, 03/06/2026, 17:00 (cho P&G xem).
**Hôm nay:** Thứ 5, 28/05/2026 → còn ~6 ngày.

---

## 1. Kiến trúc (đã chốt)

```
[iPhone - Expo app]                 [Laptop/Mac - Backend]
 expo-camera / image-picker          FastAPI (Python)
   │  chụp/chọn ảnh                     │  /detect
   │  POST multipart ảnh  ───────────►  │  Ultralytics YOLO (best.pt)
   │                                    │  → boxes + conf + class
   │                                    │  → map TAMU theo diện tích bbox
   │  ◄───────────  JSON + ảnh annotate │  → vẽ box + nhãn + màu
   ▼                                    ▼
 hiển thị ảnh kết quả + badge PASS/RE-CHECK/REJECT
```

Lý do chọn: tái dùng `best.pt` không cần convert sang Core ML, tận dụng React của anh (Expo), chạy được trong 6 ngày, dễ đổi model sau này. iPhone và Mac nối chung **một hotspot điện thoại** (đừng phụ thuộc wifi hội trường).

## 2. Tech stack

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| App | Expo (React Native) + TypeScript | `expo-camera`, `expo-image-picker`, chạy qua Expo Go trên iPhone |
| Giao tiếp | `fetch` multipart/form-data | gửi ảnh JPEG về backend |
| Backend | FastAPI + Uvicorn | 1 endpoint `/detect` |
| Model | Ultralytics YOLOv8 (`best.pt`) | inference + NMS sẵn |
| TAMU | Map diện tích bbox → T/A/M/U | tái dùng ngưỡng nhóm |
| Vẽ | OpenCV (cv2) ở backend | box + label + màu |

## 3. Logic TAMU (tái dùng framework nhóm)

Mỗi detection có bbox → tính diện tích → map:

| Level | Ngưỡng diện tích (px², demo) | Action | Màu |
|---|---|---|---|
| T (Target) | area ≤ 100 | PASS | (không tô) |
| A (Acceptable) | 100 < area ≤ 350 | PASS | Xanh |
| M (Marginal) | 350 < area ≤ 1400 | RE-CHECK | Cam |
| U (Unacceptable) | area > 1400 | REJECT | Đỏ |

> **Lưu ý calibrate:** ngưỡng px² phụ thuộc độ phân giải & khoảng cách chụp. Trên ảnh điện thoại nên dùng **diện tích tương đối (% khung hình)** hoặc nhân hệ số. Để trong 1 hằng số config, tinh chỉnh ở Day 4 với đúng setup chụp. Kết luận sản phẩm = level cao nhất trong các defect (có 1 U → REJECT; có M → RE-CHECK; còn lại PASS).

## 4. Model dùng cho demo (đã tư vấn)

- **Chính:** `best.pt` (crack detector 2-class) — ổn định, đã chạy, dùng làm backbone để pipeline thật sự hoạt động.
- **TAMU:** map theo diện tích bbox như trên → vẫn kể trọn câu chuyện T/A/M/U + màu dù model chỉ là crack.
- **Tùy chọn (chỉ làm nếu Sun–Mon dư giờ):** label nhanh ~50–80 ảnh shape/artwork (ảnh tự chụp + public defect dataset) rồi fine-tune nhẹ trên Colab để "sát use-case" hơn. **Luôn giữ best.pt làm fallback.** Không đặt cược demo vào việc train kịp.

## 5. Kế hoạch ngày-theo-ngày

### Day 0 — Thứ 5 28/05 (phần còn lại hôm nay): Dựng khung
- [ ] Tạo repo `backend/`: cài `fastapi uvicorn ultralytics opencv-python python-multipart`
- [ ] Chạy thử inference `best.pt` trên 1 ảnh local, in ra boxes (kiểm tra model load OK)
- [ ] Dựng endpoint `/detect` trả JSON boxes (chưa cần TAMU/màu)
- [ ] `npx create-expo-app`, cài `expo-camera`, `expo-image-picker`; mở được app trên iPhone qua Expo Go

### Day 1 — Thứ 6 29/05: Backend hoàn chỉnh
- [ ] Viết hàm map TAMU theo diện tích → level + màu + action
- [ ] Vẽ box + label + màu lên ảnh (OpenCV), trả về cả JSON lẫn ảnh annotate (base64)
- [ ] Chốt JSON contract (mục 6)
- [ ] App: màn hình capture/pick ảnh → POST → in raw response

### Day 2 — Thứ 7 30/05: Nối đầu-cuối
- [ ] App: hiển thị ảnh annotate trả về + badge PASS/RE-CHECK/REJECT + đếm số defect mỗi level
- [ ] Nối iPhone ↔ Mac qua hotspot, test end-to-end trên **máy thật**
- [ ] Xử lý lỗi cơ bản (mất mạng, ảnh lỗi) + nút "Chụp lại"

### Day 3 — Chủ nhật 31/05: Polish + dữ liệu demo
- [ ] Làm gọn UI (loading, kết quả, retake), thêm hiển thị confidence
- [ ] Chuẩn bị **4 vật mẫu**: 1 tốt (PASS), 1 marginal (RE-CHECK), 1 lỗi rõ (REJECT), 1 dự phòng
- [ ] (Tùy chọn) label + fine-tune nhẹ nếu đang vượt tiến độ

### Day 4 — Thứ 2 01/06: Rehearsal + tinh chỉnh
- [ ] Chạy thử toàn bộ trên máy thật; **calibrate ngưỡng TAMU** với đúng khoảng cách/ánh sáng chụp
- [ ] Fix bug; **quay 1 video screen-record backup** phòng khi live demo lỗi

### Day 5 — Thứ 3 02/06: Đóng băng + dry-run
- [ ] Freeze feature (không thêm gì mới); chạy full dry-run theo kịch bản (mục 7)
- [ ] Chuẩn bị fallback: bộ ảnh mẫu nạp sẵn để chạy offline nếu camera/mạng trục trặc
- [ ] Buffer fix bug

### Demo day — Thứ 4 03/06: 
- [ ] Sáng: dry-run cuối, sạc đầy iPhone + Mac, bật hotspot, kiểm tra backend chạy
- [ ] 17:00: Demo cho P&G

## 6. JSON contract (app ↔ backend)

```json
{
  "summary": { "verdict": "REJECT", "counts": {"T":0,"A":1,"M":1,"U":2}, "n_defects": 4 },
  "detections": [
    { "class": "crack", "confidence": 0.91, "bbox": [x,y,w,h],
      "area": 1850, "tamu": "U", "action": "REJECT", "color": "#E53935" }
  ],
  "annotated_image": "data:image/jpeg;base64,...."
}
```

## 7. Kịch bản demo (~90 giây) cho P&G

1. (10s) Vấn đề: kiểm tra thủ công = nhiều "touch", chậm và không đồng nhất.
2. (15s) Mở app → chụp **sản phẩm tốt** → hiện PASS (xanh / không defect).
3. (20s) Chụp **sản phẩm marginal** → khung Cam, nhãn **M – RE-CHECK**.
4. (20s) Chụp **sản phẩm lỗi** → khung Đỏ, nhãn **U – REJECT** + confidence.
5. (15s) Nhấn mạnh: TAMU mapping + màu = ra quyết định ngay, giảm touch.
6. (10s) Hướng phát triển: customize theo data P&G, tích hợp vào dây chuyền.

## 8. Đề xuất / góp ý cho demo

- **Khung câu chuyện theo "touch":** mọi thứ quy về *giảm số lần con người phải can thiệp* — đúng ngôn ngữ P&G, đừng sa đà kỹ thuật.
- **Đặt kỳ vọng đúng:** nói thẳng model demo train trên data hạn chế (crack/ảnh mẫu) → đây là **proof-of-concept của pipeline**, sẽ *customize* khi có data P&G. Tránh hứa quá (over-promise) rồi bị hỏi khó.
- **Điểm nhấn bán hàng = màu TAMU** (xanh/cam/đỏ) + verdict PASS/RE-CHECK/REJECT. Đó là thứ P&G thấy "dùng được ngay".
- **Chống rủi ro live demo:**
  - iPhone + Mac chung **hotspot** riêng, không dùng wifi hội trường.
  - Có **video screen-record backup** + **bộ ảnh mẫu nạp sẵn** chạy offline.
  - Sạc đầy pin, mở sẵn backend trước khi vào phòng.
- **Chuẩn bị vật mẫu có defect thật** (vết nứt/xước rõ) để model crack detect chắc ăn; đừng demo trên vật model chưa từng thấy.
- **Xin feedback có định hướng:** hỏi P&G 2–3 câu cụ thể (defect nào ưu tiên? ngưỡng TAMU theo sản phẩm nào? format output cho dashboard?) → biến demo thành đầu vào cho Phase 2.
- **Đo 1 con số:** thời gian từ lúc chụp → ra verdict (vd <2s) để minh hoạ tốc độ so với check tay.

## 9. Rủi ro & fallback

| Rủi ro | Xử lý |
|---|---|
| Model chỉ detect crack, không có shape/artwork | Demo trên vật có vết nứt/xước; khung là *proof-of-concept pipeline*, customize sau |
| Mất mạng / backend lag khi demo | Hotspot riêng + video backup + ảnh mẫu offline |
| Ngưỡng TAMU không khớp ảnh điện thoại | Calibrate Day 4 bằng diện tích tương đối (% khung) |
| Không kịp fine-tune model mới | Giữ best.pt (đã quyết không đặt cược vào train kịp) |
| Expo build lỗi trên máy thật | Dùng Expo Go (không cần build native) để demo |
```
