'use client'

import * as React from 'react'
import { ArrowLeft, Download, Loader2, X } from 'lucide-react'
import { toPng, toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'
import {
  getTemplateById,
  type ScheduleTemplateId,
  type ExportFormat,
  type PresetSize,
} from '@/lib/template-registry'
import { TemplateRenderer } from './template-renderer'
import { useSchedule } from '@/components/schedule-provider'
import { IosToast } from '@/components/ios/toast'

interface ExportPreviewViewProps {
  selectedTemplate: ScheduleTemplateId
  onBack: () => void
  onClose: () => void
}

export function ExportPreviewView({
  selectedTemplate,
  onBack,
  onClose,
}: ExportPreviewViewProps) {
  const { classes, profile } = useSchedule()
  const templateMeta = getTemplateById(selectedTemplate)

  const [format, setFormat] = React.useState<ExportFormat>('png')
  const [presetSize, setPresetSize] = React.useState<PresetSize>('desktop')
  const [nameText, setNameText] = React.useState(profile.name || '')
  const [schoolText, setSchoolText] = React.useState(profile.school || '')
  const [isExporting, setIsExporting] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const handleDownload = async () => {
    if (isExporting) return
    setIsExporting(true)

    try {
      const artboard = document.getElementById('schedule-export-artboard')
      if (!artboard) {
        throw new Error('Artboard container not found')
      }

      const fileName = `dormosaur-schedule-${selectedTemplate}-${presetSize}`

      if (format === 'png' || format === 'jpeg') {
        const exporter = format === 'png' ? toPng : toJpeg
        const dataUrl = await exporter(artboard, {
          quality: 0.98,
          pixelRatio: 3, // High-res 3x render
        })

        const link = document.createElement('a')
        link.download = `${fileName}.${format}`
        link.href = dataUrl
        link.click()
      } else if (format === 'pdf') {
        const dataUrl = await toPng(artboard, { pixelRatio: 3 })
        const pdf = new jsPDF({
          orientation: presetSize === 'desktop' ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4',
        })

        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        const margin = 8
        const availWidth = pageWidth - margin * 2
        const availHeight = pageHeight - margin * 2

        pdf.addImage(dataUrl, 'PNG', margin, margin, availWidth, availHeight)
        pdf.save(`${fileName}.pdf`)
      }

      setToastMessage(`Saved ${fileName}.${format} to your device`)
    } catch (err) {
      console.error('Export error:', err)
      setToastMessage('Failed to generate export file. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      {/* Toast Confirmation */}
      {toastMessage && (
        <IosToast
          toast={{
            type: 'success',
            title: 'Schedule Saved',
            message: toastMessage,
          }}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Sticky Frosted Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[15px] font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </button>

        <h2 className="text-[17px] font-bold tracking-tight">Your Schedule</h2>

        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full bg-fill text-muted-foreground hover:bg-accent"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {/* Format & Preset Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Format Selector */}
            <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 border border-border/60 shadow-xs">
              <span className="text-[12.5px] font-bold uppercase tracking-wider text-muted-foreground">
                Export Format
              </span>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-fill p-1">
                {(['png', 'jpeg', 'pdf'] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`rounded-lg py-1.5 text-[13px] font-bold uppercase transition-all ${
                      format === fmt
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Preset Selector */}
            <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 border border-border/60 shadow-xs">
              <span className="text-[12.5px] font-bold uppercase tracking-wider text-muted-foreground">
                Preset Size
              </span>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-fill p-1">
                {[
                  { id: 'desktop', label: 'Desktop' },
                  { id: 'phone', label: 'Phone' },
                  { id: 'print', label: 'Print A4' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPresetSize(preset.id as PresetSize)}
                    className={`rounded-lg py-1.5 text-[12px] font-bold transition-all ${
                      presetSize === preset.id
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Personalize Fields */}
          {templateMeta.hasNameClassFields && (
            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-xs">
              <span className="text-[12.5px] font-bold uppercase tracking-wider text-muted-foreground">
                Personalize Header Fields
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-[12px] font-semibold text-muted-foreground">
                  <span>Name:</span>
                  <input
                    type="text"
                    value={nameText}
                    onChange={(e) => setNameText(e.target.value)}
                    className="rounded-xl border border-border/80 bg-fill px-3 py-1.5 text-[13.5px] text-foreground focus:border-primary focus:outline-none font-medium"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[12px] font-semibold text-muted-foreground">
                  <span>Class / School:</span>
                  <input
                    type="text"
                    value={schoolText}
                    onChange={(e) => setSchoolText(e.target.value)}
                    className="rounded-xl border border-border/80 bg-fill px-3 py-1.5 text-[13.5px] text-foreground focus:border-primary focus:outline-none font-medium"
                  />
                </label>
              </div>
            </div>
          )}

          {/* High Quality Live Preview Artwork */}
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-md">
            <div className="w-full">
              <TemplateRenderer
                templateId={selectedTemplate}
                classes={classes}
                name={nameText}
                school={schoolText}
                presetSize={presetSize}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/80 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 font-semibold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Preparing your schedule…</span>
              </>
            ) : (
              <>
                <Download className="size-5" />
                <span className="uppercase tracking-wide">Download {format}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
