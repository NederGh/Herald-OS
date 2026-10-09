import { ipcMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { type BotBridgeState, type BotsPrepareResult, IPC } from '../../shared/ipc.ts'
import { prepareBotBridge } from '../backend/bridge-plugin.ts'
import type { BackendManager } from '../backend/manager.ts'
import { hermesHome } from '../paths.ts'

/*
 * The person's other bots (Hermes profiles): whether the Herald bridge stands in each, and the
 * guided preparation — the same declared steps the setup runs for the default profile, every one
 * with `-p <profile>` and nothing global. Preparation runs only when the person asks for it.
 */

/** A profile name as Hermes makes them; never a path, an option or anything else. */
export function validBotName(name: unknown): name is string {
  return typeof name === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(name)
}

/** A nested block list like `plugins:\n  enabled:\n    - name`; anything inline counts as unset (the setup writes block style). */
function blockList(lines: string[], top: string, sub: string): string[] {
  const items: string[] = []
  let inTop = false
  let inSub = false

  for (const line of lines) {
    const key = /^([A-Za-z_]+):/.exec(line)

    if (key) {
      inTop = key[1] === top
      inSub = false

      continue
    }

    if (!inTop) {
      continue
    }

    const nested = /^\s{1,4}([A-Za-z_]+):/.exec(line)

    if (nested) {
      inSub = nested[1] === sub

      continue
    }

    if (!inSub) {
      continue
    }

    const item = /^\s+-\s+(.+?)\s*$/.exec(line)

    if (item) {
      items.push(item[1])
    }
  }

  return items
}

/** The two lists the bridge cares about in a bot's config.yaml (pure; tested). */
export function configFlags(text: string): { pluginEnabled: boolean; toolsEnabled: boolean } {
  const lines = text.split('\n')

  return {
    pluginEnabled: blockList(lines, 'plugins', 'enabled').includes('herald-os-bridge'),
    toolsEnabled: blockList(lines, 'platform_toolsets', 'cli').includes('herald_os')
  }
}

/** Where the bridge stands for one bot: the link beside its profile, and what its config says. */
export function botBridgeState(name: string): BotBridgeState {
  const dir = path.join(hermesHome(), 'profiles', name)
  const link = path.join(dir, 'plugins', 'herald-os-bridge')
  let linked = false

  try {
    linked = fs.lstatSync(link).isSymbolicLink() && fs.existsSync(fs.realpathSync(link))
  } catch {
    linked = false
  }

  try {
    return { linked, ...configFlags(fs.readFileSync(path.join(dir, 'config.yaml'), 'utf8')) }
  } catch {
    return { linked, pluginEnabled: false, toolsEnabled: false }
  }
}

export function registerBotsIpc(backend: BackendManager): void {
  ipcMain.handle(IPC.botsBridgeState, (_event, name: unknown): BotBridgeState => {
    if (!validBotName(name)) {
      return { linked: false, pluginEnabled: false, toolsEnabled: false, error: `Not a bot name: ${String(name)}` }
    }

    return botBridgeState(name)
  })

  ipcMain.handle(IPC.botsPrepare, async (_event, name: unknown): Promise<BotsPrepareResult> => {
    if (!validBotName(name)) {
      return { ok: false, steps: [{ label: 'Check the bot name', ok: false, detail: `Not a bot name: ${String(name)}` }] }
    }

    const runtime = backend.getState().runtime

    if (!runtime || runtime.command.length === 0) {
      return { ok: false, steps: [{ label: 'Find Hermes', ok: false, detail: 'Herald OS has no Hermes runtime to run the steps with.' }] }
    }

    return prepareBotBridge(runtime, name)
  })
}
