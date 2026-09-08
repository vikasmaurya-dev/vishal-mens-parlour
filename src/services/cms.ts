import {
  appointments,
  blockedTimes,
  bookingSettings,
  businessHours,
  businessSettings,
  categories,
  customers,
  galleryItems,
  offers,
  services,
} from '../constants/seedData'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import type {
  Appointment,
  AppointmentStatus,
  AdminProfile,
  BlockedTime,
  BookingSettings,
  BusinessHour,
  BusinessSettings,
  Customer,
  GalleryItem,
  Offer,
  Service,
  ServiceCategory,
  StaffMember,
} from '../types/domain'

async function fromSupabase<T>(table: string, fallback: T[], orderColumn = 'display_order'): Promise<T[]> {
  if (!hasSupabaseConfig || !supabase) return fallback
  const { data, error } = await supabase.from(table).select('*').order(orderColumn)
  if (error || !data?.length) return fallback
  return data as T[]
}

function mapCategory(row: Record<string, unknown>): ServiceCategory {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ''),
    imagePath: String(row.image_path ?? ''),
    active: row.active === undefined ? true : Boolean(row.active),
    displayOrder: Number(row.display_order ?? 0),
  }
}

function mapService(row: Record<string, unknown>): Service {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    categoryId: String(row.category_id),
    shortDescription: String(row.short_description ?? ''),
    description: String(row.description ?? ''),
    price: row.price === null ? null : Number(row.price),
    discountPrice: row.discount_price === null ? null : Number(row.discount_price),
    pricingType: row.pricing_type as Service['pricingType'],
    durationMinutes: Number(row.duration_minutes),
    imagePath: String(row.image_path ?? ''),
    featured: Boolean(row.featured),
    bookable: Boolean(row.bookable),
    active: Boolean(row.active),
    displayOrder: Number(row.display_order ?? 0),
  }
}

function serviceToRow(service: Omit<Service, 'id'>) {
  return {
    name: service.name,
    slug: service.slug,
    category_id: service.categoryId,
    short_description: service.shortDescription,
    description: service.description,
    price: service.price,
    discount_price: service.discountPrice,
    pricing_type: service.pricingType,
    duration_minutes: service.durationMinutes,
    image_path: service.imagePath,
    featured: service.featured,
    bookable: service.bookable,
    active: service.active,
    display_order: service.displayOrder,
    updated_at: new Date().toISOString(),
  }
}

function mapBusinessHour(row: Record<string, unknown>): BusinessHour {
  return {
    weekday: Number(row.weekday),
    isOpen: Boolean(row.is_open),
    opensAt: String(row.opens_at).slice(0, 5),
    closesAt: String(row.closes_at).slice(0, 5),
  }
}

function mapBookingSettings(row: Record<string, unknown>): BookingSettings {
  return {
    bookingEnabled: Boolean(row.booking_enabled),
    otpRequired: Boolean(row.otp_required),
    advanceBookingDays: Number(row.advance_booking_days ?? bookingSettings.advanceBookingDays),
    minimumNoticeMinutes: Number(row.minimum_notice_minutes ?? bookingSettings.minimumNoticeMinutes),
    slotIntervalMinutes: Number(row.slot_interval_minutes ?? bookingSettings.slotIntervalMinutes),
  }
}

function mapOffer(row: Record<string, unknown>): Offer {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description ?? ''),
    imagePath: row.image_path ? String(row.image_path) : undefined,
    originalPrice: Number(row.original_price ?? 0),
    offerPrice: Number(row.offer_price ?? 0),
    active: Boolean(row.active),
    featured: Boolean(row.featured),
    ctaLabel: row.cta_label ? String(row.cta_label) : undefined,
    displayOrder: Number(row.display_order ?? 0),
  }
}

function mapGalleryItem(row: Record<string, unknown>): GalleryItem {
  const media = row.media ?? row.media_id
  const mediaPath = media && typeof media === 'object' ? (media as { path?: string }).path : undefined
  const category = row.gallery_categories && typeof row.gallery_categories === 'object'
    ? (row.gallery_categories as { name?: string }).name
    : row.category
  const imagePath = String(row.image_path ?? mediaPath ?? '')
  return {
    id: String(row.id),
    categoryId: row.category_id ? String(row.category_id) : undefined,
    mediaId: row.media_id ? String(row.media_id) : undefined,
    category: String(category ?? 'Gallery'),
    caption: String(row.caption ?? ''),
    imagePath,
    thumbnailPath: imagePath,
    featured: Boolean(row.featured),
    visible: Boolean(row.visible),
    displayOrder: Number(row.display_order ?? 0),
  }
}

function mapStaff(row: Record<string, unknown>): StaffMember {
  return {
    id: String(row.id),
    name: String(row.name),
    title: String(row.title ?? ''),
    phone: row.phone ? String(row.phone) : undefined,
    active: Boolean(row.active),
    displayOrder: Number(row.display_order ?? 0),
  }
}

function mapAdminProfile(row: Record<string, unknown>): AdminProfile {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    role: row.role as AdminProfile['role'],
    active: Boolean(row.active),
  }
}

function pickJoinedName(value: unknown, fallback = '') {
  if (Array.isArray(value)) return String((value[0] as { name?: unknown } | undefined)?.name ?? fallback)
  if (value && typeof value === 'object') return String((value as { name?: unknown }).name ?? fallback)
  return fallback
}

function pickJoinedPhone(value: unknown, fallback = '') {
  if (Array.isArray(value)) return String((value[0] as { phone?: unknown } | undefined)?.phone ?? fallback)
  if (value && typeof value === 'object') return String((value as { phone?: unknown }).phone ?? fallback)
  return fallback
}

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : undefined,
    firstVisit: String(row.first_visit ?? ''),
    lastVisit: String(row.last_visit ?? ''),
    appointmentCount: Number(row.appointment_count ?? 0),
  }
}

function mapAppointment(row: Record<string, unknown>): Appointment {
  const customer = row.customers
  const service = row.services
  const staff = row.staff

  return {
    id: String(row.id),
    bookingReference: String(row.booking_reference),
    customerName: pickJoinedName(customer, 'Guest Customer'),
    customerPhone: pickJoinedPhone(customer),
    serviceName: pickJoinedName(service, 'Selected Service'),
    serviceId: String(row.service_id),
    staffName: pickJoinedName(staff, 'Any Staff'),
    startAt: String(row.start_at),
    endAt: String(row.end_at),
    status: row.status as AppointmentStatus,
    servicePriceSnapshot: Number(row.service_price_snapshot ?? 0),
    customerNotes: row.customer_notes ? String(row.customer_notes) : undefined,
  }
}

export async function getPublicData() {
  const categoryRows = await fromSupabase<Record<string, unknown>>('service_categories', categories as unknown as Record<string, unknown>[])
  const serviceRows = await fromSupabase<Record<string, unknown>>('services', services as unknown as Record<string, unknown>[])
  const offerRows = await fromSupabase<Record<string, unknown>>('offers', offers as unknown as Record<string, unknown>[])
  const businessRows = await fromSupabase<Record<string, unknown>>('business_settings', [businessSettings] as unknown as Record<string, unknown>[], 'created_at')
  const hoursRows = await fromSupabase<Record<string, unknown>>('business_hours', businessHours as unknown as Record<string, unknown>[], 'weekday')
  const galleryRows = hasSupabaseConfig && supabase
    ? (await supabase
        .from('gallery_items')
        .select('id, category_id, media_id, caption, featured, visible, display_order, gallery_categories(name), media(path)')
        .order('display_order')).data ?? []
    : galleryItems as unknown as Record<string, unknown>[]
  const assetRows = hasSupabaseConfig && supabase
    ? (await supabase.from('page_content').select('content').eq('page_key', 'site').eq('section_key', 'assets').maybeSingle()).data
    : null

  const businessRow = businessRows[0]
  const siteAssets = assetRows?.content && typeof assetRows.content === 'object'
    ? assetRows.content as Partial<Pick<BusinessSettings, 'heroImage' | 'shopImage' | 'galleryHeroImage' | 'servicesHeroImage'>>
    : {}
  const business: BusinessSettings = businessRow?.salon_name
    ? {
        ...businessSettings,
        ...siteAssets,
        salonName: String(businessRow.salon_name),
        tagline: String(businessRow.tagline ?? businessSettings.tagline),
        phone: String(businessRow.phone),
        whatsapp: String(businessRow.whatsapp),
        email: String(businessRow.email ?? businessSettings.email),
        address: String(businessRow.address),
        landmark: String(businessRow.landmark ?? businessSettings.landmark),
        city: String(businessRow.city),
        state: String(businessRow.state),
        pinCode: String(businessRow.pin_code ?? businessSettings.pinCode),
        mapsUrl: String(businessRow.google_maps_url ?? businessSettings.mapsUrl),
      }
    : businessSettings

  return {
    business,
    categories: categoryRows[0]?.image_path ? categoryRows.map(mapCategory) : categories,
    services: serviceRows[0]?.category_id ? serviceRows.map(mapService) : services,
    offers: offerRows[0]?.offer_price ? offerRows.map(mapOffer) : offers,
    galleryItems: galleryRows[0]?.visible !== undefined ? galleryRows.map(mapGalleryItem) : galleryItems,
    businessHours: hoursRows.length ? hoursRows.map(mapBusinessHour) : businessHours,
    bookingSettings: businessRow?.booking_enabled !== undefined ? mapBookingSettings(businessRow) : bookingSettings,
  }
}

export async function getAdminData() {
  if (!hasSupabaseConfig || !supabase) {
    return {
      business: businessSettings,
      categories,
      services,
      offers,
      galleryItems,
      businessHours,
      bookingSettings,
      blockedTimes,
      appointments,
      customers,
      staff: [],
      adminProfiles: [],
      source: 'seed' as const,
    }
  }

  const [publicData, appointmentResult, customerResult, blockedTimeResult, staffResult, adminProfileResult] = await Promise.all([
    getPublicData(),
    supabase
      .from('appointments')
      .select(`
        id,
        booking_reference,
        service_id,
        staff_id,
        start_at,
        end_at,
        status,
        service_price_snapshot,
        customer_notes,
        customers(name, phone),
        services(name),
        staff(name)
      `)
      .order('start_at', { ascending: true }),
    supabase.from('customers').select('*').order('last_visit', { ascending: false }),
    supabase.from('blocked_times').select('*').order('start_at', { ascending: true }),
    supabase.from('staff').select('*').order('display_order', { ascending: true }),
    supabase.from('admin_profiles').select('*').order('created_at', { ascending: false }),
  ])

  return {
    ...publicData,
    blockedTimes: blockedTimeResult.data?.length ? blockedTimeResult.data.map((row) => ({
      id: String(row.id),
      startAt: String(row.start_at),
      endAt: String(row.end_at),
      reason: String(row.reason ?? 'Blocked'),
      staffId: row.staff_id ? String(row.staff_id) : undefined,
    })) : blockedTimes,
    appointments: appointmentResult.data?.length
      ? appointmentResult.data.map((row) => mapAppointment(row as Record<string, unknown>))
      : appointments,
    customers: customerResult.data?.length
      ? customerResult.data.map((row) => mapCustomer(row as Record<string, unknown>))
      : customers,
    staff: staffResult.data?.length ? staffResult.data.map((row) => mapStaff(row as Record<string, unknown>)) : [],
    adminProfiles: adminProfileResult.data?.length
      ? adminProfileResult.data.map((row) => mapAdminProfile(row as Record<string, unknown>))
      : [],
    source: (appointmentResult.error || customerResult.error || blockedTimeResult.error || staffResult.error || adminProfileResult.error) ? 'fallback' as const : 'supabase' as const,
  }
}

export async function updateServiceFlags(serviceId: string, changes: Partial<Pick<Service, 'active' | 'bookable'>>) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }

  const updateFields: { active?: boolean; bookable?: boolean; updated_at: string } = {
    updated_at: new Date().toISOString(),
  }
  if (typeof changes.active === 'boolean') updateFields.active = changes.active
  if (typeof changes.bookable === 'boolean') updateFields.bookable = changes.bookable

  const { error } = await supabase
    .from('services')
    .update(updateFields)
    .eq('id', serviceId)

  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function saveService(service: Service) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }

  const { error } = await supabase
    .from('services')
    .update(serviceToRow(service))
    .eq('id', service.id)

  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function createService(service: Omit<Service, 'id'>) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }

  const { error } = await supabase
    .from('services')
    .insert(serviceToRow(service))

  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }

  const { error } = await supabase
    .from('appointments')
    .update({
      status,
      updated_at: new Date().toISOString(),
      completed_at: status === 'COMPLETED' ? new Date().toISOString() : null,
      cancelled_at: status === 'CANCELLED' ? new Date().toISOString() : null,
    })
    .eq('id', appointmentId)

  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function saveBusinessSettings(
  business: BusinessSettings,
  settings: BookingSettings,
  assets: Pick<BusinessSettings, 'heroImage' | 'shopImage' | 'galleryHeroImage' | 'servicesHeroImage'>,
) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }

  const row = {
    salon_name: business.salonName,
    tagline: business.tagline,
    phone: business.phone,
    whatsapp: business.whatsapp,
    email: business.email,
    address: business.address,
    landmark: business.landmark,
    city: business.city,
    state: business.state,
    pin_code: business.pinCode,
    google_maps_url: business.mapsUrl,
    timezone: business.timezone,
    currency: business.currency,
    booking_enabled: settings.bookingEnabled,
    otp_required: settings.otpRequired,
    advance_booking_days: settings.advanceBookingDays,
    minimum_notice_minutes: settings.minimumNoticeMinutes,
    slot_interval_minutes: settings.slotIntervalMinutes,
    updated_at: new Date().toISOString(),
  }
  const { data: existing } = await supabase.from('business_settings').select('id').limit(1).maybeSingle()
  const { error: businessError } = existing?.id
    ? await supabase.from('business_settings').update(row).eq('id', existing.id)
    : await supabase.from('business_settings').insert(row)
  if (businessError) throw businessError

  const { error: assetError } = await supabase.from('page_content').upsert({
    page_key: 'site',
    section_key: 'assets',
    content: assets,
    active: true,
  }, { onConflict: 'page_key,section_key' })
  if (assetError) throw assetError
  return { ok: true, localOnly: false }
}

export async function saveBusinessHours(hours: BusinessHour[]) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }
  const { error } = await supabase.from('business_hours').upsert(hours.map((hour) => ({
    weekday: hour.weekday,
    is_open: hour.isOpen,
    opens_at: hour.opensAt,
    closes_at: hour.closesAt,
  })), { onConflict: 'weekday' })
  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function saveCategory(category: ServiceCategory) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }
  const row = {
    name: category.name,
    slug: category.slug,
    description: category.description,
    image_path: category.imagePath,
    active: category.active ?? true,
    display_order: category.displayOrder,
    updated_at: new Date().toISOString(),
  }
  const { error } = category.id
    ? await supabase.from('service_categories').update(row).eq('id', category.id)
    : await supabase.from('service_categories').insert(row)
  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function deleteCategory(categoryId: string) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }
  const { error } = await supabase.from('service_categories').delete().eq('id', categoryId)
  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function saveOffer(offer: Offer) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }
  const row = {
    title: offer.title,
    description: offer.description,
    image_path: offer.imagePath ?? '',
    original_price: offer.originalPrice,
    offer_price: offer.offerPrice,
    featured: offer.featured,
    active: offer.active,
    cta_label: offer.ctaLabel ?? 'Claim Offer',
    display_order: offer.displayOrder ?? 99,
  }
  const { error } = offer.id
    ? await supabase.from('offers').update(row).eq('id', offer.id)
    : await supabase.from('offers').insert(row)
  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function deleteOffer(offerId: string) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }
  const { error } = await supabase.from('offers').delete().eq('id', offerId)
  if (error) throw error
  return { ok: true, localOnly: false }
}

async function getOrCreateGalleryCategory(name: string) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const { data: existing, error: readError } = await supabase
    .from('gallery_categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (readError) throw readError
  if (existing?.id) return String(existing.id)

  const { data, error } = await supabase
    .from('gallery_categories')
    .insert({ name, slug, display_order: 99 })
    .select('id')
    .single()
  if (error) throw error
  return String(data.id)
}

async function createMediaFromPath(path: string, altText: string) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('media')
    .insert({ bucket: path.startsWith('http') || path.startsWith('/') ? 'external' : 'site-media', path, alt_text: altText })
    .select('id')
    .single()
  if (error) throw error
  return String(data.id)
}

export async function saveGalleryItem(item: GalleryItem) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }
  const categoryId = item.categoryId ?? await getOrCreateGalleryCategory(item.category)
  const mediaId = item.mediaId ?? await createMediaFromPath(item.imagePath, item.caption)
  const row = {
    category_id: categoryId,
    media_id: item.imagePath && !item.mediaId ? mediaId : item.mediaId ?? mediaId,
    caption: item.caption,
    featured: item.featured,
    visible: item.visible,
    display_order: item.displayOrder ?? 99,
  }

  if (item.id) {
    const { error } = await supabase.from('gallery_items').update(row).eq('id', item.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('gallery_items').insert(row)
    if (error) throw error
  }
  return { ok: true, localOnly: false }
}

export async function deleteGalleryItem(itemId: string) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }
  const { error } = await supabase.from('gallery_items').delete().eq('id', itemId)
  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function uploadImageAsset(file: File) {
  if (!hasSupabaseConfig || !supabase) throw new Error('Supabase Storage is not configured.')
  const extension = file.name.split('.').pop() || 'jpg'
  const path = `uploads/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('site-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('site-media').getPublicUrl(path)
  return data.publicUrl
}

export async function saveBlockedTime(block: Omit<BlockedTime, 'id'> & { id?: string }) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }
  const row = {
    staff_id: block.staffId ?? null,
    start_at: block.startAt,
    end_at: block.endAt,
    reason: block.reason,
  }
  const { error } = block.id
    ? await supabase.from('blocked_times').update(row).eq('id', block.id)
    : await supabase.from('blocked_times').insert(row)
  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function deleteBlockedTime(blockId: string) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }
  const { error } = await supabase.from('blocked_times').delete().eq('id', blockId)
  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function createManualAppointment(payload: {
  customerName: string
  customerPhone: string
  customerEmail?: string
  serviceId: string
  staffId?: string
  startAt: string
  notes?: string
}) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, price, discount_price, duration_minutes')
    .eq('id', payload.serviceId)
    .single()
  if (serviceError) throw serviceError

  const phone = payload.customerPhone.replace(/\D/g, '')
  const normalizedPhone = phone.length === 10 ? `+91${phone}` : payload.customerPhone
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .upsert({
      name: payload.customerName,
      phone: normalizedPhone,
      email: payload.customerEmail ?? null,
      first_visit: payload.startAt.slice(0, 10),
      last_visit: payload.startAt.slice(0, 10),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'phone' })
    .select('id')
    .single()
  if (customerError) throw customerError

  const start = new Date(payload.startAt)
  const end = new Date(start.getTime() + Number(service.duration_minutes) * 60_000)
  const { error } = await supabase.from('appointments').insert({
    booking_reference: `VMP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    customer_id: customer.id,
    service_id: payload.serviceId,
    staff_id: payload.staffId || null,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    status: 'CONFIRMED',
    service_price_snapshot: service.discount_price ?? service.price ?? 0,
    customer_notes: payload.notes ?? '',
  })
  if (error) throw error
  return { ok: true, localOnly: false }
}

export async function saveAdminProfile(profile: AdminProfile) {
  if (!hasSupabaseConfig || !supabase) return { ok: true, localOnly: true }
  const { error } = await supabase.from('admin_profiles').upsert({
    id: profile.id,
    full_name: profile.fullName,
    role: profile.role,
    active: profile.active,
  })
  if (error) throw error
  return { ok: true, localOnly: false }
}
