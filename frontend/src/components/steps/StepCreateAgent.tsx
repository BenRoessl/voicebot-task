import { useState } from "react";
import { apiPost } from "../../api/client";

interface StepCreateAgentProps {
  prompt: string;
  agentName: string;
  knowledgeBaseJsonFilePath: string;
}

interface CreateAgentResponse {
  agent: {
    agentId: string;
    main_branch_id: string | null;
    initial_version_id: string | null;
  };
  knowledgeBase: {
    id: string;
    type: "file" | "url";
    name: string;
  }[];
}

export function StepCreateAgent({
  prompt,
  agentName,
  knowledgeBaseJsonFilePath,
}: StepCreateAgentProps) {
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    setAgentId(null);
    setCopied(false);

    try {
      const response = await apiPost<CreateAgentResponse>("/api/agents", {
        name: agentName,
        prompt,
        knowledgeBaseTempFilePath: knowledgeBaseJsonFilePath,
      });

      const id = response.agent?.agentId ?? null;

      if (!id) {
        setError("Agent wurde erstellt, aber es wurde keine Agent-ID zurückgegeben.");
        return;
      }

      setAgentId(id);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unbekannter Fehler bei der Agent-Erstellung.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyId() {
    if (!agentId) return;
    try {
      await navigator.clipboard.writeText(agentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-content-title">Schritt 4: Agent bei ElevenLabs erstellen</h2>
      <p className="wizard-content-description">
        Im letzten Schritt werden Knowledge Base und System-Prompt an ElevenLabs übertragen, um
        einen Voice-Agenten anzulegen. Anschließend erhältst du die Agent-ID, die du für weitere
        Integrationen verwenden kannst.
      </p>

      {!agentId && (
        <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={loading}>
          {loading ? "Agent wird erstellt …" : "Agent jetzt erstellen"}
        </button>
      )}

      {error && <p className="wizard-error">Agent konnte nicht erstellt werden: {error}</p>}

      {agentId && (
        <div className="wizard-success">
          <p>Der Agent wurde erfolgreich erstellt.</p>

          <div className="agent-id-row">
            <span className="agent-id-label">Agent-ID:</span>
            <span className="agent-id-value">{agentId}</span>

            <button type="button" className="btn btn-secondary" onClick={handleCopyId}>
              {copied ? "Kopiert" : "ID kopieren"}
            </button>
          </div>

          <p className="wizard-hint">
            Du kannst diese Agent-ID später nutzen, um den Voicebot zu integrieren oder zu
            verwalten.
          </p>

          {/* Neuer Button */}
          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Neuen Agenten erstellen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
