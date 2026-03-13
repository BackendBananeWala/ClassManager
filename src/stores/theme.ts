import { ref } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/lib/storage'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(storage.get<Theme>('theme') ?? 'dark')

  function setTheme(t: Theme) {
    theme.value = t
    storage.set('theme', t)
    applyTheme(t)
  }

  function toggle() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
  }

  applyTheme(theme.value)

  return { theme, setTheme, toggle }
})
