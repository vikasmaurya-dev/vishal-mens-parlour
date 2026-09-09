import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseSender, sendTransactionalEmail } from '../_shared/emailProvider.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getSecretKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (secretKeys) return JSON.parse(secretKeys).default as string
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
}

interface Payload {
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  startAt: string
  endAt: string
  serviceId: string
}

function formatWhen(iso: string, timezone: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function customerHtml(payload: Payload, serviceName: string, salonName: string, when: string, manageUrl?: string) {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
      <h1 style="font-size: 22px; margin: 0 0 8px;">Booking confirmed 🎉</h1>
      <p style="margin: 0 0 24px; color: #555;">Thanks ${escapeHtml(payload.customerName)}, we've reserved your slot at ${escapeHtml(salonName)}.</p>
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; color: #666;">Reference</td><td style="padding: 8px 0;"><strong>${escapeHtml(payload.bookingReference)}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Service</td><td style="padding: 8px 0;">${escapeHtml(serviceName)}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">When</td><td style="padding: 8px 0;">${escapeHtml(when)}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Phone</td><td style="padding: 8px 0;">${escapeHtml(payload.customerPhone)}</td></tr>
      </table>
      ${manageUrl ? `<p style="margin: 24px 0;"><a href="${manageUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">Reschedule or cancel</a></p>` : ''}
      <p style="color: #888; font-size: 13px; margin-top: 32px;">If you have any questions just reply to this email.</p>
    </div>
  `
}

function ownerHtml(payload: Payload, serviceName: string, salonName: string, when: string) {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 20px; margin: 0 0 8px;">New booking — ${escapeHtml(salonName)}</h1>
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #666;">Reference</td><td style="padding: 6px 0;"><strong>${escapeHtml(payload.bookingReference)}</strong></td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Customer</td><td style="padding: 6px 0;">${escapeHtml(payload.customerName)}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Phone</td><td style="padding: 6px 0;">${escapeHtml(payload.customerPhone)}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;">${escapeHtml(payload.customerEmail || '—')}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Service</td><td style="padding: 6px 0;">${escapeHtml(serviceName)}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">When</td><td style="padding: 6px 0;">${escapeHtml(when)}</td></tr>
      </table>
    </div>
  `
}

function escapeHtml(value: string) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

async function generateManageUrl(supabase: ReturnType<typeof createClient>, bookingReference: string) {
  const secret = Deno.env.get('MANAGE_LINK_SECRET')
  const siteUrl = Deno.env.get('PUBLIC_SITE_URL')
  if (!secret || !siteUrl) return undefined
  await supabase.rpc('set_manage_link_secret', { p_secret: secret })
  const { data } = await supabase.rpc('sign_manage_token', { p_booking_reference: bookingReference })
  const token = typeof data === 'string' ? data : data?.token
  if (!token) return undefined
  return `${siteUrl.replace(/\/$/, '')}/manage-booking?ref=${encodeURIComponent(bookingReference)}&token=${encodeURIComponent(token)}`
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const payload = (await request.json()) as Payload
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, getSecretKey())

    const [{ data: serviceRow }, { data: businessRow }] = await Promise.all([
      supabase.from('services').select('name').eq('id', payload.serviceId).maybeSingle(),
      supabase.from('business_settings').select('salon_name, email, timezone').limit(1).maybeSingle(),
    ])

    const serviceName = serviceRow?.name ?? 'Selected Service'
    const salonName = businessRow?.salon_name ?? 'Vishal Mens Parlour'
    const timezone = businessRow?.timezone ?? 'Asia/Kolkata'
    const when = formatWhen(payload.startAt, timezone)
    const { fromEmail, fromName } = parseSender(salonName)
    const ownerEmail = Deno.env.get('OWNER_NOTIFICATION_EMAIL') ?? businessRow?.email ?? ''

    const manageUrl = await generateManageUrl(supabase, payload.bookingReference).catch(() => undefined)

    const results: Record<string, unknown> = {}

    if (payload.customerEmail) {
      results.customer = await sendTransactionalEmail({
        to: payload.customerEmail,
        subject: `Your booking is confirmed — ${payload.bookingReference}`,
        html: customerHtml(payload, serviceName, salonName, when, manageUrl),
        fromEmail,
        fromName,
      }).catch((error) => ({ error: String(error) }))
    }

    if (ownerEmail) {
      results.owner = await sendTransactionalEmail({
        to: ownerEmail,
        subject: `New booking — ${payload.customerName} (${payload.bookingReference})`,
        html: ownerHtml(payload, serviceName, salonName, when),
        fromEmail,
        fromName,
      }).catch((error) => ({ error: String(error) }))
    }

    return Response.json({ ok: true, results }, { headers: corsHeaders })
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : 'send-booking-emails failed' },
      { status: 500, headers: corsHeaders },
    )
  }
})
