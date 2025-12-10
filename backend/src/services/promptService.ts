import type { KnowledgeBase } from "../types/knowledgeBase";

export interface PromptBuildResult {
  prompt: string;
}

export function buildSystemPrompt(knowledgeBase: KnowledgeBase): PromptBuildResult {
  const parts: string[] = [];

  parts.push(
    "You are a voice assistant for a business. Answer questions based only on the provided business information. If something is not covered, say that you do not know the answer and suggest contacting the business directly."
  );

  parts.push(`Source website: ${knowledgeBase.sourceUrl}`);

  if (knowledgeBase.contact) {
    const contactLines: string[] = [];

    if (knowledgeBase.contact.nameOrCompany) {
      contactLines.push(`Name: ${knowledgeBase.contact.nameOrCompany}`);
    }
    if (
      knowledgeBase.contact.streetAddress ||
      knowledgeBase.contact.postalCode ||
      knowledgeBase.contact.city
    ) {
      const addressParts: string[] = [];
      if (knowledgeBase.contact.streetAddress)
        addressParts.push(knowledgeBase.contact.streetAddress);
      if (knowledgeBase.contact.postalCode) addressParts.push(knowledgeBase.contact.postalCode);
      if (knowledgeBase.contact.city) addressParts.push(knowledgeBase.contact.city);
      contactLines.push(`Address: ${addressParts.join(", ")}`);
    }
    if (knowledgeBase.contact.phone) {
      contactLines.push(`Phone: ${knowledgeBase.contact.phone}`);
    }
    if (knowledgeBase.contact.email) {
      contactLines.push(`Email: ${knowledgeBase.contact.email}`);
    }
    if (knowledgeBase.contact.website) {
      contactLines.push(`Website: ${knowledgeBase.contact.website}`);
    }

    if (contactLines.length > 0) {
      parts.push(["Business contact information:", ...contactLines].join("\n"));
    }
  }

  if (knowledgeBase.openingHours && knowledgeBase.openingHours.length > 0) {
    const lines = knowledgeBase.openingHours.map(
      (entry) => `${entry.day}: ${entry.opens} - ${entry.closes}`
    );

    parts.push(["Opening hours:", ...lines].join("\n"));
  }

  if (knowledgeBase.services && knowledgeBase.services.length > 0) {
    const lines = knowledgeBase.services.map((service, index) => {
      if (service.description) {
        return `${index + 1}. ${service.name} - ${service.description}`;
      }
      return `${index + 1}. ${service.name}`;
    });

    parts.push(["Services and products:", ...lines].join("\n"));
  }

  if (knowledgeBase.rawTextConcat) {
    parts.push("Additional business information (unstructured text):");
    parts.push(knowledgeBase.rawTextConcat);
  }

  parts.push("Guidelines:");
  parts.push("- Always be concise and clear.");
  parts.push("- Do not invent details that are not supported by the provided information.");
  parts.push(
    "- If the user asks for something outside the scope of the business, explain that you are focused on this specific business only."
  );

  const prompt = parts.join("\n\n");

  return { prompt };
}
