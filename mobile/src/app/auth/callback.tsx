import { Redirect } from 'expo-router'

/** Deep-link target for the OAuth redirect; the auth session already handled the tokens. */
export default function AuthCallback() {
  return <Redirect href="/" />
}
