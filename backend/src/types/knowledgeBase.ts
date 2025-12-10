export interface KnowledgeBasePage {
  url: string;
  title?: string;
  mainTextSnippet?: string;
}

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
  pages: KnowledgeBasePage[];
  contact?: KnowledgeBaseContact | null;
  openingHours?: KnowledgeBaseOpeningHoursEntry[];
  services?: KnowledgeBaseServiceItem[];
  rawTextConcat?: string;
}
