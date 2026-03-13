<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Label } from 'radix-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()

const nameInput = ref('')
const hasError = ref(false)

function submit() {
  if (nameInput.value.trim().length < 2) {
    hasError.value = true
    return
  }
  hasError.value = false
  userStore.setName(nameInput.value)
  router.replace({ name: 'home' })
}
</script>

<template>
  <div class="welcome">
    <div class="welcome-container">
      <div class="welcome-header">
        <span class="welcome-icon">📚</span>
        <h1 class="welcome-title">Class Manager</h1>
        <p class="welcome-subtitle">Your personal class management app</p>
      </div>

      <form class="welcome-form" @submit.prevent="submit">
        <Label for="name-input" class="rx-label" style="font-size: 0.9375rem; color: var(--color-text)">
          What's your name?
        </Label>
        <input
          id="name-input"
          v-model="nameInput"
          type="text"
          class="rx-input"
          :aria-invalid="hasError"
          placeholder="Enter your name"
          autocomplete="name"
          autofocus
          @input="hasError = false"
        />
        <p v-if="hasError" class="rx-field-error">Please enter at least 2 characters</p>

        <button type="submit" class="rx-btn rx-btn-primary welcome-btn" :disabled="nameInput.trim().length === 0">
          Continue
        </button>
      </form>

      <p class="welcome-note">All your data stays on this device. Nothing is sent to any server.</p>
    </div>
  </div>
</template>

<style scoped>
.welcome {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--color-bg);
}

.welcome-container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.welcome-header { text-align: center; }

.welcome-icon {
  font-size: 3.5rem;
  display: block;
  margin-bottom: 1rem;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.375rem;
}

.welcome-subtitle {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}

.welcome-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.welcome-btn {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.875rem;
  font-size: 1rem;
  border-radius: 0.75rem;
}

.welcome-note {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  opacity: 0.7;
  line-height: 1.5;
}
</style>
