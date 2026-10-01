import React from 'react';
import { AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { ArrowRight, CalendarDays, AlarmClock, Bell, ChefHat, CheckCircle2, Sparkles } from 'lucide-react';
import { chapters, chapterOpacity, clamp, color, duration, ease, enter, font } from './design';
import { ProductPhone } from './ProductPhone';

const fullscreen: React.CSSProperties = { width: 1920, height: 1080, overflow: 'hidden', position: 'absolute', inset: 0 };

function Wordmark({ light = false }: { light?: boolean }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 13, color: light ? '#fff' : color.night, fontFamily: font.sans, fontWeight: 850, fontSize: 25, letterSpacing: -1.2 }}>
    <Img src={staticFile('dormosaur-logo.png')} style={{ width: 40, height: 40, borderRadius: 11 }} /> Dormosaur
  </div>;
}

function Intro({ frame }: { frame: number }) {
  const opacity = clamp(frame / 26) * clamp((190 - frame) / 22);
  const s = enter(frame, 10);
  return <div style={{ ...fullscreen, opacity, background: color.night, color: '#fff' }}>
    <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: '#517a58', opacity: .19, filter: 'blur(115px)', left: 845, top: 115 }} />
    <div style={{ position: 'absolute', top: 88, left: 132 }}><Wordmark light /></div>
    <div style={{ position: 'absolute', left: 132, top: 355, transform: `translateY(${(1 - s) * 45}px)`, opacity: s }}>
      <div style={{ color: color.yellow, fontSize: 16, fontWeight: 800, letterSpacing: 3.8, textTransform: 'uppercase', fontFamily: font.sans }}>For the whole student day</div>
      <div style={{ fontFamily: font.display, fontSize: 119, lineHeight: .94, letterSpacing: -5, marginTop: 27 }}>Dorm life,<br /><em style={{ color: '#d6edc7' }}>decoded.</em></div>
      <div style={{ color: '#cedfd1', fontFamily: font.sans, fontSize: 24, marginTop: 33 }}>One place for the pieces that usually scatter.</div>
    </div>
    <Img src={staticFile('mascots/dormosaur-welcome.png')} style={{ position: 'absolute', width: 560, height: 560, objectFit: 'contain', right: 130, top: 245, transform: `translateY(${(1 - s) * 70 + Math.sin(frame / 25) * 7}px) scale(${.88 + s * .12})`, filter: 'drop-shadow(0 40px 35px rgba(0,0,0,.24))' }} />
    <div style={{ position: 'absolute', left: 132, bottom: 79, color: '#bbd2bf', fontFamily: font.sans, fontSize: 14, letterSpacing: 2 }}>01 / 07</div>
  </div>;
}

const chapterIcons = { schedule: CalendarDays, today: Sparkles, alarms: AlarmClock, deadlines: CheckCircle2, kitchen: ChefHat, copilot: Sparkles };

function ScheduleImport({ frame }: { frame: number }) {
  const fade = clamp((frame - 220) / 20) * clamp((330 - frame) / 25);
  const rows = [
    'M/W 8:30-9:45  MATH 101  SCI 204',
    'Tu/Th 9:10  LIT 110  HUM 310',
    'Th 1:00  CS 101  TECH 118',
  ];
  return <div style={{ position: 'absolute', left: 0, top: 405, width: 610, opacity: fade }}>
    <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: color.muted, marginBottom: 14 }}>FROM THE REGISTRAR</div>
    {rows.map((row, i) => <div key={row} style={{ fontFamily: 'Consolas, monospace', fontSize: 15, color: color.muted, padding: '10px 0', borderBottom: `1px solid ${color.line}`, opacity: enter(frame, 232 + i * 8), transform: `translateX(${(1 - enter(frame, 232 + i * 8)) * -25}px)` }}>{row}</div>)}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 800, color: color.green, marginTop: 17 }}>Imported into your week <ArrowRight size={16} /></div>
  </div>;
}

function Feature({ frame, chapter, index }: { frame: number; chapter: typeof chapters[number]; index: number }) {
  if (frame < chapter.start - 12 || frame > chapter.end + 12) return null;
  const local = frame - chapter.start;
  const opacity = chapterOpacity(frame, chapter.start - 10, chapter.end + 10);
  const rise = enter(local, 3);
  const Icon = chapterIcons[chapter.id];
  const phoneX = interpolate(rise, [0, 1], [72, 0]);
  return <div style={{ ...fullscreen, opacity, pointerEvents: 'none' }}>
    <div style={{ position: 'absolute', left: 134, top: 83 }}><Wordmark /></div>
    <div style={{ position: 'absolute', right: 135, top: 94, color: color.muted, fontSize: 14, fontFamily: font.sans, fontWeight: 750, letterSpacing: 1.4 }}>{String(index + 1).padStart(2, '0')} / 06</div>
    <div style={{ position: 'absolute', left: 133, top: 285, width: 720, fontFamily: font.sans, transform: `translateY(${(1 - rise) * 30}px)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: color.green, fontWeight: 830, letterSpacing: 2.5, fontSize: 14, textTransform: 'uppercase' }}><Icon size={20} strokeWidth={2.2} /> {chapter.label}</div>
      <div style={{ fontFamily: font.display, color: color.ink, fontSize: 77, lineHeight: 1.02, letterSpacing: -3.1, marginTop: 31, maxWidth: 720 }}>{chapter.title}</div>
      <div style={{ color: color.muted, fontSize: 23, lineHeight: 1.42, maxWidth: 570, marginTop: 25 }}>{chapter.body}</div>
      {chapter.id === 'schedule' && <ScheduleImport frame={frame} />}
      {chapter.id === 'alarms' && <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: color.night, color: '#fff', borderRadius: 17, padding: '16px 21px', width: 395, marginTop: 48, opacity: ease(local, 70, 95), transform: `translateY(${(1 - ease(local, 70, 95)) * 20}px)` }}><Bell size={21} color={color.yellow} /><div><div style={{ fontSize: 15, fontWeight: 800 }}>Leave for Calculus I</div><div style={{ color: '#c7dbcc', fontSize: 12, marginTop: 3 }}>Sci Hall · 12-minute walk</div></div></div>}
      {chapter.id === 'copilot' && <div style={{ marginTop: 46, fontSize: 15, color: color.green, fontWeight: 800, letterSpacing: 1.5 }}>STUDENT CONTEXT → USEFUL ACTION</div>}
    </div>
    <div style={{ position: 'absolute', right: 220, top: 118, width: 560, height: 790, background: chapter.id === 'kitchen' ? '#e7e9cd' : '#dfe9dc', borderRadius: 300, opacity: .62, filter: 'blur(2px)', transform: `scale(${.9 + rise * .1})` }} />
    <ProductPhone chapter={chapter.id} frame={local} style={{ position: 'absolute', right: 282, top: 117, transform: `translateX(${phoneX}px) rotate(${(1 - rise) * 3}deg)` }} />
    <div style={{ position: 'absolute', bottom: 76, left: 134, display: 'flex', alignItems: 'center', gap: 10, color: color.green, fontFamily: font.sans, fontSize: 13, fontWeight: 800, letterSpacing: 1.4 }}><div style={{ width: 38, height: 2, background: color.green }} /> STUDENT LIFE, IN ONE PLACE</div>
  </div>;
}

function Outro({ frame }: { frame: number }) {
  const local = frame - 1840;
  const opacity = clamp(local / 35);
  const rise = enter(local, 18);
  const small = enter(local, 76);
  const chips = [
    { name: 'Schedule', Icon: CalendarDays }, { name: 'Alarms', Icon: AlarmClock }, { name: 'Deadlines', Icon: CheckCircle2 }, { name: 'Kitchen', Icon: ChefHat }, { name: 'Copilot', Icon: Sparkles },
  ];
  return <div style={{ ...fullscreen, background: color.night, opacity, color: '#fff' }}>
    <div style={{ position: 'absolute', width: 680, height: 680, background: '#679b64', borderRadius: '50%', filter: 'blur(135px)', opacity: .24, left: 620, top: 150 }} />
    <div style={{ position: 'absolute', left: 131, top: 82 }}><Wordmark light /></div>
    <div style={{ position: 'absolute', top: 303, left: 132, width: 960, transform: `translateY(${(1 - rise) * 35}px)`, opacity: rise }}>
      <div style={{ color: color.yellow, fontFamily: font.sans, fontSize: 16, fontWeight: 850, letterSpacing: 3.5 }}>ONE PLACE FOR YOUR WHOLE DAY</div>
      <div style={{ fontFamily: font.display, fontSize: 104, lineHeight: .99, letterSpacing: -4.2, marginTop: 30 }}>Dorm life,<br /><em style={{ color: '#d7eeca' }}>decoded.</em></div>
      <div style={{ fontFamily: font.sans, color: '#c9dcce', fontSize: 22, marginTop: 31 }}>Your schedule, your next step, your student life.</div>
    </div>
    <Img src={staticFile('mascots/dormosaur-you-got-this.png')} style={{ position: 'absolute', width: 520, height: 520, objectFit: 'contain', right: 120, top: 235, transform: `translateY(${(1 - rise) * 65 + Math.sin(local / 26) * 5}px)`, filter: 'drop-shadow(0 35px 35px rgba(0,0,0,.18))' }} />
    <div style={{ position: 'absolute', left: 132, bottom: 105, display: 'flex', gap: 9, opacity: small, transform: `translateY(${(1 - small) * 20}px)` }}>{chips.map(({ name, Icon }) => <div key={name} style={{ border: '1px solid #92b09a88', color: '#d4e6d8', borderRadius: 100, padding: '12px 16px', fontFamily: font.sans, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}><Icon size={15} />{name}</div>)}</div>
  </div>;
}

export const DormosaurDemo: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: color.paper, fontFamily: font.sans }}>
    <div style={{ ...fullscreen, background: `radial-gradient(circle at 71% 47%, #e3ebd9 0, ${color.paper} 48%)` }} />
    {chapters.map((chapter, index) => <Feature key={chapter.id} frame={frame} chapter={chapter} index={index} />)}
    <Intro frame={frame} />
    {frame >= 1840 && <Outro frame={frame} />}
    <Audio src={staticFile('audio/dormosaur-demo.wav')} volume={0.72} />
    <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, width: `${frame / duration * 100}%`, background: frame < 175 || frame > 1840 ? color.yellow : color.green, opacity: .55 }} />
  </AbsoluteFill>;
};
