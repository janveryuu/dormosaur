import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AlarmClock, CalendarDays, CookingPot, Download, ListChecks, ShieldCheck, Smartphone } from 'lucide-react'

/**
 * Public APK download page.
 * Structure is final; visuals are a clean placeholder ready for the upcoming landing redesign.
 * Point NEXT_PUBLIC_APK_URL at the EAS / release artifact; it defaults to /dormosaur.apk in public/.
 */

const APK_URL = process.env.NEXT_PUBLIC_APK_URL || '/dormosaur.apk'
const APK_VERSION = process.env.NEXT_PUBLIC_APK_VERSION || '1.0.0'

export const metadata: Metadata = {
  title: 'Dormosaur for Android',
  description: 'Classes, alarms, tasks and dorm meals in one app. Download the Dormosaur APK.',
}

const features = [
  { Icon: CalendarDays, label: 'Schedule', body: 'Snap your registration form. Your week appears.' },
  { Icon: AlarmClock, label: 'Alarms', body: 'Rings before every class, even offline.' },
  { Icon: ListChecks, label: 'Tasks', body: 'Exams and deadlines, sorted by when.' },
  { Icon: CookingPot, label: 'Kitchen', body: 'Cheap meals for a rice cooker or microwave.' },
]

const steps = [
  { n: 1, title: 'Download', body: 'Tap the button on your Android phone.' },
  { n: 2, title: 'Allow install', body: 'Open the file and allow installs from your browser.' },
  { n: 3, title: 'Open Dormosaur', body: 'Sign in with your existing account.' },
]

function DownloadButton({ className = '' }: { className?: string }) {
  return (
    <a
      href={APK_URL}
      download
      className={`inline-flex h-14 items-center gap-3 rounded-full bg-[#1E5C40] px-7 text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(30,92,64,0.6)] transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E5C40] ${className}`}
    >
      <Download className="size-5" strokeWidth={2.4} aria-hidden />
      Download APK
    </a>
  )
}

function Phone({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[2.4rem] border-[6px] border-[#16211B] bg-[#16211B] shadow-[0_30px_60px_-20px_rgba(22,33,27,0.45)] ${className}`}>
      <Image src={src} alt={alt} width={402} height={874} className="block h-auto w-full rounded-[1.9rem]" priority />
    </div>
  )
}

export default function DownloadPage() {
  return (
    <main className="min-h-dvh bg-[#F3F3EF] text-[#16211B]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <Image src="/dormosaur-logo.png" alt="" width={36} height={36} className="rounded-xl" />
          Dormosaur
        </Link>
        <a href={APK_URL} download className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1E5C40] shadow-sm">
          Get the app
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 md:grid-cols-[1.05fr_1fr] md:pt-16">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#E3EFE6] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1E5C40]">
            <Smartphone className="size-3.5" aria-hidden /> Android
          </p>
          <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-7xl">
            Dorm life,
            <br />
            <span className="text-[#1E5C40]">in your pocket.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-[#56625A]">Classes, alarms, tasks and dorm meals. One app.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <DownloadButton />
            <span className="text-sm text-[#8E978F]">v{APK_VERSION} · Android 8+</span>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-md justify-center">
          <Phone src="/landing/app-schedule.webp" alt="Dormosaur schedule screen" className="absolute left-0 top-10 hidden w-[44%] -rotate-6 opacity-90 sm:block" />
          <Phone src="/landing/app-today.webp" alt="Dormosaur today screen" className="relative z-10 w-[62%] sm:w-[56%]" />
          <Phone src="/landing/app-tasks.webp" alt="Dormosaur tasks screen" className="absolute right-0 top-10 hidden w-[44%] rotate-6 opacity-90 sm:block" />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ Icon, label, body }) => (
            <div key={label} className="rounded-3xl bg-white p-6 shadow-[0_6px_18px_-8px_rgba(27,42,32,0.12)]">
              <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-[#E3EFE6] text-[#1E5C40]">
                <Icon className="size-6" strokeWidth={2.2} aria-hidden />
              </div>
              <h2 className="text-lg font-extrabold tracking-tight">{label}</h2>
              <p className="mt-1 text-[15px] text-[#56625A]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Install steps */}
      <section id="install" className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-10 rounded-[2rem] bg-[#1E5C40] p-8 text-white md:grid-cols-[1fr_1.4fr] md:p-12">
          <div className="flex flex-col justify-between gap-8">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight">Install in a minute.</h2>
            <div className="flex items-end gap-4">
              <Image src="/mascots/dormosaur-greeting.png" alt="" width={120} height={120} />
              <DownloadButton className="bg-white !text-[#1E5C40]" />
            </div>
          </div>
          <ol className="grid gap-3">
            {steps.map(s => (
              <li key={s.n} className="flex gap-4 rounded-2xl bg-white/10 p-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#F4C54A] font-extrabold text-[#16211B]">{s.n}</span>
                <div>
                  <p className="font-bold">{s.title}</p>
                  <p className="text-sm text-white/75">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[#8E978F]">
          <ShieldCheck className="size-4" aria-hidden /> Signed release. Your data stays in your account.
        </p>
      </section>

      <footer className="border-t border-[#E6E6DF] py-8 text-center text-sm text-[#8E978F]">
        <Link href="/sign-in" className="font-semibold text-[#56625A] hover:text-[#1E5C40]">Use on the web</Link>
        <span className="mx-3">·</span>© {new Date().getFullYear()} Dormosaur
      </footer>
    </main>
  )
}
