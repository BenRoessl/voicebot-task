import * as cheerio from "cheerio";

// Obvious non-content elements that should never be part of the text extraction
const BLOCK_SELECTORS = [
  "script",
  "style",
  "noscript",
  "template",
  "iframe",
  "svg",
  "canvas",
  "video",
  "audio",
  "source",
  "track",
];

function looksLikeCode(line: string): boolean {
  const l = line.trim();
  if (!l) {
    return false;
  }

  const codePatterns =
    /[{<>}=();]|function\s*\(|=>|const\s+|let\s+|var\s+|return\s+|new\s+URL|querySelector|document\./i;
  const base64ish = /[A-Za-z0-9+/]{60,}={0,2}/;

  return codePatterns.test(l) || base64ish.test(l);
}

function looksLikeCookieOrConsent(line: string): boolean {
  return /(cookie|cookies|consent|einwilligung|gdpr|recaptcha)/i.test(line);
}

export function normalizeText(txt: string): string {
  return txt
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Basic HTML cleanup before extraction
export function sanitizeHtml(html: string): cheerio.CheerioAPI {
  const $ = cheerio.load(html);

  for (const sel of BLOCK_SELECTORS) $(sel).remove();

  $(
    "[hidden], [aria-hidden='true'], [style*='display:none'], [style*='visibility:hidden']"
  ).remove();

  return $;
}

// Whitelist-based extraction of human-readable content text
export function extractReadableText($: cheerio.CheerioAPI): string[] {
  const buckets: string[] = [];

  const roots =
    $("main, article, [role='main']").length > 0 ? $("main, article, [role='main']") : $("body");

  const CONTENT_SELECTORS = "h1, h2, h3, h4, p, li, a";

  roots.find(CONTENT_SELECTORS).each((_i, el) => {
    const raw = $(el).text();
    const line = normalizeText(raw);
    if (!line) return;
    if (line.length < 3) return;
    if (line.length > 1200) return;
    if (looksLikeCode(line)) return;
    if (looksLikeCookieOrConsent(line)) return;

    if (el.tagName.toLowerCase() === "a") {
      const short = line.toLowerCase();
      if (short.length < 8) return;
      if (/^(mehr|mehr erfahren|weiter|jetzt kaufen|details)$/i.test(line)) return;
    }

    buckets.push(line);
  });

  const seen = new Set<string>();
  const unique = buckets.filter((l) => {
    const key = l.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
}
