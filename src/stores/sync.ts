import { ref } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/lib/storage'
import { debouncedPush, pullData, mergeData } from '@/lib/sync'

export const useSyncStore = defineStore('sync', () => {
  const syncEnabled = ref<boolean>(storage.get<boolean>('sync_enabled') ?? false)
  const syncId = ref<string>(storage.get<string>('sync_id') ?? '')
  const lastSynced = ref<string>(storage.get<string>('sync_last') ?? '')
  const syncing = ref(false)
  const error = ref('')

  function persist() {
    storage.set('sync_enabled', syncEnabled.value)
    storage.set('sync_id', syncId.value)
    storage.set('sync_last', lastSynced.value)
  }

  function enableSync() {
    if (!syncId.value) {
      syncId.value = crypto.randomUUID()
    }
    syncEnabled.value = true
    persist()
    triggerPush()
  }

  function disableSync() {
    syncEnabled.value = false
    persist()
  }

  function setSyncId(id: string) {
    syncId.value = id.trim()
    persist()
  }

  function triggerPush() {
    if (!syncEnabled.value || !syncId.value) return
    error.value = ''
    debouncedPush(syncId.value, () => {
      lastSynced.value = new Date().toISOString()
      persist()
    })
  }

  async function triggerPull(mode: 'replace' | 'merge') {
    const id = syncId.value
    if (!id) {
      error.value = 'No Sync ID set.'
      return
    }
    syncing.value = true
    error.value = ''
    try {
      const remote = await pullData(id)
      if (!remote) {
        error.value = 'No data found for this Sync ID.'
        syncing.value = false
        return
      }
      if (mode === 'replace') {
        storage.importAll(JSON.stringify({ ...remote, version: remote.version ?? 1 }))
      } else {
        const localJson = storage.exportAll()
        const local = JSON.parse(localJson)
        const merged = mergeData(local, remote)
        storage.importAll(JSON.stringify({ ...merged, version: 1 }))
      }
      syncing.value = false
      setTimeout(() => window.location.reload(), 300)
    } catch (e) {
      error.value = 'Sync failed. Check your connection.'
      syncing.value = false
    }
  }

  return {
    syncEnabled,
    syncId,
    lastSynced,
    syncing,
    error,
    enableSync,
    disableSync,
    setSyncId,
    triggerPush,
    triggerPull,
  }
})
