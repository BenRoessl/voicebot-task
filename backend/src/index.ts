import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { crawlRouter } from "./routes/crawlRoutes";
import { promptRouter } from "./routes/promptRoutes";
import { agentRouter } from "./routes/agentRoutes";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: false,
  })
);

app.get("/health", (_req, response) => {
  response.json({ status: "ok" });
});

app.use("/api/crawl", crawlRouter);
app.use("/api/prompt", promptRouter);
app.use("/api/agents", agentRouter);

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
