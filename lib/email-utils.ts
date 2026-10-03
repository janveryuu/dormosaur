/**
 * lib/email-utils.ts
 * Student email validation and school detection. Auth always uses the real email.
 */

export function isValidEmailFormat(email: string): boolean {
  if (!email || !email.includes('@')) return false
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email.trim())
}

export function isEduOrSchoolEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false
  const lower = email.toLowerCase().trim()
  return (
    lower.includes('.edu') ||
    lower.includes('.ac.') ||
    lower.includes('.ph') ||
    lower.includes('.sch') ||
    lower.includes('.gov')
  )
}

export function detectSchoolFromEmail(email: string): string | null {
  const lower = email.trim().toLowerCase()
  if (lower.includes('batstate.edu.ph') || lower.includes('batstate-u')) {
    return 'Batangas State University'
  }
  if (lower.includes('up.edu.ph')) {
    return 'University of the Philippines'
  }
  if (lower.includes('pup.edu.ph')) {
    return 'Polytechnic University of the Philippines'
  }
  if (lower.includes('dlsu.edu.ph')) {
    return 'De La Salle University'
  }
  if (lower.includes('ust.edu.ph')) {
    return 'University of Santo Tomas'
  }
  if (lower.includes('ateneo.edu.ph')) {
    return 'Ateneo de Manila University'
  }
  if (lower.includes('slu.edu.ph')) {
    return 'Saint Louis University'
  }
  if (lower.includes('clsu.edu.ph')) {
    return 'Central Luzon State University'
  }
  if (lower.includes('usc.edu.ph')) {
    return 'University of San Carlos'
  }
  return null
}
