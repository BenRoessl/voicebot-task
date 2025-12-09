import { Router } from "express";

export const promptRouter = Router();

/**
 * POST /api/prompt
 * Body: { knowledgeBase: any }
 */
promptRouter.post("/", async (req, res) => {
  // TODO: später: promptService.generatePrompt(knowledgeBase)
  return res.status(501).json({
    message: "Prompt endpoint not implemented yet.",
  });
});
