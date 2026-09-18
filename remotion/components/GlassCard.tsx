import React from 'react';
import { theme } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  borderColor?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  width = 'auto',
  height = 'auto',
  style = {},
  borderColor = theme.colors.appleGlassBorder,
  glow = false,
}) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: theme.colors.bgCard,
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRadius: 28,
        border: `1px solid ${borderColor}`,
        boxShadow: glow
          ? '0 30px 60px rgba(0, 0, 0, 0.7), 0 0 50px rgba(16, 185, 129, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
          : '0 24px 48px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
        padding: 24,
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {/* Top Edge Specular Reflection Sheen */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
        }}
      />
      {children}
    </div>
  );
};
