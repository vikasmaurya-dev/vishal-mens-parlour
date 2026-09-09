import { Menu, MessageCircle, Phone, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { businessSettings } from '../constants/seedData'
import { Brand } from '../components/common/Brand'

const links = [
  ['Services', '/services'],
  ['Gallery', '/gallery'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const whatsappUrl = `https://wa.me/${businessSettings.whatsapp.replace(/\D/g, '')}`
  const telUrl = `tel:${businessSettings.phone}`

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
            <a className="btn secondary" href={whatsappUrl}>
              <MessageCircle size={17} /> WhatsApp
            </a>
            <a className="btn secondary" href={telUrl}>
              <Phone size={17} /> Call
            </a>
            <NavLink className="btn nav-cta" to="/book">
              Book Appointment
            </NavLink>
            <button
              className="btn ghost mobile-menu"
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMenuOpen(false)}
          role="button"
          aria-label="Close menu"
          tabIndex={-1}
        />
      )}
      <aside className={`mobile-drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-drawer-links">
          {links.map(([label, href]) => (
            <NavLink key={href} to={href} onClick={() => setMenuOpen(false)}>
              {label}
            </NavLink>
          ))}
        </div>
        <div className="mobile-drawer-actions">
          <NavLink className="btn" to="/book" onClick={() => setMenuOpen(false)}>
            Book Appointment
          </NavLink>
          <a className="btn secondary" href={whatsappUrl}>
            <MessageCircle size={17} /> WhatsApp
          </a>
          <a className="btn secondary" href={telUrl}>
            <Phone size={17} /> Call
          </a>
        </div>
      </aside>

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
