import { hasSupabaseConfig, supabase } from '../lib/supabase'

interface ManageBooking {
  booking_reference: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  start_at: string
  end_at: string
  service_id: string
  service_name: string
  duration_minutes: number
}

async function invoke(action: string, bookingReference: string, token: string, extra: Record<string, unknown> = {}) {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error('Manage-booking is not available in demo mode.')
  }
  const { data, error } = await supabase.functions.invoke('manage-booking', {
    body: { action, bookingReference, token, ...extra },
  })
  if (error || !data?.ok) throw new Error(data?.message ?? 'Could not process this request.')
  return data
}

export async function fetchManageBooking(bookingReference: string, token: string) {
  const data = await invoke('get', bookingReference, token)
  return data.booking as ManageBooking | null
}

export async function cancelBooking(bookingReference: string, token: string) {
  await invoke('cancel', bookingReference, token)
}

export async function rescheduleBooking(bookingReference: string, token: string, newStartAt: string) {
  const data = await invoke('reschedule', bookingReference, token, { newStartAt })
  return data.rescheduled as { booking_reference: string; start_at: string; end_at: string }
}

export type { ManageBooking }
