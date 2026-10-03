'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { unsubscribePush } from '@/lib/push-notifications'

interface AuthState {
  user: User | null
  loading: boolean
}

const AuthContext = React.createContext<AuthState>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const supabase = createClient()

    let disposed = false
    let authChanged = false
    let previousAccount: string | null | undefined
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      if (!disposed && !authChanged) { setUser(data.user); setLoading(false) }
    }).catch(() => { if (!disposed && !authChanged) { setUser(null); setLoading(false) } })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authChanged = true
      if (disposed) return
      const account = session?.user.id ?? null
      if (previousAccount !== undefined && previousAccount !== account) {
        for (const key of [
          'dormosaur_parsed_draft', 'dormly_parsed_draft',
          'dormosaur_parsed_deadlines_draft', 'dormly_parsed_deadlines_draft',
          'dormosaur_parsed_deadlines_image', 'dormly_parsed_deadlines_image',
        ]) {
          try { sessionStorage.removeItem(key) } catch {}
        }
      }
      previousAccount = account
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => { disposed = true; subscription.unsubscribe() }
  }, [])

  return React.createElement(
    AuthContext.Provider,
    { value: { user, loading } },
    // Reset open forms and dialogs when another account replaces this session.
    React.createElement(React.Fragment, { key: user?.id ?? 'signed-out' }, children),
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}

export function useSignOut() {
  const router = useRouter()

  return async () => {
    const supabase = createClient()
    // Stop this device receiving the previous student's reminders on sign-out.
    // Other devices stay subscribed; expired endpoints are also pruned server-side.
    await unsubscribePush().catch(() => false)
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error('We could not sign out. Please reconnect and try again.')
    router.push('/')
    router.refresh()
  }
}
