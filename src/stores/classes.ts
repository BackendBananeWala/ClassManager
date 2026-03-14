import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/lib/storage'
import type { DayRecord } from '@/types'

const DAYS_KEY = 'day_records'
const NAMES_KEY = 'class_names'
const TAGS_KEY = 'quick_tags'

const DEFAULT_TAGS = ['Holiday', 'Seminar', 'Workshop']

export const useClassesStore = defineStore('classes', () => {
  const dayRecords = ref<DayRecord[]>(storage.get<DayRecord[]>(DAYS_KEY) ?? [])
  const savedNames = ref<string[]>(storage.get<string[]>(NAMES_KEY) ?? [])
  const quickTags = ref<string[]>(storage.get<string[]>(TAGS_KEY) ?? DEFAULT_TAGS)

  function persistDays() {
    storage.set(DAYS_KEY, dayRecords.value)
  }
  function persistNames() {
    storage.set(NAMES_KEY, savedNames.value)
  }
  function persistTags() {
    storage.set(TAGS_KEY, quickTags.value)
  }

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

  const NON_COUNTED_TAGS = ['Holiday']

  const todayClassCount = computed(() => {
    const rec = todayRecord.value
    if (!rec) return 0
    const classCount = rec.classes.length
    const tagCount = rec.tags.filter((t) => !NON_COUNTED_TAGS.includes(t)).length
    return classCount + tagCount
  })

  function toggleClass(date: string, name: string) {
    const record = getOrCreateDay(date)
    const idx = record.classes.indexOf(name)
    if (idx >= 0) {
      record.classes.splice(idx, 1)
    } else {
      record.classes.push(name)
    }
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

  const totalDaysRecorded = computed(() => dayRecords.value.length)

  return {
    dayRecords,
    savedNames,
    quickTags,
    todayRecord,
    todayClassCount,
    totalDaysRecorded,
    getDay,
    toggleClass,
    toggleTag,
    addClassName,
    removeClassName,
    addQuickTag,
    removeQuickTag,
    todayStr,
  }
})
