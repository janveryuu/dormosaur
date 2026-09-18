import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

interface KineticTextProps {
  badge?: string;
  badgeColor?: string;
  title: string;
  highlightWord?: string;
  highlightGradient?: string;
  subtitle?: string;
  startFrame?: number;
  align?: 'center' | 'left' | 'right';
  titleSize?: number;
}

export const KineticText: React.FC<KineticTextProps> = ({
  badge,
  badgeColor = theme.colors.accentEmerald,
  title,
  highlightWord,
  highlightGradient = 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #06b6d4 100%)',
  subtitle,
  startFrame = 0,
  align = 'center',
  titleSize = 88,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);

  // Badge Spring Animation
  const badgeSpring = spring({
    frame: relFrame,
    fps,
    config: theme.springs.snappy,
  });

  // Title Slide & Scale Animation
  const titleSpring = spring({
    frame: Math.max(0, relFrame - 4),
    fps,
    config: theme.springs.snappy,
  });

  const titleTranslateY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleLetterSpacing = interpolate(titleSpring, [0, 1], [-2, -0.04]);
  const titleOpacity = interpolate(titleSpring, [0, 0.4, 1], [0, 0.8, 1]);

  // Subtitle Delayed Spring
  const subtitleSpring = spring({
    frame: Math.max(0, relFrame - 12),
    fps,
    config: theme.springs.smooth,
  });
  const subtitleTranslateY = interpolate(subtitleSpring, [0, 1], [30, 0]);
  const subtitleOpacity = interpolate(subtitleSpring, [0, 1], [0, 0.85]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        textAlign: align,
        fontFamily: theme.fonts.display,
        zIndex: 20,
      }}
    >
      {/* Apple-style Pill Badge */}
      {badge && (
        <div
          style={{
            opacity: badgeSpring,
            transform: `scale(${interpolate(badgeSpring, [0, 1], [0.8, 1])}) translateY(${interpolate(
              badgeSpring,
              [0, 1],
              [-15, 0]
            )}px)`,
            marginBottom: 20,
            padding: '6px 18px',
            borderRadius: 999,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${badgeColor}`,
            boxShadow: `0 0 20px ${badgeColor}33`,
            color: badgeColor,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(16px)',
          }}
        >
          {badge}
        </div>
      )}

      {/* Main Massive Headline */}
      <h1
        style={{
          margin: 0,
          padding: 0,
          fontSize: titleSize,
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: `${titleLetterSpacing}em`,
          color: theme.colors.textPrimary,
          opacity: titleOpacity,
          transform: `translateY(${titleTranslateY}px)`,
          textShadow: '0 10px 40px rgba(0,0,0,0.8)',
        }}
      >
        {highlightWord && title.includes(highlightWord) ? (
          <>
            {title.split(highlightWord)[0]}
            <span
              style={{
                background: highlightGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                filter: 'drop-shadow(0 0 35px rgba(16, 185, 129, 0.45))',
              }}
            >
              {highlightWord}
            </span>
            {title.split(highlightWord)[1]}
          </>
        ) : (
          title
        )}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p
          style={{
            marginTop: 24,
            marginBottom: 0,
            fontSize: 32,
            fontWeight: 400,
            lineHeight: 1.4,
            maxWidth: 900,
            color: theme.colors.textSecondary,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleTranslateY}px)`,
            letterSpacing: '-0.01em',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
