<template>
  <div class="page">
    <header class="page-header">
      <button class="back" @click="router.back()">‹ Back</button>
      <h1>Join Trip</h1>
      <div style="width: 60px" />
    </header>

    <div class="content">
      <p class="hint">Enter the 6-character trip code shared with you.</p>
      <input
        v-model="code"
        type="text"
        placeholder="e.g. AB3K7P"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTripsStore } from '@/stores/trips'

const router = useRouter()
const tripsStore = useTripsStore()

const code = ref('')
const loading = ref(false)
const errorMsg = ref('')

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
</script>

<style scoped>
.page {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  padding-top: calc(env(safe-area-inset-top, 0px) + 1rem);
  border-bottom: 1px solid #f3f4f6;
}

.page-header h1 {
  font-size: 1.1rem;
  font-weight: 600;
}

.back {
  background: none;
  border: none;
  font-size: 1rem;
  color: #2563eb;
  cursor: pointer;
  width: 60px;
  text-align: left;
}

.content {
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hint {
  color: #6b7280;
  font-size: 0.9rem;
}

.code-input {
  padding: 1rem;
  font-size: 2rem;
  font-family: monospace;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-align: center;
  text-transform: uppercase;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  width: 100%;
}

.code-input:focus {
  outline: none;
  border-color: #2563eb;
}

.join-btn {
  padding: 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.join-btn:disabled {
  opacity: 0.4;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
}
</style>
