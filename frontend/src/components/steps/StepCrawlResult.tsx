import { useState } from "react";
import { apiPost } from "../../api/client";
import type { KnowledgeBase } from "../../types/knowledgeBase";

type KnowledgeBaseContact = {
  email?: string;
  phone?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  website?: string;
};

type KnowledgeBaseServiceItem = {
  name?: string;
  description?: string;
};

type KnowledgeBaseSection = {
  heading?: string;
  content?: string;
};

type KnowledgeBasePage = {
  url: string;
  title?: string | null;
  type?: string;
  sections?: KnowledgeBaseSection[];
  mainTextSnippet?: string;
};

type KnowledgeBaseExtended = KnowledgeBase & {
  contact?: KnowledgeBaseContact;
  services?: KnowledgeBaseServiceItem[];
  openingHours?: unknown;
  pages: KnowledgeBasePage[];
};

interface Props {
  url: string;
  knowledgeBase: KnowledgeBase | null;
  onCrawlComplete: (kb: KnowledgeBase, tempFilePath: string) => void;
  onUpdateKnowledgeBase: (kb: KnowledgeBase) => void;
  onNext: () => void;
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
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const kb = knowledgeBase as KnowledgeBaseExtended | null;

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

  function handleSave() {
    if (!kb) return;

    setSaveMessage(
      "Aktuelle Version der Knowledge Base wurde übernommen. Du kannst die Inhalte später jederzeit erneut anpassen."
    );
  }

  function handleRemovePage(targetUrl: string) {
    if (!kb) return;

    setSaveMessage(null);

    const updatedPages = kb.pages.filter((page) => page.url !== targetUrl);
    onUpdateKnowledgeBase({ ...kb, pages: updatedPages });
  }

  function handleUpdateSectionHeading(targetUrl: string, sectionIndex: number, value: string) {
    if (!kb) return;

    setSaveMessage(null);

    const updatedPages = kb.pages.map((page) => {
      if (page.url !== targetUrl) return page;

      const updatedSections = (page.sections ?? []).map((s, i) =>
        i === sectionIndex ? { ...s, heading: value } : s
      );

      return { ...page, sections: updatedSections };
    });

    onUpdateKnowledgeBase({ ...kb, pages: updatedPages });
  }

  function handleUpdateSectionContent(targetUrl: string, sectionIndex: number, value: string) {
    if (!kb) return;

    setSaveMessage(null);

    const updatedPages = kb.pages.map((page) => {
      if (page.url !== targetUrl) return page;

      const updatedSections = (page.sections ?? []).map((s, i) =>
        i === sectionIndex ? { ...s, content: value } : s
      );

      return { ...page, sections: updatedSections };
    });

    onUpdateKnowledgeBase({ ...kb, pages: updatedPages });
  }

  const canContinue = !!kb && kb.pages.length > 0;

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-content-title">Schritt 2: Website crawlen</h2>

      {!kb && (
        <button className="btn btn-primary" onClick={handleCrawl} disabled={loading || !url}>
          {loading ? "Crawling läuft ..." : "Crawling starten"}
        </button>
      )}

      {error && <p className="wizard-error">{error}</p>}

      {kb && (
        <>
          {/* Meta blocks above pages list */}
          <div style={{ marginTop: "0.75rem" }}>
            <h3 className="wizard-content-title" style={{ fontSize: "1rem" }}>
              Stammdaten
            </h3>

            <div className="wizard-content-description" style={{ marginTop: "0.25rem" }}>
              <strong>Kontaktinfos</strong>
              <div style={{ marginTop: "0.25rem" }}>
                <div>Website: {kb.contact?.website ?? "-"}</div>
                <div>E-Mail: {kb.contact?.email ?? "-"}</div>
                <div>Telefon: {kb.contact?.phone ?? "-"}</div>
                <div>
                  Adresse:{" "}
                  {kb.contact?.streetAddress || kb.contact?.postalCode || kb.contact?.city
                    ? `${kb.contact?.streetAddress ?? ""} ${kb.contact?.postalCode ?? ""} ${kb.contact?.city ?? ""}`.trim()
                    : "-"}
                </div>
              </div>
            </div>

            <div className="wizard-content-description" style={{ marginTop: "0.75rem" }}>
              <strong>Services</strong>
              <div style={{ marginTop: "0.25rem" }}>
                {kb.services && kb.services.length > 0 ? (
                  <ul style={{ margin: "0.25rem 0 0 1rem" }}>
                    {kb.services.map((s, idx) => (
                      <li key={`${s.name ?? "service"}-${idx}`}>
                        <span>{s.name ?? "Unbenannter Service"}</span>
                        {s.description ? <span> — {s.description}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>-</div>
                )}
              </div>
            </div>

            <div className="wizard-content-description" style={{ marginTop: "0.75rem" }}>
              <strong>Öffnungszeiten:</strong>
              <div style={{ marginTop: "0.25rem" }}>-</div>
            </div>
          </div>

          <h3 className="wizard-content-title" style={{ fontSize: "1rem", marginTop: "1rem" }}>
            Gefundene Seiten
          </h3>

          <ul className="wizard-list">
            {kb.pages.map((page) => {
              const sections = page.sections ?? [];
              const snippet = page.mainTextSnippet ?? "";

              return (
                <li key={page.url} className="wizard-list-item">
                  <div className="wizard-list-item-main" style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                      <div>
                        <strong>{page.title ?? "Ohne Titel"}</strong>
                        <div className="wizard-content-description">{page.url}</div>

                        {snippet && (
                          <p className="wizard-content-description" style={{ marginTop: "0.5rem" }}>
                            {snippet}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleRemovePage(page.url)}
                        style={{ alignSelf: "flex-start", whiteSpace: "nowrap" }}
                      >
                        Entfernen
                      </button>
                    </div>

                    <details style={{ marginTop: "0.75rem" }}>
                      <summary style={{ cursor: "pointer" }}>
                        Vollständige Inhalte anzeigen / bearbeiten
                      </summary>

                      <div style={{ marginTop: "1rem" }}>
                        <strong>Sections</strong>

                        {sections.map((section, idx) => (
                          <div key={idx} style={{ marginTop: "0.75rem" }}>
                            <input
                              className="wizard-input"
                              value={section.heading ?? ""}
                              onChange={(e) =>
                                handleUpdateSectionHeading(page.url, idx, e.target.value)
                              }
                              placeholder="Heading"
                            />

                            <textarea
                              className="textarea"
                              value={section.content ?? ""}
                              onChange={(e) =>
                                handleUpdateSectionContent(page.url, idx, e.target.value)
                              }
                              rows={8}
                              spellCheck={false}
                              style={{ marginTop: "0.5rem" }}
                            />
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </li>
              );
            })}
          </ul>

          {saveMessage && <p className="wizard-content-description">{saveMessage}</p>}

          <div className="wizard-step-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSave}
              disabled={!kb || loading}
            >
              Speichern
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onNext}
              disabled={!canContinue || loading}
            >
              Weiter
            </button>
          </div>
        </>
      )}
    </div>
  );
}
