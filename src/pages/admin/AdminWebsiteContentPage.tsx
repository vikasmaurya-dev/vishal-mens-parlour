import { ImageUp, Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAdminData } from '../../hooks/useAdminData'
import {
  deleteCategory,
  deleteGalleryItem,
  deleteOffer,
  saveAdminProfile,
  saveBusinessHours,
  saveBusinessSettings,
  saveCategory,
  saveGalleryItem,
  saveOffer,
  uploadImageAsset,
} from '../../services/cms'
import type { AdminProfile, BusinessHour, BusinessSettings, GalleryItem, Offer, ServiceCategory } from '../../types/domain'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const tabs = [
  { id: 'business', label: 'Business' },
  { id: 'hours', label: 'Hours' },
  { id: 'categories', label: 'Categories' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'offers', label: 'Offers' },
  { id: 'admins', label: 'Admins' },
] as const

type CmsTab = (typeof tabs)[number]['id']

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function AdminWebsiteContentPage() {
  const { data, loading, error, refresh } = useAdminData()
  const [saving, setSaving] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<CmsTab>('business')

  if (loading) return <AdminNotice title="Loading website content..." />
  if (error) return <AdminNotice title="Website content issue" detail={error} />
  if (!data) return null

  const runSave = async (label: string, action: () => Promise<unknown>) => {
    setSaving(label)
    setNotice(null)
    try {
      await action()
      await refresh()
      setNotice(`${label} saved.`)
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : `${label} save nahi ho paya.`)
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title" style={{ textAlign: 'left', margin: 0 }}>
            Website Content
          </h1>
          <p className="muted">Update website text, images, categories, gallery, offers, hours, and admin access.</p>
        </div>
        {notice && <span className="status">{notice}</span>}
      </div>
      <nav className="admin-tabs" aria-label="Website content sections">
        {tabs.map((tab) => (
          <button className={activeTab === tab.id ? 'active' : ''} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="cms-grid focused">
        {activeTab === 'business' && (
          <BusinessEditor data={data.business} settings={data.bookingSettings} onSave={(business, settings, assets) => runSave('Business content', () => saveBusinessSettings(business, settings, assets))} saving={saving === 'Business content'} />
        )}
        {activeTab === 'hours' && (
          <HoursEditor hours={data.businessHours} onSave={(hours) => runSave('Business hours', () => saveBusinessHours(hours))} saving={saving === 'Business hours'} />
        )}
        {activeTab === 'categories' && (
          <CategoryManager categories={data.categories} onSave={(category) => runSave('Category', () => saveCategory(category))} onDelete={(id) => runSave('Category delete', () => deleteCategory(id))} saving={Boolean(saving)} />
        )}
        {activeTab === 'gallery' && (
          <GalleryManager items={data.galleryItems} onSave={(item) => runSave('Gallery item', () => saveGalleryItem(item))} onDelete={(id) => runSave('Gallery delete', () => deleteGalleryItem(id))} onUpload={(file) => uploadImageAsset(file)} saving={Boolean(saving)} />
        )}
        {activeTab === 'offers' && (
          <OfferManager offers={data.offers} onSave={(offer) => runSave('Offer', () => saveOffer(offer))} onDelete={(id) => runSave('Offer delete', () => deleteOffer(id))} saving={Boolean(saving)} />
        )}
        {activeTab === 'admins' && (
          <AdminManager profiles={data.adminProfiles} onSave={(profile) => runSave('Admin profile', () => saveAdminProfile(profile))} saving={Boolean(saving)} />
        )}
      </div>
    </>
  )
}

function BusinessEditor({
  data,
  settings,
  onSave,
  saving,
}: {
  data: BusinessSettings
  settings: {
    bookingEnabled: boolean
    otpRequired: boolean
    advanceBookingDays: number
    minimumNoticeMinutes: number
    slotIntervalMinutes: number
  }
  onSave: (
    business: BusinessSettings,
    settings: {
      bookingEnabled: boolean
      otpRequired: boolean
      advanceBookingDays: number
      minimumNoticeMinutes: number
      slotIntervalMinutes: number
    },
    assets: Pick<BusinessSettings, 'heroImage' | 'shopImage' | 'galleryHeroImage' | 'servicesHeroImage'>,
  ) => void
  saving: boolean
}) {
  const [business, setBusiness] = useState(data)
  const [booking, setBooking] = useState(settings)

  return (
    <article className="plain-card cms-card wide">
      <h2 className="serif">Business Settings</h2>
      <div className="form-row">
        <Field label="Salon Name" value={business.salonName} onChange={(value) => setBusiness({ ...business, salonName: value })} />
        <Field label="Tagline" value={business.tagline} onChange={(value) => setBusiness({ ...business, tagline: value })} />
      </div>
      <div className="form-row">
        <Field label="Phone" value={business.phone} onChange={(value) => setBusiness({ ...business, phone: value })} />
        <Field label="WhatsApp" value={business.whatsapp} onChange={(value) => setBusiness({ ...business, whatsapp: value })} />
      </div>
      <Field label="Address" value={business.address} onChange={(value) => setBusiness({ ...business, address: value })} />
      <div className="form-row">
        <Field label="City" value={business.city} onChange={(value) => setBusiness({ ...business, city: value })} />
        <Field label="Google Maps URL" value={business.mapsUrl} onChange={(value) => setBusiness({ ...business, mapsUrl: value })} />
      </div>
      <div className="form-row">
        <Field label="Home Hero Image" value={business.heroImage} onChange={(value) => setBusiness({ ...business, heroImage: value })} />
        <Field label="Shop Image" value={business.shopImage} onChange={(value) => setBusiness({ ...business, shopImage: value })} />
      </div>
      <div className="form-row">
        <Field label="Services Hero Image" value={business.servicesHeroImage} onChange={(value) => setBusiness({ ...business, servicesHeroImage: value })} />
        <Field label="Gallery Hero Image" value={business.galleryHeroImage} onChange={(value) => setBusiness({ ...business, galleryHeroImage: value })} />
      </div>
      <div className="check-grid">
        <label><input checked={booking.bookingEnabled} onChange={(event) => setBooking({ ...booking, bookingEnabled: event.target.checked })} type="checkbox" /> Booking Enabled</label>
        <label><input checked={booking.otpRequired} onChange={(event) => setBooking({ ...booking, otpRequired: event.target.checked })} type="checkbox" /> OTP Required</label>
      </div>
      <button
        className="btn"
        disabled={saving}
        onClick={() => onSave(business, booking, {
          heroImage: business.heroImage,
          shopImage: business.shopImage,
          servicesHeroImage: business.servicesHeroImage,
          galleryHeroImage: business.galleryHeroImage,
        })}
        type="button"
      >
        <Save size={16} /> {saving ? 'Saving...' : 'Save Business Content'}
      </button>
    </article>
  )
}

function HoursEditor({ hours, onSave, saving }: { hours: BusinessHour[]; onSave: (hours: BusinessHour[]) => void; saving: boolean }) {
  const [items, setItems] = useState(hours)
  const update = (index: number, changes: Partial<BusinessHour>) => {
    setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item))
  }

  return (
    <article className="plain-card cms-card">
      <h2 className="serif">Business Hours</h2>
      {items.sort((a, b) => a.weekday - b.weekday).map((hour, index) => (
        <div className="hours-row" key={hour.weekday}>
          <label><input checked={hour.isOpen} onChange={(event) => update(index, { isOpen: event.target.checked })} type="checkbox" /> {dayNames[hour.weekday]}</label>
          <input value={hour.opensAt} onChange={(event) => update(index, { opensAt: event.target.value })} type="time" />
          <input value={hour.closesAt} onChange={(event) => update(index, { closesAt: event.target.value })} type="time" />
        </div>
      ))}
      <button className="btn" disabled={saving} onClick={() => onSave(items)} type="button">
        <Save size={16} /> Save Hours
      </button>
    </article>
  )
}

function CategoryManager({ categories, onSave, onDelete, saving }: {
  categories: ServiceCategory[]
  onSave: (category: ServiceCategory) => void
  onDelete: (id: string) => void
  saving: boolean
}) {
  const [category, setCategory] = useState<ServiceCategory>({ id: '', name: '', slug: '', description: '', imagePath: '', active: true, displayOrder: 99 })

  return (
    <article className="plain-card cms-card">
      <h2 className="serif">Service Categories</h2>
      <div className="mini-list">
        {categories.map((item) => (
          <button key={item.id} onClick={() => setCategory(item)} type="button">{item.name}</button>
        ))}
      </div>
      <Field label="Name" value={category.name} onChange={(value) => setCategory({ ...category, name: value, slug: category.slug || slugify(value) })} />
      <Field label="Image URL" value={category.imagePath} onChange={(value) => setCategory({ ...category, imagePath: value })} />
      <Field label="Description" value={category.description} onChange={(value) => setCategory({ ...category, description: value })} />
      <div className="actions">
        <button className="btn" disabled={saving} onClick={() => onSave({ ...category, slug: category.slug || slugify(category.name) })} type="button"><Save size={16} /> Save Category</button>
        <button className="btn ghost" onClick={() => setCategory({ id: '', name: '', slug: '', description: '', imagePath: '', active: true, displayOrder: 99 })} type="button"><Plus size={16} /> New</button>
        {category.id && <button className="icon-action" disabled={saving} onClick={() => onDelete(category.id)} type="button" aria-label="Delete category"><Trash2 size={17} /></button>}
      </div>
    </article>
  )
}

function GalleryManager({ items, onSave, onDelete, onUpload, saving }: {
  items: GalleryItem[]
  onSave: (item: GalleryItem) => void
  onDelete: (id: string) => void
  onUpload: (file: File) => Promise<string>
  saving: boolean
}) {
  const [item, setItem] = useState<GalleryItem>({ id: '', category: 'Haircut', caption: '', imagePath: '', thumbnailPath: '', featured: false, visible: true, displayOrder: 99 })
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await onUpload(file)
      setItem({ ...item, imagePath: url, thumbnailPath: url, mediaId: undefined })
    } finally {
      setUploading(false)
    }
  }

  return (
    <article className="plain-card cms-card wide">
      <h2 className="serif">Gallery Manager</h2>
      <div className="mini-list">
        {items.map((galleryItem) => (
          <button key={galleryItem.id} onClick={() => setItem(galleryItem)} type="button">{galleryItem.caption || galleryItem.category}</button>
        ))}
      </div>
      <div className="form-row">
        <Field label="Category" value={item.category} onChange={(value) => setItem({ ...item, category: value, categoryId: undefined })} />
        <Field label="Caption" value={item.caption} onChange={(value) => setItem({ ...item, caption: value })} />
      </div>
      <Field label="Image URL" value={item.imagePath} onChange={(value) => setItem({ ...item, imagePath: value, thumbnailPath: value, mediaId: undefined })} />
      <label className="upload-line">
        <ImageUp size={17} /> {uploading ? 'Uploading...' : 'Upload Image'}
        <input accept="image/*" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} type="file" />
      </label>
      {item.imagePath && <img className="cms-thumb" src={item.imagePath} alt="" />}
      <div className="check-grid">
        <label><input checked={item.featured} onChange={(event) => setItem({ ...item, featured: event.target.checked })} type="checkbox" /> Featured</label>
        <label><input checked={item.visible} onChange={(event) => setItem({ ...item, visible: event.target.checked })} type="checkbox" /> Visible</label>
      </div>
      <div className="actions">
        <button className="btn" disabled={saving} onClick={() => onSave(item)} type="button"><Save size={16} /> Save Gallery</button>
        <button className="btn ghost" onClick={() => setItem({ id: '', category: 'Haircut', caption: '', imagePath: '', thumbnailPath: '', featured: false, visible: true, displayOrder: 99 })} type="button"><Plus size={16} /> New</button>
        {item.id && <button className="icon-action" disabled={saving} onClick={() => onDelete(item.id)} type="button" aria-label="Delete gallery item"><Trash2 size={17} /></button>}
      </div>
    </article>
  )
}

function OfferManager({ offers, onSave, onDelete, saving }: {
  offers: Offer[]
  onSave: (offer: Offer) => void
  onDelete: (id: string) => void
  saving: boolean
}) {
  const [offer, setOffer] = useState<Offer>({ id: '', title: '', description: '', originalPrice: 0, offerPrice: 0, active: true, featured: false, ctaLabel: 'Claim Offer', displayOrder: 99 })
  return (
    <article className="plain-card cms-card">
      <h2 className="serif">Offers Manager</h2>
      <div className="mini-list">
        {offers.map((item) => <button key={item.id} onClick={() => setOffer(item)} type="button">{item.title}</button>)}
      </div>
      <Field label="Title" value={offer.title} onChange={(value) => setOffer({ ...offer, title: value })} />
      <Field label="Description" value={offer.description} onChange={(value) => setOffer({ ...offer, description: value })} />
      <div className="form-row">
        <Field label="Original Price" type="number" value={offer.originalPrice.toString()} onChange={(value) => setOffer({ ...offer, originalPrice: Number(value) })} />
        <Field label="Offer Price" type="number" value={offer.offerPrice.toString()} onChange={(value) => setOffer({ ...offer, offerPrice: Number(value) })} />
      </div>
      <Field label="Image URL" value={offer.imagePath ?? ''} onChange={(value) => setOffer({ ...offer, imagePath: value })} />
      <div className="check-grid">
        <label><input checked={offer.featured} onChange={(event) => setOffer({ ...offer, featured: event.target.checked })} type="checkbox" /> Featured</label>
        <label><input checked={offer.active} onChange={(event) => setOffer({ ...offer, active: event.target.checked })} type="checkbox" /> Active</label>
      </div>
      <div className="actions">
        <button className="btn" disabled={saving} onClick={() => onSave(offer)} type="button"><Save size={16} /> Save Offer</button>
        <button className="btn ghost" onClick={() => setOffer({ id: '', title: '', description: '', originalPrice: 0, offerPrice: 0, active: true, featured: false, ctaLabel: 'Claim Offer', displayOrder: 99 })} type="button"><Plus size={16} /> New</button>
        {offer.id && <button className="icon-action" disabled={saving} onClick={() => onDelete(offer.id)} type="button" aria-label="Delete offer"><Trash2 size={17} /></button>}
      </div>
    </article>
  )
}

function AdminManager({ profiles, onSave, saving }: { profiles: AdminProfile[]; onSave: (profile: AdminProfile) => void; saving: boolean }) {
  const [profile, setProfile] = useState<AdminProfile>({ id: '', fullName: '', role: 'STAFF', active: true })
  return (
    <article className="plain-card cms-card">
      <h2 className="serif">Admin Users</h2>
      <p className="muted">Auth user UID paste karke admin/staff access manage karo.</p>
      <div className="mini-list">
        {profiles.map((item) => <button key={item.id} onClick={() => setProfile(item)} type="button">{item.fullName}</button>)}
      </div>
      <Field label="Auth User UID" value={profile.id} onChange={(value) => setProfile({ ...profile, id: value })} />
      <Field label="Full Name" value={profile.fullName} onChange={(value) => setProfile({ ...profile, fullName: value })} />
      <label className="field">
        <span>Role</span>
        <select value={profile.role} onChange={(event) => setProfile({ ...profile, role: event.target.value as AdminProfile['role'] })}>
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
        </select>
      </label>
      <label><input checked={profile.active} onChange={(event) => setProfile({ ...profile, active: event.target.checked })} type="checkbox" /> Active</label>
      <div className="actions">
        <button className="btn" disabled={saving || !profile.id || !profile.fullName} onClick={() => onSave(profile)} type="button"><Save size={16} /> Save Admin</button>
        <button className="btn ghost" onClick={() => setProfile({ id: '', fullName: '', role: 'STAFF', active: true })} type="button"><Plus size={16} /> New</button>
      </div>
    </article>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} />
    </label>
  )
}

function AdminNotice({ title, detail }: { title: string; detail?: string }) {
  return (
    <article className="plain-card">
      <h1 className="section-title" style={{ textAlign: 'left', marginTop: 0 }}>
        {title}
      </h1>
      {detail && <p className="muted">{detail}</p>}
    </article>
  )
}
