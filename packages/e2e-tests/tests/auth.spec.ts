import { expect, request, test } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';

// Basic SSO session verification

test.describe('@smoke auth', () => {
  test('verify SSO endpoint responds', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${API_BASE}/api/v1/auth/verify`);
    // In unauthenticated state it may return 401; still assert it responds
    expect([200, 401, 403]).toContain(res.status());
  });
});
