<script setup lang="ts">
import { ref } from 'vue'
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
import { storage } from '@/lib/storage'
import AddClassModal from '@/components/AddClassModal.vue'

const user = useUserStore()
const store = useClassesStore()
const themeStore = useThemeStore()
const router = useRouter()

const showAddClass = ref(false)
const newTag = ref('')
const importError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const showImportConfirm = ref(false)

function onNameChange(e: Event) {
  user.setName((e.target as HTMLInputElement).value)
}

function addTag() {
  const tag = newTag.value.trim()
  if (tag) {
    store.addQuickTag(tag)
    newTag.value = ''
  }
}

function exportData() {
  const json = storage.exportAll()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'classmanager-backup.json'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.value = ''
    fileInput.value.click()
  }
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  pendingFile.value = file
  importError.value = ''
  showImportConfirm.value = true
}

function confirmImport() {
  if (!pendingFile.value) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      storage.importAll(reader.result as string)
      window.location.reload()
    } catch {
      importError.value = 'Invalid backup file. Please select a valid export.'
      showImportConfirm.value = false
      pendingFile.value = null
    }
  }
  reader.onerror = () => {
    importError.value = 'Could not read the file. Please try again.'
    showImportConfirm.value = false
    pendingFile.value = null
  }
  reader.readAsText(pendingFile.value)
}

function cancelImport() {
  pendingFile.value = null
  showImportConfirm.value = false
  if (fileInput.value) fileInput.value.value = ''
}

function clearAllData() {
  user.reset()
  store.dayRecords.splice(0)
  store.savedNames.splice(0)
  router.replace({ name: 'welcome' })
}
</script>

<template>
  <div class="settings">
    <h1 class="page-title">Settings</h1>

    <!-- Profile -->
    <div class="rx-card">
      <h2 class="card-heading">Profile</h2>
      <div class="field">
        <Label for="settings-name" class="rx-label">Your Name</Label>
        <input id="settings-name" type="text" class="rx-input" :value="user.name" @input="onNameChange" />
      </div>
    </div>

    <!-- Manage Classes -->
    <div class="rx-card">
      <div class="card-header-row">
        <h2 class="card-heading" style="margin-bottom:0">Classes</h2>
        <button class="rx-btn rx-btn-primary rx-btn--sm" @click="showAddClass = true">+ Add</button>
      </div>
      <p v-if="store.savedNames.length === 0" class="info-text">No classes added yet. Tap "+ Add" to create your first class.</p>
      <div v-else class="tag-list">
        <div v-for="name in store.savedNames" :key="name" class="tag-item">
          <span>{{ name }}</span>
          <button class="tag-remove" @click="store.removeClassName(name)">&times;</button>
        </div>
      </div>
    </div>

    <!-- Events -->
    <div class="rx-card">
      <h2 class="card-heading">Events</h2>
      <p class="info-text" style="margin-bottom:0.75rem">Events like Holiday or Seminar that you can quickly mark on any day.</p>
      <div v-if="store.quickTags.length > 0" class="tag-list" style="margin-bottom:0.75rem">
        <div v-for="tag in store.quickTags" :key="tag" class="tag-item">
          <span>{{ tag }}</span>
          <button class="tag-remove" @click="store.removeQuickTag(tag)">&times;</button>
        </div>
      </div>
      <form class="add-tag-row" @submit.prevent="addTag">
        <input v-model="newTag" type="text" class="rx-input" placeholder="New tag name" />
        <button type="submit" class="rx-btn rx-btn-primary rx-btn--sm" :disabled="!newTag.trim()">Add</button>
      </form>
    </div>

    <!-- Appearance -->
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

    <!-- Storage -->
    <div class="rx-card">
      <h2 class="card-heading">Storage</h2>
      <p class="info-text">All data is stored locally on your device. Nothing is sent to any server.</p>
      <div class="storage-row">
        <div class="storage-stat">
          <span class="storage-value">{{ store.totalDaysRecorded }}</span>
          <span class="storage-label">Days recorded</span>
        </div>
        <div class="storage-stat">
          <span class="storage-value">{{ store.savedNames.length }}</span>
          <span class="storage-label">Classes</span>
        </div>
      </div>
    </div>

    <!-- Data Export/Import -->
    <div class="rx-card">
      <h2 class="card-heading">Data</h2>
      <p class="info-text">Export your data as a JSON backup or import from a previous export.</p>
      <div class="data-actions">
        <button class="rx-btn rx-btn-primary rx-btn--sm" @click="exportData">Export Data</button>
        <button class="rx-btn rx-btn-ghost rx-btn--sm" @click="triggerFileInput">Import Data</button>
        <input ref="fileInput" type="file" accept="application/json,.json,text/plain" style="display:none" @change="onFileSelect" />
      </div>
      <p v-if="importError" class="rx-field-error" style="margin-top:0.5rem">{{ importError }}</p>

      <AlertDialogRoot :open="showImportConfirm" @update:open="(v: boolean) => { if (!v) cancelImport() }">
        <AlertDialogPortal>
          <AlertDialogOverlay class="rx-alert-overlay" />
          <AlertDialogContent class="rx-alert-content">
            <AlertDialogTitle class="rx-alert-title">Import Data?</AlertDialogTitle>
            <AlertDialogDescription class="rx-alert-desc">
              This will replace all your current data with the contents of the selected file. This cannot be undone.
            </AlertDialogDescription>
            <div class="rx-alert-actions">
              <AlertDialogCancel as-child>
                <button class="rx-btn rx-btn-ghost" @click="cancelImport">Cancel</button>
              </AlertDialogCancel>
              <AlertDialogAction as-child>
                <button class="rx-btn rx-btn-primary" @click="confirmImport">Yes, import</button>
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialogRoot>
    </div>

    <Separator class="rx-separator" />

    <!-- Danger Zone -->
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
              This will permanently delete all your classes, attendance records, and reset your profile. This action cannot be undone.
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

    <AddClassModal v-model:visible="showAddClass" />
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

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.theme-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.tag-list { display: flex; flex-direction: column; gap: 0.375rem; }

.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.875rem;
}

.tag-remove {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
  transition: color 0.15s ease;
}

.tag-remove:hover { color: #dc2626; }

.add-tag-row {
  display: flex;
  gap: 0.5rem;
}

.add-tag-row .rx-input { flex: 1; }

.rx-btn--sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }

.data-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

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
