export interface KnowledgeBaseSection {
  heading?: string;
  content?: string;
}

export interface KnowledgeBasePage {
  url: string;
  title?: string;
  type?: "home" | "subpage" | "contact" | "faq" | "unknown";
  sections?: KnowledgeBaseSection[];
  mainTextSnippet?: string;
}

export interface KnowledgeBaseContact {
  email?: string;
  phone?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  website?: string;
}

export interface KnowledgeBaseOpeningHoursEntry {
  day: string;
  opens: string;
  closes: string;
  raw?: string;
}

export interface KnowledgeBaseServiceItem {
  name: string;
  description?: string;
}

export interface KnowledgeBase {
  sourceUrl: string;
  generatedAt?: string;
  pages: KnowledgeBasePage[];
  contact?: KnowledgeBaseContact;
  openingHours?: KnowledgeBaseOpeningHoursEntry[];
  services?: KnowledgeBaseServiceItem[];
}
