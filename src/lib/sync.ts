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

function firebaseToArrays(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj }
  const arrayKeys = ['day_records', 'class_names', 'quick_tags']
  for (const key of arrayKeys) {
    const val = result[key]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = Object.values(val)
    }
  }
  return result
}

export async function pullData(syncId: string): Promise<Record<string, unknown> | null> {
  const snapshot = await get(dbRef(db, `users/${syncId}`))
  if (!snapshot.exists()) return null
  const raw = snapshot.val() as Record<string, unknown>
  return firebaseToArrays(raw)
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
  const merged: Record<string, unknown> = { ...local }

  const localNames = (local.class_names as string[] | undefined) ?? []
  const remoteNames = (remote.class_names as string[] | undefined) ?? []
  merged.class_names = [...new Set([...localNames, ...remoteNames])]

  const localTags = (local.quick_tags as string[] | undefined) ?? []
  const remoteTags = (remote.quick_tags as string[] | undefined) ?? []
  merged.quick_tags = [...new Set([...localTags, ...remoteTags])]

  type DayRec = { date: string; classes: string[]; tags: string[] }
  const localDays = (local.day_records as DayRec[] | undefined) ?? []
  const remoteDays = (remote.day_records as DayRec[] | undefined) ?? []
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
