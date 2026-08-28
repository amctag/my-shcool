import Link from "next/link";
import { CourseForm } from "@/features/school/components/CourseForm";

export default function AddCoursePage() {
  return (
    <div className="space-y-4">
      <Link
        href="/courses"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to courses
      </Link>
      <CourseForm />
    </div>
  );
}
