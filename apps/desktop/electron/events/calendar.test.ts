import { describe, expect, it, vi } from 'vitest'
import type { CalendarEvent } from '../../shared/ipc.ts'

// The module watches Electron's power monitor; these tests only exercise the pure decisions.
vi.mock('electron', () => ({ powerMonitor: { on: () => undefined, removeListener: () => undefined }, ipcMain: { handle: () => undefined } }))

const { dayKey, dueReminders, nextReminderAt, reminderAt, reminderKey } = await import('./calendar.ts')

const at = (hour: number, minute = 0) => new Date(2026, 9, 10, hour, minute, 0).getTime()

const event = (id: string, hour: number, minute = 0, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id,
  title: `Event ${id}`,
  start: at(hour, minute),
  end: at(hour, minute) + 30 * 60_000,
  allDay: false,
  ...extra
})

describe('the moment a reminder runs', () => {
  it('is the event start minus the minutes before', () => {
    expect(reminderAt(event('a', 14), 10)).toBe(at(13, 50))
    expect(reminderAt(event('a', 14), 120)).toBe(at(12))
  })

  it('keys one reminder per event per day', () => {
    const today = event('a', 14)
    const tomorrow = { ...today, start: at(14) + 86_400_000 }

    expect(reminderKey(today)).toBe('2026-10-10:a')
    expect(reminderKey(tomorrow)).not.toBe(reminderKey(today))
    expect(dayKey(today.start)).toBe('2026-10-10')
  })
})

describe('dueReminders', () => {
  const sent = new Set<string>()

  it('fires at the moment, not before', () => {
    const events = [event('a', 14)]

    expect(dueReminders(events, at(13, 49), 10, sent)).toEqual([])
    expect(dueReminders(events, at(13, 50), 10, sent)).toEqual([{ key: '2026-10-10:a', id: 'a', title: 'Event a', start: at(14), minutes: 10 }])
  })

  it('still fires after the moment, while the event is ahead', () => {
    // The machine slept through 13:50: a late "starts in three minutes" beats silence.
    expect(dueReminders([event('a', 14)], at(13, 57), 10, sent)).toHaveLength(1)
  })

  it('leaves an event that already started alone', () => {
    expect(dueReminders([event('a', 14)], at(14), 10, sent)).toEqual([])
    expect(dueReminders([event('a', 14)], at(15), 10, sent)).toEqual([])
  })

  it('never reminds twice', () => {
    const events = [event('a', 14)]
    const already = new Set(['2026-10-10:a'])

    expect(dueReminders(events, at(13, 50), 10, already)).toEqual([])
  })

  it('has no moment to remind about for an all-day event', () => {
    const allDay = event('a', 0, 0, { allDay: true, start: at(0), end: at(23, 59) })

    expect(dueReminders([allDay], at(12), 10, sent)).toEqual([])
    expect(nextReminderAt([allDay], at(12), 10, sent)).toBeNull()
  })

  it('gives the soonest event first', () => {
    // Both moments have passed (13:50 and 13:55), so both are due: the earlier event leads.
    const due = dueReminders([event('late', 14, 5), event('soon', 14)], at(13, 56), 10, sent)

    expect(due.map(reminder => reminder.id)).toEqual(['soon', 'late'])
  })
})

describe('nextReminderAt', () => {
  const sent = new Set<string>()

  it('is the soonest moment still ahead', () => {
    expect(nextReminderAt([event('a', 14), event('b', 16)], at(13), 10, sent)).toBe(at(13, 50))
  })

  it('is null when the day is done', () => {
    expect(nextReminderAt([event('a', 14)], at(20), 10, sent)).toBeNull()
    expect(nextReminderAt([], at(9), 10, sent)).toBeNull()
  })

  it('ignores the moments already spent', () => {
    const events = [event('a', 14), event('b', 16)]

    expect(nextReminderAt(events, at(13, 55), 10, new Set(['2026-10-10:a']))).toBe(at(15, 50))
  })
})
