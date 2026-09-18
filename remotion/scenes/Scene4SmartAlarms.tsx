import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AmbientBackground } from '../components/AmbientBackground';
import { GlassCard } from '../components/GlassCard';
import { KineticText } from '../components/KineticText';
import { theme } from '../theme';

export const Scene4SmartAlarms: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame,
    fps,
    config: theme.springs.bouncy,
  });

  const timeCounter = Math.min(12, Math.floor(interpolate(frame, [10, 45], [0, 12])));
  const exitFade = interpolate(frame, [145, 160], [1, 0], { extrapolateLeft: 'clamp' });

  // Floating pulses
  const pulseScale = Math.sin(frame / 8) * 0.05 + 1;

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exitFade,
        overflow: 'hidden',
      }}
    >
      <AmbientBackground glowColor="rgba(6, 182, 212, 0.4)" />

      {/* Kinetic Headline */}
      <KineticText
        badge="SMART ALARM SYNC"
        badgeColor="#38bdf8"
        title="Wake up for the walk, not just the clock."
        highlightWord="walk,"
        highlightGradient="linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)"
        subtitle="Dormosaur computes building transit times across campus and auto-syncs your morning alarm."
        titleSize={76}
      />

      {/* Hero Apple Glass Dynamic Island / Alarm Widget */}
      <div
        style={{
          marginTop: 48,
          transform: `scale(${cardSpring * pulseScale})`,
          opacity: cardSpring,
          zIndex: 30,
        }}
      >
        <GlassCard width={680} borderColor="rgba(56, 189, 248, 0.35)" glow={true}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
                }}
              >
                🔔
              </div>

              <div>
                <div style={{ fontSize: 13, color: '#38bdf8', fontWeight: 700, letterSpacing: '0.08em' }}>
                  CAMPUS TRANSIT SYNCHRONIZED
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                  CS 301 at Science Hall
                </div>
                <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
                  Walking lead-time: <strong style={{ color: '#38bdf8' }}>{timeCounter} min</strong> • Prep: 15 min
                </div>
              </div>
            </div>

            {/* Smart Alarm Time Callout */}
            <div
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 18,
                padding: '14px 22px',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: 11, color: '#7dd3fc', fontWeight: 700, textTransform: 'uppercase' }}>
                Auto-Synced Wakeup
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                7:18 AM
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
