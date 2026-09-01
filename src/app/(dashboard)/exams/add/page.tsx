import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ExamScheduleMetadataForm } from "@/features/school/components/ExamScheduleMetadataForm";

export default function AddExamSchedulePage() {
  return (
    <div className="space-y-4">
      <Link
        href="/exams"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to exam schedules
      </Link>
      <PageHeader
        title="Add exam"
        description="Create the exam title, class, grade type, and date. Add courses and times from the list after saving."
      />
      <ExamScheduleMetadataForm />
    </div>
  );
}
