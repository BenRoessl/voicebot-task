import { useState } from "react";
import type { KnowledgeBase } from "../types/knowledgeBase";
import { StepUrl } from "./steps/StepUrl";
import { StepCrawlResult } from "./steps/StepCrawlResult";
import { StepPrompt } from "./steps/StepPrompt";

export function Wizard() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>("");

  function goToNextStep() {
    setStep((current) => current + 1);
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1.5rem" }}>
      <h1>Voicebot Wizard</h1>
      <p>Step {step} of 4</p>

      {step === 1 && <StepUrl url={url} onChangeUrl={setUrl} onNext={goToNextStep} />}

      {step === 2 && (
        <StepCrawlResult
          url={url}
          knowledgeBase={knowledgeBase}
          onCrawlComplete={setKnowledgeBase}
          onNext={goToNextStep}
        />
      )}

      {step === 3 && (
        <StepPrompt
          knowledgeBase={knowledgeBase}
          prompt={systemPrompt}
          onChangePrompt={setSystemPrompt}
          onNext={goToNextStep}
        />
      )}

      {step >= 4 && (
        <div style={{ padding: "1rem" }}>
          <h2>Schritt 4: Agent-Erstellung</h2>
          <p>Hier binden wir als Nächstes die ElevenLabs-API an.</p>
          <pre>{systemPrompt}</pre>
        </div>
      )}
    </div>
  );
}
