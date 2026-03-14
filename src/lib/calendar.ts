export function buildDaySyncUrl(date: string, classes: string[], tags: string[]): string {
  const dateClean = date.replace(/-/g, '')

  const lines: string[] = []
  if (classes.length > 0) lines.push(`Classes: ${classes.join(', ')}`)
  if (tags.length > 0) lines.push(`Tags: ${tags.join(', ')}`)
  const description = lines.join('\n')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'College Day',
    dates: `${dateClean}T090000/${dateClean}T180000`,
    details: description,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
