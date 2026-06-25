import { PrismaClient } from "@prisma/client";
import { searchCities } from "../src/lib/geocoding";

// One-off enrichment: cities created before the geocoder returned population
// have population = NULL, so they never count toward the million-cities stat or
// badges. This re-geocodes each such city by "<name>, <country>" and writes the
// OSM population back. Safe to re-run — it only touches rows still NULL.
//
// Run (local):  DATABASE_URL=postgresql://postgres:postgres@localhost:5433/city_ranking npx tsx prisma/backfill-population.ts
// Run (prod):   DATABASE_URL=<prod url> npx tsx prisma/backfill-population.ts

const prisma = new PrismaClient();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const cities = await prisma.city.findMany({
    where: { population: null },
    select: { id: true, name: true, country: true },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${cities.length} cities without population.`);

  let updated = 0;
  let missed = 0;
  for (const c of cities) {
    try {
      // Nominatim asks for ≤1 req/s — stay polite.
      await sleep(1200);
      const results = await searchCities([c.name, c.country].filter(Boolean).join(", "));
      const pop = results[0]?.population ?? null;
      if (pop == null) {
        missed++;
        console.log(`  · ${c.name}, ${c.country} — no population found`);
        continue;
      }
      await prisma.city.update({ where: { id: c.id }, data: { population: pop } });
      updated++;
      console.log(`  ✓ ${c.name}, ${c.country} — ${pop.toLocaleString()}`);
    } catch (e) {
      missed++;
      console.log(`  ! ${c.name}, ${c.country} — error: ${(e as Error).message}`);
    }
  }

  console.log(`\nDone. Updated ${updated}, missed ${missed}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
