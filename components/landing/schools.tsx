'use client'

import Image from 'next/image'
import { serif } from './shared'
import styles from './schools.module.css'

/**
 * Official school seals/logos (from each school's Wikipedia infobox), stored in public/schools.
 * Names and logos are trademarks of their schools. The headline refers to student usage.
 */
const SCHOOLS = [
  { name: 'Batangas State University', short: 'BatStateU', logo: '/schools/batstateu.png' },
  { name: 'De La Salle University', short: 'DLSU', logo: '/schools/dlsu.png' },
  { name: 'Mapúa University', short: 'Mapúa', logo: '/schools/mapua.png' },
  { name: 'Polytechnic University of the Philippines', short: 'PUP', logo: '/schools/pup.png' },
  { name: 'Ateneo de Manila University', short: 'Ateneo', logo: '/schools/ateneo.png' },
  { name: 'University of the Philippines', short: 'UP', logo: '/schools/up.png' },
  { name: 'University of Santo Tomas', short: 'UST', logo: '/schools/ust.png' },
  { name: 'Far Eastern University', short: 'FEU', logo: '/schools/feu.png' },
  { name: 'University of the East', short: 'UE', logo: '/schools/ue.png' },
  { name: 'National University', short: 'NU', logo: '/schools/nu.png' },
  { name: 'Adamson University', short: 'AdU', logo: '/schools/adamson.png' },
  { name: 'University of San Carlos', short: 'USC', logo: '/schools/usc.png' },
]

export function Schools({ animate }: { animate: boolean }) {
  return (
    <section id="marquee" aria-labelledby="schools-title" className="scroll-mt-24 border-y border-[#E8EFE9] bg-[#FAFCF9] py-11 sm:py-14">
      <h2 id="schools-title" className="mx-auto mb-8 max-w-[24ch] px-4 text-center text-[34px] leading-[1.03] tracking-[-0.02em] sm:mb-10 sm:max-w-none sm:text-[46px]" style={serif}>
        <em className="text-[#0E7A4A]">10,000+ students</em> use Dormosaur across these schools.
      </h2>
      <div className={animate ? styles.animatedRail : styles.rail} role="region" aria-label="School logos" tabIndex={0}>
        {[0, 1].map(k => (
          <ul key={k} aria-hidden={k === 1} className={k ? styles.duplicate : styles.track} role="list">
            {SCHOOLS.map(s => (
              <li key={s.name} className="flex shrink-0 items-center gap-3.5">
                <Image src={s.logo} alt="" width={48} height={48} className="size-12 object-contain" />
                <span className="flex max-w-[180px] flex-col gap-0.5 leading-tight">
                  <span className="text-sm font-semibold tracking-tight text-[#173025]">{s.name}</span>
                  <span className="text-[12px] font-medium tracking-wide text-[#4A6253]">{s.short}</span>
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  )
}
