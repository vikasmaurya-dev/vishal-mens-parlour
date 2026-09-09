import { describe, expect, it } from 'vitest'
import type { Appointment } from '../types/domain'
import { computeKpis } from './kpis'

function appt(overrides: Partial<Appointment>): Appointment {
  return {
    id: 'a1',
    bookingReference: 'VMP-TEST',
    customerName: 'Test',
    customerPhone: '+919999999999',
    serviceName: 'Cut',
    serviceId: 's1',
    staffName: 'Any',
    startAt: '2026-09-08T10:00:00+05:30',
    endAt: '2026-09-08T10:30:00+05:30',
    status: 'CONFIRMED',
    servicePriceSnapshot: 500,
    ...overrides,
  }
}

describe('computeKpis', () => {
  const now = new Date('2026-09-08T12:00:00+05:30')

  it('sums today revenue only for active statuses', () => {
    const kpis = computeKpis(
      [
        appt({ id: '1', startAt: '2026-09-08T09:00:00+05:30', status: 'CONFIRMED', servicePriceSnapshot: 500 }),
        appt({ id: '2', startAt: '2026-09-08T14:00:00+05:30', status: 'CANCELLED', servicePriceSnapshot: 999 }),
        appt({ id: '3', startAt: '2026-09-08T15:00:00+05:30', status: 'PENDING', servicePriceSnapshot: 200 }),
      ],
      now,
    )
    expect(kpis.todayRevenue).toBe(700)
    expect(kpis.todayBookingCount).toBe(3)
    expect(kpis.pendingCount).toBe(1)
  })

  it('counts tomorrow bookings separately', () => {
    const kpis = computeKpis(
      [appt({ id: '1', startAt: '2026-09-09T09:00:00+05:30' })],
      now,
    )
    expect(kpis.tomorrowBookingCount).toBe(1)
    expect(kpis.todayBookingCount).toBe(0)
  })

  it('computes no-show rate from past unfinished appointments', () => {
    const kpis = computeKpis(
      [
        appt({ id: '1', startAt: '2026-09-01T10:00:00+05:30', status: 'COMPLETED' }),
        appt({ id: '2', startAt: '2026-09-02T10:00:00+05:30', status: 'PENDING' }),
        appt({ id: '3', startAt: '2026-09-03T10:00:00+05:30', status: 'CANCELLED' }),
      ],
      now,
    )
    // 2 no-shows (PENDING left in past + CANCELLED), 3 finalized → 67%
    expect(kpis.noShowRatePct).toBe(67)
  })
})
