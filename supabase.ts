import { createClient } from "@supabase/supabase-js";

// Khởi tạo client Supabase. anon key là khoá CÔNG KHAI — an toàn để ở client
// vì dữ liệu được bảo vệ bằng RLS ở tầng database.
// TUYỆT ĐỐI KHÔNG đặt service_role key ở đây (nó vượt mọi RLS).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "[supabase] Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong .env — đăng nhập và dữ liệu sẽ không chạy.",
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");

// Bucket lưu ảnh annotate (private — chỉ truy cập qua signed URL).
export const INSPECTIONS_BUCKET = "inspections";
