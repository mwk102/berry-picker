import { formatDate, formatTime } from './FarmDetailUtils'

function dayLabel(day) {
  return day.slice(0, 1) + day.slice(1).toLowerCase()
}

export function FarmHoursPanel({ hours, specialHours }) {
  return (
    <section className="farm-panel">
      <div className="panel-heading">
        <h2>Hours</h2>
      </div>

      <div className="hours-list">
        {hours.map((hour) => (
          <span key={hour.id}>
            <strong>{dayLabel(hour.dayOfWeek)}</strong>
            {hour.isClosed
              ? 'Closed'
              : `${formatTime(hour.openTime) || 'Open'} - ${formatTime(hour.closeTime) || 'Close'}`}
          </span>
        ))}
      </div>

      {specialHours.length > 0 ? (
        <div className="special-hours">
          <strong>Special hours</strong>
          {specialHours.map((hour) => (
            <span key={hour.id}>
              {formatDate(hour.date)} · {hour.isClosed ? 'Closed' : `${formatTime(hour.openTime)} - ${formatTime(hour.closeTime)}`}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  )
}
