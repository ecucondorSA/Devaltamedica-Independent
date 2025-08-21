import { useMemo } from 'react';

export type ParamsObject = Record<string, string | string[] | undefined>;

export interface UseParamsReturn {
  params: ParamsObject;
  searchParams: URLSearchParams;
  getParam: (key: string) => string | undefined;
  setParam: (key: string, value: string) => void;
}

export const useParams = (): UseParamsReturn => {
  const params = useMemo(() => {
    if (typeof window === 'undefined') return {};
    
    const urlParams = new URLSearchParams(window.location.search);
    const result: ParamsObject = {};
    
    urlParams.forEach((value, key) => {
      result[key] = value;
    });
    
    return result;
  }, []);

  const searchParams = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const getParam = (key: string): string | undefined => {
    return params[key] as string | undefined;
  };

  const setParam = (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set(key, value);
      window.history.replaceState({}, '', url.toString());
    }
  };

  return {
    params,
    searchParams,
    getParam,
    setParam,
  };
};