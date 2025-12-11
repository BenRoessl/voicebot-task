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
    <div className="wizard-step-content">
      <h2 className="wizard-content-title">Schritt 1: Website-URL eingeben</h2>
      <p className="wizard-content-description">
        Bitte gib die URL der Website ein, aus der der Voicebot später die Inhalte bezieht.
      </p>

      <input
        type="text"
        className="input"
        placeholder="https://beispielseite.de"
        value={localUrl}
        onChange={(event) => setLocalUrl(event.target.value)}
      />

      <button className="btn btn-primary" onClick={handleNext} disabled={!localUrl.trim()}>
        Weiter
      </button>
    </div>
  );
}
