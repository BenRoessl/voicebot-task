import fs from "fs/promises";
import path from "path";

export async function convertKnowledgeJsonToTxt(jsonPath: string) {
  // 1) Read JSON
  const raw = await fs.readFile(jsonPath, "utf-8");
  const data = JSON.parse(raw);

  // 2) Generate TXT content
  let text = "";
  text += `Source URL: ${data.sourceUrl}\n`;
  text += `Generated At: ${data.generatedAt}\n\n`;

  if (data.contact) {
    text += "=== Kontakt ===\n";
    for (const [key, value] of Object.entries(data.contact)) {
      if (value) text += `${key}: ${value}\n`;
    }
    text += "\n";
  }

  if (data.openingHours?.length) {
    text += "=== Öffnungszeiten ===\n";
    for (const oh of data.openingHours) {
      text += `${oh.day} ${oh.opens}-${oh.closes}\n`;
    }
    text += "\n";
  }

  if (data.services?.length) {
    text += "=== Services ===\n";
    for (const s of data.services) {
      text += `• ${s.name}\n`;
      if (s.description) text += `  ${s.description}\n`;
    }
    text += "\n";
  }

  if (data.pages?.length) {
    text += "=== Seiten ===\n\n";
    for (const p of data.pages) {
      text += `# ${p.title || "(Ohne Titel)"}\n`;
      text += `URL: ${p.url}\n`;
      text += `Type: ${p.type}\n\n`;

      if (p.sections?.length) {
        for (const sec of p.sections) {
          text += `## ${sec.heading || "(Abschnitt)"}\n`;
          text += `${sec.content}\n\n`;
        }
      }

      text += "\n";
    }
  }

  // 3) Create TXT file
  const dir = path.dirname(jsonPath);
  const txtPath = path.join(dir, path.basename(jsonPath).replace(".json", ".txt"));

  await fs.writeFile(txtPath, text, "utf-8");

  return { txtPath };
}
