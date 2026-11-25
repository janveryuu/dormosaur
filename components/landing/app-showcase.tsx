'use client'

import { Check } from 'lucide-react'
import Image from 'next/image'
import { serif } from './shared'

type ShowcaseItem = {
  id: string
  title: string
  body: string
  bullets: [string, string, string]
  shot: string
  alt: string
  backdrop: string
  headingColor: string
  checkBg: string
  checkInk: string
}

const SHOWCASE_ROWS: ShowcaseItem[] = [
  {
    id: 'schedule',
    title: 'Your whole week, laid out cleanly',
    body: 'Switch between Week and Day views in one tap. Every class block keeps your course code, room number, and start time sharp and readable between buildings.',
    bullets: [
      'Full Week grid and Day list built for quick hallway checks',
      'Color-coded classes with rooms, online tags, and exact times',
      'Search any subject, room, or instructor in seconds',
    ],
    shot: '/landing/screens/app-schedule-v2.webp',
    alt: 'Dormosaur Schedule week view showing 19 courses across Monday to Friday including FILI 102, CPE 414, CPE 410, ENGG 416, CPE 413, CPE 415, and CPE 411',
    backdrop: 'linear-gradient(155deg, #27B875 0%, #0E7A4A 60%, #095232 100%)',
    headingColor: '#0E7A4A',
    checkBg: '#E6F6EE',
    checkInk: '#0B663E',
  },
  {
    id: 'tasks',
    title: 'Never lose track of a deadline',
    body: 'Keep problem sets, presentations, projects, and final exams out of your head. Scan a syllabus or add due dates yourself, sorted cleanly into Upcoming, Done, and All.',
    bullets: [
      'Live counters for this week, overdue items, and completion rate',
      'Scan syllabi or class posts to pull out every due date automatically',
      'Grouped by This Week and Later so priorities stay obvious',
    ],
    shot: '/landing/screens/app-tasks-v2.webp',
    alt: 'Dormosaur Tasks deadline tracker showing 3 tasks this week, 0 overdue, and upcoming deadlines including Problem Set 4, Fili Presentation Research, DSA Application Presentation, Project ENGG 416, and Final Exam',
    backdrop: 'linear-gradient(155deg, #3298DC 0%, #1769A6 60%, #0F4773 100%)',
    headingColor: '#125C94',
    checkBg: '#EAF4FC',
    checkInk: '#125C94',
  },
  {
    id: 'kitchen',
    title: 'Eat well in a tiny dorm',
    body: 'Browse 200 budget-friendly recipes with prep times, appliances, and estimated cost. Filter by meal type, plan your week, and build your grocery list in one tap.',
    bullets: [
      '200 dorm-tested recipes for rice cookers, hot plates, and no-cook meals',
      'Clear cook time and peso cost on every dish before you start',
      'Built-in Meal plan and Grocery tabs right beside your recipes',
    ],
    shot: '/landing/screens/app-kitchen-v2.webp',
    alt: 'Dormosaur Kitchen screen showing dorm-budget meals including Tortang Patatas, Calamansi Sardine Pandesal, Tomato and Queso Pandesal, and Ginataang Mais Breakfast Bowl with prep times and prices',
    backdrop: 'linear-gradient(155deg, #F4A938 0%, #D9721B 60%, #A64D0B 100%)',
    headingColor: '#B55008',
    checkBg: '#FFF3E3',
    checkInk: '#9E4306',
  },
]

/**
 * Alternating real-screenshot showcase using live Dormosaur mobile captures.
 * Each phone stage pairs a high-resolution app screenshot with a soft white contour floor.
 */
export function AppShowcase() {
  return (
    <section id="app-preview" aria-label="Inside the Dormosaur app" className="scroll-mt-24 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-[1060px] space-y-20 sm:space-y-28">
        {SHOWCASE_ROWS.map((row, idx) => {
          const phoneFirstOnDesktop = idx % 2 === 0
          return (
            <div key={row.id} className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
              <div className={`order-1 ${phoneFirstOnDesktop ? 'md:order-2' : 'md:order-1'}`}>
                <h2
                  style={{ ...serif, color: row.headingColor }}
                  className="text-balance text-[36px] leading-[1.06] tracking-[-0.025em] sm:text-[46px]"
                >
                  {row.title}
                </h2>
                <p className="mt-4 max-w-[44ch] text-pretty text-[16px] leading-[1.68] text-[#35463C] sm:text-[17px]">
                  {row.body}
                </p>
                <ul className="mt-6 space-y-3">
                  {row.bullets.map(bullet => (
                    <li key={bullet} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        style={{ backgroundColor: row.checkBg, color: row.checkInk }}
                        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full"
                      >
                        <Check className="size-3.5" strokeWidth={2.75} />
                      </span>
                      <span className="text-[15.5px] font-medium leading-snug text-[#13241A]">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`order-2 ${phoneFirstOnDesktop ? 'md:order-1' : 'md:order-2'}`}>
                <div
                  style={{ background: row.backdrop }}
                  className="group relative overflow-hidden rounded-[32px] px-6 pt-9 sm:px-10 sm:pt-12"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent"
                  />

                  <div className="relative z-10 mx-auto -mb-8 w-[244px] rounded-t-[40px] bg-[#141A17] p-[7px] pb-0 shadow-[0_28px_56px_-22px_rgba(8,22,15,0.48)] ring-1 ring-white/25 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:group-hover:-translate-y-1.5 sm:-mb-9 sm:w-[272px]">
                    <div className="overflow-hidden rounded-t-[33px] bg-[#F7F8F5]">
                      <Image
                        src={row.shot}
                        alt={row.alt}
                        width={780}
                        height={1688}
                        sizes="(min-width: 640px) 258px, 230px"
                        className="block h-auto w-full"
                      />
                    </div>
                  </div>

                  {/* Soft scalloped contour seamlessly blending into the white page below */}
                  <svg
                    viewBox="0 0 640 84"
                    preserveAspectRatio="none"
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 -bottom-px z-20 h-16 w-full sm:h-[74px]"
                  >
                    <path
                      d="M0 84V34C46 12 98 14 142 32C188 8 248 8 296 30C342 10 398 12 442 32C490 8 552 8 594 30C612 22 628 24 640 34V84H0Z"
                      fill="rgba(255,255,255,0.44)"
                    />
                    <path
                      d="M0 84V46C42 26 92 28 132 44C178 20 240 20 286 42C332 24 388 26 432 44C482 20 544 20 590 42C608 34 626 36 640 46V84H0Z"
                      fill="#FFFFFF"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
