/// <reference types="vite/client" />

// Kiểu cho biến môi trường tuỳ biến. Declaration merging với ImportMetaEnv của Vite.
interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
