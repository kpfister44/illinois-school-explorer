// ABOUTME: Test setup file that runs before all tests
// ABOUTME: Imports jest-dom matchers for better assertions

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});
