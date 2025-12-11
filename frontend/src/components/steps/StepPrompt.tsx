import { useEffect, useState } from "react";
import type { KnowledgeBase } from "../../types/knowledgeBase";
import { apiPost } from "../../api/client";

interface StepPromptProps {
  knowledgeBase: KnowledgeBase;
  knowledgeBaseJsonFilePath: string;
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
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);

      const response = await apiPost<PromptResponse>("/api/prompt", {
        knowledgeBase,
      });

      onChangePrompt(response.prompt);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Prompt automatisch laden, sobald der Schritt geöffnet wird (falls noch keiner vorhanden ist)
  useEffect(() => {
    if (!prompt) {
      void handleGenerate();
    }
    // Wir wollen handleGenerate hier bewusst nicht als Dependency, um keine Endlosschleife zu erzeugen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knowledgeBase, prompt]);

  function handleSave() {
    if (!prompt) return;
    // Frontend-Only: wir merken uns nur, dass "gespeichert" wurde.
    // Später kann hier ein API-Call eingebaut werden, der den Prompt im Backend aktualisiert.
    setSaveMessage(
      "Aktuelle Version des Prompts wurde übernommen. (Speichern im Backend folgt später.)"
    );
  }

  function handleContinue() {
    if (!prompt) return;
    onNext();
  }

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-content-title">Schritt 3: System-Prompt prüfen und anpassen</h2>
      <p className="wizard-content-description">
        Auf Basis der extrahierten Inhalte wurde ein System-Prompt erzeugt. Du kannst ihn hier
        anpassen, zum Beispiel Tonalität, Sprache, Einschränkungen oder spezielle Hinweise für den
        Voicebot.
      </p>

      {loading && <p className="wizard-content-description">Prompt wird geladen ...</p>}

      {error && <p className="wizard-error">Prompt konnte nicht geladen werden: {error}</p>}

      <textarea
        className="textarea"
        value={prompt}
        onChange={(event) => {
          setSaveMessage(null);
          onChangePrompt(event.target.value);
        }}
        placeholder="Der generierte Prompt erscheint hier und kann von dir angepasst werden ..."
      />

      {saveMessage && <p className="wizard-content-description">{saveMessage}</p>}

      <div className="wizard-step-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleSave}
          disabled={!prompt || loading}
        >
          Speichern
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleContinue}
          disabled={!prompt || loading}
        >
          Weiter zu Schritt 4
        </button>
      </div>
    </div>
  );
}
