const region = import.meta.env.VITE_AWS_REGION ?? 'ap-southeast-1'
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID ?? ''
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID ?? ''
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export const env = {
  region,
  userPoolId,
  userPoolClientId,
  apiBaseUrl,
}

export const isCognitoConfigured = Boolean(
  userPoolId.trim() &&
    userPoolClientId.trim() &&
    !userPoolId.includes('XXXXXXXXX') &&
    !userPoolClientId.includes('xxxxxxxx'),
)

export const isApiConfigured = Boolean(apiBaseUrl.trim())
