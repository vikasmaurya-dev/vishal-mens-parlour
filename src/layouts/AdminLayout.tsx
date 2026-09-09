import { Bell, Calendar, CalendarCheck, ContactRound, LayoutDashboard, LogOut, Menu, PanelTop, Scissors, Search, Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../components/common/Brand'
import { supabase } from '../lib/supabase'

const navItems = [
  ['Dashboard', '/admin', LayoutDashboard],
  ['Appointments', '/admin/appointments', CalendarCheck],
  ['Calendar', '/admin/calendar', Calendar],
  ['Customers', '/admin/customers', ContactRound],
  ['Services', '/admin/services', Scissors],
  ['Website Content', '/admin/content', PanelTop],
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  const sidebarContent = (
    <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', flexDirection: 'column' }}>
      <Brand />
      <p className="muted">Management Panel</p>
      <nav className="admin-nav" aria-label="Admin navigation">
        {navItems.map(([label, href, Icon]) => (
          <NavLink key={href as string} to={href as string} end={href === '/admin'}>
            <Icon size={22} /> {label as string}
          </NavLink>
        ))}
      </nav>
      <div className="admin-profile">
        <span className="status" style={{ borderRadius: 999, background: '#000', color: '#fff' }}>
          VA
        </span>
        <div>
          <strong>Vishal Admin</strong>
          <p className="muted">Owner</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar admin-sidebar-desktop">
        {sidebarContent}
      </aside>

      {menuOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={() => setMenuOpen(false)}
          role="button"
          aria-label="Close menu"
          tabIndex={-1}
        />
      )}
      <aside className={`admin-sidebar admin-sidebar-drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        {sidebarContent}
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-lead">
            <button
              className="btn ghost admin-mobile-menu"
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <label className="field" style={{ margin: 0, flex: 1 }}>
              <span className="sr-only">Search admin records</span>
              <span style={{ position: 'relative', display: 'block' }}>
                <Search size={18} style={{ position: 'absolute', top: 14, left: 14 }} />
                <input style={{ paddingLeft: 42, width: '100%' }} placeholder="Search appointments, clients, services..." />
              </span>
            </label>
          </div>
          <div className="actions">
            <a href="/admin/content" className="topbar-settings-link">Settings</a>
            <Bell size={22} />
            <Settings size={22} className="topbar-gear-icon" />
            <button className="icon-action" onClick={() => void signOut()} type="button" aria-label="Logout">
              <LogOut size={18} />
            </button>
            <span className="status">VA</span>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
        <footer className="admin-footer">
          <strong>© 2026 Vishal Mens Parlour Admin Panel.</strong>
          <span className="muted">Privacy Policy · Terms of Service · API Documentation</span>
        </footer>
      </main>
    </div>
  )
}
