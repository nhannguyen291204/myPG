# Roboflow Labeling Guide — 45 phút

**Mục tiêu:** label vùng damage trên 25 ảnh damaged. Ảnh perfect không cần label (Roboflow sẽ coi là "negative sample").

---

## Bước 1: Sign-up Roboflow (3 phút)

1. Mở https://app.roboflow.com/login
2. Sign up bằng Google (cho nhanh) → free tier có sẵn (1 workspace, public, đủ dùng)
3. Vào dashboard

## Bước 2: Tạo project (2 phút)

1. Tap **+ Create New Project**
2. Project Name: `passme-bottle-defect`
3. **Project Type: Object Detection**
4. **What are you detecting? Classes:** gõ `defect` → Enter (chỉ 1 class)
5. Tap **Create Public Project** (free tier = public, OK cho demo)

## Bước 3: Upload 50 ảnh (5 phút)

1. Tap **Upload** ở sidebar
2. Drag-drop CẢ 50 ảnh (25 perfect + 25 damaged) vào — Roboflow auto-detect là JPEG/HEIC
3. Đợi upload xong (~1-2 phút)
4. Tap **Save and Continue**
5. **Train/Valid/Test split**: chọn `Train 80% / Valid 15% / Test 5%` (default OK)
6. Tap **Assign Images** → vào trạng thái "Unannotated"

## Bước 4: LABEL damage area (30 phút) — phần lâu nhất

1. Tap vào ảnh đầu tiên (Roboflow auto chọn 1 ảnh chưa label)
2. Trên thanh tool bên trái, chọn **Bounding Box** (icon ô vuông)
3. **Quy tắc label:**
   - **Ảnh PERFECT (25 ảnh):** KHÔNG vẽ box gì → tap **Save** ngay → next image. Roboflow coi là "no defect = negative sample". **Mỗi ảnh perfect chỉ mất 2 giây.**
   - **Ảnh DAMAGED (25 ảnh):** Vẽ box quanh **CHỖ DAMAGE** (không phải cả chai):
     - 1 vết móp → 1 box bao quanh vết móp
     - Nhiều vết → vẽ nhiều box (1 box / 1 vết)
     - Box ôm sát damage, không bao gồm phần lành
     - Chọn class `defect` cho mỗi box
     - Tap **Save**

→ **Mỗi ảnh damaged trung bình 30-60 giây.** 25 ảnh × 45s = ~20 phút.

**Tips label nhanh:**
- Bỏ qua ảnh damage quá khó nhìn — tốt hơn ít data sạch hơn nhiều data lộn
- Vẽ box hơi rộng hơn damage 1-2px là OK
- Nếu có vùng damage chồng lấn → vẽ 1 box bao cả 2

## Bước 5: Generate Dataset với Augmentation (5 phút)

1. Sidebar tap **Generate** → **+ New Version**
2. Pre-processing: để default (Auto-Orient + Resize 640×640)
3. **Augmentations** — chọn các option sau:
   - **Flip:** Horizontal ✓ (mirror left-right)
   - **Rotation:** ±15° (slight rotation)
   - **Brightness:** ±25%
   - **Saturation:** ±25%
   - **Blur:** Up to 1.5px (rất nhẹ)
   - **Noise:** Up to 2% (rất nhẹ)
   - **Max Augmentations per Image:** 3
4. **Outputs per training example:** 3 → 25 damaged × 3 = 75 augmented + 25 perfect = ~100 training images

5. Tap **Generate** → đợi ~1-2 phút Roboflow xử lý

## Bước 6: Export sang YOLOv8 format (2 phút)

1. Sau khi Generate xong, vào tab **Versions** chọn version vừa generate
2. Tap nút **Export Dataset** (góc phải-trên)
3. Format: chọn **YOLOv8**
4. Chọn **Show download code** (KHÔNG download zip!)
5. Roboflow sẽ hiện 1 đoạn code Python kiểu:
   ```python
   from roboflow import Roboflow
   rf = Roboflow(api_key="abc123...")
   project = rf.workspace("your-workspace").project("passme-bottle-defect")
   version = project.version(1)
   dataset = version.download("yolov8")
   ```

6. **COPY ĐOẠN CODE NÀY** — anh paste vào em hoặc em đưa thẳng vào Colab notebook bước tiếp theo.

---

## Sau khi xong → báo em paste đoạn code Roboflow.

Mình sang Colab training ngay. Em đã viết sẵn notebook `passme_train.ipynb` trong folder `training/`.
