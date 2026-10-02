'use client'
import { ArrowLeft, X } from 'lucide-react'
import { getTemplateById, type ScheduleTemplateId } from '@/lib/template-registry'
import { useSchedule } from '@/components/schedule-provider'
import { ScaledTemplatePreview } from './scaled-template-preview'

export function TemplatePreviewView({ selectedTemplate, onBack, onNext, onClose }: {
  selectedTemplate: ScheduleTemplateId; onBack: () => void; onNext: () => void; onClose: () => void
}) {
  const { classes, profile } = useSchedule()
  const metadata = getTemplateById(selectedTemplate)
  return <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
      <button type="button" onClick={onBack} className="flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="size-4" />Templates</button>
      <h2 className="min-w-0 text-center text-sm font-bold">{metadata.name}</h2>
      <button type="button" onClick={onClose} aria-label="Close template preview" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fill"><X className="size-5" /></button>
    </header>
    <div className="min-h-0 flex-1 p-4 sm:p-6">
      <ScaledTemplatePreview templateId={metadata.id} classes={classes} name={profile.name} school={profile.school} />
    </div>
    <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-border/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button type="button" onClick={onBack} className="min-h-12 rounded-full border border-border bg-card px-3 text-sm font-semibold">Change Template</button>
      <button type="button" onClick={onNext} className="min-h-12 rounded-full bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700">Use This Template</button>
    </footer>
  </div>
}
