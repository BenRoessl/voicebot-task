# Voicebot Setup Wizard

Der Voicebot Setup Wizard ist ein kleines End-to-End-Projekt, das zeigt, wie aus einer Website automatisch ein Voicebot erstellt werden kann.

Der Fokus liegt auf einem klaren, nachvollziehbaren technischen Ablauf.

---

## Projektübersicht

Dieses Repository enthält sowohl Frontend als auch Backend.

Die Anwendung führt den Nutzer Schritt für Schritt durch einen Wizard, der:
- eine Website crawlt,
- daraus eine Knowledge Base erstellt,
- und einen Voice-Agent über die ElevenLabs API anlegt.

---

## Ablauf auf hoher Ebene

Der Setup-Prozess besteht aus vier Schritten:

1. **Website-URL**  
   Der Nutzer gibt die URL der Website an, die als Wissensquelle dienen soll.

2. **Crawling**  
   Das Backend crawlt die Startseite und verlinkte Unterseiten (Tiefe 2) und extrahiert Textinhalte.

3. **Prompt-Konfiguration**  
   Auf Basis der gecrawlten Inhalte wird automatisch ein initialer System-Prompt erzeugt.
   Der Nutzer kann diesen Prompt in diesem Schritt prüfen und bei Bedarf anpassen,
   um das Verhalten des Voice-Agenten gezielt zu steuern.

4. **Agent-Erstellung**  
   Knowledge Base und Prompt werden genutzt, um einen Agenten über die ElevenLabs API zu erstellen.
   Die Agent-ID wird im Frontend angezeigt und kann dort in die Zwischenablage kopiert werden.

---

## Architektur

### Frontend
- Wizard-basierte Benutzeroberfläche
- Anzeige von Status und Ergebnissen
- Kommunikation mit dem Backend über HTTP

### Backend
- Website-Crawling und Textextraktion
- Aufbereitung der Inhalte zu bereinigtem Text
- Temporäre Speicherung der Knowledge Base als Datei
- Erstellung des Agenten über die ElevenLabs API

Frontend und Backend befinden sich im selben Repository.

---

## Umgang mit der Knowledge Base

Die Knowledge Base wird dateibasiert verarbeitet:

- Crawling-Ergebnisse werden in eine Textdatei umgewandelt
- Die Datei wird temporär gespeichert
- Upload zu ElevenLabs erfolgt über eine File-Referenz

---

## Designentscheidungen

- **Begrenzte Crawltiefe**  
  Tiefe 2 sorgt für planbare Laufzeiten und überschaubaren Umfang.

- **Synchroner Ablauf**  
  Der Flow ist bewusst einfach und synchron gehalten.

- **Dateibasierte Knowledge Base**  
  Erleichtert Debugging, Wiederverwendung und spätere Erweiterungen.

- **Agent-Erstellung statt Update**  
  Der Fokus liegt auf einem klaren Abschluss des Setups.

- **Fehlerbehandlung**  
  Fehler werden transparent angezeigt; erweiterte Retry-Logik ist bewusst nicht Teil der Aufgabe.

---

## Setup-Hinweise

1. Abhängigkeiten für Frontend und Backend installieren
2. Umgebungsvariablen konfigurieren (inkl. ElevenLabs API-Key)
3. Backend starten (npm run dev:backend)
4. Frontend starten (npm run dev:frontend)

Das Projekt ist für lokale Ausführung und Evaluation gedacht.
