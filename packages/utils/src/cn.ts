import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes efficiently
 * Combines clsx and tailwind-merge for optimal class handling
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 *
 * @example
 * ```tsx
 * cn('px-2 py-1', 'px-4', 'bg-blue-500') // 'py-1 px-4 bg-blue-500'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Conditional class utility for medical-specific styling
 *
 * @param condition - Boolean condition
 * @param trueClass - Class to apply when condition is true
 * @param falseClass - Class to apply when condition is false (optional)
 * @returns Class string based on condition
 *
 * @example
 * ```tsx
 * medicalClass(isEmergency, 'text-red-500', 'text-green-500')
 * ```
 */
export function medicalClass(
  condition: boolean,
  trueClass: string,
  falseClass?: string
): string {
  return condition ? trueClass : falseClass || "";
}

/**
 * Status-based class utility for medical UI
 *
 * @param status - Medical status
 * @returns Appropriate class string for the status
 *
 * @example
 * ```tsx
 * statusClass('critical') // 'text-red-500 bg-red-50'
 * ```
 */
export function statusClass(
  status: "success" | "warning" | "error" | "info"
): string {
  const statusClasses = {
    success: "text-green-600 bg-green-50 border-green-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
    error: "text-red-600 bg-red-50 border-red-200",
    info: "text-blue-600 bg-blue-50 border-blue-200",
  };

  return statusClasses[status] || statusClasses.info;
}