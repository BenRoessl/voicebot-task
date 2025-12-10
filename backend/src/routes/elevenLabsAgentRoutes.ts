import { Router } from "express";
import fs from "fs/promises";
import { uploadKnowledgeBaseFile } from "../services/elevenLabsKnowledgeService";
import { convertKnowledgeJsonToTxt } from "../services/knowledgeBaseConvertService";
import { createAgentWithSDK } from "../services/elevenLabsService";

export const elevenLabsAgentRouter = Router();

interface CreateAgentRequestBody {
  name?: string;
  prompt?: string;
  knowledgeBaseTempFilePath?: string; // → das ist der JSON-Pfad
}

elevenLabsAgentRouter.post("/", async (req, res) => {
  const { name, prompt, knowledgeBaseTempFilePath } = req.body as CreateAgentRequestBody;

  if (!name || !prompt || !knowledgeBaseTempFilePath) {
    return res.status(400).json({
      error: "Missing fields. Required: name, prompt, knowledgeBaseTempFilePath",
    });
  }

  try {
    // 1) JSON → TXT umwandeln
    const { txtPath } = await convertKnowledgeJsonToTxt(knowledgeBaseTempFilePath);

    // Name für das Dokument bei ElevenLabs
    const safeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    const kbFileName = `kb-${safeName}.txt`;

    // 2) TXT zu ElevenLabs hochladen
    const kbEntry = await uploadKnowledgeBaseFile(txtPath, kbFileName);

    // 3) Agent erstellen
    const agent = await createAgentWithSDK(name, prompt, [kbEntry]);

    // 4) TXT-Datei optional löschen – später aktivieren
    /*
    try {
      await fs.rm(txtPath);
    } catch (err) {
      console.error("Failed to delete temp TXT:", err);
    }
    */

    return res.status(201).json({
      agent,
      knowledgeBase: [kbEntry],
    });
  } catch (error) {
    console.error("Failed to create ElevenLabs agent:", error);
    return res.status(500).json({
      error: "Failed to create agent",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
