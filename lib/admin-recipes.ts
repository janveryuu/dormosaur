export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert'

export interface Recipe {
  id: string
  name: string
  mealType: MealType
  description: string
  cookTimeMinutes: number
  servings: number
  costUSD: number
  views: number
  image?: string
  dietaryTags: string[]
  ingredients?: string[]
  instructions?: string[]
}

export const INITIAL_ADMIN_RECIPES: Recipe[] = [
  {
    id: 'champorado-chocolate-rice',
    name: 'Champorado (Sweet Chocolate Rice Porridge)',
    mealType: 'Breakfast',
    description: 'Traditional Filipino sweet chocolate rice porridge made with glutinous rice and cocoa, topped with condensed milk.',
    cookTimeMinutes: 20,
    servings: 2,
    costUSD: 1.80,
    views: 1420,
    image: '/champorado_chocolate_rice_1786454664569.png',
    dietaryTags: ['Vegetarian', 'Budget Friendly'],
    ingredients: ['Glutinous Rice', 'Cocoa Powder', 'Sugar', 'Evaporated Milk'],
    instructions: ['Boil rice in water until soft', 'Stir in cocoa powder and sugar', 'Serve with milk'],
  },
  {
    id: 'sinangag-garlic-rice-egg',
    name: 'Sinangag (Garlic Fried Rice & Egg)',
    mealType: 'Breakfast',
    description: 'Classic student breakfast of fragrant garlic fried rice served with crispy fried egg and tomatoes.',
    cookTimeMinutes: 10,
    servings: 1,
    costUSD: 1.20,
    views: 2890,
    image: '/placeholder.jpg',
    dietaryTags: ['Quick & Easy', 'Gluten-Free'],
    ingredients: ['Day-old Rice', 'Minced Garlic', 'Egg', 'Cooking Oil', 'Salt'],
    instructions: ['Sauté garlic until golden', 'Add rice and toss', 'Fry egg on top'],
  },
  {
    id: 'kimchi-fried-rice',
    name: 'Kimchi Fried Rice',
    mealType: 'Lunch',
    description: 'Spicy, tangy Korean fried rice topped with a sunny-side-up egg and sesame seeds.',
    cookTimeMinutes: 15,
    servings: 2,
    costUSD: 2.20,
    views: 3100,
    image: '/placeholder.jpg',
    dietaryTags: ['Spicy', 'Quick & Easy'],
    ingredients: ['Kimchi', 'Rice', 'Gochujang', 'Egg', 'Sesame Oil'],
    instructions: ['Chop kimchi and sauté', 'Add rice and gochujang', 'Top with fried egg'],
  },
  {
    id: 'adobo-rice-bowl',
    name: 'Adobo Rice Bowl',
    mealType: 'Dinner',
    description: 'Savory chicken or pork adobo served over warm steamed white rice.',
    cookTimeMinutes: 25,
    servings: 2,
    costUSD: 3.50,
    views: 4500,
    image: '/placeholder.jpg',
    dietaryTags: ['High Protein', 'Savory'],
    ingredients: ['Chicken Thighs', 'Soy Sauce', 'Vinegar', 'Garlic', 'Bay Leaf'],
    instructions: ['Simmer chicken in soy sauce and vinegar', 'Reduce sauce until thick', 'Serve over rice'],
  },
]
