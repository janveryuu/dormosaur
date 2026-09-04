# Dormosaur — Responsive & Mobile Layout Review Context (v0)

## Tech Stack & Framework
- **Framework**: Next.js 14+ (App Router with TypeScript)
- **Styling**: TailwindCSS, Vanilla CSS (`app/globals.css`), Radix / Shadcn UI primitives
- **Icons**: Lucide React (`lucide-react`)
- **Animations**: Framer Motion / Motion (`framer-motion`)

## Design System & Aesthetics
- **Aesthetic**: Premium iOS-inspired UI, native physical spring motion, rounded shape language (`rounded-2xl` / `rounded-3xl` / `rounded-4xl`).
- **Dark Mode**: Modern true-black / graphite palette (`#0A0A0A` base, `#121212` / `#1A1A1A` card surfaces).
- **Glassmorphism**: Frosted glass panels using `ios-glass` backdrop blur.

## Key Screens & Components for Mobile/Tablet Layout Optimization
1. **Schedule Weekly Grid** (`components/schedule/week-grid.tsx` & `app/(main)/schedule/page.tsx`):
   - Timetable grid layout, hour lines, day column headers, class block height calculations.
2. **App Navigation** (`components/app-nav.tsx`):
   - Desktop sidebar vs. mobile floating bottom navigation bar.
3. **Kitchen Recipe Grid** (`app/(main)/kitchen/page.tsx` & `components/kitchen/recipe-card.tsx`):
   - Filter chips horizontal overflow, 2-column mobile to 3-column tablet/desktop grid.
4. **Profile & Settings List Groups** (`app/(main)/profile/page.tsx` & `components/ios/list-group.tsx`):
   - Grouped settings cards, compact toggle alignment, mobile modal sheets.
5. **Template Picker & Exporter** (`components/schedule/template-picker.tsx`):
   - Live wallpaper layout previews and export controls on mobile viewports.
