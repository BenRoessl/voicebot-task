// Represents a single content section on a page
export interface KnowledgeBaseSection {
  heading?: string;
  content: string;
}

// Basic classification for page types
export type KnowledgeBasePageType = "home" | "subpage" | "faq" | "contact" | "other";

// Represents a crawled page with structured content sections
export interface KnowledgeBasePage {
  url: string;
  title?: string;
  type: KnowledgeBasePageType;
  sections: KnowledgeBaseSection[];
  // Optional short summary/snippet of the main content
  mainTextSnippet?: string;
}

// Represents extracted contact information for the company
export interface KnowledgeBaseContact {
  nameOrCompany?: string;
  email?: string;
  phone?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  website?: string;
}

// Represents normalized opening hours per day
export interface KnowledgeBaseOpeningHoursEntry {
  day: string;
  opens: string;
  closes: string;
  // Raw string as captured from the source, for debugging or fallback usage
  raw?: string;
}

// Represents a service or offering of the company
export interface KnowledgeBaseServiceItem {
  name: string;
  description?: string;
}

// Root knowledge base structure built from the crawled website
export interface KnowledgeBase {
  sourceUrl: string;
  generatedAt: string;
  pages: KnowledgeBasePage[];
  contact?: KnowledgeBaseContact | null;
  openingHours?: KnowledgeBaseOpeningHoursEntry[];
  services?: KnowledgeBaseServiceItem[];
}
