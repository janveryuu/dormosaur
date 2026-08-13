/**
 * lib/ua-parser.ts
 * Helper to parse navigator.userAgent into a clean human-readable device label.
 */
import { UAParser } from 'ua-parser-js'

export function getDeviceLabel(userAgent?: string): string {
  if (typeof window === 'undefined' && !userAgent) {
    return 'Unknown Device'
  }

  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  if (!ua) return 'Web Browser'

  try {
    const parser = new UAParser(ua)
    const browser = parser.getBrowser()
    const os = parser.getOS()

    const browserName = browser.name || 'Browser'
    const osName = os.name || ''

    if (browserName && osName) {
      return `${browserName} on ${osName}`
    } else if (browserName) {
      return browserName
    } else if (osName) {
      return `Device on ${osName}`
    }
  } catch (e) {
    console.warn('UA parse notice:', e)
  }

  return 'Web Browser'
}
