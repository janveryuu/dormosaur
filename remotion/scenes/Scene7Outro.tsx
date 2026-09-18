import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AmbientBackground } from '../components/AmbientBackground';
import { ApplePhoneMockup } from '../components/ApplePhoneMockup';
import { KineticText } from '../components/KineticText';
import { theme } from '../theme';

export const Scene7Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance zoom & tilt
  const outroSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 100, mass: 1 },
  });

  const phoneRotY = interpolate(outroSpring, [0, 1], [25, 0]);
  const phoneRotX = interpolate(outroSpring, [0, 1], [15, 0]);
  const phoneScale = interpolate(outroSpring, [0, 1], [0.75, 0.95]);

  const buttonPulse = Math.sin(frame / 12) * 0.05 + 1;

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
        padding: '0 120px',
        overflow: 'hidden',
      }}
    >
      <AmbientBackground glowColor="rgba(16, 185, 129, 0.5)" intensity={1.6} />

      {/* Left Column: Call to Action & Brand */}
      <div style={{ maxWidth: 640, zIndex: 20 }}>
        <KineticText
          align="left"
          badge="GET STARTED TODAY"
          badgeColor="#34d399"
          title="Elevate your college experience."
          highlightWord="Elevate"
          highlightGradient="linear-gradient(135deg, #34d399 0%, #10b981 60%, #38bdf8 100%)"
          subtitle="Smart Timetables. Synced Alarms. Zero-Stove Kitchen. AI Copilot."
          titleSize={72}
        />

        {/* Apple Style Interactive Action Pill */}
        <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              padding: '18px 36px',
              borderRadius: 999,
              backgroundColor: '#10b981',
              color: '#000000',
              fontSize: 20,
              fontWeight: 800,
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.6), 0 10px 20px rgba(0,0,0,0.5)',
              transform: `scale(${buttonPulse})`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span>🦖</span>
            <span>Launch Dormosaur</span>
          </div>

          <div
            style={{
              padding: '18px 28px',
              borderRadius: 999,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: 18,
              fontWeight: 600,
              backdropFilter: 'blur(16px)',
            }}
          >
            PWA & Android App
          </div>
        </div>

        {/* Tech Stack Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 40,
            color: '#64748b',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span>Next.js 16</span>
          <span>•</span>
          <span>React 19</span>
          <span>•</span>
          <span>Tailwind v4</span>
          <span>•</span>
          <span>Supabase</span>
        </div>
      </div>

      {/* Right Column: Hero Centerpiece Phone */}
      <div style={{ zIndex: 15, position: 'relative' }}>
        <ApplePhoneMockup
          rotateY={phoneRotY}
          rotateX={phoneRotX}
          scale={phoneScale}
          showDynamicIsland={true}
          expandIslandAtFrame={10}
        >
          {/* Complete App Dashboard Preview inside Phone */}
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top Greeting */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>GOOD MORNING, JANVER</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>Your Campus Day</div>
              </div>
              <img
                src={staticFile('dormosaur-hi.png')}
                alt="Mini Mascot"
                style={{ width: 36, height: 36, objectFit: 'contain' }}
              />
            </div>

            {/* Next Class Hero Card */}
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.16)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 20,
                padding: 16,
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase' }}>
                Next Class in 45 Min
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                CS 301 • Distributed Systems
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
                Science Hall 304 • Walking time 12 min
              </div>
            </div>

            {/* Micro-Kitchen Recipe Card */}
            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 18,
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 28 }}>🍜</div>
              <div>
                <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>MICRO-KITCHEN PICK</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Kettle Garlic Chili Noodles</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>5 mins • 14g Protein</div>
              </div>
            </div>
          </div>
        </ApplePhoneMockup>
      </div>
    </div>
  );
};
