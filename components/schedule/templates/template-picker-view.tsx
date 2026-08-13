'use client'

import * as React from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  SCHEDULE_TEMPLATES,
  getTemplateById,
  type ScheduleTemplateId,
} from '@/lib/template-registry'
import { TemplateRenderer } from './template-renderer'
import { useSchedule } from '@/components/schedule-provider'
import { cn } from '@/lib/utils'

interface TemplatePickerViewProps {
  selectedTemplate: ScheduleTemplateId
  onSelectTemplate: (id: ScheduleTemplateId) => void
  onNext: () => void
  onClose: () => void
}

export function TemplatePickerView({
  selectedTemplate,
  onSelectTemplate,
  onNext,
  onClose,
}: TemplatePickerViewProps) {
  const { classes, profile } = useSchedule()
  const activeMetadata = getTemplateById(selectedTemplate)

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      {/* Sticky Frosted Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-full bg-fill text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
        >
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </button>

        <div className="text-center">
          <h2 className="text-[17px] font-bold tracking-tight">Choose a Template</h2>
          <p className="text-[12px] text-muted-foreground">We&apos;ll fill it in with your real schedule</p>
        </div>

        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {/* Template Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {SCHEDULE_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate === tmpl.id
              return (
                <motion.button
                  key={tmpl.id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onSelectTemplate(tmpl.id)}
                  className={cn(
                    'group relative flex flex-col overflow-hidden rounded-2xl border p-3 text-left transition-all shadow-xs',
                    isSelected
                      ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-600/30'
                      : 'border-border/60 bg-card hover:border-border hover:bg-accent/40',
                  )}
                >
                  {/* Thumbnail Image Preview Box */}
                  <div
                    className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-black/10 shadow-xs flex items-center justify-center"
                    style={{ backgroundColor: tmpl.bgPreview }}
                  >
                    <img
                      src={tmpl.imagePath}
                      alt={tmpl.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-black/15 backdrop-blur-[0.5px]">
                      <span className="text-[12px] font-black uppercase tracking-wider drop-shadow-sm text-white">
                        {tmpl.name}
                      </span>
                      <span className="mt-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur-xs">
                        {tmpl.category}
                      </span>
                    </div>

                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md z-10"
                      >
                        <Check className="size-3.5" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>

                  {/* Card Title & Desc */}
                  <div className="mt-2.5 flex flex-col">
                    <span className="text-[13.5px] font-bold text-foreground group-hover:text-primary">
                      {tmpl.name}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground line-clamp-1 mt-0.5">
                      {tmpl.description}
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Live Interactive Preview Box */}
          <div className="mt-2 flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-[14px]">
                <Sparkles className="size-4 text-primary" />
                <span>Live Preview — {activeMetadata.name}</span>
              </div>
              <span className="text-[12px] font-semibold text-muted-foreground">
                {classes.length} {classes.length === 1 ? 'course' : 'courses'} loaded
              </span>
            </div>

            {/* Rendered Live Template */}
            <div className="w-full overflow-hidden rounded-2xl border border-border/40 shadow-inner bg-muted/20 p-2 flex justify-center">
              <div className="w-full max-w-full overflow-hidden">
                <TemplateRenderer
                  templateId={selectedTemplate}
                  classes={classes}
                  name={profile.name}
                  school={profile.school}
                  presetSize="phone"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/80 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={onNext}
            className="flex h-12 w-full items-center justify-center rounded-full bg-emerald-600 font-semibold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.99]"
          >
            Use This Template
          </button>
        </div>
      </div>
    </div>
  )
}
