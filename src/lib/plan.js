export function isPro(profile) {
  if (profile?.is_beta === true) {
    const expiry = new Date(profile.beta_expires_at || '2026-07-31')
    if (new Date() < expiry) return true
  }
  return profile?.plan === 'pro' || profile?.plan === 'agency'
}

export function isAgency(profile) {
  if (profile?.is_beta === true) {
    const expiry = new Date(profile.beta_expires_at || '2026-07-31')
    if (new Date() < expiry) return true
  }
  return profile?.plan === 'agency'
}

export function hasLimits(profile) {
  return !isPro(profile)
}
