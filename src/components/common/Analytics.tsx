import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
let bootstrapped = false

function bootstrap() {
  if (bootstrapped || !measurementId || typeof window === 'undefined') return
  bootstrapped = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false, anonymize_ip: true })
}

export function Analytics() {
  const location = useLocation()

  useEffect(() => {
    if (!measurementId) return
    bootstrap()
    window.gtag?.('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
    })
  }, [location.pathname, location.search])

  return null
}
