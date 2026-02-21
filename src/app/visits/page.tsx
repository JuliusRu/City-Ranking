"use client";

import Link from "next/link";
import { VisitList } from "@/components/visits/VisitList";
import { Button } from "@/components/ui/Button";

export default function VisitsPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Visits</h1>
        <Link href="/visits/new">
          <Button>Add Visit</Button>
        </Link>
      </div>
      <VisitList />
    </div>
  );
}
