import { CalendarCheck, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { businessSettings, businessHours } from '../../constants/seedData'

export function ContactPage() {
  return (
    <main>
      <section className="section">
        <div className="container split">
          <div>
            <span className="eyebrow">Contact / Location</span>
            <h1 className="section-title" style={{ textAlign: 'left' }}>
              Plan your next visit.
            </h1>
            <p className="muted">
              Opening status and hours come from business settings. The public site uses simple call, WhatsApp, and
              directions actions for fast mobile booking.
            </p>
            <div className="hero-actions" style={{ justifyContent: 'flex-start' }}>
              <a className="btn" href={`tel:${businessSettings.phone}`}>
                <Phone size={17} /> Call
              </a>
              <a className="btn secondary" href={`https://wa.me/${businessSettings.whatsapp.replace(/\D/g, '')}`}>
                <MessageCircle size={17} /> WhatsApp
              </a>
              <Link className="btn secondary" to="/book">
                <CalendarCheck size={17} /> Book
              </Link>
            </div>
          </div>
          <div className="plain-card">
            <MapPin className="section-icon" />
            <h2 className="serif">{businessSettings.salonName}</h2>
            <p>{businessSettings.address}</p>
            <p>{businessSettings.landmark}</p>
            <p>
              {businessSettings.city}, {businessSettings.state} {businessSettings.pinCode}
            </p>
            <a className="btn ghost" style={{ marginTop: 18 }} href={businessSettings.mapsUrl}>
              Get Directions
            </a>
          </div>
        </div>
      </section>
      <section className="section alt">
        <div className="container">
          <h2 className="section-title">Opening Hours</h2>
          <div className="grid service-grid">
            {businessHours.map((day) => (
              <article className="plain-card" key={day.weekday}>
                <strong>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.weekday]}</strong>
                <p>{day.isOpen ? `${day.opensAt} - ${day.closesAt}` : 'Closed'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
