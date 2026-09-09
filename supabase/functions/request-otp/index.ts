import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_PER_PHONE_PER_HOUR = 3
const MAX_PER_IP_PER_HOUR = 10

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

function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  return forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { phone, honeypot } = await request.json()
    // Silent-succeed on bot honeypot fill so scrapers get no signal.
    if (honeypot) {
      return Response.json({ ok: true, otpId: 'bot' }, { headers: corsHeaders })
    }

    const normalizedPhone = normalizePhone(phone)
    const ip = clientIp(request)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, getSecretKey())

    const sinceIso = new Date(Date.now() - 60 * 60_000).toISOString()

    const [phoneCountResult, ipCountResult] = await Promise.all([
      supabase
        .from('otp_rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('phone', normalizedPhone)
        .gte('created_at', sinceIso),
      supabase
        .from('otp_rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('ip', ip)
        .gte('created_at', sinceIso),
    ])

    if ((phoneCountResult.count ?? 0) >= MAX_PER_PHONE_PER_HOUR) {
      return Response.json(
        { ok: false, code: 'RATE_LIMIT_PHONE', message: 'Too many code requests for this number. Try again in an hour.' },
        { status: 429, headers: corsHeaders },
      )
    }
    if ((ipCountResult.count ?? 0) >= MAX_PER_IP_PER_HOUR) {
      return Response.json(
        { ok: false, code: 'RATE_LIMIT_IP', message: 'Too many requests from this device. Try again later.' },
        { status: 429, headers: corsHeaders },
      )
    }

    const otp = crypto.getRandomValues(new Uint32Array(1))[0].toString().slice(-4).padStart(4, '0')
    const otpHash = await sha256(`${normalizedPhone}:${otp}:${Deno.env.get('OTP_PEPPER')}`)

    const { data: verification, error } = await supabase.from('otp_verifications').insert({
      phone: normalizedPhone,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    }).select('id').single()
    if (error) throw error

    await supabase.from('otp_rate_limits').insert({ phone: normalizedPhone, ip })

    if (Deno.env.get('DEVELOPMENT_OTP_MODE') === 'true') {
      return Response.json({ ok: true, otpId: verification.id, developmentCode: otp }, { headers: corsHeaders })
    }

    await sendOtp(normalizedPhone, otp)
    return Response.json({ ok: true, otpId: verification.id }, { headers: corsHeaders })
  } catch (error) {
    const message = error instanceof Error && error.message === 'INVALID_PHONE'
      ? 'Enter a valid Indian mobile number.'
      : 'We could not send that code. Please try again.'
    return Response.json({ ok: false, message }, { status: 400, headers: corsHeaders })
  }
})

async function sendOtp(phone: string, otp: string) {
  const provider = Deno.env.get('SMS_PROVIDER')
  if (provider === 'mock') return
  if (provider === 'msg91') {
    // MSG91 Flow API — template-based OTP delivery for Indian numbers.
    // Docs: https://docs.msg91.com/reference/send-sms-with-otp
    const templateId = Deno.env.get('MSG91_TEMPLATE_ID')
    const authKey = Deno.env.get('MSG91_AUTH_KEY')
    if (!templateId || !authKey) throw new Error('MSG91_NOT_CONFIGURED')
    const recipient = phone.replace('+', '')
    await fetch('https://control.msg91.com/api/v5/flow', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify({
        template_id: templateId,
        short_url: '0',
        recipients: [{ mobiles: recipient, otp }],
      }),
    })
    return
  }
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
