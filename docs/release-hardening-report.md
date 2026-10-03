# Dormosaur final release hardening

Date: 2026-10-03. Baseline: clean `main`, commit `f8dc9ba`. The hardening changes are packaged on the `codex/release-hardening` review branch following explicit user authorization to commit and push. No deployment, production data mutation, migration, or live student notification/email was performed.

**Release decision: configuration and live-auth QA required before deployment.** The verified patch addresses confirmed failures, but the unchanged baseline commit is not a hardened release.

## A. Critical bugs found and fixed

- Signup retried rejected school addresses as inaccessible `@dormosaur.app` identities. Removed that conversion; real addresses and Supabase confirmation remain authoritative.
- Resend previously sent a branded tokenless callback link. It now delegates tokenized signup confirmation to Supabase and handles provider/rate failures safely.
- Notification cron depended on a browser session and had no durable deduplication. It now requires `CRON_SECRET`, reads eligible users through server-only privileged access, respects timezone/preferences, and claims unique reminder events before sending. **Missing delivery tracking returns 503 without sending.**
- Deadline fallback fabricated dates/course codes; schedule-edit fallback selected the first class. Unknown academic fields now require review; ambiguous edits require clarification and preserve explicit confirmation.
- AI/parser/recipe routes accepted anonymous expensive requests. All eight cost-bearing routes now require a verified, non-anonymous session.
- Account switches could display previous student data and leave private dialogs/imports open. Account changes clear old visible state, forms, current/legacy drafts, source images, and Copilot conversations.

## B. Important bugs found and fixed

- Collection saves deleted cloud rows before a replacement insert could fail. Saves now upsert first and only reconcile owned rows after successful writes; failed saves preserve data and expose Retry.
- Empty cloud collections incorrectly retained local stale records. Cloud hydration, caches and async responses are owner-scoped; empty results are authoritative, and failed reads do not masquerade as empty results.
- Profile writes referenced columns absent from the live schema. Avatar uses auth metadata; notification preferences use owned auth metadata/local state. Profile writes are allowlisted to the authenticated owner.
- Deadline timestamps, calendar import/export, Today and alarm calculations mixed UTC/server time with student time. Conversion now uses the profile timezone, including midnight boundaries and invalid local times.
- Onboarding could report completion before saving its profile. Completion now follows an acknowledged profile save.
- Notification controls could wait indefinitely for an inactive worker or report failed device removal as success. Registration/network waits are bounded and removal errors recover.
- Camera requests and AI requests lacked sufficient lifecycle cleanup; repeated digest/nudge effects caused avoidable requests. Added cancellation, stable hydration and scoped caching.

## C. Minor UI/polish fixes

Existing layouts and artwork are retained. Fixed modal focus/Escape behavior, labels/error announcements, review footer spacing, stale form resets and truthful provider badges. Mobile light-only CSS made night-mode headings, deadlines, alarms and Copilot text unreadable; existing semantic colors now supply readable contrast.

## D. Security hardening

All 18 API routes were reviewed. JSON/text/image sizes are bounded; authenticated AI operations have per-user, per-runtime admission limits. Push subscriptions/devices are owner-scoped, and endpoints accept known HTTPS push providers to prevent arbitrary server requests. Admin access requires server-controlled authorization rather than a user-editable profile flag. Callback redirects are restricted; refreshed cookies survive proxy redirects. Production test/probe routes return 404 before expensive work. Errors/logs omit provider internals, credentials and private prompts. Private credential values were absent from tracked source and production browser assets.

The review branch explicitly disables automatic Vercel deployments through `git.deploymentEnabled` in `vercel.json`, preserving the instruction to push without deploying. Other branches retain their existing deployment behavior. [Vercel branch deployment configuration](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled).

| Routes | Access and checks |
| --- | --- |
| chat; schedule parse/edit; deadline parse; recipe generate/schedule-aware; smart-nudge; weekly digest | Authenticated, bounded and rate-limited. Academic/meal context uses owned server data where authoritative context is required. |
| auth callback | Public by design; Supabase code/token verification, safe redirects and recoverable expired-link errors. |
| auth resend-confirmation | Public by design; bounded email, per-address limit, real Supabase confirmation provider. |
| push subscribe; notification subscribe; push devices and device deletion | Authenticated and owner-scoped; bounded inputs and push endpoint validation. |
| notification cron | Constant-time secret check, server-only privileged reads, durable claims and timezone/preferences. |
| notification test-push/test-deadline; schedule GET probe | Disabled in production; authenticated/limited in development. |
| admin settings | Server-controlled admin authorization; bounded allowlisted settings. |

## E. Performance improvements

Enabled the existing Next image optimizer for local UI images and resized small Copilot/chef assets. A real 640px header rendition measured **60,816 bytes versus 2,777,374 bytes (97.8% smaller)**. OCR originals and template export backgrounds retain their original capture quality. Cached/cancelled digest work and limited nudge requests avoid duplicate AI calls. The template picker retains small thumbnails instead of eagerly mounting all artboards.

## F–M. Feature status

| Section | Status |
| --- | --- |
| F — Auth | BatState/Gmail fixture signup preserves the entered email with one submission. Wrong password, resend provider failure, expired callback, onboarding and sign-out code paths are hardened. Read-only live auth settings show confirmation enabled and email/Google enabled; 144 auth identities contained **zero synthetic authentication emails**. Actual SMTP delivery and Google consent/redirect still need a dedicated QA account. |
| G — Schedule scanner | Preserved Gemini vision → bounded dense-grid retry → real Tesseract/local fallback → partial review. Live primary returned 503/429; fallback recovered **12/12 meetings in PNG, JPG and simulated photo, 11/12 in PDF**, without invented course/day data. Real isolated deployment OCR/PDF runs pass. A Gemini 2.5 schedule experiment failed correctness checks and was **not adopted**; the original 3.8 default remains. |
| H — Alarms/notifications | First/middle/last alarms, 15/30/60-minute leads and persistence pass at seven widths without time overlap. Orphans/disabled alarms and duplicate reminders are handled. Cron logic and concurrent claims pass simulated multi-user tests. **Live scheduled delivery is blocked until the ledger and server cron configuration are ready.** No live pushes were sent. |
| I — Deadlines | Unknown course/date/time stays unset or flagged for review. Review blocks save without a date/time and persists the confirmed student-local time as UTC. Current provider/OCR architecture replaces obsolete vision references. Legacy saved data is preserved. |
| J — Copilot | 39 deterministic tests and three live-provider tests pass: distinct social/meta replies, follow-up rooms/classes, real context, study help, meals, scope boundaries, injection resistance, outages and truthful runtime identity. Groq primary/secondary and Gemini chat fallback were healthy with synthetic context. |
| K — Kitchen | Generation is authenticated, validates JSON/ingredients/equipment and uses safe fallbacks. Schedule-aware meals use the owned profile and timetable. Fixed raw/uncooked meat and rice reinterpretation, unselected step ingredients, egg temperatures and catalog kettle/hot-plate mismatches. Kettle egg dishes require commercially pasteurized eggs suitable for uncooked use. |
| L — Templates/export | All eight approved templates remain active, including both legacy mappings. Seven-width previews pass; **36 real downloads** cover every template's phone PNG/JPEG/PDF and representative desktop/print formats. Background/font readiness, nonblank captures, real fixtures, long codes, weekends, dense 35-class and empty schedules pass. |
| M — Database/RLS | Live inspection was read-only. Anonymous reads exposed zero rows across seven private tables. Owner filters and failed-save protection pass regression tests. No RLS disabling, browser service-role use, destructive migration or student data reset occurred. Authenticated cross-user live RLS policies are not independently proven without QA sessions/SQL policy access. |

Active templates: Ultra Pink; Pink Notebook; Cute Cat Blue; Ocean Party; Sage Green Nature; Forest Whimsy; Dormosaur Adventure; Dormosaur Night Mode. Legacy `simple-modern` → Sage Green and `dormosaur-classic` → Dormosaur Adventure remain intact.

## N. Test results

| Check | Before edits | Final |
| --- | --- | --- |
| `npm run typecheck` | Pass | **Pass** |
| `npm run lint` | Fail: 48 errors, 116 warnings | **Pass: 0 errors, 118 advisory warnings** |
| `npm test` | 39 Copilot tests pass | **Pass: 39 Copilot + 49 hardening tests**, scanner and template-registry assertions |
| `npm run build` | Pass | **Pass: Next 16.3.8, 58 generated pages**, no temporary QA routes |
| `npm audit --omit=dev` | Six high transitive findings | **Zero vulnerabilities**, after moving the development-only shadcn CLI to devDependencies |

Additional verification: real Tesseract PNG/JPG/photo/PDF; isolated production worker/WASM/English-data/PDF tracing for both parsers; anonymous/auth/admin/debug protections against compiled API routes; credential scan; seven-width alarm regression; 98 light-layout checks and 12 dark-layout checks on real screens with isolated owned fixtures, plus form/save/retry/account-switch/Copilot actions and dark text contrast. Template previews and exports passed again after image optimization.

Browser network fixtures kept all student data and email delivery untouched. Full real new/existing-user journeys, physical iOS keyboard/background-push delivery and real OAuth/SMTP are **not claimed tested**. Local production analytics depends on Vercel's hosting asset and cannot be fully verified by `next start`.

Compiled landing/signup/signin also passed at all seven widths with fonts, images and console checks. The Vercel-only analytics script was replaced by a local QA stand-in; hosting-platform analytics was not claimed tested.

Detailed command output, fixture screenshots and exported QA artifacts are retained under ignored `scratch/`; they contain no production student records.

## O. Remaining known limitations

- Live schedule-provider quota/availability remains unhealthy; PDF OCR recovered a reviewable partial result. Restore/test the configured provider before declaring primary vision healthy.
- Eight high **development-tool** transitive audit findings remain. Automated suggestions downgrade Next tooling to 14/shadcn to 1, so no forced incompatible change was applied. See the [micromatch advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Lint advisory warnings remain visible.
- Per-runtime limits do not provide a distributed quota guarantee across instances/cold starts.
- Collection reconciliation is not a cross-device transaction; simultaneous edits to the same collection can still conflict.
- Notification delivery deliberately favors at-most-once sending: a crash after claiming an event can miss that reminder. Failed/claimed events require deliberate operator review before retry.
- Real SMTP/OAuth, authenticated live RLS, storage-bucket ownership and physical-device PWA/keyboard behavior remain QA/configuration checks.

## P. Manual Supabase/Vercel configuration

1. Review/approve and apply [manual-notification-deliveries.sql](./manual-notification-deliveries.sql). This additive ledger was prepared **but not executed**; it does not modify existing student rows. Recheck schema/RLS/permissions before application.
2. Set a strong server-only `CRON_SECRET` and verify service-role/VAPID configuration in the intended Vercel environment. Local configuration lacks `CRON_SECRET`; hosted environment values were not inspected. Keep the unique ledger before enabling sends.
3. Confirm a scheduler that supports the committed **once-per-minute** cron. Vercel Hobby allows once daily with hourly precision; minute schedules require Pro/Enterprise or an approved external scheduler. [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [cron authorization](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
4. Set the canonical `NEXT_PUBLIC_APP_URL` (missing locally), Supabase Site URL/redirect allowlist, real SMTP sender/provider and tokenized confirmation templates. Verify signup, resend and Google with a dedicated QA account.
5. Restore the existing Gemini 3.8 schedule provider quota/availability and rerun live scanner tests. Gemini 2.5 chat is healthy, but its failed scanner experiment does not justify switching vision models.
6. Review existing avatar-storage owner policies and production WAF/provider budgets. No policy, SMTP, scheduler, quota or environment configuration was changed remotely.

Cooking safety references: [USDA safe temperatures](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart), [USDA microwave guidance](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/cooking-microwave-ovens).

## Q. Exact files changed

93 files: M = modified, A = added. Paths are relative to `C:/Users/LEGION/Documents/DORMLY`. Ignored QA outputs and temporary routes are excluded.

```text
M app/(auth)/sign-in/page.tsx
M app/(auth)/sign-up/page.tsx
M app/(main)/alarms/page.tsx
M app/(main)/dashboard/page.tsx
M app/(main)/deadlines/import/page.tsx
M app/(main)/deadlines/page.tsx
M app/(main)/deadlines/review/page.tsx
M app/(main)/kitchen/page.tsx
M app/(main)/layout.tsx
M app/(main)/profile/page.tsx
M app/(main)/schedule/import/page.tsx
M app/(main)/schedule/page.tsx
M app/(main)/schedule/review/page.tsx
M app/api/admin/settings/route.ts
M app/api/alarms/smart-nudge/route.ts
M app/api/auth/callback/route.ts
M app/api/auth/resend-confirmation/route.ts
M app/api/chat/route.ts
M app/api/deadlines/parse/route.ts
M app/api/digest/weekly/route.ts
M app/api/notifications/cron/route.ts
M app/api/notifications/subscribe/route.ts
M app/api/notifications/test-deadline/route.ts
M app/api/notifications/test-push/route.ts
M app/api/push/devices/[id]/route.ts
M app/api/push/devices/route.ts
M app/api/push/subscribe/route.ts
M app/api/recipes/generate/route.ts
M app/api/recipes/schedule-aware/route.ts
M app/api/schedule/edit/route.ts
M app/api/schedule/parse/route.ts
M app/globals.css
M app/onboarding/layout.tsx
M app/onboarding/page.tsx
M app/styles/mobile-reference.css
M components/admin/recipe-form-dialog.tsx
M components/ai/chat-widget.tsx
M components/app-nav.tsx
M components/dashboard/schedule-meal-banner.tsx
M components/dashboard/weekly-digest-card.tsx
M components/kitchen/ai-recipe-generator.tsx
M components/kitchen/ai-recipe-modal.tsx
M components/kitchen/meal-planner.tsx
M components/schedule-provider.tsx
M components/schedule/add-deadline-modal.tsx
M components/schedule/ai-edit-bar.tsx
M components/schedule/ai-edit-confirm-modal.tsx
M components/schedule/class-detail-modal.tsx
M components/schedule/class-edit-modal.tsx
M components/schedule/day-view.tsx
M components/schedule/deadline-card.tsx
M components/schedule/export-modal.tsx
M components/schedule/scan-progress.tsx
A components/sync-status.tsx
M components/theme-provider.tsx
A docs/manual-notification-deliveries.sql
A docs/release-hardening-report.md
M hooks/use-auth.ts
A hooks/use-browser-state.ts
A hooks/use-camera.ts
M lib/activity-logger.ts
M lib/admin-auth.ts
M lib/admin-db.ts
A lib/api-security.ts
A lib/auth-errors.ts
M lib/copilot/input.ts
M lib/data.ts
A lib/date-time.ts
M lib/db.ts
A lib/deadline-parser.ts
M lib/email-utils.ts
M lib/gemini.ts
M lib/ical.ts
M lib/notification-service.ts
M lib/parser.ts
M lib/push-notifications.ts
A lib/push-validation.ts
A lib/recipe-safety.ts
A lib/reminder-events.ts
M lib/resend.ts
M lib/schedule-gap-analyzer.ts
M lib/template-layout-utils.ts
M next.config.ts
M package-lock.json
M package.json
M proxy.ts
M public/sw.js
M scripts/test-lead-picker.mjs
A scripts/test-release-smoke.mjs
M scripts/test-schedule-scanner.mjs
M scripts/test-template-system.py
A tests/hardening.test.mjs
M vercel.json
```

## R. Safe to deploy?

**Safe to push for review; no unconditional deployment approval.** Automated local checks pass and the hardening commit is reviewable on `codex/release-hardening`. The production `main` baseline `f8dc9ba` does not contain these fixes. Approve/configure delivery tracking and cron, resolve provider availability, then perform live SMTP/OAuth and owned-data QA before merging a release/deploying.

The user subsequently authorized committing and pushing the verified work. Only the review branch is pushed; `main` is not updated, and automatic Vercel deployment is disabled for this branch. The database migration remains unapplied. No deployment is authorized by this report.
