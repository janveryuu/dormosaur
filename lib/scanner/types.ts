import type { Weekday } from './time'

export type Field = 'code' | 'subject' | 'instructor' | 'room' | 'days' | 'time'

/** One meeting as read from the source, before cleanup and merging. */
export type Draft = {
  code: string
  subject: string
  instructor: string
  room: string
  days: Weekday[]
  start: string
  end: string
  low: Set<Field>
}

/** A transcribed timetable grid: rows top to bottom, cells keyed by weekday. */
export type GridRow = { label: string; start: string; end: string; cells: Partial<Record<Weekday, { subject: string; room: string }>> }
export type Grid = { days: Weekday[]; rows: GridRow[] }

export type ScanInput = { text: string } | { image: string }
