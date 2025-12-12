import { useState } from "react";
import { apiPost } from "../../api/client";
import type { KnowledgeBase } from "../../types/knowledgeBase";

interface Props {
  url: string;
  knowledgeBase: KnowledgeBase | null;
  onCrawlComplete: (kb: KnowledgeBase, tempFilePath: string) => void;
  onUpdateKnowledgeBase: (kb: KnowledgeBase) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepCrawlResult({
  url,
  knowledgeBase,
  onCrawlComplete,
  onUpdateKnowledgeBase,
  onNext,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCrawl() {
    try {
      setLoading(true);
      setError(null);

      const response = await apiPost<{
        knowledgeBase: KnowledgeBase;
        knowledgeBaseJsonFilePath: string;
        crawlErrors: unknown[];
      }>("/api/crawl", { url });

      onCrawlComplete(response.knowledgeBase, response.knowledgeBaseJsonFilePath);
    } catch {
      setError("Crawling fehlgeschlagen. Bitte überprüfe die URL oder versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  function handleRemovePage(targetUrl: string) {
    if (!knowledgeBase) return;

    const updatedPages = knowledgeBase.pages.filter((page) => page.url !== targetUrl);
    const updatedKb: KnowledgeBase = {
      ...knowledgeBase,
      pages: updatedPages,
    };

    onUpdateKnowledgeBase(updatedKb);
  }

  const canContinue = !!knowledgeBase && knowledgeBase.pages.length > 0;

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-content-title">Schritt 2: Website crawlen</h2>
      <p className="wizard-content-description">
        In diesem Schritt wird die angegebene Website gecrawlt. Die wichtigsten Seiten werden
        analysiert und als Knowledge Base für den Voicebot vorbereitet. Anschließend kannst du die
        Liste der Seiten noch anpassen.
      </p>

      {!knowledgeBase && (
        <button className="btn btn-primary" onClick={handleCrawl} disabled={loading || !url}>
          {loading ? "Crawling läuft ..." : "Crawling starten"}
        </button>
      )}

      {error && <p className="wizard-error">{error}</p>}

      {knowledgeBase && (
        <>
          <h3 className="wizard-content-title" style={{ fontSize: "1rem", marginTop: "0.5rem" }}>
            Gefundene Seiten
          </h3>
          <p className="wizard-content-description">
            Entferne Seiten, die nicht in die Knowledge Base aufgenommen werden sollen, oder füge
            bei Bedarf zusätzliche URLs hinzu.
          </p>

          <ul className="wizard-list">
            {knowledgeBase.pages.map((page) => (
              <li key={page.url} className="wizard-list-item">
                <div className="wizard-list-item-main">
                  <strong>{page.title ?? page.url}</strong>
                  {page.title && page.url !== page.title && <span> — {page.url}</span>}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleRemovePage(page.url)}
                >
                  Entfernen
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onNext}
            disabled={!canContinue}
          >
            Weiter
          </button>
        </>
      )}
    </div>
  );
}
