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

  try {
    const crawlResult = await crawlSite(url, {
      maxDepth: maxDepth ?? 1,
      maxPages: maxPages ?? 15,
    });

    const extractions = extractFromCrawledPages(crawlResult.pages);
    const knowledgeBase = buildKnowledgeBase(url, extractions);

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
