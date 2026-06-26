import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum — ranking.place",
  description: "Anbieterkennzeichnung gemäß § 5 DDG.",
  robots: { index: false, follow: true },
};

// Minimal Impressum per § 5 DDG (formerly TMG). For a private hobby project the
// legally required fields are: full name, postal address, and a quick way to
// contact (email). Fill the [PLACEHOLDER]s with your real data before deploying —
// an Impressum with fake/missing address is itself an Abmahn-risk.
export default function ImpressumPage() {
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← ranking.place
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-foreground">Impressum</h1>

        <section className="mt-8 space-y-2 text-foreground">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Angaben gemäß § 5 DDG
          </h2>
          <p>
            Julius Rummel
            <br />
            Wedauer Str. 3
            <br />
            45481 Mülheim an der Ruhr
            <br />
            Deutschland
          </p>
        </section>

        <section className="mt-8 space-y-2 text-foreground">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Kontakt
          </h2>
          <p>
            E-Mail:{" "}
            <a
              href="mailto:rummeljulius@gmail.com"
              className="text-primary hover:underline"
            >
              rummeljulius@gmail.com
            </a>
          </p>
        </section>

        <section className="mt-8 space-y-2 text-foreground">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p>
            Julius Rummel
            <br />
            (Anschrift wie oben)
          </p>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          ranking.place ist ein privates, nicht-kommerzielles Hobbyprojekt.
        </p>
      </article>
    </div>
  );
}
