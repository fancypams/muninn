<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="router.back()">‹ Back</button>
      <h1 class="page-title">New Itinerary</h1>
      <div style="width: 72px" />
    </header>

    <div class="content">
      <div class="field">
        <label class="field-label">Trip Name</label>
        <input v-model="tripName" type="text" placeholder="e.g. Barcelona Weekend" />
      </div>

      <div class="items-section">
        <div class="section-header">
          <h2 class="section-label">Itinerary Items</h2>
          <button v-if="!showForm" class="add-btn" @click="showForm = true">+ Add</button>
        </div>

        <div v-if="showForm" class="item-form">
          <p class="form-section-label">New Activity</p>
          <input v-model="draft.title" type="text" placeholder="Activity title" />
          <div class="time-row">
            <input v-model="draft.date" type="date" />
            <input v-model="draft.startTime" type="time" />
          </div>
          <div class="time-row">
            <label class="end-label">End time (optional)</label>
            <input v-model="draft.endTime" type="time" />
          </div>
          <textarea v-model="draft.notes" placeholder="Notes (optional)" rows="2" />
          <div class="form-actions">
            <button class="cancel-btn" @click="cancelDraft">Cancel</button>
            <button class="save-btn" :disabled="!draft.title || !draft.date || !draft.startTime" @click="addDraftItem">Add</button>
          </div>
        </div>

        <p v-if="items.length === 0 && !showForm" class="muted">No items yet.</p>

        <ul class="item-list">
          <li v-for="(item, i) in items" :key="i" class="item-card">
            <div class="item-main">
              <div class="item-info">
                <span class="item-title">{{ item.title }}</span>
                <span class="item-time">{{ formatItemTime(item) }}</span>
                <span v-if="item.notes" class="item-notes">{{ item.notes }}</span>
              </div>
              <button class="icon-btn delete" @click="items.splice(i, 1)">✕</button>
            </div>
          </li>
        </ul>
      </div>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <button
        class="create-btn"
        :disabled="!tripName.trim() || submitting"
        @click="handleCreate"
      >
        {{ submitting ? 'Creating...' : 'Create Trip' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useTripsStore } from '@/stores/trips'
import type { ItemDraft } from '@/stores/trips'

const router = useRouter()
const tripsStore = useTripsStore()

const tripName = ref('')
const submitting = ref(false)
const errorMsg = ref('')
const showForm = ref(false)
const items = ref<{ title: string; notes: string; date: string; startTime: string; endTime: string }[]>([])

const draft = reactive({ title: '', date: '', startTime: '', endTime: '', notes: '' })

function cancelDraft() {
  Object.assign(draft, { title: '', date: '', startTime: '', endTime: '', notes: '' })
  showForm.value = false
}

function addDraftItem() {
  items.value.push({ ...draft })
  cancelDraft()
}

function formatItemTime(item: { date: string; startTime: string; endTime: string }) {
  const date = new Date(`${item.date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
  const start = formatTime(item.startTime)
  const end = item.endTime ? ` – ${formatTime(item.endTime)}` : ''
  return `${date} · ${start}${end}`
}

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function toISO(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}

async function handleCreate() {
  errorMsg.value = ''
  submitting.value = true
  try {
    const draftItems: ItemDraft[] = items.value.map((item) => ({
      title: item.title,
      notes: item.notes || undefined,
      start_at: toISO(item.date, item.startTime),
      end_at: item.endTime ? toISO(item.date, item.endTime) : undefined
    }))

    const trip = await tripsStore.createTrip(tripName.value.trim(), draftItems)
    router.replace({ name: 'trip', params: { id: trip.id } })
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to create trip'
  } finally {
    submitting.value = false
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
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

.field-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.field input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  background: var(--surface);
  color: var(--text);
  outline: none;
  transition: border-color 0.15s;
}

.field input::placeholder {
  color: var(--text-muted);
}

.field input:focus {
  border-color: var(--dark);
}

.items-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.add-btn {
  background: none;
  border: none;
  color: var(--text);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.item-form {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1.5px solid var(--border);
}

.form-section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.item-form input,
.item-form textarea {
  width: 100%;
  padding: 0.7rem 0.875rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  background: var(--bg);
  color: var(--text);
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}

.item-form input::placeholder,
.item-form textarea::placeholder {
  color: var(--text-muted);
}

.item-form input:focus,
.item-form textarea:focus {
  border-color: var(--dark);
  background: var(--surface);
}

.time-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.time-row input { flex: 1; }

.end-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.25rem;
}

.cancel-btn {
  padding: 0.55rem 1.125rem;
  background: none;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text);
}

.save-btn {
  padding: 0.55rem 1.5rem;
  background: var(--gold);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 700;
}

.save-btn:disabled { opacity: 0.4; }

.item-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-card {
  background: var(--surface);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--border);
}

.item-main {
  display: flex;
  align-items: flex-start;
  padding: 0.875rem 1rem;
  gap: 0.75rem;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.item-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.item-time {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.item-notes {
  font-size: 0.8rem;
  color: var(--text-muted);
  opacity: 0.7;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.icon-btn.delete:hover { color: #dc2626; opacity: 1; }

.create-btn {
  padding: 0.9375rem;
  background: var(--dark);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: auto;
  transition: opacity 0.15s;
}

.create-btn:disabled { opacity: 0.4; }

.error {
  color: #dc2626;
  font-size: 0.875rem;
}

.muted {
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
