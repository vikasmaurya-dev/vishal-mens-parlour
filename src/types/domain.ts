export type PricingType = 'FIXED' | 'STARTING_FROM' | 'CONSULTATION'
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
export type AdminRole = 'OWNER' | 'ADMIN' | 'STAFF'

export interface BusinessSettings {
  salonName: string
  tagline: string
  phone: string
  whatsapp: string
  email: string
  address: string
  landmark: string
  city: string
  state: string
  pinCode: string
  mapsUrl: string
  timezone: string
  currency: 'INR'
  heroImage: string
  shopImage: string
  galleryHeroImage: string
  servicesHeroImage: string
}

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  description: string
  imagePath: string
  active?: boolean
  displayOrder: number
}

export interface Service {
  id: string
  name: string
  slug: string
  categoryId: string
  shortDescription: string
  description: string
  price: number | null
  discountPrice: number | null
  pricingType: PricingType
  durationMinutes: number
  imagePath: string
  featured: boolean
  bookable: boolean
  active: boolean
  displayOrder: number
}

export interface Offer {
  id: string
  title: string
  description: string
  imagePath?: string
  originalPrice: number
  offerPrice: number
  active: boolean
  featured: boolean
  ctaLabel?: string
  displayOrder?: number
}

export interface GalleryItem {
  id: string
  categoryId?: string
  mediaId?: string
  category: string
  caption: string
  imagePath: string
  thumbnailPath: string
  featured: boolean
  visible: boolean
  displayOrder?: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  firstVisit: string
  lastVisit: string
  appointmentCount: number
}

export interface Appointment {
  id: string
  bookingReference: string
  customerName: string
  customerPhone: string
  serviceName: string
  serviceId: string
  staffName: string
  startAt: string
  endAt: string
  status: AppointmentStatus
  servicePriceSnapshot: number
  customerNotes?: string
}

export interface BusinessHour {
  weekday: number
  isOpen: boolean
  opensAt: string
  closesAt: string
}

export interface BlockedTime {
  id: string
  startAt: string
  endAt: string
  reason: string
  staffId?: string
}

export interface StaffMember {
  id: string
  name: string
  title: string
  phone?: string
  active: boolean
  displayOrder: number
}

export interface AdminProfile {
  id: string
  fullName: string
  role: AdminRole
  active: boolean
}

export interface Testimonial {
  id: string
  customerName: string
  rating: number
  review: string
  imagePath?: string
  featured: boolean
  active: boolean
}

export interface BookingSettings {
  bookingEnabled: boolean
  otpRequired: boolean
  advanceBookingDays: number
  minimumNoticeMinutes: number
  slotIntervalMinutes: number
}
