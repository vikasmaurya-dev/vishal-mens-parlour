import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getSecretKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (secretKeys) return JSON.parse(secretKeys).default as string
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
}

async function withSecret<T>(supabase: ReturnType<typeof createClient>, fn: () => Promise<T>) {
  const secret = Deno.env.get('MANAGE_LINK_SECRET')
  if (!secret) throw new Error('MANAGE_LINK_SECRET_NOT_CONFIGURED')
  const { error } = await supabase.rpc('set_manage_link_secret', { p_secret: secret })
  if (error) throw error
  return fn()
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { action, bookingReference, token, newStartAt } = await request.json()
    if (!bookingReference || !token) throw new Error('MISSING_INPUT')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, getSecretKey())

    const result = await withSecret(supabase, async () => {
      if (action === 'get') {
        const { data, error } = await supabase.rpc('get_manage_booking', {
          p_booking_reference: bookingReference,
          p_token: token,
        })
        if (error) throw error
        return { booking: data?.[0] ?? null }
      }
      if (action === 'cancel') {
        const { error } = await supabase.rpc('cancel_booking_via_token', {
          p_booking_reference: bookingReference,
          p_token: token,
        })
        if (error) throw error
        return { cancelled: true }
      }
      if (action === 'reschedule') {
        if (!newStartAt) throw new Error('MISSING_START')
        const { data, error } = await supabase.rpc('reschedule_booking_via_token', {
          p_booking_reference: bookingReference,
          p_token: token,
          p_new_start_at: newStartAt,
        })
        if (error) throw error
        return { rescheduled: data?.[0] ?? null }
      }
      throw new Error('UNKNOWN_ACTION')
    })

    return Response.json({ ok: true, ...result }, { headers: corsHeaders })
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error)
    const map: Record<string, { status: number; message: string }> = {
      INVALID_TOKEN: { status: 403, message: 'This link is invalid or has expired.' },
      BOOKING_NOT_FOUND: { status: 404, message: 'Booking not found.' },
      ALREADY_FINALIZED: { status: 409, message: 'This booking is no longer active.' },
      SLOT_UNAVAILABLE: { status: 409, message: 'That new time is no longer available.' },
      MANAGE_LINK_SECRET_NOT_CONFIGURED: { status: 500, message: 'Manage-booking is not configured on the server.' },
    }
    const key = Object.keys(map).find((k) => raw.includes(k))
    const fallback = { status: 400, message: 'Could not process this request.' }
    const chosen = key ? map[key] : fallback
    return Response.json({ ok: false, code: key ?? 'UNKNOWN', message: chosen.message }, { status: chosen.status, headers: corsHeaders })
  }
})
