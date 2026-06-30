import { Button } from './Button'

const sortOptions = [
  { label: 'Nearest first', value: 'nearest' },
  { label: 'Lowest price', value: 'price' },
  { label: 'Farm name A-Z', value: 'name' },
]

export function Filters({
  berryTypes,
  filters,
  maxAvailablePrice,
  onChange,
  onReset,
  resultCount,
}) {
  const updateFilter = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
    })
  }

  return (
    <section className="filters" aria-label="Farm filters">
      <div className="filters-topline">
        <span>{resultCount} farms</span>
        <Button className="filters-reset" onClick={onReset} variant="ghost">
          Reset
        </Button>
      </div>

      <label className="filter-field search-field">
        <span>Search</span>
        <input
          onChange={(event) => updateFilter('search', event.target.value)}
          placeholder="Farm, city, crop, description"
          type="search"
          value={filters.search}
        />
      </label>

      <div className="filter-grid">
        <label className="filter-field">
          <span>Crop type</span>
          <select
            onChange={(event) => updateFilter('berryType', event.target.value)}
            value={filters.berryType}
          >
            <option value="all">All crops</option>
            {berryTypes.map((berryType) => (
              <option key={berryType.value} value={berryType.value}>
                {berryType.label}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Sort</span>
          <select
            onChange={(event) => updateFilter('sortBy', event.target.value)}
            value={filters.sortBy}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="filter-toggle-group">
        <label className="filter-toggle">
          <input
            checked={filters.openNow}
            onChange={(event) => updateFilter('openNow', event.target.checked)}
            type="checkbox"
          />
          <span>Open now</span>
        </label>

        <label className="filter-toggle candidate-toggle">
          <input
            checked={filters.showUnverifiedCandidates}
            onChange={(event) =>
              updateFilter('showUnverifiedCandidates', event.target.checked)
            }
            type="checkbox"
          />
          <span>Show unverified candidates</span>
        </label>
      </div>

      <label className="filter-field range-field">
        <span>Radius: {filters.radiusMiles} mi</span>
        <input
          max="50"
          min="5"
          onChange={(event) =>
            updateFilter('radiusMiles', Number(event.target.value))
          }
          type="range"
          value={filters.radiusMiles}
        />
      </label>

      <label className="filter-field range-field">
        <span>Max price: ${filters.maxPricePerPound.toFixed(2)}</span>
        <input
          max={maxAvailablePrice}
          min="1"
          onChange={(event) =>
            updateFilter('maxPricePerPound', Number(event.target.value))
          }
          step="0.25"
          type="range"
          value={filters.maxPricePerPound}
        />
      </label>
    </section>
  )
}
