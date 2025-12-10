import { useState } from "react";
import type { KnowledgeBase } from "../../types/knowledgeBase";
import { apiPost } from "../../api/client";

interface StepPromptProps {
  knowledgeBase: KnowledgeBase;
  prompt: string;
  onChangePrompt: (value: string) => void;
  onNext: () => void;
}

interface PromptResponse {
  prompt: string;
}

export function StepPrompt({ knowledgeBase, prompt, onChangePrompt, onNext }: StepPromptProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiPost<PromptResponse>("/api/prompt", {
        knowledgeBase,
      });

      onChangePrompt(response.prompt);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    if (!prompt) return;
    onNext();
  }

  return (
    <div>
      <h2>Schritt 3: Generierter Prompt</h2>
      <p>
        Auf Basis der extrahierten Informationen wurde ein System-Prompt erzeugt. Du kannst ihn hier
        anpassen.
      </p>

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Prompt wird erzeugt..." : "Prompt erzeugen"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>
          Prompt konnte nicht erzeugt werden: {error}
        </p>
      )}

      <textarea
        style={{ width: "100%", minHeight: "200px", marginTop: "1rem" }}
        value={prompt}
        onChange={(e) => onChangePrompt(e.target.value)}
        placeholder="Der generierte Prompt erscheint hier..."
      />

      <div style={{ marginTop: "1rem" }}>
        <button onClick={handleContinue} disabled={!prompt}>
          Weiter zu Schritt 4
        </button>
      </div>
    </div>
  );
}
