# Dormosaur Copilot

Copilot uses AI for conversation, tutoring, meals and planning. Narrow schedule,
room, deadline, alarm and profile questions use the current user's server data.
Outages produce explicit limited-mode responses instead of a generic greeting.
The chat header says Dormosaur AI; bubbles never render raw routing identifiers.

## Verified failure on October 1, 2026

Before repair, the public production API at `https://dormosaur.vercel.app/api/chat`
returned the same `direct-answer` introduction for identity and model questions,
including an invented university for an anonymous request. Local reproduction
also returned an identical introduction for affection, identity and model queries.

The local Groq key was present and valid (models endpoint HTTP 200). Requests using
the repository's former model list failed:

| Model | Observed HTTP / code |
| --- | --- |
| llama-3.3-70b-versatile | 404 / model_not_found |
| llama-3.1-8b-instant | 404 / model_not_found |
| mixtral-8x7b-32768 | 400 / model_decommissioned |
| openai/gpt-oss-120b | 200 / successful generation |
| openai/gpt-oss-20b | 200 / successful generation |

These observations are account-specific. The current [Groq model catalog](https://console.groq.com/docs/models)
lists the Llama models as Enterprise and GPT OSS models as production models.
Do not assume that a globally listed model is accessible to this project's key.
Production's private environment variables and runtime logs were not available
to this local worker; public responses prove the fallback symptom, not the exact
production provider failure reason. The new logs make that distinction observable.

## Configuration and diagnostics

Set server-only keys in `.env.local` and Vercel's Production environment. Redeploy
after environment changes. `.env.example` documents all options:

- `DORMOSAUR_COPILOT_PROVIDER`: groq or gemini. Defaults to Groq when its key exists,
  otherwise Gemini.
- `DORMOSAUR_COPILOT_MODEL`: the primary model override.
- `DORMOSAUR_COPILOT_GROQ_MODEL`: Groq model when Groq is secondary; default
  `openai/gpt-oss-120b`.
- `DORMOSAUR_COPILOT_GROQ_FALLBACK_MODEL`: secondary Groq model; default
  `openai/gpt-oss-20b`.
- `DORMOSAUR_COPILOT_GEMINI_MODEL`: independent Gemini chat model; default
  `gemini-2.5-flash`. The schedule parser in `lib/gemini.ts` is unchanged.

Each provider must have its own usable key. Routing never sends a Groq key to
Google or a Gemini key to Groq. Provider requests have bounded timeouts, a total
22-second generation budget, and no implicit SDK retries. A duplicate response
can be regenerated once; persistent repetition tries remaining providers, then
enters limited mode. The successful response's returned model identity wins over
configured aliases. Model questions are answered by the server from that identity.

Search runtime logs for `[Dormosaur Copilot]`. Request IDs correlate events:
`provider_success`, `provider_failure`, `provider_unavailable`, `configuration_error`,
`context_unavailable`, `response_repeated`, `response_rejected`, `limited_mode`.
Failure reasons distinguish missing keys, authentication, unavailable models,
rate limits, invalid requests/responses, provider errors, network errors and
timeouts. Logs contain no raw error bodies, messages, profile records, user IDs,
context snapshots or credentials.

## Trust and grounding

Authentication uses Supabase `getUser`. All four collections are fetched with
the authenticated user's ownership filter and session-bound client, never a
service-role client or browser-provided user ID. Server data always wins,
including empty arrays or a missing profile. Failed reads remain unavailable,
not falsely empty. No missing school, program, appliance, lead time or class time
is replaced with a fabricated fact. The current schema has no program field.

Guests can explicitly submit `context.dataSource = local` for local/demo workflows.
Those records are labelled local. For authenticated users, pending browser edits
must sync before Copilot treats them as persisted facts; changes mentioned in the
conversation remain unverified plans. Timezone is safe device context: a validated
IANA zone, then the profile zone, then UTC. Day/date/hour all come from one server
timestamp interpreted in that zone. Browser clock strings are ignored.

The database's alarm time is a class anchor; wake time subtracts the matching
alarm lead. Missing preparation/travel settings are acknowledged. Tomorrow means
tomorrow, not the next later school day. This week means today through Sunday;
completed deadlines are excluded. Past pending records remain visible in an
unfiltered deadline query. No alarm or other record is mutated by chat.

Browser history accepts only user/assistant roles, up to 24 recent messages and
16,000 characters. User messages are limited to 3,000 characters; older assistant
answers are clipped for history without truncating their displayed response.
Bodies are bounded at 64 KiB even without Content-Length. Account changes clear
the widget's history and abort pending replies.

High-confidence abuse/private-information requests are blocked before generation.
The provider also decides nuanced scope semantically, returning validated JSON
with a scope verdict. The server discards unrelated/unsafe generated content and
checks for false action claims and instruction disclosure. This is defense in
depth; prompt-based generation is not a formal guarantee of factual accuracy.

## Verification

`npm test` runs 39 offline tests for all acceptance categories, including role
sanitization, trust boundaries, missing profiles, explicit Asia/Manila timestamps,
room follow-ups, duplicate retry limits and sanitized failure diagnostics.
`npm run test:copilot:live` explicitly uses configured providers with synthetic
data, checking both Groq models, independent Gemini chat and planning grounding.
`npm run typecheck` runs TypeScript separately because the existing build config
allows build-time type errors.

The real drawer and API were manually exercised using a temporary guest-only
fixture page: social/meta prompts, next class and room continuity, this week's
deadlines, planning, binary trees, sports redirect, secret/prompt refusals,
microwave meals, missing school/program and calculated wake-up advice. With keys
disabled only in the test server process, identity/model status remained useful
and two unknown messages received different transparent limited-mode replies.
The temporary page was removed before the production build. No live account data
was changed; authenticated user scoping is covered by database-boundary tests.
