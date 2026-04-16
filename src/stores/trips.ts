import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Trip, ItineraryItem, TripWithItems } from '@/types'

export type { Trip, ItineraryItem, TripWithItems }

export interface ItemDraft {
  title: string
  notes?: string
  start_at: string
  end_at?: string
}

function generateTripCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars (0/O, 1/I)
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export const useTripsStore = defineStore('trips', () => {
  const myTrips = ref<Trip[]>([])

  async function fetchMyTrips() {
    const auth = useAuthStore()
    const { data, error } = await supabase
      .from('trip_members')
      .select('trips(*)')
      .eq('user_id', auth.user!.id)
      .order('joined_at', { ascending: false })

    if (error) throw error
    myTrips.value = (data ?? []).map((d: { trips: Trip }) => d.trips)
    return myTrips.value
  }

  async function fetchTrip(tripId: string): Promise<TripWithItems> {
    const { data, error } = await supabase
      .from('trips')
      .select('*, itinerary_items(*)')
      .eq('id', tripId)
      .single()

    if (error) throw error
    const trip = data as TripWithItems
    trip.itinerary_items.sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    )
    return trip
  }

  async function createTrip(name: string, items: ItemDraft[]): Promise<Trip> {
    const auth = useAuthStore()
    const tripCode = generateTripCode()

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({ name, trip_code: tripCode, created_by: auth.user!.id })
      .select()
      .single()

    if (error) throw error

    await supabase
      .from('trip_members')
      .insert({ trip_id: trip.id, user_id: auth.user!.id })

    if (items.length > 0) {
      await supabase
        .from('itinerary_items')
        .insert(items.map((item) => ({ ...item, trip_id: trip.id })))
    }

    return trip as Trip
  }

  async function joinTrip(code: string): Promise<Trip> {
    const auth = useAuthStore()

    const { data: trip, error } = await supabase
      .from('trips')
      .select()
      .eq('trip_code', code.toUpperCase().trim())
      .single()

    if (error || !trip) throw new Error('Trip not found. Check the code and try again.')

    const { error: memberError } = await supabase
      .from('trip_members')
      .insert({ trip_id: trip.id, user_id: auth.user!.id })

    // code 23505 = unique violation (already a member) — that's fine
    if (memberError && memberError.code !== '23505') throw memberError

    return trip as Trip
  }

  async function addItem(tripId: string, item: ItemDraft): Promise<ItineraryItem> {
    const { data, error } = await supabase
      .from('itinerary_items')
      .insert({ ...item, trip_id: tripId })
      .select()
      .single()

    if (error) throw error
    return data as ItineraryItem
  }

  async function updateItem(itemId: string, updates: Partial<ItemDraft>): Promise<ItineraryItem> {
    const { data, error } = await supabase
      .from('itinerary_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error
    return data as ItineraryItem
  }

  async function deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase.from('itinerary_items').delete().eq('id', itemId)
    if (error) throw error
  }

  return { myTrips, fetchMyTrips, fetchTrip, createTrip, joinTrip, addItem, updateItem, deleteItem }
})
