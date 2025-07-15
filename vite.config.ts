import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    port: 4173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'sweeper-0yml.onrender.com',
      '.onrender.com'
    ]
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'localhost', 
      '127.0.0.1',
      'sweeper-0yml.onrender.com',
      '.onrender.com'
    ]
  }
})
