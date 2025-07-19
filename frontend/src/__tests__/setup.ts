import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Material-UI icons to avoid file system issues
vi.mock('@mui/icons-material', () => ({
  ExpandMore: () => 'ExpandMore',
  ContentCopy: () => 'ContentCopy',
  Person: () => 'Person',
  Schedule: () => 'Schedule',
  VolumeUp: () => 'VolumeUp',
  CheckCircle: () => 'CheckCircle',
  Error: () => 'Error',
}));

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
  configurable: true,
  writable: true,
});
