import { BackLink } from "@/components/dashboard/BackLink";
import { CourseForm } from "@/features/school/components/CourseForm";

export default function AddCoursePage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/courses"
      >
        Back to courses
      </BackLink>
      <CourseForm />
    </div>
  );
}
