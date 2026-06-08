import { Prisma } from "@prisma/client";
import type { VisitDistrictInput } from "@/lib/validators/district";

// Replace a visit's full district set inside a transaction:
//  1. upsert each district into the city's catalog (find-or-create by cityId+name),
//  2. clear the visit's existing VisitDistrict rows,
//  3. recreate them with the given rating + frequency.
// Replace semantics keep create and edit identical: send the full list, or omit
// it entirely (callers pass `undefined` to leave districts untouched).
export async function syncVisitDistricts(
  tx: Prisma.TransactionClient,
  cityId: string,
  visitId: string,
  districts: VisitDistrictInput[]
): Promise<void> {
  // Resolve every input to a catalog District id (refresh coords on the way).
  const links = await Promise.all(
    districts.map(async (d) => {
      const district = await tx.district.upsert({
        where: { cityId_name: { cityId, name: d.name } },
        update: {
          latitude: d.latitude,
          longitude: d.longitude,
          externalId: d.externalId ?? null,
        },
        create: {
          cityId,
          name: d.name,
          latitude: d.latitude,
          longitude: d.longitude,
          externalId: d.externalId ?? null,
        },
      });
      return { districtId: district.id, rating: d.rating, frequency: d.frequency };
    })
  );

  await tx.visitDistrict.deleteMany({ where: { visitId } });

  if (links.length > 0) {
    await tx.visitDistrict.createMany({
      // De-dupe by districtId in case the same district was added twice in the UI
      // (the @@unique([visitId, districtId]) would otherwise throw).
      data: dedupeByDistrict(links).map((l) => ({ visitId, ...l })),
    });
  }
}

function dedupeByDistrict<T extends { districtId: string }>(rows: T[]): T[] {
  const seen = new Map<string, T>();
  for (const r of rows) seen.set(r.districtId, r);
  return Array.from(seen.values());
}
