import { useStore } from '@nanostores/react'
import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react'
import { Dot } from '../../components/ui/primitives.tsx'
import { $botOptions, refreshBots } from '../../store/bots.ts'
import { MenuItem, PopMenu } from '../hermes/Menu.tsx'

/** Wraps a trigger in a menu of the bots a conversation can start as; the pick refreshes the roster so names stay current. */
export function BotPicker({ onPick, align = 'right', children }: { onPick: (bot: string | null) => void; align?: 'left' | 'right'; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const options = useStore($botOptions)
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
          icon={<Dot tone="accent" />}
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
