'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useNavigationHistory } from '@/hooks/use-navigation-history'

interface NavigationEntry {
  pathname: string
  hash: string
  timestamp: number
}

interface NavigationContextType {
  storePreviousPage: (pathname?: string, hash?: string) => void
  getPreviousPage: () => NavigationEntry | null
  getPreviousPageUrl: () => string | null
  navigateBack: (fallbackUrl?: string) => void
  clearHistory: () => void
  previousPage: NavigationEntry | null
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
  children: ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const navigationMethods = useNavigationHistory()

  return (
    <NavigationContext.Provider value={navigationMethods}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  
  return context
} 