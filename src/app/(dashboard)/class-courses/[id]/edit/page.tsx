import { BackLink } from "@/components/dashboard/BackLink";
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
      <BackLink
        href="/class-courses"
      >
        Back to class courses
      </BackLink>
      {Number.isInteger(classCourseId) && classCourseId > 0 ? (
        <ClassCourseForm classCourseId={classCourseId} />
      ) : (
        <p className="text-sm text-red-600">Invalid class course id.</p>
      )}
    </div>
  );
}
