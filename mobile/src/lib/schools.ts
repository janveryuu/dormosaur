/**
 * Bundled school list for onboarding search. No school directory API exists yet,
 * so this is a curated starting set; students can always type a custom school.
 */
export const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th+'] as const

export type School = { name: string; city: string }

export const SCHOOLS: School[] = [
  { name: 'Batangas State University – Alangilan', city: 'Batangas City, Batangas' },
  { name: 'Batangas State University – Pablo Borbon', city: 'Batangas City, Batangas' },
  { name: 'Batangas State University – ARASOF Nasugbu', city: 'Nasugbu, Batangas' },
  { name: 'Batangas State University – Lipa', city: 'Lipa City, Batangas' },
  { name: 'Batangas State University – Malvar', city: 'Malvar, Batangas' },
  { name: 'Batangas State University – Balayan', city: 'Balayan, Batangas' },
  { name: 'Lyceum of the Philippines University – Batangas', city: 'Batangas City, Batangas' },
  { name: 'University of Batangas', city: 'Batangas City, Batangas' },
  { name: 'De La Salle Lipa', city: 'Lipa City, Batangas' },
  { name: 'University of the Philippines Diliman', city: 'Quezon City, Metro Manila' },
  { name: 'University of the Philippines Los Baños', city: 'Los Baños, Laguna' },
  { name: 'University of the Philippines Manila', city: 'Manila, Metro Manila' },
  { name: 'Ateneo de Manila University', city: 'Quezon City, Metro Manila' },
  { name: 'De La Salle University', city: 'Manila, Metro Manila' },
  { name: 'University of Santo Tomas', city: 'Manila, Metro Manila' },
  { name: 'Polytechnic University of the Philippines', city: 'Manila, Metro Manila' },
  { name: 'Far Eastern University', city: 'Manila, Metro Manila' },
  { name: 'Mapúa University', city: 'Manila, Metro Manila' },
  { name: 'University of the East', city: 'Manila, Metro Manila' },
  { name: 'Pamantasan ng Lungsod ng Maynila', city: 'Manila, Metro Manila' },
  { name: 'Technological University of the Philippines', city: 'Manila, Metro Manila' },
  { name: 'Philippine Normal University', city: 'Manila, Metro Manila' },
  { name: 'Adamson University', city: 'Manila, Metro Manila' },
  { name: 'San Beda University', city: 'Manila, Metro Manila' },
  { name: 'Lyceum of the Philippines University – Manila', city: 'Manila, Metro Manila' },
  { name: 'National University', city: 'Manila, Metro Manila' },
  { name: 'Cavite State University', city: 'Indang, Cavite' },
  { name: 'Laguna State Polytechnic University', city: 'Santa Cruz, Laguna' },
  { name: 'Southern Luzon State University', city: 'Lucban, Quezon' },
  { name: 'University of San Carlos', city: 'Cebu City, Cebu' },
  { name: 'Cebu Technological University', city: 'Cebu City, Cebu' },
  { name: 'Silliman University', city: 'Dumaguete City, Negros Oriental' },
  { name: 'University of Mindanao', city: 'Davao City, Davao del Sur' },
  { name: 'Mindanao State University – Iligan', city: 'Iligan City, Lanao del Norte' },
  { name: 'Saint Louis University', city: 'Baguio City, Benguet' },
  { name: 'Central Luzon State University', city: 'Science City of Muñoz, Nueva Ecija' },
  { name: 'Bicol University', city: 'Legazpi City, Albay' },
  { name: 'West Visayas State University', city: 'Iloilo City, Iloilo' },
]

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ')

/** Every query word must appear in the name or city. Empty query returns nothing. */
export function searchSchools(query: string, limit = 8): School[] {
  const words = norm(query).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  return SCHOOLS.filter(s => { const hay = norm(`${s.name} ${s.city}`); return words.every(w => hay.includes(w)) }).slice(0, limit)
}
