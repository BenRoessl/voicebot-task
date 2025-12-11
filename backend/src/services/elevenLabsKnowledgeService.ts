import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { env } from "../config/env";
import fs from "fs/promises";

const client = new ElevenLabsClient({
  apiKey: env.elevenLabsApiKey,
});

export async function uploadKnowledgeBaseFile(filePath: string, fileName: string) {
  const buffer = await fs.readFile(filePath);

  const blob = new Blob([buffer], { type: "text/plain" });
  const file = new File([blob], fileName, { type: "text/plain" });

  const response = await client.conversationalAi.knowledgeBase.documents.createFromFile({
    file,
  });

  return {
    id: response.id,
    type: "file" as const,
    name: fileName,
  };
}
