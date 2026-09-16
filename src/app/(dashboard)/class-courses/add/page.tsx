import { BackLink } from "@/components/dashboard/BackLink";
import { ClassCourseForm } from "@/features/school/components/ClassCourseForm";

export default function AddClassCoursePage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/class-courses"
      >
        Back to class courses
      </BackLink>
      <ClassCourseForm />
    </div>
  );
}
