import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AmbientBackground } from '../components/AmbientBackground';
import { GlassCard } from '../components/GlassCard';
import { KineticText } from '../components/KineticText';
import { theme } from '../theme';

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Snappy intro zoom
  const zoomSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });

  const scale = interpolate(zoomSpring, [0, 1], [0.85, 1]);
  const exitFade = interpolate(frame, [105, 120], [1, 0], { extrapolateLeft: 'clamp' });

  // Floating chaotic schedule & alarm elements
  const alarm1Spring = spring({ frame: Math.max(0, frame - 10), fps, config: theme.springs.bouncy });
  const alarm2Spring = spring({ frame: Math.max(0, frame - 22), fps, config: theme.springs.bouncy });
  const chaosCardSpring = spring({ frame: Math.max(0, frame - 32), fps, config: theme.springs.snappy });

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exitFade,
        transform: `scale(${scale})`,
        overflow: 'hidden',
      }}
    >
      <AmbientBackground glowColor="rgba(239, 68, 68, 0.4)" subtleGrid={true} />

      {/* Main Apple Headline */}
      <div style={{ zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <KineticText
          badge="CAMPUS REALITY"
          badgeColor="#f87171"
          title="College life is chaos."
          highlightWord="chaos."
          highlightGradient="linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
          subtitle="Messy syllabi. Missed morning alarms. Scrambling to class on an empty stomach."
          titleSize={96}
        />
      </div>

      {/* Floating chaotic notification 1: Overlapping Alarm */}
      <div
        style={{
          position: 'absolute',
          top: 160,
          left: 140,
          transform: `scale(${alarm1Spring}) rotate(-8deg)`,
          opacity: alarm1Spring,
          zIndex: 20,
        }}
      >
        <GlassCard width={320} borderColor="rgba(239, 68, 68, 0.4)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>⏰</span>
            <div>
              <div style={{ fontSize: 13, color: '#f87171', fontWeight: 700 }}>ALARM • 7:00 AM</div>
              <div style={{ fontSize: 17, color: '#ffffff', fontWeight: 600 }}>Snoozed 4 times</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Floating chaotic notification 2: Urgent Late warning */}
      <div
        style={{
          position: 'absolute',
          bottom: 180,
          right: 140,
          transform: `scale(${alarm2Spring}) rotate(6deg)`,
          opacity: alarm2Spring,
          zIndex: 20,
        }}
      >
        <GlassCard width={340} borderColor="rgba(245, 158, 11, 0.4)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🏃‍♂️</span>
            <div>
              <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>CS 101 STARTS IN 8 MIN</div>
              <div style={{ fontSize: 16, color: '#ffffff', fontWeight: 600 }}>Walking distance: 15 min!</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Floating Raw Syllabus snippet */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 180,
          transform: `scale(${chaosCardSpring}) rotate(-4deg)`,
          opacity: chaosCardSpring,
          zIndex: 15,
        }}
      >
        <GlassCard width={380} borderColor="rgba(255, 255, 255, 0.1)">
          <div style={{ fontFamily: theme.fonts.mono, fontSize: 12, color: '#94a3b8' }}>
            <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>⚠️ UNORGANIZED PDF SYLLABUS</div>
            <div>MATH202 LEC TTH 10:30-12:00 SCI302</div>
            <div>BIO110 LAB W 14:00-17:00 SCI101</div>
            <div>ENG201 DIS F 09:00-10:00 HUM204</div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
