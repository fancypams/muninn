<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="router.push({ name: 'home' })">‹ Back</button>
      <h1 class="page-title">{{ trip?.name ?? '...' }}</h1>
      <div style="width: 72px" />
    </header>

    <!-- Incoming alert banner -->
    <transition name="banner">
      <div v-if="alertBanner" :class="['alert-banner', alertBanner.type]">
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
      <!-- Trip code card -->
      <div class="code-card">
        <div>
          <p class="code-label">Trip Code</p>
          <p class="code-value">{{ trip.trip_code }}</p>
        </div>
        <button class="copy-btn" @click="copyCode">{{ copied ? 'Copied!' : 'Copy' }}</button>
      </div>

      <!-- Itinerary -->
      <div class="items-section">
        <div class="section-header">
          <h2 class="section-label">Itinerary</h2>
          <button v-if="!showForm" class="add-btn" @click="showForm = true">+ Add</button>
        </div>

        <!-- Add / Edit form -->
        <div v-if="showForm" class="item-form">
          <p class="form-section-label">{{ editingId ? 'Edit Activity' : 'New Activity' }}</p>
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
            :class="['item-card', { active: isActive(item) }]"
          >
            <div class="item-main">
              <div class="item-info">
                <div class="item-title-row">
                  <span class="item-title">{{ item.title }}</span>
                  <span v-if="isActive(item)" class="live-badge">LIVE</span>
                </div>
                <span class="item-time">{{ formatItemTime(item) }}</span>
                <span v-if="item.notes" class="item-notes">{{ item.notes }}</span>
              </div>
              <div class="item-actions">
                <button class="icon-btn" @click="startEdit(item)">✎</button>
                <button class="icon-btn delete" @click="handleDelete(item.id)">✕</button>
              </div>
            </div>

            <!-- Alert actions — only shown on active items -->
            <div v-if="isActive(item)" class="alert-actions">
              <button
                class="soft-alert-btn"
                :disabled="!!sentAlerts[item.id]"
                @click="handleAlert(item, 'soft')"
              >
                <span class="soft-icon">⊙</span>
                Ready when you are
              </button>
              <button
                class="hard-alert-btn"
                :disabled="!!sentAlerts[item.id]"
                @click="handleAlert(item, 'hard')"
              >
                Let's go NOW
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

/* Alert banner */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  margin: 0 1.25rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}

.alert-banner.soft {
  background: #FFF8E8;
  border: 1px solid #F0D98A;
}

.alert-banner.hard {
  background: #FFF2F2;
  border: 1px solid #FFCACA;
}

.alert-banner-text {
  flex: 1;
}

.alert-banner-close {
  background: none;
  border: none;
  color: var(--text-muted);
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
  padding: 0 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Trip code card */
.code-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--dark);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
}

.code-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--gold);
  margin-bottom: 0.25rem;
}

.code-value {
  font-size: 1.75rem;
  font-family: monospace;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--gold);
}

.copy-btn {
  padding: 0.45rem 1rem;
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.8);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.copy-btn:hover {
  background: rgba(255,255,255,0.2);
}

/* Items section */
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
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

/* Item form */
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

/* Item cards */
.item-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.item-card {
  background: var(--surface);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--border);
  overflow: hidden;
}

.item-card.active {
  border-color: var(--border);
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
  min-width: 0;
}

.item-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.live-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: var(--green);
  color: white;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-pill);
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

.item-actions {
  display: flex;
  gap: 0.125rem;
  flex-shrink: 0;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.35rem;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.icon-btn:hover { opacity: 1; }
.icon-btn.delete:hover { color: #dc2626; }

/* Alert actions */
.alert-actions {
  border-top: 1.5px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0;
}

.soft-alert-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gold);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.soft-alert-btn:hover {
  background: rgba(201, 148, 10, 0.06);
}

.soft-alert-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.soft-icon {
  font-size: 1rem;
  opacity: 0.8;
}

.hard-alert-btn {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--dark);
  color: var(--gold);
  border: none;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  text-align: center;
  transition: opacity 0.15s;
}

.hard-alert-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.alert-sent {
  font-size: 0.8rem;
  color: var(--green);
  text-align: center;
  padding: 0.5rem;
}

.center-msg {
  display: flex;
  justify-content: center;
  padding: 3rem;
  color: var(--text-muted);
}

.muted {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
}
</style>
