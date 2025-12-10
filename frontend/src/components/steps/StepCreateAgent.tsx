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

  async function handleCreate() {
    setLoading(true);
    setError(null);
    setAgentId(null);

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
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Schritt 4: Agent-Erstellung</h2>
      <p>
        Knowledge Base und Prompt werden nun an ElevenLabs geschickt, um einen Voice-Agent
        anzulegen.
      </p>

      {!agentId && (
        <button onClick={handleCreate} disabled={loading}>
          {loading ? "Agent wird erstellt…" : "Agent jetzt erstellen"}
        </button>
      )}

      {agentId && (
        <div style={{ marginTop: "1rem" }}>
          <p>Agent wurde erfolgreich erstellt.</p>
          <p>
            <strong>Agent-ID:</strong> {agentId}
          </p>
        </div>
      )}

      {error && (
        <p style={{ color: "red", marginTop: "1rem" }}>
          Agent konnte nicht erstellt werden: {error}
        </p>
      )}
    </div>
  );
}
