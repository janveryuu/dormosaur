# Dormosaur Mobile — Master Implementation & Architecture Plan

Goal: Dormosaur becomes a **native mobile app first** (React Native + Expo), distributed as an APK.
The Next.js project stays as the **backend, admin console, and APK download landing page**.

## 1. Target architecture

```
DORMOSAUR/
├── mobile/                 Expo SDK 58 app (the student product)
│   ├── src/app/            Expo Router routes
│   │   ├── (auth)/         sign-in, sign-up
│   │   ├── (tabs)/         Today · Schedule · Tasks · Kitchen
│   │   ├── onboarding.tsx
│   │   ├── add.tsx         quick-add sheet (class / task / import)
│   │   ├── import.tsx      schedule scan (photo or paste)
│   │   ├── alarms.tsx, profile.tsx, recipe/[slug].tsx
│   ├── src/design/         tokens (color, type, space, radius, shadow)
│   ├── src/components/     UI primitives (Card, Button, Text, Ring, WeekStrip, TabBar…)
│   ├── src/lib/            supabase client, data repo, time utils, recipes, notifications
│   └── src/state/          AppData provider (classes, alarms, deadlines, profile)
├── app/                    Next.js: /api/* backend, /admin, landing (APK download)
├── lib/                    server logic: parsing, OCR, AI, push, email
└── docs/                   this plan
```

| Layer | Before | After |
|---|---|---|
| Student UI | Next.js pages + shadcn + Tailwind + framer-motion | Expo Router + RN primitives + Reanimated |
| Auth | Supabase SSR cookies | supabase-js + AsyncStorage session |
| Data | Supabase via `lib/db.ts` | Same tables, same row mappers, ported to `mobile/src/lib/repo.ts` |
| AI / OCR / parsing | `/api/*` with cookie auth | Same routes; now also accept `Authorization: Bearer <jwt>` |
| Alarms / reminders | Web push + cron | On-device `expo-notifications` scheduled locally (works offline) |
| Distribution | Capacitor APK wrapper of the website | EAS build → `dormosaur.apk`, served by the landing page |
| Admin | Next.js `/admin` | Unchanged |

Tables are unchanged: `profiles`, `classes`, `alarms`, `deadlines`, `meal_plan`, `grocery_items`.

## 2. Design direction — "Quiet campus, loud moments"

References: Tarsi (illustrated header + mascot overlapping a white figure card), LearnShift
(soft gray canvas, white rounded cards, one hero number, mascot in a single card, centered + tab).

Rules:
- **Features over words.** No subtitles explaining the UI, no taglines inside the app, no emojis.
  One label per number. Headlines are nouns ("Today", "Schedule"), not sentences.
- **Canvas** `#F3F3EF` warm gray; **cards** pure white, radius 24, no borders, one soft shadow.
- **One hero per screen**: Today = next-class countdown ring; Schedule = day timeline;
  Tasks = due-this-week count; Kitchen = photo grid.
- **Brand**: forest green `#1E5C40` for primary actions, sun `#F4C54A` only for live/now moments.
  Five soft subject colors (mint, sky, peach, lilac, butter) for classes.
- **Type**: Plus Jakarta Sans. Display 800 with tight tracking for big numbers; small caps
  labels at 11px/700 with letter spacing; body 15–16px.
- **Icons**: lucide stroke icons at 1.75–2px, never decorative fillers.
- **Mascot**: once per screen at most (Today hero card, empty states, onboarding). Never as wallpaper.
- **Navigation**: floating white tab bar with 4 tabs + centered green "+" (quick add).
  Profile lives behind the avatar on Today.
- **Touch**: ≥ 44pt targets, haptic tick on toggles and completion.
- **Motion**: Reanimated springs for press scale (0.97) and ring progress; respect reduce-motion.

## 3. Phases

1. **Foundation** — Expo scaffold, tokens, fonts, primitives, Supabase auth, AppData provider. ✅
2. **Core screens** — Sign in/up, onboarding, Today, Schedule, Tasks, Kitchen, Recipe, Alarms,
   Profile, Quick add, Schedule import (photo + paste via `/api/schedule/parse`). ✅
3. **Backend bridge** — Bearer-token auth in `lib/api-security.ts` so every AI route serves mobile. ✅
4. **Landing** — `/` becomes an APK download page (`/dormosaur.apk`), ready for a later redesign. ✅
5. **Feature parity** — Copilot chat, meal planner + grocery list, deadline import (photo/paste),
   schedule wallpapers (approved backgrounds ported from the web registry), Expo server push for
   deadline reminders (`/api/push/expo`; class alarms stay local), native date/time pickers, ESLint. ✅
6. **Retire the web student app** — `app/(main)`, `app/onboarding`, web sign-up, Capacitor `android/`
   and their components removed. Old student URLs redirect to `/`. Web `/sign-in` serves admins only. ✅
7. **Next** — design pass on the mobile UI, FCM credentials in EAS for Android push, Play Store
   `production` profile, `.easignore` to slim build uploads.

## 4. Running

```bash
cd mobile
cp .env.example .env          # EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY / EXPO_PUBLIC_API_URL
npx expo start                # scan with Expo Go
npx eas-cli@latest build -p android --profile preview   # produces the APK (env comes from EAS "preview" environment)
```
