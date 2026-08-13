'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ScheduleTemplateId } from '@/lib/template-registry'
import { TemplatePickerView } from './template-picker-view'
import { ExportPreviewView } from './export-preview-view'

interface TemplateModalProps {
  open: boolean
  onClose: () => void
}

type ModalStep = 'picker' | 'export'

export function TemplateModal({ open, onClose }: TemplateModalProps) {
  const [step, setStep] = React.useState<ModalStep>('picker')
  const [selectedTemplate, setSelectedTemplate] = React.useState<ScheduleTemplateId>('simple-modern')

  // Reset to picker when closed
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => setStep('picker'), 300)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container with iOS Spring Motion */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="relative z-10 flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-background shadow-2xl"
          >
            {step === 'picker' ? (
              <TemplatePickerView
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
                onNext={() => setStep('export')}
                onClose={onClose}
              />
            ) : (
              <ExportPreviewView
                selectedTemplate={selectedTemplate}
                onBack={() => setStep('picker')}
                onClose={onClose}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
