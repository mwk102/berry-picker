import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Harvest Radar', to: '/', end: true },
  { label: 'Farm Finder', to: '/farms' },
  { label: 'Season Calendar', to: '/season-calendar' },
  { label: 'Weekend Picks', to: '/weekend-picks' },
]

export function Header() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary navigation">
        <NavLink className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            NU
          </span>
          <span>Northwest U-Pick</span>
        </NavLink>

        <div className="nav-links">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
              key={item.to}
              end={item.end}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <NavLink className="login-link" to="/login">
          Login
        </NavLink>
      </nav>
    </header>
  )
}
