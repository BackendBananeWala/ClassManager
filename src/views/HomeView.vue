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

// --- Today section (fixed to actual today) ---
const dateToday = store.todayStr()

function isClassActive(name: string): boolean {
  return store.todayRecord?.classes.includes(name) ?? false
}

function isTagActive(tag: string): boolean {
  return store.todayRecord?.tags.includes(tag) ?? false
}

function onToggleClass(name: string) {
  store.toggleClass(dateToday, name)
}

function onToggleTag(tag: string) {
  store.toggleTag(dateToday, tag)
}

const syncUrl = computed(() => {
  const rec = store.todayRecord
  return buildDaySyncUrl(dateToday, rec?.classes ?? [], rec?.tags ?? [])
})

const hasTodayData = computed(() => store.todayClassCount > 0 || (store.todayRecord?.tags.includes('Holiday') ?? false))

// --- Today's summary section ---
const todaySummary = computed(() => {
  const rec = store.todayRecord
  if (!rec) return null
  if (rec.classes.length === 0 && rec.tags.length === 0) return null
  return rec
})

// --- History (separate, defaults to today) ---
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
          <button
            v-for="name in store.savedNames"
            :key="'cls-' + name"
            type="button"
            class="rx-chip"
            :class="{ 'rx-chip--active': isClassActive(name) }"
            @click="onToggleClass(name)"
          >
            {{ name }}
          </button>
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
            :class="{ 'rx-chip--active': isTagActive(tag) }"
            @click="onToggleTag(tag)"
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
        <div v-if="todaySummary.classes.length > 0" class="summary-group">
          <span class="summary-label">Classes</span>
          <span class="summary-items">{{ todaySummary.classes.join(', ') }}</span>
        </div>
        <div v-if="todaySummary.tags.length > 0" class="summary-group">
          <span class="summary-label">Events</span>
          <span class="summary-items">{{ todaySummary.tags.join(', ') }}</span>
        </div>
      </div>
    </section>

    <!-- Sync to Google Calendar -->
    <a
      v-if="hasTodayData"
      :href="syncUrl"
      target="_blank"
      rel="noopener"
      class="rx-btn rx-btn-primary sync-btn"
    >
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

      <!-- Selected date detail -->
      <div v-if="historyRecord" class="history-detail">
        <div v-if="historyRecord.classes.length > 0" class="history-group">
          <span class="history-label">Classes</span>
          <div class="chip-grid chip-grid--sm">
            <span v-for="c in historyRecord.classes" :key="c" class="rx-chip rx-chip--active rx-chip--readonly">{{ c }}</span>
          </div>
        </div>
        <div v-if="historyRecord.tags.length > 0" class="history-group">
          <span class="history-label">Events</span>
          <div class="chip-grid chip-grid--sm">
            <span v-for="t in historyRecord.tags" :key="t" class="rx-chip rx-chip--tag rx-chip--active rx-chip--readonly">{{ t }}</span>
          </div>
        </div>
        <a :href="historySyncUrl" target="_blank" rel="noopener" class="gcal-link">+ Google Calendar</a>
      </div>
      <p v-else-if="!historyOpen" class="history-empty">No attendance recorded for this date.</p>
    </section>
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 1.5rem; }

.greeting-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0;
}

.greeting-sub { font-size: 0.9375rem; color: var(--color-text-muted); margin-bottom: 0.125rem; }
.greeting-name { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; }

.stat-inline {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
}

.stat-value { font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.stat-label { font-size: 0.6875rem; color: var(--color-text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

.section-heading {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.625rem;
}

.chip-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.chip-grid--sm { gap: 0.375rem; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
}

.empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }
.empty-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
.empty-desc { font-size: 0.875rem; color: var(--color-text-muted); max-width: 280px; line-height: 1.6; }

.summary-section { display: flex; flex-direction: column; }

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
}

.summary-group {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.summary-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-items {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.5;
}

.sync-btn {
  display: block;
  width: 100%;
  text-align: center;
  text-decoration: none;
  padding: 0.875rem;
  font-size: 0.9375rem;
  border-radius: var(--radius-lg);
}

.history-section { display: flex; flex-direction: column; gap: 0.75rem; }

.history-detail {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.history-group { display: flex; flex-direction: column; gap: 0.375rem; }
.history-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

.history-empty { font-size: 0.8125rem; color: var(--color-text-muted); }

.gcal-link {
  display: inline-block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}

.gcal-link:hover { color: var(--color-text); }
</style>
