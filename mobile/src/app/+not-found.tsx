import { Redirect } from 'expo-router'
import { useApp } from '@/state/app'

/** Web lands on `/(auth)` (no index) after a guard redirect; send it to the right screen. */
export default function NotFound() {
  const { demo, session } = useApp()
  return <Redirect href={demo || session ? '/' : '/welcome'} />
}
