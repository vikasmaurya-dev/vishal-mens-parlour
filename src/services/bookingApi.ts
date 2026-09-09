import { hasSupabaseConfig, supabase } from '../lib/supabase'

async function readFunctionsError(error: unknown, fallback: string): Promise<Error> {
  // Supabase-js wraps non-2xx as FunctionsHttpError. The real JSON body is
  // stashed on `error.context.response` — read it so users see the real reason.
  const context = (error as { context?: { response?: Response } })?.context
  if (context?.response) {
    try {
      const body = await context.response.clone().json()
      if (typeof body?.message === 'string') return new Error(body.message)
    } catch {
      // fall through
    }
  }
  if (error instanceof Error && error.message) return new Error(error.message)
  return new Error(fallback)
}

export async function requestEmailBookingOtp(email: string, honeypot?: string) {
  if (!hasSupabaseConfig || !supabase) return { otpId: 'local-demo', developmentCode: '1234' }
  const { data, error } = await supabase.functions.invoke('request-email-otp', { body: { email, honeypot } })
  if (error) throw await readFunctionsError(error, 'We could not send that code.')
  if (!data?.ok) throw new Error(data?.message ?? 'We could not send that code.')
  return data as { otpId: string; developmentCode?: string }
}

export async function verifyEmailBookingOtp(email: string, code: string) {
  if (!hasSupabaseConfig || !supabase) return { otpId: 'local-demo' }
  const { data, error } = await supabase.functions.invoke('verify-otp', { body: { email, code } })
  if (error) throw await readFunctionsError(error, 'That verification code is invalid or expired.')
  if (!data?.ok) throw new Error(data?.message ?? 'That verification code is invalid or expired.')
  return data as { otpId: string }
}

const BOOKING_ERROR_MESSAGES: Record<string, string> = {
  SLOT_UNAVAILABLE: 'That appointment time is no longer available. Please pick another slot.',
  OTP_NOT_VERIFIED: 'Your verification code has expired. Please request a new one.',
  SERVICE_NOT_BOOKABLE: 'This service is not currently available for online booking.',
  EMAIL_REQUIRED: 'Email is required to complete this booking.',
}

export async function createBooking(payload: {
  otpId: string
  fullName: string
  phone: string
  email: string
  serviceId: string
  startAt: string
  notes: string
}) {
  if (!hasSupabaseConfig || !supabase) return { booking_reference: `VMP-${Math.floor(1000 + Math.random() * 9000)}` }
  const { data, error } = await supabase.functions.invoke('create-booking', { body: payload })
  if (error) throw await readFunctionsError(error, 'We could not create the booking.')
  if (!data?.ok) {
    const code = data?.code as string | undefined
    throw new Error(BOOKING_ERROR_MESSAGES[code ?? ''] ?? data?.message ?? 'We could not create the booking.')
  }
  return data.confirmation as { booking_reference: string }
}
