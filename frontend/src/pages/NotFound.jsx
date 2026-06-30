import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="page compact-page">
      <div className="eyebrow">404</div>
      <h1>Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link className="button-link" to="/">
        Return Home
      </Link>
    </section>
  )
}
