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
    'Dormosaur is a college class schedule and dorm life planner built around the timetable you already have — plus offline class alarms, deadlines, and 200 dorm-budget recipes.',
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
            Dormosaur is a college class schedule and dorm life planner built around the information students already
            have — a registration form, portal screenshot, PDF, or pasted timetable.
          </p>
        </header>

        <hr className="my-11 border-black/[0.08]" />

        <section className="space-y-5">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0A1710]">What Dormosaur does</h2>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            Dormosaur turns a class schedule screenshot, photo, PDF, or pasted list into an organized weekly timetable.
            You review every detected class before saving, so a misread room or time can be fixed right away. From
            there, you can see what is next, check tomorrow, and walk out of your dorm on time without rebuilding your
            term by hand.
          </p>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            Around your schedule, Dormosaur handles the everyday routines of a college semester:
          </p>
          <ul className="space-y-2.5 pl-5 text-[16px] leading-[1.7] text-[#2F4036] list-disc marker:text-[#0E7A4A]">
            <li>Automatic class alarms that ring offline on Android — 15 minutes ahead free, or 30 and 60 minutes in Pro.</li>
            <li>Deadlines, exams, quizzes, and projects, including syllabus scanning to pull out due dates automatically.</li>
            <li>200 dorm-budget recipes tailored for rice cookers, electric kettles, hot plates, and microwaves.</li>
            <li>Weekly meal planning with a one-tap grocery list built from ingredients you still need.</li>
            <li>Ask Dormo, a campus assistant that knows your classes, free gaps, upcoming deadlines, and dinner ideas.</li>
            <li>Custom Lock Screen schedule wallpapers and instant schedule sharing with classmates.</li>
          </ul>
        </section>

        <hr className="my-11 border-black/[0.08]" />

        <section className="space-y-5">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0A1710]">Built for real dorm life</h2>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            Most calendar apps assume you live in a desktop browser with fast Wi-Fi and plenty of time to type out
            repeating events. College life happens between hallways, in dorm rooms with weak signal, and on late nights
            trying to decide what to cook with a rice cooker and a small budget.
          </p>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            Dormosaur keeps your timetable, tasks, and alarms cached locally so they open fast and ring reliably even
            when campus data drops. Everything stays synced to your account so switching phones or updating the app
            never loses your semester.
          </p>
        </section>

        <hr className="my-11 border-black/[0.08]" />

        <section className="space-y-5">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0A1710]">Private, zero ads, student-friendly</h2>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            Dormosaur has zero ads and never sells student timetables or personal data. Core scheduling, tasks, 15-minute
            class alarms, and all 200 dorm recipes are free. Optional Dormosaur Pro plans unlock unlimited AI scans,
            longer alarm leads, full-week meal planning, and extra wallpaper themes — with no automatic renewals.
          </p>
          <p className="text-[16px] leading-[1.75] text-[#2F4036]">
            Dormosaur currently ships for Android (Android 8+), with an iPhone version on our roadmap.
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
            Read the docs
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
