'use client'

import { useState, useEffect } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import styles from './ResponsiveLayout.module.css'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  showFooter?: boolean
}

export default function ResponsiveLayout({
  children,
  showSidebar = true,
  showFooter = true
}: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
      // En mobile, cerrar sidebar automáticamente
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen)
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed)
    }
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className={`${styles.container} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      {/* Header */}
      <Header 
        className={styles.header}
      />

      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onClose={closeSidebar}
          onToggle={toggleSidebar}
          isMobile={isMobile}
          className={styles.sidebar}
        />
      )}

      {/* Overlay para móvil */}
      {isMobile && isSidebarOpen && (
        <div 
          className={styles.sidebarOverlay}
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main Canvas Area */}
      <main className={styles.mainCanvas}>
        <div className={styles.canvasContent}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {showFooter && (
        <Footer className={styles.footer} />
      )}
    </div>
  )
}
