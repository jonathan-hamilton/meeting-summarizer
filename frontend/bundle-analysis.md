# Bundle Analysis Commands

# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts:
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    // ... existing plugins
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
};
```

# Build and analyze
npm run build
# Opens stats.html automatically

# Check bundle size
npx vite-bundle-analyzer dist

# Performance testing commands
npm run test:coverage
npm run test -- --reporter=verbose --run
