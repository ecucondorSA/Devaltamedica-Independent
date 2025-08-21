import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface UseBreadcrumbsOptions {
  separator?: string;
  maxItems?: number;
}

export interface UseBreadcrumbsReturn {
  items: BreadcrumbItem[];
  separator: string;
}

export const useBreadcrumbs = (
  path: string = '',
  options: UseBreadcrumbsOptions = {}
): UseBreadcrumbsReturn => {
  const { separator = '/', maxItems = 5 } = options;

  const items = useMemo(() => {
    if (!path) return [];
    
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Inicio', href: '/' }
    ];

    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      const isActive = index === segments.length - 1;
      
      breadcrumbs.push({ label, href, isActive });
    });

    return breadcrumbs.slice(-maxItems);
  }, [path, maxItems]);

  return { items, separator };
};