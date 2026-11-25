import type { Metadata } from 'next'
import { Instrument_Serif } from 'next/font/google'
import Link from 'next/link'
import { SiteNav } from '@/components/landing/site-nav'
import { SiteFooter } from '@/components/site-footer'

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif-display',
})

const APK_URL = process.env.NEXT_PUBLIC_APK_URL || '/dormosaur.apk'

export const metadata: Metadata = {
  title: 'About Dormosaur',
  description:
    'Dormosaur helps college students import their schedule, set offline class alarms, track deadlines, and find recipes they can cook in a dorm.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div
      className={`${serif.variable} min-h-dvh bg-white text-[#0A1710] selection:bg-[#34C77B]/30`}
      style={{ fontFamily: 'var(--font-geist), -apple-system, system-ui, sans-serif' }}
    >
      <SiteNav apkUrl={APK_URL} alwaysPill />

      <main className="mx-auto max-w-[760px] px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
        <header>
          <h1
            className="text-[46px] leading-[1.02] tracking-[-0.02em] text-[#0A1710] sm:text-[60px]"
            style={{ fontFamily: 'var(--font-serif-display), Georgia, serif' }}
          >
            About Dormosaur
          </h1>
          <p className="mt-5 max-w-[58ch] text-pretty text-[18px] leading-[1.68] text-[#4E5F55] sm:text-[19px]">
            Dormosaur helps you keep track of classes, deadlines, and meals. Start with the schedule your school already gave you.
          </p>
        </header>

        <hr className="my-11 border-black/[0.08]" />

        <section className="space-y-5">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0A1710]">What Dormosaur does</h2>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            Import a photo, screenshot, PDF, or pasted list to build your weekly timetable. Check each room and time before
            saving. Once you save your schedule, you can see what’s next today or check tomorrow’s classes.
          </p>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            You can also use Dormosaur for the rest of your week.
          </p>
          <ul className="space-y-2.5 pl-5 text-[16px] leading-[1.7] text-[#2F4036] list-disc marker:text-[#0E7A4A]">
            <li>Set class alarms that ring offline on Android.</li>
            <li>Track exams, quizzes, and assignments. Scan a syllabus to find due dates.</li>
            <li>Browse 200 recipes for rice cookers, kettles, hot plates, and microwaves.</li>
            <li>Plan your meals and make a grocery list from the ingredients you still need.</li>
            <li>Ask Dormo when you’re free, what’s due this week, or what to cook for dinner.</li>
            <li>Save your schedule as a lock screen wallpaper or share it with classmates.</li>
          </ul>
        </section>

        <hr className="my-11 border-black/[0.08]" />

        <section className="space-y-5">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0A1710]">Between classes and back at the dorm</h2>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            Check the room for your next class as you walk across campus. Back at the dorm, find a recipe you can make with
            the appliances you have.
          </p>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            Your saved timetable and tasks are available offline, and scheduled alarms still ring. Sign in with the same
            account to restore your data when you switch phones.
          </p>
        </section>

        <hr className="my-11 border-black/[0.08]" />

        <section className="space-y-5">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0A1710]">Free download and optional Pro</h2>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            Dormosaur is free to download and has no ads. The free plan includes one AI schedule scan, class alarms
            15 minutes before class, tasks, and all 200 recipes. Dormosaur Pro includes unlimited scans, alarms
            30 or 60 minutes before class, weekly meal planning, and extra wallpaper themes. Pro plans do not renew
            automatically. Dormosaur never sells student timetables or personal data.
          </p>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            Dormosaur runs on Android 8 or later. An iPhone version is planned.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-black/[0.08] pt-8">
          <a
            href={APK_URL}
            download
            className="inline-flex min-h-[44px] items-center rounded-full bg-[#0E7A4A] px-5 py-2.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#0B633B]"
          >
            Download for Android
          </a>
          <Link
            href="/docs"
            className="inline-flex min-h-[44px] items-center rounded-full border border-black/[0.12] px-5 py-2.5 text-[14.5px] font-semibold text-[#0A1710] transition-colors hover:border-black/25"
          >
            Browse help guides
          </Link>
          <Link
            href="/support"
            className="inline-flex min-h-[44px] items-center rounded-full px-4 py-2.5 text-[14.5px] font-semibold text-[#0E7A4A] underline-offset-4 hover:underline"
          >
            Contact support →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
