import * as Linking from 'expo-linking'
import { Redirect } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'
import { useTheme } from '@/design/theme'
import { completeAuthFromUrl } from '@/lib/auth-link'

/** Deep-link target for Google sign-in and email confirmation links. */
export default function AuthCallback() {
  const { c } = useTheme()
  const linkedUrl = Linking.useLinkingURL()
  const [initialUrl, setInitialUrl] = useState<string | null | undefined>(undefined)
  const [done, setDone] = useState(false)
  const handled = useRef<string | null>(null)

  useEffect(() => {
    let active = true
    Linking.getInitialURL()
      .then(u => { if (active) setInitialUrl(u) })
      .catch(() => { if (active) setInitialUrl(null) })
    return () => { active = false }
  }, [])

  const targetUrl = linkedUrl ?? initialUrl

  useEffect(() => {
    if (!targetUrl) return
    if (handled.current === targetUrl) return
    handled.current = targetUrl
    let active = true
    completeAuthFromUrl(targetUrl)
      .then(r => { if (active && r.error) Alert.alert('Sign-in failed', r.error) })
      .finally(() => { if (active) setDone(true) })
    return () => { active = false }
  }, [targetUrl])

  if (done || targetUrl === null) return <Redirect href="/" />
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}><ActivityIndicator color={c.green} /></View>
}
