import { $botOptions, matchBot, refreshBots } from '../store/bots.ts'
import { createChat } from '../store/chat.ts'
import { fail, ok, type OsCommand } from '../store/os-commands.ts'
import { showPage } from '../store/windows.ts'

/* The person's bots: which one a conversation runs as. */

export const botCommands: readonly OsCommand[] = [
  {
    id: 'bots.use',
    title: 'Talk to a bot',
    description: 'Start a conversation that runs as one of your Hermes bots.',
    tier: 'act',
    args: [{ name: 'bot', type: 'string', description: 'The bot, by name or title', required: true }],
    phrases: ['talk to {bot}', 'speak with {bot}', 'start talking to {bot}', 'use {bot}'],
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

      return ok(`Talking with ${match.label}`, { page: 'hermes', data: { sessionId: chat.sessionId, bot: match.name } })
    }
  },
  {
    id: 'bots.list',
    title: 'List your bots',
    description: 'List the bots a conversation can run as, with the one in front first.',
    tier: 'read',
    args: [],
    phrases: ['list my bots', 'which bots do I have', 'what bots can I talk to'],
    run: async () => {
      await refreshBots()
      const options = $botOptions.get()
      const names = options.map(option => option.label)

      return ok(names.length > 1 ? `Bots: ${names.join(', ')}.` : names[0] ? `Only ${names[0]} is set up so far.` : 'No bots are set up yet.', { items: names, data: { bots: options.map(option => option.name) } })
    }
  }
]
