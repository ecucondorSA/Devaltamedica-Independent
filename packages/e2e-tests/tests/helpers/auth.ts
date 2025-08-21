import { APIRequestContext, Page } from '@playwright/test';

/**
 * Autenticación stub para E2E multi-área.
 * En entorno local usamos inicio simulado (E2E_USE_MOCK_LOGIN=1).
 * Si en el futuro se requiere login real, este helper deberá:
 *  - Navegar a /login de cada app y completar el flujo
 *  - O invocar endpoints del api-server que setean cookies HttpOnly
 */
export async function authenticateAs(page: Page, role: 'patient' | 'doctor' | 'company' | 'companie', email?: string) {
  // No-op por ahora: los tests sólo verifican navegación y disponibilidad.
  // Dejamos trazas para depuración.
  await page.addInitScript((r, e) => {
    // Bandera visible en window para debugging manual si es necesario
    // @ts-ignore
    window.__ALTAMEDICA_E2E__ = { role: r, email: e, mock: true };
  }, role, email);
}

const PRIMARY_API = process.env.API_BASE_URL || 'http://localhost:3001';
const FALLBACK_API = 'http://localhost:3002';

export type Credentials = { email: string; password: string };

export async function loginViaApi(
  ctx: APIRequestContext,
  creds: Credentials
): Promise<{ status: number; body: any }> {
  // Intenta API primaria y si hay error de red o 5xx, reintenta en fallback (3002)
  const tryLogin = async (base: string) => {
    const res = await ctx.post(`${base}/api/v1/auth/sso`, {
      data: creds,
      headers: { 'Content-Type': 'application/json' },
    });
    let body: any = null;
    try {
      body = await res.json();
    } catch {}
    return { status: res.status(), body };
  };

  try {
    const first = await tryLogin(PRIMARY_API);
    if (first.status >= 200 && first.status < 500) return first;
  } catch (e) {
    // network error → fallback
  }
  try {
    return await tryLogin(FALLBACK_API);
  } catch (e) {
    return { status: 599, body: { error: 'network_error' } };
  }
}

export async function persistAuthToPage(
  ctx: APIRequestContext,
  page: Page,
  storagePath: string
) {
  // Sincroniza cookies del contexto API hacia el browser context
  const state = await ctx.storageState();
  if (state.cookies?.length) {
    await page.context().addCookies(
      state.cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain || 'localhost',
        path: c.path || '/',
        httpOnly: c.httpOnly,
        secure: !!c.secure,
        sameSite: (c.sameSite as any) || 'Lax',
        expires: c.expires,
      }))
    );
  }
  await page.context().storageState({ path: storagePath });
}

export async function loginAndSaveState(
  ctx: APIRequestContext,
  page: Page,
  creds: Credentials,
  storagePath: string
) {
  const { status } = await loginViaApi(ctx, creds);
  if (![200, 201].includes(status)) {
    throw new Error(`Login API failed with status ${status}`);
  }
  await persistAuthToPage(ctx, page, storagePath);
}

// Utilidad opcional: login contra el endpoint mock de pruebas (cuando haya que usar usuarios de test del API)
export async function loginViaMockTestEndpoint(
  ctx: APIRequestContext,
  page: Page,
  email: string,
  storagePath: string,
  password: string = 'test123456'
) {
  const tryLogin = async (base: string) =>
    ctx.post(`${base}/api/v1/auth/test-login`, {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
    });
  let res = await tryLogin(PRIMARY_API);
  if (!res.ok()) {
    res = await tryLogin(FALLBACK_API);
  }
  if (!res.ok()) {
    throw new Error(`Mock login failed with status ${res.status()}`);
  }
  await persistAuthToPage(ctx, page, storagePath);
}
