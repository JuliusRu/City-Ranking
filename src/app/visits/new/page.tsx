import { Card } from "@/components/ui/Card";
import { VisitForm } from "@/components/visits/VisitForm";

export default function NewVisitPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Add Visit</h1>
      <Card>
        <VisitForm />
      </Card>
    </div>
  );
}
