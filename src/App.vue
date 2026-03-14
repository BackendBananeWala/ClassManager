<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  Separator,
} from 'radix-vue'
import { useThemeStore } from '@/stores/theme'

useThemeStore()

const route = useRoute()
const router = useRouter()
const isFullscreen = computed(() => route.meta.fullscreen === true)
const menuOpen = ref(false)

const pageName = computed(() => {
  switch (route.name) {
    case 'home': return 'Home'
    case 'dashboard': return 'Dashboard'
    case 'settings': return 'Settings'
    default: return ''
  }
})

function navigate(path: string) {
  router.push(path)
  menuOpen.value = false
}
</script>

<template>
  <div class="app-layout" :class="{ 'app-layout--fullscreen': isFullscreen }">
    <template v-if="!isFullscreen">
      <header class="app-header">
        <div class="header-content">
          <RouterLink to="/" class="logo">
            <span class="logo-icon">📚</span>
            <span class="logo-text">Class Manager</span>
          </RouterLink>

          <DropdownMenuRoot v-model:open="menuOpen">
            <DropdownMenuTrigger class="menu-trigger">
              <span class="menu-page">{{ pageName }}</span>
              <span class="menu-icon">&#9776;</span>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent class="rx-dropdown-content" :side-offset="8" align="end">
                <DropdownMenuItem class="rx-dropdown-item" :class="{ 'rx-dropdown-item--active': route.name === 'home' }" @select="navigate('/')">
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem class="rx-dropdown-item" :class="{ 'rx-dropdown-item--active': route.name === 'dashboard' }" @select="navigate('/dashboard')">
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem class="rx-dropdown-item" :class="{ 'rx-dropdown-item--active': route.name === 'settings' }" @select="navigate('/settings')">
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
        </div>
      </header>
    </template>

    <main :class="{ 'app-main': !isFullscreen }">
      <RouterView />
    </main>

    <template v-if="!isFullscreen">
      <Separator class="rx-separator" />
      <footer class="app-footer">
        <p>&copy; {{ new Date().getFullYear() }} Class Manager</p>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.app-layout { min-height: 100dvh; display: flex; flex-direction: column; }
.app-layout--fullscreen { min-height: 0; }

.app-header {
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  background: var(--color-header-bg);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--color-text);
  font-weight: 700;
  font-size: 1.125rem;
}

.logo-icon { font-size: 1.25rem; }

.menu-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 0.375rem 0.75rem;
  cursor: pointer;
  font-family: inherit;
  color: var(--color-text);
  transition: all 0.15s ease;
}

.menu-trigger:hover { border-color: var(--color-text-muted); }

.menu-page { font-size: 0.8125rem; font-weight: 600; }
.menu-icon { font-size: 1rem; line-height: 1; }

.app-main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  width: 100%;
}

.app-footer {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
</style>
