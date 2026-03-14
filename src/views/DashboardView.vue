<script setup lang="ts">
import { computed } from 'vue'
import { Separator } from 'radix-vue'
import { useClassesStore } from '@/stores/classes'

const store = useClassesStore()

const COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#9333ea',
  '#ea580c',
]

const weekly = computed(() => store.getWeeklyPerSubject())
const monthly = computed(() => store.getMonthlyPerSubject())

function buildPoints(values: number[], maxVal: number, width: number, height: number, padding: number): string {
  if (values.length === 0) return ''
  const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0
  return values
    .map((v, i) => {
      const x = padding + i * stepX
      const y = maxVal > 0 ? height - padding - (v / maxVal) * (height - padding * 2) : height - padding
      return `${x},${y}`
    })
    .join(' ')
}

function chartMax(data: Record<string, number[]>): number {
  let m = 0
  for (const vals of Object.values(data)) {
    for (const v of vals) { if (v > m) m = v }
  }
  return Math.max(m, 1)
}

function color(i: number): string {
  return COLORS[i % COLORS.length]
}

const weeklyBreakdown = computed(() => {
  const w = weekly.value
  return w.subjects
    .map((name, si) => ({
      name,
      count: w.data[name].reduce((a, b) => a + b, 0),
      color: color(si),
    }))
    .sort((a, b) => b.count - a.count)
})

const allTimeBreakdown = computed(() => {
  const subjects = store.getAllSubjectsEver()
  return subjects
    .map((name) => ({ name, count: store.getClassCountTotal(name) }))
    .sort((a, b) => b.count - a.count)
})

const monthLabel = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
})

const monthStats = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth()
  let classes = 0
  let days = 0
  for (const rec of store.dayRecords) {
    const [ry, rm] = rec.date.split('-').map(Number)
    if (ry === y && rm === m + 1 && (rec.classes.length > 0 || rec.tags.length > 0)) {
      classes += rec.classes.length
      days++
    }
  }
  return { classes, days }
})

const weeklyTotal = computed(() => weeklyBreakdown.value.reduce((s, b) => s + b.count, 0))
</script>

<template>
  <div class="dash">
    <h1 class="page-title">Dashboard</h1>

    <!-- Stats cards -->
    <div class="stats-row">
      <div class="rx-card dash-stat">
        <span class="dash-stat-value">{{ store.totalDaysRecorded }}</span>
        <span class="dash-stat-label">Days</span>
      </div>
      <div class="rx-card dash-stat">
        <span class="dash-stat-value">{{ store.totalClassesAttended }}</span>
        <span class="dash-stat-label">Classes</span>
      </div>
      <div class="rx-card dash-stat">
        <span class="dash-stat-value">{{ store.totalEventsMarked }}</span>
        <span class="dash-stat-label">Events</span>
      </div>
      <div class="rx-card dash-stat">
        <span class="dash-stat-value">{{ store.currentStreak }}</span>
        <span class="dash-stat-label">Streak</span>
      </div>
    </div>

    <!-- Weekly line chart -->
    <div class="rx-card chart-card">
      <h2 class="card-heading">Weekly</h2>
      <div v-if="weekly.subjects.length === 0" class="dash-empty">No data yet for the past 7 days.</div>
      <template v-else>
        <div class="chart-wrap">
          <svg viewBox="0 0 300 140" class="line-chart">
            <line x1="30" y1="10" x2="30" y2="110" class="chart-axis" />
            <line x1="30" y1="110" x2="290" y2="110" class="chart-axis" />
            <text
              v-for="(lbl, i) in weekly.labels"
              :key="'wl-' + i"
              :x="30 + i * ((300 - 60) / Math.max(weekly.labels.length - 1, 1))"
              y="128"
              text-anchor="middle"
              class="chart-label"
            >{{ lbl }}</text>
            <polyline
              v-for="(subj, si) in weekly.subjects"
              :key="'ws-' + subj"
              :points="buildPoints(weekly.data[subj], chartMax(weekly.data), 300, 120, 30)"
              fill="none"
              :stroke="color(si)"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <template v-for="(subj, si) in weekly.subjects" :key="'wd-' + subj">
              <circle
                v-for="(val, di) in weekly.data[subj]"
                :key="'wdot-' + subj + di"
                :cx="30 + di * ((300 - 60) / Math.max(weekly.labels.length - 1, 1))"
                :cy="chartMax(weekly.data) > 0 ? 120 - 30 - (val / chartMax(weekly.data)) * (120 - 60) : 90"
                :r="val > 0 ? 3 : 0"
                :fill="color(si)"
              />
            </template>
          </svg>
        </div>
        <div class="chart-legend">
          <span v-for="(subj, si) in weekly.subjects" :key="'wleg-' + subj" class="legend-item">
            <span class="legend-dot" :style="{ background: color(si) }"></span>
            {{ subj }}
          </span>
        </div>
      </template>
    </div>

    <!-- Weekly breakdown -->
    <div v-if="weeklyBreakdown.length > 0" class="rx-card">
      <h2 class="card-heading">This Week</h2>
      <div class="breakdown-list">
        <div v-for="item in weeklyBreakdown" :key="'wb-' + item.name" class="breakdown-row">
          <span class="breakdown-name">
            <span class="legend-dot" :style="{ background: item.color }"></span>
            {{ item.name }}
          </span>
          <div class="breakdown-bar-wrap">
            <div class="breakdown-bar" :style="{ width: weeklyTotal > 0 ? (item.count / weeklyTotal * 100) + '%' : '0%', background: item.color }" />
          </div>
          <span class="breakdown-count">{{ item.count }}</span>
        </div>
      </div>
    </div>

    <!-- Monthly line chart -->
    <div class="rx-card chart-card">
      <h2 class="card-heading">{{ monthLabel }}</h2>
      <div v-if="monthly.subjects.length === 0" class="dash-empty">No data yet this month.</div>
      <template v-else>
        <div class="chart-wrap">
          <svg :viewBox="`0 0 ${Math.max(monthly.labels.length * 16 + 60, 300)} 140`" class="line-chart line-chart--wide">
            <line x1="30" y1="10" x2="30" y2="110" class="chart-axis" />
            <line x1="30" y1="110" :x2="Math.max(monthly.labels.length * 16 + 30, 270)" y2="110" class="chart-axis" />
            <text
              v-for="(lbl, i) in monthly.labels"
              :key="'ml-' + i"
              :x="30 + i * (Math.max(monthly.labels.length * 16 - 30, 240) / Math.max(monthly.labels.length - 1, 1))"
              y="128"
              text-anchor="middle"
              class="chart-label"
            >{{ Number(lbl) % 5 === 1 || monthly.labels.length <= 10 ? lbl : '' }}</text>
            <polyline
              v-for="(subj, si) in monthly.subjects"
              :key="'ms-' + subj"
              :points="buildPoints(monthly.data[subj], chartMax(monthly.data), Math.max(monthly.labels.length * 16 + 30, 300), 120, 30)"
              fill="none"
              :stroke="color(si)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="chart-legend">
          <span v-for="(subj, si) in monthly.subjects" :key="'mleg-' + subj" class="legend-item">
            <span class="legend-dot" :style="{ background: color(si) }"></span>
            {{ subj }}
          </span>
        </div>
        <p class="month-summary">
          <strong>{{ monthStats.classes }}</strong> classes across <strong>{{ monthStats.days }}</strong> days this month.
        </p>
      </template>
    </div>

    <Separator class="rx-separator" />

    <!-- All-time breakdown -->
    <div class="rx-card">
      <h2 class="card-heading">All-Time Breakdown</h2>
      <p v-if="allTimeBreakdown.length === 0" class="dash-empty">No attendance data yet.</p>
      <div v-else class="breakdown-list">
        <div v-for="item in allTimeBreakdown" :key="item.name" class="breakdown-row">
          <span class="breakdown-name">{{ item.name }}</span>
          <div class="breakdown-bar-wrap">
            <div class="breakdown-bar" :style="{ width: store.totalClassesAttended > 0 ? (item.count / store.totalClassesAttended * 100) + '%' : '0%' }" />
          </div>
          <span class="breakdown-count">{{ item.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash { display: flex; flex-direction: column; gap: 1.25rem; max-width: 560px; margin: 0 auto; }

.page-title { font-size: 1.5rem; font-weight: 700; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }

.dash-stat { display: flex; flex-direction: column; align-items: center; gap: 0.125rem; padding: 0.875rem 0.5rem; }
.dash-stat-value { font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.dash-stat-label { font-size: 0.625rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

.card-heading { font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; }

.chart-card { padding: 1.25rem; }
.chart-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

.line-chart { width: 100%; max-width: 300px; margin: 0 auto; display: block; height: auto; }
.line-chart--wide { max-width: none; min-width: 300px; }

.chart-axis { stroke: var(--color-border); stroke-width: 1; }
.chart-label { fill: var(--color-text-muted); font-size: 8px; font-weight: 500; }

.chart-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; }
.legend-item { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 500; color: var(--color-text); }

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.month-summary { font-size: 0.875rem; color: var(--color-text-muted); line-height: 1.6; margin-top: 0.75rem; }
.month-summary strong { color: var(--color-text); }

.breakdown-list { display: flex; flex-direction: column; gap: 0.625rem; }
.breakdown-row { display: flex; align-items: center; gap: 0.75rem; }
.breakdown-name { font-size: 0.8125rem; font-weight: 500; width: 6rem; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 0.375rem; }
.breakdown-bar-wrap { flex: 1; height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.breakdown-bar { height: 100%; background: var(--color-accent); border-radius: 4px; transition: width 0.3s ease; min-width: 2px; }
.breakdown-count { font-size: 0.8125rem; font-weight: 700; font-variant-numeric: tabular-nums; width: 2rem; text-align: right; }

.dash-empty { font-size: 0.8125rem; color: var(--color-text-muted); }
</style>
