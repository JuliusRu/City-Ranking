# Session Diary — ranking.place (City Ranking App)

Ausführlichere Historie als die Git-Commits: **was** wir gemacht haben und vor allem
**warum**. Wird nach jeder etwas größeren Änderung aktualisiert. Neueste Einträge oben.

Format pro Eintrag: Datum · Was · Warum · Auswirkung/Status · ggf. offene Punkte.

---

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

### Offene Punkte (Stand Ende des Eintrags)
- Dev-DB läuft jetzt isoliert auf `localhost:5433` (geseedet). Nativer Postgres auf 5432
  bleibt unangetastet (hat noch eine alte `city_ranking` + ein von uns versehentlich erzeugtes
  `_prisma_migrations` — harmlos, kann bei Bedarf aufgeräumt werden).
- Julius-Aktionen für Auth: Supabase-Dashboard (Provider Google aktivieren, später X/LinkedIn-
  Dev-Apps), Custom SMTP (Brevo) hinterlegen, SUPABASE_URL + anon key als Env bereitstellen.
- Secrets-Rotation (Task #3) weiterhin offen — DB-Passwort/Keys sind in alten Chats geleakt.
