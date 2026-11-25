'use client'

import { motion, useReducedMotionConfig, useScroll, useSpring, useTransform } from 'framer-motion'
import { Check } from 'lucide-react'
import Image from 'next/image'
import { useRef } from 'react'
import { serif } from './shared'

type ShowcaseItem = {
  id: string
  title: string
  body: string
  bullets: [string, string, string]
  shot: string
  alt: string
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
  },
]

/**
 * Alternating real-screenshot showcase with a unified daylight sky & layered cloud stage.
 */
export function AppShowcase() {
  return (
    <section id="app-preview" aria-label="Inside the Dormosaur app" className="scroll-mt-24 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-[1060px] space-y-20 sm:space-y-28">
        {SHOWCASE_ROWS.map((row, idx) => (
          <ShowcaseRow key={row.id} row={row} phoneFirstOnDesktop={idx % 2 === 0} />
        ))}
      </div>
    </section>
  )
}

function ShowcaseRow({ row, phoneFirstOnDesktop }: { row: ShowcaseItem; phoneFirstOnDesktop: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotionConfig()
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'center center'],
  })

  const phoneY = useSpring(useTransform(scrollYProgress, [0, 1], [76, 0]), {
    stiffness: 120,
    damping: 24,
    mass: 0.9,
  })
  const cloudDriftLeft = useTransform(scrollYProgress, [0, 1], [-14, 12])
  const cloudDriftRight = useTransform(scrollYProgress, [0, 1], [14, -12])

  return (
    <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
      <div className={`order-1 ${phoneFirstOnDesktop ? 'md:order-2' : 'md:order-1'}`}>
        <h2
          style={{ ...serif, color: '#0E7A4A' }}
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
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#E6F6EE] text-[#0B663E]"
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
          ref={stageRef}
          style={{
            background:
              'linear-gradient(168deg, #32C67E 0%, #149158 48%, #0A5E37 100%)',
          }}
          className="group relative overflow-hidden rounded-t-[34px] px-6 pt-10 sm:px-10 sm:pt-12"
        >
          {/* Daylight sky atmospheric radiance */}
          <div
            aria-hidden
            style={{
              background:
                'radial-gradient(ellipse 85% 58% at 50% 0%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 46%, transparent 74%)',
            }}
            className="pointer-events-none absolute inset-0"
          />

          {/* Soft floating mid-ground clouds behind the phone */}
          <motion.svg
            aria-hidden
            style={reduce ? undefined : { x: cloudDriftLeft }}
            viewBox="0 0 260 96"
            className="pointer-events-none absolute -left-8 top-10 w-[210px] text-white/[0.17] sm:w-[240px]"
            fill="currentColor"
          >
            <path d="M44 82h168c22 0 38-14 38-32 0-17-14-31-32-32C210 6 195 0 178 0c-21 0-39 12-46 29-5-4-12-6-20-6-17 0-31 12-33 28C66 52 56 64 56 78c0 1.4.1 2.7.3 4H44z" />
          </motion.svg>

          <motion.svg
            aria-hidden
            style={reduce ? undefined : { x: cloudDriftRight }}
            viewBox="0 0 240 88"
            className="pointer-events-none absolute -right-10 top-28 w-[195px] text-white/[0.15] sm:w-[230px]"
            fill="currentColor"
          >
            <path d="M26 78h184c16 0 28-11 28-26 0-14-11-25-26-26C205 11 190 2 172 2c-19 0-36 11-43 27-5-3-11-5-18-5-16 0-29 11-31 26-14 1-25 11-25 23 0 1.8.3 3.4.7 5H26z" />
          </motion.svg>

          {/* Soft lower atmospheric mist band behind phone */}
          <svg
            viewBox="0 0 640 130"
            preserveAspectRatio="none"
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-8 h-28 w-full text-white/[0.16]"
            fill="currentColor"
          >
            <path d="M0 130V68C58 28 128 24 186 58C244 18 326 14 394 56C456 20 532 24 590 58C612 46 628 48 640 58V130H0Z" />
          </svg>

          {/* Phone rising smoothly from bottom on scroll */}
          <motion.div
            style={reduce ? undefined : { y: phoneY }}
            className="relative z-10 mx-auto -mb-8 w-[244px] rounded-t-[40px] bg-[#141A17] p-[7px] pb-0 shadow-[0_32px_60px_-20px_rgba(6,46,26,0.48)] ring-1 ring-white/30 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:group-hover:-translate-y-1.5 sm:-mb-9 sm:w-[272px]"
          >
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
          </motion.div>

          {/* Multi-layered fluffy white clouds blending seamlessly into the page */}
          <svg
            viewBox="0 0 640 96"
            preserveAspectRatio="none"
            aria-hidden
            className="pointer-events-none absolute -inset-x-0.5 -bottom-0.5 z-20 h-[74px] w-[calc(100%+4px)] sm:h-[86px]"
          >
            <path
              d="M0 96V36C44 10 98 12 144 36C192 8 256 6 308 34C358 10 416 12 464 36C514 8 574 10 614 34C626 28 634 30 640 36V96H0Z"
              fill="rgba(255,255,255,0.36)"
            />
            <path
              d="M0 96V48C48 22 104 24 148 46C198 18 264 18 314 44C364 22 424 24 470 46C522 18 582 20 622 44C630 39 636 41 640 46V96H0Z"
              fill="rgba(255,255,255,0.68)"
            />
            <path
              d="M0 96V60C44 36 96 38 138 56C188 30 250 30 298 54C348 34 406 36 452 56C504 30 564 32 606 54C620 47 632 49 640 58V96H0Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
