import { computed, atom } from 'nanostores'
import { $prefs } from './backend.ts'
import { gatewayRequest, isGatewayOpen } from './gateway.ts'

/** One bot, as the roster serves it and the shell shows it. */
export interface BotRow {
  /** The profile name the gateway uses; `default` is the launch profile itself. */
  name: string
  /** What the person reads: the bot's title when it has one, its name otherwise. */
  label: string
  /** The bot's own words about itself, when set. */
  description: string
  isDefault: boolean
}

/** The picker's view: the default bot (no profile travels) plus whoever the person enabled, in their order. */
export interface BotOption {
  /** The profile name that travels on sessions; null is the default bot. */
  name: string | null
  label: string
  description: string
}

export const $roster = atom<BotRow[]>([])
export const $botsLoading = atom(false)

/** The bot's title lives in the profile's Bot Mode metadata (`ui_meta['hermes-bots']`); the shell falls back to the name. */
function titleOf(row: { name: string; display_name?: string | null; is_default?: boolean | null; ui_meta?: unknown }): string {
  const meta = row.ui_meta && typeof row.ui_meta === 'object' ? (row.ui_meta as Record<string, unknown>)['hermes-bots'] : undefined
  const title = meta && typeof meta === 'object' && typeof (meta as { title?: unknown }).title === 'string' ? (meta as { title: string }).title.trim() : ''
  const display = typeof row.display_name === 'string' ? row.display_name.trim() : ''

  return title || display || (row.is_default ? 'Hermes' : row.name)
}

/** Read the roster from the gateway; safe to call often (the picker refreshes it when it opens, so names are current). */
export async function refreshBots(): Promise<void> {
  if (!isGatewayOpen()) {
    return
  }

  $botsLoading.set(true)

  try {
    const result = await gatewayRequest('profiles.list', {})
    const rows = (result.profiles ?? []).map(row => ({
      name: row.name,
      label: titleOf(row),
      description: typeof row.description === 'string' ? row.description.trim() : '',
      isDefault: Boolean(row.is_default)
    }))
    $roster.set([...rows].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)))
  } catch {
    // Keep the cached roster; the next refresh retries.
  } finally {
    $botsLoading.set(false)
  }
}

/** The options the picker and the commands offer; empty until the roster arrives (call refreshBots first). */
export const $botOptions = computed([$roster, $prefs], (roster, prefs) => {
  const defaults = roster.filter(row => row.isDefault)
  const enabled = prefs.bots.enabled

  if (!enabled || enabled.length === 0) {
    return defaults.map(({ name, label, description }) => ({ name, label, description }))
  }

  const byName = new Map(roster.map(row => [row.name, row]))

  return [
    ...defaults.map(({ name, label, description }) => ({ name, label, description })),
    ...enabled.flatMap(name => {
      const row = byName.get(name)
      return row ? [{ name: row.name, label: row.label, description: row.description }] : []
    })
  ]
})

/** Match a spoken or typed name: an exact label or profile name wins, then a lone partial; several partials ask. */
export function matchBot(options: readonly BotOption[], query: string): { match: BotOption | null; candidates: BotOption[] } {
  const needle = query.trim().toLowerCase()

  if (!needle) {
    return { match: null, candidates: [...options] }
  }

  const exact = options.filter(option => option.label.toLowerCase() === needle || (option.name ?? '').toLowerCase() === needle)

  if (exact.length === 1) {
    return { match: exact[0], candidates: exact }
  }

  const partial = options.filter(option => option.label.toLowerCase().includes(needle) || (option.name ?? '').toLowerCase().includes(needle))

  return { match: partial.length === 1 ? partial[0] : null, candidates: partial }
}
