export function isPro(profile) {
  if (profile?.is_beta && new Date() < new Date(profile.beta_expires_at || '2026-08-01')) return true
  return profile?.plan === 'pro' || profile?.plan === 'agency'
}

export function isAgency(profile) {
  if (profile?.is_beta && new Date() < new Date(profile.beta_expires_at || '2026-08-01')) return true
  return profile?.plan === 'agency'
}
