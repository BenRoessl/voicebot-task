import type { ExtractionResult } from "../services/extractionService";
import type {
  KnowledgeBase,
  KnowledgeBasePage,
  KnowledgeBaseContact,
  KnowledgeBaseOpeningHoursEntry,
  KnowledgeBaseServiceItem,
} from "../types/knowledgeBase";

export function buildKnowledgeBase(sourceUrl: string, extraction: ExtractionResult): KnowledgeBase {
  const pages: KnowledgeBasePage[] = extraction.pages.map((p) => ({
    url: p.url,
    title: p.title,
    mainTextSnippet: p.preview,
  }));

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

  const openingHours: KnowledgeBaseOpeningHoursEntry[] = extraction.openingHours.map((oh) => ({
    day: oh.day,
    opens: oh.opens,
    closes: oh.closes,
    raw: oh.day,
  }));

  const services: KnowledgeBaseServiceItem[] = extraction.services.map((s) => ({
    name: s.name,
    description: s.description,
  }));

  return {
    sourceUrl,
    pages,
    contact,
    openingHours,
    services,
    rawTextConcat: extraction.rawTextConcat,
  };
}
