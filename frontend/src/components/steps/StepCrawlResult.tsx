import { useState } from "react";
import { apiPost } from "../../api/client";
import type { KnowledgeBase } from "../../types/knowledgeBase";

interface Props {
  url: string;
  knowledgeBase: KnowledgeBase | null;
  onCrawlComplete: (knowledgeBase: KnowledgeBase) => void;
  onNext: () => void;
}

export function StepCrawlResult({ url, knowledgeBase, onCrawlComplete, onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCrawl() {
    try {
      setLoading(true);
      setError(null);

      const response = await apiPost<{
        knowledgeBase: KnowledgeBase;
        crawlErrors: unknown[];
      }>("/api/crawl", { url });

      onCrawlComplete(response.knowledgeBase);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Crawling failed. Please check the URL or try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h2>Step 2: Crawl results</h2>
      <p>We will now crawl the website and extract the most relevant information.</p>

      {!knowledgeBase && (
        <button onClick={handleCrawl} disabled={loading || !url}>
          {loading ? "Crawling..." : "Start crawling"}
        </button>
      )}

      {error && <p style={{ color: "red", marginTop: "0.75rem" }}>{error}</p>}

      {knowledgeBase && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3>Discovered pages</h3>
          <ul>
            {knowledgeBase.pages.map((page) => (
              <li key={page.url}>
                <strong>{page.title ?? page.url}</strong>
                {page.title && page.url !== page.title && <span> — {page.url}</span>}
              </li>
            ))}
          </ul>

          <button style={{ marginTop: "1rem" }} onClick={onNext}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
