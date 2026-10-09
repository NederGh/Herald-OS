import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { botBridgeState, configFlags, validBotName } from './bots.ts'

describe('validBotName', () => {
  it('takes profile names and nothing that could be a path or an option', () => {
    expect(validBotName('alfred')).toBe(true)
    expect(validBotName('sales-assistant')).toBe(true)
    expect(validBotName('../default')).toBe(false)
    expect(validBotName('-p')).toBe(false)
    expect(validBotName('')).toBe(false)
    expect(validBotName('Upper')).toBe(false)
    expect(validBotName('a/b')).toBe(false)
    expect(validBotName(42)).toBe(false)
  })
})

describe('configFlags', () => {
  it('reads block lists and treats inline lists as unset', () => {
    const text =
      'model:\n  default: x\nplugins:\n  enabled:\n    - herald-os-bridge\n    - homeassistant\n  disabled: []\nplatform_toolsets:\n  cli:\n    - browser\n    - herald_os\ntools:\n  tool_search:\n    enabled: "off"\n'

    expect(configFlags(text)).toEqual({ pluginEnabled: true, toolsEnabled: true })
    expect(configFlags('plugins:\n  enabled: [herald-os-bridge]\n')).toEqual({ pluginEnabled: false, toolsEnabled: false })
    expect(configFlags('')).toEqual({ pluginEnabled: false, toolsEnabled: false })
  })

  it('does not confuse the disabled list with the enabled one', () => {
    const text = 'plugins:\n  enabled: []\n  disabled:\n    - herald-os-bridge\nplatform_toolsets:\n  cli: []\n'

    expect(configFlags(text)).toEqual({ pluginEnabled: false, toolsEnabled: false })
  })
})

describe('botBridgeState', () => {
  const saved = process.env.HERMES_HOME
  let root = ''

  afterEach(() => {
    if (saved === undefined) {
      delete process.env.HERMES_HOME
    } else {
      process.env.HERMES_HOME = saved
    }

    fs.rmSync(root, { recursive: true, force: true })
  })

  it('reads the link beside the profile and its config lists', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'botstate-'))
    process.env.HERMES_HOME = root
    const dir = path.join(root, 'profiles', 'alfred')
    fs.mkdirSync(path.join(dir, 'plugins'), { recursive: true })
    const target = path.join(root, 'Herald-OS', 'plugins', 'herald-os-bridge')
    fs.mkdirSync(target, { recursive: true })
    fs.symlinkSync(target, path.join(dir, 'plugins', 'herald-os-bridge'))
    fs.writeFileSync(path.join(dir, 'config.yaml'), 'plugins:\n  enabled:\n    - herald-os-bridge\nplatform_toolsets:\n  cli:\n    - herald_os\n')

    expect(botBridgeState('alfred')).toEqual({ linked: true, pluginEnabled: true, toolsEnabled: true })

    // A link into nowhere reads as unlinked, and a profile without a config reads as unset.
    fs.rmSync(target, { recursive: true, force: true })
    expect(botBridgeState('alfred')).toEqual({ linked: false, pluginEnabled: true, toolsEnabled: true })
    expect(botBridgeState('mark')).toEqual({ linked: false, pluginEnabled: false, toolsEnabled: false })
  })
})
