export type ScheduleEntry = {
  id: string;
  subject_name: string;
  subject_code: string;
  section: string;
  instructor: string;
  room: string;
  days: string[];
  start_time: string;
  end_time: string;
  color_tag: string;
  parse_confidence: "high" | "low";
};

export type Recipe = {
  id: string;
  title: string;
  image_url: string;
  cook_time_minutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  appliances_required: string[];
  ingredient_count: number;
  tags: string[];
  servings: number;
  estimated_cost: number;
  ingredients: { name: string; quantity: string; unit: string }[];
  steps: { step_number: number; instruction: string; timer_seconds?: number }[];
  dorm_tip: string;
  meal_type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
};

export const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  purple: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  blue: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  green: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  orange: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  pink: { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200" },
  teal: { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
};

export const MOCK_SCHEDULE: ScheduleEntry[] = [
  {
    id: "1",
    subject_name: "Mathematics 101",
    subject_code: "MATH 101",
    section: "A",
    instructor: "Prof. Santos",
    room: "Room 204",
    days: ["Mon", "Wed", "Fri"],
    start_time: "07:30",
    end_time: "08:30",
    color_tag: "purple",
    parse_confidence: "high",
  },
  {
    id: "2",
    subject_name: "English 2",
    subject_code: "ENG 2",
    section: "B",
    instructor: "Dr. Reyes",
    room: "Sci Bldg 101",
    days: ["Tue", "Thu"],
    start_time: "10:00",
    end_time: "11:30",
    color_tag: "blue",
    parse_confidence: "high",
  },
  {
    id: "3",
    subject_name: "Filipino 2",
    subject_code: "FIL 2",
    section: "A",
    instructor: "Prof. Cruz",
    room: "Room 108",
    days: ["Mon", "Wed", "Fri"],
    start_time: "12:00",
    end_time: "13:00",
    color_tag: "green",
    parse_confidence: "high",
  },
  {
    id: "4",
    subject_name: "Physical Education 1",
    subject_code: "PE 1",
    section: "C",
    instructor: "",
    room: "Gym",
    days: ["Wed"],
    start_time: "13:00",
    end_time: "15:00",
    color_tag: "orange",
    parse_confidence: "low",
  },
  {
    id: "5",
    subject_name: "Computer Programming 1",
    subject_code: "IT 101",
    section: "A",
    instructor: "Mr. dela Cruz",
    room: "Lab 3",
    days: ["Tue", "Thu"],
    start_time: "14:30",
    end_time: "16:00",
    color_tag: "pink",
    parse_confidence: "high",
  },
  {
    id: "6",
    subject_name: "Philippine History",
    subject_code: "HIST 1",
    section: "B",
    instructor: "Prof. Mendoza",
    room: "Room 302",
    days: ["Mon", "Wed"],
    start_time: "08:30",
    end_time: "10:00",
    color_tag: "teal",
    parse_confidence: "high",
  },
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: "1",
    title: "Microwave Scrambled Eggs",
    image_url: "/recipes/eggs.jpg",
    cook_time_minutes: 8,
    difficulty: "Easy",
    appliances_required: ["Microwave"],
    ingredient_count: 5,
    tags: ["Breakfast", "High-protein", "Quick"],
    servings: 1,
    estimated_cost: 45,
    meal_type: "Breakfast",
    dorm_tip: "No microwave-safe bowl? Use a ceramic mug instead! Cover loosely with a small plate while cooking to avoid splatter.",
    ingredients: [
      { name: "Eggs", quantity: "2", unit: "large" },
      { name: "Milk", quantity: "2", unit: "tbsp" },
      { name: "Salt", quantity: "1", unit: "pinch" },
      { name: "Pepper", quantity: "1", unit: "pinch" },
      { name: "Butter", quantity: "1", unit: "tsp" },
    ],
    steps: [
      { step_number: 1, instruction: "Crack eggs into a microwave-safe bowl. Add milk, salt, and pepper. Whisk well with a fork.", },
      { step_number: 2, instruction: "Add butter and microwave on HIGH for 30 seconds.", timer_seconds: 30 },
      { step_number: 3, instruction: "Remove and stir with a fork, pushing edges to center.", },
      { step_number: 4, instruction: "Microwave again for 30 seconds. Stir again.", timer_seconds: 30 },
      { step_number: 5, instruction: "Repeat until eggs are just barely set (about 1.5–2 min total). They should look slightly underdone — they continue cooking after you remove them.", },
      { step_number: 6, instruction: "Top with cheese if using. Serve immediately.", },
    ],
  },
  {
    id: "2",
    title: "Rice Cooker Garlic Fried Rice",
    image_url: "/recipes/garlic-rice.jpg",
    cook_time_minutes: 20,
    difficulty: "Easy",
    appliances_required: ["Rice Cooker"],
    ingredient_count: 6,
    tags: ["Lunch", "Filipino", "Budget"],
    servings: 2,
    estimated_cost: 30,
    meal_type: "Lunch",
    dorm_tip: "Use leftover rice from yesterday — day-old rice fries much better than freshly cooked rice. Keep it in the fridge overnight!",
    ingredients: [
      { name: "Cooked rice (day-old)", quantity: "2", unit: "cups" },
      { name: "Garlic", quantity: "4", unit: "cloves, minced" },
      { name: "Oil", quantity: "2", unit: "tbsp" },
      { name: "Soy sauce", quantity: "1", unit: "tbsp" },
      { name: "Salt", quantity: "1", unit: "to taste" },
      { name: "Green onions", quantity: "2", unit: "stalks (optional)" },
    ],
    steps: [
      { step_number: 1, instruction: "Turn on rice cooker to 'Cook' setting. Add oil once warm." },
      { step_number: 2, instruction: "Add garlic and stir quickly for about 30 seconds until fragrant.", timer_seconds: 30 },
      { step_number: 3, instruction: "Add cold day-old rice. Break up any clumps with a spatula." },
      { step_number: 4, instruction: "Drizzle soy sauce over rice. Stir and fold everything together." },
      { step_number: 5, instruction: "Close lid and let cook for 5 minutes, stirring once halfway.", timer_seconds: 300 },
      { step_number: 6, instruction: "Season with salt to taste. Top with chopped green onions and serve." },
    ],
  },
  {
    id: "3",
    title: "No-Cook Tuna Sandwich",
    image_url: "/recipes/tuna-sandwich.jpg",
    cook_time_minutes: 5,
    difficulty: "Easy",
    appliances_required: ["No-Cook"],
    ingredient_count: 6,
    tags: ["Lunch", "Quick", "Budget"],
    servings: 1,
    estimated_cost: 60,
    meal_type: "Lunch",
    dorm_tip: "Canned tuna lasts years unopened — stock 3–4 cans at a time. Mix in a little pickle relish if you can find it for extra flavor.",
    ingredients: [
      { name: "Canned tuna in water", quantity: "1", unit: "can (155g)" },
      { name: "Mayonnaise", quantity: "2", unit: "tbsp" },
      { name: "Onion", quantity: "¼", unit: "small, finely chopped" },
      { name: "Salt & pepper", quantity: "1", unit: "to taste" },
      { name: "Bread", quantity: "2", unit: "slices" },
      { name: "Lettuce", quantity: "1–2", unit: "leaves (optional)" },
    ],
    steps: [
      { step_number: 1, instruction: "Drain canned tuna and place in a bowl." },
      { step_number: 2, instruction: "Add mayonnaise and chopped onion. Mix well." },
      { step_number: 3, instruction: "Season with salt and pepper to taste." },
      { step_number: 4, instruction: "Spread tuna mixture on one slice of bread." },
      { step_number: 5, instruction: "Add lettuce if using, top with second slice, and serve." },
    ],
  },
  {
    id: "4",
    title: "Instant Ramen Upgrade",
    image_url: "/recipes/ramen.jpg",
    cook_time_minutes: 10,
    difficulty: "Easy",
    appliances_required: ["Electric Kettle"],
    ingredient_count: 5,
    tags: ["Dinner", "Quick", "Budget"],
    servings: 1,
    estimated_cost: 35,
    meal_type: "Dinner",
    dorm_tip: "Only use half the seasoning packet — it's way too salty. Add an egg (microwave-poached) or leftover canned goods to make it feel like a real meal.",
    ingredients: [
      { name: "Instant ramen noodles", quantity: "1", unit: "pack" },
      { name: "Egg", quantity: "1", unit: "large" },
      { name: "Green onion", quantity: "1", unit: "stalk" },
      { name: "Soy sauce", quantity: "1", unit: "tsp" },
      { name: "Sesame oil (optional)", quantity: "½", unit: "tsp" },
    ],
    steps: [
      { step_number: 1, instruction: "Boil 2 cups of water in your electric kettle.", timer_seconds: 180 },
      { step_number: 2, instruction: "Pour hot water into a bowl with the noodles. Cover with a plate and wait 3 minutes.", timer_seconds: 180 },
      { step_number: 3, instruction: "Meanwhile, crack egg into a small microwave-safe cup. Poke yolk with a toothpick. Add 3 tbsp water." },
      { step_number: 4, instruction: "Microwave egg on 50% power for 60–75 seconds until just set.", timer_seconds: 70 },
      { step_number: 5, instruction: "Drain most water from noodles. Add HALF the seasoning packet, soy sauce, and sesame oil." },
      { step_number: 6, instruction: "Top with poached egg and chopped green onions. Serve hot." },
    ],
  },
  {
    id: "5",
    title: "Microwave Mug Cake",
    image_url: "/recipes/mug-cake.jpg",
    cook_time_minutes: 6,
    difficulty: "Medium",
    appliances_required: ["Microwave"],
    ingredient_count: 7,
    tags: ["Snack", "Sweet", "Quick"],
    servings: 1,
    estimated_cost: 40,
    meal_type: "Snack",
    dorm_tip: "Use a large mug — the batter will rise! Don't overmix or overcook. It should look slightly underdone in the center when you take it out; it firms up as it cools.",
    ingredients: [
      { name: "All-purpose flour", quantity: "4", unit: "tbsp" },
      { name: "Sugar", quantity: "4", unit: "tbsp" },
      { name: "Cocoa powder", quantity: "2", unit: "tbsp" },
      { name: "Egg", quantity: "1", unit: "large" },
      { name: "Milk", quantity: "3", unit: "tbsp" },
      { name: "Oil", quantity: "3", unit: "tbsp" },
      { name: "Chocolate chips", quantity: "2", unit: "tbsp (optional)" },
    ],
    steps: [
      { step_number: 1, instruction: "Add all dry ingredients (flour, sugar, cocoa) to a large mug. Mix with a fork." },
      { step_number: 2, instruction: "Add egg, milk, and oil. Mix until smooth with no dry lumps." },
      { step_number: 3, instruction: "Stir in chocolate chips if using." },
      { step_number: 4, instruction: "Microwave on HIGH for 60–90 seconds. Check at 60 seconds.", timer_seconds: 75 },
      { step_number: 5, instruction: "The cake is done when the top is just set but looks slightly moist in the center. Let cool 1 minute before eating." },
    ],
  },
  {
    id: "6",
    title: "Rice Cooker Arroz Caldo",
    image_url: "/recipes/arroz-caldo.jpg",
    cook_time_minutes: 35,
    difficulty: "Easy",
    appliances_required: ["Rice Cooker"],
    ingredient_count: 8,
    tags: ["Breakfast", "Filipino", "Comfort Food"],
    servings: 2,
    estimated_cost: 80,
    meal_type: "Breakfast",
    dorm_tip: "Arroz caldo is perfect for when you're feeling sick or it's cold. Double the recipe and store leftovers in the fridge — it reheats beautifully in the microwave.",
    ingredients: [
      { name: "Rice (uncooked)", quantity: "½", unit: "cup" },
      { name: "Chicken (canned or leftover)", quantity: "100", unit: "g, shredded" },
      { name: "Ginger", quantity: "1", unit: "thumb-sized, sliced" },
      { name: "Garlic", quantity: "3", unit: "cloves, minced" },
      { name: "Onion", quantity: "½", unit: "small, chopped" },
      { name: "Chicken broth/water", quantity: "4", unit: "cups" },
      { name: "Soy sauce", quantity: "1", unit: "tbsp" },
      { name: "Green onions", quantity: "2", unit: "stalks, for topping" },
    ],
    steps: [
      { step_number: 1, instruction: "Add a little oil to rice cooker. Switch to 'Cook'. Sauté garlic, onion, and ginger for 2 minutes." },
      { step_number: 2, instruction: "Add rice and stir to coat with the aromatics." },
      { step_number: 3, instruction: "Add chicken, broth/water, and soy sauce. Stir everything together." },
      { step_number: 4, instruction: "Close lid and cook on regular cycle. When it switches to 'Warm,' stir well — the consistency should be like thick porridge." },
      { step_number: 5, instruction: "If too thick, add a little hot water and stir. If too thin, keep on 'Warm' with lid open for 5 minutes." },
      { step_number: 6, instruction: "Serve hot topped with green onions and a drizzle of soy sauce." },
    ],
  },
  {
    id: "7",
    title: "Kettle-Poached Oatmeal Bowl",
    image_url: "/recipes/oatmeal.jpg",
    cook_time_minutes: 5,
    difficulty: "Easy",
    appliances_required: ["Electric Kettle"],
    ingredient_count: 5,
    tags: ["Breakfast", "Healthy", "Budget"],
    servings: 1,
    estimated_cost: 25,
    meal_type: "Breakfast",
    dorm_tip: "Instant oats are better than rolled oats for kettle cooking. Add peanut butter for protein — it makes you full way longer between classes.",
    ingredients: [
      { name: "Instant oats", quantity: "½", unit: "cup" },
      { name: "Boiling water", quantity: "¾", unit: "cup" },
      { name: "Banana", quantity: "½", unit: "sliced" },
      { name: "Honey or sugar", quantity: "1", unit: "tbsp" },
      { name: "Peanut butter", quantity: "1", unit: "tbsp (optional)" },
    ],
    steps: [
      { step_number: 1, instruction: "Boil water in your electric kettle.", timer_seconds: 120 },
      { step_number: 2, instruction: "Pour instant oats into a bowl. Add boiling water. Cover with a plate and wait 2 minutes.", timer_seconds: 120 },
      { step_number: 3, instruction: "Stir well. The oats should be thick and creamy." },
      { step_number: 4, instruction: "Top with banana slices, drizzle honey, and add a spoonful of peanut butter." },
    ],
  },
  {
    id: "8",
    title: "Microwave Chicken Tinola",
    image_url: "/recipes/tinola.jpg",
    cook_time_minutes: 18,
    difficulty: "Medium",
    appliances_required: ["Microwave"],
    ingredient_count: 7,
    tags: ["Dinner", "Filipino", "Healthy"],
    servings: 2,
    estimated_cost: 120,
    meal_type: "Dinner",
    dorm_tip: "Use chicken wings — they cook faster than breast or thigh. If you can't find sayote (chayote), use chopped green papaya or even potatoes.",
    ingredients: [
      { name: "Chicken wings", quantity: "250", unit: "g" },
      { name: "Sayote/chayote", quantity: "1", unit: "small, cubed" },
      { name: "Ginger", quantity: "1", unit: "thumb, sliced thin" },
      { name: "Garlic", quantity: "3", unit: "cloves, crushed" },
      { name: "Fish sauce", quantity: "1", unit: "tbsp" },
      { name: "Water", quantity: "2", unit: "cups" },
      { name: "Malunggay leaves (optional)", quantity: "1", unit: "handful" },
    ],
    steps: [
      { step_number: 1, instruction: "In a deep microwave-safe bowl, combine chicken, ginger, garlic, fish sauce, and water." },
      { step_number: 2, instruction: "Cover tightly with microwave-safe wrap or a plate. Microwave on HIGH for 8 minutes.", timer_seconds: 480 },
      { step_number: 3, instruction: "Carefully remove cover (hot steam!). Add sayote pieces." },
      { step_number: 4, instruction: "Cover again and microwave for another 7 minutes until sayote is tender.", timer_seconds: 420 },
      { step_number: 5, instruction: "Add malunggay leaves if using. Microwave uncovered for 1 more minute.", timer_seconds: 60 },
      { step_number: 6, instruction: "Taste and adjust with fish sauce. Serve over steamed rice." },
    ],
  },
  {
    id: "9",
    title: "No-Cook Overnight Yogurt Parfait",
    image_url: "/recipes/parfait.jpg",
    cook_time_minutes: 5,
    difficulty: "Easy",
    appliances_required: ["No-Cook"],
    ingredient_count: 4,
    tags: ["Breakfast", "Snack", "Healthy"],
    servings: 1,
    estimated_cost: 70,
    meal_type: "Breakfast",
    dorm_tip: "Prep this the night before — put it in the fridge and it's ready when you wake up before an 8am class. Use any fruit you have or even jam instead.",
    ingredients: [
      { name: "Greek yogurt", quantity: "1", unit: "cup" },
      { name: "Granola", quantity: "¼", unit: "cup" },
      { name: "Banana or berries", quantity: "½", unit: "cup, sliced" },
      { name: "Honey", quantity: "1", unit: "tbsp" },
    ],
    steps: [
      { step_number: 1, instruction: "In a cup or bowl, add half the yogurt as the base layer." },
      { step_number: 2, instruction: "Add half the granola on top of the yogurt." },
      { step_number: 3, instruction: "Add a layer of fruit." },
      { step_number: 4, instruction: "Repeat layers with remaining yogurt, granola, and fruit." },
      { step_number: 5, instruction: "Drizzle honey on top. Eat immediately or cover and refrigerate overnight." },
    ],
  },
  {
    id: "10",
    title: "Rice Cooker Champorado",
    image_url: "/recipes/champorado.jpg",
    cook_time_minutes: 25,
    difficulty: "Easy",
    appliances_required: ["Rice Cooker"],
    ingredient_count: 5,
    tags: ["Breakfast", "Filipino", "Sweet"],
    servings: 2,
    estimated_cost: 50,
    meal_type: "Breakfast",
    dorm_tip: "Champorado thickens as it cools. Add a splash of fresh milk (or evaporated milk from a can) on top before eating for the classic dorm breakfast experience.",
    ingredients: [
      { name: "Glutinous rice (malagkit)", quantity: "½", unit: "cup" },
      { name: "Cocoa powder or tablea", quantity: "3", unit: "tbsp" },
      { name: "Sugar", quantity: "3", unit: "tbsp" },
      { name: "Water", quantity: "3", unit: "cups" },
      { name: "Evaporated milk", quantity: "4", unit: "tbsp (to serve)" },
    ],
    steps: [
      { step_number: 1, instruction: "Rinse glutinous rice and place in rice cooker with water." },
      { step_number: 2, instruction: "Add cocoa powder and sugar. Stir until dissolved." },
      { step_number: 3, instruction: "Cook on regular rice cycle. Stir every 5–7 minutes to prevent sticking." },
      { step_number: 4, instruction: "When cycle ends, check consistency — it should be thick and porridge-like. Add water if too thick." },
      { step_number: 5, instruction: "Serve in bowls, drizzle evaporated milk on top." },
    ],
  },
  {
    id: "11",
    title: "Microwave Sinigang-Style Soup",
    image_url: "/recipes/sinigang.jpg",
    cook_time_minutes: 15,
    difficulty: "Medium",
    appliances_required: ["Microwave"],
    ingredient_count: 6,
    tags: ["Dinner", "Filipino", "Healthy"],
    servings: 1,
    estimated_cost: 75,
    meal_type: "Dinner",
    dorm_tip: "Use a sinigang mix packet — it's cheap, lasts forever, and gives you authentic flavor. Pork belly or any pork cuts work, but pre-sliced shabu-shabu pork from the supermarket cooks fastest.",
    ingredients: [
      { name: "Pork or shrimp", quantity: "150", unit: "g" },
      { name: "Sinigang mix", quantity: "½", unit: "packet (22g)" },
      { name: "Water", quantity: "2", unit: "cups" },
      { name: "Kangkong or spinach", quantity: "1", unit: "handful" },
      { name: "Tomato", quantity: "1", unit: "medium, quartered" },
      { name: "Onion", quantity: "¼", unit: "medium, sliced" },
    ],
    steps: [
      { step_number: 1, instruction: "Combine pork/shrimp, tomato, onion, and water in a deep microwave-safe bowl." },
      { step_number: 2, instruction: "Sprinkle sinigang mix. Stir to combine. Cover tightly." },
      { step_number: 3, instruction: "Microwave on HIGH for 8 minutes.", timer_seconds: 480 },
      { step_number: 4, instruction: "Carefully open cover. Stir and check if protein is cooked through." },
      { step_number: 5, instruction: "Add kangkong/spinach. Microwave uncovered for 2 minutes.", timer_seconds: 120 },
      { step_number: 6, instruction: "Taste — add more sinigang mix for tangier broth. Serve with rice." },
    ],
  },
  {
    id: "12",
    title: "No-Cook Peanut Butter Banana Toast",
    image_url: "/recipes/pb-toast.jpg",
    cook_time_minutes: 3,
    difficulty: "Easy",
    appliances_required: ["No-Cook"],
    ingredient_count: 3,
    tags: ["Breakfast", "Snack", "Quick"],
    servings: 1,
    estimated_cost: 20,
    meal_type: "Breakfast",
    dorm_tip: "Get a jar of peanut butter — it's the single most cost-effective protein source for a dorm student. Keeps for months and works in dozens of snacks.",
    ingredients: [
      { name: "Bread", quantity: "2", unit: "slices" },
      { name: "Peanut butter", quantity: "2", unit: "tbsp" },
      { name: "Banana", quantity: "½", unit: "sliced" },
    ],
    steps: [
      { step_number: 1, instruction: "Spread peanut butter generously on both slices of bread." },
      { step_number: 2, instruction: "Layer banana slices on one side." },
      { step_number: 3, instruction: "Press together or eat open-face. That's it." },
    ],
  },
];

export const RAW_SCHEDULE_SAMPLE = `MATH 101 - A
MWF 7:30-8:30am Room 204 Main Bldg
Prof. Santos

ENG 2 sec B
TTH 10:00-11:30 Sci Bldg 101 Dr. Reyes

Filipino 2 MWF 12-1pm Rm 108 Prof Cruz

PE 1 - C Wednesday only 1-3pm GYM
(no instructor listed)

IT101 CompProg1 TTH 2:30-4:00 Lab3 Mr. dela Cruz

HIST 1 B Mon & Wed 8:30-10 Rm 302 Prof Mendoza`;
