import dotenv from "dotenv";

dotenv.config();

export interface EnvConfig {
  port: number;
  elevenLabsApiKey: string;
  elevenLabsApiBase: string;
  corsOrigin: string | RegExp | (string | RegExp)[];
}

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env: EnvConfig = {
  port: parsePort(process.env.PORT, 4000),
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenLabsApiBase:
    process.env.ELEVENLABS_API_BASE ?? "https://api.elevenlabs.io",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};

if (!env.elevenLabsApiKey) {
  console.error(
    "[env] ELEVENLABS_API_KEY is not set. ElevenLabs calls will fail until you configure it."
  );
}
