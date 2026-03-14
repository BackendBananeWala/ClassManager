<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Separator } from 'radix-vue'
import { useClassesStore } from '@/stores/classes'
import { useThemeStore } from '@/stores/theme'
import { Chart } from 'highcharts-vue'
import Highcharts from 'highcharts'

const store = useClassesStore()
const themeStore = useThemeStore()

const COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed',
  '#0891b2', '#db2777', '#65a30d', '#9333ea', '#ea580c',
]

const isDark = computed(() => themeStore.theme === 'dark')
const chartKey = ref(0)
watch(isDark, () => { chartKey.value++ })

function baseTheme() {
  return {
    backgroundColor: 'transparent',
    style: { fontFamily: 'Inter, -apple-system, sans-serif' },
    plotBorderWidth: 0,
  }
}

function axisStyle() {
  const c = isDark.value ? '#333' : '#e0e0e0'
  const t = isDark.value ? '#aaa' : '#666'
  return {
    gridLineColor: c,
    lineColor: c,
    tickColor: c,
    labels: { style: { color: t, fontSize: '10px' } },
    title: { style: { color: t } },
  }
}

function legendStyle() {
  const c = isDark.value ? '#ccc' : '#333'
  return {
    itemStyle: { color: c, fontSize: '11px', fontWeight: '500' },
    itemHoverStyle: { color: isDark.value ? '#fff' : '#000' },
  }
}

const weekly = computed(() => store.getWeeklyPerSubject())
const monthly = computed(() => store.getMonthlyPerSubject())

function buildSeries(chartData: { subjects: string[]; data: Record<string, number[]> }) {
  return chartData.subjects.map((name, i) => ({
    name,
    data: chartData.data[name],
    color: COLORS[i % COLORS.length],
    marker: { radius: 4, symbol: 'circle' },
  }))
}

const weeklyOptions = computed(() => ({
  chart: { ...baseTheme(), type: 'spline', height: 260 },
  title: { text: undefined },
  colors: COLORS,
  xAxis: { categories: weekly.value.labels, ...axisStyle(), crosshair: true },
  yAxis: { ...axisStyle(), title: { text: 'Classes' }, allowDecimals: false, min: 0 },
  series: buildSeries(weekly.value),
  legend: { ...legendStyle(), enabled: weekly.value.subjects.length > 1 },
  tooltip: { shared: true, borderRadius: 8, borderWidth: 0, shadow: true, style: { fontSize: '12px' } },
  plotOptions: { spline: { lineWidth: 2.5, marker: { enabled: true } } },
  credits: { enabled: false },
}))

const monthlyOptions = computed(() => ({
  chart: { ...baseTheme(), type: 'spline', height: 280 },
  title: { text: undefined },
  colors: COLORS,
  xAxis: {
    categories: monthly.value.labels,
    ...axisStyle(),
    crosshair: true,
    labels: {
      ...axisStyle().labels,
      step: monthly.value.labels.length > 15 ? 5 : 1,
    },
  },
  yAxis: { ...axisStyle(), title: { text: 'Classes' }, allowDecimals: false, min: 0 },
  series: buildSeries(monthly.value),
  legend: { ...legendStyle(), enabled: monthly.value.subjects.length > 1 },
  tooltip: { shared: true, borderRadius: 8, borderWidth: 0, shadow: true, style: { fontSize: '12px' } },
  plotOptions: { spline: { lineWidth: 2, marker: { enabled: monthly.value.labels.length <= 15, radius: 3 } } },
  credits: { enabled: false },
}))

const weeklyBreakdown = computed(() => {
  const w = weekly.value
  return w.subjects
    .map((name, si) => ({
      name,
      count: w.data[name].reduce((a: number, b: number) => a + b, 0),
      color: COLORS[si % COLORS.length],
    }))
    .sort((a, b) => b.count - a.count)
})

const weeklyTotal = computed(() => weeklyBreakdown.value.reduce((s, b) => s + b.count, 0))

const allSubjects = computed(() => store.getAllSubjectsEver())

function subjectColor(name: string): string {
  const idx = allSubjects.value.indexOf(name)
  return COLORS[(idx >= 0 ? idx : 0) % COLORS.length]
}

const allTimeBreakdown = computed(() => {
  return allSubjects.value
    .map((name) => ({ name, count: store.getClassCountTotal(name), color: subjectColor(name) }))
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

    <!-- Weekly Highchart -->
    <div class="rx-card chart-card">
      <h2 class="card-heading">Weekly</h2>
      <div v-if="weekly.subjects.length === 0" class="dash-empty">No data yet for the past 7 days.</div>
      <Chart v-else :key="'w-' + chartKey" :options="weeklyOptions" />
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

    <!-- Monthly Highchart -->
    <div class="rx-card chart-card">
      <h2 class="card-heading">{{ monthLabel }}</h2>
      <div v-if="monthly.subjects.length === 0" class="dash-empty">No data yet this month.</div>
      <template v-else>
        <Chart :key="'m-' + chartKey" :options="monthlyOptions" />
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
          <span class="breakdown-name">
            <span class="legend-dot" :style="{ background: item.color }"></span>
            {{ item.name }}
          </span>
          <div class="breakdown-bar-wrap">
            <div class="breakdown-bar" :style="{ width: store.totalClassesAttended > 0 ? (item.count / store.totalClassesAttended * 100) + '%' : '0%', background: item.color }" />
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

.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

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
