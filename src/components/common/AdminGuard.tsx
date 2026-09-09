import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'

type Status = 'checking' | 'allowed' | 'denied'

interface Props {
  children: ReactNode
}

export function AdminGuard({ children }: Props) {
  const location = useLocation()
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setStatus(import.meta.env.DEV ? 'allowed' : 'denied')
      return
    }
    let active = true

    async function verify() {
      const { data: sessionData } = await supabase!.auth.getUser()
      if (!active) return
      if (!sessionData.user) {
        setStatus('denied')
        return
      }
      const { data: profile, error } = await supabase!
        .from('admin_profiles')
        .select('id, active')
        .eq('id', sessionData.user.id)
        .maybeSingle()
      if (!active) return
      if (error || !profile || profile.active === false) {
        await supabase!.auth.signOut()
        setStatus('denied')
        return
      }
      setStatus('allowed')
    }

    void verify()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      if (!session?.user) setStatus('denied')
      else void verify()
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  if (status === 'checking') {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <p className="muted">Checking admin access…</p>
      </div>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
