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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const payload = await request.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, getSecretKey())
    const { data, error } = await supabase.rpc('create_guest_booking', {
      p_otp_id: payload.otpId,
      p_customer_name: payload.fullName,
      p_phone: payload.phone,
      p_email: payload.email ?? '',
      p_service_id: payload.serviceId,
      p_staff_id: payload.staffId ?? null,
      p_start_at: payload.startAt,
      p_notes: payload.notes ?? '',
    })
    if (error) throw error
    return Response.json({ ok: true, confirmation: data?.[0] }, { headers: corsHeaders })
  } catch (error) {
    const message = error instanceof Error && error.message.includes('SLOT_UNAVAILABLE')
      ? 'That appointment time is no longer available.'
      : 'We could not create the booking. Please try again.'
    return Response.json({ ok: false, message }, { status: 400, headers: corsHeaders })
  }
})
