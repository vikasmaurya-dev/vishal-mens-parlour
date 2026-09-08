import { Bell, Calendar, CalendarCheck, ContactRound, LayoutDashboard, LogOut, PanelTop, Scissors, Search, Settings } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Brand } from '../components/common/Brand'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import { useEffect } from 'react'

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

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (active && !data.user) navigate('/admin/login', { replace: true })
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && !session?.user) navigate('/admin/login', { replace: true })
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
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
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <label className="field" style={{ width: 'min(420px, 100%)', margin: 0 }}>
            <span className="sr-only">Search admin records</span>
            <span style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', top: 14, left: 14 }} />
              <input style={{ paddingLeft: 42 }} placeholder="Search appointments, clients, services..." />
            </span>
          </label>
          <div className="actions">
            <a href="/admin/content">Settings</a>
            <Bell size={22} />
            <Settings size={22} />
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
