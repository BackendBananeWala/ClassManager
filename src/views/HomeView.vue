<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  CalendarRoot,
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  Separator,
} from 'radix-vue'
import { today, getLocalTimeZone, type DateValue } from '@internationalized/date'
import { useUserStore } from '@/stores/user'
import { useClassesStore } from '@/stores/classes'
import { buildDaySyncUrl } from '@/lib/calendar'

const user = useUserStore()
const store = useClassesStore()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

const dateToday = store.todayStr()

function classCount(date: string, name: string): number {
  return store.getClassCount(date, name)
}

function isTagActive(date: string, tag: string): boolean {
  return store.getDay(date)?.tags.includes(tag) ?? false
}

const syncUrl = computed(() => {
  const rec = store.todayRecord
  return buildDaySyncUrl(dateToday, rec?.classes ?? [], rec?.tags ?? [])
})

const hasTodayData = computed(() => store.todayClassCount > 0 || (store.todayRecord?.tags.includes('Holiday') ?? false))

const todaySummary = computed(() => {
  const rec = store.todayRecord
  if (!rec) return null
  if (rec.classes.length === 0 && rec.tags.length === 0) return null
  const unique = [...new Set(rec.classes)]
  const items = unique.map((n) => {
    const c = rec.classes.filter((x) => x === n).length
    return c > 1 ? `${n} x${c}` : n
  })
  return { classItems: items, tags: rec.tags }
})

// --- History ---
const historyOpen = ref(false)
const historyCalDate = ref<DateValue>(today(getLocalTimeZone()) as DateValue)

const historyDateStr = computed(() => {
  const d = historyCalDate.value
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
})

const historyDisplayDate = computed(() => {
  const d = historyCalDate.value
  const jsDate = new Date(d.year, d.month - 1, d.day)
  return jsDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

const historyRecord = computed(() => store.getDay(historyDateStr.value))

const historySyncUrl = computed(() => {
  const rec = historyRecord.value
  if (!rec) return ''
  return buildDaySyncUrl(rec.date, rec.classes, rec.tags)
})

const historyHasData = computed(() => {
  const rec = historyRecord.value
  return rec && (rec.classes.length > 0 || rec.tags.length > 0)
})

function onHistoryDateSelect(d: DateValue | undefined) {
  if (!d) return
  historyCalDate.value = d
  historyOpen.value = false
}
</script>

<template>
  <div class="home">
    <!-- Greeting -->
    <section class="greeting-row">
      <div>
        <p class="greeting-sub">{{ greeting }},</p>
        <h1 class="greeting-name">{{ user.firstName }}</h1>
      </div>
      <div class="rx-card stat-inline">
        <span class="stat-value">{{ store.todayClassCount }}</span>
        <span class="stat-label">today</span>
      </div>
    </section>

    <!-- Today's classes -->
    <section v-if="store.savedNames.length === 0 && store.quickTags.length === 0" class="empty-state">
      <span class="empty-icon">📚</span>
      <h2 class="empty-title">No classes added</h2>
      <p class="empty-desc">Go to Settings to add your class names, then tap them here to mark attendance.</p>
    </section>

    <template v-else>
      <section v-if="store.savedNames.length > 0">
        <h2 class="section-heading">Classes</h2>
        <div class="chip-grid">
          <span
            v-for="name in store.savedNames"
            :key="'cls-' + name"
            class="rx-chip-counter"
            :class="{ 'rx-chip-counter--active': classCount(dateToday, name) > 0 }"
          >
            <button type="button" class="rx-chip-counter-body" @click="store.incrementClass(dateToday, name)">
              {{ name }}
              <span v-if="classCount(dateToday, name) > 0" class="rx-chip-badge">{{ classCount(dateToday, name) }}</span>
            </button>
            <button
              v-if="classCount(dateToday, name) > 0"
              type="button"
              class="rx-chip-clear"
              @click="store.clearClass(dateToday, name)"
            >&times;</button>
          </span>
        </div>
      </section>

      <section v-if="store.quickTags.length > 0">
        <h2 class="section-heading">Events</h2>
        <div class="chip-grid">
          <button
            v-for="tag in store.quickTags"
            :key="'tag-' + tag"
            type="button"
            class="rx-chip rx-chip--tag"
            :class="{ 'rx-chip--active': isTagActive(dateToday, tag) }"
            @click="store.toggleTag(dateToday, tag)"
          >
            {{ tag }}
          </button>
        </div>
      </section>
    </template>

    <!-- Today's summary -->
    <section v-if="todaySummary" class="summary-section">
      <h2 class="section-heading">Today's Summary</h2>
      <div class="rx-card summary-card">
        <div v-if="todaySummary.classItems.length > 0" class="summary-group">
          <span class="summary-label">Classes</span>
          <span class="summary-items">{{ todaySummary.classItems.join(', ') }}</span>
        </div>
        <div v-if="todaySummary.tags.length > 0" class="summary-group">
          <span class="summary-label">Events</span>
          <span class="summary-items">{{ todaySummary.tags.join(', ') }}</span>
        </div>
      </div>
    </section>

    <!-- Sync to Google Calendar -->
    <a v-if="hasTodayData" :href="syncUrl" target="_blank" rel="noopener" class="rx-btn rx-btn-primary sync-btn">
      Sync Today to Google Calendar
    </a>

    <Separator class="rx-separator" />

    <!-- History -->
    <section class="history-section">
      <h2 class="section-heading">History</h2>
      <button type="button" class="picker-trigger" @click="historyOpen = !historyOpen">
        <span>{{ historyDisplayDate }}</span>
        <span class="picker-chevron" :class="{ 'picker-chevron--open': historyOpen }">&#9662;</span>
      </button>

      <div v-if="historyOpen" class="cal-wrapper">
        <CalendarRoot
          :default-value="historyCalDate"
          v-slot="{ weekDays, grid }"
          class="cal-root"
          weekday-format="short"
          @update:model-value="onHistoryDateSelect"
        >
          <CalendarHeader class="cal-header">
            <CalendarPrev class="cal-nav">&lsaquo;</CalendarPrev>
            <CalendarHeading class="cal-heading" />
            <CalendarNext class="cal-nav">&rsaquo;</CalendarNext>
          </CalendarHeader>
          <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="cal-grid">
            <CalendarGridHead>
              <CalendarGridRow class="cal-grid-row">
                <CalendarHeadCell v-for="day in weekDays" :key="day" class="cal-head-cell">{{ day }}</CalendarHeadCell>
              </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody>
              <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="`week-${index}`" class="cal-grid-row">
                <CalendarCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate" class="cal-cell">
                  <CalendarCellTrigger :day="weekDate" :month="month.value" class="cal-day" />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarRoot>
      </div>

      <!-- Editable history for selected date -->
      <template v-if="!historyOpen">
        <div class="history-edit">
          <h3 class="history-edit-heading">Edit: {{ historyDisplayDate }}</h3>

          <div v-if="store.savedNames.length > 0" class="history-edit-group">
            <span class="history-label">Classes</span>
            <div class="chip-grid">
              <span
                v-for="name in store.savedNames"
                :key="'hcls-' + name"
                class="rx-chip-counter"
                :class="{ 'rx-chip-counter--active': classCount(historyDateStr, name) > 0 }"
              >
                <button type="button" class="rx-chip-counter-body" @click="store.incrementClass(historyDateStr, name)">
                  {{ name }}
                  <span v-if="classCount(historyDateStr, name) > 0" class="rx-chip-badge">{{ classCount(historyDateStr, name) }}</span>
                </button>
                <button
                  v-if="classCount(historyDateStr, name) > 0"
                  type="button"
                  class="rx-chip-clear"
                  @click="store.clearClass(historyDateStr, name)"
                >&times;</button>
              </span>
            </div>
          </div>

          <div v-if="store.quickTags.length > 0" class="history-edit-group">
            <span class="history-label">Events</span>
            <div class="chip-grid">
              <button
                v-for="tag in store.quickTags"
                :key="'htag-' + tag"
                type="button"
                class="rx-chip rx-chip--tag"
                :class="{ 'rx-chip--active': isTagActive(historyDateStr, tag) }"
                @click="store.toggleTag(historyDateStr, tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <a v-if="historyHasData" :href="historySyncUrl" target="_blank" rel="noopener" class="gcal-link">+ Google Calendar</a>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 1.5rem; }

.greeting-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; padding: 0.25rem 0; }
.greeting-sub { font-size: 0.9375rem; color: var(--color-text-muted); margin-bottom: 0.125rem; }
.greeting-name { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; }

.stat-inline { display: flex; align-items: baseline; gap: 0.375rem; padding: 0.625rem 1rem; }
.stat-value { font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.stat-label { font-size: 0.6875rem; color: var(--color-text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

.section-heading { font-size: 0.8125rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.625rem; }

.chip-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 3rem 1.5rem; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius-xl); }
.empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }
.empty-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
.empty-desc { font-size: 0.875rem; color: var(--color-text-muted); max-width: 280px; line-height: 1.6; }

.summary-section { display: flex; flex-direction: column; }
.summary-card { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; }
.summary-group { display: flex; flex-direction: column; gap: 0.125rem; }
.summary-label { font-size: 0.6875rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.summary-items { font-size: 0.875rem; font-weight: 500; color: var(--color-text); line-height: 1.5; }

.sync-btn { display: block; width: 100%; text-align: center; text-decoration: none; padding: 0.875rem; font-size: 0.9375rem; border-radius: var(--radius-lg); }

.history-section { display: flex; flex-direction: column; gap: 0.75rem; }

.history-edit { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
.history-edit-heading { font-size: 0.875rem; font-weight: 600; }
.history-edit-group { display: flex; flex-direction: column; gap: 0.375rem; }
.history-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

.gcal-link { display: inline-block; margin-top: 0.25rem; font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-decoration: none; transition: color 0.15s ease; }
.gcal-link:hover { color: var(--color-text); }
</style>
