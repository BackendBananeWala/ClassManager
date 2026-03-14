import { ref as dbRef, set, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import { storage } from '@/lib/storage'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export async function pushData(syncId: string): Promise<void> {
  const json = storage.exportAll()
  const data = JSON.parse(json)
  data.syncedAt = new Date().toISOString()
  await set(dbRef(db, `users/${syncId}`), data)
}

function toArray(val: unknown): unknown[] {
  if (Array.isArray(val)) return val
  if (val && typeof val === 'object') return Object.values(val)
  return []
}

function fixFirebaseData(raw: Record<string, unknown>): Record<string, unknown> {
  const result = { ...raw }

  result.class_names = toArray(result.class_names)
  result.quick_tags = toArray(result.quick_tags)

  const rawDays = toArray(result.day_records)
  result.day_records = rawDays.map((entry: any) => ({
    date: entry?.date ?? '',
    classes: toArray(entry?.classes),
    tags: toArray(entry?.tags),
  }))

  return result
}

export async function pullData(syncId: string): Promise<Record<string, unknown> | null> {
  const snapshot = await get(dbRef(db, `users/${syncId}`))
  if (!snapshot.exists()) return null
  const raw = snapshot.val() as Record<string, unknown>
  return fixFirebaseData(raw)
}

export function debouncedPush(syncId: string, onDone?: () => void): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    try {
      await pushData(syncId)
      onDone?.()
    } catch {
      // silent fail for background sync
    }
  }, 2000)
}

export function mergeData(local: Record<string, unknown>, remote: Record<string, unknown>): Record<string, unknown> {
  const safeRemote = fixFirebaseData(remote)
  const merged: Record<string, unknown> = { ...local }

  const localNames = toArray(local.class_names) as string[]
  const remoteNames = toArray(safeRemote.class_names) as string[]
  merged.class_names = [...new Set([...localNames, ...remoteNames])]

  const localTags = toArray(local.quick_tags) as string[]
  const remoteTags = toArray(safeRemote.quick_tags) as string[]
  merged.quick_tags = [...new Set([...localTags, ...remoteTags])]

  type DayRec = { date: string; classes: string[]; tags: string[] }
  const localDays = toArray(local.day_records) as DayRec[]
  const remoteDays = toArray(safeRemote.day_records) as DayRec[]
  const dayMap = new Map<string, DayRec>()

  for (const d of localDays) {
    dayMap.set(d.date, { date: d.date, classes: [...d.classes], tags: [...d.tags] })
  }

  for (const d of remoteDays) {
    const existing = dayMap.get(d.date)
    if (existing) {
      const mergedClasses = [...existing.classes]
      for (const c of d.classes) {
        const localCount = existing.classes.filter((x) => x === c).length
        const remoteCount = d.classes.filter((x) => x === c).length
        const diff = remoteCount - localCount
        for (let i = 0; i < diff; i++) mergedClasses.push(c)
      }
      existing.classes = mergedClasses
      existing.tags = [...new Set([...existing.tags, ...d.tags])]
    } else {
      dayMap.set(d.date, { date: d.date, classes: [...d.classes], tags: [...d.tags] })
    }
  }

  merged.day_records = [...dayMap.values()]
  return merged
}
