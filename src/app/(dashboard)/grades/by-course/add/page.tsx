import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GradeByCourseForm } from "@/features/school/components/GradeByCourseForm";

type AddGradeByCoursePageProps = {
  searchParams: Promise<{
    yearId?: string;
    classId?: string;
    sectionId?: string;
    courseId?: string;
    gradeTypeId?: string;
  }>;
};

export default async function AddGradeByCoursePage({
  searchParams,
}: AddGradeByCoursePageProps) {
  const params = await searchParams;
  const isEdit =
    Number(params.sectionId) > 0 &&
    Number(params.courseId) > 0 &&
    Number(params.gradeTypeId) > 0;

  return (
    <div className="space-y-4">
      <Link
        href="/grades/by-course"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to grades by course
      </Link>
      <PageHeader
        title={isEdit ? "Edit grades by course" : "Add grades by course"}
        description="Select class, section, course, and grade type, then enter grades for students"
      />
      <GradeByCourseForm
        initialYearId={Number(params.yearId) || 0}
        initialClassId={Number(params.classId) || 0}
        initialSectionId={Number(params.sectionId) || 0}
        initialCourseId={Number(params.courseId) || 0}
        initialGradeTypeId={Number(params.gradeTypeId) || 0}
      />
    </div>
  );
}
