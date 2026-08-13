/**
 * lib/template-layout-utils.ts
 * Slot Index System for Grid-Style Templates (Simple Modern, Sage Green Nature).
 * Converts start_time and end_time to 30-minute slot indices for CSS Grid placement.
 */

import type { ClassEntry } from '@/lib/data'
import { parseMinutesFromTimeString } from '@/lib/template-helper'

export interface SlotGridClass {
  classEntry: ClassEntry
  startSlot: number // 0-indexed slot
  endSlot: number // 0-indexed slot (exclusive)
  gridRowStart: number // 1-based CSS Grid row line
  gridRowEnd: number // 1-based CSS Grid row line
  colIndex: number // 0-based day column index (0 = Monday, etc.)
  overlapIndex: number // 0 if no overlap, 1 if second overlapping item
  totalOverlaps: number // total overlapping items in this slot range
}

/**
 * Maps start and end times to 30-minute slot indices.
 * @param gridStartMins Minutes from midnight for grid start (e.g. 420 = 7:00 AM)
 * @param gridEndMins Minutes from midnight for grid end (e.g. 1140 = 7:00 PM)
 * @param slotDurationMins Minutes per slot (default 30)
 */
export function calculateSlotGridForDay(
  classes: ClassEntry[],
  dayIndex: number,
  gridStartMins = 420, // 7:00 AM
  gridEndMins = 1140, // 7:00 PM
  slotDurationMins = 30,
): SlotGridClass[] {
  const totalSlots = Math.floor((gridEndMins - gridStartMins) / slotDurationMins)

  const items = classes.map((c) => {
    let startMins = parseMinutesFromTimeString(c.start)
    let endMins = parseMinutesFromTimeString(c.end)

    if (!endMins || endMins <= startMins || isNaN(endMins)) {
      endMins = startMins + 60 // Default 1 hour duration
    }

    // Clamp to grid boundaries
    const clampedStart = Math.max(gridStartMins, Math.min(gridEndMins, startMins))
    let clampedEnd = Math.max(clampedStart + slotDurationMins, Math.min(gridEndMins, endMins))

    // Calculate 0-based slot indices
    const startSlot = Math.floor((clampedStart - gridStartMins) / slotDurationMins)
    const endSlot = Math.min(totalSlots, Math.ceil((clampedEnd - gridStartMins) / slotDurationMins))

    // CSS Grid line numbers (Line 1 is top of slot 0)
    const gridRowStart = startSlot + 1
    const gridRowEnd = Math.max(gridRowStart + 1, endSlot + 1)

    // Console logging for verification as required by Part 1 Step 5
    console.log(
      `[GridSlotMap] Class: "${c.subject}" (${c.start} - ${c.end}) -> Slots: ${startSlot} to ${endSlot} | CSS grid-row: ${gridRowStart} / ${gridRowEnd}`,
    )

    return {
      classEntry: c,
      startSlot,
      endSlot,
      gridRowStart,
      gridRowEnd,
      colIndex: dayIndex,
      overlapIndex: 0,
      totalOverlaps: 1,
    }
  })

  // Detect overlapping classes on the same day to split column width
  items.forEach((item, i) => {
    const overlaps = items.filter(
      (other, j) => j !== i && item.startSlot < other.endSlot && other.startSlot < item.endSlot,
    )
    if (overlaps.length > 0) {
      item.totalOverlaps = overlaps.length + 1
      item.overlapIndex = items.indexOf(item) % (overlaps.length + 1)
    }
  })

  return items
}
