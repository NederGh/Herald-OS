import { REMINDER_MINUTES } from '../../shared/calendar-reminder.ts'
import type { CalendarReminderPrefs } from '../../shared/ipc.ts'
import { $prefs, updatePrefs } from '../store/backend.ts'
import { ok, type OsCommand } from '../store/os-commands.ts'

/*
 * The reminder before an event starts: a real Herald OS feature (Electron main watches the calendar
 * and raises it), so voice, the command bar and Hermes can turn it on, off and set how early it is.
 */

const read = (): CalendarReminderPrefs => $prefs.get().calendarReminder

const describe = (prefs: CalendarReminderPrefs): string =>
  prefs.enabled ? `Reminders ${prefs.minutesBefore} minutes before each event` : 'Event reminders are off'

export const calendarCommands: readonly OsCommand[] = [
  {
    id: 'calendar.reminder.set',
    title: 'Remind me before an event',
    description: `Before each of today's calendar events starts, a toast and — when Herald OS is not in front — a system notification. Leave the arguments out to hear the current setting.`,
    tier: 'act',
    args: [
      { name: 'enabled', type: 'boolean', description: 'true to turn the reminders on, false to turn them off; leave it out to keep it as it is' },
      { name: 'minutes', type: 'number', description: `Minutes before the event starts, ${REMINDER_MINUTES.min} to ${REMINDER_MINUTES.max}` }
    ],
    phrases: ['remind me before my events', 'remind me before an event', 'stop reminding me about events'],
    run: async ({ enabled, minutes }) => {
      const current = read()

      if (enabled === undefined && minutes === undefined) {
        return ok(describe(current), { data: { ...current } })
      }

      const wanted = minutes === undefined ? current.minutesBefore : Number(minutes)
      const next: CalendarReminderPrefs = {
        enabled: enabled === undefined ? current.enabled : Boolean(enabled),
        minutesBefore: Number.isFinite(wanted) ? Math.min(REMINDER_MINUTES.max, Math.max(REMINDER_MINUTES.min, Math.round(wanted))) : current.minutesBefore
      }
      await updatePrefs({ calendarReminder: next })

      return ok(describe(read()), { data: { ...read() }, highlight: { kind: 'setting', id: 'notifications' } })
    }
  },
  {
    id: 'calendar.reminder.status',
    title: 'Event reminder status',
    description: 'Whether the reminder before an event starts is on, and how many minutes early it arrives.',
    tier: 'read',
    args: [],
    run: async () => ok(describe(read()), { data: { ...read() } })
  }
]
