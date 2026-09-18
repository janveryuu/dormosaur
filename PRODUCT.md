# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dormosaur primarily serves college students living in dorms or small off-campus spaces. They use it mainly on mobile for quick daily decisions and reminders, with desktop acting as a stronger planning and schedule-management companion.

## Product Purpose

Dormosaur reduces the everyday friction of student life by turning messy class information into a useful schedule, coordinating deadlines and alarms, suggesting realistic small-space meals, and providing contextual AI assistance. Success means students can organize their week quickly, understand what needs attention, and return to student life without maintaining several disconnected tools.

## Positioning

Dormosaur combines schedule ingestion, class-aware alarms, deadline planning, dorm-friendly cooking, and an AI campus companion in one student-focused workflow. Its advantage is the coordination between these capabilities rather than any single isolated feature.

## Operating Context

Students commonly use Dormosaur between classes, while commuting or walking on campus, in a dorm room, and during short planning sessions. Mobile interactions must support fast one-handed use and interruptions. Desktop should support denser weekly planning, review, editing, and schedule export.

## Capabilities and Constraints

- Preserve existing functionality, URLs, data contracts, Supabase integration, backend behavior, form fields, and feature capabilities.
- Frontend information hierarchy, navigation grouping, component structure, and interaction patterns may be redesigned when this improves usability.
- The student-facing experience is the first redesign phase. The admin interface follows in a separate phase using the resulting tokens and primitives.
- Current student capabilities include authentication, onboarding, dashboard, schedule parsing and review, deadlines, alarms, dorm recipes, profile/settings, AI chat, notifications, and schedule exports.
- The implementation is a Next.js 16, React 19, Tailwind CSS 4 web application with PWA and Capacitor support.

## Brand Commitments

- Preserve the Dormosaur name, mascot family, green brand association, and friendly personality.
- Replace the current generic iOS-inspired styling with a distinctive Dormosaur visual system.
- Keep the tone youthful but mature. The product should feel supportive and capable, not childish or corporate.
- Use expressive mascot moments selectively in onboarding, empty states, feedback, and celebrations. Everyday planning surfaces should remain disciplined and task-focused.

## Evidence on Hand

- Existing mascot, logo, recipe, app-icon, and schedule-template assets under `public/`.
- Existing working student flows and UI components under `app/` and `components/`.
- Existing product description and feature documentation in `README.md`.
- No confirmed testimonials, customer logos, performance claims, or commercial metrics may be invented for the redesign.

## Product Principles

1. Make the next useful action obvious in a few seconds.
2. Treat mobile as the daily-use product and desktop as the planning workspace.
3. Express personality at meaningful moments without obstructing routine tasks.
4. Use motion to communicate navigation, feedback, hierarchy, and state changes.
5. Preserve trusted functionality while replacing fragmented visual conventions with one coherent system.

## Accessibility & Inclusion

The redesign must support keyboard navigation, visible focus, readable contrast, touch-friendly targets, reduced motion, responsive layouts, and clear loading, empty, error, success, and permission states.
