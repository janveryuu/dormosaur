'use client'
import * as React from 'react'
import type { ClassEntry } from '@/lib/data'
import type { TemplateMetadata, PresetSize } from '@/lib/template-registry'
import { WALLPAPER_DAYS, groupWallpaperClasses, wallpaperCourse, wallpaperMinutes, wallpaperTime, wallpaperTimeRange, type WallpaperDay } from '@/lib/wallpaper-schedule-utils'

export function WallpaperScheduleLayout({ metadata, classes, name, school, presetSize }: {
  metadata: TemplateMetadata; classes: ClassEntry[]; name?: string; school?: string; presetSize: PresetSize
}) {
  const { theme } = metadata
  const phone = presetSize === 'phone'
  const grouped = React.useMemo(() => groupWallpaperClasses(classes), [classes])
  const areaRef = React.useRef<HTMLDivElement>(null), contentRef = React.useRef<HTMLDivElement>(null)
  const headerRef = React.useRef<HTMLElement>(null)
  const [contentTop, setContentTop] = React.useState(140)
  const [fit, setFit] = React.useState(1)
  const scale = phone ? 1 : presetSize === 'print' ? 1.7 : 1.65
  const meetingCount = WALLPAPER_DAYS.reduce((count, day) => count + grouped[day].length, 0)
  const dense = phone && meetingCount > 21
  const room = (entry: ClassEntry) => (!phone || meetingCount <= 10) && entry.room && !/^(room\s*)?tba$/i.test(entry.room) ? entry.room : null
  React.useLayoutEffect(() => {
    const header = headerRef.current
    if (!header) return
    const measure = () => setContentTop(header.offsetTop + header.offsetHeight + 16 * scale)
    const observer = new ResizeObserver(measure)
    observer.observe(header); measure()
    return () => observer.disconnect()
  }, [scale, name, school])
  React.useLayoutEffect(() => {
    const area = areaRef.current, content = contentRef.current
    if (!area || !content) return
    const measure = () => setFit(Math.min(1, area.clientHeight / Math.max(1, content.scrollHeight)))
    const observer = new ResizeObserver(measure)
    observer.observe(area); observer.observe(content)
    void document.fonts.ready.then(measure)
    measure()
    return () => observer.disconnect()
  }, [metadata.id, classes, presetSize, name, school])
  const panelStyle: React.CSSProperties = { borderRadius: 12 * scale, background: theme.panel, border: `1px solid ${theme.border}`, padding: 8 * scale }
  const courseCard = (entry: ClassEntry, grid = false) => <div key={entry.id} data-wallpaper-class={entry.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 6 * scale, padding: `${(dense ? 1 : phone ? 3 : 4) * scale}px ${4 * scale}px`, minWidth: 0, lineHeight: 1.3 }}>
    <div style={{ display: phone && !grid ? 'flex' : 'block', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
      <div style={{ fontSize: (grid && phone ? 10.5 : dense ? 10 : 11) * scale, fontWeight: 750, overflowWrap: 'anywhere', minWidth: 0, flex: 1 }}>{wallpaperCourse(entry)}</div>
      <div style={{ fontSize: (grid && phone ? 8 : phone ? 8 : 9) * scale, marginTop: phone && !grid ? 0 : 2 * scale, fontVariantNumeric: 'tabular-nums', maxWidth: phone && !grid ? '52%' : undefined }}>{wallpaperTimeRange(entry)}</div>
    </div>
    {room(entry) && <div style={{ fontSize: (grid && phone ? 7 : 8) * scale, marginTop: 2 * scale, overflowWrap: 'anywhere' }}>{room(entry)}</div>}
  </div>
  const dayCard = (day: WallpaperDay) => <section key={day} data-wallpaper-day={day} style={{ ...panelStyle, padding: (dense ? 5 : 7) * scale, minWidth: 0, borderRadius: 9 * scale }}>
    <h3 style={{ fontSize: 10 * scale, fontWeight: 800, color: theme.accent, margin: `0 0 ${6 * scale}px` }}>{day.toUpperCase()}</h3>
    <div style={{ display: 'grid', gap: 4 * scale }}>{grouped[day].length ? grouped[day].map((entry) => courseCard(entry)) : <p style={{ fontSize: 9 * scale, margin: 0, opacity: .72 }}>No classes</p>}</div>
  </section>
  const days = WALLPAPER_DAYS.filter((day, index) => index < 5 || grouped[day].length)
  const startTimes = [...new Set(WALLPAPER_DAYS.slice(0, 5).flatMap((day) => grouped[day].map((entry) => entry.start)))].sort((a, b) => wallpaperMinutes(a) - wallpaperMinutes(b))
  const weekends = WALLPAPER_DAYS.slice(5).filter((day) => grouped[day].length)
  return <div style={{ height: '100%', width: '100%', color: theme.text, fontFamily: 'Arial, Helvetica, sans-serif', background: metadata.bgPreview }}>
    {/* Approved original artwork; backgrounds never contain the student's classes. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={metadata.imagePath} alt="" width={941} height={1672} decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    <header ref={headerRef} style={{ position: 'absolute', top: phone ? 38 : 35 * scale, left: 24 * scale, right: 24 * scale, ...panelStyle, padding: 12 * scale }}>
      <h1 style={{ fontFamily: theme.headerFont, fontSize: 21 * scale, fontWeight: 700, lineHeight: 1.1, margin: 0 }}>My class schedule</h1>
      {(name || school) && <p style={{ fontSize: 10 * scale, margin: `${6 * scale}px 0 0`, overflowWrap: 'anywhere', lineHeight: 1.35 }}>{[name, school].filter(Boolean).join(' · ')}</p>}
    </header>
    <div ref={areaRef} style={{ position: 'absolute', top: contentTop, left: 24 * scale, right: 24 * scale, bottom: phone ? theme.artworkSpace : presetSize === 'print' ? 135 : 60 }}>
      <div ref={contentRef} data-wallpaper-content style={{ transform: `scale(${fit})`, transformOrigin: 'top center', width: '100%' }}>
        {meetingCount === 0 ? <div style={{ ...panelStyle, padding: 28 * scale, textAlign: 'center', fontSize: 15 * scale }}>No classes yet</div>
          : !metadata.supportsGrid ? <div style={{ display: 'grid', gridTemplateColumns: `repeat(${presetSize === 'desktop' ? 3 : 2}, minmax(0, 1fr))`, gap: 8 * scale }}>{days.map(dayCard)}</div>
          : <div style={{ display: 'grid', gap: 10 * scale }}>
            <div style={panelStyle}><table data-wallpaper-weekly-grid style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: `${3 * scale}px`, fontSize: 8 * scale }}>
              <thead><tr><th style={{ width: phone ? 36 : 65 * scale, fontSize: 8 * scale }}>TIME</th>{WALLPAPER_DAYS.slice(0, 5).map((day) => <th key={day} style={{ color: theme.accent, paddingBottom: 6 * scale, fontSize: 8 * scale }}>{day.toUpperCase()}</th>)}</tr></thead>
              <tbody>{startTimes.map((time) => <tr key={time}>
                <th scope="row" style={{ fontSize: (phone ? 7.5 : 9) * scale, fontWeight: 600, verticalAlign: 'top', paddingTop: 5 * scale }}>{wallpaperTime(time)}</th>
                {WALLPAPER_DAYS.slice(0, 5).map((day) => <td key={day} style={{ verticalAlign: 'top', padding: 0 }}><div style={{ display: 'grid', gap: 3 * scale }}>{grouped[day].filter((entry) => entry.start === time).map((entry) => courseCard(entry, true))}</div></td>)}
              </tr>)}</tbody>
            </table>{startTimes.length === 0 && <p style={{ textAlign: 'center', fontSize: 10 * scale }}>No weekday classes</p>}</div>
            {weekends.length > 0 && <section><h2 style={{ fontSize: 10 * scale, background: theme.panel, borderRadius: 6 * scale, padding: 5 * scale, margin: `0 0 ${5 * scale}px`, color: theme.accent }}>WEEKEND</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 * scale }}>{weekends.map(dayCard)}</div></section>}
          </div>}
      </div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18 * scale, textAlign: 'center' }}><span style={{ ...panelStyle, padding: '4px 10px', fontSize: 8 * scale, fontWeight: 600 }}>Dormosaur</span></div>
  </div>
}
