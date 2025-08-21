'use client';

import { useEffect } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
type MetricName = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';

interface Metric {
  name: MetricName;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender' | 'restore';
}

// Thresholds for metrics (in milliseconds except CLS)
const METRIC_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = METRIC_THRESHOLDS[name];
  if (!threshold) return 'needs-improvement';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function getMetricEmoji(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good': return '✅';
    case 'needs-improvement': return '⚠️';
    case 'poor': return '❌';
  }
}

async function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const emoji = getMetricEmoji(metric.rating);
    logger.info(
      `%c${emoji} Web Vitals [${metric.name}]`,
      `color: ${metric.rating === 'good' ? '#10b981' : metric.rating === 'needs-improvement' ? '#f59e0b' : '#ef4444'}; font-weight: bold;`,
      {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType
      }
    );
  }

  // Send to analytics endpoint (if available)
  try {
    // Only send if we have an API endpoint configured
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    }
  } catch (error) {
    // Silently fail - don't break the app for analytics
    logger.debug('Failed to send metrics:', error);
  }
}

export default function WebVitalsReporter() {
  useEffect(() => {
    // Only load web-vitals library if we're in the browser
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFCP, onFID, onINP, onLCP, onTTFB }) => {
        // Report all web vitals metrics
        onCLS((metric) => sendToAnalytics({ ...metric, rating: getRating('CLS', metric.value) } as Metric));
        onFCP((metric) => sendToAnalytics({ ...metric, rating: getRating('FCP', metric.value) } as Metric));
        onFID((metric) => sendToAnalytics({ ...metric, rating: getRating('FID', metric.value) } as Metric));
        onINP((metric) => sendToAnalytics({ ...metric, rating: getRating('INP', metric.value) } as Metric));
        onLCP((metric) => sendToAnalytics({ ...metric, rating: getRating('LCP', metric.value) } as Metric));
        onTTFB((metric) => sendToAnalytics({ ...metric, rating: getRating('TTFB', metric.value) } as Metric));

        // Log summary table in development
        if (process.env.NODE_ENV === 'development') {
          let collectedMetrics: Partial<Record<MetricName, Metric>> = {};
          
          const logSummary = () => {
            if (Object.keys(collectedMetrics).length > 0) {
              console.table(
                Object.entries(collectedMetrics).reduce((acc, [key, metric]) => {
                  if (metric) {
                    acc[key] = {
                      value: metric.value.toFixed(key === 'CLS' ? 3 : 0),
                      rating: metric.rating,
                      emoji: getMetricEmoji(metric.rating),
                    };
                  }
                  return acc;
                }, {} as Record<string, any>)
              );
            }
          };

          // Collect metrics and log after initial load
          onCLS((metric) => { collectedMetrics.CLS = { ...metric, rating: getRating('CLS', metric.value) } as Metric; });
          onFCP((metric) => { collectedMetrics.FCP = { ...metric, rating: getRating('FCP', metric.value) } as Metric; });
          onFID((metric) => { collectedMetrics.FID = { ...metric, rating: getRating('FID', metric.value) } as Metric; });
          onINP((metric) => { collectedMetrics.INP = { ...metric, rating: getRating('INP', metric.value) } as Metric; });
          onLCP((metric) => { collectedMetrics.LCP = { ...metric, rating: getRating('LCP', metric.value) } as Metric; });
          onTTFB((metric) => { collectedMetrics.TTFB = { ...metric, rating: getRating('TTFB', metric.value) } as Metric; });

          // Log summary after page load
          setTimeout(logSummary, 5000);
        }
      });
    }
  }, []);

  return null; // This component doesn't render anything
}