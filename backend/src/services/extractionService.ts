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

export interface OpeningHoursEntry {
  day: string;
  opens: string;
  closes: string;
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
  openingHours: OpeningHoursEntry[];
  services: ServiceEntry[];
}

// Public API used by crawlRoutes
export function extractFromCrawledPages(pages: CrawledPage[]): ExtractionResult {
  const structured = extractStructuredFromPages(pages);
  const { pageSummaries } = extractRawTextFromPages(pages);

  return {
    pages: pageSummaries,
    contact: structured.contact,
    openingHours: structured.openingHours,
    services: structured.services,
  };
}

// ----------------- structured extraction -----------------

interface StructuredAggregation {
  contact: ContactInfo | null;
  openingHours: OpeningHoursEntry[];
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

    if (/^\d{4,6}$/.test(clean)) continue; // 2025 / 123456 / 84051 etc.

    if (/\d\.\d/.test(clean)) continue;

    const looksLikePhone =
      /^(\+|00)?\d{2,3}/.test(clean) || // +49..., 0049..., 087...
      /\d{2,}\s*\/\s*\d{2,}/.test(clean) || // 0871/12345
      /\d{2,}\s*-\s*\d{2,}/.test(clean) || // 0871-12345
      /\(\d{2,}\)/.test(clean); // (0871)

    if (!looksLikePhone) continue;

    const digitCount = clean.replace(/\D/g, "").length;
    if (digitCount < 6) continue;

    return clean;
  }

  return undefined;
}

function extractOpeningHoursFromLines(lines: string[]): OpeningHoursEntry[] {
  const result: OpeningHoursEntry[] = [];

  for (const line of lines) {
    // Only reasonably short lines, otherwise it is most likely description text
    if (line.length > 120) continue;

    const hasDay = /(mo|di|mi|do|fr|sa|so|mon|tue|wed|thu|fri|sat|sun)\b/i.test(line);
    const hasTime = /\b\d{1,2}:\d{2}\b/.test(line); // 09:00, 8:30 etc.

    if (!hasDay || !hasTime) continue;

    result.push({
      day: line,
      opens: "",
      closes: "",
    });
  }

  return result;
}

function extractStructuredFromPages(pages: CrawledPage[]): StructuredAggregation {
  const aggregatedContact: ContactInfo = {};
  const openingHours: OpeningHoursEntry[] = [];
  const services: ServiceEntry[] = [];

  for (const page of pages) {
    const $ = sanitizeHtml(page.html);
    const bodyText = $("body").text();

    // E-mail: prefer mailto links, fallback to regex
    if (!aggregatedContact.email) {
      const mailHref = $("a[href^='mailto:']").first().attr("href");
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
      const telHref = $("a[href^='tel:']").first().attr("href");
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

    // Website: if nothing found yet, use first absolute link;
    if (!aggregatedContact.website) {
      const sameHostLink = $("a[href]")
        .map((_i, el) => $(el).attr("href"))
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
      const lines = bodyText
        .split("\n")
        .map((l) => normalizeText(l))
        .filter(Boolean);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const zipMatch = line.match(/\b\d{5}\b/);
        if (!zipMatch) continue;
        if (line.length > 120) continue;

        const zip = zipMatch[0];
        aggregatedContact.postalCode = zip;

        // City: part after ZIP, bis zum nächsten Komma
        const afterZip = line.slice(line.indexOf(zip) + zip.length).trim();
        const cityPart = afterZip.split(",")[0].trim();
        if (cityPart) {
          aggregatedContact.city = cityPart;
        }

        // Street: vorherige sinnvolle Zeile suchen
        for (let j = i - 1; j >= 0; j--) {
          const prev = lines[j];
          if (!prev) continue;
          if (/impressum|nutzungsbedingungen|agb/i.test(prev)) continue;
          if (prev.length < 5 || prev.length > 120) continue;

          aggregatedContact.streetAddress = prev;
          break;
        }

        break;
      }

      // Opening hours (new, more strict)
      const opening = extractOpeningHoursFromLines(lines);
      if (opening.length > 0) {
        openingHours.push(...opening);
      }
    }

    if (!aggregatedContact.nameOrCompany) {
      const candidate = $("h1, h2")
        .map((_i, el) => $(el).text())
        .get()
        .map((t) => normalizeText(t))
        .find((t) => looksLikeCompanyName(t));

      if (candidate) {
        aggregatedContact.nameOrCompany = candidate;
      }
    }
  }

  const contact = Object.values(aggregatedContact).some((v) => !!v) ? aggregatedContact : null;

  return {
    contact,
    openingHours,
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

    // 2) PREVIEW: erster sinnvoller Satz/Bereich (wie gehabt)
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

    // preview = kleine Vorschau (6 Zeilen)
    const previewLines = lines.slice(previewStartIndex, previewStartIndex + 6);
    let preview = previewLines.join(" ");
    preview = preview.replace(/\s+/g, " ").trim();

    // full text soll an der gleichen Stelle beginnen wie preview
    const fullTextLines = lines.slice(previewStartIndex);

    // kompletter Text ohne Sonderzeichen / neue Zeilen
    let fullText = fullTextLines.join(" ");
    fullText = fullText.replace(/\s+/g, " ").trim();

    // 3) Ergebnis speichern
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
