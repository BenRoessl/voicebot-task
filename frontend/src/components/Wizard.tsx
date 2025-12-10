import { useState } from "react";
import type { KnowledgeBase } from "../types/knowledgeBase";
import { StepUrl } from "./steps/StepUrl";
import { StepCrawlResult } from "./steps/StepCrawlResult";
import { StepPrompt } from "./steps/StepPrompt";
import { StepCreateAgent } from "./steps/StepCreateAgent";

export function Wizard() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [knowledgeBaseJsonFilePath, setKnowledgeBaseJsonFilePath] = useState<string | null>(null);

  function goToNextStep() {
    setStep((current) => current + 1);
  }

  // Einfacher, automatisch generierter Name für den Agenten
  const agentName = url ? `Agent für ${url}` : "Voicebot Agent";

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1.5rem" }}>
      <h1>Voicebot Wizard</h1>
      <p>Step {step} of 4</p>

      {step === 1 && <StepUrl url={url} onChangeUrl={setUrl} onNext={goToNextStep} />}

      {step === 2 && (
        <StepCrawlResult
          url={url}
          knowledgeBase={knowledgeBase}
          onCrawlComplete={(kb, tempFilePath) => {
            setKnowledgeBase(kb);
            setKnowledgeBaseJsonFilePath(tempFilePath);
          }}
          onNext={goToNextStep}
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
    </div>
  );
}
