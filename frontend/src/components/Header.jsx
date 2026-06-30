import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Map', to: '/' },
  { label: 'Farm Details', to: '/farms/sample-farm' },
  { label: 'Admin', to: '/admin' },
]

export function Header() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary navigation">
        <NavLink className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            BP
          </span>
          <span>Berry Picker</span>
        </NavLink>

        <div className="nav-links">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
              key={item.to}
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
