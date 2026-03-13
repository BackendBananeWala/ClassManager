<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Separator } from 'radix-vue'
import { useThemeStore } from '@/stores/theme'

useThemeStore()

const route = useRoute()
const isFullscreen = computed(() => route.meta.fullscreen === true)
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
          <nav class="nav-links">
            <RouterLink to="/" class="nav-link">Home</RouterLink>
            <RouterLink to="/settings" class="nav-link">Settings</RouterLink>
          </nav>
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
.app-layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

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

.nav-links { display: flex; gap: 0.25rem; }

.nav-link {
  text-decoration: none;
  color: var(--color-text-muted);
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.15s ease;
}

.nav-link:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.nav-link.router-link-active {
  color: var(--color-text);
  background: var(--color-surface);
  font-weight: 600;
}

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
