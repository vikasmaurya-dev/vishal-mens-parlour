import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { SeoHead } from '../../components/common/SeoHead'
import { usePublicData } from '../../hooks/usePublicData'
import type { GalleryItem } from '../../types/domain'

export function GalleryPage() {
  const { business: businessSettings, galleryItems } = usePublicData()
  const categories = ['All', ...Array.from(new Set(galleryItems.map((item) => item.category)))]
  const [active, setActive] = useState('All')
  const [selected, setSelected] = useState<GalleryItem | null>(null)
  const visible = useMemo(
    () => galleryItems.filter((item) => item.visible && (active === 'All' || item.category === active)),
    [active, galleryItems],
  )

  return (
    <main>
      <SeoHead
        title={`Gallery — ${businessSettings.salonName}`}
        description="See our recent haircuts, beard styling, and grooming work. Real photos from real customers."
        path="/gallery"
        image={businessSettings.galleryHeroImage}
      />
      <section
        className="page-hero"
        style={{ '--hero-image': `url(${businessSettings.galleryHeroImage})` } as CSSProperties}
      >
        <div>
          <span className="eyebrow">Home / Gallery</span>
          <h1>Crafted With Precision.</h1>
          <p>Browse signature haircuts, meticulous beard work, and salon atmosphere before your visit.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <h2 className="section-title gallery-heading">Style. Detail. Craftsmanship.</h2>
          <p className="section-intro gallery-intro">
            Every cut is a statement. Browse the work, atmosphere, and finishing detail behind the Vishal experience.
          </p>
          <div className="pill-row" style={{ justifyContent: 'center', marginTop: 30 }}>
            {categories.map((category) => (
              <button className={`pill ${active === category ? 'active' : ''}`} key={category} onClick={() => setActive(category)}>
                {category}
              </button>
            ))}
          </div>
          <div className="gallery-grid masonry">
            {visible.map((item) => (
              <button className="gallery-item" key={item.id} onClick={() => setSelected(item)}>
                <img src={item.thumbnailPath} alt={item.caption} loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="section dark" style={{ textAlign: 'center' }}>
        <div className="container">
          <h2 className="section-title">Ready for your transformation?</h2>
          <p style={{ color: '#ddd' }}>Secure your time with our master barbers.</p>
          <Link className="btn ghost" to="/book" style={{ marginTop: 22 }}>
            Book Appointment
          </Link>
        </div>
      </section>
      {selected && (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label={selected.caption}>
          <div className="dialog">
            <img src={selected.imagePath} alt={selected.caption} />
            <div style={{ padding: 20, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <strong>{selected.category}</strong>
                <p className="muted">{selected.caption}</p>
              </div>
              <button className="btn secondary" type="button" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
