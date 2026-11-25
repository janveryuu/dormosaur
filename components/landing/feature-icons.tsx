import type { SVGProps } from 'react'

export type FeatureIconKey = 'schedule' | 'tasks' | 'scanner' | 'alarms' | 'kitchen' | 'copilot'

type BadgePalette = {
  bg: string
  border: string
}

const BADGE_PALETTES: Record<FeatureIconKey, BadgePalette> = {
  schedule: { bg: '#E7F6EE', border: '#C6EBD7' },
  tasks: { bg: '#ECEFFF', border: '#D4DCFF' },
  scanner: { bg: '#E4F7ED', border: '#BBEAD1' },
  alarms: { bg: '#FFF0E9', border: '#FCD6C5' },
  kitchen: { bg: '#FFF5E2', border: '#FCE0B2' },
  copilot: { bg: '#E9F6FF', border: '#C4E6FD' },
}

function ScheduleSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <rect x="4" y="6.5" width="24" height="21" rx="5.5" fill="#FFFFFF" stroke="#0E7A4A" strokeWidth="1.75" />
      <path d="M4.8 11.5C4.8 8.9 6.6 7.2 9.2 7.2H22.8C25.4 7.2 27.2 8.9 27.2 11.5V12.8H4.8V11.5Z" fill="#0E7A4A" />
      <rect x="9.5" y="4" width="2.5" height="5" rx="1.25" fill="#0A5C37" />
      <rect x="20" y="4" width="2.5" height="5" rx="1.25" fill="#0A5C37" />
      <rect x="8.2" y="16" width="6.6" height="4.2" rx="1.4" fill="#34C77B" />
      <rect x="17" y="16" width="6.8" height="2" rx="1" fill="#BDD8C9" />
      <rect x="17" y="19.5" width="4.6" height="1.8" rx="0.9" fill="#D5E7DD" />
      <rect x="8.2" y="22.3" width="8.5" height="2" rx="1" fill="#F59E0B" />
      <rect x="18.6" y="22.3" width="5.2" height="2" rx="1" fill="#BDD8C9" />
    </svg>
  )
}

function TasksSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <rect x="5" y="5.5" width="22" height="22" rx="5.5" fill="#FFFFFF" stroke="#4338CA" strokeWidth="1.75" />
      <rect x="11" y="3.8" width="10" height="3.6" rx="1.8" fill="#4338CA" />
      <circle cx="10.6" cy="13.2" r="2.7" fill="#4338CA" />
      <path d="M9.4 13.2L10.3 14.1L12 12.2" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="15.3" y="12.2" width="8.2" height="2.2" rx="1.1" fill="#312E81" />
      <circle cx="10.6" cy="20.4" r="2.4" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.6" />
      <rect x="15.3" y="19.3" width="7.2" height="2.2" rx="1.1" fill="#A5B4FC" />
    </svg>
  )
}

function ScannerSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <path d="M9 5.5H6.8C5.5 5.5 4.5 6.5 4.5 7.8V10M23 5.5H25.2C26.5 5.5 27.5 6.5 27.5 7.8V10M9 26.5H6.8C5.5 26.5 4.5 25.5 4.5 24.2V22M23 26.5H25.2C26.5 26.5 27.5 25.5 27.5 24.2V22" stroke="#0B4A2E" strokeWidth="2" strokeLinecap="round" />
      <rect x="8" y="8.2" width="16" height="15.6" rx="3" fill="#FFFFFF" stroke="#B7DFC9" strokeWidth="1.4" />
      <rect x="10.4" y="11" width="11.2" height="2.3" rx="1.1" fill="#3B82F6" />
      <rect x="10.4" y="15" width="9" height="2.3" rx="1.1" fill="#F59E0B" />
      <rect x="10.4" y="19" width="10.2" height="2.3" rx="1.1" fill="#8B5CF6" />
      <rect x="5.5" y="15.1" width="21" height="2" rx="1" fill="#0E7A4A" />
    </svg>
  )
}

function AlarmsSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <path d="M6.4 9.5C5.2 8.2 5.4 6.2 6.8 5.2C8.1 4.2 10 4.5 10.9 5.9" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" />
      <path d="M25.6 9.5C26.8 8.2 26.6 6.2 25.2 5.2C23.9 4.2 22 4.5 21.1 5.9" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.2 24.2L8.5 26.8M21.8 24.2L23.5 26.8" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="16.4" r="9.2" fill="#FFFFFF" stroke="#EA580C" strokeWidth="2" />
      <circle cx="16" cy="16.4" r="6.8" fill="#FFF7F2" />
      <path d="M16 11.8V16.6L19.4 18.6" stroke="#7C2D12" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16.4" r="1.4" fill="#EA580C" />
    </svg>
  )
}

function KitchenSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <path d="M12.2 7.5C12.2 6.2 13.4 5.5 13.4 4.2M16 7.2C16 5.9 17.2 5.2 17.2 3.8M19.8 7.5C19.8 6.2 21 5.5 21 4.2" stroke="#EA580C" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7.2 14.5H24.8V21.2C24.8 24.4 22.2 26.8 19 26.8H13C9.8 26.8 7.2 24.4 7.2 21.2V14.5Z" fill="#FFFFFF" stroke="#C2410C" strokeWidth="1.8" />
      <path d="M5.2 15.8H7.2M24.8 15.8H26.8" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.4 14.2C6.4 11.4 10.6 9.8 16 9.8C21.4 9.8 25.6 11.4 25.6 14.2H6.4Z" fill="#EA580C" />
      <rect x="13.5" y="8" width="5" height="2.2" rx="1.1" fill="#9A3412" />
      <circle cx="16" cy="20.4" r="1.6" fill="#16A34A" />
      <rect x="11.2" y="20" width="2.4" height="1" rx="0.5" fill="#FDBA74" />
      <rect x="18.4" y="20" width="2.4" height="1" rx="0.5" fill="#FDBA74" />
    </svg>
  )
}

function CopilotSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <path
        d="M6.2 10.4C6.2 7.7 8.4 5.5 11.1 5.5H20.9C23.6 5.5 25.8 7.7 25.8 10.4V18.2C25.8 20.9 23.6 23.1 20.9 23.1H14.5L9.4 26.8C8.8 27.2 8 26.8 8 26V22.5C6.9 21.6 6.2 20 6.2 18.2V10.4Z"
        fill="#0284C7"
      />
      <path
        d="M16 9.2L17.2 12.8L20.8 14L17.2 15.2L16 18.8L14.8 15.2L11.2 14L14.8 12.8L16 9.2Z"
        fill="#FFFFFF"
      />
      <circle cx="21.2" cy="10.6" r="1.1" fill="#BAE6FD" />
      <circle cx="11.2" cy="18.1" r="0.9" fill="#BAE6FD" />
    </svg>
  )
}

const GLYPHS: Record<FeatureIconKey, (props: SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  schedule: ScheduleSvg,
  tasks: TasksSvg,
  scanner: ScannerSvg,
  alarms: AlarmsSvg,
  kitchen: KitchenSvg,
  copilot: CopilotSvg,
}

/**
 * Bespoke multi-tone Dormosaur editorial icon badge for the "Plan your whole term" showcase.
 * Zero plastic gloss sheen and zero colored drop-shadow bleed.
 */
export function FeatureBadgeIcon({ name, size = 46 }: { name: FeatureIconKey; size?: number }) {
  const palette = BADGE_PALETTES[name]
  const Glyph = GLYPHS[name]
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundColor: palette.bg,
        borderColor: palette.border,
      }}
      className="grid shrink-0 place-items-center rounded-[14px] border shadow-[0_2px_6px_-2px_rgba(10,23,16,0.12)]"
    >
      <Glyph style={{ width: Math.round(size * 0.68), height: Math.round(size * 0.68) }} />
    </span>
  )
}
