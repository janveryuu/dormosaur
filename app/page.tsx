import type { Metadata } from 'next'
import { Instrument_Serif } from 'next/font/google'
import { Landing } from '@/components/landing/landing'

/**
 * Public landing page. The only call to action is the Android APK download.
 * Point NEXT_PUBLIC_APK_URL at the release artifact; it defaults to /dormosaur.apk in public/.
 */

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif-display' })

const APK_URL = process.env.NEXT_PUBLIC_APK_URL || '/dormosaur.apk'
const APK_VERSION = process.env.NEXT_PUBLIC_APK_VERSION || '1.0.0'

export const metadata: Metadata = {
  title: 'Dormosaur — Your class schedule, from one photo',
  description: 'Import your class schedule from a photo, screenshot, or PDF. Dormosaur organizes your week, keeps track of deadlines, and helps plan dorm meals.',
  openGraph: {
    title: 'Dormosaur — Your class schedule, from one photo',
    description: 'Your class schedule, from one photo. Free for Android.',
    images: ['/dormo-jumping.png'],
  },
}

export default function Page() {
  return (
    <div className={serif.variable}>
      <Landing apkUrl={APK_URL} apkVersion={APK_VERSION} />
    </div>
  )
}
