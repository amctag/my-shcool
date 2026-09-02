import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GradeFormForm } from "@/features/school/components/GradeFormForm";

export default function AddGradeFormPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/grade-forms"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to grade forms
      </Link>
      <PageHeader
        title="Add grade form"
        description="Create a new report card layout for an academic year"
      />
      <GradeFormForm />
    </div>
  );
}
