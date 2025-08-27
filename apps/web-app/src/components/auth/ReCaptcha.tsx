'use client';

import { useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';

interface ReCaptchaProps {
  siteKey?: string;
  onVerify: (token: string) => void;
  onError?: (error: Error) => void;
  onExpired?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  platform?: 'web' | 'ios' | 'android';
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (container: HTMLElement | string, options: any) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
      execute: (widgetId?: number) => void;
    };
  }
}

export function ReCaptcha({
  siteKey,
  onVerify,
  onError,
  onExpired,
  theme = 'light',
  size = 'normal',
  platform = 'web',
}: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  const getSiteKey = () => {
    if (siteKey) return siteKey;

    switch (platform) {
      case 'ios':
        return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY_IOS;
      case 'android':
        return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY_ANDROID;
      case 'web':
      default:
        return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY_WEB;
    }
  };

  const handleCallback = useCallback(
    (token: string) => {
      if (token) {
        onVerify(token);
      }
    },
    [onVerify],
  );

  const handleExpiredCallback = useCallback(() => {
    onExpired?.();
  }, [onExpired]);

  const handleErrorCallback = useCallback(() => {
    onError?.(new Error('ReCAPTCHA error occurred'));
  }, [onError]);

  const renderReCaptcha = useCallback(() => {
    const key = getSiteKey();

    if (!key) {
      console.error('ReCAPTCHA site key not found for platform:', platform);
      onError?.(new Error('ReCAPTCHA site key not configured'));
      return;
    }

    if (containerRef.current && window.grecaptcha) {
      try {
        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: key,
          callback: handleCallback,
          'expired-callback': handleExpiredCallback,
          'error-callback': handleErrorCallback,
          theme,
          size,
        });
      } catch (error) {
        console.error('Error rendering ReCAPTCHA:', error);
        onError?.(error as Error);
      }
    }
  }, [platform, theme, size, handleCallback, handleExpiredCallback, handleErrorCallback, onError]);

  useEffect(() => {
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        renderReCaptcha();
      });
    }
  }, [renderReCaptcha]);

  const reset = useCallback(() => {
    if (window.grecaptcha && widgetIdRef.current !== null) {
      window.grecaptcha.reset(widgetIdRef.current);
    }
  }, []);

  const execute = useCallback(() => {
    if (window.grecaptcha && widgetIdRef.current !== null) {
      window.grecaptcha.execute(widgetIdRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current !== null) {
        try {
          reset();
        } catch (error) {
          console.error('Error resetting ReCAPTCHA on cleanup:', error);
        }
      }
    };
  }, [reset]);

  const key = getSiteKey();

  if (!key) {
    return (
      <div className="text-red-500 text-sm">
        ReCAPTCHA no configurado para plataforma: {platform}
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        strategy="lazyOnload"
        onLoad={() => {
          window.grecaptcha.ready(() => {
            renderReCaptcha();
          });
        }}
      />
      <div ref={containerRef} className="g-recaptcha" />
    </>
  );
}

export function useReCaptcha() {
  const reset = useCallback(() => {
    if (window.grecaptcha) {
      window.grecaptcha.reset();
    }
  }, []);

  const execute = useCallback(() => {
    if (window.grecaptcha) {
      window.grecaptcha.execute();
    }
  }, []);

  return { reset, execute };
}
