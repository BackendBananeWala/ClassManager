<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; done: [] }>()

type Mode = 'hour' | 'minute'

const mode = ref<Mode>('hour')

const parsed = computed(() => {
  const [h, m] = (props.modelValue || '12:00').split(':').map(Number)
  return { hour24: h, minute: m }
})

const isAM = ref(parsed.value.hour24 < 12)
const selectedHour12 = ref(parsed.value.hour24 % 12 || 12)
const selectedMinute = ref(parsed.value.minute)

watch(
  () => props.modelValue,
  (val) => {
    const [h, m] = (val || '12:00').split(':').map(Number)
    isAM.value = h < 12
    selectedHour12.value = h % 12 || 12
    selectedMinute.value = m
  },
)

const SIZE = 220
const CX = SIZE / 2
const CY = SIZE / 2
const RADIUS = 85

const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function posForIndex(i: number, total: number, r: number) {
  const angle = (i / total) * 2 * Math.PI - Math.PI / 2
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

const hourPositions = computed(() =>
  hours.map((h, i) => ({ value: h, ...posForIndex(i, 12, RADIUS) })),
)

const minutePositions = computed(() =>
  minutes.map((m, i) => ({ value: m, ...posForIndex(i, 12, RADIUS) })),
)

const handAngle = computed(() => {
  if (mode.value === 'hour') {
    const idx = hours.indexOf(selectedHour12.value)
    return (idx / 12) * 360 - 90
  }
  return (selectedMinute.value / 60) * 360 - 90
})

const handLength = RADIUS - 12

function emitTime() {
  let h24 = selectedHour12.value % 12
  if (!isAM.value) h24 += 12
  const val = `${String(h24).padStart(2, '0')}:${String(selectedMinute.value).padStart(2, '0')}`
  emit('update:modelValue', val)
}

function pickHour(h: number) {
  selectedHour12.value = h
  emitTime()
  mode.value = 'minute'
}

function pickMinute(m: number) {
  selectedMinute.value = m
  emitTime()
  emit('done')
}

function toggleAmPm() {
  isAM.value = !isAM.value
  emitTime()
}

const displayTime = computed(() => {
  const h = selectedHour12.value
  const m = String(selectedMinute.value).padStart(2, '0')
  return { h: String(h), m, period: isAM.value ? 'AM' : 'PM' }
})
</script>

<template>
  <div class="clock-picker">
    <div class="clock-display">
      <button
        type="button"
        class="clock-digit"
        :class="{ 'clock-digit--active': mode === 'hour' }"
        @click="mode = 'hour'"
      >
        {{ displayTime.h }}
      </button>
      <span class="clock-colon">:</span>
      <button
        type="button"
        class="clock-digit"
        :class="{ 'clock-digit--active': mode === 'minute' }"
        @click="mode = 'minute'"
      >
        {{ displayTime.m }}
      </button>
      <button type="button" class="clock-period" @click="toggleAmPm">
        {{ displayTime.period }}
      </button>
    </div>

    <div class="clock-face-wrap">
      <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="clock-face">
        <circle :cx="CX" :cy="CY" :r="RADIUS + 20" class="clock-bg" />

        <!-- Hand -->
        <line
          :x1="CX"
          :y1="CY"
          :x2="CX + handLength * Math.cos((handAngle * Math.PI) / 180)"
          :y2="CY + handLength * Math.sin((handAngle * Math.PI) / 180)"
          class="clock-hand"
        />
        <circle :cx="CX" :cy="CY" r="4" class="clock-center" />
        <circle
          :cx="CX + handLength * Math.cos((handAngle * Math.PI) / 180)"
          :cy="CY + handLength * Math.sin((handAngle * Math.PI) / 180)"
          r="16"
          class="clock-hand-tip"
        />

        <!-- Hour numbers -->
        <template v-if="mode === 'hour'">
          <g
            v-for="h in hourPositions"
            :key="'h' + h.value"
            class="clock-num-group"
            @click="pickHour(h.value)"
          >
            <circle :cx="h.x" :cy="h.y" r="18" class="clock-num-bg" :class="{ 'clock-num-bg--active': h.value === selectedHour12 }" />
            <text
              :x="h.x"
              :y="h.y"
              class="clock-num"
              :class="{ 'clock-num--active': h.value === selectedHour12 }"
              dominant-baseline="central"
              text-anchor="middle"
            >
              {{ h.value }}
            </text>
          </g>
        </template>

        <!-- Minute numbers -->
        <template v-else>
          <g
            v-for="m in minutePositions"
            :key="'m' + m.value"
            class="clock-num-group"
            @click="pickMinute(m.value)"
          >
            <circle :cx="m.x" :cy="m.y" r="18" class="clock-num-bg" :class="{ 'clock-num-bg--active': m.value === selectedMinute }" />
            <text
              :x="m.x"
              :y="m.y"
              class="clock-num"
              :class="{ 'clock-num--active': m.value === selectedMinute }"
              dominant-baseline="central"
              text-anchor="middle"
            >
              {{ String(m.value).padStart(2, '0') }}
            </text>
          </g>
        </template>
      </svg>
    </div>

    <p class="clock-hint">{{ mode === 'hour' ? 'Select hour' : 'Select minutes' }}</p>
  </div>
</template>
