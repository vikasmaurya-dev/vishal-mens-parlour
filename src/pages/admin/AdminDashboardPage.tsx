import { CalendarCheck, CheckCircle2, CreditCard, MessageSquareText, Phone, TrendingUp, UsersRound, Clock, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { SkeletonCard } from '../../components/common/Skeleton'
import { useAdminData } from '../../hooks/useAdminData'
import { computeKpis } from '../../utils/kpis'
import { formatDateTime, formatMoney } from '../../utils/format'

export function AdminDashboardPage() {
  const { data, loading, error } = useAdminData()
  const appointments = data?.appointments ?? []
  const customers = data?.customers ?? []

  const kpis = useMemo(() => computeKpis(appointments), [appointments])

  if (loading) return <DashboardSkeleton />
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
          <strong>{formatMoney(kpis.todayRevenue)}</strong>
          <p>{formatMoney(kpis.weekRevenue)} this week</p>
        </article>
        <div className="metric-grid mobile-two">
          <Metric icon={<CalendarCheck />} label="Today" value={kpis.todayBookingCount.toString()} note="Bookings" />
          <Metric icon={<Clock />} label="Pending" value={kpis.pendingCount.toString()} note="Need review" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 46 }}>
          <h2 className="serif" style={{ fontSize: 36 }}>Upcoming</h2>
          <a href="/admin/appointments" style={{ color: 'var(--warm)', fontWeight: 600 }}>View All</a>
        </div>
        <div className="grid">
          {kpis.todayAppointments.slice(0, 3).map((appointment) => (
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
          {kpis.todayAppointments.length === 0 && <p className="muted">No bookings today yet.</p>}
        </div>
      </section>
      <section className="dashboard-desktop">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title" style={{ textAlign: 'left', margin: 0 }}>
            Overview
          </h1>
          <p className="muted">Today's revenue, upcoming bookings, and no-show trends.</p>
        </div>
        <div className="actions">
          <a className="btn secondary" href="/admin/calendar" role="button">
            Block Time
          </a>
          <a className="btn" href="/admin/appointments" role="button">
            All Appointments
          </a>
        </div>
      </div>
      <section className="metric-grid">
        <Metric icon={<CreditCard />} label="Today's Revenue" value={formatMoney(kpis.todayRevenue)} note="Active bookings" />
        <Metric icon={<TrendingUp />} label="This Week" value={formatMoney(kpis.weekRevenue)} note="Rolling 7 days" />
        <Metric icon={<CalendarCheck />} label="Today's Bookings" value={kpis.todayBookingCount.toString()} note={`${kpis.tomorrowBookingCount} tomorrow`} />
        <Metric icon={<Clock />} label="Pending" value={kpis.pendingCount.toString()} note="Awaiting confirm" />
        <Metric icon={<UsersRound />} label="Customers" value={customers.length.toString()} note="All-time" />
        <Metric icon={<XCircle />} label="No-Show Rate" value={`${kpis.noShowRatePct}%`} note="Historical" />
      </section>
      <section className="admin-panel-grid">
        <article className="plain-card">
          <h2 className="serif">Today's Schedule</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {kpis.todayAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{new Date(appointment.startAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</td>
                    <td>{appointment.customerName}</td>
                    <td>{appointment.serviceName}</td>
                    <td><span className="status">{appointment.status}</span></td>
                  </tr>
                ))}
                {kpis.todayAppointments.length === 0 && (
                  <tr><td colSpan={4} className="muted">No bookings today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
        <article className="plain-card">
          <h2 className="serif">Tomorrow</h2>
          <div className="grid">
            {kpis.tomorrowAppointments.map((appointment) => (
              <div className="plain-card" key={appointment.id}>
                <strong>{formatDateTime(appointment.startAt)}</strong>
                <p>{appointment.customerName}</p>
                <p className="muted">{appointment.serviceName}</p>
              </div>
            ))}
            {kpis.tomorrowAppointments.length === 0 && <p className="muted">No bookings tomorrow yet.</p>}
          </div>
        </article>
      </section>
      </section>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <section>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 20 }}>
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} lines={2} />
        ))}
      </div>
    </section>
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
