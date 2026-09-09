import { CheckCircle2, ChevronLeft, ChevronRight, Eye, MessageCircle, Phone, Plus, Save, X, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useAdminData } from '../../hooks/useAdminData'
import { createManualAppointment, updateAppointmentStatus } from '../../services/cms'
import { normalizeIndianPhone } from '../../services/bookingEngine'
import type { Appointment, AppointmentStatus } from '../../types/domain'
import { formatDateTime } from '../../utils/format'

const manualSchema = z.object({
  customerName: z.string().trim().min(2, 'Customer name is required.'),
  customerPhone: z.string().min(1, 'Phone number is required.'),
  customerEmail: z.string().optional().default(''),
  serviceId: z.string().min(1, 'Pick a service.'),
  staffId: z.string().optional().default(''),
  startAt: z.string().min(1, 'Pick a start time.'),
  notes: z.string().max(500).optional().default(''),
})

const PAGE_SIZE = 25
const STATUS_FILTERS: Array<AppointmentStatus | 'ALL'> = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

const manualDefaults = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  serviceId: '',
  staffId: '',
  startAt: '',
  notes: '',
}

export function AdminAppointmentsPage() {
  const { data, loading, error, refresh } = useAdminData()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState(manualDefaults)
  const [formError, setFormError] = useState<string | null>(null)
  const appointments = data?.appointments ?? []
  const services = data?.services ?? []
  const staff = data?.staff ?? []

  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    return appointments.filter((appointment) => {
      if (statusFilter !== 'ALL' && appointment.status !== statusFilter) return false
      if (fromDate && appointment.startAt.slice(0, 10) < fromDate) return false
      if (toDate && appointment.startAt.slice(0, 10) > toDate) return false
      return true
    })
  }, [appointments, statusFilter, fromDate, toDate])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const changeStatus = async (appointmentId: string, status: AppointmentStatus) => {
    setSavingId(appointmentId)
    try {
      await updateAppointmentStatus(appointmentId, status)
      await refresh()
    } finally {
      setSavingId(null)
    }
  }

  const submitManual = async () => {
    const parsed = manualSchema.safeParse(manual)
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check the form details.')
      return
    }
    if (parsed.data.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.data.customerEmail)) {
      setFormError('Enter a valid email.')
      return
    }
    let normalizedPhone: string
    try {
      normalizedPhone = normalizeIndianPhone(parsed.data.customerPhone)
    } catch (phoneError) {
      setFormError(phoneError instanceof Error ? phoneError.message : 'Invalid phone number.')
      return
    }
    setSavingId('manual')
    setFormError(null)
    try {
      await createManualAppointment({
        customerName: parsed.data.customerName,
        customerPhone: normalizedPhone,
        customerEmail: parsed.data.customerEmail,
        serviceId: parsed.data.serviceId,
        staffId: parsed.data.staffId,
        startAt: parsed.data.startAt,
        notes: parsed.data.notes,
      })
      setManual(manualDefaults)
      setManualOpen(false)
      await refresh()
    } catch (manualError) {
      setFormError(manualError instanceof Error ? manualError.message : 'Appointment create nahi ho payi.')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <AdminNotice title="Loading appointments..." />
  if (error) return <AdminNotice title="Appointments data issue" detail={error} />

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title" style={{ textAlign: 'left', margin: 0 }}>
            Appointments
          </h1>
          <p className="muted">Review bookings, call customers, and create walk-in/manual appointments.</p>
        </div>
        <button className="btn" onClick={() => setManualOpen(true)} type="button">
          <Plus size={18} /> New Appointment
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22, alignItems: 'end' }}>
        <label className="field" style={{ margin: 0 }}>
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as AppointmentStatus | 'ALL')
              setPage(0)
            }}
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="field" style={{ margin: 0 }}>
          <span>From</span>
          <input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(0) }} />
        </label>
        <label className="field" style={{ margin: 0 }}>
          <span>To</span>
          <input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(0) }} />
        </label>
        <p className="muted" style={{ margin: '0 0 12px auto' }}>
          {filtered.length} result{filtered.length === 1 ? '' : 's'} · page {safePage + 1} of {pageCount}
        </p>
      </div>
      <article className="plain-card table-wrap" style={{ marginTop: 12 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={6} className="muted">No appointments match these filters.</td></tr>
            )}
            {visible.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.bookingReference}</td>
                <td>{appointment.customerName}</td>
                <td>{appointment.serviceName}</td>
                <td>{formatDateTime(appointment.startAt)}</td>
                <td>
                  <span className="status">{appointment.status}</span>
                </td>
                <td className="actions">
                  <button className="icon-action" onClick={() => setSelected(appointment)} type="button" aria-label={`View ${appointment.customerName}`}>
                    <Eye size={18} />
                  </button>
                  <a href={`tel:${appointment.customerPhone}`} aria-label={`Call ${appointment.customerName}`}>
                    <Phone size={18} />
                  </a>
                  <a href={`https://wa.me/${appointment.customerPhone.replace(/\D/g, '')}`} aria-label={`WhatsApp ${appointment.customerName}`}>
                    <MessageCircle size={18} />
                  </a>
                  {appointment.status === 'PENDING' && (
                    <button className="icon-action" disabled={savingId === appointment.id} onClick={() => void changeStatus(appointment.id, 'CONFIRMED')} type="button" aria-label={`Confirm ${appointment.customerName}`}>
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                  {appointment.status === 'CONFIRMED' && (
                    <button className="icon-action" disabled={savingId === appointment.id} onClick={() => void changeStatus(appointment.id, 'COMPLETED')} type="button" aria-label={`Complete ${appointment.customerName}`}>
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                  {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                    <button className="icon-action" disabled={savingId === appointment.id} onClick={() => void changeStatus(appointment.id, 'CANCELLED')} type="button" aria-label={`Cancel ${appointment.customerName}`}>
                      <XCircle size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
      {pageCount > 1 && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn ghost" type="button" disabled={safePage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>
            <ChevronLeft size={16} /> Previous
          </button>
          <button className="btn ghost" type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
      {manualOpen && (
        <div className="dialog-backdrop admin-dialog-backdrop" role="dialog" aria-modal="true" aria-label="New appointment">
          <div className="dialog admin-service-editor">
            <header className="editor-header">
              <h2 className="serif">New Appointment</h2>
              <button className="icon-action" onClick={() => setManualOpen(false)} type="button" aria-label="Close"><X size={18} /></button>
            </header>
            <div className="editor-fields" style={{ padding: 24 }}>
              <div className="form-row">
                <Field label="Customer Name" value={manual.customerName} onChange={(value) => setManual({ ...manual, customerName: value })} />
                <Field label="Phone" value={manual.customerPhone} onChange={(value) => setManual({ ...manual, customerPhone: value })} />
              </div>
              <div className="form-row">
                <Field label="Email" value={manual.customerEmail} onChange={(value) => setManual({ ...manual, customerEmail: value })} />
                <Field label="Start Time" type="datetime-local" value={manual.startAt} onChange={(value) => setManual({ ...manual, startAt: value })} />
              </div>
              <div className="form-row">
                <label className="field">
                  <span>Service</span>
                  <select value={manual.serviceId} onChange={(event) => setManual({ ...manual, serviceId: event.target.value })}>
                    <option value="">Select service</option>
                    {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Staff</span>
                  <select value={manual.staffId} onChange={(event) => setManual({ ...manual, staffId: event.target.value })}>
                    <option value="">Any staff</option>
                    {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                  </select>
                </label>
              </div>
              <Field label="Notes" value={manual.notes} onChange={(value) => setManual({ ...manual, notes: value })} />
              {formError && <p className="form-error">{formError}</p>}
            </div>
            <footer className="editor-footer">
              <button className="btn ghost" onClick={() => setManualOpen(false)} type="button"><X size={16} /> Cancel</button>
              <button className="btn" disabled={savingId === 'manual'} onClick={() => void submitManual()} type="button"><Save size={16} /> Save Appointment</button>
            </footer>
          </div>
        </div>
      )}
      {selected && (
        <div className="dialog-backdrop admin-dialog-backdrop" role="dialog" aria-modal="true" aria-label="Appointment detail">
          <div className="dialog admin-service-editor">
            <header className="editor-header">
              <div>
                <h2 className="serif">{selected.customerName}</h2>
                <p className="muted">{selected.bookingReference} · {selected.status}</p>
              </div>
              <button className="icon-action" onClick={() => setSelected(null)} type="button" aria-label="Close"><X size={18} /></button>
            </header>
            <div className="detail-grid">
              <p><strong>Service</strong><br />{selected.serviceName}</p>
              <p><strong>Staff</strong><br />{selected.staffName}</p>
              <p><strong>Phone</strong><br />{selected.customerPhone}</p>
              <p><strong>Time</strong><br />{formatDateTime(selected.startAt)}</p>
              <p><strong>Notes</strong><br />{selected.customerNotes || 'No notes'}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} />
    </label>
  )
}

function AdminNotice({ title, detail }: { title: string; detail?: string }) {
  return (
    <article className="plain-card">
      <h1 className="section-title" style={{ textAlign: 'left', marginTop: 0 }}>
        {title}
      </h1>
      {detail && <p className="muted">{detail}</p>}
    </article>
  )
}
