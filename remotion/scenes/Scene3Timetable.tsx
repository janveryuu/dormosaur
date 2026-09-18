import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AmbientBackground } from '../components/AmbientBackground';
import { ApplePhoneMockup } from '../components/ApplePhoneMockup';
import { GlassCard } from '../components/GlassCard';
import { KineticText } from '../components/KineticText';
import { theme } from '../theme';

export const Scene3Timetable: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance 3D rotation & slide
  const entranceSpring = spring({
    frame,
    fps,
    config: theme.springs.smooth,
  });

  const phoneRotY = interpolate(entranceSpring, [0, 1], [-22, -8]);
  const phoneRotX = interpolate(entranceSpring, [0, 1], [15, 6]);

  // Timetable courses cascading reveal
  const course1 = spring({ frame: Math.max(0, frame - 15), fps, config: theme.springs.snappy });
  const course2 = spring({ frame: Math.max(0, frame - 25), fps, config: theme.springs.snappy });
  const course3 = spring({ frame: Math.max(0, frame - 35), fps, config: theme.springs.snappy });

  const exitFade = interpolate(frame, [155, 170], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 100px',
        opacity: exitFade,
        overflow: 'hidden',
      }}
    >
      <AmbientBackground glowColor="rgba(16, 185, 129, 0.35)" />

      {/* Left Column: Kinetic Feature Text */}
      <div style={{ maxWidth: 640, zIndex: 20 }}>
        <KineticText
          align="left"
          badge="INTELLIGENT TIMETABLE"
          badgeColor="#34d399"
          title="Paste raw chaos. Get pure clarity."
          highlightWord="clarity."
          highlightGradient="linear-gradient(135deg, #34d399 0%, #10b981 100%)"
          subtitle="Our AI heuristic parser turns unformatted syllabus dumps into an aesthetic weekly timetable in milliseconds."
          titleSize={68}
        />

        {/* Feature Highlights Pills */}
        <div style={{ display: 'flex', gap: 14, marginTop: 32 }}>
          <GlassCard style={{ padding: '12px 20px', borderRadius: 16 }}>
            <div style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>⚡ 0.04s Instant OCR</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Zero manual typing</div>
          </GlassCard>

          <GlassCard style={{ padding: '12px 20px', borderRadius: 16 }}>
            <div style={{ fontSize: 13, color: '#38bdf8', fontWeight: 700 }}>🎨 Lockscreen Exporter</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>HD phone wallpapers</div>
          </GlassCard>
        </div>
      </div>

      {/* Right Column: 3D Titanium Phone Displaying the Timetable */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <ApplePhoneMockup
          rotateY={phoneRotY}
          rotateX={phoneRotX}
          scale={0.92}
          showDynamicIsland={true}
          expandIslandAtFrame={20}
        >
          {/* Inside Screen: Timetable App View */}
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>SPRING SEMESTER 2026</div>
                <div style={{ fontSize: 20, color: '#ffffff', fontWeight: 800 }}>Weekly Schedule</div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  color: '#6ee7b7',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                ACTIVE
              </div>
            </div>

            {/* Timetable Cards Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Class 1 */}
              <div
                style={{
                  opacity: course1,
                  transform: `translateX(${interpolate(course1, [0, 1], [40, 0])}px)`,
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  borderRadius: 14,
                  padding: 12,
                  border: '1px solid rgba(16,185,129,0.35)',
                  boxShadow: 'inset 0 0 0 1px rgba(16,185,129,0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>CS 301 • Distributed Systems</span>
                  <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>09:00 - 10:30 AM</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>📍 Science Hall 304 • Prof. Vance</div>
              </div>

              {/* Class 2 */}
              <div
                style={{
                  opacity: course2,
                  transform: `translateX(${interpolate(course2, [0, 1], [40, 0])}px)`,
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  borderRadius: 14,
                  padding: 12,
                  border: '1px solid rgba(6,182,212,0.35)',
                  boxShadow: 'inset 0 0 0 1px rgba(6,182,212,0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>MATH 202 • Linear Algebra</span>
                  <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>11:00 - 12:30 PM</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>📍 Euler Hall 102 • Dr. Thorne</div>
              </div>

              {/* Class 3 */}
              <div
                style={{
                  opacity: course3,
                  transform: `translateX(${interpolate(course3, [0, 1], [40, 0])}px)`,
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  borderRadius: 14,
                  padding: 12,
                  border: '1px solid rgba(168,85,247,0.35)',
                  boxShadow: 'inset 0 0 0 1px rgba(168,85,247,0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>BIO 110 • Molecular Biology</span>
                  <span style={{ fontSize: 11, color: '#c084fc', fontWeight: 700 }}>02:00 - 04:00 PM</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>📍 Bio Lab Complex 12 • Dr. Aris</div>
              </div>
            </div>
          </div>
        </ApplePhoneMockup>
      </div>
    </div>
  );
};
