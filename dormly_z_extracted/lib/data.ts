export type SubjectColor = 1 | 2 | 3 | 4 | 5

export type ClassEntry = {
  id: string
  subject: string
  code: string
  instructor: string
  room: string
  days: string[]
  start: string
  end: string
  color: SubjectColor
  confidence?: 'high' | 'low'
  lowFields?: string[]
}

export const classes: ClassEntry[] = [
  {
    id: 'math101',
    subject: 'Calculus I',
    code: 'MATH 101',
    instructor: 'Dr. Elena Reyes',
    room: 'Sci Hall 204',
    days: ['Mon', 'Wed', 'Fri'],
    start: '08:30',
    end: '09:50',
    color: 1,
    confidence: 'high',
  },
  {
    id: 'chem120',
    subject: 'General Chemistry',
    code: 'CHEM 120',
    instructor: 'Prof. Marcus Hale',
    room: 'Lab B-12',
    days: ['Mon', 'Wed'],
    start: '10:15',
    end: '12:00',
    color: 2,
    confidence: 'low',
    lowFields: ['room'],
  },
  {
    id: 'eng205',
    subject: 'Modern Literature',
    code: 'ENG 205',
    instructor: 'Dr. Aiko Tanaka',
    room: 'Humanities 310',
    days: ['Tue', 'Thu'],
    start: '09:00',
    end: '10:20',
    color: 3,
    confidence: 'high',
  },
  {
    id: 'cs150',
    subject: 'Intro to Programming',
    code: 'CS 150',
    instructor: 'Prof. Danielle Okonkwo',
    room: 'Tech Center 118',
    days: ['Tue', 'Thu'],
    start: '13:00',
    end: '14:40',
    color: 4,
    confidence: 'low',
    lowFields: ['instructor'],
  },
  {
    id: 'psy110',
    subject: 'Psychology 101',
    code: 'PSY 110',
    instructor: 'Dr. Samir Patel',
    room: 'West Wing 22',
    days: ['Mon', 'Fri'],
    start: '15:00',
    end: '16:20',
    color: 5,
    confidence: 'high',
  },
  {
    id: 'phe100',
    subject: 'Fitness & Wellness',
    code: 'PHE 100',
    instructor: 'Coach Riley Brooks',
    room: 'Gym A',
    days: ['Sat'],
    start: '10:00',
    end: '11:30',
    color: 2,
    confidence: 'high',
  },
]

export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const rawScheduleSample = `MATH101 calculus 1 MWF 8:30-9:50am sci hall 204 reyes
chem 120 - general chem lab, mon/wed 10:15 to 12, lab b12
ENG205 modern lit TTh 9-10:20 humanities 310 (tanaka)
cs150 intro programming tues thurs 1pm-2:40pm tech center 118
psy 110 mon fri 3:00-4:20 west wing 22 dr patel
phe100 fitness sat 10-11:30 gym a`

export type Alarm = {
  id: string
  classId: string
  subject: string
  code: string
  time: string
  day: string
  lead: 15 | 30 | 60
  enabled: boolean
  color: SubjectColor
}

export const alarms: Alarm[] = [
  {
    id: 'a1',
    classId: 'math101',
    subject: 'Calculus I',
    code: 'MATH 101',
    time: '08:30',
    day: 'Today',
    lead: 30,
    enabled: true,
    color: 1,
  },
  {
    id: 'a2',
    classId: 'chem120',
    subject: 'General Chemistry',
    code: 'CHEM 120',
    time: '10:15',
    day: 'Today',
    lead: 15,
    enabled: true,
    color: 2,
  },
  {
    id: 'a3',
    classId: 'psy110',
    subject: 'Psychology 101',
    code: 'PSY 110',
    time: '15:00',
    day: 'Today',
    lead: 60,
    enabled: false,
    color: 5,
  },
  {
    id: 'a4',
    classId: 'eng205',
    subject: 'Modern Literature',
    code: 'ENG 205',
    time: '09:00',
    day: 'Tomorrow',
    lead: 30,
    enabled: true,
    color: 3,
  },
  {
    id: 'a5',
    classId: 'cs150',
    subject: 'Intro to Programming',
    code: 'CS 150',
    time: '13:00',
    day: 'Tomorrow',
    lead: 15,
    enabled: true,
    color: 4,
  },
]

export type Recipe = {
  slug: string
  title: string
  image: string
  minutes: number
  servings: number
  cost: string
  difficulty: 'Easy' | 'Medium'
  appliance: 'Microwave' | 'Rice cooker' | 'No cook' | 'Kettle' | 'Hot plate'
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  blurb: string
  ingredients: string[]
  steps: string[]
  tip: string
}

export const recipes: Recipe[] = [
  {
    slug: 'microwave-mug-pancakes',
    title: 'Microwave Mug Pancakes',
    image: '/recipes/mug-pancakes.png',
    minutes: 4,
    servings: 1,
    cost: '$0.90',
    difficulty: 'Easy',
    appliance: 'Microwave',
    meal: 'Breakfast',
    blurb: 'Fluffy stack energy, zero pan, zero cleanup.',
    ingredients: [
      '4 tbsp all-purpose flour',
      '1 tbsp sugar',
      '1/2 tsp baking powder',
      'Pinch of salt',
      '3 tbsp milk',
      '1 tsp oil or melted butter',
      'Maple syrup + berries to finish',
    ],
    steps: [
      'Whisk flour, sugar, baking powder and salt directly in a large mug.',
      'Pour in the milk and oil. Stir until just combined — a few lumps are fine.',
      'Microwave on high for 70–90 seconds. Stop as soon as the top is set.',
      'Let it rest 1 minute, then top with syrup and berries.',
    ],
    tip: 'Use a mug at least 350ml — the batter doubles in height while cooking and a small mug will overflow onto the microwave plate.',
  },
  {
    slug: 'rice-cooker-congee',
    title: 'Rice Cooker Congee',
    image: '/recipes/rice-cooker-congee.png',
    minutes: 45,
    servings: 2,
    cost: '$1.40',
    difficulty: 'Easy',
    appliance: 'Rice cooker',
    meal: 'Dinner',
    blurb: 'Set it, forget it, come back to comfort food.',
    ingredients: [
      '1/2 cup jasmine rice, rinsed',
      '4 cups water or stock',
      '1 tsp salt',
      '1 thumb ginger, sliced',
      '1 egg',
      'Scallions, sesame oil, soy sauce',
    ],
    steps: [
      'Rinse the rice until the water runs mostly clear, then add it to the rice cooker.',
      'Add water, salt and ginger. Run the porridge setting, or the normal cycle twice.',
      'Stir once halfway through so the rice does not stick to the base.',
      'Crack an egg into the hot congee and stir for 30 seconds until silky.',
      'Finish with scallions, a few drops of sesame oil and soy sauce.',
    ],
    tip: 'Keep the lid vent clear of the wall — congee foams more than rice and can spit starchy water down the back of your desk.',
  },
  {
    slug: 'no-cook-overnight-oats',
    title: 'No-Cook Overnight Oats',
    image: '/recipes/overnight-oats.png',
    minutes: 5,
    servings: 1,
    cost: '$0.75',
    difficulty: 'Easy',
    appliance: 'No cook',
    meal: 'Breakfast',
    blurb: 'Built at midnight, eaten on the walk to an 8:30.',
    ingredients: [
      '1/2 cup rolled oats',
      '1/2 cup milk or yogurt',
      '1 tsp chia seeds',
      '1 tsp honey',
      'Banana slices and berries',
    ],
    steps: [
      'Add oats, chia and honey to a jar with a lid.',
      'Pour in the milk, seal, and shake hard for 10 seconds.',
      'Refrigerate at least 6 hours — overnight is ideal.',
      'Top with fruit right before eating so it stays fresh.',
    ],
    tip: 'Make three jars on Sunday night. They keep for four days in a mini fridge and free up your entire morning routine.',
  },
  {
    slug: 'kettle-poached-eggs',
    title: 'Kettle-Poached Eggs',
    image: '/recipes/kettle-eggs.png',
    minutes: 8,
    servings: 1,
    cost: '$0.60',
    difficulty: 'Medium',
    appliance: 'Kettle',
    meal: 'Breakfast',
    blurb: 'Runny yolks from nothing but boiled water.',
    ingredients: [
      '2 eggs',
      'Boiling water from a kettle',
      '1 tsp vinegar',
      'Toast, salt, cracked pepper',
    ],
    steps: [
      'Boil a full kettle and pour it into a deep heatproof bowl or mug.',
      'Stir in the vinegar, then gently slide in one cracked egg.',
      'Cover with a plate and wait 4 minutes for a soft yolk, 6 for firm.',
      'Lift out with a spoon, drain, and serve on toast with salt and pepper.',
    ],
    tip: 'Crack the egg into a small cup first. Sliding it in gently keeps the white together instead of shredding into wisps.',
  },
  {
    slug: 'upgraded-instant-ramen',
    title: 'Upgraded Instant Ramen',
    image: '/recipes/upgraded-ramen.png',
    minutes: 10,
    servings: 1,
    cost: '$1.20',
    difficulty: 'Easy',
    appliance: 'Hot plate',
    meal: 'Lunch',
    blurb: 'Four cheap additions turn a packet into a real bowl.',
    ingredients: [
      '1 pack instant ramen',
      '1 egg',
      '2 tbsp frozen corn',
      '1 scallion, sliced',
      '1 tsp chili oil',
      'Half the seasoning packet',
    ],
    steps: [
      'Boil 400ml water, add the noodles and corn, and cook for 2 minutes.',
      'Add only half the seasoning packet so the broth is not overly salty.',
      'Crack the egg into the middle and cover for 90 seconds.',
      'Slide everything into a bowl, then finish with scallions and chili oil.',
    ],
    tip: 'Half the seasoning plus a splash of soy sauce gives a rounder broth with far less sodium than the packet intends.',
  },
  {
    slug: 'skillet-quesadilla',
    title: 'Two-Minute Quesadilla',
    image: '/recipes/skillet-quesadilla.png',
    minutes: 6,
    servings: 1,
    cost: '$1.10',
    difficulty: 'Easy',
    appliance: 'Hot plate',
    meal: 'Snack',
    blurb: 'The 11pm study-session classic, done properly.',
    ingredients: [
      '1 large flour tortilla',
      '1/2 cup shredded cheese',
      '2 tbsp black beans',
      'Salsa for dipping',
    ],
    steps: [
      'Heat a dry pan over medium until a drop of water sizzles.',
      'Lay the tortilla flat, scatter cheese and beans over one half only.',
      'Fold over and press down. Cook 2 minutes per side until golden.',
      'Rest 1 minute before cutting so the cheese sets instead of running out.',
    ],
    tip: 'No pan? Two minutes in the microwave on a plate works — then 30 seconds under a hot plate lid to crisp the outside.',
  },
]

export const profile = {
  name: 'Mika Alvarez',
  school: 'Northfield University',
  dorm: 'Ashwood Hall · Room 312',
  year: 'Sophomore',
  initials: 'MA',
}

export const subjectColorClass: Record<SubjectColor, { bg: string; text: string; soft: string }> = {
  1: { bg: 'bg-subject-1', text: 'text-subject-1', soft: 'bg-subject-1/12' },
  2: { bg: 'bg-subject-2', text: 'text-subject-2', soft: 'bg-subject-2/12' },
  3: { bg: 'bg-subject-3', text: 'text-subject-3', soft: 'bg-subject-3/12' },
  4: { bg: 'bg-subject-4', text: 'text-subject-4', soft: 'bg-subject-4/12' },
  5: { bg: 'bg-subject-5', text: 'text-subject-5', soft: 'bg-subject-5/12' },
}

export function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function minutesOf(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
