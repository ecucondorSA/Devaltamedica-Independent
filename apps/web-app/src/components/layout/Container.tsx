'use client'

import { cn } from '@altamedica/utils'
import { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  centerContent?: boolean
}

export function Container({ 
  children, 
  className, 
  size = 'xl',
  padding = 'md',
  centerContent = false
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-screen-sm',    // 640px
    md: 'max-w-screen-md',    // 768px
    lg: 'max-w-screen-lg',    // 1024px
    xl: 'max-w-screen-xl',    // 1280px
    '2xl': 'max-w-screen-2xl', // 1536px
    full: 'max-w-none'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-4 sm:px-6',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12'
  }

  return (
    <div 
      className={cn(
        'mx-auto w-full',
        sizeClasses[size],
        paddingClasses[padding],
        centerContent && 'flex flex-col items-center justify-center',
        className
      )}
    >
      {children}
    </div>
  )
}
