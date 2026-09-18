'use client';

import React, { useState } from 'react';
import { Check, Clapperboard, Copy, Monitor, Smartphone } from 'lucide-react';
import { Player } from '@remotion/player';
import { DormosaurAppleLaunch } from '@/remotion/compositions/DormosaurAppleLaunch';
import { DormosaurAppleShort } from '@/remotion/compositions/DormosaurAppleShort';

export default function VideoPage() {
  const [selectedFormat, setSelectedFormat] = useState<'landscape' | 'vertical'>('landscape');
  const [copied, setCopied] = useState(false);

  const renderCommand =
    selectedFormat === 'landscape'
      ? 'npm run video:render'
      : 'npm run video:render-vertical';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(renderCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 max-w-7xl mx-auto flex flex-col items-center">
      {/* Header with Apple styling */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3">
          <Clapperboard className="size-4" aria-hidden="true" /> Remotion Motion Graphics Studio
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
          Dormosaur <span className="text-emerald-400">Apple Launch</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm sm:text-base mx-auto">
          High-precision 60fps programmatic motion graphics powered by React, Remotion, and Apple design aesthetics.
        </p>
      </div>

      {/* Format Switcher */}
      <div className="flex w-full max-w-4xl flex-col items-stretch gap-2 bg-neutral-900/90 p-1.5 rounded-2xl border border-white/10 mb-6 backdrop-blur-md sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setSelectedFormat('landscape')}
          aria-pressed={selectedFormat === 'landscape'}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-[color,background-color,box-shadow] ${
            selectedFormat === 'landscape'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor className="size-4" aria-hidden="true" /> 16:9 Keynote Showcase (1920x1080)
        </button>
        <button
          type="button"
          onClick={() => setSelectedFormat('vertical')}
          aria-pressed={selectedFormat === 'vertical'}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-[color,background-color,box-shadow] ${
            selectedFormat === 'vertical'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="size-4" aria-hidden="true" /> 9:16 Shorts / Reels (1080x1920)
        </button>
      </div>

      {/* Main Interactive Remotion Player Container */}
      <div className="w-full flex justify-center mb-8">
        <div
          className={`relative rounded-3xl overflow-hidden border border-white/15 bg-neutral-950 shadow-2xl shadow-emerald-950/40 ${
            selectedFormat === 'landscape' ? 'w-full max-w-4xl aspect-video' : 'w-full max-w-[360px] aspect-[9/16]'
          }`}
        >
          {selectedFormat === 'landscape' ? (
            <Player
              component={DormosaurAppleLaunch}
              durationInFrames={1080}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={60}
              style={{
                width: '100%',
                height: '100%',
              }}
              controls
              loop
            />
          ) : (
            <Player
              component={DormosaurAppleShort}
              durationInFrames={600}
              compositionWidth={1080}
              compositionHeight={1920}
              fps={60}
              style={{
                width: '100%',
                height: '100%',
              }}
              controls
              loop
            />
          )}
        </div>
      </div>

      {/* Render Command & Quick Actions Bar */}
      <div className="w-full max-w-4xl bg-neutral-900/80 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-xl mb-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-1">
              Export to 4K / 1080p MP4 via CLI
            </div>
            <code className="inline-block max-w-full overflow-x-auto rounded-lg border border-white/5 bg-black/60 px-3 py-1.5 text-xs text-slate-300 sm:text-sm">
              {renderCommand}
            </code>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={copyToClipboard}
              className="flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs sm:text-sm font-medium transition-colors"
            >
              {copied ? <><Check className="size-4" aria-hidden="true" /> Copied</> : <><Copy className="size-4" aria-hidden="true" /> Copy Command</>}
            </button>
            <div aria-live="polite" className="sr-only">{copied ? 'Render command copied.' : ''}</div>
            <div className="text-xs text-slate-500 font-mono">
              60 FPS • ProRes / H.264
            </div>
          </div>
        </div>

        {/* Scene Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5">
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Act 1-2</div>
            <div className="text-xs font-bold text-white mt-1">Campus Chaos Hook & Mascot Reveal</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Act 3</div>
            <div className="text-xs font-bold text-white mt-1">Instant Schedule Parser & Grid</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Act 4-5</div>
            <div className="text-xs font-bold text-white mt-1">Dynamic Island Transit & Micro-Kitchen</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Act 6-7</div>
            <div className="text-xs font-bold text-white mt-1">AI Copilot & Keynote Finale Lockup</div>
          </div>
        </div>
      </div>
    </div>
  );
}
