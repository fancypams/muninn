<template>
  <div class="home">
    <header class="home-header">
      <h1 class="wordmark">muninn</h1>
      <button class="btn-outline-sm" @click="handleSignOut">Sign Out</button>
    </header>

    <div class="actions">
      <button class="action-card create" @click="router.push({ name: 'create-trip' })">
        <span class="action-icon create-icon">+</span>
        <span class="action-label create-label">Create<br>Itinerary</span>
      </button>
      <button class="action-card join" @click="router.push({ name: 'join-trip' })">
        <span class="action-icon">→</span>
        <span class="action-label">Join Trip</span>
      </button>
    </div>

    <section class="trips-section">
      <h2 class="section-label">Your Trips</h2>
      <p v-if="loading" class="muted">Loading...</p>
      <p v-else-if="trips.myTrips.length === 0" class="muted">No trips yet.</p>
      <ul v-else class="trip-list">
        <li
          v-for="trip in trips.myTrips"
          :key="trip.id"
          class="trip-card"
          @click="router.push({ name: 'trip', params: { id: trip.id } })"
        >
          <div class="trip-card-left">
            <span class="trip-name">{{ trip.name }}</span>
          </div>
          <div class="trip-card-right">
            <span class="trip-code-badge">{{ trip.trip_code }}</span>
            <span class="trip-chevron">›</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTripsStore } from '@/stores/trips'

const router = useRouter()
const auth = useAuthStore()
const trips = useTripsStore()
const loading = ref(true)

onMounted(async () => {
  await trips.fetchMyTrips()
  loading.value = false
})

async function handleSignOut() {
  await auth.signOut()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.home {
  min-height: 100svh;
  background: var(--bg);
  padding: 1.5rem;
  padding-top: calc(env(safe-area-inset-top, 0px) + 1.5rem);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.75rem;
}

.wordmark {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
}

.btn-outline-sm {
  background: none;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-pill);
  padding: 0.4rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.15s;
}

.btn-outline-sm:hover {
  border-color: var(--text-muted);
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.875rem;
  margin-bottom: 2.25rem;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 1.5rem 1rem;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 1rem;
  transition: border-color 0.15s;
  min-height: 110px;
}

.action-card:hover {
  border-color: var(--text-muted);
}

.action-icon {
  font-size: 1.5rem;
  font-weight: 400;
  line-height: 1;
  color: var(--text);
}

.create-icon {
  width: 36px;
  height: 36px;
  background: none;
  border: 2px solid var(--gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 300;
  color: var(--gold);
}

.action-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text);
  text-align: center;
  line-height: 1.3;
}

.create-label {
  color: var(--gold);
}

.section-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 0.875rem;
}

.trip-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.trip-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--surface);
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: border-color 0.15s;
}

.trip-card:hover {
  border-color: var(--border);
}

.trip-card-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.trip-name {
  font-weight: 600;
  font-size: 1rem;
}

.trip-card-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.trip-code-badge {
  font-size: 0.75rem;
  font-family: monospace;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  background: var(--bg);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-sm);
}

.trip-chevron {
  font-size: 1.25rem;
  color: var(--text-muted);
  line-height: 1;
}

.muted {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
