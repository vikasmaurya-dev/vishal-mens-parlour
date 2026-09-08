import { Link } from 'react-router-dom'
import { businessSettings, galleryItems } from '../../constants/seedData'

export function AboutPage() {
  return (
    <main>
      <section className="section">
        <div className="container split">
          <img src={galleryItems[2].imagePath} alt="Salon chair and workstation" />
          <div>
            <span className="eyebrow">Our heritage</span>
            <h1 className="section-title" style={{ textAlign: 'left' }}>
              Traditional care, modern appointment discipline.
            </h1>
            <p className="muted" style={{ lineHeight: 1.8 }}>
              Vishal Mens Parlour is shaped around reliable grooming, warm service, and a CMS that lets the team update
              services, offers, photos, hours, and booking rules without developer help.
            </p>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 24 }}>
              {['Personal consultation', 'Hygienic tools', 'Clear scheduling'].map((item) => (
                <article className="plain-card" key={item}>
                  <strong>{item}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="section alt">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Visit {businessSettings.city}</h2>
          <p className="section-intro">
            {businessSettings.address}. {businessSettings.landmark}.
          </p>
          <Link className="btn" to="/book" style={{ marginTop: 24 }}>
            Book Appointment
          </Link>
        </div>
      </section>
    </main>
  )
}
