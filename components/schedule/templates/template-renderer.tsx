'use client'

import * as React from 'react'
import type { ClassEntry } from '@/lib/data'
import type { ScheduleTemplateId, PresetSize } from '@/lib/template-registry'
import { SimpleModernTemplate } from './layouts/simple-modern'
import { UltraPinkTemplate } from './layouts/ultra-pink'
import { PinkNotebookTemplate } from './layouts/pink-notebook'
import { CuteCatBlueTemplate } from './layouts/cute-cat-blue'
import { OceanPartyTemplate } from './layouts/ocean-party'
import { SageGreenTemplate } from './layouts/sage-green'
import { ForestWhimsyTemplate } from './layouts/forest-whimsy'
import { DormosaurClassicTemplate } from './layouts/dormosaur-classic'
import { DormosaurAdventureTemplate } from './layouts/dormosaur-adventure'
import { DormosaurNightModeTemplate } from './layouts/dormosaur-night-mode'

interface TemplateRendererProps {
  templateId: ScheduleTemplateId
  classes: ClassEntry[]
  name?: string
  school?: string
  presetSize?: PresetSize
}

export function TemplateRenderer({
  templateId,
  classes,
  name,
  school,
  presetSize = 'desktop',
}: TemplateRendererProps) {
  // Dynamic aspect ratio based on preset size
  const aspectClass =
    presetSize === 'phone'
      ? 'aspect-[9/16] max-w-[420px] mx-auto min-h-[580px]'
      : presetSize === 'print'
      ? 'aspect-[1/1.414] max-w-[500px] mx-auto min-h-[600px]'
      : 'aspect-[16/10] w-full min-h-[460px]'

  return (
    <div
      id="schedule-export-artboard"
      className={`relative w-full overflow-hidden rounded-3xl shadow-xl transition-all duration-300 ${aspectClass}`}
    >
      {templateId === 'simple-modern' && <SimpleModernTemplate classes={classes} />}
      {templateId === 'ultra-pink' && <UltraPinkTemplate classes={classes} name={name} school={school} />}
      {templateId === 'pink-notebook' && <PinkNotebookTemplate classes={classes} />}
      {templateId === 'cute-cat-blue' && <CuteCatBlueTemplate classes={classes} name={name} school={school} />}
      {templateId === 'ocean-party' && <OceanPartyTemplate classes={classes} />}
      {templateId === 'sage-green' && <SageGreenTemplate classes={classes} name={name} school={school} />}
      {templateId === 'forest-whimsy' && <ForestWhimsyTemplate classes={classes} name={name} school={school} />}
      {templateId === 'dormosaur-classic' && <DormosaurClassicTemplate classes={classes} name={name} school={school} />}
      {templateId === 'dormosaur-adventure' && <DormosaurAdventureTemplate classes={classes} name={name} school={school} />}
      {templateId === 'dormosaur-night-mode' && <DormosaurNightModeTemplate classes={classes} name={name} school={school} />}
    </div>
  )
}
