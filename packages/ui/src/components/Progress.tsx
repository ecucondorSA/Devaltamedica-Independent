import * as React from 'react';
import { cn } from '../lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = 'md',
      variant = 'default',
      showLabel = false,
      label,
      ...props
    },
    ref,
  ) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };

    const variantClasses = {
      default: 'bg-blue-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      danger: 'bg-red-600',
    };

    const backgroundVariantClasses = {
      default: 'bg-blue-100',
      success: 'bg-green-100',
      warning: 'bg-yellow-100',
      danger: 'bg-red-100',
    };

    return (
      <div className={cn('w-full', className)} ref={ref} {...props}>
        {(showLabel || label) && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {label || `${Math.round(percentage)}%`}
            </span>
            {showLabel && !label && (
              <span className="text-sm text-gray-500">
                {value}/{max}
              </span>
            )}
          </div>
        )}
        <div
          className={cn(
            'w-full rounded-full overflow-hidden',
            sizeClasses[size],
            backgroundVariantClasses[variant],
          )}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-in-out',
              variantClasses[variant],
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label || `Progress: ${Math.round(percentage)}%`}
          />
        </div>
      </div>
    );
  },
);

Progress.displayName = 'Progress';

export { Progress };
export type { ProgressProps };
