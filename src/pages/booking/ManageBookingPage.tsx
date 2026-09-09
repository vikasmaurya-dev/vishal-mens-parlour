import { ArrowLeft, CalendarClock, CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Brand } from '../../components/common/Brand'
import { appointments as seedAppointments, blockedTimes as seedBlockedTimes } from '../../constants/seedData'
import { usePublicData } from '../../hooks/usePublicData'
import { generateSlots } from '../../services/bookingEngine'
import {
  cancelBooking,
  fetchManageBooking,
  rescheduleBooking,
  type ManageBooking,
} from '../../services/manageBookingApi'

type Mode = 'view' | 'confirm-cancel' | 'reschedule' | 'done-cancel' | 'done-reschedule'

export function ManageBookingPage() {
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref') ?? ''
  const token = searchParams.get('token') ?? ''
  const { services, businessHours, bookingSettings } = usePublicData()

  const [booking, setBooking] = useState<ManageBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('view')
  const [pickerDate, setPickerDate] = useState(() => {
    const today = new Date()
    today.setHours(9, 0, 0, 0)
    return today
  })
  const [pickedSlot, setPickedSlot] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    if (!ref || !token) {
      setError('This link is missing required information.')
      setLoading(false)
      return
    }
    fetchManageBooking(ref, token)
      .then((data) => {
        if (!active) return
        if (!data) setError('Booking not found.')
        else setBooking(data)
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Could not load booking.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [ref, token])

  const service = booking ? services.find((s) => s.id === booking.service_id) : undefined

  const slots = useMemo(() => {
    if (!service) return []
    return generateSlots({
      date: pickerDate,
      service,
      businessHours,
      appointments: seedAppointments,
      blockedTimes: seedBlockedTimes,
      settings: bookingSettings,
    })
  }, [service, pickerDate, businessHours, bookingSettings])

  const todayIso = new Date().toISOString().slice(0, 10)
  const maxDateIso = new Date(Date.now() + bookingSettings.advanceBookingDays * 86_400_000)
    .toISOString()
    .slice(0, 10)

  async function handleCancel() {
    setSubmitting(true)
    setError('')
    try {
      await cancelBooking(ref, token)
      setMode('done-cancel')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReschedule() {
    if (!pickedSlot) return
    setSubmitting(true)
    setError('')
    try {
      const updated = await rescheduleBooking(ref, token, pickedSlot.toISOString())
      setBooking((prev) => (prev ? { ...prev, start_at: updated.start_at, end_at: updated.end_at } : prev))
      setMode('done-reschedule')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reschedule failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="booking-shell">
        <div className="booking-card"><p className="muted">Loading your booking…</p></div>
      </main>
    )
  }

  return (
    <main className="booking-shell">
      <div className="booking-card">
        <Link to="/" className="muted" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <ArrowLeft size={16} /> Home
        </Link>
        <div style={{ marginTop: 20 }}>
          <Brand />
          <h1 className="serif" style={{ marginTop: 12 }}>Manage your booking</h1>
        </div>

        {error && !booking && <p style={{ color: 'var(--danger)', marginTop: 20 }}>{error}</p>}

        {booking && (
          <section style={{ marginTop: 24 }}>
            <div className="plain-card">
              <p><strong>Reference:</strong> {booking.booking_reference}</p>
              <p><strong>Service:</strong> {booking.service_name}</p>
              <p><strong>When:</strong> {new Date(booking.start_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
              <p><strong>Status:</strong> {booking.status}</p>
            </div>

            {mode === 'view' && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <button className="btn" onClick={() => setMode('reschedule')} type="button">
                  <CalendarClock size={17} /> Reschedule
                </button>
                <button className="btn secondary" onClick={() => setMode('confirm-cancel')} type="button">
                  <XCircle size={17} /> Cancel booking
                </button>
              </div>
            )}

            {mode === 'confirm-cancel' && (
              <div style={{ marginTop: 20 }}>
                <p>Are you sure you want to cancel this booking? This cannot be undone.</p>
                {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button className="btn" onClick={handleCancel} disabled={submitting} type="button">
                    {submitting ? 'Cancelling…' : 'Yes, cancel it'}
                  </button>
                  <button className="btn secondary" onClick={() => setMode('view')} type="button">
                    Keep booking
                  </button>
                </div>
              </div>
            )}

            {mode === 'reschedule' && (
              <div style={{ marginTop: 20 }}>
                <div className="field">
                  <label htmlFor="new-date">Pick a new date</label>
                  <input
                    id="new-date"
                    type="date"
                    min={todayIso}
                    max={maxDateIso}
                    value={pickerDate.toISOString().slice(0, 10)}
                    onChange={(e) => {
                      if (!e.target.value) return
                      setPickerDate(new Date(`${e.target.value}T09:00:00`))
                      setPickedSlot(null)
                    }}
                  />
                </div>
                {slots.length ? (
                  <div className="slot-grid">
                    {slots.map((item) => (
                      <button
                        className={pickedSlot?.getTime() === item.getTime() ? 'active' : ''}
                        key={item.toISOString()}
                        onClick={() => setPickedSlot(item)}
                        type="button"
                      >
                        {item.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="plain-card">No slots available on this date.</p>
                )}
                {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button className="btn" onClick={handleReschedule} disabled={!pickedSlot || submitting} type="button">
                    {submitting ? 'Saving…' : 'Confirm new time'}
                  </button>
                  <button className="btn secondary" onClick={() => setMode('view')} type="button">
                    Back
                  </button>
                </div>
              </div>
            )}

            {mode === 'done-cancel' && (
              <div style={{ marginTop: 20 }}>
                <CheckCircle2 size={36} color="var(--success)" />
                <p>Your booking has been cancelled. Hope to see you soon!</p>
              </div>
            )}

            {mode === 'done-reschedule' && (
              <div style={{ marginTop: 20 }}>
                <CheckCircle2 size={36} color="var(--success)" />
                <p>Your booking has been rescheduled. See you at the new time!</p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
