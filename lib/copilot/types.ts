export type ChatMessage = { role: 'user' | 'assistant'; content: string }
export type ClassItem = {
  id?: string; code?: string; subject?: string; days: string[]
  start?: string; end?: string; room?: string; instructor?: string
}
export type AlarmItem = {
  classId?: string; code?: string; subject?: string; time?: string
  day?: string; enabled: boolean; lead?: number
}
export type DeadlineItem = {
  title?: string; code?: string; type?: string; dueDate?: string
  dueTime?: string; completed: boolean
}
export type Profile = {
  name?: string; school?: string; program?: string; year?: string
  timezone?: string; appliances?: string[]; dietary?: string; dietaryNote?: string
}
export type DataSource = 'synced' | 'local' | 'unavailable' | 'not_connected'
export type StudentContext = {
  profile: Profile; classes: ClassItem[]; alarms: AlarmItem[]; deadlines: DeadlineItem[]
  sources: Record<'profile' | 'classes' | 'alarms' | 'deadlines', DataSource>
}
export type RuntimeIdentity = { provider: 'groq' | 'gemini'; model: string }
export type ChatReply = {
  role: 'assistant'; content: string; mode: 'ai' | 'local' | 'limited'
  model: string | null; label: string
}
