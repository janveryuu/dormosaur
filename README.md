<p align="center">
  <img src="public/android-chrome-512x512.png" alt="Dormosaur app icon" width="128" height="128" />
</p>

<h1 align="center">Dormosaur</h1>
<p align="center"><strong>Dorm life, decoded.</strong></p>
<p align="center">Schedules, deadlines, dorm-friendly meals, and an AI study companion.</p>
<p align="center"><a href="https://dormosaur.vercel.app/">Open Dormosaur</a> · <a href="docs/android.md">Android release guide</a> · <a href="docs/copilot.md">Copilot documentation</a></p>

## Features

- Import a class schedule from text or images, review the results, and explore a weekly timetable.
- Export schedules as wallpapers or PDFs using customizable visual themes.
- Track deadlines and calculate class reminders with walking lead times.
- Browse dorm recipes, plan meals, and maintain a grocery list.
- Ask the campus copilot for help with schedules, study planning, and meals.
- Use responsive layouts, light and dark themes, and browser push notifications.

AI imports should be reviewed before saving. Notifications require permission, configured server keys, and a supported browser; they are reminders rather than native exact-time alarm-clock guarantees. Server-backed features require internet access.

## Stack

Next.js 16.3 · React 19 · TypeScript · Tailwind CSS 4 · Supabase Auth/Postgres · Groq/Gemini · Vercel

The Android release uses Google's Android Browser Helper to open the deployed application in a Trusted Web Activity. Its launcher icon matches the website favicon.

## Local development

Use Node.js 22 or newer.

```bash
git clone https://github.com/janveryuu/dormosaur.git
cd dormosaur
npm ci
```

Copy `.env.example` to `.env.local` and fill in the services you use. Supabase's URL and anonymous key are required for authentication. Keep service-role keys, AI provider keys, push private keys, and cron secrets on the server. Set `NEXT_PUBLIC_APP_URL` to the public website URL in production.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Verification and releases

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm audit
```

GitHub Actions checks types, Copilot tests, production dependency advisories, the web build, and Android compilation/linting. The local ESLint command also reports existing application diagnostics that need separate cleanup. See [release verification](docs/release-verification.md) for results and remaining checks.

For a signed Android package:

```bash
npm run android:build
```

See [the Android release guide](docs/android.md) for signing, website verification, installation, and device checks. The output is `dormosaur.apk`; private signing files and generated build outputs are excluded from Git.

## Repository

| Directory | Contents |
| --- | --- |
| `app/` | Pages, layouts, and server API routes |
| `components/` | Interface, schedule, kitchen, and admin components |
| `hooks/` | Authentication and interface hooks |
| `lib/` | Data helpers, parsers, notifications, and Copilot services |
| `public/` | App icons, artwork, recipes, service worker, and web manifest |
| `android/` | Android launcher project and Gradle wrapper |
| `scripts/`, `tests/` | Build helpers and automated tests |
| `docs/` | Setup and product documentation |
| `design-system/` | Visual references and original brand artwork |
| `remotion/` | Product video compositions |

## Deployment

Deploy the Next.js app to Vercel and configure production environment variables using `.env.example`. Configure Supabase's site URL and allowed auth redirects for the production domain. Notification jobs use the schedules in `vercel.json` and require their corresponding secrets.

For Android fullscreen verification, the deployed site must serve `/.well-known/assetlinks.json` publicly with the release signing certificate fingerprint. Website updates are delivered by the hosted app; Android package updates must retain the signing key and increase the version code.

## Contributing

Create a focused branch, describe the change and its validation, and open a pull request. Never commit credentials, signing keys, personal data, generated APKs, or build output.

<p align="center">Made for small rooms and long semesters.</p>
