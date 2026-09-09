import { ArrowLeft, Mail, Scissors } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Brand } from '../../components/common/Brand'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'

export function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!hasSupabaseConfig || !supabase) {
      setError('Password reset is not available in demo mode.')
      return
    }
    setLoading(true)
    const redirectTo = `${window.location.origin}/admin/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setLoading(false)
    if (resetError) {
      setError('Could not send reset link. Please try again.')
      return
    }
    setSent(true)
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 12, textAlign: 'center' }}>
          <Scissors size={34} />
          <Brand />
          <p className="eyebrow">Reset Password</p>
        </div>
        {sent ? (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p>Check your inbox for a reset link. It may take a minute to arrive.</p>
            <Link className="btn secondary" to="/admin/login" style={{ marginTop: 16 }}>
              <ArrowLeft size={16} /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="muted" style={{ marginTop: 16 }}>
              Enter your admin email. We'll send you a secure link to set a new password.
            </p>
            <div className="field" style={{ marginTop: 20 }}>
              <label htmlFor="admin-email">Email Address</label>
              <span style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 12, top: 14 }} />
                <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} style={{ paddingLeft: 42 }} required />
              </span>
            </div>
            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
            <button className="btn" style={{ width: '100%' }} type="submit" disabled={loading}>
              {loading ? 'Sending link…' : 'Send reset link'}
            </button>
            <Link className="muted" to="/admin/login" style={{ display: 'inline-flex', gap: 6, marginTop: 16 }}>
              <ArrowLeft size={14} /> Back to login
            </Link>
          </>
        )}
      </form>
    </main>
  )
}
