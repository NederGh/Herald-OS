/*
 * The words on a calendar reminder: how much of the event is left, said the way a person would.
 * The reminder is raised a few minutes before the start, but it can arrive late (the machine slept),
 * so the line is always worked out from the time of day rather than from the lead time asked for.
 */

/** Minutes left before the event starts, never below zero. */
export function minutesLeft(start: number, now: number): number {
  return Math.max(0, Math.round((start - now) / 60_000))
}

/** A time of day, as the rest of the shell writes one. */
export function clockTime(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** The second line of the reminder: "Starts in 10 minutes, at 2:00 PM". */
export function reminderLine(start: number, now: number): string {
  const left = minutesLeft(start, now)

  return left === 0 ? `Starting now, at ${clockTime(start)}` : `Starts in ${left} ${left === 1 ? 'minute' : 'minutes'}, at ${clockTime(start)}`
}
