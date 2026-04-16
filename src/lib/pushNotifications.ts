import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from './supabase'
import { useAuthStore } from '@/stores/auth'

export async function registerPushNotifications() {
  const { receive } = await PushNotifications.requestPermissions()
  if (receive !== 'granted') return

  await PushNotifications.register()

  PushNotifications.addListener('registration', async (token) => {
    const auth = useAuthStore()
    if (!auth.user) return

    await supabase.from('push_tokens').upsert(
      { user_id: auth.user.id, token: token.value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  })

  PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error:', err)
  })
}
