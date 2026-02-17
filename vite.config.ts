import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // This handles the CSS without needing PostCSS
  ],
  resolve: {
    alias: {
      // This tells Vite that @/ means the src folder
      "@": path.resolve(__dirname, "./src"),
    },
  },
})