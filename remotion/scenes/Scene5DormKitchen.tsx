import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AmbientBackground } from '../components/AmbientBackground';
import { GlassCard } from '../components/GlassCard';
import { KineticText } from '../components/KineticText';
import { theme } from '../theme';

export const Scene5DormKitchen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const card1 = spring({ frame: Math.max(0, frame - 10), fps, config: theme.springs.bouncy });
  const card2 = spring({ frame: Math.max(0, frame - 22), fps, config: theme.springs.bouncy });
  const card3 = spring({ frame: Math.max(0, frame - 34), fps, config: theme.springs.bouncy });

  const exitFade = interpolate(frame, [145, 160], [1, 0], { extrapolateLeft: 'clamp' });

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
      <AmbientBackground glowColor="rgba(234, 179, 8, 0.35)" />

      {/* Kinetic Headline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 10 }}>
        <img
          src={staticFile('chef-dormosaur.png')}
          alt="Chef Dormosaur"
          style={{ width: 80, height: 80, objectFit: 'contain' }}
        />
        <KineticText
          badge="MICRO-COOKING"
          badgeColor="#fbbf24"
          title="Gourmet dorm meals. Zero stove required."
          highlightWord="Zero stove"
          highlightGradient="linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
          subtitle="20+ student-tested recipes made exclusively with electric kettles, microwaves, and mini rice cookers."
          titleSize={70}
        />
      </div>

      {/* 3 Floating Apple Frosted Recipe Cards */}
      <div style={{ display: 'flex', gap: 28, marginTop: 40, zIndex: 20 }}>
        {/* Recipe 1 */}
        <div style={{ transform: `scale(${card1}) translateY(${interpolate(card1, [0, 1], [60, 0])}px)`, opacity: card1 }}>
          <GlassCard width={320} borderColor="rgba(245, 158, 11, 0.3)">
            <div style={{ fontSize: 36, marginBottom: 12 }}>🍜</div>
            <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
              Electric Kettle • 5 Min
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
              Spicy Chili Oil Ramen Hack
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: 6, color: '#cbd5e1' }}>
                14g Protein
              </span>
              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: 6, color: '#cbd5e1' }}>
                $1.80 / meal
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Recipe 2 */}
        <div style={{ transform: `scale(${card2}) translateY(${interpolate(card2, [0, 1], [60, 0])}px)`, opacity: card2 }}>
          <GlassCard width={320} borderColor="rgba(34, 197, 94, 0.3)" glow={true}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🍳</div>
            <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase' }}>
              Microwave Mug • 3 Min
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
              High-Protein Cheddar Scramble
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: 6, color: '#cbd5e1' }}>
                24g Protein
              </span>
              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: 6, color: '#cbd5e1' }}>
                Zero Cleanup
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Recipe 3 */}
        <div style={{ transform: `scale(${card3}) translateY(${interpolate(card3, [0, 1], [60, 0])}px)`, opacity: card3 }}>
          <GlassCard width={320} borderColor="rgba(239, 68, 68, 0.3)">
            <div style={{ fontSize: 36, marginBottom: 12 }}>🍛</div>
            <div style={{ fontSize: 11, color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>
              Mini Cooker • 15 Min
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
              One-Pot Golden Curry Rice
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: 6, color: '#cbd5e1' }}>
                Comfort Food
              </span>
              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: 6, color: '#cbd5e1' }}>
                Prep & Walk Away
              </span>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
