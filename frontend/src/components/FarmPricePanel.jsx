import { formatDate, formatPrice } from './FarmDetailUtils'

export function FarmPricePanel({ prices }) {
  return (
    <section className="farm-panel">
      <div className="panel-heading">
        <h2>Prices</h2>
      </div>

      {prices.length === 0 ? (
        <p className="panel-muted">No price data yet.</p>
      ) : (
        <div className="farm-price-list">
          {prices.map((price) => (
            <article className="farm-price-row" key={price.id}>
              <strong>{price.cropName}</strong>
              <span>{formatPrice(price)}</span>
              <span>{price.source}</span>
              <span>{price.isVerified ? 'Verified' : 'Unverified'}</span>
              <span>
                {formatDate(price.effectiveStartDate)} - {formatDate(price.effectiveEndDate)}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
