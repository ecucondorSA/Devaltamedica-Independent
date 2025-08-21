'use client'

import { cn } from '@altamedica/utils'
import { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { Container } from './Container'

interface LayoutProps {
  children: ReactNode
  className?: string
  headerProps?: {
    title?: string
    subtitle?: string
    showMenuToggle?: boolean
    onMenuToggle?: () => void
  }
  showHeader?: boolean
  showFooter?: boolean
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  mainClassName?: string
}

export function Layout({ 
  children, 
  className,
  headerProps,
  showHeader = true,
  showFooter = true,
  containerSize = 'xl',
  mainClassName
}: LayoutProps) {
  return (
    <div className={cn('layout-grid', className)}>
      {showHeader && (
        <Header 
          className="layout-header"
          {...headerProps}
        />
      )}
      
      <main 
        id="main-content"
        className={cn('layout-main', mainClassName)}
      >
        <Container size={containerSize}>
          {children}
        </Container>
      </main>
      
      {showFooter && (
        <Footer className="layout-footer" />
      )}
    </div>
  )
}
