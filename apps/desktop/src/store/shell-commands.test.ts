import { beforeEach, describe, expect, it, vi } from 'vitest'

/*
 * The `calendar-soon` command main sends when an event is about to start: the shell turns it into a
 * notification, and raises the system one when the window is not in front. The stores read the
 * preload bridge when they load, so this stub stands in for it.
 */

const { native } = vi.hoisted(() => {
  const native = vi.fn(async () => undefined)

  Object.assign(globalThis, {
    window: {
      innerWidth: 1440,
      innerHeight: 900,
      heraldOS: {
        shell: { mode: 'desktop', surface: 'desktop' },
        notifications: { native },
        window: { getState: async () => ({ fullscreen: false, focused: true }), onState: () => () => undefined },
        backend: { getState: async () => ({ phase: 'idle', attempt: 0, logTail: [] }), onState: () => () => undefined },
        env: async () => ({ platform: 'darwin', hermesHome: '', homeDir: '', version: '0', isDev: false, shellMode: 'desktop' }),
        prefs: { get: async () => ({}), set: async () => ({}), onChanged: () => () => undefined }
      }
    }
  })

  return { native }
})

const { handleShellCommand } = await import('./shell-commands.ts')
const { $notifications, $toasts } = await import('./notifications.ts')
const { $prefs, $windowState } = await import('./backend.ts')

const notice = (start = Date.now() + 10 * 60_000) => ({ type: 'calendar-soon', payload: { key: '2026-10-10:x', id: 'x', title: 'Chiamare Gianluca', start, minutes: 10 } })

describe('the calendar-soon ShellCommand', () => {
  beforeEach(() => {
    $notifications.set([])
    $toasts.set([])
    native.mockClear()
  })

  it('raises a notification named after the event, saying how long is left', () => {
    handleShellCommand(notice())

    const [entry] = $notifications.get()

    expect(entry.title).toBe('Chiamare Gianluca')
    expect(entry.body).toContain('10 minutes')
    expect(entry.body).toContain('Starts in')
  })

  it('keys it by the reminder, so a second arrival replaces the first', () => {
    handleShellCommand(notice())
    handleShellCommand(notice(Date.now() + 9 * 60_000))

    expect($notifications.get()).toHaveLength(1)
    expect($notifications.get()[0].body).toContain('9 minutes')
  })

  it('offers a way to today, as one of the shell own commands', () => {
    handleShellCommand(notice())

    expect($notifications.get()[0].actions).toEqual([{ label: 'See today', command: 'panel.open', args: { panel: 'clock' } }])
  })

  it('stays inside Herald OS while the window is in front', () => {
    handleShellCommand(notice())

    expect(native).not.toHaveBeenCalled()
  })

  it('becomes a system notification when the window is not in front', () => {
    $windowState.set({ fullscreen: false, focused: false })
    handleShellCommand(notice())

    expect(native).toHaveBeenCalledWith('Chiamare Gianluca', expect.stringContaining('10 minutes'))
    $windowState.set({ fullscreen: false, focused: true })
  })

  it('ignores a payload without an event to name or a start to count from', () => {
    handleShellCommand({ type: 'calendar-soon', payload: { key: 'k' } })
    handleShellCommand({ type: 'calendar-soon', payload: { title: 'x' } })

    expect($notifications.get()).toEqual([])
  })

  it('says it is starting when the moment has passed', () => {
    handleShellCommand(notice(Date.now() - 60_000))

    expect($notifications.get()[0].body).toContain('Starting now')
  })

  it('collects silently under do not disturb', () => {
    $prefs.set({ ...$prefs.get(), doNotDisturb: true })
    $windowState.set({ fullscreen: false, focused: false })
    handleShellCommand(notice())

    expect($toasts.get()).toEqual([])
    expect(native).not.toHaveBeenCalled()
    expect($notifications.get()).toHaveLength(1)
    $prefs.set({ ...$prefs.get(), doNotDisturb: false })
    $windowState.set({ fullscreen: false, focused: true })
  })
})
