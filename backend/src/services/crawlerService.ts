import * as cheerio from "cheerio";
import { fetchHtml } from "../utils/htmlFetcher";

export interface CrawlOptions {
  maxDepth: number;
  maxPages: number;
}

export interface CrawledPage {
  url: string;
  depth: number;
  html: string;
}

export interface CrawlError {
  url: string;
  error: string;
}

export interface CrawlResult {
  pages: CrawledPage[];
  errors: CrawlError[];
}

const defaultOptions: CrawlOptions = {
  maxDepth: 1,
  maxPages: 15,
};

interface QueueItem {
  url: string;
  depth: number;
}

export async function crawlSite(
  startUrl: string,
  options: Partial<CrawlOptions> = {}
): Promise<CrawlResult> {
  const finalOptions: CrawlOptions = { ...defaultOptions, ...options };

  const start = new URL(startUrl);
  const originHost = start.host;

  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  const errors: CrawlError[] = [];

  const queue: QueueItem[] = [{ url: normalizeUrl(start.href), depth: 0 }];

  while (queue.length > 0 && pages.length < finalOptions.maxPages) {
    const current = queue.shift();
    if (!current) break;

    const { url, depth } = current;

    if (visited.has(url)) continue;
    visited.add(url);

    if (depth > finalOptions.maxDepth) continue;

    try {
      const html = await fetchHtml(url);
      pages.push({ url, depth, html });

      // Only expand links on levels below maxDepth
      if (depth < finalOptions.maxDepth) {
        const links = extractLinks(html, url);

        for (const link of links) {
          // Prevent cross-domain crawling
          if (!isSameHost(link, originHost)) continue;

          const normalized = normalizeUrl(link);

          if (!visited.has(normalized)) {
            // BFS queue; ensures predictable crawl order
            queue.push({ url: normalized, depth: depth + 1 });
          }
        }
      }
    } catch (error) {
      errors.push({
        url,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { pages, errors };
}

// Extracts all navigable links from the page. Non-HTML targets are filtered out.
function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $("a[href]").each((_idx, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const trimmed = href.trim();
    if (trimmed.startsWith("#") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:"))
      return;

    try {
      const absolute = new URL(trimmed, baseUrl);

      if (absolute.protocol !== "http:" && absolute.protocol !== "https:") return;

      // Removes fragment identifiers for canonical comparison
      const urlWithoutHash = absolute.toString().split("#")[0];

      // Avoid crawling documents and files
      if (isLikelyFile(urlWithoutHash)) return;

      links.add(urlWithoutHash);
    } catch {
      return;
    }
  });

  return Array.from(links);
}

// Ensures the crawler stays within the same domain
function isSameHost(url: string, host: string): boolean {
  try {
    return new URL(url).host === host;
  } catch {
    return false;
  }
}

// Normalizes URLs for deduplication consistency
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    if (parsed.pathname === "") parsed.pathname = "/";
    return parsed.toString();
  } catch {
    return url;
  }
}

// Basic check to avoid loading binary resources during crawl
function isLikelyFile(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".svg") ||
    lower.endsWith(".zip") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".mp3")
  );
}
