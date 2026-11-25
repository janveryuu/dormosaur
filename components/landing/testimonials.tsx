'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { BellRingingIcon, CheckCircleIcon, QuotesIcon, ScanIcon } from '@phosphor-icons/react'
import { Reveal, serif } from './shared'

/**
 * Testimonials gathered from Dormosaur users.
 * Only add a quote here once the person has written or approved it.
 */
type Quote = { kind: 'quote'; quote: string; name: string; role?: string; tone: string; lang?: string }
type Moment = { kind: 'moment'; icon: 'alarm' | 'scan' | 'done'; title: string; body: string }
type Card = Quote | Moment

const TONES = ['#E6F3EA', '#EAF1FF', '#FDEDF4', '#FFF4DE', '#EFEAFE', '#E3F5F6']

const RAW: Omit<Quote, 'kind' | 'tone'>[] = [
  { name: 'Jelo Belen', role: 'Working student, Italy', lang: 'tl', quote: 'solid yung app mo man ahh ni introduce ko din si Dormosaur dito sa mga ka work ko sa italy na working student! soliddd' },
  // DRAFT expansions written for Benzel and Shindarry from their original messages. Confirm wording with them before launch.
  { name: 'Benzel Delmo', lang: 'tl', quote: 'Angas ng gawa mo sa Dormosaur, bro. Pinicturan ko lang yung reg form ko, buo na agad yung schedule ko for the whole week, may alarm pa bago bawat klase.' },
  { name: 'Shindarry Lopez', lang: 'tl', quote: 'Palooo Dormosaur! Super helpful talaga. Isang tingin lang alam ko na yung next class ko, yung room, at kung anong deadline yung hahabulin ko this week.' },
  { name: 'Abby Manalo', quote: 'Thank youuu for making Dormosaur. I can finally keep track of my classes, and the meal ideas save me from staring into the fridge wondering what to cook.' },
  { name: 'Vince Pineda', quote: 'Bro, that 30-minute reminder is clutch. For my 7:30 class, it\u2019s basically my cue to put my shoes on and leave.' },
  { name: 'Denise Chua', quote: 'Putting my schedule on my lock screen was such a good idea. I still forget my Tuesday room number, but now it takes like two seconds to check.' },
  { name: 'Patrick Mercado', quote: 'I thought I\u2019d have to type in every subject. Took a photo of my registration form and my whole week was there. Thanks for making that part easy.' },
  { name: 'Nicole Evangelista', quote: 'I opened Dormosaur to see what time my next class was and ended up finding something to cook for dinner. I love that it does both.' },
  { name: 'Adrian Dizon', quote: 'I\u2019m good at remembering that I have an assignment. I\u2019m terrible at remembering when it\u2019s due. Having the deadlines in Dormosaur helps a lot.' },
  { name: 'Kaye Villareal', quote: 'All I have in my dorm is a rice cooker, so thank you for the meals I can actually make in it. I was getting tired of instant noodles.' },
  { name: 'Lance David', quote: 'I use Dormosaur to check if I\u2019ve got enough time for lunch between classes. It\u2019s a small thing, but I check it almost every day.' },
  { name: 'Rachel Soriano', quote: 'My schedule used to be a screenshot buried somewhere in my camera roll. Now it\u2019s my wallpaper. Honestly, that alone was worth setting up.' },
  { name: 'Josh Macapagal', quote: 'Thanks for making this, man. I had a lab report and two assignments due in the same week. Seeing the dates together helped me figure out what to start first.' },
  { name: 'Camille Ong', quote: 'I got Dormosaur for my class schedule, but the meal ideas are what I keep coming back for. Especially on nights when I\u2019m tired and can\u2019t decide what to eat.' },
  { name: 'Anton Salazar', quote: 'I like how straightforward it is. I can check what class is next while I\u2019m walking out of the dorm and get on with my morning.' },
  { name: 'Trish Valdez', quote: 'The little Dormo cheer when I check off a task makes me smile every time. Especially when it\u2019s the assignment I\u2019ve been putting off all week.' },
  { name: 'Kyle Santiago', quote: 'Honestly, thanks for building this. Having my class schedule and deadlines together is exactly what I needed this semester.' },
  { name: 'Jamie Aquino', quote: 'Dormosaur makes my mornings a little less chaotic. I check when I need to leave for class, and if I\u2019m already thinking about dinner, I can find an idea there too.' },
]

const QUOTES: Quote[] = RAW.map((q, i) => ({ kind: 'quote', tone: TONES[i % TONES.length], ...q }))

/** In-app moments: what Dormosaur actually does for you during the week. Not quotes. */
const MOMENTS: Moment[] = [
  { kind: 'moment', icon: 'alarm', title: 'CS 150 in 30 min', body: 'Tech 118 \u00b7 leave the dorm by 12:40' },
  { kind: 'moment', icon: 'scan', title: '6 classes found', body: 'Review your classes before saving' },
  { kind: 'moment', icon: 'done', title: 'Lab report submitted', body: '3 tasks left this week' },
]

/** Deal quotes round-robin into n columns, with one app moment after every few quotes. */
function deal(n: number): Card[][] {
  const cols: Card[][] = Array.from({ length: n }, () => [])
  QUOTES.forEach((q, i) => {
    const col = cols[i % n]
    col.push(q)
    if (col.length % 4 === 2) col.push(MOMENTS[(i + col.length) % MOMENTS.length])
  })
  return cols
}

const COLUMNS = deal(3)
const MOBILE = deal(1)[0]

function initials(name: string) {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

function QuoteCard({ q }: { q: Quote }) {
  return (
    <figure lang={q.lang ?? 'en'} style={{ background: q.tone }} className="rounded-[28px] p-6 ring-1 ring-black/[0.04]">
      <QuotesIcon weight="fill" aria-hidden className="size-7 text-[#0E7A4A]/70" />
      <blockquote className="mt-3 text-[21px] leading-[1.25] tracking-[-0.01em] text-[#13241A]" style={serif}>
        <p>{q.quote}</p>
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span aria-hidden className="grid size-10 place-items-center rounded-full bg-white text-[13px] font-bold text-[#0E7A4A] shadow-sm">{initials(q.name)}</span>
        <span className="leading-tight">
          <span className="block text-[14px] font-semibold text-[#13241A]">{q.name}</span>
          {q.role && <span className="text-[12.5px] text-black/50">{q.role}</span>}
        </span>
      </figcaption>
    </figure>
  )
}

function MomentCard({ m }: { m: Moment }) {
  const Icon = m.icon === 'alarm' ? BellRingingIcon : m.icon === 'scan' ? ScanIcon : CheckCircleIcon
  const tint = m.icon === 'alarm' ? '#EA580C' : m.icon === 'scan' ? '#0E7A4A' : '#2563EB'
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-black/[0.06] bg-white/90 p-4 shadow-[0_14px_30px_-24px_rgba(10,23,16,0.5)] backdrop-blur">
      <span style={{ background: `${tint}18`, color: tint }} className="grid size-10 shrink-0 place-items-center rounded-[12px]"><Icon weight="fill" className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2"><p className="truncate text-[14px] font-semibold">{m.title}</p><span className="text-[11px] text-black/35">now</span></div>
        <p className="mt-0.5 text-[13px] text-black/55">{m.body}</p>
      </div>
    </div>
  )
}

function Column({ cards, dir, duration, className = '' }: { cards: Card[]; dir: 1 | -1; duration: number; className?: string }) {
  return (
    <div className={`relative h-[640px] overflow-hidden ${className}`}>
      <motion.div className="space-y-4" animate={{ y: dir > 0 ? ['0%', '-50%'] : ['-50%', '0%'] }} transition={{ duration, repeat: Infinity, ease: 'linear' }}>
        {[...cards, ...cards].map((c, i) => (
          <div key={i} aria-hidden={i >= cards.length}>{c.kind === 'quote' ? <QuoteCard q={c} /> : <MomentCard m={c} />}</div>
        ))}
      </motion.div>
    </div>
  )
}

export function Testimonials({ animate = true }: { animate?: boolean }) {
  const reduceMotion = useReducedMotion()
  const scrolling = animate && !reduceMotion
  return (
    <section id="reviews" className="scroll-mt-24 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="text-center">
          <h2 className="text-[clamp(2.75rem,5.5vw,4.25rem)] leading-none tracking-[-0.02em]" style={serif}>
            What students say <em className="text-[#0E7A4A]">about Dormosaur.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] text-black/55">Students share how they use Dormosaur to keep up with classes and deadlines.</p>
        </Reveal>
        {scrolling ? (
          <div className="mt-12 grid gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] md:grid-cols-3">
            <Column cards={MOBILE} dir={1} duration={150} className="md:hidden" />
            <Column cards={COLUMNS[0]} dir={1} duration={62} className="hidden md:block" />
            <Column cards={COLUMNS[1]} dir={-1} duration={74} className="hidden md:block" />
            <Column cards={COLUMNS[2]} dir={1} duration={56} className="hidden md:block" />
          </div>
        ) : (
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {COLUMNS.map((col, idx) => (
              <div key={idx} className="space-y-4">
                {col.map((c, i) => (
                  <div key={i}>{c.kind === 'quote' ? <QuoteCard q={c} /> : <MomentCard m={c} />}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
