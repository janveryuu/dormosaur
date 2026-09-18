import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AmbientBackground } from '../components/AmbientBackground';
import { KineticText } from '../components/KineticText';
import { theme } from '../theme';

export const Scene2BrandReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for mascot
  const mascotSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.9 },
  });

  // Shockwave ring explosion
  const ringScale = interpolate(frame, [0, 50], [0.2, 3.2]);
  const ringOpacity = interpolate(frame, [0, 20, 50], [0, 0.6, 0]);

  // Mascot subtle breathing float
  const floatY = Math.sin(frame / 20) * 12;
  const exitFade = interpolate(frame, [125, 140], [1, 0], { extrapolateLeft: 'clamp' });

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
      <AmbientBackground glowColor={theme.colors.accentEmerald} intensity={1.5} />

      {/* Emerald Shockwave Ring */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          border: '2px solid rgba(52, 211, 153, 0.8)',
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
          boxShadow: '0 0 80px rgba(16, 185, 129, 0.6)',
          pointerEvents: 'none',
        }}
      />

      {/* 3D Floating Mascot */}
      <div
        style={{
          transform: `scale(${mascotSpring}) translateY(${floatY}px)`,
          opacity: mascotSpring,
          marginBottom: 30,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 20,
        }}
      >
        {/* Glowing Rim Backlight behind Mascot */}
        <div
          style={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, transparent 70%)',
            filter: 'blur(35px)',
          }}
        />

        <img
          src={staticFile('dormosaur-hi.png')}
          alt="Dormosaur Mascot"
          style={{
            width: 230,
            height: 'auto',
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8)) drop-shadow(0 0 30px rgba(16, 185, 129, 0.35))',
          }}
        />
      </div>

      {/* Keynote Typography */}
      <KineticText
        badge="INTRODUCING DORMOSAUR"
        badgeColor="#34d399"
        title="Dorm Life. Decoded."
        highlightWord="Decoded."
        highlightGradient="linear-gradient(135deg, #34d399 0%, #10b981 60%, #38bdf8 100%)"
        subtitle="The all-in-one companion engineered for effortless college living."
        startFrame={10}
        titleSize={92}
      />
    </div>
  );
};
