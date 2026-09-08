import { Clock, Edit3, Grid2X2, Image, List, MoreVertical, Plus, Save, Star, X } from 'lucide-react'
import { useState } from 'react'
import { useAdminData } from '../../hooks/useAdminData'
import { createService, saveService, updateServiceFlags } from '../../services/cms'
import type { PricingType, Service } from '../../types/domain'
import { formatMoney } from '../../utils/format'

type ServiceForm = {
  id?: string
  name: string
  slug: string
  categoryId: string
  shortDescription: string
  description: string
  price: string
  discountPrice: string
  pricingType: PricingType
  durationMinutes: string
  imagePath: string
  featured: boolean
  bookable: boolean
  active: boolean
  displayOrder: string
}

const emptyForm: ServiceForm = {
  name: '',
  slug: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  price: '',
  discountPrice: '',
  pricingType: 'FIXED',
  durationMinutes: '30',
  imagePath: '',
  featured: false,
  bookable: true,
  active: true,
  displayOrder: '99',
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function serviceToForm(service: Service): ServiceForm {
  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    categoryId: service.categoryId,
    shortDescription: service.shortDescription,
    description: service.description,
    price: service.price?.toString() ?? '',
    discountPrice: service.discountPrice?.toString() ?? '',
    pricingType: service.pricingType,
    durationMinutes: service.durationMinutes.toString(),
    imagePath: service.imagePath,
    featured: service.featured,
    bookable: service.bookable,
    active: service.active,
    displayOrder: service.displayOrder.toString(),
  }
}

function formToService(form: ServiceForm): Service {
  return {
    id: form.id ?? '',
    name: form.name.trim(),
    slug: form.slug.trim() || slugify(form.name),
    categoryId: form.categoryId,
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    price: form.price ? Number(form.price) : null,
    discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
    pricingType: form.pricingType,
    durationMinutes: Number(form.durationMinutes || 30),
    imagePath: form.imagePath.trim(),
    featured: form.featured,
    bookable: form.bookable,
    active: form.active,
    displayOrder: Number(form.displayOrder || 99),
  }
}

export function AdminServicesPage() {
  const { data, loading, error, refresh } = useAdminData()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editor, setEditor] = useState<ServiceForm | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const categories = data?.categories ?? []
  const services = data?.services ?? []
  const visibleServices = selectedCategory === 'all'
    ? services
    : services.filter((service) => service.categoryId === selectedCategory)

  const openNewService = () => {
    setSaveError(null)
    setEditor({ ...emptyForm, categoryId: categories[0]?.id ?? '' })
  }

  const toggleService = async (serviceId: string, flag: 'active' | 'bookable', value: boolean) => {
    setSavingId(serviceId)
    try {
      await updateServiceFlags(serviceId, { [flag]: value })
      await refresh()
    } finally {
      setSavingId(null)
    }
  }

  const submitService = async () => {
    if (!editor) return
    const service = formToService(editor)
    if (!service.name || !service.categoryId || !service.imagePath || !service.durationMinutes) {
      setSaveError('Name, category, image URL, aur duration required hai.')
      return
    }

    setSavingId(service.id || 'new')
    setSaveError(null)
    try {
      if (service.id) {
        await saveService(service)
      } else {
        const { id: _id, ...newService } = service
        await createService(newService)
      }
      setEditor(null)
      await refresh()
    } catch (serviceError) {
      setSaveError(serviceError instanceof Error ? serviceError.message : 'Service save nahi ho payi.')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <AdminNotice title="Loading services..." />
  if (error) return <AdminNotice title="Services data issue" detail={error} />

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title" style={{ textAlign: 'left', margin: 0 }}>
            Services Manager
          </h1>
          <p className="muted">Manage offerings, pricing, duration, availability, and featured placement.</p>
        </div>
        <div className="actions">
          <button className="btn ghost" aria-label="Grid view" type="button">
            <Grid2X2 size={20} />
          </button>
          <button className="btn ghost" aria-label="List view" type="button">
            <List size={20} />
          </button>
          <button className="btn" onClick={openNewService} type="button">
            <Plus size={18} /> Add New Service
          </button>
        </div>
      </div>
      <div className="pill-row" style={{ marginTop: 30 }}>
        <button className={`pill ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')} type="button">
          All Services
        </button>
        {categories.map((category) => (
          <button
            className={`pill ${selectedCategory === category.id ? 'active' : ''}`}
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            type="button"
          >
            {category.name}
          </button>
        ))}
      </div>
      <div className="admin-service-grid">
        {visibleServices.map((service) => (
          <article className="admin-service-card" key={service.id}>
            <div className="admin-service-photo">
              <img src={service.imagePath} alt="" />
              {service.featured && <span className="featured-badge"><Star size={14} fill="currentColor" /> Featured</span>}
              <strong style={{ position: 'absolute', left: 18, bottom: 18, color: 'white', textTransform: 'uppercase' }}>
                {categories.find((category) => category.id === service.categoryId)?.name}
              </strong>
            </div>
            <div className="service-body">
              <div className="service-head">
                <h3>{service.name}</h3>
                <button className="icon-action" onClick={() => setEditor(serviceToForm(service))} type="button" aria-label={`Edit ${service.name}`}>
                  <MoreVertical size={22} />
                </button>
              </div>
              <p className="muted">{service.shortDescription}</p>
              <p style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Clock size={16} /> {service.durationMinutes} min
                <span className="price" style={{ marginLeft: 'auto' }}>
                  {formatMoney(service.discountPrice ?? service.price ?? 0)}
                </span>
              </p>
              <button className="btn ghost admin-edit-btn" onClick={() => setEditor(serviceToForm(service))} type="button">
                <Edit3 size={16} /> Edit Content
              </button>
              <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '18px 0 8px' }} />
              <div className="switch-row">
                <span>Active</span>
                <button
                  className={`switch ${service.active ? 'on' : ''}`}
                  disabled={savingId === service.id}
                  onClick={() => void toggleService(service.id, 'active', !service.active)}
                  type="button"
                  aria-label={service.active ? 'Mark inactive' : 'Mark active'}
                />
              </div>
              <div className="switch-row">
                <span>Bookable Online</span>
                <button
                  className={`switch ${service.bookable ? 'on' : ''}`}
                  disabled={savingId === service.id}
                  onClick={() => void toggleService(service.id, 'bookable', !service.bookable)}
                  type="button"
                  aria-label={service.bookable ? 'Disable online booking' : 'Enable online booking'}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
      {editor && (
        <div className="dialog-backdrop admin-dialog-backdrop" role="dialog" aria-modal="true" aria-label="Edit service">
          <div className="dialog admin-service-editor">
            <header className="editor-header">
              <div>
                <h2 className="serif">{editor.id ? 'Edit Service' : 'Add New Service'}</h2>
                <p className="muted">Saved changes update the public website automatically.</p>
              </div>
              <button className="icon-action" onClick={() => setEditor(null)} type="button" aria-label="Close editor">
                <X size={20} />
              </button>
            </header>
            <div className="editor-grid">
              <div className="editor-fields">
                <label className="field">
                  <span>Service Name</span>
                  <input
                    value={editor.name}
                    onChange={(event) => setEditor({ ...editor, name: event.target.value, slug: editor.slug || slugify(event.target.value) })}
                  />
                </label>
                <label className="field">
                  <span>Slug</span>
                  <input value={editor.slug} onChange={(event) => setEditor({ ...editor, slug: slugify(event.target.value) })} />
                </label>
                <label className="field">
                  <span>Category</span>
                  <select value={editor.categoryId} onChange={(event) => setEditor({ ...editor, categoryId: event.target.value })}>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Short Description</span>
                  <input value={editor.shortDescription} onChange={(event) => setEditor({ ...editor, shortDescription: event.target.value })} />
                </label>
                <label className="field">
                  <span>Full Description</span>
                  <textarea value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })} />
                </label>
                <div className="form-row">
                  <label className="field">
                    <span>Price</span>
                    <input min="0" type="number" value={editor.price} onChange={(event) => setEditor({ ...editor, price: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Offer Price</span>
                    <input min="0" type="number" value={editor.discountPrice} onChange={(event) => setEditor({ ...editor, discountPrice: event.target.value })} />
                  </label>
                </div>
                <div className="form-row">
                  <label className="field">
                    <span>Duration</span>
                    <input min="5" type="number" value={editor.durationMinutes} onChange={(event) => setEditor({ ...editor, durationMinutes: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Pricing Type</span>
                    <select value={editor.pricingType} onChange={(event) => setEditor({ ...editor, pricingType: event.target.value as PricingType })}>
                      <option value="FIXED">Fixed</option>
                      <option value="STARTING_FROM">Starting From</option>
                      <option value="CONSULTATION">Consultation</option>
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span>Image URL</span>
                  <input value={editor.imagePath} onChange={(event) => setEditor({ ...editor, imagePath: event.target.value })} />
                </label>
                <div className="check-grid">
                  <label><input checked={editor.featured} onChange={(event) => setEditor({ ...editor, featured: event.target.checked })} type="checkbox" /> Featured</label>
                  <label><input checked={editor.active} onChange={(event) => setEditor({ ...editor, active: event.target.checked })} type="checkbox" /> Active</label>
                  <label><input checked={editor.bookable} onChange={(event) => setEditor({ ...editor, bookable: event.target.checked })} type="checkbox" /> Bookable</label>
                </div>
                {saveError && <p className="form-error">{saveError}</p>}
              </div>
              <aside className="editor-preview">
                <span className="eyebrow"><Image size={16} /> Preview</span>
                {editor.imagePath ? <img src={editor.imagePath} alt="" /> : <div className="empty-preview">Image URL paste karo</div>}
                <h3>{editor.name || 'Service Name'}</h3>
                <p>{editor.shortDescription || 'Short description website card par dikhegi.'}</p>
                <strong>{formatMoney(Number(editor.discountPrice || editor.price || 0))}</strong>
              </aside>
            </div>
            <footer className="editor-footer">
              <button className="btn ghost" onClick={() => setEditor(null)} type="button">
                <X size={16} /> Cancel
              </button>
              <button className="btn" disabled={savingId === (editor.id ?? 'new')} onClick={() => void submitService()} type="button">
                <Save size={16} /> {savingId === (editor.id ?? 'new') ? 'Saving...' : 'Save Service'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
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
