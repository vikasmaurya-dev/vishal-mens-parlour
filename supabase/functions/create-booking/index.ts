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

function classifyError(raw: string): { code: string; message: string; status: number } {
  if (raw.includes('SLOT_UNAVAILABLE')) {
    return { code: 'SLOT_UNAVAILABLE', message: 'That appointment time is no longer available.', status: 409 }
  }
  if (raw.includes('OTP_NOT_VERIFIED')) {
    return { code: 'OTP_NOT_VERIFIED', message: 'Your verification code has expired or was already used.', status: 400 }
  }
  if (raw.includes('SERVICE_NOT_BOOKABLE')) {
    return { code: 'SERVICE_NOT_BOOKABLE', message: 'This service is not currently bookable online.', status: 400 }
  }
  return { code: 'UNKNOWN', message: 'We could not create the booking. Please try again.', status: 500 }
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
    const confirmation = data?.[0]

    // Fire-and-forget email notifications (customer + owner).
    // Failures here must not block the booking response.
    try {
      await supabase.functions.invoke('send-booking-emails', {
        body: {
          bookingReference: confirmation?.booking_reference,
          customerName: payload.fullName,
          customerEmail: payload.email ?? '',
          customerPhone: payload.phone,
          startAt: confirmation?.start_at,
          endAt: confirmation?.end_at,
          serviceId: payload.serviceId,
        },
      })
    } catch (_emailError) {
      // Log-only; do not surface to the client.
    }

    return Response.json({ ok: true, confirmation }, { headers: corsHeaders })
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error)
    const { code, message, status } = classifyError(raw)
    return Response.json({ ok: false, code, message }, { status, headers: corsHeaders })
  }
})
