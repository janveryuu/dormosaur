'use client'

import * as React from 'react'
import { MotionConfig } from 'framer-motion'

type Theme = 'light' | 'dark'

const ThemeContext = React.createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({ theme: 'light', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('light')

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    try {
      window.localStorage.setItem('dormosaur-theme', nextTheme)
    } catch {
      // Theme persistence is a convenience; the UI still works when storage is unavailable.
    }
  }, [])

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem('dormosaur-theme')
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored)
        return
      }
    } catch {
      // Fall through to the device preference.
    }

    // Daylight is the Dormosaur default; students can opt into the deep-green
    // night theme from Profile & Settings without inheriting an OS theme that
    // may make the first-run experience unexpectedly dark.
    setThemeState('light')
  }, [])

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return React.useContext(ThemeContext)
}
