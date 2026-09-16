import { BackLink } from "@/components/dashboard/BackLink";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GradeFormForm } from "@/features/school/components/GradeFormForm";

export default function AddGradeFormPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/grade-forms"
      >
        Back to grade forms
      </BackLink>
      <PageHeader
        title="Add grade form"
        description="Create a new report card layout for an academic year"
      />
      <GradeFormForm />
    </div>
  );
}
