import { useStore } from '@nanostores/react'
import { IconBellRinging, IconBug, IconCalendarEvent, IconChecklist, IconClock, IconDeviceDesktop, IconShieldCheck, IconVolumeOff, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { REMINDER_MINUTES } from '../../../../shared/calendar-reminder.ts'
import type { CalendarReminderPrefs } from '../../../../shared/ipc.ts'
import { Toggle } from '../../../components/ui/glass.tsx'
import { $prefs, updatePrefs } from '../../../store/backend.ts'
import { setCrashHelpEnabled, setCrashMuted } from '../../../store/crashes.ts'
import { errorText, InlineNote, markSaved, readLocalFlag, SectionTitle, SettingsGroup, SettingsRow, Stepper, writeLocal } from './shared.tsx'

/*
 * Notification preferences are shell-side flags in localStorage (`herald-os.notify.*`). The
 * notification store does not read them yet; see the page report for the proposed wiring.
 * The calendar reminder is the exception: it is a real preference in prefs.json, because Electron
 * main watches the calendar and reads the setting from there.
 */

export const NOTIFY_KEYS = {
  toolCompletions: 'herald-os.notify.tool-completions',
  approvals: 'herald-os.notify.approvals',
  taskUpdates: 'herald-os.notify.task-updates',
  nativeWhenUnfocused: 'herald-os.notify.native-unfocused'
} as const

type NotifyKey = keyof typeof NOTIFY_KEYS

const ROWS: { key: NotifyKey; label: string; description: string; icon: React.ReactNode; keywords?: string }[] = [
  { key: 'toolCompletions', label: 'Tool completions', description: 'A toast when a long-running tool finishes in a session you are not looking at.', icon: <IconChecklist />, keywords: 'toast finished' },
  { key: 'approvals', label: 'Approvals', description: 'Tell me when Hermes is waiting for a decision.', icon: <IconShieldCheck />, keywords: 'permission request waiting' },
  { key: 'taskUpdates', label: 'Task updates', description: 'Scheduled tasks that ran, failed or changed.', icon: <IconBellRinging />, keywords: 'cron automations' },
  { key: 'nativeWhenUnfocused', label: 'Native notifications when unfocused', description: 'Use system notifications while Herald OS is in the background.', icon: <IconDeviceDesktop />, keywords: 'macos system background' }
]

export function NotificationsSection() {
  const [flags, setFlags] = useState<Record<NotifyKey, boolean>>(() => ({
    toolCompletions: readLocalFlag(NOTIFY_KEYS.toolCompletions, true),
    approvals: readLocalFlag(NOTIFY_KEYS.approvals, true),
    taskUpdates: readLocalFlag(NOTIFY_KEYS.taskUpdates, true),
    nativeWhenUnfocused: readLocalFlag(NOTIFY_KEYS.nativeWhenUnfocused, true)
  }))

  const set = (key: NotifyKey, value: boolean) => {
    setFlags(prev => ({ ...prev, [key]: value }))
    writeLocal(NOTIFY_KEYS[key], String(value))
    markSaved()
  }

  return (
    <>
      <SectionTitle title="Notifications" subtitle="These are Herald OS shell preferences. They shape what the shell surfaces; Hermes itself keeps working either way." />

      <SettingsGroup title="Alerts">
        {ROWS.map(row => (
          <SettingsRow key={row.key} icon={row.icon} label={row.label} description={row.description} keywords={row.keywords}>
            <Toggle checked={flags[row.key]} onChange={next => set(row.key, next)} label={row.label} />
          </SettingsRow>
        ))}
      </SettingsGroup>

      <CalendarReminderGroup />
      <CrashHelpGroup />
    </>
  )
}

function CalendarReminderGroup() {
  const { calendarReminder } = useStore($prefs)
  const [error, setError] = useState<string | null>(null)

  const save = (patch: Partial<CalendarReminderPrefs>) =>
    updatePrefs({ calendarReminder: { ...calendarReminder, ...patch } }).then(
      () => {
        setError(null)
        markSaved()
      },
      reason => setError(errorText(reason))
    )

  return (
    <SettingsGroup title="Calendar">
      <SettingsRow
        icon={<IconCalendarEvent />}
        label="Remind me before an event"
        description="A few minutes before each of today's events starts: a toast in Herald OS, and a system notification when it is not in front. Needs Calendar access, which the clock panel in the menu bar asks for the first time it is opened."
        keywords="event meeting appointment upcoming agenda reminder"
        below={error ? <InlineNote tone="danger">{error}</InlineNote> : undefined}
      >
        <Toggle checked={calendarReminder.enabled} onChange={next => void save({ enabled: next })} label="Remind me before an event" />
      </SettingsRow>
      <SettingsRow
        icon={<IconClock />}
        label="Minutes before"
        description="How early the reminder arrives."
        keywords="lead time early ahead minutes"
      >
        <Stepper
          value={calendarReminder.minutesBefore}
          onChange={next => void save({ minutesBefore: next })}
          min={REMINDER_MINUTES.min}
          max={REMINDER_MINUTES.max}
          disabled={!calendarReminder.enabled}
          label="Minutes before"
        />
      </SettingsRow>
    </SettingsGroup>
  )
}

function CrashHelpGroup() {
  const { enabled, muted } = useStore($prefs).crashHelp
  const [error, setError] = useState<string | null>(null)

  const save = (work: Promise<unknown>) =>
    work.then(
      () => {
        setError(null)
        markSaved()
      },
      reason => setError(errorText(reason))
    )

  return (
    <SettingsGroup title="Crash help">
      <SettingsRow
        icon={<IconBug />}
        label="Offer to explain crashes"
        description="When a program crashes, a notification offers to have Hermes read the crash report and say what went wrong. Nothing is sent until you ask."
        keywords="crash report core dump diagnose"
        below={error ? <InlineNote tone="danger">{error}</InlineNote> : undefined}
      >
        <Toggle checked={enabled} onChange={next => save(setCrashHelpEnabled(next))} label="Offer to explain crashes" />
      </SettingsRow>
      <SettingsRow
        icon={<IconVolumeOff />}
        label="Muted programs"
        description={muted.length === 0 ? 'Mute a program from its crash notification to stop hearing about it.' : 'Crashes from these programs stay quiet.'}
        keywords="mute crash quiet"
        below={
          muted.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {muted.map(app => (
                <span key={app} className="inline-flex h-7 items-center gap-1 rounded-full border border-line bg-white/6 pr-1 pl-2.5 text-[12px] text-fg-2">
                  {app}
                  <button type="button" aria-label={`Unmute ${app}`} onClick={() => save(setCrashMuted(app, false))} className="flex size-5 items-center justify-center rounded-full text-fg-3 hover:bg-white/10 hover:text-fg">
                    <IconX size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : undefined
        }
      />
    </SettingsGroup>
  )
}
