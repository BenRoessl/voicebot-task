import * as cheerio from "cheerio";
import { fetchHtml } from "../utils/htmlFetcher";
import { isUrlTooDeep } from "../utils/urlUtils";

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
  maxDepth: 2,
  maxPages: 25,
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

      if (depth < finalOptions.maxDepth) {
        const links = extractLinks(html, url, finalOptions.maxDepth);

        for (const link of links) {
          if (!isSameHost(link, originHost)) continue;

          const normalized = normalizeUrl(link);

          if (!visited.has(normalized)) {
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
function extractLinks(html: string, baseUrl: string, maxDepth: number): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $("a[href]").each((_idx, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const trimmed = href.trim();
    if (trimmed.startsWith("#") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
      return;
    }

    try {
      const absolute = new URL(trimmed, baseUrl);

      if (absolute.protocol !== "http:" && absolute.protocol !== "https:") return;

      const urlWithoutHash = absolute.toString().split("#")[0];

      if (isUrlTooDeep(urlWithoutHash, maxDepth)) {
        return;
      }

      if (isLikelyFile(urlWithoutHash)) return;

      links.add(urlWithoutHash);
    } catch {
      return;
    }
  });

  return Array.from(links);
}

function isSameHost(url: string, host: string): boolean {
  try {
    return new URL(url).host === host;
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    parsed.hash = "";

    parsed.hostname = parsed.hostname.toLowerCase();

    let pathname = parsed.pathname || "/";
    if (pathname !== "/" && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    parsed.pathname = pathname;

    parsed.searchParams.sort();

    return parsed.toString();
  } catch {
    return url;
  }
}

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
