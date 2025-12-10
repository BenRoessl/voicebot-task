import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { env } from "../config/env";

const client = new ElevenLabsClient({
  apiKey: env.elevenLabsApiKey,
});

export interface AgentKnowledgeBaseEntry {
  id: string;
  type: "file";
  name: string;
}

export async function createAgentWithSDK(
  name: string,
  prompt: string,
  knowledgeBase: AgentKnowledgeBaseEntry[]
) {
  const agent = await client.conversationalAi.agents.create({
    name,
    conversationConfig: {
      agent: {
        firstMessage: "Hallo! Wie kann ich helfen?",
        prompt: {
          prompt,
          llm: "gpt-4-turbo",
          temperature: 0.5,
          knowledgeBase,
        },
      },
    },
  });

  return agent;
}
