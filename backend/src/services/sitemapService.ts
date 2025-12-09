import { fetchHtml } from "../utils/htmlFetcher";
import { logger } from "../utils/logger";
import { CrawlOptions, CrawlResult, CrawledPage, CrawlError } from "./crawlerService";
import { isUrlTooDeep } from "../utils/urlUtils";

const defaultOptions: CrawlOptions = {
  maxDepth: 2,
  maxPages: 25,
};

export async function crawlUsingSitemap(
  startUrl: string,
  options: Partial<CrawlOptions> = {}
): Promise<CrawlResult> {
  const finalOptions: CrawlOptions = { ...defaultOptions, ...options };

  try {
    const origin = new URL(startUrl).origin;
    const sitemapUrls = await loadSitemapUrls(origin, finalOptions.maxPages, finalOptions.maxDepth);

    if (sitemapUrls.length === 0) {
      return { pages: [], errors: [] };
    }

    const pages: CrawledPage[] = [];
    const errors: CrawlError[] = [];

    for (const url of sitemapUrls.slice(0, finalOptions.maxPages)) {
      try {
        const html = await fetchHtml(url);
        pages.push({
          url,
          depth: 0,
          html,
        });
      } catch (error) {
        errors.push({
          url,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { pages, errors };
  } catch (error) {
    logger.warn("Failed to use sitemap for crawling.", error);
    return { pages: [], errors: [] };
  }
}

async function loadSitemapUrls(
  origin: string,
  maxPages: number,
  maxDepth: number
): Promise<string[]> {
  const sitemapCandidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
  ];

  const visited = new Set<string>();

  for (const sm of sitemapCandidates) {
    try {
      const xml = await fetchHtml(sm);
      const urls = await parseSitemapRecursive(xml, origin, visited, maxPages, maxDepth);

      if (urls.length > 0) {
        return Array.from(new Set(urls)).slice(0, maxPages);
      }
    } catch {
      continue;
    }
  }

  return [];
}

async function parseSitemapRecursive(
  xml: string,
  origin: string,
  visited: Set<string>,
  maxPages: number,
  maxDepth: number
): Promise<string[]> {
  const locRegex = /<loc>([^<]+)<\/loc>/gi;
  const urls: string[] = [];

  let match: RegExpExecArray | null;

  while ((match = locRegex.exec(xml)) !== null) {
    if (urls.length >= maxPages) break;

    const rawLoc = match[1].trim();
    if (!rawLoc) continue;

    try {
      const locUrlObj = new URL(rawLoc, origin);

      if (!sameHost(locUrlObj, origin)) continue;

      const normalizedUrl = normalizeSitemapUrl(locUrlObj);

      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);

      if (locUrlObj.pathname.toLowerCase().endsWith(".xml")) {
        const childXml = await fetchHtml(normalizedUrl);
        const childUrls = await parseSitemapRecursive(
          childXml,
          origin,
          visited,
          maxPages,
          maxDepth
        );

        for (const u of childUrls) {
          if (urls.length >= maxPages) break;
          urls.push(u);
        }

        continue;
      }

      if (isUrlTooDeep(normalizedUrl, maxDepth)) continue;
      if (isLikelyFile(normalizedUrl)) continue;

      urls.push(normalizedUrl);
    } catch {
      continue;
    }
  }

  return urls;
}

function sameHost(url: URL, origin: string): boolean {
  try {
    const originUrl = new URL(origin);
    return url.host === originUrl.host;
  } catch {
    return false;
  }
}

function normalizeSitemapUrl(url: URL): string {
  url.hash = "";

  let pathname = url.pathname || "/";
  if (pathname !== "/" && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  url.pathname = pathname;
  url.searchParams.sort();

  return url.toString();
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
    lower.endsWith(".mp3") ||
    lower.endsWith(".kml")
  );
}
