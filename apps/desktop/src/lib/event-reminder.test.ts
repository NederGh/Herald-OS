import { describe, expect, it } from 'vitest'
import { minutesLeft, reminderLine } from './event-reminder.ts'

const at = (hour: number, minute = 0) => new Date(2026, 9, 10, hour, minute, 0).getTime()

describe('minutesLeft', () => {
  it('counts the whole minutes to the start', () => {
    expect(minutesLeft(at(14), at(13, 50))).toBe(10)
    expect(minutesLeft(at(14), at(13, 59))).toBe(1)
  })

  it('never goes below zero once the event has started', () => {
    expect(minutesLeft(at(14), at(14))).toBe(0)
    expect(minutesLeft(at(14), at(14, 30))).toBe(0)
  })
})

describe('reminderLine', () => {
  it('says how long is left and when it starts', () => {
    const line = reminderLine(at(14), at(13, 50))

    expect(line).toContain('10 minutes')
    expect(line).toContain(new Date(at(14)).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }))
  })

  it('says one minute in the singular', () => {
    expect(reminderLine(at(14), at(13, 59))).toContain('1 minute,')
  })

  it('says it is starting when the moment has arrived', () => {
    expect(reminderLine(at(14), at(14))).toContain('Starting now')
  })
})
