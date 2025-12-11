import type { ExtractionResult } from "../services/extractionService";
import type {
  KnowledgeBase,
  KnowledgeBasePage,
  KnowledgeBaseContact,
  KnowledgeBaseOpeningHoursEntry,
  KnowledgeBaseServiceItem,
} from "../types/knowledgeBase";

// Very simple page type detection based on URL path
function detectPageType(url: string, sourceUrl: string): KnowledgeBasePage["type"] {
  const normalizedRoot = sourceUrl.replace(/\/+$/, "").toLowerCase();
  const normalizedUrl = url.toLowerCase();

  const path = normalizedUrl.startsWith(normalizedRoot)
    ? normalizedUrl.slice(normalizedRoot.length) || "/"
    : normalizedUrl;

  if (path === "/" || path === "/index" || path === "/start" || path === "/startseite") {
    return "home";
  }

  if (
    path.includes("kontakt") ||
    path.includes("contact") ||
    path.includes("impressum") ||
    path.includes("anfahrt")
  ) {
    return "contact";
  }

  if (path.includes("faq") || path.includes("haeufige-fragen") || path.includes("fragen")) {
    return "faq";
  }

  return "subpage";
}

export function buildKnowledgeBase(sourceUrl: string, extraction: ExtractionResult): KnowledgeBase {
  const pages: KnowledgeBasePage[] = extraction.pages.map((page) => {
    const type = detectPageType(page.url, sourceUrl);
    const content = (page.fullText ?? "").trim();

    const sections =
      content.length > 0
        ? [
            {
              heading: page.title,
              content,
            },
          ]
        : [];

    return {
      url: page.url,
      title: page.title,
      type,
      sections,
      // Optional teaser; can be used in UI lists etc.
      mainTextSnippet: page.preview,
    };
  });

  const contact: KnowledgeBaseContact | null = extraction.contact
    ? {
        nameOrCompany: extraction.contact.nameOrCompany,
        email: extraction.contact.email,
        phone: extraction.contact.phone,
        streetAddress: extraction.contact.streetAddress,
        postalCode: extraction.contact.postalCode,
        city: extraction.contact.city,
        website: extraction.contact.website,
      }
    : null;

  const openingHours: KnowledgeBaseOpeningHoursEntry[] = extraction.openingHours.map(
    (openingHour) => ({
      day: openingHour.day,
      opens: openingHour.opens,
      closes: openingHour.closes,
      // Try to keep a raw representation if available, otherwise fall back to a simple combined string
      raw:
        (openingHour as any).raw ?? `${openingHour.day} ${openingHour.opens}-${openingHour.closes}`,
    })
  );

  const services: KnowledgeBaseServiceItem[] = extraction.services.map((service) => ({
    name: service.name,
    description: service.description,
  }));

  return {
    sourceUrl,
    generatedAt: new Date().toISOString(),
    pages,
    contact,
    openingHours,
    services,
  };
}
