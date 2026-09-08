import { Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAdminData } from '../../hooks/useAdminData'
import { deleteBlockedTime, saveBlockedTime } from '../../services/cms'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const hours = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM']
const miniDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function AdminCalendarPage() {
  const { data, loading, error, refresh } = useAdminData()
  const [saving, setSaving] = useState(false)
  const [block, setBlock] = useState({ startAt: '', endAt: '', reason: 'Lunch Break', staffId: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const appointments = data?.appointments ?? []
  const blockedTimes = data?.blockedTimes ?? []
  const staff = data?.staff ?? []
  const firstAppointment = appointments[0]
  const firstBreak = blockedTimes[0]

  const submitBlock = async () => {
    if (!block.startAt || !block.endAt || !block.reason) {
      setFormError('Start, end, aur reason required hai.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await saveBlockedTime({ startAt: block.startAt, endAt: block.endAt, reason: block.reason, staffId: block.staffId || undefined })
      setBlock({ startAt: '', endAt: '', reason: 'Lunch Break', staffId: '' })
      await refresh()
    } catch (blockError) {
      setFormError(blockError instanceof Error ? blockError.message : 'Block time save nahi ho paya.')
    } finally {
      setSaving(false)
    }
  }

  const removeBlock = async (id: string) => {
    setSaving(true)
    try {
      await deleteBlockedTime(id)
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminNotice title="Loading calendar..." />
  if (error) return <AdminNotice title="Calendar data issue" detail={error} />

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title" style={{ textAlign: 'left', margin: 0 }}>
            Calendar
          </h1>
          <p className="muted">Manage appointments, staff schedules, and unavailable time.</p>
        </div>
        <div className="actions">
          <button className="pill active" type="button">Day</button>
          <button className="pill" type="button">Week</button>
          <button className="pill" type="button">Month</button>
          <a className="btn" href="/admin/appointments"><Plus size={16} /> New Appointment</a>
        </div>
      </div>
      <div className="calendar-layout">
        <aside className="grid">
          <article className="plain-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>September 2026</strong>
              <span>‹ ›</span>
            </div>
            <div className="mini-calendar" style={{ marginTop: 18 }}>
              {miniDays.map((day, index) => <strong key={`${day}-${index}`}>{day}</strong>)}
              {[30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((day) => (
                <span className={day === 6 ? 'today' : ''} key={day}>{day}</span>
              ))}
            </div>
          </article>
          <article className="plain-card">
            <h2 className="serif">Staff Members</h2>
            {(staff.length ? staff : [{ id: 'v', name: 'Vishal', title: 'Master' }]).map((member) => (
              <label key={member.id} style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                <input type="checkbox" defaultChecked /> {member.name} {member.title ? `(${member.title})` : ''}
              </label>
            ))}
            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '22px 0' }} />
            <h3>Legend</h3>
            <p><span className="status" style={{ background: '#000', color: '#fff' }}> </span> Confirmed</p>
            <p><span className="status"> </span> Pending</p>
            <p><span className="status" style={{ background: '#dedbd6' }}> </span> Blocked/Break</p>
          </article>
          <article className="plain-card">
            <h2 className="serif">Block Time</h2>
            <Field label="Start" value={block.startAt} type="datetime-local" onChange={(value) => setBlock({ ...block, startAt: value })} />
            <Field label="End" value={block.endAt} type="datetime-local" onChange={(value) => setBlock({ ...block, endAt: value })} />
            <Field label="Reason" value={block.reason} onChange={(value) => setBlock({ ...block, reason: value })} />
            <label className="field">
              <span>Staff</span>
              <select value={block.staffId} onChange={(event) => setBlock({ ...block, staffId: event.target.value })}>
                <option value="">All staff</option>
                {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <button className="btn" disabled={saving} onClick={() => void submitBlock()} type="button"><Save size={16} /> Save Block</button>
          </article>
          <article className="plain-card">
            <h2 className="serif">Blocked Slots</h2>
            <div className="mini-list">
              {blockedTimes.map((item) => (
                <span className="list-chip" key={item.id}>
                  {item.reason}
                  <button onClick={() => void removeBlock(item.id)} type="button" aria-label={`Delete ${item.reason}`}><Trash2 size={14} /></button>
                </span>
              ))}
            </div>
          </article>
        </aside>
        <section>
          <div className="plain-card" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
            <h2 className="serif" style={{ textAlign: 'center', fontSize: 42 }}>Sep 1 - Sep 5, 2026</h2>
          </div>
          <div className="calendar-board" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <div className="calendar-cell"></div>
            {days.map((day) => (
              <div className="calendar-cell" key={day}>
                <strong>{day}</strong>
              </div>
            ))}
            {hours.map((hour, row) => (
              <div style={{ display: 'contents' }} key={hour}>
                <div className="calendar-cell">{hour}</div>
                {days.map((day, index) => (
                  <div className="calendar-cell" key={`${hour}-${day}`}>
                    {row === 1 && index === 0 && firstAppointment && (
                      <div className="appointment-block">
                        {firstAppointment.serviceName}<br />
                        {new Date(firstAppointment.startAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} -{' '}
                        {new Date(firstAppointment.endAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    )}
                    {row === 2 && index === 1 && firstBreak && <div className="plain-card" style={{ padding: 12 }}>{firstBreak.reason}</div>}
                    {row === 1 && index === 2 && <div className="plain-card" style={{ borderColor: '#000', padding: 12 }}>Signature Shave<br />Pending</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
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
