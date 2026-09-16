import { BackLink } from "@/components/dashboard/BackLink";
import { CourseForm } from "@/features/school/components/CourseForm";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = Number(id);

  return (
    <div className="space-y-4">
      <BackLink
        href="/courses"
      >
        Back to courses
      </BackLink>
      {Number.isInteger(courseId) && courseId > 0 ? (
        <CourseForm courseId={courseId} />
      ) : (
        <p className="text-sm text-red-600">Invalid course id.</p>
      )}
    </div>
  );
}
