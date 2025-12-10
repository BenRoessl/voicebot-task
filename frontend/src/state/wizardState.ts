import type { KnowledgeBase } from "../types/knowledgeBase";

export interface WizardState {
  url: string;
  knowledgeBase: KnowledgeBase | null;
  systemPrompt: string | null;
}

export const wizardState: WizardState = {
  url: "",
  knowledgeBase: null,
  systemPrompt: null,
};
