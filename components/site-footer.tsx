import Image from 'next/image'
import Link from 'next/link'

type Link = { label: string; href: string; download?: boolean }

const APK_URL = process.env.NEXT_PUBLIC_APK_URL || '/dormosaur.apk'

const columns: { title: string; links: Link[] }[] = [
  {
    title: 'Help',
    links: [
      { label: 'Import a schedule', href: '/docs/import' },
      { label: 'Class alarms', href: '/docs/alarms' },
      { label: 'Tasks and deadlines', href: '/docs/tasks' },
      { label: 'Wallpaper and widgets', href: '/docs/wallpaper-widgets' },
      { label: 'Troubleshooting', href: '/docs/troubleshooting' },
      { label: 'All help docs', href: '/docs' },
    ],
  },
  {
    title: 'Dorm life',
    links: [
      { label: 'Dorm-budget recipes', href: '/docs/recipes' },
      { label: 'Meal plan and grocery list', href: '/docs/meal-plan' },
      { label: 'Ask Dormo', href: '/docs/ask-dormo' },
      { label: 'Today at a glance', href: '/docs/today' },
    ],
  },
  {
    title: 'Dormosaur',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Features', href: '/#features' },
      { label: 'Schedule scanner', href: '/#scanner' },
      { label: 'Install the APK', href: '/docs/install' },
      { label: 'FAQ', href: '/docs/faq' },
      { label: 'Download for Android', href: APK_URL, download: true },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Privacy and data', href: '/docs/privacy' },
      { label: 'Permissions', href: '/docs/permissions' },
      { label: 'Account and sign-in', href: '/docs/account' },
      { label: 'Support', href: '/support' },
    ],
  },
]

const link =
  'inline-flex min-h-9 items-center rounded-sm text-[15px] text-[#D5E1D6] underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A3DCB8]'

/** Site-wide footer: brand block, four link columns, and Dormo peeking up from the bottom edge. */
export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-clip bg-[#0D2018] px-4 text-[#F0F6EE] sm:px-6">
      <div className="mx-auto max-w-[1100px]">
        <div className="grid gap-10 pb-12 pt-14 sm:pt-16 lg:grid-cols-[1.25fr_repeat(4,1fr)] lg:gap-8">
          <div>
            <Link href="/" className="inline-flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A3DCB8]">
              <Image src="/dormosaur-logo.png" alt="" width={36} height={36} className="rounded-[11px]" />
              <span className="text-[26px] font-bold tracking-[-0.04em]">Dormosaur</span>
            </Link>
            <p className="mt-3 max-w-[26ch] text-[15px] leading-relaxed text-[#B8CCBD]">Your class schedule, alarms, and dorm meals, always with you.</p>
            <Link href="/docs/contact" className={`${link} mt-3`}>Contact Dormosaur</Link>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4 lg:col-span-4 lg:gap-8">
            {columns.map(({ title, links }) => (
              <div key={title}>
                <h2 className="mb-3 text-[15px] font-semibold text-[#7DF0B5]">{title}</h2>
                <ul className="space-y-1">
                  {links.map(l => (
                    <li key={l.label}>
                      {l.download ? (
                        <a href={l.href} download className={link}>{l.label}</a>
                      ) : (
                        <Link href={l.href} className={link}>{l.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 py-6 text-sm text-[#8FA896]">
          <p>© {new Date().getFullYear()} Dormosaur</p>
          <p>Free for Android · Zero ads</p>
        </div>
      </div>

      {/* Dormo peeking up from the bottom edge */}
      <div aria-hidden className="pointer-events-none mx-auto h-[150px] w-[260px] overflow-hidden sm:h-[190px] sm:w-[330px]">
        <div className="h-[300px] w-full bg-gradient-to-b from-[#1F3A2C] to-[#132A1F] [mask:url('/dormo-jumping.png')_center_top/contain_no-repeat] sm:h-[380px]" />
      </div>
    </footer>
  )
}
