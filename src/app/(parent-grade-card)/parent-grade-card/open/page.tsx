import { ParentOpenGradeCard } from "@/features/school/components/ParentOpenGradeCard";

export default async function ParentOpenGradePage({
  searchParams,
}: {
  searchParams: Promise<{
    registrationId?: string;
    yearId?: string;
    classId?: string;
    sectionId?: string;
  }>;
}) {
  const params = await searchParams;
  const registrationId = Number(params.registrationId);
  const yearId = params.yearId ? Number(params.yearId) : undefined;
  const classId = params.classId ? Number(params.classId) : undefined;
  const sectionId = params.sectionId ? Number(params.sectionId) : undefined;

  const valid =
    Number.isInteger(registrationId) &&
    registrationId > 0 &&
    (yearId == null || (Number.isInteger(yearId) && yearId > 0)) &&
    (classId == null || (Number.isInteger(classId) && classId > 0)) &&
    (sectionId == null || (Number.isInteger(sectionId) && sectionId > 0));

  if (!valid) {
    return (
      <div className="grade-card-page">
        <p className="grade-card-loading text-red-600">
          Missing or invalid grade card parameters.
        </p>
      </div>
    );
  }

  return (
    <ParentOpenGradeCard
      registrationId={registrationId}
      yearId={yearId}
      classId={classId}
      sectionId={sectionId}
    />
  );
}
