'use client'

import {
  motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue,
} from 'framer-motion'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { DownloadButton } from './download-button'
import { ease } from './shared'

type Layout = 'sm' | 'md' | 'lg'

/**
 * Desk items, placed as offsets from the phone's center in fractions of the stage
 * (fx of width, fy of height). They start stacked inside the phone and burst out to here.
 * `depth` scales mouse parallax and the outward drift on scroll.
 */
const deskObjects = [
  { name: 'backpack', tilt: -8, depth: 1.2, size: { sm: 0.25, md: 0.17, lg: 0.15 }, max: 176, pos: { sm: [-0.37, 0.18], md: [-0.36, 0.06], lg: [-0.37, 0.04] } },
  { name: 'planner', tilt: 9, depth: 0.7, size: { sm: 0.18, md: 0.12, lg: 0.1 }, max: 124, pos: { sm: [-0.3, -0.3], md: [-0.22, -0.3], lg: [-0.22, -0.32] } },
  { name: 'alarm-clock', tilt: 8, depth: 0.8, size: { sm: 0.2, md: 0.13, lg: 0.105 }, max: 128, pos: { sm: [0.31, -0.3], md: [0.23, -0.3], lg: [0.22, -0.3] } },
  { name: 'rice-cooker', tilt: 5, depth: 1.1, size: { sm: 0.24, md: 0.15, lg: 0.125 }, max: 150, pos: { sm: [0.37, 0.18], md: [0.37, 0.04], lg: [0.37, 0.02] } },
  { name: 'calculator', tilt: -10, depth: 0.6, size: { sm: 0, md: 0.1, lg: 0.082 }, max: 102, pos: { sm: [0, 0], md: [-0.23, 0.3], lg: [-0.235, 0.27] } },
  { name: 'garlic-rice', tilt: 9, depth: 0.9, size: { sm: 0, md: 0.12, lg: 0.1 }, max: 130, pos: { sm: [0, 0], md: [0.24, 0.3], lg: [0.235, 0.27] } },
] as const

const SPARKS = ['#34C77B', '#3B82F6', '#E0457B', '#F08A24', '#8B5CF6', '#F5C542']

export function Hero({ apkUrl, apkVersion, animate, go }: { apkUrl: string; apkVersion: string; animate: boolean; go: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [stage, setStage] = useState({ w: 1100, h: 400 })
  const [landed, setLanded] = useState(false)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setStage({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Burst once, after the intro hands off. With animations off, items sit in place.
  const burst = go && animate
  useEffect(() => {
    if (!burst) return
    const t = window.setTimeout(() => setLanded(true), 1300)
    return () => clearTimeout(t)
  }, [burst])

  const layout: Layout = stage.w < 600 ? 'sm' : stage.w < 960 ? 'md' : 'lg'

  // Mouse parallax (desktop pointers only) and outward drift as the hero scrolls away.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 18 })
  const sy = useSpring(my, { stiffness: 60, damping: 18 })
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const spread = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section
      id="top"
      ref={sectionRef}
      onPointerMove={e => {
        if (!animate || e.pointerType !== 'mouse') return
        mx.set(e.clientX / window.innerWidth - 0.5)
        my.set(e.clientY / window.innerHeight - 0.5)
      }}
      className="relative isolate min-h-svh overflow-hidden px-4 pb-16 pt-[94px] sm:pb-20 sm:pt-28"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[520px] max-w-[1100px] bg-[radial-gradient(ellipse_at_50%_34%,#E1F2E6_0%,#F8FBF5_40%,transparent_72%)]" />

      <div ref={stageRef} className="relative mx-auto h-[280px] max-w-[1240px] sm:h-[350px] lg:h-[400px]">
        <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)]">
          <motion.div
            id="hero-phone"
            initial={false}
            animate={burst ? { y: [0, 4, -3, 0], scale: [1, 0.985, 1.01, 1] } : { y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease, times: [0, 0.2, 0.55, 1] }}
            className="absolute left-1/2 top-3 -ml-[87px] w-[174px] rounded-[30px] bg-[#171E1A] p-[5px] ring-1 ring-[#0A1710]/25 shadow-[0_24px_64px_-20px_rgba(10,42,25,0.38)] sm:-ml-[115px] sm:w-[230px] sm:rounded-[38px] sm:p-[7px] lg:-ml-[126px] lg:w-[252px]"
          >
            <Image
              src="/landing/app-today-v2.webp"
              alt="Dormosaur’s Today screen showing the next class and its countdown"
              width={402}
              height={874}
              sizes="(min-width: 1024px) 238px, (min-width: 640px) 216px, 164px"
              priority
              className="h-auto w-full rounded-[25px] sm:rounded-[31px]"
            />
          </motion.div>
        </div>

        {/* Shockwave ring and colour sparks at the moment of the burst */}
        {burst && (
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[42%]">
            <motion.span
              initial={{ scale: 0.2, opacity: 0.7 }}
              animate={{ scale: 3.2, opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.08 }}
              className="absolute -left-[90px] -top-[90px] size-[180px] rounded-full border-2 border-[#34C77B]/60"
            />
            {Array.from({ length: 14 }, (_, i) => {
              const a = (i / 14) * Math.PI * 2 + 0.3
              const r = (layout === 'sm' ? 120 : 220) + (i % 3) * 40
              return (
                <motion.span
                  key={i}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.6, scale: [0, 1, 0.4], opacity: [1, 1, 0] }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.1 + (i % 4) * 0.03 }}
                  style={{ background: SPARKS[i % SPARKS.length] }}
                  className={`absolute -ml-1 -mt-1 rounded-full ${i % 2 ? 'size-2' : 'size-1.5'}`}
                />
              )
            })}
          </div>
        )}

        <div aria-hidden className="pointer-events-none absolute inset-0">
          {deskObjects.map((o, i) => {
            const frac = o.size[layout]
            if (!frac) return null
            const [fx, fy] = o.pos[layout]
            return (
              <DeskItem
                key={o.name}
                name={o.name}
                width={Math.min(o.max, stage.w * frac)}
                x={fx * stage.w}
                y={fy * stage.h}
                tilt={o.tilt}
                depth={o.depth}
                index={i}
                go={go}
                animate={animate}
                landed={landed}
                sx={sx}
                sy={sy}
                spread={spread}
              />
            )
          })}
        </div>
      </div>

      <div className="relative mx-auto mt-6 max-w-[900px] px-1 text-center sm:mt-8 lg:mt-10">
        <h1 className="text-balance text-[clamp(2.5rem,6.4vw,5.25rem)] font-bold leading-[1.01] tracking-[-0.04em]">
          Your class schedule, <span className="block text-[#0E7A4A]">from one photo.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[38rem] text-pretty text-[16px] leading-relaxed text-[#48564D] sm:mt-6 sm:text-lg">
          Import a photo, screenshot, or PDF. Dormosaur builds your week and brings class alarms, deadlines, and dorm meals together.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:mt-8">
          <DownloadButton apkUrl={apkUrl} />
          <p className="text-[13px] text-[#506057]">Version {apkVersion} · Android 8+ · Free, no ads</p>
        </div>
      </div>
    </section>
  )
}

function DeskItem({ name, width, x, y, tilt, depth, index, go, animate, landed, sx, sy, spread }: {
  name: string; width: number; x: number; y: number; tilt: number; depth: number; index: number
  go: boolean; animate: boolean; landed: boolean
  sx: MotionValue<number>; sy: MotionValue<number>; spread: MotionValue<number>
}) {
  const dirX = Math.sign(x) || 1
  const dirY = Math.sign(y) || -1
  // Parallax is gated by a motion value so server and client render the same style shape.
  const on = useMotionValue(0)
  useEffect(() => on.set(animate ? 1 : 0), [animate, on])
  const px = useTransform(() => on.get() * (sx.get() * -36 * depth + spread.get() * dirX * 90 * depth))
  const py = useTransform(() => on.get() * (sy.get() * -28 * depth + spread.get() * dirY * 50 * depth))

  const placed = { x, y, scale: 1, opacity: 1, rotate: tilt }
  const stacked = { x: 0, y: 0, scale: 0.12, opacity: 0, rotate: 0 }
  const target = !animate || go ? placed : stacked

  return (
    // Anchor: the phone's center. Each item is centered on its own offset from there.
    <div className="absolute left-1/2 top-[42%]" style={{ width, marginLeft: -width / 2, marginTop: -width / 2 }}>
      <motion.div
        initial={stacked}
        animate={target}
        transition={
          animate
            ? {
                x: { type: 'spring', stiffness: 120, damping: 14, mass: 1, delay: 0.12 + index * 0.05 },
                y: { type: 'spring', stiffness: 120, damping: 14, mass: 1, delay: 0.12 + index * 0.05 },
                rotate: { type: 'spring', stiffness: 90, damping: 10, delay: 0.12 + index * 0.05 },
                scale: { type: 'spring', stiffness: 180, damping: 15, delay: 0.12 + index * 0.05 },
                opacity: { duration: 0.18, delay: 0.12 + index * 0.05 },
              }
            : { duration: 0 }
        }
      >
        <motion.div style={{ x: px, y: py }}>
          <motion.div
            initial={false}
            animate={animate && landed ? { y: [0, -8, 0] } : { y: 0 }}
            transition={animate && landed ? { duration: 5 + index * 0.35, delay: index * 0.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          >
            <Image
              src={`/landing/desk/${name}.webp`}
              alt=""
              width={384}
              height={384}
              sizes="(min-width: 1024px) 176px, (min-width: 640px) 144px, 90px"
              className="h-auto w-full drop-shadow-[0_14px_12px_rgba(31,47,33,0.16)]"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
