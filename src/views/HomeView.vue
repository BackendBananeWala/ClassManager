<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useClassesStore } from '@/stores/classes'
import { toGoogleCalendarUrl } from '@/lib/calendar'
import AddClassModal from '@/components/AddClassModal.vue'

const user = useUserStore()
const classesStore = useClassesStore()
const showAddModal = ref(false)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

function formatDisplayTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}
</script>

<template>
  <div class="home">
    <section class="greeting-row">
      <div>
        <p class="greeting-sub">{{ greeting }},</p>
        <h1 class="greeting-name">{{ user.firstName }}</h1>
      </div>
      <button class="rx-btn rx-btn-primary" @click="showAddModal = true">+ Add Class</button>
    </section>

    <section class="stats-grid">
      <div class="rx-card stat-card">
        <span class="stat-value">{{ classesStore.todayClasses.length }}</span>
        <span class="stat-label">Today</span>
      </div>
      <div class="rx-card stat-card">
        <span class="stat-value">{{ classesStore.todayHours }}</span>
        <span class="stat-label">Hours</span>
      </div>
    </section>

    <section v-if="classesStore.todayClasses.length === 0" class="empty-state">
      <span class="empty-icon">📋</span>
      <h2 class="empty-title">No classes today</h2>
      <p class="empty-desc">Tap "+ Add Class" to log a class you attended today.</p>
    </section>

    <section v-else class="class-list">
      <h2 class="list-heading">Classes Attended</h2>
      <div class="class-cards">
        <article v-for="cls in classesStore.todayClasses" :key="cls.id" class="rx-card class-card">
          <div class="class-card-top">
            <h3 class="class-card-name">{{ cls.name }}</h3>
            <button class="rx-btn rx-btn-ghost class-card-remove" @click="classesStore.removeClass(cls.id)">&times;</button>
          </div>
          <div class="class-card-meta">
            <span>{{ formatDisplayTime(cls.timeStart) }} – {{ formatDisplayTime(cls.timeEnd) }}</span>
          </div>
          <p v-if="cls.remarks" class="class-card-remarks">{{ cls.remarks }}</p>
          <a :href="toGoogleCalendarUrl(cls)" target="_blank" rel="noopener" class="gcal-link">+ Google Calendar</a>
        </article>
      </div>
    </section>

    <AddClassModal v-model:visible="showAddModal" />
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 1.5rem; }

.greeting-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0;
}

.greeting-sub {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  margin-bottom: 0.125rem;
}

.greeting-name {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1.25rem 1rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
}

.empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }
.empty-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
.empty-desc { font-size: 0.875rem; color: var(--color-text-muted); max-width: 280px; line-height: 1.6; }

.list-heading { font-size: 1rem; font-weight: 600; color: var(--color-text-muted); margin-bottom: 0.75rem; }

.class-cards { display: flex; flex-direction: column; gap: 0.75rem; }

.class-card { padding: 1rem 1.125rem; transition: border-color 0.15s ease; }
.class-card:hover { border-color: var(--color-text-muted); }

.class-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
.class-card-name { font-size: 1rem; font-weight: 600; }
.class-card-remove { padding: 0 0.25rem; font-size: 1.25rem; line-height: 1; }

.class-card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.class-card-remarks {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  opacity: 0.7;
}
</style>
