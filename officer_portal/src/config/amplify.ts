import { Amplify } from 'aws-amplify'
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito'
import { CookieStorage } from 'aws-amplify/utils'
import { env, isCognitoConfigured } from './env'

function clearLegacyLocalStorageTokens() {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key) continue
    if (
      key.startsWith('CognitoIdentityServiceProvider.') ||
      key.startsWith('amplify-')
    ) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key))
}

export function configureAmplify() {
  if (!isCognitoConfigured) return

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: env.userPoolId,
        userPoolClientId: env.userPoolClientId,
      },
    },
  })

  const isHttps =
    typeof window !== 'undefined' && window.location.protocol === 'https:'

  // Prefer cookies over localStorage for Cognito tokens.
  // Note: browser JS cookies are still readable by scripts (not HttpOnly).
  // True HttpOnly cookies need a backend/BFF; this is the best SPA-only option.
  cognitoUserPoolsTokenProvider.setKeyValueStorage(
    new CookieStorage({
      path: '/',
      expires: 1,
      sameSite: 'strict',
      secure: isHttps,
    }),
  )

  clearLegacyLocalStorageTokens()
}
