'use client'

import { APIProvider } from '@/providers/APIProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <APIProvider>
      {children}
    </APIProvider>
  )
}
