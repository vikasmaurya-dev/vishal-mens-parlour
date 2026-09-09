import type { Appointment } from '../types/domain'

export interface DashboardKpis {
  todayRevenue: number
  weekRevenue: number
  todayBookingCount: number
  tomorrowBookingCount: number
  pendingCount: number
  noShowRatePct: number
  todayAppointments: Appointment[]
  tomorrowAppointments: Appointment[]
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function daysFrom(reference: Date, offset: number) {
  const next = startOfDay(reference)
  next.setDate(next.getDate() + offset)
  return next
}

const activeStatuses = new Set(['PENDING', 'CONFIRMED', 'COMPLETED'])

export function computeKpis(appointments: Appointment[], now = new Date()): DashboardKpis {
  const today = startOfDay(now)
  const tomorrow = daysFrom(now, 1)
  const dayAfterTomorrow = daysFrom(now, 2)
  const weekStart = daysFrom(now, -6)

  const todayAppointments: Appointment[] = []
  const tomorrowAppointments: Appointment[] = []
  let todayRevenue = 0
  let weekRevenue = 0
  let pendingCount = 0
  let noShowCount = 0
  let finalizedCount = 0

  for (const appointment of appointments) {
    const start = new Date(appointment.startAt)
    if (Number.isNaN(start.getTime())) continue

    if (appointment.status === 'PENDING') pendingCount += 1

    const isTodayBooking = start >= today && start < tomorrow
    const isTomorrowBooking = start >= tomorrow && start < dayAfterTomorrow
    const isThisWeek = start >= weekStart && start < tomorrow

    if (isTodayBooking) todayAppointments.push(appointment)
    if (isTomorrowBooking) tomorrowAppointments.push(appointment)

    if (activeStatuses.has(appointment.status)) {
      if (isTodayBooking) todayRevenue += appointment.servicePriceSnapshot
      if (isThisWeek) weekRevenue += appointment.servicePriceSnapshot
    }

    if (start < today) {
      if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
        finalizedCount += 1
        if (appointment.status === 'CANCELLED') noShowCount += 1
      } else if (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') {
        finalizedCount += 1
        noShowCount += 1
      }
    }
  }

  const noShowRatePct = finalizedCount === 0 ? 0 : Math.round((noShowCount / finalizedCount) * 100)

  todayAppointments.sort((a, b) => a.startAt.localeCompare(b.startAt))
  tomorrowAppointments.sort((a, b) => a.startAt.localeCompare(b.startAt))

  return {
    todayRevenue,
    weekRevenue,
    todayBookingCount: todayAppointments.length,
    tomorrowBookingCount: tomorrowAppointments.length,
    pendingCount,
    noShowRatePct,
    todayAppointments,
    tomorrowAppointments,
  }
}
