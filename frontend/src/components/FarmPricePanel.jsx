import { formatDate, formatPrice } from './FarmDetailUtils'

function formatMethod(method) {
  if (!method) return 'Not listed'
  return method
    .split('_')
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(' ')
}

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
              <div className="price-primary">
                <strong>{price.cropName}</strong>
                <span>{formatPrice(price)}</span>
              </div>

              <span className={price.isVerified ? 'price-verified' : 'price-unverified'}>
                {price.isVerified ? 'Verified' : 'Unverified'}
              </span>

              <div className="price-meta">
                <span>
                  <strong>Source</strong>
                  {price.sourceUrl ? (
                    <a href={price.sourceUrl} rel="noreferrer" target="_blank">
                      {price.source}
                    </a>
                  ) : (
                    price.source
                  )}
                </span>
                <span>
                  <strong>Effective</strong>
                  {formatDate(price.effectiveStartDate)} - {formatDate(price.effectiveEndDate)}
                </span>
                <span>
                  <strong>Method</strong>
                  {formatMethod(price.verificationMethod)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
