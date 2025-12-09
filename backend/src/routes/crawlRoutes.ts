import { Router } from "express";
import { crawlSite } from "../services/crawlerService";
import { extractFromCrawledPages } from "../services/extractionService";
import { buildKnowledgeBase } from "../services/knowledgeBaseService";

export const crawlRouter = Router();

crawlRouter.post("/", async (req, res) => {
  const { url, maxDepth, maxPages } = req.body as {
    url?: string;
    maxDepth?: number;
    maxPages?: number;
  };

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' in request body." });
  }

  const normalizedInputUrl = ensureProtocol(url);

  try {
    const crawlResult = await crawlSite(normalizedInputUrl, {
      maxDepth: maxDepth ?? 2,
      maxPages: maxPages ?? 25,
    });

    const extractions = extractFromCrawledPages(crawlResult.pages);
    const knowledgeBase = buildKnowledgeBase(normalizedInputUrl, extractions);

    return res.json({
      knowledgeBase,
      crawlErrors: crawlResult.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to crawl site.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Accepts bare domains by defaulting to https when no protocol is present.
function ensureProtocol(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
