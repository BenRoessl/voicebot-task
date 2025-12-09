import * as cheerio from "cheerio";
import { CrawledPage } from "./crawlerService";
import {
  KnowledgeBasePage,
  KnowledgeBaseContact,
  KnowledgeBaseOpeningHoursEntry,
  KnowledgeBaseServiceItem,
} from "../types/knowledgeBase";

export interface PageExtraction {
  page: KnowledgeBasePage;
  contact?: KnowledgeBaseContact;
  openingHours?: KnowledgeBaseOpeningHoursEntry[];
  services?: KnowledgeBaseServiceItem[];
  rawText?: string;
}

export function extractFromCrawledPages(pages: CrawledPage[]): PageExtraction[] {
  return pages.map(extractFromCrawledPage);
}

export function extractFromCrawledPage(page: CrawledPage): PageExtraction {
  const $ = cheerio.load(page.html);

  const title = $("title").first().text().trim() || undefined;

  const mainText = extractMainText($);
  const mainTextSnippet =
    mainText.length > 800 ? `${mainText.slice(0, 800).trim()}…` : mainText || undefined;

  const rawText = extractBodyText($);

  const contact = extractContact(rawText, page.url);
  const openingHours = extractOpeningHours(rawText);
  const services = extractServices($);

  const kbPage: KnowledgeBasePage = {
    url: page.url,
    title,
    mainTextSnippet,
  };

  return {
    page: kbPage,
    contact: isEmptyContact(contact) ? undefined : contact,
    openingHours: openingHours.length > 0 ? openingHours : undefined,
    services: services.length > 0 ? services : undefined,
    rawText: rawText || undefined,
  };
}

// Prefer main/article/content containers over full body text.
function extractMainText($: cheerio.CheerioAPI): string {
  const candidates = ["main", "article", "#content", ".content", ".main-content"];

  for (const selector of candidates) {
    const el = $(selector);
    if (el.length > 0) {
      return normalizeWhitespace(el.text());
    }
  }

  return normalizeWhitespace($("body").text());
}

function extractBodyText($: cheerio.CheerioAPI): string {
  return normalizeWhitespace($("body").text());
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractContact(rawText: string, pageUrl: string): KnowledgeBaseContact {
  const contact: KnowledgeBaseContact = {};

  const emailMatch = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) {
    contact.email = emailMatch[0];
  }

  const phoneMatch = rawText.match(/(\+?\d{2,4}[\s\/-]?)?(\(?\d{2,5}\)?[\s\/-]?){1,4}\d{2,5}/);
  if (phoneMatch) {
    contact.phone = phoneMatch[0];
  }

  const postalCityMatch = rawText.match(/(\d{4,5})\s+([A-ZÄÖÜa-zäöüß\- ]{2,})/);
  if (postalCityMatch) {
    contact.postalCode = postalCityMatch[1];
    contact.city = postalCityMatch[2].trim();
  }

  contact.website = getOrigin(pageUrl);

  return contact;
}

function getOrigin(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
}

function extractOpeningHours(rawText: string): KnowledgeBaseOpeningHoursEntry[] {
  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const days = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
    "Mo",
    "Di",
    "Mi",
    "Do",
    "Fr",
    "Sa",
    "So",
  ];

  const entries: KnowledgeBaseOpeningHoursEntry[] = [];

  for (const line of lines) {
    const hasDay = days.some((d) => line.includes(d));
    if (!hasDay) continue;

    const timeMatch = line.match(/([0-2]?\d:[0-5]\d)\s*[–-]\s*([0-2]?\d:[0-5]\d)/);
    if (!timeMatch) continue;

    const [from, to] = [timeMatch[1], timeMatch[2]];
    const dayLabel = days.find((d) => line.includes(d)) ?? "Unknown";

    entries.push({
      day: dayLabel,
      opens: from,
      closes: to,
      raw: line,
    });
  }

  return entries;
}

function extractServices($: cheerio.CheerioAPI): KnowledgeBaseServiceItem[] {
  const items: KnowledgeBaseServiceItem[] = [];

  const headingSelectors = ["h1", "h2", "h3", "h4"];

  const keywords = ["Leistungen", "Service", "Services", "Angebote", "Produkte"];

  headingSelectors.forEach((selector) => {
    $(selector).each((_idx, el) => {
      const headingText = normalizeWhitespace($(el).text());
      if (!keywords.some((k) => headingText.toLowerCase().includes(k.toLowerCase()))) {
        return;
      }

      const nextList = $(el).nextAll("ul").first();
      if (nextList.length === 0) return;

      nextList.find("li").each((_liIdx, li) => {
        const text = normalizeWhitespace($(li).text());
        if (!text) return;

        items.push({
          name: text,
        });
      });
    });
  });

  const unique = new Map<string, KnowledgeBaseServiceItem>();
  for (const item of items) {
    if (!unique.has(item.name)) {
      unique.set(item.name, item);
    }
  }

  return Array.from(unique.values());
}

function isEmptyContact(contact: KnowledgeBaseContact): boolean {
  return !(
    contact.email ||
    contact.phone ||
    contact.streetAddress ||
    contact.postalCode ||
    contact.city ||
    contact.country ||
    contact.nameOrCompany ||
    contact.website
  );
}
