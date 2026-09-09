import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ServiceCard } from '../../components/common/ServiceCard'
import { SeoHead } from '../../components/common/SeoHead'
import { usePublicData } from '../../hooks/usePublicData'

export function ServicesPage() {
  const { business: businessSettings, categories, services } = usePublicData()
  const [activeCategory, setActiveCategory] = useState('all')
  const visibleServices = useMemo(
    () =>
      activeCategory === 'all'
        ? services.filter((service) => service.active)
        : services.filter((service) => service.active && service.categoryId === activeCategory),
    [activeCategory, services],
  )

  return (
    <main>
      <SeoHead
        title={`Services & Prices — ${businessSettings.salonName}`}
        description={`Full menu of haircuts, beard styling, shaves, and grooming services at ${businessSettings.salonName}. Transparent pricing and online booking.`}
        path="/services"
        image={businessSettings.servicesHeroImage}
      />
      <section
        className="page-hero"
        style={{ '--hero-image': `url(${businessSettings.servicesHeroImage})` } as CSSProperties}
      >
        <div>
          <span className="eyebrow">Home / Services</span>
          <h1>Grooming Designed Around Your Style</h1>
          <p>Dynamic services, durations, prices, and bookability managed from the admin CMS.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="pill-row" role="tablist" aria-label="Service categories">
            <button className={`pill ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>
              All services
            </button>
            {categories.map((category) => (
              <button
                className={`pill ${activeCategory === category.id ? 'active' : ''}`}
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
          <h2 className="section-title services-heading">Find the Right Grooming Service</h2>
          <p className="section-intro services-intro">
            Explore our signature cuts, beard rituals, skin care, and complete grooming experiences.
          </p>
          <div className="services-layout">
            {(activeCategory === 'all' ? categories : categories.filter((item) => item.id === activeCategory)).map((category) => {
              const categoryServices = visibleServices.filter((service) => service.categoryId === category.id)
              if (!categoryServices.length) return null
              return (
                <section className="service-category-section" id={category.slug} key={category.id}>
                  <h2 className="serif">{category.name}</h2>
                  <div className="service-category-cards">
                    {categoryServices.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </section>
      <section className="section dark">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Ready to elevate your look?</h2>
          <p style={{ color: '#ddd' }}>Book online with mobile OTP verification and final availability protection.</p>
          <Link className="btn ghost" to="/book" style={{ marginTop: 22 }}>
            Book Appointment
          </Link>
        </div>
      </section>
    </main>
  )
}
