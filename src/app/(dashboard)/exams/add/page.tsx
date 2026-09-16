import { BackLink } from "@/components/dashboard/BackLink";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ExamScheduleMetadataForm } from "@/features/school/components/ExamScheduleMetadataForm";

export default function AddExamSchedulePage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/exams"
      >
        Back to exam schedules
      </BackLink>
      <PageHeader
        title="Add exam"
        description="Create the exam title, class, grade type, and date. Add courses and times from the list after saving."
      />
      <ExamScheduleMetadataForm />
    </div>
  );
}
