// ABOUTME: Unit tests for API client
// ABOUTME: Tests API base configuration and error handling

import { describe, it, expect } from 'vitest';
import { apiClient } from './client';

describe('API Client', () => {
  it('has correct base URL configured', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:8000');
  });

  it('has correct timeout configured', () => {
    expect(apiClient.defaults.timeout).toBe(10000);
  });

  it('has JSON content type header', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });
});
