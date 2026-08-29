# Session Diary — ranking.place (City Ranking App)

Ausführlichere Historie als die Git-Commits: **was** wir gemacht haben und vor allem
**warum**. Wird nach jeder etwas größeren Änderung aktualisiert. Neueste Einträge oben.

Format pro Eintrag: Datum · Was · Warum · Auswirkung/Status · ggf. offene Punkte.

---

## 2026-08-25 · Städte-Katalog: Auth-Check nachgezogen + Dubletten-Ursache behoben

**Zwei Befunde von heute Vormittag abgearbeitet.**

### 1. `POST /api/cities` hatte keinen Auth-Check

Der Endpunkt prüfte nur ein Rate-Limit (20/Min pro IP) und schrieb dann in `cities` —
**ohne `getCurrentUserId()`**. Jeder im Netz konnte anonym beliebige Städte anlegen. Genau
deshalb entstand heute die zweite Dubai-Zeile, obwohl der eigentliche Visit-Request scheiterte:
der Städte-Schritt fragt niemanden. Kein Leseleck (RLS + keine Policies), aber unkontrollierter
Datenmüll in der Tabelle, die Stats, Millionenstadt-Zählung und Community-Ratings speist.
Jetzt dasselbe Muster wie in allen anderen Write-Endpunkten: Session lesen, sonst 401.

### 2. Dieselbe Stadt landete mehrfach im Katalog

**Befund in Prod:** drei Dubletten — Berlin, Hamburg, Dubai. Muster jedes Mal identisch: eine
Seed-Zeile vom 12.03. mit gerundeten Koordinaten und ohne `externalId`, dazu eine später
geocodete Zeile mit präzisen Koordinaten und `relation/…`-Id.

**Ursache:** Der Unique-Key ist `[name, country, latitude, longitude]`. Dieselbe Stadt zweimal
geocodet ergibt minimal verschiedene Koordinaten → der Key greift nicht → neue Zeile. Der Client
fing das über einen 409-Fallback ab (Liste holen, nach name+country suchen), aber der 409 kommt
eben nur bei *exakt* gleichen Koordinaten. Folge: gespaltene Städte verfälschen Stats und
Community-Ratings — und wenn die neue Zeile keine `population` hat (Nominatim liefert sie nicht
immer), zählt die Stadt nicht mehr als Millionenstadt.

**Fix — `POST /api/cities` ist jetzt find-or-create:**
- Kandidaten über `externalId` ODER name+country (case-insensitive) suchen.
- Treffer akzeptieren, wenn die `externalId` exakt passt oder die Koordinaten **< 100 km**
  auseinanderliegen. Der Radius trennt „dieselbe Stadt, anders geocodet" (Dubai: 15 km) von
  „zwei Orte mit gleichem Namen" (die vielen US-Springfields liegen hunderte km auseinander).
- Beim Treffer wird ergänzt, was die neue Geocodierung weiß und die Zeile nicht: fehlende
  `population` (treibt das Millionenstadt-Badge) und fehlende `externalId` (macht den nächsten
  Treffer exakt).
- Antwort: **200** bei Treffer, **201** bei Neuanlage — beide mit der Stadt im Body.
- Damit entfällt die 409-Akrobatik in `VisitForm.handleCitySelect` und `CityStep.resolveCityId`;
  beide wurden entschlackt. `VisitForm` zeigt jetzt zusätzlich einen Fehler an, wenn die Stadt
  nicht aufgelöst werden konnte, statt stillschweigend ohne `cityId` weiterzumachen.

**Kein Schema-Eingriff.** Der Unique-Key bleibt wie er ist — die Logik davor verhindert den
Duplikat-Fall, ohne Migration und ohne Risiko für bestehende Zeilen.

**Datenbereinigung in Prod** (eine Transaktion, vorher auf Konflikte mit dem Visit-Unique-Key
`[user_id, city_id, start_date]` geprüft — keine):
- Überlebende Zeile je Paar = die mit den meisten Visits; sie bekam die `externalId` (und bei
  Dubai den `state`) der Dublette.
- Visits der Dubletten umgehängt, **dann** gelöscht (die FK cascade hätte sie sonst mitgerissen).
- Ergebnis: Berlin 4+1 → **5 Visits**, Hamburg 2+1 → **3**, Dubai **2**; `visits` gesamt 122,
  keine Dublette mehr im Katalog.

**Verifikation:** `tsc --noEmit`, `eslint` und `next build` grün; Dubletten-Abfrage in Prod
liefert 0 Zeilen.

**Am Rande:** `src/hooks/useCities.ts` hat keinen einzigen Aufrufer mehr — der Hook holte die
komplette Städteliste und wurde nur vom alten 409-Fallback gebraucht. Kandidat zum Löschen.

---

## 2026-08-25 · Coolify-Auto-Deploy war seit dem 11.08. tot — Webhook-URL repariert

**Ausgangslage:** Der Bugfix (`559d652`) lag auf `main`, aber auf www.ranking.place lief
weiter das Image `3dfeae8` vom 26.06. Coolify hatte den Push nicht mitbekommen.

**Diagnose (alles gemessen):**
- `application_deployment_queues` für App 5: letzter Eintrag `3dfeae8`, 26.06. — für `559d652`
  war nichts eingereiht.
- Coolify-Logs: in 20 Minuten **kein einziger Webhook-Request** angekommen. Coolify hat also
  nicht abgelehnt, es wurde nie gefragt.
- `is_auto_deploy_enabled = true` — an der Einstellung lag es nicht.
- `http://92.5.112.7:8000/` → Timeout. `https://coolify.juliusrummel.de/webhooks/source/github/events`
  → antwortet.
- **Beweis an der Quelle:** `GET /app/hook/config` der GitHub-App `prickly-porpoise-ikwok4skcc0g4`
  (app_id 2302285) lieferte `"url": "http://92.5.112.7:8000/webhooks/source/github/events"`.

**Ursache:** Die Webhook-URL wird beim Anlegen der GitHub-App **fest in GitHub geschrieben** und
wandert NICHT mit, wenn die Coolify-Instanz umzieht. Die App wurde am 16.11.2025 angelegt, als
Coolify noch unter `IP:8000` lief. Am 11.08.2026 zog Coolify hinter `coolify.juliusrummel.de` und
Port 8000 wurde geschlossen — seitdem laufen alle Push-Events ins Leere. Der Push vom 25.08. war
der erste auf `main` seit dem 26.06., deshalb fiel es erst jetzt auf.

**Was gemacht wurde (reproduzierbar):**
1. App-JWT (RS256, 9 Min gültig) mit dem in Coolify hinterlegten Private Key der GitHub-App
   signiert — komplett **innerhalb** des `coolify`-Containers via `php artisan tinker`, damit
   weder Key noch JWT das System verlassen.
2. `PATCH /app/hook/config` → URL auf `https://coolify.juliusrummel.de/webhooks/source/github/events`,
   anschließend per `GET` verifiziert.
3. `GET /app/hook/deliveries` → die fehlgeschlagene Zustellung des Pushes identifiziert:
   id `3838990641421901824`, repo `JuliusRu/City-Ranking`, ref `refs/heads/main`, after `559d652`,
   **Status 502**.
4. `POST /app/hook/deliveries/3838990641421901824/attempts` → 202. Bewusst nur diese eine
   erneut zugestellt, nicht die der anderen Repos.
5. Coolify reihte daraufhin Deployment 268 ein (`in_progress`), Docker-Build auf dem VPS,
   ~5 Minuten, danach Container mit Image-Tag `559d652`.
6. Temporäre Skripte und das JWT im Container gelöscht (`/tmp/gh_*.php`, `/tmp/gh_jwt.txt`).

**Verifikation (live gegen www.ranking.place):**
- Container-Image `3dfeae8` → **`559d652`**, Queue-Status `finished`.
- `POST /api/visits` mit `comment: null` → vorher **400** (`expected string, received null`),
  jetzt **401** (Validierung bestanden, nur Session fehlt). Das ist der präzise Live-Marker:
  die Validierung läuft im Code VOR dem Auth-Check, deshalb lässt sich der Fix ohne Login prüfen,
  ohne dass etwas geschrieben wird.
- `/`, `/login`, `/api/cities/search?q=Tokyo` → jeweils 200.

**Nebenbefunde:**
- Alle 15 letzten Webhook-Zustellungen der GitHub-App waren 502 — betroffen waren
  `project-overview`, `AlphaCap-Database`, `Media-Knowledge`. **Keines davon ist eine Coolify-App**,
  es hängt also kein weiterer Deploy fest. Manuelle Deploys aus der Coolify-Oberfläche waren nie
  betroffen (q-matrix-rcm am 18.08.) — nur der automatische Auslöser war tot.
- **Env-Dubletten bei App 5:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` und
  `OPENROUTER_API_KEY` existieren je zweimal. Die Werte sind **identisch** (über SHA-256-Fingerprint
  verglichen, ohne die Werte auszugeben) → harmlos, reine Aufräumarbeit in der Oberfläche.
  Nebenbei erledigt: `OPENROUTER_API_KEY` IST in Coolify gesetzt — der offene Punkt aus dem
  26.06.-Eintrag ist damit abgehakt.
- **Deploy-Rahmenbedingungen der App:** Build-Pack `dockerfile` (`/Dockerfile`), Port 3000,
  **kein Healthcheck aktiviert** (Coolify wartet also nicht auf eine gesunde neue Instanz, bevor
  Traefik umschwenkt). VPS: 1 ARM-Kern, 5,9 GB RAM, **kein Swap**, 29 GB Platte frei — der
  Next.js-Build ist der Engpass, hier ~5 Minuten.

**Lehre fürs nächste Mal:** Zieht die Coolify-Instanz auf eine neue FQDN um, muss die
Webhook-URL in **jeder** GitHub-App von Hand nachgezogen werden. Coolify tut das nicht selbst,
und es fällt erst beim nächsten Push auf — potenziell Wochen später.

---

## 2026-08-25 · Bugfix: „Add Visit" schlug still fehl, wenn das Kommentar-Feld leer war

**Symptom:** Add-Visit-Formular komplett ausgefüllt (Dubai, 16.–23.06., Rating 9.6, Foto,
„privat"), Klick auf „Add Visit" — nichts passiert. Kein Toast, kein Fehler, kein Redirect,
kein Trip in der DB.

**Diagnose (Prod-Belege, nicht geraten):**
- In `cities` liegt eine NEUE Dubai-Zeile mit `created_at = 2026-08-25 14:18 UTC` und **0 Visits**
  → der Vorschritt `POST /api/cities` lief durch, `POST /api/visits` nicht.
- Coolify-Container-Log (`e84w0k4s8kw44ooko08sc0g4`, Image-Tag `3dfeae8`) enthält **kein**
  `POST /api/visits error:` → kein 500. Der Request starb VOR dem DB-Zugriff, also in der
  Zod-Validierung (die returnt ohne `console.error`).
- Alle real über das Formular erzeugten Visits in Prod haben ein Kommentar. Die einzigen mit
  `comment IS NULL` kamen aus dem Onboarding-Flow oder dem Seed — über das Formular hat also
  **noch nie** jemand einen Trip ohne Kommentar anlegen können.

**Ursache (zwei Fehler, die sich gegenseitig versteckt haben):**
1. `createVisitSchema.comment` war `z.string().max(5000).optional()` — **ohne `.nullable()`**.
   Das Formular sendet `comment: comment || null`, bei leerem Feld also `null`. Zod lehnt `null`
   bei `.optional()` ab → 400 „expected string, received null". `updateVisitSchema` hatte
   `.nullable()` längst; im Create war es ein Vergessen-Fehler.
2. `VisitForm.handleSubmit` mappte Validierungs-Issues auf `errors[issue.path]`, gerendert werden
   aber nur `city`, `rating`, `startDate`, `endDate` und `form`. Ein Issue auf `comment` (oder
   `photoUrl`, `visibility`, `districts.*`, `cityId`) verschwand **lautlos** — daher „es passiert
   einfach nichts" statt einer Fehlermeldung.

**Fix:** (a) `comment` in `createVisitSchema` auf `.optional().nullable()`, konsistent mit jedem
anderen optionalen Feld dort. (b) `VisitForm`: nicht-gerenderte Issues landen im Formular-Banner,
`cityId` wird auf das `city`-Feld gemappt. Diese Fehlerklasse kann damit nicht wieder unsichtbar
werden.

**Verifikation:** `tsc --noEmit` grün, `eslint` grün, `next build` grün. Zusätzlich der exakte
Formular-Payload (`comment: null`) gegen das echte `createVisitSchema` geprüft → vorher rejected,
jetzt OK; `endDate < startDate` wird weiter korrekt abgelehnt. Alle anderen Validatoren
gegengeprüft (`venue`, `settings`, `user`, `feedback`) — dort ist `.nullable()` überall gesetzt,
`visit.comment` war der einzige Fall.

**Offen / Befunde am Rand:**
- **Doppelte Dubai-Zeile in Prod:** `cities` hat zwei Dubai/United Arab Emirates —
  `cmqteu4dw…` (25.2/55.27, population 3.33M, 1 Demo-Visit) und `cmt8r27sw…`
  (25.0742823/55.1885624, population NULL, 0 Visits, von heute). Grund: Unique-Key ist
  `[name, country, latitude, longitude]` — dieselbe Stadt mit anderer Geocoding-Präzision legt
  eine neue Zeile an. Die leere Zeile kann weg; der Unique-Key gehört mittelfristig auf
  `[name, country]` oder `externalId` umgestellt (Städte-Splits verfälschen sonst Stats,
  Community-Ratings und „Who else has been here").
- **`POST /api/cities` ist unauthentifiziert** — nur Rate-Limit, kein `getCurrentUserId()`.
  Jeder kann Zeilen in `cities` anlegen; genau deshalb ist die Stadt heute entstanden, obwohl der
  Visit-Request scheiterte. Sollte auf „nur eingeloggt" gehen.

---

## 2026-06-26 · Launch-Vorbereitung: Legal + Link-Vorschau (Ship-30)

**Was:** Drei der vier Pre-Launch-MUST-FIX abgearbeitet (Analytics bewusst auf später vertagt).
1. **Legal (minimal, kein Cookie-Banner):** Neue Seiten `src/app/impressum/page.tsx` (§ 5 DDG,
   echte Daten Julius Rummel/Wedauer Str. 3/45481 Mülheim, Kontakt rummeljulius@gmail.com) und
   `src/app/datenschutz/page.tsx` (schlanke DSGVO-Erklärung, zugeschnitten auf Supabase-Auth,
   Foto-Upload, OpenRouter-AI-Transfer USA, Coolify/Oracle-Hosting). Footer-Links in `Landing.tsx`.
   Beide Seiten `robots: noindex`.
2. **Root-Metadaten + og:image:** `layout.tsx` Titel `City Ranking` → `ranking.place — Your world,
   ranked`, dazu `metadataBase` (Fallback prod-Domain), OpenGraph + Twitter-Card. Neue
   `src/app/opengraph-image.tsx` (Satori-Card, gleiches Muster wie `[handle]/opengraph-image.tsx`).

**Warum:** Public-Launch in DE = Impressums-/Datenschutzpflicht (Abmahn-Risiko). Cookielos +
nur technisch nötige Auth-Cookies → **kein Consent-Banner nötig** = minimaler Aufwand wie gewünscht.
Root-Link (ranking.place) wird beim Ship-30-Posting auf X/LinkedIn geteilt → brauchte eigene
Link-Vorschau (vorher nur `/@handle`-Profile hatten eine).

**Status:** `npm run build` grün, alle drei Routen kompiliert.

**Offen:** (a) **OpenRouter-Key in Coolify-Prod verifizieren** (lokal gesetzt) — sonst AI-Diktat in
Onboarding-Step 0 → 502. (b) **Analytics** (Plausible, cookielos) bewusst vertagt. (c) Nice-to-have:
robots.txt/sitemap/manifest, `error.tsx` rohe error.message, Demo-Personas in Prod.

---

## Stand & nächste Schritte (Resume hier)

**🔐 AUTH/MAIL (2026-06-25, live):** E-Mail-Bestätigung **an** + **Resend** als SMTP-Provider
(Brevo ging nicht — SMS-Verify aus Oman blockiert). Domain `ranking.place` in Resend verifiziert
(DKIM/SPF via Cloudflare „Auto configure"), Absender `noreply@ranking.place`. Supabase: Custom SMTP
(`smtp.resend.com:465`, user `resend`, Passwort = Resend-API-Key) + „Confirm email" an + Redirect-URLs
(`localhost:3000/**`, `www.ranking.place/**`). Code live: `/auth/callback` (OAuth+Recovery-Exchange),
`/auth/reset`, „Passwort vergessen", „Check your email". **Getestet & funktioniert.**
- **✅ Google-Login fertig & live.** OAuth-Client in Google Cloud, Provider in Supabase aktiv.
  **Wichtige Lehre:** Der **`/auth/callback` MUSS client-seitig** sein (Browser-`exchangeCodeForSession`) —
  die Server-Route-Variante setzte Session-Cookies auf eine `NextResponse.redirect`, die der Browser verwirft
  → Nutzer landeten ausgeloggt. Außerdem: lokal **immer `localhost:3000`** testen, NICHT `0.0.0.0:3000`
  (kein „secure context" → Cookies brechen). `/auth/callback` ist aus der Middleware ausgenommen.
- **OFFEN: Google-Consent-Screen „publishen"** (Google Cloud) vor öffentlichem Launch — im „Testing"-Modus
  können sich sonst nur freigegebene Test-Nutzer mit Google einloggen. Test-User
  `aaaservicegraf+ranktest1@gmail.com` in Supabase→Users löschen.
- **OFFEN #5 Rechtliches** (Impressum/Datenschutz) = letzter Go-Live-Blocker.

**📍 STRATEGIE/FOKUS:** siehe `ROADMAP.md` (Repo-Root) — geschärfte Vision „Letterboxd
für Reisen": Millionenstadt-Sammlung (Linse, kein Filter) + Distrikte (Tiefe) + Badges,
sozial, Globe als Sammelbrett. Positionierung gegen Nomad List (nomads.com). Nächste
To-dos priorisiert dort. **Empfohlener Start: #1 Millionenstadt-/Badge-System.**

**🌍 Globe seit 2026-06-25 auf MapLibre GL** (Cesium komplett raus): projection:'globe' +
Atmosphäre/Sterne (startupmap.one-Look), GPU-GeoJSON-Marker (HTML-Marker driften auf der
Kugel!), Light/Dark-theme-aware (CARTO dark-matter/positron), Hillshade-Terrain (AWS-DEM).
Nur `GlobeViewer.tsx` wurde getauscht; Stil-URL ist eine Konstante (swap → OpenFreeMap/MapTiler).


**Branch `feature/profiles-branding-districts` (Stand 2026-06-24):** Großer Social-/Branding-Ausbau,
noch NICHT in `main` gemergt. Enthält: Atlas-Branding + Logo, öffentliche @username-Profile,
Districts, Places, Fotos (Supabase Storage), **Feed + Likes + Kommentare + Follows + Profil-Counts**,
„Who else has been here" + Community-Rating, **Suche (Leute + Städte)**, Mobile-Hamburger + Mobile-Audit,
Mobile-Dev-Workflow (`dev:lan` + Tailscale/Cloudflare-Origins).

**✅ Branch live auf Prod (2026-06-24):** Per `git push origin HEAD:main` deployt; Coolify-Build lief,
`www.ranking.place` läuft mit der neuen Version (verifiziert: /api/search 200, /feed 307).

**AI-Quick-Add (2026-06-24):** `/visits/new` hat einen „✨ From text"-Modus — Freitext/Diktat (Typeless/
Whisperflow) → `/api/visits/parse` ruft OpenRouter (Default `google/gemini-3.1-flash-lite`, ~$0.25/Mio),
extrahiert Felder + geocodet die Stadt → füllt das bestehende Formular vor (manuelle Eingabe bleibt).
**Key:** `OPENROUTER_API_KEY` liegt lokal in `.env.local`; **muss in Coolify-Env gesetzt werden**, sonst
gibt die Parse-Route in Prod 502. Modell per `OPENROUTER_MODEL` überschreibbar.

**✅ Prod-DB migriert (2026-06-24):** Alle 6 ausstehenden Migrationen via `prisma migrate deploy`
auf Prod angewandt (districts, venues, follows_likes, comments, photo_url, **rls_new_tables**).
`migrate status` → „up to date". RLS=true auf allen 6 neuen Tabellen verifiziert (Backstop intakt).
Die `.env`-CLI zeigt auf Prod (direkter IPv6-Host `db.…supabase.co:5432`) und war vom Mac erreichbar.

**Deploy-Sequenz noch offen (in dieser Reihenfolge!):**
1. ✅ Prod-Migrationen (erledigt — „Expand"-Phase, additiv, alte Live-App unberührt).
2. ⏳ **Supabase Storage Bucket `photos`** anlegen (public) + Insert/Delete-Policy auf eigenen Ordner
   (sonst schlagen Foto-Uploads in Prod fehl). Dashboard-Schritt für Julius.
3. ⏳ **Secret Rotation (#3)** — DB-Passwort + Supabase-Keys (geleakt) rotieren + in Coolify-Env
   aktualisieren. Launch-Blocker.
4. ⏳ **Branch → `main` mergen** → triggert Coolify-Deploy (= „Code danach"-Phase). ERST nach 2+3.

**Live-Status (Stand 2026-05-28):** ranking.place ist live als **Multi-User-Web-App** — Landing,
Signup/Login (Supabase E-Mail+Passwort), per-User-Journal/Globe, Gating. Web-v1 steht.

**Offener Verifikationspunkt:** Der Cesium-Globe-Fix (`unsafe-eval` in CSP) ist deployt, aber
Julius' Browser-Bestätigung „Globe + 40 Städte sichtbar" stand bei Session-Ende noch aus →
morgen zuerst kurz prüfen.

**Lokal entwickeln:** `docker compose up -d` (Dev-DB auf **:5433**) → `npm run dev` (**:3000**).
Login lokal/prod: rummeljulius@gmail.com.

**Architektur-Merkpunkte (wichtig!):**
- Auth ist **client-seitig** (Supabase-Browser-Client) — **keine Server Actions**, die brechen
  hinter dem Coolify/Cloudflare-Proxy (ID-Skew + Cookie).
- CSP braucht `*.supabase.co` (connect-src) + `unsafe-eval`/`wasm-unsafe-eval` (Cesium).
- Supabase-Env wird im Code von Whitespace bereinigt (Coolify verstümmelte den anon key).
- Prod-DB-Migrationen laufen **manuell** via Pooler-URL (`migrate resolve`+`migrate deploy`);
  Automatisierung in Coolify-Release steht noch aus (#21).

**Nächste Themen (Vorschlag-Priorität):** #3 Secret-Rotation (vor Community-Launch!) · #7
öffentliches Profil `@username` + Teilen (viraler Loop) · #15 Onboarding/Empty-State · #8 Härtung ·
#21 Migrate-Automatisierung. Backlog: #9/#10 (Social), #11/#14 (Restaurants+Pro), #19 (iOS-App).

**Offen aus 2026-06-05 (sofort):** Migration `20260605000000_secure_prisma_migrations_rls`
committen+pushen — Prod-DB hat sie schon, Repo noch nicht (kein Bruch-Risiko, da Coolify kein
auto-`migrate deploy` macht, aber Drift).
**Erledigt 2026-06-05:** Data API im Dashboard abgeschaltet (Integrations → Data API → „Enable
Data API" aus). Verifiziert: `/rest/v1/*` → 503 (tot), `/auth/v1` → 200 (Login intakt). RLS bleibt Backstop.

---

## 2026-06-08 — Stadtteile/Districts (Phase 1) + DevOps-Lektion Migrationen

### Teil 18 — District-Feature (Stadtteile pro Besuch, je mit Rating + Häufigkeit)
- **Warum:** In Großstädten sind Stadtteile „wie eigene Städte". Für „soll ich da hin/leben?"
  zählt, **welches Viertel** gut ist. Kern-Einsicht: zwei **getrennte** Dimensionen pro Stadtteil
  — `frequency` (wie viel man da war) ≠ `rating` (wie attraktiv). Man wohnt evtl. im mittelmäßigen
  Viertel und liebt eins, das man kaum sah.
- **Modell (Katalog-Variante gewählt):** neue Tabellen `districts` (cityId, name, lat, lng, osmId —
  geocodet via Nominatim) + `visit_districts` (visitId, districtId, rating, frequency-Enum
  PASSED_THROUGH/FEW_TIMES/A_LOT/BASED_HERE). Mehrere Districts pro Visit. Katalog (statt Freitext)
  → später „beste Viertel in X" über alle Nutzer + Sub-Pins möglich (Phase 2).
- **Gebaut:** `searchDistricts()` (Nominatim, viewbox um die Stadt + Filter auf suburb/neighbourhood),
  Route `GET /api/districts/search?q&lat&lng`; Visit POST/PUT nehmen `districts[]` und upserten
  Katalog + `visit_districts` **atomar in einer Transaktion** (`syncVisitDistricts`, Replace-Semantik);
  `DistrictPicker`-UI im Visit-Formular (Suche → Zeilen mit Rating-Slider + Häufigkeits-Select);
  **City-Detail-Seite**: „Neighbourhoods"-Sektion, sortiert nach Häufigkeit, „Most visited"-Badge.
- **Status:** tsc + Lint + `next build` grün. Lokal Demo-Daten an Berlin-Visits geseedet
  (Kreuzberg/Mitte/Neukölln). Geocoding-Route live getestet (200). **Nicht committet.**
- **OFFEN Phase 2:** Globe-Sub-Pins, Community-Aggregation, globale Stats-Karte „häufigster Stadtteil".

### Teil 19 — DevOps-Lektion: warum `migrate dev` hier bricht
- `prisma migrate dev` nutzt eine **Shadow-DB** (Wegwerf-DB, in der ALLE Migrationen einmal durchgespielt
  werden). Unsere RLS-Migration `20260605000000` macht `ALTER TABLE _prisma_migrations …` — diese
  interne Tabelle existiert in der Shadow-DB nicht → P3006/P1014. Auf Prod lief sie nur, weil
  `migrate deploy` **keine** Shadow-DB nutzt.
- **Workaround (= unser Standard ab jetzt):** Migration mit `prisma migrate diff --from-url <lokal>
  --to-schema-datamodel … --script` erzeugen (keine Shadow-DB), als `migration.sql` ablegen, mit
  `migrate deploy` anwenden. Lokal: DATABASE_URL muss auf :5433 (`city_ranking`) **überschrieben**
  werden, da die CLI sonst `.env` = **Prod** nimmt!
- **PROD-MIGRATION NOCH AUSSTEHEND:** `20260608000000_add_districts` ist nur lokal angewandt. Vor
  Prod-Nutzung des Features: `DATABASE_URL=<prod-pooler-IPv4-URL> npx prisma migrate deploy` (manuell,
  da Coolify nicht auto-migriert). SQL ist rein additiv (CREATE TABLE/TYPE) → kein Bruch-Risiko für
  bestehende Daten.

### Teil 20 — Neue Kategorie „Places" (Restaurants/Cafés/Bars), eigenständig
- **Warum:** Lokale-Empfehlungen sind der „wo soll ich hin/essen"-Hebel. Julius wollte explizit eine
  **eigenständige Kategorie, NICHT an Stadt/Trip gekoppelt** — eine persönliche Food-&-Drink-Liste.
- **Modell:** `venues` (userId, name, `type`-Enum RESTAURANT/CAFE/BAR/BAKERY/CLUB/OTHER, rating,
  location-Freitext, priceLevel, note, wouldReturn, lat/lng optional für späteren Globe). Direkt am
  User, kein City/Visit-Bezug. Migration `20260608010000_add_venues`.
- **Gebaut:** Validatoren; REST-API `/api/venues` (+`[id]`) GET/POST/PUT/DELETE, user-scoped;
  `useVenues`-Hook; neuer Nav-Punkt **„Places"**; `/places` (Liste mit Typ-Filter-Chips + Karten +
  Löschen), `/places/new` + `/places/[id]` mit `VenueForm`. Middleware-Gating um `/places` erweitert.
- **Status:** tsc + Lint + `next build` grün, Gating/401 verifiziert. 3 Demo-Lokale lokal geseedet
  (Lissabon). **Nicht committet.** Prod-Migration `20260608010000_add_venues` noch ausstehend
  (additiv, gleicher manueller `migrate deploy`-Schritt wie districts).

---

## 2026-06-06 — Öffentliches Profil (#7) gebaut + „Atlas"-Branding festgelegt

### Teil 16 — `@username`-Profile + Teilen (viraler Loop, #7)
- **Warum:** B2C-Wachstum hängt am Teilen-Loop — ein hübscher 3D-Globe ist nur dann ein
  Akquise-Kanal, wenn man ihn öffentlich herzeigen kann. Kern des Pivots „single-player + sharing".
- **Datenmodell war schon da:** Migration `20260528120000_add_auth_profile_visibility` hatte
  `users.username/bio/public_profile` (+ unique/index) und `visits.visibility` (Enum
  PRIVATE/FRIENDS/PUBLIC) bereits angelegt → **kein neuer DB-Migrationsschritt nötig**, nur App-Schicht.
- **URL-Form:** `ranking.place/@julius`. Next reserviert `@`-Ordner für Parallel Routes, daher
  Route als `app/[handle]/page.tsx` + `@`-Präfix-Match im Code; alles ohne `@` → `notFound()`.
  Statische Routen (/login, /settings…) gewinnen gegen das dynamische Segment → keine Kollision.
- **Gebaut:** (1) Settings-UI zum Username-Beanspruchen + Bio + Public-Toggle + Live-Share-Link,
  PATCH `/api/user` erweitert (Username-Regex + Reserved-Liste, P2002→„taken"-409). (2) Geteilte
  Server-Fn `lib/profile.ts:getPublicProfile()` (React `cache()`, strikte Feld-Whitelist — **nie**
  Email/authId, nur PUBLIC-Visits) — **bewusst KEINE separate öffentliche API-Route** (weniger
  Angriffsfläche; Seite braucht Daten eh server-seitig für SSR+OG). (3) `app/[handle]/page.tsx`
  rendert read-only Globe (neue `GlobeStage`-Komponente aus `GlobeWrapper` extrahiert, `readOnly`
  blendet Edit/Add aus) + Profil-Header. (4) `opengraph-image.tsx` (dynamische OG-Karte via
  `next/og` ImageResponse — kein Cesium-Screenshot, da WebGL server-seitig nicht geht; CSP
  irrelevant, weil Crawler server-zu-server holen).
- **Status:** tsc + Lint + `next build` grün. `public_profile` default `false` → ändert für
  bestehende Nutzer nichts. **Noch nicht committet/gepusht.**
- **Sichtbarkeit ENTSCHIEDEN (2026-06-08): Variante A — profil-weit.** Ein genereller Toggle
  (`public_profile`) entscheidet alles: ist er an, sind **alle** Visits/Listen öffentlich sichtbar;
  ist er aus, ist die Seite offline (404). Kein Per-Visit-Schalter in v1. Umsetzung: `visibility`-Filter
  in `getPublicProfile()` entfernt (zeigt jetzt alle Visits); Settings-Text angepasst. Die
  `visits.visibility`-Spalte bleibt im Schema für ein späteres granulares/Friends-only-Modell.

### Teil 17 — Corporate Identity „Atlas" (Naturfarben)
- **Warum:** Branding vor weiterem Feature-Bau, damit der Globe „herzeigbar" wird.
- **Gewählt:** Richtung „Atlas" — erdige, warme, premium Palette (altes Kartenwerk). Rollen klar
  getrennt: **Himmelblau `#5B9BB5` = Primary/Marke**, **Salbeigrün `#7A9B5E` = Erfolg**,
  **Terrakotta `#C08552` = warmer Akzent**, Espressobraun = Leinwand. (Zwischenzeitlich kurz
  „Horizon" gewählt, dann auf Atlas umgeschwenkt.)
- **Umgesetzt:** Alle Tokens in `globals.css` neu belegt (Dark = Default + Light), zwei neue Tokens
  `--leaf`/`--earth` (+ `@theme inline` → `bg-leaf`/`text-earth` in Tailwind). OG-Bild farblich
  nachgezogen. Rein kosmetisch, über Tokens → wirkt automatisch app-weit. **Noch nicht committet.**
- **Scratch:** `branding-preview.html` im Repo-Root war das Abstimmungs-Board (3 Richtungen, dann
  Atlas-Sheet) — kann gelöscht werden, nicht committen.

---

## 2026-06-05 — Supabase-Security-Advisor: RLS-Fix auf `_prisma_migrations`

### Teil 15 — „rls_disabled_in_public" untersucht & behoben
- **Auslöser:** Supabase-Advisor-Mail (CRITICAL, „Table publicly accessible", Projekt
  `gvrocksdppdidkqwbrsx`). Verschärft dadurch, dass der anon key seit dem Client-Auth-Umstieg
  **öffentlich** im Browser-Bundle liegt.
- **Diagnose (empirisch, nicht geraten):** CLAUDE.md behauptete „Data API disabled" + „RLS überall an" —
  **beides falsch**. REST-Probe mit anon key: `/rest/v1/*` liefert HTTP 200 → **Data API ist erreichbar**.
  `pg_class.relrowsecurity` zeigte: die 4 App-Tabellen (cities/visits/users/user_settings) haben **RLS an**
  (anon sah `*/0` → korrekt geschützt), nur **`_prisma_migrations` hatte RLS AUS**. Grants: `anon` +
  `authenticated` hatten dort **SELECT/INSERT/UPDATE/DELETE/TRUNCATE**. = genau der geflaggte Befund.
- **Risiko-Einordnung:** Datenleck **gering** (Tabelle enthält nur Migrationsnamen/Checksums/Zeitstempel,
  keine Userdaten/Secrets). Integrität/Verfügbarkeit **mittel** (anon könnte TRUNCATE/Tampering → künftiges
  `migrate deploy` bricht). Kein Daten-GAU, aber wegen public key zügig gefixt.
- **Fix Ebene 1 (Code/DB):** neue Migration `20260605000000_secure_prisma_migrations_rls`:
  `ALTER TABLE _prisma_migrations ENABLE ROW LEVEL SECURITY` + REVOKE der anon/authenticated-Grants.
  Portabel via `DO`-Block (REVOKE nur wenn Rolle existiert → crasht nicht auf lokaler Dev-DB ohne
  Supabase-Rollen). `postgres` *besitzt* die Tabelle → bypasst RLS → Prisma läuft unverändert (Beweis:
  migrate deploy konnte sich selbst in die Tabelle schreiben). Auf **Prod** angewendet (`migrate deploy`,
  direkter Host). Dev-DB (5433) lief nicht → wird beim nächsten Start nachgezogen.
- **Verifiziert:** DB → `_prisma_migrations` relrowsecurity=t, keine anon/authenticated-Grants mehr.
  REST → anon bekommt jetzt `HTTP 401 permission denied for table _prisma_migrations`. ✅
- **Fix Ebene 2 (Dashboard, ERLEDIGT):** Data API abgeschaltet (Integrations → Data API → „Enable Data
  API" aus + Save). App nutzt PostgREST nie (nur GoTrue `/auth/v1` + Prisma direkt) → komplette
  REST-Angriffsfläche entfernt. Verifiziert: `/rest/v1/*` → 503 PGRST002, `/auth/v1/settings` → 200.
- **Doku korrigiert:** CLAUDE.md (Architecture) + DEPLOYMENT.md auf die Realität gebracht (RLS überall an,
  keine Policies = API-Rollen denied, Data API „should be disabled").

## 2026-05-28 — Pivot zu B2C + Fundament-Setup

### Kontext / Ausgangslage
ranking.place war ein **Single-User-Prototyp** (nur Julius' Daten: 1 User, 28 Städte,
39 Visits). Stack: Next.js 16 (App Router), Prisma, Supabase Postgres (EU Free),
CesiumJS-Globe, Coolify auf Oracle-VPS, Cloudflare DNS.

### Teil 1 — Die Seite war down, in 3 Schichten repariert
1. **CSP-Nonce-Bug** (Commit `ac73f16`): Die Middleware setzte die Content-Security-Policy
   nur auf der *Response*. Next.js liest den Nonce aber aus den *Request*-Headern, um seine
   Inline-Skripte zu stempeln. Folge: Inline-Skripte ohne Nonce → von der CSP blockiert →
   keine Hydration → weiße Seite. **Fix:** CSP zusätzlich auf die Request-Header setzen +
   `await headers()` im Root-Layout (erzwingt dynamisches Rendering, sonst werden statisch
   prerenderte Seiten ohne Nonce ausgeliefert). *Warum dynamisch:* nur dann kann Next.js den
   per-Request-Nonce in die Skripte schreiben.
2. **Build schlug fehl:** Coolify baute mit **Nixpacks** (Node 18) statt mit der Dockerfile
   (node:22). Next 16 braucht ≥20.9 → `next build` brach ab. **Fix:** Build-Pack in Coolify
   auf **Dockerfile** umgestellt. *Warum Dockerfile:* version-gepinnt + behandelt
   `output: standalone` korrekt; Nixpacks ignoriert beides.
3. **API 500er:** Der Container konnte die DB nicht erreichen. Grund: Supabase hat den
   *direkten* DB-Host `db.<ref>.supabase.co` auf **IPv6-only** umgestellt (IPv4-Deprecation),
   und Docker-Container haben standardmäßig kein IPv6. *Warum es früher ging:* im April hatte
   der Host noch eine IPv4-Adresse. **Fix:** `DATABASE_URL` auf den **IPv4-Pooler** (Supavisor)
   umgestellt: `aws-1-eu-west-1.pooler.supabase.com:5432`, User `postgres.<ref>`, Session-Mode.
   Verifiziert: liest die 28 Städte. → App wieder live.

### Teil 2 — Strategische Richtung
Entscheidung: ranking.place wird Julius' **ship-or-die-Projekt** (alle 30 Tage shippen oder
raus aus der Community). Aus dem Privat-Tool soll ein **B2C-Freemium-Produkt** werden:
Reise-Journal + soziales Netzwerk (vergleichen/teilen/inspirieren), später Restaurants/Bars
pro Stadt. Wedge: schöne, teilbare Orte-Rangliste für digitale Nomaden — besser als eine
Google-Maps-Liste.

**Leitprinzip Architektur:** "scale-ready, not scaled" — irreversibel teure Entscheidungen
(Datenmodell, Auth, stateless, URL/Username-Schema, per-User-Scoping ab Tag 1) jetzt sorgfältig;
billig nachrüstbares (Redis, horizontale Skalierung, Job-Queues, Tile-Provider) erst bei Last.

**Reihenfolge-These:** Single-Player + Teilen ZUERST, soziales Netz später (Social braucht
kritische Masse; Teilen ist der Wachstums-Loop; sicherer Scope ist kleiner).

### Teil 3 — Plan-Review (Lücken gefunden)
Geprüft am Code: **Städte sind bereits ein geteilter, kanonischer Katalog** (`City` hat keine
userId, `@@unique([name,country,lat,lng])`) → Vergleich/Aggregation architektonisch ok.
Gefundene Lücken → in die Task-Liste eingearbeitet: echter **Migrations-Workflow** (statt
`db push` gegen Prod), **getrennte Dev-DB**, **Custom SMTP** für Magic-Links, **OG-Images+SEO**
(viraler Loop), **Bot-Schutz** (Turnstile), **Authz-Tests**, **Monetarisierung** als eigener
Strang, **Lists/Trips** als Entitäten, sowie Backlog (Onboarding, Analytics, Storage, i18n,
Mobile/PWA, Tile-Provider, Ops/CI, Legal, Account-Verwaltung).

### Teil 4 — Build gestartet (Fundament)
- Task-Liste auf 23 Tasks umgebaut (v1 = #1–#8 + #12/#13; später #9–#11, #14; Backlog #15–#23).
- Aktueller Auth-Stand: `src/lib/auth.ts` → `getCurrentUserId()` gibt hart `"default-user"`
  zurück. Das ist die *eine* Naht, die beim echten Login ersetzt wird — Scoping ist also schon
  halbwegs zentralisiert.
- **In Arbeit (Task #12):** Migrations-Workflow + Dev-DB. *Warum zuerst:* Login braucht
  Schema-Änderungen (authId, username, visibility), und Schema-Änderungen auf einer DB mit
  echten Daten brauchen versionierte Migrationen + eine Dev-DB (nicht gegen Prod entwickeln).
  - Gemacht: Baseline-Migration `prisma/migrations/0_init/migration.sql` offline aus dem
    aktuellen Schema erzeugt (`prisma migrate diff --from-empty`, keine DB nötig) +
    `migration_lock.toml`. `db:migrate:deploy`-Script ergänzt. `.env.example` dokumentiert
    Dev (lokales Postgres) vs. Prod (Supabase-Pooler).
  - `.env.example` zeigte bereits auf lokales Postgres (`localhost:5432/city_ranking`),
    passend zur vorhandenen `docker-compose.yml` → Dev-DB ist im Prinzip schon angelegt.
  - **Dev-DB validiert (Task #12 erledigt):** `docker compose up -d`, `migrate deploy` wendet
    `0_init` an, `db:seed` füllt 1 User / 28 Städte / 39 Visits. Workflow läuft end-to-end.
  - **Stolperfalle (wichtig fürs Verständnis):** Auf der Dev-Maschine lauscht ein **nativer
    Postgres** (Postgres.app/Homebrew) auf `127.0.0.1:5432` + `[::1]:5432` und verdeckt bei
    `localhost` den Docker-Container (der auf `*:5432` published war). Folge: `migrate deploy`
    landete im nativen Postgres (alte `city_ranking` mit Tabellen → P3005 „schema not empty"),
    während der Container leer war. **Fix:** Container-Port auf **5433** (`docker-compose.yml` +
    `.env.example` angepasst), seither eindeutig der isolierte Dev-Container.
  - **Verschoben nach Task #21 (Ops):** (a) Baseline `0_init` einmalig auf der **Prod**-DB als
    angewandt markieren (`migrate resolve --applied 0_init`); (b) `migrate deploy` in den
    Coolify-Release-Schritt einhängen (Standalone-Runner ist schlank, Prisma-CLI nicht dabei).

### Teil 5 — Auth-Schema-Änderungen + Supabase-Libs (Task #4 anteilig, #1 begonnen)
- Entscheidung: **Supabase Auth, nur Google** (kein Magic-Link/X/LinkedIn vorerst). Damit
  entfällt der Custom-SMTP-Bedarf für v1.
- Schema erweitert + migriert (Dev-DB 5433, Migration
  `20260528120000_add_auth_profile_visibility`): `users.auth_id` (unique, Link zur Supabase-
  Auth-UID), `users.username` (unique + Index), `users.bio`, `users.public_profile`;
  `visits.visibility` (Enum PRIVATE/FRIENDS/PUBLIC, Default PRIVATE).
  *Warum nur diese Felder:* die auth-/v1-kritischen + retrofit-teuren. Generisches Place,
  List/Trip, Follow/Events bewusst **aufgeschoben** auf ihre Feature-Phasen (#7/#9/#10/#11) —
  keine spekulativen Leertabellen.
- `@supabase/ssr` + `@supabase/supabase-js` installiert.
- Migration deterministisch erzeugt: `prisma migrate dev` ist non-interaktiv nicht nutzbar →
  per `migrate diff --from-url <dev> --to-schema-datamodel` SQL erzeugt, dann `migrate deploy`.

### Teil 6 — E-Mail+Passwort-Auth gebaut (Task #1 Kern, #2 Routen gescopt, #4 fertig)
- Entscheidung verfeinert: **E-Mail+Passwort zuerst, Google später** (kein externer OAuth-Provider
  nötig → autonom baubar/testbar). Anon key von Julius erhalten.
- Implementiert:
  - `lib/supabase/server.ts` + `client.ts` (@supabase/ssr).
  - Middleware: Supabase-Session-Refresh + Cookie-Handling **sauber mit der CSP/Nonce-Logik
    zusammengeführt** (Reihenfolge: requestHeaders mit Nonce+CSP → response → getUser → Response-Header).
  - `lib/auth.ts`: `getSessionUser()` + async `getCurrentUserId()` (legt lokales Profil per `authId` an).
  - Alle 6 API-Routen + 2 Server-Pages auf Session-User gescopt; unauth → 401 (Routen) bzw.
    `redirect("/login")` (Pages). Neuer Helper `apiUnauthorized()`.
  - `/login` (Sign in / Sign up) mit zwei Server-Actions; Logout-Action; Header-„Sign Out" verdrahtet.
  - `.env.local`: Dev = lokale DB (5433) + gehostetes Supabase für Auth.
- Lokal verifiziert: Dev-Server bootet sauber, `/login` rendert, `/api/stats` & `/api/cities?withStats`
  unauth → 401, keine Compile-/React-Fehler (Button-`name`+Funktions-`formAction`-Bug → via zwei
  getrennte Actions `login`/`signup` behoben).
- **Noch im Browser zu verifizieren (Julius):** echter Signup/Login. (a) Supabase-Dashboard →
  „Confirm email" für jetzt **aus**; (b) reservierte Domains wie example.com werden abgelehnt → echte
  E-Mail nutzen.
- **Bewusst offen:** nach Login ist der Account leer — die 39 Visits hängen am `default-user`
  (Migration = Task #5). Logged-out-Gating der Hauptseiten kommt mit der Landing (#6).

### Teil 7 — Multi-User-Migration: Account verknüpft (Task #5)
- `rummeljulius@gmail.com` in Supabase angelegt (uid `ad5e5f95-…`). Der bestehende `default-user`
  (39 Visits) wurde im Dev-DB mit dieser `auth_id` + E-Mail verknüpft → beim Login erscheinen
  Julius' Daten sofort (keine Datenkopie, nur Identität angehängt).
- **`session=false` beim Signup → „Confirm email" ist im Supabase-Dashboard noch AN.** Login geht
  erst nach (a) „Confirm email" ausschalten oder (b) Klick auf den Bestätigungslink in der Mail.
- Prod-Seite der Migration passiert später beim Deploy (Prod-DB hat die neuen Spalten noch nicht).

### Teil 8 — Login funktioniert + iOS-App in die Planung
- **Login verifiziert:** nach dem Confirm-Klick liefert `signInWithPassword` (rummeljulius@gmail.com)
  session=true, uid `ad5e5f95-…` (= verknüpfter `default-user` mit 39 Visits). Auth steht → Task #1 ✅.
  (Stolperstein war nur: „Confirm email" wirkt nicht rückwirkend; Bestätigungslink musste geklickt werden.)
- **Neue Richtung: Produkt auch als native App mit iOS-Fokus.** War vorher nur als „Mobile/PWA"
  (#19) angedeutet, jetzt explizit. Architektur-Konsequenz (in #19 + product-vision festgehalten):
  **API-first** — die bestehende `/api/*` + Supabase-Auth sind schon app-tauglich; Logik in der
  API-Schicht halten, damit Web + iOS dasselbe Backend nutzen. Empfehlung Expo/React Native.
  Knackpunkt: Cesium-Globe ist web-lastig → auf iOS native Map/Globe; „Sign in with Apple" nötig.

### Teil 9 — Landing + Gating (Task #6) + Middleware-Location-Bug gefixt
- `/` ist jetzt Server-Component mit Auth-Weiche: ausgeloggt → **Landing** (Marketing + CTA),
  eingeloggt → Globe (nach `GlobeClient` ausgelagert, weil `dynamic ssr:false` nur in Client-Comps geht).
- Middleware-**Gating**: ausgeloggt + geschützte Route (/cities, /stats, /visits, /settings) → Redirect
  `/login`; eingeloggt auf `/login` → Redirect `/`. APIs behalten ihr eigenes 401; `/` bleibt öffentlich.
- Header: ausgeloggt → „Sign In"-Link; eingeloggt → Nav + Avatar/Logout.
- **Bug gefunden & gefixt:** `middleware.ts` lag im **Projekt-Root**, obwohl das Projekt `src/` nutzt →
  **Turbopack-Dev hat sie ignoriert** (kein CSP, kein Gating; der Prod-Build hatte sie erkannt, daher
  vorher unbemerkt). Verschoben nach **`src/middleware.ts`** → läuft in Dev *und* Prod. Verifiziert:
  geschützte Routen → 307 /login, CSP-Header wieder da.

### Teil 10 — Live auf ranking.place (Prod-Deploy)
- Prod-DB migriert (`0_init` gebaselined via `migrate resolve` + Auth-Migration via `migrate deploy`),
  Prod-`default-user` mit Auth-UID verknüpft (40 Visits).
- Coolify-Env gesetzt (`NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY`, Build- **und** Runtime). `git push` →
  Coolify Docker-Build (Node 22) → Deploy in ~3,5 Min. **Kein Downtime** (Migration additiv, alter
  Build lief bis zum Swap weiter).
- Verifiziert auf ranking.place: `/` = Landing, `/cities` → 307 /login (Gating), `/api/stats` → 401,
  CSP-Nonce-Header aktiv. **Web-v1 ist live: Landing + Auth + Gating + Scoping.**
- Browser-Login-Test durch Julius steht noch aus (Session-basiert, per curl nicht prüfbar).
- **Wichtig, jetzt da öffentlich:** Secrets rotieren (#3, weiterhin offen!); „Confirm email" ist aus →
  keine E-Mail-Verifikation (Bot-/Fake-Accounts möglich → Härtung #8/Turnstile); öffentliches Teilen
  (#7) fehlt noch. Prod-Migrationen liefen diesmal manuell von Julius' Maschine — Automatisierung in #21.

### Teil 11 — Prod-Login-Bug: weg von Server Actions, hin zu client-seitiger Auth
- Symptom auf Prod: Login schlug fehl. Konsole: `POST /login 404` + `UnrecognizedActionError:
  Server Action … was not found on the server`.
- Ursache: Next.js vergibt **Server-Action-IDs pro Build neu**; der Browser hatte Assets eines
  älteren Builds → ID unbekannt → 404. (`allowedOrigins` in next.config ergänzt — war aber NICHT die Ursache.)
- Inkognito beseitigte den 404 (bestätigt Build-Skew/Cache), aber der Login etablierte trotzdem
  **keine Session** (`/api/user` blieb 401) → Server-Action-Cookie-Handling hinter Coolify/Cloudflare
  unzuverlässig.
- **Fix: Auth komplett client-seitig** über den Supabase-Browser-Client (`signInWithPassword` /
  `signUp` / `signOut` im Client, danach `window.location.assign('/')`). Keine Server Actions mehr →
  die ganze Fehlerklasse (ID-Skew, Origin, Cookie) entfällt. `login/actions.ts` + `auth/actions.ts`
  entfernt; Header-Logout client-seitig. Lokal verifiziert (rendert, kein Compile-Fehler);
  Prod-Verifikation durch Julius nach Redeploy. NEXT_SERVER_ACTIONS_ENCRYPTION_KEY damit nicht nötig.

### Teil 12 — CSP: Supabase in connect-src erlauben
- Nach dem Umstieg auf client-seitige Auth rief der Browser direkt Supabase
  (`…supabase.co/auth/v1/token`) — die CSP `connect-src` (nur self + OSM) blockte das.
  (Bei serverseitigem Auth machte der *Server* den Call, daher vorher kein CSP-Thema.)
- Fix: `connect-src` um `https://*.supabase.co wss://*.supabase.co` ergänzt (src/config/csp.ts).
  → Client-Login kann jetzt mit Supabase sprechen. Verifikation durch Julius nach Redeploy.

### Teil 13 — Prod-Login 401: anon key in Coolify durch Whitespace verstümmelt
- Nach der CSP-Freigabe ging der Supabase-Call durch, aber Supabase antwortete **401**
  (= ungültiger apikey, NICHT falsches Passwort — das wäre 400).
- Befund: im Prod-Bundle steckte der anon key **mit Leerzeichen mitten im JWT**
  (`…cm9sZSI6Im   Fub24…`) — der Coolify-Wert wurde beim Einfügen durch Whitespace/Umbruch zerstört
  (die URL war zufällig sauber, daher ging der Request an die richtige Domain).
- Fix (robust, im Code): URL+Key aus der Env mit `.replace(/\s/g,"")` bereinigen — neuer
  `lib/supabase/env.ts`, genutzt von client/server/middleware. JWT/URL enthalten nie Whitespace →
  der Build ist damit immun gegen verunstaltete Coolify-Werte; Coolify muss nicht angefasst werden.

### Teil 14 — Globe (Cesium) braucht unsafe-eval/WASM in der CSP
- Login funktioniert jetzt (anon-key-Whitespace-Fix). Aber Cesium lud nicht:
  `EvalError … 'unsafe-eval' is not allowed` + `WebAssembly.instantiate() … violates CSP`.
- Fix: `script-src` um `'unsafe-eval' 'wasm-unsafe-eval'` ergänzt (src/config/csp.ts).
  Tradeoff: schwächt den XSS-Schutz minimal, ist bei Cesium aber unvermeidbar. Später ggf. nur
  auf die Globe-Routen eingrenzen (statt global).

### Offene Punkte (Stand Ende des Eintrags)
- Dev-DB läuft jetzt isoliert auf `localhost:5433` (geseedet). Nativer Postgres auf 5432
  bleibt unangetastet (hat noch eine alte `city_ranking` + ein von uns versehentlich erzeugtes
  `_prisma_migrations` — harmlos, kann bei Bedarf aufgeräumt werden).
- Login funktioniert ✓ (rummeljulius@gmail.com, nach Confirm-Klick). Offen: Google-Login,
  Prod-Deploy (Prod-DB-Migration + Coolify-Supabase-Env + Push), #2-Integrationstests.
- Nächste Build-Schritte: Multi-User-Migration der Seed-Daten (#5), Logged-out-Gating/Landing
  (#6), Auth-Integrationstests + DB-Authz-Doku (#2-Rest).
- Secrets-Rotation (Task #3) weiterhin offen — DB-Passwort/Keys sind in alten Chats geleakt.

---

## 2026-06-25 — New-user Onboarding Flow (3 Schritte)

**Warum:** Frisch registrierte Nutzer sahen nach Signup nur einen leeren Globe mit
einem kleinen „Add your first visit"-Kärtchen — Aktivierungs-Killer für ein
Logbook+Social-Produkt. Ziel: geführter Erst-Lauf, der (1) erste Städte auf den
Globe bringt, (2) die @username-Identität aktiviert (überspringbar), (3) den
Sammel-Payoff (Millionenstädte/Badges) als Belohnung zeigt. Plan-Datei:
`.claude/plans/synchronous-prancing-thompson.md`.

**Trigger/Gating:**
- Neue Spalte `User.onboardedAt` (Migration `20260625000000_add_onboarded_at`,
  rein additiv: `ALTER TABLE users ADD COLUMN onboarded_at TIMESTAMP(3)`).
- `src/app/page.tsx`: nach `getCurrentUserId()` wird `onboardedAt` geladen; ist es
  `null` → `redirect("/onboarding")`. Markierung erfolgt server-seitig über
  PATCH `/api/user {onboarded:true}` (Sentinel → `onboardedAt = new Date()`), damit
  der Redirect genau einmal pro Account greift.
- `/onboarding` in `middleware.ts` `protectedPrefixes` aufgenommen.

**Schritte:**
- Schritt 1 `CityStep` — Modus „Search" (Default, `useCitySearch`) + „From text" (AI):
  neue Route `POST /api/cities/parse` (chatJSON → Liste `{city,country,rating?}` →
  je `searchCities()` geocodet, dedup, max 12). „Continue" legt pro Eintrag Stadt
  (create-or-find, 201/409) + Visit (`cityId`+`rating`+`startDate=heute`) an.
  Plus „Skip for now".
- Schritt 2 `IdentityStep` — @username (+ optional Bio) via PATCH `/api/user`
  `{username,bio,publicProfile:true}` (gleiche 409-/Validierungs-Logik wie Settings).
  Überspringbar („Maybe later").
- Schritt 3 `PayoffStep` — GET `/api/onboarding/summary` (millionCities + badges +
  city/country count via `badgesForVisits`, gleiche Berechnung wie `lib/profile.ts`).
  CTA „Explore my globe" → markiert onboarded + `window.location.assign("/")`.

**Wiederverwendet (nichts neu gebaut):** `useCitySearch`, `searchCities`,
create-or-find aus `VisitForm.handleCitySelect`, `chatJSON`, `Rating`, `Toast`,
`badgesForVisits`, Badge-Darstellung aus `[handle]/page.tsx`.

**Verifikation:** `tsc --noEmit` grün, `next build` grün (alle 3 neuen Routen),
eslint grün. Gating live geprüft: `/onboarding` → 307 (logged out), 
`/api/onboarding/summary` → 401 (logged out). Migration lokal angewandt
(`localhost:5433`), `prisma generate` ok. Manueller Auth-Flow (Login → 3 Schritte)
steht für Julius im Browser aus.

**OFFEN / Entscheidung für Prod-Deploy:**
- Prod-Migration noch nicht ausgespielt (Coolify migriert NICHT automatisch):
  `DATABASE_URL=<prod IPv4 pooler> npx prisma migrate deploy`.
- **Backfill-Entscheidung:** Bestehende Prod-Nutzer haben `onboarded_at = NULL` und
  würden beim nächsten Besuch ins Onboarding geschickt. Empfehlung: beim Prod-Deploy
  einmalig `UPDATE users SET onboarded_at = created_at WHERE onboarded_at IS NULL;`
  ausführen, damit nur NEUE Signups das Onboarding sehen. (Lokal bewusst NICHT
  gebackfillt, damit der Flow testbar bleibt.)
- Dev-Server nach `next build` neu gestartet (build korrumpiert `.next` für dev →
  `rm -rf .next` + `dev:lan` neu, wie gehabt).

---

## 2026-06-25 — Population beim Geocoding (Millionenstadt-Hook real machen)

**Warum:** Befund direkt nach dem Onboarding-Launch: `population` wurde nur im Seed
gesetzt. Jede Stadt, die ein echter Nutzer über Suche/AI-Parse hinzufügt, kam aus
Nominatim OHNE Einwohnerzahl → `population = null` → zählte NICHT als Millionenstadt.
Der zentrale Sammel-Hook (Payoff-Schritt „X Millionenstädte" + Million-Club-Badge,
laut Produktvision DAS Unterscheidungsmerkmal zu Nomad List) feuerte für reale
Nutzer also gar nicht.

**Fix (keine neue Abhängigkeit):** Nominatim liefert `population` zuverlässig via
`extratags=1` (empirisch an Tokyo/Berlin/Lisbon/Porto/Maastricht/Muscat geprüft).
- `lib/geocoding.ts`: `extratags=1` + `parsePopulation()` → `GeocodingResult.population`.
- `population` durch ALLE City-Create-Pfade geschleust: `visits/parse`, `cities/parse`,
  `VisitForm.handleCitySelect` (+ prefill), `CityStep` (DraftCity/resolveCityId).
  Die `createCitySchema` akzeptierte `population` schon optional → DB-seitig nichts nötig.
- `/api/cities/search` reicht `searchCities`-Ergebnisse durch → trägt population automatisch.
- Definition: Nominatim gibt Stadt-KERN-Einwohner (Lisbon „proper" 545k, nicht Metro ~2,9M).
  Konsistent, gut genug; Schwelle/Definition später ggf. verfeinern.

**Backfill bestehender Städte:** neues Skript `prisma/backfill-population.ts` — re-geocodet
alle Städte mit `population IS NULL` (1,2s-Delay = Nominatim-Politeness), schreibt
population zurück. Idempotent (nur NULL-Zeilen).
- Lokal: 2 Städte enriched (Berlin, Warsaw). Prod: 3 (Astana, Berlin, Warsaw).

**Verifikation/Deploy:** tsc + build grün. Commit `9694894` → push main → Coolify (~2 Min).
Code-Live-Marker: `/api/cities/search?q=Tokyo` (public, keine Auth) liefert jetzt
`population: 13613660` — vorher fehlte das Feld komplett. Prod-Backfill lief bereits
vor dem Code-Deploy (DB-Operation, unabhängig vom Build).

**Hinweis:** Geocoding-Pfad gibt jetzt für JEDE Stadt population mit (auch <1M) — die
million-cities-Zählung filtert in `lib/badges.ts` weiterhin auf ≥1.000.000.

---

## 2026-06-25 (Forts.) — Friends-Beta-Vorbereitung

Mehrere Schritte, alle live:
- **Design-Prototyp** (Commit 553d780): neues `<Container>` (max-w-6xl + Gutter) an Header
  UND Cities-Seite → Kanten richten sich aus; Globe-Sidebar schwebt jetzt (rounded-2xl,
  Schatten, inset) statt an der Viewport-Kante zu kleben. Bewusst nur Cities/Globe (Rest alt
  zum Vergleich). Restliche Seiten + „Entboxen" stehen noch aus.
- **Foto-Upload** (d5bed6e): Browser-seitiges Downscaling auf 2048px JPEG vor Upload → löst
  Julius' 5-MB-Problem, spart Free-Tier-Storage, strippt EXIF/GPS. Hard-Cap auf 10 MB
  (geprüft NACH dem Verkleinern). `src/lib/storage.ts` `downscaleImage()`.
- **Tab-Icon** (df28d7a): App-Logo (volle Marke) als Favicon — `src/app/icon.svg` +
  `apple-icon.png` + multi-res `favicon.ico`. Generator: `scripts/make-icons.cjs`.
- **Demo-Daten auf Prod** (Skript `prisma/seed-demo.ts`): 6 klar markierte Demo-Personas
  („… (Demo)", `@…_demo`, Bio-Tag) mit 77 Visits, Follows/Likes/Kommentaren → Feed/Suche/
  Profile/Globe befüllt für die Tester. Löschen: `DELETE FROM users WHERE email LIKE 'demo+%@ranking.place'`.
- **Feedback-Widget** (cee5f84): Header-Button (Desktop-Pill + Mobile-Menü) → Modal → POST
  `/api/feedback` → neue `feedback`-Tabelle (mit RLS-Backstop). Anonym-tauglich, snapshottet
  username/email. Lesen: `SELECT * FROM feedback ORDER BY created_at DESC`.

**Infra-Stolperstein:** `prisma migrate deploy` gegen Prod schlug P1001 fehl — der direkte
DB-Host ist IPv6-only, Julius' Oman-Netz (CGNAT/VPN) hat keine IPv6-Route. Workaround: über
den **Session-Pooler** `aws-1-eu-west-1.pooler.supabase.com:5432` (User `postgres.<ref>`,
PW aus `.env`) migriert. Siehe Memory [[project_supabase_ipv6_pooler]].

**Offen für Friends-Beta:** Julius' echter Handy-Durchlauf (Signup→Onboarding→Upload). Danach
für Public-Launch: Legal (Impressum/Datenschutz), Design-Rollout über restliche Seiten.
