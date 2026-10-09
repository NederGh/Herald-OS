import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import type { BotBridgeState, BotsPrepareResult } from '../../../../shared/ipc.ts'
import { BotAvatar } from '../../../components/app-icon.tsx'
import { GlassButton, Pill, Toggle } from '../../../components/ui/glass.tsx'
import { $prefs, updatePrefs } from '../../../store/backend.ts'
import { $roster, type BotRow, refreshBots } from '../../../store/bots.ts'
import { notify } from '../../../store/notifications.ts'
import { refreshSessions } from '../../../store/sessions.ts'
import { errorText, InlineNote, markSaved, SettingsBlock, SettingsRow } from './shared.tsx'

/*
 * Bots: the person's other Hermes bots. Which of them show up in Herald, and the guided
 * preparation of the bridge — exactly the steps the setup runs for the default bot, every one in
 * the bot's own profile and none global, run only when the person asks.
 */

export function BotsBlock() {
  const roster = useStore($roster)
  const prefs = useStore($prefs)

  useEffect(() => {
    void refreshBots()
  }, [])

  const bots = roster.filter(row => !row.isDefault)

  if (bots.length === 0) {
    return null
  }

  const toggle = (name: string, on: boolean) => {
    const current = prefs.bots.enabled ?? []
    const next = on ? [...new Set([...current, name])] : current.filter(entry => entry !== name)

    void updatePrefs({ bots: { enabled: next, last: prefs.bots.last } })
      .then(() => {
        markSaved()
        void refreshSessions()
      })
      .catch(error => notify({ title: 'Could not change the bots', body: errorText(error), level: 'error' }))
  }

  return (
    <SettingsBlock label="Bots" description="Your other Hermes bots: who shows up in Herald, and whether Herald's tools work inside them." keywords="bots bot profiles alfred mark sally">
      {bots.map(bot => (
        <BotSettingsRow key={bot.name} bot={bot} enabled={(prefs.bots.enabled ?? []).includes(bot.name)} onToggle={on => toggle(bot.name, on)} />
      ))}
    </SettingsBlock>
  )
}

function BotSettingsRow({ bot, enabled, onToggle }: { bot: BotRow; enabled: boolean; onToggle: (on: boolean) => void }) {
  const [state, setState] = useState<BotBridgeState | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState<BotsPrepareResult | null>(null)

  const read = () => {
    void window.heraldOS.bots
      .bridgeState(bot.name)
      .then(setState)
      .catch(() => setState(null))
  }

  useEffect(() => {
    read()
  }, [bot.name])

  const ready = Boolean(state && !state.error && state.linked && state.pluginEnabled && state.toolsEnabled)

  const prepare = async () => {
    setBusy(true)

    try {
      const result = await window.heraldOS.bots.prepare(bot.name)
      setReport(result)
      setConfirming(false)
      notify(result.ok ? { title: `${bot.label} is ready`, level: 'success' } : { title: `Could not finish preparing ${bot.label}`, level: 'error' })
    } catch (error) {
      notify({ title: 'Could not prepare the bot', body: errorText(error), level: 'error' })
    } finally {
      setBusy(false)
      read()
    }
  }

  return (
    <SettingsRow
      icon={<BotAvatar image={bot.avatar} name={bot.label} size={32} shape={bot.shape} />}
      label={bot.label}
      keywords={`bot ${bot.name}`}
      below={
        <>
          {!ready && !confirming && (
            <div className="flex items-center gap-2 pb-1">
              <InlineNote className="flex-1">Herald's tools are not set up in this bot yet, so it cannot do things on your Mac.</InlineNote>
              <GlassButton size="sm" variant="ghost" onClick={() => setConfirming(true)} aria-label={`Prepare ${bot.label}`}>
                Prepare
              </GlassButton>
            </div>
          )}
          {confirming && (
            <div className="flex flex-col gap-1.5 pb-1">
              <InlineNote tone="info">
                Runs the same steps the setup runs for your default bot, each one in {bot.label}'s own profile and nothing global: links the bridge plugin beside it, enables the plugin, enables Herald's tools, turns Tool Search off for this bot.
              </InlineNote>
              <div className="flex items-center gap-2">
                <GlassButton size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                  Cancel
                </GlassButton>
                <GlassButton size="sm" variant="primary" disabled={busy} onClick={() => void prepare()} aria-label={`Confirm preparing ${bot.label}`}>
                  Prepare {bot.label}
                </GlassButton>
              </div>
            </div>
          )}
          {report && (
            <div className="flex flex-col gap-0.5 pb-1">
              {report.steps.map(step => (
                <div key={step.label} className="text-[12px] leading-snug">
                  <span className={step.ok ? 'text-fg-2' : 'text-danger'}>{step.ok ? '✓' : '✗'}</span> <span className="text-fg-2">{step.label}</span>
                  {step.detail && <span className="text-fg-4"> — {step.detail}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      }
    >
      {state === null ? (
        <Pill tone="muted">…</Pill>
      ) : ready ? (
        <Pill tone="ok" dot>
          Ready
        </Pill>
      ) : (
        <Pill tone="warn" dot>
          Needs setup
        </Pill>
      )}
      <Toggle checked={enabled} onChange={onToggle} label={`Show ${bot.label} in Herald`} />
    </SettingsRow>
  )
}
