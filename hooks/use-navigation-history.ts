'use client'

import { useState, useEffect, useCallback } from 'react'

interface NavigationEntry {
  pathname: string
  hash: string
  timestamp: number
}

const STORAGE_KEY = 'gmail-navigation-history'
const MAX_HISTORY_SIZE = 10

export function useNavigationHistory() {
  const [previousPage, setPreviousPage] = useState<NavigationEntry | null>(null)

  // Load previous page from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const history: NavigationEntry[] = JSON.parse(stored)
          if (history.length > 0) {
            setPreviousPage(history[history.length - 1])
          }
        }
      } catch (error) {
        console.error('Error loading navigation history:', error)
      }
    }
  }, [])

  // Store current page before navigation
  const storePreviousPage = useCallback((pathname?: string, hash?: string) => {
    if (typeof window === 'undefined') return

    try {
      const currentPathname = pathname || window.location.pathname
      const currentHash = hash || window.location.hash
      
      const entry: NavigationEntry = {
        pathname: currentPathname,
        hash: currentHash,
        timestamp: Date.now()
      }

      // Get existing history
      const stored = localStorage.getItem(STORAGE_KEY)
      let history: NavigationEntry[] = stored ? JSON.parse(stored) : []

      // Add new entry
      history.push(entry)

      // Keep only recent entries
      if (history.length > MAX_HISTORY_SIZE) {
        history = history.slice(-MAX_HISTORY_SIZE)
      }

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
      
      // Update state
      setPreviousPage(entry)
    } catch (error) {
      console.error('Error storing navigation history:', error)
    }
  }, [])

  // Get the most recent previous page
  const getPreviousPage = useCallback((): NavigationEntry | null => {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const history: NavigationEntry[] = JSON.parse(stored)
        // Return the most recent entry that's not the current page
        const currentPath = window.location.pathname
        
        for (let i = history.length - 1; i >= 0; i--) {
          const entry = history[i]
          // Return if it's a different page or has a hash (mail list pages)
          if (entry.pathname !== currentPath || entry.hash) {
            return entry
          }
        }
      }
    } catch (error) {
      console.error('Error getting previous page:', error)
    }
    
    return null
  }, [])

  // Navigate back to previous page
  const navigateBack = useCallback((fallbackUrl: string = '/dashboard/mail#inbox') => {
    const previous = getPreviousPage()
    
    if (previous) {
      const url = `${previous.pathname}${previous.hash}`
      window.location.href = url
    } else {
      window.location.href = fallbackUrl
    }
  }, [getPreviousPage])

  // Clear navigation history
  const clearHistory = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY)
        setPreviousPage(null)
      } catch (error) {
        console.error('Error clearing navigation history:', error)
      }
    }
  }, [])

  // Get formatted previous page URL
  const getPreviousPageUrl = useCallback((): string | null => {
    const previous = getPreviousPage()
    return previous ? `${previous.pathname}${previous.hash}` : null
  }, [getPreviousPage])

  return {
    storePreviousPage,
    getPreviousPage,
    getPreviousPageUrl,
    navigateBack,
    clearHistory,
    previousPage
  }
} 