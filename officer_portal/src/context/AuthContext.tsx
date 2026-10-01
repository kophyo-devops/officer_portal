import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
} from 'aws-amplify/auth'
import { isCognitoConfigured } from '../config/env'

interface AuthUser {
  username: string
  displayName: string
}

export type LoginResult =
  | { status: 'signed_in' }
  | {
      status: 'new_password_required'
      missingAttributes: string[]
    }
  | { status: 'error'; message: string }

interface CompleteNewPasswordInput {
  newPassword: string
  attributes?: Record<string, string>
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  authMode: 'cognito' | 'demo'
  login: (username: string, password: string) => Promise<LoginResult>
  completeNewPassword: (
    input: CompleteNewPasswordInput,
  ) => Promise<LoginResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const AUTH_KEY = 'officer_portal_user'

function readStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function mapAmplifyError(error: unknown): string {
  const name =
    typeof error === 'object' && error && 'name' in error
      ? String((error as { name: string }).name)
      : ''
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message: string }).message)
      : 'Login မအောင်မြင်ပါ'

  switch (name) {
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return 'Username သို့မဟုတ် Password မှားနေသည်'
    case 'UserNotConfirmedException':
      return 'အကောင့် အတည်မပြုရသေးပါ'
    case 'PasswordResetRequiredException':
      return 'Password ပြန်သတ်မှတ်ရန် လိုအပ်သည်'
    case 'InvalidPasswordException':
      return 'Password စည်းမျဉ်းနှင့် မကိုက်ညီပါ'
    case 'InvalidParameterException':
      return message
    case 'TooManyFailedAttemptsException':
    case 'LimitExceededException':
      return 'ကြိုးစားမှု များလွန်းသည်။ ခဏနေမှ ပြန်လုပ်ပါ'
    default:
      return message
  }
}

async function loadSignedInUser(): Promise<AuthUser> {
  const current = await getCurrentUser()
  await fetchAuthSession()
  return {
    username: current.username,
    displayName: current.signInDetails?.loginId ?? current.username,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    isCognitoConfigured ? null : readStoredUser(),
  )
  const [loading, setLoading] = useState(isCognitoConfigured)

  useEffect(() => {
    if (!isCognitoConfigured) {
      setLoading(false)
      return
    }

    let active = true

    async function restoreSession() {
      try {
        const nextUser = await loadSignedInUser()
        if (!active) return
        setUser(nextUser)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    void restoreSession()
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authMode: isCognitoConfigured ? 'cognito' : 'demo',
      async login(username, password) {
        if (!username.trim() || !password.trim()) {
          return {
            status: 'error',
            message: 'Username နှင့် Password ထည့်ပါ',
          }
        }

        if (!isCognitoConfigured) {
          const nextUser: AuthUser = {
            username: username.trim(),
            displayName: username.trim(),
          }
          sessionStorage.setItem(AUTH_KEY, JSON.stringify(nextUser))
          setUser(nextUser)
          return { status: 'signed_in' }
        }

        try {
          try {
            await signOut()
          } catch {
            // ignore
          }

          const result = await signIn({
            username: username.trim(),
            password,
          })

          if (result.isSignedIn) {
            setUser(await loadSignedInUser())
            return { status: 'signed_in' }
          }

          if (
            result.nextStep.signInStep ===
            'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
          ) {
            const missingAttributes =
              'missingAttributes' in result.nextStep &&
              Array.isArray(result.nextStep.missingAttributes)
                ? result.nextStep.missingAttributes
                : ['email']

            return {
              status: 'new_password_required',
              missingAttributes,
            }
          }

          return {
            status: 'error',
            message: `Login အဆင့် ထပ်လိုအပ်သည်: ${result.nextStep.signInStep}`,
          }
        } catch (error) {
          return { status: 'error', message: mapAmplifyError(error) }
        }
      },
      async completeNewPassword({ newPassword, attributes }) {
        if (!newPassword.trim()) {
          return { status: 'error', message: 'Password အသစ် ထည့်ပါ' }
        }

        try {
          const result = await confirmSignIn({
            challengeResponse: newPassword,
            options: attributes
              ? {
                  userAttributes: attributes,
                }
              : undefined,
          })

          if (result.isSignedIn) {
            setUser(await loadSignedInUser())
            return { status: 'signed_in' }
          }

          return {
            status: 'error',
            message: `Password သတ်မှတ်မှု မပြီးသေးပါ: ${result.nextStep.signInStep}`,
          }
        } catch (error) {
          return { status: 'error', message: mapAmplifyError(error) }
        }
      },
      async logout() {
        if (isCognitoConfigured) {
          try {
            await signOut()
          } catch {
            // ignore
          }
        }
        sessionStorage.removeItem(AUTH_KEY)
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
