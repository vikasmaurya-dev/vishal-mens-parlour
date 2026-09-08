import { CalendarCheck, CheckCircle2, CreditCard, MessageSquareText, Phone, UsersRound, Clock } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAdminData } from '../../hooks/useAdminData'
import { formatDateTime, formatMoney } from '../../utils/format'

export function AdminDashboardPage() {
  const { data, loading, error } = useAdminData()
  const appointments = data?.appointments ?? []
  const customers = data?.customers ?? []
  const pending = appointments.filter((item) => item.status === 'PENDING').length
  const revenue = appointments
    .filter((item) => item.status !== 'CANCELLED')
    .reduce((sum, item) => sum + item.servicePriceSnapshot, 0)

  if (loading) return <AdminNotice title="Loading dashboard..." />
  if (error) return <AdminNotice title="Dashboard data issue" detail={error} />

  return (
    <>
      <section className="mobile-dashboard">
        <h1 className="section-title" style={{ textAlign: 'left', marginTop: 0 }}>
          Overview
        </h1>
        <p className="muted">Here is what is happening at the parlour today.</p>
        <article className="revenue-card" style={{ marginTop: 24 }}>
          <span className="eyebrow">Today's Revenue</span>
          <strong>{formatMoney(revenue)}</strong>
          <p>+15% from yesterday</p>
        </article>
        <div className="metric-grid mobile-two">
          <Metric icon={<UsersRound />} label="Total Bookings" value={appointments.length.toString()} note="Today" />
          <Metric icon={<Clock />} label="Pending" value={pending.toString()} note="Need review" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 46 }}>
          <h2 className="serif" style={{ fontSize: 36 }}>Upcoming</h2>
          <strong style={{ color: 'var(--warm)' }}>View All</strong>
        </div>
        <div className="grid">
          {appointments.slice(0, 2).map((appointment) => (
            <article className="plain-card" key={appointment.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <span className="status" style={{ width: 58, height: 58, borderRadius: 999, placeItems: 'center', display: 'grid' }}>
                    {appointment.customerName.split(' ').map((part) => part[0]).join('')}
                  </span>
                  <div>
                    <h3 style={{ margin: 0 }}>{appointment.customerName}</h3>
                    <p className="muted">{appointment.serviceName}</p>
                  </div>
                </div>
                <strong>{new Date(appointment.startAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</strong>
              </div>
              <div className="actions" style={{ marginTop: 22, justifyContent: 'space-between' }}>
                <a className="btn ghost" href={`tel:${appointment.customerPhone}`}><Phone size={16} /> Call</a>
                <a className="btn secondary" href={`https://wa.me/${appointment.customerPhone.replace(/\D/g, '')}`}><MessageSquareText size={16} /> WhatsApp</a>
                <button className="btn" type="button"><CheckCircle2 size={16} /> Confirm</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="dashboard-desktop">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title" style={{ textAlign: 'left', margin: 0 }}>
            Overview
          </h1>
          <p className="muted">A summary of today’s operations and recent business performance.</p>
        </div>
        <div className="actions">
          <button className="btn secondary" type="button">
            Block Time
          </button>
          <button className="btn" type="button">
            New Appointment
          </button>
        </div>
      </div>
      <section className="metric-grid">
        <Metric icon={<CalendarCheck />} label="Appointments" value={appointments.length.toString()} note="Today" />
        <Metric icon={<Clock />} label="Pending Requests" value={pending.toString()} note="Action needed" />
        <Metric icon={<UsersRound />} label="Total Customers" value={customers.length.toString()} note="+12 this month ready" />
        <Metric icon={<CreditCard />} label="Revenue Estimate" value={formatMoney(revenue)} note="Based on snapshots" />
      </section>
      <section className="admin-panel-grid">
        <article className="plain-card">
          <h2 className="serif">Recent Customers</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date/Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{appointment.customerName}</td>
                    <td>{appointment.serviceName}</td>
                    <td>{formatDateTime(appointment.startAt)}</td>
                    <td>
                      <span className="status">{appointment.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="plain-card">
          <h2 className="serif">Today’s Schedule</h2>
          <div className="grid">
            {appointments.map((appointment) => (
              <div className="plain-card" key={appointment.id}>
                <strong>{formatDateTime(appointment.startAt)}</strong>
                <p>{appointment.customerName}</p>
                <p className="muted">{appointment.serviceName}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
      </section>
    </>
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

function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return (
    <article className="metric">
      {icon}
      <p>{label}</p>
      <strong>{value}</strong>
      <p className="muted">{note}</p>
    </article>
  )
}
