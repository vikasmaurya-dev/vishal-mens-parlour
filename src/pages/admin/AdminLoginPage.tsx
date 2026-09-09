import { ArrowRight, EyeOff, Lock, Mail, Scissors } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brand } from '../../components/common/Brand'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!hasSupabaseConfig || !supabase) {
      navigate('/admin')
      return
    }
    setLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError('Email or password is incorrect.')
      return
    }
    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle()
    if (profileError || !profile) {
      await supabase.auth.signOut()
      setError('This account is not authorized for the admin panel.')
      return
    }
    navigate('/admin')
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 12, textAlign: 'center' }}>
          <Scissors size={34} />
          <Brand />
          <p className="eyebrow">Admin Panel</p>
        </div>
        <div className="field" style={{ marginTop: 30 }}>
          <label htmlFor="admin-email">Email Address</label>
          <span style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: 12, top: 14 }} />
            <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@vishalparlour.com" style={{ paddingLeft: 42 }} required />
          </span>
        </div>
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <label htmlFor="admin-password">Password</label>
            <a className="muted" href="/admin/forgot-password">Forgot Password?</a>
          </div>
          <span style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: 12, top: 14 }} />
            <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ paddingLeft: 42, paddingRight: 42 }} required />
            <EyeOff size={18} style={{ position: 'absolute', right: 12, top: 14 }} />
          </span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <input type="checkbox" /> Remember Me
        </label>
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <button className="btn" style={{ width: '100%' }} type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'} <ArrowRight size={17} />
        </button>
      </form>
    </main>
  )
}
