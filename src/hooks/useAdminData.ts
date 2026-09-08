import { useCallback, useEffect, useState } from 'react'
import { getAdminData } from '../services/cms'

type AdminData = Awaited<ReturnType<typeof getAdminData>>

export function useAdminData() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (showLoading: boolean) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      setData(await getAdminData())
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : 'Admin data load nahi ho paya.')
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => load(true), [load])

  useEffect(() => {
    let active = true
    getAdminData()
      .then((adminData) => {
        if (active) setData(adminData)
      })
      .catch((adminError: unknown) => {
        if (active) setError(adminError instanceof Error ? adminError.message : 'Admin data load nahi ho paya.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { data, loading, error, refresh }
}
