import { Router } from "express";

export const agentRouter = Router();

/**
 * POST /api/agents
 * Body: { knowledgeBase: any, prompt: string }
 */
agentRouter.post("/", async (req, res) => {
  // TODO: später: elevenLabsService.createAgent(...)
  return res.status(501).json({
    message: "Agent endpoint not implemented yet.",
  });
});
