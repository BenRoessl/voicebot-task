import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { crawlRouter } from "./routes/crawlRoutes";
import { promptRouter } from "./routes/promptRoutes";
import { elevenLabsAgentRouter } from "./routes/elevenLabsAgentRoutes";

const app = express();

// Allow larger JSON payloads for knowledge base + prompt building
app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  cors({
    origin: env.corsOrigin || true,
    credentials: false,
  })
);

app.get("/health", (_req, response) => {
  response.json({ status: "ok" });
});

app.use("/api/crawl", crawlRouter);
app.use("/api/prompt", promptRouter);
app.use("/api/agents", elevenLabsAgentRouter);

app.use((_req, response) => {
  response.status(404).json({ error: "Not found" });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    response: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error("Unhandled error in Express middleware.", error);
    response.status(500).json({ error: "Internal server error" });
  }
);

app.listen(env.port, () => {
  logger.info(`Backend listening on port ${env.port}`);
});
