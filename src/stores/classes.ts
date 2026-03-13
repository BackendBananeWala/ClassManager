import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/lib/storage'
import type { ClassSession } from '@/types'

const STORAGE_KEY = 'classes'
const NAMES_KEY = 'class_names'

export const useClassesStore = defineStore('classes', () => {
  const classes = ref<ClassSession[]>(storage.get<ClassSession[]>(STORAGE_KEY) ?? [])
  const savedNames = ref<string[]>(storage.get<string[]>(NAMES_KEY) ?? [])

  function persist() {
    storage.set(STORAGE_KEY, classes.value)
  }

  function persistNames() {
    storage.set(NAMES_KEY, savedNames.value)
  }

  function rememberName(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    if (!savedNames.value.includes(trimmed)) {
      savedNames.value.push(trimmed)
      persistNames()
    }
  }

  function getSuggestions(query: string): string[] {
    if (!query.trim()) return savedNames.value.slice().sort()
    const q = query.toLowerCase()
    return savedNames.value
      .filter((n) => n.toLowerCase().includes(q))
      .sort()
  }

  const totalClasses = computed(() => classes.value.length)

  const todayStr = computed(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const todayClasses = computed(() =>
    classes.value
      .filter((c) => c.date === todayStr.value)
      .sort((a, b) => a.timeStart.localeCompare(b.timeStart)),
  )

  const todayHours = computed(() => {
    let totalMinutes = 0
    for (const c of todayClasses.value) {
      const [sh, sm] = c.timeStart.split(':').map(Number)
      const [eh, em] = c.timeEnd.split(':').map(Number)
      let diff = (eh * 60 + em) - (sh * 60 + sm)
      if (diff < 0) diff += 24 * 60
      totalMinutes += diff
    }
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  })

  const sortedClasses = computed(() =>
    [...classes.value].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.timeStart.localeCompare(a.timeStart)
    }),
  )

  function addClass(session: Omit<ClassSession, 'id' | 'createdAt'>) {
    const newSession: ClassSession = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    classes.value.push(newSession)
    persist()
    rememberName(session.name)
    return newSession
  }

  function removeClass(id: string) {
    classes.value = classes.value.filter((c) => c.id !== id)
    persist()
  }

  return {
    classes,
    savedNames,
    totalClasses,
    todayClasses,
    todayHours,
    sortedClasses,
    addClass,
    removeClass,
    getSuggestions,
  }
})
