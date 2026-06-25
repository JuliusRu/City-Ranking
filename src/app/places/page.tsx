"use client";

import Link from "next/link";
import { VenueList } from "@/components/venues/VenueList";
import { Button } from "@/components/ui/Button";

export default function PlacesPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Places</h1>
        <Link href="/places/new">
          <Button>Add Place</Button>
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Your restaurants, cafés and bars — rated, independent of any trip.
      </p>
      <VenueList />
    </div>
  );
}
