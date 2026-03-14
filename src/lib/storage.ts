const STORAGE_PREFIX = 'classmanager_'

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
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        const shortKey = key.slice(STORAGE_PREFIX.length)
        try {
          data[shortKey] = JSON.parse(localStorage.getItem(key)!)
        } catch {
          data[shortKey] = localStorage.getItem(key)
        }
      }
    }
    return JSON.stringify(data, null, 2)
  },

  importAll(json: string): void {
    const data = JSON.parse(json)
    if (!data || data.version !== 1) {
      throw new Error('Invalid backup file')
    }
    const reserved = ['version', 'exportedAt']
    for (const [key, value] of Object.entries(data)) {
      if (reserved.includes(key)) continue
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    }
  },
}
