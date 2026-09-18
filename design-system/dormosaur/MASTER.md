# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules override this Master file.

---

**Project:** Dormosaur  
**Updated:** 2026-09-18  
**Category:** Student productivity and campus planning  
**Design Dials:** Variance 6/10 (balanced) | Motion 6/10 (purposeful) | Density 5/10 (standard)

## Visual world

**Campus Departures** — an interface-led campus wayfinding system with departure boards, timetable rails, location codes, warm daylight surfaces, deep green night planning, and restrained highlighter accents.

The product keeps Dormosaur’s green and mascot identity while replacing generic iOS-style glass, oversized pills, and floating-card repetition.

## Global tokens

| Role | Value | CSS variable |
|---|---|---|
| Primary green | `#2F7356` | `--color-primary` |
| Daylight paper | `#F4F4E9` | `--color-background` |
| Ink | `#26362C` | `--color-foreground` |
| Field | `#F7F7EF` | `--color-field` |
| Line | `#CDD7C9` | `--color-line` |
| Highlighter | `#E5C75D` | `--color-highlight` |
| Night green | `#173A2C` | `--color-night` |

The implementation uses semantic OKLCH tokens in `app/globals.css` for contrast-safe daylight and night themes. Do not introduce raw component hex colors.

## Typography

- Heading and body: bundled Geist Sans.
- Times, counts, room codes: bundled Geist Mono with tabular numerals.
- Mood: youthful, capable, readable at a glance.
- Avoid decorative display fonts and remote font dependencies in the app shell.

## Layout and surfaces

- Mobile is the daily-use product. Desktop is the planning workspace.
- Use 12–20px radii for primary surfaces; pills are reserved for compact metadata.
- Use borders and route lines for structure. Use shadows for the departure panel and truly floating controls only.
- Use timetable/grid texture only where it communicates schedule, mapping, or wayfinding.
- Mascot moments belong in onboarding, empty states, AI/kitchen feedback, and meaningful completion states.

## Motion

- Use one authored entrance for the primary departure surface and light continuity for supporting sections.
- Use transform/opacity for interaction feedback; avoid layout animation that shifts surrounding content.
- Target 150–300ms for UI feedback and use spring motion only when it explains continuity.
- Respect `prefers-reduced-motion` by rendering the final state without stagger or overshoot.

## Accessibility and performance

- Maintain 4.5:1 body-text contrast and visible keyboard focus.
- Keep mobile actions at least 44px tall with an 8px gap between adjacent targets.
- Preserve safe areas and avoid content behind fixed mobile navigation.
- Keep responsive images dimensioned, lazy-load noncritical photography, and keep client components at the interactive leaves.
- Preserve routes, data contracts, Supabase behavior, form fields, and existing feature capabilities.
