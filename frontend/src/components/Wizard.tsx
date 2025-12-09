import { useState } from "react";
import type { KnowledgeBase } from "../types/knowledgeBase";
import { StepUrl } from "./steps/StepUrl";
import { StepCrawlResult } from "./steps/StepCrawlResult";

export function Wizard() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);

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

      {step > 2 && (
        <div style={{ marginTop: "2rem" }}>
          <p>Further steps will be implemented later.</p>
        </div>
      )}
    </div>
  );
}
