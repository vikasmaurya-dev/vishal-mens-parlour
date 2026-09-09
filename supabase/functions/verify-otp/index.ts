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

function normalizeEmail(value: string) {
  const trimmed = String(value ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) throw new Error('INVALID_EMAIL')
  return trimmed
}

function getSecretKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (secretKeys) return JSON.parse(secretKeys).default as string
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { email, code } = await request.json()
    const normalizedEmail = normalizeEmail(email)
    if (!/^\d{4}$/.test(String(code))) throw new Error('INVALID_CODE')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, getSecretKey())
    const { data: verification, error: readError } = await supabase
      .from('otp_verifications')
      .select('id, otp_hash, expires_at, attempt_count')
      .eq('email', normalizedEmail)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (readError || !verification || new Date(verification.expires_at) <= new Date() || verification.attempt_count >= 5) {
      throw new Error('OTP_INVALID')
    }

    const expectedHash = await sha256(`${normalizedEmail}:${code}:${Deno.env.get('OTP_PEPPER')}`)
    if (expectedHash !== verification.otp_hash) {
      await supabase.from('otp_verifications').update({ attempt_count: verification.attempt_count + 1 }).eq('id', verification.id)
      throw new Error('OTP_INVALID')
    }

    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id)
      .is('used_at', null)
    if (updateError) throw updateError
    return Response.json({ ok: true, otpId: verification.id }, { headers: corsHeaders })
  } catch {
    return Response.json({ ok: false, message: 'That verification code is invalid or expired.' }, { status: 400, headers: corsHeaders })
  }
})
