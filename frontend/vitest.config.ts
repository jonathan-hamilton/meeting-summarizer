/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      'src/__tests__/mocks/**',
      'src/__tests__/utils/**',
      'src/__tests__/disabled/**',
      'src/__tests__/setup.ts'
    ],
  },
  resolve: {
    alias: {
      '@mui/icons-material': path.resolve(__dirname, 'src/__tests__/mocks/@mui/icons-material.ts')
    }
  }
})
