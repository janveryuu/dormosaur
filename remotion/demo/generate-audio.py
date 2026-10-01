"""Create the original, quiet audio bed used by DormosaurDemo.

No samples or copyrighted recordings are used. Run from the repository root with
`python remotion/demo/generate-audio.py` to regenerate the WAV file.
"""

import math
import struct
import wave
from pathlib import Path

RATE = 24000
DURATION = 35
DESTINATION = Path(__file__).resolve().parents[2] / "public" / "audio" / "dormosaur-demo.wav"
DESTINATION.parent.mkdir(parents=True, exist_ok=True)

# Quiet tonal clicks mark the chapter changes. The underlying chord is deliberately
# low in the mix so that later narration can be added without rebuilding the video.
CUES = [0, 3, 8, 13, 18, 22, 26, 31]
CHORD = [164.81, 246.94, 329.63, 493.88]


def sample(t: float) -> float:
    intro = min(1.0, t / 1.6)
    outro = min(1.0, (DURATION - t) / 1.6)
    breath = 0.78 + 0.22 * math.sin(2 * math.pi * 0.075 * t)
    pad = sum(math.sin(2 * math.pi * hz * t + math.sin(t * 0.18) * 0.12) for hz in CHORD) / len(CHORD)
    value = 0.105 * pad * breath * max(0, intro) * max(0, outro)
    for cue in CUES:
        delta = t - cue
        if 0 <= delta < 0.42:
            envelope = (1 - math.exp(-delta * 90)) * math.exp(-delta * 17)
            value += 0.16 * envelope * (
                math.sin(2 * math.pi * 880 * delta)
                + 0.33 * math.sin(2 * math.pi * 1320 * delta)
            )
        if 0 <= delta < 0.85 and cue not in (0, 31):
            # A soft descending air-like sweep at each screen change.
            envelope = math.sin(math.pi * delta / 0.85) ** 2
            phase = 2 * math.pi * (420 * delta - 170 * delta * delta)
            value += 0.022 * envelope * math.sin(phase)
    return max(-0.9, min(0.9, value))


with wave.open(str(DESTINATION), "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(RATE)
    block = bytearray()
    for n in range(RATE * DURATION):
        block.extend(struct.pack("<h", int(sample(n / RATE) * 32767)))
        if len(block) >= 16384:
            wav.writeframes(block)
            block.clear()
    if block:
        wav.writeframes(block)

print(DESTINATION)
