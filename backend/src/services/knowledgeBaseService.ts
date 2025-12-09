import {
  KnowledgeBase,
  KnowledgeBaseContact,
  KnowledgeBaseOpeningHoursEntry,
  KnowledgeBaseServiceItem,
} from "../types/knowledgeBase";
import { PageExtraction } from "./extractionService";

export function buildKnowledgeBase(
  sourceUrl: string,
  pages: PageExtraction[]
): KnowledgeBase {
  const kbPages = pages.map((p) => p.page);

  const contact = selectBestContact(pages, sourceUrl);
  const openingHours = mergeOpeningHours(pages);
  const services = mergeServices(pages);
  const rawTextConcat = buildRawTextConcat(pages);

  const knowledgeBase: KnowledgeBase = {
    sourceUrl,
    pages: kbPages,
  };

  if (contact) knowledgeBase.contact = contact;
  if (openingHours.length > 0) knowledgeBase.openingHours = openingHours;
  if (services.length > 0) knowledgeBase.services = services;
  if (rawTextConcat) knowledgeBase.rawTextConcat = rawTextConcat;

  return knowledgeBase;
}

function selectBestContact(
  pages: PageExtraction[],
  sourceUrl: string
): KnowledgeBaseContact | undefined {
  const candidates: { contact: KnowledgeBaseContact; url: string }[] = [];

  pages.forEach((page) => {
    if (!page.contact) return;
    candidates.push({ contact: page.contact, url: page.page.url });
  });

  if (candidates.length === 0) {
    return undefined;
  }

  const prioritized = candidates.sort((a, b) => {
    const scoreA = scoreContactUrl(a.url, sourceUrl);
    const scoreB = scoreContactUrl(b.url, sourceUrl);
    return scoreB - scoreA;
  });

  return prioritized[0].contact;
}

// Simple URL scoring to bias towards contact/imprint/home pages.
function scoreContactUrl(url: string, sourceUrl: string): number {
  let score = 0;
  const lower = url.toLowerCase();

  if (lower.includes("kontakt") || lower.includes("contact")) score += 3;
  if (lower.includes("impressum") || lower.includes("legal")) score += 2;

  try {
    const base = new URL(sourceUrl);
    const current = new URL(url);
    if (
      base.origin === current.origin &&
      (current.pathname === "/" || current.pathname === "")
    ) {
      score += 1;
    }
  } catch {
    // ignore parse errors
  }

  return score;
}

function mergeOpeningHours(
  pages: PageExtraction[]
): KnowledgeBaseOpeningHoursEntry[] {
  const entries: KnowledgeBaseOpeningHoursEntry[] = [];

  pages.forEach((page) => {
    if (!page.openingHours) return;
    entries.push(...page.openingHours);
  });

  const key = (entry: KnowledgeBaseOpeningHoursEntry) =>
    `${entry.day}-${entry.opens}-${entry.closes}`;

  const map = new Map<string, KnowledgeBaseOpeningHoursEntry>();

  for (const entry of entries) {
    const k = key(entry);
    if (!map.has(k)) {
      map.set(k, entry);
    }
  }

  return Array.from(map.values());
}

function mergeServices(pages: PageExtraction[]): KnowledgeBaseServiceItem[] {
  const items: KnowledgeBaseServiceItem[] = [];

  pages.forEach((page) => {
    if (!page.services) return;
    items.push(...page.services);
  });

  const map = new Map<string, KnowledgeBaseServiceItem>();

  items.forEach((item) => {
    if (!map.has(item.name)) {
      map.set(item.name, item);
    }
  });

  return Array.from(map.values());
}

function buildRawTextConcat(pages: PageExtraction[]): string | undefined {
  const parts = pages
    .map((p) => p.rawText?.trim())
    .filter((t): t is string => !!t);

  if (parts.length === 0) return undefined;

  const text = parts.join("\n\n");
  return text.trim() || undefined;
}
