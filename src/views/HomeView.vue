<template>
  <div class="home">
    <header class="home-header">
      <h1>Muninn</h1>
      <button class="sign-out" @click="handleSignOut">Sign Out</button>
    </header>

    <div class="actions">
      <button class="action-card create" @click="router.push({ name: 'create-trip' })">
        <span class="action-icon">+</span>
        <span class="action-label">Create Itinerary</span>
      </button>
      <button class="action-card join" @click="router.push({ name: 'join-trip' })">
        <span class="action-icon">→</span>
        <span class="action-label">Join Trip</span>
      </button>
    </div>

    <section class="trips-section">
      <h2>Your Trips</h2>
      <p v-if="loading" class="muted">Loading...</p>
      <p v-else-if="trips.myTrips.length === 0" class="muted">No trips yet.</p>
      <ul v-else class="trip-list">
        <li
          v-for="trip in trips.myTrips"
          :key="trip.id"
          class="trip-card"
          @click="router.push({ name: 'trip', params: { id: trip.id } })"
        >
          <span class="trip-name">{{ trip.name }}</span>
          <span class="trip-code">{{ trip.trip_code }}</span>
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
  padding: 1.5rem;
  padding-top: calc(env(safe-area-inset-top, 0px) + 1.5rem);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);
  min-height: 100svh;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.home-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
}

.sign-out {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 1rem;
}

.action-card.create {
  background: #2563eb;
  color: white;
}

.action-card.join {
  background: #f3f4f6;
  color: #1a1a1a;
}

.action-icon {
  font-size: 1.75rem;
  font-weight: 300;
  line-height: 1;
}

.action-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.trips-section h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
}

.trip-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.trip-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #f9fafb;
  border-radius: 12px;
  cursor: pointer;
}

.trip-name {
  font-weight: 600;
}

.trip-code {
  font-size: 0.75rem;
  font-family: monospace;
  color: #6b7280;
  background: #e5e7eb;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.muted {
  color: #9ca3af;
  font-size: 0.9rem;
}
</style>
