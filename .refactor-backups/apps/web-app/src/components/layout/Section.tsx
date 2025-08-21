'use client'

import { cn } from '@altamedica/utils'
import { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  background?: 'none' | 'white' | 'gray' | 'primary' | 'gradient'
  as?: 'section' | 'div' | 'article' | 'aside' | 'main'
  id?: string
}

export function Section({ 
  children, 
  className, 
  padding = 'md',
  background = 'none',
  as: Component = 'section',
  id
}: SectionProps) {
  const paddingClasses = {
    none: '',
    sm: 'py-8 sm:py-12',
    md: 'py-12 sm:py-16',
    lg: 'py-16 sm:py-20',
    xl: 'py-20 sm:py-24'
  }

  const backgroundClasses = {
    none: '',
    white: 'bg-white',
    gray: 'bg-gray-50',
    primary: 'bg-primary-50',
    gradient: 'bg-gradient-to-br from-primary-50 to-blue-50'
  }

  return (
    <Component 
      id={id}
      className={cn(
        'relative',
        paddingClasses[padding],
        backgroundClasses[background],
        className
      )}
    >
      {children}
    </Component>
  )
}
