import Link from "next/link";
import { AgendaSectionForm } from "@/features/school/components/AgendaSectionForm";

export default function AddAgendaSectionPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/agenda/sections"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to agenda sections
      </Link>
      <AgendaSectionForm />
    </div>
  );
}
