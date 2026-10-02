/** Active wallpapers; legacy IDs stay accepted for existing consumers. */
export type ActiveScheduleTemplateId = 'ultra-pink' | 'pink-notebook' | 'cute-cat-blue' | 'ocean-party' | 'sage-green' | 'forest-whimsy' | 'dormosaur-adventure' | 'dormosaur-night-mode'
export type ScheduleTemplateId = ActiveScheduleTemplateId | 'simple-modern' | 'dormosaur-classic'
export type ExportFormat = 'png' | 'jpeg' | 'pdf'
export type PresetSize = 'phone' | 'desktop' | 'print'
export interface WallpaperTheme { text: string; accent: string; panel: string; card: string; border: string; headerFont?: string; artworkSpace: number }
export interface TemplateMetadata {
  id: ActiveScheduleTemplateId
  name: string
  category: 'Cute' | 'Aesthetic' | 'Nature' | 'Dormosaur'
  description: string
  imagePath: string
  thumbnailPath: string
  bgPreview: string
  accentColor: string
  supportsGrid: boolean
  hasNameClassFields: boolean
  theme: WallpaperTheme
}
function theme(id: ActiveScheduleTemplateId, name: string, category: TemplateMetadata['category'], description: string, bgPreview: string, colors: WallpaperTheme, supportsGrid = false): TemplateMetadata {
  return { id, name, category, description, bgPreview, imagePath: `/templates/backgrounds/${id}.png`, thumbnailPath: `/templates/thumbnails/${id}.png`, accentColor: colors.accent, supportsGrid, hasNameClassFields: true, theme: colors }
}
export const SCHEDULE_TEMPLATES: TemplateMetadata[] = [
  theme('ultra-pink', 'Ultra Pink', 'Cute', 'Cherry blossoms and soft rose stationery.', '#fbe2e8', { text: '#56273b', accent: '#9d375e', panel: 'rgba(255,248,251,.90)', card: '#fff6fa', border: '#ebc3d2', headerFont: 'Georgia, serif', artworkSpace: 105 }),
  theme('pink-notebook', 'Pink Notebook', 'Aesthetic', 'A paper planner with pink notebook details.', '#fce7f3', { text: '#59343f', accent: '#a94368', panel: 'rgba(255,251,249,.92)', card: '#fff8f5', border: '#e9c2cb', headerFont: 'Georgia, serif', artworkSpace: 100 }),
  theme('cute-cat-blue', 'Cute Cat Blue', 'Cute', 'Blue study stationery and little companions.', '#d7eaff', { text: '#253c63', accent: '#3869a5', panel: 'rgba(248,252,255,.91)', card: '#eef6ff', border: '#bfd5ec', artworkSpace: 140 }),
  theme('ocean-party', 'Ocean Party', 'Aesthetic', 'An underwater week with coral and bubbles.', '#b5e9f7', { text: '#174656', accent: '#087b95', panel: 'rgba(247,255,255,.90)', card: '#eafafa', border: '#acdadd', artworkSpace: 130 }),
  theme('sage-green', 'Sage Green Nature', 'Nature', 'A calm botanical weekly timetable.', '#e2e7cb', { text: '#304532', accent: '#416247', panel: 'rgba(255,255,243,.93)', card: '#eff3e4', border: '#cad5b7', headerFont: 'Georgia, serif', artworkSpace: 95 }, true),
  theme('forest-whimsy', 'Forest Whimsy', 'Nature', 'A forest study week with room for the artwork.', '#e5efd9', { text: '#284630', accent: '#356e4b', panel: 'rgba(255,254,241,.91)', card: '#edf3e5', border: '#bdd0b9', headerFont: 'Georgia, serif', artworkSpace: 310 }),
  theme('dormosaur-adventure', 'Dormosaur Adventure', 'Dormosaur', 'Your week, ready for the next adventure.', '#dae8d7', { text: '#264835', accent: '#1f6f50', panel: 'rgba(255,253,239,.92)', card: '#edf3e7', border: '#bacdb8', headerFont: 'Georgia, serif', artworkSpace: 160 }),
  theme('dormosaur-night-mode', 'Dormosaur Night Mode', 'Dormosaur', 'A quiet timetable with mint and moonlight.', '#14211e', { text: '#edf8ef', accent: '#a6e4c4', panel: 'rgba(5,15,14,.90)', card: '#203c35', border: '#45695b', artworkSpace: 125 }, true),
]
export function resolveScheduleTemplateId(id: unknown): ActiveScheduleTemplateId {
  if (id === 'simple-modern') return 'sage-green'
  if (id === 'dormosaur-classic') return 'dormosaur-adventure'
  return SCHEDULE_TEMPLATES.some((entry) => entry.id === id) ? id as ActiveScheduleTemplateId : 'dormosaur-adventure'
}
export function getTemplateById(id: unknown): TemplateMetadata {
  return SCHEDULE_TEMPLATES.find((entry) => entry.id === resolveScheduleTemplateId(id))!
}
export const ARTBOARD_SIZES: Record<PresetSize, { width: number; height: number }> = {
  phone: { width: 390, height: 390 * 16 / 9 }, desktop: { width: 1200, height: 750 }, print: { width: 794, height: 1123 },
}
