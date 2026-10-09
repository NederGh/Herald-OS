import { $prefs, updatePrefs } from '../store/backend.ts'
import { $botOptions, botReady, matchBot, refreshBots } from '../store/bots.ts'
import { createChat } from '../store/chat.ts'
import { fail, ok, type OsCommand } from '../store/os-commands.ts'
import { refreshSessions } from '../store/sessions.ts'
import { showPage } from '../store/windows.ts'

/* The person's bots: which one a conversation runs as. */

export const botCommands: readonly OsCommand[] = [
  {
    id: 'bots.use',
    title: 'Talk to a bot',
    description: 'Start a conversation that runs as one of your Hermes bots.',
    tier: 'act',
    args: [{ name: 'bot', type: 'string', description: 'The bot, by name or title', required: true }],
    phrases: ['talk to {bot}', 'speak with {bot}', 'start talking to {bot}', 'use {bot}', 'parla con {bot}', 'fammi parlare con {bot}', 'vorrei parlare con {bot}'],
    run: async ({ bot }) => {
      await refreshBots()
      const options = $botOptions.get()

      const { match, candidates } = matchBot(options, String(bot))

      if (!match && candidates.length > 1) {
        return fail(`Which bot? ${candidates.map(option => option.label).slice(0, 5).join(', ')}`, { items: candidates.map(option => option.label) })
      }

      if (!match) {
        return fail(`No bot called "${String(bot)}".`, { items: options.map(option => option.label) })
      }

      const chat = await createChat({ bot: match.name })
      showPage('hermes')

      return ok(`Talking with ${match.label}`, { spoken: `Talking with ${match.label}.`, page: 'hermes', data: { sessionId: chat.sessionId, bot: match.name } })
    }
  },
  {
    id: 'bots.enabled.set',
    title: 'Show or hide a bot in Herald',
    description: 'Which bots appear in the session list and the New session menu.',
    tier: 'mutate',
    args: [
      { name: 'bot', type: 'string', description: 'The bot, by name or title', required: true },
      { name: 'show', type: 'boolean', description: 'true to show it in Herald, false to hide it' }
    ],
    phrases: [
      ...['show {bot}', 'add {bot} to herald', 'put {bot} in herald', 'mostra {bot}', 'fai vedere {bot}', 'aggiungi {bot} a herald'].map(phrase => ({ phrase, args: { show: true } })),
      ...['hide {bot}', 'remove {bot} from herald', 'nascondi {bot}', 'togli {bot} da herald'].map(phrase => ({ phrase, args: { show: false } }))
    ],
    run: async ({ bot, show }) => {
      await refreshBots()
      const options = $botOptions.get()
      const { match, candidates } = matchBot(options, String(bot))

      if (!match) {
        return candidates.length > 1
          ? fail(`Which bot? ${candidates.map(option => option.label).slice(0, 5).join(', ')}`, { items: candidates.map(option => option.label) })
          : fail(`No bot called "${String(bot)}".`, { items: options.map(option => option.label) })
      }

      if (!match.name) {
        return fail('Hermes itself always stays in Herald.')
      }

      if (show !== false) {
        const state = await window.heraldOS.bots.bridgeState(match.name).catch(() => null)

        if (!botReady(state)) {
          return fail(`${match.label} needs setup first: prepare it in Settings, under Hermes & agents.`)
        }
      }

      const prefs = $prefs.get()
      const current = prefs.bots.enabled ?? []
      const next = show === false ? current.filter(name => name !== match.name) : [...new Set([...current, match.name])]
      await updatePrefs({ bots: { enabled: next, last: prefs.bots.last } })
      void refreshSessions()

      return ok(show === false ? `${match.label} is hidden from Herald.` : `${match.label} shows up in Herald now.`, { data: { bot: match.name, enabled: next } })
    }
  },
  {
    id: 'bots.list',
    title: 'List your bots',
    description: 'List the bots a conversation can run as, with the one in front first.',
    tier: 'read',
    args: [],
    phrases: ['list my bots', 'which bots do I have', 'what bots can I talk to', 'elenca i bot', 'quali bot ho', 'che bot ho'],
    run: async () => {
      await refreshBots()
      const options = $botOptions.get()
      const names = options.map(option => option.label)

      return ok(names.length > 1 ? `Bots: ${names.join(', ')}.` : names[0] ? `Only ${names[0]} is set up so far.` : 'No bots are set up yet.', { items: names, data: { bots: options.map(option => option.name) } })
    }
  }
]
