import { MessageCircle, Phone } from 'lucide-react'
import { useAdminData } from '../../hooks/useAdminData'

export function AdminCustomersPage() {
  const { data, loading, error } = useAdminData()
  const customers = data?.customers ?? []

  if (loading) return <AdminNotice title="Loading customers..." />
  if (error) return <AdminNotice title="Customers data issue" detail={error} />

  return (
    <>
      <h1 className="section-title" style={{ textAlign: 'left' }}>
        Customers
      </h1>
      <div className="grid service-grid">
        {customers.map((customer) => (
          <article className="plain-card" key={customer.id}>
            <h2 className="serif">{customer.name}</h2>
            <p>{customer.phone}</p>
            <p className="muted">{customer.appointmentCount} appointments</p>
            <div className="actions" style={{ marginTop: 16 }}>
              <a className="btn ghost" href={`tel:${customer.phone}`}>
                <Phone size={17} /> Call
              </a>
              <a className="btn secondary" href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}>
                <MessageCircle size={17} /> WhatsApp
              </a>
            </div>
          </article>
        ))}
      </div>
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
