export const parseLocalDate = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const startOfWeek = (date: Date): Date => {
  const start = new Date(date)
  const weekday = start.getDay()
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1
  start.setDate(start.getDate() - daysFromMonday)
  start.setHours(0, 0, 0, 0)
  return start
}

export const formatWorkoutDate = (isoDate: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseLocalDate(isoDate))

export const isThisWeek = (isoDate: string, now = new Date()): boolean =>
  parseLocalDate(isoDate) >= startOfWeek(now)
