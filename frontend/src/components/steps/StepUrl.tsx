import { useState } from "react";

interface Props {
  url: string;
  onChangeUrl: (value: string) => void;
  onNext: () => void;
}

export function StepUrl({ url, onChangeUrl, onNext }: Props) {
  const [localUrl, setLocalUrl] = useState(url);

  function handleNext() {
    onChangeUrl(localUrl.trim());
    onNext();
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h2>Step 1: Enter website URL</h2>
      <p>
        Please provide the URL of the website that should be used to prepare the voice assistant.
      </p>

      <input
        type="text"
        placeholder="https://example.com"
        value={localUrl}
        onChange={(event) => setLocalUrl(event.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem",
          marginTop: "1rem",
          boxSizing: "border-box",
        }}
      />

      <button style={{ marginTop: "1rem" }} onClick={handleNext} disabled={!localUrl.trim()}>
        Continue
      </button>
    </div>
  );
}
