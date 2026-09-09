import { CheckCircle2, Lock, Scissors } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '../../components/common/Brand'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'

export function AdminResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setError('Password reset is not available in demo mode.')
      return
    }
    // Supabase parses the recovery token from the URL hash and installs a session.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!supabase) return
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setDone(true)
    setTimeout(() => navigate('/admin/login', { replace: true }), 1500)
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 12, textAlign: 'center' }}>
          <Scissors size={34} />
          <Brand />
          <p className="eyebrow">Set new password</p>
        </div>
        {done ? (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <CheckCircle2 size={42} color="var(--success)" />
            <p>Password updated. Redirecting to login…</p>
          </div>
        ) : !ready ? (
          <p className="muted" style={{ marginTop: 16 }}>
            Verifying reset link…
          </p>
        ) : (
          <>
            <div className="field" style={{ marginTop: 20 }}>
              <label htmlFor="new-password">New password</label>
              <span style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, top: 14 }} />
                <input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ paddingLeft: 42 }} required minLength={8} />
              </span>
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm password</label>
              <span style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, top: 14 }} />
                <input id="confirm-password" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} style={{ paddingLeft: 42 }} required minLength={8} />
              </span>
            </div>
            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
            <button className="btn" style={{ width: '100%' }} type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save new password'}
            </button>
            <Link className="muted" to="/admin/login" style={{ display: 'inline-block', marginTop: 16 }}>
              Back to login
            </Link>
          </>
        )}
      </form>
    </main>
  )
}
