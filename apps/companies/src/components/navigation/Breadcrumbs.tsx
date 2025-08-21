'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useCompanyLayout } from '@/components/layout/CompanyLayoutProvider';
import { cn } from '@altamedica/utils';

interface BreadcrumbsProps {
  className?: string;
  showHome?: boolean;
}

export function Breadcrumbs({ className, showHome = true }: BreadcrumbsProps) {
  const { breadcrumbs } = useCompanyLayout();

  if (breadcrumbs.length <= 1 && !showHome) {
    return null;
  }

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 mx-1 flex-shrink-0" />
            )}
            <div className="flex items-center">
              {index === 0 && showHome && (
                <Home className="h-4 w-4 text-gray-500 mr-1" />
              )}
              {breadcrumb.isActive ? (
                <span className="text-gray-600 font-medium">
                  {breadcrumb.label}
                </span>
              ) : (
                <Link
                  href={breadcrumb.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors hover:underline"
                >
                  {breadcrumb.label}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}