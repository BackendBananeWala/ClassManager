import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/lib/storage'

export const useUserStore = defineStore('user', () => {
  const name = ref(storage.get<string>('user_name') ?? '')

  const isOnboarded = computed(() => name.value.trim().length > 0)

  const firstName = computed(() => name.value.split(' ')[0])

  function setName(newName: string) {
    name.value = newName.trim()
    storage.set('user_name', name.value)
  }

  function reset() {
    name.value = ''
    storage.remove('user_name')
  }

  return { name, isOnboarded, firstName, setName, reset }
})
