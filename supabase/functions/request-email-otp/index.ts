import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseSender, sendTransactionalEmail } from '../_shared/emailProvider.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_PER_EMAIL_PER_HOUR = 3
const MAX_PER_IP_PER_HOUR = 10

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

function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  return forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

function escapeHtml(value: string) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function emailBody(otp: string, salonName: string) {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
      <h1 style="font-size: 20px; margin: 0 0 12px;">Your verification code</h1>
      <p style="margin: 0 0 20px; color: #555;">Use this code to complete your ${escapeHtml(salonName)} booking. It expires in 5 minutes.</p>
      <div style="font-size: 34px; font-weight: 700; letter-spacing: 10px; text-align: center; padding: 18px 0; background: #f6f4f1; border-radius: 10px;">
        ${escapeHtml(otp)}
      </div>
      <p style="color: #888; font-size: 12px; margin-top: 28px;">If you did not request this, ignore this email.</p>
    </div>
  `
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { email, honeypot } = await request.json()

    if (honeypot) {
      return Response.json({ ok: true, otpId: 'bot' }, { headers: corsHeaders })
    }

    const normalizedEmail = normalizeEmail(email)
    const ip = clientIp(request)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, getSecretKey())

    const sinceIso = new Date(Date.now() - 60 * 60_000).toISOString()

    const [emailCountResult, ipCountResult] = await Promise.all([
      supabase
        .from('otp_rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('email', normalizedEmail)
        .gte('created_at', sinceIso),
      supabase
        .from('otp_rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('ip', ip)
        .gte('created_at', sinceIso),
    ])

    if ((emailCountResult.count ?? 0) >= MAX_PER_EMAIL_PER_HOUR) {
      return Response.json(
        { ok: false, code: 'RATE_LIMIT_EMAIL', message: 'Too many code requests for this email. Try again in an hour.' },
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
    const otpHash = await sha256(`${normalizedEmail}:${otp}:${Deno.env.get('OTP_PEPPER')}`)

    const { data: verification, error } = await supabase.from('otp_verifications').insert({
      email: normalizedEmail,
      phone: normalizedEmail,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    }).select('id').single()
    if (error) throw error

    await supabase.from('otp_rate_limits').insert({ email: normalizedEmail, ip })

    if (Deno.env.get('DEVELOPMENT_OTP_MODE') === 'true') {
      return Response.json({ ok: true, otpId: verification.id, developmentCode: otp }, { headers: corsHeaders })
    }

    const { data: businessRow } = await supabase
      .from('business_settings')
      .select('salon_name')
      .limit(1)
      .maybeSingle()
    const salonName = businessRow?.salon_name ?? 'Vishal Mens Parlour'
    const { fromEmail, fromName } = parseSender(salonName)

    await sendTransactionalEmail({
      to: normalizedEmail,
      subject: `Your verification code — ${otp}`,
      html: emailBody(otp, salonName),
      fromEmail,
      fromName,
    })

    return Response.json({ ok: true, otpId: verification.id }, { headers: corsHeaders })
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error)
    console.error('request-email-otp error:', raw)
    const map: Record<string, string> = {
      INVALID_EMAIL: 'Please enter a valid email address.',
      EMAIL_PROVIDER_NOT_CONFIGURED: 'Email delivery is not configured on the server.',
      BREVO_401: 'Email provider rejected the API key. Please check BREVO_API_KEY.',
      BREVO_400: 'Email provider rejected the sender. Verify EMAIL_FROM matches a verified Brevo sender.',
      BREVO_402: 'Daily email quota reached. Try again tomorrow or upgrade the plan.',
      RESEND_401: 'Email provider rejected the API key. Please check RESEND_API_KEY.',
      RESEND_403: 'Email provider blocked the recipient. Verify your domain in Resend or switch to Brevo.',
    }
    const key = Object.keys(map).find((k) => raw.includes(k))
    return Response.json(
      { ok: false, message: key ? map[key] : `We could not send that code. (${raw.slice(0, 200)})` },
      { status: 400, headers: corsHeaders },
    )
  }
})
