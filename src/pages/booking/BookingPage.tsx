import { ArrowLeft, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Brand } from '../../components/common/Brand'
import { appointments, blockedTimes } from '../../constants/seedData'
import { generateSlots, normalizeIndianPhone } from '../../services/bookingEngine'
import { createBooking, requestEmailBookingOtp, verifyEmailBookingOtp } from '../../services/bookingApi'
import { usePublicData } from '../../hooks/usePublicData'
import type { Service } from '../../types/domain'
import { formatMoney } from '../../utils/format'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const customerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  phone: z.string().min(1, 'Enter your mobile number.'),
  email: z.string().trim().min(1, 'Enter your email address.').refine((value) => emailRegex.test(value), 'Enter a valid email address.'),
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
  const [date, setDate] = useState(() => {
    const today = new Date()
    today.setHours(9, 0, 0, 0)
    return today
  })
  const [slot, setSlot] = useState<Date | null>(null)
  const [customer, setCustomer] = useState({ fullName: '', phone: '', email: '', notes: '' })
  const [honeypot, setHoneypot] = useState('')
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
      }),
    [date, currentService, businessHours, bookingSettings],
  )

  const todayIso = new Date().toISOString().slice(0, 10)
  const maxDateIso = new Date(Date.now() + bookingSettings.advanceBookingDays * 86_400_000)
    .toISOString()
    .slice(0, 10)

  async function nextFromDetails() {
    const result = customerSchema.safeParse(customer)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check your details.')
      return
    }
    // Validate phone once here so bad numbers fail before we send an OTP.
    try {
      normalizeIndianPhone(result.data.phone)
    } catch (phoneError) {
      setError(phoneError instanceof Error ? phoneError.message : 'Invalid mobile number.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const response = await requestEmailBookingOtp(result.data.email.trim().toLowerCase(), honeypot)
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
      const normalizedEmail = customer.email.trim().toLowerCase()
      const verified = await verifyEmailBookingOtp(normalizedEmail, otp)
      const confirmation = await createBooking({
        otpId: verified.otpId || otpId,
        fullName: customer.fullName,
        phone: normalizedPhone,
        email: normalizedEmail,
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
              {['Service', 'Date', 'Time', 'Details', 'Verify Email', 'Confirm'].map((label, index) => (
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
                    min={todayIso}
                    max={maxDateIso}
                    value={date.toISOString().slice(0, 10)}
                    onChange={(event) => {
                      if (!event.target.value) return
                      const next = new Date(`${event.target.value}T09:00:00`)
                      setDate(next)
                      setSlot(null)
                    }}
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
                  <label htmlFor="email">Email address (we will send your verification code here)</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="notes">Notes optional</label>
                  <textarea id="notes" value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} />
                </div>
                {/* Honeypot: hidden from users, only bots will fill it. */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
                  <label htmlFor="company">Company (leave blank)</label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
                <button className="btn" onClick={nextFromDetails} disabled={loading}>
                  {loading ? 'Sending code...' : 'Send verification email'}
                </button>
              </>
            )}

            {step === 5 && (
              <>
                <ShieldCheck size={34} />
                <h1 className="serif">Verify your email</h1>
                <p className="muted">
                  We sent a 4-digit code to <strong>{customer.email}</strong>. Check your inbox (and spam folder). Code expires in 5 minutes.
                </p>
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
