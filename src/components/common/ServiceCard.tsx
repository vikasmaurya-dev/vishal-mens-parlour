import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Service } from '../../types/domain'
import { formatMoney } from '../../utils/format'

export function ServiceCard({ service, compact = false }: { service: Service; compact?: boolean }) {
  const amount = service.discountPrice ?? service.price

  return (
    <article className={`service-card ${compact ? 'compact' : ''}`}>
      <img src={service.imagePath} alt={`${service.name} service`} loading="lazy" decoding="async" />
      <div className="service-body">
        <div className="service-head">
          <h3>{service.name}</h3>
          <span className="price">
            {service.pricingType === 'STARTING_FROM' && 'From '}
            {amount ? formatMoney(amount) : 'Consultation'}
          </span>
        </div>
        <p className="muted">{service.shortDescription}</p>
        <p style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14 }}>
          <Clock size={16} /> {service.durationMinutes} min
        </p>
        <Link className="btn ghost" style={{ width: '100%', marginTop: 18 }} to={`/book?service=${service.id}`}>
          Book now
        </Link>
      </div>
    </article>
  )
}
