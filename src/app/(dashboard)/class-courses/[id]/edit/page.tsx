import Link from "next/link";
import { ClassCourseForm } from "@/features/school/components/ClassCourseForm";

export default async function EditClassCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classCourseId = Number(id);

  return (
    <div className="space-y-4">
      <Link
        href="/class-courses"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to class courses
      </Link>
      {Number.isInteger(classCourseId) && classCourseId > 0 ? (
        <ClassCourseForm classCourseId={classCourseId} />
      ) : (
        <p className="text-sm text-red-600">Invalid class course id.</p>
      )}
    </div>
  );
}
