'use client'
import { Check, X } from 'lucide-react'
import { SCHEDULE_TEMPLATES, resolveScheduleTemplateId, type ScheduleTemplateId } from '@/lib/template-registry'
import { cn } from '@/lib/utils'

export function TemplatePickerView({ selectedTemplate, onSelectTemplate, onClose }: {
  selectedTemplate: ScheduleTemplateId; onSelectTemplate: (id: ScheduleTemplateId) => void; onClose: () => void
}) {
  return <div className="flex h-full min-h-0 w-full flex-col bg-background text-foreground">
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
      <div className="size-11 shrink-0" />
      <div className="text-center"><h2 className="text-[17px] font-bold">Choose a Template</h2><p className="mt-1 text-xs text-muted-foreground">We&apos;ll fill it in with your real schedule</p></div>
      <button type="button" onClick={onClose} aria-label="Close template picker" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fill"><X className="size-5" /></button>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
      <div data-template-picker-grid className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {SCHEDULE_TEMPLATES.map((metadata) => {
          const selected = resolveScheduleTemplateId(selectedTemplate) === metadata.id
          return <button key={metadata.id} type="button" aria-label={`Preview ${metadata.name}`} aria-pressed={selected} onClick={() => onSelectTemplate(metadata.id)} className={cn('group min-w-0 overflow-hidden rounded-2xl border bg-card text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary', selected ? 'border-emerald-600 ring-2 ring-emerald-600/25' : 'border-border/60 hover:border-primary/50')}>
            <div className="relative aspect-[3/4] overflow-hidden" style={{ background: metadata.bgPreview }}>
              {/* The small thumbnail is a lossless resize of this exact background. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={metadata.thumbnailPath} alt="" width={240} height={426} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              <div aria-hidden="true" className="absolute inset-x-[18%] top-[27%] h-[40%] rounded-lg border bg-white/80 p-2 shadow-sm" style={{ borderColor: metadata.theme.border, background: metadata.theme.panel }}><div className="mx-auto mb-2 h-1.5 w-3/4 rounded" style={{ background: metadata.accentColor, opacity: .65 }} />{[0, 1, 2].map((row) => <div key={row} className="mb-1 h-3 rounded border" style={{ background: metadata.theme.card, borderColor: metadata.theme.border }} />)}</div>
              {selected && <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white"><Check className="size-4" /></span>}
            </div>
            <div className="flex min-h-20 flex-col gap-1 p-3"><span className="text-[13px] font-bold leading-snug [overflow-wrap:anywhere]">{metadata.name}</span><span className="text-[11px] text-muted-foreground">{metadata.category}</span><span className="hidden text-xs text-muted-foreground lg:block">{metadata.description}</span></div>
          </button>
        })}
      </div>
    </div>
  </div>
}
