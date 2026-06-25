"use client";

import Link from "next/link";
import { VisitList } from "@/components/visits/VisitList";
import { Button } from "@/components/ui/Button";

export default function VisitsPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">My Visits</h1>
        <Link href="/visits/new">
          <Button>Add Visit</Button>
        </Link>
      </div>
      <VisitList />
    </div>
  );
}
