import { ArrowLeft, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Brand } from '../../components/common/Brand'
import { appointments, blockedTimes } from '../../constants/seedData'
import { generateSlots, normalizeIndianPhone } from '../../services/bookingEngine'
import { createBooking, requestBookingOtp, verifyBookingOtp } from '../../services/bookingApi'
import { usePublicData } from '../../hooks/usePublicData'
import type { Service } from '../../types/domain'
import { formatMoney } from '../../utils/format'

const customerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  phone: z.string().transform((value, ctx) => {
    try {
      return normalizeIndianPhone(value)
    } catch (error) {
      ctx.addIssue({ code: 'custom', message: error instanceof Error ? error.message : 'Invalid phone number.' })
      return z.NEVER
    }
  }),
  email: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  notes: z.string().max(300).optional(),
})

type Step = 1 | 2 | 3 | 4 | 5 | 6

export function BookingPage() {
  const [searchParams] = useSearchParams()
  const { business: businessSettings, businessHours, bookingSettings, services } = usePublicData()
  const requestedService = searchParams.get('service')
  const initialService = services.find((service) => service.id === requestedService || service.slug === requestedService) ?? services[0]
  const [step, setStep] = useState<Step>(1)
  const [service, setService] = useState<Service>(initialService)
  const [date, setDate] = useState(() => new Date('2026-09-02T09:00:00+05:30'))
  const [slot, setSlot] = useState<Date | null>(null)
  const [customer, setCustomer] = useState({ fullName: '', phone: '', email: '', notes: '' })
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const [otpId, setOtpId] = useState('')
  const [developmentCode, setDevelopmentCode] = useState('')
  const [loading, setLoading] = useState(false)

  const currentService = services.find((item) => item.id === service.id) ?? initialService

  const slots = useMemo(
    () =>
      generateSlots({
        date,
        service: currentService,
        businessHours,
        appointments,
        blockedTimes,
        settings: bookingSettings,
        now: new Date('2026-09-01T09:00:00+05:30'),
      }),
    [date, currentService, businessHours, bookingSettings],
  )

  async function nextFromDetails() {
    const result = customerSchema.safeParse(customer)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check your details.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const response = await requestBookingOtp(result.data.phone)
      setOtpId(response.otpId)
      setDevelopmentCode(response.developmentCode ?? '')
      setStep(5)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'We could not send that code.')
    } finally {
      setLoading(false)
    }
  }

  async function completeBooking() {
    if (otp.length !== 4) {
      setError('Enter the 4-digit verification code.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const normalizedPhone = normalizeIndianPhone(customer.phone)
      const verified = await verifyBookingOtp(normalizedPhone, otp)
      const confirmation = await createBooking({
        otpId: verified.otpId || otpId,
        fullName: customer.fullName,
        phone: normalizedPhone,
        email: customer.email,
        serviceId: currentService.id,
        startAt: slot?.toISOString() ?? '',
        notes: customer.notes,
      })
      setReference(confirmation.booking_reference)
      setStep(6)
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : 'We could not create the booking.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="booking-shell">
      <div className="booking-card">
        <div className="booking-grid">
          <aside className="booking-aside">
            <Link to="/" className="muted" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <ArrowLeft size={16} /> Back
            </Link>
            <div style={{ marginTop: 28 }}>
              <Brand />
              <p className="muted" style={{ marginTop: 12 }}>
                Guest booking. No customer account required.
              </p>
            </div>
            <div className="step-list" aria-label="Booking progress">
              {['Service', 'Date', 'Time', 'Details', 'OTP', 'Confirm'].map((label, index) => (
                <div className={`step ${step === index + 1 ? 'active' : ''}`} key={label}>
                  <span>{index + 1}</span> {label}
                </div>
              ))}
            </div>
          </aside>
          <section className="booking-main">
            {step === 1 && (
              <>
                <span className="eyebrow">Step 1</span>
                <h1 className="serif">Select Service</h1>
                <div className="grid" style={{ marginTop: 20 }}>
                  {services
                    .filter((item) => item.bookable && item.active)
                    .map((item) => (
                      <button
                        className={`select-card ${currentService.id === item.id ? 'active' : ''}`}
                        key={item.id}
                        type="button"
                        onClick={() => setService(item)}
                      >
                        <strong>{item.name}</strong>
                        <p className="muted">{item.shortDescription}</p>
                        <p>
                          {item.durationMinutes} min •{' '}
                          {item.price ? formatMoney(item.discountPrice ?? item.price) : 'Consultation'}
                        </p>
                      </button>
                    ))}
                </div>
                <button className="btn" style={{ marginTop: 20 }} onClick={() => setStep(2)}>
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <span className="eyebrow">Step 2</span>
                <h1 className="serif">Select Date</h1>
                <div className="field">
                  <label htmlFor="booking-date">Appointment date</label>
                  <input
                    id="booking-date"
                    type="date"
                    value={date.toISOString().slice(0, 10)}
                    onChange={(event) => setDate(new Date(`${event.target.value}T09:00:00+05:30`))}
                  />
                </div>
                <button className="btn" onClick={() => setStep(3)}>
                  See Available Times
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <span className="eyebrow">Step 3</span>
                <h1 className="serif">Select Available Time</h1>
                {slots.length ? (
                  <div className="slot-grid">
                    {slots.map((item) => (
                      <button
                        className={slot?.getTime() === item.getTime() ? 'active' : ''}
                        key={item.toISOString()}
                        onClick={() => setSlot(item)}
                      >
                        {item.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="plain-card">No available slots for this date.</p>
                )}
                <button className="btn" style={{ marginTop: 20 }} disabled={!slot} onClick={() => setStep(4)}>
                  Continue
                </button>
              </>
            )}

            {step === 4 && (
              <>
                <span className="eyebrow">Step 4</span>
                <h1 className="serif">Customer Details</h1>
                <div className="field">
                  <label htmlFor="fullName">Full name</label>
                  <input id="fullName" value={customer.fullName} onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="phone">Indian mobile number</label>
                  <input id="phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="email">Email optional</label>
                  <input id="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="notes">Notes optional</label>
                  <textarea id="notes" value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} />
                </div>
                {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
                <button className="btn" onClick={nextFromDetails} disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </>
            )}

            {step === 5 && (
              <>
                <ShieldCheck size={34} />
                <h1 className="serif">Verify Mobile OTP</h1>
                <p className="muted">Production OTPs are generated and hashed in Supabase Edge Functions. Local development uses a gated test code.</p>
                {developmentCode && <p className="plain-card">Development code: <strong>{developmentCode}</strong></p>}
                <div className="field" style={{ marginTop: 18 }}>
                  <label htmlFor="otp">4-digit code</label>
                  <input id="otp" inputMode="numeric" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
                </div>
                {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
                <button className="btn" onClick={completeBooking} disabled={loading || !otpId}>
                  {loading ? 'Creating booking...' : 'Final Check & Create Booking'}
                </button>
              </>
            )}

            {step === 6 && (
              <>
                <CheckCircle2 size={42} color="var(--success)" />
                <h1 className="serif">Booking Confirmed</h1>
                <p className="muted">Reference {reference}. The final production insert runs through a database function that prevents overlapping active appointments.</p>
                <a
                  className="btn secondary"
                  style={{ marginTop: 20 }}
                  href={`https://wa.me/${businessSettings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Booking ${reference}: ${customer.fullName} for ${currentService.name} at ${slot?.toLocaleString('en-IN')}`,
                  )}`}
                >
                  <MessageCircle size={17} /> Send details on WhatsApp
                </a>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
