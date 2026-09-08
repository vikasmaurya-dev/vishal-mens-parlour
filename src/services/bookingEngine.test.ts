import { describe, expect, it } from 'vitest'
import { appointments, blockedTimes, bookingSettings, businessHours, services } from '../constants/seedData'
import { generateSlots, isSlotAvailable, normalizeIndianPhone, overlaps } from './bookingEngine'

const service = services.find((item) => item.id === 'premium-haircut')!

describe('booking engine', () => {
  it('normalizes Indian mobile numbers to E.164', () => {
    expect(normalizeIndianPhone('98765 43210')).toBe('+919876543210')
    expect(normalizeIndianPhone('+91 98765 43210')).toBe('+919876543210')
  })

  it('rejects invalid Indian mobile numbers', () => {
    expect(() => normalizeIndianPhone('12345')).toThrow()
  })

  it('detects interval overlaps', () => {
    expect(overlaps(new Date('2026-09-02T10:00:00+05:30'), new Date('2026-09-02T10:45:00+05:30'), new Date('2026-09-02T10:30:00+05:30'), new Date('2026-09-02T11:00:00+05:30'))).toBe(true)
    expect(overlaps(new Date('2026-09-02T10:00:00+05:30'), new Date('2026-09-02T10:30:00+05:30'), new Date('2026-09-02T10:30:00+05:30'), new Date('2026-09-02T11:00:00+05:30'))).toBe(false)
  })

  it('blocks a slot that conflicts with an active appointment', () => {
    expect(
      isSlotAvailable({
        startAt: new Date('2026-09-02T10:30:00+05:30'),
        service,
        businessHours,
        appointments,
        blockedTimes,
      }),
    ).toBe(false)
  })

  it('uses service duration when generating slots', () => {
    const slots = generateSlots({
      date: new Date('2026-09-02T09:00:00+05:30'),
      service,
      businessHours,
      appointments,
      blockedTimes,
      settings: bookingSettings,
      now: new Date('2026-09-01T09:00:00+05:30'),
    })

    expect(slots.some((slot) => slot.toISOString() === new Date('2026-09-02T10:30:00+05:30').toISOString())).toBe(false)
    expect(slots.length).toBeGreaterThan(0)
  })
})
