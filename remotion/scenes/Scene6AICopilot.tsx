import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AmbientBackground } from '../components/AmbientBackground';
import { GlassCard } from '../components/GlassCard';
import { KineticText } from '../components/KineticText';
import { theme } from '../theme';

export const Scene6AICopilot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const userBubble = spring({ frame: Math.max(0, frame - 15), fps, config: theme.springs.snappy });
  const aiBubble = spring({ frame: Math.max(0, frame - 40), fps, config: theme.springs.bouncy });

  // Typewriter text effect for AI response
  const fullAiResponse =
    "Review Dijkstra's Algorithm for CS 301. Your midterm is in 3 days! Also, grab lunch at North Hall before 1:00 PM.";
  const charsShown = Math.floor(interpolate(frame, [45, 110], [0, fullAiResponse.length], { extrapolateRight: 'clamp' }));
  const visibleAiText = fullAiResponse.slice(0, Math.max(0, charsShown));

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
      <AmbientBackground glowColor="rgba(168, 85, 247, 0.35)" />

      {/* Kinetic Headline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <img
          src={staticFile('ai-dormosaur.png')}
          alt="AI Copilot"
          style={{ width: 84, height: 84, objectFit: 'contain' }}
        />
        <KineticText
          badge="CAMPUS AI COPILOT"
          badgeColor="#c084fc"
          title="An intelligent study buddy that knows your schedule."
          highlightWord="intelligent"
          highlightGradient="linear-gradient(135deg, #c084fc 0%, #38bdf8 100%)"
          subtitle="Trained on your actual course syllabi, class gaps, and upcoming university deadlines."
          titleSize={68}
        />
      </div>

      {/* Dialogue Showcase */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 36, width: 780, zIndex: 20 }}>
        {/* User Question Bubble */}
        <div
          style={{
            alignSelf: 'flex-end',
            transform: `scale(${userBubble}) translateY(${interpolate(userBubble, [0, 1], [30, 0])}px)`,
            opacity: userBubble,
          }}
        >
          <div
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '16px 24px',
              borderRadius: '24px 24px 4px 24px',
              fontSize: 18,
              fontWeight: 500,
              boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)',
            }}
          >
            What should I study during my 2-hour gap between CS and Math? 📚
          </div>
        </div>

        {/* AI Response Card */}
        <div
          style={{
            alignSelf: 'flex-start',
            transform: `scale(${aiBubble}) translateY(${interpolate(aiBubble, [0, 1], [30, 0])}px)`,
            opacity: aiBubble,
            width: '100%',
          }}
        >
          <GlassCard borderColor="rgba(192, 132, 252, 0.4)" glow={true}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(147, 51, 234, 0.4)',
                }}
              >
                🦖
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#c084fc', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  DORMOSAUR COPILOT
                </div>
                <div style={{ fontSize: 20, color: '#ffffff', lineHeight: 1.45, fontWeight: 500 }}>
                  {visibleAiText}
                  {charsShown < fullAiResponse.length && (
                    <span style={{ display: 'inline-block', width: 2, height: 18, backgroundColor: '#c084fc', marginLeft: 4 }} />
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
