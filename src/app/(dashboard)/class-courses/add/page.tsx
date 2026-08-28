import Link from "next/link";
import { ClassCourseForm } from "@/features/school/components/ClassCourseForm";

export default function AddClassCoursePage() {
  return (
    <div className="space-y-4">
      <Link
        href="/class-courses"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to class courses
      </Link>
      <ClassCourseForm />
    </div>
  );
}
