import * as Linking from 'expo-linking'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'
import { useTheme } from '@/design/theme'
import { completeAuthFromUrl } from '@/lib/auth-link'

/** Deep-link target for Google sign-in and email confirmation links. */
export default function AuthCallback() {
  const { c } = useTheme()
  const url = Linking.useLinkingURL()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!url) return
    completeAuthFromUrl(url)
      .then(r => { if (r.error) Alert.alert('Sign-in failed', r.error) })
      .finally(() => setDone(true))
  }, [url])

  if (done || !url) return <Redirect href="/" />
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}><ActivityIndicator color={c.green} /></View>
}
