import { Card } from "@/components/ui/Card";
import { VenueForm } from "@/components/venues/VenueForm";

export default function NewVenuePage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Add Place</h1>
      <Card>
        <VenueForm />
      </Card>
    </div>
  );
}
