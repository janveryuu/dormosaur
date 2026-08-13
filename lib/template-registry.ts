/**
 * lib/template-registry.ts
 * Registry and metadata for Schedule Visual Templates.
 */

export type ScheduleTemplateId =
  | 'simple-modern'
  | 'ultra-pink'
  | 'pink-notebook'
  | 'cute-cat-blue'
  | 'ocean-party'
  | 'sage-green'
  | 'forest-whimsy'
  | 'dormosaur-classic'
  | 'dormosaur-adventure'
  | 'dormosaur-night-mode'

export type ExportFormat = 'png' | 'jpeg' | 'pdf'
export type PresetSize = 'phone' | 'desktop' | 'print'

export interface TemplateMetadata {
  id: ScheduleTemplateId
  name: string
  category: 'Minimal' | 'Cute' | 'Aesthetic' | 'Nature'
  description: string
  imagePath: string
  bgPreview: string
  accentColor: string
  supportsGrid: boolean
  hasNameClassFields: boolean
}

export const SCHEDULE_TEMPLATES: TemplateMetadata[] = [
  {
    id: 'simple-modern',
    name: 'Simple Modern',
    category: 'Minimal',
    description: 'Clean monochrome timetable with bold CLASS SCHEDULE header & structured time grid.',
    imagePath: '/templates/simple-modern.png',
    bgPreview: '#ffffff',
    accentColor: '#18181b',
    supportsGrid: true,
    hasNameClassFields: false,
  },
  {
    id: 'ultra-pink',
    name: 'Ultra Pink',
    category: 'Cute',
    description: 'Bubblegum pink theme with bubble title, floral accents & 6 pink day cards.',
    imagePath: '/templates/ultra-pink.png',
    bgPreview: '#fbcfe8',
    accentColor: '#ec4899',
    supportsGrid: false,
    hasNameClassFields: true,
  },
  {
    id: 'pink-notebook',
    name: 'Pink Notebook',
    category: 'Aesthetic',
    description: 'Spiral-bound ring binder pads in a 3x2 grid with soft pink grid paper background.',
    imagePath: '/templates/pink-notebook.png',
    bgPreview: '#fce7f3',
    accentColor: '#db2777',
    supportsGrid: false,
    hasNameClassFields: false,
  },
  {
    id: 'cute-cat-blue',
    name: 'Cute Cat Blue',
    category: 'Cute',
    description: 'Powder blue background with winking cat speech bubble title & cat paw illustrations.',
    imagePath: '/templates/cute-cat-blue.png',
    bgPreview: '#bfe0f2',
    accentColor: '#0284c7',
    supportsGrid: false,
    hasNameClassFields: true,
  },
  {
    id: 'ocean-party',
    name: 'Ocean Party',
    category: 'Aesthetic',
    description: 'Periwinkle blue theme with sea-creatures in party hats & 7 rounded day cards.',
    imagePath: '/templates/ocean-party.png',
    bgPreview: '#6366f1',
    accentColor: '#4f46e5',
    supportsGrid: false,
    hasNameClassFields: false,
  },
  {
    id: 'sage-green',
    name: 'Sage Green Nature',
    category: 'Nature',
    description: 'Olive & terracotta palette with Name/Class card & full Time × Day timetable.',
    imagePath: '/templates/sage-green.png',
    bgPreview: '#b5c99a',
    accentColor: '#65a30d',
    supportsGrid: true,
    hasNameClassFields: true,
  },
  {
    id: 'forest-whimsy',
    name: 'Forest Whimsy',
    category: 'Nature',
    description: 'Teal-to-cream gradient background with whimsical trees, flying books & 6 dashed day cards.',
    imagePath: '/templates/forest-whimsy.png',
    bgPreview: '#047857',
    accentColor: '#059669',
    supportsGrid: false,
    hasNameClassFields: true,
  },
  {
    id: 'dormosaur-classic',
    name: 'Dormosaur Classic',
    category: 'Nature',
    description: 'Deep forest green timetable with subtle mascot line-art header & structured time grid.',
    imagePath: '/templates/dormosaur-classic.png',
    bgPreview: '#1F6F50',
    accentColor: '#1F6F50',
    supportsGrid: true,
    hasNameClassFields: true,
  },
  {
    id: 'dormosaur-adventure',
    name: 'Dormosaur Adventure',
    category: 'Nature',
    description: 'Forest-to-sage gradient background with abstract shapes, rounded day cards & Dormosaur mascot.',
    imagePath: '/templates/dormosaur-adventure.png',
    bgPreview: '#2E8B65',
    accentColor: '#1F6F50',
    supportsGrid: false,
    hasNameClassFields: true,
  },
  {
    id: 'dormosaur-night-mode',
    name: 'Dormosaur Night Mode',
    category: 'Aesthetic',
    description: 'Dark forest green to near-black gradient with soft mint accent highlights & subtle silhouette mascot watermark.',
    imagePath: '/templates/dormosaur-night-mode.png',
    bgPreview: '#0F1714',
    accentColor: '#38D399',
    supportsGrid: true,
    hasNameClassFields: true,
  },
]

export function getTemplateById(id: ScheduleTemplateId): TemplateMetadata {
  return SCHEDULE_TEMPLATES.find((t) => t.id === id) || SCHEDULE_TEMPLATES[0]
}
