export interface Trip {
  id: string
  name: string
  trip_code: string
  created_by: string
  created_at: string
}

export interface ItineraryItem {
  id: string
  trip_id: string
  title: string
  notes?: string | null
  start_at: string
  end_at?: string | null
  created_at: string
}

export interface TripWithItems extends Trip {
  itinerary_items: ItineraryItem[]
}
