# Dashboard — Campus Departures

The dashboard is an Operate surface for students checking what matters before class. It should feel like a calm campus departure board, not a collection of floating iOS cards.

## Required hierarchy

1. Date context and a plain-language greeting.
2. Next departure panel with class, room, time, countdown, and a direct schedule action.
3. Unboxed glance strip for classes, alarms, and deadlines.
4. Timetable route rail with meaningful spacing for breaks.
5. Supporting AI, kitchen, deadline, and recipe sections.

## Visual rules

- Use daylight paper for the app surface and deep green for the next-departure panel.
- Use borders and line work for structure; use shadows only for the departure panel and floating controls.
- Keep primary surfaces between 12px and 20px radius. Pills are reserved for compact metadata.
- Use the mascot only in the next-departure state, empty state, and meaningful AI/kitchen moments.
- Use Lucide SVG icons only; no emoji icons.

## Motion rules

- One authored entrance for the departure panel and supporting sections.
- Tactile press feedback may scale interactive surfaces by roughly 1–2%.
- Respect reduced motion by rendering the final state without stagger or spring overshoot.
