import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173 
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Manual chunking to split large files
        manualChunks: {
          // React and related libraries
          'react-vendor': ['react', 'react-dom'],
          
          // PDF libraries (largest chunk)
          'pdf-vendor': ['jspdf', 'jspdf-autotable'],
          
          // Chart libraries
          'chart-vendor': ['recharts'],
          
          // Supabase
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Icons
          'icons-vendor': ['lucide-react']
        }
      }
    },
    
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  }
})
