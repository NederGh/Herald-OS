import { useStore } from '@nanostores/react'
import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react'
import { BotAvatar, HermesAvatar } from '../../components/app-icon.tsx'
import { Dot } from '../../components/ui/primitives.tsx'
import { $prefs } from '../../store/backend.ts'
import { $botOptions, refreshBots } from '../../store/bots.ts'
import { MenuItem, PopMenu } from '../hermes/Menu.tsx'

/** Wraps a trigger in a menu of the bots new conversations run as; the pick refreshes the roster so names stay current, and the one in use is marked. */
export function BotPicker({ onPick, align = 'right', children }: { onPick: (bot: string | null) => void; align?: 'left' | 'right'; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const options = useStore($botOptions)
  const prefs = useStore($prefs)
  const active = prefs.bots.last ?? null
  const toggle = () => {
    if (!open) {
      void refreshBots()
    }

    setOpen(!open)
  }
  const trigger = isValidElement(children) ? cloneElement(children as ReactElement<{ onClick?: () => void }>, { onClick: toggle }) : <span onClick={toggle}>{children}</span>

  return (
    <PopMenu open={open} onClose={() => setOpen(false)} align={align} trigger={trigger}>
      {options.map(option => (
        <MenuItem
          key={option.name ?? 'default'}
          icon={option.name === null ? <HermesAvatar size={20} rounded={5} /> : option.avatar ? <BotAvatar image={option.avatar} name={option.label} size={20} shape={option.shape} /> : <Dot tone="accent" />}
          hint={option.name === active ? 'Active' : undefined}
          onClick={() => {
            setOpen(false)
            onPick(option.name)
          }}
        >
          {option.label}
        </MenuItem>
      ))}
    </PopMenu>
  )
}
