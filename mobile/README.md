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

## Kitchen catalog

The Expo app bundles the recipes in `data/kitchen/recipes/` and their WebP photos in `assets/kitchen/`. Recipe URLs and existing meal-plan entries use the same slugs. The mobile catalog has its own recipe data.

- `npm run kitchen:validate` checks ingredients, meal and appliance labels, steps, costs, and duplicate entries.
- `npm run kitchen:check` checks the matching photo files and generated Metro imports.
- `npm run kitchen:photos -- <output.html>` creates an offline contact sheet with every dish.

To add a dish, use an existing recipe as a template and give it a unique slug. Use measure-and-unit ingredients, estimated whole pesos per serving, and sequential steps marked `prep`, `cook`, or `rest`. Set `timer: true` for steps where a countdown helps. The app adds up those estimates, including any chilling, soaking, or resting.

Run `npm run kitchen:prompt -- <recipe.json>` to get the photo prompt, then generate one dish photo. Run `npm run kitchen:add -- <recipe.json> <image-path>` to validate the entry, optimize its photo, and regenerate the catalog. After editing entries, run `npm run kitchen:build` and `npm run kitchen:check`.

The layout keeps Dormosaur’s two-column recipe grid and theme. Recipe search and one-step-at-a-time cooking take inspiration from the [Kitchen Stories mobile flow](https://pages.kitchenstories.com/en/app). The [research notes](data/kitchen/RESEARCH.md) describe the pricing and timing estimates.
