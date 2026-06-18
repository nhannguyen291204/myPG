# Photo Collection Checklist — Chai Bup Non Tea 365

**Mục tiêu:** 50 ảnh (25 perfect + 25 damaged) để train YOLOv8n custom.
**Thời gian:** ~30 phút.
**Subject chọn:** chai **Bup Non Tea 365** (lý do: label đơn giản xanh-trắng, nhựa trong, có date code → câu chuyện QA mạnh).

---

## Setup chụp (5 phút)

**Bắt buộc:**
- 1 chai Bup Non Tea (uống cạn hoặc còn đầy đều OK)
- **Nền sạch:** tờ giấy A4 trắng đặt lên bàn, dựng 1 tờ A4 thứ 2 sau lưng chai làm phông. **KHÔNG có hộp protein, dây cáp, ổ điện trong khung!**
- **Ánh sáng:** ngày chụp ban ngày + ban đêm có đèn LED trắng → đa dạng

**Khuyến nghị:**
- Khăn xám trơn / mặt bàn gỗ sạch không vật khác → thêm 1 background nữa
- 1 cái đèn pin điện thoại bật bằng tay → tạo angle ánh sáng khác nhau

---

## 25 ảnh PERFECT (chai chưa móp, ~10 phút)

Đếm theo bullet, mỗi gạch chụp 1 ảnh khác nhau:

**8 góc xoay quanh chai × 2 khoảng cách = 16 ảnh:**
- [ ] Front, gần (chai chiếm ~70% khung)
- [ ] Front, xa (chai chiếm ~40% khung)
- [ ] Back (label sau), gần
- [ ] Back, xa
- [ ] Side trái, gần
- [ ] Side trái, xa
- [ ] Side phải, gần
- [ ] Side phải, xa
- [ ] 45° trước-trái, gần
- [ ] 45° trước-trái, xa
- [ ] 45° trước-phải, gần
- [ ] 45° trước-phải, xa
- [ ] 45° sau-trái, gần
- [ ] 45° sau-trái, xa
- [ ] 45° sau-phải, gần
- [ ] 45° sau-phải, xa

**4 ảnh top-down detail (đa dạng cap):**
- [ ] Top-down nhìn nắp xanh (giống IMG_9542 anh chụp)
- [ ] Top-down hơi nghiêng 30°
- [ ] Close-up nắp + cổ chai
- [ ] Close-up date code (NSX/HSD) — đây là shot QUAN TRỌNG cho narrative QA

**3 ảnh "lifestyle" (nền khác):**
- [ ] Chai trên nền gỗ bàn (chỉ chai + gỗ, không có gì khác)
- [ ] Chai trên khăn xám
- [ ] Chai gần cửa sổ (ánh sáng tự nhiên)

**2 ảnh nghiêng/nằm:**
- [ ] Chai nghiêng 30°
- [ ] Chai nằm ngang

→ **Tổng 25 ảnh perfect.**

---

## TẠO DAMAGE (5 phút) — anh "làm hỏng" chai

Mục tiêu: nhiều loại damage khác nhau để model học variety. Làm theo thứ tự:

1. **Cào nhẹ label** bằng móng tay / đồng xu — tạo 1-2 vết xước dài trên label
2. **Bóp móp** 1 bên thân chai 1 vết móp ~2-3cm
3. **Bẻ cong nhẹ** phần đáy hoặc cổ chai
4. **Cào sâu** thêm 1 vết khác phía bên kia
5. **Bóp móp lớn** 1 vết móp ~4-5cm bên còn lại
6. **Xé/tróc label** 1 đoạn ~2cm
7. **Móp đỉnh** (gần nắp) nếu được

→ Cuối cùng chai có ~5-7 vùng damage rõ ràng.

---

## 25 ảnh DAMAGED (~15 phút)

Quan trọng: **mỗi ảnh phải THẤY RÕ damage**. Lấy nhiều góc để model học từ nhiều phía:

**16 ảnh xoay quanh — chú trọng góc nhìn thấy damage rõ:**
- [ ] Front gần (damage thân trước rõ)
- [ ] Front xa
- [ ] Back gần (damage sau rõ)
- [ ] Back xa
- [ ] Side trái gần (move trái rõ)
- [ ] Side trái xa
- [ ] Side phải gần
- [ ] Side phải xa
- [ ] 4 góc 45° × 2 khoảng cách = 8 ảnh (chĩa rõ vào vùng damage)

**5 ảnh close-up từng loại damage:**
- [ ] Close-up vết móp lớn
- [ ] Close-up vết móp nhỏ
- [ ] Close-up vết xước trên label
- [ ] Close-up nắp bị móp (nếu có) hoặc damage đỉnh
- [ ] Close-up vết label bị tróc/rách

**4 ảnh background đa dạng:**
- [ ] Damaged chai trên nền gỗ
- [ ] Damaged chai trên nền khăn xám
- [ ] Damaged chai gần cửa sổ ánh sáng tự nhiên
- [ ] Damaged chai dưới đèn vàng phòng

→ **Tổng 25 ảnh damaged.**

---

## Sau khi chụp xong

- AirDrop tất cả 50 ảnh từ iPhone về Mac
- Tạo folder: `iOS Demo Plan/training/dataset_raw/` (trong thư mục gốc dự án)
- 25 perfect → đặt vào `dataset_raw/perfect/`
- 25 damaged → đặt vào `dataset_raw/damaged/`
- Báo em xong → mình sang bước Roboflow labeling.

---

## Tips chụp nhanh (em hỗ trợ anh đỡ mệt)

- Để iPhone 1 chỗ cố định, anh xoay chai → đỡ phải di chuyển
- Lock exposure (long-press camera) khi đổi background → ảnh đồng đều
- Chụp burst rồi pick 1 cái tốt nhất → nhanh hơn 1 lần 1 ảnh
- **KHÔNG dùng zoom**, di chuyển vật lý → ảnh sắc nét
- Mỗi shot kiểm nhanh: thấy chai rõ? thấy damage rõ? thấy nền sạch không có vật lạ?
