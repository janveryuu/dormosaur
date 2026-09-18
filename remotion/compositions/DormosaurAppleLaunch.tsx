import React from 'react';
import { Sequence } from 'remotion';
import { Scene1Hook } from '../scenes/Scene1Hook';
import { Scene2BrandReveal } from '../scenes/Scene2BrandReveal';
import { Scene3Timetable } from '../scenes/Scene3Timetable';
import { Scene4SmartAlarms } from '../scenes/Scene4SmartAlarms';
import { Scene5DormKitchen } from '../scenes/Scene5DormKitchen';
import { Scene6AICopilot } from '../scenes/Scene6AICopilot';
import { Scene7Outro } from '../scenes/Scene7Outro';

export const DormosaurAppleLaunch: React.FC = () => {
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
      {/* Act 1: The Scramble / College Chaos (Frames 0 - 120) */}
      <Sequence from={0} durationInFrames={120} name="1. Campus Chaos Hook">
        <Scene1Hook />
      </Sequence>

      {/* Act 2: Brand & Mascot Reveal (Frames 120 - 260) */}
      <Sequence from={120} durationInFrames={140} name="2. Brand Reveal">
        <Scene2BrandReveal />
      </Sequence>

      {/* Act 3: Intelligent Schedule & Timetable Engine (Frames 260 - 430) */}
      <Sequence from={260} durationInFrames={170} name="3. Smart Timetable Engine">
        <Scene3Timetable />
      </Sequence>

      {/* Act 4: Class-Synced Alarms & Walking Transit (Frames 430 - 590) */}
      <Sequence from={430} durationInFrames={160} name="4. Class-Synced Alarms">
        <Scene4SmartAlarms />
      </Sequence>

      {/* Act 5: Zero-Stove Dorm Kitchen (Frames 590 - 750) */}
      <Sequence from={590} durationInFrames={160} name="5. Zero-Stove Micro Kitchen">
        <Scene5DormKitchen />
      </Sequence>

      {/* Act 6: Campus AI Copilot (Frames 750 - 910) */}
      <Sequence from={750} durationInFrames={160} name="6. Campus AI Copilot">
        <Scene6AICopilot />
      </Sequence>

      {/* Act 7: Grand Keynote Finale & CTA (Frames 910 - 1080) */}
      <Sequence from={910} durationInFrames={170} name="7. Keynote Finale">
        <Scene7Outro />
      </Sequence>
    </div>
  );
};
