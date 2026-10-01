export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

export const cognitoPasswordRules: PasswordRule[] = [
  {
    id: 'length',
    label: 'အနည်းဆုံး စာလုံး ၈ လုံး',
    test: (password) => password.length >= 8,
  },
  {
    id: 'lower',
    label: 'အင်္ဂလိပ် အသေး (a-z)',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'upper',
    label: 'အင်္ဂလိပ် အကြီး (A-Z)',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'number',
    label: 'ဂဏန်း (0-9)',
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: 'symbol',
    label: 'သင်္ကေတ (!@#$%^&* စသည်)',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
]

export function getPasswordRuleResults(password: string) {
  return cognitoPasswordRules.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }))
}

export function isPasswordValid(password: string) {
  return cognitoPasswordRules.every((rule) => rule.test(password))
}
