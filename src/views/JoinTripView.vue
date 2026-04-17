<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="router.back()">‹ Back</button>
      <h1 class="page-title">Join Trip</h1>
      <div style="width: 72px" />
    </header>

    <div class="content">
      <p class="hint">Enter the 6-character trip code shared with you.</p>
      <input
        v-model="code"
        type="text"
        placeholder="E.G. AB3K7P"
        maxlength="6"
        autocorrect="off"
        autocapitalize="characters"
        spellcheck="false"
        class="code-input"
        @input="code = code.toUpperCase()"
      />
      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      <button
        class="join-btn"
        :disabled="code.length !== 6 || loading"
        @click="handleJoin"
      >
        {{ loading ? 'Joining...' : 'Join Trip' }}
      </button>

      <template v-if="trips.myTrips.length">
        <div class="divider">
          <span class="divider-label">OR SHARE YOURS</span>
        </div>
        <div
          v-for="trip in trips.myTrips"
          :key="trip.id"
          class="share-card"
        >
          <div>
            <p class="share-trip-name">{{ trip.name }}</p>
            <p class="share-code">{{ trip.trip_code }}</p>
          </div>
          <button class="share-btn" @click="shareTrip(trip.trip_code, trip.name)">Share</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTripsStore } from '@/stores/trips'

const router = useRouter()
const tripsStore = useTripsStore()
const trips = tripsStore

const code = ref('')
const loading = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  if (trips.myTrips.length === 0) {
    await trips.fetchMyTrips()
  }
})

async function handleJoin() {
  errorMsg.value = ''
  loading.value = true
  try {
    const trip = await tripsStore.joinTrip(code.value)
    router.replace({ name: 'trip', params: { id: trip.id } })
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to join trip'
  } finally {
    loading.value = false
  }
}

async function shareTrip(tripCode: string, tripName: string) {
  const text = `Join my trip "${tripName}" on Muninn! Code: ${tripCode}`
  if (navigator.share) {
    await navigator.share({ title: 'Muninn Trip Code', text })
  } else {
    await navigator.clipboard.writeText(tripCode)
  }
}
</script>

<style scoped>
.page {
  min-height: 100svh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  padding-top: calc(env(safe-area-inset-top, 0px) + 1rem);
}

.back-btn {
  background: none;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-pill);
  padding: 0.3rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
}

.page-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.content {
  padding: 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hint {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.code-input {
  padding: 1.125rem 1rem;
  font-size: 1.75rem;
  font-family: monospace;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-align: center;
  text-transform: uppercase;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  width: 100%;
  outline: none;
  transition: border-color 0.15s;
}

.code-input::placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}

.code-input:focus {
  border-color: var(--dark);
}

.join-btn {
  padding: 0.875rem;
  background: none;
  color: var(--text);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s;
}

.join-btn:not(:disabled):hover {
  border-color: var(--dark);
}

.join-btn:disabled {
  opacity: 0.4;
}

.divider {
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.divider-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0 0.75rem;
}

.share-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  border: 1.5px solid var(--border);
}

.share-trip-name {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 0.2rem;
}

.share-code {
  font-size: 1.25rem;
  font-family: monospace;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--text);
}

.share-btn {
  padding: 0.45rem 1.125rem;
  background: none;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text);
  transition: border-color 0.15s;
}

.share-btn:hover {
  border-color: var(--dark);
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
}
</style>
