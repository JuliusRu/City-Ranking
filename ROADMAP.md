# ranking.place — Vision & Roadmap

> Strategischer Anker. Geschärft in der Session 2026-06-24/25. Bei Richtungs-Fragen
> hier zuerst lesen. Detail-Historie steht in `session_diary.md`.

## Die Idee in einem Satz
**„Letterboxd für Reisen"** — deine Reise-Sammlung, gamifiziert durch Badges,
geteilt mit Menschen.

## Origin Story (warum das authentisch ist)
Julius führte in Apple Notes eine Liste der **Millionenstädte, in denen er min.
eine Nacht geschlafen hat** — eine lustige persönliche Statistik, Freude am
Sammeln. Das Ranking kam erst später dazu. Er erinnert sich an jeden Besuch mit
Foto + Gefühl, **ohne tiefe Bedeutung**. Und: Er hat **nie nach dem gleichen
Kriterium bewertet** — mal die saubere U-Bahn, mal das Internet, mal das
Nachtleben. Diese drei Dinge SIND das Produkt.

## Positionierung vs. Nomad List (nomads.com)
| Nomad List | ranking.place |
|---|---|
| Daten · Utility · Entscheidung | **Geschmack · Identität · Erinnerung · sozial** |
| „Wohin, nach Zahlen?" (standardisierte Metriken) | **„Wo war *ich*, was denke *ich*, wem vertraue ich?"** (holistisch) |
| Tool zum Optimieren (Arbeit) | **Sammeln · Erinnern · Freude** |

→ **NICHT das bessere Nomad List bauen** (deren Graben: 10 J. Daten + SEO + Marke).
Die Spur besetzen, die sie strukturell nicht können.

## Zwei Säulen
1. **Millionenstädte = Breite** (Sammlung, Flex, Spiel, Hero-Zahl „X / ~500").
   **LINSE, kein Filter:** man loggt **ALLE** Städte (Düsseldorf, Zürich zählen
   voll). „Millionenstadt" ist ein **★-Badge** = lebendige Eigenschaft der Stadt
   (aktuelle Einwohner ≥ 1 Mio), kein Gate. Knackt eine Stadt die Million, tickt
   die Zahl von selbst hoch (Delight). Keine historische Buchhaltung — **aktuelle
   Einwohnerzahl zählt**, nicht überdenken.
2. **Distrikte = Tiefe** (Geschmack, Wahrheit). *„Man besucht keine Stadt — man
   lebt in einem Distrikt."* Eingabe leicht halten → das **AI-Diktat nimmt
   Distrikte beiläufig mit** (kein extra Klick-Aufwand).

## Prinzipien
- **Anti-Nomad-List:** Emotion/Freude statt Optimierung. Leicht & verspielt, kein Work-Tool.
- **Holistisch, nicht standardisiert:** ein Gesamt-Score + „was dir auffiel" (frei, kein starres Raster).
- **Badges:** wenige, ikonische, status-/teilbare. Faustregel: *„Passt es in eine Bio?"* Sonst kein Badge.
- **Distrikt-Entdeckung menschlich, nicht algorithmisch** (vorerst): „wer hat
  dieses Viertel bewertet?" → Profil → mehr. Der ML-Taste-Match ist nur die
  automatisierte Version desselben Loops → erst viel später (braucht Daten).
- **Globe = das teilbare Sammelbrett.**

## Roadmap (priorisiert)

### Spur A — Differenzierung (warum Leute bleiben & teilen)
1. **Millionenstadt-/Badge-System** — ~500 Städte einseeden, ★-Badge, Hero-Zahl
   „X/500", erste Achievements. *Der rote Faden, sichtbar gemacht.*
2. **Distrikt als Entdeckungs-Fläche** — „wer war hier?" → Profil → mehr
   (menschlicher Taste-Loop; baut auf dem schon gebauten „Who else has been here").

### Spur B — Go-Live-Reife (Blocker, vor öffentlicher Bewerbung!)
3. **Professionelles Design** — Landingpage + Gesamt-Politur (raus aus „vibe-coded").
4. **Auth richtig** — Bestätigungsmails, „Passwort vergessen", Confirm-Passwort
   raus. (Supabase kann das out-of-the-box: Dashboard-Config + eine Reset-Seite.)
5. **Rechtliches** — Impressum, Datenschutzerklärung, ggf. AGB + Cookie-Hinweis.
   **In DE/EU gesetzliche Pflicht** (TMG/DSGVO) → Abmahn-Risiko ohne. Braucht echte
   Angaben + idealerweise kurze juristische Prüfung.

**Empfohlene Reihenfolge:** #1 → #3 → #4 → #5 → #2. (Hero-Feature zuerst, dann die
Landing, die es zeigt, dann das eigentliche Go-Live-Tor, dann Distrikt-Tiefe.)

### Später / Backlog
- ML-Taste-Match auf Distrikt-Ebene (wenn genug Daten — Datennetzwerk-Effekt).
- **X-Social-Import** („wer von meinen Follows ist hier?"). Idee ✅, aber X-API zum
  Auslesen der Follow-Liste ist seit Musk teuer/limitiert. Leichter Pfad: **Login
  mit X (OAuth) + Handle-Matching**, statt der teuren Follow-Graph-Abfrage.

## Badge-Ideen (Startset)
- 🌆 15 / 25 / 50 Millionenstädte
- 🌍 Alle Kontinente
- ⚡ 3 Länder in einem Monat
- 🏙️ (später) X Distrikte · 👥 „Reise-Seelenverwandter gefunden"

## Kleiner offener Rest
- `OPENROUTER_API_KEY` in Coolify setzen (sonst AI-Diktat-Eingabe in Prod → 502).
