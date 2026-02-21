import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { VisitForm } from "@/components/visits/VisitForm";
import type { VisitWithCity } from "@/types";

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = getCurrentUserId();

  const visit = await prisma.visit.findFirst({
    where: { id, userId },
    include: { city: true },
  });

  if (!visit) notFound();

  // Serialize dates for client component
  const serialized: VisitWithCity = {
    ...visit,
    startDate: visit.startDate.toISOString(),
    endDate: visit.endDate?.toISOString() ?? null,
    createdAt: visit.createdAt.toISOString(),
    updatedAt: visit.updatedAt.toISOString(),
    city: {
      ...visit.city,
      createdAt: visit.city.createdAt.toISOString(),
      updatedAt: visit.city.updatedAt.toISOString(),
    },
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit Visit</h1>
      <Card>
        <VisitForm visit={serialized} />
      </Card>
    </div>
  );
}
