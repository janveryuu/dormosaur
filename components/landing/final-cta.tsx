'use client'

import { AnimatePresence, motion, useInView, useReducedMotionConfig } from 'framer-motion'
import { BellRing } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { DownloadButton } from './download-button'
import { Reveal } from './shared'

/** The hero's desk items, coming home around Dormo. x/y are offsets from Dormo's feet, in px. */
const homeItems = [
  { name: 'backpack', x: -310, y: -10, w: 120, tilt: -10, from: [-560, 60] },
  { name: 'planner', x: -230, y: -170, w: 78, tilt: 10, from: [-460, -260] },
  { name: 'calculator', x: -195, y: 0, w: 66, tilt: -12, from: [-420, 220] },
  { name: 'alarm-clock', x: 250, y: -170, w: 84, tilt: 9, from: [460, -260] },
  { name: 'garlic-rice', x: 200, y: 0, w: 86, tilt: 8, from: [420, 220] },
  { name: 'rice-cooker', x: 315, y: -10, w: 104, tilt: 6, from: [560, 60] },
] as const

export function FinalCta({ apkUrl, apkVersion }: { apkUrl: string; apkVersion: string }) {
  const reduce = useReducedMotionConfig()
  const [excited, setExcited] = useState(false)
  const [bursts, setBursts] = useState<number[]>([])
  // Items start outside the card's clipped area, so they can't observe their own visibility.
  const stageRef = useRef<HTMLDivElement>(null)
  const home = useInView(stageRef, { once: true, amount: 0.3 })

  const celebrate = () => {
    if (reduce) return
    const id = Date.now()
    setBursts(b => [...b, id])
    window.setTimeout(() => setBursts(b => b.filter(x => x !== id)), 1400)
  }

  return (
    <section className="px-4 pb-16 pt-6">
      <Reveal>
        <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[40px] bg-[#0B6A40] px-6 pt-16 text-center text-white sm:px-12">
          {/* Slow aurora instead of a static dot grid */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0E7A4A] via-[#0B6A40] to-[#06180F]" />
          <motion.div aria-hidden className="pointer-events-none absolute -left-32 -top-40 size-[560px] rounded-full bg-[radial-gradient(circle,rgba(125,240,181,0.35),transparent_65%)] blur-2xl"
            animate={{ x: [0, 120, 0], y: [0, 60, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div aria-hidden className="pointer-events-none absolute -bottom-48 -right-24 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(245,197,66,0.18),transparent_65%)] blur-2xl"
            animate={{ x: [0, -100, 0], y: [0, -50, 0] }} transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }} />

          <h2 className="relative text-balance text-[40px] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[60px]">
            Know when to leave for <span className="relative inline-block">class.<motion.span aria-hidden initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }} className="absolute -bottom-1 left-0 right-[0.3em] h-[6px] origin-left rounded-full bg-[#7DF0B5]" /></span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-lg text-white/75">Download Dormosaur for Android, scan your schedule, and check when your first class starts.</p>

          <div className="relative mt-8 flex flex-col items-center gap-3">
            <div
              className="relative"
              onPointerEnter={() => setExcited(true)}
              onPointerLeave={() => setExcited(false)}
              onFocus={() => setExcited(true)}
              onBlur={() => setExcited(false)}
            >
              <DownloadButton apkUrl={apkUrl} dark onStart={celebrate} />
              <AnimatePresence>
                {bursts.map(id => <ButtonBurst key={id} />)}
              </AnimatePresence>
            </div>
            <p className="text-[13px] text-white/55">Version {apkVersion} · Android 8+ · Free</p>
          </div>

          <div ref={stageRef} className="relative mt-8 h-[150px] sm:mt-10 sm:h-[320px]">
          <div className="absolute bottom-0 left-1/2 h-[320px] w-[760px] -translate-x-1/2 origin-bottom max-sm:scale-[0.44]">
            {/* Ground shadow, shrinking as Dormo jumps */}
            <motion.span aria-hidden
              animate={reduce ? undefined : excited ? { scaleX: [1, 0.55, 1], opacity: [0.45, 0.2, 0.45] } : { scaleX: [1, 0.75, 1], opacity: [0.45, 0.3, 0.45] }}
              transition={{ duration: excited ? 0.7 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-3 left-1/2 -ml-[80px] h-5 w-[160px] rounded-[50%] bg-black/50 blur-md" />

            {homeItems.map((it, i) => (
              <motion.div key={it.name} aria-hidden
                initial={{ x: it.from[0], y: it.from[1], rotate: it.tilt * 4, opacity: 0 }}
                animate={home ? { x: it.x, y: it.y, rotate: it.tilt, opacity: 1 } : undefined}
                transition={{ type: 'spring', stiffness: 70, damping: 14, delay: 0.15 + i * 0.07 }}
                className="absolute bottom-6 left-1/2"
                style={{ width: it.w, marginLeft: -it.w / 2 }}
              >
                <motion.div animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ duration: 4.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: 1.4 + i * 0.2 }}>
                  <Image src={`/landing/desk/${it.name}.webp`} alt="" width={384} height={384} sizes="120px" className="h-auto w-full drop-shadow-[0_14px_14px_rgba(0,0,0,0.35)]" />
                </motion.div>
              </motion.div>
            ))}

            <motion.div initial={{ y: 80, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.2 }}
              className="absolute bottom-6 left-1/2 -ml-[105px] w-[210px] sm:-ml-[120px] sm:w-[240px]">
              <motion.div
                animate={reduce ? undefined : excited ? { y: [0, -46, 0], scaleY: [1, 1.04, 0.94, 1] } : { y: [0, -16, 0], scaleY: [1, 1.02, 0.97, 1] }}
                transition={{ duration: excited ? 0.7 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="origin-bottom"
              >
                <Image src="/dormo-jumping.png" alt="Dormo jumping" width={776} height={934} sizes="240px" className="h-auto w-full drop-shadow-2xl" />
              </motion.div>
            </motion.div>

            {/* A class reminder slides in beside Dormo */}
            <motion.div
              initial={{ x: 40, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 160, damping: 20, delay: 1.1 }}
              className="absolute -top-4 right-0 hidden items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 text-left text-[#0A1710] shadow-[0_20px_40px_-16px_rgba(0,0,0,0.5)] md:flex"
            >
              <motion.span animate={reduce ? undefined : { rotate: [0, -14, 12, -8, 0] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.4, delay: 1.8 }}
                className="grid size-9 place-items-center rounded-xl bg-[#0E7A4A] text-white">
                <BellRing className="size-4" aria-hidden />
              </motion.span>
              <span className="leading-tight">
                <span className="block text-[13px] font-semibold">CHEM 120 in 15 min</span>
                <span className="block text-[12px] text-black/50">Lab B-12 · 10:15 AM</span>
              </span>
            </motion.div>
          </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/** Desk items pop out of the download button on the first tap. */
function ButtonBurst() {
  const names = ['backpack', 'planner', 'alarm-clock', 'calculator', 'garlic-rice', 'rice-cooker']
  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {names.map((n, i) => {
        const a = -Math.PI / 2 + (i - 2.5) * 0.5
        return (
          <motion.span key={n}
            initial={{ x: -18, y: -18, scale: 0.3, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(a) * 170 - 18, y: Math.sin(a) * 130 - 18, scale: 1, opacity: [1, 1, 0], rotate: (i - 2.5) * 22 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute block size-9"
          >
            <Image src={`/landing/desk/${n}.webp`} alt="" width={72} height={72} sizes="36px" className="h-auto w-full" />
          </motion.span>
        )
      })}
    </span>
  )
}
