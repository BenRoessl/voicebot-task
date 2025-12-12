import type { CrawledPage } from "./crawlerService";
import { sanitizeHtml, extractReadableText, normalizeText } from "../utils/textSanitizer";

export interface ContactInfo {
  nameOrCompany?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface ServiceEntry {
  name: string;
  description?: string;
}

export interface ExtractionPageSummary {
  url: string;
  title?: string;
  preview?: string;
  fullText?: string;
}

export interface ExtractionResult {
  pages: ExtractionPageSummary[];
  contact: ContactInfo | null;
  openingHours: [];
  services: ServiceEntry[];
}

// Public API used by crawlRoutes
export function extractFromCrawledPages(pages: CrawledPage[]): ExtractionResult {
  const structured = extractStructuredFromPages(pages);
  const { pageSummaries } = extractRawTextFromPages(pages);

  return {
    pages: pageSummaries,
    contact: structured.contact,
    openingHours: [],
    services: structured.services,
  };
}

// ----------------- structured extraction -----------------

interface StructuredAggregation {
  contact: ContactInfo | null;
  services: ServiceEntry[];
}

function looksLikeCompanyName(candidate: string): boolean {
  const value = candidate.trim();
  const lower = value.toLowerCase();

  if (value.length < 3 || value.length > 80) return false;

  const forbiddenExact = [
    "unsere bestseller",
    "bestseller",
    "kontakt",
    "impressum",
    "jobs",
    "karriere",
    "newsletter",
    "standorte",
    "standort",
    "faq",
    "häufige fragen",
    "impressum & datenschutz",
    "datenschutz",
    "nutzungsbedingungen",
    "agb",
    "rechtliche hinweise",
  ];

  if (forbiddenExact.includes(lower)) return false;

  return true;
}

function extractEmailFromText(text: string): string | undefined {
  const tokens = text.split(/\s+/);
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  for (const token of tokens) {
    const cleaned = token.replace(/[(),;:<>"]+/g, "");
    if (emailRegex.test(cleaned)) {
      return cleaned;
    }
  }

  return undefined;
}

function extractPhoneFromText(text: string): string | undefined {
  const candidates = text.match(/\+?[0-9][0-9\s\/()-]{5,}/g);
  if (!candidates) return undefined;

  for (const raw of candidates) {
    const clean = raw.trim();

    if (/^\d{4,6}$/.test(clean)) continue;
    if (/\d\.\d/.test(clean)) continue;

    const looksLikePhone =
      /^(\+|00)?\d{2,3}/.test(clean) ||
      /\d{2,}\s*\/\s*\d{2,}/.test(clean) ||
      /\d{2,}\s*-\s*\d{2,}/.test(clean) ||
      /\(\d{2,}\)/.test(clean);

    if (!looksLikePhone) continue;

    const digitCount = clean.replace(/\D/g, "").length;
    if (digitCount < 6) continue;

    return clean;
  }

  return undefined;
}

function looksLikeServiceName(line: string): boolean {
  if (!line) return false;
  if (line.length < 4 || line.length > 80) return false;
  if (/\b\d{1,2}:\d{2}\b/.test(line)) return false;
  if (/^(kontakt|impressum|datenschutz|sprechzeiten|öffnungszeiten)$/i.test(line)) return false;
  if (/^(start|home|menü|navigation)$/i.test(line)) return false;
  if (/https?:\/\//i.test(line)) return false;
  if (/(datenschutz|impressum|kontakt|startseite|tel\.|fax|©)/i.test(line)) return false;

  const wordCount = line.split(/\s+/).filter(Boolean).length;
  if (wordCount > 6) return false;

  return true;
}

function extractServicesFromLines(lines: string[]): ServiceEntry[] {
  const services: ServiceEntry[] = [];
  const seen = new Set<string>();

  const normalized = lines.map((l) => normalizeText(l)).filter(Boolean);

  const anchorIndex = normalized.findIndex((l) => /\bunsere leistungen\b/i.test(l));
  if (anchorIndex === -1) return services;

  for (let i = anchorIndex + 1; i < Math.min(anchorIndex + 120, normalized.length); i++) {
    const name = normalizeText(normalized[i]);
    if (!looksLikeServiceName(name)) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const next = normalized[i + 1] ? normalizeText(normalized[i + 1]) : "";
    const description =
      next && next.length > 25 && next.length < 220 && !looksLikeServiceName(next)
        ? next
        : undefined;

    services.push({ name, description });
  }

  return services;
}

function extractStructuredFromPages(pages: CrawledPage[]): StructuredAggregation {
  const aggregatedContact: ContactInfo = {};
  const services: ServiceEntry[] = [];
  const servicesSeen = new Set<string>();

  for (const page of pages) {
    const sanitizedHtml = sanitizeHtml(page.html);
    const bodyText = sanitizedHtml("body").text();

    const readableLines = extractReadableText(sanitizedHtml)
      .map((l) => l.trim())
      .filter(Boolean);

    const normalizedLines = bodyText
      .split("\n")
      .map((l) => normalizeText(l))
      .filter(Boolean);

    // E-mail: prefer mailto links, fallback to regex
    if (!aggregatedContact.email) {
      const mailHref = sanitizedHtml("a[href^='mailto:']").first().attr("href");
      if (mailHref) {
        const value = mailHref.replace(/^mailto:/i, "").trim();
        aggregatedContact.email = value || undefined;
      }

      if (!aggregatedContact.email) {
        const emailFromBody = extractEmailFromText(bodyText);
        if (emailFromBody) aggregatedContact.email = emailFromBody;
      }
    }

    // Phone: prefer tel links, fallback to loose pattern, but ignore garbage like "0"
    if (!aggregatedContact.phone) {
      const telHref = sanitizedHtml("a[href^='tel:']").first().attr("href");
      if (telHref) {
        const raw = telHref.replace(/^tel:/i, "").trim();
        const digits = raw.replace(/[^\d+]/g, "");
        if (digits.length >= 5) {
          aggregatedContact.phone = raw;
        }
      }

      if (!aggregatedContact.phone) {
        const phoneFromBody = extractPhoneFromText(bodyText);
        if (phoneFromBody) aggregatedContact.phone = phoneFromBody;
      }
    }

    // Website: if nothing found yet, use first absolute link
    if (!aggregatedContact.website) {
      const sameHostLink = sanitizedHtml("a[href]")
        .map((_i, el) => sanitizedHtml(el).attr("href"))
        .get()
        .find((href) => href && href.startsWith("http"));
      if (sameHostLink) {
        aggregatedContact.website = sameHostLink;
      }
    }

    // Very simple address heuristic: line with 5-digit postal code
    if (
      !aggregatedContact.streetAddress ||
      !aggregatedContact.city ||
      !aggregatedContact.postalCode
    ) {
      for (let i = 0; i < normalizedLines.length; i++) {
        const line = normalizedLines[i];
        const zipMatch = line.match(/\b\d{5}\b/);
        if (!zipMatch) continue;
        if (line.length > 120) continue;

        const zip = zipMatch[0];
        aggregatedContact.postalCode = zip;

        const afterZip = line.slice(line.indexOf(zip) + zip.length).trim();
        const cityPart = afterZip.split(",")[0].trim();
        if (cityPart) {
          aggregatedContact.city = cityPart;
        }

        for (let j = i - 1; j >= 0; j--) {
          const prev = normalizedLines[j];
          if (!prev) continue;
          if (/impressum|nutzungsbedingungen|agb/i.test(prev)) continue;
          if (prev.length < 5 || prev.length > 120) continue;

          aggregatedContact.streetAddress = prev;
          break;
        }

        break;
      }
    }

    if (!aggregatedContact.nameOrCompany) {
      const candidate = sanitizedHtml("h1, h2")
        .map((_i, el) => sanitizedHtml(el).text())
        .get()
        .map((t) => normalizeText(t))
        .find((t) => looksLikeCompanyName(t));

      if (candidate) {
        aggregatedContact.nameOrCompany = candidate;
      }
    }

    // Services (always attempt per page)
    const pageServices = extractServicesFromLines(readableLines);
    for (const s of pageServices) {
      const key = s.name.toLowerCase();
      if (servicesSeen.has(key)) continue;
      servicesSeen.add(key);
      services.push(s);
    }
  }

  const contact = Object.values(aggregatedContact).some((v) => !!v) ? aggregatedContact : null;

  return {
    contact,
    services,
  };
}

// ----------------- unstructured text extraction -----------------

interface RawTextResult {
  pageSummaries: ExtractionPageSummary[];
}

function extractRawTextFromPages(pages: CrawledPage[]): RawTextResult {
  const pageSummaries: ExtractionPageSummary[] = [];

  for (const page of pages) {
    const $ = sanitizeHtml(page.html);
    const lines = extractReadableText($);

    if (lines.length === 0) continue;

    const title = normalizeText($("title").first().text() || "");

    let previewStartIndex = lines.findIndex((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed.length < 20) return false;
      if (/[.!?]/.test(trimmed)) return true;
      return trimmed.length > 40;
    });

    if (previewStartIndex === -1) {
      previewStartIndex = 0;
    }

    const previewLines = lines.slice(previewStartIndex, previewStartIndex + 6);
    let preview = previewLines.join(" ");
    preview = preview.replace(/\s+/g, " ").trim();

    const fullTextLines = lines.slice(previewStartIndex);

    let fullText = fullTextLines.join(" ");
    fullText = fullText.replace(/\s+/g, " ").trim();

    pageSummaries.push({
      url: page.url,
      title: title || undefined,
      preview,
      fullText,
    });
  }

  return {
    pageSummaries,
  };
}
