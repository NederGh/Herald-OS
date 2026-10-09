// Bot preference defaults, shared by Electron main (prefs.json) and the renderer ($prefs seed),
// so a partially written `bots` object always resolves to a complete one.
import type { BotsPrefs } from './ipc.ts'

/** Nobody chose yet: the shell behaves as before bots existed (only the default bot). */
export const BOT_DEFAULTS: BotsPrefs = { enabled: null, last: null }

/** Merge a possibly partial or malformed stored value onto the defaults. */
export function normalizeBotPrefs(raw: unknown): BotsPrefs {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<BotsPrefs>
  const enabled = Array.isArray(source.enabled)
    ? [...new Set(source.enabled.filter((name): name is string => typeof name === 'string' && name.trim() !== '').map(name => name.trim()))].slice(0, 20)
    : null
  const last = typeof source.last === 'string' && source.last.trim() !== '' ? source.last.trim() : null

  return { enabled, last }
}
