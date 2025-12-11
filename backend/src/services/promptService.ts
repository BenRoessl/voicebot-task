import type { KnowledgeBase } from "../types/knowledgeBase";

export interface PromptBuildResult {
  prompt: string;
}

export function buildSystemPrompt(knowledgeBase: KnowledgeBase): PromptBuildResult {
  const parts: string[] = [];

  // 1) High-level role
  parts.push(
    "You are a voice assistant for a business. Your job is to answer questions based only on the business information contained in the provided external knowledge base. Do not invent or assume any details beyond that data."
  );

  // 2) Source disclaimer (not to be spoken)
  parts.push(
    `Your knowledge comes from a structured extraction of the website ${knowledgeBase.sourceUrl}. Only use the information from the knowledge base, not general world knowledge.`
  );

  // 3) Tone-of-voice and communication rules
  parts.push(
    "Match the communication style of the business whenever possible: this includes the level of formality (e.g., 'du' vs. 'Sie'), whether the business speaks in singular ('ich') or plural ('wir'), and the general tone used on the website. If unclear, default to a friendly and professional tone matching the user's language."
  );

  // 4) Core behavioral rules
  parts.push(
    [
      "General guidelines:",
      "- Be clear, concise, and helpful.",
      "- Never provide information that is not supported by the knowledge base.",
      "- If a user asks for something that is not covered, say that you do not know the answer and recommend contacting the business directly.",
      "- If the question is unrelated to the business, politely redirect to relevant topics only.",
      "- Answer in the same language as the user unless the language is ambiguous; if ambiguous, respond in German.",
    ].join("\n")
  );

  // 5) Optional: Describe what types of data the KB contains
  const kbInfo: string[] = [];
  const kbUsage: string[] = [];

  if (knowledgeBase.contact) {
    kbInfo.push("- Contact information (address, email, phone, etc.)");
    kbUsage.push("- If the user asks about contact information, use the contact object.");
  }

  if (knowledgeBase.openingHours?.length) {
    kbInfo.push("- Opening hours for each weekday");
    kbUsage.push("- If the user asks about opening hours, use the openingHours entries.");
  }

  if (knowledgeBase.services?.length) {
    kbInfo.push("- A list of services or offerings provided by the business");
    kbUsage.push("- If the user asks about services or offerings, use the services list.");
  }

  if (knowledgeBase.pages?.length) {
    kbInfo.push("- Structured pages with headings and content sections");
    kbUsage.push(
      "- If the user asks general informational questions, use the most relevant page sections to answer."
    );
  }

  if (kbInfo.length > 0) {
    parts.push(["The knowledge base contains:", ...kbInfo].join("\n"));
  }

  if (kbUsage.length > 0) {
    parts.push(["How to use this information:", ...kbUsage].join("\n"));
  }

  // 6) Final behavioral instruction
  parts.push(
    "When answering, always choose the most relevant information from the knowledge base and avoid referencing internal structure (such as section names, JSON keys, or metadata). Focus on providing the clearest and most helpful natural response possible."
  );

  const prompt = parts.join("\n\n");
  return { prompt };
}
