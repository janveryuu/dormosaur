# Dormosaur Mobile (Expo)

The student app. Backend, admin and APK landing stay in the Next.js project one level up.
Architecture and roadmap: `../docs/MOBILE_MASTER_PLAN.md`.

```bash
npm install
cp .env.example .env.local     # fill Supabase URL + anon key
npx expo start                 # open in Expo Go
npx eas-cli@latest build -p android --profile preview   # APK for the landing page
```

Without Supabase env vars the app runs in preview mode with sample data.

- `src/app` — routes (Expo Router)
- `src/design/tokens.ts` — colors, type, radius, shadow
- `src/components` — UI primitives
- `src/lib` — Supabase repo, time utils, local alarm scheduling, API client
- `src/state/app.tsx` — session + data provider
