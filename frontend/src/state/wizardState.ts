import type { KnowledgeBase } from "../types/knowledgeBase";

export interface WizardState {
  url: string;
  knowledgeBase: KnowledgeBase | null;
}
