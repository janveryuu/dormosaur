<p align="center">
  <img src="public/dormosaur-hi.png" alt="Dormosaur Mascot" width="160" />
</p>

<h1 align="center">🦖 Dormosaur</h1>

<p align="center">
  <strong>Dorm Life, Decoded.</strong><br>
  <em>The all-in-one companion for college dorm living — smart timetable parsing, synced class alarms, micro-kitchen dorm recipes, and an AI campus copilot.</em>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-Auth_%26_Postgres-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel" alt="Vercel" /></a>
</p>

---

## 🌟 Overview

College dorm life is packed with friction: messy syllabus schedules, chaotic early-morning wakeups, cramped rooms with zero stove access, and looming deadlines.

**Dormosaur** turns that scramble into calm. It takes raw, pasted class schedules or documents and automatically transforms them into an interactive timetable, synchronizes your alarms with custom walking lead-times, gives you 20+ delicious microwave/kettle/rice-cooker dorm recipes, and pairs you with an intelligent campus copilot.

---

## ✨ Features

### 📅 Smart Schedule & Timetable Engine
- **AI & Heuristic Schedule Parser**: Paste raw text from university portals (or OCR course rosters); Dormosaur extracts course codes, subject titles, instructors, section rooms, and day/time slots.
- **Dynamic Weekly Timetable**: Clean visual timetable with time indicators, conflict highlighting, and adaptive column density.
- **🎨 Aesthetic Wallpaper & PDF Exporters**: Turn your schedule into high-resolution phone lockscreens, desktop wallpapers, or printable PDFs with aesthetic visual themes (*Simple Modern, Ultra Pink, Cute Cat Blue, Pink Notebook, Sage Green, Forest Whimsy*).

### ⏰ Intelligent Alarms & Web Push
- **Class-Synced Smart Wakeup**: Calculates departure times based on walking lead times to your campus buildings.
- **Quiet Hours & Haptics**: Built-in sleep protection with native vibration haptics.
- **Web Push Notifications**: Delivers push alerts even when the browser or app tab is closed (VAPID / Service Worker powered).

### 🍳 Dorm Kitchen (Micro-Cooking)
- **Zero-Stove Micro-Recipes**: Curated student recipes optimized for electric kettles, microwaves, and mini rice cookers.
- **Detailed Step Guides**: Fast, high-protein, budget-friendly meals with precise student-tested timing and ingredient substitutions.

### 🦖 Dormosaur Copilot
- **Campus AI Tutor**: Fast, witty, context-aware AI assistant that knows your current class schedule, study gaps, and assignment deadlines.

### 📱 Native Mobile Feel & Offline PWA
- **iOS-Inspired Design Language**: Smooth spring physics (`framer-motion`), Cupertino segmented controls, frosted glass surfaces, and true dark mode.
- **Progressive Web App**: Install directly to your iPhone or Android home screen with offline caching.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 16 (Turbopack, App Router)](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Language** | [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI / Shadcn UI primitives, [Lucide React](https://lucide.dev/) |
| **Motion & Physics** | [Framer Motion](https://www.framer.com/motion/) |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL database, Row Level Security, Auth) |
| **Push Notifications** | Web Push API, Service Workers, VAPID key exchange |
| **Export Engines** | `html-to-image`, `jspdf` |
| **AI Integration** | Google Generative AI SDK, Groq SDK |

---

## 📁 Repository Structure

```text
DORMLY/
├── app/                        # Next.js App Router (pages & API routes)
│   ├── (auth)/                 # Sign-in & Sign-up flows
│   ├── (main)/                 # Authenticated dashboard, schedule, kitchen, profile
│   ├── admin/                  # Administrative management dashboard
│   ├── api/                    # API endpoints (AI chat, push, notifications cron, parser)
│   └── globals.css             # Tailwind v4 theme & iOS glass styling
├── components/                 # Reusable UI component library
│   ├── ai/                     # Dormosaur AI Copilot chat widgets
│   ├── dashboard/              # Next class cards, quick actions
│   ├── ios/                    # iOS-style switch, segmented controls, modal sheets
│   ├── kitchen/                # Recipe cards & step-by-step guides
│   ├── schedule/               # Weekly grid timetable & export preview
│   └── ui/                     # Base design system primitives
├── docs/                       # Project design notes & documentation
├── hooks/                      # Custom React hooks (useAuth, useSchedule, etc.)
├── lib/                        # Core utilities, schedule engines, Supabase client/server
│   ├── supabase/               # Supabase SSR client, server, and middleware
│   ├── parser.ts               # Heuristic syllabus schedule parser
│   ├── schedule-engine.ts      # Schedule gap analysis & alarm calculations
│   └── template-registry.ts    # Wallpaper visual export themes
├── public/                     # Static assets, sound effects, PWA manifests
│   ├── mascots/                # Dormosaur brand & mascot illustrations
│   ├── recipes/                # Micro-kitchen recipe imagery
│   └── templates/              # Visual schedule template graphics
├── .env.example                # Documented environment variable template
├── next.config.ts              # Next.js configuration
├── package.json                # Project dependencies & scripts
└── tsconfig.json               # TypeScript strict configuration
```

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/janveryuu/dormosaur.git
cd dormosaur
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to create your local `.env.local` file:
```bash
cp .env.example .env.local
```

Populate the required credentials in `.env.local`:
```env
# Supabase Backend & Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Web Push Notifications (Generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@dormosaur.app

# Vercel Cron Secret (for scheduled notifications)
CRON_SECRET=your-random-cron-secret
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience Dormosaur.

---

## 🔒 Security & Privacy

Dormosaur was built with student privacy at the core:
- **Row-Level Security (RLS)**: Users can only query and mutate their own schedules and settings.
- **Zero Ads or Third-Party Trackers**: We do not sell student habits, class timetables, or analytics to advertisers.

---

## 🤝 Contributing

Contributions, feedback, and recipe suggestions are always welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/CoolFeature`)
3. Commit your Changes (`git commit -m 'feat: add CoolFeature'`)
4. Push to the Branch (`git push origin feature/CoolFeature`)
5. Open a Pull Request

---

<p align="center">
  Made with 💚 for small rooms and long semesters.
</p>
