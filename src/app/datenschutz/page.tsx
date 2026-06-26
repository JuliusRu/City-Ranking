import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — ranking.place",
  description: "Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.",
  robots: { index: false, follow: true },
};

// Lean DSGVO privacy notice tailored to what this app actually does:
// Supabase auth (login cookies + email/password), user photo uploads, the
// OpenRouter AI parse feature, and Coolify/Oracle hosting. No analytics, no ads,
// no third-party tracking — so no cookie-consent banner is required (the only
// cookies set are strictly-necessary auth cookies). Fill the [PLACEHOLDER]s.
export default function DatenschutzPage() {
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← ranking.place
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-foreground">
          Datenschutzerklärung
        </h1>

        <div className="mt-8 space-y-8 leading-relaxed text-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">1. Verantwortlicher</h2>
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:
            </p>
            <p className="text-muted-foreground">
              Julius Rummel
              <br />
              Wedauer Str. 3
              <br />
              45481 Mülheim an der Ruhr, Deutschland
              <br />
              E-Mail: rummeljulius@gmail.com
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">2. Überblick</h2>
            <p>
              ranking.place ist ein privates Hobbyprojekt, mit dem du besuchte
              Städte auf einer interaktiven Karte sammeln und bewerten kannst. Wir
              verarbeiten nur die Daten, die für den Betrieb des Dienstes
              notwendig sind. Es findet <strong>kein Tracking</strong>, keine
              Werbung und keine Weitergabe deiner Daten zu Werbezwecken statt.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">3. Hosting &amp; Server-Logs</h2>
            <p>
              Die Anwendung wird über Coolify auf Servern von Oracle Cloud
              Infrastructure betrieben. Beim Aufruf der Website werden technisch
              notwendige Server-Logdaten (z. B. IP-Adresse, Datum/Uhrzeit,
              aufgerufene Seite, Browsertyp) verarbeitet, um den Dienst sicher
              bereitzustellen. Rechtsgrundlage ist unser berechtigtes Interesse
              am sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">4. Nutzerkonto &amp; Authentifizierung</h2>
            <p>
              Für ein Konto verarbeiten wir deine E-Mail-Adresse und ein
              verschlüsseltes Passwort (bzw. bei Google-Login deine Google-Konto-Kennung).
              Die Authentifizierung erfolgt über Supabase (Supabase Inc.); die
              zugehörige Datenbank wird in der EU betrieben. Rechtsgrundlage ist
              die Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">5. Inhalte, die du erstellst</h2>
            <p>
              Von dir eingegebene Inhalte (besuchte Städte, Bewertungen, Notizen,
              Reisen, hochgeladene Fotos, Profilangaben) werden gespeichert, um den
              Dienst bereitzustellen. Du entscheidest selbst, welche Inhalte du
              öffentlich (z. B. dein öffentliches Profil) oder privat stellst.
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">6. KI-gestützte Eingabe</h2>
            <p>
              Wenn du die optionale Funktion zum Erfassen von Städten/Reisen per
              Freitext oder Diktat nutzt, wird der von dir eingegebene Text zur
              Verarbeitung an OpenRouter (OpenRouter, Inc., USA) übermittelt, um ihn
              in strukturierte Einträge umzuwandeln. Dabei kann eine Übermittlung in
              die USA erfolgen. Die Funktion ist freiwillig; manuelle Eingabe ist
              jederzeit möglich. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO
              (Bereitstellung der von dir angeforderten Funktion).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">7. Zahlungsabwicklung (Pro-Abo)</h2>
            <p>
              Wenn du das kostenpflichtige Pro-Abo abschließt, wird die Zahlung
              über Stripe (Stripe Payments Europe, Ltd.) abgewickelt. Deine
              Zahlungsdaten (z. B. Kreditkartennummer) gibst du direkt bei Stripe
              ein; wir selbst erhalten und speichern keine vollständigen
              Zahlungsdaten, sondern nur eine Kunden- und Abo-Kennung sowie deinen
              Pro-Status. Dabei kann eine Übermittlung in die USA erfolgen.
              Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b
              DSGVO). Weitere Informationen:{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                stripe.com/privacy
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">8. Cookies</h2>
            <p>
              Wir setzen ausschließlich technisch notwendige Cookies, die für den
              Login und die Sitzungsverwaltung erforderlich sind. Es werden keine
              Analyse- oder Marketing-Cookies verwendet. Für technisch notwendige
              Cookies ist keine Einwilligung erforderlich (§ 25 Abs. 2 TDDDG).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">9. Speicherdauer</h2>
            <p>
              Deine Konto- und Inhaltsdaten speichern wir, solange dein Konto
              besteht. Wenn du dein Konto löschst, werden die zugehörigen Daten
              gelöscht. Server-Logs werden nur kurzzeitig zur Sicherstellung des
              Betriebs vorgehalten.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">10. Deine Rechte</h2>
            <p>
              Du hast das Recht auf Auskunft, Berichtigung, Löschung,
              Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch
              (Art. 15–21 DSGVO). Außerdem hast du ein Beschwerderecht bei einer
              Datenschutz-Aufsichtsbehörde. Wende dich für die Ausübung deiner
              Rechte an: rummeljulius@gmail.com.
            </p>
          </section>

          <p className="text-sm text-muted-foreground">
            Stand: Juni 2026.
          </p>
        </div>
      </article>
    </div>
  );
}
