const STORAGE_PREFIX = 'classmanager_'
const KNOWN_KEYS = ['user_name', 'theme', 'day_records', 'class_names', 'quick_tags', 'sync_enabled', 'sync_id', 'sync_last']

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  },

  remove(key: string): void {
    localStorage.removeItem(STORAGE_PREFIX + key)
  },

  clear(): void {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX))
    keys.forEach((k) => localStorage.removeItem(k))
  },

  exportAll(): string {
    const data: Record<string, unknown> = {
      version: 1,
      exportedAt: new Date().toISOString(),
    }
    for (const key of KNOWN_KEYS) {
      const val = storage.get(key)
      if (val !== null) data[key] = val
    }
    return JSON.stringify(data, null, 2)
  },

  importAll(json: string): void {
    const data = JSON.parse(json)
    if (!data || data.version !== 1) {
      throw new Error('Invalid backup file')
    }
    const syncBackup = {
      sync_enabled: storage.get('sync_enabled'),
      sync_id: storage.get('sync_id'),
      sync_last: storage.get('sync_last'),
    }
    storage.clear()
    const skip = ['version', 'exportedAt', 'syncedAt']
    for (const [key, value] of Object.entries(data)) {
      if (skip.includes(key)) continue
      storage.set(key, value)
    }
    if (syncBackup.sync_id) {
      storage.set('sync_id', syncBackup.sync_id)
      storage.set('sync_enabled', syncBackup.sync_enabled)
      storage.set('sync_last', syncBackup.sync_last)
    }
  },
}
