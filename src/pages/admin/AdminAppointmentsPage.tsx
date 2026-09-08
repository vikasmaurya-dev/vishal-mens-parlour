import { CheckCircle2, Eye, MessageCircle, Phone, Plus, Save, X, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useAdminData } from '../../hooks/useAdminData'
import { createManualAppointment, updateAppointmentStatus } from '../../services/cms'
import type { Appointment, AppointmentStatus } from '../../types/domain'
import { formatDateTime } from '../../utils/format'

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
    if (!manual.customerName || !manual.customerPhone || !manual.serviceId || !manual.startAt) {
      setFormError('Customer, phone, service, aur time required hai.')
      return
    }
    setSavingId('manual')
    setFormError(null)
    try {
      await createManualAppointment(manual)
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
      <article className="plain-card table-wrap" style={{ marginTop: 26 }}>
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
            {appointments.map((appointment) => (
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
