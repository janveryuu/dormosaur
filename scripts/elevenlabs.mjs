// Generate voiceovers, music and sound effects for Remotion videos.
// Files land in public/audio/ so compositions can use staticFile("audio/<name>.mp3").
//
//   npm run audio -- voice "Welcome to Dormosaur" intro-vo [voiceId]
//   npm run audio -- music "Upbeat lo-fi, warm synths" bg-loop 30
//   npm run audio -- sfx "Soft UI whoosh" whoosh 2
//
// The key comes from ELEVENLABS_API_KEY in .env.local (loaded via --env-file).
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createWriteStream, mkdirSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const OUT_DIR = path.resolve("public/audio");
const DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb"; // George

const [kind, prompt, name, extra] = process.argv.slice(2);
if (!["voice", "music", "sfx"].includes(kind) || !prompt || !name) {
  console.error('Usage: npm run audio -- <voice|music|sfx> "<text or prompt>" <file-name> [voiceId | seconds]');
  process.exit(1);
}

const client = new ElevenLabsClient();

async function generate() {
  switch (kind) {
    case "voice":
      return client.textToSpeech.convert(extra || DEFAULT_VOICE, {
        text: prompt,
        modelId: "eleven_v4",
      });
    case "music":
      return client.music.compose({
        prompt,
        musicLengthMs: Math.round(Number(extra || 30) * 1000),
        modelId: "music_v2_5",
      });
    case "sfx":
      return client.textToSoundEffects.convert({
        text: prompt,
        modelId: "eleven_text_to_sound_v3",
        ...(extra ? { durationSeconds: Number(extra) } : {}),
      });
  }
}

try {
  const audio = await generate();
  mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${name}.mp3`);
  const source = typeof audio.pipe === "function" ? audio : Readable.fromWeb(audio);
  await pipeline(source, createWriteStream(file));
  console.log(`Saved ${path.relative(process.cwd(), file)}`);
} catch (err) {
  console.error(`Couldn't generate ${kind}: ${err?.message ?? err}`);
  process.exit(1);
}
