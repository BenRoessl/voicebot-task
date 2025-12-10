import { Router } from "express";
import { CrawledPage, crawlSite } from "../services/crawlerService";
import { crawlUsingSitemap } from "../services/sitemapService";
import { extractFromCrawledPages } from "../services/extractionService";
import { buildKnowledgeBase } from "../services/knowledgeBaseService";
import { writeKnowledgeBaseJsonFile } from "../services/knowledgeBaseExporter";

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
    // Run sitemap and HTML crawl; HTML crawl ensures coverage if sitemap is incomplete.
    const [sitemapResult, htmlResult] = await Promise.all([
      crawlUsingSitemap(normalizedInputUrl, {
        maxDepth: depth,
        maxPages: pagesLimit,
      }),
      crawlSite(normalizedInputUrl, {
        maxDepth: depth,
        maxPages: pagesLimit,
      }),
    ]);

    const mergedPages = mergeCrawlPages(sitemapResult.pages, htmlResult.pages, pagesLimit);

    const mergedErrors = [...sitemapResult.errors, ...htmlResult.errors];

    if (mergedPages.length === 0) {
      return res.status(502).json({
        error: "No pages could be crawled.",
        crawlErrors: mergedErrors,
      });
    }

    const extraction = extractFromCrawledPages(mergedPages);
    const knowledgeBase = buildKnowledgeBase(normalizedInputUrl, extraction);

    // NEW: JSON speichern
    const knowledgeBaseJsonFilePath = await writeKnowledgeBaseJsonFile(knowledgeBase);

    return res.json({
      knowledgeBase,
      knowledgeBaseJsonFilePath,
      crawlErrors: mergedErrors,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to crawl site.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

function ensureProtocol(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function mergeCrawlPages(
  sitemapPages: CrawledPage[],
  htmlPages: CrawledPage[],
  maxPages: number
): CrawledPage[] {
  const byUrl = new Map<string, CrawledPage>();

  const all = [...sitemapPages, ...htmlPages];

  for (const page of all) {
    const key = normalizeUrlForKey(page.url);
    if (!byUrl.has(key)) {
      byUrl.set(key, page);
    }
  }

  return Array.from(byUrl.values()).slice(0, maxPages);
}

function normalizeUrlForKey(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";

    let pathname = u.pathname || "/";
    if (pathname !== "/" && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    u.pathname = pathname;

    u.searchParams.sort();

    return u.toString();
  } catch {
    return url;
  }
}
