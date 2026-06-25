import { Card } from "@/components/ui/Card";
import { VenueForm } from "@/components/venues/VenueForm";

export default function NewVenuePage() {
  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Add Place</h1>
      <Card>
        <VenueForm />
      </Card>
    </div>
  );
}
