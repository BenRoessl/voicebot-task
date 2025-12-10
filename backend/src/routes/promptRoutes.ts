import { Router } from "express";
import { KnowledgeBase } from "../types/knowledgeBase";
import { buildSystemPrompt } from "../services/promptService";

export const promptRouter = Router();

promptRouter.post("/", async (req, res) => {
  const { knowledgeBase } = req.body as { knowledgeBase?: KnowledgeBase };

  if (!knowledgeBase) {
    return res.status(400).json({ error: "Missing 'knowledgeBase' in request body." });
  }

  try {
    const result = buildSystemPrompt(knowledgeBase);

    return res.json({
      prompt: result.prompt,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to build system prompt.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
