# Session Diary — ranking.place (City Ranking App)

Ausführlichere Historie als die Git-Commits: **was** wir gemacht haben und vor allem
**warum**. Wird nach jeder etwas größeren Änderung aktualisiert. Neueste Einträge oben.

Format pro Eintrag: Datum · Was · Warum · Auswirkung/Status · ggf. offene Punkte.

---

## Stand & nächste Schritte (Resume hier)

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
