import { powerMonitor } from 'electron'
import { normalizeCalendarReminder } from '../../shared/calendar-reminder.ts'
import type { CalendarEvent, CalendarReminderNotice } from '../../shared/ipc.ts'
import { log } from '../log.ts'
import { hostPlatform } from '../platform/index.ts'
import { readPrefs } from '../prefs.ts'

/*
 * The reminder before a calendar event starts. The clock panel reads today's events through the
 * bridge and shows them; nothing follows them, so an event arrives unannounced. This watches the
 * same reading and tells the shell a few minutes before each event starts.
 *
 * It lives in main, not in the renderer, because Chromium throttles a renderer's timers the moment
 * its window is not in front — exactly when this reminder matters (ADR-023).
 */

/** The reading is refreshed at least this often, so an event created after the last one still reminds. */
export const REREAD_MS = 10 * 60_000
/** The shortest wait between two arms, so a moment arriving now still leaves the loop room to breathe. */
const MIN_TICK_MS = 1_000

/** A local calendar day, so this morning's events are told from tomorrow's. */
export function dayKey(at: number): string {
  const date = new Date(at)

  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

/** One reminder per event per day: a re-armed timer cannot fire the same event twice. */
export function reminderKey(event: CalendarEvent): string {
  return `${dayKey(event.start)}:${event.id}`
}

/** The instant a reminder runs: the event's start minus the minutes before. */
export function reminderAt(event: CalendarEvent, minutesBefore: number): number {
  return event.start - minutesBefore * 60_000
}

/**
 * The reminders whose moment has come: events still ahead whose moment has passed and that have not
 * been sent yet. An event the machine slept through still reminds while it is ahead — a late "starts
 * in three minutes" beats silence. An all-day event has no moment to remind about.
 */
export function dueReminders(events: readonly CalendarEvent[], now: number, minutesBefore: number, sent: ReadonlySet<string>): CalendarReminderNotice[] {
  return events
    .filter(event => !event.allDay && event.start > now && reminderAt(event, minutesBefore) <= now && !sent.has(reminderKey(event)))
    .sort((a, b) => a.start - b.start)
    .map(event => ({ key: reminderKey(event), id: event.id, title: event.title, start: event.start, minutes: minutesBefore }))
}

/** When the next reminder runs, or null when nothing is left to remind about. */
export function nextReminderAt(events: readonly CalendarEvent[], now: number, minutesBefore: number, sent: ReadonlySet<string>): number | null {
  const moments = events
    .filter(event => !event.allDay && event.start > now && !sent.has(reminderKey(event)))
    .map(event => reminderAt(event, minutesBefore))
    .filter(at => at > now)

  return moments.length ? Math.min(...moments) : null
}

export interface CalendarReminders {
  /** Read the preference again and re-arm; called when the setting changes. */
  refresh: () => void
  stop: () => void
}

/**
 * Watch today's events and call `send` for each reminder whose moment has come. Nothing is read at
 * all while reminders are off, so the calendar is only touched by someone who asked for this.
 */
export function startCalendarReminders(send: (reminder: CalendarReminderNotice) => void): CalendarReminders {
  let events: readonly CalendarEvent[] = []
  let readAt = 0
  let minutes: number | null = null
  let timer: NodeJS.Timeout | null = null
  let running = false
  let stopped = false
  const sent = new Set<string>()

  const clear = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const readToday = async (): Promise<void> => {
    try {
      const today = await hostPlatform().calendarToday()

      if (today.status !== 'authorized') {
        log('calendar', `no reminders: the calendar is ${today.status}${today.error ? ` (${today.error})` : ''}`)
      }

      events = today.status === 'authorized' ? today.events : []
      readAt = Date.now()
    } catch (error) {
      events = []
      readAt = Date.now()
      log('calendar', `could not read the calendar: ${(error as Error).message}`)
    }
  }

  const arm = async (): Promise<void> => {
    clear()

    if (stopped) {
      return
    }

    const prefs = normalizeCalendarReminder(readPrefs().calendarReminder)
    const lead = prefs.minutesBefore

    if (minutes !== lead) {
      // A different lead time asks for a different moment, so an event already reminded can remind again.
      sent.clear()
      minutes = lead
    }

    if (!prefs.enabled) {
      return
    }

    if (Date.now() - readAt > REREAD_MS) {
      await readToday()
    }

    const now = Date.now()

    for (const reminder of dueReminders(events, now, lead, sent)) {
      sent.add(reminder.key)
      send(reminder)
      log('calendar', `reminded: ${reminder.title} in ${Math.round((reminder.start - now) / 60_000)} min`)
    }

    const next = nextReminderAt(events, Date.now(), lead, sent)
    // Nothing left to remind about, or the moment is further away than the next re-read: wait, then read again.
    const wait = next === null ? REREAD_MS : Math.max(MIN_TICK_MS, Math.min(next - Date.now(), REREAD_MS))
    timer = setTimeout(() => void arm(), wait)
  }

  const refresh = () => {
    if (!running || stopped) {
      return
    }

    void arm()
  }

  const onResume = () => {
    // A timer set before the sleep is meaningless after it, and the calendar may have moved on.
    readAt = 0
    refresh()
  }

  const onSuspend = () => clear()

  powerMonitor.on('resume', onResume)
  powerMonitor.on('suspend', onSuspend)
  running = true
  void arm()

  return {
    refresh,
    stop: () => {
      stopped = true
      running = false
      clear()
      powerMonitor.removeListener('resume', onResume)
      powerMonitor.removeListener('suspend', onSuspend)
    }
  }
}
