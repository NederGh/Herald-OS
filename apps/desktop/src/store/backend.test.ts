import { describe, expect, it, vi } from 'vitest'

/*
 * A prefs payload from a main process older than the calendar reminder: the renderer reloads live in
 * a dev run and main does not, so the object arrives without `calendarReminder`. No section may fail
 * on a missing preference.
 */

const bridge = vi.hoisted(() => {
  const payload = {
    fullscreenOnLaunch: true,
    reduceMotion: false,
    accent: 'blue',
    theme: 'ocean',
    spaces: [],
    activeSpace: 'personal',
    favorites: [],
    voice: {},
    continuity: { enabled: false, exclude: [] },
    crashHelp: { enabled: true, muted: [] }
  }
  const state: { emit: ((prefs: Record<string, unknown>) => void) | null } = { emit: null }

  Object.assign(globalThis, {
    document: { documentElement: { dataset: {}, style: { setProperty: () => undefined, removeProperty: () => undefined } } },
    window: {
      innerWidth: 1440,
      innerHeight: 900,
      heraldOS: {
        backend: { onState: () => () => undefined, getState: async () => ({ phase: 'idle', attempt: 0, logTail: [] }) },
        window: { onState: () => () => undefined, getState: async () => ({ fullscreen: false, focused: true }) },
        env: async () => ({ platform: 'darwin', hermesHome: '', homeDir: '', version: '0', isDev: false, shellMode: 'desktop' }),
        prefs: {
          get: async () => ({ ...payload }),
          set: async (patch: Record<string, unknown>) => ({ ...payload, ...patch }),
          onChanged: (handler: (prefs: Record<string, unknown>) => void) => {
            state.emit = handler

            return () => undefined
          }
        }
      }
    }
  })

  return { payload, state }
})

const { $prefs, bindBackendStores } = await import('./backend.ts')

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('a prefs payload from a main process older than a preference', () => {
  it('is completed from the shared defaults rather than left undefined', async () => {
    bindBackendStores()
    await flush()

    expect($prefs.get().calendarReminder).toEqual({ enabled: true, minutesBefore: 10 })
  })

  it('is completed the same way, and clamped, when another surface changes the prefs', async () => {
    bindBackendStores()
    await flush()
    bridge.state.emit?.({ ...bridge.payload, calendarReminder: { enabled: false, minutesBefore: 900 } })

    expect($prefs.get().calendarReminder).toEqual({ enabled: false, minutesBefore: 120 })
  })
})
