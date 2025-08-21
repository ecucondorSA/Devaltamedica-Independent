declare module '@altamedica/auth/constants/cookies' {
  export const AUTH_COOKIES: {
    readonly token: string;
    readonly refresh: string;
    readonly user: string;
  };
  export const LEGACY_AUTH_COOKIES: {
    readonly token: string;
    readonly refresh: string;
    readonly user: string;
  };
}
