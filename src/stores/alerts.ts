import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export interface Alert {
  id: string
  trip_id: string
  item_id: string
  sent_by: string
  sender_email: string
  type: 'soft' | 'hard'
  created_at: string
}

export const useAlertsStore = defineStore('alerts', () => {
  const incomingAlert = ref<Alert | null>(null)
  let channel: RealtimeChannel | null = null

  async function sendAlert(
    tripId: string,
    itemId: string,
    itemTitle: string,
    type: 'soft' | 'hard'
  ) {
    const auth = useAuthStore()

    const { data, error } = await supabase
      .from('alerts')
      .insert({
        trip_id: tripId,
        item_id: itemId,
        sent_by: auth.user!.id,
        sender_email: auth.user!.email,
        type
      })
      .select()
      .single()

    if (error) throw error

    if (type === 'hard') {
      await supabase.functions.invoke('send-push', {
        body: {
          alert_id: data.id,
          trip_id: tripId,
          sent_by: auth.user!.id,
          sender_email: auth.user!.email,
          item_title: itemTitle
        }
      })
    }

    return data as Alert
  }

  function subscribe(tripId: string, onAlert: (alert: Alert) => void) {
    const auth = useAuthStore()

    channel = supabase
      .channel(`alerts:${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          const alert = payload.new as Alert
          if (alert.sent_by !== auth.user?.id) {
            onAlert(alert)
          }
        }
      )
      .subscribe()
  }

  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    incomingAlert.value = null
  }

  return { incomingAlert, sendAlert, subscribe, unsubscribe }
})
