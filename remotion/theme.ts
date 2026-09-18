// Remotion design tokens and Apple aesthetic themes
export const theme = {
  colors: {
    bg: '#000000',
    bgCard: 'rgba(18, 24, 20, 0.72)',
    bgCardBorder: 'rgba(52, 211, 153, 0.22)',
    accentEmerald: '#10b981',
    accentGreen: '#22c55e',
    accentMint: '#6ee7b7',
    glowCyan: '#06b6d4',
    glowEmerald: 'rgba(16, 185, 129, 0.35)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    appleGray: '#1c1c1e',
    appleGlassBorder: 'rgba(255, 255, 255, 0.16)',
    appleShadow: '0 30px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(16, 185, 129, 0.15)',
  },
  fonts: {
    display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  springs: {
    snappy: { damping: 14, stiffness: 140, mass: 0.6 },
    smooth: { damping: 20, stiffness: 100, mass: 1 },
    bouncy: { damping: 10, stiffness: 160, mass: 0.8 },
    slowPan: { damping: 30, stiffness: 60, mass: 1.2 },
  },
};
