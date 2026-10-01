import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isPublicVerify = location.pathname.startsWith('/verify/')

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to={user ? '/' : location.pathname} className="brand">
            {isPublicVerify && !user ? 'Cargo Verification' : 'Officer Portal'}
          </Link>

          {user && (
            <nav className="nav">
              <NavLink to="/" end>
                စာရင်း
              </NavLink>
              <NavLink to="/new">အသစ်တင်ရန်</NavLink>
              <div className="user-chip">
                <span>{user.displayName}</span>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    void logout()
                  }}
                >
                  ထွက်ရန်
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="app-footer">
        {isPublicVerify && !user
          ? 'Public verification page — checkpoint use'
          : 'Official Use Only — Authorized Officers'}
      </footer>
    </div>
  )
}
