import { Router } from "express";
import fs from "fs/promises";
import { uploadKnowledgeBaseFile } from "../services/elevenLabsKnowledgeService";
import { convertKnowledgeJsonToTxt } from "../services/knowledgeBaseConvertService";
import { createAgentWithSDK } from "../services/elevenLabsService";
import { KnowledgeBase } from "../types/knowledgeBase";
import path from "path";

export const elevenLabsAgentRouter = Router();

interface CreateAgentRequestBody {
  name?: string;
  prompt?: string;
  knowledgeBaseTempFilePath?: string;
  knowledgeBase?: KnowledgeBase;
}

elevenLabsAgentRouter.post("/", async (req, res) => {
  const { name, prompt, knowledgeBaseTempFilePath, knowledgeBase } =
    req.body as CreateAgentRequestBody;

  if (!name || !prompt || !knowledgeBaseTempFilePath) {
    return res.status(400).json({
      error: "Missing fields. Required: name, prompt, knowledgeBaseTempFilePath",
    });
  }

  try {
    // 0) If the user modified the Knowledge Base in the frontend,
    // overwrite the temporary JSON file before converting it to TXT.
    if (knowledgeBase) {
      const { overwriteKnowledgeBaseJsonFile } = await import("../services/knowledgeBaseExporter");

      await overwriteKnowledgeBaseJsonFile(knowledgeBaseTempFilePath, knowledgeBase);
    }

    // 1) Convert JSON → TXT
    const { txtPath } = await convertKnowledgeJsonToTxt(knowledgeBaseTempFilePath);

    // Prepare a safe filename for the uploaded Knowledge Base document
    const safeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    const kbFileName = `kb-${safeName}.txt`;

    // 2) Upload the TXT file to ElevenLabs
    const kbEntry = await uploadKnowledgeBaseFile(txtPath, kbFileName);

    // 3) Create the agent in ElevenLabs using the uploaded Knowledge Base
    const agent = await createAgentWithSDK(name, prompt, [kbEntry]);

    const baseDir = path.join(process.cwd(), "tmp");
    // 4) Optional cleanup: remove the temporary TXT file (disabled for now)
    try {
      await fs.rm(baseDir, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to delete temp TXT:", err);
    }

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
