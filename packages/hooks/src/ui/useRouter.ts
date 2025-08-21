import { useCallback } from 'react';

export interface RouterState {
  pathname: string;
  query: Record<string, string>;
  asPath: string;
}

export interface UseRouterReturn extends RouterState {
  push: (url: string) => Promise<void>;
  replace: (url: string) => Promise<void>;
  back: () => void;
  reload: () => void;
}

export const useRouter = (): UseRouterReturn => {
  const push = useCallback(async (url: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }, []);

  const replace = useCallback(async (url: string) => {
    if (typeof window !== 'undefined') {
      window.location.replace(url);
    }
  }, []);

  const back = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

  const reload = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  return {
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    query: {},
    asPath: typeof window !== 'undefined' ? window.location.pathname : '/',
    push,
    replace,
    back,
    reload,
  };
};