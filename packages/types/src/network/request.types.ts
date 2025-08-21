/**
 * Network Request Types - Type-safe definitions
 * Reemplaza los 'any' types en network-debugger
 */

export interface NetworkRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData | URLSearchParams | ArrayBuffer | Blob;
  mode?: RequestMode;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
  keepalive?: boolean;
  signal?: AbortSignal;
}

export interface NetworkLog {
  timestamp: number;
  type: 'request' | 'response' | 'error' | 'redirect';
  method?: string;
  url: string;
  status?: number;
  headers?: Record<string, string>;
  body?: string | object | FormData;
  duration?: number;
  error?: Error;
}

export interface AuthStateLog {
  timestamp: number;
  event: string;
  user?: {
    uid: string;
    email: string;
    role: string;
    displayName?: string;
  };
  profile?: {
    profileComplete: boolean;
    lastLogin?: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
  url: string;
}

export interface DebuggerConfig {
  enabled: boolean;
  logRequests: boolean;
  logResponses: boolean;
  logErrors: boolean;
  logAuth: boolean;
  maxLogs: number;
  persistLogs: boolean;
}

export type FetchFunction = typeof window.fetch;
export type XMLHttpRequestOpen = XMLHttpRequest['open'];
export type XMLHttpRequestSend = XMLHttpRequest['send'];

export interface InterceptedFetch extends FetchFunction {
  _original?: FetchFunction;
}

export interface InterceptedXMLHttpRequest extends XMLHttpRequest {
  _original?: typeof XMLHttpRequest;
  _method?: string;
  _url?: string;
  _startTime?: number;
}