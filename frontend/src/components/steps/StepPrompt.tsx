import { useState } from "react";
import type { KnowledgeBase } from "../../types/knowledgeBase";
import { apiPost } from "../../api/client";

interface StepPromptProps {
  knowledgeBase: KnowledgeBase | null;
  prompt: string;
  onChangePrompt: (value: string) => void;
  onNext: () => void;
}

export function StepPrompt({ knowledgeBase, prompt, onChangePrompt, onNext }: StepPromptProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!knowledgeBase) {
    return (
      <div style={{ padding: "1rem" }}>
        <h2>Schritt 3: Prompt</h2>
        <p>Es ist keine Knowledge Base vorhanden. Bitte Schritt 2 erneut ausführen.</p>
      </div>
    );
  }

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);

      const response = await apiPost<{ prompt: string }>("/api/prompt", {
        knowledgeBase,
      });

      onChangePrompt(response.prompt);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Prompt konnte nicht erzeugt werden. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (!prompt.trim()) {
      setError("Der Prompt darf nicht leer sein.");
      return;
    }
    onNext();
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Schritt 3: Generierter Prompt</h2>
      <p>
        Der Prompt basiert auf den zuvor extrahierten Informationen. Du kannst ihn hier anpassen.
      </p>

      {!prompt && (
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Prompt wird erzeugt..." : "Prompt erzeugen"}
        </button>
      )}

      {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}

      {prompt && (
        <>
          <textarea
            value={prompt}
            onChange={(e) => onChangePrompt(e.target.value)}
            rows={16}
            style={{ width: "100%", marginTop: "1rem" }}
          />

          <button style={{ marginTop: "1rem" }} onClick={handleNext}>
            Weiter zum Agenten
          </button>
        </>
      )}
    </div>
  );
}
