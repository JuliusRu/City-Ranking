import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { VenueForm } from "@/components/venues/VenueForm";
import type { VenueData } from "@/types";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const venue = await prisma.venue.findFirst({ where: { id, userId } });
  if (!venue) notFound();

  const serialized: VenueData = {
    ...venue,
    createdAt: venue.createdAt.toISOString(),
    updatedAt: venue.updatedAt.toISOString(),
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit Place</h1>
      <Card>
        <VenueForm venue={serialized} />
      </Card>
    </div>
  );
}
