import React from 'react';
import { interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AmbientBackground } from '../components/AmbientBackground';
import { ApplePhoneMockup } from '../components/ApplePhoneMockup';
import { GlassCard } from '../components/GlassCard';
import { KineticText } from '../components/KineticText';
import { theme } from '../theme';

export const DormosaurAppleShort: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Sequence 1: Fast Hook (0 - 90 frames) */}
      <Sequence from={0} durationInFrames={90}>
        <VerticalHookScene />
      </Sequence>

      {/* Sequence 2: Mascot & Reveal (90 - 210 frames) */}
      <Sequence from={90} durationInFrames={120}>
        <VerticalRevealScene />
      </Sequence>

      {/* Sequence 3: Feature Highlights (210 - 450 frames) */}
      <Sequence from={210} durationInFrames={240}>
        <VerticalFeaturesScene />
      </Sequence>

      {/* Sequence 4: Outro CTA (450 - 600 frames) */}
      <Sequence from={450} durationInFrames={150}>
        <VerticalOutroScene />
      </Sequence>
    </div>
  );
};

const VerticalHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const exitFade = interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px',
        opacity: exitFade,
      }}
    >
      <AmbientBackground glowColor="rgba(239, 68, 68, 0.45)" />
      <KineticText
        badge="STUDENT STRUGGLE"
        badgeColor="#f87171"
        title="College life is chaos."
        highlightWord="chaos."
        highlightGradient="linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
        subtitle="Messy syllabi. Missed alarms. Cold ramen."
        titleSize={72}
      />
    </div>
  );
};

const VerticalRevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mascotSpring = spring({ frame, fps, config: theme.springs.bouncy });
  const exitFade = interpolate(frame, [105, 120], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px',
        opacity: exitFade,
      }}
    >
      <AmbientBackground glowColor={theme.colors.accentEmerald} />
      <div style={{ transform: `scale(${mascotSpring})`, marginBottom: 30 }}>
        <img
          src={staticFile('dormosaur-hi.png')}
          alt="Dormosaur"
          style={{ width: 260, height: 'auto', filter: 'drop-shadow(0 0 50px rgba(16, 185, 129, 0.45))' }}
        />
      </div>
      <KineticText
        badge="MEET DORMOSAUR"
        badgeColor="#34d399"
        title="Dorm Life. Decoded."
        highlightWord="Decoded."
        subtitle="Your smart campus companion."
        titleSize={74}
      />
    </div>
  );
};

const VerticalFeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneSpring = spring({ frame, fps, config: theme.springs.smooth });
  const exitFade = interpolate(frame, [225, 240], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exitFade,
      }}
    >
      <AmbientBackground glowColor="rgba(6, 182, 212, 0.4)" />
      <div style={{ transform: `scale(${phoneSpring}) translateY(${interpolate(phoneSpring, [0, 1], [60, 0])}px)` }}>
        <ApplePhoneMockup scale={1.05} expandIslandAtFrame={20}>
          <div style={{ padding: 18, color: '#ffffff' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Daily Dashboard</div>
            <div style={{ marginTop: 14 }}>
              <GlassCard style={{ padding: 14 }}>
                <div style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>SMART TRANSIT ALARM</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>12 min walk to Sci Hall</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>Alarm: 7:18 AM</div>
              </GlassCard>
            </div>
            <div style={{ marginTop: 14 }}>
              <GlassCard style={{ padding: 14 }}>
                <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>MICRO-KITCHEN</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Garlic Chili Kettle Ramen</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>5 min • 14g Protein</div>
              </GlassCard>
            </div>
          </div>
        </ApplePhoneMockup>
      </div>
    </div>
  );
};

const VerticalOutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const springVal = spring({ frame, fps, config: theme.springs.bouncy });

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px',
      }}
    >
      <AmbientBackground glowColor="rgba(16, 185, 129, 0.6)" intensity={1.8} />
      <div style={{ transform: `scale(${springVal})`, textAlign: 'center' }}>
        <img
          src={staticFile('dormosaur-hi.png')}
          alt="Dormosaur"
          style={{ width: 200, height: 'auto', marginBottom: 24 }}
        />
        <KineticText
          title="Elevate your dorm life."
          highlightWord="Elevate"
          subtitle="Available on Web, PWA & Android."
          titleSize={64}
        />
        <div
          style={{
            marginTop: 36,
            padding: '16px 36px',
            backgroundColor: '#10b981',
            borderRadius: 999,
            color: '#000000',
            fontSize: 22,
            fontWeight: 800,
            display: 'inline-block',
            boxShadow: '0 0 50px rgba(16, 185, 129, 0.7)',
          }}
        >
          Get Started Now 🦖
        </div>
      </div>
    </div>
  );
};
