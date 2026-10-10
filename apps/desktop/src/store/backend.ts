import { atom } from 'nanostores'
import type { BackendState, EnvInfo, HeraldOSPrefs, WindowState } from '../../shared/ipc.ts'
import { PALETTE_PROPERTIES, paletteVars, schemeOf } from '../../shared/theme.ts'
import { BOT_DEFAULTS } from '../../shared/bot-prefs.ts'
import { CALENDAR_REMINDER_DEFAULTS, normalizeCalendarReminder } from '../../shared/calendar-reminder.ts'
import { VOICE_DEFAULTS } from '../../shared/voice-prefs.ts'

/** Cache of Electron's backend truth; Electron is authoritative. */
export const $backend = atom<BackendState>({ phase: 'idle', attempt: 0, logTail: [] })
export const $windowState = atom<WindowState>({ fullscreen: false, focused: true })
export const $env = atom<EnvInfo | null>(null)
export const $prefs = atom<HeraldOSPrefs>({
  fullscreenOnLaunch: true,
  reduceMotion: false,
  accent: 'blue',
  theme: 'ocean',
  spaces: [{ id: 'personal', name: 'Personal', color: '#4d92ff' }],
  activeSpace: 'personal',
  favorites: [],
  bots: BOT_DEFAULTS,
  voice: VOICE_DEFAULTS,
  // Off until the real prefs arrive, so the Overview never flashes the catch-up offer.
  continuity: { enabled: false, exclude: [] },
  crashHelp: { enabled: true, muted: [] },
  calendarReminder: CALENDAR_REMINDER_DEFAULTS
})

/** A font family as a CSS value (quoted unless it is a generic family). */
const cssFamily = (family: string) => (/^(serif|sans-serif|monospace|system-ui|ui-[a-z-]+)$/.test(family) ? family : JSON.stringify(family.trim()))

export function applyPrefsToDocument(prefs: HeraldOSPrefs): void {
  const root = document.documentElement
  root.dataset.accent = prefs.accent
  root.dataset.theme = prefs.theme
  root.dataset.reduceMotion = String(prefs.reduceMotion)

  // Presets live in styles.css; any other theme's palette is derived from its colours.
  for (const property of PALETTE_PROPERTIES) {
    root.style.removeProperty(property)
  }

  if (prefs.themeColors) {
    const panels = window.heraldOS?.shell?.mode === 'panels'

    for (const [property, value] of Object.entries(paletteVars(prefs.themeColors, { scheme: prefs.themeScheme, panels }))) {
      root.style.setProperty(property, value)
    }
  }

  root.dataset.scheme = prefs.themeColors ? schemeOf(prefs.themeColors, prefs.themeScheme) : 'dark'

  for (const [property, family] of [
    ['--user-font-ui', prefs.fonts?.ui],
    ['--user-font-mono', prefs.fonts?.mono]
  ] as const) {
    if (family?.trim()) {
      root.style.setProperty(property, cssFamily(family))
    } else {
      root.style.removeProperty(property)
    }
  }
}

export async function updatePrefs(patch: Partial<HeraldOSPrefs>): Promise<void> {
  const next = completePrefs(await window.heraldOS.prefs.set(patch))
  $prefs.set(next)
  applyPrefsToDocument(next)
}

/*
 * Main owns the shape of the prefs (electron/prefs.ts normalizes every read and write). The one way
 * the renderer can be handed an object missing a required preference is a main process older than
 * the field — a half-updated dev run, where the renderer reloads live and main does not. Complete it
 * once here, from the same shared defaults main uses, so no section can fail on a missing field.
 */
const completePrefs = (prefs: HeraldOSPrefs): HeraldOSPrefs => ({ ...prefs, calendarReminder: normalizeCalendarReminder(prefs.calendarReminder) })

export function bindBackendStores(): () => void {
  const offBackend = window.heraldOS.backend.onState(state => $backend.set(state))
  const offWindow = window.heraldOS.window.onState(state => $windowState.set(state))
  void window.heraldOS.backend.getState().then(state => $backend.set(state))
  void window.heraldOS.window.getState().then(state => $windowState.set(state))
  void window.heraldOS.env().then(info => $env.set(info))
  void window.heraldOS.prefs.get().then(prefs => {
    $prefs.set(completePrefs(prefs))
    applyPrefsToDocument(prefs)
  })
  // Preferences changed by another surface window or by the `herald-os` CLI (theme, wallpaper).
  const offPrefs = window.heraldOS.prefs.onChanged?.(prefs => {
    $prefs.set(completePrefs(prefs))
    applyPrefsToDocument(prefs)
  })

  return () => {
    offBackend()
    offWindow()
    offPrefs?.()
  }
}
