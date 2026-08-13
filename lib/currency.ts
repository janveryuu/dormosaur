/**
 * lib/currency.ts
 * Centralized currency localization utility for Dormosaur Kitchen.
 * Maps student onboarding country code to currency symbol, code, and fixed exchange rates.
 */

export interface CurrencyInfo {
  code: string
  symbol: string
  rate: number // 1 USD in target currency
  decimals: number
}

export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  PH: { code: 'PHP', symbol: '₱', rate: 56, decimals: 0 },
  US: { code: 'USD', symbol: '$', rate: 1, decimals: 2 },
  JP: { code: 'JPY', symbol: '¥', rate: 155, decimals: 0 },
  KR: { code: 'KRW', symbol: '₩', rate: 1350, decimals: 0 },
  GB: { code: 'GBP', symbol: '£', rate: 0.78, decimals: 2 },
  CA: { code: 'CAD', symbol: 'CA$', rate: 1.36, decimals: 2 },
  AU: { code: 'AUD', symbol: 'A$', rate: 1.52, decimals: 2 },
  SG: { code: 'SGD', symbol: 'S$', rate: 1.35, decimals: 2 },
  DE: { code: 'EUR', symbol: '€', rate: 0.92, decimals: 2 },
  FR: { code: 'EUR', symbol: '€', rate: 0.92, decimals: 2 },
  ES: { code: 'EUR', symbol: '€', rate: 0.92, decimals: 2 },
  IT: { code: 'EUR', symbol: '€', rate: 0.92, decimals: 2 },
}

/**
 * Format a base USD cost into the student's country localized currency string.
 * e.g. formatRecipeCost(0.80, 'PH') -> "₱45"
 * e.g. formatRecipeCost(0.80, 'US') -> "$0.80"
 */

export function formatRecipeCost(costUSD: number | undefined | null, countryCode?: string): string {
  const numericCost = typeof costUSD === 'number' && !isNaN(costUSD) ? costUSD : 1.0
  const key = (countryCode || 'US').trim().toUpperCase()
  const info = COUNTRY_CURRENCY_MAP[key] || COUNTRY_CURRENCY_MAP.US

  const converted = numericCost * info.rate

  if (info.decimals === 0) {
    const rounded = Math.round(converted)
    return `${info.symbol}${rounded}`
  }

  return `${info.symbol}${converted.toFixed(2)}`
}
