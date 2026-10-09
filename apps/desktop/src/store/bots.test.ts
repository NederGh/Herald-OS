import { describe, expect, it, vi } from 'vitest'
import { botReady, matchBot, type BotOption } from './bots.ts'

// The store reads the gateway and the preload bridge when it loads; tests run without a DOM.
vi.mock('./gateway.ts', () => ({ $connectionEpoch: { get: () => 0, subscribe: () => () => undefined }, gatewayRequest: async () => ({}), isGatewayOpen: () => false }))

const options: BotOption[] = [
  { name: null, label: 'Hermes', description: '' },
  { name: 'alfred', label: 'Alfred', description: '' },
  { name: 'mark', label: 'Mark Backend', description: '' },
  { name: 'sales-assistant', label: 'Sally', description: '' }
]

describe('matchBot', () => {
  it('matches a label or a profile name exactly, case aside', () => {
    expect(matchBot(options, 'sally').match?.name).toBe('sales-assistant')
    expect(matchBot(options, 'hermes').match?.name).toBeNull()
    expect(matchBot(options, 'ALFRED').match?.name).toBe('alfred')
    expect(matchBot(options, 'sales-assistant').match?.label).toBe('Sally')
  })

  it('takes a lone partial match', () => {
    expect(matchBot(options, 'mark').match?.name).toBe('mark')
    expect(matchBot(options, 'sa').match?.name).toBe('sales-assistant')
  })

  it('asks when a partial matches several', () => {
    const result = matchBot(options, 'a')
    expect(result.match).toBeNull()
    expect(result.candidates.map(option => option.label)).toEqual(['Alfred', 'Mark Backend', 'Sally'])
  })

  it('offers everything when the query is empty, nothing when it matches none', () => {
    expect(matchBot(options, '  ').candidates).toHaveLength(4)
    expect(matchBot(options, 'zzz').candidates).toEqual([])
  })
})

describe('botReady', () => {
  it('is ready only with the link, the plugin and the tools on, and nothing failed', () => {
    expect(botReady(null)).toBe(false)
    expect(botReady({ linked: true, pluginEnabled: true, toolsEnabled: true })).toBe(true)
    expect(botReady({ linked: true, pluginEnabled: true, toolsEnabled: false })).toBe(false)
    expect(botReady({ linked: false, pluginEnabled: true, toolsEnabled: true })).toBe(false)
    expect(botReady({ linked: true, pluginEnabled: true, toolsEnabled: true, error: 'nope' })).toBe(false)
  })
})
