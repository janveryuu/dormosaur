export type TimezoneOption = {
  id: string
  name: string
  city: string
}

export type CountryInfo = {
  code: string
  name: string
  flag: string
  defaultTimezone: string
  cuisineRegion: string
  cuisineHighlights: string
  timezones?: TimezoneOption[]
}

export const COUNTRIES: CountryInfo[] = [
  {
    code: 'PH',
    name: 'Philippines',
    flag: '🇵🇭',
    defaultTimezone: 'Asia/Manila',
    cuisineRegion: 'Filipino',
    cuisineHighlights: "Filipino favorites like Adobo, Sinigang, and Champorado",
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    defaultTimezone: 'Asia/Tokyo',
    cuisineRegion: 'Japanese',
    cuisineHighlights: "Japanese dorm staples like Tamago Kake Gohan, Ramen, and Miso Soup",
  },
  {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    defaultTimezone: 'Asia/Seoul',
    cuisineRegion: 'Korean',
    cuisineHighlights: "Korean classics like Kimchi Fried Rice, Rice with Banchan, and Spicy Ramen",
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    defaultTimezone: 'America/New_York',
    cuisineRegion: 'American',
    cuisineHighlights: "American dorm hits like Microwave Mug Pancakes, Quesadillas, and Overnight Oats",
    timezones: [
      { id: 'America/New_York', name: 'Eastern Time (ET)', city: 'New York, Boston, Miami' },
      { id: 'America/Chicago', name: 'Central Time (CT)', city: 'Chicago, Dallas, Houston' },
      { id: 'America/Denver', name: 'Mountain Time (MT)', city: 'Denver, Salt Lake City' },
      { id: 'America/Los_Angeles', name: 'Pacific Time (PT)', city: 'Los Angeles, Seattle, SF' },
      { id: 'America/Anchorage', name: 'Alaska Time (AKT)', city: 'Anchorage' },
      { id: 'Pacific/Honolulu', name: 'Hawaii Time (HT)', city: 'Honolulu' },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    defaultTimezone: 'America/Toronto',
    cuisineRegion: 'American',
    cuisineHighlights: "Canadian quick bites like Poutine-style Fries, Oats, and Mug Cakes",
    timezones: [
      { id: 'America/Toronto', name: 'Eastern Time (ET)', city: 'Toronto, Montreal' },
      { id: 'America/Winnipeg', name: 'Central Time (CT)', city: 'Winnipeg' },
      { id: 'America/Edmonton', name: 'Mountain Time (MT)', city: 'Edmonton, Calgary' },
      { id: 'America/Vancouver', name: 'Pacific Time (PT)', city: 'Vancouver' },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    defaultTimezone: 'Europe/London',
    cuisineRegion: 'British',
    cuisineHighlights: "UK dorm classic recipes like Beans on Toast, Creamy Porridge, and Mug Cakes",
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    defaultTimezone: 'Australia/Sydney',
    cuisineRegion: 'General',
    cuisineHighlights: "Aussie student quick meals like Toasties, Overnight Oats, and Mug Pancakes",
    timezones: [
      { id: 'Australia/Sydney', name: 'Australian Eastern (AEST)', city: 'Sydney, Melbourne, Brisbane' },
      { id: 'Australia/Adelaide', name: 'Australian Central (ACST)', city: 'Adelaide' },
      { id: 'Australia/Perth', name: 'Australian Western (AWST)', city: 'Perth' },
    ],
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    defaultTimezone: 'Asia/Kolkata',
    cuisineRegion: 'Indian',
    cuisineHighlights: "Indian quick dorm recipes like Poha, Maggi Noodles, and Masala Mug Chai",
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    defaultTimezone: 'Asia/Singapore',
    cuisineRegion: 'Asian',
    cuisineHighlights: "Singaporean quick favorites like Kaya Toast and Rice Cooker Porridge",
  },
  {
    code: 'ID',
    name: 'Indonesia',
    flag: '🇮🇩',
    defaultTimezone: 'Asia/Jakarta',
    cuisineRegion: 'Asian',
    cuisineHighlights: "Indonesian dorm favorites like Nasi Goreng and Instant Noodles with Egg",
    timezones: [
      { id: 'Asia/Jakarta', name: 'Western Indonesia (WIB)', city: 'Jakarta, Bandung' },
      { id: 'Asia/Makassar', name: 'Central Indonesia (WITA)', city: 'Bali, Makassar' },
      { id: 'Asia/Jayapura', name: 'Eastern Indonesia (WIT)', city: 'Jayapura' },
    ],
  },
  {
    code: 'VN',
    name: 'Vietnam',
    flag: '🇻🇳',
    defaultTimezone: 'Asia/Ho_Chi_Minh',
    cuisineRegion: 'Asian',
    cuisineHighlights: "Vietnamese dorm quick foods like Instant Noodle Soup and Steamed Eggs",
  },
  {
    code: 'TH',
    name: 'Thailand',
    flag: '🇹🇭',
    defaultTimezone: 'Asia/Bangkok',
    cuisineRegion: 'Asian',
    cuisineHighlights: "Thai student quick meals like Tom Yum Instant Noodles and Microwave Omelet",
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    defaultTimezone: 'Europe/Berlin',
    cuisineRegion: 'European',
    cuisineHighlights: "European quick dorm meals like Cheese Toasties, Muesli, and Mug Soups",
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    defaultTimezone: 'Europe/Paris',
    cuisineRegion: 'European',
    cuisineHighlights: "French student dorm staples like Croque Monsieur and Quick Omelets",
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    defaultTimezone: 'Europe/Madrid',
    cuisineRegion: 'European',
    cuisineHighlights: "Spanish quick bites like Tortilla in a Mug and Tomato Bread",
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    defaultTimezone: 'America/Mexico_City',
    cuisineRegion: 'American',
    cuisineHighlights: "Mexican dorm hits like Skillet Quesadillas, Chilaquiles, and Beans",
  },
]

export function getCountryByCode(code?: string): CountryInfo {
  if (!code) return COUNTRIES[0] // Default to Philippines
  const match = COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase())
  return match || COUNTRIES[0]
}

export function searchCountries(query: string): CountryInfo[] {
  const q = query.trim().toLowerCase()
  if (!q) return COUNTRIES
  return COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.defaultTimezone.toLowerCase().includes(q),
  )
}
