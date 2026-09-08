import { ArrowRight, BriefcaseBusiness, CalendarCheck, Clock, Flag, Home, MapPin, MessageCircle, Phone, Scissors, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { siteOptions } from '../../constants/seedData'
import { ServiceCard } from '../../components/common/ServiceCard'
import { formatMoney } from '../../utils/format'
import { usePublicData } from '../../hooks/usePublicData'

export function HomePage() {
  const { business: businessSettings, categories, galleryItems, offers, services } = usePublicData()
  const featured = services.filter((service) => service.featured).slice(0, 6)
  const mainOffer = offers.find((offer) => offer.featured) ?? offers[0]

  return (
    <main>
      <section className="hero" style={{ '--hero-image': `url(${businessSettings.heroImage})` } as CSSProperties}>
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <span className="eyebrow">Premium men’s grooming • {businessSettings.city}</span>
          <h1>Precision Grooming. Confident Style.</h1>
          <p>
            Professional grooming, personal attention, and effortless appointment booking designed around your style.
          </p>
          <div className="hero-actions">
            <Link className="btn" to="/book">
              Book Appointment
            </Link>
            <Link className="btn secondary" to="/services">
              Explore Services
            </Link>
          </div>
        </motion.div>
      </section>
      <div className="quick-actions home-actions">
        <span>
          <Clock size={21} />
          <strong>Open Now</strong>
          <small>9 AM - 9 PM</small>
        </span>
        <a href={`tel:${businessSettings.phone}`}>
          <Phone size={21} />
          <strong>Call Us</strong>
          <small>{businessSettings.phone}</small>
        </a>
        <a href={`https://wa.me/${businessSettings.whatsapp.replace(/\D/g, '')}`}>
          <MessageCircle size={21} />
          <strong>WhatsApp</strong>
          <small>Message Us</small>
        </a>
        <a href={businessSettings.mapsUrl}>
          <MapPin size={21} />
          <strong>Directions</strong>
          <small>{businessSettings.city}</small>
        </a>
        <Link to="/book">
          <CalendarCheck size={21} />
          <strong>Book</strong>
          <small>Reserve Seat</small>
        </Link>
      </div>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Find Your Grooming Service</h2>
          <p className="section-intro">Choose from signature cuts, traditional shaves, skin care, and complete packages.</p>
          <div className="grid category-grid">
            {categories.map((category) => (
              <Link className="image-card" key={category.id} to={`/services#${category.slug}`}>
                <img src={category.imagePath} alt={category.name} loading="lazy" />
                <strong>{category.name}</strong>
                <ArrowRight size={18} className="image-card-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <h2 className="section-title">Our Most Popular Services</h2>
          <div className="grid service-grid popular-grid">
            {featured.map((service) => (
              <ServiceCard key={service.id} service={service} compact />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 34 }}>
            <Link className="btn secondary" to="/services">
              View all services & pricing
            </Link>
          </div>
        </div>
      </section>

      {siteOptions.enableVisitInfoSection && (
        <section className="section visit-section">
          <div className="container">
            <h2 className="section-title">Visit Vishal Mens Parlour</h2>
            <p className="section-intro">Find us in Golghar and book your seat before you arrive.</p>
            <div className="visit-grid">
              <article className="visit-card">
                <div className="visit-card-head">
                  <h3 className="serif">Vishal Mens Parlour, Golghar</h3>
                  <p>Premium grooming for men in {businessSettings.city}.</p>
                </div>
                <div className="visit-info-list">
                  <p>
                    <BriefcaseBusiness size={21} />
                    <span>Civil lines, Golghar, Gorakhpur</span>
                  </p>
                  <p>
                    <Home size={21} />
                    <span>
                      {businessSettings.address}
                      <br />
                      {businessSettings.city} - {businessSettings.pinCode}
                    </span>
                  </p>
                  <p>
                    <Flag size={21} />
                    <span>{businessSettings.landmark}</span>
                  </p>
                  <p>
                    <Phone size={21} />
                    <span>{businessSettings.phone}</span>
                  </p>
                  <p>
                    <Clock size={21} />
                    <span>Open Now · 9 AM - 9 PM</span>
                  </p>
                </div>
                <div className="visit-actions">
                  <a className="gold-btn" href={businessSettings.mapsUrl}>
                    <MapPin size={18} /> Directions
                  </a>
                  <a className="visit-link" href={`tel:${businessSettings.phone}`}>
                    Call
                  </a>
                  <a className="visit-link" href={`https://wa.me/${businessSettings.whatsapp.replace(/\D/g, '')}`}>
                    WhatsApp
                  </a>
                  <Link className="visit-link" to="/book">
                    Book Now
                  </Link>
                </div>
              </article>
              <figure className="visit-image">
                <img src={businessSettings.shopImage} alt="Interior of Vishal Mens Parlour" loading="lazy" />
              </figure>
            </div>
          </div>
        </section>
      )}

      <section className="section offers-section">
        <div className="container">
          <h2 className="section-title">Current Offers & Packages</h2>
          <div className="offer-panel">
          <article className="offer-feature home-offer">
            <span className="eyebrow">Featured package</span>
            <h2 className="serif" style={{ fontSize: 38, lineHeight: 1.05 }}>
              {mainOffer.title}
            </h2>
            <p style={{ maxWidth: 560 }}>{mainOffer.description}</p>
            <p style={{ fontSize: 34, fontWeight: 900 }}>
              {formatMoney(mainOffer.offerPrice)}{' '}
              <span style={{ color: '#aaa', fontSize: 18, textDecoration: 'line-through' }}>
                {formatMoney(mainOffer.originalPrice)}
              </span>
            </p>
            <Link className="btn ghost" to="/book">
              Claim Offer
            </Link>
          </article>
          <div className="offer-side">
            {offers
              .filter((offer) => !offer.featured)
              .map((offer) => (
                <article className="plain-card" key={offer.id}>
                  <strong>{offer.title}</strong>
                  <p className="muted">{offer.description}</p>
                  <p>{formatMoney(offer.offerPrice)} now</p>
                </article>
              ))}
          </div>
          </div>
        </div>
      </section>

      <section className="section dark story-section">
        <div className="container split">
          <img src={galleryItems[2].imagePath} alt="Vishal Mens Parlour interior" loading="lazy" />
          <div>
            <span className="eyebrow">More than just a haircut</span>
            <h2 className="section-title" style={{ textAlign: 'left' }}>
              Every client leaves sharper than they arrived.
            </h2>
            <p style={{ color: '#ddd', lineHeight: 1.7 }}>
              Personal consultation, hygienic tools, and a booking system that keeps your visit smooth from the first
              tap to the final finish.
            </p>
            <div className="grid" style={{ marginTop: 18 }}>
              {['Personalized consultation before every service', 'Modern tools with traditional barbering discipline', 'Clean appointment flow with verified guest booking'].map((item) => (
                <p key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#ddd' }}>
                  <Star size={16} color="var(--warm-2)" /> {item}
                </p>
              ))}
            </div>
            <Link className="btn ghost" to="/about" style={{ marginTop: 24 }}>
              Discover Our Story <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section home-final-cta">
        <div className="container">
          <Scissors size={26} style={{ margin: '0 auto 14px' }} />
          <h2 className="serif" style={{ fontSize: 34 }}>Ready for your next appointment?</h2>
          <Link className="btn ghost" to="/book" style={{ marginTop: 18 }}>
            Book Appointment Now
          </Link>
        </div>
      </section>
    </main>
  )
}
