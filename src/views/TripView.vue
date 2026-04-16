<template>
  <div class="page">
    <header class="page-header">
      <button class="back" @click="router.push({ name: 'home' })">‹ Back</button>
      <h1>{{ trip?.name ?? '...' }}</h1>
      <div style="width: 60px" />
    </header>

    <!-- Incoming alert banner -->
    <transition name="banner">
      <div v-if="alertBanner" :class="['alert-banner', alertBanner.type]">
        <span class="alert-banner-icon">{{ alertBanner.type === 'hard' ? '🚨' : '🙋' }}</span>
        <div class="alert-banner-text">
          <strong>{{ alertBanner.sender_email }}</strong>
          <span>{{ alertBanner.type === 'hard' ? ' wants to leave NOW' : ' is ready whenever' }}</span>
        </div>
        <button class="alert-banner-close" @click="alertBanner = null">✕</button>
      </div>
    </transition>

    <div v-if="loading" class="center-msg">Loading...</div>
    <div v-else-if="!trip" class="center-msg">Trip not found.</div>

    <div v-else class="content">
      <!-- Trip code banner -->
      <div class="code-banner">
        <div>
          <p class="code-label">Trip Code</p>
          <p class="code-value">{{ trip.trip_code }}</p>
        </div>
        <button class="copy-btn" @click="copyCode">{{ copied ? 'Copied!' : 'Copy' }}</button>
      </div>

      <!-- Itinerary items -->
      <div class="items-section">
        <div class="section-header">
          <h2>Itinerary</h2>
          <button v-if="!showForm" class="add-btn" @click="showForm = true">+ Add</button>
        </div>

        <!-- Add / Edit form -->
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
            <button class="cancel-btn" @click="cancelForm">Cancel</button>
            <button
              class="save-btn"
              :disabled="!draft.title || !draft.date || !draft.startTime || saving"
              @click="saveItem"
            >
              {{ saving ? '...' : editingId ? 'Save' : 'Add' }}
            </button>
          </div>
        </div>

        <p v-if="trip.itinerary_items.length === 0 && !showForm" class="muted">
          No items yet. Add your first activity!
        </p>

        <ul class="item-list">
          <li
            v-for="item in trip.itinerary_items"
            :key="item.id"
            :class="['item-row', { active: isActive(item) }]"
          >
            <div class="item-info">
              <div class="item-title-row">
                <span class="item-title">{{ item.title }}</span>
                <span v-if="isActive(item)" class="active-badge">Live</span>
              </div>
              <span class="item-time">{{ formatItemTime(item) }}</span>
              <span v-if="item.notes" class="item-notes">{{ item.notes }}</span>
            </div>
            <div class="item-actions">
              <button class="icon-btn" @click="startEdit(item)">✎</button>
              <button class="icon-btn delete" @click="handleDelete(item.id)">✕</button>
            </div>

            <!-- Alert actions — only shown on active items -->
            <div v-if="isActive(item)" class="alert-actions">
              <button
                class="alert-btn soft"
                :disabled="!!sentAlerts[item.id]"
                @click="handleAlert(item, 'soft')"
              >
                🙋 Ready when you are
              </button>
              <button
                class="alert-btn hard"
                :disabled="!!sentAlerts[item.id]"
                @click="handleAlert(item, 'hard')"
              >
                🚨 Let's go NOW
              </button>
              <p v-if="sentAlerts[item.id]" class="alert-sent">Alert sent!</p>
            </div>
          </li>
        </ul>
      </div>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTripsStore } from '@/stores/trips'
import { useAlertsStore } from '@/stores/alerts'
import type { TripWithItems, ItineraryItem } from '@/stores/trips'
import type { Alert } from '@/stores/alerts'

const router = useRouter()
const route = useRoute()
const tripsStore = useTripsStore()
const alertsStore = useAlertsStore()

const trip = ref<TripWithItems | null>(null)
const loading = ref(true)
const errorMsg = ref('')
const copied = ref(false)
const showForm = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const alertBanner = ref<Alert | null>(null)
const sentAlerts = ref<Record<string, boolean>>({})
const now = ref(new Date())

let clockInterval: ReturnType<typeof setInterval>
let bannerTimeout: ReturnType<typeof setTimeout>

const draft = reactive({ title: '', date: '', startTime: '', endTime: '', notes: '' })

onMounted(async () => {
  try {
    trip.value = await tripsStore.fetchTrip(route.params.id as string)
    alertsStore.subscribe(trip.value.id, showAlertBanner)
  } catch {
    trip.value = null
  } finally {
    loading.value = false
  }

  clockInterval = setInterval(() => { now.value = new Date() }, 30000)
})

onUnmounted(() => {
  alertsStore.unsubscribe()
  clearInterval(clockInterval)
  clearTimeout(bannerTimeout)
})

function showAlertBanner(alert: Alert) {
  alertBanner.value = alert
  clearTimeout(bannerTimeout)
  bannerTimeout = setTimeout(() => { alertBanner.value = null }, 10000)
}

function isActive(item: ItineraryItem): boolean {
  const start = new Date(item.start_at)
  const end = item.end_at ? new Date(item.end_at) : null
  return now.value >= start && (end === null || now.value <= end)
}

async function handleAlert(item: ItineraryItem, type: 'soft' | 'hard') {
  if (!trip.value) return
  try {
    await alertsStore.sendAlert(trip.value.id, item.id, item.title, type)
    sentAlerts.value[item.id] = true
    setTimeout(() => { delete sentAlerts.value[item.id] }, 30000)
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to send alert'
  }
}

async function copyCode() {
  if (!trip.value) return
  await navigator.clipboard.writeText(trip.value.trip_code)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function cancelForm() {
  Object.assign(draft, { title: '', date: '', startTime: '', endTime: '', notes: '' })
  editingId.value = null
  showForm.value = false
}

function startEdit(item: ItineraryItem) {
  const start = new Date(item.start_at)
  const end = item.end_at ? new Date(item.end_at) : null
  draft.title = item.title
  draft.notes = item.notes ?? ''
  draft.date = start.toLocaleDateString('en-CA')
  draft.startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
  draft.endTime = end
    ? `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
    : ''
  editingId.value = item.id
  showForm.value = true
}

async function saveItem() {
  if (!trip.value) return
  errorMsg.value = ''
  saving.value = true

  const payload = {
    title: draft.title,
    notes: draft.notes || undefined,
    start_at: toISO(draft.date, draft.startTime),
    end_at: draft.endTime ? toISO(draft.date, draft.endTime) : undefined
  }

  try {
    if (editingId.value) {
      const updated = await tripsStore.updateItem(editingId.value, payload)
      const idx = trip.value.itinerary_items.findIndex((i) => i.id === editingId.value)
      if (idx !== -1) trip.value.itinerary_items[idx] = updated
    } else {
      const newItem = await tripsStore.addItem(trip.value.id, payload)
      trip.value.itinerary_items.push(newItem)
    }
    trip.value.itinerary_items.sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    )
    cancelForm()
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to save item'
  } finally {
    saving.value = false
  }
}

async function handleDelete(itemId: string) {
  if (!trip.value) return
  try {
    await tripsStore.deleteItem(itemId)
    trip.value.itinerary_items = trip.value.itinerary_items.filter((i) => i.id !== itemId)
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to delete item'
  }
}

function toISO(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}

function formatItemTime(item: ItineraryItem) {
  const start = new Date(item.start_at)
  const date = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const startStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (!item.end_at) return `${date} · ${startStr}`
  const endStr = new Date(item.end_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${startStr} – ${endStr}`
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

/* Alert banner */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  margin: 0.75rem 1rem 0;
  border-radius: 12px;
  font-size: 0.9rem;
}

.alert-banner.soft {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.alert-banner.hard {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.alert-banner-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.alert-banner-text {
  flex: 1;
}

.alert-banner-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem;
}

.banner-enter-active,
.banner-leave-active {
  transition: all 0.3s ease;
}

.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.code-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #eff6ff;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.code-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #3b82f6;
  font-weight: 600;
}

.code-value {
  font-size: 1.5rem;
  font-family: monospace;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #1d4ed8;
}

.copy-btn {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
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

.time-row input { flex: 1; }

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

.save-btn:disabled { opacity: 0.4; }

.item-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-row {
  background: #f9fafb;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.item-row.active {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.item-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-title {
  font-weight: 600;
  font-size: 0.9rem;
}

.active-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #16a34a;
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.item-time {
  font-size: 0.8rem;
  color: #6b7280;
}

.item-notes {
  font-size: 0.8rem;
  color: #9ca3af;
}

.item-actions {
  display: flex;
  gap: 0.25rem;
}

.icon-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.35rem;
}

.icon-btn.delete:hover { color: #dc2626; }

/* Alert actions */
.alert-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #bbf7d0;
}

.alert-btn {
  width: 100%;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.alert-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.alert-btn.soft {
  background: #eff6ff;
  color: #1d4ed8;
}

.alert-btn.hard {
  background: #dc2626;
  color: white;
}

.alert-sent {
  font-size: 0.8rem;
  color: #16a34a;
  text-align: center;
}

.center-msg {
  display: flex;
  justify-content: center;
  padding: 3rem;
  color: #9ca3af;
}

.muted {
  color: #9ca3af;
  font-size: 0.875rem;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
}
</style>
