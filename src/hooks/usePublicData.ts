import { useEffect, useState } from 'react'
import { businessHours, businessSettings, bookingSettings, categories, galleryItems, offers, services } from '../constants/seedData'
import { getPublicData } from '../services/cms'

const fallback = {
  business: businessSettings,
  categories,
  services,
  offers,
  galleryItems,
  businessHours,
  bookingSettings,
}

export function usePublicData() {
  const [data, setData] = useState(fallback)

  useEffect(() => {
    let active = true
    getPublicData().then((next) => {
      if (active) setData(next)
    })
    return () => {
      active = false
    }
  }, [])

  return data
}
