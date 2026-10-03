'use client'

import * as React from 'react'
import { MotionConfig } from 'framer-motion'

type Theme = 'light' | 'dark'

const ThemeContext = React.createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({ theme: 'light', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [override, setThemeState] = React.useState<Theme | null>(null)
  const stored = React.useSyncExternalStore<Theme>(
    React.useCallback((notify: () => void) => { window.addEventListener('storage', notify); return () => window.removeEventListener('storage', notify) }, []),
    () => { try { return window.localStorage.getItem('dormosaur-theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' } },
    () => 'light',
  )
  const theme: Theme = override || stored
  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    try { window.localStorage.setItem('dormosaur-theme', nextTheme) } catch {}
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
