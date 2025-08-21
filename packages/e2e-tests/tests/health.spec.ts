import { expect, request, test } from '@playwright/test';

const PRIMARY_API = process.env.API_BASE_URL || 'http://localhost:3001';
const FALLBACK_API = 'http://localhost:3002';

// Simple API health smoke

test('api health is healthy (summary)', async ({}) => {
  const api = await request.newContext();
  let res = await api.get(`${PRIMARY_API}/api/v1/health`);
  if (!res.ok()) {
    res = await api.get(`${FALLBACK_API}/api/v1/health`);
  }
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json).toMatchObject({ ok: true });
});

test('api health live and ready', async ({}) => {
  const api = await request.newContext();
  let live = await api.get(`${PRIMARY_API}/api/v1/health/live`);
  if (!live.ok()) live = await api.get(`${FALLBACK_API}/api/v1/health/live`);
  expect(live.ok()).toBeTruthy();
  let ready = await api.get(`${PRIMARY_API}/api/v1/health/ready`);
  if (!ready.ok()) ready = await api.get(`${FALLBACK_API}/api/v1/health/ready`);
  expect(ready.ok()).toBeTruthy();
});
