// ABOUTME: Test setup file that runs before all tests
// ABOUTME: Imports jest-dom matchers for better assertions

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
