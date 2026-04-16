// Supabase Edge Function: send-push
// Sends APNs push notifications for hard alerts.
//
// Required secrets (set via: supabase secrets set KEY=value):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   APNS_KEY_ID        - Key ID from Apple Developer portal
//   APNS_TEAM_ID       - Your Apple Developer Team ID
//   APNS_PRIVATE_KEY   - Contents of the .p8 file (including header/footer lines)
//   APP_BUNDLE_ID      - e.g. com.muninn.app
//   APNS_ENV           - "sandbox" (dev) or "production"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { alert_id, trip_id, sent_by, sender_email, item_title } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get push tokens for all trip members except the sender
    const { data: members } = await supabase
      .from('trip_members')
      .select('user_id')
      .eq('trip_id', trip_id)
      .neq('user_id', sent_by)

    if (!members || members.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders })
    }

    const userIds = members.map((m: { user_id: string }) => m.user_id)

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds)

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders })
    }

    const jwt = await createAPNsJWT(
      Deno.env.get('APNS_TEAM_ID')!,
      Deno.env.get('APNS_KEY_ID')!,
      Deno.env.get('APNS_PRIVATE_KEY')!
    )

    const env = Deno.env.get('APNS_ENV') === 'production' ? 'api' : 'api.sandbox'
    const bundleId = Deno.env.get('APP_BUNDLE_ID')!

    const results = await Promise.allSettled(
      tokens.map(({ token }: { token: string }) =>
        fetch(`https://${env}.push.apple.com/3/device/${token}`, {
          method: 'POST',
          headers: {
            authorization: `bearer ${jwt}`,
            'apns-topic': bundleId,
            'apns-push-type': 'alert',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            aps: {
              alert: {
                title: '🚨 Time to leave!',
                body: `${sender_email} wants to leave ${item_title} now`
              },
              sound: 'default',
              badge: 1
            },
            alert_id
          })
        })
      )
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent }), { headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders
    })
  }
})

async function createAPNsJWT(teamId: string, keyId: string, privateKeyPem: string): Promise<string> {
  const pemBody = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const header = encode({ alg: 'ES256', kid: keyId })
  const payload = encode({ iss: teamId, iat: Math.floor(Date.now() / 1000) })
  const unsigned = `${header}.${payload}`

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned)
  )

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${unsigned}.${sig}`
}
