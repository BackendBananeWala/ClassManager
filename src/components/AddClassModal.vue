<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'radix-vue'
import { Label } from 'radix-vue'
import { useClassesStore } from '@/stores/classes'

const open = defineModel<boolean>('visible', { default: false })
const store = useClassesStore()

const className = ref('')
const error = ref('')
const showSuggestions = ref(false)

const suggestions = computed(() => {
  if (!className.value.trim()) return []
  const q = className.value.toLowerCase()
  return store.savedNames.filter((n) => n.toLowerCase().includes(q))
})

function pickSuggestion(name: string) {
  className.value = name
  showSuggestions.value = false
}

function submit() {
  const name = className.value.trim()
  if (!name) {
    error.value = 'Class name is required'
    return
  }
  if (store.savedNames.includes(name)) {
    error.value = 'This class already exists'
    return
  }
  store.addClassName(name)
  className.value = ''
  error.value = ''
  open.value = false
}

function onOpenChange(val: boolean) {
  if (!val) {
    className.value = ''
    error.value = ''
    showSuggestions.value = false
  }
  open.value = val
}
</script>

<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="rx-dialog-overlay" />
      <DialogContent class="rx-dialog-content">
        <div class="rx-dialog-header">
          <DialogTitle class="rx-dialog-title">Add Class</DialogTitle>
          <DialogClose class="rx-dialog-close" aria-label="Close">&times;</DialogClose>
        </div>
        <DialogDescription class="sr-only">Enter the name of a class to add to your list.</DialogDescription>

        <form class="rx-dialog-body" @submit.prevent="submit">
          <div class="field" style="position:relative">
            <Label for="ac-name" class="rx-label">Class Name</Label>
            <input
              id="ac-name"
              v-model="className"
              type="text"
              class="rx-input"
              :aria-invalid="!!error"
              placeholder="e.g. Mathematics"
              autocomplete="off"
              @input="showSuggestions = className.length > 0 && suggestions.length > 0; error = ''"
              @focus="showSuggestions = className.length > 0 && suggestions.length > 0"
              @blur="setTimeout(() => showSuggestions = false, 150)"
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
            <span v-if="error" class="rx-field-error">{{ error }}</span>
          </div>

          <div class="rx-dialog-footer">
            <DialogClose as-child>
              <button type="button" class="rx-btn rx-btn-ghost">Cancel</button>
            </DialogClose>
            <button type="submit" class="rx-btn rx-btn-primary">Add</button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
