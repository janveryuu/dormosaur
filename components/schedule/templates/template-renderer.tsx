'use client'
import type { ClassEntry } from '@/lib/data'
import { ARTBOARD_SIZES, getTemplateById, type PresetSize } from '@/lib/template-registry'
import { WallpaperScheduleLayout } from './wallpaper-schedule-layout'
export function TemplateRenderer({ templateId, classes, name, school, presetSize = 'phone', artboardId }: {
  templateId: string; classes: ClassEntry[]; name?: string; school?: string; presetSize?: PresetSize; artboardId?: string
}) {
  const metadata = getTemplateById(templateId)
  return <div id={artboardId} data-template-artboard={metadata.id} data-preset={presetSize} style={{ ...ARTBOARD_SIZES[presetSize], position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
    <WallpaperScheduleLayout metadata={metadata} classes={classes} name={name} school={school} presetSize={presetSize} />
  </div>
}
