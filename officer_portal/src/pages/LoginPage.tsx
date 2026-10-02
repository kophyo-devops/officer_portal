import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getPasswordRuleResults,
  isPasswordValid,
} from '../utils/passwordRules'

function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="password-field">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShowPassword((v) => !v)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        title={showPassword ? 'Hide' : 'Show'}
      >
        {showPassword ? (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9.3 3.1 11 7a11.7 11.7 0 0 1-4.1 4.6" />
            <path d="M6.7 6.7A11.5 11.5 0 0 0 1 12c1.7 3.9 6 7 11 7a10.6 10.6 0 0 0 4.3-.9" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}

export function LoginPage() {
  const {
    user,
    login,
    completeNewPassword,
    loading: authLoading,
  } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const rawFrom = (location.state as { from?: string } | null)?.from ?? '/'
  const from =
    !rawFrom ||
    rawFrom === '/login' ||
    rawFrom.startsWith('/verify/')
      ? '/'
      : rawFrom

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [needsNewPassword, setNeedsNewPassword] = useState(false)
  const [missingAttributes, setMissingAttributes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const needsEmail = missingAttributes.includes('email')
  const passwordRules = useMemo(
    () => getPasswordRuleResults(newPassword),
    [newPassword],
  )
  const passwordOk = isPasswordValid(newPassword)
  const confirmTouched = confirmPassword.length > 0
  const confirmOk = confirmPassword === newPassword && passwordOk

  if (authLoading) {
    return (
      <div className="login-screen">
        <p className="login-note">Loading...</p>
      </div>
    )
  }

  if (user) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (needsNewPassword) {
      if (!passwordOk) {
        setLoading(false)
        setError('Password စည်းမျဉ်းနှင့် မကိုက်ညီပါ')
        return
      }

      if (newPassword !== confirmPassword) {
        setLoading(false)
        setError('Password အသစ် နှစ်ခု မတူပါ')
        return
      }

      if (needsEmail && !email.trim()) {
        setLoading(false)
        setError('Email ထည့်ပါ')
        return
      }

      const attributes: Record<string, string> = {}
      if (needsEmail) attributes.email = email.trim()

      const result = await completeNewPassword({
        newPassword,
        attributes,
      })
      setLoading(false)

      if (result.status === 'signed_in') {
        showToast('Login အောင်မြင်ပါပြီ')
        navigate(from, { replace: true })
        return
      }

      if (result.status === 'error') {
        setError(result.message)
      }
      return
    }

    const result = await login(username, password)
    setLoading(false)

    if (result.status === 'signed_in') {
      showToast('Login အောင်မြင်ပါပြီ')
      navigate(from, { replace: true })
      return
    }

    if (result.status === 'new_password_required') {
      setNeedsNewPassword(true)
      setMissingAttributes(result.missingAttributes)
      setPassword('')
      return
    }

    setError(result.message)
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={onSubmit} noValidate>
        <div className="login-card-head">
          <h1>
            {needsNewPassword ? 'Password အသစ် သတ်မှတ်ရန်' : 'Officer Login'}
          </h1>
          <p className="login-note">
            {needsNewPassword
              ? 'Temporary password ဖြင့် ပထမဆုံး ဝင်သည့်အတွက် password အသစ် သတ်မှတ်ပါ။'
              : 'Officer အကောင့်ဖြင့်သာ ဝင်ရောက်ပါ။'}
          </p>
        </div>

        {!needsNewPassword && (
          <>
            <label className="field">
              <span className="field-label">
                <span>
                  Username
                  <span className="required">*</span>
                </span>
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ဥပမာ - officer01"
                autoComplete="username"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">
                <span>
                  Password
                  <span className="required">*</span>
                </span>
              </span>
              <PasswordField
                value={password}
                onChange={setPassword}
                placeholder="စကားဝှက် ထည့်ပါ"
                autoComplete="current-password"
              />
            </label>
          </>
        )}

        {needsNewPassword && (
          <>
            {needsEmail && (
              <label className="field">
                <span className="field-label">
                  <span>
                    Email
                    <span className="required">*</span>
                  </span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ဥပမာ - officer01@example.com"
                  autoComplete="email"
                  required
                />
              </label>
            )}

            <label className="field">
              <span className="field-label">
                <span>
                  New Password
                  <span className="required">*</span>
                </span>
              </span>
              <PasswordField
                value={newPassword}
                onChange={(value) => {
                  setNewPassword(value)
                  setError(null)
                }}
                placeholder="ဥပမာ - Hello123!"
                autoComplete="new-password"
              />
              <ul className="password-rules" aria-live="polite">
                {passwordRules.map((rule) => (
                  <li
                    key={rule.id}
                    className={
                      newPassword.length === 0
                        ? 'rule-pending'
                        : rule.passed
                          ? 'rule-ok'
                          : 'rule-bad'
                    }
                  >
                    <span className="rule-mark" aria-hidden>
                      {newPassword.length === 0 ? '•' : rule.passed ? '✓' : '✗'}
                    </span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            </label>

            <label className="field">
              <span className="field-label">
                <span>
                  Confirm New Password
                  <span className="required">*</span>
                </span>
              </span>
              <PasswordField
                value={confirmPassword}
                onChange={(value) => {
                  setConfirmPassword(value)
                  setError(null)
                }}
                placeholder="Password အသစ် ထပ်မံ ထည့်ပါ"
                autoComplete="new-password"
              />
              {confirmTouched && (
                <p className={confirmOk ? 'rule-ok' : 'rule-bad'}>
                  {confirmOk
                    ? 'Password နှစ်ခု တူညီပါသည်'
                    : 'Password နှစ်ခု မတူပါ'}
                </p>
              )}
            </label>
          </>
        )}

        {error && <p className="error">{error}</p>}

        <div className="actions">
          {needsNewPassword && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setNeedsNewPassword(false)
                setNewPassword('')
                setConfirmPassword('')
                setEmail('')
                setMissingAttributes([])
                setError(null)
              }}
            >
              Cancel
            </button>
          )}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={
              loading ||
              (needsNewPassword && (!passwordOk || !confirmOk || (needsEmail && !email.trim())))
            }
          >
            {loading
              ? 'လုပ်ဆောင်နေသည်...'
              : needsNewPassword
                ? 'Password သိမ်းရန်'
                : 'Login'}
          </button>
        </div>
      </form>
    </div>
  )
}
