'use client'
import * as React from 'react'
import type { ClassEntry } from '@/lib/data'
import { ARTBOARD_SIZES, type PresetSize } from '@/lib/template-registry'
import { TemplateRenderer } from './template-renderer'

/** Presentation scale only. The export renderer lives outside this transform. */
export function ScaledTemplatePreview({ templateId, classes, name, school, presetSize = 'phone' }: {
  templateId: string; classes: ClassEntry[]; name?: string; school?: string; presetSize?: PresetSize
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const size = ARTBOARD_SIZES[presetSize]
  const [scale, setScale] = React.useState(0)
  React.useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const measure = () => setScale(Math.min(container.clientWidth / size.width, container.clientHeight / size.height, 1))
    const observer = new ResizeObserver(measure)
    observer.observe(container); measure()
    return () => observer.disconnect()
  }, [size.width, size.height])
  return <div ref={containerRef} data-scaled-preview className="flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden">
    <div style={{ width: size.width * scale, height: size.height * scale, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left', ...size, borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 24px #0002' }}>
        <TemplateRenderer templateId={templateId} classes={classes} name={name} school={school} presetSize={presetSize} />
      </div>
    </div>
  </div>
}
