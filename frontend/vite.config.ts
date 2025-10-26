import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false, // Don't auto-open in container builds
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // Better visualization for optimization
    }),
  ],
  define: {
    // Enable axe-core in development mode
    __DEV_AXE_ENABLED__: mode === 'development',
  },
  build: {
    // Enhanced chunking configuration for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for large dependencies
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-utils': ['axios', 'zustand', 'jwt-decode'],
          // DnD Kit as separate chunk (used mainly in action items)
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // Stripe as separate chunk (used only in token purchase)
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
        }
      }
    },
    // Set chunk size warning limit to catch large chunks
    chunkSizeWarningLimit: 500, // 500kB limit to encourage optimization
    // Analyze bundle in analyze mode
    reportCompressedSize: true,
  },
}))
