import fs from "fs/promises";
import path from "path";
import type { KnowledgeBase } from "../types/knowledgeBase";

// Converts JSON KB into a readable plain text format
export function knowledgeBaseToPlainText(kb: KnowledgeBase): string {
  const lines: string[] = [];

  // General metadata
  lines.push(`# Knowledge Base`);
  lines.push(`Source URL: ${kb.sourceUrl}`);
  lines.push(`Generated at: ${kb.generatedAt}`);
  lines.push("");

  // Contact info
  if (kb.contact) {
    lines.push("## Kontakt");
    if (kb.contact.nameOrCompany) lines.push(`Firma: ${kb.contact.nameOrCompany}`);
    if (kb.contact.streetAddress) lines.push(`Adresse: ${kb.contact.streetAddress}`);
    if (kb.contact.postalCode && kb.contact.city)
      lines.push(`Stadt: ${kb.contact.postalCode} ${kb.contact.city}`);
    if (kb.contact.phone) lines.push(`Telefon: ${kb.contact.phone}`);
    if (kb.contact.email) lines.push(`E-Mail: ${kb.contact.email}`);
    if (kb.contact.website) lines.push(`Website: ${kb.contact.website}`);
    lines.push("");
  }

  // Opening hours
  if (kb.openingHours && kb.openingHours.length > 0) {
    lines.push("## Öffnungszeiten");
    kb.openingHours.forEach((oh) => {
      lines.push(`${oh.day}: ${oh.opens || "?"} - ${oh.closes || "?"}`);
    });
    lines.push("");
  }

  // Services
  if (kb.services && kb.services.length > 0) {
    lines.push("## Leistungen");
    kb.services.forEach((s) => {
      lines.push(`- ${s.name}${s.description ? `: ${s.description}` : ""}`);
    });
    lines.push("");
  }

  // Pages with sections
  lines.push("## Seiten");
  kb.pages.forEach((page, index) => {
    lines.push("");
    lines.push(`### Seite ${index + 1}: ${page.title ?? page.url}`);
    lines.push(`URL: ${page.url}`);
    lines.push(`Typ: ${page.type}`);
    lines.push("");

    page.sections.forEach((section, i) => {
      lines.push(`--- Abschnitt ${i + 1} ---`);
      if (section.heading) lines.push(`Überschrift: ${section.heading}`);
      lines.push(section.content);
      lines.push("");
    });
  });

  // Optional raw text
  if (kb.rawTextConcat) {
    lines.push("## Rohtext (Concat)");
    lines.push(kb.rawTextConcat);
  }

  return lines.join("\n");
}

// Writes the KB plaintext to a temp file and returns the file path
export async function writeKnowledgeBaseTempFile(kb: KnowledgeBase): Promise<string> {
  const txt = knowledgeBaseToPlainText(kb);

  // Base directory inside your backend project
  const baseDir = path.join(process.cwd(), "tmp", "knowledge-base");

  // Ensure directory exists
  await fs.mkdir(baseDir, { recursive: true });

  const filename = `kb-${Date.now()}.txt`;
  const filePath = path.join(baseDir, filename);

  await fs.writeFile(filePath, txt, "utf8");

  return filePath;
}

// write KnowledgeBase as JSON file into project folder
export async function writeKnowledgeBaseJsonFile(kb: KnowledgeBase): Promise<string> {
  const baseDir = path.join(process.cwd(), "tmp", "knowledge-base-json");

  // Ensure directory exists
  await fs.mkdir(baseDir, { recursive: true });

  const filename = `kb-${Date.now()}.json`;
  const filePath = path.join(baseDir, filename);

  await fs.writeFile(filePath, JSON.stringify(kb, null, 2), "utf8");
  return filePath;
}
