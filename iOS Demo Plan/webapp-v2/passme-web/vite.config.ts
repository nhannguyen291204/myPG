import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Tailwind v4 dùng plugin Vite (không cần PostCSS / tailwind.config.js)
  plugins: [react(), tailwindcss()],
  server: {
    // host: true -> bind 0.0.0.0 để iPhone/Android cùng Wi-Fi mở được http://192.168.100.7:5173
    host: true,
    port: 5173,
  },
})
