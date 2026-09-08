import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return `+${digits}`
  throw new Error('INVALID_PHONE')
}

function getSecretKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (secretKeys) return JSON.parse(secretKeys).default as string
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { phone } = await request.json()
    const normalizedPhone = normalizePhone(phone)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, getSecretKey())
    const otp = crypto.getRandomValues(new Uint32Array(1))[0].toString().slice(-4).padStart(4, '0')
    const otpHash = await sha256(`${normalizedPhone}:${otp}:${Deno.env.get('OTP_PEPPER')}`)

    const { data: verification, error } = await supabase.from('otp_verifications').insert({
      phone: normalizedPhone,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    }).select('id').single()
    if (error) throw error

    if (Deno.env.get('DEVELOPMENT_OTP_MODE') === 'true') {
      return Response.json({ ok: true, otpId: verification.id, developmentCode: otp }, { headers: corsHeaders })
    }

    await sendOtp(normalizedPhone, otp)
    return Response.json({ ok: true, otpId: verification.id }, { headers: corsHeaders })
  } catch {
    return Response.json({ ok: false, message: 'We could not send that code. Please try again.' }, { status: 400, headers: corsHeaders })
  }
})

async function sendOtp(phone: string, otp: string) {
  const provider = Deno.env.get('SMS_PROVIDER')
  if (provider === 'mock') return
  if (provider === 'http') {
    await fetch(Deno.env.get('SMS_PROVIDER_URL')!, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${Deno.env.get('SMS_PROVIDER_API_KEY')}`,
      },
      body: JSON.stringify({ phone, message: `Your Vishal Mens Parlour verification code is ${otp}` }),
    })
    return
  }
  throw new Error('SMS_PROVIDER_NOT_CONFIGURED')
}
