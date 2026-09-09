import { useEffect, useState } from 'react'
import { businessHours, businessSettings, bookingSettings, categories, galleryItems, offers, services, testimonials } from '../constants/seedData'
import { getPublicData } from '../services/cms'

const fallback = {
  business: businessSettings,
  categories,
  services,
  offers,
  galleryItems,
  businessHours,
  bookingSettings,
  testimonials,
}

export function usePublicData() {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getPublicData()
      .then((next) => {
        if (active) setData(next)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { ...data, loading }
}
