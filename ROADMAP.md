# ranking.place — Vision & Roadmap

> Strategischer Anker. Geschärft in den Sessions 2026-06-24/25. Bei Richtungs-Fragen
> hier zuerst lesen. Detail-Historie steht in `session_diary.md`.

## Die Idee in einem Satz
**„Letterboxd für Reisen"** — deine Reise-Sammlung, gamifiziert durch Badges,
geteilt mit Menschen.

**Der unterschätzte Kern (2026-06-25):** „sinnlose, aber lustige" Statistiken über
das eigene Leben (Millionenstädte, Flugmeilen, …) sind **kein Gimmick** — sie sind
Identität + Status + Completion-Drive, exakt der Mechanismus von **Strava / Spotify
Wrapped / Untappd**. Nicht dafür entschuldigen, voll reinlehnen. Und: **die Stats
SIND der Moat gegenüber Instagram** — das sagt dir nie „du warst in 23 Millionen-
städten" oder „du bist 4× um die Erde geflogen". → VP: *Quantified Self fürs
Reiseleben, und es macht Spaß.*

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

## Das größere Bild — Layer 0/1/2 (Nordstern mit Disziplin)
Der Name **ranking.place** ist bewusst offen = **Optionalität**, NICHT Freifahrtschein,
jetzt breit zu bauen. Gewinner-Muster: **erst EINE Vertikale tief gewinnen, dann von
Stärke aus expandieren** (Untappd rankte nicht nebenbei Restaurants, Letterboxd keine
Bücher). Jede Idee bekommt einen Layer UND eine Reihenfolge:

| Layer | Was | Wann | Risiko |
|---|---|---|---|
| **0 — Der Keil** | Städte + Distrikte + Globus + Millionenstadt-Score (die Reise-Identität) | jetzt | – |
| **1 — Fun-Stats in der Spur** | Flüge/Meilen/„X× um die Erde"/Flugzeugtypen, Länder/Kontinente, Year-in-Review | als Nächstes (billig, on-brand, viral teilbar) | niedrig |
| **2 — Die Plattform** | „rank anything": Venues, Hotels, Free-Work-Spots, ernst + lustig | erst NACH Traktion in Layer 0/1 | **hoch — Fokus-Killer** |

**Distrikte = die Brücke** von Layer 0 → 2: „beste Distrikte" → später „beste Spots
im Distrikt". Als Brücke, nicht als Startpunkt. (Das `Venue`-Modell liegt im Schema
schon bereit = Grundlage da, aber **bewusst zurückhalten**, bis der Reise-Kern zieht.)

**VP gestaffelt:** heute mit dem **Solo-/Tag-1-Wert** führen (deine Karte, deine Zahl,
dein teilbarer Globus — funktioniert ab dem ersten Nutzer). „Discovery durch Leute"
ist der **spätere Moat**, NICHT der Anmelde-Haken (Cold-Start: noch keine Leute da).

## Prinzipien
- **Fokus schlägt Ideen:** Engpass ist Zeit/Fokus, nicht Ideen. Falsche Frage: „was
  *könnte* man ranken?" (Antwort: alles). Richtige Frage: *„welcher EINE Hook bringt
  einen Beta-Tester dazu, einem Freund den Link zu schicken?"*
- **Anti-Nomad-List:** Emotion/Freude statt Optimierung. Leicht & verspielt, kein Work-Tool.
- **Holistisch, nicht standardisiert:** ein Gesamt-Score + „was dir auffiel" (frei, kein starres Raster).
- **Badges:** wenige, ikonische, status-/teilbare. Faustregel: *„Passt es in eine Bio?"* Sonst kein Badge.
- **Distrikt-Entdeckung menschlich, nicht algorithmisch** (vorerst): „wer hat
  dieses Viertel bewertet?" → Profil → mehr. Der ML-Taste-Match ist nur die
  automatisierte Version desselben Loops → erst viel später (braucht Daten).
- **Globe = das teilbare Sammelbrett.**
- **Web-first ist okay, kein Blocker:** der Kern ist retrospektiv + Identität + sozial
  (wie Letterboxd — niemand loggt im Kino). Nur *In-the-Moment-Erfassen* will native,
  und das ist NICHT der Anmelde-Grund. Das `@handle`-Profil als **Link ohne Install**
  ist sogar ein Wachstums-Vorteil. „Zum Home-Bildschirm" (PWA, Icons schon da) schließt
  die Lücke billig; natives iOS erst bei Traktion.

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
- **Layer 1 — Flüge & Lebens-Stats** *(empfohlener nächster Fun-Hook):* Flüge loggen
  → Meilen, Stunden in der Luft, **„X× um die Erde"**, Airlines, **Flugzeugtypen**
  (Avgeek-Delighter). Hoch teilbar, on-brand, niedriges Scope-Risiko.
- **Layer 2 — „rank anything":** Venues/Restaurants/Bars (`Venue`-Schema da), Hotels,
  Free-Work-Spots. **Erst nach Kern-Traktion** — Fokus-Killer, wenn zu früh.
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
