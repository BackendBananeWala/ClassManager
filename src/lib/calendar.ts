import type { ClassSession } from '@/types'

export function toGoogleCalendarUrl(cls: ClassSession): string {
  const dateClean = cls.date.replace(/-/g, '')
  const startClean = cls.timeStart.replace(':', '') + '00'
  const endClean = cls.timeEnd.replace(':', '') + '00'

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: cls.name,
    dates: `${dateClean}T${startClean}/${dateClean}T${endClean}`,
    details: cls.remarks || '',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
