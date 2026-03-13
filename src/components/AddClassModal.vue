<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
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
} from 'radix-vue'
import { Label } from 'radix-vue'
import { today, getLocalTimeZone, type DateValue } from '@internationalized/date'
import { useClassesStore } from '@/stores/classes'
import { toGoogleCalendarUrl } from '@/lib/calendar'
import type { ClassSession } from '@/types'
import ClockPicker from '@/components/ClockPicker.vue'

const open = defineModel<boolean>('visible', { default: false })
const classesStore = useClassesStore()
const savedClass = ref<ClassSession | null>(null)

function getDefaults() {
  const now = new Date()
  const h = now.getHours()
  return {
    date: today(getLocalTimeZone()),
    startTime: `${String(h).padStart(2, '0')}:00`,
    endTime: `${String((h + 1) % 24).padStart(2, '0')}:00`,
  }
}

const className = ref('')
const calendarDate = ref<DateValue>(getDefaults().date as DateValue)
const timeStart = ref(getDefaults().startTime)
const timeEnd = ref(getDefaults().endTime)
const remarks = ref('')
const errors = ref<Record<string, string>>({})
const datePickerOpen = ref(false)
const startPickerOpen = ref(false)
const endPickerOpen = ref(false)
const showSuggestions = ref(false)

const suggestions = computed(() => classesStore.getSuggestions(className.value))

function pickSuggestion(name: string) {
  className.value = name
  showSuggestions.value = false
}

function onNameInput() {
  showSuggestions.value = className.value.length > 0 && suggestions.value.length > 0
}

function onNameFocus() {
  if (classesStore.savedNames.length > 0) showSuggestions.value = true
}

function onNameBlur() {
  setTimeout(() => { showSuggestions.value = false }, 150)
}

const displayDate = computed(() => {
  const d = calendarDate.value
  const jsDate = new Date(d.year, d.month - 1, d.day)
  return jsDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
})

function formatTimeDisplay(time: string): string {
  if (!time) return 'Select time'
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

const displayStartTime = computed(() => formatTimeDisplay(timeStart.value))
const displayEndTime = computed(() => formatTimeDisplay(timeEnd.value))

watch(timeStart, (val) => {
  if (val) {
    const [h, m] = val.split(':').map(Number)
    const endH = (h + 1) % 24
    timeEnd.value = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
})

function selectDate(d: DateValue | undefined) {
  if (d) {
    calendarDate.value = d
    datePickerOpen.value = false
  }
}

function onStartDone() {
  startPickerOpen.value = false
}

function onEndDone() {
  endPickerOpen.value = false
}

function setDefaults() {
  const d = getDefaults()
  className.value = ''
  calendarDate.value = d.date as DateValue
  timeStart.value = d.startTime
  timeEnd.value = d.endTime
  remarks.value = ''
  errors.value = {}
  datePickerOpen.value = false
  startPickerOpen.value = false
  endPickerOpen.value = false
}

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!className.value.trim()) e.name = 'Class name is required'
  if (!timeStart.value) e.timeStart = 'Start time is required'
  if (!timeEnd.value) e.timeEnd = 'End time is required'
  errors.value = e
  return Object.keys(e).length === 0
}

function toDateString(d: DateValue): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

function submit() {
  if (!validate()) return

  const created = classesStore.addClass({
    name: className.value.trim(),
    timeStart: timeStart.value,
    timeEnd: timeEnd.value,
    date: toDateString(calendarDate.value),
    remarks: remarks.value.trim(),
  })

  savedClass.value = created
}

function closeAll() {
  setDefaults()
  savedClass.value = null
  open.value = false
}

function onOpenChange(val: boolean) {
  if (val) {
    setDefaults()
    savedClass.value = null
  }
  if (!val) closeAll()
  open.value = val
}
</script>

<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="rx-dialog-overlay" />
      <DialogContent class="rx-dialog-content">
        <!-- Saved confirmation -->
        <template v-if="savedClass">
          <div class="rx-dialog-header">
            <DialogTitle class="rx-dialog-title">Class Saved</DialogTitle>
            <DialogClose class="rx-dialog-close" aria-label="Close">&times;</DialogClose>
          </div>
          <div class="rx-dialog-body saved-confirmation">
            <div class="saved-check">&#10003;</div>
            <h3 class="saved-name">{{ savedClass.name }}</h3>
            <p class="saved-meta">Added to your classes</p>
            <a
              :href="toGoogleCalendarUrl(savedClass)"
              target="_blank"
              rel="noopener"
              class="rx-btn rx-btn-primary saved-gcal-btn"
            >
              Add to Google Calendar
            </a>
            <button type="button" class="rx-btn rx-btn-ghost" @click="closeAll">Done</button>
          </div>
        </template>

        <!-- Form -->
        <template v-else>
        <div class="rx-dialog-header">
          <DialogTitle class="rx-dialog-title">Add Class</DialogTitle>
          <DialogClose class="rx-dialog-close" aria-label="Close">&times;</DialogClose>
        </div>
        <DialogDescription class="sr-only">Fill in the details to add a new class session.</DialogDescription>

        <form class="rx-dialog-body" @submit.prevent="submit">
          <div class="field" style="position:relative">
            <Label for="ac-name" class="rx-label">Class Name</Label>
            <input
              id="ac-name"
              v-model="className"
              type="text"
              class="rx-input"
              :aria-invalid="!!errors.name"
              placeholder="e.g. Mathematics"
              autocomplete="off"
              @input="onNameInput"
              @focus="onNameFocus"
              @blur="onNameBlur"
            />
            <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-list">
              <button
                v-for="s in suggestions"
                :key="s"
                type="button"
                class="suggestion-item"
                @mousedown.prevent="pickSuggestion(s)"
              >
                {{ s }}
              </button>
            </div>
            <span v-if="errors.name" class="rx-field-error">{{ errors.name }}</span>
          </div>

          <!-- Date picker -->
          <div class="field">
            <Label class="rx-label">Date</Label>
            <button type="button" class="picker-trigger" @click="datePickerOpen = !datePickerOpen; startPickerOpen = false; endPickerOpen = false">
              <span>{{ displayDate }}</span>
              <span class="picker-chevron" :class="{ 'picker-chevron--open': datePickerOpen }">&#9662;</span>
            </button>

            <div v-if="datePickerOpen" class="cal-wrapper">
              <CalendarRoot
                v-model="calendarDate"
                v-slot="{ weekDays, grid }"
                class="cal-root"
                weekday-format="short"
                @update:model-value="selectDate"
              >
                <CalendarHeader class="cal-header">
                  <CalendarPrev class="cal-nav">&lsaquo;</CalendarPrev>
                  <CalendarHeading class="cal-heading" />
                  <CalendarNext class="cal-nav">&rsaquo;</CalendarNext>
                </CalendarHeader>

                <CalendarGrid
                  v-for="month in grid"
                  :key="month.value.toString()"
                  class="cal-grid"
                >
                  <CalendarGridHead>
                    <CalendarGridRow class="cal-grid-row">
                      <CalendarHeadCell
                        v-for="day in weekDays"
                        :key="day"
                        class="cal-head-cell"
                      >
                        {{ day }}
                      </CalendarHeadCell>
                    </CalendarGridRow>
                  </CalendarGridHead>
                  <CalendarGridBody>
                    <CalendarGridRow
                      v-for="(weekDates, index) in month.rows"
                      :key="`week-${index}`"
                      class="cal-grid-row"
                    >
                      <CalendarCell
                        v-for="weekDate in weekDates"
                        :key="weekDate.toString()"
                        :date="weekDate"
                        class="cal-cell"
                      >
                        <CalendarCellTrigger
                          :day="weekDate"
                          :month="month.value"
                          class="cal-day"
                        />
                      </CalendarCell>
                    </CalendarGridRow>
                  </CalendarGridBody>
                </CalendarGrid>
              </CalendarRoot>
            </div>
          </div>

          <!-- Start Time with radial clock -->
          <div class="field">
            <Label class="rx-label">Start Time</Label>
            <button type="button" class="picker-trigger" @click="startPickerOpen = !startPickerOpen; datePickerOpen = false; endPickerOpen = false">
              <span>{{ displayStartTime }}</span>
              <span class="picker-chevron" :class="{ 'picker-chevron--open': startPickerOpen }">&#9662;</span>
            </button>
            <ClockPicker
              v-if="startPickerOpen"
              :model-value="timeStart"
              @update:model-value="timeStart = $event"
              @done="onStartDone"
            />
            <span v-if="errors.timeStart" class="rx-field-error">{{ errors.timeStart }}</span>
          </div>

          <!-- End Time with radial clock -->
          <div class="field">
            <Label class="rx-label">End Time</Label>
            <button type="button" class="picker-trigger" @click="endPickerOpen = !endPickerOpen; datePickerOpen = false; startPickerOpen = false">
              <span>{{ displayEndTime }}</span>
              <span class="picker-chevron" :class="{ 'picker-chevron--open': endPickerOpen }">&#9662;</span>
            </button>
            <ClockPicker
              v-if="endPickerOpen"
              :model-value="timeEnd"
              @update:model-value="timeEnd = $event"
              @done="onEndDone"
            />
            <span v-if="errors.timeEnd" class="rx-field-error">{{ errors.timeEnd }}</span>
          </div>

          <div class="field">
            <Label for="ac-remarks" class="rx-label">Remarks</Label>
            <textarea
              id="ac-remarks"
              v-model="remarks"
              class="rx-input rx-textarea"
              placeholder="Optional notes..."
              rows="2"
            ></textarea>
          </div>

          <div class="rx-dialog-footer">
            <DialogClose as-child>
              <button type="button" class="rx-btn rx-btn-ghost">Cancel</button>
            </DialogClose>
            <button type="submit" class="rx-btn rx-btn-primary">Add Class</button>
          </div>
        </form>
        </template>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
