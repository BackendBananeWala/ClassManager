<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  SwitchRoot,
  SwitchThumb,
} from 'radix-vue'
import { Label, Separator } from 'radix-vue'
import { useUserStore } from '@/stores/user'
import { useClassesStore } from '@/stores/classes'
import { useThemeStore } from '@/stores/theme'

const user = useUserStore()
const classesStore = useClassesStore()
const themeStore = useThemeStore()
const router = useRouter()

function onNameChange(e: Event) {
  user.setName((e.target as HTMLInputElement).value)
}

function clearAllData() {
  user.reset()
  classesStore.classes.splice(0)
  router.replace({ name: 'welcome' })
}
</script>

<template>
  <div class="settings">
    <h1 class="page-title">Settings</h1>

    <div class="rx-card">
      <h2 class="card-heading">Profile</h2>
      <div class="field">
        <Label for="settings-name" class="rx-label">Your Name</Label>
        <input id="settings-name" type="text" class="rx-input" :value="user.name" @input="onNameChange" />
      </div>
    </div>

    <div class="rx-card">
      <h2 class="card-heading">Appearance</h2>
      <div class="theme-row">
        <div>
          <Label class="rx-label" style="font-size:0.875rem; color:var(--color-text)">Dark Mode</Label>
          <p class="info-text" style="margin-bottom:0">Switch between light and dark theme</p>
        </div>
        <SwitchRoot
          class="rx-switch"
          :checked="themeStore.theme === 'dark'"
          @update:checked="themeStore.toggle()"
        >
          <SwitchThumb class="rx-switch-thumb" />
        </SwitchRoot>
      </div>
    </div>

    <div class="rx-card">
      <h2 class="card-heading">Storage</h2>
      <p class="info-text">All data is stored locally on your device. Nothing is sent to any server.</p>
      <div class="storage-row">
        <div class="storage-stat">
          <span class="storage-value">{{ classesStore.totalClasses }}</span>
          <span class="storage-label">Classes stored</span>
        </div>
      </div>
    </div>

    <Separator class="rx-separator" />

    <div class="rx-card danger-card">
      <h2 class="card-heading danger-heading">Danger Zone</h2>
      <p class="info-text">This will permanently delete all your data and reset the app.</p>

      <AlertDialogRoot>
        <AlertDialogTrigger as-child>
          <button class="rx-btn rx-btn-danger">Clear All Data</button>
        </AlertDialogTrigger>
        <AlertDialogPortal>
          <AlertDialogOverlay class="rx-alert-overlay" />
          <AlertDialogContent class="rx-alert-content">
            <AlertDialogTitle class="rx-alert-title">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription class="rx-alert-desc">
              This will permanently delete all your classes and reset your profile. This action cannot be undone.
            </AlertDialogDescription>
            <div class="rx-alert-actions">
              <AlertDialogCancel as-child>
                <button class="rx-btn rx-btn-ghost">Cancel</button>
              </AlertDialogCancel>
              <AlertDialogAction as-child>
                <button class="rx-btn rx-btn-danger" @click="clearAllData">Yes, delete everything</button>
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialogRoot>
    </div>
  </div>
</template>

<style scoped>
.settings {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-title { font-size: 1.5rem; font-weight: 700; }
.card-heading { font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; }

.theme-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.danger-card { border-color: #dc2626; }
.danger-heading { color: #dc2626; }

.info-text {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.storage-row { display: flex; gap: 1.5rem; }
.storage-stat { display: flex; flex-direction: column; gap: 0.125rem; }
.storage-value { font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.storage-label { font-size: 0.75rem; color: var(--color-text-muted); }
</style>
