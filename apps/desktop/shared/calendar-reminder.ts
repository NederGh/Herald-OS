// Calendar reminder defaults, shared by Electron main (prefs.json) and the renderer ($prefs seed)
// so a partially written `calendarReminder` object always resolves to a complete one.
import type { CalendarReminderPrefs } from './ipc.ts'

export const CALENDAR_REMINDER_DEFAULTS: CalendarReminderPrefs = { enabled: true, minutesBefore: 10 }

/** Bounds for `minutesBefore`: whole minutes, wide enough to prepare and short enough to matter. */
export const REMINDER_MINUTES = { min: 1, max: 120 } as const

/** Merge a possibly partial or malformed stored value onto the defaults. */
export function normalizeCalendarReminder(raw: unknown): CalendarReminderPrefs {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<CalendarReminderPrefs>
  const minutes = Math.round(Number(source.minutesBefore))

  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : CALENDAR_REMINDER_DEFAULTS.enabled,
    minutesBefore: Number.isFinite(minutes) ? Math.min(REMINDER_MINUTES.max, Math.max(REMINDER_MINUTES.min, minutes)) : CALENDAR_REMINDER_DEFAULTS.minutesBefore
  }
}
