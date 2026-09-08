import { Menu, MessageCircle, Phone } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { businessSettings } from '../constants/seedData'
import { Brand } from '../components/common/Brand'

const links = [
  ['Services', '/services'],
  ['Gallery', '/gallery'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

export function PublicLayout() {
  return (
    <>
      <div className="top-strip">
        <span>Premium grooming, daily 9 AM - 9 PM</span>
        <span>{businessSettings.city}</span>
      </div>
      <header className="public-header">
        <nav className="container public-nav" aria-label="Main navigation">
          <NavLink to="/" aria-label="Home">
            <Brand compact />
          </NavLink>
          <div className="nav-links">
            {links.map(([label, href]) => (
              <NavLink key={href} to={href}>
                {label}
              </NavLink>
            ))}
          </div>
          <div className="actions">
            <a className="btn secondary" href={`https://wa.me/${businessSettings.whatsapp.replace(/\D/g, '')}`}>
              <MessageCircle size={17} /> WhatsApp
            </a>
            <a className="btn secondary" href={`tel:${businessSettings.phone}`}>
              <Phone size={17} /> Call
            </a>
            <NavLink className="btn nav-cta" to="/book">
              Book Appointment
            </NavLink>
            <button className="btn ghost mobile-menu" type="button" aria-label="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </header>
      <Outlet />
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <Brand />
            <p style={{ marginTop: 18 }}>Elevating men’s grooming with traditional technique and modern detail.</p>
          </div>
          <div>
            <strong>Explore</strong>
            <p>
              <NavLink to="/services">Services</NavLink>
            </p>
            <p>
              <NavLink to="/gallery">Gallery</NavLink>
            </p>
            <p>
              <NavLink to="/about">About</NavLink>
            </p>
          </div>
          <div>
            <strong>Visit</strong>
            <p>{businessSettings.address}</p>
            <p>{businessSettings.landmark}</p>
          </div>
          <div>
            <strong>Legal</strong>
            <p>Privacy Policy</p>
            <p>Terms of Service</p>
          </div>
        </div>
        <p className="container" style={{ marginTop: 42 }}>
          © 2026 Vishal Mens Parlour. All rights reserved.
        </p>
      </footer>
    </>
  )
}
