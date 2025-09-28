import { afterEach, vi, expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Mock localStorage for theme and environment preferences
const mockStorage = () => ({
  getItem: vi.fn(() => null),
  setItem: vi.fn(() => null),
  removeItem: vi.fn(() => null),
  clear: vi.fn(() => null),
  length: 0,
  key: vi.fn(() => null),
});

Object.defineProperty(window, 'localStorage', {
  value: mockStorage(),
  writable: true,
});

// Mock window.matchMedia for Material-UI and theme context
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Run cleanup after each test case
afterEach(() => {
  cleanup()
})
