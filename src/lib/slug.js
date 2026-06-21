/**
 * Generate a slug like "marie-a3f2" from a first name + 4 random base-36 chars.
 * The suffix comes from Math.random().toString(36), giving [0-9a-z] chars.
 */
export function generateSlug(firstName) {
  const clean = (firstName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10) || 'user'

  const suffix = Math.random().toString(36).slice(2, 6)
  return `${clean}-${suffix}`
}
