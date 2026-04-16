<template>
  <div class="page">
    <header class="page-header">
      <button class="back" @click="router.back()">‹ Back</button>
      <h1>New Itinerary</h1>
      <div style="width: 60px" />
    </header>

    <div class="content">
      <div class="field">
        <label>Trip Name</label>
        <input v-model="tripName" type="text" placeholder="e.g. Barcelona Weekend" />
      </div>

      <div class="items-section">
        <div class="section-header">
          <h2>Itinerary Items</h2>
          <button v-if="!showForm" class="add-btn" @click="showForm = true">+ Add</button>
        </div>

        <div v-if="showForm" class="item-form">
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
          <li v-for="(item, i) in items" :key="i" class="item-row">
            <div class="item-info">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-time">{{ formatItemTime(item) }}</span>
              <span v-if="item.notes" class="item-notes">{{ item.notes }}</span>
            </div>
            <button class="delete-btn" @click="items.splice(i, 1)">✕</button>
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
const items = ref<(ItemDraft & { date: string; startTime: string; endTime: string })[]>([])

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
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

.field label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.field input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
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

.section-header h2 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.add-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.item-form {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-form input,
.item-form textarea {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
}

.time-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.time-row input {
  flex: 1;
}

.end-label {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
}

.save-btn {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
}

.save-btn:disabled {
  opacity: 0.4;
}

.item-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f9fafb;
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.item-title {
  font-weight: 600;
  font-size: 0.9rem;
}

.item-time {
  font-size: 0.8rem;
  color: #6b7280;
}

.item-notes {
  font-size: 0.8rem;
  color: #9ca3af;
}

.delete-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
}

.create-btn {
  padding: 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: auto;
}

.create-btn:disabled {
  opacity: 0.4;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
}

.muted {
  color: #9ca3af;
  font-size: 0.875rem;
}
</style>
