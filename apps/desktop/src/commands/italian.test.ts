import { describe, expect, it, vi } from 'vitest'
import { matchIntent } from '../lib/voice/intents.ts'
import type { CommandSummary, OsCommand } from '../store/os-commands.ts'
import { ITALIAN_APP_ALIASES, ITALIAN_PAGE_ALIASES, ITALIAN_PHRASES, withItalianPhrases } from './italian.ts'
import { resolveAppId } from './navigation.ts'

// The stores read the preload bridge and the viewport when they load; tests run without a DOM.
vi.hoisted(() => {
  Object.assign(globalThis, { window: { innerWidth: 1440, innerHeight: 900 } })
})

describe('withItalianPhrases', () => {
  const command = (id: string, phrases: readonly string[]): OsCommand => ({ id, title: id, description: '', tier: 'act', args: [], phrases })

  it('appends the Italian phrases to a matching command by id', () => {
    const groups = { hermes: [command('chat.new', ['new chat'])] }
    const out = withItalianPhrases(groups)

    expect(out.hermes[0].phrases).toEqual(['new chat', ...(ITALIAN_PHRASES['chat.new'] as readonly string[])])
    expect(groups.hermes[0].phrases).toEqual(['new chat'])
  })

  it('leaves commands without Italian entries alone', () => {
    const groups = { misc: [command('not.a.command', ['x'])] }

    expect(withItalianPhrases(groups).misc[0]).toBe(groups.misc[0])
  })

  it('keeps every other group untouched', () => {
    const groups = { a: [command('chat.new', [])], b: [command('voice.mute', [])] }
    const out = withItalianPhrases(groups)

    expect(Object.keys(out)).toEqual(['a', 'b'])
    expect((out.b[0].phrases as readonly string[]).length).toBeGreaterThan(0)
  })
})

describe('Italian names resolve like the English ones', () => {
  it('resolves Italian page names', () => {
    expect(resolveAppId('impostazioni')).toBe('settings')
    expect(resolveAppId('la memoria')).toBe('memory')
    expect(resolveAppId('missioni')).toBe('missions')
    expect(resolveAppId('conversazione')).toBe('hermes')
  })

  it('resolves Italian app names, articles included', () => {
    expect(resolveAppId('terminale')).toBe('terminal')
    expect(resolveAppId('il terminale')).toBe('terminal')
    expect(resolveAppId('dox')).toBe('docs')
    expect(resolveAppId('docks')).toBe('docs')
  })

  it('ships the alias maps the resolver consumes', () => {
    expect(ITALIAN_PAGE_ALIASES['impostazioni']).toBe('settings')
    expect(ITALIAN_APP_ALIASES['terminale']).toBe('terminal')
  })
})

describe('Italian rides the voice fast path', () => {
  const commands: CommandSummary[] = [
    { id: 'open.any', title: 'Open', description: '', tier: 'act', hidden: true, args: [{ name: 'name', type: 'string', description: '', required: true }], phrases: ['open {name}', 'apri {name}', 'mostrami {name}'] },
    { id: 'page.open', title: 'Open a page', description: '', tier: 'read', hidden: false, args: [{ name: 'name', type: 'string', description: '', required: true }], phrases: ['open the {name} page', 'apri la pagina {name}'] },
    { id: 'memory.add', title: 'Remember', description: '', tier: 'mutate', hidden: false, args: [{ name: 'text', type: 'string', description: '', required: true }], phrases: ['remember {text}', 'ricorda che {text}', 'ricorda {text}'] },
    { id: 'memory.forget', title: 'Forget', description: '', tier: 'destructive', hidden: false, args: [{ name: 'match', type: 'string', description: '', required: true }], phrases: ['forget {match}', 'dimentica {match}', 'dimentica che {match}'] },
    { id: 'window.close', title: 'Close a window', description: '', tier: 'act', hidden: false, args: [{ name: 'name', type: 'string', description: '' }], phrases: ['close {name}', 'chiudi {name}'] },
    { id: 'chat.new', title: 'New chat', description: '', tier: 'act', hidden: false, args: [], phrases: ['new chat', 'nuova chat'] },
    { id: 'voice.quiet', title: 'Stop talking', description: '', tier: 'read', hidden: true, args: [], phrases: ['be quiet', 'silenzio'] }
  ]

  const match = (text: string) => matchIntent(text, commands)

  it('routes Italian opens with the Italian article kept for the resolver', () => {
    expect(match('apri la memoria')).toMatchObject({ command: 'open.any', args: { name: 'la memoria' } })
    expect(match('apri la pagina missioni')).toMatchObject({ command: 'page.open', args: { name: 'missioni' } })
    expect(match('mostrami le impostazioni')).toMatchObject({ command: 'open.any', args: { name: 'le impostazioni' } })
  })

  it('keeps destructive commands off the fast path, Italian included', () => {
    expect(match('dimentica il compleanno di Marco')).toBeNull()
  })

  it('routes Italian memory, windows and chat', () => {
    expect(match('ricorda che il latte scade domani')).toMatchObject({ command: 'memory.add', args: { text: 'il latte scade domani' } })
    expect(match('chiudi il terminale')).toMatchObject({ command: 'window.close', args: { name: 'il terminale' } })
    expect(match('nuova chat')).toMatchObject({ command: 'chat.new' })
    expect(match('silenzio')).toMatchObject({ command: 'voice.quiet' })
  })
})
