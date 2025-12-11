import { useState } from "react";
import type { KnowledgeBase } from "../types/knowledgeBase";
import { StepUrl } from "./steps/StepUrl";
import { StepCrawlResult } from "./steps/StepCrawlResult";
import { StepPrompt } from "./steps/StepPrompt";
import { StepCreateAgent } from "./steps/StepCreateAgent";

type StepConfig = {
  number: number;
  id: "url" | "crawl" | "prompt" | "agent";
  label: string;
  description: string;
};

const STEPS: StepConfig[] = [
  {
    number: 1,
    id: "url",
    label: "Website",
    description: "Gib die URL der Website an, aus der der Voicebot vorbereitet werden soll.",
  },
  {
    number: 2,
    id: "crawl",
    label: "Crawling",
    description: "Wir crawlen die Inhalte deiner Website und bereiten die Knowledge Base vor.",
  },
  {
    number: 3,
    id: "prompt",
    label: "System Prompt",
    description:
      "Formuliere die System-Anweisungen, wie der Voicebot mit den Inhalten umgehen soll.",
  },
  {
    number: 4,
    id: "agent",
    label: "Agent",
    description: "Erstelle den ElevenLabs-Agenten auf Basis der vorbereiteten Knowledge Base.",
  },
];

export function Wizard() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [knowledgeBaseJsonFilePath, setKnowledgeBaseJsonFilePath] = useState<string | null>(null);

  function goToNextStep() {
    setStep((current) => Math.min(current + 1, STEPS.length));
  }

  function goToPreviousStep() {
    setStep((current) => Math.max(current - 1, 1));
  }

  const currentStep = STEPS.find((s) => s.number === step) ?? STEPS[0];

  // Einfacher, automatisch generierter Name für den Agenten
  const agentName = url ? `Agent für ${url}` : "Voicebot Agent";

  return (
    <>
      {/* Header */}
      <header>
        <p className="wizard-header-eyebrow">Voicebot Setup</p>
        <h1 className="wizard-header-title">Voicebot Setup Wizard</h1>
        <p className="wizard-header-subtitle">
          Führe die Schritte nacheinander durch, um aus einer Website-URL automatisch einen
          vorbereiteten Voicebot zu erstellen und ihn als Agent bei ElevenLabs anzulegen.
        </p>
      </header>

      {/* Stepper */}
      <nav aria-label="Wizard Schritte">
        <ol className="wizard-steps">
          {STEPS.map((s) => {
            const isActive = s.number === step;
            const isCompleted = s.number < step;

            const itemClassNames = [
              "wizard-step",
              isActive ? "wizard-step--active" : "",
              isCompleted ? "wizard-step--completed" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <li key={s.id} className={itemClassNames}>
                <div className="wizard-step-circle">{isCompleted ? "✓" : s.number}</div>
                <span className="wizard-step-label">{s.label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Content */}
      <section className="wizard-content">
        <p className="wizard-content-description">{currentStep.description}</p>

        {step === 1 && <StepUrl url={url} onChangeUrl={setUrl} onNext={goToNextStep} />}

        {step === 2 && (
          <StepCrawlResult
            url={url}
            knowledgeBase={knowledgeBase}
            onCrawlComplete={(kb, tempFilePath) => {
              setKnowledgeBase(kb);
              setKnowledgeBaseJsonFilePath(tempFilePath);
            }}
            onUpdateKnowledgeBase={(updatedKb) => {
              setKnowledgeBase(updatedKb);
            }}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {step === 3 && knowledgeBase && (
          <StepPrompt
            knowledgeBase={knowledgeBase}
            prompt={systemPrompt}
            onChangePrompt={setSystemPrompt}
            onNext={goToNextStep}
          />
        )}

        {step === 4 && knowledgeBase && knowledgeBaseJsonFilePath && (
          <StepCreateAgent
            prompt={systemPrompt}
            agentName={agentName}
            knowledgeBaseJsonFilePath={knowledgeBaseJsonFilePath}
          />
        )}
      </section>

      {/* Footer */}
      <footer className="wizard-footer">
        <div className="wizard-footer-meta">
          Schritt {step} von {STEPS.length}
        </div>
        <div className="wizard-footer-actions" />
      </footer>
    </>
  );
}
