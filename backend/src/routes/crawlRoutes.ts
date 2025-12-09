import { Router } from "express";
import { crawlSite, type CrawledPage, type CrawlError } from "../services/crawlerService";
import { extractFromCrawledPages } from "../services/extractionService";
import { buildKnowledgeBase } from "../services/knowledgeBaseService";
import { crawlUsingSitemap } from "../services/sitemapService";

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
  const depth = maxDepth ?? 2;
  const pagesLimit = maxPages ?? 25;

  try {
    const sitemapResult = await crawlUsingSitemap(normalizedInputUrl, {
      maxDepth: depth,
      maxPages: pagesLimit,
    });

    const htmlResult = await crawlSite(normalizedInputUrl, {
      maxDepth: depth,
      maxPages: pagesLimit,
    });

    const { pages: mergedPages, errors: mergedErrors } = mergeCrawlResults(
      sitemapResult.pages,
      htmlResult.pages,
      sitemapResult.errors,
      htmlResult.errors,
      pagesLimit
    );

    const extractions = extractFromCrawledPages(mergedPages);
    const knowledgeBase = buildKnowledgeBase(normalizedInputUrl, extractions);

    return res.json({
      knowledgeBase,
      crawlErrors: mergedErrors,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to crawl site.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

function mergeCrawlResults(
  sitemapPages: CrawledPage[],
  htmlPages: CrawledPage[],
  sitemapErrors: CrawlError[],
  htmlErrors: CrawlError[],
  pagesLimit: number
): { pages: CrawledPage[]; errors: CrawlError[] } {
  const mergedErrors: CrawlError[] = [...sitemapErrors, ...htmlErrors];

  const pages: CrawledPage[] = [];
  const seen = new Set<string>();

  for (const page of [...sitemapPages, ...htmlPages]) {
    if (pages.length >= pagesLimit) break;
    if (seen.has(page.url)) continue;

    seen.add(page.url);
    pages.push(page);
  }

  return { pages, errors: mergedErrors };
}

// Accepts bare domains by defaulting to https when no protocol is present.
function ensureProtocol(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
