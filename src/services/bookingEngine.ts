import type { Appointment, BlockedTime, BookingSettings, BusinessHour, Service } from '../types/domain'

const activeStatuses = new Set(['PENDING', 'CONFIRMED'])

export function normalizeIndianPhone(input: string) {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return `+${digits}`
  throw new Error('Enter a valid Indian mobile number.')
}

export function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA
}

function minutesOfDay(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function atLocalTime(date: Date, minutes: number) {
  const next = new Date(date)
  next.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return next
}

export function isSlotAvailable({
  startAt,
  service,
  businessHours,
  appointments,
  blockedTimes,
}: {
  startAt: Date
  service: Service
  businessHours: BusinessHour[]
  appointments: Appointment[]
  blockedTimes: BlockedTime[]
}) {
  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000)
  const day = businessHours.find((hour) => hour.weekday === startAt.getDay())
  if (!day?.isOpen) return false

  const startMinutes = startAt.getHours() * 60 + startAt.getMinutes()
  const endMinutes = endAt.getHours() * 60 + endAt.getMinutes()
  if (startMinutes < minutesOfDay(day.opensAt) || endMinutes > minutesOfDay(day.closesAt)) return false

  const appointmentConflict = appointments.some(
    (appointment) =>
      activeStatuses.has(appointment.status) &&
      overlaps(startAt, endAt, new Date(appointment.startAt), new Date(appointment.endAt)),
  )
  if (appointmentConflict) return false

  return !blockedTimes.some((block) => overlaps(startAt, endAt, new Date(block.startAt), new Date(block.endAt)))
}

export function generateSlots({
  date,
  service,
  businessHours,
  appointments,
  blockedTimes,
  settings,
  now = new Date(),
}: {
  date: Date
  service: Service
  businessHours: BusinessHour[]
  appointments: Appointment[]
  blockedTimes: BlockedTime[]
  settings: BookingSettings
  now?: Date
}) {
  const day = businessHours.find((hour) => hour.weekday === date.getDay())
  if (!day?.isOpen || !settings.bookingEnabled || !service.bookable || !service.active) return []

  const earliest = new Date(now.getTime() + settings.minimumNoticeMinutes * 60_000)
  const slots: Date[] = []
  for (
    let cursor = minutesOfDay(day.opensAt);
    cursor + service.durationMinutes <= minutesOfDay(day.closesAt);
    cursor += settings.slotIntervalMinutes
  ) {
    const startAt = atLocalTime(date, cursor)
    if (startAt < earliest) continue
    if (isSlotAvailable({ startAt, service, businessHours, appointments, blockedTimes })) {
      slots.push(startAt)
    }
  }
  return slots
}
