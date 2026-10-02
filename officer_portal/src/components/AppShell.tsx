import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export function AppShell() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const isPublicVerify = location.pathname.startsWith('/verify/')

  async function onLogout() {
    await logout()
    showToast('ထွက်ပြီးပါပြီ', 'info')
    navigate('/login', { replace: true })
  }

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
                    void onLogout()
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
