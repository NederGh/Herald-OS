import { useStore } from '@nanostores/react'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useEffect } from 'react'
import { Button } from '../../components/ui/button.tsx'
import { cn } from '../../lib/cn.ts'
import { formatRelative } from '../../lib/format.ts'
import { $botOptions, refreshBots } from '../../store/bots.ts'
import { $activeChatId, $chats, createChat, forgetChat, LISTED_SESSION_SOURCES, openStoredSession } from '../../store/chat.ts'
import { $runtimeIds, $sessions, deleteSession } from '../../store/sessions.ts'
import { BotPicker } from './BotPicker.tsx'

export function SessionList() {
  const sessions = useStore($sessions)
  const runtimeIds = useStore($runtimeIds)
  const activeId = useStore($activeChatId)
  const chats = useStore($chats)
  const botOptions = useStore($botOptions)
  const visible = sessions.filter(row => !row.source || LISTED_SESSION_SOURCES.has(row.source))

  // The roster feeds the picker and paints each row's bot label; read it once the list is on screen.
  useEffect(() => {
    void refreshBots()
  }, [])

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-hairline">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[11px] font-medium tracking-[0.08em] text-fg-3 uppercase">Sessions</span>
        {botOptions.length > 1 ? (
          <BotPicker onPick={bot => void createChat({ bot })}>
            <Button variant="ghost" size="icon-sm" aria-label="New session, choose a bot" aria-haspopup="menu">
              <IconPlus size={15} />
            </Button>
          </BotPicker>
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label="New session" onClick={() => void createChat()}>
            <IconPlus size={15} />
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        {visible.length === 0 && <div className="px-2 py-4 text-[12px] text-fg-4">No sessions yet. Say something to Hermes.</div>}
        {visible.map(row => {
          const runtimeId = runtimeIds[row.id]
          const live = runtimeId ? chats[runtimeId] : undefined
          const active = runtimeId === activeId && Boolean(activeId)
          const title = live?.title || row.title || row.preview || 'Untitled'
          const botLabel = row.bot ? (botOptions.find(option => option.name === row.bot)?.label ?? row.bot) : null

          return (
            <div key={`${row.bot ?? 'default'}:${row.id}`} className={cn('group relative flex items-center rounded-md', active ? 'bg-white/6' : 'hover:bg-white/4')}>
              <button type="button" onClick={() => void openStoredSession(row.id, row.bot)} className="min-w-0 flex-1 px-2.5 py-2 text-left">
                <div className="flex items-center gap-2">
                  {live?.streaming && <span className="size-1.5 shrink-0 rounded-full bg-accent animate-pulse-soft" />}
                  <span className={cn('truncate text-[12.5px]', active ? 'text-fg' : 'text-fg-2')}>{title}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-fg-4">
                  <span>{formatRelative(row.started_at)}</span>
                  {row.message_count ? <span>· {row.message_count} msgs</span> : null}
                  {botLabel ? <span>· {botLabel}</span> : null}
                </div>
              </button>
              <button
                type="button"
                aria-label="Delete session"
                onClick={() => {
                  void deleteSession(row.id, row.bot)

                  if (runtimeId) {
                    forgetChat(runtimeId)
                  }
                }}
                className="mr-1 hidden size-6 shrink-0 items-center justify-center rounded-xs text-fg-4 hover:text-danger group-hover:flex"
              >
                <IconTrash size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
