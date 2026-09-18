import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

interface DynamicIslandProps {
  expandAtFrame?: number;
  courseTitle?: string;
  room?: string;
  walkMinutes?: number;
  alarmTime?: string;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  expandAtFrame = 25,
  courseTitle = 'CS 301 • Distributed Systems',
  room = 'Science Hall 304',
  walkMinutes = 12,
  alarmTime = '7:18 AM',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isExpanded = frame >= expandAtFrame;
  const relFrame = Math.max(0, frame - expandAtFrame);

  const expandSpring = spring({
    frame: relFrame,
    fps,
    config: theme.springs.bouncy,
  });

  const width = isExpanded ? interpolate(expandSpring, [0, 1], [140, 360]) : 140;
  const height = isExpanded ? interpolate(expandSpring, [0, 1], [38, 100]) : 38;
  const borderRadius = isExpanded ? interpolate(expandSpring, [0, 1], [20, 32]) : 20;

  // Soundwave / Activity Pulse in the pill
  const wave1 = Math.abs(Math.sin(frame / 6)) * 14 + 4;
  const wave2 = Math.abs(Math.cos(frame / 5)) * 16 + 5;
  const wave3 = Math.abs(Math.sin(frame / 7 + 1)) * 12 + 6;

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        width,
        height,
        borderRadius,
        backgroundColor: '#000000',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: isExpanded
          ? '0 18px 40px rgba(0, 0, 0, 0.9), 0 0 25px rgba(16, 185, 129, 0.25)'
          : '0 8px 16px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isExpanded ? 'space-between' : 'center',
        padding: isExpanded ? '14px 20px' : '0 12px',
        overflow: 'hidden',
        zIndex: 50,
        fontFamily: theme.fonts.display,
        color: '#ffffff',
        transition: 'none',
      }}
    >
      {!isExpanded ? (
        // Collapsed Island State
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: theme.colors.accentEmerald,
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>7:18</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 3, height: wave1, backgroundColor: '#34d399', borderRadius: 2 }} />
            <div style={{ width: 3, height: wave2, backgroundColor: '#10b981', borderRadius: 2 }} />
            <div style={{ width: 3, height: wave3, backgroundColor: '#06b6d4', borderRadius: 2 }} />
          </div>
        </div>
      ) : (
        // Expanded Island Card
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: interpolate(expandSpring, [0, 0.6, 1], [0, 0.2, 1]),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Dino Mascot Mini Badge */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              🦖
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                {courseTitle}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span>📍 {room}</span>
                <span>•</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>{walkMinutes}m walk</span>
              </div>
            </div>
          </div>

          {/* Alarm Auto-Sync Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              backgroundColor: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 12,
              padding: '6px 10px',
            }}
          >
            <span style={{ fontSize: 9, textTransform: 'uppercase', color: '#6ee7b7', fontWeight: 700, letterSpacing: '0.05em' }}>
              Alarm Synced
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff' }}>{alarmTime}</span>
          </div>
        </div>
      )}
    </div>
  );
};
