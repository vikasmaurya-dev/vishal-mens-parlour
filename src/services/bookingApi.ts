import { hasSupabaseConfig, supabase } from '../lib/supabase'

export async function requestBookingOtp(phone: string) {
  if (!hasSupabaseConfig || !supabase) return { otpId: 'local-demo', developmentCode: '1234' }
  const { data, error } = await supabase.functions.invoke('request-otp', { body: { phone } })
  if (error || !data?.ok) throw new Error(data?.message ?? 'We could not send that code.')
  return data as { otpId: string; developmentCode?: string }
}

export async function verifyBookingOtp(phone: string, code: string) {
  if (!hasSupabaseConfig || !supabase) return { otpId: 'local-demo' }
  const { data, error } = await supabase.functions.invoke('verify-otp', { body: { phone, code } })
  if (error || !data?.ok) throw new Error(data?.message ?? 'That verification code is invalid or expired.')
  return data as { otpId: string }
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
  if (error || !data?.ok) throw new Error(data?.message ?? 'We could not create the booking.')
  return data.confirmation as { booking_reference: string }
}
