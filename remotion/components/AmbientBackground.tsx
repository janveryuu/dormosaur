import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';

interface AmbientBackgroundProps {
  glowColor?: string;
  intensity?: number;
  subtleGrid?: boolean;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  glowColor = theme.colors.accentEmerald,
  intensity = 1,
  subtleGrid = true,
}) => {
  const frame = useCurrentFrame();

  // Slow organic breathing and gentle orbital motion for ambient light halos
  const pulse = Math.sin(frame / 40) * 0.15 + 0.85;
  const shiftX = Math.cos(frame / 60) * 80;
  const shiftY = Math.sin(frame / 50) * 60;
  const secondaryShiftX = Math.sin(frame / 70) * -100;
  const secondaryShiftY = Math.cos(frame / 65) * -70;

  const glowOpacity = interpolate(frame, [0, 20], [0, 0.45 * intensity], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#000000',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Primary Apple Aurora Radial Glow */}
      <div
        style={{
          position: 'absolute',
          top: `calc(35% + ${shiftY}px)`,
          left: `calc(50% + ${shiftX}px)`,
          transform: 'translate(-50%, -50%)',
          width: 1400,
          height: 1000,
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, rgba(16, 185, 129, 0.25) 35%, rgba(6, 182, 212, 0.08) 60%, transparent 75%)`,
          opacity: glowOpacity * pulse,
          filter: 'blur(100px)',
        }}
      />

      {/* Secondary Cyan Ambient Accent Halo */}
      <div
        style={{
          position: 'absolute',
          bottom: `calc(10% + ${secondaryShiftY}px)`,
          right: `calc(20% + ${secondaryShiftX}px)`,
          width: 900,
          height: 700,
          background: `radial-gradient(circle at center, rgba(6, 182, 212, 0.25) 0%, rgba(16, 185, 129, 0.12) 40%, transparent 70%)`,
          opacity: glowOpacity * 0.7 * pulse,
          filter: 'blur(120px)',
        }}
      />

      {/* Subtle Studio Floor Spotlight Reflection */}
      <div
        style={{
          position: 'absolute',
          bottom: -200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: 400,
          background: 'radial-gradient(ellipse at bottom, rgba(52, 211, 153, 0.15) 0%, transparent 70%)',
          opacity: glowOpacity * 0.8,
          filter: 'blur(80px)',
        }}
      />

      {/* Ultra-subtle Apple Keynote Grid lines */}
      {subtleGrid && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
            `,
            backgroundSize: '120px 120px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          }}
        />
      )}

      {/* Vignette Overlay for Cinematic Contrast */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.75) 100%)',
        }}
      />
    </div>
  );
};
