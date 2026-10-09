import { computed, atom } from 'nanostores'
import { $prefs } from './backend.ts'
import type { BotBridgeState } from '../../shared/ipc.ts'
import { $connectionEpoch, gatewayRequest, isGatewayOpen } from './gateway.ts'

/** One bot, as the roster serves it and the shell shows it. */
export interface BotRow {
  /** The profile name the gateway uses; `default` is the launch profile itself. */
  name: string
  /** What the person reads: the bot's title when it has one, its name otherwise. */
  label: string
  /** The bot's own words about itself, when set. */
  description: string
  isDefault: boolean
  /** The bot's picture, as a data URL, the same one Hermes shows (`assets/avatar.*`). */
  avatar?: string | null
  /** The avatar's shape from the bot's own metadata (`squircle` is a soft square; the rest read round). */
  shape?: string | null
}

/** The picker's view: the default bot (no profile travels) plus whoever the person enabled, in their order. */
export interface BotOption {
  /** The profile name that travels on sessions; null is the default bot. */
  name: string | null
  label: string
  description: string
  /** The bot's picture, as a data URL, when it has one. */
  avatar?: string | null
  /** The avatar's shape from the bot's own metadata. */
  shape?: string | null
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

/** Avatars fetched once per session; a miss (no picture) is not cached, so a new one shows up on the next read. */
const avatarCache = new Map<string, string>()

/** The bot's picture, straight from Hermes's own store (`profiles.get_asset`, the face Bot Mode shows). */
async function avatarFor(name: string, has: boolean): Promise<string | null> {
  if (!has) {
    return null
  }

  const cached = avatarCache.get(name)

  if (cached) {
    return cached
  }

  try {
    const result = await gatewayRequest('profiles.get_asset', { name, asset: 'avatar' })
    const url = result?.found && result.data ? result.data : null

    if (url) {
      avatarCache.set(name, url)
    }

    return url
  } catch {
    return null
  }
}

/** Read the roster from the gateway; safe to call often (the picker refreshes it when it opens, so names are current). */
export async function refreshBots(): Promise<void> {
  if (!isGatewayOpen()) {
    return
  }

  $botsLoading.set(true)

  try {
    const result = await gatewayRequest('profiles.list', {})
    const profiles = result.profiles ?? []
    const avatars = new Map<string, string | null>()
    await Promise.all(
      profiles.map(async row => {
        avatars.set(row.name, await avatarFor(row.name, Boolean(row.has_avatar)))
      })
    )
    const rows: BotRow[] = profiles.map(row => {
      const meta = row.ui_meta && typeof row.ui_meta === 'object' ? (row.ui_meta as Record<string, unknown>)['hermes-bots'] : undefined
      const metaObject = meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : {}

      return {
        name: row.name,
        label: titleOf(row),
        description: typeof row.description === 'string' ? row.description.trim() : '',
        isDefault: Boolean(row.is_default),
        shape: typeof metaObject.shape === 'string' ? metaObject.shape : null,
        avatar: avatars.get(row.name) ?? null
      }
    })
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

  const optionOf = (row: BotRow, name: string | null): BotOption => ({ name, label: row.label, description: row.description, avatar: row.avatar ?? null, shape: row.shape ?? null })

  if (!enabled || enabled.length === 0) {
    return defaults.map(row => optionOf(row, null))
  }

  const byName = new Map(roster.map(row => [row.name, row]))

  return [...defaults.map(row => optionOf(row, null)), ...enabled.flatMap(name => (byName.has(name) ? [optionOf(byName.get(name) as BotRow, name)] : []))]
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

/** A bot joins Herald once its bridge is ready: linked, plugin and tools on, and nothing failed. */
export function botReady(state: BotBridgeState | null): boolean {
  return Boolean(state && !state.error && state.linked && state.pluginEnabled && state.toolsEnabled)
}

let bound = false

/** Read the roster on every fresh gateway connection: the shell cannot know the bots before the gateway answers. */
export function bindBots(): () => void {
  if (bound) {
    return () => undefined
  }

  bound = true
  const offEpoch = $connectionEpoch.subscribe(epoch => {
    if (epoch > 0) {
      void refreshBots()
    }
  })

  return () => {
    offEpoch()
    bound = false
  }
}
