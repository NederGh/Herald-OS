import { describe, expect, it } from 'vitest'
import { BOT_DEFAULTS, normalizeBotPrefs } from './bot-prefs.ts'

describe('normalizeBotPrefs', () => {
  it('fills defaults for missing or malformed values', () => {
    expect(normalizeBotPrefs(undefined)).toEqual(BOT_DEFAULTS)
    expect(normalizeBotPrefs('junk')).toEqual(BOT_DEFAULTS)
    expect(normalizeBotPrefs({ enabled: 'alfred', last: 42 })).toEqual(BOT_DEFAULTS)
  })

  it('keeps a real list of bot names, trimmed and deduplicated', () => {
    const prefs = normalizeBotPrefs({ enabled: [' alfred ', 'mark', '', 'alfred', 7], last: ' mark ' })
    expect(prefs.enabled).toEqual(['alfred', 'mark'])
    expect(prefs.last).toBe('mark')
  })

  it('keeps "none chosen yet" apart from "never configured"', () => {
    expect(normalizeBotPrefs({ enabled: [] }).enabled).toEqual([])
    expect(normalizeBotPrefs({}).enabled).toBeNull()
  })

  it('caps the list and treats a blank last name as absent', () => {
    expect(normalizeBotPrefs({ enabled: Array.from({ length: 30 }, (_, index) => `bot${index}`) }).enabled).toHaveLength(20)
    expect(normalizeBotPrefs({ last: '   ' }).last).toBeNull()
  })
})
