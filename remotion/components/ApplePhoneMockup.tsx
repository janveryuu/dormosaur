import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { DynamicIsland } from './DynamicIsland';

interface ApplePhoneMockupProps {
  children: React.ReactNode;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale?: number;
  translateY?: number;
  translateX?: number;
  expandIslandAtFrame?: number;
  showDynamicIsland?: boolean;
}

export const ApplePhoneMockup: React.FC<ApplePhoneMockupProps> = ({
  children,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  scale = 1,
  translateY = 0,
  translateX = 0,
  expandIslandAtFrame = 30,
  showDynamicIsland = true,
}) => {
  const frame = useCurrentFrame();

  // Specular light sweep across the display
  const glarePosition = interpolate(frame, [0, 120], [-120, 240]);

  return (
    <div
      style={{
        perspective: 1600,
        transformStyle: 'preserve-3d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer Titanium Chassis */}
      <div
        style={{
          width: 420,
          height: 860,
          borderRadius: 56,
          backgroundColor: '#171717',
          padding: 12,
          boxShadow: `
            0 45px 90px rgba(0, 0, 0, 0.85),
            0 20px 40px rgba(0, 0, 0, 0.6),
            0 0 60px rgba(16, 185, 129, 0.2),
            inset 0 0 0 2px rgba(255, 255, 255, 0.15),
            inset 0 0 0 4px #0a0a0a
          `,
          transform: `
            translateX(${translateX}px)
            translateY(${translateY}px)
            scale(${scale})
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            rotateZ(${rotateZ}deg)
          `,
          transformStyle: 'preserve-3d',
          position: 'relative',
        }}
      >
        {/* Hardware Action Button (Left) */}
        <div
          style={{
            position: 'absolute',
            left: -4,
            top: 150,
            width: 4,
            height: 36,
            backgroundColor: '#262626',
            borderRadius: '4px 0 0 4px',
          }}
        />

        {/* Volume Up / Down (Left) */}
        <div
          style={{
            position: 'absolute',
            left: -4,
            top: 210,
            width: 4,
            height: 60,
            backgroundColor: '#262626',
            borderRadius: '4px 0 0 4px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -4,
            top: 285,
            width: 4,
            height: 60,
            backgroundColor: '#262626',
            borderRadius: '4px 0 0 4px',
          }}
        />

        {/* Power Button (Right) */}
        <div
          style={{
            position: 'absolute',
            right: -4,
            top: 220,
            width: 4,
            height: 85,
            backgroundColor: '#262626',
            borderRadius: '0 4px 4px 0',
          }}
        />

        {/* Inner OLED Screen Container */}
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#090d0b',
            borderRadius: 46,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.9)',
          }}
        >
          {/* iOS Status Bar Time */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 28,
              fontSize: 14,
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: theme.fonts.display,
              zIndex: 40,
            }}
          >
            9:41
          </div>

          {/* iOS Status Bar Icons (Right) */}
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 26,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 40,
              color: '#ffffff',
              fontSize: 12,
            }}
          >
            <span>5G</span>
            <div
              style={{
                width: 22,
                height: 11,
                borderRadius: 3,
                border: '1px solid #ffffff',
                padding: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div style={{ width: '85%', height: '100%', backgroundColor: '#ffffff', borderRadius: 1 }} />
            </div>
          </div>

          {/* Dynamic Island */}
          {showDynamicIsland && <DynamicIsland expandAtFrame={expandIslandAtFrame} />}

          {/* Screen Content Slot */}
          <div
            style={{
              flex: 1,
              paddingTop: 68,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {children}
          </div>

          {/* iOS Home Indicator Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 135,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.45)',
              zIndex: 60,
            }}
          />

          {/* Apple Glass Specular Glare Reflection */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.08) 50%, transparent 60%)`,
              transform: `translateX(${glarePosition}%)`,
              pointerEvents: 'none',
              zIndex: 70,
            }}
          />
        </div>
      </div>
    </div>
  );
};
