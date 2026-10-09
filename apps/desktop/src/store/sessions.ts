import type { SessionListRow } from '@herald-os/client'
import { atom } from 'nanostores'
import { $prefs } from './backend.ts'
import { gatewayRequest, isGatewayOpen } from './gateway.ts'

/** A session row plus the bot (its profile name) whose database answered; null is the default bot. */
export type SessionRow = SessionListRow & { bot: string | null }

export const $sessions = atom<SessionRow[]>([])
export const $sessionsLoading = atom(false)

/** stored id -> runtime id, so the sidebar can highlight the live chat. */
export const $runtimeIds = atom<Record<string, string>>({})

export function rememberRuntimeId(storedId: string, runtimeId: string): void {
  $runtimeIds.set({ ...$runtimeIds.get(), [storedId]: runtimeId })
}

/** Rows from different bots share nothing, so a key pairs the bot with the id. */
function rowKey(row: SessionRow): string {
  return `${row.bot ?? 'default'}:${row.id}`
}

let inflight: Promise<void> | null = null

export function refreshSessions(): Promise<void> {
  if (!isGatewayOpen()) {
    return Promise.resolve()
  }

  if (inflight) {
    return inflight
  }

  $sessionsLoading.set(true)
  // Every bot keeps its conversations in its own database; ask each enabled bot, and the default one, then show them together, newest first.
  const sources: Array<{ bot: string | null; params: { limit: number; profile?: string } }> = [
    { bot: null, params: { limit: 60 } },
    ...($prefs.get().bots.enabled ?? []).map(name => ({ bot: name, params: { limit: 60, profile: name } }))
  ]
  inflight = Promise.all(
    sources.map(source =>
      gatewayRequest('session.list', source.params)
        .then(result => (result.sessions ?? []).map(row => ({ ...row, bot: source.bot })))
        // One bot failing to answer must not empty the others' list.
        .catch(() => [] as SessionRow[])
    )
  )
    .then(lists => {
      // Merge, don't clobber: keep rows we know about that a truncated list dropped.
      const incoming = lists.flat()
      const seen = new Set(incoming.map(rowKey))
      const kept = $sessions.get().filter(row => !seen.has(rowKey(row)))
      const merged = [...incoming, ...kept].sort((a, b) => (b.started_at ?? 0) - (a.started_at ?? 0))
      $sessions.set(merged)
    })
    .catch(() => {
      // Keep the cached list; the next refresh retries.
    })
    .finally(() => {
      $sessionsLoading.set(false)
      inflight = null
    })

  return inflight
}

export async function deleteSession(storedId: string, bot: string | null = null): Promise<void> {
  await gatewayRequest('session.delete', { session_id: storedId, ...(bot ? { profile: bot } : {}) })
  $sessions.set($sessions.get().filter(row => !(row.id === storedId && row.bot === bot)))
}
