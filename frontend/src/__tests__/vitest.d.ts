/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends matchers.TestingLibraryMatchers<string, T> {}
  }
}