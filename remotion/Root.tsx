import React from 'react';
import { Composition } from 'remotion';
import { DormosaurAppleLaunch } from './compositions/DormosaurAppleLaunch';
import { DormosaurAppleShort } from './compositions/DormosaurAppleShort';
import { DormosaurDemo } from './demo/DormosaurDemo';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="DormosaurDemo"
        component={DormosaurDemo}
        durationInFrames={2100}
        fps={60}
        width={1920}
        height={1080}
      />
      {/* Flagship Apple Keynote Showcase (16:9 Landscape) */}
      <Composition
        id="DormosaurAppleLaunch"
        component={DormosaurAppleLaunch}
        durationInFrames={1080}
        fps={60}
        width={1920}
        height={1080}
      />

      {/* Vertical Mobile Showcase (9:16 Shorts / Reels / TikTok) */}
      <Composition
        id="DormosaurAppleShort"
        component={DormosaurAppleShort}
        durationInFrames={600}
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};
