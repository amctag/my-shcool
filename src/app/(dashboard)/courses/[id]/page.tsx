import Link from "next/link";
import { CourseForm } from "@/features/school/components/CourseForm";

export default async function ViewCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = Number(id);

  return (
    <div className="space-y-4">
      <Link
        href="/courses"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to courses
      </Link>
      {Number.isInteger(courseId) && courseId > 0 ? (
        <CourseForm courseId={courseId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid course id.</p>
      )}
    </div>
  );
}
