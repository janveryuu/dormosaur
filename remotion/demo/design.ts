import { interpolate, spring } from 'remotion';

// Values follow the light theme in app/globals.css. Chromium renders oklch directly.
export const color = {
  paper: 'oklch(0.965 0.012 105)',
  white: 'oklch(0.995 0.004 105)',
  ink: 'oklch(0.19 0.028 155)',
  muted: 'oklch(0.49 0.025 155)',
  green: 'oklch(0.42 0.105 158)',
  night: 'oklch(0.27 0.055 158)',
  line: 'oklch(0.82 0.027 145)',
  fill: 'oklch(0.91 0.018 105)',
  yellow: 'oklch(0.88 0.14 93)',
  lavender: 'oklch(0.58 0.2 268)',
  teal: 'oklch(0.62 0.16 190)',
  coral: 'oklch(0.65 0.17 40)',
};

export const font = {
  sans: 'Arial, Helvetica, sans-serif',
  display: 'Georgia, Times New Roman, serif',
};

export const fps = 60;
export const duration = 2100;

export const chapters = [
  { id: 'schedule', start: 180, end: 480, label: 'Schedule intelligence', title: 'From scattered to scheduled.', body: 'Bring in the timetable. See the whole week clearly.' },
  { id: 'today', start: 480, end: 780, label: 'Your day, decoded', title: 'Know what matters now.', body: 'Your next class, the space between, and the way forward.' },
  { id: 'alarms', start: 780, end: 1080, label: 'Smart alarms', title: 'Leave at the right time.', body: 'Reminders follow your classes and your walk to campus.' },
  { id: 'deadlines', start: 1080, end: 1320, label: 'Deadlines', title: 'Keep the important things close.', body: 'A clear view of what is due, without the noise.' },
  { id: 'kitchen', start: 1320, end: 1560, label: 'Dorm kitchen', title: 'Make room for a good meal.', body: 'Quick ideas for the appliances you actually have.' },
  { id: 'copilot', start: 1560, end: 1860, label: 'Dormosaur copilot', title: 'Help that knows your day.', body: 'Useful answers grounded in your schedule and student life.' },
] as const;

export type ChapterId = (typeof chapters)[number]['id'];

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function ease(frame: number, from: number, to: number) {
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
}

export function enter(frame: number, start: number, fpsValue = fps) {
  return spring({ frame: Math.max(0, frame - start), fps: fpsValue, config: { damping: 24, stiffness: 120, mass: 0.85 } });
}

export function chapterOpacity(frame: number, start: number, end: number) {
  return clamp((frame - start) / 22) * clamp((end - frame) / 22);
}
