import { formatDate } from './FarmDetailUtils'

export function FarmAnnouncements({ announcements }) {
  if (announcements.length === 0) {
    return null
  }

  return (
    <section className="farm-panel announcements-panel">
      <div className="panel-heading">
        <h2>Before you go</h2>
      </div>
      <div className="announcement-list">
        {announcements.map((announcement) => (
          <article key={announcement.id}>
            <strong>{announcement.title}</strong>
            <p>{announcement.body}</p>
            <span>
              {formatDate(announcement.startsAt)} - {formatDate(announcement.endsAt)}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
