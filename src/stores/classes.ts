import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/lib/storage'
import type { DayRecord } from '@/types'

const DAYS_KEY = 'day_records'
const NAMES_KEY = 'class_names'
const TAGS_KEY = 'quick_tags'
const DEFAULT_TAGS = ['Holiday', 'Seminar', 'Workshop']
const NON_COUNTED_TAGS = ['Holiday']

export const useClassesStore = defineStore('classes', () => {
  const dayRecords = ref<DayRecord[]>(storage.get<DayRecord[]>(DAYS_KEY) ?? [])
  const savedNames = ref<string[]>(storage.get<string[]>(NAMES_KEY) ?? [])
  const quickTags = ref<string[]>(storage.get<string[]>(TAGS_KEY) ?? DEFAULT_TAGS)

  function persistDays() { storage.set(DAYS_KEY, dayRecords.value) }
  function persistNames() { storage.set(NAMES_KEY, savedNames.value) }
  function persistTags() { storage.set(TAGS_KEY, quickTags.value) }

  function todayStr(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function getOrCreateDay(date: string): DayRecord {
    let record = dayRecords.value.find((r) => r.date === date)
    if (!record) {
      record = { date, classes: [], tags: [] }
      dayRecords.value.push(record)
    }
    return record
  }

  function getDay(date: string): DayRecord | null {
    return dayRecords.value.find((r) => r.date === date) ?? null
  }

  const todayRecord = computed(() => getDay(todayStr()))

  function getClassCount(date: string, name: string): number {
    const rec = getDay(date)
    if (!rec) return 0
    return rec.classes.filter((c) => c === name).length
  }

  function incrementClass(date: string, name: string) {
    const record = getOrCreateDay(date)
    record.classes.push(name)
    persistDays()
  }

  function clearClass(date: string, name: string) {
    const record = getOrCreateDay(date)
    record.classes = record.classes.filter((c) => c !== name)
    persistDays()
  }

  function toggleTag(date: string, tag: string) {
    const record = getOrCreateDay(date)
    const idx = record.tags.indexOf(tag)
    if (idx >= 0) {
      record.tags.splice(idx, 1)
    } else {
      record.tags.push(tag)
    }
    persistDays()
  }

  const todayClassCount = computed(() => {
    const rec = todayRecord.value
    if (!rec) return 0
    const classCount = rec.classes.length
    const tagCount = rec.tags.filter((t) => !NON_COUNTED_TAGS.includes(t)).length
    return classCount + tagCount
  })

  function addClassName(name: string) {
    const trimmed = name.trim()
    if (!trimmed || savedNames.value.includes(trimmed)) return
    savedNames.value.push(trimmed)
    persistNames()
  }

  function removeClassName(name: string) {
    savedNames.value = savedNames.value.filter((n) => n !== name)
    persistNames()
  }

  function addQuickTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || quickTags.value.includes(trimmed)) return
    quickTags.value.push(trimmed)
    persistTags()
  }

  function removeQuickTag(tag: string) {
    quickTags.value = quickTags.value.filter((t) => t !== tag)
    persistTags()
  }

  const totalDaysRecorded = computed(() => dayRecords.value.filter((r) => r.classes.length > 0 || r.tags.length > 0).length)

  const totalClassesAttended = computed(() => dayRecords.value.reduce((sum, r) => sum + r.classes.length, 0))

  const totalEventsMarked = computed(() => dayRecords.value.reduce((sum, r) => sum + r.tags.length, 0))

  const currentStreak = computed(() => {
    const t = new Date()
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(t)
      d.setDate(d.getDate() - i)
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const rec = getDay(ds)
      if (rec && rec.classes.length > 0) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    return streak
  })

  function getClassCountTotal(name: string): number {
    return dayRecords.value.reduce((sum, r) => sum + r.classes.filter((c) => c === name).length, 0)
  }

  function getLast7Days(): { date: string; label: string; count: number }[] {
    const result: { date: string; label: string; count: number }[] = []
    const t = new Date()
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 6; i >= 0; i--) {
      const d = new Date(t)
      d.setDate(d.getDate() - i)
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const rec = getDay(ds)
      result.push({ date: ds, label: dayLabels[d.getDay()], count: rec?.classes.length ?? 0 })
    }
    return result
  }

  function fmtDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function getAllSubjectsEver(): string[] {
    const set = new Set<string>()
    for (const rec of dayRecords.value) {
      for (const c of rec.classes) set.add(c)
    }
    return [...set].sort()
  }

  type ChartData = { dates: string[]; labels: string[]; subjects: string[]; data: Record<string, number[]> }

  function getWeeklyPerSubject(): ChartData {
    const t = new Date()
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dates: string[] = []
    const labels: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(t)
      d.setDate(d.getDate() - i)
      dates.push(fmtDate(d))
      labels.push(dayLabels[d.getDay()])
    }
    const subjects = getAllSubjectsEver()
    const data: Record<string, number[]> = {}
    for (const s of subjects) {
      data[s] = dates.map((ds) => {
        const rec = getDay(ds)
        return rec ? rec.classes.filter((c) => c === s).length : 0
      })
    }
    return { dates, labels, subjects, data }
  }

  function getMonthlyPerSubject(): ChartData {
    const t = new Date()
    const y = t.getFullYear()
    const m = t.getMonth()
    const today = t.getDate()
    const dates: string[] = []
    const labels: string[] = []
    for (let d = 1; d <= today; d++) {
      const dt = new Date(y, m, d)
      dates.push(fmtDate(dt))
      labels.push(String(d))
    }
    const subjects = getAllSubjectsEver()
    const data: Record<string, number[]> = {}
    for (const s of subjects) {
      data[s] = dates.map((ds) => {
        const rec = getDay(ds)
        return rec ? rec.classes.filter((c) => c === s).length : 0
      })
    }
    return { dates, labels, subjects, data }
  }

  return {
    dayRecords,
    savedNames,
    quickTags,
    todayRecord,
    todayClassCount,
    totalDaysRecorded,
    totalClassesAttended,
    totalEventsMarked,
    currentStreak,
    getDay,
    getClassCount,
    incrementClass,
    clearClass,
    toggleTag,
    addClassName,
    removeClassName,
    addQuickTag,
    removeQuickTag,
    getClassCountTotal,
    getLast7Days,
    getAllSubjectsEver,
    getWeeklyPerSubject,
    getMonthlyPerSubject,
    todayStr,
  }
})
