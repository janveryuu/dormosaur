import { Redirect } from 'expo-router'
import { useApp } from '@/state/app'

/** Entry point: sends each user to the right place (one owner for "/"). */
export default function Index() {
  const { demo, session, profile } = useApp()
  if (!demo && !session) return <Redirect href="/welcome" />
  if (!demo && !profile?.onboarding_completed) return <Redirect href="/onboarding" />
  return <Redirect href="/today" />
}
