import React, { type CSSProperties } from 'react';
import { Img, staticFile } from 'remotion';
import { AlarmClock, ArrowRight, Bell, CalendarDays, ChefHat, ChevronRight, Clock3, Home, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import { color, enter, font, type ChapterId } from './design';

const card: CSSProperties = { background: color.white, border: `1px solid ${color.line}`, borderRadius: 20, boxShadow: '0 7px 20px rgba(18,54,39,.065)' };
const smallLabel: CSSProperties = { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: color.green };

function Rise({ frame, delay = 0, children, style }: { frame: number; delay?: number; children: React.ReactNode; style?: CSSProperties }) {
  const progress = enter(frame, delay);
  return <div style={{ opacity: progress, transform: `translateY(${(1 - progress) * 22}px)`, ...style }}>{children}</div>;
}

function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div style={{ padding: '4px 0 19px' }}>
    <div style={smallLabel}>{eyebrow}</div>
    <div style={{ fontSize: 36, fontWeight: 830, letterSpacing: -1.9, lineHeight: 1.03, marginTop: 8 }}>{title}</div>
    <div style={{ fontSize: 12.5, lineHeight: 1.4, color: color.muted, marginTop: 7 }}>{subtitle}</div>
  </div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ ...smallLabel, margin: '0 0 10px', color: color.muted }}>{children}</div>;
}

function BottomNav({ active }: { active: ChapterId }) {
  const items = [
    { id: 'today', Icon: Home, label: 'Today' },
    { id: 'schedule', Icon: CalendarDays, label: 'Schedule' },
    { id: 'alarms', Icon: AlarmClock, label: 'Alarms' },
    { id: 'kitchen', Icon: ChefHat, label: 'Kitchen' },
  ] as const;
  const selected = active === 'deadlines' || active === 'copilot' ? 'today' : active;
  return <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, background: color.white, borderTop: `1px solid ${color.line}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 4 }}>
    {items.map(({ id, Icon, label }) => <div key={id} style={{ width: 65, textAlign: 'center', color: selected === id ? color.green : color.muted }}>
      <Icon size={19} strokeWidth={selected === id ? 2.6 : 2} style={{ margin: '0 auto 3px' }} />
      <div style={{ fontSize: 9.5, fontWeight: selected === id ? 800 : 600 }}>{label}</div>
    </div>)}
  </div>;
}

function Schedule({ frame }: { frame: number }) {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const blocks = [
    { day: 0, top: 26, h: 99, title: 'Calculus I', meta: '8:30 · SCI 204', tint: '#eeeaff', ink: '#5945a9' },
    { day: 1, top: 105, h: 104, title: 'Literature', meta: '9:10 · HUM 310', tint: '#e7f6f3', ink: '#28716e' },
    { day: 2, top: 26, h: 99, title: 'Calculus I', meta: '8:30 · SCI 204', tint: '#eeeaff', ink: '#5945a9' },
    { day: 3, top: 155, h: 116, title: 'Programming', meta: '1:00 · TECH 118', tint: '#fff0e6', ink: '#a65830' },
    { day: 4, top: 252, h: 100, title: 'Psychology', meta: '3:00 · W22', tint: '#e5f2e8', ink: '#2c6643' },
  ];
  return <>
    <PageHeader eyebrow="Your planning board" title="Schedule" subtitle="A clearer way to see the week ahead." />
    <Rise frame={frame} delay={2}><div style={{ ...card, background: color.night, color: '#fff', padding: 17, marginBottom: 18, border: 'none' }}>
      <div style={{ ...smallLabel, color: color.yellow }}>Your timetable, decoded</div>
      <div style={{ fontFamily: font.display, fontSize: 22, lineHeight: 1.05, marginTop: 10 }}>Five classes. One clear week.</div>
      <div style={{ color: '#c4d8cb', fontSize: 11, marginTop: 8 }}>Imported and ready to plan around.</div>
    </div></Rise>
    <SectionLabel>Weekly timetable</SectionLabel>
    <Rise frame={frame} delay={12}><div style={{ ...card, padding: '15px 9px 11px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '29px repeat(5, 1fr)', gap: 3, color: color.muted, fontSize: 8, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}><span />{days.map(d => <span key={d}>{d}</span>)}</div>
      <div style={{ display: 'flex', height: 365 }}>
        <div style={{ width: 29, position: 'relative', color: color.muted, fontSize: 8 }}>{['8 AM', '10', '12', '2', '4'].map((t, i) => <span key={t} style={{ position: 'absolute', top: i * 85 }}>{t}</span>)}</div>
        <div style={{ flex: 1, position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 83px, #e1e5dc 84px, transparent 85px)' }}>
          {days.map(d => <div key={d} style={{ borderLeft: `1px solid ${color.line}` }} />)}
          {blocks.map((b, i) => <div key={i} style={{ position: 'absolute', left: `calc(${b.day * 20}% + 2px)`, width: 'calc(20% - 4px)', top: b.top, height: b.h, borderRadius: 10, padding: '9px 5px', boxSizing: 'border-box', background: b.tint, color: b.ink, transform: `scale(${Math.max(.6, enter(frame, 20 + i * 5))})`, transformOrigin: 'top center', overflow: 'hidden' }}>
            <div style={{ fontSize: 8.7, fontWeight: 800, lineHeight: 1.12 }}>{b.title}</div><div style={{ fontSize: 7, marginTop: 6, lineHeight: 1.2 }}>{b.meta}</div>
          </div>)}
        </div>
      </div>
    </div></Rise>
  </>;
}

function Today({ frame }: { frame: number }) {
  return <>
    <PageHeader eyebrow="Monday, September 28" title="Today" subtitle="Good morning, Alex. 2 classes and 1 active alarm." />
    <Rise frame={frame} delay={2}><div style={{ ...card, background: color.night, border: 'none', color: '#fff', padding: 20, minHeight: 238, position: 'relative', overflow: 'hidden' }}>
      <Img src={staticFile('student-dormosaur.png')} style={{ position: 'absolute', width: 155, right: -18, bottom: -27, opacity: .95 }} />
      <div style={{ ...smallLabel, color: color.yellow }}>Next departure</div>
      <div style={{ fontSize: 10, color: '#c5d9cb', marginTop: 6 }}>Same direction, one less thing to remember</div>
      <div style={{ fontSize: 9, letterSpacing: 1.4, color: '#bdd4c6', marginTop: 31 }}>CLASS</div>
      <div style={{ fontSize: 29, fontWeight: 850, letterSpacing: -1.4, marginTop: 5, maxWidth: 245 }}>Calculus I</div>
      <div style={{ color: '#d3e3d7', fontSize: 11, marginTop: 6 }}>8:30–9:45 AM · Sci Hall 204</div>
      <div style={{ color: color.yellow, fontSize: 15, fontWeight: 800, marginTop: 22 }}>Leave in 12 min <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
    </div></Rise>
    <Rise frame={frame} delay={11}><div style={{ display: 'flex', gap: 9, marginTop: 15 }}>
      {[['02', 'classes today'], ['01', 'active alarm'], ['01', 'due soon']].map(([number, label]) => <div key={label} style={{ ...card, flex: 1, padding: '14px 9px' }}><div style={{ fontSize: 22, fontWeight: 850, color: color.green }}>{number}</div><div style={{ fontSize: 9, color: color.muted, marginTop: 5 }}>{label}</div></div>)}
    </div></Rise>
    <Rise frame={frame} delay={20} style={{ marginTop: 20 }}><SectionLabel>On your board</SectionLabel><div style={{ ...card, padding: '14px 15px', display: 'flex', alignItems: 'center', gap: 11 }}><Clock3 size={18} color={color.green} /><div><div style={{ fontSize: 12, fontWeight: 800 }}>A little room to breathe</div><div style={{ fontSize: 10, color: color.muted, marginTop: 3 }}>90 minute gap after Calculus I</div></div><ChevronRight size={14} color={color.muted} style={{ marginLeft: 'auto' }} /></div></Rise>
  </>;
}

function Alarms({ frame }: { frame: number }) {
  return <>
    <PageHeader eyebrow="Departure reminders" title="Alarms" subtitle="Class-aware timing, built around your walk." />
    <Rise frame={frame} delay={2}><div style={{ ...card, background: color.night, border: 'none', padding: 21, color: '#fff', minHeight: 228 }}>
      <div style={{ ...smallLabel, color: color.yellow }}>Tomorrow morning</div>
      <div style={{ fontFamily: font.display, fontSize: 26, marginTop: 14 }}>You’re right on time.</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26, borderTop: '1px solid #ffffff33', paddingTop: 14 }}><div><div style={{ fontSize: 10, color: '#a9c4b4' }}>WAKE UP</div><div style={{ fontSize: 28, fontWeight: 820, marginTop: 3 }}>7:18</div></div><div><div style={{ fontSize: 10, color: '#a9c4b4' }}>LEAVE BY</div><div style={{ fontSize: 28, fontWeight: 820, marginTop: 3 }}>8:12</div></div></div>
      <div style={{ fontSize: 11, color: '#d4e4d9', marginTop: 13 }}>Calculus I · 8:30 AM · Sci Hall 204</div>
    </div></Rise>
    <Rise frame={frame} delay={13} style={{ marginTop: 18 }}><SectionLabel>Why this time?</SectionLabel><div style={{ ...card, padding: 16 }}>
      {[['12 min', 'walk to Sci Hall', MapPin], ['15 min', 'time to get ready', Clock3], ['8:30 AM', 'class begins', CalendarDays]].map(([time, label, Icon], i) => <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < 2 ? `1px solid ${color.line}` : 'none' }}><div style={{ width: 30, height: 30, borderRadius: 10, background: color.fill, display: 'grid', placeItems: 'center' }}>{React.createElement(Icon as typeof MapPin, { size: 15, color: color.green })}</div><span style={{ fontSize: 11, flex: 1 }}>{label as string}</span><strong style={{ fontSize: 12, color: color.green }}>{time as string}</strong></div>)}
    </div></Rise>
  </>;
}

function Deadlines({ frame }: { frame: number }) {
  return <>
    <PageHeader eyebrow="Your due board" title="Deadlines" subtitle="What is coming up, in one calm place." />
    <Rise frame={frame} delay={2}><div style={{ ...card, background: '#e6efe6', padding: 19, marginBottom: 18 }}><div style={smallLabel}>This week</div><div style={{ fontFamily: font.display, fontSize: 23, marginTop: 9 }}>You have three things ahead.</div><div style={{ fontSize: 11, color: color.muted, marginTop: 7 }}>Start with the one that needs you today.</div></div></Rise>
    <SectionLabel>Coming up</SectionLabel>
    {[['Chemistry lab report', 'CHEM 102 · Tomorrow', 'DUE TOMORROW', color.coral], ['Programming problem set', 'CS 101 · Thursday', 'THU', color.lavender], ['Literature response', 'LIT 110 · Friday', 'FRI', color.teal]].map(([title, meta, due, accent], i) => <Rise key={String(title)} frame={frame} delay={10 + i * 7} style={{ marginBottom: 10 }}><div style={{ ...card, padding: 15, display: 'flex', alignItems: 'center', gap: 11 }}>
      <div style={{ width: 20, height: 20, border: `2px solid ${accent}`, borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 800 }}>{title}</div><div style={{ fontSize: 10, color: color.muted, marginTop: 5 }}>{meta}</div></div>
      <span style={{ fontSize: 8, fontWeight: 850, color: accent, background: color.fill, padding: '6px 7px', borderRadius: 7 }}>{due}</span>
    </div></Rise>)}
    <Rise frame={frame} delay={35} style={{ marginTop: 20 }}><div style={{ ...card, padding: 15, background: color.night, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}><Sparkles size={17} color={color.yellow} /><span style={{ fontSize: 11, fontWeight: 750 }}>Turn a syllabus into a due board</span><ArrowRight size={15} style={{ marginLeft: 'auto' }} /></div></Rise>
  </>;
}

function Kitchen({ frame }: { frame: number }) {
  return <>
    <PageHeader eyebrow="Micro-cooking" title="Dorm Kitchen" subtitle="Good food for a small space and a full day." />
    <Rise frame={frame} delay={2}><div style={{ ...card, background: color.night, color: '#fff', padding: 18, marginBottom: 18 }}><div style={{ ...smallLabel, color: color.yellow }}>Dorm life, served</div><div style={{ fontFamily: font.display, fontSize: 25, lineHeight: 1.02, marginTop: 9 }}>Cook something that fits your day.</div><div style={{ fontSize: 11, color: '#c8dacd', marginTop: 10 }}>Microwave · kettle · rice cooker</div></div></Rise>
    <SectionLabel>Between classes</SectionLabel>
    <Rise frame={frame} delay={12}><div style={{ ...card, overflow: 'hidden' }}><Img src={staticFile('recipes/upgraded-ramen.png')} style={{ width: '100%', height: 190, objectFit: 'cover' }} /><div style={{ padding: 16 }}><div style={smallLabel}>Kettle-friendly · 10 min</div><div style={{ fontFamily: font.display, fontSize: 23, marginTop: 6 }}>Upgraded ramen</div><div style={{ fontSize: 11, color: color.muted, marginTop: 6 }}>A quick, comforting reset before your next class.</div><div style={{ color: color.green, fontSize: 11, fontWeight: 800, marginTop: 11 }}>See recipe <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></div></div></div></Rise>
    <Rise frame={frame} delay={24} style={{ marginTop: 14 }}><div style={{ ...card, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 10 }}><ChefHat size={17} color={color.green} /><span style={{ fontSize: 11, fontWeight: 750 }}>Suggestions for your setup</span><ChevronRight size={14} color={color.muted} style={{ marginLeft: 'auto' }} /></div></Rise>
  </>;
}

function Copilot({ frame }: { frame: number }) {
  const response = 'Your Chemistry lab report is due tomorrow. You have a 90-minute gap after Calculus I — a good time to finish the results section.';
  const visible = response.slice(0, Math.max(0, Math.round((frame - 42) * 1.9)));
  return <>
    <PageHeader eyebrow="Student context, useful action" title="Ask Dormosaur" subtitle="Help that connects the pieces of your day." />
    <Rise frame={frame} delay={2}><div style={{ ...card, background: color.night, color: '#fff', padding: 16, display: 'flex', gap: 10, alignItems: 'center' }}><Img src={staticFile('dormosaur-hi.png')} style={{ width: 47, height: 47, objectFit: 'contain', borderRadius: 12 }} /><div><div style={{ fontSize: 13, fontWeight: 850 }}>Dormosaur Copilot</div><div style={{ fontSize: 10, color: '#c8dacd', marginTop: 4 }}>Your classes, deadlines, and dorm life together.</div></div></div></Rise>
    <Rise frame={frame} delay={14} style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 23 }}><div style={{ maxWidth: '83%', background: color.green, color: '#fff', borderRadius: '17px 17px 4px 17px', padding: '13px 15px', fontSize: 12, lineHeight: 1.4 }}>What should I focus on tonight?</div></Rise>
    <Rise frame={frame} delay={36} style={{ display: 'flex', marginTop: 17 }}><div style={{ maxWidth: '91%', ...card, borderRadius: '17px 17px 17px 4px', padding: 16, minHeight: 132 }}><div style={smallLabel}>Based on your week</div><div style={{ fontSize: 12, lineHeight: 1.5, marginTop: 11 }}>{visible}</div></div></Rise>
    <Rise frame={frame} delay={85} style={{ marginTop: 23 }}><div style={{ ...card, padding: 14, display: 'flex', alignItems: 'center', gap: 10, color: color.muted, fontSize: 11 }}><MessageCircle size={17} color={color.green} />Ask about your day...<ArrowRight size={15} style={{ marginLeft: 'auto' }} /></div></Rise>
  </>;
}

const pages = { schedule: Schedule, today: Today, alarms: Alarms, deadlines: Deadlines, kitchen: Kitchen, copilot: Copilot };

export function ProductPhone({ chapter, frame, style }: { chapter: ChapterId; frame: number; style?: CSSProperties }) {
  const Page = pages[chapter];
  return <div style={{ width: 406, height: 846, borderRadius: 54, background: '#15261d', padding: 10, boxSizing: 'border-box', boxShadow: '0 45px 70px rgba(23,57,38,.22), 0 7px 16px rgba(23,57,38,.13), inset 0 0 0 2px #668573', position: 'relative', ...style }}>
    <div style={{ width: '100%', height: '100%', background: color.paper, borderRadius: 44, overflow: 'hidden', position: 'relative', color: color.ink, fontFamily: font.sans }}>
      <div style={{ height: 45, padding: '13px 24px 0', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800 }}><span>9:41</span><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span>▂▄▆</span><span style={{ width: 15, height: 7, border: `1px solid ${color.ink}`, borderRadius: 2, display: 'inline-block', position: 'relative' }}><span style={{ position: 'absolute', inset: 1, width: 10, background: color.ink }} /></span></span></div>
      <div style={{ height: 34, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 850, color: color.green }}><Img src={staticFile('dormosaur-logo.png')} style={{ width: 23, height: 23, objectFit: 'contain', borderRadius: 5 }} /> Dormosaur <Bell size={15} style={{ marginLeft: 'auto', color: color.ink }} /></div>
      <div style={{ padding: '8px 20px 84px', height: 735, boxSizing: 'border-box', overflow: 'hidden' }}><Page frame={frame} /></div>
      <BottomNav active={chapter} />
    </div>
  </div>;
}
